// 개발용 건물 원격 검사(TASK-MOBILE T3 5-3, docs/DEPLOY.md '올린 뒤 확인'). 가짜 데이터만 쓴다.
//   node app/scripts/remote-check.mjs dev --reset-dev-data          경로·헤더·로그인·잠금·오류 보고를 확인한다
//   node app/scripts/remote-check.mjs dev --tail --reset-dev-data   같은 검사를 하며 실시간 서버 기록을 받아 열쇠·비밀번호·글이 0건인지 본다
// 주소·열쇠는 Git 제외 파일(work/deploy/dev.url, dev.PHONE-KEY.txt)에서 읽고 화면에 찍지 않는다.
// 끝나면 개발용 D1의 이름·잠금 설정·일기·영수증과 **모든** 세션을 지운다(cf.mjs sql) — 휴대폰의 로그인도 함께 사라진다.
import { readFileSync } from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const envName = process.argv[2];
const withTail = process.argv.includes("--tail");
if (envName !== "dev") {
  console.error("사용법: node app/scripts/remote-check.mjs dev [--tail] --reset-dev-data");
  process.exit(2);
}
// 검사는 이름·잠금을 바꾸고 끝에 개발용 D1의 이름·잠금 설정과 세션을 모두 지운다(한 사람용이라 행을 가를 수 없다).
// 휴대폰으로 확인하는 중이면 그 로그인·이름·잠금도 사라진다 — 알고 돌리도록 플래그를 요구한다.
if (!process.argv.includes("--reset-dev-data")) {
  console.error("이 검사는 끝에 개발용 건물의 이름·잠금·모든 로그인을 지운다. 휴대폰 확인 중이 아니면 --reset-dev-data를 붙여 다시 부른다.");
  process.exit(2);
}
const read = (name) => readFileSync(path.join(root, "work", "deploy", name), "utf8").trim();
const base = read(`${envName}.url`);
const key = read(`${envName}.PHONE-KEY.txt`);
const PIN = "4826";
const NAME = "원격확인";
const DIARY = "원격 확인용 가짜 일기 문장";
const CSRF = { "x-requested-with": "emotion-diary" };

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.info(`${ok ? "PASS" : "FAIL"}\t${name}${detail ? `\t${detail}` : ""}`);
}

