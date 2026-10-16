/// <reference path="../../client/src/env.d.ts" />
// 내 기록 내보내기·모든 기록 지우기 화면(UX_SPEC §13, D-112 ⑤·⑩, D-111 ④). 서버는 가짜 fetch, 기록·비밀번호는 시험 안에서 만든 가짜 값이다.
// 공유 창은 사용자가 누른 동작 안에서 열려야 한다(iOS) — 그래서 "누른 바로 그 줄에서 share가 불렸다"를 본다.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE_ALL_CONFIRM } from "../../shared/api";
import { type DiaryEntryView, EXPORT_SCHEMA_VERSION, type ExportFile, type ExportPage, type TodayInfo } from "../../shared/diary";
import { guardRoute, isReturnable, parseHash } from "../../client/src/lib/routes";
import { registerViews, render, resetRouterForTest, startRouter, type ViewContext } from "../../client/src/router";
import { app } from "../../client/src/state";
import { hideLockLayer } from "../../client/src/ui/lockLayer";
import { resetSheetsForTest } from "../../client/src/ui/sheet";
import { clearToasts } from "../../client/src/ui/toast";
import { renderDeleteAll, renderDeleted } from "../../client/src/views/deleteAll";
import { fetchExport } from "../../client/src/write/dataApi";
import { renderExportData } from "../../client/src/views/exportData";
import { renderToday } from "../../client/src/views/today";
import { emptyDiary, withText } from "../../client/src/write/flow";
import { resetSaversForTest, Saver } from "../../client/src/write/saver";
import { resetSessionsForTest } from "../../client/src/write/session";
import { readUnsent, writeUnsent } from "../../client/src/write/unsent";
import { type FakeReply, type FakeRequest, flush, mountShell, stubFetch } from "./helpers";

const MARK = "가짜-내보내기-표식";
const FILE_NAME = "emotion-diary-2026-10-17.json";
const PIN = "2468";
const UNSENT_DATE = "2026-10-15";

const stub = (context: ViewContext) => {
  context.root.append(document.createElement("h1"));
  return () => {};
};

function entry(entryDate = "2026-10-16", eventText = MARK): DiaryEntryView {
  return {
    schemaVersion: "diary-entry-v2",
    id: `id-${entryDate}`,
    entryDate,
    timezone: "Asia/Seoul",
    status: "completed",
    revision: 2,
    taxonomyVersion: "v2",
    eventText,
    reasonText: "",
    categories: [],
    emotions: [],
    praises: [],
    gratitudes: [],
    resume: null,
    firstCompletedAt: `${entryDate}T12:00:00.000Z`,
    firstCompletedLocalDate: entryDate,
    completedAt: `${entryDate}T12:00:00.000Z`,
    createdAt: "",
    updatedAt: ""
  };
}

/** 서울 12시 30분 → 기기 시간대로 센 날짜 2026-10-17 */
const EXPORT_FILE: ExportFile = {
  schemaVersion: EXPORT_SCHEMA_VERSION,
  exportedAt: "2026-10-17T03:30:00.000Z",
  timezone: "Asia/Seoul",
  dayStartHour: 4,
  displayName: "시험",
  diaries: [entry()]
};
/** 서버가 한 번에 주는 조각 — 파일의 칸 + 다음 시작점(여기서는 한 조각으로 끝난다) */
const EXPORT_PAGE: ExportPage = { ...EXPORT_FILE, next: null };

const todayReply = (): FakeReply => ({
  status: 200,
  body: { date: "2026-10-16", timezone: "Asia/Seoul", dayStartHour: 4, entry: null, pastDraft: null } satisfies TodayInfo
});

/** 오늘 말고 다른 요청(오늘 화면의 배경 보내기가 부르는 그날 기록 조회 등)은 닿지 않게 둔다. */
const elseOffline = (request: FakeRequest): FakeReply | "offline" => (request.path === "/api/today" ? todayReply() : "offline");

let restore: Array<() => void> = [];

/** navigator의 속성 하나를 시험 동안만 바꾼다. */
function setNavigator(key: string, value: unknown): void {
  const had = Object.hasOwn(navigator, key);
  const before = Object.getOwnPropertyDescriptor(navigator, key);
  Object.defineProperty(navigator, key, { configurable: true, writable: true, value });
  restore.push(() => {
    if (had && before) Object.defineProperty(navigator, key, before);
    else Reflect.deleteProperty(navigator, key);
  });
}

function stubShare(impl: (data: ShareData) => Promise<void>, canShare = true) {
  const share = vi.fn(impl);
  setNavigator("share", share);
  setNavigator("canShare", vi.fn(() => canShare));
  return share;
}

function stubClipboard() {
  const clipboard = { writeText: vi.fn(async () => {}), write: vi.fn(async () => {}) };
  setNavigator("clipboard", clipboard);
  return clipboard;
}

beforeEach(() => {
  mountShell();
  localStorage.clear();
  sessionStorage.clear();
  resetRouterForTest();
  resetSheetsForTest();
  resetSaversForTest();
  resetSessionsForTest();
  restore = [];
  Object.assign(app, { authenticated: true, locked: false, appLock: false, hasName: true, name: "시험" });
  registerViews({
    today: renderToday,
    auth: stub,
    "auth/name": stub,
    "settings/lock": stub,
    "settings/export": renderExportData,
    "settings/delete": renderDeleteAll,
    "settings/deleted": renderDeleted
  });
  startRouter();
});

