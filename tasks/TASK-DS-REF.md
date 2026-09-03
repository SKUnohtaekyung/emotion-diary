# TASK-DS-REF — TDS Mobile 규칙 참고로 자체 디자인 시스템 보강 (새 세션 인계)

## 상태

`planned` — 2026-09-04 사용자 결정 3건: (1) **TDS Mobile 미채택 확정**, (2) TDS는 **규칙만 참고**해 자체 디자인 시스템을 보강, (3) 다른 세션이 `docs/DECISIONS.md`·`docs/DESIGN_SYSTEM.md`·`design/style-guide.html`을 수정 중이므로 결정 기록과 작업 계획을 이 파일로 인계. 새 세션에서 "TASK-DS-REF 이어서"라고 말하면 §8 절차로 시작한다.

## 1. 목표

토스 TDS Mobile의 **구성 규칙**(상태·간격·배치·피드백 원칙)을 관찰해 `docs/DESIGN_SYSTEM.md` §6 구성요소 규칙의 빈틈을 메운다. 코드·CSS 값·이미지·아이콘·글꼴 등 **자산은 하나도 가져오지 않는다**. 결과는 우리 토큰(`design/tokens.json`)과 확정 결정(D-034~D-036)으로만 표현된다.

## 2. 범위

- 포함: TDS Mobile 공개 문서 관찰, 우리 §6 항목과의 1:1 대응 분석, 사용자 승인 후 §6·tokens·style-guide 반영, 결정 D-037 기록, 라이선스 안전 검증.
- 제외: `@toss/tds-mobile` 계열 패키지 설치·import·코드 인용, TDS 색·타이포 값 이식, UI 프레임워크 결정(Phase 1 scaffold에서 별도), 이미 확정된 디자인 결정(D-034~D-036)의 재검토, 캐릭터 자산 생성·실기기 확인(TASK-DESIGN 실행 항목), 앱 코드 작성.

## 3. 연결 요구사항

- `PR-010`(감정 색은 식별 라벨, 의미 불변), UX §11 상태 설계, DESIGN_SYSTEM §2 원칙·§11 하지 않는 것.
- 관련 결정: D-033~D-036(모두 accepted, 이 작업에서 **불변**), 신규 D-037(§5 초안). **번호 주의**: 2026-09-04 현재 작업 트리는 D-036까지 사용했다. T0에서 `docs/DECISIONS.md`의 마지막 번호를 확인해 다음 번호로 확정하고 이 파일의 D-037 표기를 맞춘다.

## 4. 확정 사실 (2026-09-04 조사, writer가 직접 재확인한 항목은 ★)

| 항목 | 사실 | 출처 |
| --- | --- | --- |
| npm 공개 ★ | `@toss/tds-mobile` 2.5.1 존재. `license` 필드 **없음**, `repository`·`homepage` 없음, unpacked 5.1MB | https://registry.npmjs.org/@toss/tds-mobile/latest |
| peer ★ | react/react-dom `^16.8.3 \|\| ^17 \|\| ^18`(React 19 불가), `@emotion/react ^11` | 위와 같음 |
| AIT 의존 | `@toss/tds-mobile-ait`는 `@apps-in-toss/web-framework`(WebView bridge)를 peer로 요구 | https://registry.npmjs.org/@toss/tds-mobile-ait/latest |
| 라이선스 ★ | "토스가 TDS 사용을 허가하는 건 앱인토스 서비스를 제공하기 위한 제한적인 권한", "파트너사는 앱인토스 서비스를 이용하는 범위 안에서만 이 자료를 쓸 수 있어요" | https://developers-apps-in-toss.toss.im/design/components.md |
| UI Kit 라이선스 ★ | 허용: 앱인토스용 앱 개발·디자인·프로토타입. 금지: 다른 프로젝트·제품·서비스 사용, 상업적 용도, 복사·수정·편집·재가공, 재배포. 소유권 Viva Republica Inc. | https://developers-apps-in-toss.toss.im/design/prepare/figma-ui-license.md |
| npm에도 적용 ★ | npm 패키지(`@toss/tds-mobile` 등) 라이선스 질문에 토스 측이 위 UI Kit 라이선스 문서로 답변 | https://techchat-apps-in-toss.toss.im/t/topic/3596 |
| 정적 빌드 | Next.js SSG에서 `TDSMobileAITProvider` 빌드 오류, 토스 측 CSR 권장 | https://techchat-apps-in-toss.toss.im/t/tdsmobileaitprovider-deploymentid-is-not-a-constant-handler/2639 |
| 번들 | `@toss/tds-mobile@2.5.1` min 1.09MB / gzip 339KB | https://bundlephobia.com/api/size?package=@toss/tds-mobile@2.5.1 |
| 다크 모드 | 앱인토스 디자인 가이드: "다크 모드는 추후 지원할 예정" — 라이트 기준 | https://developers-apps-in-toss.toss.im/design/prepare/design.md |
| 테마 오버라이드 | 전역 테마 API 미문서화. 컴포넌트별 CSS 변수(예: Button `--button-color`)만 문서화 | https://tossmini-docs.toss.im/tds-mobile/components/button/ |
| 공개 저장소 | GitHub `toss` org에 tds 저장소 없음 | https://github.com/orgs/toss/repositories?q=tds |
| 문서 인덱스 | 컴포넌트 목록·Foundation(Colors, Typography) | https://tossmini-docs.toss.im/tds-mobile/ |

