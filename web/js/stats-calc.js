// 통계 순수 계산 함수(D1, Sub-D). DOM·fetch·다른 화면 모듈에 의존하지 않는다 — 나중에 서버(DATA_MODEL §7)로 그대로 옮길 수 있다.
// 입력 표본은 Map<ISO문자열, DayRecord>다. DayRecord = { recorded:false } | { recorded:true, cats:[{code,size,words:[...]}] }.
// size는 "그날 그 계열 행들의 크기 평균"(작업 지시)을 이미 반영한 값 하나다 — 시안 표본은 계열·날마다 값 하나를 두므로 여기서 다시 평균 내지 않는다.
// 서로 다른 계열의 크기는 어디에서도 합쳐 평균 내지 않는다(SERVICE_WHY §12, DESIGN_SYSTEM §6.10 — 섞인 평균은 뜻 없는 "기분 점수"로 읽힌다).

const pad = (n) => String(n).padStart(2, "0");
const fromISO = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const addDays = (iso, n) => { const d = fromISO(iso); d.setDate(d.getDate() + n); return toISO(d); };

// 평균 표시는 n≥3부터(작은 수의 법칙 — 적은 기록을 과하게 읽지 않는다). 친밀도(D-064)와 같은 문턱을 크기 추세에도 그대로 쓴다.
export const MIN_DAYS = 5;
export const MIN_N_FOR_MEAN = 3;

// 오래된 날 → 최근 날. endISO를 포함해 len일.
export function periodDates(endISO, len) {
  const out = [];
  for (let i = len - 1; i >= 0; i -= 1) out.push(addDays(endISO, -i));
  return out;
}

const round1 = (v) => Math.round(v * 10) / 10;

// 기간 + 계열 하나의 기술치. 평균·표준편차는 반올림 전 값(meanRaw)을 함께 돌려준다 — compare()가 반올림 전 값으로 Δ를 계산해야 하기 때문이다(작업 지시).
export function categorySummary(sampleDays, dates, catCode) {
  const days = [];
  for (const iso of dates) {
    const rec = sampleDays.get(iso);
    if (!rec?.recorded) continue; // 기록하지 않은 날은 0이 아니라 빈 값 — 그냥 건너뛴다(선을 끊는 이유)
    const c = rec.cats.find((x) => x.code === catCode);
    if (c) days.push({ date: iso, v: c.size });
  }
  const n = days.length;
  const values = days.map((d) => d.v);
  const meanRaw = n ? values.reduce((a, b) => a + b, 0) / n : null;
  const min = n ? Math.min(...values) : null;
  const max = n ? Math.max(...values) : null;
  // 표본표준편차(n−1). n=1이면 정의되지 않아 0으로 둔다 — n<3이라 compare()·평균 표시 모두 이 값을 쓰지 않는다.
  const sd = n >= 2 ? Math.sqrt(values.reduce((a, b) => a + (b - meanRaw) ** 2, 0) / (n - 1)) : 0;
  return { code: catCode, n, days, mean: n ? round1(meanRaw) : null, meanRaw, min, max, sd };
}

// 기간 요약: 기록한 날 수(전체 계열 통틀어 하루라도 기록했으면 1) + 계열마다 categorySummary.
export function periodSummary(sampleDays, dates, catCodes) {
  const recorded = dates.filter((iso) => sampleDays.get(iso)?.recorded).length;
  const byCat = {};
  for (const code of catCodes) byCat[code] = categorySummary(sampleDays, dates, code);
  return { dates, recorded, byCat };
}

// 이어서 쓴 날(작성 streak의 화면 말, D-065 ④): 오늘 또는 어제로 끝나는 연속 기록일 수.
export function currentStreak(sampleDays, todayISO) {
  let end = null;
  if (sampleDays.get(todayISO)?.recorded) end = todayISO;
  else { const y = addDays(todayISO, -1); if (sampleDays.get(y)?.recorded) end = y; }
  if (!end) return 0;
  let count = 0, cur = end;
  while (sampleDays.get(cur)?.recorded) { count += 1; cur = addDays(cur, -1); }
  return count;
}

