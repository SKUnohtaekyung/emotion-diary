// 크기 선택기(DESIGN_SYSTEM §6.4, D-037·D-065·D-069): 길 위의 친구. 화면 말은 '크기'이고 데이터 이름은 강도(intensity)다.
// 계열마다 작은 풍경 하나 — 낮은 언덕 띠 뒤로 굽이진 회색 길이 놓이고, 그 계열의 친구가 길을 걸어 크기를 알린다. 길에서 강조색으로 칠해진 만큼이 크기다.
// 하지 않는 것: 친구의 크기·모양을 값에 따라 바꾸기, 10에서 축하·"최고"·레벨 표시, 길 끝의 깃발·문. 길은 양쪽으로 흐려지며 계속 이어진다.
// 진짜 컨트롤은 무대를 덮은 투명 native range다(화살표·Home/End·스크린리더 값·초점). 친구는 그 값을 따라가는 그림이고 키보드 초점은 친구 둘레의 링이 알린다.
// 누르기·끌기는 그 위의 얇은 층(sz-hit)이 받는다 — native range는 터치 시작만으로 값이 옮겨 가서, 계열이 여러 개라 화면을 스크롤할 때 손이 길을 스치면 정하지 않은 값이 "기록"되기 때문이다.
// 상태 계약은 그대로다: ① 고르기 전 상태(값 없음)가 있다 — 기본값을 미리 채우면 사용자가 정하지 않은 강도가 기록처럼 보인다(친구는 길 들머리에서 기다리고 숫자는 "–").
// ② 고른 계열마다 패널 하나에서 대표 강도를 정하고, 세부 감정은 "세부 감정도 크기를 정하고 싶어요"를 눌러야 따로 정한다(D-059). 따로 정하지 않은 세부 감정에는 대표 강도가 들어간다(state.effectiveIntensity).
// ③ 세부 감정은 같은 구조의 작은 길이고 손잡이는 친구가 아니라 그 계열의 조약돌이다 — 세부 감정 화면에서 조약돌이 친구 발치에 모였듯 여기서는 조약돌이 길을 굴러간다(친구는 화면에서 모두 같은 크기이므로 작은 친구를 따로 두지 않는다).
import { el, svgEl, reducedMotion, announce } from "../dom.js";
import { category, FRIENDS, friendImg, pebbleImg } from "../data.js";
import { state, on, emit, effectiveIntensity } from "../state.js";

const BEFORE = "1 거의 스쳐 지나감 → 10 일상에 큰 영향";
const band = (v) => v <= 3 ? "거의 스쳐 지나간 감정" : v <= 7 ? "분명히 느껴졌고 하루에 영향을 준 감정" : "매우 커서 일상 행동에 큰 영향을 준 감정";
const expanded = new Set(); // 세부 크기를 펼쳐 둔 계열. 화면을 다시 그려도 유지한다(값은 상태에 있으므로 접어도 그대로다).

// 친구 그림(160px 원본)에서 발이 그림 아래 끝보다 얼마나 위에 있는지(알파 경계 측정, 2026-09-22). 그만큼 내려 앉혀야 발이 길에 닿는다. 조약돌(128px 원본)은 평균 16px이다.
const FOOT = { enjoyment: 7, wish: 8, sadness: 13, anger: 18, joy: 18, love: 5, hate: 5, fear: 10, disgust: 13 };
const FOOT_SRC = 160, PEBBLE_FOOT = 20 / 128; // 조약돌은 굴러 흔들리므로 아래 여백(평균 16px)보다 조금 더 내려 길에 살짝 얹힌다

