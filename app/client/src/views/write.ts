// 작성 흐름 `#/write/<날짜>?step=…` — 평면 첫 조각(TASK-SLICE-01). 단계형 하나(UX_SPEC §4), 연출 없음(D-116).
// 사건 → 마음 고르기 → 고른 마음마다 세부 감정 → 크기 → 이유 → 칭찬 → 감사 → 편지(검토) → 완료.
// - 버튼은 내용이 끝나는 바로 아래 한 줄(사용자 결정 U-1) — 화면 아래에 고정하지 않는다(자판이 가린다, S-07).
// - 단계를 옮길 때마다 기록 칸을 쌓는다(router.pushFlowStep). 뒤로 밀기 = 그 단계의 '이전'. 떠날 때 되감는다(leaveFlow).
// - 글은 입력이 멈출 때마다 서버에, 못 보낸 동안은 기기 사본에(write/saver·unsent). 완료한 기록을 고칠 때는 '저장하기'에서만 보낸다.
// 이 화면은 단계를 옮길 때마다 다시 그려진다. 흐름의 상태는 write/session이 날짜별로 든다.

import type { MissingStep } from "../../../shared/diary";
import { EVENT_MAX_CHARS, REASON_MAX_CHARS, REFLECTION_MAX_CHARS } from "../../../shared/diary";
import { announce, focusElement, h } from "../lib/dom";
import { monthDay } from "../lib/format";
import { currentFlow, leaveFlow, navigate, pushFlowStep, syncTitle, type ViewContext } from "../router";
import { openSheet } from "../ui/sheet";
import { showToast } from "../ui/toast";
import { intensityControl } from "../ui/intensity";
import { completeDiaryRequest, deleteDiaryRequest, fetchToday, newRequestKey } from "../write/api";
import {
  BLOCKED_TEXT,
  blocked,
  CATEGORY_BY_CODE,
  categoryLabel,
  effectiveIntensity,
  emotionLabel,
  firstMissingKey,
  indexOf,
  MISSING_TEXT,
  missing,
  parseStepQuery,
  removeCategory,
  resumeIndex,
  SECTION_TEXT,
  type Step,
  type StepKey,
  sameKey,
  setCategoryIntensity,
  setEmotionIntensity,
  stepQuery,
  steps,
  toggleCategory,
  toggleEmotion,
  unsetCategories,
  withReflection,
  withText,
  type WorkingDiary
} from "../write/flow";
import { isSendingBlocked, type SaveStatus } from "../write/saver";
import {
  closeSession,
  currentSession,
  dropSession,
  type FlowSession,
  keepMine,
  loadConflict,
  openSession,
  takeServer
} from "../write/session";
import { CATEGORIES } from "../../../shared/taxonomy";

const writeHash = (date: string, key: StepKey) => `#/write/${date}?${stepQuery(key)}`;

/** 흐름 번호는 기록 칸에 실린 것을 이어 쓴다(오늘·기록 보기가 흐름에 들어갈 때 붙였다) — 세션 번호가 아니라. 깊이가 이어져야 떠날 때 다 되감는다. */
const flowIdOf = (session: FlowSession): string => currentFlow()?.id ?? session.id;

/** 완료 요청의 영수증 열쇠 — 닿지 않아 다시 누르면 같은 열쇠(날짜별). */
const completeKeys = new Map<string, string>();
const deleteKeys = new Map<string, string>();

function dayWord(session: FlowSession): "오늘" | "그날" {
  return session.date < session.today ? "그날" : "오늘";
}

function saveText(status: SaveStatus, mode: FlowSession["mode"]): string {
  switch (status.state) {
    case "pending":
    case "saving":
      return "저장 중…";
    case "saved":
      // UX_SPEC §4 '저장됨 · 방금' — 1분이 지나면 '방금'을 뗀다(화면이 다시 칠한다)
      return status.savedAt !== null && Date.now() - status.savedAt < 60_000 ? "저장됨 · 방금" : "저장됨";
    case "offline":
      return "아직 저장 안 됨 · 연결되면 저장해요";
    case "failed":
      return "저장 실패";
    case "conflict":
      return "다른 곳에서 고친 내용이 있어요";
    case "held":
      return isSendingBlocked() ? "아직 저장 안 됨 · 새로 고치면 저장해요" : "아직 저장 안 됨 · 다시 들어오면 저장해요";
    case "editing":
      return mode === "edit" ? "고친 내용은 '저장하기'를 누르면 남아요" : "";
    default:
      return "";
  }
}

