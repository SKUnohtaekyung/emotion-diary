/// <reference path="../../client/src/env.d.ts" />
// 저장 줄과 기기 사본(TASK-SLICE-01 PLAN A-11·§3.3·§3.4, 사용자 결정 U-2).
// 요청 하나, 같은 열쇠 다시, 순번, 사본을 쓰고 지우는 때, 401·423·끊김에서 사본 유지, 충돌을 덮지 않음, edit 모드는 저절로 보내지 않음.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DiaryInput, DiaryMeta } from "../../shared/diary";
import type { ApiResult } from "../../client/src/lib/api";
import { emptyDiary, toggleCategory, withText, type WorkingDiary } from "../../client/src/write/flow";
import {
  blockSending,
  COPY_AFTER_MS,
  isSendingBlocked,
  liveSaver,
  RETRY_MS,
  resetSaversForTest,
  SEND_AFTER_MS,
  Saver,
  type SendFn
} from "../../client/src/write/saver";
import { clearUnsent, hasUnsent, readUnsent, resetUnsentForTest, unsentDates, writeUnsent } from "../../client/src/write/unsent";

const DATE = "2026-10-16";

interface Call {
  date: string;
  body: DiaryInput;
  key: string;
  resolve: (result: ApiResult<DiaryMeta>) => void;
}

function fakeSend(): { send: SendFn; calls: Call[] } {
  const calls: Call[] = [];
  const send: SendFn = (date, body, key) =>
    new Promise((resolve) => {
      calls.push({ date, body: structuredClone(body), key, resolve });
    });
  return { send, calls };
}

const ok = (revision: number, date = DATE): ApiResult<DiaryMeta> => ({
  ok: true,
  status: revision === 1 ? 201 : 200,
  data: { id: "id", entryDate: date, status: "draft", revision, updatedAt: "", completedAt: null, firstCompletedLocalDate: null }
});

const fail = (status: number, code: string | null = null, detail: Record<string, unknown> = {}): ApiResult<DiaryMeta> => ({
  ok: false,
  status,
  code: code as never,
  retryAfter: null,
  remaining: null,
  offline: status === 0,
  detail: detail as never
});

const text = (value: string): WorkingDiary => withText(emptyDiary(), "eventText", value);

async function tick(ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
}

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  resetUnsentForTest();
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
});

afterEach(() => {
  resetSaversForTest();
  vi.useRealTimers();
});

