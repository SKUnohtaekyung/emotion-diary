# Harness–Loop–Graph 실행 파일

이 폴더는 [../docs/AGENT_WORKFLOW.md](../docs/AGENT_WORKFLOW.md)의 기계 판독 보조 파일이다. 문서와 충돌하면 정본 문서를 우선하고 이 파일을 같은 변경에서 갱신한다.

## 파일

- `runtime-profile.template.json`: 새 프로젝트의 실제 환경을 조사해 `runtime-profile.json`으로 만드는 양식
- `work-graph.yaml`: 단계 간 선행조건, 산출물, gate의 초기 DAG
- `quality-gates.yaml`: quick/full/release에서 실행해야 할 검증 범주와 실제 명령 슬롯
- `loop-state.json`: 현재 에이전트 루프의 작고 재개 가능한 상태

## 현재 프로젝트에서 갱신

1. 현재 [runtime-profile.json](runtime-profile.json)을 읽고 실제 환경이 바뀌었으면 증거와 함께 갱신한다. 템플릿은 다른 환경으로 이식할 때만 사용한다.
2. `unknown`을 추측으로 채우지 말고 명령 결과·공식 URL·스파이크 경로를 evidence에 남긴다.
3. 선행 노드가 `done`이 되기 전에는 다음 노드를 `in_progress`·`verifying`·`done`으로 바꾸지 않는다. 노드의 현재 상태는 이 문서에 적지 않는다 — `work-graph.yaml`이 유일한 기록이다. 증거가 일부만 모인 노드는 `verifying`으로 두고 남은 항목을 그 노드의 주석에 적는다.
4. quality gates의 `command: null`은 도구 미선택을 뜻한다. `package.json`에 해당 script가 생기면 같은 변경에서 채운다.
5. 한 번의 루프가 끝날 때 `loop-state.json`과 `tasks/CURRENT_TASK.md`를 함께 갱신한다. `loop-state.json`의 `task_id`는 `CURRENT_TASK`에서 진행 중인 작업의 머리글과 같아야 하고, `completed_nodes`는 `work-graph.yaml`의 `done` 노드와 같아야 한다. `last_verified_commit`은 full 검증을 통과한 가장 최근 커밋이다(자기 자신을 담는 커밋의 해시는 미리 알 수 없으므로 한 커밋 뒤처지는 것이 정상이다).

YAML/JSON 파일은 자율 실행기가 아니다. 에이전트가 선행조건을 건너뛰지 않고, 실패를 기록하며, 긴 작업을 재개하기 위한 상태 계약이다.

## 어긋남 검사

위 3~5번은 2026-09-03부터 16일 동안 지켜지지 않았고 하네스는 그동안 계속 PASS였다. 파일이 있는지와 문법만 봤기 때문이다. 지금은 [`../scripts/check-harness.mjs`](../scripts/check-harness.mjs)가 quick에서 아래를 대조한다(테스트: [`../scripts/test-check-harness.mjs`](../scripts/test-check-harness.mjs)).

| 구분 | 검사 | 처리 |
| --- | --- | --- |
| 상태 | 선행이 `done`이 아닌데 후행이 시작 상태, 허용 목록 밖 status | FAIL |
| 상태 | `loop-state`의 `task_id`·`completed_nodes`·`next_node`가 `CURRENT_TASK`·`work-graph`와 불일치 | FAIL |
| 명령 | `package.json`에 script가 있는데 `runtime-profile`·`quality-gates`의 슬롯이 null, 없는 script를 가리킴 | FAIL |
| 계약 | schema의 카테고리 enum·`emotionCode` prefix ≠ `data/taxonomy/v2.json`의 카테고리 | FAIL |
| 계약 | `design/style-guide.html`의 `:root` 색 ≠ `design/tokens.json` | FAIL |
| 신선도 | `last_verified_commit`이 HEAD보다 20커밋 넘게 뒤, `docs/STATUS.md` 최종 갱신이 HEAD 커밋일보다 14일 넘게 앞섬 | WARN |

FAIL은 같은 커밋이면 언제 어디서 돌려도 결과가 같은 것만 다룬다. 시간·커밋 거리 신호를 WARN에 묶어 둔 이유는 quick을 Claude Stop 훅이 매 턴 실행하기 때문이다 — 아무것도 고치지 않았는데 날짜가 지나서, 또는 CI의 얕은 clone이라서 실패하면 검사 자체가 새 고장 지점이 된다.
