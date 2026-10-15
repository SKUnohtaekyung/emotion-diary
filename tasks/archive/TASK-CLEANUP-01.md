> **아카이브(2026-10-15, TASK-DATA-01 준비 때 옮김).** `tasks/CURRENT_TASK.md`에서 옮긴 기록이다. 옮기기 직전 커밋은 `5a71381`(PR #37의 CI 줄바꿈 수정)이고 원문(작업 트리, CRLF)은 3,767B, SHA-256 앞 12자리 `3b8441d441d5`다. 본문은 고치지 않았고 상대 링크 2개의 경로 깊이만 고쳤다(아래 상태 줄의 '커밋 전'은 옮기기 전 표기 그대로다). **상태**: done(2026-10-15) — 커밋 `85c3bb5`, PR #37(CI 두 OS 통과, 병합은 사용자 몫). 이슈 #1~#8 닫음. **남은 일이 간 곳**: PR #37 병합 → `docs/STATUS.md` §4 2번, 다음 작업 → TASK-DATA-01(`tasks/CURRENT_TASK.md`, 요청서 `tasks/data-foundation/2026-10-15/REQUESTS.md`). 진행 기록은 `tasks/cleanup/2026-10-15/PLAN.md`.

# TASK-CLEANUP-01 — 설계도 정리: 감리 결정을 공정표·관문·결정 장부에 옮긴다

## 상태

`done`(2026-10-15, 브랜치 `docs/cleanup`, 커밋 전 — 커밋은 사용자 지시 때. 사용자 확인 뒤 이 절을 `tasks/archive/`로 옮긴다) — 2026-10-15 사용자 지시("1번하고 2번을 작업할 요청 프롬프트 작성해줘", 설명 뒤 "ㄱㄱ 그렇게 하자."). 계획은 TASK-REVIEW-01을 마친 세션이 세웠고 **실행은 새 세션이 한다.** 요청 원문과 사용자 결정 U-1~U-7은 [cleanup/2026-10-15/REQUESTS.md](../cleanup/2026-10-15/REQUESTS.md), 단계·변경 지도·함정은 [cleanup/2026-10-15/PLAN.md](../cleanup/2026-10-15/PLAN.md) — **PLAN이 이 작업의 유일한 진행 기록이다.** 새 세션은 PLAN §0부터 읽는다.

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
