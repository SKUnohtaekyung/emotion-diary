# AI·RAG 기술 명세

## 1. 책임과 구현 상태

이 문서는 감정일기의 AI 입력·출력·근거·보류·재검증 계약의 정본이다. 제품 기능은 [../PRD.md](../PRD.md), 저장/version은 [DATA_MODEL.md](DATA_MODEL.md), 금지·위기·개인정보는 [SAFETY_POLICY.md](SAFETY_POLICY.md), 합격 기준은 [EVAL_PLAN.md](EVAL_PLAN.md)를 따른다.

이 문서의 AI 기능 전체는 **후행 단계**다(D-018). 제한 MVP(직접 작성+결정론적 대시보드)는 이 문서의 어떤 구성요소도 없이 배포된다.

모델 접근 경로는 **유료 API가 아니어야 한다**(D-019). OpenAI Responses API·Vector Store search 표기는 이 결정 이전의 후보이며, 실제로는 사용자가 구독 중인 Codex/Claude 자원으로 가능한 경로가 B-06(G2c)에서 server-only 호출, strict schema 출력, refusal/incomplete/error 처리, 데이터 보존 통제를 만족하는지로 판정한다. 확인되지 않으면 AI 대화 작성·RAG 분석은 보류 상태로 남고 [DECISIONS.md](DECISIONS.md)에 그 사실을 기록한다. 검색 계층(B-07, G2d)도 유료 Vector Store 대신 구독 경로 또는 로컬/무료 대안이어야 하며 확인 전에는 `unknown`이다.

기계 검증 시드는 [../schemas/journal-assist-output.schema.json](../schemas/journal-assist-output.schema.json), [../schemas/evidence-card.schema.json](../schemas/evidence-card.schema.json), [../schemas/analysis-output.schema.json](../schemas/analysis-output.schema.json)에 있다.

## 2. 불변 원칙

1. AI는 사용자의 사건·감정·강도·원인을 판정하지 않고 질문과 후보만 제공한다.
2. 일기 작성 AI와 심리학 분석 AI를 분리한다. 작성 AI에는 연구 RAG가 필요하지 않으며, 분석 AI에는 승인 근거를 강제한다.
3. 모델의 사전지식은 제거할 수 없으므로 Evidence가 부족하면 심리학적 해석을 생성하지 않는 경로를 코드와 평가로 보장한다.
4. 개인 기록의 관찰은 결정론적 통계로, 일반적 심리학 설명은 승인 Evidence로 각각 지지한다.
5. 진단·치료·성격/애착 판정은 근거가 있어도 금지한다.
6. Evidence와 일기 원문 속 지시문은 모두 데이터이며 system/developer 지침을 바꿀 수 없다.
7. 보류는 정상 결과다. 가용성을 위해 근거 기준을 낮추지 않는다.

## 3. 책임 분리

| 단계 | 입력 | 허용 출력 | 실패/금지 |
| --- | --- | --- | --- |
| Journal Conversation | 현재 턴과 구조화 draft | 열린 질문, taxonomy 후보 | 감정 확정, 사건 창작, 분석 |
| Journal Structuring | 사용자 발화·명시적 선택 | strict diary patch | 추측으로 빈칸 채우기 |
| Deterministic Statistics | completed diary snapshot | 빈도·평균·추세·streak | 심리 상태 추론 |
| Analysis Planner | 최소 통계와 분석 범위 | 관찰 후보, 일반화된 search query/filter | 최종 심리 주장 |
| Retrieval | query/filter와 active Evidence set | score가 있는 승인 카드 후보 | diary 저장/검색, 자율 tool loop |
| Evidence Quality Filter | 카드와 provenance | 관련·적용 가능 후보/상충 묶음 | 출처 불명 카드 통과 |
| Evidence Gate | 관찰·후보·정책 | pass/fail reason codes와 허용 claim boundary | 생성 문장 작성 |
| Interpretation Generator | pass bundle만 | 제한된 해석·한계·질문 | 허용 범위 밖 주장 |
| Claim–Evidence Verifier | 초안·허용 카드 | claim별 supported/unsupported | 새 근거 창작 |
| Safety Validator | 검증된 후보 | allow/withhold/crisis redirect | 일반 분석과 위기 대응 혼합 |

