// 화면이 들고 있는 상태. 서버가 정본이고(ARCHITECTURE §4.1) 여기는 마지막으로 받은 답을 둘 뿐이다.
// 새로 열리면 사라져도 되게 만든다 — 모든 값은 시작할 때 `GET /api/session`으로 다시 채운다.

import { API, API_COMPAT, type ProfileInfo, type SessionInfo } from "../../shared/api";
import { type ApiResult, request } from "./lib/api";
import { APP_BUILD } from "./lib/build";
import { versionNotice } from "./lib/version";
import { renderVersionBanner } from "./ui/banner";

export const app = {
  authenticated: false,
  /** 이 세션(기기)이 지금 잠겼는가 */
  locked: false,
  /** owner가 앱 잠금을 켰는가 */
  appLock: false,
  hasName: false,
  name: null as string | null
};

/** 연습 칸의 글. 메모리에만 둔다 — 저장소·서버·개발용 상태 칸 어디에도 보내지 않는다(S-07 확인용). */
export const practice = { text: "" };

/** 이 기기의 로그인이 끝났을 때(로그아웃·풀림) 마지막으로 받은 답을 비운다. */
export function markLoggedOut(): void {
  app.authenticated = false;
  app.locked = false;
  app.appLock = false;
  app.hasName = false;
  app.name = null;
}

function isSessionInfo(value: unknown): value is SessionInfo {
  return typeof value === "object" && value !== null && typeof (value as { authenticated?: unknown }).authenticated === "boolean";
}

export function applySession(info: SessionInfo): void {
  app.authenticated = info.authenticated;
  if (info.authenticated) {
    app.locked = info.locked;
    app.appLock = info.appLock;
    app.hasName = info.hasName;
    if (!info.hasName) app.name = null;
  } else {
    markLoggedOut();
  }
  // 새 버전 띠: 판단만 하고 새로 고치지는 않는다(T3 A-5)
  renderVersionBanner(versionNotice(info.build, info.compat, APP_BUILD, API_COMPAT));
}

/** `GET /api/session`. 받으면 상태에 반영한다. 모양이 다르면 서버 오류로 본다. */
export async function fetchSession(timeoutMs = 8000): Promise<ApiResult<SessionInfo>> {
  const result = await request<SessionInfo>("GET", API.session, { intercept: false, timeoutMs });
  if (!result.ok) return result;
  if (!isSessionInfo(result.data)) {
    return { ok: false, status: 500, code: null, retryAfter: null, remaining: null, offline: false };
  }
  applySession(result.data);
  return result;
}

/** 부를 이름. 이미 받았으면 그대로, 아니면 서버에서. 못 받으면 null. */
export async function ensureName(): Promise<string | null> {
  if (app.name) return app.name;
  const result = await request<ProfileInfo>("GET", API.profile);
  if (result.ok && typeof result.data?.name === "string") {
    app.name = result.data.name;
    app.hasName = true;
  }
  return app.name;
}
