/// <reference path="../../client/src/env.d.ts" />
// 앱 잠금 설정과 비밀번호 정하기(UX_SPEC §15): 두 번 눌러 같으면 저장, 지금 비밀번호가 필요하면 숲 장면으로 받는다.
// 시험의 비밀번호는 이 파일 안에서 만든 가짜 숫자다.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { navigate, registerViews, render, resetRouterForTest, startRouter, type ViewContext } from "../../client/src/router";
import { app } from "../../client/src/state";
import { resetSheetsForTest } from "../../client/src/ui/sheet";
import { clearToasts } from "../../client/src/ui/toast";
import { renderLockSettings } from "../../client/src/views/lockSettings";
import { PIN_FORGOT_OFF_FAILED, renderPinSetup } from "../../client/src/views/pinSetup";
import { flush, mountShell, session, stubFetch, type FakeHandler } from "./helpers";

const NEW_PIN = "1357";
const CURRENT_PIN = "2468";
const drawn: string[] = [];

const stub = (name: string) => (context: ViewContext) => {
  drawn.push(name);
  const heading = document.createElement("h1");
  heading.textContent = name;
  context.root.append(heading);
  return () => {};
};

function press(digits: string): void {
  for (const digit of digits) {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: digit, bubbles: true, cancelable: true }));
  }
}

const title = () => document.querySelector(".scene-title")?.textContent;
const toast = () => document.querySelector(".toast")?.textContent;
const status = () => document.querySelector(".pin-status")?.textContent;
const summary = (calls: { method: string; path: string }[]) => calls.map((call) => `${call.method} ${call.path}`);
/** 화면을 옮기면 설정 화면이 세션을 다시 확인하므로, 저장 요청만 가려 본다 */
const writes = <T extends { method: string }>(calls: T[]) => calls.filter((call) => call.method !== "GET");

beforeEach(() => {
  mountShell();
  localStorage.clear();
  sessionStorage.clear();
  drawn.length = 0;
  resetRouterForTest();
  resetSheetsForTest();
  Object.assign(app, { authenticated: true, locked: false, appLock: false, hasName: true, name: "시험" });
  registerViews({
    today: stub("today"),
    welcome: stub("welcome"),
    "settings/lock": renderLockSettings,
    "settings/pin": renderPinSetup
  });
  startRouter();
});

afterEach(() => {
  clearToasts();
  resetRouterForTest();
  vi.unstubAllGlobals();
});

