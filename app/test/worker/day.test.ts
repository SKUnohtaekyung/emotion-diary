// 날짜·시간대·글 검사의 공용 규칙(DATA_MODEL §2, EVAL_PLAN F-17, TASK-DATA-01 S-2·S-7). 창고 없이 도는 순수 함수 시험.
import { describe, expect, it } from "vitest";
import {
  addDays,
  canonicalTimeZone,
  DIARY_MAX_BODY_BYTES,
  isBlank,
  isIsoDate,
  localDayAt,
  missingForCompletion,
  parseDiaryInput,
  textProblem,
  WHITESPACE_CODE_POINTS
} from "../../shared/diary";
import { CATEGORY_CODES, EMOTIONS, TAXONOMY_VERSION } from "../../shared/taxonomy";

const at = (iso: string) => Date.parse(iso);

describe("일기 날짜(하루 기준 시각, F-17)", () => {
  it("서울 03:59는 전날, 04:00은 그날(기준 4시)", () => {
    // 서울은 UTC+9 — 2026-10-15 03:59 KST = 2026-10-14T18:59Z
    expect(localDayAt(at("2026-10-14T18:59:59.999Z"), "Asia/Seoul", 4)).toBe("2026-10-14");
    expect(localDayAt(at("2026-10-14T19:00:00.000Z"), "Asia/Seoul", 4)).toBe("2026-10-15");
  });

  it("기준 시각 0이면 자정이 경계, 6이면 06:00이 경계", () => {
    expect(localDayAt(at("2026-10-14T15:00:00.000Z"), "Asia/Seoul", 0)).toBe("2026-10-15");
    expect(localDayAt(at("2026-10-14T14:59:59.999Z"), "Asia/Seoul", 0)).toBe("2026-10-14");
    expect(localDayAt(at("2026-10-14T20:59:59.999Z"), "Asia/Seoul", 6)).toBe("2026-10-14");
    expect(localDayAt(at("2026-10-14T21:00:00.000Z"), "Asia/Seoul", 6)).toBe("2026-10-15");
  });

  it("같은 순간도 있는 곳의 시계를 따른다(U-2 — 파리 밤 11시는 파리의 그날)", () => {
    const moment = at("2026-10-15T21:00:00.000Z"); // 파리(서머타임 UTC+2) 23:00, 서울 다음 날 06:00
    expect(localDayAt(moment, "Europe/Paris", 4)).toBe("2026-10-15");
    expect(localDayAt(moment, "Asia/Seoul", 4)).toBe("2026-10-16");
  });

  it("서머타임이 바뀌는 날에도 현지 시각으로 가른다(뉴욕 2026-03-08 02:00 → 03:00)", () => {
    expect(localDayAt(at("2026-03-08T07:59:00.000Z"), "America/New_York", 4)).toBe("2026-03-07"); // 03:59 EDT
    expect(localDayAt(at("2026-03-08T08:00:00.000Z"), "America/New_York", 4)).toBe("2026-03-08"); // 04:00 EDT
  });

  it("날짜선 양쪽(UTC+14와 UTC-12)은 하루 넘게 다르다", () => {
    const moment = at("2026-10-15T12:00:00.000Z");
    expect(localDayAt(moment, "Pacific/Kiritimati", 0)).toBe("2026-10-16");
    expect(localDayAt(moment, "Etc/GMT+12", 0)).toBe("2026-10-15");
  });

  it("달·해가 넘어가는 전날 계산", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
    expect(localDayAt(at("2026-12-31T18:30:00.000Z"), "Asia/Seoul", 4)).toBe("2026-12-31"); // 서울 1월 1일 03:30
  });
});

