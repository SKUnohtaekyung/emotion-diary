# 2026-10-15 설계도 정리 계획 — 감리 결정을 설계도·공정표·관문에 옮긴다 (TASK-CLEANUP-01)

요청 원문과 사용자 결정은 [REQUESTS.md](REQUESTS.md). **이 문서가 이 작업의 유일한 진행 기록이다.** 항목 하나를 끝낼 때마다 체크하고 그 줄에 결과와 근거(파일·절, 명령 → 결과)를 적는다. 대화가 요약돼도 이 문서만 보고 이어 갈 수 있어야 한다.

이 계획은 TASK-REVIEW-01(감리)을 마친 세션이 2026-10-15에 세웠다. **실행은 새 세션이 한다.** 새 세션은 §0부터 읽는다. 배경과 근거는 감리 보고서 [../../review/2026-10-14/REPORT.md](../../review/2026-10-14/REPORT.md)(§1.2 정할 것, §3.3 대안 계획, §4 작업 방식, §5.4 AI 경로, §6 위험)와 불일치 목록 [../../review/2026-10-14/FACTS.md](../../review/2026-10-14/FACTS.md) §K.

## 0. 새 세션 시작

### 0.1 읽는 순서

1. `AGENTS.md`, `docs/SERVICE_WHY.md`(전문) — Claude Code는 세션 시작 때 자동으로 불러온다.
2. 이 문서 전체와 [REQUESTS.md](REQUESTS.md).
3. 감리 보고서의 §1.2·§3.3·§4·§5.4·§6 — 이 작업이 옮기는 내용의 근거다. 나머지 절은 필요할 때만.
4. `tasks/CURRENT_TASK.md`의 TASK-CLEANUP-01 절.
5. 나머지 문서는 §5의 단계에서 고칠 절만 읽는다(문서 전체를 통째로 읽지 않는다 — `docs/DECISIONS.md`는 24만 바이트다).

### 0.2 첫 응답에서 할 일

0. 모델 확인: 메인은 Opus 5.5(추론도 high 이상)를 권한다 — 설계도 여러 개를 한 모양으로 맞추는 일이라 정합성 판단이 품질을 가른다. 다르면 사용자에게 한 줄로 알리고 그대로 진행한다(묻지 않는다).
1. 상태 확인: `git status --short`, `git branch --show-current`, `git log --oneline -3`. 2026-10-15 기준 브랜치 `app/scaffold`, 로컬 커밋 `323329b`(T3 뼈대)·`1845e83`(감리 보고서) — 푸시·PR은 사용자 몫으로 남았다(REQUESTS '이번에 정하지 않은 것'). 커밋 전 변경: `tasks/cleanup/2026-10-15/**`, `tasks/CURRENT_TASK.md`. 추적 밖 잔여물 `.playwright-cli/`·`output/playwright/`는 건드리지 않는다.
2. **지금 HEAD에서 새 브랜치 `docs/cleanup`을 만든다**(`git switch -c docs/cleanup` — 커밋 전 변경을 그대로 가져간다). 이미 사용자가 PR을 올려 병합했으면 main에서 만들어도 된다. 커밋은 하지 않는다.
3. 사용자에게 결과부터 짧게: 이 작업이 무엇인지(설계도 정리 — 코드·서버·화면은 그대로), 단계(§5), 사용자가 할 일(끝에 이슈 닫기 허락 한 번, 커밋 지시).
4. 바로 §5 0단계로 간다.

### 0.3 쓰는 비유(보고·질문 모두 이 한 벌로)

| 비유 | 실제 |
| --- | --- |
| 설계도 | 정본 문서(PRD, ARCHITECTURE, DATA_MODEL, UX_SPEC, EVAL_PLAN …) |
| 공정표 | `harness/work-graph.yaml`, `docs/ROADMAP.md`, `docs/STATUS.md` §4 |
| 관문 | `harness/quality-gates.yaml`의 게이트와 `docs/EVAL_PLAN.md` §14 |
| 결정 장부 | `docs/DECISIONS.md` |
| 현장 규칙 | `AGENTS.md`, `docs/AGENT_WORKFLOW.md`, 훅 스크립트 |
| 뼈대 | `app/`(이번에는 건드리지 않는다) |

## 1. 목표와 성공 기준

**목표**: 사용자 결정 U-1~U-7(REQUESTS)과 감리 권고 가운데 에이전트가 정할 수 있는 것을 설계도·공정표·관문·결정 장부에 옮겨, 다음 짓기 작업(data-foundation '저장 핵심')이 **새 순서·두 관문·'사실 한 곳' 규칙**으로 바로 시작하게 한다. 코드는 바꾸지 않는다 — 예외는 U-5의 소유 파일 확인 장치(훅 스크립트와 그 시험)뿐이다.

**끝났다고 할 수 있는 조건**:

1. 결정 장부에 U-2~U-7의 새 행이 짧은 형식(§3 A-2)으로 있고, 뒤집히거나 교정된 옛 행(D-018·D-029·D-042 등)의 상태 칸에 '…가 대체/교정' 한 줄이 있다.
2. 공정표(work-graph)·관문(quality-gates, EVAL §14)·ROADMAP·TRACEABILITY·STATUS §4가 **같은 순서와 같은 관문 이름**을 말한다(§4.1). `scripts/check-harness.mjs`가 PASS(quick 안에서).
3. '사실 한 곳'(§4.3)이 지켜진다: 감리 FACTS §K의 불일치 9건(K-1~K-9)이 각각 '어디서 어떻게 0이 됐나'와 함께 0이고, 규칙이 AGENTS §4에 한 문장으로 있다.
4. AI·근거 분석 서술이 U-6·U-7과 맞다(PRD §4·§10·§12, ARCHITECTURE §4.4·§4.6, AI_RAG_SPEC의 모델 접근·RAG 시점 절, runtime-profile `model_access`).
5. 위험 기록이 감리 §6대로 갱신됐다(새 위험 등록, 재평가 반영).
6. 소유 파일 확인 장치가 '동시 작업 때만' 확인하고(§3 A-4), 시험이 새 동작을 덮어 PASS, AGENTS §2.2·AGENT_WORKFLOW §10이 같은 말을 한다.
7. `tasks/CURRENT_TASK.md`에는 이 작업 절과 다음 작업 예고만 남고, 끝난 절(TASK-MOBILE T3·TASK-REVIEW-01·TASK-HOOK-AUTO)은 `tasks/archive/`에 있다.
8. 새 맥락 읽기 전용 검토자 1명의 '짓는 사람 시험'(다음 작업자가 공정표·관문·STATUS §4만 보고 새 순서대로 시작할 수 있나) 통과, 지적 반영, `node scripts/verify.mjs --mode full` PASS.
9. 이슈 #1~#9: 닫을 것·남길 것과 닫는 말을 이 문서에 적었고, 사용자 허락이 있었을 때만 닫았다.

## 2. 범위

- **포함**: 결정 장부 새 행, 공정표·관문·평가 계획·로드맵·추적표·상태 문서·PRD·아키텍처·AI 명세·위험 기록·하네스 파일 4종·README·AGENTS·AGENT_WORKFLOW·PROCESS_LOG 갱신, 소유 파일 확인 장치(스크립트·시험), CURRENT_TASK 정리와 archive, 이슈 처리 목록.
- **제외**: `app/`·`web/`·`design/`·`data/` 변경, 서버·Cloudflare·원격 명령, `npm install`/`npm ci`, 커밋·푸시·PR(사용자 지시 때), 옛 결정 행 고쳐 쓰기(새 행과 상태 칸 한 줄만), DECISIONS·TRACEABILITY 전면 압축(TRACEABILITY는 이번에 고치는 행만 짧게), CRLF 절차 변경, Codex 대비 문서 축소, GitHub 계정 설정.
- 다음 짓기 작업의 세부(쓰던 단계 칸, 기기 안 짧은 사본, 열쇠 잠금 고침, 부를 이름 내보내기, E2E 도구 고르기)는 **정하지 않고** 공정표의 해당 노드 설명과 STATUS §4에 '여기서 정한다'로만 적는다.

## 3. 결정

### 3.1 사용자 결정(REQUESTS — 이 작업의 전제)

| # | 결정 | 설계도에 옮길 뜻 |
| --- | --- | --- |
| U-1 | 요금제 Max(5x 또는 20x) | U-6의 근거(월 API 크레딧). 결정 장부에는 U-6 행의 근거로 적는다 |
| U-2 | 순서: '오늘 한 편'을 휴대폰까지 먼저, 그날부터 실제로 쓴다 | D-018의 순서 교정(범위는 그대로). 대시보드는 실사용 2주 데이터 뒤 |
| U-3 | 관문 둘: '본인 사용 시작'과 '공개' | 새 관문 `personal-start`. Android·건강정보 별도 동의·위기 연락처 임상 검토·S-10/S-11·화면 낭독기는 공개 관문으로. 위기 연락처는 '검토 전' 표기로 본인만 |
| U-4 | '사실은 한 곳에' | §4.3 배치표, AGENTS §4 규칙 |
| U-5 | 소유 파일 확인 장치는 동시 작업 때만 | D-042 교정. 구현은 §3.2 A-4 |
| U-6 | AI 쓰기는 지금 짓지 않고 30일 실사용 뒤 결정, 짓게 되면 서버 → Claude API(Max 포함 크레딧), 크레딧이 없어지면 PC 경로로 돌아갈 수 있게 | D-029의 경로 교정. D-019(추가 지출 0)는 크레딧 안이라 유지. PC worker는 '대체 경로'로 남는다 |
| U-7 | 근거 분석은 60일 실사용 뒤 결정, 짓게 되면 파일 카드 30~50장 + 태그 검색, 그 전에는 AI가 심리학 설명을 하지 않는다 | PRD §10의 시점·크기 교정, `vector-search-spike`는 그때 다시 본다 |

### 3.2 에이전트 결정(이 계획을 세운 세션 — 실행 세션이 이유를 적고 바꿀 수 있다)

