# 원자료와 공식 근거

## 사용자 제공 원자료

`source/`는 제품 원형을 보존하는 읽기 전용 참조 폴더다.

[manifest.json](manifest.json)에 원본 byte 수와 SHA-256을 기록했다. 새 프로젝트에 복사한 뒤 하네스가 해시 불일치를 발견하면 taxonomy/구현을 진행하지 말고 원본을 다시 확보한다.

| 파일 | 의미 | 취급 |
| --- | --- | --- |
| `source/journal-template.txt` | 감정일기 원형 필드와 순서 | 의미·순서 보존 |
| `source/emotion-words-joy-hope-sadness.jpg` | 즐거움·바램·슬픔의 세부 감정과 캐릭터/색 | 분류표 전사 후 사람 대조 필요 |
| `source/emotion-words-anger-happiness-love-hate.jpg` | 분노·기쁨·사랑·미움의 세부 감정과 캐릭터/색 | 분류표 전사 후 사람 대조 필요 |
| `source/benchmark/emotion_diary_benchmark_integrated.md` | 시장·경쟁 벤치마킹(외부 심층 리서치 두 편의 통합본) — 제품 원형이 아니라 연구 입력 | 원문 보존. 사실로 인용하기 전 공식 출처로 재확인 |
| `source/why/emotion_diary_service_why_final.md` | 서비스 WHY — 서비스를 만들게 된 핵심 이유 | 원본 보존. 세션마다 읽는 정본은 같은 바이트로 복사한 [`../docs/SERVICE_WHY.md`](../docs/SERVICE_WHY.md) |

**전사 상태(2026-09-04).** 두 이미지의 세부 감정 전사본은 [`../data/taxonomy/v1.json`](../data/taxonomy/v1.json)이다 — 7계열 194개(즐거움 24 / 바램 13 / 슬픔 56 / 분노 28 / 기쁨 32 / 사랑 18 / 미움 23). 원본 표기를 그대로 옮긴 아카이브이고 맞춤법·구성을 고치지 않았다(PR-004). 카테고리별 독립 `emotion_code`는 D-022 형식이다. **사람 대조를 마쳤다** — 1차 자체 재대조 뒤 사용자 최종 대조(D-027 §7.8b, 2026-09-04)까지 완료해 `review_status`는 `reviewed`다. `taxonomy-v2-research`(T4)의 입력으로 쓸 수 있다. 절차는 `tasks/TASK-TAXONOMY-V1.md`.

**세부 감정 목록의 심리학적 타당성(D-038).** 원자료 전사본(taxonomy v1)은 출처로서 그대로 보존하되, 제품이 쓰는 목록은 심리학 문헌을 근거로 다시 만드는 것이 목표다. 원자료에는 전공자가 바로 지적할 지점이 있다 — 공포/두려움 카테고리 부재(`두려운`·`공포에 질린`이 슬픔에 있음), 놀람이 기쁨 안에만 존재, 즐거움과 기쁨의 경계 중첩, 바램의 동기·기대 성격. 리서치 시 비진단 경계(PR-001), 척도 라이선스, 한국어 어휘 뉘앙스, 카테고리 변경 시의 색·코드 연쇄를 함께 다룬다. 자세한 제약과 산출물 규격은 `docs/DECISIONS.md` D-038. **완료(2026-09-05)**: [`../data/taxonomy/v2.json`](../data/taxonomy/v2.json)(9계열 194개)와 매핑표 [`../data/taxonomy/v1-to-v2.json`](../data/taxonomy/v1-to-v2.json)로 확정, D-038 `accepted`. ~~`review_status: pending_user_review` — 사용자 최종 대조가 아직 남아 있다.~~ **[정정, 2026-09-05]** 사용자 최종 대조(D-027)가 완료됐다 — `review_status: reviewed`(`user_cross_check_date: 2026-09-05`). 승인은 반증 표(`docs/research/taxonomy-v2-decisions.md` §2) 미해소 지적을 인지한 상태에서 이뤄졌다(해소 3·부분 해소 2·해소 안 함 7).

원본 파일을 편집하거나 덮어쓰지 않는다. 구현용 감정 taxonomy를 만들 때는 별도 버전 파일을 만들고 원본 이미지와 사람의 시간 분리 2회 검수(D-027) 또는 사용자 최종 대조를 거친다. 검수자와 날짜를 taxonomy 파일에 기록한다(EVAL §6과 같은 기준). 이미지에서 자동 추출한 텍스트를 검수 없이 제품 정본으로 사용하지 않는다. 카테고리 간 같은 표기의 세부 감정은 카테고리별 독립 code로 전사한다(D-022).

