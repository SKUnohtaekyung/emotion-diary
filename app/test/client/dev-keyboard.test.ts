/// <reference path="../../client/src/env.d.ts" />
// 개발용 자판 측정(TASK-PERSONAL-01 A-8): 글 칸에 들어갈 때 재는 숫자, 글이 새지 않음, 단추는 재지 않음, 정리.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { startDev } from "../../client/src/dev/index";
import { measure } from "../../client/src/dev/keyboard";
import { mountShell } from "./helpers";

let stopDev: (() => void) | null = null;

beforeEach(() => {
  mountShell();
  localStorage.clear();
});

afterEach(() => {
  stopDev?.();
  stopDev = null;
});

const openPanel = (): string => {
  document.querySelector<HTMLButtonElement>(".dev-panel-toggle")?.click();
  return document.querySelector(".dev-panel-body")?.textContent ?? "";
};

describe("개발용 자판 측정", () => {
  it("글 칸에 들어가면 '누른 순간' 기록이 숫자로 남고, 적은 글은 상태 칸에 없다", () => {
    stopDev = startDev();
    const area = document.createElement("textarea");
    area.value = "가짜 비밀 문장";
    document.getElementById("app")?.append(area);
    area.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    const text = openPanel();
    expect(text).toContain("자판 · 누른 순간");
    expect(text).toContain("vv.offsetTop");
    expect(text).toContain("자판이 가린 높이");
    expect(text).not.toContain("가짜 비밀");
  });

  it("단추·체크 칸에 들어갈 때는 재지 않는다", () => {
    stopDev = startDev();
    const button = document.createElement("button");
    document.getElementById("app")?.append(button);
    button.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(openPanel()).not.toContain("누른 순간");
  });

  it("멈추면 보이지 않는 측정 칸을 치운다", () => {
    stopDev = startDev();
    expect(document.querySelector(".dev-safe-probe")).not.toBeNull();
    stopDev();
    stopDev = null;
    expect(document.querySelector(".dev-safe-probe")).toBeNull();
  });

  it("재는 값은 정해진 칸 이름과 숫자·길이 값뿐이다", () => {
    const shot = measure("시험", { vv: 2, win: 1 });
    expect(shot.rows.map(([label]) => label)).toEqual([
      "scrollY",
      "문서 높이/보이는 높이",
      "vv.offsetTop",
      "vv.pageTop",
      "vv.height",
      "innerHeight",
      "자판이 가린 높이",
      "안전 영역 위",
      "맨 위 줄 top",
      "#app scrollTop",
      "스크롤 사건(vv/창)"
    ]);
    for (const [, value] of shot.rows) expect(value).toMatch(/^(없음|-?\d+(\.\d+)?(px)?|\d+\/\d+)$/);
  });
});
