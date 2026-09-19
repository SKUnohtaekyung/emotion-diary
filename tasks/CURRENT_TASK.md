> **진행 중인 작업 파일 (2026-09-04).** 이 파일의 아래 절들은 완료·보류된 세션 기록이다. 지금 진행 중인 작업은 각 파일을 정본으로 본다.
> - [TASK-TAXONOMY](TASK-TAXONOMY.md) — 세부 감정 목록 심리학 리서치와 taxonomy v2 확정(D-038 종결). ~~**T0·T2·T3·T5 완료(2026-09-04)**, 계열 9개 확정(공포·혐오 신설, 바램→희망). **T4 착수 가능, 입력 확정됨(2026-09-04)**~~ **[정정, 2026-09-05] T0~T7 전부 완료** — taxonomy v2 9계열 194개 확정(공포·혐오 신설, 바램→희망), 사용자 최종 대조(D-027)까지 마쳐 `data/taxonomy/v2.json`의 `review_status`가 `reviewed`로 전환됐다(`user_cross_check_date: 2026-09-05`). D-038도 `accepted`로 종결됐다(`docs/DECISIONS.md`) — [TASK-TAXONOMY-V1](TASK-TAXONOMY-V1.md)이 `data/taxonomy/v1.json`을 만들고 사용자 최종 대조(D-027)까지 끝났다. 별도 세션이 이 리서치 계획 자체를 재검토해 `tasks/TASK-TAXONOMY-PLAN-V2.md`에 개정안을 썼다 — ~~T4 착수 전 그 파일부터 확인할 것(공포·혐오 신설 계열엔 §7.2-4의 "v1 2배 초과 시 보고" 기준선이 없다는 결함 지적 포함, 보완안 §10.1).~~ **[정정, 2026-09-05] T4는 이미 완료됐다** — 지적된 결함은 §10.1 보완안(발굴 개수가 이동 개수를 넘으면 임계)으로 반영됐다(`docs/DECISIONS.md` D-040). 결정 번호는 **D-040**을 선점했다. 탐색 중 발견한 **PR-005(카테고리 복수 선택) vs D-037 단일 선택 모순**은 별도 세션이 재검토를 마쳤다 — **D-041 accepted**(카테고리 선택기를 감정 별자리 지도로 교체, `DESIGN_SYSTEM` §6.2). 카테고리 피커 관련 작업은 이제 D-041을 정본으로 본다.
> - [TASK-TAXONOMY-V1](TASK-TAXONOMY-V1.md) — 원자료 세부 감정 v1 전사. **완료(2026-09-04)** — 전사와 사용자 최종 대조(D-027 §7.8b) 모두 끝났다. `data/taxonomy/v1.json`은 7계열 194개, `review_status: reviewed`로 제품·T4 입력으로 확정 사용 가능하다.
> - [TASK-DS-REF](TASK-DS-REF.md) — 외부 디자인 시스템 참조 검토. **D-039는 이 작업 몫으로 비워 두었다.**
> - [TASK-MOBILE](TASK-MOBILE.md) — 모바일 구현 명세.

# TASK-INFRA-01 — 개발 인프라 정비(CI·하네스·계약 드리프트·작업 문서)

## 상태와 범위

`in_progress` — 2026-09-20 사용자 지시. 대상은 제품이 아니라 제품을 개발하는 장치(문서·하네스·훅·검증 스크립트·CI)다. 직전 감사 요약은 작업 지시가 아니라 검증할 가설로 다뤘고, 판정 결과와 근거는 아래 체크포인트에 있다. 브랜치 `infra/maintenance` + PR로 진행하며 커밋·푸시·병합·이슈 닫기는 묶음마다 사용자 승인을 받는다.

- 포함: CI 복구, 하네스 낡음 검사와 테스트, `harness/` 동기화, 계약 드리프트(schema 9계열·quick 정의·오도 위험이 있는 문서 줄), `CURRENT_TASK` 분할, 손댄 정본의 `[정정]`·취소선 흡수, git-guard 테스트, AGENTS "공통 계약" 문구.
- 제외(후속): 전체 `eol=lf` 정규화, `docs/DECISIONS.md` 행 안의 취소선 흡수(결정 기록은 덧붙임 이력이 본질), 완료된 TASK-TAXONOMY 3종 재작성, Codex 훅 실제 구성(런타임 검증 불가), `AI_RAG_SPEC` 표기법 통일(후행 단계), 스파이크 노드 `done` 처리(증거가 `partial`).

## 소유권

- Main/Writer: 현재 Claude Code 세션 1명. 읽기 전용 researcher 2회 사용(Codex 훅 공식 문서, 정본 내용 대조). 하위 에이전트는 쓰지 않고 커밋하지 않는다.
- 소유 파일: `.gitattributes`, `.github/workflows/harness.yml`, `harness/*`, `scripts/verify.mjs`, `scripts/check-harness.mjs`, `scripts/test-check-harness.mjs`, `scripts/test-claude-git-guard.mjs`, `scripts/check-taxonomy.mjs`, `scripts/test-check-taxonomy.mjs`, `scripts/check-contrast.mjs`, `scripts/check-characters.mjs`, `schemas/diary-entry.schema.json`, `schemas/journal-assist-output.schema.json`, `package.json`, `README.md`, `AGENTS.md`, `BOOTSTRAP.md`, `PRD.md`, `docs/STATUS.md`, `docs/ROADMAP.md`, `docs/TRACEABILITY.md`, `docs/DATA_MODEL.md`, `docs/UX_SPEC.md`, `docs/EVAL_PLAN.md`, `docs/AGENT_WORKFLOW.md`, `docs/DECISIONS.md`, `docs/RISK_REGISTER.md`, `docs/PROCESS_LOG.md`, `docs/ARCHITECTURE.md`, `references/README.md`, `tasks/*`, `tasks/archive/*`.

## 사용자 결정(2026-09-20)

- TASK-WEB-UI-01의 Codex 세션은 종료됨 → `CURRENT_TASK` 분할까지 진행.
- TASK-DS-REF·TASK-MOBILE은 **보류**(MOBILE은 Phase 1 착수 시 재개). D-039는 `reserved` 행으로 명시해 번호 구멍을 메운다. 이슈 #1~#14는 열어 둔다.
- 커밋 푸터 정본: **그 커밋을 만든 실제 에이전트·모델명**. 규칙은 `AGENTS.md` §2.1 한 곳에만 둔다.
- `PRD.md` 본문 수정 승인(초안 diff를 먼저 보이고 확정). `BOOTSTRAP.md`는 유지하고 상단에 감사 완료 표시.
- `package-lock.json`은 현행 유지. 구버전 npm이 만드는 `libc` 삭제 diff는 커밋하지 않는다.

## 인수 조건

- PR의 GitHub Actions가 Windows·Linux 양쪽에서 초록불이다.
- `harness/` 6개 파일이 현재 상태를 반영하고, 같은 어긋남이 다시 생기면 기계가 알려 준다(검사와 그 테스트로 확인).
- `tasks/CURRENT_TASK.md`가 한 번에 읽히는 크기이고 과거 기록은 `tasks/archive/`로 옮겨졌으며 내부 링크가 깨지지 않았다.
- 손댄 정본에서 `[정정]`·취소선이 본문에 흡수됐고 변경 이력은 `DECISIONS`/`PROCESS_LOG`에 남았다.
- `verify --mode quick`·`--mode full` PASS, `package-lock.json` 무변경.

## 체크포인트

- 가설 판정(2026-09-20, 편집 전): ① `journal-template.txt` 원본은 **CRLF 221B** — git baseline보다 앞선 `outputs/emotion-diary-agent-seed.zip` 내부 바이트가 manifest SHA-256과 일치, 저장소 blob(LF 204B)이 변형본이다. ② `.gitattributes`는 `references/source/**`만 — 줄 단위 파서는 전부 `/\r?\n/`이고 작업 트리는 이미 CRLF·LF 혼재로 PASS 중이다. ③ quick의 sharp 검사는 유지(2.0초 중 1.7초, full로 옮기면 검사 완화)하고 네 곳의 quick 정의를 현실에 맞춘다. ④ RISK는 open 17 + accepted 2(감사의 "open 19"는 틀림). ⑤ 감사의 "정상" 분류가 틀렸다 — `schemas/diary-entry`·`journal-assist-output`의 카테고리 enum/pattern이 7개로 남아 있다. ⑥ style-guide `:root` 63개 값은 현재 tokens와 전부 일치, 기계 검사 가능. ⑦ Codex는 Stop 훅만 동등 이식 가능하고 PreToolUse는 `ask` 미지원. ⑧ `npm ci`도 npm 10.9.2에서는 lockfile의 `libc`를 지운다(가설 기각). CI는 15회 전부 실패였다.

# TASK-ISSUE-26 — 캐릭터 9종 포즈·잔잔한 애니메이션

## 상태와 승인 범위

`complete` — 2026-09-19 사용자 승인. `design/characters/mood-preview-v2.png`를 최종 스타일 기준으로 삼아 9종 최종 자산·포즈·애니메이션·UI 정적 보조 세트와 자동/Chromium 검증을 마쳤다. iPhone Safari·Android Chrome 실기기와 실제 OS reduced-motion 검수는 웹 구현 뒤의 확장 게이트로 보류하며, 사용자 지시에 따라 이 자산 이슈의 완료를 막지 않는다.

## 소유권

- Main/Writer: 현재 Codex 세션 1명. 별도 하위 에이전트 없음.
- 소유 파일: `tasks/CURRENT_TASK.md`, `docs/DECISIONS.md`, `docs/DESIGN_SYSTEM.md`, `docs/EVAL_PLAN.md`, `docs/TRACEABILITY.md`, `design/tokens.json`, `design/style-guide.html`, `design/characters/prompts.json`, `design/characters/README.md`, `design/characters/qa.html`, `design/characters/src/*.png`, `design/characters/poses/*.png`, `design/characters/motion/*`, `design/characters/pilot/*`, `design/characters/*.png`, `scripts/build-character-animations.mjs`, `scripts/check-characters.mjs`, `scripts/test-check-characters.mjs`, `package.json`, `package-lock.json`, 이 파일.

## 불변조건과 인수 조건

- 동물 매핑은 D-044의 양·거북이·기니피그·고양이·쥐·개·까마귀·토끼·침팬지를 그대로 유지한다.
- 승인 스타일은 복슬하고 고르지 않은 검은 크레용·색연필 외곽선, 불투명하고 납작한 색면, 은은한 종이결, 얼굴 중심의 짧고 둥근 비율, 단순하고 엉뚱하지만 안전한 표정이다. 광택 3D·매끈한 벡터·사실적인 털·과도한 그라데이션은 금지한다.
- `mood-preview-v1.png`와 `mood-preview-v2.png`를 덮어쓰거나 삭제하지 않는다. v2는 스타일 참조이며 최종 개별 자산으로 세지 않는다.
- 공포=토끼 시범 산출물은 `pilot/`에 격리하고 최종 9종 일부로 세지 않는다. 시범 전에는 9종 전체를 생성하지 않는다.
- 정적 대표 PNG, 포즈 세트, 약 2초 idle loop, 1회 acknowledge 반응, 정적 reduced-motion 대체를 정의한다. 점프·회전·큰 이동·화면 흔들기·빠른 탄성·과장된 squash/stretch는 금지한다.
- animated WebP와 APNG는 동일 프레임으로 비교하고, 질감·알파 경계·브라우저·파일 크기 증거로 하나를 선택한다.
- `node scripts/check-characters.mjs`, quick/full 검증, 40px·120px와 투명 halo 브라우저 검수를 모두 통과해야 완료다.

## 체크포인트

