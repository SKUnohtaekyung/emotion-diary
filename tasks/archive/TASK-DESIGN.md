> **아카이브(2026-09-20, TASK-INFRA-01).** `tasks/CURRENT_TASK.md`에서 옮긴 기록이다. 옮기기 직전 커밋은 `b54a0a2`이고 아래 본문은 옮기기 전과 바이트 그대로다. **상태:** done(결정, 2026-09-04) + 실행 항목 1~3 완료(2026-09-17~19). 남은 실행 항목 둘(실기기 확인, 위기 안내 연락처 값 검수)은 docs/STATUS.md §4로 옮겼다. 이 파일의 `- 소유 파일:` 선언은 scope-guard에 더 이상 반영되지 않는다 — 훅은 `CURRENT_TASK.md`만 읽는다.

# TASK-DESIGN — 디자인 시스템 검수와 확정 (새 세션 인계)

> **다른 세션에 알림 (2026-09-04, TASK-DS-REF 담당자용).** `tasks/TASK-DS-REF.md`가 쓰인 뒤 이 세션이 **D-037·D-038을 사용했다.** 다음 신규 번호는 **D-039**다(`docs/DECISIONS.md` 마지막 행으로 항상 재확인할 것 — TASK-DS-REF §8 T0 절차 그대로).
>
> **번호 갱신 (2026-09-04, TASK-TAXONOMY 세션).** 위 안내는 그대로 유효하다 — **D-039는 TASK-DS-REF 몫으로 비워 두었다.** TASK-TAXONOMY는 그 다음인 **D-040**을 `reserved` 행으로 선점했으므로 `docs/DECISIONS.md`의 마지막 행은 D-040이지만, TASK-DS-REF는 **D-041이 아니라 비어 있는 D-039를 쓴다.**
>
> 또한 TASK-DS-REF §3·§7의 "불변" 목록 중 **두 항목이 D-037로 대체됐다**:
> - D-035의 **카테고리 2줄 격자** → **아크 휠**(2줄 격자는 큰 글자 폴백 규격으로만 남음)
> - D-036의 **강도 2줄 세그먼트** → **슬라이더 + 숫자 + −/+ 스테퍼**
>
> 그리고 세부 감정 선택이 **chip 격자 → 소프트 리스트**로 바뀌었고 chip은 표시 전용이다. §6 구성요소 규칙을 보강할 때 정본(`docs/DESIGN_SYSTEM.md` §6.2/§6.3/§6.3.1/§6.4)을 기준으로 하고 TASK-DS-REF 파일의 요약을 기준으로 삼지 않는다. D-034(색·글꼴·light 전용)와 D-036의 나머지(앵커 한 줄, 위기 톤, 브랜드, 탐색 아이콘, 4pt 밀도·달력 `1fr`)는 그대로 유효하다.
>
> **Codex 세션 인계 (2026-09-07, 이미지 생성).** 캐릭터 9종의 컨셉·프롬프트·근거 조사가 전부 끝났다 — **남은 건 실행뿐이다.** Claude Code 세션에는 이미지 생성 도구가 없어(`codex` CLI가 이 컴퓨터의 PATH에 없고, 전역 `~/.codex/config.toml`은 있지만 Claude Code에서 호출할 권한·이유가 없음) 이 단계부터 Codex가 이어받는다.
> 1. `design/characters/prompts.json`을 그대로 정본으로 쓴다 — `common_style_prompt` + 각 `characters[].subject_prompt`를 이어 붙이고 `negative_prompt`를 부정 프롬프트로 준다. **9개를 한 번에, 같은 seed로** codex imagegen에 넘긴다(하나만 나중에 다시 만들면 선 굵기·채도가 어긋난다 — `design/characters/README.md` §1).
> 2. 결과를 `design/characters/src/<key>-1024.png`(원본, 1024×1024)에 저장하고, `design/characters/<key>.png`(배포용, 120×120, 투명 배경 유지)로 축소해 저장한다. `<key>`는 `enjoyment wish sadness anger joy love hate fear disgust` 9개(`prompts.json`의 `characters` 배열 순서).
> 3. `node scripts/check-characters.mjs`로 파일 유무·크기·투명 배경을 기계 검사한다. 이어서 `design/characters/README.md` §3의 눈 검수 체크리스트(40px 판독성, 9종 통일감, 흑백 구별, 표정 안전성)를 직접 확인한다.
> 4. 통과하면 `npm run verify:quick`을 실행하고, 결과를 이 파일의 체크포인트에 짧게 남긴다. **커밋은 사용자가 지시할 때만** 한다(AGENTS.md §2.1 — 이 규칙은 Claude Code 전용 훅이 아니라 두 에이전트 공통 계약이다).
> 생성 도구는 **codex imagegen 직접 호출 하나뿐**이고 다른 이미지 생성 스킬·플러그인·외부 API는 쓰지 않는다(D-035). 9종의 동물·자세·색 결정 근거는 `docs/research/character-animal-evidence.md`, 결정 기록은 `docs/DECISIONS.md` D-043·D-044 — 자세를 임의로 바꾸지 말고, 바꿔야 할 이유를 발견하면 결정 기록부터 갱신한다.

