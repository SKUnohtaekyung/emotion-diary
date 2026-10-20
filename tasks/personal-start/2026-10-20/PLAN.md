# 2026-10-20 TASK-PERSONAL-01 계획 — personal-start(본인 사용 시작): 운영 건물에서 본인이 실제 일기를 쓰기 시작한다

요청과 사용자 답은 [REQUESTS.md](REQUESTS.md). **이 문서가 이 작업의 유일한 진행 기록이다**(D-118). 한 항목을 끝낼 때마다 체크하고 그 줄에 결과와 근거(명령 → 결과)를 적는다. 사용자 답 U-3에 따라 승인을 기다리지 않고 진행한다. 커밋은 U-4대로 끝에 둘, 문구는 비유 없이 기술 용어로.

## 0. 이어 받는 사람에게

- 읽는 순서: 이 문서 → [REQUESTS.md](REQUESTS.md) → `harness/quality-gates.yaml`의 `personal-start` → `docs/EVAL_PLAN.md` §14(`deployment-boundary-review`·`backup-and-restore-drill`·`mobile-personal`·`crisis-help-unreviewed-label`) → `docs/DEPLOY.md` §8·§9 → `docs/UX_SPEC.md` §3 '도움이 필요할 때 보기'·§17 → `app/scripts/`(cf·make-secrets·remote-check·backup·drill).
- 브랜치 `slice/phone-check`(`main` `d2ed814` 위). 2026-10-20 사용자 지시로 휴대폰 확인 전에 커밋 셋(first-slice 마감 기록 / personal-start / direct-journal 착수 준비)을 만들어 `main`에 반영했다(4-10). 다음 세션은 `main`에서 새 브랜치로 이어 간다.
- SERVICE_WHY §20 점검: 위기 안내는 진단·판단이 아니라 연락처 안내이고 '검토 전'을 숨기지 않는다 / 운영은 본인 한 사람(D-108) / 기록 강제 없음 / 데이터 통제(내보내기·지우기·백업)는 data-control에서 갖췄다 — 일곱 질문 모두 통과로 본다.

## 1. 사실표 (여기 한 벌만)

| 무엇 | 값 | 근거 |
| --- | --- | --- |
| 운영 이름 | Worker `emotion-diary-prod`, D1 `emotion-diary-prod`(APAC) | `wrangler.jsonc` env.prod, `cf.mjs` create |
| 요금 | 0원. 무료 한도는 **계정 단위라 개발용과 나눠 쓴다** — Workers 요청 하루 10만, D1 쓰기 하루 10만 행, D1 10개 | `harness/runtime-profile.json` free_tier_limits_confirmed(2026-10-13 공식 문서) |
| 운영 비밀값 | `work/deploy/prod.secrets.env`·`prod.PHONE-KEY.txt`·`prod.BACKUP-TOKEN.txt`·`prod.url`(모두 Git 제외) | `make-secrets.mjs`, `cf.mjs` |
| 운영 명령 걸쇠 | `ALLOW_PROD=1`일 때만 운영 명령을 받는다(그대로 둔다) | `cf.mjs` |
| 마이그레이션 | 0001~0008 | `app/migrations/` |
| 위기 연락처 | `data/crisis-resources/kr.json` version 2026-09-25, `review.clinicalSafety: pending` | D-094 |
| 개발용 건물 | 빌드 `20261019161722-d2ed814`, 사용자의 휴대폰 가짜 기록 한 편이 남아 있다 | first-slice PLAN 5-11·5-12 |

## 2. 결정표

사용자 결정(REQUESTS의 U-1~U-4)만 '사용자 결정'이다. 아래 A는 에이전트 세부다.

