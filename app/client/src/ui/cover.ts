// 덮개(D-113 ①): 앱을 떠나는 순간 숲 색으로 화면을 덮는다 — 잠금과 상관없이 모두. 앱 전환 화면에 기록이 비치지 않게 하려는 것이다.
// 같은 이벤트 처리기 안에서 동기로 붙여야 하므로 이 모듈은 비동기 일을 하지 않는다. 덮개가 iPhone의 전환 화면 스냅샷보다
// 먼저 반영되는지는 확인하지 않았다(T-03).

import { h } from "../lib/dom";

let cover: HTMLElement | null = null;

export function isCovered(): boolean {
  return cover?.isConnected === true;
}

export function showCover(): void {
  if (isCovered()) return;
  cover = h("div", { class: "cover", "aria-hidden": "true" });
  document.body.append(cover);
}

export function hideCover(): void {
  cover?.remove();
  cover = null;
}
