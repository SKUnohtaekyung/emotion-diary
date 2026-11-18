// 크기(강도) 고르기 — 길 위의 친구(D-037·D-069 ①, DESIGN_SYSTEM §6.4, UX_SPEC §4 4단계·§12). 2026-11-11 시안 web/js/components/slider.js의
// 모양을 입혔다(TASK-JOURNAL-01 J-3). 진짜 컨트롤과 끌기 규칙은 평면판 그대로다(MAP §4.2 4):
// - 투명한 range가 진짜 컨트롤이다(화살표·Home/End·화면 낭독기). 정하기 전에는 '–'이고 기본값을 채우지 않는다(D-037).
// - range는 손가락·마우스를 직접 받지 않는다. 위에 얹은 얇은 층이 '가로로 6px 넘게 끌기'나 '누르기'일 때만 값을 정하고,
//   세로로 움직이면 아무것도 하지 않아 화면이 그대로 스크롤된다 — 화면을 내리다 길을 스쳐 정하지 않은 값이 기록되지 않게.
// - 그림: 낮은 언덕 띠 뒤 굽이진 회색 길, 강조색으로 칠해진 만큼이 크기, 이정표 열 개, 그 계열의 친구(세부 감정은 조약돌)가 그 자리로 걷는다.
//   친구의 크기·표정은 값과 무관하다(크기는 숫자와 칠해진 길로만 — D-050). 10에서 축하·깃발·문 없음. 그림은 장식(aria-hidden)이다.
// 모양은 CSS 클래스와 CSSOM(setProperty)으로만 준다(CSP — style 속성·innerHTML 없음). SVG는 createElementNS로 짓는다.

import { INTENSITY_MAX, INTENSITY_MIN } from "../../../shared/diary";
import { friendUrl, pebbleUrl } from "../lib/art";
import { h } from "../lib/dom";
import { prefersReducedMotion } from "../lib/motion";

/** 손가락이 이만큼 가로로 움직여야 끌기로 본다(UX_SPEC §4). */
export const DRAG_THRESHOLD_PX = 6;

export const INTENSITY_BEFORE = "1 거의 스쳐 지나감 → 10 일상에 큰 영향";

/** 크기마다 한 줄(시안 slider.js와 같은 세 구간). */
export function intensityBand(value: number): string {
  if (value <= 3) return "거의 스쳐 지나간 감정";
  if (value <= 7) return "분명히 느껴졌고 하루에 영향을 준 감정";
  return "매우 커서 일상 행동에 큰 영향을 준 감정";
}

export type IntensityMotion = "spring" | "drag" | "none";

export interface IntensityOptions {
  id: string;
  /** 낭독기 이름(예: '슬픔 크기') */
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  /** 더 읽어 줄 요소 id(오류 줄 등) */
  describedBy?: string;
  /** 계열 — 길 위를 걷는 친구(main)·조약돌(mini)과 칠하는 색 */
  category: string;
  /** main = 대표 크기(친구 56px), mini = 세부 감정 크기(조약돌 34px) */
  kind?: "main" | "mini";
  /** 머리 줄 왼쪽에 둘 이름(패널 제목 등) */
  heading?: Node;
}

export interface IntensityControl {
  node: HTMLElement;
  set(value: number | null, motion?: IntensityMotion): void;
  focus(): void;
}

const clamp = (value: number) => Math.min(INTENSITY_MAX, Math.max(INTENSITY_MIN, Math.round(value)));

// 친구 그림(160px 원본)에서 발이 그림 아래 끝보다 얼마나 위에 있는지(시안 측정값) — 그만큼 내려 앉혀야 발이 길에 닿는다
const FOOT: Readonly<Record<string, number>> = { enjoyment: 7, wish: 8, sadness: 13, anger: 18, joy: 18, love: 5, hate: 5, fear: 10, disgust: 13 };
const FOOT_SRC = 160;
const PEBBLE_FOOT = 20 / 128;

interface Kind {
  h: number;
  pad: number;
  ry: number;
  amp: number;
  road: number;
  size: number;
  lift: number;
  hit: number;
  hills: readonly [readonly [number, number, number], readonly [number, number, number]];
  pines: boolean;
}
const KINDS: Readonly<Record<"main" | "mini", Kind>> = {
  main: { h: 64, pad: 30, ry: 52, amp: 6, road: 12, size: 56, lift: 6, hit: 64, hills: [[27, 7, 3], [13, 5, 2.2]], pines: true },
  mini: { h: 56, pad: 24, ry: 40, amp: 3.5, road: 8, size: 34, lift: 4, hit: 56, hills: [[18, 3.5, 1.6], [9, 3, 1.4]], pines: false }
};
const TAU = Math.PI * 2;
const SAMPLE = 3;
const EXT = 14;

