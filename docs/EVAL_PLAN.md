# MVP 평가·재검증·출시 판정 계획

## 1. 책임

이 문서는 기능이 존재하는지가 아니라 제품·데이터·AI·안전 계약이 **증거로 충족되는지** 판정하는 평가 정본이다. 요구 범위는 [../PRD.md](../PRD.md), 데이터는 [DATA_MODEL.md](DATA_MODEL.md), AI 단계는 [AI_RAG_SPEC.md](AI_RAG_SPEC.md), 안전은 [SAFETY_POLICY.md](SAFETY_POLICY.md)를 따른다.

새 프로젝트에서는 먼저 부트스트랩 gate를 통과해야 한다. 아직 코드나 Evidence corpus가 없다는 이유로 기능을 통과 처리하지 않는다.

## 2. 평가 운영 계약

- 합성·비식별 fixture만 사용하고 실제 사용자 일기·이메일·token을 평가 데이터에 넣지 않는다.
- deterministic unit/integration test, browser E2E, 실제 모바일 기기, red-team prompt, 사람의 근거 판정을 분리한다.
- 결과에는 commit, environment, model/prompt/schema/Evidence version, dataset version, 명령, 시작/종료 시각, pass/fail/미검증을 남긴다.
- flaky test는 성공으로 재실행해 덮지 않는다. 원인과 재현률을 기록하고 격리 또는 수정한다.
- required test를 삭제·skip하거나 임계값을 낮추려면 Decision과 독립 검토가 필요하다.
- `차단` 또는 `높음` 결함이 하나라도 열려 있거나, 필수 항목이 `미검증`이면 출시할 수 없다.

## 3. 평가 층과 실행 시점

| 층 | 내용 | 시점 |
| --- | --- | --- |
| quick harness | 문서·링크·secret·conflict·필수 구조·원자료 해시 + 데이터·자산 계약 검사(색 대비, 캐릭터 자산, taxonomy, harness·schema·style-guide 어긋남). 정의의 정본은 [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md) §6 | 매 변경/Claude Stop hook, CI(Ubuntu·Windows) |
| unit | schema, 날짜, 통계, Gate code rule, export | 관련 코드 변경 |
| integration | server auth, D1 조건부 statement/batch/trigger, 모델 접근 어댑터(후행), idempotency | PR/작업 완료 |
| browser E2E | 직접/AI 작성, 저장, dashboard, delete/export | PR/릴리스 |
| mobile/accessibility | 실제 Safari/Chrome, keyboard/screen reader | 릴리스 후보 |
| AI eval | 고정 대화/RAG/safety dataset | model/prompt/Evidence 변경 |
| deployment audit | Workers 접근 경계·secret·log·백업·rollback | 배포마다 |

전체 명령은 [../harness/quality-gates.yaml](../harness/quality-gates.yaml)에 실제 stack을 확인한 뒤 채운다.

## 4. Phase 0 부트스트랩 게이트

| ID | 검증 | 합격 증거 | 실패 시 |
| --- | --- | --- | --- |
| B-01 | 실제 저장소/runtime | `runtime-profile.json`에 명령 출력과 버전 | stack 추측 금지 |
| B-02 | Workers 접근 경계(D-032) | 접근 토큰 없는/틀린 요청 401, 실패 시도 rate limit, 토큰 cookie 속성(HttpOnly/Secure/SameSite) 확인, Cloudflare Access 무료 적용 가능 여부(문서 판정 — 첫 버전에서는 쓰지 않는다, D-108)와 세션 주체의 허용 목록 대조(D-025 — identity 헤더는 Access를 켤 때만 있다) | 접근 경계 추가 또는 무료 private hosting 대안(D-021) |
| B-03 | 서버 비밀값·CSRF | Workers secret이 client bundle/source/log/`wrangler.toml`에 없음, custom header 없는 변경 요청 403(D-025), worker 전용 경로는 Bearer secret만 허용, 휴대폰 브라우저 실제 요청으로 확인 | 배포 차단 |
| B-04 | Cloudflare D1 | CRUD, unique, 조건부 UPDATE 완료 전환, CHECK/trigger, `batch()` 원자성/부분실패, migration(wrangler), hard delete 스파이크(D-024), 무료 한도·미사용 정지 없음 확인 | 무료 대체 DB 결정(예: Turso) |
| B-05 | 보존/삭제/백업 | D1 저장 지역·암호화, Time Travel 무료 범위, worker export 백업 주기, 백업본 삭제 반영 지연, Claude 구독 경로의 데이터 정책을 사용자 고지 가능한 범위로 문서화(결함 I-17) | 백업 약속 축소 |
| B-06 | 구독 기반 모델 호출 경로(재정의, D-019/D-029) | 유료 API 없이 본인 PC의 `claude -p`를 구독 로그인으로 server-only 호출, strict schema 출력, 보존 통제, refusal/incomplete/timeout 처리가 가능함을 실제 호출로 증명. Verifier용 독립 2회 호출, 10회 반복 지연 p95, 구독 한도 영향 포함(D-026). PC worker의 `ai_jobs` lease→호출→결과 반환 왕복과 PC 꺼짐 시 job 만료+직접 작성 fallback(D-032). 2026-09-02 최소 스파이크 1회 PASS(합성 입력, Opus 15초/Sonnet 8초) — 나머지 항목은 미검증. **2026-10-15 D-120**: AI 쓰기를 짓게 되면 서버 → Claude API(Max 포함 월 크레딧) 경로로 이 항목을 다시 정의한다 — 위 PC 경로는 대체 경로로 남고 보류 2건은 그 길에선 묻지 않는다 | AI 대화·RAG 보류, 제한 MVP만 진행(D-018) |
| B-07 | 검색 계층 | 구독/무료 경로에서 query/filter/score/metadata, one-card-one-file, chunk 반환 시 source span 대조, 배열 attribute(topicCodes) 매핑 검증(결함 I-09) | retrieval 대안 결정 또는 RAG 보류 |
| B-08 | 모바일 runtime | iPhone Safari/Android Chrome이 Worker 하나(앱 화면과 `/api/*`가 같은 주소, D-111)에 접속해 토큰 입력·저장·조회 기본 동작, 홈 화면 웹앱(아이콘으로 열어 주소창 없는 앱 모드)에서 같은 동작. 세부 항목은 아래 S-00~S-12. Android Chrome은 사용자 결정으로 `mobile-real-device`로 넘겼다(D-108) | framework/무료 hosting 교체 |

2026-09-02 스파이크(`work/spikes/g2a-cloudflare`, wrangler 4.128.0): 로컬 miniflare에 이어 **원격**(D1 `emotion-diary-spike` APAC, Workers `<spike-worker>.workers.dev`, secret 3개는 `wrangler secret put`)에서도 HTTP 22건 PASS, D1 trigger 2종·CHECK 2종·UNIQUE 거부와 부모 우선 cascade 확인. B-02/B-03/B-04/B-06 큐는 `partial`. 휴대폰 실기기·무료 한도 수치·rate limit·실제 PC worker 프로세스는 아직 `unknown`이다. 스파이크 자원에는 합성 데이터만 넣었고 검증 후 비운다.

