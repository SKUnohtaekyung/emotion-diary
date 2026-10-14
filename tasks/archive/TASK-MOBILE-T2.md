> **아카이브(2026-10-14, TASK-MOBILE T3 준비 때 옮김).** `tasks/CURRENT_TASK.md`에서 옮긴 기록이다. 옮기기 직전 커밋은 `7b99e2c`(PR #36 병합)이고 원문은 3,635B, SHA-256 앞 12자리 `268d14d1fdf8`다. 본문은 고치지 않았고 상대 링크 3개의 경로 깊이만 고쳤다(아래 상태 줄의 `in_progress`는 옮기기 전 표기 그대로다). **상태**: done — 정본 동기화·독립 검토 2회·full PASS를 거쳐 2026-10-14 main에 합쳐졌다(`aefcef7`, PR #36). **남은 일이 간 곳**: T3(Phase 1 뼈대의 모바일 명세와 착수) → `tasks/mobile/2026-10-14-t3/PLAN.md`, `mobile-core-flow`의 Android 요구 → `docs/STATUS.md` §4, 앱 전환 화면 가림 → D-113으로 정해짐.

# TASK-MOBILE — T2 정본 동기화 (Phase 1 착공 전 마지막 문서 작업)

## 상태

`in_progress`(T2 끝, 커밋 대기 — T3는 이 작업 밖) — 2026-10-14 사용자 지시. 요청 원문과 답은 [mobile/2026-10-14/REQUESTS.md](../mobile/2026-10-14/REQUESTS.md), 변경 지도·사실표·체크리스트·근거는 [mobile/2026-10-14/PLAN.md](../mobile/2026-10-14/PLAN.md)에 둔다 — **PLAN이 이 작업의 유일한 진행 기록이다.** 배경(조사·누락 목록 G-01~G-19·작업 분할)은 [TASK-MOBILE.md](../TASK-MOBILE.md). 이 절에는 요약만 적는다.

## 목표

정본 문서를 D-111의 구성(Worker 하나가 화면과 `/api/*`를 같은 주소에서 냄, 설치형 홈 화면 웹앱)으로 고쳐 써서, 다음 작업자가 `PRD.md` §4와 `docs/ARCHITECTURE.md` §2·§6만 읽어도 앱 뼈대의 호스팅·로그인·화면 이동을 틀리지 않게 지을 수 있게 한다.

## 범위

- 포함: TASK-MOBILE §8 T2의 정본 동기화, 2026-10-13~14 실기기 결과의 문서 반영, TASK-SPIKE-02 절 아카이브와 loop-state 정리, 이번에 사용자가 정한 것의 결정 기록(D-112).
- 제외: 앱 코드, `web/` 화면 시안, T3(Phase 1 뼈대의 모바일 명세), 푸시 알림·오프라인·프레임워크 선택(논의가 나오면 기록만), Cloudflare에 올리는 일, 커밋·푸시(사용자 지시 때만).

## 소유권

- Main/Writer: 이 세션. 하위 에이전트는 `researcher`(공식 문서 확인)와 마감 검토자(읽기 전용)만 쓴다.
- 소유 파일: `tasks/mobile/**`, `tasks/CURRENT_TASK.md`, `tasks/TASK-MOBILE.md`, `tasks/archive/**`, `PRD.md`, `README.md`, `docs/ARCHITECTURE.md`, `docs/UX_SPEC.md`, `docs/EVAL_PLAN.md`, `docs/RISK_REGISTER.md`, `docs/TRACEABILITY.md`, `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md`, `docs/DATA_MODEL.md`, `harness/quality-gates.yaml`, `harness/work-graph.yaml`, `harness/runtime-profile.json`, `harness/loop-state.json`

## 인수 조건

- [x] `PRD.md` §4와 `docs/ARCHITECTURE.md` §2·§6만 읽어도 호스팅·로그인·화면 이동을 만들 수 있다 — 새 맥락 읽기 전용 검토자: 1차 '미충족'(높음 3) → 반영 → 재검토 '충족'(남은 중간 4·낮음 10도 반영). T3로 넘긴 것은 뼈대를 막지 않는다는 판정. 근거 PLAN '검토 지적 처리'·A-13·A-14
- [x] `PRD.md`·`docs/`·`README.md`에서 "Pages"가 전부 '예전 후보·교정됨' 문맥으로만 남는다 — 10줄, 검토자가 한 줄씩 판정(README 0줄).
- [x] TASK-MOBILE §5의 G-01~G-19 각각에 반영한 곳(파일·절) 또는 미룬 이유가 PLAN의 표에 있다 — 검토자가 행마다 원문 확인.
- [x] PLAN 사실표의 값이 모든 문서에서 같다 — 숫자별 grep 대조(검토자 1·2차, 에이전트).
- [x] `node scripts/verify.mjs --mode full` PASS(2026-10-14 `37/37 PASS, 0 FAIL`, 마지막 반영 뒤), PLAN에 열린 항목 없음 — 미룬 것 M-2~M-7은 이유와 갈 곳이 적혀 있다.

## 체크포인트

- 착수(2026-10-14): 읽기 단계에서 변경 지도와 사실표를 보였고, 질문 여덟 개의 답을 받았다(REQUESTS). TASK-SPIKE-02 절을 `tasks/archive/TASK-SPIKE-02.md`로 옮겼다. 이후 진행은 PLAN의 체크리스트에만 적는다.
- 마감(2026-10-14): 정본 동기화 → 독립 검토(높음 3) → 사용자에게 네 가지를 다시 물음(Q9~Q12) → 반영 → 재검토(충족) → 남은 지적 반영 → full PASS. 커밋 지시는 아직 없다. 커밋 뒤 이 절을 `tasks/archive/`로 옮긴다. 다음은 T3(사용자 착수 승인 필요).