export function renderWrite(context: ViewContext): () => void {
  const date = context.route.params.date ?? "";
  const open = currentSession(date);
  if (open) return drawStep(context, open);

  const title = h("h1", { text: "쓰던 글을 여는 중이에요" });
  context.root.setAttribute("aria-busy", "true");
  context.root.append(h("section", { class: "screen write" }, title, h("p", { class: "note", text: "잠시만 기다려 주세요." })));
  let cleanup: () => void = () => {};
  void openSession(date).then((result) => {
    if (!context.alive()) return;
    context.root.removeAttribute("aria-busy");
    if (result.kind === "ready") {
      context.root.replaceChildren();
      cleanup = drawStep(context, result.session);
      syncTitle();
      focusElement(context.root.querySelector("h1"));
      return;
    }
    context.root.replaceChildren();
    if (result.kind === "not_found") {
      const toToday = h("button", { type: "button", class: "btn btn-primary btn-block", text: "오늘로 돌아가기" });
      toToday.addEventListener("click", () => navigate("#/today", { replace: true }));
      context.root.append(
        h(
          "section",
          { class: "screen" },
          h("h1", { tabindex: "-1", text: "이 날의 글이 없어요" }),
          h("p", { text: "새 기록은 그날만 쓸 수 있어요." }),
          h("div", { class: "screen-actions" }, toToday)
        )
      );
    } else {
      const retry = h("button", { type: "button", class: "btn btn-primary btn-block", text: "다시 시도" });
      retry.addEventListener("click", () => navigate(location.hash, { replace: true }));
      const toToday = h("button", { type: "button", class: "btn btn-quiet btn-block", text: "오늘로 돌아가기" });
      toToday.addEventListener("click", () => leaveFlow("#/today"));
      context.root.append(
        h(
          "section",
          { class: "screen" },
          h("h1", { tabindex: "-1", text: "쓰던 글을 불러오지 못했어요" }),
          h("p", { text: result.failure.offline ? "인터넷에 연결되면 다시 열 수 있어요." : "잠시 뒤 다시 시도해 주세요." }),
          h("div", { class: "screen-actions" }, retry, toToday)
        )
      );
    }
    syncTitle();
    focusElement(context.root.querySelector("h1"));
  });
  return () => cleanup();
}

