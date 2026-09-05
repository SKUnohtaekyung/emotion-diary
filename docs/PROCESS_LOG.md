# 개발 과정 기록

## 사용법

이 문서는 특정 산출물이 어떤 단계·검증·시행착오를 거쳐 지금 형태가 됐는지 시간 순으로 서술한다. [DECISIONS.md](DECISIONS.md)가 각 결정과 그 근거를 결정 단위로, [STATUS.md](STATUS.md)가 지금 시점의 상태와 다음 할 일을, [ROADMAP.md](ROADMAP.md)가 앞으로의 단계 순서를 담는 것과 달리, 이 문서는 이미 끝났거나 상당히 진행된 작업이 실제로 무엇을 거쳤는지 — 특히 중간에 발견해 고친 문제와 남은 약점 — 를 감추지 않고 남긴다. 항목은 작업 단위로 추가된다. 홍보 문구를 쓰지 않고 사실과 수치로만 적는다.

## 1. taxonomy v2 — 세부 감정 목록 심리학 리서치 (2026-09-04~05)

정본: [DECISIONS.md](DECISIONS.md) D-038·D-040, [../tasks/TASK-TAXONOMY.md](../tasks/TASK-TAXONOMY.md), [../tasks/TASK-TAXONOMY-V1.md](../tasks/TASK-TAXONOMY-V1.md), [../tasks/TASK-TAXONOMY-PLAN-V2.md](../tasks/TASK-TAXONOMY-PLAN-V2.md), [research/taxonomy-v2-decisions.md](research/taxonomy-v2-decisions.md)와 조사 기록 [-a](research/taxonomy-v2-sources-a.md)·[-b](research/taxonomy-v2-sources-b.md)·[-c](research/taxonomy-v2-sources-c.md). 데이터: [../data/taxonomy/v1.json](../data/taxonomy/v1.json), [../data/taxonomy/v2.json](../data/taxonomy/v2.json), [../data/taxonomy/v1-to-v2.json](../data/taxonomy/v1-to-v2.json). 검증 도구: [../schemas/taxonomy.schema.json](../schemas/taxonomy.schema.json), [../scripts/check-taxonomy.mjs](../scripts/check-taxonomy.mjs).

### 1.1 왜 이렇게 했는가

- [PRD.md](../PRD.md) PR-004는 "7개 상위 감정과 첨부 이미지의 모든 세부 감정을 버전·출처와 함께 보존한다"를 요구한다. 원자료를 고쳐 쓰는 것이 아니라 보존하는 것이 전제였다.
- 애초 계획은 원자료 손글씨 목록을 그대로 옮겨 적는 것이었다. 사용자가 "옮겨 적기 전에 심리학 리서치를 먼저 하라"고 지적했고, 이 지적이 D-038과 그 실행 계획인 `TASK-TAXONOMY`를 만들었다.
- 목표는 "전공자가 봐도 어색하지 않은 목록"이었다. 이 표현 자체는 판정 불가능해서, `TASK-TAXONOMY` §7이 반증 테스트·카테고리별 독립 문헌 2편·항목 근거 등급·C등급 상한 15%·최종 검수(D-027)로 조작화했다.

### 1.2 단계별로 실제 무엇을 했는가

