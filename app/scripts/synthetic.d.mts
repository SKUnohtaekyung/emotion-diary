// app/scripts/synthetic.mjs의 타입(TypeScript 시험이 가져다 쓴다).
import type { DiaryEntryView } from "../shared/diary";

export declare const TAXONOMY_VERSION: string;
export declare function mulberry32(seed: number): () => number;
export declare function addDays(iso: string, days: number): string;
export declare function syntheticDiaries(
  end: string,
  count: number,
  options?: { seed?: number; recordRate?: number; recent?: number; drafts?: number; backdated?: number; skipToday?: boolean }
): DiaryEntryView[];