| # | 결정 | 이유 |
| --- | --- | --- |
| A-1 | 공정표 모양은 §4.1 | 감리 §3.3 대안 계획을 노드로 옮긴 것. 노드 id는 되도록 살려 추적표 변경을 줄인다 |
| A-2 | 결정 장부 새 행 형식: `\| D-번호 \| 상태(누가·언제) \| 한 줄 요지 \| 근거는 링크 한두 개(REPORT 절·REQUESTS U-n)와 대체하는 옛 결정 \| 다시 열 조건 \|` — 한 행 600자 안팎 | R-PROC: 3,000자 넘는 행 24개, 사용자·에이전트 결정이 섞임 |
| A-3 | '사실 한 곳' 배치는 §4.3 | U-4를 구체화 |
| A-4 | 소유 파일 확인 장치는 `tasks/CURRENT_TASK.md`에 `- 동시 작업: 켬` 줄이 있을 때만 지금처럼 확인하고, 없으면 조용히 통과한다(auto 모드에서 꺼지는 것과 작업 폴더 제외는 그대로). `.claude/settings.json`은 바꾸지 않는다 | 설정 파일을 건드리지 않고 문서 한 줄로 켜고 끈다. 병렬 작업 절차(AGENT_WORKFLOW §10)가 그 줄을 켠다 |
| A-5 | 옛 결정 행은 고쳐 쓰지 않는다 | 24만 바이트 장부를 고쳐 쓰면 정보 손실 위험이 크다. 새 행과 옛 행 상태 칸 한 줄로 충분 |
| A-6 | `limited-mvp-release` 노드 id는 유지하고 뜻을 '공개 출시(공개를 정할 때만)'로 바꾼다 | id를 바꾸면 추적표·평가 계획·STATUS 연결이 모두 끊긴다 |

## 4. 변경 지도

### 4.1 공정표 목표 모양(`harness/work-graph.yaml`)

`done` 노드(bootstrap-audit·hosting-identity-spike·data-store-spike·app-scaffold·taxonomy-v1·taxonomy-v2-research)는 그대로 둔다.

| 노드 | 상태 | 선행 | 만드는 것 | 관문(새 이름은 굵게) |
| --- | --- | --- | --- | --- |
| data-foundation(범위를 '저장 핵심'으로) | ready | app-scaffold | 일기·감정 표(0005~), 오늘 임시저장·완료·조회·수정, 하루 1개·revision·멱등·권한, '쓰던 단계'를 서버에 둘지 결정, 열쇠 잠금 고침(맞는 열쇠는 잠금과 상관없이 통과 — 감리 §5.2) | data-integrity: F-01·02·06·07·09·10(F-14·15는 data-control로) |
| **first-slice**(새) | blocked | data-foundation, taxonomy-v1, taxonomy-v2-research | 작성 흐름 상태 설계 한 장, 연출 없는 '오늘 한 편' 화면, 서버 임시저장·새로 열림 복구, 자판 아래 버튼 결정, 기기 안 짧은 사본 결정, E2E 도구 결정 | **first-slice**: F-03·04·05·08·24, **e2e-reload-restore**, **mobile-slice**(iPhone 약 10분 — S-02·S-06·S-07·T-03) |
| **data-control**(새) | blocked | data-foundation | 내보내기(공유 창)·전체 삭제·PC 백업·재수입 도구·복원 연습(복원 뒤 세션 비우기)·내보내기 CPU 실측 | **data-control**: F-14·F-15, **restore-drill**, **export-cpu-measured** |
| **personal-start**(새) | blocked | first-slice, data-control | 운영 건물·운영 열쇠(만들기 직전 사용자 확인), 위기 안내 '검토 전' 표기. 이때부터 '구조 변경 전 내보내기 + 백업, 바꾼 뒤 복원 확인' 규칙 | **personal-start**: full, F-01·02·06·07·09·10·14·15·24, deployment-boundary-review, **backup-and-restore-drill**, **mobile-personal**(내보내기·앱 전환 가림) |
| direct-journal | blocked | personal-start | 시안 이식(나머지 작성 단계·연출·달력·기록 상세·설정), 화면 도구 관문(감리 §5.3) | core-product: F-03·04·05·07·08·17·18·19·21, **mobile-core-flow-personal**(iPhone), accessibility-core-flow — Android는 빠진다 |
| dashboard-reminder | blocked | direct-journal(그리고 실사용 2주 데이터) | 기본 통계 먼저, 기간 비교·친밀도는 그 뒤, 알림 기본값은 사용자와 | reflection-core(지금대로 + F-20) |
| limited-mvp-release(뜻 바꿈 — A-6) | blocked | direct-journal, dashboard-reminder | 공개를 정할 때만: 출시 증거 묶음 | limited-release에 **public-only** 항목 추가: Android Chrome 실기기, 건강정보 별도 동의·처리방침, 위기 연락처 임상 검토·1388 실측, S-00~S-12 전부·T-01~T-07, 화면 낭독기 |
| model-access-spike | verifying(그대로) | — | 주석·outputs를 U-6으로: 짓게 되면 서버 직통 경로를 확인하는 노드로 다시 정의, 보류 2건은 그 길에선 묻지 않음 | model-access(주석만) |
| ai-journal | blocked | direct-journal, model-access-spike | 주석: 30일 실사용 뒤 지을지 결정(U-6) | journal-ai(그대로) |
| vector-search-spike · evidence-pipeline · rag-analysis | blocked | — | 주석: 60일 실사용 뒤 결정, 하면 파일 카드 30~50장·태그 검색 — vector-search-spike는 그때 필요 없을 공산(U-7) | 그대로 |
| release-candidate | blocked | — | 주석만 | 그대로 |

- `mutation_rule`대로 노드를 더하면 ROADMAP·TRACEABILITY·quality-gates `node_gates`·EVAL §14를 같은 변경에서 고친다(이 작업 범위 안).
- `check-harness` 규칙: 선행이 `done`이 아닌데 후행을 시작 상태로 두지 않는다, `loop-state.completed_nodes` = done 노드, `next_node`는 done이 아닌 노드(data-foundation 그대로).

### 4.2 문서별 변경

| 파일 | 바꿀 곳 | 근거 |
| --- | --- | --- |
| `docs/DECISIONS.md` | 표 마지막 행 뒤에 U-2~U-7 새 행(A-2 형식). D-018·D-029·D-042와 근거 분석 범위를 정한 행의 상태 칸에 '…가 교정' 한 줄 | REQUESTS, 감리 §1.2 |
| `harness/work-graph.yaml` | §4.1 | U-2·U-3·U-6·U-7 |
| `harness/quality-gates.yaml` | `node_gates` 새·바뀐 관문, `release.mobile-real-device` 주석을 본인/공개로 나눔, `browser-e2e`에 '첫 조각에서 도구 결정' 주석 | U-3, 감리 §3.2 |
| `docs/EVAL_PLAN.md` | §14 관문 정의(새 이름 전부), §4·§6 표에 본인/공개 표시(내용·결과는 그대로) | U-3 |
| `docs/ROADMAP.md` | 단계 순서를 §4.1로, Phase 2의 'backdating'(K-4)·Phase 0 G2c의 낡은 남은 목록(K-5) 고침, AI·RAG 시점(U-6·U-7) | U-2, K-4·K-5 |
| `docs/STATUS.md` | §1 표, §3 끝 실기기 줄(S-07 '가려짐'), §4 다음 할 일을 새 순서로. 숫자는 이 문서만 갖는다(§4.3) | U-2·U-4, K-1·K-3 |
| `docs/TRACEABILITY.md` | 새 노드·관문 연결, 고치는 행은 ID와 절 번호만으로 짧게 | U-4 |
| `docs/RISK_REGISTER.md` | 새 위험(감리 N-1 요청 한도 소진, N-3 전역 잠금 주인 차단, N-5 자판 버튼, N-6 쓰던 단계·사본, N-11 크레딧 철회, N-12 바뀌는 구조 위의 실제 일기), 재평가(RK-016·017·018·035 — U-6, RK-034 — F-24 관문 연결, RK-001, RK-011 — U-5) | 감리 §6 |
| `PRD.md` | §4 AI 문장(U-6)·미검증 목록의 자판(K-3 — 실제 앱에서 '가려짐'), §10 근거 분석 시점(U-7), §12·§13 출시 문장(U-3) | U-3·U-6·U-7 |
| `docs/ARCHITECTURE.md` | §4.4 AI Orchestrator·§4.6 PC AI Worker(짓게 되면 서버 직통, PC는 대체 경로), §10 표의 AI 줄 | U-6 |
| `docs/AI_RAG_SPEC.md` | 모델 접근 절(§1·§4)과 RAG 시점·크기 | U-6·U-7 |
| `harness/runtime-profile.json` | K-2(스파이크 자원 이력 문장), K-3(자판), `model_access`에 U-1·U-6 한 줄, 긴 서술 가운데 STATUS·PLAN과 겹치는 것은 링크로 | U-4 |
| `harness/loop-state.json` | `task_id` TASK-CLEANUP-01, `last_checkpoint`는 한 줄 + 이 PLAN 링크, `blockers` 갱신, `next_node` data-foundation | U-4 |
| `harness/README.md` | loop-state는 사본이 아니라 가리키는 곳이라는 한 문장 | U-4 |
| `README.md` | 정본 지도에 '숫자·상태는 STATUS' 한 줄, 낡은 숫자 있으면 링크로 | U-4 |
| `AGENTS.md` | §2.2(동시 작업 때만 — A-4), §4('사실 한 곳' 한 문장, 결정 새 행 형식 한 문장) | U-4·U-5 |
| `docs/AGENT_WORKFLOW.md` | §10.2 병렬 작업자를 띄우기 전 `- 동시 작업: 켬`과 소유 파일 선언, 끝나면 끔 | U-5 |
| `scripts/claude-scope-guard.mjs`, `scripts/test-claude-scope-guard.mjs` | A-4 구현과 시험(줄 없음 → 통과, 줄 있음 → 지금 동작, auto → 통과, 작업 폴더 → 통과, 훅 종료 코드 0) | U-5 |
| `docs/PROCESS_LOG.md` | 짧은 새 절: 감리와 현장 규칙 정리(무엇을 왜 줄였나, 링크) | U-4·U-5 |
| `tasks/CURRENT_TASK.md`, `tasks/archive/**` | 끝난 절 셋을 archive로(TASK-HOOK-AUTO는 U-5로 '다른 세션 확인 대기'가 뜻을 잃었다는 한 줄과 함께), 맨 위 표, archive 목록 | K-9 |
| `tasks/TASK-MOBILE.md` | 머리 상태 줄만(T3 끝 → 다음은 새 공정표) — 있으면 | — |

### 4.3 '사실 한 곳' 배치(A-3)

