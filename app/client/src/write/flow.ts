// 작성 흐름의 순수 상태(TASK-SLICE-01 PLAN §3.1·§3.2). DOM·서버와 떼어 시험한다.
// 단계 목록·'다음'을 막는 것·남기기에 빠진 것·되살릴 단계를 여기서 센다. 저장은 ./saver, 기기 사본은 ./unsent.
// 모든 바꾸기 함수는 새 값을 돌려준다(받은 값은 고치지 않는다) — 사본과 서버 값의 비교가 흔들리지 않게.

import {
  type DiaryEntryView,
  type DiaryInput,
  INTENSITY_MAX,
  INTENSITY_MIN,
  isBlank,
  type MissingStep,
  missingForCompletion,
  REFLECTION_SLOTS,
  type ResumeStep,
  type ResumeView
} from "../../../shared/diary";
import { CATEGORIES, type CategoryEntry, EMOTIONS } from "../../../shared/taxonomy";

/** 지금 화면의 글 전체. 판 번호와 쓰던 단계는 따로 든다. */
export interface WorkingDiary {
  eventText: string;
  reasonText: string;
  /** 고른 계열(고른 순서)과 대표 크기. null = 아직 안 정함 */
  categories: { code: string; intensity: number | null }[];
  /** 고른 세부 감정(고른 순서). own = 따로 정한 크기, null이면 그 계열의 대표 크기를 따른다 */
  emotions: { code: string; category: string; own: number | null }[];
  /** 칭찬·감사 — 늘 세 칸(빈칸은 ''). 서버는 빈칸을 행으로 만들지 않는다 */
  praises: string[];
  gratitudes: string[];
}

/** 단계를 가리키는 열쇠. 주소의 `?step=…&c=…`와 서버의 쓰던 단계(resume)가 같은 모양이다. */
export interface StepKey {
  step: ResumeStep;
  /** details일 때만 계열 코드 */
  category: string | null;
}

export interface Step extends StepKey {
  /** 흐름 안의 순서(0부터) */
  index: number;
  /** details일 때 고른 계열 안에서의 순서(1부터)와 고른 계열 수 — '슬픔 · 1/3' */
  order: number;
  of: number;
}

export const CATEGORY_BY_CODE: ReadonlyMap<string, CategoryEntry> = new Map(CATEGORIES.map((entry) => [entry.code, entry]));

export function categoryLabel(code: string): string {
  return CATEGORY_BY_CODE.get(code)?.label ?? code;
}

export function emotionLabel(code: string): string {
  return EMOTIONS.get(code)?.label ?? code;
}

export function emptyDiary(): WorkingDiary {
  return {
    eventText: "",
    reasonText: "",
    categories: [],
    emotions: [],
    praises: Array.from({ length: REFLECTION_SLOTS }, () => ""),
    gratitudes: Array.from({ length: REFLECTION_SLOTS }, () => "")
  };
}

function slots(list: readonly { slot: number; text: string }[]): string[] {
  const out = Array.from({ length: REFLECTION_SLOTS }, () => "");
  for (const item of list) if (item.slot >= 1 && item.slot <= REFLECTION_SLOTS) out[item.slot - 1] = item.text;
  return out;
}

/** 서버에서 받은 그날 기록 → 화면의 글. 따로 정하지 않은 감정은 own = null(대표 크기를 따른다). */
export function fromEntry(entry: DiaryEntryView): WorkingDiary {
  return {
    eventText: entry.eventText,
    reasonText: entry.reasonText,
    categories: entry.categories.map((item) => ({ code: item.categoryCode, intensity: item.intensity })),
    emotions: entry.emotions.map((item) => ({
      code: item.emotionCode,
      category: item.categoryCode,
      own: item.custom ? item.intensity : null
    })),
    praises: slots(entry.praises),
    gratitudes: slots(entry.gratitudes)
  };
}

export function resumeKey(view: ResumeView | null | undefined): StepKey | null {
  return view ? { step: view.step, category: view.step === "details" ? view.categoryCode : null } : null;
}

/** 저장 요청의 본문(PUT /api/diaries/:date). 칭찬·감사는 칸 번호와 함께 모두 보낸다 — 빈칸은 서버가 버린다. */
export function toInput(diary: WorkingDiary, revision: number | null, key: StepKey | null): DiaryInput {
  return {
    revision,
    eventText: diary.eventText,
    reasonText: diary.reasonText,
    categories: diary.categories.map((item) => ({ categoryCode: item.code, intensity: item.intensity })),
    emotions: diary.emotions.map((item) => ({ emotionCode: item.code, intensity: item.own })),
    praises: diary.praises.map((text, index) => ({ slot: index + 1, text })),
    gratitudes: diary.gratitudes.map((text, index) => ({ slot: index + 1, text })),
    resume: key ? { step: key.step, categoryCode: key.step === "details" ? key.category : null } : null
  };
}

// ── 단계 ─────────────────────────────────────────────────────────

