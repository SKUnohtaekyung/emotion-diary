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

# TASK-DESIGN — 디자인 시스템 검수와 확정 (새 세션 인계)

> **다른 세션에 알림 (2026-09-04, TASK-DS-REF 담당자용).** `tasks/TASK-DS-REF.md`가 쓰인 뒤 이 세션이 **D-037·D-038을 사용했다.** 다음 신규 번호는 **D-039**다(`docs/DECISIONS.md` 마지막 행으로 항상 재확인할 것 — TASK-DS-REF §8 T0 절차 그대로).
>
> 또한 TASK-DS-REF §3·§7의 "불변" 목록 중 **두 항목이 D-037로 대체됐다**:
> - D-035의 **카테고리 2줄 격자** → **아크 휠**(2줄 격자는 큰 글자 폴백 규격으로만 남음)
> - D-036의 **강도 2줄 세그먼트** → **슬라이더 + 숫자 + −/+ 스테퍼**
>
> 그리고 세부 감정 선택이 **chip 격자 → 소프트 리스트**로 바뀌었고 chip은 표시 전용이다. §6 구성요소 규칙을 보강할 때 정본(`docs/DESIGN_SYSTEM.md` §6.2/§6.3/§6.3.1/§6.4)을 기준으로 하고 TASK-DS-REF 파일의 요약을 기준으로 삼지 않는다. D-034(색·글꼴·light 전용)와 D-036의 나머지(앵커 한 줄, 위기 톤, 브랜드, 탐색 아이콘, 4pt 밀도·달력 `1fr`)는 그대로 유효하다.

## 상태

`done(결정)` — 2026-09-02 사용자 요청("디자인 시스템 잡아야 할 것 같다", "새 세션에서 대화하며 정하고, 프리뷰로 계속 확인하고 싶다"). 2026-09-04 세션에서 체크리스트 10건을 모두 확정하고(D-034·D-035·D-036) **D-033을 accepted로 전환**했다. 이어서 사용자가 레퍼런스를 제시해 감정 입력 방식을 다시 정했다 — **D-037**: 강도 슬라이더(세그먼트 대체), 카테고리 아크 휠(2줄 격자 대체), 세부 감정 소프트 리스트(chip은 표시 전용). 세부 감정 목록의 심리학적 타당성은 **D-038**(provisional)로 분리했다. 남은 것은 결정이 아니라 실행·리서치다.

## 정본과 산출물

- 정본: `docs/DESIGN_SYSTEM.md`(원칙·색·글자·간격·구성요소·접근성·금지 사항), 값: `design/tokens.json`, 색 검사: `scripts/check-contrast.mjs`(quick 하네스에 포함, 144건 = WCAG 대비 60 + 감정 계열 색차 ΔE 84), 캐릭터 자산 규격 검사: `scripts/check-characters.mjs`(quick 하네스, 자산 미제작이면 pending).
- 캐릭터 생성 프롬프트 정본: `design/characters/prompts.json`, 제작·검수 절차: `design/characters/README.md`.
- 시각 미리보기(저장소): `design/style-guide.html`. 로컬 서버 `node scripts/preview.mjs 4173` → `http://localhost:4173/`. Claude Code 브라우저 pane에서는 `.claude/launch.json`의 `design-preview` 구성을 `preview_start`로 열면 된다.
- 시각 미리보기(공유 링크, 같은 내용): https://claude.ai/code/artifact/8673a33c-900c-4273-8592-0fb3bdcc36a9 — 새 세션에서 갱신하려면 Artifact 도구에 `url`로 이 주소를 넘겨 재발행한다(먼저 `read`).

## 새 세션 작업 루프

1. 사용자와 항목별로 대화해 결정한다(아래 체크리스트). 결정은 `docs/DECISIONS.md` D-033 행 갱신(또는 D-034+ 신규)과 `docs/DESIGN_SYSTEM.md`·`design/tokens.json`에 같은 commit으로 반영한다.
2. 값을 바꾸면 `node scripts/check-contrast.mjs --verbose`로 대비와 계열 색차를 확인하고, `design/style-guide.html`의 `:root` 토큰과 dark-panel 인라인 값을 함께 고친다(현재 미리보기는 tokens.json을 자동 로드하지 않는다 — 자동화는 아래 후속).
3. 미리보기를 다시 열어 사용자가 확인하게 한다: 브라우저 pane(`design-preview`)과 Artifact 재발행(위 URL). 휴대폰 확인이 필요하면 Artifact 링크를 공유한다.
4. `npm run verify:quick` → commit → `git push origin main`.

## 결정 체크리스트 (사용자와 정할 것)

