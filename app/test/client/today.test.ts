/// <reference path="../../client/src/env.d.ts" />
// 오늘 화면의 평면판(TASK-SLICE-01 PLAN A-8, UX_SPEC §3·§11)·반가워요·개발용 상태 칸. 서버는 가짜 fetch다.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DiarySummary, TodayInfo } from "../../shared/diary";
import { startDev } from "../../client/src/dev/index";
import { emit } from "../../client/src/lib/probe";
import { currentFlow, registerViews, render, resetRouterForTest, startRouter, type ViewContext } from "../../client/src/router";
import { app } from "../../client/src/state";
import { hideLockLayer } from "../../client/src/ui/lockLayer";
import { resetSheetsForTest } from "../../client/src/ui/sheet";
import { clearToasts } from "../../client/src/ui/toast";
import { renderToday } from "../../client/src/views/today";
import { renderWelcome } from "../../client/src/views/welcome";
import { emptyDiary, withText } from "../../client/src/write/flow";
import { resetSaversForTest } from "../../client/src/write/saver";
import { resetSessionsForTest } from "../../client/src/write/session";
import { readUnsent, writeUnsent } from "../../client/src/write/unsent";
import { type FakeReply, flush, mountShell, session, stubFetch } from "./helpers";

const TODAY = "2026-10-16";
let stopDev: (() => void) | null = null;

const stub = (context: ViewContext) => {
  context.root.append(document.createElement("h1"));
  return () => {};
};

const summary = (overrides: Partial<DiarySummary> = {}): DiarySummary => ({
  entryDate: TODAY,
  status: "draft",
  revision: 2,
  categories: [],
  resume: null,
  updatedAt: "",
  ...overrides
});

const todayReply = (overrides: Partial<TodayInfo> = {}): FakeReply => ({
  status: 200,
  body: { date: TODAY, timezone: "Asia/Seoul", dayStartHour: 4, entry: null, pastDraft: null, ...overrides }
});

beforeEach(() => {
  mountShell();
  localStorage.clear();
  sessionStorage.clear();
  resetRouterForTest();
  resetSheetsForTest();
  resetSaversForTest();
  resetSessionsForTest();
  Object.assign(app, { authenticated: true, locked: false, appLock: false, hasName: true, name: "시험" });
  registerViews({
    today: renderToday,
    welcome: renderWelcome,
    auth: stub,
    "settings/lock": stub,
    "settings/pin": stub,
    "write/:date": stub,
    "record/:date": stub
  });
  startRouter();
});

afterEach(() => {
  stopDev?.();
  stopDev = null;
  clearToasts();
  hideLockLayer();
  resetRouterForTest();
  vi.unstubAllGlobals();
});

const buttons = () => [...document.querySelectorAll<HTMLButtonElement>("button")];
const byText = (text: string) => buttons().find((button) => button.textContent === text);

async function openToday(reply: FakeReply | "offline" | ((path: string) => FakeReply | "offline")) {
  const calls = stubFetch((request) => (typeof reply === "function" ? reply(request.path) : reply));
  history.replaceState(null, "", "/#/today");
  render();
  await flush(10);
  return calls;
}

