// 온보딩(D-092): WHY를 말하는 여섯 장면 이야기 → 시작하기 전에(고지). 영상 파일·Lottie가 아니라 이미 있는 그림(친구·조약돌·언덕·노트)을 코드로 움직인다.
// 글자는 실제 텍스트이고 장면이 바뀔 때마다 aria-live로 읽힌다. 장면은 자동으로 넘어가고, 누르면 바로 다음, '건너뛰기'는 늘 있다.
// 움직임 줄이기: 흐름·걷기 없이 장면의 끝 모습만 보이고 자동 진행이 없으며, 장면마다 '다음' 버튼이 선다(WCAG 2.2.2).
// 움직임 줄이기를 켜지 않아도 왼쪽 위 일시정지 버튼으로 자동 진행과 모든 움직임을 멈추고 다시 이어 갈 수 있다(WCAG 2.2.2, 2026-09-25 사용자 결정).
// QA: #/welcome?scene=4(네 번째 장면부터) · ?slow=2(두 배 느리게) · ?p=2('시작하기 전에'만)
// '시작하기 전에'는 법적 고지가 아니라 WHY의 약속 두 줄이다(D-093 — 안전 안내·위기 링크는 온보딩에서 뺐고 위기 안내는 설정 입구에만 남는다).
import { el, svgEl, reducedMotion } from "../dom.js";
import { splashDone } from "../splash.js";

const A = "/design/";
const F = (slug, key) => `${A}characters/flat-friends/ui/${slug}--${key}-160.png`;
const P = (key) => `${A}pebbles/ui/${key}-128.png`;
const STONE_SRC = `${A}pebbles/ui/stone-rest-320.png`;
const NS = "http://www.w3.org/2000/svg";
const OUT = "cubic-bezier(.16,1,.3,1)", IN = "cubic-bezier(.55,0,.75,.3)", INOUT = "cubic-bezier(.65,0,.35,1)", SOFT = "cubic-bezier(.33,0,.2,1)";
const SW = 390, SH = 594; // 무대 설계 크기

const COPY = [
  ["무엇이든 물으면<br>답이 금방 오는 시대예요", "AI는 많은 답을 빠르게 만들어 줘요."],
  ["그런데 그중 무엇을 고를지는<br>누가 정할까요?", "답이 많을수록, 고르는 기준이 필요해요."],
  ["고르는 기준은<br>내가 나를 아는 만큼 생겨요", "무엇을 좋아하고, 무엇에 흔들리고<br>무엇을 지키고 싶은지."],
  ["그 단서는<br><em>매일의 마음</em>에 있어요", "감정은 정답이 아니라<br>나를 알려 주는 신호예요."],
  ["잘 설명하지 못해도<br>괜찮아요", "이름 붙여 적다 보면<br>무엇이 중요한지 조금씩 보여요."],
  ["해석과 선택은<br>언제나 내가 해요", "나는 어떤 사람으로 살아갈지<br>내 쪽에서 골라요."]
];
const DUR = [4300, 4400, 4600, 6600, 7800, null]; // ⑤는 글이 두 줄·이름 칸이 둘이라 길다. ⑥은 '다음'을 기다린다

// 중심선을 따라 아래 w0에서 위 w1로 좁아지는 흰 길(land.js road()와 같은 방식). probe는 길이를 재는 데만 쓰는 붙어 있는 svg다.
function taper(probeSvg, d, w0, w1) {
  const pr = document.createElementNS(NS, "path"); pr.setAttribute("d", d); probeSvg.append(pr);
  const L = pr.getTotalLength(), N = 56, l = [], r = [];
  for (let k = 0; k <= N; k++) {
    const s = (k / N) * L, a = pr.getPointAtLength(s), b = pr.getPointAtLength(Math.min(L, s + 1)), c = pr.getPointAtLength(Math.max(0, s - 1));
    const dx = b.x - c.x, dy = b.y - c.y, n = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * (k / N) ** .75) / 2;
    l.push(`${(a.x - (dy / n) * w).toFixed(1)} ${(a.y + (dx / n) * w).toFixed(1)}`); r.push(`${(a.x + (dy / n) * w).toFixed(1)} ${(a.y - (dx / n) * w).toFixed(1)}`);
  }
  pr.remove(); return `M${l.join("L")}L${r.reverse().join("L")}Z`;
}
const endOf = (probeSvg, d) => { const pr = document.createElementNS(NS, "path"); pr.setAttribute("d", d); probeSvg.append(pr); const e = pr.getPointAtLength(pr.getTotalLength()); pr.remove(); return e; };

const ICON = {
  pen: "M4 20l4.2-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20zM13.5 7.5l3 3",
  lock: ["M6.2 11.2a2 2 0 0 1 2-2h7.6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H8.2a2 2 0 0 1-2-2z", "M8.6 9.2V7.6a3.4 3.4 0 0 1 6.8 0v1.6"]
};
const icon = (d) => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, [d].flat().map((p) => svgEl("path", { d: p })));
const chevron = (d) => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d }));

