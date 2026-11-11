// 통계 계산 순수 함수(app/shared/stats.ts — DATA_MODEL §7, EVAL F-12·F-20·deterministic-statistics, TASK-REFLECT-01 R-2).
import { describe, expect, it } from "vitest";
import { syntheticDiaries } from "../../scripts/synthetic.mjs";
import {
  type CategorySummary,
  categorySummary,
  compare,
  currentStreak,
  dayValue,
  indexByDate,
  MIN_DAYS,
  periodDates,
  periodRange,
  type StatEntry,
  type StatsMaterial,
  summarize,
  topWords
} from "../../shared/stats";
import { CATEGORY_CODES } from "../../shared/taxonomy";

const TODAY = "2026-10-14";
const entry = (date: string, emotions: Array<[string, number]>): StatEntry => ({
  date,
  emotions: emotions.map(([category, intensity], index) => ({ code: `${category}-${index}`, category, intensity }))
});
const summary = (values: number[]): CategorySummary =>
  categorySummary(
    indexByDate(values.map((value, index) => entry(`2026-10-${String(index + 1).padStart(2, "0")}`, [["joy", value]]))),
    values.map((_, index) => `2026-10-${String(index + 1).padStart(2, "0")}`),
    "joy"
  );

describe("기간과 하루 값", () => {
  it("기간은 오늘을 포함해 오래된 날 → 최근 날, 바로 앞 기간은 같은 길이", () => {
    expect(periodDates(TODAY, 3)).toEqual(["2026-10-12", "2026-10-13", "2026-10-14"]);
    expect(periodDates("2026-03-01", 2)).toEqual(["2026-02-28", "2026-03-01"]);
    expect(periodDates("2028-03-01", 2)).toEqual(["2028-02-29", "2028-03-01"]); // 윤년
    expect(periodRange(TODAY, 7)).toEqual({ from: "2026-10-08", to: TODAY, prevFrom: "2026-10-01", prevTo: "2026-10-07" });
  });

  it("계열의 하루 값은 그 계열 세부 감정 크기의 평균 — 고르지 않은 날은 0이 아니라 없음", () => {
    const day = entry(TODAY, [["joy", 4], ["joy", 9], ["sadness", 2]]);
    expect(dayValue(day, "joy")).toBe(6.5);
    expect(dayValue(day, "sadness")).toBe(2);
    expect(dayValue(day, "anger")).toBeNull();
    expect(dayValue(undefined, "joy")).toBeNull();
  });

  it("기간 평균은 하루 값들의 평균 — 세부 감정을 많이 고른 날이 더 무겁지 않다(DATA_MODEL §7)", () => {
    const byDate = indexByDate([entry("2026-10-12", [["joy", 2], ["joy", 2], ["joy", 2], ["joy", 2]]), entry("2026-10-13", [["joy", 8]]), entry("2026-10-14", [["joy", 5]])]);
    const result = categorySummary(byDate, periodDates(TODAY, 3), "joy");
    expect(result.n).toBe(3);
    expect(result.mean).toBe(5); // (2 + 8 + 5) / 3 — 행 평균이었다면 (2·4 + 8 + 5) / 6 = 3.5
    expect([result.min, result.max]).toEqual([2, 8]);
  });

  it("n<3이면 평균이 없다(F-20), 범위는 있다", () => {
    const two = summary([3, 7]);
    expect(two.n).toBe(2);
    expect(two.mean).toBeNull();
    expect([two.min, two.max]).toEqual([3, 7]);
  });
});

describe("기간 비교(F-20)", () => {
  it("어느 한쪽이라도 n<3이면 비교하지 않는다", () => {
    expect(compare(summary([5, 5]), summary([1, 1, 1]))).toBeNull();
    expect(compare(summary([5, 5, 5]), summary([1, 1]))).toBeNull();
  });

  it("차이가 1.0 미만이면 유의해도 비슷함", () => {
    expect(compare(summary([5.9, 5.9, 5.9, 5.9]), summary([5, 5, 5, 5]))?.verdict).toBe("similar");
  });

  it("차이가 1.0 이상이고 Welch 95%를 넘으면 높음/낮음, 흩어짐이 크면 비슷함", () => {
    expect(compare(summary([8, 8, 9, 8]), summary([4, 5, 4, 4]))?.verdict).toBe("higher");
    expect(compare(summary([2, 3, 2, 2]), summary([7, 6, 7, 7]))?.verdict).toBe("lower");
    expect(compare(summary([1, 10, 2, 9]), summary([4, 5, 6, 3]))?.verdict).toBe("similar");
    // 두 쪽이 흩어짐 없이 서로 다르면(SE=0) 차이만으로 판정
    expect(compare(summary([7, 7, 7]), summary([5, 5, 5]))?.verdict).toBe("higher");
  });
});

describe("이어서 쓴 날(D-065 ④·D-107)", () => {
  it("오늘 또는 어제로 끝나는 연속 첫 완료 날짜 수", () => {
    expect(currentStreak(["2026-10-14", "2026-10-13", "2026-10-12", "2026-10-10"], TODAY)).toBe(3);
    expect(currentStreak(["2026-10-13", "2026-10-12"], TODAY)).toBe(2);
    expect(currentStreak(["2026-10-12"], TODAY)).toBe(0);
    expect(currentStreak([], TODAY)).toBe(0);
  });

  it("뒤늦게 마무리한 지난 날은 그 날을 채우지 않는다 — 첫 완료 날짜로만 센다", () => {
    // 10/12 기록을 10/13에 마무리했다면 첫 완료 날짜는 10/13 하나뿐이다
    expect(currentStreak(["2026-10-14", "2026-10-13"], TODAY)).toBe(2);
  });
});

