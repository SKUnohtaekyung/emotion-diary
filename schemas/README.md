# 구현용 JSON Schema 시드

이 폴더는 문서 계약을 기계 검증으로 옮기기 위한 JSON Schema Draft 2020-12 시드다.

- `diary-entry.schema.json`: draft/completed 일기와 완료조건
- `journal-assist-output.schema.json`: AI 대화 구조화 응답
- `evidence-card.schema.json`: 검수 가능한 Evidence Card
- `analysis-output.schema.json`: 사용자에게 표시할 분석 출력
- `export.schema.json`: versioned JSON 내보내기 envelope

문서가 정본이며 schema는 구현 보조다. 새 프로젝트에서 실제 validator/Ajv 호환성, format plugin, nullable 표현을 확인한다. schema 변경은 관련 문서·prompt·fixture·migration·EVAL을 함께 갱신한다.

