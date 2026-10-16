// /api/* 응답의 공통 모양. 정적 파일의 헤더는 app/client/public/_headers가 맡고(그 파일은 Worker 응답에 붙지 않는다 — D-115 ⑦),
// Worker가 만드는 응답에는 여기서 건다.
import type { ErrorBody, ErrorCode } from "../../shared/api";

export const API_SECURITY_HEADERS: Readonly<Record<string, string>> = {
  "cache-control": "no-store",
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
  "strict-transport-security": "max-age=31536000",
  "cross-origin-resource-policy": "same-origin"
};

export function json(status: number, body: unknown, extra: HeadersInit = {}): Response {
  const headers = new Headers(API_SECURITY_HEADERS);
  headers.set("content-type", "application/json; charset=utf-8");
  for (const [name, value] of new Headers(extra)) headers.append(name, value);
  return new Response(JSON.stringify(body), { status, headers });
}

export function empty(status = 204, extra: HeadersInit = {}): Response {
  const headers = new Headers(API_SECURITY_HEADERS);
  for (const [name, value] of new Headers(extra)) headers.append(name, value);
  return new Response(null, { status, headers });
}

export function fail(status: number, error: ErrorCode, more: Omit<ErrorBody, "error"> = {}, extra: HeadersInit = {}): Response {
  const headers = new Headers(extra);
  if (more.retryAfter !== undefined) headers.set("retry-after", String(more.retryAfter));
  return json(status, { error, ...more }, headers);
}

/** 서버가 응답에 붙인 cookie를 그대로 다른 응답에 옮긴다(연장한 cookie가 오류 응답에도 실리게). */
export function withCookie(response: Response, setCookie: string | null): Response {
  if (!setCookie) return response;
  const copy = new Response(response.body, response);
  copy.headers.append("set-cookie", setCookie);
  return copy;
}
