/// <reference path="../../client/src/env.d.ts" />
// 잠금 층(UX_SPEC §15): 구조, 숫자판, 서버 답에 따른 안내, 층 밖 inert, 잊었어요 흐름, 423·401 처리. 서버는 가짜 fetch다.
// 시험의 비밀번호는 이 파일 안에서 만든 가짜 숫자다.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initController } from "../../client/src/controller";
import { request, setApiHandlers } from "../../client/src/lib/api";
import { registerViews, resetRouterForTest, startRouter, type ViewContext } from "../../client/src/router";
import { app } from "../../client/src/state";
import { hideLockLayer, isLockLayerShown, showLockLayer } from "../../client/src/ui/lockLayer";
import { openSheet, resetSheetsForTest } from "../../client/src/ui/sheet";
import { showToast } from "../../client/src/ui/toast";
import { mountShell, session, stubFetch } from "./helpers";

const FAKE_PIN = "2580";
const callbacks = { onUnlocked: vi.fn(), onForgot: vi.fn() };

const layer = () => document.getElementById("lock-layer");
const dots = () => document.querySelector<HTMLElement>(".pin-dots");
const status = () => document.querySelector<HTMLElement>(".pin-status");
const keys = () => [...document.querySelectorAll<HTMLButtonElement>(".pin-key")];

function press(digits: string): void {
  for (const digit of digits) {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: digit, bubbles: true, cancelable: true }));
  }
}

const stubView = (context: ViewContext) => {
  context.root.append(document.createElement("h1"));
  return () => {};
};

beforeEach(() => {
  mountShell();
  localStorage.clear();
  sessionStorage.clear();
  history.replaceState(null, "", "/#/today");
  resetRouterForTest();
  resetSheetsForTest();
  registerViews({ auth: stubView, today: stubView, "write/:date": stubView });
  startRouter();
  Object.assign(app, { authenticated: true, locked: true, appLock: true, hasName: true, name: "시험" });
  callbacks.onUnlocked.mockReset();
  callbacks.onForgot.mockReset();
});

afterEach(() => {
  hideLockLayer();
  setApiHandlers(null);
  resetRouterForTest();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("잠금 층 구조", () => {
  it("대화 상자이고, 제목·점 네 개·숫자판·'잊었어요'가 있다", () => {
    showLockLayer(callbacks);
    const node = layer();
    expect(node?.getAttribute("role")).toBe("dialog");
    expect(node?.getAttribute("aria-modal")).toBe("true");
    const title = document.getElementById(node?.getAttribute("aria-labelledby") ?? "");
    expect(title?.textContent).toBe("비밀번호를 눌러 주세요");
    expect(dots()?.getAttribute("role")).toBe("img");
    expect(dots()?.children).toHaveLength(4);
    expect(dots()?.getAttribute("aria-label")).toBe("잠금 비밀번호, 4자리 중 0자리 눌렀어요");
    expect(keys().map((key) => key.textContent)).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "지우기"]);
    expect(node?.textContent).toContain("비밀번호를 잊었어요");
  });

  it("층 밖은 모두 inert이고 아래 화면은 가려진다(읽어 주기 칸만 남는다)", () => {
    showLockLayer(callbacks);
    expect(document.getElementById("app")?.hasAttribute("inert")).toBe(true);
    expect(document.getElementById("banner")?.hasAttribute("inert")).toBe(true);
    expect(document.getElementById("live")?.hasAttribute("inert")).toBe(false);
    expect(layer()?.hasAttribute("inert")).toBe(false);
    expect(document.getElementById("app")?.classList.contains("is-covered")).toBe(true);
    hideLockLayer();
    expect(document.getElementById("app")?.hasAttribute("inert")).toBe(false);
    expect(document.getElementById("app")?.classList.contains("is-covered")).toBe(false);
    expect(isLockLayerShown()).toBe(false);
  });

  it("열려 있던 시트와 알림은 닫힌다", () => {
    openSheet({ id: "x", title: "열려 있던 시트", actions: [{ label: "닫기" }] });
    showToast("열려 있던 알림");
    expect(document.querySelector(".sheet")).not.toBeNull();
    expect(document.querySelector(".toast")).not.toBeNull();
    showLockLayer(callbacks);
    expect(document.querySelector(".sheet")).toBeNull();
    expect(document.querySelector(".toast")).toBeNull();
  });

  it("키보드 숫자와 Backspace로 누르고 지운다", () => {
    showLockLayer(callbacks);
    press("123");
    expect(dots()?.getAttribute("aria-label")).toContain("4자리 중 3자리");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", bubbles: true, cancelable: true }));
    expect(dots()?.getAttribute("aria-label")).toContain("4자리 중 2자리");
    expect(dots()?.querySelectorAll(".on")).toHaveLength(2);
  });
});

