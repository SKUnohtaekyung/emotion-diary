/// <reference path="../../client/src/env.d.ts" />
// 작성 흐름의 순수 상태(TASK-SLICE-01 PLAN §3.2, UX_SPEC §4·§6). 단계 수·막힘·빠진 것·되살릴 단계·바꾸기.
import { describe, expect, it } from "vitest";
import { type DiaryEntryView, missingForCompletion } from "../../shared/diary";
import { CATEGORIES, CATEGORY_CODES } from "../../shared/taxonomy";
import {
  blocked,
  differentSections,
  effectiveIntensity,
  emptyDiary,
  firstMissingKey,
  fromEntry,
  indexOf,
  isUntouched,
  missing,
  parseStepQuery,
  removeCategory,
  resumeIndex,
  setCategoryIntensity,
  setEmotionIntensity,
  stepName,
  stepQuery,
  steps,
  toggleCategory,
  toggleEmotion,
  toInput,
  withReflection,
  withText,
  type WorkingDiary
} from "../../client/src/write/flow";

const first = (code: string) => CATEGORIES.find((item) => item.code === code)?.emotions[0]?.code ?? "";
const second = (code: string) => CATEGORIES.find((item) => item.code === code)?.emotions[1]?.code ?? "";

/** 계열 둘(슬픔·기쁨)을 고르고 세부 감정을 하나씩 고른 글. */
function twoFeelings(): WorkingDiary {
  let diary = toggleCategory(emptyDiary(), "sadness");
  diary = toggleCategory(diary, "joy");
  diary = toggleEmotion(diary, first("sadness"));
  return toggleEmotion(diary, first("joy"));
}

describe("taxonomy 목록", () => {
  it("계열 아홉은 선언 순서, 세부 감정은 가나다순이고 모두 194개다", () => {
    expect(CATEGORIES.map((item) => item.code)).toEqual(CATEGORY_CODES);
    expect(CATEGORIES.reduce((sum, item) => sum + item.emotions.length, 0)).toBe(194);
    for (const category of CATEGORIES) {
      const labels = category.emotions.map((item) => item.label);
      expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, "ko")));
    }
  });
});

