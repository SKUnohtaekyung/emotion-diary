# TASK-TAXONOMY-V1 — 원자료 세부 감정 v1 전사 (새 세션 인계)

## 상태

`done` — 2026-09-04 작성, 같은 날 전사와 검수 모두 완료. §7의 전체 절차(전사 → 1차 자체 재대조 → D-027 사용자 최종 대조)를 마쳤다. `data/taxonomy/v1.json`의 `review_status`는 `reviewed`이고 `harness/work-graph.yaml`의 `taxonomy-v1`은 `done`이다.

이 작업은 끝났다. `TASK-TAXONOMY`의 T4(항목 귀속과 매핑)가 이 파일의 산출물을 확정 입력으로 쓴다.

## 1. 목표

`references/source/`의 이미지 2장(감정 원자료)을 한 글자도 빠짐없이 `data/taxonomy/v1.json`으로 옮겨 적고, `source-fidelity` 게이트(§4)를 통과시킨다. 이 파일이 나오면 `TASK-TAXONOMY`의 T4(항목 귀속과 매핑)가 차단에서 풀린다.

## 2. 범위

- **포함**: 이미지 2장의 카테고리·세부 감정 라벨 전사, 카테고리별 독립 `emotion_code` 발급(D-022), source hash 기록, 1차 자체 재대조, D-027 검수(시간 분리 2회 또는 사용자 최종 대조).
- **제외**: taxonomy v2 리서치·귀속(=`TASK-TAXONOMY` T2~T7 소관, 이 작업은 그 입력만 만든다), 새 단어 추가/수정/재구성(v1은 순수 아카이브, PR-004 — "고쳐 쓰기"는 v2의 일), 색 계열·캐릭터 자산 신규 제작(이미 `design/tokens.json`·`design/characters/`에 있다 — 이 작업은 대조용 참조만 남긴다), 앱 코드.
- **불변**: 원본 이미지·`references/manifest.json` 편집 금지(읽기 전용, PR-004). 카테고리 수·구성을 바꾸지 않는다 — v1은 원자료 그대로 7개(즐거움·바램·슬픔·분노·기쁨·사랑·미움)다. 공포·혐오는 D-038의 v2 신설 계열이며 원본 이미지에 없으므로 v1에 넣지 않는다.

## 3. 연결 요구사항

- `PR-004`(세부 감정을 버전·출처와 함께 보존), `PR-001`(비진단 — 전사는 원문 그대로, 해석·재구성 금지).
- 관련 결정: D-022(`emotion_code` 형식), D-027(1인 검수 대체 절차), D-038(v1은 출처 보존용, v2가 재구성).
- 게이트: `source-fidelity` = `[source-hashes-recorded, taxonomy-one-to-one-review, user-or-human-review]` (`harness/quality-gates.yaml`, 라벨 정의는 `docs/EVAL_PLAN.md` §14).
- work-graph 노드: `taxonomy-v1`(`harness/work-graph.yaml`) — `depends_on: [bootstrap-audit]`. bootstrap-audit의 원자료 검증(byte/SHA-256)은 `scripts/verify.mjs`가 `references/manifest.json` 대조로 이미 상시 수행 중이고 이번 세션에서도 quick/full 모두 PASS했다 — **이 의존성은 이미 충족된 상태**이므로 node status를 `blocked`→`ready`로 정정해 둔다(§8).

## 4. 소유권

- Main/Writer: 주 에이전트 1명.
- 소유 파일(신규): `data/taxonomy/v1.json`, 이 파일.
- 소유 파일(기존, 상태만 갱신): `harness/work-graph.yaml`(`taxonomy-v1` 노드의 `status`만), `docs/TRACEABILITY.md`·`docs/STATUS.md`·`references/README.md`(전사 완료 반영), `tasks/TASK-TAXONOMY.md`(§12 체크포인트에 "v1 존재" 갱신 — 그 파일 자체의 다른 절은 건드리지 않는다), `tasks/CURRENT_TASK.md`(TASK-BOOTSTRAP의 G3 체크리스트 항목 갱신).
- **읽기 전용**: `references/source/*.jpg`, `references/manifest.json` — 절대 편집하지 않는다.
- **충돌 주의**: `harness/work-graph.yaml`은 명목상 TASK-BOOTSTRAP 소유이지만 TASK-BOOTSTRAP 자신의 계획(`tasks/CURRENT_TASK.md`)에 "[ ] G3 taxonomy-v1 전사+사용자 검수"가 이미 들어있어 이 작업은 그 항목을 실행하는 것이다 — `taxonomy-v1` 노드 한 줄 외에는 손대지 않는다. `docs/TRACEABILITY.md`·`docs/STATUS.md`는 `TASK-TAXONOMY`도 건드리므로 시작 전 `git status`로 다른 세션의 미커밋 변경을 반드시 확인한다(AGENTS §2).

## 5. 원자료 요약 (2026-09-04, 이 세션이 이미지를 직접 읽고 확인 — 전사는 아직 안 함)

