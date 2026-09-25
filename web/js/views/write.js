// 직접 작성 흐름(UX_SPEC §4, D-061·D-063). 풀스크린 단계형 하나다(긴 한 장 비교안은 뺐다).
// 순서: 사건 → 마음 고르기(친구 아홉) → 고른 계열마다 세부 감정 1화면 → 크기 → 이유 → 칭찬 → 감사 → 편지(검토) → 완료.
// 세부 감정 화면만 화면 전체가 그 계열 300이고(D-059), 나머지는 흰 종이다. 하단 탐색은 없다(main.js가 풀스크린으로 둔다).
// 작성 흐름 예외 처리(D-082·D-083, 2026-09-24 사용자 결정): 새 기록은 그날만 쓰므로 날짜 칸이 없다 — 단계 키 "date"는 호환을 위해 그대로 두되 화면은 사건만 묻는다.
// 단계마다 해시(#/write?step=<키>)를 밀어 넣어 방문 기록을 쌓는다(휴대폰·브라우저 뒤로 가기가 단계를 하나씩 되짚게 하려고, main.js는 고칠 수 없어 여기서 처리한다).
import { el, svgEl, announce, setTheme, reducedMotion, toast } from "../dom.js";
import { data, category, FRIENDS } from "../data.js";
import { state, todayISO, formatDate, missingFields, resetDraft, toggleCategory, hasDraftContent, sessionDraft, discardDraft } from "../state.js";
import { renderFriendGrid } from "../components/friends.js";
import { renderFriendMeadow } from "../components/meadow.js";
import { renderReasonScene } from "../components/reason.js";
import { renderEventScene, renderNotesScene } from "../components/notes.js";
import { renderDetail } from "../components/detail.js";
import { renderIntensity } from "../components/slider.js";
import { renderLetter } from "../components/letter.js";
import { renderLand, doneLayout } from "../components/land.js";
import { openSheet } from "../components/sheet.js";
import { sampleRecord } from "../sample.js";

const closeIcon = () => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d: "M6 6l12 12M18 6 6 18" }));
// ⋯ 메뉴 아이콘은 기록 상세(tabs.js)의 더보기와 같은 모양이다(dots3 채움은 flow.css에서 .write-top으로 넓힌다).
const dotsIcon = () => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "dots3" }, svgEl("circle", { cx: "5", cy: "12", r: "1.7" }), svgEl("circle", { cx: "12", cy: "12", r: "1.7" }), svgEl("circle", { cx: "19", cy: "12", r: "1.7" }));
// 지난 날 글을 마무리할 때(state.draft.date !== todayISO()) 화면 말의 '오늘'을 '그날'로 바꾼다(재작업 1회차 — 마무리 띠와 제목이 어긋나던 결함).
const guideText = (day) => `잘 설명하지 못해도 괜찮아요. ${day}의 마음을, 처음 이름 붙이듯 적어 보세요.`;
const monthDay = (iso) => { const [, m, d] = iso.split("-").map(Number); return `${m}월 ${d}일`; }; // '지우기 2단계'·'마무리 배너'의 짧은 날짜꼴(연도·요일 없이)

const autoGrow = (ta) => { ta.style.height = "auto"; ta.style.height = `${Math.max(ta.scrollHeight, ta.clientHeight)}px`; };
function ruled(id, label, hint, value, onInput, { rows = 5 } = {}) {
  const ta = el("textarea", { id, rows, class: "ruled", "data-field": id, "aria-describedby": `${id}Hint ${id}Error`, "aria-required": "true", placeholder: hint });
  ta.value = value;
  ta.addEventListener("input", () => { onInput(ta.value); autoGrow(ta); if (ta.value.trim()) document.getElementById(`${id}Error`).hidden = true; });
  requestAnimationFrame(() => autoGrow(ta));
  return el("div", { class: "field" }, el("label", { for: id, class: "field-label", text: label }), ta, el("p", { class: "field-error", id: `${id}Error`, hidden: true }));
}
function slots(kind, name, values) {
  return el("fieldset", { class: "field slots-field", id: `slots-${kind}` }, el("legend", { class: "field-label", text: `${name}할 점, 세 가지까지` }),
    el("p", { class: "caption", text: "선택이에요. 비워 두어도 괜찮아요." }),
    values.map((v, i) => { const input = el("input", { type: "text", class: "slot-input", placeholder: `${name} ${i + 1}`, "aria-label": `${name} ${i + 1}`, autocomplete: "off" });
      input.value = v; input.addEventListener("input", () => { state.draft[kind][i] = input.value; }); return input; }));
}

// 단계 목록은 고른 계열에 따라 달라진다. 계열마다 세부 감정 화면이 하나씩 끼어든다.
function buildSteps() {
  return [
    { key: "date" }, { key: "cats" },
    ...state.draft.cats.map((cat, i) => ({ key: `detail:${cat}`, cat, index: i, total: state.draft.cats.length })),
    { key: "intensity" }, { key: "reason" }, { key: "praise" }, { key: "thanks" }, { key: "review" }
  ];
}

