// 돌아보기·내 기준·해 보는 길 시안의 상태(TASK-LOOKBACK-01 단계 A, 2판). 저장하지 않는다 — 이 모듈의 변수에만 있고 새로 고치면 처음으로 돌아간다.
// 기준과 길의 문장은 모두 지어낸 예시다(실제 일기 아님, AGENTS §3).
// 상태 바꾸기(QA): ?lbs=empty|few|one|some|many(기록·기준의 양), ?lbx=none|active|ended(해 보는 길), ?lbt=thanks|joy|big|none|recent(전하기 한 줄이 나오는 까닭), ?kb=1.
import { state, toISO } from "../state.js";
import { dayStatus, sampleRecord, effectiveToday } from "../sample.js";

// 초안 바꾸기(QA): ?lb=2b.4c 처럼 붙인다 — 2 돌아보기(a 쪽지 묶음·b 길 따라·c 한 장씩) · 4 내 기준(a 눌러 둔 쪽지·b 노트 한 장·c 큰 글자) · 5 해 보는 길 정하기(a 칸·b 문장) · 6 오늘 화면 팻말(a 등불·b 반딧불·c 글 한 줄).
export const choice = { read: "c", note: "b", path: "b", sign: "c" }; // 기본값은 3판에서 권하는 초안이다
const KEYS = { 2: "read", 4: "note", 5: "path", 6: "sign" };
export const qa = { amount: "normal", tell: null, keyboard: false };

const addDays = (iso, n) => { const [y, m, d] = iso.split("-").map(Number); return toISO(new Date(y, m - 1, d + n)); };
export const todayIso = () => toISO(effectiveToday());
export const shiftDay = addDays;
export const monthDay = (iso) => `${Number(iso.slice(5, 7))}월 ${Number(iso.slice(8, 10))}일`;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
export const weekday = (iso) => { const [y, m, d] = iso.split("-").map(Number); return WEEKDAYS[new Date(y, m - 1, d).getDay()]; };
export const monthDayWeek = (iso) => `${monthDay(iso)} (${weekday(iso)})`;

export const lb = { marks: new Set(), standards: [], path: null, past: [], seq: 100 };

export const recordOf = (iso) => (state.completed?.date === iso ? state.completed : sampleRecord(iso));
const isRecorded = (iso) => { const [y, m, d] = iso.split("-").map(Number); return dayStatus(new Date(y, m - 1, d)) === "completed"; };
// 오늘을 끝으로 하는 n일 가운데 기록을 남긴 날(오래된 날부터).
export function recordedDays(n, end = todayIso()) {
  if (qa.amount === "empty") return [];
  const days = [];
  for (let k = n - 1; k >= 0; k -= 1) { const iso = addDays(end, -k); if (isRecorded(iso)) days.push(iso); }
  return qa.amount === "few" ? days.slice(-2) : days;
}
export const recordedBetween = (from, to) => recordedDays(60, to).filter((iso) => iso >= from);

const LINES = ["약속이 깨질 때 크게 흔들린다", "혼자 있는 저녁이 필요하다", "애쓴 일은 누가 알아주지 않아도 끝까지 하고 싶다", "사람이 많은 곳에서는 금방 지친다",
  "먼저 연락하는 쪽이 늘 나일 때 서운하다", "걷고 나면 생각이 가라앉는다", "계획이 갑자기 바뀌면 화부터 난다", "고맙다는 말을 들으면 오래 남는다",
  "밤늦게 답장을 기다리지 않기로 한다", "새로운 일 앞에서는 먼저 겁이 난다", "가족과 밥을 먹는 시간이 편하다", "뒷말을 들으면 그 자리를 피하고 싶다",
  "해야 할 일을 미루면 하루가 무겁다", "좋아하는 것을 기다리는 시간이 즐겁다", "실수를 하면 나에게 먼저 실망한다", "붐비는 곳에 오래 있기 힘들다",
  "아침에 서두르면 하루가 흐트러진다", "말을 끝까지 들어 주는 사람이 좋다", "부탁을 거절하지 못한 날은 오래 마음에 남는다", "조용한 주말이 한 번은 있어야 한다"];
const AMOUNT = { empty: 0, few: 0, one: 1, normal: 3, some: 5, many: 20 };

function seed() {
  const days = recordedDays(30), t = todayIso();
  const pick = (k) => days[Math.max(0, days.length - 1 - k)];
  lb.marks = new Set(qa.amount === "empty" ? [] : [pick(1), pick(4), pick(7)].filter(Boolean));
  const n = AMOUNT[qa.amount] ?? 3;
  lb.standards = LINES.slice(0, n).map((text, i) => ({ id: i + 1, text, folded: false, at: addDays(t, -(2 + i * 3)),
    from: i === 0 ? [pick(4), pick(1)].filter(Boolean) : i === 1 ? [pick(7)].filter(Boolean) : i % 4 === 0 ? [pick(i)].filter(Boolean) : [] }));
  if (qa.amount === "normal") lb.standards.push({ id: 9, text: LINES[3], folded: true, at: addDays(t, -20), from: [] });
  if (n >= 20) lb.standards[2].text = "애쓴 일은 누가 알아주지 않아도 끝까지 해 보고 싶고, 그러다 지치면 하루쯤은 아무것도 하지 않고 쉬어도 된다고 나에게 말해 주고 싶다";
}
export function seedPath(kind) {
  const t = todayIso(), base = { when: "서운한 마음이 들 때", what: "하루 뒤에 말하기", days: 7 };
  if (kind === "none") lb.path = null;
  if (kind === "active") lb.path = { ...base, start: addDays(t, -3), walked: new Set([addDays(t, -3), addDays(t, -1)]) };
  if (kind === "ended") lb.path = { ...base, start: addDays(t, -8), walked: new Set([addDays(t, -8), addDays(t, -6), addDays(t, -5), addDays(t, -2)]) };
}
export const pathEnd = (x = lb.path) => (x ? addDays(x.start, x.days - 1) : null);
export const pathState = () => (!lb.path ? "none" : todayIso() > pathEnd() ? "ended" : "active");
export const pathDays = (x = lb.path) => Array.from({ length: x.days }, (_, k) => addDays(x.start, k));