- 착수(2026-09-17): 사용자 실행 계획 승인. 시작 상태는 `main...origin/main`, 기존 수정 `design/style-guide.html`·`design/tokens.json`·이 파일, 기존 미추적 `mood-preview-v1.png`·`mood-preview-v2.png`. `check-characters`는 9종 미제작 PENDING, quick PASS, `git diff --check` 이상 없음. 기존 변경을 보존한다.
- 진행(2026-09-18): 공포=토끼 시범에서 120px 24프레임/12fps/2초 loop를 만들고 동일 프레임 WebP/APNG를 비교했다. 최초 WebP가 10,928 bytes였으나 메타데이터가 1프레임인 인코딩 결함을 발견해 폐기하고 Sharp의 animated join 방식으로 수정했다. 유효 출력은 WebP 261,298 bytes, APNG 389,709 bytes이며 Chromium에서 질감·alpha 차이가 없어 D-046으로 WebP를 선택했다.
- 진행(2026-09-18): 단순 3×3 crop이 이웃 캐릭터 조각을 섞는 결함을 브라우저 QA에서 발견해 폐기했다. alpha 연결 영역 9개를 분리·중앙 등록하는 방식으로 재생성해 `src/*-1024.png` 9개, 120px 정적 PNG 9개, idle/acknowledge WebP 18개와 manifest를 만들었다. `check-characters`는 실제 투명 픽셀·투명 RGB·크기·pages/pageHeight·delay·loop·총 길이·alpha 중심 이동을 검사하며 현재 정적 18/동적 18 PASS. Chromium `qa.html`에서 40px/120px와 흰색·어두움·체크보드 halo를 확인했다.
- 진행(2026-09-18): 9종 `idle`·`breathe`·`tilt`과 감정별 작은 `emotion` 정적 포즈, 열린 눈 5종의 blink 원본을 추가했다. 감정 포즈는 기준 idle을 imagegen으로 제약 편집한 뒤 1024px로 정규화해 canvas·alpha 중심·종 식별 요소를 비교했다. 사랑 개의 첫 결과는 원본에 없던 꼬리를 더해 탈락·보존했고, 꼬리 없이 귀만 유지한 두 번째 결과를 채택했다. `tilt`는 분리 리깅의 이음선 대신 1.8° 전신 미세 기울임으로 한정한다.
- 진행(2026-09-18): 9종 acknowledge를 `motion_spec.emotion_rigs`의 국소 워프로 재인코딩했다. 전체 imagegen 포즈를 crossfade하면 종이결이 깜빡이므로, 각 원본을 premultiplied-alpha bilinear 재표본화해 지정 부위 외곽선을 4~6px 범위로 왕복시키고 peak를 3프레임 유지한다. blink는 눈 동작만 부각하지 않도록 acknowledge가 아닌 idle loop에만 둔다. Chromium에서 시작·중간·종료 프레임을 확인해 white matte·halo·질감 전환이 없음을 확인했다.
- 수정(2026-09-18): 시각 피드백에서 acknowledge가 blink처럼만 읽히는 것을 확인했다. acknowledge 프레임의 blink 합성을 제거하고, 종별 `emotion_rigs`만으로 귀·머리·앞발·꼬리·날개 등 지정 부위를 4~6px 국소 왕복시킨다. peak 부근도 서로 다른 3프레임으로 유지해 WebP 인코더의 중복 프레임 병합 없이 실제 16프레임을 보존했다. 120px Chromium QA에서 새 파일의 국소 움직임과 정적 중심, 투명 가장자리를 재확인했다.
- 재검증(2026-09-18): 수정 뒤 `build-all`로 18개 WebP와 manifest를 다시 생성했다. `check-characters` PASS(정적 18, 기본 27, blink 5, emotion 9, 동적 18; acknowledge 16프레임·1.328초), `test-check-characters` 5/5 PASS, `verify --mode quick` 및 `verify --mode full` PASS(taxonomy 41/41, scope guard 11/11, character checker 5/5), `git diff --check` PASS. 커밋·푸시·이슈 변경 없음.
- 진행(2026-09-18): 사용자가 제공한 3×3 전신·감정 포즈 시트를 UI 전용 정적 보조 세트로 채택했다. 원본은 `pilot/not-selected-fullbody-reference.png`에 보존된 것을 사용하고, canonical 대표 PNG·포즈·WebP는 덮어쓰지 않는다. `ui-poses/<key>--expressive-static-{1024,120}.png` 18개를 분리했다. 기니피그 crop에 섞인 거북이 표시 조각은 시각 검수에서 발견해 경계를 조정했고, 9종 접촉 시트에서 재확인했다. 이 세트는 애니메이션·reduced-motion fallback이 아니며, UI 장식/온보딩/빈 상태에만 안전하게 쓴다.
- 후속 보류(2026-09-19, 사용자 지시): iPhone Safari·Android Chrome 실기기, 실제 OS reduced-motion, 회색조/label 없음 사용자 판독은 웹페이지 구현 뒤의 확장 검수로 옮긴다. #26 자산 이슈의 완료 조건에서는 제외하며, 아래 `TASK-WEB-UI-01`의 브라우저 우선 정적 UI 프로토타입에서 이어서 다룬다.
- 완료(2026-09-19): 9종 대표 PNG·기본/감정 포즈·24프레임 idle 및 16프레임 acknowledge WebP·UI 정적 포즈 18개·manifest·검수 스크립트와 문서를 모두 갖췄다. full 검증과 GitHub 이슈 본문 갱신/종료는 이 체크포인트 뒤에 실행한다.
- 재검증(2026-09-18): `node scripts/build-character-animations.mjs build-all design/characters/prompts.json design/characters`로 18개 WebP/manifest를 재생성했다. `node scripts/check-characters.mjs` PASS(정적 18, 기본 27, blink 5, emotion 9, 동적 18), `node scripts/test-check-characters.mjs` 5/5 PASS(누락된 acknowledge 국소 리그 거부 포함), `node scripts/verify.mjs --mode quick` PASS, `node scripts/verify.mjs --mode full` PASS(taxonomy 41/41, scope guard 11/11, character checker 5/5), `git diff --check` PASS. 커밋·푸시·이슈 변경 없음.
- 검증(2026-09-18): `node scripts/check-characters.mjs` PASS(정적 18, 기본 27, blink 5, emotion 9, 동적 18), `node scripts/test-check-characters.mjs` 4/4 PASS, `node scripts/verify.mjs --mode quick` PASS, `node scripts/verify.mjs --mode full` PASS(taxonomy 41/41, scope guard 11/11, character checker 4/4), `git diff --check` PASS. Chromium `qa.html`에서 9종 emotion 포즈를 정적 대표와 함께 120px/40px, 흰색·어두움·체크보드로 렌더링해 halo·matte·가독성 이상이 없음을 확인했다. 커밋·푸시·이슈 변경 없음.
- 검증(2026-09-18): `node scripts/check-characters.mjs` PASS(정적 18, 동적 18), `node scripts/test-check-characters.mjs` 4/4 PASS, `node scripts/verify.mjs --mode quick` PASS, `node scripts/verify.mjs --mode full` PASS(taxonomy 41/41, scope guard 11/11, character checker 4/4), `git diff --check` PASS. 커밋·푸시·이슈 변경 없음.

# TASK-WEB-UI-01 — 브라우저 우선 직접 작성 UI 프로토타입

## 상태와 범위

`planned` — 2026-09-19 사용자 지시. 앱 코드가 아직 없는 Phase 0 저장소에서, Cloudflare/DB/인증/AI를 앞당기지 않고 브라우저에서 직접 작성 흐름과 캐릭터 배치를 검토할 수 있는 정적 웹 프로토타입을 만든다. 데이터는 저장하거나 전송하지 않는다. 직접 작성 MVP의 화면 순서·비진단·접근성 규칙은 `UX_SPEC` §2~4, `DESIGN_SYSTEM` §6·§8~9를 따른다. 사용자 승인 전에는 구현 파일을 만들지 않는다.

## 소유권

- Main/Writer: 현재 Codex 세션 1명. 별도 하위 에이전트 없음.
- 소유 파일: `web/*`, `scripts/web-preview.mjs`, `tasks/CURRENT_TASK.md`.

## 인수 조건

- 오늘/달력/통계/설정 하단 탐색과 직접 작성 화면을 브라우저에서 전환할 수 있다.
- 날짜·사건·상위 카테고리 다중 선택·세부 감정 선택·감정별 강도·이유·칭찬/감사 3개·검토/완료의 UI 흐름을 구현한다.
- 대표 캐릭터는 카테고리 식별 보조로, UI 정적 포즈는 온보딩/빈 상태 장식으로만 사용한다.
- 실제 저장·로그인·AI·분석·내보내기·삭제는 구현하지 않고, 프로토타입임을 분명히 표시한다.
- 360px와 데스크톱 Chromium에서 키보드·초점·44px 조작 영역·가로 넘침·reduced-motion 스타일을 확인하고 `verify`를 통과한다.

# TASK-ISSUE-27 — 소유 파일 밖 쓰기 감지

## 상태