| # | 정한 것 | 근거 |
| --- | --- | --- |
| A-1 | `#/help` 진입점: 설정 화면이 생기기 전까지 **오늘 화면 아래 버튼 줄**(앱 잠금·내 기록 내보내기·모든 기록 지우기·로그아웃이 있는 줄)에 '도움이 필요할 때'. 설정 화면이 생기면 `direct-journal`에서 설정의 '도움과 안내' 묶음으로 옮긴다 | UX_SPEC §3('설정에서만 들어온다', D-093) — 그 줄이 지금의 설정 자리다 |
| A-2 | `#/help`는 로그인 뒤 화면(다른 화면과 같은 문지기). 돌아갈 곳으로 기억해도 되는 화면에 넣는다 | UX_SPEC §17 |
| A-3 | 연락처는 `kr.json`을 화면 묶음에 넣어 읽고, 112·119는 화면 코드의 상수로도 둔다(자원과 상관없이 보인다) | EVAL §14 `crisis-help-unreviewed-label` |
| A-4 | '검토 전' 표기는 `review.clinicalSafety`가 `reviewed`가 아니면 보인다 | 같은 라벨, D-117 |
| A-5 | 운영 원격 검사: `remote-check.mjs prod`는 **실제 일기를 건드리지 않는 운영판**(이름·잠금·일기 쓰기 없음, 정리 없음, 오류 보고 경로 404). `--fresh`를 붙이면 운영이 비었을 때만(일기·설정 0행 확인) 개발용과 같은 쓰기 검사를 하고 끝에 비운다 — 첫 올리기 한 번 | DEPLOY §8 '운영판' |
| A-6 | 첫 백업·복원 확인: 새 스크립트 `app/scripts/prod-restore-check.mjs` — 빈 운영에 가짜 한 편·이름 → `backup.mjs pull prod` → 개발용 비우고 `backup.mjs restore dev` → 개발용 내보내기가 백업 파일과 같은지 → 양쪽 정리. 실제 일기가 생긴 뒤의 복원 확인을 어디에 할지는 DEPLOY §9에 남긴다 | EVAL §14 `backup-and-restore-drill`('운영이 아닌 곳에 되살려 같은지') |
| A-7 | 운영 열쇠는 `work/deploy/prod.PHONE-KEY.txt`를 PC에서 보고 직접 입력(채팅·캡처 금지), 앱 주소는 채팅으로 | DEPLOY §8, 운영 열쇠 채팅 금지 규칙 |
| A-8 | 겹침 결함: 조사(하위 에이전트) → 개발용 상태 칸에 측정값과 고치는 방식 전환 → 휴대폰에서 한 번에 고르고 → 고른 방식만 운영에 | U-2 |
| A-9 | 운영 백업 예약은 사용자가 `backup.mjs schedule-command prod`가 출력한 명령을 실행한다 | D-124 |

## 3. 변경 지도 (지금 → 바꿀 것)

| 파일 | 바꿀 것 |
| --- | --- |
| `app/scripts/make-secrets.mjs` | `prod` 환경 |
| `app/scripts/cf.mjs` | 걸쇠 문구를 '본인 사용 시작'으로, 운영 지우기 이중 확인 유지 |
| `app/scripts/remote-check.mjs` | `prod` 운영판 + `--fresh`(A-5) |
| `app/scripts/prod-restore-check.mjs` | 새로(A-6) |
| `app/client/src/views/help.ts`·`styles/help.css`·`lib/routes.ts`·`main.ts`·`views/today.ts` | `#/help`(A-1~A-4) |
| `app/test/client/help.test.ts`·`routes.test.ts`, `app/test/e2e/help.spec.ts` | 시험 |
| `app/client/index.html`·`styles/base.css`·`styles/write.css`·`dev/panel.ts` | 겹침 결함(A-8) |
| `docs/DEPLOY.md` | §1 표·§8의 '제한 MVP 출시 전' → '본인 사용 시작 전', 운영 절차를 실제 명령으로, 무료 한도 공유 |
| `docs/EVAL_PLAN.md` §4·§6, `docs/STATUS.md` §1·§4, `docs/UX_SPEC.md`(진입점), `docs/DECISIONS.md`(D-125), `docs/RISK_REGISTER.md`, `harness/*` | 결과·결정·상태 |

