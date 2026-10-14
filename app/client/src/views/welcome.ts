// 반가워요 `#/welcome` (UX_SPEC §15·§16). 앱 잠금을 고르는 자리: 조용한 `비밀번호로 잠그고 시작하기`가 주 버튼 위에 있다.
// 지나가면 기록에서 사라진다 — 오늘로 갈 때는 바꿔치우고, 비밀번호를 정하러 갔다 오면 이 화면째 오늘로 바꿔친다.

import { ensureName, app } from "../state";
import { h } from "../lib/dom";
import { navigate, syncTitle, type ViewContext } from "../router";

export function renderWelcome({ root, alive }: ViewContext): () => void {
  const title = h("h1", { text: app.name ? `반가워요, ${app.name}님` : "반가워요" });
  const lockButton = h("button", { type: "button", class: "btn btn-quiet btn-block", text: "비밀번호로 잠그고 시작하기" });
  const startButton = h("button", { type: "button", class: "btn btn-primary btn-block", text: "오늘 시작하기" });
  lockButton.addEventListener("click", () => {
    navigate("#/settings/pin?from=welcome");
  });
  startButton.addEventListener("click", () => {
    navigate("#/today", { replace: true });
  });
  root.append(h("section", { class: "screen" }, title, h("div", { class: "screen-actions" }, lockButton, startButton)));

  if (!app.name) {
    void ensureName().then((name) => {
      if (!alive() || !name) return;
      title.textContent = `반가워요, ${name}님`;
      syncTitle();
    });
  }
  return () => {};
}