describe("비밀번호 정하기", () => {
  const accept: FakeHandler = () => ({ status: 200, body: { appLock: true } });

  it("네 자리를 두 번 눌러 같으면 PUT /api/app-lock — '잠금을 걸었어요'", async () => {
    const calls = stubFetch(accept);
    history.replaceState(null, "", "/#/settings/pin");
    render();
    expect(title()).toBe("비밀번호 네 자리를 정해요");
    expect(document.querySelector(".scene-note")?.textContent).toBe("앱을 켤 때와 잠시 떠났다 돌아올 때 물어요.");

    press(NEW_PIN);
    await vi.waitFor(() => expect(title()).toBe("한 번 더 눌러 주세요"));
    expect(document.querySelector(".scene-note")?.textContent).toBe("같은 숫자를 눌러 확인해요.");
    expect(calls).toHaveLength(0); // 한 번만으로는 보내지 않는다

    press(NEW_PIN);
    await vi.waitFor(() => expect(writes(calls)).toHaveLength(1));
    expect(writes(calls)[0]).toMatchObject({ method: "PUT", path: "/api/app-lock", body: { pin: NEW_PIN } });
    await vi.waitFor(() => expect(location.hash).toBe("#/settings/lock"));
    expect(toast()).toBe("잠금을 걸었어요");
    expect(app.appLock).toBe(true);
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain(NEW_PIN);
  });

  it("이미 걸려 있으면 바꾸는 것이다 — '비밀번호를 바꿨어요'", async () => {
    app.appLock = true;
    stubFetch(accept);
    history.replaceState(null, "", "/#/settings/pin");
    render();
    press(NEW_PIN);
    await vi.waitFor(() => expect(title()).toBe("한 번 더 눌러 주세요"));
    press(NEW_PIN);
    await vi.waitFor(() => expect(toast()).toBe("비밀번호를 바꿨어요"));
  });

  it("두 번이 다르면 안내하고 처음부터 다시, 서버로 보내지 않는다", async () => {
    const calls = stubFetch(accept);
    history.replaceState(null, "", "/#/settings/pin");
    render();
    press(NEW_PIN);
    await vi.waitFor(() => expect(title()).toBe("한 번 더 눌러 주세요"));
    press("9999");
    await vi.waitFor(() => expect(status()).toBe("두 번이 서로 달라요. 처음부터 다시 정해요."));
    expect(title()).toBe("비밀번호 네 자리를 정해요");
    expect(calls).toHaveLength(0);
    expect(document.querySelector(".pin-dots")?.classList.contains("shake")).toBe(true);
  });

  it("지금 비밀번호가 필요하면(422 pin_required) 숲 장면으로 받고 currentPin을 더해 다시 보낸다", async () => {
    app.appLock = true;
    const calls = stubFetch((request) => {
      const body = request.body as { currentPin?: string } | undefined;
      return body?.currentPin === CURRENT_PIN ? { status: 200, body: { appLock: true } } : { status: 422, body: { error: "pin_required" } };
    });
    history.replaceState(null, "", "/#/settings/pin");
    render();
    press(NEW_PIN);
    await vi.waitFor(() => expect(title()).toBe("한 번 더 눌러 주세요"));
    press(NEW_PIN);
    await vi.waitFor(() => expect(document.querySelector(".scene-overlay")).not.toBeNull());
    expect(document.querySelector(".scene-overlay .scene-title")?.textContent).toBe("지금 비밀번호를 눌러 주세요");

    press(CURRENT_PIN);
    await vi.waitFor(() => expect(toast()).toBe("비밀번호를 바꿨어요"));
    expect(writes(calls)).toHaveLength(2);
    expect(writes(calls)[1]?.body).toEqual({ pin: NEW_PIN, currentPin: CURRENT_PIN });
    expect(document.querySelector(".scene-overlay")).toBeNull();
  });

  it("지금 비밀번호 장면을 닫으면 처음부터 다시 정한다", async () => {
    app.appLock = true;
    stubFetch(() => ({ status: 422, body: { error: "pin_required" } }));
    history.replaceState(null, "", "/#/settings/pin");
    render();
    press(NEW_PIN);
    await vi.waitFor(() => expect(title()).toBe("한 번 더 눌러 주세요"));
    press(NEW_PIN);
    await vi.waitFor(() => expect(document.querySelector(".scene-overlay")).not.toBeNull());
    document.querySelector<HTMLButtonElement>(".scene-overlay .scene-back")?.click();
    await vi.waitFor(() => expect(document.querySelector(".scene-overlay")).toBeNull());
    expect(title()).toBe("비밀번호 네 자리를 정해요");
  });

  it("반가워요에서 정하면 반가워요를 기록에서 지우고 오늘로 간다", async () => {
    stubFetch(accept);
    history.replaceState(null, "", "/#/welcome");
    render();
    navigate("#/settings/pin?from=welcome");
    press(NEW_PIN);
    await vi.waitFor(() => expect(title()).toBe("한 번 더 눌러 주세요"));
    press(NEW_PIN);
    await vi.waitFor(() => expect(location.hash).toBe("#/today"));
    // 가운데 반가워요를 다시 그리지 않는다
    expect(drawn).toEqual(["welcome", "today"]);
    expect(toast()).toBe("잠금을 걸었어요");
  });
});

describe("비밀번호를 잊고 들어온 직후(from=forgot)", () => {
  it("정하면 잠금을 끄지 않고 오늘로 바꿔친다", async () => {
    const calls = stubFetch(() => ({ status: 200, body: { appLock: true } }));
    history.replaceState(null, "", "/#/settings/pin?from=forgot");
    render();
    press(NEW_PIN);
    await vi.waitFor(() => expect(title()).toBe("한 번 더 눌러 주세요"));
    press(NEW_PIN);
    await vi.waitFor(() => expect(location.hash).toBe("#/today"));
    await flush(20);
    expect(summary(writes(calls))).toEqual(["PUT /api/app-lock"]);
  });

  it("정하지 않고 ‹로 나가면 DELETE /api/app-lock 뒤 오늘로", async () => {
    const calls = stubFetch(() => ({ status: 200, body: { appLock: false } }));
    history.replaceState(null, "", "/#/settings/pin?from=forgot");
    render();
    document.querySelector<HTMLButtonElement>(".scene-back")?.click();
    await vi.waitFor(() => expect(summary(calls)).toEqual(["DELETE /api/app-lock"]));
    expect(location.hash).toBe("#/today");
  });

  it("밀어서 나가도 같다(화면을 떠나는 자리에서 처리한다)", async () => {
    const calls = stubFetch(() => ({ status: 200, body: { appLock: false } }));
    history.replaceState(null, "", "/#/settings/pin?from=forgot");
    render();
    history.replaceState(null, "", "/#/today");
    render();
    await vi.waitFor(() => expect(summary(calls)).toEqual(["DELETE /api/app-lock"]));
  });

  it("열쇠 로그인 10분이 지나 서버가 끄기를 거절하면(422) 다시 들어오는 길을 알린다", async () => {
    stubFetch(() => ({ status: 422, body: { error: "pin_required" } }));
    history.replaceState(null, "", "/#/settings/pin?from=forgot");
    render();
    history.replaceState(null, "", "/#/today");
    render();
    await vi.waitFor(() => expect(toast()).toBe(PIN_FORGOT_OFF_FAILED));
  });

  it("같은 화면을 다시 그리는 것(잠금을 풀고 돌아온 뒤 등)은 떠나는 것이 아니다", async () => {
    const calls = stubFetch(() => ({ status: 200, body: { appLock: false } }));
    history.replaceState(null, "", "/#/settings/pin?from=forgot");
    render();
    render();
    await flush(20);
    expect(calls).toHaveLength(0);
  });
});

