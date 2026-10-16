// 개발용 환경의 복원 연습(EVAL_PLAN §14 restore-drill)과 합성 3년치 내보내기(export-cpu-measured의 원격 확인) — TASK-DATA-02.
//   node app/scripts/drill.mjs dev --reset-dev-data
// 순서: 로그인 → 합성 3년치(1,095편, 가짜 글) 다시 넣기 + 오늘 한 편 쓰기 + 이름·하루 기준 시각 → 조각 내보내기(전부 200, 걸린 시간)
//      → 다른 기기 세션 하나를 만들고 로그아웃 → PC 백업 받기(backup.mjs pull) → 모든 기록 지우기 → 백업으로 다시 넣기(backup.mjs restore)
//      → 내보내기가 처음과 같은지 → 로그아웃했던 cookie가 되살아나지 않는지 → 정리(모든 기록 지우기 + 세션·영수증·설정 비우기).
// 무료 쓰기 한도(하루 10만 행)에서 약 4만~5만 행을 쓴다 — 하루에 두 번 돌리지 않는다. 주소·열쇠·토큰은 Git 제외 파일에서 읽고 찍지 않는다.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const envName = process.argv[2];
if (envName !== "dev" || !process.argv.includes("--reset-dev-data")) {
  console.error("사용법: node app/scripts/drill.mjs dev --reset-dev-data (끝에 개발용 데이터와 모든 로그인을 지운다)");
  process.exit(2);
}
const read = (name) => readFileSync(path.join(root, "work", "deploy", name), "utf8").trim();
const base = read(`${envName}.url`);
const key = read(`${envName}.PHONE-KEY.txt`);
const token = read(`${envName}.BACKUP-TOKEN.txt`);
const TZ = "Asia/Seoul";
const CSRF = { "x-requested-with": "emotion-diary" };

const results = [];
function check(name, ok, detail = "") {
  results.push(ok);
  console.info(`${ok ? "PASS" : "FAIL"}\t${name}${detail ? `\t${detail}` : ""}`);
}

