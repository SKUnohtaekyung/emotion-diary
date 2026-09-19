> **아카이브(2026-09-20, TASK-INFRA-01).** `tasks/CURRENT_TASK.md`에서 옮긴 기록이다. 옮기기 직전 커밋은 `b54a0a2`이고 아래 본문은 옮기기 전과 바이트 그대로다. **상태:** partial(2026-09-02) — 설치·연동·인덱싱은 끝났고 운영 규칙은 AGENT_WORKFLOW §9로 옮겨졌다. 이 파일의 `- 소유 파일:` 선언은 scope-guard에 더 이상 반영되지 않는다 — 훅은 `CURRENT_TASK.md`만 읽는다.

# TASK-CBM — Codebase Memory 통합

## 현재 상태와 승인 범위

`partial` — 2026-09-02 사용자 요청. 공식 codebase-memory-mcp 설치, 프로젝트 한정 Claude/Codex MCP 연동, 공유 Graph, 공통 탐색 지침, 실제 인덱싱·회귀·효율 검증만 수행한다. 앱 구현·Git 재초기화·기존 bootstrap 교정은 이번 작업에서 진행하지 않는다. 아래 이전 작업 기록은 원문 보존된 보류 상태다. Claude 작업공간 신뢰 승인과 실제 Claude MCP 호출은 아직 미완료다.

- Main/Writer: 주 에이전트 1명. 조사 Agent A/B/C 및 최종 verifier는 읽기 전용.
- 소유 파일: 필요한 MCP/ignore 설정, `.claude/agents/`의 읽기 도구 목록, `AGENTS.md`, `docs/AGENT_WORKFLOW.md`, `docs/DECISIONS.md`, `docs/TRACEABILITY.md`, 이 파일. 기존 `CLAUDE.md` import와 hooks/skills는 보존한다.
- 연결 요구사항: 개발 도구 통합 `AG-CBM-001` (제품 PR-001~PR-015 변경 없음).
- 인수 조건: 공식 binary version, 양 CLI MCP 발견/호출, 공유 index, symbol/call/dependency와 source 대조, scope/ignore 검증, 기존 설정 보존, quick/full 및 존재하는 앱 명령, 실제 탐색 비교를 증거로 확인한다. 미검증 항목이 있으면 부분 성공으로 보고한다.

## 현재 체크포인트

- 완료: Windows/PowerShell 7.6.4, Node 22.16.0/npm 10.9.2; `main`, commit 0, 프로젝트 파일 untracked. 기존 파일 46개를 `work/cbm-integration/baseline/`에 보존하고 SHA-256 목록을 기록했다. 변경 전/후 quick/full PASS. v0.10.8 binary-only 설치, 프로젝트 MCP 설정 2개, 공유 index, 실제 Codex CLI 호출, scope 거부, watcher 추가/삭제 반영, Graph-source 비교 완료.
- 다음: 사용자가 Codex 앱과 모든 CBM 명령을 종료해 실행 중인 `pre-cohort/unknown` daemon을 해소 → Claude Code 세션 재시작 → `claude mcp get codebase-memory-mcp` 상태 확인 → Claude에서 `list_projects`/`index_status`/`search_graph`/`trace_path`/`get_code_snippet` 실제 호출. 그전에는 전체 완료로 보고하지 않는다.
- 결정: D-028. 조사 초반에는 일회성 Git 신뢰 옵션만 썼으나 CBM의 Git 감지를 위해 이후 전역 `safe.directory`에 현재 root 하나를 추가했다. 이제 일반 `git status`와 CBM `is_git=true`, branch `main`이 확인된다. `.git/config`, 이력·branch·staging은 변경하지 않았다.
- 차단(1) CBM daemon 세대 충돌 — 2026-09-02 10:45 확인. 실행 중 daemon(pid 13804, 10:29 기동, Codex 앱 pid 5160 소유, 9749 정상)이 `active_version=pre-cohort/unknown`, `active_build=0…0`으로 등록되어 build `b4b403b1…`의 신규 frontend와 CLI가 모두 즉시 종료된다. Claude 세션은 `CONNECTION_CLOSED`로 `mcp__codebase-memory-mcp__*` 도구를 노출하지 못했고, 동일 `.mcp.json` 설정으로 직접 spawn하면 975ms 만에 exit 1과 `CBM daemon could not start within 30000 ms`, `config list`는 "pre-coordination or unverified CBM generation is active; close all CBM sessions and commands, then retry"를 반환한다. 근거는 바이너리가 남긴 `logs/daemon-conflicts.ndjson`의 `daemon.version_conflict reason=build`다. 해소는 바이너리가 안내하는 절차(모든 CBM 세션·명령 종료 후 재시작)만 사용하고 사용자 프로세스를 임의 종료하지 않는다.
- 차단(2) `claude mcp get`은 여전히 `Pending approval`이다. 다만 이번 Claude 세션은 서버 spawn을 실제 시도했으므로 승인이 이 세션의 실패 원인은 아니었다. daemon 충돌 해소 후 다시 판정해야 한다.
- 정정: 이전 "backslash 경로 키만 있고 forward-slash 키가 없다"는 원인 가설은 근거가 확인되지 않았다. 전역 `~/.claude.json`의 `projects`에 이 root 키는 backslash 형식 1개뿐이고 `hasTrustDialogAccepted=true`이며 `enabledMcpjsonServers`는 빈 배열이다. 프로젝트 `.claude/settings.local.json`에는 이 server 1개만 활성화되어 있다. `Pending approval` 표시의 정확한 판정 경로는 미확인으로 남긴다.
- 제한: 앱 source/framework/test suite가 아직 없다. 아래 실제 하네스 흐름으로 검증했다. Graph-first 호출 절감은 관찰되지 않았고 token 절감률은 산출하지 않았다.
- 증거 중간물: `work/cbm-integration/` (Git·하네스 대상 제외, 민감값 기록 금지).

