> **아카이브(2026-09-20, TASK-INFRA-01).** `tasks/CURRENT_TASK.md`에서 옮긴 기록이다. 옮기기 직전 커밋은 `b54a0a2`이고 아래 본문은 옮기기 전과 바이트 그대로다(상대 링크 1개의 경로 깊이만 고쳤다). **상태:** 보류 — 미완 인수 조건(B-02~B-08 판정 등)은 harness/work-graph.yaml의 스파이크 노드와 docs/STATUS.md §3·§4가 이어받았다. 이 파일의 `- 소유 파일:` 선언은 scope-guard에 더 이상 반영되지 않는다 — 훅은 `CURRENT_TASK.md`만 읽는다.

# 보류 기록: TASK-BOOTSTRAP — 현재 프로젝트 기술 감사와 구현 기반 확정

## 상태

`in_progress`

## 목표

현재 폴더를 Claude Code와 Codex가 공통 정본·작업 그래프·검증 하네스로 직접 개발할 수 있는 프로젝트 루트로 유지하고, 미확정 기술 가설을 실제 스파이크로 판정해 첫 애플리케이션 구현 작업을 확정한다.

## 범위

- 포함: 저장소/runtime 조사, 원자료 확인, Sites/D1 후보 스파이크, 구독 기반 모델 호출 경로 확인, 개인정보·권한 경계 검증, runtime profile, quality gate 실제 명령, provisional Decision 판정, 첫 구현 task
- 제외: 전체 제품 일괄 구현, 실제 사용자 데이터 입력, 공개 배포, 유료 자원 생성, 제품 핵심의 무승인 변경

## 연결 요구사항

- 전체 맥락: `PR-001`~`PR-015`
- 직접 판정: `B-01`~`B-08`
- 관련 결정: `D-006`~`D-008`, `D-011`, `D-014`~`D-016`, 신규 예정 `D-017`~`D-027`(아래 인계 메모)

## 소유권

- Main/Writer: 현재 프로젝트의 주 에이전트 1명
- 소유 파일: `harness/runtime-profile.json`, `harness/*.yaml`, `tasks/CURRENT_TASK.md`, 감사 결과로 바뀌는 정본
- 읽기 전용 조사/검증: 공식 문서 조사자, 독립 verifier
- 병렬 writer: 금지(현재 Git baseline 부재로 worktree 자체가 불가 — I-01)

## 인수 조건

- [x] 현재 폴더를 `main` 브랜치의 정상 Git 저장소로 재확립했다(2026-09-02 G0, D-017: 기존 `.git` 삭제 → `git init -b main` → baseline commit `32e68c8`, 46개 파일 → 플래그 없는 `git status` clean. 이전 "[x] 초기화" 기록은 옛 경로 기준으로 부정확했음).
- [x] Node/npm과 문서 하네스 명령을 `package.json`과 runtime profile에 기록했다(root를 현 경로로 갱신).
- [x] 원자료 3개의 존재·byte·SHA-256을 하네스로 확인했다(2026-09-02 재확인 PASS).
- [x] G1 계획 교정: 2026-09-02 재검증 보고서의 결함(I-01~I-18)과 사용자 결정을 정본에 반영했다(D-017~D-027, 아래 체크포인트의 파일 목록).
- [ ] B-02~B-08을 증거와 함께 `pass | fail | unknown`으로 판정했다(B-06은 "구독 기반 모델 호출 경로"로 재정의됨).
- [ ] `unknown`인 개인정보·권한 경계가 남아 있으면 구현을 차단했다.
- [ ] 앱 stack과 `lint/typecheck/test/build/e2e` 명령을 실제 스파이크 후 확정했다.
- [ ] provisional Decision을 유지/기각/대체하고 영향 문서를 동기화했다.
- [ ] work graph의 다음 `ready` 노드와 첫 구현 task의 owner/인수 조건을 지정했다.

## 계획

