// claude-scope-guard.mjs 파이프 테스트 — PreToolUse 입력을 실제로 stdin에 흘려보내
// 소유 파일 밖 Write/Edit가 ask로, 안쪽 쓰기가 통과로 판정되는지 확인한다(이슈 #27
// 완료 조건: "훅을 넣는다면 파이프 테스트로 오탐·미탐을 확인하고, scripts/에 테스트
// 파일로 남긴다" — claude-git-guard.mjs는 이 절차를 수동으로만 하고 파일로 남기지
// 않았다, docs/PROCESS_LOG.md §2.5).
//
// scripts/claude-scope-guard.mjs는 절대 수정하지 않는다(읽기 전용 검사 대상) —
// os.tmpdir() 아래 임시 root에 그 사본과 fixture tasks/CURRENT_TASK.md를 두고 그
// 사본에 대해서만 실행하며, 실제 저장소의 tasks/CURRENT_TASK.md는 전혀 건드리지 않는다.
//
// 케이스는 { name, toolName, filePath, expect } 배열이고, expect는 "ask" | "pass".
// "ask"는 stdout에 permissionDecision:"ask"가 있어야 하고, "pass"는 stdout이 비어야 한다.
// 케이스를 추가하려면 이 배열에 항목을 하나 더하면 된다.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";

const scriptDir = path.dirname(process.argv[1]);
const root = path.resolve(scriptDir, "..");
const guardSource = fs.readFileSync(path.join(root, "scripts/claude-scope-guard.mjs"), "utf8");

// 실제 CURRENT_TASK.md의 "소유 파일" 표기 관용구(backtick 경로 나열 + 글롭 + "이 파일")를
// 그대로 재현한 fixture. 섹션 B는 "완료된 과거 작업"을 흉내낸다 — 현재 훅이 작업 상태를
// 가리지 않고 파일 전체를 합친다는 알려진 한계를 그대로 테스트한다(케이스 7).
// "상태" 문단처럼 "소유 파일"이라는 낱말이 산문 중간에 등장하지만 선언 불릿이 아닌
// 줄도 넣는다 — decoy 토큰 `docs/DECOY_FROM_PROSE.md`가 실제 선언(줄 앞머리 "- 소유
// 파일:")이 아니라 문장 속 언급이므로 허용 목록에 새면 안 된다(케이스 8, 회귀 테스트).
const FIXTURE_CURRENT_TASK = `# 테스트용 CURRENT_TASK

## 섹션 A (진행 중)

상태: 누구의 소유 파일도 아니었던 \`docs/DECOY_FROM_PROSE.md\`에 대한 이야기(선언 아님, 산문 언급).

- 소유 파일: \`docs/DECISIONS.md\`, \`harness/*.yaml\`, \`.claude/agents/\`, 이 파일

## 섹션 B (완료)

- 소유 파일: \`data/taxonomy/v2.json\`
`;

function makeTempRoot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "scope-guard-test-"));
  fs.mkdirSync(path.join(dir, "scripts"));
  fs.mkdirSync(path.join(dir, "tasks"));
  fs.writeFileSync(path.join(dir, "scripts/claude-scope-guard.mjs"), guardSource);
  fs.writeFileSync(path.join(dir, "tasks/CURRENT_TASK.md"), FIXTURE_CURRENT_TASK);
  return dir;
}

const cases = [
  {
    name: "선언된 정확 경로(docs/DECISIONS.md)는 통과한다",
    toolName: "Write", filePath: "docs/DECISIONS.md", expect: "pass"
  },
  {
    name: "선언 밖 경로(docs/PROCESS_LOG.md)는 확인을 요구한다 — 이슈 #27 재현",
    toolName: "Edit", filePath: "docs/PROCESS_LOG.md", expect: "ask"
  },
  {
    name: "글롭 매치(harness/quality-gates.yaml)는 통과한다",
    toolName: "Write", filePath: "harness/quality-gates.yaml", expect: "pass"
  },
  {
    name: "글롭 비매치(harness/notes.txt, 확장자 다름)는 확인을 요구한다",
    toolName: "Write", filePath: "harness/notes.txt", expect: "ask"
  },
  {
    name: "디렉터리 접두 선언(.claude/agents/) 아래 파일은 통과한다",
    toolName: "Edit", filePath: ".claude/agents/researcher.md", expect: "pass"
  },
  {
    name: "'이 파일' 특례로 tasks/CURRENT_TASK.md 자신은 통과한다",
    toolName: "Edit", filePath: "tasks/CURRENT_TASK.md", expect: "pass"
  },
  {
    name: "다른(완료된) 섹션의 소유 파일도 통과한다 — 알려진 과다허용 한계",
    toolName: "Write", filePath: "data/taxonomy/v2.json", expect: "pass"
  },
  {
    name: "matcher 밖 도구(Bash)로 직접 호출하면 판단하지 않는다",
    toolName: "Bash", filePath: "docs/PROCESS_LOG.md", expect: "pass"
  },
  {
    name: "선언 불릿이 아닌 산문 속 '소유 파일' 언급의 backtick 경로는 새지 않는다(회귀)",
    toolName: "Write", filePath: "docs/DECOY_FROM_PROSE.md", expect: "ask"
  },
  {
    name: "손상된 JSON 입력은 판단하지 않고 통과한다(fail-open)",
    raw: "{ not json", expect: "pass"
  },
  {
    name: "프로젝트 root 밖 절대경로는 확인을 요구한다",
    toolName: "Write", filePath: "OUTSIDE_ROOT", expect: "ask"
  }
];

function runCase(testCase) {
  const tempRoot = makeTempRoot();
  try {
    let raw;
    if (testCase.raw !== undefined) {
      raw = testCase.raw;
    } else {
      const absoluteFilePath = testCase.filePath === "OUTSIDE_ROOT"
        ? path.join(os.tmpdir(), "definitely-outside-scope-guard-root.md")
        : path.join(tempRoot, testCase.filePath);
      raw = JSON.stringify({ tool_name: testCase.toolName, tool_input: { file_path: absoluteFilePath } });
    }

    const result = spawnSync(process.execPath, [path.join(tempRoot, "scripts/claude-scope-guard.mjs")], {
      cwd: tempRoot,
      input: raw,
      encoding: "utf8"
    });

    const asked = /"permissionDecision"\s*:\s*"ask"/.test(result.stdout);
    return { actual: asked ? "ask" : "pass", stdout: result.stdout, stderr: result.stderr, error: result.error };
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

let passCount = 0;
let failCount = 0;

for (const testCase of cases) {
  const { actual, stdout, stderr, error } = runCase(testCase);
  const ok = actual === testCase.expect && !error;

  if (ok) {
    passCount += 1;
    console.log(`PASS  ${testCase.name}`);
  } else {
    failCount += 1;
    console.log(`FAIL  ${testCase.name}`);
    console.log(`      기대=${testCase.expect} 실제=${actual}${error ? ` (spawn 오류: ${error.message})` : ""}`);
    if (stdout.trim()) console.log(`      stdout: ${stdout.trim()}`);
    if (stderr.trim()) console.log(`      stderr: ${stderr.trim()}`);
  }
}

console.log(`\n${passCount}/${cases.length} PASS, ${failCount} FAIL`);

process.exit(failCount > 0 ? 1 : 0);