1. **원자료 아카이빙(v1)** — `references/source/`의 손그림 이미지 2장을 194개 세부 감정으로 전사했다(즐거움 24 / 바램 13 / 슬픔 56 / 분노 28 / 기쁨 32 / 사랑 18 / 미움 23). SHA-256을 [references/manifest.json](../references/manifest.json)에 기록했다. 맞춤법을 고치지 않고 원문 그대로 옮겼다(예: 슬픔 `착찹한`, 바램 `후회스런`). 1차 통독 뒤 고배율 재확인 과정에서 자체적으로 5건을 바로잡았다(`접접한`→`찝찝한`, `우회스런`→`후회스런`, `창담한`→`참담한`, `튼튼한`→`든든한`, `우련한`→`후련한`). 이미지를 처음부터 다시 읽는 1차 자체 재대조에서는 추가 불일치가 없었고, 이어서 사용자가 원본 이미지 2장과 직접 대조해 확인했다(D-027, [TASK-TAXONOMY-V1.md](../tasks/TASK-TAXONOMY-V1.md) §7.8b). `v1.json`의 `review_status`는 `reviewed`다.
2. **문헌 조사** — 6개 축(A 기본정서 이론 / B 위계·prototype 분류 / C 차원 모형 / D 한국어 감정 어휘 / E 동기·기대 상태 / F 적대·혐오 구분)으로 나눠 읽기 전용 조사자 3명이 병렬로 조사했다. 문헌 상한 20편을 정확히 채웠다(A축 8편·B축 6편·C축 6편). 산출물은 [research/taxonomy-v2-sources-a.md](research/taxonomy-v2-sources-a.md)·[-b](research/taxonomy-v2-sources-b.md)·[-c](research/taxonomy-v2-sources-c.md).
3. **반증 테스트** — D-038이 미리 열거한 "전공자가 지적할 지점" 5건에 조사 중 새로 찾은 것을 더해 총 12건을 판정표에 올렸다(결과는 §1.6).
4. **카테고리 확정** — 7계열(즐거움·바램·슬픔·분노·기쁨·사랑·미움)에서 공포·혐오를 신설하고 바램을 희망으로 개명해 9계열로 확정했다.
5. **색·코드 연쇄** — 공포·혐오 두 계열의 50~900 색 램프를 기존 7계열과 같은 L\*·채도 프로파일로 유도하고 `node scripts/check-contrast.mjs --verbose`로 재검증했다(수치는 §1.7). `emotion_code`(D-022) 마이그레이션 규칙을 [DATA_MODEL.md](DATA_MODEL.md) §4.1에 추가했다.
6. **항목 귀속(T4)** — v1의 194개 항목을 9계열에 재배치했다. `v1-to-v2.json`은 195행이며 `keep` 181 / `move` 13 / `add` 1이고, v1의 두 코드(`anger-nauseating`·`hate-nauseating`, 둘 다 `구역질나는`)가 하나의 v2 코드(`disgust-nauseating`)로 합쳐지는 병합이 1건 있다.
7. **검수와 검증** — 사용자 최종 대조(D-027)를 2026-09-05에 마쳐 `v2.json`의 `review_status`가 `reviewed`로 바뀌었고(`user_cross_check_by: "user"`, `user_cross_check_date: "2026-09-05"`), 기계 검증(§1.3)과 다중 에이전트를 이용한 독립·적대적 검증(§1.5)을 거쳤다.

### 1.3 기계 검증 장치

`scripts/check-taxonomy.mjs`와 `schemas/taxonomy.schema.json`이 강제하는 것(근거: D-040, [DATA_MODEL.md](DATA_MODEL.md) §4.2):

- **등급을 사람이 정하지 않는다.** 항목마다 `evidence_level`(L1 전문 확인 / L2 초록 확인 / L3 2차 경유 / L4 근거 없음)과 `verification`(V1 writer가 원문 직접 대조 / V2 조사자 보고만) 두 값을 기록하면 `evidence_grade`가 `V1×L1=A, V1×L2=B+, V2×L1=B, 나머지=C` 표에서 파생된다. 원래는 writer가 귀속 기준 5개 중 몇 개를 만족하는지 세어 A/B/C를 매겼는데, 판정하는 사람이 채점까지 하면 C등급 15% 상한이 통제 역할을 하지 못한다는 것이 드러나 이 표로 바꿨다(§1.4).
- **`evidence_catalog`가 천장이다.** 출처(`evidence_ref`)마다 실제 확인 수준을 한 번만 선언하고, 개별 항목·계열은 그 값을 베낀다. 항목은 그보다 강한 수준을 주장할 수 없고, 정당하게 더 약하게 적으면(예: 범주 층위 근거가 개별 어휘 귀속까지는 지지하지 않을 때) `level_downgrade_reason`이 필수다.
- **아카이브 계층** — `source=raw`이고 `evidence_level=L4`인 항목(v1 원자료를 계열 변경 없이 그대로 둔 것)은 문헌 근거 없이 등급 B를 받는다. 근거는 PR-004이고 원칙은 "유지는 주장이 아니고 이동은 주장이다." 다만 이 B를 받으려면 `v1-to-v2.json`에서 실제로 `keep`이어야 하고, 검사기가 `v2.json`과 `v1-to-v2.json` 두 파일을 교차 검사해 "이동해 놓고 유지로 적어 B를 받는" 것을 막는다.
- **규모 보고 기계 강제** — 계열이 v1의 2배를 넘거나, 신설 계열의 발굴(`add`)이 이동(`move`/`keep`/`rename`)보다 많거나, 계열 항목이 5개 미만이면 `scale_report.acknowledged_categories`에 인지 기록이 있어야 검사를 통과한다. "사용자에게 알린다"는 절차를 문서 약속이 아니라 검사로 강제한 것이다.
- **인용 15단어 검사**(§6.4), D-022 code 접두어 규칙 검사, v1→v2 매핑 누락 0 검사.

