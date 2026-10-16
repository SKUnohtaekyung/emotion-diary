// 앱 시험(D-115 ⑥). 서버 시험은 Node에서 Worker 코드를 직접 부르고 D1은 wrangler getPlatformProxy가 띄운
// 로컬 D1(workerd)을 쓴다. 화면 시험은 happy-dom에서 돈다.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "worker",
          include: ["app/test/worker/**/*.test.ts"],
          environment: "node",
          testTimeout: 30_000,
          hookTimeout: 120_000,
          // 시험 파일마다 workerd를 하나씩 띄운다 — 동시에 여럿 띄우지 않는다(Windows에서 느려진다).
          fileParallelism: false
        }
      },
      {
        define: { __APP_ENV__: JSON.stringify("dev"), __APP_BUILD__: JSON.stringify("test-build") },
        test: {
          name: "client",
          include: ["app/test/client/**/*.test.ts"],
          environment: "happy-dom"
        }
      }
    ]
  }
});