- [x] 저장소/runtime/원자료 감사
- [x] 2026-09-02 계획 재검증(주 에이전트 정독 + Sonnet 4개 병렬 적대적 검토 + 통합 심사; 보고서는 대화에 제출, 사용자 결정 5건 수령)
- [x] **G0**: `.git` 삭제 → `git init -b main` → user.name/email 확인(전역 설정 존재하여 repo-local 미설정) → baseline commit `32e68c8`
- [x] **G1**: 계획 교정(아래 파일별 목록) → `verify:quick`/`verify:full` PASS → 교정 commit(해시는 검증 증거 절)
- [ ] G2a hosting/identity 스파이크(B-02/B-03/B-08) → G2b D1 스파이크(B-04/B-05)
- [ ] G2c 구독 기반 모델 호출 경로 확인(B-06 재정의) / G2d Vector search(B-07) — RAG 트랙, critical path 밖
- [x] G3 taxonomy-v1 전사+사용자 검수(G2와 병렬 가능) — **완료**(`data/taxonomy/v1.json`, 7계열 194개, 전사+사용자 최종 대조 D-027 §7.8b 모두 2026-09-04) → [TASK-TAXONOMY-V1](../TASK-TAXONOMY-V1.md)
- [ ] runtime profile·Decisions 최종 갱신, 첫 구현 task 생성

## 체크포인트