## 상태

`done(결정)` — 2026-09-02 사용자 요청("디자인 시스템 잡아야 할 것 같다", "새 세션에서 대화하며 정하고, 프리뷰로 계속 확인하고 싶다"). 2026-09-04 세션에서 체크리스트 10건을 모두 확정하고(D-034·D-035·D-036) **D-033을 accepted로 전환**했다. 이어서 사용자가 레퍼런스를 제시해 감정 입력 방식을 다시 정했다 — **D-037**: 강도 슬라이더(세그먼트 대체), 카테고리 아크 휠(2줄 격자 대체), 세부 감정 소프트 리스트(chip은 표시 전용). 세부 감정 목록의 심리학적 타당성은 ~~**D-038**(provisional)로 분리했다.~~ **[정정, 2026-09-05]** **D-038**로 분리했었고, TASK-TAXONOMY의 taxonomy v2 리서치가 끝나 **D-038은 accepted로 종결됐다**(9계열 194개, 사용자 최종 대조 2026-09-05, `docs/DECISIONS.md`). 남은 것은 결정이 아니라 실행·리서치다.

- 소유 파일: `docs/DESIGN_SYSTEM.md`, `design/tokens.json`, `design/characters/prompts.json`, `design/characters/README.md`, `design/characters/src/*.png`, `design/characters/*.png`, `design/style-guide.html`, `scripts/check-contrast.mjs`, `scripts/check-characters.mjs`, `docs/DECISIONS.md`, `docs/research/character-animal-evidence.md`, 이 파일. **[정정, 2026-09-06]** 이슈 #26(캐릭터 9종) 작업 시작 시 선언했어야 했는데 누락돼 `claude-scope-guard.mjs`가 매번 확인을 요구했다 — 뒤늦게 추가. **[추가, 2026-09-07]** 이미지 출력 경로(`src/*.png`, `*.png`) 추가 — Codex가 생성할 산출물.

## 정본과 산출물

- 정본: `docs/DESIGN_SYSTEM.md`(원칙·색·글자·간격·구성요소·접근성·금지 사항), 값: `design/tokens.json`, 색 검사: `scripts/check-contrast.mjs`(quick 하네스에 포함, 144건 = WCAG 대비 60 + 감정 계열 색차 ΔE 84), 캐릭터 자산 규격 검사: `scripts/check-characters.mjs`(quick 하네스, 자산 미제작이면 pending).
- 캐릭터 생성 프롬프트 정본: `design/characters/prompts.json`, 제작·검수 절차: `design/characters/README.md`.
- 시각 미리보기(저장소): `design/style-guide.html`. 로컬 서버 `node scripts/preview.mjs 4173` → `http://localhost:4173/`. Claude Code 브라우저 pane에서는 `.claude/launch.json`의 `design-preview` 구성을 `preview_start`로 열면 된다.
- 시각 미리보기(공유 링크, 같은 내용): https://claude.ai/code/artifact/8673a33c-900c-4273-8592-0fb3bdcc36a9 — 새 세션에서 갱신하려면 Artifact 도구에 `url`로 이 주소를 넘겨 재발행한다(먼저 `read`).

## 새 세션 작업 루프