/** 지금 단계를 그린다. 주소의 단계가 지금 글에 없으면 되살릴 단계로 바꿔친다. */
function drawStep(context: ViewContext, session: FlowSession): () => void {
  const { root } = context;
  const saver = session.saver;
  const diary = (): WorkingDiary => saver.diary;
  const list = steps(diary());
  const wanted = parseStepQuery(context.route.query);
  const index = resumeIndex(diary(), [wanted, saver.step, session.serverStep]);
  const step = list[index] as Step;
  const key: StepKey = { step: step.step, category: step.category };
  if (!sameKey(wanted, key)) {
    history.replaceState(history.state, "", writeHash(session.date, key));
  }
  // 단계도 저장 내용이다(쓰던 단계 — RK-043)
  if (!sameKey(saver.step, key)) saver.update(diary(), key, { immediate: true, stepOnly: true });

  const day = dayWord(session);
  const edit = session.mode === "edit";

  // ── 위쪽 줄 ──
  const close = h("button", { type: "button", class: "icon-button", "aria-label": "닫기", text: "×" });
  const progress = h("p", { class: "write-progress", "aria-hidden": "true" });
  const bar = h("div", { class: "write-bar", role: "progressbar", "aria-valuemin": "1" });
  const barFill = h("div", { class: "write-bar-fill" });
  bar.append(barFill);
  const paintProgress = (): void => {
    const total = steps(diary()).length;
    const at = indexOf(diary(), key) + 1;
    progress.textContent = `${at} / ${total}`;
    bar.setAttribute("aria-valuemax", String(total));
    bar.setAttribute("aria-valuenow", String(at));
    bar.setAttribute("aria-label", `${total}단계 중 ${at}단계`);
    barFill.style.setProperty("--progress", String(at / total));
  };
  paintProgress();
  const menu = !edit ? h("button", { type: "button", class: "icon-button", "aria-label": "더보기", text: "⋯" }) : null;
  const status = h("p", { class: "save-status", role: "status" });
  // 저장 실패 때만 보이는 '다시 시도'(UX_SPEC §4 '저장 실패 · 다시 시도') — 읽어 주기 칸 밖에 둔다
  const retry = h("button", { type: "button", class: "btn btn-quiet btn-small", text: "다시 시도", hidden: true });
  retry.addEventListener("click", () => saver.retryNow());
  let freshTimer: number | undefined;
  const paintStatus = (value: SaveStatus): void => {
    status.textContent = saveText(value, session.mode);
    status.classList.toggle("is-warning", ["offline", "failed", "conflict", "held"].includes(value.state));
    retry.hidden = value.state !== "failed";
    window.clearTimeout(freshTimer);
    if (value.state === "saved") freshTimer = window.setTimeout(() => paintStatus(saver.status()), 60_000);
  };
  paintStatus(saver.status());

  const banners: HTMLElement[] = [];
  if (edit) banners.push(h("p", { class: "write-banner", text: "완료된 기록을 수정 중이에요" }));
  if (session.date < session.today) {
    banners.push(h("p", { class: "write-banner", text: `${monthDay(session.date)}의 기록을 마무리하고 있어요` }));
  }

  // ── 단계 내용 ──
  const hint = h("p", { class: "write-hint", id: "write-hint", hidden: true });
  const body: HTMLElement[] = [];
  let focusFirst: () => void = () => {};
  // '다음'의 막힘 표시 — 아래에서 버튼을 만든 뒤 채운다. 글이 바뀔 때마다 곧바로 다시 본다(저장 상태를 기다리지 않는다)
  let refreshNext: () => void = () => {};
  const change = (next: WorkingDiary, options: { immediate?: boolean } = {}): void => {
    if (edit) session.touched = true;
    saver.update(next, key, options);
    hint.hidden = true;
    refreshNext();
  };

  const textArea = (id: string, label: string, help: string, value: string, max: number, onInput: (text: string) => void) => {
    const area = h("textarea", {
      id,
      class: "input textarea write-text",
      rows: "6",
      maxlength: String(max),
      "aria-describedby": `${id}-help write-hint`
    });
    area.value = value;
    const grow = (): void => {
      area.style.setProperty("height", "auto");
      area.style.setProperty("height", `${area.scrollHeight + 2}px`);
    };
    area.addEventListener("input", () => {
      onInput(area.value.replace(/\r\n?/g, "\n"));
      grow();
    });
    requestAnimationFrame(grow);
    focusFirst = () => area.focus();
    return h("div", { class: "field" }, h("label", { for: id, text: label }), area, h("p", { class: "help", id: `${id}-help`, text: help }));
  };

  let title = "";
  let guide = "";
  if (key.step === "event") {
    title = `${day} 있었던 일`;
    body.push(
      textArea(
        "event",
        "무슨 일이 있었나요?",
        "잘 쓰지 않아도 괜찮아요. 기억나는 장면 하나부터 적어 보세요.",
        diary().eventText,
        EVENT_MAX_CHARS,
        (text) => change(withText(diary(), "eventText", text))
      )
    );
  } else if (key.step === "feelings") {
    title = `${day}은 어떤 마음이 머물렀나요?`;
    guide = "여러 개여도 괜찮아요.";
    const grid = h("div", { class: "choice-grid", role: "group", "aria-label": "마음" });
    for (const category of CATEGORIES) {
      const button = h(
        "button",
        { type: "button", class: "choice choice-feeling", "data-category": category.code, "aria-pressed": "false" },
        h("span", { class: "choice-mark", "aria-hidden": "true" }),
        h("span", { class: "choice-name", text: category.label })
      );
      const paint = (): void => {
        button.setAttribute("aria-pressed", String(diary().categories.some((item) => item.code === category.code)));
      };
      paint();
      button.addEventListener("click", () => {
        change(toggleCategory(diary(), category.code));
        paint();
        paintProgress();
        const on = button.getAttribute("aria-pressed") === "true";
        announce(`${category.label} ${on ? "선택됨" : "선택 해제됨"}, 지금 ${diary().categories.length}개 선택`);
      });
      grid.append(button);
    }
    focusFirst = () => focusElement(grid.querySelector<HTMLElement>("button"));
    body.push(grid);
  } else if (key.step === "details" && key.category) {
    const code = key.category;
    const label = categoryLabel(code);
    title = `${label} 중에서 어떤 마음이었나요?`;
    guide = "가까운 말을 여러 개 골라도 돼요. 정답은 없어요.";
    const counter = step.of > 1 ? h("p", { class: "write-counter", text: `${label} · ${step.order}/${step.of}` }) : null;
    const cloud = h("div", { class: "choice-cloud", role: "group", "aria-label": `${label}의 세부 감정` });
    for (const emotion of CATEGORY_BY_CODE.get(code)?.emotions ?? []) {
      const button = h("button", { type: "button", class: "choice choice-pill", "data-category": code, "aria-pressed": "false", text: emotion.label });
      const paint = (): void => {
        button.setAttribute("aria-pressed", String(diary().emotions.some((item) => item.code === emotion.code)));
      };
      paint();
      button.addEventListener("click", () => {
        change(toggleEmotion(diary(), emotion.code));
        paint();
        const on = button.getAttribute("aria-pressed") === "true";
        const count = diary().emotions.filter((item) => item.category === code).length;
        announce(`${emotion.label} ${on ? "선택됨" : "선택 해제됨"}, 지금 ${count}개 선택`);
      });
      cloud.append(button);
    }
    const drop = h("button", { type: "button", class: "btn btn-quiet btn-small", text: "이 마음은 빼기" });
    drop.addEventListener("click", () => {
      const position = diary().categories.findIndex((item) => item.code === code);
      const next = removeCategory(diary(), code);
      const rest = next.categories;
      const target: StepKey = !rest.length
        ? { step: "feelings", category: null }
        : position < rest.length
          ? { step: "details", category: rest[position]?.code ?? null }
          : { step: "intensity", category: null };
      saver.update(next, target, { immediate: true });
      if (edit) session.touched = true;
      announce(`${label}을 뺐어요`);
      navigate(writeHash(session.date, target), { replace: true });
    });
    focusFirst = () => focusElement(cloud.querySelector<HTMLElement>("button"));
    if (counter) body.push(counter);
    body.push(cloud, h("div", { class: "write-aside" }, drop));
  } else if (key.step === "intensity") {
    title = "얼마나 컸나요?";
    guide = "1은 스쳐 지나간 정도, 10은 일상에 큰 영향을 준 정도예요. 색은 마음을 알려 줄 뿐 좋고 나쁨이 아니에요.";
    const panels: { code: string; focus: () => void; error: HTMLElement }[] = [];
    for (const category of diary().categories) {
      const code = category.code;
      const label = categoryLabel(code);
      const error = h("p", { class: "field-error", id: `intensity-error-${code}` });
      const control = intensityControl({
        id: `intensity-${code}`,
        label: `${label} 크기`,
        value: category.intensity,
        describedBy: error.id,
        onChange: (value) => {
          change(setCategoryIntensity(diary(), code, value));
          error.textContent = "";
          for (const row of ownRows) row.refresh();
        }
      });
      const ownRows: { refresh: () => void }[] = [];
      const detailsId = `own-${code}`;
      const details = h("div", { class: "own-list", id: detailsId });
      for (const emotion of diary().emotions.filter((item) => item.category === code)) {
        const tag = h("span", { class: "own-tag", text: "따로 정함" });
        const reset = h("button", { type: "button", class: "btn btn-quiet btn-small", text: "대표 크기와 같게" });
        const own = intensityControl({
          id: `own-${emotion.code}`,
          label: `${emotionLabel(emotion.code)} 크기`,
          value: effectiveIntensity(diary(), emotion.code),
          onChange: (value) => {
            change(setEmotionIntensity(diary(), emotion.code, value));
            refresh();
          }
        });
        const refresh = (): void => {
          const item = diary().emotions.find((entry) => entry.code === emotion.code);
          tag.hidden = !item || item.own === null;
          reset.hidden = tag.hidden;
          own.set(effectiveIntensity(diary(), emotion.code));
        };
        reset.addEventListener("click", () => {
          change(setEmotionIntensity(diary(), emotion.code, null));
          refresh();
          announce(`${emotionLabel(emotion.code)} 크기를 대표 크기와 같게 했어요`);
        });
        refresh();
        ownRows.push({ refresh });
        details.append(
          h("div", { class: "own-row" }, h("p", { class: "own-name" }, emotionLabel(emotion.code), " ", tag), own.node, reset)
        );
      }
      const opened = diary().emotions.some((item) => item.category === code && item.own !== null);
      details.hidden = !opened;
      const toggle = h("button", {
        type: "button",
        class: "btn btn-quiet btn-small",
        "aria-expanded": String(opened),
        "aria-controls": detailsId,
        text: "세부 감정도 크기를 정하고 싶어요"
      });
      toggle.addEventListener("click", () => {
        const next = toggle.getAttribute("aria-expanded") !== "true";
        toggle.setAttribute("aria-expanded", String(next));
        details.hidden = !next;
      });
      panels.push({ code, focus: control.focus, error });
      body.push(
        h(
          "section",
          { class: "intensity-panel", "data-category": code, "aria-labelledby": `intensity-name-${code}` },
          h("h2", { class: "intensity-name", id: `intensity-name-${code}` }, h("span", { class: "choice-mark", "aria-hidden": "true" }), `${label}의 크기`),
          control.node,
          error,
          toggle,
          details
        )
      );
    }
    focusFirst = () => panels[0]?.focus();
    // 크기를 정하지 않은 마음 시트(D-079 ①)
    showIntensitySheet = () => {
      const unset = unsetCategories(diary());
      for (const panel of panels) panel.error.textContent = unset.includes(panel.code) ? "이 마음의 크기를 정해 주세요." : "";
      openSheet({
        id: "intensity-unset",
        title: "크기를 정하지 않은 마음이 있어요",
        body: unset.map((code) => `· ${categoryLabel(code)}`),
        actions: [
          {
            label: "정하러 가기",
            kind: "primary",
            onClick: () => {
              const target = panels.find((panel) => panel.code === unset[0]);
              target?.focus();
            }
          }
        ]
      });
    };
  } else if (key.step === "reason") {
    title = "이유";
    const chosen = diary().categories.map((item) => categoryLabel(item.code)).join(" · ");
    if (chosen) body.push(h("p", { class: "write-chosen", text: `고른 마음: ${chosen}` }));
    body.push(
      textArea(
        "reason",
        "왜 이런 마음이 들었다고 느끼나요?",
        "정답은 없어요. 느낀 대로 적어요.",
        diary().reasonText,
        REASON_MAX_CHARS,
        (text) => change(withText(diary(), "reasonText", text))
      )
    );
  } else if (key.step === "praise" || key.step === "gratitude") {
    const praise = key.step === "praise";
    title = praise ? "칭찬" : "감사";
    guide = praise ? `${day === "오늘" ? "오늘" : "그날의"} 나에게 해 주고 싶은 칭찬을 적어요.` : `${day} 고마웠던 일을 적어요.`;
    const kind = praise ? "praises" : "gratitudes";
    const name = praise ? "칭찬" : "감사";
    const inputs = diary()[kind].map((value, slot) => {
      const input = h("input", {
        type: "text",
        id: `${kind}-${slot}`,
        class: "input",
        maxlength: String(REFLECTION_MAX_CHARS),
        autocomplete: "off"
      });
      input.value = value;
      input.addEventListener("input", () => change(withReflection(diary(), kind, slot, input.value)));
      return h("div", { class: "field" }, h("label", { for: input.id, text: `${name} ${slot + 1}` }), input);
    });
    focusFirst = () => focusElement(root.querySelector<HTMLElement>(`#${kind}-0`));
    body.push(h("p", { class: "note", text: "선택이에요. 비워 두어도 괜찮아요." }), ...inputs);
  } else {
    title = "이대로 남길까요?";
    guide = `${day}의 마음을 나에게 쓴 편지로 담았어요. 남기기 전에 마지막으로 읽어 봐요.`;
    body.push(letterNode(session, (target) => pushFlowStep(writeHash(session.date, target), flowIdOf(session), { review: true })));
  }

  // ── 아래 버튼 줄(내용 바로 뒤) ──
  const isFirst = index === 0;
  const isLetter = key.step === "letter";
  const prev = h("button", { type: "button", class: "btn btn-quiet", text: isFirst ? "그만두기" : "이전" });
  // 편지의 '고치기'로 들어온 단계는 '편지로 돌아가기'다. 기록 보기의 '고치기'로 고치기 흐름에 막 들어온 칸(깊이 1)도 같다 —
  // 그때는 뒤에 편지 칸이 없으므로 지금 칸을 편지로 바꿔친다(UX_SPEC §7 '편지에서 확인한 뒤 저장한다').
  const flow = currentFlow();
  const reviewHere = !isLetter && flow?.review === true;
  const reviewByReplace = !isLetter && edit && !reviewHere && (flow?.depth ?? 0) <= 1;
  const fromReview = reviewHere || reviewByReplace;
  const nextLabel = isLetter ? (edit ? "저장하기" : "남기기") : fromReview ? "편지로 돌아가기" : "다음";
  const next = h("button", { type: "button", class: "btn btn-primary", text: nextLabel, "aria-describedby": "write-hint" });
  const paintNext = (): void => {
    const why = isLetter ? null : blocked(diary(), key);
    next.setAttribute("aria-disabled", String(Boolean(why)));
  };
  paintNext();
  refreshNext = paintNext;

  const leave = (target: string): void => {
    closeSession(session.date);
    leaveFlow(target);
  };
  const exitTarget = edit ? `#/record/${session.date}` : "#/today";

  // 흐름을 떠난다(× 또는 첫 칸의 '그만두기'). 고치는 중에 실제로 고쳤으면 한 번 묻는다(UX_SPEC §4·§7, 마감 검토 L-1)
  const exit = (opener: HTMLElement): void => {
    if (edit && session.touched) {
      openSheet({
        id: "discard-edit",
        title: "고친 내용을 저장하지 않고 나갈까요?",
        body: ["나가면 고친 내용은 이 휴대폰에서도 지워져요."],
        actions: [
          {
            label: "나가기",
            kind: "primary",
            onClick: () => {
              dropSession(session.date);
              leaveFlow(exitTarget);
            }
          },
          { label: "계속 고치기", kind: "quiet" }
        ],
        opener
      });
      return;
    }
    // 자동 저장이라 묻지 않는다. 보낼 것이 남았으면 저장 줄이 끝까지 보낸다
    saver.hidden();
    leave(exitTarget);
  };
  close.addEventListener("click", () => exit(close));

  menu?.addEventListener("click", () => {
    openSheet({
      id: "write-menu",
      title: "메뉴",
      actions: [
        { label: "이 글 지우기", kind: "quiet", onClick: () => confirmDelete(session, menu) },
        { label: "닫기", kind: "quiet" }
      ],
      opener: menu
    });
  });

  prev.addEventListener("click", () => {
    if (isFirst) {
      exit(prev);
      return;
    }
    const flow = currentFlow();
    if (flow && flow.depth > 1) history.back();
    else {
      const before = steps(diary())[index - 1];
      if (before) navigate(writeHash(session.date, before), { replace: true });
    }
  });

  next.addEventListener("click", () => {
    if (isLetter) {
      void finish(session, next);
      return;
    }
    const why = blocked(diary(), key);
    if (why) {
      if (why === "intensity_unset") {
        showIntensitySheet();
        return;
      }
      hint.textContent = BLOCKED_TEXT[why];
      hint.hidden = false;
      announce(BLOCKED_TEXT[why]);
      focusFirst();
      return;
    }
    if (reviewHere) {
      history.back();
      return;
    }
    if (reviewByReplace) {
      navigate(writeHash(session.date, { step: "letter", category: null }), { replace: true });
      return;
    }
    const after = steps(diary())[indexOf(diary(), key) + 1];
    if (after) pushFlowStep(writeHash(session.date, after), flowIdOf(session));
  });

  // 막힘 표시는 글이 바뀔 때마다 다시 본다
  const statusHandler = (value: SaveStatus): void => {
    paintStatus(value);
    paintNext();
  };

  const head = h("div", { class: "write-top" }, close, h("div", { class: "write-progress-box" }, progress, bar), menu ?? h("span", { class: "icon-spacer" }));
  root.append(
    h(
      "section",
      { class: "screen write", "data-step": key.step },
      head,
      ...banners,
      h("div", { class: "save-row" }, status, retry),
      h("h1", { text: title }),
      guide ? h("p", { class: "lede", text: guide }) : null,
      hint,
      ...body,
      h("div", { class: "write-nav" }, prev, next)
    )
  );

  saver.attach({
    onStatus: statusHandler,
    onConflict: (currentRevision) => {
      void loadConflict(session, currentRevision).then(() => {
        if (context.alive()) showConflict(session);
      });
    },
    onNotToday: () => void moveToToday(session)
  });
  if (session.restored) {
    session.restored = false;
    announce("이 휴대폰에 남아 있던 글을 되살렸어요");
    status.textContent = "이 휴대폰에 남아 있던 글을 되살렸어요";
  }
  if (session.conflict) showConflict(session);
  // 잠금이 풀린 뒤·다시 들어온 뒤 그려질 때 멈춰 있던 저장을 잇는다
  if (saver.status().state === "held") saver.retryNow();

  return () => {
    window.clearTimeout(freshTimer);
    saver.attach(null);
  };
}

