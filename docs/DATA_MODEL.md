# 데이터 모델·무결성 명세

## 1. 책임

이 문서는 감정일기의 논리 데이터, 무결성, 날짜, 버전, 삭제·내보내기 계약의 정본이다. 실제 SQL과 마이그레이션은 이 계약을 보존해야 한다. 화면 표현은 [UX_SPEC.md](UX_SPEC.md), AI 전송 최소화는 [AI_RAG_SPEC.md](AI_RAG_SPEC.md)를 따른다.

기계 검증 시드는 [../schemas/diary-entry.schema.json](../schemas/diary-entry.schema.json)과 [../schemas/export.schema.json](../schemas/export.schema.json)에 있다. 문서와 schema가 충돌하면 이 문서를 기준으로 schema와 테스트를 함께 고친다.

## 2. 공통 규칙

- 모든 ID는 추측하기 어려운 UUID/ULID 계열을 사용한다.
- `owner_key`는 서버 인증 컨텍스트에서 생성하며 요청 body/query의 값을 받지 않는다.
- 시각은 DB에 UTC ISO-8601로 저장한다. 일기 귀속 날짜는 별도 `entry_date`(YYYY-MM-DD)와 당시 IANA `timezone`으로 저장한다.
- 클라이언트가 보낸 `timezone`은 서버의 IANA 목록으로 검증하고, `entry_date`는 그 timezone의 서버 현재 날짜와 대조해 미래 날짜를 거부한다. 클라이언트 timezone은 사용자 편의 값이지 권한·완료 판정의 근거가 아니다(결함 I-15).
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
- `status`는 `CHECK (status IN ('draft','completed'))`, completed 행은 `CHECK (status <> 'completed' OR (first_completed_at IS NOT NULL AND completed_at IS NOT NULL AND first_completed_local_date IS NOT NULL))`.
- 완료 전환은 저장소의 interactive transaction에 의존하지 않는다(D-024). D1(D-032)은 interactive transaction이 없고 `batch()` 원자 실행과 trigger를 제공하므로, 검사 조건은 statement 안에 두고 다중 statement는 batch로 묶는다. 서버는 사건·이유 nonblank, `diary_emotions` 1행 이상, 모든 `intensity` 1~10을 **하나의 조건부 UPDATE**로 검사한다. 예: `UPDATE diary_entries SET status='completed', revision=revision+1, ... WHERE id=? AND owner_key=? AND revision=? AND status='draft' AND trim(event_text)<>'' AND trim(reason_text)<>'' AND EXISTS (SELECT 1 FROM diary_emotions WHERE diary_id=diary_entries.id)`. 영향 행이 0이면 완료를 실패(409 revision 충돌 또는 422 완료조건 미충족)로 돌려주고 어떤 상태도 바꾸지 않는다. 검사와 갱신을 분리한 read-then-write는 TOCTOU 창이 있으므로 금지한다.
- completed 이후에는 마지막 감정 행 삭제나 사건·이유 blank 갱신을 trigger(`BEFORE DELETE ON diary_emotions` / `BEFORE UPDATE ON diary_entries`에서 `RAISE(ABORT)`) 또는 같은 조건을 포함한 조건부 statement로 차단한다. trigger 지원 여부는 B-04에서 확인하고, 미지원이면 조건부 statement만으로 같은 불변조건을 보장해야 한다.
- 과거 `entry_date`라도 `first_completed_local_date`는 실제 작성 완료일이므로 과거 streak를 복구하지 않는다.

### 3.2 `diary_emotions`

| 필드 | 계약 |
| --- | --- |
| `id`, `diary_id` | PK/FK, diary hard delete 시 cascade |
| `category_code` | 7개 상위 감정의 안정 코드 |
| `emotion_code` | taxonomy의 세부 감정 안정 코드. 카테고리별 독립 발급 `<category_code>-<slug>`(D-022) |
| `label_snapshot` | 기록 당시 한글 표시명. 카테고리가 다르면 같은 label이라도 다른 code |
| `intensity` | 정수 1~10, `CHECK (intensity BETWEEN 1 AND 10)` |
| `display_order` | 사용자가 선택한 순서 |