| 사실 | 한 곳 | 다른 문서는 |
| --- | --- | --- |
| 노드 상태 | `harness/work-graph.yaml` | STATUS §1은 단계 요약만, 나머지는 링크 |
| 숫자(시험 수·원격 검사 수 등) | `docs/STATUS.md`(날짜와 명령을 함께) — 가능하면 숫자 대신 '명령이 정본'으로 | 다른 문서·하네스 주석에서 숫자를 지우고 링크 |
| 실기기 결과(S·T) | `docs/EVAL_PLAN.md` §4·§6 표 | PRD §4·runtime-profile·STATUS는 링크 |
| 작업 진행 | 그 작업의 PLAN | CURRENT_TASK는 상태 한 줄 + 링크, loop-state `last_checkpoint`는 한 줄 + 링크 |
| 결정 | `docs/DECISIONS.md` | 다른 문서는 번호만 |
| 외부 사실(무료 한도·공식 문서) | `harness/runtime-profile.json`(확인일과 함께) | 링크 |

## 5. 단계와 체크리스트

### 0단계. 시작

- [x] 0-1 §0.2 상태 확인, 브랜치 `docs/cleanup` 만들기. 결과를 이 줄에. — 모델 Opus 5.5(권장과 같음). 시작 상태 `git branch --show-current` → `app/scaffold`, `git log --oneline -3` → `1845e83`·`323329b`·`7b99e2c`, `git status --short` → ` M tasks/CURRENT_TASK.md`, `?? .playwright-cli/`, `?? output/playwright/`, `?? tasks/cleanup/`(PLAN §0.2와 같음). `git switch -c docs/cleanup` → "Switched to a new branch 'docs/cleanup'", 커밋 전 변경 그대로.
- [x] 0-2 CURRENT_TASK의 TASK-CLEANUP-01 절을 `in_progress`로, `harness/loop-state.json`의 `task_id`를 TASK-CLEANUP-01로(머리글과 같아야 check-harness가 통과). `node scripts/verify.mjs --mode quick` PASS. — CURRENT_TASK 표·절 상태 `in_progress`, loop-state `task_id` TASK-CLEANUP-01·`phase` cleanup-in-progress. `node scripts/verify.mjs --mode quick` → "PASS: quick 검증 완료"(3.3초).

### 1단계. 지도 맞추기(읽기만)

- [x] 1-1 §4.2의 각 줄을 지금 파일과 대조해 고칠 곳의 절·줄을 적는다(이 문서 '진행 기록'에 표로). 지도에 없는데 고쳐야 할 곳을 찾으면 더한다. — 진행 기록 '1-1 변경 지도 대조' M-1~M-21. 지도에 없던 곳: DECISIONS D-008·D-019·D-093·D-094·D-108·D-110 상태 칸, EVAL §13 제한 MVP 문단, TRACEABILITY §3 '유료 API' 행, README 그림. 소유 밖이라 남기는 곳: `docs/DEPLOY.md` §1·§8(personal-start로 넘김), `BOOTSTRAP.md`(이력).
- [x] 1-2 되풀이되는 값의 사실표 한 벌: 앱 시험 수(`npx vitest run` 결과), 원격 검사 34/34(T3 기록), 결정 장부 마지막 번호, 위험 기록 마지막 번호, 노드·관문 이름 목록. 새로 쓸 값은 여기서 옮겨 적는다. — 진행 기록 '1-2 사실표' F-1~F-9: `npx vitest run` → 241건(22파일), 34/34(T3 기록), D-115, RK-039, 노드 16·관문 15, 이슈 9건 OPEN.

### 2단계. 결정 장부

- [x] 2-1 쓰기 직전에 표 마지막 행을 다시 확인하고(다른 세션이 번호를 썼을 수 있다) U-2~U-7 새 행을 A-2 형식으로. 사용자 결정 칸에는 REQUESTS의 '사용자가 고른 것'만, 세부는 '세부(에이전트)'로 가른다. — 쓰기 직전 `grep -o "D-1[0-9][0-9]" docs/DECISIONS.md | sort -u | tail -1` → D-115, `git diff --stat docs/DECISIONS.md` → 변경 없음(다른 세션 흔적 0). `docs/DECISIONS.md` 137~142줄에 D-116(U-2 순서)·D-117(U-3 관문 둘)·D-118(U-4 사실 한 곳)·D-119(U-5 동시 작업 때만)·D-120(U-6 AI 쓰기, 근거 U-1)·D-121(U-7 근거 분석). 굵은 글 = REQUESTS '사용자가 고른 것'과 질문에 함께 적힌 조건, 나머지는 '세부(에이전트)' — 처음 초안이 단계 목록·배치표·'검토 전' 표기·되돌아갈 길·태그 검색을 굵은 글에 넣어 고쳤다. 행 길이 약 800~1,000자(3,000자 넘는 행 0).
- [x] 2-2 교정된 옛 행 상태 칸에 한 줄씩. quick. — 상태 칸 10행: D-008(D-121), D-018(D-116·D-117), D-019(D-120 크레딧 해석), D-029(D-120), D-032(AI 부분 D-120), D-042(D-119), D-093·D-094·D-108(D-117 공개 관문), D-110(대체 경로의 조건). 본문 칸은 고치지 않았다(A-5). `eol.mjs` → CRLF LF=159 CRLF=159, `node scripts/verify.mjs --mode quick` → PASS.

### 3단계. 공정표와 관문

- [x] 3-1 `harness/work-graph.yaml`(§4.1). quick(check-harness). — 머리 주석(D-116~D-121, '노드 상태의 유일한 기록'), app-scaffold 주석에서 숫자 238·34/34를 빼고 STATUS §1 링크 + CI 사실(K-1·K-7), data-foundation 범위 '저장 핵심'과 '여기서 정한다'(쓰던 단계·열쇠 잠금), 새 노드 first-slice·data-control·personal-start(전부 blocked, 게이트 같은 이름), direct-journal 선행 [personal-start], dashboard-reminder '실사용 2주 뒤', limited-mvp-release 뜻 바꿈(A-6), model-access-spike·ai-journal(D-120)·vector-search-spike·evidence-pipeline·rag-analysis(D-121)·release-candidate 주석, edges 7개 더하고 3개 바꿈. `node scripts/check-harness.mjs` → PASS(경고 0). 이때 `verify quick`은 새 관문 셋이 '정의되지 않은 node gate'로 FAIL(예상) → 3-2에서 해소.
- [x] 3-2 `harness/quality-gates.yaml`. quick. — 머리 주석, `no_paid_api_calls`에 D-120 해석 주석, browser-e2e '도구는 first-slice에서', mobile-real-device 주석을 공개 관문 기준으로(Android는 public-only), node_gates: data-integrity [F-01·02·06·07·09·10·ci-green], 새 first-slice·data-control·personal-start, core-product [F-03·04·05·07·08·17·18·19·21·mobile-core-flow-personal·accessibility-core-flow], reflection-core +F-20, limited-release +public-only. `node scripts/verify.mjs --mode quick` → PASS. 에이전트 결정 A-7: data-integrity에 `ci-green`을 더했다 — 이유: 앱 코드가 CI에서 한 번도 돌지 않은 채 app-scaffold가 done인 K-7을 '다음 관문이 첫 초록을 확인한다'로 닫기 위해서(푸시 시점은 여전히 사용자 몫).
- [x] 3-3 `docs/EVAL_PLAN.md` §14·§4·§6 표시. quick. — §14: 새 라벨 9개(public-only·ci-green·e2e-reload-restore·mobile-slice·restore-drill·export-cpu-measured·backup-and-restore-drill·mobile-personal·crisis-help-unreviewed-label)와 관문 행 3개(first-slice·data-control·personal-start), `mobile-core-flow` → `mobile-core-flow-personal`(Android는 public-only, K-8), accessibility-core-flow에서 화면 낭독기를 public-only로, mobile-real-device·limited-release를 공개 기준으로. §4 S 표 아래 '본인/공개' 문단(본인 전에 보는 S-01·02·05·06·07·12, 나머지는 공개, 이 표가 정본), B-06에 D-120 한 문장. §6 모바일 첫 줄·T 목록·접근성 문단에 본인/공개 표시, §13 제한 MVP 문단을 본인 사용 시작/공개로. 스크래치 `label-check.mjs` → "labels used 83, undefined 0"(HEAD 파일로 돌려도 68개 0 — 스크립트가 맞게 도는 것 확인), §14의 쓰이지 않는 라벨 0. quick → PASS, CRLF 379/379.
- [x] 3-4 `docs/TRACEABILITY.md`. quick. — 노드 칸: PR-002(+data-foundation·personal-start), PR-003·005·006·009(+first-slice), PR-014(+data-control·personal-start), PR-015(+first-slice·personal-start). 500자 넘던 행을 ID·절 번호 위주로: PR-002 1,075→536자(시험 수·34/34 사본을 빼고 STATUS §1·EVAL §4·§6 링크 — K-1), PR-005 750→385자, PR-015 948→442자(S-07 문장 사본을 빼고 EVAL §4 링크 — K-3). §3 '유료 API 호출 없음' 행을 '추가 지출 없음(D-019·D-120)'으로. 손대지 않은 행(PR-004·PR-010 등)은 그대로. `verify quick`(PR 행 노드 칸이 실재 노드인지 검사 포함) → PASS, CRLF 97/97.

### 4단계. 설계도 본문

