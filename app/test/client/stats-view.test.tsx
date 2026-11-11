/// <reference path="../../client/src/env.d.ts" />
// 통계 화면과 친구 상세(TASK-REFLECT-01 R-4 — UX_SPEC §9, DESIGN_SYSTEM §6.9). 서버는 가짜 fetch이고 재료는 합성 기록이다.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { syntheticDiaries } from "../../scripts/synthetic.mjs";
import type { DiaryEntryView } from "../../shared/diary";
import type { StatsMaterial } from "../../shared/stats";
import { registerViews, render, resetRouterForTest, startRouter, type ViewContext } from "../../client/src/router";
import { app } from "../../client/src/state";
import { renderFriendDetail, renderStats } from "../../client/src/views/stats";
import { type FakeRequest, flush, mountShell, stubFetch } from "./helpers";

const TODAY = "2026-10-14";
const diaries = syntheticDiaries(TODAY, 90, { seed: 7 });
const completed = diaries.filter((diary) => diary.status === "completed");

function material(days: 7 | 30, entries: DiaryEntryView[] = completed): StatsMaterial {
  const from = new Date(Date.parse(`${TODAY}T00:00:00Z`) - (2 * days - 1) * 86_400_000).toISOString().slice(0, 10);
  return {
    today: TODAY,
    days,
    entries: entries
      .filter((diary) => diary.entryDate >= from)
      .map((diary) => ({ date: diary.entryDate, emotions: diary.emotions.map((emotion) => ({ code: emotion.emotionCode, category: emotion.categoryCode, intensity: emotion.intensity ?? 0 })) })),
    firstCompletedDates: [...new Set(entries.map((diary) => diary.firstCompletedLocalDate ?? ""))].filter(Boolean).sort().reverse()
  };
}

function server(entries: DiaryEntryView[] = completed) {
  return stubFetch((request: FakeRequest) => {
    const days = request.path.match(/^\/api\/stats\/(7|30)$/)?.[1];
    if (days) return { status: 200, body: material(Number(days) as 7 | 30, entries) };
    const date = request.path.match(/^\/api\/diaries\/(\d{4}-\d{2}-\d{2})$/)?.[1];
    const found = diaries.find((diary) => diary.entryDate === date);
    if (found) return { status: 200, body: found };
    return { status: 404, body: { error: "not_found" } };
  });
}

const stub = (context: ViewContext) => {
  context.root.append(document.createElement("h1"));
  return () => {};
};

async function open(hash: string) {
  history.replaceState(null, "", `/${hash}`);
  render();
  await flush(30);
}

beforeEach(() => {
  mountShell();
  resetRouterForTest();
  Object.assign(app, { authenticated: true, locked: false, appLock: false, hasName: true, name: "시험" });
  registerViews({ stats: renderStats, "stats/:category": renderFriendDetail, today: stub, "record/:date": stub });
  startRouter();
});

afterEach(() => {
  resetRouterForTest();
  vi.unstubAllGlobals();
});

const text = (selector: string) => document.querySelector(selector)?.textContent ?? "";

