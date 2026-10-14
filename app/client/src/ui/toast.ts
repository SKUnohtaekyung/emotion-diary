// 잠깐 떴다 사라지는 알림. 낭독기에는 #live 칸으로 따로 읽어 주므로 이 요소는 화면에만 있다(aria-hidden).

import { announce, h } from "../lib/dom";

const SHOW_MS = 3200;
let timer: number | undefined;

export function clearToasts(): void {
  window.clearTimeout(timer);
  for (const node of Array.from(document.querySelectorAll(".toast"))) node.remove();
}

export function showToast(message: string): void {
  clearToasts();
  const node = h("div", { class: "toast", "aria-hidden": "true", text: message });
  document.body.append(node);
  announce(message);
  timer = window.setTimeout(() => node.remove(), SHOW_MS);
}
