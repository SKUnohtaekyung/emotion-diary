/// <reference path="../../client/src/env.d.ts" />
// 열쇠 화면(UX_SPEC §16 상태 표): 구조(암호 보관함이 알아보는 두 칸), 상태별 문구, 로그인 뒤 목적지. 서버는 가짜 fetch다.
// 시험의 열쇠는 이 파일 안에서 만든 가짜 값이다.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerViews, render, resetRouterForTest, startRouter, type ViewContext } from "../../client/src/router";
import { app } from "../../client/src/state";
import { resetSheetsForTest } from "../../client/src/ui/sheet";
import { AUTH_TEXT, renderAuth } from "../../client/src/views/auth";
import { flush, mountShell, session, stubFetch, type FakeHandler } from "./helpers";

const FAKE_KEY = "fake-key-for-test-0000";

const stub = (name: string) => (context: ViewContext) => {
  const heading = document.createElement("h1");
  heading.textContent = name;
  context.root.append(heading);
  return () => {};
};

const keyInput = () => document.getElementById("access-key") as HTMLInputElement;
const submitButton = () => document.querySelector<HTMLButtonElement>("button[type=submit]");
const errorBox = () => document.getElementById("access-key-error");
const form = () => document.querySelector("form");

function matchMedia(coarse: boolean, installed = false): void {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(pointer: coarse)" ? coarse : installed && query === "(display-mode: standalone)"
  }));
}

function open(search = ""): void {
  history.replaceState(null, "", `/#/auth${search}`);
  render();
}

async function enterKey(value: string): Promise<void> {
  keyInput().value = value;
  form()?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
  await flush(0);
}

beforeEach(() => {
  mountShell();
  localStorage.clear();
  sessionStorage.clear();
  resetRouterForTest();
  resetSheetsForTest();
  Object.assign(app, { authenticated: false, locked: false, appLock: false, hasName: false, name: null });
  registerViews({ auth: renderAuth, "auth/name": stub("name"), today: stub("today"), "settings/lock": stub("lock"), "settings/pin": stub("pin") });
  startRouter();
  matchMedia(false);
  Object.defineProperty(navigator, "onLine", { configurable: true, get: () => true });
});

