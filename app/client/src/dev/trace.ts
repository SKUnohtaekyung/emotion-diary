// 개발용 상태 칸이 보여 줄 기록을 모은다. probe 사건에서 경로·상태 번호·시각 종류만 받는다.
// 입력한 글·열쇠·이름·비밀번호는 이 모듈에 들어오는 길이 없다(사건에 실리지 않는다).

import { API } from "../../../shared/api";
import type { ClientErrorReport } from "../../../shared/dev";
import { maskApiPath } from "../lib/errorInfo";
import type { LifecycleKind, ProbeEvent } from "../lib/probe";

export interface LifecycleRow {
  kind: LifecycleKind;
  persisted: boolean;
  at: number;
}

export interface StartLockRow {
  navType: string;
  hasMarker: boolean;
  lock: boolean;
  reason: string;
}

export interface Trace {
  lifecycle: LifecycleRow[];
  lastApi: { path: string; status: number } | null;
  heartbeat: { count: number; lastStatus: number | null };
  startLock: StartLockRow | null;
  lastError: ClientErrorReport | null;
}

const LIFECYCLE_KEEP = 10;

export function createTrace(): Trace {
  return {
    lifecycle: [],
    lastApi: null,
    heartbeat: { count: 0, lastStatus: null },
    startLock: null,
    lastError: null
  };
}

export function record(trace: Trace, event: ProbeEvent, now: number = Date.now()): void {
  if (event.type === "api") {
    const path = maskApiPath(event.path);
    trace.lastApi = { path, status: event.status };
    if (event.method === "POST" && path === API.heartbeat) {
      trace.heartbeat.count += 1;
      trace.heartbeat.lastStatus = event.status;
    }
  } else if (event.type === "lifecycle") {
    trace.lifecycle.push({ kind: event.kind, persisted: event.persisted, at: now });
    if (trace.lifecycle.length > LIFECYCLE_KEEP) trace.lifecycle.shift();
  } else if (event.type === "startLock") {
    trace.startLock = {
      navType: event.navType,
      hasMarker: event.hasMarker,
      lock: event.lock,
      reason: event.reason
    };
  }
}

export function clock(at: number): string {
  const date = new Date(at);
  const two = (value: number): string => String(value).padStart(2, "0");
  return `${two(date.getHours())}:${two(date.getMinutes())}:${two(date.getSeconds())}`;
}
