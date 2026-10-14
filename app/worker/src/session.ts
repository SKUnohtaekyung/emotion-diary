// 로그인 cookie와 서버의 세션 기록(ARCHITECTURE §6, DATA_MODEL §3.10, D-112 ①③).
// 요청마다 ① 서명 ② 주체의 허용 목록 ③ 세션 기록이 살아 있는지 ④ 기한(마지막 발급에서 30일) ⑤ 잠김 여부를 본다.
import { AWAY_LOCK_MS, LOGIN_MAX_AGE_MS, MINUTE_MS, RENEW_AFTER_MS, SESSION_COOKIE } from "../../shared/api";
import { type Ctx, iso, type Session } from "./context";
import { hmacBase64Url, timingSafeEqual } from "./crypto";

const SID = /^[A-Za-z0-9_-]{16,64}$/;
export const SUBJECT = /^[a-z0-9-]{1,32}$/;
const MAX_AGE_SECONDS = LOGIN_MAX_AGE_MS / 1000;

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    if (part.slice(0, index).trim() === name) return part.slice(index + 1).trim();
  }
  return null;
}

const signed = (sid: string, subject: string, issuedAt: number) => `v1|${sid}|${subject}|${issuedAt}`;

/** cookie 값: v1.<세션 번호>.<주체>.<발급 ms>.<서명>(T3 A-17). 서명은 세션 서명 비밀값의 HMAC이다. */
export async function cookieValue(secret: string, sid: string, subject: string, issuedAt: number): Promise<string> {
  return `v1.${sid}.${subject}.${issuedAt}.${await hmacBase64Url(secret, signed(sid, subject, issuedAt))}`;
}

export const setSessionCookie = (value: string) =>
  `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}`;

export const clearSessionCookie = () => `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

interface CookieParts {
  sid: string;
  subject: string;
}

async function verifyCookie(secret: string, value: string): Promise<CookieParts | null> {
  const parts = value.split(".");
  if (parts.length !== 5 || parts[0] !== "v1") return null;
  const [, sid = "", subject = "", issuedAt = "", signature = ""] = parts;
  if (!SID.test(sid) || !SUBJECT.test(subject) || !/^[0-9]{1,16}$/.test(issuedAt)) return null;
  const expected = await hmacBase64Url(secret, signed(sid, subject, Number(issuedAt)));
  return timingSafeEqual(signature, expected) ? { sid, subject } : null;
}

interface SessionRow {
  subject: string;
  key_login_at: string;
  issued_at: string;
  last_active_at: string;
  locked: number;
  lock_on: number;
  has_name: number;
}

/**
 * cookie에서 세션을 찾는다. 서명이 맞아도 기록이 없거나(로그아웃한 cookie의 사본), 주체가 허용 목록 밖이거나,
 * 마지막 발급에서 30일이 지났으면 null이다. 기한이 지난 기록은 이때 지운다.
 * 기한은 cookie가 아니라 서버 기록의 마지막 발급 시각으로 잰다 — cookie 사본끼리 엇갈려도 끊기지 않게(T3 A-17).
 */
export async function loadSession(ctx: Ctx): Promise<Session | null> {
  const value = readCookie(ctx.request, SESSION_COOKIE);
  if (!value) return null;
  const parts = await verifyCookie(ctx.secrets.sessionSecret, value);
  if (!parts || !ctx.allowlist.has(parts.subject)) return null;
  const row = await ctx.env.DB.prepare(
    `SELECT s.subject, s.key_login_at, s.issued_at, s.last_active_at, s.locked,
            (o.app_lock_hash IS NOT NULL) AS lock_on, (o.display_name IS NOT NULL) AS has_name
       FROM sessions s LEFT JOIN owner_settings o ON o.owner_key = s.subject
      WHERE s.id = ?1`
  )
    .bind(parts.sid)
    .first<SessionRow>();
  if (!row || row.subject !== parts.subject) return null;
  const issuedAt = Date.parse(row.issued_at);
  if (!(ctx.now - issuedAt < LOGIN_MAX_AGE_MS)) {
    await ctx.env.DB.prepare("DELETE FROM sessions WHERE id = ?1").bind(parts.sid).run();
    return null;
  }
  return {
    id: parts.sid,
    owner: row.subject,
    keyLoginAt: Date.parse(row.key_login_at),
    issuedAt,
    lastActiveAt: Date.parse(row.last_active_at),
    locked: row.locked === 1,
    lockOn: row.lock_on === 1,
    hasName: row.has_name === 1
  };
}

const minuteOf = (ms: number) => Math.floor(ms / MINUTE_MS);

/**
 * 로그인한 요청마다 부른다. 잠김을 판정하고(잠금을 켠 owner의 세션에서 마지막 활동 뒤 5분이 넘었으면 잠김),
 * 잠기지 않았으면 마지막 활동 시각을 분이 바뀌었을 때만 쓰며(DATA_MODEL §3.10 — 판정 오차 1분),
 * 마지막 발급에서 하루가 넘었으면 cookie를 다시 발급한다(연장, D-112 ①). 잠긴 세션도 연장은 한다 — 유효한 요청이다.
 */
export async function touchSession(ctx: Ctx, session: Session): Promise<void> {
  const locked = session.lockOn && (session.locked || ctx.now - session.lastActiveAt > AWAY_LOCK_MS);
  const lastActiveAt = !locked && minuteOf(ctx.now) !== minuteOf(session.lastActiveAt) ? ctx.now : session.lastActiveAt;
  const renew = ctx.now - session.issuedAt > RENEW_AFTER_MS;
  const issuedAt = renew ? ctx.now : session.issuedAt;
  if (locked !== session.locked || lastActiveAt !== session.lastActiveAt || renew) {
    // 이 요청이 행을 읽은 뒤 다른 요청(지금 잠그기 등)이 먼저 썼을 수 있다. 활동 갱신은 잠금을 **풀지 못한다** —
    // locked는 MAX로만 올리고, 시각들도 뒤로 돌리지 않는다(같은 ISO 형식이라 문자열 비교가 시각 비교다). 푸는 것은 unlock·끄기뿐이다.
    await ctx.env.DB.prepare(
      `UPDATE sessions SET locked = MAX(locked, ?2), last_active_at = MAX(last_active_at, ?3), issued_at = MAX(issued_at, ?4)
        WHERE id = ?1`
    )
      .bind(session.id, locked ? 1 : 0, iso(lastActiveAt), iso(issuedAt))
      .run();
  }
  if (renew) ctx.setCookie = setSessionCookie(await cookieValue(ctx.secrets.sessionSecret, session.id, session.owner, issuedAt));
  session.locked = locked;
  session.lastActiveAt = lastActiveAt;
  session.issuedAt = issuedAt;
}
