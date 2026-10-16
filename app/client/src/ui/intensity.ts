// 크기(강도) 고르기 — 평면판(TASK-SLICE-01 PLAN A-4, D-037, UX_SPEC §4 4단계·§12).
// range + 늘 보이는 숫자 + −/+(44px). 정하기 전에는 '–'이고 기본값을 채우지 않는다.
// 터치로 화면을 내리다 손이 길을 스쳐 값이 정해지지 않게(UX_SPEC §4): range는 손가락·마우스를 직접 받지 않고, 위에 얹은 얇은 층이
// '가로로 6px 넘게 끌기'나 '누르기'일 때만 값을 정한다. 세로로 움직이면 아무것도 하지 않아 화면이 그대로 스크롤된다.
// 키보드(화살표·Home/End)와 화면 낭독기는 range가 그대로 받는다.

import { INTENSITY_MAX, INTENSITY_MIN } from "../../../shared/diary";
import { h } from "../lib/dom";

/** 손가락이 이만큼 가로로 움직여야 끌기로 본다(UX_SPEC §4). */
export const DRAG_THRESHOLD_PX = 6;

export const INTENSITY_BEFORE = "1 거의 스쳐 지나감 → 10 일상에 큰 영향";

/** 크기마다 한 줄(시안 slider.js와 같은 세 구간). */
export function intensityBand(value: number): string {
  if (value <= 3) return "거의 스쳐 지나간 감정";
  if (value <= 7) return "분명히 느껴졌고 하루에 영향을 준 감정";
  return "매우 커서 일상 행동에 큰 영향을 준 감정";
}

export interface IntensityOptions {
  id: string;
  /** 낭독기 이름(예: '슬픔 크기') */
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  /** 더 읽어 줄 요소 id(오류 줄 등) */
  describedBy?: string;
}

export interface IntensityControl {
  node: HTMLElement;
  set(value: number | null): void;
  focus(): void;
}

const clamp = (value: number) => Math.min(INTENSITY_MAX, Math.max(INTENSITY_MIN, Math.round(value)));

export function intensityControl(options: IntensityOptions): IntensityControl {
  let value = options.value;
  const anchorId = `${options.id}-anchor`;
  const range = h("input", {
    type: "range",
    id: options.id,
    class: "intensity-range",
    min: String(INTENSITY_MIN),
    max: String(INTENSITY_MAX),
    step: "1",
    "aria-label": `${options.label}, 10점 만점`,
    "aria-describedby": [anchorId, options.describedBy].filter(Boolean).join(" ")
  });
  const number = h("output", { class: "intensity-number", for: options.id, "aria-hidden": "true" });
  const anchor = h("p", { class: "intensity-anchor", id: anchorId });
  const minus = h("button", { type: "button", class: "btn stepper", "aria-label": `${options.label} 낮추기`, text: "−" });
  const plus = h("button", { type: "button", class: "btn stepper", "aria-label": `${options.label} 올리기`, text: "+" });
  const hit = h("div", { class: "intensity-hit", "aria-hidden": "true" });
  const track = h("div", { class: "intensity-track" }, range, hit);

  const paint = (): void => {
    const unset = value === null;
    range.classList.toggle("is-unset", unset);
    range.value = String(value ?? INTENSITY_MIN);
    range.setAttribute("aria-valuetext", unset ? "아직 정하지 않음" : `크기 ${value}, 10점 만점`);
    number.textContent = unset ? "–" : String(value);
    anchor.textContent = unset ? INTENSITY_BEFORE : intensityBand(value as number);
    minus.setAttribute("aria-disabled", String(value !== null && value <= INTENSITY_MIN));
    plus.setAttribute("aria-disabled", String(value !== null && value >= INTENSITY_MAX));
  };

  const commit = (next: number): void => {
    const clamped = clamp(next);
    if (clamped === value) return;
    value = clamped;
    paint();
    options.onChange(clamped);
  };

  range.addEventListener("input", () => commit(Number(range.value)));
  // 정하기 전 상태에서 −/+는 가운데(5)부터 시작한다(시안 slider.js와 같다)
  minus.addEventListener("click", () => {
    if (minus.getAttribute("aria-disabled") !== "true") commit((value ?? 6) - 1);
  });
  plus.addEventListener("click", () => {
    if (plus.getAttribute("aria-disabled") !== "true") commit((value ?? 4) + 1);
  });

  // 얇은 층: 누르기·가로 끌기만 값으로 바꾼다
  const valueAt = (clientX: number): number => {
    const box = track.getBoundingClientRect();
    if (box.width <= 0) return value ?? INTENSITY_MIN;
    const ratio = Math.min(1, Math.max(0, (clientX - box.left) / box.width));
    return INTENSITY_MIN + ratio * (INTENSITY_MAX - INTENSITY_MIN);
  };
  let start: { x: number; y: number; id: number } | null = null;
  let dragging = false;
  hit.addEventListener("pointerdown", (event) => {
    start = { x: event.clientX, y: event.clientY, id: event.pointerId };
    dragging = false;
  });
  hit.addEventListener("pointermove", (event) => {
    if (!start || event.pointerId !== start.id) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!dragging && Math.abs(dx) > DRAG_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) {
      dragging = true;
      try {
        hit.setPointerCapture(event.pointerId);
      } catch {
        // 붙잡지 못해도 끌기는 된다
      }
    }
    if (dragging) commit(valueAt(event.clientX));
  });
  const end = (event: PointerEvent, cancelled: boolean): void => {
    if (!start || event.pointerId !== start.id) return;
    const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    if (!cancelled && !dragging && moved <= DRAG_THRESHOLD_PX) {
      commit(valueAt(event.clientX));
      range.focus({ preventScroll: true });
    }
    start = null;
    dragging = false;
  };
  hit.addEventListener("pointerup", (event) => end(event, false));
  hit.addEventListener("pointercancel", (event) => end(event, true));

  paint();
  const node = h(
    "div",
    { class: "intensity" },
    h("div", { class: "intensity-row" }, minus, number, plus),
    track,
    anchor
  );
  return {
    node,
    set(next) {
      value = next;
      paint();
    },
    focus() {
      range.focus({ preventScroll: false });
    }
  };
}