let seeded = false;
export function readParams(params) {
  let reseed = !seeded;
  for (const part of (params.get("lb") ?? "").split(/[.,]/)) { const m = /^([2456])([abc])$/.exec(part); if (m) choice[KEYS[m[1]]] = m[2]; }
  const amount = params.get("lbs");
  if (amount in AMOUNT && amount !== qa.amount) { qa.amount = amount; reseed = true; }
  if (params.has("lbt")) qa.tell = params.get("lbt");
  if (params.has("kb")) qa.keyboard = params.get("kb") === "1";
  if (reseed) { seed(); if (!seeded) seedPath("active"); seeded = true; }
  const x = params.get("lbx");
  if (["none", "active", "ended"].includes(x)) seedPath(x);
}

export const toggleMark = (iso) => { if (lb.marks.has(iso)) { lb.marks.delete(iso); return false; } lb.marks.add(iso); return true; };
export function saveStandard({ id, text, from = [] }) {
  const found = lb.standards.find((s) => s.id === id);
  if (found) { found.text = text; found.from = from; return found; }
  const made = { id: (lb.seq += 1), text, from, folded: false, at: todayIso() };
  lb.standards.unshift(made);
  return made;
}
export const removeStandard = (id) => { lb.standards = lb.standards.filter((s) => s.id !== id); };
export const EXAMPLES = [["서운한 마음이 들 때", "하루 뒤에 말하기"], ["잠자리에 들기 30분 전", "화면 끄기"], ["답하기 전에", "한 박자 쉬기"], ["궁금한 곳이 생기면", "글 말고 직접 가 보기"]];
export const DAY_CHOICES = [3, 5, 7, 14];

// ── 여러 날에 나온 말(기계적으로 센 것이다 — 뜻을 풀거나 까닭을 대지 않는다). 고른 말은 그대로 세고, 적은 글은 낱말 끝의 조사를 한 번 떼어 센다.
// 시안의 셈은 거칠다: 실제 코드에서는 형태소 분석이 필요하다(검토 페이지의 '기술 계획').
const JOSA = /(으로|에서|에게|한테|까지|부터|처럼|이나|이|가|을|를|은|는|에|의|도|와|과|로|만)$/;
const SKIP = new Set(["오늘", "그날", "계속", "같았다", "같아", "것", "게", "내", "나", "나만", "너무", "조금", "오래", "하루", "종일", "거의", "했다", "됐다", "있었다", "없었다", "느낌", "마음", "시간", "말", "일"]);
export function repeated(days) {
  const words = new Map(), picks = new Map();
  const add = (map, key, iso) => { if (!map.has(key)) map.set(key, new Set()); map.get(key).add(iso); };
  for (const iso of days) {
    const rec = recordOf(iso);
    for (const e of rec.emotions) add(picks, e.label, iso);
    for (const raw of `${rec.event} ${rec.reason}`.split(/[^가-힣]+/)) { const w = raw.replace(JOSA, ""); if (w.length >= 2 && !SKIP.has(w) && !SKIP.has(raw) && !/(다|한|던|는|게|서|고|지|면|워|해)$/.test(w)) add(words, w, iso); }
  }
  const top = (map, kind, max) => [...map.entries()].filter(([, s]) => s.size >= 2).sort((a, b) => b[1].size - a[1].size).slice(0, max).map(([word, s]) => ({ word, kind, days: [...s].sort() }));
  return [...top(words, "word", 4), ...top(picks, "pick", 3)];
}

// ── 전하기 한 줄이 나오는 날(검토 페이지의 '기술 계획'). 사용자가 직접 고르고 적은 것만 본다 — 글의 뜻을 읽지 않는다.
// thanks: 감사 칸에 적은 날 · joy: 기쁨·즐거움·사랑이 가장 크게 머문 날(크기 7 이상) · big: 그 밖의 마음이 크게 머문 날(7 이상). recent: 최근 사흘 안에 이미 나왔으면 쉬어 간다.
const WARM = ["joy", "enjoyment", "love"];
export function tellReason(entry) {
  if (qa.tell) return ["thanks", "joy", "big"].includes(qa.tell) ? qa.tell : null;
  if (entry.thanks?.some((t) => t.trim())) return "thanks";
  const cats = entry.cats.filter((c) => entry.repr[c] != null);
  const top = cats.reduce((a, c) => (entry.repr[c] > (entry.repr[a] ?? 0) ? c : a), cats[0]);
  if (!top || entry.repr[top] < 7) return null;
  return WARM.includes(top) ? "joy" : "big";
}
