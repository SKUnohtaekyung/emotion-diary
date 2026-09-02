# 원자료와 공식 근거

## 사용자 제공 원자료

`source/`는 제품 원형을 보존하는 읽기 전용 참조 폴더다.

[manifest.json](manifest.json)에 원본 byte 수와 SHA-256을 기록했다. 새 프로젝트에 복사한 뒤 하네스가 해시 불일치를 발견하면 taxonomy/구현을 진행하지 말고 원본을 다시 확보한다.

| 파일 | 의미 | 취급 |
| --- | --- | --- |
| `source/journal-template.txt` | 감정일기 원형 필드와 순서 | 의미·순서 보존 |
| `source/emotion-words-joy-hope-sadness.jpg` | 즐거움·바램·슬픔의 세부 감정과 캐릭터/색 | 분류표 전사 후 사람 대조 필요 |
| `source/emotion-words-anger-happiness-love-hate.jpg` | 분노·기쁨·사랑·미움의 세부 감정과 캐릭터/색 | 분류표 전사 후 사람 대조 필요 |

원본 파일을 편집하거나 덮어쓰지 않는다. 구현용 감정 taxonomy를 만들 때는 별도 버전 파일을 만들고 원본 이미지와 2인 또는 사용자 최종 대조를 거친다. 이미지에서 자동 추출한 텍스트를 검수 없이 제품 정본으로 사용하지 않는다.

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
- [긴 작업용 prompt templates와 상태 관리](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/prompt-templates-and-variables)

공식 문서는 제품 요구사항의 정본이 아니라 기술 가능성과 도구 사용 방식의 근거다. 제품 결정은 [../docs/DECISIONS.md](../docs/DECISIONS.md)에 기록한다.
