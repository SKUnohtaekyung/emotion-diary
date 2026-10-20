# direct-journal 착수 준비 — 사실표 (2026-10-20)

시안 이식(`direct-journal`)을 하는 동안 여러 문서·코드에 되풀이되는 값을 **한 벌로 모은 찾아보기 표**다. 값의 정본은 각 줄의 '출처'이고, 이 표는 옮겨 적은 사본이다 — 어긋나면 출처가 이긴다(D-118 '사실은 한 곳에'). 표를 고칠 일이 생기면 출처를 먼저 고치고 여기를 맞춘다. 변경 지도는 [MAP.md](MAP.md), 사용자에게 물을 것은 [QUESTIONS.md](QUESTIONS.md).

읽은 날: 2026-10-20, 브랜치 `slice/phone-check`(작업 트리에 personal-start의 커밋 전 변경이 있다 — 아래 앱 코드 값은 그 작업 트리 기준). '추정'은 이번에 실물로 확인하지 않은 것이다.

## 1. 화면과 주소

시안 주소는 `web/js/main.js` `ROUTES`와 각 화면 파일, 앱 주소는 `app/client/src/lib/routes.ts`·`main.ts`.

| 화면 | 시안 주소 | 지금 앱 주소 | 명세 |
| --- | --- | --- | --- |
| 로딩 | 주소 없음(`web/index.html` `#splash`) | 주소 없음(`#app`의 '불러오는 중…' 글자) | UX_SPEC §3, DESIGN_SYSTEM §6.17 |
| 오늘 | `#/today`(QA `?s=loading\|error\|offline\|draft\|recorded\|yesterday`, `?now=HH:MM`) | `#/today` | UX_SPEC §3·§11, DESIGN_SYSTEM §6.12 |
| 작성 흐름 | `#/write?step=<시안 열쇠>` | `#/write/<날짜>?step=<앱 열쇠>[&c=<계열>]` | UX_SPEC §4 |
| 완료 | 주소 없이 그린다(`renderDone`, 기록 칸은 `#/write?step=review&done=1`, QA `#/write?s=done&c=joy,sadness`) | `#/done/<날짜>[?day=past]` | UX_SPEC §4-9, DESIGN_SYSTEM §6.13 |
| 기록 상세(읽기 편지) | `#/record/<날짜>[?from=calendar\|stats&cat=&p=]` | `#/record/<날짜>` | UX_SPEC §7 |
| 달력 | `#/calendar[?d=<날짜>]` | 없음 | UX_SPEC §7, DESIGN_SYSTEM §6.7 |
| 통계 · 친구 상세 | `#/stats[?p=7\|30]` · `#/stats/<계열>?p=` | 없음 — `dashboard-reminder` 몫 | UX_SPEC §9 |
| 설정 목록 | `#/settings` | 없음(오늘 화면 아래 작은 버튼 줄이 대신한다 — `views/today.ts:67`) | UX_SPEC §2, DESIGN_SYSTEM §6.16 |
| 설정 하위 | `#/settings/<reminder\|day\|privacy\|export\|delete\|deleted\|profile\|name\|leave\|left\|pin\|lock>` | `settings/lock\|pin\|export\|delete\|deleted`만 | UX_SPEC §2·§13·§14·§15 |
| 위기 안내 | `#/help` | `#/help`(personal-start에서 지음, D-125) | UX_SPEC §3 |
| 온보딩 이야기 | `#/welcome[?scene=&slow=&p=2]` | **없음 — 앱의 `#/welcome`은 '반가워요'다** | UX_SPEC §3, DESIGN_SYSTEM §6.17 |
| 로그인 → 열쇠 화면 | `#/auth`(소셜 버튼) | `#/auth[?s=again\|pin]`(열쇠 칸) | UX_SPEC §14·§16 |
| 가입 → 부를 이름 | `#/auth/join` | `#/auth/name` | UX_SPEC §16 |
| 가입 완료 → 반가워요 | `#/auth/done` | `#/welcome` | UX_SPEC §16 |
| 잠금 | 층(QA `/?lock=1#/today`) | 층(`ui/lockLayer.ts`) | UX_SPEC §15 |
| 비밀번호 정하기 | `#/settings/pin[?m=change\|off\|reset]` | `#/settings/pin[?from=welcome\|forgot]` | UX_SPEC §15 |