describe("오늘 — 상태", () => {
  it("기록 없음: 날짜·큰 질문·시작 버튼, 누르면 작성 첫 단계로 흐름 한 칸(시간대 머리글을 싣는다)", async () => {
    const calls = await openToday(todayReply());
    expect(document.querySelector(".today-date")?.textContent).toBe("10월 16일 금요일");
    expect(document.querySelector("h1")?.textContent).toBe("오늘은 어떤 마음이 머물렀나요?");
    expect(calls[0]?.headers["x-timezone"]).toBeTruthy();
    byText("오늘의 마음 남기기")?.click();
    expect(location.hash).toBe(`#/write/${TODAY}?step=event`);
    expect(currentFlow()?.depth).toBe(1);
    // 화면 아래 고정 버튼 줄이 없다(U-1)
    expect(document.querySelector(".bottom-bar")).toBeNull();
  });

  it("이어 쓰기: 쓰던 단계 칩, 누르면 그 단계로", async () => {
    await openToday(todayReply({ entry: summary({ resume: { step: "details", categoryCode: "sadness" }, categories: ["sadness"] }) }));
    expect(document.querySelector(".today-chip")?.textContent).toBe("슬픔 세부 감정 중 · 임시저장됨");
    byText("이어서 써요")?.click();
    expect(location.hash).toBe(`#/write/${TODAY}?step=details&c=sadness`);
  });

  it("기록 있음: 새로 만들지 않고 그 기록을 연다", async () => {
    await openToday(todayReply({ entry: summary({ status: "completed" }) }));
    expect(byText("오늘의 마음 남기기")).toBeUndefined();
    byText("오늘의 기록 보기")?.click();
    expect(location.hash).toBe(`#/record/${TODAY}`);
  });

  it("지난 날 쓰던 글 줄: 어제면 '어제', 더 지난 글은 날짜로 — 누르면 그 글을 이어 쓴다", async () => {
    await openToday(todayReply({ pastDraft: summary({ entryDate: "2026-10-15", resume: { step: "reason", categoryCode: null } }) }));
    byText("어제 쓰던 글이 있어요 ›")?.click();
    expect(location.hash).toBe("#/write/2026-10-15?step=reason");
    await openToday(todayReply({ pastDraft: summary({ entryDate: "2026-10-12" }) }));
    expect(byText("10월 12일에 쓰던 글이 있어요 ›")).toBeDefined();
  });

  it("연결이 끊기면 시작을 막고 다시 시도를 둔다 — 확인 없이 새로 시작하지 않는다(D-083 ①)", async () => {
    let online = false;
    const calls = await openToday(() => (online ? todayReply() : "offline"));
    expect(byText("오늘의 마음 남기기")?.getAttribute("aria-disabled")).toBe("true");
    expect(document.querySelector(".today-line")?.textContent).toBe("연결이 끊겼어요 · 연결되면 시작할 수 있어요");
    byText("오늘의 마음 남기기")?.click();
    expect(location.hash).toBe("#/today");
    online = true;
    byText("다시 시도")?.click();
    await flush(10);
    expect(calls).toHaveLength(2);
    expect(byText("오늘의 마음 남기기")?.getAttribute("aria-disabled")).toBeNull();
  });

  it("서버 오류면 '확인하지 못했어요'", async () => {
    await openToday({ status: 500, body: { error: "server_error" } });
    expect(document.querySelector(".today-line")?.textContent).toBe("오늘 기록을 확인하지 못했어요 · 잠시 뒤 다시 시도해 주세요");
  });

  it("다른 곳에서 완료된 날에도 이 휴대폰의 임시저장 사본이 있으면 알리고 그 글로 가는 길이 있다(PR #40 리뷰)", async () => {
    writeUnsent({ v: 1, date: TODAY, mode: "draft", baseRevision: 2, diary: withText(emptyDiary(), "eventText", "가짜"), step: { step: "reason", category: null }, pending: null, savedAt: 1 });
    // 그날 기록 조회는 닿지 않게 둔다 — 배경 보내기는 닿지 못하면 다음 기회로 미룬다(오늘 화면만 본다)
    await openToday((path) => (path === "/api/today" ? todayReply({ entry: summary({ status: "completed", revision: 4 }) }) : "offline"));
    expect(byText("오늘의 기록 보기")).toBeDefined();
    expect(document.querySelector(".today-line")?.textContent).toBe("이 휴대폰에 보내지 못한 글이 남아 있어요");
    byText("남은 글 보기")?.click();
    expect(location.hash).toBe(`#/write/${TODAY}?step=reason`);
  });

  it("서버에 없어도 이 휴대폰에 못 보낸 오늘 글이 있으면 이어 쓰기다(U-2)", async () => {
    writeUnsent({ v: 1, date: TODAY, mode: "draft", baseRevision: null, diary: withText(emptyDiary(), "eventText", "가짜"), step: { step: "feelings", category: null }, pending: null, savedAt: 1 });
    await openToday((path) => (path === "/api/today" ? todayReply() : { status: 404, body: { error: "not_found" } }));
    expect(document.querySelector(".today-chip")?.textContent).toBe("마음 고르기 중 · 이 휴대폰에 잠시 보관 중");
  });
});