afterEach(() => {
  for (const undo of restore.reverse()) undo();
  clearToasts();
  hideLockLayer();
  resetRouterForTest();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const buttons = () => [...document.querySelectorAll<HTMLButtonElement>("button")];
const byText = (text: string) => buttons().find((button) => button.textContent === text);
const text = () => document.getElementById("app")?.textContent ?? "";
const heading = () => document.querySelector("h1")?.textContent;
const toast = () => document.querySelector(".toast")?.textContent;

/** 오늘 화면에서 하위 화면으로 push해 들어온 것처럼 연다(‹ 뒤로가 실제 history.back이 되게). */
async function openFrom(hash: string): Promise<void> {
  history.replaceState(null, "", "/#/today");
  render();
  await flush(10);
  const { navigate } = await import("../../client/src/router");
  navigate(hash);
  await flush(10);
}

// ───────── 내보내기 ─────────

describe("내보내기 — 미리 받아 두기", () => {
  it("화면을 열면 GET /api/export를 한 번 부르고(시간대 머리글), 준비되기 전에는 버튼이 꺼져 있다가 켜진다", async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const share = stubShare(async () => {});
    const calls = stubFetch(async (request) => {
      if (request.path === "/api/export") {
        await gate;
        return { status: 200, body: EXPORT_PAGE };
      }
      return todayReply();
    });
    await openFrom("#/settings/export");

    expect(calls.filter((call) => call.path === "/api/export")).toHaveLength(1);
    const exportCall = calls.find((call) => call.path === "/api/export");
    expect(exportCall?.method).toBe("GET");
    expect(exportCall?.headers["x-timezone"]).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);

    const action = byText("준비하고 있어요…");
    expect(action?.getAttribute("aria-disabled")).toBe("true");
    // 준비 전에 눌러도 공유 창을 열지 않는다
    action?.click();
    expect(share).not.toHaveBeenCalled();

    release();
    await vi.waitFor(() => expect(byText("내보내기")).toBeDefined());
    expect(byText("내보내기")?.getAttribute("aria-disabled")).toBe("false");
    expect(calls.filter((call) => call.path === "/api/export")).toHaveLength(1);
  });

  it("범위 화면: 들어가는 것·들어가지 않는 것·파일 이름·저장 위치 안내, 화면 말에 JSON이 없다", async () => {
    stubShare(async () => {});
    stubFetch((request) => (request.path === "/api/export" ? { status: 200, body: EXPORT_PAGE } : elseOffline(request)));
    await openFrom("#/settings/export");
    expect(heading()).toBe("내 기록 내보내기");
    const body = text();
    for (const expected of ["완료한 기록과 임시저장한 기록", "하루 기준 시각", "부를 이름", "접근 열쇠", "앱 잠금 비밀번호", "관리용 값", "AI와 나눈 대화 전문", "공유 창에서 고른 곳에 저장돼요"]) {
      expect(body).toContain(expected);
    }
    await vi.waitFor(() => expect(text()).toContain(FILE_NAME));
    // 파일 이름의 .json만 보이고, 말로는 JSON이라고 하지 않는다
    expect(body.replaceAll(FILE_NAME, "").replace(/emotion-diary-[^\s]*\.json/g, "")).not.toMatch(/json/i);
    expect(text().replaceAll(FILE_NAME, "")).not.toMatch(/json/i);
  });
});

