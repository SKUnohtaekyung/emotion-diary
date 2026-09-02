# 구현 로드맵과 단계 게이트

## 원칙

단계 번호는 일정 약속이 아니라 의존 순서다. 각 단계는 앞 단계의 증거가 있어야 시작한다. 미검증 기술 가설이 실패하면 대안을 결정한 뒤 작업 그래프를 수정한다.

## Phase 0 — 현재 프로젝트 부트스트랩

목표: 현재 저장소의 기술 가설을 실제 런타임에 맞게 냉정하게 교정한다.

- 실제 stack/git/Sites/Node/package manager/runtime profile 확인
- 원자료 보존과 taxonomy 전사 계획 확정
- Sites 제한 공유, server route, D1 CRUD/transaction/secret의 작은 스파이크
- OpenAI server-only call, `store: false`, structured output/refusal/error handling 스파이크
- quality gates를 실제 명령으로 채우고 quick/full 통과
- 모든 provisional decision을 confirmed/rejected/unknown으로 평가

Exit: 개인정보·권한·저장 경계가 설명되고, 구현 stack과 테스트 명령이 증거로 확정됨. 불가능하면 대체 hosting/data architecture 결정.

## Phase 1 — 기반과 데이터 무결성

- 앱 scaffold와 CI
- server-derived owner, session/access guard
- versioned migrations와 핵심 schema
- draft CRUD, 하루 1개 unique, revision, idempotency
- hard delete와 versioned JSON export
- 합성 fixture, 권한/날짜/transaction 테스트

Exit: 다른 owner 접근, 중복 날짜, stale overwrite, 부분 삭제가 자동 테스트에서 차단됨.

## Phase 2 — 직접 작성 모바일 MVP

- 원형 6영역 직접 작성
- taxonomy v1 전사·원본 대조·사용자 승인
- 복수 세부 감정과 각 1~10 강도
- autosave, 복구, 완료조건, backdating
- 기록 달력/상세/수정
- 모바일·접근성 핵심 흐름

Exit: PR-002~PR-006, PR-008, PR-015의 관련 기능/모바일 게이트 통과.

## Phase 3 — AI 대화형 작성

- Journal Conversation/Structuring schema
- 말하지 않은 정보 금지, 사용자 최종 확인
- transcript 비저장과 structured draft 복구
- timeout/rate-limit/direct fallback
- 최소 50개 합성 대화 평가

Exit: 구조 충실성·사용자 주도권·오류 fallback 합격. RAG 분석과 결합하지 않음.

## Phase 4 — 대시보드와 알림

- 순수 코드/SQL 통계와 snapshot version
- 7/30일 추세, 비중/빈도/평균+n, 작성 streak
- timezone/backfill/missing data 경계 테스트
- 인앱 reminder; Web Push는 별도 스파이크 통과 시에만 추가

Exit: 같은 fixture에서 계산이 재현되고 AI 없이 대시보드가 동작.

## Phase 5 — Evidence 공급망과 RAG 분석

- Evidence Card schema, human review workflow, source rights/provenance
- manual vector search, metadata filter, Gate
- claim-evidence code checks, independent semantic verifier, safety validator
- prompt injection/상충/근거부족/위기 평가
- Evals dataset와 release evidence bundle

Exit: false pass 0, unsupported claim 0, citation validity 100% 등 [EVAL_PLAN.md](EVAL_PLAN.md)의 차단 게이트 통과. 미달이면 분석 기능을 출시하지 않고 결정론적 dashboard만 배포 가능.

## Phase 6 — 제한 베타와 출시

- Sites 공유·비밀값·로그·데이터 보존 재감사
- iPhone Safari/Android Chrome 실제 기기 검증
- 성능/비용/rate limit/장애 복구 시험
- 개인정보 고지, 데이터 export/delete, 위기 문구 검토
- 알려진 제한 공개와 rollback 방법

Exit: 차단/높음 결함 0, full harness와 release evidence bundle 승인.

## Post-MVP 후보

- 검증된 Web Push/PWA offline
- STT 또는 음성 입력(실시간 음성과 분리 평가)
- 다중 사용자/공개 인증
- CSV·재가져오기
- hybrid search/reranker/외부 vector DB
- 알림 scheduler와 운영 dashboard

어떤 후보도 PRD/Decision 변경 없이 MVP에 끼워 넣지 않는다.
