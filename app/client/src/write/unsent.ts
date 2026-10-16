// 서버로 아직 보내지 못한 글의 기기 사본(TASK-SLICE-01 사용자 결정 U-2, PLAN §3.4).
// 화면의 글이 서버보다 앞서는 동안만 localStorage의 열쇠 하나에 날짜별로 두고, 그 순번까지 서버가 받았다고 답하면 지운다.
// 연결 끊김·로그인 풀림(401)·잠김(423)·새 버전 띠에서는 지우지 않는다 — 바로 그때 쓰려고 두는 것이다.
// 쓰던 글 지우기·고친 내용 버리기·로그아웃에는 지운다(모든 기록 지우기는 data-control이 clearUnsent를 부른다).
// 저장소가 막혀 있으면(비공개 창 등) 조용히 사본 없이 동작한다 — storage.ts의 try/catch.

import { type DiaryInput, isIsoDate, isRevision } from "../../../shared/diary";
import { KEYS, readStored, removeStored, writeStored } from "../lib/storage";
import type { StepKey, WorkingDiary } from "./flow";

export type FlowMode = "draft" | "edit";

export interface UnsentCopy {
  v: 1;
  date: string;
  mode: FlowMode;
  /** 이 글이 출발한 서버 판 번호(아직 만들지 않은 새 글이면 null) */
  baseRevision: number | null;
  diary: WorkingDiary;
  step: StepKey | null;
  /** 보냈지만 답을 받지 못한 요청 — 같은 영수증 열쇠·같은 본문으로 다시 보낸다(이미 반영됐으면 서버가 같은 답을 돌려준다) */
  pending: { key: string; body: DiaryInput } | null;
  /** 마지막으로 쓴 시각(ms) */
  savedAt: number;
}

type Store = Record<string, UnsentCopy>;

function isStringArray(value: unknown, length: number): value is string[] {
  return Array.isArray(value) && value.length === length && value.every((item) => typeof item === "string");
}

function isDiary(value: unknown): value is WorkingDiary {
  if (typeof value !== "object" || value === null) return false;
  const diary = value as Partial<WorkingDiary>;
  return (
    typeof diary.eventText === "string" &&
    typeof diary.reasonText === "string" &&
    Array.isArray(diary.categories) &&
    Array.isArray(diary.emotions) &&
    isStringArray(diary.praises, 3) &&
    isStringArray(diary.gratitudes, 3)
  );
}

/** 저장소에서 읽은 값을 믿지 않는다 — 모양이 틀린 사본은 버린다(다음 판의 화면이 남긴 것일 수도 있다). */
function isCopy(value: unknown, date: string): value is UnsentCopy {
  if (typeof value !== "object" || value === null) return false;
  const copy = value as Partial<UnsentCopy>;
  return (
    copy.v === 1 &&
    copy.date === date &&
    isIsoDate(copy.date) &&
    (copy.mode === "draft" || copy.mode === "edit") &&
    (copy.baseRevision === null || isRevision(copy.baseRevision)) &&
    isDiary(copy.diary) &&
    typeof copy.savedAt === "number" &&
    (copy.pending === null || (typeof copy.pending === "object" && typeof copy.pending?.key === "string"))
  );
}

function readStore(): Store {
  const raw = readStored("local", KEYS.unsentDiaries);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const store: Store = {};
    for (const [date, copy] of Object.entries(parsed)) if (isCopy(copy, date)) store[date] = copy;
    return store;
  } catch {
    return {};
  }
}

function writeStore(store: Store): void {
  if (Object.keys(store).length === 0) removeStored("local", KEYS.unsentDiaries);
  else writeStored("local", KEYS.unsentDiaries, JSON.stringify(store));
}

export function readUnsent(date: string): UnsentCopy | null {
  return readStore()[date] ?? null;
}

/** 못 보낸 글이 있는 날짜들(오래된 것부터). */
export function unsentDates(): string[] {
  return Object.keys(readStore()).sort();
}

export function hasUnsent(): boolean {
  return unsentDates().length > 0;
}

let persistAsked = false;

/** 홈 화면 웹 앱이면 WebKit이 저장소를 '지우지 않는 칸'으로 허락할 수 있다(WebKit 블로그 14403). 거절돼도 동작은 같다. */
function askPersist(): void {
  if (persistAsked) return;
  persistAsked = true;
  try {
    void navigator.storage?.persist?.().catch(() => undefined);
  } catch {
    // 기능이 없는 브라우저
  }
}

export function writeUnsent(copy: UnsentCopy): void {
  const store = readStore();
  store[copy.date] = copy;
  writeStore(store);
  askPersist();
}

export function removeUnsent(date: string): void {
  const store = readStore();
  if (!(date in store)) return;
  delete store[date];
  writeStore(store);
}

/** 로그아웃·모든 기록 지우기 때 전부 지운다. */
export function clearUnsent(): void {
  removeStored("local", KEYS.unsentDiaries);
}

/** 시험에서 persist 청을 다시 보게 한다. */
export function resetUnsentForTest(): void {
  persistAsked = false;
}