미확인: 패키지 tarball 안 LICENSE 파일 유무(다운로드 안 함), 브라우저 단독 런타임 동작(실행 안 함). 둘 다 결론을 바꾸지 않는다 — 라이선스 문서가 독립 웹 사용을 허가 범위 밖으로 둔다.

## 5. 결정 초안 D-037 (T0에서 `docs/DECISIONS.md` 표에 합칠 원문)

```text
ID / 날짜 / 상태 / 결정자: D-037 / 2026-09-04 / accepted / 사용자
문제: 더 정교한 디자인 시스템을 위해 토스 TDS Mobile(@toss/tds-mobile) 채택을 검토했다.
관찰 근거: 공개 npm에 있으나 license 필드 없음. 토스 공식 문서는 TDS 사용을 "앱인토스 서비스를 제공하기 위한 제한적인 권한"으로 한정하고, UI Kit 라이선스는 다른 프로젝트·서비스 사용, 복사·수정·재가공, 재배포를 금지한다. npm 패키지 라이선스 문의에 토스 측이 같은 문서로 답했다. 기술적으로도 React 18 고정, @emotion/react 11 필수, AIT Provider가 앱인토스 WebView bridge를 peer로 요구, SSG 빌드 오류 사례, gzip 339KB, 다크 모드 미지원, 전역 테마 오버라이드 미문서화. (URL은 tasks/TASK-DS-REF.md §4)
선택: TDS Mobile을 채택하지 않는다. 패키지 설치·import·코드/값/자산 이식을 금지한다. 공개 문서의 구성 규칙(상태·간격·배치·피드백)만 관찰해 자체 DESIGN_SYSTEM §6을 보강한다(TASK-DS-REF).
대안과 기각 이유: (a) 토스에 사용 허가 문의 후 결정 — 답변 보장 없고 허가돼도 React 18·WebView 종속이 남는다. (b) 위험 감수 도입 — 라이선스 위반 위험과 정본 이중화(색·글꼴·간격)를 감수할 이유가 없다.
제품·데이터·안전·비용 영향: 제품 범위·데이터·안전 정책 변화 없음. 의존성 0 유지. 향후 UI 프레임워크 선택이 React로 강제되지 않는다.
검증 방법: package.json과 소스에 @toss/tds-* 및 @apps-in-toss/* 부재를 grep으로 확인(quick 하네스 항목으로 추가 가능). TASK-DS-REF T5 verifier가 코드/값 복사 부재를 검사.
되돌림/마이그레이션: 없음(도입한 것이 없다).
재검토 조건: 토스가 TDS Mobile을 오픈소스 라이선스(SPDX 명시)로 공개하거나 외부 사용 허가를 문서화할 때. 그때도 React·번들·테마 제약을 다시 평가한다.
사용자 승인 필요 여부: 2026-09-04 사용자 승인 완료.
```

