/// <reference path="../../client/src/env.d.ts" />
// 홈 화면 앱 판정(T3 A-13): display-mode가 standalone·fullscreen이거나 navigator.standalone이 참이면 설치 앱이다.
import { describe, expect, it } from "vitest";
import { isInstalled, shouldShowInstallHint } from "../../client/src/lib/install";

const env = (matching: string[], standalone?: boolean) => ({
  matchMedia: (query: string) => ({ matches: matching.includes(query) }),
  navigator: { standalone }
});

describe("isInstalled", () => {
  it("display-mode: standalone", () => {
    expect(isInstalled(env(["(display-mode: standalone)"]))).toBe(true);
  });

  it("display-mode: fullscreen(설치 앱에서 standalone이 거짓으로 오는 보고가 있다)", () => {
    expect(isInstalled(env(["(display-mode: fullscreen)"]))).toBe(true);
  });

  it("navigator.standalone === true(iOS)", () => {
    expect(isInstalled(env([], true))).toBe(true);
  });

  it("그 밖에는 브라우저다", () => {
    expect(isInstalled(env([]))).toBe(false);
    expect(isInstalled(env(["(display-mode: browser)"], false))).toBe(false);
  });
});

describe("shouldShowInstallHint", () => {
  it("홈 화면 앱이 아니고 터치 기기이고 닫은 적이 없을 때만 보인다", () => {
    expect(shouldShowInstallHint({ installed: false, coarsePointer: true, closed: false })).toBe(true);
    expect(shouldShowInstallHint({ installed: true, coarsePointer: true, closed: false })).toBe(false);
    expect(shouldShowInstallHint({ installed: false, coarsePointer: false, closed: false })).toBe(false);
    expect(shouldShowInstallHint({ installed: false, coarsePointer: true, closed: true })).toBe(false);
  });
});
