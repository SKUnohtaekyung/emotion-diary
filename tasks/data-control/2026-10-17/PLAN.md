# 2026-10-17 TASK-DATA-02 계획 — data-control(내 데이터 통제): 내보내기·모든 기록 지우기·PC 백업과 다시 넣기·복원 연습

요청과 사용자 답은 [REQUESTS.md](REQUESTS.md). **이 문서가 이 작업의 유일한 진행 기록이다**(D-118). 시험·검사·측정 숫자는 `docs/STATUS.md` §1 숫자 표에만 두고 여기서는 그 행을 가리킨다. 관문 `data-control` = F-14·F-15·restore-drill·export-cpu-measured(EVAL_PLAN §14). 사용자 결정은 U-1~U-4뿐이고 나머지는 에이전트 결정(D-124).

## 1. 결정표

| # | 결정 | 누가 | 근거 |
| --- | --- | --- | --- |
| A-1 | 내보내기 파일에 `displayName`(부를 이름, 없으면 null)을 넣는다 — `schemas/export.schema.json` 필수 칸 | **사용자(U-2)** | DATA_MODEL §3.4 '정하지 않았다' |
| A-2 | `GET /api/export[?after=YYYY-MM-DD]`는 **100편씩 조각**(`EXPORT_PAGE_SIZE`)으로 주고 `next`로 이어 받는다. 화면·백업 도구가 이어 붙여 파일 하나를 만든다 | 에이전트 | §4 측정 — 3년치를 한 번에 내면 Worker 안 계산만으로 무료 10ms를 넘는 셈이다 |
| A-3 | 모든 기록 지우기 `DELETE /api/diaries` 본문 `{ confirm: "모든 기록 삭제", pin? }`. 기록(부모 먼저 + 연쇄)·영수증·owner 설정(부를 이름·앱 잠금·하루 기준 시각)·다른 기기 세션을 batch 하나로, 이 기기 세션은 남겨 잠김을 풀고 처음 상태로. 앱 잠금을 켰으면 `verifyPin`(틀린 횟수 공유). 성공 판정은 지운 뒤 조회 | 에이전트(범위는 D-112 ⑤⑩) | DATA_MODEL §8 |
| A-4 | PC 백업 경로는 cookie·CSRF가 아니라 `Authorization: Bearer <토큰>` — 서버에는 토큰의 SHA-256(`BACKUP_TOKEN_HASH`, 선택 secret)만, 없으면 방식과 상관없이 404. `GET /api/backup/export`(같은 조각)·`POST /api/backup/import` | 에이전트 | D-109 '전용 경로', ARCHITECTURE §3 |
| A-5 | 다시 넣기는 **이미 있는 날짜를 덮지 않고 건너뛴다**(Time Travel 뒤 빠진 날만 채우기와 전부 되살리기를 같은 도구로). 조각 하나(≤200편·≤1MiB)를 먼저 전부 검사하고(창고의 CHECK와 같은 조건 — 네 자리 연도 시각, 64자 이하 감정 코드까지) batch 하나(json_each)로 넣는다. 설정은 행이 없을 때만 되살린다. 세부 감정 코드는 지금 사전에 없어도 모양·계열 접두어만 맞으면 받는다(지난 사전 판의 기록) | 에이전트 | DATA_MODEL §8 복구 순서 |
| A-6 | PC 도구 `app/scripts/backup.mjs` — `pull`(조각을 이어 받아 `emotion-diary-YYYY-MM-DD.json`으로, 30일 지난 파일 삭제, 기본 폴더 `<홈>/emotion-diary-backup/<env>`, 경로 이름에 클라우드 동기화 서비스 이름이 든 폴더 거부), `restore`(300KB·100편 조각 — §4), `schedule-command`(작업 스케줄러 등록 명령을 cmd용·PowerShell용 두 줄로 **출력만**) | **사용자(U-3: 명령만)** + 에이전트(모양) | D-109 |
| A-7 | 화면은 오늘 화면의 도구 줄에서 들어가는 `#/settings/export`(화면을 열 때 미리 모든 조각을 받아 File을 준비하고, 누르는 순간 await 없이 `navigator.share`) · `#/settings/delete`(확인 문구 정확히 같을 때만) · `#/settings/deleted`(고지) | 에이전트 | UX_SPEC §13, iOS 사용자 동작 안의 공유 창 |

## 2. 짓는 순서(체크리스트)

