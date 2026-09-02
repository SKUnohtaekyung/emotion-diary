# 진행 상황과 다음 할 일

최종 갱신: 2026-09-02. 세부 증거는 [../tasks/CURRENT_TASK.md](../tasks/CURRENT_TASK.md), 결정 근거는 [DECISIONS.md](DECISIONS.md)에 있다. 이 문서는 한눈에 보는 요약이다.

## 1. 지금 어디에 있나

| 단계 | 상태 | 요약 |
| --- | --- | --- |
| Phase 0 — 부트스트랩 | 진행 중 | 정본 문서 완성, Git baseline, 계획 교정(D-017~D-027), 배포·AI 경로 확정(D-029~D-032), 기술 스파이크 완료 |
| Phase 1 — 기반·데이터 무결성 | 대기 | 앱 뼈대(Workers API, D1 migration, 테스트, CI) 착수 승인 대기 |
| Phase 2 — 직접 작성 MVP | 대기 | taxonomy v1 전사가 선행 |
| Phase 4 — 대시보드·알림 | 대기 | — |
| 제한 MVP 릴리스 | 대기 | Phase 1·2·4 완료 후 첫 배포 |
| Phase 3·5 — AI 대화·RAG | 후행 | 모델 경로는 확인됨, 구현은 제한 MVP 이후 |

## 2. 확정된 것

- **제품**: 원형 일기 6영역(날짜·사건·감정+강도·이유·칭찬 3·감사 3), 7개 상위 감정과 원자료의 세부 감정 전부 보존, 복수 감정과 각 1~10 강도, 하루 1개·소급 작성·streak, 결정론적 대시보드, 비진단 원칙.
- **배포(D-032)**: 직접 작성한 백엔드를 무료 클라우드에 올린다 — Cloudflare Pages(정적 UI) + Workers(API, 유일한 진입점) + D1(SQLite 호환). 로그인은 서버 접근 토큰 cookie와 D1 전역 잠금.
- **AI 경로(D-029, D-031)**: 유료 API 없이 PC의 worker가 백엔드 작업 큐를 가져가 Claude Code 헤드리스(`claude -p`)로 처리한다. 작성 보조는 Sonnet 5, 검증·분석은 Opus 5. PC가 꺼져 있으면 AI만 비활성이고 기록·대시보드는 동작한다.
- **순서(D-018)**: 직접 작성+대시보드의 제한 MVP를 먼저 배포하고 AI 대화·RAG는 그 뒤.
- **안전(D-020)**: 위기 감지는 AI 관여 경로에서만, 직접 작성 원문은 자동 스캔하지 않으며 한계를 고지. 위기 리소스는 한국 기준.
- **디자인 시스템(D-033, provisional)**: 원자료 7색 계열의 토큰, chip 중심 강조, 접근성 대비 자동 검사. 정본 `docs/DESIGN_SYSTEM.md`, 값 `design/tokens.json`. 사용자 시각 검수 대기.

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

## 4. 다음 할 일 (우선순위 순)

1. **디자인 시스템 검수**: 스타일 가이드 미리보기에서 7개 감정 색·chip·강도 선택기·달력 상태를 확인하고 D-033을 accepted로 전환. 캐릭터 아이콘 자산은 taxonomy 검수와 함께 제작.
2. **G3 taxonomy v1 전사**: 원자료 이미지 2장의 세부 감정을 카테고리별 code(D-022)로 전사하고 시간 분리 2회 검수 또는 사용자 최종 대조(D-027). 직접 작성 화면의 선행 조건.
3. **Phase 1 app-scaffold**: Workers API, D1 migration(현재 스파이크 스키마 기반), 재현 가능한 install, lint/typecheck/test/build 명령, CI. `package.json`의 하네스 명령과 연결.
4. **data-foundation**: 하루 1개 unique, revision/idempotency, hard delete(부모 우선 cascade), versioned JSON export, 합성 fixture 테스트.
5. **direct-journal → dashboard-reminder → 제한 MVP 릴리스**: 원형 6영역 직접 작성, autosave, 완료조건, 달력/상세/수정, 7/30일 통계, 인앱 reminder, 실기기·접근성 검증.
6. **B-06 잔여 검증**(병렬 가능): job 만료·`failed` 전환, verifier 독립 2회 호출, 위기 케이스, 구독 경로의 데이터 보존 설정, 기동 오버헤드 절감.
7. **B-05/B-08 잔여**: 백업 절차와 삭제 지연 고지 문구, iPhone Safari 본체·홈 화면 바로가기·Android Chrome 확인, 무료 한도 수치 기록.
8. **후행**: Phase 3 AI 대화 작성(`safetySignal`, turn token), Phase 5 Evidence 공급망과 RAG 분석(B-07 포함).

