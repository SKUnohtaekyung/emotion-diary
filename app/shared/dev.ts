// 개발용 건물에서만 쓰는 계약(D-113 ②, D-115 ⑤). 운영 묶음에는 들어가지 않아야 한다 —
// 서버는 app/worker/src/index.ts, 화면은 app/client/src/main.ts가 __APP_ENV__가 prod가 아닐 때만 이 파일을 쓴다.
// 빌드 검사(app/scripts/build.mjs)가 운영 묶음에서 아래 경로 이름을 찾으면 실패한다.

export const CLIENT_ERRORS_PATH = "/api/client-errors";

/** 서버에 남기는 오류는 이 일곱 칸뿐이다. 메시지·stack·입력값은 받지 않는다. */
export interface ClientErrorReport {
  kind: "error" | "unhandledrejection" | "api";
  /** 오류 종류 이름(TypeError 등) 또는 api일 때 `HTTP500` 같은 상태 */
  name: string;
  /** 파일 경로(query·# 없음) 또는 api일 때 API 경로 */
  source: string;
  line: number;
  col: number;
  build: string;
  /** 화면 이름(`today`, `settings/lock` — query 없음) */
  route: string;
}

export const CLIENT_ERROR_KEEP_ROWS = 200;

const KINDS = new Set(["error", "unhandledrejection", "api"]);
const NAME = /^[A-Za-z][A-Za-z0-9]{0,39}$/;
const SOURCE = /^\/[A-Za-z0-9._/-]{0,119}$/;
const BUILD = /^[A-Za-z0-9.-]{1,40}$/;
const ROUTE = /^[a-z0-9/-]{1,40}$/;
const FIELDS = ["kind", "name", "source", "line", "col", "build", "route"];

/** 서버와 화면이 같은 검사를 쓴다. 모양이 하나라도 다르면 null(서버는 400). */
export function parseClientError(value: unknown): ClientErrorReport | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== FIELDS.length || !keys.every((key) => FIELDS.includes(key))) return null;
  const { kind, name, source, line, col, build, route } = record;
  if (typeof kind !== "string" || !KINDS.has(kind)) return null;
  if (typeof name !== "string" || !NAME.test(name)) return null;
  if (typeof source !== "string" || !SOURCE.test(source)) return null;
  if (!Number.isInteger(line) || (line as number) < 0 || (line as number) > 10_000_000) return null;
  if (!Number.isInteger(col) || (col as number) < 0 || (col as number) > 10_000_000) return null;
  if (typeof build !== "string" || !BUILD.test(build)) return null;
  if (typeof route !== "string" || !ROUTE.test(route)) return null;
  return { kind: kind as ClientErrorReport["kind"], name, source, line: line as number, col: col as number, build, route };
}
