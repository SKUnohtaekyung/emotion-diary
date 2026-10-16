// 감정 사전 v2(D-038, `data/taxonomy/v2.json`)에서 서버와 화면이 쓰는 것만 뽑는다 — 코드 → 계열·표시명(DATA_MODEL §4).
// 감정 목록은 창고에 표로 넣지 않고 이 파일로 대조한다(TASK-DATA-01 S-7 ④). 표시명은 서버가 여기서 채운다 — 화면이 보낸 이름을 믿지 않는다.
import taxonomy from "../../data/taxonomy/v2.json";

export const TAXONOMY_VERSION: string = taxonomy.version;

/** 9개 계열의 안정 코드(taxonomy 선언 순서). */
export const CATEGORY_CODES: readonly string[] = taxonomy.categories.map((category) => category.code);

export interface EmotionInfo {
  category: string;
  label: string;
}

/** 세부 감정 코드 → 계열·한글 표시명. 코드는 `<계열>-<slug>`라 계열이 다르면 같은 표시명도 다른 코드다(D-022). */
export const EMOTIONS: ReadonlyMap<string, EmotionInfo> = new Map(
  taxonomy.categories.flatMap((category) =>
    category.emotions.map((emotion) => [emotion.code, { category: category.code, label: emotion.label_ko }] as const)
  )
);

const CATEGORY_SET: ReadonlySet<string> = new Set(CATEGORY_CODES);

export function isCategoryCode(value: unknown): value is string {
  return typeof value === "string" && CATEGORY_SET.has(value);
}