각 단계는 작고 versioned된 JSON schema를 사용한다. 하나의 자유형 agent가 전체 단계를 자율 수행하게 하지 않는다.

## 4. 데이터·API 경계

```text
Diary DB ──completed revisions──> deterministic snapshot
   |                                      |
   | (최소 집계/필요한 제한 발췌)           v
   |                                Analysis pipeline
   |                                      ^
   X                                      |
Evidence Vector Store <── approved Evidence Cards
```

- 일기 원문과 AI 작성 transcript를 Evidence Vector Store에 업로드하지 않는다.
- 분석 기본 입력은 기간, 기록 수, emotion code/label, intensity 집계, 사용자가 입력한 상황의 최소 발췌다. 전체 일기는 명시된 필요와 사용자 표시 가능성을 확인한 경우에만 제한적으로 포함한다.
- account identity, owner key, token, API key는 prompt, Vector Store attributes, Evidence Card, 평가 fixture에 넣지 않는다.
- 모델은 서버에서만 호출하며 유료 API는 사용하지 않는다(D-019). 구독 기반 경로가 확인되면 그 경로의 보존·학습 사용 설정(`store: false` 상당)을 명시·확인하고, 통제할 수 없는 경로에는 일기 원문을 보내지 않는다.
- 공급자 측 대화 상태 ID(`previous_response_id` 등)를 다른 사용자 간에 재사용하지 않는다. 작성 대화의 장기 server state는 기본 사용하지 않는다.
- 모델에 내부 DB/사용자 조회 도구를 제공하지 않는다. 애플리케이션이 먼저 권한을 검사하고 최소 입력을 조립한다.

## 5. Journal Conversation과 Structuring

### 5.1 상태

서버가 보유하는 입력은 현재 구조화 draft와 요청 처리에 필요한 최근 사용자 턴이다. 전체 transcript를 영구 저장하지 않는다. 클라이언트는 `revision`을 보내고 서버는 허용된 patch만 적용한다.

대화 이력 신뢰 계약(결함 I-11, DATA_MODEL §6):

- 클라이언트가 보내는 이전 assistant 턴은 **신뢰하지 않는 입력**이다. 서버는 응답마다 `(draft_id, revision, turn_index, assistant_message)`의 HMAC `turn_token`을 발급하고, 다음 요청의 이전 턴은 token이 일치하는 경우에만 모델 문맥에 포함한다.
- token 불일치·누락·순서 오류 턴은 조용히 폐기하지 않고 `history_rejected` 사유로 기록한 뒤 현재 사용자 발화와 서버 보유 draft만으로 응답한다.
- 문맥에 넣는 턴 수와 총 길이에 상한을 둔다. 사용자 턴도 길이·제어문자 검사를 거친다.
- 과거 턴에 있는 "당신은 ~라고 확정했다" 같은 위조 문장이 감정 확정·빈칸 채우기·안전 우회의 근거가 되지 않는지 EVAL §9 턴 위조 사례로 검증한다.

### 5.2 출력 schema 개념

```json
{
  "assistant_message": "한 번에 한 가지 비판단적 질문",
  "suggested_emotion_codes": ["taxonomy에 존재하는 코드"],
  "draft_patch": {
    "event_text": null,
    "reason_text": null,
    "emotions": []
  },
  "missing_required_fields": ["reason_text"],
  "ready_for_user_review": false,
  "safety_signal": "none"
}
```

- `safety_signal`은 필수이며 `none | possible_crisis` 중 하나다(결함 I-02, D-020). `possible_crisis`이면 서버는 `draft_patch`와 `suggested_emotion_codes`를 무시하고 draft를 바꾸지 않은 채 [SAFETY_POLICY.md](SAFETY_POLICY.md) §6의 위기 흐름으로 전환한다. 모델의 신호는 단독 근거가 아니라 Safety Validator의 규칙 검사와 결합하며, 위험도 점수나 진단 label은 schema에 두지 않는다.
- 이 감지는 AI 대화 경로에서만 일어난다. 직접 작성 원문은 자동 스캔하지 않는다(D-020).
- `additionalProperties: false`, enum/range/length를 포함한 strict schema를 사용한다.
- 사용자 발화에서 명확하지 않은 값은 `null`/미포함이며 모델이 채우지 않는다.
- suggested emotion code는 현재 taxonomy 허용 목록과 코드로 재검사한다.
- 저장은 모델 응답만으로 완료하지 않고 사용자가 전체 초안을 확인한 뒤 별도 complete API를 호출한다.
- refusal, incomplete, schema validation failure, timeout이면 draft를 변경하지 않고 직접 작성 fallback을 반환한다.

