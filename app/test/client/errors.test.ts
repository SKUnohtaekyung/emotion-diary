/// <reference path="../../client/src/env.d.ts" />
// 오류 처리(D-113 ②, T3 A-6): 운영의 '문제가 생겼어요' 화면과 오류 번호. 서버로 아무것도 보내지 않는다.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleFatal, installErrorHandlers } from "../../client/src/errors";
import { listen } from "../../client/src/lib/probe";
import { resetCrashForTest } from "../../client/src/ui/crash";
import { mountShell, stubFetch } from "./helpers";

const FAKE_DIARY = "가짜 일기 문장: 오늘은 정말 힘들었다";
let dispose: () => void;

beforeEach(() => {
  mountShell();
  resetCrashForTest();
  // 듣는 쪽이 없는 동안 쌓인 사건을 비운다
  listen(() => {})();
  dispose = installErrorHandlers();
});

afterEach(() => {
  dispose();
  resetCrashForTest();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const number = () => document.getElementById("app")?.textContent?.match(/오류 번호 ([0-9A-F]{6})/)?.[1];

describe("오류 화면", () => {
  it("window error: '문제가 생겼어요' + 오류 번호 6자 + 다시 열기", () => {
    window.dispatchEvent(
      new ErrorEvent("error", { message: FAKE_DIARY, filename: `${location.origin}/assets/a.js?x=1`, lineno: 5, colno: 6, error: new TypeError(FAKE_DIARY) })
    );
    expect(document.querySelector("h1")?.textContent).toBe("문제가 생겼어요");
    expect(number()).toMatch(/^[0-9A-F]{6}$/);
    expect(document.querySelector("button")?.textContent).toBe("다시 열기");
    // 메시지는 화면 어디에도 없다
    expect(document.body.textContent).not.toContain(FAKE_DIARY);
    expect(document.title).toBe("문제가 생겼어요 — 감정일기");
  });

  it("다시 열기를 누르면 새로 고친다", () => {
    const reload = vi.spyOn(window.location, "reload").mockImplementation(() => {});
    handleFatal({ kind: "error", name: "TypeError", filename: `${location.origin}/assets/a.js`, lineno: 1, colno: 1 });
    expect(reload).not.toHaveBeenCalled();
    document.querySelector("button")?.click();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("unhandledrejection도 같은 화면이다", () => {
    const event = new Event("unhandledrejection") as Event & { reason: unknown };
    event.reason = new RangeError(FAKE_DIARY);
    window.dispatchEvent(event);
    expect(document.querySelector("h1")?.textContent).toBe("문제가 생겼어요");
    expect(document.body.textContent).not.toContain(FAKE_DIARY);
  });

  it("같은 고장은 같은 번호이고 메시지가 달라도 같다", () => {
    const fire = (message: string) => {
      resetCrashForTest();
      mountShell();
      window.dispatchEvent(
        new ErrorEvent("error", { message, filename: `${location.origin}/assets/a.js`, lineno: 5, colno: 6, error: new TypeError(message) })
      );
      return number();
    };
    const first = fire("하나");
    expect(fire(FAKE_DIARY)).toBe(first);
    // 위치가 다르면 번호가 다르다
    resetCrashForTest();
    mountShell();
    window.dispatchEvent(
      new ErrorEvent("error", { message: "하나", filename: `${location.origin}/assets/a.js`, lineno: 6, colno: 6, error: new TypeError("하나") })
    );
    expect(number()).not.toBe(first);
  });

  it("서버로 아무것도 보내지 않는다(운영의 동작 — 보고는 개발용 모듈의 일이다)", () => {
    const calls = stubFetch(() => ({ status: 204 }));
    handleFatal({ kind: "error", name: "TypeError", filename: `${location.origin}/assets/a.js`, lineno: 1, colno: 1 });
    expect(calls).toHaveLength(0);
  });

  it("오류 화면은 한 번만 그려진다(처음 번호가 남는다)", () => {
    handleFatal({ kind: "error", name: "TypeError", filename: `${location.origin}/assets/a.js`, lineno: 1, colno: 1 });
    const first = number();
    handleFatal({ kind: "error", name: "RangeError", filename: `${location.origin}/assets/b.js`, lineno: 2, colno: 2 });
    expect(number()).toBe(first);
  });

  it("개발용 통로(probe)에도 알려서 상태 칸이 받을 수 있다", () => {
    const seen: string[] = [];
    const stop = listen((event) => {
      if (event.type === "error") seen.push(event.error.kind);
    });
    handleFatal({ kind: "unhandledrejection", name: "TypeError" });
    stop();
    expect(seen).toEqual(["unhandledrejection"]);
  });
});