// ── 시작하기 전에 ── 이야기 끝의 '다음'으로 옆에서 들어오거나(overlay), ?p=2로 혼자 열린다(solo).
function buildNotice(navigate, { solo, onBack }) {
  const ground = el("div", { class: "ob-ground" });
  // 이야기의 언덕을 이어 붙이고, 아래에서 올라온 흰 길이 나의 돌에서 끝난다(길 끝은 돌 밑에 숨는다). '시작하기'는 그 길 위에 선다.
  // 그림은 설계 좌표(390×170)를 1.5배로 키워(사용자 2026-09-25 '밑에 디자인 사이즈를 키워') 위에 하늘 여백을 둔 390×300 상자에 담는다 —
  // 넓은 화면에서 아래 기준으로 잘려도 잘리는 것은 빈 하늘이고 돌은 잘리지 않는다(전에는 높이 170 고정 + slice라 넓으면 돌 윗부분이 잘렸다).
  const gsvg = svgEl("svg", { viewBox: "0 0 390 300", preserveAspectRatio: "xMidYMax slice", "aria-hidden": "true" },
    svgEl("g", { transform: "translate(-97.5 45) scale(1.5)" },
      svgEl("path", { class: "h-far", d: "M-240 58C60 30 170 26 250 42C320 56 360 50 630 42V170H-240Z" }),
      svgEl("path", { class: "h-mid", d: "M-240 92C90 66 240 70 630 98V170H-240Z" }),
      svgEl("path", { class: "h-near", d: "M-240 128C110 110 260 116 630 132V170H-240Z" }),
      svgEl("path", { class: "road" }),
      svgEl("image", { href: STONE_SRC, x: "176", y: "22", width: "40", height: "30" })));
  ground.append(gsvg);
  const start = el("button", { type: "button", class: "ob-start", text: "시작하기", onclick: (e) => { e.stopPropagation(); navigate("today"); } });
  const notice = el("section", { class: `ob-notice${solo ? " solo open" : ""}`, "aria-labelledby": "obNoticeTitle" },
    el("div", { class: "top" }, el("button", { type: "button", class: "ob-back", "aria-label": "이야기로 돌아가기", onclick: (e) => { e.stopPropagation(); onBack(); } }, chevron("M14.5 5.5 8 12l6.5 6.5"))),
    el("div", { class: "body" },
      el("p", { class: "eyebrow", text: "시작하기 전에" }),
      el("h1", { id: "obNoticeTitle", tabindex: "-1" }, "이곳은 나를 알아가는", el("br"), "나만의 공간이에요"),
      el("ul", { class: "items" },
        el("li", {}, el("span", { class: "ob-face" }, icon(ICON.pen)), el("div", {}, el("b", { text: "정답을 정해 주지 않아요" }), el("p", { text: "감정을 진단하거나 판단하지 않아요. 어떤 마음이었는지는 내가 정해요." }))),
        el("li", {}, el("span", { class: "ob-face" }, icon(ICON.lock)), el("div", {}, el("b", { text: "내 기록은 나만의 것이에요" }), el("p", { text: "직접 쓴 일기를 자동으로 분석하거나 지켜보지 않아요." }))))),
    ground, start);
  // 길은 붙은 뒤에야 길이를 잴 수 있다 — 화면에 붙인 다음 그린다(road()).
  const road = () => gsvg.querySelector(".road").setAttribute("d", taper(gsvg, "M210 214C204 160 190 96 196 38", 156, 8)); // 길 끝(196,38)은 돌 가운데 밑
  notice.addEventListener("click", (e) => e.stopPropagation());
  return { notice, ground, road, start };
}

