// 통계 계산(DATA_MODEL §7, D-064·D-086·D-107, EVAL F-12·F-20) — 순수 함수. DOM·fetch·창고에 기대지 않아 서버·기기 어느 쪽에서든 돈다
// (TASK-REFLECT-01 A-6: 지금은 기기에서 계산하고 서버는 재료만 준다 — 글은 없다).
// 시안 web/js/stats-calc.js를 옮기며 정본에 맞게 고친 곳:
// - 계열의 하루 값 = 그날 고른 그 계열 세부 감정(diary_emotions) 크기들의 산술평균. 기간 평균은 그 하루 값들의 평균이다(세부 감정을
//   많이 고른 날이 더 무겁지 않다). 시안 표본은 계열·날마다 값 하나라 평균을 다시 내지 않았다.
// - 이어서 쓴 날 = 오늘 또는 어제로 끝나는 연속 first_completed_local_date. 뒤늦게 마무리한 지난 날(backdated entry_date)은 채우지 않는다.
// 서로 다른 계열의 크기는 어디에서도 섞어 평균 내지 않는다(D-086 ⑤). 평가어·색은 여기서 만들지 않는다 — 방향·수치·판정까지다.

import { addDays } from "./diary";

/** 통계 재료의 세부 감정 하나(글 없음). */
export interface StatEmotion {
  code: string;
  category: string;
  intensity: number;
}

/** 통계 재료의 완료 기록 하나(글 없음) — entry_date와 그날 고른 세부 감정들. */
export interface StatEntry {
  date: string;
  emotions: StatEmotion[];
}

/** `GET /api/stats/:days`의 응답 — 이번 기간과 바로 앞 같은 길이 기간의 완료 기록, 이어서 쓴 날을 셀 첫 완료 날짜(최근부터). */
export interface StatsMaterial {
  today: string;
  days: StatsPeriod;
  entries: StatEntry[];
  firstCompletedDates: string[];
}

export const STATS_PERIODS = [7, 30] as const;
export type StatsPeriod = (typeof STATS_PERIODS)[number];
export const isStatsPeriod = (value: unknown): value is StatsPeriod => value === 7 || value === 30;

/** 친밀도·자주 머문 말을 보이려면 기간 안에 기록한 날이 이만큼 있어야 한다(D-086, UX_SPEC §9). */
export const MIN_DAYS = 5;
/** 평균을 보이려면 그 계열을 고른 날이 이만큼 있어야 한다(F-20). */
export const MIN_N_FOR_MEAN = 3;
/** 이어서 쓴 날을 셀 때 서버가 주는 첫 완료 날짜의 최대 개수. 더 길면 '이만큼 이상'으로 본다. */
export const STREAK_LOOKBACK = 400;

/** endIso를 포함해 len일 — 오래된 날 → 최근 날. */
export function periodDates(endIso: string, len: number): string[] {
  const out: string[] = [];
  for (let back = len - 1; back >= 0; back -= 1) out.push(addDays(endIso, -back));
  return out;
}

/** 이번 기간과 바로 앞 같은 길이 기간의 첫날·끝날. */
export function periodRange(today: string, days: number): { from: string; to: string; prevFrom: string; prevTo: string } {
  return { from: addDays(today, -(days - 1)), to: today, prevFrom: addDays(today, -(2 * days - 1)), prevTo: addDays(today, -days) };
}

const round1 = (value: number) => Math.round(value * 10) / 10;

