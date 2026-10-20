// 운영 첫 백업·복원 확인(EVAL_PLAN §14 backup-and-restore-drill, TASK-PERSONAL-01 A-6) — 실제 일기를 넣기 전 한 번.
//   ALLOW_PROD=1 node app/scripts/prod-restore-check.mjs --fresh --reset-dev-data
// 빈 운영(일기·설정 0행)에서만 돈다. 순서: 운영에 가짜 한 편과 부를 이름 → 운영 백업 받기(backup.mjs pull prod)
// → 개발용 비우기 → 그 백업을 개발용에 다시 넣기(backup.mjs restore dev) → 개발용 내보내기가 백업 파일과 같은지(기록·설정)
// → 운영과 개발용의 가짜 데이터·로그인 정리 → 운영이 다시 비었는지.
// 주소·열쇠·토큰은 Git 제외 파일(work/deploy/<env>.*)에서 읽고 찍지 않는다. 개발용의 데이터와 로그인도 지운다(휴대폰 확인 중에는 돌리지 않는다).
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
if (process.env.ALLOW_PROD !== "1" || !process.argv.includes("--fresh") || !process.argv.includes("--reset-dev-data")) {
  console.error("사용법: ALLOW_PROD=1 node app/scripts/prod-restore-check.mjs --fresh --reset-dev-data (빈 운영에서만, 끝에 개발용 데이터와 로그인을 지운다)");
  process.exit(2);
}
const read = (name) => readFileSync(path.join(root, "work", "deploy", name), "utf8").trim();
const ENV = { prod: { base: read("prod.url"), key: read("prod.PHONE-KEY.txt") }, dev: { base: read("dev.url"), key: read("dev.PHONE-KEY.txt") } };
// backup.mjs가 이 PC의 시간대로 받으므로 비교하는 내보내기도 같은 시간대로 받는다(내보내기 머리의 timezone 칸)
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
const CSRF = { "x-requested-with": "emotion-diary" };
const FAKE = "운영 백업 확인용 가짜 사건";
const NAME = "백업확인";

const results = [];
function check(name, ok, detail = "") {
  results.push(ok);
  console.info(`${ok ? "PASS" : "FAIL"}\t${name}${detail ? `\t${detail}` : ""}`);
}

async function api(env, method, pathName, { body, cookie, headers = {} } = {}) {
  const response = await fetch(ENV[env].base + pathName, {
    method,
    headers: {
      "x-timezone": TZ,
      ...(method !== "GET" ? CSRF : {}),
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie: `__Host-session=${cookie}` } : {}),
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  let setCookie = null;
  for (const line of response.headers.getSetCookie()) if (line.startsWith("__Host-session=")) setCookie = line.slice(15).split(";")[0] || null;
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: response.status, json, setCookie };
}

const node = (args) => spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" });
const script = (name) => path.join(root, "app", "scripts", name);
/** 원격 D1에 SQL 한 줄 — 결과 첫 행(읽기) 또는 종료 코드(쓰기) */
function sqlRow(env, sql) {
  const run = node([script("cf.mjs"), env, "sql", sql, "--json"]);
  try {
    return JSON.parse(run.stdout)[0]?.results?.[0] ?? null;
  } catch {
    return null;
  }
}
const sqlRun = (env, sql) => node([script("cf.mjs"), env, "sql", sql]).status === 0;
const COUNT_ALL = "SELECT (SELECT count(*) FROM diary_entries) AS diaries, (SELECT count(*) FROM owner_settings) AS settings";
const RESET_DEV = "DELETE FROM diary_entries; DELETE FROM idempotency_records; DELETE FROM owner_settings; DELETE FROM sessions;";

/** 조각을 모두 이어 받아 하나로 — 내보낸 시각과 다음 조각 칸은 뺀다(같은지 비교용) */
async function exportAll(env, cookie) {
  const diaries = [];
  let head = null;
  let after = null;
  do {
    const reply = await api(env, "GET", after ? `/api/export?after=${after}` : "/api/export", { cookie });
    if (reply.status !== 200) return null;
    head ??= reply.json;
    diaries.push(...reply.json.diaries);
    after = reply.json.next;
  } while (after);
  const { next: _next, exportedAt: _at, ...rest } = head;
  return { ...rest, diaries };
}

const empty = sqlRow("prod", COUNT_ALL);
if (empty?.diaries !== 0 || empty?.settings !== 0) {
  console.error(`운영에 이미 기록·설정이 있다(일기 ${empty?.diaries ?? "?"}행, 설정 ${empty?.settings ?? "?"}행) — 이 확인은 빈 운영에서만 돈다.`);
  process.exit(2);
}

