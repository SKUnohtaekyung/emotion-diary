/// <reference path="../../client/src/env.d.ts" />
// 작성 흐름 화면(TASK-SLICE-01 PLAN §3, UX_SPEC §4·§6·§7). 서버는 가짜 fetch, 글은 시험 안에서 만든 가짜 문장이다.
// 실제 브라우저로 끝까지 가는 것은 E2E(app/test/e2e/write.spec.ts)가 본다 — 여기서는 화면의 규칙을 본다.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DiaryEntryView } from "../../shared/diary";
import { CATEGORIES } from "../../shared/taxonomy";
import { startDev } from "../../client/src/dev/index";
import { currentFlow, pushFlowStep, registerViews, render, resetRouterForTest, startRouter, type ViewContext } from "../../client/src/router";
import { app } from "../../client/src/state";
import { resetSheetsForTest } from "../../client/src/ui/sheet";
import { clearToasts } from "../../client/src/ui/toast";
import { renderDone } from "../../client/src/views/done";
import { renderRecord } from "../../client/src/views/record";
import { renderWrite } from "../../client/src/views/write";
import { emptyDiary, withText } from "../../client/src/write/flow";
import { resumeSaving } from "../../client/src/write/lifecycle";
import { resetSaversForTest } from "../../client/src/write/saver";
import { resetSessionsForTest } from "../../client/src/write/session";
import { readUnsent, writeUnsent } from "../../client/src/write/unsent";
import { type FakeReply, type FakeRequest, flush, mountShell, setVisibility, stubFetch } from "./helpers";

const TODAY = "2026-10-16";
const FAKE = "가짜 사건: 시험용 문장";
let stopDev: (() => void) | null = null;

const stub = (context: ViewContext) => {
  context.root.append(document.createElement("h1"));
  return () => {};
};

const firstEmotion = (code: string) => CATEGORIES.find((item) => item.code === code)?.emotions[0]?.code ?? "";

function entry(overrides: Partial<DiaryEntryView> = {}): DiaryEntryView {
  return {
    schemaVersion: "diary-entry-v2",
    id: "id",
    entryDate: TODAY,
    timezone: "Asia/Seoul",
    status: "draft",
    revision: 3,
    taxonomyVersion: "v2",
    eventText: FAKE,
    reasonText: "",
    categories: [{ categoryCode: "sadness", intensity: null }],
    emotions: [{ categoryCode: "sadness", emotionCode: firstEmotion("sadness"), labelSnapshot: "x", intensity: null, custom: false }],
    praises: [],
    gratitudes: [],
    resume: { step: "event", categoryCode: null },
    firstCompletedAt: null,
    firstCompletedLocalDate: null,
    completedAt: null,
    createdAt: "",
    updatedAt: "",
    ...overrides
  };
}

const meta = (revision: number, status: "draft" | "completed" = "draft"): FakeReply => ({
  status: 200,
  body: { id: "id", entryDate: TODAY, status, revision, updatedAt: "", completedAt: null, firstCompletedLocalDate: null }
});

interface Server {
  entry: DiaryEntryView | null;
  today?: string;
  put?: (request: FakeRequest) => FakeReply | "offline";
  complete?: (request: FakeRequest) => FakeReply | "offline";
  del?: (request: FakeRequest) => FakeReply | "offline";
}

function serve(server: Server): FakeRequest[] {
  return stubFetch((request) => {
    if (request.path === "/api/today") {
      return { status: 200, body: { date: server.today ?? TODAY, timezone: "Asia/Seoul", dayStartHour: 4, entry: null, pastDraft: null } };
    }
    if (request.path.endsWith("/complete")) return server.complete?.(request) ?? meta((server.entry?.revision ?? 0) + 1, "completed");
    if (request.path.startsWith("/api/diaries/")) {
      if (request.method === "GET") return server.entry ? { status: 200, body: server.entry } : { status: 404, body: { error: "not_found" } };
      if (request.method === "PUT") return server.put?.(request) ?? meta((server.entry?.revision ?? 0) + 1);
      if (request.method === "DELETE") return server.del?.(request) ?? { status: 200, body: { deleted: true, entryDate: TODAY } };
    }
    return { status: 204 };
  });
}

async function open(hash: string): Promise<void> {
  history.replaceState(null, "", "/#/today");
  pushFlowStep(hash, "test-flow");
  await flush(20);
}

