# TASK-CBM — Codebase Memory 통합

## 현재 상태와 승인 범위

`partial` — 2026-09-02 사용자 요청. 공식 codebase-memory-mcp 설치, 프로젝트 한정 Claude/Codex MCP 연동, 공유 Graph, 공통 탐색 지침, 실제 인덱싱·회귀·효율 검증만 수행한다. 앱 구현·Git 재초기화·기존 bootstrap 교정은 이번 작업에서 진행하지 않는다. 아래 이전 작업 기록은 원문 보존된 보류 상태다. Claude 작업공간 신뢰 승인과 실제 Claude MCP 호출은 아직 미완료다.

- Main/Writer: 주 에이전트 1명. 조사 Agent A/B/C 및 최종 verifier는 읽기 전용.
- 소유 파일: 필요한 MCP/ignore 설정, `.claude/agents/`의 읽기 도구 목록, `AGENTS.md`, `docs/AGENT_WORKFLOW.md`, `docs/DECISIONS.md`, `docs/TRACEABILITY.md`, 이 파일. 기존 `CLAUDE.md` import와 hooks/skills는 보존한다.
- 연결 요구사항: 개발 도구 통합 `AG-CBM-001` (제품 PR-001~PR-015 변경 없음).
- 인수 조건: 공식 binary version, 양 CLI MCP 발견/호출, 공유 index, symbol/call/dependency와 source 대조, scope/ignore 검증, 기존 설정 보존, quick/full 및 존재하는 앱 명령, 실제 탐색 비교를 증거로 확인한다. 미검증 항목이 있으면 부분 성공으로 보고한다.

## 현재 체크포인트

- 완료: Windows/PowerShell 7.6.4, Node 22.16.0/npm 10.9.2; `main`, commit 0, 프로젝트 파일 untracked. 기존 파일 46개를 `work/cbm-integration/baseline/`에 보존하고 SHA-256 목록을 기록했다. 변경 전/후 quick/full PASS. v0.10.8 binary-only 설치, 프로젝트 MCP 설정 2개, 공유 index, 실제 Codex CLI 호출, scope 거부, watcher 추가/삭제 반영, Graph-source 비교 완료.
- 다음: 사용자가 현재 root에서 `claude`를 열어 정상 workspace trust 절차를 승인 → `claude mcp get codebase-memory-mcp` Connected 확인 → Claude에서 `list_projects`/`search_graph` 실제 호출. 그전에는 전체 완료로 보고하지 않는다.
- 결정: D-028. 조사 초반에는 일회성 Git 신뢰 옵션만 썼으나 CBM의 Git 감지를 위해 이후 전역 `safe.directory`에 현재 root 하나를 추가했다. 이제 일반 `git status`와 CBM `is_git=true`, branch `main`이 확인된다. `.git/config`, 이력·branch·staging은 변경하지 않았다.
- 차단: Claude 2.1.237의 기존 trust 기록은 backslash 경로 키에만 있고 현재 CLI가 조회하는 forward-slash 키는 없다. `.mcp.json` 및 로컬 단일 서버 활성화 설정은 정상이나 `Pending approval`. 사용자 신뢰 기록을 조작하거나 전체 자동 승인을 추가하지 않는다.
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
| Claude 2.1.237 `mcp get` | 설정 발견, Pending approval. 실제 Claude tool 호출 미검증 |
| MCP `index_repository` full / persistence=false | PASS, 38 File nodes, skipped 0, partial parse 0. 문서 변경에 따라 전체 node/edge 수는 변함 |
| MCP symbol / trace / query / snippet | PASS 호출; 정확성과 한계는 아래 기록 |
| `index_repository(repo_path="C:/Windows")` | 예상대로 outside allowed root 오류. index 생성 없음 |
| watcher 재생 | 수동 재index 없이 임시 함수 추가 15초 후 1건, 삭제 12초 후 0건. 임시 파일 제거됨 |
| Graph UI | MCP 연결 중 `http://127.0.0.1:9749/` HTTP 200, HTML 반환. 시각적 UI 조작은 미검증 |
| `node scripts/verify.mjs --mode quick` / `--mode full` | 변경 전·후 모두 PASS |
| 앱 lint/typecheck/test/build/e2e | 해당 scripts·suite가 없어 실행 불가. 앱 검증 통과를 뜻하지 않음 |
| `git diff --check`, source hash | PASS. 기존 3개 실행 source 및 Claude Stop 설정/CLAUDE.md는 baseline과 동일 |
| `uninstall --dry-run` | FAIL, 동일 Codex command_render 사전 검사. 실제 uninstall 미실행. 수동 rollback은 AGENT_WORKFLOW §9 |

## Graph 품질과 탐색 비교

실제 기능: `.claude/settings.json:11` Stop → `scripts/claude-stop-hook.mjs:18` spawnSync → `scripts/verify.mjs` quick → `walk:37` 파일 수집 / `visit:123` 순환 검사.