const workDir = mkdtempSync(path.join(os.tmpdir(), "emotion-diary-prod-restore-"));
let prodCookie = null;
try {
  // 1. 운영에 가짜 한 편과 부를 이름
  prodCookie = (await api("prod", "POST", "/api/session", { body: { key: ENV.prod.key } })).setCookie;
  check("운영 로그인", Boolean(prodCookie));
  const today = (await api("prod", "GET", "/api/today", { cookie: prodCookie })).json?.date;
  const taxonomy = JSON.parse(readFileSync(path.join(root, "data", "taxonomy", "v2.json"), "utf8"));
  const joy = taxonomy.categories.find((category) => category.code === "joy").emotions[0].code;
  const draft = { eventText: FAKE, reasonText: "가짜 이유", categories: [{ categoryCode: "joy", intensity: 5 }], emotions: [{ emotionCode: joy }], praises: [{ slot: 1, text: "가짜 칭찬" }], gratitudes: [] };
  const put = await api("prod", "PUT", `/api/diaries/${today}`, { cookie: prodCookie, body: draft, headers: { "idempotency-key": crypto.randomUUID() } });
  const done = await api("prod", "POST", `/api/diaries/${today}/complete`, { cookie: prodCookie, body: { revision: put.json?.revision }, headers: { "idempotency-key": crypto.randomUUID() } });
  const named = await api("prod", "PUT", "/api/settings/profile", { cookie: prodCookie, body: { name: NAME } });
  check("운영에 가짜 한 편 쓰고 완료·부를 이름", put.status === 201 && done.status === 200 && named.status === 200, `${put.status}·${done.status}·${named.status}`);

  // 2. 운영 백업 받기 — 실제 백업과 같은 도구
  const pulled = node([script("backup.mjs"), "pull", "prod", "--dir", workDir]);
  const backupName = readdirSync(workDir).find((name) => /^emotion-diary-\d{4}-\d{2}-\d{2}\.json$/.test(name));
  const backup = backupName ? JSON.parse(readFileSync(path.join(workDir, backupName), "utf8")) : null;
  check("운영 백업 받기(backup.mjs pull prod)", pulled.status === 0 && backup?.diaries?.length === 1 && backup?.displayName === NAME, `${backup?.diaries?.length ?? 0}편`);

  // 3. 개발용을 비우고 그 백업을 다시 넣는다 — '운영이 아닌 곳에 되살린다'
  check("개발용 비우기", sqlRun("dev", RESET_DEV) && sqlRow("dev", COUNT_ALL)?.diaries === 0);
  const restored = node([script("backup.mjs"), "restore", "dev", path.join(workDir, backupName ?? "missing")]);
  check("개발용에 다시 넣기(backup.mjs restore dev)", restored.status === 0, restored.stdout.trim());

  // 4. 개발용 내보내기가 운영 백업과 같은지(기록·설정·순서 — 내보낸 시각만 다름)
  const devCookie = (await api("dev", "POST", "/api/session", { body: { key: ENV.dev.key } })).setCookie;
  const devExport = devCookie ? await exportAll("dev", devCookie) : null;
  const { exportedAt: _at, ...backupBody } = backup ?? {};
  check("개발용에 되살린 내보내기가 운영 백업과 같다", devExport !== null && JSON.stringify(devExport) === JSON.stringify(backupBody), `${devExport?.diaries?.length ?? 0}편, 이름 ${devExport?.displayName === NAME ? "같음" : "다름"}`);
} catch (error) {
  check("확인이 중간에 멈추지 않았다", false, error instanceof Error ? error.name : "오류");
} finally {
  // 5. 정리 — 중간에 멈춰도 늘 한다. 남은 가짜 '오늘' 기록은 그날 실제 일기를 막는다(하루 1편). 운영은 화면과 같은 '모든 기록 지우기' 경로로 지우고,
  // 그 경로가 실패하면(로그인 실패·끊김) 표째 비운다 — 시작할 때 운영이 비어 있음을 확인했으므로 남은 행은 모두 이 확인이 만든 것이다.
  let wiped = null;
  try {
    wiped = prodCookie ? await api("prod", "DELETE", "/api/diaries", { cookie: prodCookie, body: { confirm: "모든 기록 삭제" } }) : null;
  } catch {
    wiped = null;
  }
  const fallback = wiped?.status === 200 ? true : sqlRun("prod", "DELETE FROM diary_entries; DELETE FROM owner_settings;");
  check("운영 가짜 데이터 지우기(모든 기록 지우기 경로)", wiped?.status === 200, `상태 ${wiped?.status ?? "보내지 못함"}${wiped?.status === 200 ? "" : `, 표 비우기 ${fallback ? "함" : "실패"}`}`);
  check("운영 세션·영수증 비우기", sqlRun("prod", "DELETE FROM sessions; DELETE FROM idempotency_records;"));
  const left = sqlRow("prod", "SELECT (SELECT count(*) FROM diary_entries) + (SELECT count(*) FROM owner_settings) + (SELECT count(*) FROM sessions) + (SELECT count(*) FROM idempotency_records) AS n");
  check("운영이 다시 비었다(일기·설정·세션·영수증 0행)", left?.n === 0, `실측: ${left?.n}`);
  check("개발용 정리(데이터·로그인 비움)", sqlRun("dev", RESET_DEV));
  rmSync(workDir, { recursive: true, force: true });
}
const failed = results.filter((ok) => !ok).length;
console.info(`\n${results.length - failed}/${results.length} PASS`);
process.exit(failed ? 1 : 0);
