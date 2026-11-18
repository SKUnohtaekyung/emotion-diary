// 자유 배치 → 격자 전환(D-083 ③, D-128, RK-027). 마음 고르기·이유·완료 세 장면이 함께 쓴다 — 시안 web/js/components/land.js의 watchFreeGrid·anyOverlap.
// 조건 하나라도 맞으면 장면 뿌리에 fl-grid를 붙인다: 뿌리 글자 20px(기본 16의 125%) 이상, 또는 그린 뒤 잰 상자 겹침이 하나라도 있음.
// 숨은 1em 상자(.em-probe — 모양은 CSS, CSP)를 body 바로 아래에 두고 ResizeObserver로 뿌리 글자 변화와 장면 폭 변화를 함께 듣는다.
// 판단은 프레임당 한 번(requestAnimationFrame) — 클래스가 깜빡이지 않는다. iPhone '더 큰 텍스트'가 홈 화면 앱에 닿는지는 휴대폰에서 본다(PLAN A-11).

export const BIG_TEXT_PX = 20;

/** 셀렉터가 고른 요소끼리 그려진 상자가 하나라도 겹치면 true. */
export function anyOverlap(root: Element, selector: string): boolean {
  const boxes = [...root.querySelectorAll(selector)].map((node) => node.getBoundingClientRect());
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const a = boxes[i] as DOMRect;
      const b = boxes[j] as DOMRect;
      if (Math.min(a.right, b.right) > Math.max(a.left, b.left) && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top)) return true;
    }
  }
  return false;
}

export interface FreeGridOptions {
  overlap?: (root: HTMLElement) => boolean;
  onFrame?: (root: HTMLElement) => void;
}

/** 지켜보기를 건다. 돌려준 함수로 멈춘다(화면을 떠날 때). */
export function watchFreeGrid(root: HTMLElement, options: FreeGridOptions = {}): () => void {
  const probe = document.createElement("i");
  probe.className = "em-probe";
  probe.setAttribute("aria-hidden", "true");
  document.body.append(probe);
  let scheduled = false;
  let stopped = false;
  const decide = (): void => {
    scheduled = false;
    if (stopped) return;
    if (!root.isConnected) {
      stop();
      return;
    }
    const bigText = probe.getBoundingClientRect().width >= BIG_TEXT_PX;
    options.onFrame?.(root);
    const overlapped = !bigText && options.overlap ? options.overlap(root) : false;
    root.classList.toggle("fl-grid", bigText || overlapped);
  };
  const schedule = (): void => {
    if (scheduled || stopped) return;
    scheduled = true;
    requestAnimationFrame(decide);
  };
  const observer = typeof ResizeObserver === "function" ? new ResizeObserver(schedule) : null;
  observer?.observe(probe);
  observer?.observe(root);
  schedule();
  function stop(): void {
    if (stopped) return;
    stopped = true;
    observer?.disconnect();
    probe.remove();
  }
  return stop;
}
