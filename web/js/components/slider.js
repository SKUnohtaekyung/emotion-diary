// 강도 선택기(DESIGN_SYSTEM §6.4, D-037): native range + 항상 보이는 숫자 + −/+ 스테퍼 + 한 줄 앵커.
// design/style-guide.html의 구현을 옮겼다. 달라진 점: 고르기 전 상태(값 없음)를 갖는다 — 기본값을 미리 채워 두면
// 사용자가 정하지 않은 강도가 기록처럼 보인다. 여기에는 캐릭터를 쓰지 않는다(§8).
import { el, reducedMotion } from "../dom.js";
import { category } from "../data.js";
import { state, on } from "../state.js";

const BEFORE = "1 거의 스쳐 지나감 → 10 일상에 큰 영향";
const band = (v) => v <= 3 ? "거의 스쳐 지나간 감정" : v <= 7 ? "분명히 느껴졌고 하루에 영향을 준 감정" : "매우 커서 일상 행동에 큰 영향을 준 감정";
const INSET = 15; // 손잡이 반지름. 트랙 양 끝에서 손잡이가 잘리지 않게 한다.

function renderOne(emotion) {
  const id = emotion.code;
  const value = el("span", { class: "sl-val", "aria-hidden": "true" });
  const anchor = el("p", { class: "anchor-line", id: `anchor-${id}` });
  const error = el("p", { class: "field-error", id: `error-${id}`, hidden: true });
  const fill = el("div", { class: "sl-fill" }), thumb = el("div", { class: "sl-thumb" });
  const dots = Array.from({ length: 10 }, () => el("i"));
  const range = el("input", { type: "range", min: "1", max: "10", step: "1", id: `intensity-${id}`, "data-field": `intensity:${id}`,
    "aria-label": `${emotion.label} 강도, 10점 만점`, "aria-describedby": `anchor-${id} error-${id}` });
  const sl = el("div", { class: "sl" }, el("div", { class: "sl-track" }, fill), el("div", { class: "sl-dots" }, dots), range, thumb);
  const minus = el("button", { type: "button", class: "step", "aria-label": `${emotion.label} 강도 낮추기`, text: "−" });
  const plus = el("button", { type: "button", class: "step", "aria-label": `${emotion.label} 강도 올리기`, text: "+" });

  function paint(animate) {
    const v = emotion.intensity;
    sl.classList.toggle("anim", !!animate && !reducedMotion());
    sl.classList.toggle("unset", v == null);
    const x = v == null ? 0 : INSET + ((v - 1) / 9) * (sl.clientWidth - INSET * 2);
    fill.style.width = `${x}px`; thumb.style.left = `${x}px`;
    dots.forEach((d, j) => d.classList.toggle("on", v != null && j < v));
    value.textContent = v ?? "–";
    if (v == null) range.setAttribute("aria-valuetext", "아직 정하지 않음"); else { range.value = String(v); range.setAttribute("aria-valuetext", `강도 ${v}, 10점 만점`); }
    anchor.textContent = v == null ? BEFORE : band(v);
    minus.disabled = v != null && v <= 1; plus.disabled = v != null && v >= 10;
    if (v != null) error.hidden = true;
  }
  const set = (v, animate) => { emotion.intensity = Math.min(10, Math.max(1, v)); paint(animate); };
  range.addEventListener("input", () => set(Number(range.value), false));
  // 값이 없을 때 화살표·클릭이 input 이벤트를 내지 않는 경우(값이 그대로 5)를 위해 change·pointerup에서도 확정한다.
  range.addEventListener("change", () => set(Number(range.value), false));
  range.addEventListener("pointerup", () => set(Number(range.value), false));
  range.addEventListener("keydown", (ev) => { if (emotion.intensity == null && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(ev.key)) queueMicrotask(() => set(Number(range.value), false)); });
  minus.addEventListener("click", () => set((emotion.intensity ?? 6) - 1, true));
  plus.addEventListener("click", () => set((emotion.intensity ?? 4) + 1, true));
  range.value = "5";

  const node = el("div", { class: "intensity", style: { "--c": `var(--${emotion.cat}-accent)` } },
    el("div", { class: "intensity-head" }, el("i", { class: "dot", "aria-hidden": "true" }),
      el("span", { class: "intensity-name", text: emotion.label }), el("span", { class: "caption", text: category(emotion.cat).label }), value),
    el("div", { class: "sl-row" }, minus, sl, plus), anchor, error);
  node.repaint = () => paint(false);
  paint(false);
  return node;
}

export function renderIntensity() {
  const host = el("div", { class: "intensity-list" });
  function draw() {
    if (!state.draft.emotions.length) { host.replaceChildren(el("p", { class: "note", text: "세부 감정을 고르면 감정마다 강도를 정하는 칸이 생깁니다." })); return; }
    host.replaceChildren(...state.draft.emotions.map(renderOne));
    requestAnimationFrame(() => [...host.children].forEach((n) => n.repaint?.()));
  }
  on("emotions", draw); on("cats", draw);
  new ResizeObserver(() => [...host.children].forEach((n) => n.repaint?.())).observe(host);
  draw();
  return host;
}