- [x] 2-1 공용 계약 — `app/shared/api.ts`(경로·`DELETE_ALL_CONFIRM`·오류 코드 `confirm_mismatch`·`invalid_import`), `app/shared/diary.ts`(`ExportFile`·`ExportPage`·`EXPORT_PAGE_SIZE`·`DeleteAllInput`·`ImportChunk`·`ImportResult`·`exportFileName`)
- [x] 2-2 서버 — `app/worker/src/routes/dataControl.ts`(내보내기·전체 삭제·백업 내보내기·다시 넣기, 검사·행 만들기는 순수 함수 `planImport`), `app.ts`(백업 경로는 로그인 확인 전에 Bearer로), `diaries.ts`의 `entryView`를 꺼내 재사용, `appLock.ts`의 `verifyPin` 공개
- [x] 2-3 서버 시험 — `app/test/worker/data-control.test.ts`(F-14·F-15·백업 404/401/405·조각 이어 받기·복원 왕복·잘못된 조각 0건·413), `export-cpu.test.ts`(내보내기·다시 넣기 측정), `synthetic.ts`(합성 기록)
- [x] 2-4 PC 도구 — `make-secrets.mjs <env> backup`, `cf.mjs secrets`의 선택 secret, `backup.mjs`, `drill.mjs`(원격 복원 연습), `remote-check.mjs` 4c
- [x] 2-5 화면 — 작업자(병렬, 소유 파일 분리)가 짓고 메인이 다시 쟀다. 메인이 고친 것: 응답을 못 받은 지우기(status 0)는 '그대로 있어요'라고 단정하지 않고 "지웠는지 확인하지 못했어요"로, 지우는 동안 저장 줄을 얼리고(`quiesce`) 실패하면 푼다(`thaw`) — 응답을 못 받았으면 화면을 떠날 때까지 얼린 채 둔다(§7 R-6)
- [x] 2-6 결함 주입(§6)·전체 검증(`verify --mode full`, E2E)·새 맥락 마감 검토(§7) — 수는 STATUS §1 '앱 시험'·'실제 브라우저 E2E'·'결함 주입(내 데이터 통제)' 행
- [x] 2-7 개발용 환경(U-1): `make-secrets dev backup` → `cf.mjs dev deploy` → `remote-check` → `drill.mjs` → 데이터·로그인 비움 — 결과는 STATUS §1 '개발용 건물 원격 검사'·'복원 연습' 행. 세부는 §5
- [x] 2-8 커밋·PR(U-4)·자동 고침 — PR #43(Codex 지적 2건 반영 `85ac8c9`, §7 R-9·R-10) CI 통과, 사용자가 병합(PR #43 → PR #42 → `main` `8416734`). 개발용 환경에 마이그레이션 0008 적용(2026-10-17)

## 3. 무료 한도 메모

- D1 쓰기: 합성 3년치 한 번 넣기·지우기가 각각 약 1만 1천 행(+색인). `drill.mjs` 한 번에 약 4만~5만 행 — 무료 하루 10만 행 안이지만 **하루에 두 번 돌리지 않는다**(2026-10-17 한 번 돌렸다).
- D1 값 하나 2MB: 다시 넣기 조각 본문 1MiB 상한(도구는 300KB)으로 json_each 값이 그 아래다.

## 4. 측정(export-cpu-measured)

`wrangler tail`에는 요청별 CPU 칸이 없어 Cloudflare 쪽 CPU를 직접 볼 수 없다. 서버 시험에서 Worker 코드는 이 PC의 Node에서 돌고 SQL만 workerd가 하므로(운영에서 D1 실행이 Worker 밖인 것과 같은 나눔) 두 가지를 잰다 — ① 요청 하나 동안의 Node 프로세스 CPU(`process.cpuUsage`, 시험용 D1 중계의 직렬화가 섞이고 Windows 해상도가 약 15.6ms라 거칠다) ② **Worker 안에서 실제로 도는 계산만**(입출력 없는 순수 계산이라 경과 시간 = CPU, 200회 평균): 내보내기는 D1 행 해석 + 조립 + 응답 만들기, 다시 넣기는 본문 해석 + 기록마다 검사 + json_each에 줄 행 만들기(`planImport`). 명령은 `npx vitest run app/test/worker/export-cpu.test.ts --reporter=verbose`, 값은 STATUS §1 '내보내기·다시 넣기 CPU' 행.

