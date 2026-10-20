// 자판이 가린 높이(TASK-PERSONAL-01 A-8, D-125). 문서는 스크롤하지 않고 #app만 스크롤하므로(base.css), 자판이 떠 있는 동안
// 그 높이만큼 #app 아래를 비워야 내용 바로 뒤의 '다음'(U-1)까지 밀어서 닿는다. 값은 CSS 변수 --keyboard-inset으로만 건넨다
// (CSSOM — HTML style 속성이 아니라 CSP와 무관하다). visualViewport가 없는 브라우저에서는 아무것도 하지 않는다.

/** 레이아웃 높이 중 보이는 영역 아래로 가려진 높이(px, 반올림). 자판이 없으면 0 */
export function keyboardInset(innerHeight: number, viewport: { height: number; offsetTop: number }): number {
  return Math.max(0, Math.round(innerHeight - viewport.height - viewport.offsetTop));
}

/** 듣기를 시작하고, 멈추는 함수를 돌려준다(시험에서 쓴다) */
export function installViewportInset(): () => void {
  const viewport = window.visualViewport;
  if (!viewport) return () => {};
  const root = document.documentElement;
  const update = (): void => {
    const inset = keyboardInset(window.innerHeight, viewport);
    if (inset > 0) root.style.setProperty("--keyboard-inset", `${inset}px`);
    else root.style.removeProperty("--keyboard-inset");
  };
  viewport.addEventListener("resize", update);
  viewport.addEventListener("scroll", update);
  update();
  return () => {
    viewport.removeEventListener("resize", update);
    viewport.removeEventListener("scroll", update);
    root.style.removeProperty("--keyboard-inset");
  };
}