// 자주 머문 말: 기간 안 세부 감정 낱말 빈도 상위 limit. 동률은 기간 안에서 먼저(더 오래전) 나온 말이 앞선다(안정 정렬 + 날짜 오름차순 순회).
export function topWords(sampleDays, dates, limit = 5) {
  const freq = new Map();
  for (const iso of dates) {
    const rec = sampleDays.get(iso);
    if (!rec?.recorded) continue;
    for (const c of rec.cats) for (const w of c.words) freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

// Welch 두 표본 t검정의 95% 양측 임계값. df는 호출 쪽에서 내림(보수적)해 정수로 넘긴다. df>30은 1.96(표를 벗어나면 정규근사).
const T_TABLE = [12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.160, 2.145, 2.131, 2.120, 2.110, 2.101, 2.093, 2.086, 2.080, 2.074, 2.069, 2.064, 2.060, 2.056, 2.052, 2.048, 2.045, 2.042];
export const tCritical = (df) => (df > 30 ? 1.96 : T_TABLE[Math.max(1, df) - 1]);

// 기간 비교(작업 지시의 정확한 절차). cur·prev는 categorySummary()의 결과다. 둘 다 n≥3일 때만 계산하고, 아니면 null.
// dir: |Δ|≥1.0이고(SE=0이거나 |Δ|≥t·SE)면 "up"/"down", 아니면 "same". 평가어(좋아졌다 등)·색은 이 함수가 다루지 않는다(그리는 쪽의 몫이 아니다 — 애초에 만들지 않는다).
export function compare(cur, prev) {
  if (!cur || !prev || cur.n < MIN_N_FOR_MEAN || prev.n < MIN_N_FOR_MEAN) return null;
  const delta = cur.meanRaw - prev.meanRaw;
  const a = (cur.sd ** 2) / cur.n, b = (prev.sd ** 2) / prev.n;
  const se = Math.sqrt(a + b);
  let dir = "same";
  if (Math.abs(delta) >= 1) {
    if (se === 0) dir = delta > 0 ? "up" : "down";
    else {
      const df = Math.floor((a + b) ** 2 / ((a ** 2) / (cur.n - 1) + (b ** 2) / (prev.n - 1)));
      if (Math.abs(delta) >= tCritical(df) * se) dir = delta > 0 ? "up" : "down";
    }
  }
  return { delta, dir, prevMean: prev.mean, prevN: prev.n };
}

// ── 결정론적 표본(작업 지시 §D1-2) ──────────────────────────────────────────
// mulberry32: 씨앗이 같으면 항상 같은 수열이다(외부 라이브러리 없이 자주 쓰이는 소형 PRNG).
function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 계열마다 손으로 정한 프로필. p는 기록한 날 하루에 그 계열이 등장할 확률(계열마다 독립),
// base는 초반 30일의 크기 수준, step30은 최근 30일에 더해지는 변화(day index 30부터), step7은 최근 7일에 더 더해지는 변화(day index 53부터).
// 세 계열(sadness↓·joy↑는 최근 30일, anger↑·fear↓는 최근 7일)만 뚜렷한 계단을 주고 나머지는 평평하게 둬 '비슷해요'가 나오게 했다 —
// 완료 기준의 "compare 결과에 높아요·낮아요·비슷해요가 적어도 하나씩" 요구를 이 계단으로 만족시킨다.
// seed=52는 1~20000 전수 탐색(검증 스크립트, 작업 폴더 보관)으로 고른 값이다 — 이 seed에서 실제로 7일·30일 보기 모두
// recorded≥5(7일)·n≥3/n<3 혼재·up·down·same 각 1회 이상이 나옴을 확인했다. PROFILE 값을 고치면 이 seed도 다시 찾아야 한다.
const SEED = 52;
const PROFILE = {
  enjoyment: { p: 0.78, base: 5, step30: 0, step7: 0 },
  wish: { p: 0.15, base: 5, step30: 0, step7: 0 },
  sadness: { p: 0.80, base: 6.5, step30: -1.5, step7: 0 },
  anger: { p: 0.75, base: 5, step30: 0, step7: 2.5 },
  joy: { p: 0.78, base: 4.5, step30: 2.0, step7: 0 },
  love: { p: 0.40, base: 5, step30: 0, step7: 0 },
  hate: { p: 0.12, base: 5, step30: 0, step7: 0 },
  fear: { p: 0.42, base: 6, step30: 0, step7: -3 },
  disgust: { p: 0.10, base: 5, step30: 0, step7: 0 }
};
const DAY_RECORD_P = 0.72;

function pickWords(rng, emotions, count) {
  const pool = emotions.slice(0, Math.min(10, emotions.length));
  const chosen = [];
  let guard = 0;
  while (chosen.length < Math.min(count, pool.length) && guard < 30) {
    const w = pool[Math.floor(rng() * pool.length)].label;
    if (!chosen.includes(w)) chosen.push(w);
    guard += 1;
  }
  return chosen;
}

function levelFor(code, dayIndex) {
  const prof = PROFILE[code];
  let level = prof.base;
  if (dayIndex >= 30) level += prof.step30;
  if (dayIndex >= 53) level += prof.step7;
  return level;
}

// 60일 표본(오늘에서 거꾸로 59일까지). categories는 data.categories(taxonomy 선언 순서)를 그대로 넘긴다.
export function buildSample(todayISO, categories, seed = SEED) {
  const rng = mulberry32(seed);
  const order = categories.map((c) => c.code);
  const byCode = new Map(categories.map((c) => [c.code, c]));
  const days = new Map();
  for (let i = 0; i < 60; i += 1) {
    const iso = addDays(todayISO, i - 59);
    if (rng() >= DAY_RECORD_P) { days.set(iso, { recorded: false }); continue; }
    const cats = [];
    for (const code of order) {
      if (rng() < PROFILE[code].p) {
        const level = levelFor(code, i);
        const jitter = (rng() - 0.5) * 2.4;
        const size = Math.max(1, Math.min(10, Math.round(level + jitter)));
        const wc = rng() < 0.5 ? 1 : rng() < 0.85 ? 2 : 3;
        cats.push({ code, size, words: pickWords(rng, byCode.get(code).emotions, wc) });
      }
    }
    if (!cats.length) { // 계열이 하나도 안 걸리면 그 날은 기록 없음으로 둔다(억지로 채우지 않는다 — 70%는 이미 하루 단위에서 결정했다)
      days.set(iso, { recorded: false });
      continue;
    }
    if (cats.length > 3) cats.length = 3; // 저장 시안 상한(마음 고르기는 여러 개 가능하나 표본은 최대 3개로 둔다, 작업 지시)
    days.set(iso, { recorded: true, cats });
  }
  return days;
}

// #/stats?s=few용 고정 표본: 기록 5일 미만(친밀도·크기 추세 모두 빈 상태) — 기간(7·30일)과 무관하게 항상 같다.
export function buildFewSample(todayISO, categories) {
  const days = new Map();
  for (let i = 0; i < 60; i += 1) days.set(addDays(todayISO, i - 59), { recorded: false });
  const byCode = new Map(categories.map((c) => [c.code, c]));
  const set = (offset, code, size) => days.set(addDays(todayISO, offset), { recorded: true, cats: [{ code, size, words: [byCode.get(code).emotions[0].label] }] });
  set(0, "sadness", 6);
  set(-2, "anger", 4);
  set(-5, "joy", 7);
  return days;
}