## 4. 순서 (체크리스트)

- [x] 4-1 요청서·이 계획·CURRENT_TASK(`- 동시 작업: 켬`)·loop-state·work-graph(`personal-start` in_progress) — `verify --mode quick` PASS
- [x] 4-2 겹침 결함 조사(읽기 전용 하위 에이전트 `researcher`, Sonnet) — 이 증상을 그대로 적은 버그는 못 찾음. 가까운 보고: bugs.webkit.org 301994(홈 화면 앱에서 웹 화면이 상태 막대 밑 약 62pt만큼 모자람, 26.5.2에서 다시 보고), 316008(`black-translucent`가 없으면 `100vh`·`lvh`가 틀리고 body가 스크롤됨), 300523(Dynamic Island 기종에서 visual viewport가 밀려 sticky·fixed 헤더가 안전 영역으로), 322900·323322(자판 뒤 `offsetTop` 어긋남). **출처 확인은 하위 에이전트 보고 그대로 — 메인이 열어 보지 않았다.** 가설 H1 문서가 화면보다 길어(body 최소 높이 100dvh) iOS가 문서를 스크롤 / H2 시스템이 보이는 영역을 당김. 주의: 지금 S-07 PASS가 이 올림 덕일 수 있다 — 올림을 없애면 '다음'이 자판에 가리는지 다시 본다
- [x] 4-3 `#/help` 화면(Sonnet 작업자, 소유 파일 나눔) — 작업자 보고: 새 `views/help.ts`·`styles/help.css`·`help.test.ts`(35건)·`e2e/help.spec.ts`, 고친 `routes.ts`·`main.ts`·`today.ts`(버튼은 아래 줄 맨 앞 — 줄이 접혀도 먼저 보이고 지우기 곁이 아님)·`routes.test.ts`·`today.test.ts`. 메인이 다시 잼: diff 읽기, 운영 시간 줄의 '운영 시간 ·' 머리말을 뺌(1577-0199의 '야간·공휴일에는 …'이 어색하게 읽힘 — 시안 `web/js/views/entry.js`와 같게, 시험 기대값도), `npx vitest run --project client` 23파일 330건 PASS, `npx biome check app` 오류 0, `npm run typecheck` 종료 0, `npx playwright test app/test/e2e/help.spec.ts` 2/2(WebKit·Chromium), 로컬 앱(`app-local`, 375×812)에서 오늘 → 위기 안내를 캡처로 봄(박스 속 박스·기본 링크 모양 없음, '검토 전'이 본문 크기, 콘솔 오류 0). 작업자가 남긴 의문: ① 휴대전화의 `tel:1388`은 지역번호가 필요할 수 있다(`kr.json` `carrierCall: unverified` — 줄에 `mobile` 안내를 보임, 번호 바꾸기는 하지 않음) ② 119 문자 링크 없음(명세대로 안내 문장만) ③ 출처 묶음이 길다(명세대로 펼침). `- 동시 작업: 켬` 줄을 지움
  - 결함 주입 9종 모두 시험이 잡음(scratchpad `fault-inject.mjs`, 매번 원래 바이트로 되돌리고 SHA-256 대조): '검토 전' 늘 숨김·112 상수 113·연락처 목록 비움·`tel:` 숫자 거르기 뺌·도움 버튼이 다른 화면·help를 돌아갈 곳에서 뺌·자판 측정에 글 칸 값을 실음·배치 클래스 안 닮·단추에서도 잼
