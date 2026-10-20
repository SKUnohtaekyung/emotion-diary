// 덮개(D-113 ①)와 보이고 숨는 때의 처리. 잠금과 상관없이 모두 덮는다 — 앱 전환 화면에 기록이 비치지 않게.
// 숨는 순간(visibilitychange hidden·pagehide)에는 같은 이벤트 처리기 안에서 동기로 덮개를 붙인다. 비동기로 미루면
// 기기가 전환 화면을 찍는 때보다 늦을 수 있다(그래도 최선의 노력이다 — 실기기 확인은 T-03).
// 다시 보이면 controller.resume()이 세션을 확인한 뒤 덮개를 걷는다.
//
// 2026-10-20 운영·개발용 iPhone 홈 화면 앱(PLAN 4-9): 앱 안에서 바로 앱 전환 화면으로 올리면 blur와 hidden이 같은 초에 함께
// 오는데도 카드에는 내용이 보였다 — iOS가 카드 사진을 찍은 뒤에야 페이지가 덮개를 그린다(RK-039). blur에 덮는 안을 개발용에서
// 시험했으나 hidden보다 빠르지 않아 소용이 없고 공유 창·전화 확인 창 뒤만 남색으로 깜빡여 뺐다. blur·focus는 개발용 상태 칸에만 남긴다.
// 덮인 채 visible·focus가 오지 않아도 갇히지 않게, 덮인 동안 화면을 누르면 다시 확인한다.

import { resume } from "./controller";
import { stopHeartbeat } from "./heartbeat";
import { type LifecycleKind, emit } from "./lib/probe";
import { KEYS, writeStored } from "./lib/storage";
import { isCovered, showCover } from "./ui/cover";

function onHide(kind: "hidden" | "pagehide"): void {
  showCover();
  // 시각 숫자만 둔다. 다른 어떤 것도 같이 두지 않는다.
  writeStored("local", KEYS.lastHiddenAt, String(Date.now()));
  stopHeartbeat();
  emit({ type: "lifecycle", kind, persisted: false });
}

function onShow(kind: LifecycleKind, persisted: boolean): void {
  emit({ type: "lifecycle", kind, persisted });
  void resume();
}

/** 처리기를 달고, 떼는 함수를 돌려준다(시험에서 쓴다). */
export function installLifecycle(): () => void {
  const onVisibility = (): void => {
    if (document.visibilityState === "hidden") onHide("hidden");
    else onShow("visible", false);
  };
  const onPageHide = (): void => onHide("pagehide");
  const onPageShow = (event: PageTransitionEvent): void => onShow("pageshow", event.persisted);
  // 창 자신의 blur·focus만 본다(요소의 blur·focus는 거품이 오르지 않지만, 요소·문서가 target이면 한 번 더 거른다)
  const onBlur = (event: FocusEvent): void => {
    if (event.target instanceof Node) return;
    emit({ type: "lifecycle", kind: "blur", persisted: false });
  };
  const onFocus = (event: FocusEvent): void => {
    if (event.target instanceof Node) return;
    onShow("focus", false);
  };
  // 덮개 위를 누르면 다시 확인한다 — 다시 보였다는 신호가 오지 않은 경우의 안전망
  const onPointerDown = (): void => {
    if (isCovered() && document.visibilityState !== "hidden") void resume();
  };
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("pageshow", onPageShow);
  window.addEventListener("blur", onBlur);
  window.addEventListener("focus", onFocus);
  document.addEventListener("pointerdown", onPointerDown, true);
  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("pageshow", onPageShow);
    window.removeEventListener("blur", onBlur);
    window.removeEventListener("focus", onFocus);
    document.removeEventListener("pointerdown", onPointerDown, true);
  };
}