describe("서버 답에 따른 안내", () => {
  it("네 자리를 누르면 POST /api/app-lock/unlock — 맞으면 층을 걷고 알린다", async () => {
    const calls = stubFetch(() => ({ status: 200, body: { locked: false } }));
    showLockLayer(callbacks);
    press(FAKE_PIN);
    await vi.waitFor(() => expect(callbacks.onUnlocked).toHaveBeenCalledTimes(1));
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ method: "POST", path: "/api/app-lock/unlock", body: { pin: FAKE_PIN } });
    expect(calls[0]?.headers["x-requested-with"]).toBe("emotion-diary");
    expect(layer()).toBeNull();
    expect(document.getElementById("app")?.hasAttribute("inert")).toBe(false);
    // 숫자는 저장소 어디에도 남지 않는다
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain(FAKE_PIN);
  });

  it("틀리면(422 wrong_pin) 점이 흔들리고 '맞지 않아요. 다시 눌러 주세요.', 다시 누를 수 있다", async () => {
    stubFetch(() => ({ status: 422, body: { error: "wrong_pin", remaining: 4 } }));
    showLockLayer(callbacks);
    press(FAKE_PIN);
    await vi.waitFor(() => expect(status()?.textContent).toBe("맞지 않아요. 다시 눌러 주세요."));
    expect(dots()?.classList.contains("shake")).toBe(true);
    expect(dots()?.querySelectorAll(".on")).toHaveLength(0);
    expect(callbacks.onUnlocked).not.toHaveBeenCalled();
    press("1");
    expect(dots()?.querySelectorAll(".on")).toHaveLength(1);
  });

  it("다섯 번 틀려 쉬는 중(429 pin_resting): 숫자판이 꺼지고 retryAfter로 1초씩 줄다가 다시 켜진다", async () => {
    vi.useFakeTimers();
    stubFetch(() => ({ status: 429, body: { error: "pin_resting", retryAfter: 3 }, headers: { "retry-after": "3" } }));
    showLockLayer(callbacks);
    press(FAKE_PIN);
    await vi.advanceTimersByTimeAsync(200);
    expect(keys().every((key) => key.disabled)).toBe(true);
    expect(status()?.textContent).toBe("잠시 쉬었다가 다시 눌러요. 3초");

    await vi.advanceTimersByTimeAsync(1000);
    expect(status()?.textContent).toBe("잠시 쉬었다가 다시 눌러요. 2초");

    await vi.advanceTimersByTimeAsync(2100);
    expect(keys().some((key) => key.disabled)).toBe(false);
    expect(status()?.textContent).toBe("");
  });

  it("연결이 끊겼으면 '연결되면 열 수 있어요.'", async () => {
    stubFetch(() => "offline");
    showLockLayer(callbacks);
    press(FAKE_PIN);
    await vi.waitFor(() => expect(status()?.textContent).toBe("연결되면 열 수 있어요."));
    expect(callbacks.onUnlocked).not.toHaveBeenCalled();
  });
});

