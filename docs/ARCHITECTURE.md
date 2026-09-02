# 시스템 아키텍처 명세

## 1. 책임과 상태

이 문서는 시스템 구성요소, 신뢰 경계, API와 배포 가설을 정한다. 제품 범위는 [../PRD.md](../PRD.md), 데이터 불변조건은 [DATA_MODEL.md](DATA_MODEL.md), AI 내부 단계는 [AI_RAG_SPEC.md](AI_RAG_SPEC.md), 안전 판단은 [SAFETY_POLICY.md](SAFETY_POLICY.md)가 정본이다.

이 문서의 ChatGPT Sites·D1·모델 접근 경로 세부는 **현재 프로젝트 Phase 0에서 검증할 기술 가설**이다. 검증 없이 프레임워크나 API 이름을 코드에 고정하지 않는다.

2026-09-02 사용자 결정(D-018, D-019, D-021): 제한 MVP(직접 작성+결정론적 대시보드)를 먼저 배포하고 AI 대화·RAG는 후행 단계다. 유료 API(OpenAI API 등)는 사용하지 않으며 AI 기능은 사용자가 구독 중인 Codex/Claude 자원으로 가능한 경로가 B-06에서 확인된 경우에만 활성화한다. hosting 대안은 무료 옵션으로 제한한다. 아래의 "OpenAI Responses/Vector Store" 표기는 이 결정 이전의 후보이며, 구독 기반 경로가 동일 계약(server-only, strict schema, 보존 통제)을 만족하는지로 대체 평가한다.

## 2. 후보 기준 아키텍처

```text
모바일 브라우저 / 홈 화면 바로가기
                 |
        ChatGPT Sites 접근 경계
                 |
       UI + 서버 라우트/액션 계층
        |          |           |
        v          v           v
     D1 DB    모델 접근 어댑터   알림 어댑터
 (개인 일기)  (구독 기반 경로,   (인앱 우선)
              B-06 확인 전 비활성)
                    |
                    v
          Psychology Evidence Store
          (후행 단계, D-018)

관리 경로: 승인된 Evidence 수집 -> 카드 검수 -> 비활성 업로드
                                      -> 평가 -> 활성화
```

MVP 후보는 제한 공유된 단일 사용자 Site, 서버 측 접근 검사, D1 구조화 저장이다. 모델 호출은 서버 전용이되 유료 API가 아닌 구독 기반 경로여야 한다(D-019). 별도 Supabase나 agent framework는 기본 의존성이 아니다. 후보가 부트스트랩 스파이크를 통과하지 못하면 동일한 계약을 만족하는 **무료** 비공개 호스팅/DB로 교체한다(D-021). 제한 MVP는 모델 접근 어댑터와 Evidence Store 없이 배포 가능해야 한다(D-018).

## 3. 신뢰 경계

| 경계 | 신뢰하지 않는 입력 | 서버가 해야 할 일 |
| --- | --- | --- |
| 브라우저 → 앱 | owner ID, 날짜, 상태, 분석 대상, 완료 여부 | 세션에서 owner를 결정하고 스키마/권한/날짜를 검증 |
| 앱 → D1 | 중복 요청, 오래된 revision, 부분 실패 | transaction, unique constraint, optimistic concurrency, idempotency |
| 앱 → 모델 접근 경로 | 일기 속 지시문, 과도한 원문, 모델 출력, 클라이언트가 보낸 이전 대화 턴 | 최소화, source-as-data, strict schema, 오류/거부/미완료 처리, 서명된 turn token만 문맥으로 사용(DATA_MODEL §6) |
| Evidence 수집 → Store | 악성 지시, 잘못된 출처, 권리 불명 | 인간 승인, 해시, 상태, provenance, prompt injection 격리 |
| 앱 → 사용자 | 진단성 주장, 무근거 해석, 위기 혼합 | Gate, Verifier, Safety Validator, 안전 대체 응답 |

API 키, HMAC salt, DB binding은 서버 환경/사이트 비밀값으로 관리한다. 클라이언트 번들, 저장소, `.openai/hosting.json`, 로그에 넣지 않는다.

## 4. 구성요소 계약

### 4.1 Client UI

- 모바일 우선 반응형 화면과 접근 가능한 폼을 제공한다.
- 로컬 상태는 사용성 보조일 뿐 정본이 아니다. 서버 응답의 `revision`과 상태를 따른다.
- 네트워크 재시도 시 같은 `Idempotency-Key`를 재사용한다.
- 다른 사용자 식별자나 내부 Evidence ID를 권한 결정 값으로 전송하지 않는다.

### 4.2 Application Server