RISK_REGISTER 추가 초안: `RK-0xx | 외부 UI 라이브러리·디자인 자산의 라이선스가 독립 웹 사용을 금지(TDS 사례) | low | high | 배포 중단·법적 위험 | 의존성 추가 전 SPDX license 필드와 공식 사용 범위 확인을 Phase 1 scaffold 게이트에 포함 | 자체 구현 | mitigated(D-037)`.

## 6. 완료 기준·성공 기준을 세우기 전에: 기준이 주는 치명적 단점

기준을 먼저 정하면 작업이 기준 **만** 향한다. 이 작업에서 실제로 일어날 수 있는 실패 형태와, 그래서 기준을 어떻게 설계했는지를 적는다. §7의 각 task 기준은 이 표를 통과하도록 썼다.

| # | 치명적 단점 | 이 작업에서의 구체적 형태 | 기준 설계 대응 |
| --- | --- | --- | --- |
| 1 | **기준이 목표가 된다**(Goodhart) | "관찰 30건 이상" 같은 수량 기준은 잡음 관찰로 채워진다 | 수량 기준을 두지 않는다. 기준은 "우리 §6 항목마다 대응 관찰이 있거나 '해당 없음' 사유가 있다"처럼 **대응 관계**로 쓴다 |
| 2 | **과정 기준은 결과를 보장하지 않는다** | "문서를 다 읽었다"는 확인할 수 없고 하위 에이전트가 읽지 않고도 선언할 수 있다 | 완료 기준은 **산출물의 관찰 가능한 속성**만 쓴다(파일 존재, 열 채움, URL·확인일 유무, 하네스 통과) |
| 3 | **터널 시야** | 기준에 적힌 컴포넌트만 보고 "다크 모드 없음", "안전영역 변수" 같은 예상 밖 정보를 버린다 | 모든 관찰 산출물에 `예상 밖 발견` 절을 **필수**로 둔다. 비어 있으면 "없음"이라고 명시 |
| 4 | **측정 불가능한 성공 기준** | "토스처럼 정교하다"는 판정할 수 없어 완료를 영원히 막거나 거짓 완료를 부른다 | 정교함을 대리 지표로 분해: §6 각 항목의 상태 목록 완비(UX §11), 간격이 4pt 단계, 터치 44px, 대비 검사 통과, 오류·빈 상태·로딩 규칙 명시 |
| 5 | **기준 충족을 위해 확정 결정을 되돌린다** | TDS가 다크·웹폰트·그림자를 쓰니 우리도 바꾸자는 후보가 나온다 | **불변 목록**을 명시(§7.0). 불변과 충돌하는 후보는 자동 `보류`로 분류하고 이 작업에서 결정하지 않는다 |
| 6 | **기준이 복사를 유도한다** | "TDS와 시각적으로 같다"를 성공으로 두면 라이선스 위반으로 간다 | 성공 기준을 "우리 토큰과 우리 언어로 표현됨"으로 쓴다. 관찰 기록에는 코드·CSS 값·픽셀값 표·이미지를 넣지 않고, 원문 인용은 컴포넌트당 1개·15단어 이내 |
| 7 | **하위 에이전트가 기준을 채우려 출처를 지어낸다** | URL이나 규칙을 그럴듯하게 생성 | 관찰마다 URL+확인일 필수. writer가 관찰 표본 3건 이상을 직접 WebFetch로 재확인하고 결과를 체크포인트에 남긴다. 불일치 1건이면 해당 에이전트 산출물 전체를 재검토 |
| 8 | **완료 기준이 성공 기준을 대체한다** | "파일이 있고 하네스가 통과"만으로 끝냈다고 본다 | 완료(끝났는가)와 성공(쓸모 있는가)을 분리해 둘 다 적고, 성공 기준은 사용자 승인(T3)과 독립 검증(T5)으로만 닫힌다 |
| 9 | **기준이 범위를 넓힌다** | "정교함"을 좇아 UI 프레임워크·컴포넌트 라이브러리 선택까지 끌어들인다 | 제외 범위(§2)를 각 task 중단 조건에 반복한다. 프레임워크 논의가 나오면 기록만 하고 Phase 1로 넘긴다 |

## 7. 작업 분할

### 7.0 전 task 공통 불변·중단 조건

