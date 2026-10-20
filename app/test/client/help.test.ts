/// <reference path="../../client/src/env.d.ts" />
// 도움이 필요할 때(위기 안내) 화면 `#/help` (UX_SPEC §3·§6.1·§17, EVAL_PLAN §14 crisis-help-unreviewed-label, TASK-PERSONAL-01 A-1~A-4).
// 연락처는 묶음에 든 data/crisis-resources/kr.json이고, 시험은 자원 값을 바꿔 넣을 수 있게 createHelpView에 직접 넘긴다. 서버는 가짜 fetch다.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import crisis from "../../../data/crisis-resources/kr.json";
import { registerViews, render, resetRouterForTest, startRouter, type ViewContext } from "../../client/src/router";
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
const review = () => document.querySelector(".help-review");
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
  it("제목과 세 묶음(지금 위험하다면·이야기할 곳·출처), 문서 제목", () => {
    open();
    expect(document.querySelector("h1")?.textContent).toBe("혼자 견디지 않아도 돼요");
    expect(document.title).toBe("혼자 견디지 않아도 돼요 — 감정일기");
    expect([...document.querySelectorAll("h2")].map((node) => node.textContent)).toEqual(["지금 위험하다면", "이야기할 곳", "출처"]);
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

  it("확인일·해외 안내·진단이나 위기 대응 서비스가 아니라는 고지가 있다", () => {
    open();
    expect(text()).toContain("2026년 9월 25일에 각 기관의 공식 안내로 확인했어요.");
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
      "112 경찰에 전화하기",
      "119 구급에 전화하기",
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

describe("위기 안내 — 검토 전 표기 (A-4)", () => {
  it("kr.json 그대로(clinicalSafety: pending)면 '검토 전'이 제목 아래 첫 묶음보다 앞에 보인다", () => {
    expect(crisis.review.clinicalSafety).toBe("pending");
    open();
    const notice = review();
    expect(notice?.textContent).toContain("검토 전");
    expect(notice?.textContent).toBe("검토 전 번호는 공식 누리집으로 확인했어요. 전문가 검토는 아직 받지 않았어요.");
    expect(notice?.querySelector("strong")?.textContent).toBe("검토 전");
    const firstHeading = document.querySelector("h2");
    expect(notice && firstHeading && notice.compareDocumentPosition(firstHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("'검토 전' 규칙은 글자를 줄이거나 흐리게 하지 않는다 — 본문 색, font-size·opacity 없음", () => {
    const css = readSource("../../client/src/styles/help.css");
    const rule = /\.help-review\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(rule).toContain("var(--neutral-text)");
    expect(rule).not.toMatch(/font-size|opacity|color-mix/);
  });

  it("clinicalSafety가 'reviewed'이면 보이지 않는다", () => {
    const resource = fresh();
    resource.review.clinicalSafety = "reviewed";
    open(resource);
    expect(review()).toBeNull();
    expect(text()).not.toContain("검토 전");
    // 나머지 화면은 그대로다
    expect(hrefs()).toContain("tel:112");
    expect(rows()).toHaveLength(3);
  });

  it.each([
    ["pending", { clinicalSafety: "pending" }],
    ["unreviewed", { clinicalSafety: "unreviewed" }],
    ["대소문자가 다른 값", { clinicalSafety: "Reviewed" }],
    ["참/거짓 값", { clinicalSafety: true }],
    ["값 없음", {}],
    ["review가 없음", undefined],
    ["review가 글자", "reviewed"]
  ])("검토 상태가 %s이면 보인다 — 알 수 없으면 보이는 쪽이다", (_name, review_) => {
    const resource = fresh() as Record<string, unknown>;
    if (review_ === undefined) delete resource.review;
    else resource.review = review_;
    open(resource);
    expect(review()?.textContent).toContain("검토 전");
  });

  it("공식 누리집 확인이 끝나지 않았으면 그렇다고 하지 않고, 확인했다는 줄도 없다", () => {
    const resource = fresh();
    resource.review.officialSources = "pending";
    open(resource);
    expect(review()?.textContent).toBe("검토 전 전문가 검토는 아직 받지 않았어요.");
    expect(text()).not.toContain("공식 누리집");
    expect(text()).not.toContain("공식 안내로 확인했어요");
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
    // 해외 안내와 고지는 자원 없이도 있고, 검토 상태를 모르니 '검토 전'도 보인다
    expect(text()).toContain("해외에 있다면 그 나라의 응급 번호로 연락해 주세요.");
    expect(text()).toContain("이 앱은 진단이나 위기 대응 서비스가 아니에요.");
    expect(review()?.textContent).toContain("검토 전");
    // 출처가 없으면 출처 묶음을 만들지 않는다
    expect([...document.querySelectorAll("h2")].map((node) => node.textContent)).toEqual(["지금 위험하다면", "이야기할 곳"]);
    // 돌아갈 길은 있다
    expect(byText("‹ 뒤로")).toBeDefined();
  });

  it("긴급번호 항목이 자원에 없으면 그 출처만 빠지고 112·119 버튼은 그대로다", () => {
    const resource = fresh();
    resource.emergency = [];
    open(resource);
    expect(hrefs()).toEqual(expect.arrayContaining(["tel:112", "tel:119"]));
    expect(document.querySelectorAll(".help-source")).toHaveLength(3);
  });

  it("묶음에 든 실제 kr.json으로 연 화면에서도 같다", () => {
    open();
    expect(hrefs().slice(0, 2)).toEqual(["tel:112", "tel:119"]);
  });
});

describe("위기 안내 — 모양이 틀린 항목은 건너뛴다", () => {
  it("전화로 쓸 수 없는 번호·이름 없는 항목은 줄을 만들지 않고, https가 아닌 출처와 엉뚱한 문자 번호는 버린다", () => {
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
    // 출처 링크는 https 하나(+ 긴급번호 줄의 출처, kr.json 그대로)뿐이다
    const sources = links()
      .filter((link) => link.classList.contains("help-link"))
      .map((link) => link.getAttribute("href"));
    expect(sources).toContain("https://www.example.go.kr/ok");
    expect(sources).toHaveLength(1 + crisis.emergency.flatMap((item) => item.sources).length);
  });

  it("확인일 모양이 틀리면 확인했다는 줄을 만들지 않는다", () => {
    const resource = fresh();
    resource.checked = "어제";
    open(resource);
    expect(text()).not.toContain("공식 안내로 확인했어요");
    expect(text()).toContain("이 앱은 진단이나 위기 대응 서비스가 아니에요.");
  });
});

describe("위기 안내 — 출처 링크", () => {
  it("kr.json의 출처가 모두 링크이고 rel=noreferrer, target 없음(앱 안 Safari 창으로 열린다)", () => {
    open();
    const expected = [...crisis.emergency, ...crisis.contacts].flatMap((item) => item.sources);
    expect(expected).toHaveLength(7);
    const sources = links().filter((link) => link.classList.contains("help-link"));
    expect(sources.map((link) => link.getAttribute("href")).sort()).toEqual([...expected].sort());
    for (const link of sources) {
      expect(link.getAttribute("rel")).toBe("noreferrer");
      expect(link.hasAttribute("target")).toBe(false);
      expect(link.getAttribute("href")).toMatch(/^https:\/\//);
    }
    // 어느 기관의 출처인지 줄 머리에 있다
    const headings = [...document.querySelectorAll(".help-source > .help-meta")].map((node) => node.textContent);
    expect(headings).toEqual([
      "112 경찰 · 경찰청",
      "119 구급 · 소방청",
      "109 자살예방상담전화 · 보건복지부",
      "1388 청소년상담 · 성평등가족부",
      "1577-0199 정신건강 위기상담전화 · 보건복지부"
    ]);
  });

  it("출처 링크의 이름에 기관과 번호, 순서, 누리집 주소가 있다", () => {
    open();
    const names = links().map((link) => link.getAttribute("aria-label"));
    expect(names).toContain("1388 청소년상담 출처 1 mogef.go.kr");
    expect(names).toContain("1388 청소년상담 출처 2 mogef.go.kr");
    expect(names).toContain("109 자살예방상담전화 출처 1 129.go.kr");
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

  it("오늘 화면에서 '도움이 필요할 때'로 들어오면 ‹ 뒤로는 밀어서 뒤로와 같이 오늘로 돌아간다", async () => {
    stubFetch((request) => (request.path === "/api/today" ? todayReply() : { status: 204 }));
    history.replaceState(null, "", "/#/today");
    render();
    await flush(10);
    byText("도움이 필요할 때")?.click();
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