- [x] 4-1 `docs/ROADMAP.md`. — 절을 새 순서로 다시 썼다(Write 뒤 스크래치 `tocrlf.mjs` → "OK LF=163 CRLF=163"): 원칙에 '순서와 완료 기준만, 상태는 work-graph·숫자는 STATUS'(D-118)와 2026-10-15 순서 교정 문단·순서 그림, Phase 0 G2c를 STATUS §3 B-06 링크 + D-120으로(K-5), Phase 1을 앱 뼈대(CI는 푸시 때 처음 — `ci-green`, K-7)·1a 저장 핵심·1b 첫 조각·1c 내 데이터 통제로, 새 절 '본인 사용 시작', Phase 2 '쓰면서 시안 이식'(backdating → 그날만 새로 쓰기 D-082, K-4), Phase 4 '실사용 2주 뒤', '제한 MVP 릴리스' → '공개 출시(공개를 정할 때만)'와 공개 갈림길, Phase 3 '30일 뒤 결정·서버 → Claude API'(D-120), Phase 5 '60일 뒤 결정·카드 30~50장'(D-121). `git diff -U0`의 지운 줄을 하나씩 대조해 빠진 항목 0(G3b 끝의 노드 상태 문장만 D-118로 뺐다). `grep "backdating\|앱 scaffold와 CI\|남은 검증: PC worker"` → 0건, quick PASS.
- [x] 4-2 `docs/STATUS.md`(숫자의 한 곳). — 머리에 '사실 한 곳' 문단(숫자는 §1 숫자 표만, 상태는 work-graph, 실기기는 EVAL §4·§6), 최종 갱신 2026-10-15. §1 표를 새 단계로(본인 사용 시작·공개 출시 행 추가, '앱 238건' 삭제 — K-1)와 **숫자 표**(앱 시험 241건 `npx vitest run` 2026-10-15, 원격 검사 34/34 T3 PLAN 6-6, 가드 시험 30/30·25/25, CI가 앱 코드를 돈 횟수 0). §2 로그인 줄에 RK-041, AI 경로 줄을 D-120·D-121로, 순서 줄을 D-116·D-117로, '작업 방식' 줄(D-118·D-119). §3 끝 실기기 문단을 EVAL §4·§6 링크로 줄임(S-07 '가린다'만 남김 — K-3). §4를 새 순서 열 항목으로 교체(스크래치 `replace-section.mjs` — 머리글 정확히 한 번 일치 확인, 옛 항목 1·2·4·5③④·개발 장치 후속을 7번과 끝 문단으로 옮김). §6 운영 시점·CI·소유 파일 확인 줄. quick PASS, CRLF 112/112, `grep "238\|mobile-core-flow"` → 0건.
- [x] 4-3 `PRD.md`. — §2 MVP 성공 상태 뒤에 '첫 지점은 본인 사용 시작' 문단(D-116·D-117·D-120·D-121), §4 AI 문장을 U-6대로(지금 짓지 않음·30일 뒤 결정·서버 → Claude API·PC 경로로 바꿔 끼움·D-019 안), §4 홈 화면 앱 줄의 '출시 전 실기기 점검' → '본인 사용 시작 전과 공개 전', §4 미검증 목록을 EVAL §4·§6 링크로 줄이고 S-07 '가렸다'로(K-3), §10 근거 분석을 U-7대로(60일 뒤·카드 30~50장·그 전엔 심리학 맥락 없음), §13 끝에 관문 둘 문단(본인 사용 시작은 출시가 아님·공개에만 public-only). §12는 바꿀 것 없음(다중 사용자 공개 서비스는 여전히 MVP 밖). quick PASS, CRLF 231/231, K-3 문장 grep 0건.
- [x] 4-4 `docs/ARCHITECTURE.md`·`docs/AI_RAG_SPEC.md`. — ARCHITECTURE: §1에 '2026-10-15 교정' 문단, §2 그림의 AI 줄을 '처리기(바꿔 끼움) 기본 Worker → Claude API / 대체 PC worker → claude -p'와 Evidence Store 'D-121'로, §3 신뢰 경계의 '모델 호출은 Workers가 직접 하지 않는다'를 '지금은 경로 없음, 짓게 되면 Worker → API(키는 Workers secret, 최소 입력, 크레딧 안), 대체는 PC'로(지도에 없던 곳 — D-120과 정면으로 어긋나 고침), §4.4에 지을지 30일 뒤·모델 접근 줄, §4.6 제목 '대체 경로'와 첫 줄, §10 B-06 두 행에 D-120 한 문장, §10 B-08의 Android에 D-117, §11.2 운영 '제한 MVP 출시 전' → '본인 사용 시작 전'. AI_RAG_SPEC(LF 유지): §1에 '2026-10-15 교정' 문단(서버 직통 기본·PC 대체·근거 분석 60일·그 전엔 심리학 설명 없음), §4 모델 호출 줄을 D-019·D-120으로, §7.1 앞에 D-121(카드 30~50장·태그, Vector Store는 그때 다시). `grep "Workers가 직접 하지 않\|확정 경로는 본인 PC"` → 0건, quick PASS, ARCHITECTURE CRLF 378/378, AI_RAG_SPEC LF 301/CRLF 0.
- [x] 4-5 `docs/RISK_REGISTER.md`. — 새 위험 RK-040(N-1 무료 요청 한도)·RK-041(N-3 전역 잠금이 주인 차단)·RK-042(N-5 자판 버튼 WebKit 버그)·RK-043(N-6 쓰던 단계·사본)·RK-044(N-11 크레딧 철회 — 감리 '낮음~중간'을 medium으로)·RK-045(N-12 바뀌는 구조 위의 실제 일기). 재평가(감리 §6.2 여덟 행 전부): RK-001(주인 차단 → RK-041로 고침), RK-005(D-121로 뒤로), RK-009(D-120 서버 직통이면 줄 공산), RK-011(D-119), RK-015(본인은 정직한 고지로 충분·공개 때 보류), RK-016·017·018(D-120 — 서버 직통이면 대체 경로에만), RK-034(F-24를 관문에 넣음), RK-035(N-4 확인된 예고·AI 전 영향 없음), RK-036(진단 패널로 휴대폰 부담 줄임). 감리 N 가운데 새 행이 아닌 것이 간 곳: N-2(커밋 작성자 메일) → STATUS §4 2번(사용자 GitHub 설정, 감리 Q-F), N-4 → RK-035 재평가, N-7(복원 뒤 세션 부활) → EVAL §14 `restore-drill` 정의, N-8(내보내기 CPU) → `export-cpu-measured`, N-9(시안 이식에 갇힘) → D-116 순서 자체가 완화, N-10(공개 때 AI 이용 정책) → `public-only` 정의의 공개 갈림길. 스크래치 `cells.mjs` → RK 행 45개 전부 8칸(HEAD 39개도 8칸), quick PASS, CRLF 59/59.
- [x] 4-6 `harness/runtime-profile.json`·`harness/loop-state.json`·`harness/README.md`. — runtime-profile: `hosting.account_or_project_exists` 끝 문장을 '같은 날 지웠다'로(K-2), `phone_access_confirmed`·`unknowns[1]`의 미검증 목록을 EVAL §4·§6 링크로 바꾸고 S-07 '가린다'(K-3), `model_access.policy`에 U-1(Max)·D-120 한 줄, 새 칸 `subscriber_api_credits`(감리가 2026-10-14 공식 문서로 확인한 크레딧 조건 — 이번 세션은 다시 보지 않았다고 적음), `unknowns[0]` B-06 보류는 대체 경로에만, `unknowns[5]` B-07은 D-121로 빠질 수 있음, `last_synced` 2026-10-15. `node -e JSON.parse` → OK, `grep -c "remain in the account\|keyboard vs bottom bar"` → 0. loop-state: 약 6천 자의 `last_checkpoint`(238건 포함 — K-1)를 '진행은 PLAN에만' 한 줄로, `blockers` 7개를 4개로(Android 결정 대기는 D-117로 풀림, 스파이크·S-07·B-06 줄은 STATUS·EVAL로), `last_verified_commit` 1845e83(7-3의 full로 확인), `next_node` data-foundation 그대로. Write 뒤 `tocrlf.mjs` → "OK LF=27 CRLF=27", JSON OK. harness/README 5번에 'loop-state는 사본이 아니라 가리키는 곳'과 runtime-profile의 역할 한 문장. `check-harness` → PASS(경고 0), quick PASS.
- [x] 4-7 `README.md`. 문서 하나 끝날 때마다 quick과 짧은 보고. — '어떻게 만들어지나요' 그림의 AI 줄을 '짓게 되면 Claude API(월 크레딧) / 크레딧이 없어지면 PC worker' 점선으로, 아래 문단에 30일 뒤 결정(D-120). '지금 어디쯤' 표를 새 순서로(날짜·결정 번호·숫자 빼고 상태만, 본인 사용 시작·공개 출시 행) + 'STATUS 한 곳' 문장(D-118). 정본 지도의 순서 행에 work-graph(노드 상태), STATUS 행에 '숫자와 상태는 이곳에만'. quick PASS, CRLF 198/198, `grep "[0-9]{3}건\|34/34" README.md` → 0건. 문서마다 quick은 각 줄에 적었다.

### 5단계. 현장 규칙

- [x] 5-1 소유 파일 확인 장치(A-4) — 먼저 시험을 고쳐 새 동작이 지금 코드에서 실패하는 것을 보고, 스크립트를 고쳐 통과. `node scripts/test-claude-scope-guard.mjs` 결과를 이 줄에. — 시험: 기본 fixture에 `- 동시 작업: 켬(작업자 둘, 테스트)` 줄을 넣어 기존 30건이 '켜졌을 때'를 계속 시험하고, fixture 변형 넷(off·explicit-off·prose·list-prose)으로 새 케이스 10건(줄 없음 → 소유 밖·모드 없음·root 밖·선언 경로 모두 통과, `끔` 통과, 문장 속·목록 표식 뒤 설명문은 켜지 않음, 켬 + auto 통과, 켬 + scratchpad 통과, 줄 없음 + 손상 입력 통과). 고치기 전 훅으로 돌림 → "34/40 PASS, 6 FAIL"(새 동작 6건이 ask로 실패 — 시험이 변화를 잡는다). 훅: `isConcurrentWork()`(줄 앞머리 목록 표식 + `켬` 뒤는 끝·괄호·줄표만)를 더하고 CURRENT_TASK를 읽은 뒤 꺼져 있으면 조용히 통과(auto·작업 폴더 제외는 그 앞 그대로, `.claude/settings.json` 그대로). 고친 뒤 `node scripts/test-claude-scope-guard.mjs` → **"40/40 PASS, 0 FAIL"**(모든 케이스가 종료 코드 0도 확인). 실제 CURRENT_TASK(동시 작업 줄 0개)로 default 모드·소유 밖 파일 입력 → stdout 비고 exit 0. CRLF 203/203·336/336. STATUS 숫자 표 40/40, TRACEABILITY AG-HARNESS-001에 D-119 한 문장.
- [x] 5-2 `AGENTS.md` §2.2·§4. — §2 '순차 하위 에이전트' 줄: 확인 훅은 동시에 쓸 때만(D-119). §2.2: 새 둘째 줄 '이 확인은 여러 작업자가 동시에 쓸 때만 켠다'(`- 동시 작업: 켬` 줄 형식·끄는 때·AGENT_WORKFLOW §10.2), D-060 줄은 '켜져 있어도 확인하지 않는 경우'로, 새 작업 줄은 '차례로 일할 땐 범위 표시'. §4: 결정 새 행 형식 한 문장(사용자가 고른 것만·세부(에이전트)·옛 행은 상태 칸 한 줄)과 '사실은 한 곳에' 한 문장(D-118). quick PASS, CRLF 96/96. `grep -c "^[-*] *동시 *작업 *: *켬"` → AGENTS 0(설명 속 언급이 장치를 켜지 않음).
- [x] 5-3 `docs/AGENT_WORKFLOW.md` §10. — §10.2 2번 아래 '소유 파일 확인 장치를 켠다'(작업자를 띄우기 전 `- 동시 작업: 켬`과 작업자별 소유 파일, auto에선 꺼짐, 끝나면 지움), §10.6 1번에 '그 줄을 지운다'. 주의: 원래 섞인 줄바꿈(§10 53줄이 LF)이었는데 Edit 도구가 파일 전체를 CRLF로 맞췄다(LF=229 CRLF=229). `git config core.autocrlf` → true, `git diff --stat docs/AGENT_WORKFLOW.md` → "2 insertions(+), 1 deletion(-)"이라 저장소 차이는 내용 3줄뿐이다(줄바꿈 차이 0). quick PASS.
- [x] 5-4 `docs/PROCESS_LOG.md` 짧은 절. quick. — 새 §8 '감리 결정을 설계도에 옮기며 현장 규칙을 덜어 냈다'(8.1 불일치 9건, 8.2 원인 — 손으로 옮겨 적는 동기화·긴 결정 행·적발 0건 훅, 8.3 무엇을 왜 줄였나 — D-118·결정 행 형식·D-119·D-116·D-117, 8.4 배운 것 — 설명문이 장치를 켜지 않게·사용자 결정과 선택지 설명 가르기·Edit의 줄바꿈 정규화, 8.5 남은 것 — DEPLOY §1·§8, 전면 압축 안 함). 감리 보고서·정리 계획 링크. quick PASS, CRLF 388/388.

