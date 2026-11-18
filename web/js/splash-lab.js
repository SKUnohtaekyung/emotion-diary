// 로딩 화면 시안 비교(시안 전용). ①② 견본 상자는 index.html의 로딩 화면과 같은 마크업·규칙(css/splash-variants.css)을 쓰고,
// ③은 실제 시안 index.html?sv=b&mk=&mo=&splash=<ms>#/today를 iframe으로 띄워 처음부터 오늘 화면까지 본다.
// splash=<ms>는 '그 시간에 준비됐다'를 흉내 낸다(js/splash.js). 빠름은 붙이지 않는다 — 이 PC에서는 0.3초 안에 준비돼 로딩 화면이 보이지 않아야 한다.
import { applyTokens } from "./tokens.js";

await applyTokens(); // 색·글꼴 변수(design/tokens.json)

const SHAPES = [
  { id: "s1", title: "① 겹친 두 돌", note: "오늘 화면 돌처럼 뒤 돌(어둡게)과 앞 돌. 넘어갈 때 가장 자연스럽게 이어진다" },
  { id: "s2", title: "② 한 돌", note: "앞 돌(콩 모양) 하나만. 가장 단순하다" },
  { id: "s3", title: "③ 한 색 두 돌", note: "한 색 실루엣에 앞 돌 둘레만 틈으로. 아이콘처럼 또렷하다" },
  { id: "s4", title: "④ 한 돌 + 빛 한 줄", note: "한 돌에 윗부분 반짝임 한 줄. 매끈한 조약돌 느낌" }
];
const MOTIONS = [
  { id: "hop", title: "통통", note: "조약돌이 가볍게 뛰었다 내려앉는다(오늘 화면 돌을 누를 때와 같은 결)" },
  { id: "ripple", title: "잔물결", note: "조약돌 아래로 물결이 천천히 번진다. 가장 조용하다" },
  { id: "dots", title: "작은 돌 셋", note: "아래 작은 조약돌 셋이 차례로 켜진다. 익숙한 '기다리는 중' 표시" },
  { id: "rock", title: "기우뚱", note: "조약돌이 좌우로 천천히 흔들린다" }
];
const TIMES = [
  { ms: 0, label: "빠름 · 0.3초 안" },
  { ms: 1200, label: "1.2초" },
  { ms: 5000, label: "5초" },
  { ms: 12000, label: "12초" }
];

const template = (() => {
  const center = document.createElement("div");
  center.className = "splash-center";
  center.setAttribute("aria-hidden", "true");
  center.innerHTML = `<svg class="splash-ripples" viewBox="0 0 140 40"><ellipse cx="70" cy="20" rx="64" ry="16" fill="none" stroke="#62FDB4" stroke-width="2"/><ellipse cx="70" cy="20" rx="64" ry="16" fill="none" stroke="#62FDB4" stroke-width="2"/></svg>
    <span class="splash-mark"><svg viewBox="0 0 132 107"><use class="mk-s1" href="splash-pebbles.svg#s1"/><use class="mk-s2" href="splash-pebbles.svg#s2"/><use class="mk-s3" href="splash-pebbles.svg#s3"/><use class="mk-s4" href="splash-pebbles.svg#s4"/></svg></span>
    <span class="splash-dots">${'<svg viewBox="0 0 132 107"><use href="splash-pebbles.svg#s2"/></svg>'.repeat(3)}</span>`;
  return center;
})();

function demo(mk, mo, withIcon = false) {
  const box = document.createElement("div");
  box.className = "splash-demo";
  box.dataset.mk = mk;
  box.dataset.mo = mo;
  box.style.setProperty("--mo-delay", "0s");
  box.append(template.cloneNode(true));
  if (withIcon) {
    const icon = document.createElement("span");
    icon.className = "lab-icon";
    icon.title = "같은 모양의 앱 아이콘";
    icon.innerHTML = `<svg viewBox="0 0 132 107"><use href="splash-pebbles.svg#${mk}"/></svg>`;
    box.append(icon);
  }
  return box;
}

function card(title, note, box) {
  const wrap = document.createElement("article");
  wrap.className = "lab-card";
  const h = document.createElement("h3");
  h.textContent = title;
  const p = document.createElement("p");
  p.textContent = note;
  wrap.append(h, box, p);
  return wrap;
}

function chips(host, items, current, onPick) {
  host.replaceChildren();
  for (const item of items) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.label ?? item.title;
    button.setAttribute("aria-pressed", String((item.ms ?? item.id) === current));
    button.addEventListener("click", () => {
      for (const other of host.children) other.setAttribute("aria-pressed", String(other === button));
      onPick(item.ms ?? item.id);
    });
    host.append(button);
  }
}

// ① 모양 — 가만히(움직임 없이)
for (const shape of SHAPES) document.getElementById("shapes").append(card(shape.title, shape.note, demo(shape.id, "none", true)));

// ② 움직임 — 곧바로 반복(실제로는 드러난 지 2초 뒤부터)
let motionShape = "s1";
function drawMotions() {
  const host = document.getElementById("motions");
  host.replaceChildren(...MOTIONS.map((m) => card(m.title, m.note, demo(motionShape, m.id))));
}
chips(document.getElementById("motion-shape"), SHAPES.map((s) => ({ id: s.id, title: s.title })), motionShape, (id) => { motionShape = id; drawMotions(); });
drawMotions();

// ③ 처음부터 끝까지
const run = { mk: "s1", mo: "ripple", ms: 5000 }; // 사용자 선택(2026-11-18): ① 겹친 두 돌 + 잔물결
const frame = document.getElementById("run-frame");
const note = document.getElementById("run-note");
function play() {
  const params = new URLSearchParams({ sv: "b", mk: run.mk, mo: run.mo, t: String(Date.now()) });
  if (run.ms > 0) params.set("splash", String(run.ms));
  frame.src = `index.html?${params}#/today`;
  note.textContent = run.ms === 0
    ? "0.3초 안에 준비되면 로딩 화면 없이 바로 오늘 화면이 뜬다."
    : run.ms < 2300
      ? "2초 안에 끝나 움직이는 표시 없이 조약돌만 잠깐 보였다가 돌 자리로 내려앉는다."
      : run.ms < 10300
        ? "2초가 지나면 움직이는 표시가 돌고, 준비되면 돌 자리로 내려앉는다."
        : "10초가 넘으면 아래에 '연결이 느린 것 같아요 · 다시 시도'가 나온다.";
}
chips(document.getElementById("run-shape"), SHAPES.map((s) => ({ id: s.id, title: s.title })), run.mk, (id) => { run.mk = id; play(); });
chips(document.getElementById("run-motion"), [...MOTIONS, { id: "none", title: "없음" }], run.mo, (id) => { run.mo = id; play(); });
chips(document.getElementById("run-time"), TIMES, run.ms, (ms) => { run.ms = ms; play(); });
document.getElementById("run-replay").addEventListener("click", play);

function fit() {
  const phone = frame.parentElement;
  frame.style.transform = `scale(${phone.clientWidth / 360})`;
}
fit();
addEventListener("resize", fit);
play();
