// 오늘 화면의 어두운 숲(D-062·D-067·D-072·D-084). 숲 속 안이다: 촘촘한 나무 층 사이로 회색 길이 지나가고, 나무 뿌리 옆에 작은 식물(풀·양치·새싹·버섯·덤불)이 자란다.
// 감정 조약돌은 계열마다 하나씩 아홉이고, 나무 옆 식물 사이에 원근(먼 곳 작게·가까운 곳 크게)에 맞는 크기로 놓여 숲에 묻혀 있다. 가운데 돌 하나가 시작이다.
// 숲(SVG)·조약돌·돌은 같은 상자 안에 있어 화면 크기에 맞춰 함께 커지고 잘린다(하늘은 잘려도 되고 바닥은 붙어 있다). 색은 전부 CSS 변수(--forest-*)다 — 값은 tokens.json이 정본이다.
// 조약돌 크기는 깊이일 뿐 감정의 무게가 아니다(D-050·D-067). 같은 씨앗이면 언제나 같은 숲이다.
// 앞뒤(D-084): 숲을 먼·가운데·가까운 세 겹의 SVG로 나누고 조약돌을 자기 깊이의 겹 사이에 끼운다 — 앞에 선 나무가 뒤 돌을 가리고, 돌이 앞 나무 잎 위에 떠 보이지 않는다.
// 하늘은 짙은 남색 한 색이다(빛줄기·안개·지평선 번짐 없음, 사용자 요청 2026-09-24).
import { el, reducedMotion } from "../dom.js";
import { pebbleImg, stoneImg, data } from "../data.js";

const W = 360, H = 744;

