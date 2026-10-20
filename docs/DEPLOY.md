# 배포 절차

## 1. 책임

이 문서는 앱을 Cloudflare에 만들고 올리고 되돌리는 절차의 정본이다. 구성(왜 이렇게 생겼는지)은 [ARCHITECTURE.md](ARCHITECTURE.md) §2·§11과 D-111·D-115가 정본이다. 2026-10-14 TASK-MOBILE T3에서 처음 썼다.

규칙 넷:

- **계정 값은 저장소에 두지 않는다**(D-115 ①). 계정 id·D1 id·앱 주소(계정 하위 도메인)는 커밋되는 파일에 없다. 원격 명령은 모두 `node app/scripts/cf.mjs <환경> …`으로 한다 — 이 스크립트가 이름으로 D1 id를 찾아 Git 제외 파일 `wrangler.local.jsonc`를 만들어 쓴다.
- **비밀값과 열쇠는 Git 제외 파일과 `wrangler secret`에만 있다**(ARCHITECTURE §3). 채팅·문서·로그·캡처에 옮기지 않는다. 스크립트도 값을 찍지 않는다.
- **새로 만들거나 지우는 일은 하기 직전에 사용자에게 다시 묻는다** — 무료여도 그렇다(사용자 규칙 2026-09-02). 무엇을 만드는지·요금·바뀌는 것·되돌리는 법을 먼저 말한다.
- **개발용 건물에는 가짜 데이터만** 넣는다. 실제 일기·실제 이름은 운영 건물에만 들어간다.

| 환경 | Worker | D1 | 쓰는 것 | 상태 |
| --- | --- | --- | --- | --- |
| local | (이 PC의 `wrangler dev`) | `emotion-diary-local`(이 PC의 `.wrangler/`) | 개발 | `npm run dev` |
| dev | `emotion-diary-dev` | `emotion-diary-dev`(APAC) | 개발용 건물 — 가짜 데이터, 화면 오류 보고·상태 칸 켜짐, 홈 화면 이름 '감정일기 개발' | 2026-10-14 만들었다(TASK-MOBILE T3, 사용자 확인 U-2) |
| prod | `emotion-diary-prod` | `emotion-diary-prod`(APAC) | 운영 — 실제 일기(본인 한 사람, D-108) | 2026-10-20 만들었다(TASK-PERSONAL-01, 사용자 승인 U-1) — §8 |

**무료 한도는 계정 단위다** — 개발용과 운영이 Workers 요청 하루 10만·D1 쓰기 하루 10만 행을 나눠 쓴다(`harness/runtime-profile.json`). 운영을 쓰기 시작한 뒤에는 개발용에서 쓰기가 많은 명령(`drill.mjs` 약 4만~5만 행)을 돌린 날 운영의 여유가 그만큼 준다 — 하루 한 번을 넘기지 않는다.

## 2. 준비

1. `npm ci`(잠금 파일 그대로). 의존성을 더할 때는 npm 11로 잠금 파일을 고친다(`npx -y npm@11 install …` — `harness/runtime-profile.json`의 `lockfile_policy`).
2. Cloudflare 로그인 확인: `node node_modules/wrangler/bin/wrangler.js whoami`. 만료됐으면 사용자가 `node node_modules/wrangler/bin/wrangler.js login`을 실행해 브라우저에서 직접 승인한다(에이전트가 비밀번호를 넣지 않는다). 몇 주 지나면 만료된다.
3. 이 PC에서 띄워 보기: `node app/scripts/make-secrets.mjs local all` → `npm run dev`(개발용 묶음 빌드 → 로컬 D1 마이그레이션 → `wrangler dev`). 로컬 열쇠는 `work/deploy/local.PHONE-KEY.txt`. 로컬은 `http://localhost`라 `__Host-` cookie가 Chrome·Edge에서만 된다 — iPhone 확인은 개발용 건물로 한다.

## 3. 처음 만들기(개발용)

사용자 확인을 받은 뒤 순서대로 한다. 각 단계는 다시 해도 안전하다(`create`만 이미 있으면 실패한다).

