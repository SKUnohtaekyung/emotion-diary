# 역할 정의, 위임문 틀, 워크플로 (TASK-LOOKBACK-01)

> **보류 (2026-11-12)**: 시안 없이 다섯 세션으로 짓던 옛 계획의 일부다. 시안 단계(`SIAN.md`)의 세션은 이 파일을 읽지 않는다. 실제 코드 단계의 계획을 다시 쓸 때 참고 자료로만 쓰고, `PLAN.md` 5번의 약점을 고친다. 4번의 "Fable이 안건과 결정 기록을 쓴다"는 옛 시작 문구의 "Fable은 파일을 고치지 않는다"와 모순이었다.

묶음 0에서 일반 작업자(Sonnet)가 이 파일을 보고 `.claude/agents/`와 `.claude/workflows/`에 파일을 만든다. 사용자 승인이 필요하다. 역할 정의 파일은 세션을 시작할 때만 읽히므로, 묶음 0이 끝난 뒤 새로 시작한 세션부터 쓸 수 있다.

정의가 적용되지 않는 경우의 대체: 호출할 때 모델과 effort를 직접 지정한다(이 방식은 계획을 세운 세션에서 실제로 동작했다). 프로젝트 문서 미적재가 먹지 않으면 그대로 진행하고 진행 기록에 적는다. 비용만 늘고 동작은 같다.

## 1. 역할 정의

모든 정의에 `model`과 `effort`를 적는다. 적지 않으면 Fable을 물려받는다. `maxTurns`는 시작값이고 첫 묶음에서 실제 사용량을 보고 고친다.

| 이름 | 역할 | model | effort | 도구 | 프로젝트 문서 | maxTurns |
|---|---|---|---|---|---|---|
| `spec-writer` | 기획 | opus | high | Read, Grep, Glob, Write | 싣는다 | 30 |
| `copy-writer` | 문구 | sonnet | medium | Read, Grep, Glob, Write | 싣는다 | 25 |
| `screen-designer` | 디자인 | opus | high | Read, Grep, Glob, Write | 싣는다 | 35 |
| `server-dev` | 서버·저장 | sonnet | medium | Read, Grep, Glob, Edit, Write, Bash | 싣지 않는다 (`omitClaudeMd: true`) | 60 |
| `client-dev` | 화면 | sonnet | medium | Read, Grep, Glob, Edit, Write, Bash | 싣지 않는다 | 60 |
| `integrator` | 통합 담당 | sonnet | medium | Read, Grep, Glob, Edit, Write, Bash | 싣지 않는다 | 60 |
| `gate-reviewer` | 검토 | opus | high | Read, Grep, Glob, Bash | 싣는다 | 40 |

- 기술 설계 문서(`TECH.md`)는 `server-dev`를 호출하면서 모델을 opus로, effort를 high로 올려 쓴다.
- 문서에서 절을 뽑아 오는 일은 내장 탐색 에이전트(Explore)를 haiku로 부른다. 이 에이전트는 프로젝트 문서를 싣지 않는다.
- 미리 싣는 스킬은 없다. `gate-reviewer`가 보안 검토를 할 때만 security-review 스킬을 쓴다.
- 프로젝트 문서를 싣는 역할은 서비스 WHY 전문이 자동으로 들어온다. 본문에서 §17, §19, §20을 판단 기준으로 쓰라고 적는다.

### 구현 역할 공통 규칙 카드 (`server-dev`, `client-dev`, `integrator` 본문에 넣는다)

프로젝트 문서를 싣지 않으므로 아래를 정의 본문에 그대로 둔다.

