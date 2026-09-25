// PreToolUse(Write|Edit) 훅 — tasks/CURRENT_TASK.md에 선언되지 않은 경로에 쓰면 사용자 확인을 거친다.
//
// 배경(이슈 #27): 하위 에이전트 1이 끝나고 하위 에이전트 2가 시작하기 전 사이, 누구의
// 소유 파일도 아니었던 docs/PROCESS_LOG.md에 73줄이 추가된 출처 불명 변경이 있었다.
// claude-git-guard.mjs(§2.1)는 git commit/push만 사용자 확인 대상으로 만들 뿐, 이번
// 변경처럼 커밋되지 않고 작업 트리에만 남는 쓰기는 애초에 지나갈 통로가 없어 아무것도
// 잡지 못했다. AGENTS.md §2의 "소유 파일" 규칙은 문서로만 있었고 기계로 검사되지 않았다.
//
// 차단이 아니라 확인이다 — claude-git-guard.mjs와 같은 설계. tasks/CURRENT_TASK.md
// 전체에서 "- 소유 파일: ..." 선언 줄의 backtick 경로/글롭을 모아 허용 목록으로 삼고,
// Write/Edit 대상이 그 목록 밖이면 permissionDecision: "ask"를 돌려준다.
//
// 확인창을 띄우지 않는 경우(D-060, docs/PROCESS_LOG.md §5):
// - 권한 모드가 auto다(입력의 permission_mode). 사용자가 자동 진행을 택한 세션에서 이 훅이
//   ask를 돌려주면 auto 모드도 그 확인창을 막지 못해 작업마다 창이 떴다. 모드를 알 수 없으면
//   (필드 없음) 안전 쪽인 확인을 유지한다.
// - 대상이 Claude Code 자신의 작업 폴더다 — 세션 scratchpad(입력의 scratchpad_dir)와 자동 메모리
//   폴더(transcript_path가 놓인 projects/<프로젝트> 폴더 아래 memory). 저장소 파일이 아니라
//   소유 파일 규칙의 대상이 아니다. 실측(2026-09-21): 이 훅이 낸 확인 78건 가운데 77건이 이 두
//   폴더 쓰기였고(나머지 1건은 그 밖의 프로젝트 밖 경로) 프로젝트 안 파일은 0건이었다. 이 제외는
//   모드와 상관없이 적용한다.
// - 소유 파일 선언의 backtick 토큰 하나가 정규식으로 바뀌지 않아도(예: URL 조각) 훅이 죽지 않는다 —
//   그 토큰만 건너뛴다. 죽은 훅은 "hook error" 알림만 남기고 조용히 통과돼 검사 전체가 꺼진다.
//   auto 모드에서는 이 검사가 꺼지므로 소유 파일 밖 쓰기의 사후 점검(이슈 #27의 "세션 경계
//   스냅샷")은 별도 작업으로 남는다.
//
// 알려진 한계(모두 과다 허용 쪽 — false negative 여지. §2.2, docs/PROCESS_LOG.md 참고):
// - 완료·보류 상태를 가리지 않고 파일 전체의 모든 "소유 파일" 선언을 하나로 합친다.
//   지금 진행 중이 아닌 과거 작업이 선언한 파일도 계속 허용된다. 작업 단위로 좁히지 않는다.
// - Bash를 통한 파일 쓰기(리다이렉션, heredoc 등)는 matcher(Write|Edit) 밖이라 잡지 못한다.
//   이슈 #27이 제안한 "세션 경계 스냅샷"이 그 사후 그물이며, 이번 변경에는 포함하지 않았다.
// - 글롭은 `*`(경로 구분자 `/`를 넘지 않는 한 조각) 하나만 지원한다.
//
// stdin으로 PreToolUse 입력 JSON을 받는다. 판단할 수 없으면(입력 파싱 실패, Write/Edit가
// 아님, tasks/CURRENT_TASK.md를 읽을 수 없음) 아무것도 출력하지 않고 통과시킨다 — 훅
// 오류로 정상 작업을 막지 않는다는 원칙은 claude-git-guard.mjs와 동일하다.

import { stdin, stdout } from "node:process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");

// tasks/CURRENT_TASK.md 본문에서 실제 "- 소유 파일: ..." 선언 줄(기존 TASK-CBM·
// TASK-BOOTSTRAP 등이 쓰는 관용구, 목록 표식 바로 뒤에 "소유 파일:"이 오는 줄)만 골라
// backtick 경로/글롭을 모은다. 단순히 문장 어딘가에 "소유 파일"이라는 낱말이 등장하는
// 산문 줄(이 훅 자체를 설명하는 이 섹션의 "상태"·"알려진 제한" 문단 등)은 제외한다 —
// 처음 구현에서는 `line.includes("소유 파일")`로 느슨하게 잡아, 산문 문단의 backtick
// 토큰(예: 예시로 든 명령어·URL)까지 허용 목록에 새는 결함이 있었다(수동 점검 중 발견).
// "이 파일"이라는 관용구는 각 작업 섹션이 tasks/CURRENT_TASK.md 자신을 가리킬 때 쓰는
// 표현이라 특례로 처리한다(실제 사례, TASK-CBM·TASK-BOOTSTRAP·TASK-ISSUE-27 섹션).
const OWNED_FILES_DECLARATION = /^[-*]\s*소유\s*파일\s*[:：]/;