판정:
- 내보내기 한 조각(100편)은 무료 10ms 안에서 여유가 크다. 3년치를 한 번에 냈다면 같은 셈으로 한도를 넘었다 — 나눠 내보내기(A-2)가 맞다. 원격에서는 `drill.mjs`가 3년치를 조각으로 끝까지 받아 전부 200인지 봤다(한도를 넘으면 Cloudflare가 요청을 끊는다).
- 다시 넣기는 처음에 재지 않았다 — 마감 검토(§7 R-1)가 150편 조각을 10ms 넘게 쟀고, 그 절반 가까이가 기록마다 `Intl.DateTimeFormat`을 새로 만드는 시간대 검사였다. `canonicalTimeZone`이 답을 기억하게 고치고(크기 64로 묶음) PC 도구 조각을 100편·300KB로 줄였다. 서버 상한 200편 조각도 한도 안이다. 원격에서는 `drill.mjs`가 1,095편을 100편 조각으로 넣고 백업 1,096편을 `backup.mjs restore`로 되살려 전부 200이었다.

## 5. 진행 기록

- 2026-10-17: 2-1~2-4 끝, 화면은 작업자가 같은 폴더에서 소유 파일을 나눠 지었다(CURRENT_TASK `- 동시 작업: 켬` — 끝난 뒤 지웠다).
- 2026-10-17: 2-5·2-6 끝 — 메인이 화면을 다시 재며 지우기 실패 문구와 저장 줄 얼림을 고쳤고, 결함 10종을 주입했고(§6), 새 맥락 검토자의 지적 8건을 반영했다(§7).
- 2026-10-17: 2-7 — `make-secrets.mjs dev backup`(값은 찍지 않는다 — `work/deploy/` Git 제외) → `cf.mjs dev deploy`(빌드 `20261016180806-06820b6`, 커밋 전 작업 트리) → `remote-check`. 이 첫 원격 검사에서 실시간 서버 기록 검사가 1건 걸렸다 — 무엇이 걸렸는지 기록하지 않아 확정하지 못했다. Worker가 남기는 로그는 `app/worker/src/app.ts`의 한 줄(방식·경로·오류 이름)뿐이라 본문·열쇠·이름이 로그로 나갈 코드 길이 없고, 남는 설명은 네 자리 비밀번호의 숫자열이 15만 자 기록 속 다른 값(요청 번호·시각)과 우연히 겹친 것이다(가설). `remote-check.mjs`가 걸린 것을 이름으로 알리고 비밀번호는 앞뒤가 영숫자가 아닌 독립된 값만 세게 고쳤다(다른 값 안에 든 횟수는 따로 알린다). 그 뒤 원격 검사는 매번 0건.
- 2026-10-17: 마감 검토 반영 뒤 다시 올림 — 첫 `deploy`는 Cloudflare 로그인 토큰이 막 만료된 순간이라 인증 오류(code 10000), 갱신 뒤 1회 재시도(일시 실패) → 빌드 `20261016183421-06820b6`(`BACKUP_TOKEN_HASH` 묶임 확인) → `remote-check` → `drill.mjs dev --reset-dev-data`(합성 1,095편 + 오늘 한 편 + 이름·하루 기준 시각 → 조각 내보내기 → 다른 기기 로그아웃 → `backup.mjs pull` → 모두 지우기 → `backup.mjs restore` → 처음과 같은지 → 로그아웃한 cookie 401 → 정리). 정리 뒤 원격 읽기로 `diary_entries`·`diary_categories`·`diary_emotions`·`diary_reflections`·`idempotency_records`·`owner_settings`·`sessions`가 비었음을 확인했다.
- 2026-10-17: `schedule-command`가 출력하는 줄을 셸마다 확인 — 등록하지 않고 `schtasks` 자리에 인자를 찍는 스크립트를 넣어 봤다. cmd 줄은 cmd에서, `schtasks --% …` 줄은 PowerShell 5.1에서 `/TR` 값이 하나로 넘어갔고, cmd 줄을 PowerShell에 그대로 붙이면 여러 조각으로 깨졌다.

## 6. 결함 주입(2026-10-17)

일부러 망가뜨린 코드를 한 번에 하나씩 넣고 관련 시험을 돌린 뒤 매번 원래 바이트로 되돌렸다(SHA-256 대조). 모두 시험이 잡았다.

