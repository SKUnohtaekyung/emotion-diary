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
| PR-001 비진단 경계 | `SAFETY_POLICY` §2, §4~6(D-020 감지 범위); `AI_RAG_SPEC` §2, §5(`safetySignal`); `UX_SPEC` §8~9(색·친구·조약돌·친밀도가 판정으로 읽히지 않음) | EVAL §7 창작/확정 0·위기 케이스, §9 진단·위기 100% 안전 전환, UI-MOOD-005 | ai-journal, rag-analysis |
| PR-002 접근·자체 백엔드·모바일(D-032) | `ARCHITECTURE` §2, §4.6(PC worker), §5(CSRF D-025), §6(접근 토큰), §10; `UX_SPEC` §2~3 | B-02, B-03, B-05, B-08; F-01, F-02; EVAL §6 모바일 | bootstrap-audit, hosting-identity-spike, limited-mvp-release, release-candidate |
| PR-003 원형 6영역 | `DATA_MODEL` §3.1~3.3; `UX_SPEC` §4~5, §7(화면 카드 순서는 편지 템플릿이고 원형 순서는 저장·내보내기·AI 초안, D-063); `schemas/diary-entry`(slot 객체) | F-03, F-04; EVAL §6 원자료 충실성; create/read/edit/export/AI draft 대조(read는 편지 읽기 모드에서 6영역이 모두 보이는지, 칭찬·감사는 채운 날만 카드) | direct-journal, ai-journal |
| PR-004 9개 상위 감정·세부 감정, 원자료 v1 보존 | `DATA_MODEL` §4, §3.2(D-022 code 규칙); `UX_SPEC` §8; `references/README`; `data/taxonomy/v1.json`(2026-09-04 전사·사용자 검수 완료, `review_status: reviewed`, D-027 §7.8b); `data/taxonomy/v2.json`(2026-09-05, 9계열 194개, `review_status: reviewed`, 사용자 최종 대조 2026-09-05 완료); D-038(`accepted` — 반증 표 미해소 지적을 인지한 승인, `taxonomy-v2-decisions.md` §2); `schemas/diary-entry`·`journal-assist-output`의 카테고리 enum·prefix(9계열) | EVAL §6 v1은 모든 label/category 1:1 대조+D-027 검수; v2는 항목별 출처·근거·검수자 기록(완료, 독립 검증 T7a 8/8 통과); schema 카테고리 = v2 카테고리(`scripts/check-harness.mjs`, quick) | taxonomy-v1, taxonomy-v2-research |
| PR-005 복수선택·강도 | `DATA_MODEL` §3.2(CHECK); `UX_SPEC` §4(마음 고르기·계열별 세부 감정 화면·바구니·크기 '길 위의 친구'); `DESIGN_SYSTEM` §6.2(카테고리 선택기)·§6.3(계열별 세부 감정 화면·연한 배경 D-071·바구니 D-068·pill 구름, 검색 없음 D-065)·§6.4(대표 크기 + 선택형 세부 크기, '길 위의 친구' D-069 ①), D-037·D-059·D-061·D-065·D-066(D-041의 별자리 지도는 D-061이 대체, D-066은 provisional)·D-068·D-069·D-071 | F-05, 범위/중복 경계 fixture, 모바일/스크린리더, 슬라이더 키보드 조작, 계열·세부 감정 다중 선택 접근성(`aria-pressed`/`aria-live`), UI-MOOD-003·UI-MOOD-006 | taxonomy-v1, direct-journal |
| PR-006 직접 작성 | `UX_SPEC` §3~4, §6~7, §11(단계형 하나 D-061·이야기 있는 배경 D-069·D-085 편지 배경·편지 검토 D-063·세부 감정 많을 때 카드 규칙 D-079·남기기의 빠진 것 시트 §6·작성 흐름 이동 D-082 ⑤); `DATA_MODEL` §3.1(그날만 새 draft 생성 D-082), §5~6 | F-03~F-11, F-18, F-19, browser E2E, mobile 핵심 flow, UI-MOOD-003·UI-MOOD-004 | data-foundation, direct-journal |
| PR-007 AI 대화 작성(후행, D-018) | `AI_RAG_SPEC` §5(턴 계약, `safetySignal`); `UX_SPEC` §5; D-019 | B-06; EVAL §7 전 지표, 특히 창작/확정 0, fallback 100%, 위기·턴 위조 | model-access-spike, ai-journal |
| PR-008 하루 1개·그날만 작성·streak(D-082가 소급 작성 허용을 대체) | `DATA_MODEL` §2(하루 기준 시각 D-081), §3.1(D-024 원자화, 그날만 새 draft 생성 D-082), §7; `UX_SPEC` §3·§6(오늘 기록이 있으면 돌이 새 기록을 만들지 않고 그 기록을 연다, 화면 말은 '이어서 쓴 날' D-065, 지난 날 마무리 띠·×/이전 분리 D-082) | F-06, F-07(갱신), F-17, F-18, F-19, 동시성·timezone·DST fixture, UI-MOOD-004 | data-store-spike, data-foundation, dashboard-reminder |
| PR-009 autosave·완료·수정/stale | `DATA_MODEL` §3.1, §3.5(read-time guard), §5(D-023)~6(세션 한정 임시 보관 D-082 ④); `ARCHITECTURE` §7; `UX_SPEC` §6~7(완료된 기록을 수정 중 표시·완료 취소 확인) | F-03, F-08~F-11, F-19, network/revision/idempotency fixture, UI-MOOD-004 | data-foundation, direct-journal |
| PR-010 색상·캐릭터 | `UX_SPEC` §8, §12; `DESIGN_SYSTEM` §3(감정 테마 §3.3·서비스 색 §3.4), §8(친구·조약돌·빛), §9; `BRAND_STORY`; `DESIGN_RATIONALE`; D-050~D-072(D-051이 D-044·D-045·D-046을 대체, 이 세 결정은 크레용 세트 이력. 무드 v4 — D-061 무드, D-062·D-067·D-072 오늘 화면, D-063 편지, D-064 통계 친밀도, D-065 작은 결정, D-066 마음 고르기 시안(provisional), D-068 바구니, D-069 이야기 있는 배경(크기·이유·오늘 있었던 일·칭찬·감사·편지), D-070 달력·통계·설정 밝은 무드, D-071 세부 감정 연한 배경); `design/tokens.json`; `design/characters/prompts.json`; `design/characters/README.md`; `mood-preview-v2.png`; source images | EVAL §6 source fidelity, 색 외 의미, AA/스크린리더, 대표·UI 정적 보조 포즈의 40px·120px 판독과 투명 halo, 2초 loop·중심 고정, lossless animated WebP 선택과 APNG 비교 이력, iPhone Safari·Android Chrome, reduced-motion 정적 대체, `scripts/check-contrast.mjs`(331건), `scripts/check-characters.mjs`, 무드 v4 화면 검증 UI-MOOD-001~006(§6) | taxonomy-v1, direct-journal |
| PR-011 알림 | `DATA_MODEL` §3.4(PK, `day_start_hour` D-081); `UX_SPEC` §10(돌 위 한 줄로 통합 D-077, 이어 쓰기 칩이 알림 대신 D-081 ③); `ARCHITECTURE` §7 | F-13, F-17, 권한 거부/미지원 fallback, 오늘 완료 사례 | dashboard-reminder |
| PR-012 결정론적 대시보드 | `DATA_MODEL` §7(친구와의 친밀도 계산 정의 D-064 — 완료 반영됨; 계열별 날 단위 평균·n·범위·기간 비교 D-086); `UX_SPEC` §9(친구와의 친밀도 D-064, 나의 돌·밝은 무드·원래 하단 탐색 D-070, 계열별 small multiples D-086) | F-12, F-20, missing≠0, 수정/삭제 snapshot, 1년 성능, 친밀도 5일 미만 미표시·머리말 규칙(UI-MOOD-005) | dashboard-reminder, limited-mvp-release |
| PR-013 RAG Gate/Verifier(후행, D-018) | `AI_RAG_SPEC` §6~13(§7.2 code/LLM, §8 observation 대조, §9 필수 verifier D-026); `DATA_MODEL` §3.6(retired 소급) | B-06, B-07; EVAL §8 절대 gate, verifier 독립성, injection 0, 관찰 위장 0 | model-access-spike, vector-search-spike, evidence-pipeline, rag-analysis |
| PR-014 개인정보·삭제·export | `ARCHITECTURE` §3~8; `DATA_MODEL` §6, §8(벤더 근거 I-17); `SAFETY_POLICY` §3, §7~10; `UX_SPEC` §13; `schemas/export`(analysis metadata) | B-02~B-05; F-01, F-02, F-09, F-10, F-14~F-16; EVAL §9 | hosting-identity-spike, data-store-spike, data-foundation, limited-mvp-release, release-candidate |
| PR-015 모바일·오류·MVP 제외 | `UX_SPEC` §11~13(오늘 화면 상태 여섯 가지 §11, 주요 화면 불러오기·오류·연결 끊김과 큰 글자 격자 전환 D-083); `ARCHITECTURE` §7(예외 상태 응답), §9; `ROADMAP` 제한 MVP 릴리스 | B-08; F-21; EVAL §6, §10, §14 `limited-release`; release evidence bundle; UI-MOOD-001~004 | app-scaffold, limited-mvp-release, release-candidate |

