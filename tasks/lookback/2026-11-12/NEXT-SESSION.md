# 다음 세션이 읽을 것 (TASK-LOOKBACK-01 단계 A 시안, 6판까지 끝난 상태)

2026-11-12, 앞 세션이 맥락이 차서 넘긴다. 이 문서부터 읽고, 그다음 `ROUND6.md`를 읽는다.

## 지금 상태
- 자리: 워크트리 `C:\Users\miso\Desktop\Project\emotion-diary\.claude\worktrees\lookback-sian`, 브랜치 `design/lookback-sian`. 마지막 커밋은 6판(`5f17c10`) 뒤의 이 문서 커밋이다. 푸시·PR은 하지 않았다.
- 사용자는 6판 검토 페이지(`web/review-lookback.html`)를 보는 중이고 아직 답하지 않았다. 다음 일은 **사용자의 6판 피드백을 받아 고치는 것**이다. 승인되면 조립본 정리(S7)와 넘김 문서 `HANDOFF-SIAN.md`(S8, `SIAN.md` 9번)를 만든다.

## 읽는 순서
1. 이 문서 → `ROUND6.md`(6판의 구조·문구 기준·확인한 것) → 필요하면 `ROUND2~5.md`(판마다 사용자가 한 말과 정한 것).
2. `CONCEPT.md`(무엇을 왜), `SIAN.md`(단계 계획·품질 규칙), `PROGRESS.md` 맨 위의 시작 문구(사용자가 허락한 것과 지킬 것).
3. `docs/BRAND_STORY.md` — **반드시 읽는다.** 앞 세션은 1·2판 내내 읽지 않아 브랜드 규칙을 여럿 어겼다(은유는 숲·빛·친구·조약돌 넷, 어두운 장면은 오늘 화면 하나, 큰 친구와 큰 글자, 소품 세 곳 안팎).
4. 코드: `web/js/views/lookback.js`(내 기준·기준 쓰기·실천해 보기·다른 화면에 붙는 조각), `web/js/views/lookback-read.js`(다시 읽기·목록), `web/js/lookback/store.js`(상태·QA 주소·예시 로직), `web/css/lookback.css`.

## 지킬 것(사용자 시작 문구에서)
- 고치는 곳은 `web/**`와 `tasks/lookback/**`뿐이다. `app/`, `harness/`, `docs/`, `tasks/CURRENT_TASK.md`, 워크트리 밖 주 폴더는 고치지 않는다(주 폴더에서는 다른 세션이 일기 쓰기 작업 중).
- 디자인과 시안 코드는 주 모델이 직접 만든다. 화면을 하위 에이전트에게 맡기지 않는다.
- 새 캐릭터·새 조약돌 그림은 만들지 않는다. 언덕·숲·편지처럼 코드로 그린 장면은 변형해도 된다.
- 커밋은 `design/lookback-sian`에만, 한국어로 "왜"를 적고 마지막 줄은 실제 모델의 `Co-Authored-By`. 푸시·PR 금지.
- 사용자는 3판 때 "질문하지 말고 너에게 결정 권한 위임"이라고 했다. 정한 것은 판마다 `ROUNDn.md`에 적어 왔다. 기존 결정을 바꾸는 것(아래)은 계속 밝힌다.

## 6판의 화면(주소는 `#/` 뒤)
- `lookback` 내 기준(다섯째 탭의 첫 화면) · `lookback/read?p=7|30|x(&d=날짜)(&long=1)` 다시 읽기 · `lookback/list(?w=말)` 지난 30일 목록 · `lookback/write(?id=)` 기준 쓰기 · `lookback/try(?step=2)` 실천해 보기.
- 다른 화면에 붙인 것: 완료 화면의 한 줄(`write.js` → `tellLine`), 오늘 화면의 팻말과 시트(`today.js` → `todayMark`), 달력의 장면 카드(`tabs.js` → `calendarEntry`), 하단 탐색 다섯 탭(`index.html`, `main.js`).
- 상태 바꾸기: `?lbs=empty|few|one|two|normal|some|many`, `?lbx=none|active|ended`, `?lbt=thanks|joy|big|none`, `?kb=1`.

## 사용자가 정한 것과 아직 확인받지 못한 것
- 정한 것: 다시 읽기는 날짜순, 적는 것은 다 읽은 뒤, 내 기준은 쪽지(끌어서 순서 옮기기), 실천 정하기는 큰 글자 문장, 전하기 한 줄은 가끔만, 오늘 화면은 팻말.
- 에이전트가 정하고 확인받지 못한 것: 탭 이름 '내 기준'과 다섯 탭(D-049를 바꿈), 달력의 장면 카드(5판에서 사용자가 알약을 "부가 기능처럼 보인다"고 해 걷었다가 6판에서 카드로 다시 둠), 이름 '기준 쓰기'·'실천해 보기', 읽는 화면에서 세부 감정 알약을 뺀 것, 해 본 날 남기기(CONCEPT의 "매일 체크하지 않는다"를 좁혀 읽음), 끝나는 날 알림, 완료 화면의 물음(D-078), 숲의 팻말(D-062, 브랜드의 네 은유 밖).
- 근거 원문 대조 전: Gable 2004, Rimé, Gollwitzer. '여러 날에 나온 말'의 낱말 셈은 거친 예시(형태소 분석 필요).

## 일하는 법에서 걸렸던 것
- **미리보기**: 앱의 미리보기 도구(`web-prototype`)는 주 폴더를 내준다. 워크트리에서 `node scripts/web-preview.mjs 4175`를 배경으로 띄우고 `http://localhost:4175/review-lookback.html`을 본다. 세션이 끝나면 서버가 꺼지므로 새 세션에서 다시 띄운다.
- **캡처**: `node tasks/lookback/2026-11-12/capture.mjs <이름 일부> --port=4175 [--w=320] [--scale=2]`. 헤드리스 Chrome을 움직임 줄이기 상태로 부린다. 줄 끝에 `콘솔 오류`가 찍히면 그 화면이 깨진 것이다. 결과는 `outputs/lookback-sian/`(커밋 안 됨). 목록은 그 파일의 `SHOTS`.
- **검사**: `node scripts/verify.mjs --mode quick`(시안 CSS의 색 값 글자·투명도 흐림을 잡는다). 이 검사는 자바스크립트 문법 오류를 못 잡는다 — 고친 뒤 반드시 캡처로 콘솔 오류 0건을 본다.
- 스크립트로 파일을 고친 뒤 쓰기 도구로 같은 파일을 통째로 쓰려면 먼저 그 파일을 한 줄이라도 읽어야 한다(안 그러면 거절된다).
- 줄 끝 주석을 한 줄짜리 코드 가운데에 넣으면 닫는 괄호를 삼킨다(2판에서 겪음).
- 눈으로 보지 못한 6판 화면: 목록, 말로 찾기, 시트들, 기간이 끝난 화면, 스무 장 쪽지, 너비 320·430. 다음 수정 때 함께 본다.
