// 직접 작성 흐름(UX_SPEC §4). 같은 영역들을 단계형(한 화면에 한 단계)과 긴 한 장, 두 방식으로 보여 준다.
// 순서는 두 방식 모두 같다: 날짜 → 사건 → 감정 계열 → 세부 감정 → 강도 → 이유 → 칭찬 3 → 감사 3 → 검토 → 완료.
import { el, announce } from "../dom.js";
import { decorativePose } from "../data.js";
import { state, todayISO, formatDate, missingFields, resetDraft, on, clearListeners } from "../state.js";
import { renderSky } from "../components/sky.js";
import { renderPicker } from "../components/picker.js";
import { renderIntensity } from "../components/slider.js";
import { renderRecordCard } from "../components/record-card.js";

const autoGrow = (ta) => { ta.style.height = "auto"; ta.style.height = `${ta.scrollHeight}px`; };
function textarea(id, label, hint, value, onInput, { required = true, rows = 3 } = {}) {
  const ta = el("textarea", { id, rows, "data-field": id, "aria-describedby": `${id}Hint ${id}Error`, "aria-required": required ? "true" : null });
  ta.value = value;
  ta.addEventListener("input", () => { onInput(ta.value); autoGrow(ta); if (ta.value.trim()) document.getElementById(`${id}Error`).hidden = true; });
  requestAnimationFrame(() => autoGrow(ta));
  return el("div", { class: "field" }, el("label", { for: id, class: "field-label", text: label }),
    el("p", { class: "caption", id: `${id}Hint`, text: hint }), ta, el("p", { class: "field-error", id: `${id}Error`, hidden: true }));
}
function slots(kind, name, values) {
  return el("fieldset", { class: "field slots-field" }, el("legend", { class: "field-label", text: `${name}할 점 세 가지` }),
    el("p", { class: "caption", text: "선택 입력입니다. 비워 두어도 완료할 수 있습니다." }),
    values.map((v, i) => { const input = el("input", { type: "text", class: "slot-input", placeholder: `${name} ${i + 1}`, "aria-label": `${name} ${i + 1}`, autocomplete: "off" });
      input.value = v; input.addEventListener("input", () => { state.draft[kind][i] = input.value; }); return input; }));
}

const SECTIONS = [
  { title: "날짜와 사건", render() {
    const d = state.draft;
    const date = el("input", { type: "date", id: "entryDate", "data-field": "date", max: todayISO(), "aria-describedby": "dateNote dateError" });
    date.value = d.date;
    const note = el("p", { class: "caption", id: "dateNote" });
    const error = el("p", { class: "field-error", id: "dateError", hidden: true });
    const sync = () => { note.textContent = d.date && d.date < todayISO() ? "기록에는 반영되지만 이미 끊긴 작성 streak를 되돌려 채우지는 않아요." : "기본은 오늘입니다. 지난 날짜도 고를 수 있습니다."; };
    date.addEventListener("change", () => {
      if (!date.value || date.value > todayISO()) { date.value = todayISO(); error.textContent = "미래 날짜는 고를 수 없어 오늘로 되돌렸습니다."; error.hidden = false; }
      else error.hidden = true;
      d.date = date.value; sync();
    });
    sync();
    return [el("div", { class: "field" }, el("label", { for: "entryDate", class: "field-label", text: "날짜" }), date, note, error),
      textarea("event", "무슨 일이 있었나요?", "있었던 일을 떠오르는 대로 적어 주세요.", d.event, (v) => { d.event = v; }, { rows: 4 })];
  } },
  { title: "감정 계열 고르기", render() {
    return [el("p", { class: "note", text: "가까운 계열을 여러 개 골라도 됩니다. 점의 자리와 이어지는 선은 고르기 쉽게 하려는 장식이고, 마음 상태를 재거나 분석한 결과가 아닙니다." }),
      renderSky(), el("p", { class: "field-error", id: "catsError", hidden: true })];
  } },
  { title: "세부 감정 고르기", render() {
    return [el("p", { class: "note", text: "가까운 말을 여러 개 골라도 됩니다." }), renderPicker()];
  } },
  { title: "감정마다 강도 정하기", render() {
    return [el("p", { class: "note", text: "1부터 10까지, 내가 느낀 크기를 직접 정합니다. 색은 계열을 알려 줄 뿐 좋고 나쁨이나 점수가 아닙니다." }), renderIntensity()];
  } },
  { title: "이유", render() {
    return [textarea("reason", "왜 이런 감정이 들었다고 느끼나요?", "정답은 없습니다. 내가 느끼는 대로 적어 주세요.", state.draft.reason, (v) => { state.draft.reason = v; }, { rows: 4 })];
  } },
  { title: "칭찬과 감사", render() { return [slots("praise", "칭찬", state.draft.praise), slots("thanks", "감사", state.draft.thanks)]; } }
];
const REVIEW = SECTIONS.length;
// 검토 카드의 "수정"이 데려갈 곳: 단계형에서는 단계 번호, 긴 한 장에서는 초점을 줄 요소.
const EDIT_TARGET = { date: [0, "#entryDate"], event: [0, "#event"], emotions: [1, ".star"], reason: [4, "#reason"], praise: [5, ".slots-field input"], thanks: [5, ".slots-field:last-of-type input"] };