/** 크기 단계의 시트 — 크기 단계를 그릴 때 채운다. */
let showIntensitySheet: () => void = () => {};

/** 편지의 평면판: 감정 → 있었던 일과 이유 → 칭찬 → 감사(채운 것만), 부분마다 '고치기'. */
function letterNode(session: FlowSession, onEdit: (target: StepKey) => void): HTMLElement {
  const diary = session.saver.diary;
  const edit = (label: string, target: StepKey) => {
    const button = h("button", { type: "button", class: "btn btn-quiet btn-small", text: "고치기", "aria-label": `${label} 고치기` });
    button.addEventListener("click", () => onEdit(target));
    return button;
  };
  const sections: HTMLElement[] = [];
  for (const category of diary.categories) {
    const label = categoryLabel(category.code);
    const emotions = diary.emotions.filter((item) => item.category === category.code);
    sections.push(
      h(
        "section",
        { class: "letter-card", "data-category": category.code },
        h("div", { class: "letter-head" }, h("h2", {}, h("span", { class: "choice-mark", "aria-hidden": "true" }), label), edit(label, { step: "details", category: category.code })),
        h("p", { class: "letter-size", text: category.intensity === null ? "크기 –" : `크기 ${category.intensity}` }),
        h(
          "ul",
          { class: "letter-pills" },
          ...emotions.map((item) =>
            h("li", { text: item.own !== null ? `${emotionLabel(item.code)} (크기 ${item.own})` : emotionLabel(item.code) })
          )
        )
      )
    );
  }
  if (!diary.categories.length) {
    sections.push(
      h(
        "section",
        { class: "letter-card" },
        h("div", { class: "letter-head" }, h("h2", { text: "마음" }), edit("마음", { step: "feelings", category: null })),
        h("p", { class: "note", text: "아직 고른 마음이 없어요." })
      )
    );
  }
  const textBlock = (heading: string, text: string, target: StepKey) =>
    h(
      "section",
      { class: "letter-card" },
      h("div", { class: "letter-head" }, h("h2", { text: heading }), edit(heading, target)),
      text.trim() ? h("p", { class: "letter-text", text }) : h("p", { class: "note", text: "아직 비어 있어요." })
    );
  sections.push(textBlock("있었던 일", diary.eventText, { step: "event", category: null }));
  sections.push(textBlock("이유", diary.reasonText, { step: "reason", category: null }));
  for (const [kind, heading, step] of [
    ["praises", "칭찬", "praise"],
    ["gratitudes", "감사", "gratitude"]
  ] as const) {
    const filled = diary[kind].filter((text) => text.trim() !== "");
    if (!filled.length) continue;
    sections.push(
      h(
        "section",
        { class: "letter-card" },
        h("div", { class: "letter-head" }, h("h2", { text: heading }), edit(heading, { step, category: null })),
        h("ul", { class: "letter-list" }, ...filled.map((text) => h("li", { text })))
      )
    );
  }
  return h("div", { class: "letter" }, ...sections);
}