- 완료(2026-09-02, Claude Code Fable 5.1): 계획 재검증 → 사용자 결정 5건 → **G0** 기존 `.git` 삭제, `git init -b main`, baseline commit `32e68c8`(46 files, `.gitignore` 준수, `outputs/`·`work/`·로컬 MCP 설정 제외), 플래그 없는 `git status` clean → **G1** 아래 파일 교정 완료. 교정 파일: `docs/DECISIONS.md`(D-017~D-027), `docs/DATA_MODEL.md`(§2 timezone 검증, §3.1 조건부 UPDATE/CHECK/trigger, §3.2 CHECK·D-022 code, §3.4 PK, §3.5 read-time guard, §3.6 retired 소급, §5 상태도 D-023, §6 turn token, §8 batch 삭제·벤더 근거), `docs/ARCHITECTURE.md`(§1 결정 요약, §2 다이어그램·무료 대안, §3 턴 신뢰, §4.2/§4.4 구독 기반·후행, §5 CSRF D-025, §6 defense-in-depth, §10 게이트 열), `docs/AI_RAG_SPEC.md`(§1 hedging, §4, §5.1 이력 계약, §5.2 safety_signal, §7.2 code/LLM, §8 observation 대조, §9 필수 verifier, §10 감지 범위), `docs/SAFETY_POLICY.md`(§6 감지 범위·한국 리소스, §8), `docs/UX_SPEC.md`(§4 검색/필터, §5 후행·위기 전환, §7 상태 유지, §13 내보내기 신설), `docs/EVAL_PLAN.md`(§3, §4 B-06 재정의, §7 위기·턴 위조 케이스, §8.3 D-027, §9 턴 위조·관찰 위장, §13 제한 MVP, §14 게이트 라벨 정의 신설), `docs/RISK_REGISTER.md`(RK-001~003 대안, RK-011 정정, RK-015, RK-016 신규), `docs/ROADMAP.md`(Phase 0 G2a~d, Phase 3/5 후행, 제한 MVP 릴리스 절 신설), `docs/TRACEABILITY.md`(노드 재매핑, 불변조건 4건, 변경 영향), `harness/work-graph.yaml`(privacy-hosting-spike → hosting-identity/d1-data/model-access/vector-search, limited-mvp-release 추가, vector-search→evidence-pipeline 엣지), `harness/quality-gates.yaml`(severity medium, node_gates 재매핑, no_paid_api_calls), `harness/runtime-profile.json`·`.template.json`(root, model_access), `harness/loop-state.json`, `schemas/diary-entry`(slot 객체, completed 필수 시각, `\S`, category-prefixed code), `schemas/journal-assist-output`(`safetySignal` 필수, slot 동기화), `schemas/export`(analyses metadata 래핑), `scripts/verify.mjs`(`harness/README.md` required), `references/README.md`(D-027/D-022 문구), `.env.example`(OPENAI_API_KEY 제거, D-019/D-025 주석).
- 추가(2026-09-02 후속, D-029/D-030): 사용자가 "혼자 쓰는 도구"로 확정. Agent SDK는 공식 문서상 API 키 필수+타사 제품에 claude.ai 로그인 제공 금지라 제외. Claude Code CLI 헤드리스(`claude -p --json-schema`, 구독 로그인)를 B-06 후보로 채택하고 scratchpad에서 합성 입력으로 최소 스파이크 1회 PASS(구독 인증, 필수 키 6개 일치, 비창작, `safetySignal=none`, 벽시계 15초/API 8.5초, `claude-opus-5`). 정책 회색지대는 RK-017로 사용자 인지 기록. hosting을 본인 PC 자체 호스팅+Tailscale로 바꾸는 D-030은 PR-002 문구 변경이라 사용자 승인 대기.
- 추가(D-030 승인, D-031): 사용자가 자체 호스팅을 승인해 PRD PR-002·§4, README, ARCHITECTURE, DATA_MODEL, SAFETY, EVAL, RISK(RK-001~003/010 재작성, RK-017/018 신규), ROADMAP, TRACEABILITY, work-graph(`d1-data-spike`→`data-store-spike`), runtime-profile, BOOTSTRAP, `.env.example`을 로컬 서버+SQLite+사설망 기준으로 갱신. 모델은 같은 입력으로 3개 실측해 Sonnet 5(작성, 8.0초)/Opus 5(verifier·RAG, 15초) 채택, Haiku 4.5는 발화 무시로 탈락(D-031).
- 추가(D-032 승인): 사용자가 Supabase 대신 "직접 짠 백엔드" 방향을 택하고 선택지 B(Cloudflare Pages+Workers+D1)를 승인. D-030은 superseded. AI는 PC worker가 `ai_jobs` 큐를 outbound로 가져가 `claude -p` 호출(포트 개방 없음). PRD, README, ARCHITECTURE(§2 다이어그램, §3, §4.2, §4.6 신설, §5 job 경로, §6, §10), DATA_MODEL(§3.1, §3.8 `ai_jobs` 신설, §8), SAFETY §3, EVAL(§3, §4 B-02~B-08, §9, §10, §13), RISK(RK-001/002/003/010/018 재작성, RK-019 신규), ROADMAP, TRACEABILITY, AI_RAG_SPEC §1, BOOTSTRAP, work-graph(`data-store-spike`), runtime-profile, `.env.example`, loop-state 갱신. "B"가 Netlify+Turso를 뜻했다면 D-032를 수정한다.
- 추가(G2a/G2b 로컬 스파이크, 2026-09-02): 사용자가 G2a와 Cloudflare 자원 생성을 승인하고 계정 이메일을 알려줌. 채팅에 적힌 비밀번호는 **사용하지 않았고** 변경을 권고함(계정 로그인은 사용자가 `npx wrangler login` 브라우저 승인으로 수행). 계정 없이 가능한 부분을 `work/spikes/g2a-cloudflare/`(Git 제외, wrangler 4.128.0, miniflare 로컬 D1)에서 검증: HTTP 22/22 PASS(토큰 없음/오류 401, HMAC cookie 속성, custom header 없음·교차 Origin·cross-site 403, draft upsert/revision 409, 완료조건 미충족 422, CHECK 422, 조건부 완료 rev3, ai_jobs 202/lease 200·204/result 200·409/payload NULL, cascade 삭제 고아 0) + SQL 9건(CHECK, UNIQUE 2종, completed 보호 trigger 2종, 조건부 UPDATE, stale no-op). 발견: (1) 자식 먼저 삭제하면 completed 보호 trigger가 막으므로 부모 먼저 삭제+FK cascade로 확정(DATA_MODEL §8). (2) cascade 포함 DELETE의 `meta.changes`는 과대 계수(1행 삭제에 2) → 삭제 판정은 SELECT로. 원격 D1·휴대폰·rate limit·무료 한도·실제 worker 프로세스는 미검증.
- 추가(원격 G2a, 2026-09-02): 사용자가 `wrangler login`을 직접 승인(`whoami`: <cloudflare-account-email>). `wrangler d1 create emotion-diary-spike` → APAC, id `<d1-database-id>`; `d1 migrations apply --remote` PASS(테이블 3·trigger 2); Workers `<spike-worker>.workers.dev` 배포 2회(두 번째는 `ALLOWED_ORIGIN`을 실제 URL로); secret 3개(`APP_ACCESS_TOKEN_HASH`, `SESSION_HMAC_SECRET`, `WORKER_SECRET`)는 `wrangler secret put`으로만 등록. 원격 HTTP 22/22 PASS(첫 실행은 배포 직후 readiness 실패 1회, 재실행 PASS). 원격 D1: trigger 2종·CHECK 2종·UNIQUE 거부(`SQLITE_CONSTRAINT_*`, code 7500), 부모 우선 cascade 후 고아 0. `d1 info`: 61.4 kB, 읽기/쓰기 쿼리 수 집계 표시. `time-travel info`: 복구 bookmark 존재(복구 실습은 안 함). 스파이크 토큰은 채팅으로 사용자에게 전달(정본에 기록 안 함), 검증 후 회전·삭제 예정.
- 추가(실브라우저 확인, 2026-09-02): 사용자가 원격 URL을 **PC Chrome 152(Windows)**에서 실행 → `session: 200`, `put+header: 200 {status:"draft",revision:1}`, `put-no-header: 403 {"error":"csrf"}`. 실제 브라우저의 HTTPS `Secure` cookie 왕복과 fetch metadata 헤더 통과가 확인됨(B-02/B-03 원격 실브라우저 PASS). 모바일 실기기(B-08)는 아직 미실행.
- 추가(모바일 실기기, 2026-09-02): **iPhone iOS 18.7, 카카오톡 인앱 WebView(WebKit 605.1.15)** → `session: 200`, `put+header: 409 {"error":"revision_conflict"}`(PC에서 먼저 만든 오늘 draft revision 1을 휴대폰이 revision 0으로 덮어쓰려 해 거부됨 = 기기 간 optimistic lock 정상, cookie·CSRF 통과 증거), `put-no-header: 403`. B-08 `partial`: iOS WebKit HTTPS Secure cookie 왕복 확인, Safari 본체·홈 화면 standalone·Android Chrome 미확인. 스파이크 토큰은 채팅 노출 후 회전, 합성 데이터 삭제.
- 추가(정리, 2026-09-02): 스파이크 토큰 회전(`wrangler secret put APP_ACCESS_TOKEN_HASH`) → 직후 요청에서는 옛 토큰이 아직 200, 약 20초 뒤부터 옛 토큰 401·새 토큰 200(secret 변경 전파 지연 존재, 회전 절차에 반영 필요). 원격 D1 합성 데이터 전부 삭제(entries/emotions/jobs 0). 새 토큰은 `work/…/.spike-secrets.json`에만 있다.
- 추가(rate limit, 2026-09-02): Workers Rate Limiting binding(`[[ratelimits]]` 10/60s)을 무료 플랜에 배포는 됐으나 같은 key 30회(HKG/NRT 분산)에서 429가 0건 → 문서의 "permissive, eventually consistent, per location"대로 보안 경계 부적합, 기각. 대신 migration `0002_auth_failures`로 D1 전역 잠금(60초 10회 → 5분) 구현·배포: 실패 반복 시 429, 잠금 중 올바른 토큰도 429(`Retry-After: 300`), 카운터 초기화 후 200. Cloudflare Access는 JWT 헤더(`Cf-Access-Jwt-Assertion`)·certs 검증 방식만 문서로 확인, 무료 한도·workers.dev 적용은 확인 불가 → 선택 사항으로 보류.
- 추가(G2c 실제 왕복, 2026-09-02): `work/spikes/g2a-cloudflare/pc-worker.mjs`(Node, Bearer worker secret, `--once`/5초 폴링)가 원격 `ai_jobs`를 lease → Git Bash로 `claude -p --model claude-sonnet-5 --json-schema` 실행 → 결과 POST → owner 조회 `done`·payload NULL. 첫 시도는 Windows `spawnSync(shell:true)` 인용 문제로 `--json-schema is not valid JSON` 실패 → prompt/schema를 환경변수로 넘겨 bash에서 실행하도록 수정 후 성공. 합성 발화 11회 모두 사건만 반영·감정 코드 비움·`safetySignal=none`. **지연 10회**(worker 측 = claude 기동+API): min 7.7초 / p50 8.4초 / p95 12.1초 / max 12.1초, API만 p50 4.9초 / p95 9.4초. UX 목표(첫 응답 p95 8초)를 초과하므로 대화 UI는 "생각 중" 상태와 20초 timeout fallback을 전제로 설계하고, 기동 오버헤드(약 3.5초) 절감 방법은 후속 검토(RK-009). 스파이크 한계: 실패 job을 `failed`가 아니라 error 결과로 `done` 처리(실제 구현에서 분리), 만료 처리 미검증, Haiku가 보조 모델로 함께 호출됨(Claude Code 내부 동작, 비용 없음).
- 다음: Safari 본체/standalone/Android는 사용자가 가능할 때 추가 확인(차단 아님). G2c 잔여: 보존/학습 설정 확인, verifier 독립 2회 호출, 위기 케이스, job 만료·`failed` 전환. ~~**G3 taxonomy-v1** 착수 가능.~~ **[정정, 2026-09-05] G3 taxonomy-v1은 2026-09-04에 완료됐다**(`data/taxonomy/v1.json`, 7계열 194개, `review_status: reviewed`; 이어서 taxonomy v2도 2026-09-05에 사용자 최종 대조까지 마쳤다 — 상단 TASK-TAXONOMY 안내 참고). Phase 1 app-scaffold는 G2a/G2b partial PASS를 근거로 사용자 승인 시 시작. → rate limit 구현·Cloudflare Access 무료 적용 검토 → 스파이크 D1 데이터 비우기/토큰 회전. 이어서 G2c 실제 PC worker 프로세스+`claude -p` 결합. ~~G3 taxonomy-v1은 병렬 가능. G3 taxonomy-v1 전사(D-022 code, D-027 검수)는 G2와 병렬 가능.~~ **[정정, 2026-09-05] (위와 동일 — 이미 완료됨)** G2b는 G2a 통과 후, G2c/G2d는 RAG 트랙으로 critical path 밖.
- 결정: D-017~D-027 기록 완료(`docs/DECISIONS.md`). 이번 세션에서 제품 핵심(PR-001~PR-015, 원형 6영역, taxonomy, 두 작성 흐름)은 변경하지 않았다. `emotion_code` 형식만 D-022로 카테고리 접두어 규칙을 확정했다.
- 실패: 없음. 이전 체크포인트의 "safe-directory 이 정확한 경로만 등록함"은 옛 경로 기준이었고, TASK-CBM(D-028)이 이후 현 경로를 전역 `safe.directory`에 추가한 상태였다. G0 재초기화 후 `.git` 소유자가 현 계정이므로 그 항목 없이도 동작하며, 전역 설정은 변경하지 않았다.
- 주의: `outputs/`·`work/`는 비정본. Git 전역 `user.name=admin`/`user.email`은 기존 전역 설정 그대로 사용했고(지시: 없을 때만 repo-local 설정), 커밋 푸터는 실제 모델 표기 `Claude Fable 5.1`을 사용했다. 파일 교정은 모두 Decision과 연결. 유료 API 호출·외부 자원 생성 금지(D-019). TASK-CBM 기록은 원문 보존.