### 6단계. 작업 목록과 이슈

- [x] 6-1 CURRENT_TASK 정리와 archive(§4.2 마지막 두 줄). quick(check-harness의 task_id·머리글). — 스크래치 `archive-move.mjs`(머리글 정확히 한 번 일치, 상대 링크 깊이만 고침, 바이트 검산)로 세 절을 옮김: `tasks/archive/TASK-MOBILE-T3.md`(7,058B, `cb6a7afad7a5`, 링크 3), `TASK-REVIEW-01.md`(4,162B, `6ecf7e4b8e90`, 링크 2), `TASK-HOOK-AUTO.md`(7,010B, `8528c181160e`, 링크 0 — 머리말에 'U-5(D-119)로 다른 세션 확인 대기가 뜻을 잃어 닫는다', K-9). 검산 "before=25365 after=7133 moved=18232 check=OK"(옮기기 전 사본은 스크래치 `CURRENT_TASK.before-archive.md`). CURRENT_TASK: 머리말에 D-119·D-118 한 문장, 표를 TASK-CLEANUP-01(진행 중)·'다음: data-foundation' 예고·끝난 작업의 archive 링크로, 맨 끝에 '# 다음 작업 예고 — data-foundation(저장 핵심)' 절. 남은 `# ` 절 = TASK-CLEANUP-01과 다음 작업 예고뿐(8,262B). `tasks/archive/README.md` 목록에 세 줄, `tasks/TASK-MOBILE.md` 머리 상태 줄(T3 끝·다음은 새 공정표). quick PASS, `check-harness` PASS(task_id 머리글 일치), CRLF 51/51·33/33·294/294.
- [x] 6-2 이슈 #1~#9: 이슈마다 '닫음(어디에 반영됐나) / 남김(새 공정표의 어디로)'과 닫는 말을 이 문서에 표로. **닫기는 원격 작업이라 질문 창으로 허락을 받은 뒤에만** `gh issue close <번호> --comment …`로 한다. 허락이 없으면 표만 남긴다. — 진행 기록 '6-2 이슈 처리표'(근거 위치는 `git show origin/main:<파일>`로 가림). 질문 창 답(REQUESTS Q-1): **'5개만 지금 닫기 (추천)'**. 닫는 말은 스크래치 `close-<번호>.md`로 쓰고 `gh issue close <번호> --comment "$(cat …)"` → "✓ Closed issue …#1·#2·#4·#5·#6". `gh issue list --state open` → #3·#7·#8(뼈대 푸시 뒤 닫기 — 처리표의 닫는 말 그대로)·#9(남김). `gh issue view 2` → CLOSED, 마지막 댓글이 닫는 말과 같음. 그 뒤 성공 기준 3이 이 셋 때문에만 남아 다시 물었다(REQUESTS Q-2) → **'지금 닫기 (추천)'** — 닫는 말에 '근거 코드는 아직 올리지 않은 로컬 커밋 `323329b`에 있다'를 넣어(스크래치 `close-3·7·8.md`) `gh issue close` → "✓ Closed issue …#3·#7·#8". `gh issue list --state all`(#1~#9) → #1~#8 CLOSED, #9 OPEN(Post-MVP 후보 — 남김).

### 7단계. 마감

- [x] 7-1 불일치 K-1~K-9가 각각 어디서 어떻게 0이 됐는지 표로(이 문서 '진행 기록'). 남은 것이 있으면 이유. — 진행 기록 '7-1 불일치 K-1~K-9가 0이 된 곳' 표: K-1·K-2·K-3·K-4·K-5·K-7·K-8·K-9는 grep으로 0(K-1·K-8의 1건씩은 '이전 값'을 설명하는 이력 문장), K-6은 처리표까지 끝났고 실제 닫기는 사용자 허락을 받는 6-2에서 마무리.
- [x] 7-2 새 맥락 읽기 전용 검토자 1명(`verifier` 형, Sonnet·high): 지시서는 스크래치에. 묻는 것 — ① data-foundation 작업자가 STATUS §4·work-graph·quality-gates·ROADMAP만 보고 새 순서대로 시작할 수 있나(짓는 사람 시험) ② 같은 사실이 두 곳에 다르게 적힌 곳 ③ 사용자 결정 U-1~U-7이 장부·설계도와 맞나, 선택지 설명을 사용자 결정으로 적지 않았나 ④ 시험이 새 확인 장치 동작을 다 덮나. 전부 보고·심각도. — 지시서 스크래치 `review-brief.md`, 검토자는 저장소 파일을 고치지 않았다(변이 시험은 저장소 밖 복사본). 결론 ① 조건부 통과 ② 있음 ③ 맞음(경미 1) ④ 다 덮지 못함, 지적 15건(차단·높음 0) — 진행 기록 '7-2·7-3 마감 검토 지적과 처리'.
- [x] 7-3 지적 반영(반영 안 한 것은 이유), `node scripts/verify.mjs --mode full` PASS. — 15건 모두 반영(메인이 하나씩 다시 잼). 일부만 반영한 것과 이유: 7 — AG-HARNESS-001의 옛 시험 수는 날짜가 적힌 이력이라 두고 STATUS 링크만, 14 — 켬+끔은 켬(안전 쪽)으로 두고 문서화, stderr 경고는 보이지 않아 넣지 않음, 15 — worktree에서 어느 훅이 도는지는 미검증으로 적음. 소유 밖이라 남긴 것: `docs/DATA_MODEL.md` §8·`docs/DEPLOY.md` §1·§8·`app/scripts/cf.mjs`의 옛 시점 문장(STATUS §4 3·6번에 표시), SAFETY_POLICY의 구독 경로 문장(모순 아님). 반영 뒤 `node scripts/test-claude-scope-guard.mjs` → "54/54 PASS, 0 FAIL", 변이 → "survived 0/8", `label-check.mjs` → 83개 undefined 0, `check-harness` PASS. **`node scripts/verify.mjs --mode full` → exit 0, 마지막 줄 "PASS: full 검증 완료"**(안에서 가드 54/54·git 가드 25/25·check-harness 시험 37/37·앱 시험 241건, 빌드 `20261014164803-1845e83`). 이 full로 loop-state `last_verified_commit` 1845e83(작업 트리 = 1845e83 + 이 정리)을 확인했다. 검토자의 첫 판정이 '조건부 통과'라 같은 검토자에게 지적 1~5와 새 모순만 다시 보게 했다 → '짓는 사람 시험 통과·지적 5 해소·새 모순 없음', 남은 낮음 1건(F-17 둘째 절의 시험 방법)도 반영(진행 기록 '재검토' 줄). 마지막 편집 뒤 full·가드 시험을 다시 돌린 결과는 7-4.
- [x] 7-4 사용자에게 보고: 결과부터 비유로 다섯 줄 이내, 바뀐 파일 수, 다음 작업(data-foundation '저장 핵심') 한 줄, 커밋은 지시 때. — 마감 정리: CURRENT_TASK 절·표 `done`(커밋 전), loop-state `phase` cleanup-done-awaiting-user-commit·`last_checkpoint`, STATUS §4 1번 '끝'. 최종 `verify --mode full`·`test-claude-scope-guard`·`git status --short`를 다시 돌려 그 결과와 §1 성공 기준 아홉 가지의 충족 여부를 이 세션 마지막 응답에 그대로 보였다(바뀐 파일 수는 `git status --short`로 셈).

## 6. 멈추는 경우 / 멈추지 않는 경우

- **멈추고 질문 창으로 묻는다**: 고치다 보니 사용자 결정(제품 범위·개인정보·삭제·요금)을 새로 정해야 할 때, 두 문서가 서로 다르고 근거로 가릴 수 없을 때, 이슈 닫기 허락. 질문은 모아서 한 번에, 비유와 추천을 붙여.
- **멈추지 않는다**: 문서 하나를 끝냈을 때(짧게 보고만), 검사가 실패했을 때(고친다), 검토자를 기다릴 때, 남은 항목이 있을 때.
- 같은 원인 가설로 두 번 실패하면 가설을 버린다. 일시적 도구 실패는 두 번까지 재시도(AGENTS §5).

## 7. 작업 규칙과 함정(이 저장소·이 PC)

