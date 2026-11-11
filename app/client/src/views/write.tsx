// 작성 흐름 `#/write/<날짜>?step=…`(UX_SPEC §4). 단계형 하나:
// 사건 → 마음 고르기 → 고른 마음마다 세부 감정 → 크기 → 이유 → 칭찬 → 감사 → 편지(검토) → 완료.
// 2026-11-11 Preact로 옮겼다(TASK-JOURNAL-01 A-1) — 이 파일은 쓰던 글을 열고 지금 단계를 정해 틀(`write/WriteStep.tsx`)을 끼운다.
// 단계를 정하는 일·저장 듣기는 Preact 밖에서 한다(평면판과 같은 순서) — 화면은 단계를 옮길 때마다 다시 끼워진다.

import { announce, focusElement } from "../lib/dom";
import { mountPreact } from "../lib/mount";
import { leaveFlow, navigate, syncTitle, type ViewContext } from "../router";
import { parseStepQuery, resumeIndex, type Step, type StepKey, sameKey, steps } from "../write/flow";
import { currentSession, type FlowSession, loadConflict, openSession } from "../write/session";
import { moveToToday, showConflict, writeHash } from "./write/actions";
import { type StatusRelay, WriteStep } from "./write/WriteStep";

export function renderWrite(context: ViewContext): () => void {
  const date = context.route.params.date ?? "";
  const open = currentSession(date);
  if (open) return drawStep(context, open);

  context.root.setAttribute("aria-busy", "true");
  let cleanup = mountPreact(
    context.root,
    <section class="screen write">
      <h1>쓰던 글을 여는 중이에요</h1>
      <p class="note">잠시만 기다려 주세요.</p>
    </section>
  );
  void openSession(date).then((result) => {
    if (!context.alive()) return;
    context.root.removeAttribute("aria-busy");
    cleanup();
    if (result.kind === "ready") {
      cleanup = drawStep(context, result.session);
    } else if (result.kind === "not_found") {
      cleanup = mountPreact(
        context.root,
        <section class="screen">
          <h1 tabIndex={-1}>이 날의 글이 없어요</h1>
          <p>새 기록은 그날만 쓸 수 있어요.</p>
          <div class="screen-actions">
            <button type="button" class="btn btn-primary btn-block" onClick={() => navigate("#/today", { replace: true })}>
              오늘로 돌아가기
            </button>
          </div>
        </section>
      );
    } else {
      cleanup = mountPreact(
        context.root,
        <section class="screen">
          <h1 tabIndex={-1}>쓰던 글을 불러오지 못했어요</h1>
          <p>{result.failure.offline ? "인터넷에 연결되면 다시 열 수 있어요." : "잠시 뒤 다시 시도해 주세요."}</p>
          <div class="screen-actions">
            <button type="button" class="btn btn-primary btn-block" onClick={() => navigate(location.hash, { replace: true })}>
              다시 시도
            </button>
            <button type="button" class="btn btn-quiet btn-block" onClick={() => leaveFlow("#/today")}>
              오늘로 돌아가기
            </button>
          </div>
        </section>
      );
    }
    syncTitle();
    focusElement(context.root.querySelector("h1"));
  });
  return () => cleanup();
}

/** 지금 단계를 그린다. 주소의 단계가 지금 글에 없으면 되살릴 단계로 바꿔친다. */
function drawStep(context: ViewContext, session: FlowSession): () => void {
  const saver = session.saver;
  const list = steps(saver.diary);
  const wanted = parseStepQuery(context.route.query);
  const index = resumeIndex(saver.diary, [wanted, saver.step, session.serverStep]);
  const step = list[index] as Step;
  const key: StepKey = { step: step.step, category: step.category };
  if (!sameKey(wanted, key)) {
    history.replaceState(history.state, "", writeHash(session.date, key));
  }
  // 단계도 저장 내용이다(쓰던 단계 — RK-043)
  if (!sameKey(saver.step, key)) saver.update(saver.diary, key, { immediate: true, stepOnly: true });

  let restored: string | null = null;
  if (session.restored) {
    session.restored = false;
    restored = "이 휴대폰에 남아 있던 글을 되살렸어요";
    announce(restored);
  }

  const relay: StatusRelay = { onStatus: () => {} };
  const unmount = mountPreact(
    context.root,
    <WriteStep session={session} step={step} stepKey={key} index={index} relay={relay} restored={restored} />
  );

  saver.attach({
    onStatus: (value) => relay.onStatus(value),
    onConflict: (currentRevision) => {
      void loadConflict(session, currentRevision).then(() => {
        if (context.alive()) showConflict(session);
      });
    },
    onNotToday: () => void moveToToday(session)
  });
  if (session.conflict) showConflict(session);
  // 잠금이 풀린 뒤·다시 들어온 뒤 그려질 때 멈춰 있던 저장을 잇는다
  if (saver.status().state === "held") saver.retryNow();

  return () => {
    saver.attach(null);
    unmount();
  };
}
