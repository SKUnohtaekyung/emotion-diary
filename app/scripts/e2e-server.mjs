// 실제 브라우저 E2E(npm run e2e)가 붙는 로컬 서버. Playwright의 webServer가 띄운다 — 손으로 부를 일은 없다.
// app/scripts/dev.mjs와 다른 점(TASK-SLICE-01 PLAN A-1, 5-1 실측):
// - https(wrangler의 자가 서명 인증서)로 연다. http://localhost에서는 Playwright WebKit이 __Host- cookie를 받고도 다음 요청에
//   싣지 않아 로그인이 끊긴다(2026-10-16 실측 — Chromium은 http에서도 된다). 시험 쪽은 인증서 오류를 무시한다.
// - 포트와 로컬 D1 폴더가 따로다(8788, .wrangler/e2e-state) — 사용자가 띄운 npm run dev(8787, .wrangler/state)와 섞이지 않는다.
//   시작할 때마다 그 폴더를 지워 빈 창고에서 시작한다.
// 로컬 비밀값은 .dev.vars(Git 제외)다 — 없으면 'node app/scripts/make-secrets.mjs local all'로 먼저 만든다(CI도 그렇게 한다).
import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildId, buildMode } from "./build.mjs";

export const E2E_PORT = 8788;
const INSPECTOR_PORT = 9330;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const wranglerJs = path.join(root, "node_modules", "wrangler", "bin", "wrangler.js");
const persistTo = path.join(root, ".wrangler", "e2e-state");

function main() {
  if (!existsSync(path.join(root, ".dev.vars"))) {
    console.error("로컬 비밀값(.dev.vars)이 없다 — node app/scripts/make-secrets.mjs local all");
    process.exit(1);
  }
  rmSync(persistTo, { recursive: true, force: true });
  const id = buildId();
  buildMode("dev", id);
  const env = { ...process.env, WRANGLER_SEND_METRICS: "false" };
  const migrate = spawnSync(
    process.execPath,
    [wranglerJs, "d1", "migrations", "apply", "emotion-diary-local", "--local", "--persist-to", persistTo],
    { cwd: root, stdio: "inherit", env }
  );
  if (migrate.status !== 0) process.exit(migrate.status ?? 1);
  const dev = spawnSync(
    process.execPath,
    [
      wranglerJs,
      "dev",
      "--local-protocol",
      "https",
      "--port",
      String(E2E_PORT),
      "--inspector-port",
      String(INSPECTOR_PORT),
      "--persist-to",
      persistTo,
      "--define",
      `__APP_BUILD__:${JSON.stringify(id)}`
    ],
    { cwd: root, stdio: "inherit", env }
  );
  process.exit(dev.status ?? 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
