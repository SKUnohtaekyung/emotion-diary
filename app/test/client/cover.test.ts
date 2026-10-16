/// <reference path="../../client/src/env.d.ts" />
// 덮개(D-113 ①): 숨는 순간 같은 이벤트 처리기 안에서 동기로 붙고, 다시 보였을 때 잠기지 않았으면 걷힌다.
// 잠겼으면 잠금 층이 먼저 올라온 뒤에 걷혀서 그 사이에 내용이 비치지 않는다. 서버는 가짜 fetch다.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initController } from "../../client/src/controller";
import { installLifecycle } from "../../client/src/lifecycle";
import { resetRouterForTest } from "../../client/src/router";
import { app } from "../../client/src/state";
import { hideCover } from "../../client/src/ui/cover";
import { hideLockLayer } from "../../client/src/ui/lockLayer";
import { resetSheetsForTest } from "../../client/src/ui/sheet";
import { setApiHandlers } from "../../client/src/lib/api";
import { flush, mountShell, session, setVisibility, stubFetch } from "./helpers";

let dispose: () => void;

const hide = () => {
  setVisibility("hidden");
  document.dispatchEvent(new Event("visibilitychange"));
};
const show = () => {
  setVisibility("visible");
  document.dispatchEvent(new Event("visibilitychange"));
};
const cover = () => document.querySelector(".cover");

beforeEach(() => {
  mountShell();
  localStorage.clear();
  sessionStorage.clear();
  history.replaceState(null, "", "/#/today");
  resetRouterForTest();
  resetSheetsForTest();
  Object.assign(app, { authenticated: true, locked: false, appLock: false, hasName: true, name: "시험" });
  setVisibility("visible");
  dispose = installLifecycle();
});

afterEach(() => {
  dispose();
  hideCover();
  hideLockLayer();
  setApiHandlers(null);
  vi.unstubAllGlobals();
});

describe("덮개", () => {
  it("visibilitychange hidden에서 동기로 붙고, 시각 숫자만 기록한다", () => {
    const calls = stubFetch(() => session());
    expect(cover()).toBeNull();
    hide();
    // await 없이 바로 — 같은 이벤트 처리기 안에서 붙어야 한다
    expect(cover()).not.toBeNull();
    expect(cover()?.getAttribute("aria-hidden")).toBe("true");
    expect(localStorage.getItem("lastHiddenAt")).toMatch(/^\d+$/);
    expect(calls).toHaveLength(0);
  });

  it("pagehide에서도 붙는다", () => {
    stubFetch(() => session());
    window.dispatchEvent(new Event("pagehide"));
    expect(cover()).not.toBeNull();
  });

  it("visible에서 세션을 확인하고 잠기지 않았으면 걷힌다(잠금과 상관없이 덮었다)", async () => {
    const calls = stubFetch(() => session({ locked: false, appLock: false }));
    hide();
    show();
    await vi.waitFor(() => expect(cover()).toBeNull());
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual(["GET /api/session"]);
    expect(document.getElementById("lock-layer")).toBeNull();
  });

  it("잠겼으면 잠금 층이 올라온 뒤에 걷힌다 — 확인하는 동안 덮개는 그대로다", async () => {
    let coverDuringFetch = false;
    stubFetch(() => {
      coverDuringFetch = cover() !== null;
      return session({ locked: true, appLock: true });
    });
    hide();
    show();
    await vi.waitFor(() => expect(cover()).toBeNull());
    expect(coverDuringFetch).toBe(true);
    const layer = document.getElementById("lock-layer");
    expect(layer).not.toBeNull();
    expect(app.locked).toBe(true);
    // 층 밖은 그리지도 누르지도 못한다
    expect(document.getElementById("app")?.classList.contains("is-covered")).toBe(true);
    expect(document.getElementById("app")?.hasAttribute("inert")).toBe(true);
  });

  it("로그인 전이면 확인 없이 걷힌다(열쇠 화면에 적던 글을 지우지 않는다)", async () => {
    app.authenticated = false;
    const calls = stubFetch(() => session());
    hide();
    show();
    await vi.waitFor(() => expect(cover()).toBeNull());
    expect(calls).toHaveLength(0);
  });

  it("그 사이 로그인이 풀렸으면 열쇠 화면으로 보낸다", async () => {
    stubFetch(() => session({ authenticated: false }));
    hide();
    show();
    await vi.waitFor(() => expect(cover()).toBeNull());
    expect(location.hash).toBe("#/auth?s=again");
    expect(sessionStorage.getItem("returnTo")).toBe("today");
  });

  it("확인하는 사이 다시 숨으면 덮개를 걷지 않는다", async () => {
    stubFetch(async () => {
      await flush(20);
      return session();
    });
    hide();
    show();
    hide();
    await flush(60);
    expect(cover()).not.toBeNull();
  });

  it("서버에 닿지 못하면: 잠금을 켠 사람이 5분 넘게 떠났을 때만 잠금 층을 올린다", async () => {
    app.appLock = true;
    stubFetch(() => "offline");
    hide();
    localStorage.setItem("lastHiddenAt", String(Date.now() - 6 * 60_000));
    show();
    await vi.waitFor(() => expect(cover()).toBeNull());
    expect(document.getElementById("lock-layer")).not.toBeNull();

    hideLockLayer();
    app.locked = false;
    hide();
    localStorage.setItem("lastHiddenAt", String(Date.now() - 60_000));
    show();
    await vi.waitFor(() => expect(cover()).toBeNull());
    expect(document.getElementById("lock-layer")).toBeNull();
  });

  it("덮은 적이 없으면(첫 pageshow 등) 아무것도 하지 않는다", async () => {
    const calls = stubFetch(() => session());
    window.dispatchEvent(new Event("pageshow"));
    await flush(20);
    expect(calls).toHaveLength(0);
  });

  it("423 app_locked를 받으면 어느 요청에서든 잠금 층이 뜬다", async () => {
    initController();
    const { request } = await import("../../client/src/lib/api");
    stubFetch(() => ({ status: 423, body: { error: "app_locked" } }));
    await request("GET", "/api/anything");
    expect(document.getElementById("lock-layer")).not.toBeNull();
    expect(app.locked).toBe(true);
  });
});
