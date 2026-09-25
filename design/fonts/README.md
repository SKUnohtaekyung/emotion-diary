# 웹폰트 — Pretendard Variable

2026-09-21 사용자가 웹폰트 도입(D-057)과 다운로드를 허락해 받은 사본이다. 화면 시안(`web/`)이 실행 중에 읽는 **임시 자산**이며, Phase 1의 앱 번들에서 다시 정한다.

| 항목 | 값 |
| --- | --- |
| 파일 | `PretendardVariable.woff2` (가변 폰트, 굵기 45~920 전 구간 포함) |
| 출처 | https://github.com/orioncactus/pretendard 공식 저장소, 태그 `v1.3.9`(2023-11-05), 경로 `packages/pretendard/dist/web/variable/woff2/` |
| 크기 | 2,057,688 bytes (약 2.0MB) — GitHub API가 알려 준 크기와 같다 |
| SHA-256 | `9599f12fd42fc0bce1cd50b47a0c022e108d7aa64dd0d1bb0ed44f3282d900b4` |
| 라이선스 | SIL Open Font License 1.1 — 사본은 `PRETENDARD-LICENSE.txt`(같은 태그의 `LICENSE`). 재배포하는 모든 사본에 저작권 고지와 이 라이선스를 함께 둔다. 폰트 단독 판매는 금지 |

## 쓰는 규칙

- 정본 스택은 `design/tokens.json`의 `typography.family.sans`다. 스택이 이미 `"Pretendard Variable"`을 먼저 찾으므로 `@font-face`로 이 파일을 그 이름에 연결하기만 하면 된다.
- **한 굵기만 선언하지 않는다.** 이름이 같은 `@font-face`에 굵기 한 벌만 두면 브라우저는 다른 굵기 요청에도 그 한 벌을 쓴다 — 800만 선언하면 본문 400까지 800으로 그려진다. 반드시 `font-weight: 45 920` 범위의 가변 선언 하나로 둔다(`web/css/app.css`).
- `font-display: swap`. 폰트가 늦게 와도 글이 먼저 보이고, 도착하면 바뀐다.
- 미리보기 서버 허용 목록의 `/design/fonts/`로만 내준다(`scripts/web-preview.mjs`).

## Phase 1에서 다시 정할 것

- 이 파일은 한글 전체를 담아 약 2.0MB다. 모바일 첫 로드에는 무겁다. 공식 저장소에는 `woff2-dynamic-subset`(92조각)과 CSS(55.7KB)가 있어, 화면에 나온 글자의 조각만 받는다. 앱 번들이 정해지면 조각 방식으로 바꾸고 캐시 정책을 정한다.
- 조각 방식으로 바꿔도 위의 "가변 선언, 한 굵기만 선언하지 않는다" 규칙은 그대로다.
