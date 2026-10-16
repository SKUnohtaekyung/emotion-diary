# 2026-10-16 first-slice('오늘 한 편' 첫 조각) 요청 — 화면을 짓기 전에 정할 것

다음 짓기 작업 `first-slice`의 요청서다. 이 단계에서 정할 것과 그 근거를 모으고, 사용자가 고른 것을 그대로 적는다. 계획은 같은 폴더의 [PLAN.md](PLAN.md). 무엇을 짓는지의 정본은 `docs/STATUS.md` §4 4번과 `harness/work-graph.yaml`의 `first-slice` 노드, 관문은 `docs/EVAL_PLAN.md` §14 `first-slice`(F-03·F-04·F-05·F-08·F-24·`e2e-reload-restore`·`mobile-slice`)다.

## 받은 지시(2026-10-16)

data-foundation을 마친 세션이 이 세션에 맡긴 일이다: `first-slice` 착수 준비 — 정본과 서버 계약을 읽고, 이 단계에서 정할 것(자판 아래 버튼 배치 S-07, 기기 안 짧은 사본 RK-043, 실제 브라우저 E2E 도구, 작성 흐름 상태 설계 한 장)을 요청서에 모으고, 사용자 판단이 필요한 것만 질문 창으로 한 번에 묻고, 답을 적은 뒤 계획서를 쓰고 작업 절을 세운다. 화면 구현은 계획 승인 뒤에 한다. 커밋·푸시·PR은 사용자 지시 때만 한다.

## 사용자 결정

질문 창에서 사용자가 고른 것만 사용자 결정이다 — 아래 '진행 중에 나온 질문과 답'. 나머지는 PLAN의 결정표에 근거와 함께 에이전트가 정한 것이다.

## 1. 이 단계에서 정할 것

| # | 무엇 | 근거(파일·줄) | 누가 정하나 |
| --- | --- | --- | --- |
| R-1 | **자판 아래 버튼 배치(S-07).** 글 칸을 누르면 자판이 화면 아래 고정 버튼 줄을 덮는다(2026-10-14 iPhone iOS 26.5.2 홈 화면 앱, 앱 뼈대). 후보: 내용 바로 뒤(본문 흐름) / 아래 고정 + 쓰는 동안 숨기기 / 자판 위로 띄우기 / 고르는 화면은 아래·쓰는 화면은 본문(섞기). 감리 추천은 본문 흐름 — 자판 위로 띄우는 안은 열린 WebKit 버그 322900(자판을 닫은 뒤 약 68px 빈 띠, 우회책 없음, 보고는 iOS 27 — 26.5.2 재현 미확인)에 걸릴 수 있다 | `docs/EVAL_PLAN.md` §4 S-07(60줄)·67줄, `docs/UX_SPEC.md` §17 규칙 9(412줄 — '정하기 전에는 아래 고정 버튼 줄에 기대는 새 화면을 만들지 않는다'), `docs/RISK_REGISTER.md` RK-042, 감리 `tasks/review/2026-10-14/REPORT.md` 107·238줄 | 사용자 |
| R-2 | **기기 안 짧은 사본(RK-043).** 쓰던 글을 지키는 기본은 서버 임시저장이다(D-111). 저장이 실패하면 지금 설계는 그 탭이 열린 동안만 `sessionStorage`에 둔다 — 그래서 연결이 끊긴 채 앱을 완전히 닫으면 마지막 서버 저장 뒤의 입력을 잃는다(홈 화면 앱에서 `sessionStorage`가 새로 열림 뒤에 남는지도 확인하지 않았다). 서버로 못 보낸 글을 기기에 잠깐 남기면 그 틈이 닫히지만 '일기 원문을 기기에 오래 두지 않는다'와 맞바꾼다 | `docs/DATA_MODEL.md` §6(265·266·267줄), `docs/ARCHITECTURE.md` §7(246·247줄), RK-043, 감리 N-6(239줄)·329줄('사용자와 함께 정할 일') | 사용자 |
| R-3 | **실제 브라우저 E2E 도구.** `release.browser-e2e`가 비어 있고(command null) 첫 쓰임이 `e2e-reload-restore`다. 후보 Playwright WebKit | `harness/quality-gates.yaml` release.browser-e2e, `docs/EVAL_PLAN.md` §14 `e2e-reload-restore`(372줄) | 에이전트(아래 §2 사실 — 개발 도구라 쓰는 사람의 경험을 바꾸지 않는다) |
| R-4 | **작성 흐름 상태 설계 한 장.** 단계·저장 상태·복구·충돌·잠김·로그인 풀림이 한 화면 코드 안에서 얽힌다(감리 R-FE 3). 화면은 도구 없는 TypeScript라(D-114) 상태를 손으로 관리한다 | `harness/work-graph.yaml` first-slice `owns`, 감리 120줄 | 에이전트(PLAN의 상태 설계 절) |
| R-5 | **첫 조각의 범위 가장자리.** 노드가 정한 것은 사건 → 마음·세부 감정·크기 → 이유 → 칭찬·감사 → 완료와 '다시 열기'까지다. 완료한 기록 고치기(UX_SPEC §7)와 쓰던 글 지우기(UX_SPEC §4 `⋯` 메뉴)는 노드에 적혀 있지 않다. 이 조각의 화면으로 `personal-start`부터 실제로 쓰고, 시안 이식(`direct-journal`)은 그 뒤다 | `harness/work-graph.yaml` first-slice `outputs`('written, completed and reopened'), `docs/UX_SPEC.md` §4·§7, 서버는 둘 다 이미 받는다(`app/worker/src/routes/diaries.ts` 302·460줄) | 사용자 |
| R-6 | **지난 날 쓰던 글 이어 쓰기.** 하루 기준 시각(기본 새벽 4시)을 넘기면 쓰던 글은 '지난 날 글'이 되고, 오늘 화면의 '어제 쓰던 글이 있어요 ›' 없이는 그 글로 돌아갈 길이 없다. 서버는 이미 돌려준다(`TodayInfo.pastDraft`) | `docs/UX_SPEC.md` §3·§6, `app/shared/diary.ts` 414~415줄 | 에이전트 — 넣는다(빠지면 자기 글에 닿지 못한다 — SERVICE_WHY §20-7) |
| R-7 | **시작 위치.** 지시는 'PR #39가 main에 병합된 뒤 main에서 새 브랜치'다. 2026-10-16 처음 확인 때 PR #39는 열린 채(CI 두 OS 통과)였다 → 사용자가 GitHub에서 병합(U-4, `main` `47ddd90`, 2026-10-16 05:01 UTC) → 그 위에 브랜치 `slice/first-slice`를 만들었다 | `gh pr view 39`(처음 state OPEN → 뒤에 MERGED, mergeCommit `47ddd90`), `gh pr checks 39`(verify ubuntu·windows pass) | 사용자 |

