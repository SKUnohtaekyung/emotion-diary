# 데이터 모델·무결성 명세

## 1. 책임

이 문서는 감정일기의 논리 데이터, 무결성, 날짜, 버전, 삭제·내보내기 계약의 정본이다. 실제 SQL과 마이그레이션은 이 계약을 보존해야 한다. 화면 표현은 [UX_SPEC.md](UX_SPEC.md), AI 전송 최소화는 [AI_RAG_SPEC.md](AI_RAG_SPEC.md)를 따른다.

기계 검증 시드는 [../schemas/diary-entry.schema.json](../schemas/diary-entry.schema.json)과 [../schemas/export.schema.json](../schemas/export.schema.json)에 있다. 문서와 schema가 충돌하면 이 문서를 기준으로 schema와 테스트를 함께 고친다.

## 2. 공통 규칙

- 모든 ID는 추측하기 어려운 UUID/ULID 계열을 사용한다.
- `owner_key`는 서버 인증 컨텍스트에서 생성하며 요청 body/query의 값을 받지 않는다.
- 시각은 DB에 UTC ISO-8601로 저장한다. 일기 귀속 날짜는 별도 `entry_date`(YYYY-MM-DD)와 당시 IANA `timezone`으로 저장한다.
- 클라이언트가 보낸 `timezone`은 서버의 IANA 목록으로 검증하고, `entry_date`는 그 timezone의 서버 현재 날짜와 대조해 미래 날짜를 거부한다. 클라이언트 timezone은 사용자 편의 값이지 권한·완료 판정의 근거가 아니다(결함 I-15).
- `entry_date`는 단순 캘린더 날짜가 아니라 owner의 `day_start_hour`(§3.4, 정수 0~6, 기본 4시)를 반영해 계산한다 — 그 timezone의 현재 시각이 `day_start_hour` 이전이면 전날을, 이후면 당일을 `entry_date`로 쓴다. 새 draft 생성, streak, 알림, 대시보드 기간 집계, 서버의 미래 날짜 검사가 모두 이 계산을 공유한다. `day_start_hour`를 바꿔도 이미 저장된 행의 `entry_date`는 소급 재계산하지 않는다(D-081).
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
- 새 행(첫 draft 생성)은 `entry_date`가 그 요청 시점에 서버가 계산한 오늘(위 §2의 `day_start_hour` 규칙)과 같을 때만 만들 수 있다 — 과거 `entry_date`로 새 행을 만드는 경로는 없다(D-082, D-002의 소급 작성 허용을 대체). 이미 존재하는 draft는 `entry_date`가 지난 뒤에도 기한 없이 이어 써서 completed로 전환할 수 있다.
- `status`는 `CHECK (status IN ('draft','completed'))`, completed 행은 `CHECK (status <> 'completed' OR (first_completed_at IS NOT NULL AND completed_at IS NOT NULL AND first_completed_local_date IS NOT NULL))`.
- 완료 전환은 저장소의 interactive transaction에 의존하지 않는다(D-024). D1(D-032)은 interactive transaction이 없고 `batch()` 원자 실행과 trigger를 제공하므로, 검사 조건은 statement 안에 두고 다중 statement는 batch로 묶는다. 서버는 사건·이유 nonblank, `diary_emotions` 1행 이상, 모든 `intensity` 1~10을 **하나의 조건부 UPDATE**로 검사한다. 예: `UPDATE diary_entries SET status='completed', revision=revision+1, ... WHERE id=? AND owner_key=? AND revision=? AND status='draft' AND trim(event_text)<>'' AND trim(reason_text)<>'' AND EXISTS (SELECT 1 FROM diary_emotions WHERE diary_id=diary_entries.id)`. 영향 행이 0이면 완료를 실패(409 revision 충돌 또는 422 완료조건 미충족)로 돌려주고 어떤 상태도 바꾸지 않는다. 검사와 갱신을 분리한 read-then-write는 TOCTOU 창이 있으므로 금지한다.
- completed 이후에는 마지막 감정 행 삭제나 사건·이유 blank 갱신을 trigger(`BEFORE DELETE ON diary_emotions` / `BEFORE UPDATE ON diary_entries`에서 `RAISE(ABORT)`) 또는 같은 조건을 포함한 조건부 statement로 차단한다. trigger 지원 여부는 B-04에서 확인하고, 미지원이면 조건부 statement만으로 같은 불변조건을 보장해야 한다.
- `entry_date`가 과거인 채로 나중에 completed로 전환된 행(그날 시작해 나중에 완료한 draft, D-082 ②)도 `first_completed_local_date`는 실제 작성 완료일이므로 과거 streak를 복구하지 않는다.