- [x] 4-4 운영 스크립트 — `make-secrets.mjs prod`(이미 있으면 `all`이 멈추고 `--rotate`일 때만), `cf.mjs` 걸쇠 문구, `remote-check.mjs prod`(운영판 + `--fresh`: 시작 때 일기·설정 0행 확인, 끝에 비우고 0행 확인), 새 `prod-restore-check.mjs`, `backup.mjs restore prod`에 걸쇠. `node --check`·`biome lint` 통과, 걸쇠 동작 확인(`backup.mjs restore prod` → 멈춤, 종료 1). `docs/DEPLOY.md` §1 표·무료 한도 공유·§8 운영 절차·§9
- [x] 4-5 운영 만들기 → 마이그레이션 → 비밀값 → 올리기 → `remote-check prod --fresh --tail` → 첫 백업·복원 확인
  - 2026-10-20: `wrangler whoami` 로그인 확인 → `make-secrets.mjs prod all`·`prod backup`(값은 찍지 않음, 개발용과 다섯 값·열쇠 모두 다름을 node로 대조) → `ALLOW_PROD=1 cf.mjs prod create`(D1 `emotion-diary-prod`, `wrangler.jsonc` 바뀌지 않음) → `prod migrate`(0001~0008 ✅). 올리기는 화면 작업을 합친 뒤(작업 트리에 작업자의 중간 파일이 있다)
  - 2026-10-20(합친 뒤): `ALLOW_PROD=1 cf.mjs prod deploy` → 빌드 `20261019171722-d2ed814`(작업 트리), 버전 `11950690`, Worker `emotion-diary-prod`가 생김 → `remote-check.mjs prod --fresh --tail` 통과 → `remote-check.mjs prod --tail`(운영판) 통과 → 원격 읽기로 운영 일기·설정·세션·영수증 0행 → `prod-restore-check.mjs --fresh --reset-dev-data` 통과(운영 가짜 한 편·이름 → `backup.mjs pull prod` 1편 → 개발용에 `restore` 1편·설정 되살림 → 같음 → 운영 '모든 기록 지우기' 경로 200 → 운영 0행 → 개발용 정리). 통과 수와 기록 길이는 STATUS §1에만
  - `deployment-boundary-review`: ① 개발용·운영이 서로 다른 Worker·D1(`emotion-diary-dev`/`-prod`)·비밀값(다섯 값과 열쇠 모두 다름 — node 대조) ② 커밋될 파일(추적 + 제외되지 않은 새 파일)과 `dist/`에 계정 값·비밀값 0건(scratchpad `boundary-scan.mjs` — `work/deploy`의 비밀값·열쇠·토큰·주소 호스트와 D1 id 18개 × 733파일, 걸린 것 0) ③ 운영 묶음에 개발용 표식 0건(`cf.mjs prod deploy`의 묶음 검사 + `dist/prod`에서 `client-errors`·`dev-panel`·`vk-c`·`dev-safe-probe`·`keyboard` 0건) ④ 운영 실시간 서버 기록에 열쇠·비밀번호·이름·글 0건(`--fresh --tail`·운영판 `--tail` 둘 다)
  - 개발용: `cf.mjs dev deploy` → 빌드 `20261019171940-d2ed814`(자판 실험 포함) → `remote-check.mjs dev --tail --reset-dev-data` 통과
