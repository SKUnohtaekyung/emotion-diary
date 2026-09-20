# 현재 작업

이 파일에는 **진행 중이거나 곧 시작할 작업만** 둔다. 끝났거나 보류된 작업의 절은 [archive/](archive/README.md)로 옮긴다 — 이 파일이 한 번에 읽히는 크기여야 하고, `scripts/claude-scope-guard.mjs`가 이 파일의 `- 소유 파일:` 선언을 전부 합쳐 허용 목록으로 쓰기 때문이다(끝난 작업의 선언이 남아 있으면 그만큼 가드가 헐거워진다). `harness/loop-state.json`의 `task_id`는 아래 절 가운데 진행 중인 것의 머리글과 같아야 한다(`scripts/check-harness.mjs`가 quick에서 확인).

| 작업 | 상태 | 어디에 |
| --- | --- | --- |
| TASK-WEB-UI-01 브라우저 우선 UI 프로토타입 | verifying(2026-09-20 구현·PC 검수 완료, PR 진행 중 — 병합되면 archive로) | 이 파일 |
| TASK-WEB-UI-02 사용자 QA와 디자인 수정 | planned(2026-09-20 사용자 지시 — 새 세션에서 착수) | 이 파일 맨 아래 |
| [TASK-MOBILE](TASK-MOBILE.md) 설치형 홈 화면 웹앱 | 보류 — Phase 1 착수 시 재개(이슈 #1~#9) | 별도 파일 |
| [TASK-DS-REF](TASK-DS-REF.md) TDS 규칙 참고 | 보류(이슈 #10~#14, D-039 reserved) | 별도 파일 |
| [TASK-TAXONOMY](TASK-TAXONOMY.md) · [V1](TASK-TAXONOMY-V1.md) · [PLAN-V2](TASK-TAXONOMY-PLAN-V2.md) | 완료(2026-09-05, D-038·D-040 accepted) | 별도 파일(다른 문서가 경로로 인용해 옮기지 않았다) |
| TASK-INFRA-01 · ISSUE-26 · ISSUE-27 · CBM · DESIGN · BOOTSTRAP | 완료·보류 기록 | [archive/](archive/README.md) |

# TASK-WEB-UI-01 — 브라우저 우선 직접 작성 UI 프로토타입

## 상태와 범위

`in_progress` — 2026-09-19 사용자 지시, 2026-09-20 계획 승인. 앱 코드가 아직 없는 Phase 0 저장소에서, Cloudflare/DB/인증/AI를 앞당기지 않고 브라우저에서 직접 작성 흐름과 캐릭터 배치를 검토할 수 있는 정적 웹 프로토타입을 만든다. 데이터는 저장하거나 전송하지 않는다. 직접 작성 MVP의 화면 순서·비진단·접근성 규칙은 `UX_SPEC` §2~4, `DESIGN_SYSTEM` §6·§8~9를 따른다. 브랜치 `web-ui/prototype` + PR로 진행하며 커밋·푸시·병합은 묶음마다 사용자 승인을 받는다.

- 제외: 저장·임시저장·revision 충돌·offline 상태 연출, 다크 모드(D-034), AI 대화, 홈 화면 설치·자체 뒤로 가기(TASK-MOBILE의 미결 제안), `최근 사용` 묶음의 실제 동작(저장이 전제 — 자리만 표시), 실기기 검수(사용자 결정으로 이번에는 PC만).

## 소유권

- Main/Writer: 2026-09-20 Claude Code 세션 1명. 하위 에이전트는 읽기 전용이며 쓰지 않고 커밋하지 않는다. 사용 기록: verifier(Sonnet) 1회 — 저장·전송·경로 조작·캐릭터 자리·비진단 문구를 작성자와 다른 눈으로 판정받기 위해(T5). Opus는 쓰지 않았다.
- 소유 파일: `web/`, `scripts/web-preview.mjs`, `.claude/launch.json`, `harness/loop-state.json`, `tasks/CURRENT_TASK.md`, `tasks/archive/*`, `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/TRACEABILITY.md`, `docs/DESIGN_SYSTEM.md`, `design/characters/README.md`(뒤 두 개는 검증자 지적으로 추가 — 캐릭터 자리 서술 동기화).
- 넘겨받은 검수(이슈 #26에서 이관): iPhone Safari·Android Chrome 실기기, 실제 OS reduced-motion, 회색조·label 없음 판독. 상세는 [archive/TASK-ISSUE-26.md](archive/TASK-ISSUE-26.md)의 "후속 보류" 체크포인트. 이 환경에서 가능한 것은 Chromium의 reduced-motion 에뮬레이션과 회색조 렌더 캡처까지다. 실기기와 실제 OS 설정, 사람 눈의 판독은 사용자 기기가 있어야 한다.

## 사용자 결정(2026-09-20)

- 작성 흐름: **단계형을 먼저** 만들고, 같은 내용을 **긴 한 장으로도** 볼 수 있게 한다(UX_SPEC §4가 둘 다 허용).
- 캐릭터 자리: 별자리 지도의 점 9개는 DESIGN_SYSTEM §6.2 규격 그대로 두고, **지도 바로 아래에 고른 계열의 대표 캐릭터(40px)+이름이 고른 순서로 쌓이는 줄**을 둔다. 기록 카드의 카테고리 표시에도 대표 캐릭터를 쓴다.
- 실기기 검수는 이번에 하지 않고 미검증으로 남긴다.

## 설계 판단(근거는 D-047)

- 의존성·빌드 없는 정적 HTML/CSS/ES module. UI 프레임워크 결정(Phase 1)을 앞당기지 않는다. `package.json`을 건드리지 않는다.
- 값의 출처는 하나: `scripts/web-preview.mjs`가 `web/`과 함께 `design/tokens.json`·`design/characters/`·`data/taxonomy/v2.json`을 읽기 전용 경로로 제공하고, 시안이 실행 중에 원본을 읽는다. `web/` 안에 색 값·감정 목록의 사본을 두지 않는다.
- AI 진입점은 직접 작성과 같은 위계의 비활성 버튼("현재 제공되지 않음", UX_SPEC §5). 위기 연락처는 값 없이 "검수 후 채워짐" 자리만 둔다.

## Task와 완료 기준

| # | 내용 | 관찰 가능한 완료 기준 | 선행 |
| --- | --- | --- | --- |
| T0 | INFRA-01 절 아카이브, loop-state 교체, 브랜치 | 옮긴 본문을 되끼우면 `9131f53`의 원문과 동일 · quick PASS | — |
| T1 | 미리보기 서버, 하단 탐색 4칸, 시안 띠, tokens 실행 중 로드 | 4칸이 클릭·키보드로 전환되고 `aria-current`가 따라감 · 360px에서 `scrollWidth == clientWidth` · `web/`에 `#RRGGBB` 색 리터럴 0건 | T0 |
| T2 | 작성 흐름(단계형 → 긴 한 장 보기) | 9계열 전부 선택 시 option 194개 · 미래 날짜 선택 불가 · 필수 누락으로 완료 시 누락 필드로 초점 이동 · Tab/Enter/Space/화살표만으로 완료 도달 · `localStorage`/`sessionStorage`/`indexedDB`/cookie 쓰기 0, 같은 origin GET 외 요청 0 | T1 |
| T3 | 캐릭터 배치 | 대표 캐릭터는 지도 아래 줄·목록 머리·기록 카드에만, `ui-poses`는 시작·빈 상태·완료 장식에만 · 강도·위기 안내에 `img` 0 · reduced-motion 에뮬레이션에서 `currentSrc`가 `.png` · 모든 `img`에 alt | T2 |
| T4 | 달력·통계·설정(빈 상태 + 합성 예시) | 비활성 동작마다 보이는 "시안" 표기 · 설정에 자동 분석 없음 고지와 연락처 자리 | T1 |
| T5 | 검수 | 360px·데스크톱 조작 요소 크기 측정표(44px 미만은 목록으로 공개) · 글자 200%에서 3열 격자 · 초점 링·회색조 캡처 · 독립 검증자(Sonnet, 읽기 전용)의 통과/실패/미검증 판정 | T2~T4 |
| T6 | D-047, STATUS, 이 파일 증거, PR | quick·full PASS · PR CI 두 OS success · `package-lock.json` 무변경 | T5 |
| T7 | 사용자가 브라우저에서 직접 확인 | 사용자 승인 | T6 |

## 인수 조건

- 오늘/달력/통계/설정 하단 탐색과 직접 작성 화면을 브라우저에서 전환할 수 있다.
- 날짜·사건·상위 카테고리 다중 선택·세부 감정 선택·감정별 강도·이유·칭찬/감사 3개·검토/완료의 UI 흐름을 구현한다.
- 대표 캐릭터는 카테고리 식별 보조로, UI 정적 포즈는 온보딩/빈 상태 장식으로만 사용한다.
- 실제 저장·로그인·AI·분석·내보내기·삭제는 구현하지 않고, 프로토타입임을 분명히 표시한다.
- 360px와 데스크톱 Chromium에서 키보드·초점·44px 조작 영역·가로 넘침·reduced-motion 스타일을 확인하고 `verify`를 통과한다.

## 체크포인트

- 완료(2026-09-20, T0): TASK-INFRA-01 절 9,420B(SHA-256 앞 12자리 `ea1586bf865b`)를 스크립트로 잘라 `tasks/archive/TASK-INFRA-01.md`로 옮겼다. 검산: 옮긴 본문을 새 `CURRENT_TASK.md`의 같은 자리에 되끼우면 `git show 9131f53:tasks/CURRENT_TASK.md`와 동일(줄 끝을 LF로 맞춘 뒤 비교 — 작업 트리는 CRLF, blob은 LF). 본문에 상대 링크는 없었다.
- 완료(2026-09-20, T1~T4): `web/`(index.html, css/app.css, js/ 9개 모듈)과 `scripts/web-preview.mjs`, launch 구성 `web-prototype`(4174). `package.json` 무변경. 계획과 달라진 점 — ① 단계는 7개(날짜·사건 / 감정 계열 / 세부 감정 / 강도 / 이유 / 칭찬·감사 / 검토): 지도와 목록을 한 단계에 두면 360×740에서 목록이 화면 밖으로 밀려 나눴다. ② 세부 감정 목록은 행 194개가 전부 Tab 정지점이 되지 않게 listbox 안을 화살표로 이동하게 했다(style-guide는 행마다 Tab). ③ 강도는 "고르기 전(값 없음)" 상태를 갖는다 — 기본값을 채워 두면 사용자가 정하지 않은 강도가 기록처럼 보인다. ④ 글자 크기를 rem으로 올려 기기 글자 확대를 따르게 했다. ⑤ `최근 사용` 묶음은 목록 맨 위에 자리만 있다.
- 검수 증거(2026-09-20, T5, Chromium 브라우저 pane에서 스크립트로 측정): **360×740** — 오늘·달력·통계·설정·작성 7단계·긴 한 장 12개 화면 전부 `scrollWidth - clientWidth = 0`, 화면 밖으로 나간 요소 0. **1280×800** — 5개 경로 가로 넘침 0, 앱 폭 480 가운데 정렬. **44px**: 미만은 초성 레일 버튼뿐(9계열 전부 선택 시 13개, 32×24.6px — WCAG 2.5.8의 24px는 충족, 제품 기준 44px 미달. 같은 일을 검색·스크롤로 할 수 있다). 나머지 조작 요소는 전부 44px 이상. **목록**: 9계열 선택 시 option 194개, Tab 정지점 1개, ArrowDown×2 + Enter로 "공포, 두려운, 선택됨", 초성 검색 `ㅎㅈ` → 허전한·흡족한. **완료 검사**: 빈 상태로 완료 → 1단계로 이동·`#event`에 초점·오류 문구 표시, 긴 한 장에서는 빠진 강도 칸(`intensity-anger-harsh`)에 초점. **저장·전송**: 전 흐름 뒤 localStorage 0·sessionStorage 0·cookie 0, 다른 origin 요청 0. **캐릭터**: 강도 화면 img 0, 모든 img에 alt, 방금 고른 친구만 `fear--acknowledge-once.webp`, source의 media가 맞지 않으면 `fear.png`로 대체됨을 확인. **큰 글자**: root 200%에서 별자리가 3열 격자로 바뀌고 가로 넘침 0. **회색조**: 선택 점은 링+굵은 라벨로, 캐릭터는 실루엣으로 구분됨(캡처). **값 사본**: `web/`의 `#hex`·`rgb(`·`hsl(` 0건.
- 미검증(이 환경에서 할 수 없었음): ① native 버튼의 Enter/Space 활성화 — 브라우저 pane의 키 입력 도구가 keydown만 보내 click이 생기지 않는다(링크와 직접 처리한 listbox 키는 동작). 브라우저 기본 동작이지만 증거는 없다 → 사용자 확인(T7). ② 실제 OS의 reduced-motion 설정(에뮬레이션 도구 없음 — 대체 구조만 확인). ③ iPhone Safari·Android Chrome 실기기, 화면 키보드, safe-area, 회전. ④ 회색조·label 없음 상태의 사람 눈 판독. ⑤ 스크린리더 실제 낭독.
- 독립 검증(2026-09-20, verifier·Sonnet·읽기 전용 1회 — 작성자 결론 없이 조건 10개와 산출물만 전달): 통과 9, **실패 1(C5)**. C5 — 세부 감정 목록의 그룹 머리글에 대표 캐릭터를 그렸는데 DESIGN_SYSTEM §6.3은 "색 점 10px + 이름"이고, "고른 친구들" 줄이 §8·캐릭터 README §5에 반영돼 있지 않았다. 직접 대조해 사실임을 확인하고 고쳤다: 머리글을 색 점 10px로 되돌림(재측정 `.list img` 0, `.catdot` 10px), §8·README §5·D-047에 친구들 줄을 기록. 조건 밖 지적 1건(중간)도 수용 — 미리보기 서버가 `design/characters/` 전체(pilot·src·qa.html)를 내주던 것을 시안이 쓰는 경로(`prompts.json`, `<key>.png`, `motion/`, `ui-poses/`)로 좁혔다. 재현: `qa.html`·`pilot/`·`/package.json`·`motion/../../tokens.json` → 404/null, `fear.png` → 200, POST → 405.
- quick·full PASS(2026-09-20, 위 수정 뒤 재실행), `package-lock.json`·`package.json` 무변경.
- 다음: 사용자에게 묶음 요약을 보이고 커밋·푸시·PR 승인을 받는다(T6). PR CI 두 OS 확인 뒤 사용자가 브라우저에서 직접 확인(T7). 문서 밖 후속: `tasks/TASK-MOBILE.md`·`tasks/TASK-DS-REF.md`의 "2026-09-20 기준 다음 번호 D-047" 문구는 소유 파일 밖이라 두었다(정본은 `docs/DECISIONS.md`의 D-039 행, D-048로 갱신함).

# TASK-WEB-UI-02 — 사용자 QA와 디자인 수정

## 상태

`planned` — 2026-09-20 사용자 지시("다음 작업은 내가 QA 및 디자인 수정할 거야"). 새 세션에서 착수한다. **사용자가 눈으로 보고 판단하는 사람이고, 에이전트는 그 판단을 받아 고치고 다시 보여 주는 손이다.** 사용자는 개발 용어를 모른다 — 고칠 곳은 화면을 보며 일상어로 말하고, 에이전트가 그것을 파일·값으로 옮긴다.

## 목표

사용자가 `web/` 화면 시안을 직접 눌러 보며 찾은 어색한 점을 고치고, 그 과정에서 확정된 모양을 디자인 시스템(문서·값·전시장)에 되돌려 기록한다.

## 범위

- 포함: 사용자 QA에서 나온 시안 수정(배치·문구·크기·둥글기·색 쓰임), TASK-WEB-UI-01이 남긴 미검증 항목의 사용자 확인, 시안을 만들며 규칙 없이 임시로 정한 부품의 규칙화(아래 "임시 부품 목록"), 값 변경 시 `tokens.json`·`DESIGN_SYSTEM.md`·`style-guide.html` 동시 갱신.
- 제외: 저장·로그인·AI·분석·내보내기·삭제 구현, UI 프레임워크·부품 코드 묶음(Phase 1 결정, D-047), 다크 모드 적용(D-034), 로고(D-036), 감정 계열 색의 의미 변경(PR-010 — 사용자 승인 없이는 금지), 캐릭터 그림 재생성.
- 부품 규칙을 크게 보강하게 되면 보류 중인 [TASK-DS-REF](TASK-DS-REF.md)(D-039 reserved)를 재개할지 사용자에게 먼저 묻는다. 이 작업이 그 결정을 은근히 대신하지 않는다.

## 소유권

- Main/Writer: 착수하는 세션 1명. 하위 에이전트는 읽기 전용.
- 소유 파일: `web/`, `scripts/web-preview.mjs`, `design/tokens.json`, `design/style-guide.html`, `docs/DESIGN_SYSTEM.md`, `docs/UX_SPEC.md`, `docs/DECISIONS.md`, `docs/STATUS.md`, `harness/loop-state.json`, `tasks/CURRENT_TASK.md`, `tasks/archive/*`.

## 착수 절차

1. `main`이 TASK-WEB-UI-01 PR을 포함하는지 확인한다(`web/index.html` 존재). 새 브랜치(예: `web-ui/qa`)를 만든다.
2. TASK-WEB-UI-01 절을 `tasks/archive/TASK-WEB-UI-01.md`로 옮기고(규칙 `archive/README.md` — 본문 바이트 그대로, 옮긴 뒤 원문과 대조. 작업 트리는 CRLF·blob은 LF라 줄 끝을 맞춘 뒤 비교한다) `harness/loop-state.json`의 `task_id`를 `TASK-WEB-UI-02`로 바꾼다. 둘이 어긋나면 quick이 실패한다.
3. 미리보기 두 개를 연다: `web-prototype`(4174, 시안)과 `design-preview`(4173, 부품 전시장). 서버는 Bash가 아니라 `preview_start`로 띄운다. 사용자에게는 Viewport 메뉴의 Mobile을 안내한다.
4. 사용자에게 QA 방법을 제안하고(화면별로 같이 보기 / 사용자가 먼저 둘러보고 한꺼번에 말하기) 고른 방식으로 진행한다.

## 고치는 순환(한 건마다)

1. 사용자가 말한 것을 "어느 화면의 무엇이 어떻게 보이면 좋겠다"로 되물어 확인한다. 모양 선택지는 말이 아니라 **시안에서 바꿔 보인 화면**으로 비교하게 한다.
2. 바꾸기 전 화면을 캡처하고, 가장 작은 변경을 넣고, 같은 자리의 바꾼 뒤 화면을 보여 준다.
3. 값(색·글자·간격·둥글기)이면 `design/tokens.json`을 고친다 — 시안은 실행 중에 읽으므로 바로 반영된다. 같은 변경에서 `docs/DESIGN_SYSTEM.md`와 `design/style-guide.html`의 `:root`도 고친다(어긋나면 quick 실패). 색을 바꿨으면 `node scripts/check-contrast.mjs --verbose`.
4. 모양 규칙이면 `web/css/app.css`를 고치고, 확정되면 `DESIGN_SYSTEM.md` §6에 부품 규칙으로 적는다. 기존 결정(D-033~D-037, D-041, D-047)을 뒤집는 변경은 `DECISIONS.md`에 새 행을 먼저 남긴다(다음 번호는 그 파일의 D-039 행에서 확인).
5. 360px에서 가로 넘침 0과 조작 요소 44px를 다시 잰다. 측정 방법은 `tasks/archive/TASK-WEB-UI-01.md`의 "검수 증거".

## 어디를 고치면 무엇이 바뀌나

| 바꾸고 싶은 것 | 고칠 곳 |
| --- | --- |
| 색, 글자 크기, 간격, 모서리 둥글기(버튼 8·카드 12·시트 16·알약 999), 최소 터치 크기 | `design/tokens.json`(+ `DESIGN_SYSTEM.md`, `style-guide.html`) |
| 부품 모양(버튼, 전환 버튼, 카드, 목록 행, 슬라이더, 하단 탐색) | `web/css/app.css` |
| 오늘·달력·통계·설정 화면의 구성과 문구 | `web/js/views/tabs.js` |
| 작성 단계의 순서·제목·안내 문구, 검토·완료 화면 | `web/js/views/write.js` |
| 별자리 지도와 "고른 친구들" 줄 | `web/js/components/sky.js` |
| 세부 감정 목록·검색·초성 줄 | `web/js/components/picker.js` |
| 강도 슬라이더와 앵커 문구 | `web/js/components/slider.js` |
| 기록 카드 | `web/js/components/record-card.js` |
| 감정 단어 자체 | 시안이 아니라 `data/taxonomy/v2.json`(검수된 정본 — 이 작업 범위 밖) |

## 사용자 QA 점검표(TASK-WEB-UI-01이 확인하지 못한 것부터)

- [ ] 키보드: Tab으로 "다음"까지 간 뒤 Enter, Space로 눌린다(자동 도구로는 확인 불가였다).
- [ ] PC의 "움직임 줄이기"(Windows 설정 → 접근성 → 시각 효과 → 애니메이션 효과 끔)를 켜면 고른 친구가 움직이지 않는 그림으로 나온다.
- [ ] 회색조로 봐도(또는 이름표를 가리고 봐도) 9종 캐릭터와 고른 점이 구별된다.
- [ ] 분노·미움·공포·혐오 캐릭터가 무섭거나 조롱하는 것처럼 보이지 않는다.
- [ ] 초성 줄(오른쪽 ㄱㄴㄷ)이 작아서 누르기 어려운가 — 32×24.6px, 제품 기준 44px 미달. 없애기/넓히기/그대로 가운데 정한다.
- [ ] 단계형과 긴 한 장 가운데 실제로 쓰고 싶은 쪽, 둘 다 남길지.
- [ ] 화면별 인상: 오늘(시작) / 날짜·사건 / 감정 계열 / 세부 감정 / 강도 / 이유 / 칭찬·감사 / 검토 / 완료 / 달력 / 통계 / 설정.
- [ ] (기기가 있을 때) iPhone Safari·Android Chrome에서 같은 흐름 — 같은 와이파이로 열려면 미리보기 서버를 집 안 네트워크에 여는 변경이 필요하고, 이는 사용자 승인 뒤에만 한다.

## 임시 부품 목록(규칙 없이 시안에서 정한 것 — 규칙화 후보)

두 칸 전환 버튼(`.segmented`), 진행 막대(`.progress`), 스위치(`.switch`), 작은 표지(`.proto-tag`·`.badge`), 묶음 상자(`.panel`)와 빈 상태 상자(`.empty-box`), 글자 링크 버튼(`.link`), 입력 오류 문구(`.field-error`), 아래 고정 버튼 줄(`.step-footer`), 지우기 달린 알약(`.pill`). 버튼의 눌림·hover·처리 중 상태는 `DESIGN_SYSTEM.md` §6.1에 한 줄씩만 있고 견본이 없다.

## 인수 조건

- [ ] 사용자가 말한 수정 요청마다 "전/후 화면"과 처리 결과(반영·보류·기각과 이유)가 이 파일에 남아 있다.
- [ ] 값이나 부품 규칙이 바뀌었으면 `tokens.json`·`DESIGN_SYSTEM.md`·`style-guide.html`이 같은 변경에서 맞춰졌고 대비 검사가 통과한다.
- [ ] 360px·데스크톱에서 가로 넘침 0, 44px 미만 요소 목록이 갱신돼 있다.
- [ ] quick·full PASS, PR CI 두 OS success, `package-lock.json` 무변경.
- [ ] 사용자가 고친 화면을 브라우저에서 직접 보고 승인했다.

## 체크포인트

- 다음: 새 세션이 "착수 절차" 1번부터 시작한다.