describe("시간대 이름 검사", () => {
  it("IANA 이름은 받고 정리된 이름을 돌려준다", () => {
    expect(canonicalTimeZone("Asia/Seoul")).toBe("Asia/Seoul");
    expect(canonicalTimeZone("UTC")).toBeTruthy();
    // 별칭을 어느 이름으로 정리하는지는 런타임의 ICU 판마다 다르다(Node 22는 America/Buenos_Aires) — 같은 곳을 가리키면 된다.
    expect(canonicalTimeZone("America/Argentina/Buenos_Aires")).toMatch(/Buenos_Aires$/);
  });

  it("모르는 이름·오프셋·빈 값·너무 긴 값은 거부", () => {
    for (const value of ["Mars/Phobos", "+09:00", "", " Asia/Seoul", "Asia/Seoul\n", "a".repeat(65), null, 9]) {
      expect(canonicalTimeZone(value)).toBeNull();
    }
  });
});

describe("날짜 모양", () => {
  it("달력에 있는 날만", () => {
    expect(isIsoDate("2026-10-15")).toBe(true);
    expect(isIsoDate("2028-02-29")).toBe(true);
    for (const value of ["2026-02-29", "2026-13-01", "2026-10-32", "2026-1-5", "20261015", "2026-10-15T00:00", "0099-01-01", "", null]) {
      expect(isIsoDate(value)).toBe(false);
    }
  });
});

describe("글 검사", () => {
  it("공백 판정은 JS 정규식 \\s와 같은 집합이다(창고 SQL과 맞추는 기준)", () => {
    for (let code = 0; code <= 0xffff; code += 1) {
      if (code >= 0xd800 && code <= 0xdfff) continue;
      const char = String.fromCodePoint(code);
      expect(isBlank(char), `U+${code.toString(16)}`).toBe(/^\s$/u.test(char));
    }
    expect(WHITESPACE_CODE_POINTS.length).toBe(25);
  });

  it("줄바꿈·탭·이모지는 받고, 다른 제어 문자와 짝 없는 대리 문자는 받지 않는다", () => {
    expect(textProblem("오늘은\n좋았다\t😀", 100)).toBeNull();
    for (const text of ["a\rb", "a\u0000b", "a\u001bb", "a\u0085b", "a\ud800b", "a\udc00"]) expect(textProblem(text, 100)).toBe("bad_char");
  });

  it("글자 수는 코드 포인트로 센다(이모지 하나는 한 글자)", () => {
    expect(textProblem("😀".repeat(10), 10)).toBeNull();
    expect(textProblem("😀".repeat(11), 10)).toBe("too_long");
    expect(textProblem("가".repeat(10_000), 10_000)).toBeNull();
    expect(textProblem("가".repeat(10_001), 10_000)).toBe("too_long");
  });

  it("본문 한도는 글 칸 최대 글자 수의 4바이트 + 32KB", () => {
    expect(DIARY_MAX_BODY_BYTES).toBe(4 * 32_000 + 32_768);
  });
});

describe("감정 사전", () => {
  it("v2의 9계열·세부 감정 코드는 계열 접두어를 가진다", () => {
    expect(TAXONOMY_VERSION).toBe("emotion-ko-v2");
    expect(CATEGORY_CODES).toHaveLength(9);
    for (const [code, info] of EMOTIONS) expect(code.startsWith(`${info.category}-`)).toBe(true);
  });
});

const sadness = [...EMOTIONS].filter(([, info]) => info.category === "sadness").map(([code]) => code);
const joy = [...EMOTIONS].filter(([, info]) => info.category === "joy").map(([code]) => code);

const draft = (overrides: Record<string, unknown> = {}) => ({
  eventText: "",
  reasonText: "",
  categories: [],
  emotions: [],
  praises: [],
  gratitudes: [],
  ...overrides
});