describe("내보내기 — 공유 창", () => {
  it("누르면 같은 동기 흐름에서 share가 파일 하나(이름·형식·응답 그대로의 내용)로 불리고, 끝나면 ?s=done으로 바꿔친다", async () => {
    const clipboard = stubClipboard();
    const share = stubShare(async () => {});
    stubFetch((request) => (request.path === "/api/export" ? { status: 200, body: EXPORT_PAGE } : elseOffline(request)));
    await openFrom("#/settings/export");
    await vi.waitFor(() => expect(byText("내보내기")).toBeDefined());
    const length = history.length;

    byText("내보내기")?.click();
    // 기다림(await) 없이 — 누른 바로 그 줄에서 불려야 iOS가 거부하지 않는다
    expect(share).toHaveBeenCalledTimes(1);
    const data = share.mock.calls[0]?.[0] as ShareData;
    expect(data.files).toHaveLength(1);
    const file = data.files?.[0] as File;
    expect(file.name).toBe(FILE_NAME);
    expect(file.type).toBe("application/json");
    expect(JSON.parse(await file.text())).toEqual(EXPORT_FILE);
    expect(typeof data.title).toBe("string");

    await vi.waitFor(() => expect(location.hash).toBe("#/settings/export?s=done"));
    expect(history.length).toBe(length);
    expect(heading()).toBe("파일을 만들었어요");
    expect(text()).toContain(FILE_NAME);
    expect(text()).toContain("공유 창에서 고른 곳에 저장돼요");
    expect(byText("돌아가기")).toBeDefined();
    expect(clipboard.writeText).not.toHaveBeenCalled();
    expect(clipboard.write).not.toHaveBeenCalled();

    // 돌아가기 = 밀어서 뒤로 — 들어왔던 오늘 화면
    byText("돌아가기")?.click();
    await vi.waitFor(() => expect(location.hash).toBe("#/today"));
  });

  it("두 번 눌러도 공유 창은 한 번만 연다", async () => {
    const share = stubShare(() => new Promise<void>(() => {}));
    stubFetch((request) => (request.path === "/api/export" ? { status: 200, body: EXPORT_PAGE } : elseOffline(request)));
    await openFrom("#/settings/export");
    await vi.waitFor(() => expect(byText("내보내기")).toBeDefined());
    const action = byText("내보내기");
    action?.click();
    action?.click();
    expect(share).toHaveBeenCalledTimes(1);
    expect(action?.getAttribute("aria-disabled")).toBe("true");
  });

  it("공유 창을 그냥 닫으면(AbortError) 실패가 아니다 — 그대로 머물고 다시 누를 수 있다", async () => {
    const share = stubShare(async () => {
      throw new DOMException("닫음", "AbortError");
    });
    stubFetch((request) => (request.path === "/api/export" ? { status: 200, body: EXPORT_PAGE } : elseOffline(request)));
    await openFrom("#/settings/export");
    await vi.waitFor(() => expect(byText("내보내기")).toBeDefined());
    byText("내보내기")?.click();
    await vi.waitFor(() => expect(byText("내보내기")?.getAttribute("aria-disabled")).toBe("false"));
    expect(location.hash).toBe("#/settings/export");
    expect(heading()).toBe("내 기록 내보내기");
    byText("내보내기")?.click();
    expect(share).toHaveBeenCalledTimes(2);
  });

  it("공유 창이 AbortError 말고 다른 이유로 거절하면 내보내지 못한 것이다 — ?s=fail", async () => {
    stubShare(async () => {
      throw new DOMException("막힘", "NotAllowedError");
    });
    stubFetch((request) => (request.path === "/api/export" ? { status: 200, body: EXPORT_PAGE } : elseOffline(request)));
    await openFrom("#/settings/export");
    await vi.waitFor(() => expect(byText("내보내기")).toBeDefined());
    byText("내보내기")?.click();
    await vi.waitFor(() => expect(location.hash).toBe("#/settings/export?s=fail"));
    expect(heading()).toBe("내보내지 못했어요");
  });
});

describe("내보내기 — 공유 창이 없을 때(PC 등)", () => {
  it("<a download>로 내려받고 주소를 거둔다 — 공유 창·클립보드는 쓰지 않는다", async () => {
    const clipboard = stubClipboard();
    setNavigator("share", undefined);
    setNavigator("canShare", undefined);
    const made: Blob[] = [];
    const urlApi = URL as unknown as { createObjectURL?: (blob: Blob) => string; revokeObjectURL?: (url: string) => void };
    const originalCreate = urlApi.createObjectURL;
    const originalRevoke = urlApi.revokeObjectURL;
    const create = vi.fn((blob: Blob) => {
      made.push(blob);
      return "blob:fake-export";
    });
    const revoke = vi.fn();
    urlApi.createObjectURL = create;
    urlApi.revokeObjectURL = revoke;
    restore.push(() => {
      urlApi.createObjectURL = originalCreate;
      urlApi.revokeObjectURL = originalRevoke;
    });
    const clicked: Array<{ download: string | null; href: string | null }> = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push({ download: this.getAttribute("download"), href: this.getAttribute("href") });
    });
    stubFetch((request) => (request.path === "/api/export" ? { status: 200, body: EXPORT_PAGE } : elseOffline(request)));
    await openFrom("#/settings/export");
    expect(text()).toContain("내려받기 위치");
    await vi.waitFor(() => expect(byText("내보내기")).toBeDefined());

    byText("내보내기")?.click();
    expect(clicked).toEqual([{ download: FILE_NAME, href: "blob:fake-export" }]);
    expect(create).toHaveBeenCalledTimes(1);
    expect(JSON.parse(await (made[0] as Blob).text())).toEqual(EXPORT_FILE);
    // 눌렀던 링크는 화면에 남기지 않는다
    expect(document.querySelector("a[download]")).toBeNull();

    await vi.waitFor(() => expect(location.hash).toBe("#/settings/export?s=done"));
    expect(text()).toContain(FILE_NAME);
    expect(text()).toContain("내려받기 위치");
    await vi.waitFor(() => expect(revoke).toHaveBeenCalledWith("blob:fake-export"), { timeout: 3000 });
    expect(clipboard.writeText).not.toHaveBeenCalled();
    expect(clipboard.write).not.toHaveBeenCalled();
  });

  it("공유 창이 있어도 이 파일을 넘길 수 없다고 하면(canShare가 거짓) 내려받기로 대신한다", async () => {
    const share = stubShare(async () => {}, false);
    const urlApi = URL as unknown as { createObjectURL?: (blob: Blob) => string; revokeObjectURL?: (url: string) => void };
    const originalCreate = urlApi.createObjectURL;
    const originalRevoke = urlApi.revokeObjectURL;
    urlApi.createObjectURL = vi.fn(() => "blob:fake-2");
    urlApi.revokeObjectURL = vi.fn();
    restore.push(() => {
      urlApi.createObjectURL = originalCreate;
      urlApi.revokeObjectURL = originalRevoke;
    });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    stubFetch((request) => (request.path === "/api/export" ? { status: 200, body: EXPORT_PAGE } : elseOffline(request)));
    await openFrom("#/settings/export");
    await vi.waitFor(() => expect(byText("내보내기")).toBeDefined());
    byText("내보내기")?.click();
    expect(share).not.toHaveBeenCalled();
    expect(click).toHaveBeenCalledTimes(1);
  });
});