function rng(seed) { // 같은 씨앗이면 언제나 같은 숲이다(무작위로 매번 바뀌지 않는다)
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const f = (n) => n.toFixed(1);

// 층이 보이는 소나무: 삼각형을 겹쳐 톱니 가장자리를 만든다. trunk는 맨 아래 가지 밑 줄기의 높이 비율이다 —
// 화면 가장자리의 큰 소나무는 가지를 올려(D-084) 발치의 땅·풀·조약돌이 잎에 덮이지 않고 보이게 한다.
function pine(cx, by, h, w, tiers, trunk = 0.09) {
  const tw = w * 0.12, th = h * trunk, top = by - h, step = (h - th) / (tiers * 0.92 + 0.63);
  let d = `M${f(cx - tw / 2)} ${f(by)}h${f(tw)}v${f(-th)}h${f(-tw)}Z`;
  for (let k = 0; k < tiers; k += 1) {
    const y0 = top + k * step * 0.92, y1 = y0 + step * 1.55, half = (w / 2) * (0.32 + (0.68 * (k + 1)) / tiers);
    d += `M${f(cx)} ${f(y0)}L${f(cx + half)} ${f(y1)}L${f(cx)} ${f(y1 - step * 0.32)}L${f(cx - half)} ${f(y1)}Z`; // 가지 끝이 처지도록 층 밑변 가운데를 올린다 — 곧은 밑변이 가로선으로 읽히지 않게(2026-09-24 사용자 지적)
  }
  return d;
}
function roundTree(cx, by, h, w) {
  const tw = w * 0.15, th = h * 0.34, r = w * 0.36, cy = by - th - h * 0.2;
  const circles = [[0, 0, r], [-w * 0.26, h * 0.1, r * 0.78], [w * 0.26, h * 0.12, r * 0.74], [w * 0.06, -h * 0.2, r * 0.7]];
  return `<rect x="${f(cx - tw / 2)}" y="${f(by - th)}" width="${f(tw)}" height="${f(th + 2)}"/>` + circles.map(([dx, dy, rr]) => `<circle cx="${f(cx + dx)}" cy="${f(cy + dy)}" r="${f(rr)}"/>`).join("");
}
// 길: 아래(y0)에서 위(y1)로 좁아지며 가운데를 지난다. 아래와 그 위 한 굽이에서 가운데를 가로지른다.
// 아래 폭 280: 처음에는 유리 탐색 알약의 곧은 구간 안에 길 끝을 맞춘 값이다. D-076으로 탐색이 없어진 뒤로는 길이 화면 아래 끝까지 그대로 보인다.
// 위 끝 350: 먼 땅의 선(길 끝 자리에서 y≈348)에서 멈춘다. 전에는 330까지 올라가 먼 나무 위에 덧칠돼 하늘로 솟아 보였다(D-084, QA 사용자 캡처의 네모).
const PATH = { y0: 744, y1: 350, cx0: 180, amp: 40, w0: 280, decay: 0.5, turns: 2.3 };
const pathHalf = (y) => { const t = Math.min(1, Math.max(0, (PATH.y0 - y) / (PATH.y0 - PATH.y1))); return (PATH.w0 * (1 - t)) / 2; };
function pathD() {
  const left = [], right = [];
  for (let y = PATH.y0; y >= PATH.y1; y -= 6) {
    const t = (PATH.y0 - y) / (PATH.y0 - PATH.y1), cx = PATH.cx0 + PATH.amp * (1 - PATH.decay * t) * Math.sin(t * Math.PI * PATH.turns), w = PATH.w0 * (1 - t) + 1.5;
    left.push(`${f(cx - w / 2)} ${f(y)}`); right.push(`${f(cx + w / 2)} ${f(y)}`);
  }
  return `M${left.join("L")}L${right.reverse().join("L")}Z`;
}
// 나무 한 층: 나무를 그리고 뿌리 자리(식물·조약돌이 그 옆에 놓인다)를 함께 돌려준다.
function layer(seed, by, n, hr, wr, pineFrac, margin = 26) {
  const R = rng(seed), bases = [];
  let svg = "";
  for (let i = 0; i < n; i += 1) {
    const x = -10 + (382 * (i + 0.15 + R() * 0.7)) / n, b = by + (R() * 14 - 7);
    if (Math.abs(x - 180) < pathHalf(b) + margin) { R(); R(); R(); continue; }
    const h = hr[0] + R() * (hr[1] - hr[0]), w = wr[0] + R() * (wr[1] - wr[0]);
    svg += R() < pineFrac ? `<path d="${pine(x, b, h, w, [3, 4, 4, 5][Math.floor(R() * 4)])}"/>` : roundTree(x, b, h * 0.8, w * 0.8);
    bases.push({ x, by: b, w });
  }
  return { svg, bases };
}

// 작은 식물(납작한 모양): 잎 하나를 기본으로 풀·양치·새싹·버섯·덤불을 만든다.
function leaf(x, y, ang, len, wid) { // (x,y)에서 위쪽을 0°로 ang도 기울어 뻗는 뾰족한 잎
  const a = (ang * Math.PI) / 180, dx = Math.sin(a), dy = -Math.cos(a), nx = -dy, ny = dx;
  const mx = x + dx * len * 0.5, my = y + dy * len * 0.5, tx = x + dx * len, ty = y + dy * len;
  return `M${f(x)} ${f(y)}Q${f(mx + nx * wid)} ${f(my + ny * wid)} ${f(tx)} ${f(ty)}Q${f(mx - nx * wid)} ${f(my - ny * wid)} ${f(x)} ${f(y)}Z`;
}
function grass(x, by, s, R) {
  const n = 4 + Math.floor(R() * 3);
  let d = "";
  for (let i = 0; i < n; i += 1) { const k = i - (n - 1) / 2; d += leaf(x + k * 2.4 * s, by, k * 17 + (R() * 8 - 4), (9 + R() * 8) * s, 1.5 * s); }
  return d;
}
function fern(x, by, s) {
  let d = "";
  for (let i = 0; i < 7; i += 1) { const ang = -72 + i * 24; d += leaf(x, by, ang, (13 + (1 - Math.abs(ang) / 90) * 10) * s, 2.7 * s); }
  return d;
}
const sprout = (x, by, s) => `M${f(x - 0.7 * s)} ${f(by)}h${f(1.4 * s)}v${f(-7 * s)}h${f(-1.4 * s)}Z` + leaf(x, by - 6 * s, -58, 6.5 * s, 2.3 * s) + leaf(x, by - 6 * s, 58, 6.5 * s, 2.3 * s);
const mushroom = (x, by, s) => `M${f(x - 1.3 * s)} ${f(by)}h${f(2.6 * s)}v${f(-5 * s)}h${f(-2.6 * s)}Z` + `M${f(x - 5.2 * s)} ${f(by - 4.6 * s)}A${f(5.2 * s)} ${f(4.4 * s)} 0 0 1 ${f(x + 5.2 * s)} ${f(by - 4.6 * s)}Z`;
const dome = (x, by, r) => `M${f(x - r)} ${f(by)}a${f(r)} ${f(r)} 0 0 1 ${f(2 * r)} 0Z`;
const bush = (x, by, s) => dome(x - 5 * s, by, 5 * s) + dome(x + 4 * s, by, 6.5 * s) + dome(x - 0.5 * s, by, 4.5 * s);
// 뿌리 옆 식물 무리: 풀에 양치·새싹·버섯·덤불 중 하나를 섞는다. 어두운 층(a)·밝은 층(b)·버섯 갓(c)으로 나눠 담는다.
function cluster(x, by, s, R, acc) {
  acc.a += grass(x - 5 * s, by, s, R) + grass(x + 6 * s, by, s * 0.85, R);
  const k = R();
  if (k < 0.34) acc.b += fern(x + s, by, s * 0.9);
  else if (k < 0.52) acc.b += sprout(x + 3 * s, by, s);
  else if (k < 0.72) acc.c += mushroom(x + 3 * s, by, s);
  else if (k < 0.86) acc.a += bush(x + 2 * s, by, s);
  else acc.b += grass(x + s, by, s * 1.15, R);
}
const paths = (acc, cls) => `<path class="f-pl-a${cls}" d="${acc.a}"/><path class="f-pl-b${cls}" d="${acc.b}"/><path class="f-pl-c${cls}" d="${acc.c}"/>`;

// 조약돌 아홉(D-067·D-084): 먼 곳 둘·가운데 넷·가까운 곳 셋. 자리는 손으로 정했다 — 그 깊이의 땅이 실제로 보이는 곳이다.
// 먼 곳은 길 끝 양옆의 먼 땅, 가운데는 가운데 나무 줄기 앞과 길가, 가까운 곳은 가지를 올린 큰 소나무 발치와 길가다. 앞 겹의 나무가 조금 가리면 가린 채로 둔다.
// 계열은 섞어 두었다(어느 감정이든 같은 가치다 — 늘 크거나 늘 작은 계열을 만들지 않는다).
const BAND_SIZE = [22, 30, 40];   // 상자 폭 360 기준 px
const SPOTS = [
  { key: "wish", band: 0, x: 150, y: 362 }, { key: "anger", band: 0, x: 218, y: 364 },
  { key: "hate", band: 1, x: 70, y: 474 }, { key: "sadness", band: 1, x: 96, y: 468 }, { key: "joy", band: 1, x: 226, y: 470 }, { key: "disgust", band: 1, x: 284, y: 466 },
  { key: "love", band: 2, x: 18, y: 698 }, { key: "enjoyment", band: 2, x: 84, y: 704 }, { key: "fear", band: 2, x: 312, y: 696 }
];
const TILT = [-16, 12, -8, 20, -14, 9, -22, 15, -5];
const LAYER_Z = { art: [1, 4, 7], pebble: [2, 5, 9], fore: [3, 6, 10] }; // 겹 사이 순서: 먼 숲 → 먼 돌 → 먼 풀 → 가운데 숲 → … (돌·안내 글은 11 이상, scene.css)

// 로딩 화면(web/splash.svg)도 같은 숲이다 — scripts/build-splash.mjs가 이 함수로 그림을 만들어 파일로 굳힌다(D-092 ④).
export function buildForest() {
  const R = rng(11), Rp = rng(41);
  let stars = "", flies = "";
  for (let i = 0; i < 9; i += 1) stars += `<circle class="f-star" cx="${f(14 + R() * 332)}" cy="${f(120 + R() * 130)}" r="${f(0.9 + R() * 0.8)}" style="--sd:${(-R() * 4).toFixed(2)}s"/>`;
  for (let i = 0; i < 8; i += 1) flies += `<circle class="f-fly" cx="${f(30 + R() * 300)}" cy="${f(390 + R() * 200)}" r="${f(1.1 + R() * 0.7)}" style="--sd:${(-R() * 5).toFixed(2)}s"/>`;
  const far = layer(3, 358, 34, [70, 132], [26, 46], 0.85);
  const mid = layer(5, 456, 14, [150, 232], [54, 86], 0.7, 30);
  const spots = SPOTS.map((p, i) => ({ ...p, w: BAND_SIZE[p.band], rot: TILT[i % TILT.length] }));

  // 뒤 식물: 나무 뿌리마다(먼 나무는 작게, 가운데 나무는 크게) + 조약돌 옆. 조약돌의 겹에 담아 앞 겹의 나무가 함께 가린다.
  const acc = [0, 1, 2].map(() => ({ a: "", b: "", c: "" })), fore = [0, 1, 2].map(() => ({ a: "", b: "", c: "" }));
  for (const b of far.bases) if (Rp() < 0.72) cluster(b.x + (Rp() < 0.5 ? -1 : 1) * b.w * 0.34, b.by + 3, 0.5, Rp, acc[0]);
  for (const b of mid.bases) if (Rp() < 0.85) cluster(b.x + (Rp() < 0.5 ? -1 : 1) * b.w * 0.36, b.by + 5, 1.0, Rp, acc[1]);
  for (const p of spots) { const dir = p.x < W / 2 ? -1 : 1; cluster(p.x + dir * p.w * 0.85, p.y + p.w * 0.42, Math.max(0.5, (p.w / 26) * 0.95), Rp, acc[p.band]); }
  // 가지를 올린 큰 소나무 밑의 무성한 풀과 양치 — 이제 잎에 덮이지 않고 발치에 보인다
  acc[2].a += grass(20, 668, 2.2, Rp) + grass(340, 672, 2.2, Rp) + grass(70, 690, 2.6, Rp) + grass(292, 694, 2.6, Rp);
  acc[2].b += fern(24, 700, 3.0) + fern(338, 704, 3.0);
  // 앞 식물: 조약돌 아래 모서리를 살짝 덮는 풀(조약돌이 풀 사이에 앉은 느낌). 같은 겹의 돌 바로 앞이다.
  for (const p of spots) { const dir = p.x < W / 2 ? 1 : -1; fore[p.band].a += grass(p.x + dir * p.w * 0.34, p.y + p.w * 0.48, Math.max(0.55, p.w / 26), Rp); }

  const svg = (inner, defs = "") => `<svg class="scene-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${defs && `<defs>${defs}</defs>`}${inner}</svg>`;
  const roadFill = (id) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--forest-path-far)"/><stop offset="1" style="stop-color:var(--forest-path-near)"/></linearGradient>`;
  const road = pathD(), groundMid = `M0 460C90 444 270 446 360 464L360 ${H}L0 ${H}Z`;
  // 먼 겹: 하늘(한 색) → 별 → 먼 나무 → 먼 땅 → 먼 식물 → 길 → 길 끝을 가리는 작은 나무 둘(길이 숲 속으로 사라진다)
  const farSvg = svg(`<rect class="f-sky" width="${W}" height="${H}"/>${stars}<g class="f-tree-far">${far.svg}</g>
<path class="f-ground-far" d="M0 356C70 344 260 346 360 358L360 ${H}L0 ${H}Z"/>${paths(acc[0], "")}<path d="${road}" fill="url(#fpath-far)"/>
<g class="f-tree-far"><path d="${pine(176, 364, 84, 30, 4)}"/><path d="${pine(204, 367, 96, 34, 4)}"/></g>`, roadFill("fpath-far"));
  // 가운데 겹: 가운데 나무 → 가운데 땅 → 가운데 땅 위의 길(같은 길을 가운데 땅 모양으로 잘라 다시 칠한다 — 먼 쪽 길은 가운데 나무 뒤로 지난다) → 가운데 식물
  const midSvg = svg(`<g class="f-tree-mid">${mid.svg}</g><path class="f-ground-mid" d="${groundMid}"/><path d="${road}" fill="url(#fpath-mid)" clip-path="url(#fground-mid)"/>${paths(acc[1], "")}`,
    roadFill("fpath-mid") + `<clipPath id="fground-mid"><path d="${groundMid}"/></clipPath>`);
  // 가까운 겹: 화면 가장자리 큰 소나무(가지를 올려 발치가 보인다, 길 밖에 선다) → 발치 식물 → 반딧불
  const nearSvg = svg(`<g class="f-tree-near"><path d="${pine(-4, 770, 500, 190, 6, 0.24)}"/><path d="${pine(364, 770, 500, 190, 6, 0.3)}"/></g>
<g class="f-tree-edge"><path d="${pine(46, 780, 340, 130, 5, 0.42)}"/><path d="${pine(338, 780, 320, 124, 5, 0.36)}"/></g>${paths(acc[2], " f-near")}${flies}`);
  const foreSvg = (a) => `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${paths(a, " f-fore")}</svg>`;
  return { art: [farSvg, midSvg, nearSvg], fore: fore.map(foreSvg), spots };
}

