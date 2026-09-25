// 저장이 없는 시안이라 달력·통계·기록 상세의 지난 날은 지어낸 예시다. 날짜 숫자로 정한 고정 무늬라 볼 때마다 같다(무작위가 아니다).
// 실제로 작성한 기록(완료)과 작성 중인 글(임시저장)은 예시보다 앞서며 그날의 상태를 따른다.
import { state, toISO, todayISO, hasDraftContent, discarded } from "./state.js";
import { data } from "./data.js";

export const STATUS = { none: "기록 없음", draft: "임시저장", completed: "완료", future: "미래 — 고를 수 없음" };
const sampleStatus = (day) => day % 7 === 3 ? "draft" : day % 3 === 0 ? "none" : "completed";
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

// 하루 기준 시각(D-081)을 반영한 '오늘'(자정 기준 Date). 새벽 4시 전에는 전날이다.
export const effectiveToday = () => { const [y, m, d] = todayISO().split("-").map(Number); return new Date(y, m - 1, d); };

// 날짜 하나의 상태. 날짜 전체를 비교하므로 달을 넘어가는 경우에도 맞다.
export function dayStatus(date, now = effectiveToday()) {
  if (startOfDay(date) > startOfDay(now)) return "future";
  const iso = toISO(date);
  if (state.completed?.date === iso) return "completed";
  if (state.draft.date === iso && hasDraftContent()) return "draft";
  if (startOfDay(date) === startOfDay(now)) return "none";
  if (discarded.has(iso)) return "none"; // 사용자가 지운 예시 임시저장(D-082)
  return sampleStatus(date.getDate());
}

// 지난 날의 예시 기록(편지 읽기용). 날짜 숫자로 계열·글을 고른다.
const PICKS = [["joy", "love"], ["sadness"], ["anger", "sadness"], ["enjoyment"], ["fear"], ["wish", "joy"], ["hate", "anger"], ["love"], ["disgust"], ["joy"]];
const EVENTS = ["점심에 오랜만에 친구를 만났다.", "회의에서 내 의견이 받아들여졌다.", "퇴근길에 옆 사람과 부딪혀 화가 났다.", "혼자 오래 산책을 했다.", "새로 맡은 일이 걱정됐다."];
const REASONS = ["오랜만에 웃었지만 헤어질 때 허전했다.", "인정받은 느낌이 오래 남았다.", "사과를 듣지 못한 게 계속 걸렸다.", "걷는 동안 생각이 천천히 가라앉았다.", "잘할 수 있을지 확신이 없었다."];
const PRAISES = ["오랜만에 친구를 만나러 나갔어요", "내 생각을 끝까지 말했어요", "화가 난 채로도 일을 마쳤어요", "", "걱정을 말로 꺼내 봤어요"];
const THANKS = ["", "같이 일하는 사람들이 고마웠어요", "", "따뜻한 햇볕", ""];

export function sampleRecord(iso, catsOverride = null) { // catsOverride: QA용(#/write?s=done&c=joy,sadness)
  const day = Number(iso.slice(8, 10)), cats = catsOverride ?? PICKS[day % PICKS.length];
  const emotions = [], repr = {};
  cats.forEach((cat, ci) => {
    const list = data.categories.find((c) => c.code === cat).emotions;
    for (const k of ci === 0 ? [0, 1] : [0]) emotions.push({ ...list[(day * 3 + k * 5) % list.length], own: null });
    repr[cat] = ((day + ci * 3) % 8) + 2;
  });
  const i = day % EVENTS.length;
  return { date: iso, event: EVENTS[i], cats: [...cats], emotions, repr, reason: REASONS[i], praise: [PRAISES[i], "", ""], thanks: [THANKS[day % THANKS.length], "", ""] };
}
