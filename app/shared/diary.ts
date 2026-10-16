// 일기 저장의 공용 계약(DATA_MODEL §2·§3.1~§3.3·§3.7, ARCHITECTURE §5·§11.9, TASK-DATA-01 PLAN §2).
// 서버가 정본 검사를 하고 화면은 같은 함수로 미리 본다. 길이·범위 상수는 SQL CHECK(app/migrations/0006_diaries.sql)와 같은 값이다.
import { DAY_MS } from "./api";
import { CATEGORY_CODES, EMOTIONS, isCategoryCode } from "./taxonomy";

/** 사건·이유 칸 최대 글자 수(코드 포인트 — D1 length()와 같은 셈). 2026-10-15 사용자 결정 U-1. */
export const EVENT_MAX_CHARS = 10_000;
export const REASON_MAX_CHARS = 10_000;
/** 칭찬·감사 한 칸 최대 글자 수와 칸 수. */
export const REFLECTION_MAX_CHARS = 2_000;
export const REFLECTION_SLOTS = 3;
/** 한 기록에서 고를 수 있는 세부 감정 수. */
export const EMOTIONS_MAX = 100;
export const INTENSITY_MIN = 1;
export const INTENSITY_MAX = 10;
/** 하루 기준 시각(D-081): 이 시각 전은 전날로 센다. 0~6시, 기본 4시. */
export const DAY_START_DEFAULT = 4;
export const DAY_START_MAX = 6;
export const TIMEZONE_MAX_CHARS = 64;

/**
 * 일기 저장 경로의 본문 한도(바이트). 화면은 JSON.stringify로 보내므로 한 글자가 최대 4바이트(UTF-8 — 따옴표·줄바꿈의 이스케이프도 2바이트)다.
 * 글 칸 최대 글자 수의 4배에 감정·쓰던 단계 같은 구조 여유 32KB를 더한다. `\u` 이스케이프로 부풀린 본문은 413이다(ARCHITECTURE §11.9).
 */
export const DIARY_MAX_BODY_BYTES =
  4 * (EVENT_MAX_CHARS + REASON_MAX_CHARS + 2 * REFLECTION_SLOTS * REFLECTION_MAX_CHARS) + 32 * 1024;

/** 같은 요청의 재전송을 한 번만 반영하는 영수증의 보관 시간(DATA_MODEL §3.7). */
export const IDEMPOTENCY_TTL_MS = DAY_MS;

/** 작성 흐름의 단계(UX_SPEC §4 1~8). 화면이 통째로 새로 열려도 서버 기록만으로 그 단계를 다시 연다(RK-043). */
export const RESUME_STEPS = ["event", "feelings", "details", "intensity", "reason", "praise", "gratitude", "letter"] as const;
export type ResumeStep = (typeof RESUME_STEPS)[number];
/** 완료하려면 채워야 하는 단계(UX_SPEC §6 '남기려면 이것이 필요해요'). 순서는 흐름 순서다. */
export type MissingStep = "event" | "feelings" | "details" | "intensity" | "reason";

/**
 * 공백으로 보는 코드 포인트 — ECMAScript 정규식 `\s`와 같은 집합(WhiteSpace·LineTerminator: Unicode Zs와 탭·줄바꿈·FEFF).
 * SQLite `trim()`은 기본으로 빈칸(0x20)만 지우므로, 창고의 '비어 있지 않음' 검사는 이 목록으로 만든 `trim(x, char(…))`를 쓴다(BLANK_CHARS_SQL).
 */
export const WHITESPACE_CODE_POINTS: readonly number[] = [
  9, 10, 11, 12, 13, 32, 160, 5760, 8192, 8193, 8194, 8195, 8196, 8197, 8198, 8199, 8200, 8201, 8202, 8232, 8233, 8239, 8287, 12288,
  65279
];
const WHITESPACE = new Set(WHITESPACE_CODE_POINTS);

/** SQL에서 공백 판정에 쓰는 `char(…)` 식. 마이그레이션 0006의 CHECK·trigger에 같은 글자가 그대로 있다(시험이 대조한다). */
export const BLANK_CHARS_SQL = `char(${WHITESPACE_CODE_POINTS.join(", ")})`;

export function isBlank(text: string): boolean {
  for (const char of text) if (!WHITESPACE.has(char.codePointAt(0) ?? 0)) return false;
  return true;
}

export type TextProblem = "too_long" | "bad_char";

/**
 * 사용자 글을 검사한다(DATA_MODEL §2). 줄바꿈·탭 말고 제어 문자와 짝 없는 대리 문자(깨진 UTF-16 — 저장하면 글자가 망가진다)는 받지 않는다.
 * 화면은 보내기 전에 CRLF를 LF로 바꾼다(textarea의 값은 이미 LF다). 글을 고치지 않고 그대로 저장한다.
 */