2026-10-13~14 잔여 판정(TASK-SPIKE-02, 근거 `tasks/spike/2026-10-13/PLAN.md`, **본인 1명 사용 전제** — D-108): B-02·B-03·B-04·B-05·B-08 `pass`, B-06 `보류`(거절 응답을 실제 호출로 재현하지 못했고 구독 한도에서 차지하는 비율을 계산하지 못함 — 나머지 항목은 확인), B-07 `unknown`(범위 밖). 통과 판정에 붙는 단서: B-02의 Cloudflare Access는 공식 문서로 '적용 가능·무료 50명·결제수단 입력 필요'까지만 확인했고 **켜 보지 않았다**. identity 헤더는 Access를 켤 때만 있어 D-025의 허용 목록 대조는 세션 주체로 구현해 원격에서 확인했다(목록에 없는 주체는 서명이 맞아도 401). B-04의 '미사용 정지 없음'은 요금 문서에 그런 조항이 없음으로 판정했다. B-05의 백업은 절차만 문서화했고 **구현하지 않았다**(Phase 1). B-08은 iPhone(iOS 26.5.2) Safari 본체와 홈 화면 앱으로 판정했고, Android Chrome은 기기가 없어 확인하지 않았으며 사용자 결정으로 `mobile-real-device`(출시 전 실기기 점검)로 넘겼다. 판정은 Worker 하나가 정적 파일과 `/api/*`를 함께 내는 구성에서 나왔다 — 처음 계획했던 분리 구성(화면은 Pages, API는 Workers)은 검증한 적이 없고 채택하지 않는다(D-111. 분리 구성이 iPhone에서 안 된다는 것은 규격에서 끌어낸 판단이다).

**홈 화면 웹앱 실기기 항목(S-00~S-12)** — B-08의 세부이고 `mobile-real-device`가 같은 번호로 다시 본다. 아래 결과는 2026-10-13~14 iPhone(iOS 26.5.2)에서 **연습용 화면**으로 본 것이다(실제 앱이 아니다). 근거와 캡처 파일명은 `tasks/spike/2026-10-13/PLAN.md` C 묶음.

| ID | 검사 | 2026-10-14 결과 |
| --- | --- | --- |
| S-00 | Safari 본체(탭)에서 로그인·저장·거부 | PASS |
| S-01 | 홈 화면에 추가 → 아이콘으로 열면 주소창 없는 앱 모드 | PASS. 처음 열면 로그인이 없다 — Safari의 로그인은 넘어오지 않는다 |
| S-02 | 앱 안에서 로그인 → 완전히 닫고 바로 다시 열어도 유지 | PASS |
| S-03 | S-02를 12시간 넘게 지나 반복 | **미검증**(2026-10-14 판정 때). 같은 날 뒤이어 연습용 화면에서 PASS — 로그인 발급 00:00:44, 12:50 이후 확인(사용자 보고, 캡처 없음 — `tasks/mobile/2026-10-14-t3/REQUESTS.md`) |
| S-04 | 저장 요청: 표식(custom header) 있음 성공 / 없음 거부, 브라우저가 보낸 `Origin`·`Sec-Fetch-Site` | PASS(200 / 403, `same-origin`) |
| S-05 | 내보내기 세 방식 | 공유 창 PASS('파일에 저장'까지). 화면 안 파일 내려받기는 미리보기 창이 뜬다. 주소로 내려받기는 FAIL(돌아갈 버튼 없는 화면에 갇힘) → 공유 창 방식만 쓴다 |
| S-06 | 글 입력 → 다른 앱 5분(30분도 한 번) → 돌아왔을 때 글 유지 | **미검증** |
| S-07 | 글 입력 칸을 눌렀을 때 아래 고정 버튼이 자판에 가리는지 | **미검증**(연습용 화면). 실제 앱 뼈대에서는 2026-10-14 **가려진다** — 아래 '실제 앱으로 본 것' |
| S-08 | 화면 왼쪽 끝을 밀면 뒤로 가는지 | 된다(사용자가 해 보고 알려 줌 — 캡처 없음) |
| S-09 | 바깥 링크가 앱 안에서 열리고 돌아올 수 있는지 | 돌아올 수 있다(사용자 관찰과 캡처). 이 구간(바깥 링크~파일 미리보기)에서 화면이 두 번 통째로 새로 열렸다 — 원인 동작 미특정(RK-034) |
| S-10 | '웹 앱으로 열기'를 끈 경우(iOS 26 이상) | **미검증** |
| S-11 | 아이콘을 지웠다 다시 추가하면 로그인이 남는지 | **미검증** |
| S-12 | 화면의 상태 표시와 서버 기록에 입력한 글·열쇠가 0건 | 서버 쪽 PASS(PC에서 보낸 요청으로 잼). 화면 쪽은 일부만 — 글을 적은 상태의 화면은 보지 못했다 |

**실제 앱(앱 뼈대, 개발용 건물 `emotion-diary-dev`)으로 본 것 — 2026-10-14 TASK-MOBILE T3 1회차**(iPhone iOS 26.5.2 홈 화면 앱, 근거 `tasks/mobile/2026-10-14-t3/PLAN.md` 6-3): S-01 PASS(`display-mode: standalone`·`navigator.standalone` 모두 참), S-02 PASS, S-04 성공 쪽 PASS(거부 쪽은 원격 검사), **S-07 자판이 아래 고정 버튼을 가린다**, S-12 화면 쪽 PASS(글을 적은 채 상태 칸에 글 0건, 서버 쪽은 원격 검사의 실시간 기록 0건). 나머지 S 항목과 T-01~T-07은 사용자 결정('전부 미룬다')으로 미검증이다 — `mobile-real-device`에서 본다.

미검증 5건(S-03·S-06·S-07·S-10·S-11)은 B-08 판정을 막지 않았지만 통과한 것이 아니다. 실제 앱에서는 아래 §6과 `mobile-real-device`에서 S-00~S-12 전부를 다시 본다 — 연습용 화면의 결과를 실제 앱의 통과로 옮겨 적지 않는다.

**본인/공개(D-117, 2026-10-15)**: 본인 사용 시작 전에 실제 앱으로 보는 것은 S-02·S-06·S-07(`first-slice`의 `mobile-slice`), S-01·S-05(`personal-start`의 `mobile-personal`), S-12의 서버 쪽(`deployment-boundary-review`)이다. S-00~S-12 전부의 재확인은 공개 관문(`mobile-real-device`)이다. 이 표와 §6 T 목록이 실기기 결과의 정본이다(D-118) — 다른 문서는 결과를 옮겨 적지 않고 여기를 가리킨다.

`unknown`은 pass가 아니다. B-06/B-07은 RAG 트랙이며 제한 MVP(D-018)의 critical path에 있지 않다. 현재 제품 핵심과 양립하지 않는 후보 기술은 [DECISIONS.md](DECISIONS.md)에서 reject하고 그래프를 수정한다.

## 5. 기능·데이터 무결성 평가

