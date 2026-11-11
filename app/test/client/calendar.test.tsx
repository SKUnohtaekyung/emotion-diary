/// <reference path="../../client/src/env.d.ts" />
// 달력 화면(TASK-REFLECT-01 R-3 — UX_SPEC §7, DESIGN_SYSTEM §6.7, D-100). 서버는 가짜 fetch다(합성 기록만).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { syntheticDiaries } from "../../scripts/synthetic.mjs";
import type { CalendarMonth, DiaryEntryView } from "../../shared/diary";
import { registerViews, render, resetRouterForTest, startRouter, type ViewContext } from "../../client/src/router";
import { app } from "../../client/src/state";
import { resetSheetsForTest } from "../../client/src/ui/sheet";
import { clearToasts } from "../../client/src/ui/toast";
import { renderCalendar } from "../../client/src/views/calendar";
import { type FakeReply, type FakeRequest, flush, mountShell, stubFetch } from "./helpers";

const TODAY = "2026-10-14";
const diaries = syntheticDiaries(TODAY, 60);
const byDate = new Map(diaries.map((diary) => [diary.entryDate, diary]));
const completed = diaries.filter((diary) => diary.status === "completed" && diary.entryDate.startsWith("2026-10")).at(-1) as DiaryEntryView;
const draft = diaries.find((diary) => diary.status === "draft") as DiaryEntryView;

const stub = (context: ViewContext) => {
  context.root.append(document.createElement("h1"));
  return () => {};
};

function server(overrides: (request: FakeRequest) => FakeReply | "offline" | null = () => null) {
  return stubFetch((request) => {
    const special = overrides(request);
    if (special) return special;
    const month = request.path.match(/^\/api\/calendar\/(\d{4}-\d{2})$/)?.[1];
    if (month) {
      const body: CalendarMonth = { month, today: TODAY, days: diaries.filter((diary) => diary.entryDate.startsWith(month)).map((diary) => ({ date: diary.entryDate, status: diary.status })) };
      return { status: 200, body };
    }
    const date = request.path.match(/^\/api\/diaries\/(\d{4}-\d{2}-\d{2})$/)?.[1];
    if (date && request.method === "GET") return byDate.has(date) ? { status: 200, body: byDate.get(date) } : { status: 404, body: { error: "not_found" } };
    if (date && request.method === "DELETE") return { status: 200, body: { deleted: true, entryDate: date } };
    return { status: 404, body: { error: "not_found" } };
  });
}

async function open(hash = "#/calendar") {
  history.replaceState(null, "", `/${hash}`);
  render();
  await flush(20);
}

beforeEach(() => {
  mountShell();
  localStorage.clear();
  resetRouterForTest();
  resetSheetsForTest();
  Object.assign(app, { authenticated: true, locked: false, appLock: false, hasName: true, name: "시험" });
  registerViews({ calendar: renderCalendar, today: stub, "write/:date": stub, "record/:date": stub });
  startRouter();
});

afterEach(() => {
  clearToasts();
  resetRouterForTest();
  vi.unstubAllGlobals();
});

const cell = (date: string) => document.querySelector<HTMLButtonElement>(`.day[data-iso="${date}"]`);
const button = (text: string) => [...document.querySelectorAll<HTMLButtonElement>("button")].find((node) => node.textContent?.trim() === text);