1. 사용자와 항목별로 대화해 결정한다(아래 체크리스트). 결정은 `docs/DECISIONS.md` D-033 행 갱신(또는 D-034+ 신규)과 `docs/DESIGN_SYSTEM.md`·`design/tokens.json`에 같은 commit으로 반영한다.
2. 값을 바꾸면 `node scripts/check-contrast.mjs --verbose`로 대비와 계열 색차를 확인하고, `design/style-guide.html`의 `:root` 토큰과 dark-panel 인라인 값을 함께 고친다(현재 미리보기는 tokens.json을 자동 로드하지 않는다 — 자동화는 아래 후속).
3. 미리보기를 다시 열어 사용자가 확인하게 한다: 브라우저 pane(`design-preview`)과 Artifact 재발행(위 URL). 휴대폰 확인이 필요하면 Artifact 링크를 공유한다.
4. `npm run verify:quick` → commit → `git push origin main`.

## 결정 체크리스트 (사용자와 정할 것)

- [x] 7개 감정 색 계열 — **결정(D-034)**: 바램·미움이 ΔE 3.3~7.0으로 사실상 같은 색이던 결함을 발견해 원자료의 밝기 관계로 되돌렸다(바램 = 가장 옅은 라일락 `#A855CE`, 미움 = 가장 짙은 남색·보라 `#4750A6`). 기쁨 light 강조는 `#9A7A08`(올리브) → `#B08A00`(3.24:1).
- [x] chip 규칙과 선택 표시 — **결정(D-035 → D-037로 역할 변경)**: 값(fill 100 / border 300 / text 900)은 그대로지만, chip은 **선택 조작에서 빠지고 표시 전용**이 됐다(트레이·기록 카드·범례·AI 후보). 세부 감정 선택은 소프트 리스트가 맡는다.
- [x] 카테고리 선택기와 캐릭터 아이콘 — **결정(D-035 → D-037로 대체)**: 2줄 격자 대신 **아크 휠**(반지름 460, 간격 7.6°, 회전 45%, 관성 스냅). 2줄 격자는 큰 글자 폴백 규격으로만 남는다. 아이콘 40px는 유효. 캐릭터는 원자료와 같은 손그림 수채 무드로 codex imagegen 생성, 투명 PNG(원본 1024 / 배포 120). 프롬프트·규격·검수는 `design/characters/`. **자산 생성은 아직 안 했다 —** ~~taxonomy v1 검수와 함께 진행.~~ **[정정, 2026-09-05] taxonomy v2 확정(9종, 공포·혐오 신설, 2026-09-05 사용자 최종 대조 완료)으로 선행 조건이 바뀌었고 이제 충족됐다 — 생성 자체는 여전히 TASK-DESIGN 실행 몫이다(`design/characters/prompts.json`은 아직 7개 항목).**
- [x] 강도 선택기 — **결정(D-036 → D-037로 대체)**: 2줄 세그먼트 대신 **슬라이더 + 숫자 + −/+ 원형 스테퍼**(감정 3개 기준 536px → 380px). 앵커 문구 한 줄 규칙(1~3 / 4~7 / 8~10)은 그대로 유지.
- [x] 글꼴 — **결정(D-034)**: 웹폰트를 싣지 않고 시스템 한글 글꼴만 쓴다. 스택이 Pretendard를 먼저 찾으므로 나중에 `@font-face`만 추가하면 토큰 변경 없이 전환된다.
- [x] 다크 모드 — **결정(D-034)**: MVP는 light 전용. dark 토큰과 대비 검사는 유지하되 화면에는 적용하지 않고, 나중에 적용해도 앱 내 토글은 두지 않는다.
- [x] 밀도 — **결정·정정(D-036)**: 4pt 단계 이탈(gap 6/10, padding 14, radius 3/6)을 정정했다. **결함**: 달력이 `repeat(7,44px)`+gap 6이라 360px에서 344px로 가로 넘침이 있었고 `1fr`(열 간격 0, 줄 간격 4)로 고쳐 45.7×44가 됐다. 남은 예외는 선택된 chip 좌우 패딩 11(2px 테두리 광학 보정) 하나. 360px 실측 가로 넘침 0.
- [x] 위기 안내 문구 톤 — **결정(D-036)**: 현재 톤 유지("지금 안전이 먼저예요" + 도움 요청 안내 + 진단·위기 대응 서비스가 아님 명시). **연락처 값 자체는 여전히 검수 대기.**
- [x] 하단 탐색 — **결정(D-035·D-036)**: 이름은 오늘·달력·통계·설정, 아이콘은 비활성 선(outline) / 활성 면(filled)로 색 외 단서를 준다.
- [x] 브랜드 — **결정(D-036)**: 앱 이름 "감정일기"만 쓰고 로고·워드마크는 만들지 않는다. PWA 아이콘이 필요해지면 캐릭터 자산 중 하나를 쓴다.