문서화된 역테스트는 13건이다 — 등급 도출·A 완전성·D-022·매핑·schema·계열 근거 편수·C 비율·인용 길이·검수 증거를 겨냥한 10건([TASK-TAXONOMY-PLAN-V2.md](../tasks/TASK-TAXONOMY-PLAN-V2.md) §15.2)과 규모 보고 상/하한을 겨냥한 3건(같은 문서 §15.3)으로, 각각 격리된 fixture를 만들어 확인했다. 이후 아카이브 계층 예외, 출처 천장 규칙, 하향 사유 필수화, 계열 규모 하한(§1.4)이 추가됐지만, 이 추가분에 대한 역테스트 건수는 별도로 문서화돼 있지 않다 — `scripts/check-taxonomy.mjs` 코드 주석에 "아카이브 변경 1~4", "변경 1~5", "레드팀 결함 1~2"로만 표시돼 있다.

이 문서를 쓰면서 `node scripts/check-taxonomy.mjs`를 직접 실행해 통과를 확인했다(출력은 §1.7 수치의 출처).

### 1.4 과정에서 발견해 고친 것

- **1차 조사의 "정정" 2건이 모두 전문 대조에서 뒤집혔다.** 박인조·민경환(2005) 논문 제목과 손선주 외(2012)의 범주명("지루움"→"지루함")을 writer가 발행 플랫폼 표기를 따라 고쳤는데, 실제 전문을 확보해 보니 조사자 원안이 맞았다 — 원인은 발행 플랫폼 메타데이터를 논문 본문보다 위에 둔 것이었다([research/taxonomy-v2-sources-b.md](research/taxonomy-v2-sources-b.md) §4-B).
- **"전문 정독 0편"이라는 기록이 사실이 아니었다.** `TASK-TAXONOMY.md` §13의 "T2의 알려진 제한"이 "전문 정독 0편"이라고 적어 뒀는데, 같은 §13의 "재확인한 9건" 목록에 이미 전문까지 대조한 문헌이 들어 있어 그 문서 안에서도 모순이었다([research/taxonomy-v2-sources-a.md](research/taxonomy-v2-sources-a.md) 항목 8). 독립 재검증으로 전문 확보 문헌이 5편(Keltner 2019·Panksepp 2010·Posner 2005·손선주 2012·박인조 2005)까지 늘었고, 최종적으로 7편(Fischer 2018·Rozin 1999 추가, `v2.json`의 `fulltext_sources`)이 전문 확인으로 확정됐다.
- **`역겨운`이 원자료(v1)에 없었다.** 혐오 계열 신설의 근거로 든 오염 계열 어휘 두 개 중 하나였는데, v1 194개를 전수 확인한 결과 실재하지 않았다. 실제 대상은 `구역질나는` 하나뿐이었다(반증 표 지적 ⑤ 정정, [research/taxonomy-v2-decisions.md](research/taxonomy-v2-decisions.md)).
- **손선주 외(2012) 범주별 단어 목록(504단어)은 재사용 불가로 확정했다.** KoreaScience의 저작권 고지, KCI에 CCL 정보 없음, 학회 투고규정 제9조의 저작권 귀속, PDF 자체에 재사용 고지 없음 — 4개 출처가 일치했다(D-040). 그 결과 혐오 계열을 문헌 발굴 어휘로 채울 수 없었다.
- **`also_in`(D-022 복수 배치 필드)이 비어 있었다.** v1 전사 단계에서 카테고리 간 중복 라벨을 10건 확인해 놓고도 연결을 채우지 않은 채로 남아 있었다 — 계열마다 코드 슬러그가 달라(예: `sadness-agonized` vs `hate-tormented`) 문자열 패턴 매칭으로는 찾을 수 없었다. 지금 `v2.json`에는 18개 항목에 `also_in`이 채워져 있다.
- **검사기 자체의 결함을 순차로 발견해 고쳤다**(모두 `scripts/check-taxonomy.mjs` 코드 주석에 남아 있다).
  1. 항목 등급을 자동화한 뒤에도 **계열(카테고리) 등급은 여전히 사람이 매기는 값**이었다 — `category_evidence_refs`를 같은 등급표로 채점해 강한 순서로 정렬한 뒤 두 번째로 강한 등급을 쓰도록 바꿨다.
  2. **항목이 인용한 출처보다 강한 확인 수준을 주장할 수 있었다** — `evidence_catalog`를 천장으로 삼아 항목의 `evidence_level`이 출처의 실제 확인 수준을 넘지 못하도록 막았다.
  3. **그 천장 규칙을 넣고 나니 기존의 "전문 확보 문헌이 지지하면 빠짐없이 A" 완전성 조건과 정면 충돌해 오히려 과잉 등급을 강제했다** — 전문 출처를 인용하기만 하면 개별 어휘 수준 근거가 약해도 A를 요구하게 된 것이다. 조건의 방향을 뒤집어 "L1을 주장하는 항목은 실제로 전문 확보 출처를 가리켜야 한다"는 하한 검사로만 제한했다.
  4. **계열 규모 검사에 상한만 있고 하한이 없었다** — 항목이 극단적으로 적은 계열(혐오 3개)이 어느 임계에도 걸리지 않고 조용히 통과했다. 계열 항목이 5개 미만이면 규모 보고를 요구하는 하한을 추가했다.