읽기는 했지만 아래는 **정식 전사가 아니라 다음 세션이 무엇을 다루게 될지 가늠하기 위한 요약**이다. 실제 코드·라벨 발급은 §7 절차에서 이미지를 다시 보며 수행한다.

| 이미지 | 카테고리(원문 표기) | `category_code`(D-022, `docs/DATA_MODEL.md` §4.1 기준) | 세부 감정 대략 개수 |
| --- | --- | --- | --- |
| `emotion-words-joy-hope-sadness.jpg` | 즐거움 | `enjoyment` | 약 20개 |
| 〃 | 바램 | `wish` | 약 15개 |
| 〃 | 슬픔 | `sadness` | 약 30개 |
| `emotion-words-anger-happiness-love-hate.jpg` | 분노 | `anger` | 약 20개 |
| 〃 | 기쁨 | `joy` | 약 24개 |
| 〃 | 사랑 | `love` | 약 15개 |
| 〃 | 미움 | `hate` | 약 20개 |

개수는 눈대중이며 §7에서 실제로 세어 확정한다. 각 카테고리 옆에 손그림 캐릭터가 있는데, 이미 `design/characters/`에 같은 무드로 별도 제작된 자산이 있으므로 이 작업에서 새로 만들지 않고 `character_asset` 필드에 기존 경로만 채운다.

## 6. 산출물 규격 — `data/taxonomy/v1.json`

`docs/DATA_MODEL.md` §4의 canonical 스켈레톤을 그대로 따른다:

```json
{
  "version": "emotion-ko-v1",
  "source_files": [
    "references/source/emotion-words-joy-hope-sadness.jpg",
    "references/source/emotion-words-anger-happiness-love-hate.jpg"
  ],
  "review_status": "pending_user_review",
  "categories": [
    {
      "code": "enjoyment",
      "label_ko": "즐거움",
      "color_token": "emotion.enjoyment (design/tokens.json)",
      "character_asset": "design/characters/... (기존 경로 확인 후 채움)",
      "emotions": [
        { "code": "enjoyment-<slug>", "label_ko": "가벼운" }
      ]
    }
  ],
  "review": {
    "first_pass_by": null,
    "first_pass_date": null,
    "second_pass_by": null,
    "second_pass_date": null,
    "user_cross_check_by": null,
    "user_cross_check_date": null
  }
}
```

- `emotions[].code`는 D-022 형식 `<category_code>-<slug>`. slug는 라벨의 로마자 표기가 아니라 의미가 통하는 영문 슬러그로 만들되(예: "가벼운" → `light`), 카테고리 간 같은 한글 라벨이라도 코드는 독립 발급한다(`docs/DATA_MODEL.md` §3.2 — 가벼운·흐뭇한·뿌듯한·포근한·고통스러운·구역질나는·황량한이 실제 중복 사례로 이미 특정돼 있다).
- 배열 순서는 이미지에 실제로 쓰인 순서를 그대로 따른다(따로 정렬하지 않는다) — 저장 스키마에 별도 순서 필드는 없다(diary_emotions의 `display_order`는 사용자가 일기에서 고른 순서를 뜻하는 다른 필드이며 taxonomy 파일과 무관).
- `review_status`는 완료 전까지 `"pending_user_review"`를 유지한다. §7의 검수를 마치면 `"reviewed"`로 바꾸고 `review` 블록의 날짜·검수자를 채운다.

## 7. 절차 (실행 세션이 그대로 따름)

1. `git status`로 미커밋 변경 확인 — 다른 세션의 변경이 있는 파일은 건드리지 않는다.
2. `npm run verify:quick` 실행 — `references/manifest.json` 해시 대조가 포함돼 있으므로 PASS 확인으로 원자료 무결성 재검증을 대신한다.
3. 이미지 2장을 Read로 직접, 처음부터 다시 읽는다(§5는 참고용 눈대중일 뿐 입력으로 쓰지 않는다).
4. 카테고리마다 세부 감정 라벨을 **전부** 옮겨 적는다. 새 단어를 추가하거나 표기를 고치지 않는다(맞춤법이 특이해 보여도 원문 그대로 — 재구성은 v2의 일).
5. §6 스키마대로 `emotion_code`를 카테고리별 독립 발급한다.
6. **1차 자체 재대조**: 작성을 마친 뒤 이미지를 다시 한번 보며 항목을 1:1로 확인한다. 빠뜨린 단어·오탈자·잘못된 카테고리 배정을 찾아 고치고, 무엇을 고쳤는지 §9 체크포인트에 남긴다(`TASK-TAXONOMY`의 T2가 쓴 "재확인 ★" 방식과 동일).
7. `data/taxonomy/v1.json` 저장.
8. **D-027 최종 검수** — 아래 중 하나:
   - (a) 시간 분리 2회: 지금 저장하고 **24시간 이상 지난 뒤** 원본 이미지와 다시 대조. 또는
   - (b) 사용자 최종 대조: 사용자에게 `data/taxonomy/v1.json`과 원본 이미지 2장을 함께 보이고 직접 확인받는다.
   - 어느 쪽이든 검수자·날짜를 `review` 블록에 기록하고 `review_status`를 `"reviewed"`로 바꾼다. **이 단계 없이 완료로 보고하지 않는다.**