export function textProblem(text: string, maxChars: number): TextProblem | null {
  let count = 0;
  for (const char of text) {
    count += 1;
    if (count > maxChars) return "too_long";
    const code = char.codePointAt(0) ?? 0;
    if (code >= 0xd800 && code <= 0xdfff) return "bad_char";
    if ((code < 0x20 && code !== 0x0a && code !== 0x09) || (code >= 0x7f && code <= 0x9f)) return "bad_char";
  }
  return null;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** 달력에 있는 날짜(YYYY-MM-DD)인가. 2월 30일·13월은 아니다. 1000년 전은 받지 않는다(Date.UTC의 0~99년 해석을 피한다). */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const time = new Date(Date.UTC(year, month - 1, day));
  return year >= 1000 && time.getUTCFullYear() === year && time.getUTCMonth() === month - 1 && time.getUTCDate() === day;
}

/** YYYY-MM-DD에 날 수를 더한다(달력 날짜 — 시간대와 상관없다). */
export function addDays(isoDate: string, days: number): string {
  const [year = 0, month = 1, day = 1] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

const TIMEZONE_NAME = /^[A-Za-z][A-Za-z0-9_+-]*(?:\/[A-Za-z0-9_+-]+){0,3}$/;

/**
 * 휴대폰이 보낸 시간대(IANA 이름, 예: `Asia/Seoul`)를 검사해 정리된 이름을 돌려준다. 모르는 이름·`+09:00` 같은 오프셋은 null.
 * '오늘'은 요청마다 이 시간대와 owner의 하루 기준 시각으로 센다(2026-10-15 사용자 결정 U-2 — 지금 있는 곳의 시계).
 */
export function canonicalTimeZone(value: unknown): string | null {
  if (typeof value !== "string" || value.length > TIMEZONE_MAX_CHARS || !TIMEZONE_NAME.test(value)) return null;
  try {
    const resolved = new Intl.DateTimeFormat("en-US", { timeZone: value }).resolvedOptions().timeZone;
    return resolved.length <= TIMEZONE_MAX_CHARS ? resolved : null;
  } catch {
    return null;
  }
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23"
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/**
 * 그 순간의 '일기 날짜'(DATA_MODEL §2, D-081): 그 시간대의 현지 시각이 하루 기준 시각 전이면 전날, 아니면 그날.
 * 새 기록 만들기·최초 완료일·오늘 화면이 모두 이 계산을 쓴다. 기준 시각을 바꿔도 이미 저장된 날짜는 다시 세지 않는다.
 */
export function localDayAt(ms: number, timeZone: string, dayStartHour: number): string {
  const parts: Record<string, string> = {};
  for (const part of formatterFor(timeZone).formatToParts(new Date(ms))) parts[part.type] = part.value;
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  return Number(parts.hour) < dayStartHour ? addDays(date, -1) : date;
}

export function isDayStartHour(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= DAY_START_MAX;
}

export function isIntensity(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= INTENSITY_MIN && (value as number) <= INTENSITY_MAX;
}

export function isRevision(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 1;
}

// ── 저장 요청(PUT /api/diaries/:date)의 모양 ──────────────────────────────

export interface CategoryInput {
  categoryCode: string;
  /** 대표 크기. null = 아직 안 정함(임시저장에서만) */
  intensity?: number | null;
}

export interface EmotionInput {
  emotionCode: string;
  /** 따로 정한 크기. 없거나 null이면 그 계열의 대표 크기를 따른다(UX_SPEC §4 4단계, D-059) */
  intensity?: number | null;
}

export interface ReflectionInput {
  slot: number;
  text: string;
}

export interface ResumeInput {
  step: ResumeStep;
  /** 세부 감정 단계일 때 어느 계열 화면인지 */
  categoryCode?: string | null;
}

export interface DiaryInput {
  /** 지금 판 번호. 새로 만들 때는 없다 */
  revision?: number | null;
  eventText: string;
  reasonText: string;
  /** 고른 계열(고른 순서) */
  categories: CategoryInput[];
  /** 고른 세부 감정(고른 순서) */
  emotions: EmotionInput[];
  praises: ReflectionInput[];
  gratitudes: ReflectionInput[];
  resume?: ResumeInput | null;
}

/** 검사를 마친 저장 내용 — 서버가 창고에 쓰는 모양. */
export interface NormalizedDiary {
  revision: number | null;
  eventText: string;
  reasonText: string;
  categories: { code: string; order: number; intensity: number | null }[];
  emotions: { code: string; category: string; label: string; order: number; intensity: number | null; custom: boolean }[];
  reflections: { kind: "praise" | "gratitude"; slot: number; text: string }[];
  resume: { step: ResumeStep; category: string | null } | null;
}

export type DiaryInputError =
  | "invalid_body"
  | "invalid_text"
  | "invalid_category"
  | "invalid_emotion"
  | "invalid_intensity"
  | "invalid_reflection"
  | "invalid_resume";

export type ParseResult<T> = { ok: true; value: T } | { ok: false; status: 400 | 422; error: DiaryInputError; field: string };

const bad = (status: 400 | 422, error: DiaryInputError, field: string) => ({ ok: false, status, error, field }) as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** 정해진 칸 말고 다른 칸이 있으면 그 이름. 주인·번호 같은 칸을 몰래 실어 보내지 못하게(F-02). */
function unknownKey(value: Record<string, unknown>, allowed: readonly string[]): string | null {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) return key;
  return null;
}

const DIARY_KEYS = ["revision", "eventText", "reasonText", "categories", "emotions", "praises", "gratitudes", "resume"] as const;

/**
 * 저장 요청을 검사한다. 모양이 틀리면(칸 이름·자료형) 400, 값이 규칙에 맞지 않으면 422.
 * 칭찬·감사의 빈칸(공백만)은 행을 만들지 않는다(S-7 ①). 따로 정하지 않은 세부 감정에는 대표 크기를 넣는다.
 */
export function parseDiaryInput(body: Record<string, unknown>): ParseResult<NormalizedDiary> {
  const extra = unknownKey(body, DIARY_KEYS);
  if (extra) return bad(400, "invalid_body", extra);

  let revision: number | null = null;
  if (body.revision !== undefined && body.revision !== null) {
    if (!isRevision(body.revision)) return bad(400, "invalid_body", "revision");
    revision = body.revision;
  }

  const texts: [string, number][] = [
    ["eventText", EVENT_MAX_CHARS],
    ["reasonText", REASON_MAX_CHARS]
  ];
  for (const [field, max] of texts) {
    const value = body[field];
    if (typeof value !== "string") return bad(400, "invalid_body", field);
    if (textProblem(value, max)) return bad(422, "invalid_text", field);
  }

  if (!Array.isArray(body.categories) || body.categories.length > CATEGORY_CODES.length) return bad(400, "invalid_body", "categories");
  const categories: NormalizedDiary["categories"] = [];
  const categoryIntensity = new Map<string, number | null>();
  for (const [index, item] of body.categories.entries()) {
    const field = `categories[${index}]`;
    if (!isPlainObject(item) || unknownKey(item, ["categoryCode", "intensity"])) return bad(400, "invalid_body", field);
    if (!isCategoryCode(item.categoryCode) || categoryIntensity.has(item.categoryCode)) return bad(422, "invalid_category", field);
    const intensity = item.intensity ?? null;
    if (intensity !== null && !isIntensity(intensity)) return bad(422, "invalid_intensity", field);
    categoryIntensity.set(item.categoryCode, intensity);
    categories.push({ code: item.categoryCode, order: index, intensity });
  }

  if (!Array.isArray(body.emotions) || body.emotions.length > EMOTIONS_MAX) return bad(400, "invalid_body", "emotions");
  const emotions: NormalizedDiary["emotions"] = [];
  const seenEmotions = new Set<string>();
  for (const [index, item] of body.emotions.entries()) {
    const field = `emotions[${index}]`;
    if (!isPlainObject(item) || unknownKey(item, ["emotionCode", "intensity"])) return bad(400, "invalid_body", field);
    const code = item.emotionCode;
    const info = typeof code === "string" ? EMOTIONS.get(code) : undefined;
    if (typeof code !== "string" || !info || seenEmotions.has(code) || !categoryIntensity.has(info.category)) {
      return bad(422, "invalid_emotion", field);
    }
    const own = item.intensity ?? null;
    if (own !== null && !isIntensity(own)) return bad(422, "invalid_intensity", field);
    seenEmotions.add(code);
    emotions.push({
      code,
      category: info.category,
      label: info.label,
      order: index,
      intensity: own ?? categoryIntensity.get(info.category) ?? null,
      custom: own !== null
    });
  }

  const reflections: NormalizedDiary["reflections"] = [];
  for (const kind of ["praise", "gratitude"] as const) {
    const listField = kind === "praise" ? "praises" : "gratitudes";
    const list = body[listField];
    if (!Array.isArray(list) || list.length > REFLECTION_SLOTS) return bad(400, "invalid_body", listField);
    const slots = new Set<number>();
    for (const [index, item] of list.entries()) {
      const field = `${listField}[${index}]`;
      if (!isPlainObject(item) || unknownKey(item, ["slot", "text"]) || typeof item.text !== "string") return bad(400, "invalid_body", field);
      const slot = item.slot;
      if (!Number.isInteger(slot) || (slot as number) < 1 || (slot as number) > REFLECTION_SLOTS || slots.has(slot as number)) {
        return bad(422, "invalid_reflection", field);
      }
      slots.add(slot as number);
      if (textProblem(item.text, REFLECTION_MAX_CHARS)) return bad(422, "invalid_text", field);
      if (!isBlank(item.text)) reflections.push({ kind, slot: slot as number, text: item.text });
    }
  }

  let resume: NormalizedDiary["resume"] = null;
  if (body.resume !== undefined && body.resume !== null) {
    const item = body.resume;
    if (!isPlainObject(item) || unknownKey(item, ["step", "categoryCode"])) return bad(400, "invalid_body", "resume");
    if (typeof item.step !== "string" || !(RESUME_STEPS as readonly string[]).includes(item.step)) return bad(422, "invalid_resume", "resume");
    const step = item.step as ResumeStep;
    const category = item.categoryCode ?? null;
    if (step === "details" ? typeof category !== "string" || !categoryIntensity.has(category) : category !== null) {
      return bad(422, "invalid_resume", "resume");
    }
    resume = { step, category: category as string | null };
  }

  return {
    ok: true,
    value: {
      revision,
      eventText: body.eventText as string,
      reasonText: body.reasonText as string,
      categories,
      emotions,
      reflections,
      resume
    }
  };
}

/** 완료하려면 채워야 할 단계들(빈 배열이면 완료할 수 있다). 서버의 조건부 UPDATE·창고 trigger와 같은 조건이다(DATA_MODEL §3.1). */
export function missingForCompletion(diary: {
  eventText: string;
  reasonText: string;
  categories: readonly { code: string; intensity: number | null }[];
  emotions: readonly { category: string; intensity: number | null }[];
}): MissingStep[] {
  const missing: MissingStep[] = [];
  if (isBlank(diary.eventText)) missing.push("event");
  if (diary.categories.length === 0) missing.push("feelings");
  else {
    const withEmotion = new Set(diary.emotions.map((emotion) => emotion.category));
    if (diary.categories.some((category) => !withEmotion.has(category.code))) missing.push("details");
    if (diary.categories.some((category) => category.intensity === null) || diary.emotions.some((emotion) => emotion.intensity === null)) {
      missing.push("intensity");
    }
  }
  if (isBlank(diary.reasonText)) missing.push("reason");
  return missing;
}

// ── 응답 모양 ─────────────────────────────────────────────────────────

export type DiaryStatus = "draft" | "completed";

export interface ResumeView {
  step: ResumeStep;
  categoryCode: string | null;
}

/** `GET /api/diaries/:date` — 그날 기록 전체. 모양은 `schemas/diary-entry.schema.json`(diary-entry-v2). */
export interface DiaryEntryView {
  schemaVersion: "diary-entry-v2";
  id: string;
  entryDate: string;
  timezone: string;
  status: DiaryStatus;
  revision: number;
  taxonomyVersion: string;
  eventText: string;
  reasonText: string;
  categories: { categoryCode: string; intensity: number | null }[];
  emotions: { categoryCode: string; emotionCode: string; labelSnapshot: string; intensity: number | null; custom: boolean }[];
  praises: ReflectionInput[];
  gratitudes: ReflectionInput[];
  resume: ResumeView | null;
  firstCompletedAt: string | null;
  firstCompletedLocalDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 저장·완료의 응답 — 글은 싣지 않는다(화면이 이미 갖고 있고, 영수증에도 남기지 않으려고 — S-6). */
export interface DiaryMeta {
  id: string;
  entryDate: string;
  status: DiaryStatus;
  revision: number;
  updatedAt: string;
  completedAt: string | null;
  firstCompletedLocalDate: string | null;
}

/** 오늘 화면이 쓰는 요약 — 글은 싣지 않는다. */
export interface DiarySummary {
  entryDate: string;
  status: DiaryStatus;
  revision: number;
  /** 고른 계열(고른 순서) — 오늘 화면의 돌 */
  categories: string[];
  resume: ResumeView | null;
  updatedAt: string;
}

/** `GET /api/today`. */
export interface TodayInfo {
  /** 서버가 센 오늘의 일기 날짜 */
  date: string;
  timezone: string;
  dayStartHour: number;
  entry: DiarySummary | null;
  /** 가장 최근의 지난 임시저장(오늘 화면의 '어제 쓰던 글이 있어요') */
  pastDraft: DiarySummary | null;
}
