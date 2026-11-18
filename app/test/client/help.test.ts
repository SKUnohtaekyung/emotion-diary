/// <reference path="../../client/src/env.d.ts" />
// 도움이 필요할 때(위기 안내) 화면 `#/help` (UX_SPEC §3·§6.1·§17, TASK-PERSONAL-01 A-1~A-3, D-132 — 출처·확인일·'검토 전'은 화면에 적지 않는다).
// 연락처는 묶음에 든 data/crisis-resources/kr.json이고, 시험은 자원 값을 바꿔 넣을 수 있게 createHelpView에 직접 넘긴다. 서버는 가짜 fetch다.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import crisis from "../../../data/crisis-resources/kr.json";
import { navigate, registerViews, render, resetRouterForTest, startRouter, type ViewContext } from "../../client/src/router";
import { app } from "../../client/src/state";
import { hideLockLayer } from "../../client/src/ui/lockLayer";
import { resetSheetsForTest } from "../../client/src/ui/sheet";
import { clearToasts } from "../../client/src/ui/toast";
import { createHelpView, EMERGENCY, renderHelp } from "../../client/src/views/help";
import { renderToday } from "../../client/src/views/today";
import { resetSaversForTest } from "../../client/src/write/saver";
import { resetSessionsForTest } from "../../client/src/write/session";
import { flush, mountShell, stubFetch } from "./helpers";
import { readSource } from "./source";

type Resource = Record<string, unknown> & { review: Record<string, unknown> };

/** kr.json을 복사해 시험이 마음대로 바꿀 수 있게 한다. */
const fresh = (): Resource => JSON.parse(JSON.stringify(crisis)) as Resource;

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
  resetSaversForTest();
  resetSessionsForTest();
  Object.assign(app, { authenticated: true, locked: false, appLock: false, hasName: true, name: "시험" });
  registerViews({ today: renderToday, help: renderHelp, auth: stub, "auth/name": stub, "settings/lock": stub });
  startRouter();
});

afterEach(() => {
  clearToasts();
  hideLockLayer();
  resetRouterForTest();
  vi.unstubAllGlobals();
});

const buttons = () => [...document.querySelectorAll<HTMLButtonElement>("button")];
const byText = (text: string) => buttons().find((button) => button.textContent === text);
const links = () => [...document.querySelectorAll<HTMLAnchorElement>("a")];
const hrefs = () => links().map((link) => link.getAttribute("href"));
const text = () => document.getElementById("app")?.textContent ?? "";
const rows = () => [...document.querySelectorAll<HTMLElement>(".help-row")];

/** 위기 안내를 주어진 자원으로 연다. 자원을 안 주면 묶음에 든 kr.json 그대로다. */
function open(resources?: unknown): void {
  if (resources !== undefined) registerViews({ help: createHelpView(resources) });
  history.replaceState(null, "", "/#/help");
  render();
}

const todayReply = () => ({
  status: 200,
  body: { date: "2026-10-16", timezone: "Asia/Seoul", dayStartHour: 4, entry: null, pastDraft: null }
});