describe("내보내기 — 받기 실패", () => {
  it.each([
    ["서버 오류(500)", { status: 500, body: { error: "server_error" } } as FakeReply | "offline"],
    ["연결 끊김", "offline" as FakeReply | "offline"],
    ["모양이 다른 200 응답", { status: 200, body: { hello: "가짜 접속 화면" } } as FakeReply | "offline"]
  ])("%s: ?s=fail, 다시 시도만 있고 '브라우저에서 열기'·클립보드는 없다", async (_name, reply) => {
    const clipboard = stubClipboard();
    const share = stubShare(async () => {});
    let ok = false;
    const calls = stubFetch((request) => {
      if (request.path !== "/api/export") return elseOffline(request);
      return ok ? { status: 200, body: EXPORT_PAGE } : reply;
    });
    await openFrom("#/settings/export");
    await vi.waitFor(() => expect(location.hash).toBe("#/settings/export?s=fail"));
    expect(heading()).toBe("내보내지 못했어요");
    expect(text()).toContain("기록은 그대로 있어요");
    expect(byText("다시 시도")).toBeDefined();
    expect(text()).not.toContain("브라우저에서 열기");
    expect(byText("내보내기")).toBeUndefined();
    expect(clipboard.writeText).not.toHaveBeenCalled();
    expect(clipboard.write).not.toHaveBeenCalled();
    expect(share).not.toHaveBeenCalled();

    // 다시 시도 = 범위 화면을 바꿔쳐 다시 받는다(기록 칸을 더하지 않는다)
    const length = history.length;
    ok = true;
    byText("다시 시도")?.click();
    await vi.waitFor(() => expect(byText("내보내기")).toBeDefined());
    expect(location.hash).toBe("#/settings/export");
    expect(history.length).toBe(length);
    expect(calls.filter((call) => call.path === "/api/export")).toHaveLength(2);
  });
});

describe("내보내기 — 조각으로 나눠 받기(한 번에 최대 100편)", () => {
  const FIRST = entry("2026-10-15", "첫 조각의 가짜 글");
  const SECOND = entry("2026-10-16", "둘째 조각의 가짜 글");
  const afterOf = (request: FakeRequest): string | null => new URL(request.path, "http://local.test").searchParams.get("after");
  const firstPage = (): FakeReply => ({ status: 200, body: { ...EXPORT_FILE, diaries: [FIRST], next: "2026-10-15" } satisfies ExportPage });
  // 둘째 조각의 exportedAt은 일부러 다른 날 — 파일 이름은 첫 조각 기준이어야 한다
  const lastPage = (): FakeReply => ({
    status: 200,
    body: { ...EXPORT_FILE, exportedAt: "2026-11-30T03:30:00.000Z", diaries: [SECOND], next: null } satisfies ExportPage
  });

  it("next가 있으면 ?after=로 이어 받고, 마지막 조각까지 온 뒤에야 켜지며, 기록을 순서대로 이은 파일(next 칸 없음, 이름은 첫 조각 기준)을 공유한다", async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const share = stubShare(async () => {});
    const calls = stubFetch(async (request) => {
      if (!request.path.startsWith("/api/export")) return elseOffline(request);
      if (afterOf(request) === null) return firstPage();
      await gate;
      return lastPage();
    });
    await openFrom("#/settings/export");
    await vi.waitFor(() => expect(calls.filter((call) => call.path.startsWith("/api/export"))).toHaveLength(2));
    // 둘째 조각을 기다리는 동안은 아직 준비 중이다
    expect(byText("준비하고 있어요…")?.getAttribute("aria-disabled")).toBe("true");
    byText("준비하고 있어요…")?.click();
    expect(share).not.toHaveBeenCalled();

    release();
    await vi.waitFor(() => expect(byText("내보내기")).toBeDefined());
    const exportCalls = calls.filter((call) => call.path.startsWith("/api/export"));
    expect(exportCalls.map((call) => `${call.method} ${call.path}`)).toEqual(["GET /api/export", "GET /api/export?after=2026-10-15"]);
    for (const call of exportCalls) expect(call.headers["x-timezone"]).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);

    byText("내보내기")?.click();
    expect(share).toHaveBeenCalledTimes(1);
    const shared = share.mock.calls[0]?.[0] as ShareData;
    const file = (shared.files ?? [])[0] as File;
    expect(file.name).toBe(FILE_NAME);
    const content = JSON.parse(await file.text()) as ExportFile & { next?: unknown };
    expect(content).toEqual({ ...EXPORT_FILE, diaries: [FIRST, SECOND] });
    expect("next" in content).toBe(false);
    expect(content.exportedAt).toBe(EXPORT_FILE.exportedAt);
  });

  it("중간 조각이 실패하면 일부만 담긴 파일을 만들지 않고 ?s=fail이다", async () => {
    const share = stubShare(async () => {});
    const calls = stubFetch((request) => {
      if (!request.path.startsWith("/api/export")) return elseOffline(request);
      return afterOf(request) === null ? firstPage() : { status: 500, body: { error: "server_error" } };
    });
    await openFrom("#/settings/export");
    await vi.waitFor(() => expect(location.hash).toBe("#/settings/export?s=fail"));
    expect(calls.filter((call) => call.path.startsWith("/api/export"))).toHaveLength(2);
    expect(byText("내보내기")).toBeUndefined();
    expect(share).not.toHaveBeenCalled();
  });

  it("next 칸이 없거나·날짜가 아니거나·앞으로 나아가지 않으면 끝까지 받았다고 볼 수 없어 실패다", async () => {
    const withoutNext = { ...EXPORT_FILE };
    const bodies: Array<[string, (after: string | null) => unknown]> = [
      ["next 칸 없음", () => withoutNext],
      ["next가 날짜가 아님", () => ({ ...EXPORT_FILE, next: "내일" })],
      ["next가 제자리", (after) => ({ ...EXPORT_FILE, next: after ?? "2026-10-15" })]
    ];
    for (const [label, body] of bodies) {
      stubFetch((request) => ({ status: 200, body: body(afterOf(request)) }));
      const result = await fetchExport();
      expect(result.ok, label).toBe(false);
    }
  });
});