- [x] 4-6 겹침 결함 측정값·방식 전환(개발용 전용) — `app/client/src/dev/keyboard.ts`(새): 글 칸·입력 칸에 들어갈 때 누른 순간·0.5초·1.5초·자판 내린 뒤의 `scrollY`·문서 높이·`visualViewport` offsetTop·pageTop·height·`innerHeight`·body 최소 높이·안전 영역 위·맨 위 줄 top·`#app` scrollTop·스크롤 사건 수를 상태 칸에 남긴다(글은 읽지 않음). 배치 A 그대로 / B body 최소 높이 없음(H1 가르기) / C 문서 고정·`#app`만 스크롤 + 자판이 가린 만큼 아래 여백(H1 막고 '다음'은 밀어서 닿게)을 상태 칸 버튼으로 바꾼다(`localStorage` `ed.dev.vk`, 규칙은 `dev/panel.css`라 운영 묶음에 없음). `biome lint`·`tsc -p tsconfig.client.json` 통과. H2로 나오면 B·C로 안 풀린다 — 그때 남는 후보는 `black-translucent`(다시 설치·디자인 결정)와 `offsetTop` 보정(부작용 보고 있음)
- [x] 4-7 합치기 → 시험·E2E·결함 주입 → 새 맥락 검토자 → `verify --mode full` — 결함 주입 9종 모두 잡음(4-3), 새 맥락 검토자 지적 7건 처리(§9), `node scripts/verify.mjs --mode full` PASS(시험 수는 STATUS §1), `npm run e2e` 20/20
- [x] 4-8 개발용·운영에 올리기 → 운영판 원격 검사 → 휴대폰 안내서 — 운영·개발용 올리기와 원격 검사는 4-5, 휴대폰 안내서 [PHONE-GUIDE.md](PHONE-GUIDE.md)
- [ ] 4-9 휴대폰(사용자 — `mobile-personal`·겹침 방식 고르기·잠금 켜짐 T-03·백업 예약)
  - 2026-10-20 02:40~02:42(KST) 1부 일부 — 개발용 빌드 `20261019171940-d2ed814`, 상태 칸 캡처 10장(채팅, 저장소에 두지 않음). **배치 A에서만 자판을 띄워 쟀다**(B·C는 오늘 화면에서 버튼만 바꿈 — 자판 기록 없음). A: 누른 순간 `scrollY` 0·`innerHeight` 793·문서 793/793·맨 위 줄 16 → 0.5초·1.5초 뒤 `innerHeight` **730**(자판이 뜨자 레이아웃 높이가 63 줄어듦)·`vv.height` 417·문서 높이 **793 그대로**(body 최소 높이 793px — 100dvh가 줄지 않음)·`scrollY` **63**(= 793 − 730, 문서가 넘친 만큼 창이 끝까지 스크롤)·`vv.offsetTop`·`pageTop` 63·맨 위 줄 **−47** → 자판 내린 뒤 모두 0·793으로 돌아오고 빈 띠 없음. **판정: H1** — 자판이 뜨면 레이아웃 높이만 63 줄고 body 최소 높이는 그대로라 문서가 63 넘치고, iOS가 그만큼 창을 스크롤해 상단 줄이 상태 막대 자리(웹 화면 위쪽 밖)에 그려진다. 문서가 넘치지 않는 B·C에서는 이 자동 올림이 없을 것으로 본다(추측 — 실기기 B·C 자판 기록으로 확인할 것). '다음'은 B에서는 자판 뒤에 놓여 밀어야 닿고(밀면 상단 줄이 다시 위로 나감), C는 `#app` 안에서 밀려 상단 줄이 웹 화면 위쪽에서 잘린다(상태 막대 자리에 그려지지 않을 것 — 추측)
  - 2026-10-20 사용자 결정(D-125): "c로 그럼 그냥 하고 운영앱 하는 방법 알려줘" — **배치 C를 B·C 실기기 자판 측정 없이 채택**. 메인이 정식 코드로 옮김: `styles/base.css`(`html, body { height: 100%; overflow: hidden }`, `#app { min-height: 0; overflow-y: auto; overscroll-behavior-y: contain; padding-bottom: var(--keyboard-inset, 0px) }`, body의 100dvh 최소 높이 뺌), 새 `lib/viewport.ts`(`visualViewport` resize·scroll마다 `innerHeight − vv.height − vv.offsetTop`을 `--keyboard-inset`로 — 실측 숫자면 313px), `main.ts`에서 설치, `router.ts`가 화면을 바꿀 때 `#app`도 맨 위로. 개발용 상태 칸은 배치 버튼·`vk-*` 규칙을 걷고 측정만 남김(자판이 가린 높이 칸을 더함). 시험: 새 `viewport.test.ts` 4건, `dev-keyboard.test.ts` 4건으로 고침, E2E `layout.spec.ts`·`help.spec.ts`가 `#app`의 가로 넘침과 '문서는 위아래로 넘치지 않음'까지 본다 — `html, body` 규칙을 빼는 결함 주입을 layout E2E가 잡음('문서가 위아래로 넘친다 1224 > 640'), 원래 바이트로 되돌림. `biome check app` 0, `typecheck` 0, `verify --mode full` PASS, `npm run e2e` 20/20(수는 STATUS §1). 올림: 개발용 `20261019175556-d2ed814`, 운영 `20261019175608-d2ed814` → 운영판 `remote-check prod --tail` 통과(이때 운영에 설정 1행·세션 2행 — 사용자가 2부를 시작해 로그인·이름을 정했다. 운영판이라 건드리지 않음). **실기기 미확인**: C에서 위쪽 줄이 겹치지 않는지, 자판이 떠 있는 동안 `다음`까지 밀어서 닿는지, 자판을 내린 뒤 빈 띠가 없는지 — 사용자가 운영에서 처음 쓸 때 본다
