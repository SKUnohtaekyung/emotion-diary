// 앱 시작 로딩 화면(D-092 ④) — 시안 web/js/splash.js를 옮겼다(TASK-JOURNAL-01 J-8, PLAN A-8).
// index.html에 HTML·CSS로 들어 있어(그림은 public/splash.svg — scripts/splash.mjs가 오늘 숲과 같은 계산으로 굳힌 것) 스크립트보다 먼저 그려진다.
// 300ms 안에 준비되면 보이지 않는다(CSS가 300ms 뒤에야 드러낸다). 보이면 최소 0.6초.
// 걷힐 때: 오늘 화면이면 숲이 오늘 화면의 숲 자리로 미끄러져 겹친 뒤 사라지고, 온보딩이면 가운데 돌에서 흰빛이 퍼진다. 그 밖은 짧게 사라진다.

import { prefersReducedMotion } from "../lib/motion";
import { spreadLight } from "./Forest";

const MIN_SHOWN = 600;
const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, Math.max(0, ms)));
const node = (): HTMLElement | null => document.getElementById("splash");

/** 바로 걷는다(시작 실패 — 로딩 화면이 오류 문구를 덮지 않게) */
export function dropSplash(): void {
  node()?.remove();
}

/** 첫 화면을 그린 뒤 부른다. route는 첫 화면의 이름(today·welcome·…) */
export async function finishSplash(route: string): Promise<void> {
  const splash = node();
  if (!splash?.isConnected) return;
  // 드러나는 순간 = CSS 등장 애니메이션(300ms 지연)이 시작하는 때부터 잰다
  const intro = typeof splash.getAnimations === "function" ? splash.getAnimations().find((a) => (a as CSSAnimation).animationName === "splash-in") : undefined;
  const start = intro?.startTime;
  const shownAt = typeof start === "number" ? start + 300 : Number.POSITIVE_INFINITY;
  if (performance.now() < shownAt || typeof splash.animate !== "function") {
    dropSplash(); // 드러나기 전에 준비됐다(또는 움직임을 못 건다)
    return;
  }
  await sleep(shownAt + MIN_SHOWN - performance.now());
  const reduced = prefersReducedMotion();
  if (route === "welcome") {
    const stone = splash.querySelector(".splash-stone");
    if (stone) {
      spreadLight(stone, dropSplash);
      return;
    }
  }
  const box = splash.querySelector<HTMLElement>(".splash-box");
  const target = route === "today" ? document.querySelector(".forest-box") : null;
  if (box && target && !reduced) {
    // 숲을 오늘 화면의 숲 자리로 옮겨 겹친다 — 같은 그림이라 이음매 없이 오늘 화면이 된다
    const a = box.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const scale = b.width / a.width;
    await box
      .animate([{ transform: "none" }, { transform: `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${scale})` }], {
        duration: 380,
        easing: "cubic-bezier(.65,0,.35,1)",
        fill: "forwards"
      })
      .finished.catch(() => {});
  }
  await splash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduced ? 150 : 420, easing: "ease-out", fill: "forwards" }).finished.catch(() => {});
  dropSplash();
}
