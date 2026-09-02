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
3. 현재 `bootstrap-audit`가 `in_progress`다. 선행 gate가 통과하기 전 다음 노드를 `in_progress`로 바꾸지 않는다.
4. quality gates의 `command: null`은 도구 미선택을 뜻한다. 실제 package scripts를 확인한 뒤 채운다.
5. 한 번의 루프가 끝날 때 `loop-state.json`과 `tasks/CURRENT_TASK.md`를 함께 갱신한다.

YAML/JSON 파일은 자율 실행기가 아니다. 에이전트가 선행조건을 건너뛰지 않고, 실패를 기록하며, 긴 작업을 재개하기 위한 상태 계약이다.