async function api(method, pathName, { body, cookie, bearer = false, headers = {} } = {}) {
  const response = await fetch(base + pathName, {
    method,
    headers: {
      "x-timezone": TZ,
      ...(method !== "GET" && !bearer ? CSRF : {}),
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie: `__Host-session=${cookie}` } : {}),
      ...(bearer ? { authorization: `Bearer ${token}` } : {}),
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

const login = async () => (await api("POST", "/api/session", { body: { key } })).setCookie;
const node = (args) => spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" });

/** 조각을 모두 이어 받는다 — 각 요청의 상태와 걸린 시간을 돌려준다. */
async function exportAll(cookie) {
  const diaries = [];
  const times = [];
  let head = null;
  let after = null;
  let ok = true;
  do {
    const started = performance.now();
    const reply = await api("GET", after ? `/api/export?after=${after}` : "/api/export", { cookie });
    times.push(performance.now() - started);
    if (reply.status !== 200) {
      ok = false;
      break;
    }
    head ??= reply.json;
    diaries.push(...reply.json.diaries);
    after = reply.json.next;
  } while (after);
  const { next: _next, exportedAt: _at, ...rest } = head ?? {};
  return { ok, file: { ...rest, diaries }, times };
}

// 합성 기록(가짜 글) — app/test/worker/synthetic.ts와 같은 모양
const taxonomy = JSON.parse(readFileSync(path.join(root, "data", "taxonomy", "v2.json"), "utf8"));
const pick = (code) => taxonomy.categories.find((category) => category.code === code).emotions.map((emotion) => ({ code: emotion.code, label: emotion.label_ko }));
const JOY = pick("joy");
const SAD = pick("sadness");
const addDays = (date, days) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};
function synthetic(date, index) {
  const at = `${date}T12:00:00.000Z`;
  const sentence = `가짜 일기 ${index}번: 오늘은 친구와 산책을 하고 저녁에 책을 조금 읽었다. `;
  const joyA = JOY[index % JOY.length];
  const joyB = JOY[(index + 1) % JOY.length];
  const sad = SAD[index % SAD.length];
  return {
    schemaVersion: "diary-entry-v2",
    id: crypto.randomUUID(),
    entryDate: date,
    timezone: TZ,
    status: "completed",
    revision: 3,
    taxonomyVersion: taxonomy.version,
    eventText: sentence.repeat(4),
    reasonText: sentence.repeat(2),
    categories: [
      { categoryCode: "joy", intensity: 6 },
      { categoryCode: "sadness", intensity: 3 }
    ],
    emotions: [
      { categoryCode: "joy", emotionCode: joyA.code, labelSnapshot: joyA.label, intensity: 6, custom: false },
      { categoryCode: "joy", emotionCode: joyB.code, labelSnapshot: joyB.label, intensity: 8, custom: true },
      { categoryCode: "sadness", emotionCode: sad.code, labelSnapshot: sad.label, intensity: 3, custom: false }
    ],
    praises: [{ slot: 1, text: "끝까지 해냈다" }],
    gratitudes: [{ slot: 1, text: "같이 걸어 준 친구" }],
    resume: { step: "letter", categoryCode: null },
    firstCompletedAt: at,
    firstCompletedLocalDate: date,
    completedAt: at,
    createdAt: at,
    updatedAt: at
  };
}

const workDir = mkdtempSync(path.join(os.tmpdir(), "emotion-diary-drill-"));
try {
  const cookie = await login();
  check("로그인", Boolean(cookie));
  const today = (await api("GET", "/api/today", { cookie })).json?.date;
  check("오늘 날짜", typeof today === "string", today);

  // 1. 합성 3년치 + 오늘 한 편 + 설정
  const past = Array.from({ length: 1095 }, (_, index) => synthetic(addDays(today, -1 - index), index));
  let inserted = 0;
  for (let start = 0; start < past.length; start += 100) {
    const reply = await api("POST", "/api/backup/import", { body: { diaries: past.slice(start, start + 100) }, bearer: true });
    inserted += reply.json?.inserted ?? 0;
    if (reply.status !== 200) check(`합성 기록 넣기 조각 ${start / 100 + 1}`, false, `상태 ${reply.status} ${reply.json?.field ?? ""}`);
  }
  check("합성 3년치 다시 넣기(1,095편)", inserted === 1095, `${inserted}편`);
  const first = { eventText: "원격 복원 연습의 가짜 사건", reasonText: "가짜 이유", categories: [{ categoryCode: "joy", intensity: 5 }], emotions: [{ emotionCode: JOY[0].code }], praises: [], gratitudes: [] };
  const put = await api("PUT", `/api/diaries/${today}`, { cookie, body: first, headers: { "idempotency-key": crypto.randomUUID() } });
  const done = await api("POST", `/api/diaries/${today}/complete`, { cookie, body: { revision: put.json?.revision }, headers: { "idempotency-key": crypto.randomUUID() } });
  check("오늘 한 편 쓰고 완료", put.status === 201 && done.status === 200);
  // 설정이 실제로 들어가야 '설정까지 되살린다'를 본다(실패한 채 null끼리 같아 헛통과하지 않게)
  const named = await api("PUT", "/api/settings/profile", { cookie, body: { name: "복원연습" } });
  const dayStart = await api("PUT", "/api/settings/day-start", { cookie, body: { dayStartHour: 5 } });
  check("부를 이름·하루 기준 시각 저장", named.status === 200 && dayStart.status === 200, `${named.status}·${dayStart.status}`);

  // 2. 조각 내보내기(3년치)
  const before = await exportAll(cookie);
  const sorted = [...before.times].sort((a, b) => a - b);
  check(
    "조각 내보내기 전부 200(무료 CPU 한도를 넘으면 Cloudflare가 요청을 끊는다)",
    before.ok && before.file.diaries.length === 1096 && before.file.displayName === "복원연습" && before.file.dayStartHour === 5,
    `${before.file.diaries.length}편, ${before.times.length}조각, 조각당 걸린 시간 중앙값 ${sorted[Math.floor(sorted.length / 2)]?.toFixed(0)}ms·최대 ${sorted[sorted.length - 1]?.toFixed(0)}ms(네트워크 포함)`
  );

  // 3. 다른 기기 세션을 만들고 로그아웃 — 복원 뒤에도 되살아나면 안 된다
  const other = await login();
  const loggedOut = await api("DELETE", "/api/session", { cookie: other });
  check("다른 기기 세션 로그아웃", loggedOut.status === 200);

  // 4. PC 백업 받기
  const pulled = node([path.join(root, "app", "scripts", "backup.mjs"), "pull", envName, "--dir", workDir]);
  const backupFile = readdirSync(workDir).find((name) => /^emotion-diary-\d{4}-\d{2}-\d{2}\.json$/.test(name));
  const backup = backupFile ? JSON.parse(readFileSync(path.join(workDir, backupFile), "utf8")) : null;
  check("PC 백업 받기(backup.mjs pull)", pulled.status === 0 && backup?.diaries?.length === 1096, pulled.stdout.trim().replace(workDir, "<임시 폴더>"));

  // 5. 모두 지우기
  const removed = await api("DELETE", "/api/diaries", { cookie, body: { confirm: "모든 기록 삭제" } });
  const empty = await exportAll(cookie);
  check("모든 기록 지우기 → 내보내기 0편", removed.status === 200 && empty.file.diaries.length === 0 && empty.file.displayName === null);

  // 6. 백업으로 다시 넣기
  const restored = node([path.join(root, "app", "scripts", "backup.mjs"), "restore", envName, path.join(workDir, backupFile ?? "missing")]);
  check("백업으로 다시 넣기(backup.mjs restore)", restored.status === 0, restored.stdout.trim());
  const after = await exportAll(cookie);
  check("되살린 내보내기가 지우기 전과 같다(기록·설정·순서 — 내보낸 시각만 다름)", JSON.stringify(after.file) === JSON.stringify(before.file), `${after.file.diaries.length}편`);

  // 7. 로그아웃한 cookie는 되살아나지 않는다(다시 넣기는 세션 표를 건드리지 않는다)
  check("로그아웃했던 cookie는 여전히 401", (await api("GET", "/api/settings/profile", { cookie: other })).status === 401);

  // 8. 정리 — 이 연습이 만든 가짜 데이터와 모든 로그인을 지운다
  await api("DELETE", "/api/diaries", { cookie, body: { confirm: "모든 기록 삭제" } });
  const cleanup = node([path.join(root, "app", "scripts", "cf.mjs"), envName, "sql", "DELETE FROM diary_entries; DELETE FROM idempotency_records; DELETE FROM owner_settings; DELETE FROM sessions;"]);
  check("정리(개발용 데이터·로그인 비움)", cleanup.status === 0);
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
const failed = results.filter((ok) => !ok).length;
console.info(`\n${results.length - failed}/${results.length} PASS`);
process.exit(failed ? 1 : 0);