describe("draft 모드 저장", () => {
  it("입력 뒤 300ms에 사본, 800ms에 보내고 받으면 사본을 지운다 — 새 글은 판 번호 없이", async () => {
    const { send, calls } = fakeSend();
    const saver = new Saver({ date: DATE, mode: "draft", revision: null, diary: emptyDiary(), step: null, send });
    saver.update(text("산책"), { step: "event", category: null });
    await tick(COPY_AFTER_MS);
    expect(readUnsent(DATE)?.diary.eventText).toBe("산책");
    expect(calls).toHaveLength(0);
    await tick(SEND_AFTER_MS - COPY_AFTER_MS);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.body.revision).toBeNull();
    expect(calls[0]?.body.resume).toEqual({ step: "event", categoryCode: null });
    calls[0]?.resolve(ok(1));
    await tick(0);
    expect(saver.status()).toMatchObject({ state: "saved", revision: 1, unsent: false });
    expect(readUnsent(DATE)).toBeNull();
  });

  it("요청은 한 번에 하나 — 날아가는 동안 쓴 글은 답을 받은 뒤 새 열쇠·새 판 번호로", async () => {
    const { send, calls } = fakeSend();
    const saver = new Saver({ date: DATE, mode: "draft", revision: 3, diary: text("a"), step: null, send });
    saver.update(text("ab"), null);
    await tick(SEND_AFTER_MS);
    saver.update(text("abc"), null);
    await tick(SEND_AFTER_MS * 3);
    expect(calls).toHaveLength(1);
    calls[0]?.resolve(ok(4));
    await tick(0);
    expect(calls).toHaveLength(2);
    expect(calls[1]?.body).toMatchObject({ revision: 4, eventText: "abc" });
    expect(calls[1]?.key).not.toBe(calls[0]?.key);
    // 둘째 답 전에는 사본이 남는다(글이 서버보다 앞선다)
    expect(readUnsent(DATE)?.diary.eventText).toBe("abc");
    calls[1]?.resolve(ok(5));
    await tick(0);
    expect(readUnsent(DATE)).toBeNull();
    expect(saver.revision).toBe(5);
  });

  it("연결이 끊기면 사본을 두고 같은 열쇠·같은 본문으로 다시 보낸다(2초 뒤)", async () => {
    const { send, calls } = fakeSend();
    const saver = new Saver({ date: DATE, mode: "draft", revision: 2, diary: text("a"), step: null, send });
    saver.update(text("ab"), null);
    await tick(SEND_AFTER_MS);
    calls[0]?.resolve(fail(0));
    await tick(0);
    expect(saver.status().state).toBe("offline");
    expect(readUnsent(DATE)?.pending?.key).toBe(calls[0]?.key);
    await tick(RETRY_MS[0]);
    expect(calls).toHaveLength(2);
    expect(calls[1]?.key).toBe(calls[0]?.key);
    expect(calls[1]?.body).toEqual(calls[0]?.body);
    calls[1]?.resolve(ok(3));
    await tick(0);
    expect(hasUnsent()).toBe(false);
  });

  it("화면이 숨어 있는 동안에는 다시 보내지 않고, 보이면 retryNow로 보낸다", async () => {
    const { send, calls } = fakeSend();
    const saver = new Saver({ date: DATE, mode: "draft", revision: 2, diary: text("a"), step: null, send });
    saver.update(text("ab"), null);
    await tick(SEND_AFTER_MS);
    calls[0]?.resolve(fail(0));
    await tick(0);
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    await tick(RETRY_MS[0]);
    expect(calls).toHaveLength(1);
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
    saver.retryNow();
    await tick(0);
    expect(calls).toHaveLength(2);
    expect(calls[1]?.key).toBe(calls[0]?.key);
  });

  it("401·423에서는 사본과 날아가던 요청을 들고 멈추고, retryNow에 같은 열쇠로", async () => {
    for (const status of [401, 423]) {
      resetSaversForTest();
      localStorage.clear();
      const { send, calls } = fakeSend();
      const saver = new Saver({ date: DATE, mode: "draft", revision: 1, diary: text("a"), step: null, send });
      saver.update(text("ab"), null);
      await tick(SEND_AFTER_MS);
      calls[0]?.resolve(fail(status, status === 401 ? "unauthorized" : "app_locked"));
      await tick(0);
      expect(saver.status().state).toBe("held");
      saver.update(text("abc"), null);
      await tick(RETRY_MS[3]);
      expect(calls).toHaveLength(1);
      expect(readUnsent(DATE)?.diary.eventText).toBe("abc");
      saver.retryNow();
      await tick(0);
      expect(calls[1]?.key).toBe(calls[0]?.key);
      calls[1]?.resolve(ok(2));
      await tick(0);
      expect(calls[2]?.body).toMatchObject({ revision: 2, eventText: "abc" });
    }
  });

  it("다른 곳에서 고쳤으면(409) 덮지 않고 알린다 — '이 휴대폰의 글로 남기기'만 지금 판 위에 새 열쇠로", async () => {
    const { send, calls } = fakeSend();
    const onConflict = vi.fn();
    const saver = new Saver({ date: DATE, mode: "draft", revision: 2, diary: text("a"), step: null, send });
    saver.attach({ onConflict });
    saver.update(text("ab"), null);
    await tick(SEND_AFTER_MS);
    calls[0]?.resolve(fail(409, "revision_conflict", { currentRevision: 7 }));
    await tick(0);
    expect(onConflict).toHaveBeenCalledWith(7);
    expect(saver.status().state).toBe("conflict");
    saver.update(text("abc"), null);
    saver.retryNow();
    await tick(RETRY_MS[3]);
    expect(calls).toHaveLength(1);
    expect(await saver.flush()).toBe(false);
    saver.overwriteFrom(7);
    await tick(0);
    expect(calls[1]?.body).toMatchObject({ revision: 7, eventText: "abc" });
    expect(calls[1]?.key).not.toBe(calls[0]?.key);
  });

  it("아무것도 쓰지 않은 새 글은 만들지 않고 사본도 두지 않는다", async () => {
    const { send, calls } = fakeSend();
    const saver = new Saver({ date: DATE, mode: "draft", revision: null, diary: emptyDiary(), step: null, send });
    saver.update(text("a"), null);
    saver.update(emptyDiary(), { step: "feelings", category: null }, { immediate: true });
    await tick(SEND_AFTER_MS * 2);
    expect(calls).toHaveLength(0);
    expect(readUnsent(DATE)).toBeNull();
    expect(saver.status().state).toBe("idle");
  });

  it("flush는 서버가 다 받으면 true, 끊기면 false", async () => {
    const { send, calls } = fakeSend();
    const saver = new Saver({ date: DATE, mode: "draft", revision: 1, diary: text("a"), step: null, send });
    saver.update(text("ab"), null);
    const first = saver.flush();
    await tick(0);
    calls[0]?.resolve(ok(2));
    expect(await first).toBe(true);
    saver.update(text("abc"), null);
    const second = saver.flush();
    await tick(0);
    calls[1]?.resolve(fail(0));
    expect(await second).toBe(false);
  });

  it("오늘이 아닌 날로 새로 만들려 했으면(422 not_today) 멈추고, 오늘로 옮겨 다시 만든다", async () => {
    const { send, calls } = fakeSend();
    const onNotToday = vi.fn();
    const saver = new Saver({ date: "2026-10-15", mode: "draft", revision: null, diary: emptyDiary(), step: null, send });
    saver.attach({ onNotToday });
    saver.update(text("새벽에 쓴 글"), null);
    await tick(SEND_AFTER_MS);
    calls[0]?.resolve(fail(422, "not_today"));
    await tick(0);
    expect(onNotToday).toHaveBeenCalled();
    expect(saver.status().state).toBe("held");
    saver.retarget(DATE);
    await tick(0);
    expect(calls[1]?.date).toBe(DATE);
    expect(calls[1]?.body.revision).toBeNull();
    expect(readUnsent("2026-10-15")).toBeNull();
    expect(liveSaver(DATE)).toBe(saver);
  });

  it("사본에서 되살린 요청은 같은 열쇠로 먼저 보내고, 뒤의 내용은 그 답의 판 번호로 이어 보낸다", async () => {
    const { send, calls } = fakeSend();
    const pendingBody = { revision: 4, eventText: "ab" } as DiaryInput;
    const saver = new Saver({
      date: DATE,
      mode: "draft",
      revision: 4,
      diary: text("abc"),
      step: null,
      pending: { key: "kept-key-0000000001", body: pendingBody },
      ahead: true,
      send
    });
    saver.retryNow();
    await tick(0);
    expect(calls[0]?.key).toBe("kept-key-0000000001");
    expect(calls[0]?.body).toEqual(pendingBody);
    calls[0]?.resolve(ok(5));
    await tick(0);
    expect(calls[1]?.body).toMatchObject({ revision: 5, eventText: "abc" });
  });

  it("화면을 떼어도(release) 보낼 것이 남았으면 끝까지 보내고 그 뒤에 줄을 닫는다", async () => {
    const { send, calls } = fakeSend();
    const saver = new Saver({ date: DATE, mode: "draft", revision: 1, diary: text("a"), step: null, send });
    saver.update(text("ab"), null);
    saver.release();
    expect(liveSaver(DATE)).toBe(saver);
    await tick(SEND_AFTER_MS);
    calls[0]?.resolve(ok(2));
    await tick(0);
    expect(liveSaver(DATE)).toBeNull();
    expect(readUnsent(DATE)).toBeNull();
  });
});

