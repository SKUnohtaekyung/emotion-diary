# 초기(매출·트랙션 이전) 단계의 질의응답과 약점 제시 — 실무자 조언과 연구 근거

2026-11-18 조사. 이미 [02-사업계획서-작성법](../../02-사업계획서-작성법.md)과 [04-시장-수치](../../04-시장-수치.md)에 있는 것(PSST 양식, Paul Graham의 How to apply, YC 다섯 인터뷰 질문, Mom Test, Steve Blank 꽃잎 그림, Sequoia 구성, a16z 16 지표 정의, RevenueCat 전환율, bottom-up 계산 틀, eopla·brunch 후기, innoforest "경쟁자 없음")은 되풀이하지 않고 절 번호로 가리킨다.

**조사 환경의 한계(먼저 읽을 것).** 이 세션에서는 원문 페이지를 열 수 없었다. `www.ycombinator.com`, `abovethecrowd.com`이 네트워크 정책으로 막혔고(프록시 403), 지침에 따라 다른 사이트는 더 시도하지 않았다. 그래서 모든 내용은 **검색 엔진이 돌려준 요약**으로 확인한 것이다. 원문 확인이 필요하면 해당 호스트를 세션 네트워크 설정에서 허용해야 한다.

**근거 표시**

- [원문] 저자·기관 페이지나 논문 본문을 직접 열어 읽은 것 — **이 노트에는 없다.**
- [미확인-초록] 원문은 못 열었고, 논문의 서지·초록 색인(EconPapers, RePEc, 학술지 색인 등)을 검색 요약으로 본 것. 서지 정보는 비교적 믿을 만하고, 효과 크기·표본 세부는 미검증.
- [미확인-요약] 원 페이지 주소는 알지만 내용은 검색 엔진 요약으로만 본 것.
- [2차] 출처 자체가 기사·블로그·요약 글인 것. 벤더·컨설팅 블로그가 많아 수치는 경험칙으로만 쓴다.
- [추론] 위 사실에서 끌어낸 판단.

---

## 1. 투자자·액셀러레이터·심사위원이 자주 묻는 질문 (주제별)

### Takeaway
질문은 거의 언제나 "왜 이것(문제·고객)·왜 지금·왜 너희·어떻게 이기나(경쟁)·어떻게 돈 버나·지금까지 무엇을 했나"로 수렴한다. 한국 발표평가 후기에서도 문제·해결책·목표 시장·시장성·팀에서 고르게 나왔다(02 §2). 특이한 질문을 맞히는 것보다 **이 핵심 질문에 30초 안의 직답**을 준비하는 것이 실무자 공통 조언이다.

### Cited Findings