- **줄바꿈**: 문서 대부분이 CRLF다. 기존 파일은 Edit 도구로 고친다. Git Bash의 `sed -i`는 CRLF를 LF로 바꿔 버린다 — 쓰지 않는다. 새 문서는 Write로 쓴 뒤 스크래치의 변환 스크립트로 CRLF로 바꾸고, LF 수 = CRLF 수를 센다.
- **셸과 백틱**: 백틱·작은따옴표가 든 글을 Bash 명령(`node -e "…"`, heredoc) 안에 넣지 않는다. Edit 도구나 스크래치패드의 스크립트 파일로만.
- **결정 번호**: 쓰기 직전에 표 마지막 행으로 확인한다(다른 세션이 같은 날 번호를 쓴 일이 있다). 미리 예고하지 않는다.
- **check-harness**: 선행이 done이 아닌데 후행을 시작 상태로 두면 FAIL, `loop-state.task_id`는 CURRENT_TASK의 `# ` 머리글과 같아야 한다, `completed_nodes` = done 노드.
- **확인 장치를 고치는 동안**: 이 세션이 auto면 장치는 이미 꺼져 있다. 시험은 `node scripts/test-claude-scope-guard.mjs`로 직접 돌린다. 훅 종료 코드가 0이 아니면 훅이 죽은 것이다(죽은 훅은 통과로 보인다).
- **건드리지 않는다**: `app/`·`web/`·`design/`·`data/`, 개발용 건물(원격 명령 금지), `.playwright-cli/`·`output/playwright/`, `npm install`(이 PC의 npm 10.9가 잠금 파일의 libc 줄을 지운다).
- **'확인됨'**에는 어디서(명령·파일) 확인했는지를 같이 적는다. 사용자가 직접 고른 것만 사용자 결정이다.
- **사용자에게**: 개발 용어 없이 비유로, 결과부터.

## 8. 모델과 추론도(권장 — 사용자가 새 세션을 열 때 앱에서 고른다)

| 자리 | model | effort | 이유 |
| --- | --- | --- | --- |
| 메인 | Opus 5.5 | high 이상 | 설계도 여러 개를 한 모양으로 맞추는 정합성 판단 |
| 마감 검토자(7-2) | `sonnet` | `high` | 지시서가 묻는 것이 정해져 있고 메인이 지적을 다시 잰다 |

## 9. 소유 파일(CURRENT_TASK TASK-CLEANUP-01 절과 같다)

`tasks/cleanup/2026-10-15/**`, `tasks/CURRENT_TASK.md`, `tasks/archive/**`, `tasks/TASK-MOBILE.md`, `docs/DECISIONS.md`, `docs/STATUS.md`, `docs/ROADMAP.md`, `docs/EVAL_PLAN.md`, `docs/TRACEABILITY.md`, `docs/RISK_REGISTER.md`, `docs/ARCHITECTURE.md`, `docs/AI_RAG_SPEC.md`, `docs/AGENT_WORKFLOW.md`, `docs/PROCESS_LOG.md`, `PRD.md`, `README.md`, `AGENTS.md`, `harness/work-graph.yaml`, `harness/quality-gates.yaml`, `harness/loop-state.json`, `harness/runtime-profile.json`, `harness/README.md`, `scripts/claude-scope-guard.mjs`, `scripts/test-claude-scope-guard.mjs`

## 진행 기록

- 2026-10-15 계획 세움(TASK-REVIEW-01을 마친 세션): 사용자 결정 U-1~U-7(REQUESTS), 이 계획, CURRENT_TASK에 TASK-CLEANUP-01 절. 같은 세션이 커밋 `323329b`·`1845e83`을 만들었고 푸시·PR은 자동 모드 안전 장치에 막혀 사용자 몫. 실행은 새 세션.
- 2026-10-15 실행 세션(Opus 5.5, auto 모드, 브랜치 `docs/cleanup`) 착수 — 0단계 끝. 줄바꿈 시작 값은 스크래치 `eol-before.txt`: 소유 파일 23개 가운데 `docs/AI_RAG_SPEC.md`만 LF, `docs/AGENT_WORKFLOW.md`는 원래부터 섞임(LF 228·CRLF 175), 나머지 CRLF(`harness/loop-state.json`·`runtime-profile.json`도 CRLF).

### 1-1 변경 지도 대조(2026-10-15, 지금 파일을 읽고 적음)

| # | 파일 | 지금(줄은 2026-10-15 기준) | 고칠 곳 |
| --- | --- | --- | --- |
| M-1 | `docs/DECISIONS.md` | 표 마지막 행 D-115(136줄), D-116 이후 번호 참조 0건(`grep -rl D-116` → 없음) | D-115 뒤에 U-2~U-7 새 행. 상태 칸 한 줄: D-008(18줄 — 근거 분석의 검색 방식, provisional), D-018(28), D-019(29 — 크레딧 해석), D-029(39), D-032(42 — AI 부분), D-042(63), D-093(114 — 별도 동의 시점), D-094(115 — 임상 검토 시점), D-108(129 — ② Android), D-110(131 — 대체 경로의 조건) |
| M-2 | `harness/work-graph.yaml` | 노드 16개. app-scaffold 주석에 '앱 시험 238건'·'원격 검사 34/34'(94~95줄, K-1·K-7), data-foundation 주석에 '시작 전 사용자 결정 남음: Android'(114줄, K-8) | §4.1: 새 노드 3개, data-foundation 범위, 뜻 바꿈(limited-mvp-release), AI·RAG 주석, edges |
| M-3 | `harness/quality-gates.yaml` | node_gates 15개. data-integrity에 F-14·F-15, core-product에 `mobile-core-flow`(Android 포함), release.mobile-real-device 주석에 Android(62줄), browser-e2e `command: null` | 새 관문 셋, data-integrity·core-product·limited-release 고침, 주석 |
| M-4 | `docs/EVAL_PLAN.md` | §14 라벨(327~364줄), `mobile-core-flow`(346줄)가 Android 요구(K-8), §13 제한 MVP 문단(325줄), §4 S 표(51~65줄), §6 모바일 첫 줄(130줄)·T-01~T-07(140~147줄) | §14 새 라벨, §4·§6 본인/공개 표시, §13 문단 |
| M-5 | `docs/TRACEABILITY.md` | PR 행의 노드 칸(16~30줄), PR-002 증거 칸에 시험 수·34/34(숫자 사본), §3 '유료 API 호출 없음(D-019)'(46줄) | 새 노드 연결, 고친 행은 짧게, §3 한 줄 |
| M-6 | `docs/ROADMAP.md` | Phase 0 G2c 낡은 '남은 검증'(15줄, K-5), Phase 1 '앱 scaffold와 CI'(26줄, K-7), Phase 2 'backdating'(42줄, K-4), 제한 MVP 절(71~81줄), Phase 3·5 선행 조건 | 단계 순서를 §4.1로 |
| M-7 | `docs/STATUS.md` | §1 표 '앱 238건'(11줄, K-1), §2 AI 경로·순서(22~23줄), §3 끝 실기기 줄(53줄), §4 다음 할 일(56~70줄), §6 CI | 숫자의 한 곳, 새 순서 |
| M-8 | `PRD.md` | §2 MVP 성공 상태(17줄), §4 AI 문장(50줄)·미검증 목록(59줄, K-3), §10 분석 순서(182~190줄), §13 끝 문단(226줄) | U-3·U-6·U-7 |
| M-9 | `docs/ARCHITECTURE.md` | §1 사용자 결정 문단(7줄 'AI는 본인 PC'), §2 그림(PC worker), §4.4(115~121줄), §4.6(129~135줄), §10 B-06 두 행 | 짓게 되면 서버 직통, PC는 대체 경로 |
| M-10 | `docs/AI_RAG_SPEC.md`(LF) | §1 셋째 문단('확정 경로는 본인 PC'), §4 '유료 API는 사용하지 않는다' 줄, §6.2·§7.1 Vector Store 전제 | U-6·U-7 |
| M-11 | `docs/RISK_REGISTER.md` | 마지막 RK-039. 재평가 대상 RK-001(12줄)·005·009·011(22줄)·016·017·018(27~29줄)·034(45줄)·035(46줄) | 새 위험 RK-040~, 재평가 |
| M-12 | `harness/runtime-profile.json` | `hosting.account_or_project_exists` 끝 문장 'the Worker and D1 remain in the account'(K-2), `phone_access_confirmed`·`unknowns[1]`의 'keyboard vs bottom bar' 미검증(K-3), `model_access`, `last_synced`는 T2 | K-2·K-3, U-1·U-6 한 줄 |
| M-13 | `harness/loop-state.json` | `last_checkpoint` 약 6천 자에 '238 app tests'(K-1), `blockers` 7개(Android 결정 대기 등 — U-3로 풀림) | 한 줄 + 링크 |
| M-14 | `harness/README.md` | 5번 항목(loop-state 갱신) | '가리키는 곳' 한 문장 |
| M-15 | `README.md` | '어떻게 만들어지나요' 그림(PC worker — 지도에 없던 곳), '지금 어디쯤' 표(STATUS §1 사본), 저장소 지도 | U-4·U-6 |
| M-16 | `AGENTS.md` | §2.2(auto에서 꺼짐·선언 요구), §4 | A-4, '사실 한 곳', 결정 행 형식 |
| M-17 | `docs/AGENT_WORKFLOW.md`(섞임) | §10.2 2번 '파일 나누기' | 동시 작업 줄 켜기·끄기 |
| M-18 | `scripts/claude-scope-guard.mjs`·`test-claude-scope-guard.mjs` | auto 통과(159줄) 뒤 바로 소유 파일 확인, 시험 30건 | A-4 |
| M-19 | `docs/PROCESS_LOG.md` | 마지막 §7(2026-09-25) | §8 새 절 |
| M-20 | `tasks/CURRENT_TASK.md`, `tasks/archive/**` | 끝난 절 셋(T3·REVIEW-01·HOOK-AUTO), 표 | archive |
| M-21 | `tasks/TASK-MOBILE.md` | 머리 상태 'T3 계획됨'(5줄) | 한 줄 |
| 지도 밖 | `docs/DEPLOY.md` §1 표(18줄)·§8(63줄) '제한 MVP 출시 전', `BOOTSTRAP.md` 25줄(D-032 옛 구성) | **소유 파일 밖이라 고치지 않는다** — 운영 건물은 새 순서에서 personal-start 때 만든다. personal-start 노드 설명과 STATUS §4에 'DEPLOY §1·§8을 그때 고친다'로 넘긴다. BOOTSTRAP은 처음 감사 절차(이력)라 그대로 |

### 1-2 사실표(새로 쓸 값은 여기서 옮긴다)