describe("새 버전 띠(서버의 호환 단계가 앞섬 — PLAN A-14)", () => {
  it("멈춘 동안 보내지 않고 사본만 쓴다 — 풀리면 보낸다", async () => {
    const { send, calls } = fakeSend();
    const saver = new Saver({ date: DATE, mode: "draft", revision: 1, diary: text("a"), step: null, send });
    blockSending(true);
    expect(isSendingBlocked()).toBe(true);
    saver.update(text("ab"), null);
    await tick(SEND_AFTER_MS * 3);
    // 화면이 다시 보이거나 연결이 돌아와도(retryNow) 멈춘 채다
    saver.retryNow();
    await tick(RETRY_MS[3]);
    expect(calls).toHaveLength(0);
    expect(saver.status().state).toBe("held");
    expect(readUnsent(DATE)?.diary.eventText).toBe("ab");
    blockSending(false);
    await tick(0);
    expect(calls).toHaveLength(1);
  });
});

describe("edit 모드(완료한 기록 고치기)", () => {
  it("저절로 보내지 않고 사본만 쓴다 — 저장하기에서 한 번, 받지 않으면(422) 열쇠를 버린다", async () => {
    const { send, calls } = fakeSend();
    const saver = new Saver({ date: DATE, mode: "edit", revision: 6, diary: text("a"), step: null, send });
    saver.update(toggleCategory(text("a"), "joy"), null);
    await tick(SEND_AFTER_MS * 5);
    expect(calls).toHaveLength(0);
    expect(readUnsent(DATE)?.mode).toBe("edit");
    expect(saver.status().state).toBe("editing");
    const first = saver.saveEdit();
    await tick(0);
    calls[0]?.resolve(fail(422, "incomplete", { missing: ["details"] }));
    expect((await first).ok).toBe(false);
    expect(readUnsent(DATE)).not.toBeNull();
    const second = saver.saveEdit();
    await tick(0);
    expect(calls[1]?.key).not.toBe(calls[0]?.key);
    calls[1]?.resolve(ok(7));
    expect((await second).ok).toBe(true);
    expect(readUnsent(DATE)).toBeNull();
  });

  it("연결이 끊겨 저장하기가 닿지 않았으면 다음 저장하기도 같은 열쇠", async () => {
    const { send, calls } = fakeSend();
    const saver = new Saver({ date: DATE, mode: "edit", revision: 6, diary: text("a"), step: null, send });
    saver.update(text("ab"), null);
    const first = saver.saveEdit();
    await tick(0);
    calls[0]?.resolve(fail(0));
    await first;
    const second = saver.saveEdit();
    await tick(0);
    expect(calls[1]?.key).toBe(calls[0]?.key);
    calls[1]?.resolve(ok(7));
    await second;
  });
});

