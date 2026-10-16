// 화면 오류에서 안전한 부분만 꺼낸다. 운영의 오류 번호 화면과 개발용 보고가 같은 정리를 쓴다(D-113 ②, T3 A-6).
// 메시지·stack 문자열은 입력한 글이나 열쇠를 담을 수 있어 읽지 않는다 — 종류 이름과 위치(파일 경로·줄·칸)만 쓴다.

export interface ErrorLike {
  kind: "error" | "unhandledrejection";
  /** error.name 후보. 문자열이 아니거나 모양이 맞지 않으면 'Error' */
  name?: unknown;
  /** ErrorEvent.filename */
  filename?: unknown;
  lineno?: unknown;
  colno?: unknown;
}

export interface ErrorParts {
  kind: ErrorLike["kind"];
  name: string;
  source: string;
  line: number;
  col: number;
}

const NAME = /^[A-Za-z][A-Za-z0-9]{0,39}$/;
const SOURCE = /^\/[A-Za-z0-9._/-]{0,119}$/;
const MAX_COUNT = 10_000_000;

export function safeErrorName(name: unknown): string {
  return typeof name === "string" && NAME.test(name) ? name : "Error";
}

/** 파일 주소에서 경로만. query와 #은 버리고, 다른 출처는 '/external', 알 수 없으면 '/unknown'. */
export function safeSource(filename: unknown, origin: string = window.location.origin): string {
  if (typeof filename !== "string" || filename === "") return "/unknown";
  let url: URL;
  try {
    url = new URL(filename, origin);
  } catch {
    return "/unknown";
  }
  if (url.origin !== origin) return "/external";
  return SOURCE.test(url.pathname) ? url.pathname : "/unknown";
}

export function safeCount(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= MAX_COUNT ? value : 0;
}

export function errorParts(error: ErrorLike): ErrorParts {
  return {
    kind: error.kind,
    name: safeErrorName(error.name),
    source: safeSource(error.filename),
    line: safeCount(error.lineno),
    col: safeCount(error.colno)
  };
}

/** 빌드 번호를 보고 칸의 모양(영문·숫자·점·하이픈 1~40자)에 맞춘다. */
export function safeBuild(build: string): string {
  const cleaned = build.replace(/[^A-Za-z0-9.-]/g, "-").slice(0, 40);
  return cleaned === "" ? "unknown" : cleaned;
}

/** 화면 이름만. 주소의 # · / · query를 걷어 낸다(`#/settings/pin?from=welcome` → `settings/pin`). */
/**
 * 개발용 상태 칸·오류 보고에 싣는 API 경로. query·`#`을 버리고 날짜 조각을 `_date`로 가린다
 * (`/api/diaries/2026-10-16/complete` → `/api/diaries/_date/complete`) — 기록 날짜가 서버 기록에 남지 않게(ARCHITECTURE §11.9).
 */
export function maskApiPath(path: string): string {
  return (path.split(/[?#]/)[0] ?? path).replace(/\/\d{4}-\d{2}-\d{2}(?=\/|$)/g, "/_date");
}

export function routeNameOf(hash: string): string {
  const name = (hash.replace(/^#\/?/, "").split("?")[0] ?? "").replace(/\/+$/, "");
  return /^[a-z0-9/-]{1,40}$/.test(name) ? name : "unknown";
}

/**
 * 오류 보고·상태 칸에 싣는 화면 이름. 앞에서부터 영문 소문자 조각만 남기고 첫 값 조각에서 멈춘다
 * (`#/record/2026-10-14?x=1` → `record`) — 기록 날짜 같은 값이 서버 기록에 남지 않게(ARCHITECTURE §11.9).
 * 로그인 뒤 돌아갈 자리(returnTo)는 값까지 담아야 하므로 이 함수가 아니라 routeNameOf를 쓴다.
 */
export function reportRouteOf(hash: string): string {
  const kept: string[] = [];
  for (const segment of routeNameOf(hash).split("/")) {
    if (!/^[a-z][a-z-]*$/.test(segment)) break;
    kept.push(segment);
  }
  return kept.length ? kept.join("/") : "unknown";
}

/** 오류 번호: 종류 이름·파일 경로·줄·칸·빌드를 이은 글의 짧은 해시 6자. 같은 고장은 같은 번호다. */
export function errorNumber(parts: Pick<ErrorParts, "name" | "source" | "line" | "col">, build: string): string {
  const text = `${parts.name}|${parts.source}|${parts.line}|${parts.col}|${build}`;
  // FNV-1a 32비트. 암호용이 아니라 같은 고장을 같은 번호로 묶는 용도다.
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).toUpperCase().padStart(8, "0").slice(2);
}