function showMissing(session: FlowSession, list: readonly MissingStep[]): void {
  announce(`남기려면 ${list.length}가지가 필요해요. ${MISSING_TEXT[list[0] as MissingStep] ?? ""}`);
  openSheet({
    id: "missing",
    title: "남기려면 이것이 필요해요",
    body: [...list.map((item) => `· ${MISSING_TEXT[item]}`), "칭찬과 감사는 비워 둬도 남길 수 있어요."],
    actions: [
      {
        label: "채우러 가기",
        kind: "primary",
        onClick: () => {
          const target = firstMissingKey(session.saver.diary);
          if (!target) return;
          pushFlowStep(writeHash(session.date, target), flowIdOf(session), { review: true });
        }
      },
      { label: "편지로 돌아가기", kind: "quiet" }
    ]
  });
}

let finishing = false;

/** 편지의 '남기기'(draft) 또는 '저장하기'(edit). */
async function finish(session: FlowSession, button: HTMLButtonElement): Promise<void> {
  if (finishing) return;
  const lacking = missing(session.saver.diary);
  if (lacking.length) {
    showMissing(session, lacking);
    return;
  }
  if (isSendingBlocked()) {
    showToast("새로 고쳐야 저장할 수 있어요");
    return;
  }
  finishing = true;
  button.setAttribute("aria-disabled", "true");
  try {
    const saver = session.saver;
    if (session.mode === "edit") {
      const result = await saver.saveEdit();
      if (result.ok) {
        closeSession(session.date);
        leaveFlow(`#/record/${session.date}`);
        showToast("고친 내용을 저장했어요");
      } else if (result.status === 422 && result.code === "incomplete") {
        showMissing(session, result.detail?.missing ?? []);
      } else if (result.status === 409 || result.status === 404) {
        await loadConflict(session, result.detail?.currentRevision ?? null);
        showConflict(session);
      } else if (result.status !== 401 && result.status !== 423) {
        showToast(result.offline ? "인터넷에 연결되면 저장할 수 있어요." : "지금은 저장하지 못했어요. 잠시 뒤 다시 눌러 주세요.");
      }
      return;
    }
    const saved = await saver.flush();
    if (!saved) {
      const state = saver.status().state;
      if (state === "conflict") {
        // 다른 곳의 고침 때문에 막혔다 — 무엇이 다른지 보이고 고르게 한다
        if (!session.conflict) await loadConflict(session, saver.revision);
        showConflict(session);
      } else if (state !== "held") {
        showToast("아직 저장하지 못했어요. 연결되면 남길 수 있어요.");
      }
      return;
    }
    const revision = saver.revision;
    if (revision === null) return;
    const key = completeKeys.get(session.date) ?? newRequestKey();
    completeKeys.set(session.date, key);
    const result = await completeDiaryRequest(session.date, revision, key);
    if (result.ok || (result.status === 409 && result.code === "not_draft")) {
      completeKeys.delete(session.date);
      dropSession(session.date);
      leaveFlow(`#/done/${session.date}${session.date < session.today ? "?day=past" : ""}`);
      return;
    }
    if (result.status === 0 || result.status >= 500) {
      showToast(result.offline ? "인터넷에 연결되면 남길 수 있어요." : "지금은 남기지 못했어요. 잠시 뒤 다시 눌러 주세요.");
      return;
    }
    completeKeys.delete(session.date);
    if (result.status === 422 && result.code === "incomplete") showMissing(session, result.detail?.missing ?? []);
    else if (result.status === 409 && result.code === "revision_conflict") {
      await loadConflict(session, result.detail?.currentRevision ?? null);
      showConflict(session);
    }
  } finally {
    finishing = false;
    if (button.isConnected) button.setAttribute("aria-disabled", "false");
  }
}