describe("마감 검토 지적(2026-10-16)", () => {
  it("H-1 끊겨 닿지 않은 저장하기 뒤에 더 고쳤으면, 앞 요청을 같은 열쇠로 확인한 다음 새 본문을 새 판 번호로 보낸다", async () => {
    const { send, calls } = fakeSend();
    const saver = new Saver({ date: DATE, mode: "edit", revision: 6, diary: text("a"), step: null, send });
    saver.update(text("ab"), null);
    const first = saver.saveEdit();
    await tick(0);
    calls[0]?.resolve(fail(0));
    await first;
    saver.update(text("abc"), null);
    const second = saver.saveEdit();
    await tick(0);
    expect(calls[1]?.key).toBe(calls[0]?.key);
    expect(calls[1]?.body).toEqual(calls[0]?.body);
    calls[1]?.resolve(ok(7));
    await tick(0);
    expect(calls).toHaveLength(3);
    expect(calls[2]?.body).toMatchObject({ revision: 7, eventText: "abc" });
    expect(calls[2]?.key).not.toBe(calls[0]?.key);
    calls[2]?.resolve(ok(8));
    expect((await second).ok).toBe(true);
    expect(readUnsent(DATE)).toBeNull();
  });

  it("M-1 지운(discard) 뒤에 늦게 온 401·끊김은 사본을 다시 쓰지 않고 다시 보내지도 않는다", async () => {
    for (const late of [fail(401, "unauthorized"), fail(0)]) {
      resetSaversForTest();
      localStorage.clear();
      const { send, calls } = fakeSend();
      const saver = new Saver({ date: DATE, mode: "draft", revision: 1, diary: text("a"), step: null, send });
      saver.update(text("ab"), null);
      await tick(SEND_AFTER_MS);
      saver.discard();
      expect(readUnsent(DATE)).toBeNull();
      calls[0]?.resolve(late);
      await tick(RETRY_MS[3] * 2);
      expect(readUnsent(DATE)).toBeNull();
      expect(calls).toHaveLength(1);
    }
  });

  it("M-2 고치기 모드에서 단계만 옮기면 사본을 쓰지 않는다(고친 것이 없다)", async () => {
    const { send } = fakeSend();
    const saver = new Saver({ date: DATE, mode: "edit", revision: 6, diary: text("a"), step: null, send });
    saver.update(text("a"), { step: "reason", category: null }, { immediate: true, stepOnly: true });
    await tick(COPY_AFTER_MS * 2);
    expect(readUnsent(DATE)).toBeNull();
    expect(saver.unsent).toBe(false);
    expect(saver.step).toEqual({ step: "reason", category: null });
  });

  it("L-6 지우기를 기다리는 동안(quiesce) 연결 복귀·다시 보임이 와도 보내지 않는다", async () => {
    const { send, calls } = fakeSend();
    const saver = new Saver({ date: DATE, mode: "draft", revision: 1, diary: text("a"), step: null, send });
    saver.update(text("ab"), null);
    await saver.quiesce();
    saver.retryNow();
    await tick(SEND_AFTER_MS * 3);
    expect(calls).toHaveLength(0);
    // 지우기가 실패해 되돌리면 다시 보낸다
    saver.thaw();
    await tick(0);
    expect(calls).toHaveLength(1);
  });
});