describe("비밀번호를 잊었어요", () => {
  it("시트에서 '다시 로그인하기'를 누르면 로그아웃하고 열쇠 화면의 pin 변형만 연다", async () => {
    const calls = stubFetch(() => ({ status: 200, body: { ok: true } }));
    initController();
    const { enterLock } = await import("../../client/src/controller");
    enterLock();
    expect(layer()).not.toBeNull();

    [...document.querySelectorAll<HTMLButtonElement>(".scene-link")].find((b) => b.textContent === "비밀번호를 잊었어요")?.click();
    const sheet = document.querySelector(".sheet");
    expect(sheet?.textContent).toContain("비밀번호를 잊었나요?");
    expect(sheet?.textContent).toContain("다시 로그인하면 새 비밀번호를 정할 수 있어요. 기록은 그대로 있어요.");
    // 시트가 위에 있는 동안 잠금 층은 눌리지 않는다
    expect(layer()?.hasAttribute("inert")).toBe(true);

    [...document.querySelectorAll<HTMLButtonElement>(".sheet button")].find((b) => b.textContent === "다시 로그인하기")?.click();
    await vi.waitFor(() => expect(location.hash).toBe("#/auth?s=pin"));
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual(["DELETE /api/session"]);
    expect(layer()).toBeNull();
    expect(app.authenticated).toBe(false);
    expect(sessionStorage.getItem("forgotPin")).toBe("1");
  });
});

describe("어느 화면에서든", () => {
  it("423 app_locked를 받으면 잠금 층이 뜬다", async () => {
    initController();
    app.locked = false;
    stubFetch(() => ({ status: 423, body: { error: "app_locked" } }));
    await request("GET", "/api/anything");
    expect(layer()).not.toBeNull();
    expect(app.locked).toBe(true);
  });

  it("401 unauthorized: 쓰던 글이 없으면 바로 열쇠 화면(again), returnTo는 지금 화면", async () => {
    initController();
    app.locked = false;
    stubFetch(() => ({ status: 401, body: { error: "unauthorized" } }));
    await request("GET", "/api/anything");
    expect(location.hash).toBe("#/auth?s=again");
    expect(sessionStorage.getItem("returnTo")).toBe("today");
    expect(app.authenticated).toBe(false);
  });

  it("401 unauthorized: 작성 흐름에 있으면 '다시 들어와야 해요' 시트가 먼저고, 돌아갈 자리는 그 글(날짜까지)이다", async () => {
    initController();
    app.locked = false;
    history.replaceState(null, "", "/#/write/2026-10-16?step=reason");
    stubFetch(() => ({ status: 401, body: { error: "unauthorized" } }));
    await request("GET", "/api/anything");
    const sheet = document.querySelector(".sheet");
    expect(sheet?.textContent).toContain("다시 들어와야 해요");
    expect(sheet?.textContent).toContain("다시 들어오면 쓰던 곳으로 돌아와요.");
    expect(location.hash).toBe("#/write/2026-10-16?step=reason");

    [...document.querySelectorAll<HTMLButtonElement>(".sheet button")].find((b) => b.textContent === "다시 들어가기")?.click();
    await vi.waitFor(() => expect(location.hash).toBe("#/auth?s=again"));
    // query(쓰던 단계)는 버리고 화면 주소만 — 단계는 서버·기기 사본에서 되살린다
    expect(sessionStorage.getItem("returnTo")).toBe("write/2026-10-16");
  });

  it("열쇠 로그인 요청의 401(invalid_key)은 로그인 풀림으로 보지 않는다", async () => {
    initController();
    app.authenticated = false;
    stubFetch(() => ({ status: 401, body: { error: "invalid_key" } }));
    const result = await request("POST", "/api/session", { body: { key: "x" } });
    expect(result.ok).toBe(false);
    expect(document.querySelector(".sheet")).toBeNull();
    expect(layer()).toBeNull();
  });
});

describe("세션 확인", () => {
  it("잠긴 세션이 아니면 잠금 층이 없다(GET /api/session은 잠금 처리기를 건드리지 않는다)", async () => {
    initController();
    app.locked = false;
    stubFetch(() => session());
    const { fetchSession } = await import("../../client/src/state");
    await fetchSession();
    expect(layer()).toBeNull();
    expect(app.locked).toBe(false);
  });
});
