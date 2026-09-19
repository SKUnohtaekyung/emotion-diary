> **아카이브(2026-09-20, TASK-INFRA-01).** `tasks/CURRENT_TASK.md`에서 옮긴 기록이다. 옮기기 직전 커밋은 `b54a0a2`이고 아래 본문은 옮기기 전과 바이트 그대로다. **상태:** complete(2026-09-19) — 이슈 #26 closed. 실기기·OS reduced-motion·회색조 판독 검수는 TASK-WEB-UI-01로 넘겼다. 이 파일의 `- 소유 파일:` 선언은 scope-guard에 더 이상 반영되지 않는다 — 훅은 `CURRENT_TASK.md`만 읽는다.

# TASK-ISSUE-26 — 캐릭터 9종 포즈·잔잔한 애니메이션

## 상태와 승인 범위

`complete` — 2026-09-19 사용자 승인. `design/characters/mood-preview-v2.png`를 최종 스타일 기준으로 삼아 9종 최종 자산·포즈·애니메이션·UI 정적 보조 세트와 자동/Chromium 검증을 마쳤다. iPhone Safari·Android Chrome 실기기와 실제 OS reduced-motion 검수는 웹 구현 뒤의 확장 게이트로 보류하며, 사용자 지시에 따라 이 자산 이슈의 완료를 막지 않는다.

## 소유권

- Main/Writer: 현재 Codex 세션 1명. 별도 하위 에이전트 없음.
- 소유 파일: `tasks/CURRENT_TASK.md`, `docs/DECISIONS.md`, `docs/DESIGN_SYSTEM.md`, `docs/EVAL_PLAN.md`, `docs/TRACEABILITY.md`, `design/tokens.json`, `design/style-guide.html`, `design/characters/prompts.json`, `design/characters/README.md`, `design/characters/qa.html`, `design/characters/src/*.png`, `design/characters/poses/*.png`, `design/characters/motion/*`, `design/characters/pilot/*`, `design/characters/*.png`, `scripts/build-character-animations.mjs`, `scripts/check-characters.mjs`, `scripts/test-check-characters.mjs`, `package.json`, `package-lock.json`, 이 파일.

## 불변조건과 인수 조건

- 동물 매핑은 D-044의 양·거북이·기니피그·고양이·쥐·개·까마귀·토끼·침팬지를 그대로 유지한다.
- 승인 스타일은 복슬하고 고르지 않은 검은 크레용·색연필 외곽선, 불투명하고 납작한 색면, 은은한 종이결, 얼굴 중심의 짧고 둥근 비율, 단순하고 엉뚱하지만 안전한 표정이다. 광택 3D·매끈한 벡터·사실적인 털·과도한 그라데이션은 금지한다.
- `mood-preview-v1.png`와 `mood-preview-v2.png`를 덮어쓰거나 삭제하지 않는다. v2는 스타일 참조이며 최종 개별 자산으로 세지 않는다.
- 공포=토끼 시범 산출물은 `pilot/`에 격리하고 최종 9종 일부로 세지 않는다. 시범 전에는 9종 전체를 생성하지 않는다.
- 정적 대표 PNG, 포즈 세트, 약 2초 idle loop, 1회 acknowledge 반응, 정적 reduced-motion 대체를 정의한다. 점프·회전·큰 이동·화면 흔들기·빠른 탄성·과장된 squash/stretch는 금지한다.
- animated WebP와 APNG는 동일 프레임으로 비교하고, 질감·알파 경계·브라우저·파일 크기 증거로 하나를 선택한다.
- `node scripts/check-characters.mjs`, quick/full 검증, 40px·120px와 투명 halo 브라우저 검수를 모두 통과해야 완료다.

## 체크포인트