- [x] 7개 감정 색 계열 — **결정(D-034)**: 바램·미움이 ΔE 3.3~7.0으로 사실상 같은 색이던 결함을 발견해 원자료의 밝기 관계로 되돌렸다(바램 = 가장 옅은 라일락 `#A855CE`, 미움 = 가장 짙은 남색·보라 `#4750A6`). 기쁨 light 강조는 `#9A7A08`(올리브) → `#B08A00`(3.24:1).
- [x] chip 규칙과 선택 표시 — **결정(D-035 → D-037로 역할 변경)**: 값(fill 100 / border 300 / text 900)은 그대로지만, chip은 **선택 조작에서 빠지고 표시 전용**이 됐다(트레이·기록 카드·범례·AI 후보). 세부 감정 선택은 소프트 리스트가 맡는다.
- [x] 카테고리 선택기와 캐릭터 아이콘 — **결정(D-035 → D-037로 대체)**: 2줄 격자 대신 **아크 휠**(반지름 460, 간격 7.6°, 회전 45%, 관성 스냅). 2줄 격자는 큰 글자 폴백 규격으로만 남는다. 아이콘 40px는 유효. 캐릭터는 원자료와 같은 손그림 수채 무드로 codex imagegen 생성, 투명 PNG(원본 1024 / 배포 120). 프롬프트·규격·검수는 `design/characters/`. **자산 생성은 아직 안 했다 — taxonomy v1 검수와 함께 진행.**
- [x] 강도 선택기 — **결정(D-036 → D-037로 대체)**: 2줄 세그먼트 대신 **슬라이더 + 숫자 + −/+ 원형 스테퍼**(감정 3개 기준 536px → 380px). 앵커 문구 한 줄 규칙(1~3 / 4~7 / 8~10)은 그대로 유지.
- [x] 글꼴 — **결정(D-034)**: 웹폰트를 싣지 않고 시스템 한글 글꼴만 쓴다. 스택이 Pretendard를 먼저 찾으므로 나중에 `@font-face`만 추가하면 토큰 변경 없이 전환된다.
- [x] 다크 모드 — **결정(D-034)**: MVP는 light 전용. dark 토큰과 대비 검사는 유지하되 화면에는 적용하지 않고, 나중에 적용해도 앱 내 토글은 두지 않는다.
- [x] 밀도 — **결정·정정(D-036)**: 4pt 단계 이탈(gap 6/10, padding 14, radius 3/6)을 정정했다. **결함**: 달력이 `repeat(7,44px)`+gap 6이라 360px에서 344px로 가로 넘침이 있었고 `1fr`(열 간격 0, 줄 간격 4)로 고쳐 45.7×44가 됐다. 남은 예외는 선택된 chip 좌우 패딩 11(2px 테두리 광학 보정) 하나. 360px 실측 가로 넘침 0.
- [x] 위기 안내 문구 톤 — **결정(D-036)**: 현재 톤 유지("지금 안전이 먼저예요" + 도움 요청 안내 + 진단·위기 대응 서비스가 아님 명시). **연락처 값 자체는 여전히 검수 대기.**
- [x] 하단 탐색 — **결정(D-035·D-036)**: 이름은 오늘·달력·통계·설정, 아이콘은 비활성 선(outline) / 활성 면(filled)로 색 외 단서를 준다.
- [x] 브랜드 — **결정(D-036)**: 앱 이름 "감정일기"만 쓰고 로고·워드마크는 만들지 않는다. PWA 아이콘이 필요해지면 캐릭터 자산 중 하나를 쓴다.

## 후속 작업(선택)

- `design/style-guide.html`이 `design/tokens.json`을 fetch해 CSS 변수를 생성하도록 바꾸면 값 이중 관리가 사라진다(Artifact는 외부 fetch가 막히므로 발행 시 인라인 필요). 지금은 손으로 맞추며, 값이 어긋나도 하네스가 잡아 주지 못한다 — 이중 관리가 남은 유일한 자리다.
- 캐릭터 단색 아이콘 7종(`design/characters/`)은 taxonomy v1 검수와 함께 제작.
- 실기기(iPhone Safari·Android Chrome)에서 chip 대비와 44px 터치 영역 확인.

## 체크포인트