function confirmDelete(session: FlowSession, opener: HTMLElement): void {
  const second = (): void =>
    openSheet({
      id: "delete-2",
      title: "정말 지울까요?",
      body: [`${monthDay(session.date)}에 쓰던 글이 사라져요.`],
      actions: [{ label: "지우기", kind: "primary", onClick: () => void deleteDraft(session) }, { label: "그만두기", kind: "quiet" }],
      opener
    });
  openSheet({
    id: "delete-1",
    title: "이 글을 지울까요?",
    body: ["지우면 되돌릴 수 없어요."],
    actions: [{ label: "지우기", kind: "primary", onClick: second }, { label: "그만두기", kind: "quiet" }],
    opener
  });
}

async function deleteDraft(session: FlowSession): Promise<void> {
  const saver = session.saver;
  await saver.quiesce();
  const revision = saver.revision;
  if (revision !== null) {
    const key = deleteKeys.get(session.date) ?? newRequestKey();
    deleteKeys.set(session.date, key);
    const result = await deleteDiaryRequest(session.date, revision, key);
    if (!result.ok && result.status !== 404) {
      if (result.status === 0 || result.status >= 500) {
        showToast(result.offline ? "인터넷에 연결되면 지울 수 있어요." : "지금은 지우지 못했어요. 잠시 뒤 다시 해 주세요.");
      } else if (result.status === 409) {
        deleteKeys.delete(session.date);
        showToast("다른 곳에서 고친 내용이 있어 지우지 않았어요.");
      }
      saver.thaw();
      return;
    }
    deleteKeys.delete(session.date);
  }
  dropSession(session.date);
  leaveFlow("#/today");
  showToast("쓰던 글을 지웠어요");
}

