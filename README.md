# 감정일기

하루의 사건과 그때의 감정을 **내 말로** 기록하고, 쌓인 기록에서 감정의 흐름을 돌아보는 모바일 우선 웹앱입니다. 감정을 판정하거나 진단하지 않습니다. 사용자가 고른 표현을 그대로 보존하고, 통계는 완료된 기록만으로 재현 가능하게 계산합니다.

## 무엇을 하나요

- **원형 일기 구조**: 기록일자 → 일어난 사건 → 내가 느낀 감정과 강도(1~10) → 왜 그런 감정이 들었을까 → 칭찬할 점 세 가지 → 감사할 점 세 가지. 이 순서와 의미를 저장·조회·내보내기 어디서도 잃지 않습니다.
- **풍부한 감정 어휘**: 즐거움·바램·슬픔·분노·기쁨·사랑·미움 7개 상위 감정과 그 아래 세부 감정을 복수로 고르고, 각 세부 감정마다 강도를 따로 둡니다. 색과 캐릭터는 찾기 쉽게 돕는 보조 수단일 뿐 좋고 나쁨을 뜻하지 않습니다.
- **하루 한 편, 소급 작성**: 날짜당 기록은 하나이고 지난 날짜도 쓸 수 있습니다. 작성 streak는 실제로 완료한 날짜로만 계산합니다.
- **돌아보기**: 7일·30일·기간별 강도 추세, 상위 감정 비중, 세부 감정 빈도, 평균과 표본 수, 작성 streak. 기록이 없는 날은 0이 아니라 "없음"으로 다룹니다.
- **AI 대화로 쓰기(후행 기능)**: 한 번에 한 가지 열린 질문으로 사건을 풀어내고, 감정 단어 후보를 질문형으로 제안합니다. 말하지 않은 내용을 채우지 않고, 최종 선택과 완료는 항상 사용자가 합니다. AI가 실패해도 직접 작성과 대시보드는 그대로 동작합니다.
- **근거 있는 돌아보기(후행 기능)**: 심리학적 해석은 검수된 근거 카드와 독립 검증기를 통과한 경우에만 표시하고, 근거가 부족하면 통계만 보여 줍니다.

## 지키는 원칙

- 진단·치료·성격/애착 판정을 하지 않습니다. 위기 신호가 감지되는 AI 경로에서는 일반 분석을 멈추고 안전 안내로 전환합니다.
- 일기 원문은 서버 권한 검사 뒤에만 읽고 쓰며, 심리학 근거 저장소나 로그에 섞이지 않습니다.
- 삭제는 확인 후 영구 삭제이고, 내보내기는 schema version이 있는 UTF-8 JSON입니다.
- 유료 AI API를 사용하지 않습니다.

## 어떻게 만들어지나요

| 층 | 선택 | 근거 |
| --- | --- | --- |
| UI | 정적 웹(모바일 우선, WCAG 2.2 AA 목표) | Cloudflare Pages |
| API | 직접 작성한 TypeScript Workers, 유일한 진입점 | 서버 측 권한·완료조건·멱등성 통제 |
| 저장 | Cloudflare D1(SQLite 호환) | CHECK·UNIQUE·trigger로 불변조건을 DB에서 보장 |
| AI | 작업 큐 + 로컬 worker가 Claude Code 헤드리스 호출 | 서버는 모델을 직접 호출하지 않고, AI 부재 시 기록 기능은 유지 |

자세한 경계와 결정은 아래 정본 문서에 있습니다.

## 현재 상태

Phase 0 부트스트랩 단계입니다. 제품·데이터·AI·안전 명세와 검증 하네스가 정본이고, 배포·저장·인증·AI 경로는 기술 스파이크로 확인했습니다. 앱 코드는 다음 단계에서 이 결과 위에 작성합니다. 진행 상황과 다음 할 일은 [docs/STATUS.md](docs/STATUS.md)에 정리되어 있습니다.

## 저장소 둘러보기

| 판단 | 정본 |
| --- | --- |
| 제품 범위·완료 조건 | [PRD.md](PRD.md) |
| 시스템 경계·배포·신뢰 경계 | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| 저장 구조·무결성·삭제·내보내기 | [docs/DATA_MODEL.md](docs/DATA_MODEL.md) |
| 화면·직접 작성·AI 작성 흐름 | [docs/UX_SPEC.md](docs/UX_SPEC.md) |
| 색·글자·구성요소·접근성 | [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md), [design/tokens.json](design/tokens.json) |
| AI·RAG·근거·검증기 | [docs/AI_RAG_SPEC.md](docs/AI_RAG_SPEC.md) |
| 금지 출력·위기·개인정보 정책 | [docs/SAFETY_POLICY.md](docs/SAFETY_POLICY.md) |
| 테스트·평가·출시 게이트 | [docs/EVAL_PLAN.md](docs/EVAL_PLAN.md) |
| 확정 기술 결정 | [docs/DECISIONS.md](docs/DECISIONS.md) |
| 알려진 위험 | [docs/RISK_REGISTER.md](docs/RISK_REGISTER.md) |
| 단계별 구현 순서 | [docs/ROADMAP.md](docs/ROADMAP.md) |
| 요구사항 추적 | [docs/TRACEABILITY.md](docs/TRACEABILITY.md) |
| 진행 상황·다음 할 일 | [docs/STATUS.md](docs/STATUS.md) |
| 기계 검증용 데이터/AI 계약 | [schemas/README.md](schemas/README.md) |
| 사용자 제공 원자료 | [references/README.md](references/README.md) |

에이전트와 사람이 함께 작업하는 규칙은 [AGENTS.md](AGENTS.md)에, 작업 루프와 하네스는 [docs/AGENT_WORKFLOW.md](docs/AGENT_WORKFLOW.md)에, 첫 감사 절차는 [BOOTSTRAP.md](BOOTSTRAP.md)에 있습니다. 지금 승인된 작업과 증거는 [tasks/CURRENT_TASK.md](tasks/CURRENT_TASK.md)에서 봅니다.

## 검증

Node.js 22 환경에서 다음을 실행합니다.

```sh
npm run verify:quick
npm run verify:full
```

`quick`은 문서·링크·JSON·충돌 표식·명백한 비밀값을 검사합니다. `full`은 여기에 `package.json`에 정의된 `lint`, `typecheck`, `test`, `build`까지 실행합니다. 작업 완료 선언 전에는 `full` 통과가 필수입니다. `outputs/`와 `work/`는 스파이크·검증 중간물이며 저장소에 포함되지 않습니다.