## 설치·설정 증거

- 공식 release ZIP v0.10.8 SHA-256: `b43ad982994c4d829670749e08d3b622a74bb20041fc0a7d02bef6113f81c34d` (공식 checksums와 일치). 공식 ZIP의 4개 루트 항목을 확인한 뒤 실행했다.
- binary: `%LOCALAPPDATA%/Programs/codebase-memory-mcp/codebase-memory-mcp.exe`; 같은 디렉터리에 공식 updater/라이선스. 사용자 PATH에 이 디렉터리만 추가됐다. 기존 터미널은 재시작 전 absolute command를 사용한다.
- `--version` → `0.10.8`; `--help`, `config list` PASS. `install --help`는 unsupported로 확인해 이후 사용하지 않는다.
- 일반 `install --dry-run` → FAIL: Codex `hook_preflight / command_render`, 여러 전역 client/hooks/skills 변경 계획. 실제 적용하지 않았다. `install --dry-run --skip-config --dir=...` PASS 후 `install -y --skip-config --dir=...` PASS.
- `.mcp.json`/`.codex/config.toml`: 동일 binary/root/cache, `CBM_ALLOWED_ROOT` 현 root로 제한. Codex `cwd` 현 root. `.claude/settings.local.json`: 승인 대상은 이 server 한 개만 지정. 세 파일은 machine-local로 Git에서 제외.
- 공용 cache `%USERPROFILE%/.cache/codebase-memory-mcp`에 이 root의 DB 하나. MCP frontend별 DB를 만들지 않음. `persistence=false`, `.codebase-memory` artifact 없음, Git merge driver 변화 없음.
- 기존 설정 `auto_index=false`, `auto_watch=true`, `auto_index_limit=50000`, `ui_enabled=true`, port 9749 보존. 초기/필요 시 지정된 Main만 `full` index.
- 실제 exclude: `.git`, `.claude`, `work`, `outputs`, 로컬 MCP 설정, JPG 원자료. 핵심 `scripts` 3개, schema 5개, harness와 docs 포함. 기본 ignore와 `.gitignore`로 충분하므로 `.cbmignore` 미생성. 비표준 확장자 mapping 불필요하여 `.codebase-memory.json` 미생성.

## 실행 검증

