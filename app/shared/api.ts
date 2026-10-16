// 서버와 화면이 함께 쓰는 API 계약(ARCHITECTURE §5·§6, DATA_MODEL §3.4·§3.9·§3.10, D-112·D-115).
// 여기 값이 바뀌면 두 쪽이 같은 변경에서 함께 바뀐다. 개발용 전용 계약은 ./dev.ts에 따로 둔다 —
// 이 파일은 운영 묶음에도 들어가므로 개발용 경로 이름을 여기에 두지 않는다(D-115 ②). 일기 저장의 모양·검사는 ./diary.ts.
import type { MissingStep } from "./diary";

/** API 호환 단계. 서버와 화면이 서로를 이해하지 못하게 바뀔 때만 1 올린다(D-115 ④). */
export const API_COMPAT = 1;

/** 변경 요청(POST·PUT·DELETE)에 붙이는 표식(D-025, ARCHITECTURE §5). 없으면 403. */
export const CSRF_HEADER = "x-requested-with";
export const CSRF_VALUE = "emotion-diary";

/** 로그인 cookie. `__Host-` 접두어는 브라우저가 Secure·Path=/·Domain 없음을 강제한다(T3 A-17). */
export const SESSION_COOKIE = "__Host-session";

export const MINUTE_MS = 60_000;
export const DAY_MS = 24 * 60 * MINUTE_MS;

/** 로그인은 마지막으로 쓴 날부터 30일(D-112 ①). 하루가 넘은 유효한 요청에서 다시 발급한다. */
export const LOGIN_MAX_AGE_MS = 30 * DAY_MS;
export const RENEW_AFTER_MS = DAY_MS;

/** 접근 열쇠로 로그인한 지 10분 안이면 지금 비밀번호 없이 앱 잠금을 새로 정하거나 끈다(D-112 ⑧, D-106 ⑤). */
export const KEY_LOGIN_GRACE_MS = 10 * MINUTE_MS;

/** 화면이 보이는 동안의 신호 간격과, 신호가 끊긴 뒤 잠기기까지(D-106 ③, ARCHITECTURE §6). */
export const HEARTBEAT_MS = MINUTE_MS;
export const AWAY_LOCK_MS = 5 * MINUTE_MS;

/** 앱 잠금 비밀번호(D-106): 숫자 네 자리, 다섯 번 틀리면 30초 쉰다. */
export const PIN_LENGTH = 4;
export const PIN_MAX_WRONG = 5;
export const PIN_REST_MS = 30_000;

/** 틀린 접근 열쇠(DATA_MODEL §3.9): 60초 창에서 10번이면 5분 잠금. */
export const KEY_FAIL_WINDOW_MS = MINUTE_MS;
export const KEY_FAIL_MAX = 10;
export const KEY_LOCK_MS = 5 * MINUTE_MS;
export const KEY_MAX_LENGTH = 256;

/** 부를 이름(D-112 ④): 앞뒤 빈칸을 뺀 뒤 1~12자(코드 포인트 기준 — D1의 length()와 같은 셈). */
export const NAME_MAX = 12;

/** 요청 본문의 최대 크기(바이트). 일기 저장만 더 크다(`DIARY_MAX_BODY_BYTES` — ./diary.ts, ARCHITECTURE §11.9). */
export const MAX_BODY_BYTES = 8 * 1024;

/** 일기·오늘 요청에 싣는 휴대폰의 시간대(IANA 이름). '오늘'은 이 시간대와 하루 기준 시각으로 서버가 센다(DATA_MODEL §2). */
export const TIMEZONE_HEADER = "x-timezone";
/** 일기 저장·완료·지우기에 붙이는 영수증 열쇠(16~64자 [A-Za-z0-9_-] — 화면은 crypto.randomUUID()). 다시 보낼 때는 같은 열쇠를 쓴다. */
export const IDEMPOTENCY_HEADER = "idempotency-key";
/** 영수증으로 첫 응답을 다시 돌려줄 때 붙는 머리글. */
export const REPLAYED_HEADER = "idempotent-replayed";

export const API = {
  session: "/api/session",
  heartbeat: "/api/session/heartbeat",
  appLock: "/api/app-lock",
  unlock: "/api/app-lock/unlock",
  lock: "/api/app-lock/lock",
  profile: "/api/settings/profile",
  dayStart: "/api/settings/day-start",
  today: "/api/today",
  /** 경로 표의 열쇠 — 실제 주소는 diaryPath(날짜) */
  diary: "/api/diaries/:date",
  diaryComplete: "/api/diaries/:date/complete"
} as const;

export const diaryPath = (date: string) => `/api/diaries/${encodeURIComponent(date)}`;
export const diaryCompletePath = (date: string) => `${diaryPath(date)}/complete`;

export type AppEnvName = "local" | "dev" | "prod";

