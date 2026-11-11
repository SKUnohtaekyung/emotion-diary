# 구현 로드맵과 단계 게이트

## 원칙

단계 번호는 일정 약속이 아니라 의존 순서다. 각 단계는 앞 단계의 증거가 있어야 시작한다. 미검증 기술 가설이 실패하면 대안을 결정한 뒤 작업 그래프를 수정한다.

이 문서는 **순서와 단계마다의 완료 기준**만 적는다. 노드의 지금 상태는 [../harness/work-graph.yaml](../harness/work-graph.yaml), 숫자와 다음 할 일은 [STATUS.md](STATUS.md), 관문의 라벨 정의는 [EVAL_PLAN.md](EVAL_PLAN.md) §14가 정본이다(D-118).

**2026-10-15 순서 교정(D-116·D-117)**: '서버 → 화면 전부 → 통계 → 출시'로 쌓던 순서를 **'오늘 한 편'을 휴대폰까지 먼저 뚫고 그날부터 실제로 쓰는 순서**로 바꿨다. 범위(직접 작성·대시보드 먼저, AI·RAG 후행 — D-018)는 그대로다. 첫 사용은 **본인 사용 시작**(`personal-start`)과 **공개 출시**(공개를 정할 때만)로 나뉜다. AI 대화 작성은 실사용 30일 뒤, 근거 분석은 60일 뒤 지을지 정한다(D-120·D-121). 근거는 감리 보고서 [../tasks/review/2026-10-14/REPORT.md](../tasks/review/2026-10-14/REPORT.md) §3.3.

**2026-11-11 목표·순서 교정(D-126)**: 사용자가 본인 사용을 하지 않기로 하고 목표를 **다른 사람이 가입해 쓰는 웹앱 공개**로 바꿨다(스토어는 그 뒤, 첫 공개는 AI 없이). `personal-start`는 대체됐고, 실사용 기간(2주·30일·60일)을 기다리던 조건은 없어졌다. 순서는 화면 기초·돌아보기 → 작성 흐름·오늘·설정 → 가입 → 공개 → AI·스토어. 계획은 [../tasks/replan/2026-11-11/PLAN.md](../tasks/replan/2026-11-11/PLAN.md).

```text
Phase 0 부트스트랩(끝)
  → Phase 1  app-scaffold → data-foundation → first-slice · data-control (모두 끝)
             (personal-start 본인 사용 시작 — 2026-11-11 대체됨, D-126)
  → Phase 2  2a dashboard-reminder 화면 기초·돌아보기(달력+통계)
             → 2b direct-journal 작성 흐름·오늘·설정
             → 2c accounts 가입(소셜 로그인·만 14세·동의·탈퇴)
  → 공개 출시 limited-mvp-release(웹앱, AI 없이)
  → Phase 3 AI 대화 작성 · Phase 5 근거 분석(첫 공개 뒤 결정) → Phase 6 전체 출시 · 스토어
```

## Phase 0 — 현재 프로젝트 부트스트랩 (끝, 2026-10-14)

목표: 현재 저장소의 기술 가설을 실제 런타임에 맞게 냉정하게 교정한다.

