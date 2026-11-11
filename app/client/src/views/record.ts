// 기록 보기 `#/record/<날짜>` — 편지의 읽기 모드(UX_SPEC §7). 2026-11-12 작성 흐름의 편지 카드를 그대로 쓴다(TASK-JOURNAL-01 J-5, 봉투 연출 없음).
// 부분마다 '고치기'가 그 단계로 고치기 흐름을 연다(D-100 ②). 완료 취소·지우기는 이 조각에 없다(direct-journal).
// 없는·미래 날짜는 '이 날의 편지가 없어요'(D-083 ②). 임시저장이면 이어 쓰기로 보낸다.

import type { DiaryEntryView } from "../../../shared/diary";
import { CATEGORY_CODES } from "../../../shared/taxonomy";
import { createElement } from "preact";
import { h } from "../lib/dom";
import { mountPreact } from "../lib/mount";
import { Letter } from "./write/Letter";
import { monthDay } from "../lib/format";
import { back, navigate, pushFlowStep, syncTitle, type ViewContext } from "../router";
import { fetchDiary, fetchToday } from "../write/api";
import { fromEntry, type StepKey, stepQuery } from "../write/flow";
import { readUnsent } from "../write/unsent";

let flowSeq = 0;

function editFrom(date: string, step: StepKey): void {
  flowSeq += 1;
  pushFlowStep(`#/write/${date}?${stepQuery(step)}`, `r${Date.now().toString(36)}${flowSeq}`);
}

/** 편지의 읽기 모드 — 작성 흐름과 같은 카드(Letter.tsx), 봉투 연출 없이 열린 채. 부분마다 '고치기'가 그 단계로 고치기 흐름(D-100 ②) */
function letter(entry: DiaryEntryView, today: boolean): { nodes: HTMLElement[]; unmount: () => void } {
  const host = h("div", { class: "record-letter" });
  const unmount = mountPreact(
    host,
    createElement(Letter, {
      diary: fromEntry(entry),
      date: entry.entryDate,
      day: today ? "오늘" : "그날",
      mode: "read",
      onEdit: (step: StepKey) => editFrom(entry.entryDate, step)
    })
  );
  return { nodes: [h("p", { class: "letter-sub", text: "옆으로 넘겨서 다시 읽어요." }), host], unmount };
}

export function renderRecord({ root, route, alive }: ViewContext): () => void {
  const date = route.params.date ?? "";
  // 달력의 작은 편지에서 왔으면 '달력으로' — 돌아가면 그날이 고른 채로 열린다(UX_SPEC §7, TASK-REFLECT-01 A-11)
  // 통계 친구 상세의 미리보기에서 왔으면 '통계로' — 같은 친구·같은 기간으로 돌아간다(시안 tabs.js renderRecord의 from=stats)
  const from = route.query.get("from");
  const statsCategory = route.query.get("cat");
  const fromStats = from === "stats" && statsCategory !== null && CATEGORY_CODES.includes(statsCategory);
  const fromCalendar = from === "calendar";
  const backTo = fromStats ? `#/stats/${statsCategory}?p=${route.query.get("p") === "30" ? 30 : 7}` : fromCalendar ? `#/calendar?d=${date}` : "#/today";
  const backButton = h("button", { type: "button", class: "back-button", text: fromStats ? "‹ 통계로" : fromCalendar ? "‹ 달력으로" : "‹ 오늘로" });
  backButton.addEventListener("click", () => back(backTo));
  const title = h("h1", { text: `${monthDay(date)}의 편지` });
  const area = h("div", { class: "record-body", "aria-busy": "true" }, h("p", { class: "note", text: "불러오는 중이에요." }));
  let unmountLetter = (): void => {};
  root.append(h("section", { class: "screen record" }, h("div", { class: "screen-top" }, backButton), title, area));

  const load = async (): Promise<void> => {
    area.setAttribute("aria-busy", "true");
    // 오늘의 편지면 '오늘', 지난 날이면 '그날' — 오늘은 서버가 센다(못 읽으면 '그날')
    const [result, todayResult] = await Promise.all([fetchDiary(date), fetchToday()]);
    const today = todayResult.ok ? todayResult.data.date : null;
    if (!alive()) return;
    area.removeAttribute("aria-busy");
    if (result.ok && result.data.status === "draft") {
      // 임시저장은 편지가 아니다 — 쓰던 단계로
      navigate(`#/write/${date}`, { replace: true });
      return;
    }
    if (result.ok) {
      unmountLetter();
      const shown = letter(result.data, today !== null && result.data.entryDate >= today);
      unmountLetter = shown.unmount;
      const nodes = shown.nodes;
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
  return () => unmountLetter();
}
