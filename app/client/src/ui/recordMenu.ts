// 기록 하나의 ⋯ 메뉴 — 고치기(편지부터)·완료 취소·지우기(UX_SPEC §7, D-096, TASK-JOURNAL-01 A-5·A-6). 시안 web/js/views/tabs.js recordMenu.
// 기록 보기(#/record/…)와 달력의 완료한 날(날짜 줄 ⋯)이 같은 메뉴를 쓴다. 요청은 보고 있던 판 번호로만 — 다른 곳에서 고쳤으면 409로 막히고 덮지 않는다.
// 같은 날·같은 일을 다시 누르면 같은 영수증 열쇠(연결이 끊겨 다시 누를 때 두 번 반영되지 않게). 성공하면 열쇠를 버린다.

import type { DiaryEntryView } from "../../../shared/diary";
import { announce } from "../lib/dom";
import { monthDay, monthDayWeekday } from "../lib/format";
import { deleteDiaryRequest, newRequestKey, uncompleteDiaryRequest } from "../write/api";
import { closeSession, dropSession } from "../write/session";
import { openSheet } from "./sheet";
import { showToast } from "./toast";

const keys = new Map<string, string>();
const keyFor = (op: string, date: string): string => {
  const id = `${op}:${date}`;
  const key = keys.get(id) ?? newRequestKey();
  keys.set(id, key);
  return key;
};

export interface RecordMenuOptions {
  entry: DiaryEntryView;
  opener: HTMLElement;
  onEdit: () => void;
  /** 완료 취소가 받아들여진 뒤(임시저장이 됐다) */
  onUncompleted: () => void;
  /** 지운 뒤(또는 이미 없었다) */
  onDeleted: () => void;
}

const failText = (offline: boolean, verb: string) => (offline ? `인터넷에 연결되면 ${verb} 수 있어요.` : `지금은 ${verb === "지울" ? "지우지" : "바꾸지"} 못했어요. 잠시 뒤 다시 해 주세요.`);

export function openRecordMenu(options: RecordMenuOptions): void {
  const { entry, opener } = options;
  const date = entry.entryDate;
  const firstLine = entry.eventText.split("\n")[0]?.trim() ?? "";

  const uncomplete = async (): Promise<void> => {
    const result = await uncompleteDiaryRequest(date, entry.revision, keyFor("uncomplete", date));
    if (result.ok || (result.status === 409 && result.code === "not_completed")) {
      keys.delete(`uncomplete:${date}`);
      // 이 휴대폰에 남은 사본(고치던 내용)은 지우지 않는다 — 확인 창이 '쓴 내용은 지워지지 않아요'라고 했다. 판 번호가 올라가
      // 다시 열면 사본과 서버 기록을 비교해 묻는다(2026-11-12 마감 검토 1). 열려 있던 세션만 닫는다
      closeSession(date);
      announce("완료를 취소했어요. 임시저장 상태예요.");
      showToast("완료를 취소했어요. 임시저장 상태예요");
      options.onUncompleted();
      return;
    }
    if (result.status === 401 || result.status === 423) return; // 전역 처리기가 화면을 넘겨받았다
    if (result.status === 0 || result.status >= 500) {
      showToast(failText(result.offline, "바꿀"));
      return;
    }
    keys.delete(`uncomplete:${date}`);
    showToast(result.status === 404 ? "이 날의 기록이 없어요" : "다른 곳에서 고친 내용이 있어요. 다시 열어 주세요");
  };

  const remove = async (): Promise<void> => {
    const result = await deleteDiaryRequest(date, entry.revision, keyFor("delete", date));
    if (result.ok || result.status === 404) {
      keys.delete(`delete:${date}`);
      dropSession(date);
      showToast(`${monthDay(date)} 기록을 지웠어요`);
      options.onDeleted();
      return;
    }
    if (result.status === 401 || result.status === 423) return;
    if (result.status === 0 || result.status >= 500) {
      showToast(failText(result.offline, "지울"));
      return;
    }
    keys.delete(`delete:${date}`);
    showToast("다른 곳에서 고친 내용이 있어 지우지 않았어요");
  };

  const confirmUncomplete = (): void =>
    openSheet({
      id: "record-uncomplete",
      title: "완료를 취소할까요?",
      body: ["이 기록은 임시저장 상태가 되어 통계에서 빠져요. 쓴 내용은 지워지지 않아요."],
      actions: [
        { label: "완료 취소", kind: "primary", onClick: () => void uncomplete() },
        { label: "그만두기", kind: "quiet" }
      ],
      opener
    });

  const confirmDelete = (): void => {
    const second = (): void =>
      openSheet({
        id: "record-delete-2",
        title: "정말 지울까요?",
        body: ["아래 기록이 영구히 지워져요. 통계에서도 사라져요.", firstLine ? `${monthDayWeekday(date)} · ${firstLine}` : monthDayWeekday(date)],
        actions: [
          { label: "지우기", kind: "danger", onClick: () => void remove() },
          { label: "그만두기", kind: "quiet" }
        ],
        opener
      });
    openSheet({
      id: "record-delete-1",
      title: `${monthDay(date)} 기록을 지울까요?`,
      body: ["지우면 되돌릴 수 없어요."],
      actions: [
        { label: "지우기", kind: "danger", onClick: second },
        { label: "그만두기", kind: "quiet" }
      ],
      opener
    });
  };

  openSheet({
    id: "record-menu",
    title: `${monthDay(date)}의 편지`,
    actions: [
      { label: "고치기", detail: "완료된 기록을 고쳐요.", onClick: options.onEdit },
      { label: "완료 취소", detail: "임시저장 상태로 돌려요. 통계에서 빠져요.", onClick: confirmUncomplete },
      { label: "지우기", detail: "이 날의 기록을 지워요. 되돌릴 수 없어요.", kind: "danger", onClick: confirmDelete },
      { label: "닫기", kind: "quiet" }
    ],
    opener
  });
}