## 3. 교차 안전 불변조건

아래는 하나의 PR에만 속하지 않으며 변경 시 전체 회귀가 필요하다.

| 불변조건 | 관련 요구 | 차단 증거 |
| --- | --- | --- |
| client 지정 owner를 신뢰하지 않음 | PR-002, PR-014 | F-01/F-02와 IDOR red-team |
| 일기 원문이 Evidence/로그에 없음 | PR-007, PR-013, PR-014 | F-16, EVAL §9 검색·로그 검사 |
| 분석 실패가 직접 작성/저장을 막지 않음 | PR-006, PR-007, PR-012, PR-013 | 오류 injection과 degraded-mode E2E |
| completed만 통계/분석에 포함 | PR-008, PR-009, PR-012, PR-013 | F-11/F-12와 snapshot unit test |
| backfill이 과거 streak를 복구하지 않음 | PR-008, PR-012 | F-07, timezone/DST fixture |
| 새 draft 생성은 서버가 `day_start_hour`로 계산한 오늘의 `entry_date`에만 허용, 클라이언트가 보낸 날짜를 신뢰하지 않음(D-081, D-082) | PR-006, PR-008, PR-009 | F-07(갱신), F-17, ARCHITECTURE §3 날짜 검증, §5 |
| 외부 심리 claim은 정확한 active card version으로 100% 지지 | PR-001, PR-013 | Citation Validity/Coverage 100%, unsupported 0 |
| AI 관여 경로의 위기 신호에서 일반 작성/분석 중단(직접 작성 원문 자동 스캔 없음, D-020) | PR-001, PR-007, PR-013, PR-014 | EVAL §7 위기 케이스, §9 crisis 전 사례 pass, 한계 고지 문구 존재 |
| 유료 API 호출 없음(D-019) | PR-014, PR-015 | 의존성·설정·네트워크 로그에 유료 API endpoint/키 없음, B-06 증거 |
| 클라이언트가 보낸 이전 대화 턴을 서명 없이 신뢰하지 않음 | PR-007, PR-014 | EVAL §9 턴 위조 0건 |
| 완료 전환·삭제는 원자적 statement/batch로만 수행(D-024) | PR-008, PR-009, PR-014 | B-04, F-06, F-14 동시성 fixture |
| 위기 안내·AI 위기 전환 화면에 친구·감정 색·조약돌·빛·움직임을 쓰지 않음(D-061 ⑤, D-065 ①) | PR-001, PR-007, PR-010 | 위기 안내(`#/help`)와 AI 위기 전환의 화면 대조(UI-MOOD-005). 시안의 `#/help`는 코드상 친구·감정 색·조약돌·빛·움직임이 없다(2026-09-22), AI 위기 전환은 후행 단계. 위기 안내로 가는 입구는 설정과 AI 위기 전환뿐이다(D-093 — 온보딩의 입구는 2026-09-25에 뺐다) |
| 온보딩에는 PHI 입력 안내·안전 고지·위기 안내 링크가 없음, '시작하기 전에'는 WHY의 약속 두 줄(D-093) | PR-001, PR-010 | `#/welcome`의 마지막 장('시작하기 전에')이 SAFETY_POLICY §3·§6의 정적 문구가 아니라 SERVICE_WHY §12·§17의 약속 두 줄만 보이는지 화면 대조. **옛 검증 항목 소멸**: 옛 온보딩 2쪽의 PHI 미입력 안내·자동 분석 없음 고지·위기 안내 링크 검증(구 UI-MOOD 계열)은 D-093으로 화면 자체가 사라져 더는 검증하지 않는다 — 같은 문구는 이제 설정의 개인정보 안내(SAFETY_POLICY §3·§6)에서 검증한다 |
| 위기 안내 연락처는 versioned resource 한 곳(`data/crisis-resources/kr.json`)에서 읽고, 공식 출처만 싣고, 112·119는 파일 없이도 먼저 보임(D-094) | PR-001, PR-013 | `node scripts/verify.mjs`의 위기 연락처 검사(필수 필드·출처가 공식 누리집·허용 번호 목록·검토 상태 필드) + `#/help` 화면 대조(파일을 막아도 112·119 전화 버튼이 남음). 임상·안전 검토는 출시 차단(ROADMAP) |
| 친구·색·조약돌·빛·움직임이 감정의 좋고 나쁨·진단·평가·수집으로 읽히지 않음(D-050·D-063·D-064·D-067·D-068·D-070·D-071) | PR-001, PR-010 | UI-MOOD-005의 사용자 눈 검수(미검증), 위험 RK-020·RK-021·RK-025·RK-026 |