describe("내보내기 — 내용을 어디에도 남기지 않는다", () => {
  it("받는 중·준비됨·내보냄·실패 어디에서도 저장소·주소에 기록 내용과 파일 이름이 0건이다", async () => {
    stubShare(async () => {});
    stubFetch((request) => (request.path === "/api/export" ? { status: 200, body: EXPORT_PAGE } : elseOffline(request)));
    const inStorage = (): string[] => {
      const found: string[] = [];
      for (const store of [localStorage, sessionStorage]) {
        for (let i = 0; i < store.length; i += 1) {
          const key = store.key(i) ?? "";
          const value = store.getItem(key) ?? "";
          if ([key, value].some((part) => part.includes(MARK) || part.includes("emotion-diary-") || part.includes(".json"))) found.push(key);
        }
      }
      return found;
    };
    const inUrl = (): boolean => [location.href, document.referrer].some((part) => part.includes(MARK) || part.includes("emotion-diary-") || part.includes(".json"));

    await openFrom("#/settings/export");
    expect(inStorage()).toEqual([]);
    await vi.waitFor(() => expect(byText("내보내기")).toBeDefined());
    expect(inStorage()).toEqual([]);
    expect(inUrl()).toBe(false);
    byText("내보내기")?.click();
    await vi.waitFor(() => expect(location.hash).toBe("#/settings/export?s=done"));
    expect(inStorage()).toEqual([]);
    expect(inUrl()).toBe(false);
  });
});

// ───────── 모든 기록 지우기 ─────────

function press(digits: string): void {
  for (const digit of digits) {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: digit, bubbles: true, cancelable: true }));
  }
}

const confirmInput = () => document.querySelector<HTMLInputElement>("#delete-confirm");
const submitButton = () => byText("영구 삭제");
const padStatus = () => document.querySelector(".pin-status")?.textContent;

