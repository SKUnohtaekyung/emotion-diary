# 현재 작업

이 파일에는 **진행 중이거나 곧 시작할 작업만** 둔다. 끝났거나 보류된 작업의 절은 [archive/](archive/README.md)로 옮긴다 — 이 파일이 한 번에 읽히는 크기여야 하고, `scripts/claude-scope-guard.mjs`가 이 파일의 `- 소유 파일:` 선언을 전부 합쳐 허용 목록으로 쓰기 때문이다(끝난 작업의 선언이 남아 있으면 그만큼 가드가 헐거워진다). 그 확인은 이 파일에 `- 동시 작업: 켬` 줄이 있을 때만 켜진다(D-119 — 여러 작업자를 같은 시간에 띄울 때 더하고 끝나면 지운다, AGENTS §2.2). 작업의 진행·증거는 그 작업의 PLAN에만 적고 여기에는 상태 한 줄과 링크만 둔다(D-118). `harness/loop-state.json`의 `task_id`는 아래 절 가운데 진행 중인 것의 머리글과 같아야 한다(`scripts/check-harness.mjs`가 quick에서 확인).

| 작업 | 상태 | 어디에 |
| --- | --- | --- |
| TASK-PERSONAL-01 personal-start(본인 사용 시작) | **진행 중(2026-10-20)** — 사용자 답 U-1~U-4대로 계획 승인 없이 진행. 코드·운영 환경·문서는 커밋해 `main`에 반영했다(사용자 지시, 휴대폰 확인 전). 남은 것: 사용자 휴대폰 확인 → 정본 기록 → 관문 판정(아래 '다음 세션이 할 일') | 이 파일 아래, 요청·계획은 [personal-start/2026-10-20/](personal-start/2026-10-20/PLAN.md) |
| direct-journal 착수 준비(쓰면서 시안 이식) | **준비 끝(2026-10-20) — 사용자 답 대기.** 변경 지도·사실표·질문 6개를 썼다. 작업 번호와 계획(PLAN)은 personal-start 관문 뒤, 질문의 답을 받고 정한다 | [direct-journal/2026-10-20/](direct-journal/2026-10-20/QUESTIONS.md)(MAP·FACTS·QUESTIONS) |
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

# TASK-PERSONAL-01 — personal-start(본인 사용 시작): 운영 건물에서 본인이 실제 일기를 쓰기 시작한다

## 상태

`in_progress`(2026-10-20 — 사용자 답 U-1~U-4: 운영 건물 지금 승인, 겹침 결함 포함, 계획 승인 없이 진행, 끝에 커밋 둘 + PR). **진행·증거는 [PLAN.md](personal-start/2026-10-20/PLAN.md) 한 곳이다**(D-118). 요청과 답은 [REQUESTS.md](personal-start/2026-10-20/REQUESTS.md).

## 목표

`harness/work-graph.yaml`의 `personal-start` 노드와 `docs/STATUS.md` §4 6번 — 관문 `personal-start`(`harness/quality-gates.yaml`)를 통과해 본인이 운영 건물에서 매일 실제 일기를 쓴다.

## 넘겨받은 것

- `first-slice` 휴대폰 확인에서 찾은 결함: 자판이 뜬 동안 작성 흐름의 상단 줄이 상태 막대와 겹친다(`tasks/first-slice/2026-10-16/PLAN.md` 5-12) — 이 작업에 넣었다(U-2).
- `data-control`에서 넘긴 것: PC 작업 스케줄러 등록·운영 백업 토큰(`tasks/archive/TASK-DATA-02.md`, U-3).

## 소유권

- Main/Writer: 이 작업을 실행하는 세션 하나. 하위 에이전트는 커밋하지 않는다. `#/help` 화면은 Sonnet 작업자 하나가 짓고(2026-10-20 끝 — 같은 시간에 쓰는 작업자는 이제 없다) 메인이 다시 재서 합쳤다.
- 소유 파일: `tasks/personal-start/**`, `tasks/CURRENT_TASK.md`, `tasks/archive/**`, `tasks/first-slice/**`, `app/scripts/**`, `app/client/index.html`, `app/client/src/styles/**`, `app/client/src/dev/**`, `app/client/src/views/**`, `app/client/src/lib/routes.ts`, `app/client/src/main.ts`, `app/test/client/**`, `app/test/e2e/**`, `docs/**`, `harness/**`, `wrangler.jsonc`, `.gitignore`

## 체크포인트

- 2026-10-20 짓기·올리기: PLAN 4-1~4-8 끝(운영 환경 `emotion-diary-prod`, `#/help`, 자판 겹침 배치 C — 운영 빌드 `20261019175608-d2ed814`에 이미 들어감). 사용자가 운영에서 로그인·부를 이름까지 했다.
- 2026-10-20 커밋·`main` 반영(사용자 지시 — "지금까지 작업한거 전부 커밋 + pr + 메인에 푸시"): 커밋 셋 — first-slice 마감 기록 / personal-start / direct-journal 착수 준비와 이 인계. **휴대폰 확인과 관문 판정 전**에 반영한 것이라 personal-start는 여전히 `in_progress`다. PR 번호와 병합 결과는 PLAN 4-10.

## 다음 세션이 할 일

1. **사용자 휴대폰 확인**(PLAN 4-9, 안내서 [PHONE-GUIDE.md](personal-start/2026-10-20/PHONE-GUIDE.md)) — 운영 앱에서: 배치 C 실기기(작성 흐름에서 자판을 띄워 위쪽 줄이 상태 막대와 겹치지 않는지, `다음`까지 밀어서 닿는지, 자판을 내린 뒤 빈 띠가 없는지), `mobile-personal`(S-01·S-02·S-05), T-03 잠금 켜짐, 백업 예약 명령(`node app/scripts/backup.mjs schedule-command prod`가 출력한 것을 사용자가 실행). 결과를 사용자에게 받는다 — 에이전트는 iPhone을 조작할 수 없다.
2. **정본 기록 → 관문 판정**(PLAN 4-10): 결과를 EVAL §4·§6 표에, 숫자는 STATUS §1에, 관문 `personal-start` 판정 → work-graph `personal-start` done → 이 절을 `tasks/archive/TASK-PERSONAL-01.md`로 옮김 → 커밋·PR(사용자 지시 때).
3. **그다음 `direct-journal`**: 사용자가 [QUESTIONS.md](direct-journal/2026-10-20/QUESTIONS.md)의 질문 6개에 답 → DECISIONS에 기록(D-066 상태 포함) → Q1 답에 맞춰 work-graph·`quality-gates.yaml`(F-21)·ROADMAP·STATUS → `tasks/direct-journal/<날짜>/PLAN.md` → 조각 0부터([MAP.md](direct-journal/2026-10-20/MAP.md) §5). 질문 답은 휴대폰 확인을 기다리는 동안 미리 받아도 된다.
4. **날짜가 걸린 것**: 있었던 일 안내 2단계 문구는 쓰기 시작한 지 30일째(추정 2026-11-19 무렵)에 바뀌어야 한다 — 서버에 첫 기록일 값이 그 전에 들어가야 한다(MAP A-7, 조각 4).
5. 운영 명령은 `ALLOW_PROD=1`, 실제 일기가 생긴 운영에는 데이터를 지우는 명령(`--fresh`·`--reset-dev-data`·`drill.mjs`·SQL `DELETE`)을 쓰지 않는다(DEPLOY §8). 창고 구조를 바꾸기 전에는 내보내기 + 백업, 바꾼 뒤 복원 확인(RK-045).
