// 쓰던 글 하나를 여는 일(TASK-SLICE-01 PLAN §3.3 '새로 열림'·A-12·A-13). 서버 기록과 기기 사본(U-2) 가운데 무엇으로 되살릴지 정하고
// 저장 줄(./saver)을 붙인다. 화면(views/write.ts)은 단계를 옮길 때마다 다시 그려지므로, 흐름의 상태는 여기 날짜별로 둔다.
// 화면이 통째로 새로 열리면 이 기억은 사라진다 — 그때는 서버 기록과 기기 사본에서 다시 세운다(RK-034).

import type { DiaryEntryView, DiaryStatus, TodayInfo } from "../../../shared/diary";
import type { ApiFail } from "../lib/api";
import { fetchDiary, fetchToday } from "./api";
import { differentSections, emptyDiary, fromEntry, resumeKey, type Section, type StepKey, toInput, type WorkingDiary } from "./flow";
import { liveSaver, Saver } from "./saver";
import { type FlowMode, readUnsent, removeUnsent, type UnsentCopy, unsentDates } from "./unsent";

export interface Conflict {
  /** 서버의 지금 글(다른 곳에서 지웠으면 null) */
  server: WorkingDiary | null;
  serverEntry: DiaryEntryView | null;
  currentRevision: number | null;
  sections: Section[];
  /** 서버의 지금 글을 읽지 못했다(끊김·5xx·401·423) — 지운 것으로 보지 않고 다시 불러오게 한다(PR #40 리뷰) */
  unavailable: boolean;
}

export interface FlowSession {
  id: string;
  date: string;
  /** 서버가 센 오늘(이 글을 연 때) */
  today: string;
  mode: FlowMode;
  /** 서버 기록의 상태(아직 없는 새 글이면 null) */
  status: DiaryStatus | null;
  saver: Saver;
  /** 서버에서 받은 쓰던 단계(되살릴 때 주소 다음 후보) */
  serverStep: StepKey | null;
  /** 고치기 모드에서 실제로 고쳤는가(× 때 한 번 묻는다) */
  touched: boolean;
  /** 덮지 않고 사용자에게 물어야 하는 어긋남 */
  conflict: Conflict | null;
  /** 기기 사본에서 되살렸다 — 화면에 한 번 알린다 */
  restored: boolean;
}

export type OpenResult =
  | { kind: "ready"; session: FlowSession }
  /** 기록이 없고 오늘도 아니다 — 새 기록은 그날만 쓴다(D-082) */
  | { kind: "not_found"; today: string }
  | { kind: "error"; failure: ApiFail };

const sessions = new Map<string, FlowSession>();

export function currentSession(date: string): FlowSession | null {
  return sessions.get(date) ?? null;
}

/** 흐름을 떠난 뒤 세션을 닫는다. 저장 줄은 보낼 것이 남았으면 끝까지 산다(saver.release). */
export function closeSession(date: string): void {
  const session = sessions.get(date);
  if (!session) return;
  session.saver.release();
  sessions.delete(date);
}

/** 로그아웃·지우기 뒤: 이 날짜의 세션·저장 줄·사본을 모두 버린다. */
export function dropSession(date: string): void {
  const session = sessions.get(date);
  (session?.saver ?? liveSaver(date))?.discard();
  sessions.delete(date);
  removeUnsent(date);
}

export function dropAllSessions(): void {
  for (const date of [...sessions.keys()]) dropSession(date);
}

/** 시험에서 비운다. */
export function resetSessionsForTest(): void {
  sessions.clear();
}

let flowCounter = 0;
function newFlowId(): string {
  flowCounter += 1;
  return `f${Date.now().toString(36)}${flowCounter}`;
}

function conflictOf(mine: WorkingDiary, entry: DiaryEntryView | null): Conflict {
  const server = entry ? fromEntry(entry) : null;
  return {
    server,
    serverEntry: entry,
    currentRevision: entry?.revision ?? null,
    sections: differentSections(mine, server ?? emptyDiary()),
    unavailable: false
  };
}