describe("steps", () => {
  it("계열을 고르기 전에는 7단계, 고른 계열마다 세부 감정 단계가 하나씩 늘어난다(7 + n)", () => {
    expect(steps(emptyDiary()).map((step) => step.step)).toEqual([
      "event",
      "feelings",
      "intensity",
      "reason",
      "praise",
      "gratitude",
      "letter"
    ]);
    let diary = emptyDiary();
    for (const code of ["fear", "love", "anger"]) diary = toggleCategory(diary, code);
    const list = steps(diary);
    expect(list).toHaveLength(10);
    expect(list.filter((step) => step.step === "details").map((step) => [step.category, step.order, step.of])).toEqual([
      ["fear", 1, 3],
      ["love", 2, 3],
      ["anger", 3, 3]
    ]);
    expect(list.map((step) => step.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("주소의 단계 열쇠를 읽고 쓴다 — 모르는 단계·계열은 null", () => {
    const key = { step: "details" as const, category: "sadness" };
    expect(parseStepQuery(new URLSearchParams(stepQuery(key)))).toEqual(key);
    expect(parseStepQuery(new URLSearchParams("step=reason"))).toEqual({ step: "reason", category: null });
    expect(parseStepQuery(new URLSearchParams("step=nowhere"))).toBeNull();
    expect(parseStepQuery(new URLSearchParams("step=details&c=nobody"))).toBeNull();
    expect(parseStepQuery(new URLSearchParams("step=details"))).toBeNull();
  });

  it("되살릴 단계: 주소 → 서버의 쓰던 단계 순으로 지금 글에 있는 첫 단계, 없으면 첫 단계", () => {
    const diary = twoFeelings();
    const joy = { step: "details" as const, category: "joy" };
    const gone = { step: "details" as const, category: "fear" };
    expect(resumeIndex(diary, [null, joy])).toBe(indexOf(diary, joy));
    expect(resumeIndex(diary, [gone, { step: "reason", category: null }])).toBe(indexOf(diary, { step: "reason", category: null }));
    expect(resumeIndex(diary, [gone, null])).toBe(0);
  });

  it("어디까지 썼는지 칩의 이름", () => {
    expect(stepName({ step: "details", category: "sadness" })).toBe("슬픔 세부 감정");
    expect(stepName({ step: "intensity", category: null })).toBe("크기");
    expect(stepName(null)).toBe("있었던 일");
  });
});

describe("blocked", () => {
  it("있었던 일이 비면(공백만이어도) 막고, 이유·칭찬·감사·편지는 막지 않는다", () => {
    expect(blocked(emptyDiary(), { step: "event", category: null })).toBe("event_empty");
    expect(blocked(withText(emptyDiary(), "eventText", " 　\n"), { step: "event", category: null })).toBe("event_empty");
    expect(blocked(withText(emptyDiary(), "eventText", "산책"), { step: "event", category: null })).toBeNull();
    for (const step of ["reason", "praise", "gratitude", "letter"] as const) {
      expect(blocked(emptyDiary(), { step, category: null })).toBeNull();
    }
  });

  it("마음 0개, 그 계열의 세부 감정 0개, 대표 크기가 없는 계열이 있으면 막는다", () => {
    expect(blocked(emptyDiary(), { step: "feelings", category: null })).toBe("no_category");
    let diary = toggleCategory(emptyDiary(), "sadness");
    expect(blocked(diary, { step: "feelings", category: null })).toBeNull();
    expect(blocked(diary, { step: "details", category: "sadness" })).toBe("no_detail");
    diary = toggleEmotion(diary, first("sadness"));
    expect(blocked(diary, { step: "details", category: "sadness" })).toBeNull();
    expect(blocked(diary, { step: "intensity", category: null })).toBe("intensity_unset");
    diary = setCategoryIntensity(diary, "sadness", 6);
    expect(blocked(diary, { step: "intensity", category: null })).toBeNull();
  });
});

describe("missing", () => {
  it("서버의 완료 조건(missingForCompletion)과 같은 답을 낸다", () => {
    let diary = emptyDiary();
    expect(missing(diary)).toEqual(["event", "feelings", "reason"]);
    diary = withText(twoFeelings(), "eventText", "있었던 일");
    expect(missing(diary)).toEqual(["intensity", "reason"]);
    diary = setCategoryIntensity(setCategoryIntensity(diary, "sadness", 3), "joy", 9);
    diary = withText(diary, "reasonText", "이유");
    expect(missing(diary)).toEqual([]);
    // 같은 글을 서버 모양으로 바꿔 서버 함수에 넣어도 같은 답
    const input = toInput(diary, 1, null);
    const categoryOf = (emotionCode: string) =>
      CATEGORIES.find((category) => category.emotions.some((emotion) => emotion.code === emotionCode))?.code ?? "";
    const server = (unsetJoy: boolean) =>
      missingForCompletion({
        eventText: input.eventText,
        reasonText: input.reasonText,
        categories: input.categories.map((item) => ({
          code: item.categoryCode,
          intensity: unsetJoy && item.categoryCode === "joy" ? null : (item.intensity ?? null)
        })),
        emotions: input.emotions.map((item) => ({
          category: categoryOf(item.emotionCode),
          intensity:
            item.intensity ??
            (unsetJoy && categoryOf(item.emotionCode) === "joy"
              ? null
              : (input.categories.find((category) => category.categoryCode === categoryOf(item.emotionCode))?.intensity ?? null))
        }))
      });
    expect(server(false)).toEqual(missing(diary));
    expect(server(true)).toEqual(missing(setCategoryIntensity(diary, "joy", null)));
  });

  it("'채우러 가기'는 첫 빠진 곳으로 — 세부 감정이면 감정이 없는 첫 계열", () => {
    let diary = withText(toggleCategory(toggleCategory(emptyDiary(), "love"), "fear"), "eventText", "일");
    diary = toggleEmotion(diary, first("love"));
    expect(firstMissingKey(diary)).toEqual({ step: "details", category: "fear" });
    expect(firstMissingKey(emptyDiary())).toEqual({ step: "event", category: null });
  });
});

describe("바꾸기", () => {
  it("계열을 끄면 그 계열의 세부 감정도 빠지고, 고르지 않은 계열의 감정은 담기지 않는다", () => {
    let diary = twoFeelings();
    expect(toggleEmotion(diary, first("fear"))).toEqual(diary);
    diary = removeCategory(diary, "sadness");
    expect(diary.categories.map((item) => item.code)).toEqual(["joy"]);
    expect(diary.emotions.map((item) => item.category)).toEqual(["joy"]);
    expect(toggleCategory(diary, "nobody")).toEqual(diary);
  });

  it("따로 정한 크기는 그 감정만, 없으면 대표 크기를 따른다 — 1~10 정수 밖은 받지 않는다", () => {
    let diary = setCategoryIntensity(twoFeelings(), "sadness", 4);
    diary = toggleEmotion(diary, second("sadness"));
    diary = setEmotionIntensity(diary, second("sadness"), 8);
    expect(effectiveIntensity(diary, first("sadness"))).toBe(4);
    expect(effectiveIntensity(diary, second("sadness"))).toBe(8);
    expect(setCategoryIntensity(diary, "sadness", 11)).toBe(diary);
    expect(setCategoryIntensity(diary, "sadness", 2.5)).toBe(diary);
    diary = setEmotionIntensity(diary, second("sadness"), null);
    expect(effectiveIntensity(diary, second("sadness"))).toBe(4);
    const input = toInput(diary, 3, { step: "intensity", category: null });
    expect(input.emotions.map((item) => item.intensity)).toEqual([null, null, null]);
    expect(input.resume).toEqual({ step: "intensity", categoryCode: null });
  });

  it("바꾸기 함수는 받은 값을 고치지 않는다", () => {
    const diary = twoFeelings();
    const before = JSON.stringify(diary);
    withReflection(diary, "praises", 1, "칭찬");
    toggleCategory(diary, "fear");
    setCategoryIntensity(diary, "joy", 5);
    expect(JSON.stringify(diary)).toBe(before);
  });
});

describe("서버 값과 오가기", () => {
  const entry: DiaryEntryView = {
    schemaVersion: "diary-entry-v2",
    id: "x",
    entryDate: "2026-10-16",
    timezone: "Asia/Seoul",
    status: "draft",
    revision: 4,
    taxonomyVersion: "v2",
    eventText: "있었던 일",
    reasonText: "",
    categories: [
      { categoryCode: "sadness", intensity: 5 },
      { categoryCode: "joy", intensity: null }
    ],
    emotions: [
      { categoryCode: "sadness", emotionCode: first("sadness"), labelSnapshot: "x", intensity: 5, custom: false },
      { categoryCode: "sadness", emotionCode: second("sadness"), labelSnapshot: "y", intensity: 9, custom: true }
    ],
    praises: [{ slot: 2, text: "칭찬 둘" }],
    gratitudes: [],
    resume: { step: "details", categoryCode: "joy" },
    firstCompletedAt: null,
    firstCompletedLocalDate: null,
    completedAt: null,
    createdAt: "",
    updatedAt: ""
  };

  it("따로 정한 크기만 own으로, 칭찬·감사는 세 칸으로 펼친다", () => {
    const diary = fromEntry(entry);
    expect(diary.emotions.map((item) => item.own)).toEqual([null, 9]);
    expect(diary.praises).toEqual(["", "칭찬 둘", ""]);
    expect(diary.gratitudes).toEqual(["", "", ""]);
    const input = toInput(diary, entry.revision, { step: "details", category: "joy" });
    expect(input.praises).toEqual([
      { slot: 1, text: "" },
      { slot: 2, text: "칭찬 둘" },
      { slot: 3, text: "" }
    ]);
    expect(input.emotions).toEqual([
      { emotionCode: first("sadness"), intensity: null },
      { emotionCode: second("sadness"), intensity: 9 }
    ]);
  });

  it("다른 부분만 짚고, 칭찬·감사의 빈칸끼리는 같다", () => {
    const a = fromEntry(entry);
    expect(differentSections(a, a)).toEqual([]);
    const b = withReflection(withText(a, "reasonText", "이유"), "gratitudes", 0, "  ");
    expect(differentSections(a, b)).toEqual(["reason"]);
    expect(differentSections(a, setCategoryIntensity(a, "joy", 2))).toEqual(["feelings"]);
    expect(isUntouched(emptyDiary())).toBe(true);
    expect(isUntouched(a)).toBe(false);
  });
});