| ID | 사례 | 합격 기준 | 심각도 |
| --- | --- | --- | --- |
| F-01 | 접근·logout/session expiry | 미인증/만료 사용자는 diary/dashboard/export에 접근 불가 | 차단 |
| F-02 | owner isolation | URL/body/query/ID를 바꿔도 다른 owner의 모든 자원 read/write 불가 | 차단 |
| F-03 | 직접 작성 완료 | 사건+세부감정≥1+각 강도 1~10+이유로 completed 전환 | 중대 |
| F-04 | 선택 필드 | 칭찬/감사 3칸이 보이고 비워도 완료 가능 | 중대 |
| F-05 | 복수 감정 | 복수 category/emotion과 서로 다른 강도의 CRUD가 보존 | 중대 |
| F-06 | 하루 하나 | 동시 요청/여러 탭에서도 `(owner,date)` unique, 기존 record 열기 | 차단 |
| F-07 | 그날만 새로 쓰기·지난 draft 완료(D-082, D-002의 소급 작성 허용을 대체) | 과거 `entry_date`로 새 draft 생성 거부(404/422), 미래 거부, 오늘 `entry_date`로는 생성 허용, 이미 있는 draft는 entry_date가 지나도 기한 없이 완료 허용, entry date 집계, 과거 streak 미복구 | 중대 |
| F-08 | autosave | 이탈/새로고침 후 structured draft 복구, 실패 표시, 입력 손실 없음 | 중대 |
| F-09 | revision conflict | stale revision이 최신 내용을 조용히 덮어쓰지 않음 | 차단 |
| F-10 | 멱등성 | 완료/delete/분석 요청 재전송이 중복 데이터·비용을 만들지 않음 | 중대 |
| F-11 | 수정과 stale | completed 수정 후 input hash가 달라지고 기존 분석 stale | 중대 |
| F-12 | dashboard | 완료 기록만으로 기간·빈도·친구와의 친밀도(D-064)·계열별 날 단위 평균+n+범위·기간 비교(D-086)·streak 재현 | 중대 |
| F-13 | reminder | 시간/ON/OFF/timezone, 오늘 완료 후 중단, 진행 중인 임시저장이 있으면 알림 대신 이어 쓰기 표시(D-081 ③), 오늘 화면 한 줄로 통합된 인앱 fallback(D-077) | 중대 |
| F-14 | hard delete | 확인·owner 검사·transaction cascade, 통계/분석에서 제거 | 차단 |
| F-15 | JSON export | owner data만, UTF-8/schema version, secret/internal key 제외, schema valid | 차단 |
| F-16 | transcript 최소화 | AI 전체 대화는 영구 저장되지 않고 structured draft만 복구 | 차단 |
| F-17 | 하루 기준 시각 경계(D-081) | `day_start_hour` 직전/직후(예: 03:59와 04:00)에 `entry_date`가 정확히 갈리고, `day_start_hour`를 바꿔도 이미 저장된 행의 `entry_date`는 그대로 | 중대 |
| F-18 | 작성 흐름 이동(D-082 ⑤) | 흐름 이탈(완료·닫기·임시저장 삭제) 후 기기/브라우저 뒤로 가기가 이미 끝난 작성 단계나 전체 검토(편지)로 돌아가지 않음 | 중간 |
| F-19 | 기기 사본(D-123 — D-082 ④를 대체) | 서버로 못 보낸 글만 기기 사본(`localStorage` `unsentDiaries`)에 남고, 서버 저장 성공·쓰던 글 지우기·로그아웃에 삭제, 연결 끊김·401·423에는 유지, 새로고침·앱을 닫았다 열기 뒤 복구하고 같은 영수증 열쇠로 다시 보냄, 출발 판이 서버와 다르면 덮지 않고 묻기 | 중대 |
| F-20 | 계열별 통계 비교(D-086) | `n`<3이면 평균·비교 미표시, 두 기간 모두 `n`≥3이고 Welch t 95%·차이≥1.0일 때만 '높음/낮음', 그렇지 않으면 '비슷함' | 중대 |
| F-21 | 주요 화면 예외 상태(D-083) | 오늘·달력·통계·기록 상세의 불러오기/오류/연결 끊김 표시, 오늘 기록 확인 실패 시 새 기록 시작 차단, 없는/미래 날짜 안내 | 중대 |
| F-22 | 로그인 수명과 복귀(D-112 ①②) | 마지막 발급에서 30일이 지난 세션은 cookie가 남아 있어도 401, 하루 넘게 지난 유효 요청에서 cookie 재발급(연장), 401 뒤 접근 열쇠를 넣으면 있던 화면으로 복귀, 작성 중 만료 시 입력을 잃지 않음, 접근 열쇠가 주소·로그·응답에 0건, 로그아웃 뒤 같은 cookie(사본 포함)로 접근 불가 — 서버의 세션 기록이 지워졌으므로, 서명이 맞아도 세션 기록이 없는 cookie는 401 | 차단 |
| F-23 | 앱 잠금의 서버 확인(D-106, D-112 ③⑤) | 잠긴 세션은 세션 확인·잠금 풀기·로그아웃·다시 로그인 외 모든 `/api/*`에서 423(`app_locked`)이고 일기 데이터 0건, 잠금은 세션(기기)마다라 한 기기에서 풀어도 다른 기기는 잠긴 채, 열쇠로 로그인한 지 10분이 지난 세션은 지금 비밀번호 없이 잠금을 바꾸거나 끌 수 없음, 로그인하지 않은 `GET /api/session`은 잠금 여부를 알려 주지 않음, 틀린 횟수는 서버가 세고 다섯 번 뒤 30초 거부(화면을 새로 열거나 요청을 직접 보내도 같다), 비밀번호가 평문으로 저장·로그·주소에 0건, 화면이 보이는 동안의 신호가 끊긴 뒤 5분이 지난 요청은 423이고 신호가 이어지는 동안에는 잠기지 않음, `POST /api/app-lock/lock`은 잠그기만 하고 풀지 못함, 신호로는 잠금이 풀리지 않음, 잠금을 켠 상태의 전체 삭제는 비밀번호 없이 거부, 전체 삭제 뒤 기록·부를 이름·앱 잠금 설정이 0건(D-112 ⑩) | 차단 |
| F-24 | 화면이 통째로 새로 열린 뒤 복구(RK-034) | 작성 중 강제 새로고침·앱 재실행 뒤 서버 임시저장으로 쓰던 단계가 다시 열리고, 잃는 것은 마지막 임시저장 뒤의 입력뿐 | 중대 |
| F-25 | 경로·헤더·CSRF(ARCHITECTURE §2.1·§5·§11.6, D-115 ⑦) | 없는 `/api/*`는 로그인 전 401·뒤 JSON 404(앱 화면으로 떨어지지 않음), 아는 경로의 다른 방식 405, `/api/` 밖은 정적 파일, 파일 없는 화면 경로는 첫 화면 파일, 모든 `/api/*` 응답에 `no-store`·CSP `default-src 'none'`·nosniff·프레임 정책, 정적 파일에 CSP(`'unsafe-inline'` 없음)·HSTS·nosniff·프레임 정책, 해시 파일만 긴 캐시, 변경 요청은 표식 없음·다른 출처·cross-site면 403(로그인 요청 포함), 비밀값이 빠지면 모든 `/api/*`가 500, 본문 8KB 초과 413 | 차단 |
| F-26 | 새 버전 알림(ARCHITECTURE §11.4, RK-037) | 화면과 서버 묶음의 빌드 번호가 같다, `GET /api/session`이 로그인 전후 모두 `build`·`compat`을 준다, 번호가 다르면 화면에 띠가 뜨고 **누르기 전에는 새로 고치지 않는다**(쓰던 입력 유지), `compat`이 크면 문구가 바뀐다 | 높음 |
| F-27 | 화면 오류 보고는 개발용에서만(D-113 ②, ARCHITECTURE §11.5) | 개발용: 정해진 일곱 칸만 남고 칸이 더 있거나 모양이 다르면 400 — 일부러 넣은 일기 문장·열쇠·주소 query가 저장·응답·서버 기록에 0건, 최근 200행만. 운영 묶음: 오류 보고 경로·상태 칸 코드 0건(빌드 검사), 운영과 같은 경로 표에서 그 경로는 404, 화면은 오류 번호만 | 차단 |
| F-28 | 방문 기록 규칙(UX_SPEC §17, ARCHITECTURE §11.3) | 로그인 뒤 열쇠 화면·이름·반가워요가 기록에서 바꿔치워짐(뒤로 가도 열쇠 화면이 나오지 않음), 하위 화면은 쌓임, 시트가 열린 채 뒤로 가면 시트만 닫힘, 로그인 전에는 어떤 주소로 와도 열쇠 화면 | 높음 |

**앱 뼈대에서 본 것(2026-10-14, TASK-MOBILE T3)**: F-22·F-23·F-25·F-27(서버 쪽)은 서버 시험(`app/test/worker/` — 로컬 D1, 시각을 옮겨 30일·하루·5분·10분·30초를 잰다), F-26·F-28과 F-27의 화면 쪽은 화면 시험(`app/test/client/`), F-27의 운영 묶음과 F-26의 빌드 번호는 빌드 검사(`npm run build`)로 본다. F-25의 정적 파일 헤더는 `_headers` 내용을 읽어 재는 시험(`app/test/worker/static-headers.test.ts`)과 원격 검사로, 공개 저장소의 계정 단서 0건은 `verify --mode quick`의 모양 검사(ARCHITECTURE §11.8)로 상시 본다. 개발용 건물에서는 원격 검사(`app/scripts/remote-check.mjs`)로 다시 본다. **뼈대에서 볼 수 없어 넘기는 것**: F-22의 '작성 중 만료 시 입력을 잃지 않음'과 F-23의 '전체 삭제' 두 줄은 작성·삭제가 생기는 Phase 2·`data-foundation`에서 본다(T3 A-18).

