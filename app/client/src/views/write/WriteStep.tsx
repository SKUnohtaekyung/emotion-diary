// 작성 흐름 한 단계의 틀 — 위 줄(× · 진행 · ⋯), 안내 띠, 저장 상태, 제목, 막힘 안내, 내용, 아래 버튼 줄(UX_SPEC §4).
// 2026-11-11 `views/write.ts`의 drawStep을 Preact로 옮겼다(TASK-JOURNAL-01 A-1). 판단은 그대로다:
// - 버튼은 내용이 끝나는 바로 아래 한 줄 — 화면 아래에 고정하지 않는다(자판이 가린다, S-07, D-123).
// - 단계를 옮길 때마다 기록 칸을 쌓는다(router.pushFlowStep). 뒤로 밀기 = 그 단계의 '이전'. 떠날 때 되감는다(leaveFlow).
// - 글의 정본은 saver.diary다. change()가 saver에 넘기고 다시 그린다(A-2) — 저장 상태는 drawStep이 붙인 듣기로 받는다.

import { useEffect, useRef, useState } from "preact/hooks";
import { announce } from "../../lib/dom";
import { CloseIcon, DotsIcon, PencilGlyph } from "../../ui/icons";
import { monthDay } from "../../lib/format";
import { currentFlow, leaveFlow, navigate, pushFlowStep } from "../../router";
import { openSheet } from "../../ui/sheet";
import { BLOCKED_TEXT, blocked, categoryLabel, indexOf, type Step, type StepKey, steps, type WorkingDiary } from "../../write/flow";
import type { SaveStatus } from "../../write/saver";
import { closeSession, dropSession, type FlowSession } from "../../write/session";
import { confirmDelete, dayWord, finish, flowIdOf, saveText, WARNING_STATES, writeHash } from "./actions";
import { DetailStage } from "./DetailStage";
import { playSeal } from "./seal";
import { guideStage, StepBody, type StepControl, stepCopy } from "./steps";

/** drawStep이 붙인 저장 듣기를 화면으로 잇는 자리(효과의 정리 시점에 기대지 않으려고 — Preact 11은 정리를 미룰 수 있다). */
export interface StatusRelay {
  onStatus: (status: SaveStatus) => void;
}

export interface WriteStepProps {
  session: FlowSession;
  step: Step;
  stepKey: StepKey;
  index: number;
  relay: StatusRelay;
  /** 이 휴대폰에 남은 글을 되살렸다면, 다음 저장 상태가 올 때까지 상태 줄에 보일 말 */
  restored: string | null;
}

