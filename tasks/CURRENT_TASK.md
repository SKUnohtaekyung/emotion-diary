# 현재 작업

이 파일에는 **진행 중이거나 곧 시작할 작업만** 둔다. 끝났거나 보류된 작업의 절은 [archive/](archive/README.md)로 옮긴다 — 이 파일이 한 번에 읽히는 크기여야 하고, `scripts/claude-scope-guard.mjs`가 이 파일의 `- 소유 파일:` 선언을 전부 합쳐 허용 목록으로 쓰기 때문이다(끝난 작업의 선언이 남아 있으면 그만큼 가드가 헐거워진다). 그 확인은 이 파일에 `- 동시 작업: 켬` 줄이 있을 때만 켜진다(D-119 — 여러 작업자를 같은 시간에 띄울 때 더하고 끝나면 지운다, AGENTS §2.2). 작업의 진행·증거는 그 작업의 PLAN에만 적고 여기에는 상태 한 줄과 링크만 둔다(D-118). `harness/loop-state.json`의 `task_id`는 아래 절 가운데 진행 중인 것의 머리글과 같아야 한다(`scripts/check-harness.mjs`가 quick에서 확인).

| 작업 | 상태 | 어디에 |
| --- | --- | --- |
| [TASK-REPLAN-01](archive/TASK-REPLAN-01.md) 전체 순서 다시 세우기 | 끝(2026-11-11) — 결정 D-126~D-128, 0단계 정본 동기화, `verify full` PASS. 커밋 전(브랜치 `docs/replan`) | [archive/](archive/README.md), 계획은 [replan/2026-11-11/PLAN.md](replan/2026-11-11/PLAN.md) |
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

## 다음 세션이 할 일 — 일기 쓰기·오늘 화면을 시안 모양으로(D-130, 노드 `direct-journal`)

1. **먼저 읽는다**: `docs/SERVICE_WHY.md` 전문(AGENTS §1), 이 파일, `tasks/replan/2026-11-11/PLAN.md`(새 순서, D-126), `tasks/direct-journal/2026-10-20/MAP.md`(조각 지도 §5, 규칙 R1~R11 §2, 시안 코드가 앱 규칙에 걸리는 곳 §3, 화면별 변경 지도 §4.2·§4.5)와 `FACTS.md`, `tasks/reflection/2026-11-11/PLAN.md`(화면 기초에서 정한 A-1~A-13과 진행 기록 — 어떻게 지었는지의 본보기).
2. **이미 정해진 것**(다시 묻지 않는다): 화면은 Preact(D-127 — `lib/mount.ts`의 `mountPreact`로 라우터에 끼운다, 옛 화면은 손댈 때 바꾼다), 마음 고르기는 언덕 위 자유 배치 + 큰 글자·겹침이면 3×3 격자(D-066 확정, D-128), 오늘 기록이 있는 날 돌을 누르면 읽는 편지(D-128), 휴대폰 확인은 모아서(D-126 U-7) — 이번 묶음 끝의 휴대폰 확인에 `tasks/reflection/2026-11-11/PHONE-GUIDE.md`(달력·통계)를 함께 넣는다(D-130).
3. **범위**: MAP §5 조각 1~6(작성 틀 → 마음 고르기·세부 감정 → 크기 → 글 쓰는 단계 → 편지·봉인·완료 → 기록 메뉴, 서버에 **완료 취소** 경로)과 조각 9(오늘 숲·로딩·덮개·잠금). 설정 하위 화면(조각 8)·들어오는 길·온보딩(조각 10·11)은 이번에 넣을지 계획 때 사용자에게 묻는다. 계획은 `tasks/direct-journal/<날짜>/PLAN.md`에 쓰고 사용자 승인 뒤 짓는다.
4. **이번 묶음에서 쓸 수 있는 것**(TASK-REFLECT-01이 지음): 시안 이름의 CSS 변수(`--bg`·`--fs-body`·`--sp-4`·`--anger-500` …, `tokens.ts` A-13), 공통 부품(`styles/v4.css`, `ui/StatusBlock.tsx`, `ui/icons.tsx`, `ui/MiniLetter.tsx`, 위험 시트 `kind: "danger"`), 그림(`lib/art.ts` — 친구·조약돌·돌), 움직임 줄이기(`lib/motion.ts`), 합성 기록(`app/scripts/synthetic.mjs`, 로컬 넣기 `node app/scripts/seed-dev.mjs local` — 먼저 `make-secrets.mjs local backup`), E2E의 axe(`expectNoSeriousA11y`), 시안 CSS를 거의 그대로 옮기는 방식(`styles/calendar.css`·`stats.css` — Biome의 두 규칙은 `biome.json` overrides).
5. **지킬 것**: 저장·흐름 코드는 그대로 두고 모양을 입힌다(MAP A-1 — `write/saver`·`session`·`unsent`가 정본), 스크롤은 `#app`만(D-125), 버튼 줄·위 줄을 화면에 고정하지 않는다(D-123), CSP(style 속성·innerHTML 금지 — Preact 객체 style은 허용), 하단 탐색은 밝은 목록 화면에만(오늘·작성 흐름에는 없다), 개발용 '상태' 칸이 화면을 가리지 않는지 E2E로 본다. 시안의 '시안' 띠·예시 태그·AI 줄은 옮기지 않는다.
6. **휴대폰 확인 전에 사용자에게**: 이 PC에는 Cloudflare 로그인(`npx wrangler login` — 사용자가 직접)과 개발용 파일(`work/deploy/dev.*` — 주소·열쇠·비밀값·백업 토큰)이 없다. 예전 PC에서 옮길지, 새로 만들지(개발용 열쇠가 바뀐다) 묻는다.
7. 커밋·PR은 사용자 지시 때만(AGENTS §2.1). 이 묶음이 끝나면 `dashboard-reminder`(휴대폰 결과로 관문 `reflection-core` 판정)와 함께 마감한다.