// 무대 치수(px). h 무대 높이, pad 양 끝에서 값 1·10의 자리까지, ry 길 가운데 높이, amp 굽이 폭, road 길 굵기, size 손잡이 그림 크기, lift 통통 높이, hit 누르는 층의 높이.
// hills: 먼·가까운 언덕 마루의 [길 위로 솟은 높이, 물결 폭, 잔물결 폭]. pines: 먼 언덕 마루에 작은 소나무를 세울지.
const KINDS = {
  main: { h: 64, pad: 30, ry: 52, amp: 6, road: 12, size: 56, lift: 6, hit: 64, hills: [[27, 7, 3], [13, 5, 2.2]], pines: true },
  mini: { h: 56, pad: 24, ry: 40, amp: 3.5, road: 8, size: 34, lift: 4, hit: 56, hills: [[18, 3.5, 1.6], [9, 3, 1.4]], pines: false }
};
const TAU = Math.PI * 2, SAMPLE = 3, EXT = 14; // 길·언덕은 3px마다 표본을 잡고 무대 밖으로 14px 더 그려 언덕이 밀려도 끊기지 않게 한다
const HAS_OFFSET = typeof CSS !== "undefined" && CSS.supports?.("offset-path", 'path("M0 0")');

// 풍경의 모양. 길·언덕·이정표·손잡이 경로가 모두 이 한 곳에서 나오므로 서로 어긋나지 않는다. W는 무대 폭(px).
function shape(W, k) {
  const step = (W - k.pad * 2) / 9;
  const roadY = (x) => k.ry + k.amp * Math.sin((TAU * 1.25 * x) / W + 0.7);
  const grid = []; for (let x = -EXT; x <= W + EXT + 0.01; x += SAMPLE) grid.push(x);
  const road = grid.map((x) => [x, roadY(x)]);
  const len = [0]; for (let i = 1; i < road.length; i += 1) len.push(len[i - 1] + Math.hypot(road[i][0] - road[i - 1][0], road[i][1] - road[i - 1][1]));
  const pOf = (x) => { const t = (x + EXT) / SAMPLE, i = Math.min(road.length - 2, Math.max(0, Math.floor(t))); return ((len[i] + (len[i + 1] - len[i]) * (t - i)) / len[len.length - 1]) * 100; };
  const poly = (pts) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
  const xs = [k.pad * 0.75, ...Array.from({ length: 10 }, (_, i) => k.pad + i * step)]; // 0은 고르기 전(길 들머리), 1~10은 값
  const ys = xs.map(roadY), ps = xs.map(pOf);
  // 언덕: 위 가장자리는 완만한 물결이고 아래 가장자리는 길 한가운데를 따라가므로(길 굵기가 가린다) 상자처럼 잘린 단면이 보이지 않는다.
  const ridge = ([lift, wave, ripple], f, phase, gap) => (x) => Math.min(roadY(x) - gap, k.ry - lift + wave * Math.sin((TAU * f * x) / W + phase) + ripple * Math.sin((TAU * f * 2.3 * x) / W + phase * 1.7));
  const far = ridge(k.hills[0], 0.8, 2.1, 9), near = ridge(k.hills[1], 1.15, 0.4, 8);
  const hillD = (top) => poly(grid.map((x) => [x, top(x)])) + "L" + poly([...road].reverse()).slice(1) + "Z";
  // 먼 언덕 마루의 작은 소나무(오늘 숲의 나무와 같은 종류, 언제나 같은 자리).
  const f1 = (n) => n.toFixed(1);
  const pines = k.pines ? [[0.17, 15], [0.235, 11], [0.68, 13], [0.735, 17], [0.79, 10]].map(([f, h]) => { const x = f * W, y = far(x) + 3, w = h * 0.3;
    return `M${f1(x)} ${f1(y - h)}L${f1(x + w)} ${f1(y - h * 0.4)}L${f1(x - w)} ${f1(y - h * 0.4)}ZM${f1(x)} ${f1(y - h * 0.68)}L${f1(x + w * 1.3)} ${f1(y)}L${f1(x - w * 1.3)} ${f1(y)}Z`; }).join("") : "";
  return { W, xs, ys, ps, road: poly(road), hills: [hillD(far), hillD(near)], pines };
}

