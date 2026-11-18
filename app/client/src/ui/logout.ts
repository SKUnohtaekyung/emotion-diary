// 로그아웃 확인 시트 — 오늘 화면의 아래 줄과 설정 목록이 함께 쓴다(TASK-REFLECT-01 R-5). 보내지 못한 글이 있으면 그 글이 지워진다고 먼저 알린다.

import { logout } from "../controller";
import { hasUnsent } from "../write/unsent";
import { openSheet } from "./sheet";

export function confirmLogout(opener: HTMLElement | null): void {
  const unsent = hasUnsent();
  openSheet({
    id: "logout-confirm",
    title: unsent ? "아직 보내지 못한 글이 있어요" : "로그아웃할까요?",
    body: unsent ? ["로그아웃하면 이 휴대폰에 남은 글이 지워져요.", "연결된 뒤 저장되면 그때 로그아웃해도 돼요."] : ["다시 들어올 때 열쇠가 필요해요."],
    actions: [
      { label: unsent ? "그래도 로그아웃" : "로그아웃", kind: "primary", onClick: () => logout() },
      { label: "그만두기", kind: "quiet" }
    ],
    opener
  });
}