## 인계 메모 — 2026-09-02 계획 재검증 (새 세션 재개용)

### 사용자 결정 (채팅 승인, G1에서 Decision으로 기록)

1. **Git 재초기화 승인**: 기존 `.git` 삭제 후 현 계정으로 `git init -b main` + baseline commit(잃을 이력 없음 확인됨).
2. **RAG 단계 분리**: 직접 작성+대시보드 제한 MVP 선행 배포, RAG 분석은 후행 단계 — 기본 계획으로 승격.
3. **위기 대응**: 리소스 기준 국가 **한국 확정**. 감지 범위는 권고안 채택 — AI 관여 경로(대화 작성·명시 요청 분석)에서만 감지, 직접 작성 원문 자동 스캔 없음 + 한계 고지. (사용자가 국가만 명시적으로 답했고 범위는 권고안을 기본값으로 기록 — 이의 시 변경.)
4. **비용**: 유료 API(OpenAI API 등) 미사용. 사용자가 구독 중인 Codex/Claude 자원으로 가능한 방법만 검증. B-06을 "구독 기반 모델 호출 경로 확인"으로 재정의. 미확인 시 AI 대화·RAG는 보류하고 제한 MVP만 진행.
5. **Hosting 대안**: Sites 실패 시 무료 옵션으로 제한.