const pct = (v, total) => `${((v / total) * 100).toFixed(3)}%`;

// chosen: 그날 고른 계열 집합(있으면 그 계열의 돌이 켜져 있다). onStart: 돌을 눌렀을 때. caption: 돌 아래 문구.
export function renderForest({ chosen = null, caption, onStart, loading = false }) {
  const built = buildForest();
  const plate = (html, cls, z) => { const d = el("div", { class: cls, style: { "z-index": String(z) } }); d.innerHTML = html; return d; };
  const arts = built.art.map((html, band) => plate(html, "scene-art", LAYER_Z.art[band]));
  const fores = built.fore.map((html, band) => plate(html, "scene-fore", LAYER_Z.fore[band]));
  const pebbles = built.spots.sort((p, q) => p.y - q.y).map((p, i) => {
    const on = chosen ? chosen.has(p.key) : null, depth = p.band / 2;
    return el("div", { class: `pb${on === true ? " on" : on === false ? " off" : ""}`, "data-cat": p.key,
      style: { left: pct(p.x - p.w / 2, W), top: pct(p.y - p.w / 2, H), width: pct(p.w, W), "--k": `var(--${p.key}-500)`, "--k3": `var(--${p.key}-300)`, "--r": `${p.rot}deg`, "--z": String(LAYER_Z.pebble[p.band]), "--dp": depth.toFixed(2), "--dur": `${(3.4 + (i % 5) * 0.35).toFixed(2)}s`, "--d": `${(-((i * 0.7) % 4)).toFixed(2)}s` } },
      el("i", { class: "halo" }), pebbleImg(p.key, { size: 36 }));
  });
  const rest = stoneImg("rest"), lit = stoneImg("lit");
  const stone = el("button", { type: "button", class: "stone", "aria-label": "오늘의 마음 기록 시작하기", onclick: () => onStart?.(stone) },
    el("span", { class: "hop" }, el("span", { class: "rock" }, rest, lit)));
  const cap = el("p", { class: "cap", text: caption });
  const box = el("div", { class: "scene-box" }, ...arts, ...pebbles, ...fores, el("i", { class: "halo0" }), el("i", { class: "ring" }), el("i", { class: "ring b" }), stone, cap);
  const node = el("div", { class: `scene${chosen ? " recorded" : ""}${loading ? " loading" : ""}` }, box);
  return { node, stone, caption: cap, box };
}

