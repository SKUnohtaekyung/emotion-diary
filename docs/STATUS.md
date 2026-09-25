# 진행 상황과 다음 할 일

최종 갱신: 2026-09-24. 세부 증거는 [../tasks/CURRENT_TASK.md](../tasks/CURRENT_TASK.md)와 [../tasks/archive/](../tasks/archive/README.md), 결정 근거는 [DECISIONS.md](DECISIONS.md)에 있다. 이 문서는 한눈에 보는 요약이다. 이 날짜가 HEAD 커밋일보다 14일 넘게 앞서면 `verify`가 경고한다.

## 1. 지금 어디에 있나

| 단계 | 상태 | 요약 |
| --- | --- | --- |
| Phase 0 — 부트스트랩 | 마무리 중 | 정본 문서, Git baseline, 계획 교정(D-017~D-027), 배포·AI 경로 확정(D-029~D-032), 기술 스파이크 실행(판정은 partial), taxonomy v1·v2, 디자인 시스템, 캐릭터 9종, 개발 인프라 정비까지 끝났다. 남은 것은 스파이크 잔여 판정(§3)이다 |
| 브라우저 우선 UI 프로토타입 | 구현·PC 검수 완료(PR #30 병합 전). **2026-09-24~25 QA 피드백(D-076~D-089) 반영·검수 완료, 마감 검토 1회 결과 반영 중(커밋 전)** | `TASK-WEB-UI-01`(archive)의 정적 시안(D-047, `web/`). 사용자 QA(`TASK-WEB-UI-02`, 브랜치 `web-ui/qa`)가 서비스 스토리·디자인 시스템 전면 개정(D-050~D-072, 문서·토큰·전시장 완료)에 이어, 2026-09-24 QA 피드백 13건 — 오늘 화면 하단 탐색 제거(D-076)·오늘 밤하늘과 세 겹 숲(D-077·D-084)·완료 자유 배치(D-078)·편지 카드·이유 자유 배치(D-079)·달력 한 주 접기(D-080)·설정과 하루 기준 시각(D-081)·그날만 작성(D-082)·주요 화면 예외 상태(D-083)·통계 친밀도와 계열별 추세(D-064·D-086)·편지 배경(D-085) — 을 반영하는 중이다. 세부 진행 상태는 `tasks/CURRENT_TASK.md`(QA #31~#47 표, 2026-09-24 체크포인트)를 따른다. 저장·인증·AI는 없다. 실기기 검수는 하지 않았다 |
| Phase 1 — 기반·데이터 무결성 | 대기 | 앱 뼈대(Workers API, D1 migration, 테스트). `work-graph`의 `app-scaffold`는 `hosting-identity-spike`·`data-store-spike`가 `done`이 돼야 열린다. 착수 전에 TASK-MOBILE의 단일 Worker 제안을 결정으로 받을지 먼저 정한다 |
| Phase 2 — 직접 작성 MVP | 대기 | 선행 조건이던 taxonomy는 끝났다(v1 2026-09-04, v2 9계열 194개 2026-09-05, 둘 다 `review_status: reviewed`) |
| Phase 4 — 대시보드·알림 | 대기 | — |
| 제한 MVP 릴리스 | 대기 | Phase 1·2·4 완료 후 첫 배포 |
| Phase 3·5 — AI 대화·RAG | 후행 | 모델 경로는 확인됨, 구현은 제한 MVP 이후 |

## 2. 확정된 것

- **제품**: 원형 일기 6영역(날짜·사건·감정+강도·이유·칭찬 3·감사 3), 9개 상위 감정과 세부 감정 194개(taxonomy v2, D-038), 원자료 전사본 v1의 보존, 복수 감정과 각 1~10 강도, 하루 1개·그날만 작성(D-082가 소급 작성 허용을 대체)·streak, 결정론적 대시보드(친구와의 친밀도·계열별 평균, D-064·D-086), 비진단 원칙.
- **배포(D-032)**: 직접 작성한 백엔드를 무료 클라우드에 올린다 — Cloudflare Pages(정적 UI) + Workers(API, 유일한 진입점) + D1(SQLite 호환). 로그인은 서버 접근 토큰 cookie와 D1 전역 잠금. 단일 origin Worker로의 교정은 미결 제안이다(`tasks/TASK-MOBILE.md`, 보류).
- **AI 경로(D-029, D-031)**: 유료 API 없이 PC의 worker가 백엔드 작업 큐를 가져가 Claude Code 헤드리스(`claude -p`)로 처리한다. 작성 보조는 Sonnet 5, 검증·분석은 Opus 5. PC가 꺼져 있으면 AI만 비활성이고 기록·대시보드는 동작한다.
- **순서(D-018)**: 직접 작성+대시보드의 제한 MVP를 먼저 배포하고 AI 대화·RAG는 그 뒤.
- **안전(D-020)**: 위기 감지는 AI 관여 경로에서만, 직접 작성 원문은 자동 스캔하지 않으며 한계를 고지. 위기 리소스는 한국 기준.
- **디자인 시스템(D-033 기반, 2026-09-21 개정 D-050~D-059)**: 감정 9계열 색 토큰, 서비스 색 ink·mint·크림빛(D-054), 감정 테마(계열 300 면, D-053), 흰 바탕 + 숲색 무대의 오늘 화면(D-056), 조약돌(D-050)과 알아차림의 빛(D-055), 큰 제목 hero + Pretendard 웹폰트(D-057), 작성 흐름 = 계열 지도 → 계열별 세부 감정 화면(pill 구름) → 대표 강도(+선택형 세부 강도)(D-059). 정본 `docs/DESIGN_SYSTEM.md`, 스토리 `docs/BRAND_STORY.md`, 선택의 근거 `docs/DESIGN_RATIONALE.md`, 값 `design/tokens.json`, 검사 `scripts/check-contrast.mjs`(292건), 전시장 `design/style-guide.html`.
- **캐릭터(친구, D-051)**: 눈 두 점·입 없는 평면 친구 9종(누리·바라·설이·타온·나래·품이·아린·숨이·가름), 정적 PNG(`design/characters/flat-friends/`). 크레용 동물 세트(D-044~D-046)는 비교 이력으로 보존하며 `check-characters`가 계속 검사한다. 설이(슬픔)·숨이(공포)의 색 근접은 알려진 한계.
- **개발 장치(2026-09-20)**: GitHub Actions가 Ubuntu·Windows에서 `npm ci` → quick → full을 돌린다. harness 상태 파일·schema·style-guide의 어긋남은 `check-harness`가 quick에서 잡는다([../harness/README.md](../harness/README.md)).

## 3. 스파이크로 확인된 것 (2026-09-02)

| 게이트 | 판정 | 핵심 근거 |
| --- | --- | --- |
| B-01 저장소/runtime | pass | Node 22, Git baseline, 하네스 quick/full |
| B-02 접근 경계 | partial | 토큰 401, HTTPS cookie 왕복, PC Chrome·iPhone WebView 실브라우저, D1 잠금(실패 10회 → 5분 429). Rate Limiting binding은 미차단으로 기각 |
| B-03 비밀값·CSRF | partial | secret은 `wrangler secret put`으로만, custom header 없음·교차 Origin·cross-site 403 |
| B-04 D1 계약 | partial | 원격 D1에서 CHECK·UNIQUE·trigger 거부, 조건부 완료 UPDATE, 부모 우선 cascade |
| B-05 보존·백업 | partial | Time Travel bookmark 확인, 백업 절차·삭제 지연 고지 미정 |
| B-06 구독 모델 경로 | partial | PC worker → 원격 큐 → `claude -p` 왕복 성공, 11회 비창작. 지연 p50 8.4초 / p95 12.1초 |
| B-07 검색 계층 | unknown | RAG 트랙, 미착수 |
| B-08 모바일 | partial | iPhone(카카오톡 WebView) 확인, Safari 본체·홈 화면·Android 미확인 |

발견 사항: 삭제는 부모 일기를 먼저 지워야 completed 보호 trigger와 충돌하지 않는다. cascade가 낀 DELETE의 `meta.changes`는 과대 계수된다. secret 회전은 약 20초 전파 지연이 있다. AI 첫 응답이 목표 8초를 넘으므로 "생각 중" 상태와 20초 timeout fallback을 UI 전제로 둔다.

`work-graph`에서는 이 판정에 맞춰 `hosting-identity-spike`·`model-access-spike`가 `verifying`, `data-store-spike`가 선행 미완으로 `blocked`다. partial이 pass가 돼야 `app-scaffold`가 열린다.

## 4. 다음 할 일 (우선순위 순)

1. **TASK-WEB-UI-02 브랜드·디자인 개편과 시안 재구성**(in_progress, 2026-09-21) — 결정 D-050~D-059는 끝났다(문서·토큰·전시장). `web/` 시안을 새 언어(흰 바탕 + 숲색 무대 + 감정 테마 300 + 조약돌·빛 + 친구)로 재구성하고 메인이 헤드리스 Chromium으로 캡처·측정한다. 증거와 남은 것은 `tasks/CURRENT_TASK.md`. 사용자 눈 검수 대상: 300 면의 인상, 친구가 면에 묻히는지, 돌 더미 애니메이션, 작성 단계 수(계열 셋이면 10단계). **남은 검수(TASK-WEB-UI-01 유래)**: iPhone Safari·Android Chrome 실기기, 실제 OS reduced-motion 설정, 회색조·label 없음 상태의 사람 눈 판독. **추후 계획**: 오늘의 한 줄 질문 목록 작성, 앱 이름·로고(D-058).
2. **디자인 시스템 잔여 실행 항목** — 실기기에서 chip 대비·40px 아이콘 판독성·44px 터치·별자리 다중 선택 조작감 확인, 위기 안내 **연락처 값** 검수(문구 톤은 D-036으로 확정).
3. **스파이크 잔여 판정(Phase 1의 선행)** — B-02/B-03/B-08: iPhone Safari 본체·홈 화면·Android Chrome, bundle/log secret scan, Cloudflare Access 적용 가능성, 무료 한도 수치. B-05: 백업 절차와 삭제 지연 고지 문구. B-06(병렬 가능): job 만료·`failed` 전환, verifier 독립 2회 호출, 위기 케이스, 구독 경로의 보존 설정.
4. **TASK-MOBILE 제안의 결정**(보류 중, Phase 1 착수 직전) — 단일 origin Worker + Static Assets로 D-032를 교정할지.
5. **Phase 1 app-scaffold → data-foundation** — Workers API, D1 migration(스파이크 스키마 기반), lint/typecheck/test/build 명령(생기면 `quality-gates`·`runtime-profile`에 같은 변경으로 채운다 — 안 채우면 quick이 실패한다), 하루 1개 unique, revision/idempotency, hard delete, versioned JSON export.
6. **direct-journal → dashboard-reminder → 제한 MVP 릴리스**.
7. **후행**: Phase 3 AI 대화 작성, Phase 5 Evidence 공급망과 RAG 분석(B-07 포함).

개발 장치 쪽 후속: Codex 세션의 가드 구성과 런타임 검증(AGENTS §2.3), `AI_RAG_SPEC`의 출력 예시 표기(snake_case)와 schema(camelCase) 통일, `EVAL_PLAN`의 taxonomy 1:1 대조가 v1 대상임을 명시, `verify`의 충돌 표식 검사가 Markdown setext 밑줄(`=======`)을 오탐하는 문제, 보류 중인 TASK-DS-REF(이슈 #10~#14).

## 5. 다른 컴퓨터에서 이어가기

1. **준비**: Node.js 22 이상, Git, `gh`(선택). `git clone https://github.com/SKUnohtaekyung/emotion-diary.git` → `npm ci` → `npm run verify:quick`이 PASS인지 확인한다. 구버전 npm이 `package-lock.json`의 `libc` 줄을 지우면 `git checkout -- package-lock.json`으로 되돌린다(README "검증").
2. **디자인 미리보기**: `node scripts/preview.mjs 4173` → `http://localhost:4173/`. Claude Code에서는 `.claude/launch.json`의 `design-preview`를 브라우저 pane으로 연다. **화면 시안**은 `node scripts/web-preview.mjs 4174` → `http://localhost:4174/`(launch 이름 `web-prototype`)이며, 값을 정본에서 읽으므로 파일을 직접 열면 동작하지 않는다. 공유 링크: https://claude.ai/code/artifact/8673a33c-900c-4273-8592-0fb3bdcc36a9 — 이 링크는 2026-09-17의 별자리 지도 구현 이후 재발행되지 않았다. 저장소의 로컬 미리보기가 정본이다.
3. **이어서 할 작업 읽기**: [../AGENTS.md](../AGENTS.md) → `tasks/CURRENT_TASK.md`(진행 중인 작업만 있다) → 이 문서 §4.
4. **값을 바꿀 때**: `design/tokens.json`·`docs/DESIGN_SYSTEM.md`·`design/style-guide.html`의 `:root`를 함께 고친다. 어긋나면 quick이 실패한다. `node scripts/check-contrast.mjs --verbose`로 대비와 계열 색차를 본다.
5. **커밋 규칙**은 [../AGENTS.md](../AGENTS.md) §2.1 한 곳에만 있다.

저장소에 **없는 것**(기기마다 다시 준비):

- Claude Code 로그인(구독)과 Cloudflare `wrangler login`. 비밀번호·토큰은 저장소에 없다.
- 스파이크 코드와 secret(`work/spikes/g2a-cloudflare/`, `.spike-secrets.json`)은 Git 제외다. 원격 스파이크 자원(Workers `emotion-diary-spike`, D1 `emotion-diary-spike`)은 Cloudflare 계정에 남아 있으나 합성 데이터는 비웠고 토큰은 회전했다. 다른 PC에서 스파이크를 재현하려면 `docs/ARCHITECTURE.md` §4.6·§5·§6과 `tasks/archive/TASK-BOOTSTRAP.md`의 스파이크 기록을 따라 다시 만든다.
- 로컬 MCP 설정(`.mcp.json`, `.codex/config.toml`, `.claude/settings.local.json`)과 Claude Code 메모리 파일. 없어도 작업에 지장 없다.
- 이식 패키지 원본(`outputs/emotion-diary-agent-seed.zip`). `references/source/journal-template.txt`의 원본이 CRLF 221B임을 판정한 근거였다. 같은 판정은 `references/manifest.json`의 SHA-256으로 재현된다.

## 6. 알려진 제한

- 앱 코드는 아직 없다. `web/`은 눌러 보는 화면 시안일 뿐 저장·인증·API가 없고, Phase 1에서 구조만 옮기고 코드는 버린다(D-047). 스파이크 코드는 `work/`(비추적)에 있고, 정본은 문서와 스키마다.
- 스파이크 자원(Workers·D1)에는 합성 데이터만 넣었고 검증 후 비웠다. 실제 앱은 별도 프로젝트로 배포한다.
- 무료 플랜 한도 수치, Cloudflare Access 적용 가능성, Time Travel 복구 실습은 확인하지 않았다.
- 검증 하네스 `full`의 `test`는 검사기 자체 테스트뿐이다. 앱 script가 생기면 lint/typecheck/test/build가 자동으로 포함된다.
- 기계적 강제(커밋 확인, 소유 파일 확인, Stop 검증)는 Claude Code 세션에만 걸려 있다. Codex 세션에 걸리는 장치는 CI뿐이다(AGENTS 서두, §2.3).