| 검증 | 실제 결과 |
| --- | --- |
| JSON-RPC MCP initialize / tools/list | PASS, server 0.10.8 / 15 tools |
| Codex 0.147.0 `mcp get/list` | PASS, project MCP enabled |
| Codex `exec --ephemeral --json --sandbox read-only --skip-git-repo-check ...` | PASS, 실제 `list_projects` 및 `search_graph` 완료 이벤트, walk/visit 2건 |
| 현재 Codex 앱 및 독립 verifier의 실제 MCP 도구 | PASS, `list_projects`/index/status/search/schema 호출. 최종 수동 full index 654 nodes / 700 edges |
| Claude `mcp get` / 세션 MCP 도구 (2026-09-02 10:45) | FAIL(연결). `mcp get`은 Pending approval, 세션은 `CONNECTION_CLOSED`로 도구 미노출. 실제 Claude tool 호출 미검증 |
| Claude 세션 조건에서 binary 직접 spawn (2026-09-02 10:45) | FAIL. exit 1 / 975ms / daemon 세대 충돌. 바이너리 자체는 `--version` 0.10.8, 도움말 정상 |
| 실행 중 daemon 상태 (2026-09-02 10:45) | pid 13804 생존, `http://127.0.0.1:9749/` HTTP 200, 기존 index DB 2.8MB 유지. 신규 client만 거부됨 |
| MCP `index_repository` full / persistence=false | PASS, 38 File nodes, skipped 0, partial parse 0. 문서 변경에 따라 전체 node/edge 수는 변함 |
| MCP symbol / trace / query / snippet | PASS 호출; 정확성과 한계는 아래 기록 |
| `index_repository(repo_path="C:/Windows")` | 예상대로 outside allowed root 오류. index 생성 없음 |
| watcher 재생 | 수동 재index 없이 임시 함수 추가 15초 후 1건, 삭제 12초 후 0건. 임시 파일 제거됨 |
| Graph UI | MCP 연결 중 `http://127.0.0.1:9749/` HTTP 200, HTML 반환. 시각적 UI 조작은 미검증 |
| `node scripts/verify.mjs --mode quick` / `--mode full` | 변경 전·후 모두 PASS. 2026-09-02 이번 세션 재실행도 quick PASS / full PASS |
| 앱 lint/typecheck/test/build/e2e | 해당 scripts·suite가 없어 실행 불가. 앱 검증 통과를 뜻하지 않음 |
| `git diff --check`, source hash | PASS. 기존 3개 실행 source 및 Claude Stop 설정/CLAUDE.md는 baseline과 동일 |
| `uninstall --dry-run` | FAIL, 동일 Codex command_render 사전 검사. 실제 uninstall 미실행. 수동 rollback은 AGENT_WORKFLOW §9 |

## Graph 품질과 탐색 비교

실제 기능: `.claude/settings.json:11` Stop → `scripts/claude-stop-hook.mjs:18` spawnSync → `scripts/verify.mjs` quick → `walk:37` 파일 수집 / `visit:123` 순환 검사.

- 위치, `verify` module→`walk` 45행 / →`visit` 131행은 source와 일치한다. `get_code_snippet(walk)`의 8줄도 현재 파일과 일치한다.
- recursive 41/127행은 trace의 CALLS에는 없고 self_recursive metadata만 true. 외부 builtin/subprocess 연결도 그래프에 없으므로 targeted search/실제 코드로 보완했다.
- `walk` USAGE 중 `ignored`/`textExtensions`/`files`는 맞지만 `name`은 CI YAML, `path`는 references manifest의 동명 항목에 잘못 연결됨. 해당 dependency 주장은 기각했다.
- `.claude` 기본 제외, `package.json` File node 누락, 수정하지 않은 source의 coverage `metadata_changed` 응답도 확인. parse_partial=0이나 ready는 완전성 보장이 아니다.
- 2026-09-02 현재 working tree 재확인: `walk` 정의 37행 / 재귀 41행 / module 호출 45행, `visit` 정의 123행 / 재귀 127행 / module 호출 131행으로 위 기록과 동일하다. Stop 경로 `.claude/settings.json:11` → `scripts/claude-stop-hook.mjs:18` `spawnSync(process.execPath, [verifyPath, "--mode", "quick"])`도 그대로다. 따라서 위 Graph 누락·오연결 기록은 현재 source에 그대로 적용된다. 이번 세션에서는 Claude MCP로 재호출하지 못해 Graph 측 재확인은 미검증이다.

이미 구조를 알고 수행한 최소 경로 재생 실험이다. 각 질문을 독립 계산하고 batching과 무관하게 논리 작업 1개를 call 1개로 센다. 초기 인덱싱·세션 시작·공통 준비 호출은 제외했다.

