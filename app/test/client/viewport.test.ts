/// <reference path="../../client/src/env.d.ts" />
// 자판이 가린 높이(TASK-PERSONAL-01 A-8, D-125): 문서는 스크롤하지 않고 #app만 스크롤하므로 자판 높이만큼 #app 아래를 비운다.
// 숫자는 2026-10-20 iPhone 실측(PLAN 4-9): 자판이 뜨면 innerHeight 730, visualViewport 높이 417.
import { afterEach, describe, expect, it } from "vitest";
import { installViewportInset, keyboardInset } from "../../client/src/lib/viewport";

class FakeViewport extends EventTarget {
  height = 793;
  offsetTop = 0;
  set(height: number, offsetTop = 0): void {
    this.height = height;
    this.offsetTop = offsetTop;
    this.dispatchEvent(new Event("resize"));
  }
}

const original = Object.getOwnPropertyDescriptor(window, "visualViewport");
let stop: (() => void) | null = null;

function useViewport(viewport: FakeViewport | undefined, innerHeight: number): void {
  Object.defineProperty(window, "visualViewport", { configurable: true, value: viewport });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: innerHeight, writable: true });
}

afterEach(() => {
  stop?.();
  stop = null;
  if (original) Object.defineProperty(window, "visualViewport", original);
  document.documentElement.style.removeProperty("--keyboard-inset");
});

const inset = (): string => document.documentElement.style.getPropertyValue("--keyboard-inset");

describe("자판이 가린 높이", () => {
  it("보이는 영역 아래로 가려진 높이를 반올림해 돌려주고, 자판이 없으면 0이다", () => {
    expect(keyboardInset(730, { height: 417, offsetTop: 0 })).toBe(313);
    expect(keyboardInset(730, { height: 417.4, offsetTop: 0.2 })).toBe(312);
    expect(keyboardInset(793, { height: 793, offsetTop: 0 })).toBe(0);
    expect(keyboardInset(793, { height: 800, offsetTop: 0 })).toBe(0);
  });

  it("자판이 뜨면 --keyboard-inset을 달고, 내리면 뗀다", () => {
    const viewport = new FakeViewport();
    useViewport(viewport, 793);
    stop = installViewportInset();
    expect(inset()).toBe("");

    (window as { innerHeight: number }).innerHeight = 730;
    viewport.set(417);
    expect(inset()).toBe("313px");

    (window as { innerHeight: number }).innerHeight = 793;
    viewport.set(793);
    expect(inset()).toBe("");
  });

  it("멈추면 값을 떼고 더 듣지 않는다", () => {
    const viewport = new FakeViewport();
    useViewport(viewport, 730);
    stop = installViewportInset();
    viewport.set(417);
    expect(inset()).toBe("313px");
    stop();
    stop = null;
    expect(inset()).toBe("");
    viewport.set(300);
    expect(inset()).toBe("");
  });

  it("visualViewport가 없으면 아무것도 하지 않는다", () => {
    useViewport(undefined, 730);
    stop = installViewportInset();
    expect(inset()).toBe("");
  });
});
