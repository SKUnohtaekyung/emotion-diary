// 서명·해시·무작위 값. Workers의 Web Crypto만 쓴다 — 요청 하나에 CPU 10ms라 느린 해시는 쓰지 않는다(ARCHITECTURE §2.1·§6).

const encoder = new TextEncoder();

export async function hmac(secret: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

export async function hmacHex(secret: string, message: string): Promise<string> {
  return toHex(await hmac(secret, message));
}

export async function hmacBase64Url(secret: string, message: string): Promise<string> {
  return toBase64Url(await hmac(secret, message));
}

export function toHex(bytes: Uint8Array): string {
  let out = "";
  for (const byte of bytes) out += byte.toString(16).padStart(2, "0");
  return out;
}

export function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

/** 추측할 수 없는 세션 번호(16바이트 → base64url 22자). */
export function randomId(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
}

/** 길이가 같은 문자열을 끝까지 비교한다 — 앞부분이 맞는 정도가 응답 시간으로 새지 않게. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
