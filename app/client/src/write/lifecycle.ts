// 저장 줄과 앱의 생명 주기(TASK-SLICE-01 PLAN A-11). 화면이 숨는 순간 기기 사본을 바로 쓰고 곧 보낸다.
// 연결이 돌아오면 다시 보낸다. 다시 보일 때·잠금이 풀린 뒤·다시 들어온 뒤에는 controller가 resumeSaving()을 부른다
// (세션을 먼저 확인해야 잠긴 세션에 보내지 않는다).

import { allSavers } from "./saver";

export function resumeSaving(): void {
  for (const saver of allSavers()) saver.retryNow();
}

/** 처리기를 달고, 떼는 함수를 돌려준다(시험에서 쓴다). */
export function installWriteLifecycle(): () => void {
  const onHide = (): void => {
    for (const saver of allSavers()) saver.hidden();
  };
  const onVisibility = (): void => {
    if (document.visibilityState === "hidden") onHide();
  };
  const onOnline = (): void => resumeSaving();
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onHide);
  window.addEventListener("online", onOnline);
  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", onHide);
    window.removeEventListener("online", onOnline);
  };
}