### 3.2 `diary_emotions`

| 필드 | 계약 |
| --- | --- |
| `id`, `diary_id` | PK/FK, diary hard delete 시 cascade |
| `category_code` | 9개(taxonomy v2, §4.1) 상위 감정의 안정 코드 |
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

- `owner_key`가 PK인 owner당 1행: `enabled`, `local_time`, `timezone`, `channel`, `permission_state`, `day_start_hour`, `updated_at`. 갱신은 upsert(`INSERT ... ON CONFLICT(owner_key) DO UPDATE`)로 재시도에 안전해야 한다.
- `day_start_hour`는 정수 0~6, 기본 4다. 이름은 reminder 전용처럼 보이지만 실제로는 owner의 하루 경계를 정하는 공용 설정이며, `entry_date` 계산(§2)·streak·대시보드 기간에도 같은 값을 쓴다. 값은 내보내기(§8)에 포함한다.
- MVP `channel`은 `in_app`; 플랫폼 검증 후에만 `web_push`를 허용한다.
- **owner 설정에 더해지는 두 가지**(D-112, 2026-10-14. 표는 아래 'owner_settings' 줄 — app-scaffold가 만들었다): ① **부를 이름** — owner당 하나, 12자 이하, 앞뒤 빈칸을 뺀 뒤 비어 있지 않아야 한다. 없으면 '처음 들어온 사람'으로 보고 이름을 묻는다(UX_SPEC §16). 내보내기에 넣을지는 정하지 않았다(넣으려면 `schemas/export.schema.json`을 같은 변경에서 고친다). ② **앱 잠금**(D-106) — 켜짐 여부, 서버 비밀값을 섞은 비밀번호 해시(HMAC — 평문·되돌릴 수 있는 형태로 저장하지 않는다. 네 자리라 느린 해시는 쓰지 않는다, ARCHITECTURE §6), 연속으로 틀린 횟수와 다시 받을 수 있는 시각(다섯 번 → 30초, 서버가 센다). 비밀번호 해시는 비밀값으로 다루어 내보내기·로그·API 응답에 넣지 않는다. 지금 잠겼는지는 여기가 아니라 세션마다 둔다(§3.10). 접근 열쇠로 로그인한 지 10분 안인 세션은 지금 비밀번호 없이 이 항목을 새로 정하거나 끌 수 있다('잊었어요' 길, D-112 ⑧ — 기록은 그대로). **모든 기록 지우기는 이 두 가지와 위의 owner 설정 행까지 지운다**(D-112 ⑩, §8).
- **`owner_settings`**(app-scaffold, 2026-10-14 — `app/migrations/0003_owner_settings.sql`, T3 A-10): `owner_key` PK(1~64자), `display_name`(NULL = 아직 없음, 1~12자 CHECK — 서버는 앞뒤 빈칸을 빼고 제어 문자를 거부한 뒤 코드 포인트로 센다), `app_lock_hash`(NULL = 잠금 꺼짐, 있으면 HMAC-SHA256 16진수 64자 CHECK — **켜짐 여부는 해시가 있는지로만 가른다**, 따로 둔 켜짐 칸과 어긋날 수 없게), `app_lock_fail_count`(0~5 CHECK), `app_lock_retry_at`(다시 받는 시각, UTC), `created_at`, `updated_at`. 위 `reminder_settings`와 따로 둔 것은 `reminder_settings`가 `data-foundation`의 표이기 때문이다 — 전체 삭제는 두 표를 함께 지운다. 틀린 횟수는 대조하기 전에 시도 한 번을 먼저 예약한다(조건부 `UPDATE … RETURNING` — 한꺼번에 보낸 요청으로 다섯 번을 넘겨 맞혀 볼 수 없다, ARCHITECTURE §11.7).
- 인앱 reminder 문구는 `enabled`가 true이고 현재 시각이 `local_time`을 지났으며, 오늘 `entry_date`에 completed diary도 진행 중인 draft(과거에 시작해 아직 끝나지 않은 것 포함)도 없을 때만 표시 대상이다. 진행 중인 draft가 있으면 reminder 대신 이어서 쓰기 표시를 UI가 보여준다(D-077, D-081).

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

