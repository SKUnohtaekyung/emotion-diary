// 이 PC에서 앱을 띄운다(npm run dev). 개발용 묶음을 빌드하고 로컬 D1에 마이그레이션을 적용한 뒤 wrangler dev로 연다.
// 로컬 비밀값은 .dev.vars(Git 제외)다 — 없으면 'node app/scripts/make-secrets.mjs local all'로 먼저 만든다.
// 로컬은 http://localhost라 __Host- cookie가 Chrome·Edge에서만 된다(Secure 예외). iPhone 확인은 개발용 건물로 한다.
import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildId, buildMode } from "./build.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const wranglerJs = path.join(root, "node_modules", "wrangler", "bin", "wrangler.js");

if (!existsSync(path.join(root, ".dev.vars"))) {
  console.error("로컬 비밀값(.dev.vars)이 없다 — node app/scripts/make-secrets.mjs local all");
  process.exit(1);
}
const id = buildId();
buildMode("dev", id);
const env = { ...process.env, WRANGLER_SEND_METRICS: "false" };
const migrate = spawnSync(process.execPath, [wranglerJs, "d1", "migrations", "apply", "emotion-diary-local", "--local"], { cwd: root, stdio: "inherit", env });
if (migrate.status !== 0) process.exit(migrate.status ?? 1);
spawnSync(process.execPath, [wranglerJs, "dev", "--define", `__APP_BUILD__:${JSON.stringify(id)}`], { cwd: root, stdio: "inherit", env });
