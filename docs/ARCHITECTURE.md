# 시스템 아키텍처 명세

## 1. 책임과 상태

이 문서는 시스템 구성요소, 신뢰 경계, API와 배포 구성을 정한다. 제품 범위는 [../PRD.md](../PRD.md), 데이터 불변조건은 [DATA_MODEL.md](DATA_MODEL.md), AI 내부 단계는 [AI_RAG_SPEC.md](AI_RAG_SPEC.md), 안전 판단은 [SAFETY_POLICY.md](SAFETY_POLICY.md)가 정본이다.

이 문서의 호스팅·접근 경계·D1 세부는 2026-09-02와 2026-10-13~14 스파이크에서 **연습용 서버로 확인한 구성**이다(§10, 본인 1명 전제 — D-108). **예외 — 2026-10-14에 더한 설계라 스파이크로 확인하지 않은 것**: 서버의 세션 기록, 로그인 연장, 세션별 앱 잠금과 423·10분 규칙·화면 신호(§6). 모델 접근 경로는 보류 2건이 남은 가설이다(B-06). 스파이크는 실제 앱이 아니므로 Phase 1에서 같은 계약을 실제 앱으로 다시 확인하고, 확인하지 않은 프레임워크나 API 이름을 코드에 고정하지 않는다. 이 문서에서 "실측"은 그 스파이크의 실기기·원격 결과, "공식 문서"는 적힌 날짜에 확인한 공급자 문서, "규격 판단"은 재 보지 않고 규격에서 끌어낸 것을 뜻한다.

사용자 결정(2026-09-02 D-018, D-019, D-021, D-029, D-031, D-032 / 2026-10-14 D-108, D-111, D-112): 배포는 직접 작성한 백엔드를 무료 클라우드에 올리는 구성이다 — **Cloudflare Worker 하나가 앱 화면(정적 파일)과 `/api/*`를 같은 주소에서 내고**(유일한 진입점), DB는 D1(SQLite 호환)이다. 모바일은 설치형 홈 화면 웹앱이다. 로그인은 접근 열쇠(서버 접근 토큰)로 받는 cookie 하나다. 제한 MVP(직접 작성+결정론적 대시보드)를 먼저 배포하고 AI 대화·RAG는 후행 단계다. 유료 API는 사용하지 않으며 AI는 본인 PC의 worker가 백엔드 작업 큐를 outbound로 가져가 Claude 구독 로그인으로 `claude -p`를 호출하는 경로만 쓴다. 본인 1명 전용이다. 이전 후보 ChatGPT Sites(D-006), PC 자체 호스팅(D-030), 화면을 Cloudflare Pages에 따로 두는 분리 구성(D-032의 그 부분 — D-111이 교정)은 superseded다.

**2026-10-15 교정(D-116·D-117·D-120·D-121)**: 짓는 순서는 '오늘 한 편'을 휴대폰까지 먼저이고, 첫 사용은 본인 사용 시작과 공개 출시로 나뉜다. AI 대화 작성은 직접 쓰기를 30일 써 본 뒤 지을지 정하고, 짓게 되면 **서버(Worker)가 Claude API를 직접 부르는 경로**(사용자 요금제 Max에 포함된 월 API 크레딧 — 추가 지출 0이라 D-019 안)가 기본이다. 위의 본인 PC worker + `claude -p` 경로는 크레딧이 없어질 때 돌아갈 **대체 경로**로 남는다(§4.4·§4.6). 근거 분석은 60일 뒤 지을지 정한다.

## 2. 기준 아키텍처 (D-111)

```text
iPhone 홈 화면 웹앱(1차) / Safari·PC 브라우저
                 |
                 |  https://<앱 주소>  — 주소(origin) 하나
                 v
   +------------------------------------------+
   |        Cloudflare Worker 하나            |
   |  /api/*    → Worker 코드(항상 먼저)      |
   |              로그인 cookie + CSRF 검사   |
   |  그 밖     → 정적 파일(앱 화면)          |
   +------------------------------------------+
        |                |            |
        v                v            v
     D1 DB          ai_jobs 큐     알림 어댑터
   (개인 일기)      (후행 단계 —    (인앱 우선)
                    지을지는 D-120)
                        |
              처리기(바꿔 끼움 — D-120)
              +- 기본: Worker → Claude API
              |   (Max 포함 월 크레딧, 추가 지출 0)
              `- 대체: 본인 PC AI worker → claude -p
                  (outbound 폴링/결과 반환, worker secret,
                   구독 로그인 — D-029·D-110)
                    |
                    v
          Psychology Evidence Store
          (후행 단계, D-018 — 하게 되면 카드 30~50장 파일, D-121)

관리 경로: 승인된 Evidence 수집 -> 카드 검수 -> 비활성 업로드
                                      -> 평가 -> 활성화
