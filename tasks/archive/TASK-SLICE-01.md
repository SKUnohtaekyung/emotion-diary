# TASK-SLICE-01 — first-slice('오늘 한 편' 첫 조각): 평면 화면으로 한 편을 쓰고, 남기고, 다시 연다

## 상태

`done`(2026-10-20 — 관문 `first-slice` 통과: 화면 시험·E2E·결함 주입·마감 검토 반영은 PR #40·#41 → `main` `b74242c`(CI 통과), 개발용 건물 `main` `d2ed814` 다시 올림·원격 검사(5-11), 사용자의 iPhone 확인 `mobile-slice`(5-12 — S-02·S-06·S-07·T-03 잠금 꺼짐, 결과는 `docs/EVAL_PLAN.md` §4·§6). 함께 찾은 결함(자판이 뜰 때 상단 줄이 상태 막대와 겹침)은 PLAN 5-12에 있고 언제 고칠지는 사용자 결정 대기(`docs/STATUS.md` §4). 처음:) `in_progress`(2026-10-16 사용자가 계획 승인 — "PLAN.md 그대로 승인해요. 5-1부터 시작해 주세요."). 처음 상태는 planned였다: data-foundation을 마친 세션이 맡긴 착수 준비를 이 세션이 했다: 정본·서버 계약을 읽고 요청서를 쓰고, 질문 창 하나로 넷을 물어 모두 추천안을 받았다(U-1 버튼은 내용 바로 뒤, U-2 못 보낸 글만 휴대폰에 잠깐, U-3 완료한 기록 고치기·쓰던 글 지우기를 넣음, U-4 PR #39 병합 뒤 시작). 사용자가 PR #39를 병합해(`main` `47ddd90`) 그 위에 브랜치 `slice/first-slice`를 만들었다. 화면 구현은 사용자가 계획을 승인한 뒤 시작한다. **진행·증거는 [PLAN.md](../first-slice/2026-10-16/PLAN.md) 한 곳이다**(D-118). 요청과 답은 [REQUESTS.md](../first-slice/2026-10-16/REQUESTS.md).

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
- 짓기(2026-10-16, 같은 세션): PLAN 5-1~5-10 끝 — 화면·저장 줄·기기 사본·E2E·결함 주입·정본 동기화(D-123)·마감 검토 반영, `verify --mode full` PASS(숫자는 STATUS §1). 커밋 없음. 5-11도 끝(사용자 확인 뒤 개발용 건물에 빌드 `20261016064316-47ddd90`, 원격 검사 50/50, 개발용 데이터 비움). 다음: 5-12 휴대폰(사용자, [PHONE-GUIDE.md](../first-slice/2026-10-16/PHONE-GUIDE.md)) → 5-13 커밋·PR 뒤 CI.
