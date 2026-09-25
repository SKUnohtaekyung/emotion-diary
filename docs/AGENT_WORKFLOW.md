# 에이전트 개발 하네스·루프·작업 그래프

## 1. 목적

이 문서는 Claude Code와 Codex가 긴 개발 작업에서도 같은 목표·상태·검증 기준을 유지하도록 하는 실행 정본이다. 공통 규칙은 [../AGENTS.md](../AGENTS.md), 현재 작업 상태는 [../tasks/CURRENT_TASK.md](../tasks/CURRENT_TASK.md)에 둔다.

여기서 하네스는 에이전트를 둘러싼 입력·권한·상태·검증 장치이고, 루프는 한 작업을 종료할 때까지 반복하는 절차이며, 작업 그래프는 어떤 산출물이 다른 산출물에 선행하는지 나타낸다. 모델에게 한 번에 모든 판단을 맡기는 구조가 아니다.

## 2. 컨텍스트 계층

| 계층 | 내용 | 수명 |
| --- | --- | --- |
| 공용 계약 | `AGENTS.md` | 모든 세션 |
| 도구 어댑터 | `CLAUDE.md`, `.claude/settings.json` | 도구별 |
| 제품 정본 | `PRD`와 `docs/` | 버전 관리 |
| 작업 상태 | `tasks/CURRENT_TASK.md` | 한 작업 |
| 실행 증거 | 테스트 결과, diff, 평가 결과 | 작업/릴리스 |
| 원자료 | `references/source` | 변경 금지 보존 |

항상 필요한 규칙만 공용 계약에 남긴다. 긴 조사 결과, 원문 API 응답, 도구 로그는 영구 지침에 넣지 않는다. 반복해서 필요한 절차는 스크립트나 task template으로 만든다.

## 3. 표준 작업 루프

### A. Intake

- 사용자 목표를 요구사항 ID, 비목표, 인수 조건으로 바꾼다.
- 수정할 파일의 writer를 한 명으로 지정한다.
- 파괴적 변경, 외부 배포, 비용 발생, 개인정보 이동은 별도 승인이 있는지 확인한다.

### B. Orient

- 현재 변경 상태와 실제 파일을 읽는다.
- 작업 그래프에서 직접 선행 문서와 후속 영향을 찾는다.
- 기준 동작 또는 실패를 재현한다.

### C. Plan

- 구현 단계마다 산출물, 검증 방법, 중단 조건을 지정한다.
- 읽기 조사는 자유롭게 병렬화한다. 쓰기 병렬은 파일이 겹치지 않을 때만 §10의 방식으로 한다. 같은 파일이나 같은 데이터 계약을 여러 writer에게 맡기지 않는다.
- 불확실한 외부 기능은 먼저 짧은 기술 스파이크로 검증한다.

### D. Implement

- 한 번에 하나의 작은 가설/변경을 적용한다.
- 데이터 변경에는 마이그레이션과 롤백/실패 경로를 포함한다.
- 외부 호출에는 시간 제한, 오류 분류, 제한된 재시도, 멱등성, 관찰 가능한 요청 ID를 둔다.

### E. Verify

- 변경에 가장 가까운 테스트를 먼저 실행한다.
- `node scripts/verify.mjs --mode quick`을 실행한다.
- diff를 요구사항, 권한, 데이터 손실, 민감정보, AI 안전 관점에서 검토한다.
- 완료 전 `node scripts/verify.mjs --mode full`과 [EVAL_PLAN.md](EVAL_PLAN.md)의 해당 게이트를 실행한다.

### F. Close or Loop

- 통과하면 증거, 변경된 결정, 알려진 한계를 `CURRENT_TASK`에 기록한다.
- 실패하면 실패 단계와 관찰값을 기록하고 새 가설로 돌아간다.
- 동일 가설 2회 실패 또는 일시 오류 2회 재시도 후에는 자동 반복을 중단하고 재진단한다.

## 4. 산출물 의존 그래프

