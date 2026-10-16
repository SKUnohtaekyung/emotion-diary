// 오늘 `#/today` — 평면 첫 조각(TASK-SLICE-01 PLAN A-8, UX_SPEC §3·§11 '오늘 화면의 상태 여섯 가지').
// 숲·돌·조약돌이 없는 평면판이라 시작 조작은 큰 버튼 하나다. 상태: 로딩·오류·연결 끊김·기록 없음(+지난 날 글 줄)·이어 쓰기·기록 있음.
// 오늘 기록을 확인하지 못하면 시작을 막는다 — 확인 없이 새로 시작하면 하루 하나 규칙을 어길 수 있다(D-077 ⑧·D-083 ①).
// 앱 잠금·지금 잠그기·내보내기·모든 기록 지우기·로그아웃은 설정 화면이 생길 때까지 아래 작은 줄에 둔다.

import type { TodayInfo } from "../../../shared/diary";
import { lockNow, logout } from "../controller";
import { h } from "../lib/dom";
import { monthDay, monthDayWeekday } from "../lib/format";
import { navigate, pushFlowStep, type ViewContext } from "../router";
import { app } from "../state";
import { openSheet } from "../ui/sheet";
import { fetchToday } from "../write/api";
import { resumeKey, type StepKey, stepName, stepQuery } from "../write/flow";
import { sendUnsentInBackground, unsentForToday } from "../write/session";
import { hasUnsent } from "../write/unsent";

let flowSeq = 0;

function startFlow(date: string, step: StepKey = { step: "event", category: null }): void {
  flowSeq += 1;
  pushFlowStep(`#/write/${date}?${stepQuery(step)}`, `t${Date.now().toString(36)}${flowSeq}`);
}