// "다음"을 막는 이유(없으면 null). 날짜·사건·이유는 편지에서 남길 때 확인한다.
function blockedReason(step) {
  const d = state.draft;
  if (step.key === "cats") return d.cats.length ? null : "마음을 하나 이상 골라 주세요.";
  if (step.cat) return d.emotions.some((e) => e.cat === step.cat) ? null : "세부 감정을 하나 이상 골라 주세요.";
  if (step.key === "intensity") return d.cats.some((cat) => d.emotions.some((e) => e.cat === cat) && d.repr[cat] == null) ? "모든 계열의 크기를 정해 주세요." : null;
  return null;
}
function showBlocked(step) {
  const message = blockedReason(step);
  if (!message) return;
  if (step.key === "cats") { const n = document.getElementById("catsError"); n.textContent = message; n.hidden = false; document.querySelector(".ff, .fr")?.focus(); }
  else if (step.cat) { const n = document.getElementById(`detailError-${step.cat}`); n.textContent = message; n.hidden = false; document.querySelector(`#cloud-${step.cat} .choice`)?.focus(); }
  else if (step.key === "intensity") { showIntensitySheet(); return; } // 크기는 인라인 오류만으론 눈에 덜 띄어 시트로 어디가 비었는지 짚어 준다(D-079). announce는 시트 안에서 따로 한다.
  announce(message);
}

// 크기 미정 시트(D-079): 대표 크기를 정하지 않은 계열을 시트로 알린다. '다음'·'편지로 돌아가기' 모두 showBlocked를 거치므로 여기 한 곳만 있으면 된다.
// 패널 아래 인라인 오류(#reprError-<cat>)는 지금처럼 함께 켜 둔다 — 시트를 닫은 뒤에도 어느 계열이 비었는지 화면에 남도록.
function showIntensitySheet() {
  const missing = state.draft.cats.filter((cat) => state.draft.emotions.some((e) => e.cat === cat) && state.draft.repr[cat] == null);
  for (const cat of missing) { const n = document.getElementById(`reprError-${cat}`); if (n) { n.textContent = "이 계열의 크기를 정해 주세요."; n.hidden = false; } }
  const list = el("ul", { class: "missing-list" }, missing.map((cat) => el("li", { text: `${FRIENDS[cat].name} · ${category(cat).label}` })));
  openSheet({ title: "크기를 정하지 않은 마음이 있어요", body: list,
    primary: { text: "정하러 가기", onclick: () => {
      const cat = missing[0], panel = document.getElementById(`repr-${cat}`)?.closest(".int-panel");
      panel?.scrollIntoView({ block: "center", behavior: reducedMotion() ? "auto" : "smooth" });
      document.getElementById(`repr-${cat}`)?.focus({ preventScroll: true }); // 스크롤은 그대로 두고 초점만 옮긴다(위 대표 크기 리셋 버튼과 같은 방식)
    } },
    secondary: { text: "닫기" } });
  announce(`크기를 정하지 않은 마음이 ${missing.length}개 있어요. 첫 번째는 ${FRIENDS[missing[0]].name}이에요.`);
}
const ERROR_ID = (m) => ({ date: "dateError", event: "eventError", reason: "reasonError", cats: "catsError" }[m.field] ?? (m.field.startsWith("detail:") ? `detailError-${m.cat}` : `reprError-${m.cat}`));

// 화면이 숨을 때·연결이 돌아올 때 저장하는 함수는 단계마다(렌더마다) 새로 만들어져 여기 끼워 넣긴다 — 리스너 자체는 모듈이 사는 동안 하나뿐이라 다시 그릴 때마다 쌓이지 않는다.
// 저장 함수는 부를 때 location.hash로 스스로 "아직 작성 화면인지" 확인하므로, 다른 화면으로 떠난 뒤 불려도 아무 일도 하지 않는다(안전).
let onHide = () => {}, onNetOnline = () => {}, onNetOffline = () => {};
document.addEventListener("visibilitychange", () => { if (document.hidden) onHide(); });
window.addEventListener("online", () => onNetOnline());
window.addEventListener("offline", () => onNetOffline());

let restoredOnce = false; // 새로고침 복구(과제6)는 이 모듈이 사는 동안 한 번만 시도한다 — 같은 세션 안에서 나갔다 다시 들어올 때는 today.js가 이미 state를 옮겨 둔다.
let editSnapshot = null, editSnapshotFor = null; // 완료 기록을 고치기 시작한 시점의 글(JSON) — 나가기 전 '고친 게 있는지'(과제8) 비교할 기준이다.

