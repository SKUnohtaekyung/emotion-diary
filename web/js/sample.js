// 저장이 없는 시안이라 달력·통계·기록 상세의 지난 날은 지어낸 예시다. 볼 때마다 같다(고정 씨앗·날짜 규칙 — 매번 바뀌는 무작위가 아니다).
// 최근 60일은 통계 표본(stats-calc.js buildSample)을 그대로 따른다 — 통계의 '함께한 날'을 눌러 달력에 가면 같은 날·같은 계열·같은 크기가 보여야 한다(D-091 ②).
// 그 표본에서 기록 없는 날 중 날짜 규칙상 임시저장인 날은 임시저장으로 남겨 달력이 모든 상태를 보이게 한다. 60일보다 앞은 날짜 규칙만 쓴다.
// 실제로 작성한 기록(완료)과 작성 중인 글(임시저장)은 예시보다 앞서며 그날의 상태를 따른다.
import { state, toISO, todayISO, hasDraftContent, discarded } from "./state.js";
import { data } from "./data.js";
import { buildSample } from "./stats-calc.js";

export const STATUS = { none: "기록 없음", draft: "임시저장", completed: "완료", future: "미래 — 고를 수 없음" };
const sampleStatus = (day) => day % 7 === 3 ? "draft" : day % 3 === 0 ? "none" : "completed";
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

// 하루 기준 시각(D-081)을 반영한 '오늘'(자정 기준 Date). 새벽 4시 전에는 전날이다.
export const effectiveToday = () => { const [y, m, d] = todayISO().split("-").map(Number); return new Date(y, m - 1, d); };

// 통계와 같은 표본(오늘이 바뀌면 다시 만든다). 없으면 null — 60일 창 밖이거나 표본에 없는 날.
let shared = { today: null, days: null };
export function statsDay(iso) {
  const t = todayISO();
  if (shared.today !== t) shared = { today: t, days: buildSample(toISO(effectiveToday()), data.categories) };
  return shared.days.get(iso) ?? null;
}

// 날짜 하나의 상태. 날짜 전체를 비교하므로 달을 넘어가는 경우에도 맞다.
export function dayStatus(date, now = effectiveToday()) {
  if (startOfDay(date) > startOfDay(now)) return "future";
  const iso = toISO(date);
  if (state.completed?.date === iso) return "completed";
  if (state.draft.date === iso && hasDraftContent()) return "draft";
  if (startOfDay(date) === startOfDay(now)) return "none";
  if (discarded.has(iso)) return "none"; // 사용자가 지운 예시 임시저장(D-082)
  const s = statsDay(iso);
  if (s) return s.recorded ? "completed" : sampleStatus(date.getDate()) === "draft" ? "draft" : "none";
  return sampleStatus(date.getDate());
}

// 지난 날의 예시 기록(편지 읽기용). 날짜 숫자로 계열·글을 고른다.
const PICKS = [["joy", "love"], ["sadness"], ["anger", "sadness"], ["enjoyment"], ["fear"], ["wish", "joy"], ["hate", "anger"], ["love"], ["disgust"], ["joy"]];
const EVENTS = ["점심에 오랜만에 친구를 만났다.", "회의에서 내 의견이 받아들여졌다.", "퇴근길에 옆 사람과 부딪혀 화가 났다.", "혼자 오래 산책을 했다.", "새로 맡은 일이 걱정됐다."];
const REASONS = ["오랜만에 웃었지만 헤어질 때 허전했다.", "인정받은 느낌이 오래 남았다.", "사과를 듣지 못한 게 계속 걸렸다.", "걷는 동안 생각이 천천히 가라앉았다.", "잘할 수 있을지 확신이 없었다."];
const PRAISES = ["오랜만에 친구를 만나러 나갔어요", "내 생각을 끝까지 말했어요", "화가 난 채로도 일을 마쳤어요", "", "걱정을 말로 꺼내 봤어요"];
const THANKS = ["", "같이 일하는 사람들이 고마웠어요", "", "따뜻한 햇볕", ""];

