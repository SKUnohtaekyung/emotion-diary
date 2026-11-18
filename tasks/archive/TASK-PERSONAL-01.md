# TASK-PERSONAL-01 — personal-start(본인 사용 시작): 운영 건물에서 본인이 실제 일기를 쓰기 시작한다

## 상태

`superseded`(2026-11-11 — **대체됨, D-126**: 사용자가 본인 사용을 하지 않고 다른 사람이 가입해 쓰는 웹앱 공개를 목표로 하기로 했다. 아래 '다음 세션이 할 일' 1·2·3·4는 하지 않는다 — 남은 휴대폰 확인·백업 예약·관문 판정은 없고, 지은 것(운영 건물·`#/help`·자판 배치 C·첫 백업 복원)은 그대로 남아 공개 준비가 이어 쓴다. 5의 운영 데이터 규칙은 그대로다. 새 계획은 [../replan/2026-11-11/PLAN.md](../replan/2026-11-11/PLAN.md). 처음: 2026-10-20 — 사용자 답 U-1~U-4: 운영 건물 지금 승인, 겹침 결함 포함, 계획 승인 없이 진행, 끝에 커밋 둘 + PR). **진행·증거는 [PLAN.md](../personal-start/2026-10-20/PLAN.md) 한 곳이다**(D-118). 요청과 답은 [REQUESTS.md](../personal-start/2026-10-20/REQUESTS.md).

## 목표

`harness/work-graph.yaml`의 `personal-start` 노드와 `docs/STATUS.md` §4 6번 — 관문 `personal-start`(`harness/quality-gates.yaml`)를 통과해 본인이 운영 건물에서 매일 실제 일기를 쓴다.

## 넘겨받은 것

- `first-slice` 휴대폰 확인에서 찾은 결함: 자판이 뜬 동안 작성 흐름의 상단 줄이 상태 막대와 겹친다(`tasks/first-slice/2026-10-16/PLAN.md` 5-12) — 이 작업에 넣었다(U-2).
- `data-control`에서 넘긴 것: PC 작업 스케줄러 등록·운영 백업 토큰(`tasks/archive/TASK-DATA-02.md`, U-3).

## 소유권

- Main/Writer: 이 작업을 실행하는 세션 하나. 하위 에이전트는 커밋하지 않는다. `#/help` 화면은 Sonnet 작업자 하나가 짓고(2026-10-20 끝 — 같은 시간에 쓰는 작업자는 이제 없다) 메인이 다시 재서 합쳤다.
- 소유 파일: `tasks/personal-start/**`, `tasks/CURRENT_TASK.md`, `tasks/archive/**`, `tasks/first-slice/**`, `app/scripts/**`, `app/client/index.html`, `app/client/src/styles/**`, `app/client/src/dev/**`, `app/client/src/views/**`, `app/client/src/lib/routes.ts`, `app/client/src/main.ts`, `app/test/client/**`, `app/test/e2e/**`, `docs/**`, `harness/**`, `wrangler.jsonc`, `.gitignore`

## 체크포인트

- 2026-10-20 짓기·올리기: PLAN 4-1~4-8 끝(운영 환경 `emotion-diary-prod`, `#/help`, 자판 겹침 배치 C — 운영 빌드 `20261019175608-d2ed814`에 이미 들어감). 사용자가 운영에서 로그인·부를 이름까지 했다.
- 2026-10-20 커밋·`main` 반영(사용자 지시 — "지금까지 작업한거 전부 커밋 + pr + 메인에 푸시"): 커밋 셋 — first-slice 마감 기록 / personal-start / direct-journal 착수 준비와 이 인계. **휴대폰 확인과 관문 판정 전**에 반영한 것이라 personal-start는 여전히 `in_progress`다. PR 번호와 병합 결과는 PLAN 4-10.
- 2026-10-20 휴대폰 2부(PLAN 4-9): 위기 안내 '검토 전'·S-05 내보내기 PASS. 배치 C에서도 자판이 뜨면 위쪽 줄이 상태 막대 자리로 밀려(실패) — 보이는 영역이 밀린 만큼 위를 비우는 고침을 개발용에서 실기기로 확인하고 운영에 올렸다(빌드 `20261020080719`, 운영판 검사 31/31). T-03 앱 전환 화면은 FAIL — 신호(blur·hidden)는 오지만 iOS가 카드 사진을 먼저 찍어 웹으로는 막을 수 없다(RK-039 일어남). 이 고침과 기록은 커밋해 `main`에 반영했다.

## 다음 세션이 할 일

1. **사용자 휴대폰 확인의 남은 것**(PLAN 4-9) — 운영 앱(빌드 `20261020080719` 이후)에서 자판을 띄워 위쪽 줄이 제자리인지·`다음`까지 밀어서 닿는지(개발용에서는 확인됨), S-02(완전히 닫았다 열기), **T-03 FAIL을 받아들일지 사용자 결정**(RISK RK-039 — 받아들이면 관문은 한계를 적고 진행), 백업 예약 명령(`node app/scripts/backup.mjs schedule-command prod`가 출력한 것을 사용자가 실행). 결과를 사용자에게 받는다 — 에이전트는 iPhone을 조작할 수 없다.
2. **정본 기록 → 관문 판정**(PLAN 4-10): 결과를 EVAL §4·§6 표에, 숫자는 STATUS §1에, 관문 `personal-start` 판정 → work-graph `personal-start` done → 이 절을 `tasks/archive/TASK-PERSONAL-01.md`로 옮김 → 커밋·PR(사용자 지시 때).
3. **그다음 `direct-journal`**: 사용자가 [QUESTIONS.md](../direct-journal/2026-10-20/QUESTIONS.md)의 질문 6개에 답 → DECISIONS에 기록(D-066 상태 포함) → Q1 답에 맞춰 work-graph·`quality-gates.yaml`(F-21)·ROADMAP·STATUS → `tasks/direct-journal/<날짜>/PLAN.md` → 조각 0부터([MAP.md](../direct-journal/2026-10-20/MAP.md) §5). 질문 답은 휴대폰 확인을 기다리는 동안 미리 받아도 된다.
4. **날짜가 걸린 것**: 있었던 일 안내 2단계 문구는 쓰기 시작한 지 30일째(추정 2026-11-19 무렵)에 바뀌어야 한다 — 서버에 첫 기록일 값이 그 전에 들어가야 한다(MAP A-7, 조각 4).
5. 운영 명령은 `ALLOW_PROD=1`, 실제 일기가 생긴 운영에는 데이터를 지우는 명령(`--fresh`·`--reset-dev-data`·`drill.mjs`·SQL `DELETE`)을 쓰지 않는다(DEPLOY §8). 창고 구조를 바꾸기 전에는 내보내기 + 백업, 바꾼 뒤 복원 확인(RK-045).