| 단계 | 명령 | 결과 |
| --- | --- | --- |
| 1 | `node app/scripts/cf.mjs dev create` | D1 `emotion-diary-dev`(APAC)를 만든다. Worker는 4단계의 첫 올리기에 생긴다 |
| 2 | `node app/scripts/make-secrets.mjs dev all` | 비밀값 넷과 열쇠를 만들어 `work/deploy/dev.secrets.env`·`work/deploy/dev.PHONE-KEY.txt`(Git 제외)에 쓴다 |
| 3 | `node app/scripts/cf.mjs dev migrate` | `app/migrations/`를 원격 D1에 적용한다(적용 기록은 D1의 `d1_migrations` 표) |
| 4 | `node app/scripts/cf.mjs dev deploy` | 개발용 묶음을 빌드·검사하고 **비밀값 파일과 함께** 올린다(`wrangler deploy --secrets-file` — 값이 명령줄·로그에 오르지 않고, 첫 올리기에도 비밀값이 빠진 순간이 없다). Worker는 이때 생긴다. 앱 주소는 `work/deploy/dev.url`(Git 제외)에 남는다 |
| 5 | `node app/scripts/remote-check.mjs dev --tail --reset-dev-data` | §5의 확인 |

비밀값만 바꿀 때(올리지 않고)는 `node app/scripts/cf.mjs dev secrets [이름…]` — 값은 표준 입력으로만 넘긴다. 전파에 20초쯤 걸린다.

## 4. 올리기(다시)

`node app/scripts/cf.mjs dev deploy` 한 줄이다(비밀값 파일은 그대로 다시 실린다 — 바뀌지 않았으면 결과가 같다). 빌드 번호(UTC 시각-커밋 앞 7자)를 하나 만들어 화면 묶음과 서버 묶음에 같이 넣고, 묶음 검사(ARCHITECTURE §11.2)를 통과해야 올린다. 스키마가 바뀌었으면 올리기 **전에** `migrate`를 한다 — 새 코드가 옛 표를 만나지 않게(DATA_MODEL §9: 늘리기 → 채우기 → 확인 → 줄이기).

올린 뒤 열려 있던 홈 화면 앱은 다시 보일 때 '새 버전이 있어요' 띠를 보인다(ARCHITECTURE §11.4). 저절로 새로 고치지 않는다.

## 5. 올린 뒤 확인

`node app/scripts/remote-check.mjs dev --tail --reset-dev-data` — 가짜 데이터만 쓴다. **끝에 개발용 D1의 이름·잠금 설정과 모든 세션을 지운다**(한 사람용이라 검사가 만든 행만 가를 수 없다) — 휴대폰으로 확인하는 중이면 그 로그인·이름·잠금도 사라지므로 그때는 돌리지 않는다. 플래그가 없으면 돌지 않는다. 확인하는 것: 정적 파일과 헤더(CSP·HSTS·nosniff·프레임 정책, 해시 파일의 긴 캐시, 첫 화면 파일·manifest의 매번 확인, 파일 없는 경로의 첫 화면 파일과 그 응답의 CSP), 로그인 전 상태 응답, 없는 API의 401·404, CSRF 403, 틀린 열쇠 401, cookie 속성, 화면과 서버의 빌드 번호가 같은지, 화면 신호, 부를 이름, 앱 잠금(정하기·잠그기·423·틀림 422·풀기·끄기), 개발용 오류 보고(일곱 칸만), 로그아웃한 cookie 사본의 401, 그리고 실시간 서버 기록에 열쇠·비밀번호·이름·글이 0건인지. 끝나면 검사가 만든 이름·세션을 지운다.

## 6. 열쇠 바꾸기

- **열쇠만**: `node app/scripts/make-secrets.mjs dev key [--key-length N]` → `node app/scripts/cf.mjs dev secrets ACCESS_KEY_HASH ACCESS_KEY_SALT`. 이미 들어와 있는 기기의 로그인은 그대로다(세션 서명 비밀값을 바꾸지 않았다).
- **모든 기기의 로그인을 끊을 때**: `make-secrets.mjs dev all` → `cf.mjs dev secrets`(넷 모두). 세션 서명이 바뀌어 모든 cookie가 무효가 된다. 서버의 세션 기록만 지우는 방법도 있다: `node app/scripts/cf.mjs dev sql "DELETE FROM sessions"`.
- 순서는 ARCHITECTURE §6 '실패 제한과 운영'대로 — 새 값 등록 → 전파 확인(옛 열쇠 401) → 다시 로그인.
- **휴대폰에 넣는 열쇠**: 손으로 넣기 쉽게 짧은 임시 열쇠(`--key-length 12` — 헷갈리는 글자를 뺀 문자 집합이라 약 70비트, 틀린 열쇠 잠금이 함께 막는다)로 확인한 뒤, 끝나면 기본 길이(43자)로 바꾼다. 열쇠는 `work/deploy/dev.PHONE-KEY.txt`를 이 PC에서 열어 보고 넣는다.

## 7. 되돌리기와 지우기