| 합계: 순환 함수 / walk 영향 / Stop→quick | 기존 탐색 | Graph-first |
| --- | ---: | ---: |
| Grep / Glob | 3 / 0 | 2 / 0 |
| Read 파일 수(질문별 합, 전체 고유 3개) | 5 | 5 |
| Graph calls | 0 | 7 |
| 전체 논리 tool calls | 8 | 14 |
| 반환된 source 줄 | 67 | 67 |

질문별 calls는 기존 2/2/4, Graph 4/4/6. 현재 실행 코드 195줄 환경에서는 절감 효과가 관찰되지 않았다. 비교 token 측정값 없음. 앱 scaffold 이후 다시 평가한다.

## 보존 및 남은 제한

- baseline 46개 중 변경 파일은 `.gitignore`, `AGENTS.md`, `.claude/agents` 2개, `AGENT_WORKFLOW`, `DECISIONS`, `TRACEABILITY`, 이 파일 8개. 나머지 source·원자료·스키마·제품 명세·Stop hook·CLAUDE import는 보존.
- Git은 작업 전후 commit 0 / 전체 untracked이므로 일반 `git diff`가 비어 있다. 저장한 baseline과 `git diff --no-index`/SHA-256로 실제 변경을 검토한다. commit/stage/reset/reinit 없음.
- 위 Git 전제는 2026-09-02 10:42:49 이후 더 이상 성립하지 않는다. 이 세션과 별개로 진행된 보류 bootstrap 작업이 baseline commit `32e68c8`(author `admin`)을 만들었고, 같은 시각대에 `docs/` 6개 파일이 다른 writer에 의해 계속 수정되고 있었다. TASK-CBM Writer는 commit/stage/reset/reinit을 수행하지 않았고 `docs/`의 해당 변경에도 관여하지 않았다. 이후 TASK-CBM 검토는 저장한 baseline이 아니라 이 commit 기준 `git diff`로 수행한다.
- 기존 Claude MCP 3개 Connected, Codex 기존 7개 설정 유지(6 enabled, cua_repl disabled). Notion not_logged_in은 baseline에도 있었던 제한.
- 2026-09-02 재확인: 기존 Claude MCP 3개(sequential-thinking, superpowers, context7) 모두 Connected 유지. `CLAUDE.md`의 `@AGENTS.md` import와 `.claude/settings.json`의 Stop hook 보존. `.claude/agents/`의 researcher/verifier는 읽기 전용 Graph 도구 11개만 보유하고 `index_repository`/`delete_project`/`manage_adr`/`ingest_traces`를 포함하지 않는다. 전역 MCP의 raw 설정·인수·환경변수는 credential을 포함할 수 있어 기록하지 않는다.
- 세션 중단 전후 전역 `.claude.json`, `.claude/settings.json`, `.codex/config.toml` hash가 달라졌다. 이 작업의 Writer는 해당 파일을 직접 수정하지 않았으며 바이트 동일성은 증명하지 못한다. 2026-09-02 추가 관찰: 세 파일의 마지막 쓰기 시각은 각각 10:29:06, 10:30:05, 10:41:28로 installer activation(02:13)과 겹치지 않고 각 앱 기동 시각과 일치한다. mtime만으로 그 이전 쓰기를 배제할 수 없으므로 원인은 여전히 단정하지 않는다. 현재 기존 MCP와 사용자 설정을 유지하고 임의로 되돌리지 않는다.
- Claude 정상 신뢰 승인/실제 호출, 앱 미구현으로 인한 기능 검증 부재, Graph 오연결·누락과 효과 미입증, 전역 파일 hash 차이는 숨기지 않는다.
- 자동 uninstall 사전 검사도 실패하여 자동 rollback 미검증. 전역 hash 차이의 원인을 installer·다른 프로세스 어느 쪽으로도 단정하지 않는다. 현재 기존 설정을 임의 복원하지 않는다.
- 독립 검증: 수정에 참여하지 않은 Agent A가 실제 MCP, ZIP checksum/binary, 설정, source·diff/hash, full 하네스를 재검증했다. Claude 실제 호출 미검증과 전역 byte 동일성 미확인 때문에 전체 판정은 PARTIAL.

---

