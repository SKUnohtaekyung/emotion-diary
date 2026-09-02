# 요구사항–설계–검증 추적성

## 1. 사용법

이 표는 요구사항이 구현 파일 목록으로 변하는 것이 아니라, 어떤 설계 계약과 어떤 관찰 가능한 증거로 닫히는지를 보여 준다. 새 프로젝트에서 실제 module/test 경로가 생기면 `구현 증거` 열을 추가하거나 별도 generated matrix로 연결한다.

- 요구사항 내용의 정본: [../PRD.md](../PRD.md)
- 테스트 절차/수치의 정본: [EVAL_PLAN.md](EVAL_PLAN.md)
- 작업 선행관계: [../harness/work-graph.yaml](../harness/work-graph.yaml)
- `미검증`은 `통과`가 아니다.

## 2. MVP 추적 표

| 요구 ID | 주요 설계 정본 | 필수 평가 증거 | 작업 그래프 노드 |
| --- | --- | --- | --- |
| PR-001 비진단 경계 | `SAFETY_POLICY` §2, §4~6(D-020 감지 범위); `AI_RAG_SPEC` §2, §5(`safetySignal`) | EVAL §7 창작/확정 0·위기 케이스, §9 진단·위기 100% 안전 전환 | ai-journal, rag-analysis |
| PR-002 접근·모바일 Sites 후보 | `ARCHITECTURE` §2, §5(CSRF D-025), §6(defense-in-depth), §10; `UX_SPEC` §2~3 | B-02, B-03, B-05, B-08; F-01, F-02; EVAL §6 모바일 | bootstrap-audit, hosting-identity-spike, limited-mvp-release, release-candidate |
| PR-003 원형 6영역 | `DATA_MODEL` §3.1~3.3; `UX_SPEC` §4~5; `schemas/diary-entry`(slot 객체) | F-03, F-04; EVAL §6 원자료 충실성; create/read/edit/export/AI draft 대조 | direct-journal, ai-journal |
| PR-004 7개·세부 감정 원자료 | `DATA_MODEL` §4, §3.2(D-022 code 규칙); `UX_SPEC` §8; `references/README` | EVAL §6 모든 label/category 1:1 대조+D-027 검수 | taxonomy-v1 |
| PR-005 복수선택·강도 | `DATA_MODEL` §3.2(CHECK); `UX_SPEC` §4(검색/필터) | F-05, 범위/중복 경계 fixture, 모바일/스크린리더 | taxonomy-v1, direct-journal |
| PR-006 직접 작성 | `UX_SPEC` §3~4, §6~7; `DATA_MODEL` §5~6 | F-03~F-11, browser E2E, mobile 핵심 flow | data-foundation, direct-journal |
| PR-007 AI 대화 작성(후행, D-018) | `AI_RAG_SPEC` §5(턴 계약, `safetySignal`); `UX_SPEC` §5; D-019 | B-06; EVAL §7 전 지표, 특히 창작/확정 0, fallback 100%, 위기·턴 위조 | model-access-spike, ai-journal |
| PR-008 하루 1개·소급·streak | `DATA_MODEL` §2~3.1(D-024 원자화), §7 | F-06, F-07, 동시성·timezone·DST fixture | d1-data-spike, data-foundation, dashboard-reminder |
| PR-009 autosave·완료·수정/stale | `DATA_MODEL` §3.1, §3.5(read-time guard), §5(D-023)~6; `ARCHITECTURE` §7 | F-03, F-08~F-11, network/revision/idempotency fixture | data-foundation, direct-journal |
| PR-010 색상·캐릭터 | `UX_SPEC` §8, §12; source images | EVAL §6 source fidelity, 색 외 의미, AA/스크린리더 | taxonomy-v1, direct-journal |
| PR-011 알림 | `DATA_MODEL` §3.4(PK); `UX_SPEC` §10; `ARCHITECTURE` §7 | F-13, 권한 거부/미지원 fallback, 오늘 완료/소급 사례 | dashboard-reminder |
| PR-012 결정론적 대시보드 | `DATA_MODEL` §7; `UX_SPEC` §9 | F-12, missing≠0, 수정/삭제 snapshot, 1년 성능 | dashboard-reminder, limited-mvp-release |
| PR-013 RAG Gate/Verifier(후행, D-018) | `AI_RAG_SPEC` §6~13(§7.2 code/LLM, §8 observation 대조, §9 필수 verifier D-026); `DATA_MODEL` §3.6(retired 소급) | B-06, B-07; EVAL §8 절대 gate, verifier 독립성, injection 0, 관찰 위장 0 | model-access-spike, vector-search-spike, evidence-pipeline, rag-analysis |
| PR-014 개인정보·삭제·export | `ARCHITECTURE` §3~8; `DATA_MODEL` §6, §8(벤더 근거 I-17); `SAFETY_POLICY` §3, §7~10; `UX_SPEC` §13; `schemas/export`(analysis metadata) | B-02~B-05; F-01, F-02, F-09, F-10, F-14~F-16; EVAL §9 | hosting-identity-spike, d1-data-spike, data-foundation, limited-mvp-release, release-candidate |
| PR-015 모바일·오류·MVP 제외 | `UX_SPEC` §11~13; `ARCHITECTURE` §7, §9; `ROADMAP` 제한 MVP 릴리스 | B-08; EVAL §6, §10, §14 `limited-release`; release evidence bundle | app-scaffold, limited-mvp-release, release-candidate |

