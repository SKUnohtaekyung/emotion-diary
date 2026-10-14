// 화면 신호(T3 A-16). 로그인됨·잠기지 않음·화면이 보이는 동안 HEARTBEAT_MS마다 POST /api/session/heartbeat.
// 서버는 이 신호로 '떠나 있던 시간'을 재서 5분 넘게 신호가 없던 세션을 잠근다(ARCHITECTURE §6). 화면이 숨으면 멈춘다 —
// iPhone은 뒤로 간 앱의 타이머를 멈추므로 돌아온 뒤 밀린 타이머에 기대지 않고, 보이게 되면 먼저 세션을 확인한 다음 다시 시작한다.
// 423(잠김)·401(풀림)은 request의 처리기가 맡는다. 네트워크가 끊긴 신호는 조용히 넘어간다.

import { API, HEARTBEAT_MS } from "../../shared/api";
import { request } from "./lib/api";
import { app } from "./state";

let timer: number | undefined;

function shouldBeat(): boolean {
  return app.authenticated && !app.locked && document.visibilityState === "visible";
}

async function beat(): Promise<void> {
  if (!shouldBeat()) {
    stopHeartbeat();
    return;
  }
  await request("POST", API.heartbeat);
}

export function stopHeartbeat(): void {
  if (timer === undefined) return;
  window.clearInterval(timer);
  timer = undefined;
}

/** 지금 상태에 맞게 켜거나 끈다. 상태가 바뀔 때마다 부른다. */
export function syncHeartbeat(): void {
  if (!shouldBeat()) {
    stopHeartbeat();
    return;
  }
  if (timer !== undefined) return;
  timer = window.setInterval(() => {
    void beat();
  }, HEARTBEAT_MS);
}

export function isHeartbeatRunning(): boolean {
  return timer !== undefined;
}