// 슬라이더 하나. 값이 놓이는 자리(get·set)를 바꿔 끼워 대표 강도와 세부 감정 강도가 함께 쓴다. motion: "spring"(걸어가기) · "drag"(손가락을 따라가기) · "none"(즉시).
function createSlider({ kind = "main", cat, id, field, label, get, set, describedBy = [], onPaint }) {
  const k = KINDS[kind], short = label.replace(/, 10점 만점$/, "");
  const num = el("b", { text: "–" });
  const value = el("span", { class: "sz-num", "aria-hidden": "true" }, num, el("small", { text: "/ 10" }));

  // 그림: 언덕 둘 · 길 · 채움 · 이정표 열 개
  const hillA = svgEl("path", { class: "sz-hill a" }), hillB = svgEl("path", { class: "sz-hill b" }), pines = svgEl("path", { class: "sz-pines" });
  const far = svgEl("g", { class: "sz-far" }, hillA, pines), near = svgEl("g", { class: "sz-near" }, hillB); // 걸을 때 반대쪽으로 다르게 밀리는 두 층(깊이)
  const road = svgEl("path", { class: "sz-road", pathLength: "100" }), fill = svgEl("path", { class: "sz-fill", pathLength: "100" });
  const dots = Array.from({ length: 10 }, () => svgEl("circle", { class: "sz-dot", r: kind === "main" ? "2.6" : "2.2" }));
  const art = svgEl("svg", { class: "sz-art", "aria-hidden": "true", focusable: "false" }, far, near, road, fill, dots);

  // 손잡이: main은 그 계열의 친구(크기는 늘 같고 위치만 바뀐다), mini는 그 계열의 조약돌(구르며 간다)
  const img = kind === "main" ? friendImg(cat, { size: k.size, label: false }) : pebbleImg(cat, { size: k.size });
  const body = el("span", { class: "sz-body" }, img), ring = el("i", { class: "sz-ring" });
  const hopper = el("span", { class: "sz-hop" }, body, ring);
  const foot = kind === "main" ? (FOOT[cat] / FOOT_SRC) * k.size : PEBBLE_FOOT * k.size;
  const walker = el("span", { class: "sz-walker", "aria-hidden": "true", style: { "--sz-foot": `${foot.toFixed(1)}px` } }, hopper);

  const range = el("input", { type: "range", class: "sz-range", min: "1", max: "10", step: "1", id, "data-field": field, "aria-label": label, "aria-describedby": describedBy.join(" ") || null });
  const hit = el("span", { class: "sz-hit", "aria-hidden": "true" });
  const scene = el("div", { class: "sz-scene", "data-kind": kind, "data-motion": "none", style: { "--sz-h": `${k.h}px`, "--sz-hit": `${k.hit}px`, "--sz-size": `${k.size}px`, "--sz-road-w": String(k.road) } }, art, range, hit, walker);
  const minus = el("button", { type: "button", class: "step", "aria-label": `${short} 낮추기`, text: "−" });
  const plus = el("button", { type: "button", class: "step", "aria-label": `${short} 올리기`, text: "+" });

  let g = null, shown; // g: 지금 폭의 풍경 모양, shown: 마지막으로 그린 값(undefined = 아직 그린 적 없음)

  function layout() {
    const W = Math.round(scene.clientWidth);
    if (!W) return false;
    if (g?.W === W) return true;
    g = shape(W, k);
    art.setAttribute("viewBox", `0 0 ${W} ${k.h}`); art.setAttribute("width", String(W)); art.setAttribute("height", String(k.h));
    road.setAttribute("d", g.road); fill.setAttribute("d", g.road);
    hillA.setAttribute("d", g.hills[0]); hillB.setAttribute("d", g.hills[1]); pines.setAttribute("d", g.pines);
    dots.forEach((d, j) => { d.setAttribute("cx", g.xs[j + 1].toFixed(1)); d.setAttribute("cy", g.ys[j + 1].toFixed(1)); });
    if (HAS_OFFSET) walker.style.offsetPath = `path("${g.road}")`;
    g.step = (g.xs[10] - g.xs[1]) / 9;
    hit.style.left = `${(g.xs[1] - g.step / 2).toFixed(1)}px`; hit.style.width = `${(g.step * 10).toFixed(1)}px`; // 길들머리에서 기다리는 친구를 스치는 것은 값을 정하지 않는다
    return true;
  }
  // 값 v의 자리로: 손잡이는 길을 따라(offset-path), 채움은 같은 자리까지, 언덕은 걷는 반대쪽으로 아주 조금 밀린다(깊이).
  function place(v) {
    const i = v ?? 0, p = g.ps[i];
    if (HAS_OFFSET) walker.style.offsetDistance = `${p.toFixed(3)}%`;
    else walker.style.transform = `translate(${(g.xs[i] - k.size / 2).toFixed(1)}px, ${(g.ys[i] - k.size).toFixed(1)}px)`;
    fill.style.strokeDashoffset = String(100 - p);
    far.style.transform = `translateX(${(-4 * i) / 10}px)`; near.style.transform = `translateX(${(-9 * i) / 10}px)`;
    if (kind === "mini") body.style.transform = `rotate(${((g.xs[i] / (k.size * 0.42)) * 57.3).toFixed(0)}deg)`; // 굴러간 거리만큼 돈다
  }
  // 값이 바뀔 때 통통. 크기는 바꾸지 않고 위아래로만 뛴다. 걸음이 길면 칸마다(최대 4번) 뛰며 걷는다.
  function hop(times, total) {
    if (reducedMotion() || !hopper.animate) return;
    const lift = times > 1 ? k.lift * 0.7 : k.lift;
    hopper.animate([{ transform: "translateY(0)", easing: "cubic-bezier(.2,.7,.3,1)" }, { transform: `translateY(${-lift}px)`, offset: 0.42, easing: "cubic-bezier(.6,0,.9,.5)" }, { transform: "translateY(0)" }], { duration: total / times, iterations: times });
  }

  function repaint(motion = "none") {
    const v = get(), laid = layout(); // 접힌 칸처럼 아직 폭이 없으면 그리지도 뛰지도 않는다(펼치면 ResizeObserver가 다시 부른다)
    const changed = v !== shown, n = Math.abs((v ?? 0) - (shown ?? 0)); // n: 걸어야 할 칸 수(고르기 전은 길 들머리 = 0)
    // 움직임: 한두 칸은 스프링으로 통통 걷고, 세 칸 넘게 가면 넘치지 않고 미끄러지며 칸마다 뛴다. 손가락을 따라갈 때(drag)는 뛰지 않는다. 값이 그대로면 앞서 정한 움직임을 건드리지 않는다.
    let m = reducedMotion() || !laid ? "none" : motion;
    if (m === "spring" && n > 2) m = "glide";
    if (changed || m === "none") {
      scene.dataset.motion = m;
      if (m === "glide") scene.style.setProperty("--sz-t", `${Math.min(640, 240 + n * 60)}ms`); else scene.style.removeProperty("--sz-t");
    }
    scene.classList.toggle("unset", v == null); value.classList.toggle("unset", v == null);
    num.textContent = v ?? "–";
    dots.forEach((d, j) => d.classList.toggle("on", v != null && j < v));
    if (v == null) range.setAttribute("aria-valuetext", "아직 정하지 않음"); else { range.value = String(v); range.setAttribute("aria-valuetext", `크기 ${v}, 10점 만점`); }
    // 끝에 닿아도 초점을 잃지 않도록 disabled 대신 aria-disabled를 쓴다(누름은 무시).
    minus.setAttribute("aria-disabled", String(v != null && v <= 1)); plus.setAttribute("aria-disabled", String(v != null && v >= 10));
    if (laid) place(v);
    if (laid && shown !== undefined && changed && (m === "spring" || m === "glide")) hop(m === "glide" ? Math.min(n, 4) : 1, m === "glide" ? Math.min(640, 240 + n * 60) : 340);
    shown = v;
    onPaint?.(v);
  }

  // 값이 놓이면 state를 바꾸고 emit이 패널의 모든 슬라이더(대표가 바뀌면 따라가는 세부 감정 포함)를 같은 움직임으로 다시 그린다.
  const commit = (v, motion = "spring", announceIt = false) => {
    const n = Math.min(10, Math.max(1, v));
    set(n, motion);
    if (announceIt) announce(`${short} ${n}, 10점 만점`);
  };
  // 키보드·보조기기(native range): 값이 없을 때 화살표가 input 이벤트를 내지 않는 경우(값이 그대로 5)를 위해 change에서도 확정한다. 이미 값이 있고 그대로면 확정하지 않는다.
  const settle = () => { const v = Number(range.value); if (get() == null || v !== get()) commit(v); };
  range.addEventListener("input", () => commit(Number(range.value)));
  range.addEventListener("change", settle);
  range.addEventListener("keydown", (ev) => {
    delete scene.dataset.pointer; // 키보드를 쓰기 시작하면 초점 링이 나타난다
    if (get() == null && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(ev.key)) queueMicrotask(() => commit(Number(range.value)));
  });
  range.addEventListener("blur", () => { delete scene.dataset.pointer; });

  // 누르기·끌기: 마우스는 누르는 즉시 그 자리의 값이 되고 끄는 대로 따라간다. 터치·펜은 가로로 6px 넘게 끌면 끌기이고, 그대로 떼면 탭이며, 세로로 움직이면 스크롤에 양보한다(pointercancel).
  // 첫 값은 걸어가고(탭·끌기 시작) 이어지는 값은 손가락을 따라간다. 누른 뒤에는 native range로 초점을 옮겨 화살표로 이어서 조작할 수 있다(pointerdown을 막아 브라우저의 기본 초점 이동·글자 선택이 덮어쓰지 않게 한다. 세로 스크롤은 touch-action이 맡으므로 막히지 않는다).
  let press = null;
  const valueAt = (clientX) => { const x = clientX - scene.getBoundingClientRect().left; return Math.min(10, Math.max(1, Math.round(1 + (x - g.xs[1]) / g.step))); };
  const follow = (clientX) => { const v = valueAt(clientX); if (get() == null || v !== get()) commit(v, press.moves++ > 0 ? "drag" : "spring"); };
  hit.addEventListener("pointerdown", (ev) => {
    if (!g || ev.button > 0) return;
    ev.preventDefault(); scene.dataset.pointer = ""; range.focus({ preventScroll: true }); // 눌러서 얻은 초점에는 링을 그리지 않는다(스크립트 초점은 브라우저가 focus-visible로 셈한다)
    press = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, moves: 0, drag: ev.pointerType === "mouse" };
    if (press.drag) { hit.setPointerCapture(ev.pointerId); follow(ev.clientX); }
  });
  hit.addEventListener("pointermove", (ev) => {
    if (!press || ev.pointerId !== press.id) return;
    if (!press.drag) {
      const dx = Math.abs(ev.clientX - press.x), dy = Math.abs(ev.clientY - press.y);
      if (dx > 6 && dx > dy) { press.drag = true; hit.setPointerCapture(ev.pointerId); follow(ev.clientX); }
      return;
    }
    follow(ev.clientX);
  });
  hit.addEventListener("pointerup", (ev) => { if (press && ev.pointerId === press.id) { if (!press.drag) follow(ev.clientX); press = null; } });
  hit.addEventListener("pointercancel", (ev) => { if (press && ev.pointerId === press.id) press = null; });
  minus.addEventListener("click", () => { if (minus.getAttribute("aria-disabled") !== "true") commit((get() ?? 6) - 1, "spring", true); });
  plus.addEventListener("click", () => { if (plus.getAttribute("aria-disabled") !== "true") commit((get() ?? 4) + 1, "spring", true); });

  // 폭이 정해지거나 바뀔 때(접힌 칸을 펼칠 때 포함) 풍경을 다시 잡는다. 화면을 떠나 떼어진 무대는 관찰을 그만둔다.
  scene.szRepaint = () => { if (scene.isConnected) repaint(); else sceneResize.unobserve(scene); };
  sceneResize.observe(scene);
  range.value = "5";
  repaint();
  return { scene, minus, plus, value, repaint };
}
const sceneResize = new ResizeObserver((entries) => { for (const en of entries) en.target.szRepaint?.(); });

