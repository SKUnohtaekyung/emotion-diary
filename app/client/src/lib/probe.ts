// 개발용 상태 칸이 들여다보는 사건 통로. 운영 묶음에서는 아무것도 하지 않는다.
// 개발용 모듈은 비동기로 늦게 불러오므로, 그 전에 생긴 사건은 작은 보관함에 두었다가 들어올 때 한 번에 넘긴다.
// 사건에는 입력한 글·열쇠·이름·비밀번호를 싣지 않는다 — 경로(query 없음)·상태 번호·시각 종류만.

import { APP_ENV } from "./build";
import type { ErrorLike } from "./errorInfo";

/** 보임·숨김 사건 종류. blur·focus는 창이 초점을 잃고 되찾을 때(앱 전환 화면에 들어갈 때 오는지 실기기로 본다 — T-03). */
export type LifecycleKind = "visible" | "hidden" | "pagehide" | "pageshow" | "blur" | "focus";

export type ProbeEvent =
  | { type: "api"; method: string; path: string; status: number }
  | { type: "lifecycle"; kind: LifecycleKind; persisted: boolean }
  | { type: "startLock"; navType: string; hasMarker: boolean; lock: boolean; reason: string }
  | { type: "error"; error: ErrorLike };

type Listener = (event: ProbeEvent) => void;

const listeners = new Set<Listener>();
const backlog: ProbeEvent[] = [];
const BACKLOG_MAX = 50;

export function emit(event: ProbeEvent): void {
  if (APP_ENV === "prod") return;
  if (listeners.size === 0) {
    backlog.push(event);
    if (backlog.length > BACKLOG_MAX) backlog.shift();
    return;
  }
  for (const listener of listeners) listener(event);
}

export function listen(listener: Listener): () => void {
  listeners.add(listener);
  for (const event of backlog.splice(0)) listener(event);
  return () => {
    listeners.delete(listener);
  };
}
