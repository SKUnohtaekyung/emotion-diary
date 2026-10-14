// 서버 요청 한 곳. 변경 요청에는 표식 헤더를 붙이고(D-025), 오류 응답을 화면이 갈라 볼 수 있는 모양으로 돌려준다.
// 어느 화면에서든 423 app_locked는 잠금 층, 401 unauthorized는 로그인 풀림으로 이어진다(UX_SPEC §11) — handlers가 맡는다.
// 요청·응답에 담기는 글(열쇠·비밀번호·이름)은 호출한 쪽이 보낸 본문뿐이고, 여기서는 어디에도 남기지 않는다.

import { CSRF_HEADER, CSRF_VALUE, type ErrorBody, type ErrorCode } from "../../../shared/api";
import { emit } from "./probe";

export interface ApiOk<T> {
  ok: true;
  status: number;
  data: T;
}

export interface ApiFail {
  ok: false;
  /** 0이면 서버에 닿지 못했다(연결 끊김·시간 초과) */
  status: number;
  code: ErrorCode | null;
  retryAfter: number | null;
  remaining: number | null;
  offline: boolean;
}

export type ApiResult<T> = ApiOk<T> | ApiFail;

export interface ApiHandlers {
  onLocked: () => void;
  onUnauthorized: () => void;
}

export interface RequestOptions {
  body?: unknown;
  /** 거짓이면 423·401을 가로채지 않는다(호출한 쪽이 직접 다룰 때) */
  intercept?: boolean;
  timeoutMs?: number;
}

let handlers: ApiHandlers | null = null;

export function setApiHandlers(next: ApiHandlers | null): void {
  handlers = next;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function request<T = unknown>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  options: RequestOptions = {}
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {};
  const init: RequestInit = { method, headers, credentials: "same-origin", cache: "no-store" };
  if (method !== "GET") headers[CSRF_HEADER] = CSRF_VALUE;
  if (options.body !== undefined) {
    headers["content-type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }
  let timer: number | undefined;
  if (options.timeoutMs) {
    const controller = new AbortController();
    init.signal = controller.signal;
    timer = window.setTimeout(() => controller.abort(), options.timeoutMs);
  }

  let response: Response;
  try {
    response = await globalThis.fetch(path, init);
  } catch {
    emit({ type: "api", method, path, status: 0 });
    return { ok: false, status: 0, code: null, retryAfter: null, remaining: null, offline: true };
  } finally {
    window.clearTimeout(timer);
  }
  emit({ type: "api", method, path, status: response.status });

  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    // 본문이 없거나 JSON이 아니다(204 등)
  }

  if (response.ok) return { ok: true, status: response.status, data: json as T };

  const body = (json && typeof json === "object" ? json : {}) as Partial<ErrorBody>;
  const headerRetry = Number(response.headers?.get?.("retry-after"));
  const result: ApiFail = {
    ok: false,
    status: response.status,
    code: typeof body.error === "string" ? body.error : null,
    retryAfter: numberOrNull(body.retryAfter) ?? (Number.isFinite(headerRetry) && headerRetry > 0 ? headerRetry : null),
    remaining: numberOrNull(body.remaining),
    offline: false
  };
  if (options.intercept !== false && handlers) {
    if (result.status === 423 && result.code === "app_locked") handlers.onLocked();
    else if (result.status === 401 && result.code === "unauthorized") handlers.onUnauthorized();
  }
  return result;
}
