// 개발용 묶음의 입구(D-113 ②, D-115 ②·⑤). 운영 묶음에서는 코드째 빠진다 — main.ts가 `__APP_ENV__ !== "prod"` 안에서만 동적으로 부른다.
// 하는 일: ① 상태 칸을 붙인다 ② 화면 오류를 정리해 서버에 보고한다(로그인됨·잠기지 않음일 때만, 실패해도 조용히).
// 서버에 보내는 것은 정리된 일곱 칸뿐이다. 메시지·stack·입력값은 보내지 않는다.

import { CLIENT_ERRORS_PATH } from "../../../shared/dev";
import { request } from "../lib/api";
import { APP_BUILD } from "../lib/build";
import { listen, type ProbeEvent } from "../lib/probe";
import { app } from "../state";
import { startKeyboardLab } from "./keyboard";
import { mountPanel, type Panel } from "./panel";
import "./panel.css";
import { apiReport, toReport } from "./report";
import { createTrace, record } from "./trace";

/** 시작하고, 멈추는 함수를 돌려준다(시험에서 쓴다). */
export function startDev(): () => void {
  const trace = createTrace();
  // 자판 실험(TASK-PERSONAL-01 A-8) — 측정이 쌓이면 펼친 상태 칸을 다시 그린다(칸은 실험 다음에 붙는다)
  const redraw: { panel: Panel | null } = { panel: null };
  const lab = startKeyboardLab(() => redraw.panel?.refresh());
  const panel = mountPanel(trace, lab);
  redraw.panel = panel;

  const send = (report: NonNullable<ReturnType<typeof toReport>>): void => {
    trace.lastError = report;
    // 잠기지 않은 로그인 상태에서만 보낸다. 아니면 상태 칸에만 남는다.
    if (!app.authenticated || app.locked) return;
    void request("POST", CLIENT_ERRORS_PATH, { body: report, intercept: false });
  };

  const onEvent = (event: ProbeEvent): void => {
    record(trace, event);
    if (event.type === "error") {
      const report = toReport(event.error, location.hash, APP_BUILD);
      if (report) send(report);
    } else if (event.type === "api" && event.status >= 500 && event.path !== CLIENT_ERRORS_PATH) {
      const report = apiReport(event.path, event.status, location.hash, APP_BUILD);
      if (report) send(report);
    }
    panel.refresh();
  };
  // 이 모듈이 늦게 불러와져도 그 전에 생긴 사건(시작 잠금 판단 등)을 이어서 받는다
  const stop = listen(onEvent);
  return () => {
    stop();
    lab.stop();
    panel.destroy();
  };
}