describe("요약(summarize)", () => {
  const material = (entries: StatEntry[], firsts: string[] = []): StatsMaterial => ({ today: TODAY, days: 7, entries, firstCompletedDates: firsts });

  it("기록한 날이 5일 미만이면 친밀도·자주 머문 말이 없다", () => {
    const four = periodDates(TODAY, 4).map((date) => entry(date, [["joy", 5]]));
    const result = summarize(material(four), CATEGORY_CODES);
    expect(result.recorded).toBe(4);
    expect(result.enough).toBe(false);
    expect(result.friends.every((friend) => friend.closeness === null)).toBe(true);
    expect(result.words).toEqual([]);
    expect(MIN_DAYS).toBe(5);
  });

  it("친밀도 = 그 친구와 함께한 날 ÷ 기록한 날, 계열 선언 순서 그대로, 다른 계열과 섞지 않는다", () => {
    const days = periodDates(TODAY, 6).map((date, index) => entry(date, index < 3 ? [["joy", 6], ["sadness", 2]] : [["joy", 4]]));
    const result = summarize(material(days), CATEGORY_CODES);
    expect(result.friends.map((friend) => friend.code)).toEqual([...CATEGORY_CODES]);
    const joy = result.friends.find((friend) => friend.code === "joy");
    const sadness = result.friends.find((friend) => friend.code === "sadness");
    expect([joy?.daysWith, joy?.closeness]).toEqual([6, 1]);
    expect([sadness?.daysWith, sadness?.closeness]).toEqual([3, 0.5]);
    expect(joy?.current.mean).toBe(5);
    expect(sadness?.current.mean).toBe(2);
  });

  it("바로 앞 기간 밖의 기록은 세지 않는다", () => {
    const result = summarize(material([entry("2026-09-30", [["joy", 9]]), entry("2026-10-01", [["joy", 1]])]), CATEGORY_CODES);
    expect(result.recorded).toBe(0);
    expect(result.friends.find((friend) => friend.code === "joy")?.previous.days).toEqual([{ date: "2026-10-01", value: 1 }]);
  });

  it("자주 머문 말: 행 수로 세고, 같은 수면 먼저 나온 말이 앞, 계열을 주면 그 계열만", () => {
    const byDate = indexByDate([
      { date: "2026-10-13", emotions: [{ code: "joy-a", category: "joy", intensity: 5 }, { code: "sad-a", category: "sadness", intensity: 3 }] },
      { date: "2026-10-14", emotions: [{ code: "sad-a", category: "sadness", intensity: 4 }, { code: "joy-b", category: "joy", intensity: 5 }] }
    ]);
    const dates = periodDates(TODAY, 2);
    expect(topWords(byDate, dates, 5).map((word) => [word.code, word.count])).toEqual([["sad-a", 2], ["joy-a", 1], ["joy-b", 1]]);
    expect(topWords(byDate, dates, 5, "joy").map((word) => word.code)).toEqual(["joy-a", "joy-b"]);
  });

  it("같은 재료면 언제나 같은 결과 — 합성 기록 씨앗이 같으면 같은 기록(deterministic-statistics)", () => {
    const toMaterial = (seed: number): StatsMaterial => {
      const diaries = syntheticDiaries(TODAY, 60, { seed }).filter((diary) => diary.status === "completed");
      return {
        today: TODAY,
        days: 30,
        entries: diaries.map((diary) => ({ date: diary.entryDate, emotions: diary.emotions.map((emotion) => ({ code: emotion.emotionCode, category: emotion.categoryCode, intensity: emotion.intensity ?? 0 })) })),
        firstCompletedDates: [...new Set(diaries.map((diary) => diary.firstCompletedLocalDate ?? ""))].sort().reverse()
      };
    };
    expect(toMaterial(3)).toEqual(toMaterial(3));
    expect(summarize(toMaterial(3), CATEGORY_CODES)).toEqual(summarize(toMaterial(3), CATEGORY_CODES));
    expect(summarize(toMaterial(3), CATEGORY_CODES)).not.toEqual(summarize(toMaterial(4), CATEGORY_CODES));
  });

  it("합성 기록은 통계 확인에 쓸 만큼 섞여 있다 — 높음·낮음이 나오고, 쓰던 글·뒤늦게 마무리한 날이 있다", () => {
    const diaries = syntheticDiaries(TODAY, 60);
    expect(diaries.some((diary) => diary.status === "draft")).toBe(true);
    expect(diaries.some((diary) => diary.firstCompletedLocalDate && diary.firstCompletedLocalDate !== diary.entryDate)).toBe(true);
    expect(diaries.some((diary) => diary.entryDate === TODAY)).toBe(false);
    const completed = diaries.filter((diary) => diary.status === "completed");
    const result = summarize(
      {
        today: TODAY,
        days: 30,
        entries: completed.map((diary) => ({ date: diary.entryDate, emotions: diary.emotions.map((emotion) => ({ code: emotion.emotionCode, category: emotion.categoryCode, intensity: emotion.intensity ?? 0 })) })),
        firstCompletedDates: [...new Set(completed.map((diary) => diary.firstCompletedLocalDate ?? ""))].sort().reverse()
      },
      CATEGORY_CODES
    );
    const verdicts = result.friends.map((friend) => friend.comparison?.verdict);
    expect(result.enough).toBe(true);
    expect(verdicts).toContain("higher");
    expect(verdicts).toContain("lower");
  });
});