- 불변: D-034(색 값, 시스템 글꼴, light 전용), D-035(chip 선택 표시, 2줄 격자 토글·40px 캐릭터, 하단 탭 이름), D-036(강도 선택기 2줄 세그먼트·앵커 한 줄, 위기 톤, 브랜드 "감정일기"만, 탐색 아이콘 선/면, 4pt 밀도·달력 `1fr`), DESIGN_SYSTEM §2 원칙·§11 하지 않는 것, PR-010.
- 금지: `@toss/*`·`@apps-in-toss/*` 설치·import, TDS 코드·CSS 값·색·타이포 수치·이미지·아이콘 복사, 문서 원문 15단어 초과 인용.
- 중단: 위 금지에 닿는 순간 멈추고 체크포인트에 기록. 프레임워크 선택 논의가 필요해지면 `주의`에 적고 진행하지 않는다. 같은 가설 2회 실패 시 재진단(AGENTS §5).
- 파일 소유: writer 1명. 하위 에이전트는 `researcher`·`verifier` 역할만 쓰고 읽기 전용이다.

### T0 — 결정·위험 기록 합치기 (writer, 선행 조건 있음)

- 선행 조건: 디자인 세션의 미커밋 변경이 커밋·푸시되어 `git status`에 `docs/DECISIONS.md`·`docs/DESIGN_SYSTEM.md`·`design/style-guide.html`·`tasks/CURRENT_TASK.md`가 없을 것. 있으면 T0를 건너뛰고 T1부터 하되, T4 전에 반드시 T0로 돌아온다.
- 산출물: `docs/DECISIONS.md`에 D-037 행(§5 원문을 표 형식으로), `docs/RISK_REGISTER.md`에 위험 행, `docs/STATUS.md` §2에 한 줄, `tasks/CURRENT_TASK.md` 상단에 이 파일로의 링크 한 줄.
- 완료 기준: 네 파일에 해당 행이 존재하고 `npm run verify:quick` PASS.
- 성공 기준: D-037 행만 읽고도 "왜 안 쓰는가"와 "언제 재검토하는가"를 답할 수 있다(URL 없이 요약만 있으면 실패).
- 중단 조건: 대상 파일에 미커밋 변경이 있으면 편집하지 않는다.

### T1 — TDS Mobile 규칙 관찰 (researcher 2명 병렬, 읽기 전용)

- 입력: §4 문서 인덱스 URL, `docs/DESIGN_SYSTEM.md` §6, `docs/UX_SPEC.md` §11 상태 목록.
- 분담(파일 겹침 없음):
  - A 입력·선택: Button, BottomCTA, Checkbox, Segmented Control, Slider, Stepper, Numeric Spinner, TextField, Search Field, Rating → 우리 §6.1 버튼, §6.2 토글, §6.3 chip, §6.4 강도 선택기, §6.5 텍스트 입력.
  - B 구조·피드백: ListRow, Bottom Sheet, Dialog, Toast, Tab, Top, Skeleton, Loader, Result, Badge, Board Row, List Header/Footer, Progress → 우리 §6.6 저장 상태, §6.7 달력 셀, §6.8 기록 카드, §6.9 대시보드, §6.11 내비·시트·토스트.
- 산출물: `design/reference/tds-mobile-observations-a.md`, `-b.md`. 각 파일 구조: (1) 대응 표 — 열: 우리 §6 항목 / TDS 컴포넌트 / 관찰된 규칙(우리 말로 바꿔 쓴 상태·간격·배치·피드백 원칙) / 우리 현재 규칙 / 차이 / URL / 확인일. (2) `예상 밖 발견`(필수, 없으면 "없음"). (3) `미확인`(문서에 없어 알 수 없는 것). 우리 §6 항목 중 TDS에 대응이 없는 것은 "해당 없음 — 이유"로 채운다.
- 하위 에이전트 프롬프트에 반드시 넣을 것: 사실/추론/미확인 구분, 관찰마다 URL+확인일, **코드 블록·CSS 값·픽셀 수치 표·이미지 설명 금지**, 인용은 컴포넌트당 1개·15단어 이내, 우리 불변 목록(§7.0)과 충돌하는 관찰은 그대로 적되 `불변 충돌` 표시.
- 완료 기준: 두 파일이 존재하고, 우리 §6 항목(6.1~6.11 중 담당분) 모두 행이 있거나 "해당 없음" 사유가 있고, 모든 행에 URL·확인일이 있고, `예상 밖 발견` 절이 있고, 코드 블록이 0개이며 `npm run verify:quick` PASS.
- 성공 기준: writer가 무작위 표본 3건 이상을 WebFetch로 재확인해 불일치 0건. 관찰이 "우리 §6에 없는 상태·규칙"을 최소 1개 이상 드러내거나, 없다면 "현재 §6이 이미 충분하다"는 결론이 항목별 근거와 함께 적혀 있다(둘 중 하나여야 하며, 빈 결론은 실패).
- 중단 조건: 문서가 로그인·앱인토스 샌드박스를 요구해 읽을 수 없는 페이지는 `미확인`에 적고 넘어간다. 비공식 자료(블로그·타인의 skill 파일)는 URL 발견용으로만 쓰고 근거로 인용하지 않는다.

