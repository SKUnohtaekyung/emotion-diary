> **아카이브(2026-10-15, TASK-CLEANUP-01에서 옮김).** `tasks/CURRENT_TASK.md`에서 옮긴 기록이다. 옮기기 직전 커밋은 `1845e83`이고 원문(작업 트리, CRLF)은 7,010B, SHA-256 앞 12자리 `8528c181160e`다. 본문은 고치지 않았고 상대 링크 0개의 경로 깊이만 고쳤다(아래 상태 줄의 `in_progress`는 옮기기 전 표기 그대로다). **상태**: done — 구현·검증은 2026-09-21에 끝났고(D-060), 24일째 남아 있던 '다른 세션(`6c7f82b8`)에서의 사용자 확인'은 2026-10-15 D-119로 뜻을 잃어 닫는다 — 소유 파일 확인이 '동시 작업 때만' 켜지게 되어, 차례로 일하는 기본 상태에서는 그 훅이 확인창을 낼 일이 없다(auto의 커밋 훅 동작은 D-060 그대로). 감리 사실표 §K의 K-9. **남은 일이 간 곳**: ② 소유 파일 밖 쓰기의 사후 점검(이슈 #27의 세션 경계 스냅샷) → D-060·D-119의 다시 열 조건, ③ `bypassPermissions` → D-060 재검토 조건. ④의 결정 번호 안내는 낡았다 — 다음 번호는 `docs/DECISIONS.md` 표의 마지막 행으로 확인한다.

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