/** 다른 곳의 고침·지움 — 덮지 않고 고르게 한다(PLAN A-13). */
function showConflict(session: FlowSession): void {
  const conflict = session.conflict;
  if (!conflict) return;
  const deleted = conflict.serverEntry === null;
  const canRecreate = session.date === session.today;
  if (deleted && !canRecreate) {
    openSheet({
      id: "conflict",
      title: "다른 곳에서 지운 글이에요",
      body: ["이 날의 새 기록은 만들 수 없어요. 이 휴대폰에 남은 글을 지울까요?"],
      actions: [
        {
          label: "지우기",
          kind: "primary",
          onClick: () => {
            dropSession(session.date);
            leaveFlow("#/today");
          }
        },
        { label: "그만두기", kind: "quiet" }
      ]
    });
    return;
  }
  const parts = conflict.sections.map((section) => SECTION_TEXT[section]).join(", ");
  openSheet({
    id: "conflict",
    title: deleted ? "다른 곳에서 지운 글이에요" : "다른 곳에서 고친 내용이 있어요",
    body: [
      deleted ? "이 휴대폰에는 쓰던 글이 남아 있어요." : `다른 부분: ${parts || "쓰던 단계"}`,
      deleted ? "남기면 새 글로 다시 저장해요." : "이 휴대폰의 글로 남기면 다른 곳에서 고친 내용은 사라져요.",
      deleted ? "지우면 이 휴대폰에 남은 글도 사라져요." : "다른 곳의 글로 바꾸면 이 휴대폰에서 쓴 글이 사라져요."
    ],
    actions: [
      {
        label: "이 휴대폰의 글로 남기기",
        kind: "primary",
        onClick: () => {
          keepMine(session);
          navigate(location.hash, { replace: true });
        }
      },
      {
        label: deleted ? "이 휴대폰의 글 지우기" : "다른 곳의 글로 바꾸기",
        kind: "quiet",
        onClick: () => {
          const next = takeServer(session);
          if (!next) {
            dropSession(session.date);
            leaveFlow("#/today");
            return;
          }
          navigate(location.hash, { replace: true });
        }
      }
    ]
  });
}

