// 덮개(D-113 ①)와 보이고 숨는 때의 처리. 잠금과 상관없이 모두 덮는다 — 앱 전환 화면에 기록이 비치지 않게.
// 숨는 순간(visibilitychange hidden·pagehide)에는 같은 이벤트 처리기 안에서 동기로 덮개를 붙인다. 비동기로 미루면
// 기기가 전환 화면을 찍는 때보다 늦을 수 있다(그래도 최선의 노력이다 — 실기기 확인은 T-03).
// 다시 보이면 controller.resume()이 세션을 확인한 뒤 덮개를 걷는다.

import { resume } from "./controller";
import { stopHeartbeat } from "./heartbeat";
import { emit } from "./lib/probe";
import { KEYS, writeStored } from "./lib/storage";
import { showCover } from "./ui/cover";

type Kind = "visible" | "hidden" | "pagehide" | "pageshow";

function onHide(kind: "hidden" | "pagehide"): void {
  showCover();
  // 시각 숫자만 둔다. 다른 어떤 것도 같이 두지 않는다.
  writeStored("local", KEYS.lastHiddenAt, String(Date.now()));
  stopHeartbeat();
  emit({ type: "lifecycle", kind, persisted: false });
}

function onShow(kind: Kind, persisted: boolean): void {
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
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("pageshow", onPageShow);
  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("pageshow", onPageShow);
  };
}