`UNIQUE(diary_id, emotion_code)`로 같은 세부 감정의 중복 선택을 막는다. 카테고리는 taxonomy에서 도출해 교차 검증한다. 원자료에는 카테고리 간 중복 label(예: 가벼운·흐뭇한·뿌듯한·포근한·고통스러운·구역질나는·황량한)이 있으므로 label만으로 감정을 식별하지 않는다.

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

- `owner_key`가 PK인 owner당 1행: `enabled`, `local_time`, `timezone`, `channel`, `permission_state`, `updated_at`. 갱신은 upsert(`INSERT ... ON CONFLICT(owner_key) DO UPDATE`)로 재시도에 안전해야 한다.
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

read-time guard(결함 I-16): 저장된 `status`만 믿지 않는다. 분석을 조회할 때 서버는 같은 기간의 현재 completed diary ID+revision+stats 정의로 canonical hash를 다시 계산해 `input_snapshot_hash`와 비교하고, 다르면 저장 상태와 무관하게 `stale`로 응답한다. 쓰기 시점의 stale 갱신이 누락되거나 지연돼도 사용자에게 최신인 것처럼 보이지 않게 한다.

### 3.6 `analysis_claims`와 `claim_evidence`

- 사용자에게 보인 claim 단위 텍스트, claim type, confidence/limitation, verification status를 저장한다.
- 각 심리학적 claim은 하나 이상의 active Evidence Card version과 연결한다. 연결에는 당시 card version과 content hash를 보존한다.
- observation claim은 diary/stat snapshot에 연결하고 연구 citation을 가장하지 않는다.
- 카드가 `retired`(정정·철회)되면 그 version을 인용한 기존 분석에 `evidence_retired` 표시를 소급 적용한다(결함 I-18). 기존 출력 문장을 다시 쓰지는 않지만 UI는 해당 해석을 "근거가 철회됨"으로 표시하고 재분석을 권한다.

### 3.7 `idempotency_records`

- `(owner_key, operation, idempotency_key)` unique.
- request hash, response status/reference, expiry를 저장한다.
- 같은 키에 다른 request hash가 오면 `409`로 거부한다.

### 3.8 `ai_jobs` (후행 단계, D-032)

| 필드 | 계약 |
| --- | --- |
| `id`, `owner_key` | job 소유권 |
| `kind` | `journal_turn | analysis_generate | analysis_verify` |
| `status` | `pending | leased | done | failed | expired` |
| `payload_json` | 그 작업에 필요한 최소 입력(현재 draft, 서명 검증된 최근 턴 또는 통계 snapshot). `done/failed/expired` 전환 시 NULL로 지운다 |
| `result_json` | worker가 되돌린 schema 검증 통과 출력만 |
| `model_id`, `prompt_version`, `schema_version` | 재현 metadata(D-031) |
| `lease_until`, `attempts` | worker lease 만료 시각과 재시도 횟수(상한 2) |
| `created_at`, `updated_at`, `expires_at` | UTC. `expires_at` 경과 시 `expired` |

- lease는 `UPDATE ai_jobs SET status='leased', lease_until=? WHERE id=? AND status='pending'`처럼 조건부 statement로만 획득한다(D-024).
- 결과 반영은 job이 `leased`이고 lease가 유효할 때만 허용하며, 결과의 `draft_patch`는 별도 사용자 확인 없이는 diary에 적용하지 않는다.
- 일기 원문은 payload에 그 턴에 필요한 범위만 들어가고, 완료 후 남지 않는다. worker 로그에도 payload를 남기지 않는다.

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
없음 ──첫 입력──> draft ──완료조건 통과──> completed ──편집 저장(완료조건 재검사)──> completed
                     ^                         |
                     |────명시적 완료 취소─────|

