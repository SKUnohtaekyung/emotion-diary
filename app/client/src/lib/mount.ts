// Preact 화면을 라우터의 View 모양((ctx) => cleanup)에 끼운다(D-127, TASK-REFLECT-01 A-4).
// 라우터는 그리기 전에 root를 비우고(replaceChildren) 그린 뒤 h1에 초점을 준다 — Preact의 render는 처음 그리기가
// 동기라 그 순서가 그대로 지켜진다. 정리 때 render(null)로 내려 효과(useEffect)의 정리 함수까지 돌린다.

import { type ComponentChild, render } from "preact";

export function mountPreact(root: HTMLElement, node: ComponentChild): () => void {
  render(node, root);
  return () => render(null, root);
}