describe("앱 잠금 설정", () => {
  const withLock = (on: boolean, rest: FakeHandler = () => ({ status: 200, body: { appLock: false } })): FakeHandler =>
    (request) => (request.path === "/api/session" ? session({ appLock: on }) : rest(request));

  const toggle = () => document.querySelector<HTMLButtonElement>("button[role=switch]");
  const change = () => [...document.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent === "비밀번호 바꾸기");

  it("구조: 스위치(role=switch), 바꾸기는 꺼져 있으면 비활성, 설명 두 줄", () => {
    stubFetch(withLock(false));
    history.replaceState(null, "", "/#/settings/lock");
    render();
    expect(document.querySelector("h1")?.textContent).toBe("앱 잠금");
    expect(toggle()?.getAttribute("aria-checked")).toBe("false");
    expect(document.getElementById(toggle()?.getAttribute("aria-labelledby") ?? "")?.textContent).toBe("비밀번호로 잠그기");
    expect(change()?.disabled).toBe(true);
    expect(document.body.textContent).toContain("앱을 켤 때와 5분 넘게 떠났다 돌아올 때 비밀번호를 물어요.");
    expect(document.body.textContent).toContain("비밀번호를 잊으면 열쇠로 다시 들어와 새로 정해요.");
    expect(document.querySelector(".back-button")?.textContent).toContain("뒤로");
  });

  it("세션을 확인했더니 로그인이 풀려 있으면 열쇠 화면으로 보내고 돌아올 곳을 기억한다", async () => {
    stubFetch((request) => (request.path === "/api/session" ? session({ authenticated: false }) : { status: 200, body: {} }));
    history.replaceState(null, "", "/#/settings/lock");
    render();
    await vi.waitFor(() => expect(location.hash).toBe("#/auth?s=again"));
    expect(sessionStorage.getItem("returnTo")).toBe("settings/lock");
    expect(app.authenticated).toBe(false);
  });

  it("켜기 → 비밀번호 정하기로 push", async () => {
    stubFetch(withLock(false));
    history.replaceState(null, "", "/#/settings/lock");
    render();
    const length = history.length;
    toggle()?.click();
    expect(location.hash).toBe("#/settings/pin");
    expect(history.length).toBe(length + 1);
  });

  it("끄기 → DELETE /api/app-lock(본문 없이) — '잠금을 껐어요'", async () => {
    app.appLock = true;
    const calls = stubFetch(withLock(true));
    history.replaceState(null, "", "/#/settings/lock");
    render();
    await vi.waitFor(() => expect(toggle()?.getAttribute("aria-checked")).toBe("true"));
    expect(change()?.disabled).toBe(false);
    toggle()?.click();
    await vi.waitFor(() => expect(toast()).toBe("잠금을 껐어요"));
    const call = calls.find((c) => c.method === "DELETE");
    expect(call?.path).toBe("/api/app-lock");
    expect(call?.body).toBeUndefined();
    expect(toggle()?.getAttribute("aria-checked")).toBe("false");
    expect(change()?.disabled).toBe(true);
  });

  it("지금 비밀번호가 필요하면(422 pin_required) 숫자판으로 받고, 틀리면 다시, 맞으면 currentPin으로 끈다", async () => {
    app.appLock = true;
    const calls = stubFetch(
      withLock(true, (request) => {
        const body = request.body as { currentPin?: string } | undefined;
        if (body === undefined) return { status: 422, body: { error: "pin_required" } };
        return body.currentPin === CURRENT_PIN
          ? { status: 200, body: { appLock: false } }
          : { status: 422, body: { error: "wrong_pin", remaining: 4 } };
      })
    );
    history.replaceState(null, "", "/#/settings/lock");
    render();
    await vi.waitFor(() => expect(toggle()?.getAttribute("aria-checked")).toBe("true"));
    toggle()?.click();
    await vi.waitFor(() => expect(document.querySelector(".scene-overlay")).not.toBeNull());

    press("0000");
    await vi.waitFor(() => expect(status()).toBe("맞지 않아요. 다시 눌러 주세요."));
    press(CURRENT_PIN);
    await vi.waitFor(() => expect(toast()).toBe("잠금을 껐어요"));
    const deletes = calls.filter((c) => c.method === "DELETE");
    expect(deletes.map((c) => c.body)).toEqual([undefined, { currentPin: "0000" }, { currentPin: CURRENT_PIN }]);
    expect(document.querySelector(".scene-overlay")).toBeNull();
    expect(app.appLock).toBe(false);
  });
});