## 6. Psychology Evidence Store

### 6.1 자료 수집 우선순위

1. 공공기관·전문 학회의 공식 지침
2. 체계적 문헌고찰과 메타분석
3. 동료심사 학술지 원연구

블로그, 상업적 자기진단, 출처 없는 요약, AI가 생성한 2차 요약은 Evidence가 아니다. 단일 연구는 일반화 한계를 카드에 명시한다. 자료 사용 권리, 전문 접근 가능성, 철회/정정 여부도 검토한다.

### 6.2 Evidence Card schema

MVP에서는 **한 카드=한 검색 파일**로 저장해 file-level attributes가 카드 metadata와 일치하게 한다. 원문 PDF의 임의 chunk를 사용자 claim에 직접 인용하지 않는다.

```yaml
schema_version: evidence-card-v1
evidence_id: stable-logical-id
version: 1
status: draft | reviewed | active | retired
title: source title
authors: [author]
publication_date: YYYY-MM-DD | YYYY
doi_or_stable_uri: https://...
publisher_or_journal: name
language: ko | en | other
jurisdiction: global | country-code | not_applicable
evidence_type: guideline | meta_analysis | systematic_review | peer_reviewed_study
evidence_level: high | moderate | limited
topic_codes: [controlled-topic]
population:
  age_range: description
  setting: description
  inclusion: description
  exclusions: description
study:
  design: description
  sample_size: number | unknown
  comparator: description | none
claim_boundary: source가 지지하는 제한된 일반 주장
effect_and_uncertainty: effect, confidence interval 또는 질적 불확실성
conditions: 적용 조건
limitations: [인과성, 편향, 일반화, 상충]
source_spans:
  - locator: page/section/table
    supporting_text: 저작권 허용 범위의 짧은 검증 발췌
review:
  reviewed_by: reviewer-id
  reviewed_at: ISO-8601
  notes: description
content_hash: sha256
```

필수 필드가 없거나 `active`가 아니거나 hash/source가 검증되지 않은 카드는 검색 후보에서 제외한다. `supporting_text`는 검증 근거이지 원문 대량 복제가 아니며 저작권 제한을 지킨다.

### 6.3 수집 상태와 승인

```text
원문 후보 → 권리/출처 확인 → 카드 초안 → 사람 대조 → reviewed
        → retrieval/eval 회귀 통과 → active → 정정/철회/만료 → retired
```

카드를 새로 활성화하면 Evidence set version을 올리고 전체 고정 평가를 실행한다. 이전 분석 결과는 사용 카드 version을 보존한다.

## 7. 검색과 Evidence Gate

### 7.1 애플리케이션 통제 검색

MVP 후보는 모델이 `file_search`를 자율 호출하는 경로가 아니라 서버가 Vector Store search endpoint를 직접 호출하는 경로다.

1. Planner schema를 코드로 검증한다.
2. `status=active`, topic, evidence type/level, population/language 등 지원되는 file attributes로 후보를 제한한다.
3. 일반화·비식별화된 query로 semantic search한다.
4. file ID, card ID/version, score, returned content를 허용 목록과 대조한다.
5. 사전 동결된 k/score/품질 규칙으로 Gate에 넘긴다.

현재 API가 card 단위 attributes나 필요한 filtering을 지원하지 않으면 한 카드 한 파일 규칙을 유지하거나 custom DB/hybrid retrieval을 대안으로 평가한다. 모델에게 검색 실패를 숨기고 일반지식으로 답하게 하지 않는다.

### 7.2 Quality Filter

각 항목은 코드 검사(`[code]`)와 LLM 판정(`[LLM]`)으로 구분한다(D-026). `[code]` 항목 하나라도 실패하면 LLM 판정 없이 후보에서 제외하고, `[LLM]` 판정은 독립 prompt와 reason code만 출력하며 카드 내용을 재작성하지 않는다.

