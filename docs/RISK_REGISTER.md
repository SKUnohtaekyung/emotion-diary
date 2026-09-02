# 기술·제품 위험 등록부

## 운영 규칙

- 확률과 영향은 `low | medium | high`로 기록한다.
- 위험이 현실화되면 관련 work-graph 노드를 `blocked`로 바꾸고 Decision을 만든다.
- 개인정보·권한·데이터 손실·AI 안전 위험은 일정 때문에 수용할 수 없다.
- 새 프로젝트 부트스트랩에서 owner와 상태를 실제 담당자/agent로 갱신한다.

| ID | 위험 | 확률 | 영향 | 조기 신호/검증 | 완화 | fallback | 상태 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RK-001 | 자체 호스팅 서버가 공개 인터페이스에 노출되거나 사설망 설정 오류로 접근 경계가 무너짐 | medium | high | B-02 실패, 공개 IP에서 응답 | 사설망 인터페이스 bind+접근 토큰 defense-in-depth(D-025, D-030) | 접근 경계 추가 또는 무료 private hosting(D-021) | open |
| RK-002 | 서버 접근 토큰 유출·재사용으로 owner 데이터 접근 | low | high | 토큰 로그 노출, cookie 속성 누락 | `.env` 전용 보관, HttpOnly/Secure cookie, 회전 절차 | 토큰 회전 후 재감사 | open |
| RK-003 | 로컬 SQLite의 concurrency·migration·백업이 데이터 계약 미충족 | low | high | 같은 날짜 중복, 부분 delete, TOCTOU, 백업 누락 | unique/조건부 UPDATE/transaction/idempotency/백업 스파이크(D-024, B-04/B-05) | 무료 범위의 대체 DB | open |
| RK-004 | Web Push/background가 자체 호스팅/모바일에서 미지원·불안정 | high | medium | permission 후 실제 알림 없음, background 제한 | 제품 약속에서 분리, 실제 기기 검증 | 인앱 reminder만 MVP | open |
| RK-005 | Evidence corpus가 제한 분석을 지지하기에 부족 | high | high | Recall 낮음, Gate 대부분 fail, reviewer 불일치 | 주제 범위를 좁히고 고품질 card 확보 | RAG 분석 제외, 통계만 출시 | open |
| RK-006 | RAG가 그럴듯한 무근거/진단 claim 생성 | medium | high | false pass/unsupported claim/injection | app-controlled search, Gate, code+semantic verifier, safety eval | 분석 기능 즉시 보류 | open |
| RK-007 | 이미지 OCR가 세부 감정 label/소속을 오기 | medium | high | taxonomy와 원본 대조 불일치 | 원본 보존, 사람/사용자 1:1 검수 | taxonomy 출시 차단 | open |
| RK-008 | 일기 원문이 로그·API 보존·Vector Store로 유출 | medium | high | log scan/API instrumentation 실패 | server-only, `store` 검증, log denylist, store 분리 | AI/배포 중단·incident response | open |
| RK-009 | AI latency/비용/rate limit가 모바일 UX를 방해 | high | medium | p95/비용 budget 초과, 429 | 최소 snapshot, idempotent cache, bounded output | 직접 작성·통계 fallback | open |
| RK-010 | 로컬 Node/SQLite stack 선택이 모바일 브라우저·사설망 환경과 충돌 | low | medium | 휴대폰 접속 실패, HTTPS 없는 cookie 제약 | Phase 0 최소 vertical spike(B-08), Tailscale HTTPS 인증서 검토 | stack 또는 무료 hosting 변경 | open |
| RK-011 | Claude/Codex 지침이 분기되거나 동시 writer 충돌 | medium | medium | CLAUDE/AGENTS 불일치, 같은 파일 충돌 | CLAUDE import, one-writer, quick hook 적용됨. worktree 격리는 G0 baseline(D-017) 이후 가능하나 병렬 writer는 아직 실증 없음 | 통합 중단 후 소유권 재설정 | open (부분 완화; 2026-09-02 `mitigated` 과장 정정) |
| RK-012 | AI 평가 세트가 좁아 실제 실패를 놓침 | medium | high | 실제 failure가 고정 set에 없음, reviewer 편향 | stratified synthetic set, red-team, adjudication, 회귀 추가 | 분석 rollout 중단 | open |
| RK-013 | Anthropic/Claude Code CLI·도구 동작 변경 | high | medium | SDK upgrade, deprecated field, hook failure | version pin, official docs 재검증, adapter tests | 이전 version rollback/adapter 변경 | open |
| RK-014 | 사용자가 제품을 임상/위기 서비스로 오해 | medium | high | PHI 입력, 진단 요구, 위기 대화 | 근접 고지, 금지 output, crisis flow | 기능 제한·전문 검토 전 배포 중단 | open |
| RK-015 | hard delete와 provider backup 보존 약속 불일치 | medium | high | 즉시 완전 소거를 증명 못함, 벤더 문의 미회신(I-17) | 앱 DB hard delete와 공급자 지연을 구분 고지, B-05에 벤더 근거 첨부 | hosting 변경 또는 약속 축소 | open |
| RK-016 | 구독 기반 모델 호출 경로(`claude -p`, D-029)가 보존 통제·독립 verifier·지연 목표·구독 한도를 만족하지 못함 | medium | medium | B-06 잔여 항목 fail, 구독 한도 소진, 응답 p95 8초 초과 | 최소 스파이크 PASS(2026-09-02). 남은 항목을 G2c에서 검증, 제한 MVP 선행(D-018), AI 진입점 비활성 표시 | AI 대화·RAG 보류, 제한 MVP만 운영 | open |
| RK-017 | 개인 단일 사용자 도구에서 구독 자격 증명으로 `claude -p`를 호출하는 것이 Anthropic 정책상 회색지대 | medium | high | 정책 명문화, 계정 경고, 약관 변경 | 본인 1명 전용 유지, 다중 사용자·타인 제공 금지(D-029), 공식 문서 변경 시 재검토 | AI 기능 즉시 중단, 제한 MVP만 운영 | accepted (사용자 인지) |
| RK-018 | 본인 PC 자체 호스팅(D-030)은 PC 전원·네트워크에 의존해 휴대폰에서 접속 불가 시간이 생김 | high | low | PC 꺼짐, Tailscale 미연결 | 앱은 저장 실패를 명확히 표시하고 입력을 잃지 않음(UX §4), 인앱 reminder는 접속 시에만 | 무료 hosting 대안 재평가(D-021) | open |

위험을 `closed`로 바꿀 때 테스트/스파이크/정책 링크를 추가한다. `accepted`는 사용자가 잔여 위험을 이해하고 승인한 경우에만 사용한다.

