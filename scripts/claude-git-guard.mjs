// PreToolUse(Bash) 훅 — git commit·push는 반드시 사용자 확인을 거친다.
//
// 왜 필요한가: 2026-09-05 taxonomy 작업에서 하위 에이전트가 프롬프트의 커밋 금지를
// 어기고 커밋했고(`5fed92f`), 되돌려야 했다. 문서와 프롬프트에 적은 약속은 지켜지지
// 않았고 기계 검사만 지켜졌다. 그래서 이 규칙을 훅으로 옮긴다.
//
// 차단이 아니라 확인이다. 사용자가 시킨 GitHub 작업은 승인하면 그대로 진행되고,
// 아무도 시키지 않은 커밋은 그 자리에서 사용자 눈에 띈다.
//
// stdin으로 PreToolUse 입력 JSON을 받아, git commit/push로 보이면
// permissionDecision: "ask"를 돌려준다. 그 외에는 아무것도 출력하지 않는다(통과).
//
// 예외 — auto 모드의 주 에이전트(D-060, docs/PROCESS_LOG.md §5): 입력의 permission_mode가 auto이고
// agent_id가 없으면 확인하지 않는다. 사용자가 자동 진행을 택한 세션인데 이 훅의 ask는 auto 모드도
// 막지 못해 커밋·푸시마다 창이 떴다. 하위 에이전트(입력에 agent_id가 붙는다)는 auto에서도 확인한다 —
// 이 훅을 만든 사고가 하위 에이전트의 커밋이었고 평소에는 일어나지 않는 일이라, 창이 뜨면 이상 신호다.
// 모드를 알 수 없으면(필드 없음) 안전 쪽인 확인을 유지한다.

import { stdin, stdout } from "node:process";

let raw = "";
stdin.setEncoding("utf8");
for await (const chunk of stdin) raw += chunk;

let input = {};
let command = "";
try {
  input = JSON.parse(raw) ?? {};
  command = input?.tool_input?.command ?? "";
} catch {
  // 입력을 못 읽으면 판단하지 않고 통과시킨다. 훅 오류로 정상 작업을 막지 않는다.
  command = "";
}

// `git ... commit` / `git ... push` 를 명령 어디에서든 찾는다.
// `cd x && git commit`, `git -C /path commit`, `git push --force` 같은 형태를 모두 잡는다.
// `[^;&|]*` 로 구분자를 넘지 않게 해서 `ls; echo commit` 류의 오탐을 줄인다.
// 오탐(예: `git log --grep=commit`)은 확인 한 번으로 끝나지만,
// 놓치면 되돌릴 커밋이 생긴다 — 확인하는 쪽으로 기운 판단이다.
const gitWrite = /\bgit\b[^;&|]*\b(commit|push)\b/;

const bySubAgent = Boolean(input?.agent_id);
const autoMainThread = input?.permission_mode === "auto" && !bySubAgent;

if (!autoMainThread && gitWrite.test(command)) {
  stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: bySubAgent
        ? `하위 에이전트(${input.agent_type ?? "종류 모름"})가 커밋·푸시를 시도했다. AGENTS.md §2.1은 하위 에이전트의 ` +
          "커밋을 금지한다 — 사용자가 시킨 것이 아니면 거부하라."
        : "커밋·푸시는 사용자 확인이 필요하다(AGENTS.md). 사용자가 직접 지시한 작업이면 승인하고, " +
          "그렇지 않으면 거부하라. 하위 에이전트는 어떤 경우에도 커밋하지 않는다."
    }
  }));
}