function type(value: string): void {
  const input = confirmInput();
  if (!input) throw new Error("확인 칸이 없어요");
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function putUnsent(): void {
  writeUnsent({
    v: 1,
    date: UNSENT_DATE,
    mode: "draft",
    baseRevision: null,
    diary: withText(emptyDiary(), "eventText", MARK),
    step: null,
    pending: null,
    savedAt: 1
  });
}

type DeleteHandler = (request: FakeRequest) => FakeReply | "offline";
const ok: DeleteHandler = () => ({ status: 200, body: { deleted: true } });

function serveDelete(handler: DeleteHandler): FakeRequest[] {
  return stubFetch((request) => {
    if (request.method === "DELETE" && request.path === "/api/diaries") return handler(request);
    if (request.path === "/api/export") return { status: 200, body: EXPORT_PAGE };
    return elseOffline(request);
  });
}

const deletes = (calls: FakeRequest[]) => calls.filter((call) => call.method === "DELETE");

describe("모든 기록 지우기 — 화면", () => {
  it("제목(위험 색 클래스)·지워지는 것 목록·남는 것·먼저 내보내기·그만두기", async () => {
    serveDelete(ok);
    await openFrom("#/settings/delete");
    expect(heading()).toBe("모든 기록 지우기");
    expect(document.querySelector("h1")?.classList.contains("data-danger-title")).toBe(true);
    const body = text();
    for (const expected of ["모든 기록과 임시저장", "부를 이름", "앱 잠금 설정", "하루 기준 시각", "다른 기기의 로그인", "이 기기의 로그인과 접근 열쇠는 그대로 남아요"]) {
      expect(body).toContain(expected);
    }
    expect(document.querySelector("label[for='delete-confirm']")?.textContent).toContain(DELETE_ALL_CONFIRM);
    expect(submitButton()?.getAttribute("aria-disabled")).toBe("true");

    byText("먼저 내보내기")?.click();
    expect(location.hash).toBe("#/settings/export");
  });

  it("그만두기는 밀어서 뒤로 가기와 같다 — 아무것도 보내지 않는다", async () => {
    const calls = serveDelete(ok);
    await openFrom("#/settings/delete");
    byText("그만두기")?.click();
    await vi.waitFor(() => expect(location.hash).toBe("#/today"));
    expect(deletes(calls)).toHaveLength(0);
  });
});

describe("모든 기록 지우기 — 확인 문구", () => {
  it("문구가 다르면 꺼져 있고(공백 하나 다른 것 포함) 눌러도 아무것도 보내지 않는다", async () => {
    const calls = serveDelete(ok);
    await openFrom("#/settings/delete");
    for (const wrong of ["", "모든 기록 삭", "모든 기록 삭제 ", " 모든 기록 삭제", "모든  기록 삭제", "모든기록삭제", "모든 기록 삭제하기", "삭제"]) {
      type(wrong);
      expect(submitButton()?.getAttribute("aria-disabled"), JSON.stringify(wrong)).toBe("true");
      submitButton()?.click();
    }
    await flush(20);
    expect(deletes(calls)).toHaveLength(0);
    expect(location.hash).toBe("#/settings/delete");
  });

  it("문구와 정확히 같으면 켜지고, 다시 달라지면 꺼진다", async () => {
    serveDelete(ok);
    await openFrom("#/settings/delete");
    type(DELETE_ALL_CONFIRM);
    expect(submitButton()?.getAttribute("aria-disabled")).toBe("false");
    type(`${DELETE_ALL_CONFIRM} `);
    expect(submitButton()?.getAttribute("aria-disabled")).toBe("true");
  });
});

describe("모든 기록 지우기 — 앱 잠금이 꺼져 있을 때", () => {
  it("DELETE /api/diaries 본문은 확인 문구뿐이고, 성공하면 이 기기의 쓰던 글을 버린 뒤 삭제 완료로 바꿔친다", async () => {
    putUnsent();
    expect(readUnsent(UNSENT_DATE)).not.toBeNull();
    app.name = "시험";
    const calls = serveDelete(ok);
    await openFrom("#/settings/delete");
    const length = history.length;

    type(DELETE_ALL_CONFIRM);
    submitButton()?.click();
    await vi.waitFor(() => expect(location.hash).toBe("#/settings/deleted"));

    const sent = deletes(calls);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.path).toBe("/api/diaries");
    expect(sent[0]?.body).toEqual({ confirm: "모든 기록 삭제" });
    // 이 기기의 사본이 비었고 화면의 상태가 처음으로 돌아갔다
    expect(readUnsent(UNSENT_DATE)).toBeNull();
    expect(localStorage.getItem("unsentDiaries")).toBeNull();
    expect(app.hasName).toBe(false);
    expect(app.name).toBeNull();
    expect(app.appLock).toBe(false);
    // 기록 칸을 더하지 않고 바꿔쳤다
    expect(history.length).toBe(length);

    expect(heading()).toBe("모두 삭제했어요");
    expect(text()).toContain("앱에서는 바로 사라졌어요");
    expect(text()).toContain("복구용 사본에는 한동안 남을 수 있어요");
    expect(text()).toContain("7일");
    expect(text()).toContain("30일쯤");
    expect(text()).toContain("직접 내보낸 파일은 직접 지워야 해요");
    // 즉시 완전 삭제라고 단정하지 않는다
    expect(text()).not.toContain("완전히 지워");
    expect(byText("처음부터 시작하기")).toBeDefined();
  });

  it("삭제 완료에서 뒤로 가도 삭제 화면으로 돌아가지 않는다 — 처음 상태(이름 화면)로 간다", async () => {
    serveDelete(ok);
    await openFrom("#/settings/delete");
    type(DELETE_ALL_CONFIRM);
    submitButton()?.click();
    await vi.waitFor(() => expect(location.hash).toBe("#/settings/deleted"));
    history.back();
    await flush(30);
    expect(location.hash).not.toContain("settings/delete");
    expect(location.hash).toBe("#/auth/name");
  });

  it("처음부터 시작하기는 이름 화면으로 바꿔친다(기록 칸을 더하지 않는다)", async () => {
    serveDelete(ok);
    await openFrom("#/settings/delete");
    type(DELETE_ALL_CONFIRM);
    submitButton()?.click();
    await vi.waitFor(() => expect(location.hash).toBe("#/settings/deleted"));
    const length = history.length;
    byText("처음부터 시작하기")?.click();
    expect(location.hash).toBe("#/auth/name");
    expect(history.length).toBe(length);
  });

  it.each([
    ["서버 오류(500)", { status: 500, body: { error: "server_error" } } as FakeReply | "offline", "지우지 못했어요. 기록은 그대로 있어요"],
    // 응답을 못 받으면 서버가 지웠는지 알 수 없다 — '그대로 있어요'라고 단정하지 않는다(같은 요청을 다시 보내도 결과가 같다)
    ["연결 끊김", "offline" as FakeReply | "offline", "지웠는지 확인하지 못했어요. 연결된 뒤 다시 눌러 주세요"]
  ])("%s: 토스트로 알리고 아무것도 버리지 않으며 다시 누를 수 있다", async (_name, reply, message) => {
    putUnsent();
    const calls = serveDelete(() => reply);
    await openFrom("#/settings/delete");
    type(DELETE_ALL_CONFIRM);
    submitButton()?.click();
    await vi.waitFor(() => expect(toast()).toBe(message));
    expect(deletes(calls)).toHaveLength(1);
    expect(readUnsent(UNSENT_DATE)).not.toBeNull();
    expect(app.hasName).toBe(true);
    expect(app.name).toBe("시험");
    expect(location.hash).toBe("#/settings/delete");
    expect(submitButton()?.getAttribute("aria-disabled")).toBe("false");
  });

  it("지우는 동안 다시 눌러도 요청은 한 번이다", async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const calls = stubFetch(async (request) => {
      if (request.method === "DELETE") {
        await gate;
        return { status: 200, body: { deleted: true } };
      }
      return elseOffline(request);
    });
    await openFrom("#/settings/delete");
    type(DELETE_ALL_CONFIRM);
    submitButton()?.click();
    submitButton()?.click();
    expect(submitButton()?.getAttribute("aria-disabled")).toBe("true");
    release();
    await vi.waitFor(() => expect(location.hash).toBe("#/settings/deleted"));
    expect(deletes(calls)).toHaveLength(1);
  });

  it.each([
    ["지우지 못하면(500) 그때 보낸다", { status: 500, body: { error: "server_error" } } as FakeReply, 1],
    ["지웠으면 끝내 보내지 않는다", { status: 200, body: { deleted: true } } as FakeReply, 0]
  ])("지우는 동안 쓰던 글을 서버로 보내지 않는다 — %s", async (_name, reply, sentAfter) => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const calls = stubFetch(async (request) => {
      if (request.method === "DELETE") {
        await gate;
        return reply;
      }
      return elseOffline(request);
    });
    // 보낼 것이 남은 저장 줄(ahead) — 보내는 함수는 세기만 하고 답하지 않는다
    const send = vi.fn((): Promise<never> => new Promise(() => {}));
    const saver = new Saver({ date: UNSENT_DATE, mode: "draft", revision: null, diary: withText(emptyDiary(), "eventText", MARK), step: null, ahead: true, send });
    await openFrom("#/settings/delete");
    type(DELETE_ALL_CONFIRM);
    submitButton()?.click();
    await vi.waitFor(() => expect(deletes(calls)).toHaveLength(1));
    // 연결 복귀·다시 보임이 와도 얼린 동안은 보내지 않는다
    saver.retryNow();
    await flush(5);
    expect(send).not.toHaveBeenCalled();
    release();
    await vi.waitFor(() => expect(location.hash).toBe(sentAfter ? "#/settings/delete" : "#/settings/deleted"));
    await flush(5);
    expect(send).toHaveBeenCalledTimes(sentAfter);
  });

  it("응답을 못 받으면(서버가 지웠을 수도 있다) 이 화면에 있는 동안은 보내지 않고, 화면을 떠나면 그때 보낸다", async () => {
    const calls = serveDelete(() => "offline");
    const send = vi.fn((): Promise<never> => new Promise(() => {}));
    const saver = new Saver({ date: UNSENT_DATE, mode: "draft", revision: null, diary: withText(emptyDiary(), "eventText", MARK), step: null, ahead: true, send });
    await openFrom("#/settings/delete");
    type(DELETE_ALL_CONFIRM);
    submitButton()?.click();
    await vi.waitFor(() => expect(toast()).toBe("지웠는지 확인하지 못했어요. 연결된 뒤 다시 눌러 주세요"));
    saver.retryNow();
    await flush(5);
    expect(send).not.toHaveBeenCalled();
    // 다시 누르면 같은 요청을 한 번 더 보낸다(얼린 채)
    submitButton()?.click();
    await vi.waitFor(() => expect(deletes(calls)).toHaveLength(2));
    await flush(5);
    expect(send).not.toHaveBeenCalled();
    // 지우기를 그만두고 떠난다 — 남은 글을 보낸다
    byText("그만두기")?.click();
    await vi.waitFor(() => expect(location.hash).not.toContain("settings/delete"));
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  });
});