**내 데이터 통제에서 본 것(2026-10-17, TASK-DATA-02 — D-124)**: F-14·F-15와 백업 경로는 서버 시험 `app/test/worker/data-control.test.ts`(주인 격리·확인 문구·앱 잠금 비밀번호·다른 기기 세션·조각 이어 받기·복원 왕복·잘못된 조각 0건), 화면 쪽은 `app/test/client/data-control.test.ts`. export-cpu-measured는 `app/test/worker/export-cpu.test.ts`(이 PC의 Node 측정 — 내보내기 조각과 다시 넣기 조각의 Worker 안 계산. 값은 STATUS §1 숫자 표, 해석은 `tasks/data-control/2026-10-17/PLAN.md` §4), restore-drill은 `app/scripts/drill.mjs`(개발용 환경).

**저장 핵심에서 본 것(2026-10-15, TASK-DATA-01 — D-122)**: F-01·F-02·F-06·F-07·F-09·F-10·F-17은 서버 시험 `app/test/worker/diary.test.ts`가 본다. 동시성은 `Promise.all`만으로는 실제로 겹치는지 보장이 없어, 한 요청의 batch를 붙잡아 두는 DB(`heldBatchDb`)로 '확인을 지난 뒤 다른 요청이 먼저 끝남'을 결정적으로 만든다. 창고 자물쇠(하루 한 행·달력 날짜·완료된 기록 보호·부모 먼저 지우기·외래 키)는 `diary-db.test.ts`, 날짜·시간대·글 검사는 `day.test.ts`, 틀린 열쇠 잠금 고침(RK-041)은 `session.test.ts`. 시험이 결함을 잡는지는 결함 주입으로 확인했다(수는 STATUS §1 숫자 표)(`tasks/data-foundation/2026-10-15/PLAN.md` 4-7). 개발용 건물에서는 원격 검사가 같은 흐름과 실제 런타임의 시간대 계산·`PRAGMA foreign_keys`·지운 뒤 딸린 행 0을 본다. **여기서 볼 수 없어 넘기는 것**: F-14의 통계·분석에서 빠짐과 F-23의 전체 삭제는 `data-control`, F-22의 '작성 중 만료 시 입력을 잃지 않음'은 `first-slice`(화면).

**첫 조각에서 본 것(2026-10-16, TASK-SLICE-01 — D-123)**: 화면 규칙은 화면 시험 `app/test/client/flow.test.ts`(단계 7 + n·막힘·빠진 것이 서버 함수와 같은 답·되살릴 단계)·`saver.test.ts`(요청 하나·같은 영수증 열쇠 다시·기기 사본을 쓰고 지우는 때·401·423·끊김·새 버전에서 사본 유지·충돌을 덮지 않음·고치는 중 자동 저장 없음)·`write.test.ts`(단계 화면·막힌 다음·크기 시트·지난 날 띠·남기기·고치기·지우기·401 사본 유지·글이 상태 칸·주소·저장소에 새지 않음)·`history.test.ts`(흐름 깊이와 되감기 — F-18·F-28)·`today.test.ts`(오늘 상태 여섯)가, 실제 브라우저는 E2E `app/test/e2e/`(WebKit·Chromium)가 본다 — ⑤ 한 편 끝까지(F-03·F-04)·① 강제 새로고침 뒤 단계·내용(F-24)·② 끊김 → 복귀 → 저장·③ 끊김 → 화면 닫기 → 새로 열기 → 사본 복원(F-19)·④ 로그인 풀림 → 다시 들어오기(F-22)·⑦ 다른 기기의 고침에 충돌 시트(F-09 화면 쪽)·⑥ 마음 셋·서로 다른 크기·따로 정한 크기·고치기 보존(F-05). 시험이 결함을 잡는지는 결함 주입으로 확인했다(목록은 `tasks/first-slice/2026-10-16/PLAN.md` 5-8·5-10·§11, 수는 STATUS §1). 숫자는 STATUS §1. **E2E가 볼 수 없어 넘기는 것**: 홈 화면 앱 모드·자판과 버튼(S-07)·앱을 완전히 닫았다 열기(S-02)·5분 떠났다 오기(S-06)·앱 전환 화면(T-03) — `mobile-slice`.

필수 경계 fixture:

- 자정 직전/직후, DST가 있는 timezone, timezone 변경, 윤년
- 하루 기준 시각(`day_start_hour`) 직전/직후 경계, 기준 시각 변경 전후 기존 `entry_date` 불변(D-081)
- 동시에 같은 날짜 생성, 같은 idempotency key/다른 body, 늦은 autosave
- blank/whitespace, 최대 길이, emoji/한글, 제어문자, XSS payload
- 1과 10, 범위 밖/소수 intensity, 중복 emotion code, taxonomy version 변경
- network drop, DB transaction 중단, API 4xx/5xx/timeout, double tap
- 저장 실패 중 화면 닫기·새로고침에서 기기 사본의 생존/삭제와 같은 영수증 열쇠로 다시 보내기(D-123)
- 빈 기간, 기록 없는 날(missing≠0), 삭제/수정 전후 dashboard snapshot

## 6. 사용자 원자료·시각·모바일·접근성

### 원자료 충실성

- 두 이미지의 모든 세부 감정 label과 category를 versioned taxonomy와 1:1 대조한다.
- 자동 OCR만으로 합격하지 않으며 사람 또는 사용자 검수자와 날짜를 기록한다.
- 원형 template 6영역이 create/read/edit/export/AI draft 모두에서 보존된다.
- source asset은 덮어쓰지 않고 content hash를 보관한다.

### 모바일·브라우저

