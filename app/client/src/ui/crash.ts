// '문제가 생겼어요' 화면(D-113 ②, T3 A-6). 운영에서는 이 화면과 오류 번호가 전부다 — 서버로 아무것도 보내지 않는다.
// 번호는 종류 이름·파일 경로·줄·칸·빌드로 만든 짧은 해시라 같은 고장은 같은 번호가 된다.

import { APP_BUILD } from "../lib/build";
import { errorNumber, errorParts, type ErrorLike, safeBuild } from "../lib/errorInfo";
import { h } from "../lib/dom";

let crashed = false;

export function isCrashed(): boolean {
  return crashed;
}

/** 오류 번호를 만들고 화면을 이 화면으로 바꾼다. 이미 보이고 있으면 번호만 돌려준다. */
export function showCrash(error: ErrorLike, build: string = APP_BUILD): string {
  const number = errorNumber(errorParts(error), safeBuild(build));
  if (crashed) return number;
  crashed = true;
  const root = document.getElementById("app");
  if (!root) return number;
  const reopen = h("button", { type: "button", class: "btn btn-primary", text: "다시 열기" });
  reopen.addEventListener("click", () => {
    location.reload();
  });
  const title = h("h1", { tabindex: "-1", text: "문제가 생겼어요" });
  root.replaceChildren(
    h(
      "section",
      { class: "screen crash" },
      title,
      h("p", { text: `오류 번호 ${number}` }),
      h("div", { class: "screen-actions" }, reopen)
    )
  );
  document.title = "문제가 생겼어요 — 감정일기";
  title.focus({ preventScroll: true });
  return number;
}

/** 시험에서 상태를 되돌린다. */
export function resetCrashForTest(): void {
  crashed = false;
}
