// claude-scope-guard.mjs 파이프 테스트 — PreToolUse 입력을 실제로 stdin에 흘려보내
// 소유 파일 밖 Write/Edit가 ask로, 안쪽 쓰기가 통과로 판정되는지 확인한다(이슈 #27
// 완료 조건: "훅을 넣는다면 파이프 테스트로 오탐·미탐을 확인하고, scripts/에 테스트
// 파일로 남긴다" — claude-git-guard.mjs는 이 절차를 수동으로만 하고 파일로 남기지
// 않았다, docs/PROCESS_LOG.md §2.5).
//
// scripts/claude-scope-guard.mjs는 절대 수정하지 않는다(읽기 전용 검사 대상) —
// os.tmpdir() 아래 임시 root에 그 사본과 fixture tasks/CURRENT_TASK.md를 두고 그
// 사본에 대해서만 실행하며, 실제 저장소의 tasks/CURRENT_TASK.md는 전혀 건드리지 않는다
// (끝의 스모크 한 건만 실제 훅을 실제 tasks/CURRENT_TASK.md로 돌린다 — 읽기만 하고 쓰지 않는다).
//
// 케이스는 { name, toolName, filePath, expect } 배열이고, expect는 "ask" | "pass".
// "ask"는 stdout에 permissionDecision:"ask"가 있어야 하고, "pass"는 stdout이 비어야 한다.
// 케이스를 추가하려면 이 배열에 항목을 하나 더하면 된다.
//
// D-060 — 선택 필드: mode(입력의 permission_mode), scratchpadDir·transcriptPath(입력의 scratchpad_dir·
// transcript_path). filePath와 이 두 값 안의 @SCRATCH·@SCRATCH2(옆 폴더)·@SCRATCH_REAL(실경로)·@PROJ
// (projects/<프로젝트> 기록 폴더)·@PROJROOT(projects)는 케이스마다 새로 만드는 임시 폴더로 바뀐다 — 모두
// 프로젝트 root 밖이다. 모든 케이스는 훅이 exit 0으로 끝나야 통과한다: 훅이 죽으면 stdout이 비어 "pass"로
// 보이므로(2026-09-19~21에 ?theme=pebble 토큰으로 29회 죽었다) 종료 코드를 따로 본다.

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
// 섹션 C는 실제 CURRENT_TASK.md에서 훅을 죽인 형태 — 선언 줄 설명문 속 `?theme=pebble` 같은, 경로가
// 아닌데 backtick에 싸인 조각 — 를 흉내낸다(D-060).
const FIXTURE_CURRENT_TASK = `# 테스트용 CURRENT_TASK

## 섹션 A (진행 중)

상태: 누구의 소유 파일도 아니었던 \`docs/DECOY_FROM_PROSE.md\`에 대한 이야기(선언 아님, 산문 언급).

- 소유 파일: \`docs/DECISIONS.md\`, \`harness/*.yaml\`, \`.claude/agents/\`, 이 파일

## 섹션 B (완료)

- 소유 파일: \`data/taxonomy/v2.json\`

## 섹션 C (설명문 속 backtick 조각)

- 소유 파일: \`docs/DECISIONS.md\`(시안이 \`?theme=pebble\`일 때만 읽는다), \`data/after-bad-token.json\`
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
  },

  // 섹션 C의 설명문 속 `?theme=pebble` 조각은 정규식이 될 수 없는 토큰이다 — 예전 훅은 이 토큰에 닿는 순간
  // 죽었다(위 "ask" 케이스들이 그 토큰에 닿는다: 소유 파일이 아니면 목록을 끝까지 훑는다).
  {
    name: "그 토큰 뒤에 선언된 경로(data/after-bad-token.json)도 통과한다 — 토큰 하나만 건너뛴다",
    toolName: "Write", filePath: "data/after-bad-token.json", expect: "pass"
  },
  {
    name: "`?`는 글롭이 아니라 글자 그대로다 — 파일 이름이 ?theme=pebble이면 통과한다",
    toolName: "Write", filePath: "?theme=pebble", expect: "pass"
  },
  {
    name: "`?` 자리에 아무 글자나 오는 이름(Xtheme=pebble)은 통과하지 않는다",
    toolName: "Write", filePath: "Xtheme=pebble", expect: "ask"
  },

  // D-060 — 권한 모드. auto가 아니면(모드 필드가 없는 위 케이스 포함) 종전대로 확인한다.
  {
    name: "[auto] 소유 파일 밖 프로젝트 파일도 확인하지 않는다",
    mode: "auto", toolName: "Edit", filePath: "docs/PROCESS_LOG.md", expect: "pass"
  },
  {
    name: "[auto] 프로젝트 root 밖 경로도 확인하지 않는다(그쪽은 auto 분류기가 검토한다)",
    mode: "auto", toolName: "Write", filePath: "OUTSIDE_ROOT", expect: "pass"
  },
  {
    name: "[default] 소유 파일 밖 프로젝트 파일은 확인한다",
    mode: "default", toolName: "Edit", filePath: "docs/PROCESS_LOG.md", expect: "ask"
  },
  {
    name: "[acceptEdits] auto가 아닌 다른 모드는 종전대로 확인한다",
    mode: "acceptEdits", toolName: "Edit", filePath: "docs/PROCESS_LOG.md", expect: "ask"
  },
  {
    name: "[plan] auto가 아니면 종전대로 확인한다",
    mode: "plan", toolName: "Edit", filePath: "docs/PROCESS_LOG.md", expect: "ask"
  },

  // D-060 — Claude Code 자신의 작업 폴더(세션 scratchpad·자동 메모리)는 모드와 상관없이 확인하지 않는다.
  {
    name: "[default] 세션 scratchpad 안 파일은 확인하지 않는다",
    mode: "default", scratchpadDir: "@SCRATCH", toolName: "Write", filePath: "@SCRATCH/qa/flow.mjs", expect: "pass"
  },
  {
    name: "[default] scratchpad와 접두어만 같은 옆 폴더(scratchpad2)는 확인한다",
    mode: "default", scratchpadDir: "@SCRATCH", toolName: "Write", filePath: "@SCRATCH2/x.txt", expect: "ask"
  },
  {
    name: "scratchpad_dir 필드가 없으면 scratchpad 경로도 확인한다(안전 쪽)",
    toolName: "Write", filePath: "@SCRATCH/x.txt", expect: "ask"
  },
  {
    name: "scratchpad_dir는 실경로, 대상은 tmpdir 표기여도 같은 폴더로 본다(Windows는 짧은 이름 NOHTAE~1과 긴 이름이 섞인다)",
    mode: "default", scratchpadDir: "@SCRATCH_REAL", toolName: "Write", filePath: "@SCRATCH/x.txt", expect: "pass"
  },
  {
    name: "[default] 자동 메모리 폴더는 확인하지 않는다(기록 파일이 projects/<프로젝트>/ 바로 아래)",
    mode: "default", transcriptPath: "@PROJ/session.jsonl", toolName: "Write", filePath: "@PROJ/memory/note.md", expect: "pass"
  },
  {
    name: "[default] 자동 메모리 폴더는 하위 에이전트 기록 위치(더 깊은 폴더)에서도 찾는다",
    mode: "default", transcriptPath: "@PROJ/session/subagents/agent-1.jsonl", toolName: "Write", filePath: "@PROJ/memory/note.md", expect: "pass"
  },
  {
    name: "[default] memory와 접두어만 같은 옆 폴더(memory2)는 확인한다",
    mode: "default", transcriptPath: "@PROJ/session.jsonl", toolName: "Write", filePath: "@PROJ/memory2/note.md", expect: "ask"
  },
  {
    name: "[default] 같은 projects 폴더의 다른 프로젝트 메모리는 확인한다",
    mode: "default", transcriptPath: "@PROJ/session.jsonl", toolName: "Write", filePath: "@PROJROOT/other-proj/memory/note.md", expect: "ask"
  },
  {
    name: "transcript_path가 없으면 메모리 경로도 확인한다(안전 쪽)",
    toolName: "Write", filePath: "@PROJ/memory/note.md", expect: "ask"
  },
  {
    name: "[default] 작업 폴더 밖 임의 경로는 두 필드가 다 있어도 확인한다",
    mode: "default", scratchpadDir: "@SCRATCH", transcriptPath: "@PROJ/session.jsonl", toolName: "Write", filePath: "OUTSIDE_ROOT", expect: "ask"
  }
];

function runCase(testCase) {
  const tempRoot = makeTempRoot();
  // 세션 scratchpad와 projects/<프로젝트> 기록 폴더를 흉내 내는 임시 폴더 — 프로젝트 root 밖이다.
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "scope-guard-work-"));
  const scratch = path.join(workDir, "scratchpad");
  const projectsRoot = path.join(workDir, "home", ".claude", "projects");
  const proj = path.join(projectsRoot, "proj");
  fs.mkdirSync(scratch, { recursive: true });
  fs.mkdirSync(path.join(proj, "memory"), { recursive: true });
  const dirs = {
    SCRATCH: scratch,
    SCRATCH2: `${scratch}2`,
    SCRATCH_REAL: fs.realpathSync.native(scratch),
    PROJROOT: projectsRoot,
    PROJ: proj
  };
  const expand = (text) => text.replace(/@(SCRATCH_REAL|SCRATCH2|SCRATCH|PROJROOT|PROJ)/g, (_, key) => dirs[key]);
  try {
    let raw;
    if (testCase.raw !== undefined) {
      raw = testCase.raw;
    } else {
      let absoluteFilePath;
      if (testCase.filePath === "OUTSIDE_ROOT") absoluteFilePath = path.join(os.tmpdir(), "definitely-outside-scope-guard-root.md");
      else if (testCase.filePath.startsWith("@")) absoluteFilePath = expand(testCase.filePath);
      else absoluteFilePath = path.join(tempRoot, testCase.filePath);
      const input = { tool_name: testCase.toolName, tool_input: { file_path: absoluteFilePath } };
      if (testCase.mode) input.permission_mode = testCase.mode;
      if (testCase.scratchpadDir) input.scratchpad_dir = expand(testCase.scratchpadDir);
      if (testCase.transcriptPath) input.transcript_path = expand(testCase.transcriptPath);
      raw = JSON.stringify(input);
    }

    const result = spawnSync(process.execPath, [path.join(tempRoot, "scripts/claude-scope-guard.mjs")], {
      cwd: tempRoot,
      input: raw,
      encoding: "utf8"
    });

    const asked = /"permissionDecision"\s*:\s*"ask"/.test(result.stdout);
    return { actual: asked ? "ask" : "pass", stdout: result.stdout, stderr: result.stderr, status: result.status, error: result.error };
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

let passCount = 0;
let failCount = 0;

for (const testCase of cases) {
  const { actual, stdout, stderr, status, error } = runCase(testCase);
  const ok = actual === testCase.expect && status === 0 && !error;

  if (ok) {
    passCount += 1;
    console.log(`PASS  ${testCase.name}`);
  } else {
    failCount += 1;
    console.log(`FAIL  ${testCase.name}`);
    console.log(`      기대=${testCase.expect} 실제=${actual} exit=${status}${error ? ` (spawn 오류: ${error.message})` : ""}`);
    if (stdout.trim()) console.log(`      stdout: ${stdout.trim()}`);
    if (stderr.trim()) console.log(`      stderr: ${stderr.trim()}`);
  }
}

// 실제 tasks/CURRENT_TASK.md로 한 번 돌려 본다(읽기만 한다). 위 케이스는 fixture만 쓰므로, 실제 선언에 섞인
// 낯선 토큰(URL 조각·설명문 등)이 훅을 죽이는 일은 여기서만 잡힌다 — 2026-09-19~21에 ?theme=pebble이 그랬다.
{
  const smokeName = "실제 tasks/CURRENT_TASK.md로 판정해도 훅이 죽지 않는다(스모크)";
  const smoke = spawnSync(process.execPath, [path.join(root, "scripts/claude-scope-guard.mjs")], {
    cwd: root,
    input: JSON.stringify({ tool_name: "Edit", tool_input: { file_path: path.join(root, "zz-smoke-not-declared.md") }, permission_mode: "default" }),
    encoding: "utf8"
  });
  if (smoke.status === 0 && !smoke.error && !smoke.stderr.trim()) {
    passCount += 1;
    console.log(`PASS  ${smokeName}`);
  } else {
    failCount += 1;
    console.log(`FAIL  ${smokeName}`);
    console.log(`      exit=${smoke.status}${smoke.error ? ` (spawn 오류: ${smoke.error.message})` : ""}`);
    if (smoke.stderr.trim()) console.log(`      stderr: ${smoke.stderr.trim().split("\n")[0]}`);
  }
}

console.log(`\n${passCount}/${passCount + failCount} PASS, ${failCount} FAIL`);

process.exit(failCount > 0 ? 1 : 0);
