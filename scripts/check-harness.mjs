// harness/ 상태 파일과 기계 계약이 실제 저장소와 어긋났는지 검사한다(TASK-INFRA-01).
//
// 왜 필요한가: verify.mjs는 harness 파일이 "있는지, JSON 문법이 맞는지"만 봤다. 그래서
// loop-state.json이 16일·30여 커밋 동안 멈춰 있어도, runtime-profile이 test 명령을 null로
// 적어 둔 채 package.json에 test가 생겨도, schema의 카테고리 enum이 taxonomy v2(9계열)를
// 따라오지 않고 7개로 남아 있어도 quick·full은 계속 PASS였다. 문서에 "루프마다 갱신한다"고
// 적은 약속은 지켜지지 않았고 기계 검사만 지켜졌다(PROCESS_LOG §2.4와 같은 교훈).
//
// FAIL과 WARN을 나눈 기준:
// - FAIL은 같은 커밋이면 언제 어디서 돌려도 결과가 같은 어긋남만 다룬다(파일끼리의 모순).
// - 시간이나 커밋 거리에 기대는 신호는 WARN이다. quick은 Claude Stop 훅이 매 턴 실행하므로,
//   아무것도 고치지 않았는데 날짜가 지나서 또는 CI의 얕은 clone이라서 실패하면 검사 자체가
//   새 고장 지점이 된다. WARN은 출력만 하고 exit 0이다.
//
// HARNESS_CHECK_ROOT로 검사할 루트를 바꿀 수 있다(테스트 fixture용, check-characters와 같은 방식).

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const STARTED = new Set(["in_progress", "verifying", "done"]);
const STALE_COMMITS = 20;
const STALE_STATUS_DAYS = 14;

// verify.mjs와 같은 줄 단위 파서를 쓴다(YAML 라이브러리 없이 id/status/depends_on 줄만 읽음).
export function parseWorkGraph(text) {
  const allowedMatch = text.match(/^\s*allowed:\s*\[(.*)\]\s*$/m);
  const allowed = allowedMatch ? allowedMatch[1].split(",").map((value) => value.trim()).filter(Boolean) : [];
  const nodes = new Map();
  let current = null;
  for (const line of text.split(/^edges:/m, 1)[0].split(/\r?\n/)) {
    const idMatch = line.match(/^  - id: ([a-z0-9-]+)\s*$/);
    if (idMatch) { current = { status: null, dependsOn: [] }; nodes.set(idMatch[1], current); continue; }
    if (!current) continue;
    const statusMatch = line.match(/^    status: ([a-z_]+)\s*$/);
    if (statusMatch) current.status = statusMatch[1];
    const dependsMatch = line.match(/^    depends_on: \[(.*)\]\s*$/);
    if (dependsMatch) current.dependsOn = dependsMatch[1].split(",").map((value) => value.trim()).filter(Boolean);
  }
  return { allowed, nodes };
}

// harness/README: 선행 gate가 통과하기 전 다음 노드를 시작 상태로 바꾸지 않는다.
export function checkWorkGraph({ allowed, nodes }) {
  const failures = [];
  for (const [id, node] of nodes) {
    if (allowed.length && !allowed.includes(node.status)) failures.push(`work-graph ${id}: 허용되지 않은 status '${node.status}'`);
    if (!STARTED.has(node.status)) continue;
    for (const dependency of node.dependsOn) {
      const dependencyStatus = nodes.get(dependency)?.status;
      if (dependencyStatus !== "done") failures.push(`work-graph ${id}: status가 '${node.status}'인데 선행 ${dependency}가 '${dependencyStatus}'다(선행은 done이어야 한다)`);
    }
  }
  return failures;
}

export function checkLoopState(loopState, nodes, currentTaskText) {
  const failures = [];
  const next = nodes.get(loopState.next_node);
  if (next?.status === "done") failures.push(`loop-state next_node '${loopState.next_node}'가 work-graph에서 이미 done이다`);
  const done = [...nodes].filter(([, node]) => node.status === "done").map(([id]) => id).sort();
  const completed = [...(loopState.completed_nodes ?? [])].sort();
  if (done.join(",") !== completed.join(",")) failures.push(`loop-state completed_nodes [${completed.join(", ")}]가 work-graph의 done 노드 [${done.join(", ")}]와 다르다`);
  // "# 보류 기록: TASK-X"처럼 끝난 작업의 머리글은 세지 않는다 — 머리글이 task_id로 시작해야 한다.
  const escaped = String(loopState.task_id ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!escaped || !new RegExp(`^# ${escaped}(\\s|$)`, "m").test(currentTaskText)) failures.push(`loop-state task_id '${loopState.task_id}'로 시작하는 머리글이 tasks/CURRENT_TASK.md에 없다(끝났거나 옮겨진 작업)`);
  return failures;
}

