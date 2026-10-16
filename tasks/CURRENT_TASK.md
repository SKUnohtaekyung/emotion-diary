# 현재 작업

이 파일에는 **진행 중이거나 곧 시작할 작업만** 둔다. 끝났거나 보류된 작업의 절은 [archive/](archive/README.md)로 옮긴다 — 이 파일이 한 번에 읽히는 크기여야 하고, `scripts/claude-scope-guard.mjs`가 이 파일의 `- 소유 파일:` 선언을 전부 합쳐 허용 목록으로 쓰기 때문이다(끝난 작업의 선언이 남아 있으면 그만큼 가드가 헐거워진다). 그 확인은 이 파일에 `- 동시 작업: 켬` 줄이 있을 때만 켜진다(D-119 — 여러 작업자를 같은 시간에 띄울 때 더하고 끝나면 지운다, AGENTS §2.2). 작업의 진행·증거는 그 작업의 PLAN에만 적고 여기에는 상태 한 줄과 링크만 둔다(D-118). `harness/loop-state.json`의 `task_id`는 아래 절 가운데 진행 중인 것의 머리글과 같아야 한다(`scripts/check-harness.mjs`가 quick에서 확인).

| 작업 | 상태 | 어디에 |
| --- | --- | --- |
| TASK-SLICE-01 first-slice('오늘 한 편' 첫 조각) | **진행 중(2026-10-16 계획 승인)** — 질문 넷(U-1~U-4)의 답과 계획대로 짓는 중. 브랜치 `slice/first-slice`(`main` `47ddd90` 위) | 이 파일 아래, 요청·계획은 [first-slice/2026-10-16/](first-slice/2026-10-16/PLAN.md) |
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

# TASK-SLICE-01 — first-slice('오늘 한 편' 첫 조각): 평면 화면으로 한 편을 쓰고, 남기고, 다시 연다

## 상태