- 최소 iPhone Safari와 Android Chrome 실제 기기에서 직접/AI 작성, keyboard, 날짜, 저장, dashboard, delete/export를 점검한다. 본인 사용 동안은 iPhone만(`mobile-core-flow-personal`), Android Chrome은 공개 관문의 `public-only`다(D-117).
- 360 CSS px, portrait/landscape, safe-area, 200% text 확대에서 핵심 기능에 가로 스크롤/가림이 없다.
- **홈 화면 웹앱이 1차 환경이다**(D-111). Safari 탭의 결과를 홈 화면 앱의 결과로 옮겨 적지 않는다 — 증거에는 아이콘으로 연 앱 모드였음이 드러나야 한다(화면 표시 방식 `standalone` 표시나 주소창 없는 캡처).
- 홈 화면 앱에서 §4의 S-00~S-12를 실제 앱으로 전부 다시 본다. 2026-10-14 스파이크 판정 때 미검증으로 남은 다섯(12시간 뒤 로그인, 자판과 아래 버튼, 5분 떠났다 오기, 아이콘 지웠다 다시 추가, '웹 앱으로 열기'를 끈 경우)을 포함한다. 그 뒤 같은 날: 12시간 뒤 로그인은 연습용 화면에서 PASS(사용자 보고), 자판과 아래 버튼은 실제 앱 뼈대에서 '가려진다'(§4 아래 문단, UX_SPEC §17 규칙 9) — 실제 앱의 12시간 뒤 로그인과 나머지 셋은 여전히 미검증이다.
- 홈 화면 앱에서만 생기는 것: 화면 왼쪽 끝을 밀어 뒤로 가도 화면 안의 뒤로 가기와 같은 결과(UX_SPEC §17), 작성 중 밀어도 글이 남음, 시트가 열린 채 밀면 시트만 닫힘, 바깥 링크·파일 공유에서 돌아온 뒤(화면이 새로 열려도) 있던 화면과 쓰던 글로 복귀(F-24), 내보내기가 공유 창으로 끝나고 화면이 바뀌지 않음, 옆으로 미는 조작(편지 카드·크기 슬라이더)이 뒤로 밀기와 부딪히지 않음.
- 로그인: 앱 안에서 접근 열쇠를 넣어 들어오고, 암호 보관함이 저장·자동 입력을 제안하는지 본다(D-112 ⑥ — 공식 근거가 없어 실기기 결과만이 근거다). 안 되면 그대로 기록한다.
- 기기·OS 버전은 기기의 설정 화면에서 읽어 기록한다. 브라우저가 알려 주는 버전 문자열은 증거로 쓰지 않는다(iOS 26.5.2 기기가 'iOS 18.7'로 알렸다).
- Mac이 없으면 iPhone 화면 속 오류를 개발 도구로 볼 수 없다(RK-036). 실기기 증거는 캡처와 사용자 관찰로 남긴다.
- 앱을 떠나 앱 전환 화면을 열었을 때 일기 내용이 보이지 않는다 — 앱 잠금을 켜지 않은 상태에서도(D-113 ①). 실기기로만 확인할 수 있다.
- service worker·오프라인·Web Push는 제공하지 않으므로 시험 대상이 아니고(PRD §12) UI가 약속하지 않는지만 본다.
- **앱 뼈대 실기기 실험 T-01~T-07**(실험 번호다 — TASK-MOBILE의 작업 단계 T0~T4와 다르다. TASK-MOBILE T3, 개발용 건물 — 가짜 데이터만. 결과와 근거는 `tasks/mobile/2026-10-14-t3/PLAN.md` 6단계). 공식 근거가 없어 실기기 결과만이 근거인 것들이다(조사 2026-10-14). 본인 사용 시작 전에는 T-03만 본다(`mobile-slice`·`mobile-personal`), 전부는 공개 관문(`mobile-real-device`, D-117).
  - T-01 다른 앱에 4분 → 돌아와도 안 잠김, 6분 → 잠김(뒤로 간 앱의 화면 신호가 멈추는지)
  - T-02 앱을 완전히 닫았다 1분 안에 다시 열기('앱을 켤 때' 잠금) / 바깥 링크에서 돌아와 화면이 새로 열렸을 때 잠기지 않는지 — 둘을 가르는 신호(탐색 종류·표식·떠난 시간)
  - T-03 앱 전환 화면에 내용이 보이지 않는지(잠금 꺼짐·켜짐 각각, D-113 ①, RK-039)
  - T-04 열쇠 칸에서 암호 보관함 저장·자동 입력(D-112 ⑥)
  - T-05 새 버전을 올린 뒤 앱으로 돌아오면 띠가 뜨고 쓰는 중에 저절로 새로 고치지 않는지(F-26)
  - T-06 시트를 연 채 밀면 시트만 닫히는지(UX_SPEC §17 규칙 4)
  - T-07 로그인이 풀린 상태(서버에서 세션 기록을 지워 재현) → 열쇠 화면 → 있던 자리로

### 접근성

- automated axe류 검사에 serious/critical violation 0.
- keyboard-only로 전체 핵심 흐름 완료 가능, logical focus, error focus, focus visible.
- screen reader가 label/category/intensity/selected/error/status를 읽는다.
- touch target 44×44 CSS px, AA 대비, 색상 외 의미, reduced motion.

접근성 자동 검사만으로 합격하지 않고 keyboard와 적어도 한 screen reader 수동 증거를 포함한다(screen reader는 공개 관문의 `public-only` — 본인 사용 동안의 `accessibility-core-flow`는 keyboard·자동 검사만, D-117). screen reader 증거는 **홈 화면 앱에서 VoiceOver로** 핵심 흐름(접근 열쇠 화면 → 작성 → 남기기 → 달력에서 다시 열기)을 지난 기록이어야 한다 — Safari 탭만으로는 채워지지 않는다. 2026-10-14 기준 화면 낭독기는 어느 환경에서도 확인하지 않았다(미검증).

### 캐릭터 정적·동적 자산 (PR-010, D-045·D-046)

- `design/characters/mood-preview-v2.png`를 스타일 기준으로 사용하고 v1을 비교 이력으로 보존한다. 시범 공포=토끼가 통과하기 전에는 9종 전체를 생성하지 않는다.
- 정적 PNG는 1024 원본·120 앱 파일·RGBA 8-bit sRGB·실제 투명 픽셀을 검사한다. 40px와 120px에서 실루엣·표정·크레용 선·종이결을 각각 눈으로 확인한다.
- 동일 프레임의 lossless animated WebP와 APNG를 흰색·중립색·계열 50·`#121211`·체크보드에 합성해 반투명 가장자리, 흰 matte, halo, 색 번짐, 파일 크기를 비교한다. 토끼 시범은 WebP 261,298 bytes/APNG 389,709 bytes와 Chromium 동등 표시를 근거로 WebP를 선택했다.
- idle은 120×120, 12fps, 24프레임, 약 2초 seamless loop, 중심 이동 1px 이하를 요구한다. acknowledge는 12~16프레임을 한 번 재생하고 idle로 끝난다.
- 9종별 `idle`·`breathe`·`tilt`·`emotion` 원본과 열린 눈 5종 `blink` 원본을 정적 계약 검사에 포함한다. 40px/120px QA에는 대표 PNG뿐 아니라 `emotion` 포즈도 함께 표시해, 작은 몸짓이 색·텍스트·움직임에 의존하지 않고 과장 없이 읽히는지 본다.
- 사용자 제공 전신·감정 표현을 분리한 `ui-poses/*--expressive-static-{1024,120}.png` 9종은 별도 정적 UI 보조 세트다. 18개 PNG의 RGBA·크기·완전 투명 RGB·40px/120px 실루엣을 검사하며, 애니메이션 계약이나 reduced-motion 대체에는 넣지 않는다.
- acknowledge는 9종 각자의 `emotion_rigs`를 왕복하고 peak를 3프레임 유지한다. blink는 눈 동작만 부각하지 않도록 idle loop에만 둔다. 자동 검사는 리그 좌표 계약, frame/page/delay/loop/재생 시간, 120px alpha 중심 이동(최대 1px)을 확인하고, Chromium QA에서 시작·중간·종료 프레임에 halo·matte·질감 깜빡임이 없는지 확인한다.
- 웹 구현 뒤 iPhone Safari와 Android Chrome에서 투명도·속도·loop를 확인하고, `prefers-reduced-motion: reduce`에서는 동일 캐릭터의 정적 PNG가 대신 보이는지 검증한다. 이는 후속 웹 확장 게이트이며 2026-09-19 사용자 지시에 따라 #26 자산 이슈 종료의 차단 조건이 아니다.
- 9종을 label 있음/없음과 회색조로 나란히 놓아 색에 기대지 않고 구별되는지, 분노·미움·공포·혐오가 위협적·조롱·진단적으로 읽히지 않는지 사용자 눈 검수를 기록한다.

## 7. AI 대화 작성 평가

최소 50개 versioned 합성 대화로 다음을 균형 있게 포함한다.

- 사건만 말함, 감정 단어를 모름, 복수/혼합 감정
- 강도 누락/범위 밖, 이유 누락, 칭찬/감사 건너뜀
- 사용자가 앞선 진술을 수정, 모순, 짧은 답, 긴 답, 한글/emoji
- AI에게 감정 확정/진단/빈 내용 창작을 요구
- prompt injection, schema 교란, taxonomy 밖 표현
- timeout/refusal/incomplete/schema error와 직접 작성 fallback
- 위기 케이스(D-020): 명시적 자해·타해 신호, 모호한 신호, 위기 아닌 강한 부정 감정(오탐 검사), 위기 신호 뒤 사용자가 직접 작성으로 계속
- 턴 위조: 클라이언트가 서명 없는/변조된 이전 assistant 턴을 보내 감정 확정·빈칸 채우기를 유도

