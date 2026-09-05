# 진행 상황과 다음 할 일

최종 갱신: 2026-09-02. 세부 증거는 [../tasks/CURRENT_TASK.md](../tasks/CURRENT_TASK.md), 결정 근거는 [DECISIONS.md](DECISIONS.md)에 있다. 이 문서는 한눈에 보는 요약이다.

## 1. 지금 어디에 있나

| 단계 | 상태 | 요약 |
| --- | --- | --- |
| Phase 0 — 부트스트랩 | 진행 중 | 정본 문서 완성, Git baseline, 계획 교정(D-017~D-027), 배포·AI 경로 확정(D-029~D-032), 기술 스파이크 완료 |
| Phase 1 — 기반·데이터 무결성 | 대기 | 앱 뼈대(Workers API, D1 migration, 테스트, CI) 착수 승인 대기 |
| Phase 2 — 직접 작성 MVP | 대기 | taxonomy v1 전사 완료(`data/taxonomy/v1.json`), ~~사용자 최종 대조(D-027) 대기~~ **[정정, 2026-09-05] 사용자 최종 대조(D-027) 완료** — v1은 2026-09-04, v2(`data/taxonomy/v2.json`, 9계열 194개)는 2026-09-05에 각각 `review_status: reviewed`로 마쳤다 |
| Phase 4 — 대시보드·알림 | 대기 | — |
| 제한 MVP 릴리스 | 대기 | Phase 1·2·4 완료 후 첫 배포 |
| Phase 3·5 — AI 대화·RAG | 후행 | 모델 경로는 확인됨, 구현은 제한 MVP 이후 |

## 2. 확정된 것

- **제품**: 원형 일기 6영역(날짜·사건·감정+강도·이유·칭찬 3·감사 3), ~~7개~~ **[정정, 2026-09-05] 9개**(taxonomy v2 확정, 공포·혐오 신설) 상위 감정과 원자료의 세부 감정 전부 보존, 복수 감정과 각 1~10 강도, 하루 1개·소급 작성·streak, 결정론적 대시보드, 비진단 원칙.
- **배포(D-032)**: 직접 작성한 백엔드를 무료 클라우드에 올린다 — Cloudflare Pages(정적 UI) + Workers(API, 유일한 진입점) + D1(SQLite 호환). 로그인은 서버 접근 토큰 cookie와 D1 전역 잠금.
- **AI 경로(D-029, D-031)**: 유료 API 없이 PC의 worker가 백엔드 작업 큐를 가져가 Claude Code 헤드리스(`claude -p`)로 처리한다. 작성 보조는 Sonnet 5, 검증·분석은 Opus 5. PC가 꺼져 있으면 AI만 비활성이고 기록·대시보드는 동작한다.
- **순서(D-018)**: 직접 작성+대시보드의 제한 MVP를 먼저 배포하고 AI 대화·RAG는 그 뒤.
- **안전(D-020)**: 위기 감지는 AI 관여 경로에서만, 직접 작성 원문은 자동 스캔하지 않으며 한계를 고지. 위기 리소스는 한국 기준.
- **디자인 시스템(D-033 accepted)**: 원자료 7색 계열의 토큰, 접근성 대비와 계열 색차 자동 검사(216건, 계열 9개 기준), 캐릭터 자산 규격 검사. 감정 입력은 감정 별자리 지도(카테고리, 다중 선택) + 소프트 리스트(세부 감정, 카테고리별 묶음) + 슬라이더(강도)이며 chip은 표시 전용이다(D-037·D-041). 정본 `docs/DESIGN_SYSTEM.md`, 값 `design/tokens.json`, 캐릭터 `design/characters/`. 2026-09-04 사용자 검수로 체크리스트 10건을 모두 확정했다 — 색 값·글꼴(웹폰트 미탑재)·light 전용(D-034), chip 선택 표시·2줄 격자 토글·캐릭터 생성 방식·하단 탐색 이름(D-035), 강도 선택기·앵커 문구·위기 톤·브랜드·탐색 아이콘·밀도(D-036). 검수 과정에서 결함 2건(바램·미움 색 구별 불가, 달력 360px 가로 넘침)을 찾아 고쳤다. 남은 것은 캐릭터 자산 생성과 실기기 확인이다.

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