const buttons = () => [...document.querySelectorAll<HTMLButtonElement>("button")];
const byText = (text: string) => buttons().find((button) => button.textContent === text);
const sheetButton = (text: string) => [...document.querySelectorAll<HTMLButtonElement>(".sheet button")].find((b) => b.textContent === text);
const heading = () => document.querySelector("h1")?.textContent;

beforeEach(() => {
  mountShell();
  localStorage.clear();
  sessionStorage.clear();
  resetRouterForTest();
  resetSheetsForTest();
  resetSaversForTest();
  resetSessionsForTest();
  setVisibility("visible");
  Object.assign(app, { authenticated: true, locked: false, appLock: false, hasName: true, name: "시험" });
  registerViews({ today: stub, auth: stub, "write/:date": renderWrite, "record/:date": renderRecord, "done/:date": renderDone });
  startRouter();
});

afterEach(() => {
  stopDev?.();
  stopDev = null;
  clearToasts();
  resetSaversForTest();
  resetRouterForTest();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("단계와 이동", () => {
  it("새 글은 있었던 일부터, 진행 표시는 '1 / 7'과 progressbar, 아래 고정 줄이 없다(U-1)", async () => {
    serve({ entry: null });
    await open(`#/write/${TODAY}?step=event`);
    expect(heading()).toBe("오늘 있었던 일");
    expect(document.querySelector(".write-progress")?.textContent).toBe("1 / 7");
    const bar = document.querySelector('[role="progressbar"]');
    expect(bar?.getAttribute("aria-valuenow")).toBe("1");
    expect(bar?.getAttribute("aria-valuemax")).toBe("7");
    expect(document.querySelector(".bottom-bar")).toBeNull();
    // 버튼 줄은 글 칸 뒤, 같은 화면 흐름 안에 있다
    const nav = document.querySelector(".write-nav");
    expect(nav?.previousElementSibling?.querySelector("textarea#event")).not.toBeNull();
    expect(byText("그만두기")).toBeDefined();
  });

  it("막힌 '다음'은 흐리되 초점을 받고, 누르면 ink 안내 한 줄과 읽어 주기 — 다음 단계로 가지 않는다(D-098 ③)", async () => {
    serve({ entry: null });
    await open(`#/write/${TODAY}?step=event`);
    const next = byText("다음");
    expect(next?.getAttribute("aria-disabled")).toBe("true");
    expect(next?.disabled).toBe(false);
    next?.click();
    await flush(40);
    expect(document.querySelector(".write-hint")?.textContent).toBe("한 줄만 적어도 충분해요.");
    expect(document.getElementById("live")?.textContent).toBe("한 줄만 적어도 충분해요.");
    expect(location.hash).toBe(`#/write/${TODAY}?step=event`);
    // 글을 쓰면 곧바로 풀린다
    const area = document.getElementById("event") as HTMLTextAreaElement;
    area.value = FAKE;
    area.dispatchEvent(new Event("input"));
    expect(byText("다음")?.getAttribute("aria-disabled")).toBe("false");
  });

  it("마음을 고르면 단계 수가 늘고(7 + n), 고른 상태는 aria-pressed와 읽어 주기로 알린다", async () => {
    serve({ entry: null });
    await open(`#/write/${TODAY}?step=feelings`);
    expect(heading()).toBe("오늘은 어떤 마음이 머물렀나요?");
    const sad = document.querySelector<HTMLButtonElement>('.choice-feeling[data-category="sadness"]');
    sad?.click();
    expect(sad?.getAttribute("aria-pressed")).toBe("true");
    expect(document.querySelector(".write-progress")?.textContent).toBe("2 / 8");
    await flush(40);
    expect(document.getElementById("live")?.textContent).toBe("슬픔 선택됨, 지금 1개 선택");
    byText("다음")?.click();
    expect(location.hash).toBe(`#/write/${TODAY}?step=details&c=sadness`);
    expect(currentFlow()?.depth).toBe(2);
  });

  it("주소의 단계가 지금 글에 없으면(고르지 않은 계열) 서버의 쓰던 단계로 바꿔친다", async () => {
    serve({ entry: entry({ resume: { step: "details", categoryCode: "sadness" } }) });
    await open(`#/write/${TODAY}?step=details&c=fear`);
    expect(location.hash).toBe(`#/write/${TODAY}?step=details&c=sadness`);
    expect(heading()).toBe("슬픔 중에서 어떤 마음이었나요?");
  });

  it("크기를 정하지 않은 채 '다음'은 시트로 미정인 마음을 알린다(D-079 ①)", async () => {
    serve({ entry: entry() });
    await open(`#/write/${TODAY}?step=intensity`);
    byText("다음")?.click();
    await flush(20);
    const sheet = document.querySelector(".sheet");
    expect(sheet?.textContent).toContain("크기를 정하지 않은 마음이 있어요");
    expect(sheet?.textContent).toContain("· 슬픔");
    expect(document.getElementById("intensity-error-sadness")?.textContent).toBe("이 마음의 크기를 정해 주세요.");
  });

  it("지난 날 쓰던 글은 띠가 서고 '오늘'이 '그날'이 된다", async () => {
    serve({ entry: entry({ entryDate: "2026-10-15" }), today: TODAY });
    await open("#/write/2026-10-15?step=event");
    expect(document.querySelector(".write-banner")?.textContent).toBe("10월 15일의 기록을 마무리하고 있어요");
    expect(heading()).toBe("그날 있었던 일");
  });

  it("기록이 없는 지난 날은 새로 만들지 않는다(D-082)", async () => {
    serve({ entry: null, today: TODAY });
    await open("#/write/2026-10-01?step=event");
    expect(heading()).toBe("이 날의 글이 없어요");
  });
});

describe("저장", () => {
  it("입력이 멈추면 판 번호와 영수증 열쇠·시간대를 싣고 보낸다 — 단계도 함께(쓰던 단계)", async () => {
    const calls = serve({ entry: entry() });
    await open(`#/write/${TODAY}?step=reason`);
    const area = document.getElementById("reason") as HTMLTextAreaElement;
    area.value = "가짜 이유";
    area.dispatchEvent(new Event("input"));
    await vi.waitFor(() => expect(calls.some((call) => call.method === "PUT" && (call.body as { reasonText?: string }).reasonText === "가짜 이유")).toBe(true), {
      timeout: 3000
    });
    const put = calls.filter((call) => call.method === "PUT").pop();
    expect(put?.headers["idempotency-key"]).toMatch(/^[A-Za-z0-9_-]{16,64}$/);
    expect(put?.headers["x-timezone"]).toBeTruthy();
    expect(put?.body).toMatchObject({ revision: 4, resume: { step: "reason", categoryCode: null } });
  });

  it("연결이 끊기면 상태 줄이 알리고 글은 이 휴대폰에 남는다(U-2)", async () => {
    serve({ entry: entry(), put: () => "offline" });
    await open(`#/write/${TODAY}?step=reason`);
    const area = document.getElementById("reason") as HTMLTextAreaElement;
    area.value = "가짜 이유";
    area.dispatchEvent(new Event("input"));
    await vi.waitFor(() => expect(document.querySelector(".save-status")?.textContent).toBe("아직 저장 안 됨 · 연결되면 저장해요"), {
      timeout: 3000
    });
    expect(readUnsent(TODAY)?.diary.reasonText).toBe("가짜 이유");
  });

  it("쓰는 중에 로그인이 풀리면(401) 시트가 먼저고, 쓴 글은 이 휴대폰의 사본에 남는다(F-22)", async () => {
    const { initController } = await import("../../client/src/controller");
    initController();
    // 단계를 옮긴 저장은 받고, 글을 쓴 뒤의 저장에서 로그인이 풀린다
    serve({
      entry: entry(),
      put: (request) =>
        (request.body as { reasonText?: string }).reasonText ? { status: 401, body: { error: "unauthorized" } } : meta(4)
    });
    await open(`#/write/${TODAY}?step=reason`);
    const area = document.getElementById("reason") as HTMLTextAreaElement;
    area.value = "가짜 이유: 풀린 사이";
    area.dispatchEvent(new Event("input"));
    await vi.waitFor(() => expect(document.querySelector(".sheet")?.textContent).toContain("다시 들어와야 해요"), { timeout: 3000 });
    // 더 쓰지 않아도 사본이 남아 있다(지우지 않는다)
    expect(readUnsent(TODAY)?.diary.reasonText).toBe("가짜 이유: 풀린 사이");
    expect(readUnsent(TODAY)?.pending).not.toBeNull();
    // 시트를 닫아 controller의 '시트가 열려 있음' 표시를 되돌린다(다음 시험과 섞이지 않게)
    sheetButton("다시 들어가기")?.click();
    await vi.waitFor(() => expect(location.hash).toBe("#/auth?s=again"));
  });

  it("다른 요청에서 로그인이 풀려도(보내기 전 대기 중) 사본을 지우지 않고 붙잡는다", async () => {
    const { initController } = await import("../../client/src/controller");
    const { request } = await import("../../client/src/lib/api");
    initController();
    const calls = stubFetch((call) => {
      if (call.path === "/api/session/heartbeat") return { status: 401, body: { error: "unauthorized" } };
      if (call.path === "/api/today") return { status: 200, body: { date: TODAY, timezone: "Asia/Seoul", dayStartHour: 4, entry: null, pastDraft: null } };
      if (call.method === "GET") return { status: 200, body: entry() };
      return meta(4);
    });
    await open(`#/write/${TODAY}?step=reason`);
    const area = document.getElementById("reason") as HTMLTextAreaElement;
    area.value = "가짜 이유: 보내기 전";
    area.dispatchEvent(new Event("input"));
    await flush(400); // 사본은 썼고(300ms) 아직 보내지 않았다(800ms)
    await request("POST", "/api/session/heartbeat");
    expect(document.querySelector(".sheet")?.textContent).toContain("다시 들어와야 해요");
    expect(readUnsent(TODAY)?.diary.reasonText).toBe("가짜 이유: 보내기 전");
    await flush(1000);
    // 멈춘 동안 그 글을 보내지 않는다(다시 들어온 뒤 보낸다)
    expect(calls.filter((call) => call.method === "PUT" && (call.body as { reasonText?: string }).reasonText)).toHaveLength(0);
    sheetButton("다시 들어가기")?.click();
    await vi.waitFor(() => expect(location.hash).toBe("#/auth?s=again"));
  });

  it("기기 사본이 서버보다 앞서 있으면 사본으로 되살리고 알린다", async () => {
    writeUnsent({
      v: 1,
      date: TODAY,
      mode: "draft",
      baseRevision: 3,
      diary: withText(withText(emptyDiary(), "eventText", FAKE), "reasonText", "가짜 사본 이유"),
      step: { step: "reason", category: null },
      pending: null,
      savedAt: 1
    });
    serve({ entry: entry() });
    await open(`#/write/${TODAY}`);
    expect(heading()).toBe("이유");
    expect((document.getElementById("reason") as HTMLTextAreaElement).value).toBe("가짜 사본 이유");
    await flush(30);
    expect(document.getElementById("live")?.textContent).toBe("이 휴대폰에 남아 있던 글을 되살렸어요");
  });

  it("사본의 출발 판이 서버와 다르면(다른 곳에서 고침) 덮지 않고 무엇이 다른지 묻는다", async () => {
    writeUnsent({
      v: 1,
      date: TODAY,
      mode: "draft",
      baseRevision: 1,
      diary: withText(emptyDiary(), "eventText", "가짜 이 휴대폰의 사건"),
      step: { step: "event", category: null },
      pending: null,
      savedAt: 1
    });
    const calls = serve({ entry: entry() });
    await open(`#/write/${TODAY}?step=event`);
    const sheet = document.querySelector(".sheet");
    expect(sheet?.textContent).toContain("다른 곳에서 고친 내용이 있어요");
    expect(sheet?.textContent).toContain("있었던 일");
    expect(calls.filter((call) => call.method === "PUT")).toHaveLength(0);
    sheetButton("이 휴대폰의 글로 남기기")?.click();
    await vi.waitFor(() => expect(calls.some((call) => call.method === "PUT")).toBe(true));
    expect(calls.find((call) => call.method === "PUT")?.body).toMatchObject({ revision: 3, eventText: "가짜 이 휴대폰의 사건" });
  });
});

describe("남기기·고치기·지우기", () => {
  it("빠진 것이 있으면 남기지 않고 시트로 알린다 — '채우러 가기'는 첫 빠진 단계로", async () => {
    const calls = serve({ entry: entry({ reasonText: "" }) });
    await open(`#/write/${TODAY}?step=letter`);
    byText("남기기")?.click();
    await flush(20);
    const sheet = document.querySelector(".sheet");
    expect(sheet?.textContent).toContain("남기려면 이것이 필요해요");
    expect(sheet?.textContent).toContain("· 크기");
    expect(sheet?.textContent).toContain("· 이유");
    expect(sheet?.textContent).toContain("칭찬과 감사는 비워 둬도 남길 수 있어요.");
    expect(calls.some((call) => call.path.endsWith("/complete"))).toBe(false);
    sheetButton("채우러 가기")?.click();
    await vi.waitFor(() => expect(location.hash).toBe(`#/write/${TODAY}?step=intensity`));
    expect(byText("편지로 돌아가기")).toBeDefined();
  });

  it("다 채웠으면 남기기 → 완료 요청(판 번호) → 완료 화면, 흐름 기록은 되감긴다", async () => {
    const full = entry({
      reasonText: "가짜 이유",
      categories: [{ categoryCode: "sadness", intensity: 4 }],
      emotions: [{ categoryCode: "sadness", emotionCode: firstEmotion("sadness"), labelSnapshot: "x", intensity: 4, custom: false }]
    });
    const calls = serve({ entry: full });
    await open(`#/write/${TODAY}?step=letter`);
    byText("남기기")?.click();
    await vi.waitFor(() => expect(heading()).toBe("오늘의 마음을 남겼어요"), { timeout: 3000 });
    const complete = calls.find((call) => call.path.endsWith("/complete"));
    expect(complete?.body).toEqual({ revision: expect.any(Number) });
    expect(complete?.headers["idempotency-key"]).toBeTruthy();
    expect(currentFlow()).toBeNull();
    expect(readUnsent(TODAY)).toBeNull();
  });

  it("완료한 기록을 고치는 중에는 저절로 보내지 않고, 고친 채 ×를 누르면 한 번 묻는다", async () => {
    const calls = serve({ entry: entry({ status: "completed", reasonText: "가짜 이유" }) });
    await open(`#/write/${TODAY}?step=reason`);
    expect(document.querySelector(".write-banner")?.textContent).toBe("완료된 기록을 수정 중이에요");
    expect(document.querySelector('[aria-label="더보기"]')).toBeNull();
    const area = document.getElementById("reason") as HTMLTextAreaElement;
    area.value = "가짜 고친 이유";
    area.dispatchEvent(new Event("input"));
    await flush(1200);
    expect(calls.filter((call) => call.method === "PUT")).toHaveLength(0);
    expect(readUnsent(TODAY)?.mode).toBe("edit");
    document.querySelector<HTMLButtonElement>('[aria-label="닫기"]')?.click();
    expect(document.querySelector(".sheet")?.textContent).toContain("고친 내용을 저장하지 않고 나갈까요?");
    sheetButton("나가기")?.click();
    await vi.waitFor(() => expect(location.hash).toBe(`#/record/${TODAY}`));
    expect(readUnsent(TODAY)).toBeNull();
  });

  it("쓰던 글 지우기는 두 번 묻고, 지금 판 번호로 지운 뒤 오늘로 + 토스트", async () => {
    const calls = serve({ entry: entry() });
    await open(`#/write/${TODAY}?step=event`);
    document.querySelector<HTMLButtonElement>('[aria-label="더보기"]')?.click();
    sheetButton("이 글 지우기")?.click();
    await vi.waitFor(() => expect(document.querySelector(".sheet")?.textContent).toContain("이 글을 지울까요?"));
    sheetButton("지우기")?.click();
    await vi.waitFor(() => expect(document.querySelector(".sheet")?.textContent).toContain("정말 지울까요?"));
    expect(document.querySelector(".sheet")?.textContent).toContain("10월 16일에 쓰던 글이 사라져요.");
    sheetButton("지우기")?.click();
    await vi.waitFor(() => expect(location.hash).toBe("#/today"));
    const del = calls.find((call) => call.method === "DELETE");
    expect(del?.body).toEqual({ revision: 3 });
    expect(document.querySelector(".toast")?.textContent).toBe("쓰던 글을 지웠어요");
  });
});

describe("마감 검토 지적(2026-10-16)", () => {
  it("M-3 화면을 떠난 저장 줄이 다른 곳의 고침(409)을 받았으면, 다시 열 때 충돌 시트를 띄운다", async () => {
    let phase: "offline" | "conflict" = "offline";
    const current = entry();
    const calls = serve({
      entry: current,
      put: () => (phase === "offline" ? "offline" : { status: 409, body: { error: "revision_conflict", currentRevision: 5 } })
    });
    await open(`#/write/${TODAY}?step=reason`);
    const area = document.getElementById("reason") as HTMLTextAreaElement;
    area.value = "가짜 이유: 끊긴 채";
    area.dispatchEvent(new Event("input"));
    await vi.waitFor(() => expect(document.querySelector(".save-status")?.textContent).toBe("아직 저장 안 됨 · 연결되면 저장해요"), {
      timeout: 3000
    });
    document.querySelector<HTMLButtonElement>('[aria-label="닫기"]')?.click();
    await vi.waitFor(() => expect(location.hash).toBe("#/today"));
    phase = "conflict";
    Object.assign(current, { revision: 5, reasonText: "가짜 이유: 다른 기기" });
    const before = calls.length;
    // 연결이 돌아왔다(online) — 화면을 떠난 저장 줄이 다시 보내 409를 받는다
    // ×가 걸어 둔 보내기(끊김)가 끝나기를 기다린 뒤
    await flush(30);
    resumeSaving();
    await vi.waitFor(() => expect(calls.slice(before).some((call) => call.method === "PUT")).toBe(true), { timeout: 3000 });
    await flush(20);
    await open(`#/write/${TODAY}?step=reason`);
    await vi.waitFor(() => expect(document.querySelector(".sheet")?.textContent).toContain("다른 곳에서 고친 내용이 있어요"));
    expect(document.querySelector(".sheet")?.textContent).toContain("이유");
  });

  it("M-4 첫 만들기의 답만 놓쳤으면(사본: 출발 판 없음 + 날아가던 요청, 서버 판 1) 충돌로 보지 않고 같은 열쇠로 확인한다", async () => {
    const createBody = { revision: null, eventText: FAKE, reasonText: "" };
    writeUnsent({
      v: 1,
      date: TODAY,
      mode: "draft",
      baseRevision: null,
      diary: withText(withText(emptyDiary(), "eventText", FAKE), "reasonText", "가짜 이유: 뒤에 더 씀"),
      step: { step: "reason", category: null },
      pending: { key: "kept-create-key-0001", body: createBody as never },
      savedAt: 1
    });
    const calls = serve({
      entry: entry({ revision: 1, categories: [], emotions: [] }),
      put: (request) => (request.headers["idempotency-key"] === "kept-create-key-0001" ? { ...meta(1), status: 201 } : meta(2))
    });
    await open(`#/write/${TODAY}`);
    await vi.waitFor(() => expect(calls.filter((call) => call.method === "PUT")).toHaveLength(2), { timeout: 3000 });
    expect(document.querySelector(".sheet")).toBeNull();
    const puts = calls.filter((call) => call.method === "PUT");
    expect(puts[0]?.headers["idempotency-key"]).toBe("kept-create-key-0001");
    expect(puts[1]?.body).toMatchObject({ revision: 1, reasonText: "가짜 이유: 뒤에 더 씀" });
  });

  it("L-1 고치기 흐름의 첫 칸에서 '그만두기'도 고친 것이 있으면 한 번 묻는다", async () => {
    serve({ entry: entry({ status: "completed", reasonText: "가짜 이유" }) });
    await open(`#/write/${TODAY}?step=event`);
    const area = document.getElementById("event") as HTMLTextAreaElement;
    area.value = "가짜 고친 사건";
    area.dispatchEvent(new Event("input"));
    byText("그만두기")?.click();
    expect(document.querySelector(".sheet")?.textContent).toContain("고친 내용을 저장하지 않고 나갈까요?");
  });

  it("L-7 저장되면 '저장됨 · 방금', 서버가 받지 않으면 '저장 실패'와 '다시 시도' 버튼(UX_SPEC §4)", async () => {
    let reject = false;
    const calls = serve({ entry: entry(), put: () => (reject ? { status: 400, body: { error: "invalid_body" } } : meta(4)) });
    await open(`#/write/${TODAY}?step=reason`);
    await vi.waitFor(() => expect(document.querySelector(".save-status")?.textContent).toBe("저장됨 · 방금"), { timeout: 3000 });
    reject = true;
    const area = document.getElementById("reason") as HTMLTextAreaElement;
    area.value = "가짜 이유";
    area.dispatchEvent(new Event("input"));
    await vi.waitFor(() => expect(document.querySelector(".save-status")?.textContent).toBe("저장 실패"), { timeout: 3000 });
    const retry = byText("다시 시도");
    expect(retry?.hidden).toBe(false);
    const before = calls.filter((call) => call.method === "PUT").length;
    reject = false;
    retry?.click();
    await vi.waitFor(() => expect(calls.filter((call) => call.method === "PUT").length).toBe(before + 1));
    await vi.waitFor(() => expect(document.querySelector(".save-status")?.textContent).toBe("저장됨 · 방금"));
    expect(byText("다시 시도")?.hidden).toBe(true);
  });

  it("충돌 시트는 '바꾸기'를 고르면 이 휴대폰의 글이 사라진다는 것도 말한다(A-13)", async () => {
    writeUnsent({
      v: 1,
      date: TODAY,
      mode: "draft",
      baseRevision: 1,
      diary: withText(emptyDiary(), "eventText", "가짜 이 휴대폰"),
      step: { step: "event", category: null },
      pending: null,
      savedAt: 1
    });
    serve({ entry: entry() });
    await open(`#/write/${TODAY}?step=event`);
    expect(document.querySelector(".sheet")?.textContent).toContain("다른 곳의 글로 바꾸면 이 휴대폰에서 쓴 글이 사라져요.");
  });
});

describe("글이 새지 않는다(S-12)", () => {
  it("개발용 상태 칸·주소에 쓴 글이 없고, 서버가 받은 뒤에는 기기 사본도 없다", async () => {
    const calls = serve({ entry: entry() });
    stopDev = startDev();
    await open(`#/write/${TODAY}?step=reason`);
    const area = document.getElementById("reason") as HTMLTextAreaElement;
    area.value = "가짜 비밀 문장";
    area.dispatchEvent(new Event("input"));
    await vi.waitFor(() => expect(calls.some((call) => call.method === "PUT")).toBe(true), { timeout: 3000 });
    await vi.waitFor(() => expect(readUnsent(TODAY)).toBeNull());
    document.querySelector<HTMLButtonElement>(".dev-panel-toggle")?.click();
    expect(document.querySelector(".dev-panel")?.textContent).not.toContain("가짜 비밀");
    expect(location.href).not.toContain("가짜");
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain("가짜 비밀");
    // 오류 보고·상태 칸의 화면 이름에는 날짜가 없다
    expect(document.querySelector(".dev-panel")?.textContent).not.toContain(TODAY);
  });
});

describe("기록 보기·완료", () => {
  it("기록 보기는 부분마다 고치기가 있고, 누르면 그 단계로 고치기 흐름", async () => {
    serve({ entry: entry({ status: "completed", reasonText: "가짜 이유", gratitudes: [{ slot: 1, text: "가짜 감사" }] }) });
    history.replaceState(null, "", `/#/record/${TODAY}`);
    render();
    await flush(20);
    expect(heading()).toBe("10월 16일의 편지");
    expect(document.body.textContent).toContain("가짜 감사");
    expect(document.body.textContent).not.toContain("칭찬");
    document.querySelector<HTMLButtonElement>('[aria-label="이유 고치기"]')?.click();
    expect(location.hash).toBe(`#/write/${TODAY}?step=reason`);
  });

  it("없는 날짜의 편지는 안내, 임시저장이면 이어 쓰기로", async () => {
    serve({ entry: null });
    history.replaceState(null, "", "/#/record/2026-10-01");
    render();
    await flush(20);
    expect(heading()).toBe("이 날의 편지가 없어요");
    serve({ entry: entry() });
    history.replaceState(null, "", `/#/record/${TODAY}`);
    render();
    await flush(30);
    expect(location.hash.startsWith(`#/write/${TODAY}`)).toBe(true);
  });

  it("완료 화면은 짧은 사실 문장 — 지난 날이면 '그날'", () => {
    history.replaceState(null, "", `/#/done/${TODAY}`);
    render();
    expect(heading()).toBe("오늘의 마음을 남겼어요");
    history.replaceState(null, "", "/#/done/2026-10-15?day=past");
    render();
    expect(heading()).toBe("그날의 마음을 남겼어요");
    expect(byText("그날의 기록 보기")).toBeDefined();
  });
});
