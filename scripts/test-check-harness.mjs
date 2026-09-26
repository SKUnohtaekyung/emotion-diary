// check-harness.mjs 테스트 — 정상 fixture에서 시작해 파일 하나씩만 어긋나게 만든 뒤
// 검사기가 그 어긋남을 FAIL로 잡는지, 시간·커밋 거리 신호는 WARN에 그치는지 확인한다.
//
// 실제 저장소의 harness/·schemas/·design/은 건드리지 않는다. os.tmpdir() 아래 fixture
// 루트를 만들고 HARNESS_CHECK_ROOT로 넘겨 실행한다(check-characters 테스트와 같은 방식).
//
// 케이스는 { name, mutate(files), expect: "pass" | "fail", match? } 배열이다. mutate는
// 경로→내용 맵을 고치고, match는 출력에 들어 있어야 하는 문구다(엉뚱한 이유로 실패해서
// 통과한 것처럼 보이는 일을 막는다). 케이스를 추가하려면 이 배열에 항목을 더하면 된다.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { staleCommitWarning, statusAgeWarning } from "./check-harness.mjs";

const scriptDir = path.dirname(process.argv[1]);
const checker = path.join(scriptDir, "check-harness.mjs");
const CATEGORIES = ["enjoyment", "wish", "fear"];
const PATTERN = `^(${CATEGORIES.join("|")})-[a-z0-9][a-z0-9-]{0,55}$`;

function baseline() {
  return {
    "package.json": JSON.stringify({ scripts: { test: "node t.mjs", "verify:quick": "node v.mjs" }, devDependencies: { sharp: "^0.35.4" } }),
    "package-lock.json": "{}",
    "harness/work-graph.yaml": [
      "statuses:", "  allowed: [blocked, ready, in_progress, verifying, done]", "nodes:",
      "  - id: audit", "    status: done", "    depends_on: []",
      "  - id: spike", "    status: verifying", "    depends_on: [audit]",
      "  - id: scaffold", "    status: blocked", "    depends_on: [spike]",
      "edges:", "  - from: audit", "    to: spike", ""
    ].join("\n"),
    "harness/loop-state.json": JSON.stringify({ task_id: "TASK-X", next_node: "spike", completed_nodes: ["audit"], last_verified_commit: "abc1234" }),
    "harness/runtime-profile.json": JSON.stringify({ commands: { install: "npm ci", dev: null, lint: null, test: "npm test", verify_quick: "npm run verify:quick" } }),
    "harness/quality-gates.yaml": ["gates:", "  full:", "    commands:", "      - name: lint", "        command: null", "      - name: unit-and-integration", "        command: npm test", ""].join("\n"),
    "tasks/CURRENT_TASK.md": "# TASK-X — 진행 중인 작업\n\n# 보류 기록: TASK-OLD — 끝난 작업\n",
    "docs/STATUS.md": "# 상태\n\n최종 갱신: 2026-09-18.\n",
    "data/taxonomy/v2.json": JSON.stringify({ categories: CATEGORIES.map((code) => ({ code })) }),
    "schemas/diary-entry.schema.json": JSON.stringify({ properties: { emotions: { items: { properties: { categoryCode: { enum: CATEGORIES }, emotionCode: { pattern: PATTERN } } } } } }),
    "schemas/journal-assist-output.schema.json": JSON.stringify({ properties: { candidates: { items: { pattern: PATTERN } } } }),
    "design/tokens.json": JSON.stringify({ color: {
      neutral: { bg: { light: "#FFFFFF", dark: "#121211" }, surface: { light: "#FAFAF8", dark: "#1B1B19" }, "surface-raised": { light: "#FFFFFF", dark: "#232320" }, border: { light: "#E6E4DE", dark: "#33322E" }, "border-strong": { light: "#C9C7BF", dark: "#4A4842" }, text: { light: "#1F1F1D", dark: "#F0EFEA" }, "text-muted": { light: "#5F5E5A", dark: "#B5B3AA" }, "text-subtle": { light: "#767570", dark: "#8F8E87" }, focus: { light: "#2F6FB5", dark: "#7FB3F0" } },
      semantic: { danger: { light: "#C62828", dark: "#F28B82" } },
      emotion: { fear: { 50: "#EAF5F3", 500: "#199A8C", label: "공포" } }
    } }),
    "design/style-guide.html": "<style>\n:root{\n  --bg:#FFFFFF;--surface:#FAFAF8;--raised:#FFFFFF;--border:#E6E4DE;--border-strong:#C9C7BF;\n  --text:#1F1F1D;--muted:#5F5E5A;--subtle:#767570;--focus:#2F6FB5;--danger:#C62828;\n  --fear-50:#EAF5F3;--fear-500:#199a8c;--radius:8px;\n}\n:root[data-theme=\"dark\"]{\n  --bg:#121211;--surface:#1B1B19;--raised:#232320;--border:#33322E;--border-strong:#4A4842;--text:#F0EFEA;--muted:#B5B3AA;--subtle:#8F8E87;--focus:#7FB3F0;--danger:#F28B82;}\n</style>\n",
    // 디자인 시스템 검사(scripts/check-design-system.mjs, D-097·D-098)용 최소 fixture
    "web/css/a.css": `.x{color:var(--text)}
`,
    "docs/design-system/components/b.md": `# b

**상태: 결정 대기 0건**

${"ABCDEFGHIJKLMNO".split("").map((letter) => `## ${letter}. 항목
`).join(`
`)}`,
    "docs/design-system/INVENTORY.md": `| 부품 | \`components/b.md\` |

## 2. 미사용
| 체크박스 | \`components/nope.md\`는 미사용 표에서 세지 않는다 |
`
  };
}

