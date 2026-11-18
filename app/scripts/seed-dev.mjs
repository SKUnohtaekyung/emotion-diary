// 개발용 건물에 통계·달력 확인용 합성 기록(가짜 데이터)을 넣는다 — TASK-REFLECT-01 A-9·R-6.
//   node app/scripts/seed-dev.mjs <local|dev> [--days 90] [--seed 7]   (local = 이 PC의 npm run dev, http://localhost:8787)
// 오늘(서울, 하루 기준 4시)에서 거꾸로 days일 — 빈 날·쓰던 글·뒤늦게 마무리한 날이 섞인다(app/scripts/synthetic.mjs). 오늘은 비운다.
// 백업 다시 넣기 경로(Bearer, 같은 id는 건너뜀 — D-109)로 100편씩 보낸다. 이 PC(local)와 개발용(dev)만 받는다 — 운영에는 넣지 않는다.
// local은 먼저 'node app/scripts/make-secrets.mjs local backup'으로 로컬 백업 토큰을 만든다.
// 지울 때는 화면의 모든 기록 지우기나 drill.mjs의 정리를 쓴다. 주소·토큰은 Git 제외 파일에서 읽고 찍지 않는다.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { syntheticDiaries } from "./synthetic.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const envName = process.argv[2];
if (envName !== "dev" && envName !== "local") {
  console.error("사용법: node app/scripts/seed-dev.mjs <local|dev> [--days 90] [--seed 7] — 이 PC·개발용 건물에만 넣는다(운영 금지)");
  process.exit(2);
}
const option = (name, fallback) => {
  const index = process.argv.indexOf(name);
  const value = index > 0 ? Number(process.argv[index + 1]) : fallback;
  if (!Number.isInteger(value) || value < 1) {
    console.error(`${name}는 1 이상의 정수여야 한다`);
    process.exit(2);
  }
  return value;
};
const days = option("--days", 90);
const seed = option("--seed", 7);
const read = (name) => readFileSync(path.join(root, "work", "deploy", name), "utf8").trim();
const base = envName === "local" ? "http://localhost:8787" : read("dev.url");
const token = read(`${envName}.BACKUP-TOKEN.txt`);
// 개발용 주소·토큰이 운영과 같으면 멈춘다 — 이름만 dev인 운영 설정에 합성 기록을 넣지 않게(마감 검토 9)
if (envName === "dev") {
  const prodFile = (name) => path.join(root, "work", "deploy", name);
  const same = (name, value) => existsSync(prodFile(name)) && readFileSync(prodFile(name), "utf8").trim() === value;
  if (same("prod.url", base) || same("prod.BACKUP-TOKEN.txt", token)) {
    console.error("개발용 주소나 백업 토큰이 운영과 같다 — 넣지 않는다");
    process.exit(2);
  }
}

// 오늘의 일기 날짜(서울, 하루 기준 4시) — 서버도 같은 규칙으로 센다. 합성 기록의 끝날로만 쓴다.
const seoul = new Date(Date.now() + 9 * 3600_000 - 4 * 3600_000).toISOString().slice(0, 10);
const diaries = syntheticDiaries(seoul, days, { seed });
let inserted = 0;
let skipped = 0;
for (let start = 0; start < diaries.length; start += 100) {
  const response = await fetch(`${base}/api/backup/import`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ diaries: diaries.slice(start, start + 100) })
  });
  if (response.status !== 200) {
    console.error(`FAIL\t다시 넣기 ${start}~: ${response.status}`);
    process.exit(1);
  }
  const result = await response.json();
  inserted += result.inserted;
  skipped += result.skipped.length;
}
console.info(`PASS\t합성 기록 ${diaries.length}편(끝날 ${seoul}, 씨앗 ${seed}) — 넣음 ${inserted}, 이미 있어 건너뜀 ${skipped}`);
