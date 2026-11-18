// 앱 시작 로딩 화면(D-134 — 기본은 남색 + 겹친 두 돌 + 잔물결, 아래 settleIntoToday. 이 머리 설명과 아래 숲 넘김은 예전 모습 ?sv=a(D-092 ④)): 오늘 화면의 빈 숲(web/splash.svg — scripts/build-splash.mjs가 forest.js로 굳힌 그림)과 가운데 돌 하나가 숨 쉰다.
// index.html에 HTML·CSS로 들어 있어 스크립트보다 먼저 그려지고, 300ms 안에 준비되면 보이지 않는다(CSS가 300ms 뒤에야 드러낸다). 보이면 최소 0.6초.
// 걷힐 때: 오늘 화면이면 숲이 오늘 화면의 숲 자리로 미끄러져 겹친 뒤 사라지고(그 위에 조약돌·큰 질문이 나타난다),
// 온보딩(#/welcome)이면 가운데 돌에서 흰빛이 퍼지며(돌을 누를 때와 같은 전환) 이야기가 열린다. 그 밖의 화면은 짧게 사라진다.
// QA: 주소의 # 앞에 ?splash=2500을 붙이면 그 시간(ms)만큼 로딩 화면을 붙잡아 둔다(예: /?splash=3000#/today).
import { reducedMotion } from "./dom.js";
import { spreadLight } from "./components/forest.js";

const node = document.getElementById("splash");
let resolveDone;
export const splashDone = new Promise((r) => { resolveDone = r; }); // 온보딩 이야기는 이것을 기다렸다가 첫 장면을 시작한다
if (!node) resolveDone();

const MIN_SHOWN = 600;
const sleep = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));
const done = () => { node?.remove(); resolveDone(); };
// 시작이 실패하면(값 파일을 못 읽음 등) 로딩 화면이 오류 문구를 덮지 않게 바로 걷는다 — main.js의 catch가 부른다
export const dropSplash = done;

export async function finishSplash(route) {
  if (!node?.isConnected) return;
  const q = new URLSearchParams(location.search);
  const hold = q.has("splash") ? Number(q.get("splash")) || 2500 : 0;
  // 드러나는 순간 = CSS 등장 애니메이션(300ms 지연)이 시작하는 때. 페이지 시작이 아니라 이 순간부터 잰다(스타일이 늦게 계산되는 느린 기기).
  const intro = node.getAnimations().find((a) => a.animationName === "splash-in");
  const shownAt = intro?.startTime != null ? intro.startTime + 300 : Infinity;
  if (!hold && performance.now() < shownAt) { done(); return; } // 드러나기 전에 준비됐다
  // 붙잡기(QA)에서 등장 애니메이션이 아직 시작 전이면 shownAt이 Infinity다 — setTimeout(Infinity)는 곧바로 불려 붙잡지 못했다. 그때는 페이지 시작 0.3초를 드러난 때로 본다
  const visibleAt = Number.isFinite(shownAt) ? shownAt : 300;
  await sleep(Math.max(visibleAt + MIN_SHOWN, hold) - performance.now());
  const reduced = reducedMotion();

  const variant = document.documentElement.dataset.sv;
  if (route === "welcome") { spreadLight(node.querySelector(variant ? ".splash-mark" : ".splash-stone"), done); return; }
  if (variant) { await settleIntoToday(route, reduced); done(); return; }

  const box =node.querySelector(".splash-box"), target = route === "today" ? document.querySelector(".scene-box") : null;
  if (target && !reduced) {
    // 숲을 오늘 화면의 숲 자리(시안 띠 아래)로 옮겨 겹친다 — 같은 그림이라 이음매 없이 오늘 화면이 된다
    const a = box.getBoundingClientRect(), b = target.getBoundingClientRect(), s = b.width / a.width;
    await box.animate([{ transform: "none" }, { transform: `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${s})` }], { duration: 380, easing: "cubic-bezier(.65,0,.35,1)", fill: "forwards" }).finished.catch(() => {});
    document.querySelectorAll(".today-head .hero span").forEach((span) => span.getAnimations().forEach((an) => { an.cancel(); an.play(); })); // 큰 질문이 로딩 화면이 걷힌 뒤에 올라오게 다시 튼다
  }
  await node.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduced ? 150 : 420, easing: "ease-out", fill: "forwards" }).finished.catch(() => {});
  done();
}

// ── 비교 시안 B(?sv=b, splash-lab.html): 평면 조약돌이 오늘 화면의 돌 자리로 내려앉으며 진짜 돌로 바뀌고, 남색 막이 걷히며 숲이 드러난다 ──
// 조약돌은 오늘 화면 돌의 실루엣을 딴 것이라(splash-pebbles.svg) 그 자리에 그대로 겹친다. 오늘 화면이 아니면(잠금 등) 막만 짧게 걷는다. 움직임 줄이기면 곧바로 옅어진다.
// fadeFrom: 이 지점(0~1)부터 옅어진다. 평면 조약돌은 진짜 돌과 실루엣이 같아 도착하면서 옅어지면 평면이 진짜 돌로 바뀌어 보인다
const fly = (from, to, opts, fadeFrom = 0.72) => {
  const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
  const s = b.width / a.width;
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const base = getComputedStyle(from).transform;
  const start = base === "none" ? "" : base;
  return from.animate([
    { transform: `translate(0,0) ${start}`, opacity: 1 },
    { opacity: 1, offset: fadeFrom },
    { transform: `translate(${dx}px, ${dy}px) ${start} scale(${s})`, opacity: fadeFrom < 0.5 ? 0.15 : 1, offset: 0.8 },
    { transform: `translate(${dx}px, ${dy}px) ${start} scale(${s})`, opacity: 0 }
  ], { fill: "forwards", ...opts }).finished.catch(() => {});
};

async function settleIntoToday(route, reduced) {
  const veil = node.querySelector(".splash-veil"), center = node.querySelector(".splash-center"), slow = node.querySelector(".splash-slow");
  const target = route === "today" ? document.querySelector(".scene-box .stone .stone-img.rest") : null;
  if (reduced || !target) {
    await node.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduced ? 150 : 300, easing: "ease-out", fill: "forwards" }).finished.catch(() => {});
    return;
  }
  // 큰 질문은 막이 걷힌 뒤에 올라오게 다시 튼다(A와 같다)
  document.querySelectorAll(".today-head .hero span").forEach((span) => span.getAnimations().forEach((an) => { an.cancel(); an.play(); }));
  const mark = node.querySelector(".splash-mark");
  mark.getAnimations().forEach((an) => an.cancel()); // 기다림 움직임(통통·기우뚱)을 멈추고 제자리에서 출발
  const moves = [
    fly(mark, target, { duration: 640, easing: "cubic-bezier(.5,0,.2,1)" }, 0.6),
    veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 560, delay: 120, easing: "ease-in-out", fill: "forwards" }).finished.catch(() => {}),
    slow.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" }).finished.catch(() => {})
  ];
  for (const extra of node.querySelectorAll(".splash-ripples, .splash-dots")) moves.push(extra.animate([{ opacity: getComputedStyle(extra).opacity }, { opacity: 0 }], { duration: 160, fill: "forwards" }).finished.catch(() => {}));
  await Promise.all(moves);
  center.remove();
}
