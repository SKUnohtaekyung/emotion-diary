# 기술·제품 결정 기록

## 사용법

각 결정은 `accepted | provisional | superseded | rejected` 상태를 가진다. 제품 핵심 변경, 개인정보 위험 확대, 외부 배포/비용은 사용자 승인이 필요하다. SDK 이름·호스팅 가능성처럼 변할 수 있는 것은 `provisional`로 두고 새 프로젝트 부트스트랩에서 검증한다.

## 결정 목록

| ID | 상태 | 결정 | 근거·영향 | 재검토 조건 |
| --- | --- | --- | --- | --- |
| D-001 | accepted | 원형 일기 6개 영역을 저장 구조에서 보존한다 | 사용자 제공 template이 제품 원형 | 사용자 요구 변경 |
| D-002 | accepted | owner별 local date당 diary 하나, 소급 작성 허용 | 하루 습관과 과거 기록 모두 지원 | 다중 기록 요구 발생 |
| D-003 | accepted | 사건+세부감정 1개+각 강도+이유가 완료 필수; 칭찬/감사는 선택 | 낮은 작성 마찰과 원형 보존 균형 | 사용자 검증 결과 |
| D-004 | accepted | 직접 작성이 우선 흐름, AI 대화는 동일 schema의 보조 흐름 | AI 실패에도 핵심 기능 유지 | 없음 |
| D-005 | accepted | 감정·강도 최종값은 사용자가 선택한다 | AI의 과도한 심리 판정 방지 | 없음 |
| D-006 | superseded | MVP는 제한 공유된 단일 사용자 ChatGPT Site와 D1을 후보로 한다 | 초기 사용자 1명, 운영 복잡성 최소화. 2026-09-02 D-030(본인 PC 자체 호스팅+SQLite)으로 대체 | — |
| D-007 | provisional | Supabase/별도 agent framework는 MVP 기본 의존성에서 제외한다 | 아직 필요성이 입증되지 않음 | Sites 저장/권한/RAG 확장 한계 |
| D-008 | provisional | 앱이 Vector Store search를 직접 호출하고, MVP는 Evidence Card 1개=검색 파일 1개 | 자율 검색 억제와 file-level filter 제약 대응 | 현재 API/검색 품질 스파이크 |
| D-009 | accepted | 개인 일기 원문을 Psychology Evidence Vector Store에 넣지 않는다 | 민감정보 분리와 retrieval 오염 방지 | 완화 불가 |
| D-010 | accepted | STT와 실시간 음성은 MVP에서 제외한다 | 권한·비용·정확성·안전 복잡성 | post-MVP 별도 승인 |
| D-011 | provisional | background push는 검증 전 약속하지 않고 인앱 reminder를 fallback으로 한다 | Sites/background 지원 불확실 | 런타임·모바일 스파이크 통과 |
| D-012 | accepted | diary 삭제는 확인 후 hard delete, export는 versioned UTF-8 JSON | 개인 도구의 명확한 사용자 통제 | 복구 기능 요구 발생 |
| D-013 | accepted | 현재 제품/후보 hosting은 PHI·임상 기록 처리 용도가 아니다 | 규제·호스팅 적합성 미확보 | 별도 법률/보안 프로젝트 |
| D-014 | accepted | `AGENTS.md`를 공용 계약으로 하고 Claude는 `CLAUDE.md`에서 import한다 | 중복 규칙 drift 방지 | 도구 동작 변경 |
| D-015 | accepted | 한 파일에 동시에 한 writer만 두고 조사/검증 역할은 읽기 전용으로 시작한다 | 병합 충돌과 자기검증 편향 감소 | 격리된 worktree+소유권 확보 |
| D-016 | accepted | 계획의 기술 결함은 증거·영향·대안·검증을 기록해 수정할 수 있다 | 잘못된 초기 가설의 고착 방지 | 제품 핵심/위험 허용 변경이면 사용자 승인 |
| D-017 | accepted | 기존 `.git`을 삭제하고 현 계정에서 `git init -b main` 후 baseline commit으로 저장소를 재확립한다 | 2026-09-02 사용자 승인. 기존 `.git`은 커밋 0·스태시 0·다른 계정 소유로 보존 가치 없음(결함 I-01). baseline commit `32e68c8` | 없음 |
| D-018 | accepted | 직접 작성+결정론적 대시보드의 **제한 MVP**를 먼저 배포하고 AI 대화 작성·RAG 분석은 후행 단계로 분리한다 | 2026-09-02 사용자 결정. AI/RAG 미확정이 핵심 기록 기능 출시를 막지 않게 함. work-graph에 `limited-mvp-release` 노드를 두고 `release-candidate`는 그 뒤에 온다 | 사용자 요구 변경 |
| D-019 | accepted | OpenAI API 등 **유료 API를 사용하지 않는다**. AI 기능은 사용자가 구독 중인 Codex/Claude 자원으로 가능한 경로만 검증하고(B-06을 "구독 기반 모델 호출 경로 확인"으로 재정의), 경로가 확인되지 않으면 AI 대화·RAG를 보류한 채 제한 MVP만 진행한다 | 2026-09-02 사용자 결정. 과금 자원 생성·유료 호출 금지. `.env.example`의 `OPENAI_API_KEY`는 사용하지 않음. 위험 RK-016 | 사용자가 유료 자원을 별도 승인 |
| D-020 | accepted | 위기 리소스 기준 국가는 **한국**. 위기 감지는 AI 관여 경로(AI 대화 작성, 사용자가 명시 요청한 분석)에서만 수행하고, 직접 작성 원문은 자동 스캔하지 않으며 그 한계를 사용자에게 고지한다 | 2026-09-02 사용자가 국가를 확정, 감지 범위는 권고안을 기본값으로 채택(결함 I-02). 원문 자동 스캔은 개인정보·오탐 위험이 크고 제품이 위기 서비스가 아님 | 사용자 이의 제기, 임상/안전 검토 결과 |
| D-021 | accepted | Sites 후보가 실패하면 hosting 대안은 **무료 옵션으로만** 제한한다 | 2026-09-02 사용자 결정. D-019의 비용 금지와 일관 | 사용자가 유료 hosting 승인 |
| D-022 | accepted | `emotion_code`는 카테고리별로 독립 발급한다(`<category_code>-<slug>` 형식). 카테고리 간 같은 한글 label은 서로 다른 code이며 label 중복 자체는 허용한다 | 결함 I-06: 원자료에 카테고리 간 중복 label 최소 7건(가벼운·흐뭇한·뿌듯한·포근한·고통스러운·구역질나는·황량한). `UNIQUE(diary_id, emotion_code)`와 category 교차 검증은 유지 | taxonomy-v1 검수 결과 |
| D-023 | accepted | completed 기록을 편집하는 동안에도 `status`는 completed를 유지한다. 사용자의 명시적 "완료 취소"만 draft로 되돌리며, 편집 저장은 완료조건을 다시 검사해 미충족이면 저장을 거부한다 | 결함 I-05: DATA_MODEL §5 상태도가 PRD §8/UX §7과 모순. 편집마다 draft로 내려가면 통계·streak·분석 stale 의미가 흔들림 | 없음 |
| D-024 | accepted | D1 후보에서 interactive transaction을 전제하지 않는다. 완료 전환은 조건을 포함한 **단일 조건부 UPDATE**, 강도 범위는 `CHECK`, 완료 후 불변조건은 trigger 또는 조건부 statement, cascade 삭제는 원자적 batch로 보장한다 | 결함 I-04: DATA_MODEL "transaction 안에서" 서술이 D1 후보와 불일치하고 완료 검사에 TOCTOU 창이 있음. 실제 D1 batch/trigger 지원은 B-04에서 검증 | B-04 결과, DB 교체 |
| D-025 | accepted | 변경 API의 CSRF 방어는 **custom header 필수**(`X-Requested-With: emotion-diary` 등 서버가 정한 값)+`Origin`/`Sec-Fetch-Site` 검사로 확정한다. 단일 사용자 배포의 `owner_key`는 서버 상수에만 의존하지 않고 런타임 identity(헤더/세션)를 서버 허용 목록과 대조하는 defense-in-depth를 필수로 한다 | 결함 I-03: 서버 상수 owner_key가 단일 장애점이며 CSRF 방식 미정. 실제 identity 헤더 유무는 B-02에서 확인 | B-02/B-03 결과, 다중 사용자 전환 |
| D-026 | accepted | Claim–Evidence semantic Verifier는 "가능하면"이 아니라 **필수 독립 실행**이다. Quality Filter 항목은 code 검사와 LLM 판정으로 구분 표기하고, `observations`는 허용된 stat 필드·값과 코드로 대조해 자유 서술 유출을 막는다 | 결함 I-07. 독립 호출이 구독 기반 경로(D-019)에서 불가능하면 RAG 분석 자체를 보류 | 구독 기반 경로 확인 결과 |
| D-027 | accepted | 1인 제품에서는 reviewer 2인 요구를 **시간 분리 2회 검수**(초안 검수 후 24시간 이상 지나 원본 이미지와 재대조, 두 기록 보존) 또는 사용자 최종 대조로 대체한다. Recall/Precision 등 retrieval 지표는 "고정셋 기준"임을 표기한다 | 결함 I-08: reviewer 2인 요구가 1인 제품과 충돌 | 협업자/외부 reviewer 확보 |
| D-028 | accepted | Codebase Memory는 프로젝트 한정 MCP와 동일 사용자 cache를 공유하는 탐색 보조로 사용한다. 구조 탐색은 Graph→후보→source, 최종 정본은 working tree·실행 결과다 | 2026-09-02 사용자 통합 요청. 전역 설정 재작성을 피하려 v0.10.8 binary-only 설치를 선택; 기존 MCP 목록과 프로젝트 hooks/source 보존은 확인했으나 전역 파일 3개의 byte 동일성은 미확인. full/manual index와 기존 watcher 설정 사용. 실제 Graph의 누락·오연결에 source 검증과 fallback 필수화. 상세 운영은 AGENT_WORKFLOW §9, 검증은 CURRENT_TASK | binary 업데이트, 앱 scaffold/새 확장자, root 이동, index 품질/비용 변화 |
| D-029 | accepted | AI 기능의 모델 접근 경로는 **본인 PC의 Claude Code CLI 헤드리스 모드(`claude -p --output-format json --json-schema`)**를 사용자의 Claude 구독 로그인으로 호출하는 것으로 한다. Agent SDK·API 키·Managed Agents는 유료 종량제이므로 사용하지 않는다. 이 제품은 **사용자 본인 1명만 쓰는 개인 도구**이며 다중 사용자·타인 제공으로 확장하지 않는다 | 2026-09-02 사용자 확인("나 혼자 쓰는 거야"). 공식 문서: Agent SDK는 "third party developers ... claude.ai login or rate limits for their products" 제공 금지+API 키 요구; Claude Code CLI는 Pro/Max 구독 로그인 지원, `claude setup-token`은 "CI pipelines, scripts"용 구독 토큰. 개인 단일 사용자 도구가 위 금지 문구에 해당하는지는 문서에 명시되지 않아 **정책 회색지대**로 기록. B-06 최소 스파이크(2026-09-02, 합성 입력): API 키 없이 구독 자격 증명으로 `claude -p` 실행 PASS, strict schema 출력 필수 키 6개 일치, 감정 미확정·사건 미창작·열린 질문 1개, `safetySignal=none`, 벽시계 15초(API 8.5초), 모델 `claude-opus-5`, 구독 사용량 소진·별도 과금 없음. `--bare`는 API 키 필수이므로 사용 불가 | 다중 사용자 요구, Anthropic 정책 명문화, 구독 한도 부족, 응답 지연이 UX 목표 초과 |
| D-030 | superseded | hosting을 ChatGPT Sites 대신 **본인 PC 자체 호스팅**(Node 서버+로컬 SQLite 파일, 휴대폰은 Tailscale 등 무료 사설망으로만 접속, 공개 인터넷 노출 없음)으로 확정한다. D-006은 superseded | 2026-09-02 사용자 승인. D-029의 `claude -p`는 본인 PC에서만 호출 가능하므로 서버가 같은 PC에 있어야 한다. Sites/D1 의존이 사라지고 일기 데이터가 본인 PC를 벗어나지 않아 B-02/B-05 경계가 단순해진다. 로컬 SQLite는 transaction·trigger를 지원하나 D-024의 조건부 statement 원칙은 유지한다. 제약: PC가 켜져 있고 사설망이 연결돼야 접속 가능(RK-018), 백업은 본인 책임. PRD PR-002·§4, README, ARCHITECTURE §2/§3/§6/§10, DATA_MODEL, SAFETY §3, EVAL §4/§9, RISK, ROADMAP, TRACEABILITY, work-graph(`d1-data-spike`→`local-data-spike`), runtime-profile을 같은 commit에서 갱신 | 같은 날 D-032로 대체(PC 상시 가동 제약 때문) |
| D-031 | accepted | `claude -p` 경로의 모델: **Journal Conversation/Structuring은 `claude-sonnet-5`**, **독립 Verifier와 RAG Interpretation은 `claude-opus-5`**(생성기와 다른 모델로 독립성 확보, D-026). Haiku 4.5는 사용하지 않는다. 모델 ID는 `--model` 플래그로 넘기며 versioned config 한 곳에 둔다 | 2026-09-02 같은 합성 입력·같은 schema로 3개 모델 실측. Opus 5: 벽시계 15초/API 8.5초, 정확. Sonnet 5: 벽시계 8.0초/API 4.9초, 정확·자연스러운 한국어, 구독 사용량 절약. Haiku 4.5: `--max-turns 1`에서 구조화 출력 미생성으로 실패, `--max-turns 3`에서는 12.4초에 성공했으나 사용자 발화를 무시하고 `eventText=null`+일반 인사 반환(비충실). UX 목표 첫 응답 p95 8초에 Sonnet 5가 근접, Opus 5는 초과 | 10회 지연 p95 측정, 구독 한도, 모델 세대 교체, 작성 평가 세트(EVAL §7) 결과 |
| D-032 | accepted | 배포는 **직접 작성한 백엔드 + 무료 클라우드**로 한다: 정적 UI는 Cloudflare Pages, API는 Cloudflare Workers(TypeScript, 우리 코드가 유일한 진입점), DB는 D1(SQLite 호환). 로그인은 서버 접근 토큰 cookie(D-025) 하나이며 BaaS(Supabase 등)는 쓰지 않는다. **AI는 본인 PC의 worker**가 백엔드의 `ai_jobs` 큐를 outbound로 가져가 `claude -p`(D-029/D-031)로 처리하고 결과를 되돌린다. PC는 포트를 열지 않는다. D-030의 hosting 부분은 superseded, D-029/D-031은 유지 | 2026-09-02 사용자 선택("B"). 자체 호스팅(D-030)은 PC가 꺼지면 앱 전체가 멈추는 제약(RK-018)이 있었고, Supabase는 BaaS 의존과 Auth가 1인 도구에 과잉. D1은 DATA_MODEL 스키마와 D-024(조건부 UPDATE/CHECK/trigger, batch)가 그대로 적용되며 원래 문서가 겨냥한 DB. Pages/Workers/D1 무료 플랜 한도·미사용 정지 여부·백업(Time Travel/export)은 B-04/B-05에서 확인. 트레이드오프: 일기 원문이 클라우드 DB에 저장됨(암호화·지역은 B-05). work-graph 노드 `local-data-spike`→`data-store-spike`. Netlify+Turso는 동일 패턴의 대안으로 보류 | 무료 한도 초과, D1 batch/trigger 미충족, 사용자 요구 변경 |
| D-033 | provisional | 디자인 시스템 v1: 원자료의 7개 감정 색 계열을 6단계(50~900)로 정규화한 토큰, 흰 배경+chip 중심의 부드러운 강조, Pretendard 우선 글꼴, 4pt 간격, 평면 계층, dark 토큰 동시 정의. 감정 색은 식별 라벨이며 강도·위험·순위를 뜻하지 않는다 | 2026-09-02 사용자 요청. 정본 `docs/DESIGN_SYSTEM.md`, 값 `design/tokens.json`, `scripts/check-contrast.mjs`가 quick 하네스에서 WCAG 대비(60건)를 검사. 기쁨(노랑)은 흰 배경 3:1 미달로 강조에 700 사용. 색 값은 사용자 시각 검수 전까지 provisional | 사용자 검수, taxonomy v1 캐릭터 자산 제작, 실기기 대비 확인 |

D-017~D-027은 2026-09-02 계획 재검증(TASK-BOOTSTRAP G1)에서 사용자 결정 5건과 결함 등록부 I-01~I-18의 수정 방향을 기록한 것이다. 영향 문서는 `DATA_MODEL`, `ARCHITECTURE`, `AI_RAG_SPEC`, `SAFETY_POLICY`, `UX_SPEC`, `EVAL_PLAN`, `RISK_REGISTER`, `ROADMAP`, `TRACEABILITY`, `harness/*`, `schemas/*`이며 같은 commit에서 갱신했다. D-028은 앱 범위·데이터 계약·유료 외부 서비스를 변경하지 않는다. 설치 시 기존 Git 소유자 불일치 때문에 CBM의 Git 감지가 실패하여 현 root 하나만 전역 `safe.directory`에 등록했다. `.git` 재초기화/commit은 수행하지 않았다.

## 새 결정 템플릿

```text
ID / 날짜 / 상태 / 결정자
문제:
관찰 근거:
선택:
대안과 기각 이유:
제품·데이터·안전·비용 영향:
검증 방법:
되돌림/마이그레이션:
재검토 조건:
사용자 승인 필요 여부:
```