- `git add`, `git commit`, `git push`를 하지 않는다.
- 위임문에 적힌 소유 파일만 고친다. 다른 파일을 고쳐야 하면 멈추고 보고한다.
- 사용자 ID, 권한, 날짜, 상태는 클라이언트 값을 믿지 않고 서버에서 검증한다.
- 모든 변경 요청은 다시 보내도 안전해야 한다.
- 사용자가 쓴 글, 비밀값, 실제 식별정보를 로그·시험 자료·예제에 넣지 않는다. 시험 자료는 지어낸 문장만 쓴다.
- 새 CSS는 토큰 변수만 쓴다. 새 클래스에는 위임문이 준 접두어를 붙인다.
- 화면 문구는 `COPY.md`에서 글자 그대로 가져온다. 문구를 지어내지 않는다.
- 있는 유틸과 부품을 쓴다. 공용 부품을 새로 추출하거나 기존 코드를 정리하지 않는다.
- 끝나면 보고 형식대로만 보고한다.

### 역할별 읽기 목록 (위임문에 경로와 절로 넣는다)

- **기획**: `tasks/reflection/2026-11-11/PLAN.md` / `docs/UX_SPEC.md` §2, §6.1, §7, §9 / `PRD.md` §3, §8 / 결정 행 D-012, D-023, D-050, D-064, D-065, D-070, D-076, D-078, D-081, D-082, D-083, D-086, D-090, D-096, D-100, D-105, D-107, D-129
- **문구**: `docs/UX_SPEC.md` §6.1 / `docs/BRAND_STORY.md` §8, §9 / `tasks/qa/2026-10-13/UX-WRITING.md`, `TERMS.md` / `docs/DESIGN_SYSTEM.md` §11 / `SPEC.md`
- **디자인**: `docs/DESIGN_SYSTEM.md` §2, §5, §6.1, §6.7, §6.8, §6.9, §6.11, §6.12, §6.13, §6.16, §11 / `docs/design-system/components/list-row.md`, `empty-state.md`, `sheet.md` / `docs/UX_SPEC.md` §11, §17 / 기존 화면 `app/client/src/views/calendar.tsx`, `stats.tsx`, `settings.tsx`, `done.tsx`와 `app/client/src/styles/` / 위 결정 행 / `SPEC.md`, `COPY.md`
- **화면**: `docs/design-system/INVENTORY.md` §1 / `docs/UX_SPEC.md` §11, §17 / 코드 예(모두 `app/client/src/` 아래) `views/done.tsx`, `views/calendar.tsx`, `lib/mount.ts`, `lib/api.ts`, `write/reflectionApi.ts`, `write/dataApi.ts`, `ui/StatusBlock.tsx`, `ui/sheet.ts`, `ui/toast.ts`, `ui/bottomNav.ts`, `styles/settings.css` / 해당 `DESIGN-*.md`, `COPY.md`, `TECH.md`의 계약 절
- **서버·저장**: `app/migrations/0006_diaries.sql`, `0007_idempotency_records.sql` / `app/worker/src/app.ts`, `router.ts`, `request.ts`, `http.ts`, `idempotency.ts`, `session.ts`, `routes/diaries.ts`, `routes/reflection.ts`, `routes/dataControl.ts` / `app/shared/api.ts`, `app/shared/diary.ts` / `schemas/export.schema.json`, `app/scripts/backup.mjs` / `docs/DATA_MODEL.md` §2, §3, §5, §8, §9 / `app/test/worker/harness.ts`, `data-control.test.ts`, `reflection.test.ts` / `TECH.md`
- **통합 담당**: 그 조각의 공용 파일, `TECH.md`의 공용 파일 절, 해당 `DESIGN-*.md`의 입구 절 / 시험 관례 `app/test/e2e/helpers.ts`, `a11y.spec.ts` / 등록과 기록을 맡을 때는 `scripts/check-harness.mjs`, `scripts/claude-scope-guard.mjs`와 기존 선언
- **검토**: 채점 대상 산출물, 해당 채점표, 채점에 필요한 정본 절만

`docs/DECISIONS.md`는 통째로 읽지 않는다. `| D-NNN |`로 행을 찾아 읽는다.

## 2. 위임문 틀

```
목표: (한 문장. 이 조각이 끝나면 무엇이 참이 되는가)
읽을 것: (경로와 절. 이것만 읽는다)
만들 것: (산출물 파일 경로와 형식)
소유 파일: (고쳐도 되는 경로. 구현 역할만)
하지 말 것: (이 조각에 한정된 금지. 범위를 넘는 일, 건드리지 않을 파일)
완료 조건: (통과와 실패가 갈리는 문장. 돌릴 명령 포함)
보고: 아래 보고 형식, 300단어 이내
```

