// 앱 잠금 비밀번호(D-106, D-112 ③⑧, ARCHITECTURE §5·§6, DATA_MODEL §3.4).
// 비밀번호는 본문으로만 받고 서버 비밀값을 섞은 해시로만 둔다. 네 자리라 느린 해시는 지켜 주지 못한다 —
// 실제 방어는 서버가 세는 횟수다(다섯 번 틀리면 30초). 잠금 상태는 세션(기기)마다다.
import { isPin, KEY_LOGIN_GRACE_MS, PIN_MAX_WRONG, PIN_REST_MS } from "../../../shared/api";
import { type Ctx, iso, type Session } from "../context";
import { hmacHex, timingSafeEqual } from "../crypto";
import { empty, fail, json } from "../http";
import { readJson } from "../request";
import { liveSession } from "../session";

const pinHash = (ctx: Ctx, owner: string, pin: string) => hmacHex(ctx.secrets.appLockSecret, `${owner}:${pin}`);

const retryAfterSeconds = (until: number, now: number) => Math.max(1, Math.ceil((until - now) / 1000));

/**
 * 지금 비밀번호를 대조한다. 맞으면 null, 아니면 보낼 응답.
 * 대조하기 전에 시도 한 번을 먼저 예약한다(조건부 UPDATE … RETURNING) — 요청을 한꺼번에 여럿 보내도
 * 쉬기 전까지 다섯 번 넘게 맞혀 볼 수 없다. 화면을 새로 열거나 요청을 직접 보내도 같은 카운터다(F-23).
 */
export async function verifyPin(ctx: Ctx, owner: string, pin: string): Promise<Response | null> {
  const db = ctx.env.DB;
  const now = ctx.now;
  const reserved = await db
    .prepare(
      `UPDATE owner_settings
          SET app_lock_fail_count = app_lock_fail_count + 1, app_lock_retry_at = NULL
        WHERE owner_key = ?1 AND app_lock_hash IS NOT NULL
          AND (app_lock_retry_at IS NULL OR app_lock_retry_at <= ?2)
          AND app_lock_fail_count < ?3
        RETURNING app_lock_fail_count, app_lock_hash`
    )
    .bind(owner, iso(now), PIN_MAX_WRONG)
    .first<{ app_lock_fail_count: number; app_lock_hash: string }>();
  if (!reserved) {
    const row = await db
      .prepare("SELECT app_lock_hash, app_lock_retry_at FROM owner_settings WHERE owner_key = ?1")
      .bind(owner)
      .first<{ app_lock_hash: string | null; app_lock_retry_at: string | null }>();
    if (!row?.app_lock_hash) return fail(409, "app_lock_off");
    const until = row.app_lock_retry_at ? Date.parse(row.app_lock_retry_at) : now + PIN_REST_MS;
    return fail(429, "pin_resting", { retryAfter: retryAfterSeconds(until, now) });
  }
  if (timingSafeEqual(await pinHash(ctx, owner, pin), reserved.app_lock_hash)) {
    await db.prepare("UPDATE owner_settings SET app_lock_fail_count = 0, app_lock_retry_at = NULL WHERE owner_key = ?1").bind(owner).run();
    return null;
  }
  if (reserved.app_lock_fail_count >= PIN_MAX_WRONG) {
    const until = now + PIN_REST_MS;
    await db
      .prepare("UPDATE owner_settings SET app_lock_fail_count = 0, app_lock_retry_at = ?2 WHERE owner_key = ?1")
      .bind(owner, iso(until))
      .run();
    return fail(429, "pin_resting", { retryAfter: retryAfterSeconds(until, now) });
  }
  return fail(422, "wrong_pin", { remaining: PIN_MAX_WRONG - reserved.app_lock_fail_count });
}

async function lockIsOn(ctx: Ctx, owner: string): Promise<boolean> {
  const row = await ctx.env.DB.prepare("SELECT app_lock_hash FROM owner_settings WHERE owner_key = ?1")
    .bind(owner)
    .first<{ app_lock_hash: string | null }>();
  return Boolean(row?.app_lock_hash);
}

/**
 * 이미 걸린 잠금을 바꾸거나 끌 때의 본인 확인. 열쇠로 로그인한 지 10분 안이면 묻지 않는다('잊었어요' 길 — D-112 ⑧).
 * 그 밖에는 지금 비밀번호가 맞아야 한다.
 */
