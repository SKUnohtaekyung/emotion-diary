/// <reference path="../../client/src/env.d.ts" />
// 기록 규칙(UX_SPEC §17, T3 A-4): 열쇠 화면은 로그인 뒤 replace로 사라지고, 하위 화면은 push이며, 시트가 열려 있을 때 밀면 시트만 닫힌다.
import { beforeEach, describe, expect, it } from "vitest";
import { back, backThenReplace, navigate, registerViews, render, resetRouterForTest, startRouter, type ViewContext } from "../../client/src/router";
import { app } from "../../client/src/state";
import { closeSheet, openSheet, resetSheetsForTest } from "../../client/src/ui/sheet";
import { flush, mountShell } from "./helpers";

const rendered: string[] = [];

const fakeView = (name: string) => (context: ViewContext) => {
  rendered.push(name);
  const heading = document.createElement("h1");
  heading.textContent = name;
  context.root.append(heading);
  return () => {};
};

function signIn(): void {
  Object.assign(app, { authenticated: true, hasName: true, name: "시험" });
}

beforeEach(() => {
  mountShell();
  resetRouterForTest();
  resetSheetsForTest();
  rendered.length = 0;
  sessionStorage.clear();
  localStorage.clear();
  Object.assign(app, { authenticated: false, locked: false, appLock: false, hasName: false, name: null });
  history.replaceState(null, "", "/");
  registerViews({
    auth: fakeView("auth"),
    "auth/name": fakeView("auth/name"),
    welcome: fakeView("welcome"),
    today: fakeView("today"),
    "settings/lock": fakeView("settings/lock"),
    "settings/pin": fakeView("settings/pin")
  });
  startRouter();
});

describe("로그인 전에는 열쇠 화면만 열린다", () => {
  it("어떤 주소로 와도 열쇠 화면이고, 돌아갈 화면 이름만 sessionStorage에 둔다", () => {
    history.replaceState(null, "", "/#/today");
    render();
    expect(location.hash).toBe("#/auth?s=again");
    expect(rendered).toEqual(["auth"]);
    expect(sessionStorage.getItem("returnTo")).toBe("today");

    sessionStorage.clear();
    history.replaceState(null, "", "/#/settings/lock?token=ignored");
    render();
    // 화면 이름만 둔다 — query(열쇠 같은 값)는 버린다
    expect(sessionStorage.getItem("returnTo")).toBe("settings/lock");
    expect(sessionStorage.getItem("returnTo")).not.toContain("token");
  });

  it("주소가 비었거나 지나가는 화면이면 돌아갈 곳 없이 열쇠 화면", () => {
    render();
    expect(location.hash).toBe("#/auth");
    expect(sessionStorage.getItem("returnTo")).toBeNull();
    history.replaceState(null, "", "/#/welcome");
    render();
    expect(location.hash).toBe("#/auth");
    expect(sessionStorage.getItem("returnTo")).toBeNull();
  });
});

describe("열쇠 화면은 로그인 뒤 replace로 사라진다", () => {
  it("기록 칸을 더하지 않고, 들어온 뒤 뒤로 밀어도 열쇠 화면으로 돌아가지 않는다", async () => {
    history.replaceState(null, "", "/#/earlier");
    history.pushState(null, "", "#/auth");
    render();
    expect(rendered).toEqual(["auth"]);
    const length = history.length;

    signIn();
    navigate("#/today", { replace: true });
    expect(history.length).toBe(length);
    expect(location.hash).toBe("#/today");
    const afterLogin = rendered.length;

    history.back();
    await flush(20);
    expect(location.hash).not.toBe("#/auth");
    expect(rendered.slice(afterLogin)).not.toContain("auth");
  });

  it("로그인된 사람이 열쇠 화면 주소로 오면 오늘(이름이 없으면 이름 화면)로 바꿔친다", () => {
    signIn();
    history.replaceState(null, "", "/#/auth");
    render();
    expect(location.hash).toBe("#/today");
    Object.assign(app, { hasName: false, name: null });
    history.replaceState(null, "", "/#/today");
    render();
    expect(location.hash).toBe("#/auth/name");
  });
});