describe("모든 기록 지우기 — 앱 잠금이 켜져 있을 때", () => {
  it("누르면 숫자판이 먼저 뜨고(그때까지 요청 없음), 틀리면 다시 묻고, 맞으면 pin과 함께 보내 지운다", async () => {
    app.appLock = true;
    putUnsent();
    const calls = serveDelete((request) => {
      const body = request.body as { pin?: string };
      return body.pin === PIN ? { status: 200, body: { deleted: true } } : { status: 422, body: { error: "wrong_pin", remaining: 4 } };
    });
    await openFrom("#/settings/delete");
    type(DELETE_ALL_CONFIRM);
    submitButton()?.click();
    await vi.waitFor(() => expect(document.querySelector(".scene-overlay")).not.toBeNull());
    expect(document.querySelector(".scene-title")?.textContent).toBe("지금 비밀번호를 눌러 주세요");
    expect(deletes(calls)).toHaveLength(0);

    press("0000");
    await vi.waitFor(() => expect(padStatus()).toBe("맞지 않아요. 다시 눌러 주세요."));
    // 틀린 동안에는 아무것도 버리지 않는다
    expect(readUnsent(UNSENT_DATE)).not.toBeNull();
    expect(app.hasName).toBe(true);

    press(PIN);
    await vi.waitFor(() => expect(location.hash).toBe("#/settings/deleted"));
    expect(deletes(calls).map((call) => call.body)).toEqual([
      { confirm: "모든 기록 삭제", pin: "0000" },
      { confirm: "모든 기록 삭제", pin: PIN }
    ]);
    expect(document.querySelector(".scene-overlay")).toBeNull();
    expect(readUnsent(UNSENT_DATE)).toBeNull();
    expect(app.hasName).toBe(false);
    expect(app.appLock).toBe(false);
    // 숫자판의 숫자는 어디에도 남지 않는다
    expect(JSON.stringify({ ...localStorage })).not.toContain(PIN);
    expect(location.href).not.toContain(PIN);
  });

  it("서버 오류(500)면 숫자판에 안내를 보이고 아무것도 버리지 않는다 — 닫으면 삭제 화면 그대로", async () => {
    app.appLock = true;
    putUnsent();
    const calls = serveDelete(() => ({ status: 500, body: { error: "server_error" } }));
    await openFrom("#/settings/delete");
    type(DELETE_ALL_CONFIRM);
    submitButton()?.click();
    await vi.waitFor(() => expect(document.querySelector(".scene-overlay")).not.toBeNull());
    press(PIN);
    await vi.waitFor(() => expect(padStatus()).toBe("지금은 할 수 없어요. 잠시 뒤 다시 시도해 주세요."));
    expect(deletes(calls)).toHaveLength(1);
    expect(readUnsent(UNSENT_DATE)).not.toBeNull();
    expect(app.hasName).toBe(true);
    expect(app.appLock).toBe(true);

    byText("‹ 닫기")?.click();
    await vi.waitFor(() => expect(document.querySelector(".scene-overlay")).toBeNull());
    expect(location.hash).toBe("#/settings/delete");
    expect(heading()).toBe("모든 기록 지우기");
    expect(submitButton()?.getAttribute("aria-disabled")).toBe("false");
  });

  it("다섯 번 틀려 쉬어야 하면(429) 남은 초를 알리고 아무것도 버리지 않는다", async () => {
    app.appLock = true;
    putUnsent();
    serveDelete(() => ({ status: 429, body: { error: "pin_resting", retryAfter: 30 }, headers: { "retry-after": "30" } }));
    await openFrom("#/settings/delete");
    type(DELETE_ALL_CONFIRM);
    submitButton()?.click();
    await vi.waitFor(() => expect(document.querySelector(".scene-overlay")).not.toBeNull());
    press(PIN);
    await vi.waitFor(() => expect(padStatus()).toContain("잠시 쉬었다가 다시 눌러요"));
    expect(padStatus()).toContain("초");
    expect(readUnsent(UNSENT_DATE)).not.toBeNull();
    expect(app.hasName).toBe(true);
  });

  it("화면은 잠금이 꺼졌다고 알고 있는데 서버가 비밀번호를 요구하면(422 pin_required) 그때 숫자판으로 받는다", async () => {
    app.appLock = false;
    const calls = serveDelete((request) => {
      const body = request.body as { pin?: string };
      if (body.pin === undefined) return { status: 422, body: { error: "pin_required" } };
      return body.pin === PIN ? { status: 200, body: { deleted: true } } : { status: 422, body: { error: "wrong_pin", remaining: 4 } };
    });
    await openFrom("#/settings/delete");
    type(DELETE_ALL_CONFIRM);
    submitButton()?.click();
    await vi.waitFor(() => expect(document.querySelector(".scene-overlay")).not.toBeNull());
    press(PIN);
    await vi.waitFor(() => expect(location.hash).toBe("#/settings/deleted"));
    expect(deletes(calls).map((call) => call.body)).toEqual([{ confirm: "모든 기록 삭제" }, { confirm: "모든 기록 삭제", pin: PIN }]);
  });
});