### 3.9 `auth_failures` (D-032, ARCHITECTURE §6)

- 단일 행(`id=1` CHECK): `fail_count`, `window_start`, `locked_until`.
- 토큰 검증 실패 시 창(60초) 안이면 `fail_count+1`, 아니면 1로 초기화. 임계(10회) 도달 시 `locked_until`을 5분 뒤로 설정. 성공 시 0으로 초기화.
- `locked_until`이 미래이면 토큰이 맞아도 429와 `Retry-After`를 반환한다. 원문·토큰 값은 저장하지 않는다.
- 2026-09-02 원격 스파이크: 실패 10회 뒤 429, 잠금 중 올바른 토큰 429(`Retry-After: 300`), 카운터 초기화 후 200 확인. 배포 직후 첫 요청 1건이 이전 버전에서 처리된 것으로 보이는 off-by-one 관찰(전파 지연).
- 앱 뼈대(2026-10-14, `app/migrations/0001_auth_failures.sql`): 위 계약 그대로이고, 대조하기 **전에** 시도 한 번을 예약한다 — 창 안에서 이미 10번이면 대조하지 않고 429. 한꺼번에 보낸 요청으로 창의 한도를 넘겨 맞혀 보지 못한다(ARCHITECTURE §11.7, 서버 시험 `app/test/worker/session.test.ts`).

### 3.10 세션 기록 (D-112, ARCHITECTURE §6)

2026-10-14 TASK-MOBILE T2에서 더한 논리 계약이다. 스파이크의 세션은 서버 기록 없이 서명만으로 검증했고 이 표는 스파이크로 확인하지 않았다. **표는 `sessions`**(app-scaffold, 2026-10-14 — `app/migrations/0002_sessions.sql`, T3 A-10): `id`(세션 번호 — 16바이트 무작위 base64url, PK), `subject`(주체 = owner_key), `key_login_at`(열쇠로 로그인한 시각), `issued_at`(마지막 발급), `last_active_at`(마지막 활동), `locked`(0/1 CHECK), 색인 `subject`·`issued_at`. 계약은 서버 시험(로컬 D1)으로 확인했다(EVAL_PLAN F-22·F-23 — `app/test/worker/`). 개발용 건물의 원격 확인은 TASK-MOBILE T3 5단계다.

- 로그인(접근 열쇠 대조 성공)마다 한 행: 세션 번호(무작위 — cookie에 서명과 함께 실린다), 주체, 열쇠로 로그인한 시각, 마지막 발급 시각, 마지막 활동 시각, 잠김 여부.
- 요청마다 서명이 맞아도 이 행이 없으면 401이다. 로그아웃은 이 행을 지운다(지운 cookie의 사본으로 다시 들어올 수 없다). 모든 기기의 로그인을 끊을 때는 행을 전부 지운다.
- 마지막 발급에서 30일이 지난 행은 거부하고 지운다(D-112 ①). 하루가 넘은 유효한 요청에서 마지막 발급 시각을 고친다(연장).
- **정리**: 로그인에 성공할 때마다 기한이 지난 행을 함께 지운다(다시 쓰지 않는 기기의 행이 끝없이 남지 않게). 이미 세션 cookie가 있는 기기에서 다시 로그인하면 그 옛 행을 지우고 새 행을 만든다. **모든 기록 지우기**는 지금 이 세션 말고 다른 세션의 행을 모두 지우고(다른 기기는 로그아웃된다) 지금 세션의 마지막 활동 시각을 새로 시작한다(D-112 ⑩의 세부 — 에이전트가 정함).
- 잠김 여부는 세션마다다(D-112 ③). 앱 잠금이 켜져 있고 마지막 활동(화면이 보이는 동안 1분마다 보내는 신호 포함, ARCHITECTURE §6) 뒤 5분이 넘었으면 잠긴 것으로 본다. 화면의 잠금 요청은 이 값을 '잠김'으로만 바꾼다. 풀기는 비밀번호 대조로만 한다.
- 행에는 접근 열쇠·비밀번호·일기 내용을 두지 않는다. 마지막 활동 시각은 잠금 판정에만 쓰고 사용 기록으로 분석하지 않는다.
- 매 요청이 이 행을 읽는다(D1 읽기 — 하루 500만 행 한도 안이다). 마지막 활동 시각은 1분 단위로 묶어 쓴다(같은 분 안의 요청은 다시 쓰지 않는다 — 판정 오차 1분. 화면을 켜 둔 한 시간에 약 60행 쓰기로 하루 10만 행 한도 안이다).