const edit = (file, from, to) => (files) => {
  if (!files[file].includes(from)) throw new Error(`fixture에 '${from}'가 없다: ${file}`);
  files[file] = files[file].replace(from, to);
};

const cases = [
  { name: "정상 fixture는 통과한다", mutate: () => {}, expect: "pass" },
  { name: "CRLF로 저장된 fixture도 통과한다(Windows 작업 트리)", mutate: (files) => { for (const key of Object.keys(files)) files[key] = files[key].replace(/\n/g, "\r\n"); }, expect: "pass" },
  { name: "선행이 done이 아닌데 후행이 시작 상태면 실패한다", mutate: edit("harness/work-graph.yaml", "  - id: audit\n    status: done", "  - id: audit\n    status: in_progress"), expect: "fail", match: "선행 audit가 'in_progress'다" },
  { name: "blocked 노드는 선행 상태와 무관하게 통과한다", mutate: edit("harness/work-graph.yaml", "    status: verifying", "    status: blocked"), expect: "pass" },
  { name: "허용 목록에 없는 status는 실패한다", mutate: edit("harness/work-graph.yaml", "    status: verifying", "    status: partial"), expect: "fail", match: "허용되지 않은 status 'partial'" },
  { name: "completed_nodes가 done 노드와 다르면 실패한다", mutate: edit("harness/loop-state.json", '"completed_nodes":["audit"]', '"completed_nodes":[]'), expect: "fail", match: "completed_nodes" },
  { name: "next_node가 이미 done이면 실패한다", mutate: edit("harness/loop-state.json", '"next_node":"spike"', '"next_node":"audit"'), expect: "fail", match: "이미 done이다" },
  { name: "task_id가 CURRENT_TASK 머리글에 없으면 실패한다", mutate: edit("harness/loop-state.json", '"task_id":"TASK-X"', '"task_id":"TASK-GONE"'), expect: "fail", match: "TASK-GONE" },
  { name: "'보류 기록:' 머리글의 task_id는 진행 중으로 세지 않는다", mutate: edit("harness/loop-state.json", '"task_id":"TASK-X"', '"task_id":"TASK-OLD"'), expect: "fail", match: "TASK-OLD" },
  { name: "package.json에 test가 있는데 runtime-profile이 null이면 실패한다", mutate: edit("harness/runtime-profile.json", '"test":"npm test"', '"test":null'), expect: "fail", match: "commands.test이 null" },
  { name: "의존성이 있는데 install이 null이면 실패한다", mutate: edit("harness/runtime-profile.json", '"install":"npm ci"', '"install":null'), expect: "fail", match: "commands.install이 null" },
  { name: "runtime-profile이 없는 script를 가리키면 실패한다", mutate: edit("harness/runtime-profile.json", "npm run verify:quick", "npm run verify:gone"), expect: "fail", match: "'verify:gone'" },
  { name: "script가 없는 명령 슬롯의 null은 통과한다(lint 미선택)", mutate: () => {}, expect: "pass" },
  { name: "package.json에 test가 있는데 quality-gates가 null이면 실패한다", mutate: edit("harness/quality-gates.yaml", "command: npm test", "command: null"), expect: "fail", match: "unit-and-integration" },
  { name: "schema enum에 taxonomy 카테고리가 빠지면 실패한다", mutate: edit("schemas/diary-entry.schema.json", '"enum":["enjoyment","wish","fear"]', '"enum":["enjoyment","wish"]'), expect: "fail", match: "categoryCode enum" },
  { name: "emotionCode pattern의 prefix가 어긋나면 실패한다", mutate: edit("schemas/journal-assist-output.schema.json", "enjoyment|wish|fear", "enjoyment|wish"), expect: "fail", match: "journal-assist-output.schema.json: emotionCode pattern" },
  { name: "style-guide의 색이 tokens와 다르면 실패한다", mutate: edit("design/style-guide.html", "--fear-50:#EAF5F3", "--fear-50:#EAF5F4"), expect: "fail", match: "--fear-50" },
  { name: "style-guide에 변수가 빠지면 실패한다", mutate: edit("design/style-guide.html", "--fear-50:#EAF5F3;", ""), expect: "fail", match: "--fear-50이 없다" },
  { name: "dark 블록의 값이 tokens와 다르면 실패한다", mutate: edit("design/style-guide.html", "--danger:#F28B82", "--danger:#FF0000"), expect: "fail", match: "dark --danger" },
  { name: "16진수 대소문자 차이는 어긋남이 아니다", mutate: () => {}, expect: "pass" },
  { name: "시안 CSS에 색 리터럴이 새로 들어오면 실패한다", mutate: edit("web/css/a.css", "color:var(--text)", "color:#123456"), expect: "fail", match: "색 리터럴" },
  { name: "시안 CSS가 비활성을 투명도로 흐리면 실패한다(D-098 ②)", mutate: (files) => { files["web/css/a.css"] += ".y:disabled{opacity:.4}"; }, expect: "fail", match: "투명도로 흐린다" },
  { name: "예외 목록이 가리키는 글이 사라지면 낡은 예외로 실패한다", mutate: (files) => { files["web/css/film.css"] = ".z{color:var(--text)}"; }, expect: "fail", match: "낡은 CSS 예외" },
  { name: "부품 명세에 A~O 절이 빠지면 실패한다", mutate: edit("docs/design-system/components/b.md", "## O. 항목", "## 오. 항목"), expect: "fail", match: "'## O.' 절이 없다" },
  { name: "부품 명세 머리의 결정 대기 수가 본문과 다르면 실패한다", mutate: edit("docs/design-system/components/b.md", "결정 대기 0건", "결정 대기 1건"), expect: "fail", match: "≠ 본문" },
  { name: "달력 미래 날짜처럼 못 쓰는 상태를 투명도로 흐려도 실패한다", mutate: (files) => { files["web/css/a.css"] += ".day.future{opacity:.4}"; }, expect: "fail", match: "투명도로 흐린다" },
  { name: "부품 토큰이 있는 기초 토큰을 가리키면 통과한다", mutate: (files) => { const t = JSON.parse(files["design/tokens.json"]); t.component = { button: { danger: "color.semantic.danger" } }; files["design/tokens.json"] = JSON.stringify(t); }, expect: "pass" },
  { name: "부품 토큰이 없는 토큰을 가리키면 실패한다", mutate: (files) => { const t = JSON.parse(files["design/tokens.json"]); t.component = { button: { danger: "color.semantic.alarm" } }; files["design/tokens.json"] = JSON.stringify(t); }, expect: "fail", match: "color.semantic.alarm" },
  { name: "INVENTORY가 가리키는 부품 명세가 없으면 실패한다", mutate: edit("docs/design-system/INVENTORY.md", "`components/b.md`", "`components/b.md` `components/c.md`"), expect: "fail", match: "components/c.md이 없다" },
  { name: "taxonomy·style-guide가 아직 없는 저장소는 그 검사를 건너뛴다", mutate: (files) => { delete files["data/taxonomy/v2.json"]; delete files["design/style-guide.html"]; }, expect: "pass" },
  { name: "STATUS가 오래됐어도 git 없는 루트에서는 경고 없이 통과한다(시간 신호는 FAIL이 아니다)", mutate: edit("docs/STATUS.md", "2026-09-18", "2020-01-01"), expect: "pass" }
];