### T2 — 차이 분석과 적용 후보 표 (writer)

- 입력: T1 산출물 2개, DESIGN_SYSTEM §6, UX §11 상태 설계, TASK-DESIGN 남은 실행 항목(캐릭터 자산 생성, 실기기 확인, 위기 연락처 값 검수).
- 산출물: `design/reference/tds-mobile-gap.md` — 열: 우리 §6 항목 / 관찰 요약 / 제안(우리 토큰·언어로 다시 쓴 규칙 문장) / 분류(`적용`·`기각`·`보류`) / 이유 / 근거 관찰 행 번호. 분류 규칙: 불변 충돌 → 무조건 `보류`; 자산·값 복사 없이는 표현 불가 → `기각`; 접근성·상태 완비·4pt·44px 중 하나를 개선 → `적용` 후보. TASK-DESIGN 실행 항목(예: 실기기 검증 절차, 로딩·오류 상태)에 도움이 되는 관찰은 별도 절 `실행 참고`에 넘긴다(결정하지 않는다).
- 완료 기준: T1의 모든 관찰 행이 gap 표의 어느 행에든 연결되어 있고(누락 0), `적용` 후보마다 제안 문장이 우리 토큰 이름(`surface`, `border-strong`, 감정 계열 단계 등)과 4pt 간격 단계로만 쓰여 있으며 `npm run verify:quick` PASS.
- 성공 기준: `적용` 후보 각각에 "이 규칙이 없을 때 사용자가 겪는 문제"가 한 문장으로 적혀 있다(문제를 못 쓰면 `기각`). `적용` 후보가 0건이면 그 자체가 결론이며 실패가 아니다.
- 중단 조건: 후보가 프레임워크·라이브러리 선택을 전제로 하면 `보류`로 두고 Phase 1 scaffold 메모에 남긴다.

### T3 — 사용자 승인 (writer가 AskUserQuestion 사용)

- `적용` 후보를 항목별로 질문한다. 한 질문에 4개 이하, 각 후보에 "채택/수정/기각" 선택지와 예상 영향 한 줄.
- 완료 기준: 모든 `적용` 후보가 사용자 답변으로 `채택`·`수정`·`기각` 중 하나가 되고 그 결과가 gap 표에 기록된다.
- 성공 기준: 사용자가 답을 고르는 데 필요한 정보(문제·제안·영향)가 질문 안에 있어 문서를 다시 열지 않아도 된다.
- 중단 조건: 사용자가 답하지 않으면 T4로 가지 않는다.

### T4 — 정본 반영 (writer)

- 산출물: `docs/DESIGN_SYSTEM.md` §6(채택 규칙 반영), 필요 시 `design/tokens.json`(새 간격·크기 토큰만, 색 값 변경 없음), `design/style-guide.html`(같은 변경), `docs/DECISIONS.md` D-037 행의 결과 갱신 또는 다음 번호의 신규 결정(구성요소 규칙 변경이 있을 때), `docs/TRACEABILITY.md`(UX §11 상태 ↔ §6 매핑이 바뀌면).
- 완료 기준: 채택 규칙이 §6 해당 항목에 "모양 / 상태 / 접근성" 형식으로 들어가 있고, `node scripts/check-contrast.mjs --verbose` 통과, `npm run verify:quick`·`npm run verify:full` PASS, 미리보기(`node scripts/preview.mjs 4173`)에서 변경 항목이 보이며 Artifact(`https://claude.ai/code/artifact/8673a33c-900c-4273-8592-0fb3bdcc36a9`, 먼저 `read`)가 재발행된다.
- 성공 기준: 채택 규칙마다 UX §11 상태 목록의 어떤 상태를 채우는지 명시되어 있고, 색 토큰 값은 한 개도 바뀌지 않았다(`git diff design/tokens.json`에 `#` 색 값 변경 없음).
- 중단 조건: D-034·D-035 값을 바꿔야만 반영 가능하면 반영하지 않고 `보류`로 돌린다.