function focusField(field) {
  const target = field === "emotions"
    ? (state.draft.cats.length ? document.querySelector(".search") : document.querySelector(".star"))
    : document.querySelector(`[data-field="${CSS.escape(field)}"]`);
  target?.focus(); target?.scrollIntoView({ block: "center" });
}
function showErrors(missing) {
  const ids = { date: "dateError", event: "eventError", reason: "reasonError" };
  for (const m of missing) {
    const id = ids[m.field] ?? (m.field === "emotions" ? (state.draft.cats.length ? "emotionsError" : "catsError") : `error-${m.field.split(":")[1]}`);
    const node = document.getElementById(id);
    if (node) { node.textContent = m.message; node.hidden = false; }
  }
}

export function renderWrite(main, navigate) {
  clearListeners();
  queueMicrotask(() => { document.title = (main.querySelector("h1")?.textContent ?? "작성") + " — 감정일기 화면 시안"; });
  const rerender = (focusHeading = true) => { renderWrite(main, navigate); if (focusHeading) main.querySelector("h1")?.focus(); };
  const goStep = (step) => { state.step = step; state.mode = "steps"; rerender(); };

  function complete() {
    const missing = missingFields();
    if (missing.length) {
      if (state.mode === "steps" && state.step !== missing[0].step) { state.step = missing[0].step; renderWrite(main, navigate); }
      showErrors(state.mode === "steps" ? missing.filter((m) => m.step === state.step) : missing);
      announce(`아직 채우지 않은 곳이 ${missing.length}군데 있습니다. ${missing[0].message}`);
      focusField(missing[0].field);
      return;
    }
    state.completed = structuredClone(state.draft);
    resetDraft();
    renderDone(main, navigate);
  }

  const modeSwitch = el("div", { class: "segmented", role: "group", "aria-label": "작성 화면 방식" },
    [["steps", "단계별로"], ["long", "한 장으로"]].map(([mode, label]) => el("button", { type: "button", "aria-pressed": String(state.mode === mode), text: label,
      onclick: () => { if (state.mode !== mode) { state.mode = mode; rerender(); } } })));

  const review = () => el("section", { class: "section", "aria-labelledby": "reviewTitle" },
    state.mode === "long" ? el("h2", { id: "reviewTitle", text: "검토" }) : el("span", { id: "reviewTitle", class: "sr", text: "검토" }),
    el("p", { class: "note", text: "적은 내용을 원래 순서대로 모았습니다. 고칠 곳은 ‘수정’을 눌러 돌아갈 수 있습니다." }),
    renderRecordCard(state.draft, { onEdit: (field) => { const [step, selector] = EDIT_TARGET[field]; if (state.mode === "steps") { goStep(step); requestAnimationFrame(() => main.querySelector(selector)?.focus()); } else { const t = main.querySelector(selector); t?.focus(); t?.scrollIntoView({ block: "center" }); } }, status: "작성 중" }));

  let body, footer;
  if (state.mode === "steps") {
    const i = state.step, isReview = i === REVIEW, title = isReview ? "검토하고 완료하기" : SECTIONS[i].title;
    body = [el("p", { class: "step-count", text: `${i + 1} / ${REVIEW + 1} 단계` }),
      el("div", { class: "progress", role: "progressbar", "aria-label": "작성 진행", "aria-valuemin": "1", "aria-valuemax": String(REVIEW + 1), "aria-valuenow": String(i + 1) }, el("i", { style: { width: `${((i + 1) / (REVIEW + 1)) * 100}%` } })),
      el("h1", { tabindex: "-1", text: title }),
      isReview ? review() : el("section", { class: "section" }, SECTIONS[i].render())];
    footer = el("div", { class: "step-footer" },
      i > 0 ? el("button", { type: "button", class: "btn secondary", text: "이전", onclick: () => goStep(i - 1) }) : el("button", { type: "button", class: "btn text", text: "그만두기", onclick: () => navigate("today") }),
      isReview ? el("button", { type: "button", class: "btn primary grow", text: "완료", onclick: complete }) : el("button", { type: "button", class: "btn primary grow", text: i === REVIEW - 1 ? "검토하기" : "다음", onclick: () => goStep(i + 1) }));
  } else {
    body = [el("h1", { tabindex: "-1", text: "오늘의 감정일기" }),
      ...SECTIONS.map((s, i) => el("section", { class: "section", "aria-labelledby": `sec${i}` }, el("h2", { id: `sec${i}`, text: s.title }), s.render())), review()];
    footer = el("div", { class: "step-footer" }, el("button", { type: "button", class: "btn text", text: "그만두기", onclick: () => navigate("today") }),
      el("button", { type: "button", class: "btn primary grow", text: "완료", onclick: complete }));
    // 긴 한 장에서는 검토 카드가 위 입력을 따라 바뀌어야 한다.
    const refresh = () => { const old = main.querySelector('[aria-labelledby="reviewTitle"]'); if (old) old.replaceWith(review()); };
    on("cats", refresh); on("emotions", refresh);
  }
  const screen = el("div", { class: "screen write " + state.mode }, el("div", { class: "write-top" }, modeSwitch), body);
  // 긴 한 장의 검토 카드는 글 입력도 따라간다. 입력 중인 칸은 검토 카드 밖에 있으므로 초점을 잃지 않는다.
  if (state.mode === "long") screen.addEventListener("input", (ev) => { if (!ev.target.closest(".card")) { const old = main.querySelector("[aria-labelledby=reviewTitle]"); if (old) old.replaceWith(review()); } });
  main.replaceChildren(screen, footer);
}

function renderDone(main, navigate) {
  main.replaceChildren(el("div", { class: "screen done" },
    el("div", { class: "pose-row", "aria-hidden": "true" }, decorativePose("wish", 96)),
    el("h1", { tabindex: "-1", text: "오늘의 기록을 마쳤어요" }),
    el("p", { class: "note", text: `${formatDate(state.completed.date)} 기록입니다. 시안이라 실제로 저장되지는 않았고, 이 창을 새로고침하면 사라집니다.` }),
    renderRecordCard(state.completed, { status: "완료(시안)" }),
    el("div", { class: "stack" }, el("button", { type: "button", class: "btn primary", text: "오늘 화면으로", onclick: () => navigate("today") }))));
  document.title = "오늘의 기록을 마쳤어요 — 감정일기 화면 시안";
  main.querySelector("h1").focus();
  announce("기록을 마쳤습니다. 시안이라 저장되지는 않았습니다.");
}
