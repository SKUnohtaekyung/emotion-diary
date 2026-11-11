/// <reference path="../../client/src/env.d.ts" />
// 설정 목록(TASK-REFLECT-01 R-5, D-129) — 하위 화면이 있는 줄만, 줄은 그 화면으로, 로그아웃은 확인 시트, 하단 탐색은 이 화면에서 보인다.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerViews, render, resetRouterForTest, startRouter, type ViewContext } from "../../client/src/router";
import { app } from "../../client/src/state";
import { resetBottomNavForTest } from "../../client/src/ui/bottomNav";
import { resetSheetsForTest } from "../../client/src/ui/sheet";
import { renderSettings } from "../../client/src/views/settings";
import { renderDayStart, renderNameChange, renderPrivacy, renderProfile } from "../../client/src/views/settingsSub";
import { flush, mountShell, stubFetch } from "./helpers";
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
  registerViews({
    settings: renderSettings,
    "settings/lock": stub,
    "settings/export": stub,
    "settings/delete": stub,
    "settings/day": renderDayStart,
    "settings/privacy": renderPrivacy,
    "settings/profile": renderProfile,
    "settings/name": renderNameChange,
    help: stub
  });
  startRouter();
  stubFetch((request) => (request.path === "/api/settings/day-start" ? { status: 200, body: { dayStartHour: 4 } } : { status: 204 }));
  history.replaceState(null, "", "/#/settings");
  render();
});

afterEach(() => {
  resetRouterForTest();
  vi.unstubAllGlobals();
});

const rows = () => [...document.querySelectorAll<HTMLButtonElement>(".st-row")];

describe("설정 목록", () => {
  it("제목·나의 돌 머리(내 계정으로)·하위 화면이 있는 줄만 — 없는 기능(알림·AI)은 말하지 않는다", async () => {
    await flush(10);
    expect(document.querySelector("h1")?.textContent).toBe("설정");
    expect(document.querySelector(".st-me-text b")?.textContent).toBe("시험의 기록 공간");
    expect(rows().map((row) => row.textContent?.trim())).toEqual(["하루 기준 시각 새벽 4시", "앱 잠금 켜짐", "개인정보 안내", "내 기록 내보내기", "도움이 필요할 때", "로그아웃"]);
    expect([...document.querySelectorAll(".st-group-head")].map((node) => node.textContent)).toEqual(["기록", "내 기록 지키기", "도움과 안내", "계정"]);
    expect(document.body.textContent).not.toMatch(/알림|AI/);
    expect((document.getElementById("bottom-nav") as HTMLElement).hidden).toBe(false);
    expect(document.querySelector('#bottom-nav a[aria-current="page"]')?.getAttribute("data-tab")).toBe("settings");
  });

  it("줄은 그 화면으로, 모든 기록 지우기는 맨 아래 빨간 줄", () => {
    const go = (index: number, hash: string) => {
      history.replaceState(null, "", "/#/settings");
      render();
      rows()[index]?.click();
      expect(location.hash).toBe(hash);
    };
    go(0, "#/settings/day");
    go(1, "#/settings/lock");
    go(2, "#/settings/privacy");
    go(3, "#/settings/export");
    go(4, "#/help");
    history.replaceState(null, "", "/#/settings");
    render();
    document.querySelector<HTMLButtonElement>(".st-me")?.click();
    expect(location.hash).toBe("#/settings/profile");
    history.replaceState(null, "", "/#/settings");
    render();
    document.querySelector<HTMLButtonElement>(".st-delete-row")?.click();
    expect(location.hash).toBe("#/settings/delete");
  });

  it("로그아웃은 확인 시트를 먼저 연다", async () => {
    rows()[5]?.click();
    await flush(10);
    expect(document.querySelector(".sheet-title")?.textContent).toBe("로그아웃할까요?");
  });
});

describe("설정 하위 화면(TASK-JOURNAL-01 J-9)", () => {
  const open = async (hash: string) => {
    history.replaceState(null, "", `/#${hash}`);
    render();
    await flush(10);
  };
  const pills = () => [...document.querySelectorAll<HTMLButtonElement>(".st-pill")];

  it("하루 기준 시각: 알약 일곱 중 지금 값, 고르면 곧바로 저장하고 예시 줄이 바뀐다 — 실패하면 앞 값으로", async () => {
    let fail = false;
    const calls = stubFetch((request) =>
      request.path === "/api/settings/day-start" && request.method === "GET"
        ? { status: 200, body: { dayStartHour: 4 } }
        : fail
          ? "offline"
          : { status: 200, body: { dayStartHour: 2 } }
    );
    await open("/settings/day");
    expect(pills().map((pill) => pill.textContent)).toEqual(["자정", "새벽 1시", "새벽 2시", "새벽 3시", "새벽 4시", "새벽 5시", "새벽 6시"]);
    // 지금 값은 서버에서 읽은 뒤에 켜진다
    await vi.waitFor(() => expect(pills()[4]?.getAttribute("aria-checked")).toBe("true"));
    expect(document.querySelector(".st-example")?.textContent).toMatch(/^지금 설정이면 새벽 3시에 쓴 기록은 \d+월 \d+일 기록이 돼요\.$/);
    pills()[2]?.click();
    await vi.waitFor(() => expect(calls.find((call) => call.method === "PUT")?.body).toEqual({ dayStartHour: 2 }));
    expect(pills()[2]?.getAttribute("aria-checked")).toBe("true");
    fail = true;
    pills()[0]?.click();
    await flush(10);
    expect(pills()[2]?.getAttribute("aria-checked")).toBe("true");
  });

  it("개인정보 안내: 없는 AI 분석 묶음은 없고 위기 안내로 가는 알약만", async () => {
    await open("/settings/privacy");
    expect([...document.querySelectorAll(".st-info-name")].map((node) => node.textContent)).toEqual(["직접 쓴 기록은 그대로예요", "보관과 지우기", "진단·치료 앱이 아니에요"]);
    expect(document.body.textContent).not.toMatch(/AI/);
    expect(document.querySelector(".st-help-link")?.getAttribute("href")).toBe("#/help");
  });

  it("내 계정 → 부를 이름: 같은 이름이면 저장하지 않고 이유를 알린다, 바꾸면 PUT 뒤 앱 이름이 바뀐다", async () => {
    const calls = stubFetch(() => ({ status: 200, body: { name: "새 이름" } }));
    await open("/settings/profile");
    expect(rows().map((row) => row.textContent?.trim())).toEqual(["부를 이름 시험"]);
    rows()[0]?.click();
    expect(location.hash).toBe("#/settings/name");
    await flush(10);
    const input = document.getElementById("st-name") as HTMLInputElement;
    const save = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "저장");
    expect(save?.getAttribute("aria-disabled")).toBe("true");
    save?.click();
    await flush();
    expect(document.getElementById("st-name-hint")?.textContent).toBe("지금 이름과 같아요.");
    expect(calls.some((call) => call.method === "PUT")).toBe(false);
    input.value = " 새 이름 ";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await flush();
    save?.click();
    await vi.waitFor(() => expect(app.name).toBe("새 이름"));
    expect(calls.find((call) => call.method === "PUT")?.body).toEqual({ name: "새 이름" });
  });
});