function renderPanel(cat, index = 0) {
  const c = category(cat), sliders = [];
  const anchor = el("p", { class: "anchor-line", id: `anchor-${cat}` });
  const error = el("p", { class: "field-error", id: `reprError-${cat}`, hidden: true });
  const rep = createSlider({ kind: "main", cat, id: `repr-${cat}`, field: `repr:${cat}`, label: `${c.label} 크기, 10점 만점`, describedBy: [`anchor-${cat}`, `reprError-${cat}`],
    get: () => state.draft.repr[cat] ?? null,
    set: (v, motion) => { state.draft.repr[cat] = v; emit("intensity", { cat, motion }); },
    onPaint: (v) => { anchor.textContent = v == null ? BEFORE : band(v); if (v != null) error.hidden = true; } });
  sliders.push(rep);

  // 세부 감정마다 작은 길 하나. 기본값은 대표 강도이고, 사용자가 바꾼 것만 "따로 정함"이 붙는다. "대표와 같게"로 다시 따라가게 할 수 있다.
  const detailsId = `intdet-${cat}`;
  const rows = state.draft.emotions.filter((e) => e.cat === cat).map((e) => {
    const tag = el("span", { class: "own-tag", text: "따로 정함" });
    const reset = el("button", { type: "button", class: "link", text: "대표 크기와 같게", "aria-label": `${e.label} 크기를 대표 크기와 같게`, onclick: () => { e.own = null; emit("intensity", { cat, motion: "spring" }); announce(`${e.label} 크기를 대표 크기와 같게 했어요`); document.getElementById(`own-${e.code}`)?.focus({ preventScroll: true }); } });
    const s = createSlider({ kind: "mini", cat, id: `own-${e.code}`, field: `own:${e.code}`, label: `${e.label} 크기, 10점 만점`,
      get: () => effectiveIntensity(state.draft, e),
      set: (v, motion) => { e.own = v; emit("intensity", { cat, motion }); },
      onPaint: () => { tag.hidden = e.own == null; reset.hidden = e.own == null; } });
    sliders.push(s);
    return el("div", { class: "mini sz-mini" }, el("div", { class: "sz-head" }, el("span", { class: "sl-name" }, e.label, " ", tag), el("div", { class: "sz-ctrl sl-row" }, s.minus, s.value, s.plus)), s.scene, reset);
  });
  const details = el("div", { class: "int-details", id: detailsId, hidden: !expanded.has(cat) }, rows);
  const toggle = el("button", { type: "button", class: "link int-more", "aria-expanded": String(expanded.has(cat)), "aria-controls": detailsId, text: "세부 감정도 크기를 정하고 싶어요",
    onclick: () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open)); details.hidden = !open;
      if (open) { expanded.add(cat); requestAnimationFrame(() => sliders.forEach((s) => s.repaint())); } else expanded.delete(cat);
    } });

  const node = el("section", { class: "int-panel sz-block", "aria-labelledby": `intname-${cat}`, style: { "--c": `var(--${cat}-accent)`, "--i": String(index) } },
    el("div", { class: "sz-head" },
      el("div", { class: "sz-who" }, el("strong", { id: `intname-${cat}`, text: FRIENDS[cat].name }), el("span", { text: `${c.label}의 크기` })),
      el("div", { class: "sz-ctrl sl-row" }, rep.minus, rep.value, rep.plus)),
    rep.scene, anchor, error, toggle, details);
  node.repaint = (motion = "none") => sliders.forEach((s) => s.repaint(motion));
  on("intensity", (detail) => { if (detail?.cat === cat && node.isConnected) node.repaint(detail.motion ?? "none"); });
  return node;
}

// 고른 계열(세부 감정이 있는 계열)마다 패널 하나. 고른 순서대로 위에서 아래로 놓이고 크기는 모두 같다.
export function renderIntensity() {
  const host = el("div", { class: "int-list" });
  let drawn = false;
  function draw() {
    if (drawn && !host.isConnected) return; // 다른 화면으로 떠난 뒤의 이벤트는 무시한다(리스너는 지워지지 않는다)
    drawn = true;
    const cats = state.draft.cats.filter((cat) => state.draft.emotions.some((e) => e.cat === cat));
    if (!cats.length) { host.replaceChildren(el("p", { class: "note", text: "세부 감정을 고르면 계열마다 크기를 정하는 칸이 생겨요." })); return; }
    host.replaceChildren(...cats.map((cat, i) => renderPanel(cat, i)));
    requestAnimationFrame(() => [...host.children].forEach((n) => n.repaint?.()));
  }
  on("emotions", draw); on("cats", draw);
  draw();
  return host;
}