/**
 * 사본과 서버 기록으로 무엇을 되살릴지(PLAN §3.4):
 * - 사본이 없으면 서버 기록(없으면 빈 새 글).
 * - 사본의 출발 판 = 서버 판 → 사본(날아가던 요청이 있으면 같은 열쇠로 다시 보낸다).
 * - 서버 판 = 출발 판 + 1이고 날아가던 요청이 있다 → 그 요청이 반영됐을 수 있다 → 같은 열쇠로 다시 보내 확인(영수증이 같은 답을 준다).
 * - 그 밖(다른 곳에서 고침·지움) → 덮지 않고 충돌로 묻는다.
 */
function restore(entry: DiaryEntryView | null, copy: UnsentCopy | null) {
  const serverDiary = entry ? fromEntry(entry) : emptyDiary();
  const serverRevision = entry?.revision ?? null;
  const mode: FlowMode = entry?.status === "completed" ? "edit" : "draft";
  if (!copy) {
    return { mode, diary: serverDiary, revision: serverRevision, step: resumeKey(entry?.resume), pending: null, ahead: false, conflict: null };
  }
  const base = copy.baseRevision;
  // 날아가던 요청이 반영됐을 수 있다(첫 만들기면 출발 판 없음 → 서버 판 1) — 같은 열쇠로 다시 보내 영수증으로 확인한다(마감 검토 M-4)
  const replayable = copy.pending !== null && serverRevision !== null && serverRevision === (base ?? 0) + 1;
  const sameBase = base === serverRevision;
  // 모드가 다르면(이 휴대폰에서 임시저장을 쓰는 사이 다른 곳에서 완료했다 등) 덮지 않고 묻는다
  if (copy.mode === mode && (sameBase || replayable)) {
    const latest = JSON.stringify(toInput(copy.diary, copy.pending?.body.revision ?? base, copy.step));
    return {
      mode,
      diary: copy.diary,
      revision: base,
      step: copy.step,
      pending: copy.pending,
      ahead: copy.pending ? latest !== JSON.stringify(copy.pending.body) : true,
      conflict: null
    };
  }
  return { mode, diary: copy.diary, revision: base, step: copy.step, pending: null, ahead: true, conflict: conflictOf(copy.diary, entry) };
}

/** 이 날짜의 글을 연다. 이미 열려 있으면(같은 화면 안에서 단계를 옮김) 그대로. */
export async function openSession(date: string): Promise<OpenResult> {
  const open = sessions.get(date);
  if (open) return { kind: "ready", session: open };

  const [entryResult, todayResult] = await Promise.all([fetchDiary(date), fetchToday()]);
  const copy = readUnsent(date);
  let entry: DiaryEntryView | null = null;
  if (entryResult.ok) entry = entryResult.data;
  else if (entryResult.status !== 404) {
    // 서버에 닿지 못했다: 사본이 있으면 사본으로 이어 쓰고(보내기는 저장 줄이 다시 시도한다), 없으면 오류
    if (!copy || !(entryResult.offline || entryResult.status >= 500)) return { kind: "error", failure: entryResult };
  }
  const today = todayResult.ok ? todayResult.data.date : date;
  if (!entryResult.ok && entryResult.status === 404 && !copy && todayResult.ok && date !== today) {
    return { kind: "not_found", today };
  }
  if (!todayResult.ok && !copy && !entry) return { kind: "error", failure: todayResult };

  const live = liveSaver(date);
  const picked = live
    ? { mode: live.mode, diary: live.diary, revision: live.revision, step: live.step, pending: null, ahead: false, conflict: null }
    : entryResult.ok || entryResult.status === 404
      ? restore(entry, copy)
      : // 서버에 닿지 못해 사본만으로 연다 — 출발 판은 사본의 것
        {
          mode: copy?.mode ?? "draft",
          diary: copy?.diary ?? emptyDiary(),
          revision: copy?.baseRevision ?? null,
          step: copy?.step ?? null,
          pending: copy?.pending ?? null,
          ahead: true,
          conflict: null
        };
  const saver =
    live ??
    new Saver({
      date,
      mode: picked.mode,
      revision: picked.revision,
      diary: picked.diary,
      step: picked.step,
      pending: picked.pending,
      ahead: Boolean(copy) && picked.ahead
    });
  const session: FlowSession = {
    id: newFlowId(),
    date,
    today,
    mode: picked.mode,
    status: entry?.status ?? null,
    saver,
    serverStep: resumeKey(entry?.resume),
    touched: picked.mode === "edit" && Boolean(copy),
    conflict: picked.conflict,
    // 살아 있는 저장 줄(화면을 떠났다 다시 연 것)은 되살린 것이 아니다
    restored: !live && Boolean(copy) && !picked.conflict
  };
  sessions.set(date, session);
  if (live?.status().state === "conflict") {
    // 화면을 떠난 사이 다른 곳의 고침(409)을 받았다 — 다시 열면 묻는다(마감 검토 M-3)
    await loadConflict(session, live.revision);
  } else if (picked.conflict) saver.markConflict();
  else if (copy) saver.retryNow();
  return { kind: "ready", session };
}