### 3.11 `client_errors` (개발용 건물에서만 채워진다 — D-113 ②, D-115 ⑤)

- 화면 오류 보고(ARCHITECTURE §11.5). `app/migrations/0004_client_errors.sql`. 칸은 `id`, `created_at`, `kind`(`error`·`unhandledrejection`·`api` CHECK), `name`(오류 이름 1~40자), `source`(파일 경로 — query·`#` 없음, 1~120자), `line`, `col`, `build`(빌드 번호), `route`(화면 이름 — query 없음). **메시지·stack·입력값을 담는 칸은 없다.** 받는 모양은 서버와 화면이 같은 검사(`app/shared/dev.ts`)로 확인하고 칸이 더 있으면 400이다.
- 최근 200행만 남긴다(넣을 때마다 오래된 행을 지운다). 개인 데이터가 아니므로 내보내기·전체 삭제 대상이 아니다.
- 운영에도 빈 표로 생긴다 — 두 환경의 스키마를 같게 두려고. 운영 묶음에는 이 표에 쓰는 경로가 코드째 없다(빌드 검사, ARCHITECTURE §11.2).

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

### 4.1 v1 → v2 `emotion_code` 마이그레이션 규칙 (D-038, D-022)

taxonomy v2에서 계열이 7개에서 **9개**가 되고(`공포`·`혐오` 신설), `바램`이 `희망`으로 개명됐다. 이미 저장된 일기를 깨지 않는 규칙은 다음과 같다.

1. **`category_code`는 표시 라벨과 독립이다.** `바램`→`희망` 개명은 `category_code`(`wish`)를 바꾸지 않으므로 **어떤 `emotion_code`도 바뀌지 않는다.** taxonomy `version`과 기록의 snapshot label만 갱신한다. 색 값도 바뀌지 않는다.
2. **계열 간 이동만 code가 바뀐다.** 예: 슬픔에 있던 `두려운`이 공포로 가면 `sadness-*` → `fear-*`. 오염·역겨움 어휘가 미움에서 혐오로 가면 `hate-*` → `disgust-*`.
3. **기존 기록을 소급해서 고쳐 쓰지 않는다.** 저장된 `emotion_code`는 그대로 두고, `data/taxonomy/v1-to-v2.json`을 **읽기 시점 별칭 표**로 사용한다. 소급 UPDATE는 하지 않는다(D-024의 원자성 원칙과 재시도 안전성).
4. **표시는 기록 시점의 snapshot label을 따른다.** 과거 기록을 열었을 때 그때 고른 표기가 보여야 한다. v2 라벨로 덮어쓰지 않는다.
5. **통계·분석은 v2 code로 정규화한 뒤 집계한다.** 같은 감정이 v1·v2 code로 나뉘어 두 번 세어지면 안 된다(PR-012 결정론적 대시보드).
6. **매핑표에 없는 v1 code는 오류로 처리한다.** v1의 모든 항목이 `keep`·`move`·`rename`·`drop` 중 하나로 처리되어 **누락 0**인 것이 T4 완료 기준이다.
7. `drop`된 항목은 code를 재사용하지 않는다. 새 항목에 같은 slug를 붙이더라도 code는 새로 발급한다.

`emotion_code` 형식은 D-022 그대로 `<category_code>-<slug>`이며, 카테고리 간 같은 한글 label이 서로 다른 code인 것도 그대로다.