export function WriteStep({ session, step, stepKey, index, relay, restored }: WriteStepProps) {
  const saver = session.saver;
  const [, setTick] = useState(0);
  const rerender = (): void => setTick((count) => count + 1);
  const [status, setStatus] = useState<SaveStatus>(() => saver.status());
  const [override, setOverride] = useState<string | null>(restored);
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ctl = useRef<StepControl>({ focusFirst: () => {}, showIntensitySheet: () => {}, basket: { current: null }, letter: { stage: null } }).current;

  relay.onStatus = (value) => {
    setStatus(value);
    setOverride(null);
  };

  // '저장됨 · 방금'은 1분 뒤 '저장됨'으로(UX_SPEC §4)
  useEffect(() => {
    if (status.state !== "saved") return;
    const timer = window.setTimeout(rerender, 60_000);
    return () => window.clearTimeout(timer);
  }, [status]);

  const diary = saver.diary;
  const day = dayWord(session);
  const edit = session.mode === "edit";
  const { title, guide } = stepCopy(stepKey, day, guideStage(session.firstRecordDate, session.today));
  const detailCode = stepKey.step === "details" ? stepKey.category : null;
  // 글 쓰는 네 단계 — 종이 + 아래 언덕 장면(PaperScenes.tsx), 버튼 줄이 가까운 언덕 색 위에 선다
  const paper = stepKey.step === "event" || stepKey.step === "reason" || stepKey.step === "praise" || stepKey.step === "gratitude";
  const total = steps(diary).length;
  const at = indexOf(diary, stepKey) + 1;

  const change = (next: WorkingDiary, options: { immediate?: boolean } = {}): void => {
    if (edit) session.touched = true;
    saver.update(next, stepKey, options);
    setHint(null);
    rerender();
  };

  // ── 아래 버튼 줄 ──
  const isFirst = index === 0;
  const isLetter = stepKey.step === "letter";
  // 편지의 '고치기'로 들어온 단계는 '편지로 돌아가기'다. 기록 보기의 '고치기'로 고치기 흐름에 막 들어온 칸(깊이 1)도 같다 —
  // 그때는 뒤에 편지 칸이 없으므로 지금 칸을 편지로 바꿔친다(UX_SPEC §7 '편지에서 확인한 뒤 저장한다').
  const flow = currentFlow();
  const reviewHere = !isLetter && flow?.review === true;
  const reviewByReplace = !isLetter && edit && !reviewHere && (flow?.depth ?? 0) <= 1;
  const fromReview = reviewHere || reviewByReplace;
  const nextLabel = isLetter ? (edit ? "저장하기" : "남기기") : fromReview ? "편지로 돌아가기" : "다음";
  const why = isLetter ? null : blocked(diary, stepKey);
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
    closeSession(session.date);
    leaveFlow(exitTarget);
  };

  const openMenu = (opener: HTMLElement): void => {
    openSheet({
      id: "write-menu",
      title: "메뉴",
      actions: [
        // 항목이 하나뿐이라 이름만 빨강, 설명은 보조색(시안 write.js 메뉴, 재작업 1회차)
        { label: "이 글 지우기", detail: "쓰던 글을 지워요.", kind: "danger", onClick: () => confirmDelete(session, opener) },
        { label: "닫기", kind: "quiet" }
      ],
      opener
    });
  };

  // 첫 단계에는 '이전'이 없다 — 나가기는 ×가 맡는다(시안 write.js 과제3)
  const goPrev = (): void => {
    const here = currentFlow();
    if (here && here.depth > 1) history.back();
    else {
      const before = steps(saver.diary)[index - 1];
      if (before) navigate(writeHash(session.date, before), { replace: true });
    }
  };

  const goNext = (): void => {
    if (isLetter) {
      // 완료가 받아들여진 뒤에만 봉인 연출(실패하면 연출 없이 편지에 머문다)
      void finish(session, setBusy, () => playSeal(ctl.letter.stage));
      return;
    }
    const reason = blocked(saver.diary, stepKey);
    if (reason) {
      if (reason === "intensity_unset") {
        ctl.showIntensitySheet();
        return;
      }
      setHint(BLOCKED_TEXT[reason]);
      announce(BLOCKED_TEXT[reason]);
      ctl.focusFirst();
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
    const after = steps(saver.diary)[indexOf(saver.diary, stepKey) + 1];
    if (after) pushFlowStep(writeHash(session.date, after), flowIdOf(session));
  };

  const onEdit = (target: StepKey): void => pushFlowStep(writeHash(session.date, target), flowIdOf(session), { review: true });

  const statusText = override ?? saveText(status, session.mode);
  const hintLine = (
    <p class="write-hint" id="write-hint" hidden={hint === null}>
      {hint ?? ""}
    </p>
  );

  return (
    <section
      class={`screen write${stepKey.step === "feelings" ? " pick" : ""}${detailCode ? " detail-screen" : ""}${paper ? " paper-step" : ""}${isLetter ? " review" : ""}`}
      data-step={stepKey.step}
      data-category={detailCode ?? undefined}
    >
      {/* 위 줄 — × · 'n / N'과 저장 상태 한 덩어리 · ⋯(고치는 중엔 없음). 고정하지 않는다(D-123, MAP R2) */}
      <div class="write-top">
        <button type="button" class="icon-btn plain" aria-label="닫기" onClick={(event) => exit(event.currentTarget)}>
          <CloseIcon />
        </button>
        <div class="wf-count">
          <span class="write-progress" aria-hidden="true">{`${at} / ${total}`}</span>
          <span class={WARNING_STATES.has(status.state) ? "save-status is-warning" : "save-status"} role="status">
            {statusText}
          </span>
        </div>
        {!edit ? (
          <button type="button" class="icon-btn plain" aria-label="더보기" aria-haspopup="dialog" onClick={(event) => openMenu(event.currentTarget)}>
            <DotsIcon />
          </button>
        ) : (
          <span class="icon-spacer" />
        )}
      </div>
      <div class="write-bar" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={at} aria-label={`${total}단계 중 ${at}단계`}>
        <div class="write-bar-fill" style={{ "--progress": String(at / total) }} />
      </div>
      {/* 안내 띠 — 필요한 만큼 같은 자리에 쌓인다(시안 write.js 과제2·5·9, D-099 banner H1) */}
      <div class="wf-banners">
        {edit ? (
          <p class="banner write-banner">
            <PencilGlyph />
            완료된 기록을 수정 중이에요
          </p>
        ) : null}
        {session.date < session.today ? <p class="banner write-banner">{`${monthDay(session.date)}의 기록을 마무리하고 있어요`}</p> : null}
        {/* 저장 실패 때만 '다시 시도'(UX_SPEC §4 '저장 실패 · 다시 시도') — 읽어 주기는 위 줄의 상태가 한다 */}
        {status.state === "failed" ? (
          <div class="banner soft wf-fail">
            <span>저장하지 못했어요</span>
            <button type="button" class="link" onClick={() => saver.retryNow()}>
              다시 시도
            </button>
          </div>
        ) : null}
      </div>
      {/* 세부 감정: 친구와 바구니가 제목 위에 서고, 고른 마음이 둘 이상이면 몇 번째인지(시안 detail.js) */}
      {detailCode ? (
        <DetailStage category={detailCode} chosen={diary.emotions.filter((item) => item.category === detailCode).map((item) => item.code)} basket={ctl.basket} />
      ) : null}
      {detailCode && step.of > 1 ? <p class="write-counter">{`${categoryLabel(detailCode)} · ${step.order}/${step.of}`}</p> : null}
      <h1 tabIndex={-1} class={stepKey.step === "feelings" ? "hero" : undefined}>
        {title}
      </h1>
      {/* 있었던 일은 안내와 막힘 안내가 같은 자리를 쓴다 — 떠도 종이가 밀리지 않는다(시안 write.js guide-slot) */}
      {stepKey.step === "event" ? (
        <div class="guide-slot">
          <p class="lede">{guide}</p>
          {hintLine}
        </div>
      ) : (
        <>
          {guide ? <p class="lede">{guide}</p> : null}
          {hintLine}
        </>
      )}
      <StepBody session={session} diary={diary} step={step} stepKey={stepKey} day={day} change={change} ctl={ctl} onEdit={onEdit} />
      {/* 내용 바로 뒤의 버튼 줄. 두 버튼이 한 줄에 들지 않으면 주 버튼이 위로(D-099 button I2) */}
      <div class={isFirst ? "write-nav solo" : "write-nav"}>
        {!isFirst ? (
          <button type="button" class="btn btn-text" onClick={goPrev}>
            이전
          </button>
        ) : null}
        <button type="button" class="btn btn-primary" aria-describedby="write-hint" aria-disabled={isLetter ? busy : Boolean(why)} onClick={goNext}>
          {nextLabel}
        </button>
      </div>
    </section>
  );
}
