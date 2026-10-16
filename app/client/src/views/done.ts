// 완료 `#/done/<날짜>` — 평면판(UX_SPEC §4 9번, TASK-SLICE-01 PLAN A-7). 짧은 사실 문장 하나와 버튼 둘.
// 칭찬·성장·연속 기록 문구를 쓰지 않는다. 달력·통계가 아직 없어 그 두 버튼(D-078) 대신 기록 보기·오늘로 돌아가기다(UX 라이팅 원칙 8).
// 지난 날의 글을 마무리했으면 작성 흐름이 `?day=past`를 붙인다 — '그날'로 말한다.

import { announce, h } from "../lib/dom";
import { navigate, type ViewContext } from "../router";

export function renderDone({ root, route }: ViewContext): () => void {
  const date = route.params.date ?? "";
  const day = route.query.get("day") === "past" ? "그날" : "오늘";
  const message = `${day}의 마음을 남겼어요`;
  const record = h("button", { type: "button", class: "btn btn-primary btn-block", text: `${day}의 기록 보기` });
  record.addEventListener("click", () => navigate(`#/record/${date}`));
  const today = h("button", { type: "button", class: "btn btn-quiet btn-block", text: "오늘로 돌아가기" });
  today.addEventListener("click", () => navigate("#/today", { replace: true }));
  root.append(h("section", { class: "screen done" }, h("h1", { text: message }), h("div", { class: "screen-actions" }, record, today)));
  announce(message);
  return () => {};
}