/** 흐름의 단계 목록 — 7 + 고른 계열 수(UX_SPEC §4 '진행 표시와 이동'). */
export function steps(diary: WorkingDiary): Step[] {
  const keys: StepKey[] = [
    { step: "event", category: null },
    { step: "feelings", category: null },
    ...diary.categories.map((item) => ({ step: "details" as const, category: item.code })),
    { step: "intensity", category: null },
    { step: "reason", category: null },
    { step: "praise", category: null },
    { step: "gratitude", category: null },
    { step: "letter", category: null }
  ];
  const of = diary.categories.length;
  return keys.map((key, index) => ({ ...key, index, order: key.step === "details" ? index - 1 : 0, of: key.step === "details" ? of : 0 }));
}

export function sameKey(a: StepKey | null | undefined, b: StepKey | null | undefined): boolean {
  return Boolean(a && b && a.step === b.step && (a.step !== "details" || a.category === b.category));
}

/** 이 열쇠가 지금 글의 몇 번째 단계인가. 고르지 않은 계열의 세부 감정처럼 지금 없는 단계면 -1. */
export function indexOf(diary: WorkingDiary, key: StepKey | null | undefined): number {
  if (!key) return -1;
  return steps(diary).findIndex((step) => sameKey(step, key));
}

/** 되살릴 단계: 후보(주소의 단계, 서버의 쓰던 단계 …) 가운데 지금 글에 있는 첫 단계, 없으면 첫 단계. */
export function resumeIndex(diary: WorkingDiary, candidates: readonly (StepKey | null | undefined)[]): number {
  for (const candidate of candidates) {
    const index = indexOf(diary, candidate);
    if (index >= 0) return index;
  }
  return 0;
}

const STEP_NAMES: Record<ResumeStep, string> = {
  event: "있었던 일",
  feelings: "마음 고르기",
  details: "세부 감정",
  intensity: "크기",
  reason: "이유",
  praise: "칭찬",
  gratitude: "감사",
  letter: "편지"
};

/** 오늘 화면의 '어디까지 썼는지' 칩에 쓰는 단계 이름. */
export function stepName(key: StepKey | null | undefined): string {
  if (!key) return STEP_NAMES.event;
  return key.step === "details" && key.category ? `${categoryLabel(key.category)} 세부 감정` : STEP_NAMES[key.step];
}

/** 주소의 query → 단계 열쇠. 모양이 틀리면 null. */
export function parseStepQuery(query: URLSearchParams): StepKey | null {
  const step = query.get("step");
  if (!step || !(step in STEP_NAMES)) return null;
  if (step === "details") {
    const category = query.get("c");
    return category && CATEGORY_BY_CODE.has(category) ? { step, category } : null;
  }
  return { step: step as ResumeStep, category: null };
}

export function stepQuery(key: StepKey): string {
  return key.step === "details" && key.category ? `step=details&c=${encodeURIComponent(key.category)}` : `step=${key.step}`;
}

// ── 막힘과 빠진 것 ───────────────────────────────────────────────

export type Blocked = "event_empty" | "no_category" | "no_detail" | "intensity_unset";

/** '다음'을 막는 안내(빨간 오류가 아니다 — D-098 ③). 크기는 시트로 알린다(D-079 ①). */
export const BLOCKED_TEXT: Record<Blocked, string> = {
  event_empty: "한 줄만 적어도 충분해요.",
  no_category: "가까운 마음을 하나 고르면 다음으로 갈 수 있어요.",
  no_detail: "가까운 말을 하나 고르면 다음으로 갈 수 있어요.",
  intensity_unset: "크기를 정하지 않은 마음이 있어요."
};

/** 비었는가 — 서버·창고와 같은 공백 집합으로 센다(app/shared/diary.ts isBlank). */
const isBlankText = isBlank;

/** 대표 크기를 아직 정하지 않은 계열(고른 순서). */
export function unsetCategories(diary: WorkingDiary): string[] {
  return diary.categories.filter((item) => item.intensity === null).map((item) => item.code);
}

/** 이 단계에서 '다음'을 막는 까닭. 이유·칭찬·감사·편지는 막지 않는다(이유는 남길 때 확인 — PLAN A-6). */
export function blocked(diary: WorkingDiary, key: StepKey): Blocked | null {
  if (key.step === "event") return isBlankText(diary.eventText) ? "event_empty" : null;
  if (key.step === "feelings") return diary.categories.length === 0 ? "no_category" : null;
  if (key.step === "details") return diary.emotions.some((item) => item.category === key.category) ? null : "no_detail";
  if (key.step === "intensity") return unsetCategories(diary).length ? "intensity_unset" : null;
  return null;
}

/** 남기기에 빠진 단계(흐름 순서). 서버의 완료 조건과 같은 함수를 쓴다(app/shared/diary.ts). */
export function missing(diary: WorkingDiary): MissingStep[] {
  return missingForCompletion({
    eventText: diary.eventText,
    reasonText: diary.reasonText,
    categories: diary.categories,
    emotions: diary.emotions.map((item) => ({
      category: item.category,
      intensity: item.own ?? diary.categories.find((category) => category.code === item.category)?.intensity ?? null
    }))
  });
}