- 위치, `verify` module→`walk` 45행 / →`visit` 131행은 source와 일치한다. `get_code_snippet(walk)`의 8줄도 현재 파일과 일치한다.
- recursive 41/127행은 trace의 CALLS에는 없고 self_recursive metadata만 true. 외부 builtin/subprocess 연결도 그래프에 없으므로 targeted search/실제 코드로 보완했다.
- `walk` USAGE 중 `ignored`/`textExtensions`/`files`는 맞지만 `name`은 CI YAML, `path`는 references manifest의 동명 항목에 잘못 연결됨. 해당 dependency 주장은 기각했다.
- `.claude` 기본 제외, `package.json` File node 누락, 수정하지 않은 source의 coverage `metadata_changed` 응답도 확인. parse_partial=0이나 ready는 완전성 보장이 아니다.

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
- 기존 Claude MCP 3개 Connected, Codex 기존 7개 설정 유지(6 enabled, cua_repl disabled). Notion not_logged_in은 baseline에도 있었던 제한.
- 세션 중단 전후 전역 `.claude.json`, `.claude/settings.json`, `.codex/config.toml` hash가 달라졌다. 이 작업의 Writer는 해당 파일을 직접 수정하지 않았으며 바이트 동일성은 증명하지 못한다. 현재 기존 MCP와 사용자 설정을 유지하고 임의로 되돌리지 않는다.
- Claude 정상 신뢰 승인/실제 호출, 앱 미구현으로 인한 기능 검증 부재, Graph 오연결·누락과 효과 미입증, 전역 파일 hash 차이는 숨기지 않는다.
- 자동 uninstall 사전 검사도 실패하여 자동 rollback 미검증. 전역 hash 차이의 원인을 installer·다른 프로세스 어느 쪽으로도 단정하지 않는다. 현재 기존 설정을 임의 복원하지 않는다.
- 독립 검증: 수정에 참여하지 않은 Agent A가 실제 MCP, ZIP checksum/binary, 설정, source·diff/hash, full 하네스를 재검증했다. Claude 실제 호출 미검증과 전역 byte 동일성 미확인 때문에 전체 판정은 PARTIAL.

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

- [ ] 현재 폴더를 `main` 브랜치의 정상 Git 저장소로 재확립했다(2026-09-02 감사: 기존 "[x] 초기화" 기록은 옛 경로 기준으로 부정확 — 커밋 0개, `.git` 소유자가 CodexSandboxOffline 계정, 현 경로 safe.directory 미등록. 사용자 승인으로 재초기화 예정).
- [x] Node/npm과 문서 하네스 명령을 `package.json`과 runtime profile에 기록했다.
- [x] 원자료 3개의 존재·byte·SHA-256을 하네스로 확인했다(2026-09-02 재확인 PASS).
- [ ] G1 계획 교정: 2026-09-02 재검증 보고서의 결함(I-01~I-18)과 사용자 결정을 정본에 반영했다.
- [ ] B-02~B-08을 증거와 함께 `pass | fail | unknown`으로 판정했다(B-06은 "구독 기반 모델 호출 경로"로 재정의됨).
- [ ] `unknown`인 개인정보·권한 경계가 남아 있으면 구현을 차단했다.
- [ ] 앱 stack과 `lint/typecheck/test/build/e2e` 명령을 실제 스파이크 후 확정했다.
- [ ] provisional Decision을 유지/기각/대체하고 영향 문서를 동기화했다.
- [ ] work graph의 다음 `ready` 노드와 첫 구현 task의 owner/인수 조건을 지정했다.

## 계획

- [x] 저장소/runtime/원자료 감사
- [x] 2026-09-02 계획 재검증(주 에이전트 정독 + Sonnet 4개 병렬 적대적 검토 + 통합 심사; 보고서는 대화에 제출, 사용자 결정 5건 수령)
- [ ] **G0**: `.git` 삭제 → `git init -b main` → user.name/email 확인(없으면 repo-local 설정) → baseline commit
- [ ] **G1**: 계획 교정(아래 파일별 목록) → `verify:quick`/`verify:full` → 교정 commit
- [ ] G2a hosting/identity 스파이크(B-02/B-03/B-08) → G2b D1 스파이크(B-04/B-05)
- [ ] G2c 구독 기반 모델 호출 경로 확인(B-06 재정의) / G2d Vector search(B-07) — RAG 트랙, critical path 밖
- [ ] G3 taxonomy-v1 전사+사용자 검수(G2와 병렬 가능)
- [ ] runtime profile·Decisions 최종 갱신, 첫 구현 task 생성

## 체크포인트

- 완료: 계획 재검증 완료(판정: "제한적인 기술 스파이크만 가능"). 사용자 결정 5건 수령. `.git` 내부 검사 완료 — 커밋 0, 스태시 0, 특수 설정 없음(objects 58개는 스테이징 blob으로 추정), 보존 가치 없음 확인. **`.git` 삭제는 아직 실행하지 않음.**
- 다음: G0 실행(위 계획의 정확한 순서), 직후 baseline commit, 그다음 G1.
- 결정: 사용자 승인 5건(아래 인계 메모) — G1에서 `docs/DECISIONS.md`에 D-017~D-027로 기록할 것.
- 실패: 이전 체크포인트의 "safe-directory 이 정확한 경로만 등록함"은 옛 경로(`Documents/Codex/2026-09-01/...`) 기준 기록이었고 현 경로에는 미적용 — 본 파일에서 정정함.
- 주의: `outputs/`·`work/`는 비정본. 커밋 메시지는 한국어, `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` 푸터. 파일 교정은 반드시 Decision과 연결. 유료 API 호출·외부 자원 생성은 금지(D-019 예정; Sites 프로젝트 생성은 G2a 시점에 사용자 재확인).

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

- 환경: Windows, Node 22.16.0, npm 10.9.2, git 2.49.0(현 사용자 계정에서는 safe.directory 미등록으로 플래그 없이는 실패 — G0로 해소 예정)
- 명령: `node scripts/verify.mjs --mode quick`(2026-09-02) → PASS, 원자료 SHA-256 일치
- 미검증/알려진 제한: baseline commit 미생성(G0 대기), Sites/D1/구독 기반 모델 경로/Web Push 전부 `unknown`, G1 교정 미반영 상태의 정본에는 I-02~I-18 결함이 그대로 남아 있음
