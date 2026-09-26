# 공개 디자인 시스템 교차 관찰 (2026-09-26)

[CHECKLIST.md](../CHECKLIST.md)의 결정 항목 틀을 만드는 데 쓴 관찰이다. Material Design 3(M3), Apple HIG, IBM Carbon이 부품 문서에서 **어떤 종류의 결정을 다루는가**만 우리 문장으로 적었다. 값·코드·표는 옮기지 않았다.

## 근거의 세기

| 소스 | 읽은 방법 | 세기 |
| --- | --- | --- |
| Carbon | 조사자는 검색 색인. writer가 공개 원본(`carbon-design-system/carbon-website`의 `src/pages/components/*/usage.mdx`)을 직접 대조 | **강함**(대조한 항목만) |
| M3 | 페이지가 스크립트로 그려져 본문을 직접 못 받았다. 검색 색인 조각 | 약함 — 결정의 근거로 쓰지 않고 "질문 후보"로만 쓴다 |
| HIG | 같은 이유로 검색 색인 조각 | 약함 — 위와 같다 |

**writer 표본 대조(2026-09-26)**: 3건 중 2건 일치, 1건 불일치.

- 일치: Carbon 토글은 즉시 적용되는 설정에만 쓰고, 확인이 필요하면 체크박스 같은 다른 부품을 쓴다.
- 일치: Carbon 토스트는 몇 초 뒤 저절로 사라지는 알림이다(문서가 적은 시간은 5초).
- **불일치**: 조사자가 "Carbon은 버튼 묶음에서 주 버튼을 바깥쪽에 둔다"고 보고했으나 원문은 자리에 따라 다르다고 적는다(긴 페이지는 왼쪽, 단계 진행·대화 창은 오른쪽 아래). 이 항목은 버렸다.
- 결론: 조사자 보고 전체를 사실로 받지 않는다. 틀에는 **질문의 종류**만 가져오고, 답(우리 값)은 우리 측정과 사용자 결정으로 정한다.

## 틀에 반영한 관찰

- 세 소스 모두 부품마다 쓰임(쓸 때/쓰지 않을 때), 구조, 변형, 크기, 상태, 동작, 배치, 문구, 접근성을 다룬다 → CHECKLIST A~K.
- HIG는 부품마다 플랫폼별 차이를 적는다 → 우리는 홈 화면 앱(standalone)·화면 폭 항목(L)로 받는다.
- M3는 상태(누름·초점·선택·비활성)를 부품마다 따로 정하지 않고 하나의 공통 규칙으로 겹친다 → CHECKLIST §1 F1.
- 스위치: M3·Carbon은 '즉시 적용'을 스위치의 조건으로 삼는다(Carbon은 원문 대조로 확인). HIG 조각에서는 이 기준이 보이지 않았다.
- 알림 셋(토스트·안내 띠·대화상자)은 "저절로 사라져도 되나 × 반드시 답해야 하나" 두 축으로 가른다(M3·Carbon).
- 대화상자: 확인 동작은 비활성으로 둘 수 있어도 취소는 비활성으로 두지 않는다(M3, 약한 근거 → 질문 후보).
- 위험 동작: 경고에 답하는 자리에서는 위험 버튼을 강조하지 않고, 스스로 고르는 목록에서는 눈에 띄게 둔다는 두 입장이 한 시스템 안에 있다(HIG, 약한 근거 → 질문 후보).
- 진행 표시: 모르는 진행 → 아는 진행으로만 바뀌고 거꾸로 가지 않는다(M3, 약한 근거).
- 빈 상태: 동작 버튼 자리를 내용이 있을 때와 같게 둔다(Carbon 패턴 문서, 조사자 보고 — writer 미대조).

## 예상 밖 발견

- 세 시스템의 부품 목록 자체가 다르다. Carbon은 바텀시트·안전 영역 개념이 약하고, HIG에는 '카드'라는 공식 부품이 없다. 남의 부품 목록을 그대로 채우려 하지 말아야 한다는 근거다(D-097 ①).

## 미확인

M3·HIG 본문 직접 확인, Slider·Stepper·Search·Picker·Divider·Menu·Top app bar·Page indicator의 세부 결정 항목, HIG 접근성 페이지.

## 출처(확인일 2026-09-26)

- https://carbondesignsystem.com/components/toggle/usage/ · /components/notification/usage/ · /components/button/usage/ (원본 mdx 대조)
- https://m3.material.io/components/ (switch, checkbox, buttons, dialogs, bottom-sheets, snackbar, chips, segmented-buttons, tabs, navigation-bar, progress-indicators, badges, lists), /foundations/interaction/states/
- https://developer.apple.com/design/human-interface-guidelines/ (toggles, buttons, action-sheets, sheets, dark-mode, playing-haptics, layout)