afterEach(() => {
  resetRouterForTest();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("구조", () => {
  it("보이지 않는 username 칸과 암호 칸이 한 form에 있다(암호 보관함이 알아본다)", () => {
    open();
    const username = document.querySelector<HTMLInputElement>("input[name=username]");
    expect(username).not.toBeNull();
    expect(username?.getAttribute("type")).toBe("text");
    expect(username?.getAttribute("autocomplete")).toBe("username");
    expect(username?.value).toBe("emotion-diary");
    expect(username?.getAttribute("aria-hidden")).toBe("true");
    expect(username?.getAttribute("tabindex")).toBe("-1");
    expect(username?.classList.contains("offscreen")).toBe(true);
    // display:none·hidden은 쓰지 않는다
    expect(username?.hasAttribute("hidden")).toBe(false);

    const key = keyInput();
    expect(key.type).toBe("password");
    expect(key.name).toBe("password");
    expect(key.getAttribute("autocomplete")).toBe("current-password");
    expect(key.getAttribute("autocapitalize")).toBe("off");
    expect(key.getAttribute("autocorrect")).toBe("off");
    expect(key.getAttribute("spellcheck")).toBe("false");
    expect(document.querySelector("label[for=access-key]")?.textContent).toBe("열쇠");
    expect(form()?.contains(username)).toBe(true);
    expect(form()?.contains(key)).toBe(true);
    expect(document.querySelector("h1")?.textContent).toBe("열쇠를 넣어 주세요");
    expect(submitButton()?.textContent).toBe("들어가기");
  });

  it("변형: 다시 들어와 주세요 / 비밀번호를 잊어서 옴", () => {
    open("?s=again");
    expect(document.querySelector("h1")?.textContent).toBe("다시 들어와 주세요");
    expect(document.body.textContent).not.toContain(AUTH_TEXT.pinNote);
    open("?s=pin");
    expect(document.querySelector("h1")?.textContent).toBe("다시 들어와 주세요");
    expect(document.body.textContent).toContain("열쇠를 넣으면 새 비밀번호를 정할 수 있어요. 기록은 그대로 있어요.");
  });

  it("열쇠 보기 전환: 칸 종류와 이름, aria-pressed가 함께 바뀐다", () => {
    open();
    const toggle = document.querySelector<HTMLButtonElement>(".field-toggle");
    expect(toggle?.textContent).toBe("열쇠 보기");
    expect(toggle?.getAttribute("aria-pressed")).toBe("false");
    toggle?.click();
    expect(keyInput().type).toBe("text");
    expect(toggle?.textContent).toBe("열쇠 숨기기");
    expect(toggle?.getAttribute("aria-pressed")).toBe("true");
    toggle?.click();
    expect(keyInput().type).toBe("password");
  });

  it("한글 조합 중 Enter는 제출이 아니다", async () => {
    const calls = stubFetch(() => session());
    open();
    keyInput().value = FAKE_KEY;
    const event = new KeyboardEvent("keydown", { key: "Enter", isComposing: true, cancelable: true, bubbles: true });
    keyInput().dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    keyInput().dispatchEvent(new Event("compositionstart"));
    form()?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    await flush(10);
    expect(calls).toHaveLength(0);
  });
});

describe("상태 표", () => {
  it("틀린 열쇠(401 invalid_key): 칸 아래 안내, 칸의 글자는 지우지 않는다", async () => {
    stubFetch(() => ({ status: 401, body: { error: "invalid_key" } }));
    open();
    await enterKey(FAKE_KEY);
    await vi.waitFor(() => expect(errorBox()?.textContent).toBe("열쇠가 맞지 않아요. 다시 확인해 주세요."));
    expect(keyInput().value).toBe(FAKE_KEY);
    expect(keyInput().getAttribute("aria-describedby")).toBe("access-key-error");
    expect(submitButton()?.textContent).toBe("들어가기");
  });

  it("확인 중: 버튼이 '확인하는 중…'이 되고 다시 눌려도 두 번 보내지 않는다", async () => {
    let release: (() => void) | undefined;
    const calls = stubFetch(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ status: 401, body: { error: "invalid_key" } });
        })
    );
    open();
    await enterKey(FAKE_KEY);
    expect(submitButton()?.textContent).toBe("확인하는 중…");
    expect(submitButton()?.getAttribute("aria-disabled")).toBe("true");
    form()?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    await flush(0);
    expect(calls).toHaveLength(1);
    release?.();
    await vi.waitFor(() => expect(submitButton()?.textContent).toBe("들어가기"));
  });

  it("여러 번 틀려 잠김(429): 안내와 남은 시간이 1초마다 줄고, 끝나면 다시 눌린다", async () => {
    vi.useFakeTimers();
    stubFetch(() => ({ status: 429, body: { error: "key_locked", retryAfter: 65 } }));
    open();
    keyInput().value = FAKE_KEY;
    form()?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    await vi.advanceTimersByTimeAsync(0);
    expect(errorBox()?.textContent).toContain("잠시 뒤에 다시 시도해 주세요.");
    expect(errorBox()?.textContent).toContain("남은 시간 1분 5초");
    expect(submitButton()?.getAttribute("aria-disabled")).toBe("true");

    await vi.advanceTimersByTimeAsync(1000);
    expect(errorBox()?.textContent).toContain("남은 시간 1분 4초");

    await vi.advanceTimersByTimeAsync(65_000);
    expect(errorBox()?.textContent).toBe("");
    expect(submitButton()?.getAttribute("aria-disabled")).toBe("false");
  });

  it("연결 끊김: fetch 실패와 navigator.onLine === false 모두", async () => {
    const calls = stubFetch(() => "offline");
    open();
    await enterKey(FAKE_KEY);
    await vi.waitFor(() => expect(errorBox()?.textContent).toBe("인터넷에 연결되면 들어올 수 있어요."));

    Object.defineProperty(navigator, "onLine", { configurable: true, get: () => false });
    const before = calls.length;
    await enterKey(FAKE_KEY);
    expect(errorBox()?.textContent).toBe("인터넷에 연결되면 들어올 수 있어요.");
    expect(calls).toHaveLength(before); // 보내지 않았다
  });

  it("서버 오류(5xx)", async () => {
    stubFetch(() => ({ status: 503, body: { error: "server_error" } }));
    open();
    await enterKey(FAKE_KEY);
    await vi.waitFor(() => expect(errorBox()?.textContent).toBe("지금은 들어올 수 없어요. 잠시 뒤 다시 시도해 주세요."));
  });

  it("열쇠는 맞았는데 다시 확인하면 '로그인 안 됨': 쿠키를 의심하는 두 줄을 보인다", async () => {
    stubFetch((request) => (request.method === "POST" ? { status: 200, body: { ok: true } } : session({ authenticated: false })));
    open();
    await enterKey(FAKE_KEY);
    await vi.waitFor(() => expect(errorBox()?.textContent).toContain("들어온 상태가 남지 않아요."));
    const lines = [...(errorBox()?.querySelectorAll("p") ?? [])].map((node) => node.textContent);
    expect(lines).toEqual([
      "들어온 상태가 남지 않아요.",
      "Safari 설정에서 쿠키를 막아 두었는지 봐 주세요.",
      "내용을 막는 앱이 켜져 있는지 봐 주세요."
    ]);
    expect(location.hash).toBe("#/auth");
  });

  it("빈 칸으로 제출하면 서버에 보내지 않고 안내한다", async () => {
    const calls = stubFetch(() => session());
    open();
    await enterKey("");
    expect(calls).toHaveLength(0);
    expect(errorBox()?.textContent).toBe("열쇠를 넣어 주세요.");
  });
});

