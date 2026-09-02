import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const modeArg = process.argv.findIndex((value) => value === "--mode");
const mode = modeArg >= 0 ? process.argv[modeArg + 1] : "full";
const failures = [];

if (!["quick", "full"].includes(mode)) {
  console.error("Usage: node scripts/verify.mjs --mode quick|full");
  process.exit(1);
}

const required = [
  "BOOTSTRAP.md", "README.md", "AGENTS.md", "CLAUDE.md", "PRD.md",
  "docs/ARCHITECTURE.md", "docs/DATA_MODEL.md", "docs/UX_SPEC.md",
  "docs/AI_RAG_SPEC.md", "docs/SAFETY_POLICY.md", "docs/EVAL_PLAN.md",
  "docs/AGENT_WORKFLOW.md", "docs/DECISIONS.md", "docs/ROADMAP.md",
  "docs/RISK_REGISTER.md", "docs/TRACEABILITY.md", "tasks/CURRENT_TASK.md", "tasks/TASK_TEMPLATE.md",
  "references/README.md", "references/manifest.json", "harness/work-graph.yaml", "harness/quality-gates.yaml",
  "harness/runtime-profile.json", "harness/runtime-profile.template.json", "harness/loop-state.json", "scripts/claude-stop-hook.mjs", "schemas/README.md",
  "schemas/diary-entry.schema.json", "schemas/journal-assist-output.schema.json",
  "schemas/evidence-card.schema.json", "schemas/analysis-output.schema.json", "schemas/export.schema.json"
];

for (const relative of required) {
  if (!fs.existsSync(path.join(root, relative))) failures.push(`필수 파일 누락: ${relative}`);
}

const ignored = new Set([".git", "node_modules", "dist", "coverage", ".next", "outputs", "work"]);
const textExtensions = new Set([".md", ".json", ".mjs", ".js", ".jsx", ".ts", ".tsx", ".css", ".sql", ".yml", ".yaml", ".ps1"]);
const files = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (textExtensions.has(path.extname(entry.name))) files.push(absolute);
  }
}
walk(root);