describe("위기 안내 — 구성", () => {
  it("제목과 두 묶음(지금 위험하다면·이야기할 곳), 문서 제목", () => {
    open();
    expect(document.querySelector("h1")?.textContent).toBe("혼자 견디지 않아도 돼요");
    expect(document.title).toBe("혼자 견디지 않아도 돼요 — 감정일기");
    expect([...document.querySelectorAll("h2")].map((node) => node.textContent)).toEqual(["지금 위험하다면", "이야기할 곳"]);
    expect(document.querySelector(".help-screen")).not.toBeNull();
  });

  it("112·119 전화 버튼이 맨 앞이고, 119 문자 안내가 있다", () => {
    open();
    const now = [...document.querySelectorAll<HTMLAnchorElement>(".help-now-btns a")];
    expect(now.map((link) => [link.getAttribute("href"), link.textContent])).toEqual([
      ["tel:112", "112 경찰"],
      ["tel:119", "119 구급"]
    ]);
    expect(links().slice(0, 2).map((link) => link.getAttribute("href"))).toEqual(["tel:112", "tel:119"]);
    expect(text()).toContain("말하기 어려우면 119로 문자를 보낼 수 있어요.");
  });

  it("연락처 다섯 번호가 모두 tel: 링크이고, 문자는 1388 하나다", () => {
    open();
    const tel = hrefs().filter((href) => href?.startsWith("tel:"));
    expect(tel.sort()).toEqual(["tel:109", "tel:112", "tel:119", "tel:1388", "tel:15770199"]);
    for (const href of tel) expect(href).toMatch(/^tel:\d+$/);
    expect(hrefs().filter((href) => href?.startsWith("sms:"))).toEqual(["sms:1388"]);
  });

  it("이야기할 곳 줄마다 이름·번호·돕는 일·운영 시간이 kr.json 그대로 있다", () => {
    open();
    expect(rows()).toHaveLength(crisis.contacts.length);
    crisis.contacts.forEach((contact, index) => {
      const row = rows()[index]?.textContent ?? "";
      for (const expected of [contact.name, contact.number, contact.help, contact.hours]) expect(row).toContain(expected);
      if ("mobile" in contact) expect(row).toContain(contact.mobile);
    });
    // 1388은 휴대전화로 걸 때 지역번호를 붙여야 한다는 안내가 줄 안에 있다
    expect(rows()[1]?.textContent).toContain("지역번호를 붙여요");
  });

  it("해외 안내와 진단이나 위기 대응 서비스가 아니라는 고지가 있다", () => {
    open();
    expect(text()).toContain(crisis.abroad);
    expect(text()).toContain("이 앱은 진단이나 위기 대응 서비스가 아니에요.");
  });

  it("친구·그림·움직임이 없다 — 이미지·svg·캔버스가 없고 감정 색·애니메이션을 CSS가 쓰지 않는다", () => {
    open();
    expect(document.querySelector("img, svg, canvas, video, audio")).toBeNull();
    expect(document.querySelector('[class*="emotion"], [class*="pebble"], [class*="friend"]')).toBeNull();
    const css = readSource("../../client/src/styles/help.css");
    expect(css).not.toMatch(/--emotion-|--forest-/);
    expect(css).not.toMatch(/animation|transition|@keyframes|url\(/);
    // 색은 토큰 변수만
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\b(?:rgb|rgba|hsl|hsla|oklch|color-mix)\(/);
  });
});

describe("위기 안내 — 접근 이름", () => {
  it("전화·문자 링크는 기관 이름과 번호를 이름으로 갖고, 눈에 보이는 글이 그 이름 안에 있다", () => {
    open();
    const names = links().map((link) => link.getAttribute("aria-label"));
    for (const expected of [
      "112 경찰 전화하기",
      "119 구급 전화하기",
      "자살예방상담전화 109에 전화하기",
      "청소년상담 1388에 전화하기",
      "청소년상담 1388로 문자 보내기",
      "정신건강 위기상담전화 1577-0199에 전화하기"
    ]) {
      expect(names).toContain(expected);
    }
    for (const link of links()) {
      const name = link.getAttribute("aria-label") ?? "";
      expect(name, link.outerHTML).not.toBe("");
      expect(name, link.outerHTML).toContain((link.textContent ?? "").trim());
    }
  });

  it("문자 번호의 조사: 끝이 0·3·6이면 '으로', 아니면 '로'", () => {
    const resource = fresh();
    resource.contacts = [
      { id: "a", number: "1230", name: "가", sms: "1230" },
      { id: "b", number: "1233", name: "나", sms: "1233" },
      { id: "c", number: "1234", name: "다", sms: "1234" }
    ];
    open(resource);
    const names = links().map((link) => link.getAttribute("aria-label"));
    expect(names).toContain("가 1230으로 문자 보내기");
    expect(names).toContain("나 1233으로 문자 보내기");
    expect(names).toContain("다 1234로 문자 보내기");
  });
});

describe("위기 안내 — 출처·확인일·검토 상태는 화면에 없다 (D-132)", () => {
  it.each([
    ["kr.json 그대로(clinicalSafety: pending)", (r: Resource) => r],
    ["검토가 끝난 값", (r: Resource) => ({ ...r, review: { clinicalSafety: "reviewed", officialSources: "checked" } })],
    ["review가 없는 값", (r: Resource) => ({ ...r, review: undefined })]
  ])("%s이어도 '검토 전'·확인일·출처 링크가 보이지 않는다", (_name, shape) => {
    expect(crisis.review.clinicalSafety).toBe("pending");
    open(shape(fresh()));
    for (const hidden of ["검토 전", "전문가 검토", "공식 누리집", "공식 안내로 확인", "출처"]) expect(text()).not.toContain(hidden);
    expect(document.querySelector(".help-review, .help-source, .help-link")).toBeNull();
    // 바깥으로 나가는 https 링크가 없다 — 전화·문자뿐
    for (const href of hrefs()) expect(href).toMatch(/^(tel|sms):/);
  });
});

describe("위기 안내 — 112·119는 자원 없이도 (A-3)", () => {
  it("화면 상수가 kr.json의 emergency와 같다(번호·이름·문자 번호)", () => {
    const pick = (list: ReadonlyArray<{ number: string; name: string; sms: string | null }>) =>
      list.map(({ number, name, sms }) => ({ number, name, sms }));
    expect(pick(EMERGENCY)).toEqual(pick(crisis.emergency));
  });

  it.each([
    ["빈 객체", {}],
    ["null", null],
    ["글자", "자원"],
    ["숫자", 7],
    ["목록 자리에 엉뚱한 값", { contacts: "없음", emergency: 5, review: 3, checked: 20260925, abroad: 1 }],
    ["목록 안에 쓸 수 없는 항목만", { contacts: [null, 3, "x", [], {}, { number: "109" }, { name: "이름만" }], emergency: [{}] }]
  ])("자원이 %s이어도 112·119 전화 버튼과 문자 안내가 보이고 화면이 죽지 않는다", (_name, resources) => {
    open(resources);
    expect(document.querySelector("h1")?.textContent).toBe("혼자 견디지 않아도 돼요");
    expect(hrefs()).toEqual(expect.arrayContaining(["tel:112", "tel:119"]));
    expect(text()).toContain("말하기 어려우면 119로 문자를 보낼 수 있어요.");
    // 이야기할 곳이 비었다는 것을 알리고 위의 112·119를 가리킨다
    expect(rows()).toHaveLength(0);
    expect(text()).toContain("연락처 목록을 열지 못했어요. 지금 위험하다면 위의 112나 119에 전화해 주세요.");
    // 해외 안내와 고지는 자원 없이도 있다
    expect(text()).toContain("해외에 있다면 그 나라의 응급 번호로 연락해 주세요.");
    expect(text()).toContain("이 앱은 진단이나 위기 대응 서비스가 아니에요.");
    expect([...document.querySelectorAll("h2")].map((node) => node.textContent)).toEqual(["지금 위험하다면", "이야기할 곳"]);
    // 돌아갈 길은 있다
    expect(byText("‹ 뒤로")).toBeDefined();
  });

  it("긴급번호 항목이 자원에 없어도 112·119 버튼은 그대로다", () => {
    const resource = fresh();
    resource.emergency = [];
    open(resource);
    expect(hrefs()).toEqual(expect.arrayContaining(["tel:112", "tel:119"]));
  });

  it("묶음에 든 실제 kr.json으로 연 화면에서도 같다", () => {
    open();
    expect(hrefs().slice(0, 2)).toEqual(["tel:112", "tel:119"]);
  });
});

describe("위기 안내 — 모양이 틀린 항목은 건너뛴다", () => {
  it("전화로 쓸 수 없는 번호·이름 없는 항목은 줄을 만들지 않고, 엉뚱한 문자 번호는 버린다", () => {
    const resource = fresh();
    resource.contacts = [
      { id: "bad-number", number: "tel:112", name: "나쁜 번호", hours: "24시간" },
      { id: "bad-name", number: "1388", name: "  " },
      {
        id: "ok",
        number: "109",
        name: "남은 항목",
        help: "도움말",
        hours: "24시간",
        sms: "javascript:alert(1)",
        owner: "시험부",
        sources: ["javascript:alert(1)", "http://insecure.example/path", "not a url", 5, "https://www.example.go.kr/ok"]
      }
    ];
    open(resource);
    expect(rows()).toHaveLength(1);
    expect(text()).toContain("남은 항목");
    expect(text()).not.toContain("나쁜 번호");
    expect(hrefs().join(" ")).not.toMatch(/javascript:|http:/);
    expect(hrefs().filter((href) => href?.startsWith("sms:"))).toEqual([]);
    // 자원에 출처 주소가 있어도 화면에는 링크로 나오지 않는다(D-132)
    expect(hrefs().join(" ")).not.toContain("example.go.kr");
  });
});

describe("위기 안내 — 돌아가기 (UX_SPEC §17)", () => {
  it("큰 '돌아가기' 버튼이 없고 버튼은 위 ‹ 하나뿐이다", () => {
    open();
    expect(buttons().map((button) => button.textContent)).toEqual(["‹ 뒤로"]);
    expect(byText("돌아가기")).toBeUndefined();
    // 화면 읽기에는 ‹ 기호를 읽히지 않고 '뒤로'만 읽힌다
    expect(document.querySelector(".back-button span")?.getAttribute("aria-hidden")).toBe("true");
    expect(document.querySelector(".screen-top .back-button")).not.toBeNull();
  });

  it("앱 안에서(설정의 줄·개인정보 안내의 알약처럼 push로) 들어오면 ‹ 뒤로는 밀어서 뒤로와 같이 앞 화면으로 돌아간다", async () => {
    stubFetch((request) => (request.path === "/api/today" ? todayReply() : { status: 204 }));
    history.replaceState(null, "", "/#/today");
    render();
    await flush(10);
    navigate("#/help");
    expect(location.hash).toBe("#/help");
    expect(document.querySelector("h1")?.textContent).toBe("혼자 견디지 않아도 돼요");
    const length = history.length;

    byText("‹ 뒤로")?.click();
    await vi.waitFor(() => expect(location.hash).toBe("#/today"));
    expect(document.querySelector("h1")?.textContent).toBe("오늘은 어떤 마음이 머물렀나요?");
    expect(history.length).toBe(length);
  });

  it("주소로 바로 열었다면(앱 안에서 쌓은 칸이 아님) ‹ 뒤로는 오늘로 바꿔친다", async () => {
    stubFetch((request) => (request.path === "/api/today" ? todayReply() : { status: 204 }));
    open();
    const length = history.length;
    byText("‹ 뒤로")?.click();
    expect(location.hash).toBe("#/today");
    expect(history.length).toBe(length);
    await flush(10);
    expect(document.querySelector("h1")?.textContent).toBe("오늘은 어떤 마음이 머물렀나요?");
  });
});