### 1.5 다중 에이전트로 어떻게 검증했는가

- 판단(카테고리 확정·항목 귀속·등급 규칙 설계)은 주 에이전트가 맡고, 문헌 조사와 기계적 재검증은 읽기 전용 하위 에이전트(`researcher`, `verifier`)가 맡았다. 두 역할 모두 파일을 쓰지 않는다([AGENT_WORKFLOW.md](AGENT_WORKFLOW.md) §5, [TASK-TAXONOMY.md](../tasks/TASK-TAXONOMY.md) §4).
- **독립 재판정** — `후회스런`(원래 바램/희망 계열)은 독립 판정자 2명이 각각 최상 확신도로 슬픔 이동을 지적해 `sadness-rueful`로 옮겨졌다. 사유는 희망의 경계("중요하지만 확실하지 않은 특정 결과를 바라는" 상태, 미래·현재 지향)와 후회(과거 지향)의 시제가 반대라는 것이다(`v1-to-v2.json`의 해당 행).
- **적대적 검증** — "규칙을 지켰는가"가 아니라 "규칙 자체가 틀렸는가"를 공격해, 검사기 결함 2건(§1.4의 3번·4번)과 미움 재정의의 표면성(§1.6)을 찾아냈다([research/taxonomy-v2-decisions.md](research/taxonomy-v2-decisions.md) "‡" 각주, 2026-09-05 정정).
- **기계적 검증(T7a)** — 등급 도출 표 정합, C 비율, 계열 등급, v1 매핑 누락 0, `emotion_code` 규칙, 기존 계열 색 값 불변, `check-contrast` 전건, `verify:full`, TRACEABILITY 노드 참조를 verifier가 기존 도구로 재확인해 8/8 통과했다([DECISIONS.md](DECISIONS.md) D-038 정정 기록, [STATUS.md](STATUS.md), [TRACEABILITY.md](TRACEABILITY.md)).
- 출처 URI의 실재·내용 일치를 독립적으로 확인하는 절차(T7b)는 기존 조사 기록을 보여주지 않고 URI만 준 뒤 별도 인스턴스가 독립적으로 기술하게 하는 방식으로 **설계**됐다(D-040 사용자 결정 ③, [TASK-TAXONOMY-PLAN-V2.md](../tasks/TASK-TAXONOMY-PLAN-V2.md) §11). 이 저장소에는 T7a의 8/8 통과만 기록돼 있고, T7b가 실제로 실행된 결과 기록은 찾지 못했다 — `TASK-TAXONOMY.md` §12 체크포인트도 "T7 완료 선언 전에 §13에 기록 필요(T6 잔여)"라고 남겨, 그 부분이 아직 기록되지 않았음을 문서 스스로 표시하고 있다.

### 1.6 남은 약점

