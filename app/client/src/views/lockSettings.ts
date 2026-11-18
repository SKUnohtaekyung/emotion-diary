// 앱 잠금 설정 `#/settings/lock` (UX_SPEC §15). 선택 기능이고 기본은 꺼짐이다.
// 켜기 → 비밀번호 정하기 화면. 끄기 → DELETE /api/app-lock — 서버가 지금 비밀번호를 요구하면(422 pin_required) 숫자판으로 받는다.
// 비밀번호가 맞는지는 서버가 정한다(D-112 ③). 이 화면은 숫자를 서버로 보내는 길만 낸다.

import { API } from "../../../shared/api";
import { enterLock, handleUnauthorized, lockNow } from "../controller";
import { type ApiResult, request } from "../lib/api";
import { h } from "../lib/dom";
import { back, navigate, type ViewContext } from "../router";
import { app, fetchSession } from "../state";
import { failureMessage } from "../ui/messages";
import { promptCurrentPin } from "../ui/pinPrompt";
import { showToast } from "../ui/toast";

/** 끄기 요청. 이미 꺼져 있으면(409) 끈 것과 같다. */
async function removeLock(currentPin?: string): Promise<ApiResult<unknown>> {
  const result = await request("DELETE", API.appLock, currentPin === undefined ? {} : { body: { currentPin } });
  if (!result.ok && result.status === 409 && result.code === "app_lock_off") {
    return { ok: true, status: 200, data: null };
  }
  return result;
}

export function renderLockSettings({ root, alive }: ViewContext): () => void {
  // 위 줄은 설정 하위 화면과 같은 ‹ 원형 버튼(시안 settings.js subHead, TASK-JOURNAL-01 J-9)
  const backButton = h("button", { type: "button", class: "back", "aria-label": "설정으로" });
  const chevron = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  chevron.setAttribute("viewBox", "0 0 24 24");
  chevron.setAttribute("aria-hidden", "true");
  const chevronPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  chevronPath.setAttribute("d", "M14.5 5.5 8 12l6.5 6.5");
  chevron.append(chevronPath);
  backButton.append(chevron);
  backButton.addEventListener("click", () => back("#/settings"));

  const labelId = "lock-switch-label";
  const toggle = h("button", { type: "button", class: "switch", role: "switch", "aria-labelledby": labelId });
  toggle.append(h("span", { class: "switch-knob", "aria-hidden": "true" }));
  const change = h("button", { type: "button", class: "btn btn-block", text: "비밀번호 바꾸기" });
  // 지금 잠그기 — 오늘 화면 아래 줄에서 옮겨 왔다(TASK-JOURNAL-01 A-10). 잠금을 켰을 때만 보인다
  const lockNowButton = h("button", { type: "button", class: "btn btn-block", text: "지금 잠그기" });
  lockNowButton.addEventListener("click", () => {
    void lockNow();
  });

  const paint = (): void => {
    toggle.setAttribute("aria-checked", String(app.appLock));
    change.disabled = !app.appLock;
    lockNowButton.hidden = !app.appLock;
  };
  paint();

  let busy = false;
  const turnOff = async (): Promise<void> => {
    busy = true;
    toggle.setAttribute("aria-disabled", "true");
    try {
      let result = await removeLock();
      if (!alive()) return;
      if (!result.ok && result.status === 422 && result.code === "pin_required") {
        const done = await promptCurrentPin((pin) => removeLock(pin), toggle);
        if (!alive() || !done) return;
        result = { ok: true, status: 200, data: null };
      }
      if (result.ok) {
        app.appLock = false;
        paint();
        showToast("잠금을 껐어요");
      } else if (result.status !== 401) {
        showToast(failureMessage(result));
      }
    } finally {
      busy = false;
      toggle.setAttribute("aria-disabled", "false");
    }
  };

  toggle.addEventListener("click", () => {
    if (busy) return;
    if (!app.appLock) navigate("#/settings/pin");
    else void turnOff();
  });
  change.addEventListener("click", () => navigate("#/settings/pin"));

  root.append(
    h(
      "section",
      { class: "screen settings-sub st-lock" },
      h("div", { class: "info-top" }, backButton),
      h("h1", { text: "앱 잠금" }),
      h("div", { class: "switch-row st-lock-switch" }, h("span", { id: labelId, text: "비밀번호로 잠그기" }), toggle),
      change,
      lockNowButton,
      h("p", { class: "note st-lock-note", text: "앱을 켤 때와 5분 넘게 떠났다 돌아올 때 비밀번호를 물어요." }),
      h("p", { class: "note st-lock-note", text: "비밀번호를 잊으면 열쇠로 다시 들어와 새로 정해요." })
    )
  );

  // 다른 기기에서 바뀌었을 수 있다 — 최신 상태로 맞춘다
  void fetchSession().then((result) => {
    if (!alive()) return;
    // 그 사이 로그인이 풀렸다 — 열쇠 화면으로
    if (result.ok && !result.data.authenticated) {
      handleUnauthorized({ already: true });
      return;
    }
    // 서버가 이 기기를 잠겼다고 보면(5분 규칙) 다음 요청을 기다리지 않고 바로 잠금 층을 올린다
    if (result.ok && result.data.authenticated && result.data.locked) {
      enterLock();
      return;
    }
    paint();
  });
  return () => {};
}
