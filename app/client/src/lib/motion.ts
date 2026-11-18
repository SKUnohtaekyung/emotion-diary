// 움직임 줄이기와 화면 전환을 한 곳에서(MAP R6, UX_SPEC §12). CSS 움직임은 @media (prefers-reduced-motion: no-preference) 안에서만
// 돌고, 스크립트로 거는 움직임(Web Animations·View Transitions)은 이 도우미를 거친다 — 줄인 길에서는 결과 상태로 바로 간다.

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type TransitionDocument = Document & { startViewTransition?: (update: () => void) => unknown };

/** 화면을 바꾸는 일을 View Transitions로 감싼다. 지원하지 않거나 움직임 줄이기면 그냥 바꾼다(정보·기능은 같다). */
export function withViewTransition(update: () => void): void {
  const doc = document as TransitionDocument;
  if (prefersReducedMotion() || typeof doc.startViewTransition !== "function") {
    update();
    return;
  }
  doc.startViewTransition(update);
}

/** 한 번만 도는 진입 움직임을 걸지 정한다 — 줄인 길이면 걸지 않는다. */
export function shouldAnimateOnce(): boolean {
  return !prefersReducedMotion();
}