### 4.2 v2 파일과 provenance 필드 (D-038, D-040)

taxonomy v2는 3개의 versioned JSON 파일로 구성되며, `schemas/taxonomy.schema.json`(strict schema, `additionalProperties: false`)이 각 파일 형태를 강제한다. `scripts/check-taxonomy.mjs`가 구조와 등급 도출 규칙(D-040)을 함께 검사하고 `scripts/verify.mjs`(quick/full)에 연결돼 있다. `data/taxonomy/`가 없으면 두 검사기 모두 pending으로 통과한다.

| 파일 | 내용 |
| --- | --- |
| [`../data/taxonomy/v1.json`](../data/taxonomy/v1.json) | 원자료 전사본(PR-004 아카이브). provenance 필드 없음 |
| [`../data/taxonomy/v2.json`](../data/taxonomy/v2.json) | 문헌 근거를 붙인 정본. 항목·계열별 provenance 포함 |
| [`../data/taxonomy/v1-to-v2.json`](../data/taxonomy/v1-to-v2.json) | v1→v2 마이그레이션 매핑표(§4.1) |

v2 항목(`categories[].emotions[]`) 필드:

- `source` — `raw`(v1 원자료) | `literature`(문헌 발굴) | `korean_lexicon`(한국어 사전·어휘 자료)
- `evidence_level` — `L1`(전문 확인) | `L2`(초록 확인) | `L3`(2차 경유) | `L4`(근거 없음)
- `verification` — `V1`(writer가 원문 URI를 직접 열어 대조) | `V2`(조사자 보고만)
- `evidence_grade` — **파생 필드.** writer가 매기지 않고 `(verification, evidence_level)`에서 기계적으로 결정된다(D-040): `V1×L1=A`, `V1×L2=B+`, `V2×L1=B`, 나머지 `C`. 예외로 `source=raw`이고 `evidence_level=L4`인 항목(v1을 그대로 유지)은 `B`다 — 유지는 주장이 아니라는 PR-004 논리이며, `v1-to-v2.json`의 매핑 `action`이 실제로 `keep`일 때만 인정된다
- `evidence_ref` — `evidence_catalog`의 키(예: `A-1`)를 가리키는 근거 참조
- `level_downgrade_reason` — 이 항목의 `evidence_level`이 `evidence_catalog`가 그 출처에 선언한 확인 수준보다 약할 때(정당한 하향) 그 사유. 항목은 `evidence_catalog`보다 강한 수준을 주장할 수 없다(천장 규칙)
- `also_in` — D-022 복수 배치. 같은 한글 라벨이 다른 계열에도 있을 때 그 계열의 `emotion_code`

v2 계열(`categories[]`) 필드:

- `boundary_ko` — 계열 경계 한 문장(제품 운영 정의이며 문헌이 그어 준 경계가 아님)
- `category_evidence_refs` — §7.1(B) 독립 문헌 참조 목록
- `category_grade` — **파생 필드.** `category_evidence_refs`를 `evidence_catalog`로 등급화해 강한 순서(A>B+>B>C)로 정렬한 뒤 **두 번째로 강한 등급**을 쓴다(독립 문헌 2편 요건이 계열의 실질 강도를 결정한다는 판단)
- `shortfall_note_ko` — `category_evidence_refs`가 2편 미만일 때 그 사실과 존치 근거(숨기지 않는다)

v2 루트 필드:

- `evidence_catalog` — 출처(`evidence_ref`)마다 실제 확인 수준(`evidence_level`, `verification`)을 **한 번만** 선언하는 표. 항목·계열은 이 값을 베낄 뿐이며 이보다 강하게 주장할 수 없다
- `fulltext_sources` — 전문(full text)을 실제로 확보한 `evidence_ref` 목록. `evidence_catalog`에서 `evidence_level: L1`인 항목 집합과 정확히 일치해야 한다
- `scale_report` — §7.2-4(TASK-TAXONOMY) 규모 보고. v1 대비 2배를 넘거나(신설 계열은 발굴>이동) 임계를 넘은 계열은 `acknowledged_categories`에 기록돼야 검사를 통과한다 — "사용자에게 알린다"는 절차를 기계로 강제하는 필드

