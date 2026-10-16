// 시트와 같은 종류의 층(확인 시트, 지금 비밀번호 장면). UX_SPEC §17 규칙 4: 시트가 열려 있을 때 밀면 시트만 닫힌다.
// 시안에는 없던 잠정 결정이라 여기서 처음 만든다 — 열 때 같은 주소로 pushState 한 칸, 닫을 때 history.back(),
// popstate에서 시트가 열려 있으면 시트만 닫고 화면은 그대로 둔다. 실기기 확인은 T-06이다.
// 한 번에 하나만 열린다. 층 밖은 inert(초점·누름 없음)이고 닫으면 연 버튼으로 초점이 돌아간다.

import { focusElement, h, inertOutside, setInert } from "../lib/dom";

export interface SheetAction {
  label: string;
  kind?: "primary" | "quiet";
  /** 시트가 닫힌 다음에 부른다. 없으면 닫기만 한다. */
  onClick?: () => void | Promise<void>;
}

export interface SheetOptions {
  id: string;
  title: string;
  body?: string[];
  actions: SheetAction[];
  /** 닫으면 초점을 돌려줄 요소 */
  opener?: HTMLElement | null;
  /** 어떤 길로 닫혔든(버튼·밀기·덮기) 닫힌 뒤에 한 번 부른다 */
  onClosed?: () => void;
}

interface Layer {
  node: HTMLElement;
  held: Element[];
  opener: HTMLElement | null;
  onClosed: (() => void) | undefined;
}

let current: Layer | null = null;
let closing: Promise<void> | null = null;
let waiters: Array<() => void> = [];
/** 잠금처럼 위에서 덮을 때 조용히 닫은 층의 history.back()이 돌아오기를 기다리는 수와, 그때 부를 콜백 */
const silent: Array<(() => void) | undefined> = [];
let sequence = 0;
let keyBound = false;

function detach(layer: Layer): void {
  layer.node.remove();
  for (const node of layer.held) setInert(node, false);
}

function finish(layer: Layer): void {
  detach(layer);
  current = null;
  closing = null;
  if (layer.opener?.isConnected) focusElement(layer.opener);
  for (const resolve of waiters.splice(0)) resolve();
  layer.onClosed?.();
}

function bindEscape(): void {
  if (keyBound) return;
  keyBound = true;
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && current) {
      event.preventDefault();
      void closeSheet();
    }
  });
}

/** 이미 만든 층을 연다. 열려 있는 층이 있으면 기록 칸은 그대로 두고 내용만 바꾼다. */
export function openLayer(id: string, node: HTMLElement, opener?: HTMLElement | null, onClosed?: () => void): void {
  bindEscape();
  const previousOpener = current?.opener ?? null;
  if (current) detach(current);
  else history.pushState({ sheet: id }, "", location.href);
  document.body.append(node);
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  current = {
    node,
    held: inertOutside(node),
    opener: opener ?? previousOpener ?? (active && active !== document.body ? active : null),
    onClosed
  };
  closing = null;
  focusElement(node.querySelector<HTMLElement>("button, [tabindex]"));
}

export function openSheet(options: SheetOptions): void {
  sequence += 1;
  const titleId = `sheet-title-${sequence}`;
  const buttons = options.actions.map((action) => {
    const button = h("button", {
      type: "button",
      class: `btn ${action.kind === "primary" ? "btn-primary" : "btn-quiet"}`,
      text: action.label
    });
    button.addEventListener("click", () => {
      void (async () => {
        await closeSheet();
        await action.onClick?.();
      })();
    });
    return button;
  });
  const panel = h(
    "div",
    { class: "sheet", role: "dialog", "aria-modal": "true", "aria-labelledby": titleId },
    h("h2", { id: titleId, class: "sheet-title", text: options.title }),
    ...(options.body ?? []).map((line) => h("p", { class: "sheet-body", text: line })),
    h("div", { class: "sheet-actions" }, ...buttons)
  );
  const layer = h("div", { class: "sheet-layer", "data-sheet": options.id }, panel);
  layer.addEventListener("click", (event) => {
    if (event.target === layer) void closeSheet();
  });
  openLayer(options.id, layer, options.opener, options.onClosed);
}

export function isSheetOpen(): boolean {
  return current !== null;
}

/** 닫는다. 기록 한 칸을 되돌리고(history.back), popstate가 오면 닫힌 것이다. */
export function closeSheet(): Promise<void> {
  if (!current) return Promise.resolve();
  if (closing) return closing;
  closing = new Promise<void>((resolve) => {
    waiters.push(resolve);
  });
  history.back();
  return closing;
}

/** 라우터의 popstate 처리기가 먼저 묻는다. 시트를 닫았거나 조용히 닫은 층의 되돌림이면 참 — 화면은 다시 그리지 않는다. */
export function consumeSheetPop(): boolean {
  if (current) {
    finish(current);
    return true;
  }
  if (silent.length > 0) {
    silent.shift()?.();
    return true;
  }
  return false;
}

/** 잠금 층이 위에 올라올 때: 화면에서는 바로 치우고, 기록 한 칸은 되돌린다(콜백은 되돌림이 온 뒤). */
export function closeLayerSilently(): void {
  if (!current) return;
  const layer = current;
  detach(layer);
  current = null;
  closing = null;
  for (const resolve of waiters.splice(0)) resolve();
  silent.push(layer.onClosed);
  history.back();
}

/** 시험에서 상태를 비운다. */
export function resetSheetsForTest(): void {
  current?.node.remove();
  current = null;
  closing = null;
  waiters = [];
  silent.length = 0;
}