1. **디자인 시스템**: 결정은 끝났다(D-033 accepted, 세부는 D-034~D-037·D-041). 남은 것은 ① 별자리 지도의 **큰 글자 폴백**(확대 시 3열 격자·칸 101px로 전환, D-038 폴백 결정) 및 `aria-pressed`/`aria-live` 정식 구현 ② 실기기(iPhone Safari·Android Chrome)에서 chip 대비·40px 아이콘 판독성·44px 터치·별자리 조작감 확인 ③ 위기 안내 **연락처 값** 검수다.
2. **캐릭터 아이콘 생성** — **taxonomy v2(4번) 뒤에 한다.** 공포 ~~카테고리가 추가되면 7종이 8종이~~ **[정정, 2026-09-05] ·혐오 카테고리가 함께 추가되어 7종이 9종이** 되는데, 일관성 때문에 전부 같은 seed로 한 번에 만들어야 하므로 지금 만들면 다시 만들어야 한다(D-038). 카테고리 확정 후 codex imagegen으로 생성 → 투명 PNG 1024/120 → `node scripts/check-characters.mjs` 통과 → README §3 눈 검수.
3. **G3 taxonomy v1 전사 — 완료(2026-09-04, 전사·사용자 검수 모두 끝남).** `data/taxonomy/v1.json`에 원자료 이미지 2장의 7계열 194개 세부 감정을 원본 표기 그대로 옮기고 카테고리별 독립 `emotion_code`(D-022)를 발급했다(즐거움 24 / 바램 13 / 슬픔 56 / 분노 28 / 기쁨 32 / 사랑 18 / 미움 23). 1차 자체 재대조에 이어 D-027 사용자 최종 대조(§7.8b)까지 마쳐 `review_status`는 `reviewed`다 — **`TASK-TAXONOMY`의 T4(항목 귀속과 매핑) 입력으로 확정 사용 가능.** 직접 작성 화면의 선행 조건이다. v1은 출처 아카이빙(PR-004)이 목적이고 4번(v2 리서치)은 제품이 쓸 목록 확정이 목적이라 서로 다른 산출물이다(`tasks/TASK-TAXONOMY.md` §2.1).
4. **taxonomy v2 심리학 리서치(D-038)**: 전공자가 봐도 어색하지 않은 감정 목록을 문헌 근거로 만든다. **사용자가 방향을 확정했다 — 공포/두려움 카테고리 신설, 놀람은 기쁨 전용이 아님.** 나머지 귀속·경계는 리서치로 정한다. 원자료의 알려진 문제 — 즐거움·기쁨 경계 중첩, 바램의 동기 성격. 비진단 경계(PR-001)·척도 라이선스·한국어 뉘앙스를 지킨다. **색 창은 이미 좁다**: 8~9계열까지는 가능하나 쓸 수 있는 색상 구역이 초록~청록과 어두운 갈색뿐이고 보라는 포화다(실측, D-038). `emotion_code`(D-022) 마이그레이션 매핑도 함께 만든다. **완료(2026-09-04~05, T0~T6)**: 9계열 194개 확정(`data/taxonomy/v2.json`), 반증 표·근거 등급·라이선스 판정 통과, D-038 `accepted` 전환, 독립 검증(T7a) 8/8 통과. ~~**남은 것은 사용자 최종 대조(D-027)뿐이다** — `review_status`는 아직 `pending_user_review`.~~ **[정정, 2026-09-05]** 사용자 최종 대조(D-027)가 완료됐다 — `review_status`는 `reviewed`(`user_cross_check_by: user`, `user_cross_check_date: 2026-09-05`), `taxonomy-v2-research` 노드는 `done`, 게이트 `taxonomy-evidence`의 라벨 5개(`literature-axes-covered`·`falsification-table-complete`·`evidence-grade-recorded`·`license-check-passed`·`user-or-human-review`) 전부 충족. **승인은 "문제가 없다"는 뜻이 아니다** — 반증 표(`docs/research/taxonomy-v2-decisions.md` §2) 지적 12건 중 해소 3건·부분 해소 2건·해소 안 함 7건을 사용자가 함께 제시받고 이 상태로 진행하기로 한 승인이다.
5. **Phase 1 app-scaffold**: Workers API, D1 migration(현재 스파이크 스키마 기반), 재현 가능한 install, lint/typecheck/test/build 명령, CI. `package.json`의 하네스 명령과 연결.
6. **data-foundation**: 하루 1개 unique, revision/idempotency, hard delete(부모 우선 cascade), versioned JSON export, 합성 fixture 테스트.
7. **direct-journal → dashboard-reminder → 제한 MVP 릴리스**: 원형 6영역 직접 작성, autosave, 완료조건, 달력/상세/수정, 7/30일 통계, 인앱 reminder, 실기기·접근성 검증.
8. **B-06 잔여 검증**(병렬 가능): job 만료·`failed` 전환, verifier 독립 2회 호출, 위기 케이스, 구독 경로의 데이터 보존 설정, 기동 오버헤드 절감.
9. **B-05/B-08 잔여**: 백업 절차와 삭제 지연 고지 문구, iPhone Safari 본체·홈 화면 바로가기·Android Chrome 확인, 무료 한도 수치 기록.
10. **후행**: Phase 3 AI 대화 작성(`safetySignal`, turn token), Phase 5 Evidence 공급망과 RAG 분석(B-07 포함).

## 5. 다른 컴퓨터에서 이어가기

저장소에 있는 것만으로 문서 작업·디자인 검수·하네스 실행이 가능하다. 아래는 순서다.

1. **준비**: Node.js 22 이상, Git, `gh`(선택). `git clone https://github.com/SKUnohtaekyung/emotion-diary.git` 후 `npm run verify:quick`이 PASS인지 확인한다(의존성 설치 불필요).
2. **디자인 미리보기**: `node scripts/preview.mjs 4173` → 브라우저에서 `http://localhost:4173/`. Claude Code에서는 `.claude/launch.json`의 `design-preview`를 브라우저 pane으로 연다. 공유 링크(같은 내용): https://claude.ai/code/artifact/8673a33c-900c-4273-8592-0fb3bdcc36a9
3. **이어서 할 작업 읽기**: `tasks/CURRENT_TASK.md` 맨 위 **TASK-DESIGN** 절(결정 체크리스트 10개)과 이 문서 §4. 새 세션에 "TASK-DESIGN 이어서"라고 말하면 된다.
4. **결정 반영 루프**: 값 변경 → `design/tokens.json`·`docs/DESIGN_SYSTEM.md`·`design/style-guide.html`(`:root` 토큰과 dark-panel 인라인 값) 함께 수정 → `node scripts/check-contrast.mjs --verbose`(대비 + 계열 색차 ΔE) → `npm run verify:quick` → commit → `git push origin main`.

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