describe("하위 화면은 push이고 ‹ 뒤로는 밀어서 뒤로와 같다", () => {
  it("push한 하위 화면에서 back()은 history.back()과 같은 결과다", async () => {
    signIn();
    history.replaceState(null, "", "/#/today");
    render();
    const length = history.length;
    navigate("#/settings/lock");
    expect(history.length).toBe(length + 1);
    expect(rendered.at(-1)).toBe("settings/lock");

    back("#/today");
    await flush(20);
    expect(location.hash).toBe("#/today");
    expect(rendered.at(-1)).toBe("today");

    navigate("#/settings/lock");
    history.back(); // 화면 왼쪽 끝을 미는 것
    await flush(20);
    expect(location.hash).toBe("#/today");
    expect(rendered.at(-1)).toBe("today");
  });

  it("앱 안에서 쌓은 칸이 아니면 back()은 기록을 더하지 않고 fallback으로 바꿔친다", () => {
    signIn();
    history.replaceState(null, "", "/#/settings/lock");
    render();
    const length = history.length;
    back("#/today");
    expect(location.hash).toBe("#/today");
    expect(history.length).toBe(length);
  });

  it("지나가면 사라지는 화면: 뒤로 갔다가 도착한 칸을 바꿔쳐 한 번만 그린다", async () => {
    signIn();
    history.replaceState(null, "", "/#/welcome");
    render();
    navigate("#/settings/pin?from=welcome");
    const length = history.length;
    expect(rendered).toEqual(["welcome", "settings/pin"]);

    backThenReplace("#/today");
    await flush(20);
    expect(location.hash).toBe("#/today");
    // 가운데 '반가워요'를 다시 그리지 않는다
    expect(rendered).toEqual(["welcome", "settings/pin", "today"]);
    // 기록 칸이 늘지 않는다(되돌아간 칸을 바꿔쳤을 뿐이다)
    expect(history.length).toBeLessThanOrEqual(length);
  });
});

describe("시트가 열려 있을 때 밀면 시트만 닫힌다", () => {
  const open = (opener?: HTMLElement) =>
    openSheet({ id: "check", title: "확인", body: ["본문"], actions: [{ label: "닫기", kind: "quiet" }], opener });

  it("열 때 같은 주소로 한 칸 쌓고, popstate가 오면 시트만 닫고 화면은 다시 그리지 않는다", () => {
    signIn();
    history.replaceState(null, "", "/#/today");
    render();
    const length = history.length;
    const drawn = rendered.length;

    open();
    expect(history.length).toBe(length + 1);
    expect(history.state).toEqual({ sheet: "check" });
    expect(location.hash).toBe("#/today");
    expect(document.querySelector(".sheet")).not.toBeNull();
    // 시트 밖은 누를 수도 초점이 가지도 않는다
    expect(document.getElementById("app")?.hasAttribute("inert")).toBe(true);
    expect(document.getElementById("live")?.hasAttribute("inert")).toBe(false);

    window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
    expect(document.querySelector(".sheet")).toBeNull();
    expect(document.getElementById("app")?.hasAttribute("inert")).toBe(false);
    expect(rendered.length).toBe(drawn);
    expect(location.hash).toBe("#/today");
  });

  it("실제로 뒤로 가도(밀기) 시트만 닫히고, 닫기 버튼도 같은 길이다", async () => {
    signIn();
    history.replaceState(null, "", "/#/today");
    render();
    const drawn = rendered.length;

    open();
    history.back();
    await flush(20);
    expect(document.querySelector(".sheet")).toBeNull();
    expect(rendered.length).toBe(drawn);
    expect(location.hash).toBe("#/today");

    open();
    document.querySelector<HTMLButtonElement>(".sheet button")?.click();
    await flush(20);
    expect(document.querySelector(".sheet")).toBeNull();
    expect(rendered.length).toBe(drawn);
    expect(location.hash).toBe("#/today");
  });

  it("열면 첫 버튼에 초점이 가고, 닫으면 연 버튼으로 돌아간다", async () => {
    signIn();
    history.replaceState(null, "", "/#/today");
    render();
    const opener = document.createElement("button");
    document.getElementById("app")?.append(opener);
    open(opener);
    expect(document.activeElement).toBe(document.querySelector(".sheet button"));
    await closeSheet();
    expect(document.activeElement).toBe(opener);
  });
});

describe("잠금 층 아래에는 그리지 않는다", () => {
  it("잠겨 있는 동안 render()는 화면을 그리지 않고, 풀린 뒤 그린다", () => {
    signIn();
    history.replaceState(null, "", "/#/today");
    app.locked = true;
    render();
    expect(rendered).toEqual([]);
    app.locked = false;
    render();
    expect(rendered).toEqual(["today"]);
  });
});