## 2. 사실(2026-10-16 확인 — 파일·줄 또는 명령)

서버 계약(data-foundation, D-122 — 화면은 이것만 부르면 된다):

- `GET /api/today` → 서버가 센 오늘(`date`), 오늘 기록의 요약(`entry` — 상태·판 번호·고른 계열·쓰던 단계, 글 없음), 가장 최근의 지난 임시저장(`pastDraft`). `x-timezone` 필수(`app/shared/diary.ts` 397~416줄, `app/worker/src/routes/diaries.ts` 184줄).
- `GET /api/diaries/:date` → 그날 기록 전체(`DiaryEntryView`), 없으면 404(`diary.ts` 363줄).
- `PUT /api/diaries/:date` → 통째 임시저장. 판 번호(`revision` — 새로 만들 때는 없음), `idempotency-key`, `x-timezone`. 새로 만들기 201·고치기 200, 응답은 글 없는 `DiaryMeta`. 오래된 판 번호는 409 `revision_conflict`(+`currentRevision`), 오늘이 아닌 날 새로 만들기 422 `not_today`, 완료된 기록은 완료 조건을 다시 검사해 422 `incomplete`(+`missing`)(`diaries.ts` 302~374줄).
- `POST /api/diaries/:date/complete` 본문 `{revision}` → 모자라면 422 `incomplete`와 빠진 단계 목록(흐름 순서)(`diaries.ts` 385줄).
- `DELETE /api/diaries/:date` 본문 `{revision}` — 본 그 판만 지운다(`diaries.ts` 460줄).
- 쓰던 단계: `event`·`feelings`·`details`(+계열)·`intensity`·`reason`·`praise`·`gratitude`·`letter`(`diary.ts` 32줄). 크기는 임시저장에서 '아직 안 정함'(null) 허용, 따로 정하지 않은 세부 감정은 대표 크기를 따른다(`diary.ts` 152~162·281줄).

지금 화면 뼈대:

- `#/today`는 자리표시다 — 연습 칸(메모리에만)과 화면 아래 고정 버튼 줄(S-07 확인용)(`app/client/src/views/today.ts` 1~3·81줄). 작성 화면 주소는 아직 없다(`app/client/src/lib/routes.ts` 4줄).
- 기기 저장소에는 화면 이름·시각·표식만 두고 일기 내용은 두지 않는다고 코드가 못 박았다(`app/client/src/lib/storage.ts` 1~2줄).
- 로컬 실행(`npm run dev`)은 `http://localhost`라 `__Host-` cookie가 Chrome·Edge에서만 된다고 적혀 있다(`app/scripts/dev.mjs` 3줄) — **WebKit E2E가 로컬에서 로그인 cookie를 받는지는 확인하지 않았다.**

E2E 도구(Playwright 공식 문서 — context7 `/microsoft/playwright`, 2026-10-16):