| # | 값 | 확인(명령 → 결과) |
| --- | --- | --- |
| F-1 | 앱 시험 241건(22파일) | `npx vitest run` → "Test Files 22 passed (22) / Tests 241 passed (241)"(2026-10-15 00:49). 238은 T3 검토 반영 전 값 |
| F-2 | 개발용 건물 원격 검사 34/34 | T3 기록(`tasks/mobile/2026-10-14-t3/PLAN.md` 5단계·7-4, 마지막 빌드 `20261014105614-7b99e2c`). 원격 명령 금지라 다시 재지 않았다 |
| F-3 | 가드 시험: 소유 파일 30/30, git 25/25 | `node scripts/test-claude-scope-guard.mjs` → "30/30 PASS, 0 FAIL", `node scripts/test-claude-git-guard.mjs` → "25/25 PASS, 0 FAIL" |
| F-4 | 결정 장부 마지막 D-115 | `grep -o "D-1[0-9][0-9]" docs/DECISIONS.md \| sort -u \| tail` → D-115, `grep -n "^\| D-115 "` → 136줄 |
| F-5 | 위험 기록 마지막 RK-039 | `docs/RISK_REGISTER.md` 50줄 |
| F-6 | 노드 16개 | bootstrap-audit·hosting-identity-spike·data-store-spike·model-access-spike·vector-search-spike·app-scaffold·data-foundation·taxonomy-v1·taxonomy-v2-research·direct-journal·dashboard-reminder·limited-mvp-release·ai-journal·evidence-pipeline·rag-analysis·release-candidate(`harness/work-graph.yaml`) |
| F-7 | 관문 15개 | bootstrap-facts·security-foundation·data-contract·model-access·retrieval-contract·code-quality·data-integrity·source-fidelity·taxonomy-evidence·core-product·journal-ai·reflection-core·evidence-quality·ai-safety·limited-release·release(`harness/quality-gates.yaml` node_gates) |
| F-8 | 이슈 #1~#9 OPEN(2026-09-03 생성) | `gh issue list --state open` → 9건, 전부 `[TASK-MOBILE]` |
| F-9 | `verify` 검사 규칙 | 노드의 `gate:`는 quality-gates `node_gates`에 있어야 하고(`scripts/verify.mjs` 129줄), TRACEABILITY PR 행의 마지막 칸은 실재 노드 id여야 한다(152줄). check-harness: 선행이 done이 아니면 후행 시작 상태 금지, `completed_nodes` = done 노드, `task_id` = CURRENT_TASK 머리글 |

### 6-2 이슈 #1~#9 처리표(2026-10-15)