describe("달력 — 한 달", () => {
  it("서버가 센 오늘의 달, 칸은 상태만(감정 색 없음), 미래는 막힘, 이름은 날짜·상태", async () => {
    const calls = server();
    await open();
    // 첫 달은 이 기기의 달 짐작이고, 서버가 센 오늘의 달이 다르면 그 달로 다시 연다
    await flush(30);
    expect(calls.map((call) => call.path)).toContain("/api/calendar/2026-10");
    expect(calls.every((call) => Boolean(call.headers["x-timezone"]))).toBe(true);
    expect(document.querySelector(".tb-kicker")?.textContent).toBe("2026년 달력");
    expect(document.querySelector(".cal-big")?.textContent).toBe("10월");
    expect(cell(completed.entryDate)?.classList.contains("completed")).toBe(true);
    expect(cell(draft.entryDate)?.classList.contains("draft")).toBe(true);
    expect(cell(TODAY)?.classList.contains("today")).toBe(true);
    expect(cell(TODAY)?.getAttribute("aria-current")).toBe("date");
    expect(cell("2026-10-20")?.disabled).toBe(true);
    expect(cell("2026-10-20")?.getAttribute("aria-label")).toBe("10월 20 일, 아직 오지 않은 날");
    expect(cell(completed.entryDate)?.getAttribute("aria-label")).toMatch(/, 완료$/);
    // 감정 색·친구를 칸에 쓰지 않는다(§6.7)
    expect(document.querySelector(".cal [data-category], .cal img")).toBeNull();
    expect(document.querySelectorAll(".cal .day:not(.blank)")).toHaveLength(31);
  });

  it("다음 달은 막히고 이전 달로 가면 그 달을 불러온다", async () => {
    const calls = server();
    await open();
    const next = document.querySelector<HTMLButtonElement>('[aria-label="다음 달"]');
    expect(next?.getAttribute("aria-disabled")).toBe("true");
    next?.click();
    await flush(10);
    expect(document.querySelector(".cal-big")?.textContent).toBe("10월");
    document.querySelector<HTMLButtonElement>('[aria-label="이전 달"]')?.click();
    await flush(20);
    expect(document.querySelector(".cal-big")?.textContent).toBe("9월");
    expect(calls.map((call) => call.path)).toContain("/api/calendar/2026-09");
  });

  it("불러오지 못하면 상태 블록과 다시 시도(F-21)", async () => {
    let fail = true;
    server((request) => (request.path.startsWith("/api/calendar/") && fail ? "offline" : null));
    await open();
    expect(document.querySelector(".status-block.is-offline .status-title")?.textContent).toBe("연결이 끊겼어요");
    fail = false;
    button("다시 시도")?.click();
    await flush(20);
    expect(document.querySelector(".cal")).not.toBeNull();
  });
});