export function checkRuntimeCommands(commands, packageJson, hasLockfile) {
  const failures = [];
  const scripts = packageJson.scripts ?? {};
  for (const name of ["dev", "lint", "typecheck", "test", "build", "e2e"]) {
    if (scripts[name] && commands?.[name] == null) failures.push(`runtime-profile commands.${name}이 null인데 package.json에 '${name}' script가 있다`);
  }
  const hasDependencies = Object.keys({ ...packageJson.dependencies, ...packageJson.devDependencies }).length > 0;
  if (hasLockfile && hasDependencies && commands?.install == null) failures.push("runtime-profile commands.install이 null인데 의존성과 package-lock.json이 있다");
  for (const [key, value] of Object.entries(commands ?? {})) {
    const match = typeof value === "string" ? value.match(/^npm run ([\w:.-]+)/) : null;
    if (match && !scripts[match[1]]) failures.push(`runtime-profile commands.${key}이 가리키는 script '${match[1]}'가 package.json에 없다`);
  }
  return failures;
}

const GATE_TO_SCRIPT = { lint: "lint", typecheck: "typecheck", "unit-and-integration": "test", "production-build": "build" };

export function checkQualityGates(text, packageJson) {
  const failures = [];
  const scripts = packageJson.scripts ?? {};
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const nameMatch = lines[index].match(/^\s*- name: ([\w-]+)\s*$/);
    const script = nameMatch ? GATE_TO_SCRIPT[nameMatch[1]] : null;
    if (!script || !scripts[script]) continue;
    const commandMatch = (lines[index + 1] ?? "").match(/^\s*command: (.*)$/);
    if (!commandMatch || commandMatch[1].trim() === "null") failures.push(`quality-gates '${nameMatch[1]}'의 command가 null인데 package.json에 '${script}' script가 있다`);
  }
  return failures;
}

function collectStrings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (value && typeof value === "object") for (const child of Object.values(value)) collectStrings(child, out);
  return out;
}

// taxonomy v2의 카테고리 code가 제품 목록의 정본이다. schema가 따라오지 않으면 그 schema로
// 검증하는 순간 새 계열(공포·혐오)의 일기와 AI 제안이 전부 거부된다.
export function checkCategoryContract(taxonomy, schemas) {
  const failures = [];
  const expected = taxonomy.categories.map((category) => category.code).sort().join(",");
  for (const [name, schema] of Object.entries(schemas)) {
    const enumValues = schema?.$defs?.emotion?.properties?.categoryCode?.enum ?? findCategoryEnum(schema);
    if (enumValues && [...enumValues].sort().join(",") !== expected) failures.push(`${name}: categoryCode enum [${enumValues.join(", ")}]이 taxonomy v2의 카테고리 [${expected.replaceAll(",", ", ")}]와 다르다`);
    for (const pattern of collectStrings(schema)) {
      const prefix = pattern.match(/^\^\(([a-z|]+)\)-/);
      if (prefix && prefix[1].split("|").sort().join(",") !== expected) failures.push(`${name}: emotionCode pattern의 prefix (${prefix[1]})가 taxonomy v2의 카테고리와 다르다`);
    }
  }
  return failures;
}

function findCategoryEnum(value) {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value.categoryCode?.enum)) return value.categoryCode.enum;
  for (const child of Object.values(value)) { const found = findCategoryEnum(child); if (found) return found; }
  return null;
}

const NEUTRAL_VARIABLES = { bg: "bg", surface: "surface", raised: "surface-raised", border: "border", "border-strong": "border-strong", text: "text", muted: "text-muted", subtle: "text-subtle", focus: "focus" };