- `[code]` source, review, active status, content hash가 유효한가
- `[code]` retrieval이 반환한 content가 카드의 `source_spans.supporting_text`와 정확히 일치하는가(chunk 반환이면 카드 span 포함 여부를 코드로 대조; 결함 I-09)
- `[code]` file/card ID·version이 Gate allowlist에 있고 `topic_codes` 등 배열 attribute가 검색 filter의 스칼라 제약과 일치하는가(B-07 스파이크 항목)
- `[LLM]` 현상과 claim boundary가 실제로 관련 있는가
- `[LLM]` population/setting/조건이 사용자에게 일반화 가능한 범위인가
- `[LLM]` 더 높은 수준 또는 최신의 상충 근거가 있는가
- `[LLM]`+`[code]` 진단·치료·낙인으로 직접 이어지지 않는가(금지 label 정규식은 code, 문맥 판단은 LLM)

### 7.3 Gate reason codes

PASS는 적어도 하나의 관련 active 카드가 있고 생성하려는 claim boundary가 명시된 경우에만 가능하다. 다음 reason이면 FAIL이다.

- `NO_RESULTS`
- `BELOW_RETRIEVAL_THRESHOLD`
- `UNAPPROVED_OR_STALE_EVIDENCE`
- `POPULATION_OR_CONDITION_MISMATCH`
- `CONFLICT_NOT_RESOLVABLE`
- `CLAIM_OUTSIDE_EVIDENCE_BOUNDARY`
- `INSUFFICIENT_DIARY_DATA`
- `SAFETY_PROHIBITED`
- `PIPELINE_ERROR`

FAIL이면 심리학 interpretation은 만들지 않는다. 결정론적 observation과 “현재 지식베이스에서 이 해석을 뒷받침할 충분한 근거를 찾지 못했습니다”라는 보류 설명, 열린 질문만 허용한다.

## 8. 생성 계약

Generator는 Gate가 허용한 observation과 claim boundary만 받는다. raw 검색 전체와 비승인 카드를 전달하지 않는다.

```json
{
  "schema_version": "analysis-output-v1",
  "analysis_status": "grounded | observation_only | withheld",
  "observations": [
    { "text": "계산된 사실", "stat_refs": ["snapshot field"] }
  ],
  "interpretations": [
    { "claim_id": "c1", "text": "제한된 맥락", "evidence_refs": ["id@version"] }
  ],
  "limitations": ["데이터·근거 한계"],
  "reflection_questions": ["열린 질문"],
  "withhold_reason_codes": []
}
```

- `observations`는 자유 서술이 아니다(결함 I-07, D-026). 각 `text`는 `stat_refs`가 가리키는 snapshot 필드만 언급할 수 있고, 코드가 텍스트 안의 수치·기간·emotion label을 추출해 snapshot 값과 대조한다. `stat_refs`에 없는 수치·기간·label·인과 표현(“때문에”, “영향으로” 등)이 있으면 그 observation을 제거한다. Generator는 허용된 관찰 template 목록에서 선택하는 방식을 우선하고, 자유 문장은 template로 표현할 수 없을 때만 허용한다.
- 모든 interpretation claim은 적어도 하나의 허용 Evidence version을 인용한다.
- 확률, 인과, 질환, 성격 label은 schema 이후 별도 safety rule로도 차단한다.
- strict JSON parsing 실패, refusal, incomplete, content filter, timeout은 정상 오류 상태로 처리하며 free-text fallback을 표시하지 않는다.

## 9. Claim–Evidence Verifier

검증은 생성기 한 번의 자기확인에 의존하지 않는다.

### 결정론적 코드 검사

- schema/version/enum/length
- stat reference 존재와 값 일치
- evidence ID/version이 Gate allowlist에 존재
- active status와 content hash 일치
- interpretation의 citation coverage 100%
- 금지 정규식/label과 개인정보 패턴

### 독립 semantic 검사 (필수, D-026)

- **필수**: Generator와 분리된 별도 호출과 독립 prompt(가능하면 다른 고정 모델)로 claim을 카드 `claim_boundary`, population, conditions, limitations와 비교한다. Generator 호출 안의 자기확인이나 같은 대화 문맥 재사용은 검증으로 인정하지 않는다.
- 구독 기반 모델 경로(D-019)에서 독립 호출을 구성할 수 없으면 RAG 분석 기능 전체를 보류한다. 코드 검사만으로 semantic 검증을 대체하지 않는다.
- 출력은 `supported | too_strong | unsupported | safety_prohibited`와 reason code만 사용한다.
- verifier에 추가 검색 도구를 주지 않아 사후 근거 창작을 막는다.

