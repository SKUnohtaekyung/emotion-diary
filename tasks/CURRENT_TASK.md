# 현재 작업

이 파일에는 **진행 중이거나 곧 시작할 작업만** 둔다. 끝났거나 보류된 작업의 절은 [archive/](archive/README.md)로 옮긴다 — 이 파일이 한 번에 읽히는 크기여야 하고, `scripts/claude-scope-guard.mjs`가 이 파일의 `- 소유 파일:` 선언을 전부 합쳐 허용 목록으로 쓰기 때문이다(끝난 작업의 선언이 남아 있으면 그만큼 가드가 헐거워진다). `harness/loop-state.json`의 `task_id`는 아래 절 가운데 진행 중인 것의 머리글과 같아야 한다(`scripts/check-harness.mjs`가 quick에서 확인).

| 작업 | 상태 | 어디에 |
| --- | --- | --- |
| TASK-INFRA-01 개발 인프라 정비 | 진행 중 | 이 파일 |
| TASK-WEB-UI-01 브라우저 우선 UI 프로토타입 | planned, 사용자 승인 대기 | 이 파일 |
| [TASK-MOBILE](TASK-MOBILE.md) 설치형 홈 화면 웹앱 | 보류 — Phase 1 착수 시 재개(이슈 #1~#9) | 별도 파일 |
| [TASK-DS-REF](TASK-DS-REF.md) TDS 규칙 참고 | 보류(이슈 #10~#14, D-039 reserved) | 별도 파일 |
| [TASK-TAXONOMY](TASK-TAXONOMY.md) · [V1](TASK-TAXONOMY-V1.md) · [PLAN-V2](TASK-TAXONOMY-PLAN-V2.md) | 완료(2026-09-05, D-038·D-040 accepted) | 별도 파일(다른 문서가 경로로 인용해 옮기지 않았다) |
| TASK-ISSUE-26 · ISSUE-27 · CBM · DESIGN · BOOTSTRAP | 완료·보류 기록 | [archive/](archive/README.md) |

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
- 완료(2026-09-20, 묶음 1 · commit `7149b84`): `.gitattributes`(`references/source/** -text`)와 blob renormalize(204B→원본 221B), 워크플로에 `npm ci`·full·Ubuntu/Windows 매트릭스. LF checkout 모사 트리에서 quick·full PASS를 먼저 확인했고, **PR #28에서 두 OS 모두 초록불 — 이 저장소의 첫 CI 성공**이다.
- 완료(2026-09-20, 묶음 2·3): `scripts/check-harness.mjs`를 harness 동기화보다 **먼저** 만들어 낡은 상태에서 FAIL 11건·WARN 2건을 재현한 뒤(AGENTS §5.1) 고쳤다. 결정론적 모순만 FAIL, 시간·커밋 거리 신호는 WARN(exit 0) — quick을 Stop 훅이 매 턴 돌리므로 날짜가 지났다거나 CI가 얕은 clone이라는 이유로 실패하면 검사가 새 고장 지점이 된다. 테스트 `test-check-harness.mjs` 28/28(CRLF fixture, 엉뚱한 이유의 실패를 막는 문구 대조 포함). harness: `bootstrap-audit`은 자기 gate(`bootstrap-facts`) 기준으로 `done`, `hosting-identity-spike`·`model-access-spike`는 증거가 partial이라 `verifying`, `data-store-spike`는 선행 미완이라 계약대로 `blocked`(증거 수집 사실은 주석). `loop-state`는 이 작업 기준으로 다시 썼고 옛 서사는 git 이력에 있다. `runtime-profile`의 commands·unknowns·evidence, `quality-gates`의 `unit-and-integration`(`npm test`), `harness/README`의 낡은 현재형 서술을 고쳤다.
- 완료(2026-09-20, 묶음 4 일부): `schemas/diary-entry`·`journal-assist-output`의 카테고리 enum/pattern 7→9. v2의 감정 code 194개가 새 pattern을 전부 통과함을 따로 확인했다. `scripts/test-claude-git-guard.mjs` 15/15(받아들인 오탐·미탐은 `known`으로 고정), sharp 미설치 시 verify가 원인(`npm ci`)을 말하도록 수정, `verify.mjs` 필수 목록에 `.gitattributes`·새 검사기 추가.
- 주의: verify의 충돌 표식 검사(`^=======`)는 Markdown setext 머리글 밑줄도 충돌로 본다. 지금 추적 파일에는 해당 줄이 없지만 누가 그 문법을 쓰면 quick이 깨진다(후속 후보).
- 완료(2026-09-20, 묶음 4 · commit `b54a0a2`): PRD PR-004·§6.1(사용자가 초안 diff 확인 후 승인), UX_SPEC 2곳·ROADMAP·DATA_MODEL export 필드명, quick 정의 네 곳, AGENTS §2.1 커밋 메시지 규칙 일원화·서두의 "강제는 Claude 전용" 단서·§2.3 Codex, D-039 reserved 행과 끊긴 표 머리글 복구, RK-007 closed, DS-REF·MOBILE `on_hold`, BOOTSTRAP 감사 완료 표시, `[정정]` 6곳 흡수. CI 두 OS 초록불.
- 완료(2026-09-20, 묶음 5·6): 이 파일 90,026B → 약 10KB. 끝난 절 다섯 개를 `tasks/archive/`로 옮겼다 — 본문은 스크립트로 바이트 그대로, 새 글(머리말·색인·`archive/README.md`)만 손으로 썼다. **독립 검산**(직전 커밋 `b54a0a2`에서 절을 다시 잘라 대조)이 스크립트의 링크 재작성 버그(`../../`)를 잡아 고쳤고, 재검산은 5개 절 + 옛 머리말 모두 동일. 산문 참조 3곳(AGENTS §2.2, STATUS §5, TRACEABILITY AG-CBM-001) 갱신. `docs/STATUS.md` 재작성(`[정정]` 4겹 흡수, 9/2 이후 완료 사항 반영, 커밋 규칙은 AGENTS §2.1을 가리킴), `docs/PROCESS_LOG.md` §4 회고. quick·full PASS, WARN 0건.
- 손대지 않은 것과 이유: `docs/DECISIONS.md`·`docs/PROCESS_LOG.md` 안의 `[정정]`·취소선(덧붙임 기록이 본질), `references/README.md`의 `[정정]` 1곳과 `tasks/TASK-TAXONOMY*.md`(끝난 작업 문서, 다른 문서가 경로로 인용), `AI_RAG_SPEC`의 snake_case 예시·`EVAL_PLAN`의 "1:1 대조" 대상 모호함·`ARCHITECTURE`의 "transaction" 표기(후행 단계이거나 표기 수준 — `docs/STATUS.md` §4 후속 목록), `SAFETY_POLICY`(조사자가 참조와 핵심 줄만 확인, 전문 미대조).
- 남은 사용자 결정: PR #28의 main 병합, 이슈 #27 닫기, 디자인 미리보기 Artifact 재발행.

# TASK-WEB-UI-01 — 브라우저 우선 직접 작성 UI 프로토타입

## 상태와 범위

`planned` — 2026-09-19 사용자 지시. 앱 코드가 아직 없는 Phase 0 저장소에서, Cloudflare/DB/인증/AI를 앞당기지 않고 브라우저에서 직접 작성 흐름과 캐릭터 배치를 검토할 수 있는 정적 웹 프로토타입을 만든다. 데이터는 저장하거나 전송하지 않는다. 직접 작성 MVP의 화면 순서·비진단·접근성 규칙은 `UX_SPEC` §2~4, `DESIGN_SYSTEM` §6·§8~9를 따른다. 사용자 승인 전에는 구현 파일을 만들지 않는다.

## 소유권

- Main/Writer: 착수할 때 지정한다(2026-09-19에 이 절을 등록한 Codex 세션은 종료됐다 — 2026-09-20 사용자 확인). 별도 하위 에이전트 없음.
- 소유 파일: `web/*`, `scripts/web-preview.mjs`, `tasks/CURRENT_TASK.md`.
- 넘겨받은 검수(이슈 #26에서 이관): iPhone Safari·Android Chrome 실기기, 실제 OS reduced-motion, 회색조·label 없음 판독. 상세는 [archive/TASK-ISSUE-26.md](archive/TASK-ISSUE-26.md)의 "후속 보류" 체크포인트.

## 인수 조건

- 오늘/달력/통계/설정 하단 탐색과 직접 작성 화면을 브라우저에서 전환할 수 있다.
- 날짜·사건·상위 카테고리 다중 선택·세부 감정 선택·감정별 강도·이유·칭찬/감사 3개·검토/완료의 UI 흐름을 구현한다.
- 대표 캐릭터는 카테고리 식별 보조로, UI 정적 포즈는 온보딩/빈 상태 장식으로만 사용한다.
- 실제 저장·로그인·AI·분석·내보내기·삭제는 구현하지 않고, 프로토타입임을 분명히 표시한다.
- 360px와 데스크톱 Chromium에서 키보드·초점·44px 조작 영역·가로 넘침·reduced-motion 스타일을 확인하고 `verify`를 통과한다.

