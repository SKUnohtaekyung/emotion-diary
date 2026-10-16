// 로그인 상태·로그인·로그아웃·화면 신호(ARCHITECTURE §5·§6, DATA_MODEL §3.9·§3.10).
import { API_COMPAT, KEY_FAIL_MAX, KEY_FAIL_WINDOW_MS, KEY_LOCK_MS, KEY_MAX_LENGTH, LOGIN_MAX_AGE_MS, type SessionInfo } from "../../../shared/api";
import { type Ctx, iso } from "../context";
import { hmacHex, randomId, timingSafeEqual } from "../crypto";
import { empty, fail, json } from "../http";
import { readJson } from "../request";
import { clearSessionCookie, cookieValue, loadSession, SUBJECT, setSessionCookie } from "../session";

/** `GET /api/session`. 로그인 전에는 배포 모드와 빌드만 — 잠금 여부를 포함해 owner의 어떤 설정도 알리지 않는다. */
export async function sessionInfo(ctx: Ctx): Promise<Response> {
  const base = { env: ctx.config.appEnv, build: ctx.config.build, compat: API_COMPAT };
  const session = ctx.session;
  if (!session) return json(200, { authenticated: false, ...base } satisfies SessionInfo);
  return json(200, {
    authenticated: true,
    ...base,
    locked: session.locked,
    appLock: session.lockOn,
    hasName: session.hasName
  } satisfies SessionInfo);
}

const retryAfterSeconds = (until: number, now: number) => Math.max(1, Math.ceil((until - now) / 1000));

/**
 * `POST /api/session` — 접근 열쇠를 본문으로 받아 대조한다(주소로는 받지 않는다).
 * **맞는 열쇠는 잠금과 상관없이 들어온다**(RK-041, 감리 REPORT §5.2) — 주소만 아는 누군가가 틀린 열쇠를 되풀이해 주인을 내쫓지 못하게.
 * 열쇠는 맞혀 볼 수 없는 길이라(무작위 12자 이상) 잠금이 실제로 막던 것은 주인뿐이었다. 틀린 열쇠는 전역 카운터(auth_failures 1행)로
 * 센다: 60초 창에서 10번이면 5분 동안 틀린 열쇠에 429. 잠긴 동안의 틀린 시도는 잠금을 늘리지 않는다. 대조는 상수 시간이다.
 */
export async function login(ctx: Ctx): Promise<Response> {
  const body = await readJson(ctx.request);
  if (body instanceof Response) return body;
  const key = body.key;
  if (typeof key !== "string" || key.length === 0 || key.length > KEY_MAX_LENGTH) return fail(400, "invalid_body");
  // 설정이 틀렸으면 열쇠를 대조하기 전에 멈춘다 — 시도 횟수를 쓰지 않고, 맞는 열쇠로 들어와도 만들 세션이 없다.
  const subject = ctx.env.OWNER_SUBJECT;
  if (!SUBJECT.test(subject) || !ctx.allowlist.has(subject)) return fail(500, "server_misconfigured");

  const db = ctx.env.DB;
  const now = ctx.now;
  const given = await hmacHex(ctx.secrets.accessKeySalt, key);
  if (!timingSafeEqual(given, ctx.secrets.accessKeyHash)) {
    // 틀린 시도 하나를 센다(한 문장 — 동시에 온 틀린 시도도 하나씩 센다). 잠긴 동안에는 쓰지 않는다 — 문장이 0행이고,
    // 남은 시간만 읽어 알린다(틀린 열쇠를 퍼부어도 D1 쓰기 한도를 쓰지 않게 — 2026-10-16 마감 검토 M-1).
    const counted = await db
      .prepare(
        `UPDATE auth_failures SET
           fail_count = CASE WHEN window_start IS NULL OR window_start <= ?2 THEN 1 ELSE fail_count + 1 END,
           window_start = CASE WHEN window_start IS NULL OR window_start <= ?2 THEN ?1 ELSE window_start END,
           locked_until = CASE WHEN (CASE WHEN window_start IS NULL OR window_start <= ?2 THEN 1 ELSE fail_count + 1 END) >= ?3 THEN ?4 ELSE NULL END
         WHERE id = 1 AND (locked_until IS NULL OR locked_until <= ?1)
         RETURNING locked_until`
      )
      .bind(iso(now), iso(now - KEY_FAIL_WINDOW_MS), KEY_FAIL_MAX, iso(now + KEY_LOCK_MS))
      .first<{ locked_until: string | null }>();
    let lockedUntil = counted?.locked_until ?? null;
    if (!counted) {
      const row = await db.prepare("SELECT locked_until FROM auth_failures WHERE id = 1").first<{ locked_until: string | null }>();
      if (!row) return fail(500, "server_misconfigured"); // 마이그레이션 0001이 넣는 행이 없다 — '잠김'으로 오해하게 두지 않는다
      lockedUntil = row.locked_until;
    }
    if (lockedUntil && Date.parse(lockedUntil) > now) return fail(429, "key_locked", { retryAfter: retryAfterSeconds(Date.parse(lockedUntil), now) });
    return fail(401, "invalid_key");
  }

  // 이미 이 기기에 세션이 있으면 그 기록을 지우고 새로 만든다. 기한이 지난 기록도 함께 지운다(DATA_MODEL §3.10 '정리').
  const previous = await loadSession(ctx);
  const sid = randomId();
  const t = iso(now);
  const statements = [
    db.prepare("UPDATE auth_failures SET fail_count = 0, window_start = NULL, locked_until = NULL WHERE id = 1"),
    db.prepare("DELETE FROM sessions WHERE issued_at <= ?1").bind(iso(now - LOGIN_MAX_AGE_MS)),
    db
      .prepare("INSERT INTO sessions (id, subject, key_login_at, issued_at, last_active_at, locked) VALUES (?1, ?2, ?3, ?3, ?3, 0)")
      .bind(sid, subject, t)
  ];
  if (previous) statements.push(db.prepare("DELETE FROM sessions WHERE id = ?1").bind(previous.id));
  await db.batch(statements);
  return json(200, { ok: true }, { "set-cookie": setSessionCookie(await cookieValue(ctx.secrets.sessionSecret, sid, subject, now)) });
}

/** `DELETE /api/session` — 이 기기의 cookie와 서버의 그 세션 기록을 지운다. 지운 cookie의 사본으로는 다시 들어올 수 없다(F-22). */
export async function logout(ctx: Ctx): Promise<Response> {
  const session = ctx.session;
  if (session) await ctx.env.DB.prepare("DELETE FROM sessions WHERE id = ?1").bind(session.id).run();
  // 같은 요청에서 연장 cookie를 만들었더라도 해제 cookie로 바꿔 싣는다(app.ts가 ctx.setCookie를 응답에 붙인다).
  ctx.setCookie = clearSessionCookie();
  return json(200, { ok: true });
}

/** `POST /api/session/heartbeat` — 화면이 보이는 동안 1분마다. 활동 기록은 app.ts의 touchSession이 이미 했고, 잠긴 세션은 여기까지 오지 못한다(423). */
export async function heartbeat(): Promise<Response> {
  return empty(204);
}