export function renderToday({ root, alive }: ViewContext): () => void {
  const dateLine = h("p", { class: "today-date" });
  const title = h("h1", { text: "오늘은 어떤 마음이 머물렀나요?" });
  const area = h("div", { class: "today-state", "aria-live": "polite" });

  const lockSettings = h("button", { type: "button", class: "btn btn-quiet btn-small", text: "앱 잠금" });
  lockSettings.addEventListener("click", () => navigate("#/settings/lock"));
  const lockNowButton = app.appLock ? h("button", { type: "button", class: "btn btn-quiet btn-small", text: "지금 잠그기" }) : null;
  lockNowButton?.addEventListener("click", () => {
    void lockNow();
  });
  const exportButton = h("button", { type: "button", class: "btn btn-quiet btn-small", text: "내 기록 내보내기" });
  exportButton.addEventListener("click", () => navigate("#/settings/export"));
  const deleteButton = h("button", { type: "button", class: "btn btn-quiet btn-small", text: "모든 기록 지우기" });
  deleteButton.addEventListener("click", () => navigate("#/settings/delete"));
  const logoutButton = h("button", { type: "button", class: "btn btn-quiet btn-small", text: "로그아웃" });
  logoutButton.addEventListener("click", () => {
    const unsent = hasUnsent();
    openSheet({
      id: "logout-confirm",
      title: unsent ? "아직 보내지 못한 글이 있어요" : "로그아웃할까요?",
      body: unsent
        ? ["로그아웃하면 이 휴대폰에 남은 글이 지워져요.", "연결된 뒤 저장되면 그때 로그아웃해도 돼요."]
        : ["다시 들어올 때 열쇠가 필요해요."],
      actions: [
        { label: unsent ? "그래도 로그아웃" : "로그아웃", kind: "primary", onClick: () => logout() },
        { label: "그만두기", kind: "quiet" }
      ],
      opener: logoutButton
    });
  });

  root.append(
    h(
      "section",
      { class: "screen today" },
      dateLine,
      title,
      area,
      h("div", { class: "today-tools" }, lockSettings, lockNowButton, exportButton, deleteButton, logoutButton)
    )
  );

  const loading = (): void => {
    area.setAttribute("aria-busy", "true");
    area.replaceChildren(h("p", { class: "note", text: "오늘 기록을 확인하는 중이에요." }), h("div", { class: "skeleton-button", "aria-hidden": "true" }));
  };

  const failed = (offline: boolean): void => {
    area.removeAttribute("aria-busy");
    const retry = h("button", { type: "button", class: "btn btn-block", text: "다시 시도" });
    retry.addEventListener("click", () => void load());
    const start = h("button", { type: "button", class: "btn btn-primary btn-block", "aria-disabled": "true", text: "오늘의 마음 남기기" });
    area.replaceChildren(
      start,
      h("p", {
        class: "today-line",
        text: offline ? "연결이 끊겼어요 · 연결되면 시작할 수 있어요" : "오늘 기록을 확인하지 못했어요 · 잠시 뒤 다시 시도해 주세요"
      }),
      retry
    );
  };

  const show = (info: TodayInfo): void => {
    area.removeAttribute("aria-busy");
    dateLine.textContent = monthDayWeekday(info.date);
    const copies = unsentForToday(info);
    const nodes: HTMLElement[] = [];
    const entry = info.entry;
    if (entry?.status === "completed") {
      const open = h("button", { type: "button", class: "btn btn-primary btn-block", text: "오늘의 기록 보기" });
      open.addEventListener("click", () => navigate(`#/record/${info.date}`));
      nodes.push(open);
      // 이 휴대폰에 남은 사본(고치던 내용, 또는 다른 곳에서 완료되기 전에 쓰던 임시저장)으로 가는 길 — 열면 덮지 않고 묻는다(PR #40 리뷰)
      const copy = copies.today;
      if (copy) {
        const resume = h("button", { type: "button", class: "btn btn-block", text: "남은 글 보기" });
        resume.addEventListener("click", () => startFlow(info.date, copy.step ?? { step: "letter", category: null }));
        nodes.push(
          h("p", { class: "today-line", text: copy.mode === "edit" ? "고치던 내용이 이 휴대폰에 남아 있어요" : "이 휴대폰에 보내지 못한 글이 남아 있어요" }),
          resume
        );
      }
    } else if (entry || copies.today) {
      const key = copies.today?.step ?? resumeKey(entry?.resume) ?? { step: "event" as const, category: null };
      const resume = h("button", { type: "button", class: "btn btn-primary btn-block", text: "이어서 써요" });
      resume.addEventListener("click", () => startFlow(info.date, key));
      nodes.push(
        resume,
        h("p", {
          class: "today-chip",
          text: `${stepName(key)} 중 · ${copies.today ? "이 휴대폰에 잠시 보관 중" : "임시저장됨"}`
        })
      );
    } else {
      const start = h("button", { type: "button", class: "btn btn-primary btn-block", text: "오늘의 마음 남기기" });
      start.addEventListener("click", () => startFlow(info.date));
      nodes.push(start);
      // 지난 날 쓰던 글(D-082): 서버의 가장 최근 지난 임시저장 — 못 보낸 사본이 더 최근이면 그것
      const pastDate = [info.pastDraft?.entryDate, copies.past?.date].filter((value): value is string => Boolean(value)).sort().pop();
      if (pastDate) {
        const yesterday = new Date(`${info.date}T00:00:00Z`);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const isYesterday = yesterday.toISOString().slice(0, 10) === pastDate;
        const past = h("button", {
          type: "button",
          class: "link-row",
          text: `${isYesterday ? "어제" : `${monthDay(pastDate)}에`} 쓰던 글이 있어요 ›`
        });
        const pastKey =
          (copies.past?.date === pastDate ? copies.past.step : null) ??
          (info.pastDraft?.entryDate === pastDate ? resumeKey(info.pastDraft.resume) : null) ?? { step: "event" as const, category: null };
        past.addEventListener("click", () => startFlow(pastDate, pastKey));
        nodes.push(past);
      }
    }
    area.replaceChildren(...nodes);
  };

  const load = async (): Promise<void> => {
    loading();
    const result = await fetchToday();
    if (!alive()) return;
    if (!result.ok) {
      // 로그인 풀림(401)·잠김(423)은 처리기가 맡았다
      if (result.status !== 401 && result.status !== 423) failed(result.offline);
      return;
    }
    show(result.data);
    void sendUnsentInBackground();
  };
  void load();
  return () => {};
}
