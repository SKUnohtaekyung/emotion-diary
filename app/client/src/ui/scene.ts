// 숲 장면 한 장: 숲 색 바탕 위에 제목·작은 글·숫자판을 둔다(UX_SPEC §15). 잠금 층, 지금 비밀번호 장면(overlay)과
// 비밀번호 정하기 화면(화면 안)이 같이 쓴다 — 정할 때 본 화면이 매일 풀 때 보는 화면과 같아야 손과 눈이 그대로 옮겨 간다.
// 장면 그림은 없다(T3 A-11) — 숲 색 단색이다.

import { h } from "../lib/dom";
import { createPinPad, type PinPad } from "./pinpad";

export interface PinSceneOptions {
  /** overlay면 제목이 h2이고 대화 상자(role="dialog")다. 화면 안이면 h1이다. */
  overlay: boolean;
  title: string;
  note?: string;
  padLabel: string;
  onComplete: (pin: string) => void;
  back?: { label: string; onClick: () => void };
  footer?: Node;
}

export interface PinScene {
  node: HTMLElement;
  pad: PinPad;
  setText(title: string, note?: string): void;
  destroy(): void;
}

let sequence = 0;

export function createPinScene(options: PinSceneOptions): PinScene {
  sequence += 1;
  const titleId = `scene-title-${sequence}`;
  const title = h(options.overlay ? "h2" : "h1", {
    id: titleId,
    class: "scene-title",
    tabindex: "-1",
    text: options.title
  });
  const note = h("p", { class: "scene-note", text: options.note ?? "" });
  const pad = createPinPad({ label: options.padLabel, onComplete: options.onComplete });

  const top = h("div", { class: "scene-top" });
  if (options.back) {
    const back = h("button", { type: "button", class: "scene-back", text: `‹ ${options.back.label}` });
    back.addEventListener("click", options.back.onClick);
    top.append(back);
  }

  const inner = h(
    "div",
    { class: "scene-inner" },
    top,
    h("div", { class: "scene-head" }, title, note),
    pad.node,
    options.footer ? h("div", { class: "scene-foot" }, options.footer) : null
  );
  const node = h("div", {
    class: `scene${options.overlay ? " scene-overlay" : ""}`,
    ...(options.overlay ? { role: "dialog", "aria-modal": "true", "aria-labelledby": titleId } : {})
  });
  node.append(inner);

  // 키보드 숫자는 초점이 장면 안 어디에 있든 받는다. 장면이 가려졌거나(inert) 시트가 위에 있으면 받지 않는다.
  const onDocKey = (event: KeyboardEvent): void => {
    if (!node.isConnected) {
      document.removeEventListener("keydown", onDocKey);
      return;
    }
    if (node.closest("[inert]")) return;
    if (event.target instanceof Element && event.target.closest(".sheet-layer")) return;
    pad.onKey(event);
  };
  document.addEventListener("keydown", onDocKey);

  return {
    node,
    pad,
    setText(nextTitle, nextNote = "") {
      title.textContent = nextTitle;
      note.textContent = nextNote;
    },
    destroy() {
      document.removeEventListener("keydown", onDocKey);
      pad.destroy();
    }
  };
}