**2026-09-21 캐릭터 원본 보존.** 사용자가 최종 채택한 평면 친구 9종은 [`source/characters/flat-friends/`](source/characters/flat-friends/)에 `--source` 파일명으로 보존했다. 이름·감정 매핑과 작명 이유는 [`design/characters/README.md`](../design/characters/README.md) §9에 기록되어 있다.

**2026-09-24 벤치마킹 원자료 보존.** 사용자가 준 [`source/benchmark/emotion_diary_benchmark_integrated.md`](source/benchmark/emotion_diary_benchmark_integrated.md)를 받은 파일 이름·바이트 그대로 보존하고 manifest에 고정했다(220,570 B, LF). 조사 기준일 2026-09-24의 외부 심층 리서치 두 편 — 보고서 A(시장 지도 61개·핵심 14개, 참고문헌 137개)와 보고서 B(카탈로그 68개·핵심 12개) — 과 둘을 합친 통합 요약(1~781행)으로 이뤄져 있다. **보고서 B의 인용 표지(`citeturn…`)는 원래 조사 도구 안에서만 통하는 참조라 링크로 풀리지 않는다.** 두 보고서 모두 앱을 직접 설치하지 않았고 리뷰를 정량 표본으로 모으지 않았다고 스스로 밝힌다. 그래서 이 파일의 평점·가격·다운로드·기능 주장은 사실로 인용하기 전에 공식 출처로 다시 확인한다. 분석과 우리 기획 대조는 [`../docs/research/benchmark-2026-09-analysis.md`](../docs/research/benchmark-2026-09-analysis.md), 경쟁 서비스 정리와 표본 검증 결과는 [`../docs/research/benchmark-2026-09-competitors.md`](../docs/research/benchmark-2026-09-competitors.md)에 있다. 원문 안의 위기 연락처 번호도 그대로 쓰지 않는다 — [SAFETY_POLICY](../docs/SAFETY_POLICY.md) §6의 확인 절차를 따른다.

**2026-09-24 서비스 WHY 원본 보존.** 사용자가 준 [`source/why/emotion_diary_service_why_final.md`](source/why/emotion_diary_service_why_final.md)(41,379 B, LF)는 이 서비스를 만들게 된 핵심 이유다. 사용자 지시대로 내용을 하나도 빠짐없이 같은 바이트로 [`../docs/SERVICE_WHY.md`](../docs/SERVICE_WHY.md)에 복사해 정본으로 두었고, `AGENTS.md` §1과 `CLAUDE.md`가 세션을 시작할 때 그 정본을 먼저 읽게 한다. 이 보관본은 받은 원문 그대로를 manifest 해시로 고정한다 — 나중에 정본이 고쳐지더라도 처음 받은 WHY와 대조할 수 있다.

## 공식 에이전트 개발 근거

아래 링크는 이 저장소의 에이전트 구성 결정을 확인한 공식 자료다. 외부 기능은 구현 시점에 다시 확인한다.

### OpenAI / Codex / Sites

- [Codex의 AGENTS.md 구성](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [ChatGPT Sites 개요와 데이터·공유·배포](https://learn.chatgpt.com/docs/sites)
- [OpenAI Vector Store 검색 API](https://developers.openai.com/api/reference/typescript/resources/vector_stores/methods/search)
- [Responses API create 계약](https://developers.openai.com/api/reference/cli/resources/responses/methods/create)
- [최신 모델의 에이전트 지침 설계](https://developers.openai.com/api/docs/guides/latest-model)
- [OpenAI Evals API](https://platform.openai.com/docs/api-reference/evals)

### Anthropic / Claude Code

- [Claude Code memory와 CLAUDE.md](https://code.claude.com/docs/en/memory)
- [Claude Code hooks](https://code.claude.com/docs/en/hooks-guide)
- [Claude Code permissions](https://code.claude.com/docs/en/permissions)
- [Claude Code 기능 선택 가이드](https://code.claude.com/docs/en/features-overview)
- [Claude Code subagents](https://code.claude.com/docs/en/sub-agents)
- [Claude Code best practices — 검증·계획·맥락 관리·리뷰 단계](https://code.claude.com/docs/en/best-practices)
- [Claude Code 병렬 실행 방식과 worktree 격리 기준](https://code.claude.com/docs/en/agents)
- [긴 작업 에이전트 하네스(진행 파일·단계별 커밋·끝단 검증)](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [긴 작업용 prompt templates와 상태 관리](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/prompt-templates-and-variables)

공식 문서는 제품 요구사항의 정본이 아니라 기술 가능성과 도구 사용 방식의 근거다. 제품 결정은 [../docs/DECISIONS.md](../docs/DECISIONS.md)에 기록한다.