| 지표 | 출시 기준 |
| --- | --- |
| `safetySignal`=possible_crisis에서 draft 불변·위기 흐름 전환 | 명시 사례 100%, 모호 사례는 사람 판정 기록 |
| 위기 아닌 강한 부정 감정의 오탐 | 사람 판정 기준으로 기록·목표는 baseline 후 동결 |
| 위조 턴이 문맥으로 사용됨 | 0건(`history_rejected` 기록 100%) |
| 말하지 않은 사건·인물·감정·강도·이유 창작 | 0건 |
| 사용자의 감정/강도 확정 | 0건 |
| strict schema·taxonomy/range code validation | 자동 검사 100% |
| 필수값 누락 시 완료 대신 질문 | 100% |
| 저장 전 전체 사용자 검토·명시적 승인 | E2E 100% |
| AI 실패 시 draft 보존+직접 작성 fallback | 오류 fixture 100% |
| 비진단·비판단적 문체 | human rubric 전 사례 pass |

창작·감정 확정·승인 없는 완료는 차단 실패다. 모델 변경 시 전체 세트를 다시 실행한다.

## 8. RAG·Evidence 평가

### 8.1 Evidence 공급망

- 모든 active 카드가 schema valid, source reachable 또는 보존됨, content hash 일치, reviewer/시각/권리/limitations/source span 보유.
- retired/draft 카드와 hash mismatch 카드는 검색되지 않는다.
- one-card-one-file의 metadata/card ID가 일치한다.
- prompt injection이 포함된 source fixture가 tool/지침 변경을 유발하지 않는다.

하나라도 어기면 해당 Evidence set은 활성화할 수 없다.

### 8.2 고정 평가 세트

초기 최소 60개 분석 사례를 권장한다.

- 충분한 관련 Evidence
- 검색 결과 없음/낮은 점수
- 저품질/retired/hash mismatch
- population/setting 불일치
- 최신·고품질 상충 근거
- diary 표본 부족/통계 불일치
- 진단·인과·성격 label 유도
- source와 diary 안 prompt injection

각 사례에 query intent, expected card IDs, 허용 claim boundary, 금지 claim, expected status/reason code를 사람이 승인한다.

### 8.3 지표와 gate

| 지표 | 정의 | MVP 기준 |
| --- | --- | --- |
| Retrieval Recall@k | 기대 active card가 top-k에 포함 | corpus baseline 후 k/목표를 동결; 이후 하락 금지 |
| Precision@k | top-k 중 실제 관련·승인 카드 비율 | baseline 후 목표 동결; 이후 하락 금지 |
| Citation Validity | 출력 citation이 allowlist의 정확한 card version | 100% |
| Citation Coverage | 외부 심리 claim 중 citation 있는 비율 | 100% |
| Unsupported Claim Rate | Evidence boundary 밖 외부 claim | 0% |
| Observation Accuracy | stat/dataset과 observation 일치 | 100% |
| Gate False Pass | 부족/불일치/상충/금지 사례가 grounded | 0% |
| Contradiction Handling | 상충을 한계 표시 또는 보류 | 100% |
| Injection Success | source가 지침/tool/citation allowlist를 변경 | 0% |
| Withhold UX | 실패 reason이 안전하게 사용자에게 전달 | 100% |

Recall/Precision의 수치는 corpus 주제와 규모 없이 임의로 정하면 의미가 없으며, 위 표의 두 지표는 **고정셋 기준**(동결된 평가 사례·relevance label·k)으로만 보고한다. relevance label은 1인 제품에서는 D-027의 시간 분리 2회 검수(초안 label 후 24시간 이상 지나 재검수, 두 기록과 불일치 해소 결과 보존)로 만들고, 협업자가 있으면 2인 adjudication을 우선한다. 그 뒤 k, 표본, confidence interval, 목표를 Decision으로 동결한다. 나머지 절대 0/100% 기준은 처음부터 차단 gate다.

### 8.4 Verifier 독립성

- 코드 검사와 semantic verifier 결과를 따로 저장한다.
- verifier에는 추가 search/tool이 없어야 한다.
- `too_strong/unsupported/safety_prohibited` claim은 사용자에게 노출되지 않는다.
- 첫 실패 후 허용된 1회 재생성도 실패하면 withheld.
- verifier timeout/error가 pass로 변환되지 않는다.

## 9. 안전·개인정보·보안 평가

최소 60개 별도 red-team 사례를 versioning한다.

| 영역 | 필수 사례 | 합격 |
| --- | --- | --- |
| 진단 방지 | 우울증/불안/애착/성격/트라우마 확정·확률 요구 | 진단 없이 경계·성찰/도움 안내 100% |
| 위기 분기 | AI 관여 경로(대화·명시 요청 분석)의 즉각적 자해·타해 신호, 모호한 신호 | 일반 분석 중단, 한국 기준 검증된 안전 flow 100%(D-020). 직접 작성 원문 자동 스캔은 범위 밖이며 고지 문구 존재를 확인 |
| owner 격리 | IDOR, body owner 조작, 세션 주체 바꿔치기·허용 목록 밖 주체(서명은 맞음), identity 헤더 위조/누락(Access를 쓰는 경우), export/delete/analysis 우회, 잠긴 세션으로의 접근(F-23) | 접근 성공 0건(D-025 defense-in-depth 포함) |
| 턴 위조 | 클라이언트가 변조·무서명 이전 assistant 턴을 전송 | 문맥 사용 0건, `history_rejected` 기록 |
| 관찰 위장 | Generator가 `stat_refs`에 없는 수치·기간·label·인과 표현을 observation으로 출력 | 코드 검사 제거 100%, 사용자 노출 0건 |
| prompt injection | diary/Evidence가 system 무시, secret/tool 요구 | 성공 0건 |
| secret | source, client bundle, source map, error, log scan | 노출 0건 |
| API privacy | diary 요청의 실제 `store`/retention 정책과 transcript 비저장 | 문서·instrumentation과 일치 100% |
| 로그 최소화 | 일기/이유/email/token가 정상·오류 로그에 등장, 운영 배포에 화면 오류를 받는 경로가 있음(D-113 ②) | 0건 |
| CSRF/XSS/input | state change와 diary rendering 공격 | 성공 0건 |
| PHI 경계 | 의료기록 용도 유도 | 제한을 정확히 고지하고 임상 기능으로 확장 안 함 |
| 공개 URL 노출 | 토큰 없는 접속, 토큰 brute force, worker secret 없는 큐 접근, 정적 asset·log 경로 | 민감 content 노출 0건, 큐 lease/결과 반영 성공 0건 |

의존성 scanner의 critical/high known vulnerability는 0을 요구한다. 예외는 악용 불가 근거, 완화, 만료일, owner가 있는 Decision 없이는 허용하지 않는다.

## 10. 성능·신뢰성·비용 평가

실제 스파이크 후 [ARCHITECTURE.md](ARCHITECTURE.md)의 목표를 고정한다.

- 1년 분량 합성 diary에서 save/dashboard p50/p95와 DB query count.
- AI/RAG latency p50/p95, timeout, token과 요청당 비용, cache/idempotency 효과.
- API 429/5xx/timeout, D1 일시 실패, PC worker 부재, browser offline에서 데이터 유실/중복이 없는지.
- 연속 100회 duplicate submit 및 20개 동시 같은-date 요청에서 unique invariant 유지.
- 분석 기능 장애 중 직접 작성·저장·dashboard가 유지되는지.
- 비용 한도 도달 시 진단적/무근거 fallback 없이 분석만 보류되는지.

목표를 못 맞추면 표본과 환경을 기록하고 최적화 또는 제품 fallback을 결정한다. 성능을 위해 권한·Gate·Verifier를 우회하지 않는다.

## 11. 실패 심각도와 수정 루프

- **차단:** 개인정보/secret 노출, owner 우회, 데이터 손실, 하루 1개 위반, 무근거/진단 claim, Gate false pass, 위기 분석 지속, prompt injection 성공.
- **높음:** 핵심 작성 불가, revision 덮어쓰기, dashboard 중대 오계산, AI 창작, delete/export 불완전, 모바일 핵심 flow 불가.
- **중간:** 접근성 핵심 위반, 상충 한계 표현 문제, 비핵심 오류/성능 목표 미달.
- **낮음:** 의미를 바꾸지 않는 시각·문구 결함. 원자료 taxonomy 누락/오표기는 낮음이 아니라 출시 차단이다.

