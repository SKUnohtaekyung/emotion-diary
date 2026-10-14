# R-DB(데이터) 보고 — 원문

2026-10-14 · 모델 Sonnet·추론도 high · 에이전트 형 `Plan`(쓰기 도구 없음) · 도구 31회. 메인이 받은 마지막 답장을 고치지 않고 옮겼다(맨 끝의 'Critical Files' 목록만 뺐다). 이 보고는 검토자의 주장이다 — 메인의 재확인은 `../REPORT.md` §7.

표기: 사실=[사], 추론=[추], 미확인=[미]. 바꿈/미룸 = 바꾸는 비용 / 지금 안 바꾸면 나중에 커지는 비용.

## 1. 판정 표

| 대상 | 지금 | 기준(그때) | 판정 (본인 전용 / 공개) | 근거 | 바꿈 / 미룸 |
|---|---|---|---|---|---|
| DB 제품 = D1 | D1, 마이그레이션 0001~0004(52줄), 일기 표 아직 없음 | D-032 "Supabase는 BaaS 과잉, Netlify+Turso 보류"(사용자 선택) | **유지 / 유지**. 그때 이유(BaaS 과잉)는 약하다. 지금 유지 이유는 아래 근거다. | [사] D1 무료는 한도에 닿으면 과금 없이 질의만 막힌다(https://developers.cloudflare.com/d1/platform/pricing/). [사] Time Travel 무료 7일(https://developers.cloudflare.com/d1/reference/time-travel/). 대안의 무료 복구: Turso 1일(https://docs.turso.tech/features/point-in-time-recovery), Neon 이력 6시간(https://neon.com/pricing), Supabase 무료엔 자동 백업 없음(https://supabase.com/docs/guides/platform/backups). [사] Supabase 무료는 1주 미사용 시 정지(https://supabase.com/pricing)이며 매일 쓰면 해당 없음. | 바꿈: 지금이 가장 싸다(SQL 표 4개, Turso면 방언 거의 동일). 미룸: 일기 표와 trigger 위에 코드가 쌓이면 Turso는 소, Postgres는 중. |
| 한 DB에 전부 | 일기·세션·설정·ai_jobs(·Evidence)를 한 D1에 둔다 | 단순함 | **고침(작게) / 고침** | 아래 두 행 | 작음 / 작음 |
| ai_jobs를 같은 DB에 | payload는 완료 시 NULL(DATA_MODEL §3.8 L121) | RK-019 | **고침(작게) / 바꿈** | [추] 앱이 NULL로 지워도 Time Travel은 7일치 이력을 DB 전체 단위로 갖는다(§8 L288). 지운 payload가 7일간 남을 수 있다. §8 L290 "남는 곳 다섯 곳" 고지에 없다. [사] `app/`에 ai_jobs 코드 아직 없음. | 작음(큐 전용 두 번째 D1 또는 고지 한 줄). 미룸: AI 착수 후엔 마이그레이션이 필요. |
| Evidence Store 위치 | 미선택, B-07 unknown | 유료 Vector Store 제외(D-019) | **판단 보류, 단 일기 DB에 넣지 않는 쪽 권고 / 같음** | [사] 카드는 공개 문헌 메타, 일기와 무관, 카드 하나=파일 하나, 상태 draft→active→retired(AI_RAG §6.2). [추] 수십~수백 장이면 저장소 파일(Git 버전·해시)을 Worker 번들에 넣고 topic_codes로 거르면 된다. 임베딩 검색 필요 여부는 B-07에서 정해진다. | 거의 0 / 거의 0 |
| 불변조건 방식 (D-024: 조건부 UPDATE·CHECK·trigger·batch) | 설계와 스파이크만, 일기 코드 없음 | interactive transaction 부재 | **유지 / 유지** | [사] batch는 SQL 트랜잭션이고 한 문장 실패 시 전체 롤백(https://developers.cloudflare.com/d1/worker-api/d1-database/). [사] 원격 실측: 두 번째 변경이 위반이면 첫 번째도 남지 않음, 동시 8건 중 1건만 성공(`tasks/spike/2026-10-13/PLAN.md` L242~256). [사] trigger RAISE(ABORT) 확인. 한계: 1인 규모 겹침만 봄. `UNIQUE(owner_key, entry_date)`는 엔진 보장이라 어디서나 같다. | 바꿈: Postgres/Turso는 interactive transaction이 더 쉬우나 지금 방식도 충분. 미룸: 낮음. |
| 백업 (D-109: Time Travel 7일 + PC 하루 1번·30일) | 절차만 있고 구현 없음 | 사용자: 30일, 하루 1번 | **고침(작게) / 바꿈** | [사] `app/`에 백업·재수입 코드 없음(grep). [사] Time Travel 복구는 DB 전체 덮어쓰기. [추] 복구하면 sessions·auth_failures도 과거로 돌아가 로그아웃한 cookie가 되살아난다. [사] 백업 파일=내보내기 JSON이고 비밀값·owner 설정 제외(§8 L282), 즉 앱 잠금·이름은 이 사본으로 복구 안 됨. [사] 평문(D-4). [추] PC가 2주 꺼지면 Cloudflare 계정 문제 시 마지막 사본은 2주 전 것. | 바꿈: 재수입 도구 + 월 1회 복원 훈련을 `data-foundation` 완료 조건에 넣기(소). 미룸: 도구 없이 쓰기 시작하면 복구 시험 없이 일기가 쌓인다(최대 위험). |
| hard delete와 백업 보존 | 앱에서 바로 삭제, 복구용 사본에 7일/30일 남는다고 고지 | RK-015 | **유지 / 판단 보류** | [사] 지운 행이 복구로 되살아남(D-3). 공급자 쪽 물리 삭제 시점은 못 알아냄. 본인 전용은 고지가 정직. 공개 시 개인정보 파기 의무와 충돌 가능. [미] 법률 해석은 못 함. | 공개 시 바꿈 큼(행 단위 파기 불가 구조). 지금은 0. |
| 내보내기 (JSON, Worker 경유) | 설계만 | D-012 | **고침(작게) / 유지** | [사] 무료 Worker 요청당 CPU 10ms(runtime-profile `free_tier_limits_confirmed`). [추] 2~3년치(약 1천 건+자식 행 수천, 수 MB) JSON.stringify가 한도에 닿을 수 있다. D1 질의 대기는 CPU로 안 센다. [미] 실측 없음. `wrangler d1 export`는 실행 중 다른 요청을 막는다(https://developers.cloudflare.com/d1/best-practices/import-export-data/). | 작음: 합성 3년치로 `data-foundation`에서 재기. 미룸: 1~2년 뒤 백업이 조용히 실패. |
| 암호화 수준 | D1 기본 저장 암호화(AES-256, Cloudflare 관리 키) | B-05 | **유지 / 판단 보류** | [사] 공식 문서(https://developers.cloudflare.com/d1/reference/data-security/)에 고객 관리 키·직원 접근 정책 언급 없음. Worker는 평문으로 읽는다. [추] 필드 암호화(Worker 비밀값 키)는 DB 덤프·이력 유출만 막고, 같은 계정 비밀값이 뚫리면 같이 뚫리며 키 분실 시 일기를 잃는다. 이득 작음. | 필드 암호화 약 1일(소), 나중 도입은 전 행 재암호화(중). |

## 2. 영역 결론

D1을 일기·감정·revision·삭제·내보내기까지 한 DB로 두는 선택은 본인 전용에서 맞다. 근거는 한도 초과 시 과금 없이 질의만 막힌다는 점, 같은 플랫폼 바인딩이라 비밀값이 늘지 않는다는 점, 무료 7일 Time Travel, 원격에서 batch 원자성과 동시성을 실측했다는 점이다. 무료 대안 중 복구가 가장 약한 쪽(Neon 6시간, Supabase 없음)은 "지운 걸 되살릴 수 있어야 한다"에 맞지 않는다. 약한 곳은 DB 제품이 아니라 주변이다. 첫째 백업·재수입이 문서뿐이고 코드가 없다. 둘째 ai_jobs payload가 Time Travel 이력에 7일 남을 수 있는데 고지에서 빠져 있다. 셋째 Evidence Store는 일기 DB와 묶을 이유가 없다. 넷째 내보내기의 CPU 10ms 한도는 데이터가 쌓인 뒤에야 드러난다. 공개로 가도 DB 제품은 크게 안 바뀐다. DB당 500MB(https://developers.cloudflare.com/d1/platform/limits/)와 하루 쓰기 10만 행은 수십 명 규모에서 먼저 닿으니 유료로 올리면 되고(가격은 미확인) `owner_key`는 이미 행 단위 설계다. 공개 시 실제로 커지는 비용은 인증, 파기 의무, AI 비용, 사용자별 백업이다.

## 3. 대안 비교(요약)

| 안 | 무료 한도·넘을 때 | 복구 | 이전 비용 | 불변조건 | 판정 |
|---|---|---|---|---|---|
| Turso/libSQL | 5GB, 월 읽기 5억·쓰기 1천만 행. 초과 동작은 페이지에 불명 [미] | 무료 PITR 1일 | 낮음(SQLite 방언 동일) | interactive transaction 가능 | D1 실패 시 1순위 대체. 지금은 이유 없음 |
| Supabase Postgres | 500MB, 1주 미사용 정지, 무료 자동 백업 없음 | 수동 `db dump`뿐 | 큼 | 가장 풍부 | 무료 복구 없어 부적합 |
| Neon | 1GB, 5분 미사용 중지, 한도 닿으면 쓰기 차단 | 이력 6시간 | 큼 | 풍부 | 부적합 |
| 기기 안 저장(IndexedDB/SQLite-wasm)+동기화 | 서버 비용 거의 0 | 아이콘 삭제 시 기기 저장소 소실 가능(S-11 미검증) [추] | 설계 전면 교체 | 단일 기기면 쉬우나 동기화 시 충돌 처리 필요 | 권고하지 않음. DATA_MODEL §6 "일기 원문을 기기에 오래 두지 않는다", PC worker AI 경로와 충돌 |
| 서버가 못 읽는 암호화(E2E) | 같음 | 암호문 백업 | 큼 | 통계는 감정 코드·강도로 가능, AI는 서버·PC가 평문을 봐야 함 | AI를 끄는 대가. 암호 분실=영구 손실이라 SERVICE_WHY §11 "복귀 가능성"과 충돌. **사용자 결정 사항**으로 제시 |

## 4. 제안(고르는 것은 사용자)

1. `data-foundation` 완료 조건에 (a) 재수입 도구, (b) 월 1회 복원 훈련, (c) 합성 3년치 내보내기 CPU 측정, (d) 백업에 owner 설정 포함 여부 결정을 넣는다. 이미 잡힌 작업 안이고 잃는 것 없음.
2. 고지 §8 L290 "남는 곳"에 "작업 큐의 지운 일기 발췌도 복구 기록에 7일" 한 줄을 넣거나 큐 전용 두 번째 D1로 분리한다(무료 DB 10개 안).
3. Evidence Store는 일기 DB 밖(Git 파일→번들)을 기본으로 두고 B-07에서 검색 필요 여부를 본다.
4. Cron(무료 5개)으로 Cloudflare 안에 보조 사본을 만드는 안은 R2 무료·카드 요건을 확인 못 해 제안만 한다.

## 5. 확인하지 못한 것

- Turso 무료 한도 초과 시 동작과 최신 PITR(가져온 페이지에 명시 없음 또는 구버전 가능).
- D1 Time Travel 이력의 물리 삭제 시점, Cloudflare 직원의 데이터 접근 정책(공식 문서에 없음).
- 개인정보 파기 의무(국내법)의 구체 해석(법률 검토 범위 밖).
- 지속 부하·대용량 실측(일기 코드가 없어 합성 시험도 못 함).
- R2 무료 사용 시 카드 요건, 유료 전환 가격.

## 6. 메인이 다시 잴 곳

1. D1 무료 한도 초과 시 "질의 오류, 과금 없음": https://developers.cloudflare.com/d1/platform/pricing/
2. batch 원자성·원격 실측: https://developers.cloudflare.com/d1/worker-api/d1-database/ 와 `tasks/spike/2026-10-13/PLAN.md` L242~256(D-1·D-2)
3. Time Travel 무료 7일·DB 전체 덮어쓰기: https://developers.cloudflare.com/d1/reference/time-travel/ 와 `docs/DATA_MODEL.md` L288~290. 고지 5곳에 ai_jobs 이력이 없는지.
4. 백업 코드 부재: `app/` 아래 grep `ai_jobs|backup|재수입` 0건. `docs/DATA_MODEL.md` L281~283에서 내보내기에 owner 설정이 빠지는지.
5. 내보내기 CPU: Workers 무료 CPU 10ms(`harness/runtime-profile.json` `free_tier_limits_confirmed`)를 합성 3년치로 재기(내 추론).