interface Shape {
  W: number;
  xs: number[];
  ys: number[];
  ps: number[];
  road: string;
  hills: [string, string];
  pines: string;
  step: number;
}

/** 풍경의 모양 — 길·언덕·이정표·손잡이 경로가 모두 여기서 나와 서로 어긋나지 않는다(시안 shape 그대로). W는 무대 폭(px). */
function shape(W: number, k: Kind): Shape {
  const step = (W - k.pad * 2) / 9;
  const roadY = (x: number) => k.ry + k.amp * Math.sin((TAU * 1.25 * x) / W + 0.7);
  const grid: number[] = [];
  for (let x = -EXT; x <= W + EXT + 0.01; x += SAMPLE) grid.push(x);
  const road = grid.map((x) => [x, roadY(x)] as const);
  const len = [0];
  for (let i = 1; i < road.length; i += 1) {
    const [x0, y0] = road[i - 1] as readonly [number, number];
    const [x1, y1] = road[i] as readonly [number, number];
    len.push((len[i - 1] as number) + Math.hypot(x1 - x0, y1 - y0));
  }
  const total = len[len.length - 1] as number;
  const pOf = (x: number) => {
    const t = (x + EXT) / SAMPLE;
    const i = Math.min(road.length - 2, Math.max(0, Math.floor(t)));
    return (((len[i] as number) + ((len[i + 1] as number) - (len[i] as number)) * (t - i)) / total) * 100;
  };
  const poly = (pts: readonly (readonly [number, number])[]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
  const xs = [k.pad * 0.75, ...Array.from({ length: 10 }, (_, i) => k.pad + i * step)];
  const ys = xs.map(roadY);
  const ps = xs.map(pOf);
  const ridge =
    ([lift, wave, ripple]: readonly [number, number, number], f: number, phase: number, gap: number) =>
    (x: number) =>
      Math.min(roadY(x) - gap, k.ry - lift + wave * Math.sin((TAU * f * x) / W + phase) + ripple * Math.sin((TAU * f * 2.3 * x) / W + phase * 1.7));
  const far = ridge(k.hills[0], 0.8, 2.1, 9);
  const near = ridge(k.hills[1], 1.15, 0.4, 8);
  const hillD = (top: (x: number) => number) => `${poly(grid.map((x) => [x, top(x)] as const))}L${poly([...road].reverse()).slice(1)}Z`;
  const f1 = (n: number) => n.toFixed(1);
  const pines = k.pines
    ? (
        [
          [0.17, 15],
          [0.235, 11],
          [0.68, 13],
          [0.735, 17],
          [0.79, 10]
        ] as const
      )
        .map(([f, ht]) => {
          const x = f * W;
          const y = far(x) + 3;
          const w = ht * 0.3;
          return `M${f1(x)} ${f1(y - ht)}L${f1(x + w)} ${f1(y - ht * 0.4)}L${f1(x - w)} ${f1(y - ht * 0.4)}ZM${f1(x)} ${f1(y - ht * 0.68)}L${f1(x + w * 1.3)} ${f1(y)}L${f1(x - w * 1.3)} ${f1(y)}Z`;
        })
        .join("")
    : "";
  return { W, xs, ys, ps, road: poly(road), hills: [hillD(far), hillD(near)], pines, step: ((xs[10] as number) - (xs[1] as number)) / 9 };
}

const SVG_NS = "http://www.w3.org/2000/svg";
function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...children: Element[]): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  node.append(...children);
  return node;
}

const canOffsetPath = (): boolean => typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("offset-path", 'path("M0 0")');