function runCase(testCase) {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "check-harness-"));
  try {
    const files = baseline();
    testCase.mutate(files);
    for (const [relative, content] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(fixtureRoot, relative)), { recursive: true });
      fs.writeFileSync(path.join(fixtureRoot, relative), content);
    }
    const result = spawnSync(process.execPath, [checker], { env: { ...process.env, HARNESS_CHECK_ROOT: fixtureRoot }, encoding: "utf8" });
    const output = `${result.stdout}${result.stderr}`;
    const actual = result.status === 0 ? "pass" : "fail";
    // 검사기가 예외로 죽은 것(스택 트레이스)은 FAIL 판정이 아니다 — 따로 센다.
    const crashed = /\n\s+at /.test(output);
    return { actual, output, ok: actual === testCase.expect && !crashed && (!testCase.match || output.includes(testCase.match)) };
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

let passCount = 0;
let failCount = 0;
const report = (ok, name, detail) => {
  if (ok) { passCount += 1; console.log(`PASS  ${name}`); return; }
  failCount += 1;
  console.log(`FAIL  ${name}`);
  if (detail) console.log(`      ${detail}`);
};

for (const testCase of cases) {
  let outcome;
  try { outcome = runCase(testCase); } catch (error) { outcome = { ok: false, actual: "error", output: error.message }; }
  report(outcome.ok, testCase.name, `기대=${testCase.expect}${testCase.match ? ` + "${testCase.match}"` : ""} 실제=${outcome.actual}\n      ${outcome.output.trim().split(/\r?\n/).join("\n      ")}`);
}

// 시간·커밋 거리 신호는 순수 함수로 직접 확인한다(fixture 루트는 git 저장소가 아니다).
report(staleCommitWarning({ last_verified_commit: "abc" }, 47)?.includes("47커밋") === true, "기준을 넘는 커밋 거리는 경고 문구를 돌려준다");
report(staleCommitWarning({ last_verified_commit: "abc" }, 20) === null, "기준 이내의 커밋 거리는 경고하지 않는다");
report(staleCommitWarning({ last_verified_commit: "abc" }, null) === null, "거리를 잴 수 없으면(얕은 clone) 경고하지 않는다");
report(statusAgeWarning("최종 갱신: 2026-09-02.", "2026-09-20")?.includes("18일") === true, "STATUS 갱신일이 HEAD 커밋일보다 기준 넘게 앞서면 경고한다");
report(statusAgeWarning("최종 갱신: 2026-09-10.", "2026-09-20") === null, "기준 이내면 경고하지 않는다");
report(statusAgeWarning("날짜 표기 없음", "2026-09-20") === null, "갱신일 표기가 없으면 판정하지 않는다");

console.log(`\n${passCount}/${passCount + failCount} PASS, ${failCount} FAIL`);
process.exit(failCount > 0 ? 1 : 0);
