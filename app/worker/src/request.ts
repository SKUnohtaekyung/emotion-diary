// 요청 검사: CSRF(ARCHITECTURE §5, D-025)와 본문 읽기.
import { CSRF_HEADER, CSRF_VALUE, MAX_BODY_BYTES } from "../../shared/api";
import { fail } from "./http";

/**
 * 변경 요청의 CSRF 검사. custom header가 기본이고(없으면 403) Origin(없으면 Referer)과 Sec-Fetch-Site는 그 위의 겹이다.
 * 허용 출처는 설정에 적지 않고 요청 자신의 주소로 계산한다(D-115 ① — 공개 저장소에 앱 주소를 두지 않는다).
 */
export function csrfOk(request: Request, url: URL): boolean {
  if (request.headers.get(CSRF_HEADER) !== CSRF_VALUE) return false;
  const site = request.headers.get("sec-fetch-site");
  if (site !== null && site !== "same-origin") return false;
  const origin = request.headers.get("origin");
  if (origin !== null) return origin === url.origin;
  const referer = request.headers.get("referer");
  if (referer !== null) {
    try {
      return new URL(referer).origin === url.origin;
    } catch {
      return false;
    }
  }
  return true;
}

export type JsonBody = Record<string, unknown>;

/**
 * 본문을 한도까지만 읽는다. content-length가 없거나(청크 전송) 거짓이어도 한도를 넘는 순간 읽기를 멈춘다 —
 * 큰 본문을 끝까지 메모리에 올린 뒤에 거절하지 않게.
 */
async function readLimited(request: Request, limit: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

/**
 * 본문을 JSON 객체로 읽는다. 비었으면 {}. 크거나 모양이 틀리면 오류 응답.
 * 한도는 경로마다 처리기가 정해 넘긴다 — 기본은 MAX_BODY_BYTES(8KB). 더 큰 본문이 필요한 경로(일기 저장 등)는
 * DATA_MODEL의 칸 길이로 계산한 한도를 넘긴다(ARCHITECTURE §11.9).
 */
export async function readJson(request: Request, limit: number = MAX_BODY_BYTES): Promise<JsonBody | Response> {
  const read = await readJsonText(request, limit);
  return read instanceof Response ? read : read.body;
}

/** readJson과 같고, 받은 본문 글도 함께 돌려준다 — 영수증의 요청 지문을 본문 바이트 그대로로 만들려고(DATA_MODEL §3.7). */
export async function readJsonText(request: Request, limit: number = MAX_BODY_BYTES): Promise<{ body: JsonBody; text: string } | Response> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > limit) return fail(413, "too_large");
  const text = await readLimited(request, limit);
  if (text === null) return fail(413, "too_large");
  if (text.trim() === "") return { body: {}, text };
  try {
    const value: unknown = JSON.parse(text);
    if (value && typeof value === "object" && !Array.isArray(value)) return { body: value as JsonBody, text };
  } catch {
    // 아래의 400으로 간다
  }
  return fail(400, "invalid_body");
}