## 2. 작성 흐름의 단계 열쇠

단계 수는 **7 + 고른 계열 수**(고르기 전 7, 셋이면 10) — UX_SPEC §4 '진행 표시와 이동', 앱 `write/flow.ts` `steps()`.

| 단계 | 시안 열쇠(`web/js/state.js`) | 앱 열쇠·서버 `resume`(`app/shared/diary.ts` `RESUME_STEPS`) | 제목(UX_SPEC §4) |
| --- | --- | --- | --- |
| 1 사건 | `date`(이름만 남음 — 날짜 칸 없음, D-082) | `event` | '오늘 있었던 일'(지난 날이면 '그날') |
| 2 마음 고르기 | `cats` | `feelings` | '오늘은 어떤 마음이 머물렀나요?' |
| 3 세부 감정(계열마다) | `detail:<계열>` | `details` + `c=<계열>` | '<계열> 중에서 어떤 마음이었나요?' |
| 4 크기 | `intensity` | `intensity` | '얼마나 컸나요?' |
| 5 이유 | `reason` | `reason` | '이유' |
| 6 칭찬 | `praise` | `praise` | '칭찬' |
| 7 감사 | `thanks` | `gratitude` | '감사' |
| 8 편지(검토) | `review` | `letter` | '이대로 남길까요?' |

막힘 안내 문구(D-098 ③)는 시안 `write.js:63~70`과 앱 `flow.ts` `BLOCKED_TEXT`가 같다: '한 줄만 적어도 충분해요.' / '가까운 마음을 하나 고르면 다음으로 갈 수 있어요.' / '가까운 말을 하나 고르면 다음으로 갈 수 있어요.' / 크기는 시트 '크기를 정하지 않은 마음이 있어요'.

## 3. 감정·친구·조약돌

| 무엇 | 값 | 출처 |
| --- | --- | --- |
| 감정 사전 | `data/taxonomy/v2.json` 판 `emotion-ko-v2`, **9계열·194개**(화면 목록은 v2만 — v1은 출처 보관) | D-038, UX_SPEC §4-3 |
| 계열 순서(선언 순서 = 화면 순서) | 즐거움 enjoyment 24 · 희망 wish 12 · 슬픔 sadness 53 · 분노 anger 23 · 기쁨 joy 32 · 사랑 love 18 · 미움 hate 21 · 공포 fear 8 · 혐오 disgust 3 | v2.json을 셈(2026-10-20) |
| 세부 감정 정렬 | 계열 화면 안에서 가나다순, 검색창 없음 | D-065 ③, UX_SPEC §4-3 |
| 친구 이름(계열 순) | 누리·바라·설이·타온·나래·품이·아린·숨이·가름 | DESIGN_SYSTEM §8.1, `web/js/data.js` `FRIENDS` |
| 친구 그림 | `design/characters/flat-friends/ui/<이름>--<계열>-{480,160}.png`(정적 PNG만, 80px 넘으면 480) | DESIGN_SYSTEM §8.1, `data.js` `friendImg` |
| 조약돌 그림 | `design/pebbles/ui/<계열>-{320,128}.png`(64px 넘으면 320). 입체 그라데이션은 이 그림만의 예외 | D-050, DESIGN_SYSTEM §8.2 |
| 가운데 돌 | `design/pebbles/ui/stone-rest-320.png`(쉬는)·`stone-lit-320.png`(켜진). 조약돌과 다른 자산 — 통계 '나의 돌'·사건 화면 '시작하는 돌'·설정 머리도 같은 그림 | D-062, DESIGN_SYSTEM §8.2·§6.15 |
| 친구가 나오지 않는 곳 | 오늘 화면 숲, 위기 안내·AI 위기 전환·오류, 지우기·내보내기, 저장 중·로딩, 알림, 앱 아이콘, 설정 | D-061 ⑤, DESIGN_SYSTEM §8.1·§6.16 |
| 한 화면의 친구 크기 | 모두 같다(원근으로 다르게 하지 않는다). 64px 밑이면 이름 글자나 계열 점을 함께 | DESIGN_SYSTEM §8.1 |

