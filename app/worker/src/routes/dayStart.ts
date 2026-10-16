// 하루 기준 시각(D-081, DATA_MODEL §2·§3.4, TASK-DATA-01 S-4). 0~6시, 기본 4시. 바꾸는 화면은 direct-journal에서 붙인다.
// 바꿔도 이미 저장된 일기의 날짜는 다시 세지 않는다 — 새로 만드는 기록·최초 완료일·오늘 화면만 새 값을 쓴다(F-17).
import { isDayStartHour } from "../../../shared/diary";
import { type Ctx, iso, type Session } from "../context";
import { fail, json } from "../http";
import { readJson } from "../request";

export async function getDayStart(ctx: Ctx): Promise<Response> {
  const session = ctx.session as Session;
  return json(200, { dayStartHour: session.dayStartHour });
}

/** `PUT /api/settings/day-start` — 본문 `{ dayStartHour }`. 같은 값을 다시 보내도 같은 결과다(재시도에 안전). */
export async function putDayStart(ctx: Ctx): Promise<Response> {
  const session = ctx.session as Session;
  const body = await readJson(ctx.request);
  if (body instanceof Response) return body;
  if (Object.keys(body).length !== 1 || !("dayStartHour" in body)) return fail(400, "invalid_body", { field: "dayStartHour" });
  if (!isDayStartHour(body.dayStartHour)) return fail(422, "invalid_day_start");
  const t = iso(ctx.now);
  await ctx.env.DB.prepare(
    `INSERT INTO owner_settings (owner_key, day_start_hour, created_at, updated_at) VALUES (?1, ?2, ?3, ?3)
     ON CONFLICT(owner_key) DO UPDATE SET day_start_hour = excluded.day_start_hour, updated_at = excluded.updated_at`
  )
    .bind(session.owner, body.dayStartHour, t)
    .run();
  return json(200, { dayStartHour: body.dayStartHour });
}