const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;
const secretPatterns = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /(OPENAI_API_KEY|ANTHROPIC_API_KEY)\s*=\s*[^\s<]{8,}/
];
for (const absolute of files) {
  const relative = path.relative(root, absolute);
  const content = fs.readFileSync(absolute, "utf8");
  if (/^(<<<<<<<|=======|>>>>>>>)/m.test(content)) failures.push(`병합 충돌 표식: ${relative}`);
  if (secretPatterns.some((pattern) => pattern.test(content))) failures.push(`명백한 비밀값 후보: ${relative}`);
  if (path.extname(absolute) !== ".md") continue;
  for (const match of content.matchAll(linkPattern)) {
    let target = match[1].trim().replace(/^<|>$/g, "");
    if (/^(https?:\/\/|mailto:|#|[A-Za-z][A-Za-z0-9+.-]*:)/.test(target)) continue;
    target = decodeURIComponent(target.split("#", 1)[0]);
    if (!target) continue;
    if (!fs.existsSync(path.resolve(path.dirname(absolute), target))) failures.push(`깨진 내부 링크: ${relative} -> ${match[1]}`);
  }
}

for (const jsonFile of ["package.json", ".claude/settings.json", "harness/runtime-profile.json", "harness/runtime-profile.template.json", "harness/loop-state.json", "references/manifest.json", "schemas/diary-entry.schema.json", "schemas/journal-assist-output.schema.json", "schemas/evidence-card.schema.json", "schemas/analysis-output.schema.json", "schemas/export.schema.json"]) {
  const absolute = path.join(root, jsonFile);
  if (!fs.existsSync(absolute)) continue;
  try { JSON.parse(fs.readFileSync(absolute, "utf8")); }
  catch (error) { failures.push(`JSON 구문 오류: ${jsonFile}: ${error.message}`); }
}

const sourceManifestPath = path.join(root, "references/manifest.json");
if (fs.existsSync(sourceManifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(sourceManifestPath, "utf8"));
  for (const item of manifest.files ?? []) {
    const absolute = path.join(root, "references", item.path);
    if (!fs.existsSync(absolute)) { failures.push(`원자료 누락: references/${item.path}`); continue; }
    const bytes = fs.readFileSync(absolute);
    const digest = createHash("sha256").update(bytes).digest("hex");
    if (bytes.length !== item.bytes) failures.push(`원자료 byte 불일치: references/${item.path}`);
    if (digest !== item.sha256) failures.push(`원자료 SHA-256 불일치: references/${item.path}`);
  }
}

const prd = fs.readFileSync(path.join(root, "PRD.md"), "utf8");
const traceability = fs.readFileSync(path.join(root, "docs/TRACEABILITY.md"), "utf8");
for (let index = 1; index <= 15; index += 1) {
  const id = `PR-${String(index).padStart(3, "0")}`;
  if (!prd.includes(id)) failures.push(`PRD 요구사항 ID 누락: ${id}`);
  if (!traceability.includes(id)) failures.push(`추적성 ID 누락: ${id}`);
}

const graphText = fs.readFileSync(path.join(root, "harness/work-graph.yaml"), "utf8");
const qualityText = fs.readFileSync(path.join(root, "harness/quality-gates.yaml"), "utf8");
const nodeBlock = graphText.split(/^edges:/m, 1)[0];
const nodes = new Map();
let currentNode = null;
for (const line of nodeBlock.split(/\r?\n/)) {
  const idMatch = line.match(/^  - id: ([a-z0-9-]+)\s*$/);
  if (idMatch) {
    currentNode = idMatch[1];
    if (nodes.has(currentNode)) failures.push(`작업 그래프 중복 node: ${currentNode}`);
    nodes.set(currentNode, []);
    continue;
  }
  const dependencyMatch = line.match(/^    depends_on: \[(.*)\]\s*$/);
  if (currentNode && dependencyMatch) {
    const dependencies = dependencyMatch[1].split(",").map((value) => value.trim()).filter(Boolean);
    nodes.set(currentNode, dependencies);
  }
  const gateMatch = line.match(/^    gate: ([a-z0-9-]+)\s*$/);
  if (gateMatch && !new RegExp(`^  ${gateMatch[1]}:`, "m").test(qualityText.split(/^node_gates:/m)[1] ?? "")) {
    failures.push(`정의되지 않은 node gate: ${gateMatch[1]}`);
  }
}
for (const [node, dependencies] of nodes) {
  for (const dependency of dependencies) if (!nodes.has(dependency)) failures.push(`작업 그래프의 알 수 없는 선행 node: ${node} -> ${dependency}`);
}
const visiting = new Set();
const visited = new Set();
function visit(node) {
  if (visiting.has(node)) { failures.push(`작업 그래프 순환: ${node}`); return; }
  if (visited.has(node)) return;
  visiting.add(node);
  for (const dependency of nodes.get(node) ?? []) visit(dependency);
  visiting.delete(node);
  visited.add(node);
}
for (const node of nodes.keys()) visit(node);

const loopState = JSON.parse(fs.readFileSync(path.join(root, "harness/loop-state.json"), "utf8"));
if (!nodes.has(loopState.next_node)) failures.push(`loop-state의 알 수 없는 next_node: ${loopState.next_node}`);

if (mode === "full" && fs.existsSync(path.join(root, "package.json"))) {
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  for (const name of ["lint", "typecheck", "test", "build"]) {
    if (!packageJson.scripts?.[name]) continue;
    console.log(`RUN: npm run ${name}`);
    const executable = process.platform === "win32" ? "npm.cmd" : "npm";
    const result = spawnSync(executable, ["run", name], { cwd: root, stdio: "inherit" });
    if (result.status !== 0) failures.push(`npm run ${name} 실패`);
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}

console.log(`PASS: ${mode} 검증 완료`);