| # | 망가뜨린 것 | 잡은 시험 |
| --- | --- | --- |
| D1 | 지우기 전 저장 줄 얼림(`quiesce`) 제거 | 화면 `data-control.test.ts` — 지우는 동안 쓰던 글을 보내지 않는다 |
| D2 | 확인 문구 검사 제거 | 서버 `data-control.test.ts` |
| D3 | 다시 넣기 딸린 행의 write_token 조건 제거 | 서버 `data-control.test.ts` |
| D4 | 내보내기 조각 조회의 `LIMIT` 제거 | `export-cpu.test.ts` — 처음엔 **살아남았다**(출력은 잘려 같다). 한 조각이 D1에서 읽는 기록 행이 조각 크기+1인지 단언을 더해 잡았다 |
| D5 | 백업 토큰 비교 무력화 | 서버 — 틀린 토큰 401 |
| D6 | 지우기의 앱 잠금 비밀번호 검사 제거 | 서버 — 앱 잠금 흐름 |
| D7 | 응답 없음에도 저장 줄을 바로 풂 | 화면 — 응답을 못 받으면 화면에 있는 동안 보내지 않는다 |
| D8 | 시각의 네 자리 연도 모양 검사 제거 | 서버 — 잘못된 조각 0건(`+010000-…`) |
| D9 | 감정 코드 전체 길이(64자) 검사 제거 | 서버 — 잘못된 조각 0건(65자) |
| D10 | secret이 없을 때 먼저 404 제거 | 서버 — 맞지 않는 방식도 404 |

## 7. 마감 검토(새 맥락 검토자, 읽기 전용)와 처리

| # | 심각도 | 지적 | 처리 |
| --- | --- | --- | --- |
| R-1 | 높음 | 다시 넣기 150편 조각의 Worker 안 계산이 무료 10ms를 넘을 공산 — 시간대 검사가 기록마다 `Intl.DateTimeFormat`을 새로 만든다 | `canonicalTimeZone` 결과를 기억(크기 64), 다시 넣기를 `planImport`로 꺼내 `export-cpu.test.ts`에서 잰다, 도구 조각 100편·300KB(§4) |
| R-2 | 중간 | UX_SPEC §13의 '부를 이름 넣을지 정하지 않았다'·진입점·삭제 완료 문구가 구현과 다르다 | UX_SPEC §13에 '첫 구현' 줄, 옛 문장을 U-2로 고침. STATUS §4 5번의 같은 옛 문장도 |
| R-3 | 중간 | 검사는 통과하는데 창고 CHECK가 막는 입력이 500 — 감정 코드 65자 이상, 여섯 자리 연도 시각 | 검사를 창고와 같게(64자, `YYYY-` 모양) — 시험 2건 |
| R-4 | 낮음 | secret이 없을 때 맞지 않는 방식은 405(경로가 있다는 것이 드러남) | `backupConfigured`를 경로 고르기 전에 — 시험 2건 |
| R-5 | 낮음 | 등록 명령이 cmd식 따옴표라 PowerShell에 붙이면 깨질 수 있다, 동기화 폴더 '거부'는 이름으로만 본다 | cmd·PowerShell(`--%`) 두 줄 출력, 셸마다 확인(§5). DATA_MODEL·DEPLOY에 '이름으로만 본다' |
| R-6 | 낮음 | 응답 없음(status 0) 뒤 저장 줄을 풀면, 서버가 실제로 지웠을 때 오늘 글을 다시 만들 수 있다 | 응답을 못 받았으면 이 화면에 있는 동안 얼린 채 두고 떠나면 푼다 — 시험 1건 |
| R-7 | 낮음 | 같은 id가 다른 날짜로 있으면 '이미 있는 날짜'로만 알린다 | 도구 문구 '이미 있는 날짜이거나 같은 번호의 기록이 이미 있음', DATA_MODEL §8에 한 줄 |
| R-9 | P1(PR #43 Codex) | 세션 확인을 지나 날아오던 다른 기기·탭의 쓰기가 지우기 batch 뒤에 들어와 기록·설정을 되살릴 수 있다 | `sessions.data_epoch`(마이그레이션 0008) — 지우기가 이 세션 세대를 올리고, 행을 새로 만드는 쓰기(오늘 기록 만들기·설정 upsert 셋)가 같은 문장에서 `liveSession`을 본다, 막히면 401. 결정적 경쟁 시험 5건(가드를 빼면 실패 확인). 개발용 환경은 다음 배포 전에 `cf.mjs dev migrate` |
| R-10 | P2(PR #43 Codex) | 다시 넣기 조각에 같은 id가 날짜만 달리 두 번이면 딸린 행이 부딪혀 500 | `planImport`가 id 중복을 422로 — 시험 1건 |
| R-8 | 낮음 | 저장소 상태 — `.playwright-cli/`·`output/playwright/`가 Git 제외 밖 untracked(2026-09-20 것), PLAN 2-5 미체크 | 두 폴더는 이 작업 것이 아니라 커밋에 넣지 않는다(손대지 않음). PLAN 갱신 |
