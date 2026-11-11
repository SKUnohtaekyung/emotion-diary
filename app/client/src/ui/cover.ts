// 덮개(D-113 ①): 앱을 떠나는 순간 숲으로 화면을 덮는다 — 잠금과 상관없이 모두. 앱 전환 화면에 기록이 비치지 않게 하려는 것이다.
// 같은 이벤트 처리기 안에서 동기로 붙여야 하므로 이 모듈은 비동기 일을 하지 않는다.
// 2026-11-12 미리 그려 둔 숨은 층을 보이게만 한다(TASK-JOURNAL-01 A-9) — 떠나는 순간 새로 그리면 그림이 그려지기 전에 앱 전환 스냅샷이
// 찍힐 수 있다(RK-039·T-03). 층에는 로딩·잠금 화면과 같은 빈 숲(splash.svg)이 있다. 휴대폰에서 늦게 덮이면 단색으로 되돌린다.

import { h } from "../lib/dom";

let layer: HTMLElement | null = null;

function ensure(): HTMLElement {
  if (!layer?.isConnected) {
    layer = h("div", { class: "cover-layer", "aria-hidden": "true" }, h("img", { class: "cover-art", src: "/splash.svg", alt: "", decoding: "sync" }));
    document.body.append(layer);
  }
  return layer;
}

/** 시작할 때 한 번 — 숨은 층을 미리 그려 둔다 */
export function prepareCover(): void {
  ensure();
}

export function isCovered(): boolean {
  return layer?.isConnected === true && layer.classList.contains("cover");
}

export function showCover(): void {
  ensure().classList.add("cover");
}

export function hideCover(): void {
  layer?.classList.remove("cover");
}