- 착수(2026-09-17): 사용자 실행 계획 승인. 시작 상태는 `main...origin/main`, 기존 수정 `design/style-guide.html`·`design/tokens.json`·이 파일, 기존 미추적 `mood-preview-v1.png`·`mood-preview-v2.png`. `check-characters`는 9종 미제작 PENDING, quick PASS, `git diff --check` 이상 없음. 기존 변경을 보존한다.
- 진행(2026-09-18): 공포=토끼 시범에서 120px 24프레임/12fps/2초 loop를 만들고 동일 프레임 WebP/APNG를 비교했다. 최초 WebP가 10,928 bytes였으나 메타데이터가 1프레임인 인코딩 결함을 발견해 폐기하고 Sharp의 animated join 방식으로 수정했다. 유효 출력은 WebP 261,298 bytes, APNG 389,709 bytes이며 Chromium에서 질감·alpha 차이가 없어 D-046으로 WebP를 선택했다.
- 진행(2026-09-18): 단순 3×3 crop이 이웃 캐릭터 조각을 섞는 결함을 브라우저 QA에서 발견해 폐기했다. alpha 연결 영역 9개를 분리·중앙 등록하는 방식으로 재생성해 `src/*-1024.png` 9개, 120px 정적 PNG 9개, idle/acknowledge WebP 18개와 manifest를 만들었다. `check-characters`는 실제 투명 픽셀·투명 RGB·크기·pages/pageHeight·delay·loop·총 길이·alpha 중심 이동을 검사하며 현재 정적 18/동적 18 PASS. Chromium `qa.html`에서 40px/120px와 흰색·어두움·체크보드 halo를 확인했다.
- 진행(2026-09-18): 9종 `idle`·`breathe`·`tilt`과 감정별 작은 `emotion` 정적 포즈, 열린 눈 5종의 blink 원본을 추가했다. 감정 포즈는 기준 idle을 imagegen으로 제약 편집한 뒤 1024px로 정규화해 canvas·alpha 중심·종 식별 요소를 비교했다. 사랑 개의 첫 결과는 원본에 없던 꼬리를 더해 탈락·보존했고, 꼬리 없이 귀만 유지한 두 번째 결과를 채택했다. `tilt`는 분리 리깅의 이음선 대신 1.8° 전신 미세 기울임으로 한정한다.
- 진행(2026-09-18): 9종 acknowledge를 `motion_spec.emotion_rigs`의 국소 워프로 재인코딩했다. 전체 imagegen 포즈를 crossfade하면 종이결이 깜빡이므로, 각 원본을 premultiplied-alpha bilinear 재표본화해 지정 부위 외곽선을 4~6px 범위로 왕복시키고 peak를 3프레임 유지한다. blink는 눈 동작만 부각하지 않도록 acknowledge가 아닌 idle loop에만 둔다. Chromium에서 시작·중간·종료 프레임을 확인해 white matte·halo·질감 전환이 없음을 확인했다.
- 수정(2026-09-18): 시각 피드백에서 acknowledge가 blink처럼만 읽히는 것을 확인했다. acknowledge 프레임의 blink 합성을 제거하고, 종별 `emotion_rigs`만으로 귀·머리·앞발·꼬리·날개 등 지정 부위를 4~6px 국소 왕복시킨다. peak 부근도 서로 다른 3프레임으로 유지해 WebP 인코더의 중복 프레임 병합 없이 실제 16프레임을 보존했다. 120px Chromium QA에서 새 파일의 국소 움직임과 정적 중심, 투명 가장자리를 재확인했다.
- 재검증(2026-09-18): 수정 뒤 `build-all`로 18개 WebP와 manifest를 다시 생성했다. `check-characters` PASS(정적 18, 기본 27, blink 5, emotion 9, 동적 18; acknowledge 16프레임·1.328초), `test-check-characters` 5/5 PASS, `verify --mode quick` 및 `verify --mode full` PASS(taxonomy 41/41, scope guard 11/11, character checker 5/5), `git diff --check` PASS. 커밋·푸시·이슈 변경 없음.
- 진행(2026-09-18): 사용자가 제공한 3×3 전신·감정 포즈 시트를 UI 전용 정적 보조 세트로 채택했다. 원본은 `pilot/not-selected-fullbody-reference.png`에 보존된 것을 사용하고, canonical 대표 PNG·포즈·WebP는 덮어쓰지 않는다. `ui-poses/<key>--expressive-static-{1024,120}.png` 18개를 분리했다. 기니피그 crop에 섞인 거북이 표시 조각은 시각 검수에서 발견해 경계를 조정했고, 9종 접촉 시트에서 재확인했다. 이 세트는 애니메이션·reduced-motion fallback이 아니며, UI 장식/온보딩/빈 상태에만 안전하게 쓴다.
- 후속 보류(2026-09-19, 사용자 지시): iPhone Safari·Android Chrome 실기기, 실제 OS reduced-motion, 회색조/label 없음 사용자 판독은 웹페이지 구현 뒤의 확장 검수로 옮긴다. #26 자산 이슈의 완료 조건에서는 제외하며, 아래 `TASK-WEB-UI-01`의 브라우저 우선 정적 UI 프로토타입에서 이어서 다룬다.
- 완료(2026-09-19): 9종 대표 PNG·기본/감정 포즈·24프레임 idle 및 16프레임 acknowledge WebP·UI 정적 포즈 18개·manifest·검수 스크립트와 문서를 모두 갖췄다. full 검증과 GitHub 이슈 본문 갱신/종료는 이 체크포인트 뒤에 실행한다.
- 재검증(2026-09-18): `node scripts/build-character-animations.mjs build-all design/characters/prompts.json design/characters`로 18개 WebP/manifest를 재생성했다. `node scripts/check-characters.mjs` PASS(정적 18, 기본 27, blink 5, emotion 9, 동적 18), `node scripts/test-check-characters.mjs` 5/5 PASS(누락된 acknowledge 국소 리그 거부 포함), `node scripts/verify.mjs --mode quick` PASS, `node scripts/verify.mjs --mode full` PASS(taxonomy 41/41, scope guard 11/11, character checker 5/5), `git diff --check` PASS. 커밋·푸시·이슈 변경 없음.
- 검증(2026-09-18): `node scripts/check-characters.mjs` PASS(정적 18, 기본 27, blink 5, emotion 9, 동적 18), `node scripts/test-check-characters.mjs` 4/4 PASS, `node scripts/verify.mjs --mode quick` PASS, `node scripts/verify.mjs --mode full` PASS(taxonomy 41/41, scope guard 11/11, character checker 4/4), `git diff --check` PASS. Chromium `qa.html`에서 9종 emotion 포즈를 정적 대표와 함께 120px/40px, 흰색·어두움·체크보드로 렌더링해 halo·matte·가독성 이상이 없음을 확인했다. 커밋·푸시·이슈 변경 없음.
- 검증(2026-09-18): `node scripts/check-characters.mjs` PASS(정적 18, 동적 18), `node scripts/test-check-characters.mjs` 4/4 PASS, `node scripts/verify.mjs --mode quick` PASS, `node scripts/verify.mjs --mode full` PASS(taxonomy 41/41, scope guard 11/11, character checker 4/4), `git diff --check` PASS. 커밋·푸시·이슈 변경 없음.

