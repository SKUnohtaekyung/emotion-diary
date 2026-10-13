# 현재 작업

이 파일에는 **진행 중이거나 곧 시작할 작업만** 둔다. 끝났거나 보류된 작업의 절은 [archive/](archive/README.md)로 옮긴다 — 이 파일이 한 번에 읽히는 크기여야 하고, `scripts/claude-scope-guard.mjs`가 이 파일의 `- 소유 파일:` 선언을 전부 합쳐 허용 목록으로 쓰기 때문이다(끝난 작업의 선언이 남아 있으면 그만큼 가드가 헐거워진다). `harness/loop-state.json`의 `task_id`는 아래 절 가운데 진행 중인 것의 머리글과 같아야 한다(`scripts/check-harness.mjs`가 quick에서 확인).

| 작업 | 상태 | 어디에 |
| --- | --- | --- |
| [TASK-WEB-UI-01](archive/TASK-WEB-UI-01.md) 브라우저 우선 UI 프로토타입 | 구현·PC 검수 완료(2026-09-20). PR #30 병합(2026-09-26, `5fa94a4` — QA #51~#54·D-096까지 함께) | [archive/](archive/README.md) |
| [TASK-WEB-UI-02](archive/TASK-WEB-UI-02.md) 사용자 QA와 디자인 수정 | **완료(2026-10-13)** — 사용자가 시안을 처음부터 써 보고 달력 포함 전체 화면을 승인했다. QA #1~#60, D-048~D-107. 마지막 묶음(#60: 요청 14건·UX 라이팅 원칙·앱 잠금 비밀번호·용어표)은 main `25e0226`·`adad018`. 남은 일은 `docs/STATUS.md` §4 | [archive/](archive/README.md), 2026-10-13 요청·계획은 [qa/2026-10-13/](qa/2026-10-13/PLAN.md) |
| TASK-SPIKE-02 스파이크 잔여 판정(Phase 1 선행) | **판정·정리 끝(2026-10-14), 커밋은 사용자 지시 대기** — B-02·B-03·B-08·B-04·B-05·B-06의 남은 항목을 pass / fail / 보류로 판정. B-07은 범위 밖 | 이 파일 아래, 요청·계획은 [spike/2026-10-13/](spike/2026-10-13/PLAN.md) |
| TASK-HOOK-AUTO auto 모드에서 가드 훅 확인창 없애기 | 구현·검증 완료(2026-09-21, D-060 accepted) — 다른 세션에서의 사용자 확인 대기 | 이 파일 아래 |
| [TASK-MOBILE](TASK-MOBILE.md) 설치형 홈 화면 웹앱 | **제안 승인(2026-10-14, D-111)** — T1은 TASK-SPIKE-02에서 일부 실행. 다음은 T2 정본 동기화(아직 시작 안 함, 이슈 #1~#9) | 별도 파일 |
| [TASK-DS-REF](TASK-DS-REF.md) 기본 부품 명세를 빠짐없이(D-039·D-097~D-100) | 완료(2026-09-26) — PR #31 병합(`838a0ef`), 이슈 #10~#14 닫음. 남은 일은 `docs/STATUS.md` §4-2로 옮겼다 | 별도 파일(여러 문서가 경로로 인용해 옮기지 않았다). 이 파일의 절(소유 파일 선언)은 뺐다 |
| [TASK-TAXONOMY](TASK-TAXONOMY.md) · [V1](TASK-TAXONOMY-V1.md) · [PLAN-V2](TASK-TAXONOMY-PLAN-V2.md) | 완료(2026-09-05, D-038·D-040 accepted) | 별도 파일(다른 문서가 경로로 인용해 옮기지 않았다) |
| TASK-INFRA-01 · ISSUE-26 · ISSUE-27 · CBM · DESIGN · BOOTSTRAP | 완료·보류 기록 | [archive/](archive/README.md) |

# TASK-SPIKE-02 — 스파이크 잔여 판정 (Phase 1의 선행)

## 상태

`in_progress` — 2026-10-13 사용자 지시. 요청 원문과 답은 [spike/2026-10-13/REQUESTS.md](spike/2026-10-13/REQUESTS.md), 계획·근거·판정은 [spike/2026-10-13/PLAN.md](spike/2026-10-13/PLAN.md), 사용자가 휴대폰으로 하는 확인의 순서는 [spike/2026-10-13/PHONE-GUIDE.md](spike/2026-10-13/PHONE-GUIDE.md)에 둔다. 이 절에는 요약만 적는다.

## 목표

2026-09-02 스파이크에서 partial로 남은 게이트(B-02·B-03·B-08, B-04, B-05, B-06)의 남은 항목을 하나씩 pass / fail / 보류(이유)로 판정하고, `app-scaffold`를 열 수 있는지와 TASK-MOBILE 결정에 필요한 근거를 정리한다. TASK-MOBILE을 받을지는 사용자가 정한다.

## 범위

- 포함: 공식 문서 확인(무료 한도·Access·보존), 비밀값 스캔, 기존 연습용 Worker·D1(`emotion-diary-spike`)을 고쳐 다시 올리기(사용자 승인 2026-10-13, 올리기 직전 변경 요약 재확인), iPhone 실기기 확인(사용자 조작), 원격 D1·작업 큐·`claude -p` 추가 검증, 판정에 따른 정본 동기화.
- 제외: B-07(검색 계층, RAG 트랙), `web/` 화면 시안, 앱 코드(Phase 1), Cloudflare 자원 신규 생성, 유료 자원, Cloudflare Access 실제 활성화(문서 판정만 — 사용자 결정), Android 실기기(기기 없음 — 보류로 남긴다), TASK-MOBILE 결정 자체.

## 소유권

- Main/Writer: 이 세션. 하위 에이전트를 쓰면 `researcher`·`verifier`(읽기 전용)만 쓴다.
- 소유 파일: `tasks/spike/**`, `tasks/CURRENT_TASK.md`, `tasks/TASK-MOBILE.md`, `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/ARCHITECTURE.md`, `docs/EVAL_PLAN.md`, `docs/DATA_MODEL.md`, `docs/RISK_REGISTER.md`, `docs/TRACEABILITY.md`, `README.md`, `docs/SAFETY_POLICY.md`, `docs/UX_SPEC.md`, `docs/AI_RAG_SPEC.md`, `harness/work-graph.yaml`, `harness/loop-state.json`, `harness/runtime-profile.json`, `work/spikes/**`

(정본 문서는 판정이 바뀌는 행·절만 고친다. `tasks/TASK-MOBILE.md`는 §10 체크포인트·§11 검증 증거에 실기기 결과만 적고 결정 초안은 건드리지 않는다. `work/`는 Git 제외다.)

## 인수 조건

- [x] 남은 게이트 전부에 판정(pass / fail / 보류와 이유)과 근거(명령·결과·캡처 파일명)가 PLAN에 있다 — B-02·B-03·B-04·B-05·B-08 pass, B-06 보류 2건(거절 응답 미재현, 구독 한도 비율 미계산), PLAN '판정표'.
- [x] `app-scaffold`를 열 수 있는지, 못 연다면 무엇이 막는지가 한 문단으로 정리돼 있다 — 열 수 있다(조건 둘), PLAN과 `docs/STATUS.md` §3.
- [x] TASK-MOBILE 결정에 필요한 근거가 한곳에 모여 있다(결정은 사용자) — PLAN 'TASK-MOBILE 결정용 근거', `tasks/TASK-MOBILE.md` §11. 못 본 것 5건(12시간 뒤 세션·자판·5분 떠났다 오기·아이콘 재추가·'웹 앱으로 열기'를 끈 경우)은 그대로 적었다.
- [x] `docs/STATUS.md` §3 표, `work-graph`, `loop-state`, `runtime-profile`, 관련 결정 문서가 같은 변경에서 맞춰져 있다 — D-108~D-110, RK-034·RK-035, ARCHITECTURE §10, EVAL_PLAN §4, DATA_MODEL §8, TRACEABILITY.
- [x] `node scripts/verify.mjs --mode full` PASS — 2026-10-14 `37/37 PASS, 0 FAIL`, `PASS: full 검증 완료`(판정 뒤, 독립 검토 반영 뒤, 정리 뒤 각각).

## 체크포인트

- 착수(2026-10-13): 문서와 `work/spikes/g2a-cloudflare/`를 읽고 게이트별 표를 사용자에게 보였다. 사용자 답 — 기존 연습용 자원을 고쳐 쓴다 / 기기는 iPhone만(Android·Mac 없음) / Access는 공식 문서로만 판정 / 백업 보관 30일. 아직 실행한 명령은 없다.
- 문서·로컬 확인 완료(2026-10-13): 무료 한도·D1 운영 특성·Access·보존 설정을 공식 문서로 확인하고(PLAN A-1~A-5), 비밀값 스캔 0건(로컬 테스트 파일에 적혀 있던 로컬 전용 값 1건은 옮겨서 해소), 연습용 서버를 로컬에서 고쳐 기존 22건·추가 30건 PASS(PLAN B-1~B-4). **원격에는 아직 아무것도 올리지 않았다.** 막힌 것 둘 — Cloudflare 로그인 만료(`wrangler whoami` 실패), 이 PC의 `claude` 명령줄 로그인 만료(`claude auth status`의 loggedIn이 false). 다음: 사용자에게 변경 요약을 보이고 올리기 승인과 두 로그인을 받는다 → 원격 검사 → iPhone 안내(PHONE-GUIDE) → B-04·B-05·B-06.
- 원격 검사 완료(2026-10-13): 사용자가 두 로그인을 하고 "일단 나 혼자 쓸거임 올려"라고 답했다 — **본인 1명 전제로 판정**(다중 사용자 여부는 미뤄 둔 결정), 올리기 승인. 연습용 서버를 Worker 하나 + 정적 파일 구성으로 다시 올렸다(버전 `5d574b9a`). 원격 22/22·30/30 PASS, 복구 실습(지운 행 복구 → 복구 되돌림), 서버 기록에 열쇠·글 0건, 실제 PC worker로 실패·만료·정상 10회(PC 안 p50 10.8초 / p95 13.1초). 모델 검사: 명시 위기 3문장 모두 감지(1문장은 첫 호출이 턴 제한으로 실패해 다시 불러 확인), 독립 검증 5/5, 대화 기록 미저장 확인. **접근 열쇠는 지금 휴대폰용 12글자다 — 끝나면 긴 열쇠로 되돌린다(F-1).** 기다리는 것: 사용자의 iPhone 확인(PHONE-GUIDE), Claude 계정 설정값, 모호한 위기 문장 3건의 판정, 백업 주기·고지 문구 확정. 게이트 판정과 정본 동기화는 아직 하지 않았다(→ 아래 2026-10-14에 함).
- iPhone 1차 확인(2026-10-13 밤 ~ 14 새벽, 사용자 조작): Safari 본체 로그인·저장·거부 PASS(S-00), 홈 화면 아이콘으로 열면 주소창 없는 앱 모드(S-01), 앱을 완전히 닫았다 열어도 로그인 유지(S-02), 앱 모드에서 저장·거부(S-04), 밀어서 뒤로 됨(S-08), 바깥 링크는 앱 창 안에서 열리고 돌아올 수 있음(S-09), 내보내기는 공유 창 방식이 됨(S-05). 발견: Safari의 로그인은 홈 화면 앱으로 넘어오지 않는다 / 바깥 링크·미리보기에서 돌아오는 구간에 화면이 두 번 새로 열렸다(원인 동작 미특정 — 확인 화면이 직전 동작을 기억하도록 고쳐 다시 올림, 버전 `0a29376c`). 남은 것(14일 낮 12시 이후, PHONE-GUIDE): 12시간 뒤 로그인 유지(S-03), 자판(S-07), 5분 떠났다 오기(S-06), 아이콘 지웠다 다시 추가(S-11), 실제 iOS 버전.
- 판정과 정본 동기화(2026-10-14): 사용자 답 — Android는 출시 전 점검으로 넘긴다 / 백업은 하루 1번·문구는 초안 / Claude 계정의 '모델 개선' 설정은 지금 끈다(사용자가 "껐어"라고 알림) / 모호한 위기 문장 판정은 이유를 설명했고 AI 대화 단계로 미룸 / iOS 26.5.2 / '주소로 내려받기'는 돌아갈 버튼이 없다. 판정: B-02·B-03·B-04·B-05·B-08 pass, B-06 보류 2건. `hosting-identity-spike`·`data-store-spike` → `done`, `app-scaffold` → `ready`. D-108(판정 전제·범위)·D-109(백업·삭제 지연)·D-110(구독 경로 운영 조건), RK-034·RK-035 추가. **남은 것**: 연습용 서버 정리(F-1 — 임시 열쇠를 긴 열쇠로, 가짜 데이터 비움), 실기기 추가 확인 5건.
- 독립 검토 반영(2026-10-14): 읽기 전용 verifier가 '근거 없이 pass가 된 항목은 없다'고 보면서 지적 10여 건을 냈다 — ① B-02의 D-025 허용 목록 대조를 하지 않고 pass로 적음 → **스파이크에 세션 주체 + 허용 목록을 구현해 원격 확인**(버전 `09a04532`, 22/22·36/36) ② B-06은 구독 한도 비율도 미계산 → 보류 2건으로 고침 ③ D-108 ③의 'MVP 미채택'과 D-109의 주기를 사용자 결정처럼 적음 → 출처를 나눠 적음 ④ 삭제 지연 문구가 '30일이 지나면 지워져요'로 단정 → '30일쯤 남을 수 있어요'로, Anthropic 보존을 남는 곳에 추가 ⑤ EVAL 단락·STATUS에 빠진 단서(Access 미활성, 조항 부재, 백업 미구현) 보충 ⑥ loop-state 체크포인트·README·work-graph 낡은 주석·'4건/5건'·S-12 화면 쪽 근거·REQUESTS에 빠진 2026-10-14 답. `verify full` PASS.
- 정리(2026-10-14): 사용자가 "정리해"라고 해 실기기 추가 확인 5건을 건너뛰고(미검증으로 남김) 연습용 서버를 정리했다 — 긴 열쇠(32글자)로 교체(임시 열쇠 401·긴 열쇠 200), 합성 데이터 0행, `PHONE-KEY.txt` 삭제. 세션 서명 키는 그대로라 휴대폰의 로그인은 30일 뒤 만료 때까지 남는다(S-03을 나중에 볼 수 있다). 인수 조건 다섯 개가 모두 찼다. **사용자에게 남은 것**: TASK-MOBILE을 받을지, 'Access를 첫 버전에서 쓰지 않는다'를 결정으로 확인할지(지금은 에이전트 제안), 커밋 지시. (쓰는 사람은 2026-10-14 "일단 나만 쓸래"로 재확인 — D-108 ①.) 커밋 뒤 이 절을 `tasks/archive/`로 옮긴다.
- 사용자 결정 두 건(2026-10-14): **TASK-MOBILE 제안을 받는다**("TASK-MOBILE로 할거고, 받을게" → D-111: 설치형 홈 화면 웹앱 + Worker 하나, D-032의 Pages 부분 교정) / **Access는 첫 버전에서 쓰지 않는다**("첫 버전에서는 안쓸게" → D-108 ③ 확정). 이 작업에서는 결정 기록과 '미결 제안' 표식만 고쳤다 — PRD §4·ARCHITECTURE §2 본문 등 정본을 고쳐 쓰는 일은 TASK-MOBILE T2(별도 작업, 아직 시작 안 함). 커밋 지시는 아직 없다.

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
