// 원격(Cloudflare) 명령 보조 — 절차의 정본은 docs/DEPLOY.md.
// 공개 저장소의 wrangler.jsonc에는 계정 id·D1 id·주소가 없다(D-115 ①). 이 스크립트가 이름으로 D1 id를 찾아
// Git 제외 파일 wrangler.local.jsonc를 만든 뒤 --config로 wrangler를 부른다. 열쇠·비밀값을 화면이나 로그에 찍지 않는다.
//
//   node app/scripts/cf.mjs dev create      D1을 만든다(Worker는 첫 deploy에 생긴다) — 만들기 전에 사용자 확인
//   node app/scripts/cf.mjs dev migrate     원격 D1에 마이그레이션을 적용한다
//   node app/scripts/cf.mjs dev deploy      개발용 묶음을 빌드해 비밀값 파일(work/deploy/dev.secrets.env)과 함께 올린다(빌드 번호는 화면·서버 같음)
//   node app/scripts/cf.mjs dev secrets [이름…]  올리지 않고 비밀값만 바꾼다(열쇠 바꾸기)
//   node app/scripts/cf.mjs dev sql "<SQL>" [--json]  원격 D1에 SQL 한 줄(점검·T-07 재현용 — 가짜 데이터만). --json이면 결과를 JSON으로 찍는다
//   node app/scripts/cf.mjs dev tail        실시간 기록(JSON 줄)
//   node app/scripts/cf.mjs dev destroy     Worker와 D1을 지운다(되돌릴 수 없다 — 사용자 확인 뒤)
// 운영(prod, 실제 일기)은 본인 사용 시작(personal-start, D-117)에 만들었다. 운영 명령은 ALLOW_PROD=1일 때만 받는다 —
// 개발용 습관대로 운영에 명령을 보내지 않게 하는 걸쇠다. 운영에는 데이터를 지우는 sql·검사를 쓰지 않는다(docs/DEPLOY.md §8).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildId, buildMode, checkMode } from "./build.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const wranglerJs = path.join(root, "node_modules", "wrangler", "bin", "wrangler.js");
const localConfig = path.join(root, "wrangler.local.jsonc");
const [envName, command, ...rest] = process.argv.slice(2);

function die(message) {
  console.error(message);
  process.exit(1);
}

if (!["dev", "prod"].includes(envName ?? "")) die("사용법: node app/scripts/cf.mjs <dev|prod> <create|secrets|migrate|deploy|sql|tail|destroy> …");
if (envName === "prod" && process.env.ALLOW_PROD !== "1") die("운영(실제 일기) 명령이다. 알고 보낼 때만 ALLOW_PROD=1을 붙인다 — 절차는 docs/DEPLOY.md §8.");

/** 주석 줄(// 로 시작)을 뺀 JSON. wrangler.jsonc는 주석을 줄 단위로만 쓴다. */
function readConfig() {
  const text = readFileSync(path.join(root, "wrangler.jsonc"), "utf8");
  return JSON.parse(text.split(/\r?\n/).filter((line) => !line.trim().startsWith("//")).join("\n"));
}

function wrangler(args, { input, capture = false } = {}) {
  const result = spawnSync(process.execPath, [wranglerJs, ...args], {
    cwd: root,
    input,
    encoding: "utf8",
    stdio: [input === undefined ? "inherit" : "pipe", capture ? "pipe" : "inherit", "inherit"],
    env: { ...process.env, WRANGLER_SEND_METRICS: "false" }
  });
  if (result.status !== 0) die(`wrangler ${args[0]} 실패(종료 코드 ${result.status})`);
  return result.stdout ?? "";
}

const config = readConfig();
const envConfig = config.env?.[envName];
if (!envConfig) die(`wrangler.jsonc에 env.${envName}이 없다`);
const database = envConfig.d1_databases?.[0];
if (!database?.database_name) die(`env.${envName}의 D1 이름이 없다`);

/** 이름으로 D1 id를 찾아 Git 제외 설정을 만든다. id는 이 파일에만 있고 저장소·로그에 남지 않는다. */
function writeLocalConfig() {
  const list = JSON.parse(wrangler(["d1", "list", "--json"], { capture: true }));
  const found = list.find((item) => item.name === database.database_name);
  if (!found) die(`D1 '${database.database_name}'이 계정에 없다 — 먼저 'node app/scripts/cf.mjs ${envName} create'`);
  const local = structuredClone(config);
  local.env[envName].d1_databases = [{ ...database, database_id: found.uuid }];
  writeFileSync(localConfig, `// 자동 생성 — Git 제외(.gitignore). 손으로 고치지 않는다. app/scripts/cf.mjs가 만든다.\n${JSON.stringify(local, null, 2)}\n`);
}