### T5 — 독립 검증 (verifier, 읽기 전용)

- 검사: (1) `package.json`·저장소 전체에 `@toss/`·`@apps-in-toss/` 문자열이 문서의 URL·설명 외에 없음(grep). (2) `design/reference/*.md`에 코드 블록·CSS 속성 값·픽셀 수치 표·이미지가 없고 인용이 컴포넌트당 1개·15단어 이내. (3) 관찰 표본 3건 URL 실재 및 내용 일치. (4) D-034·D-035 값 불변(`git diff` 기준). (5) `check-contrast` 144건 통과, `verify:full` PASS. (6) T3 승인 기록과 T4 반영 내용의 1:1 일치.
- 완료 기준: 6개 검사 각각 통과/실패/미검증과 재현 명령이 이 파일 §10에 기록된다.
- 성공 기준: 실패 0건. 실패가 있으면 writer가 고치고 T5를 다시 수행하며, 검사를 완화하지 않는다.

## 8. 새 세션 시작 절차

1. `git status`로 미커밋 변경을 본다. 디자인 세션의 변경이 남아 있으면 그 파일은 편집하지 않는다(T0 선행 조건).
2. `AGENTS.md` → 이 파일 → `docs/DESIGN_SYSTEM.md` §6·§11 → `docs/UX_SPEC.md` §11 순서로 읽는다. `tasks/CURRENT_TASK.md`의 TASK-DESIGN 절도 읽어 결정 완료 상태(D-036)와 남은 실행 항목을 확인한다. 절 번호가 이 파일과 다르면 정본(DESIGN_SYSTEM·UX_SPEC)을 따른다.
3. T1을 `researcher` 하위 에이전트 2개로 **병렬** 시작한다(§7 T1의 프롬프트 필수 항목 포함). 기다리는 동안 T0 선행 조건이 충족되면 T0를 한다.
4. T1 결과를 표본 재확인 → T2 → T3(AskUserQuestion) → T4 → T5 순서로 진행하고, 각 단계 끝에 §9 체크포인트를 갱신한다.
5. 매 커밋: 한국어 메시지, 마지막 줄 `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`, `npm run verify:quick` 통과 후 `git push origin main`.

새 세션 첫 프롬프트 예: `tasks/TASK-DS-REF.md 이어서. T1부터 시작.`

## 9. 체크포인트

- 완료: 2026-09-04 조사·사용자 결정 3건·이 계획 파일. 저장소 파일 변경 없음(이 파일 추가만).
- 다음: T0 선행 조건 확인 → T1 researcher 2개 병렬 시작.
- 결정: D-037 초안(§5, 번호는 T0에서 확정). `docs/DECISIONS.md` 반영은 T0.
- 실패: 없음. 단, 이 파일을 처음 쓸 때 다른 세션이 이미 D-036을 쓴 것을 뒤늦게 확인해 번호를 D-037로 고쳤다 — 같은 실수를 막기 위해 T0 첫 단계가 번호 확인이다.
- 주의: `docs/DECISIONS.md`·`docs/DESIGN_SYSTEM.md`·`design/style-guide.html`·`tasks/CURRENT_TASK.md`는 2026-09-04 현재 다른 세션이 수정 중(미커밋). `design/reference/`는 아직 없는 디렉터리이며 T1이 만든다.

## 10. 검증 증거

- 명령/평가: (T5에서 채움)
- 결과:
- 미검증/알려진 제한: 패키지 tarball 내 LICENSE 파일, 브라우저 단독 런타임 동작은 확인하지 않았다(결론에 영향 없음).