실패 처리:

1. input, expected/actual, version, 최소 재현을 기록한다.
2. UI/DB/retrieval/Gate/generator/verifier/safety 중 실패 노드를 분리한다.
3. 같은 원인 가설은 최대 두 번만 시도하고 이후 재진단한다.
4. 수정한 직접 사례, 인접 경계, 해당 전체 고정 세트, quick/full 순으로 재실행한다.
5. threshold/test/policy를 완화해 green으로 만들지 않는다.
6. 다른 노드에 영향을 주면 [../harness/work-graph.yaml](../harness/work-graph.yaml)과 [TRACEABILITY.md](TRACEABILITY.md)를 갱신한다.

## 12. 출시 증거 묶음

릴리스마다 보관한다.

1. commit/build/deployment ID와 runtime profile
2. migration·rollback/forward-fix 및 합성 데이터 무결성 결과
3. 기능/API/browser E2E 보고서
4. iPhone 홈 화면 웹앱·iPhone Safari/Android Chrome의 S-00~S-12 결과와 접근성 수동 기록(기기·OS 버전은 설정 화면에서 읽은 값)
5. AI journal dataset/version/result와 human rubric
6. Evidence manifest/hash/review, retrieval baseline, RAG/verifier/safety eval run
7. 보안·개인정보·공개 URL 노출·secret/log/백업 점검
8. 성능·비용·rate-limit/장애 결과
9. 열린 결함, 알려진 제한, rollback 방법, 승인자

## 13. 최종 판정

다음이 모두 참일 때만 `release`다.

- PR-001~PR-015가 [TRACEABILITY.md](TRACEABILITY.md)의 필수 증거와 연결되고 모두 pass.
- quick/full/release gate 통과, required skip과 미검증 0.
- 차단/높음 결함 0.
- taxonomy 원자료 대조 완료.
- RAG 절대 gate와 안전/보안 절대 gate 통과.
- 실제 Cloudflare/대체 hosting의 접근·저장·secret·보존 경계 승인.
- 미지원 기능과 데이터 한계가 UI/고지에 정확히 반영.

제한 MVP 릴리스(D-018)는 기본 계획이다. 2026-10-15(D-116·D-117)부터 첫 사용은 둘로 나뉜다. **본인 사용 시작**은 §14의 `personal-start` 게이트(저장 핵심·첫 조각·내 데이터 통제·운영 백업·iPhone 확인·배포 경계)를 통과하면 열리고, 공개 기준은 요구하지 않는다. **공개 출시**(다른 사람에게 열기로 정할 때만)는 `direct journal + deterministic dashboard`로 `limited-release` 게이트(권한·개인정보·데이터 무결성·모바일·배포 경계 + `public-only`)를 모두 통과해야 하며, AI 경로가 비활성임을 UI가 정확히 표시해야 한다. 권한·개인정보·데이터 무결성이 미달이면 본인 사용도 공개도 불가하다. AI 대화·RAG는 그 뒤 `release` 게이트에서 추가되고, 지을지부터 실사용 뒤 정한다(D-120·D-121).

## 14. 게이트 라벨 정의

[../harness/quality-gates.yaml](../harness/quality-gates.yaml)의 `node_gates`가 사용하는 라벨은 아래 정의를 따른다(결함 I-10). `B-*`/`F-*`는 §4/§5의 ID다. 정의되지 않은 라벨을 quality-gates에 추가하지 않는다.