`in_progress`(2026-10-16 사용자가 계획 승인 — "PLAN.md 그대로 승인해요. 5-1부터 시작해 주세요."). 처음 상태는 planned였다: data-foundation을 마친 세션이 맡긴 착수 준비를 이 세션이 했다: 정본·서버 계약을 읽고 요청서를 쓰고, 질문 창 하나로 넷을 물어 모두 추천안을 받았다(U-1 버튼은 내용 바로 뒤, U-2 못 보낸 글만 휴대폰에 잠깐, U-3 완료한 기록 고치기·쓰던 글 지우기를 넣음, U-4 PR #39 병합 뒤 시작). 사용자가 PR #39를 병합해(`main` `47ddd90`) 그 위에 브랜치 `slice/first-slice`를 만들었다. 화면 구현은 사용자가 계획을 승인한 뒤 시작한다. **진행·증거는 [PLAN.md](first-slice/2026-10-16/PLAN.md) 한 곳이다**(D-118). 요청과 답은 [REQUESTS.md](first-slice/2026-10-16/REQUESTS.md).

## 목표

연출 없는 평면 화면으로 '오늘 한 편'(사건 → 마음·세부 감정·크기 → 이유 → 칭찬·감사 → 검토 → 완료)을 쓰고, 서버에 임시저장하며, 화면이 통째로 새로 열려도 쓰던 단계와 글로 돌아오게 한다. 완료한 기록을 다시 열어 읽고 고칠 수 있고, 쓰던 글을 지울 수 있다. 관문 `first-slice`를 통과해 `personal-start`(본인 사용 시작)가 이 화면으로 쓰게 한다.

## 범위

- 포함: `docs/STATUS.md` §4 4번과 `harness/work-graph.yaml`의 `first-slice` 노드가 정한 것, 요청서 R-1~R-7과 사용자 답 U-1~U-4, 계획 §2의 에이전트 결정 A-1~A-14.
- 제외:
  - 시안의 연출(친구·조약돌·바구니·편지 봉투·장면)과 시안 화면 이식(`direct-journal`)
  - 완료 취소, 완료한 기록의 영구 삭제(UX_SPEC §7 — `direct-journal`)
  - 달력·통계·알림, 내보내기·모든 기록 지우기·백업(`data-control`)
  - 운영 건물(`personal-start`), AI 작성·분석
  - 서버 변경 — 필요해지면 멈추고 PLAN에 이유를 적는다
  - 원격 명령은 개발용 건물(`emotion-diary-dev`)에만 쓰고, 올리기 직전에 사용자 확인

## 소유권

- Main/Writer: 이 작업을 실행하는 세션 하나. 하위 에이전트는 조사·검토(읽기 전용)만 쓰고 어떤 하위 에이전트도 커밋하지 않는다.
- 소유 파일: `tasks/first-slice/**`, `tasks/CURRENT_TASK.md`, `tasks/archive/**`, `app/client/**`, `app/shared/**`, `app/test/client/**`, `app/test/e2e/**`, `app/scripts/**`, `playwright.config.ts`, `package.json`, `package-lock.json`, `tsconfig*.json`, `biome.json`, `.gitignore`, `.github/workflows/harness.yml`, `docs/UX_SPEC.md`, `docs/DATA_MODEL.md`, `docs/ARCHITECTURE.md`, `docs/EVAL_PLAN.md`, `docs/TRACEABILITY.md`, `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/RISK_REGISTER.md`, `docs/ROADMAP.md`, `harness/work-graph.yaml`, `harness/loop-state.json`, `harness/quality-gates.yaml`, `harness/runtime-profile.json`

## 인수 조건(검사 목록은 PLAN §6)

- 관문 `first-slice`: F-03·F-04·F-05·F-08·F-24가 화면 시험과 E2E로 PASS, `e2e-reload-restore`(새로고침 복원·연결 끊김 복원·기기 사본 복원)가 실제 브라우저 E2E로 PASS, `mobile-slice`(iPhone 홈 화면 앱 약 10분 — S-02·S-06·S-07·T-03)의 결과가 `docs/EVAL_PLAN.md` §4·§6 표에 있다.
- 넘겨받은 F-22의 '작성 중 만료 시 입력을 잃지 않음'과 화면 쪽 F-09·F-18·F-28·고친 F-19가 시험으로 PASS.
- 사용자 결정 U-1~U-3과 에이전트 세부가 D-123과 정본(UX_SPEC·DATA_MODEL·ARCHITECTURE·EVAL)에 있다. 사용자 결정은 사용자가 고른 것만 적는다.
- 시험이 결함을 잡는지 결함 주입으로 확인했다(PLAN 5-8).
- 새 맥락 검토자의 마감 검토를 반영했고 `node scripts/verify.mjs --mode full` PASS, E2E가 CI에서 초록(커밋·PR은 사용자 지시 뒤).

## 체크포인트

- 준비(2026-10-16, 이 세션): 요청서·계획서를 쓰고 이 절을 세웠다. 끝난 TASK-DATA-01 절은 `tasks/archive/TASK-DATA-01.md`로 옮겼다. `harness/loop-state.json`을 이 작업으로 바꿨다. 다음: 사용자가 계획을 승인 → PLAN §5의 5-1부터.
- 짓기(2026-10-16, 같은 세션): PLAN 5-1~5-10 끝 — 화면·저장 줄·기기 사본·E2E·결함 주입·정본 동기화(D-123)·마감 검토 반영, `verify --mode full` PASS(숫자는 STATUS §1). 커밋 없음. 5-11도 끝(사용자 확인 뒤 개발용 건물에 빌드 `20261016064316-47ddd90`, 원격 검사 50/50, 개발용 데이터 비움). 다음: 5-12 휴대폰(사용자, [PHONE-GUIDE.md](first-slice/2026-10-16/PHONE-GUIDE.md)) → 5-13 커밋·PR 뒤 CI.