// ───────── 길과 진입 ─────────

describe("화면 주소와 진입", () => {
  it("세 화면은 아는 주소이고, 로그인 뒤 돌아갈 수 있는 것은 내보내기·지우기뿐이다(삭제 완료는 아니다)", () => {
    for (const hash of ["#/settings/export", "#/settings/delete", "#/settings/deleted", "#/settings/export?s=done"]) {
      expect(parseHash(hash).known, hash).toBe(true);
    }
    expect(isReturnable("settings/export")).toBe(true);
    expect(isReturnable("settings/delete")).toBe(true);
    expect(isReturnable("settings/deleted")).toBe(false);
  });

  it("로그인 전에는 열쇠 화면으로 — 삭제 완료로는 돌아갈 곳을 두지 않는다", () => {
    const state = { authenticated: false, hasName: false, forgotPin: false };
    expect(guardRoute(state, parseHash("#/settings/delete"))).toEqual({ redirect: "#/auth?s=again", returnTo: "settings/delete" });
    expect(guardRoute(state, parseHash("#/settings/deleted"))).toEqual({ redirect: "#/auth", returnTo: null });
  });

  it("이름이 지워진 로그인 상태에서도 삭제 완료만 열린다 — 다른 화면은 이름 화면으로", () => {
    const state = { authenticated: true, hasName: false, forgotPin: false };
    expect(guardRoute(state, parseHash("#/settings/deleted")).redirect).toBeNull();
    expect(guardRoute(state, parseHash("#/settings/delete")).redirect).toBe("#/auth/name");
    expect(guardRoute(state, parseHash("#/settings/export")).redirect).toBe("#/auth/name");
    expect(guardRoute(state, parseHash("#/today")).redirect).toBe("#/auth/name");
  });

  it("오늘 화면의 작은 줄에서 두 화면으로 push한다", async () => {
    stubFetch(() => todayReply());
    history.replaceState(null, "", "/#/today");
    render();
    await flush(10);
    const length = history.length;
    byText("내 기록 내보내기")?.click();
    expect(location.hash).toBe("#/settings/export");
    expect(history.length).toBe(length + 1);

    history.replaceState(null, "", "/#/today");
    render();
    await flush(10);
    const before = history.length;
    byText("모든 기록 지우기")?.click();
    expect(location.hash).toBe("#/settings/delete");
    expect(history.length).toBe(before + 1);
    expect(heading()).toBe("모든 기록 지우기");
  });
});