## 4. 색 토큰과 CSS 변수 이름

값의 정본은 `design/tokens.json`(MVP는 light만 — D-034). 시안은 `web/js/tokens.js`가, 앱은 `app/client/src/tokens.ts`가 실행 중에 CSS 변수로 올린다 — **변수 이름이 서로 다르다.** 시안 CSS를 옮길 때는 아래 대응표로 이름을 바꾼다.

| 묶음 | 값(light) | 시안 변수 | 앱 변수 |
| --- | --- | --- | --- |
| neutral | bg `#FFFFFF` · surface `#FAFAF8` · surface-raised `#FFFFFF` · surface-soft `#F3F2EE` · border `#E6E4DE` · border-strong `#C9C7BF` · text `#1F1F1D` · text-muted `#5F5E5A` · text-subtle `#767570` · focus `#2F6FB5` | `--bg` `--surface` `--raised` `--surface-soft` `--border` `--border-strong` `--text` `--muted` `--subtle` `--focus` | `--neutral-bg` … `--neutral-text-muted` `--neutral-text-subtle` `--neutral-focus` |
| semantic | success `#2E7D32` · warning `#9A5B00` · danger `#C62828` · info `#2F6FB5` | `--success` `--danger` … | `--semantic-<이름>` |
| service | ink `#092328` · mint `#62FDB4` · light(크림빛) `#FFF3D6` | `--service-ink\|mint\|light` | `--service-ink\|mint\|light` (같음) |
| forest(오늘 숲) | sky `#0B1228` · tree-far `#0F3A3E` · ground-far `#0C3236` · tree-mid `#0A2F33` · ground-mid `#092A2E` · path-far `#383F40` · path-near `#565D5E` · tree-near `#061A1E` · tree-edge `#071E22` | `--forest-<이름>` | `--forest-<이름>` (같음) |
| land(언덕) | hill-far `#CFE9DD` · hill-mid `#9FD3BE` · hill-near `#5FB39B` · sun `#FFF0CC` · sun-ring `#FFF6DE` | `--land-<이름>` | **없음** |
| paper(종이·봉투) | paper `#FFF8E4` · paper-rule `#EADFC2` · paper-ink `#6F5A1C` · envelope-back `#D9B665` · envelope-body `#F5DDA6` · envelope-fold `#EFCF8C` · envelope-fold-light `#F9E7BB` · envelope-flap `#EDC77C` · envelope-flap-inner `#D3AE5E` | `--paper` `--paper-rule` `--paper-ink` `--envelope-*` | **없음** |
| login(소셜 버튼) | 첫 버전에 쓰지 않는다(D-112 ④) | `--login-*` | 없음(옮기지 않는다) |
| 감정 단계 | 계열마다 50·100·300·500·700·900(값은 DESIGN_SYSTEM §3.2) | `--<계열>-<단계>` | `--emotion-<계열>-<단계>` |
| 감정 쓰임 파생 | accent = 500(기쁨만 700) · chip-fill 100 · chip-border 300 · chip-text 900 | `--<계열>-accent\|chip-fill\|chip-border\|chip-text` | **없음**(앱 `styles/write.css`가 `--cat-mark\|soft\|line`을 계열마다 손으로 정의) |

앱 `tokens.ts:5`의 `COLOR_GROUPS`는 `neutral·semantic·forest·service` 넷뿐이다. land·paper가 없으면 언덕·종이·봉투 장면을 그릴 수 없다 — 조각 0에서 더한다(MAP §5).

## 5. 글자·간격·모양·크기·상태 토큰