// style-guide.html은 tokens.json을 불러오지 않고 값을 손으로 옮겨 적는다(TASK-DESIGN 후속 과제).
// 자동 로드로 바꾸기 전까지는 두 곳의 값이 같은지를 여기서 대조한다.
export function checkStyleGuideTokens(html, tokens) {
  const failures = [];
  const blocks = [...html.matchAll(/:root[^{]*\{([^}]*)\}/g)].map((match) => Object.fromEntries([...match[1].matchAll(/--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{3,8})/g)].map((pair) => [pair[1], pair[2].toUpperCase()])));
  if (!blocks.length) return ["style-guide.html에서 :root 블록을 찾지 못했다"];
  const compare = (variables, name, expected, where) => {
    if (expected == null) return;
    if (variables[name] === undefined) failures.push(`style-guide ${where} --${name}이 없다(tokens: ${expected})`);
    else if (variables[name] !== String(expected).toUpperCase()) failures.push(`style-guide ${where} --${name}: ${variables[name]} ≠ tokens ${expected}`);
  };
  const [light, ...darkBlocks] = blocks;
  for (const [key, ramp] of Object.entries(tokens.color?.emotion ?? {})) {
    for (const [step, value] of Object.entries(ramp)) if (/^\d+$/.test(step)) compare(light, `${key}-${step}`, value, "light");
  }
  for (const [mode, variableSets] of [["light", [light]], ["dark", darkBlocks]]) {
    for (const variables of variableSets) {
      for (const [css, token] of Object.entries(NEUTRAL_VARIABLES)) compare(variables, css, tokens.color?.neutral?.[token]?.[mode], mode);
      for (const [name, value] of Object.entries(tokens.color?.semantic ?? {})) compare(variables, name, value?.[mode], mode);
    }
  }
  return failures;
}

export function staleCommitWarning(loopState, commitsBehind) {
  if (commitsBehind == null) return null;
  if (commitsBehind > STALE_COMMITS) return `loop-state last_verified_commit ${loopState.last_verified_commit}이 HEAD보다 ${commitsBehind}커밋 뒤다(기준 ${STALE_COMMITS}) — 루프를 닫을 때 갱신한다`;
  return null;
}

export function statusAgeWarning(statusText, headDate) {
  const match = statusText.match(/최종 갱신:\s*(\d{4}-\d{2}-\d{2})/);
  if (!match || !headDate) return null;
  const days = Math.round((Date.parse(headDate) - Date.parse(match[1])) / 86400000);
  if (days > STALE_STATUS_DAYS) return `docs/STATUS.md 최종 갱신(${match[1]})이 HEAD 커밋일(${headDate})보다 ${days}일 앞선다(기준 ${STALE_STATUS_DAYS}일)`;
  return null;
}

function git(root, args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : null;
}

function main() {
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const root = path.resolve(process.env.HARNESS_CHECK_ROOT || repositoryRoot);
  const exists = (relative) => fs.existsSync(path.join(root, relative));
  const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
  const readJson = (relative) => JSON.parse(read(relative));
  const failures = [];
  const warnings = [];

  const graph = parseWorkGraph(read("harness/work-graph.yaml"));
  const loopState = readJson("harness/loop-state.json");
  const packageJson = readJson("package.json");
  failures.push(...checkWorkGraph(graph));
  failures.push(...checkLoopState(loopState, graph.nodes, read("tasks/CURRENT_TASK.md")));
  failures.push(...checkRuntimeCommands(readJson("harness/runtime-profile.json").commands, packageJson, exists("package-lock.json")));
  failures.push(...checkQualityGates(read("harness/quality-gates.yaml"), packageJson));

  if (exists("data/taxonomy/v2.json")) {
    const schemas = {};
    for (const name of ["schemas/diary-entry.schema.json", "schemas/journal-assist-output.schema.json"]) if (exists(name)) schemas[name] = readJson(name);
    failures.push(...checkCategoryContract(readJson("data/taxonomy/v2.json"), schemas));
  }
  if (exists("design/style-guide.html") && exists("design/tokens.json")) failures.push(...checkStyleGuideTokens(read("design/style-guide.html"), readJson("design/tokens.json")));

  // 얕은 clone(CI 기본)이나 git이 없는 환경에서는 거리를 잴 수 없다 — 조용히 건너뛴다.
  if (git(root, ["rev-parse", "--is-shallow-repository"]) === "false") {
    const behind = git(root, ["rev-list", "--count", `${loopState.last_verified_commit}..HEAD`]);
    if (behind == null) warnings.push(`loop-state last_verified_commit ${loopState.last_verified_commit}을 이 저장소에서 찾지 못했다`);
    else warnings.push(staleCommitWarning(loopState, Number(behind)));
  }
  if (exists("docs/STATUS.md")) warnings.push(statusAgeWarning(read("docs/STATUS.md"), git(root, ["log", "-1", "--format=%cs"])));

  for (const warning of warnings.filter(Boolean)) console.log(`WARN: ${warning}`);
  if (failures.length) {
    for (const failure of failures) console.error(`FAIL: ${failure}`);
    process.exit(1);
  }
  console.log(`PASS: harness·계약 드리프트 검사 통과(경고 ${warnings.filter(Boolean).length}건)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