/** `GET /api/session`. 로그인 전에는 owner의 어떤 설정도 싣지 않는다 — 앱 잠금 여부도(ARCHITECTURE §5). */
export type SessionInfo =
  | { authenticated: false; env: AppEnvName; build: string; compat: number }
  | {
      authenticated: true;
      env: AppEnvName;
      build: string;
      compat: number;
      /** 이 세션(기기)이 지금 잠겼는가 */
      locked: boolean;
      /** owner가 앱 잠금을 켰는가 */
      appLock: boolean;
      /** 부를 이름이 있는가(이름 자체는 `GET /api/settings/profile`) */
      hasName: boolean;
    };

export interface ProfileInfo {
  name: string | null;
}

/** 오류 응답의 `error` 값. 화면은 상태 번호와 이 값으로 갈라 본다. */
export type ErrorCode =
  | "unauthorized" // 401 — 로그인이 없거나 풀렸다
  | "invalid_key" // 401 — POST /api/session의 열쇠가 맞지 않다
  | "csrf" // 403 — 변경 요청의 표식·출처가 맞지 않다
  | "not_found" // 404
  | "method_not_allowed" // 405
  | "app_lock_off" // 409 — 앱 잠금이 꺼져 있다
  | "too_large" // 413
  | "invalid_body" // 400 — 본문 모양이 틀렸다
  | "invalid_name" // 422
  | "invalid_pin" // 422 — 숫자 네 자리가 아니다
  | "wrong_pin" // 422 — 비밀번호가 맞지 않다
  | "pin_required" // 422 — 지금 비밀번호가 필요하다(열쇠 로그인 10분이 지났다)
  | "app_locked" // 423 — 이 세션은 잠겼다
  | "key_locked" // 429 — 열쇠를 여러 번 틀려 잠시 잠겼다(맞는 열쇠는 상관없이 들어온다 — RK-041)
  | "pin_resting" // 429 — 비밀번호를 다섯 번 틀려 잠시 쉰다
  | "invalid_date" // 400 — 주소의 날짜가 YYYY-MM-DD 달력 날짜가 아니다
  | "invalid_timezone" // 400 — x-timezone이 없거나 모르는 시간대다
  | "idempotency_key_required" // 400 — idempotency-key가 없거나 모양이 틀렸다
  | "invalid_text" // 422 — 글이 너무 길거나 받을 수 없는 문자가 있다(field)
  | "invalid_category" // 422 — 모르는 계열이거나 겹쳤다(field)
  | "invalid_emotion" // 422 — 모르는 세부 감정, 고르지 않은 계열의 감정, 겹친 감정(field)
  | "invalid_intensity" // 422 — 크기가 1~10 정수가 아니다(field)
  | "invalid_reflection" // 422 — 칭찬·감사의 칸 번호가 1~3이 아니거나 겹쳤다(field)
  | "invalid_resume" // 422 — 쓰던 단계가 틀렸다
  | "invalid_day_start" // 422 — 하루 기준 시각이 0~6 정수가 아니다
  | "not_today" // 422 — 새 기록은 서버가 센 오늘만 만든다(D-082)
  | "incomplete" // 422 — 완료 조건이 모자란다(missing)
  | "revision_conflict" // 409 — 판 번호가 지금 것과 다르다(currentRevision)
  | "not_draft" // 409 — 이미 완료된 기록이다
  | "idempotency_mismatch" // 409 — 같은 영수증 열쇠로 다른 요청을 보냈다
  | "server_misconfigured" // 500
  | "server_error"; // 500

export interface ErrorBody {
  error: ErrorCode;
  /** 429일 때 다시 시도할 수 있을 때까지 남은 초(`Retry-After`와 같다) */
  retryAfter?: number;
  /** wrong_pin일 때 쉬기 전까지 남은 횟수 */
  remaining?: number;
  /** 422일 때 어느 칸이 틀렸는지(예: `emotions[2]`) */
  field?: string;
  /** incomplete일 때 채워야 할 단계(흐름 순서) */
  missing?: MissingStep[];
  /** revision_conflict일 때 지금 판 번호(기록이 없으면 null) */
  currentRevision?: number | null;
}

/** 부를 이름을 고르고 검사한다. 맞지 않으면 null. */
export function normalizeName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.trim();
  const length = [...name].length;
  if (length < 1 || length > NAME_MAX) return null;
  // 제어 문자(줄바꿈·탭 포함)와 짝 없는 대리 문자(깨진 UTF-16 — 저장하면 글자가 망가진다)는 받지 않는다(DATA_MODEL §2).
  if (/\p{Cc}|\p{Cs}/u.test(name)) return null;
  return name;
}

export function isPin(value: unknown): value is string {
  return typeof value === "string" && value.length === PIN_LENGTH && /^[0-9]+$/.test(value);
}