async function authorizeChange(ctx: Ctx, session: Session, currentPin: unknown): Promise<Response | null> {
  if (!(await lockIsOn(ctx, session.owner))) return null;
  if (ctx.now - session.keyLoginAt <= KEY_LOGIN_GRACE_MS) return null;
  if (!isPin(currentPin)) return fail(422, "pin_required");
  return verifyPin(ctx, session.owner, currentPin);
}

/** `PUT /api/app-lock` — 정하기·바꾸기. 본문 `{ pin, currentPin? }`. */
export async function setAppLock(ctx: Ctx): Promise<Response> {
  const session = ctx.session as Session;
  const body = await readJson(ctx.request);
  if (body instanceof Response) return body;
  if (!isPin(body.pin)) return fail(422, "invalid_pin");
  const denied = await authorizeChange(ctx, session, body.currentPin);
  if (denied) return denied;
  const t = iso(ctx.now);
  const results = await ctx.env.DB.batch([
    // 모든 기록 지우기 뒤에 들어온 묵은 요청은 잠금 설정을 되살리지 못한다(liveSession — 마이그레이션 0008)
    ctx.env.DB.prepare(
      `INSERT INTO owner_settings (owner_key, app_lock_hash, app_lock_fail_count, app_lock_retry_at, created_at, updated_at)
       SELECT ?1, ?2, 0, NULL, ?3, ?3 WHERE ${liveSession(4, 5)}
       ON CONFLICT(owner_key) DO UPDATE SET app_lock_hash = excluded.app_lock_hash, app_lock_fail_count = 0,
         app_lock_retry_at = NULL, updated_at = excluded.updated_at`
    ).bind(session.owner, await pinHash(ctx, session.owner, body.pin), t, session.id, session.dataEpoch),
    // 정한 이 기기는 지금부터 5분 규칙을 다시 잰다.
    ctx.env.DB.prepare("UPDATE sessions SET locked = 0, last_active_at = ?2 WHERE id = ?1").bind(session.id, t)
  ]);
  if (!results[0]?.meta.changes) return fail(401, "unauthorized");
  return json(200, { appLock: true });
}

/** `DELETE /api/app-lock` — 끄기. 본문 `{ currentPin? }`(없어도 된다). 이미 꺼져 있으면 그대로 200(재시도에 안전). 모든 세션의 잠김을 푼다. */
export async function clearAppLock(ctx: Ctx): Promise<Response> {
  const session = ctx.session as Session;
  const body = await readJson(ctx.request);
  if (body instanceof Response) return body;
  const denied = await authorizeChange(ctx, session, body.currentPin);
  if (denied) return denied;
  await ctx.env.DB.batch([
    ctx.env.DB.prepare(
      "UPDATE owner_settings SET app_lock_hash = NULL, app_lock_fail_count = 0, app_lock_retry_at = NULL, updated_at = ?2 WHERE owner_key = ?1"
    ).bind(session.owner, iso(ctx.now)),
    ctx.env.DB.prepare("UPDATE sessions SET locked = 0 WHERE subject = ?1").bind(session.owner)
  ]);
  return json(200, { appLock: false });
}

/** `POST /api/app-lock/unlock` — 이 세션의 잠금을 비밀번호로 푼다(잠긴 세션이 부를 수 있는 넷 가운데 하나). */
export async function unlock(ctx: Ctx): Promise<Response> {
  const session = ctx.session as Session;
  const body = await readJson(ctx.request);
  if (body instanceof Response) return body;
  if (!isPin(body.pin)) return fail(422, "invalid_pin");
  const denied = await verifyPin(ctx, session.owner, body.pin);
  if (denied) return denied;
  await ctx.env.DB.prepare("UPDATE sessions SET locked = 0, last_active_at = ?2 WHERE id = ?1").bind(session.id, iso(ctx.now)).run();
  return json(200, { locked: false });
}

/** `POST /api/app-lock/lock` — 이 세션을 지금 잠근다. 더 잠기는 쪽이라 비밀번호 없이 받는다. 잠그기만 하고 풀지는 못한다. */
export async function lockNow(ctx: Ctx): Promise<Response> {
  const session = ctx.session as Session;
  if (!(await lockIsOn(ctx, session.owner))) return fail(409, "app_lock_off");
  await ctx.env.DB.prepare("UPDATE sessions SET locked = 1 WHERE id = ?1").bind(session.id).run();
  return empty(204);
}