| 무엇 | 값 | 시안 변수 | 앱 변수 |
| --- | --- | --- | --- |
| 글꼴 | Pretendard Variable(가변 45~920 한 벌 선언, `swap`), `design/fonts/PretendardVariable.woff2` 2,057,688바이트 | `--font` | `--font-sans`(`styles/fonts.css`가 같은 파일을 묶음에 넣는다) |
| 글자 단계(크기/줄/굵기) | hero 44/52/800 · display 28/36/700 · title 22/30/700 · heading 18/26/600 · body 16/24/400 · body-strong 16/24/600 · label 14/20/500 · caption 12/16/400 | `--fs-*` `--lh-*` `--fw-*` — **rem**(`web/js/tokens.js:34`) | `--text-*-size\|line\|weight` — **px**(`tokens.ts:27`) |
| 글자 규칙 | 입력 칸 16px 이상(iOS 자동 확대 방지) · 한 줄 38자 · `keep-all` · 200% 확대에서 가로 넘침 없음 · hero는 화면당 하나·세 줄 이내·`clamp()` | — | — |
| 간격(4pt) | 4·8·12·16·20·24·32·40·48(화면 좌우 16, 섹션 사이 24) | `--sp-<n>` | `--space-<n>` |
| 둥글기 | control 8 · card 12 · sheet 16 · chip 999 · chart-bar 4 · blob `58% 42% 54% 46% / 46% 54% 42% 58%` | `--radius` `--radius-card\|sheet\|chip\|blob` | `--radius-<이름>` — **blob 없음**(숫자만 올린다) |
| 크기 | 누르는 자리 44 · 내용 최대 폭 480 · 하단 탐색 72(+ 위 흐림 24 + 안전영역) | `--touch` `--content-max` `--nav-h` | `--size-touch-target-min` `--size-content-max-width` `--size-bottom-nav-height` |
| 움직임 | fast 120 · base 200 · slow 320ms · easing `cubic-bezier(0.2,0,0,1)` · spring `cubic-bezier(0.34,1.4,0.5,1)` | `--dur-*` `--ease` `--spring` | **없음** |
| 상태(D-098) | 누름: 알약 0.97·줄 0.985 + ink 6% · 움직임 줄이기 ink 8%(ink 위 흰색 14%) / 비활성: 면 = 바탕+ink 12%, 글자 = 바탕+ink 50%(투명도 금지) / 선택: ink 면 + 흰 글자(+여럿 고르기만 민트 체크) | `--press-*` `--dis-*` | **없음** |
| 겹 순서 | base 0 · sticky 10 · bottom-nav 20 · sheet 30 · toast 40 | `--z-*` | 없음 |
| 선 | hairline 1 · emphasis 2 | `--hairline` `--emphasis` | 없음 |
| 그림자 | 없음. 예외 둘: 조약돌 그림 자체, 편지 종이 카드 `0 2px 4px` ink 12% + `0 8px 16px` ink 6% | — | — |

## 6. 움직임 시간

| 무엇 | 값 | 출처 |
| --- | --- | --- |
| 가운데 돌 | 흔들림 3800ms(±3°) · 통통 900ms · 흰빛 퍼짐 1200ms · 움직임 줄이기 흰 페이드 250ms | `tokens.json` `motion.stone`, D-077 ④ |
| 돌을 누른 뒤 | 조약돌 켜짐(가까운 것부터 최대 480ms 늦게) → 620ms 뒤 흰빛 시작 → 퍼짐 80%에서 작성 화면 → 빛 걷힘 450ms | `web/js/views/today.js:54`, `components/forest.js` `spreadLight` |
| 작성 단계 전환 | 제목·장면만 16px 옆으로: 나감 280 · 들어옴 300ms(View Transitions, 미지원은 페이드) | DESIGN_SYSTEM §3.5 '이어지는 전환', `web/css/film.css` |
| 편지 봉투 열기 | 2400ms 뒤 카드가 선다 | `web/js/components/letter.js:163` |
| 남기기 → 봉인 → 완료 | '남기는 중…' 350ms + 봉인(카드 380 → 뚜껑 270 → 인장 300 → 흰빛 330) ≈1.28s(봉투가 닫혀 있었으면 ≈0.65s) | `web/js/views/write.js:147~157·277` |
| 달력 오늘 칸 조약돌 배지 | 700ms 내려앉음 → 1.2s 뒤 300ms 흐려짐 | DESIGN_SYSTEM §3.5 |
| 달력 칸 들어옴 | 줄마다 50ms · 칸마다 12ms, 340ms(처음 한 번) · 누른 칸 까딱 420ms | DESIGN_SYSTEM §6.7 |
| 친구 숨쉬기 | 마음 고르기 5.2s·높이의 2.2% · 완료 5.4s·1.6% · 해 고리 7s·1.045배 | DESIGN_SYSTEM §6.2·§6.13 |
| 온보딩 | 장면마다 4.3~7.8s 자동, 전체 약 32s, ⑥은 '다음'을 기다림 | DESIGN_SYSTEM §6.17 |
| 로딩 화면 | 300ms 안에 준비되면 안 보임, 보이면 최소 600ms | UX_SPEC §3 |
| 잠금 틀림 | 점 줄이 한 번 흔들림 360ms | DESIGN_SYSTEM §6.18 |
| 깜빡임 상한 | 초당 3회 넘는 깜빡임 없음. 시안에서 가장 짧은 반복 주기는 1.05s(온보딩 노트의 글자 커서 `welcome.css:67`)와 1.2s(로그인 버튼 '연결하는 중' `auth.css:26`) — UX_SPEC §12의 '모두 1.5초 이상'은 2026-09-22 기준 문장이다 | UX_SPEC §12, WCAG 2.3.1 |

