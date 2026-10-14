# 사실표 — TASK-REVIEW-01 1단계

결론·평가 없이 '무엇이 있고 무엇이 확인됐는가'만 적는다. 2026-10-14 실행 세션이 작업 트리(브랜치 `app/scaffold`, HEAD `7b99e2c` + 커밋 전 변경)에서 모았다. 줄마다 출처(파일·절 또는 명령)를 단다. 같은 사실이 문서마다 다르면 §K '불일치'에 적고 고치지 않는다. 결정 기록의 '근거' 칸은 그때의 주장이고 여기서는 '그렇게 적혀 있다'로만 옮긴다.

표기: **[명령]** 이 세션이 직접 돌린 명령의 결과 · **[문서]** 저장소 문서에 적힌 것(실측 여부는 그 문서의 주장) · **[사용자]** 사용자가 말하거나 고른 것(REQUESTS 기록).

## A. 지금 손에 있는 것 (R-ZERO가 읽는 절)

| 무엇 | 사실 | 출처 |
| --- | --- | --- |
| 제품 정본 | `PRD.md` 227줄(요구사항 레지스트리 §3, 접근·배포 전제 §4, 원형 일기 §5, 감정 체계 §6, 흐름 §7, 날짜·완료 §8, 기능 §9, 대시보드·분석 §10, 데이터·개인정보 §11, 제외 §12, 출시 게이트 §13), `docs/SERVICE_WHY.md` 801줄 | [명령] `wc -l`, `grep '^#' PRD.md` |
| 쓰는 사람 | 일단 본인 1명. 다른 사람도 쓰는 서비스로 갈지는 정하지 않고 미뤘다 | [사용자] D-108 ①("일단 나 혼자 쓸거임"), `harness/loop-state.json` blockers |
| 기기 | iPhone(iOS 26.5.2)만 있다. Android·Mac 없음 | [사용자] `tasks/spike/2026-10-13/REQUESTS.md` 질문과 답, `tasks/mobile/2026-10-14/REQUESTS.md` '낡은 전제' |
| 비용 제약 | 유료 API 없음(D-019), 호스팅 대안은 무료만(D-021) | [문서] `docs/DECISIONS.md` D-019·D-021(둘 다 사용자 결정 표식) |
| 화면 시안 `web/` | 파일 54개, js·css·html 7,245줄. 의존성·빌드 없는 정적 HTML/CSS/ES module. 저장·인증·API 없음. 사용자가 2026-10-13 달력 포함 전체 화면을 승인. Phase 2에서 구조만 옮기고 코드는 버린다 | [명령] `find web …| wc -l` / [문서] D-047, `docs/STATUS.md` §1·§6 |
| 디자인 시스템 | `docs/DESIGN_SYSTEM.md`(147KB), `design/tokens.json`, `design/style-guide.html`, 대비 검사 `scripts/check-contrast.mjs` 292건, 친구 캐릭터 9종 PNG, 조약돌 9종, Pretendard 웹폰트 약 2.0MB 한 파일 | [명령] `wc -c`, `ls design` / [문서] STATUS §2, RK-022 |
| 감정 분류표 | v1(원자료 전사, 7계열 194개, reviewed), v2(문헌 근거, 9계열 194개, reviewed, `data/taxonomy/v2.json`), v1→v2 매핑 | [문서] `harness/work-graph.yaml` taxonomy-v1·taxonomy-v2-research(done) |
| 위기 연락처 | `data/crisis-resources/kr.json`(공식 출처로 채움, 임상·안전 검토 `pending` — 출시 차단) | [문서] D-094, `docs/ROADMAP.md` 제한 MVP 릴리스 |
| 앱 뼈대 `app/`(커밋 전) | 파일 102개. 줄 수: worker 847, client 3,719, shared 163, migrations 52(0001 auth_failures·0002 sessions·0003 owner_settings·0004 client_errors), scripts 504, test 3,475(자동 생성 `worker-configuration.d.ts` 16,269줄은 뺌). 있는 것: 접근 열쇠 로그인·서버 세션 기록·앱 잠금(서버 확인)·부를 이름·해시 주소 화면 이동·새 버전 알림·개발용 화면 오류 보고. 없는 것: 일기 저장·달력·통계·디자인 이식 | [명령] `find app …`, `wc -l`, `ls app/migrations` / [문서] STATUS §1·§6, work-graph app-scaffold 주석 |
| 앱 시험 | 22개 파일, 241건 통과(28.6초) | [명령] `npx vitest run`(2026-10-14 이 세션) |
| 개발용 건물 | Cloudflare Worker + D1 `emotion-diary-dev`(무료, 가짜 데이터만, 원격 검사 34/34). 운영 건물은 이름만 있고 만들지 않음. 스파이크 Worker·D1은 2026-10-14 지움 | [문서] `harness/runtime-profile.json` hosting, `tasks/mobile/2026-10-14-t3/PLAN.md` 5·6단계, STATUS §6 |
| AI 경로 실험 | 본인 PC worker가 작업 큐를 가져가 `claude -p`(구독 로그인)로 처리. 지연 p50 10.8초·p95 13.1초, 위기 문장 17~38초. B-06 보류 2건(거절 응답 실제 재현 못 함, 구독 한도 비율 계산 못 함) | [문서] runtime-profile model_access, STATUS §3 |
| 검사 장치 | `node scripts/verify.mjs --mode quick|full`, GitHub Actions(Ubuntu·Windows: `npm ci` → quick → full), Claude Code 훅 셋(커밋 확인·소유 파일 확인·Stop 때 quick) | [문서] runtime-profile ci, `.claude/settings.json` |

