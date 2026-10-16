// 내 기록 내보내기·모든 기록 지우기 요청(UX_SPEC §13, ARCHITECTURE §4.1). 시간대 머리글은 늘 싣는다.
// 받은 내보내기 파일은 화면 변수에만 두고 어디에도 남기지 않는다 — 이 모듈도 받아서 돌려줄 뿐이다.

import { API, DELETE_ALL_CONFIRM, TIMEZONE_HEADER } from "../../../shared/api";
import {
  type DeleteAllInput,
  type DiaryEntryView,
  EXPORT_SCHEMA_VERSION,
  type ExportFile,
  type ExportPage,
  exportFileName,
  isIsoDate,
  localDayAt
} from "../../../shared/diary";
import { type ApiResult, request } from "../lib/api";
import { timeZone } from "./api";

/** 조각 하나가 기다리는 최대 시간. 넘기면 연결 끊김과 같이 다룬다. */
export const EXPORT_TIMEOUT_MS = 30_000;
/** 지우기는 서버가 여러 표를 한꺼번에 비운다 — 넉넉히 기다린다. */
export const DELETE_ALL_TIMEOUT_MS = 30_000;
/** 서버가 잘못 되돌려 끝나지 않는 일을 막는 상한. 조각은 100편이라 이만큼이면 하루 한 편씩 쓴 50년을 넘는다. */
export const EXPORT_MAX_PAGES = 200;

const serverFailure = <T>(): ApiResult<T> => ({ ok: false, status: 500, code: null, retryAfter: null, remaining: null, offline: false });

/** 응답이 내보내기 조각의 모양인가. 가짜 접속 화면이 200으로 준 글 같은 것을 파일로 만들지 않는다. */
function isExportPage(value: unknown): value is ExportPage {
  if (typeof value !== "object" || value === null) return false;
  const page = value as Partial<ExportPage>;
  return (
    page.schemaVersion === EXPORT_SCHEMA_VERSION &&
    typeof page.exportedAt === "string" &&
    Number.isFinite(Date.parse(page.exportedAt)) &&
    typeof page.timezone === "string" &&
    typeof page.dayStartHour === "number" &&
    (page.displayName === null || typeof page.displayName === "string") &&
    Array.isArray(page.diaries) &&
    // 다음 조각이 있는지 말하는 칸이 없으면 끝까지 받았는지 알 수 없다 — 잘린 파일을 만들지 않는다
    (page.next === null || typeof page.next === "string")
  );
}

/** 내보낸 날(기기 시간대·하루 기준 시각으로 센 날)을 붙인 파일 이름. 시간대 이름이 잘못되어 셀 수 없으면 null. */
export function exportNameOf(file: ExportFile): string | null {
  try {
    return exportFileName(localDayAt(Date.parse(file.exportedAt), file.timezone, file.dayStartHour));
  } catch {
    return null;
  }
}

const exportPath = (after: string | null): string => (after === null ? API.export : `${API.export}?after=${encodeURIComponent(after)}`);

/**
 * `GET /api/export`를 `next`가 없을 때까지 `?after=`로 이어 받아 파일 하나로 붙인다.
 * 칸(이름·시각·시간대·하루 기준 시각)은 첫 조각의 것이고 기록만 모든 조각을 순서대로 잇는다. `next`는 파일에 넣지 않는다.
 * 어느 조각이든 실패하거나 모양이 다르면 실패다(일부만 담긴 파일을 만들지 않는다).
 */
export async function fetchExport(): Promise<ApiResult<ExportFile>> {
  const headers = { [TIMEZONE_HEADER]: timeZone() };
  let first: ExportPage | null = null;
  const diaries: DiaryEntryView[] = [];
  let after: string | null = null;

  for (let pages = 0; pages < EXPORT_MAX_PAGES; pages += 1) {
    const result: ApiResult<ExportPage> = await request<ExportPage>("GET", exportPath(after), { headers, timeoutMs: EXPORT_TIMEOUT_MS });
    if (!result.ok) return result;
    const page: unknown = result.data;
    if (!isExportPage(page)) return serverFailure();
    first ??= page;
    diaries.push(...page.diaries);

    if (page.next === null) {
      const file: ExportFile = {
        schemaVersion: first.schemaVersion,
        exportedAt: first.exportedAt,
        timezone: first.timezone,
        dayStartHour: first.dayStartHour,
        displayName: first.displayName,
        diaries
      };
      return exportNameOf(file) === null ? serverFailure() : { ok: true, status: 200, data: file };
    }
    // 다음 시작점은 날짜여야 하고 앞으로만 나아간다 — 같은 곳을 되풀이하는 서버에 붙들리지 않는다
    if (!isIsoDate(page.next) || (after !== null && page.next <= after)) return serverFailure();
    after = page.next;
  }
  return serverFailure();
}

/** `DELETE /api/diaries`. 앱 잠금을 켰으면 지금 비밀번호(pin)를 함께 보낸다. */
export function deleteAllRequest(pin?: string): Promise<ApiResult<{ deleted: true }>> {
  const body: DeleteAllInput = pin === undefined ? { confirm: DELETE_ALL_CONFIRM } : { confirm: DELETE_ALL_CONFIRM, pin };
  return request("DELETE", API.diaries, { body, timeoutMs: DELETE_ALL_TIMEOUT_MS });
}
