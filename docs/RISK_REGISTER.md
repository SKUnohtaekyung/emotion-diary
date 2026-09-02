# 기술·제품 위험 등록부

## 운영 규칙

- 확률과 영향은 `low | medium | high`로 기록한다.
- 위험이 현실화되면 관련 work-graph 노드를 `blocked`로 바꾸고 Decision을 만든다.
- 개인정보·권한·데이터 손실·AI 안전 위험은 일정 때문에 수용할 수 없다.
- 새 프로젝트 부트스트랩에서 owner와 상태를 실제 담당자/agent로 갱신한다.

| ID | 위험 | 확률 | 영향 | 조기 신호/검증 | 완화 | fallback | 상태 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RK-001 | Sites의 접근·보존·residency가 민감 일기에 부적합 | high | high | B-02/B-05 실패, 비공개 경계 설명 불가 | 제한 공유·server auth·최소 데이터 스파이크 | 적합한 private hosting/backend | open |
| RK-002 | Sites identity가 owner row isolation에 충분하지 않음 | medium | high | 신뢰 가능한 server identity 없음, client owner 필요 | 단일 배포 namespace 또는 verified identity HMAC | 별도 auth provider/hosting | open |
| RK-003 | D1 transaction/concurrency/migration이 데이터 계약 미충족 | medium | high | 같은 날짜 중복, 부분 delete, migration 한계 | unique/transaction/idempotency 스파이크 | managed Postgres 등 | open |
| RK-004 | Web Push/background가 Sites/모바일에서 미지원·불안정 | high | medium | permission 후 실제 알림 없음, background 제한 | 제품 약속에서 분리, 실제 기기 검증 | 인앱 reminder만 MVP | open |
| RK-005 | Evidence corpus가 제한 분석을 지지하기에 부족 | high | high | Recall 낮음, Gate 대부분 fail, reviewer 불일치 | 주제 범위를 좁히고 고품질 card 확보 | RAG 분석 제외, 통계만 출시 | open |
| RK-006 | RAG가 그럴듯한 무근거/진단 claim 생성 | medium | high | false pass/unsupported claim/injection | app-controlled search, Gate, code+semantic verifier, safety eval | 분석 기능 즉시 보류 | open |
| RK-007 | 이미지 OCR가 세부 감정 label/소속을 오기 | medium | high | taxonomy와 원본 대조 불일치 | 원본 보존, 사람/사용자 1:1 검수 | taxonomy 출시 차단 | open |
| RK-008 | 일기 원문이 로그·API 보존·Vector Store로 유출 | medium | high | log scan/API instrumentation 실패 | server-only, `store` 검증, log denylist, store 분리 | AI/배포 중단·incident response | open |
| RK-009 | AI latency/비용/rate limit가 모바일 UX를 방해 | high | medium | p95/비용 budget 초과, 429 | 최소 snapshot, idempotent cache, bounded output | 직접 작성·통계 fallback | open |
| RK-010 | Sites framework/runtime 제약이 앱 구조와 충돌 | medium | high | build/runtime/server API 실패 | Phase 0 최소 vertical spike | 지원 stack 또는 hosting 변경 | open |
| RK-011 | Claude/Codex 지침이 분기되거나 동시 writer 충돌 | medium | medium | CLAUDE/AGENTS 불일치, 같은 파일 충돌 | CLAUDE import, one-writer, worktree, quick hook | 통합 중단 후 소유권 재설정 | mitigated |
| RK-012 | AI 평가 세트가 좁아 실제 실패를 놓침 | medium | high | 실제 failure가 고정 set에 없음, reviewer 편향 | stratified synthetic set, red-team, adjudication, 회귀 추가 | 분석 rollout 중단 | open |
| RK-013 | OpenAI/Anthropic/Sites API·도구 동작 변경 | high | medium | SDK upgrade, deprecated field, hook failure | version pin, official docs 재검증, adapter tests | 이전 version rollback/adapter 변경 | open |
| RK-014 | 사용자가 제품을 임상/위기 서비스로 오해 | medium | high | PHI 입력, 진단 요구, 위기 대화 | 근접 고지, 금지 output, crisis flow | 기능 제한·전문 검토 전 배포 중단 | open |
| RK-015 | hard delete와 provider backup 보존 약속 불일치 | medium | high | 즉시 완전 소거를 증명 못함 | 앱 DB hard delete와 공급자 지연을 구분 고지 | hosting 변경 또는 약속 축소 | open |

위험을 `closed`로 바꿀 때 테스트/스파이크/정책 링크를 추가한다. `accepted`는 사용자가 잔여 위험을 이해하고 승인한 경우에만 사용한다.

