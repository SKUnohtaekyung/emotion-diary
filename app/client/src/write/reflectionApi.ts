// 돌아보기의 읽기 요청(TASK-REFLECT-01 A-7) — 달력의 한 달, 통계 재료. 둘 다 시간대 머리글이 있어야 서버가 '오늘'을 센다.

import { calendarPath, statsPath, TIMEZONE_HEADER } from "../../../shared/api";
import type { CalendarMonth } from "../../../shared/diary";
import type { StatsMaterial, StatsPeriod } from "../../../shared/stats";
import { type ApiResult, request } from "../lib/api";
import { SAVE_TIMEOUT_MS, timeZone } from "./api";

export function fetchCalendarMonth(month: string): Promise<ApiResult<CalendarMonth>> {
  return request<CalendarMonth>("GET", calendarPath(month), { headers: { [TIMEZONE_HEADER]: timeZone() }, timeoutMs: SAVE_TIMEOUT_MS });
}

export function fetchStatsMaterial(days: StatsPeriod): Promise<ApiResult<StatsMaterial>> {
  return request<StatsMaterial>("GET", statsPath(days), { headers: { [TIMEZONE_HEADER]: timeZone() }, timeoutMs: SAVE_TIMEOUT_MS });
}
