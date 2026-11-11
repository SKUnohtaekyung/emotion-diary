# 현재 작업

이 파일에는 **진행 중이거나 곧 시작할 작업만** 둔다. 끝났거나 보류된 작업의 절은 [archive/](archive/README.md)로 옮긴다 — 이 파일이 한 번에 읽히는 크기여야 하고, `scripts/claude-scope-guard.mjs`가 이 파일의 `- 소유 파일:` 선언을 전부 합쳐 허용 목록으로 쓰기 때문이다(끝난 작업의 선언이 남아 있으면 그만큼 가드가 헐거워진다). 그 확인은 이 파일에 `- 동시 작업: 켬` 줄이 있을 때만 켜진다(D-119 — 여러 작업자를 같은 시간에 띄울 때 더하고 끝나면 지운다, AGENTS §2.2). 작업의 진행·증거는 그 작업의 PLAN에만 적고 여기에는 상태 한 줄과 링크만 둔다(D-118). `harness/loop-state.json`의 `task_id`는 아래 절 가운데 진행 중인 것의 머리글과 같아야 한다(`scripts/check-harness.mjs`가 quick에서 확인).

| 작업 | 상태 | 어디에 |
| --- | --- | --- |
| [TASK-REPLAN-01](archive/TASK-REPLAN-01.md) 전체 순서 다시 세우기 | 끝(2026-11-11) — 결정 D-126~D-128, 0단계 정본 동기화, `verify full` PASS. 커밋 전(브랜치 `docs/replan`) | [archive/](archive/README.md), 계획은 [replan/2026-11-11/PLAN.md](replan/2026-11-11/PLAN.md) |
| TASK-JOURNAL-01 일기 쓰기·오늘 화면을 시안 모양으로 | **진행 중(2026-11-11 승인 — D-131)** — 노드 `direct-journal` in_progress | 이 파일 아래, 계획은 [direct-journal/2026-11-11/PLAN.md](direct-journal/2026-11-11/PLAN.md) |
| TASK-REFLECT-01 화면 기초와 돌아보기(달력 + 통계) | **코드 끝·휴대폰 확인 대기(2026-11-11)** — D-129·D-130. 노드 `dashboard-reminder` verifying, 휴대폰 확인은 다음 묶음과 함께 | 이 파일 아래, 계획은 [reflection/2026-11-11/PLAN.md](reflection/2026-11-11/PLAN.md) |
| direct-journal 착수 준비(시안 이식 지도) | 준비 끝(2026-10-20). 2026-11-11 D-126으로 순서가 바뀌었다 — MAP의 조각 지도는 새 순서의 화면 기초·작성 흐름·오늘·설정·가입이 그대로 쓰고, 남았던 Q3·Q4는 2026-11-11 D-128로 답했다 | [direct-journal/2026-10-20/](direct-journal/2026-10-20/QUESTIONS.md)(MAP·FACTS·QUESTIONS) |
| [TASK-PERSONAL-01](archive/TASK-PERSONAL-01.md) personal-start(본인 사용 시작) | 대체됨(2026-11-11, D-126) — 운영 건물 `emotion-diary-prod`·`#/help`·자판 배치 C·첫 백업 복원까지 짓고 `main`에 반영(PR #45·#46). 남은 휴대폰 확인·관문 판정은 하지 않는다 | [archive/](archive/README.md), 요청·계획은 [personal-start/2026-10-20/](personal-start/2026-10-20/PLAN.md) |
| [TASK-SLICE-01](archive/TASK-SLICE-01.md) first-slice('오늘 한 편' 첫 조각) | 끝(2026-10-20) — 결정 D-123, 관문 `first-slice` 통과(화면 시험·E2E·CI는 PR #40·#41 → `main` `b74242c`, iPhone `mobile-slice` 2026-10-20). 남은 결함 하나(자판이 뜰 때 상단 줄이 상태 막대와 겹침 — PLAN 5-12) | [archive/](archive/README.md), 요청·계획은 [first-slice/2026-10-16/](first-slice/2026-10-16/PLAN.md) |
| [TASK-DATA-02](archive/TASK-DATA-02.md) data-control(내 데이터 통제) | 끝(2026-10-17) — 결정 D-124, 관문 `data-control` 통과(F-14·F-15 시험, 개발용 환경 restore-drill, export-cpu-measured, CI). 커밋 `eedc783`·`85ac8c9` — PR #43 → PR #42 → `main` `8416734` | [archive/](archive/README.md), 요청·계획은 [data-control/2026-10-17/](data-control/2026-10-17/PLAN.md) |
| [TASK-DATA-01](archive/TASK-DATA-01.md) data-foundation(저장 핵심) | 끝(2026-10-16) — 결정 D-122, 관문 `data-integrity` 통과(서버 시험, 개발용 환경 원격 검사 50/50, CI 두 OS). 커밋 `89c0017` — PR #38 → PR #37 → `main` `adb3d06`, 마감 정리 PR #39 → `main` `47ddd90` | [archive/](archive/README.md), 요청·계획은 [data-foundation/2026-10-15/](data-foundation/2026-10-15/PLAN.md) |
| [TASK-CLEANUP-01](archive/TASK-CLEANUP-01.md) 설계도 정리(감리 결정을 공정표·관문·결정 장부에) | 끝(2026-10-15, 커밋 `85c3bb5` — PR #37, 2026-10-16 `main` 병합 `adb3d06`) | [archive/](archive/README.md), 요청·계획은 [cleanup/2026-10-15/](cleanup/2026-10-15/PLAN.md) |
| [TASK-REVIEW-01](archive/TASK-REVIEW-01.md) 종합 점검(현황·남은 작업·작업 방식·기술 스택) | 끝(2026-10-15, 커밋 `1845e83` — PR #37) | [archive/](archive/README.md), 보고서 [review/2026-10-14/REPORT.md](review/2026-10-14/REPORT.md) |
| [TASK-MOBILE](TASK-MOBILE.md) 설치형 홈 화면 웹앱 | T2 끝(2026-10-14, PR #36 병합 `7b99e2c`) / T3 끝(2026-10-14, 커밋 `323329b` — PR #37). 결정 D-111~D-115. 이슈 #1~#8 닫음, #9는 Post-MVP(처리표 [cleanup/2026-10-15/PLAN.md](cleanup/2026-10-15/PLAN.md) 6-2) | T3 기록 [archive/TASK-MOBILE-T3.md](archive/TASK-MOBILE-T3.md)와 [mobile/2026-10-14-t3/](mobile/2026-10-14-t3/PLAN.md), T2 기록 [archive/TASK-MOBILE-T2.md](archive/TASK-MOBILE-T2.md)와 [mobile/2026-10-14/](mobile/2026-10-14/PLAN.md), 배경은 별도 파일 |
| [TASK-HOOK-AUTO](archive/TASK-HOOK-AUTO.md) auto 모드에서 가드 훅 확인창 없애기 | 끝 — 구현·검증 2026-09-21(D-060), 남은 '다른 세션 확인 대기'는 2026-10-15 D-119로 닫음 | [archive/](archive/README.md) |
| [TASK-WEB-UI-01](archive/TASK-WEB-UI-01.md) 브라우저 우선 UI 프로토타입 | 구현·PC 검수 완료(2026-09-20). PR #30 병합(2026-09-26, `5fa94a4` — QA #51~#54·D-096까지 함께) | [archive/](archive/README.md) |
| [TASK-WEB-UI-02](archive/TASK-WEB-UI-02.md) 사용자 QA와 디자인 수정 | **완료(2026-10-13)** — 사용자가 시안을 처음부터 써 보고 달력 포함 전체 화면을 승인했다. QA #1~#60, D-048~D-107. 마지막 묶음(#60: 요청 14건·UX 라이팅 원칙·앱 잠금 비밀번호·용어표)은 main `25e0226`·`adad018`. 남은 일은 `docs/STATUS.md` §4 | [archive/](archive/README.md), 2026-10-13 요청·계획은 [qa/2026-10-13/](qa/2026-10-13/PLAN.md) |
| [TASK-SPIKE-02](archive/TASK-SPIKE-02.md) 스파이크 잔여 판정(Phase 1 선행) | **완료(2026-10-14)** — B-02·B-03·B-04·B-05·B-08 pass, B-06 보류 2건, B-07 범위 밖. main `535e714`(PR #35). 남은 일은 `docs/STATUS.md` §3·§4 | [archive/](archive/README.md), 요청·계획·근거는 [spike/2026-10-13/](spike/2026-10-13/PLAN.md) |
| [TASK-DS-REF](TASK-DS-REF.md) 기본 부품 명세를 빠짐없이(D-039·D-097~D-100) | 완료(2026-09-26) — PR #31 병합(`838a0ef`), 이슈 #10~#14 닫음. 남은 일은 `docs/STATUS.md` §4-2로 옮겼다 | 별도 파일(여러 문서가 경로로 인용해 옮기지 않았다). 이 파일의 절(소유 파일 선언)은 뺐다 |
| [TASK-TAXONOMY](TASK-TAXONOMY.md) · [V1](TASK-TAXONOMY-V1.md) · [PLAN-V2](TASK-TAXONOMY-PLAN-V2.md) | 완료(2026-09-05, D-038·D-040 accepted) | 별도 파일(다른 문서가 경로로 인용해 옮기지 않았다) |
| TASK-INFRA-01 · ISSUE-26 · ISSUE-27 · CBM · DESIGN · BOOTSTRAP | 완료·보류 기록 | [archive/](archive/README.md) |

# TASK-REFLECT-01 — 화면 기초와 돌아보기(달력 + 통계)

## 상태

`verifying`(2026-11-11 — R-0~R-5와 R-6의 이 PC 몫 끝, 커밋함. 남은 것은 휴대폰 확인 하나 — D-130으로 다음 묶음의 휴대폰 확인과 함께 한다. 처음: 사용자 "Start stage 1 plan" → 계획 승인 "추천으로 고고", U-1 추천안, D-129). 운영 데이터 규칙(운영에 지우는 명령 금지, 구조 변경 전 내보내기 + 백업 — DEPLOY §8·RK-045)은 그대로다. **진행·증거는 [PLAN.md](reflection/2026-11-11/PLAN.md) 한 곳이다**(D-118).

## 범위

- 포함·제외는 PLAN §1. 공정표 노드 `dashboard-reminder`, 관문 `reflection-core`.

## 소유권

- Main/Writer: 이 작업을 실행하는 세션 하나. 하위 에이전트는 조사·검토만, 커밋하지 않는다.
- 소유 파일: `tasks/reflection/**`, `tasks/CURRENT_TASK.md`, `app/client/**`, `app/shared/**`, `app/worker/**`, `app/test/**`, `app/scripts/**`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `package.json`, `package-lock.json`, `tsconfig*.json`, `biome.json`, `docs/**`, `harness/**`

## 인수 조건

- 관문 `reflection-core`(F-11·F-12·F-20·deterministic-statistics·timezone-boundaries·mobile-reflection)의 증거가 PLAN §6대로 있고 `node scripts/verify.mjs --mode full` PASS, 커밋·PR은 사용자 지시 뒤 CI 초록.

# TASK-JOURNAL-01 — 일기 쓰기·오늘 화면을 시안 모양으로

## 상태

`in_progress`(2026-11-11 — 사용자 승인 "승인. 커밋 먼저 하고 작업해", D-131. 처음: D-130 "일기 쓰기, 오늘 화면 작업할거야"). 브랜치 `journal/direct`(`edb115d`에서). **진행·증거는 [PLAN.md](direct-journal/2026-11-11/PLAN.md) 한 곳이다**(D-118). 휴대폰 확인은 이 묶음 끝에 달력·통계(`tasks/reflection/2026-11-11/PHONE-GUIDE.md`)와 함께 — 그 전에 개발용 건물(이 PC에는 Cloudflare 로그인·`work/deploy/dev.*`가 없다)을 사용자와 정한다(PLAN J-10).

## 범위

- 포함·제외는 PLAN §1. 공정표 노드 `direct-journal`, 관문 `core-product`. 설정 하위 화면은 이번에 넣고, 들어오는 길·온보딩은 `accounts`에서(PLAN §3 U-1·U-2 답).

## 소유권

- Main/Writer: 이 작업을 실행하는 세션 하나. 하위 에이전트는 조사·검토만, 커밋하지 않는다.
- 소유 파일: `tasks/direct-journal/**`, `tasks/reflection/**`, `tasks/CURRENT_TASK.md`, `app/client/**`, `app/shared/**`, `app/worker/**`, `app/test/**`, `app/scripts/**`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `package.json`, `package-lock.json`, `tsconfig*.json`, `biome.json`, `docs/**`, `harness/**`, `design/tokens.json`

## 인수 조건

- PLAN §5의 조각마다 화면 시험·E2E(axe serious/critical 0)·`verify --mode quick` 통과, 끝에 `node scripts/verify.mjs --mode full`·`npm run e2e` 통과, 새 맥락 검토 반영, 휴대폰 확인 결과가 EVAL §4·§6에 있고 관문 `core-product`(PLAN §6)·`reflection-core` 판정. 커밋·PR은 사용자 지시 뒤 CI 초록.