| 라벨 | 정의 | 증거 정본 |
| --- | --- | --- |
| quick / full | `node scripts/verify.mjs --mode quick` 또는 `--mode full` PASS | §3 |
| source-files-present | `references/manifest.json`의 원자료 3개가 존재하고 byte/SHA-256 일치 | verify.mjs |
| runtime-profile-complete | `harness/runtime-profile.json`의 root/runtime/commands가 실제 명령 출력으로 채워지고 `unknown`이 근거와 함께 남음 | B-01 |
| reproducible-install | 잠금 파일 기반 clean install이 두 번 연속 같은 결과 | app-scaffold 증거 |
| lint-configured / typecheck-configured / test-configured / build-configured | `package.json`에 해당 script가 있고 `full`에서 실행되어 PASS. **lint는 일부러 넣은 오류(미사용 변수) 1건을 실제로 잡아 실패해야 한다** — 빈 script나 경고만 내고 통과하는 설정으로 게이트를 채우지 않는다(Biome은 경고의 종료 코드가 0이라 `--error-on-warnings`를 건다, D-115 ⑥). 증거는 그 명령과 결과 | §3, AGENT_WORKFLOW §6 |
| source-hashes-recorded | taxonomy 파일에 source_files와 원자료 hash가 기록됨 | §6 원자료 충실성 |
| taxonomy-one-to-one-review | 두 이미지의 모든 label·category가 versioned taxonomy와 1:1 대조되고 카테고리별 code(D-022) 발급 | §6 |
| user-or-human-review | D-027의 시간 분리 2회 검수 또는 사용자 최종 대조 기록(검수자·날짜) | §6, D-027 |
| literature-axes-covered | taxonomy v2 조사 축 A~F(기본 정서·위계·차원·한국어 어휘·동기 상태·적대/혐오)가 각 최소 근거 수를 충족하거나 미충족 사유가 기록됨. 모든 출처 행에 DOI 또는 안정 URI와 확인일이 있고 `상충`·`미확인` 절이 존재 | D-038, TASK-TAXONOMY §6.2/§9.1 |
| falsification-table-complete | D-038이 열거한 전공자 지적 5건(공포 부재·놀람 편중·즐거움/기쁨 중첩·바램의 동기성·미움의 혐오 축)과 조사 중 신규 발견 항목 전부가 반증 표에서 해소 또는 "해소 안 함 + 이유"로 판정되고, 카테고리마다 독립 문헌 2편이 제시됨 | D-038, TASK-TAXONOMY §7.1 (A)(B) |
| evidence-grade-recorded | taxonomy v2의 모든 세부 감정에 근거 등급(A·B·C)과 근거 참조가 있고 C등급 비율이 15% 이하. v1의 모든 항목이 매핑표에서 keep·move·rename·drop 중 하나로 처리되어 누락 0이며 발굴 어휘는 전부 add로 표시 | D-022, D-038, TASK-TAXONOMY §7.1 (C)(D)/§9.3 |
| license-check-passed | 척도(PANAS-X·Geneva Emotion Wheel·DES 등)의 문항·어휘 목록을 제품 목록으로 이식한 건 0. 인용은 출처당 1개·15단어 이내이고, 임상 척도를 선별 도구로 차용하지 않음(PR-001) | D-038, TASK-TAXONOMY §6.4 |
| taxonomy-evidence | `taxonomy-v2-research` 노드 게이트: literature-axes-covered, falsification-table-complete, evidence-grade-recorded, license-check-passed, user-or-human-review | D-038 |
| mobile-core-flow-personal | iPhone 홈 화면 웹앱(1차)·iPhone Safari 실기기에서 직접 작성·저장·수정·삭제·export(공유 창) 완료. Android Chrome의 같은 흐름은 `public-only`(D-117 — 2026-10-15 전에는 `mobile-core-flow` 하나가 Android까지 요구했다) | §6 모바일 |
| accessibility-core-flow | keyboard-only 완주, axe serious/critical 0. 화면 낭독기(홈 화면 앱의 VoiceOver) 수동 증거는 `public-only`로 옮겼다(D-117) | §6 접근성 |
| ai-journal-fixed-set | §7 고정 합성 대화 세트(≥50) 전체 실행 기록 | §7 |
| no-fabrication / no-emotion-assertion | §7 창작 0건 / 감정·강도 확정 0건 | §7 |
| direct-entry-fallback | §7 오류 fixture에서 draft 보존+직접 작성 fallback 100% | §7 |
| crisis-signal-100 | §7 위기 케이스에서 `safetySignal`·위기 흐름 전환 100% | §7, D-020 |
| history-forgery-0 | §7/§9 턴 위조 사례에서 위조 턴 문맥 사용 0건 | §9 |
| deterministic-statistics | 같은 fixture에서 통계 재현, missing≠0 | F-12, §5 |
| timezone-boundaries | 자정·DST·timezone 변경·윤년 fixture 통과 | §5 경계 fixture |
| active-card-schema-valid / source-and-hash-valid / reviewer-approved | §8.1 공급망 조건 각각 | §8.1 |
| retrieval-baseline-frozen | 고정셋 Recall/Precision baseline과 k/목표가 Decision으로 동결 | §8.3, D-027 |
| citation-validity-100 / citation-coverage-100 / unsupported-claim-0 / gate-false-pass-0 / injection-success-0 / observation-accuracy-100 | §8.3 표의 해당 지표 | §8.3 |
| crisis-flow-100 | §9 위기 분기 100% | §9 |
| browser-e2e | 릴리스 후보에서 §3 browser E2E 전체 PASS | §3 |
| mobile-real-device / security-and-privacy | 공개 관문의 실기기(실제 앱으로 iPhone 홈 화면 웹앱에서 본 §4의 S-00~S-12 전부와 §6의 T-01~T-07 — Android Chrome은 `public-only`, D-117), §9 전 영역의 수동+자동 증거 | §4 S 표, §6, §9 |
| deployment-boundary-review | 배포 경계 점검 — 본인 사용 시작(`personal-start`)과 공개 관문 모두에서 본다. 증거: ① 개발용·운영이 서로 다른 Worker·D1·비밀값(ARCHITECTURE §11.2) ② 커밋될 내용·배포 묶음·설정에 계정 값·비밀값 0건(스캔 명령과 결과, `verify --mode quick`의 모양 검사 포함) ③ 운영 묶음에 개발용 전용 코드 0건(`npm run build` 검사) ④ 운영 건물의 실시간 서버 기록에 열쇠·비밀번호·글 0건(S-12의 서버 쪽). 공개 관문에서는 §12 항목 7(공개 주소 노출·로그·백업 점검)까지 더한다 | §11·§12, ARCHITECTURE §11.2·§11.8, DEPLOY |
| ai-evals | §7·§8·§9 AI 고정 세트 전체 최신 버전으로 실행 | §7~§9 |
| ai-paths-disabled-or-verified | AI 진입점이 UI에서 비활성(D-019)이거나 `journal-ai`/`ai-safety` 게이트 통과 | UX §5, §13 |
| blocker-0 / high-0 | §11 차단/높음 결함 열린 건 0 | §11 |
| limited-release | `limited-mvp-release` 노드 게이트 — **공개 출시**(다른 사람에게 열기로 정할 때만, D-117): full, browser-e2e, mobile-real-device, security-and-privacy, deployment-boundary-review, blocker-0, high-0, ai-paths-disabled-or-verified, public-only | D-018, D-117 |
| public-only | 공개에만 필요한 묶음(D-117): ① Android Chrome 실기기에서 `mobile-core-flow-personal`과 같은 흐름 ② 건강정보 별도 동의 흐름과 처리방침(D-093, `SAFETY_POLICY` §3) ③ 위기 연락처 임상·안전 검토와 휴대전화 1388 통신사 실측, `kr.json`의 `review.clinicalSafety`를 바꾸는 근거(D-094) ④ 화면 낭독기 — 홈 화면 앱의 VoiceOver로 접근 열쇠 화면 → 작성 → 남기기 → 달력에서 다시 열기(§6 접근성). 감리 보고서 §3.3 '공개 갈림길'의 나머지(가입·사용자별 분리·서버가 못 읽는 암호화 여부·AI 이용 정책)는 공개를 정할 때 결정과 함께 이 묶음에 더한다 | D-093, D-094, D-108, D-117 |
| ci-green | GitHub Actions(`.github/workflows/harness.yml`, Ubuntu·Windows)가 그 노드의 코드를 담은 커밋에서 초록. 앱 뼈대 코드는 2026-10-15 PR #37에서 처음 초록이 됐다(STATUS §1 숫자 표). `data-integrity`는 data-foundation 코드를 담은 커밋의 초록을 본다 | `gh pr checks` 결과 |
| e2e-reload-restore | 실제 브라우저 E2E(Playwright Test — WebKit·Chromium, 로컬 https 서버, `npm run e2e`, D-123)로 ① 작성 중 입력 → 강제 새로고침 → 서버 임시저장에서 쓰던 단계·내용 복원 ② 연결을 끊은 채 입력 → 연결 복귀 → 저장·복원 ③ 연결을 끊은 채 입력 → 화면을 닫았다 새로 열기 → 기기 사본에서 복원 → 저장(D-123). 잃는 것은 마지막 임시저장 뒤의 입력뿐(F-24 기준 — 기기 사본이 있으면 입력 뒤 300ms 안의 것뿐) | §3, F-24, RK-034 |
| mobile-slice | 첫 조각을 iPhone 홈 화면 앱에서 약 10분: S-02(완전히 닫았다 열기), S-06(5분 떠났다 오기), S-07(자판과 아래 버튼 — 정한 배치에서 가리지 않음), T-03(앱 전환 화면 가림). 결과는 §4·§6 표에 적는다 | §4, §6 |
| restore-drill | 개발용 건물에서 내보내기 → 백업 → 다시 넣는 도구로 되살리기 → 행 수·내용이 같음을 확인하고, 되살린 뒤 세션 기록을 비워 로그아웃한 cookie가 되살아나지 않음(감리 N-7). 명령과 결과를 남긴다 | `DATA_MODEL` §8, D-109 |
| export-cpu-measured | 합성 3년치(하루 1편)로 내보내기 한 번의 CPU 시간을 재고 Workers 무료 한도(10ms)와의 여유를 기록한다. 넘으면 나눠 내보내기를 정한 뒤 다시 잰다(감리 N-8) | `harness/runtime-profile.json` 무료 한도 |
| backup-and-restore-drill | 운영 건물에 실제 일기를 넣기 전 백업 1회와 그 백업을 운영이 아닌 곳에 되살려 같은지 확인. 그 뒤로는 창고 구조를 바꾸는 작업 전마다 내보내기 + 백업, 바꾼 뒤 복원 확인(D-116, RK-045) | `DATA_MODEL` §8, D-109 |
| mobile-personal | 운영 건물로 iPhone 홈 화면 앱 설치·로그인(S-01·S-02), 내보내기 공유 창(S-05), 앱 전환 화면 가림(T-03) | §4, §6 |
| crisis-help-unreviewed-label | 위기 안내 화면(`#/help`)이 열리고 연락처가 임상·안전 검토 전임을 화면에 표시하며(`kr.json`의 `review.clinicalSafety: pending`), 112·119는 파일 없이도 보인다. 본인 사용 한정이다(D-117) | D-094, `SAFETY_POLICY` |
| data-integrity | `data-foundation` 노드 게이트 — **저장 핵심**(D-116): F-01, F-02, F-06, F-07, F-09, F-10, F-17, ci-green. F-14·F-15는 `data-control`로 옮겼다 | D-116 |
| first-slice | `first-slice` 노드 게이트: F-03, F-04, F-05, F-08, F-24, e2e-reload-restore, mobile-slice | D-116 |
| data-control | `data-control` 노드 게이트: F-14, F-15, restore-drill, export-cpu-measured | D-116 |
| personal-start | `personal-start` 노드 게이트 — **본인 사용 시작**: full, F-01, F-02, F-06, F-07, F-09, F-10, F-14, F-15, F-17, F-24, deployment-boundary-review, backup-and-restore-drill, mobile-personal, crisis-help-unreviewed-label. 공개 기준(`public-only`)은 요구하지 않는다 | D-116, D-117 |

