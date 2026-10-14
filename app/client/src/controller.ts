// 앱 전체의 흐름: 시작, 잠금, 로그인 풀림, 로그아웃, 다시 보일 때의 확인. 화면(views)은 이 모듈의 함수를 불러 쓰고,
// 이 모듈은 화면을 직접 가져오지 않는다(라우터에 등록된 화면을 render()로 부를 뿐이다).
//
// 서버가 정본이다: 잠겼는지·로그인됐는지는 매번 GET /api/session의 답을 따른다. 화면 쪽 기억은 사라져도 되게 만든다(RK-034).

import { API, AWAY_LOCK_MS } from "../../shared/api";
import { stopHeartbeat, syncHeartbeat } from "./heartbeat";
import { request, setApiHandlers } from "./lib/api";
import { h } from "./lib/dom";
import { emit } from "./lib/probe";
import { isReturnable } from "./lib/routes";
import { readNavType, startLockDecision } from "./lib/startLock";
import { KEYS, readStored, removeStored, writeStored } from "./lib/storage";
import { currentRouteName, navigate, render, startRouter } from "./router";
import { app, fetchSession, markLoggedOut, practice } from "./state";
import { hideCover, isCovered } from "./ui/cover";
import { hideLockLayer, isLockLayerShown, showLockLayer } from "./ui/lockLayer";
import { openSheet } from "./ui/sheet";
import { showToast } from "./ui/toast";

let lossSheetOpen = false;
let resuming = false;

// ───────── 잠금 ─────────

export function enterLock(): void {
  app.locked = true;
  stopHeartbeat();
  showLockLayer({ onUnlocked: afterUnlock, onForgot: () => void forgotPin() });
}

function afterUnlock(): void {
  app.locked = false;
  syncHeartbeat();
  // 층 아래에서 미뤄 둔 화면을 이제 그린다
  render();
}

/** 지금 잠근다(`지금 잠그기`). 서버에 청하고, 닿지 않아도 화면은 잠근다(더 잠기는 쪽이라 안전하다). */
export async function lockNow(): Promise<void> {
  const result = await request("POST", API.lock);
  // 로그인이 풀렸으면(401) 처리기가 열쇠 화면으로 보냈다 — 잠금 층을 올리지 않는다
  if (!result.ok && result.status === 401) return;
  // 서버에서 앱 잠금이 꺼져 있다(다른 기기에서 껐다). 잠글 것이 없으니 화면의 버튼만 맞춘다.
  if (!result.ok && result.status === 409) {
    app.appLock = false;
    render();
    return;
  }
  enterLock();
}

/** '비밀번호를 잊었어요' → 이 기기를 로그아웃하고 열쇠 화면의 `?s=pin` 변형으로. 로그인이 끝나기 전에는 열쇠 화면만 열린다. */
async function forgotPin(): Promise<void> {
  const result = await request("DELETE", API.session, { intercept: false });
  if (!result.ok && result.status !== 401) {
    showToast(
      result.offline
        ? "인터넷에 연결되면 다시 로그인할 수 있어요."
        : "지금은 할 수 없어요. 잠시 뒤 다시 시도해 주세요."
    );
    return;
  }
  writeStored("session", KEYS.forgotPin, "1");
  stopHeartbeat();
  markLoggedOut();
  hideLockLayer();
  navigate("#/auth?s=pin", { replace: true });
}

// ───────── 로그인 풀림·로그아웃 ─────────

export function goAuthAgain(): void {
  navigate("#/auth?s=again", { replace: true });
}

/** 열쇠 화면 밖에서 401 unauthorized를 받았다(UX_SPEC §11). 쓰던 글이 있으면 시트가 먼저다. */
export function handleUnauthorized(options: { already?: boolean } = {}): void {
  // already: 세션 확인이 이미 '로그인 안 됨'을 상태에 반영한 뒤 부르는 경우(상태가 먼저 바뀌어 있어도 처리한다)
  if ((!app.authenticated && !options.already) || lossSheetOpen) return;
  const route = currentRouteName();
  if (isReturnable(route)) writeStored("session", KEYS.returnTo, route);
  stopHeartbeat();
  markLoggedOut();
  if (isLockLayerShown()) {
    hideLockLayer();
    goAuthAgain();
    return;
  }
  if (practice.text !== "") {
    lossSheetOpen = true;
    openSheet({
      id: "session-lost",
      title: "다시 들어와야 해요",
      body: ["다시 들어오면 쓰던 곳으로 돌아와요."],
      actions: [{ label: "다시 들어가기", kind: "primary" }],
      onClosed: () => {
        lossSheetOpen = false;
        goAuthAgain();
      }
    });
    return;
  }
  goAuthAgain();
}