```

### 2.1 한 주소, Worker 하나

- **앱 화면과 API는 같은 주소(origin)에 있다.** Worker 하나가 정적 파일(앱 화면: HTML·CSS·JS·그림·글꼴·manifest)과 `/api/*`를 함께 낸다. 화면용 주소와 API용 주소를 나누지 않는다.
- **앱 주소**는 `workers.dev` 아래의 무료 주소 하나다(자체 도메인은 요금이 들어 쓰지 않는다 — D-019). 실제 주소는 저장소에 적지 않는다.
- **경로 규칙**: `/api/`로 시작하는 요청은 정적 파일보다 Worker 코드가 항상 먼저 받는다. 없는 API 경로가 앱 화면으로 떨어지면 안 된다 — 로그인 검사가 먼저라 로그인 전에는 401, 로그인 뒤에는 JSON 404다. 그 밖의 경로는 정적 파일을 주고, **파일이 없는 화면 경로에는 앱의 첫 화면 파일을 준다**(화면 주소를 경로로 쓰더라도 새로 열렸을 때 그 화면이 다시 서게 — 스파이크는 Static Assets의 single-page-application 설정으로 이렇게 했다). Cloudflare Workers Static Assets는 Worker를 먼저 태울 경로를 패턴으로 지정할 수 있다(`run_worker_first`, 공식 문서 2026-10-14). 설정 파일의 실제 값은 §11.2다(2026-10-14 공식 문서와 저장소 밖 실험으로 다시 확인).
- **정적 파일은 로그인 없이도 응답된다.** 그러므로 정적 파일에는 일기·설정·비밀값 같은 사용자 데이터를 넣지 않는다. 사용자 데이터는 전부 `/api/*`로만 나간다(§6).
- **같은 주소라서 얻는 것**: 로그인 cookie가 `SameSite=Lax`인 채로 화면의 API 요청에 그대로 실리고, CSRF 검사에서 브라우저가 보낸 `Sec-Fetch-Site: same-origin`을 확인할 수 있다. 실측(2026-10-13~14, iPhone iOS 26.5.2, 연습용 화면): Safari 본체와 홈 화면 앱 양쪽에서 로그인·저장·조회가 됐고 표식(custom header) 없는 저장 요청은 403으로 거부됐다(§10 B-02·B-03·B-08. 다른 출처에서 온 위조 요청의 거부는 PC·원격 검사로 확인했다). **변경 요청의 CSRF 규칙 전체는 §5에 있다** — custom header 필수가 기본이고 `Sec-Fetch-Site`·`Origin` 대조는 그 위의 겹이다.
- **분리 구성을 쓰지 않는 이유**: 처음 계획은 화면을 Cloudflare Pages에, API를 Workers에 따로 두는 것이었다. `pages.dev`와 `workers.dev`는 서로 다른 site로 취급되므로 `SameSite=Lax` cookie가 화면에서 API로 가는 요청에 실리지 않고, Safari는 제3자 cookie를 막는다. **이것은 규격에서 끌어낸 판단이고 분리 구성이 실패하는 것을 실제로 재 본 적은 없다** — 채택하지 않을 구성이라 재지 않았다(D-111). 스파이크의 모든 근거는 Worker 하나 구성에서 나왔다.
- **비용과 한도**: 정적 파일 요청은 무료이고 Worker를 먼저 타는 `/api/*`만 하루 10만 건 한도에 잡힌다(공식 문서 2026-10-13·14). **Worker 코드는 요청 하나에 CPU 10ms까지다** — 해시·서명 같은 계산을 가볍게 둔다(§6). D1은 읽기 하루 500만 행, 쓰기 하루 10만 행, DB당 500MB, 호출 한 번에 질의 50건까지다.
- **캐시와 새 버전**: 정적 파일의 기본 캐시는 매번 서버에 다시 확인하는 방식이다(`max-age=0, must-revalidate` + ETag, 공식 문서 2026-10-14). 앱을 다시 열면 새 화면을 받지만, **오래 열어 둔 앱은 옛 화면으로 새 서버를 부를 수 있다**(RK-037). service worker는 두지 않는다. 갱신을 알아차리는 방법은 §11.4(새 버전 띠 — 저절로 새로 고치지 않는다), 개발·운영 환경 분리는 §11.2다(D-115).

### 2.2 설치형 홈 화면 웹앱

- iPhone Safari에서 '홈 화면에 추가'로 설치한다. 개발자 계정·서명·Mac·앱 장터가 필요 없고, 서버에 올리는 것이 곧 업데이트다. 아이콘으로 열면 주소창 없는 앱 모드로 뜬다(실측 S-01).
- 설치 정보 파일(web app manifest)을 둔다: 표시 방식은 `standalone`, 시작 주소와 범위는 `/`, 아이콘. iOS 26은 manifest 없이도 홈 화면에 추가한 사이트를 웹 앱으로 열지만(공식 문서 2026-10-14) 이름·아이콘·시작 주소를 고정하려고 둔다. **시작 주소에는 접근 열쇠나 query를 싣지 않는다** — 홈 화면에 추가하면 그 순간의 주소가 아이콘에 저장된다(§6).
- service worker와 오프라인은 없다. 일기 원문을 기기에 오래 두지 않는다는 계약(DATA_MODEL §6)과 같은 방향이다. Web Push도 MVP가 아니다(§7, RK-004).
- 홈 화면 앱은 Safari와 **로그인·저장 공간이 따로다**(실측 S-01, Apple 공식 발표와 일치). Safari에서 로그인했어도 앱 안에서 한 번 더 로그인한다.
- 설치하지 않고 Safari나 PC 브라우저로 들어와도 같은 기능을 쓴다(D-112). 지금 홈 화면 앱으로 열렸는지는 화면 표시 방식으로 판정한다 — CSS `display-mode`가 `standalone` 또는 `fullscreen`이거나 `navigator.standalone`이 참(설치 앱에서 `standalone` 질의가 거짓·`fullscreen`이 참이라는 WebKit 버그 보고가 있어 넓혔다 — bugs.webkit.org 264218, 조사 2026-10-14, T3 A-13). **기기·OS 버전을 브라우저가 알려 주는 문자열로 판단하지 않는다** — iOS 26.5.2 기기가 'iOS 18.7'이라고 알렸다(실측).
- 홈 화면 앱에서 실기기로 드러난 동작과 그에 따른 화면 규칙은 §4.1과 [UX_SPEC.md](UX_SPEC.md) §16·§17에 있다. 2026-10-14에 더 본 것: 연습용 화면에서 12시간 넘게 지나도 로그인 유지(사용자 보고), 앱 뼈대(개발용 건물)에서 자판이 아래 고정 버튼을 가린다(UX_SPEC §17 규칙 9). 아직 보지 못한 것(실제 앱의 12시간 뒤 로그인 유지, 5분 떠났다 오기, 아이콘을 지웠다 다시 추가, '웹 앱으로 열기'를 끈 경우, 앱 전환 화면 가림, 암호 보관함 자동 입력, 화면 낭독기, Android)은 **미검증**이다 — 앱 뼈대의 실기기 확인은 사용자 결정으로 미뤘다(EVAL_PLAN §6 T-01~T-07).

### 2.3 그 밖의 구성

MVP는 위의 Worker 하나가 모든 API를 처리하고, 접근 열쇠로 받은 로그인 cookie로 접근을 제한하며, D1에 저장한다(D-032, D-111). 지금은 모델 호출 경로가 없다(AI는 후행 — 지을지는 실사용 30일 뒤, D-120). 짓게 되면 Worker가 Claude API를 직접 부르는 것이 기본이다 — API 키는 Workers secret에만 두고, 보내는 것은 §4.4·`AI_RAG_SPEC` §4의 최소 입력뿐이며, Max에 포함된 월 크레딧 안에서만 쓴다(추가 지출 0, D-019). 크레딧이 없어지면 `ai_jobs` 큐에 작업을 넣고 본인 PC의 worker가 가져가 `claude -p`로 처리하는 대체 경로(D-029)로 바꿔 끼운다. 추가 지출이 생기는 API 경로는 없다. 별도 Supabase나 agent framework는 기본 의존성이 아니다. 이 구성은 부트스트랩 스파이크를 통과했다(§10). 실제 앱에서 계약을 지키지 못하는 것으로 드러나면 동일한 계약을 만족하는 **무료** 비공개 호스팅/DB로 교체한다(D-021). 제한 MVP는 모델 접근 어댑터와 Evidence Store 없이 배포 가능해야 한다(D-018).

## 3. 신뢰 경계

| 경계 | 신뢰하지 않는 입력 | 서버가 해야 할 일 |
| --- | --- | --- |
| 브라우저 → 앱 | owner ID, 날짜, 상태, 분석 대상, 완료 여부 | 세션에서 owner를 결정하고 스키마/권한/날짜를 검증 |
| 앱 → D1 | 중복 요청, 오래된 revision, 부분 실패 | 조건부 statement/batch, unique constraint, optimistic concurrency, idempotency |
| PC worker → 앱 API | 위조된 worker, 오래된 lease, 변조된 결과 | worker secret(Bearer) 검증, job lease/만료, 결과 schema 재검증, 결과는 해당 job의 owner에게만 반영 |
| 앱 → PC worker | 큐 payload 과다, 처리 지연 | 최소 입력만 payload에 저장, 완료 후 payload 삭제, timeout 시 직접 작성 fallback |
| 앱 → 모델 접근 경로 | 일기 속 지시문, 과도한 원문, 모델 출력, 클라이언트가 보낸 이전 대화 턴 | 최소화, source-as-data, strict schema, 오류/거부/미완료 처리, 서명된 turn token만 문맥으로 사용(DATA_MODEL §6) |
| Evidence 수집 → Store | 악성 지시, 잘못된 출처, 권리 불명 | 인간 승인, 해시, 상태, provenance, prompt injection 격리 |
| 앱 → 사용자 | 진단성 주장, 무근거 해석, 위기 혼합 | Gate, Verifier, Safety Validator, 안전 대체 응답 |

서버 접근 토큰 해시와 그 해시에 섞는 HMAC salt, 세션 서명 비밀값, 앱 잠금 비밀번호 해시에 섞는 비밀값(§6), PC 백업 토큰의 SHA-256(`BACKUP_TOKEN_HASH`, 선택 — D-124), worker secret은 Cloudflare Workers secret(`wrangler secret`)으로, PC 백업 토큰 자체는 본인 PC의 Git 제외 파일(`work/deploy/<env>.BACKUP-TOKEN.txt`)로, PC worker의 API URL·worker secret은 본인 PC의 `.env`(Git 제외)로 관리한다. 클라이언트 번들, 저장소, 로그, `wrangler.toml`에 넣지 않는다. Claude 구독 자격 증명은 Claude Code가 관리하는 저장소에만 있으며 worker가 읽거나 복사하지 않는다.

## 4. 구성요소 계약

### 4.1 Client UI

- 모바일 우선 반응형 화면과 접근 가능한 폼을 제공한다.
- 로컬 상태는 사용성 보조일 뿐 정본이 아니다. 서버 응답의 `revision`과 상태를 따른다.
- 네트워크 재시도 시 같은 `Idempotency-Key`를 재사용한다.
- 다른 사용자 식별자나 내부 Evidence ID를 권한 결정 값으로 전송하지 않는다.

홈 화면 웹앱이 1차 환경이라 아래를 처음부터 지킨다(D-111, 실측 2026-10-13~14. 화면 쪽 규칙은 [UX_SPEC.md](UX_SPEC.md) §16·§17).

- **화면 이동은 뒤로 가기 기록(history)에 맞춘다.** 홈 화면 앱에는 브라우저의 뒤로 버튼이 없고, 화면 왼쪽 끝을 밀면 기록의 한 칸 뒤로 간다(실측 S-08 — 막을 수 없다고 전제한다). 화면마다 주소를 갖고, 하위 화면에는 화면 안의 뒤로 가기를 두며, 밀어서 뒤로 가도 화면 안의 뒤로 가기와 같은 결과가 나오게 한다. 작성 흐름을 떠날 때 기록을 되감는 규칙(D-082 ⑤)은 그대로다. 화면 주소는 시안과 같은 해시 `#/…`이고 기록 규칙은 화면 코드가 직접 지킨다(§11.3, D-115 ③).
- **화면은 언제든 통째로 새로 열릴 수 있다.** 바깥 링크와 파일 미리보기에서 돌아오는 구간에 앱 화면이 두 번 처음부터 다시 열렸다(실측 S-09, 원인 동작 미특정, 로그인은 유지 — RK-034). 화면 쪽 기억(메모리)이 사라져도 되게 만든다: 쓰던 글은 입력이 멈출 때마다 서버에 임시저장하고, 새로 열리면 서버의 상태(오늘 기록·쓰던 글·쓰던 단계)로 화면을 다시 세운다. 서버로 아직 보내지 못한 글만 기기 사본(`localStorage` `unsentDiaries`, DATA_MODEL §6, D-123)에 두었다가 서버가 받으면 지운다 — 보조 수단이다.
- **작성 흐름 안에 바깥으로 나가는 링크를 두지 않는다.** 바깥 링크는 앱 창 안의 Safari 창으로 열리고 화면의 버튼으로 돌아온다(실측 S-09, 공식 설명과 일치). 다른 화면의 바깥 링크(위기 안내의 연락처 출처 등)는 떠나기 전에 저장이 끝난 상태여야 한다. 전화·문자 링크는 바깥 링크가 아니다.
- **파일은 공유 창으로만 내보낸다.** `GET /api/export`의 응답을 화면 코드가 받아 파일로 만들고 사용자가 누른 그 동작 안에서 공유 창(`navigator.share({files})`)에 넘긴다(실측 S-05: '파일에 저장'까지 됨). 응답 주소를 링크로 직접 여는 방식은 쓰지 않는다 — 앱 화면이 파일 미리보기로 통째로 바뀌고 돌아갈 버튼이 없다(실측). 공유 창이 없는 브라우저(PC)에서는 파일 내려받기로 대신한다. 클립보드 복사는 내보내기 수단으로 쓰지 않는다(기기 사이에 클립보드를 나누는 기능이 켜져 있으면 다른 기기로 넘어갈 수 있다 — 확인한 것은 아니고 조심하는 쪽을 택했다).
- 기기·OS 버전 문자열로 기능을 가르지 않는다(§2.2). 기능이 있는지를 직접 물어 가른다.
- Mac이 없어 iPhone 화면 속 오류를 개발 도구로 볼 수 없다(RK-036). 화면에서 상태를 확인할 수단은 개발용 건물의 상태 칸과 오류 보고다(§11.5). 어떤 경우에도 일기 원문·접근 열쇠·비밀번호를 그 수단에 싣지 않는다. **화면 오류를 서버로 모으는 것은 개발용 서버에서만 한다**(D-113 ②) — 실제로 쓰는 배포(운영)에는 오류를 받는 경로를 두지 않고 화면에 오류 번호만 보인다.
- **앱을 떠나는 순간 화면을 덮는다**(잠금과 상관없이 — D-113 ①). 화면이 보이지 않게 되는 때 덮개를 그리고, 돌아왔을 때 잠기지 않았으면 걷는다. 덮개가 iPhone 앱 전환 화면의 스냅샷보다 먼저 반영되는지는 확인하지 않았다 — 공식 근거가 없고, 앱 전환 화면에 들어가기만 할 때는 이벤트가 오지 않는다는 WebKit 버그 보고가 있어(bugs.webkit.org 206213, 조사 2026-10-14) 덮지 못할 수 있다(RK-039). 실기기 T-03(EVAL_PLAN §6)이 유일한 근거다.

### 4.2 Application Server

- 인증된 요청에서 서버가 `owner_key`를 도출한다.
- 모든 diary CRUD, dashboard 집계, export, delete, AI orchestration의 유일한 진입점이다.
- 입력과 모델 출력에 런타임 schema validation을 적용한다.
- 모델 호출은 서버에서만 수행한다(대체 경로에서는 본인 PC worker). 추가 지출이 생기는 API는 사용하지 않으며(D-019·D-120) 모델 경로가 B-06에서 확인되기 전까지 AI 경로는 비활성이다 — 2026-10-15 D-120: AI 쓰기는 실사용 30일 뒤 지을지 정하고, 짓게 되면 기본은 서버 → Claude API(§4.4), `ai_jobs` 큐 + PC worker는 대체 경로(§4.6)다. 경로가 확인되면 그 경로의 데이터 보존·학습 사용 설정(`store: false`에 상당하는 통제)을 확인하고 기록한다.
- D-029/D-032 경로(D-120 뒤로는 대체 경로 — 기본인 서버 직통에서는 Worker가 Claude API를 부르고 같은 schema 검증을 거친다): 서버는 모델을 직접 호출하지 않고 `ai_jobs` 행을 만든 뒤 클라이언트에 job ID를 준다. 클라이언트는 결과를 폴링하고, 정해진 timeout(예: 20초) 안에 결과가 없으면 "AI 응답 불가, 직접 작성으로 계속"을 보여 준다. 실제 호출은 §4.6의 PC worker가 수행한다. 서버는 worker가 되돌린 `structured_output`을 다시 schema 검증하고 `result` 문자열은 신뢰하지 않는다.
- timeout, rate limit, bounded retry, idempotency, correlation ID, 사용자 안전 오류를 표준화한다.

### 4.3 Diary Database

- Cloudflare D1(SQLite 호환, D-032)이며 [DATA_MODEL.md](DATA_MODEL.md)의 논리 계약을 만족해야 한다. batch 원자성, CHECK/trigger 지원, Time Travel/export 백업은 B-04/B-05에서 확인했다(§10, 백업 절차 D-109).
- 한 owner의 한 local date에 활성 일기 하나만 허용한다.
- 대시보드는 완료된 최신 revision만 집계한다.
- 영구 삭제는 transaction으로 종속 데이터까지 제거한다.

### 4.4 AI Orchestrator

- 대화 구조화와 근거 기반 분석을 분리한다.
- 분석은 `plan → deterministic stats → search → gate → generate → verify → safety` 순서다.
- 단계별 입력/출력 schema와 상태를 저장하되, 불필요한 원문 대화는 저장하지 않는다.
- 자동 도구 루프는 허용된 도구, 최대 호출 수, 시간/비용 한도, 중단 조건을 갖는다.
- 이 구성요소는 후행 단계다(D-018). 지을지는 직접 쓰기 실사용 30일 뒤 정한다(D-120). 모델 접근 경로가 확인되지 않으면(B-06 fail/unknown) orchestrator 전체를 비활성화하고 직접 작성·대시보드는 이 구성요소 없이 동작·배포한다(D-019).
- **모델 접근(D-120)**: 짓게 되면 기본은 Worker가 Claude API를 직접 부르는 처리기다 — API 키는 Workers secret에만 두고, 사용자 요금제 Max에 포함된 월 API 크레딧 안에서만 쓴다(따로 산 크레딧·자동 충전은 쓰지 않는다 — 크레딧이 떨어지면 그 달은 AI만 멈춘다). 크레딧이 없어지면 §4.6의 PC worker 처리기로 바꿔 끼울 수 있게 `ai_jobs` 큐 + 처리기 모양으로 감싼다. 서버 직통 경로의 확인(B-06 재정의)은 짓기로 정한 뒤 한다.

### 4.5 Evidence Administration

- 일반 사용자 경로와 분리된 관리 작업이다.
- 한 Evidence Card를 MVP의 한 검색 파일로 만들어 file-level metadata filter의 한계를 피한다.
- `draft → reviewed → active → retired` 상태를 사용하며 `active`만 검색 대상이다.

### 4.6 PC AI Worker (후행 단계 — D-120 뒤로는 대체 경로)

- 2026-10-15 D-120: AI 쓰기를 짓게 되면 기본 처리기는 서버 직통(§4.4)이고, 이 PC worker는 크레딧이 없어질 때 돌아갈 대체 경로다. 아래 계약과 D-110의 운영 조건은 이 경로의 것이다.
- 본인 PC에서 도는 작은 Node 프로세스다. 주기적으로 `GET /api/ai-jobs/next`를 `Authorization: Bearer <worker secret>`으로 호출해 pending 작업을 lease하고, `claude -p --output-format json --json-schema <schema> --tools "" --max-turns 1 --model <D-031 모델>`을 subprocess로 실행한 뒤 `POST /api/ai-jobs/:id/result`로 되돌린다.
- inbound 포트를 열지 않는다. 사설망·터널·포트 포워딩이 필요 없다.
- 프로젝트 hooks/MCP가 섞이지 않도록 전용 작업 디렉터리에서 실행하고, `--bare`는 구독 인증을 지원하지 않으므로 쓰지 않는다. 동시 실행 1개, 호출 timeout, 실패 시 job `failed` 처리와 재시도 상한을 둔다.
- job payload에는 그 턴에 필요한 최소 입력(현재 draft, 서명 검증된 최근 턴)만 들어 있고, 완료·만료 시 서버가 payload를 지운다. worker는 일기 원문을 디스크에 남기지 않는다.
- PC가 꺼져 있으면 job은 `expired`가 되고 UI는 직접 작성 fallback을 보여 준다. 사용자 본인 1명 전용이며 다른 사용자에게 제공하지 않는다(D-029).

## 5. 논리 API 계약

실제 프레임워크 경로는 바뀔 수 있지만 의미는 유지한다.

| 작업 | 의미 | 핵심 보호 |
| --- | --- | --- |
| `POST /api/session/heartbeat` | 화면이 앞에 보이는 동안 1분마다 보내는 신호 — 앱 잠금의 '5분 넘게 떠나 있었는가'를 서버가 재는 근거(§6) | 로그인한 세션만, 본문 없음, 잠긴 세션에는 423(신호로 잠금이 풀리지 않는다) |
| `GET /api/session` | 로그인 전: '로그인 안 됨'과 배포 모드·빌드 번호·호환 단계만(새 버전 알림, §11.4). 로그인 뒤: 로그인됨, 앱 잠금을 켰는지, 이 세션이 지금 잠겼는지, 부를 이름이 있는지 | raw identity 최소화. **로그인하지 않은 요청에는 앱 잠금 여부를 포함해 owner의 어떤 설정도 알려 주지 않는다** |
| `POST /api/session` | 접근 열쇠를 요청 본문으로 받아 대조하고 로그인 cookie 발급(§6) | 열쇠는 본문으로만(주소 금지), 실패 잠금, 응답·로그에 열쇠 없음 |
| `DELETE /api/session` | 로그아웃 — 이 기기의 로그인 cookie를 지운다 | CSRF |
| `PUT /api/app-lock`, `DELETE /api/app-lock` | 앱 잠금 비밀번호를 정하기·바꾸기 / 끄기(§6, D-106·D-112) | 비밀번호는 본문으로만. 이미 걸려 있으면 **지금 비밀번호**를 함께 받거나, **이 세션이 접근 열쇠로 로그인한 지 10분 안**이어야 한다(§6 '잊었을 때') |
| `POST /api/app-lock/unlock`, `POST /api/app-lock/lock` | 이 세션의 잠금 풀기(비밀번호) / 이 세션을 지금 잠그기 | 풀기: 서버가 대조하고 틀린 횟수를 센다. 잠그기: 비밀번호 없이 받는다(더 잠기는 쪽이라 화면의 요청을 믿어도 된다) |
| `GET /api/today` | 서버가 센 오늘 날짜·시간대·하루 기준 시각, 오늘 기록의 요약(상태·판 번호·고른 계열·쓰던 단계 — 글 없음), 가장 최근의 지난 임시저장(D-122) | `X-Timezone` 필수 |
| `GET /api/diaries/:date` | 해당 날짜의 draft/completed 전체(없으면 404 — 없는·미래 날짜도 새로 만들지 않는다) | owner 강제, 날짜 모양 400 |
| `PUT /api/diaries/:date` | 임시저장(통째로 — 새로 만들기 201 / 고치기 200). 완료된 기록은 완료 조건을 다시 검사한다(D-023) | revision + `Idempotency-Key` + `X-Timezone`, 새로 만들기는 서버가 센 오늘만(422 `not_today`), 본문 160,768바이트(DATA_MODEL §2), 모르는 칸 400 |
| `POST /api/diaries/:date/complete` | 완료조건 검사 후 상태 전환(본문 `{revision}`) | 조건부 UPDATE 하나 + `Idempotency-Key`, 모자라면 422와 빠진 단계 목록 |
| `DELETE /api/diaries/:date` | 영구 삭제(기록 하나 — 화면은 2단계 확인). 확인 토큰은 **지금 판 번호**(본문 `{revision}` — 본 그 판만 지운다, D-122) | CSRF + 판 번호 + `Idempotency-Key` + cascade(부모 먼저) |
| `DELETE /api/diaries`(전체) | 확인 문구(`{ confirm: "모든 기록 삭제", pin? }`)를 받은 뒤 모든 기록과 영수증, 부를 이름·앱 잠금·하루 기준 시각 설정, 다른 기기 세션을 batch 하나로 영구 삭제(D-112 ⑩ — 접근 열쇠와 이 기기 세션은 남는다, D-124) | CSRF + 확인 토큰 + **본인 확인**(앱 잠금을 켠 경우 비밀번호를 한 번 더 — D-112 ⑤) + cascade |
| `GET /api/dashboard?range=` | 완료 기록의 결정론적 집계 | 범위 제한 |
| `POST /api/journal-assist` | 현재 턴을 `ai_jobs`에 등록하고 job ID 반환 | full chat 비저장, payload 최소화 |
| `GET /api/ai-jobs/:id` | job 상태/결과 조회(owner 전용) | timeout 시 fallback 안내 |
| `GET /api/ai-jobs/next`, `POST /api/ai-jobs/:id/result` | PC worker 전용 lease/결과 반환 | worker secret, lease 만료, 결과 schema 재검증 |
| `POST /api/analyses` | snapshot 분석 job 등록 | version, rate/cost limit |
| `GET /api/export[?after=YYYY-MM-DD]` | versioned JSON export를 100편씩 조각으로(`next`로 이어 받는다 — D-124). 화면 코드가 이어 붙여 파일로 만들어 공유 창으로 넘긴다(§4.1) | owner + `Cache-Control: no-store` + `X-Timezone`, 주소에 인증 정보 없음(1회용 내려받기 주소를 만들지 않는다) |
| `GET /api/backup/export[?after=]`, `POST /api/backup/import` | 본인 PC 백업 도구 전용 — 내보내기 조각 받기 / 백업 파일을 조각으로 다시 넣기(이미 있는 날짜는 건너뜀, D-109·D-124) | cookie·CSRF가 아니라 `Authorization: Bearer`(서버는 SHA-256 해시와 상수 시간 대조, secret이 없으면 404), 다시 넣기 조각 ≤200편·≤1MiB, 조각 전체를 먼저 검사 |
| `GET/PUT /api/settings/reminder` | 알림 설정(`dashboard-reminder`가 만든다) | timezone validation |
| `GET/PUT /api/settings/day-start` | 하루 기준 시각(D-081 — `owner_settings.day_start_hour`, D-122) | 0~6 정수, 바꿔도 저장된 날짜는 다시 세지 않는다 |
| `GET/PUT /api/settings/profile` | 부를 이름(D-112 ④, 12자) | 길이·빈칸 검사 |

이 표에서 '재인증'이라는 말은 쓰지 않는다. 지울 때의 본인 확인은 위 두 삭제 행이 전부다(D-112 ⑤ — 기록 하나는 2단계 확인, 전체는 확인 문구 + 잠금을 켠 경우 비밀번호). 접근 열쇠를 다시 넣게 하지 않는다.

`PUT /api/diaries/:date`는 이미 존재하는 diary(과거 `entry_date`의 draft 포함)라면 언제든 upsert를 허용하지만, **새로 행을 만드는 요청은 `:date`가 서버가 owner의 timezone과 `day_start_hour`(DATA_MODEL §2·§3.4)로 계산한 오늘과 같을 때만 허용**하고 다르면 422(`not_today`)로 거부한다(D-082). `POST /api/diaries/:date/complete`는 `entry_date`가 과거여도 그 diary가 draft 상태이고 완료조건을 만족하면 허용한다 — 완료 시점이 `entry_date`보다 나중이어도 막지 않는다.

모든 변경 API는 인증, CSRF 방어, schema validation, request size limit, rate limit을 검토한다(감사 기록 표는 두지 않는다 — DATA_MODEL §5, D-122). CSRF 방어는 다음으로 확정한다(D-025).

- 모든 변경 요청(PUT/POST/DELETE)은 서버가 정한 custom header(예: `X-Requested-With: emotion-diary`)를 요구한다. 단순 form 제출이나 cross-site fetch는 이 header를 붙일 수 없으므로 header가 없으면 403이다.
- 추가로 `Origin`(없으면 `Referer`)과 `Sec-Fetch-Site`를 배포 origin 허용 목록과 대조한다. 두 검사는 서로 대체가 아니라 중첩이다.
- 세션 cookie는 `SameSite=Lax` 이상과 `Secure`를 요구한다(§6). 삭제는 여기에 확인 토큰을 더한다.
- Workers가 custom header와 `Sec-Fetch-Site`를 실제로 받는 것은 B-03에서 확인했다(실측 2026-10-13~14, 연습용 화면, iPhone Safari 본체와 홈 화면 앱: header 있음 200 / 없음 403, `Origin` 있음·`Sec-Fetch-Site: same-origin`). 로그인 요청(`POST /api/session`)도 변경 요청이라 같은 검사를 받는다. worker 전용 경로는 cookie 대신 Bearer secret만 받으며 CSRF 대상이 아니다.

공개 URL이 생기면 CSP, secure cookie, HSTS, X-Content-Type-Options와 프레임 정책을 배포 게이트에 포함한다.

## 6. 인증과 소유권

### 제한 단일 사용자 MVP

이 절의 로그인 수명·만료 화면·앱 잠금·열쇠 보관은 D-112(2026-10-14)다. 사용자가 고른 것과 에이전트가 정한 세부의 구분은 D-112 행에 있다.

**접근 열쇠와 로그인**

- 접근 경계는 **접근 열쇠**(서버 접근 토큰, D-032) 하나다. 긴 무작위 문자열이고(스파이크는 32글자) 그 해시만 Workers secret에 있다.
- 로그인: 열쇠 화면(UX_SPEC §16)에서 넣은 열쇠를 `POST /api/session`의 본문으로 보낸다. 서버가 해시와 대조해 맞으면 세션 cookie를 심는다. 이후 모든 `/api/*`는 이 cookie를 검증한다(로그인 상태만 알려 주는 `GET /api/session`과 `POST /api/session`은 예외).
- **열쇠는 주소(URL)에 싣지 않는다.** query나 `#` 뒤에 열쇠를 받는 경로를 만들지 않고, 열쇠가 든 링크로 로그인시키지 않는다. 홈 화면에 추가하면 그 순간의 주소가 아이콘에 저장되고(§2.2), 주소는 기록·공유로 새어 나간다.
- 열쇠 칸은 암호 칸으로 표시해(`autocomplete="current-password"`) 기기의 암호 보관함이 저장·자동 입력을 제안할 수 있게 한다(D-112 ⑥). **홈 화면 앱에서 암호 자동 입력이 되는지는 공식 근거가 없고 실기기로도 보지 않았다(미검증)** — 안 되면 긴 열쇠를 넣는 다른 방법을 다시 정한다.
- 세션 cookie: `HttpOnly; Secure; SameSite=Lax; Path=/`. 값에는 **세션 번호(무작위), 주체(누구의 로그인인지), 발급 시각**을 담고 서버 비밀값으로 서명한다(HMAC). 서명 비밀값은 접근 열쇠 해시와 별개의 Workers secret이다.
- **서버는 세션마다 기록 한 줄을 D1에 둔다**(DATA_MODEL §3.10 — 이번에 더한 설계): 세션 번호, 주체, 마지막 발급 시각, 열쇠로 로그인한 시각, 마지막 활동 시각, 잠김 여부. 요청마다 ① 서명 ② 그 세션 기록이 살아 있는지 ③ 기한 ④ 주체의 허용 목록 대조 ⑤ 잠김 여부를 본다. 스파이크의 세션은 서버 기록 없이 서명만으로 검증했다 — 서버 기록을 두는 것은 이번에 더한 설계이고(로그아웃한 cookie의 사본을 서버에서 끊고, 앱 잠금 상태를 기기마다 서버에 두려면 필요하다) 스파이크로 확인한 것이 아니다.
- **주체**는 서버 설정의 허용 목록에 적힌 문자열이다(본인 1명이라 하나). 로그인에 성공하면 서버가 그 주체로 세션을 만들고, 데이터의 주인(`owner_key`)은 세션의 주체에서 서버가 정한다 — 서버 상수 하나에만 기대지 않는다(D-025).
- **수명은 마지막으로 쓴 날부터 30일이다**(D-112 ①). cookie의 `Max-Age`는 30일이고, 서버는 유효한 요청을 받았을 때 마지막 발급에서 하루가 넘었으면 새 발급 시각으로 cookie를 다시 심는다(연장이 하루 단위라 실제로는 마지막 사용 뒤 29~30일이다). 서버도 마지막 발급에서 30일이 지난 세션은 cookie가 남아 있어도 거부한다(기기 시계와 cookie 수명만 믿지 않는다). 계속 쓰는 동안에는 끝나는 날이 없다 — 절대 상한은 두지 않는다(D-112 ⑨, 사용자 결정). **12시간 넘게 지난 뒤 홈 화면 앱에서 로그인이 유지되는지는 실기기에서 아직 보지 못했다**(S-03, RK-038). 앱을 완전히 닫았다 바로 다시 연 경우는 유지됐다(실측 S-02).
- **허용 목록 대조**(D-025): 세션의 주체를 요청마다 서버의 허용 목록과 대조한다. 서명이 맞아도 목록에 없는 주체는 401이다. 스파이크에서 원격으로 확인했다(2026-10-14: 목록 밖 주체 401, 같은 방법으로 만든 목록 안 주체 200, 주체만 바꿔치기한 세션 401). 접근 열쇠 하나나 서버 상수 하나의 설정 오류로 다른 기기가 owner 데이터에 닿는 길을 막는 겹이다. 실제 앱 구현은 Phase 1이다.
- **Safari와 홈 화면 앱은 로그인이 따로다**(실측 S-01). 각각 한 번씩 로그인한다. 한쪽에서 로그아웃해도 다른 쪽은 남는다.

**로그인이 풀렸을 때**(D-112 ②)

- cookie가 없거나 기한이 지났거나 서명·주체가 맞지 않으면 `/api/*`는 401을 준다. 화면은 접근 열쇠 화면의 '다시 들어와 주세요' 변형을 보이고, 열쇠를 넣으면 **있던 화면으로 돌아간다**. 돌아갈 자리는 화면 주소만 기억한다(일기 내용을 기억하지 않는다).
- 글을 쓰던 중이면 '다시 들어와야 해요' 시트를 먼저 보인다(UX_SPEC §14). 마지막 서버 임시저장 뒤에 쓴 글은 기기 사본(§7, D-123)으로 붙잡고 보내기를 멈췄다가, 다시 들어오면 같은 영수증 열쇠로 서버에 저장한다. 그 사이 화면이 통째로 새로 열려도 사본에서 되살린다.
- 로그아웃(`DELETE /api/session`)은 이 기기의 cookie를 지우고 **서버의 그 세션 기록도 지운다** — 지운 cookie의 사본으로는 다시 들어올 수 없다(EVAL_PLAN F-22). 다른 기기의 로그인은 남는다. 모든 기기의 로그인을 한꺼번에 끊는 방법은 세션 기록을 전부 지우거나 세션 서명 비밀값을 바꾸는 운영 절차다(아래 secret 회전).
- 틀린 열쇠로 잠긴 동안의 429에는 다시 시도할 수 있을 때까지의 시간을 싣는다(`Retry-After`, 스파이크는 300초) — 화면이 남은 시간을 보인다.
- iPhone 설정에서 쿠키를 전부 막았거나 내용 차단 앱이 cookie를 지우면 로그인이 되지 않는다. 화면은 로그인 요청이 성공한 직후 `GET /api/session`을 한 번 불러 '로그인됨'이 아니면 그 가능성을 알린다(UX_SPEC §16).

**앱 잠금 비밀번호와의 관계**(D-106, D-112 ③)

- 접근 열쇠는 '이 기기가 들어와도 되는가'를, 앱 잠금 비밀번호(숫자 네 자리, 선택 기능, 기본 꺼짐)는 '지금 화면을 보는 사람에게 보여도 되는가'를 가른다. 둘은 겹쳐 쓰이고 서로를 대신하지 않는다.
- **비밀번호가 맞는지는 서버가 확인한다**(D-112 ③). 비밀번호는 요청 본문으로만 보내고(HTTPS) 주소·로그·응답에 남기지 않는다. D-106의 '평문으로 전송하지 않는다'는 '암호화되지 않은 길이나 주소에 실어 보내지 않는다'로 읽는다 — 서버가 확인하려면 본문으로는 보내야 한다(D-112 ③의 세부).
- 서버는 비밀번호를 **서버 비밀값을 섞은 해시**(HMAC, 비밀값은 Workers secret)로만 저장한다. DB만 새어 나가서는 대조할 수 없게 하려는 것이다. 숫자 네 자리는 경우의 수가 1만 가지뿐이라 해시를 느리게 만들어도 지켜지지 않고 요청당 CPU 10ms 한도(§2.1)에도 맞지 않는다 — **실제 방어는 서버가 세는 횟수 제한이다**: 다섯 번 틀리면 30초 동안 풀기 요청을 받지 않는다.
- **잠금 상태는 세션마다(기기마다) 서버에 있다.** iPhone에서 풀어도 PC의 세션은 풀리지 않는다. 잠금을 켰는지와 비밀번호 해시·틀린 횟수는 owner 설정에 있다(DATA_MODEL §3.4).
- **잠긴 세션이 부를 수 있는 것은 넷뿐이다**: `GET /api/session`, `POST /api/app-lock/unlock`, `DELETE /api/session`(로그아웃), `POST /api/session`(접근 열쇠로 다시 로그인). 그 밖의 `/api/*`는 **423**과 사유 코드 `app_locked`를 주고 일기 데이터를 싣지 않는다. 화면은 401(로그인 풀림 → 접근 열쇠 화면)과 423(잠김 → 잠금 화면)을 갈라 본다. 화면을 가리는 것은 화면 쪽 일이지만(떠나는 순간 가림 — D-106 ④, 잠금과 상관없이 모두 — D-113 ①), 잠금의 실제 경계는 서버다. 잠겨 있던 세션은 화면이 통째로 새로 열려도(RK-034) 잠긴 채다.
- **언제 잠기는가**(D-106 ③ — '앱을 켤 때'와 '다른 곳에 5분 넘게 있다 돌아올 때'): 서버는 **화면이 보이는 동안 보내는 신호**로 '떠나 있던 시간'을 잰다. 화면은 앞에 보이는 동안 1분마다 `POST /api/session/heartbeat`를 보내고(보이지 않게 되면 멈춘다 — iPhone은 뒤로 간 앱의 타이머를 멈춘다고 본다 — Apple 직원의 포럼 답(Safari 일반)이 근거이고 홈 화면 앱에서는 미검증(T-01)), 서버는 앱 잠금을 켠 owner의 세션에서 **마지막 신호(또는 다른 요청) 뒤 5분이 넘은** 요청을 잠긴 것으로 본다. 그래서 화면을 켜 둔 채 편지를 오래 읽어도 잠기지 않고, 다른 앱에 5분 넘게 있다 돌아오면 잠긴다. 신호는 잠금을 늦추는 방향만 가능하고 이미 이 세션을 가진 쪽만 보낼 수 있다. 화면은 그보다 먼저 잠그고 싶을 때(앱을 켤 때 등) `POST /api/app-lock/lock`으로 청한다. 마지막 활동 시각은 1분 단위로 묶어 써도 된다(판정 오차 1분, 쓰기 한도 안 — DATA_MODEL §3.10). **'앱을 켤 때'와 '화면이 통째로 새로 열림'을 어떻게 가르는지(언제 잠금을 청하는지)와 iPhone이 뒤로 간 앱의 타이머를 실제로 멈추는지**는 실기기로 봐야 한다. TASK-MOBILE T3의 실기기 확인은 2026-10-14 사용자 결정으로 미뤘다(`tasks/mobile/2026-10-14-t3/REQUESTS.md` '휴대폰 확인 범위') — 그때까지 화면은 **잠정 규칙**으로 동작한다: 화면이 처음 설 때 잠금이 켜져 있고 이 세션이 안 잠겼으면, 탐색 종류가 `navigate`이고 이 탭에서 이미 시작했다는 표식(`sessionStorage`)이 없을 때만 `POST /api/app-lock/lock`을 청한다(T3 A-15, UX_SPEC §15). 실기기 확인은 Phase 2 착수 전이나 출시 전 점검(EVAL_PLAN §6 T-01·T-02)이고, 그 결과로 이 규칙을 확정하거나 고친다. 2026-10-14 홈 화면 앱 1회차에서 관찰한 것: 처음 열 때 탐색 종류 `navigate`·표식 없음, 다른 곳에 갔다 오면 `visibilitychange`의 hidden·visible이 짝으로 온다. 뼈대는 위 규칙(서버의 5분, 화면의 신호, 화면의 잠금 요청)으로 먼저 짓는다 — 이 설계는 에이전트가 정했다(사용자 결정 D-106 ③을 서버에서 지키는 방법).
- **잠긴 상태에서 쓰던 글**: 자동 저장이 423을 받으면 그 입력은 401 때와 같이 기기 사본으로 붙잡고, 잠금을 풀면 저장한다(§7). 잠긴 동안 사본을 화면에 그리지 않는다.
- **접근 열쇠로 방금 로그인한 세션은 풀린 채로 시작한다.** 접근 열쇠가 더 강한 본인 확인이기 때문이다. 로그인이 저절로 풀렸든, 스스로 로그아웃했든, 새 기기든 같다. 걸어 둔 잠금 설정은 그대로 남고 5분 규칙은 그때부터 다시 돈다(D-112 ⑧).
- **잊었을 때**(D-106 ⑤): 잠금 화면의 '비밀번호를 잊었어요' → 로그아웃 → 접근 열쇠 화면 → 로그인. 서버는 '잊어서 온 사람'을 따로 표시하지 않는다(화면이 보내는 표식을 믿지 않는다). 대신 **접근 열쇠로 로그인한 지 10분 안인 세션은 지금 비밀번호 없이 앱 잠금을 새로 정하거나 끌 수 있다**(§5). 화면은 잊어서 온 사람에게 로그인 직후 새 비밀번호 정하기를 보이고, 정하지 않고 돌아가면 잠금을 끈다(UX_SPEC §15).
- 생체 인증은 정하지 않았다.

**실패 제한과 운영**

- 실패 시도 제한은 **D1 기반 전역 잠금 카운터**(`auth_failures` 1행, DATA_MODEL §3.9)로 한다: 60초 창에서 실패 10회면 5분 동안 틀린 열쇠에 429. **맞는 열쇠는 잠금과 상관없이 들어온다**(2026-10-15 D-122, RK-041 — 잠금이 실제로 막던 것은 주인뿐이었다). 1인 도구이므로 IP별이 아니라 전역이다. **이 잠금은 열쇠를 맞혀 보는 속도를 막지 않는다** — 맞는 열쇠는 늘 들어오므로 잠긴 동안에도 대조는 한다(틀리면 429). 경계는 열쇠의 길이(무작위 12자 이상, 지금 43자)이고 잠금은 틀린 열쇠에 답을 늦추는 겹일 뿐이다. 잠긴 동안의 틀린 시도는 D1에 쓰지 않는다(DATA_MODEL §3.9). Workers Rate Limiting binding은 2026-09-02 스파이크에서 같은 key 30회(HKG/NRT 분산)에도 한 번도 차단하지 않았고 문서상 "permissive, eventually consistent, per location"이므로 보안 경계로 채택하지 않는다(보조 완화로만 추가 가능).
- secret 회전은 전파 지연(약 20초 관찰)이 있으므로, 회전 절차는 새 값 등록 → 전파 확인(옛 값 401) → 세션 재발급 순으로 한다.
- 앱 주소는 공개 인터넷에 있으므로 로그인 없는 요청에는 정적 파일과 로그인 상태(`GET /api/session`) 말고 어떤 데이터도 주지 않는다.
- **Cloudflare Access는 첫 버전에서 쓰지 않는다**(D-108 ③). 공식 문서로는 `workers.dev` 주소에 붙일 수 있고 무료 50명 범위지만 조직을 만들 때 결제수단 입력이 필요하다 — 켜 본 적은 없다. 나중에 도입한다면 홈 화면 앱 안에서 바깥 로그인 화면을 다녀와 cookie가 돌아오는지를 실기기로 먼저 확인해야 한다(확인한 적 없음).
- `owner_key`는 클라이언트가 정하지 않는다. 서버가 세션의 주체에서 정한다(위 '주체' — 서버 상수 하나에만 기대지 않는다, D-025).
- defense-in-depth(D-025, 결함 I-03): 접근 열쇠 cookie 하나에 의존하지 않는다. 경계는 열쇠 대조 + 세션 서명 + 서버의 세션 기록 + 주체 허용 목록 대조 + 실패 잠금 + CSRF 검사(§5 — custom header 필수)의 겹이다. Access의 identity 헤더는 Access를 켤 때만 있으므로 허용 목록 대조는 위의 세션 주체로 한다. 설정 오류 하나로 다른 기기가 owner 데이터에 접근하는 경로가 있어서는 안 된다.
- 이 모드는 같은 배포에 임의 다중 사용자를 추가할 수 없다.

### 공개 또는 다중 사용자로 전환할 때

- 실제 인증 제공자를 새로 선택한다. 현재 접근 토큰 방식은 다중 사용자에 쓰지 않는다.
- 서버가 신뢰 가능한 identity로부터 `HMAC(server_secret, normalized_subject)` 형태의 pseudonymous `owner_key`를 도출한다.
- 원시 이메일은 제품에 필요하지 않으면 저장하지 않는다.
- 계정 연결, 탈퇴, subject 변경, 공유 링크와 row isolation을 새 threat model과 migration으로 설계한다.

## 7. 오류·재시도·저하 모드

| 실패 | 동작 |
| --- | --- |
| draft 저장 네트워크 실패 | 서버로 못 보낸 글을 기기 사본(`localStorage` `unsentDiaries`, DATA_MODEL §6)에 두고 '아직 저장 안 됨 · 연결되면 저장해요'; 같은 idempotency key·같은 본문으로 다시(연결 복귀·다시 보임·2·5·15초 뒤, 그 뒤 30초마다); 서버가 받으면 즉시 지움(D-123 — D-082 ④를 대체). 요청은 한 번에 하나, 새 내용은 앞 요청의 답을 받은 뒤 새 열쇠·새 판 번호로 |
| 화면이 통째로 새로 열림(홈 화면 앱에서 바깥 링크·파일 미리보기에서 돌아올 때 등, RK-034) | 화면 쪽 기억에 기대지 않고 서버 상태로 다시 세운다: 로그인 확인 → 오늘 기록·쓰던 글 조회 → 쓰던 단계로. 마지막 임시저장 뒤의 입력만 잃을 수 있으므로 임시저장은 입력이 멈출 때마다 한다(§4.1) |
| 로그인이 풀림(401) | 접근 열쇠 화면의 '다시 들어와 주세요' → 있던 화면으로. 쓰던 중이면 시트 먼저, 입력은 기기 사본으로 붙잡고 다시 들어오면 저장(§6, D-123) |
| 잠긴 세션으로 온 요청 | 423과 사유 코드 `app_locked`. 일기 데이터를 싣지 않는다. 화면은 잠금 화면을 보이고, 쓰던 입력은 기기 사본으로 붙잡아 잠금을 풀면 저장한다(§6, UX_SPEC §15, D-123) |
| 주요 화면 조회 실패(오늘·달력·통계·기록 상세) | 불러오지 못함 상태와 다시 시도를 표시; 오늘 화면은 오늘 기록 상태를 확인하지 못하면 새 기록 시작을 막는다(D-083) |
| 없는·미래 `entry_date` 조회 | 해당 날짜에 기록이 없음을 표시하고 새 draft를 만들지 않는다(D-083) |
| revision 충돌 | 서버/로컬 차이를 보여 주고 자동 덮어쓰기 금지 — 첫 조각은 다른 부분(있었던 일·마음과 크기·이유·칭찬·감사)을 한 줄씩 보이고 '이 휴대폰의 글로 남기기'·'다른 곳의 글로 바꾸기'를 고르게 한다(D-123). 다른 곳의 글을 읽지 못하면(끊김·5xx·401·423) 지운 것으로 보지 않고 사본을 둔 채 '다시 불러오기'만 준다 — 지움은 404로 확인됐을 때만이다. 다른 곳에서 완료된 날에 이 휴대폰의 임시저장 사본이 남아 있으면 오늘·기록 보기에 '남은 글 보기'가 있다(PR #40 리뷰) |
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
- 화면 오류 보고는 개발용 서버에서만 받는다(D-113 ②). 받는 것은 오류 종류·위치·앱 버전뿐이고 입력한 글·주소의 query·열쇠·비밀번호는 받지 않는다. 운영 배포에는 받는 경로가 없다.

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
| 휴대폰 브라우저와 홈 화면 웹앱이 Worker 하나(화면과 `/api/*`가 같은 주소)에 접속해 핵심 흐름을 수행 | B-08 | confirmed(iPhone, Worker 하나 구성) — 2026-10-14 iPhone iOS 26.5.2: Safari 본체와 홈 화면 앱에서 토큰 입력·저장·조회·거부, 주소창 없는 앱 모드, 완전 종료 뒤 세션 유지, 밀어서 뒤로, 공유 창으로 파일 저장(EVAL_PLAN §4의 S-00~S-12). 미검증 5건: 12시간 뒤 로그인, 자판과 아래 버튼, 5분 떠났다 오기, 아이콘 지웠다 다시 추가, '웹 앱으로 열기'를 끈 경우. Android는 확인하지 않았고 출시 전 실기기 점검으로 넘겼다(D-108 — 2026-10-15부터 공개 관문의 `public-only`, D-117). **화면을 Pages에 따로 두는 분리 구성은 검증한 적이 없고 채택하지 않는다(D-111 — 안 된다는 것은 규격 판단).** 근거 `tasks/spike/2026-10-13/PLAN.md` | 무료 별도 hosting(D-021, 예: Netlify+Turso) |
| D1의 조건부 UPDATE/CHECK/trigger/batch가 데이터 계약(D-024) 충족, 무료 한도·미사용 정지 없음 | B-04 | confirmed — 2026-09-02 근거(로컬·원격 D1: migration, CHECK, UNIQUE 2종, completed 보호 trigger 2종, 조건부 완료 UPDATE, revision 충돌, 부모 우선 FK cascade)에 더해 2026-10-13 원격: batch 중간 실패 시 앞 statement까지 되돌림, 동시 첫 저장 8·갱신 8·완료 6건에서 각각 1건만 성공, 재전송 409. 무료 한도(읽기 500만 행/일, 쓰기 10만 행/일, DB 500MB, 호출당 질의 50건) 확인. '미사용 정지'는 요금 문서에 조항이 없음으로 판정. 미검증: 지속 부하(1인 사용 범위 밖) | 무료 범위의 대체 DB 재평가 |
| 서버 접근 토큰 cookie가 요구 인증 경계 충족(토큰 없는 접속 거부, rate limit) | B-02 | confirmed(본인 1명 전제) — 2026-09-02 근거(토큰 없음/오류 401, HMAC 세션 cookie HttpOnly/Secure/SameSite=Lax, D1 전역 잠금)에 더해 2026-10-14 iPhone Safari 본체·홈 화면 앱에서 세션 cookie 왕복. Rate Limiting binding은 미차단으로 기각. Cloudflare Access는 공식 문서 판정만(workers.dev 적용 가능, 무료 50명, 조직 생성에 결제수단 입력 필요) — 활성화하지 않았고 MVP에서 쓰지 않는다(D-108). identity 헤더는 Access를 켤 때만 있으므로 D-025의 허용 목록 대조는 세션 주체로 한다 — 2026-10-14 스파이크에 넣어 원격 확인: 세션이 주체를 서명과 함께 들고, 서명이 맞아도 목록에 없는 주체는 401(같은 방법으로 만든 목록 안 주체는 200), 주체만 바꿔치기한 세션 401. 실제 앱 구현은 Phase 1 | Cloudflare Access 추가 또는 무료 private hosting |
| Workers secret이 client bundle/로그/`wrangler.toml`에 없고 custom header CSRF 통과, worker secret 경로 분리 | B-03 | confirmed — 2026-09-02 근거(secret 3개는 `wrangler secret put`으로만, custom header 없음·교차 Origin·cross-site 403, worker 경로 Bearer 없음 401)에 더해 2026-10-13 배포 묶음·정적 파일·설정·로그·Git 추적 파일·Git 이력에서 비밀값 0건, `wrangler tail` 기록 0건(cookie·authorization은 REDACTED, 본문 없음), 2026-10-14 iPhone Safari·홈 화면 앱의 실제 요청: custom header 있음 200 / 없음 403, Origin 있음·`Sec-Fetch-Site: same-origin` | 배포 중단 |
| PC worker가 `ai_jobs` lease→`claude -p`→결과 반환 왕복을 완료하고, PC 꺼짐 시 job 만료+직접 작성 fallback | B-06 | partial(보류 2건) — 2026-09-02 왕복 PASS에 더해 2026-10-13 실제 PC worker: 실패 1회 → `pending`, 2회 → `failed`·payload NULL·사유 코드만, 기한 경과 → `expired`·payload NULL, 조회 응답의 `fallback: direct_write`, 정상 10/10. 미검증: 그 신호를 받은 화면의 실제 전환(앱 없음). 2026-10-15 D-120 뒤로는 대체 경로의 판정이다 | AI 대화·RAG 보류 |
| 구독 기반 모델 호출 경로가 존재하고 server-only·strict schema·보존 통제 가능(B-06 재정의, D-019, D-029: 본인 PC `claude -p`) | B-06 | partial(보류 2건) — 2026-10-13~14: 생성과 분리된 독립 verifier 호출 5/5(세션 분리, 도구 없음), 명시 위기 3문장 가운데 2문장은 첫 호출에서 `possible_crisis`, 1문장은 첫 호출이 턴 제한으로 실패한 뒤 다시 부른 6회 모두 `possible_crisis`, `--no-session-persistence`로 PC에 대화 기록 미저장, 지연 worker p50 10.8초/p95 13.1초, 호출당 입력 약 2.6만 토큰(대부분 캐시)·출력 0.4~0.8천 토큰, 시간 초과·끊긴 출력·로그인 만료의 실패 분류. **미검증 2건: 거절 응답의 실제 재현(모의 응답으로만 확인), 구독 한도에서 차지하는 비율(계산하지 못함).** 운영 조건 D-110, 위험 RK-016·RK-017·RK-035. **2026-10-15 D-120**: 짓게 되면 서버 → Claude API 경로로 이 가설을 다시 세우고(보류 2건은 그 길에선 묻지 않는다), 이 판정은 대체 경로의 것으로 남는다 | AI 대화·RAG 보류, 제한 MVP만 진행(D-018) |
| Web Push/background 동작 | 게이트 없음(MVP 밖 — 이슈 #9, RK-004). 전에는 이 행에도 B-08이 붙어 있어 휴대폰 접속 판정과 헷갈렸다 | unknown — 확인하지 않았다 | 인앱 reminder만 MVP |
| Vector search filter/score 응답이 Gate 입력 충족(유료 Vector Store 불가 시 구독 경로/로컬 대안) | B-07 | unknown | custom DB/hybrid retrieval 또는 RAG 보류 |
| D1 데이터 위치·암호화·보존·hard delete 반영·백업(Time Travel/export) 절차가 고지 가능한 수준으로 정의됨 | B-05 | confirmed — 2026-10-13 Time Travel 복구 실습(지운 행 복구 → 그 복구를 되돌림), 저장 지역 APAC·AES-256·무료 7일(공식 문서), 백업 절차와 삭제 지연 문서화(D-109, `DATA_MODEL` §8). 고지 문구는 초안. 백업·다시 넣는 도구의 구현은 Phase 1 | 백업 약속 축소 또는 제품 범위 축소 |

## 11. Phase 1 뼈대 (TASK-MOBILE T3, 2026-10-14)

앱의 첫 코드(`app-scaffold`)가 위 계약을 어떤 구성으로 지키는지 적는다. 화면은 도구(프레임워크) 없이 짓는다 — 사용자 결정 D-114. 나머지 구성은 에이전트가 정했다(D-115, 근거 `tasks/mobile/2026-10-14-t3/PLAN.md` '에이전트가 정한 것' T3 A-1~A-18). 배포 절차는 [DEPLOY.md](DEPLOY.md)가 정본이다. 이 절의 값이 코드와 다르면 코드를 고친다.

### 11.1 저장소 구조

| 자리 | 내용 |
| --- | --- |
| `app/worker/src/` | 서버. `index.ts`(진입·빌드 상수) → `app.ts`(경로 순서) → `session.ts`·`routes/*`·`dev/`(개발용 전용) |
| `app/client/` | 화면. `index.html`, `src/`(TypeScript + DOM), `public/`(manifest·임시 아이콘·`_headers`) |
| `app/shared/` | 서버와 화면이 함께 쓰는 API 계약 `api.ts`와 개발용 전용 계약 `dev.ts` |
| `app/migrations/` | D1 마이그레이션 `0001`~`0004`(DATA_MODEL §3.4·§3.9·§3.10·§3.11) |
| `app/test/` | 서버 시험(`worker/`)과 화면 시험(`client/`), 실제 브라우저 E2E(`e2e/` — Playwright, 2026-10-16 D-123) |
| `app/scripts/` | 빌드·로컬 실행·원격 보조·비밀값 만들기·임시 아이콘·원격 검사 |
| 루트 | `package.json`·잠금 파일 하나, `wrangler.jsonc`, `vite.config.ts`, `vitest.config.ts`, `tsconfig*.json`, `biome.json`. 산출물은 `dist/`(Git 제외) |

새 코드 파일의 줄바꿈은 LF다. 줄바꿈을 보는 검사(formatter 검사)는 걸지 않는다 — Windows CI가 꺼낼 때 CRLF로 바꿔도 결과가 같게.

### 11.2 설정과 환경

- **`wrangler.jsonc`**(커밋된다): `main` = `app/worker/src/index.ts`, `compatibility_date` 2026-06-01, `minify` 켬, `send_metrics` 끔, `assets` = `{ binding: "ASSETS", not_found_handling: "single-page-application", run_worker_first: ["/api/*"] }`, D1 바인딩 `DB`(`migrations_dir` = `app/migrations`), 변수 `OWNER_SUBJECT`·`OWNER_ALLOWLIST`(주체 `owner`). `run_worker_first`를 배열로 주면 navigate 요청 자동 감지는 꺼지고 배열에 맞는 경로만 Worker로 간다(공식 문서 2026-10-14).
- **계정 값은 저장소에 없다**(D-115 ①): account id, D1 id, 앱 주소(계정 하위 도메인)를 커밋되는 파일에 두지 않는다. 원격 명령은 `app/scripts/cf.mjs`가 `wrangler d1 list`로 이름에서 D1 id를 찾아 Git 제외 파일 `wrangler.local.jsonc`를 만든 뒤 `--config`로 부른다. id 없이 올려 자동으로 만드는 기능은 쓰지 않는다(설정 파일에 id를 되쓴다). CSRF의 허용 출처는 설정에 적지 않고 요청 자신의 주소로 계산한다(§5).
- **환경 셋**: 최상위(로컬 개발·시험, `local`) / `env.dev` — 개발용 건물(Worker `emotion-diary-dev`, D1 `emotion-diary-dev`, 가짜 데이터만) / `env.prod` — 운영(Worker `emotion-diary-prod`, D1 `emotion-diary-prod`). **운영은 이름만 정했고 본인 사용 시작(`personal-start`) 전에 만든다(D-116·D-117 — 만들기 직전 사용자 확인).** 환경마다 Worker·D1·비밀값이 따로다(바인딩·변수·비밀값은 상속되지 않는다). `cf.mjs`는 `--env` 없는 원격 명령과 운영 명령(따로 허락하지 않으면)을 거부한다.
- **비밀값 넷**(환경마다 따로, `secrets.required`로 선언 — 빠지면 올리기가 실패하고, 실행 중 빠지거나 짧으면 모든 `/api/*`가 500): `ACCESS_KEY_HASH`(열쇠의 HMAC-SHA256, 16진수 64자), `ACCESS_KEY_SALT`, `SESSION_SECRET`(세션 서명), `APP_LOCK_SECRET`(앱 잠금 해시). 만드는 것은 `app/scripts/make-secrets.mjs`, 값은 Git 제외 파일(`work/deploy/`, 로컬은 `.dev.vars`)과 `wrangler secret`에만 있다(§3).
- **개발용 전용 코드는 운영 묶음에서 코드째 빠진다**(D-115 ②): 빌드 상수 `__APP_ENV__`(`local`·`dev`·`prod`)로 가르고, 운영 빌드에서 그 조건이 거짓으로 접혀 오류 보고 경로와 상태 칸이 묶음에 들어가지 않는다. `npm run build`가 운영 묶음에서 표식(`client-errors`·`client_errors`·`dev-panel`)을 찾으면 실패하고, 개발용 묶음에 표식이 없어도 실패한다(검사가 헛돌지 않게).

### 11.3 화면 주소와 기록

화면 주소는 해시 `#/…`다(D-115 ③ — 시안과 같다). 서버는 첫 화면 파일(`/`)만 받으므로 화면 주소(기록 날짜 같은 것)가 서버 요청 기록에 남지 않는다. 방문 기록 규칙(UX_SPEC §17)은 화면 코드가 `history.pushState`·`replaceState`로 직접 지킨다 — 화면 사이 이동은 쌓고, 한 화면 안의 바꾸기와 지나간 열쇠·잠금 화면은 바꿔치운다. 시트는 같은 주소로 기록 한 칸을 쌓아, 밀어서 뒤로 가면 시트만 닫힌다(UX_SPEC §17 규칙 4를 뼈대에서 처음 만든다 — 실기기 T-06). 파일 없는 경로가 첫 화면 파일로 떨어지는 SPA 처리는 안전망으로 둔다(§2.1). **작성 흐름**(2026-10-16, D-123): 흐름에 들어갈 때와 단계를 옮길 때 기록 칸을 쌓고 칸마다 `history.state.flow` = {흐름 번호, 깊이, 편지에서 왔는지}를 싣는다(새로고침에도 남는다). 흐름을 떠날 때(완료·×·지우기·저장하기) 깊이만큼 `history.go`로 되감고 나갈 화면으로 바꿔친다 — 다시 밀어도 끝난 단계로 돌아가지 않는다(UX_SPEC §17 규칙 3, F-18). 흐름 번호는 흐름에 들어간 칸(오늘·기록 보기)이 붙인 것을 단계마다 이어 쓴다(`app/client/src/router.ts` `pushFlowStep`·`leaveFlow`).

### 11.4 새 버전 알림

빌드할 때 빌드 번호(UTC 시각 + 커밋 앞 7자) 하나를 만들어 화면 묶음과 서버 묶음에 같이 넣는다(D-115 ④). `GET /api/session`은 로그인 여부와 상관없이 `build`와 `compat`(API 호환 단계 — 서버와 화면이 서로를 이해하지 못하게 바뀔 때만 1 올리는 정수, `app/shared/api.ts`)을 돌려준다. 화면은 시작할 때와 다시 보일 때 자기 번호와 비교해, 다르면 맨 위에 '새 버전이 있어요' 띠와 `새로 고치기` 버튼을 보인다. **누를 때만 새로 고친다** — 쓰는 중에 저절로 새로 고쳐 입력을 잃지 않게(RK-034·RK-037). 서버의 `compat`이 화면보다 크면 띠의 문구만 '새로 고쳐야 저장할 수 있어요'로 바뀐다. 그때 작성 흐름은 서버로 보내기를 멈추고 기기 사본만 쓰며, 남기기·저장하기는 '새로 고쳐야 저장할 수 있어요'로 막는다 — 새로 고치면 사본에서 되살려 저장한다(D-123, `app/client/src/write/saver.ts` `blockSending`). Cloudflare의 배포 버전 바인딩은 쓰지 않는다 — 화면 묶음은 올리기 전에 만들어져 그 값을 알 수 없다.

### 11.5 화면 오류 보기(개발용 건물에서만)

Mac이 없어 iPhone 화면의 개발 도구를 쓸 수 없으므로(RK-036) 개발용 빌드에만 두 가지를 둔다(D-113 ②, D-115 ⑤).

- **상태 칸**: 화면 구석의 접힌 `상태` 버튼을 펴면 빌드·환경·화면 표시 방식(`display-mode` 셋과 `navigator.standalone`)·화면 높이 셋(`innerHeight`·`visualViewport.height`·`screen.height`)·탐색 종류·시작할 때의 표식과 '마지막으로 숨은 뒤 지난 시간'·시작 잠금 판단·최근 보임/숨김 기록·마지막 API 응답(경로와 번호)·신호 횟수·잠김 여부·마지막 오류를 글자로 보인다. 사용자가 캡처로 보내 준다. **입력한 글·열쇠·이름·비밀번호는 싣지 않는다.**
- **오류 보고**: `POST /api/client-errors`(로그인·CSRF·잠기지 않은 세션만). 받는 칸은 일곱뿐이다 — 종류(`error`·`unhandledrejection`·`api`), 오류 이름, 파일 경로(query·`#` 없음), 줄, 칸, 빌드, 화면 이름. 칸이 더 있거나 모양이 다르면 400이고(서버·화면이 같은 검사 `app/shared/dev.ts`), 메시지·stack은 입력값을 담을 수 있어 받지 않는다. D1 `client_errors`에 최근 200행만 둔다(DATA_MODEL §3.11) — `cf.mjs dev sql`로 본다.
- **운영 빌드**에는 둘 다 없다. 화면은 '문제가 생겼어요'와 오류 번호(오류 이름·파일·줄·칸·빌드로 만든 6자 — 같은 고장은 같은 번호)와 `다시 열기`만 보이고 서버로 아무것도 보내지 않는다. 운영의 문제는 그 번호를 말로 전해 개발용에서 재현한다.

### 11.6 보안 헤더와 캐시

정적 파일(화면)의 헤더는 `app/client/public/_headers`, `/api/*`의 헤더는 `app/worker/src/http.ts`에서 건다 — `_headers`는 Worker가 만든 응답에 붙지 않는다(공식 문서 2026-10-14, D-115 ⑦). §5 끝의 '공개 URL이 생기면'에 해당하는 값이다.

| 응답 | 헤더 |
| --- | --- |
| 정적 파일 `/*` | `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`, `Strict-Transport-Security: max-age=31536000`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Permissions-Policy: camera=(), microphone=(), geolocation=()` |
| 정적 파일 `/assets/*` | 위에 더해 `Cache-Control: public, max-age=31536000, immutable`(Vite가 이름에 내용 해시를 넣는 파일만). 첫 화면 파일·manifest·아이콘은 기본값(매번 확인)이라 새 버전이 바로 보인다 |
| `/api/*` | `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`, `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Strict-Transport-Security: max-age=31536000`, `Cross-Origin-Resource-Policy: same-origin` |

화면 코드는 인라인 스크립트와 `style` 속성을 쓰지 않는다(CSSOM만) — 그래서 CSP에 `'unsafe-inline'`이 없다. `.dev`는 HSTS preload라 `workers.dev`는 헤더와 상관없이 HTTPS다. 파일 없는 경로(SPA 폴백)의 응답에도 `_headers`가 붙는지는 개발용 건물에서 잰다(`app/scripts/remote-check.mjs`).

### 11.7 세션·잠금 구현의 세부

§6의 계약을 지키며 정한 세부다(T3 A-17).

- cookie 이름은 `__Host-session`(브라우저가 Secure·`Path=/`·Domain 없음을 강제), 값은 `v1.<세션 번호>.<주체>.<발급 ms>.<서명>`. 세션 번호는 16바이트 무작위, 서명은 `SESSION_SECRET`의 HMAC-SHA256. 기한은 cookie가 아니라 서버 기록의 마지막 발급 시각으로 잰다 — cookie 사본끼리 엇갈려도 끊기지 않게(홈 화면에 추가할 때 cookie가 복사된다는 WebKit 버그 보고가 있다 — bugs.webkit.org 325412, 우리 실측 S-01과는 반대).
- 틀린 비밀번호는 **대조하기 전에 시도 한 번을 먼저 예약한다**(조건부 `UPDATE … RETURNING`) — 요청을 한꺼번에 여럿 보내도 다섯 번을 넘겨 맞혀 볼 수 없다. 접근 열쇠는 2026-10-15부터 먼저 대조하고 틀린 시도만 한 문장으로 센다 — 맞는 열쇠는 잠금과 상관없이 들어오고, 열쇠는 맞혀 볼 수 없는 길이라 대조 전 예약이 지키던 것이 없다(D-122, RK-041).
- **활동 갱신은 잠금을 풀지 못한다.** 요청이 세션을 읽은 뒤 쓰기 전에 다른 요청('지금 잠그기')이 끼어도 되돌리지 않게, 잠김은 `MAX`로만 올리고 시각들도 뒤로 돌리지 않는다. 푸는 것은 비밀번호 풀기와 잠금 끄기뿐이다(2026-10-14 독립 검토 지적, 시험 `app/test/worker/router-and-race.test.ts`).
- 오류 응답의 번호와 사유 코드: 400 `invalid_body`(본문 모양), 401 `unauthorized`(로그인 풀림)·`invalid_key`(틀린 열쇠), 403 `csrf`, 404·405, 409 `app_lock_off`, 413, 422 `invalid_pin`·`wrong_pin`·`pin_required`·`invalid_name`, 423 `app_locked`, 429 `key_locked`·`pin_resting`(+`Retry-After`), 500 `server_misconfigured`·`server_error`. 틀린 비밀번호를 422로 두는 것은 401(로그인 풀림)·403(CSRF)과 화면이 섞어 읽지 않게 하려는 것이다. 일기(2026-10-15): 400 `invalid_date`·`invalid_timezone`·`idempotency_key_required`, 409 `revision_conflict`(+`currentRevision`)·`not_draft`·`idempotency_mismatch`, 422 `invalid_text`·`invalid_category`·`invalid_emotion`·`invalid_intensity`·`invalid_reflection`·`invalid_resume`(+`field`)·`invalid_day_start`·`not_today`·`incomplete`(+`missing` — 흐름 순서의 단계 이름).
- 쓸 수 없는 cookie(기한 지남·기록 없음·서명 틀림)를 받으면 응답에서 그 cookie를 지운다.

### 11.8 검사

| 명령 | 하는 일 |
| --- | --- |
| `npm run lint` | Biome 2.5.15 — 미사용 변수·import 등을 error로, 경고도 실패(`--error-on-warnings`) |
| `npm run typecheck` | `wrangler types --check`(생성 타입 `app/worker/worker-configuration.d.ts`가 설정과 맞는지) → TypeScript 6.0.3 `tsc` 셋(서버·화면·시험) |
| `npm test` | 검사기 자체 테스트 → `vitest run`: 서버 시험은 Node에서 wrangler `getPlatformProxy`가 띄운 로컬 D1(workerd)에 마이그레이션을 적용하고 Worker의 `fetch`를 직접 부른다(시각은 시험이 옮긴다). 화면 시험은 happy-dom |
| `npm run build` | §11.2의 두 벌 빌드와 묶음 검사 |
| `npm run e2e` | Playwright Test 1.64.1로 같은 시나리오를 WebKit·Chromium에서(`playwright.config.ts`). 서버는 `app/scripts/e2e-server.mjs` — 개발용 묶음을 `wrangler dev --local-protocol https`(자가 서명)로 포트 8788·시험 전용 로컬 D1(`.wrangler/e2e-state`, 시작마다 비움)에 띄운다. 로컬 http에서는 WebKit이 `__Host-` cookie를 다시 싣지 않아 https다(2026-10-16 실측). `verify --mode full`에는 넣지 않고 CI의 Ubuntu `e2e` job이 돈다. 홈 화면 앱 모드·자판·앱 전환 화면·앱을 완전히 닫았다 열기는 대신하지 못한다 — 휴대폰 확인 `mobile-slice` |
| `node scripts/verify.mjs --mode quick` | 저장소 검사에 더해, 공개 저장소에 계정 단서가 없는지를 모양으로 본다 — 계정 하위 도메인이 든 `workers.dev` 주소, `wrangler*` 설정의 `database_id`·`account_id` 키(D-115 ①, Git 제외 `wrangler.local.jsonc`는 건너뛴다) |
| `node app/scripts/remote-check.mjs dev --tail --reset-dev-data` | 개발용 건물의 경로·헤더·로그인·잠금·오류 보고와 실시간 서버 기록(열쇠·비밀번호·이름·글 0건). 끝에 개발용 D1의 이름·잠금·세션을 **모두** 지운다 — 휴대폰 확인 중에는 돌리지 않는다 |

서버 시험을 Workers 런타임 안에서 돌리는 공식 플러그인(`@cloudflare/vitest-plugin`)은 쓰지 않았다 — 2026-08에 이름이 바뀐 새 패키지이고 Windows 지원이 문서에 없다(D-115 ⑥). 시험이 Node에서 도는 대신 런타임 차이는 개발용 건물의 원격 검사가 메운다.

### 11.9 경로·화면 주소·본문 한도를 넓히는 규칙

Phase 1a~Phase 2(`data-foundation`·`first-slice`와 직접 작성 흐름 — 2026-10-15 순서, D-116)가 새로 정하지 않고 경로만 더하면 되게 정해 둔다(2026-10-14 독립 검토의 '짓는 사람 시험' 지적 — 에이전트 결정, D-115의 세부).

- **서버 경로**: 경로 표(`app/worker/src/router.ts`)의 열쇠는 `"방식 /api/경로"`이고 경로 조각 하나를 `:이름`으로 받는다(예: `PUT /api/diaries/:date`, `POST /api/diaries/:date/complete`). 조각은 주소의 `/` 사이 한 칸이지만 URL 디코딩 뒤 값에는 어떤 글자든 올 수 있다(`%2F`면 `/`) — 그 값이 `ctx.params`로 처리기에 가고, **모양 검사(날짜 형식 `YYYY-MM-DD` 등)와 권한 검사는 반드시 처리기가 한다**(§3). 정확한 경로가 매개변수 경로보다 먼저 맞는다. 같은 경로에 그 방식이 없으면 405, 경로가 없으면 404다. 이 판정은 로그인(401)·CSRF(403)·잠김(423) **뒤**에 한다 — 로그인 전이나 잠긴 세션에는 어떤 경로가 있는지 알려 주지 않는다. 새 경로를 더해도 `app.ts`의 순서는 바꾸지 않는다.
- **화면 주소**: `#/이름` 뒤에 값이 필요하면 경로 조각으로 둔다(예: `#/record/2026-10-14`) — query(`?…`)는 한 화면 안의 상태(`?s=again`, `?step=` 같은 것)에만 쓴다. 화면 표(`app/client/src/lib/routes.ts`)는 정확한 이름과 날짜 값을 받는 `write/:date`·`record/:date`·`done/:date`(2026-10-16 첫 조각, D-123)를 안다 — 날짜는 달력에 있는 날짜만 받고, 라우터는 화면을 표의 이름(`name`)으로 찾는다. 개발용 상태 칸·오류 보고의 API 경로도 날짜 조각을 `_date`로 가린다(`maskApiPath`). 로그인이 풀려 돌아갈 자리(`returnTo`)에는 **값까지 든 화면 주소**를 두되 query는 버린다(열쇠는 원래 주소에 실리지 않는다 — §6). 값이 든 화면도 기록 규칙(UX_SPEC §17)은 같다. 개발용 오류 보고의 화면 칸(`route`)과 상태 칸에는 **값 조각을 빼고 화면 이름만** 싣는다(`record/2026-10-14` → `record`) — 기록 날짜 같은 값이 서버 기록에 남지 않게(§11.3·§11.5).
- **본문 한도**: 기본은 8KB(`MAX_BODY_BYTES`)이고, 더 큰 본문이 필요한 경로는 처리기가 `readJson(request, 한도)`로 넓힌다. 한도는 그 경로가 받는 칸들의 최대 길이(DATA_MODEL)로 계산해 정하고 한도를 넘으면 413이다. 일기 글의 칸별 최대 길이는 DATA_MODEL §2의 표이고(2026-10-15), 그 수로 계산한 일기 저장 경로의 한도는 160,768바이트다(`DIARY_MAX_BODY_BYTES`). 다른 경로는 8KB 그대로다.
- **로그**: 지금은 처리하지 못한 오류(500) 때 방식·경로·오류 이름만 남긴다. 일기 저장 경로(2026-10-15)에도 따로 남기는 기록은 없다 — 감사 기록 표를 두지 않기로 했다(D-122). §8의 구조화 로그(correlation ID 등)는 운영 문제를 가려야 할 때 같은 규칙(본문·cookie·메시지를 남기지 않는다)으로 더한다.
