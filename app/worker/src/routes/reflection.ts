// 돌아보기의 읽기 경로 둘(TASK-REFLECT-01 A-7, D-129). 둘 다 글을 싣지 않는다 — 달력은 날짜·상태만, 통계는 완료 기록의 세부 감정·크기만.
// 주인은 세션에서만 얻고(ARCHITECTURE §6), '오늘'은 휴대폰이 보낸 시간대와 owner의 하루 기준 시각으로 서버가 센다(GET /api/today와 같은 규칙).
// 계산은 하지 않는다 — app/shared/stats.ts가 기기에서 한다(A-6). 그래서 이 파일은 고르고 모으기만 한다.

import { TIMEZONE_HEADER } from "../../../shared/api";
import { type CalendarDay, type CalendarMonth, canonicalTimeZone, isIsoMonth, localDayAt } from "../../../shared/diary";
import { isStatsPeriod, periodRange, STREAK_LOOKBACK, type StatEntry, type StatsMaterial } from "../../../shared/stats";
import type { Ctx, Session } from "../context";
import { fail, json } from "../http";

function today(ctx: Ctx, session: Session): string | null {
  const timeZone = canonicalTimeZone(ctx.request.headers.get(TIMEZONE_HEADER));
  return timeZone ? localDayAt(ctx.now, timeZone, session.dayStartHour) : null;
}

/** `GET /api/calendar/:month` — 그 달에 기록이 있는 날의 상태(완료·쓰던 글). 미래 달도 400이 아니라 빈 목록이다(화면이 넘기기를 막는다). */
export async function getCalendarMonth(ctx: Ctx): Promise<Response> {
  const session = ctx.session as Session;
  const month = ctx.params.month;
  if (!isIsoMonth(month)) return fail(400, "invalid_month");
  const now = today(ctx, session);
  if (!now) return fail(400, "invalid_timezone");
  const result = await ctx.env.DB.prepare(
    "SELECT entry_date AS date, status FROM diary_entries WHERE owner_key = ?1 AND entry_date BETWEEN ?2 AND ?3 ORDER BY entry_date"
  )
    .bind(session.owner, `${month}-01`, `${month}-31`)
    .all<CalendarDay>();
  const body: CalendarMonth = { month, today: now, days: result.results ?? [] };
  return json(200, body);
}

export interface EmotionRow {
  date: string;
  code: string;
  category: string;
  intensity: number;
}

/** `GET /api/stats/:days` — 이번 기간 + 바로 앞 같은 길이 기간의 완료 기록(세부 감정·크기)과, 이어서 쓴 날을 셀 첫 완료 날짜(최근부터). */
export async function getStatsMaterial(ctx: Ctx): Promise<Response> {
  const session = ctx.session as Session;
  // 글자 그대로 "7"·"30"만 받는다("07"·"7.0"은 400) — 같은 기간의 주소가 하나로 정해진다
  const raw = ctx.params.days ?? "";
  const days = Number(raw);
  if (String(days) !== raw || !isStatsPeriod(days)) return fail(400, "invalid_period");
  const now = today(ctx, session);
  if (!now) return fail(400, "invalid_timezone");
  const range = periodRange(now, days);
  const db = ctx.env.DB;
  const [entries, emotions, firsts] = await db.batch([
    db
      .prepare("SELECT entry_date AS date FROM diary_entries WHERE owner_key = ?1 AND status = 'completed' AND entry_date BETWEEN ?2 AND ?3 ORDER BY entry_date")
      .bind(session.owner, range.prevFrom, range.to),
    db
      .prepare(
        `SELECT d.entry_date AS date, e.emotion_code AS code, e.category_code AS category, e.intensity AS intensity
           FROM diary_emotions AS e JOIN diary_entries AS d ON d.id = e.diary_id
          WHERE d.owner_key = ?1 AND d.status = 'completed' AND d.entry_date BETWEEN ?2 AND ?3
          ORDER BY d.entry_date, e.display_order`
      )
      .bind(session.owner, range.prevFrom, range.to),
    // 이어서 쓴 날: 첫 완료 날짜(뒤늦게 마무리한 지난 날은 그 날짜가 아니라 마무리한 날로 남는다 — DATA_MODEL §7). 오늘 뒤는 없다.
    // 지금 완료 상태인 기록만 센다 — 완료를 취소한 기록(direct-journal)은 통계에서 빠지는 것과 같게.
    db
      .prepare(
        `SELECT DISTINCT first_completed_local_date AS date FROM diary_entries
          WHERE owner_key = ?1 AND status = 'completed' AND first_completed_local_date IS NOT NULL AND first_completed_local_date <= ?2
          ORDER BY first_completed_local_date DESC LIMIT ?3`
      )
      .bind(session.owner, now, STREAK_LOOKBACK)
  ]);
  const body = assembleStats(
    now,
    days,
    (entries?.results ?? []) as Array<{ date: string }>,
    (emotions?.results ?? []) as EmotionRow[],
    (firsts?.results ?? []) as Array<{ date: string }>
  );
  return json(200, body);
}

/** D1이 돌려준 행 → 재료. Worker 안에서 실제로 도는 일이라 따로 떼어 CPU를 잰다(시험 stats-cpu). */
export function assembleStats(today: string, days: StatsMaterial["days"], entries: Array<{ date: string }>, emotions: EmotionRow[], firsts: Array<{ date: string }>): StatsMaterial {
  const byDate = new Map<string, StatEntry>();
  for (const row of entries) byDate.set(row.date, { date: row.date, emotions: [] });
  for (const row of emotions) byDate.get(row.date)?.emotions.push({ code: row.code, category: row.category, intensity: row.intensity });
  return { today, days, entries: [...byDate.values()], firstCompletedDates: firsts.map((row) => row.date) };
}
