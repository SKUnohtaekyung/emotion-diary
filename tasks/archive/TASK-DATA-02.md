# TASK-DATA-02 — data-control(내 데이터 통제): 내보내기·모든 기록 지우기·PC 백업과 다시 넣기·복원 연습

## 상태

`done`(2026-10-17 — PR #43 → PR #42 → `main` `8416734`, CI 통과, 관문 `data-control` 통과. 처음: — 사용자 지시 "그냥 계속 진행해", "한번에 할 수 있는 것들은 한번에 해"). 2026-10-17 PLAN 2-1~2-7 끝(관문 증거를 갖춤, 공정표 `verifying`) — 남은 것은 2-8 커밋·PR·CI. 진행 중 확인은 질문 창 한 번(U-1~U-4)으로 받았고 끝(커밋·PR)까지 묻지 않고 진행한다. **진행·증거는 [PLAN.md](../data-control/2026-10-17/PLAN.md) 한 곳이다**(D-118). 화면 작업자(같은 폴더, 아래 소유 파일)는 끝났다 — 동시 작업 줄을 지웠다.

## 범위

- 포함: 관문 `data-control`(F-14·F-15·restore-drill·export-cpu-measured), 내보내기 화면·모든 기록 지우기 화면, PC 백업 도구(`pull`·`restore`·등록 명령 출력), 개발용 환경의 복원 연습
- 제외: 운영 환경 만들기·작업 스케줄러 실제 등록(`personal-start`, U-3), 분석 결과 내보내기(분석 기능이 없다)

## 소유권

- 메인 소유 파일: `tasks/data-control/**`, `tasks/CURRENT_TASK.md`, `app/shared/**`, `app/worker/**`, `app/test/worker/**`, `app/scripts/**`, `schemas/export.schema.json`, `docs/**`, `harness/**`
- 화면 작업자 소유 파일: `app/client/src/views/exportData.ts`, `app/client/src/views/deleteAll.ts`, `app/client/src/write/dataApi.ts`, `app/client/src/lib/routes.ts`, `app/client/src/main.ts`, `app/client/src/views/today.ts`, `app/client/src/styles/components.css`, `app/test/client/data-control.test.ts`, `app/test/client/routes.test.ts`

## 인수 조건(시험 목록은 PLAN)

- F-14·F-15 서버·화면 시험 PASS, export-cpu-measured 측정 기록, 개발용 환경 restore-drill PASS, `verify --mode full` PASS, CI 초록.
