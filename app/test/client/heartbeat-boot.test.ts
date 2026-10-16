/// <reference path="../../client/src/env.d.ts" />
// 화면 신호(T3 A-16, ARCHITECTURE §6)와 시작 흐름(T3 A-15). 신호는 로그인됨·잠기지 않음·보이는 동안 1분마다 가고,
// 숨거나 잠기면 멈추며, 열쇠로 들어온 순간부터 시작한다. 시작은 '새로 켠 것'으로 보이면 잠금을 청하고 그 뒤에 표식을 심는다.
// 서버는 가짜 fetch다. 시험의 열쇠는 이 파일 안에서 만든 가짜 값이다.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HEARTBEAT_MS } from "../../shared/api";
import { boot, initController } from "../../client/src/controller";
import { isHeartbeatRunning, stopHeartbeat, syncHeartbeat } from "../../client/src/heartbeat";
import { setApiHandlers } from "../../client/src/lib/api";
import { registerViews, render, resetRouterForTest, type ViewContext } from "../../client/src/router";
import { app } from "../../client/src/state";
import { hideLockLayer, isLockLayerShown } from "../../client/src/ui/lockLayer";
import { resetSheetsForTest } from "../../client/src/ui/sheet";
import { renderAuth } from "../../client/src/views/auth";
import { mountShell, session, setVisibility, stubFetch } from "./helpers";

const FAKE_KEY = "fake-key-for-heartbeat-test";

const stubView = (context: ViewContext) => {
  context.root.append(document.createElement("h1"));
  return () => {};
};

const beats = (calls: Array<{ method: string; path: string }>) =>
  calls.filter((call) => call.method === "POST" && call.path === "/api/session/heartbeat").length;

function navType(type: string | undefined): void {
  vi.spyOn(performance, "getEntriesByType").mockReturnValue(type === undefined ? [] : ([{ type }] as unknown as PerformanceEntryList));
}

beforeEach(() => {
  mountShell();
  sessionStorage.clear();
  localStorage.clear();
  history.replaceState(null, "", "/#/today");
  resetRouterForTest();
  resetSheetsForTest();
  registerViews({ auth: renderAuth, today: stubView, "auth/name": stubView, "settings/pin": stubView, "settings/lock": stubView });
  initController();
  setVisibility("visible");
  Object.assign(app, { authenticated: true, locked: false, appLock: false, hasName: true, name: "시험" });
});

afterEach(() => {
  stopHeartbeat();
  hideLockLayer();
  setApiHandlers(null);
  resetRouterForTest();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("화면 신호", () => {
  it("로그인됨·잠기지 않음·보이는 동안 1분마다 보낸다", async () => {
    vi.useFakeTimers();
    const calls = stubFetch(() => ({ status: 204 }));
    syncHeartbeat();
    expect(isHeartbeatRunning()).toBe(true);
    await vi.advanceTimersByTimeAsync(HEARTBEAT_MS - 1);
    expect(beats(calls)).toBe(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(beats(calls)).toBe(1);
    await vi.advanceTimersByTimeAsync(HEARTBEAT_MS * 2);
    expect(beats(calls)).toBe(3);
  });

  it("화면이 숨으면 보내지 않고 멈춘다", async () => {
    vi.useFakeTimers();
    const calls = stubFetch(() => ({ status: 204 }));
    syncHeartbeat();
    setVisibility("hidden");
    await vi.advanceTimersByTimeAsync(HEARTBEAT_MS * 3);
    expect(beats(calls)).toBe(0);
    expect(isHeartbeatRunning()).toBe(false);
  });

  it("로그인 전이거나 잠겼으면 시작하지 않는다", () => {
    stubFetch(() => ({ status: 204 }));
    Object.assign(app, { authenticated: false });
    syncHeartbeat();
    expect(isHeartbeatRunning()).toBe(false);
    Object.assign(app, { authenticated: true, locked: true });
    syncHeartbeat();
    expect(isHeartbeatRunning()).toBe(false);
  });

  it("신호가 423을 받으면 잠금 층을 올리고 멈춘다", async () => {
    vi.useFakeTimers();
    stubFetch((request) => (request.path === "/api/session/heartbeat" ? { status: 423, body: { error: "app_locked" } } : { status: 204 }));
    syncHeartbeat();
    await vi.advanceTimersByTimeAsync(HEARTBEAT_MS);
    expect(isLockLayerShown()).toBe(true);
    expect(isHeartbeatRunning()).toBe(false);
  });

  it("열쇠로 들어온 순간부터 신호를 시작한다(첫 백그라운드 전환을 기다리지 않는다)", async () => {
    Object.assign(app, { authenticated: false, hasName: false, name: null });
    stubFetch((request) => {
      if (request.method === "POST" && request.path === "/api/session") return { status: 200, body: { ok: true } };
      if (request.path === "/api/session") return session({ appLock: true, locked: false, hasName: true });
      return { status: 204 };
    });
    history.replaceState(null, "", "/#/auth");
    render();
    const key = document.getElementById("access-key") as HTMLInputElement;
    key.value = FAKE_KEY;
    document.querySelector("form")?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    await vi.waitFor(() => expect(location.hash).toBe("#/today"));
    expect(isHeartbeatRunning()).toBe(true);
  });
});

describe("시작(boot)", () => {
  it("새로 켠 것으로 보이면(navigate, 표식 없음) 잠금을 청하고 잠금 층을 올린 뒤 표식을 심는다", async () => {
    navType("navigate");
    const calls = stubFetch((request) => (request.path === "/api/session" ? session({ appLock: true, locked: false }) : { status: 204 }));
    expect(sessionStorage.getItem("alive")).toBeNull();
    await boot();
    expect(calls.some((call) => call.method === "POST" && call.path === "/api/app-lock/lock")).toBe(true);
    expect(isLockLayerShown()).toBe(true);
    expect(sessionStorage.getItem("alive")).toBe("1");
    expect(isHeartbeatRunning()).toBe(false); // 잠긴 동안에는 신호가 없다
  });

  it("같은 탭에서 다시 시작하면(표식 있음) 잠금을 청하지 않고 신호를 시작한다", async () => {
    navType("navigate");
    sessionStorage.setItem("alive", "1");
    const calls = stubFetch((request) => (request.path === "/api/session" ? session({ appLock: true, locked: false }) : { status: 204 }));
    await boot();
    expect(calls.some((call) => call.path === "/api/app-lock/lock")).toBe(false);
    expect(isLockLayerShown()).toBe(false);
    expect(isHeartbeatRunning()).toBe(true);
  });

  it("서버가 이미 잠겼다고 하면 잠금 층부터다", async () => {
    navType("reload");
    stubFetch(() => session({ appLock: true, locked: true }));
    await boot();
    expect(isLockLayerShown()).toBe(true);
  });

  it("로그인 전이면 판단하지 않고 열쇠 화면으로 간다", async () => {
    navType("navigate");
    Object.assign(app, { authenticated: false });
    const calls = stubFetch(() => ({ status: 200, body: { authenticated: false, env: "dev", build: "test-build", compat: 1 } }));
    await boot();
    expect(calls.some((call) => call.path === "/api/app-lock/lock")).toBe(false);
    expect(location.hash).toBe("#/auth?s=again");
    expect(isHeartbeatRunning()).toBe(false);
  });
});