// 통계 표본의 날은 그날 첫 계열에 어울리는 있었던 일·이유를 고른다(2026-09-27, D-102 — 통계 친구 상세가 그날 '있었던 일'을 미리 보여 주는데,
// 날짜 숫자로만 고르면 슬픔인 날에 '의견이 받아들여졌다'가 나와 어색했다). 모두 지어낸 일반 문장이다(실제 일기 아님, AGENTS §3).
const STORIES = {
  joy: [["오래 준비한 일이 잘 끝났다.", "애쓴 만큼 돌아온 것 같았다."], ["좋아하는 가수의 공연 표를 구했다.", "기다리던 일이 생겨 설렜다."]],
  enjoyment: [["주말에 친구들과 보드게임을 했다.", "아무 생각 없이 웃을 수 있었다."], ["혼자 오래 산책을 했다.", "걷는 동안 생각이 천천히 가라앉았다."]],
  love: [["가족과 저녁을 오래 먹었다.", "함께 있는 시간이 편했다."], ["친구가 먼저 안부를 물어 왔다.", "나를 떠올려 준 게 고마웠다."]],
  wish: [["다음 학기 계획을 세워 봤다.", "해 보고 싶은 게 분명해졌다."], ["가 보고 싶은 곳의 사진을 모았다.", "언젠가 꼭 가고 싶었다."]],
  sadness: [["친구 답장이 하루 종일 없었다.", "나만 신경 쓰는 것 같아 서운했다."], ["준비한 발표가 미뤄졌다.", "애쓴 게 허무하게 느껴졌다."], ["결과 메일을 열기가 무서웠다.", "기대한 만큼 실망할까 봐 겁이 났다."]],
  anger: [["퇴근길에 옆 사람과 부딪혔다.", "사과를 듣지 못한 게 계속 걸렸다."], ["약속이 말없이 취소됐다.", "내 시간이 가볍게 여겨진 것 같았다."]],
  fear: [["새로 맡은 일이 걱정됐다.", "잘할 수 있을지 확신이 없었다."], ["밤늦게 혼자 집에 왔다.", "골목이 유난히 어두웠다."]],
  hate: [["단체 대화방에서 뒷말을 봤다.", "그 말투가 계속 떠올랐다."], ["같은 실수를 또 했다.", "나한테 실망스러웠다."]],
  disgust: [["지하철 안이 너무 붐볐다.", "숨이 막히는 느낌이었다."], ["식당 위생이 엉망이었다.", "먹고 싶은 마음이 사라졌다."]],
};

export function sampleRecord(iso, catsOverride = null) { // catsOverride: QA용(#/write?s=done&c=joy,sadness)
  const day = Number(iso.slice(8, 10));
  const s = catsOverride ? null : statsDay(iso);
  if (s?.recorded) { // 통계 표본의 그날: 계열·크기·세부 감정을 그대로 쓴다
    const emotions = s.cats.flatMap(({ code, words }) => { const list = data.categories.find((c) => c.code === code).emotions; return words.map((w) => ({ ...list.find((e) => e.label === w), own: null })); });
    const repr = Object.fromEntries(s.cats.map(({ code, size }) => [code, size]));
    const i = day % EVENTS.length;
    // 그날 가장 크게 머문 계열(같으면 표본 순서 먼저)의 문장 — 표본은 계열을 taxonomy 순서로 담아 '첫 계열'이 거의 늘 즐거움이었다.
    // 번호는 월·일을 섞어 고른다(일만 쓰면 짝수 날마다 같은 문장이 나왔다).
    const main = s.cats.reduce((a, c) => (c.size > a.size ? c : a), s.cats[0]);
    const pool = STORIES[main?.code];
    const [event, reason] = pool ? pool[(day * 7 + Number(iso.slice(5, 7)) * 3) % pool.length] : [EVENTS[i], REASONS[i]];
    return { date: iso, event, cats: s.cats.map((c) => c.code), emotions, repr, reason, praise: [PRAISES[i], "", ""], thanks: [THANKS[day % THANKS.length], "", ""] };
  }
  const cats = catsOverride ?? PICKS[day % PICKS.length];
  const emotions = [], repr = {};
  cats.forEach((cat, ci) => {
    const list = data.categories.find((c) => c.code === cat).emotions;
    for (const k of ci === 0 ? [0, 1] : [0]) emotions.push({ ...list[(day * 3 + k * 5) % list.length], own: null });
    repr[cat] = ((day + ci * 3) % 8) + 2;
  });
  const i = day % EVENTS.length;
  return { date: iso, event: EVENTS[i], cats: [...cats], emotions, repr, reason: REASONS[i], praise: [PRAISES[i], "", ""], thanks: [THANKS[day % THANKS.length], "", ""] };
}
