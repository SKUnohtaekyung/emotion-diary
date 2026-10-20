// PC 백업과 다시 넣기(D-109 2차 백업, DATA_MODEL §8 '보존', TASK-DATA-02). 이 PC에서만 돈다 — 서버는 Bearer 전용 경로만 낸다.
//   node app/scripts/backup.mjs pull <dev|prod> [--dir <폴더>]       내보내기 파일 하나를 받아 날짜 이름으로 저장하고 30일 지난 파일을 지운다
//   node app/scripts/backup.mjs restore <dev|prod> <파일> [--dry-run]  백업 파일을 조각으로 다시 넣는다(이미 있는 날짜는 건너뛴다)
//   node app/scripts/backup.mjs schedule-command <dev|prod> [--dir <폴더>]  매일 실행 등록 명령(작업 스케줄러)을 출력만 한다 — 실행하지 않는다
// 주소·토큰은 Git 제외 파일(work/deploy/<env>.url, <env>.BACKUP-TOKEN.txt)에서 읽고 화면에 찍지 않는다. 일기 글도 찍지 않는다(건수만).
// 기본 폴더는 <홈>/emotion-diary-backup/<env> — 클라우드 동기화 폴더(OneDrive·Dropbox·Google Drive·iCloud) 안은 거부한다(D-109).
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const KEEP_DAYS = 30;
const CHUNK_BYTES = 300 * 1024; // 서버 한도 1MiB보다 넉넉히 작게
const CHUNK_ENTRIES = 100; // 서버 상한 200 — 100편 조각의 Worker 안 계산이 약 2ms(무료 10ms, export-cpu.test.ts)
const FILE_NAME = /^emotion-diary-(\d{4}-\d{2}-\d{2})\.json$/;
const SYNCED = /onedrive|dropbox|google ?drive|icloud/i;

function die(message) {
  console.error(message);
  process.exit(1);
}

const [command, envName, ...rest] = process.argv.slice(2);
if (!["pull", "restore", "schedule-command"].includes(command ?? "") || !["dev", "prod"].includes(envName ?? "")) {
  die("사용법: node app/scripts/backup.mjs <pull|restore|schedule-command> <dev|prod> …");
}
// 운영에 쓰는 명령(다시 넣기)은 걸쇠를 요구한다. 받기는 읽기뿐이라 매일 예약 실행이 그대로 돈다(docs/DEPLOY.md §8).
if (command === "restore" && envName === "prod" && process.env.ALLOW_PROD !== "1") die("운영(실제 일기)에 다시 넣는 명령이다. 알고 보낼 때만 ALLOW_PROD=1을 붙인다.");
const flag = (name) => {
  const index = rest.indexOf(name);
  return index >= 0 ? rest[index + 1] : undefined;
};
const dir = path.resolve(flag("--dir") ?? path.join(os.homedir(), "emotion-diary-backup", envName));
if (SYNCED.test(dir)) die(`클라우드 동기화 폴더에는 두지 않는다(D-109): ${dir}`);

const readDeploy = (name) => {
  const file = path.join(root, "work", "deploy", name);
  if (!existsSync(file)) die(`${path.relative(root, file)}이 없다 — ${name.endsWith(".url") ? "먼저 올린다(cf.mjs deploy)" : "먼저 node app/scripts/make-secrets.mjs <env> backup"}`);
  return readFileSync(file, "utf8").trim();
};

