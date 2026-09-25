@AGENTS.md

@docs/SERVICE_WHY.md

# Claude Code adapter

Claude Code는 위 공용 계약을 정본으로 사용한다. 추가로 `.claude/settings.json`의 프로젝트 훅과 `.claude/agents/`의 읽기 전용 역할을 따른다. 이 파일에 제품 요구사항을 복제하지 않는다.

**세션을 시작하면 이 서비스의 WHY — 서비스를 만들게 된 핵심 이유 — 인 [docs/SERVICE_WHY.md](docs/SERVICE_WHY.md)를 먼저 끝까지 읽는다**(AGENTS §1). 위의 `@docs/SERVICE_WHY.md` 줄이 세션을 시작할 때 그 전문을 자동으로 불러온다. 불러오지 못한 환경(하위 에이전트, 다른 도구)에서는 Read로 직접 끝까지 읽은 뒤 작업을 시작한다.