- 완료(2026-09-02): D-033 provisional, DESIGN_SYSTEM/tokens/check-contrast/style-guide 작성, quick 하네스에 대비 검사 통합, README·UX §8·TRACEABILITY·STATUS 연결, Artifact 발행.
- 완료(2026-09-04): 체크리스트 4건 확정 → D-034 accepted. **결함 1건 발견·수정**: 바램·미움 계열이 CIEDE2000 ΔE 3.3(chip 글자)/4.2(chip fill)/7.0(강조)/5.6(dark 강조)으로 구별 불가였다. D-022 때문에 chip의 카테고리 색이 같은 표기 감정의 유일한 구분 단서라 기능 결함이었고, 원자료의 밝기 관계(바램 가장 옅음·미움 가장 짙음)로 되돌려 최솟값 7.2/18.8/11.3/13.3로 회복했다. 재발 방지로 `check-contrast.mjs`에 계열 색차 검사(ΔE≥7, 84건)를 추가했고 옛 값으로 되돌리면 실패하는 것을 확인했다. tokens/DESIGN_SYSTEM/style-guide/STATUS/TRACEABILITY/verify.mjs를 같은 commit에서 갱신.
- 완료(2026-09-04, 2차): 체크리스트 3건 추가 확정 → D-035 accepted. 캐릭터 자산 파이프라인 세팅(`design/characters/prompts.json` 공통 프롬프트 + 7종, `README.md` 규격·검수, `scripts/check-characters.mjs` 자동 검사를 quick 하네스에 연결). 검사는 4개 경로(pending / 7종 정상 / 크기 불일치 / 투명도 없음)를 합성 PNG로 확인했다.
- 완료(2026-09-04, 3차): 남은 체크리스트 4건 + 탐색 아이콘 확정 → D-036 accepted, **D-033 accepted 전환**. 밀도 감사로 4pt 이탈을 정정하고 달력 가로 넘침 결함을 고쳤다. `DESIGN_SYSTEM`에 §7 브랜드를 신설(이후 절 8~12로 재조정, 상호 참조 동반 수정), 스타일 가이드에 하단 탐색 절 추가.
- 완료(2026-09-04, 4차): 사용자 레퍼런스(아크 휠·range slider) 검토 → **D-037** accepted. 시안 2종을 만들어 실측 비교했다(세그먼트 536px vs 슬라이더 380px, 아크 7개 중 5개 가독, 세부 감정 51개 중 아크는 5개만 노출·복수 선택 불가). 아크는 반지름 560→460·간격 8.6°→7.6°로 조정해 7개가 모두 화면에 들어오게 하고, 회전을 접선의 45%로 낮춰 한글 가독성을 확보했으며, listbox·activedescendant·aria-live·화살표 키·reduced-motion 대응을 넣었다. 스타일 가이드에 세 구성요소를 동작하는 형태로 이식했다. 세부 감정 목록의 심리학적 타당성은 **D-038**(provisional)로 분리 기록.
- 다음(실행·리서치):
  1. **아크 휠 큰 글자 폴백** — 확대 배율이 크면 2줄 격자(D-035 규격)로 전환. §9의 200% 확대 기준이 여기 걸려 있는 유일한 미해결 항목이다.
  2. **캐릭터 생성** — 3번(taxonomy v2) **뒤에** 한다. 공포가 추가되면 7종이 8종이 되는데 일관성 때문에 같은 seed로 한 번에 만들어야 하므로, 먼저 만들면 전부 다시 만들어야 한다(D-038). 확정 후 codex imagegen → `node scripts/check-characters.mjs` 통과 → README §3 눈 검수.
  3. **taxonomy v2 심리학 리서치(D-038)** — G3 원자료 전사(v1) 후 진행. **사용자가 방향을 확정했다(2026-09-04): 공포/두려움 카테고리 신설, 놀람은 기쁨 전용이 아님.** 나머지 세부 감정 귀속은 리서치로 정한다. 색 수용 가능성은 미리 재어 뒀다 — 8~9계열까지 가능하지만 쓸 수 있는 구역이 **초록~청록과 어두운 갈색뿐이고 보라는 포화**다(D-038). `emotion_code`(D-022) 마이그레이션 매핑도 함께 만든다.
  4. **실기기 확인** — chip 대비, 40px 아이콘 판독성, 44px 터치, 아크 조작감(iPhone Safari·Android Chrome).
  5. **위기 안내 연락처 값** 검수.
- 주의: 색의 의미(어떤 계열이 어떤 감정인지)는 원자료를 따르므로 사용자 승인 없이 바꾸지 않는다(PR-010). 감정 색으로 위험·순위를 표현하지 않는다.

---

# 보류 기록: TASK-BOOTSTRAP — 현재 프로젝트 기술 감사와 구현 기반 확정

## 상태

`in_progress`

## 목표

현재 폴더를 Claude Code와 Codex가 공통 정본·작업 그래프·검증 하네스로 직접 개발할 수 있는 프로젝트 루트로 유지하고, 미확정 기술 가설을 실제 스파이크로 판정해 첫 애플리케이션 구현 작업을 확정한다.

## 범위

- 포함: 저장소/runtime 조사, 원자료 확인, Sites/D1 후보 스파이크, 구독 기반 모델 호출 경로 확인, 개인정보·권한 경계 검증, runtime profile, quality gate 실제 명령, provisional Decision 판정, 첫 구현 task
- 제외: 전체 제품 일괄 구현, 실제 사용자 데이터 입력, 공개 배포, 유료 자원 생성, 제품 핵심의 무승인 변경

## 연결 요구사항

- 전체 맥락: `PR-001`~`PR-015`
- 직접 판정: `B-01`~`B-08`
- 관련 결정: `D-006`~`D-008`, `D-011`, `D-014`~`D-016`, 신규 예정 `D-017`~`D-027`(아래 인계 메모)

## 소유권

- Main/Writer: 현재 프로젝트의 주 에이전트 1명
- 소유 파일: `harness/runtime-profile.json`, `harness/*.yaml`, `tasks/CURRENT_TASK.md`, 감사 결과로 바뀌는 정본
- 읽기 전용 조사/검증: 공식 문서 조사자, 독립 verifier
- 병렬 writer: 금지(현재 Git baseline 부재로 worktree 자체가 불가 — I-01)

## 인수 조건