9. `harness/work-graph.yaml`의 `taxonomy-v1` 노드 status를 검수 완료 시 `done`으로 갱신.
10. `docs/TRACEABILITY.md`·`docs/STATUS.md`·`references/README.md`에 v1 완료를 반영하고, `tasks/TASK-TAXONOMY.md` §12 체크포인트에 "v1 전사 완료, `data/taxonomy/v1.json` 존재 → T4 착수 가능"을 추가한다(그 파일의 다른 절은 건드리지 않는다).
11. `npm run verify:quick`·`npm run verify:full` PASS 확인.
12. **바로 이어서 `TASK-TAXONOMY.md`의 T4로 넘어갈 수 있다** — 그 파일 §10 T4·§9.3에 이미 산출물 규격과 완료 기준이 있으므로 이 파일에서 다시 정의하지 않는다.

## 8. 체크포인트

- 완료: 계획 수립(2026-09-04). 이미지 2장을 눈으로 확인해 카테고리·대략적 규모를 §5에 기록했다. `harness/work-graph.yaml`의 `taxonomy-v1` node status를 `blocked`→`ready`로 정정했다(원자료 검증 의존성은 이미 충족).
- 완료(2026-09-04, 전사 세션): §7의 1~7·10·11단계. `data/taxonomy/v1.json` 생성 — **7계열 194개**(즐거움 24 / 바램 13 / 슬픔 56 / 분노 28 / 기쁨 32 / 사랑 18 / 미움 23). §5의 눈대중 개수(약 20/15/30/20/24/15/20 = 약 144)는 실제와 크게 달랐다 — 실측이 정본이다. `verify:quick`·`verify:full` PASS. 커밋은 하지 않았다.
- 전사 중 자체 정정(첫 통독 → 고배율 재확인에서 바로잡은 것): 바램 `접접한`→**`찝찝한`**, 바램 `우회스런`→**`후회스런`**, 슬픔 `창담한`→**`참담한`**, 기쁨 `튼튼한`→**`든든한`**, 기쁨 `우련한`→**`후련한`**. §7.6의 1차 자체 재대조(파일 작성 후 이미지를 처음부터 다시 읽어 1:1 대조)에서는 **추가 불일치 0건**이었다.
- 교차 검증: `docs/DATA_MODEL.md` §3.2가 이미 특정해 둔 카테고리 간 중복 label 7개(가벼운·흐뭇한·뿌듯한·포근한·고통스러운·구역질나는·황량한)가 전사본에 **모두** 나타났다. 추가로 3개(**흥분된** 즐거움/기쁨, **괴로운** 슬픔/미움, **뭉클한** 슬픔/기쁨)가 더 있다 — §3.2의 목록은 "예"이므로 모순이 아니다. 전부 카테고리별 독립 code로 발급했다.
- 원본 특징(전사 그대로 보존): 즐거움·바램·슬픔·기쁨·사랑·미움은 한글 자모 순서로 쓰여 있으나 **분노는 아니다** — `가혹한`·`배반감`·`모욕적`·`무서운`·`떫은`이 순서에서 벗어난 자리에 있다(후일 끼워 넣은 것으로 보인다). 기쁨의 `고전적인`·`가벼운`도 같다. 정렬하지 않고 쓰인 자리 그대로 두었다. 맞춤법도 원문 유지(`착찹한`, `후회스런`). 분노의 `기분이 상하는`은 원문에 어절 사이 공백이 있어 그대로 뒀다.
- 완료(2026-09-04, 검수): 사용자가 `data/taxonomy/v1.json`을 원본 이미지 2장과 직접 대조하고 "문제없다"고 확인했다(D-027 §7.8b). `review` 블록의 `user_cross_check_by`("user")·`user_cross_check_date`(2026-09-04)를 채우고 `review_status`를 `"reviewed"`로 바꿨다. `harness/work-graph.yaml`의 `taxonomy-v1`을 `ready`→`done`으로 갱신했다(§7.9). `docs/TRACEABILITY.md`·`docs/STATUS.md`·`references/README.md`·`tasks/TASK-TAXONOMY.md`·`tasks/CURRENT_TASK.md`를 검수 완료로 동기화했다(§7.10). `npm run verify:quick`·`--mode full` PASS.
- 다음: 없음 — 이 작업은 끝났다. 후속은 `TASK-TAXONOMY`의 T4.
- 실패: 없음.
- 참고: 병행 세션이 T4용 리서치 계획을 재검토해 `tasks/TASK-TAXONOMY-PLAN-V2.md`를 새로 썼다(치명적 결함 8건, 사용자 결정 4건 반영). 이 파일 소유 범위 밖이라 내용은 다루지 않았다.