const scoped = (args) => [...args, "--config", localConfig, "--env", envName];

switch (command) {
  case "create": {
    wrangler(["d1", "create", database.database_name, "--location", "apac", "--update-config=false"]); // 설정 파일에 id를 쓰지 않는다(D-115 ①)
    console.info(`D1 '${database.database_name}'을 만들었다. Worker '${config.name}-${envName}'는 첫 deploy에 생긴다.`);
    break;
  }
  case "secrets": {
    const file = path.join(root, "work", "deploy", `${envName}.secrets.env`);
    if (!existsSync(file)) die(`비밀값 파일이 없다 — 먼저 'node app/scripts/make-secrets.mjs ${envName} all'`);
    writeLocalConfig();
    // BACKUP_TOKEN_HASH는 선택(D-109 PC 백업) — 파일에 있을 때만 올린다
    const names = ["ACCESS_KEY_HASH", "ACCESS_KEY_SALT", "SESSION_SECRET", "APP_LOCK_SECRET", "BACKUP_TOKEN_HASH"];
    const values = Object.fromEntries(
      readFileSync(file, "utf8").split(/\r?\n/).filter((line) => line.includes("=")).map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)])
    );
    const only = rest.length ? rest : names.filter((name) => values[name]);
    for (const name of only) {
      if (!names.includes(name) || !values[name]) die(`비밀값 '${name}'이 파일에 없다`);
      // 값은 표준 입력으로만 넘긴다 — 명령줄 인자·로그에 남지 않게.
      wrangler(scoped(["secret", "put", name]), { input: values[name] });
    }
    console.info(`비밀값 ${only.length}개를 올렸다(값은 찍지 않는다). 전파에 20초쯤 걸린다.`);
    break;
  }
  case "migrate": {
    writeLocalConfig();
    wrangler(scoped(["d1", "migrations", "apply", database.database_name, "--remote"]));
    break;
  }
  case "deploy": {
    // 비밀값은 올리는 버전과 함께 파일로 넘긴다(--secrets-file) — 첫 올리기에도 비밀값이 빠진 순간이 없고, 값이 명령줄에 오르지 않는다.
    const secretsFile = path.join(root, "work", "deploy", `${envName}.secrets.env`);
    if (!existsSync(secretsFile)) die(`비밀값 파일이 없다 — 먼저 'node app/scripts/make-secrets.mjs ${envName} all'`);
    const id = buildId();
    buildMode(envName, id);
    const failures = checkMode(envName, id);
    if (failures.length) die(failures.join("\n"));
    writeLocalConfig();
    const output = wrangler(scoped(["deploy", "--secrets-file", secretsFile, "--define", `__APP_BUILD__:${JSON.stringify(id)}`]), { capture: true });
    process.stdout.write(output);
    // 앱 주소(계정 하위 도메인이 들어 있다)는 Git 제외 파일에만 둔다 — remote-check.mjs가 읽는다.
    const url = output.match(/https:\/\/[a-z0-9.-]+\.workers\.dev/)?.[0];
    if (url) writeFileSync(path.join(root, "work", "deploy", `${envName}.url`), `${url}\n`);
    console.info(`올렸다: 빌드 ${id}`);
    break;
  }
  case "sql": {
    if (!rest[0]) die("SQL 한 줄을 따옴표로 준다");
    writeLocalConfig();
    // `--json`을 붙이면 결과를 JSON으로 받아 그대로 찍는다(remote-check.mjs가 읽는다).
    if (rest[1] === "--json") process.stdout.write(wrangler(scoped(["d1", "execute", database.database_name, "--remote", "--json", "--command", rest[0]]), { capture: true }));
    else wrangler(scoped(["d1", "execute", database.database_name, "--remote", "--command", rest[0]]));
    break;
  }
  case "tail": {
    writeLocalConfig();
    wrangler(scoped(["tail", "--format", "json"]));
    break;
  }
  case "destroy": {
    if (process.env.CONFIRM_DESTROY !== `${config.name}-${envName}`) die(`되돌릴 수 없다. 사용자 확인 뒤 CONFIRM_DESTROY=${config.name}-${envName}로 다시 부른다.`);
    writeLocalConfig();
    wrangler(scoped(["delete", "--force"]));
    wrangler(["d1", "delete", database.database_name, "--skip-confirmation"]);
    break;
  }
  default:
    die(`모르는 명령: ${command}`);
}