- [x] 현재 폴더를 `main` 브랜치의 정상 Git 저장소로 재확립했다(2026-09-02 G0, D-017: 기존 `.git` 삭제 → `git init -b main` → baseline commit `32e68c8`, 46개 파일 → 플래그 없는 `git status` clean. 이전 "[x] 초기화" 기록은 옛 경로 기준으로 부정확했음).
- [x] Node/npm과 문서 하네스 명령을 `package.json`과 runtime profile에 기록했다(root를 현 경로로 갱신).
- [x] 원자료 3개의 존재·byte·SHA-256을 하네스로 확인했다(2026-09-02 재확인 PASS).
- [x] G1 계획 교정: 2026-09-02 재검증 보고서의 결함(I-01~I-18)과 사용자 결정을 정본에 반영했다(D-017~D-027, 아래 체크포인트의 파일 목록).
- [ ] B-02~B-08을 증거와 함께 `pass | fail | unknown`으로 판정했다(B-06은 "구독 기반 모델 호출 경로"로 재정의됨).
- [ ] `unknown`인 개인정보·권한 경계가 남아 있으면 구현을 차단했다.
- [ ] 앱 stack과 `lint/typecheck/test/build/e2e` 명령을 실제 스파이크 후 확정했다.
- [ ] provisional Decision을 유지/기각/대체하고 영향 문서를 동기화했다.
- [ ] work graph의 다음 `ready` 노드와 첫 구현 task의 owner/인수 조건을 지정했다.

## 계획

- [x] 저장소/runtime/원자료 감사
- [x] 2026-09-02 계획 재검증(주 에이전트 정독 + Sonnet 4개 병렬 적대적 검토 + 통합 심사; 보고서는 대화에 제출, 사용자 결정 5건 수령)
- [x] **G0**: `.git` 삭제 → `git init -b main` → user.name/email 확인(전역 설정 존재하여 repo-local 미설정) → baseline commit `32e68c8`
- [x] **G1**: 계획 교정(아래 파일별 목록) → `verify:quick`/`verify:full` PASS → 교정 commit(해시는 검증 증거 절)
- [ ] G2a hosting/identity 스파이크(B-02/B-03/B-08) → G2b D1 스파이크(B-04/B-05)
- [ ] G2c 구독 기반 모델 호출 경로 확인(B-06 재정의) / G2d Vector search(B-07) — RAG 트랙, critical path 밖
- [ ] G3 taxonomy-v1 전사+사용자 검수(G2와 병렬 가능)
- [ ] runtime profile·Decisions 최종 갱신, 첫 구현 task 생성

## 체크포인트