describe("달력 — 날짜를 고르면", () => {
  it("처음 고를 때만 기록 한 칸(?d=), 완료한 날은 작은 편지(감정 이름·세부 감정·크기)와 편지 열기", async () => {
    server();
    await open();
    const before = history.length;
    cell(completed.entryDate)?.click();
    await flush(30);
    expect(location.hash).toBe(`#/calendar?m=${completed.entryDate.slice(0, 7)}&d=${completed.entryDate}`);
    expect(history.length).toBe(before + 1);
    const first = completed.categories[0]?.categoryCode ?? "";
    expect(document.querySelector(".ml-name")?.textContent).toBeTruthy();
    expect(document.querySelector(".ml-emo")).not.toBeNull();
    expect(document.querySelector(".ml-size b")?.textContent).toBe(String(completed.categories[0]?.intensity));
    expect(document.querySelector(".ml-pebble")?.getAttribute("src")).toMatch(new RegExp(`${first}-320\\.png`));
    // 다른 날로 바꾸면 바꿔친다 — 기록이 날마다 쌓이지 않는다
    cell(draft.entryDate)?.click();
    await flush(10);
    expect(history.length).toBe(before + 1);
    expect(location.hash).toBe(`#/calendar?m=${completed.entryDate.slice(0, 7)}&d=${draft.entryDate}`);
  });

  it("편지 열기는 기록 상세로(?from=calendar), 고치기는 그 카드의 단계로", async () => {
    server();
    await open(`#/calendar?d=${completed.entryDate}`);
    await flush(20);
    button("편지 열기")?.click();
    expect(location.hash).toBe(`#/record/${completed.entryDate}?from=calendar`);
    await open(`#/calendar?d=${completed.entryDate}`);
    await flush(20);
    const code = completed.categories[0]?.categoryCode ?? "";
    document.querySelector<HTMLButtonElement>(".ml-edit")?.click();
    expect(location.hash).toBe(`#/write/${completed.entryDate}?step=details&c=${code}`);
  });

  it("쓰던 글: 이어서 쓰기는 작성으로, 이 글 지우기는 두 번 묻고 지운다", async () => {
    const calls = server();
    await open(`#/calendar?d=${draft.entryDate}`);
    expect(document.querySelector(".cal-pv-txt")?.textContent).toBe("쓰던 글이 있어요. 이어서 쓸 수 있어요.");
    button("이 글 지우기")?.click();
    expect(document.querySelector(".sheet-title")?.textContent).toBe("이 글을 지울까요?");
    expect(document.querySelector(".sheet .btn-danger")?.textContent).toBe("지우기");
    (document.querySelector(".sheet .btn-danger") as HTMLButtonElement).click();
    await flush(10);
    expect(document.querySelector(".sheet-title")?.textContent).toBe("정말 지울까요?");
    (document.querySelector(".sheet .btn-danger") as HTMLButtonElement).click();
    await flush(30);
    const deleted = calls.find((call) => call.method === "DELETE");
    expect(deleted?.path).toBe(`/api/diaries/${draft.entryDate}`);
    expect(deleted?.body).toEqual({ revision: draft.revision });
    await flush(60); // 알림은 30ms 뒤에 읽힌다(lib/dom announce)
    expect(document.getElementById("live")?.textContent).toBe("쓰던 글을 지웠어요");
  });

  it("오늘(기록 없음)은 오늘 화면으로, 지난 빈 날은 안내 한 줄뿐(쓰기 버튼 없음 — D-082)", async () => {
    server();
    await open(`#/calendar?d=${TODAY}`);
    expect(document.querySelector(".cal-pv-txt")?.textContent).toBe("오늘의 마음은 오늘 화면에서 남겨요.");
    button("오늘 화면으로")?.click();
    expect(location.hash).toBe("#/today");
    const empty = ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07"].find((date) => !byDate.has(date));
    expect(empty).toBeTruthy();
    await open(`#/calendar?d=${empty}`);
    expect(document.querySelector(".cal-pv-txt")?.textContent).toBe("이 날은 남긴 기록이 없어요.");
    expect(document.querySelector(".cal-pv-btnrow")).toBeNull();
  });

  it("닫기(×)는 밀어서 뒤로와 같다 — 고를 때 쌓은 칸을 되감아 같은 달의 한 달 보기로(마감 검토 2a·2b)", async () => {
    server();
    await open("#/calendar?m=2026-09");
    expect(document.querySelector(".cal-big")?.textContent).toBe("9월");
    const before = history.length;
    cell("2026-09-20")?.click();
    await flush(20);
    expect(history.length).toBe(before + 1);
    document.querySelector<HTMLButtonElement>('[aria-label="한 달 보기로 닫기"]')?.click();
    await flush(60);
    expect(location.hash).toBe("#/calendar?m=2026-09");
    expect(document.querySelector(".cal-big")?.textContent).toBe("9월");
    expect(document.querySelector(".cal-pv-hint")?.textContent).toBe("날짜를 누르면 그날의 편지를 볼 수 있어요");
  });

  it("다른 곳에서 그 사이 완료한 날은 '이 글 지우기'로 지우지 않는다(마감 검토 1)", async () => {
    const calls = server((request) =>
      request.method === "GET" && request.path === `/api/diaries/${draft.entryDate}` ? { status: 200, body: { ...draft, status: "completed" } } : null
    );
    await open(`#/calendar?d=${draft.entryDate}`);
    button("이 글 지우기")?.click();
    (document.querySelector(".sheet .btn-danger") as HTMLButtonElement).click();
    await flush(10);
    (document.querySelector(".sheet .btn-danger") as HTMLButtonElement).click();
    await flush(60);
    expect(calls.some((call) => call.method === "DELETE")).toBe(false);
    expect(document.getElementById("live")?.textContent).toBe("다른 곳에서 완료한 기록이라 지우지 않았어요.");
  });
});
