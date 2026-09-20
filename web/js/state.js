// 시안의 상태는 이 모듈의 변수에만 있다. 브라우저 저장소·cookie·네트워크에 쓰지 않으므로 새로고침하면 사라진다.
const pad = (n) => String(n).padStart(2, "0");
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => toISO(new Date());
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
export function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일 (${WEEKDAYS[new Date(y, m - 1, d).getDay()]})`;
}

const emptyDraft = () => ({ date: todayISO(), event: "", cats: [], emotions: [], reason: "", praise: ["", "", ""], thanks: ["", "", ""] });

export const state = { draft: emptyDraft(), completed: null, mode: "steps", step: 0 };

export function resetDraft() { state.draft = emptyDraft(); state.step = 0; }
export function editCompleted() { state.draft = structuredClone(state.completed); state.step = 0; }

const listeners = new Map();
export function on(topic, fn) { if (!listeners.has(topic)) listeners.set(topic, new Set()); listeners.get(topic).add(fn); }
export function emit(topic, detail) { for (const fn of listeners.get(topic) ?? []) fn(detail); }
export function clearListeners() { listeners.clear(); }

export function toggleCategory(code) {
  const d = state.draft, i = d.cats.indexOf(code), on = i < 0;
  if (on) d.cats.push(code);
  else { d.cats.splice(i, 1); d.emotions = d.emotions.filter((e) => e.cat !== code); }
  emit("cats", { code, on });
  return on;
}

export function toggleEmotion(emotion) {
  const d = state.draft, i = d.emotions.findIndex((e) => e.code === emotion.code), on = i < 0;
  if (on) d.emotions.push({ ...emotion, intensity: null });
  else d.emotions.splice(i, 1);
  emit("emotions", { code: emotion.code, on });
  return on;
}

// 완료조건은 DATA_MODEL과 같다: 사건·이유 nonblank, 감정 1개 이상, 모든 강도 1~10. 칭찬·감사는 필수가 아니다.
export function missingFields() {
  const d = state.draft, missing = [];
  if (!d.date || d.date > todayISO()) missing.push({ field: "date", step: 0, message: "오늘 또는 지난 날짜를 골라 주세요." });
  if (!d.event.trim()) missing.push({ field: "event", step: 0, message: "무슨 일이 있었는지 적어 주세요." });
  if (!d.emotions.length) missing.push({ field: "emotions", step: d.cats.length ? 2 : 1, message: d.cats.length ? "세부 감정을 하나 이상 골라 주세요." : "감정 계열을 하나 이상 골라 주세요." });
  const noIntensity = d.emotions.find((e) => e.intensity == null);
  if (noIntensity) missing.push({ field: `intensity:${noIntensity.code}`, step: 3, message: `‘${noIntensity.label}’의 강도를 정해 주세요.` });
  if (!d.reason.trim()) missing.push({ field: "reason", step: 4, message: "왜 그런 감정이 들었다고 느끼는지 적어 주세요." });
  return missing;
}
