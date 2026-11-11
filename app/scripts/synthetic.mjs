// 합성 기록(가짜 데이터) 만드는 도구 하나(TASK-REFLECT-01 A-9). 화면 시험·통계 시험·개발용 건물 넣기(seed-dev.mjs)가 함께 쓴다.
// 씨앗이 같으면 언제나 같은 기록이 나온다(mulberry32). 실제 일기·식별정보는 넣지 않는다(AGENTS §3) — 문장은 모두 '가짜 일기'다.
// 통계 확인에 쓰려고 고르게 섞는다: 빈 날, 계열 1~3개, 세부 감정 1~3개와 서로 다른 크기, 최근에 계단처럼 바뀌는 계열(높음·낮음·비슷함이
// 다 나오게), 쓰던 글(임시저장), 뒤늦게 마무리한 지난 날(첫 완료 날짜가 그 다음 날 — 이어서 쓴 날을 채우지 않는다).
import taxonomy from "../../data/taxonomy/v2.json" with { type: "json" };

export const TAXONOMY_VERSION = taxonomy.version;
const CATEGORIES = taxonomy.categories.map((category) => ({
  code: category.code,
  emotions: category.emotions.map((emotion) => ({ code: emotion.code, label: emotion.label_ko }))
}));

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function addDays(iso, days) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

// 계열마다: p = 기록한 날에 나올 확률, base = 앞쪽 크기, step = 마지막 recent일 동안 더해지는 변화
const PROFILE = {
  enjoyment: { p: 0.7, base: 5, step: 0 },
  wish: { p: 0.15, base: 5, step: 0 },
  sadness: { p: 0.6, base: 6.5, step: -2.5 },
  anger: { p: 0.45, base: 4, step: 3 },
  joy: { p: 0.65, base: 5, step: 0 },
  love: { p: 0.35, base: 5, step: 0 },
  hate: { p: 0.1, base: 5, step: 0 },
  fear: { p: 0.3, base: 6, step: 0 },
  disgust: { p: 0 }
};

/**
 * end(포함)에서 거꾸로 count일의 기록. 그날 기록이 없으면 빠진다. 반환은 diary-entry-v2(DiaryEntryView) 배열, 날짜 오름차순.
 * options: seed(기본 7), recordRate(기본 0.75), recent(계단이 시작되는 마지막 날 수, 기본 30 — 30일 보기에서 높음·낮음이 나온다), drafts(쓰던 글로 둘 날 수, 기본 2),
 * backdated(뒤늦게 마무리한 날 수, 기본 1), skipToday(end 날을 비울지, 기본 true — 오늘은 사용자가 직접 쓴다)
 */
export function syntheticDiaries(end, count, options = {}) {
  const { seed = 7, recordRate = 0.75, recent = 30, drafts = 2, backdated = 1, skipToday = true } = options;
  const rng = mulberry32(seed);
  const out = [];
  for (let back = count - 1; back >= 0; back -= 1) {
    const date = addDays(end, -back);
    if (skipToday && back === 0) continue;
    if (rng() >= recordRate) continue;
    const cats = CATEGORIES.filter((category) => rng() < (PROFILE[category.code]?.p ?? 0)).slice(0, 3);
    if (!cats.length) continue;
    const categories = [];
    const emotions = [];
    for (const category of cats) {
      const profile = PROFILE[category.code];
      const level = profile.base + (back < recent ? profile.step : 0);
      const picked = new Set();
      const wanted = rng() < 0.5 ? 1 : rng() < 0.8 ? 2 : 3;
      while (picked.size < Math.min(wanted, category.emotions.length)) picked.add(Math.floor(rng() * Math.min(12, category.emotions.length)));
      const sizes = [...picked].map(() => Math.max(1, Math.min(10, Math.round(level + (rng() - 0.5) * 3))));
      categories.push({ categoryCode: category.code, intensity: Math.round(sizes.reduce((sum, value) => sum + value, 0) / sizes.length) });
      [...picked].forEach((index, order) => {
        const emotion = category.emotions[index];
        emotions.push({ categoryCode: category.code, emotionCode: emotion.code, labelSnapshot: emotion.label, intensity: sizes[order], custom: order > 0 });
      });
    }
    out.push({ date, categories, emotions, index: out.length });
  }
  // 끝에서부터 쓰던 글 drafts개(오늘 직전 날들 제외 — 가장 최근 몇 날은 완료로 남겨 이어서 쓴 날이 보이게), 그 앞에 뒤늦게 마무리한 날 backdated개
  const draftDates = new Set(out.slice(-5 - drafts, -5).map((item) => item.date));
  const lateDates = new Set(out.slice(-5 - drafts - backdated, -5 - drafts).map((item) => item.date));
  return out.map(({ date, categories, emotions, index }) => {
    const draft = draftDates.has(date);
    const firstLocal = draft ? null : lateDates.has(date) ? addDays(date, 1) : date;
    const at = `${date}T12:00:00.000Z`;
    const sentence = `가짜 일기 ${index + 1}번: 오늘은 산책을 하고 저녁에 책을 조금 읽었다. `;
    return {
      schemaVersion: "diary-entry-v2",
      id: `00000000-0000-4000-8000-${String(seed).padStart(4, "0")}${String(index).padStart(8, "0")}`,
      entryDate: date,
      timezone: "Asia/Seoul",
      status: draft ? "draft" : "completed",
      revision: draft ? 1 : 3,
      taxonomyVersion: TAXONOMY_VERSION,
      eventText: sentence.repeat(2),
      reasonText: draft ? "" : sentence,
      categories,
      emotions,
      praises: draft ? [] : [{ slot: 1, text: "끝까지 해냈다" }],
      gratitudes: draft ? [] : [{ slot: 1, text: "같이 걸어 준 친구" }],
      resume: { step: draft ? "reason" : "letter", categoryCode: null },
      firstCompletedAt: firstLocal ? `${firstLocal}T12:00:00.000Z` : null,
      firstCompletedLocalDate: firstLocal,
      completedAt: firstLocal ? `${firstLocal}T12:00:00.000Z` : null,
      createdAt: at,
      updatedAt: at
    };
  });
}