- 완료(2026-09-02, Claude Code Fable 5.1): 계획 재검증 → 사용자 결정 5건 → **G0** 기존 `.git` 삭제, `git init -b main`, baseline commit `32e68c8`(46 files, `.gitignore` 준수, `outputs/`·`work/`·로컬 MCP 설정 제외), 플래그 없는 `git status` clean → **G1** 아래 파일 교정 완료. 교정 파일: `docs/DECISIONS.md`(D-017~D-027), `docs/DATA_MODEL.md`(§2 timezone 검증, §3.1 조건부 UPDATE/CHECK/trigger, §3.2 CHECK·D-022 code, §3.4 PK, §3.5 read-time guard, §3.6 retired 소급, §5 상태도 D-023, §6 turn token, §8 batch 삭제·벤더 근거), `docs/ARCHITECTURE.md`(§1 결정 요약, §2 다이어그램·무료 대안, §3 턴 신뢰, §4.2/§4.4 구독 기반·후행, §5 CSRF D-025, §6 defense-in-depth, §10 게이트 열), `docs/AI_RAG_SPEC.md`(§1 hedging, §4, §5.1 이력 계약, §5.2 safety_signal, §7.2 code/LLM, §8 observation 대조, §9 필수 verifier, §10 감지 범위), `docs/SAFETY_POLICY.md`(§6 감지 범위·한국 리소스, §8), `docs/UX_SPEC.md`(§4 검색/필터, §5 후행·위기 전환, §7 상태 유지, §13 내보내기 신설), `docs/EVAL_PLAN.md`(§3, §4 B-06 재정의, §7 위기·턴 위조 케이스, §8.3 D-027, §9 턴 위조·관찰 위장, §13 제한 MVP, §14 게이트 라벨 정의 신설), `docs/RISK_REGISTER.md`(RK-001~003 대안, RK-011 정정, RK-015, RK-016 신규), `docs/ROADMAP.md`(Phase 0 G2a~d, Phase 3/5 후행, 제한 MVP 릴리스 절 신설), `docs/TRACEABILITY.md`(노드 재매핑, 불변조건 4건, 변경 영향), `harness/work-graph.yaml`(privacy-hosting-spike → hosting-identity/d1-data/model-access/vector-search, limited-mvp-release 추가, vector-search→evidence-pipeline 엣지), `harness/quality-gates.yaml`(severity medium, node_gates 재매핑, no_paid_api_calls), `harness/runtime-profile.json`·`.template.json`(root, model_access), `harness/loop-state.json`, `schemas/diary-entry`(slot 객체, completed 필수 시각, `\S`, category-prefixed code), `schemas/journal-assist-output`(`safetySignal` 필수, slot 동기화), `schemas/export`(analyses metadata 래핑), `scripts/verify.mjs`(`harness/README.md` required), `references/README.md`(D-027/D-022 문구), `.env.example`(OPENAI_API_KEY 제거, D-019/D-025 주석).
- 추가(2026-09-02 후속, D-029/D-030): 사용자가 "혼자 쓰는 도구"로 확정. Agent SDK는 공식 문서상 API 키 필수+타사 제품에 claude.ai 로그인 제공 금지라 제외. Claude Code CLI 헤드리스(`claude -p --json-schema`, 구독 로그인)를 B-06 후보로 채택하고 scratchpad에서 합성 입력으로 최소 스파이크 1회 PASS(구독 인증, 필수 키 6개 일치, 비창작, `safetySignal=none`, 벽시계 15초/API 8.5초, `claude-opus-5`). 정책 회색지대는 RK-017로 사용자 인지 기록. hosting을 본인 PC 자체 호스팅+Tailscale로 바꾸는 D-030은 PR-002 문구 변경이라 사용자 승인 대기.
- 추가(D-030 승인, D-031): 사용자가 자체 호스팅을 승인해 PRD PR-002·§4, README, ARCHITECTURE, DATA_MODEL, SAFETY, EVAL, RISK(RK-001~003/010 재작성, RK-017/018 신규), ROADMAP, TRACEABILITY, work-graph(`d1-data-spike`→`data-store-spike`), runtime-profile, BOOTSTRAP, `.env.example`을 로컬 서버+SQLite+사설망 기준으로 갱신. 모델은 같은 입력으로 3개 실측해 Sonnet 5(작성, 8.0초)/Opus 5(verifier·RAG, 15초) 채택, Haiku 4.5는 발화 무시로 탈락(D-031).
- 추가(D-032 승인): 사용자가 Supabase 대신 "직접 짠 백엔드" 방향을 택하고 선택지 B(Cloudflare Pages+Workers+D1)를 승인. D-030은 superseded. AI는 PC worker가 `ai_jobs` 큐를 outbound로 가져가 `claude -p` 호출(포트 개방 없음). PRD, README, ARCHITECTURE(§2 다이어그램, §3, §4.2, §4.6 신설, §5 job 경로, §6, §10), DATA_MODEL(§3.1, §3.8 `ai_jobs` 신설, §8), SAFETY §3, EVAL(§3, §4 B-02~B-08, §9, §10, §13), RISK(RK-001/002/003/010/018 재작성, RK-019 신규), ROADMAP, TRACEABILITY, AI_RAG_SPEC §1, BOOTSTRAP, work-graph(`data-store-spike`), runtime-profile, `.env.example`, loop-state 갱신. "B"가 Netlify+Turso를 뜻했다면 D-032를 수정한다.
- 추가(G2a/G2b 로컬 스파이크, 2026-09-02): 사용자가 G2a와 Cloudflare 자원 생성을 승인하고 계정 이메일을 알려줌. 채팅에 적힌 비밀번호는 **사용하지 않았고** 변경을 권고함(계정 로그인은 사용자가 `npx wrangler login` 브라우저 승인으로 수행). 계정 없이 가능한 부분을 `work/spikes/g2a-cloudflare/`(Git 제외, wrangler 4.128.0, miniflare 로컬 D1)에서 검증: HTTP 22/22 PASS(토큰 없음/오류 401, HMAC cookie 속성, custom header 없음·교차 Origin·cross-site 403, draft upsert/revision 409, 완료조건 미충족 422, CHECK 422, 조건부 완료 rev3, ai_jobs 202/lease 200·204/result 200·409/payload NULL, cascade 삭제 고아 0) + SQL 9건(CHECK, UNIQUE 2종, completed 보호 trigger 2종, 조건부 UPDATE, stale no-op). 발견: (1) 자식 먼저 삭제하면 completed 보호 trigger가 막으므로 부모 먼저 삭제+FK cascade로 확정(DATA_MODEL §8). (2) cascade 포함 DELETE의 `meta.changes`는 과대 계수(1행 삭제에 2) → 삭제 판정은 SELECT로. 원격 D1·휴대폰·rate limit·무료 한도·실제 worker 프로세스는 미검증.
- 추가(원격 G2a, 2026-09-02): 사용자가 `wrangler login`을 직접 승인(`whoami`: <cloudflare-account-email>). `wrangler d1 create emotion-diary-spike` → APAC, id `<d1-database-id>`; `d1 migrations apply --remote` PASS(테이블 3·trigger 2); Workers `<spike-worker>.workers.dev` 배포 2회(두 번째는 `ALLOWED_ORIGIN`을 실제 URL로); secret 3개(`APP_ACCESS_TOKEN_HASH`, `SESSION_HMAC_SECRET`, `WORKER_SECRET`)는 `wrangler secret put`으로만 등록. 원격 HTTP 22/22 PASS(첫 실행은 배포 직후 readiness 실패 1회, 재실행 PASS). 원격 D1: trigger 2종·CHECK 2종·UNIQUE 거부(`SQLITE_CONSTRAINT_*`, code 7500), 부모 우선 cascade 후 고아 0. `d1 info`: 61.4 kB, 읽기/쓰기 쿼리 수 집계 표시. `time-travel info`: 복구 bookmark 존재(복구 실습은 안 함). 스파이크 토큰은 채팅으로 사용자에게 전달(정본에 기록 안 함), 검증 후 회전·삭제 예정.
- 추가(실브라우저 확인, 2026-09-02): 사용자가 원격 URL을 **PC Chrome 152(Windows)**에서 실행 → `session: 200`, `put+header: 200 {status:"draft",revision:1}`, `put-no-header: 403 {"error":"csrf"}`. 실제 브라우저의 HTTPS `Secure` cookie 왕복과 fetch metadata 헤더 통과가 확인됨(B-02/B-03 원격 실브라우저 PASS). 모바일 실기기(B-08)는 아직 미실행.
- 추가(모바일 실기기, 2026-09-02): **iPhone iOS 18.7, 카카오톡 인앱 WebView(WebKit 605.1.15)** → `session: 200`, `put+header: 409 {"error":"revision_conflict"}`(PC에서 먼저 만든 오늘 draft revision 1을 휴대폰이 revision 0으로 덮어쓰려 해 거부됨 = 기기 간 optimistic lock 정상, cookie·CSRF 통과 증거), `put-no-header: 403`. B-08 `partial`: iOS WebKit HTTPS Secure cookie 왕복 확인, Safari 본체·홈 화면 standalone·Android Chrome 미확인. 스파이크 토큰은 채팅 노출 후 회전, 합성 데이터 삭제.
- 추가(정리, 2026-09-02): 스파이크 토큰 회전(`wrangler secret put APP_ACCESS_TOKEN_HASH`) → 직후 요청에서는 옛 토큰이 아직 200, 약 20초 뒤부터 옛 토큰 401·새 토큰 200(secret 변경 전파 지연 존재, 회전 절차에 반영 필요). 원격 D1 합성 데이터 전부 삭제(entries/emotions/jobs 0). 새 토큰은 `work/…/.spike-secrets.json`에만 있다.
- 추가(rate limit, 2026-09-02): Workers Rate Limiting binding(`[[ratelimits]]` 10/60s)을 무료 플랜에 배포는 됐으나 같은 key 30회(HKG/NRT 분산)에서 429가 0건 → 문서의 "permissive, eventually consistent, per location"대로 보안 경계 부적합, 기각. 대신 migration `0002_auth_failures`로 D1 전역 잠금(60초 10회 → 5분) 구현·배포: 실패 반복 시 429, 잠금 중 올바른 토큰도 429(`Retry-After: 300`), 카운터 초기화 후 200. Cloudflare Access는 JWT 헤더(`Cf-Access-Jwt-Assertion`)·certs 검증 방식만 문서로 확인, 무료 한도·workers.dev 적용은 확인 불가 → 선택 사항으로 보류.
- 추가(G2c 실제 왕복, 2026-09-02): `work/spikes/g2a-cloudflare/pc-worker.mjs`(Node, Bearer worker secret, `--once`/5초 폴링)가 원격 `ai_jobs`를 lease → Git Bash로 `claude -p --model claude-sonnet-5 --json-schema` 실행 → 결과 POST → owner 조회 `done`·payload NULL. 첫 시도는 Windows `spawnSync(shell:true)` 인용 문제로 `--json-schema is not valid JSON` 실패 → prompt/schema를 환경변수로 넘겨 bash에서 실행하도록 수정 후 성공. 합성 발화 11회 모두 사건만 반영·감정 코드 비움·`safetySignal=none`. **지연 10회**(worker 측 = claude 기동+API): min 7.7초 / p50 8.4초 / p95 12.1초 / max 12.1초, API만 p50 4.9초 / p95 9.4초. UX 목표(첫 응답 p95 8초)를 초과하므로 대화 UI는 "생각 중" 상태와 20초 timeout fallback을 전제로 설계하고, 기동 오버헤드(약 3.5초) 절감 방법은 후속 검토(RK-009). 스파이크 한계: 실패 job을 `failed`가 아니라 error 결과로 `done` 처리(실제 구현에서 분리), 만료 처리 미검증, Haiku가 보조 모델로 함께 호출됨(Claude Code 내부 동작, 비용 없음).
- 다음: Safari 본체/standalone/Android는 사용자가 가능할 때 추가 확인(차단 아님). G2c 잔여: 보존/학습 설정 확인, verifier 독립 2회 호출, 위기 케이스, job 만료·`failed` 전환. **G3 taxonomy-v1** 착수 가능. Phase 1 app-scaffold는 G2a/G2b partial PASS를 근거로 사용자 승인 시 시작. → rate limit 구현·Cloudflare Access 무료 적용 검토 → 스파이크 D1 데이터 비우기/토큰 회전. 이어서 G2c 실제 PC worker 프로세스+`claude -p` 결합. G3 taxonomy-v1은 병렬 가능. G3 taxonomy-v1 전사(D-022 code, D-027 검수)는 G2와 병렬 가능. G2b는 G2a 통과 후, G2c/G2d는 RAG 트랙으로 critical path 밖.
- 결정: D-017~D-027 기록 완료(`docs/DECISIONS.md`). 이번 세션에서 제품 핵심(PR-001~PR-015, 원형 6영역, taxonomy, 두 작성 흐름)은 변경하지 않았다. `emotion_code` 형식만 D-022로 카테고리 접두어 규칙을 확정했다.
- 실패: 없음. 이전 체크포인트의 "safe-directory 이 정확한 경로만 등록함"은 옛 경로 기준이었고, TASK-CBM(D-028)이 이후 현 경로를 전역 `safe.directory`에 추가한 상태였다. G0 재초기화 후 `.git` 소유자가 현 계정이므로 그 항목 없이도 동작하며, 전역 설정은 변경하지 않았다.
- 주의: `outputs/`·`work/`는 비정본. Git 전역 `user.name=admin`/`user.email`은 기존 전역 설정 그대로 사용했고(지시: 없을 때만 repo-local 설정), 커밋 푸터는 실제 모델 표기 `Claude Fable 5.1`을 사용했다. 파일 교정은 모두 Decision과 연결. 유료 API 호출·외부 자원 생성 금지(D-019). TASK-CBM 기록은 원문 보존.