## 7. 장면의 치수

| 화면 | 숫자 | 출처 |
| --- | --- | --- |
| 오늘 숲 | 설계 상자 360×744(바닥에 붙고 하늘은 잘려도 됨, 최소 높이 34rem) · 조약돌 아홉: 먼 곳 22px(희망·분노) · 가운데 30px(미움·슬픔·기쁨·혐오) · 가까운 곳 40px(사랑·즐거움·공포), 자리 고정 · 가운데 돌 상자 폭의 36.7%(360 기준 132px) | DESIGN_SYSTEM §6.12, `forest.js` `SPOTS` |
| 마음 고르기 | 설계 상자 360×590, 친구 블록 폭 78(그림 높이 = 상자 폭의 19.5%), 기울기 ±7°, 이름 13px·계열 12px 밑으로 줄지 않음 | DESIGN_SYSTEM §6.2, `meadow.js` |
| 세부 감정 | 친구 200px → 스크롤하면 약 104px로 축소(sticky) · 바구니 돌 32px·보이는 돌 최대 9 · pill 높이 44 이상 | DESIGN_SYSTEM §6.3, UX_SPEC §4-3 |
| 크기 | 친구 손잡이 56px · 세부 감정 손잡이(조약돌) 34px · 스테퍼 44 · 터치는 탭이거나 가로 6px 넘게 끌 때만 값이 바뀜 | DESIGN_SYSTEM §6.4, `slider.js` `KINDS`, 앱 `ui/intensity.ts` `DRAG_THRESHOLD_PX` |
| 이유 | 친구 1~3명 96 · 4~6명 72 · 7~9명 58px, 5명부터 두 줄 | DESIGN_SYSTEM §6.5, `reason.js` `REASON_LAYOUTS` |
| 칭찬 | 조약돌 3개 이하 48 · 5개 이하 42 · 7개 이하 36 · 그 이상 30px | DESIGN_SYSTEM §6.15 |
| 완료 | 친구 1명 210 · 2명 164 · 3명 136 · 4~9명 88px · 조약돌 46→30px | DESIGN_SYSTEM §6.13, `land.js` |
| 편지 | 카드 328×(376~448)px(375×812에서 448) · 세부 감정 알약 36px(1~4개 한 열)·32px(5~8개 두 열) · 9개부터 8개씩 '이어지는 카드' · 점은 10장까지(11장부터 '3 / 18') | D-079 ③, DESIGN_SYSTEM §6.14, `letter.js` |
| 작은 편지(달력) | 높이 132~220px(150 밑이면 조약돌 뺌) | D-100 ③, DESIGN_SYSTEM §6.7 |
| 잠금 숫자판 | 누르는 자리 64px(높이 660 이하 56) · 점 18×16 조약돌 모양 | DESIGN_SYSTEM §6.18 |
| 설정 줄 | 최소 높이 56(목록 60) · 아이콘 칸 40 · 아이콘 22 | DESIGN_SYSTEM §6.16 |

## 8. 규칙 숫자

