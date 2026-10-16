// 실제 브라우저 E2E(TASK-SLICE-01 PLAN A-1). npm run e2e. 같은 시나리오를 WebKit(첫째)과 Chromium(둘째)에서 돈다.
// 서버는 app/scripts/e2e-server.mjs(https, 포트 8788, 시험 전용 로컬 D1)를 Playwright가 띄우고 끝나면 내린다.
// 대신하지 못하는 것 — 홈 화면 앱 모드, iPhone 자판, 앱 전환 화면, 앱을 완전히 닫았다 열기 — 은 휴대폰 확인 mobile-slice다.
import { defineConfig, devices } from "@playwright/test";

const PORT = 8788;
const baseURL = `https://localhost:${PORT}`;

export default defineConfig({
  testDir: "app/test/e2e",
  // 모든 시나리오가 같은 주인(owner)의 같은 '오늘'을 쓴다 — 동시에 돌리면 서로의 기록을 건드린다.
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    trace: "retain-on-failure"
  },
  projects: [
    // 화면 폭은 iPhone 대신 360×740(UX_SPEC §12의 가장 좁은 폭). 기기 흉내(사용자 에이전트·터치)는 쓰지 않는다 — 실기기가 따로 본다.
    { name: "webkit", use: { ...devices["Desktop Safari"], viewport: { width: 360, height: 740 } } },
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 740 } } }
  ],
  webServer: {
    command: "node app/scripts/e2e-server.mjs",
    url: `${baseURL}/api/session`,
    ignoreHTTPSErrors: true,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: "ignore",
    stderr: "pipe"
  }
});