describe("로그인 성공", () => {
  const login: FakeHandler = (request) =>
    request.method === "POST" ? { status: 200, body: { ok: true } } : session({ hasName: true });

  it("POST /api/session 본문에 열쇠, 이어서 GET 한 번, 열쇠 화면을 바꿔치워 오늘로 간다", async () => {
    const calls = stubFetch(login);
    history.replaceState(null, "", "/#/earlier");
    history.pushState(null, "", "#/auth");
    render();
    const length = history.length;
    await enterKey(FAKE_KEY);
    await vi.waitFor(() => expect(location.hash).toBe("#/today"));
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual(["POST /api/session", "GET /api/session"]);
    expect(calls[0]?.body).toEqual({ key: FAKE_KEY });
    expect(calls[0]?.headers["x-requested-with"]).toBe("emotion-diary");
    expect(history.length).toBe(length); // replace
    expect(app.authenticated).toBe(true);
    // 열쇠는 저장소 어디에도 남지 않는다
    expect(JSON.stringify({ ...localStorage })).not.toContain(FAKE_KEY);
    expect(JSON.stringify({ ...sessionStorage })).not.toContain(FAKE_KEY);
    expect(location.href).not.toContain(FAKE_KEY);
  });

  it("returnTo가 있으면 그곳으로(쓰고 나면 지운다)", async () => {
    stubFetch(login);
    sessionStorage.setItem("returnTo", "settings/lock");
    open("?s=again");
    await enterKey(FAKE_KEY);
    await vi.waitFor(() => expect(location.hash).toBe("#/settings/lock"));
    expect(sessionStorage.getItem("returnTo")).toBeNull();
  });

  it("비밀번호를 잊어서 왔으면 새 비밀번호 정하기로", async () => {
    stubFetch(login);
    sessionStorage.setItem("forgotPin", "1");
    open("?s=pin");
    await enterKey(FAKE_KEY);
    await vi.waitFor(() => expect(location.hash).toBe("#/settings/pin?from=forgot"));
    expect(sessionStorage.getItem("forgotPin")).toBeNull();
  });

  it("이름이 없으면 이름 화면으로", async () => {
    stubFetch((request) => (request.method === "POST" ? { status: 200, body: { ok: true } } : session({ hasName: false })));
    open();
    await enterKey(FAKE_KEY);
    await vi.waitFor(() => expect(location.hash).toBe("#/auth/name"));
  });
});

describe("설치 안내 줄", () => {
  it("홈 화면 앱이 아니고 터치 기기이고 닫은 적이 없으면 보인다 — 누르면 시트, ×는 닫았다는 표시만 남긴다", () => {
    matchMedia(true);
    open();
    const hint = document.querySelector(".install-hint");
    expect(hint?.textContent).toContain("홈 화면에 추가해 앱처럼 열 수 있어요 ›");

    document.querySelector<HTMLButtonElement>(".hint-open")?.click();
    const sheet = document.querySelector(".sheet");
    expect(sheet?.textContent).toContain("홈 화면에 추가하기");
    expect(sheet?.textContent).toContain("1. Safari 아래쪽의 공유 버튼을 눌러요");
    expect(sheet?.textContent).toContain("2. '홈 화면에 추가'를 골라요");
    expect(sheet?.textContent).toContain("홈 화면 앱에서는 열쇠를 한 번 더 넣어요.");
    resetSheetsForTest();
    document.querySelector(".sheet-layer")?.remove();
    document.getElementById("app")?.removeAttribute("inert");

    document.querySelector<HTMLButtonElement>(".hint-close")?.click();
    expect(document.querySelector(".install-hint")).toBeNull();
    expect(localStorage.getItem("installHintClosed")).toBe("1");
  });

  it("닫은 적이 있거나, 홈 화면 앱이거나, 터치 기기가 아니면 보이지 않는다", () => {
    matchMedia(true);
    localStorage.setItem("installHintClosed", "1");
    open();
    expect(document.querySelector(".install-hint")).toBeNull();

    localStorage.clear();
    matchMedia(true, true);
    open();
    expect(document.querySelector(".install-hint")).toBeNull();

    matchMedia(false);
    open();
    expect(document.querySelector(".install-hint")).toBeNull();
  });

  it("localStorage가 막혀 있어도 화면은 그려진다", () => {
    matchMedia(true);
    const blocked = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(() => open()).not.toThrow();
    expect(document.querySelector(".install-hint")).not.toBeNull();
    blocked.mockRestore();
  });
});