// 흐름을 떠날 때(완료·닫기·지우기) 쌓인 단계 자리를 모두 걷어 내기 위한 깊이 추적이다(재작업 1회차, 기준 c).
// URL의 step 파라미터가 아니라 history.length 차이로 깊이를 잰다 — 밖에서 해시를 직접 바꿔도(QA 스크립트 등) 안전하다.
let flowBaseLength = null; // 이 흐름의 첫 자리를 만들 때의 history.length(그 자리를 포함한 값)
function flowDepth() { return flowBaseLength == null ? 0 : Math.max(1, history.length - flowBaseLength + 1); }
// depth자리만큼 뒤로 이동한 뒤(흐름 시작 바로 전 자리에 닿는다) then을 부른다. depth가 0이면(전 자리를 모르면) 바로 부른다.
// hashchange 한 번으로 main.js의 render()가 먼저 그 자리를 그리고, 그 뒤에 이 콜백이 원하는 화면으로 덮어 그린다(같은 이벤트 처리 안이라 다시 그려지는 화면은 보이지 않는다).
function afterLeavingSteps(depth, then) {
  if (depth <= 0) { then(); return; }
  let settled = false;
  const finish = () => { if (settled) return; settled = true; window.removeEventListener("hashchange", onChange); clearTimeout(timer); then(); };
  const onChange = () => finish();
  window.addEventListener("hashchange", onChange);
  const timer = setTimeout(finish, 600); // 안전장치: 어떤 이유로 hashchange가 안 오면 그냥 진행한다
  history.go(-depth);
}

// '남기기' 뒤 봉인 연출(D-084, 과제2): 카드가 작아지며 내려가고 → 뚜껑이 닫히고 → 인장이 눌리고 → 봉투가 흰빛 속으로 옅어진다.
// letter.js는 고치지 않고 그 DOM(.letter-stage 등)에 film.css의 클래스만 붙였다 뗀다. 편지가 열려 있지 않았으면 카드 단계를 건너뛴다.
// onFinish(revealDone)는 완료 화면을 그린 뒤 revealDone()을 불러야 흰 막이 자연스럽게 걷힌다(먼저 걷으면 전환 중간이 보인다).
function playSealSequence(onFinish) {
  if (reducedMotion()) { onFinish(() => {}); return; }
  const stage = document.querySelector(".letter-stage");
  if (!stage) { onFinish(() => {}); return; }
  const wasOpen = stage.classList.contains("opened");
  const cardsEl = stage.querySelector(".pagerclip");
  const flapEl = stage.querySelector(".flapwrap .flap");
  const sealEl = stage.querySelector(".sealw .seal");
  const frameEl = stage.querySelector(".lt-frame") || stage;
  const whiteout = el("div", { class: "film-whiteout" });
  document.body.append(whiteout);
  // write.css는 열린 뒤 봉투 조각을 display:none으로 감춘다 — film-sealing이 그걸 되돌려야 뚜껑 닫힘·인장이 보인다(film.css).
  stage.classList.add("film-sealing");
  const stillHere = () => location.hash.startsWith("#/write");
  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(() => { if (stillHere()) fn(); }, ms));
  const removeWhiteout = () => { whiteout.classList.remove("film-show"); whiteout.classList.add("film-hide"); setTimeout(() => whiteout.remove(), 400); };
  const finishAll = () => onFinish(removeWhiteout);
  // 전체 연출은 '남기는 중…' 잠금(complete()의 350ms)을 더해도 2초 안쪽이어야 한다 — 아래 값은 그 예산에 맞춰 줄였다(약속한 "약 450ms" 등보다 조금 빠르다).
  if (wasOpen && cardsEl) {
    cardsEl.classList.add("film-cards-in");
    at(380, () => flapEl?.classList.add("film-flap-close"));
    at(650, () => sealEl?.classList.add("film-seal-press"));
    at(950, () => { frameEl.classList.add("film-envelope-out"); whiteout.classList.add("film-show"); });
    at(1280, finishAll);
  } else { // 봉투가 열려 있지 않았으면 카드·뚜껑 단계를 건너뛰고 인장부터
    sealEl?.classList.add("film-seal-press");
    at(320, () => { frameEl.classList.add("film-envelope-out"); whiteout.classList.add("film-show"); });
    at(650, finishAll);
  }
  // 안전망: 연출 도중 다른 화면으로 떠나 위 타이머들이 멈춰도, 흰 막이 화면에 눌어붙지 않게 곧 지운다.
  timers.push(setTimeout(() => { if (whiteout.isConnected) removeWhiteout(); }, 1800));
}