## 4. 변경 영향 규칙

| 바뀐 것 | 반드시 재검토할 것 |
| --- | --- |
| PRD 완료조건/일기 구조 | DATA_MODEL, UX_SPEC, AI schemas, EVAL, 이 표 |
| taxonomy/label | source review, seed/migration, UI, dashboard, prompts, eval fixtures |
| 색·글자·간격 토큰 | DESIGN_SYSTEM, design/tokens.json, `scripts/check-contrast.mjs`(quick 하네스: WCAG 대비 + 감정 계열 색차 ΔE≥7 + 서비스 색·감정 테마·오늘 숲·초록 언덕·편지·편지 책상·세부 감정 연한 배경·이유 노트 조합, 331건), UX §8, 이 표 UI-MOOD-001 |
| 화면 구성·문구(오늘·작성 흐름·편지·통계, `web/` 시안 포함) | UX_SPEC §3~4·§7~9·§11~12, DESIGN_SYSTEM §6, 이 표 §6(UI-MOOD-*), RISK_REGISTER RK-020~RK-029 |
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
| AG-HARNESS-001 | AGENT_WORKFLOW §6; `harness/README` 어긋남 검사; `.gitattributes`; `.github/workflows/harness.yml` | `scripts/check-harness.mjs`(quick)와 `test-check-harness.mjs` 28건, `test-claude-git-guard.mjs` 15건, GitHub Actions Ubuntu·Windows 초록불(PR #28, 2026-09-20 — 이전 15회는 전부 실패). 2026-09-21 D-060: 가드 테스트를 늘렸다 — `test-claude-git-guard.mjs` 25건, `test-claude-scope-guard.mjs` 30건(권한 모드·작업 폴더·하위 에이전트·`?` 회귀·훅 종료 코드·실제 CURRENT_TASK 스모크; 수정 전 가드에서는 각각 5건·16건이 실패해 회귀 감지력을 확인). 낡은 상태에서 FAIL 11건을 먼저 재현한 기록은 TASK-INFRA-01 체크포인트(`tasks/CURRENT_TASK.md`, 끝난 뒤에는 `tasks/archive/`) | PR-004(원자료 byte 보존)를 CI에서 실제로 강제하게 됨. 그 밖의 제품 범위·출시 게이트는 변경하지 않음 |
| AG-CBM-001 | D-028; AGENTS 코드 구조 탐색; AGENT_WORKFLOW §9; 로컬 Claude/Codex MCP 설정 | `tasks/archive/TASK-CBM.md`의 binary/양 client 실제 MCP/index/Graph-source 대조/ignore·scope/설정 보존/quick·full/효율 비교 결과. 원시 중간물은 로컬 `work/cbm-integration/` | PR-001~PR-015와 출시 게이트는 변경하지 않음 |

## 6. 화면 시안(`web/`) 검증 — 무드 v4

화면 시안은 저장·인증·AI가 없는 정적 시안이라(D-047) PR-* 요구사항의 통과 증거가 되지 않는다. 아래는 무드 v4 결정(D-061~D-072)이 화면에 요구하는 성질의 검증 항목이며, 시안 단계에서 확인한 것과 남은 검수를 구분해 적는다. `미검증`은 `통과`가 아니다. 브라우저 QA의 증거는 `tasks/CURRENT_TASK.md`의 TASK-WEB-UI-02 체크포인트에 남긴다.

| 검증 ID | 관련 요구·결정 | 설계 정본 | 증거와 상태(2026-09-22) |
| --- | --- | --- | --- |
| UI-MOOD-001 색 대비·색차 | PR-010, PR-015; D-053·D-054·D-061~D-072 | `DESIGN_SYSTEM` §3.3·§3.4·§9; `design/tokens.json` | **통과(자동)**: `node scripts/check-contrast.mjs` 331건 통과(2026-09-22 — 편지 책상·세부 감정 연한 배경·이유 노트·마음 고르기 오류 조합이 더해져 이전 305건에서 늘었다). 측정 — ink 글자 on 초록 언덕 먼·중간·가까운 곳 12.75/9.77/6.56:1, 흰 글자 on 숲 하늘 13.76:1·회색 길 6.72:1, 청록 탐색 아이콘 on 유리(뒤 숲 brightness .82 + 흰 채움 18%) 숲 바닥 6.16·회색 길 3.48·큰 나무 7.15:1, 편지 글자 on 종이 15.57:1·paper-ink on 종이 6.28:1·글자 on 크림빛 14.97:1·paper-ink on 크림빛 6.04:1·봉투 “나에게” 6.81:1, 감정 300 위 ink 글자 6.48~12.19:1, 편지 책상 위 ink 캡션 13.2:1·안 켜진 페이저 점(ink 50%) 3.06:1(비텍스트 3:1 기준), 세부 감정 연한 배경(D-071) 위 ink 글자 12.5:1 이상·pill 위 11.2:1 이상. **해결됨(2026-09-22, 이전 “미해결”을 정정)**: 마음 고르기의 오류 문구는 `danger` 원색(초록 언덕 4.38:1)이 아니라 ink 25%를 섞은 색(6.2:1, D-066 — 1차 서술의 “6.5:1”은 손 계산 오류였다)이고, 세부 감정 화면의 오류는 `danger` 원색(감정 300 면 위 2.23~4.18:1) 대신 중립 글자+“!” 표지를 쓴다(D-071) — 둘 다 4.5:1을 만족해 실제 화면에는 이 불일치가 없다. **미해결(정보성, WCAG 대상 아님)**: 편지 책상 위 봉투 몸통의 휘도 대비 1.07:1(CIEDE2000 색차 19.4~19.8)이라 봉투가 글자 “나에게”·캡션으로만 식별된다(D-069 ④, D-063과 같은 전제). 실기기 밝기·색각 이상 사람 눈 판독은 **미검증** |
| UI-MOOD-002 움직임 줄이기·깜빡임 | PR-010, PR-015; D-062 ⑤·D-063·D-066 ⑤·D-067·D-068·D-069·D-070·D-072 | `UX_SPEC` §12 | **코드 확인**(2026-09-22): `prefers-reduced-motion`·`reducedMotion()` 분기가 오늘 돌 흔들림·호버 통통·별 반짝임, 흰빛 확산(0.25초 페이드로 대체)과 조약돌 켜짐 연출, 봉투 열림·카드 넘김, 마음 고르기 떠오름·통통, 친구 호흡, 세부 감정 화면의 바구니에 조약돌이 담기는 움직임, 하단 탐색 방울·시트 올라옴·슬라이더(길 위의 친구) 전환, 달력·설정의 섹션·날짜 칸 진입, 통계의 친구 걸어오기, 이유·오늘 있었던 일·칭찬·감사·편지의 진입 연출·숨쉬기·반딧불을 멈춘다. 시안의 반복 움직임 주기는 모두 1.5초 이상. 실제 OS 설정에서의 눈 검수는 **미검증** |
| UI-MOOD-003 키보드·스크린리더·터치 대체 | PR-005, PR-006, PR-010, PR-015; D-037·D-063 ③·D-066·D-068·D-069 | `UX_SPEC` §4·§12 | **코드 확인**: 친구·세부 감정 토글은 `aria-pressed` 버튼, `다음` 막힘은 `aria-disabled`와 이유 안내(초점 유지), 시트는 초점을 가두고 Esc로 닫으며 원래 자리로 돌아온다, 편지 카드는 화살표 버튼(44px)·←→·위치 점(스와이프 대안), 크기는 native range와 숫자와 −/+ 스테퍼, 호버가 없는 터치는 누르는 순간이 같은 흰빛. 바구니·이유/오늘 있었던 일/칭찬/감사의 장면은 장식(`aria-hidden`)이고 조작에 관여하지 않는다. 편지 카드 스크롤은 넘치는 영역만 `tabindex="0"`이고 봉투를 열면 초점이 카드 묶음으로 이동한다(D-069 ④). 키보드만으로 작성 흐름 완주와 VoiceOver·TalkBack 수동 확인은 **미검증** |
| UI-MOOD-004 작성 흐름·오늘 화면 상태 | PR-006, PR-008, PR-009; D-062 ③·D-063·D-065·D-067·D-068·D-069·D-070·D-072 | `UX_SPEC` §3~4·§6~7·§11 | **코드 확인**: 단계 수 `7 + 고른 계열 수`와 `n / 전체`, 오늘 화면 상태 여섯 가지(조약돌 아홉·회색 길·숲 속 안, D-067·D-072), 남기기의 빠진 것 시트와 `채우러 가기`, 편지 `고치기`에서 `편지로 돌아가기`, 기록 상세 = 편지 읽기 모드와 ⋯ 메뉴, 완료된 기록을 수정 중 표시, 달력·통계·설정의 밝은 무드·원래 하단 탐색과 진입 연출(D-070). 브라우저 E2E·실기기는 **미검증**(저장·서버가 없어 F-03~F-11은 Phase 2 몫) |
| UI-MOOD-005 비판정 표현(안전) | PR-001, PR-010, PR-012; D-050·D-061 ⑤·D-063 ⑥·D-064·D-065 ①·D-067·D-068·D-069·D-070·D-071 | `UX_SPEC` §8·§9; `DESIGN_SYSTEM` §8·§11; `SAFETY_POLICY` | **코드 확인**: 친밀도 머리말은 중립 요약이고 기록 5일 미만이면 나열하지 않으며 “많고 적음에 좋고 나쁨은 없어요”가 고정되고 레벨·점수·연속 문구·순위 머리말이 없다. 한 화면의 친구는 모두 같은 크기, 조약돌은 아홉 개(계열마다 하나)이고 원근 세 단계에 계열을 섞어 두어 어느 계열도 늘 작거나 늘 크지 않다(D-067), 세부 감정 화면의 바구니·칭찬 화면의 조약돌은 개수 글자·누적 표시가 없다(D-068·D-069, 감사 화면은 “쌓인다”로 읽히지 않도록 조약돌을 아예 빼 두었다), 편지 카드는 감정마다 같은 틀이고 크기는 숫자와 열 점이다. 위기 안내(`#/help`)에는 친구·감정 색·조약돌·빛·움직임이 없다. **사용자 눈 검수(감정 판정·평가·수집으로 읽히는지)는 미검증** — 재검토 조건은 D-063·D-064·D-067·D-069에 있다 |
| UI-MOOD-006 provisional 시안·실기기 | PR-005, PR-010; D-066(provisional) | `UX_SPEC` §4; RK-027 | **미검증(사용자 확인 대기)**: 마음 고르기의 초록 자유 배치는 시안이고 사용자가 확인하기 전까지 provisional이다. 320px 폭·200% 글자 확대에서의 블록 겹침 확인과 격자 폴백의 자동 전환은 아직 없다. iPhone Safari·Android Chrome 실기기 검수는 하지 않았다 |
| UI-MOOD-007 온보딩 장면 이야기·로딩 화면 | PR-006, PR-010, PR-015; D-092·D-093 | `UX_SPEC` §3; `DESIGN_SYSTEM` §6.17 | **코드·헤드리스 확인**(2026-09-25): 여섯 장면 문장이 D-092 ②와 같음, 움직임 줄이기에서 자동 진행 없음·장면마다 '다음', 일시정지(멈춤 6.5초 동안 장면·진행 막대·글자 쓰기 정지 → 이어 가면 남은 시간 뒤 다음 장면), '시작하기 전에' 열림 때 뒤 이야기 `inert`, 글자 200%에서 문장 상자 확장·받침, 로딩 화면 300ms 전 준비 시 미표시·보이면 0.6초 이상·오늘 화면은 숲 FLIP·온보딩은 흰빛·시작 실패 때 걷힘. `web/splash.svg`는 `node scripts/build-splash.mjs --check`(verify)가 forest.js·tokens.json과 대조. 실기기·실제 OS 움직임 줄이기는 미확인 |
| UI-MOOD-008 통계 친구 상세 | PR-010, PR-012, PR-015; D-095 | `UX_SPEC` §9; `DESIGN_SYSTEM` §6.9 | **코드·헤드리스 확인**(2026-09-25): 열 점 기둥 role=img 요약 + 날짜별 sr 목록, 채운 점(흰 바탕 계열 강조색 3:1 이상)·빈 점(속 빈 고리)을 모양으로 구별, 소수 평균 반올림, 320·360·375에서 30일 가로 넘침 없음, 축 글자 caption 크기, 감정 chip 개수 글자 대비 4.5:1 이상(opacity 제거), 크기를 조약돌 크기·색 농도로 그리지 않음(D-050) |
| UI-MOOD-009 달력 큰 편지 카드·기록 메뉴 | PR-006, PR-009, PR-015; D-096 | `UX_SPEC` §7; `DESIGN_SYSTEM` §6.7·§6.14 | **코드·헤드리스 확인**(2026-09-25): 완료한 날 → 그 주로 접힘 + 큰 편지(376~448px), 옆 카드 엿보기 0px·흐림 마스크 없음, 그림자는 `.card`에만, 날짜 줄 ⋯에서 기록 상세와 같은 고치기·완료 취소·삭제(예시 기록은 상태 불변), 자동 스크롤이 접힌 주를 시안 띠 밑으로 숨기지 않음(375는 스크롤 0, 360은 77px에서 정지·손으로 ‹ 점 › 줄까지), 날짜를 바꿔도 리스너가 쌓이지 않음, → 키·‹ ›·가로 휠 넘기기 정상 |

위 항목은 PRD 범위·저장 계약·출시 게이트를 바꾸지 않는다.