## 인계 메모 — 2026-09-02 계획 재검증 (새 세션 재개용)

### 사용자 결정 (채팅 승인, G1에서 Decision으로 기록)

1. **Git 재초기화 승인**: 기존 `.git` 삭제 후 현 계정으로 `git init -b main` + baseline commit(잃을 이력 없음 확인됨).
2. **RAG 단계 분리**: 직접 작성+대시보드 제한 MVP 선행 배포, RAG 분석은 후행 단계 — 기본 계획으로 승격.
3. **위기 대응**: 리소스 기준 국가 **한국 확정**. 감지 범위는 권고안 채택 — AI 관여 경로(대화 작성·명시 요청 분석)에서만 감지, 직접 작성 원문 자동 스캔 없음 + 한계 고지. (사용자가 국가만 명시적으로 답했고 범위는 권고안을 기본값으로 기록 — 이의 시 변경.)
4. **비용**: 유료 API(OpenAI API 등) 미사용. 사용자가 구독 중인 Codex/Claude 자원으로 가능한 방법만 검증. B-06을 "구독 기반 모델 호출 경로 확인"으로 재정의. 미확인 시 AI 대화·RAG는 보류하고 제한 MVP만 진행.
5. **Hosting 대안**: Sites 실패 시 무료 옵션으로 제한.

