> **아카이브(2026-09-21, TASK-WEB-UI-02 착수).** `tasks/CURRENT_TASK.md`에서 옮긴 기록이다. 옮기기 직전 커밋은 `55f3f91`이고 아래 본문은 옮기기 전과 바이트 그대로다(원문 10608B, SHA-256 앞 12자리 `75976470981a`) — 단 하나, 본문에 있는 상대 링크 1개(글자는 `archive/TASK-ISSUE-26.md`)의 대상 경로 깊이만 옮긴 자리에 맞게 고쳤다(`archive/TASK-ISSUE-26.md` → `TASK-ISSUE-26.md`, 링크 글자는 그대로). **상태:** 구현·PC 검수 완료(2026-09-20), 독립 검증 통과(C5 수정 뒤), quick·full PASS. PR #30(`web-ui/prototype`)은 CI 두 OS success·병합 가능이지만 **2026-09-21 기준 병합 전**이다 — 병합은 사용자 지시가 있을 때만 한다. **남은 일이 간 곳:** T7(사용자가 브라우저에서 직접 확인)과 아래 "미검증" 5항목은 `tasks/CURRENT_TASK.md`의 TASK-WEB-UI-02 "사용자 QA 점검표"로 넘어갔다. 절 끝의 "문서 밖 후속"(TASK-MOBILE·TASK-DS-REF의 낡은 "다음 번호 D-047" 표기)은 TASK-WEB-UI-02의 체크포인트에 이월했다. 이 파일의 `- 소유 파일:` 선언은 scope-guard에 더 이상 반영되지 않는다 — 훅은 `CURRENT_TASK.md`만 읽는다.

# TASK-WEB-UI-01 — 브라우저 우선 직접 작성 UI 프로토타입

## 상태와 범위

`in_progress` — 2026-09-19 사용자 지시, 2026-09-20 계획 승인. 앱 코드가 아직 없는 Phase 0 저장소에서, Cloudflare/DB/인증/AI를 앞당기지 않고 브라우저에서 직접 작성 흐름과 캐릭터 배치를 검토할 수 있는 정적 웹 프로토타입을 만든다. 데이터는 저장하거나 전송하지 않는다. 직접 작성 MVP의 화면 순서·비진단·접근성 규칙은 `UX_SPEC` §2~4, `DESIGN_SYSTEM` §6·§8~9를 따른다. 브랜치 `web-ui/prototype` + PR로 진행하며 커밋·푸시·병합은 묶음마다 사용자 승인을 받는다.

- 제외: 저장·임시저장·revision 충돌·offline 상태 연출, 다크 모드(D-034), AI 대화, 홈 화면 설치·자체 뒤로 가기(TASK-MOBILE의 미결 제안), `최근 사용` 묶음의 실제 동작(저장이 전제 — 자리만 표시), 실기기 검수(사용자 결정으로 이번에는 PC만).

## 소유권

- Main/Writer: 2026-09-20 Claude Code 세션 1명. 하위 에이전트는 읽기 전용이며 쓰지 않고 커밋하지 않는다. 사용 기록: verifier(Sonnet) 1회 — 저장·전송·경로 조작·캐릭터 자리·비진단 문구를 작성자와 다른 눈으로 판정받기 위해(T5). Opus는 쓰지 않았다.
- 소유 파일: `web/`, `scripts/web-preview.mjs`, `.claude/launch.json`, `harness/loop-state.json`, `tasks/CURRENT_TASK.md`, `tasks/archive/*`, `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/TRACEABILITY.md`, `docs/DESIGN_SYSTEM.md`, `design/characters/README.md`(뒤 두 개는 검증자 지적으로 추가 — 캐릭터 자리 서술 동기화).
- 넘겨받은 검수(이슈 #26에서 이관): iPhone Safari·Android Chrome 실기기, 실제 OS reduced-motion, 회색조·label 없음 판독. 상세는 [archive/TASK-ISSUE-26.md](TASK-ISSUE-26.md)의 "후속 보류" 체크포인트. 이 환경에서 가능한 것은 Chromium의 reduced-motion 에뮬레이션과 회색조 렌더 캡처까지다. 실기기와 실제 OS 설정, 사람 눈의 판독은 사용자 기기가 있어야 한다.

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

