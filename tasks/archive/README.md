# 작업 기록 아카이브

[../CURRENT_TASK.md](../CURRENT_TASK.md)에서 끝났거나 보류된 작업의 절을 옮겨 둔 곳이다. 2026-09-20(TASK-INFRA-01)에 처음 만들었다. 그때 `CURRENT_TASK.md`는 90KB였고 한 번에 읽으면 잘렸다.

## 규칙

- 절을 옮길 때 본문을 고쳐 쓰지 않는다. 옮긴 날짜, 직전 커밋, 상태, 남은 일이 어디로 갔는지만 파일 맨 위 머리말에 적는다. 상대 링크의 경로 깊이는 고쳐도 된다.
- 여기 있는 파일의 `- 소유 파일:` 선언은 scope-guard에 반영되지 않는다. 훅은 `CURRENT_TASK.md`만 읽는다. 끝난 작업의 선언이 허용 목록에 남아 있던 "과다 허용" 한계(AGENTS §2.2)는 옮기는 것만으로 줄어든다.
- 끝난 작업에 남은 일이 있으면 머리말에 **어디로 옮겼는지** 적는다. 아카이브에 묻힌 할 일은 아무도 하지 않는다.
- 다른 문서가 경로로 자주 인용하는 작업 파일(`tasks/TASK-TAXONOMY*.md`)은 옮기지 않았다. 옮기면 backtick 경로 인용이 링크 검사에 걸리지 않은 채 깨진다.

## 목록

| 파일 | 상태 | 남은 일이 간 곳 |
| --- | --- | --- |
| [TASK-WEB-UI-01.md](TASK-WEB-UI-01.md) 브라우저 우선 UI 프로토타입 | 구현·PC 검수 완료(2026-09-20), PR #30 CI 두 OS success이나 2026-09-21 기준 병합 전 | 사용자 확인(T7)과 미검증 5항목 → `CURRENT_TASK`의 TASK-WEB-UI-02 "사용자 QA 점검표". 2026-09-21 TASK-WEB-UI-02 착수 때 옮김(원문 10,608B, SHA-256 앞 12자리 `75976470981a`, 직전 커밋 `55f3f91`, 상대 링크 1개의 경로 깊이만 고침) |
| [TASK-INFRA-01.md](TASK-INFRA-01.md) 개발 인프라 정비 | done(2026-09-20), PR #28·#29 병합 | 개발 장치 쪽 후속 → `docs/STATUS.md` §4. 2026-09-20 TASK-WEB-UI-01 착수 때 옮김(원문 SHA-256 앞 12자리 `ea1586bf865b`, 직전 커밋 `9131f53`) |
| [TASK-ISSUE-26.md](TASK-ISSUE-26.md) 캐릭터 9종 포즈·애니메이션 | complete(2026-09-19), 이슈 #26 closed | 실기기·OS reduced-motion·회색조 판독 → TASK-WEB-UI-01([archive](TASK-WEB-UI-01.md))을 거쳐 `CURRENT_TASK`의 TASK-WEB-UI-02 "사용자 QA 점검표" |
| [TASK-ISSUE-27.md](TASK-ISSUE-27.md) 소유 파일 밖 쓰기 감지 | done(2026-09-06), 이슈 #27 closed(2026-09-20) | 알려진 한계 → AGENTS §2.2, 재검토 조건 → D-042 |
| [TASK-CBM.md](TASK-CBM.md) Codebase Memory 통합 | partial(2026-09-02) | 운영 규칙 → AGENT_WORKFLOW §9, 추적 → TRACEABILITY AG-CBM-001 |
| [TASK-DESIGN.md](TASK-DESIGN.md) 디자인 시스템 검수와 확정 | done(결정 2026-09-04, 실행 1~3 완료 2026-09-19) | 실기기 확인, 위기 안내 연락처 값 검수 → `docs/STATUS.md` §4 |
| [TASK-BOOTSTRAP.md](TASK-BOOTSTRAP.md) 기술 감사와 구현 기반 확정 | 보류 | B-02~B-08 판정 → `harness/work-graph.yaml` 스파이크 노드, `docs/STATUS.md` §3·§4 |
| [CURRENT_TASK-preamble-until-2026-09-20.txt](CURRENT_TASK-preamble-until-2026-09-20.txt) | 옮기기 전 `CURRENT_TASK.md` 머리말 원문 | 새 색인으로 대체됨. `.txt`로 둔 이유: 원문의 상대 링크를 고치지 않고 그대로 보존하기 위해서다 |

## 옮길 때의 검산(2026-09-20)

옮기기 전 90,026B = 옮긴 다섯 절 79,336B + 남긴 부분 10,690B. 절별 원문 SHA-256 앞 12자리: ISSUE-26 `ef5ebff10989`, ISSUE-27 `7dfcd5071223`, CBM `99dcc981bad7`, DESIGN `fd37e4677b5f`, BOOTSTRAP `5a71b7543db9`(이 절만 상대 링크 1개의 경로 깊이를 고쳤다). 옮기기 직전 커밋 `b54a0a2`의 `tasks/CURRENT_TASK.md`에서 같은 구간을 잘라 대조할 수 있다.
