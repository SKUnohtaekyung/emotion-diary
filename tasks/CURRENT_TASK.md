# 현재 작업

이 파일에는 **진행 중이거나 곧 시작할 작업만** 둔다. 끝났거나 보류된 작업의 절은 [archive/](archive/README.md)로 옮긴다 — 이 파일이 한 번에 읽히는 크기여야 하고, `scripts/claude-scope-guard.mjs`가 이 파일의 `- 소유 파일:` 선언을 전부 합쳐 허용 목록으로 쓰기 때문이다(끝난 작업의 선언이 남아 있으면 그만큼 가드가 헐거워진다). `harness/loop-state.json`의 `task_id`는 아래 절 가운데 진행 중인 것의 머리글과 같아야 한다(`scripts/check-harness.mjs`가 quick에서 확인).

| 작업 | 상태 | 어디에 |
| --- | --- | --- |
| [TASK-WEB-UI-01](archive/TASK-WEB-UI-01.md) 브라우저 우선 UI 프로토타입 | 구현·PC 검수 완료(2026-09-20). PR #30 병합(2026-09-26, `5fa94a4` — QA #51~#54·D-096까지 함께) | [archive/](archive/README.md) |
| [TASK-WEB-UI-02](archive/TASK-WEB-UI-02.md) 사용자 QA와 디자인 수정 | **완료(2026-10-13)** — 사용자가 시안을 처음부터 써 보고 달력 포함 전체 화면을 승인했다. QA #1~#60, D-048~D-107. 마지막 묶음(#60: 요청 14건·UX 라이팅 원칙·앱 잠금 비밀번호·용어표)은 main `25e0226`·`adad018`. 남은 일은 `docs/STATUS.md` §4 | [archive/](archive/README.md), 2026-10-13 요청·계획은 [qa/2026-10-13/](qa/2026-10-13/PLAN.md) |
| [TASK-SPIKE-02](archive/TASK-SPIKE-02.md) 스파이크 잔여 판정(Phase 1 선행) | **완료(2026-10-14)** — B-02·B-03·B-04·B-05·B-08 pass, B-06 보류 2건, B-07 범위 밖. main `535e714`(PR #35). 남은 일은 `docs/STATUS.md` §3·§4 | [archive/](archive/README.md), 요청·계획·근거는 [spike/2026-10-13/](spike/2026-10-13/PLAN.md) |
| TASK-HOOK-AUTO auto 모드에서 가드 훅 확인창 없애기 | 구현·검증 완료(2026-09-21, D-060 accepted) — 다른 세션에서의 사용자 확인 대기 | 이 파일 아래 |
| [TASK-MOBILE](TASK-MOBILE.md) 설치형 홈 화면 웹앱 | **T2 끝(2026-10-14, PR #36 병합 `7b99e2c`) / T3 끝(2026-10-14, 브랜치 `app/scaffold`, 커밋 전 — 사용자 지시 대기)** — 결정 D-111~D-115, T1은 TASK-SPIKE-02에서 일부 실행, 이슈 #1~#9 | 이 파일 아래(T3 소유 파일), T3 요청·계획은 [mobile/2026-10-14-t3/](mobile/2026-10-14-t3/PLAN.md), T2 기록은 [archive/TASK-MOBILE-T2.md](archive/TASK-MOBILE-T2.md)와 [mobile/2026-10-14/](mobile/2026-10-14/PLAN.md), 배경은 별도 파일 |
| TASK-REVIEW-01 종합 점검(현황·남은 작업·작업 방식·기술 스택) | **끝(2026-10-15, 커밋 전 — 커밋은 사용자 지시 때)**. 보고서 [review/2026-10-14/REPORT.md](review/2026-10-14/REPORT.md), 사용자 답 Max·순서 바꿈·관문 둘로·문서 가볍게(REQUESTS '마감 질문') — 결정 기록·공정표 반영은 다음 작업 | 이 파일 아래, 요청·계획은 [review/2026-10-14/](review/2026-10-14/PLAN.md) |
| [TASK-DS-REF](TASK-DS-REF.md) 기본 부품 명세를 빠짐없이(D-039·D-097~D-100) | 완료(2026-09-26) — PR #31 병합(`838a0ef`), 이슈 #10~#14 닫음. 남은 일은 `docs/STATUS.md` §4-2로 옮겼다 | 별도 파일(여러 문서가 경로로 인용해 옮기지 않았다). 이 파일의 절(소유 파일 선언)은 뺐다 |
| [TASK-TAXONOMY](TASK-TAXONOMY.md) · [V1](TASK-TAXONOMY-V1.md) · [PLAN-V2](TASK-TAXONOMY-PLAN-V2.md) | 완료(2026-09-05, D-038·D-040 accepted) | 별도 파일(다른 문서가 경로로 인용해 옮기지 않았다) |
| TASK-INFRA-01 · ISSUE-26 · ISSUE-27 · CBM · DESIGN · BOOTSTRAP | 완료·보류 기록 | [archive/](archive/README.md) |

# TASK-MOBILE — T3 Phase 1 뼈대의 모바일 명세와 착수

## 상태

`done`(커밋 전 — 커밋·PR은 사용자 지시 때) — 2026-10-14 사용자 지시("T3 작업 진행을 위한 계획을 세우고 새 세션에서 작업할 수 있게 세팅해놔" → 새 세션에서 "PLAN §0부터"). 같은 날 실행 세션이 0~7단계를 했다. 연습용 서버는 사용자 결정으로 지웠고(PLAN 6-5) 남은 것은 커밋(사용자 답 '아직 하지 않는다')뿐이다. 요청 원문과 답은 [mobile/2026-10-14-t3/REQUESTS.md](mobile/2026-10-14-t3/REQUESTS.md), 단계·체크리스트·함정·근거는 [mobile/2026-10-14-t3/PLAN.md](mobile/2026-10-14-t3/PLAN.md) — **PLAN이 이 작업의 유일한 진행 기록이다.** 새 세션은 PLAN §0부터 읽는다. 배경은 [TASK-MOBILE.md](TASK-MOBILE.md) §8 T3(2026-09-04 초안 — 낡은 전제는 PLAN §3이 바로잡는다).

## 목표

설계도(PRD §4, ARCHITECTURE §2·§6, UX_SPEC §15~§17, DATA_MODEL §3.10)대로 앱 뼈대(`app-scaffold`)를 세워 새로 만든 개발용 서버에 올리고 iPhone 홈 화면 앱으로 확인해서, Phase 2(직접 작성)를 시작할 때 호스팅·로그인·잠금·화면 이동·배포에 관한 결정을 새로 내리지 않아도 되게 한다.

## 범위

- 포함(사용자 결정 Q1 — 설계도 + 뼈대 + 개발용 서버에서 iPhone 확인): T2가 넘긴 설계 마저 정하기, 화면 도구 결정(조사 뒤 사용자에게), 뼈대 코드(서버·최소 모양의 화면·로그인·세션 기록·잠금·마이그레이션·검사), 개발용 서버 새로 만들기(Q2, 만들기 직전 재확인), iPhone 확인(사용자 조작), 정본·하네스 동기화.
- 제외: 일기 저장(`data-foundation`), 시안 디자인 이식(Phase 2), AI·RAG, 푸시·오프라인·service worker, 운영 서버, Android, 여러 사용자, `web/` 수정.

## 소유권

- Main/Writer: 새 세션. 하위 에이전트는 조사(`researcher`, Sonnet)·병렬 작업자(소유 파일을 나눠서, AGENT_WORKFLOW §10)·마감 검토자(읽기 전용)만 쓰고, 어떤 하위 에이전트도 커밋하지 않는다.
- 소유 파일: `tasks/mobile/2026-10-14-t3/**`, `tasks/CURRENT_TASK.md`, `tasks/TASK-MOBILE.md`, `tasks/archive/**`, `app/**`, `package.json`, `package-lock.json`, `tsconfig*.json`, `eslint.config.*`, `biome.json`, `vite.config.*`, `vitest.config.*`, `wrangler.*`, `.gitignore`, `.github/workflows/harness.yml`, `scripts/verify.mjs`, `PRD.md`, `README.md`, `docs/ARCHITECTURE.md`, `docs/DEPLOY.md`, `docs/DATA_MODEL.md`, `docs/UX_SPEC.md`, `docs/EVAL_PLAN.md`, `docs/RISK_REGISTER.md`, `docs/TRACEABILITY.md`, `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md`, `harness/quality-gates.yaml`, `harness/work-graph.yaml`, `harness/runtime-profile.json`, `harness/loop-state.json`, `work/**`, `.claude/launch.json`(로컬 미리보기 설정 `app-local` 한 줄 — 2026-10-14 실행 중에 더했고 사후에 선언했다)

(루트의 도구 설정 파일은 화면 도구·검사 도구를 정한 뒤 실제로 쓰는 것만 만든다. `work/`는 Git 제외다.)

## 인수 조건

- [x] 명세: T2가 T3로 넘긴 것(PLAN §3의 표)이 정본에 결정과 근거와 함께 있다(파일·절). — ARCHITECTURE §11(새 버전 §11.4·환경 분리 §11.2·오류 보기 §11.5·주소 §11.3·설정 값 §11.2·헤더 §11.6·확장 규칙 §11.9), DEPLOY.md, DATA_MODEL §3.4·§3.9·§3.10·§3.11·§9, D-114·D-115. 실기기가 답할 셋(잠금 시점·덮개 스냅샷·암호 보관함)은 사용자 결정으로 미뤘고 그 사실과 잠정 규칙이 §6·§4.1·UX_SPEC §15에 있다.
- [x] 뼈대: `app-scaffold`의 게이트 `code-quality` 통과(npm 10.9.2 `npm ci` 두 번 같은 결과, full 안에서 lint·typecheck·test·build PASS, 미사용 변수 함정 → lint 종료 코드 1 — PLAN 4-1·4-6·4-7) — 잠금 파일로 두 번 깨끗이 설치해 같은 결과, lint·typecheck·test·build가 `package.json`에 있고 full에서 PASS, lint가 일부러 넣은 오류 1건을 실제로 잡는다.
- [x] 계약 검사: EVAL F-22·F-23과 새로 더한 뼈대 검사가 자동 테스트로 PASS, 개발용 서버의 원격 검사 PASS. — 앱 시험 238건(F-22·F-23·F-25~F-28, 단 F-22·F-23의 작성·전체 삭제 두 줄은 data-foundation — T3 A-18), 결함 주입 7종 모두 잡음, 원격 검사 34/34(최종 빌드 `20261014105614-7b99e2c`).
- [x] iPhone: PLAN §7 6단계의 항목마다 PASS/FAIL/미검증과 근거. — 1회차 S-01·S-02 PASS, S-12 화면 쪽 PASS, S-07 '가린다', 나머지는 사용자 결정 '전부 미룬다'로 미검증(대신한 근거 함께).
- [x] 지킨 것: 운영 서버 0, 실제 일기 0, 커밋될 내용에 계정 식별값·비밀값 0(스캔 근거). — 운영은 이름만(만들지 않음), 실제 일기 0(1회차에 사용자가 넣은 실제 이름은 끝 정리에서 지움 — 0행 확인), 실제 값 17종 스캔 0건 + `verify` quick의 상시 모양 검사.
- [x] 마감: 새 맥락 읽기 전용 검토자의 '짓는 사람 시험' 통과, `node scripts/verify.mjs --mode full` PASS, PLAN에 열린 항목 0(미룬 것은 이유와 함께). — 첫 검토 '조건부 통과'(남은 셋: 잠금 시점·날짜 경로·본문 한도) → 반영(§11.9·§6 잠정 규칙) 뒤 같은 검토자의 재검토는 PLAN 7-2, full은 7-4.

## 체크포인트

- 계획(2026-10-14, T2를 마친 세션): 사용자 질문 네 개의 답을 받았다 — T3 범위는 설계도 + 뼈대 + 개발용 서버에서 iPhone 확인 / 개발용 서버는 새로 만든다 / 화면 오류는 개발용에서만 모은다 / 앱 전환 화면은 잠금과 상관없이 모두 가린다. 뒤의 둘은 D-113. T2 절은 `tasks/archive/TASK-MOBILE-T2.md`로 옮겼다. 아직 코드·서버는 없다. 다음: 새 세션이 PLAN §0.2부터.
- 실행(2026-10-14 저녁, 브랜치 `app/scaffold`, 커밋 전): 0~5단계 끝 — 공법 D-114(사용자: 도구 없이), 구성 D-115(에이전트), 뼈대 코드 `app/**`·설정 파일, 앱 시험 218건, full PASS, 개발용 건물(Worker·D1 `emotion-diary-dev`) 만들어 원격 검사 34/34. 6단계 iPhone 1회차를 사용자에게 보냈다(PLAN 6-3 표, 안내 `mobile/2026-10-14-t3/PHONE-GUIDE.md`). 새 맥락 검토자(7-1)는 병렬로 진행 중. 다음: iPhone 결과 → 6-3·6-4 → 검토 반영 → 7-3 동기화 → full. 상세는 PLAN '진행 기록'.
- 마감(2026-10-14 밤): 7단계까지 끝 — iPhone은 1회차 뒤 사용자 결정 '전부 미룬다', 독립 검토 2회 반영, 개발용 열쇠 43자로 교체·개발용 데이터 비움, 마지막 판 원격 검사 34/34, full PASS(앱 시험 241건). 그 뒤 사용자 답: 커밋은 아직 하지 않는다, 연습용 서버는 지운다(지웠다 — PLAN 6-5). 남은 사용자 결정: 커밋·PR(지시 때), 작성 화면 버튼 배치(Phase 2 전), 미룬 실기기 확인. 사용자 확인 뒤 이 절을 `tasks/archive/`로 옮긴다.

# TASK-REVIEW-01 — 종합 점검: 현황·남은 작업·작업 방식·기술 스택

## 상태

`done`(2026-10-15, 커밋 전 — 커밋은 사용자 지시 때. PLAN 1~6단계 전부 체크, 보고서 REPORT.md 확정, 마감 질문 네 개의 답을 REQUESTS에 기록. 사용자 확인 뒤 이 절을 `tasks/archive/`로 옮긴다) — 2026-10-14 사용자 지시("새 세션에서 지금까지의 작업 현황을 싹 다 분석하고, 나머지 해야 할 작업들도 싹 분석 한 후 … 판단하려고 하는 작업을 시킬거야", "남은 작업 자체를 좀 비판적이고, 독립적으로 분석해서 더 좋은 작업 방법과 방식이 있는지를 생각하라는 거야"). 계획은 TASK-MOBILE T3를 마친 세션이 세웠고 **실행은 새 세션이 한다.** 요청 원문과 답은 [review/2026-10-14/REQUESTS.md](review/2026-10-14/REQUESTS.md), 단계·검토자·잣대·함정은 [review/2026-10-14/PLAN.md](review/2026-10-14/PLAN.md) — **PLAN이 이 작업의 유일한 진행 기록이다.** 새 세션은 PLAN §0부터 읽는다.

## 목표

지금까지의 현황과 남은 작업을 독립적·비판적으로 감정해 작업 방식·이슈·계획과 DB·백엔드·프론트엔드 기술 스택이 서비스의 방향과 향후 계획에 비춰 최선인지 판정하고, 더 나은 길이 있으면 대안 계획으로 낸다(고르는 것은 사용자).

## 범위

- 포함: 정본·결정·위험·이슈·하네스·작업 기록·`app/`·`web/` 구조 읽기, 공식 문서로 기술 대안 재확인, 영역별 독립 검토자 다섯 + 백지 설계 하나 + 반대 입장 하나(사용자 답 Q3), 보고서.
- 제외: 코드·정본·하네스·서버 변경, 커밋·푸시·PR, 사용자 휴대폰 조작 요청. 사용자 결정도 다시 열어 권고할 수 있으나(Q1) 뒤집지 않는다.

## 소유권

- Main/Writer: 새 세션. 하위 에이전트는 읽기 전용 검토자(Sonnet)뿐이고 어떤 하위 에이전트도 커밋하지 않는다.
- 소유 파일: `tasks/review/2026-10-14/**`, `tasks/CURRENT_TASK.md`

## 인수 조건

- [x] `tasks/review/2026-10-14/REPORT.md`가 PLAN §7 목차를 채웠고 판정마다 근거와 사실/추론/미확인 구분이 있다. — REPORT §1~§8, 머리말의 표기 규칙(사실·추론·미확인, 사용자 결정 표시).
- [x] 기술 스택마다 '기준 → 기준이 맞나 → 대안(바꾸는 비용) → 판정'이 본인 전용·공개 서비스 따로 있다(Q2). — REPORT §5.1~§5.5, 갈림길 §5.6.
- [x] 남은 작업은 백지 설계안과 기존 계획을 견준 대안 계획이 있다. — REPORT §3.1(견줌)·§3.2(일마다 판정)·§3.3(대안 계획과 득실).
- [x] 검토자 보고(영역별 다섯·백지·반대)와 충돌 판정이 있다(Q3). — `review/2026-10-14/reviews/` 일곱 원문, REPORT §7.2 재측정·§7.3 충돌 C-1~C-11·§7.4 반대 검토 17건 반영.
- [x] '사용자가 정할 것' 목록(추천)이 있다. 이 폴더와 이 파일 밖 변경 0, `node scripts/verify.mjs --mode quick` PASS. — REPORT §1.2 Q-A~Q-G(넷은 질문 창으로 답 받음), 지문 시작 값과 같음·quick PASS(PLAN 6-2).

## 체크포인트

- 계획(2026-10-14, TASK-MOBILE T3를 마친 세션): 사용자 질문 네 개의 답(사용자 결정도 다시 열어도 됨 / 본인 전용·공개 따로 판정 / 영역별 독립 검토자 여럿 / 저장소 안 분석 문서). 다음: 새 세션이 PLAN §0.2부터.
- 실행(2026-10-14~15, 새 세션): 1~4단계 끝 — FACTS.md, 검토자 여섯 보고(`review/2026-10-14/reviews/`), 메인 재측정, REPORT.md 초안. 5단계 R-RED 진행 중. 다음: R-RED 반영 → 6단계(quick·지문·질문 창). 상세는 PLAN 체크리스트와 '진행 기록'.
- 마감(2026-10-15): R-RED 17건 반영(16 반영·1 일부), REPORT 확정, quick PASS·지문 시작 값과 같음, 질문 창 답(Max / 순서 바꿈 / 관문 둘로 / 문서 가볍게). 다음 작업(사용자 지시 때): 이 답을 `docs/DECISIONS.md`·공정표·관문에 옮기는 정리 작업(REPORT §3.3 0단계)과 Q-E~Q-G 확인, 커밋.

# TASK-HOOK-AUTO — auto 모드에서 가드 훅이 확인창을 띄우지 않게

## 상태

`in_progress`(구현·검증 완료, 다른 세션에서의 사용자 확인만 남음) — 2026-09-21 사용자 지시("자동모드 켜면 수락 버튼 안나오게"), 계획 승인("진행"). 작업 트리는 TASK-WEB-UI-02를 하는 다른 세션과 같이 쓰므로 **이 절의 소유 파일만** 다루고 그 세션의 파일은 건드리지 않는다. 커밋은 사용자가 지시할 때만 한다.

## 목표

권한 모드가 `auto`일 때 `scripts/claude-scope-guard.mjs`·`scripts/claude-git-guard.mjs`가 사용자 확인창을 띄우지 않는다. `auto`가 아닌 모드는 종전대로 확인하되, Claude Code 자신의 작업 폴더(세션 scratchpad·자동 메모리)는 어느 모드에서나 확인 대상이 아니다. 동기는 세션 기록 실측 — 훅이 낸 확인 94건 가운데 77건이 그 작업 폴더 쓰기였고(나머지는 git 16·기타 프로젝트 밖 1) 소유 파일 가드는 `?theme=pebble` 토큰 때문에 29회 크래시했다(설계와 근거는 D-060, `docs/PROCESS_LOG.md` §5).

## 범위

- 포함: 두 가드의 권한 모드 인식(`permission_mode`)·서브에이전트 구분(`agent_id`), 소유 파일 가드의 `?` 크래시 수정과 작업 폴더 제외, 두 테스트 파일 확장(크래시 감지·`?` 회귀·실제 CURRENT_TASK 스모크), AGENTS §2.1·§2.2·DECISIONS·PROCESS_LOG·TRACEABILITY·RISK_REGISTER 동기화.
- 제외: 소유 파일 밖 쓰기의 사후 점검(이슈 #27의 "세션 경계 스냅샷"), Codex 쪽 훅(AGENTS §2.3), 앱 자체가 띄우는 창(브라우저 사이트 허용 등), `bypassPermissions` 모드 처리, `.claude/settings.json` 변경.

## 소유권

- Main/Writer: 이 세션. 하위 에이전트는 실측 한 번(`agent_id` 도착 확인)만 하고 파일을 쓰지 않는다.
- 소유 파일: `scripts/claude-scope-guard.mjs`, `scripts/claude-git-guard.mjs`, `scripts/test-claude-scope-guard.mjs`, `scripts/test-claude-git-guard.mjs`, `AGENTS.md`, `docs/PROCESS_LOG.md`, `docs/DECISIONS.md`, `docs/TRACEABILITY.md`, `docs/RISK_REGISTER.md`

(DECISIONS는 D-060 행, TRACEABILITY는 AG-HARNESS-001 행, RISK_REGISTER는 RK-011 행만 고친다. `tasks/CURRENT_TASK.md`와 `tasks/archive/*`는 TASK-WEB-UI-02 선언에 이미 있다.)

## 인수 조건

- [x] `auto`에서 정상 작업 중 확인창 0회·훅 오류 알림 0회 — 과거 기록 재적용(세션 기록 16개, 모드 auto): Write·Edit 727건 확인 0건·훅 오류 0건, Bash 888건 확인 0건(수정 전 기록: 확인 94건·오류 29건). 이 세션(auto)에서는 수정 뒤 Write·Edit·Bash 42건에 훅의 ask·오류 기록이 0건이고, 예전에 창이 뜨던 종류인 scratchpad 쓰기를 직접 해 그대로 통과했다. 하위 에이전트의 커밋·푸시는 예외로 확인을 유지한다(파이프 테스트, 실측한 `agent_id`).
- [x] `auto`가 아니면 scratchpad·자동 메모리 밖의 소유 밖 쓰기와 커밋·푸시는 종전대로 확인하고, 모드를 알 수 없으면(`permission_mode` 없음) 안전 쪽(확인)으로 동작한다 — 파이프 테스트(default·acceptEdits·plan, 모드 필드 없음).
- [x] 두 가드 테스트가 새 동작(모드·작업 폴더·서브에이전트)과 `?` 회귀, 훅 종료 코드 검사, 실제 `tasks/CURRENT_TASK.md`로 한 번 돌리는 스모크를 담고 통과한다 — 소유 파일 가드 30건·git 가드 25건. 수정 전 가드(HEAD)에서는 16건·5건이 실패해 회귀 감지력을 확인했다.
- [ ] `node scripts/verify.mjs --mode quick`·`--mode full` PASS(완료, exit 0)와 이 세션에서 확인창이 사라진 것(완료). **남음: 다른 세션(`6c7f82b8`)에서 사용자가 확인창이 뜨지 않는지 본다** — 그 세션은 지금 쉬고 있어 새 기록이 없고, 훅은 호출마다 새로 실행되므로 그 세션의 다음 쓰기부터 적용된다.
- [x] AGENTS §2.1·§2.2, D-060, PROCESS_LOG §5, RK-011, AG-HARNESS-001을 코드와 맞췄다. 사용자 확인 뒤 이 절을 `tasks/archive/TASK-HOOK-AUTO.md`로 옮긴다(끝난 작업의 선언이 남으면 가드가 헐거워진다).

## 체크포인트

- 착수(2026-09-21): 원인 진단은 세션 기록 재적용(확인 94건 = scratchpad 47·자동 메모리 30·기타 프로젝트 밖 1·git 16, 프로젝트 안 0건 / 훅 크래시 29회)과 스크린샷 재현으로 끝났다. 공식 문서상 훅 입력에 `permission_mode`·`scratchpad_dir`·`transcript_path`가 있고 서브에이전트 호출에는 `agent_id`가 붙는다 — 이 앱 런타임에서 실제로 오는지는 아래 "실측 완료"에서 확인했다.
- 실측 완료(2026-09-21): 가드에 임시 프로브를 넣어 이 앱(Claude Code 2.1.275)의 PreToolUse 입력을 기록했다. 주 에이전트 호출은 `permission_mode: "auto"`·`scratchpad_dir`(짧은 이름 표기 NOHTAE~1)·`transcript_path`(긴 이름 표기)가 오고, 하위 에이전트(`verifier`)의 Bash 호출에는 `agent_id`·`agent_type`이 붙으며 `permission_mode`는 auto를 이어받는다. 프로브는 지웠고 `PROBE-TEMP` 잔존은 0건이다.
- 구현 완료(2026-09-21): 소유 파일 가드 — 모드 인식, 작업 폴더 제외(실경로로 맞춰 짧은·긴 이름 혼용 대응), `?`를 글자로 취급, 패턴 하나가 깨져도 훅이 죽지 않게 try/catch. git 가드 — auto의 주 에이전트만 통과하고 하위 에이전트는 사유를 바꿔 확인. 테스트는 소유 파일 가드 11→30건, git 가드 15→25건. 모든 케이스가 훅 종료 코드 0을 요구한다(죽은 훅은 stdout이 비어 pass로 보인다).
- 검증(2026-09-21): 위 인수 조건의 수치. `node scripts/verify.mjs --mode quick`·`--mode full` PASS(exit 0, `npm run test` 안에서 가드 테스트 30건·25건 포함). 과거 호출 재적용에서 default 모드를 넣으면 프로젝트 안 소유 밖 218건·기타 프로젝트 밖 3건·git 52건이 확인으로 남는다 — 설계대로이며, 옛 훅은 그 자리에서 크래시해 조용히 통과시켰다.
- 함정(다음 세션용): 도구 호출 매개변수에서 백슬래시 두 개가 하나로 줄어든다(Bash heredoc로 쓴 스크립트의 정규식 리터럴이 구문 오류가 됐다). 정규식·경로 이스케이프는 그 줄을 건드리지 않고 좁게 고치거나 `String.fromCharCode(92)`를 쓴다. 같은 파일에 편집을 동시에 보내지 않는다.
- 남은 것: ① 다른 세션에서 확인창이 안 뜨는지 사용자 확인 → 확인되면 이 절을 `tasks/archive/TASK-HOOK-AUTO.md`로 옮기고 위 표를 갱신 ② (이번 범위 밖) 소유 파일 밖 쓰기의 사후 점검 — 이슈 #27의 세션 경계 스냅샷 ③ `bypassPermissions`를 쓰게 되면 같은 처리를 할지 결정 ④ 결정 번호 D-060은 이 작업이 썼다 — TASK-WEB-UI-02의 다음 신규 번호는 D-061이다.
