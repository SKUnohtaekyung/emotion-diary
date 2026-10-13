# 현재 작업

이 파일에는 **진행 중이거나 곧 시작할 작업만** 둔다. 끝났거나 보류된 작업의 절은 [archive/](archive/README.md)로 옮긴다 — 이 파일이 한 번에 읽히는 크기여야 하고, `scripts/claude-scope-guard.mjs`가 이 파일의 `- 소유 파일:` 선언을 전부 합쳐 허용 목록으로 쓰기 때문이다(끝난 작업의 선언이 남아 있으면 그만큼 가드가 헐거워진다). `harness/loop-state.json`의 `task_id`는 아래 절 가운데 진행 중인 것의 머리글과 같아야 한다(`scripts/check-harness.mjs`가 quick에서 확인).

| 작업 | 상태 | 어디에 |
| --- | --- | --- |
| [TASK-WEB-UI-01](archive/TASK-WEB-UI-01.md) 브라우저 우선 UI 프로토타입 | 구현·PC 검수 완료(2026-09-20). PR #30 병합(2026-09-26, `5fa94a4` — QA #51~#54·D-096까지 함께) | [archive/](archive/README.md) |
| [TASK-WEB-UI-02](archive/TASK-WEB-UI-02.md) 사용자 QA와 디자인 수정 | **완료(2026-10-13)** — 사용자가 시안을 처음부터 써 보고 달력 포함 전체 화면을 승인했다. QA #1~#60, D-048~D-107. 마지막 묶음(#60: 요청 14건·UX 라이팅 원칙·앱 잠금 비밀번호·용어표)은 main `25e0226`·`adad018`. 남은 일은 `docs/STATUS.md` §4 | [archive/](archive/README.md), 2026-10-13 요청·계획은 [qa/2026-10-13/](qa/2026-10-13/PLAN.md) |
| TASK-HOOK-AUTO auto 모드에서 가드 훅 확인창 없애기 | 구현·검증 완료(2026-09-21, D-060 accepted) — 다른 세션에서의 사용자 확인 대기 | 이 파일 아래 |
| [TASK-MOBILE](TASK-MOBILE.md) 설치형 홈 화면 웹앱 | 보류 — Phase 1 착수 시 재개(이슈 #1~#9) | 별도 파일 |
| [TASK-DS-REF](TASK-DS-REF.md) 기본 부품 명세를 빠짐없이(D-039·D-097~D-100) | 완료(2026-09-26) — PR #31 병합(`838a0ef`), 이슈 #10~#14 닫음. 남은 일은 `docs/STATUS.md` §4-2로 옮겼다 | 별도 파일(여러 문서가 경로로 인용해 옮기지 않았다). 이 파일의 절(소유 파일 선언)은 뺐다 |
| [TASK-TAXONOMY](TASK-TAXONOMY.md) · [V1](TASK-TAXONOMY-V1.md) · [PLAN-V2](TASK-TAXONOMY-PLAN-V2.md) | 완료(2026-09-05, D-038·D-040 accepted) | 별도 파일(다른 문서가 경로로 인용해 옮기지 않았다) |
| TASK-INFRA-01 · ISSUE-26 · ISSUE-27 · CBM · DESIGN · BOOTSTRAP | 완료·보류 기록 | [archive/](archive/README.md) |

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