등급 도출 규칙과 교차 검사의 전체 근거는 D-040과 `tasks/TASK-TAXONOMY-PLAN-V2.md`를 따른다.

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
- 예외: 서버 저장이 실패하거나 연결이 끊기면 클라이언트는 **그 브라우저 탭이 열려 있는 동안만** 구조화 draft를 `sessionStorage`에 임시 보관해 재시도·새로고침 복구에 쓴다. 탭을 닫거나 서버 저장에 성공하면 즉시 지운다. 이 보관은 tab 수명으로 한정되므로 위 장기 저장 금지와 충돌하지 않는다(D-082 ④).
- **이 예외는 보조 수단이고 쓰던 글을 지키는 기본은 서버 임시저장이다**(D-111, RK-034). 1차 환경인 홈 화면 웹앱은 바깥 링크·파일 미리보기에서 돌아올 때 화면이 통째로 새로 열릴 수 있고(2026-10-14 실기기), 그때 화면 쪽 기억이 남는다고 기대하지 않는다. 클라이언트는 입력이 멈출 때마다 구조화 draft를 서버에 저장하고, 새로 열리면 서버의 draft로 쓰던 단계를 다시 세운다. 홈 화면 앱에서 `sessionStorage`가 새로 열림 뒤에도 남는지는 확인하지 않았다.
- 위 탭 수명 예외 말고 기기에 남겨도 되는 것은 일기 내용이 아닌 화면 상태뿐이다(돌아갈 화면 주소, 설치 안내를 닫았는지 같은 것). 접근 열쇠와 앱 잠금 비밀번호는 어떤 브라우저 저장소에도 두지 않고, 일기 원문은 위 탭 수명 예외 말고는 두지 않는다(로그인은 서버가 심는 HttpOnly cookie다 — ARCHITECTURE §6).

## 7. 대시보드 계산 계약

- 기간은 사용자의 현재 timezone 기준 `entry_date`로 선택한다.
- 감정 빈도: 완료 diary의 `diary_emotions` 행 수.
- 크기(강도) 추세와 평균은 **계열마다 따로** 계산한다. 서로 다른 계열을 섞은 단일 평균·단일 추세는 두지 않는다(D-086) — 이전에 있던 "카테고리 비중"(선택된 세부 감정 수의 category별 집계, 막대 표시)은 D-064가 그 화면에서 막대 자체를 빼며 폐지됐고, 아래 "친구와의 친밀도"가 그 자리의 계열 단위 지표를 대신한다.
- 계열별 날 단위 평균: 그 계열을 고른 날마다 그날 선택된 그 계열 `diary_emotions` 행들의 `intensity` 산술평균을 하루 값으로 삼는다. 기간 평균은 그 하루 값들을 다시 평균해 낸다(세부 감정을 많이 고른 날이 더 무겁게 반영되지 않는다). 표본 수 `n`은 그 계열을 고른 날 수이며 `n`<3이면 평균을 반환하지 않는다. 최솟값·최댓값(범위)을 함께 제공한다.
- 계열별 추세(7/30일): 위 하루 값을 날짜순으로 이어 계열마다 따로 낸다(화면에서는 통계 친구 상세의 큰 차트 하나, 바로 앞 같은 길이 기간을 옅게 겹친다 — D-091 ②). 기록 없는 날은 0이 아니라 missing이라 선이 끊긴다.
- 기간 비교: 바로 앞 같은 길이의 기간과 비교할 때는 두 기간 모두 `n`≥3이고, 평균 차이가 1.0 이상이면서 Welch t-test 95% 신뢰수준을 만족할 때만 `높음`/`낮음`을 반환하고, 그렇지 않으면 `비슷함`을 반환한다. 계산 결과는 방향·수치·판정 문자열까지이며 색·강조 같은 표현은 UX_SPEC 몫이다(D-086).
- 작성 streak: `first_completed_local_date`의 연속 날짜. backdated `entry_date`는 과거 streak를 채우지 않는다.
- 현재 streak는 오늘 또는 어제까지 이어진 연속 `first_completed_local_date`로 정의하고 timezone 변경 경계를 테스트한다.
- 친구와의 친밀도(D-064): 기간 안의 **완료 diary가 있는 날** 중 그 계열(친구)의 세부 감정이 하나라도 선택된 날의 **비율**이다. 분모는 그 기간에 완료 diary가 있는 서로 다른 `entry_date` 수(하루 한 기록이라 diary 수와 같다), 분자는 그중 해당 category의 `diary_emotions` 행이 있는 날 수다. 함께한 날 수를 함께 제공하고, 분모가 5일 미만이면 친구별 값을 계산해 내보내지 않고 "기록이 더 필요함"만 돌려준다(UX_SPEC §9). 이 값은 단계·점수가 아니라 비율이며 순위 문장·레벨을 만들지 않는다.