describe("통계 첫 화면", () => {
  it("기간 7일이 기본, 재료는 시간대와 함께, 요약 칸·친밀도·자주 머문 말 — AI 안내 줄은 없다", async () => {
    const calls = server();
    await open("#/stats");
    expect(calls[0]?.path).toBe("/api/stats/7");
    expect(calls[0]?.headers["x-timezone"]).toBeTruthy();
    expect(document.querySelector('[role="radio"][aria-checked="true"]')?.textContent).toBe("최근 7일");
    expect(text(".sx-tile-k")).toBe("기록한 날");
    expect(text(".sx-eyebrow")).toBe("친구와의 친밀도");
    expect(text(".sx-trk-caption")).toMatch(/많고 적음에 좋고 나쁨은 없어요\.$/);
    expect(document.body.textContent).not.toMatch(/AI/);
    // 순위 말·점수 없음(§6.9)
    expect(document.body.textContent).not.toMatch(/가장 가까웠|점수|레벨|등급/);
  });

  it("친구 줄은 함께한 날 많은 순, 모두 같은 크기, 위치만 다르고, 줄을 누르면 친구 상세(같은 기간)", async () => {
    server();
    await open("#/stats?p=30");
    const rows = [...document.querySelectorAll<HTMLElement>(".sx-trk")];
    expect(rows.length).toBeGreaterThan(1);
    const sizes = new Set(rows.map((row) => row.querySelector("img")?.getAttribute("width")));
    expect(sizes.size).toBe(1);
    const days = rows.map((row) => Number(row.querySelector(".sx-trk-who span")?.textContent?.match(/(\d+)일$/)?.[1]));
    expect(days).toEqual([...days].sort((a, b) => b - a));
    expect(rows[0]?.querySelector("a")?.getAttribute("href")).toMatch(/^#\/stats\/[a-z]+\?p=30$/);
    expect(rows[0]?.querySelector(".sr-only")?.textContent).toMatch(/기록한 \d+일 중 \d+일 함께했어요\. 자세히 보기$/);
  });

  it("기간을 바꾸면 주소를 바꿔치고(쌓지 않음) 그 기간의 재료를 받는다", async () => {
    const calls = server();
    await open("#/stats?p=7");
    const before = history.length;
    [...document.querySelectorAll<HTMLButtonElement>('[role="radio"]')].find((button) => button.textContent === "최근 30일")?.click();
    await flush(30);
    expect(location.hash).toBe("#/stats?p=30");
    expect(history.length).toBe(before);
    expect(calls.map((call) => call.path)).toContain("/api/stats/30");
    expect(text(".sx-tile-note")).toBe("최근 30일 중");
  });

  it("기록한 날이 5일 미만이면 빈 상태 하나, 이어서 쓴 날 칸은 이틀 이상일 때만", async () => {
    const few = completed.slice(-3);
    server(few.map((diary, index) => ({ ...diary, firstCompletedLocalDate: index === 2 ? TODAY : diary.firstCompletedLocalDate })));
    await open("#/stats");
    expect(text(".sx-empty .sx-headline")).toBe("기록이 더 필요해요");
    expect(document.querySelector(".sx-tracks")).toBeNull();
    const tiles = [...document.querySelectorAll(".sx-tile-k")].map((node) => node.textContent);
    expect(tiles).not.toContain("이어서 쓴 날");
  });

  it("불러오지 못하면 상태 블록과 다시 시도(F-21)", async () => {
    stubFetch(() => "offline");
    await open("#/stats");
    expect(text(".status-block .status-title")).toBe("연결이 끊겼어요");
    expect(document.querySelector(".status-retry")).not.toBeNull();
  });
});

describe("친구 상세", () => {
  it("머리 장면의 친구, 비교 한 줄(화살표·색 없음), 평균 줄, 30일은 요일 격자, 고른 날의 미리보기는 최근 기록한 날", async () => {
    server();
    await open("#/stats/sadness?p=30");
    expect(text("h1")).toBe("설이");
    expect(text(".sxd-sub")).toMatch(/^슬픔 · 최근 30일 중 \d+일 함께했어요$/);
    expect(text(".sxd-cmp-head")).toMatch(/^지난 30일(보다 \d+\.\d (높아요|낮아요)|과 비슷해요)$/);
    expect(text(".sxd-stat-line")).toMatch(/^평균 \d+\.\d · \d+일 기록$/);
    expect(document.querySelector(".sxd-mg")).not.toBeNull();
    const radios = [...document.querySelectorAll<HTMLButtonElement>('.sxd-mg [role="radio"]')];
    const checked = radios.filter((radio) => radio.getAttribute("aria-checked") === "true");
    expect(checked).toHaveLength(1);
    expect(checked[0]).toBe(radios[radios.length - 1]);
    await flush(20);
    expect(text(".sxd-peek-event")).toMatch(/^가짜 일기/);
    expect(document.querySelector(".sxd-peek-open")?.getAttribute("href")).toMatch(/^#\/record\/\d{4}-\d{2}-\d{2}\?from=stats&cat=sadness&p=30$/);
    expect(document.body.textContent).not.toMatch(/[↑↓▲▼]/);
  });

  it("7일은 점 열 개 기둥, 기록 없는 날은 0이 아니라 빈 기둥(단추가 아님), ←로 앞 기록한 날을 고른다", async () => {
    server();
    await open("#/stats/sadness?p=7");
    const columns = document.querySelectorAll(".sxd-cols > *");
    expect(columns).toHaveLength(7);
    for (const empty of document.querySelectorAll(".sxd-col-wrap.empty")) {
      expect(empty.tagName).toBe("SPAN");
      expect(empty.querySelectorAll("i.f")).toHaveLength(0);
      expect(empty.textContent).toMatch(/기록 없음$/);
    }
    const radios = [...document.querySelectorAll<HTMLButtonElement>('.sxd-cols [role="radio"]')];
    if (radios.length >= 2) {
      const last = radios[radios.length - 1] as HTMLButtonElement;
      last.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
      await flush(10);
      expect(radios[radios.length - 2]?.getAttribute("aria-checked")).toBe("true");
    }
  });

  it("‹는 통계로(같은 기간), 그 계열에서 고른 말은 계열 chip과 횟수", async () => {
    server();
    await open("#/stats/sadness?p=30");
    expect(document.querySelectorAll(".sxd-chiprow .sxd-chip").length).toBeGreaterThan(0);
    document.querySelector<HTMLButtonElement>('[aria-label="통계로"]')?.click();
    expect(location.hash).toBe("#/stats?p=30");
  });

  it("고른 날의 글을 불러오지 못하면 '비워 둔 날'이라 하지 않고 다시 시도를 준다(마감 검토 5)", async () => {
    let offline = true;
    stubFetch((request: FakeRequest) => {
      const days = request.path.match(/^\/api\/stats\/(7|30)$/)?.[1];
      if (days) return { status: 200, body: material(Number(days) as 7 | 30) };
      if (offline) return "offline";
      const date = request.path.match(/^\/api\/diaries\/(\d{4}-\d{2}-\d{2})$/)?.[1];
      return { status: 200, body: diaries.find((diary) => diary.entryDate === date) };
    });
    await open("#/stats/sadness?p=30");
    await flush(20);
    expect(text(".sxd-peek-event")).toMatch(/^연결이 끊겨 불러오지 못했어요/);
    expect(text(".sxd-peek-event")).not.toMatch(/비워 둔 날/);
    offline = false;
    [...document.querySelectorAll<HTMLButtonElement>(".sxd-peek button")].find((node) => node.textContent === "다시 시도")?.click();
    await flush(30);
    expect(text(".sxd-peek-event")).toMatch(/^가짜 일기/);
  });
});
