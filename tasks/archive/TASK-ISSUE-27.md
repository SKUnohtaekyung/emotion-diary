> **아카이브(2026-09-20, TASK-INFRA-01).** `tasks/CURRENT_TASK.md`에서 옮긴 기록이다. 옮기기 직전 커밋은 `b54a0a2`이고 아래 본문은 옮기기 전과 바이트 그대로다. **상태:** done(2026-09-06) — 훅은 동작 중이고 이슈 #27은 2026-09-20 사용자 지시로 닫았다(남긴 한계는 이슈의 마지막 코멘트와 AGENTS §2.2 — Bash 경유 쓰기, Claude 전용). 이 파일의 `- 소유 파일:` 선언은 scope-guard에 더 이상 반영되지 않는다 — 훅은 `CURRENT_TASK.md`만 읽는다.

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