- 배경 설명은 넣지 않는다. 필요한 맥락은 "읽을 것"의 파일에 있어야 한다.
- 소유 파일은 `tasks/CURRENT_TASK.md`에 적는 선언과 같은 글자로 적는다. 선언은 범위 확인 훅이 읽는 형식을 따른다(`*`는 경로 한 조각만 맞는다).
- 문구 보완을 맡길 때는 새 디자인 문서의 상태 격자를 "읽을 것"에 넣고, `COPY.md`에 없는 상황의 문구만 더하게 한다.
- 같은 역할을 연달아 부를 때는 5분 안에 이어 불러 캐시를 겹친다.

## 3. 보고 형식

```
상태: 끝남 / 막힘
산출물: (파일 경로)
바꾼 파일: (경로 목록. 구현 역할만)
완료 조건별 결과: (조건마다 통과·실패와 근거: 명령과 결과 한 줄, 캡처 경로)
스스로 찾은 약점: (최대 3개)
막힌 이유: (막힘일 때만)
```

검토 보고는 채점표 항목마다 통과·실패·알 수 없음과 근거 경로를 적고, 채점표 밖의 지적은 적지 않는다.

## 4. 회의 규칙 (두 차례 왕복)

1. Fable이 안건 파일을 쓴다(안건마다 결정해야 할 질문 하나).
2. **1차**: 참여 역할이 나란히, 안건마다 자기 입장과 이유를 `council-N/<역할>-1.md`에 쓴다. 역할당 400단어 이내.
3. Fable이 세 파일을 읽고 의견이 갈린 안건과 역할을 가린다.
4. **2차**: 의견이 갈린 역할만, 상대 의견 파일을 읽고 동의·반박·수정안을 `council-N/<역할>-2.md`에 쓴다. 갈리지 않은 역할은 부르지 않는다.
5. Fable이 `DECISION-N.md`에 안건마다 결정, 이유, 버린 안을 적는다.
6. 담당 역할이 결정 기록을 받아 산출물(`TECH.md` 또는 `DESIGN-lookback.md`)을 쓴다.

3차 왕복은 없다. 2차 뒤에도 갈리면 Fable이 정한다.

## 5. 재사용 워크플로

작성 전에 workflow-authoring 스킬을 읽는다. 워크플로 사용이 거절되면 같은 순서를 직접 위임으로 진행한다.

### `council-round`

- 인자: 안건 파일 경로, 참여 역할 목록, 차수(1 또는 2), 차수 2일 때 역할별로 읽을 상대 의견 파일
- 동작: 역할마다 에이전트 하나를 나란히 돌려 의견 파일을 쓰게 한다.
- 돌려주는 것: 의견 파일 경로 목록과 역할별 안건별 입장 한 줄씩.

### `build-slice`

- 인자: 조각 이름, 공용 파일 지시, 서버 위임문, 화면 위임문, 마감 지시(e2e, 접근성, 캡처, 입구 연결)
- 동작:
  1. `integrator`가 공용 파일과 빈 새 파일을 만든다.
  2. `server-dev`와 `client-dev`를 나란히 돌린다. 한쪽 위임문이 비어 있으면 그쪽은 건너뛴다.
  3. `integrator`가 마감 지시를 수행하고 `node scripts/verify.mjs --mode full`과 `npm run e2e`를 돌린다.
  4. 실패하면 실패한 쪽 역할에 실패 출력의 끝부분만 넘겨 고치게 한다. 두 번까지.
- 돌려주는 것: 통과 여부, 바꾼 파일 목록, 검사 출력 요약, 캡처 경로, 쓴 에이전트 횟수.

워크플로가 끝나면 Fable이 `gate-reviewer`를 불러 G3의 판단 항목만 채점하게 하고, 명령 항목은 워크플로가 돌려준 증거와 quick 재측정으로 판정한다.
