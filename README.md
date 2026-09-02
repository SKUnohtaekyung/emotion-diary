# 감정일기 개발 저장소

이 폴더가 모바일 우선 개인용 감정일기 MVP의 실제 프로젝트 루트다. 제품·AI·안전 명세와 구현 작업 규칙을 함께 관리한다. 현재 단계의 정본은 문서이며, 애플리케이션 코드 스캐폴드는 Phase 0 기술 스파이크가 통과한 뒤 이곳에 추가한다.

## 시작 순서

사람과 에이전트 모두 이 프로젝트 루트에서 아래 순서로 읽는다.

1. [BOOTSTRAP.md](BOOTSTRAP.md) — 확정 사항과 기술 가설을 분리하는 첫 감사
2. [AGENTS.md](AGENTS.md) — 공용 작업 계약
3. [tasks/CURRENT_TASK.md](tasks/CURRENT_TASK.md) — 지금 승인된 작업과 상태
4. 작업과 관련된 정본 문서
5. [docs/TRACEABILITY.md](docs/TRACEABILITY.md) — 요구사항과 검증의 연결

Claude Code는 [CLAUDE.md](CLAUDE.md)를 통해 같은 `AGENTS.md`를 불러오고, Codex는 `AGENTS.md`를 직접 읽는다. 두 도구에 서로 다른 제품 규칙을 복사하지 않는다.

## 정본 지도

| 판단 | 정본 |
| --- | --- |
| 제품 범위·완료 조건 | [PRD.md](PRD.md) |
| 시스템 경계·배포·신뢰 경계 | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| 저장 구조·무결성·삭제·내보내기 | [docs/DATA_MODEL.md](docs/DATA_MODEL.md) |
| 화면·직접 작성·AI 작성 흐름 | [docs/UX_SPEC.md](docs/UX_SPEC.md) |
| AI·RAG·Evidence·검증기 | [docs/AI_RAG_SPEC.md](docs/AI_RAG_SPEC.md) |
| 금지 출력·위기·개인정보 정책 | [docs/SAFETY_POLICY.md](docs/SAFETY_POLICY.md) |
| 테스트·평가·출시 게이트 | [docs/EVAL_PLAN.md](docs/EVAL_PLAN.md) |
| 에이전트 루프·작업 그래프·하네스 | [docs/AGENT_WORKFLOW.md](docs/AGENT_WORKFLOW.md) |
| 확정 기술 결정 | [docs/DECISIONS.md](docs/DECISIONS.md) |
| 알려진 기술·제품 위험 | [docs/RISK_REGISTER.md](docs/RISK_REGISTER.md) |
| 단계별 구현 순서 | [docs/ROADMAP.md](docs/ROADMAP.md) |
| 요구사항 추적 | [docs/TRACEABILITY.md](docs/TRACEABILITY.md) |
| 사용자 제공 원자료 | [references/README.md](references/README.md) |
| 기계 검증용 데이터/AI 계약 | [schemas/README.md](schemas/README.md) |

충돌 시 더 구체적인 정본이 우선한다. 제품 범위 자체를 바꾸는 결정은 반드시 `PRD.md`와 `DECISIONS.md`를 함께 갱신한다.

## 검증

현재 확인된 Node.js 22 환경에서 다음을 실행한다.

```sh
node scripts/verify.mjs --mode quick
node scripts/verify.mjs --mode full
# 또는
npm run verify:quick
npm run verify:full
```

`quick`은 문서·링크·JSON·충돌 표식·명백한 비밀값을 검사한다. `full`은 여기에 코드가 생겼을 때 정의된 `lint`, `typecheck`, `test`, `build` 스크립트까지 실행한다. 작업 완료 선언 전에는 `full` 통과가 필수다.

`outputs/`는 이전 이동용 패키지, `work/`는 검증 중간물이다. 둘 다 현재 프로젝트의 정본이나 구현 소스가 아니며 Git·하네스 검색에서 제외한다.

## 현재 배포 전제 (2026-09-02, D-029/D-032)

- 직접 작성한 백엔드를 무료 클라우드에 올리는 단일 사용자 MVP다: Cloudflare Pages(정적 UI) + Workers(API, 유일한 진입점) + D1(SQLite 호환 DB). 로그인은 서버 접근 토큰 cookie 하나이며 BaaS는 쓰지 않는다. 공개·다중 사용자 전환은 별도 결정과 보안 검증 없이는 금지한다.
- AI 기능은 유료 API를 쓰지 않는다. 본인 PC의 worker가 백엔드의 작업 큐를 outbound로 가져가 Claude 구독 로그인으로 `claude -p`를 호출하고 결과를 되돌린다. PC는 포트를 열지 않으며, PC가 꺼져 있으면 AI만 비활성이다. 본인 1명 전용이며 타인에게 제공하지 않는다.
- 직접 작성+결정론적 대시보드의 제한 MVP를 먼저 만들고 AI 대화·RAG는 후행 단계다(D-018).
- 개인 일기 원문은 심리학 Evidence Store와 분리한다.
- 의료 기록·보호대상 건강정보(PHI)를 처리하는 제품이 아니다.
- 실제 코드 구조는 접근 토큰·D1 트랜잭션·worker 큐 왕복 스파이크(G2a/G2b)를 통과한 뒤 생성한다. Cloudflare 계정·프로젝트 생성은 무료지만 외부 자원이므로 실행 직전 사용자에게 재확인한다. 후보가 부적합하면 `ARCHITECTURE`와 `DECISIONS`를 근거와 함께 고쳐 무료 범위의 대체 hosting/backend(예: Netlify+Turso)를 선택한다.
