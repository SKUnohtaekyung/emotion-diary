// '지금 비밀번호를 눌러 주세요' 장면. 앱 잠금을 끄거나 바꿀 때 서버가 지금 비밀번호를 요구하면(422 pin_required)
// 잠금 화면과 같은 숲 장면으로 받는다(UX_SPEC §15). 시트와 같은 층이라 밀어서 뒤로 가면 이 장면만 닫힌다.
// 맞는지는 서버가 정한다 — submit이 숫자를 본문에 실어 보내고 결과만 돌려받는다.

import type { ApiResult } from "../lib/api";
import { showPinFailure } from "./pinpad";
import { createPinScene } from "./scene";
import { closeSheet, openLayer } from "./sheet";

/** 맞아서 submit이 성공하면 true, 닫으면 false. */
export function promptCurrentPin(
  submit: (pin: string) => Promise<ApiResult<unknown>>,
  opener?: HTMLElement | null
): Promise<boolean> {
  return new Promise((resolve) => {
    let succeeded = false;
    const scene = createPinScene({
      overlay: true,
      title: "지금 비밀번호를 눌러 주세요",
      padLabel: "지금 비밀번호",
      back: {
        label: "닫기",
        onClick: () => {
          void closeSheet();
        }
      },
      onComplete: (pin) => {
        void (async () => {
          const result = await submit(pin);
          if (result.ok) {
            succeeded = true;
            await closeSheet();
            return;
          }
          // 로그인이 풀려 층이 이미 걷혔으면 더 그리지 않는다
          if (!scene.node.isConnected) return;
          showPinFailure(scene.pad, result, {
            offline: "연결되면 할 수 있어요.",
            generic: "지금은 할 수 없어요. 잠시 뒤 다시 시도해 주세요."
          });
        })();
      }
    });
    openLayer("pin-prompt", scene.node, opener, () => {
      scene.destroy();
      resolve(succeeded);
    });
    scene.pad.focus();
  });
}
