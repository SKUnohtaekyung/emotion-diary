/// <reference path="../../client/src/env.d.ts" />
// 화면 기초(TASK-REFLECT-01 R-1): 하단 탐색이 밝은 목록 화면에만 보이고 현재 칸이 맞는지, 그림 주소가 아홉 계열 모두 있는지,
// 불러오기 상태 부품, Preact 화면이 라우터에 끼워져 정리 때 내려가는지.
import { render as renderPreact } from "preact";
import { useEffect } from "preact/hooks";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CATEGORY_CODES } from "../../shared/taxonomy";
import { friendUrl, pebbleUrl, stoneUrl } from "../../client/src/lib/art";
import { mountPreact } from "../../client/src/lib/mount";
import { navTabFor, resetBottomNavForTest, syncBottomNav } from "../../client/src/ui/bottomNav";
import { StatusBlock } from "../../client/src/ui/StatusBlock";
import { readSource } from "./source";

function navMarkup(): string {
  const html = readSource("../../client/index.html");
  const found = html.match(/<nav id="bottom-nav"[\s\S]*?<\/nav>/);
  if (!found) throw new Error("index.html에 하단 탐색이 없다");
  return found[0];
}

describe("하단 탐색", () => {
  beforeEach(() => {
    document.body.innerHTML = `<main id="app"></main>${navMarkup()}`;
    resetBottomNavForTest();
  });

  it("달력·통계·설정 목록에서만 보이고, 오늘·작성·하위 화면에서는 숨는다", () => {
    expect(navTabFor("calendar")).toBe("calendar");
    expect(navTabFor("stats")).toBe("stats");
    expect(navTabFor("settings")).toBe("settings");
    for (const name of ["today", "write/:date", "record/:date", "done/:date", "help", "settings/lock", "stats/:category", "auth"]) {
      expect(navTabFor(name), name).toBeNull();
    }
    const nav = document.getElementById("bottom-nav") as HTMLElement;
    syncBottomNav("today");
    expect(nav.hidden).toBe(true);
    syncBottomNav("calendar");
    expect(nav.hidden).toBe(false);
  });

  it("현재 칸에만 aria-current, 방울 자리는 CSSOM 변수, 칸을 옮길 때만 도착 표시", () => {
    const rail = document.querySelector(".bottom-nav-rail") as HTMLElement;
    syncBottomNav("calendar");
    const current = () => [...document.querySelectorAll("a[aria-current]")].map((link) => (link as HTMLElement).dataset.tab);
    expect(current()).toEqual(["calendar"]);
    expect(rail.style.getPropertyValue("--nav-position")).toBe("37.5%");
    expect(rail.classList.contains("is-moving")).toBe(false);
    syncBottomNav("stats");
    expect(current()).toEqual(["stats"]);
    expect(rail.style.getPropertyValue("--nav-position")).toBe("62.5%");
    expect(rail.classList.contains("is-moving")).toBe(true);
  });

  it("칸마다 이름이 있고 아이콘은 장식이다", () => {
    const links = [...document.querySelectorAll<HTMLAnchorElement>("#bottom-nav a")];
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["#/today", "#/calendar", "#/stats", "#/settings"]);
    expect(links.map((link) => link.textContent?.trim())).toEqual(["오늘", "달력", "통계", "설정"]);
    for (const link of links) expect(link.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("그림", () => {
  it("아홉 계열의 친구·조약돌과 돌 두 장의 주소가 있다(크기에 따라 작은·큰 파일)", () => {
    expect(CATEGORY_CODES).toHaveLength(9);
    for (const code of CATEGORY_CODES) {
      expect(friendUrl(code, 64), code).toMatch(/-160\.png/);
      expect(friendUrl(code, 120), code).toMatch(/-480\.png/);
      expect(pebbleUrl(code, 40), code).toMatch(/-128\.png/);
      expect(pebbleUrl(code, 72), code).toMatch(/-320\.png/);
    }
    expect(stoneUrl("rest")).toMatch(/stone-rest-320\.png/);
    expect(stoneUrl("lit")).toMatch(/stone-lit-320\.png/);
    expect(() => friendUrl("unknown", 64)).toThrow();
  });
});

describe("불러오기 상태와 Preact 끼우기", () => {
  let root: HTMLElement;
  beforeEach(() => {
    document.body.innerHTML = '<main id="app"></main>';
    root = document.getElementById("app") as HTMLElement;
  });
  afterEach(() => renderPreact(null, root));

  it("뼈대는 role=status와 숨은 글, 오류는 role=alert와 다시 시도", () => {
    let retried = 0;
    renderPreact(<StatusBlock kind="loading" />, root);
    expect(root.querySelector("[role=status]")?.textContent).toContain("불러오는 중이에요");
    renderPreact(<StatusBlock kind="error" onRetry={() => (retried += 1)} />, root);
    expect(root.querySelector("[role=alert] .status-title")?.textContent).toBe("불러오지 못했어요");
    (root.querySelector(".status-retry") as HTMLButtonElement).click();
    expect(retried).toBe(1);
    renderPreact(<StatusBlock kind="offline" />, root);
    expect(root.querySelector("[role=status] .status-title")?.textContent).toBe("연결이 끊겼어요");
    expect(root.querySelector(".status-retry")).toBeNull();
  });

  it("mountPreact는 바로 그리고, 정리하면 내리며 (이미 돈) 효과의 정리 함수까지 돈다", async () => {
    let ran = false;
    let cleaned = false;
    function Probe() {
      useEffect(() => {
        ran = true;
        return () => {
          cleaned = true;
        };
      }, []);
      return <h1>시험</h1>;
    }
    const cleanup = mountPreact(root, <Probe />);
    // 처음 그리기는 동기 — 라우터가 바로 h1에 초점을 줄 수 있다
    expect(root.querySelector("h1")?.textContent).toBe("시험");
    // 효과는 그린 뒤에 돈다(Preact afterPaint) — 돈 뒤에 내린다
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(ran).toBe(true);
    cleanup();
    expect(root.childElementCount).toBe(0);
    // Preact 11은 효과 정리를 다음 그리기 뒤로 미룰 수 있다(hooks unmount) — 화면은 정리가 즉시라고 믿지 않는다
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(cleaned).toBe(true);
  });
});
