// 세부 감정 화면 위쪽의 친구와 바구니(D-068·D-071) — 시안 web/js/components/detail.js.
// 스크롤 전에는 큰 친구(200px)와 바구니, 목록을 내리면 함께 약 104px로 줄어 위에 남는다(바구니가 화면 밖으로 밀려나지 않게).
// 스크롤은 #app이 한다(D-125, MAP R1·§3 detail.js:45) — 창이 아니라 #app의 scroll을 듣고, 붙는 자리도 #app 위 끝으로 잰다.
// 친구 뒤에 면·상자를 깔지 않는다(D-061). 숨쉬기는 2~3% 안쪽, 움직임 줄이기에서 꺼진다.

import { useLayoutEffect, useRef } from "preact/hooks";
import { FRIENDS, friendUrl } from "../../lib/art";
import { categoryLabel } from "../../write/flow";
import { Basket, type BasketHandle } from "./Basket";

export function DetailStage({ category, chosen, basket }: { category: string; chosen: readonly string[]; basket: { current: BasketHandle | null } }) {
  const stage = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const node = stage.current;
    const scroller = document.getElementById("app");
    if (!node || !scroller) return;
    let frame = 0;
    // 붙는 자리(sticky top)에 닿은 순간부터 축소다. 크기가 아니라 transform이라 이 판단이 되먹임하지 않는다
    const check = (): void => {
      frame = 0;
      if (!node.isConnected) return;
      const top = scroller.getBoundingClientRect().top + (Number.parseFloat(getComputedStyle(node).top) || 0);
      node.classList.toggle("compact", scroller.scrollTop > 0 && node.getBoundingClientRect().top <= top + 1);
    };
    const onScroll = (): void => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  const name = FRIENDS[category]?.name ?? "";
  return (
    <div ref={stage} class="detail-stage">
      <div class="stage-art">
        <span class="friend-spot">
          <img class="friend-img breathe" src={friendUrl(category, 200)} alt={`${name}, ${categoryLabel(category)} 친구`} decoding="async" />
        </span>
        <Basket category={category} initial={chosen} handle={basket} />
      </div>
    </div>
  );
}