let cookie = null;
async function api(method, pathName, { body, csrf = true, useCookie = true, headers = {} } = {}) {
  const response = await fetch(base + pathName, {
    method,
    redirect: "manual",
    headers: {
      ...(csrf && method !== "GET" ? CSRF : {}),
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      ...(useCookie && cookie ? { cookie: `__Host-session=${cookie}` } : {}),
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  for (const line of response.headers.getSetCookie()) {
    if (line.startsWith("__Host-session=")) cookie = line.slice("__Host-session=".length).split(";")[0] || null;
  }
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: response.status, headers: response.headers, json, text, setCookie: response.headers.getSetCookie() };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let tail = null;
let tailOutput = "";
if (withTail) {
  tail = spawn(process.execPath, [path.join(root, "app", "scripts", "cf.mjs"), envName, "tail"], { cwd: root });
  tail.stdout.on("data", (chunk) => {
    tailOutput += chunk;
  });
  tail.stderr.on("data", () => {});
  await sleep(12_000); // 기록 연결이 서기를 기다린다
}

// 1. 정적 파일과 헤더
const home = await fetch(`${base}/`);
check("첫 화면 200", home.status === 200);
check("첫 화면 CSP", (home.headers.get("content-security-policy") ?? "").includes("frame-ancestors 'none'"));
check("첫 화면 nosniff·HSTS·X-Frame-Options", home.headers.get("x-content-type-options") === "nosniff" && Boolean(home.headers.get("strict-transport-security")) && home.headers.get("x-frame-options") === "DENY");
const html = await home.text();
const fallback = await fetch(`${base}/some/screen/that/does-not-exist`);
check("파일 없는 경로 → 첫 화면 파일(SPA)", fallback.status === 200 && (await fallback.text()) === html);
check("SPA 폴백 응답에도 CSP가 붙는다", (fallback.headers.get("content-security-policy") ?? "").includes("frame-ancestors 'none'"), `실측: ${fallback.headers.get("content-security-policy") ? "있음" : "없음"}`);
const asset = html.match(/\/assets\/[A-Za-z0-9._-]+\.js/)?.[0];
let bundle = "";
if (asset) {
  const assetResponse = await fetch(base + asset);
  check("해시 파일은 immutable 캐시", (assetResponse.headers.get("cache-control") ?? "").includes("immutable"));
  bundle = await assetResponse.text(); // 빌드 번호는 화면 JS 묶음 안에 있다(첫 화면 HTML이 아니라)
}
const manifest = await fetch(`${base}/manifest.webmanifest`);
const manifestJson = await manifest.json().catch(() => null);
check("manifest start_url·scope '/'", manifestJson?.start_url === "/" && manifestJson?.scope === "/");
check("첫 화면·manifest는 매번 확인(immutable 아님)", !(home.headers.get("cache-control") ?? "").includes("immutable"));

// 2. 로그인 전
const before = await api("GET", "/api/session");
check("로그인 전 /api/session: 로그인 안 됨·배포 모드만", before.status === 200 && before.json?.authenticated === false && before.json?.env === "dev" && !("appLock" in (before.json ?? {})));
check("API 응답 헤더(no-store·CSP none)", before.headers.get("cache-control") === "no-store" && before.headers.get("content-security-policy") === "default-src 'none'; frame-ancestors 'none'");
check("없는 API 로그인 전 401", (await api("GET", "/api/nothing")).status === 401);
check("표식 없는 로그인 403", (await api("POST", "/api/session", { body: { key }, csrf: false })).status === 403);
check("다른 출처 로그인 403", (await api("POST", "/api/session", { body: { key }, headers: { origin: "https://evil.example" } })).status === 403);
check("틀린 열쇠 401", (await api("POST", "/api/session", { body: { key: `${key}x` } })).status === 401);

// 3. 로그인
const login = await api("POST", "/api/session", { body: { key } });
const cookieLine = login.setCookie.find((line) => line.startsWith("__Host-session=")) ?? "";
check("맞는 열쇠 200 + cookie 속성", login.status === 200 && /HttpOnly/.test(cookieLine) && /Secure/.test(cookieLine) && /SameSite=Lax/.test(cookieLine) && /Max-Age=2592000/.test(cookieLine));
const after = await api("GET", "/api/session");
check("로그인 뒤 /api/session", after.json?.authenticated === true && after.json?.locked === false);
check("빌드 번호가 화면과 서버에 같다", Boolean(after.json?.build) && bundle.includes(after.json.build), after.json?.build ?? "");
check("없는 API 로그인 뒤 JSON 404", (await api("GET", "/api/nothing")).status === 404);
check("화면 신호 204", (await api("POST", "/api/session/heartbeat")).status === 204);
check("부를 이름 저장", (await api("PUT", "/api/settings/profile", { body: { name: NAME } })).status === 200);

// 4. 앱 잠금
check("잠금 정하기(열쇠 로그인 10분 안)", (await api("PUT", "/api/app-lock", { body: { pin: PIN } })).status === 200);
check("지금 잠그기 204", (await api("POST", "/api/app-lock/lock")).status === 204);
const locked = await api("GET", "/api/settings/profile");
check("잠긴 세션 423·이름 없음", locked.status === 423 && !locked.text.includes(NAME));
check("잠긴 세션의 신호 423", (await api("POST", "/api/session/heartbeat")).status === 423);
check("틀린 비밀번호 422", (await api("POST", "/api/app-lock/unlock", { body: { pin: "0000" } })).status === 422);
check("맞는 비밀번호 200", (await api("POST", "/api/app-lock/unlock", { body: { pin: PIN } })).status === 200);
check("잠금 끄기", (await api("DELETE", "/api/app-lock")).status === 200);

// 4b. 일기 저장 핵심(TASK-DATA-01) — 실제 Workers 런타임의 시간대 계산, 오늘만 만들기, 영수증, 판 번호, 완료, 지우기와 연쇄 삭제.
const TZ = { "x-timezone": "Asia/Seoul" };
const receipt = () => ({ "idempotency-key": crypto.randomUUID() });
const taxonomy = JSON.parse(readFileSync(path.join(root, "data", "taxonomy", "v2.json"), "utf8"));
const joyCode = taxonomy.categories.find((category) => category.code === "joy").emotions[0].code;
/** 원격 D1에 읽기 SQL 한 줄 — 결과 첫 행 */
function remoteRow(sql) {
  const run = spawnSync(process.execPath, [path.join(root, "app", "scripts", "cf.mjs"), envName, "sql", sql, "--json"], { cwd: root, encoding: "utf8" });
  try {
    return JSON.parse(run.stdout)[0]?.results?.[0] ?? null;
  } catch {
    return null;
  }
}
const today = await api("GET", "/api/today", { headers: TZ });
const date = today.json?.date ?? "";
check("오늘(서버가 센 일기 날짜)", today.status === 200 && /^\d{4}-\d{2}-\d{2}$/.test(date) && today.json?.dayStartHour === 4, date);
const east = await api("GET", "/api/today", { headers: { "x-timezone": "Pacific/Kiritimati" } });
const west = await api("GET", "/api/today", { headers: { "x-timezone": "Etc/GMT+12" } });
check("실제 런타임이 IANA 시간대로 센다(UTC+14와 UTC-12의 날짜가 다르다)", east.status === 200 && west.status === 200 && east.json?.date !== west.json?.date, `${east.json?.date} / ${west.json?.date}`);
check("모르는 시간대 400", (await api("GET", "/api/today", { headers: { "x-timezone": "Mars/Phobos" } })).status === 400);
const diaryBody = {
  eventText: DIARY,
  reasonText: `${DIARY} 이유`,
  categories: [{ categoryCode: "joy", intensity: 6 }],
  emotions: [{ emotionCode: joyCode }],
  praises: [{ slot: 1, text: `${DIARY} 칭찬` }],
  gratitudes: []
};
const yesterday = new Date(Date.parse(`${date}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
check("어제 날짜로 새로 만들기 422", (await api("PUT", `/api/diaries/${yesterday}`, { body: diaryBody, headers: { ...TZ, ...receipt() } })).status === 422);
const createKey = receipt();
const created = await api("PUT", `/api/diaries/${date}`, { body: diaryBody, headers: { ...TZ, ...createKey } });
check("오늘 기록 만들기 201", created.status === 201 && created.json?.revision === 1);
const replayedCreate = await api("PUT", `/api/diaries/${date}`, { body: diaryBody, headers: { ...TZ, ...createKey } });
check("같은 영수증 열쇠의 재전송은 첫 응답 그대로", replayedCreate.status === 201 && replayedCreate.headers.get("idempotent-replayed") === "true" && replayedCreate.json?.id === created.json?.id);
check("다른 탭의 새로 만들기 409", (await api("PUT", `/api/diaries/${date}`, { body: diaryBody, headers: { ...TZ, ...receipt() } })).status === 409);
check("판 번호 맞춘 고치기 200", (await api("PUT", `/api/diaries/${date}`, { body: { ...diaryBody, revision: 1 }, headers: { ...TZ, ...receipt() } })).json?.revision === 2);
check("오래된 판 번호 409", (await api("PUT", `/api/diaries/${date}`, { body: { ...diaryBody, revision: 1 }, headers: { ...TZ, ...receipt() } })).status === 409);
const completed = await api("POST", `/api/diaries/${date}/complete`, { body: { revision: 2 }, headers: { ...TZ, ...receipt() } });
check("완료 200", completed.status === 200 && completed.json?.status === "completed" && completed.json?.firstCompletedLocalDate === date);
const readBack = await api("GET", `/api/diaries/${date}`, { headers: TZ });
check("다시 열면 완료된 기록과 글", readBack.status === 200 && readBack.json?.status === "completed" && readBack.json?.eventText === DIARY);
check("완료된 기록의 빈 이유로 고치기 422", (await api("PUT", `/api/diaries/${date}`, { body: { ...diaryBody, reasonText: " ", revision: 3 }, headers: { ...TZ, ...receipt() } })).status === 422);
check("외래 키 검사가 켜져 있다(PRAGMA foreign_keys = 1)", remoteRow("PRAGMA foreign_keys")?.foreign_keys === 1);
check("기록 하나 지우기 200", (await api("DELETE", `/api/diaries/${date}`, { body: { revision: 3 }, headers: { ...TZ, ...receipt() } })).status === 200);
check("지운 기록 404", (await api("GET", `/api/diaries/${date}`, { headers: TZ })).status === 404);
const orphans = remoteRow("SELECT (SELECT count(*) FROM diary_categories) + (SELECT count(*) FROM diary_emotions) + (SELECT count(*) FROM diary_reflections) AS n");
check("지운 뒤 딸린 행 0(연쇄 삭제)", orphans?.n === 0, `실측: ${orphans?.n}`);

// 5. 개발용 오류 보고
const report = { kind: "error", name: "TypeError", source: "/assets/remote-check.js", line: 1, col: 1, build: after.json?.build ?? "x", route: "today" };
check("오류 보고 204(개발용)", (await api("POST", "/api/client-errors", { body: report })).status === 204);
check("글이 든 오류 보고 400", (await api("POST", "/api/client-errors", { body: { ...report, message: DIARY } })).status === 400);

// 6. 로그아웃
const saved = cookie;
check("로그아웃 200", (await api("DELETE", "/api/session")).status === 200);
cookie = saved;
check("로그아웃한 cookie의 사본 401", (await api("GET", "/api/settings/profile")).status === 401);
cookie = null;

// 7. 정리 — 검사가 만든 이름과 세션을 지운다(가짜 데이터)
const cleanup = spawnSync(process.execPath, [path.join(root, "app", "scripts", "cf.mjs"), envName, "sql", "DELETE FROM diary_entries; DELETE FROM idempotency_records; DELETE FROM owner_settings; DELETE FROM sessions; DELETE FROM client_errors WHERE source = '/assets/remote-check.js';"], { cwd: root, encoding: "utf8" });
check("검사 데이터 정리", cleanup.status === 0);

if (tail) {
  await sleep(8_000);
  tail.kill();
  const hits = [key, PIN, NAME, DIARY].filter((secret) => tailOutput.includes(secret));
  check("실시간 서버 기록에 열쇠·비밀번호·이름·글 0건", hits.length === 0, `기록 ${tailOutput.length}자, 걸린 것 ${hits.length}개`);
  check("실시간 서버 기록을 실제로 받았다(검사가 헛돌지 않게)", tailOutput.includes("/api/session"));
}

const failed = results.filter((result) => !result.ok);
console.info(`\n${results.length - failed.length}/${results.length} PASS`);
process.exit(failed.length ? 1 : 0);