export const MISSING_TEXT: Record<MissingStep, string> = {
  event: "있었던 일",
  feelings: "마음",
  details: "세부 감정",
  intensity: "크기",
  reason: "이유"
};

/** '채우러 가기'가 데려갈 단계: 첫 번째로 빠진 곳. 세부 감정이면 감정을 하나도 고르지 않은 첫 계열. */
export function firstMissingKey(diary: WorkingDiary): StepKey | null {
  const first = missing(diary)[0];
  if (!first) return null;
  if (first === "details") {
    const code = diary.categories.find((category) => !diary.emotions.some((item) => item.category === category.code))?.code;
    return { step: "details", category: code ?? null };
  }
  return { step: first, category: null };
}

// ── 바꾸기 ──────────────────────────────────────────────────────

export function isIntensityValue(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= INTENSITY_MIN && (value as number) <= INTENSITY_MAX;
}

export function withText(diary: WorkingDiary, field: "eventText" | "reasonText", value: string): WorkingDiary {
  return { ...diary, [field]: value };
}

export function withReflection(diary: WorkingDiary, kind: "praises" | "gratitudes", slot: number, value: string): WorkingDiary {
  const list = diary[kind].slice();
  list[slot] = value;
  return { ...diary, [kind]: list };
}

/** 계열을 켜거나 끈다. 끄면 그 계열의 세부 감정도 함께 빠진다. */
export function toggleCategory(diary: WorkingDiary, code: string): WorkingDiary {
  if (diary.categories.some((item) => item.code === code)) return removeCategory(diary, code);
  if (!CATEGORY_BY_CODE.has(code)) return diary;
  return { ...diary, categories: [...diary.categories, { code, intensity: null }] };
}

export function removeCategory(diary: WorkingDiary, code: string): WorkingDiary {
  return {
    ...diary,
    categories: diary.categories.filter((item) => item.code !== code),
    emotions: diary.emotions.filter((item) => item.category !== code)
  };
}

export function toggleEmotion(diary: WorkingDiary, code: string): WorkingDiary {
  if (diary.emotions.some((item) => item.code === code)) {
    return { ...diary, emotions: diary.emotions.filter((item) => item.code !== code) };
  }
  const info = EMOTIONS.get(code);
  if (!info || !diary.categories.some((item) => item.code === info.category)) return diary;
  return { ...diary, emotions: [...diary.emotions, { code, category: info.category, own: null }] };
}

export function setCategoryIntensity(diary: WorkingDiary, code: string, value: number | null): WorkingDiary {
  if (value !== null && !isIntensityValue(value)) return diary;
  return { ...diary, categories: diary.categories.map((item) => (item.code === code ? { ...item, intensity: value } : item)) };
}

/** 세부 감정의 크기를 따로 정한다. null이면 대표 크기를 따른다('대표 크기와 같게'). */
export function setEmotionIntensity(diary: WorkingDiary, code: string, value: number | null): WorkingDiary {
  if (value !== null && !isIntensityValue(value)) return diary;
  return { ...diary, emotions: diary.emotions.map((item) => (item.code === code ? { ...item, own: value } : item)) };
}

export function effectiveIntensity(diary: WorkingDiary, emotionCode: string): number | null {
  const item = diary.emotions.find((emotion) => emotion.code === emotionCode);
  if (!item) return null;
  return item.own ?? diary.categories.find((category) => category.code === item.category)?.intensity ?? null;
}

// ── 비교 ──────────────────────────────────────────────────────

export type Section = "event" | "feelings" | "reason" | "praise" | "gratitude";

export const SECTION_TEXT: Record<Section, string> = {
  event: "있었던 일",
  feelings: "마음과 크기",
  reason: "이유",
  praise: "칭찬",
  gratitude: "감사"
};

const trimSlots = (list: readonly string[]) => list.map((text) => (isBlankText(text) ? "" : text));

/** 두 글이 다른 부분(충돌 시트가 한 줄씩 보인다 — PLAN A-13). 칭찬·감사의 빈칸끼리는 같다. */
export function differentSections(a: WorkingDiary, b: WorkingDiary): Section[] {
  const out: Section[] = [];
  if (a.eventText !== b.eventText) out.push("event");
  if (JSON.stringify([a.categories, a.emotions]) !== JSON.stringify([b.categories, b.emotions])) out.push("feelings");
  if (a.reasonText !== b.reasonText) out.push("reason");
  if (JSON.stringify(trimSlots(a.praises)) !== JSON.stringify(trimSlots(b.praises))) out.push("praise");
  if (JSON.stringify(trimSlots(a.gratitudes)) !== JSON.stringify(trimSlots(b.gratitudes))) out.push("gratitude");
  return out;
}

/** 아직 아무것도 쓰지 않았는가 — 첫 입력 전에는 서버에 만들지 않는다(PLAN A-11). */
export function isUntouched(diary: WorkingDiary): boolean {
  return differentSections(diary, emptyDiary()).length === 0;
}