`done` — 2026-09-06 사용자 요청(이슈 #27, `https://github.com/SKUnohtaekyung/emotion-diary/issues/27`). 이슈 #25 작업 중 하위 에이전트 1 종료와 하위 에이전트 2 시작 사이, 누구의 소유 파일도 아니었던 `docs/PROCESS_LOG.md`에 출처 불명 73줄이 추가된 사고(작성 주체 미특정)를 계기로, 소유 파일 밖 쓰기를 최소 한 지점에서 기계적으로 감지하는 장치를 추가했다. `claude-git-guard.mjs`(§2.1)는 git commit/push만 사용자 확인 대상으로 만들 뿐 커밋되지 않고 작업 트리에만 남는 쓰기는 애초에 지나갈 통로가 없어 잡지 못했다. 완료 조건 4건 모두 증거와 함께 충족(아래), `verify:quick`/`verify:full` PASS.

**사용자 결정(2026-09-06)**: AGENTS.md §2의 worktree 격리 요구는 **좁힌다**(현재처럼 실제 worktree 생성을 강제하지 않음). 근거: `git worktree list` 결과는 `main` 하나뿐이고 실제로 격리가 쓰인 적이 없으며, 이번 사고도 진짜 동시 실행이 아니라 순차 하위 에이전트 배치 사이에서 났다. 대신 소유 파일 선언 + 이번에 추가하는 기계적 확인 훅으로 실제 위험(출처 불명 쓰기)에 대응한다. 상세는 `docs/DECISIONS.md` D-042.

## 소유권

- 소유 파일: `scripts/claude-scope-guard.mjs`(신규 훅), `scripts/test-claude-scope-guard.mjs`(신규 파이프 테스트), `.claude/settings.json`(훅 등록), `scripts/verify.mjs`(required 목록), `package.json`(`test` 스크립트에 연결), `AGENTS.md`(§2 worktree 문구 좁힘), `docs/DECISIONS.md`(신규 D-042), `docs/PROCESS_LOG.md`(신규 §3), `docs/RISK_REGISTER.md`(RK-011 갱신), 이 파일

## 인수 조건 (이슈 #27 완료 조건)

- [x] 소유 파일 밖 쓰기가 최소 한 지점에서 기계적으로 감지된다(문서 규칙만으로 두지 않는다) — `scripts/claude-scope-guard.mjs`, `PreToolUse`(matcher `Write|Edit`), `.claude/settings.json`.
- [x] 훅에 대해 파이프 테스트로 오탐·미탐을 확인하고 `scripts/`에 테스트 파일로 남긴다 — `scripts/test-claude-scope-guard.mjs`, 11건 전부 PASS(선언 경로/글롭/디렉터리 접두/"이 파일" 특례 통과 4건, 미선언·root 밖 확인 요구 3건, matcher 밖 도구·손상 입력·과다허용 한계 방어 3건, 산문 오탐 회귀 1건). `package.json`의 `test` 스크립트와 `scripts/verify.mjs`의 `--mode full`에 연결해 매번 자동 실행되게 했다.
- [x] AGENTS.md §2의 worktree 요구를 지킬지 내릴지 결정하고, 결정과 이유를 `docs/DECISIONS.md`에 남긴다 — D-042.
- [x] `docs/PROCESS_LOG.md`에 이번 사고를 기록한다(§2와 같은 형식 — 무슨 일이, 왜, 조치).

## 알려진 제한(과다 허용 쪽 — false negative 여지, 후속 과제)

- 훅은 `tasks/CURRENT_TASK.md` 전체의 모든 "소유 파일" 선언을 작업 상태와 무관하게 하나로 합친다. 완료·보류된 과거 작업이 선언한 파일도 계속 허용된다 — 작업 단위로 좁히지 않는다.
- Bash를 통한 파일 쓰기(리다이렉션, heredoc 등)는 matcher(`Write|Edit`) 밖이라 잡지 못한다. 이슈 #27이 조합 가능하다고 제안한 "세션 경계 스냅샷"(세션 시작/종료 `git status --short` 대조)이 이 경로의 사후 그물이며, 이번 변경에는 포함하지 않았다 — 필요해지면 별도 작업으로 추가한다.
- 글롭은 `*`(경로 구분자 `/`를 넘지 않는 한 조각) 하나만 지원한다.

## 체크포인트

- 착수(2026-09-06): 이슈 #27 원문 확인, 기존 `claude-git-guard.mjs`/`.claude/settings.json` 구조 파악, worktree 요구 사용자 결정 수령("좁힌다").
- 진행(2026-09-06): `scripts/claude-scope-guard.mjs` 작성 → `scripts/test-claude-scope-guard.mjs` 10건 작성·실행 PASS(`10/10 PASS, 0 FAIL`). 실제 저장소로 수동 sanity check(PowerShell)하던 중 결함 발견: `line.includes("소유 파일")`가 산문 속 언급까지 잡아 backtick 토큰이 허용 목록에 새고 있었다 — 줄 앞머리가 `- 소유 파일:` 선언 형식과 일치할 때만 인정하도록 좁히고, 이 결함을 재현하는 회귀 테스트(decoy 경로)를 추가해 11/11 PASS로 확인했다(수정 전 재현 실패 확인 후 수정 → 통과 확인).
- 완료(2026-09-06): `.claude/settings.json`에 훅 등록(matcher `Write|Edit`), `scripts/verify.mjs`의 `required` 목록과 `package.json`의 `test` 스크립트에 새 파일 2개 연결. `AGENTS.md` §2 worktree 문구를 진짜 동시 병렬 writer로 좁히고 §2.2 신설, `docs/DECISIONS.md` D-042, `docs/PROCESS_LOG.md` §3(3.1~3.6), `docs/RISK_REGISTER.md` RK-011 갱신. `node scripts/verify.mjs --mode quick` PASS, `node scripts/verify.mjs --mode full` PASS(taxonomy 41/41 + scope-guard 11/11 포함).

# TASK-CBM — Codebase Memory 통합

## 현재 상태와 승인 범위

`partial` — 2026-09-02 사용자 요청. 공식 codebase-memory-mcp 설치, 프로젝트 한정 Claude/Codex MCP 연동, 공유 Graph, 공통 탐색 지침, 실제 인덱싱·회귀·효율 검증만 수행한다. 앱 구현·Git 재초기화·기존 bootstrap 교정은 이번 작업에서 진행하지 않는다. 아래 이전 작업 기록은 원문 보존된 보류 상태다. Claude 작업공간 신뢰 승인과 실제 Claude MCP 호출은 아직 미완료다.

- Main/Writer: 주 에이전트 1명. 조사 Agent A/B/C 및 최종 verifier는 읽기 전용.
- 소유 파일: 필요한 MCP/ignore 설정, `.claude/agents/`의 읽기 도구 목록, `AGENTS.md`, `docs/AGENT_WORKFLOW.md`, `docs/DECISIONS.md`, `docs/TRACEABILITY.md`, 이 파일. 기존 `CLAUDE.md` import와 hooks/skills는 보존한다.
- 연결 요구사항: 개발 도구 통합 `AG-CBM-001` (제품 PR-001~PR-015 변경 없음).
- 인수 조건: 공식 binary version, 양 CLI MCP 발견/호출, 공유 index, symbol/call/dependency와 source 대조, scope/ignore 검증, 기존 설정 보존, quick/full 및 존재하는 앱 명령, 실제 탐색 비교를 증거로 확인한다. 미검증 항목이 있으면 부분 성공으로 보고한다.

## 현재 체크포인트

- 완료: Windows/PowerShell 7.6.4, Node 22.16.0/npm 10.9.2; `main`, commit 0, 프로젝트 파일 untracked. 기존 파일 46개를 `work/cbm-integration/baseline/`에 보존하고 SHA-256 목록을 기록했다. 변경 전/후 quick/full PASS. v0.10.8 binary-only 설치, 프로젝트 MCP 설정 2개, 공유 index, 실제 Codex CLI 호출, scope 거부, watcher 추가/삭제 반영, Graph-source 비교 완료.
- 다음: 사용자가 Codex 앱과 모든 CBM 명령을 종료해 실행 중인 `pre-cohort/unknown` daemon을 해소 → Claude Code 세션 재시작 → `claude mcp get codebase-memory-mcp` 상태 확인 → Claude에서 `list_projects`/`index_status`/`search_graph`/`trace_path`/`get_code_snippet` 실제 호출. 그전에는 전체 완료로 보고하지 않는다.
- 결정: D-028. 조사 초반에는 일회성 Git 신뢰 옵션만 썼으나 CBM의 Git 감지를 위해 이후 전역 `safe.directory`에 현재 root 하나를 추가했다. 이제 일반 `git status`와 CBM `is_git=true`, branch `main`이 확인된다. `.git/config`, 이력·branch·staging은 변경하지 않았다.
- 차단(1) CBM daemon 세대 충돌 — 2026-09-02 10:45 확인. 실행 중 daemon(pid 13804, 10:29 기동, Codex 앱 pid 5160 소유, 9749 정상)이 `active_version=pre-cohort/unknown`, `active_build=0…0`으로 등록되어 build `b4b403b1…`의 신규 frontend와 CLI가 모두 즉시 종료된다. Claude 세션은 `CONNECTION_CLOSED`로 `mcp__codebase-memory-mcp__*` 도구를 노출하지 못했고, 동일 `.mcp.json` 설정으로 직접 spawn하면 975ms 만에 exit 1과 `CBM daemon could not start within 30000 ms`, `config list`는 "pre-coordination or unverified CBM generation is active; close all CBM sessions and commands, then retry"를 반환한다. 근거는 바이너리가 남긴 `logs/daemon-conflicts.ndjson`의 `daemon.version_conflict reason=build`다. 해소는 바이너리가 안내하는 절차(모든 CBM 세션·명령 종료 후 재시작)만 사용하고 사용자 프로세스를 임의 종료하지 않는다.
- 차단(2) `claude mcp get`은 여전히 `Pending approval`이다. 다만 이번 Claude 세션은 서버 spawn을 실제 시도했으므로 승인이 이 세션의 실패 원인은 아니었다. daemon 충돌 해소 후 다시 판정해야 한다.
- 정정: 이전 "backslash 경로 키만 있고 forward-slash 키가 없다"는 원인 가설은 근거가 확인되지 않았다. 전역 `~/.claude.json`의 `projects`에 이 root 키는 backslash 형식 1개뿐이고 `hasTrustDialogAccepted=true`이며 `enabledMcpjsonServers`는 빈 배열이다. 프로젝트 `.claude/settings.local.json`에는 이 server 1개만 활성화되어 있다. `Pending approval` 표시의 정확한 판정 경로는 미확인으로 남긴다.
- 제한: 앱 source/framework/test suite가 아직 없다. 아래 실제 하네스 흐름으로 검증했다. Graph-first 호출 절감은 관찰되지 않았고 token 절감률은 산출하지 않았다.
- 증거 중간물: `work/cbm-integration/` (Git·하네스 대상 제외, 민감값 기록 금지).

## 설치·설정 증거

- 공식 release ZIP v0.10.8 SHA-256: `b43ad982994c4d829670749e08d3b622a74bb20041fc0a7d02bef6113f81c34d` (공식 checksums와 일치). 공식 ZIP의 4개 루트 항목을 확인한 뒤 실행했다.
- binary: `%LOCALAPPDATA%/Programs/codebase-memory-mcp/codebase-memory-mcp.exe`; 같은 디렉터리에 공식 updater/라이선스. 사용자 PATH에 이 디렉터리만 추가됐다. 기존 터미널은 재시작 전 absolute command를 사용한다.
- `--version` → `0.10.8`; `--help`, `config list` PASS. `install --help`는 unsupported로 확인해 이후 사용하지 않는다.
- 일반 `install --dry-run` → FAIL: Codex `hook_preflight / command_render`, 여러 전역 client/hooks/skills 변경 계획. 실제 적용하지 않았다. `install --dry-run --skip-config --dir=...` PASS 후 `install -y --skip-config --dir=...` PASS.
- `.mcp.json`/`.codex/config.toml`: 동일 binary/root/cache, `CBM_ALLOWED_ROOT` 현 root로 제한. Codex `cwd` 현 root. `.claude/settings.local.json`: 승인 대상은 이 server 한 개만 지정. 세 파일은 machine-local로 Git에서 제외.
- 공용 cache `%USERPROFILE%/.cache/codebase-memory-mcp`에 이 root의 DB 하나. MCP frontend별 DB를 만들지 않음. `persistence=false`, `.codebase-memory` artifact 없음, Git merge driver 변화 없음.
- 기존 설정 `auto_index=false`, `auto_watch=true`, `auto_index_limit=50000`, `ui_enabled=true`, port 9749 보존. 초기/필요 시 지정된 Main만 `full` index.
- 실제 exclude: `.git`, `.claude`, `work`, `outputs`, 로컬 MCP 설정, JPG 원자료. 핵심 `scripts` 3개, schema 5개, harness와 docs 포함. 기본 ignore와 `.gitignore`로 충분하므로 `.cbmignore` 미생성. 비표준 확장자 mapping 불필요하여 `.codebase-memory.json` 미생성.

## 실행 검증

| 검증 | 실제 결과 |
| --- | --- |
| JSON-RPC MCP initialize / tools/list | PASS, server 0.10.8 / 15 tools |
| Codex 0.147.0 `mcp get/list` | PASS, project MCP enabled |
| Codex `exec --ephemeral --json --sandbox read-only --skip-git-repo-check ...` | PASS, 실제 `list_projects` 및 `search_graph` 완료 이벤트, walk/visit 2건 |
| 현재 Codex 앱 및 독립 verifier의 실제 MCP 도구 | PASS, `list_projects`/index/status/search/schema 호출. 최종 수동 full index 654 nodes / 700 edges |
| Claude `mcp get` / 세션 MCP 도구 (2026-09-02 10:45) | FAIL(연결). `mcp get`은 Pending approval, 세션은 `CONNECTION_CLOSED`로 도구 미노출. 실제 Claude tool 호출 미검증 |
| Claude 세션 조건에서 binary 직접 spawn (2026-09-02 10:45) | FAIL. exit 1 / 975ms / daemon 세대 충돌. 바이너리 자체는 `--version` 0.10.8, 도움말 정상 |
| 실행 중 daemon 상태 (2026-09-02 10:45) | pid 13804 생존, `http://127.0.0.1:9749/` HTTP 200, 기존 index DB 2.8MB 유지. 신규 client만 거부됨 |
| MCP `index_repository` full / persistence=false | PASS, 38 File nodes, skipped 0, partial parse 0. 문서 변경에 따라 전체 node/edge 수는 변함 |
| MCP symbol / trace / query / snippet | PASS 호출; 정확성과 한계는 아래 기록 |
| `index_repository(repo_path="C:/Windows")` | 예상대로 outside allowed root 오류. index 생성 없음 |
| watcher 재생 | 수동 재index 없이 임시 함수 추가 15초 후 1건, 삭제 12초 후 0건. 임시 파일 제거됨 |
| Graph UI | MCP 연결 중 `http://127.0.0.1:9749/` HTTP 200, HTML 반환. 시각적 UI 조작은 미검증 |
| `node scripts/verify.mjs --mode quick` / `--mode full` | 변경 전·후 모두 PASS. 2026-09-02 이번 세션 재실행도 quick PASS / full PASS |
| 앱 lint/typecheck/test/build/e2e | 해당 scripts·suite가 없어 실행 불가. 앱 검증 통과를 뜻하지 않음 |
| `git diff --check`, source hash | PASS. 기존 3개 실행 source 및 Claude Stop 설정/CLAUDE.md는 baseline과 동일 |
| `uninstall --dry-run` | FAIL, 동일 Codex command_render 사전 검사. 실제 uninstall 미실행. 수동 rollback은 AGENT_WORKFLOW §9 |

## Graph 품질과 탐색 비교

실제 기능: `.claude/settings.json:11` Stop → `scripts/claude-stop-hook.mjs:18` spawnSync → `scripts/verify.mjs` quick → `walk:37` 파일 수집 / `visit:123` 순환 검사.

- 위치, `verify` module→`walk` 45행 / →`visit` 131행은 source와 일치한다. `get_code_snippet(walk)`의 8줄도 현재 파일과 일치한다.
- recursive 41/127행은 trace의 CALLS에는 없고 self_recursive metadata만 true. 외부 builtin/subprocess 연결도 그래프에 없으므로 targeted search/실제 코드로 보완했다.
- `walk` USAGE 중 `ignored`/`textExtensions`/`files`는 맞지만 `name`은 CI YAML, `path`는 references manifest의 동명 항목에 잘못 연결됨. 해당 dependency 주장은 기각했다.
- `.claude` 기본 제외, `package.json` File node 누락, 수정하지 않은 source의 coverage `metadata_changed` 응답도 확인. parse_partial=0이나 ready는 완전성 보장이 아니다.
- 2026-09-02 현재 working tree 재확인: `walk` 정의 37행 / 재귀 41행 / module 호출 45행, `visit` 정의 123행 / 재귀 127행 / module 호출 131행으로 위 기록과 동일하다. Stop 경로 `.claude/settings.json:11` → `scripts/claude-stop-hook.mjs:18` `spawnSync(process.execPath, [verifyPath, "--mode", "quick"])`도 그대로다. 따라서 위 Graph 누락·오연결 기록은 현재 source에 그대로 적용된다. 이번 세션에서는 Claude MCP로 재호출하지 못해 Graph 측 재확인은 미검증이다.

이미 구조를 알고 수행한 최소 경로 재생 실험이다. 각 질문을 독립 계산하고 batching과 무관하게 논리 작업 1개를 call 1개로 센다. 초기 인덱싱·세션 시작·공통 준비 호출은 제외했다.

| 합계: 순환 함수 / walk 영향 / Stop→quick | 기존 탐색 | Graph-first |
| --- | ---: | ---: |
| Grep / Glob | 3 / 0 | 2 / 0 |
| Read 파일 수(질문별 합, 전체 고유 3개) | 5 | 5 |
| Graph calls | 0 | 7 |
| 전체 논리 tool calls | 8 | 14 |
| 반환된 source 줄 | 67 | 67 |

질문별 calls는 기존 2/2/4, Graph 4/4/6. 현재 실행 코드 195줄 환경에서는 절감 효과가 관찰되지 않았다. 비교 token 측정값 없음. 앱 scaffold 이후 다시 평가한다.

## 보존 및 남은 제한

- baseline 46개 중 변경 파일은 `.gitignore`, `AGENTS.md`, `.claude/agents` 2개, `AGENT_WORKFLOW`, `DECISIONS`, `TRACEABILITY`, 이 파일 8개. 나머지 source·원자료·스키마·제품 명세·Stop hook·CLAUDE import는 보존.
- Git은 작업 전후 commit 0 / 전체 untracked이므로 일반 `git diff`가 비어 있다. 저장한 baseline과 `git diff --no-index`/SHA-256로 실제 변경을 검토한다. commit/stage/reset/reinit 없음.
- 위 Git 전제는 2026-09-02 10:42:49 이후 더 이상 성립하지 않는다. 이 세션과 별개로 진행된 보류 bootstrap 작업이 baseline commit `32e68c8`(author `admin`)을 만들었고, 같은 시각대에 `docs/` 6개 파일이 다른 writer에 의해 계속 수정되고 있었다. TASK-CBM Writer는 commit/stage/reset/reinit을 수행하지 않았고 `docs/`의 해당 변경에도 관여하지 않았다. 이후 TASK-CBM 검토는 저장한 baseline이 아니라 이 commit 기준 `git diff`로 수행한다.
- 기존 Claude MCP 3개 Connected, Codex 기존 7개 설정 유지(6 enabled, cua_repl disabled). Notion not_logged_in은 baseline에도 있었던 제한.
- 2026-09-02 재확인: 기존 Claude MCP 3개(sequential-thinking, superpowers, context7) 모두 Connected 유지. `CLAUDE.md`의 `@AGENTS.md` import와 `.claude/settings.json`의 Stop hook 보존. `.claude/agents/`의 researcher/verifier는 읽기 전용 Graph 도구 11개만 보유하고 `index_repository`/`delete_project`/`manage_adr`/`ingest_traces`를 포함하지 않는다. 전역 MCP의 raw 설정·인수·환경변수는 credential을 포함할 수 있어 기록하지 않는다.
- 세션 중단 전후 전역 `.claude.json`, `.claude/settings.json`, `.codex/config.toml` hash가 달라졌다. 이 작업의 Writer는 해당 파일을 직접 수정하지 않았으며 바이트 동일성은 증명하지 못한다. 2026-09-02 추가 관찰: 세 파일의 마지막 쓰기 시각은 각각 10:29:06, 10:30:05, 10:41:28로 installer activation(02:13)과 겹치지 않고 각 앱 기동 시각과 일치한다. mtime만으로 그 이전 쓰기를 배제할 수 없으므로 원인은 여전히 단정하지 않는다. 현재 기존 MCP와 사용자 설정을 유지하고 임의로 되돌리지 않는다.
- Claude 정상 신뢰 승인/실제 호출, 앱 미구현으로 인한 기능 검증 부재, Graph 오연결·누락과 효과 미입증, 전역 파일 hash 차이는 숨기지 않는다.
- 자동 uninstall 사전 검사도 실패하여 자동 rollback 미검증. 전역 hash 차이의 원인을 installer·다른 프로세스 어느 쪽으로도 단정하지 않는다. 현재 기존 설정을 임의 복원하지 않는다.
- 독립 검증: 수정에 참여하지 않은 Agent A가 실제 MCP, ZIP checksum/binary, 설정, source·diff/hash, full 하네스를 재검증했다. Claude 실제 호출 미검증과 전역 byte 동일성 미확인 때문에 전체 판정은 PARTIAL.

---

# TASK-DESIGN — 디자인 시스템 검수와 확정 (새 세션 인계)

> **다른 세션에 알림 (2026-09-04, TASK-DS-REF 담당자용).** `tasks/TASK-DS-REF.md`가 쓰인 뒤 이 세션이 **D-037·D-038을 사용했다.** 다음 신규 번호는 **D-039**다(`docs/DECISIONS.md` 마지막 행으로 항상 재확인할 것 — TASK-DS-REF §8 T0 절차 그대로).
>
> **번호 갱신 (2026-09-04, TASK-TAXONOMY 세션).** 위 안내는 그대로 유효하다 — **D-039는 TASK-DS-REF 몫으로 비워 두었다.** TASK-TAXONOMY는 그 다음인 **D-040**을 `reserved` 행으로 선점했으므로 `docs/DECISIONS.md`의 마지막 행은 D-040이지만, TASK-DS-REF는 **D-041이 아니라 비어 있는 D-039를 쓴다.**
>
> 또한 TASK-DS-REF §3·§7의 "불변" 목록 중 **두 항목이 D-037로 대체됐다**:
> - D-035의 **카테고리 2줄 격자** → **아크 휠**(2줄 격자는 큰 글자 폴백 규격으로만 남음)
> - D-036의 **강도 2줄 세그먼트** → **슬라이더 + 숫자 + −/+ 스테퍼**
>
> 그리고 세부 감정 선택이 **chip 격자 → 소프트 리스트**로 바뀌었고 chip은 표시 전용이다. §6 구성요소 규칙을 보강할 때 정본(`docs/DESIGN_SYSTEM.md` §6.2/§6.3/§6.3.1/§6.4)을 기준으로 하고 TASK-DS-REF 파일의 요약을 기준으로 삼지 않는다. D-034(색·글꼴·light 전용)와 D-036의 나머지(앵커 한 줄, 위기 톤, 브랜드, 탐색 아이콘, 4pt 밀도·달력 `1fr`)는 그대로 유효하다.
>
> **Codex 세션 인계 (2026-09-07, 이미지 생성).** 캐릭터 9종의 컨셉·프롬프트·근거 조사가 전부 끝났다 — **남은 건 실행뿐이다.** Claude Code 세션에는 이미지 생성 도구가 없어(`codex` CLI가 이 컴퓨터의 PATH에 없고, 전역 `~/.codex/config.toml`은 있지만 Claude Code에서 호출할 권한·이유가 없음) 이 단계부터 Codex가 이어받는다.
> 1. `design/characters/prompts.json`을 그대로 정본으로 쓴다 — `common_style_prompt` + 각 `characters[].subject_prompt`를 이어 붙이고 `negative_prompt`를 부정 프롬프트로 준다. **9개를 한 번에, 같은 seed로** codex imagegen에 넘긴다(하나만 나중에 다시 만들면 선 굵기·채도가 어긋난다 — `design/characters/README.md` §1).
> 2. 결과를 `design/characters/src/<key>-1024.png`(원본, 1024×1024)에 저장하고, `design/characters/<key>.png`(배포용, 120×120, 투명 배경 유지)로 축소해 저장한다. `<key>`는 `enjoyment wish sadness anger joy love hate fear disgust` 9개(`prompts.json`의 `characters` 배열 순서).
> 3. `node scripts/check-characters.mjs`로 파일 유무·크기·투명 배경을 기계 검사한다. 이어서 `design/characters/README.md` §3의 눈 검수 체크리스트(40px 판독성, 9종 통일감, 흑백 구별, 표정 안전성)를 직접 확인한다.
> 4. 통과하면 `npm run verify:quick`을 실행하고, 결과를 이 파일의 체크포인트에 짧게 남긴다. **커밋은 사용자가 지시할 때만** 한다(AGENTS.md §2.1 — 이 규칙은 Claude Code 전용 훅이 아니라 두 에이전트 공통 계약이다).
> 생성 도구는 **codex imagegen 직접 호출 하나뿐**이고 다른 이미지 생성 스킬·플러그인·외부 API는 쓰지 않는다(D-035). 9종의 동물·자세·색 결정 근거는 `docs/research/character-animal-evidence.md`, 결정 기록은 `docs/DECISIONS.md` D-043·D-044 — 자세를 임의로 바꾸지 말고, 바꿔야 할 이유를 발견하면 결정 기록부터 갱신한다.

## 상태

`done(결정)` — 2026-09-02 사용자 요청("디자인 시스템 잡아야 할 것 같다", "새 세션에서 대화하며 정하고, 프리뷰로 계속 확인하고 싶다"). 2026-09-04 세션에서 체크리스트 10건을 모두 확정하고(D-034·D-035·D-036) **D-033을 accepted로 전환**했다. 이어서 사용자가 레퍼런스를 제시해 감정 입력 방식을 다시 정했다 — **D-037**: 강도 슬라이더(세그먼트 대체), 카테고리 아크 휠(2줄 격자 대체), 세부 감정 소프트 리스트(chip은 표시 전용). 세부 감정 목록의 심리학적 타당성은 ~~**D-038**(provisional)로 분리했다.~~ **[정정, 2026-09-05]** **D-038**로 분리했었고, TASK-TAXONOMY의 taxonomy v2 리서치가 끝나 **D-038은 accepted로 종결됐다**(9계열 194개, 사용자 최종 대조 2026-09-05, `docs/DECISIONS.md`). 남은 것은 결정이 아니라 실행·리서치다.

- 소유 파일: `docs/DESIGN_SYSTEM.md`, `design/tokens.json`, `design/characters/prompts.json`, `design/characters/README.md`, `design/characters/src/*.png`, `design/characters/*.png`, `design/style-guide.html`, `scripts/check-contrast.mjs`, `scripts/check-characters.mjs`, `docs/DECISIONS.md`, `docs/research/character-animal-evidence.md`, 이 파일. **[정정, 2026-09-06]** 이슈 #26(캐릭터 9종) 작업 시작 시 선언했어야 했는데 누락돼 `claude-scope-guard.mjs`가 매번 확인을 요구했다 — 뒤늦게 추가. **[추가, 2026-09-07]** 이미지 출력 경로(`src/*.png`, `*.png`) 추가 — Codex가 생성할 산출물.

## 정본과 산출물

- 정본: `docs/DESIGN_SYSTEM.md`(원칙·색·글자·간격·구성요소·접근성·금지 사항), 값: `design/tokens.json`, 색 검사: `scripts/check-contrast.mjs`(quick 하네스에 포함, 144건 = WCAG 대비 60 + 감정 계열 색차 ΔE 84), 캐릭터 자산 규격 검사: `scripts/check-characters.mjs`(quick 하네스, 자산 미제작이면 pending).
- 캐릭터 생성 프롬프트 정본: `design/characters/prompts.json`, 제작·검수 절차: `design/characters/README.md`.
- 시각 미리보기(저장소): `design/style-guide.html`. 로컬 서버 `node scripts/preview.mjs 4173` → `http://localhost:4173/`. Claude Code 브라우저 pane에서는 `.claude/launch.json`의 `design-preview` 구성을 `preview_start`로 열면 된다.
- 시각 미리보기(공유 링크, 같은 내용): https://claude.ai/code/artifact/8673a33c-900c-4273-8592-0fb3bdcc36a9 — 새 세션에서 갱신하려면 Artifact 도구에 `url`로 이 주소를 넘겨 재발행한다(먼저 `read`).

## 새 세션 작업 루프

1. 사용자와 항목별로 대화해 결정한다(아래 체크리스트). 결정은 `docs/DECISIONS.md` D-033 행 갱신(또는 D-034+ 신규)과 `docs/DESIGN_SYSTEM.md`·`design/tokens.json`에 같은 commit으로 반영한다.
2. 값을 바꾸면 `node scripts/check-contrast.mjs --verbose`로 대비와 계열 색차를 확인하고, `design/style-guide.html`의 `:root` 토큰과 dark-panel 인라인 값을 함께 고친다(현재 미리보기는 tokens.json을 자동 로드하지 않는다 — 자동화는 아래 후속).
3. 미리보기를 다시 열어 사용자가 확인하게 한다: 브라우저 pane(`design-preview`)과 Artifact 재발행(위 URL). 휴대폰 확인이 필요하면 Artifact 링크를 공유한다.
4. `npm run verify:quick` → commit → `git push origin main`.

## 결정 체크리스트 (사용자와 정할 것)

- [x] 7개 감정 색 계열 — **결정(D-034)**: 바램·미움이 ΔE 3.3~7.0으로 사실상 같은 색이던 결함을 발견해 원자료의 밝기 관계로 되돌렸다(바램 = 가장 옅은 라일락 `#A855CE`, 미움 = 가장 짙은 남색·보라 `#4750A6`). 기쁨 light 강조는 `#9A7A08`(올리브) → `#B08A00`(3.24:1).
- [x] chip 규칙과 선택 표시 — **결정(D-035 → D-037로 역할 변경)**: 값(fill 100 / border 300 / text 900)은 그대로지만, chip은 **선택 조작에서 빠지고 표시 전용**이 됐다(트레이·기록 카드·범례·AI 후보). 세부 감정 선택은 소프트 리스트가 맡는다.
- [x] 카테고리 선택기와 캐릭터 아이콘 — **결정(D-035 → D-037로 대체)**: 2줄 격자 대신 **아크 휠**(반지름 460, 간격 7.6°, 회전 45%, 관성 스냅). 2줄 격자는 큰 글자 폴백 규격으로만 남는다. 아이콘 40px는 유효. 캐릭터는 원자료와 같은 손그림 수채 무드로 codex imagegen 생성, 투명 PNG(원본 1024 / 배포 120). 프롬프트·규격·검수는 `design/characters/`. **자산 생성은 아직 안 했다 —** ~~taxonomy v1 검수와 함께 진행.~~ **[정정, 2026-09-05] taxonomy v2 확정(9종, 공포·혐오 신설, 2026-09-05 사용자 최종 대조 완료)으로 선행 조건이 바뀌었고 이제 충족됐다 — 생성 자체는 여전히 TASK-DESIGN 실행 몫이다(`design/characters/prompts.json`은 아직 7개 항목).**
- [x] 강도 선택기 — **결정(D-036 → D-037로 대체)**: 2줄 세그먼트 대신 **슬라이더 + 숫자 + −/+ 원형 스테퍼**(감정 3개 기준 536px → 380px). 앵커 문구 한 줄 규칙(1~3 / 4~7 / 8~10)은 그대로 유지.
- [x] 글꼴 — **결정(D-034)**: 웹폰트를 싣지 않고 시스템 한글 글꼴만 쓴다. 스택이 Pretendard를 먼저 찾으므로 나중에 `@font-face`만 추가하면 토큰 변경 없이 전환된다.
- [x] 다크 모드 — **결정(D-034)**: MVP는 light 전용. dark 토큰과 대비 검사는 유지하되 화면에는 적용하지 않고, 나중에 적용해도 앱 내 토글은 두지 않는다.
- [x] 밀도 — **결정·정정(D-036)**: 4pt 단계 이탈(gap 6/10, padding 14, radius 3/6)을 정정했다. **결함**: 달력이 `repeat(7,44px)`+gap 6이라 360px에서 344px로 가로 넘침이 있었고 `1fr`(열 간격 0, 줄 간격 4)로 고쳐 45.7×44가 됐다. 남은 예외는 선택된 chip 좌우 패딩 11(2px 테두리 광학 보정) 하나. 360px 실측 가로 넘침 0.
- [x] 위기 안내 문구 톤 — **결정(D-036)**: 현재 톤 유지("지금 안전이 먼저예요" + 도움 요청 안내 + 진단·위기 대응 서비스가 아님 명시). **연락처 값 자체는 여전히 검수 대기.**
- [x] 하단 탐색 — **결정(D-035·D-036)**: 이름은 오늘·달력·통계·설정, 아이콘은 비활성 선(outline) / 활성 면(filled)로 색 외 단서를 준다.
- [x] 브랜드 — **결정(D-036)**: 앱 이름 "감정일기"만 쓰고 로고·워드마크는 만들지 않는다. PWA 아이콘이 필요해지면 캐릭터 자산 중 하나를 쓴다.

## 후속 작업(선택)

- `design/style-guide.html`이 `design/tokens.json`을 fetch해 CSS 변수를 생성하도록 바꾸면 값 이중 관리가 사라진다(Artifact는 외부 fetch가 막히므로 발행 시 인라인 필요). 지금은 손으로 맞추며, 값이 어긋나도 하네스가 잡아 주지 못한다 — 이중 관리가 남은 유일한 자리다.
- 캐릭터 단색 아이콘 ~~7종(`design/characters/`)은 taxonomy v1 검수와 함께 제작.~~ **[정정, 2026-09-05] 목표가 9종으로 바뀌었다**(공포·혐오 신설). taxonomy v2 확정(2026-09-05 사용자 최종 대조 완료)에 따라 이제 제작 가능하며, 시점·절차는 아래 "다음(실행·리서치)" 2번을 따른다(`design/characters/prompts.json`은 아직 7개 항목).
- 실기기(iPhone Safari·Android Chrome)에서 chip 대비와 44px 터치 영역 확인.

## 체크포인트

- 완료(2026-09-02): D-033 provisional, DESIGN_SYSTEM/tokens/check-contrast/style-guide 작성, quick 하네스에 대비 검사 통합, README·UX §8·TRACEABILITY·STATUS 연결, Artifact 발행.
- 완료(2026-09-04): 체크리스트 4건 확정 → D-034 accepted. **결함 1건 발견·수정**: 바램·미움 계열이 CIEDE2000 ΔE 3.3(chip 글자)/4.2(chip fill)/7.0(강조)/5.6(dark 강조)으로 구별 불가였다. D-022 때문에 chip의 카테고리 색이 같은 표기 감정의 유일한 구분 단서라 기능 결함이었고, 원자료의 밝기 관계(바램 가장 옅음·미움 가장 짙음)로 되돌려 최솟값 7.2/18.8/11.3/13.3로 회복했다. 재발 방지로 `check-contrast.mjs`에 계열 색차 검사(ΔE≥7, 84건)를 추가했고 옛 값으로 되돌리면 실패하는 것을 확인했다. tokens/DESIGN_SYSTEM/style-guide/STATUS/TRACEABILITY/verify.mjs를 같은 commit에서 갱신.
- 완료(2026-09-04, 2차): 체크리스트 3건 추가 확정 → D-035 accepted. 캐릭터 자산 파이프라인 세팅(`design/characters/prompts.json` 공통 프롬프트 + 7종, `README.md` 규격·검수, `scripts/check-characters.mjs` 자동 검사를 quick 하네스에 연결). 검사는 4개 경로(pending / 7종 정상 / 크기 불일치 / 투명도 없음)를 합성 PNG로 확인했다.
- 완료(2026-09-04, 3차): 남은 체크리스트 4건 + 탐색 아이콘 확정 → D-036 accepted, **D-033 accepted 전환**. 밀도 감사로 4pt 이탈을 정정하고 달력 가로 넘침 결함을 고쳤다. `DESIGN_SYSTEM`에 §7 브랜드를 신설(이후 절 8~12로 재조정, 상호 참조 동반 수정), 스타일 가이드에 하단 탐색 절 추가.
- 완료(2026-09-04, 4차): 사용자 레퍼런스(아크 휠·range slider) 검토 → **D-037** accepted. 시안 2종을 만들어 실측 비교했다(세그먼트 536px vs 슬라이더 380px, 아크 7개 중 5개 가독, 세부 감정 51개 중 아크는 5개만 노출·복수 선택 불가). 아크는 반지름 560→460·간격 8.6°→7.6°로 조정해 7개가 모두 화면에 들어오게 하고, 회전을 접선의 45%로 낮춰 한글 가독성을 확보했으며, listbox·activedescendant·aria-live·화살표 키·reduced-motion 대응을 넣었다. 스타일 가이드에 세 구성요소를 동작하는 형태로 이식했다. 세부 감정 목록의 심리학적 타당성은 **D-038**(provisional)로 분리 기록.
- 완료(2026-09-06, 2차, 이슈 #26): 공포·혐오 캐릭터 컨셉을 사용자와 대화로 확정한 뒤(1차, 위 항목 2 참고), 사용자가 "심리학 전문 지식 근거가 있는지" 직접 질문해 **9종 전체의 행동과학 근거를 조사자 에이전트 3개(백그라운드)로 사후 점검**했다 — 상세는 `docs/research/character-animal-evidence.md`, 결정은 **D-043** accepted(이후 D-044로 대체, 아래). 결과: 공포=토끼(얼어붙음)는 실제로 잘 뒷받침됨(Fanselow 1994 등). **혐오=너구리(코 막기)는 근거가 전혀 없었고 너구리 상징 연구가 오히려 미움 쪽(트릭스터·도둑)을 가리켜, 침팬지(gape+거부 동작)로 교체했다** — 대체 후보 포괄 조사에서 가장 넓은 근거(Steiner 외 2001, Sarabian 외 2017). 원자료 7종(고양이 5·공룡 2)도 사후 점검했으나 이때는 D-035 원자료 보존 원칙에 따라 근거 유무와 무관하게 바꾸지 않았다.
- 완료(2026-09-07, 3차, 이슈 #26): 사용자가 "9개 감정이 각각 다른 동물이었으면 좋겠다"고 요청 — **D-035의 원자료 보존 전제를 사용자 스스로 대체**했다. 고양이 5종·공룡 2종 중복 때문에 7개 계열의 동물을 다시 정해야 했고, 사용자가 "근거 우선"을 선택해 조사자 에이전트 2개(병렬 백그라운드, 즐거움·희망·기쁨 / 슬픔·사랑·미움)로 조사했다. 결과는 **D-044** accepted. **분노=고양이만 유지**(5개 고양이 포즈 중 유일한 (a)등급이라 근거 우선 기준으로도 최선). 나머지 6종 중 5종은 실제 (a)등급 문헌을 찾아 확정: 즐거움=양(Reefmann 외 2009), 슬픔=기니피그(Herman & Panksepp 1978, PANIC/GRIEF 창시 실험), 기쁨=쥐(Panksepp & Burgdorf 2003; Ishiyama & Brecht 2016 *Science*), 사랑=개(Nagasawa 외 2015 *Science*, 프레리들쥐가 과학적으론 더 유명했으나 마스코트 친숙도로 개 선택), 미움=까마귀(Marzluff 외 2010·2012, 단 논문은 "학습된 위협 인식"이라 부르지 "미움"이라 하지 않음 — 프레이밍 유보 명시). **희망=거북이만 예외로 (c) 근거 없음** — taxonomy 희망 정의 자체가 동물 모델 없는 사람 대상 연구(Bruininks & Malle 2005)에서 왔음을 조사로 확인, 순수 창작 선택으로 명시. 중간에 사용자가 "사랑도 개, 희망도 개"를 골라 종 중복이 발생했는데, 재확인 질문으로 사랑=개·희망=거북이로 해소했다(9종 전부 서로 다른 동물 확인 완료). `prompts.json`(6개 항목 교체, `version` → `characters-v4-draft`)·`README.md` §5·`docs/DECISIONS.md`(D-043→superseded, D-044 신규)·`docs/research/character-animal-evidence.md`(전면 개정, 폐기된 원안은 §4로 보존)를 같은 세션에서 갱신. **실제 이미지 생성은 여전히 미실행**(Codex CLI 필요, 이 환경에 없음을 확인함).
- **인계(2026-09-10, 병행 TASK-DESIGN 세션 → D-041 별자리 담당).** `design/style-guide.html`이 **정본 §6.2를 따라오지 않았다.** 정본은 D-041로 감정 별자리 지도가 됐는데 스타일 가이드에는 별자리가 **0건**이고 폐기된 **아크 휠 절이 그대로** 있다(`<h2>카테고리 선택기 — 아크 휠</h2>`, `id="arc"`). 미리보기와 정본이 어긋난 상태다.
  - 그 낡은 아크는 9계열에서 **실제로 깨져 있다**(로컬 미리보기 실측, `35f9ad8` 기준): 9개 중 **5개만** 상자 안에 들어오고 즐거움·미움·공포·혐오가 잘리며, **혐오는 투명도 0.00으로 완전히 사라진다**. 시작 위치 `off=3`도 9개 목록의 한가운데(4)가 아니다. 원인은 `R=460`·`1−d/36`·`off=3`이 7계열 기준 값이라는 것이다.
  - **별자리로 교체하면 자연히 사라지는 문제이므로 아크를 고치지 말 것을 권한다.** 이 세션이 기하 수정(`R=300`·`1−d/50`·`off=중앙` → 9개 모두 노출, 최저 투명도 0.39)을 만들어 실측까지 했으나, 폐기될 컴포넌트라 **커밋하지 않고 되돌렸다.** 교체까지 시간이 걸려 미리보기를 임시로 멀쩡히 두고 싶다면 그 값을 쓰면 된다.
  - 아래 "다음 1"의 아크 폴백 항목은 D-041로 무효다 — 별자리의 폴백은 정본 §6.2에 이미 3열 격자로 적혀 있다.
- **인계(2026-09-17, 별자리 구현 세션 — 설계만 하고 파일은 건드리지 못한 채 중단).** 사용자가 "별자리 교체" 작업을 지시해 착수했으나 **실제 파일 변경은 0건이다** — `git status` clean, `design/style-guide.html`에 `아크`/`arc` 문자열이 여전히 25건 남아 있다. 아래는 이 세션이 확인·설계했지만 아직 코드로 옮기지 못한 내용이다. 다음 세션은 이 메모를 기준으로 바로 구현하면 된다(다시 조사할 필요 없음).
  - **확인한 것**: `DESIGN_SYSTEM.md:94-124`(§6.2 전문), `DECISIONS.md`의 D-041 전문, `style-guide.html`의 아크 관련 위치 3곳(CSS `/* 카테고리 아크 휠 (D-037) */` 블록, HTML `<h2>카테고리 선택기 — 아크 휠</h2>` 절과 바로 뒤 "큰 글자 폴백" 절, JS `/* ── 카테고리 아크 휠 ── */` IIFE), `design/tokens.json`의 `color.emotion`(9계열 50~900+label+source)·`motion`·`size`·`border` 구조, `data/taxonomy/v2.json`(`emotion-ko-v2`, `review_status: reviewed`, 9계열 194개 `label_ko`) 전체 라벨 스냅샷.
  - **설계한 것(다음 세션이 그대로 구현)**: 320×260 `.sky` 프레임에 `.star` 버튼 9개(44×44 히트존, 16px 코어에 `--c` 계열색, 라벨은 점 아래 22px, `aria-pressed`로 토글). 연결선은 프레임 위에 얹은 SVG `<polyline>`으로 그리되 좌표·순서는 어떤 필드로도 저장하지 않는다(§6.2 요구사항). 선택 시 코어에 `twinkle` keyframe을 1회만 재생하고 `prefers-reduced-motion`이면 끈다. 큰 글자 폴백은 기존 3열 격자(칸 101px, D-038 폴백 결정)를 그대로 재사용하되 클래스를 `.sky.grid`로 토글하고, 라벨 겹침·프레임 이탈을 실측해 자동 전환하는 스크립트를 붙인다. JS의 `CATS` 배열은 taxonomy 선언 순서(enjoyment/wish/sadness/anger/joy/love/hate/fear/disgust)를 그대로 쓰고 심리 축으로 재정렬하지 않는다(PR-001). 세부 감정 소프트 리스트는 고른 카테고리별로 sticky 그룹 머리글(계열 색 점 10px+이름)을 붙이고, 카테고리를 하나도 안 고르면 "위에서 카테고리를 먼저 골라 주세요" 안내로 바꾸며, 카테고리를 끄면 그 계열에서 골랐던 세부 감정도 함께 내려놓는다(D-041). 목록 표본 단어는 taxonomy v2 스냅샷으로 교체하고(기존 하드코딩된 슬픔 51개 목록은 정본과 무관한 임의 표본이었다), 이 페이지는 정본을 자동으로 따라가지 않는 스냅샷임을 note로 명시한다. `design/tokens.json`의 `motion.note`에 남은 "아크 스냅" 문구도 함께 정리한다.
  - **왜 못 끝냈나**: 패치를 한 번에 적용하려 bash heredoc(`cat > file <<'EOF' ... EOF`)으로 큰 Node 스크립트를 밀어넣다가 따옴표/EOF 매칭이 깨져(`unexpected EOF while looking for matching` 오류) 셸이 통째로 실패했고, 그 직후 사용자가 작업을 멈추고 인계 기록만 요청해 재시도하지 않았다. 스크래치패드에도 부분 파일이 남지 않았다(빈 디렉터리 확인함) — 즉 되돌릴 것도, 정리할 잔재도 없는 완전한 백지 상태다.
  - **다음 세션 절차**: (1) 위 설계대로 `Edit` 도구로 CSS·HTML·JS 세 블록을 각각 정확한 old_string/new_string으로 치환한다(한 번의 거대한 heredoc 대신 여러 개의 작은 Edit 호출을 쓸 것 — 이번 실패의 원인 회피). (2) `node scripts/check-contrast.mjs --verbose` → `npm run verify:quick`. (3) `design-preview` 브라우저 탭을 열어 9개 점이 320×260 안에서 잘리지 않는지 스크린샷으로 실측 확인(기존 아크가 깨졌던 바로 그 결함을 되풀이하지 않는지가 핵심 검증 항목). (4) 큰 글자 폴백 전환도 확인. (5) `npm run verify:full` → Artifact 재발행(`read` 먼저) → 이 인계 절 전체를 완료 체크포인트로 교체.
- **완료(2026-09-17, Codex): D-041 별자리 미리보기 구현.** `design/style-guide.html`에서 폐기된 아크 CSS·HTML·JS와 별도 4열/3열 비교 절을 제거하고, 320×260 별자리(9개 독립 토글, 44×44 히트존, 선택 링+굵은 라벨, 선택 순서 연결선, 1회 명멸, reduced-motion)를 구현했다. 라벨 겹침·프레임 이탈·루트 글자 120% 초과를 실측해 3×3 격자로 자동 전환한다. 별자리 선택과 taxonomy v2 스냅샷 기반 세부 감정 그룹을 연결했고, 카테고리 해제 시 그 계열의 세부 선택도 제거한다. 로컬 브라우저에서 일반 별자리 9개 무잘림, 즐거움+슬픔 다중 선택/연결선, 그룹 목록/트레이, 카테고리 해제 연쇄 정리, 테스트용 루트 20px에서 3×3 폴백을 확인한 뒤 테스트 값을 원복했다. `design/tokens.json`의 아크 스냅 문구도 D-041 명멸 규칙으로 교정했다. `check-contrast --verbose` 216/216 PASS, `verify:quick`·`verify:full` PASS(분류표 41/41, scope guard 11/11 포함). 기존 Claude Artifact 재발행은 현재 Codex 환경에 해당 도구가 없어 미실행이며 저장소 로컬 미리보기가 정본이다.
- **추가(2026-09-17, Codex): 캐릭터 무드 시안 v1.** 사용자가 기존 이미지 스타일 설정을 다시 확인할 수 있도록 `prompts.json`의 공통 스타일과 원자료 JPG 2장을 스타일 참조로 사용해 9종 합본 무드 시안을 imagegen으로 생성하고 `design/characters/mood-preview-v1.png`에 보존했다. `design/style-guide.html`에 “캐릭터 이미지 무드” 절을 추가해 수채·색연필·흔들리는 연필선·종이결·둥근 실루엣·안전한 표정이라는 확정 방향과 금지 요소를 함께 표시했다. 이 합본은 스타일 승인용이며 개별 1024/120px 최종 자산이나 이슈 #26 완료 증거로 세지 않는다.
- **추가(2026-09-17, Codex): 캐릭터 무드 시안 v2.** 사용자 참고 이미지의 복슬한 크레용 외곽선, 납작한 불투명 색면, 얼굴 중심의 짧은 비율과 엉뚱한 단순 표정을 반영해 9종 합본을 `design/characters/mood-preview-v2.png`로 생성하고 스타일 가이드의 대표 시안을 교체했다. v1은 비교용으로 보존했다. 이번 변경은 스타일 탐색이며 `prompts.json`과 이슈 #26의 개별 최종 자산은 사용자 승인 전까지 바꾸거나 완료 처리하지 않는다.
- 다음(실행·리서치):
  1. [x] **감정 별자리 지도 구현** — 2026-09-17 완료. 폐기된 아크 휠을 제거하고 D-041 다중 선택·3열 큰 글자 폴백·세부 목록 연동을 스타일 가이드에 반영했다(바로 위 완료 체크포인트).
  2. **캐릭터 생성** — ~~3번(taxonomy v2) **뒤에** 한다. 공포가 추가되면 7종이 8종이 되는데~~ **[정정, 2026-09-05] 3번(taxonomy v2)이 확정됐다 — 공포·혐오가 둘 다 신설되어 7종이 9종이 되는데** 일관성 때문에 같은 seed로 한 번에 만들어야 하므로, 먼저 만들면 전부 다시 만들어야 한다(D-038). 확정 후 codex imagegen → `node scripts/check-characters.mjs` 통과 → README §3 눈 검수. ~~생성 자체는 아직 시작하지 않았다(`design/characters/prompts.json` 7개 항목 그대로).~~ **[정정, 2026-09-06, 이슈 #26]** 공포·혐오 캐릭터 컨셉을 사용자와 대화로 확정(원자료가 없는 신설 계열이라 매 단계 질문으로 방향을 잡음): **공포=토끼**(제자리에 얼어붙어 귀를 뒤로 접은 자세, 크림색), **혐오=너구리**(앞발로 코를 막고 몸을 트는 자세, 자연색 회색+마스크). 동물 재사용(공룡/고양이) 대신 새 동물을 쓰기로 했다 — 프로젝트 규칙이 아니라 사용자의 창작 선택(근거는 `design/characters/README.md` §5). `prompts.json`에 두 항목의 `subject_prompt`·`accent`(fear `#199A8C`, disgust `#918C37` — tokens.json 500과 동일, override 불필요) 추가 완료, `version`을 `characters-v2-draft`로 올림, `README.md` §1·§2·§3을 9종 기준으로 갱신. `node scripts/check-characters.mjs` → `PENDING: 캐릭터 아이콘 9종 미제작` 정상 확인, `npm run verify:quick` PASS. **실제 PNG 9종 생성은 아직 안 했다** — `codex imagegen`은 Codex CLI 전용 기능이라 이 작업을 수행한 Claude Code 세션에는 실행 도구가 없다. Codex CLI에서 생성 → 여기서 `check-characters.mjs` 통과·README §3 눈 검수로 이어받아야 한다.
  3. **taxonomy v2 심리학 리서치(D-038)** — G3 원자료 전사(v1) 후 진행. **사용자가 방향을 확정했다(2026-09-04): 공포/두려움 카테고리 신설, 놀람은 기쁨 전용이 아님.** 나머지 세부 감정 귀속은 리서치로 정한다. 색 수용 가능성은 미리 재어 뒀다 — 8~9계열까지 가능하지만 쓸 수 있는 구역이 **초록~청록과 어두운 갈색뿐이고 보라는 포화**다(D-038). `emotion_code`(D-022) 마이그레이션 매핑도 함께 만든다. **[정정, 2026-09-05] 완료됐다** — taxonomy v2 9계열 194개 확정, 사용자 최종 대조(D-027)까지 마쳐 `review_status: reviewed`(위 TASK-TAXONOMY 안내, `docs/PROCESS_LOG.md` 참고). `emotion_code` 마이그레이션 매핑(`data/taxonomy/v1-to-v2.json`)도 함께 완료됐다.
  4. **실기기 확인** — chip 대비, 40px 아이콘 판독성, 44px 터치, 별자리 다중 선택 조작감(iPhone Safari·Android Chrome).
  5. **위기 안내 연락처 값** 검수.
- 주의: 색의 의미(어떤 계열이 어떤 감정인지)는 원자료를 따르므로 사용자 승인 없이 바꾸지 않는다(PR-010). 감정 색으로 위험·순위를 표현하지 않는다.

---

# 보류 기록: TASK-BOOTSTRAP — 현재 프로젝트 기술 감사와 구현 기반 확정

## 상태

`in_progress`

## 목표

현재 폴더를 Claude Code와 Codex가 공통 정본·작업 그래프·검증 하네스로 직접 개발할 수 있는 프로젝트 루트로 유지하고, 미확정 기술 가설을 실제 스파이크로 판정해 첫 애플리케이션 구현 작업을 확정한다.

## 범위

- 포함: 저장소/runtime 조사, 원자료 확인, Sites/D1 후보 스파이크, 구독 기반 모델 호출 경로 확인, 개인정보·권한 경계 검증, runtime profile, quality gate 실제 명령, provisional Decision 판정, 첫 구현 task
- 제외: 전체 제품 일괄 구현, 실제 사용자 데이터 입력, 공개 배포, 유료 자원 생성, 제품 핵심의 무승인 변경

## 연결 요구사항

- 전체 맥락: `PR-001`~`PR-015`
- 직접 판정: `B-01`~`B-08`
- 관련 결정: `D-006`~`D-008`, `D-011`, `D-014`~`D-016`, 신규 예정 `D-017`~`D-027`(아래 인계 메모)

## 소유권

- Main/Writer: 현재 프로젝트의 주 에이전트 1명
- 소유 파일: `harness/runtime-profile.json`, `harness/*.yaml`, `tasks/CURRENT_TASK.md`, 감사 결과로 바뀌는 정본
- 읽기 전용 조사/검증: 공식 문서 조사자, 독립 verifier
- 병렬 writer: 금지(현재 Git baseline 부재로 worktree 자체가 불가 — I-01)

## 인수 조건

- [x] 현재 폴더를 `main` 브랜치의 정상 Git 저장소로 재확립했다(2026-09-02 G0, D-017: 기존 `.git` 삭제 → `git init -b main` → baseline commit `32e68c8`, 46개 파일 → 플래그 없는 `git status` clean. 이전 "[x] 초기화" 기록은 옛 경로 기준으로 부정확했음).
- [x] Node/npm과 문서 하네스 명령을 `package.json`과 runtime profile에 기록했다(root를 현 경로로 갱신).
- [x] 원자료 3개의 존재·byte·SHA-256을 하네스로 확인했다(2026-09-02 재확인 PASS).
- [x] G1 계획 교정: 2026-09-02 재검증 보고서의 결함(I-01~I-18)과 사용자 결정을 정본에 반영했다(D-017~D-027, 아래 체크포인트의 파일 목록).
- [ ] B-02~B-08을 증거와 함께 `pass | fail | unknown`으로 판정했다(B-06은 "구독 기반 모델 호출 경로"로 재정의됨).
- [ ] `unknown`인 개인정보·권한 경계가 남아 있으면 구현을 차단했다.
- [ ] 앱 stack과 `lint/typecheck/test/build/e2e` 명령을 실제 스파이크 후 확정했다.
- [ ] provisional Decision을 유지/기각/대체하고 영향 문서를 동기화했다.
- [ ] work graph의 다음 `ready` 노드와 첫 구현 task의 owner/인수 조건을 지정했다.

## 계획

- [x] 저장소/runtime/원자료 감사
- [x] 2026-09-02 계획 재검증(주 에이전트 정독 + Sonnet 4개 병렬 적대적 검토 + 통합 심사; 보고서는 대화에 제출, 사용자 결정 5건 수령)
- [x] **G0**: `.git` 삭제 → `git init -b main` → user.name/email 확인(전역 설정 존재하여 repo-local 미설정) → baseline commit `32e68c8`
- [x] **G1**: 계획 교정(아래 파일별 목록) → `verify:quick`/`verify:full` PASS → 교정 commit(해시는 검증 증거 절)
- [ ] G2a hosting/identity 스파이크(B-02/B-03/B-08) → G2b D1 스파이크(B-04/B-05)
- [ ] G2c 구독 기반 모델 호출 경로 확인(B-06 재정의) / G2d Vector search(B-07) — RAG 트랙, critical path 밖
- [x] G3 taxonomy-v1 전사+사용자 검수(G2와 병렬 가능) — **완료**(`data/taxonomy/v1.json`, 7계열 194개, 전사+사용자 최종 대조 D-027 §7.8b 모두 2026-09-04) → [TASK-TAXONOMY-V1](TASK-TAXONOMY-V1.md)
- [ ] runtime profile·Decisions 최종 갱신, 첫 구현 task 생성

## 체크포인트

- 완료(2026-09-02, Claude Code Fable 5.1): 계획 재검증 → 사용자 결정 5건 → **G0** 기존 `.git` 삭제, `git init -b main`, baseline commit `32e68c8`(46 files, `.gitignore` 준수, `outputs/`·`work/`·로컬 MCP 설정 제외), 플래그 없는 `git status` clean → **G1** 아래 파일 교정 완료. 교정 파일: `docs/DECISIONS.md`(D-017~D-027), `docs/DATA_MODEL.md`(§2 timezone 검증, §3.1 조건부 UPDATE/CHECK/trigger, §3.2 CHECK·D-022 code, §3.4 PK, §3.5 read-time guard, §3.6 retired 소급, §5 상태도 D-023, §6 turn token, §8 batch 삭제·벤더 근거), `docs/ARCHITECTURE.md`(§1 결정 요약, §2 다이어그램·무료 대안, §3 턴 신뢰, §4.2/§4.4 구독 기반·후행, §5 CSRF D-025, §6 defense-in-depth, §10 게이트 열), `docs/AI_RAG_SPEC.md`(§1 hedging, §4, §5.1 이력 계약, §5.2 safety_signal, §7.2 code/LLM, §8 observation 대조, §9 필수 verifier, §10 감지 범위), `docs/SAFETY_POLICY.md`(§6 감지 범위·한국 리소스, §8), `docs/UX_SPEC.md`(§4 검색/필터, §5 후행·위기 전환, §7 상태 유지, §13 내보내기 신설), `docs/EVAL_PLAN.md`(§3, §4 B-06 재정의, §7 위기·턴 위조 케이스, §8.3 D-027, §9 턴 위조·관찰 위장, §13 제한 MVP, §14 게이트 라벨 정의 신설), `docs/RISK_REGISTER.md`(RK-001~003 대안, RK-011 정정, RK-015, RK-016 신규), `docs/ROADMAP.md`(Phase 0 G2a~d, Phase 3/5 후행, 제한 MVP 릴리스 절 신설), `docs/TRACEABILITY.md`(노드 재매핑, 불변조건 4건, 변경 영향), `harness/work-graph.yaml`(privacy-hosting-spike → hosting-identity/d1-data/model-access/vector-search, limited-mvp-release 추가, vector-search→evidence-pipeline 엣지), `harness/quality-gates.yaml`(severity medium, node_gates 재매핑, no_paid_api_calls), `harness/runtime-profile.json`·`.template.json`(root, model_access), `harness/loop-state.json`, `schemas/diary-entry`(slot 객체, completed 필수 시각, `\S`, category-prefixed code), `schemas/journal-assist-output`(`safetySignal` 필수, slot 동기화), `schemas/export`(analyses metadata 래핑), `scripts/verify.mjs`(`harness/README.md` required), `references/README.md`(D-027/D-022 문구), `.env.example`(OPENAI_API_KEY 제거, D-019/D-025 주석).
- 추가(2026-09-02 후속, D-029/D-030): 사용자가 "혼자 쓰는 도구"로 확정. Agent SDK는 공식 문서상 API 키 필수+타사 제품에 claude.ai 로그인 제공 금지라 제외. Claude Code CLI 헤드리스(`claude -p --json-schema`, 구독 로그인)를 B-06 후보로 채택하고 scratchpad에서 합성 입력으로 최소 스파이크 1회 PASS(구독 인증, 필수 키 6개 일치, 비창작, `safetySignal=none`, 벽시계 15초/API 8.5초, `claude-opus-5`). 정책 회색지대는 RK-017로 사용자 인지 기록. hosting을 본인 PC 자체 호스팅+Tailscale로 바꾸는 D-030은 PR-002 문구 변경이라 사용자 승인 대기.
- 추가(D-030 승인, D-031): 사용자가 자체 호스팅을 승인해 PRD PR-002·§4, README, ARCHITECTURE, DATA_MODEL, SAFETY, EVAL, RISK(RK-001~003/010 재작성, RK-017/018 신규), ROADMAP, TRACEABILITY, work-graph(`d1-data-spike`→`data-store-spike`), runtime-profile, BOOTSTRAP, `.env.example`을 로컬 서버+SQLite+사설망 기준으로 갱신. 모델은 같은 입력으로 3개 실측해 Sonnet 5(작성, 8.0초)/Opus 5(verifier·RAG, 15초) 채택, Haiku 4.5는 발화 무시로 탈락(D-031).
- 추가(D-032 승인): 사용자가 Supabase 대신 "직접 짠 백엔드" 방향을 택하고 선택지 B(Cloudflare Pages+Workers+D1)를 승인. D-030은 superseded. AI는 PC worker가 `ai_jobs` 큐를 outbound로 가져가 `claude -p` 호출(포트 개방 없음). PRD, README, ARCHITECTURE(§2 다이어그램, §3, §4.2, §4.6 신설, §5 job 경로, §6, §10), DATA_MODEL(§3.1, §3.8 `ai_jobs` 신설, §8), SAFETY §3, EVAL(§3, §4 B-02~B-08, §9, §10, §13), RISK(RK-001/002/003/010/018 재작성, RK-019 신규), ROADMAP, TRACEABILITY, AI_RAG_SPEC §1, BOOTSTRAP, work-graph(`data-store-spike`), runtime-profile, `.env.example`, loop-state 갱신. "B"가 Netlify+Turso를 뜻했다면 D-032를 수정한다.
- 추가(G2a/G2b 로컬 스파이크, 2026-09-02): 사용자가 G2a와 Cloudflare 자원 생성을 승인하고 계정 이메일을 알려줌. 채팅에 적힌 비밀번호는 **사용하지 않았고** 변경을 권고함(계정 로그인은 사용자가 `npx wrangler login` 브라우저 승인으로 수행). 계정 없이 가능한 부분을 `work/spikes/g2a-cloudflare/`(Git 제외, wrangler 4.128.0, miniflare 로컬 D1)에서 검증: HTTP 22/22 PASS(토큰 없음/오류 401, HMAC cookie 속성, custom header 없음·교차 Origin·cross-site 403, draft upsert/revision 409, 완료조건 미충족 422, CHECK 422, 조건부 완료 rev3, ai_jobs 202/lease 200·204/result 200·409/payload NULL, cascade 삭제 고아 0) + SQL 9건(CHECK, UNIQUE 2종, completed 보호 trigger 2종, 조건부 UPDATE, stale no-op). 발견: (1) 자식 먼저 삭제하면 completed 보호 trigger가 막으므로 부모 먼저 삭제+FK cascade로 확정(DATA_MODEL §8). (2) cascade 포함 DELETE의 `meta.changes`는 과대 계수(1행 삭제에 2) → 삭제 판정은 SELECT로. 원격 D1·휴대폰·rate limit·무료 한도·실제 worker 프로세스는 미검증.
- 추가(원격 G2a, 2026-09-02): 사용자가 `wrangler login`을 직접 승인(`whoami`: <cloudflare-account-email>). `wrangler d1 create emotion-diary-spike` → APAC, id `<d1-database-id>`; `d1 migrations apply --remote` PASS(테이블 3·trigger 2); Workers `<spike-worker>.workers.dev` 배포 2회(두 번째는 `ALLOWED_ORIGIN`을 실제 URL로); secret 3개(`APP_ACCESS_TOKEN_HASH`, `SESSION_HMAC_SECRET`, `WORKER_SECRET`)는 `wrangler secret put`으로만 등록. 원격 HTTP 22/22 PASS(첫 실행은 배포 직후 readiness 실패 1회, 재실행 PASS). 원격 D1: trigger 2종·CHECK 2종·UNIQUE 거부(`SQLITE_CONSTRAINT_*`, code 7500), 부모 우선 cascade 후 고아 0. `d1 info`: 61.4 kB, 읽기/쓰기 쿼리 수 집계 표시. `time-travel info`: 복구 bookmark 존재(복구 실습은 안 함). 스파이크 토큰은 채팅으로 사용자에게 전달(정본에 기록 안 함), 검증 후 회전·삭제 예정.
- 추가(실브라우저 확인, 2026-09-02): 사용자가 원격 URL을 **PC Chrome 152(Windows)**에서 실행 → `session: 200`, `put+header: 200 {status:"draft",revision:1}`, `put-no-header: 403 {"error":"csrf"}`. 실제 브라우저의 HTTPS `Secure` cookie 왕복과 fetch metadata 헤더 통과가 확인됨(B-02/B-03 원격 실브라우저 PASS). 모바일 실기기(B-08)는 아직 미실행.
- 추가(모바일 실기기, 2026-09-02): **iPhone iOS 18.7, 카카오톡 인앱 WebView(WebKit 605.1.15)** → `session: 200`, `put+header: 409 {"error":"revision_conflict"}`(PC에서 먼저 만든 오늘 draft revision 1을 휴대폰이 revision 0으로 덮어쓰려 해 거부됨 = 기기 간 optimistic lock 정상, cookie·CSRF 통과 증거), `put-no-header: 403`. B-08 `partial`: iOS WebKit HTTPS Secure cookie 왕복 확인, Safari 본체·홈 화면 standalone·Android Chrome 미확인. 스파이크 토큰은 채팅 노출 후 회전, 합성 데이터 삭제.
- 추가(정리, 2026-09-02): 스파이크 토큰 회전(`wrangler secret put APP_ACCESS_TOKEN_HASH`) → 직후 요청에서는 옛 토큰이 아직 200, 약 20초 뒤부터 옛 토큰 401·새 토큰 200(secret 변경 전파 지연 존재, 회전 절차에 반영 필요). 원격 D1 합성 데이터 전부 삭제(entries/emotions/jobs 0). 새 토큰은 `work/…/.spike-secrets.json`에만 있다.
- 추가(rate limit, 2026-09-02): Workers Rate Limiting binding(`[[ratelimits]]` 10/60s)을 무료 플랜에 배포는 됐으나 같은 key 30회(HKG/NRT 분산)에서 429가 0건 → 문서의 "permissive, eventually consistent, per location"대로 보안 경계 부적합, 기각. 대신 migration `0002_auth_failures`로 D1 전역 잠금(60초 10회 → 5분) 구현·배포: 실패 반복 시 429, 잠금 중 올바른 토큰도 429(`Retry-After: 300`), 카운터 초기화 후 200. Cloudflare Access는 JWT 헤더(`Cf-Access-Jwt-Assertion`)·certs 검증 방식만 문서로 확인, 무료 한도·workers.dev 적용은 확인 불가 → 선택 사항으로 보류.
- 추가(G2c 실제 왕복, 2026-09-02): `work/spikes/g2a-cloudflare/pc-worker.mjs`(Node, Bearer worker secret, `--once`/5초 폴링)가 원격 `ai_jobs`를 lease → Git Bash로 `claude -p --model claude-sonnet-5 --json-schema` 실행 → 결과 POST → owner 조회 `done`·payload NULL. 첫 시도는 Windows `spawnSync(shell:true)` 인용 문제로 `--json-schema is not valid JSON` 실패 → prompt/schema를 환경변수로 넘겨 bash에서 실행하도록 수정 후 성공. 합성 발화 11회 모두 사건만 반영·감정 코드 비움·`safetySignal=none`. **지연 10회**(worker 측 = claude 기동+API): min 7.7초 / p50 8.4초 / p95 12.1초 / max 12.1초, API만 p50 4.9초 / p95 9.4초. UX 목표(첫 응답 p95 8초)를 초과하므로 대화 UI는 "생각 중" 상태와 20초 timeout fallback을 전제로 설계하고, 기동 오버헤드(약 3.5초) 절감 방법은 후속 검토(RK-009). 스파이크 한계: 실패 job을 `failed`가 아니라 error 결과로 `done` 처리(실제 구현에서 분리), 만료 처리 미검증, Haiku가 보조 모델로 함께 호출됨(Claude Code 내부 동작, 비용 없음).
- 다음: Safari 본체/standalone/Android는 사용자가 가능할 때 추가 확인(차단 아님). G2c 잔여: 보존/학습 설정 확인, verifier 독립 2회 호출, 위기 케이스, job 만료·`failed` 전환. ~~**G3 taxonomy-v1** 착수 가능.~~ **[정정, 2026-09-05] G3 taxonomy-v1은 2026-09-04에 완료됐다**(`data/taxonomy/v1.json`, 7계열 194개, `review_status: reviewed`; 이어서 taxonomy v2도 2026-09-05에 사용자 최종 대조까지 마쳤다 — 상단 TASK-TAXONOMY 안내 참고). Phase 1 app-scaffold는 G2a/G2b partial PASS를 근거로 사용자 승인 시 시작. → rate limit 구현·Cloudflare Access 무료 적용 검토 → 스파이크 D1 데이터 비우기/토큰 회전. 이어서 G2c 실제 PC worker 프로세스+`claude -p` 결합. ~~G3 taxonomy-v1은 병렬 가능. G3 taxonomy-v1 전사(D-022 code, D-027 검수)는 G2와 병렬 가능.~~ **[정정, 2026-09-05] (위와 동일 — 이미 완료됨)** G2b는 G2a 통과 후, G2c/G2d는 RAG 트랙으로 critical path 밖.
- 결정: D-017~D-027 기록 완료(`docs/DECISIONS.md`). 이번 세션에서 제품 핵심(PR-001~PR-015, 원형 6영역, taxonomy, 두 작성 흐름)은 변경하지 않았다. `emotion_code` 형식만 D-022로 카테고리 접두어 규칙을 확정했다.
- 실패: 없음. 이전 체크포인트의 "safe-directory 이 정확한 경로만 등록함"은 옛 경로 기준이었고, TASK-CBM(D-028)이 이후 현 경로를 전역 `safe.directory`에 추가한 상태였다. G0 재초기화 후 `.git` 소유자가 현 계정이므로 그 항목 없이도 동작하며, 전역 설정은 변경하지 않았다.
- 주의: `outputs/`·`work/`는 비정본. Git 전역 `user.name=admin`/`user.email`은 기존 전역 설정 그대로 사용했고(지시: 없을 때만 repo-local 설정), 커밋 푸터는 실제 모델 표기 `Claude Fable 5.1`을 사용했다. 파일 교정은 모두 Decision과 연결. 유료 API 호출·외부 자원 생성 금지(D-019). TASK-CBM 기록은 원문 보존.

## 인계 메모 — 2026-09-02 계획 재검증 (새 세션 재개용)

### 사용자 결정 (채팅 승인, G1에서 Decision으로 기록)

1. **Git 재초기화 승인**: 기존 `.git` 삭제 후 현 계정으로 `git init -b main` + baseline commit(잃을 이력 없음 확인됨).
2. **RAG 단계 분리**: 직접 작성+대시보드 제한 MVP 선행 배포, RAG 분석은 후행 단계 — 기본 계획으로 승격.
3. **위기 대응**: 리소스 기준 국가 **한국 확정**. 감지 범위는 권고안 채택 — AI 관여 경로(대화 작성·명시 요청 분석)에서만 감지, 직접 작성 원문 자동 스캔 없음 + 한계 고지. (사용자가 국가만 명시적으로 답했고 범위는 권고안을 기본값으로 기록 — 이의 시 변경.)
4. **비용**: 유료 API(OpenAI API 등) 미사용. 사용자가 구독 중인 Codex/Claude 자원으로 가능한 방법만 검증. B-06을 "구독 기반 모델 호출 경로 확인"으로 재정의. 미확인 시 AI 대화·RAG는 보류하고 제한 MVP만 진행.
5. **Hosting 대안**: Sites 실패 시 무료 옵션으로 제한.

### 통합 결함 등록부 요약 (전체 근거는 2026-09-02 대화 보고서)

- **I-01 P0** Git baseline 부재+환경 기록 stale(runtime-profile root 옛 경로, RK-011 `mitigated` 과장 포함) → G0+G1에서 해소
- **I-02 P0** 위기 처리 경로 공백: `journal-assist-output.schema.json`에 안전 필드 없음 + 직접 작성 경로 무검사 vs SAFETY §6 문구 → safetySignal 필드 추가+정책 문구 축소(결정 3 반영)
- **I-03 P1** owner 경계 단일 장애점(ARCHITECTURE §6 서버 상수 owner_key, defense-in-depth 없음) + CSRF 방식 미정 → identity 헤더 허용 목록 대조 필수화, custom header CSRF 채택
- **I-04 P1** D1 interactive transaction 없음 vs DATA_MODEL "transaction 안에서" 서술, 완료 불변조건 TOCTOU, intensity CHECK·reminder PK 미명시 → 조건부 단문/trigger+CHECK로 재서술
- **I-05 P1** 완료 편집 상태 전이 모순(DATA_MODEL §5 상태도 vs PRD §8/UX §7) → "편집 중 completed 유지, 명시적 완료 취소만 draft"로 통일
- **I-06 P1** taxonomy 카테고리 간 중복 라벨 최소 7건(가벼운·흐뭇한·뿌듯한·포근한·고통스러운·구역질나는·황량한; "증오하는/증오스러운"은 미확정) → 카테고리별 독립 emotion_code 발급 규칙
- **I-07 P1** Verifier "가능하면" 약화, Quality Filter code/LLM 미구분, observations 자유 서술 유출 경로 → 독립 실행 필수화+observation 검증 확장
- **I-08 P1** reviewer 2인 요구 vs 1인 제품 → 1인 대안 절차 Decision, 지표 "고정셋 기준" 명시
- **I-09 P1** Vector Store chunk 반환 vs source_spans 대조, attributes 16키/스칼라 vs topicCodes 배열 → B-07 스파이크 항목화
- **I-10 P1** work-graph 결함: privacy-hosting-spike 과잉 통합, evidence-pipeline 선행 엣지 누락, quality-gates 미정의 라벨 13개, severity medium:0이 EVAL과 상충 → 노드 분해+라벨 재매핑+severity 일치
- **I-11 P1** 클라이언트 제공 대화 이력 신뢰 계약 미정의(과거 턴 위조 공격면) → AI_RAG_SPEC §5.1/§10 보강
- **I-12~I-18 P2**: export 모바일 UX 부재 / 칭찬·감사 slot 정보 schema 소실 / 대형 감정 목록 검색·필터 부재 / 클라이언트 timezone 신뢰 한계 / stale read-time guard 미명시 / D1 백업·보존은 벤더 문의 필수 / retired Evidence 소급 표시 부재
- P3: suggestedEmotionCodes minItems, whitespace 통과, verify.mjs required에 `harness/README.md` 누락, 검수 문구 통일 등

### G1 파일별 교정 목록 (모두 위 I-번호·사용자 결정과 연결)

| 파일 | 교정 |
| --- | --- |
| `docs/DECISIONS.md` | D-017~D-027 신규(사용자 결정 5건 + taxonomy 중복 코드, 완료 편집 상태, D1 원자화, CSRF, Verifier 필수화, 1인 검수 대안) |
| `docs/DATA_MODEL.md` | §3.1 tx→원자적 statement/trigger+CHECK, §3.4 PK, §3.5 read-time guard, §5 상태도, §6 턴 계약 |
| `docs/ARCHITECTURE.md` | §5 CSRF 확정, §6 defense-in-depth, §2/§4.4/§10 B-06 재정의(구독 기반) 반영 |
| `docs/AI_RAG_SPEC.md` | §1 구독 기반 hedging, §5 safetySignal+이력 계약, §7.2 code/LLM 구분, §8 observations 제한, §9 필수화, §10 |
| `docs/SAFETY_POLICY.md` | §6 감지 범위(AI 관여 경로만)+한국 리소스 확정 |
| `docs/UX_SPEC.md` | export 절 신설, 감정 검색/필터, §5 위기 전환, §7 상태 유지 문구 |
| `docs/EVAL_PLAN.md` | §4 B-06 재정의, §7 위기 케이스, §8.3 1인 대안+고정셋 표기, §9 턴 위조·관찰 위장 케이스, 게이트 라벨 정의 절 |
| `docs/RISK_REGISTER.md` | RK-011 정정, RK-016 신규(구독 기반 경로 부재 시 AI 기능 보류) |
| `docs/ROADMAP.md`, `docs/TRACEABILITY.md` | 그래프 분해·제한 MVP 선행 반영 |
| `harness/work-graph.yaml` | privacy-hosting-spike → hosting-identity/d1-data/model-access/vector-search 분해, evidence-pipeline 엣지 추가(verify.mjs 파서 형식 유지 주의) |
| `harness/quality-gates.yaml` | severity medium 완화(EVAL §11 일치), node_gates 라벨 재매핑 |
| `harness/runtime-profile.json` | root=현 경로, generated_at/verified_by/evidence 갱신, unknowns에 구독 기반 경로 추가 |
| `schemas/diary-entry.schema.json` | praises/gratitudes를 `{slot(1~3), text}` 객체로, completed 시 firstCompletedAt 등 필수화, text `\S` 패턴 |
| `schemas/journal-assist-output.schema.json` | `safetySignal` 필드 추가(required), draftPatch slot 구조 동기화 |
| `schemas/export.schema.json` | analyses 항목에 기간·버전 metadata 래핑 |
| `scripts/verify.mjs` | required에 `harness/README.md` 추가 |
| `references/README.md` / `.env.example` | 검수 문구 통일 / OPENAI_API_KEY 주석을 D-019에 맞게 수정 |

### 재개 절차 (새 세션 첫 행동)

1. 이 파일과 `AGENTS.md`, `README.md`를 읽는다. `outputs/`·`work/`는 무시.
2. G0: `.git` 삭제(사용자 승인 완료됨) → `git init -b main` → `git config user.name/email` 확인 → 전체 스테이징(.gitignore 준수) → baseline commit(한국어 메시지+Fable 5 푸터) → 플래그 없는 `git status` 성공 확인.
3. G1: 위 표 순서로 교정 → `npm run verify:quick` → `npm run verify:full` → 본 파일 체크포인트 갱신 → 교정 commit.
4. 이후 G2a부터. Sites 프로젝트 생성은 외부 자원이므로 실행 직전 사용자에게 재확인.

## 검증 증거

- 환경: Windows 11, Node 22.16.0, npm 10.9.2, git 2.49.0.windows.1. G0 이후 플래그 없는 `git status` 정상.
- G0 증거: `git log --oneline -1` → `32e68c8 감정일기 프로젝트 baseline: 제품 정본·하네스·원자료 초기 커밋`; `git status` → `nothing to commit, working tree clean`.
- G1 명령: `npm run verify:quick` → PASS, `npm run verify:full` → PASS(앱 script가 없어 문서 하네스만 검사; 앱 기능 검증이 아님). 교정 commit 해시는 완료 보고와 `git log`로 확인.
- 로컬 스파이크 명령(2026-09-02, `work/spikes/g2a-cloudflare`): `npx wrangler d1 migrations apply DB --local` → PASS; `npx wrangler d1 execute DB --local --command ...` 9건; `node spike-test.mjs`(wrangler dev 기동 후 fetch 22건) → `SUMMARY 22/22 PASS`.
- 원격 스파이크 명령(2026-09-02): `npx wrangler d1 create emotion-diary-spike`, `npx wrangler d1 migrations apply DB --remote` → PASS, `npx wrangler deploy` ×2, `npx wrangler secret put` ×3, `node remote-test.mjs` → `SUMMARY 22/22 PASS`, `npx wrangler d1 execute DB --remote --command ...` 거부 4건+cascade 1건, `npx wrangler d1 info`, `npx wrangler d1 time-travel info`.
- 미검증/알려진 제한: B-02/B-03/B-04/B-06 큐는 로컬·원격 `partial`. 휴대폰 실기기(B-08), rate limit, 무료 한도 수치, Time Travel 복구 실습, 실제 PC worker 프로세스, 검색 계층(B-07), Web Push는 `unknown`. 스파이크 Worker는 공개 URL이며 토큰 없이는 HTML 안내 페이지 외 데이터를 주지 않는다. D-024의 D1 trigger/batch 지원, D-025의 identity 헤더·custom header 통과는 G2a/G2b 실검증 전까지 가설. `schemas/*`는 Ajv 등 실제 validator로 아직 검증하지 않았다(JSON 구문만 하네스 확인). ~~taxonomy-v1 전사와 D-027 검수는 미착수.~~ **[정정, 2026-09-05] 완료됐다**(`data/taxonomy/v1.json`, 7계열 194개, `review_status: reviewed`, 2026-09-04; taxonomy v2도 2026-09-05에 사용자 최종 대조까지 마쳤다 — 상단 TASK-TAXONOMY 안내 참고). Codebase Memory MCP는 이 세션에서 연결 실패(CONNECTION_CLOSED)하여 Graph 탐색 없이 직접 Read/Grep으로 진행했다.