**YC 면접의 성격**
- YC는 면접을 "준비를 많이 하지 않아도 되도록" 설계했다고 하며, 모의 면접 연습과 프레젠테이션 준비를 권하지 않는다. 즉 발표가 아니라 **질문과 대답의 대화**다. — [YC Interview Guide](https://ycombinator.com/interviews) [미확인-요약]
- 한 안내 글은 YC 면접을 "약 10분에 40~80개 질문, 잦은 끊김, 목록 밖 질문"으로 묘사한다. 한 사람의 주장이다. — [Hackernoon, The Ultimate Guide to YCombinator Interview Preparation](https://hackernoon.com/the-ultimate-guide-to-ycombinator-interview-preparation-8372628154c3) [2차]
- Daily.co 창업자는 약 100개 질문 목록을 만들어 연습했다고 적었다. — [Kwindla, YC interview advice](https://medium.com/@kwindla/y-combinator-interview-advice-live-practice-sessions-87886a3cbf8a) [2차]

**YC 지원서에서 나온다고 알려진 질문** (공식 페이지가 아니라 커뮤니티 모음이다)
- "Who are your competitors? What do you understand about your business that they don't?" — [Shizune, YC application examples](https://shizune.co/yc-application-examples/who-are-your-competitors) [2차]
- "Why did you pick this idea to work on?" (분야 전문성 질문과 함께) — [886studios application template](https://886studios.com/application-template) [2차]
- 같은 모음들은 "경쟁자 없음"이라는 답을 흔한 실수로 꼽는다. 경험 많은 독자는 이를 "시장이 아주 작거나 조사를 안 했다"는 신호로 읽고, 큰 회사를 경쟁자로 적는 것은 괜찮으며 왜 이길 수 있는지만 설명하면 된다고 한다. — [Shizune](https://shizune.co/yc-application-examples/who-are-your-competitors), [Basedash](https://basedash.com/blog/how-to-write-a-successful-yc-application) [2차]

**Why this / Why now / Why you**
- 초기 투자 설득의 뼈대를 "왜 이것, 왜 지금, 왜 너"의 세 질문으로 잡고, 해법을 납득하면 투자자는 곧 "왜 아무도 이걸 안 만들었나"를 묻는다고 한다. — [Coding VC, Why This? Why Now? Why You?](https://www.codingvc.com/why-this-why-now-why-you/) [2차]
- 프리시드에서는 제품이 증명되지 않았으므로 질문이 창업자(실행 능력, 배경이 주는 우위)에 몰린다는 VC 블로그들의 설명, 그리고 "다듬어진 답보다 불확실성과 새 정보 앞에서 어떻게 추론하는지를 본다"는 VC 발언이 검색 요약에 있었다. 어느 페이지의 문장인지 특정하지 못했다. — [검색 결과 묶음 중 Redbud VC](https://redbud.vc/latest/the-only-pitch-prep-you-ll-ever-need) [2차, 출처 문장 미특정]
- NEA 파트너 Tiffany Luck이 "모든 창업자가 답해야 할 5가지 질문"을 말했다는 TechCrunch 기사(2025-07-19)가 있으나 내용은 확인하지 못했다. — [TechCrunch](https://techcrunch.com/2025/07/19/the-perfect-pitch-this-nea-partner-says-every-founder-should-answer-these-5-questions) [미확인]

**한국 투자자·심사위원 쪽**
- 스타트업 20팀 인터뷰 기사: VC가 꼭 하는 질문으로 "대기업이 비슷한 서비스를 하면?"(→ 그보다 잘하는 모습을 보여야 한다), 매출 질문(→ 매출이 없어도 미래 잠재 고객을 수치로 답하라)이 나온다. — [벤처스퀘어, "벤처캐피탈, 이 질문 꼭 한다"](https://www.venturesquare.net/723375) [2차]
- 매쉬업벤처스 IR 작성 가이드: 주요 경쟁자가 빠지면 투자자는 시장조사 능력을 의심한다. TAM/SAM/SOM 형식을 권하되 "산정 근거가 객관적으로 보기에도 타당"해야 하고, 경쟁을 피하려 틈새만 노리면 목표 시장이 너무 작아 보일 수 있다. — [매쉬업벤처스](https://www.mashupventures.co/contents/how-to-write-startup-ir-deck) [미확인-요약]
- 예비창업패키지 발표평가 후기(질의응답 20분, 위원 5명, 문제·해결·시장·BM의 예상 가능한 질문)는 02 §2에 이미 있다. — [eopla](https://eopla.net/magazines/1180) [2차]
- 2026년 예비창업패키지 합격 발표평가 후기([brunch](https://brunch.co.kr/@uxuxlove/342)), "슬라이드보다 중요한 건 질문에 대한 답"([플래텀](https://platum.kr/archives/267905)), IR 질문답변 스피치 칼럼([서울경제TV](https://www.sentv.co.kr/news/view/592631))은 제목만 확인했다. [미확인]

**질문의 '방향'을 보는 연구 — Kanze et al. 2018**
- Kanze, Huang, Conley, Higgins (2018), *Academy of Management Journal* 61(2), 586–614. 연구 1은 TechCrunch Disrupt NYC(2010–2016) 질의응답을 분석한 상관 연구, 연구 2는 질문·답의 조절 초점(regulatory focus)을 조작한 실험. 2019년 AMJ 최우수 논문상. — [Sciences Po 요약](https://www.sciencespo.fr/women-business/en/content/we-a%73k-men-win-and-women-not-lose-closing-gender-gap-startup-funding.html) [2차]
- 투자자 질문을 **촉진(promotion: 이득·성장·희망)**과 **예방(prevention: 손실·위험·안전)**으로 나눴다. HBR 요약(2017)에 따르면 남성 창업자는 67%가 촉진 질문, 여성 창업자는 66%가 예방 질문을 받았고, 투자자 성별과 무관했다. — [Columbia News](https://news.columbia.edu/node/1658), [2X Global 재게시](https://www.2xglobal.org/knowledge-hub-blog/male-and-female-entrepreneurs-get-asked-different-questions-by-vcs-and-it-affects-how-much-funding-they-get) [2차]
- 창업자는 받은 질문의 초점을 그대로 따라 답하는 경향이 있었다. 실험에서는 **예방 질문에 촉진 초점으로 답하면** 투자 금액이 유의하게 늘었다. — [Sciences Po](https://www.sciencespo.fr/women-in-business/en/research-and-publications/entrepreneurship/we-a%73k-men-to-win-and-women-to-lose-closing-the-gender-gap-in-startup-funding) [2차]
- 주의: 이 논문의 주제는 투자 질문의 **성별 편향**이다. 연구 1은 상관이라 질문 유형이 투자액을 "결정했다"고 말할 수 없고, 답의 재구성 효과는 연구 2의 실험 조건에서 나온 것이다. 표본 크기(흔히 인용되는 189명)는 확인하지 못했다.

### Inferences
- [추론] 이 팀이 받을 질문의 상당수는 예방 질문(유지율이 낮지 않나, 혼자 쓰지 않나, AI가 틀리면, 청소년 개인정보는)일 것이다. Kanze 연구 2를 그대로 일반화할 수는 없지만, "위험을 인정 → 그 위험을 감수하며 얻으려는 것(성장·학습) → 다음 행동"으로 답을 끝내는 구조와 잘 맞는다.
- [추론] YC가 "발표 준비보다 대화"를 강조하는 것과 국내 후기의 "답이 간결하지 못했다"는 아쉬움(02 §2)은 같은 방향이다. 질문 목록을 외우는 것보다 핵심 질문에 짧게 답하는 연습이 낫다.

### Gaps
- YC·Startup School 공식 질문 목록 원문, Michael Seibel의 면접 팁 원문(ycombinator.com 차단으로 열지 못함).
- Sequoia·a16z·First Round Review·NFX의 질문 목록 원문: 검색에 나오지 않았다.
- 한국 VC(카카오벤처스, 본엔젤스, 프라이머)의 공식 질문 목록: 찾지 못했다.
- 대학 창업경진대회 심사위원이 실제로 한 질문을 정리한 자료: 찾지 못했다.

---

## 2. 트랙션이 없을 때 증거로 인정되는 것

### Takeaway
프리시드 실무자들의 공통 입장은 "트랙션이 없는 것은 결격이 아니지만 **증거가 하나도 없는 것은 위험**"이고, 증거의 무게는 **말(설문·관심) < 행동(가입·사용·변경) < 약속(LOI·파일럿·결제)** 순이다. 가짜 트랙션은 트랙션이 없는 것보다 나쁘다. 데이터가 없을수록 초기 투자자는 창업자의 판단과 추론을 평가한다는 연구가 있다.

### Cited Findings
- 프리시드 가이드들의 공통 요지: 매출은 필요 없지만 고객 접촉의 증거는 기대된다. 대기자 명단만으로는 약하고, 설문보다 잠재 고객의 의향서(LOI)가 무겁다. 이름 있는 담당자·예산·시작일이 없는 파일럿은 도입 의지를 증명하지 못한다. 가장 강한 신호는 고객이 프로토타입을 쓰려고 **무언가를 바꾼** 행동이다. "No traction is not an automatic disqualifier at pre-seed, but zero evidence is." — [Hustle Fund, Pre-Seed Angel Investors guide](https://www.hustlefund.vc/post/the-complete-guide-to-pre-seed-capital-everything-angel-investors-need-to-know), [Preuve](https://preuve.ai/blog/is-your-startup-ready-for-pre-seed), [Deckary](https://deckary.com/blog/pre-seed-pitch-deck) [2차, 문장별 출처 페이지 미특정]
- 같은 묶음에서 "인터뷰 20개" 또는 "인터뷰 40+, 대기자 200+, LOI 3건, 베타 50명+" 같은 문턱이 나왔지만 가이드마다 숫자가 다르고 벤더 블로그다. **기준으로 인용하지 않는다.** [2차]
- 투자자는 "잠재 사용자와 이야기해 본 사람"과 "제품을 사용자 앞에 놓고 반응을 지켜본 사람"을 구분한다는 설명이 있었다. — [같은 검색 묶음](https://start-wise.io/blog/do-investors-expect-an-mvp/) [2차, 출처 문장 미특정]
- Michael Seibel(YC) 피치 강연 요약: 트랙션 슬라이드는 시작 이후 **무엇을 얼마나 빨리 했는지**를 기간과 함께 보여야 하고, 숫자를 부풀리지 않는다. 자문위원 설문이나 무관한 과거 성과로 트랙션을 꾸미는 것은 피할 실수이며, **나쁜 트랙션 슬라이드는 트랙션 슬라이드가 없는 것보다 나쁘다**. — [Fondo 요약](https://fondo.com/blog/perfectly-pitch-seed-stage-startup-y-combinator-michael-seibel), [SaaStr 요약](https://www.saastr.com/the-y-combinator-guide-to-perfectly-pitching-your-seed-stage-startup-with-michael-seibel) [2차]
- Huang & Pearce (2015), *Administrative Science Quarterly* 60(4). 귀납적 이론 구축 연구 + 현장 실험 + 종단 현장 검증의 세 연구, 대상은 경험 많은 엔젤(한 건당 25만~200만 달러를 구하는 회사를 보는 투자자). 위험을 알 수 없는 초기 단계에서 엔젤은 분석과 직관을 섞은 'gut feel' — 주로 **창업자에 대한 판단** — 에 기댄다. gut feel 투자는 타율이 낮았지만 큰 성공이 더 많았다("lower batting average, but more home runs"). — [Wharton Knowledge](https://knowledge.wharton.upenn.edu/article/gut-feel-and-investing/), [LSE Business Review](https://researchonline.lse.ac.uk/id/eprint/73701) [2차]; 서지 [미확인-초록](https://econbiz.de/Record/managing-the-unknowable-the-effectiveness-of-early-stage-investor-gut-feel-in-entrepreneurial-investment-decisions-huang-laura/10011409472). 각 연구의 표본 수는 확인하지 못했다.
- **사전 중단 기준(kill criteria)** — Annie Duke, *Quit* (2022): 프로젝트를 접거나 생각을 바꿀 기준을 **미리**, 차분할 때 정해 둔다. 좋은 기준은 "상태 + 날짜"를 함께 담는다("X일까지 Y에 못 미치면 그만둔다"). 사람은 너무 일찍이 아니라 너무 늦게 그만두는 경향이 있고, 미리 정한 기준이 매몰비용·감정의 끌림을 막는다는 주장이다. — [Next Big Idea Club, Duke 본인 요약](https://nextbigideaclub.com/magazine/quit-power-knowing-walk-away-bookbite/36452/), [Entrepreneur 인터뷰](https://www.entrepreneur.com/growth-strategies/this-decision-making-expert-says-being-a-quitter-is/435835) [2차]
- 핵심 지표 하나: Lean Canvas의 "핵심 지표 = 지금 실험의 방향을 정하는 숫자 하나"는 02 §4.2에 있다. Lean Analytics의 "One Metric That Matters" 원문은 검색되지 않았다(Gaps).
- 창업자 본인 사용(dogfooding)이 신호라는 Paul Graham의 글은 02 §4.6에 있다.

### Inferences
- [추론] "창업자가 매일 쓴다"는 **창업자가 문제를 실제로 가진 사람**이라는 증거(PG)이지 **시장 수요**의 증거는 아니다. 둘을 섞지 않고 "제품이 실제로 돌아간다 + 창업자가 직접 쓴다 = 실행력의 증거 / 다른 사람의 수요 = 아직 없음"으로 가른다.
- [추론] 지금 가진 실측 증거는 '운영 중인 제품'과 '본인 사용 기간·횟수'(실제 값이 있을 때만)다. 없는 증거(인터뷰, 대기자, 결제 의향)는 "검증 계획 = 가설 → 실험 → 지표 하나 → 판정 기준(상태+날짜)"으로 대신 보여 준다. Duke의 kill criteria와 Lean Canvas의 핵심 지표가 이 표의 근거가 된다.
- [추론] Huang & Pearce에 비추면, 데이터가 없는 팀에게 심사위원이 보는 것은 "이 사람들이 불확실성을 어떻게 다루는가"다. 검증 계획을 구체적으로 말하는 것 자체가 그 판단의 재료가 된다.

### Gaps
- "창업자는 시장이 아니다(founder is not the market)"라는 주의를 명시한 실무자 원문을 찾지 못했다. 위 구분은 추론이다.
- 프리시드 증거 문턱(인터뷰 몇 명, 대기자 몇 명)에 대한 권위 있는 기준: 없음. 벤더 블로그의 경험칙만 있다.
- Lean Analytics(Croll & Yoskovitz)의 OMTM 원문: 검색되지 않았다.
- 대기자 명단·LOI가 대학 대회 심사에서 어떻게 평가되는지에 대한 자료: 없음.

---

## 3. 시장 규모를 어떻게 보여 주나

### Takeaway
실무자 공통 조언은 **"숫자보다 계산 방식"**이다. 큰 산업 보고서 숫자에 "1%"를 곱하는 top-down 슬라이드는 획득 전략이 없다는 신호로 읽힌다. 그 대신 대상 수 × 가격으로 쌓는 bottom-up을 보이고, 실제로 닿을 수 있는 SOM을 강조한다. 단, Bill Gurley의 반론처럼 기존 시장 크기를 상한으로 삼는 것도 새 범주에서는 틀릴 수 있다. 시장이 커진다고 주장하려면 그 부분을 따로 떼어 메커니즘과 함께 보여야 한다.

### Cited Findings
- Seibel(YC) 피치 강연 요약: 시장 규모는 bottom-up으로 계산하고 **계산식을 보여라**. 숫자 자체보다 어떻게 계산했는지가 중요하다. 흔한 오류는 계산식이나 비교 가능한 제품을 보이지 않는 것이다. — [Fondo](https://fondo.com/blog/perfectly-pitch-seed-stage-startup-y-combinator-michael-seibel), [SaaStr](https://www.saastr.com/how-to-pitch-your-seed-stage-startup-with-y-combinators-michael-seibel) [2차]
- "큰 시장 × 작은 점유율(1%)" 오류: 신뢰를 가장 빨리 잃는 방법이고, 고객 획득 전략이 없다는 뜻으로 읽힌다. 분석기관 숫자는 인접 범주·지역·구매자를 함께 묶는 경우가 많아 실제로 팔 수 없는 부분이 섞인다. — [The Venture Crew, "1% Market Fallacy"](https://theventurecrew.substack.com/p/is-the-1-market-fallacy-holding-your), [TechCrunch 2022, What investors really think about the TAM slide](https://techcrunch.com/2022/11/04/what-investors-really-think-about-the-tam-slide-in-your-pitch-deck) [2차]
- 한국: 거대한 시장 규모 강조만으로는 설득력이 떨어지니 실제 도달 가능한 SOM을 제시하라. — [zuzu, 초기 스타트업 IR 체크리스트](https://start.zuzu.network/resource/blog/startup-ir-deck-checklist-7/) [2차]; 매쉬업벤처스는 TAM/SAM/SOM을 권하되 근거의 객관적 타당성, 그리고 너무 작은 틈새의 위험을 함께 짚는다. — [매쉬업벤처스](https://www.mashupventures.co/contents/how-to-write-startup-ir-deck) [미확인-요약]
- Bill Gurley, "How to Miss By a Mile"(Above the Crowd, 2014-07-11). Aswath Damodaran이 Uber의 시장을 세계 택시·리무진 시장 약 1,000억 달러(연 6% 성장), 10년 뒤 점유율 상한 10%로 잡은 것을 반박했다. Gurley는 과거 택시 시장 크기를 쓰면 "Uber가 시장 크기에 아무 영향도 주지 않는다"고 가정하는 셈이라며, 추정이 25배까지 빗나갈 수 있다고 주장했다. — [Above the Crowd 원문 주소](https://abovethecrowd.com/2014/07/11/how-to-miss-by-a-mile-an-alternative-look-at-ubers-potential-market-size/) [미확인-요약, 원문 호스트 차단]; Damodaran 측 정리는 [Damodaran 블로그](https://aswathdamodaran.blogspot.com/2014/12/up-up-and-away-crowd-valuation-of-uber.html) [미확인-요약]
- Gurley 논쟁에 대한 후대 해설: 새 수요를 과소평가할 위험에 대한 지적은 옳지만 TAM을 부풀릴 면허는 아니다. 시장 확장분은 **별도 줄로, 별도 메커니즘과 함께** 계산해 따로 검증할 수 있게 하라. — [Stratrix, TAM/SAM/SOM](https://www.stratrix.com/learn/craft/tam-sam-som) [2차]
- 한 블로그의 "top-down과 bottom-up이 15% 안에서 맞으면 가정이 탄탄하다"는 규칙은 근거가 보이지 않는다. 쓰지 않는다. — [The Venture Crew 외 검색 묶음](https://theventurecrew.substack.com/p/is-the-1-market-fallacy-holding-your) [2차]
- bottom-up 계산 틀과 넣을 숫자, 큰 시장 보고서 숫자의 범위 차이(82억~85억 달러)는 [04](../../04-시장-수치.md) §5·§7에 있다.

### Inferences
- [추론] 이 팀에게 Gurley 논리(새 범주는 시장을 키운다)를 쓰고 싶은 유혹이 있을 수 있지만, 수요 데이터가 없는 단계에서는 오히려 역효과다. 시장 슬라이드는 "SOM = 손으로 닿을 수 있는 첫 고객군 × 가정한 사용 비율 × 가정한 가격"을 주연으로 두고, 큰 보고서 숫자는 배경 한 줄로 둔다(04 §5와 같은 결론).
- [추론] 계산식의 칸마다 "실측 / 벤치마크(출처) / 가정" 표시를 붙이면, 질문이 "이 숫자 어디서 나왔나"로 와도 칸 하나를 가리키며 답할 수 있다.

### Gaps
- Gurley 원문의 정확한 문장과 그가 제시한 대안 TAM 수치(포럼의 "6조 달러" 주장은 미검증).
- Sequoia·a16z가 시장 규모 슬라이드에 대해 직접 쓴 원문: 찾지 못했다.
- Guy Kawasaki의 1% 오류 관련 원문: 검색되지 않았다.

---

## 4. 경쟁 슬라이드

### Takeaway
"경쟁자 없음"은 국내외 모두에서 **조사를 안 했거나 시장이 없다는 신호**로 읽힌다. 실무 조언은 직접 경쟁 2~3개, 간접 2~3개, 그리고 **현상 유지(status quo: 아무것도 안 하거나 기존 방식으로 버티는 것)**를 함께 놓으라는 것이다. 체크 표시 기능 비교표는 경쟁사가 쉽게 따라 할 수 있어 약하고, 고객이 신경 쓰는 축으로 그린 위치 지도가 낫다는 의견이 있다. 경쟁사를 공격적으로 깎아내리는 것은 역효과라는 연구가 있다. 투자자가 경쟁 슬라이드에 쓰는 시간은 늘고 있다.

### Cited Findings
- "경쟁사가 없다"는 말은 완전히 새로운 시장이 아니면 시장조사를 안 했다는 신호로 받아들여질 수 있고, 심사역은 경쟁자가 있다는 것을 오히려 시장이 검증됐다는 신호로 읽기도 한다. — [zuzu](https://start.zuzu.network/resource/blog/startup-ir-deck-checklist-7/) [2차]; 주요 경쟁자가 빠지면 시장조사 능력에 의문이 생긴다. — [매쉬업벤처스](https://www.mashupventures.co/contents/how-to-write-startup-ir-deck) [미확인-요약]; 02 §3의 innoforest도 같은 취지.
- 현상 유지("고객이 아무것도 하지 않으면 무슨 일이 일어나나")가 흔히 가장 큰 경쟁자다. 새 범주도 현상 유지·수작업·대체 해법과 겨룬다. — [Papermark, competitor analysis pitch deck](https://www.papermark.com/blog/competitor-analysis-pitch-deck) [2차]
- 구성 경험칙: 최대 4~7개(직접 2~3, 간접 2~3, 필요하면 현상 유지). 체크 표시 기능 비교표는 경쟁사가 쉽게 따라잡을 수 있어 방어 가능한 축으로 그린 위치 지도보다 약하다. 축은 구매자가 신경 쓰는 것으로 고른다. — [Papermark](https://www.papermark.com/blog/competitor-analysis-pitch-deck), [Waveup, competition slide guide 2026](https://waveup.com/blog/how-to-make-a-winning-competition-slide-for-your-pitch-deck/) [2차, 벤더 블로그]
- Parhankangas & Ehrlich (2014), *Journal of Business Venturing* 29(4), 543–564. 엔젤 투자자는 긍정 언어를 **적당히** 쓰고, 혁신성을 **적당히** 내세우고, 지원 호소나 **경쟁사 비판도 적당히** 하는 피치를 선호했고, 투자자 의견과의 높은 일치(conformity)를 선호했다. — [EconPapers 초록](https://econpapers.repec.org/RePEc:eee:jbvent:v:29:y:2014:i:4:p:543-564) [미확인-초록]; 경쟁사를 공격적으로 깎아내리는 것은 오만하고 미숙하게 보인다는 해설. — [strategy+business, "Don't Brag"](https://www.strategy-business.com/blog/Dont-Brag-An-Entrepreneurs-Guide-to-Getting-Capital) [2차]
- DocSend(2023, 시드 단계 피치덱 열람 데이터): 투자자가 경쟁 섹션에 쓴 시간이 88%, 트랙션 섹션에 33% 늘었다. — [SiliconANGLE 2023-08-24](https://siliconangle.com/2023/08/24/investors-place-increased-emphasis-product-readiness-financials-pre-seed-funding/) [2차]
- DocSend × Tom Eisenmann(HBS) 2015 연구: 덱 평균 19.2장에 평균 3분 44초. 가장 오래 본 장은 재무(23.2초), 그다음 팀·경쟁. 공동창업자 Heddleston은 표본이 매우 작아 대표성이 없을 수 있다고 했다. — [TechCrunch 2015-06-08](https://techcrunch.com/2015/06/08/lessons-from-a-study-of-perfect-pitch-decks-vcs-spend-an-average-of-3-minutes-44-seconds-on-them) [2차]. 이것은 덱 **열람 시간**이지 투자 결정과의 인과가 아니다.
- Steve Blank 꽃잎 그림(새로 나뉘는 시장)과 X/Y 그래프(기존 시장)의 구분은 02 §4.4에 있다.

### Inferences
- [추론] 이 범주에서 현상 유지는 "아무것도 기록하지 않음", 종이 일기·메모 앱, 그리고 **범용 AI 챗봇에 직접 털어놓기**다. 마지막 것이 심사위원이 가장 먼저 떠올릴 대체재일 가능성이 높다.
- [추론] 위치 지도의 축은 기능이 아니라 SERVICE_WHY의 원칙에서 고르는 편이 방어가 된다. 예: "AI가 결론을 내리나 ↔ 사용자가 해석을 확정하나", "기록을 강제하나(스트릭) ↔ 돌아올 수 있게 하나". 단, 경쟁 앱이 실제로 어느 쪽인지는 팀의 벤치마크 자료로만 배치하고 추측으로 찍지 않는다.
- [추론] Parhankangas & Ehrlich에 따라 경쟁사의 약점을 길게 말하지 않는다. "하루콩은 기록 습관 형성에 강하다. 우리는 다른 질문을 푼다" 식으로 상대를 인정한 뒤 차이 하나를 말한다.

### Gaps
- 2×2, 기능 비교표, 꽃잎 중 무엇을 투자자가 더 믿는지에 대한 연구나 VC 원문: 찾지 못했다. 위 내용은 벤더 블로그의 경험칙이다.
- Peter Thiel(*Zero to One*)의 경쟁 관련 논지는 이번에 검색하지 않았다.

---

## 5. 매출 전 비즈니스 모델 — 가격 가설, 단위 경제, 비용 하한, 가정 표시

### Takeaway
매출이 없을 때 가장 큰 감점은 **문서 속 숫자와 입으로 하는 말이 어긋나는 것**이다. 실측이 없는 숫자는 "가정"이라고 적고, 벤치마크에는 출처를 달고, 계산식을 보이는 것이 신뢰를 지킨다. AI 기능이 있는 서비스는 추론(inference) 비용이 숨은 비용이 되기 쉽다는 a16z의 지적이 있어, "무료 기록 / 유료 AI" 구분 자체가 비용 구조에 대한 답이 된다.

### Cited Findings
- 한 헬스케어 스타트업이 IR 자료에 "올해 매출 추정 10억 원"이라고 적고 발표 중 "아직 유료 고객은 없다"고 말해 심사역의 신뢰를 잃었다는 사례. 같은 기사는 매출이 없거나 미미해도 미래 잠재 고객을 수치화해 답하면 된다고 한다. — [벤처스퀘어](https://www.venturesquare.net/723375) [2차]
- 02 §3의 eopla: 본문·일정·예산의 불일치가 주요 감점 요인. 02 §4.5: a16z는 지표의 용어를 정의하고 비율과 절대 수치를 함께 쓰라고 한다.
- Martin Casado & Matt Bornstein, "The New Business of AI (and How It's Different From Traditional Software)", a16z, 2020-02-16. 클라우드 인프라가 AI 회사의 "substantial – and sometimes hidden – cost"라고 하며, AI 회사의 매출총이익률이 전통 소프트웨어(60~80%+)보다 낮다는 논지다. AI 회사 50~60%라는 숫자는 2차 출처들이 이 글에 귀속시키지만 원문에서 확인하지 못했다. — [a16z](https://a16z.com/the-new-business-of-ai-and-how-its-different-from-traditional-software/) [미확인-요약]
- a16z는 이후 추론 비용이 계속 떨어지는 추세라고 쓰기도 했다("inference optimizations are still in early innings"). — [a16z, Questioning margins is a boring cliché](https://a16z.com/questioning-margins-is-a-boring-cliche) [미확인-요약]
- a16z의 "You Are Not a Model: Don't Price per Token"은 제목만 확인했다. AI 기능 가격을 토큰 단위로 매기지 말라는 취지로 보이나 내용은 확인하지 못했다. — [a16z](https://a16z.com/you-are-not-a-model-dont-price-per-token/) [미확인]
- 무료→유료 전환 벤치마크(RevenueCat 2026, 건강·피트니스 35일 전환 중앙값 2.9%)와 LTV/CAC 정의는 02 §4.5, 04 §3에 있다.

### Inferences
- [추론] 숫자 표시는 세 단계로 통일한다. **실측**(팀이 측정한 값, 측정 기간과 함께) / **벤치마크**(외부 값, 출처·대상·연도와 함께, "우리 값 아님" 명시) / **가정**(근거 한 줄, 보수적으로). 지금 이 팀의 수익 관련 칸은 실측이 비어 있으므로 "실측: 없음"이라고 적는 칸 자체가 신뢰 장치가 된다.
- [추론] AI 비용 하한은 숫자 대신 계산식으로 보인다: "AI 성찰 1회 비용 = (입력 토큰 + 출력 토큰) × 모델 단가", "유료 사용자 1명 월 비용 = 1회 비용 × 월 사용 횟수(가정)". 모델·단가는 구현 시점의 공식 가격표로 채운다고 말한다. 구현 전이므로 숫자를 지어내지 않는다.
- [추론] "기록은 늘 무료, AI 성찰은 유료"는 비용 구조와 맞물린다. 비용이 드는 기능(AI 추론)에만 과금하므로 무료 사용자가 늘어도 AI 비용이 같이 늘지 않는다는 논리다. 단, 무료 사용자의 저장·서버 비용은 남는다.
- [추론] Van Westendorp은 "가격을 정하는 방법"이지 수요 증거가 아니다. "몇 명에게, 언제, 무엇을 물어 가격대를 정하고, 그 가격에서 실제 결제 전환을 따로 본다"까지 말해야 계획으로 들린다. 설문의 말한 가격은 행동이 아니라는 점(02 §4.3, Mom Test)을 먼저 인정하는 편이 방어가 된다.

### Gaps
- 매출 전 재무 추정을 투자자가 어떻게 읽는지에 대한 VC 원문(예: "3~5년 추정표를 믿지 않는다"류): 이번 검색에서 확인하지 못했다.
- Van Westendorp 조사를 투자자·심사위원이 어떻게 평가하는지에 대한 자료: 찾지 못했다.
- 현재 LLM 추론 단가: 조사 범위 밖. 구현 시점의 공식 가격표로 확인해야 한다(AGENTS.md §3).

---

## 6. "모르겠다"·적대적 질문·약점 질문에 답하는 구조, 백업 슬라이드

### Takeaway
실무자 조언은 일관된다. **질문에 직접, 짧게 답하고, 모르면 모른다고 말한 뒤 어떻게 알아낼지를 붙이며, 꾸며 내지 않는다.** 예방(위험) 질문에는 위험을 인정한 뒤 얻으려는 것과 다음 행동으로 끝낸다(Kanze 연구 2). 질의응답에서 드러나는 겸손은 신뢰·팀 빌딩 인식을 높였다는 실험 결과가 있지만, "빠르고 위험한 결정을 못 할 것"이라는 의심도 함께 불렀다.

### Cited Findings
- YC 면접 경험자들: "I don't know"는 자유롭게 써도 되고, 여러 질문에 몰라도 괜찮다. 같은 질문을 계속 파고들면 오히려 파트너가 관심을 갖는다는 신호일 수 있다. — [Nick Raushenbush, YC Interview Guide](https://nickraushenbush.substack.com/p/y-combinator-interview-guide), [Nick Baum, Four pieces of advice](https://medium.com/@nickbaum/four-pieces-of-advice-ahead-of-your-ycombinator-interview-566cad8ae054) [2차]
- "모른다"고 말해도 되지만 **어떻게 알아낼지를 이어서 말하라**. 길고 약한 답은 "모른다" 또는 "이제 하려는 일이다"라는 짧은 인정보다 훨씬 나쁘다. 물은 질문에 직접, 짧게 답하라. 얼버무리기보다 "모른다"가 낫다. 막히면 아는 것으로 옮겨 가라. — [Gumloop, Everything to know for your YC interview](https://www.gumloop.com/blog/y-combinator-interview), [Basetemplates](https://www.basetemplates.com/blog/how-to-ace-your-y-combinator-interview), [Cognito](https://cognitohq.com/blog/y-combinator-interview-tips) [2차]. 2013~2015년 글이 섞여 있다.
- 02 §2의 brunch 심사위원 글도 "모르는 질문은 인정하고 보완책을 말하라"고 한다(자기 홍보 성격, 참고용).
- Kanze et al. (2018, AMJ) 연구 2: 예방 질문에 촉진 초점 답을 하면 투자 금액이 유의하게 늘었다(실험). — [Sciences Po](https://www.sciencespo.fr/women-in-business/en/research-and-publications/entrepreneurship/we-a%73k-men-to-win-and-women-to-lose-closing-the-gender-gap-in-startup-funding) [2차]
- Vilanova & Vitanova (2026), "The power of expressed humility: Early stage investors' reaction to humble entrepreneurs", *Strategic Entrepreneurship Journal* 20(2), 300–324, 오픈 액세스. 실제 피치 140건의 영상 분석(2020–2024, 네 시즌)과, 프랑스 전문 VC 66명을 대상으로 **모의 피치 질의응답 발췌**를 보여 준 무작위 피험자 내 실험. 표현된 겸손이 높으면 투자자의 대인 호감·신뢰 인식이 5점 척도에서 1.28점, 팀 빌딩 역량 인식이 1.71점 높았다. 동시에 빠르고 위험한 결정을 내릴 능력에 대한 의심도 높였다. — [Wiley 본문 주소](https://sms.onlinelibrary.wiley.com/doi/full/10.1002/sej.70016), [emlyon 저장소](https://research.em-lyon.com/esploro/outputs/journalArticle/The-power-of-expressed-humility-Early/9944536109453) [미확인-초록]
  - 검색 요약은 영상 분석에서 "겸손 1단위당 투자 제안 확률이 약 39포인트 높았다(열정·준비성·카리스마 통제 후)"고 전했지만 단위·모형을 확인하지 못했다. 관찰 자료라 인과가 아니다. — [SMS Strategic Management Explorer](https://www.strategicmanagement.net/publications-resources/strategic-management-explorer/arrogance-reconsidered-when-humility-helps-entrepreneurs-secure-funding/) [2차]
  - 겸손의 예로 "비즈니스 모델이 빨리 돈을 벌 것이라고 고집하는 대신 불확실성을 인정하는 것"이 쓰였다고 한다. — 같은 출처 [2차]
  - 2020년 AOM 학회 버전을 인용한 블로그의 "겸손한 창업자가 투자 제안을 받을 확률 1.7배"는 SEJ 논문에서 확인하지 못했다. — [Escalon 블로그](https://escalon.services/blog/startups/research-shows-early-stage-entrepreneurs-who-display-signs-of-humility-with-investors-are-twice-as-likely-to-receive-funding) [2차, 미검증]
- Chen, Yao, Kotha (2009), "Entrepreneur Passion and Preparedness in Business Plan Presentations: A Persuasion Analysis of Venture Capitalists' Funding Decisions", *Academy of Management Journal* 52(1), 199–214. 인용 문헌들은 VC 결정에 영향을 준 것이 **겉으로 드러난 열정이 아니라 준비성(preparedness)**이었다고 요약한다. 준비성은 발표 내용의 깊이·논리로 측정된 개념이다. — [서지·초록 색인](https://peeref.com/works/65267612) [미확인-초록]; Cardon, Mitteness & Sudek (2016, ETP)은 준비성을 열정의 하위 요소가 아닌 별개 개념으로 본다. — [Cardon et al. 2016 PDF](https://activityinsight.pace.edu/mcardon/intellcont/CardonMittenessSudek_ETP_accepted_2016-1.pdf) [미확인-요약]
- Clingingsmith & Shane (2018), "Training Aspiring Entrepreneurs to Pitch Experienced Investors: Evidence from a Field Experiment in the United States", *Management Science* 64(11), 5164–5179. 네 개의 엘리베이터 피치 대회에서 피치 훈련을 **무작위 배정**한 현장 실험. 투자자가 계속 볼지 결정하는 것을 실물옵션으로 보는 모형의 네 가설이 모두 지지됐다고 초록이 밝힌다. 효과 방향·크기는 확인하지 못했다. — [EconPapers](https://econpapers.repec.org/RePEc:inm:ormnsc:v:64:y:2018:i:11:p:5164-5179) [미확인-초록]

**백업(부록) 슬라이드**
- 국내 발표평가 준비 자료가 "심사위원 자주 하는 질문"을 따로 정리하고 부록 장표로 대비하라고 권한다는 검색 요약이 있었지만 어느 페이지인지 특정하지 못했다(Gaps). 한국 대학 대회는 발표 5~10분, 질의응답 3~10분이었다(02 §2).

### Inferences
- [추론] 답의 기본 틀(30초): **① 직답 한 문장 → ② 근거나 현재 상태(실측만) → ③ 다음 행동과 판정 기준(언제, 무엇을 보면 판단을 바꾸나)**.
- [추론] "모르겠다" 틀: "지금은 모릅니다(직답). 그걸 알려면 ○○가 필요한데 아직 측정하지 않았습니다(왜 모르나). ○월까지 ○○로 확인하겠습니다(어떻게)." 숫자를 즉석에서 만들지 않는다. 즉석 숫자는 덱과 어긋나는 순간 벤처스퀘어 사례처럼 신뢰를 잃는다.
- [추론] 예방 질문 틀(Kanze 응용): "맞습니다, 그 위험이 있습니다(인정) → 그래서 이렇게 설계했습니다/측정합니다(대응) → 이걸로 얻으려는 것은 ○○입니다(촉진 초점으로 끝냄)." 위험을 부정하거나 작게 말하는 답은 피한다.
- [추론] Vilanova의 "겸손 ↔ 결단력 의심" 상충을 고려하면, 약점을 인정한 뒤에는 **이미 내린 결정**(무엇을 하지 않기로 했는지: 광고·데이터 판매 없음, 진단하지 않음)과 **정해 둔 판정 기준**을 말해 결단력을 함께 보이는 편이 낫다.
- [추론] 적대적 질문("이거 그냥 일기장 아닌가요?")에는 반박보다 질문 속 사실을 먼저 인정한다. "기능만 보면 맞습니다. 차이는 ○○ 하나입니다."
- [추론] Zoom에서는 화면 공유 전환이 느리므로, 부록 슬라이드는 본 덱 뒤에 번호를 붙여 두고 "부록 A3을 보시면"처럼 바로 넘길 수 있게 한다. 두 사람이 질문 주제별로 답할 사람을 미리 나눈다(YC 경험자들의 공동창업자 역할 분담 조언 — [Barak Ben-Ezer](https://medium.com/@barakbenezer/y-combinator-passing-interview-getting-accepted-bd42661fc465) [2차]).

### Gaps
- Michael Seibel·Garry Tan의 면접 팁 원문(ycombinator.com 차단).
- Zoom 비대면 심사에서 질의응답 진행 방식에 대한 공식 자료: 찾지 못했다(02 §2와 같음).
- 부록 슬라이드 활용을 권하는 국내 강의 자료의 출처 페이지: 특정하지 못했다.
- Chen et al. (2009)과 Clingingsmith & Shane (2018)의 표본 수·효과 크기: 본문 미확인.

---

## 7. 위험·한계를 먼저 밝히면 신뢰에 도움이 되나 — 연구 근거

### Takeaway
"약점을 숨기지 말라"는 실무 합의(PG의 How to apply, 02 §4.1; innoforest, 02 §3)를 받치는 연구는 있지만 **조건부**다. ① 겸손과 불확실성 인정은 신뢰·팀 인식을 높였다(실험, 프랑스 VC 66명). ② 약점 인정은 **어느 정도까지만** 도움이 되고 지나치면 역량을 의심받는다(엔젤 대상 연구의 언론 요약). ③ 설득 연구 메타분석에서는 반대 논거를 **언급하고 반박하는** 양면 메시지가 일면 메시지보다 신뢰·설득력이 높았고, 언급만 하고 반박하지 않는 메시지는 그렇지 않았다. 결론: **위험을 밝히되 대응·판정 기준을 짝지어 짧게** 말한다.

### Cited Findings
- Vilanova & Vitanova (2026, SEJ): 표현된 겸손 → 신뢰·팀 빌딩 인식 상승, 결단력 의심도 상승(§6 참조). — [Wiley](https://sms.onlinelibrary.wiley.com/doi/full/10.1002/sej.70016) [미확인-초록]
- Parhankangas & Ehrlich (2014, JBV): 엔젤은 극단보다 **적당한** 인상 관리(긍정 언어·혁신성 강조·경쟁사 비판 모두 적당히)를 선호했다. — [EconPapers](https://econpapers.repec.org/RePEc:eee:jbvent:v:29:y:2014:i:4:p:543-564) [미확인-초록]. strategy+business 해설: 약점 인정은 어느 선까지 도움이 됐고, 약점에 너무 오래 머물면 투자자가 역량이나 자신감을 의심했다. 최적 전략을 쓴 창업자는 전체 사업계획 발표에 초대될 확률이 평균 20% 높았다는 수치도 전하지만 논문에서 확인하지 못했다. — [strategy+business](https://www.strategy-business.com/blog/Dont-Brag-An-Entrepreneurs-Guide-to-Getting-Capital) [2차]
- O'Keefe (1999) 메타분석: 광고가 아닌 주제에서 **반박형(refutational) 양면 메시지**는 일면 메시지보다 신뢰도와 설득력이 유의하게 높았다. 광고 주제에서는 차이가 없었다(관련 연구가 적다). 비반박형(언급만 함) 양면 메시지는 이점이 없었다. — [Typeset, How to handle opposing arguments in persuasive messages](https://typeset.io/papers/how-to-handle-opposing-arguments-in-persuasive-messages-a-2bcmhajwgo) [미확인-초록]. 피치가 아니라 일반 설득 연구다.
- Eisend (2006), "Two-sided advertising: A meta-analysis", *International Journal of Research in Marketing* 23(2), 187–198. 상업 맥락의 연구 대부분이 양면 메시지가 더 효과적이라고 보고했고, 반박형 메시지가 더 믿을 만하다고 인용된다. 광고 연구다. — [인용 문헌 요약](https://core.ac.uk/download/55732658.pdf) [미확인-초록]
- 같은 맥락의 반대 방향 결과: 창업자의 낙관·과신은 외부 투자 금액에 영향이 없었다는 인지 편향 연구(Small Business Economics). — [Springer](https://link.springer.com/doi/10.1007/s11187-016-9739-4) [미확인-요약, 저자·표본 미확인]
- 2018년 JBV 연구는 피드백에 대한 개방성이 투자자가 보는 열정의 효과를 높였다고 보도됐다. — [Forbes 2018-02-28](https://www.forbes.com/sites/dinahwisenberg/2018/02/28/got-humility-study-shows-entrepreneurs-who-show-passion-openness-to-feedback-appeal-to-investors/) [2차, 논문 서지 미확인]
- 반례(불일치의 비용): 덱의 매출 추정과 구두 발언의 불일치로 신뢰를 잃은 사례. — [벤처스퀘어](https://www.venturesquare.net/723375) [2차]

### Inferences
- [추론] 연구들을 합치면 "숨기기"도 "길게 고백하기"도 아닌 **"짧게 인정 + 반박 또는 대응 + 판정 기준"**이 가장 근거에 가깝다. O'Keefe의 반박형·비반박형 구분이 핵심이다. 위험만 나열한 슬라이드(비반박형)는 이점이 없을 수 있다.
- [추론] 위험 슬라이드를 본 덱에 한 장(위험 3개 × 대응 × 지표) 두고, 상세는 부록으로 보낸다. 본 덱에서 위험을 먼저 밝혀 두면 질의응답의 예방 질문이 "이미 말씀드린 대로"로 시작할 수 있다.
- [추론] 위 연구는 모두 투자자 대상이다. 대학 대회 심사위원(교수·지역 창업 지원기관·투자자 혼합으로 추정)에게 같은 효과가 있다는 직접 증거는 없다.

### Gaps
- 대학 창업경진대회 심사위원을 대상으로 한 위험 공개 효과 연구: 찾지 못했다.
- 크라우드펀딩(Kickstarter) 위험 공개 문구의 효과 연구: 이번에 검색하지 않았다.
- 2018 JBV "openness to feedback" 논문의 저자·표본: 확인하지 못했다.

---

## 8. HON에 적용한다면 [추론]

이 절 전체가 [추론]이다. 아래 답의 뼈대에 들어갈 **숫자는 팀이 실측했거나 출처가 있는 것만** 쓴다. 괄호 속 `○○`는 팀이 채울 빈칸이며, 채울 값이 없으면 "아직 없다"고 말한다. 모든 답은 [SERVICE_WHY](../../../../docs/SERVICE_WHY.md) §19의 범위(정신건강 효과를 약속하지 않음, 진단 아님, AI가 사용자를 정의하지 않음) 안에 둔다.

### Takeaway
예상 질문의 절반 이상이 예방(위험) 질문이다. 공통 답 구조는 "직답 → 실측 상태 → 다음 행동과 판정 기준", 위험 질문은 "인정 → 대응 → 얻으려는 것"이다. 덱·부록·구두 답의 숫자가 서로 같아야 한다.

### 예상 질문 15개와 답의 뼈대

| # | 예상 질문 (주제 / 초점) | 답의 뼈대 |
| --- | --- | --- |
| 1 | 지금 사용자가 몇 명인가요? 본인 말고 써 본 사람이 있나요? (트랙션 / 예방) | "운영 중이고 실사용자는 대표 1명입니다(직답). 대표가 ○개월 동안 직접 쓰며 고쳤습니다(실측이 있을 때만). 다음 ○주 안에 ○명에게 손으로 써 보게 하고 ○○(핵심 지표 하나)를 보겠습니다." |
| 2 | 고객 인터뷰나 수요 조사는 했나요? (증거 / 예방) | "아직 하지 않았습니다. 계획은 ○명, 지난 경험을 묻는 방식(Mom Test·YC 다섯 질문)이고, '이런 앱 쓰겠냐'는 묻지 않습니다. ○○가 나오면 가설을 유지하고 ○○면 바꿉니다." |
| 3 | 이 문제가 진짜 있는 문제라는 근거는? (문제 / 촉진) | 공식 통계는 배경으로만(청년 번아웃 32.2% 등, SERVICE_WHY §6) 들고, "통계가 우리 앱의 필요를 증명하지는 않는다, 그래서 인터뷰로 확인하려 한다"까지 말한다(SERVICE_WHY §19.6). |
| 4 | 하루콩 같은 기존 앱과 무엇이 다른가요? (경쟁 / 촉진) | 상대를 먼저 인정("기록 습관에 강하다") → 차이 하나("AI가 감정을 정해 주지 않고 후보와 질문을 내며, 확정은 사용자가 한다") → 그 차이를 확인할 방법. 경쟁사 수치는 04 §4의 출처 있는 값만. |
| 5 | 그냥 ChatGPT에 털어놓으면 되지 않나요? (현상 유지 대체재 / 예방) | "많은 사람이 그렇게 할 것이고 그게 가장 큰 경쟁자입니다(인정). 범용 대화는 기록이 쌓이지 않고 해석의 주도권이 AI 쪽에 있습니다. 우리는 기록 구조와 사용자의 해석 확정에 집중합니다." AI 기능이 미구현임을 이어서 밝힌다. |
| 6 | AI 기능은 지금 되나요? 안 된 걸 왜 핵심이라 하나요? (해법 / 예방) | "설계는 끝났고 구현은 아직입니다(직답). 기록 기능은 지금 운영 중입니다. AI는 ○월 마일스톤에 ○○부터 만들고, 사용자가 AI 제안을 고치거나 버리는 비율로 효용을 보겠습니다." |
| 7 | 정신건강 앱은 30일 유지율이 한 자릿수라던데요? (위험 / 예방) | "맞습니다, 이 범주의 가장 큰 위험입니다(인정, Baumel et al. 2019 — 의뢰 배경의 사실이며 이 조사에서 원문을 다시 열지 않았다). 우리는 기록을 의무로 만들지 않고(스트릭 압박 없음) 돌아올 수 있게 하는 쪽으로 설계했고, 그래서 지표도 '매일 쓰기'가 아니라 '○일 뒤 다시 돌아온 비율'로 봅니다. ○월까지 ○○에 못 미치면 ○○를 바꿉니다." 업계 평균을 넘겠다고 약속하지 않는다. |
| 8 | 어떻게 돈을 버나요? (비즈니스 모델 / 촉진) | "기록은 늘 무료, AI 성찰은 나중에 구독. 광고·데이터 판매는 하지 않습니다." 전환율은 "참고 벤치마크: 건강·피트니스 35일 전환 중앙값 2.9%(RevenueCat 2026, 전 세계 앱), 우리 값 아님"으로만. |
| 9 | 가격은 얼마인가요? (가격 / 예방) | "아직 정하지 않았습니다(직답). Van Westendorp 조사로 ○명에게 묻고 범위를 정한 뒤 실제 결제 전환을 따로 보겠습니다. 말한 가격과 내는 가격은 다르다는 걸 알고 있습니다." 참고로 하루콩 앱스토어 표기 범위(04 §4)는 들 수 있다. |
| 10 | AI 비용은요? 무료 사용자가 많으면 적자 아닌가요? (단위 경제 / 예방) | "AI는 유료 기능이라 비용이 드는 곳에만 과금합니다. 1회 비용 = 토큰 × 단가로 계산하고, 구현 시점 공식 가격으로 채우겠습니다. 지금 숫자를 드리면 지어낸 숫자가 됩니다." 무료 사용자의 저장 비용은 남는다고 인정한다. |
| 11 | 시장 규모는? (시장 / 촉진) | bottom-up 계산식(04 §7)을 칸마다 실측/벤치마크/가정 표시와 함께. 주연은 손으로 닿는 첫 고객군(SOM), 세계 시장 보고서 숫자는 배경 한 줄. "1% 점유" 식 표현은 쓰지 않는다. |
| 12 | 14세 청소년도 대상인데 개인정보·안전은? (위험 / 예방) | "가장 조심하는 부분입니다(인정). 일기 데이터는 판매·광고에 쓰지 않습니다. 위기 신호가 보이는 글에 대해서는 ○○ 절차를 둡니다(팀이 실제 설계한 내용만)." 법적 요건은 확인한 것만 말한다(Gaps). |
| 13 | 진단 앱 아닌가요? AI가 감정을 잘못 해석하면? (안전 / 예방) | "진단·치료 서비스가 아닙니다(SERVICE_WHY §13). AI는 감정을 확정하지 않고 후보와 질문만 내며, 사용자가 고치거나 버릴 수 있습니다. 근거 없는 해석은 보이지 않게 하는 검증 단계를 설계했습니다." |
| 14 | 왜 너희 두 사람인가요? 역할은? (팀 / 촉진) | 실행의 증거(제품을 직접 만들어 운영 중) + 창업자 본인이 이 문제를 가진 사용자(PG의 신호, 02 §4.6) + 두 사람의 역할 분담. "본인이 쓴다 = 시장 수요"로 잇지 않는다. |
| 15 | 상금·지원금을 받으면 어디에 쓰나요? (자금 사용 / 촉진) | 검증 우선 순서: ① 사용자 모집·인터뷰 ② AI 기능 구현과 비용 측정 ③ 가격 조사. 금액은 팀이 실제로 계산한 것만. |
| 16 | 이게 안 되면 언제 접거나 방향을 바꾸나요? (판단 / 예방) | 미리 정한 판정 기준을 "상태 + 날짜"로(Duke). "○월까지 ○명 중 ○○가 ○○ 미만이면 ○○를 바꿉니다." 이 질문이 안 나와도 검증 계획 슬라이드에 넣어 둔다. |
| 17 | 큰 회사나 하루콩이 AI를 붙이면요? (경쟁·방어 / 예방) | "충분히 그럴 수 있습니다(인정). 우리가 지키려는 차이는 기능이 아니라 원칙(AI가 정의하지 않음, 기록 강제 없음, 데이터 판매 없음)이고, 이것은 광고·참여도 지표에 기대는 모델과는 함께 가기 어렵습니다." 마지막 문장은 상대 모델을 확인한 경우에만 쓴다. |

### 답할 때 지킬 것
- 즉석에서 숫자를 만들지 않는다. 덱에 없는 숫자를 물으면 "그 숫자는 아직 없습니다, ○○로 측정하겠습니다."
- 정신건강 효과, 뇌 반응, "진짜 나를 찾는다"를 말하지 않는다(SERVICE_WHY §19.9~19.11). 표현적 글쓰기의 작은 평균 효과(g = −0.12, SERVICE_WHY §10)는 "우리 앱의 효과가 아니다"를 붙여서만.
- 위험을 인정한 뒤에는 이미 내린 결정과 판정 기준으로 끝낸다(겸손 ↔ 결단력 상충, §6).
- 두 사람이 주제별 답변 담당을 미리 나눈다(문제·사용자·안전 / 기술·AI·비용 등).
- 답은 30초 안팎. 질의응답 시간이 공지되지 않았으므로(다른 대학 3~10분, 02 §2) 길게 설명할 것은 부록 번호로 넘긴다.

### 백업 슬라이드 제안
| 번호 | 제목 | 내용 | 대응 질문 |
| --- | --- | --- | --- |
| A1 | 지금 된 것 / 안 된 것 | 실측(운영 중, 본인 사용) · 설계(AI) · 계획(인터뷰, 가격 조사)을 세 칸으로 | 1, 6 |
| A2 | 검증 계획 | 가설 → 실험 → 핵심 지표 하나 → 판정 기준(상태 + 날짜) → 일정 | 2, 16 |
| A3 | 시장 계산식 | bottom-up 각 칸에 실측/벤치마크/가정 표시, 큰 보고서 숫자는 배경 한 줄 | 11 |
| A4 | 경쟁·대체재 지도 | 직접 2~3, 간접 2~3, 현상 유지(기록 안 함, 메모 앱, 범용 AI 챗봇). 원칙 축 2×2 또는 꽃잎 + 차이 표 하나 | 4, 5, 17 |
| A5 | 수익 가정표 | 무료/유료 구분, 전환율 벤치마크(출처·대상 명시), 가격 결정 방법, AI 1회 비용 계산식(빈칸) | 8, 9, 10 |
| A6 | 유지율 위험과 대응 | Baumel 2019(원문 확인 후 정확한 값으로), 설계 원칙(기록 강제 없음), 보는 지표, 판정 기준 | 7 |
| A7 | 안전·개인정보 | 미성년 사용자, 위기 신호 대응, 데이터 판매·광고 없음, 저장 방식(팀이 실제 구현한 것만) | 12, 13 |
| A8 | AI 원칙과 로드맵 | "정의하지 않고 돕는다" 문장 예시(SERVICE_WHY §12 표), 검증 단계, 구현 마일스톤 | 6, 13 |
| A9 | 팀과 역할 | 두 사람의 역할, 질의응답 담당 주제 | 14 |
| A10 | 자금 사용 계획 | 검증 우선 순서와 각 단계의 산출물 | 15 |
| A11 | 근거 출처 | 본문 숫자의 출처·연도, "우리 값 아님" 표시 | 모든 숫자 질문 |

### Gaps
- 이 대회의 심사위원 구성과 질의응답 시간: 공지되지 않았다(02 §7, 창업교육센터 문의가 유일한 경로).
- 미성년(14~18세) 사용자의 개인정보 처리에 대한 법적 요건: 이 조사 범위 밖이다. 발표 전에 법령 원문으로 확인해야 하며, 확인 전에는 질문 12에 법 조항을 말하지 않는다.
- Baumel et al. 2019의 정확한 30일 유지율 값과 대상: 의뢰 배경으로 받은 사실이며 이 조사에서 원문을 다시 열지 않았다. 슬라이드에 쓰기 전에 원문으로 확인한다.
- 위 질문 목록은 실무자 조언과 국내 후기에서 추론한 것이고, 실제 이 대회에서 나온 질문 자료는 없다.