/** 그날 그 계열의 하루 값(세부 감정 크기 평균). 그 계열을 고르지 않았으면 null — 0이 아니다. */
export function dayValue(entry: StatEntry | undefined, category: string): number | null {
  const values = (entry?.emotions ?? []).filter((emotion) => emotion.category === category).map((emotion) => emotion.intensity);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

export interface CategorySummary {
  code: string;
  /** 그 계열을 고른 날 수 */
  n: number;
  /** 날마다 하루 값(그 계열을 고른 날만, 날짜순) */
  days: Array<{ date: string; value: number }>;
  /** 기간 평균(소수 한 자리). n<3이면 null(F-20) */
  mean: number | null;
  min: number | null;
  max: number | null;
  /** 비교용 — 반올림 전 평균과 표본표준편차(n−1) */
  meanRaw: number | null;
  sd: number;
}

type ByDate = Map<string, StatEntry>;

export function indexByDate(entries: readonly StatEntry[]): ByDate {
  return new Map(entries.map((entry) => [entry.date, entry]));
}

export function categorySummary(byDate: ByDate, dates: readonly string[], category: string): CategorySummary {
  const days: Array<{ date: string; value: number }> = [];
  for (const date of dates) {
    const value = dayValue(byDate.get(date), category);
    if (value !== null) days.push({ date, value });
  }
  const n = days.length;
  const values = days.map((day) => day.value);
  const meanRaw = n ? values.reduce((sum, value) => sum + value, 0) / n : null;
  const sd = n >= 2 && meanRaw !== null ? Math.sqrt(values.reduce((sum, value) => sum + (value - meanRaw) ** 2, 0) / (n - 1)) : 0;
  return {
    code: category,
    n,
    days,
    mean: n >= MIN_N_FOR_MEAN && meanRaw !== null ? round1(meanRaw) : null,
    min: n ? Math.min(...values) : null,
    max: n ? Math.max(...values) : null,
    meanRaw,
    sd
  };
}

// Welch 두 표본 t검정의 95% 양측 임계값. df는 내림(보수적). df>30은 1.96(정규 근사).
const T_TABLE = [
  12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.16, 2.145, 2.131, 2.12, 2.11, 2.101, 2.093, 2.086, 2.08, 2.074, 2.069,
  2.064, 2.06, 2.056, 2.052, 2.048, 2.045, 2.042
];
export const tCritical = (df: number): number => (df > 30 ? 1.96 : (T_TABLE[Math.max(1, df) - 1] ?? 1.96));

export type Verdict = "higher" | "lower" | "similar";

export interface Comparison {
  /** 이번 평균 − 지난 평균(반올림 전) */
  delta: number;
  verdict: Verdict;
  prevMean: number | null;
  prevN: number;
}

/** 기간 비교(F-20): 두 기간 모두 n≥3이어야 하고, |차이|≥1.0이면서 Welch 95%를 넘을 때만 높음/낮음, 아니면 비슷함. 표본이 모자라면 null. */
export function compare(current: CategorySummary, previous: CategorySummary): Comparison | null {
  if (current.n < MIN_N_FOR_MEAN || previous.n < MIN_N_FOR_MEAN || current.meanRaw === null || previous.meanRaw === null) return null;
  const delta = current.meanRaw - previous.meanRaw;
  const a = current.sd ** 2 / current.n;
  const b = previous.sd ** 2 / previous.n;
  const se = Math.sqrt(a + b);
  let verdict: Verdict = "similar";
  if (Math.abs(delta) >= 1) {
    if (se === 0) verdict = delta > 0 ? "higher" : "lower";
    else {
      const df = Math.floor((a + b) ** 2 / (a ** 2 / (current.n - 1) + b ** 2 / (previous.n - 1)));
      if (Math.abs(delta) >= tCritical(df) * se) verdict = delta > 0 ? "higher" : "lower";
    }
  }
  return { delta, verdict, prevMean: previous.mean, prevN: previous.n };
}

/** 이어서 쓴 날(D-065 ④, DATA_MODEL §7): 오늘 또는 어제로 끝나는 연속 첫 완료 날짜 수. 없으면 0. */
export function currentStreak(firstCompletedDates: readonly string[], today: string): number {
  const set = new Set(firstCompletedDates);
  let cursor = set.has(today) ? today : set.has(addDays(today, -1)) ? addDays(today, -1) : null;
  let count = 0;
  while (cursor && set.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export interface WordCount {
  code: string;
  category: string;
  count: number;
}

/** 자주 머문 말(세부 감정 빈도 — diary_emotions 행 수). 같은 수면 기간 안에서 먼저 나온 말이 앞선다. category를 주면 그 계열만. */
export function topWords(byDate: ByDate, dates: readonly string[], limit: number, category?: string): WordCount[] {
  const counts = new Map<string, WordCount>();
  for (const date of dates) {
    for (const emotion of byDate.get(date)?.emotions ?? []) {
      if (category && emotion.category !== category) continue;
      const found = counts.get(emotion.code);
      if (found) found.count += 1;
      else counts.set(emotion.code, { code: emotion.code, category: emotion.category, count: 1 });
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

export interface FriendStat {
  code: string;
  /** 기간 안 기록한 날 중 그 계열과 함께한 날 수 */
  daysWith: number;
  /** 친밀도 = daysWith / 기록한 날(D-064). 기록한 날이 5일 미만이면 null */
  closeness: number | null;
  current: CategorySummary;
  previous: CategorySummary;
  comparison: Comparison | null;
}

export interface StatsSummary {
  today: string;
  days: number;
  dates: string[];
  previousDates: string[];
  /** 기간 안 완료 기록이 있는 날 수 */
  recorded: number;
  /** 친밀도·자주 머문 말을 보일 만큼 기록했는가(5일 이상) */
  enough: boolean;
  /** 이어서 쓴 날. 화면은 2 이상일 때만 보인다(D-107) */
  streak: number;
  /** 계열 선언 순서 그대로 */
  friends: FriendStat[];
  words: WordCount[];
}

/** 재료 → 통계 첫 화면·친구 상세가 쓰는 값. categories는 계열 선언 순서. */
export function summarize(material: StatsMaterial, categories: readonly string[]): StatsSummary {
  const byDate = indexByDate(material.entries);
  const dates = periodDates(material.today, material.days);
  const previousDates = periodDates(addDays(material.today, -material.days), material.days);
  const recorded = dates.filter((date) => byDate.has(date)).length;
  const enough = recorded >= MIN_DAYS;
  const friends = categories.map((code) => {
    const current = categorySummary(byDate, dates, code);
    const previous = categorySummary(byDate, previousDates, code);
    return { code, daysWith: current.n, closeness: enough ? current.n / recorded : null, current, previous, comparison: compare(current, previous) };
  });
  return {
    today: material.today,
    days: material.days,
    dates,
    previousDates,
    recorded,
    enough,
    streak: currentStreak(material.firstCompletedDates, material.today),
    friends,
    words: enough ? topWords(byDate, dates, 5) : []
  };
}