### 통합 결함 등록부 요약 (전체 근거는 2026-09-02 대화 보고서)

- **I-01 P0** Git baseline 부재+환경 기록 stale(runtime-profile root 옛 경로, RK-011 `mitigated` 과장 포함) → G0+G1에서 해소
- **I-02 P0** 위기 처리 경로 공백: `journal-assist-output.schema.json`에 안전 필드 없음 + 직접 작성 경로 무검사 vs SAFETY §6 문구 → safetySignal 필드 추가+정책 문구 축소(결정 3 반영)
- **I-03 P1** owner 경계 단일 장애점(ARCHITECTURE §6 서버 상수 owner_key, defense-in-depth 없음) + CSRF 방식 미정 → identity 헤더 허용 목록 대조 필수화, custom header CSRF 채택
- **I-04 P1** D1 interactive transaction 없음 vs DATA_MODEL "transaction 안에서" 서술, 완료 불변조건 TOCTOU, intensity CHECK·reminder PK 미명시 → 조건부 단문/trigger+CHECK로 재서술
- **I-05 P1** 완료 편집 상태 전이 모순(DATA_MODEL §5 상태도 vs PRD §8/UX §7) → "편집 중 completed 유지, 명시적 완료 취소만 draft"로 통일
- **I-06 P1** taxonomy 카테고리 간 중복 라벨 최소 7건(가벼운·흐뭇한·뿌듯한·포근한·고통스러운·구역질나는·황량한; "증오하는/증오스러운"은 미확정) → 카테고리별 독립 emotion_code 발급 규칙
- **I-07 P1** Verifier "가능하면" 약화, Quality Filter code/LLM 미구분, observations 자유 서술 유출 경로 → 독립 실행 필수화+observation 검증 확장
- **I-08 P1** reviewer 2인 요구 vs 1인 제품 → 1인 대안 절차 Decision, 지표 "고정셋 기준" 명시
- **I-09 P1** Vector Store chunk 반환 vs source_spans 대조, attributes 16키/스칼라 vs topicCodes 배열 → B-07 스파이크 항목화
- **I-10 P1** work-graph 결함: privacy-hosting-spike 과잉 통합, evidence-pipeline 선행 엣지 누락, quality-gates 미정의 라벨 13개, severity medium:0이 EVAL과 상충 → 노드 분해+라벨 재매핑+severity 일치
- **I-11 P1** 클라이언트 제공 대화 이력 신뢰 계약 미정의(과거 턴 위조 공격면) → AI_RAG_SPEC §5.1/§10 보강
- **I-12~I-18 P2**: export 모바일 UX 부재 / 칭찬·감사 slot 정보 schema 소실 / 대형 감정 목록 검색·필터 부재 / 클라이언트 timezone 신뢰 한계 / stale read-time guard 미명시 / D1 백업·보존은 벤더 문의 필수 / retired Evidence 소급 표시 부재
- P3: suggestedEmotionCodes minItems, whitespace 통과, verify.mjs required에 `harness/README.md` 누락, 검수 문구 통일 등

