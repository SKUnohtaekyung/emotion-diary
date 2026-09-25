// 시안의 상태는 이 모듈의 변수에 있다. 예외는 sessionDraft 하나다 — 쓰던 글을 탭이 열려 있는 동안만 sessionStorage에 둔다(D-082).
// 장기 저장(localStorage)·cookie·네트워크에는 쓰지 않는다.
const pad = (n) => String(n).padStart(2, "0");
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// 하루 기준 시각(D-081): 이 시각 전의 새벽은 전날로 센다. 기본 새벽 4시(설정에서 0~6시 — 시안은 이 값에 고정).
export const DAY_START_HOUR = 4;
let nowOverride = null; // QA: 오늘 화면의 ?now=HH:MM 이 시각을 고정해 본다
export const setNow = (d) => { nowOverride = d ? new Date(d) : null; };
export const now = () => (nowOverride ? new Date(nowOverride) : new Date());
export const todayISO = () => toISO(new Date(now().getTime() - DAY_START_HOUR * 3600e3));
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
export function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일 (${WEEKDAYS[new Date(y, m - 1, d).getDay()]})`;
}

// 강도 모델(2026-09-21): 계열마다 대표 강도 repr[cat]을 정하고, 세부 감정은 따로 정한 값 own만 갖는다(없으면 null).
// 저장 계약은 세부 감정마다 독립된 정수 1~10이므로 저장할 때의 값은 effectiveIntensity()다 — 따로 정하지 않은 세부 감정은 대표 강도를 그대로 따른다.
const emptyDraft = () => ({ date: todayISO(), event: "", cats: [], emotions: [], repr: {}, reason: "", praise: ["", "", ""], thanks: ["", "", ""] });

// step은 단계의 키다("date" · "cats" · "detail:<계열>" · "intensity" · "reason" · "praise" · "thanks" · "review"). 계열을 바꾸면 단계 목록이 달라지므로 번호가 아니라 키로 가리킨다.
// editing: 완료된 기록을 고치는 중이면 그 기록의 날짜다("완료된 기록을 수정 중" 표시, UX_SPEC §7). fromReview: 편지의 '고치기'로 들어온 단계라 고친 뒤 편지로 돌아간다(D-063).
export const state = { draft: emptyDraft(), completed: null, step: "date", editing: null, fromReview: false, pick: "meadow" }; // pick: 마음 고르기 화면 방식(QA용, D-066)

export function resetDraft() { state.draft = emptyDraft(); state.step = "date"; state.editing = null; state.fromReview = false; }
export function editCompleted(record = state.completed) { state.draft = structuredClone(record); state.step = "review"; state.editing = record.date; state.fromReview = false; }
export const hasDraftContent = () => Boolean(state.draft.event.trim() || state.draft.cats.length || state.draft.reason.trim());
export const effectiveIntensity = (draft, emotion) => emotion.own ?? draft.repr[emotion.cat] ?? null;

// 탭이 열려 있는 동안만 쓰던 글을 기기에 잠깐 둔다(D-082) — 새로고침·연결 끊김에서 글을 지키고, 남기거나 지우면 비운다. 탭을 닫으면 브라우저가 지운다.
const SESSION_KEY = "emotion-diary:draft";
export const sessionDraft = {
  save() { try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ draft: state.draft, step: state.step, editing: state.editing, savedAt: Date.now() })); } catch { /* 저장소를 못 쓰면 화면의 글만 남는다 */ } },
  load() { try { const raw = sessionStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; } },
  clear() { try { sessionStorage.removeItem(SESSION_KEY); } catch { /* 없음 */ } }
};

// 쓰던 글 지우기(D-082): 그 날짜의 임시저장을 버린다. 시안에서는 작성 중인 글과 달력의 예시 임시저장 표시를 함께 지운다.
export const discarded = new Set();
export function discardDraft(date) { if (state.draft.date === date) resetDraft(); discarded.add(date); sessionDraft.clear(); }

const listeners = new Map();
export function on(topic, fn) { if (!listeners.has(topic)) listeners.set(topic, new Set()); listeners.get(topic).add(fn); }
// 핸들러가 새 핸들러를 등록해도(긴 한 장에서 절을 다시 그릴 때) 같은 emit에서 다시 돌지 않도록 복사본을 돈다.
export function emit(topic, detail) { for (const fn of [...(listeners.get(topic) ?? [])]) fn(detail); }
export function clearListeners() { listeners.clear(); }

export function toggleCategory(code) {
  const d = state.draft, i = d.cats.indexOf(code), on = i < 0;
  if (on) d.cats.push(code);
  else { d.cats.splice(i, 1); d.emotions = d.emotions.filter((e) => e.cat !== code); delete d.repr[code]; }
  emit("cats", { code, on });
  return on;
}

export function toggleEmotion(emotion) {
  const d = state.draft, i = d.emotions.findIndex((e) => e.code === emotion.code), on = i < 0;
  if (on) d.emotions.push({ ...emotion, own: null });
  else d.emotions.splice(i, 1);
  emit("emotions", { code: emotion.code, on });
  return on;
}

// 완료조건은 DATA_MODEL과 같다: 사건·이유 nonblank, 감정 1개 이상, 모든 강도 1~10. 칭찬·감사는 필수가 아니다.
// 새 흐름에서는 고른 계열마다 세부 감정이 1개 이상이고 대표 강도가 있어야 모든 세부 감정에 강도가 채워진다. step은 그 오류가 있는 단계의 키다.
export function missingFields() {
  const d = state.draft, missing = [];
  if (d.date > todayISO()) missing.push({ field: "date", step: "date", message: "오늘 날짜를 다시 확인해 주세요." }); // 날짜 칸이 없어져(D-082) 사용자가 고칠 수 없는 값이다 — 미래 날짜 방어만 남긴다
  if (!d.event.trim()) missing.push({ field: "event", step: "date", message: "무슨 일이 있었는지 적어 주세요." });
  if (!d.cats.length) missing.push({ field: "cats", step: "cats", message: "마음을 하나 이상 골라 주세요." });
  for (const cat of d.cats) {
    if (!d.emotions.some((e) => e.cat === cat)) missing.push({ field: `detail:${cat}`, step: `detail:${cat}`, cat, message: "세부 감정을 하나 이상 골라 주세요." });
    else if (d.repr[cat] == null) missing.push({ field: `repr:${cat}`, step: "intensity", cat, message: "이 계열의 크기를 정해 주세요." });
  }
  if (!d.reason.trim()) missing.push({ field: "reason", step: "reason", message: "왜 이런 마음이 들었다고 느끼는지 적어 주세요." });
  return missing;
}
