// DOM을 만드는 작은 도구. CSP(style-src 'self')가 style 속성을 막으므로 style은 아예 받지 않는다 —
// 모양은 CSS 파일의 클래스로, 바뀌는 값은 CSSOM(el.style.setProperty)으로만 준다.
// 글은 text(textContent)와 문자열 자식으로만 넣는다. innerHTML을 쓰지 않는다.

export type Child = Node | string | null | undefined | false;
export type Attrs = Record<string, string | boolean | null | undefined>;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === "style") throw new Error("style 속성은 CSP가 막는다. 클래스나 CSSOM을 쓴다.");
    if (key === "class") node.className = String(value);
    else if (key === "text") node.textContent = String(value);
    else node.setAttribute(key, value === true ? "" : value);
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child);
  }
  return node;
}

let announceTimer: number | undefined;

/** 화면 낭독기로 읽히는 알림. 같은 문장이 다시 와도 읽히도록 비웠다가 채운다. */
export function announce(message: string): void {
  const live = document.getElementById("live");
  if (!live) return;
  window.clearTimeout(announceTimer);
  live.textContent = "";
  announceTimer = window.setTimeout(() => {
    live.textContent = message;
  }, 30);
}

/** 이 요소와 그 아래를 누르지도 초점이 가지도 않게 한다. */
export function setInert(node: Element, on: boolean): void {
  if (on) node.setAttribute("inert", "");
  else node.removeAttribute("inert");
}

/** 층이 열려도 눌릴 수 있어야 하는 것: 읽어 주기 칸, 개발용 상태 칸(글이 없는 상태 표시뿐이다). */
export function isKeptActive(node: Element): boolean {
  return node.id === "live" || node.hasAttribute("data-keep-active") || node.tagName === "SCRIPT";
}

/** body의 직계 자식 중 층 밖의 것을 inert로 만들고, 되돌릴 목록을 돌려준다. */
export function inertOutside(layer: Element): Element[] {
  const held: Element[] = [];
  for (const child of Array.from(document.body.children)) {
    if (child === layer || isKeptActive(child) || child.hasAttribute("inert")) continue;
    setInert(child, true);
    held.push(child);
  }
  return held;
}

export function focusElement(node: HTMLElement | null | undefined): void {
  node?.focus({ preventScroll: true });
}