## 3. 교차 안전 불변조건

아래는 하나의 PR에만 속하지 않으며 변경 시 전체 회귀가 필요하다.

| 불변조건 | 관련 요구 | 차단 증거 |
| --- | --- | --- |
| client 지정 owner를 신뢰하지 않음 | PR-002, PR-014 | F-01/F-02와 IDOR red-team |
| 일기 원문이 Evidence/로그에 없음 | PR-007, PR-013, PR-014 | F-16, EVAL §9 검색·로그 검사 |
| 분석 실패가 직접 작성/저장을 막지 않음 | PR-006, PR-007, PR-012, PR-013 | 오류 injection과 degraded-mode E2E |
| completed만 통계/분석에 포함 | PR-008, PR-009, PR-012, PR-013 | F-11/F-12와 snapshot unit test |
| backfill이 과거 streak를 복구하지 않음 | PR-008, PR-012 | F-07, timezone/DST fixture |
| 외부 심리 claim은 정확한 active card version으로 100% 지지 | PR-001, PR-013 | Citation Validity/Coverage 100%, unsupported 0 |
| AI 관여 경로의 위기 신호에서 일반 작성/분석 중단(직접 작성 원문 자동 스캔 없음, D-020) | PR-001, PR-007, PR-013, PR-014 | EVAL §7 위기 케이스, §9 crisis 전 사례 pass, 한계 고지 문구 존재 |
| 유료 API 호출 없음(D-019) | PR-014, PR-015 | 의존성·설정·네트워크 로그에 유료 API endpoint/키 없음, B-06 증거 |
| 클라이언트가 보낸 이전 대화 턴을 서명 없이 신뢰하지 않음 | PR-007, PR-014 | EVAL §9 턴 위조 0건 |
| 완료 전환·삭제는 원자적 statement/batch로만 수행(D-024) | PR-008, PR-009, PR-014 | B-04, F-06, F-14 동시성 fixture |

## 4. 변경 영향 규칙

| 바뀐 것 | 반드시 재검토할 것 |
| --- | --- |
| PRD 완료조건/일기 구조 | DATA_MODEL, UX_SPEC, AI schemas, EVAL, 이 표 |
| taxonomy/label | source review, seed/migration, UI, dashboard, prompts, eval fixtures |
| 인증/hosting/DB | ARCHITECTURE, DATA_MODEL migration, SAFETY, B/F/Security tests |
| 통계 정의 | DATA_MODEL, dashboard UX, analysis snapshots, RAG observation eval |
| 모델/prompt/schema | AI_RAG_SPEC version, journal/RAG/safety 전체 고정 eval |
| Evidence/search/filter | Evidence manifest, baseline, Gate/Verifier와 전체 RAG eval |
| 삭제/보존/export | DATA_MODEL, privacy notice, UX §13, API/E2E, deployment audit |
| 작업 그래프 노드 분해/추가 | ROADMAP, 이 표 §2 노드 열, quality-gates `node_gates`, EVAL §14 라벨 정의, loop-state `next_node` |

요구사항을 삭제하거나 출시 증거를 완화하는 변경은 [DECISIONS.md](DECISIONS.md)와 사용자 승인을 요구한다.

## 5. 개발 도구 통합

| 요구 ID | 설계/운영 정본 | 실제 검증 증거 | 제품 범위 영향 |
| --- | --- | --- | --- |
| AG-CBM-001 | D-028; AGENTS 코드 구조 탐색; AGENT_WORKFLOW §9; 로컬 Claude/Codex MCP 설정 | CURRENT_TASK의 binary/양 client 실제 MCP/index/Graph-source 대조/ignore·scope/설정 보존/quick·full/효율 비교 결과. 원시 중간물은 로컬 `work/cbm-integration/` | PR-001~PR-015와 출시 게이트는 변경하지 않음 |
