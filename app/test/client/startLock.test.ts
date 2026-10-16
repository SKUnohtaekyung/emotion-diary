/// <reference path="../../client/src/env.d.ts" />
// 시작 잠금 판단(T3 A-15, 잠정): 잠금이 켜져 있고 아직 안 잠겼고, 탐색 종류가 navigate이며 이 탭에 표식이 없을 때만 잠금을 청한다.
import { describe, expect, it } from "vitest";
import { shouldLockOnStart, startLockDecision, type StartLockInput } from "../../client/src/lib/startLock";

const base: StartLockInput = { navType: "navigate", hasMarker: false, appLock: true, locked: false };

describe("shouldLockOnStart", () => {
  it("새로 켠 것(navigate, 표식 없음, 잠금 켜짐, 아직 안 잠김)이면 잠근다", () => {
    expect(shouldLockOnStart(base)).toBe(true);
  });

  it("표식이 있으면(같은 탭에서 다시 시작) 잠그지 않는다", () => {
    expect(shouldLockOnStart({ ...base, hasMarker: true })).toBe(false);
  });

  it("앱 잠금이 꺼져 있으면 잠그지 않는다", () => {
    expect(shouldLockOnStart({ ...base, appLock: false })).toBe(false);
  });

  it("이미 잠겨 있으면 다시 청하지 않는다", () => {
    expect(shouldLockOnStart({ ...base, locked: true })).toBe(false);
  });

  it.each(["reload", "back_forward", "prerender", undefined])("탐색 종류가 %s이면 새로 켠 것이 아니다", (navType) => {
    expect(shouldLockOnStart({ ...base, navType })).toBe(false);
  });

  it("모든 조합의 판단은 '네 조건이 모두 맞을 때만 참'이다", () => {
    for (const navType of ["navigate", "reload", undefined]) {
      for (const hasMarker of [false, true]) {
        for (const appLock of [false, true]) {
          for (const locked of [false, true]) {
            const expected = navType === "navigate" && !hasMarker && appLock && !locked;
            expect(shouldLockOnStart({ navType, hasMarker, appLock, locked })).toBe(expected);
          }
        }
      }
    }
  });

  it("판단마다 개발용 상태 칸에 보일 이유가 있다", () => {
    expect(startLockDecision(base).reason).not.toBe("");
    expect(startLockDecision({ ...base, navType: "reload" }).reason).toContain("reload");
    expect(startLockDecision({ ...base, hasMarker: true }).reason).toContain("표식");
  });
});