## B. 단계와 노드 상태

| 노드 | 상태 | 게이트 | 출처 |
| --- | --- | --- | --- |
| bootstrap-audit | done | bootstrap-facts | `harness/work-graph.yaml` |
| hosting-identity-spike | done(2026-10-14) | security-foundation(B-02·B-03·B-08) | 같은 파일 |
| data-store-spike | done(2026-10-14) | data-contract(B-04·B-05) | 같은 파일 |
| model-access-spike | verifying(B-06 보류 2건) | model-access | 같은 파일 |
| vector-search-spike | blocked | retrieval-contract(B-07) | 같은 파일 |
| app-scaffold | done(2026-10-14, 커밋 전) | code-quality | 같은 파일 |
| data-foundation | ready | data-integrity(F-01·02·06·07·09·10·14·15) | 같은 파일, `harness/quality-gates.yaml` node_gates |
| taxonomy-v1 · taxonomy-v2-research | done(2026-09-04·05) | source-fidelity · taxonomy-evidence | work-graph |
| direct-journal | blocked | core-product(F-03·04·05·07·08, mobile-core-flow, accessibility-core-flow) | work-graph, quality-gates |
| dashboard-reminder | blocked | reflection-core | work-graph |
| limited-mvp-release | blocked | limited-release(full, browser-e2e, mobile-real-device, security-and-privacy, deployment-boundary-review, blocker-0, high-0, ai-paths-disabled-or-verified) | work-graph, quality-gates |
| ai-journal · evidence-pipeline · rag-analysis · release-candidate | blocked | journal-ai · evidence-quality · ai-safety · release | work-graph |