describe("저장 요청 검사", () => {
  it("따로 정하지 않은 세부 감정은 대표 크기를 따른다, 표시명은 사전에서 채운다", () => {
    const result = parseDiaryInput(
      draft({
        categories: [{ categoryCode: "sadness", intensity: 6 }, { categoryCode: "joy" }],
        emotions: [{ emotionCode: sadness[0] }, { emotionCode: sadness[1], intensity: 9 }, { emotionCode: joy[0] }]
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.emotions.map((emotion) => [emotion.intensity, emotion.custom])).toEqual([
      [6, false],
      [9, true],
      [null, false]
    ]);
    expect(result.value.emotions[0]?.label).toBe(EMOTIONS.get(sadness[0] ?? "")?.label);
    expect(result.value.categories.map((category) => category.order)).toEqual([0, 1]);
  });

  it("모르는 칸(주인 칸 포함)은 400", () => {
    for (const body of [draft({ ownerKey: "other" }), draft({ emotions: [{ emotionCode: sadness[0], labelSnapshot: "x" }] })]) {
      const result = parseDiaryInput(body);
      expect(result.ok ? 0 : result.status).toBe(400);
    }
  });

  it("고르지 않은 계열의 감정·모르는 코드·겹친 감정·범위 밖 크기는 422", () => {
    const cases = [
      draft({ emotions: [{ emotionCode: sadness[0] }] }),
      draft({ categories: [{ categoryCode: "sadness" }], emotions: [{ emotionCode: "sadness-nope" }] }),
      draft({ categories: [{ categoryCode: "sadness" }], emotions: [{ emotionCode: sadness[0] }, { emotionCode: sadness[0] }] }),
      draft({ categories: [{ categoryCode: "sadness", intensity: 11 }] }),
      draft({ categories: [{ categoryCode: "sadness", intensity: 2.5 }] }),
      draft({ categories: [{ categoryCode: "nostalgia" }] }),
      draft({ categories: [{ categoryCode: "sadness" }, { categoryCode: "sadness" }] })
    ];
    for (const body of cases) {
      const result = parseDiaryInput(body);
      expect(result.ok ? 0 : result.status, JSON.stringify(body)).toBe(422);
    }
  });

  it("칭찬·감사의 빈칸은 행을 만들지 않고, 칸 번호는 1~3에 겹치지 않는다", () => {
    const result = parseDiaryInput(draft({ praises: [{ slot: 2, text: "잘했다" }, { slot: 1, text: " 　\n" }] }));
    expect(result.ok && result.value.reflections).toEqual([{ kind: "praise", slot: 2, text: "잘했다" }]);
    for (const praises of [[{ slot: 4, text: "x" }], [{ slot: 1, text: "a" }, { slot: 1, text: "b" }]]) {
      const bad = parseDiaryInput(draft({ praises }));
      expect(bad.ok ? 0 : bad.status).toBe(422);
    }
  });

  it("쓰던 단계: 세부 감정 단계만 계열을 갖고, 그 계열은 고른 것이어야 한다", () => {
    const base = { categories: [{ categoryCode: "sadness" }] };
    expect(parseDiaryInput(draft({ ...base, resume: { step: "details", categoryCode: "sadness" } })).ok).toBe(true);
    expect(parseDiaryInput(draft({ ...base, resume: { step: "reason" } })).ok).toBe(true);
    for (const resume of [{ step: "details", categoryCode: "joy" }, { step: "details" }, { step: "reason", categoryCode: "sadness" }, { step: "done" }]) {
      const result = parseDiaryInput(draft({ ...base, resume }));
      expect(result.ok ? 0 : result.status, JSON.stringify(resume)).toBe(422);
    }
  });

  it("완료 조건: 빠진 단계를 흐름 순서로 알린다", () => {
    expect(missingForCompletion({ eventText: " ", reasonText: "", categories: [], emotions: [] })).toEqual(["event", "feelings", "reason"]);
    expect(
      missingForCompletion({
        eventText: "일",
        reasonText: "이유",
        categories: [
          { code: "sadness", intensity: 5 },
          { code: "joy", intensity: null }
        ],
        emotions: [{ category: "sadness", intensity: 5 }]
      })
    ).toEqual(["details", "intensity"]);
    expect(
      missingForCompletion({ eventText: "일", reasonText: "이유", categories: [{ code: "sadness", intensity: 5 }], emotions: [{ category: "sadness", intensity: 5 }] })
    ).toEqual([]);
  });
});