export function renderWrite(main, navigate, params = new URLSearchParams()) {
  if (params.get("pick")) state.pick = params.get("pick"); // QA: #/write?pick=grid 는 이전 격자를, meadow(기본)는 초록 언덕 자유 배치를 본다
  // QA: #/write?s=done&c=joy,sadness 는 그 계열을 고른 것으로 치고 완료 화면을 바로 본다(저장은 없다).
  if (params.get("s") === "done") {
    const codes = (params.get("c") ?? "joy").split(",").filter((c) => data.categories.some((k) => k.code === c));
    state.completed = sampleRecord(todayISO(), codes.length ? codes : ["joy"]);
    renderDone(main, navigate);
    return;
  }

  // 새로고침 복구(과제6): 작성 중인 글이 비어 있고 세션에 남은 글이 있으면 되살린다. today.js가 '이어서 써요'로 이미 state.draft를 옮겨 둔 경우는
  // hasDraftContent()가 참이라 건드리지 않는다. 이 모듈이 사는 동안(=이 페이지가 열려 있는 동안) 한 번만 시도한다.
  if (!restoredOnce) {
    restoredOnce = true;
    if (!params.get("s") && !hasDraftContent()) {
      const saved = sessionDraft.load();
      if (saved) { state.draft = saved.draft; state.step = params.get("step") || saved.step || "date"; state.editing = saved.editing ?? null; state.fromReview = false; }
    }
  }

  // 완료·삭제 뒤 뒤로 가기 방어(과제3): resetDraft로 글이 빈 채 중간 단계 주소만 남아 있으면(방문 기록에 남은 편지·이전 단계) 오늘로 보낸다.
  const requestedStep = params.get("step");
  if (!params.get("s") && requestedStep && requestedStep !== "date" && !hasDraftContent()) {
    history.replaceState(null, "", "#/today");
    document.body.removeAttribute("data-fullscreen");
    navigate("today");
    return;
  }
  if (params.get("s") === "savefail") state.step = "review"; // QA: 실패 띠는 편지 화면에서만 뜻이 있다
  else if (requestedStep) state.step = requestedStep;

  const steps = buildSteps();
  let i = steps.findIndex((s) => s.key === state.step);
  if (i < 0) i = state.step.startsWith("detail:") ? 1 : 0;
  const step = steps[i], isReview = step.key === "review";
  state.step = step.key;
  document.body.dataset.fullscreen = "";
  const day = state.draft.date === todayISO() ? "오늘" : "그날"; // 지난 날 글 마무리 중에는 화면 말의 '오늘'을 모두 '그날'로 바꾼다(재작업 1회차)
  // 주소에 아직 step이 없으면(새로 들어왔거나 today.js가 state만 옮겨 둔 경우) 방문 기록을 새로 쌓지 않고 지금 단계로 주소만 맞춘다.
  // 다른 QA 조각(?s=·?net= 등)은 그대로 둔다 — step만 없거나 다를 뿐이라 통째로 새로 짓지 않고 여기만 채운다.
  // 이 자리를 흐름의 기준(깊이 1)으로 삼는다 — 떠날 때 이만큼 뒤로 가면 흐름 시작 전 자리로 돌아간다.
  if (!requestedStep) { const qp = new URLSearchParams(params); qp.set("step", step.key); history.replaceState(null, "", `#/write?${qp.toString()}`); flowBaseLength = history.length; }
  else if (flowBaseLength == null) flowBaseLength = history.length; // 방어: 북마크 등으로 중간 단계 주소가 이 페이지의 첫 진입이었던 경우 — 여기를 기준 삼는다(더 앞은 모른다)
  const here = () => { const now = buildSteps(); return { now, at: now.findIndex((s) => s.key === step.key) }; };

  // 완료 기록을 고치는 중이면 시작 시점의 글을 기억해 둔다 — 나가기 전 '고친 게 있는지'(과제8) 비교할 기준이다.
  if (state.editing) { if (editSnapshotFor !== state.editing) { editSnapshot = JSON.stringify(state.draft); editSnapshotFor = state.editing; } }
  else { editSnapshot = null; editSnapshotFor = null; }
  const hasEdits = () => state.editing && JSON.stringify(state.draft) !== editSnapshot;

  // 자동 저장(과제5): 입력이 1초 멈추거나 단계를 넘기거나 화면이 숨거나 연결이 돌아오면 sessionDraft에 둔다. 내용이 모두 비면 대신 지운다.
  let offline = params.get("net") === "offline" || (typeof navigator !== "undefined" && navigator.onLine === false);
  let saveTimer = null, saveStatusEl = null, offlineBannerEl = null;
  const setSaveStatus = (text) => { if (saveStatusEl) saveStatusEl.textContent = text; };
  const saveNow = () => {
    clearTimeout(saveTimer); saveTimer = null;
    if (!location.hash.startsWith("#/write")) return; // 다른 화면으로 이미 떠났으면 아무것도 하지 않는다(안전 가드)
    if (!hasDraftContent()) { sessionDraft.clear(); setSaveStatus(""); return; }
    sessionDraft.save();
    setSaveStatus(offline ? "" : "저장됨");
  };
  const scheduleSave = () => { setSaveStatus("저장 중…"); clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 1000); };
  onHide = saveNow;
  onNetOnline = () => { offline = false; if (offlineBannerEl) offlineBannerEl.hidden = true; saveNow(); };
  onNetOffline = () => { offline = true; if (offlineBannerEl) offlineBannerEl.hidden = false; setSaveStatus(""); };

  // 단계 사이 연출(D-084, 과제1): 앞/뒤 방향을 미리 정해 documentElement에 달아 둔다 — main.js가 View Transition으로 감쌀 때
  // film.css가 이 값으로 슬라이드 방향을 고른다(없으면 fwd). hashchange가 main.js의 render()를 불러 다시 그린다(방문 기록도 쌓인다).
  const goStep = (key) => {
    const { now, at } = here(); const to = now.findIndex((s) => s.key === key);
    document.documentElement.dataset.filmDir = to >= 0 && to < at ? "back" : "fwd";
    state.step = key; saveNow(); location.hash = `#/write?step=${key}`;
  };
  const move = (delta) => { const { now, at } = here(); goStep(now[Math.min(now.length - 1, Math.max(0, at + delta))].key); };

  // 흐름을 떠날 때(닫기·지우기, 과제3): 쌓인 단계 자리를 모두 지나 흐름 시작 전 자리에서 '오늘'로 바꿔 그린다(재작업 1회차, 기준 c) —
  // 그 자리 하나만 바꾸므로 이 뒤로 한 번 더 가면 흐름을 보기 전, 즉 그 전 자리로 간다(같은 '오늘'이 반복되지 않는다).
  let leaving = false;
  function leaveFlowToToday() {
    if (leaving) return; leaving = true;
    afterLeavingSteps(flowDepth(), () => {
      document.body.removeAttribute("data-fullscreen");
      history.replaceState(null, "", "#/today");
      navigate("today");
    });
  }
  // 나가기(닫기 ×, 과제3): 자동 저장이라 보통은 확인 없이 오늘로 간다. 완료 기록을 고치던 중 실제로 고쳤으면(과제8) 한 번만 묻는다.
  const closeToToday = () => {
    if (hasEdits()) {
      openSheet({ title: "고친 내용을 저장하지 않고 나갈까요?", danger: true,
        primary: { text: "나가기", onclick: leaveFlowToToday },
        secondary: { text: "계속 고치기" } });
      return;
    }
    saveNow();
    leaveFlowToToday();
  };

  // 남기기: 없는 것이 있으면 막지 않고 시트로 이유를 말한 뒤 그 단계로 데려간다(UX_SPEC §6). 연타·실패는 과제9.
  let saving = false;
  function complete() {
    if (saving) return;
    const missing = missingFields();
    if (missing.length) {
      const first = missing[0];
      const list = el("ul", { class: "missing-list" }, [...new Map(missing.map((m) => [m.field, m])).values()].map((m) => el("li", { text: m.message })));
      openSheet({ title: "남기려면 이것이 필요해요", body: [list, el("p", { class: "caption", text: "칭찬과 감사는 비워 둬도 남길 수 있어요." })],
        primary: { text: "채우러 가기", onclick: () => { goStep(first.step); requestAnimationFrame(() => { for (const m of missing.filter((x) => x.step === first.step)) { const n = document.getElementById(ERROR_ID(m)); if (n) { n.textContent = m.message; n.hidden = false; } } }); } },
        secondary: { text: "편지로 돌아가기" } });
      announce(`아직 채우지 않은 곳이 ${missing.length}군데 있어요. ${first.message}`);
      return;
    }
    saving = true; sync(); next.textContent = "남기는 중…";
    setTimeout(() => { // 350ms: 저장을 흉내만 낸다 — 이 뒤 봉인 연출까지 합쳐 전체 2초 안쪽(D-084)
      if (params.get("s") === "savefail") { // QA: 실패를 흉내 낸다 — 편지 화면에 머물고 띠로 다시 시도를 권한다
        saving = false; next.textContent = state.editing ? "저장하기" : "남기기"; sync();
        if (savefailBanner) savefailBanner.hidden = false;
        announce("남기지 못했어요. 다시 시도해 주세요.");
        return;
      }
      // 봉인 연출(D-084, 과제2) 뒤에 완료 뒤 뒤로 가기 방어(과제3, 재작업 1회차 기준 c)를 잇는다: 쌓인 단계 자리를 모두 지나 흐름 시작 전 자리로
      // 실제로 돌아간 뒤 그 자리 바로 뒤에 완료 화면 자리 하나만 새로 쌓는다 — 사이 있던 모든 단계 자리는 이 push가 잘라 낸다.
      playSealSequence((revealDone) => {
        const depth = flowDepth();
        afterLeavingSteps(depth, () => {
          if (depth > 0) history.pushState(null, "", "#/write?step=review&done=1");
          else history.replaceState(null, "", "#/today"); // 흐름 시작 전 자리를 모르면(방어 경로) 지금 자리를 완료로 바꿔 둔다
          sessionDraft.clear();
          state.completed = structuredClone(state.draft);
          resetDraft();
          renderDone(main, navigate);
          setTimeout(revealDone, 80); // 완료 화면이 자리잡은 뒤에만 흰 막을 걷는다(먼저 걷으면 전환이 보인다)
        });
      });
    }, 350);
  }

  // ⋯ 메뉴(과제4): 이 글 지우기 하나뿐이다. 완료 기록을 고치는 중에는 두지 않는다(완료 기록 삭제는 기록 상세의 몫, tabs.js).
  const discard2 = () => openSheet({ title: "정말 지울까요?", body: [el("p", { text: `${monthDay(state.draft.date)}에 쓰던 글이 사라져요.` })], danger: true,
    primary: { text: "지우기", onclick: () => {
      discardDraft(state.draft.date);
      leaveFlowToToday();
      toast("쓰던 글을 지웠어요");
    } }, secondary: { text: "그만두기" } });
  const discard1 = () => openSheet({ title: "이 글을 지울까요?", body: [el("p", { text: "지우면 되돌릴 수 없어요." })], danger: true,
    primary: { text: "지우기", onclick: discard2 }, secondary: { text: "그만두기" } });
  const menu = () => {
    // 재작업 1회차: 항목이 하나뿐이라 설명까지 빨강이면 무겁다. 이름만 danger 색을 쓰고 설명은 wf-menu-item로 muted를 되돌린다(44px 이상 한 줄 행은 menu-row 기본이 이미 준다).
    const sh = openSheet({ title: "메뉴", secondary: { text: "닫기" }, body: [
      el("button", { type: "button", class: "menu-row danger wf-menu-item", onclick: () => { sh.close(); discard1(); } }, el("span", {}, "이 글 지우기", el("small", { text: "쓰던 글을 지워요." })))
    ] });
  };

  // ── 본문 ──
  let body;
  if (step.key === "date") {
    const d = state.draft;
    // 날짜 칸 없음(과제1, D-082): 새 기록은 그날만 쓴다 — 날짜는 항상 todayISO()(새벽 4시 기준)이고 고칠 곳이 없다. 단계 키는 "date"로 그대로 둔다.
    body = [el("h1", { tabindex: "-1", text: `${day} 있었던 일` }), el("p", { class: "paper-guide", text: guideText(day) }),
      renderEventScene({ cats: d.cats, dateField: null, day,
        eventField: ruled("event", "무슨 일이 있었나요?", "있었던 일을 떠오르는 대로 적어요.", d.event, (v) => { d.event = v; }) })];
  } else if (step.key === "cats") {
    body = [el("h1", { class: "hero", tabindex: "-1", text: `${day}은 어떤 마음이 머물렀나요?` }), el("p", { class: "lede", text: "여러 개여도 괜찮아요." }),
      el("p", { class: "field-error", id: "catsError", hidden: true }), state.pick === "grid" ? renderFriendGrid() : renderFriendMeadow()];
  } else if (step.cat) {
    body = [renderDetail(step.cat, { index: step.index, total: step.total, onSkip: () => {
      const pos = state.draft.cats.indexOf(step.cat), label = category(step.cat).label; toggleCategory(step.cat); announce(`${label}을 뺐어요`);
      const rest = state.draft.cats; goStep(!rest.length ? "cats" : pos < rest.length ? `detail:${rest[pos]}` : "intensity");
    } })];
  } else if (step.key === "intensity") {
    body = [el("h1", { tabindex: "-1", text: "얼마나 컸나요?" }), el("p", { class: "lede", text: "1은 스쳐 지나간 정도, 10은 하루에 크게 남은 정도예요. 색은 마음을 알려 줄 뿐 좋고 나쁨이 아니에요." }), renderIntensity()];
  } else if (step.key === "reason") {
    body = [el("h1", { tabindex: "-1", text: "이유" }), renderReasonScene({ cats: state.draft.cats, field: ruled("reason", "왜 이런 마음이 들었다고 느끼나요?", "정답은 없어요. 느낀 대로 적어요.", state.draft.reason, (v) => { state.draft.reason = v; }) })];
  } else if (step.key === "praise") {
    body = [el("h1", { tabindex: "-1", text: "칭찬" }), el("p", { class: "paper-guide", text: `${day === "오늘" ? "오늘" : "그날의"} 나에게 해 주고 싶은 칭찬을 적어요.` }), renderNotesScene({ kind: "praise", cats: state.draft.cats, slots: slots("praise", "칭찬", state.draft.praise) })];
  } else if (step.key === "thanks") {
    body = [el("h1", { tabindex: "-1", text: "감사" }), el("p", { class: "paper-guide", text: `${day} 고마웠던 일을 적어요.` }), renderNotesScene({ kind: "thanks", cats: state.draft.cats, slots: slots("thanks", "감사", state.draft.thanks) })];
  } else { // review = 편지
    const sub = el("p", { class: "letter-sub", role: "status", text: `${day}의 마음을 나에게 쓴 편지로 담았어요. 봉투를 열어 마지막으로 읽어 봐요.` });
    const letter = renderLetter(state.draft, { onEdit: (target) => { state.fromReview = true; goStep(target); }, onOpened: () => { sub.textContent = "옆으로 넘겨서 확인해요."; } });
    body = [el("h1", { tabindex: "-1", text: "이대로 남길까요?" }), sub, letter.node];
  }

  // ── 틀: 위(닫기·몇 번째·⋯ 메뉴)·진행선·안내 띠, 아래(이전·다음) ──
  const { now, at } = here();
  // 안내 띠(과제2·5·9): 완료 기록 수정 중 / 지난 날 글 마무리 중 / 연결 끊김 / 남기기 실패. 필요한 만큼 같은 자리에 쌓인다.
  const editingBanner = state.editing ? el("div", { class: "banner editing-banner wf-banner", role: "status" },
    svgEl("svg", { viewBox: "0 0 24 24", width: "20", height: "20", "aria-hidden": "true", style: "flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round" }, svgEl("path", { d: "M4 20l4.2-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20z" })),
    el("div", {}, "완료된 기록을 수정 중이에요", el("small", { text: "저장하면 이 기록의 분석이 최신이 아니게 될 수 있어요." }))) : null;
  // 지난 날 글 마무리(과제2, D-082): 그날 시작한 임시저장은 기한 없이 마무리할 수 있다는 사용자 결정을 알려 준다. 완료 기록 수정 중과는 겹치지 않는다.
  const finishingBanner = (!state.editing && state.draft.date < todayISO())
    ? el("div", { class: "banner wf-banner", role: "status", text: `${monthDay(state.draft.date)}의 기록을 마무리하고 있어요` }) : null;
  offlineBannerEl = el("div", { class: "banner soft wf-banner", role: "status", hidden: !offline, text: "저장 안 됨 · 연결되면 저장돼요" });
  // 재작업 1회차: 메시지·'다시 시도'를 한 줄 양 끝에 두고 세로 가운데를 맞춘다(줄글처럼 두면 .link의 44px 높이 때문에 기준선이 어긋나 두 줄처럼 보였다).
  const savefailBanner = isReview ? el("div", { class: "banner soft wf-banner wf-fail", role: "status", hidden: params.get("s") !== "savefail" },
    el("span", { text: "남기지 못했어요" }), el("button", { type: "button", class: "link", onclick: complete, text: "다시 시도" })) : null;

  const saveStatusSpan = el("span", { class: "wf-save" });
  const moreBtn = state.editing ? null : el("button", { type: "button", class: "back more", "aria-label": "메뉴", onclick: menu }, dotsIcon());
  const top = el("div", { class: "write-top" },
    el("button", { type: "button", class: "back", "aria-label": "닫기", onclick: closeToToday }, closeIcon()),
    el("div", { class: "wf-count" }, el("span", { class: "step-count", text: `${at + 1} / ${now.length}` }), saveStatusSpan),
    moreBtn);
  saveStatusEl = saveStatusSpan;
  setSaveStatus(hasDraftContent() && !offline ? "저장됨" : "");
  const bar = el("div", { class: "progress", role: "progressbar", "aria-label": "작성 진행", "aria-valuemin": "1", "aria-valuemax": String(now.length), "aria-valuenow": String(at + 1) }, el("i", { style: { width: `${((at + 1) / now.length) * 100}%` } }));

  const next = el("button", { type: "button", class: "btn big primary" });
  if (isReview) { next.textContent = state.editing ? "저장하기" : "남기기"; next.onclick = complete; }
  else if (state.fromReview) { next.textContent = "편지로 돌아가기"; next.onclick = () => { if (blockedReason(step)) showBlocked(step); else { state.fromReview = false; goStep("review"); } }; }
  else { next.textContent = "다음"; next.onclick = () => { if (blockedReason(step)) showBlocked(step); else move(1); }; }
  // 첫 단계는 닫기(×)가 나가기를 맡으므로 '이전'을 두지 않는다(과제3).
  const footer = i > 0
    ? el("div", { class: "step-footer" }, el("button", { type: "button", class: "btn big text", text: "이전", onclick: () => move(-1) }), next)
    : el("div", { class: "step-footer solo" }, next);

  const pick = step.key === "cats" && state.pick !== "grid"; // 초록 언덕 위 자유 배치: 장면이 아래 버튼 줄 뒤까지 이어지도록 버튼 줄을 화면 안에 겹쳐 둔다
  const screen = el("div", { class: `screen write step-${step.key.replace(/:.*/, "")}${step.cat ? " detail-screen" : ""}${isReview ? " review" : ""}${pick ? " pick" : ""}` },
    top, bar, editingBanner, finishingBanner, offlineBannerEl, savefailBanner, body);
  if (step.cat) { setTheme(screen, step.cat); setTheme(footer, step.cat); }
  const sync = () => next.setAttribute("aria-disabled", String(saving || (!isReview && Boolean(blockedReason(step)))));
  sync(); screen.addEventListener("click", sync);
  screen.addEventListener("input", () => { sync(); scheduleSave(); });
  if (pick) { footer.classList.add("pick"); screen.append(footer); main.replaceChildren(screen); } else main.replaceChildren(screen, footer);

  if (params.get("s") === "expired") { // 과제7: 접근 만료 — 글은 그대로 두고 다시 들어오라는 시트만 덮는다(시안은 닫기만).
    openSheet({ title: "다시 들어와야 해요", body: [el("p", { text: "쓰던 글은 그대로 있어요." })], primary: { text: "다시 들어가기" } });
  }
}