### G1 파일별 교정 목록 (모두 위 I-번호·사용자 결정과 연결)

| 파일 | 교정 |
| --- | --- |
| `docs/DECISIONS.md` | D-017~D-027 신규(사용자 결정 5건 + taxonomy 중복 코드, 완료 편집 상태, D1 원자화, CSRF, Verifier 필수화, 1인 검수 대안) |
| `docs/DATA_MODEL.md` | §3.1 tx→원자적 statement/trigger+CHECK, §3.4 PK, §3.5 read-time guard, §5 상태도, §6 턴 계약 |
| `docs/ARCHITECTURE.md` | §5 CSRF 확정, §6 defense-in-depth, §2/§4.4/§10 B-06 재정의(구독 기반) 반영 |
| `docs/AI_RAG_SPEC.md` | §1 구독 기반 hedging, §5 safetySignal+이력 계약, §7.2 code/LLM 구분, §8 observations 제한, §9 필수화, §10 |
| `docs/SAFETY_POLICY.md` | §6 감지 범위(AI 관여 경로만)+한국 리소스 확정 |
| `docs/UX_SPEC.md` | export 절 신설, 감정 검색/필터, §5 위기 전환, §7 상태 유지 문구 |
| `docs/EVAL_PLAN.md` | §4 B-06 재정의, §7 위기 케이스, §8.3 1인 대안+고정셋 표기, §9 턴 위조·관찰 위장 케이스, 게이트 라벨 정의 절 |
| `docs/RISK_REGISTER.md` | RK-011 정정, RK-016 신규(구독 기반 경로 부재 시 AI 기능 보류) |
| `docs/ROADMAP.md`, `docs/TRACEABILITY.md` | 그래프 분해·제한 MVP 선행 반영 |
| `harness/work-graph.yaml` | privacy-hosting-spike → hosting-identity/d1-data/model-access/vector-search 분해, evidence-pipeline 엣지 추가(verify.mjs 파서 형식 유지 주의) |
| `harness/quality-gates.yaml` | severity medium 완화(EVAL §11 일치), node_gates 라벨 재매핑 |
| `harness/runtime-profile.json` | root=현 경로, generated_at/verified_by/evidence 갱신, unknowns에 구독 기반 경로 추가 |
| `schemas/diary-entry.schema.json` | praises/gratitudes를 `{slot(1~3), text}` 객체로, completed 시 firstCompletedAt 등 필수화, text `\S` 패턴 |
| `schemas/journal-assist-output.schema.json` | `safetySignal` 필드 추가(required), draftPatch slot 구조 동기화 |
| `schemas/export.schema.json` | analyses 항목에 기간·버전 metadata 래핑 |
| `scripts/verify.mjs` | required에 `harness/README.md` 추가 |
| `references/README.md` / `.env.example` | 검수 문구 통일 / OPENAI_API_KEY 주석을 D-019에 맞게 수정 |