| 무엇 | 값 | 출처 |
| --- | --- | --- |
| 하루 기준 시각 | 기본 새벽 4시, 0~6시 | D-081 ②, `shared/diary.ts` `DAY_START_DEFAULT`·`DAY_START_MAX` |
| 글자 상한 | 사건·이유 각 10,000자 · 칭찬·감사 칸마다 2,000자 · 칸 3개 · 부를 이름 12자 | D-122, `shared/diary.ts`·`shared/api.ts` `NAME_MAX` |
| 크기 | 1~10 정수, 정하기 전 '–'(기본값 없음) | D-037, UX_SPEC §4-4 |
| 로그인 | 마지막으로 쓴 날부터 30일 | D-112 ①, `shared/api.ts` `LOGIN_MAX_AGE_MS` |
| 앱 잠금 | 4자리 · 5번 틀리면 30초 쉼 · 떠난 지 5분 넘으면 잠김 · 열쇠로 들어온 지 10분 안이면 지금 비밀번호 없이 새로 정하기 | D-106·D-112, `shared/api.ts` |
| 열쇠 틀림 | 60초 안에 10번 → 5분 잠김(맞는 열쇠는 늘 통과) | UX_SPEC §16, D-122 |
| 있었던 일 안내 4단계 | 첫 기록일부터 0~29 · 30~59 · 60~89 · 90일~ | D-105 ③, UX_SPEC §6.1 — **앱은 1단계 문구만 쓴다**(첫 기록일을 주는 서버 값이 없다, §9) |
| 작성 알림 | 켜짐·오후 10시 '기본'(UX_SPEC §10·§11) — 단 기본값은 `dashboard-reminder`에서 사용자와 다시 정한다(STATUS §4-8) | §12 어긋남 12 |

## 9. 서버 경로 — 있는 것과 없는 것

있는 것은 `app/worker/src/app.ts:17~39`(2026-10-20). 계약 표는 ARCHITECTURE §5.

| 화면이 쓰는 것 | 경로 | 상태 |
| --- | --- | --- |
| 오늘 상태·하루 기준 시각·지난 날 쓰던 글 | `GET /api/today` | 있음 |
| 한 날의 기록 읽기·임시저장·완료·지우기 | `GET\|PUT\|DELETE /api/diaries/:date`, `POST /api/diaries/:date/complete` | 있음(지우기는 완료한 기록도 지운다 — 확인 표시는 판 번호) |
| 하루 기준 시각 설정 | `GET\|PUT /api/settings/day-start` | 있음(화면 없음) |
| 부를 이름 바꾸기 | `GET\|PUT /api/settings/profile` | 있음(처음 정하는 화면만 있음) |
| 앱 잠금 | `PUT\|DELETE /api/app-lock`, `POST …/unlock`·`…/lock` | 있음 |
| 내보내기·모든 기록 지우기 | `GET /api/export`, `DELETE /api/diaries` | 있음 |
| **달력의 한 달(날마다 상태)** | — | **없음.** ARCHITECTURE §5 표에도 행이 없다. 새 읽기 경로가 필요하다(이름 미정) |
| **완료 취소(완료 → 임시저장)** | — | **없음.** DATA_MODEL §5 상태도에는 있다('명시적 완료 취소'), 경로·화면은 없다 |
| 첫 기록일(있었던 일 안내 4단계용) | — | 없음 — `first_completed_local_date`는 기록마다 있고 모아 주는 값이 없다 |
| 알림 설정 | `GET/PUT /api/settings/reminder` | 없음 — `dashboard-reminder`가 만든다(ARCHITECTURE §5) |
| 통계 | `GET /api/dashboard` | 없음 — `dashboard-reminder` |

## 10. 그림·글꼴 자산과 배포 규칙

| 무엇 | 값 | 출처 |
| --- | --- | --- |
| 크기 | 조약돌 `ui/*-320.png` 약 69KB · `*-128.png` 약 15KB · 아홉 계열 두 벌 + 돌 둘 합계 약 880KB / 친구 `*-480.png` 102~145KB(아홉 합 약 1.09MB) · `*-160.png` 14~21KB(아홉 합 약 155KB) / 가운데 돌 72KB·57KB / `web/splash.svg` 49,799바이트 / 글꼴 2.06MB | 2026-10-20 파일 크기를 잼 |
| 앱의 보안 정책 | `style-src 'self'`(style 속성 금지 — CSSOM `el.style.setProperty`는 됨), `img-src 'self' data:`, `font-src 'self'`, `script-src 'self'` | `app/client/public/_headers` |
| 화면 코드 규칙 | `h()`는 `style`을 받으면 예외를 던지고 `innerHTML`을 쓰지 않는다 | `app/client/src/lib/dom.ts:1~3·16` |
| 묶음 | Vite `assetsInlineLimit: 0`(그림을 data: 주소로 끼우지 않음) · `/assets/*`만 1년 캐시(이름에 내용 해시) | `vite.config.ts`, `_headers` |
| 오프라인 | service worker 없음 — 처음 여는 화면마다 그림을 받아 온다 | D-111 ① |
| 사용자 그림 | 다시 그리지 않는다 — 원본 래스터를 줄이기만 | 사용자 지시 2026-09-21(D-048 행), DESIGN_SYSTEM §6.17 |