/** 저장 중에 다른 곳의 고침·지움을 알았다 — 서버의 지금 글을 받아 충돌을 채운다. */
export async function loadConflict(session: FlowSession, currentRevision: number | null): Promise<Conflict> {
  const result = await fetchDiary(session.date);
  // 지운 것은 404로 확인됐을 때만이다. 다른 실패는 '읽지 못함'으로 두고 사본을 지킨다(PR #40 리뷰)
  const conflict: Conflict =
    result.ok || result.status === 404
      ? conflictOf(session.saver.diary, result.ok ? result.data : null)
      : { server: null, serverEntry: null, currentRevision, sections: [], unavailable: true };
  session.conflict = conflict;
  return conflict;
}

/** 충돌에서 '다른 곳의 글로 바꾸기': 이 휴대폰의 글(사본)을 버리고 서버 글로 다시 연다. */
export function takeServer(session: FlowSession): FlowSession | null {
  const entry = session.conflict?.serverEntry ?? null;
  session.saver.discard();
  sessions.delete(session.date);
  if (!entry) return null;
  const mode: FlowMode = entry.status === "completed" ? "edit" : "draft";
  const saver = new Saver({ date: session.date, mode, revision: entry.revision, diary: fromEntry(entry), step: resumeKey(entry.resume) });
  const next: FlowSession = {
    ...session,
    mode,
    status: entry.status,
    saver,
    serverStep: resumeKey(entry.resume),
    touched: false,
    conflict: null,
    restored: false
  };
  sessions.set(session.date, next);
  return next;
}

/** 충돌에서 '이 휴대폰의 글로 남기기'. */
export function keepMine(session: FlowSession): void {
  const revision = session.conflict?.currentRevision ?? null;
  session.conflict = null;
  session.saver.overwriteFrom(revision);
}

/** 오늘 화면이 켜질 때: 화면에 열려 있지 않은 날짜의 못 보낸 사본을 조용히 보낸다. 어긋난 것은 그 글을 열 때 묻는다. */
export async function sendUnsentInBackground(): Promise<void> {
  for (const date of unsentDates()) {
    if (sessions.has(date) || liveSaver(date)) continue;
    const copy = readUnsent(date);
    if (!copy) continue;
    const result = await fetchDiary(date);
    if (!result.ok && result.status !== 404) return; // 닿지 못하면 다음 기회에
    // 기다리는 사이 사용자가 그 글을 열었으면 저장 줄을 둘 만들지 않는다(마감 검토 L-3)
    if (sessions.has(date) || liveSaver(date)) continue;
    const picked = restore(result.ok ? result.data : null, copy);
    if (picked.conflict) continue;
    const saver = new Saver({
      date,
      mode: picked.mode,
      revision: picked.revision,
      diary: picked.diary,
      step: picked.step,
      pending: picked.pending,
      ahead: picked.ahead
    });
    if (picked.mode === "draft") {
      saver.retryNow();
      saver.release();
    } else {
      // 고치던 내용은 사용자가 '저장하기'를 눌러야 보낸다 — 그대로 둔다
      saver.release();
    }
  }
}

/** 오늘 화면이 보일 상태에 쓰는 사본: 오늘 날짜의 못 보낸 글과, 오늘보다 앞선 날짜의 못 보낸 글 가운데 가장 최근 것. */
export function unsentForToday(info: TodayInfo): { today: UnsentCopy | null; past: UnsentCopy | null } {
  const today = readUnsent(info.date);
  const pastDate = unsentDates()
    .filter((date) => date < info.date)
    .pop();
  return { today, past: pastDate ? readUnsent(pastDate) : null };
}