계산 함수는 모델이 아니라 순수 코드/SQL로 만들고 같은 snapshot에서 재현 가능해야 한다.

## 8. 삭제·내보내기·보존

### 삭제

- 기록 삭제는 사용자 확인 후 즉시 영구 삭제하는 MVP 계약이다. 휴지통/복구를 암시하지 않는다.
- **모든 기록 지우기**(D-112 ⑤⑩)는 owner의 모든 diary와 종속 데이터, 분석, 부를 이름·앱 잠금·알림·하루 기준 시각 같은 owner 설정을 지워 처음 상태로 돌린다. 접근 열쇠(서버 비밀값)와 지금 기기의 세션은 그대로라 같은 기기에서 다시 새로 시작할 수 있다(다른 기기의 세션은 지운다 — §3.10). 앱 잠금을 켠 owner는 확인 문구에 더해 비밀번호가 맞아야 한다(서버가 확인). 복구용 사본에 남는 기간은 아래 '보존'과 같다.
- diary, emotion, reflection, 연결 claim을 원자적 batch(또는 FK `ON DELETE CASCADE`)로 cascade 삭제한다(D-024). 부분 삭제가 관찰되면 차단 결함이다. 해당 snapshot의 분석은 제거하거나 재사용 불가 상태로 만든다.
- 삭제 순서(2026-09-02 로컬 D1 스파이크 발견): **부모 `diary_entries`를 먼저 지우고 FK cascade로 자식을 지운다.** 자식 `diary_emotions`를 먼저 지우면 completed 보호 trigger가 마지막 감정 행 삭제를 막는다. 부모 삭제 시 cascade는 trigger와 충돌하지 않았다(고아 0). `PRAGMA foreign_keys`가 1인지 배포 환경에서 재확인한다.
- `meta.changes`는 cascade/trigger가 개입한 DELETE에서 실제 부모 행 수와 다를 수 있다(스파이크에서 부모 1행 삭제에 2 반환). 삭제 성공 판정은 changes 값이 아니라 삭제 후 SELECT(부모 0행·고아 0행)로 한다. 완료 전환의 조건부 UPDATE는 RAISE 전용 trigger만 있어 changes 0/1 판정이 그대로 유효했다.
- 로그에는 원문 없이 삭제 event와 결과만 남기고, DB/호스팅 백업의 실제 소거 지연은 개인정보 안내에 명시한다.

### 내보내기

- MVP는 UTF-8 `application/json` 한 파일이다.
- 최상위에 `schemaVersion`, `exportedAt`, `timezone`, `dayStartHour`(§3.4의 `day_start_hour`, 0~6 — D-081 ②), `diaries`, `analyses`(선택)를 둔다. 이 문서의 표와 SQL 계약은 저장 컬럼 이름(snake_case)으로 적고, 내보내기 파일과 API의 JSON 키는 [../schemas/export.schema.json](../schemas/export.schema.json)·[../schemas/diary-entry.schema.json](../schemas/diary-entry.schema.json)의 camelCase를 따른다. 같은 필드의 두 표기는 기계적으로 대응한다(`entry_date` ↔ `entryDate`).
- 비밀값, 내부 owner key, raw model prompt, verifier 내부 판정 전문은 제외한다.
- JSON Schema로 자동 검증하고 재수입 가능 여부는 별도 범위다. CSV는 향후 기능이다.

### 보존