/** 이 PC의 지금 날짜(로컬 시계) — 파일 이름과 30일 셈에 쓴다. */
function localDate(ms = Date.now()) {
  const date = new Date(ms);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

async function api(method, pathName, body) {
  const base = readDeploy(`${envName}.url`);
  const token = readDeploy(`${envName}.BACKUP-TOKEN.txt`);
  const response = await fetch(base + pathName, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      "x-timezone": timeZone,
      ...(body === undefined ? {} : { "content-type": "application/json" })
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: response.status, json };
}

/** 모든 조각을 이어 받아 내보내기 파일 하나로(화면의 내보내기와 같은 모양 — next 칸은 뺀다). */
async function fetchExport() {
  const diaries = [];
  let first = null;
  let after = null;
  for (let page = 0; page < 10_000; page += 1) {
    const reply = await api("GET", after ? `/api/backup/export?after=${after}` : "/api/backup/export");
    if (reply.status !== 200 || reply.json?.schemaVersion !== "emotion-diary-export-v1" || !Array.isArray(reply.json.diaries)) {
      die(`백업을 받지 못했다(상태 ${reply.status}${reply.json?.error ? `, ${reply.json.error}` : ""})`);
    }
    first ??= reply.json;
    diaries.push(...reply.json.diaries);
    after = reply.json.next;
    if (!after) break;
  }
  const { next: _next, ...head } = first;
  return { ...head, diaries };
}

async function pull() {
  mkdirSync(dir, { recursive: true });
  const file = await fetchExport();
  const name = `emotion-diary-${localDate()}.json`;
  const target = path.join(dir, name);
  const temporary = `${target}.part`;
  writeFileSync(temporary, `${JSON.stringify(file, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporary, target);
  // 30일 지난 파일을 지운다(이름의 날짜로 센다 — 파일 시각은 복사·동기화로 바뀔 수 있다)
  const cutoff = localDate(Date.now() - KEEP_DAYS * 86_400_000);
  const removed = [];
  for (const entry of readdirSync(dir)) {
    const match = FILE_NAME.exec(entry);
    if (match?.[1] && match[1] < cutoff) {
      rmSync(path.join(dir, entry));
      removed.push(entry);
    }
  }
  console.info(`백업: ${name} — 기록 ${file.diaries.length}편, ${removed.length}개 정리(${KEEP_DAYS}일 지남). 폴더 ${dir}`);
}

function chunks(diaries) {
  const out = [];
  let current = [];
  let size = 0;
  for (const entry of diaries) {
    const bytes = Buffer.byteLength(JSON.stringify(entry));
    if (current.length && (size + bytes > CHUNK_BYTES || current.length >= CHUNK_ENTRIES)) {
      out.push(current);
      current = [];
      size = 0;
    }
    current.push(entry);
    size += bytes;
  }
  if (current.length) out.push(current);
  return out;
}

async function restore() {
  const source = rest.find((item) => !item.startsWith("--"));
  if (!source || !existsSync(source)) die("다시 넣을 백업 파일 경로를 준다");
  const file = JSON.parse(readFileSync(source, "utf8"));
  if (file.schemaVersion !== "emotion-diary-export-v1" || !Array.isArray(file.diaries)) die("내보내기 파일이 아니다(schemaVersion)");
  const parts = chunks(file.diaries);
  if (rest.includes("--dry-run")) {
    console.info(`미리보기: 기록 ${file.diaries.length}편을 ${parts.length}조각으로 넣는다(아무것도 보내지 않았다)`);
    return;
  }
  let inserted = 0;
  const skipped = [];
  let settingsRestored = false;
  for (const [index, part] of (parts.length ? parts : [[]]).entries()) {
    const body = index === 0 ? { diaries: part, settings: { displayName: file.displayName ?? null, dayStartHour: file.dayStartHour } } : { diaries: part };
    const reply = await api("POST", "/api/backup/import", body);
    if (reply.status !== 200) die(`조각 ${index + 1}/${parts.length}을 넣지 못했다(상태 ${reply.status}${reply.json?.field ? `, ${reply.json.field}` : ""}) — 앞 조각은 이미 들어갔다. 다시 실행하면 들어간 날짜는 건너뛴다`);
    inserted += reply.json.inserted;
    skipped.push(...reply.json.skipped);
    settingsRestored ||= reply.json.settingsRestored;
  }
  console.info(`다시 넣기: ${inserted}편 넣음, ${skipped.length}편 건너뜀(이미 있는 날짜이거나 같은 번호의 기록이 이미 있음), 설정 ${settingsRestored ? "되살림" : "그대로(이미 있음)"}`);
}

function scheduleCommand() {
  const script = path.join(root, "app", "scripts", "backup.mjs");
  const task = `"\\"${process.execPath}\\" \\"${script}\\" pull ${envName} --dir \\"${dir}\\""`;
  const create = `/Create /TN "emotion-diary-backup-${envName}" /SC DAILY /ST 21:00 /TR ${task} /F`;
  console.info("매일 21:00에 한 번 받는 작업을 이 PC의 작업 스케줄러에 등록하는 명령이다(실행하지 않았다 — 직접 실행한다).");
  console.info("명령 프롬프트(cmd.exe):");
  console.info(`schtasks ${create}`);
  // PowerShell 5.1은 \" 를 따옴표 끝으로 읽어 /TR 값이 깨진다 — --% 뒤는 고치지 않고 그대로 넘긴다
  console.info("PowerShell:");
  console.info(`schtasks --% ${create}`);
  console.info(`PC가 꺼져 있던 날은 건너뛴다(D-109). 지우려면: schtasks /Delete /TN "emotion-diary-backup-${envName}" /F`);
}

if (command === "pull") await pull();
else if (command === "restore") await restore();
else scheduleCommand();
