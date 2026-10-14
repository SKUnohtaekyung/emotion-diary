# 현재 작업

이 파일에는 **진행 중이거나 곧 시작할 작업만** 둔다. 끝났거나 보류된 작업의 절은 [archive/](archive/README.md)로 옮긴다 — 이 파일이 한 번에 읽히는 크기여야 하고, `scripts/claude-scope-guard.mjs`가 이 파일의 `- 소유 파일:` 선언을 전부 합쳐 허용 목록으로 쓰기 때문이다(끝난 작업의 선언이 남아 있으면 그만큼 가드가 헐거워진다). 그 확인은 이 파일에 `- 동시 작업: 켬` 줄이 있을 때만 켜진다(D-119 — 여러 작업자를 같은 시간에 띄울 때 더하고 끝나면 지운다, AGENTS §2.2). 작업의 진행·증거는 그 작업의 PLAN에만 적고 여기에는 상태 한 줄과 링크만 둔다(D-118). `harness/loop-state.json`의 `task_id`는 아래 절 가운데 진행 중인 것의 머리글과 같아야 한다(`scripts/check-harness.mjs`가 quick에서 확인).

| 작업 | 상태 | 어디에 |
| --- | --- | --- |
| TASK-CLEANUP-01 설계도 정리(감리 결정을 공정표·관문·결정 장부에) | **끝(2026-10-15, 브랜치 `docs/cleanup`, 커밋 전 — 커밋은 사용자 지시 때)**. 코드·서버·화면은 바꾸지 않는다(소유 파일 확인 장치만 예외) | 이 파일 아래, 요청·계획은 [cleanup/2026-10-15/](cleanup/2026-10-15/PLAN.md) |
| 다음: data-foundation(저장 핵심) | 예고 — TASK-CLEANUP-01 뒤 사용자 지시 때 새 세션 | 이 파일 아래 '다음 작업 예고' |
| [TASK-REVIEW-01](archive/TASK-REVIEW-01.md) 종합 점검(현황·남은 작업·작업 방식·기술 스택) | 끝(2026-10-15, 로컬 커밋 `1845e83`) | [archive/](archive/README.md), 보고서 [review/2026-10-14/REPORT.md](review/2026-10-14/REPORT.md) |
| [TASK-MOBILE](TASK-MOBILE.md) 설치형 홈 화면 웹앱 | T2 끝(2026-10-14, PR #36 병합 `7b99e2c`) / T3 끝(2026-10-14, 로컬 커밋 `323329b` — 푸시·PR은 사용자 몫). 결정 D-111~D-115. 이슈 #1~#9의 처리는 [cleanup/2026-10-15/PLAN.md](cleanup/2026-10-15/PLAN.md) 6-2 | T3 기록 [archive/TASK-MOBILE-T3.md](archive/TASK-MOBILE-T3.md)와 [mobile/2026-10-14-t3/](mobile/2026-10-14-t3/PLAN.md), T2 기록 [archive/TASK-MOBILE-T2.md](archive/TASK-MOBILE-T2.md)와 [mobile/2026-10-14/](mobile/2026-10-14/PLAN.md), 배경은 별도 파일 |
| [TASK-HOOK-AUTO](archive/TASK-HOOK-AUTO.md) auto 모드에서 가드 훅 확인창 없애기 | 끝 — 구현·검증 2026-09-21(D-060), 남은 '다른 세션 확인 대기'는 2026-10-15 D-119로 닫음 | [archive/](archive/README.md) |
| [TASK-WEB-UI-01](archive/TASK-WEB-UI-01.md) 브라우저 우선 UI 프로토타입 | 구현·PC 검수 완료(2026-09-20). PR #30 병합(2026-09-26, `5fa94a4` — QA #51~#54·D-096까지 함께) | [archive/](archive/README.md) |
| [TASK-WEB-UI-02](archive/TASK-WEB-UI-02.md) 사용자 QA와 디자인 수정 | **완료(2026-10-13)** — 사용자가 시안을 처음부터 써 보고 달력 포함 전체 화면을 승인했다. QA #1~#60, D-048~D-107. 마지막 묶음(#60: 요청 14건·UX 라이팅 원칙·앱 잠금 비밀번호·용어표)은 main `25e0226`·`adad018`. 남은 일은 `docs/STATUS.md` §4 | [archive/](archive/README.md), 2026-10-13 요청·계획은 [qa/2026-10-13/](qa/2026-10-13/PLAN.md) |
| [TASK-SPIKE-02](archive/TASK-SPIKE-02.md) 스파이크 잔여 판정(Phase 1 선행) | **완료(2026-10-14)** — B-02·B-03·B-04·B-05·B-08 pass, B-06 보류 2건, B-07 범위 밖. main `535e714`(PR #35). 남은 일은 `docs/STATUS.md` §3·§4 | [archive/](archive/README.md), 요청·계획·근거는 [spike/2026-10-13/](spike/2026-10-13/PLAN.md) |
| [TASK-DS-REF](TASK-DS-REF.md) 기본 부품 명세를 빠짐없이(D-039·D-097~D-100) | 완료(2026-09-26) — PR #31 병합(`838a0ef`), 이슈 #10~#14 닫음. 남은 일은 `docs/STATUS.md` §4-2로 옮겼다 | 별도 파일(여러 문서가 경로로 인용해 옮기지 않았다). 이 파일의 절(소유 파일 선언)은 뺐다 |
| [TASK-TAXONOMY](TASK-TAXONOMY.md) · [V1](TASK-TAXONOMY-V1.md) · [PLAN-V2](TASK-TAXONOMY-PLAN-V2.md) | 완료(2026-09-05, D-038·D-040 accepted) | 별도 파일(다른 문서가 경로로 인용해 옮기지 않았다) |
| TASK-INFRA-01 · ISSUE-26 · ISSUE-27 · CBM · DESIGN · BOOTSTRAP | 완료·보류 기록 | [archive/](archive/README.md) |

# TASK-CLEANUP-01 — 설계도 정리: 감리 결정을 공정표·관문·결정 장부에 옮긴다

## 상태

`done`(2026-10-15, 브랜치 `docs/cleanup`, 커밋 전 — 커밋은 사용자 지시 때. 사용자 확인 뒤 이 절을 `tasks/archive/`로 옮긴다) — 2026-10-15 사용자 지시("1번하고 2번을 작업할 요청 프롬프트 작성해줘", 설명 뒤 "ㄱㄱ 그렇게 하자."). 계획은 TASK-REVIEW-01을 마친 세션이 세웠고 **실행은 새 세션이 한다.** 요청 원문과 사용자 결정 U-1~U-7은 [cleanup/2026-10-15/REQUESTS.md](cleanup/2026-10-15/REQUESTS.md), 단계·변경 지도·함정은 [cleanup/2026-10-15/PLAN.md](cleanup/2026-10-15/PLAN.md) — **PLAN이 이 작업의 유일한 진행 기록이다.** 새 세션은 PLAN §0부터 읽는다.

## 목표

사용자 결정(순서는 '오늘 한 편' 먼저, 관문은 본인 사용 시작과 공개 둘로, 사실은 한 곳에, 소유 파일 확인은 동시 작업 때만, AI 쓰기·근거 분석은 써 본 뒤 결정)을 설계도·공정표·관문·결정 장부에 옮겨, 다음 짓기 작업(data-foundation '저장 핵심')이 새 순서로 바로 시작하게 한다.

## 범위

- 포함: PLAN §4.2의 문서·하네스 파일, 소유 파일 확인 장치 스크립트와 시험, CURRENT_TASK 정리와 archive, 이슈 #1~#9 처리 목록(닫기는 사용자 허락 뒤).
- 제외: `app/`·`web/`·`design/`·`data/`, 서버·원격 명령, 커밋·푸시·PR(사용자 지시 때), 옛 결정 행 고쳐 쓰기.

## 소유권

- Main/Writer: 새 세션. 하위 에이전트는 마감 검토자(읽기 전용) 1명뿐이고 커밋하지 않는다.
- 소유 파일: `tasks/cleanup/2026-10-15/**`, `tasks/CURRENT_TASK.md`, `tasks/archive/**`, `tasks/TASK-MOBILE.md`, `docs/DECISIONS.md`, `docs/STATUS.md`, `docs/ROADMAP.md`, `docs/EVAL_PLAN.md`, `docs/TRACEABILITY.md`, `docs/RISK_REGISTER.md`, `docs/ARCHITECTURE.md`, `docs/AI_RAG_SPEC.md`, `docs/AGENT_WORKFLOW.md`, `docs/PROCESS_LOG.md`, `PRD.md`, `README.md`, `AGENTS.md`, `harness/work-graph.yaml`, `harness/quality-gates.yaml`, `harness/loop-state.json`, `harness/runtime-profile.json`, `harness/README.md`, `scripts/claude-scope-guard.mjs`, `scripts/test-claude-scope-guard.mjs`

## 인수 조건

PLAN §1의 아홉 가지. 요지: 결정 장부 새 행, 공정표·관문·로드맵·추적표·STATUS가 같은 순서와 관문 이름, 불일치 K-1~K-9 0, AI·근거 분석 서술이 U-6·U-7과 맞음, 위험 갱신, 확인 장치 '동시 작업 때만' + 시험 PASS, 끝난 절 archive, 새 맥락 검토 통과, `node scripts/verify.mjs --mode full` PASS, 이슈는 허락 뒤에만 닫음.

## 체크포인트

- 계획(2026-10-15, TASK-REVIEW-01을 마친 세션): 사용자 결정 U-1~U-7 기록, PLAN·REQUESTS 작성. 같은 세션이 커밋 `323329b`(T3 뼈대)·`1845e83`(감리 보고서)을 만들었고 푸시·PR은 자동 모드 안전 장치에 막혀 사용자 몫. 다음: 새 세션이 PLAN §0.2부터.
- 실행(2026-10-15, 새 세션, 브랜치 `docs/cleanup`): 0~3단계 끝 — 결정 D-116~D-121, 공정표·관문·EVAL §14·추적표. 다음 4단계(설계도 본문). 진행·근거는 PLAN 체크리스트에만 적는다.
- 실행(같은 날): 4~5단계 끝, 6-1에서 끝난 절 셋(T3·REVIEW-01·HOOK-AUTO)을 `archive/`로 옮겼다. 다음 6-2(이슈 목록) → 7단계(마감 검토·full).
- 마감(같은 날): 이슈 #1~#8 닫음(사용자 답 '5개만 지금 닫기' 뒤 '#3·#7·#8도 지금 닫기', #9는 Post-MVP라 남김), 새 맥락 검토 지적 15건 반영 → 재검토 '짓는 사람 시험 통과', `verify --mode full` PASS. 남은 사용자 몫: 커밋·푸시·PR. 다음 작업은 아래 예고.

# 다음 작업 예고 — data-foundation(저장 핵심)

TASK-CLEANUP-01이 끝나고 사용자가 지시하면 새 세션에서 시작한다. 그때 이 절을 그 작업의 절로 바꿔 채우고 `harness/loop-state.json`의 `task_id`도 바꾼다. 무엇을 만들고 무엇을 그 안에서 정하는지는 [../docs/STATUS.md](../docs/STATUS.md) §4 3번과 `harness/work-graph.yaml`의 data-foundation 노드, 관문은 `docs/EVAL_PLAN.md` §14 `data-integrity`(F-01·F-02·F-06·F-07·F-09·F-10·F-17·`ci-green`)다. 사용자 몫: 뼈대·감리·정리 커밋의 푸시(앱 코드의 CI 첫 실행) — 언제 할지는 사용자가 정하고(감리 추천은 '다음 짓기 전'), 늦어도 이 관문이 끝나기 전에는 있어야 한다(STATUS §4 2번).