- 인증된 요청에서 서버가 `owner_key`를 도출한다.
- 모든 diary CRUD, dashboard 집계, export, delete, AI orchestration의 유일한 진입점이다.
- 입력과 모델 출력에 런타임 schema validation을 적용한다.
- 모델 호출은 서버에서만 수행한다. 유료 OpenAI API는 사용하지 않으며(D-019) 구독 기반 경로가 B-06에서 확인되기 전까지 AI 경로는 비활성이다. 경로가 확인되면 그 경로의 데이터 보존·학습 사용 설정(`store: false`에 상당하는 통제)을 확인하고 기록한다.
- timeout, rate limit, bounded retry, idempotency, correlation ID, 사용자 안전 오류를 표준화한다.

### 4.3 Diary Database

- D1/SQLite 후보이며 [DATA_MODEL.md](DATA_MODEL.md)의 논리 계약을 만족해야 한다.
- 한 owner의 한 local date에 활성 일기 하나만 허용한다.
- 대시보드는 완료된 최신 revision만 집계한다.
- 영구 삭제는 transaction으로 종속 데이터까지 제거한다.

### 4.4 AI Orchestrator

- 대화 구조화와 근거 기반 분석을 분리한다.
- 분석은 `plan → deterministic stats → search → gate → generate → verify → safety` 순서다.
- 단계별 입력/출력 schema와 상태를 저장하되, 불필요한 원문 대화는 저장하지 않는다.
- 자동 도구 루프는 허용된 도구, 최대 호출 수, 시간/비용 한도, 중단 조건을 갖는다.
- 이 구성요소는 후행 단계다(D-018). 구독 기반 모델 접근 경로가 확인되지 않으면(B-06 fail/unknown) orchestrator 전체를 비활성화하고 제한 MVP는 이 구성요소 없이 동작·배포한다(D-019).

### 4.5 Evidence Administration

- 일반 사용자 경로와 분리된 관리 작업이다.
- 한 Evidence Card를 MVP의 한 검색 파일로 만들어 file-level metadata filter의 한계를 피한다.
- `draft → reviewed → active → retired` 상태를 사용하며 `active`만 검색 대상이다.

## 5. 논리 API 계약

실제 프레임워크 경로는 바뀔 수 있지만 의미는 유지한다.

| 작업 | 의미 | 핵심 보호 |
| --- | --- | --- |
| `GET /api/session` | 서버가 확인한 사용자/배포 모드 | raw identity 최소화 |
| `GET /api/diaries?date=` | 해당 날짜의 draft/completed 조회 | owner 강제 |
| `PUT /api/diaries/:date` | draft upsert | revision + idempotency |
| `POST /api/diaries/:date/complete` | 완료조건 검사 후 상태 전환 | transaction + unique |
| `DELETE /api/diaries/:date` | 확인 토큰 후 영구 삭제 | 재인증/CSRF + cascade |
| `GET /api/dashboard?range=` | 완료 기록의 결정론적 집계 | 범위 제한 |
| `POST /api/journal-assist` | 현재 턴을 구조화/질문 | full chat 비저장 |
| `POST /api/analyses` | snapshot 분석 요청 | version, rate/cost limit |
| `GET /api/export` | versioned JSON export | owner + no-cache |
| `GET/PUT /api/settings/reminder` | 알림 설정 | timezone validation |

모든 변경 API는 인증, CSRF 방어, schema validation, request size limit, rate limit, audit event를 검토한다. CSRF 방어는 다음으로 확정한다(D-025).

- 모든 변경 요청(PUT/POST/DELETE)은 서버가 정한 custom header(예: `X-Requested-With: emotion-diary`)를 요구한다. 단순 form 제출이나 cross-site fetch는 이 header를 붙일 수 없으므로 header가 없으면 403이다.
- 추가로 `Origin`(없으면 `Referer`)과 `Sec-Fetch-Site`를 배포 origin 허용 목록과 대조한다. 두 검사는 서로 대체가 아니라 중첩이다.
- 세션 cookie를 쓰는 경우 `SameSite=Lax` 이상과 `Secure`를 요구한다. 삭제는 여기에 확인 토큰을 더한다.
- Sites 런타임이 custom header를 통과시키는지는 B-02/B-03에서 실제 요청으로 확인한다.

공개 URL이 생기면 CSP, secure cookie, HSTS, X-Content-Type-Options와 프레임 정책을 배포 게이트에 포함한다.

## 6. 인증과 소유권 후보

### 제한 단일 사용자 MVP

- Site를 owner/명시적 허용 사용자로 제한하고 그 접근 경계를 로그인으로 취급한다.
- D1의 `owner_key`는 클라이언트가 정하지 않는다. 단일 사용자 배포에서는 서버 상수/배포 namespace로 만들 수 있다.
- defense-in-depth(D-025, 결함 I-03): 서버 상수 owner_key 하나에 의존하지 않는다. 런타임이 제공하는 identity(헤더/세션/subject)가 있으면 서버 비밀 설정의 허용 목록과 대조해 불일치·누락이면 403을 반환하고, identity 자체가 제공되지 않는 런타임이면 그 사실을 B-02 증거로 기록하고 Sites 공유 설정 외 두 번째 경계(예: 서버 측 접근 토큰)를 추가한다. Sites 공유 설정 오류 하나로 다른 사용자가 owner 데이터에 접근하는 경로가 있어서는 안 된다.
- 이 모드는 같은 배포에 임의 다중 사용자를 추가할 수 없다.

