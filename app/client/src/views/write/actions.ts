// 작성 흐름의 동작 — 남기기·저장하기·지우기·충돌·날짜 바뀜(TASK-SLICE-01 PLAN A-12·A-13, UX_SPEC §4·§6·§11).
// 2026-11-11 `views/write.ts`에서 그대로 옮겼다(TASK-JOURNAL-01 A-1) — 화면이 Preact로 바뀌어도 판단·요청은 같다.
// 바뀐 것 하나: 남기기 버튼을 직접 만지지 않고 setBusy로 화면에 알린다.

import type { MissingStep } from "../../../../shared/diary";
import { monthDay } from "../../lib/format";
import { currentFlow, leaveFlow, navigate, pushFlowStep } from "../../router";
import { app } from "../../state";
import { openSheet } from "../../ui/sheet";
import { showToast } from "../../ui/toast";
import { completeDiaryRequest, deleteDiaryRequest, fetchToday, newRequestKey } from "../../write/api";
import { firstMissingKey, MISSING_TEXT, missing, SECTION_TEXT, type StepKey, stepQuery } from "../../write/flow";
import { isSendingBlocked, type SaveStatus } from "../../write/saver";
import { closeSession, dropSession, type FlowSession, keepMine, loadConflict, takeServer } from "../../write/session";
import { announce } from "../../lib/dom";
import { rememberDone } from "../done";

export const writeHash = (date: string, key: StepKey) => `#/write/${date}?${stepQuery(key)}`;

/** 흐름 번호는 기록 칸에 실린 것을 이어 쓴다(오늘·기록 보기가 흐름에 들어갈 때 붙였다) — 세션 번호가 아니라. 깊이가 이어져야 떠날 때 다 되감는다. */
export const flowIdOf = (session: FlowSession): string => currentFlow()?.id ?? session.id;

/** 완료 요청의 영수증 열쇠 — 닿지 않아 다시 누르면 같은 열쇠(날짜별). */
const completeKeys = new Map<string, string>();
const deleteKeys = new Map<string, string>();

export function dayWord(session: FlowSession): "오늘" | "그날" {
  return session.date < session.today ? "그날" : "오늘";
}

export function saveText(status: SaveStatus, mode: FlowSession["mode"]): string {
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

export const WARNING_STATES: ReadonlySet<SaveStatus["state"]> = new Set(["offline", "failed", "conflict", "held"]);

export function showMissing(session: FlowSession, list: readonly MissingStep[]): void {
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

/** 편지의 '남기기'(draft) 또는 '저장하기'(edit). setBusy는 누르는 동안 버튼을 막는다. */
export async function finish(session: FlowSession, setBusy: (busy: boolean) => void, seal?: () => Promise<void>): Promise<void> {
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
  setBusy(true);
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
        if (!session.conflict || session.conflict.unavailable) await loadConflict(session, session.conflict?.currentRevision ?? saver.revision);
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
      // 완료 화면은 그날 고른 친구와 조약돌을 세운다 — 새로 고치면 서버에서 다시 읽는다(done.tsx)
      rememberDone(session.date, session.saver.diary.categories.map((item) => item.code));
      await seal?.();
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
    setBusy(false);
  }
}

export function confirmDelete(session: FlowSession, opener: HTMLElement): void {
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
export function showConflict(session: FlowSession): void {
  const conflict = session.conflict;
  if (!conflict) return;
  // 충돌을 다시 읽는 사이 로그인이 풀렸거나(401) 잠겼으면(423) 전역 처리기가 이미 화면을 넘겨받았다 — 그 시트·층을 덮지 않는다.
  // 충돌은 session.conflict에 남아, 다시 들어오거나 잠금을 푼 뒤 작성 화면이 그려질 때 다시 보인다(PR #41 리뷰).
  if (!app.authenticated || app.locked) return;
  if (conflict.unavailable) {
    // 다른 곳의 글을 읽지 못했다 — 지운 것으로 보지도, 덮어쓰게 하지도 않는다. 사본은 그대로 두고 다시 불러온다(PR #40 리뷰)
    openSheet({
      id: "conflict",
      title: "다른 곳에서 고친 내용이 있어요",
      body: ["지금은 다른 곳의 글을 불러오지 못했어요.", "이 휴대폰의 글은 그대로 남아 있어요. 연결되면 다시 불러와 고를 수 있어요."],
      actions: [
        {
          label: "다시 불러오기",
          kind: "primary",
          onClick: () => {
            void loadConflict(session, conflict.currentRevision).then(() => showConflict(session));
          }
        },
        { label: "닫기", kind: "quiet" }
      ]
    });
    return;
  }
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
export async function moveToToday(session: FlowSession): Promise<void> {
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