// 가운데 돌을 누르면 숲의 조약돌이 돌에서 가까운 것부터 차례로 모두 켜진다(D-067). 저장 값과 무관한 순간 연출이다.
export function igniteAll(scene, stone) {
  const box = scene.querySelector(".scene-box"), o = stone.getBoundingClientRect();
  const ox = o.left + o.width / 2, oy = o.top + o.height / 2;
  const items = [...box.querySelectorAll(".pb")].map((pb) => { const r = pb.getBoundingClientRect(); return [pb, Math.hypot(r.left + r.width / 2 - ox, r.top + r.height / 2 - oy)]; });
  const far = Math.max(...items.map(([, d]) => d), 1);
  for (const [pb, d] of items) pb.style.setProperty("--ld", `${Math.round((d / far) * 480)}ms`);
  scene.classList.add("ignite");
}

// 돌에서 흰빛이 화면 전체로 퍼진다. 화면이 거의 덮이면 onCover(작성 첫 화면으로 이동)를 부르고, 그 아래에서 흰 화면이 열리며 빛이 걷힌다.
// 움직임 줄이기: 퍼지지 않고 짧게 흰 화면으로 바뀐다. 저장 값·달력·통계와 무관한 순간 연출이다(D-062).
export function spreadLight(origin, onCover) {
  const reduced = reducedMotion();
  const ms = Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue(reduced ? "--stone-flood-reduced" : "--stone-flood"), 10) || (reduced ? 250 : 1500);
  const r = origin.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const far = Math.max(Math.hypot(cx, cy), Math.hypot(innerWidth - cx, cy), Math.hypot(cx, innerHeight - cy), Math.hypot(innerWidth - cx, innerHeight - cy));
  const size = Math.ceil((2 * far) / 0.7) + 40;
  const disc = el("i", { class: "disc" });
  const flood = el("div", { class: "flood", "aria-hidden": "true", style: { "--fx": `${cx}px`, "--fy": `${cy}px`, "--fs": `${size}px` } }, disc);
  document.body.append(flood);
  const grow = reduced
    ? disc.animate([{ opacity: 0, transform: "translate(-50%,-50%) scale(1)" }, { opacity: 1, transform: "translate(-50%,-50%) scale(1)" }], { duration: ms, fill: "forwards" })
    : disc.animate([{ transform: "translate(-50%,-50%) scale(.05)" }, { transform: "translate(-50%,-50%) scale(1)" }], { duration: ms, easing: "cubic-bezier(.35,.05,.5,1)", fill: "forwards" });
  setTimeout(() => onCover?.(), ms * 0.8);
  grow.finished.then(() => flood.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduced ? 150 : 450, easing: "ease-out", fill: "forwards" }).finished.then(() => flood.remove(), () => flood.remove()), () => flood.remove());
}