## 후속 작업(선택)

- `design/style-guide.html`이 `design/tokens.json`을 fetch해 CSS 변수를 생성하도록 바꾸면 값 이중 관리가 사라진다(Artifact는 외부 fetch가 막히므로 발행 시 인라인 필요). 지금은 손으로 맞추며, 값이 어긋나도 하네스가 잡아 주지 못한다 — 이중 관리가 남은 유일한 자리다.
- 캐릭터 단색 아이콘 ~~7종(`design/characters/`)은 taxonomy v1 검수와 함께 제작.~~ **[정정, 2026-09-05] 목표가 9종으로 바뀌었다**(공포·혐오 신설). taxonomy v2 확정(2026-09-05 사용자 최종 대조 완료)에 따라 이제 제작 가능하며, 시점·절차는 아래 "다음(실행·리서치)" 2번을 따른다(`design/characters/prompts.json`은 아직 7개 항목).
- 실기기(iPhone Safari·Android Chrome)에서 chip 대비와 44px 터치 영역 확인.

## 체크포인트

- 완료(2026-09-02): D-033 provisional, DESIGN_SYSTEM/tokens/check-contrast/style-guide 작성, quick 하네스에 대비 검사 통합, README·UX §8·TRACEABILITY·STATUS 연결, Artifact 발행.
- 완료(2026-09-04): 체크리스트 4건 확정 → D-034 accepted. **결함 1건 발견·수정**: 바램·미움 계열이 CIEDE2000 ΔE 3.3(chip 글자)/4.2(chip fill)/7.0(강조)/5.6(dark 강조)으로 구별 불가였다. D-022 때문에 chip의 카테고리 색이 같은 표기 감정의 유일한 구분 단서라 기능 결함이었고, 원자료의 밝기 관계(바램 가장 옅음·미움 가장 짙음)로 되돌려 최솟값 7.2/18.8/11.3/13.3로 회복했다. 재발 방지로 `check-contrast.mjs`에 계열 색차 검사(ΔE≥7, 84건)를 추가했고 옛 값으로 되돌리면 실패하는 것을 확인했다. tokens/DESIGN_SYSTEM/style-guide/STATUS/TRACEABILITY/verify.mjs를 같은 commit에서 갱신.
- 완료(2026-09-04, 2차): 체크리스트 3건 추가 확정 → D-035 accepted. 캐릭터 자산 파이프라인 세팅(`design/characters/prompts.json` 공통 프롬프트 + 7종, `README.md` 규격·검수, `scripts/check-characters.mjs` 자동 검사를 quick 하네스에 연결). 검사는 4개 경로(pending / 7종 정상 / 크기 불일치 / 투명도 없음)를 합성 PNG로 확인했다.
- 완료(2026-09-04, 3차): 남은 체크리스트 4건 + 탐색 아이콘 확정 → D-036 accepted, **D-033 accepted 전환**. 밀도 감사로 4pt 이탈을 정정하고 달력 가로 넘침 결함을 고쳤다. `DESIGN_SYSTEM`에 §7 브랜드를 신설(이후 절 8~12로 재조정, 상호 참조 동반 수정), 스타일 가이드에 하단 탐색 절 추가.
- 완료(2026-09-04, 4차): 사용자 레퍼런스(아크 휠·range slider) 검토 → **D-037** accepted. 시안 2종을 만들어 실측 비교했다(세그먼트 536px vs 슬라이더 380px, 아크 7개 중 5개 가독, 세부 감정 51개 중 아크는 5개만 노출·복수 선택 불가). 아크는 반지름 560→460·간격 8.6°→7.6°로 조정해 7개가 모두 화면에 들어오게 하고, 회전을 접선의 45%로 낮춰 한글 가독성을 확보했으며, listbox·activedescendant·aria-live·화살표 키·reduced-motion 대응을 넣었다. 스타일 가이드에 세 구성요소를 동작하는 형태로 이식했다. 세부 감정 목록의 심리학적 타당성은 **D-038**(provisional)로 분리 기록.
- 완료(2026-09-06, 2차, 이슈 #26): 공포·혐오 캐릭터 컨셉을 사용자와 대화로 확정한 뒤(1차, 위 항목 2 참고), 사용자가 "심리학 전문 지식 근거가 있는지" 직접 질문해 **9종 전체의 행동과학 근거를 조사자 에이전트 3개(백그라운드)로 사후 점검**했다 — 상세는 `docs/research/character-animal-evidence.md`, 결정은 **D-043** accepted(이후 D-044로 대체, 아래). 결과: 공포=토끼(얼어붙음)는 실제로 잘 뒷받침됨(Fanselow 1994 등). **혐오=너구리(코 막기)는 근거가 전혀 없었고 너구리 상징 연구가 오히려 미움 쪽(트릭스터·도둑)을 가리켜, 침팬지(gape+거부 동작)로 교체했다** — 대체 후보 포괄 조사에서 가장 넓은 근거(Steiner 외 2001, Sarabian 외 2017). 원자료 7종(고양이 5·공룡 2)도 사후 점검했으나 이때는 D-035 원자료 보존 원칙에 따라 근거 유무와 무관하게 바꾸지 않았다.
- 완료(2026-09-07, 3차, 이슈 #26): 사용자가 "9개 감정이 각각 다른 동물이었으면 좋겠다"고 요청 — **D-035의 원자료 보존 전제를 사용자 스스로 대체**했다. 고양이 5종·공룡 2종 중복 때문에 7개 계열의 동물을 다시 정해야 했고, 사용자가 "근거 우선"을 선택해 조사자 에이전트 2개(병렬 백그라운드, 즐거움·희망·기쁨 / 슬픔·사랑·미움)로 조사했다. 결과는 **D-044** accepted. **분노=고양이만 유지**(5개 고양이 포즈 중 유일한 (a)등급이라 근거 우선 기준으로도 최선). 나머지 6종 중 5종은 실제 (a)등급 문헌을 찾아 확정: 즐거움=양(Reefmann 외 2009), 슬픔=기니피그(Herman & Panksepp 1978, PANIC/GRIEF 창시 실험), 기쁨=쥐(Panksepp & Burgdorf 2003; Ishiyama & Brecht 2016 *Science*), 사랑=개(Nagasawa 외 2015 *Science*, 프레리들쥐가 과학적으론 더 유명했으나 마스코트 친숙도로 개 선택), 미움=까마귀(Marzluff 외 2010·2012, 단 논문은 "학습된 위협 인식"이라 부르지 "미움"이라 하지 않음 — 프레이밍 유보 명시). **희망=거북이만 예외로 (c) 근거 없음** — taxonomy 희망 정의 자체가 동물 모델 없는 사람 대상 연구(Bruininks & Malle 2005)에서 왔음을 조사로 확인, 순수 창작 선택으로 명시. 중간에 사용자가 "사랑도 개, 희망도 개"를 골라 종 중복이 발생했는데, 재확인 질문으로 사랑=개·희망=거북이로 해소했다(9종 전부 서로 다른 동물 확인 완료). `prompts.json`(6개 항목 교체, `version` → `characters-v4-draft`)·`README.md` §5·`docs/DECISIONS.md`(D-043→superseded, D-044 신규)·`docs/research/character-animal-evidence.md`(전면 개정, 폐기된 원안은 §4로 보존)를 같은 세션에서 갱신. **실제 이미지 생성은 여전히 미실행**(Codex CLI 필요, 이 환경에 없음을 확인함).
- **인계(2026-09-10, 병행 TASK-DESIGN 세션 → D-041 별자리 담당).** `design/style-guide.html`이 **정본 §6.2를 따라오지 않았다.** 정본은 D-041로 감정 별자리 지도가 됐는데 스타일 가이드에는 별자리가 **0건**이고 폐기된 **아크 휠 절이 그대로** 있다(`<h2>카테고리 선택기 — 아크 휠</h2>`, `id="arc"`). 미리보기와 정본이 어긋난 상태다.
  - 그 낡은 아크는 9계열에서 **실제로 깨져 있다**(로컬 미리보기 실측, `35f9ad8` 기준): 9개 중 **5개만** 상자 안에 들어오고 즐거움·미움·공포·혐오가 잘리며, **혐오는 투명도 0.00으로 완전히 사라진다**. 시작 위치 `off=3`도 9개 목록의 한가운데(4)가 아니다. 원인은 `R=460`·`1−d/36`·`off=3`이 7계열 기준 값이라는 것이다.
  - **별자리로 교체하면 자연히 사라지는 문제이므로 아크를 고치지 말 것을 권한다.** 이 세션이 기하 수정(`R=300`·`1−d/50`·`off=중앙` → 9개 모두 노출, 최저 투명도 0.39)을 만들어 실측까지 했으나, 폐기될 컴포넌트라 **커밋하지 않고 되돌렸다.** 교체까지 시간이 걸려 미리보기를 임시로 멀쩡히 두고 싶다면 그 값을 쓰면 된다.
  - 아래 "다음 1"의 아크 폴백 항목은 D-041로 무효다 — 별자리의 폴백은 정본 §6.2에 이미 3열 격자로 적혀 있다.
- **인계(2026-09-17, 별자리 구현 세션 — 설계만 하고 파일은 건드리지 못한 채 중단).** 사용자가 "별자리 교체" 작업을 지시해 착수했으나 **실제 파일 변경은 0건이다** — `git status` clean, `design/style-guide.html`에 `아크`/`arc` 문자열이 여전히 25건 남아 있다. 아래는 이 세션이 확인·설계했지만 아직 코드로 옮기지 못한 내용이다. 다음 세션은 이 메모를 기준으로 바로 구현하면 된다(다시 조사할 필요 없음).
  - **확인한 것**: `DESIGN_SYSTEM.md:94-124`(§6.2 전문), `DECISIONS.md`의 D-041 전문, `style-guide.html`의 아크 관련 위치 3곳(CSS `/* 카테고리 아크 휠 (D-037) */` 블록, HTML `<h2>카테고리 선택기 — 아크 휠</h2>` 절과 바로 뒤 "큰 글자 폴백" 절, JS `/* ── 카테고리 아크 휠 ── */` IIFE), `design/tokens.json`의 `color.emotion`(9계열 50~900+label+source)·`motion`·`size`·`border` 구조, `data/taxonomy/v2.json`(`emotion-ko-v2`, `review_status: reviewed`, 9계열 194개 `label_ko`) 전체 라벨 스냅샷.
  - **설계한 것(다음 세션이 그대로 구현)**: 320×260 `.sky` 프레임에 `.star` 버튼 9개(44×44 히트존, 16px 코어에 `--c` 계열색, 라벨은 점 아래 22px, `aria-pressed`로 토글). 연결선은 프레임 위에 얹은 SVG `<polyline>`으로 그리되 좌표·순서는 어떤 필드로도 저장하지 않는다(§6.2 요구사항). 선택 시 코어에 `twinkle` keyframe을 1회만 재생하고 `prefers-reduced-motion`이면 끈다. 큰 글자 폴백은 기존 3열 격자(칸 101px, D-038 폴백 결정)를 그대로 재사용하되 클래스를 `.sky.grid`로 토글하고, 라벨 겹침·프레임 이탈을 실측해 자동 전환하는 스크립트를 붙인다. JS의 `CATS` 배열은 taxonomy 선언 순서(enjoyment/wish/sadness/anger/joy/love/hate/fear/disgust)를 그대로 쓰고 심리 축으로 재정렬하지 않는다(PR-001). 세부 감정 소프트 리스트는 고른 카테고리별로 sticky 그룹 머리글(계열 색 점 10px+이름)을 붙이고, 카테고리를 하나도 안 고르면 "위에서 카테고리를 먼저 골라 주세요" 안내로 바꾸며, 카테고리를 끄면 그 계열에서 골랐던 세부 감정도 함께 내려놓는다(D-041). 목록 표본 단어는 taxonomy v2 스냅샷으로 교체하고(기존 하드코딩된 슬픔 51개 목록은 정본과 무관한 임의 표본이었다), 이 페이지는 정본을 자동으로 따라가지 않는 스냅샷임을 note로 명시한다. `design/tokens.json`의 `motion.note`에 남은 "아크 스냅" 문구도 함께 정리한다.
  - **왜 못 끝냈나**: 패치를 한 번에 적용하려 bash heredoc(`cat > file <<'EOF' ... EOF`)으로 큰 Node 스크립트를 밀어넣다가 따옴표/EOF 매칭이 깨져(`unexpected EOF while looking for matching` 오류) 셸이 통째로 실패했고, 그 직후 사용자가 작업을 멈추고 인계 기록만 요청해 재시도하지 않았다. 스크래치패드에도 부분 파일이 남지 않았다(빈 디렉터리 확인함) — 즉 되돌릴 것도, 정리할 잔재도 없는 완전한 백지 상태다.
  - **다음 세션 절차**: (1) 위 설계대로 `Edit` 도구로 CSS·HTML·JS 세 블록을 각각 정확한 old_string/new_string으로 치환한다(한 번의 거대한 heredoc 대신 여러 개의 작은 Edit 호출을 쓸 것 — 이번 실패의 원인 회피). (2) `node scripts/check-contrast.mjs --verbose` → `npm run verify:quick`. (3) `design-preview` 브라우저 탭을 열어 9개 점이 320×260 안에서 잘리지 않는지 스크린샷으로 실측 확인(기존 아크가 깨졌던 바로 그 결함을 되풀이하지 않는지가 핵심 검증 항목). (4) 큰 글자 폴백 전환도 확인. (5) `npm run verify:full` → Artifact 재발행(`read` 먼저) → 이 인계 절 전체를 완료 체크포인트로 교체.
- **완료(2026-09-17, Codex): D-041 별자리 미리보기 구현.** `design/style-guide.html`에서 폐기된 아크 CSS·HTML·JS와 별도 4열/3열 비교 절을 제거하고, 320×260 별자리(9개 독립 토글, 44×44 히트존, 선택 링+굵은 라벨, 선택 순서 연결선, 1회 명멸, reduced-motion)를 구현했다. 라벨 겹침·프레임 이탈·루트 글자 120% 초과를 실측해 3×3 격자로 자동 전환한다. 별자리 선택과 taxonomy v2 스냅샷 기반 세부 감정 그룹을 연결했고, 카테고리 해제 시 그 계열의 세부 선택도 제거한다. 로컬 브라우저에서 일반 별자리 9개 무잘림, 즐거움+슬픔 다중 선택/연결선, 그룹 목록/트레이, 카테고리 해제 연쇄 정리, 테스트용 루트 20px에서 3×3 폴백을 확인한 뒤 테스트 값을 원복했다. `design/tokens.json`의 아크 스냅 문구도 D-041 명멸 규칙으로 교정했다. `check-contrast --verbose` 216/216 PASS, `verify:quick`·`verify:full` PASS(분류표 41/41, scope guard 11/11 포함). 기존 Claude Artifact 재발행은 현재 Codex 환경에 해당 도구가 없어 미실행이며 저장소 로컬 미리보기가 정본이다.
- **추가(2026-09-17, Codex): 캐릭터 무드 시안 v1.** 사용자가 기존 이미지 스타일 설정을 다시 확인할 수 있도록 `prompts.json`의 공통 스타일과 원자료 JPG 2장을 스타일 참조로 사용해 9종 합본 무드 시안을 imagegen으로 생성하고 `design/characters/mood-preview-v1.png`에 보존했다. `design/style-guide.html`에 “캐릭터 이미지 무드” 절을 추가해 수채·색연필·흔들리는 연필선·종이결·둥근 실루엣·안전한 표정이라는 확정 방향과 금지 요소를 함께 표시했다. 이 합본은 스타일 승인용이며 개별 1024/120px 최종 자산이나 이슈 #26 완료 증거로 세지 않는다.
- **추가(2026-09-17, Codex): 캐릭터 무드 시안 v2.** 사용자 참고 이미지의 복슬한 크레용 외곽선, 납작한 불투명 색면, 얼굴 중심의 짧은 비율과 엉뚱한 단순 표정을 반영해 9종 합본을 `design/characters/mood-preview-v2.png`로 생성하고 스타일 가이드의 대표 시안을 교체했다. v1은 비교용으로 보존했다. 이번 변경은 스타일 탐색이며 `prompts.json`과 이슈 #26의 개별 최종 자산은 사용자 승인 전까지 바꾸거나 완료 처리하지 않는다.
- 다음(실행·리서치):
  1. [x] **감정 별자리 지도 구현** — 2026-09-17 완료. 폐기된 아크 휠을 제거하고 D-041 다중 선택·3열 큰 글자 폴백·세부 목록 연동을 스타일 가이드에 반영했다(바로 위 완료 체크포인트).
  2. **캐릭터 생성** — ~~3번(taxonomy v2) **뒤에** 한다. 공포가 추가되면 7종이 8종이 되는데~~ **[정정, 2026-09-05] 3번(taxonomy v2)이 확정됐다 — 공포·혐오가 둘 다 신설되어 7종이 9종이 되는데** 일관성 때문에 같은 seed로 한 번에 만들어야 하므로, 먼저 만들면 전부 다시 만들어야 한다(D-038). 확정 후 codex imagegen → `node scripts/check-characters.mjs` 통과 → README §3 눈 검수. ~~생성 자체는 아직 시작하지 않았다(`design/characters/prompts.json` 7개 항목 그대로).~~ **[정정, 2026-09-06, 이슈 #26]** 공포·혐오 캐릭터 컨셉을 사용자와 대화로 확정(원자료가 없는 신설 계열이라 매 단계 질문으로 방향을 잡음): **공포=토끼**(제자리에 얼어붙어 귀를 뒤로 접은 자세, 크림색), **혐오=너구리**(앞발로 코를 막고 몸을 트는 자세, 자연색 회색+마스크). 동물 재사용(공룡/고양이) 대신 새 동물을 쓰기로 했다 — 프로젝트 규칙이 아니라 사용자의 창작 선택(근거는 `design/characters/README.md` §5). `prompts.json`에 두 항목의 `subject_prompt`·`accent`(fear `#199A8C`, disgust `#918C37` — tokens.json 500과 동일, override 불필요) 추가 완료, `version`을 `characters-v2-draft`로 올림, `README.md` §1·§2·§3을 9종 기준으로 갱신. `node scripts/check-characters.mjs` → `PENDING: 캐릭터 아이콘 9종 미제작` 정상 확인, `npm run verify:quick` PASS. **실제 PNG 9종 생성은 아직 안 했다** — `codex imagegen`은 Codex CLI 전용 기능이라 이 작업을 수행한 Claude Code 세션에는 실행 도구가 없다. Codex CLI에서 생성 → 여기서 `check-characters.mjs` 통과·README §3 눈 검수로 이어받아야 한다.
  3. **taxonomy v2 심리학 리서치(D-038)** — G3 원자료 전사(v1) 후 진행. **사용자가 방향을 확정했다(2026-09-04): 공포/두려움 카테고리 신설, 놀람은 기쁨 전용이 아님.** 나머지 세부 감정 귀속은 리서치로 정한다. 색 수용 가능성은 미리 재어 뒀다 — 8~9계열까지 가능하지만 쓸 수 있는 구역이 **초록~청록과 어두운 갈색뿐이고 보라는 포화**다(D-038). `emotion_code`(D-022) 마이그레이션 매핑도 함께 만든다. **[정정, 2026-09-05] 완료됐다** — taxonomy v2 9계열 194개 확정, 사용자 최종 대조(D-027)까지 마쳐 `review_status: reviewed`(위 TASK-TAXONOMY 안내, `docs/PROCESS_LOG.md` 참고). `emotion_code` 마이그레이션 매핑(`data/taxonomy/v1-to-v2.json`)도 함께 완료됐다.
  4. **실기기 확인** — chip 대비, 40px 아이콘 판독성, 44px 터치, 별자리 다중 선택 조작감(iPhone Safari·Android Chrome).
  5. **위기 안내 연락처 값** 검수.
- 주의: 색의 의미(어떤 계열이 어떤 감정인지)는 원자료를 따르므로 사용자 승인 없이 바꾸지 않는다(PR-010). 감정 색으로 위험·순위를 표현하지 않는다.

---