export function renderWelcome(main, navigate, params) {
  const RM = reducedMotion();
  const SLOW = Math.min(4, Math.max(.25, Number(params.get("slow")) || 1));

  // '시작하기 전에'만 따로(QA)
  if (params.get("p") === "2") {
    const n = buildNotice(navigate, { solo: true, onBack: () => { location.hash = "#/welcome?scene=6"; } });
    main.replaceChildren(el("div", { class: "screen ob-solo" }, n.notice));
    n.road();
    return;
  }

  const root = el("div", { class: "screen ob" });
  const alive = () => root.isConnected;
  const live = new Set();
  function play(node, kf, o = {}) {
    const opt = { fill: "both", ...o };
    if (RM) Object.assign(opt, { duration: 1, delay: 0, iterations: 1 });
    else { opt.duration = (opt.duration ?? 400) * SLOW; opt.delay = (opt.delay ?? 0) * SLOW; }
    const a = node.animate(kf, opt); if (paused) a.pause(); live.add(a); a.finished.then(() => live.delete(a), () => live.delete(a)); return a;
  }
  // 기다림은 멈춘 동안 흐르지 않는다(50ms씩 세어 멈춘 동안은 빼지 않는다) — 노트 글자 쓰기·친구의 호흡 시작 같은 뒤따르는 일이 멈춤을 지킨다
  let paused = false;
  const wait = async (ms) => { if (RM) return; let left = ms * SLOW; while (left > 0) { const step = Math.min(left, 50); await new Promise((r) => setTimeout(r, step)); if (!paused) left -= step; } };
  const later = (fn, ms) => { wait(ms).then(() => { if (alive()) fn(); }); };

  const mk = (tag, cls, props = {}) => Object.assign(document.createElement(tag), cls ? { className: cls } : {}, props);
  const bars = el("div", { class: "ob-bars", "aria-hidden": "true" });
  const skip = el("button", { type: "button", class: "ob-skip", text: "건너뛰기" });
  const PAUSE_D = "M8.5 6v12M15.5 6v12", PLAY_D = "M8.5 5.8v12.4L18.2 12z";
  const pauseIcon = svgEl("path", { d: PAUSE_D });
  const pauseBtn = el("button", { type: "button", class: "ob-pause", "aria-label": "이야기 일시정지", "aria-pressed": "false" }, svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, pauseIcon));
  const copy = el("div", { class: "ob-copy", "aria-live": "polite" });
  const stage = el("div", { class: "ob-stage", "aria-hidden": "true" });
  const hint = el("p", { class: "ob-hint", "aria-hidden": "true", text: "화면을 누르면 다음으로 넘어가요" });
  const cta = el("button", { type: "button", class: "ob-cta", text: "다음" });
  const title = el("h1", { class: "sr", tabindex: "-1", text: "시작하며 보는 이야기" });
  root.append(title, bars, pauseBtn, skip, copy, stage, hint, cta);
  if (RM) { hint.hidden = true; pauseBtn.hidden = true; } // 움직임 줄이기에는 멈출 움직임·자동 진행이 없다

  // 무대는 설계 좌표(390×594) 그대로 두고 통째로 키운다 — 문장 아래 남는 높이와 화면 폭 중 좁은 쪽에 맞춘다.
  let K = 1;
  const copyMin = () => parseFloat(getComputedStyle(document.documentElement).fontSize) * 8.25; // .ob-copy 기본 높이(8.25rem)
  const fit = () => {
    const cur = copy.lastElementChild; // 문장 상자는 지금 문장의 높이를 따라간다 — 글자를 키워도 무대 위로 넘치지 않게
    copy.style.height = `${Math.max(cur ? cur.offsetHeight : 0, copyMin())}px`;
    const H = root.clientHeight, W = root.clientWidth, top = copy.offsetTop + copy.offsetHeight + 8;
    const want = Math.min(1.14, W / SW, (H - top) / SH);
    K = Math.max(.7, want);
    root.classList.toggle("tight", want < .7); // 글자를 크게 키운 낮은 화면 — 무대가 더 줄 수 없어 문장 뒤를 받친다(welcome.css)
    stage.style.setProperty("--ob-k", K.toFixed(4));
  };
  const ro = new ResizeObserver(() => { if (alive()) fit(); else ro.disconnect(); });
  ro.observe(root);
  // 무대 안 좌표(축척을 되돌린 값)
  const rel = (node) => { const r = node.getBoundingClientRect(), s = stage.getBoundingClientRect(); return { x: (r.left - s.left) / K, y: (r.top - s.top) / K, w: r.width / K, h: r.height / K }; };

  /* ── 문장 ── */
  const barFill = COPY.map(() => { const i = mk("i"), b = mk("b"); i.append(b); bars.append(i); return b; });
  function setCopy(i) {
    // 나가는 문장은 하나만 남긴다 — 건너뛰기처럼 한 번에 여러 장면을 넘기면 그 사이 문장은 바로 치운다(겹쳐 보이지 않게)
    const olds = [...copy.children], old = olds.pop();
    olds.forEach((o) => o.remove());
    const set = mk("div", "set"); set.innerHTML = `<h2>${COPY[i][0]}</h2><p>${COPY[i][1]}</p>`; copy.append(set); // 고정 문구(사용자 입력 아님)
    ro.observe(set); fit(); // 글자 크기가 바뀌어도 다시 잰다
    if (old) play(old, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-8px)" }], { duration: 300, easing: IN }).finished.then(() => old.remove(), () => old.remove());
    const d0 = old ? 220 : 60;
    play(set.children[0], [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], { duration: 700, delay: d0, easing: OUT });
    play(set.children[1], [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 700, delay: d0 + 110, easing: OUT });
    barFill.forEach((b, k) => { b.getAnimations().forEach((a) => a.cancel()); b.style.transform = k < i ? "scaleX(1)" : "scaleX(0)"; });
    if (DUR[i] && !RM) barFill[i].animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: DUR[i] * SLOW, easing: "linear", fill: "forwards" });
    else barFill[i].style.transform = "scaleX(1)";
  }

  /* ── 무대 요소 ── */
  const halo = mk("div", "ob-halo"), stone = mk("img", "ob-stone", { src: STONE_SRC, alt: "" });
  const STONE = { x: 195, y: 214, w: 112, h: 80 };
  stone.style.translate = `${STONE.x - STONE.w / 2}px ${STONE.y - STONE.h / 2}px`;
  halo.style.translate = `${STONE.x - 115}px ${STONE.y - 115}px`;

  // ①②③ 답 조각
  const WORDS = [["요약", "세 줄로 정리하면"], ["추천", "가장 많이 고른 답"], ["정답", "이렇게 하면 돼요"], ["비교", "A보다 B가 나아요"], ["결론", "지금 바로 하세요"], ["요약", "핵심만 말하면"], ["추천", "요즘 뜨는 선택"], ["정답", "딱 하나만 고르면"], ["순위", "1위는 이거예요"], ["결론", "고민할 필요 없어요"], ["비교", "장단점 한눈에"], ["추천", "당신에게 맞는 답"], ["요약", "한 문장으로"], ["정답", "이게 맞아요"]];
  const answers = mk("div", "ob-answers fade");
  const ROWS = 7, PER = 4, chips = [];
  for (let r = 0; r < ROWS; r++) for (let k = 0; k < PER; k++) {
    const [b, t] = WORDS[(r * 5 + k * 3) % WORDS.length];
    const c = el("span", { class: "ob-chip" }, el("b", { text: b }), t); answers.append(c); chips.push({ el: c, r, k });
  }

  // ④ 언덕(설계 viewBox의 y 70부터 보인다). 양옆은 넓은 화면에서도 끊기지 않게 멀리까지 칠한다.
  const land = svgEl("svg", { class: "ob-land", viewBox: "0 70 390 540", preserveAspectRatio: "xMidYMax slice" },
    svgEl("g", { id: "obSun" }, svgEl("circle", { class: "sun", cx: "322", cy: "88", r: "30" }), svgEl("circle", { class: "sun-ring", cx: "322", cy: "88", r: "44" })),
    svgEl("g", { class: "hill", id: "obFar" }, svgEl("path", { class: "h-far", d: "M-400 196C60 158 170 150 250 172C320 192 360 184 790 172V620H-400Z" })),
    svgEl("g", { class: "hill", id: "obMid" }, svgEl("path", { class: "h-mid", d: "M-400 266C90 222 240 228 790 276V620H-400Z" })),
    svgEl("g", { class: "hill", id: "obNear" }, svgEl("path", { class: "h-near", d: "M-400 360C110 322 260 334 790 376V620H-400Z" })),
    svgEl("g", {}, svgEl("path", { class: "road", id: "obRoad" })), svgEl("g", { id: "obPaths" }));
  const LAND_TOP = SH - 540 - 70; // 언덕 설계 좌표 y → 무대 y
  const MAIN = "M224 700C214 600 184 474 191 384C194 334 198 304 198 280"; // 가운데 길(끝 = 나의 돌). 시작은 화면 아래 바깥이라 밑단이 보이지 않는다
  const BR = ["M194 480C186 436 158 404 128 374C106 352 92 326 86 298", "M202 480C212 436 240 404 268 374C290 352 302 326 304 298"]; // ⑥ 가운데 길 안에서 시작해 갈라진다
  const ROAD_END = { x: 198, y: LAND_TOP + 270 };
  const ME_W = 62, ME_H = ME_W * 29 / 40; // 길 끝에 선 나의 돌 크기(친구 74px 사이에서도 '나'가 한눈에 보이게)

  // 친구: 자유롭게 흩어 선다 — 줄·칸을 맞추지 않고, 각자 조금씩 기울고, 등장도 제각각(먼 언덕은 너머에서 불쑥, 가까운 곳은 걸어서)
  // [slug, key, 발 가운데 x, 발 y(언덕 좌표), 등장('walkL'|'walkR'|'rise'), 걸음 수, 한 걸음 ms, 선 뒤 기울기]
  const FR = [
    ["bara", "wish", 140, 190, "rise", 3, 380, -5], ["taon", "anger", 296, 228, "walkR", 6, 340, 6],
    ["nuri", "enjoyment", 52, 240, "walkL", 7, 370, -3], ["narae", "joy", 96, 334, "walkL", 7, 350, 5],
    ["arin", "hate", 348, 310, "walkR", 6, 400, -6], ["pumi", "love", 266, 394, "walkR", 8, 420, 3],
    ["seori", "sadness", 40, 462, "walkL", 7, 440, 4], ["sumi", "fear", 118, 542, "walkL", 8, 460, -4], ["gareum", "disgust", 328, 500, "walkR", 7, 380, -5]
  ];
  const FW = 74; // 모두 같은 크기 — 크기로 우열을 만들지 않는다
  const walkers = FR.map(([slug, key, x, feet, mode, steps, ms, tilt]) => {
    const w = mk("div", "ob-walker"); w.style.width = `${FW}px`;
    const img = mk("img", "", { src: F(slug, key), alt: "" }); w.append(img);
    return { w, img, key, x, y: LAND_TOP + feet, mode, steps, ms, tilt };
  });

  // ⑤ 노트 — 누구나 겪는 섞인 하루(즐거움의 홀가분함 + 슬픔의 허전함)
  const typed = mk("span"), caret = mk("i", "caret");
  const nm = [["enjoyment", "홀가분한"], ["sadness", "허전한"]].map(([key, label]) => el("span", { class: "name", style: { "--c": `var(--${key}-700)`, "--bgc": `var(--${key}-100)` } }, mk("img", "", { src: P(key), alt: "" }), label));
  const note = el("div", { class: "ob-note" }, mk("i", "tape"), el("p", { class: "ln" }, typed, caret), el("span", { class: "names" }, nm));

  const landLayer = mk("div", "ob-layer"), figLayer = mk("div", "ob-layer");
  landLayer.append(land); figLayer.append(...walkers.map((f) => f.w));
  stage.append(landLayer, answers, figLayer, halo, stone, note);
  [landLayer, note, halo, stone].forEach((e) => (e.style.opacity = "0"));
  walkers.forEach((f) => (f.w.style.opacity = "0"));

  /* ── 걷기 ── 한 걸음 안에서 속도가 바뀐다(딛을 때 느리고 뗄 때 빠르다). 몸은 걸음마다 떴다 내려오며 좌우로 번갈아 기울고, 발이 닿는 순간 살짝 눌린다.
     첫 걸음은 짧게 떼고 마지막 두 걸음은 보폭이 줄며 선다. */
  const imgH = (img) => FW * ((img.naturalHeight || 104) / (img.naturalWidth || 100));
  const stride = (n) => { const s = Array.from({ length: n }, (_, k) => k === 0 ? .8 : k === n - 1 ? .42 : k === n - 2 ? .72 : 1); const t = s.reduce((a, b) => a + b, 0); return s.map((v) => v / t); };
  function walkTo(f, { fromX, toX, fromY = f.y, toY = f.y, delay = 0, face = 1, s0 = 1, s1 = 1, tilt = 0 }) {
    const { w, img, steps, ms } = f, H = imgH(img);
    const pos = (x, y, s) => `${(x - FW * s / 2).toFixed(1)}px ${(y - H * s).toFixed(1)}px`;
    const E = "cubic-bezier(.42,.02,.38,1)";
    const kf = [{ translate: pos(fromX, fromY, s0), scale: String(s0), offset: 0, easing: E }];
    let acc = 0;
    stride(steps).forEach((p, k) => { acc += p; const s = s0 + (s1 - s0) * acc; kf.push({ translate: pos(fromX + (toX - fromX) * acc, fromY + (toY - fromY) * acc, s), scale: String(s), offset: (k + 1) / steps, easing: E }); });
    w.style.transformOrigin = "0 0"; w.style.opacity = "1";
    const total = steps * ms;
    play(w, kf, { duration: total, delay });
    play(w, [{ opacity: 0 }, { opacity: 1 }], { duration: 280, delay });
    // 전체 = 걸음 시간 + 선 뒤 260ms(눌렸다 펴지며 앞을 본다). offset은 전체 길이 기준으로 늘 커지게 잡는다.
    const T = total + 260, at = (t) => t / T, bob = [];
    for (let k = 0; k < steps; k++) {
      const side = k % 2 ? -1 : 1, lift = k === steps - 1 ? 2 : k === 0 ? 4 : 6.5;
      bob.push({ transform: `scaleX(${face}) translateY(0) rotate(0deg) scale(1.035,.955)`, offset: at(k * ms) });
      bob.push({ transform: `scaleX(${face}) translateY(${-lift}px) rotate(${side * 3.4}deg) scale(.985,1.025)`, offset: at((k + .42) * ms) });
      bob.push({ transform: `scaleX(${face}) translateY(${-lift * .3}px) rotate(${side * 1.4}deg) scale(1)`, offset: at((k + .78) * ms) });
    }
    bob.push({ transform: `scaleX(${face}) translateY(0) rotate(${tilt * .5}deg) scale(1.05,.94)`, offset: at(total + 90) });
    bob.push({ transform: `scaleX(1) translateY(0) rotate(${tilt}deg) scale(1)`, offset: 1 });
    play(img, bob, { duration: T, delay, easing: "linear" });
    return total + delay + 260;
  }
  function riseAt(f, { delay = 0, tilt = 0 }) { // 먼 언덕 너머에서 불쑥 올라와 두어 번 제자리에서 통통
    const { w, img } = f, H = imgH(img);
    w.style.translate = `${f.x - FW / 2}px ${f.y - H}px`; w.style.opacity = "1";
    play(w, [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0 0)" }], { duration: 520, delay, easing: OUT });
    play(img, [
      { transform: "translateY(30px) rotate(0deg) scale(.96,1.04)" },
      { transform: "translateY(-9px) rotate(-3deg) scale(.98,1.03)", offset: .45 },
      { transform: "translateY(0) rotate(0deg) scale(1.05,.94)", offset: .62 },
      { transform: "translateY(-4px) rotate(3deg) scale(1)", offset: .8 },
      { transform: `translateY(0) rotate(${tilt}deg) scale(1)` }
    ], { duration: 1100, delay, easing: SOFT });
    return delay + 1100;
  }
  function breathe(f, i) { // 선 뒤의 느린 호흡(2~3% 안쪽, DESIGN_SYSTEM 평면 친구 규칙)
    if (RM) return;
    const a = f.img.animate([{ transform: "scale(1)" }, { transform: "scale(1.018,1.035)" }], { duration: 2500 + (i % 4) * 280, delay: -i * 530, iterations: Infinity, direction: "alternate", easing: "ease-in-out", composite: "add" });
    if (paused) a.pause();
  }

  /* ── 장면 ── */
  let scene = -1, timer = 0, flows = [];
  const stopFlows = () => { flows.forEach((a) => a.cancel()); flows = []; };
  const S = [
    // ① 답이 여러 줄로 흘러간다 — 줄마다 속도·방향이 다르고, 아래로 갈수록 흐려진다. 바탕은 옅은 민트
    function s1() {
      root.classList.add("mint");
      const SPEED = [30, 46, 26, 54, 36, 42, 28];
      for (let r = 0; r < ROWS; r++) {
        const row = chips.filter((c) => c.r === r), y = 12 + r * 70, dir = r % 2 ? 1 : -1;
        // 줄마다 칩을 이어 붙이고(간격 10px), 줄 전체 길이만큼 한 벌을 더 붙여 끊김 없이 흐르게 한다
        let x = -24 - (r % 3) * 46; row.forEach((c) => { c.x0 = x; x += c.el.getBoundingClientRect().width / K + 10; });
        const lap = x + 24 + (r % 3) * 46, dur = (lap / SPEED[r]) * 1000;
        row.forEach((c) => {
          const d = c.el.cloneNode(true); d.dataset.clone = "1"; answers.append(d);
          [[c.el, c.x0], [d, c.x0 - dir * lap]].forEach(([node, x0]) => {
            node.style.translate = `${x0}px ${y}px`;
            if (!RM) flows.push(node.animate([{ translate: `${x0}px ${y}px` }, { translate: `${x0 + dir * lap}px ${y}px` }], { duration: dur * SLOW, iterations: Infinity, easing: "linear" }));
            play(node, [{ opacity: 0 }, { opacity: 1 }], { duration: 800, delay: 150 + r * 90, easing: OUT });
          });
        });
      }
    },
    // ② 흐름이 멈추고, 돌에서 흰빛이 번져 바탕이 밝아진다. 답 여덟이 가운데 빈자리를 둘러싸 떠 있고, 그 가운데에 돌 하나(고르는 사람 = 나)가 내려앉는다
    async function s2() {
      const now = chips.map((c) => rel(c.el));
      const clones = [...answers.querySelectorAll("[data-clone]")];
      stopFlows(); answers.classList.remove("fade");
      if (root.classList.contains("mint")) {
        const st = stage.getBoundingClientRect(), ph = root.getBoundingClientRect(), fx = st.left - ph.left + STONE.x * K, fy = st.top - ph.top + STONE.y * K;
        const flash = mk("div", "ob-flash"); root.prepend(flash);
        const done = () => { root.classList.remove("mint", "lifting"); flash.remove(); };
        play(flash, [{ clipPath: `circle(0px at ${fx}px ${fy}px)` }, { clipPath: `circle(1400px at ${fx}px ${fy}px)` }], { duration: 1200, delay: 500, easing: "cubic-bezier(.5,0,.3,1)" }).finished.then(done, done);
        later(() => root.classList.add("lifting"), 700);
      }
      clones.forEach((d) => d.remove());
      chips.forEach((c, i) => {
        const p = now[i]; c.el.style.translate = `${p.x}px ${p.y}px`;
        if (i % 7 === 3 || i >= 26 || p.x < -p.w || p.x > SW) { play(c.el, [{ opacity: 1 }, { opacity: 0 }], { duration: 450, easing: IN }); c.out = true; }
      });
      const SLOTS = [[112, 26], [282, 40], [74, 110], [318, 118], [96, 300], [300, 290], [104, 368], [290, 392]]; // 돌(가운데 195·214, 폭 112) 둘레를 비워 둔다
      const keep = chips.filter((c) => !c.out).slice(0, SLOTS.length);
      chips.filter((c) => !c.out && !keep.includes(c)).forEach((c) => { play(c.el, [{ opacity: 1 }, { opacity: 0 }], { duration: 450, easing: IN }); c.out = true; });
      keep.forEach((c, i) => {
        const p = rel(c.el), [sx, sy] = SLOTS[i];
        const tx = Math.max(10, Math.min(SW - p.w - 10, sx - p.w / 2)), ty = sy - p.h / 2;
        play(c.el, [{ translate: `${p.x}px ${p.y}px`, opacity: 1 }, { translate: `${tx}px ${ty}px`, opacity: .95 }], { duration: 1350, delay: i * 50, easing: INOUT });
        if (!RM) flows.push(c.el.animate([{ transform: "translateY(0)" }, { transform: `translateY(${i % 2 ? 4 : -4}px)` }], { duration: (2300 + (i % 4) * 300) * SLOW, delay: (1350 + i * 50) * SLOW, iterations: Infinity, direction: "alternate", easing: "ease-in-out" }));
      });
      await wait(750);
      if (scene !== 1 || !alive()) return;
      stone.style.opacity = "1";
      play(stone, [
        { transform: "translateY(-46px) scale(.82)", opacity: 0 },
        { transform: "translateY(0) scale(1.06,.92)", opacity: 1, offset: .58 },
        { transform: "translateY(-7px) scale(.985,1.02)", offset: .78 },
        { transform: "none", opacity: 1 }
      ], { duration: 1150, easing: "cubic-bezier(.3,.6,.3,1)" });
    },
    // ③ 답들이 돌로 스며들고, 돌에 옅은 빛이 한 번 번진다 — 기준은 밖의 답이 아니라 나를 아는 데서 생긴다
    async function s3() {
      stopFlows();
      stone.style.opacity = "1";
      chips.filter((c) => !c.out).forEach((c, i) => {
        const p = rel(c.el), tx = STONE.x - p.w / 2, ty = STONE.y - 18;
        play(c.el, [{ translate: `${p.x}px ${p.y}px`, scale: "1", opacity: .95 }, { translate: `${tx}px ${ty}px`, scale: ".15", opacity: 0 }], { duration: 950, delay: 120 + ((i * 5) % 12) * 60, easing: "cubic-bezier(.6,0,.8,.4)" });
      });
      await wait(1000);
      if (scene !== 2 || !alive()) return;
      halo.style.opacity = "1";
      play(halo, [{ transform: "scale(.4)", opacity: 0 }, { transform: "scale(1)", opacity: .95, offset: .45 }, { transform: "scale(1.3)", opacity: 0 }], { duration: 2200, easing: SOFT });
      play(stone, [{ transform: "none" }, { transform: "scale(1.07)", offset: .35 }, { transform: "none" }], { duration: 1300, easing: SOFT });
    },
    // ④ 돌이 작아지며 길 끝에 자리 잡고(돌의 가운데가 길 끝 — 뾰족한 끝이 돌 밑에 숨는다), 언덕이 차례로 솟고, 길이 아래에서부터 차오르고, 친구들이 제각각 나타난다
    function s4() {
      stopFlows(); answers.style.opacity = "0"; stone.style.opacity = "1";
      play(stone, [{ translate: stone.style.translate, width: `${STONE.w}px` }, { translate: `${ROAD_END.x - ME_W / 2}px ${ROAD_END.y - ME_H / 2 + ME_H * .1}px`, width: `${ME_W}px` }], { duration: 1300, delay: 200, easing: INOUT });
      landLayer.style.opacity = "1";
      ["obFar", "obMid", "obNear"].forEach((id, k) => play(land.getElementById(id), [{ transform: "translateY(320px)" }, { transform: "none" }], { duration: 1150, delay: 150 + k * 140, easing: OUT }));
      play(land.getElementById("obRoad"), [{ clipPath: "inset(100% 0 0 0) fill-box" }, { clipPath: "inset(0 0 0 0) fill-box" }], { duration: 1300, delay: 650, easing: INOUT });
      play(land.getElementById("obSun"), [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 1300, delay: 900, easing: OUT });
      const starts = [1100, 1250, 1500, 1720, 1900, 2150, 2350, 2600, 2800];
      walkers.forEach((f, i) => {
        const delay = starts[i];
        let end;
        if (f.mode === "rise") end = riseAt(f, { delay, tilt: f.tilt });
        else { const side = f.mode === "walkL" ? -1 : 1, dist = 130 + (i % 3) * 34; end = walkTo(f, { fromX: f.x + side * dist, toX: f.x, fromY: f.y + (i % 2 ? 6 : -4), delay, face: side < 0 ? 1 : -1, tilt: f.tilt }); }
        later(() => breathe(f, i), end + 300);
      });
    },
    // ⑤ 언덕은 뒤로 물러나 옅어지고 노트가 올라온다. 섞인 하루가 두 줄로 써지고, 즐거움·슬픔 친구에게서 조약돌이 차례로 날아와 두 이름 칸에 앉는다
    // (설명하기 어려운 까닭이 감정이 하나가 아니어서임을 보여 준다. 좋고 나쁨이 아니라 둘 다 그날의 나다)
    async function s5() {
      const from = ["enjoyment", "sadness"].map((k) => { const q = rel(walkers.find((f) => f.key === k).w); return { x: q.x + q.w / 2 - 11, y: q.y + q.h * .45 }; });
      play(landLayer, [{ opacity: 1, transform: "none", filter: "saturate(1)" }, { opacity: .38, transform: "translateY(36px) scale(.97)", filter: "saturate(.55)" }], { duration: 1000, easing: INOUT });
      play(figLayer, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(36px) scale(.97)" }], { duration: 700, easing: IN });
      play(stone, [{ opacity: 1 }, { opacity: .38 }], { duration: 1000, easing: INOUT });
      note.style.opacity = "1";
      const text = "다 끝내서 홀가분했는데,\n이상하게 조금 허전했다";
      if (RM) { typed.textContent = text; caret.style.visibility = "hidden"; nm.forEach((c) => { c.style.opacity = "1"; c.classList.add("on"); }); return; }
      await play(note, [{ transform: "translateY(300px) rotate(4deg)", opacity: 0 }, { transform: "translateY(-8px) rotate(-.8deg)", opacity: 1, offset: .72 }, { transform: "none", opacity: 1 }], { duration: 1000, delay: 300, easing: OUT }).finished.catch(() => {});
      for (let k = 1; k <= text.length; k++) {
        if (scene !== 4 || !alive()) return;
        typed.textContent = text.slice(0, k);
        await wait(text[k - 1] === "\n" ? 380 : text[k - 1] === " " || text[k - 1] === "," ? 170 : 50 + ((k * 37) % 38));
      }
      caret.style.visibility = "hidden";
      nm.forEach((c) => { c.style.opacity = "1"; play(c, [{ opacity: 0 }, { opacity: 1 }], { duration: 280 }); });
      await wait(260);
      for (let n = 0; n < 2; n++) {
        if (scene !== 4 || !alive()) return;
        const c = nm[n], to = rel(c.querySelector("img")), sp = from[n];
        const fly = mk("img", "ob-peb", { src: P(n ? "sadness" : "enjoyment"), alt: "" }); fly.style.width = "22px"; fly.style.zIndex = "5"; stage.append(fly);
        await play(fly, [{ translate: `${sp.x}px ${sp.y}px`, rotate: "-12deg", opacity: 0 }, { opacity: 1, offset: .12 }, { translate: `${(sp.x + to.x) / 2 + (n ? 30 : -30)}px ${Math.min(sp.y, to.y) - 100}px`, rotate: "130deg", offset: .5 }, { translate: `${to.x}px ${to.y}px`, rotate: "360deg", opacity: 1 }], { duration: 850, easing: "cubic-bezier(.45,0,.3,1)" }).finished.catch(() => {});
        fly.remove(); c.classList.add("on");
        play(c, [{ transform: "scale(.72)" }, { transform: "scale(1.06)", offset: .55 }, { transform: "none" }], { duration: 480, easing: "cubic-bezier(.3,1.35,.5,1)" });
      }
    },
    // ⑥ 노트가 접히듯 물러나고, 카메라가 다가가며 언덕이 다시 밝아진다. 길이 세 갈래로 열리고(가운데 길 끝은 나의 돌), 친구 셋이 각자 다른 길을 고른다
    async function s6() {
      stage.querySelectorAll(":scope > .ob-peb").forEach((e) => e.remove());
      nm.forEach((c) => { c.style.opacity = "1"; c.classList.add("on"); }); typed.textContent = "다 끝내서 홀가분했는데,\n이상하게 조금 허전했다"; caret.style.visibility = "hidden"; // 건너뛰어 왔을 때도 노트가 채워진 채 물러난다
      play(note, [{ transform: "none", opacity: 1 }, { transform: "translate(-60px,-140px) scale(.3) rotate(-8deg)", opacity: 0 }], { duration: 800, easing: IN });
      play(land.getElementById("obSun"), [{ opacity: 1 }, { opacity: 0 }], { duration: 700, easing: IN }); // 다가가면 해는 화면 밖으로 — 잘린 해를 남기지 않는다
      const Z = 1.3; // 카메라가 다가간다(무대 아래 가운데 기준) — 하늘이 줄고 길·친구·조약돌이 커진다
      play(landLayer, [{ opacity: .38, transform: "translateY(36px) scale(.97)", filter: "saturate(.55)" }, { opacity: 1, transform: `scale(${Z})`, filter: "saturate(1)" }], { duration: 1500, delay: 250, easing: INOUT });
      const cx = 195 + (ROAD_END.x - 195) * Z, cy = SH - (SH - ROAD_END.y) * Z, sw2 = ME_W * Z, sh2 = ME_H * Z;
      play(stone, [{ opacity: .38, translate: `${ROAD_END.x - ME_W / 2}px ${ROAD_END.y - ME_H / 2 + ME_H * .1}px`, width: `${ME_W}px` }, { opacity: 1, translate: `${cx - sw2 / 2}px ${cy - sh2 / 2 + sh2 * .1}px`, width: `${sw2}px` }], { duration: 1500, delay: 250, easing: INOUT });
      const g = land.getElementById("obPaths");
      g.replaceChildren(...BR.map((d) => svgEl("path", { class: "road", d: taper(land, d, 56, 6) })));
      [...g.children].forEach((p, k) => play(p, [{ clipPath: "inset(100% 0 0 0) fill-box" }, { clipPath: "inset(0 0 0 0) fill-box" }], { duration: 1300, delay: 600 + k * 160, easing: INOUT })); // 아래에서부터 채워지며 갈라진다
      const D = [BR[0], MAIN, BR[1]];
      figLayer.getAnimations().forEach((a) => a.cancel()); figLayer.style.opacity = "1"; figLayer.style.transform = `scale(${Z})`;
      walkers.forEach((f) => [f.w, f.img].forEach((e) => { e.getAnimations().forEach((a) => a.cancel()); e.style.opacity = "0"; })); // ④의 끝 모습을 붙잡고 있던 애니메이션까지 거둔다
      const trio = [["bara", "wish", 0, 7, 420], ["nuri", "enjoyment", 1, 10, 400], ["pumi", "love", 2, 7, 390]].map(([slug, key, lane, steps, ms]) => {
        const w = mk("div", "ob-walker"); w.style.width = `${FW}px`; w.style.opacity = "0"; const img = mk("img", "", { src: F(slug, key), alt: "" }); w.append(img); figLayer.append(w);
        return { w, img, lane, steps, ms };
      });
      [["wish", BR[0]], ["love", BR[1]]].forEach(([key, d], k) => { // 갈래 끝에 그 친구의 조약돌이 조용히 놓인다(조약돌 가운데 = 갈래 끝 — 끝이 조약돌 밑에 숨는다)
        const e = endOf(land, d);
        const pb = mk("img", "ob-peb", { src: P(key), alt: "" }); pb.style.width = "32px"; pb.style.translate = `${e.x - 16}px ${LAND_TOP + e.y - 13}px`; pb.style.rotate = k ? "10deg" : "-8deg"; figLayer.append(pb);
        play(pb, [{ opacity: 0, transform: "translateY(6px) scale(.8)" }, { opacity: 1, transform: "none" }], { duration: 900, delay: 1500 + k * 160, easing: OUT });
      });
      const probe = document.createElementNS(NS, "path");
      trio.forEach((t, n) => {
        probe.setAttribute("d", D[t.lane]); land.append(probe);
        const L = probe.getTotalLength(), a = probe.getPointAtLength(L * (t.lane === 1 ? .46 : .3)), b = probe.getPointAtLength(L * (t.lane === 1 ? .8 : .6)); probe.remove();
        walkTo({ ...t, y: LAND_TOP + a.y }, { fromX: a.x, fromY: LAND_TOP + a.y, toX: b.x, toY: LAND_TOP + b.y, delay: [1650, 1150, 1900][n], face: t.lane === 0 ? -1 : 1, s0: 1, s1: .74 });
      });
      await wait(3000);
      if (scene !== 5 || !alive()) return;
      play(hint, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
      showCta();
    }
  ];

  function showCta() {
    if (cta.classList.contains("show")) return;
    cta.classList.add("show");
    play(cta, [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], { duration: 600, easing: OUT });
  }
  // 자동 진행: 멈추면 남은 시간을 기억했다가 다시 이으면 그만큼만 기다린다
  let armedAt = 0, advLeft = 0;
  const arm = (ms) => { clearTimeout(timer); advLeft = ms; if (paused || !ms) return; armedAt = performance.now(); timer = setTimeout(() => go(scene + 1), ms); };
  const allAnims = () => root.getAnimations({ subtree: true });
  function setPaused(on) {
    if (on === paused || RM) return;
    paused = on;
    if (on) { clearTimeout(timer); advLeft = Math.max(0, advLeft - (performance.now() - armedAt)); allAnims().forEach((a) => a.pause()); }
    else { allAnims().forEach((a) => { if (a.playState === "paused") a.play(); }); if (DUR[scene] && advLeft > 0) arm(advLeft); }
    root.classList.toggle("paused", on);
    pauseBtn.setAttribute("aria-pressed", String(on)); pauseBtn.setAttribute("aria-label", on ? "이야기 다시 재생" : "이야기 일시정지");
    pauseIcon.setAttribute("d", on ? PLAY_D : PAUSE_D);
  }
  function go(i) {
    if (i === scene || i > 5 || !alive()) return;
    clearTimeout(timer);
    live.forEach((a) => { if (a.effect?.getComputedTiming().iterations !== Infinity) { try { a.finish(); } catch { /* 이미 끝난 애니메이션 */ } } });
    scene = i; setCopy(i); S[i]();
    root.classList.toggle("veil", i >= 3); // 언덕이 있는 장면만 문장 뒤를 흰 바탕으로 받친다(welcome.css)
    if (i === 3) play(hint, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
    if (RM) { cta.classList.add("show"); cta.textContent = "다음"; } // 움직임 줄이기: 자동 진행 없이 장면마다 '다음'
    if (!RM && DUR[i]) arm(DUR[i] * SLOW); else advLeft = 0;
    if (paused) allAnims().forEach((a) => a.pause()); // 멈춘 채로 넘겼으면(누름·건너뛰기) 새 장면도 멈춘 채로 선다
  }
  const next = () => { if (scene < 5) go(scene + 1); else openNotice(); };
  root.addEventListener("click", (e) => { if (e.target.closest("button,a") || scene < 0) return; if (scene < 5) go(scene + 1); }); // 시작 전(로딩 화면이 걷히기 전)에는 넘기지 않는다
  skip.addEventListener("click", () => { if (scene < 0) return; for (let k = scene + 1; k <= 5; k++) go(k); });
  cta.addEventListener("click", (e) => { e.stopPropagation(); next(); });
  pauseBtn.addEventListener("click", (e) => { e.stopPropagation(); if (scene >= 0) setPaused(!paused); });

  /* ── 시작하기 전에 ── */
  const n = buildNotice(navigate, { solo: false, onBack: closeNotice });
  const behind = [title, bars, pauseBtn, skip, copy, stage, hint, cta];
  root.append(n.notice);
  function openNotice() {
    setPaused(false); clearTimeout(timer);
    n.notice.classList.add("open");
    behind.forEach((e) => { e.inert = true; }); // 가려진 이야기 버튼에 초점이 가지 않게(WCAG 2.4.11)
    play(n.notice, [{ transform: "translateX(100%)" }, { transform: "none" }], { duration: 520, easing: "cubic-bezier(.3,.8,.2,1)" });
    const parts = [n.notice.querySelector(".eyebrow"), n.notice.querySelector("h1"), ...n.notice.querySelectorAll("li"), n.ground, n.start];
    parts.forEach((node, k) => play(node, [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 640, delay: 260 + k * 80, easing: OUT }));
    play(n.ground.querySelector(".road"), [{ clipPath: "inset(100% 0 0 0) fill-box" }, { clipPath: "inset(0 0 0 0) fill-box" }], { duration: 1100, delay: 700, easing: INOUT });
    later(() => n.notice.querySelector("h1").focus({ preventScroll: true }), 560);
  }
  function closeNotice() {
    play(n.notice, [{ transform: "none" }, { transform: "translateX(100%)" }], { duration: 420, easing: IN }).finished.then(() => { n.notice.classList.remove("open"); behind.forEach((e) => { e.inert = false; }); cta.focus({ preventScroll: true }); }, () => {});
  }

  main.replaceChildren(root);
  fit(); n.road();
  land.querySelector("#obRoad").setAttribute("d", taper(land, MAIN, 250, 10));

  // 로딩 화면이 걷힌 뒤 시작한다(D-092 ④ — 처음 여는 사람은 로딩의 돌에서 흰빛이 퍼지며 이 이야기가 열린다). 그림을 먼저 풀어 두되 오래 기다리지 않는다.
  const from = Math.min(6, Math.max(1, Number(params.get("scene")) || 1)) - 1;
  const imgs = [...root.querySelectorAll("img")];
  Promise.all([splashDone, Promise.race([Promise.all(imgs.map((im) => im.decode().catch(() => {}))), new Promise((r) => setTimeout(r, 1500))])]).then(() => {
    if (!alive()) return;
    for (let k = 0; k <= from; k++) go(k);
  });
}