/** 로그아웃: 서버가 이 기기의 로그인 기록을 지운다. 이미 풀려 있어도(401) 같은 결과다. */
export async function logout(): Promise<void> {
  const result = await request("DELETE", API.session, { intercept: false });
  if (!result.ok && result.status !== 401) {
    showToast(
      result.offline
        ? "인터넷에 연결되면 로그아웃할 수 있어요."
        : "지금은 로그아웃할 수 없어요. 잠시 뒤 다시 시도해 주세요."
    );
    return;
  }
  stopHeartbeat();
  markLoggedOut();
  hideLockLayer();
  // 다른 사람이 이어서 쓰지 못하게 연습 칸의 글도 비운다
  practice.text = "";
  removeStored("session", KEYS.returnTo);
  removeStored("session", KEYS.forgotPin);
  navigate("#/auth", { replace: true });
  showToast("로그아웃했어요");
}

// ───────── 시작 ─────────

function showBootFailure(offline: boolean): void {
  const root = document.getElementById("app");
  if (!root) return;
  const retry = h("button", { type: "button", class: "btn btn-primary", text: "다시 시도" });
  retry.addEventListener("click", () => {
    void boot();
  });
  const title = h("h1", { tabindex: "-1", text: "불러오지 못했어요" });
  root.removeAttribute("aria-busy");
  root.replaceChildren(
    h(
      "section",
      { class: "screen" },
      title,
      h("p", {
        text: offline
          ? "인터넷에 연결되면 열 수 있어요."
          : "지금은 열 수 없어요. 잠시 뒤 다시 시도해 주세요."
      }),
      h("div", { class: "screen-actions" }, retry)
    )
  );
  document.title = "불러오지 못했어요 — 감정일기";
  title.focus({ preventScroll: true });
}

/** 시작: 세션을 확인하고(T3 A-5 버전 비교 포함) 시작 잠금을 판단한 뒤 첫 화면을 그린다. */
export async function boot(): Promise<void> {
  const result = await fetchSession(10_000);
  if (!result.ok) {
    showBootFailure(result.offline);
    return;
  }
  const info = result.data;
  const navType = readNavType();
  const hasMarker = readStored("session", KEYS.alive) !== null;
  if (info.authenticated) {
    // 시작 잠금(T3 A-15, 잠정): 앱을 새로 켠 것으로 보이면 잠금을 청한다. 판단과 이유는 개발용 상태 칸에 보인다.
    const decision = startLockDecision({ navType, hasMarker, appLock: info.appLock, locked: info.locked });
    emit({ type: "startLock", navType: navType ?? "unknown", hasMarker, ...decision });
    if (decision.lock) await lockNow();
  } else {
    emit({
      type: "startLock",
      navType: navType ?? "unknown",
      hasMarker,
      lock: false,
      reason: "로그인 전이라 판단하지 않았어요"
    });
  }
  // 판단 뒤에 표식을 심는다 — 같은 탭에서 다시 시작해도 '새로 켠 것'으로 보지 않는다
  writeStored("session", KEYS.alive, "1");

  if (app.authenticated && app.locked) enterLock();
  startRouter();
  render();
  syncHeartbeat();
}

// ───────── 다시 보일 때 ─────────

/**
 * 화면이 다시 보인다(visibilitychange·pageshow). 로그인 상태면 먼저 세션을 확인하고, 잠겼으면 잠금 층을 올린 뒤에 덮개를 걷는다
 * (사이에 내용이 비치지 않게). 잠기지 않았으면 바로 걷는다. 덮개를 붙인 적이 없으면 아무것도 하지 않는다.
 */
export async function resume(): Promise<void> {
  if (!isCovered() || resuming) return;
  resuming = true;
  try {
    if (!app.authenticated) {
      // 열쇠 화면에 적던 글이 지워지지 않게 다시 그리지 않고 덮개만 걷는다
      hideCover();
      return;
    }
    const result = await fetchSession(6000);
    // 확인하는 사이 다시 숨었으면 덮개는 그대로 둔다
    if (document.visibilityState === "hidden") return;
    if (!result.ok) {
      // 서버에 닿지 못했다. 잠금을 켠 사람이 5분 넘게 떠나 있었으면 확인될 때까지 잠근 채로 둔다.
      const hiddenAt = Number(readStored("local", KEYS.lastHiddenAt));
      const away = Number.isFinite(hiddenAt) && hiddenAt > 0 ? Date.now() - hiddenAt : Number.POSITIVE_INFINITY;
      if (app.appLock && !app.locked && away >= AWAY_LOCK_MS) enterLock();
      hideCover();
      syncHeartbeat();
      return;
    }
    if (!result.data.authenticated) {
      // 그 사이 로그인이 풀렸다 — 쓰던 곳을 기억하고 열쇠 화면으로
      hideCover();
      if (isReturnable(currentRouteName())) writeStored("session", KEYS.returnTo, currentRouteName());
      stopHeartbeat();
      goAuthAgain();
      return;
    }
    // 서버가 잠기지 않았다고 해도, 연결이 끊겨 먼저 올려 둔 잠금 층은 비밀번호로 풀기 전에는 내리지 않는다
    if (result.data.locked || isLockLayerShown()) enterLock();
    hideCover();
    // 돌아올 때마다 화면을 다시 그리지 않는다 — 쓰던 칸의 초점과 글이 사라진다
    if (!app.locked) syncHeartbeat();
  } finally {
    resuming = false;
  }
}

export function initController(): void {
  setApiHandlers({ onLocked: enterLock, onUnauthorized: () => handleUnauthorized() });
}
