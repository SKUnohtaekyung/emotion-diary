# 기존 시안의 문법 (S1, 2026-11-12)

새 화면은 아래 것만으로 짓는다. 새 CSS는 `web/css/lookback.css`(접두어 `lb-`)에만 쓴다.

## 값
- 색·글자·간격은 전부 `design/tokens.json` → `js/tokens.js`가 올린 CSS 변수. 색 값 글자를 쓰지 않는다(quick 검사가 잡는다).
- 바탕: `--bg`(흰색), 옅은 면 `--surface-soft`, 글자 `--text`·`--muted`·`--subtle`, 서비스 색 `--service-ink`·`--service-mint`·`--service-light`(크림 종이).
- 장면 색: 언덕 `--land-hill-far|mid|near`, 숲 `--forest-*`, 종이 `--paper-ink`·`--paper-rule`. 감정 색은 `--<계열>-accent`, 칩은 `--<계열>-chip-fill|border|text`.
- 글자 단계: caption < label < body < heading < title < display < hero. 화면 제목은 `h1`(display·800), 절 머리는 `.sx-eyebrow`(작은 muted 굵은 글자) + `.sx-headline`(1.5rem·800).
- 간격 `--sp-1…10`, 화면 좌우 여백 `--sp-5`(`.screen`). 모서리 `--radius-chip`(알약), `--radius-card`, `--radius-sheet`, `--radius-blob`(조약돌 면).
- 흐리게 할 때 투명도를 쓰지 않고 `color-mix`로 바탕에서 만든다(D-098).

## 부품과 클래스
- 틀: `.screen`, 뒤로 가기 `.info-top > .back`, 바닥 버튼 줄 `.sd-actions`(sticky), 작성 흐름 `.step-footer`.
- 버튼: `.btn.primary`(ink 알약 하나) · `.btn.secondary`(옅은 회색) · `.btn.text` · `.btn.danger` · `.btn.big`(56px). 글자 줄 버튼 `.link`.
- 고르기: `.segmented`(둘 중 하나) · `.st-pills > .st-pill`(여럿 중 하나, radiogroup) · `.choice`(여럿 고르기, ✓ 원 + ink 면).
- 목록 줄: `.st-rows > .st-row`(조약돌 면 아이콘 `.st-ic-frame` + `.st-row-name` + `.st-row-trail` 값·›), 묶음 머리 `.st-group-head`.
- 시트: `openSheet({title, body, primary, secondary, danger})`, 메뉴 줄 `.menu-row`(+`.danger`), 닫는 말은 '그만두기'(정보 시트만 '닫기').
- 그날의 쪽지: `.sxd-peek`(크림 종이·민트 테이프·봉인 조약돌·줄 노트·감정 칩 `.sxd-chip`·'편지 열기 ›'). 통계 친구 상세가 쓴다.
- 작은 알약 링크: `.st-pill-link > .st-pill-link-face`, `.sx-view-pill`, `.cal-pv-pill`.
- 빈 상태: `.sx-empty`(가운데 그림 + `.sx-headline` + `.caption`). 탓하지 않는 중립 사실로 쓴다.
- 입력: 한 줄 `.au-input`(옅은 회색 면, 테두리 없음) + `.au-count`, 긴 글 `.ruled`(줄 노트). 막힌 이유는 버튼 위 `.blocked-hint`.
- 안내: `.proto-note`·`.proto-tag`(시안 표시), `.banner`, `toast()`, `announce()`.

## 장면
- 오늘: 어두운 숲(`forest.js`, 360×744 상자 `.scene-box` 안에 % 좌표). 가운데 돌, 흩어진 조약돌, 날짜 줄 오른쪽 유리 알약 `.today-past`.
- 완료: 흰 하늘·색 언덕·흰 길(`land.js`), 그날의 친구와 조약돌, 아래 두 버튼 `.done-bar`.
- 통계 친구 상세 머리: 언덕 둘 + 흰 길 + 친구(`.sxd-scene`, 아래 끝이 흰 바탕에 녹는다).
- 설정·계정: 나의 돌(`stoneImg("rest")`)이 '나'다.
- 친구·조약돌은 PNG(있는 것만 쓴다). 언덕·길·숲·편지는 코드로 그린다.

## 움직임
- `--dur-fast|base|slow`, `--ease`, `--spring`. 화면에 들어올 때 `.tb-rise`(아래에서 차례로). 누름은 알약 97%·줄 98.5%.
- `reducedMotion()`과 `@media (prefers-reduced-motion:reduce)`를 따른다.

## 말
- 해요체. 묻고, 고를 수 있음을 말하고, 평가·격려·위로·약속을 하지 않는다(UX-WRITING 원칙 1~8).
- 저장된 것은 '기록', 읽는 모습은 '편지', 쓰는 중은 '글'. 동사는 '지우기'·'고치기'·'남기기'. 감정 묶음은 '마음'('계열'은 쓰지 않는다).
- 수는 기간의 사실로만 적는다. 누적·레벨·연속·화살표·빨강과 초록을 쓰지 않는다(D-050, D-064, D-086).

## 새 기능이 붙을 자리
- 완료 화면: `write.js renderDone` — 제목 아래(`.done-head`)와 하늘 자리.
- 오늘 화면: `today.js` — 날짜 줄(`.today-row`), 숲 상자(`forest.box`).
- 달력: `tabs.js paintPanel` — 날짜를 고르지 않았을 때의 빈 자리(`.cal-pv-empty`).
- 통계: `stats.js renderStatsList` 맨 아래, `renderFriendDetail`의 '고른 말' 아래.
- 편지 읽기: `tabs.js renderRecord`의 뒤로 가기(`from=`).

## 계획과 다른 점
- 지어낸 기록은 이미 60일치다(`stats-calc.js buildSample`). 날 수를 늘릴 필요가 없어, 다시 읽을 때 같은 문장만 되풀이되지 않게 `sample.js`의 문장 수를 늘렸다.
- 화면 이름으로 '돌아보기'는 지금 시안 어디에도 쓰이지 않는다(문서에서만 달력·통계를 묶어 부른다).
