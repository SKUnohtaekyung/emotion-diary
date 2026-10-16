/// <reference path="../../client/src/env.d.ts" />
// 오류 정리(D-113 ②, T3 A-6): 서버에 남기는 것은 일곱 칸뿐이고, 메시지·stack·주소 query의 글은 어디에도 남지 않는다.
import { describe, expect, it } from "vitest";
import { apiReport, toReport } from "../../client/src/dev/report";
import { errorNumber, errorParts, type ErrorLike, reportRouteOf } from "../../client/src/lib/errorInfo";
import { parseClientError } from "../../shared/dev";

// 시험 안에서 만든 가짜 값이다 — 실제 일기·열쇠가 아니다.
const FAKE_DIARY = "오늘 가짜일기 문장: 친구와 다퉈서 마음이 무거웠다";
const FAKE_KEY = "FAKE-KEY-0123456789abcdef-SECRET";

const noisy = (overrides: Record<string, unknown> = {}): ErrorLike =>
  ({
    kind: "error",
    name: "TypeError",
    filename: `${location.origin}/assets/index-abc123.js?token=${FAKE_KEY}#${encodeURIComponent(FAKE_DIARY)}`,
    lineno: 12,
    colno: 34,
    message: FAKE_DIARY,
    stack: `TypeError: ${FAKE_DIARY}\n    at ${location.origin}/assets/index-abc123.js?k=${FAKE_KEY}:12:34`,
    reason: FAKE_DIARY,
    ...overrides
  }) as unknown as ErrorLike;

describe("toReport", () => {
  it("일곱 칸만 남고 메시지·stack·query의 글은 결과 어디에도 없다", () => {
    const hash = `#/settings/pin?from=welcome&key=${FAKE_KEY}&note=${encodeURIComponent(FAKE_DIARY)}`;
    const report = toReport(noisy(), hash, "20261014T0930Z-abc1234");
    expect(report).toEqual({
      kind: "error",
      name: "TypeError",
      source: "/assets/index-abc123.js",
      line: 12,
      col: 34,
      build: "20261014T0930Z-abc1234",
      route: "settings/pin"
    });
    expect(Object.keys(report ?? {}).sort()).toEqual(["build", "col", "kind", "line", "name", "route", "source"]);
    const json = JSON.stringify(report);
    for (const secret of [FAKE_DIARY, FAKE_KEY, encodeURIComponent(FAKE_DIARY), "token", "stack", "message", "일기", "?", "#/"]) {
      expect(json).not.toContain(secret);
    }
    // 서버와 같은 검사를 통과한 모양이다
    expect(parseClientError(report)).toEqual(report);
  });

  it("다른 출처의 파일은 '/external'이고, 알 수 없으면 '/unknown'이며 줄·칸은 0이다", () => {
    expect(toReport(noisy({ filename: `https://evil.example/x.js?k=${FAKE_KEY}` }), "#/today", "b1")?.source).toBe("/external");
    expect(toReport(noisy({ filename: "" }), "#/today", "b1")?.source).toBe("/unknown");
    const rejection = toReport({ kind: "unhandledrejection", name: "TypeError" }, "#/today", "b1");
    expect(rejection).toMatchObject({ kind: "unhandledrejection", source: "/unknown", line: 0, col: 0 });
  });

  it("이름은 안전한 모양이면 그대로, 아니면 'Error'다", () => {
    expect(toReport(noisy({ name: "RangeError" }), "#/today", "b1")?.name).toBe("RangeError");
    expect(toReport(noisy({ name: FAKE_DIARY }), "#/today", "b1")?.name).toBe("Error");
    expect(toReport(noisy({ name: "Type Error" }), "#/today", "b1")?.name).toBe("Error");
    expect(toReport(noisy({ name: 42 }), "#/today", "b1")?.name).toBe("Error");
    expect(toReport(noisy({ name: undefined }), "#/today", "b1")?.name).toBe("Error");
  });

  it("줄·칸이 범위 밖이거나 정수가 아니면 0이다", () => {
    const report = toReport(noisy({ lineno: -3, colno: 1.5 }), "#/today", "b1");
    expect(report).toMatchObject({ line: 0, col: 0 });
  });

  it("화면 이름과 빌드를 서버 모양으로 맞춘다", () => {
    expect(toReport(noisy(), "settings/lock", "b1")?.route).toBe("settings/lock");
    expect(toReport(noisy(), "#/auth/name?x=1", "b1")?.route).toBe("auth/name");
    // 빌드에 모양 밖의 글자가 있어도 보낼 수 있는 모양으로 바뀐다
    expect(toReport(noisy(), "#/today", "빌드 번호/1")?.build).toMatch(/^[A-Za-z0-9.-]{1,40}$/);
  });
});

describe("apiReport", () => {
  it("상태 번호와 API 경로만 담고 query는 버린다", () => {
    expect(apiReport(`/api/session?key=${FAKE_KEY}`, 503, "#/today", "b1")).toEqual({
      kind: "api",
      name: "HTTP503",
      source: "/api/session",
      line: 0,
      col: 0,
      build: "b1",
      route: "today"
    });
  });
});

describe("오류 번호", () => {
  const base = { name: "TypeError", source: "/assets/a.js", line: 1, col: 2 };

  it("같은 고장은 같은 번호이고 6자다", () => {
    expect(errorNumber(base, "b1")).toBe(errorNumber({ ...base }, "b1"));
    expect(errorNumber(base, "b1")).toMatch(/^[0-9A-F]{6}$/);
  });

  it("종류 이름·파일·줄·칸·빌드 가운데 하나만 달라도 번호가 달라진다", () => {
    const numbers = new Set([
      errorNumber(base, "b1"),
      errorNumber({ ...base, name: "RangeError" }, "b1"),
      errorNumber({ ...base, source: "/assets/b.js" }, "b1"),
      errorNumber({ ...base, line: 2 }, "b1"),
      errorNumber({ ...base, col: 3 }, "b1"),
      errorNumber(base, "b2")
    ]);
    expect(numbers.size).toBe(6);
  });

  it("메시지가 달라도 번호는 같다(메시지는 읽지 않는다)", () => {
    const a = errorParts(noisy({ message: "하나" }));
    const b = errorParts(noisy({ message: FAKE_DIARY }));
    expect(errorNumber(a, "b1")).toBe(errorNumber(b, "b1"));
  });
});

describe("보고의 화면 이름(값 조각 빼기 — ARCHITECTURE §11.9)", () => {
  it("날짜 같은 값 조각과 query를 빼고 화면 이름만 남긴다", () => {
    expect(reportRouteOf("#/record/2026-10-14?step=2")).toBe("record");
    expect(reportRouteOf("#/settings/lock")).toBe("settings/lock");
    expect(reportRouteOf("#/today")).toBe("today");
    expect(reportRouteOf("#/")).toBe("unknown");
    expect(reportRouteOf("#/2026-10-14")).toBe("unknown");
  });

  it("toReport의 route 칸에도 날짜가 실리지 않는다", () => {
    const report = toReport(noisy(), "#/record/2026-10-14", "b1");
    expect(report?.route).toBe("record");
    expect(JSON.stringify(report)).not.toContain("2026-10-14");
  });
});