- **A등급 항목 0건.** 전문 7편을 확보했지만, 그 문헌들은 카테고리 층위(예: "공포는 기본 정서다")만 지지하고 개별 한국어 어휘가 어느 계열에 속하는지는 지지하지 않는다. 194개 항목 전부가 등급 B 또는 C이고, C등급 13건에는 각각 하향 사유가 적혀 있다.
- **반증 표 12건 중 해소 3건**(①②④), **부분 해소 2건**(③⑤), **해소 안 함 7건**(⑥⑦⑧⑨⑩⑪⑫)이다([research/taxonomy-v2-decisions.md](research/taxonomy-v2-decisions.md) §2).
- **카테고리 변경 3건에 실질적으로 기여한 문헌은 없다.** 공포 신설과 바램→희망 개명은 조사 시작 전에 사용자가 이미 방향을 정한 사안이었고, 혐오 신설은 조사자가 8계열 유지(혐오 계열을 신설하지 말 것)를 권고했으나 사용자가 그 권고를 기각한 결과다([TASK-TAXONOMY-PLAN-V2.md](../tasks/TASK-TAXONOMY-PLAN-V2.md) §2). 문헌 조사는 사후에 경계 문장과 존치 근거를 붙이는 역할을 했다.
- **9계열은 문헌이 지지하는 상위 범주 개수 범위(5~7)를 벗어난다.** 상한을 9로 정한 실질 근거는 문헌이 아니라 색상 대비 계산이다(반증 표 지적 ⑫).
- **혐오 계열은 항목 3개뿐이다**(`구역질나는`·`떫은`·`혐오스러운`). `scale_report`에 남긴 사용자 인지 기록을 그대로 옮기면: "계열 근거 자체(`category_grade`)는 A등급이지만 실제 어휘 기반은 3개로 약하다." 손선주 외(2012)의 단어 목록이 재사용 불가라 문헌 발굴로 어휘를 보충할 수 없었던 것이 직접 원인이다.
- **미움 재정의가 정의 문장만 바꿨다.** 경계를 "특정 사람·집단을 향한 지속적 적대"로 재정의했지만, 현재 미움 계열 21개 중 14개(`고통스러운`·`괴로운`·`귀찮은`·`근심스러운`·`무정한`·`부담스러운`·`싫은`·`싫증나는`·`억울한`·`죄책감`·`지겨운`·`짜증스러운`·`차가운`·`황량한`)는 그 정의에 맞지 않는다. 검사기는 아카이브 항목의 의미가 계열 경계와 맞는지 검사하지 않으므로 이 불일치는 자동으로 잡히지 않는다.

### 1.7 최종 수치

`data/taxonomy/v2.json`·`v1-to-v2.json`과 `node scripts/check-taxonomy.mjs`·`node scripts/check-contrast.mjs --verbose` 실행 결과에서 직접 확인.

| 항목 | 값 |
| --- | --- |
| 계열 수 | 9 (기존 7 + 신설 2: 공포·혐오) |
| 세부 감정 총수 | 194 (v1과 동일 — 병합 1건과 발굴 1건이 상쇄) |
| 계열별 개수 | 즐거움 24 / 희망 12 / 슬픔 53 / 분노 23 / 기쁨 32 / 사랑 18 / 미움 21 / 공포 8 / 혐오 3 |
| 항목 등급 분포 | A 0 / B+ 0 / B 181 / C 13 |
| C등급 비율 | 6.7%(13/194, 상한 15% 이내) |
| 계열 등급 | A — 슬픔·분노·기쁨·공포·혐오(5) / B+ — ~~희망·사랑(2)~~ **[정정, 2026-09-05] 즐거움·희망·사랑(3)** / C — ~~즐거움·미움(2, 둘 다 `shortfall_note_ko` 있음)~~ **[정정, 2026-09-05] 미움(1)** — `shortfall_note_ko`는 즐거움(B+)·미움(C) 둘 다 여전히 있다(즐거움은 독립 문헌 1편뿐이라 등급과 무관하게 명시가 필수) |
| 전문(L1) 확보 출처 | 7편 — Keltner 외 2019, Panksepp 2010, Posner 외 2005, 손선주 외 2012, 박인조·민경환 2005, Fischer 외 2018, Rozin 외 1999 |
| v1→v2 매핑 행 수 | 195 (`keep` 181 / `move` 13 / `add` 1) |
| 병합 | 1건 — `anger-nauseating` + `hate-nauseating`(둘 다 `구역질나는`) → `disgust-nauseating` |
| 계열 색차(ΔE) | `check-contrast.mjs` 216건 전건 통과, 최솟값 7.23(희망-사랑, light chip fill) |
| 검수 상태 | `review_status: reviewed`(2026-09-05, `user_cross_check_by: "user"`) |

**참고**: [STATUS.md](STATUS.md), [DECISIONS.md](DECISIONS.md) D-038, [TRACEABILITY.md](TRACEABILITY.md), [../references/README.md](../references/README.md)는 이 기록 시점 기준으로 `review_status: pending_user_review`(사용자 최종 대조 대기)라고 적고 있으나, `data/taxonomy/v2.json`은 이미 `reviewed`로 갱신돼 있다. 이 문서는 데이터 파일을 직접 확인해 최신 값을 반영했다 — 위 네 문서의 동기화는 이 기록의 소유 범위 밖이다.
