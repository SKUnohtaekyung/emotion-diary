/// <reference path="../../client/src/env.d.ts" />
// 오늘 자리표시·반가워요·개발용 상태 칸. 연습 칸의 글은 메모리에만 있고 어디에도 새지 않는다(S-12).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startDev } from "../../client/src/dev/index";
import { emit } from "../../client/src/lib/probe";
import { registerViews, render, resetRouterForTest, startRouter, type ViewContext } from "../../client/src/router";
import { app, practice } from "../../client/src/state";
import { hideLockLayer } from "../../client/src/ui/lockLayer";
import { resetSheetsForTest } from "../../client/src/ui/sheet";
import { clearToasts } from "../../client/src/ui/toast";
import { renderToday } from "../../client/src/views/today";
import { renderWelcome } from "../../client/src/views/welcome";
import { flush, mountShell, session, stubFetch } from "./helpers";

// 시험 안에서 만든 가짜 글이다 — 실제 일기가 아니다.
const FAKE_NOTE = "가짜 연습 문장: 오늘 있었던 일은 아무에게도 말하지 않았다";

let stopDev: (() => void) | null = null;

const stub = (context: ViewContext) => {
  context.root.append(document.createElement("h1"));
  return () => {};
};

beforeEach(() => {
  mountShell();
  localStorage.clear();
  sessionStorage.clear();
  resetRouterForTest();
  resetSheetsForTest();
  practice.text = "";
  Object.assign(app, { authenticated: true, locked: false, appLock: false, hasName: true, name: "시험" });
  registerViews({ today: renderToday, welcome: renderWelcome, auth: stub, "settings/lock": stub, "settings/pin": stub });
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

describe("오늘 자리표시", () => {
  it("제목·한 줄·확인용 작은 글·연습 칸·버튼", () => {
    history.replaceState(null, "", "/#/today");
    render();
    expect(document.querySelector("h1")?.textContent).toBe("오늘");
    expect(document.body.textContent).toContain("들어와 있어요. 시험님의 기록 공간이에요.");
    expect(document.body.textContent).toContain("이 화면은 앱 뼈대를 확인하는 자리예요.");
    expect(document.querySelector("label[for=practice]")?.textContent).toBe("연습 칸");
    expect(document.getElementById("practice-help")?.textContent).toBe("여기에 적은 글은 어디에도 보내지 않아요.");
    expect(byText("앱 잠금")).toBeDefined();
    expect(byText("시트 열기")).toBeDefined();
    expect(byText("로그아웃")).toBeDefined();
    expect(byText("연습 버튼")).toBeDefined();
    // 잠금이 꺼져 있으면 '지금 잠그기'는 없다
    expect(byText("지금 잠그기")).toBeUndefined();
    // 연습 버튼은 화면 아래 고정 줄에 있다
    expect(byText("연습 버튼")?.closest(".bottom-bar")).not.toBeNull();
  });

  it("잠금이 켜져 있을 때만 '지금 잠그기'가 있고, 누르면 잠금을 청하고 잠금 층이 뜬다", async () => {
    app.appLock = true;
    const calls = stubFetch(() => ({ status: 204 }));
    history.replaceState(null, "", "/#/today");
    render();
    byText("지금 잠그기")?.click();
    await vi.waitFor(() => expect(document.getElementById("lock-layer")).not.toBeNull());
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual(["POST /api/app-lock/lock"]);
    expect(app.locked).toBe(true);
  });

  it("앱 잠금은 하위 화면으로 push한다", () => {
    history.replaceState(null, "", "/#/today");
    render();
    const length = history.length;
    byText("앱 잠금")?.click();
    expect(location.hash).toBe("#/settings/lock");
    expect(history.length).toBe(length + 1);
  });

  it("연습 버튼은 토스트 '눌렀어요', 시트 열기는 시트를 연다", () => {
    history.replaceState(null, "", "/#/today");
    render();
    byText("연습 버튼")?.click();
    expect(document.querySelector(".toast")?.textContent).toBe("눌렀어요");
    byText("시트 열기")?.click();
    expect(document.querySelector(".sheet")).not.toBeNull();
  });

  it("로그아웃: 확인 시트 → DELETE /api/session → 열쇠 화면 replace + 토스트, 연습 칸의 글도 비운다", async () => {
    const calls = stubFetch(() => ({ status: 200, body: { ok: true } }));
    history.replaceState(null, "", "/#/today");
    render();
    byText("로그아웃")?.click();
    const sheet = document.querySelector(".sheet");
    expect(sheet?.textContent).toContain("로그아웃할까요?");
    expect(sheet?.textContent).toContain("다시 들어올 때 열쇠가 필요해요.");
    practice.text = FAKE_NOTE;
    [...document.querySelectorAll<HTMLButtonElement>(".sheet button")].find((b) => b.textContent === "로그아웃")?.click();
    await vi.waitFor(() => expect(location.hash).toBe("#/auth"));
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual(["DELETE /api/session"]);
    expect(app.authenticated).toBe(false);
    expect(document.querySelector(".toast")?.textContent).toBe("로그아웃했어요");
    expect(practice.text).toBe("");
  });

  it("로그아웃이 연결 문제로 안 되면 로그인 상태를 그대로 두고 알린다", async () => {
    stubFetch(() => "offline");
    history.replaceState(null, "", "/#/today");
    render();
    byText("로그아웃")?.click();
    [...document.querySelectorAll<HTMLButtonElement>(".sheet button")].find((b) => b.textContent === "로그아웃")?.click();
    await vi.waitFor(() => expect(document.querySelector(".toast")?.textContent).toBe("인터넷에 연결되면 로그아웃할 수 있어요."));
    expect(app.authenticated).toBe(true);
    expect(location.hash).toBe("#/today");
  });

  it("이름은 새로 열린 뒤에는 서버에서 다시 받는다", async () => {
    Object.assign(app, { name: null });
    stubFetch(() => ({ status: 200, body: { name: "다시받음" } }));
    history.replaceState(null, "", "/#/today");
    render();
    await vi.waitFor(() => expect(document.body.textContent).toContain("다시받음님의 기록 공간이에요."));
  });
});

describe("연습 칸의 글은 어디에도 새지 않는다(S-12)", () => {
  it("서버 요청·저장소·개발용 상태 칸에 글이 없다", async () => {
    const calls = stubFetch(() => session({ appLock: true }));
    stopDev = startDev();
    history.replaceState(null, "", "/#/today");
    render();
    const box = document.getElementById("practice") as HTMLTextAreaElement;
    box.value = FAKE_NOTE;
    box.dispatchEvent(new Event("input", { bubbles: true }));
    expect(practice.text).toBe(FAKE_NOTE);

    // 이것저것 눌러 본다
    byText("연습 버튼")?.click();
    byText("시트 열기")?.click();
    emit({ type: "lifecycle", kind: "hidden", persisted: false });
    emit({ type: "startLock", navType: "navigate", hasMarker: false, lock: false, reason: "시험" });
    document.querySelector<HTMLButtonElement>(".dev-panel-toggle")?.click();
    await flush(20);

    const panel = document.querySelector(".dev-panel")?.textContent ?? "";
    expect(panel).toContain("마지막 API 응답");
    expect(panel).not.toContain(FAKE_NOTE);
    expect(panel).not.toContain("가짜 연습");
    expect(JSON.stringify(calls)).not.toContain("가짜 연습");
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain("가짜 연습");
    expect(location.href).not.toContain("가짜");
  });

  it("글이 다시 그려진 화면에도 남는다(잠금을 풀고 돌아오면 쓰던 글 그대로)", () => {
    history.replaceState(null, "", "/#/today");
    render();
    const box = document.getElementById("practice") as HTMLTextAreaElement;
    box.value = FAKE_NOTE;
    box.dispatchEvent(new Event("input", { bubbles: true }));
    render();
    expect((document.getElementById("practice") as HTMLTextAreaElement).value).toBe(FAKE_NOTE);
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
    // 위치는 아래 고정 버튼 줄을 가리지 않는 위쪽이다(CSS) — 여기서는 눌러도 잠금 층 밖 inert에 걸리지 않는 표시만 본다
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

    // 잠겨 있으면 보내지 않고 상태 칸에만 남는다
    app.locked = true;
    emit({ type: "error", error: { kind: "unhandledrejection", name: "RangeError" } });
    await flush(20);
    expect(calls).toHaveLength(1);
    document.querySelector<HTMLButtonElement>(".dev-panel-toggle")?.click();
    expect(document.querySelector(".dev-panel-body")?.textContent).toContain("RangeError");
  });
});