describe("기기 사본 저장소", () => {
  it("모양이 틀린 사본은 버리고, 지우기·전부 지우기가 된다", () => {
    localStorage.setItem(
      "unsentDiaries",
      JSON.stringify({ "2026-10-15": { v: 1, date: "2026-10-15", mode: "draft" }, bad: { v: 1 }, [DATE]: "x" })
    );
    expect(unsentDates()).toEqual([]);
    writeUnsent({ v: 1, date: DATE, mode: "draft", baseRevision: null, diary: text("a"), step: null, pending: null, savedAt: 1 });
    expect(unsentDates()).toEqual([DATE]);
    clearUnsent();
    expect(localStorage.getItem("unsentDiaries")).toBeNull();
  });

  it("처음 쓸 때 한 번만 저장소를 지우지 않는 칸으로 청한다", () => {
    const persist = vi.fn(async () => true);
    Object.defineProperty(navigator, "storage", { configurable: true, value: { persist } });
    const copy = { v: 1 as const, date: DATE, mode: "draft" as const, baseRevision: null, diary: text("a"), step: null, pending: null, savedAt: 1 };
    writeUnsent(copy);
    writeUnsent(copy);
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("저장소가 막혀 있어도 저장 줄은 그대로 돈다", async () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { send, calls } = fakeSend();
    const saver = new Saver({ date: DATE, mode: "draft", revision: 1, diary: text("a"), step: null, send });
    saver.update(text("ab"), null);
    await tick(SEND_AFTER_MS);
    calls[0]?.resolve(ok(2));
    await tick(0);
    expect(saver.status().state).toBe("saved");
    spy.mockRestore();
  });
});
