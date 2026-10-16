// 기록 보기 `#/record/<날짜>` — 편지의 읽기 모드, 평면판(UX_SPEC §7, TASK-SLICE-01 사용자 결정 U-3).
// 부분마다 '고치기'가 그 단계로 고치기 흐름을 연다(D-100 ②). 완료 취소·지우기는 이 조각에 없다(direct-journal).
// 없는·미래 날짜는 '이 날의 편지가 없어요'(D-083 ②). 임시저장이면 이어 쓰기로 보낸다.

import type { DiaryEntryView } from "../../../shared/diary";
import { h } from "../lib/dom";
import { monthDay } from "../lib/format";
import { back, navigate, pushFlowStep, syncTitle, type ViewContext } from "../router";
import { fetchDiary } from "../write/api";
import { categoryLabel, emotionLabel, fromEntry, type StepKey, stepQuery } from "../write/flow";
import { readUnsent } from "../write/unsent";

let flowSeq = 0;

function editFrom(date: string, step: StepKey): void {
  flowSeq += 1;
  pushFlowStep(`#/write/${date}?${stepQuery(step)}`, `r${Date.now().toString(36)}${flowSeq}`);
}

function letter(entry: DiaryEntryView): HTMLElement[] {
  const diary = fromEntry(entry);
  const edit = (label: string, step: StepKey) => {
    const button = h("button", { type: "button", class: "btn btn-quiet btn-small", text: "고치기", "aria-label": `${label} 고치기` });
    button.addEventListener("click", () => editFrom(entry.entryDate, step));
    return button;
  };
  const cards: HTMLElement[] = [];
  for (const category of diary.categories) {
    const label = categoryLabel(category.code);
    cards.push(
      h(
        "section",
        { class: "letter-card", "data-category": category.code },
        h("div", { class: "letter-head" }, h("h2", {}, h("span", { class: "choice-mark", "aria-hidden": "true" }), label), edit(label, { step: "details", category: category.code })),
        h("p", { class: "letter-size", text: `크기 ${category.intensity ?? "–"}` }),
        h(
          "ul",
          { class: "letter-pills" },
          ...diary.emotions
            .filter((item) => item.category === category.code)
            .map((item) => h("li", { text: item.own !== null ? `${emotionLabel(item.code)} (크기 ${item.own})` : emotionLabel(item.code) }))
        )
      )
    );
  }
  const text = (heading: string, value: string, step: StepKey) =>
    h(
      "section",
      { class: "letter-card" },
      h("div", { class: "letter-head" }, h("h2", { text: heading }), edit(heading, step)),
      h("p", { class: "letter-text", text: value })
    );
  cards.push(text("있었던 일", diary.eventText, { step: "event", category: null }), text("이유", diary.reasonText, { step: "reason", category: null }));
  for (const [kind, heading, step] of [
    ["praises", "칭찬", "praise"],
    ["gratitudes", "감사", "gratitude"]
  ] as const) {
    const filled = diary[kind].filter((value) => value.trim() !== "");
    if (!filled.length) continue;
    cards.push(
      h(
        "section",
        { class: "letter-card" },
        h("div", { class: "letter-head" }, h("h2", { text: heading }), edit(heading, { step, category: null })),
        h("ul", { class: "letter-list" }, ...filled.map((value) => h("li", { text: value })))
      )
    );
  }
  return cards;
}

export function renderRecord({ root, route, alive }: ViewContext): () => void {
  const date = route.params.date ?? "";
  const backButton = h("button", { type: "button", class: "back-button", text: "‹ 오늘로" });
  backButton.addEventListener("click", () => back("#/today"));
  const title = h("h1", { text: `${monthDay(date)}의 편지` });
  const area = h("div", { class: "record-body", "aria-busy": "true" }, h("p", { class: "note", text: "불러오는 중이에요." }));
  root.append(h("section", { class: "screen record" }, h("div", { class: "screen-top" }, backButton), title, area));

  const load = async (): Promise<void> => {
    area.setAttribute("aria-busy", "true");
    const result = await fetchDiary(date);
    if (!alive()) return;
    area.removeAttribute("aria-busy");
    if (result.ok && result.data.status === "draft") {
      // 임시저장은 편지가 아니다 — 쓰던 단계로
      navigate(`#/write/${date}`, { replace: true });
      return;
    }
    if (result.ok) {
      const nodes = letter(result.data);
      // 이 휴대폰에 남은 사본 — 고치던 내용이든, 다른 곳에서 완료되기 전에 쓰던 임시저장이든 — 으로 가는 길(PR #40 리뷰).
      // 들어가면 흐름이 서버 기록과 비교해 덮지 않고 묻는다.
      const copy = readUnsent(date);
      if (copy) {
        const resume = h("button", { type: "button", class: "btn btn-block", text: "남은 글 보기" });
        resume.addEventListener("click", () => editFrom(date, copy.step ?? { step: "letter", category: null }));
        nodes.unshift(
          h("p", { class: "today-line", text: copy.mode === "edit" ? "고치던 내용이 이 휴대폰에 남아 있어요" : "이 휴대폰에 보내지 못한 글이 남아 있어요" }),
          resume
        );
      }
      area.replaceChildren(...nodes);
      return;
    }
    if (result.status === 404) {
      const toToday = h("button", { type: "button", class: "btn btn-block", text: "오늘로 돌아가기" });
      toToday.addEventListener("click", () => navigate("#/today", { replace: true }));
      title.textContent = "이 날의 편지가 없어요";
      syncTitle();
      area.replaceChildren(h("p", { text: `${monthDay(date)}에 남긴 기록이 없어요.` }), toToday);
      return;
    }
    if (result.status === 401 || result.status === 423) return;
    const retry = h("button", { type: "button", class: "btn btn-block", text: "다시 시도" });
    retry.addEventListener("click", () => void load());
    area.replaceChildren(h("p", { text: result.offline ? "연결이 끊겼어요 · 연결되면 볼 수 있어요" : "불러오지 못했어요 · 잠시 뒤 다시 시도해 주세요" }), retry);
  };
  void load();
  return () => {};
}