- 순서(간선): app-scaffold → data-foundation → direct-journal(+taxonomy 둘) → dashboard-reminder → limited-mvp-release. AI 쪽은 model-access-spike → vector-search-spike → evidence-pipeline → rag-analysis(+dashboard-reminder), ai-journal은 direct-journal + model-access-spike. [문서] work-graph edges
- `mobile-core-flow` 게이트 정의: iPhone 홈 화면 웹앱·iPhone Safari·**Android Chrome** 실기기에서 작성·저장·수정·삭제·내보내기. [문서] `docs/EVAL_PLAN.md` §14(346행)
- 출시 게이트의 `browser-e2e`는 `command: null`(도구 미선택), `mobile-real-device`·`security-and-privacy`는 `pending`. [문서] quality-gates release 절
- loop-state: `task_id` TASK-MOBILE, phase `t3-done-awaiting-commit`, `next_node` data-foundation, `last_verified_commit` 7b99e2c. blockers 7개(커밋 대기, 미룬 실기기 확인, S-07 배치 결정, 스파이크 자원 삭제, mobile-core-flow의 Android, B-06 보류, 본인 1명 범위). [문서] `harness/loop-state.json`
- STATUS §1: Phase 0 끝남, 시안 QA 마감, Phase 1 진행 중(app-scaffold 끝, 다음 data-foundation), Phase 2·4·제한 MVP 대기, Phase 3·5 후행. [문서] `docs/STATUS.md` §1
- STATUS §4 다음 할 일(요지): ① 시안의 기기·사람 확인 ② 디자인 시스템 잔여 실행 항목(+출시 전 별도 동의·AI 고지) ③④ 끝남 ⑤ data-foundation(+T3에서 넘어온 사용자 결정·확인 다섯) ⑥ direct-journal → dashboard-reminder → 제한 MVP ⑦ AI·RAG. [문서] STATUS §4
- 다른 미완 작업: TASK-HOOK-AUTO는 2026-09-21부터 '다른 세션에서 사용자 확인 대기'로 `in_progress`. [문서] `tasks/CURRENT_TASK.md` 표·절

## C. 결정 목록

- `docs/DECISIONS.md`: 153줄·244,786바이트, 결정 115건 — accepted 102, superseded 7, provisional 6(D-007·D-008·D-011·D-059·D-066·D-099). [명령] 스크래치 `decisions.mjs`로 표 행을 셈
- 사용자/에이전트 표기는 상태·근거 칸의 글자로 읽었다(자동 추정이라 표식이 없는 행은 '미표기'). 아래는 이 점검에 직접 걸리는 것만:

| ID | 요지 | 상태 칸의 결정 주체 표기 |
| --- | --- | --- |
| D-018 | 직접 작성+결정론 대시보드의 제한 MVP 먼저, AI·RAG 후행 | 사용자 결정 |
| D-019 | 유료 API 없음, 구독 자원으로 되는 AI 경로만 | 사용자 결정 |
| D-021 | 호스팅 대안은 무료 옵션만 | 사용자 결정 |
| D-024 | D1에서 interactive transaction을 전제하지 않음(조건부 UPDATE·CHECK·trigger·batch) | 미표기 |
| D-025 | CSRF는 custom header + Origin/Sec-Fetch-Site | 미표기 |
| D-029 | AI 모델 경로 = 본인 PC의 `claude -p` 구독 로그인 | 사용자 결정 |
| D-031 | 작성 보조 Sonnet 5, 검증·분석 Opus 5 | 미표기 |
| D-032 | 직접 쓴 백엔드 + 무료 클라우드(Workers·D1). Pages 분리 부분은 D-111이 교정 | 사용자 결정 |
| D-047 | 시안은 의존성·빌드 없는 정적 파일, Phase 2에서 구조만 옮기고 코드는 버림 | 사용자 결정 |
| D-087 | 쓰기 작업자 병렬 절차(AGENT_WORKFLOW §10) | 사용자 결정 |
| D-108 | 판정은 본인 1명 전제, 공개 여부는 미룸 | 사용자 결정 + 에이전트 세부 |
| D-109 | 백업 = Time Travel 7일 + 본인 PC 하루 1번·30일 | 30일·주기는 사용자, 나머지 에이전트 |
| D-110 | 구독 모델 경로의 운영 조건 | ①은 사용자, ②~⑥은 스파이크 결과에 따른 구현 |
| D-111 | 설치형 홈 화면 웹앱 + Worker 하나(화면과 /api/* 같은 주소) | 사용자 결정 |
| D-112 | 로그인 30일·앱 잠금 서버 확인·입구 화면·전체 삭제 | 굵은 글 ①~⑪ 사용자, 나머지 에이전트 |
| D-113 | 앱 전환 화면 모두 가림, 화면 오류는 개발용에서만 | 굵은 글 ①② 사용자, 나머지 에이전트 |
| D-114 | 화면은 도구(프레임워크) 없이 TypeScript, 빌드 Vite, 해시 주소 | 굵은 글(도구 없이)은 사용자, 세부는 에이전트 |
| D-115 | 뼈대 구성(설정에 계정 id 안 둠, 개발/운영 분리, 정확한 판 고정 등) | 에이전트 결정 |

## D. 기술 스택의 현재 값

| 층 | 값 | 출처 |
| --- | --- | --- |
| 런타임·도구 | Node 22.16.0, npm 10.9.2(잠금 파일은 npm 11로 씀), TypeScript 6.0.3, Vite 8.3.3, wrangler 4.148.0, vitest 5.0.3, Biome 2.5.15, happy-dom 20.14.6, sharp ^0.35.4, @types/node 22.20.5 — 정확한 판 고정 | [문서] `package.json` devDependencies, runtime-profile runtime |
| 서버 | Cloudflare Worker 하나, `compatibility_date` 2026-06-01, Static Assets(`not_found_handling: single-page-application`, `run_worker_first: ["/api/*"]`), 환경 local·dev·prod, 비밀값 4개(ACCESS_KEY_HASH·ACCESS_KEY_SALT·SESSION_SECRET·APP_LOCK_SECRET), 프레임워크 없이 직접 쓴 경로 표(`app/worker/src/router.ts`) | [문서] `wrangler.jsonc`, `ls app/worker/src` |
| DB | Cloudflare D1(SQLite 호환), 마이그레이션 `app/migrations`, 지역 APAC·AES-256, Time Travel 7일 | [문서] wrangler.jsonc, runtime-profile storage |
| 화면 | 프레임워크 없음 — TypeScript + DOM, Vite 번들, 해시 주소, service worker·오프라인 없음 | [문서] runtime-profile framework, D-111·D-114 |
| 인증 | 접근 열쇠 → HttpOnly cookie, 서버 세션 기록(D1), 30일 연장, 틀린 열쇠 D1 전역 잠금(60초 10번 → 5분), 앱 잠금 비밀번호 서버 확인(423 `app_locked`), Cloudflare Access 미사용 | [문서] STATUS §2, D-112, runtime-profile hosting |
| AI | 본인 PC worker + `claude -p --output-format json --json-schema --tools "" --max-turns 1 --no-session-persistence`(Claude Code 2.1.237, 구독 로그인), 앱에는 아직 없음 | [문서] runtime-profile model_access |
| 근거 검색 | Evidence Store 미선택, 유료 Vector Store 제외(D-019) | [문서] runtime-profile storage.evidence_store |
| 검사 | `npm run lint`(Biome, 경고도 실패), `typecheck`(wrangler types --check + tsc 셋), `test`(검사기 자체 시험 다섯 + vitest: 서버는 Node + 로컬 D1, 화면은 happy-dom), `build`(dev·prod 두 벌 + 운영 묶음에 개발용 표식 0 검사), e2e 없음(null) | [문서] package.json scripts, runtime-profile commands |
| 배포 | `node app/scripts/cf.mjs <env> …`가 이름으로 D1 id를 찾아 Git 제외 설정을 만든 뒤 wrangler 실행, 절차 `docs/DEPLOY.md`(만들기·올리기·확인·열쇠 바꾸기·되돌리기·운영 때 더할 것) | [문서] wrangler.jsonc 머리 주석, DEPLOY 목차 |
| 무료 한도 | Workers 하루 10만 요청·CPU 10ms, 정적 파일 요청 무료, D1 하루 읽기 500만 행·쓰기 10만 행·DB당 500MB·DB 10개·호출당 질의 50건 | [문서] runtime-profile free_tier_limits_confirmed(공식 문서 2026-10-13 확인으로 적힘) |
| 서버 시험의 한계 | 서버 시험은 Workers 런타임이 아니라 Node에서 돈다 — 차이는 개발용 건물 원격 검사가 메운다고 적혀 있다 | [문서] STATUS §6, ARCHITECTURE §11.8 |

## E. 확인된 것 / 미검증

스파이크 게이트(본인 1명·Worker 하나 전제) — [문서] STATUS §3:

| 게이트 | 판정 | 요지 |
| --- | --- | --- |
| B-01 | pass | Node 22, Git baseline, 하네스 |
| B-02 | pass | 열쇠 401, cookie 왕복, D1 잠금, iPhone 본체·홈 화면 앱 로그인 유지, Access는 문서로만 |
| B-03 | pass | 비밀값 0건(코드·정적·설정·로그·Git 이력), 표식 있음 200/없음 403 |
| B-04 | pass | 원격 batch 되돌림, 동시 요청 하나만 성공, 무료 한도 수치 |
| B-05 | pass | Time Travel 복구 실습, 백업 절차 문서화(구현은 아직) |
| B-06 | 보류 2건 | 위 A절 |
| B-07 | unknown | 미착수 |
| B-08 | pass(iPhone) | Android 미확인 |

실기기 항목 — [문서] `docs/EVAL_PLAN.md` §4 S표, `tasks/mobile/2026-10-14-t3/PLAN.md` 6-3:

| 항목 | 연습용(스파이크) | 실제 앱 뼈대(개발용 건물) |
| --- | --- | --- |
| S-00 Safari 본체 로그인·저장·거부 | PASS | — |
| S-01 홈 화면 앱 모드 | PASS | PASS(2026-10-14 22:32) |
| S-02 닫았다 열어도 로그인 유지 | PASS | PASS |
| S-03 12시간 뒤 로그인 | PASS(사용자 보고, 캡처 없음) | 미검증 |
| S-04 표식 있음 성공/없음 거부 | PASS | 성공 쪽 PASS, 거부 쪽은 원격 검사 |
| S-05 내보내기 | 공유 창만 PASS | — |
| S-06 5분·30분 떠났다 오기 | 미검증 | 미검증 |
| S-07 자판과 아래 고정 버튼 | 미검증 | **가려진다**(사실상 FAIL) |
| S-08 왼쪽 끝 밀기 뒤로 | 된다(사용자, 캡처 없음) | 미검증 |
| S-09 바깥 링크 돌아오기 | 된다, 그 구간에 화면이 두 번 통째로 새로 열림(RK-034) | — |
| S-10 '웹 앱으로 열기' 끔 · S-11 아이콘 다시 추가 | 미검증 | 미검증 |
| S-12 화면·서버 기록에 글·열쇠 0건 | 서버 쪽 PASS | 화면 쪽 PASS |
| T-01~T-07(잠금 시점·시작 잠금·앱 전환 가림·암호 보관함·새 버전 띠·시트 밀기·로그인 풀림 복귀) | — | 전부 미검증(사용자 결정 '전부 미룬다', 대신 화면·서버 시험이 근거로 적힘) |

- 기능 평가 F표: F-22·F-23·F-25~F-28이 뼈대의 자동 시험으로 있고(F-22·F-23의 작성·전체 삭제 줄은 data-foundation 몫), F-01~F-21·F-24는 일기 저장이 없어 아직 해당 코드가 없다. [문서] `tasks/CURRENT_TASK.md` TASK-MOBILE 인수 조건, EVAL_PLAN §5
- 보지 않은 것: Android Chrome, 화면 낭독기(VoiceOver), 암호 보관함 자동 입력, Pages 분리 구성, 여러 사용자. [문서] runtime-profile unknowns, STATUS §6
- 결함 주입: 서버 결함 7종을 시험이 모두 잡았다고 적혀 있다. [문서] `tasks/CURRENT_TASK.md` TASK-MOBILE 인수 조건 '계약 검사'
- CI는 앱 코드를 아직 돌려 보지 않았다(커밋 전). [문서] STATUS §6, ROADMAP Phase 1 진행

## F. 위험(열린 것)

[문서] `docs/RISK_REGISTER.md`(53줄·28,834바이트) — 39건 중 closed 1(RK-007), accepted(사용자 인지) 2(RK-017·RK-018), 나머지 36건 open(일부 '부분 완화'·'진행 중' 표기).

| ID | 확률/영향 | 위험(요지) |
| --- | --- | --- |
| RK-001 | m/h | 접근 열쇠 하나에 기대는 공개 주소의 경계 |
| RK-002 | l/h | 열쇠·worker 비밀값 유출 |
| RK-003 | m/h | D1 계약·마이그레이션·무료 한도 |
| RK-004 | h/m | 홈 화면 웹앱의 Web Push·백그라운드 |
| RK-005 · RK-006 | h/h · m/h | 근거 자료 부족 · RAG의 무근거·진단 문장 |
| RK-008 | m/h | 일기 원문이 로그·API 보존·Vector Store로 유출 |
| RK-009 | h/m | AI 지연(p95 12초대 관측, 목표 8초 초과) |
| RK-010 | m/m | Workers 런타임 제약 |
| RK-011 | m/m | Claude/Codex 지침 분기·동시 writer(부분 완화, Bash 경유 쓰기 미완화, auto에선 소유 파일 확인 꺼짐) |
| RK-012 · RK-013 | m/h · h/m | AI 평가 세트가 좁음 · Claude Code CLI 동작 변경 |
| RK-014 · RK-015 | m/h · m/h | 임상·위기 서비스로 오해 · hard delete와 백업 보존 불일치 |
| RK-016 | m/m | 구독 경로가 보존·verifier·지연·한도를 못 맞춤 |
| RK-017 | m/h(accepted) | 구독 자격 증명으로 `claude -p` 호출의 정책 회색지대 |
| RK-018 | h/l(accepted) | PC가 꺼지면 AI 없음 |
| RK-019 | m/h | 작업 큐·worker 디스크에 일기 발췌가 남음 |
| RK-020~RK-030 | m/m~m/h | 디자인·문구가 감정을 판정·평가·보상·순위로 읽히는 위험, 웹폰트 크기, 색 대비, 겹침, 눈부심, 편지 넘침 등 |
| RK-031 · RK-032 · RK-033 | m/m | 하루 기준 시각 혼동 · 지난 날 못 쓰는 제약 · 탭 한정 임시 보관 오해 |
| RK-034 | h/h | 홈 화면 앱이 통째로 새로 열려 쓰던 글이 사라짐 |
| RK-035 | m/m | 구독 로그인 경로 끊김(만료, `--bare` 기본값 변경 예고) |
| RK-036 | h/m | Mac 없이 iPhone 화면 속 오류를 볼 수 없음 |
| RK-037 · RK-038 | m/l · m/m | 옛 화면 코드가 새 서버를 부름 · 로그인·저장 공간이 일찍 사라짐 |
| RK-039 | m/h | 앱 전환 화면에 일기가 비침(덮개가 늦거나 신호가 안 옴) |

## G. 이슈·PR

- 이슈 27개: #1~#9 OPEN(전부 `[TASK-MOBILE]`, 2026-09-03 생성 — #1 모바일 방식 결정 기록, #2 B-08 실기기 스파이크, #3 Mac 없는 디버깅, #4 세션·재인증 UX 명세, #5 standalone 개인정보 규칙, #6 검증 게이트 정리, #7 개발/운영 분리와 갱신 감지, #8 Phase 1 뼈대 모바일 명세, #9 Web Push 스파이크(Post-MVP)). #10~#27 CLOSED. [명령] `gh issue list --state all`
- PR #28~#36 모두 병합(2026-09-19 ~ 2026-10-14). 마지막은 #36(T2, 2026-10-14). [명령] `gh pr list --state all`

## H. 작업 기록의 규모

- 커밋 83개. 날짜별: 09-02 11, 09-03 4, 09-04 26, 09-05 4, 09-07 2, 09-10 1, 09-17 1, 09-19 1, 09-20 9, 09-25 4, 09-26 7, 09-27 6, 10-13 3, 10-14 4. [명령] `git log`
- 커밋 전 변경: 추적 파일 24개 +2,920/−431줄, 미추적 15개 항목(`app/`, 설정 파일 8개, `docs/DEPLOY.md`, `tasks/` 일부, `.playwright-cli/`, `output/playwright/`). [명령] `git diff --stat HEAD`, `git status --short`
- `docs/` 문서 18개. 큰 순서(바이트): DECISIONS 244,786 · DESIGN_SYSTEM 147,048 · UX_SPEC 114,525 · DESIGN_RATIONALE 111,724 · ARCHITECTURE 65,456 · PROCESS_LOG 58,882 · EVAL_PLAN 43,895 · SERVICE_WHY 41,379 · DATA_MODEL 36,928 · RISK_REGISTER 28,834 · TRACEABILITY 28,393 · STATUS 24,595 · PRD 23,933. 측정한 MD·하네스 파일 합계 약 1.4MB. [명령] `wc -c`
- `tasks/` 날짜 폴더 5개(qa/2026-10-13, spike/2026-10-13, mobile/2026-10-14, mobile/2026-10-14-t3, review/2026-10-14). PLAN 크기: T3 82,755 · spike 59,054 · T2 35,879 · qa 13,656바이트. [명령] `find tasks …`, `wc -c`
- `scripts/*.mjs` 합계 4,196줄. [명령] `wc -l`

## I. 작업 방식의 정본

- `AGENTS.md`(94줄): 시작 때 SERVICE_WHY 전문 읽기, 한 작업 = 하나의 CURRENT_TASK, 한 파일 한 writer, 조사·검증자는 읽기 전용, 커밋은 사용자 지시 때만(하위 에이전트는 절대 안 함), 소유 파일 선언, 결정은 DECISIONS에, 계약 변경 시 DATA_MODEL·ARCHITECTURE·EVAL_PLAN·TRACEABILITY 동기화, 검증 루프(quick → 검토 → full), 같은 가설 두 번 실패하면 폐기. Codex 쪽 훅은 미구성(§2.3). [문서] AGENTS §1~§6
- `docs/AGENT_WORKFLOW.md`(228줄): 표준 루프(Intake→Orient→Plan→Implement→Verify→Close), 역할과 격리(§5), 하네스 계약(§6), 체크포인트 형식(§7), Codebase Memory(§9), 오케스트레이터-워커 병렬(§10, D-087 — 메인이 다시 재고, 재작업 두 번까지, 마감 검토는 새 맥락). [명령] `grep '^#'`
- 훅(`.claude/settings.json`): PreToolUse Bash → `claude-git-guard.mjs`(커밋·푸시 확인, auto의 주 에이전트는 통과), Write|Edit → `claude-scope-guard.mjs`(소유 파일 밖 쓰기 확인, auto에서는 꺼짐), Stop → `claude-stop-hook.mjs`(매번 verify quick, 두 번째 실패면 멈춤 허용). 기본 권한 모드 default. 하위 에이전트 정의 `researcher`·`verifier`(읽기 전용). [명령] `cat .claude/settings.json`, `ls .claude/agents`, `head scripts/claude-stop-hook.mjs`
- `harness/README.md`: work-graph·quality-gates·loop-state·runtime-profile의 역할, `check-harness.mjs`가 quick에서 상태 모순·명령 슬롯·schema·style-guide 색 어긋남을 FAIL, 신선도는 WARN. 배경: 2026-09-03부터 16일 동안 규칙이 안 지켜졌는데 하네스는 PASS였다. [문서] harness/README '어긋남 검사'
- 흐름(2026-10-13부터): 날짜별 요청 MD → 질문으로 빈 곳 확정 → 계획 MD(체크리스트이자 유일한 진행 기록) → 하나씩 → 새 맥락 검토자 → full. [사용자] `tasks/qa/2026-10-13/REQUESTS.md` W2, `tasks/mobile/2026-10-14/REQUESTS.md` '일하는 순서'
- 결과 기록: `docs/PROCESS_LOG.md` 4개 장(taxonomy 리서치, 커밋 권한 훅, 소유 파일 훅·worktree 재검토, 인프라 정비 '만들어 놓고 아무도 보지 않던 장치들'). [명령] `grep '^#' docs/PROCESS_LOG.md`

## J. 사용자가 짚은 불편·요청(원문 위치)

- 근거: 디자인·문구 제안은 학계 공통으로 인정되는 심리학 근거만(W1), 토큰은 최소로 효과는 최대로(W3). [사용자] `tasks/qa/2026-10-13/REQUESTS.md` '작업 방식'
- 성공 기준은 "문서를 고쳤다"가 아니라 "문서만 읽고도 틀리지 않게 지을 수 있다". [사용자] `tasks/mobile/2026-10-14/REQUESTS.md` '왜 하는가'
- 지난 작업에서 틀렸던 것(되풀이 금지): 확인하지 않은 것을 통과로 적음, 선택지 설명을 사용자 결정으로 적음, 답을 끝에 몰아 적다 빠뜨림, 같은 숫자가 문서마다 다름, 스크립트로 여러 파일을 한꺼번에 고침. [사용자] 같은 파일 '지난 작업에서 틀렸던 것'
- 사용자는 개발 용어를 모른다 — 비유로 설명. "과금해야해?" 질문. [사용자] `tasks/spike/2026-10-13/REQUESTS.md` '진행 방식'·'진행 중에 나온 질문'
- 실기기 확인 부담: "근데 이런 테스트 내가 다 해야되냐? 너가 하면 되잖아" → 남은 휴대폰 확인을 '전부 미룬다'. [사용자] `tasks/mobile/2026-10-14-t3/REQUESTS.md` '휴대폰 확인 범위'
- 개발용 임시 열쇠를 채팅으로 보내 달라고 요청("열쇠 보내. 복붙하게") — 계획의 '채팅에 쓰지 않는다'와 다르게 사용자가 직접 요청. [사용자] 같은 파일 '열쇠 전달'
- "말은 쉽게, 실제 작업은 최고의 현업 엔지니어 수준으로". [사용자] `tasks/review/2026-10-14/REQUESTS.md`

## K. 불일치(고치지 않음 — 보고서에서 다룬다)

| # | 무엇 | 한쪽 | 다른 쪽 |
| --- | --- | --- | --- |
| K-1 | 앱 시험 수 | `harness/work-graph.yaml` app-scaffold 주석·`harness/loop-state.json` last_checkpoint·`docs/STATUS.md` §1: 238건 | `tasks/CURRENT_TASK.md` TASK-MOBILE 인수 조건·체크포인트: 241건, 이 세션의 `npx vitest run`: 241건 |
| K-2 | 스파이크 자원 | runtime-profile hosting.account_or_project_exists: 2026-10-14 DELETED | 같은 칸 뒤쪽 이력 문장: "the Worker and D1 remain in the account" |
| K-3 | 자판과 아래 버튼(S-07) | runtime-profile phone_access_confirmed·unknowns: "keyboard vs bottom bar" 미검증(last_synced는 T2), `PRD.md` §4 끝 줄: "자판이 아래 버튼을 가리는지" 미검증 | T3 PLAN 6-3·STATUS §3 끝·EVAL §4: 실제 앱에서 '가려진다' |
| K-4 | 지난 날 쓰기 | `docs/ROADMAP.md` Phase 2 항목: "autosave, 복구, 완료조건, backdating" | D-082: 새 기록은 그날만(소급 작성 허용 대체) |
| K-5 | B-06 남은 검증 | ROADMAP Phase 0 G2c: 큐 왕복·보존 설정·독립 verifier·p95·한도·위기 케이스가 '남은 검증' | STATUS §3 B-06: 보류 2건(거절 재현·한도 비율)만 남음 |
| K-6 | TASK-MOBILE 이슈 | GitHub #1~#9 OPEN, #1 제목 '결정 기록(D-038)', #2 'B-08 실기기 스파이크' | 결정은 D-111(2026-10-14), B-08 pass(STATUS §3), T2·T3에서 #4·#5·#7·#8 내용 상당 부분 정본 반영(STATUS §4 4·5) |
| K-7 | app-scaffold의 'CI' | ROADMAP Phase 1 첫 줄 "앱 scaffold와 CI", work-graph app-scaffold `done` | STATUS §6·ROADMAP 진행 줄: CI는 앱 코드를 아직 돌려 보지 않았다(커밋 전) |
| K-8 | 직접 작성 게이트의 Android | EVAL §14 `mobile-core-flow`가 Android Chrome 실기기를 요구 | 사용자에게 Android 기기가 없다(REQUESTS) — 게이트 변경은 사용자 결정으로 남음(loop-state blockers) |
| K-9 | TASK-HOOK-AUTO | CURRENT_TASK 표·절: `in_progress`(다른 세션 사용자 확인 대기, 2026-09-21) | 그 뒤 24일·작업 여럿이 지나갔고 같은 확인 기록 없음 |