### 통합 결함 등록부 요약 (전체 근거는 2026-09-02 대화 보고서)

- **I-01 P0** Git baseline 부재+환경 기록 stale(runtime-profile root 옛 경로, RK-011 `mitigated` 과장 포함) → G0+G1에서 해소
- **I-02 P0** 위기 처리 경로 공백: `journal-assist-output.schema.json`에 안전 필드 없음 + 직접 작성 경로 무검사 vs SAFETY §6 문구 → safetySignal 필드 추가+정책 문구 축소(결정 3 반영)
- **I-03 P1** owner 경계 단일 장애점(ARCHITECTURE §6 서버 상수 owner_key, defense-in-depth 없음) + CSRF 방식 미정 → identity 헤더 허용 목록 대조 필수화, custom header CSRF 채택
- **I-04 P1** D1 interactive transaction 없음 vs DATA_MODEL "transaction 안에서" 서술, 완료 불변조건 TOCTOU, intensity CHECK·reminder PK 미명시 → 조건부 단문/trigger+CHECK로 재서술
- **I-05 P1** 완료 편집 상태 전이 모순(DATA_MODEL §5 상태도 vs PRD §8/UX §7) → "편집 중 completed 유지, 명시적 완료 취소만 draft"로 통일
- **I-06 P1** taxonomy 카테고리 간 중복 라벨 최소 7건(가벼운·흐뭇한·뿌듯한·포근한·고통스러운·구역질나는·황량한; "증오하는/증오스러운"은 미확정) → 카테고리별 독립 emotion_code 발급 규칙
- **I-07 P1** Verifier "가능하면" 약화, Quality Filter code/LLM 미구분, observations 자유 서술 유출 경로 → 독립 실행 필수화+observation 검증 확장
- **I-08 P1** reviewer 2인 요구 vs 1인 제품 → 1인 대안 절차 Decision, 지표 "고정셋 기준" 명시
- **I-09 P1** Vector Store chunk 반환 vs source_spans 대조, attributes 16키/스칼라 vs topicCodes 배열 → B-07 스파이크 항목화
- **I-10 P1** work-graph 결함: privacy-hosting-spike 과잉 통합, evidence-pipeline 선행 엣지 누락, quality-gates 미정의 라벨 13개, severity medium:0이 EVAL과 상충 → 노드 분해+라벨 재매핑+severity 일치
- **I-11 P1** 클라이언트 제공 대화 이력 신뢰 계약 미정의(과거 턴 위조 공격면) → AI_RAG_SPEC §5.1/§10 보강
- **I-12~I-18 P2**: export 모바일 UX 부재 / 칭찬·감사 slot 정보 schema 소실 / 대형 감정 목록 검색·필터 부재 / 클라이언트 timezone 신뢰 한계 / stale read-time guard 미명시 / D1 백업·보존은 벤더 문의 필수 / retired Evidence 소급 표시 부재
- P3: suggestedEmotionCodes minItems, whitespace 통과, verify.mjs required에 `harness/README.md` 누락, 검수 문구 통일 등

### G1 파일별 교정 목록 (모두 위 I-번호·사용자 결정과 연결)

