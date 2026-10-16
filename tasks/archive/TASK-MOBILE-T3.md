> **아카이브(2026-10-15, TASK-CLEANUP-01에서 옮김).** `tasks/CURRENT_TASK.md`에서 옮긴 기록이다. 옮기기 직전 커밋은 `1845e83`(로컬, 푸시 전)이고 원문(작업 트리, CRLF)은 7,058B, SHA-256 앞 12자리 `cb6a7afad7a5`다. 본문은 고치지 않았고 상대 링크 3개의 경로 깊이만 고쳤다. **상태**: done(2026-10-14) — 뼈대는 로컬 커밋 `323329b`. 인수 조건의 '앱 시험 238건'은 검토 반영 전 값이고 마감 체크포인트의 241건이 마지막 값이다(지금 숫자는 `docs/STATUS.md` §1 숫자 표). **남은 일이 간 곳**: 커밋 푸시·PR → 사용자 몫(`docs/STATUS.md` §4 2번), 작성 화면 아래 버튼 배치(S-07) → `first-slice`(STATUS §4 4번), 미룬 실기기 확인 → `docs/EVAL_PLAN.md` §4 '본인/공개'(`mobile-slice`·`mobile-personal`·공개 관문).

# TASK-MOBILE — T3 Phase 1 뼈대의 모바일 명세와 착수

## 상태

`done`(커밋 전 — 커밋·PR은 사용자 지시 때) — 2026-10-14 사용자 지시("T3 작업 진행을 위한 계획을 세우고 새 세션에서 작업할 수 있게 세팅해놔" → 새 세션에서 "PLAN §0부터"). 같은 날 실행 세션이 0~7단계를 했다. 연습용 서버는 사용자 결정으로 지웠고(PLAN 6-5) 남은 것은 커밋(사용자 답 '아직 하지 않는다')뿐이다. 요청 원문과 답은 [mobile/2026-10-14-t3/REQUESTS.md](../mobile/2026-10-14-t3/REQUESTS.md), 단계·체크리스트·함정·근거는 [mobile/2026-10-14-t3/PLAN.md](../mobile/2026-10-14-t3/PLAN.md) — **PLAN이 이 작업의 유일한 진행 기록이다.** 새 세션은 PLAN §0부터 읽는다. 배경은 [TASK-MOBILE.md](../TASK-MOBILE.md) §8 T3(2026-09-04 초안 — 낡은 전제는 PLAN §3이 바로잡는다).

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
