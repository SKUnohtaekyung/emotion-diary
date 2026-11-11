# TASK-REPLAN-01 — 전체 순서 다시 세우기: 목표를 다른 사람이 가입해 쓰는 웹앱 공개로

## 상태

`done`(2026-11-11 — 0단계 끝, `verify full` PASS, 커밋 전(브랜치 `docs/replan`). 처음: 사용자가 계획을 다시 세우자고 했고, 질문 창 네 번의 답 U-1~U-16으로 초안을 썼다. 사용자 "0단계 진행해"). **계획·답은 [PLAN.md](../replan/2026-11-11/PLAN.md) 한 곳이다**(D-118). 결정은 D-126.

## 범위

- 포함: 새 계획의 0단계 — 결정 장부(D-126과 교정 표시), 공정표·관문(`personal-start` 대체, `dashboard-reminder` → `direct-journal` → 새 노드 `accounts` → `limited-mvp-release`), 관문 라벨(EVAL §14), loop-state, STATUS·ROADMAP·TRACEABILITY, personal-start 절을 archive로, 다음 단계 앞에서 물을 것(화면 도구, direct-journal Q3·Q4)
- 제외: 앱 코드, 운영·개발용 건물 명령

## 소유권

- Main/Writer: 이 작업을 실행하는 세션 하나. 하위 에이전트는 커밋하지 않는다.
- 소유 파일: `tasks/replan/**`, `tasks/CURRENT_TASK.md`, `tasks/archive/**`, `docs/**`, `harness/**`

## 인수 조건

- 공정표·관문·loop-state·STATUS·ROADMAP·TRACEABILITY가 D-126의 순서와 맞고 `node scripts/verify.mjs --mode full` PASS.
- 화면 기초(`dashboard-reminder`) 착수 전에 물을 것이 사용자에게 갔다.

## 지켜야 할 것(넘겨받음)

- 운영 명령은 `ALLOW_PROD=1`, 운영에는 데이터를 지우는 명령(`--fresh`·`--reset-dev-data`·`drill.mjs`·SQL `DELETE`)을 쓰지 않는다(DEPLOY §8). 창고 구조를 바꾸기 전에는 내보내기 + 백업, 바꾼 뒤 복원 확인(RK-045).

## 체크포인트

- 2026-11-11 0단계: D-126(교정 표시 D-019·D-108·D-116·D-117·D-120·D-121), 공정표(`personal-start` blocked·대체, `dashboard-reminder` ready, 새 노드 `accounts`), 관문(`reflection-core`에서 F-13 빼고 `mobile-reflection`, 새 관문 `accounts`)과 라벨(EVAL §14), loop-state, STATUS §1·§4, ROADMAP, TRACEABILITY(PR-002·PR-014에 `accounts`), personal-start 절을 `tasks/archive/TASK-PERSONAL-01.md`로. `node scripts/verify.mjs --mode full` PASS(빌드 `20261111061017-56f064d`, dry-run). 커밋 없음(브랜치 `docs/replan`). 같은 날 질문 창 한 번으로 화면 도구·Q3·Q4를 물어 모두 추천안을 받았다 — D-127(Preact, D-114 교정)·D-128(자유 배치 확정 + 격자 자동 전환, 돌을 누르면 읽는 편지, D-066 accepted). 0단계 끝 — 다음은 `dashboard-reminder`(화면 기초·돌아보기)의 PLAN.