| 파일 | 교정 |
| --- | --- |
| `docs/DECISIONS.md` | D-017~D-027 신규(사용자 결정 5건 + taxonomy 중복 코드, 완료 편집 상태, D1 원자화, CSRF, Verifier 필수화, 1인 검수 대안) |
| `docs/DATA_MODEL.md` | §3.1 tx→원자적 statement/trigger+CHECK, §3.4 PK, §3.5 read-time guard, §5 상태도, §6 턴 계약 |
| `docs/ARCHITECTURE.md` | §5 CSRF 확정, §6 defense-in-depth, §2/§4.4/§10 B-06 재정의(구독 기반) 반영 |
| `docs/AI_RAG_SPEC.md` | §1 구독 기반 hedging, §5 safetySignal+이력 계약, §7.2 code/LLM 구분, §8 observations 제한, §9 필수화, §10 |
| `docs/SAFETY_POLICY.md` | §6 감지 범위(AI 관여 경로만)+한국 리소스 확정 |
| `docs/UX_SPEC.md` | export 절 신설, 감정 검색/필터, §5 위기 전환, §7 상태 유지 문구 |
| `docs/EVAL_PLAN.md` | §4 B-06 재정의, §7 위기 케이스, §8.3 1인 대안+고정셋 표기, §9 턴 위조·관찰 위장 케이스, 게이트 라벨 정의 절 |
| `docs/RISK_REGISTER.md` | RK-011 정정, RK-016 신규(구독 기반 경로 부재 시 AI 기능 보류) |
| `docs/ROADMAP.md`, `docs/TRACEABILITY.md` | 그래프 분해·제한 MVP 선행 반영 |
| `harness/work-graph.yaml` | privacy-hosting-spike → hosting-identity/d1-data/model-access/vector-search 분해, evidence-pipeline 엣지 추가(verify.mjs 파서 형식 유지 주의) |
| `harness/quality-gates.yaml` | severity medium 완화(EVAL §11 일치), node_gates 라벨 재매핑 |
| `harness/runtime-profile.json` | root=현 경로, generated_at/verified_by/evidence 갱신, unknowns에 구독 기반 경로 추가 |
| `schemas/diary-entry.schema.json` | praises/gratitudes를 `{slot(1~3), text}` 객체로, completed 시 firstCompletedAt 등 필수화, text `\S` 패턴 |
| `schemas/journal-assist-output.schema.json` | `safetySignal` 필드 추가(required), draftPatch slot 구조 동기화 |
| `schemas/export.schema.json` | analyses 항목에 기간·버전 metadata 래핑 |
| `scripts/verify.mjs` | required에 `harness/README.md` 추가 |
| `references/README.md` / `.env.example` | 검수 문구 통일 / OPENAI_API_KEY 주석을 D-019에 맞게 수정 |

### 재개 절차 (새 세션 첫 행동)

1. 이 파일과 `AGENTS.md`, `README.md`를 읽는다. `outputs/`·`work/`는 무시.
2. G0: `.git` 삭제(사용자 승인 완료됨) → `git init -b main` → `git config user.name/email` 확인 → 전체 스테이징(.gitignore 준수) → baseline commit(한국어 메시지+Fable 5 푸터) → 플래그 없는 `git status` 성공 확인.
3. G1: 위 표 순서로 교정 → `npm run verify:quick` → `npm run verify:full` → 본 파일 체크포인트 갱신 → 교정 commit.
4. 이후 G2a부터. Sites 프로젝트 생성은 외부 자원이므로 실행 직전 사용자에게 재확인.

## 검증 증거

- 환경: Windows 11, Node 22.16.0, npm 10.9.2, git 2.49.0.windows.1. G0 이후 플래그 없는 `git status` 정상.
- G0 증거: `git log --oneline -1` → `32e68c8 감정일기 프로젝트 baseline: 제품 정본·하네스·원자료 초기 커밋`; `git status` → `nothing to commit, working tree clean`.
- G1 명령: `npm run verify:quick` → PASS, `npm run verify:full` → PASS(앱 script가 없어 문서 하네스만 검사; 앱 기능 검증이 아님). 교정 commit 해시는 완료 보고와 `git log`로 확인.
- 로컬 스파이크 명령(2026-09-02, `work/spikes/g2a-cloudflare`): `npx wrangler d1 migrations apply DB --local` → PASS; `npx wrangler d1 execute DB --local --command ...` 9건; `node spike-test.mjs`(wrangler dev 기동 후 fetch 22건) → `SUMMARY 22/22 PASS`.
- 원격 스파이크 명령(2026-09-02): `npx wrangler d1 create emotion-diary-spike`, `npx wrangler d1 migrations apply DB --remote` → PASS, `npx wrangler deploy` ×2, `npx wrangler secret put` ×3, `node remote-test.mjs` → `SUMMARY 22/22 PASS`, `npx wrangler d1 execute DB --remote --command ...` 거부 4건+cascade 1건, `npx wrangler d1 info`, `npx wrangler d1 time-travel info`.
- 미검증/알려진 제한: B-02/B-03/B-04/B-06 큐는 로컬·원격 `partial`. 휴대폰 실기기(B-08), rate limit, 무료 한도 수치, Time Travel 복구 실습, 실제 PC worker 프로세스, 검색 계층(B-07), Web Push는 `unknown`. 스파이크 Worker는 공개 URL이며 토큰 없이는 HTML 안내 페이지 외 데이터를 주지 않는다. D-024의 D1 trigger/batch 지원, D-025의 identity 헤더·custom header 통과는 G2a/G2b 실검증 전까지 가설. `schemas/*`는 Ajv 등 실제 validator로 아직 검증하지 않았다(JSON 구문만 하네스 확인). taxonomy-v1 전사와 D-027 검수는 미착수. Codebase Memory MCP는 이 세션에서 연결 실패(CONNECTION_CLOSED)하여 Graph 탐색 없이 직접 Read/Grep으로 진행했다.
