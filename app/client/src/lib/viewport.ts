// 자판이 가린 높이(TASK-PERSONAL-01 A-8, D-125). 문서는 스크롤하지 않고 #app만 스크롤하므로(base.css), 자판이 떠 있는 동안
// 그 높이만큼 #app 아래를 비워야 내용 바로 뒤의 '다음'(U-1)까지 밀어서 닿는다. 값은 CSS 변수 --keyboard-inset으로만 건넨다
// (CSSOM — HTML style 속성이 아니라 CSP와 무관하다). visualViewport가 없는 브라우저에서는 아무것도 하지 않는다.
//
// 위쪽 보정(TASK-PERSONAL-01 4-9): 배치 C를 운영에 올린 뒤에도(빌드 20261019175608) iPhone 홈 화면 앱에서 자판이 뜨면 웹 화면이
// 약 62pt 위로 밀려 작성 흐름의 위쪽 줄이 다이나믹 아일랜드·시계 자리에 그려졌다(2026-10-20 사용자 캡처). 문서가 넘치지 않아도
// iOS가 보이는 영역을 레이아웃 안에서 아래로 옮긴 것으로 본다(추정 — 2026-10-20 배치 A 측정에서 vv.offsetTop이 63이었다).
// 그래서 자판이 떠 있는 동안 ① 창이 스크롤됐으면 0으로 되돌리고 ② 그래도 보이는 영역이 아래로 밀려 있으면(vv.offsetTop) 그만큼
// 화면 위를 비워(--viewport-shift, body padding-top) 내용이 보이는 영역의 맨 위에서 시작하게 한다. 확대(핀치) 중에는 보정하지 않는다.

/** 레이아웃 높이 중 보이는 영역 아래로 가려진 높이(px, 반올림). 자판이 없으면 0 */
export function keyboardInset(innerHeight: number, viewport: { height: number; offsetTop: number }): number {
  return Math.max(0, Math.round(innerHeight - viewport.height - viewport.offsetTop));
}

/** 자판이 떠 있을 때 위를 비울 높이(px). 자판이 없거나 확대 중이면 0 */
export function viewportShift(inset: number, viewport: { offsetTop: number; scale?: number }): number {
  if (inset <= 0) return 0;
  if (viewport.scale !== undefined && Math.abs(viewport.scale - 1) > 0.01) return 0;
  return Math.max(0, Math.round(viewport.offsetTop));
}

function setVar(root: HTMLElement, name: string, value: number): void {
  if (value > 0) root.style.setProperty(name, `${value}px`);
  else root.style.removeProperty(name);
}

/** 듣기를 시작하고, 멈추는 함수를 돌려준다(시험에서 쓴다) */
export function installViewportInset(): () => void {
  const viewport = window.visualViewport;
  if (!viewport) return () => {};
  const root = document.documentElement;
  const update = (): void => {
    const inset = keyboardInset(window.innerHeight, viewport);
    // 자판이 떠 있는데 창이 스크롤돼 있으면 되돌린다 — 문서는 넘치지 않으므로 맨 위가 맞는 자리다
    if (inset > 0 && window.scrollY !== 0) window.scrollTo(0, 0);
    setVar(root, "--keyboard-inset", inset);
    setVar(root, "--viewport-shift", viewportShift(inset, viewport));
  };
  viewport.addEventListener("resize", update);
  viewport.addEventListener("scroll", update);
  window.addEventListener("scroll", update, { passive: true });
  update();
  return () => {
    viewport.removeEventListener("resize", update);
    viewport.removeEventListener("scroll", update);
    window.removeEventListener("scroll", update);
    root.style.removeProperty("--keyboard-inset");
    root.style.removeProperty("--viewport-shift");
  };
}
