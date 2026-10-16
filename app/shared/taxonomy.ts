// 감정 사전 v2(D-038, `data/taxonomy/v2.json`)에서 서버와 화면이 쓰는 것만 뽑는다 — 코드 → 계열·표시명(DATA_MODEL §4).
// 감정 목록은 창고에 표로 넣지 않고 이 파일로 대조한다(TASK-DATA-01 S-7 ④). 표시명은 서버가 여기서 채운다 — 화면이 보낸 이름을 믿지 않는다.
// 이름을 골라 가져온다 — 묶을 때 근거 목록·검토 기록 같은 다른 칸이 화면·서버 묶음에 들어가지 않게(TASK-SLICE-01 5-2).
import { categories, version } from "../../data/taxonomy/v2.json";

export const TAXONOMY_VERSION: string = version;

/** 9개 계열의 안정 코드(taxonomy 선언 순서). */
export const CATEGORY_CODES: readonly string[] = categories.map((category) => category.code);

export interface CategoryEntry {
  code: string;
  /** 화면의 이름(예: 즐거움) */
  label: string;
  /** 그 계열의 세부 감정(가나다순 — UX_SPEC §4 3단계) */
  emotions: readonly { code: string; label: string }[];
}

/** 화면이 쓰는 계열 목록(taxonomy 선언 순서). */
export const CATEGORIES: readonly CategoryEntry[] = categories.map((category) => ({
  code: category.code,
  label: category.label_ko,
  emotions: category.emotions
    .map((emotion) => ({ code: emotion.code, label: emotion.label_ko }))
    .sort((a, b) => a.label.localeCompare(b.label, "ko"))
}));

export interface EmotionInfo {
  category: string;
  label: string;
}

/** 세부 감정 코드 → 계열·한글 표시명. 코드는 `<계열>-<slug>`라 계열이 다르면 같은 표시명도 다른 코드다(D-022). */
export const EMOTIONS: ReadonlyMap<string, EmotionInfo> = new Map(
  categories.flatMap((category) =>
    category.emotions.map((emotion) => [emotion.code, { category: category.code, label: emotion.label_ko }] as const)
  )
);

const CATEGORY_SET: ReadonlySet<string> = new Set(CATEGORY_CODES);

export function isCategoryCode(value: unknown): value is string {
  return typeof value === "string" && CATEGORY_SET.has(value);
}
