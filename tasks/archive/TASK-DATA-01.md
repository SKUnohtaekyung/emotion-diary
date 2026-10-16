> **아카이브(2026-10-16, TASK-SLICE-01 준비 때 옮김).** `tasks/CURRENT_TASK.md`에서 옮긴 기록이다. 옮기기 직전 커밋은 `47ddd90`(PR #39 병합)이고 원문(작업 트리, CRLF)은 3,471B, SHA-256 앞 12자리 `e2dfaafb4b78`다. 본문은 고치지 않았고 상대 링크 1개의 경로 깊이만 고쳤다. **상태**: done(2026-10-16) — 관문 `data-integrity` 통과, 결정 D-122, 커밋 `89c0017` — PR #38 → PR #37 → `main` `adb3d06`, 마감 정리는 PR #39(`main` `47ddd90`). **남은 일이 간 곳**: 다음 작업 → TASK-SLICE-01(`tasks/CURRENT_TASK.md`, 요청·계획 `tasks/first-slice/2026-10-16/`), 내보내기·전체 삭제·백업 → `data-control`(`harness/work-graph.yaml`), F-22의 '작성 중 만료 시 입력을 잃지 않음' → `first-slice`(`tasks/first-slice/2026-10-16/PLAN.md` §6). 진행 기록은 `tasks/data-foundation/2026-10-15/PLAN.md`.

# TASK-DATA-01 — data-foundation(저장 핵심): 일기 창고의 칸과 자물쇠를 짓는다

## 상태

`done`(2026-10-16) — 관문 `data-integrity` 통과, 사용자가 PR #38·PR #37을 병합했다(`main` `adb3d06`, CI 두 OS 통과). 다음은 `first-slice`·`data-control`(둘 다 ready — 새 작업 절은 사용자 지시 때 세운다). 착수: 2026-10-15(사용자 지시 "data-foundation 시작"). 시작 때 PR #37은 병합 전이라 그 머리(`ac41609`) 위에 브랜치 `data/foundation`을 만들었다. 사용자에게 물은 둘(글 길이 1만 자, '오늘'은 지금 있는 곳의 시계)과 에이전트가 정한 나머지는 D-122. **진행·증거는 [PLAN.md](../data-foundation/2026-10-15/PLAN.md) 한 곳이다**(D-118).

## 목표

일기·감정 표와 서버의 저장 규칙을 짓는다: 오늘 임시저장·완료·조회·수정, 하루 한 편, 판 번호, 중복 요청에 안전, owner 권한. 관문 `data-integrity`를 통과해, 다음 조각(`first-slice`)이 화면만 얹으면 되게 한다.

## 범위

- 포함: `docs/STATUS.md` §4 3번과 `harness/work-graph.yaml`의 data-foundation 노드가 정한 것, 요청서 §1(S-1~S-9)·§2(틀린 열쇠 잠금 고침 포함).
- 제외:
  - 화면(`first-slice`)
  - 내보내기·전체 삭제·백업과 다시 넣는 도구(`data-control`)
  - 운영 건물, AI·분석 표, `web/`·`design/`
  - 원격 명령은 개발용 건물(`emotion-diary-dev`)에만 쓰고, 만들기·지우기는 직전에 사용자 확인

## 소유권

- Main/Writer: 새 세션. 하위 에이전트는 조사·검토(읽기 전용)만 쓰고 어떤 하위 에이전트도 커밋하지 않는다.
- 소유 파일: `tasks/data-foundation/**`, `tasks/CURRENT_TASK.md`, `tasks/archive/**`, `app/migrations/**`, `app/worker/**`, `app/shared/**`, `app/test/worker/**`, `app/scripts/remote-check.mjs`, `app/scripts/cf.mjs`, `schemas/diary-entry.schema.json`, `docs/DATA_MODEL.md`, `docs/ARCHITECTURE.md`, `docs/EVAL_PLAN.md`, `docs/TRACEABILITY.md`, `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/RISK_REGISTER.md`, `docs/ROADMAP.md`, `harness/work-graph.yaml`, `harness/loop-state.json`, `harness/runtime-profile.json`

## 인수 조건(시험 목록은 PLAN §5)

- 관문 `data-integrity`: F-01·F-02·F-06·F-07·F-09·F-10·F-17이 자동 시험으로 PASS하고, 이 작업의 코드를 담은 커밋에서 CI 초록(`ci-green`).
- 요청서 S-1~S-9마다 결정과 근거가 `docs/DATA_MODEL.md`(필요하면 `docs/DECISIONS.md`)에 있다. 사용자 결정은 사용자가 고른 것만 적는다.
- `0005`부터의 SQL을 새 맥락 검토자가 따로 검토했고 지적을 반영했다.
- 틀린 열쇠 잠금 고침(RK-041)이 시험으로 확인됐다.
- 개발용 건물 원격 검사 PASS, `node scripts/verify.mjs --mode full` PASS.

## 체크포인트

- 준비(2026-10-15, TASK-CLEANUP-01을 마친 세션):
  - 요청서를 썼다(사용자가 "db 스키마 완벽하냐"고 물어 찾은 빈칸 S-1~S-9).
  - 이 절을 세웠다. 끝난 TASK-CLEANUP-01 절은 archive로 옮겼다.
  - 낡은 '커밋 전' 문장을 PR #37 결과로 고쳤다.
  - 이 준비 변경은 PR #37에 커밋으로 올렸다.
  - 다음: 사용자가 PR #37을 병합 → 새 세션이 위 '첫 순서'부터.
- 착수(2026-10-15, 새 세션): 질문 둘(U-1·U-2)을 받고 PLAN을 썼다. 진행은 PLAN §4 체크리스트와 §9 기록에만 적는다.