- 데이터는 Cloudflare D1에 있다(D-032). 저장 지역·암호화·공급자 보존 특성, 서버 로그, 모델 공급자 경로(Claude 구독, D-029)의 보존은 배포 전 공식 문서와 실제 설정으로 확인해 정책에 기록한다. 2026-10-13~14 확인(근거 `tasks/spike/2026-10-13/PLAN.md`): 저장 지역은 APAC(힌트이며 보장이 아니다), 저장 시 AES-256, 서버 실시간 기록에는 요청 본문이 없고 cookie·authorization은 가려져 남는다. Claude 구독 경로에 보낸 내용은 계정의 '모델 개선' 설정을 끄면 30일, 켜면 5년 보존된다(D-110 ① — 끈 상태에서만 쓴다).
- 백업은 두 겹이다(D-109, 2026-10-13 B-05 판정). **1차** D1 Time Travel — 무료 7일, 항상 켜져 있고 DB 전체를 그 시점으로 되돌린다(행 단위가 아니다). 복구는 직전 지점을 돌려주므로 되돌릴 수 있다(스파이크에서 지운 행 복구 → 복구 되돌림 확인). **2차** 본인 PC 백업 — PC worker가 **하루 1번**(PC가 켜져 있을 때, 꺼져 있던 날은 건너뛴다) worker 전용 경로로 내보내기와 같은 형식의 파일을 받아 날짜 이름으로 저장하고 **30일** 지난 파일을 지운다. 보관 위치는 PC의 지정 폴더 한 곳이며 클라우드 동기화 폴더에는 두지 않는다.
- 복구 순서: 7일 안의 사고는 Time Travel로 직전 시점으로 되돌리고 그 뒤에 쓴 기록은 PC 백업에서 다시 넣는다. 7일이 넘은 사고는 PC 백업 파일에서 다시 넣는다. **다시 넣는 도구(재수입)는 백업과 한 쌍으로 `data-foundation`에서 만든다** — 도구가 없으면 백업은 복구 수단이 아니다.
- 지운 기록이 남는 곳과 기간: 앱·서버 DB는 바로 사라짐 / Time Travel로 되살릴 수 있는 기간 7일(그 뒤 공급자 쪽에서 물리적으로 지워지는 시점은 확인하지 못했다) / PC 백업에 30일(PC가 꺼져 있는 동안은 정리도 멈춰 더 남을 수 있다) / 사용자가 직접 내보낸 파일은 사용자가 지울 때까지 / AI 대화 작성에 보낸 내용은 Anthropic에 30일(D-110 ①). 고지는 이 다섯 곳을 빠뜨리지 않고, "30일이 지나면 지워진다"처럼 단정하지 않는다. 문구 초안은 `tasks/spike/2026-10-13/PLAN.md` D-5(화면 반영 전 확정). Time Travel은 삭제 후에도 보존 기간 동안 복구 가능하므로 "즉시 완전 삭제"로 표현하지 않는다(결함 I-17).
- 확정할 수 없는 보존 특성은 “즉시 완전 삭제”로 약속하지 않는다.

## 9. 마이그레이션 원칙

- 모든 schema 변경은 순방향 migration과 검증 query를 가진다.
- 파괴적 migration 전 export/backup 방법과 rollback 또는 forward-fix 계획을 기록한다.
- 새 non-null 컬럼은 expand → backfill → validate → contract 순서로 적용한다.
- taxonomy와 analysis schema는 DB schema와 별도 version을 가진다.
- 실제 사용자 데이터로 migration을 시험하지 않고 합성 fixture와 복사본을 사용한다.
- 파일은 `app/migrations/NNNN_이름.sql`(번호 순서로 적용)이고 `wrangler d1 migrations apply`가 적용 기록(`d1_migrations` 표)을 남긴다. 원격 적용은 [DEPLOY.md](DEPLOY.md) §3·§4, 서버 시험은 같은 파일을 로컬 D1에 적용해 돈다(`app/test/worker/harness.ts`). 2026-10-14 app-scaffold: `0001_auth_failures`·`0002_sessions`·`0003_owner_settings`·`0004_client_errors`. diary 표는 `data-foundation`이 `0005`부터 더한다.