## 5. 다른 컴퓨터에서 이어가기

저장소에 있는 것만으로 문서 작업·디자인 검수·하네스 실행이 가능하다. 아래는 순서다.

1. **준비**: Node.js 22 이상, Git, `gh`(선택). `git clone https://github.com/SKUnohtaekyung/emotion-diary.git` 후 `npm run verify:quick`이 PASS인지 확인한다(의존성 설치 불필요).
2. **디자인 미리보기**: `node scripts/preview.mjs 4173` → 브라우저에서 `http://localhost:4173/`. Claude Code에서는 `.claude/launch.json`의 `design-preview`를 브라우저 pane으로 연다. 공유 링크(같은 내용): https://claude.ai/code/artifact/8673a33c-900c-4273-8592-0fb3bdcc36a9
3. **이어서 할 작업 읽기**: `tasks/CURRENT_TASK.md` 맨 위 **TASK-DESIGN** 절(결정 체크리스트 10개)과 이 문서 §4. 새 세션에 "TASK-DESIGN 이어서"라고 말하면 된다.
4. **결정 반영 루프**: 값 변경 → `design/tokens.json`·`docs/DESIGN_SYSTEM.md`·`design/style-guide.html`(`:root` 토큰과 dark-panel 인라인 값) 함께 수정 → `node scripts/check-contrast.mjs --verbose` → `npm run verify:quick` → commit → `git push origin main`.

저장소에 **없는 것**(기기마다 다시 준비):

- Claude Code 로그인(구독)과 Cloudflare `wrangler login`. 비밀번호·토큰은 저장소에 없다.
- 스파이크 코드와 secret(`work/spikes/g2a-cloudflare/`, `.spike-secrets.json`)은 Git 제외다. 원격 스파이크 자원(Workers `emotion-diary-spike`, D1 `emotion-diary-spike`)은 Cloudflare 계정에 남아 있으나 합성 데이터는 비웠고 토큰은 회전했다. 다른 PC에서 스파이크를 재현하려면 `docs/ARCHITECTURE.md` §4.6·§5·§6과 `tasks/CURRENT_TASK.md`의 스파이크 기록을 따라 다시 만든다.
- 로컬 MCP 설정(`.mcp.json`, `.codex/config.toml`, `.claude/settings.local.json`)과 Claude Code 메모리 파일. 없어도 작업에 지장 없다.
- Git 커밋 규칙: 한국어 메시지, 마지막 줄 `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## 6. 알려진 제한

- 앱 코드는 아직 없다. 스파이크 코드는 `work/`(비추적)에 있고, 정본은 문서와 스키마다.
- 스파이크 자원(Workers·D1)에는 합성 데이터만 넣었고 검증 후 비웠다. 실제 앱은 별도 프로젝트로 배포한다.
- 무료 플랜 한도 수치, Cloudflare Access 적용 가능성, Time Travel 복구 실습은 확인하지 않았다.
- 검증 하네스 `full`은 아직 문서 하네스만 검사한다. 앱 script가 생기면 lint/typecheck/test/build가 자동으로 포함된다.