## 11. 코드 크기

| 무엇 | 줄 수(2026-10-20 `wc -l`) |
| --- | --- |
| 시안 `web/js/**/*.js` | 4,942 |
| 시안 `web/css/*.css` | 2,252 |
| 앱 `app/client/src/{views,ui,write}/*.ts` | 4,797 |
| Preact로 바꾸는 비용(감리 추정) | 지금 약 1,400줄 · 시안을 옮긴 뒤 약 4,400줄 — REPORT §5.3은 '결정 시점은 작성 흐름을 옮기기 전'과 '작성 흐름을 먼저 옮겨 보고 넘으면 그때'를 함께 말한다(§12-18, MAP A-12) |

## 12. 문서끼리 어긋난 곳 (고치지 않았다 — 고칠 곳만)

이 작업은 `docs/*`·`harness/*`를 고치지 않는다(personal-start가 진행 중). 이식 착수 때 고칠 목록이다.

| # | 어긋남 | 어느 쪽이 맞나(근거) |
| --- | --- | --- |
| 1 | 달력이 어느 노드인가: `harness/work-graph.yaml` `direct-journal` 주석·ROADMAP Phase 3(89행)·감리 REPORT §3.3 5단계는 '달력' 포함 / 같은 파일의 `dashboard-reminder` 주석(251행)·ROADMAP Phase 4(98행)·STATUS §4-8·REPORT §3.3 6단계는 '기본 통계·달력' | 사용자 결정 필요 → QUESTIONS Q1 |
| 2 | 관문 `core-product`의 F-21이 '오늘·달력·**통계**·기록 상세'의 불러오기 상태를 요구 / 통계는 `dashboard-reminder` | 관문을 고칠 일(`harness/quality-gates.yaml`, EVAL §5 F-21) — Q1 답에 따라 |
| 3 | 이번 의뢰의 전제 '저장·서버 계약은 이미 있다'(의뢰 문장 — 저장소 밖) / 달력 한 달 목록·완료 취소 경로가 없다 | 코드(`app.ts`)와 ARCHITECTURE §5가 맞다 — §9. ROADMAP 87행도 '완료 취소·영구 삭제'와 첫 기록일 서버 값을 남은 일로 적었다 |
| 4 | DESIGN_SYSTEM §2-3·§3.3 표 ①: 세부 감정 화면 '화면 전체가 그 계열 300' / §6.3·UX_SPEC §4-3·§8: 100·50을 6:4로 섞은 연한 바탕 | D-071 쪽이 맞다(시안 `dom.js` `setTheme`도 D-071) |
| 5 | DESIGN_SYSTEM §6.2: 고른 게 없으면 빨간 오류 '마음을 하나 이상 골라 주세요.' / §5.1·UX_SPEC §4: ink 막힘 안내 | D-098 ③ 쪽(시안 `write.js:66`) |
| 6 | DESIGN_SYSTEM §6.14 '책상' 줄(창틀·화분·나비·연필) / 같은 절 머리말·UX_SPEC §4-8: 숲 속 빈터, 연필 없음 | D-085 쪽(시안 `letter.js` 주석) |
| 7 | DESIGN_SYSTEM §6.15: '날짜는 노트 위 폴더형 종이 탭 … 미래 날짜 되돌림' / UX_SPEC §4-1: 날짜 칸·탭 없음 | D-082 쪽(시안 `notes.js:52`) |
| 8 | DESIGN_SYSTEM §6.16 설정 머리 '나의 기록 공간 / 내 기록은 나만 볼 수 있어요 → 개인정보 안내' / UX_SPEC §2: '<이름>의 기록 공간 · 내 계정 → 내 계정', 첫 버전은 '카카오로 연결됨' 없음 | D-104 + D-112 ④ 쪽(시안 `settings.js:112`) |
| 9 | DESIGN_SYSTEM §6.12-2: 켜지는 돌 '그 계열 셋 모두' | 계열마다 하나(D-067) — 27개 시절 표현이 남음 |
| 10 | UX_SPEC §3 로딩 화면·DESIGN_SYSTEM §6.17 로딩 줄 '(앱 이름·로고는 D-058로 미정 …)' | D-058은 2026-09-26 HON으로 정해졌다. 로딩에 로고를 두지 않는 결정 자체는 그대로다 |
| 11 | DESIGN_SYSTEM §3.1 표에 `surface-soft`가 없다 / `tokens.json`·시안·앱은 `#F3F2EE`를 쓴다 | tokens.json(정본) |
| 12 | 작성 알림 기본값: UX_SPEC §10·§11 '켜짐(기본값)' / STATUS §4-8 '기본값은 dashboard-reminder 때 정한다' | 이 노드에서는 알림을 두지 않으므로 영향 없음 — dashboard-reminder 때 정리 |
| 13 | 오늘 기록이 있을 때: UX_SPEC §3 '그 기록의 편지를 연다(수정 중 표시)'·시안 `today.js:50`(고치는 편지) / 지금 앱 `today.ts:98` '오늘의 기록 보기' → 읽기 편지(first-slice A-8) | 사용자 결정 필요 → Q4 |
| 14 | 반가워요 주소: 시안 `#/auth/done` / 앱 `#/welcome` — 시안의 `#/welcome`은 온보딩 | MAP §6 A-3(에이전트 안) |
| 15 | STATUS §4-7 '별자리 다중 선택 조작감' | 별자리는 D-066이 없앴다 — 지금은 '언덕 위 친구 고르기 조작감' |
| 16 | DESIGN_SYSTEM §1 'D-079 ②…D-086은 화면 반영이 진행 중' | 시안 QA는 2026-10-13 마감(TASK-WEB-UI-02) |
| 17 | D-066(마음 고르기 자유 배치)이 DECISIONS에 아직 `provisional` / 2026-10-13 사용자가 시안 전체를 승인하고 QA를 닫음 | 사용자 확인 필요 → Q3 |
| 18 | Preact 판단 시점: 감리 REPORT §5.3 '결정 시점은 작성 흐름을 옮기기 전'(185행) / 같은 절 '작성 흐름을 먼저 옮겨 보고 넘으면 그때'(186행)·work-graph `direct-journal` 주석 | 둘 다 감리 문장 — MAP A-12(조각 2 뒤 미리 재고 조각 5 뒤 판정) |
| 19 | UX_SPEC §4-2 '격자로 바꾸는 폴백 … 자동 전환은 아직 없다' / 시안에 이미 있다(`meadow.js:61`, `land.js:13~25`, D-083 ③, `PRD.md` 172행) | 시안·D-083 쪽 |
| 20 | DESIGN_SYSTEM §3.5 봉인 시간 '뚜껑 250 → 인장 280ms … 약 1초' / 코드 270·300ms, 약 1.28s(`write.js:149~152`) | 코드 값으로 옮기고 문서를 맞춘다(§6) |
| 21 | DESIGN_SYSTEM §3.1 '위기 안내는 중립 배경+`danger` 테두리' / §6.10 '상자·빨간 테두리 없음'(D-094) | D-094 쪽 |
| 22 | DESIGN_SYSTEM §6.16 '모든 기록 영구 삭제' 줄 / UX_SPEC §6.1 용어표·시안 `settings.js` '모든 기록 지우기' | 용어표(D-107) |
| 23 | QA 상태 주소 목록의 `…\|ai`(DESIGN_SYSTEM §6.12, UX_SPEC §11) / 시안 코드에서 AI 줄은 이미 빠짐(2026-10-13 QA R4) | 코드 쪽 — QA 주소는 앱에 옮기지 않는다(MAP §4.7) |
