# 데이터 모델·무결성 명세

## 1. 책임

이 문서는 감정일기의 논리 데이터, 무결성, 날짜, 버전, 삭제·내보내기 계약의 정본이다. 실제 SQL과 마이그레이션은 이 계약을 보존해야 한다. 화면 표현은 [UX_SPEC.md](UX_SPEC.md), AI 전송 최소화는 [AI_RAG_SPEC.md](AI_RAG_SPEC.md)를 따른다.

기계 검증 시드는 [../schemas/diary-entry.schema.json](../schemas/diary-entry.schema.json)과 [../schemas/export.schema.json](../schemas/export.schema.json)에 있다. 문서와 schema가 충돌하면 이 문서를 기준으로 schema와 테스트를 함께 고친다.

## 2. 공통 규칙

- 모든 ID는 추측하기 어려운 UUID/ULID 계열을 사용한다.
- `owner_key`는 서버 인증 컨텍스트에서 생성하며 요청 body/query의 값을 받지 않는다.
- 시각은 DB에 UTC ISO-8601로 저장한다. 일기 귀속 날짜는 별도 `entry_date`(YYYY-MM-DD)와 당시 IANA `timezone`으로 저장한다.
- 사용자 텍스트는 UTF-8, 서버에서 길이 제한과 제어문자 검사를 적용하고 출력 시 context-aware escaping한다.
- 행 변경에는 `revision`과 `updated_at`을 사용해 오래된 클라이언트의 무조건 덮어쓰기를 막는다.
- 분석·대시보드는 `status = completed`인 기록만 사용한다.

## 3. 핵심 엔터티

### 3.1 `diary_entries`

| 필드 | 계약 |
| --- | --- |
| `id` | PK |
| `owner_key` | 서버가 정한 소유 namespace, 필수 |
| `entry_date` | 사용자가 기록하는 현지 날짜, 필수 |
| `timezone` | 완료 시점의 IANA timezone, 필수 |
| `status` | `draft | completed`, 필수 |
| `event_text` | 사건, 완료 시 nonblank |
| `reason_text` | 감정 이유, 완료 시 nonblank |
| `revision` | 1부터 증가하는 optimistic lock |
| `taxonomy_version` | 감정 사전 버전 |
| `first_completed_at` | 최초 완료 UTC 시각; 완료 취소/수정에도 유지 |
| `first_completed_local_date` | 실제로 최초 완료한 당시 현지 날짜; streak의 유일한 작성일 기준 |
| `completed_at` | 최신 완료 UTC 시각 |
| `created_at`, `updated_at` | UTC audit time |

DB 불변조건:

- `UNIQUE(owner_key, entry_date)` — draft와 completed를 합쳐 하루 한 기록.
- completed일 때 사건·이유·감정 1개 이상·모든 강도 1~10이 transaction 안에서 검증되어야 한다.
- 과거 `entry_date`라도 `first_completed_local_date`는 실제 작성 완료일이므로 과거 streak를 복구하지 않는다.

### 3.2 `diary_emotions`

| 필드 | 계약 |
| --- | --- |
| `id`, `diary_id` | PK/FK, diary hard delete 시 cascade |
| `category_code` | 7개 상위 감정의 안정 코드 |
| `emotion_code` | taxonomy의 세부 감정 안정 코드 |
| `label_snapshot` | 기록 당시 한글 표시명 |
| `intensity` | 정수 1~10 |
| `display_order` | 사용자가 선택한 순서 |

`UNIQUE(diary_id, emotion_code)`로 같은 세부 감정의 중복 선택을 막는다. 카테고리는 taxonomy에서 도출해 교차 검증한다.

### 3.3 `diary_reflections`

칭찬과 감사를 같은 구조로 저장한다.

| 필드 | 계약 |
| --- | --- |
| `id`, `diary_id` | PK/FK cascade |
| `kind` | `praise | gratitude` |
| `slot` | 1~3 |
| `text` | 선택 입력; blank는 행을 만들지 않아도 됨 |

`UNIQUE(diary_id, kind, slot)`을 적용한다. UI에는 각각 세 슬롯을 항상 제공하지만 완료 필수는 아니다.

### 3.4 `reminder_settings`

- owner당 1행: `enabled`, `local_time`, `timezone`, `channel`, `permission_state`, `updated_at`.
- MVP `channel`은 `in_app`; 플랫폼 검증 후에만 `web_push`를 허용한다.
- 당일 diary가 completed이면 reminder를 표시하지 않는다.

### 3.5 `analysis_runs`

| 필드 | 계약 |
| --- | --- |
| `id`, `owner_key` | 분석 소유권 |
| `period_start`, `period_end` | 분석된 entry_date 범위 |
| `input_snapshot_hash` | diary ID+revision+stats의 canonical hash |
| `status` | `queued | running | passed | withheld | failed | stale` |
| `stats_version`, `prompt_version`, `model_id`, `evidence_set_version` | 재현 metadata |
| `gate_result`, `verifier_result`, `safety_result` | 원문 chain-of-thought가 아닌 구조화 판정 |
| `output_json` | 검증 통과한 사용자 출력만; schema version 포함 |
| `created_at`, `completed_at` | UTC |

일기 revision 또는 taxonomy/stats 정의가 바뀌어 snapshot hash가 달라지면 관련 분석을 `stale`로 표시한다.

