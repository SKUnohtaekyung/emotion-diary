# 기술·제품 결정 기록

## 사용법

각 결정은 `accepted | provisional | superseded | rejected` 상태를 가진다. 제품 핵심 변경, 개인정보 위험 확대, 외부 배포/비용은 사용자 승인이 필요하다. SDK 이름·호스팅 가능성처럼 변할 수 있는 것은 `provisional`로 두고 새 프로젝트 부트스트랩에서 검증한다.

## 결정 목록

| ID | 상태 | 결정 | 근거·영향 | 재검토 조건 |
| --- | --- | --- | --- | --- |
| D-001 | accepted | 원형 일기 6개 영역을 저장 구조에서 보존한다 | 사용자 제공 template이 제품 원형 | 사용자 요구 변경 |
| D-002 | accepted | owner별 local date당 diary 하나, 소급 작성 허용 | 하루 습관과 과거 기록 모두 지원 | 다중 기록 요구 발생 |
| D-003 | accepted | 사건+세부감정 1개+각 강도+이유가 완료 필수; 칭찬/감사는 선택 | 낮은 작성 마찰과 원형 보존 균형 | 사용자 검증 결과 |
| D-004 | accepted | 직접 작성이 우선 흐름, AI 대화는 동일 schema의 보조 흐름 | AI 실패에도 핵심 기능 유지 | 없음 |
| D-005 | accepted | 감정·강도 최종값은 사용자가 선택한다 | AI의 과도한 심리 판정 방지 | 없음 |
| D-006 | provisional | MVP는 제한 공유된 단일 사용자 ChatGPT Site와 D1을 후보로 한다 | 초기 사용자 1명, 운영 복잡성 최소화 | Sites/D1/민감정보 스파이크 실패 |
| D-007 | provisional | Supabase/별도 agent framework는 MVP 기본 의존성에서 제외한다 | 아직 필요성이 입증되지 않음 | Sites 저장/권한/RAG 확장 한계 |
| D-008 | provisional | 앱이 Vector Store search를 직접 호출하고, MVP는 Evidence Card 1개=검색 파일 1개 | 자율 검색 억제와 file-level filter 제약 대응 | 현재 API/검색 품질 스파이크 |
| D-009 | accepted | 개인 일기 원문을 Psychology Evidence Vector Store에 넣지 않는다 | 민감정보 분리와 retrieval 오염 방지 | 완화 불가 |
| D-010 | accepted | STT와 실시간 음성은 MVP에서 제외한다 | 권한·비용·정확성·안전 복잡성 | post-MVP 별도 승인 |
| D-011 | provisional | background push는 검증 전 약속하지 않고 인앱 reminder를 fallback으로 한다 | Sites/background 지원 불확실 | 런타임·모바일 스파이크 통과 |
| D-012 | accepted | diary 삭제는 확인 후 hard delete, export는 versioned UTF-8 JSON | 개인 도구의 명확한 사용자 통제 | 복구 기능 요구 발생 |
| D-013 | accepted | 현재 제품/후보 hosting은 PHI·임상 기록 처리 용도가 아니다 | 규제·호스팅 적합성 미확보 | 별도 법률/보안 프로젝트 |
| D-014 | accepted | `AGENTS.md`를 공용 계약으로 하고 Claude는 `CLAUDE.md`에서 import한다 | 중복 규칙 drift 방지 | 도구 동작 변경 |
| D-015 | accepted | 한 파일에 동시에 한 writer만 두고 조사/검증 역할은 읽기 전용으로 시작한다 | 병합 충돌과 자기검증 편향 감소 | 격리된 worktree+소유권 확보 |
| D-016 | accepted | 계획의 기술 결함은 증거·영향·대안·검증을 기록해 수정할 수 있다 | 잘못된 초기 가설의 고착 방지 | 제품 핵심/위험 허용 변경이면 사용자 승인 |
| D-028 | accepted | Codebase Memory는 프로젝트 한정 MCP와 동일 사용자 cache를 공유하는 탐색 보조로 사용한다. 구조 탐색은 Graph→후보→source, 최종 정본은 working tree·실행 결과다 | 2026-09-02 사용자 통합 요청. 전역 설정 재작성을 피하려 v0.10.8 binary-only 설치를 선택; 기존 MCP 목록과 프로젝트 hooks/source 보존은 확인했으나 전역 파일 3개의 byte 동일성은 미확인. full/manual index와 기존 watcher 설정 사용. 실제 Graph의 누락·오연결에 source 검증과 fallback 필수화. 상세 운영은 AGENT_WORKFLOW §9, 검증은 CURRENT_TASK | binary 업데이트, 앱 scaffold/새 확장자, root 이동, index 품질/비용 변화 |

D-017~D-027은 보류된 bootstrap 작업의 예약 번호다. D-028은 앱 범위·데이터 계약·유료 외부 서비스를 변경하지 않는다. 설치 시 기존 Git 소유자 불일치 때문에 CBM의 Git 감지가 실패하여 현 root 하나만 전역 `safe.directory`에 등록했다. `.git` 재초기화/commit은 수행하지 않았다.

## 새 결정 템플릿

```text
ID / 날짜 / 상태 / 결정자
문제:
관찰 근거:
선택:
대안과 기각 이유:
제품·데이터·안전·비용 영향:
검증 방법:
되돌림/마이그레이션:
재검토 조건:
사용자 승인 필요 여부:
```