### 공개 또는 다중 사용자로 전환할 때

- Sites의 현재 Sign in with ChatGPT/서버 identity header 지원을 재검증한다.
- 서버가 신뢰 가능한 identity로부터 `HMAC(server_secret, normalized_subject)` 형태의 pseudonymous `owner_key`를 도출한다.
- 원시 이메일은 제품에 필요하지 않으면 저장하지 않는다.
- 계정 연결, 탈퇴, subject 변경, 공유 링크와 row isolation을 새 threat model과 migration으로 설계한다.

## 7. 오류·재시도·저하 모드

| 실패 | 동작 |
| --- | --- |
| draft 저장 네트워크 실패 | 로컬에 암호화되지 않은 장기 원문을 남기지 않는 범위에서 재시도 표시; 같은 idempotency key 사용 |
| revision 충돌 | 서버/로컬 차이를 보여 주고 자동 덮어쓰기 금지 |
| AI timeout/rate limit | 일기는 유지하고 직접 작성으로 전환; 최대 2회 bounded retry |
| 검색 근거 부족/충돌 | 분석 보류와 일반 성찰 질문만 표시 |
| verifier/safety 실패 | 사용자에게 미검증 분석을 노출하지 않고 재생성 1회 후 보류 |
| dashboard 계산 실패 | 저장 기능은 유지하고 분석/차트만 저하 표시 |
| 알림 미지원/권한 거부 | 앱이 열렸을 때 인앱 리마인더; background 알림 약속 금지 |

외부 호출은 connect/total timeout을 명시하고 지수 backoff+jitter를 사용하되 총 시도 수는 최초 포함 3회 이하로 한다. validation, permission, safety 오류는 재시도하지 않는다.

## 8. 관찰 가능성과 개인정보

- 구조화 로그: correlation ID, route, result class, latency, retry count, model/prompt/evidence version. 원문 일기·감정 이유·이메일·토큰은 제외한다.
- 제품 지표: 저장 성공률, AI 보류율, Gate 실패 이유, verifier 실패율, 비용/요청. 개인의 감정 내용은 분석 지표로 수집하지 않는다.
- 보안 이벤트: 권한 거부, 과도한 요청, export/delete 요청. 최소 식별자로 제한하고 보존 기간을 정한다.
- 사용자 대상 오류에는 내부 프롬프트, stack trace, Evidence 관리 경로를 노출하지 않는다.

## 9. 비기능 예산의 초기 목표

이 값은 실제 스파이크 후 [DECISIONS.md](DECISIONS.md)에서 확정한다.

- 직접 작성 저장 p95: 1초 이내(정상 네트워크)
- 대시보드 p95: 2초 이내(1년 기록)
- AI 대화 첫 응답 p95: 8초 이내
- RAG 분석: 30초 이내 또는 진행/취소 가능한 비동기 UX
- 모바일: 360 CSS px에서 가로 스크롤 없음
- 접근성: WCAG 2.2 AA를 목표, 키보드/스크린리더 핵심 흐름 통과

## 10. 부트스트랩 검증표

현재 프로젝트의 agent는 `confirmed/rejected/unknown`과 증거를 기록한다.

| 가설 | 게이트 | 판정 | 실패 시 대안 |
| --- | --- | --- | --- |
| Sites가 선택한 UI/server framework를 지원 | B-08 | unknown | 지원되는 얇은 stack 또는 무료 별도 hosting(D-021) |
| D1 binding과 batch/CHECK/trigger가 데이터 계약(D-024) 충족 | B-04 | unknown | 무료 범위의 대체 DB 재평가 |
| 제한 공유+identity 대조가 요구 인증 경계 충족 | B-02 | unknown | server auth/무료 private hosting |
| server secret을 client에서 격리, custom header CSRF 통과 | B-03 | unknown | 배포 중단 |
| 구독 기반 모델 호출 경로가 존재하고 server-only·strict schema·보존 통제 가능(B-06 재정의, D-019) | B-06 | unknown | AI 대화·RAG 보류, 제한 MVP만 진행(D-018) |
| Web Push/background 동작 | B-08 | unknown | 인앱 reminder만 MVP |
| Vector search filter/score 응답이 Gate 입력 충족(유료 Vector Store 불가 시 구독 경로/로컬 대안) | B-07 | unknown | custom DB/hybrid retrieval 또는 RAG 보류 |
| 데이터 보존·삭제·residency가 허용 수준 충족 | B-05 | unknown | 다른 무료 저장/hosting 또는 제품 범위 축소 |
