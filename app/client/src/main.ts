// 앱 진입점. 처음엔 도구 없이 TypeScript + DOM(D-114), 2026-11-11부터 새 화면은 Preact(D-127 — lib/mount.ts). Vite는 묶기만 한다.
// 순서가 중요하다: 오류 처리기와 덮개 처리기를 가장 먼저 달고(시작이 늦어져도 앱을 떠나는 순간은 덮어야 한다), 그다음 시작한다.

import "./styles/fonts.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/v4.css";
import "./styles/scenes.css";
import "./styles/write.css";
import "./styles/help.css";
import "./styles/calendar.css";
import "./styles/stats.css";
import "./styles/settings.css";
import { boot, initController } from "./controller";
import { installErrorHandlers } from "./errors";
import { installLifecycle } from "./lifecycle";
import { installViewportInset } from "./lib/viewport";
import { registerViews } from "./router";
import { applyTokens } from "./tokens";
import { renderAuth } from "./views/auth";
import { renderCalendar } from "./views/calendar";
import { renderDeleteAll, renderDeleted } from "./views/deleteAll";
import { renderDone } from "./views/done";
import { renderExportData } from "./views/exportData";
import { renderHelp } from "./views/help";
import { renderLockSettings } from "./views/lockSettings";
import { renderName } from "./views/name";
import { renderPinSetup } from "./views/pinSetup";
import { renderRecord } from "./views/record";
import { renderSettings } from "./views/settings";
import { renderFriendDetail, renderStats } from "./views/stats";
import { renderToday } from "./views/today";
import { renderWelcome } from "./views/welcome";
import { renderWrite } from "./views/write";
import { installWriteLifecycle } from "./write/lifecycle";

applyTokens();
installErrorHandlers();
installLifecycle();
installViewportInset();
installWriteLifecycle();
initController();
registerViews({
  auth: renderAuth,
  "auth/name": renderName,
  welcome: renderWelcome,
  today: renderToday,
  calendar: renderCalendar,
  stats: renderStats,
  "stats/:category": renderFriendDetail,
  settings: renderSettings,
  "settings/lock": renderLockSettings,
  "settings/pin": renderPinSetup,
  "settings/export": renderExportData,
  "settings/delete": renderDeleteAll,
  "settings/deleted": renderDeleted,
  help: renderHelp,
  "write/:date": renderWrite,
  "record/:date": renderRecord,
  "done/:date": renderDone
});

// 개발용 묶음(상태 칸·오류 보고)은 운영 묶음에서 코드째 빠진다 — 반드시 이 조건 안의 동적 import로만 부른다(D-115 ②).
if (__APP_ENV__ !== "prod") {
  void import("./dev/index").then((dev) => dev.startDev());
}

void boot();
