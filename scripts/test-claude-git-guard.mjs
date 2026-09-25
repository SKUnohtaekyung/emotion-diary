// claude-git-guard.mjs 파이프 테스트 — PreToolUse(Bash) 입력을 실제로 stdin에 흘려보내
// git commit·push로 보이는 명령이 ask로, 그 밖의 명령이 통과로 판정되는지 확인한다.
// 이 훅은 2026-09-05에 만들 때 파이프 테스트를 손으로만 하고 파일로 남기지 않았다
// (docs/PROCESS_LOG.md §2.5). scope-guard에는 테스트가 있는데 이쪽은 비어 있었다.
//
// 케이스는 { name, command, expect } 배열이고 expect는 "ask" | "pass"다. "ask"는 stdout에
// permissionDecision:"ask"가 있어야 하고 "pass"는 stdout이 비어야 한다.
// expect 옆의 known은 "지금 동작을 그대로 적어 둔 것"이라는 표시다 — 고쳐야 할 결함이
// 아니라 설계상 받아들인 오탐·미탐이며, 훅을 바꿀 때 의도한 변화인지 알아보게 해 준다.
//
// 선택 필드(D-060): mode는 입력의 permission_mode, agentId·agentType은 서브에이전트 호출에만 붙는
// agent_id·agent_type, reasonIncludes는 ask 사유에 들어 있어야 하는 문구다. 모드 필드가 없는 입력은
// "모드를 알 수 없음"이라 안전 쪽(확인)으로 판정해야 한다.

import path from "node:path";
import { spawnSync } from "node:child_process";

const guard = path.join(path.dirname(process.argv[1]), "claude-git-guard.mjs");

const cases = [
  { name: "git commit은 확인을 요구한다", command: 'git commit -m "메시지"', expect: "ask" },
  { name: "git push는 확인을 요구한다", command: "git push origin main", expect: "ask" },
  { name: "cd 뒤에 이어 붙인 git commit도 잡는다", command: 'cd "C:/repo" && git add . && git commit -q -F -', expect: "ask" },
  { name: "git -C <path> commit 형태도 잡는다", command: "git -C /path/to/repo commit --amend", expect: "ask" },
  { name: "git push --force도 잡는다", command: "git push --force-with-lease", expect: "ask" },
  { name: "git status는 통과한다", command: "git status --short", expect: "pass" },
  { name: "git add는 통과한다(커밋이 아니다)", command: "git add --renormalize references/source/", expect: "pass" },
  { name: "git log는 통과한다", command: "git log --oneline -5", expect: "pass" },
  { name: "git이 아닌 명령 속 commit 낱말은 통과한다", command: "echo commit; ls", expect: "pass" },
  { name: "구분자 뒤의 commit 낱말은 git 명령에 묶이지 않는다", command: "git status; echo commit", expect: "pass" },
  { name: "빈 명령은 통과한다", command: "", expect: "pass" },
  { name: "[known 오탐] git log --grep=commit은 확인을 요구한다 — 확인 한 번으로 끝나므로 받아들임", command: "git log --grep=commit", expect: "ask" },
  { name: "[known 미탐] gh pr merge·gh issue close는 git 명령이 아니라 잡지 못한다", command: "gh pr merge 28 --squash", expect: "pass" },

  // D-060 — 권한 모드와 서브에이전트. mode는 입력의 permission_mode, agentId는 서브에이전트 호출에만 붙는 agent_id.
  // 위 케이스들은 모드 필드가 없는 입력이라, "모드를 알 수 없으면 확인한다"(안전 쪽)는 것도 함께 지킨다.
  { name: "[auto] 주 에이전트의 git commit은 확인하지 않는다", mode: "auto", command: 'git commit -m "메시지"', expect: "pass" },
  { name: "[auto] 주 에이전트의 git push도 확인하지 않는다", mode: "auto", command: "git push origin main", expect: "pass" },
  { name: "[auto] 주 에이전트의 cd 뒤 git commit도 확인하지 않는다", mode: "auto", command: 'cd "C:/repo" && git add . && git commit -q -F -', expect: "pass" },
  { name: "[auto] 하위 에이전트의 git commit은 여전히 확인한다", mode: "auto", agentId: "sub-1", agentType: "verifier", command: 'git commit -m "메시지"', expect: "ask", reasonIncludes: "하위 에이전트(verifier)" },
  { name: "[auto] 하위 에이전트의 git push도 여전히 확인한다", mode: "auto", agentId: "sub-1", command: "git push origin main", expect: "ask", reasonIncludes: "하위 에이전트(종류 모름)" },
  { name: "[default] 주 에이전트의 git commit은 확인한다", mode: "default", command: 'git commit -m "메시지"', expect: "ask", reasonIncludes: "커밋·푸시는 사용자 확인이 필요하다" },
  { name: "[default] 하위 에이전트의 git commit도 확인한다", mode: "default", agentId: "sub-1", agentType: "verifier", command: 'git commit -m "메시지"', expect: "ask" },
  { name: "[acceptEdits] auto가 아닌 다른 자동 계열 모드는 종전대로 확인한다", mode: "acceptEdits", command: "git push origin main", expect: "ask" },
  { name: "[plan] auto가 아니면 종전대로 확인한다", mode: "plan", command: 'git commit -m "메시지"', expect: "ask" },
  { name: "[auto] git이 아닌 명령은 그대로 통과한다", mode: "auto", command: "npm run verify:quick", expect: "pass" }
];

function run(stdinText) {
  const result = spawnSync(process.execPath, [guard], { input: stdinText, encoding: "utf8" });
  return { stdout: result.stdout ?? "", stderr: result.stderr ?? "", status: result.status, error: result.error };
}

let passCount = 0;
let failCount = 0;
const report = (ok, name, detail) => {
  if (ok) { passCount += 1; console.log(`PASS  ${name}`); return; }
  failCount += 1;
  console.log(`FAIL  ${name}`);
  console.log(`      ${detail}`);
};

for (const testCase of cases) {
  const input = { tool_name: "Bash", tool_input: { command: testCase.command } };
  if (testCase.mode) input.permission_mode = testCase.mode;
  if (testCase.agentId) {
    input.agent_id = testCase.agentId;
    if (testCase.agentType) input.agent_type = testCase.agentType;
  }
  const { stdout, stderr, status, error } = run(JSON.stringify(input));
  const actual = /"permissionDecision"\s*:\s*"ask"/.test(stdout) ? "ask" : stdout.trim() === "" ? "pass" : "unknown";
  const reasonOk = !testCase.reasonIncludes || stdout.includes(testCase.reasonIncludes);
  report(actual === testCase.expect && reasonOk && status === 0 && !error, testCase.name, `기대=${testCase.expect}${testCase.reasonIncludes ? `(사유에 "${testCase.reasonIncludes}")` : ""} 실제=${actual} exit=${status} stdout=${stdout.trim()} stderr=${stderr.trim()}`);
}

// 훅 오류로 정상 작업을 막지 않는다는 원칙: 입력을 못 읽으면 판단하지 않고 통과한다.
for (const [name, input] of [["손상된 JSON 입력은 판단하지 않고 통과한다(fail-open)", "{not json"], ["command가 없는 입력은 통과한다", JSON.stringify({ tool_name: "Bash", tool_input: {} })]]) {
  const { stdout, status } = run(input);
  report(stdout.trim() === "" && status === 0, name, `exit=${status} stdout=${stdout.trim()}`);
}

console.log(`\n${passCount}/${passCount + failCount} PASS, ${failCount} FAIL`);
process.exit(failCount > 0 ? 1 : 0);