- npm 최신판 1.64.1(2026-10-16 `npx --no-install playwright` 오류 문구). 설치돼 있지 않다.
- 요구: Node 22.x/24.x/26.x, Windows 11+ — 이 PC(Windows 11, Node 22)와 CI(Ubuntu·Windows)에 맞는다. Chromium·WebKit·Firefox 모두 Windows·Linux에서 돈다(WebKit 27.2 빌드).
- Playwright의 WebKit은 WebKit 본가 소스로 만든 빌드이고 Apple Safari 브랜드판이 아니다. 기능은 OS마다 다를 수 있다.
- 연결 끊김 흉내(`context.setOffline`)는 화면 이동·`fetch`·XHR·WebSocket에 걸린다 — 일기 저장 요청은 `fetch`라 해당된다.
- **E2E가 대신하지 못하는 것**(문서에 없고 원리상 없는 것): 홈 화면 앱 모드(`display-mode: standalone`), iPhone 자판, 앱 전환 화면, 앱을 완전히 닫았다 열기. 그래서 이것들은 휴대폰 확인 `mobile-slice`(S-02·S-06·S-07·T-03, 약 10분)에 남는다.

## 3. 이미 정해진 것(다시 묻지 않는다)

- 화면은 도구 없는 TypeScript(D-114), 해시 주소 `#/…`(D-115 ③), 연출 없는 평면 화면(D-116), 쓰던 단계는 서버에(D-122), 새 기록은 그날만(D-082), 칭찬·감사는 비워도 완료(F-04), 크기는 1~10 + 항상 보이는 숫자 + −/+(D-037), 말투는 해요체·UX 라이팅 원칙과 용어표(D-105·D-107), 작성 흐름 안에 바깥 링크 없음(UX_SPEC §17 규칙 6).

## 이번에 정하지 않은 것

- 시안의 연출(친구·조약돌·바구니·편지 봉투·장면) — `direct-journal`에서 옮긴다.
- 달력·통계·알림 — 뒤 단계.
- 완료 취소, 완료한 기록의 영구 삭제 — `direct-journal`(UX_SPEC §7). 모든 기록 지우기·내보내기 — `data-control`.
- 운영 건물 — `personal-start`(만들기 직전 사용자 확인).

## 진행 중에 나온 질문과 답

(질문 창의 답을 받는 즉시 이 아래에 적는다.)

2026-10-16 이 세션(first-slice 착수 준비). R-1·R-2·R-5·R-7 넷을 질문 창 하나로 물었다. 질문은 개발 용어 없이 화면 예시(글자 그림)와 비유로 썼고, 추천을 첫 보기로 두었다. R-3·R-4·R-6은 PLAN의 결정표에 근거와 함께 에이전트가 정했다.

| # | 질문(질문 창 그대로 요약) | 사용자가 고른 것 |
| --- | --- | --- |
| U-1 (R-1) | 글 칸을 누르면 자판이 화면 아래 '다음' 버튼을 덮는다. 작성 화면의 '이전·다음' 버튼을 어디에 둘까? 보기: 내용 바로 뒤(추천 — 글 칸·목록이 끝나는 바로 아래, 자판이 떠도 화면을 밀어 올리면 닿는다, 감정이 많은 화면은 목록 끝까지 내려야 보인다) / 바닥에, 쓰는 동안 숨김 / 자판 바로 위에 띄우기(WebKit 버그 322900 — 자판을 내린 뒤 약 68px 빈 띠) / 섞기: 고르는 화면만 바닥 | **내용 바로 뒤 (추천)** |
| U-2 (R-2) | 연결이 끊긴 채 쓰다가 앱을 완전히 닫으면 마지막 서버 저장 뒤에 쓴 글이 사라질 수 있다. 서버로 못 보낸 글을 휴대폰 안에 잠깐 적어 둘까? 보기: 못 보낸 글만 잠깐(추천 — 보내지는 순간 지우고, 앱을 닫았다 열어도 이어서 보내며, 로그아웃·모든 기록 지우기 때도 지운다. 대가: 연결이 끊긴 동안 휴대폰 안에도 잠깐 남는다, 앱 잠금이 걸려 있으면 화면에 보이지 않는다) / 앱이 열린 동안만(지금 설계) | **못 보낸 글만 잠깐 (추천)** |
| U-3 (R-5) | 첫 조각의 평면 화면으로 본인 사용 시작부터 시안 이식 전까지 실제로 쓴다. 노드에 없던 ① 완료한 기록 고치기(같은 단계를 지나 '저장하기', 고치는 중에는 저절로 저장하지 않고 고친 채 나가면 한 번 묻는다) ② 쓰던 글 지우기('이 글 지우기' → '이 글을 지울까요?' → '정말 지울까요?')를 넣을까? 보기: 둘 다 넣기(추천) / 고치기만 / 지우기만 / 둘 다 나중에 | **둘 다 넣기 (추천)** |
| U-4 (R-7) | PR #39가 아직 병합 전이다. 보기: 지금 GitHub에서 병합할게요(추천 — 병합된 main에서 새 갈래, 확인할 때까지 저장소에 쓰지 않는다) / PR #39 위에서 바로 시작 | **지금 GitHub에서 병합할게요 (추천)** |