- 실제 stack/git/hosting/Node/package manager/runtime profile 확인 — G0 Git baseline(D-017)과 G1 계획 교정(D-018~D-027) 완료
- 원자료 보존과 taxonomy 전사 계획 확정
- G2a `hosting-identity-spike`(D-032, 호스팅은 D-111이 교정 — 처음에는 화면을 Pages에 따로 두는 구성으로 적혀 있었으나 스파이크는 처음부터 Worker 하나로 했고 그 구성을 채택했다): Worker 하나(앱 화면과 `/api/*`가 같은 주소) 최소 배포, 접근 토큰 cookie+rate limit, Workers secret 격리, custom header CSRF, worker 전용 Bearer 경로, 휴대폰 접속(B-02/B-03/B-08). Cloudflare 계정·프로젝트 생성은 무료지만 외부 자원이므로 실행 직전 사용자 재확인
- G2b `data-store-spike`: D1 CRUD, unique, 조건부 UPDATE, CHECK/trigger, `batch()` 원자성, wrangler migration, hard delete, Time Travel/export 백업, 무료 한도(B-04/B-05)
- G2c `model-access-spike`(AI 트랙, critical path 밖): 본인 PC `claude -p` 구독 경로(D-029). 최소 스파이크 PASS(2026-09-02), 2026-10-13~14 판정에서 큐 왕복·실패 전환·독립 verifier·지연·위기 케이스·기록 미저장까지 확인했고 **보류 2건**(거절 응답의 실제 재현, 구독 한도 비율)만 남았다 — [STATUS.md](STATUS.md) §3 B-06. 2026-10-15 D-120: AI 쓰기를 짓게 되면 서버 → Claude API 경로로 이 노드를 다시 정의하고, 보류 2건은 그 길에선 묻지 않는다
- G2d `vector-search-spike`(RAG 트랙): 구독/무료 경로의 검색 계층 검증(B-07). 2026-10-15 D-121: 근거 분석을 하게 되면 카드 30~50장을 태그로 찾는 방식이라 필요 없을 공산 — 그 결정 때 다시 본다
- G3a `taxonomy-v1` 원자료 전사+D-027 검수(G2와 병렬 가능). 목적은 **출처 아카이빙**(PR-004)이며 게이트는 `source-fidelity`(원본 사진과 1:1 대조)
- G3b `taxonomy-v2-research` 세부 감정 목록의 심리학 문헌 리서치(D-038). 목적은 **제품이 쓸 목록 확정**이며 게이트는 `taxonomy-evidence`(문헌 축 충족·반증 표·근거 등급·라이선스·검수). G3a와 **병렬 가능하고 G3a를 기다리지 않는다** — 다만 항목 귀속 단계는 v1 전사본을 입력으로 쓰므로 그 시점까지 G3a가 끝나야 한다. 공포·혐오 계열이 신설되어 캐릭터 자산이 7종→9종이 되므로 자산 생성은 이 항목 뒤에 온다(자산은 2026-09-19 이슈 #26으로 완료). **완료(2026-09-04~05)**: taxonomy v2 9계열 194개 확정(`data/taxonomy/v2.json`), 반증 표 판정·근거 등급·라이선스 판정 완료(D-038 `accepted`, D-040), 독립 검증(T7a) 8/8 통과, 사용자 최종 대조(D-027) 완료로 `review_status: reviewed`. 게이트 `taxonomy-evidence`의 라벨 5개(`literature-axes-covered`·`falsification-table-complete`·`evidence-grade-recorded`·`license-check-passed`·`user-or-human-review`)를 전부 충족했다.
- quality gates를 실제 명령으로 채우고 quick/full 통과
- 모든 provisional decision을 confirmed/rejected/unknown으로 평가

Exit: 개인정보·권한·저장 경계가 설명되고, 구현 stack과 테스트 명령이 증거로 확정됨. 불가능하면 **무료** 대체 hosting/data architecture 결정(D-021). G2c/G2d가 미확정이어도 G2a/G2b가 통과하면 Phase 1로 진입할 수 있다.

## Phase 1 — 기반·저장 핵심·첫 조각·내 데이터 통제

### 앱 뼈대 (`app-scaffold`, 끝 — 2026-10-14)

앱 scaffold, session/access guard, migration 방식. 구성은 [ARCHITECTURE.md](ARCHITECTURE.md) §11, 절차는 [DEPLOY.md](DEPLOY.md). 로컬 `verify full`로 끝났고, CI(Ubuntu·Windows)는 2026-10-15 PR #37에서 앱 코드를 처음 돌렸다 — 1회차는 Windows가 생성 타입 파일의 줄바꿈 때문에 실패해 `.gitattributes`로 고쳤고 2회차는 두 OS 모두 통과했다(STATUS §1 숫자 표). data-foundation 코드의 CI 초록은 관문 `data-integrity`의 `ci-green`이 본다.

### 1a. 저장 핵심 (`data-foundation`, 관문 `data-integrity`)

- server-derived owner, owner별 저장소와 서버 권한 검사
- 일기·감정 표의 versioned migration(0005부터)
- 오늘 임시저장·완료·조회·수정(draft CRUD), 하루 1개 unique, revision, idempotency
- 틀린 열쇠 잠금 고침 — 맞는 열쇠는 잠금과 상관없이 통과하고 틀린 시도만 막는다(감리 보고서 §5.2, RK-041)
- 정했다(2026-10-15, D-122): '쓰던 단계'는 서버에(RK-043), 하루 기준 시각(`day_start_hour`, 기본 4시)은 `owner_settings`에 두고 바꾸는 서버 길은 지금·화면은 `direct-journal`에서. 진행은 `tasks/data-foundation/2026-10-15/PLAN.md`
- 합성 fixture, 권한/날짜/transaction 테스트

Exit: 다른 owner 접근, 중복 날짜, stale overwrite, 하루 기준 시각 경계(F-17 — 저장된 날짜는 나중에 고칠 수 없다)가 자동 테스트에서 차단되고 CI가 초록.

### 1b. 첫 조각 '오늘 한 편' (`first-slice`, 관문 `first-slice`)

- 작성 흐름 상태 설계 한 장(단계는 주소에, 저장은 입력 멈춤마다, 한글 조합 중 값 건드리지 않기, 단계 계산은 순수 함수 — 감리 보고서 §5.3)
- 연출 없는 평면 화면으로 사건 → 계열·세부 감정·강도 → 이유 → 칭찬·감사(비워도 됨) → 완료. 확정된 taxonomy v2(9계열 194개)를 seed로
- 서버 임시저장, 화면이 통째로 새로 열린 뒤 쓰던 단계로 복구(F-24, RK-034)
- 여기서 정한다: 자판 아래 버튼 배치(S-07 — 본문 흐름에 두는 안 추천, RK-042), 기기 안 짧은 사본을 둘지(RK-043), 실제 브라우저 E2E 도구
- 정했다(2026-10-16, D-123): 버튼은 내용 바로 뒤(U-1), 서버로 못 보낸 글만 휴대폰에 잠깐(U-2), 완료한 기록 고치기·쓰던 글 지우기를 이 조각에 넣음(U-3), E2E는 Playwright(WebKit·Chromium, 로컬 https). 기록은 `tasks/first-slice/2026-10-16/`
- 휴대폰 약 10분(정한 배치에서 자판과 아래 버튼, 완전히 닫았다 열기, 5분 떠났다 오기, 앱 전환 화면 가림)

Exit: `first-slice` 관문 — F-03·04·05·08·24, 강제 새로고침·연결 끊김 복원 E2E, iPhone 확인.

### 1c. 내 데이터 통제 (`data-control`, 관문 `data-control`)

- 내보내기(versioned JSON, 공유 창)와 hard delete(전체 삭제는 부를 이름·앱 잠금까지 — D-112 ⑩)
- 본인 PC 백업과 다시 넣는 도구(D-109), 복원 연습(복원 뒤 세션 기록 비우기)
- 합성 3년치로 내보내기 CPU 실측(무료 10ms)
- 여기서 정한다: 부를 이름을 내보내기에 넣을지

Exit: `data-control` 관문 — F-14·F-15, 복원 연습 기록, 내보내기 CPU 실측.

## 본인 사용 시작 (`personal-start`, 관문 `personal-start` — D-116·D-117) — 2026-11-11 대체됨(D-126)

운영 건물 `emotion-diary-prod`·`#/help`·자판 배치 C·첫 백업 복원까지 짓고 관문 판정 전에 대체됐다. 지은 것은 공개 준비가 이어 쓴다. 기록은 [../tasks/archive/TASK-PERSONAL-01.md](../tasks/archive/TASK-PERSONAL-01.md). 아래는 당시 기준이다.

- 운영 건물·운영 열쇠(만들기 직전 사용자 확인). [DEPLOY.md](DEPLOY.md) §1·§8의 '제한 MVP 출시 전'은 이 단계를 뜻한다 — 그 문서의 표기는 이 단계에서 고친다
- 위기 안내 화면(`#/help` — 2026-10-15 앱에 아직 없다)을 짓고 '임상·안전 검토 전' 표기로 본인만 본다(D-094·D-117). 설정 화면이 없는 동안의 진입점은 여기서 정한다
- 운영 백업 1회와 복원 확인. **이때부터의 규칙**: 창고 구조를 바꾸는 작업 전마다 내보내기 + 백업, 바꾼 뒤 복원 확인(RK-045)
- 공개 기준(Android·건강정보 별도 동의·임상 검토·S·T 전부·화면 낭독기)은 요구하지 않는다

Exit: `personal-start` 관문 통과 — 그날부터 본인이 실제 일기를 쓴다.

## Phase 2 — 시안 이식과 가입 (D-126)

2026-11-11 D-126으로 순서를 바꿨다 — 돌아보기를 먼저, 작성 흐름을 그다음, 가입을 마지막에. 평면 화면으로 먼저 짓지 않고 처음부터 승인한 시안(`web/`, TASK-WEB-UI-02) 모양으로 짓는다. 조각 지도는 [../tasks/direct-journal/2026-10-20/MAP.md](../tasks/direct-journal/2026-10-20/MAP.md) §5를 그대로 쓰고, 휴대폰 확인은 단계마다 한 번씩 모아서 한다(D-126). 실사용을 기다리지 않으므로 화면은 개발용 건물의 합성 기록으로 짓고 확인한다.

### 2a. 화면 기초와 돌아보기 (`dashboard-reminder`, 관문 `reflection-core`)

- 화면 기초: 시안의 토큰·그림·스크롤/움직임 줄이기 도우미, 하단 탐색, 기본 부품(MAP §5 조각 0). **화면은 Preact로 바꾼다**(D-127 — D-114를 교정, 감리 보고서 §5.3: 바꾸는 비용이 화면을 옮길수록 커진다). 도입은 이 단계 첫머리
- 달력: 한 달, 작은 편지, 지난 임시저장 쪽지. 서버에 한 달 목록 경로(날짜와 상태만, 완료한 날의 내용은 있는 `GET /api/diaries/:date`)
- 통계: 요약 + 친구 상세, 비중/빈도/평균+n, 기간 비교·친밀도(D-064·D-086). 계산은 `app/shared/`의 순수 함수로 두어 서버·기기 어느 쪽에서든 돌게 한다 — 서버가 일기를 못 읽게 할지(2c 앞의 결정)에 따라 계산 위치가 바뀔 수 있다
- timezone/backfill/missing data 경계 테스트
- 알림(F-13)은 여기서 짓지 않는다 — 공개 준비에서 둘지·기본값을 정한다

Exit: `reflection-core` — 같은 fixture에서 계산이 재현되고, iPhone 홈 화면 앱에서 달력·통계 확인(`mobile-reflection`).

### 2b. 작성 흐름·오늘·설정 (`direct-journal`, 관문 `core-product`)

첫 조각(D-123)에서 넘어온 것: 완료 화면의 `달력 보기`·`통계 보기` 두 버튼(D-078 — 2a 뒤라 둘 다 있다), 완료한 기록의 `완료 취소`·영구 삭제(UX_SPEC §7), 평면 화면을 시안 연출(친구·조약돌·바구니·편지 봉투)로 바꾸기, 있었던 일 안내 네 단계 가운데 둘째~넷째(첫 기록일 값이 서버에 필요 — D-105 ③, 사람별 값이라 2c 뒤에도 그대로 쓴다). 앞으로 가기로 끝난 흐름의 주소에 다시 들어가면 그 기록의 고치기 화면이 열린다(마감 검토 L-4).

- 작성 흐름(MAP §5 조각 1~6): 작성 틀, 마음 고르기·세부 감정, 크기, 글 쓰는 단계, 편지·봉인·완료, 기록 메뉴(서버에 완료 취소 경로). 마음 고르기는 언덕 위 자유 배치(D-066 확정, 큰 글자·겹침이면 격자), 오늘 기록이 있는 날 돌을 누르면 읽는 편지(D-128)
- 오늘 숲·로딩·덮개·잠금과 설정(조각 8·9)
- 복수 세부 감정과 각 1~10 강도, autosave·복구·완료조건, 그날만 새로 쓰기(D-082), 하루 기준 시각(F-17), 작성 흐름 이동(F-18), 못 보낸 글의 기기 사본(F-19), 주요 화면 예외 상태(F-21)
- 모바일·접근성 핵심 흐름(iPhone, 키보드·자동 검사 — Android와 화면 낭독기는 공개 관문)

Exit: `core-product` 관문 통과(EVAL_PLAN §14).

### 2c. 가입 (`accounts`, 관문 `accounts` — D-126)

- 소셜 로그인(카카오·구글. iOS 스토어에 낼 때는 Apple도), 가입 때 만 14세 이상 확인, 접근 열쇠 퇴역. 표는 이미 모든 행에 `owner_key`가 있어 바뀌는 것은 세션 주체다(`app/worker/src/context.ts`)
- 이용약관·개인정보 처리방침·건강정보 별도 동의(D-093, `SAFETY_POLICY` §3) — 법 검토를 받을지는 착수 때 정한다
- 회원 탈퇴(모든 기록·설정·세션·소셜 계정 연결), 사람별 데이터 분리 재검증(`owner-isolation`)
- 시안의 들어오는 길·온보딩(MAP §5 조각 10·11)
- 착수 전에 정한다: 운영자가 일기를 읽을 수 있는 구조인지(서버가 못 읽는 암호화 여부 — 감리 보고서 공개 갈림길)
- 운영 건물의 창고 구조를 바꾸므로 RK-045 규칙(바꾸기 전 내보내기 + 백업, 바꾼 뒤 복원 확인)을 지킨다

Exit: `accounts` 관문 통과(EVAL_PLAN §14).

## 공개 출시 — 직접 작성 + 결정론적 대시보드 (`limited-mvp-release`, 목표 단계 — D-018·D-117·D-126)

2026-11-11부터 이 단계가 목표다(D-126) — 웹앱으로, AI 없이. 처음 누구에게 여는지·알림을 둘지는 이 단계 앞에서 정하고, 운영 백업은 여러 사람 기준으로 다시 정한다(본인 PC 백업 D-109는 1명용). 처음에는 다른 사람에게 열기로 정할 때만 하는 단계였다. 노드 id는 그대로 두고 뜻을 '공개 출시'로 바꿨다(옛 이름 '제한 MVP 릴리스'). 게이트는 [EVAL_PLAN.md](EVAL_PLAN.md) §14 `limited-release` + `public-only`다.

- Phase 6의 접근·비밀값·로그·보존 재감사, 실제 기기 검증(Android Chrome 포함), 개인정보 고지, export/delete를 이 릴리스에 그대로 적용
- AI 진입점은 비활성 또는 미제공으로 정확히 표시하고, 위기 연락처는 설정 입구의 위기 안내 화면(`#/help`)에서 `data/crisis-resources/kr.json`으로 제공(D-020·D-094)
- **공개 차단**: 위기 안내 연락처의 임상·안전 검토와 표시 직전 재확인 — 번호·운영 시간·순서·문구, 휴대전화에서 1388이 지역번호 없이 걸리는지(공식 안내는 '지역번호+1388', 통신사 실측 필요), `kr.json`의 `review.clinicalSafety`를 `pending`에서 바꾸는 근거를 남긴다(D-094)
- 알려진 제한 공개: AI 대화·분석 미제공, 직접 작성 원문 자동 감시 없음
- 건강 민감정보 별도 동의 흐름을 이 릴리스 전에 설계·구현한다(개인정보 보호법 제23조 — 별도 동의를 받는 방향으로 정했다, D-093, `SAFETY_POLICY` §3). 동의 문구·시점·거부 시 동작을 처리방침 제30조와 함께 정한다
- 공개 갈림길(감리 보고서 §3.3): 가입·복구·사용자별 분리·운영자가 일기를 읽을 수 있는 구조인지는 2c(`accounts`)로 옮겼다(D-126). AI 이용 정책(18세 미만 대상 지침)·유료 전환은 AI를 붙일 때 정한다

Exit: `limited-release` 게이트 통과. 권한·개인정보·데이터 무결성 미달이면 축소 출시도 불가.

## Phase 3 — AI 대화형 작성 (후행 단계, D-018 — 첫 공개 뒤 결정, D-126이 D-120을 교정)

지을지부터 첫 공개 뒤 사용자가 정한다(D-126 — 처음에는 직접 쓰기 30일 뒤였다). 짓게 되면 **서버가 Claude API를 바로 부르는 길**(Max 요금제에 포함된 월 API 크레딧)로 짓고, 크레딧이 없어지면 본인 PC + `claude -p` 경로로 바꿔 끼울 수 있게 작업 큐 + 처리기 모양으로 짓는다. 선행 조건: `model-access-spike`를 서버 직통 확인으로 다시 정의해 통과. 미통과면 이 단계 전체를 보류하고 UI의 AI 진입점을 비활성 표시한다(D-019).

- Journal Conversation/Structuring schema(`safetySignal`, turn token 포함)
- 위기 전환 흐름(한국 리소스, D-020)
- 말하지 않은 정보 금지, 사용자 최종 확인, 근거 없는 심리학 문장 0(D-121 — 근거 분석 전에는 AI가 심리학 설명을 하지 않는다)
- transcript 비저장과 structured draft 복구
- timeout/rate-limit/direct fallback
- 최소 50개 합성 대화 평가
- AI 사용 사전 고지 한 줄을 AI 작성 입구에 둔다(인공지능 기본법 제31조 제1항, 시행령 제23조 — 약관 기재 또는 화면 표시). AI 결과물에는 AI가 만들었다는 표시를 함께 둔다(제31조 제2항). 온보딩일 필요는 없다 — 이 단계에서 AI 진입점이 열릴 때 같이 만든다(D-093, `SAFETY_POLICY` §10)

Exit: 구조 충실성·사용자 주도권·오류 fallback 합격. RAG 분석과 결합하지 않음.

## Phase 5 — 근거 분석 (후행 단계, D-018 — 첫 공개 뒤 결정, D-126이 D-121을 교정)

지을지부터 첫 공개 뒤 사용자가 정한다(D-126 — 처음에는 직접 쓰기 60일 뒤였다). 짓게 되면 사람이 고른 근거 카드 30~50장을 파일로 두고 태그로 찾는 작은 방식이다 — 검색 계층 스파이크(`vector-search-spike`)를 남길지는 그때 정한다. 독립 verifier 호출 구성 가능(D-026)은 그대로 선행 조건이다.

- Evidence Card schema, 1인 시간 분리 검수 workflow(D-027), source rights/provenance
- 카드 검색(태그·metadata filter), Gate
- claim-evidence code checks, independent semantic verifier, safety validator
- prompt injection/상충/근거부족/위기 평가
- Evals dataset와 release evidence bundle

Exit: false pass 0, unsupported claim 0, citation validity 100% 등 [EVAL_PLAN.md](EVAL_PLAN.md)의 차단 게이트 통과. 미달이면 분석 기능을 출시하지 않고 결정론적 dashboard만 배포 가능.

## Phase 6 — 전체 MVP 출시

공개 출시에 Phase 3·5를 더한 `release-candidate`다. 아래 항목은 공개 출시에서 이미 수행한 것을 AI 경로 포함으로 재실행한다.

- 공개 URL 노출·비밀값·로그·백업 재감사
- iPhone Safari/Android Chrome 실제 기기 검증
- 성능/비용/rate limit/장애 복구 시험
- 개인정보 고지, 데이터 export/delete, 위기 문구 검토
- 알려진 제한 공개와 rollback 방법

Exit: 차단/높음 결함 0, full harness와 release evidence bundle 승인.

## Post-MVP 후보

- 검증된 Web Push/PWA offline
- STT 또는 음성 입력(실시간 음성과 분리 평가)
- 다중 사용자/공개 인증
- CSV·재가져오기
- hybrid search/reranker/외부 vector DB
- 알림 scheduler와 운영 dashboard

어떤 후보도 PRD/Decision 변경 없이 MVP에 끼워 넣지 않는다.
