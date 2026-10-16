// 요청 하나를 처리하는 동안 함께 다니는 값들.
import type { AppEnvName } from "../../shared/api";

/** Worker가 받는 바인딩·변수·비밀값. 비밀값은 `wrangler secret`으로만 넣는다(ARCHITECTURE §3). */
export interface Bindings {
  DB: D1Database;
  ASSETS: Fetcher;
  /** 접근 열쇠로 로그인하면 세션에 담는 주체(본인 1명이라 하나 — D-025) */
  OWNER_SUBJECT: string;
  /** 요청마다 세션의 주체를 대조하는 허용 목록(쉼표 구분 — D-025) */
  OWNER_ALLOWLIST: string;
  ACCESS_KEY_HASH?: string;
  ACCESS_KEY_SALT?: string;
  SESSION_SECRET?: string;
  APP_LOCK_SECRET?: string;
  /** PC 백업 토큰의 SHA-256 16진수(선택 — 없으면 백업 경로가 404, D-109). 토큰 자체는 PC의 Git 제외 파일에만 있다 */
  BACKUP_TOKEN_HASH?: string;
}

export interface Secrets {
  accessKeyHash: string;
  accessKeySalt: string;
  sessionSecret: string;
  appLockSecret: string;
}

export type Handler = (ctx: Ctx) => Promise<Response>;

export interface AppConfig {
  appEnv: AppEnvName;
  build: string;
  /** 시험에서 시각을 옮기려고 둔다. 운영은 Date.now() */
  now?: () => number;
  /** 개발용 건물에서만 붙는 경로(`"POST /api/client-errors"` 같은 키). 운영 묶음에는 없다(D-115 ②) */
  devRoutes?: ReadonlyMap<string, Handler>;
}

/** 서버의 세션 기록(DATA_MODEL §3.10)을 읽어 판정한 결과. */
export interface Session {
  id: string;
  /** 세션의 주체 = owner_key(본인 1명 모드 — ARCHITECTURE §6) */
  owner: string;
  keyLoginAt: number;
  issuedAt: number;
  lastActiveAt: number;
  /** 이 세션이 지금 잠겼는가(touch 뒤의 값) */
  locked: boolean;
  /** owner가 앱 잠금을 켰는가 */
  lockOn: boolean;
  hasName: boolean;
  /** owner의 하루 기준 시각(0~6, 설정 행이 없으면 기본 4 — DATA_MODEL §3.4) */
  dayStartHour: number;
}

export interface Ctx {
  request: Request;
  url: URL;
  env: Bindings;
  secrets: Secrets;
  config: AppConfig;
  now: number;
  allowlist: ReadonlySet<string>;
  /** 로그인한 요청이면 세션 */
  session: Session | null;
  /** 응답에 실을 Set-Cookie(연장·해제) */
  setCookie: string | null;
  /** 경로의 `:이름` 조각 값(URL 디코딩만 했다 — 모양 검사는 처리기가 한다) */
  params: Record<string, string>;
}

export const iso = (ms: number): string => new Date(ms).toISOString();

const SECRET_MIN = 32;

/** 비밀값이 빠졌거나 너무 짧으면 null — 그때는 어떤 요청도 받지 않는다(500). 값은 어디에도 남기지 않는다. */
export function readSecrets(env: Bindings): Secrets | null {
  const { ACCESS_KEY_HASH, ACCESS_KEY_SALT, SESSION_SECRET, APP_LOCK_SECRET } = env;
  if (!ACCESS_KEY_HASH || !/^[0-9a-f]{64}$/.test(ACCESS_KEY_HASH)) return null;
  if (!ACCESS_KEY_SALT || ACCESS_KEY_SALT.length < SECRET_MIN) return null;
  if (!SESSION_SECRET || SESSION_SECRET.length < SECRET_MIN) return null;
  if (!APP_LOCK_SECRET || APP_LOCK_SECRET.length < SECRET_MIN) return null;
  return { accessKeyHash: ACCESS_KEY_HASH, accessKeySalt: ACCESS_KEY_SALT, sessionSecret: SESSION_SECRET, appLockSecret: APP_LOCK_SECRET };
}

export function parseAllowlist(value: string): ReadonlySet<string> {
  return new Set(value.split(",").map((item) => item.trim()).filter(Boolean));
}
