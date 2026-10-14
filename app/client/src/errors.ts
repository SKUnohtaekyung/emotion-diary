// 예상하지 못한 오류를 잡는다(D-113 ②, T3 A-6): window error·unhandledrejection, 그리고 화면 그리기 중 난 예외(router가 넘겨 준다).
// 운영에서는 '문제가 생겼어요'와 오류 번호만 보이고 서버로 아무것도 보내지 않는다. 개발용 보고는 probe로 넘겨
// 개발용 모듈(dev/)이 맡는다 — 이 파일은 개발용 경로 이름을 모른다.

import type { ErrorLike } from "./lib/errorInfo";
import { emit } from "./lib/probe";
import { showCrash } from "./ui/crash";

function nameOf(value: unknown): unknown {
  return typeof value === "object" && value !== null ? (value as { name?: unknown }).name : undefined;
}

/** 오류 하나를 처리한다: 개발용 통로로 알리고 오류 화면을 보인다. */
export function handleFatal(error: ErrorLike): void {
  emit({ type: "error", error });
  showCrash(error);
}

/** 처리기를 달고, 떼는 함수를 돌려준다(시험에서 쓴다). */
export function installErrorHandlers(): () => void {
  const onError = (event: ErrorEvent): void => {
    handleFatal({
      kind: "error",
      name: nameOf(event.error),
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  };
  const onRejection = (event: PromiseRejectionEvent): void => {
    // 거절 사유에는 파일 위치가 없다 — 종류 이름만 쓴다
    handleFatal({ kind: "unhandledrejection", name: nameOf(event.reason) });
  };
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}