draft/completed ──사용자 확인──> hard deleted
completed ──revision 변경──> 기존 analysis stale
```

completed 기록을 편집해도 상태는 completed로 유지한다(D-023). 편집 저장은 완료조건을 다시 검사하며 미충족이면 저장을 거부하고 상태를 바꾸지 않는다. draft로 돌아가는 유일한 경로는 사용자의 명시적 "완료 취소"이며, 자동 저장이나 편집 중 상태로는 draft가 되지 않는다. 완료 취소를 허용하더라도 `first_completed_at/local_date`는 지우지 않는다. 삭제 후 같은 날짜에 새 일기를 만들 수 있지만 새 ID와 새 audit event를 가진다.

## 6. 임시저장과 AI 대화

- 서버에는 구조화 draft만 저장한다. AI와 주고받은 전체 대화 transcript는 기본적으로 영구 저장하지 않는다.
- 현재 요청을 처리하는 데 필요한 최근 턴은 메모리/요청 범위에서만 사용하고 응답 후 폐기한다.
- 턴 계약(결함 I-11): 클라이언트가 전송하는 이전 assistant 턴은 신뢰하지 않는다. 서버는 응답마다 `(draft_id, revision, turn_index, assistant_message)`에 대한 HMAC `turn_token`을 발급하고, 다음 요청에 포함된 이전 턴은 token이 일치할 때만 문맥으로 사용한다. 불일치·누락 턴은 폐기하고 현재 사용자 발화와 구조화 draft만으로 응답한다. 문맥 턴 수와 총 길이에 상한을 둔다.
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
- diary, emotion, reflection, 연결 claim을 원자적 batch(또는 FK `ON DELETE CASCADE`)로 cascade 삭제한다(D-024). 부분 삭제가 관찰되면 차단 결함이다. 해당 snapshot의 분석은 제거하거나 재사용 불가 상태로 만든다.
- 로그에는 원문 없이 삭제 event와 결과만 남기고, DB/호스팅 백업의 실제 소거 지연은 개인정보 안내에 명시한다.

### 내보내기

- MVP는 UTF-8 `application/json` 한 파일이다.
- 최상위에 `schema_version`, `exported_at`, `timezone`, `diaries`, `analyses`(선택)를 둔다.
- 비밀값, 내부 owner key, raw model prompt, verifier 내부 판정 전문은 제외한다.
- JSON Schema로 자동 검증하고 재수입 가능 여부는 별도 범위다. CSV는 향후 기능이다.

### 보존

- 데이터는 Cloudflare D1에 있다(D-032). 저장 지역·암호화·공급자 보존 특성, 서버 로그, 모델 공급자 경로(Claude 구독, D-029)의 보존은 배포 전 공식 문서와 실제 설정으로 확인해 정책에 기록한다.
- 백업은 D1 Time Travel(무료 플랜 지원 범위 확인)과 PC worker가 주기적으로 내려받는 versioned export로 이중화한다. B-05에서 주기, 보관 위치, 백업본의 hard delete 반영 지연을 정하고 사용자 고지에 반영한다(결함 I-17). Time Travel은 삭제 후에도 보존 기간 동안 복구 가능하므로 "즉시 완전 삭제"로 표현하지 않는다.
- 확정할 수 없는 보존 특성은 “즉시 완전 삭제”로 약속하지 않는다.

## 9. 마이그레이션 원칙

- 모든 schema 변경은 순방향 migration과 검증 query를 가진다.
- 파괴적 migration 전 export/backup 방법과 rollback 또는 forward-fix 계획을 기록한다.
- 새 non-null 컬럼은 expand → backfill → validate → contract 순서로 적용한다.
- taxonomy와 analysis schema는 DB schema와 별도 version을 가진다.
- 실제 사용자 데이터로 migration을 시험하지 않고 합성 fixture와 복사본을 사용한다.