// 과제3 재작업 2회차(D-084): 달력 오늘 칸에 그날 첫 계열 조약돌이 내려앉는 연출. 처음엔 body 클래스로 오늘 칸의 ::after에
// 얹으려 했는데, 그 ::after는 tabs.css가 이미 완료·임시저장 안쪽 잉크 채움에 쓰고 있어(D-080) 같은 가짜 요소를 두고 다퉜다
// — 내 규칙이 명시성으로 이겨 채움의 자리·크기를 가로채면서, 조약돌이 떠 있는 900~1350ms 동안 '완료' 안쪽 채움이 통째로
// 사라지고 클래스가 빠지는 1700ms에야 원래 모양으로 돌아오는 결함이 났다(칸 자체는 한 번도 안 바뀌었는데 그렇게 보였다).
// 그래서 조약돌은 tabs.js 요소의 pseudo를 전혀 쓰지 않고, 여기서 만든 진짜 엘리먼트(body에 붙인 position:fixed 배지)로
// 그린다 — 오늘 칸의 실제 화면 위치를 재서 자리만 빌린다. 칸 자체(배경·테두리·opacity)는 손대지 않고, 은은한 빛은
// box-shadow만 쓴다(배경을 바꾸지 않으니 상태 표시를 가리지 않는다).
function playCalendarPebble(catCode) {
  const cell = document.querySelector('.cal [aria-current="date"]');
  if (!cell) return; // 달력이 아니거나 오늘 칸이 안 보이면 아무 것도 하지 않는다
  const rect = cell.getBoundingClientRect();
  const badge = el("span", { class: "wf-film-badge wf-film-badge-enter", "aria-hidden": "true" });
  badge.style.left = `${rect.left + rect.width * 0.78}px`;
  badge.style.top = `${rect.top + rect.height * 0.78}px`;
  badge.style.backgroundImage = `url(/design/pebbles/ui/${catCode}-128.png)`;
  document.body.appendChild(badge);
  cell.classList.add("wf-film-glow");
  const stillHere = () => location.hash.startsWith("#/calendar");
  // wf-film-badge-enter(내려앉는 애니메이션)는 700ms 뒤 곧장 뗀다 — animation의 both 유지값이 뒤에 오는 opacity
  // 전환(wf-film-badge-out)을 가로막지 않도록(캐스케이드에서 animation이 일반 transition보다 세다. 재작업 1회차에서
  // 확인한 동작이라 같은 방식을 그대로 쓴다).
  setTimeout(() => badge.classList.remove("wf-film-badge-enter"), 750);
  // 뚝 사라지지 않도록 300ms 먼저 흐려진 뒤에야 없앤다. 화면을 이미 떠났으면 빛만 건너뛰고 배지는 그래도 치운다(떠 있는
  // position:fixed 요소를 다른 화면에 남기지 않으려고).
  setTimeout(() => { if (stillHere()) cell.classList.remove("wf-film-glow"); badge.classList.add("wf-film-badge-out"); }, 1200);
  setTimeout(() => badge.remove(), 1500);
}