- **코드 되돌리기**: 앞 커밋을 꺼내 `cf.mjs dev deploy`를 다시 한다. 스키마를 되돌리는 마이그레이션은 만들지 않는다 — 앞으로 고치는 마이그레이션을 더한다(DATA_MODEL §9).
- **데이터 되돌리기**: D1 Time Travel(7일, D-109, DATA_MODEL §8)로 시점을 되돌린다. 운영 데이터에는 실습한 절차만 쓴다.
- **개발용 건물 지우기**(되돌릴 수 없다 — 사용자 확인 뒤): `CONFIRM_DESTROY=emotion-diary-dev node app/scripts/cf.mjs dev destroy`(Worker와 D1을 지운다). Git 제외 파일 `work/deploy/dev.*`도 지운다.

## 8. 운영(본인 사용 시작 전 — personal-start, D-117)

2026-10-20 TASK-PERSONAL-01에서 만들었다(사용자 승인 U-1 — 이름·요금 0원·지우는 법을 보이고 받았다). 진행 기록은 `tasks/personal-start/2026-10-20/PLAN.md`.

**운영 명령은 `ALLOW_PROD=1`을 앞에 붙인다** — 개발용 습관대로 운영에 보내지 않게 하는 걸쇠다(`cf.mjs`·`remote-check.mjs`·`prod-restore-check.mjs`·`backup.mjs restore prod`). 읽기뿐인 `backup.mjs pull prod`(매일 예약 실행)만 걸쇠 없이 돈다. 운영에는 데이터를 지우는 명령(`--reset-dev-data`, `drill.mjs`, `sql "DELETE …"`)을 쓰지 않는다. 예외는 실제 일기를 넣기 전 빈 운영에서만 도는 `--fresh` 둘이고, 둘 다 시작할 때 일기·설정이 0행인지 확인한다.

| 단계 | 명령 | 결과 |
| --- | --- | --- |
| 1 | `node app/scripts/make-secrets.mjs prod all` → `… prod backup` | 개발용과 **다른** 비밀값 넷·열쇠·백업 토큰(`work/deploy/prod.*`, Git 제외). 이미 있으면 `all`·`key`·`backup` 모두 멈춘다 — 알고 바꿀 때만 `--rotate`(`all`은 모든 기기 로그아웃, `backup`은 새 해시를 올리기 전까지 매일 백업이 401) |
| 2 | `ALLOW_PROD=1 node app/scripts/cf.mjs prod create` | D1 `emotion-diary-prod`(APAC) |
| 3 | `ALLOW_PROD=1 node app/scripts/cf.mjs prod migrate` | 마이그레이션 |
| 4 | `ALLOW_PROD=1 node app/scripts/cf.mjs prod deploy` | 운영 묶음(개발용 코드 0건 검사 — ARCHITECTURE §11.2)을 비밀값 파일과 함께 올린다. Worker는 첫 올리기에 생기고 주소는 `work/deploy/prod.url` |
| 5 | `ALLOW_PROD=1 node app/scripts/remote-check.mjs prod --fresh --tail` | **빈 운영에서 한 번**: 개발용과 같은 쓰기 검사 + 오류 보고 경로 404 + 실시간 기록 0건, 끝에 비우고 다시 0행인지 본다 |
| 6 | `ALLOW_PROD=1 node app/scripts/prod-restore-check.mjs --fresh --reset-dev-data` | **첫 백업·복원 확인**(`backup-and-restore-drill`): 빈 운영에 가짜 한 편 → `backup.mjs pull prod` → 개발용에 `restore` → 같은지 → 양쪽 정리 |
| 7 | `node app/scripts/backup.mjs schedule-command prod` | 매일 백업 등록 명령을 출력한다 — 실행은 본인(D-124) |

**`--fresh`가 중간에 멈췄을 때**(실제 일기를 넣기 전에만): `prod-restore-check`는 멈춰도 끝에 정리하지만 `remote-check --fresh`는 그렇지 않다 — 남은 가짜 '오늘' 기록은 그날 실제 일기를 막는다(하루 1편). 원격 읽기로 남은 행을 본 뒤 `ALLOW_PROD=1 node app/scripts/cf.mjs prod sql "DELETE FROM diary_entries; DELETE FROM idempotency_records; DELETE FROM owner_settings; DELETE FROM sessions;"` — **실제 일기가 한 편이라도 들어간 뒤에는 쓰지 않는다.**