근거 위치는 `git show origin/main:<파일>`로 가렸다(origin/main = `7b99e2c`, PR #36). T3 뼈대(`323329b`)와 감리·이 정리는 아직 푸시 전이라 GitHub에서 보이지 않는다.

| # | 제목(요지) | 판정 | 근거가 있는 곳 | 닫는 말(요지) |
| --- | --- | --- | --- | --- |
| 1 | 모바일 방식 결정 기록(D-038) | 닫음 — 지금 | 결정은 D-111(origin/main에 있음), 정본 고쳐 쓰기는 T2(PR #36). 'Cloudflare Pages'는 교정 문맥만(ARCHITECTURE 9·54줄) | 결정은 D-038이 아니라 D-111(2026-10-14)로 기록했고 T2(PR #36)에서 정본을 그 구성으로 고쳐 썼습니다 |
| 2 | B-08 실기기 스파이크(S-01~S-12) | 닫음 — 지금 | B-08 pass(TASK-SPIKE-02, PR #35), S 표는 EVAL §4(origin/main에 있음) | 판정은 iPhone으로 pass. 항목별 결과의 정본은 EVAL_PLAN §4이고 미검증 항목은 새 공정표의 관문(first-slice·personal-start·공개)이 추적합니다(D-117·D-118) |
| 3 | Mac 없는 디버깅 수단 | 닫음 — 2026-10-15(Q-2, 처음 판정은 '뼈대 푸시 뒤') | 상태 칸·일곱 칸 오류 보고·F-27 시험은 T3(로컬 `323329b`, origin/main에 ARCHITECTURE §11.5 없음) | 개발용 건물 전용 상태 칸과 오류 보고(입력 문자열 0건 시험, F-27)가 T3에 들어갔습니다. Playwright WebKit 회귀 검사는 first-slice의 E2E 도구 결정에서 함께 정합니다 |
| 4 | 세션·재인증·화면 이동 UX 명세 | 닫음 — 지금 | UX_SPEC §15~§17·ARCHITECTURE §6(T2, origin/main), G-01~G-19 반영표 `tasks/mobile/2026-10-14/PLAN.md` 119줄 | T2에서 명세가 들어갔고 G 반영표가 있습니다 |
| 5 | standalone 개인정보 규칙 셋 | 닫음 — 지금 | UX_SPEC의 떠날 때 가림·클립보드 금지·알림 글 금지(origin/main에 셋 다), TRACEABILITY PR-014 연결. '잠금과 상관없이 가림'(D-113 ①)은 로컬 커밋 | 세 규칙이 UX_SPEC에 있고 PR-014에 연결됐습니다. 실기기 확인(T-03)은 first-slice·personal-start의 휴대폰 확인이 봅니다 |
| 6 | 검증 게이트 정리(S-ID·VoiceOver) | 닫음 — 지금 | EVAL §4 S 표·§6 VoiceOver(T2, origin/main) | S·T 결과는 2026-10-15부터 EVAL §4·§6 한 곳에만 두고 다른 문서는 가리킵니다(D-118) |
| 7 | 개발/운영 분리와 새 버전 감지 | 닫음 — 2026-10-15(Q-2, 처음 판정은 '뼈대 푸시 뒤') | env.dev·env.prod(D-115 ②)·F-26 시험은 T3(로컬). 완료 기준의 '실기기에서 띠 확인'(T-05)은 하지 않았다 | 분리와 새 버전 띠는 T3에 들어갔고, 실기기 확인 T-05는 공개 관문(mobile-real-device)이 추적합니다 |
| 8 | Phase 1 뼈대 모바일 명세 | 닫음 — 2026-10-15(Q-2, 처음 판정은 '뼈대 푸시 뒤') | app-scaffold done(T3, 로컬). 완료 기준의 'S-07 재통과'는 '가린다'로 나왔다 | 뼈대는 T3에서 끝났습니다. S-07은 first-slice에서 버튼 배치를 정하고 mobile-slice 관문이 다시 봅니다 |
| 9 | Web Push 스파이크(Post-MVP) | 남김 | ROADMAP Post-MVP·Phase 4('Web Push는 별도 스파이크 통과 시에만'), RK-004 | — |

### 7-1 불일치 K-1~K-9가 0이 된 곳(2026-10-15)

확인 명령의 대상 F = `PRD.md README.md AGENTS.md docs/STATUS.md docs/ROADMAP.md docs/EVAL_PLAN.md docs/TRACEABILITY.md docs/ARCHITECTURE.md docs/AI_RAG_SPEC.md docs/RISK_REGISTER.md harness tasks/CURRENT_TASK.md`.

| K | 무엇(감리 사실표 §K) | 어디서 어떻게 0이 됐나 | 확인(명령 → 결과) |
| --- | --- | --- | --- |
| K-1 | 앱 시험 수 238/241 | 숫자는 `docs/STATUS.md` §1 숫자 표 한 곳(241건, 2026-10-15 `npx vitest run`) — work-graph app-scaffold 주석(3-1), loop-state `last_checkpoint`(4-6), STATUS §1 단계 표(4-2), TRACEABILITY PR-002(3-4)에서 숫자 사본을 지웠다. T3 절은 archive로 원문 그대로 옮기고 머리말에 '238은 검토 반영 전 값'(6-1) | `grep -rn "238건\|238 app\|앱 238" F` → 1건, STATUS 숫자 표의 '238건은 그 시점 값' 설명 문장뿐 |
| K-2 | 스파이크 자원 '지웠다'와 '남아 있다' | runtime-profile `hosting.account_or_project_exists` 끝 문장을 '같은 날 지웠다'로(4-6) | `grep -rn "remain in the account" F` → 0 |
| K-3 | 자판(S-07) 미검증 vs '가린다' | PRD §4 미검증 목록(4-3)·runtime-profile `phone_access_confirmed`·`unknowns[1]`(4-6)을 EVAL §4·§6 링크 + 'S-07 가린다'로, STATUS §3 끝 문단도 링크로(4-2) | `grep -rn "keyboard vs bottom bar\|자판이 아래 버튼을 가리는지" F` → 0 |
| K-4 | ROADMAP Phase 2 'backdating' | Phase 2를 '쓰면서 시안 이식'으로 다시 쓰며 '그날만 새로 쓰기(D-082가 소급 작성 허용을 대체)'(4-1) | `grep -c backdating docs/ROADMAP.md` → 0 |
| K-5 | ROADMAP G2c 낡은 '남은 검증' | G2c를 'STATUS §3 B-06 링크 + 보류 2건 + D-120'으로(4-1) | `grep -c "남은 검증: PC worker" docs/ROADMAP.md` → 0 |
| K-6 | 이슈 #1~#9 열림 | 처리표(진행 기록 6-2). 사용자 답 Q-1 '5개만 지금 닫기'로 #1·#2·#4·#5·#6, Q-2 '지금 닫기'로 #3·#7·#8을 닫는 말과 함께 닫았다(2026-10-15). #9는 반영된 내용이 없는 Post-MVP 후보라 열어 두는 것이 맞다 — '반영됐는데 열린' 이슈 0 | `gh issue list --state all`(#1~#9) → #1~#8 CLOSED, #9 OPEN |
| K-7 | 'CI' 없이 app-scaffold done | ROADMAP 앱 뼈대 문단 'CI가 앱 코드를 처음 도는 것은 푸시할 때'(4-1), work-graph 주석(3-1), STATUS 숫자 표 'CI가 앱 코드를 돈 횟수 0'(4-2), 관문 `data-integrity`에 `ci-green`(3-2, A-7) — 사실을 바로 적고 다음 관문이 첫 초록을 확인한다 | `grep -c "앱 scaffold와 CI" docs/ROADMAP.md` → 0, `grep -c ci-green harness/quality-gates.yaml` → 2 |
| K-8 | 갖고 있지 않은 Android를 요구하는 관문 | U-3(D-117): `core-product`의 `mobile-core-flow` → `mobile-core-flow-personal`(iPhone), Android는 `public-only`(3-2·3-3). loop-state blocker와 work-graph data-foundation 주석의 'Android 결정 대기' 삭제(3-1·4-6) | `grep -rnE "mobile-core-flow([^-]\|$)" F` → 1건, EVAL §14의 '2026-10-15 전에는 …' 이력 문장뿐. personal-start 관문의 Android 0 |
| K-9 | 24일째 '다른 세션 확인 대기'인 TASK-HOOK-AUTO | `tasks/archive/TASK-HOOK-AUTO.md`로 옮기고 머리말에 'D-119로 뜻을 잃어 닫는다'(6-1) | `grep -c "^# TASK-HOOK-AUTO" tasks/CURRENT_TASK.md` → 0 |

### 7-2·7-3 마감 검토 지적과 처리(2026-10-15)

검토자: 새 맥락 `verifier`(Sonnet·high), 지시서 스크래치 `review-brief.md`. 결론: ① 짓는 사람 시험 **조건부 통과** ② 두 곳에 다른 사실 있음 ③ 사용자 결정 맞음(경미 1건) ④ 시험이 새 동작을 다 덮지 못함. 지적 15건(중간 6·낮음~중간 1·낮음 8, 차단·높음 0). 메인이 주장마다 파일·명령으로 다시 쟀다(재측정 칸).

| # | 심각도 | 지적 요지 | 재측정 | 처리 |
| --- | --- | --- | --- | --- |
| 1 | 중간 | data-foundation이 하루 기준 시각(`day_start_hour`)을 어떻게 다루는지 없음, F-17은 personal-start 뒤 관문에만 | 맞음 — `grep day_start_hour app/migrations` 0건, DATA_MODEL §2·§3.4는 그 값으로 entry_date 계산 | 반영: work-graph data-foundation '여기서 정한다'에 하루 기준 시각, F-17을 `data-integrity`·`personal-start`에 더함(quality-gates·EVAL §14), ROADMAP 1a·STATUS §4 3번 |
| 2 | 중간 | personal-start가 요구하는 `#/help` 화면을 짓는 노드 없음 | 맞음 — `ls app/client/src/views/` → auth·lockSettings·name·pinSetup·today·welcome | 반영: personal-start 주석·owns에 `#/help` 화면과 진입점 결정, ROADMAP·STATUS §4 6번 |
| 3 | 중간 | 백업·재수입이 data-foundation 몫이라는 옛 문장(work-graph 59줄, DATA_MODEL·DEPLOY는 소유 밖) | 맞음 | 반영: work-graph 59줄을 data-control로. 소유 밖 둘은 STATUS §4 3번에 '남은 문장' 표시 |
| 4 | 낮음~중간 | 푸시가 시작 전 조건인지 끝 조건인지 문서마다 다름 | 맞음 — CURRENT_TASK '시작 전' vs STATUS '지시 때' | 반영: 둘 다 '언제는 사용자가 정함(감리 추천은 다음 짓기 전 — Q-E 미결정), 늦어도 data-integrity가 끝나기 전(ci-green)'으로. 사용자가 정하지 않은 Q-E를 결정으로 적지 않았다 |
| 5 | 중간 | ARCHITECTURE §4.2가 D-120과 정면으로 어긋남 | 맞음 — 109~110줄 '구독 기반 경로'·'서버는 모델을 직접 호출하지 않고' | 반영: 두 줄에 D-120(기본 서버 직통, ai_jobs + PC는 대체 경로) — 4-4에서 §3만 고치고 §4.2를 놓친 메인 실수 |
| 6 | 낮음 | STATUS §2 '292건', TRACEABILITY '331건' — 표 밖 숫자 | 맞음 — `node scripts/check-contrast.mjs` → 349건 | 반영: STATUS 숫자 표에 349건(2026-10-15), STATUS §2·TRACEABILITY PR-010·변경 영향 행은 링크로, UI-MOOD-001은 '2026-09-22 측정' 이력으로 두고 링크 |
| 7 | 낮음 | TRACEABILITY AG-HARNESS-001의 옛 시험 수, runtime-profile의 34/34 | 맞음 | 반영: runtime-profile → STATUS 링크. AG-HARNESS-001은 날짜가 적힌 이력 문장이라 두고 '지금 수는 STATUS §1'이 이미 붙어 있다 |
| 8 | 낮음 | ROADMAP 1b '자판 위 버튼'이 배치를 못박은 것처럼 읽힘 | 맞음 | 반영: '정한 배치에서 자판과 아래 버튼' |
| 9 | 낮음 | `deployment-boundary-review` 정의가 세 라벨 묶음 행에 섞여 모호 | 맞음 | 반영: EVAL §14에 따로 한 행(증거 ①~④, 공개 때 §12 항목 7 추가) |
| 10 | 낮음 | D-115 ②의 '운영은 출시 전'에 교정 줄 없음 | 맞음 | 반영: D-115 상태 칸 한 줄. DEPLOY·`app/scripts/cf.mjs` 문구는 소유 밖 — personal-start에서 |
| 11 | 낮음 | ARCHITECTURE §11.9 'Phase 2(data-foundation…)', SAFETY_POLICY는 소유 밖 | 맞음 | 반영: 'Phase 1a~Phase 2(data-foundation·first-slice와 직접 작성 흐름)'. SAFETY_POLICY는 모순이 아니고 소유 밖이라 AI를 지을 때 |
| 12 | 낮음 | D-119 굵은 글에 선택지 설명 구절('차례로 일할 때는 끈다') | 맞음 — REQUESTS U-5의 '선택지 설명' 칸 | 반영: 굵은 글을 '동시에 쓸 때만 켠다'까지로, 나머지는 세부(에이전트) |
| 13 | 중간 | 시험의 '켬' fixture가 괄호 메모 한 형태뿐 — 맨 '켬'을 깨는 변이도 살아남음 | 맞음 | 반영: 형식 변형 fixture 14개와 케이스 14건(맨·들여쓰기·`*`·전각 콜론·꼬리 공백·줄표·쉼표·굵은 글·번호·CRLF·켬+끔 → 켜짐, 코드 울타리·인용 → 꺼짐). 스크래치 `mutate-guard.mjs`로 변이 8개 → **"survived 0/8"** |
| 14 | 낮음 | 굵은 글·번호 목록·쉼표 메모는 조용히 꺼짐, 코드 울타리 예시는 켜짐, 켬+끔은 켬 | 맞음 | 반영: 정규식이 굵은 글·번호 목록·`+`·쉼표·마침표 메모를 받고 코드 울타리 안은 무시. 켬+끔은 켬(안전 쪽)으로 두고 '끄려면 줄을 지운다'를 훅 주석·AGENTS §2.2·AGENT_WORKFLOW §10.2에 적음. stderr 경고는 하지 않았다 — PreToolUse 훅이 exit 0일 때 stderr는 보통 화면에 보이지 않아 신호 구실을 못 한다(판단) |
| 15 | 낮음 | worktree 격리에서 '동시 작업' 줄을 어떻게 넣는지 없음(검토자 미검증) | 절차 문장 없음은 맞음, 훅이 어느 CURRENT_TASK를 읽는지는 메인도 미검증 | 반영: AGENT_WORKFLOW §10.2에 '줄과 선언이 분기 기준(커밋)에 있어야 한다, 어느 쪽 훅을 쓰는지는 미검증 — 처음 쓸 때 확인' |

**재검토(같은 검토자, 지적 1~5와 새 모순만)**: ① 짓는 사람 시험 **통과** ② 지적 5 해소 ③ 이번 반영이 만든 새 모순 없음. 남은 낮음 1건 — 설정 표와 바꾸는 화면을 미루면 F-17의 '바꿔도 저장된 날짜 그대로' 절을 어떻게 보나 → 반영: work-graph data-foundation 주석에 '데이터베이스 수준 시험으로 본다' 한 문장.

메인 실수 기록: 6-1 도중 Write 도구로 엉뚱한 경로(`C:\NOHTAE~1\placeholder.txt`, 저장소·스크래치 밖)에 한 글자짜리 파일을 만들었다 — 같은 분에 생긴 빈 폴더와 함께 바로 지웠고(`ls` → 없음) 다른 파일에는 닿지 않았다.

### 마감 점검 — §1 성공 기준과 §6 멈추는 경우(2026-10-15)

| 기준 | 판정 | 근거 |
| --- | --- | --- |
| 1 결정 장부 | 충족 | 2-1·2-2 줄. 새 행 약 800~1,000자로 '600자 안팎'보다 조금 길다(3,000자 넘는 행 0) |
| 2 같은 순서·관문 이름 | 충족 | 3-1~3-4·4-1·4-2 줄, `check-harness` PASS, `label-check.mjs` 83개 정의 |
| 3 사실 한 곳·K-1~K-9 0·AGENTS §4 | 충족 | 9건 모두 0(7-1 표), AGENTS §4 74줄에 규칙. 한때 '미충족(일부)'였다 — #3·#7·#8이 열려 있었고, 사용자 답 Q-2 '지금 닫기'로 닫아 K-6도 0(#9는 반영 내용 없는 Post-MVP 후보) |
| 4 AI·근거 분석 | 충족 | 4-3·4-4·4-6 줄 |
| 5 위험 | 충족 | 4-5 줄 |
| 6 확인 장치 | 충족 | 5-1 줄과 7-3 줄: 54/54, 변이 8개 모두 잡음, AGENTS §2.2·AGENT_WORKFLOW §10.2 |
| 7 CURRENT_TASK·archive | 충족 | 6-1 줄 |
| 8 새 맥락 검토 통과·반영·full | 충족 | 검토자 보고 원문 결론 줄 — 첫 보고 "**짓는 사람 시험: 조건부 통과.**", 반영 뒤 재검토 "**① 짓는 사람 시험: 통과.**", "**② 지적 5: 해소됐다.**", "**③ 이번 반영이 새로 만든 모순: 없다.**". 처리표 15행, full PASS |
| 9 이슈 처리 목록·허락 뒤에만 닫기 | 충족 | 6-2 줄과 처리표, REQUESTS Q-1 |

§6 멈추는 경우 점검: ① 사용자 결정(제품 범위·개인정보·삭제·요금)을 새로 정해야 했던 일 — 0건. 실행 중 더한 것(A-7 `ci-green`, F-17을 저장 핵심 관문으로, `#/help`를 personal-start에서 짓기)은 U-2·U-3 안의 관문·순서 세부라 에이전트 결정으로 적었고, 사용자가 정하지 않은 감리 Q-E(푸시 시점)는 결정으로 적지 않았다. ② 두 문서가 서로 다르고 근거로 가릴 수 없던 일 — 0건(어긋남은 모두 사용자 결정 U-1~U-7로 가렸고, 소유 밖 문서의 옛 문장은 고치지 않고 STATUS §4에 표시). ③ 이슈 닫기 허락 — 2건, 둘 다 질문 창으로 물어 답을 받은 뒤 닫았다(REQUESTS Q-1·Q-2). 답을 기다리는 질문 0건. 턴 수는 30을 넘지 않았다.
