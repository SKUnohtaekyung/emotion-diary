// 앱 시작 로딩 화면(D-134 — D-092 ④의 '빈 숲 + 숨 쉬는 돌'을 바꿨다). 시안 web/js/splash.js의 B안(?sv=b)을 옮겼다.
// index.html에 HTML·CSS로 들어 있어 스크립트보다 먼저 그려진다: 오늘 화면 숲 하늘과 같은 남색 위 평면 조약돌(오늘 화면 돌의 실루엣).
// 남색 막은 첫 그림부터 깔리고(흰 번쩍임 없이 오늘 화면 숲 하늘의 남색이 이어진다), 조약돌은 300ms 안에 준비되면 보이지 않는다(CSS가 300ms 뒤에야 드러낸다). 보이면 최소 0.6초. 2초 뒤 잔물결·10초 뒤 '다시 시도'는 CSS 시간으로만(forest.css).
// 걷힐 때: 오늘 화면이면 조약돌이 오늘 화면 돌 자리로 내려앉으며 진짜 돌로 바뀌고(실루엣이 같다) 남색 막이 걷혀 숲이 드러난다.
// 온보딩이면 조약돌에서 흰빛이 퍼진다. 그 밖(잠금 등)은 짧게 사라진다. 움직임 줄이기면 곧바로 옅어진다.

import { prefersReducedMotion } from "../lib/motion";
import { spreadLight } from "./Forest";

const MIN_SHOWN = 600;
const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, Math.max(0, ms)));
const node = (): HTMLElement | null => document.getElementById("splash");
const settle = (animation: Animation): Promise<unknown> => animation.finished.catch(() => {});

/** 바로 걷는다(시작 실패 — 로딩 화면이 오류 문구를 덮지 않게) */
export function dropSplash(): void {
  node()?.remove();
}

/** from을 to의 자리·크기로 옮기며, 도착하면서 옅어진다(평면 조약돌 → 진짜 돌) */
function landOn(from: Element, to: Element): Animation {
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  const scale = a.width > 0 ? b.width / a.width : 1;
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const there = `translate(${dx}px, ${dy}px) scale(${scale})`;
  return from.animate(
    [
      { transform: "none", opacity: 1 },
      { opacity: 1, offset: 0.6 },
      { transform: there, opacity: 1, offset: 0.8 },
      { transform: there, opacity: 0 }
    ],
    { duration: 560, easing: "cubic-bezier(.5,0,.2,1)", fill: "forwards" }
  );
}

/** 첫 화면을 그린 뒤 부른다. route는 첫 화면의 이름(today·welcome·…) */
export async function finishSplash(route: string): Promise<void> {
  const splash = node();
  if (!splash?.isConnected) return;
  // 조약돌이 드러나는 순간 = 조약돌 묶음의 CSS 등장 애니메이션(300ms 지연)이 시작하는 때부터 잰다. 남색 막은 처음부터 깔려 있다
  const center = splash.querySelector(".splash-center");
  const intro = center && typeof center.getAnimations === "function" ? center.getAnimations().find((a) => (a as CSSAnimation).animationName === "splash-in") : undefined;
  const start = intro?.startTime;
  const shownAt = typeof start === "number" ? start + 300 : Number.POSITIVE_INFINITY;
  if (performance.now() < shownAt || typeof splash.animate !== "function") {
    dropSplash(); // 조약돌이 드러나기 전에 준비됐다(또는 움직임을 못 건다) — 남색 막째 걷는다
    return;
  }
  await sleep(shownAt + MIN_SHOWN - performance.now());
  const reduced = prefersReducedMotion();
  const mark = splash.querySelector(".splash-mark");
  if (route === "welcome" && mark && !reduced) {
    spreadLight(mark, dropSplash);
    return;
  }
  const veil = splash.querySelector(".splash-veil");
  // 오늘 화면 돌의 쉬는 그림(첫 .stone-img — 둘째는 켜진 그림)
  const stone = route === "today" ? document.querySelector(".forest .stone .stone-img") : null;
  if (!reduced && mark && veil && stone) {
    const quick = [...splash.querySelectorAll(".splash-ripples, .splash-slow")].map((part) => settle(part.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" })));
    await Promise.all([
      settle(landOn(mark, stone)),
      settle(veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 480, delay: 80, easing: "ease-in-out", fill: "forwards" })),
      ...quick
    ]);
    dropSplash();
    return;
  }
  await settle(splash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduced ? 150 : 300, easing: "ease-out", fill: "forwards" }));
  dropSplash();
}