describe("오늘 — 아래 작은 줄", () => {
  it("잠금이 켜져 있을 때만 '지금 잠그기'가 있고, 누르면 잠금을 청하고 잠금 층이 뜬다", async () => {
    app.appLock = true;
    const calls = stubFetch((request) => (request.path === "/api/today" ? todayReply() : { status: 204 }));
    history.replaceState(null, "", "/#/today");
    render();
    byText("지금 잠그기")?.click();
    await vi.waitFor(() => expect(document.getElementById("lock-layer")).not.toBeNull());
    expect(calls.map((call) => `${call.method} ${call.path}`)).toContain("POST /api/app-lock/lock");
    expect(app.locked).toBe(true);
  });

  it("앱 잠금은 하위 화면으로 push한다", async () => {
    await openToday(todayReply());
    const length = history.length;
    byText("앱 잠금")?.click();
    expect(location.hash).toBe("#/settings/lock");
    expect(history.length).toBe(length + 1);
  });

  it("로그아웃: 확인 시트 → DELETE /api/session → 열쇠 화면 replace + 토스트", async () => {
    const calls = await openToday((path) => (path === "/api/today" ? todayReply() : { status: 200, body: { ok: true } }));
    byText("로그아웃")?.click();
    const sheet = document.querySelector(".sheet");
    expect(sheet?.textContent).toContain("로그아웃할까요?");
    [...document.querySelectorAll<HTMLButtonElement>(".sheet button")].find((b) => b.textContent === "로그아웃")?.click();
    await vi.waitFor(() => expect(location.hash).toBe("#/auth"));
    expect(calls.map((call) => `${call.method} ${call.path}`)).toContain("DELETE /api/session");
    expect(app.authenticated).toBe(false);
    expect(document.querySelector(".toast")?.textContent).toBe("로그아웃했어요");
  });

  it("못 보낸 글이 있으면 먼저 알리고, 그래도 로그아웃하면 이 휴대폰의 사본을 지운다(U-2)", async () => {
    writeUnsent({ v: 1, date: "2026-10-15", mode: "draft", baseRevision: 3, diary: withText(emptyDiary(), "eventText", "가짜"), step: null, pending: null, savedAt: 1 });
    await openToday((path) => (path === "/api/today" ? todayReply() : path.startsWith("/api/diaries") ? "offline" : { status: 200, body: {} }));
    byText("로그아웃")?.click();
    expect(document.querySelector(".sheet")?.textContent).toContain("아직 보내지 못한 글이 있어요");
    [...document.querySelectorAll<HTMLButtonElement>(".sheet button")].find((b) => b.textContent === "그래도 로그아웃")?.click();
    await vi.waitFor(() => expect(location.hash).toBe("#/auth"));
    expect(readUnsent("2026-10-15")).toBeNull();
    expect(localStorage.getItem("unsentDiaries")).toBeNull();
  });

  it("로그아웃이 연결 문제로 안 되면 로그인 상태를 그대로 두고 알린다", async () => {
    await openToday((path) => (path === "/api/today" ? todayReply() : "offline"));
    byText("로그아웃")?.click();
    [...document.querySelectorAll<HTMLButtonElement>(".sheet button")].find((b) => b.textContent === "로그아웃")?.click();
    await vi.waitFor(() => expect(document.querySelector(".toast")?.textContent).toBe("인터넷에 연결되면 로그아웃할 수 있어요."));
    expect(app.authenticated).toBe(true);
    expect(location.hash).toBe("#/today");
  });
});

