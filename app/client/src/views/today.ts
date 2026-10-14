// 오늘 자리표시 `#/today`. 이 뼈대가 제대로 서 있는지 눈으로 확인하는 화면이다 — 기록 기능은 없다(Phase 2).
// 연습 칸의 글은 메모리(practice)에만 둔다. 저장소·서버·개발용 상태 칸 어디에도 보내지 않는다.
// 화면 아래에 고정한 버튼 줄은 자판이 올라왔을 때 가려지는지(S-07)를 보려는 것이다.

import { lockNow, logout } from "../controller";
import { h } from "../lib/dom";
import { navigate, type ViewContext } from "../router";
import { app, ensureName, practice } from "../state";
import { openSheet } from "../ui/sheet";
import { showToast } from "../ui/toast";

function nameLine(name: string | null): string {
  return name ? `들어와 있어요. ${name}님의 기록 공간이에요.` : "들어와 있어요.";
}

export function renderToday({ root, alive }: ViewContext): () => void {
  const line = h("p", { class: "lede", text: nameLine(app.name) });
  const practiceBox = h("textarea", {
    id: "practice",
    class: "input textarea",
    rows: "5",
    "aria-describedby": "practice-help"
  });
  practiceBox.value = practice.text;
  practiceBox.addEventListener("input", () => {
    practice.text = practiceBox.value;
  });

  const lockSettings = h("button", { type: "button", class: "btn btn-block", text: "앱 잠금" });
  lockSettings.addEventListener("click", () => navigate("#/settings/lock"));

  const lockNowButton = app.appLock ? h("button", { type: "button", class: "btn btn-block", text: "지금 잠그기" }) : null;
  lockNowButton?.addEventListener("click", () => {
    void lockNow();
  });

  const sheetButton = h("button", { type: "button", class: "btn btn-block", text: "시트 열기" });
  sheetButton.addEventListener("click", () => {
    openSheet({
      id: "empty-check",
      title: "빈 시트",
      body: ["뒤로 밀면 이 시트만 닫혀요."],
      actions: [{ label: "닫기", kind: "quiet" }],
      opener: sheetButton
    });
  });

  const logoutButton = h("button", { type: "button", class: "btn btn-block", text: "로그아웃" });
  logoutButton.addEventListener("click", () => {
    openSheet({
      id: "logout-confirm",
      title: "로그아웃할까요?",
      body: ["다시 들어올 때 열쇠가 필요해요."],
      actions: [
        { label: "로그아웃", kind: "primary", onClick: () => logout() },
        { label: "닫기", kind: "quiet" }
      ],
      opener: logoutButton
    });
  });

  const practiceButton = h("button", { type: "button", class: "btn btn-primary btn-block", text: "연습 버튼" });
  practiceButton.addEventListener("click", () => showToast("눌렀어요"));

  root.append(
    h(
      "section",
      { class: "screen today" },
      h("h1", { text: "오늘" }),
      line,
      h("p", { class: "note", text: "이 화면은 앱 뼈대를 확인하는 자리예요." }),
      h(
        "div",
        { class: "field" },
        h("label", { for: "practice", text: "연습 칸" }),
        practiceBox,
        h("p", { class: "help", id: "practice-help", text: "여기에 적은 글은 어디에도 보내지 않아요." })
      ),
      h("div", { class: "button-list" }, lockSettings, lockNowButton, sheetButton, logoutButton)
    ),
    h("div", { class: "bottom-bar" }, h("div", { class: "bottom-bar-inner" }, practiceButton))
  );

  // 이름은 새로 열린 뒤에는 서버에서 다시 받는다
  if (!app.name) {
    void ensureName().then((name) => {
      if (!alive()) return;
      line.textContent = nameLine(name);
    });
  }
  return () => {};
}
