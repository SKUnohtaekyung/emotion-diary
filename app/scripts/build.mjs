// 앱 빌드(npm run build). 화면(Vite)과 서버(wrangler deploy --dry-run)를 개발용·운영용 두 벌로 묶고 검사한다.
//   node app/scripts/build.mjs            두 벌 모두(검사용 — verify full이 부른다)
//   node app/scripts/build.mjs dev        한 벌만(올리기 직전 — app/scripts/cf.mjs가 부른다)
// 빌드 번호(D-115 ④)는 APP_BUILD 환경 변수가 있으면 그 값, 없으면 'UTC 시각-커밋 앞 7자'다. 화면과 서버에 같은 값이 들어간다.
// 검사: 운영 묶음에 개발용 전용 코드 표식이 0건(D-115 ②), 개발용 묶음에는 있다(검사가 헛돌지 않게),
// 첫 화면 파일에 인라인 스크립트·style 속성이 없다(CSP, T3 A-8), manifest 시작 주소에 query가 없다(ARCHITECTURE §2.2),
// Git 제외 비밀값 파일의 값이 묶음에 0건.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const MODES = ["dev", "prod"];
const DEV_MARKERS = ["client-errors", "client_errors", "dev-panel"];

export function buildId() {
  if (process.env.APP_BUILD) return process.env.APP_BUILD;
  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const git = spawnSync("git", ["rev-parse", "--short=7", "HEAD"], { cwd: root, encoding: "utf8" });
  return `${stamp}-${git.status === 0 ? git.stdout.trim() : "nogit"}`;
}

function run(command, args, env = {}) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", env: { ...process.env, ...env } });
  if (result.status !== 0) throw new Error(`실패: ${command} ${args.join(" ")}`);
}

function filesUnder(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(absolute) : [absolute];
  });
}

const textOf = (file) => (/\.(js|mjs|html|css|json|webmanifest|txt|map)$/.test(file) || path.basename(file) === "_headers" ? readFileSync(file, "utf8") : "");

/** Git 제외 비밀값 파일(app/scripts/make-secrets.mjs가 만든다)의 값들. 없으면 빈 목록. */
function localSecretValues() {
  const values = [];
  const candidates = [path.join(root, ".dev.vars"), ...filesUnder(path.join(root, "work", "deploy")).filter((file) => file.endsWith(".secrets.env"))];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const value = line.split("=").slice(1).join("=").trim().replace(/^"|"$/g, "");
      if (value.length >= 16) values.push(value);
    }
  }
  return values;
}

export function buildMode(mode, id) {
  const out = path.join(root, "dist", mode);
  run(process.execPath, [path.join(root, "node_modules", "vite", "bin", "vite.js"), "build", "--mode", mode, "--logLevel", "warn"], { APP_BUILD: id });
  // Pretendard는 SIL OFL 1.1 — 내주는 사본에 라이선스를 함께 둔다(design/fonts/README.md).
  mkdirSync(path.join(out, "client", "licenses"), { recursive: true });
  cpSync(path.join(root, "design", "fonts", "PRETENDARD-LICENSE.txt"), path.join(out, "client", "licenses", "PRETENDARD-LICENSE.txt"));
  run(process.execPath, [
    path.join(root, "node_modules", "wrangler", "bin", "wrangler.js"),
    "deploy", "--dry-run", "--env", mode, "--outdir", path.join(out, "worker"),
    "--define", `__APP_BUILD__:${JSON.stringify(id)}`
  ], { WRANGLER_SEND_METRICS: "false" });
}

export function checkMode(mode, id) {
  const failures = [];
  const out = path.join(root, "dist", mode);
  const files = filesUnder(out).filter((file) => statSync(file).isFile());
  const texts = files.map((file) => [path.relative(root, file), textOf(file)]);
  const found = (marker) => texts.filter(([, text]) => text.includes(marker)).map(([file]) => file);
  for (const marker of DEV_MARKERS) {
    const hits = found(marker);
    if (mode === "prod" && hits.length) failures.push(`운영 묶음에 개발용 표식 '${marker}': ${hits.join(", ")}`);
  }
  if (mode === "dev" && !found("client-errors").some((file) => file.includes(`${path.sep}worker${path.sep}`))) failures.push("개발용 서버 묶음에 오류 보고 경로가 없다(검사가 헛돈다)");
  if (mode === "dev" && found("dev-panel").length === 0) failures.push("개발용 화면 묶음에 상태 칸이 없다(검사가 헛돈다)");
  for (const part of ["client", "worker"]) {
    if (!texts.some(([file, text]) => file.includes(`${path.sep}${part}${path.sep}`) && text.includes(id))) failures.push(`${part} 묶음에 빌드 번호 ${id}가 없다`);
  }
  const html = readFileSync(path.join(out, "client", "index.html"), "utf8");
  if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(html)) failures.push("index.html에 인라인 스크립트가 있다(CSP)");
  if (/\sstyle=/i.test(html) || /<style[\s>]/i.test(html)) failures.push("index.html에 style 속성·요소가 있다(CSP)");
  const manifest = JSON.parse(readFileSync(path.join(out, "client", "manifest.webmanifest"), "utf8"));
  if (manifest.start_url !== "/" || manifest.scope !== "/") failures.push("manifest의 start_url·scope는 '/'여야 한다(열쇠·query 없음)");
  // 홈 화면 이름으로 개발용과 실제 앱을 가른다(vite.config.ts의 appName) — 실제 일기를 개발용 건물에 쓰지 않게.
  const expectedName = mode === "dev" ? "감정일기 개발" : "감정일기";
  if (manifest.name !== expectedName || !html.includes(`content="${expectedName}"`)) failures.push(`홈 화면 이름이 '${expectedName}'가 아니다`);
  if (!existsSync(path.join(out, "client", "_headers"))) failures.push("정적 파일 헤더(_headers)가 묶음에 없다");
  for (const secret of localSecretValues()) {
    const hits = texts.filter(([, text]) => text.includes(secret)).map(([file]) => file);
    if (hits.length) failures.push(`비밀값이 묶음에 있다: ${hits.join(", ")}`);
  }
  return failures;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const requested = process.argv[2];
  if (requested && !MODES.includes(requested)) {
    console.error(`사용법: node app/scripts/build.mjs [${MODES.join("|")}]`);
    process.exit(2);
  }
  const id = buildId();
  const failures = [];
  for (const mode of requested ? [requested] : MODES) {
    buildMode(mode, id);
    failures.push(...checkMode(mode, id).map((message) => `[${mode}] ${message}`));
  }
  if (failures.length) {
    console.error(failures.join("\n"));
    process.exit(1);
  }
  console.info(`빌드 완료: ${id} (${(requested ? [requested] : MODES).join(", ")})`);
}