실패 시 허용 동작은 unsupported 문장 삭제와 `observation_only/withheld` 전환이다. 같은 초안을 최대 1회만 제한적으로 재생성한다. 두 번째 실패, verifier timeout 또는 disagreement면 사용자에게 노출하지 않고 보류한다.

## 10. Safety Validator와 위기 분기

최종 후보를 [SAFETY_POLICY.md](SAFETY_POLICY.md)에 따라 검사한다. 즉각적 자해·타해·위기 신호가 감지되면 RAG 분석을 중단하고 한국 기준 versioned crisis flow로 전환한다(D-020). 진단 질문에는 근거를 검색해 진단을 시도하지 않는다.

위기 감지 범위(D-020): Safety Validator와 `safety_signal`은 AI 대화 작성과 사용자가 명시 요청한 분석의 입력·출력에만 적용한다. 직접 작성 원문을 백그라운드에서 스캔하는 경로는 만들지 않으며, 이 한계는 UX 고지로 보완한다.

Prompt injection 방어:

- 일기와 Evidence를 명시적 delimiter로 감싼다.
- source 안의 명령, 역할 변경, 비밀 요청을 무시하라는 우선 지침을 둔다.
- 단계별 최소 도구 allowlist와 최대 tool call을 사용한다.
- URL fetch/code execution/DB browse 도구를 분석 모델에 제공하지 않는다.
- output을 schema와 allowlist로 검증한 뒤에만 UI에 전달한다.

## 11. 모델·프롬프트·비용 계약

- 모델 ID를 코드 여러 곳에 흩뜨리지 않고 versioned configuration에 둔다.
- prompt는 역할별로 versioning하고 변경 diff/평가 run을 연결한다.
- temperature 등 sampling parameter는 지원 여부를 최신 모델 문서에서 확인한다. 지원하지 않는 값을 추측하지 않는다.
- input/output token, latency, retry, tool call, request cost를 원문 없이 측정한다.
- 요청별 timeout, max output, max tool calls와 owner rate limit를 설정한다.
- 대규모 diary 전체를 넣는 대신 deterministic aggregation과 기간 제한을 사용한다.
- 동일 snapshot+config의 성공 분석은 재사용하고 idempotency로 중복 비용을 막는다.

## 12. 실패 처리와 운영

| 실패 지점 | 사용자 결과 | 내부 동작 |
| --- | --- | --- |
| API 인증/설정 | 분석 일시 불가 | 재시도 금지, secret/config 점검 |
| rate limit/5xx/timeout | 직접 작성/통계 유지, 분석 지연 | jitter 포함 최대 2회 재시도 |
| refusal/incomplete/schema | free-text 노출 금지 | 1회 schema 재요청 후 withheld |
| retrieval 0/낮은 점수 | observation only | reason code 저장 |
| Gate fail | 심리 해석 보류 | 일반지식 fallback 금지 |
| verifier fail | 결과 미노출 | 문장 삭제/1회 재생성 후 보류 |
| safety/crisis | 일반 분석 중단 | 안전 흐름 전환 |

로그에는 correlation ID, 단계, reason code, latency, version만 남긴다. 원문 입력/출력과 chain-of-thought를 저장하지 않는다.

## 13. 변경·재검증

다음 중 하나가 바뀌면 관련 고정 eval 전체를 재실행한다.

- 모델, prompt, schema, tool 설정
- Vector Store, embedding/search 설정, k/threshold/filter
- Evidence Card 또는 Evidence set version
- 통계 정의, taxonomy, safety rule
- API SDK major/minor behavior와 hosting 경계

무근거 주장, 잘못된 citation, prompt injection 통과, 개인정보 노출이 발견되면 분석 기능을 즉시 보류하고 관련 Evidence를 `retired` 또는 configuration을 rollback한다. 평가 기준과 출시 증거는 [EVAL_PLAN.md](EVAL_PLAN.md)에 따른다.
