// 돌아보기·내 기준·작은 실험 시안의 상태(TASK-LOOKBACK-01 단계 A). 저장하지 않는다 — 이 모듈의 변수에만 있고 새로 고치면 처음으로 돌아간다.
// 기준과 실험의 문장은 모두 지어낸 예시다(실제 일기 아님, AGENTS §3).
// 안 바꾸기(QA): 주소에 ?lb=2a.3b 처럼 붙인다 — 숫자는 갈림길(tasks/lookback/2026-11-12/FORKS.md), 글자는 안. 한 번 정하면 그 문서 안에서 유지된다.
// 상태 바꾸기(QA): ?lbs=empty|few|many(기록·기준의 양), ?lbx=none|active|ended(실험), ?lbt=0(전하기 한 줄이 나오지 않는 날).
import { state, toISO } from "../state.js";
import { dayStatus, sampleRecord, effectiveToday } from "../sample.js";

export const choice = { tell: "a", place: "a", mark: "b", note: "b", pick: "a", show: "a" };
const KEYS = { 1: "tell", 2: "place", 3: "mark", 4: "note", 5: "pick", 6: "show" };
export const qa = { amount: "normal", tellDay: true, keyboard: false };

const addDays = (iso, n) => { const [y, m, d] = iso.split("-").map(Number); return toISO(new Date(y, m - 1, d + n)); };
export const todayIso = () => toISO(effectiveToday());
export const shiftDay = addDays;
export const monthDay = (iso) => `${Number(iso.slice(5, 7))}월 ${Number(iso.slice(8, 10))}일`;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
export const monthDayWeek = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${m}월 ${d}일 (${WEEKDAYS[new Date(y, m - 1, d).getDay()]})`; };

export const lb = { marks: new Set(), standards: [], experiment: null, past: [], seq: 100 };

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
  "해야 할 일을 미루면 하루가 무겁다", "좋아하는 것을 기다리는 시간이 즐겁다", "실수를 하면 나에게 먼저 실망한다", "몸이 붐비는 곳을 싫어한다",
  "아침에 서두르면 하루가 흐트러진다", "말을 끝까지 들어 주는 사람이 좋다", "부탁을 거절하지 못한 날은 오래 마음에 남는다", "조용한 주말이 한 번은 있어야 한다"];

function seed() {
  const days = recordedDays(30);
  const pick = (k) => days[Math.max(0, days.length - 1 - k)];
  lb.marks = new Set(qa.amount === "empty" ? [] : [pick(1), pick(4), pick(7)].filter(Boolean));
  const many = qa.amount === "many";
  lb.standards = qa.amount === "empty" || qa.amount === "few" ? [] : LINES.slice(0, many ? 20 : 4).map((text, i) => ({
    id: i + 1, text, folded: !many && i === 3, from: i === 0 ? [pick(4), pick(1)].filter(Boolean) : i === 1 ? [pick(7)].filter(Boolean) : many && i % 3 === 0 ? [pick(i)].filter(Boolean) : []
  }));
  if (many) lb.standards[2].text = "애쓴 일은 누가 알아주지 않아도 끝까지 해 보고 싶고, 그러다 지치면 하루쯤은 아무것도 하지 않고 쉬어도 된다고 나에게 말해 주고 싶다";
}
export function seedExperiment(kind) {
  const t = todayIso();
  if (kind === "none") lb.experiment = null;
  if (kind === "active") lb.experiment = { text: "자기 전 30분 화면 끄기", days: 7, start: addDays(t, -3), from: null };
  if (kind === "ended") lb.experiment = { text: "자기 전 30분 화면 끄기", days: 7, start: addDays(t, -8), from: null };
}
export const experimentEnd = (x = lb.experiment) => (x ? addDays(x.start, x.days - 1) : null);
export const experimentState = () => (!lb.experiment ? "none" : todayIso() > experimentEnd() ? "ended" : "active");

let seeded = false;
export function readParams(params) {
  let reseed = !seeded;
  for (const part of (params.get("lb") ?? "").split(/[.,]/)) { const m = /^([1-6])([abc])$/.exec(part); if (m) choice[KEYS[m[1]]] = m[2]; }
  const amount = params.get("lbs");
  if (["empty", "few", "many", "normal"].includes(amount) && amount !== qa.amount) { qa.amount = amount; reseed = true; }
  if (params.has("lbt")) qa.tellDay = params.get("lbt") !== "0";
  if (params.has("kb")) qa.keyboard = params.get("kb") === "1";
  if (reseed) { seed(); if (!seeded) seedExperiment("active"); seeded = true; }
  const x = params.get("lbx");
  if (["none", "active", "ended"].includes(x)) seedExperiment(x);
}

export const toggleMark = (iso) => { if (lb.marks.has(iso)) { lb.marks.delete(iso); return false; } lb.marks.add(iso); return true; };
export function saveStandard({ id, text, from = [] }) {
  const found = lb.standards.find((s) => s.id === id);
  if (found) { found.text = text; found.from = from; return found; }
  const made = { id: (lb.seq += 1), text, from, folded: false };
  lb.standards.unshift(made);
  return made;
}
export const removeStandard = (id) => { lb.standards = lb.standards.filter((s) => s.id !== id); };
export const EXAMPLES = ["자기 전 30분 화면 끄기", "서운할 때 하루 뒤에 말하기", "궁금한 곳은 글 말고 직접 가 보기", "답하기 전에 한 박자 쉬기", "저녁에 20분 걷기"];
export const DAY_CHOICES = [3, 5, 7, 14];