```text
사용자 원자료 ───────┐
                     v
                  PRD (범위)
                /   |    \
               v    v     v
          UX_SPEC DATA_MODEL SAFETY_POLICY
               \     |      /
                v    v     v
                 ARCHITECTURE
                       |
                       v
                  AI_RAG_SPEC
                    /      \
                   v        v
              EVAL_PLAN  TRACEABILITY
                    \      /
                     v    v
                  CURRENT_TASK
                       |
                       v
                 구현·마이그레이션
                       |
                       v
                 quick/full 검증
```

상위 노드가 바뀌면 연결된 하위 문서를 같은 작업에서 영향 분석한다. 예를 들어 완료 조건 변경은 데이터 제약, UX, 통계, RAG 입력, 테스트와 추적성 표를 모두 재검토한다.

## 5. 역할과 격리

| 역할 | 기본 권한 | 책임 |
| --- | --- | --- |
| Main/Writer | 승인된 범위 쓰기 | 계획, 통합 구현, 결정 충돌 해결 |
| Researcher | 읽기 전용 | 공식 문서·코드 근거 수집, 불확실성 표시 |
| Verifier | 읽기 전용 + 테스트 실행 | 인수 조건 독립 검증, 재현 가능한 결함 보고 |

Claude용 읽기 전용 역할은 `.claude/agents/`에 정의한다. Codex에서는 동일 역할 원칙을 프롬프트/작업 소유권으로 적용한다. 병렬 실행은 속도보다 격리 가능성이 기준이다. 쓰기 작업자(Worker)를 여럿 두는 방식은 §10에 있다.

## 6. 검증 하네스 계약

- `quick`: 필수 파일, 내부 링크, 병합 충돌 표식, 명백한 비밀값, JSON 구문, 원자료 byte·SHA-256, PRD·추적성·작업 그래프의 구조를 검사하고, 이어서 데이터·자산 계약 검사 네 개를 실행한다 — `check-contrast`(색 대비·계열 색차), `check-characters`(캐릭터 자산 규격), `check-taxonomy`(taxonomy 데이터), `check-harness`(harness 상태 파일과 schema·style-guide의 어긋남, [../harness/README.md](../harness/README.md)). `check-characters`가 `sharp`를 쓰므로 `quick`도 `npm ci`가 선행돼야 한다. 이 검사들을 `full`로 옮기지 않은 이유: 로컬 약 2초로 Stop 훅에 부담이 없고, 옮기면 자산·계약의 회귀를 턴이 끝날 때 잡지 못하게 된다.
- `full`: `quick` 이후 `package.json`에 존재하는 `lint`, `typecheck`, `test`, `build`를 순서대로 실행한다. 지금 `test`는 검사기 자체 테스트다.
- GitHub Actions(`.github/workflows/harness.yml`)가 `npm ci` → `quick` → `full`을 Ubuntu와 Windows에서 실행한다. 로컬 Stop 훅이 통과해도 CI가 빨간불이면 완료가 아니다 — 2026-09-02부터 9-19까지 CI는 15회 전부 실패였는데 로컬만 보고 아무도 알지 못했다.
- `check-harness`의 `WARN`은 실패가 아니다. 시간·커밋 거리에 기대는 신호라 보여 주기만 한다.
- Claude Stop 훅은 `quick`만 실행해 명백히 깨진 상태에서 한 번 더 작업하게 한다. 재진입(`stop_hook_active`)에도 실패하면 무한 루프를 피하기 위해 종료를 허용하되 실패를 명시하도록 한다.
- 사람과 에이전트의 최종 완료 선언은 `full` 통과를 요구한다.
- 아직 코드가 없는 단계에서 `full`은 문서 하네스만 검사하고 성공할 수 있다. 이것은 앱 기능 검증을 뜻하지 않는다.

테스트 실패를 숨기기 위해 테스트를 삭제·skip·완화하지 않는다. 임계값 변경에는 [DECISIONS.md](DECISIONS.md)의 근거와 별도 검토가 필요하다.

## 7. 체크포인트 형식

컨텍스트 압축, 도구 전환, 장시간 중단 전 `CURRENT_TASK`에 다음만 남긴다.

