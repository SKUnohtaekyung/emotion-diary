/// <reference path="../../client/src/env.d.ts" />
// 부를 이름: 글자 수는 코드 포인트로 세고(한글·이모지), 입력 중에는 값을 자르지 않는다.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NAME_MAX, normalizeName } from "../../shared/api";
import { codePointLength } from "../../client/src/lib/format";
import { parseHash } from "../../client/src/lib/routes";
import { app } from "../../client/src/state";
import { nameProblem, renderName } from "../../client/src/views/name";
import { flush, mountShell, stubFetch } from "./helpers";

describe("코드 포인트 수", () => {
  it("한글은 한 글자씩, 이모지는 하나로 센다", () => {
    expect(codePointLength("가나다라마바사아자차카타")).toBe(12);
    expect(codePointLength("😀")).toBe(1);
    expect("😀".length).toBe(2); // UTF-16으로 세면 둘이다 — 그래서 코드 포인트로 센다
    expect(codePointLength("😀".repeat(12))).toBe(12);
    expect(codePointLength("a😀가")).toBe(3);
  });

  it("12자는 되고 13자는 안 된다(한글·이모지 모두)", () => {
    expect(normalizeName("가".repeat(NAME_MAX))).not.toBeNull();
    expect(normalizeName("가".repeat(NAME_MAX + 1))).toBeNull();
    expect(normalizeName("😀".repeat(NAME_MAX))).not.toBeNull();
    expect(normalizeName("😀".repeat(NAME_MAX + 1))).toBeNull();
  });

  it("안내 문구: 비었으면 적어 달라고, 넘치면 12자까지라고", () => {
    expect(nameProblem("")).toBe("부를 이름을 적어 주세요.");
    expect(nameProblem("   ")).toBe("부를 이름을 적어 주세요.");
    expect(nameProblem("가".repeat(13))).toBe("12자까지 적을 수 있어요.");
    expect(nameProblem("😀".repeat(13))).toBe("12자까지 적을 수 있어요.");
    expect(nameProblem("  시험  ")).toBeNull();
  });
});

describe("이름 화면", () => {
  const route = parseHash("#/auth/name");
  let root: HTMLElement;

  const input = () => document.getElementById("call-name") as HTMLInputElement;
  const count = () => document.getElementById("call-name-count");
  const error = () => document.getElementById("call-name-error");
  const type = (value: string) => {
    input().value = value;
    input().dispatchEvent(new Event("input", { bubbles: true }));
  };
  const submit = () => document.querySelector("form")?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));

  beforeEach(() => {
    mountShell();
    root = document.getElementById("app") as HTMLElement;
    history.replaceState(null, "", "/#/auth/name");
    Object.assign(app, { authenticated: true, locked: false, appLock: false, hasName: false, name: null });
    renderName({ root, route, alive: () => true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("글자 수를 N/12로 보인다", () => {
    expect(count()?.textContent).toBe("0/12");
    type("가나다");
    expect(count()?.textContent).toBe("3/12");
    type("😀😀");
    expect(count()?.textContent).toBe("2/12");
  });

  it("넘쳐도 값을 자르지 않고 안내만 한다(한글 조합이 깨지지 않게)", () => {
    const thirteen = "가".repeat(13);
    type(thirteen);
    expect(input().value).toBe(thirteen);
    expect(count()?.textContent).toBe("13/12");
    expect(error()?.textContent).toBe("12자까지 적을 수 있어요.");
    expect(input().getAttribute("aria-describedby")).toContain("call-name-error");
    // 고치면 안내가 사라진다
    type("가".repeat(12));
    expect(error()?.textContent).toBe("");
  });

  it("넘친 채로 제출하면 서버로 보내지 않는다", async () => {
    const calls = stubFetch(() => ({ status: 200, body: { name: "x" } }));
    type("가".repeat(13));
    submit();
    await flush(20);
    expect(calls).toHaveLength(0);
    expect(error()?.textContent).toBe("12자까지 적을 수 있어요.");
  });

  it("비어 있으면 '부를 이름을 적어 주세요.'", async () => {
    const calls = stubFetch(() => ({ status: 200, body: { name: "x" } }));
    submit();
    await flush(20);
    expect(calls).toHaveLength(0);
    expect(error()?.textContent).toBe("부를 이름을 적어 주세요.");
  });

  it("이모지 12개는 보낸다 — 저장하면 반가워요로 바꿔친다", async () => {
    const calls = stubFetch(() => ({ status: 200, body: { name: "😀".repeat(12) } }));
    const length = history.length;
    type("😀".repeat(12));
    expect(error()?.textContent).toBe("");
    submit();
    await vi.waitFor(() => expect(location.hash).toBe("#/welcome"));
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ method: "PUT", path: "/api/settings/profile", body: { name: "😀".repeat(12) } });
    expect(calls[0]?.headers["x-requested-with"]).toBe("emotion-diary");
    expect(history.length).toBe(length); // replace
    expect(app.hasName).toBe(true);
  });
});