export function parseOwnedPaths(currentTaskContent) {
  const owned = [];
  for (const line of currentTaskContent.split(/\r?\n/)) {
    if (!OWNED_FILES_DECLARATION.test(line.trim())) continue;
    if (line.includes("이 파일")) owned.push("tasks/CURRENT_TASK.md");
    for (const match of line.matchAll(/`([^`]+)`/g)) {
      const token = match[1].trim();
      if (token) owned.push(token);
    }
  }
  return owned;
}

// 글롭 패턴 하나를 정규식으로 바꾼다. `*`는 `/`를 넘지 않는 한 조각만 대응한다.
// `/`로 끝나는 패턴은 디렉터리 전체를 뜻하므로 접두어로만 대응하고 끝을 고정하지 않는다.
function globToRegExp(pattern) {
  const normalized = pattern.replace(/\\/g, "/");
  const isDirPrefix = normalized.endsWith("/");
  const escaped = normalized
    .split("*")
    .map((piece) => piece.replace(/[.+^${}()|[\]\\]/g, "\\$&"))
    .join("[^/]*")
    // `?`는 글롭이 아니라 글자 그대로다. 선언 줄 설명문의 backtick 조각(예: `?theme=pebble`)이
    // 패턴으로 들어와 "Nothing to repeat" 오류로 훅이 죽은 일이 있다(2026-09-19~21, 29회).
    .replaceAll("?", "[?]");
  return new RegExp(isDirPrefix ? `^${escaped}` : `^${escaped}$`);
}

export function isOwned(relativePath, ownedPaths) {
  const normalized = relativePath.replace(/\\/g, "/");
  if (normalized.startsWith("..")) return false; // 프로젝트 root 밖
  return ownedPaths.some((pattern) => {
    try {
      return globToRegExp(pattern).test(normalized);
    } catch {
      return false; // 정규식으로 바뀌지 않는 토큰은 허용 목록에서 뺀다 — 훅이 죽어 검사 전체가 꺼지는 것보다 낫다.
    }
  });
}

// Windows는 같은 폴더가 NOHTAE~1 같은 짧은 이름과 긴 이름으로 섞여 나오고, 새로 만들 파일은 아직
// 없어 realpath가 실패한다 — 실제로 있는 가장 가까운 상위 폴더까지만 풀고 나머지 이름을 붙여
// 비교할 수 있는 경로를 만든다.
function canonicalPath(target) {
  const rest = [];
  let current = path.resolve(target);
  for (;;) {
    try {
      return path.join(fs.realpathSync.native(current), ...rest.reverse());
    } catch {
      const parent = path.dirname(current);
      if (parent === current) return path.resolve(target);
      rest.push(path.basename(current));
      current = parent;
    }
  }
}

function isInside(child, parent) {
  const relative = path.relative(parent, child);
  if (relative === "" || path.isAbsolute(relative)) return false;
  return relative !== ".." && !relative.startsWith(`..${path.sep}`);
}

// Claude Code 자신의 작업 폴더인가 — 세션 scratchpad와 자동 메모리 폴더. 메모리 폴더는 transcript_path에서
// 찾는다: 기록 파일이 projects/<프로젝트>/ 바로 아래에 있든(주 에이전트) 그 밑 더 깊은 폴더에 있든
// (하위 에이전트) 위로 올라가며 "projects" 바로 밑 폴더를 찾아 그 아래 memory를 쓴다.
function isHarnessWorkDir(filePath, input) {
  const dirs = [];
  if (typeof input?.scratchpad_dir === "string" && input.scratchpad_dir) dirs.push(input.scratchpad_dir);
  if (typeof input?.transcript_path === "string" && input.transcript_path) {
    let dir = path.dirname(input.transcript_path);
    while (path.basename(path.dirname(dir)) !== "projects") {
      const parent = path.dirname(dir);
      if (parent === dir) {
        dir = "";
        break;
      }
      dir = parent;
    }
    if (dir) dirs.push(path.join(dir, "memory"));
  }
  const target = canonicalPath(filePath);
  return dirs.some((dir) => isInside(target, canonicalPath(dir)));
}

async function main() {
  let raw = "";
  stdin.setEncoding("utf8");
  for await (const chunk of stdin) raw += chunk;

  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return;
  }
  const toolName = input?.tool_name ?? "";
  const filePath = input?.tool_input?.file_path ?? "";

  if (!["Write", "Edit"].includes(toolName) || typeof filePath !== "string" || !filePath) return;

  // 머리말의 "확인창을 띄우지 않는 경우" — 아무것도 출력하지 않고 통과시킨다.
  if (input?.permission_mode === "auto") return;
  try {
    if (isHarnessWorkDir(filePath, input)) return;
  } catch {
    // 작업 폴더 판정이 실패하면 제외하지 않고 아래 소유 파일 확인으로 넘어간다(안전 쪽).
  }

  let currentTaskContent;
  try {
    currentTaskContent = fs.readFileSync(path.join(root, "tasks/CURRENT_TASK.md"), "utf8");
  } catch {
    return;
  }

  const ownedPaths = parseOwnedPaths(currentTaskContent);
  const relative = path.relative(root, path.resolve(filePath)).replace(/\\/g, "/");

  if (isOwned(relative, ownedPaths)) return;

  stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason:
        `'${relative}'는 tasks/CURRENT_TASK.md의 어떤 "소유 파일" 목록에도 없다(AGENTS.md §2, 이슈 #27). ` +
        "지시받은 작업의 일부이면 승인하고, 그렇지 않으면 거부해 출처를 확인하라."
    }
  }));
}

main();