### 3.6 `analysis_claims`와 `claim_evidence`

- 사용자에게 보인 claim 단위 텍스트, claim type, confidence/limitation, verification status를 저장한다.
- 각 심리학적 claim은 하나 이상의 active Evidence Card version과 연결한다.
- observation claim은 diary/stat snapshot에 연결하고 연구 citation을 가장하지 않는다.

### 3.7 `idempotency_records`

- `(owner_key, operation, idempotency_key)` unique.
- request hash, response status/reference, expiry를 저장한다.
- 같은 키에 다른 request hash가 오면 `409`로 거부한다.

## 4. 감정 taxonomy

원자료 이미지는 [../references/README.md](../references/README.md)의 파일이다. 구현용 taxonomy는 다음 필드를 갖는 versioned JSON/seed data로 만든다.

```json
{
  "version": "emotion-ko-v1",
  "source_files": ["..."],
  "review_status": "pending_user_review",
  "categories": [
    {
      "code": "stable-code",
      "label_ko": "즐거움",
      "color_token": "emotion-...",
      "character_asset": "...",
      "emotions": [{ "code": "...", "label_ko": "..." }]
    }
  ]
}
```

원본 표기를 OCR로 자동 전사하더라도 출시 전 원본 이미지와 사람이 대조한다. label 수정은 기존 기록을 깨지 않도록 code는 유지하고 taxonomy version과 snapshot label을 갱신한다.

## 5. 상태 전이

```text
없음 ──첫 입력──> draft ──완료조건 통과──> completed
                     ^                         |
                     |────완료 취소/편집───────|

draft/completed ──사용자 확인──> hard deleted
completed ──revision 변경──> 기존 analysis stale
```

완료 취소를 허용하더라도 `first_completed_at/local_date`는 지우지 않는다. 삭제 후 같은 날짜에 새 일기를 만들 수 있지만 새 ID와 새 audit event를 가진다.

## 6. 임시저장과 AI 대화

- 서버에는 구조화 draft만 저장한다. AI와 주고받은 전체 대화 transcript는 기본적으로 영구 저장하지 않는다.
- 현재 요청을 처리하는 데 필요한 최근 턴은 메모리/요청 범위에서만 사용하고 응답 후 폐기한다.
- 새로고침 뒤에는 구조화 draft는 복구되지만 AI 대화 문장 전체는 복구되지 않을 수 있음을 UX에서 알린다.
- 브라우저 local storage에 일기 원문을 장기 저장하지 않는다. 오프라인 기능은 별도 암호화·위협 모델 없이는 제공하지 않는다.

## 7. 대시보드 계산 계약

- 기간은 사용자의 현재 timezone 기준 `entry_date`로 선택한다.
- 감정 빈도: 완료 diary의 `diary_emotions` 행 수.
- 카테고리 비중: 선택된 세부 감정 수를 category별 집계. diary 수와 혼동하지 않고 UI에 분모를 표시한다.
- 평균 강도: 해당 emotion/category 선택 행의 산술평균. 표본 수 `n`을 함께 제공한다.
- 7일 추세: 날짜별 선택 감정 강도 집계; 기록 없는 날은 0이 아니라 missing.
- 작성 streak: `first_completed_local_date`의 연속 날짜. backdated `entry_date`는 과거 streak를 채우지 않는다.
- 현재 streak는 오늘 또는 어제까지 이어진 연속 `first_completed_local_date`로 정의하고 timezone 변경 경계를 테스트한다.

계산 함수는 모델이 아니라 순수 코드/SQL로 만들고 같은 snapshot에서 재현 가능해야 한다.

## 8. 삭제·내보내기·보존

### 삭제

- 기록 삭제는 사용자 확인 후 즉시 영구 삭제하는 MVP 계약이다. 휴지통/복구를 암시하지 않는다.
- diary, emotion, reflection, 연결 claim을 transaction으로 cascade 삭제한다. 해당 snapshot의 분석은 제거하거나 재사용 불가 상태로 만든다.
- 로그에는 원문 없이 삭제 event와 결과만 남기고, DB/호스팅 백업의 실제 소거 지연은 개인정보 안내에 명시한다.

### 내보내기

- MVP는 UTF-8 `application/json` 한 파일이다.
- 최상위에 `schema_version`, `exported_at`, `timezone`, `diaries`, `analyses`(선택)를 둔다.
- 비밀값, 내부 owner key, raw model prompt, verifier 내부 판정 전문은 제외한다.
- JSON Schema로 자동 검증하고 재수입 가능 여부는 별도 범위다. CSV는 향후 기능이다.

### 보존

- 계정/사이트 제거 시 데이터 처리, 서버 로그, OpenAI API와 백업의 보존 기간은 배포 전 실제 공급자 설정을 확인해 정책에 기록한다.
- 확정할 수 없는 보존 특성은 “즉시 완전 삭제”로 약속하지 않는다.

## 9. 마이그레이션 원칙

- 모든 schema 변경은 순방향 migration과 검증 query를 가진다.
- 파괴적 migration 전 export/backup 방법과 rollback 또는 forward-fix 계획을 기록한다.
- 새 non-null 컬럼은 expand → backfill → validate → contract 순서로 적용한다.
- taxonomy와 analysis schema는 DB schema와 별도 version을 가진다.
- 실제 사용자 데이터로 migration을 시험하지 않고 합성 fixture와 복사본을 사용한다.
