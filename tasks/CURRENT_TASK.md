# 현재 작업

이 파일에는 **진행 중이거나 곧 시작할 작업만** 둔다. 끝났거나 보류된 작업의 절은 [archive/](archive/README.md)로 옮긴다 — 이 파일이 한 번에 읽히는 크기여야 하고, `scripts/claude-scope-guard.mjs`가 이 파일의 `- 소유 파일:` 선언을 전부 합쳐 허용 목록으로 쓰기 때문이다(끝난 작업의 선언이 남아 있으면 그만큼 가드가 헐거워진다). 그 확인은 이 파일에 `- 동시 작업: 켬` 줄이 있을 때만 켜진다(D-119 — 여러 작업자를 같은 시간에 띄울 때 더하고 끝나면 지운다, AGENTS §2.2). 작업의 진행·증거는 그 작업의 PLAN에만 적고 여기에는 상태 한 줄과 링크만 둔다(D-118). `harness/loop-state.json`의 `task_id`는 아래 절 가운데 진행 중인 것의 머리글과 같아야 한다(`scripts/check-harness.mjs`가 quick에서 확인).

| 작업 | 상태 | 어디에 |
| --- | --- | --- |
| TASK-DATA-01 data-foundation(저장 핵심) | **계획됨(2026-10-15) — 새 세션에서 착수**. PR #37이 `main`에 병합된 뒤 시작한다 | 이 파일 아래, 요청서는 [data-foundation/2026-10-15/](data-foundation/2026-10-15/REQUESTS.md) |
| [TASK-CLEANUP-01](archive/TASK-CLEANUP-01.md) 설계도 정리(감리 결정을 공정표·관문·결정 장부에) | 끝(2026-10-15, 커밋 `85c3bb5` — PR #37, CI 통과·병합 대기) | [archive/](archive/README.md), 요청·계획은 [cleanup/2026-10-15/](cleanup/2026-10-15/PLAN.md) |
| [TASK-REVIEW-01](archive/TASK-REVIEW-01.md) 종합 점검(현황·남은 작업·작업 방식·기술 스택) | 끝(2026-10-15, 커밋 `1845e83` — PR #37) | [archive/](archive/README.md), 보고서 [review/2026-10-14/REPORT.md](review/2026-10-14/REPORT.md) |
| [TASK-MOBILE](TASK-MOBILE.md) 설치형 홈 화면 웹앱 | T2 끝(2026-10-14, PR #36 병합 `7b99e2c`) / T3 끝(2026-10-14, 커밋 `323329b` — PR #37). 결정 D-111~D-115. 이슈 #1~#8 닫음, #9는 Post-MVP(처리표 [cleanup/2026-10-15/PLAN.md](cleanup/2026-10-15/PLAN.md) 6-2) | T3 기록 [archive/TASK-MOBILE-T3.md](archive/TASK-MOBILE-T3.md)와 [mobile/2026-10-14-t3/](mobile/2026-10-14-t3/PLAN.md), T2 기록 [archive/TASK-MOBILE-T2.md](archive/TASK-MOBILE-T2.md)와 [mobile/2026-10-14/](mobile/2026-10-14/PLAN.md), 배경은 별도 파일 |
| [TASK-HOOK-AUTO](archive/TASK-HOOK-AUTO.md) auto 모드에서 가드 훅 확인창 없애기 | 끝 — 구현·검증 2026-09-21(D-060), 남은 '다른 세션 확인 대기'는 2026-10-15 D-119로 닫음 | [archive/](archive/README.md) |
| [TASK-WEB-UI-01](archive/TASK-WEB-UI-01.md) 브라우저 우선 UI 프로토타입 | 구현·PC 검수 완료(2026-09-20). PR #30 병합(2026-09-26, `5fa94a4` — QA #51~#54·D-096까지 함께) | [archive/](archive/README.md) |
| [TASK-WEB-UI-02](archive/TASK-WEB-UI-02.md) 사용자 QA와 디자인 수정 | **완료(2026-10-13)** — 사용자가 시안을 처음부터 써 보고 달력 포함 전체 화면을 승인했다. QA #1~#60, D-048~D-107. 마지막 묶음(#60: 요청 14건·UX 라이팅 원칙·앱 잠금 비밀번호·용어표)은 main `25e0226`·`adad018`. 남은 일은 `docs/STATUS.md` §4 | [archive/](archive/README.md), 2026-10-13 요청·계획은 [qa/2026-10-13/](qa/2026-10-13/PLAN.md) |
| [TASK-SPIKE-02](archive/TASK-SPIKE-02.md) 스파이크 잔여 판정(Phase 1 선행) | **완료(2026-10-14)** — B-02·B-03·B-04·B-05·B-08 pass, B-06 보류 2건, B-07 범위 밖. main `535e714`(PR #35). 남은 일은 `docs/STATUS.md` §3·§4 | [archive/](archive/README.md), 요청·계획·근거는 [spike/2026-10-13/](spike/2026-10-13/PLAN.md) |
| [TASK-DS-REF](TASK-DS-REF.md) 기본 부품 명세를 빠짐없이(D-039·D-097~D-100) | 완료(2026-09-26) — PR #31 병합(`838a0ef`), 이슈 #10~#14 닫음. 남은 일은 `docs/STATUS.md` §4-2로 옮겼다 | 별도 파일(여러 문서가 경로로 인용해 옮기지 않았다). 이 파일의 절(소유 파일 선언)은 뺐다 |
| [TASK-TAXONOMY](TASK-TAXONOMY.md) · [V1](TASK-TAXONOMY-V1.md) · [PLAN-V2](TASK-TAXONOMY-PLAN-V2.md) | 완료(2026-09-05, D-038·D-040 accepted) | 별도 파일(다른 문서가 경로로 인용해 옮기지 않았다) |
| TASK-INFRA-01 · ISSUE-26 · ISSUE-27 · CBM · DESIGN · BOOTSTRAP | 완료·보류 기록 | [archive/](archive/README.md) |

# TASK-DATA-01 — data-foundation(저장 핵심): 일기 창고의 칸과 자물쇠를 짓는다

## 상태

`planned`(2026-10-15) — 사용자 지시("새 세션에서 작업 할 수 있게 남은 작업 전부 해"). 준비는 TASK-CLEANUP-01을 마친 세션이 했고 **실행은 새 세션이 한다.**

새 세션의 첫 순서:
1. PR #37(`docs/cleanup` → `main`)이 병합됐는지 확인한다. 병합 전이면 사용자에게 알리고 기다린다 — 병합은 자동 모드 안전 장치가 막아 사용자가 GitHub에서 누른다.
2. 병합된 `main`에서 새 브랜치를 만든다.
3. 요청서 [data-foundation/2026-10-15/REQUESTS.md](data-foundation/2026-10-15/REQUESTS.md)를 읽는다. §1의 빈칸 S-1~S-9 가운데 사용자 판단이 필요한 것을 질문 창으로 한 번에 묻는다(비유와 추천을 붙여서).
4. 답을 받은 뒤 같은 폴더에 PLAN.md를 쓴다. **그 PLAN이 이 작업의 유일한 진행 기록이다**(D-118).

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
- 소유 파일(예비 — PLAN에서 확정): `tasks/data-foundation/**`, `tasks/CURRENT_TASK.md`, `tasks/archive/**`, `app/migrations/**`, `app/worker/**`, `app/shared/**`, `app/test/worker/**`, `schemas/diary-entry.schema.json`, `docs/DATA_MODEL.md`, `docs/ARCHITECTURE.md`, `docs/EVAL_PLAN.md`, `docs/TRACEABILITY.md`, `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/RISK_REGISTER.md`, `harness/work-graph.yaml`, `harness/loop-state.json`, `harness/runtime-profile.json`

## 인수 조건(예비 — PLAN에서 확정)

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