```text
완료: 실제로 끝난 항목과 증거
다음: 바로 실행할 한 단계
결정: 새로 확정된 판단과 Decision ID
실패: 재현 명령/입력과 관찰값
주의: 사용자 변경, 민감 데이터, 미승인 범위
```

이 기록은 대화 요약을 대신하는 실행 가능한 상태여야 하며 비밀값이나 일기 원문을 포함하면 안 된다.

## 8. 공식 지침 적용 근거

- Codex는 프로젝트 루트부터 현재 디렉터리까지의 `AGENTS.md` 지침을 계층적으로 읽으므로, 루트 파일을 짧은 공용 계약으로 둔다.
- Claude Code는 `CLAUDE.md`의 프로젝트 메모리와 `@AGENTS.md` import를 사용해 같은 정본을 공유한다.
- Claude hooks는 결정론적 검증에만 사용하고, 판단이 필요한 리뷰를 훅에 위임하지 않는다.
- 긴 작업은 상태를 파일로 외부화하고, 작은 증분·명시적 재시도/중단 기준·독립 검증을 사용한다.

공식 링크는 [README의 출처](../references/README.md#공식-에이전트-개발-근거)에 모은다.

## 9. Codebase Memory 탐색과 운영 (D-028 / AG-CBM-001)

### 탐색 순서

1. 구조 질문(구현 위치, caller/callee, interface 구현, reference, domain 진입점, 변경 영향)은 공유 Graph → 후보 축소 → 현재 source Read 순서로 진행한다. 첫 사용에는 `list_projects`, `index_status`로 현재 root의 project를 선택한다. project 이름을 추측하지 않는다.
2. `search_graph`로 symbol을 찾고 `trace_path`로 호출을 좁힌다. 복합 관계는 `get_graph_schema` 후 `query_graph`를 사용한다. 필요한 한도만 요청하고 `has_more`/cursor가 있으면 범위에 맞게 이어서 조회한다.
3. 수정 전에는 실제 파일, 현재 구현, `git status`/해당 diff를 직접 확인한다. Graph와 다르면 working tree가 우선한다. `check_index_coverage`도 best-effort 신호일 뿐 완전성을 보장하지 않는다.
4. 빈 결과·stale 의심·미지원 parser·동적/runtime/config/문자열/template/framework 연결은 targeted Grep/Glob → 관련 Read로 전환한다. source 확인 없이 부재/dead code/호환성을 판단하거나 symbol rename·dependency 제거를 하지 않는다.

| 변경 규모 | 탐색 깊이 |
| --- | --- |
| 위치가 확실한 작은 수정 | 필요한 source를 바로 읽고 필요한 경우만 최소 Graph 질의 |
| 여러 파일 변경 | caller/callee, dependency, reference, 관련 테스트 확인 |
| 아키텍처 변경 | domain 진입점·주요 symbol·call path·모듈 간 reference·테스트까지 확인 |

조사자는 Graph로 범위를 좁히고 source 근거를 수집한다. Writer는 source를 직접 읽고 소유 파일만 직렬 수정한다. Reviewer는 Writer의 영향 범위를 그대로 믿지 않고 Graph·source·diff로 독립 검증한다. 조사/검증 역할에는 읽기 질의만 허용하며 `index_repository`, `delete_project`, `manage_adr`, `ingest_traces`를 맡기지 않는다. 기존 `docs/DECISIONS.md`가 결정 정본이므로 별도 CBM ADR를 자동 생성하지 않는다.

### 로컬 연동과 index 관리

- 공식 Windows binary v0.10.8을 `%LOCALAPPDATA%/Programs/codebase-memory-mcp/`에 설치했다. 일반 자동 installer는 여러 client의 전역 hooks/skills를 변경하므로 `install --skip-config`를 사용한다. 이 버전은 `--help`와 `install --dry-run`을 지원하고 `install --help`는 지원하지 않는다.
- Claude `.mcp.json`, Codex `.codex/config.toml`은 동일 binary, 동일 repository root, 동일 `%USERPROFILE%/.cache/codebase-memory-mcp`를 사용한다. 절대 경로를 포함하므로 로컬 설정으로 Git에서 제외한다. 두 client에 server 이름은 `codebase-memory-mcp` 한 번씩만 등록한다.
- 각 서버 환경에 `CBM_ALLOWED_ROOT=<현재 repo 절대 경로>`, `CBM_CACHE_DIR=<위 공용 cache 절대 경로>`를 설정한다. Codex에는 `cwd=<현재 repo 절대 경로>`도 지정하고 두 CLI를 repo root에서 시작한다. 폴더를 이동하면 두 설정의 root를 함께 갱신한다.
- Claude 프로젝트 서버는 이 사용자가 승인한 것만 활성화한다. 읽기 전용 역할은 부모의 `codebase-memory-mcp` 연결을 `mcpServers`로 참조한다. 기존 Stop hook 및 `CLAUDE.md`의 `@AGENTS.md` import를 유지한다.
- 초기 index와 필요한 갱신은 지정된 Main 한 명이 `index_repository(repo_path=<root>, mode="full", persistence=false)`로 수행한다. `full`은 이 저장소의 실제 코드인 `scripts/`를 포함한다. `fast`/`moderate`는 해당 디렉터리를 제외할 수 있으므로 사용하지 않는다.
- 확인된 공용 설정 `auto_index=false`, `auto_watch=true`, `auto_index_limit=50000`, `ui_enabled=true`, `ui_port=9749`는 보존했다. 세션마다 전체 재인덱싱하지 않는다. watcher가 불확실하거나 branch/대량 변경 직후에는 Main이 한 번 갱신하고 source를 대조한다.
- artifact 없는 상태에서 `persistence=false`를 사용하여 `.codebase-memory/graph.db.zst`나 Git merge driver를 만들지 않는다. 공유 대상은 같은 machine cache다. 별도 worktree/다른 root는 별도 프로젝트이므로 동일 index로 강제 합치지 않는다.
- 기본 제외와 `.gitignore`가 `.git/`, `.claude/`, 산출물·의존성·환경파일 및 `work/`, `outputs/`, 로컬 MCP 설정을 처리한다. 실제 index로 확인했으므로 중복 `.cbmignore`를 추가하지 않았다. `.mjs` 등 현재 확장자는 기본 지원하여 `.codebase-memory.json`도 만들지 않았다. `scripts`, `schemas`, `harness`, 정본 문서는 유지한다.

### 해석 제한과 복구

- v0.10.8에서 `walk`/`visit`의 위치와 module caller는 맞지만 recursive CALLS edge가 빠졌고 일부 USAGE가 다른 파일의 동명 `name`/`path`에 잘못 연결됐다. Node builtin과 문자열 subprocess 연결도 source로 확인한다. `package.json`은 File 목록에 없었다. `.claude`는 기본 제외이므로 hook 설정은 직접 읽는다.
- source가 바뀌지 않았는데도 Windows에서 `check_index_coverage`가 `metadata_changed`를 반환했다. 무한 재인덱싱 대신 현재 source/파일 hash와 관찰된 index 결과로 확인하고 불확실성을 기록한다.
- `CBM_ALLOWED_ROOT`는 index 경계이며 이미 공용 cache에 있는 다른 프로젝트의 query 접근까지 차단하는 기능이 아니다. 비밀값·실제 일기·credential 파일을 index에 넣지 않는다.
- UI는 공용 daemon의 loopback 9749 설정이다. 실제 도달 가능 여부와 watcher 검증 결과는 `CURRENT_TASK` 증거를 따른다. 설정값만으로 작동한다고 보고하지 않는다.
- 업데이트 전 공식 release/현재 `--help`, checksum 및 `install --dry-run --skip-config`를 다시 확인한다. Windows에서는 설치 옆의 공식 `install.ps1 --skip-config`를 사용하고 양 client를 재시작한다. 기존 cache와 모든 설정은 먼저 보존한다.
- 되돌림: 두 로컬 MCP 설정에서 이 server 항목만 제거하고, Claude 승인 목록의 해당 항목만 제거한다. 이 작업의 문서/role/ignore diff만 역적용한다. Git 신뢰 변경은 `git config --global --fixed-value --unset-all safe.directory <이 root>`로 이번 추가분만 제거할 수 있다. binary 제거는 먼저 `uninstall --dry-run`을 검토하고, 공용 cache나 다른 client 설정의 삭제를 승인하지 않는다. 이 프로젝트 DB 삭제가 필요하면 project 이름을 확인한 뒤 지정된 Main만 수행한다.
- 이 환경에서는 `uninstall --dry-run`도 Codex `hook_preflight / command_render`로 실패했다. 자동 rollback은 검증되지 않았으므로 위 항목별 수동 제거 범위만 사용한다. dry-run 로그의 `removed` 문구만으로 실제 삭제 또는 무변경을 단정하지 않는다.

공식 근거: [v0.10.8 README](https://github.com/DeusData/codebase-memory-mcp/blob/v0.10.8/README.md), [configuration](https://github.com/DeusData/codebase-memory-mcp/blob/v0.10.8/docs/CONFIGURATION.md), [ignore](https://github.com/DeusData/codebase-memory-mcp/blob/v0.10.8/docs/cbmignore.md), [Codex MCP](https://learn.chatgpt.com/docs/extend/mcp), [Claude MCP](https://code.claude.com/docs/en/mcp).

## 10. 오케스트레이터-워커 병렬 작업 (D-087)

화면 시안처럼 파일이 여러 묶음으로 나뉘는 큰 작업에 쓴다. 한 문장으로 설명되는 작은 수정에는 쓰지 않는다. Anthropic 공식 권장([best practices](https://code.claude.com/docs/en/best-practices), [agents](https://code.claude.com/docs/en/agents), [long-running harness](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents))과 2026-09-22~25 운용에서 실제로 난 문제를 합친 절차다.

### 10.1 역할

| 역할 | 누가 | 하는 일 | 하지 않는 일 |
| --- | --- | --- | --- |
| 메인(오케스트레이터) | 주 세션 | 계획·작업 나누기·작업자 지시·**독립 검수**·결정 문서·PRD·공용 파일·통합 | 작업자 몫 파일 직접 수정(작업자가 돌아가는 동안) |
| 작업자(Worker) | `general-purpose`, `model: sonnet`, background | 맡은 파일 구현, 자기 검증(캡처·측정·`quick`), 한국어 보고 | 커밋·`git add`·push, 소유 밖 파일 수정, 공용 기반(미리보기 서버 등) 재시작을 알리지 않고 하기 |
| 마감 리뷰어 | **새 맥락**의 하위 에이전트(읽기 전용) | 전체 diff를 계획·대조표와 비교해 빈틈 보고 | 수정, 스타일 취향 지적 |

### 10.2 시작 전

1. **계획 먼저.** plan 모드에서 계획을 만들어 사용자 승인을 받는다. 작업마다 산출물과 **통과/실패가 나오는 완료 기준**(측정값·캡처·명령)을 적는다.
2. **파일 나누기.** 작업자마다 소유 파일을 겹치지 않게 정하고 `CURRENT_TASK`에 적는다. 새 CSS·JS 파일은 메인이 미리 만들고 연결해 둔다. 여러 작업자가 쓰는 공용 파일(라우터·상태·토큰)은 메인만 고친다.
3. **격리 방식 고르기.**
   - 기준 코드가 커밋돼 있으면 작업자마다 worktree(`isolation: "worktree"`)를 쓴다(공식 기본).
   - 필요한 변경이 커밋 전이라 worktree에 없으면, 같은 폴더에서 소유 파일만 나눠 쓴다. 이때는 3개 조건을 지킨다.
     - 새 클래스에는 작업자 접두어를 붙인다.
     - 캡처 포트와 브라우저 프로필은 작업자마다 따로 쓴다.
     - 공용 미리보기 서버는 재시작하면 반드시 보고한다.
4. **공통 브리프 하나.** 규칙·도구·포트·접두어·금지 사항은 scratchpad의 브리프 파일 하나에 쓴다. 작업 지시에는 할 일·완료 기준·보고 형식만 쓴다.

### 10.3 작업 단위와 게이트

- 작업자 하나는 한 번에 작업 하나만 한다. 게이트를 통과해야 다음 작업을 받는다.
- 작업자는 **증거로 보고한다**. 바꾼 파일, 기준별 측정값, 캡처 경로, `quick` 결과, 스스로 찾은 약점을 적는다. '잘 됐다'는 말만 있는 보고는 받지 않는다.
- **메인은 보고를 믿지 않고 다시 잰다.** 캡처를 확대해 보고, 직접 연 경로와 흐름을 따라 도착한 경로를 비교하고, 같은 기준을 다른 크기에서 다시 잰다. 2026-09-25에 자기 검증을 통과했는데 메인 재측정에서 걸린 예는 다음과 같다.
  - 조약돌 무늬가 알파 밖까지 칠해져 네모 상자가 보였다.
  - 완료 화면 격자에서 친구가 30px로 줄었다.
  - 봉인 연출을 거쳐 도착하면 완료 화면이 틀어졌다.
- 결함은 **재현할 수 있는 증거**(캡처 경로·측정값·재현 주소)와 통과 기준을 붙여 돌려보낸다.

### 10.4 재작업과 새 작업자

- 재작업은 같은 작업자를 SendMessage로 다시 깨워 맥락째 잇는다. **같은 작업에 두 번까지다.**
- 두 번 돌려보냈는데도 기준을 못 넘으면 그 작업자를 잇지 않는다. 그동안 알게 된 원인과 기준을 담은 **새 지시로 새 작업자를 띄운다.** 실패한 시도로 맥락이 어지러운 세션보다, 더 나은 지시를 받은 새 세션이 거의 항상 낫다(공식 best practices).
- **서로 관계없는 새 작업은 새 작업자에게 준다.** 앞 작업으로 맥락이 길어진 작업자에게 이어 붙이지 않는다.
- 결함의 원인이 다른 작업자의 파일에 있으면 메인이 순서를 정한다. 작업자끼리 서로의 파일을 고치지 않는다.

### 10.5 중단과 재개

- 사용자가 중단하라고 하면 작업자를 멈춘다. 그리고 작업자마다 **멈춘 지점**(끝난 것·남은 기준·마지막으로 하던 동작)을 `CURRENT_TASK` 체크포인트에 적는다. 멈춘 코드는 되돌리지 않고 '검수 전'으로 표시한다.
- 재개할 때는 같은 작업자를 SendMessage로 깨워 남은 기준만 준다. 작업자가 이미 끝났거나 맥락을 잃었으면 체크포인트를 근거로 새 작업자를 띄운다.

### 10.6 마감

1. 모든 작업이 게이트를 통과하면 메인이 통합·정리하고 `verify --mode full`을 돌린다.
2. **마감 검토는 새 맥락의 하위 에이전트가 한다.** 일한 쪽이 스스로 채점하지 않게 하려는 것이다. 리뷰어는 diff와 계획, 사용자 요청 대조표만 받는다. 요구사항이나 정확성에 영향이 있는 빈틈만 보고하게 한다. 지적을 모두 쫓으면 과잉 설계가 되므로 나머지는 선택 사항으로 둔다. 검토 횟수는 사용자가 정한 대로 한다.
3. **커밋으로 되돌릴 지점을 남긴다.** 게이트를 통과한 묶음마다 커밋을 **제안한다**. 실제 커밋은 사용자가 지시할 때만 한다(AGENTS §2.1). Claude Code의 되돌리기 체크포인트는 Bash로 한 수정을 잡지 못하고 git을 대신하지 않는다. 커밋되지 않은 변경이 크게 쌓였으면 그 위험을 사용자에게 알린다.
4. **긴 세션은 끊는다.** 서로 관계없는 요청이 한 세션에 쌓이고 압축이 여러 번 일어났으면, 묶음이 끝날 때 체크포인트를 남기고 새 세션에서 `CURRENT_TASK`부터 다시 시작하길 권한다.
