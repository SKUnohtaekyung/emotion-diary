/// <reference path="../../client/src/env.d.ts" />
// 앱 잠금 설정 화면(UX_SPEC §15): 들어올 때 받은 세션 답이 '잠김'이면 다음 요청을 기다리지 않고 잠금 층을 올린다(서버의 5분 규칙).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initController } from "../../client/src/controller";
import { setApiHandlers } from "../../client/src/lib/api";
import { navigate, registerViews, resetRouterForTest, startRouter, type ViewContext } from "../../client/src/router";
import { app } from "../../client/src/state";
import { hideLockLayer, isLockLayerShown } from "../../client/src/ui/lockLayer";
import { resetSheetsForTest } from "../../client/src/ui/sheet";
import { renderLockSettings } from "../../client/src/views/lockSettings";
import { mountShell, session, stubFetch } from "./helpers";

const stubView = (context: ViewContext) => {
  context.root.append(document.createElement("h1"));
  return () => {};
};

beforeEach(() => {
  mountShell();
  sessionStorage.clear();
  history.replaceState(null, "", "/#/today");
  resetRouterForTest();
  resetSheetsForTest();
  registerViews({ auth: stubView, today: stubView, "settings/lock": renderLockSettings });
  startRouter();
  initController();
  Object.assign(app, { authenticated: true, locked: false, appLock: true, hasName: true, name: "시험" });
});

afterEach(() => {
  hideLockLayer();
  setApiHandlers(null);
  resetRouterForTest();
  vi.unstubAllGlobals();
});

describe("앱 잠금 설정", () => {
  it("들어올 때 서버가 이 기기를 잠겼다고 하면 바로 잠금 층을 올린다", async () => {
    stubFetch(() => session({ appLock: true, locked: true }));
    navigate("#/settings/lock");
    await vi.waitFor(() => expect(isLockLayerShown()).toBe(true));
    expect(app.locked).toBe(true);
  });

  it("잠기지 않았으면 스위치가 켜짐으로 보인다", async () => {
    const calls = stubFetch(() => session({ appLock: true, locked: false }));
    navigate("#/settings/lock");
    await vi.waitFor(() => expect(calls.some((call) => call.path === "/api/session")).toBe(true));
    expect(isLockLayerShown()).toBe(false);
    expect(document.querySelector('[role="switch"]')?.getAttribute("aria-checked")).toBe("true");
  });

  it("잠금이 켜져 있을 때만 '지금 잠그기'가 있고, 누르면 잠금을 청하고 잠금 층이 뜬다(오늘 화면에서 옮겨 옴, A-10)", async () => {
    const calls = stubFetch((request) => (request.path === "/api/session" ? session({ appLock: true, locked: false }) : { status: 204 }));
    navigate("#/settings/lock");
    await vi.waitFor(() => expect(calls.some((call) => call.path === "/api/session")).toBe(true));
    const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent === "지금 잠그기");
    expect(button?.hidden).toBe(false);
    button?.click();
    await vi.waitFor(() => expect(isLockLayerShown()).toBe(true));
    expect(calls.map((call) => `${call.method} ${call.path}`)).toContain("POST /api/app-lock/lock");
  });
});
