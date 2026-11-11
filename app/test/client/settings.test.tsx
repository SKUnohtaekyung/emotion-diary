/// <reference path="../../client/src/env.d.ts" />
// 설정 목록(TASK-REFLECT-01 R-5, D-129) — 하위 화면이 있는 줄만, 줄은 그 화면으로, 로그아웃은 확인 시트, 하단 탐색은 이 화면에서 보인다.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerViews, render, resetRouterForTest, startRouter, type ViewContext } from "../../client/src/router";
import { app } from "../../client/src/state";
import { resetBottomNavForTest } from "../../client/src/ui/bottomNav";
import { resetSheetsForTest } from "../../client/src/ui/sheet";
import { renderSettings } from "../../client/src/views/settings";
import { flush, mountShell } from "./helpers";
import { readSource } from "./source";

const stub = (context: ViewContext) => {
  context.root.append(document.createElement("h1"));
  return () => {};
};

beforeEach(() => {
  mountShell();
  const nav = readSource("../../client/index.html").match(/<nav id="bottom-nav"[\s\S]*?<\/nav>/)?.[0] ?? "";
  document.body.insertAdjacentHTML("beforeend", nav);
  resetRouterForTest();
  resetSheetsForTest();
  resetBottomNavForTest();
  Object.assign(app, { authenticated: true, locked: false, appLock: true, hasName: true, name: "시험" });
  registerViews({ settings: renderSettings, "settings/lock": stub, "settings/export": stub, "settings/delete": stub, help: stub });
  startRouter();
  history.replaceState(null, "", "/#/settings");
  render();
});

afterEach(() => {
  resetRouterForTest();
  vi.unstubAllGlobals();
});

const rows = () => [...document.querySelectorAll<HTMLButtonElement>(".st-row")];

describe("설정 목록", () => {
  it("제목·나의 돌 머리(부를 이름)·하위 화면이 있는 줄만 — 없는 기능(알림·하루 기준 시각·개인정보 안내·AI)은 말하지 않는다", () => {
    expect(document.querySelector("h1")?.textContent).toBe("설정");
    expect(document.querySelector(".st-me-text b")?.textContent).toBe("시험의 기록 공간");
    expect(rows().map((row) => row.textContent?.trim())).toEqual(["앱 잠금 켜짐", "내 기록 내보내기", "도움이 필요할 때", "로그아웃"]);
    expect([...document.querySelectorAll(".st-group-head")].map((node) => node.textContent)).toEqual(["내 기록 지키기", "도움과 안내", "계정"]);
    expect(document.body.textContent).not.toMatch(/알림|하루 기준 시각|개인정보 안내|AI/);
    expect((document.getElementById("bottom-nav") as HTMLElement).hidden).toBe(false);
    expect(document.querySelector('#bottom-nav a[aria-current="page"]')?.getAttribute("data-tab")).toBe("settings");
  });

  it("줄은 그 화면으로, 모든 기록 지우기는 맨 아래 빨간 줄", () => {
    rows()[0]?.click();
    expect(location.hash).toBe("#/settings/lock");
    history.replaceState(null, "", "/#/settings");
    render();
    rows()[1]?.click();
    expect(location.hash).toBe("#/settings/export");
    history.replaceState(null, "", "/#/settings");
    render();
    rows()[2]?.click();
    expect(location.hash).toBe("#/help");
    history.replaceState(null, "", "/#/settings");
    render();
    document.querySelector<HTMLButtonElement>(".st-delete-row")?.click();
    expect(location.hash).toBe("#/settings/delete");
  });

  it("로그아웃은 확인 시트를 먼저 연다", async () => {
    rows()[3]?.click();
    await flush(10);
    expect(document.querySelector(".sheet-title")?.textContent).toBe("로그아웃할까요?");
  });
});
