// 일기 요청(ARCHITECTURE §5, app/shared/diary.ts). 시간대 머리글은 늘, 영수증 열쇠는 바꾸는 요청에 붙인다.
// 다시 보낼 때는 부른 쪽이 같은 열쇠를 넘긴다(ARCHITECTURE §4.1) — 여기서 열쇠를 만들지 않는다.

import { API, diaryCompletePath, diaryPath, IDEMPOTENCY_HEADER, TIMEZONE_HEADER } from "../../../shared/api";
import type { DiaryEntryView, DiaryInput, DiaryMeta, TodayInfo } from "../../../shared/diary";
import { type ApiResult, request } from "../lib/api";

/** 요청 하나가 기다리는 최대 시간. 넘기면 연결 끊김과 같이 다루고 같은 열쇠로 다시 보낸다. */
export const SAVE_TIMEOUT_MS = 15_000;

/** 이 휴대폰의 시간대(IANA 이름). '오늘'은 서버가 이 값과 하루 기준 시각으로 센다(DATA_MODEL §2). */
export function timeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

const zoneHeader = () => ({ [TIMEZONE_HEADER]: timeZone() });

export function newRequestKey(): string {
  return crypto.randomUUID();
}

export function fetchToday(): Promise<ApiResult<TodayInfo>> {
  return request<TodayInfo>("GET", API.today, { headers: zoneHeader(), timeoutMs: SAVE_TIMEOUT_MS });
}

export function fetchDiary(date: string): Promise<ApiResult<DiaryEntryView>> {
  return request<DiaryEntryView>("GET", diaryPath(date), { timeoutMs: SAVE_TIMEOUT_MS });
}

export function putDiary(date: string, body: DiaryInput, key: string): Promise<ApiResult<DiaryMeta>> {
  return request<DiaryMeta>("PUT", diaryPath(date), {
    body,
    headers: { ...zoneHeader(), [IDEMPOTENCY_HEADER]: key },
    timeoutMs: SAVE_TIMEOUT_MS
  });
}

export function completeDiaryRequest(date: string, revision: number, key: string): Promise<ApiResult<DiaryMeta>> {
  return request<DiaryMeta>("POST", diaryCompletePath(date), {
    body: { revision },
    headers: { ...zoneHeader(), [IDEMPOTENCY_HEADER]: key },
    timeoutMs: SAVE_TIMEOUT_MS
  });
}

export function deleteDiaryRequest(date: string, revision: number, key: string): Promise<ApiResult<{ deleted: true; entryDate: string }>> {
  return request("DELETE", diaryPath(date), {
    body: { revision },
    headers: { [IDEMPOTENCY_HEADER]: key },
    timeoutMs: SAVE_TIMEOUT_MS
  });
}