// 완료 화면(D-061): 흰 하늘·색 언덕·흰 길 위에 그날 고른 친구와 조약돌만 선다. 저장 값이 아니고 시안이라 새로고침하면 사라진다.
export function renderDone(main, navigate) {
  const entry = state.completed;
  const cats = data.categories.map((c) => c.code).filter((code) => entry.emotions.some((e) => e.cat === code)); // 선언 순서
  const day = entry.date === todayISO() ? "오늘" : "그날"; // 지난 날 글을 마무리한 경우 완료 제목도 '그날'로 맞춘다(재작업 1회차)
  document.body.dataset.fullscreen = "";
  // 오늘 화면에 탐색이 없어(D-076) 통계가 한 단계 멀어진 것을 다 쓴 직후의 제때 입구로 보완한다. '오늘로 돌아가기'를 빼고 달력·통계 두 입구를
  // 아래 버튼 줄로 올렸다(D-078, 사용자 요청): 통계가 ink 주 버튼(엄지에 가까운 오른쪽), 달력이 옅은 회색 보조 버튼이다.
  const go = (route) => () => {
    document.body.removeAttribute("data-fullscreen");
    const filmCat = route === "calendar" ? cats[0] : null;
    navigate(route);
    // navigate()는 location.hash를 바꿀 뿐이라 hashchange 렌더는 다음 매크로태스크에서 일어난다 — 달력 DOM이 실제로
    // 생기고 그려진 뒤에야 오늘 칸을 잴 수 있어 rAF 두 번(다음 페인트 이후)을 기다린 뒤 조약돌을 놓는다.
    if (filmCat) requestAnimationFrame(() => requestAnimationFrame(() => playCalendarPebble(filmCat)));
  };
  const screen = el("div", { class: "screen done" },
    el("div", { class: "done-head" }, el("p", { class: "done-date", text: `${formatDate(entry.date)} 기록` }),
      el("h1", { class: "hero", tabindex: "-1", text: `${day}의 마음을 남겼어요` })),
    el("div", { class: "done-land" }, renderLand(doneLayout(cats))));
  const footer = el("div", { class: "done-bar" },
    el("button", { type: "button", class: "btn big secondary", text: "달력 보기", onclick: go("calendar") }),
    el("button", { type: "button", class: "btn big primary", text: "통계 보기", onclick: go("stats") }));
  main.replaceChildren(screen, footer);
  document.title = `${day}의 마음을 남겼어요 — 감정일기 화면 시안`;
  window.scrollTo(0, 0);
  main.querySelector("h1").focus({ preventScroll: true });
  announce("기록을 마쳤습니다. 시안이라 저장되지는 않았습니다.");
}