describe("반가워요", () => {
  it("'반가워요, {이름}님'과 두 버튼 — 조용한 버튼이 주 버튼 위에 있다", () => {
    history.replaceState(null, "", "/#/welcome");
    render();
    expect(document.querySelector("h1")?.textContent).toBe("반가워요, 시험님");
    const labels = buttons().map((button) => button.textContent);
    expect(labels).toEqual(["비밀번호로 잠그고 시작하기", "오늘 시작하기"]);
    expect(byText("오늘 시작하기")?.classList.contains("btn-primary")).toBe(true);
  });

  it("오늘 시작하기는 오늘로 바꿔치고, 비밀번호로 잠그고 시작하기는 정하기로 push한다", () => {
    stubFetch(() => todayReply());
    history.replaceState(null, "", "/#/welcome");
    render();
    const length = history.length;
    byText("비밀번호로 잠그고 시작하기")?.click();
    expect(location.hash).toBe("#/settings/pin?from=welcome");
    expect(history.length).toBe(length + 1);

    history.replaceState(null, "", "/#/welcome");
    render();
    const before = history.length;
    byText("오늘 시작하기")?.click();
    expect(location.hash).toBe("#/today");
    expect(history.length).toBe(before);
  });
});

describe("개발용 상태 칸", () => {
  it("접힌 '상태' 버튼을 누르면 목록이 펼쳐지고 정해진 항목만 보인다", async () => {
    stubFetch(() => session());
    stopDev = startDev();
    emit({ type: "startLock", navType: "navigate", hasMarker: true, lock: false, reason: "이 탭에서 이미 시작한 표식이 있어요" });
    emit({ type: "api", method: "GET", path: "/api/session", status: 200 });
    emit({ type: "api", method: "POST", path: "/api/session/heartbeat", status: 204 });
    const toggle = document.querySelector<HTMLButtonElement>(".dev-panel-toggle");
    expect(toggle?.textContent).toBe("상태");
    expect(toggle?.getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector<HTMLElement>(".dev-panel-body")?.hidden).toBe(true);

    toggle?.click();
    const text = document.querySelector(".dev-panel-body")?.textContent ?? "";
    for (const expected of [
      "빌드",
      "test-build",
      "standalone",
      "fullscreen",
      "navigator.standalone",
      "innerHeight",
      "visualViewport",
      "screen.height",
      "탐색 종류",
      "navigate",
      "alive 표식",
      "마지막으로 숨은 뒤",
      "시작 잠금 판단",
      "마지막 API 응답",
      "/api/session/heartbeat 204",
      "1번, 마지막 204",
      "지금 잠김",
      "마지막 오류"
    ]) {
      expect(text).toContain(expected);
    }
    expect(document.querySelector(".dev-panel")?.getAttribute("data-keep-active")).toBe("true");
  });

  it("최근 보임·숨김은 10개까지만 남는다", () => {
    stopDev = startDev();
    for (let i = 0; i < 14; i += 1) emit({ type: "lifecycle", kind: i % 2 === 0 ? "hidden" : "visible", persisted: false });
    document.querySelector<HTMLButtonElement>(".dev-panel-toggle")?.click();
    const section = [...document.querySelectorAll(".dev-panel-section")].find((s) => s.querySelector("h2")?.textContent === "최근 보임·숨김");
    expect(section?.querySelectorAll("dt")).toHaveLength(10);
  });

  it("화면 오류는 정리된 일곱 칸으로 상태 칸에 남고, 잠기지 않은 로그인 상태에서만 서버로 보낸다", async () => {
    const calls = stubFetch(() => ({ status: 204 }));
    stopDev = startDev();
    history.replaceState(null, "", "/#/today");
    emit({ type: "error", error: { kind: "error", name: "TypeError", filename: `${location.origin}/assets/a.js`, lineno: 3, colno: 4 } });
    await flush(20);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ method: "POST", path: "/api/client-errors" });
    expect(Object.keys(calls[0]?.body as object).sort()).toEqual(["build", "col", "kind", "line", "name", "route", "source"]);

    app.locked = true;
    emit({ type: "error", error: { kind: "unhandledrejection", name: "RangeError" } });
    await flush(20);
    expect(calls).toHaveLength(1);
    document.querySelector<HTMLButtonElement>(".dev-panel-toggle")?.click();
    expect(document.querySelector(".dev-panel-body")?.textContent).toContain("RangeError");
  });
});