- [ ] 4-10 고른 방식 운영 반영 → 정본 기록 → 관문 판정 → 커밋 둘 + PR
  - 고른 방식(배치 C) 운영 반영: 끝(4-9 — 운영 빌드 `20261019175608-d2ed814`).
  - 2026-10-20 사용자 지시("지금까지 작업한거 전부 커밋 + pr + 메인에 푸시까지 진행하고 다음에 해야 할 작업 인수인계 남겨놔줘")로 **휴대폰 확인 전에** 커밋·PR·`main` 반영을 먼저 했다(direct-journal 착수 준비 세션): `0773a25` first-slice 마감 기록 · `0fb1781` personal-start · 셋째 커밋 direct-journal 착수 준비와 인계. U-4의 '커밋 둘'은 이 둘이다. U-4는 '병합은 사용자'였으나 이번 지시가 `main` 반영까지 맡겼다. CURRENT_TASK·STATUS·loop-state의 first-slice 변경은 personal-start 변경과 한 hunk로 섞여 `0fb1781`에 들어갔다.
  - 남은 것: 4-9 휴대폰 → 그 결과를 EVAL §4·§6·STATUS §1에 → 관문 `personal-start` 판정 → work-graph done·archive 이동 → 그 기록의 커밋·PR(사용자 지시 때). 순서는 `tasks/CURRENT_TASK.md` '다음 세션이 할 일'.

## 5. 검사 목록 (관문 `personal-start`)

| 검사 | 무엇을 보면 통과인가 | 어디서 |
| --- | --- | --- |
| full, F-01·02·06·07·09·10·14·15·17·24 | 앞 관문들의 시험이 그대로 PASS | `verify --mode full` |
| deployment-boundary-review | ① 개발용·운영이 서로 다른 Worker·D1·비밀값 ② 커밋될 내용·묶음·설정에 계정 값·비밀값 0건 ③ 운영 묶음에 개발용 코드 0건 ④ 운영 실시간 서버 기록에 열쇠·비밀번호·글 0건 | 4-5·4-8 |
| backup-and-restore-drill | 운영 백업 1회를 개발용에 되살려 같음 | 4-5 |
| mobile-personal | 운영 앱 설치·로그인(S-01·S-02), 내보내기 공유 창(S-05), 앱 전환 화면 가림(T-03) | 4-9 |
| crisis-help-unreviewed-label | `#/help`가 열리고 '검토 전'을 표시, 112·119는 자원 없이도 | 화면 시험·E2E·4-9 |

## 6. 멈추는 경우 (셋뿐)