/** 아직 만들지 않은 새 글이 날짜를 넘겼다(PLAN A-12): 오늘 기록이 없으면 오늘로 옮긴다. */
async function moveToToday(session: FlowSession): Promise<void> {
  const result = await fetchToday();
  if (!result.ok) {
    session.saver.retryNow();
    return;
  }
  const today = result.data;
  if (today.entry === null && today.date !== session.date) {
    const oldDate = session.date;
    closeSession(oldDate);
    session.saver.retarget(today.date);
    const step = session.saver.step ?? { step: "event" as const, category: null };
    navigate(writeHash(today.date, step), { replace: true });
    showToast(`날짜가 바뀌어 ${monthDay(today.date)}의 글로 이어 써요`);
    return;
  }
  openSheet({
    id: "day-changed",
    title: "날짜가 바뀌었어요",
    body: ["오늘 기록이 이미 있어 이 글을 오늘로 옮길 수 없어요. 이 글은 이 휴대폰에만 남아 있어요."],
    // 보낼 곳이 없는 사본이 영영 남지 않게 지울 길을 둔다(마감 검토 L-5)
    actions: [
      {
        label: "이 휴대폰의 글 지우기",
        kind: "quiet",
        onClick: () => {
          dropSession(session.date);
          leaveFlow("#/today");
        }
      },
      { label: "닫기", kind: "quiet" }
    ]
  });
}
