// 앱 진입점. 도구 없이 TypeScript + DOM으로 짓는다(D-114). Vite는 묶기만 한다.
// 순서가 중요하다: 오류 처리기와 덮개 처리기를 가장 먼저 달고(시작이 늦어져도 앱을 떠나는 순간은 덮어야 한다), 그다음 시작한다.

import "./styles/fonts.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/scenes.css";
import { boot, initController } from "./controller";
import { installErrorHandlers } from "./errors";
import { installLifecycle } from "./lifecycle";
import { registerViews } from "./router";
import { applyTokens } from "./tokens";
import { renderAuth } from "./views/auth";
import { renderLockSettings } from "./views/lockSettings";
import { renderName } from "./views/name";
import { renderPinSetup } from "./views/pinSetup";
import { renderToday } from "./views/today";
import { renderWelcome } from "./views/welcome";

applyTokens();
installErrorHandlers();
installLifecycle();
initController();
registerViews({
  auth: renderAuth,
  "auth/name": renderName,
  welcome: renderWelcome,
  today: renderToday,
  "settings/lock": renderLockSettings,
  "settings/pin": renderPinSetup
});

// 개발용 묶음(상태 칸·오류 보고)은 운영 묶음에서 코드째 빠진다 — 반드시 이 조건 안의 동적 import로만 부른다(D-115 ②).
if (__APP_ENV__ !== "prod") {
  void import("./dev/index").then((dev) => dev.startDev());
}

void boot();