1. 사용자 결정이 새로 필요할 때(제품 범위·안전·개인정보) — 예: 위기 안내 문구를 명세와 다르게 써야 할 때.
2. 승인 범위 밖의 요금·되돌리기 어려운 일 — U-1의 이름·요금·범위가 바뀔 때, 실제 일기가 든 운영을 지우거나 덮을 때.
3. 두 정본이 근거로 가려지지 않게 부딪칠 때.

## 7. 지난 실수 목록(이번에 피할 것)

- 확인 안 한 것을 통과로 적음 → 명령과 결과를 같은 줄에. 사용자 보고만 있는 실기기 항목은 '사용자 보고, 캡처 없음'으로.
- 작업자 보고를 그대로 믿음 → 메인이 다시 잰다(AGENT_WORKFLOW §10).
- 같은 숫자가 문서마다 다름 → 숫자는 STATUS §1에만.
- CRLF 섞임 → 기존 파일은 Edit로, 끝에 LF·CRLF 수를 node로 센다.
- 운영 명령을 개발용 습관대로 → 운영에는 데이터를 지우는 명령(`--reset-dev-data`·`drill.mjs`·`DELETE`)을 쓰지 않는다. `--fresh`는 빈 운영에서만.
- wrangler 첫 원격 명령의 code 10000 → `wrangler whoami`로 갱신 확인 뒤 한 번만 재시도.

## 8. 진행 기록

- 2026-10-20: 사용자 답 U-1~U-4를 받고 시작.

## 9. 마감 검토 지적과 처리(2026-10-20, 새 맥락 `verifier`, Fable·high, 읽기 전용)

| # | 심각도 | 지적 | 처리 |
| --- | --- | --- | --- |
| R-1 | high | 운영판 `remote-check prod`(실제 일기용)가 '모든 기록 지우기' 경로를 확인 문구만 틀리게 해서 보낸다 — 실제 일기를 지키는 것이 서버의 문자열 비교 한 줄뿐 | 지우기 검사를 `writes`(개발용·`--fresh`) 안으로. 운영판 내보내기는 `?after=9999-12-30` 빈 조각만 받아 형식을 본다(실제 일기를 받아 오지 않음). 다시 돌려 31/31, 지우기 요청 0건 |
| R-2 | medium | `prod-restore-check`가 중간에 멈추면 운영에 가짜 '오늘' 완료 기록·이름·세션이 남는다 — 그날 실제 일기를 막는다 | 정리를 `finally`로(지우기 경로가 실패하면 빈 운영에서 시작했으므로 표째 비움), 예외는 FAIL 한 줄로. 다시 10/10, 예외를 넣어 6/7·운영 0행 확인 후 원래 바이트로 되돌림. `remote-check --fresh`가 멈췄을 때의 복구 명령을 DEPLOY §8에(실제 일기 전에만) |
| R-3 | medium | PLAN 4-5에 운영 올리기 기록이 없다 | 검토가 시작된 뒤에 적었다(4-5의 '합친 뒤' 줄) — 지금 있다 |
| R-4 | medium | STATUS §1 표·§4 6번이 '착수 전'·'결정 대기'·'DEPLOY 남김'으로 낡았다 | 고침 |
| R-5 | low | `make-secrets prod backup`·`key`가 가드 없이 바꾼다 — 백업 토큰을 바꾸면 매일 백업이 401 | `all`·`key`·`backup` 모두 이미 있으면 `--rotate` 요구. 셋 다 멈추고 운영 비밀값 파일 바이트가 그대로임을 확인 |
| R-6 | low | 운영 묶음에 `kr.json`의 `note`(문서 경로 문장)가 들어간다 | 그대로 둔다 — 비밀이 아니고 공개 저장소 문장이다 |
| R-7 | low | untracked `.playwright-cli/`·`output/playwright/`가 커밋에 쓸려갈 수 있다 | 커밋은 파일을 골라서 한다(`git add -A` 쓰지 않음) |