**다시 올릴 때**(실제 일기가 있다): `ALLOW_PROD=1 node app/scripts/cf.mjs prod deploy` → `ALLOW_PROD=1 node app/scripts/remote-check.mjs prod --tail`(운영판 — 이름·잠금·일기·설정을 쓰지 않고 지우기 경로도 부르지 않으며 정리도 없다. 일기를 받아 오지 않게 내보내기는 빈 조각만 본다. 로그인했다 로그아웃하고 읽기·거절 경로, 오류 보고 경로 404, 실시간 기록의 열쇠 0건을 본다). 창고 구조를 바꾸는 작업 전에는 내보내기 + `backup.mjs pull prod`, 바꾼 뒤 복원 확인(RK-045).

- 운영 열쇠는 `work/deploy/prod.PHONE-KEY.txt`를 이 PC에서 보고 휴대폰에 직접 넣는다 — 채팅·캡처·문서에 옮기지 않는다. 앱 주소는 계정 하위 도메인이 들어 있어 저장소에 적지 않는다.
- 실제 일기가 생긴 뒤의 복원 확인을 어디에 되살려 볼지(개발용 건물에는 실제 글을 넣지 않는다 — §1 규칙)는 다음에 정한다. 후보는 이 PC의 로컬 D1(`wrangler dev`).
- 운영 지우기(되돌릴 수 없다 — 실제 일기가 사라진다): 사용자 확인 뒤 내보내기 + 백업을 먼저 하고 `CONFIRM_DESTROY=emotion-diary-prod ALLOW_PROD=1 node app/scripts/cf.mjs prod destroy`.
- 공개 때(`limited-release`)는 EVAL_PLAN §12 출시 증거 묶음과 `deployment-boundary-review`의 공개판을 더한다.

## 9. PC 백업과 다시 넣기(D-109·D-124)

| 단계 | 명령 | 결과 |
| --- | --- | --- |
| 토큰 만들기 | `node app/scripts/make-secrets.mjs dev backup` | 비밀값 파일에 `BACKUP_TOKEN_HASH`(SHA-256)를 더하고 토큰을 `work/deploy/dev.BACKUP-TOKEN.txt`(Git 제외)에만 쓴다. 다른 비밀값은 그대로 |
| 올리기 | `node app/scripts/cf.mjs dev secrets BACKUP_TOKEN_HASH` 또는 `cf.mjs dev deploy` | Worker가 백업 경로를 연다(secret이 없으면 404) |
| 받기(매일) | `node app/scripts/backup.mjs pull dev [--dir <폴더>]` | 조각을 이어 받아 `<홈>/emotion-diary-backup/dev/emotion-diary-YYYY-MM-DD.json`, 30일 지난 파일 삭제. 경로 이름에 OneDrive·Dropbox·Google Drive·iCloud가 든 폴더는 거부(이름으로만 본다) |
| 매일 실행 등록 | `node app/scripts/backup.mjs schedule-command dev` | 작업 스케줄러 등록 명령(`schtasks /Create …`)을 **출력만** 한다 — 명령 프롬프트용 줄과 PowerShell용 줄(`schtasks --% …` — PowerShell 5.1은 cmd식 따옴표를 달리 읽어 `/TR` 값이 깨진다). 실행은 본인이 |
| 다시 넣기 | `node app/scripts/backup.mjs restore dev <파일> [--dry-run]` | 300KB·100편 조각으로 넣는다(조각의 Worker 안 계산 — STATUS §1). 이미 있는 날짜는 건너뛰고 설정은 행이 없을 때만 |
| 복원 연습 | `node app/scripts/drill.mjs dev --reset-dev-data` | 합성 3년치 → 조각 내보내기 → 백업 → 모두 지우기 → 다시 넣기 → 같은지 → 로그아웃 cookie 401 → 정리. D1 쓰기 약 4만~5만 행이라 하루에 두 번 돌리지 않는다 |

**Time Travel로 되돌린 뒤**에는 세션 표가 그 시점으로 돌아가 로그아웃한 cookie가 되살아날 수 있다 — 되돌린 직후 `node app/scripts/cf.mjs <env> sql "DELETE FROM sessions"`로 세션을 비우고(모든 기기가 다시 로그인한다) 그 뒤에 쓴 기록을 `backup.mjs restore`로 채운다(감리 N-7). 운영이면 명령 앞에 `ALLOW_PROD=1`.

운영은 같은 표의 `dev`를 `prod`로 바꿔 쓴다(토큰 `work/deploy/prod.BACKUP-TOKEN.txt`, 폴더 `<홈>/emotion-diary-backup/prod/`). 복원 연습(`drill.mjs`)은 개발용 전용이다 — 운영의 첫 확인은 §8의 6단계.
