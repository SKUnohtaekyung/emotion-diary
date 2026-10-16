// 비밀번호 정하기 `#/settings/pin` (UX_SPEC §15). 잠금 화면과 같은 숲 장면이다 — 정할 때 본 화면이 매일 풀 때 보는 화면과 같다.
// 네 자리를 두 번 눌러 같으면 PUT /api/app-lock. 이미 걸려 있고 열쇠 로그인 10분이 지났으면 서버가 지금 비밀번호를 요구한다(422 pin_required).
// 변형 `?from=welcome`(반가워요에서) · `?from=forgot`(비밀번호를 잊고 열쇠로 다시 들어온 직후).
// 처음 누른 숫자는 한 번 더 누르는 동안만 이 함수 안의 변수에 있고, 정하면 비운다. 저장소·로그에 두지 않는다.

import { API } from "../../../shared/api";
import { request } from "../lib/api";
import { announce } from "../lib/dom";
import { parseHash } from "../lib/routes";
import { back, backThenReplace, navigate, type ViewContext } from "../router";
import { app } from "../state";
import { failureMessage } from "../ui/messages";
import { promptCurrentPin } from "../ui/pinPrompt";
import { createPinScene } from "../ui/scene";
import { showToast } from "../ui/toast";

/** 비밀번호를 잊고 들어와 정하지 않고 나갔는데 서버가 끄기를 거절했을 때(열쇠 로그인 10분이 지남). 할 수 있는 길만 말한다(UX_SPEC §6.1). */
export const PIN_FORGOT_OFF_FAILED = "잠금을 끄지 못했어요. 다음에 비밀번호를 물으면 '비밀번호를 잊었어요'로 다시 들어와 주세요.";

export const PIN_TEXT = {
  firstTitle: "비밀번호 네 자리를 정해요",
  firstNote: "앱을 켤 때와 잠시 떠났다 돌아올 때 물어요.",
  confirmTitle: "한 번 더 눌러 주세요",
  confirmNote: "같은 숫자를 눌러 확인해요.",
  mismatch: "두 번이 서로 달라요. 처음부터 다시 정해요.",
  set: "잠금을 걸었어요",
  changed: "비밀번호를 바꿨어요"
} as const;

export function renderPinSetup({ root, route, alive }: ViewContext): () => void {
  const from = route.query.get("from");
  // 이미 걸려 있으면 바꾸는 것이다
  const changing = app.appLock;
  let first = "";
  let phase: "first" | "confirm" = "first";
  let finished = false;

  // 비밀번호를 잊어 들어온 사람이 정하지 않고 떠나면 잠금을 끈다(본인 확인은 끝났다 — UX_SPEC §15).
  // ‹로 나가든 밀어서 나가든 같도록 화면을 떠나는 자리에서 처리한다.
  const leave = (): void => {
    if (from === "forgot") navigate("#/today", { replace: true });
    else back(from === "welcome" ? "#/welcome" : "#/settings/lock");
  };

  const restart = (message: string, shake: boolean): void => {
    first = "";
    phase = "first";
    scene.setText(PIN_TEXT.firstTitle, PIN_TEXT.firstNote);
    scene.pad.reset(message, { shake });
  };

  const succeed = (): void => {
    finished = true;
    first = "";
    app.appLock = true;
    app.locked = false;
    showToast(changing ? PIN_TEXT.changed : PIN_TEXT.set);
    if (from === "welcome") backThenReplace("#/today");
    else if (from === "forgot") navigate("#/today", { replace: true });
    else back("#/settings/lock");
  };

  const save = async (pin: string): Promise<void> => {
    let result = await request("PUT", API.appLock, { body: { pin } });
    if (!alive()) return;
    if (!result.ok && result.status === 422 && result.code === "pin_required") {
      const done = await promptCurrentPin((currentPin) => request("PUT", API.appLock, { body: { pin, currentPin } }));
      if (!alive()) return;
      if (!done) {
        restart("", false);
        return;
      }
      result = { ok: true, status: 200, data: null };
    }
    if (result.ok) {
      succeed();
    } else if (result.status !== 401) {
      restart(failureMessage(result), false);
    }
  };

  const onPin = (pin: string): void => {
    if (phase === "first") {
      first = pin;
      phase = "confirm";
      scene.setText(PIN_TEXT.confirmTitle, PIN_TEXT.confirmNote);
      scene.pad.reset();
      announce(PIN_TEXT.confirmTitle);
      return;
    }
    if (pin !== first) {
      restart(PIN_TEXT.mismatch, true);
      return;
    }
    void save(pin);
  };

  const scene = createPinScene({
    overlay: false,
    title: PIN_TEXT.firstTitle,
    note: PIN_TEXT.firstNote,
    padLabel: "새 비밀번호",
    back: { label: "뒤로", onClick: leave },
    onComplete: onPin
  });
  root.append(scene.node);

  return () => {
    scene.destroy();
    // 같은 화면을 다시 그리는 것(잠금을 풀고 돌아온 뒤 등)은 떠나는 것이 아니다
    const stillHere = parseHash(location.hash).path === "settings/pin";
    if (from === "forgot" && !finished && !stillHere) {
      // 정하지 않고 나가면 잠금을 끈다(UX_SPEC §15). 열쇠 로그인 10분이 지났으면 서버가 지금 비밀번호를 요구해 끄지 못한다 —
      // 조용히 넘기지 않고, 지금 할 수 있는 길(다음에 물으면 '잊었어요'로 다시 들어오기)을 알린다.
      void request("DELETE", API.appLock).then((result) => {
        if (result.ok || (result.status === 409 && result.code === "app_lock_off")) app.appLock = false;
        else if (result.status !== 401 && result.status !== 423) showToast(PIN_FORGOT_OFF_FAILED);
      });
    }
  };
}
