// 앱 시작 로딩 화면(D-092 ④): 오늘 화면의 빈 숲(web/splash.svg — scripts/build-splash.mjs가 forest.js로 굳힌 그림)과 가운데 돌 하나가 숨 쉰다.
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
  await sleep(Math.max(shownAt + MIN_SHOWN, hold) - performance.now());
  const reduced = reducedMotion();

  if (route === "welcome") { spreadLight(node.querySelector(".splash-stone"), done); return; }

  const box = node.querySelector(".splash-box"), target = route === "today" ? document.querySelector(".scene-box") : null;
  if (target && !reduced) {
    // 숲을 오늘 화면의 숲 자리(시안 띠 아래)로 옮겨 겹친다 — 같은 그림이라 이음매 없이 오늘 화면이 된다
    const a = box.getBoundingClientRect(), b = target.getBoundingClientRect(), s = b.width / a.width;
    await box.animate([{ transform: "none" }, { transform: `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${s})` }], { duration: 380, easing: "cubic-bezier(.65,0,.35,1)", fill: "forwards" }).finished.catch(() => {});
    document.querySelectorAll(".today-head .hero span").forEach((span) => span.getAnimations().forEach((an) => { an.cancel(); an.play(); })); // 큰 질문이 로딩 화면이 걷힌 뒤에 올라오게 다시 튼다
  }
  await node.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduced ? 150 : 420, easing: "ease-out", fill: "forwards" }).finished.catch(() => {});
  done();
}