export function intensityControl(options: IntensityOptions): IntensityControl {
  const k = KINDS[options.kind ?? "main"];
  const kind = options.kind ?? "main";
  let value = options.value;
  const anchorId = `${options.id}-anchor`;

  // ── 진짜 컨트롤 ──
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
  const number = h("b", { class: "intensity-number" });
  const numberBox = h("span", { class: "sz-num", "aria-hidden": "true" }, number, h("small", { text: "/ 10" }));
  const anchor = h("p", { class: "intensity-anchor anchor-line", id: anchorId });
  const minus = h("button", { type: "button", class: "stepper", "aria-label": `${options.label} 낮추기`, text: "−" });
  const plus = h("button", { type: "button", class: "stepper", "aria-label": `${options.label} 올리기`, text: "+" });
  const hit = h("div", { class: "intensity-hit", "aria-hidden": "true" });

  // ── 풍경 ──
  const hillA = svg("path", { class: "sz-hill a" });
  const hillB = svg("path", { class: "sz-hill b" });
  const pineD = svg("path", { class: "sz-pines" });
  const far = svg("g", { class: "sz-far" }, hillA, pineD);
  const near = svg("g", { class: "sz-near" }, hillB);
  const road = svg("path", { class: "sz-road", pathLength: "100" });
  const fill = svg("path", { class: "sz-fill", pathLength: "100" });
  const dots = Array.from({ length: 10 }, () => svg("circle", { class: "sz-dot", r: kind === "main" ? "2.6" : "2.2" }));
  const art = svg("svg", { class: "sz-art", "aria-hidden": "true", focusable: "false" }, far, near, road, fill, ...dots);
  const img = h("img", {
    class: kind === "main" ? "friend-img" : "pebble-img",
    src: kind === "main" ? friendUrl(options.category, k.size) : pebbleUrl(options.category, k.size),
    alt: "",
    decoding: "async"
  });
  const body = h("span", { class: "sz-body" }, img);
  const hopper = h("span", { class: "sz-hop" }, body, h("i", { class: "sz-ring" }));
  const walker = h("span", { class: "sz-walker", "aria-hidden": "true" }, hopper);
  const foot = kind === "main" ? ((FOOT[options.category] ?? 10) / FOOT_SRC) * k.size : PEBBLE_FOOT * k.size;
  walker.style.setProperty("--sz-foot", `${foot.toFixed(1)}px`);
  const scene = h("div", { class: "sz-scene intensity-track", "data-kind": kind, "data-motion": "none" }, art, range, hit, walker);
  scene.style.setProperty("--sz-h", `${k.h}px`);
  scene.style.setProperty("--sz-hit", `${k.hit}px`);
  scene.style.setProperty("--sz-size", `${k.size}px`);
  scene.style.setProperty("--sz-road-w", String(k.road));

  let g: Shape | null = null;
  let shown: number | null | undefined;
  let hopping: Animation | null = null;

  const layout = (): boolean => {
    const W = Math.round(scene.clientWidth);
    if (!W) return false;
    if (g?.W === W) return true;
    g = shape(W, k);
    art.setAttribute("viewBox", `0 0 ${W} ${k.h}`);
    art.setAttribute("width", String(W));
    art.setAttribute("height", String(k.h));
    road.setAttribute("d", g.road);
    fill.setAttribute("d", g.road);
    hillA.setAttribute("d", g.hills[0]);
    hillB.setAttribute("d", g.hills[1]);
    pineD.setAttribute("d", g.pines);
    dots.forEach((dot, j) => {
      dot.setAttribute("cx", (g?.xs[j + 1] ?? 0).toFixed(1));
      dot.setAttribute("cy", (g?.ys[j + 1] ?? 0).toFixed(1));
    });
    if (canOffsetPath()) walker.style.setProperty("offset-path", `path("${g.road}")`);
    // 길 들머리에서 기다리는 친구를 스치는 것은 값을 정하지 않는다 — 누르는 층은 값 1·10의 반 칸 바깥까지
    hit.style.setProperty("left", `${((g.xs[1] ?? 0) - g.step / 2).toFixed(1)}px`);
    hit.style.setProperty("width", `${(g.step * 10).toFixed(1)}px`);
    return true;
  };

  // 값의 자리로: 손잡이는 길을 따라, 채움은 같은 자리까지, 언덕은 걷는 반대쪽으로 아주 조금(깊이)
  const place = (v: number | null): void => {
    if (!g) return;
    const i = v ?? 0;
    const p = g.ps[i] ?? 0;
    if (canOffsetPath()) walker.style.setProperty("offset-distance", `${p.toFixed(3)}%`);
    else walker.style.setProperty("transform", `translate(${((g.xs[i] ?? 0) - k.size / 2).toFixed(1)}px, ${((g.ys[i] ?? 0) - k.size).toFixed(1)}px)`);
    fill.style.setProperty("stroke-dashoffset", String(100 - p));
    far.style.setProperty("transform", `translateX(${(-4 * i) / 10}px)`);
    near.style.setProperty("transform", `translateX(${(-9 * i) / 10}px)`);
    if (kind === "mini") body.style.setProperty("transform", `rotate(${(((g.xs[i] ?? 0) / (k.size * 0.42)) * 57.3).toFixed(0)}deg)`);
  };

  // 값이 바뀌면 한 번 통통(크기는 그대로, 위아래로만). 걸음이 길면 칸마다(최대 4번)
  const hop = (times: number, total: number): void => {
    if (prefersReducedMotion() || typeof hopper.animate !== "function") return;
    const lift = times > 1 ? k.lift * 0.7 : k.lift;
    hopping?.cancel();
    hopping = hopper.animate(
      [
        { transform: "translateY(0)", easing: "cubic-bezier(.2,.7,.3,1)" },
        { transform: `translateY(${-lift}px)`, offset: 0.42, easing: "cubic-bezier(.6,0,.9,.5)" },
        { transform: "translateY(0)" }
      ],
      { duration: total / times, iterations: times }
    );
  };

  const paint = (motion: IntensityMotion = "none"): void => {
    const unset = value === null;
    const laid = layout();
    const steps = Math.abs((value ?? 0) - (shown ?? 0));
    let m: IntensityMotion | "glide" = prefersReducedMotion() || !laid ? "none" : motion;
    if (m === "spring" && steps > 2) m = "glide";
    const changed = value !== shown;
    if (changed || m === "none") {
      scene.dataset.motion = m;
      if (m === "glide") scene.style.setProperty("--sz-t", `${Math.min(640, 240 + steps * 60)}ms`);
      else scene.style.removeProperty("--sz-t");
    }
    scene.classList.toggle("unset", unset);
    numberBox.classList.toggle("unset", unset);
    range.classList.toggle("is-unset", unset);
    range.value = String(value ?? INTENSITY_MIN);
    range.setAttribute("aria-valuetext", unset ? "아직 정하지 않음" : `크기 ${value}, 10점 만점`);
    number.textContent = unset ? "–" : String(value);
    anchor.textContent = unset ? INTENSITY_BEFORE : intensityBand(value as number);
    dots.forEach((dot, j) => {
      dot.classList.toggle("on", value !== null && j < value);
    });
    minus.setAttribute("aria-disabled", String(value !== null && value <= INTENSITY_MIN));
    plus.setAttribute("aria-disabled", String(value !== null && value >= INTENSITY_MAX));
    if (laid) place(value);
    if (laid && shown !== undefined && changed && (m === "spring" || m === "glide")) {
      hop(m === "glide" ? Math.min(steps, 4) : 1, m === "glide" ? Math.min(640, 240 + steps * 60) : 340);
    }
    shown = value;
  };

  const commit = (next: number, motion: IntensityMotion = "spring"): void => {
    const clamped = clamp(next);
    if (clamped === value) return;
    value = clamped;
    paint(motion);
    options.onChange(clamped);
  };

  range.addEventListener("input", () => commit(Number(range.value)));
  range.addEventListener("keydown", () => {
    delete scene.dataset.pointer; // 키보드를 쓰기 시작하면 친구 둘레의 초점 링이 나타난다
  });
  range.addEventListener("blur", () => {
    delete scene.dataset.pointer;
  });
  // 정하기 전 상태에서 −/+는 가운데(5)부터 시작한다(시안 slider.js와 같다)
  minus.addEventListener("click", () => {
    if (minus.getAttribute("aria-disabled") !== "true") commit((value ?? 6) - 1);
  });
  plus.addEventListener("click", () => {
    if (plus.getAttribute("aria-disabled") !== "true") commit((value ?? 4) + 1);
  });

  // 얇은 층: 누르기·가로 끌기만 값으로 바꾼다
  const valueAt = (clientX: number): number => {
    const box = scene.getBoundingClientRect();
    if (g && box.width > 0) return 1 + (clientX - box.left - (g.xs[1] ?? 0)) / g.step;
    const ratio = box.width > 0 ? Math.min(1, Math.max(0, (clientX - box.left) / box.width)) : 0;
    return box.width > 0 ? INTENSITY_MIN + ratio * (INTENSITY_MAX - INTENSITY_MIN) : (value ?? INTENSITY_MIN);
  };
  let start: { x: number; y: number; id: number } | null = null;
  let dragging = false;
  let moves = 0;
  hit.addEventListener("pointerdown", (event) => {
    start = { x: event.clientX, y: event.clientY, id: event.pointerId };
    dragging = false;
    moves = 0;
    scene.dataset.pointer = "";
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
    // 끌기의 첫 값은 걸어가고, 이어지는 값은 손가락을 따라간다
    if (dragging) commit(valueAt(event.clientX), moves++ > 0 ? "drag" : "spring");
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

  // 폭이 정해지거나 바뀔 때(접힌 칸을 펼칠 때 포함) 풍경을 다시 잡는다. 화면을 떠나 떼어진 무대는 관찰을 그만둔다
  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(() => {
      if (!scene.isConnected) {
        observer.disconnect();
        return;
      }
      if (g?.W !== Math.round(scene.clientWidth)) paint();
    });
    observer.observe(scene);
  }

  paint();
  const node = h(
    "div",
    { class: `intensity sz-${kind}` },
    h("div", { class: "sz-head" }, options.heading ?? null, h("div", { class: "intensity-row sz-ctrl" }, minus, numberBox, plus)),
    scene,
    anchor
  );
  node.style.setProperty("--c", `var(--${options.category}-accent)`);
  return {
    node,
    set(next, motion = "none") {
      value = next;
      paint(motion);
    },
    focus() {
      range.focus({ preventScroll: false });
    }
  };
}
