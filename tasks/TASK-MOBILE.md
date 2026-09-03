# TASK-MOBILE — 개인 iPhone 설치형 홈 화면 웹앱 방향 확정과 standalone 검증 (새 세션 인계)

## 상태

`planned` — 2026-09-04 분석 세션 결과. 사용자가 "PWA가 적합한지 검증하고 아니면 더 나은 방식을 찾아라"고 요청했고, 분석 결론은 **service worker·오프라인 없는 설치형 홈 화면 웹앱(manifest `display: standalone`)**이다. 이 결론은 아직 `docs/DECISIONS.md`에 기록되지 않은 **제안**이며, 정본(PRD §4, ARCHITECTURE §2, D-032)은 여전히 "Cloudflare Pages(UI) + Workers(API)" 분리 구성을 서술한다. 새 세션에서 "tasks/TASK-MOBILE.md 이어서"라고 말하면 §9 절차로 시작한다.

다른 세션이 `docs/DECISIONS.md`·`docs/DESIGN_SYSTEM.md`·`design/style-guide.html`·`tasks/CURRENT_TASK.md`를 수정 중일 수 있다(TASK-DS-REF 참조). 이 파일은 그 파일들을 건드리지 않고 자체 완결로 작성했다.

GitHub 이슈: §12 표(https://github.com/SKUnohtaekyung/emotion-diary/issues/1 ~ /9).

## 1. 목표

개발자 본인 iPhone 1대에서 감정일기를 홈 화면 아이콘으로 실행하고, 주소창 없는 전체 화면·하단 탐색·safe area·자체 뒤로 가기를 갖춘 앱처럼 쓸 수 있게 하는 **기술 방향을 결정으로 기록하고, 그 결정이 실기기에서 성립함을 증거로 확인한 뒤, Phase 1 뼈대가 그 위에 올라갈 수 있는 상태**를 만든다.

## 2. 범위

- 포함: 결정 기록(모바일 구현 방식, D-032 호스팅 구성 교정), B-08 standalone 실기기 스파이크, 정본 동기화(PRD·ARCHITECTURE·UX_SPEC·EVAL_PLAN·RISK_REGISTER·quality-gates·runtime-profile·TRACEABILITY), Phase 1 뼈대의 모바일 관련 명세(단일 origin, SPA 셸, 환경 분리, 디버깅 수단, 갱신 감지), 독립 검증.
- 제외: UI 프레임워크 선택(Phase 1 scaffold에서 별도 결정), Web Push 구현(후속 §11), 오프라인·service worker, native/WebView wrapper, Android 실기기, AI 경로, 디자인 시스템 값 변경(D-033~D-036 불변), 유료 자원(D-019).

## 3. 연결 요구사항

- `PR-002`(제한 접근·모바일 브라우저), `PR-011`(알림 fallback), `PR-014`(개인정보·export), `PR-015`(모바일·오류·MVP 제외).
- 게이트: `B-02`, `B-03`, `B-08`(EVAL §4), `F-01`, `F-08`, `F-09`, `F-10`, EVAL §6 모바일, `mobile-real-device`(quality-gates release).
- 위험: `RK-001`, `RK-004`, `RK-010`. 신규 위험 초안은 §6.
- 관련 결정: D-011, D-018, D-019, D-021, D-025, D-032(교정 대상), D-034~D-036(불변). 신규 결정 초안은 **D-038**로 표기했다. **번호 주의**: 2026-09-04 작업 트리는 D-036까지 사용했고 TASK-DS-REF가 D-037을 예약했다. T0에서 `docs/DECISIONS.md` 마지막 번호를 확인해 이 파일의 D-038 표기를 실제 번호로 맞춘다.

## 4. 확정 사실 (2026-09-04 조사)

조사는 researcher 에이전트 3개가 공식 1차 자료로 수행했다. writer가 직접 재확인한 항목은 없으므로 T0에서 ★ 표시 항목 3건 이상을 WebFetch로 재확인하고 결과를 §10에 남긴다.

### 4.1 iOS 홈 화면 웹앱

| 항목 | 사실 | 출처 |
| --- | --- | --- |
| standalone 실행 ★ | manifest `display: standalone`(또는 `apple-mobile-web-app-capable`)이면 주소창 없이 상태 표시줄만 남는다. iOS 18.x는 manifest 필수 | https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/ |
| iOS 26 변화 ★ | 홈 화면에 추가한 모든 사이트가 기본으로 웹앱으로 열린다. 사용자가 "웹 앱으로 열기" 토글을 끌 수 있다. manifest·SW는 선택 | https://webkit.org/blog/17333/webkit-features-in-safari-26-0/ , https://developer.apple.com/documentation/safari-release-notes/safari-26-release-notes |
| 저장소 분리 | 홈 화면 웹앱은 Safari와 상태를 공유하지 않는 별개 개체. iOS에서 Safari cookie가 복사되는지는 공식 근거 없음 | https://bugs.webkit.org/show_bug.cgi?id=181849 |
| cookie 수명 ★ | ITP 7일 상한은 `document.cookie`로 만든 cookie와 스크립트 저장소 대상. 서버 설정 HttpOnly cookie는 비대상. 홈 화면 웹앱은 별도 사용일 카운터 | https://webkit.org/blog/8613/intelligent-tracking-prevention-2-1/ , https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/ |
| Web Push | iOS 16.4+ 홈 화면 웹앱에서 지원. 사용자 제스처 필수, 알림 미표시 push 금지. iOS 18.4+ Declarative Web Push(SW 불필요). Badging API 지원. Apple 개발자 계정 불필요 | https://developer.apple.com/documentation/safari-release-notes/safari-16_4-release-notes , https://webkit.org/blog/16535/meet-declarative-web-push/ , https://webkit.org/blog/12945/meet-web-push/ |
| 파일 다운로드 | standalone에서 `Content-Disposition: attachment` 동작을 뒷받침하는 공식 근거 없음. 실패 보고는 WebKit 밖(Safari UI)으로 이관됨 | https://bugs.webkit.org/show_bug.cgi?id=275288 , https://bugs.webkit.org/show_bug.cgi?id=236943 |
| 뒤로 스와이프 | 공식 문서 없음. 비공식: 동작하며 끌 수 없음 | https://github.com/w3c/manifest/issues/1041 |
| 백그라운드 복귀 재로드 | 공식 문서 없음 | — |
| safe area | `viewport-fit=cover` + `env(safe-area-inset-*)` | https://webkit.org/blog/7929/designing-websites-for-iphone-x/ |
| 키보드 | `interactive-widget` viewport meta는 WebKit 미구현(버그 NEW). `visualViewport`로 처리 | https://bugs.webkit.org/show_bug.cgi?id=259770 |
| 외부 링크 | scope 밖 링크는 Safari View Controller로 열림. `window.open`은 웹앱 안 | https://developer.apple.com/videos/play/wwdc2023/10120/ |
| EU 17.4 | EU 한정 제한이었고 정식판에서 철회. 한국 무관 | https://bugs.webkit.org/show_bug.cgi?id=268643 |
| 사용자 기기 | 2026-09-02 시점 iOS 18.7. 카카오톡 인앱 WebView에서만 접속 확인 | `harness/runtime-profile.json` `phone_access_confirmed` |

### 4.2 Apple 배포 제약 (Mac 없음 가정)

| 항목 | 사실 | 출처 |
| --- | --- | --- |
| 무료 Apple ID | Xcode(macOS 전용)로 실기기 설치 가능. 프로파일 7일 만료, 기기당 앱 3개 | https://developer.apple.com/support/compare-memberships/ |
| 유료 Program | 연 USD 99. Ad Hoc 연 100대, TestFlight 빌드 90일 | https://developer.apple.com/help/account/membership/program-enrollment/ , https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview |
| Capacitor / Tauri | macOS+Xcode 필수 | https://capacitorjs.com/docs/getting-started/environment-setup , https://v2.tauri.app/start/prerequisites/ |
| Expo EAS | Mac 없이 클라우드 빌드 가능하나 실기기 설치는 유료 Program 필수 | https://docs.expo.dev/build/internal-distribution/ |
| 사이드로딩 | AltStore/Sideloadly는 7일 재서명·PC 상시 의존. AltStore PAL은 EU·일본·브라질만 | https://faq.altstore.io/altstore-classic/your-altstore , https://faq.altstore.io/altstore-pal/what-is-altstore-pal |
| 홈 화면 웹앱 | 계정·서명·Mac·개발 도구 불필요. 서버 배포가 곧 업데이트 | https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios |

### 4.3 Cloudflare

| 항목 | 사실 | 출처 |
| --- | --- | --- |
| 권장 플랫폼 ★ | "Start new projects with Workers." Pages는 신규 권장 아님. Cron Triggers는 Workers만 | https://developers.cloudflare.com/pages/ , https://developers.cloudflare.com/workers/static-assets/compatibility-matrix/ |
| site 경계 ★ | `workers.dev`·`pages.dev`는 Public Suffix List 등재 → 서로 다른 site. `SameSite=Lax` cookie는 cross-site `fetch()`에 미전송. Safari ITP는 third-party cookie 전면 차단 | https://github.com/publicsuffix/list/pull/772 , https://github.com/publicsuffix/list/pull/1093 , https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie , https://webkit.org/tracking-prevention/ |
| 정적 자산 | 요청 무료·무제한. 기본 캐시 `public, max-age=0, must-revalidate` + ETag. `run_worker_first`로 `/api/*`만 Worker 우선 | https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/ , https://developers.cloudflare.com/workers/static-assets/headers/ |
| 무료 한도 | Workers 100,000요청/일, CPU 10ms. D1 읽기 5M/일, 쓰기 100k/일, 5GB | https://developers.cloudflare.com/workers/platform/limits/ , https://developers.cloudflare.com/d1/platform/pricing/ |
| Cron | 무료 계정당 5개, UTC 고정, 지연 보장 없음 | https://developers.cloudflare.com/workers/configuration/cron-triggers/ |
| Web Push 서버 | Node `web-push`는 `node:https` 의존으로 부적합. WebCrypto 기반 `@block65/webcrypto-web-push` 등 존재(유지보수 상태 미확인) | https://github.com/block65/webcrypto-web-push |
| Access | workers.dev에 적용 가능하나 Zero Trust 활성화 전제. 무료 50석 수치는 2020 블로그 근거 | https://developers.cloudflare.com/workers/configuration/cloudflare-access/ |

### 4.4 기존 스파이크 증거의 해석 (정정)

기존 B-02/B-03 partial PASS는 `wrangler deploy`로 **Worker 하나**(`<spike-worker>.workers.dev`)에 배포해 얻었고 Pages 배포 기록은 없다. 따라서 "Pages+Workers 분리 구성에서 cookie가 깨진다"는 실측이 아니라 **PSL·SameSite·ITP 사양에서 도출한 판단**이고, 분리 구성은 검증된 적이 없는 상태다. 결정 문서에는 "분리 구성은 사양상 iPhone에서 세션이 동작하지 않으므로 채택하지 않는다(실측 아님)"로 적는다. 분리 구성의 실패를 실측할 필요는 없다(채택하지 않을 구성에 비용을 쓰지 않는다).

## 5. 재검토에서 찾은 누락 (분석 보고에 없던 것)

Sonnet verifier의 독립 검토와 writer 재검토를 합친 목록이다. 각 항목은 §8의 task와 §12의 이슈에 연결된다.

| # | 누락 | 왜 중요한가 | 반영 task |
| --- | --- | --- | --- |
| G-01 | 결론이 Decision으로 기록되지 않아 정본(`docs/ARCHITECTURE.md` 9·14~16·36행, D-032, `harness/runtime-profile.json` hosting.target)과 충돌 중 | AGENTS §3·§4 위반 상태. 제안이 사실처럼 읽힌다 | T0, T2 |
| G-02 | 단일 origin 필요성은 실측이 아닌 사양 도출(§4.4) | 근거 성격을 정확히 적어야 나중에 "검증됨"으로 오해하지 않는다 | T2 |
| G-03 | `docs/ARCHITECTURE.md` §10에서 `B-08` 라벨이 "휴대폰 접속"(184행)과 "Web Push/background"(190행) 두 행에 중복 | standalone 검증 항목을 추가하면 어느 판정이 어느 검증인지 모호 | T2 |
| G-04 | 세션 만료 정책이 없다. `HttpOnly` cookie의 Max-Age·갱신·만료 시 재진입 화면(UX §2 "탐색 밖 진입 화면"만 언급) | standalone은 며칠 뒤 다시 열리는 사용 패턴. 세션 cookie(Max-Age 없음)면 프로세스 종료마다 재로그인 | T2 |
| G-05 | 삭제 시 "재인증"(ARCHITECTURE §5)이 UX_SPEC §7·§13에 화면으로 없다 | 긴 토큰을 다시 타이핑하는 마찰. `autocomplete="current-password"`로 iCloud Keychain 저장을 허용하는지 결정 필요 | T2 |
| G-06 | 토큰이 URL에 실리는 경로 금지가 명시돼 있지 않다 | 홈 화면 추가는 그 순간의 URL을 저장한다. 토큰이 query/fragment에 있으면 아이콘에 남는다. `start_url`은 항상 깨끗해야 함 | T2 |
| G-07 | Cloudflare Access를 앞단에 두면 standalone에서 외부 IdP 리다이렉트·cookie 반환이 되는지 미검증 | ARCHITECTURE §6이 Access를 "추가 경계 후보"로 남겨 둠. MVP에서 제외하거나 검증 항목으로 명시해야 함 | T2 |
| G-08 | Mac 없이 iPhone standalone을 디버깅할 수단이 없다(Web Inspector는 Mac 필요) | B-08 스파이크와 이후 모든 실기기 검증의 실행 가능성을 좌우 | T1, T3 |
| G-09 | 스파이크 코드는 `work/`(Git 제외)에 만들어 왔다 | B-08 산출물(manifest·셸·진단 패널)이 Phase 1로 승계되지 않고 사라질 수 있음 | T0(결정), T1 |
| G-10 | 개발/운영 환경 분리가 없다 | 실사용 시작 후 운영 D1에 실제 일기가 쌓인다. 테스트 데이터와 섞이면 개인정보·무결성 문제 | T3 |
| G-11 | 배포 후 standalone 인스턴스의 갱신 감지가 없다 | SW 없이 오래 열린 웹앱은 이전 JS를 계속 실행. API와 클라이언트 버전 불일치 | T3 |
| G-12 | UX_SPEC에 내비게이션·뒤로 가기·화면 스택 요구가 없다 | standalone에는 브라우저 뒤로 버튼이 없음 | T2 |
| G-13 | 앱 전환기 스크린샷에 일기 원문 노출 | PRD §11 최소 노출 원칙. 웹앱은 기본 가림 수단이 없음. `visibilitychange` 시 가림 오버레이 여부는 사용자 결정 | T0(질문), T2 |
| G-14 | 내보내기 fallback으로 클립보드 복사를 쓰면 Universal Clipboard로 다른 기기에 전파 | UX §13이 금지하지 않음. 명시적 금지 필요 | T2 |
| G-15 | 알림 본문에 감정·사건 내용 포함 금지 규칙이 없다 | 잠금 화면 노출. Web Push 도입 전 UX §10에 적어야 함 | T2 |
| G-16 | iOS 26+ "웹 앱으로 열기" 토글과 iOS 18 manifest 요구를 동시에 만족해야 하고, `beforeinstallprompt`가 없어 설치 안내 화면이 필요 | 사용자 기기 OS 업데이트 시점을 알 수 없음 | T1, T2 |
| G-17 | 접근성 검증에 standalone 모드(VoiceOver) 커버리지가 없다 | EVAL §6은 Safari 탭 기준으로만 읽힌다 | T2 |
| G-18 | `visualViewport` 기반 키보드 처리와 뒤로 스와이프 존재 여부는 실기기로만 확인 가능 | 하단 고정 저장 버튼(DESIGN_SYSTEM)이 키보드에 가리면 핵심 흐름 실패 | T1 |
| G-19 | 광고차단·"모든 쿠키 차단" 같은 iPhone 설정이 켜져 있으면 로그인 불가 | 온보딩 오류 문구에 원인 안내 필요(낮음) | T2 |

## 6. 결정 초안 D-038 (T0 승인 후 `docs/DECISIONS.md`에 합칠 원문)

```text
ID / 날짜 / 상태 / 결정자: D-038 / 2026-09-0X / accepted / 사용자
문제: 개인 iPhone 1대에서 앱처럼 쓰기 위한 모바일 구현 방식이 미정이었고, D-032의 "Pages(UI)+Workers(API)" 분리 구성이 iPhone 세션 cookie와 양립하는지 검토되지 않았다.
관찰 근거: (a) 계획된 기능에 OS 기능 접근(카메라·마이크·위치·파일·백그라운드)이 없다. (b) 홈 화면 웹앱은 계정·서명·Mac 없이 설치되고 서버 배포가 곧 업데이트다. (c) 모든 네이티브 대안은 macOS, 유료 Apple Developer Program(USD 99/년), 또는 7일 재서명 중 하나 이상을 요구한다. (d) workers.dev와 pages.dev는 Public Suffix List에 등재된 서로 다른 site여서 SameSite=Lax cookie가 cross-site fetch에 실리지 않고 Safari는 third-party cookie를 전면 차단한다(사양 도출, 실측 아님). (e) 기존 B-02/B-03 증거는 Worker 하나에서 얻었다. (f) 오프라인은 DATA_MODEL §6이 금지하므로 service worker가 필요 없고, iOS는 SW 없이도 standalone 설치가 된다.
선택: 모바일 구현 방식은 service worker·오프라인 없는 설치형 홈 화면 웹앱(manifest display: standalone)이다. 호스팅은 Worker 하나가 Static Assets(SPA 셸)와 /api/*를 같은 host에서 제공한다(D-032의 Pages 부분을 이 문장으로 교정, 나머지 D-032는 유지). 클라이언트는 SPA 셸·클라이언트 라우팅·자체 뒤로 가기·서버 정본 상태를 갖는다. 세션은 장기 HttpOnly cookie(Max-Age와 갱신 규칙은 T2에서 확정)이며 토큰은 URL에 실리지 않는다.
대안과 기각 이유: Capacitor/Tauri 래핑 — macOS·Xcode 필수, PRD §12 제외 항목; 조건 발생 시 차선. Expo/RN — 유료 계정 필수·UI 재작성. Swift — Mac 필수·재사용 0. AltStore/Sideloadly — 7일 재서명·비공식. PWABuilder App Store — Mac·계정·심사. 풀 PWA(SW·오프라인) — 오프라인 금지 범위.
제품·데이터·안전·비용 영향: 제품 범위·데이터 계약 변화 없음. 비용 0 유지. standalone 특유 개인정보 규칙 추가(앱 전환기 가림 여부, 클립보드 내보내기 금지, 알림 본문 규칙).
검증 방법: B-08 standalone 실기기 스파이크(TASK-MOBILE T1) — 홈 화면 아이콘으로 연 standalone 모드에서 cookie 왕복·CSRF 헤더·내보내기·복귀·키보드·스와이프.
되돌림/마이그레이션: 웹 자산은 그대로 두고 Capacitor 래핑을 추가하는 경로가 열려 있다. 호스팅 교정은 코드 이전에 결정하므로 마이그레이션 없음.
재검토 조건: 내보내기가 standalone에서 어떤 방식으로도 동작하지 않을 때, 백그라운드·네이티브 기능 요구가 PRD에 추가될 때, Mac을 확보하고 Web Push·오프라인 이상의 요구가 생길 때.
사용자 승인 필요 여부: 필요(T0에서 AskUserQuestion).
```

RISK_REGISTER 추가 초안:

- `RK-020 | 홈 화면 standalone 웹앱에서 JSON 내보내기 다운로드가 동작하지 않음 | medium | medium | T1 스파이크 3방식 실패 | navigator.share(files) 또는 "Safari에서 열기" 경로 | 클립보드 복사는 금지 | open`
- `RK-021 | Mac 부재로 iPhone standalone 콘솔·네트워크를 직접 볼 수 없음 | high | medium | 실기기 오류 재현 불가 | 앱 내 진단 패널(개발 환경 전용)+오류 보고 endpoint(일기 원문 denylist) | Playwright WebKit(Windows)으로 근사 검증 | open`
- `RK-022 | 오래 열린 standalone 인스턴스가 구버전 클라이언트로 신버전 API를 호출 | medium | low | 배포 후 스키마 불일치 오류 | /api/session에 클라이언트 버전 비교, visibilitychange 시 갱신 안내 | 강제 새로고침 안내 | open`

## 7. 완료 기준·성공 기준을 세우기 전에: 기준이 주는 치명적 단점

기준을 먼저 정하면 작업이 기준만 향한다. 이 작업에서 실제로 일어날 수 있는 실패 형태와, 그래서 기준을 어떻게 설계했는지 적는다. §8의 각 task 기준은 이 표를 통과하도록 썼다.

| # | 치명적 단점 | 이 작업에서의 구체적 형태 | 기준 설계 대응 |
| --- | --- | --- | --- |
| 1 | **측정 환경을 바꿔 통과시킨다** | Safari 탭이나 PC Chrome에서 확인하고 "동작"으로 보고. 홈 화면 아이콘으로 연 standalone은 한 번도 안 열어 봄 | 모든 실기기 기준은 `display-mode: standalone` 매치가 화면에 표시된 상태의 스크린샷을 증거로 요구한다. 탭 결과는 별도 열에 적고 standalone 열이 비면 미검증 |
| 2 | **1회 성공을 안정성으로 착각** | 홈 화면 추가 직후 1회 열어 보고 PASS. 앱 완전 종료 후 다음 날 재실행·세션 만료 사례는 건너뜀 | 복귀·만료 기준은 최소 두 시점(즉시, 12시간 이상 경과)을 각각 기록하게 한다 |
| 3 | **옛 증거를 새 결론에 재사용** | 기존 B-02/B-03 partial PASS를 "단일 Worker 재검증 완료"로 인용 | T1은 새 스파이크 Worker에서 cookie·CSRF 헤더를 다시 측정한다. 기존 증거는 참고로만 링크 |
| 4 | **과정 기준은 결과를 보장하지 않는다** | "문서를 갱신했다", "에이전트가 조사했다"는 확인할 수 없다 | 완료 기준은 산출물의 관찰 가능한 속성(파일·행·URL·확인일·하네스 결과·스크린샷 파일명)만 쓴다 |
| 5 | **하위 에이전트가 출처를 지어낸다** | URL·수치를 그럴듯하게 생성 | 모든 사실에 URL+확인일. writer가 표본 3건을 직접 재확인. 불일치 1건이면 그 산출물 전체 재검토 |
| 6 | **기준이 범위를 넓힌다** | "앱다운 UI"를 좇아 프레임워크·컴포넌트 라이브러리·Web Push까지 이번에 결정 | 제외 범위(§2)를 각 task 중단 조건에 반복. 프레임워크·Web Push 논의는 기록만 하고 넘긴다 |
| 7 | **기준 충족을 위해 확정 결정을 되돌린다** | 다운로드가 안 되니 오프라인 캐시·SW를 넣자, 하단 탭을 없애자 | 불변 목록(§8.0)을 명시. 충돌 후보는 자동 `보류` |
| 8 | **빈 스크립트로 게이트 통과** | Phase 1에서 `"lint": "echo ok"`로 `lint-configured` 라벨만 채움 | T3 완료 기준에 "lint가 의도적으로 넣은 오류 1건을 실제로 잡는다"를 포함 |
| 9 | **완료 기준이 성공 기준을 대체** | 파일이 있고 하네스가 통과하니 끝났다고 본다 | 완료(끝났는가)와 성공(쓸모 있는가)을 분리. 성공은 사용자 승인(T0)과 독립 검증(T4)으로만 닫힌다 |
| 10 | **개인정보 기준이 기능 기준에 밀린다** | 내보내기 성공을 위해 클립보드 복사를 채택, 디버깅을 위해 오류 로그에 입력값을 실음 | T1·T3 완료 기준에 denylist 검사(로그·진단 패널·이슈 본문에 일기 원문·토큰 0건)를 넣고, 클립보드 복사는 금지로 고정 |

## 8. 작업 분할

### 8.0 전 task 공통 불변·중단 조건

- 불변: D-018(제한 MVP 우선), D-019(유료 자원 금지), D-025(CSRF), D-029/D-031(AI 경로), D-034~D-036(디자인), DATA_MODEL §6(로컬 저장 금지·오프라인 금지), PRD §12 제외 목록, SAFETY_POLICY 최소 노출.
- 금지: 일기 원문·토큰·계정 정보를 코드·로그·스크린샷·이슈·체크포인트에 넣는 것. 유료 서비스 가입. 스파이크에 실제 일기 입력(합성 데이터만). 다른 세션이 수정 중인 파일 편집(`git status`로 확인).
- 중단: 같은 가설 2회 실패 시 재진단(AGENTS §5). 권한·개인정보 경계가 불명확하면 차단으로 기록하고 사용자에게 묻는다.
- 파일 소유: writer 1명. 하위 에이전트는 `researcher`·`verifier` 역할만 쓰고 읽기 전용. **Sonnet 사용 지침**: 공식 문서 조사·체크리스트 초안·독립 검증처럼 범위가 닫힌 작업은 `model: sonnet`으로 위임하고, 결정·정본 편집·실기기 판정은 writer가 직접 한다. 위임 프롬프트에는 반드시 "사실/추론/미확인 구분, URL+확인일, 코드 블록 금지(문서 산출물), 일기 원문·토큰 금지"를 넣는다.

### T0 — 정합 확인과 결정 승인 (writer, AskUserQuestion)

- 선행 조건: `git status`에서 `docs/DECISIONS.md`·`docs/ARCHITECTURE.md`·`PRD.md`·`tasks/CURRENT_TASK.md`가 다른 세션의 미커밋 변경으로 잡혀 있지 않을 것. 있으면 질문(2)만 하고 T1으로 진행하며, T2 전에 돌아온다.
- 할 일:
  1. `docs/DECISIONS.md` 마지막 번호 확인 → 이 파일의 D-038 표기 확정.
  2. §4 ★ 항목 3건 이상을 WebFetch로 재확인하고 §10에 기록.
  3. 사용자에게 한 번에 묻는다(질문 4개 이하): (a) D-038 초안 승인 여부, (b) 스파이크 코드를 Git 추적 디렉터리(`spikes/b08-standalone/`, secret 제외)에 둘지 기존 관례대로 `work/`에 둘지, (c) 앱 전환기 가림 오버레이를 기본 ON으로 둘지(설정에서 끌 수 있게), (d) Mac 보유 여부(차선 경로 비용 평가에 필요, 없으면 §4.2 가정 유지).
- 완료 기준: 네 답이 이 파일 §10 체크포인트 `결정:` 줄에 기록되고, D-038 번호가 확정되고, ★ 재확인 3건의 URL·확인일·일치 여부가 §10에 있다.
- 성공 기준: 사용자가 답을 고르는 데 문서를 다시 열 필요가 없도록 질문 안에 문제·제안·영향이 한 줄씩 들어 있다. D-038 원문만 읽어도 "왜 PWA인가", "왜 단일 origin인가(사양 도출임)", "언제 재검토하는가"를 답할 수 있다.
- 중단 조건: (a)가 기각이면 T1~T3를 진행하지 않고 대안 검토를 새 task로 분리한다.

### T1 — B-08 standalone 실기기 스파이크 (writer + researcher(sonnet) 1명)

- 입력: 기존 스파이크 Worker(`emotion-diary-spike`, 합성 데이터만, 토큰은 회전됨)의 세션·CSRF 경로. `work/spikes/g2a-cloudflare/`가 이 PC에 있으면 재사용, 없으면 ARCHITECTURE §5·§6 계약대로 최소 Worker를 다시 만든다(다른 PC에서 시작하는 경우).
- 사전 위임(sonnet researcher): "Mac 없이 iPhone Safari 홈 화면 웹앱을 디버깅하는 수단"을 공식 자료로 조사 — Safari Web Inspector의 Mac 요구, `visualViewport`·`display-mode` 감지 API, Playwright WebKit(Windows)의 iOS 근사 한계, 무료 범위의 실기기 클라우드 유무(D-019 위반 여부 표시). 산출물: `spikes/b08-standalone/DEBUGGING.md`(또는 `work/`), 표 형식, URL+확인일, 코드 블록 없음.
- 산출물: 스파이크에 추가되는 것 — manifest(`display: standalone`, `start_url: /`, `scope: /`, 아이콘 180·192·512), `index.html` 셸(하단 탭 4개 자리, `env(safe-area-inset-bottom)` 위 고정 버튼, `viewport-fit=cover`), **진단 패널**(화면 하단에 접히는 영역: `display-mode` 매치 결과, `visualViewport` 높이, 마지막 API 상태 코드, 오류 메시지. 일기 원문·토큰 표시 금지), `/api/export-test` 합성 JSON 응답 3방식(attachment 헤더 / blob+`download` / `navigator.share({files})`), `/api/session`에 요청 헤더 에코(`Origin`·`Sec-Fetch-Site`·custom header 유무만, 값은 로그하지 않음).
- 검사 항목(모두 홈 화면 아이콘으로 연 standalone에서, 진단 패널이 `standalone: true`를 보이는 스크린샷과 함께):

| ID | 검사 | 기록 |
| --- | --- | --- |
| S-01 | Safari에서 홈 화면 추가 → 아이콘 실행 시 주소창 없음, `display-mode: standalone` 매치 | 스크린샷 |
| S-02 | 웹앱 안에서 토큰 입력 → cookie 발급 → 앱 완전 종료 → 재실행 시 세션 유지(즉시) | 상태 코드 |
| S-03 | S-02를 12시간 이상 경과 후 반복 | 상태 코드, 경과 시간 |
| S-04 | PUT에 custom header 포함 → 200, 미포함 → 403. 서버가 본 `Origin`·`Sec-Fetch-Site` 유무 | 에코 결과 |
| S-05 | 내보내기 (a) attachment (b) blob+download (c) `navigator.share` 각각 PASS/FAIL과 파일이 도착한 위치 | 3행 |
| S-06 | 작성 화면에 합성 텍스트 입력 → 다른 앱으로 전환 5분 → 복귀 시 입력 유지 여부. 30분도 1회 | 2행 |
| S-07 | 텍스트 입력 포커스 시 하단 고정 버튼이 키보드에 가리는지, `visualViewport` 높이 변화 | 스크린샷 |
| S-08 | 가장자리 왼쪽 스와이프로 뒤로 가기가 일어나는지 | 관찰 |
| S-09 | 외부 링크(위기 연락처 자리) 탭 시 Safari View Controller로 열리고 돌아올 수 있는지 | 관찰 |
| S-10 | iOS 26 이상으로 업데이트된 경우에만: "웹 앱으로 열기" OFF 상태에서 같은 URL이 Safari 탭으로 열리고 셸이 깨지지 않는지 | 조건부 |
| S-11 | 홈 화면 아이콘 삭제 → 재추가 시 세션이 남는지(데이터 삭제 여부) | 관찰 |
| S-12 | 진단 패널·서버 로그에 입력 텍스트·토큰이 0건 | grep 결과 |

- 완료 기준: S-01~S-09·S-11·S-12 각각에 PASS/FAIL/미검증과 증거 파일명이 이 파일 §11에 기록된다(S-10은 기기 OS에 따라 미검증 허용). 스크린샷은 `work/spikes/b08-standalone/evidence/`(Git 제외)에 두고 파일명만 기록한다. 스파이크 코드에 secret이 없다(`wrangler secret`만). `npm run verify:quick` PASS.
- 성공 기준: S-01·S-02·S-04가 PASS이고, S-05 중 하나 이상이 PASS이거나 셋 다 FAIL이면 "Safari에서 열기" 경로가 실기기로 PASS로 기록된다. S-06이 FAIL(재로드)이어도 실패가 아니며 "서버 draft 필수" 근거로 T2에 반영된다. S-12가 0건이다.
- 중단 조건: S-02가 FAIL(standalone에서 cookie가 저장되지 않음)이면 T2로 가지 않고 원인(cookie 속성·host·iOS 설정)을 재진단한다. 같은 가설 2회 실패 시 사용자에게 보고. 실제 일기 텍스트를 입력하지 않는다.

### T2 — 결정 기록과 정본 동기화 (writer)

- 선행 조건: T0 (a) 승인, T1 완료. 대상 파일에 다른 세션의 미커밋 변경이 없을 것.
- 산출물(같은 커밋에서):
  - `docs/DECISIONS.md`: D-038 행(§6 원문, T1 결과 반영). D-032 행에 "Pages 부분은 D-038로 교정" 주석.
  - `docs/ARCHITECTURE.md`: §2 다이어그램·본문을 "Worker 하나 + Static Assets + /api/*"로. §6에 세션 수명(Max-Age·갱신·만료 시 재진입 화면·삭제 재인증 방식·`autocomplete` 결정·토큰 URL 금지). §10에서 B-08 라벨 중복 해소(Web Push 행을 새 ID로). Access는 "MVP 미채택, 도입 시 standalone 리다이렉트 검증 필수"로.
  - `PRD.md` §4: "홈 화면 바로가기" 문장을 "설치형 홈 화면 웹앱(standalone, SW 없음)"으로, "검증한 경우에만" 조건은 T1 증거 링크로 닫는다.
  - `docs/UX_SPEC.md`: 새 절 "내비게이션과 화면 스택"(자체 뒤로 가기, 탭 전환 시 스택 유지 규칙, 모달·시트 닫기), "설치와 진입"(설치 안내 화면, iOS 18/26 분기, 토큰 입력 화면, 세션 만료 화면, 쿠키 차단 설정 안내 G-19), §10 알림에 "본문에 감정·사건 내용 금지", §13에 "클립보드 복사는 내보내기 수단으로 쓰지 않음"과 T1에서 확정한 내보내기 경로, §11 상태에 "앱 전환기 가림"(T0 (c) 결과).
  - `docs/EVAL_PLAN.md`: §4 B-08을 standalone 항목으로 세분화(S-01~S-12 ID 인용), §6 모바일에 standalone·VoiceOver·갱신 감지·키보드 항목 추가, §14 라벨 정의 갱신.
  - `docs/RISK_REGISTER.md`: RK-020~022 추가, RK-004 완화 문구 갱신.
  - `harness/quality-gates.yaml`: `mobile-real-device`에 S-ID 목록. `harness/runtime-profile.json`: `hosting.target`·`phone_access_confirmed` 갱신. `harness/work-graph.yaml`: `hosting-identity-spike` outputs 문구 교정(노드 추가 없음).
  - `docs/TRACEABILITY.md`: PR-002·PR-014·PR-015 행에 D-038·S-ID 연결.
  - `docs/STATUS.md` §2에 한 줄, `tasks/CURRENT_TASK.md` 상단에 이 파일 링크 한 줄(다른 세션 변경이 없을 때만).
- 완료 기준: 위 파일 각각에 해당 행·절이 존재하고, `grep -n "Cloudflare Pages" PRD.md docs/ARCHITECTURE.md docs/STATUS.md README.md`의 결과가 전부 "이전 후보/교정됨" 문맥이며, `npm run verify:quick`·`npm run verify:full` PASS.
- 성공 기준: 새 세션이 `PRD.md` §4·`ARCHITECTURE.md` §2·§6만 읽고 Phase 1 뼈대의 호스팅·세션·내비게이션 요구를 다른 문서 없이 구현할 수 있다(verifier가 T4에서 "빠진 결정" 0건으로 확인). 모든 S-ID가 EVAL과 quality-gates 양쪽에서 같은 ID로 참조된다.
- 중단 조건: D-034~D-036 값이나 PRD §12 제외 목록을 바꿔야 하는 문구가 나오면 반영하지 않고 `보류`로 기록.

### T3 — Phase 1 뼈대의 모바일 명세와 착수 (writer, 사용자 착수 승인 필요)

Phase 1(`app-scaffold`)은 STATUS §1에서 "착수 승인 대기"다. 이 task는 그 착수의 **모바일 관련 부분**을 정의하고, 승인이 있으면 구현한다. 프레임워크 선택은 이 task 시작 시 별도 결정으로 분리한다(D-039 후보, 여기서 정하지 않는다).

- 산출물(명세, T2와 함께 ARCHITECTURE에 들어가도 됨): 
  - 단일 Worker 구성: `assets` binding, `run_worker_first: ["/api/*"]`, `not_found_handling: single-page-application`, 해시 파일명 자산 `_headers` immutable, `index.html`은 기본 must-revalidate 유지.
  - 환경 분리: wrangler environments(`dev`/`prod`) 각각 별도 Worker 이름·D1·secret. 실제 일기는 `prod`에만. `dev`는 합성 데이터만. 배포 절차 문서(`docs/ARCHITECTURE.md` 또는 새 `docs/DEPLOY.md`)에 "배포 후 standalone 강제 갱신 확인" 단계.
  - 갱신 감지: 빌드 시 버전 문자열 주입, `/api/session` 응답에 최소 클라이언트 버전, `visibilitychange`에서 비교 → 배너 "새 버전이 있어요, 새로 고침" (자동 리로드는 작성 중 손실 위험이 있어 금지).
  - 디버깅: 진단 패널은 `dev` 환경 또는 설정의 숨은 스위치에서만 노출. 클라이언트 오류 보고 `POST /api/client-errors`는 메시지·스택·버전만, 입력값·URL query 금지, denylist 검사 테스트 포함. Playwright WebKit(Windows)으로 셸 레이아웃 회귀 검사.
  - 앱 셸: 하단 탭 4(D-035 이름), 화면 스택과 뒤로 가기, safe area, `visualViewport` 키보드 처리, 설치 안내·토큰 입력·세션 만료 화면, 앱 전환기 가림(T0 결정대로), `color-scheme: light`.
- 완료 기준(구현 착수 시): `npm run dev`·`lint`·`typecheck`·`test`·`build`가 `package.json`에 있고 `verify:full`이 실행한다. lint는 의도적으로 넣은 미사용 변수 1건을 실제로 실패시킨다(§7 #8). `dev` 환경에 배포한 셸을 iPhone standalone으로 열어 S-01·S-02·S-04·S-07을 재통과. 오류 보고 endpoint에 합성 입력을 보냈을 때 저장된 레코드에 입력 문자열이 없다(테스트). `prod`는 아직 배포하지 않는다.
- 성공 기준: 새 세션이 이 뼈대 위에서 Phase 2 직접 작성을 시작할 때 모바일·호스팅·세션 관련 결정을 하나도 새로 내리지 않아도 된다(T4 verifier 확인).
- 중단 조건: 사용자 착수 승인이 없으면 명세만 남기고 구현하지 않는다. 프레임워크 논의는 D-039 후보로 기록만.

### T4 — 독립 검증 (verifier, sonnet, 읽기 전용)

- 검사:
  1. §11의 S-ID 증거 파일명이 실제로 `work/spikes/b08-standalone/evidence/`에 있고(로컬), 각 스크린샷에 진단 패널의 `standalone: true`가 보인다(3건 표본).
  2. D-038 행의 "관찰 근거"가 실측과 사양 도출을 구분해 적었다(§4.4).
  3. `grep`으로 정본 전체에서 "Pages(정적 UI)" 서술이 교정됐고 B-08 라벨 중복이 없다.
  4. UX_SPEC 새 절이 G-04·G-05·G-06·G-12~G-16·G-19를 각각 덮는다(항목별 파일:줄).
  5. EVAL·quality-gates·TRACEABILITY의 S-ID 참조가 서로 일치한다.
  6. 스파이크 코드·문서·이슈 본문에 토큰·계정 이메일·일기 원문이 0건(`grep -i` 패턴: `@`, `token=`, 실제 이메일).
  7. `npm run verify:full` PASS.
  8. (T3 구현 시) lint 함정 검사, 오류 보고 denylist 테스트, `prod` 미배포 확인.
- 완료 기준: 8개 검사 각각 통과/실패/미검증과 재현 명령이 §11에 기록된다.
- 성공 기준: 실패 0건. 실패는 writer가 고치고 T4를 다시 수행하며 검사를 완화하지 않는다.

## 9. 새 세션 시작 절차

1. `git status`로 미커밋 변경을 본다. 다른 세션의 변경이 남아 있으면 그 파일은 편집하지 않는다(T0·T2 선행 조건).
2. `AGENTS.md` → 이 파일 → `PRD.md` §4·§12 → `docs/ARCHITECTURE.md` §2·§5·§6·§10 → `docs/UX_SPEC.md` §2·§10·§11·§13 → `docs/EVAL_PLAN.md` §4·§6 순서로 읽는다. `tasks/TASK-DS-REF.md`의 상태를 확인해 D-037 번호 사용 여부를 본다.
3. T0의 ★ 재확인과 사용자 질문(AskUserQuestion 1회, 질문 4개)을 먼저 한다. 답을 §10에 기록한다.
4. T1을 시작한다. 디버깅 수단 조사는 `researcher`(sonnet) 하위 에이전트에 위임하고, 스파이크 코드와 실기기 측정은 writer가 한다. iPhone 조작은 사용자에게 단계별로 요청하고 스크린샷을 받는다.
5. T1 → T2 → (승인 시) T3 → T4 순서로 진행하고 각 단계 끝에 §10 체크포인트를 갱신한다. 이슈(§12)는 task 완료 시 `gh issue close <번호> --comment "<증거 요약>"`으로 닫는다.
6. 매 커밋: 한국어 메시지, 마지막 줄 `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`, `npm run verify:quick` 통과 후 `git push origin main`.

새 세션 첫 프롬프트 예: `tasks/TASK-MOBILE.md 이어서. T0부터 시작.`

## 10. 체크포인트

- 완료: 2026-09-04 분석(researcher 3개: iOS 홈 화면 웹앱·Apple 배포·Cloudflare), Sonnet verifier 누락 검토, 이 파일 작성, GitHub 이슈 §12 생성. 저장소 정본은 수정하지 않았다.
- 다음: T0 — `docs/DECISIONS.md` 마지막 번호 확인 → ★ 재확인 3건 → 사용자 질문 4개.
- 결정: 없음(D-038은 초안).
- 실패: 없음.
- 주의: 다른 세션이 디자인 정본과 `tasks/CURRENT_TASK.md`를 수정 중일 수 있어 이 파일에 포인터를 넣지 않았다. 사용자 iPhone은 2026-09-02 기준 iOS 18.7이며 그 뒤 업데이트 여부는 확인해야 한다. Mac 보유 여부는 미확인(없음 가정).

## 11. 검증 증거

- 명령/평가: (T1·T4에서 채움)
- 결과:
- 미검증/알려진 제한: §4의 "확인 불가" 항목(뒤로 스와이프, 백그라운드 재로드, 아이콘 삭제 시 데이터, standalone 다운로드)은 T1 실기기 결과만이 근거가 된다.

## 12. GitHub 이슈 매핑

| 이슈 | 제목 | task | 누락 항목 |
| --- | --- | --- | --- |
| #1 | 모바일 구현 방식 결정 기록(D-038): 설치형 홈 화면 웹앱 + 단일 origin Worker | T0, T2 | G-01, G-02 |
| #2 | B-08 standalone 실기기 스파이크(S-01~S-12) | T1 | G-16, G-18 |
| #3 | Mac 없는 iPhone standalone 디버깅 수단(진단 패널·오류 보고 denylist) | T1, T3 | G-08 |
| #4 | 세션 수명·재인증·토큰 입력·내비게이션 UX 명세(UX_SPEC 새 절) | T2 | G-04, G-05, G-06, G-12, G-19 |
| #5 | standalone 개인정보 규칙: 앱 전환기 가림, 클립보드 내보내기 금지, 알림 본문 | T0, T2 | G-13, G-14, G-15 |
| #6 | 검증 게이트 정리: B-08 라벨 중복, EVAL §6 standalone·VoiceOver, quality-gates S-ID | T2 | G-03, G-17 |
| #7 | 개발/운영 환경 분리와 배포 후 standalone 갱신 감지 | T3 | G-10, G-11 |
| #8 | Phase 1 뼈대: 단일 Worker + Static Assets + SPA 셸 모바일 명세 | T3 | G-09 |
| #9 | (후속, Post-MVP) Web Push 스파이크: Cron + WebCrypto VAPID, iOS 제약 | — | RK-004 |