### 재개 절차 (새 세션 첫 행동)

1. 이 파일과 `AGENTS.md`, `README.md`를 읽는다. `outputs/`·`work/`는 무시.
2. G0: `.git` 삭제(사용자 승인 완료됨) → `git init -b main` → `git config user.name/email` 확인 → 전체 스테이징(.gitignore 준수) → baseline commit(한국어 메시지+Fable 5 푸터) → 플래그 없는 `git status` 성공 확인.
3. G1: 위 표 순서로 교정 → `npm run verify:quick` → `npm run verify:full` → 본 파일 체크포인트 갱신 → 교정 commit.
4. 이후 G2a부터. Sites 프로젝트 생성은 외부 자원이므로 실행 직전 사용자에게 재확인.

## 검증 증거

- 환경: Windows 11, Node 22.16.0, npm 10.9.2, git 2.49.0.windows.1. G0 이후 플래그 없는 `git status` 정상.
- G0 증거: `git log --oneline -1` → `32e68c8 감정일기 프로젝트 baseline: 제품 정본·하네스·원자료 초기 커밋`; `git status` → `nothing to commit, working tree clean`.
- G1 명령: `npm run verify:quick` → PASS, `npm run verify:full` → PASS(앱 script가 없어 문서 하네스만 검사; 앱 기능 검증이 아님). 교정 commit 해시는 완료 보고와 `git log`로 확인.
- 로컬 스파이크 명령(2026-09-02, `work/spikes/g2a-cloudflare`): `npx wrangler d1 migrations apply DB --local` → PASS; `npx wrangler d1 execute DB --local --command ...` 9건; `node spike-test.mjs`(wrangler dev 기동 후 fetch 22건) → `SUMMARY 22/22 PASS`.
- 원격 스파이크 명령(2026-09-02): `npx wrangler d1 create emotion-diary-spike`, `npx wrangler d1 migrations apply DB --remote` → PASS, `npx wrangler deploy` ×2, `npx wrangler secret put` ×3, `node remote-test.mjs` → `SUMMARY 22/22 PASS`, `npx wrangler d1 execute DB --remote --command ...` 거부 4건+cascade 1건, `npx wrangler d1 info`, `npx wrangler d1 time-travel info`.
- 미검증/알려진 제한: B-02/B-03/B-04/B-06 큐는 로컬·원격 `partial`. 휴대폰 실기기(B-08), rate limit, 무료 한도 수치, Time Travel 복구 실습, 실제 PC worker 프로세스, 검색 계층(B-07), Web Push는 `unknown`. 스파이크 Worker는 공개 URL이며 토큰 없이는 HTML 안내 페이지 외 데이터를 주지 않는다. D-024의 D1 trigger/batch 지원, D-025의 identity 헤더·custom header 통과는 G2a/G2b 실검증 전까지 가설. `schemas/*`는 Ajv 등 실제 validator로 아직 검증하지 않았다(JSON 구문만 하네스 확인). ~~taxonomy-v1 전사와 D-027 검수는 미착수.~~ **[정정, 2026-09-05] 완료됐다**(`data/taxonomy/v1.json`, 7계열 194개, `review_status: reviewed`, 2026-09-04; taxonomy v2도 2026-09-05에 사용자 최종 대조까지 마쳤다 — 상단 TASK-TAXONOMY 안내 참고). Codebase Memory MCP는 이 세션에서 연결 실패(CONNECTION_CLOSED)하여 Graph 탐색 없이 직접 Read/Grep으로 진행했다.
