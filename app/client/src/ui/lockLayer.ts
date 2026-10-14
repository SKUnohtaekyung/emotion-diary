// 잠금 층(UX_SPEC §15). 주소가 아니라 화면 위에 덮는 층이다 — 뒤로 가기나 주소 입력으로 돌아 들어올 수 없다.
// 층 밖의 모든 것은 inert이고, 층 아래에는 기록 내용을 그리지 않는다(#app을 가린다). 열려 있던 시트·토스트는 닫는다.
// 비밀번호가 맞는지는 서버가 정한다: 네 자리를 누르면 POST /api/app-lock/unlock. 숫자는 요청 본문으로만 보낸다.

import { API } from "../../../shared/api";
import { request } from "../lib/api";
import { h, inertOutside, setInert } from "../lib/dom";
import { showPinFailure } from "./pinpad";
import { createPinScene, type PinScene } from "./scene";
import { closeLayerSilently, openSheet } from "./sheet";
import { clearToasts } from "./toast";

export interface LockLayerCallbacks {
  /** 서버가 풀어 주었다. 층은 이미 걷혔다. */
  onUnlocked: () => void;
  /** '다시 로그인하기'를 눌렀다 */
  onForgot: () => void;
}

interface Active {
  node: HTMLElement;
  scene: PinScene;
  held: Element[];
}

let active: Active | null = null;

export function isLockLayerShown(): boolean {
  return active !== null;
}

export function showLockLayer(callbacks: LockLayerCallbacks): void {
  if (active) return;
  // 잠그기 전에 열려 있던 시트·알림은 닫는다 — 층 위로 비쳐 눌리지 않게
  closeLayerSilently();
  clearToasts();

  const forgot = h("button", { type: "button", class: "scene-link", text: "비밀번호를 잊었어요" });
  const scene = createPinScene({
    overlay: true,
    title: "비밀번호를 눌러 주세요",
    padLabel: "잠금 비밀번호",
    footer: forgot,
    onComplete: (pin) => {
      void unlock(pin, scene, callbacks);
    }
  });
  forgot.addEventListener("click", () => {
    openSheet({
      id: "forgot-pin",
      title: "비밀번호를 잊었나요?",
      body: ["다시 로그인하면 새 비밀번호를 정할 수 있어요. 기록은 그대로 있어요."],
      actions: [
        { label: "다시 로그인하기", kind: "primary", onClick: callbacks.onForgot },
        { label: "닫기", kind: "quiet" }
      ],
      opener: forgot
    });
  });

  scene.node.id = "lock-layer";
  document.body.append(scene.node);
  active = { node: scene.node, scene, held: inertOutside(scene.node) };
  // 층 아래 화면은 그리지 않는다
  document.getElementById("app")?.classList.add("is-covered");
  scene.pad.focus();
}

export function hideLockLayer(): void {
  if (!active) return;
  const layer = active;
  active = null;
  layer.scene.destroy();
  layer.node.remove();
  for (const node of layer.held) setInert(node, false);
  document.getElementById("app")?.classList.remove("is-covered");
}

async function unlock(pin: string, scene: PinScene, callbacks: LockLayerCallbacks): Promise<void> {
  const result = await request("POST", API.unlock, { body: { pin } });
  if (!active) return; // 그 사이 로그인이 풀려 층이 걷혔다
  if (result.ok || (result.status === 409 && result.code === "app_lock_off")) {
    hideLockLayer();
    callbacks.onUnlocked();
    return;
  }
  showPinFailure(scene.pad, result, {
    offline: "연결되면 열 수 있어요.",
    generic: "지금은 열 수 없어요. 잠시 뒤 다시 시도해 주세요."
  });
}
