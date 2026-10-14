/// <reference path="../../client/src/env.d.ts" />
// 화면 주소와 들어갈 수 있는지의 판단(T3 A-4, UX_SPEC §16·§17).
import { describe, expect, it } from "vitest";
import { guardRoute, isReturnable, loginDestination, parseHash, type GuardState } from "../../client/src/lib/routes";
import { formatRemaining } from "../../client/src/lib/format";

describe("parseHash", () => {
  it("화면 이름과 query를 가른다", () => {
    const route = parseHash("#/settings/pin?from=welcome");
    expect(route.path).toBe("settings/pin");
    expect(route.query.get("from")).toBe("welcome");
    expect(route.known).toBe(true);
  });

  it("비었거나 모르는 이름이면 known이 거짓이다", () => {
    expect(parseHash("").known).toBe(false);
    expect(parseHash("#/").known).toBe(false);
    expect(parseHash("#/nowhere").known).toBe(false);
    expect(parseHash("#/today/").path).toBe("today");
  });
});

const state = (overrides: Partial<GuardState> = {}): GuardState => ({
  authenticated: false,
  hasName: false,
  forgotPin: false,
  ...overrides
});

describe("guardRoute", () => {
  it("로그인 전: 열쇠 화면은 그대로, 돌아갈 만한 화면은 again과 돌아갈 곳, 나머지는 열쇠 화면", () => {
    expect(guardRoute(state(), parseHash("#/auth?s=pin"))).toEqual({ redirect: null, returnTo: null });
    expect(guardRoute(state(), parseHash("#/today"))).toEqual({ redirect: "#/auth?s=again", returnTo: "today" });
    expect(guardRoute(state(), parseHash("#/settings/lock"))).toEqual({ redirect: "#/auth?s=again", returnTo: "settings/lock" });
    expect(guardRoute(state(), parseHash(""))).toEqual({ redirect: "#/auth", returnTo: null });
    expect(guardRoute(state(), parseHash("#/welcome"))).toEqual({ redirect: "#/auth", returnTo: null });
    expect(guardRoute(state(), parseHash("#/auth/name"))).toEqual({ redirect: "#/auth", returnTo: null });
  });

  it("비밀번호를 잊어 다시 들어오는 중이면 열쇠 화면의 pin 변형을 잃지 않는다", () => {
    expect(guardRoute(state({ forgotPin: true }), parseHash("#/today"))).toEqual({ redirect: "#/auth?s=pin", returnTo: null });
  });

  it("로그인됨: 열쇠 화면으로 돌아오지 못한다", () => {
    expect(guardRoute(state({ authenticated: true, hasName: true }), parseHash("#/auth"))).toEqual({ redirect: "#/today", returnTo: null });
    expect(guardRoute(state({ authenticated: true }), parseHash("#/auth?s=again"))).toEqual({ redirect: "#/auth/name", returnTo: null });
  });

  it("이름이 없으면 이름 화면만, 있으면 이름 화면은 지나갔다", () => {
    const noName = state({ authenticated: true });
    expect(guardRoute(noName, parseHash("#/today")).redirect).toBe("#/auth/name");
    expect(guardRoute(noName, parseHash("#/auth/name")).redirect).toBeNull();
    const named = state({ authenticated: true, hasName: true });
    expect(guardRoute(named, parseHash("#/auth/name")).redirect).toBe("#/today");
  });

  it("모르는 주소는 오늘로", () => {
    const named = state({ authenticated: true, hasName: true });
    expect(guardRoute(named, parseHash("")).redirect).toBe("#/today");
    expect(guardRoute(named, parseHash("#/nowhere")).redirect).toBe("#/today");
    expect(guardRoute(named, parseHash("#/settings/lock")).redirect).toBeNull();
  });
});

describe("loginDestination", () => {
  it("비밀번호를 잊어 왔으면 새 비밀번호 정하기가 먼저다", () => {
    expect(loginDestination({ variant: "pin", hasName: true, returnTo: "settings/lock" })).toBe("#/settings/pin?from=forgot");
  });

  it("이름이 없으면 이름 화면, 있으면 돌아갈 곳, 없으면 오늘", () => {
    expect(loginDestination({ variant: null, hasName: false, returnTo: "today" })).toBe("#/auth/name");
    expect(loginDestination({ variant: "again", hasName: true, returnTo: "settings/lock" })).toBe("#/settings/lock");
    expect(loginDestination({ variant: null, hasName: true, returnTo: null })).toBe("#/today");
  });

  it("sessionStorage의 값이 엉뚱해도 돌아갈 수 있는 화면 이름만 따른다", () => {
    expect(loginDestination({ variant: null, hasName: true, returnTo: "https://evil.example" })).toBe("#/today");
    expect(loginDestination({ variant: null, hasName: true, returnTo: "auth" })).toBe("#/today");
    expect(isReturnable("today")).toBe(true);
    expect(isReturnable("welcome")).toBe(false);
  });
});

describe("formatRemaining", () => {
  it("초를 N분 N초로 읽기 쉽게", () => {
    expect(formatRemaining(300)).toBe("5분");
    expect(formatRemaining(65)).toBe("1분 5초");
    expect(formatRemaining(59)).toBe("59초");
    expect(formatRemaining(0)).toBe("0초");
    expect(formatRemaining(0.2)).toBe("1초");
    expect(formatRemaining(-5)).toBe("0초");
  });
});
