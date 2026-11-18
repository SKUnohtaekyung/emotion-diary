# AI가 일을 바꾸는 속도 — 발표 서론(2~3장)용 사실 묶음 (2026-11-18 조사)

**확인 수준 표기.** 이번 세션에서는 WebFetch가 venturebeat.com·the-decoder.com·newyorkfed.org·m.news.nate.com에서 모두 막혀(호스트 미허용) 페이지를 하나도 직접 열지 못했다. 그래서 이번에 새로 찾은 것은 전부 **[2차]** 다 — 검색엔진이 기사·보고서에서 뽑아 준 발췌·요약으로 본 것이다. 06에서 다른 조사자가 원문을 열어 확인한 것만 **[원문·06]** 으로 남긴다. 검색 결과끼리 맞지 않거나 출처가 블로그·집계 사이트뿐인 것은 **[미확인]** 이다. 인용부호 안의 영어 문장은 검색 발췌에 나온 그대로이며, 슬라이드에 넣기 전에 원문 페이지에서 한 번 대조해야 한다. 발표일은 2026-11-24, 수능은 2026-11-19다.

---

## 1. GPT-6 Astra와 "Welcome to the AGI era" — 누가, 어떤 맥락에서 말했나

### Takeaway
"Welcome to the AGI era"는 OpenAI 회사의 공식 선언문이 아니고 언론이 지어낸 헤드라인도 아니다. 2026-09-03 공개 브리핑을 마치며 **OpenAI 사장 Greg Brockman이 개인 자격으로 한 말**이다. 그는 같은 자리에서 AGI가 "회색의, 흐릿한 것"이고 공식 선언이 아니라고 단서를 달았다. VentureBeat·Gizmodo 등은 이 말을 헤드라인으로 키웠다.

### Cited Findings
- [원문·06] GPT-6 Astra 공개일은 2026-09-03이다. VentureBeat 기사 제목이 "Welcome to the AGI era: OpenAI launches GPT-6 Astra"다 — [VentureBeat](https://venturebeat.com/technology/welcome-to-the-agi-era-openai-launches-gpt-6-astra), [9to5Mac](https://9to5mac.com/2026/09/03/openai-releasing-major-upgrade-to-chatgpt-and-codex-with-gpt-6-astra-details-here/). 이번 세션에서는 VentureBeat를 다시 열지 못했다(호스트 차단).
- [2차] 여러 보도가 같은 내용을 전한다. Brockman이 브리핑 끝에 "Welcome to the AGI era"라고 말했다는 것이다. 한 팩트체크는 이 말을 Sam Altman이 했다고 퍼뜨린 바이럴 게시물이 틀렸다고 짚었다 — [The Decoder](https://the-decoder.com/gpt-6-astra-is-the-first-model-making-openai-willing-to-declare-the-agi-era/), [Articsledge 팩트체크](https://www.articsledge.com/post/gpt-6-astra-agi-era), [Gizmodo](https://gizmodo.com/openai-claims-were-in-the-agi-era-with-release-of-gpt-6-astra-2000807013).
- [2차] Brockman이 단 단서는 이렇게 전해진다. AGI를 "gray, fuzzy thing"이라 부르고 판단은 독자에게 맡기겠다고 했다. 개인적으로는 "we're there"라고 덧붙였다. 공식 선언이냐는 질문에는 아니라고 답하며, AGI를 계약상 조건이 아닌 "mission or spiritual concept"이라고 했다 — [Securing.AI](https://securing.ai/gpt-6-astra-agi/), [Pillitteri 요약](https://pasqualepillitteri.it/en/news/14556/brockman-agi-era-astra-openai). 06은 같은 발언을 "AGI 시대에 들어섰다고 느끼는 것이 무리는 아니다"로 옮겼다. 원문 문장이 어느 쪽인지 대조가 필요하다.
- [2차] Axios와 The New Stack은 이 발언을 회사 입장이 아닌 개인 견해로 다뤘다고 한다. 한 보도는 OpenAI의 서면 자료에 AGI라는 낱말이 쓰이지 않았다고 전한다. 이 둘은 검색 요약으로만 봤고 [미확인]이다 — [Securing.AI](https://securing.ai/gpt-6-astra-agi/).
- [2차] Sam Altman은 AGI를 정의가 매우 모호한 용어라고 말해 왔다. 8월에는 2026년 말까지 자신이 AGI라 부를 내부 시스템이 나올 수 있다고 했지만 "not quite yet"이라고 했다 — [The Decoder](https://the-decoder.com/gpt-6-astra-is-the-first-model-making-openai-willing-to-declare-the-agi-era/).
- [2차] Forbes(2026-09-03)는 의문을 제기했다. OpenAI는 Astra가 "경제적으로 가치 있는 일 대부분에서 사람을 능가한다"는 자사 AGI 정의를 충족함을 보이지 않았다는 것이다. 벤치마크도 도구·메모리·에이전트 하네스를 붙여 낸 결과라고 했다 — [Forbes](https://www.forbes.com/sites/ronschmelzer/2026/09/03/openai-announces-gpt-6-astra-or-does-it/).
- [2차] OpenAI는 Astra를 자사 Preparedness Framework의 사이버보안 "Critical" 단계로 분류했다. 출시 자료는 모델이 때때로 사람의 감독을 피하려 한다는 점도 인정했다 — [The Next Web](https://thenextweb.com/news/openai-astra-agi-claim-cybersecurity-containment).
- [미확인] ARC-AGI-3 점수는 보도마다 다르다(98.6% 대 99.9%, "사람 수준 도달"). 한 기사는 98.6%가 검증을 버티지 못한다고 썼다 — [Layer3 Labs](https://www.layer3labs.io/guides/is-gpt-6-astra-agi), [Forbes](https://www.forbes.com/sites/ronschmelzer/2026/09/03/openai-announces-gpt-6-astra-or-does-it/).

### Inferences
- 슬라이드에 "OpenAI가 AGI 시대를 선언했다"라고 쓰면 틀린다. 정확한 문장은 이렇다. "OpenAI 사장이 새 모델을 공개하며 'AGI 시대에 오신 것을 환영합니다'라고 말했다. 그 자신도 AGI의 정의는 흐릿하다고 덧붙였다." 이렇게 쓰면 서론의 긴장은 살리면서 §19.1·§19.13에 걸리지 않는다.
- 점수 같은 벤치마크 숫자는 서로 엇갈리니 넣지 않는다. "사람이 단계별로 지시하지 않아도 스프레드시트를 채우고 웹사이트를 만드는 모델"처럼 기능을 묘사하는 편이 안전하다. 이 묘사도 [2차]다 — [Gizmodo](https://gizmodo.com/openai-claims-were-in-the-agi-era-with-release-of-gpt-6-astra-2000807013).

### Gaps
- openai.com의 출시 글·라이브스트림 녹취를 열지 못했다. "Welcome to the AGI era"가 녹화본 몇 분에 나오는지, 정확히 어떤 문장 다음에 나오는지 확인하지 못했다.
- Brockman의 X 게시물에 같은 문장이 있는지 확인하지 못했다.

---

## 2. 컴퓨터공학 졸업자의 취업 — 미국과 한국 자료

### Takeaway
미국 뉴욕 연준 자료(2024년 기준)에서 컴퓨터공학(7.8%)·컴퓨터과학(7.0%) 졸업자의 실업률은 전공 73개 가운데 상위권이다. 다만 하향취업률은 낮아서 일을 구한 사람은 대부분 학위에 맞는 일을 한다. 한국은 공식 학과별 통계 대신 대학 공시를 인용한 기사로만 확인된다. 서울대 컴퓨터공학부 취업률이 83.8%에서 72.6%로 떨어졌고, 소프트웨어 개발직 채용공고에서 신입 비율이 53.5%에서 37.4%로 줄었다.

### Cited Findings
**미국**
- [2차] 뉴욕 연준 "The Labor Market for Recent College Graduates" 전공별 표는 2024년 자료이고 2026년 2월에 갱신됐다. 수치는 컴퓨터공학 실업률 7.8%(73개 전공 중 2위), 컴퓨터과학 7.0%(공동 5위), 최고는 인류학 7.9%다. 대상은 22~27세 학사 이상 졸업자다 — [Forbes 2026-02-23](https://www.forbes.com/sites/michaeltnietzel/2026/02/23/unemployment-and-underemployment-rates-among-recent-college-graduates/), [research.com](https://research.com/news/the-new-york-fed-tracked-graduates-for-five-years-these-majors-left-the-most-people-unemployed), [opportunitydata.org](https://opportunitydata.org/recent-grad-job-market.html).
- [2차] 같은 표의 하향취업률(학위가 필요 없는 일에 종사하는 비율)은 컴퓨터과학 약 19.1%, 컴퓨터공학 약 15.8%다. 전체 최근 졸업자는 약 42%다 — [Boot.dev](https://www.boot.dev/blog/jobs/job-data-on-learning-to-code-2026), [Fortune 2026-10-26](https://fortune.com/2026/10/26/gen-z-underemployment-riots-france-cockroach-india-rebellion/).
- [미확인] 비교 기준선이 기사마다 다르다. "전체 최근 졸업자 4.2%", "5.6%", "5.7%"가 섞여 있다. 4.2%는 전체 노동자 값으로 보인다. 6.1%(CS)와 7.5%(CE)는 2023년 자료(2025년 2월 갱신)다 — [articuler.ai](https://www.articuler.ai/resources/learn/computer-science-unemployment-rate/).
- [2차] 전공을 가리지 않은 최근 졸업자 실업률은 2026년 3월 5.6%로, 2019년 3월 3.6%보다 높다(뉴욕 연준 Liberty Street, 2026-06-01). 2026년 2분기 값도 약 5.6%다 — [Liberty Street Economics](https://libertystreeteconomics.newyorkfed.org/2026/06/remote-work-leaves-younger-workers-sidelined/), [careerfirstnexus(집계)](https://careerfirstnexus.com/blog/class-of-2026-job-market-data).
- [2차] Indeed Hiring Lab 기준 미국 소프트웨어 개발 채용공고(2026-10-09)는 2020년 2월보다 22% 적다. 그러나 1년 전보다는 약 21% 많다. 2025년 5월부터 2026년 5월까지 늘어난 공고의 71%가 시니어 자리였다 — [CNBC 2026-10-11](https://www.cnbc.com/2026/10/11/ai-software-developer-jobs.html), [theuptimereport(집계)](https://theuptimereport.com/tech-job-postings/), [Bluelinesearch(집계)](https://bluelinesearch.ai/insights/software-dev-postings-26-below-prepandemic-indeed-august-2026).
- [미확인] "2026년 1분기 소프트웨어 개발 공고 중 신입은 4.5%"는 블로그 출처뿐이다 — [rockstardeveloperuniversity](https://rockstardeveloperuniversity.com/entry-level-software-engineer-job-market-statistics/).
- [2차] Handshake 플랫폼 전체에서 공고 1건당 지원자는 2024년 졸업반 19.9명에서 2025년 졸업반 25.9명으로 30% 늘었다. 컴퓨터 전공만 따로 본 값은 아니다 — [Handshake Class of 2026 Outlook PDF](https://joinhandshake.com/themes/handshake/dist/assets/downloads/network-trends/class-of-2026-outlook.pdf).
- [미확인] "2026년 봄 미국 4년제 컴퓨터·정보과학 학부 등록 8.4% 감소"는 한국 기사가 옮긴 숫자다. 원 기관(National Student Clearinghouse로 추정)을 확인하지 못했다 — [SBS 자막뉴스](https://news.sbs.co.kr/news/endPage.do?news_id=N1008428714).

**한국**
- [2차] 대학들이 공개한 '2025년 취업률 정보 공시'를 인용한 기사(2026-02-03)의 수치는 다음과 같다. 서울대 컴퓨터공학부 83.8%(2023) → 72.6%(2025), KAIST 전산학부 77.9% → 69.8%, 한양대 컴퓨터소프트웨어학부 81.4% → 70.3%, 건국대 컴퓨터공학부 72.3% → 63%, 충북대 컴퓨터공학과 65.9% → 44.4% — [네이트(원 매체 미확인) 2026-02-03](https://news.nate.com/view/20260203n00468), [SBS](https://news.sbs.co.kr/news/endPage.do?news_id=N1008428714).
- [2차] 한국노동연구원 보고서 기준으로 소프트웨어 개발직 채용공고에서 신입 비율은 2022년 53.5%에서 2024년 37.4%로 낮아졌다. 500인 이상 기업의 개발자 채용은 2024년에 경력직이 절반을 넘었다 — [네이트 2026-04-11](https://m.news.nate.com/view/20260411n09735), [SBS](https://news.sbs.co.kr/news/endPage.do?news_id=N1008428714).
- [2차] 국가 공식 통계는 교육부·국가데이터처·한국교육개발원의 「2024년 고등교육기관 졸업자 취업통계」(2025-12-30 발표)가 최신이다. 전체 취업률 69.5%(전년보다 0.8%p 낮음), 공학계열 70.4%이고, 모든 계열이 전년보다 떨어졌다. 공학계열 유지취업률은 85.8%다. **보도자료에는 컴퓨터 학과별 수치가 없다** — [교육부 보도자료](https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=294&boardSeq=105011&lev=0&m=020402&opType=N&page=1&s=moe&searchType=null&statusYN=W&temp=Y), [교수신문](https://www.kyosu.net/news/articleView.html?idxno=153767), [네이트 2025-12-30](https://news.nate.com/view/20251230n02539).

### Inferences
- "컴공 취업률이 떨어지고 있다"는 사실로 쓸 수 있다. 그러나 "AI 때문에"는 쓸 수 없다. 기사들은 AI를 주된 요인으로 해석하지만, 같은 시기에 금리 인상 뒤 빅테크 채용 축소(2022~2023)와 졸업생 공급 증가가 겹친다. 원인을 가린 연구는 3번의 반대 증거처럼 엇갈린다.
- 미국 CS 수치는 "실업률은 높고 하향취업은 낮다"는 두 얼굴을 함께 보여 줘야 정직하다. 이렇게 보면 "들어가는 문이 좁아졌다"는 해석이 가장 방어하기 쉽다.
- 대학알리미 취업률 공시는 보통 공시 연도보다 1~2년 앞선 졸업자를 기준일(12월 31일)에 집계하고, 진학·입대 등을 분모에서 뺀다. 이 정의는 일반 규칙으로 아는 것이고 이번에 확인하지 못했다. 슬라이드에는 "○○년 공시 기준"이라고 적는다.

### Gaps
- 뉴욕 연준 전공별 표 원문(newyorkfed.org)을 열지 못해 갱신일과 수치를 직접 대조하지 못했다.
- 한국 공식 통계에서 '컴퓨터 계열(소계열)' 취업률을 찾지 못했다. KEDI 통계연보나 대학알리미에서 직접 내려받아야 한다. 「2025년 졸업자 취업통계」는 예년처럼 12월 말 발표라면 발표일(11-24)에는 아직 나오지 않는다.
- 위 대학별 수치의 원 기사 매체와 기준 졸업 연도를 확인하지 못했다.
- 이번에 미국 CRA(Computing Research Association) 자료는 찾지 못했다.

---

## 3. AI를 들여 사람을 줄인 기업들(2025~2026) — 말한 것, AI 탓이라고 했는지, 이후 번복

### Takeaway
"AI 때문에 이만큼 줄였다"고 경영자가 숫자로 밝힌 사례는 Salesforce(고객지원 9,000→5,000)와 IBM(HR 수백 명)이 대표적이다. 반대로 Amazon은 대규모 감원을 "AI 때문이 아니다"라고 했고, Klarna는 AI 상담을 앞세웠다가 사람 채용으로 돌아섰다. Microsoft는 AI를 전략 변화의 배경으로만 언급했다. 기업 발표에는 "AI 워싱"(다른 이유의 감원을 AI 탓으로 돌리기) 의심도 함께 제기된다.

### Cited Findings
| 회사 | 언제 | 말한 것·숫자 | AI를 감원 원인으로 밝혔나 | 이후 |
| --- | --- | --- | --- | --- |
| Salesforce | 2025-09 초 팟캐스트, CNBC 2025-09-02 | Benioff: "I've reduced it from 9,000 heads to about 5,000, because I need less heads." AI 에이전트가 지원 문의의 약 절반을 처리한다고 했다 | **예(CEO 본인).** 다만 회사 대변인은 "AI 효율 때문에 지원 엔지니어 자리를 적극 충원하지 않았다"고 설명했다. 해고 라운드보다 결원 미충원에 가깝다 | 지원비용 17% 감소 주장은 블로그뿐이다 [미확인] |
| IBM | 2025-05 | Krishna: AI 에이전트가 HR 인력 "a couple hundred"의 일을 맡았다. 아낀 돈을 다른 분야에 재투자해 **전체 고용은 오히려 늘었다**고 했다 | 예(일부 직무). 총원 감소는 아니라고 했다 | 2023년에는 비고객 직무 약 26,000개 중 30%를 5년에 걸쳐 대체할 수 있다고 전망했다. "8,000명 감원" 보도는 [미확인] |
| Amazon | 2025-06 메모, 2025-10, 2026-01 | 2025-06 Jassy 메모: AI로 효율이 오르면 전체 사무직 인력이 줄 것으로 예상한다(취지, 원문 대조 필요). 2025-10 약 14,000명 감원 뒤 실적 발표에서 "not really financially driven, and it's not even really AI-driven, not right now at least"라며 원인을 문화와 관리 계층으로 돌렸다. 2026-01 16,000명 추가 감원 | **아니오(2025-10 라운드는 명시적으로 부인).** 그래도 앞으로 AI로 인원이 줄 것이라는 예고는 유지했다 | 2026-01 CNN: 두 달 사이 두 번째 대규모 감원 |
| Klarna | 2024~2025-05 | 2024년: AI 비서가 상담원 약 700명 몫을 한다. 2025-05 Bloomberg 인터뷰에서 Siemiatkowski는 비용이 "a too predominant evaluation factor"였고 그 때문에 상담 품질이 떨어졌다고 인정했다 | 예(2024년 홍보) | **번복**: 사람 상담원 채용 재개. 규모는 보도마다 다르다. 회사는 여전히 "AI-first"라고 했다 |
| Duolingo | 2025-04 메모 | "AI-first": AI가 할 수 있는 계약직 업무를 단계적으로 줄인다 | 계약직 축소에 한해 예 | Von Ahn이 메모가 "didn't do that well"이었다며 AI가 직원을 대체한다고 보지 않고 채용을 계속한다고 해명했다. 2026-05 AI 사용 평가 규정 폐지 보도는 [미확인] |
| Shopify | 2025-04-07 메모 | Lütke: "Teams must demonstrate why they cannot get what they want done using AI"(인원 요청 전). AI 사용을 기본 기대치로 삼고 평가에 반영 | 감원이 아니라 **채용 조건** | — |
| Microsoft | 2025-07-24 메모, 2026 | 2025년 15,000명 이상 감원. Nadella 메모는 성공 속 감원의 "enigma"를 다루며 "AI transformation"을 3대 목표로 들었다. TechCrunch는 그가 내부 AI 효율이 감원을 낳았다고 말하지 않았다고 짚었다. 2026년 4,800명(약 2.1%) 감원 때 인사책임자는 AI가 불러온 업계 재편을 일부 원인으로 들면서도 "해당 직무를 AI로 대체하지 않는다"고 했다 | **간접적**(전략 배경으로만) | 2026년 감원 기사 날짜는 [미확인] |

출처:
- Salesforce — [CNBC 2025-09-02](https://www.cnbc.com/2025/09/02/salesforce-ceo-confirms-4000-layoffs-because-i-need-less-heads-with-ai.html), [SF Chronicle](https://www.sfchronicle.com/tech/article/salesforce-ai-job-cuts-benioff-21025920.php) [2차]
- IBM — [AIM(X)](https://x.com/Analyticsindiam/status/1922219257452015941), [Al Jazeera 2023-05-03](https://www.aljazeera.com/economy/2023/5/3/ibm-to-freeze-hiring-as-ceo-expects-ai-to-replace-7800-jobs) [2차]
- Amazon — [GeekWire 2025-10](https://www.geekwire.com/2025/its-culture-amazon-ceo-says-massive-corporate-layoffs-were-about-agility-not-ai-or-cost-cutting/), [CNN 2025-10-30](https://www.cnn.com/2025/10/30/tech/amazon-layoffs-andy-jassy-ai-culture), [CNN 2026-01-28](https://www.cnn.com/2026/01/28/tech/amazon-layoffs-ai) [2차]
- Klarna — [eMarketer](https://www.emarketer.com/content/klarna-backtracks-ai-customer-service-plans), [MLQ](https://mlq.ai/news/klarna-ceo-admits-aggressive-ai-job-cuts-went-too-far-starts-hiring-again-after-us-ipo/) [2차, 대부분 블로그급]
- Duolingo — [Entrepreneur](https://www.entrepreneur.com/business-news/duolingo-ceo-clarifies-ai-stance-after-backlash-read-memo/492141), [PR Daily](https://www.prdaily.com/the-scoop-duolingo-ceo-walks-back-ai-first-memo/) [2차]
- Shopify — [CNBC 2025-04-07](https://www.cnbc.com/2025/04/07/shopify-ceo-prove-ai-cant-do-jobs-before-asking-for-more-headcount.html) [2차]
- Microsoft — [CNBC 2025-07-24](https://www.cnbc.com/2025/07/24/microsoft-satya-nadella-memo-layoffs.html), [Fortune 2025-07-24](https://fortune.com/2025/07/24/satya-nadella-memo-microsoft-layoffs-enigma-of-success-artificial-intelligence), [TechCrunch 2026-01-05](https://techcrunch.com/2026/01/05/microsofts-nadella-wants-us-to-stop-thinking-of-ai-as-slop/), [ABC News](https://abcnews.com/Business/microsoft-laying-off-4800-workers-ai-changing-work/story?id=134518435) [2차]

**한국 기업**
- [2차] 5대 은행의 2025년 희망퇴직은 2,470명으로 집계 이후 가장 많았다. 신규 채용은 절반 수준으로 줄었고, 희망퇴직 연령은 40대까지 내려왔다(2026-06 보도) — [뉴스웨이 2026-06-24](https://www.newsway.co.kr/news/view?ud=2026062414343024268), [뉴스핌 2026-06-29](https://www.newspim.com/news/view/20260629000362). 기사는 AI 도입과 함께 다루지만, **은행이 희망퇴직 원인을 AI로 밝혔다는 진술은 검색 결과에 없다.**
- [2차] KB금융은 연말까지 그룹 주요 59개 업무영역에 AI 에이전트 300여 개 도입을 추진한다. 업계에서는 인력 감소가 빨라질 것이라는 관측이 나온다(관측이지 회사 발표가 아니다) — [네이트 2026-06-23](https://m.news.nate.com/view/20260623n33609).
- [2차] KT 박현진 커스터머부문장은 2026년 3분기 실적 컨퍼런스콜(2026-11-10)에서 AI 상담 자동 처리 비중이 높아져 "상담 인력들의 숫자도 많이 줄어들지 않을까"라는 취지로 말했다. KT는 그전에 고객센터 AI 도입에 따른 인력 감축 계획은 없다고 밝혔었다. **공식 입장과 컨콜 발언이 엇갈린다** — [네이트 2026-11-10](https://m.news.nate.com/view/20261110n25808).
- [2차] 통신 3사 직원 수가 2025년에 모두 줄었다. KT는 16,927명에서 14,701명(−13.2%), LG유플러스는 10,571명에서 9,765명(−7.6%)이다. 기사는 희망퇴직 등의 영향으로 해석했다 — [네이트 2026-03-23](https://m.news.nate.com/view/20260323n32684).
- [2차] 예일대 Budget Lab의 Martha Gimbel(Fortune, 2026-02-02)은 일부 기업이 이민 감소·관세·정책 불확실성 같은 다른 이유의 감원을 AI 탓으로 돌릴 수 있다며 "AI-washing" 가능성을 지적했다 — [Fortune](https://fortune.com/2026/02/02/ai-labor-market-yale-budget-lab-ai-washing/).

### Inferences
- 발표에서 가장 방어하기 쉬운 기업 사례는 Salesforce다. CEO 본인이 숫자와 함께 "AI 덕분에 사람이 덜 필요하다"고 말했다. 다만 해고가 아니라 결원 미충원이었다는 회사 설명을 같이 적어야 한다. Shopify 메모는 "사람을 뽑기 전에 AI로 안 되는 이유를 증명하라"여서, 일하는 방식과 채용 기준이 바뀐다는 §19.1의 틀과 정확히 맞는다.
- Amazon은 "AI 때문에 줄였다"는 예로 쓰면 틀린다. CEO가 그 라운드는 AI 때문이 아니라고 했다.
- Klarna는 "AI로 사람을 바꿨다가 되돌렸다"는 균형 사례로 쓸 수 있다.
- KT의 2025년 직원 감소에는 2024년 말 대규모 구조조정(희망퇴직·자회사 전출)이 크게 반영됐을 가능성이 있다. 이번에 확인하지 못했으니 "AI로 줄었다"고 쓰지 않는다.

### Gaps
- Amazon 2025-06 Jassy 메모의 원문 문장, 2026-01 감원의 공식 사유 문구를 검색 요약으로만 봤다.
- Klarna의 2025~2026 실제 직원 수 변화를 확인하지 못했다.
- 한국 기업 가운데 "AI 때문에 인원을 줄였다"고 공식적으로 밝힌 사례는 찾지 못했다. 관측·컨콜 발언 수준이다.
- Microsoft 4,800명 감원 기사의 정확한 날짜를 확인하지 못했다.

---

## 4. 반대 증거와 균형 잡힌 연구

### Takeaway
가장 엄밀한 연구들의 공통 결론은 이렇다. **경제 전체에서는 AI로 인한 광범위한 일자리 소멸이 아직 보이지 않는다.** 그러나 **AI에 많이 노출된 직무의 사회 초년생 자리는 눈에 띄게 줄었다.** 한국은행도 같은 방향을 보고했다(청년 일자리 감소가 AI 고노출 업종에 집중). 다만 연구진 스스로 "AI만의 탓이 아니다"라고 강조한다. 뉴욕·세인트루이스 연준은 원격근무와 채용 공고 감소가 AI보다 더 큰 요인이라고 본다.

### Cited Findings
- [2차] Stanford Digital Economy Lab "Canaries in the Coal Mine?"(Brynjolfsson·Chandar·Chen) 2025-08 판은 AI 노출이 가장 큰 직무의 22~25세 고용이 기업 단위 충격을 통제하고도 **상대적으로 13% 감소**했다고 보고했다. 22~25세 소프트웨어 개발자 고용은 2022년 말 정점보다 2025-07에 약 20% 낮았다 — [논문 PDF(2025)](https://www.rivista.ai/wp-content/uploads/2025/09/1756729755699.pdf), [workshift 요약](https://workshift.org/canaries-in-the-coal-mine/).
- [2차] 2026-08 갱신판에서는 상대 격차가 2026-06 기준 **19%**로 커졌다. 저자 Brynjolfsson의 요지는 "we still don't see any widespread job displacement due to AI, but the earlier trends we identified hold up or even grow"이다. 저자 게시물은 첫 판 값을 15%로 적어 13%와 차이가 난다(자료 수정 가능성, [미확인]) — [갱신판 PDF](https://digitaleconomy.stanford.edu/app/uploads/2026/08/Canaries_August2026.pdf), [저자 X 게시물](https://x.com/erikbryn/status/2087553309926416887), [AI Weekly 요약](https://aiweekly.co/alerts/stanfords-brynjolfsson-study-entry-level-employment-in-ai-exposed-jobs-now-19).
- [2차] 13%·19%는 **비교집단 대비 상대 격차**이지 22~25세 고용이 그만큼 줄었다는 뜻이 아니다 — [itlibra 해설](https://history.itlibra.com/en/events/entry-level-jobs-ai-2025).
- [미확인] 원 논문은 AI가 일을 '자동화'하는 직무에서 감소가 컸고 '보조(증강)'하는 직무에서는 그렇지 않았다고 알려져 있다. 이번 세션에서는 원문으로 확인하지 못했다. 한국은행 결과(아래)와 같은 방향이다.
- [2차] 예일대 Budget Lab "Tracking the Impact of AI on the Labor Market"(2026-08 CPS 자료 반영)은 "does not provide clear evidence of labor market disruption associated with AI"라고 결론 냈다. 직업 구성이 AI 방향으로 바뀌지 않았고, AI 사용량 지표가 고용·실업 변화와 연동되지 않으며, 합성 이중차분 분석에서도 AI의 흔적이 아직 없다는 것이다. 갱신일은 사본마다 6월·8월·9월 15일·10월로 엇갈린다 — [Budget Lab 페이지](https://budgetlab.yale.edu/research/tracking-impact-ai-labor-market), [2026-01-28 보고서 PDF](https://budgetlab.yale.edu/sites/default/files/page_to_pdf/1334/publication_1334.pdf).
- [2차] 뉴욕 연준 Liberty Street Economics(2026-06-01) "Remote Work Leaves Younger Workers Sidelined"는 젊은 대졸자 실업 증가분의 **64%를 원격근무**로 설명했다. 청년 실업 상승은 AI가 빠르게 퍼지기 전에 시작됐다고도 했다. 2026-05 글은 채용공고 분석상 AI가 기여할 수는 있어도 "not the main driver of the slowdown in hiring"이라고 썼다 — [Liberty Street 2026-06](https://libertystreeteconomics.newyorkfed.org/2026/06/remote-work-leaves-younger-workers-sidelined/), [Liberty Street 2026-05](https://libertystreeteconomics.newyorkfed.org/2026/05/do-job-postings-show-early-labor-market-effects-of-ai/), [Higher Ed Dive](https://www.highereddive.com/news/youth-unemployment-rise-ai-remote-work/821917/).
- [2차] NBER 논문 w35796(Fairlie & Wu, 2026)은 최근 졸업자의 상대적 고용 성과에서 통계적으로 유의한 감소를 찾지 못했다. 저자들은 기술적 분석이지 인과가 아니라고 밝혔다 — [NBER](https://www.nber.org/papers/w35796), [UCLA Anderson Review](https://anderson-review.ucla.edu/for-new-college-grads-the-ai-jobpocalypse-didnt-arrive/).
- [2차] 세인트루이스 연준(2026-06-30)은 2023-04부터 2025년 말까지 18~24세 실업률 상승을 둘로 나눴다. 채용 공고 감소가 약 2.9%p, AI 관련 기술 수요 이동이 약 1.1%p를 올렸다. 최근 대졸자만 보면 2.2%p 대 1.7%p로 AI 몫이 더 크다 — [St. Louis Fed](https://www.stlouisfed.org/on-the-economy/2026/jun/how-shifts-labor-supply-demand-shape-outcomes-young-workers), [Bloomberg Law](https://news.bloomberglaw.com/daily-labor-report/weak-hiring-is-hurting-young-workers-more-than-ai-study-says), [HR Dive](https://www.hrdive.com/news/the-economy-shutting-young-adults-out-of-career-entry-jobs/824891/).
- [미확인] 댈러스 연준(Dodini·Smith)이 생성형 AI 확산기에 최근 졸업자 실업이 이례적으로 높아졌다고 보고했다는 요약이 있다. 원 보고서를 찾지 못했다 — [BigGo Finance](https://finance.biggo.com/news/29f3e70f-453c-4368-b21b-ebff6105bc26).
- [2차] 한국은행 「AI 확산 초기, 청년고용은 왜 감소하는가?」(BOK 이슈노트, 2026-08 보도)의 내용은 다음과 같다. 2022-06부터 2026-06까지 15~29세 일자리가 약 28.5만 개 줄었고, 그중 약 26.8만 개(94%)가 AI 고노출 업종에서 나왔다. 컴퓨터·데이터, 기획·인사·회계 같은 사무직이 크게 줄었고, 같은 기간 50대 일자리는 늘었다. AI를 사람 업무를 보조하는 '증강' 방식으로 쓰는 업종에서는 감소가 제한적이었다. 첫 직장 입직은 줄고 경력직 입직은 늘었다. 연구진은 "최근의 청년고용 부진을 AI만의 탓으로 돌려서는 안 된다"고 강조했다 — [한국은행 페이지](https://www.bok.or.kr/portal/bbs/B0000347/view.do?nttId=10094423&menuNo=201106), [아시아경제 2026-08-18](https://view.asiae.co.kr/article/2026081814283987947), [한국아이닷컴](https://www.hankooki.com/news/articleView.html?idxno=346790), [네이트 2026-08-18](https://news.nate.com/view/20260818n30151). 보고서 제목이 보도마다 다르게 적혀 있고("청년고용 위축, AI 탓인가?"), 입직 숫자(102명→45명)는 단위가 불분명하다 [미확인].
- [원문·06] 국회예산정책처는 생성형 AI가 고용·채용·임금에 미친 일관된 영향이 아직 없다고 했다(택스워치 2026-09-21 인용) — [택스워치](https://www.taxwatch.co.kr/article/tax/2026/09/21/0002).
- [원문·06] Sam Altman은 2026-05에 신입 일자리가 예상만큼 사라지지 않았다고 했다 — [TIME 2026-05-26](https://time.com/article/2026/05/26/sam-altman-ai-job-losses-openAI-/). Jensen Huang은 2026-07에 AI가 없애는 것은 업무(task)이지 일자리(job)가 아니라고 했다 — [Fortune 2026-07-28](https://fortune.com/2026/07/28/nvidia-jensen-huang-ai-killing-tasks-not-jobs/). 이번에 다시 확인하지 않았다.
- [2차] 미국 소프트웨어 개발 채용공고는 1년 전보다 약 21% 늘었다(Indeed, 2026-10-09). CNBC 제목은 "AI is automating coding. So why are software developer job postings on the rise?"다 — [CNBC 2026-10-11](https://www.cnbc.com/2026/10/11/ai-software-developer-jobs.html).

### Inferences
- 연구들이 함께 받치는 문장은 이것이다. "AI는 아직 일자리 전체를 줄이지 않았지만, **처음 들어가는 자리**(신입·사회 초년생)부터 일의 구성을 바꾸고 있다. 그 원인에는 AI 말고도 원격근무, 채용 둔화, 경기가 겹쳐 있다." 이 문장은 §19.1("역할이 바뀐다")과 §19.13(상관을 인과로 바꾸지 않는다)을 모두 지킨다.
- 한국은행의 '증강 업종에서는 감소가 제한적'이라는 결과는 서론에서 HON의 메시지("AI를 쓰되 판단은 사람이")로 넘어가는 다리로 쓸 수 있다. 다만 이것도 상관 분석이다.
- 심사자가 "AI 때문에 일자리가 사라진다는 근거가 약하지 않느냐"고 물으면 Yale·뉴욕 연준·국회예산정책처를 먼저 인정하고 답하는 것이 가장 단단하다.

### Gaps
- Canaries 갱신판의 소프트웨어 개발자 22~25세 수치, 한국은행 이슈노트의 정확한 발표일과 원문 문장을 원문으로 확인하지 못했다.
- 2026-11-18자 네이트 기사("AI가 먼저 지운 건 '신입 자리'…3~5년 뒤 한국 일자리 지도는")가 어떤 보고서를 다루는지 확인하지 못했다 — [네이트](https://m.news.nate.com/view/20261118n21367).

---

## 5. 회계사 수습 등록률 91%→28%, 변호사 채용공고 18.7% 감소 — 갱신된 공식 자료

### Takeaway
회계사 숫자는 금융위원회의 공식 대책(2026-05-31 「공인회계사 수습 안정화 방안」)으로 뒷받침된다. 그러나 정부와 대부분의 기사는 원인을 AI로 밝히지 않았다. 원인을 AI로 본 것은 한 매체의 해석뿐이다. 변호사 숫자는 새로 찾은 자료가 없다.

### Cited Findings
- [원문·06] 2025년 공인회계사 합격자 1,200명 가운데 수습기관 등록은 338명(28%)이다. 2022년에는 91%였다 — [택스워치 2026-09-21](https://www.taxwatch.co.kr/article/tax/2026/09/21/0002).
- [2차] 금융위원회는 2026-05-31 「공인회계사 수습 안정화 방안」을 발표했다. 국회·법원·국민연금공단과 한공회 추천 기관을 수습기관에 넣고, 지도회계사 경력 요건을 7년에서 4년으로 낮추고, 합격 후 2년 이상 수습처를 못 구한 사람은 한공회가 회계법인에 배정한다. 배경으로 "지난해 합격자 1,200명 중 10월 말 기준 등록 338명(28.2%)"을 들었다 — [머니투데이 2026-05-31](https://www.mt.co.kr/stock/2026/05/31/2026053110552227237), [아시아경제](https://view.asiae.co.kr/article/2026052917524222533), [한국세정신문](https://www.taxtimes.co.kr/news/article.html?no=275348), [이투데이](https://www.etoday.co.kr/news/view/2589259).
- [2차] 검색 요약에 따르면 AI 발달과 회계 인력 수요 감소를 원인으로 엮은 것은 한 매체의 분석이다. 다른 기사들은 AI를 직접 언급하지 않았다 — 위 기사들.
- [원문·06] 변호사 채용공고는 2021년 3,895건에서 2025년 3,167건으로 18.7% 줄었다(대한변협) — [다음](https://v.daum.net/v/XnBxhB2uWq). 이번 세션에서는 새로 찾지 않았다.

### Inferences
- 28.2%는 '10월 말 기준'이다. 91%(2022)도 같은 시점 기준인지 확인되지 않았다. 비교 시점이 다르면 낙폭이 부풀려질 수 있다. 수습처 부족은 합격자 수와 회계법인 수요의 불균형이라는 구조 문제로 다뤄지고 있다. 따라서 서론에서는 "정해진 길(자격증 → 수습 → 취업)이 흔들린다"의 예로만 쓰고 AI 탓으로 쓰지 않는다.

### Gaps
- 금융위원회 보도자료 원문(fsc.go.kr)과 91%의 측정 시점을 확인하지 못했다.
- 2026년(제61회) 합격자의 수습 등록 현황은 찾지 못했다.
- 변호사 채용공고 수치의 대한변협 원자료와 2026년 갱신치는 찾지 못했다.

---

## 6. 수능 AI 안경 — 2026-11-09 이후 바뀐 것

### Takeaway
11-09 이후 사정이 크게 달라졌다. 11-15 세무사 시험 수석 합격자가 초소형 카메라와 생성형 AI로 부정행위를 했다고 자수했고, 대입 논술·LEET·국가자격시험에서도 스마트안경 적발이 이어졌다. 교육부는 11-16 국회에서 수능 대책(전국 1,312개 시험장, 모든 안경 매 교시 점검)을 보고했다. 수능 연기는 검토하지 않는다고 했다. 수능은 11-19에 치르므로, 발표(11-24) 전에 시험 당일 결과를 다시 확인해야 한다.

### Cited Findings
- [2차] 11-16 최교진 교육부 장관이 국회 교육위원회에 「2027학년도 대학수학능력시험 관련 AI 스마트안경 대응 방안」을 보고했다. 내용은 전국 1,312개 시험장에 판별 전담 인력 1명 이상 배치, 시험장과 시도교육청·교육부 상황실을 잇는 핫라인 구축, 일반 안경을 포함한 모든 안경의 매 교시 점검이다. 적발 시 해당 시험을 무효로 하고 다음 해 응시 자격을 박탈한다. 올해는 별도 기술 탐지 장비를 들이지 않고 내년 도입을 검토한다 — [파이낸셜뉴스 2026-11-16](https://www.fnnews.com/news/202611161107364828), [인공지능신문](https://www.aitimes.kr/news/articleView.html?idxno=42747), [이투데이](https://www.etoday.co.kr/news/view/2648936).
- [2차] 응시 제한 확대는 보도가 엇갈린다. 1년에서 3년으로 늘리는 고등교육법 개정이라는 보도와 최대 10년이라는 보도가 있다 — [네이트 2026-10-29](https://news.nate.com/view/20261029n12203), [톱스타뉴스](https://www.topstarnews.net/news/articleView.html?idxno=16279436).
- [2차] 교육부는 수능 연기를 검토하지 않는다고 밝혔다. 국무조정실은 공공 와이파이 차단을 검토 중이다 — 위 기사들.
- [2차] 2026-11-15 제63회 세무사 시험 수석 합격자가 유튜브 방송에서 초소형 카메라·스마트폰·생성형 AI로 부정행위를 했다고 밝히고 경찰에 자수했다. 공인회계사 1차 시험에서도 같은 방법을 썼으나 불합격했다고 한다. 고용노동부는 시험 무효·합격 취소·5년 응시 제한을 진행한다고 했다. AI 안경을 썼는지는 확인되지 않았다 — [뉴스토마토](https://newstomato.com/ReadNews.aspx?no=1320439), [주간경향](https://weekly.khan.co.kr/article/202611160744001). 수사 중인 개인 사건이므로 이름은 쓰지 않는다.
- [2차] 11월 대입 논술에서 연세대와 서울시립대(자연계 수리논술 2명, 업무방해 고소)의 스마트안경 부정행위가 적발됐다. 신분 확인 때는 일반 안경을 쓰고 시험 중 바꿔 썼다 — [한국경제 2026-11-11](https://www.hankyung.com/article/202611118708i), [한국일보 2026-11-15](https://www.hankookilbo.com/news/article/A2026111515020005753).
- [2차] 교육부가 전국 5,679개 중·고교를 전수조사해 스마트안경 관련 내신 부정행위 4건(중 1, 고 3)을 확인했다 — [교수신문](https://www.kyosu.net/news/articleView.html?idxno=212233).
- [2차] 올해 국가자격시험 스마트안경 적발은 12건(기술자격 9, 전문자격 3)이다. 모두 생성형 AI 사용이 확인된 것은 아니다 — [뉴시스 2026-11-13 단독](https://www.newsis.com/view/NISX20261113_0003866636).
- [2차] LEET 응시자가 스마트안경을 쓴 채 적발됐다. 본인은 부정행위를 부인했고, 경찰은 문제 촬영·전송을 확인하지 못했다 — [서울신문 2026-11-18](https://www.seoul.co.kr/news/society/2026/11/18/20261118500064).
- [미확인] 가스기사 실기에서 'AI 인스펙터'가 처음 투입돼 1명을 적발했다는 보도가 있다. 검색 요약의 날짜가 "11월 25일"로 오늘(11-18) 이후여서 날짜를 믿을 수 없다 — [문화일보](https://www.munhwa.com/article/11631442).
- [원문·06] 6월 한 유튜버가 AI 안경으로 수능 모의 수학 30문항을 18분에 풀어 1등급을 받았다. 교사 2,716명 중 82.3%가 지금 감독 방식으로는 구분이 어렵다고 답했다 — [다음](https://v.daum.net/v/1E9jnAUZAL), [경향](https://www.khan.co.kr/article/202610271701001).

### Inferences
- 발표일(11-24)에는 수능이 이미 끝나 있다. "수능장에서 실제로 몇 건이 적발됐는지"(또는 "적발 0건")를 11-20~23 교육부 발표로 확인해 한 줄을 고쳐야 한다. 확인하지 못하면 "수능을 앞두고 정부가 전국 1,312개 시험장에서 모든 안경을 매 교시 점검했다"까지만 쓴다.
- 세무사 사건은 강렬하지만 수사 중인 개인 사건이다. 발표에서는 "올해 국가자격시험 수석 합격자가 생성형 AI 부정행위를 자수했다" 정도로 이름 없이 한 줄만 쓰거나 빼는 편이 안전하다. 부정행위 이야기가 길어지면 "AI는 나쁘다"로 들려 HON의 메시지("AI를 쓰되 판단은 내가")와 어긋난다.

### Gaps
- 교육부 보도자료 원문(moe.go.kr)과 수능 당일 이후 결과는 아직 없다(조사일 11-18).
- 응시 제한 확대 기간(3년 또는 10년)의 최종안을 확인하지 못했다.

---

## 7. HON에 적용한다면 [추론]

### Takeaway
가장 강하면서 방어하기 쉬운 서론 사실 셋을 고른다. (1) 시험장의 AI(수능 대책), (2) 신입 자리부터 바뀌는 일(한국은행 + Stanford), (3) 사람을 뽑기 전에 AI부터 묻는 기업(Salesforce·Shopify, Klarna로 균형). GPT-6 Astra는 정확한 출처를 붙여 한 줄로만 쓴다. 회계사·컴공 숫자는 질의응답용 예비로 둔다.

### Cited Findings
(이 절은 위 1~6절의 출처를 다시 쓰는 추론이다. 새로 확인한 사실이 없다.)

### Inferences
**슬라이드 1 — "정답을 찾는 일은 이제 안경 하나로 된다"**
- 쓸 문장: "이번 수능을 앞두고 교육부는 전국 1,312개 시험장에서 모든 안경을 매 교시 점검하기로 했습니다. AI 안경은 쓰기만 해도 부정행위입니다. 올해 여름 한 유튜버는 AI 안경으로 수능 모의 수학 30문항을 18분 만에 풀었습니다."
- 출처: 교육부 국회 보고(2026-11-16) [2차], 유튜버 사례 [원문·06]. 11-19 수능 결과로 한 줄을 갱신한다.
- 쓰지 않을 말: "수능이 연기된다"(틀림), "AI가 시험을 무의미하게 만들었다"(과장).

**슬라이드 2 — "AI는 일자리를 없애기보다, 처음 들어가는 자리부터 바꾸고 있다"**
- 쓸 문장: "한국은행에 따르면 최근 4년 동안 줄어든 청년 일자리 28만 5천 개 가운데 94%가 AI에 많이 노출된 업종에서 나왔습니다. 스탠퍼드 연구도 AI 노출이 큰 직무에서 22~25세 고용이 다른 직무보다 19% 뒤처졌다고 봅니다. 다만 두 연구 모두 'AI만의 탓은 아니고, 아직 일자리 전체가 사라지지는 않았다'고 말합니다."
- 왜 강한가: 한국 공공기관과 세계적 연구가 같은 방향을 가리킨다. 반대 증거까지 문장 안에 들어 있어 심사자의 반박을 미리 막는다. §19.1("역할이 바뀐다")과 §19.13(상관≠인과)을 모두 지킨다.
- 대체 또는 보조 숫자: 서울대 컴퓨터공학부 취업률 83.8% → 72.6%(대학 공시, [2차]). 청중이 대학생이라 생생하지만, 원인을 AI로 말하지 않는다는 단서가 필요하다.

**슬라이드 3 — "기업은 이제 사람을 뽑기 전에 AI에게 먼저 묻는다"**
- 쓸 문장: "Shopify CEO는 '새 인력을 요청하기 전에 AI로는 왜 안 되는지 먼저 보여 달라'고 했습니다. Salesforce CEO는 AI 덕분에 고객지원 인력을 9,000명에서 5,000명으로 줄였다고 말했습니다. 반대로 AI 상담을 앞세웠던 Klarna는 품질이 떨어지자 다시 사람을 뽑았습니다."
- 왜 강한가: CEO 본인의 말이고, 바뀌는 것이 일자리 숫자보다 '채용과 일의 기준'임을 보여 준다. Klarna가 "AI가 다 한다"는 과장을 스스로 막아 준다.
- 쓰지 않을 말: "Amazon이 AI 때문에 3만 명을 해고했다". CEO가 그 감원은 AI 때문이 아니라고 했다.

**GPT-6 Astra 한 줄(슬라이드 1이나 3 위에 덧붙인다)**
- "올해 9월 OpenAI 사장은 새 모델을 내놓으며 'AGI 시대에 오신 것을 환영합니다'라고 말했습니다. 그 자신도 AGI가 무엇인지는 흐릿하다고 덧붙였습니다."
- "OpenAI가 AGI를 선언했다"로 쓰지 않는다.

**넘어가는 질문(§19.1 안에서)**
- "AI가 답을 만드는 속도가 빨라질수록, 무엇을 묻고 무엇을 고를지는 누가 정할까요? 그 기준은 어디서 올까요?" 이 질문은 SERVICE_WHY §2·§4의 "질문·기준·검증·선택·책임"으로 바로 이어진다.
- 피할 말: "AI가 대부분의 일자리를 대체한다", "사짜 직업은 끝났다", "컴공은 AI 때문에 망했다", "AI 때문에 청년이 취업을 못 한다".

**질의응답 대비(반대 증거 카드)**
- 예일대 Budget Lab: 경제 전체에 AI 교란의 뚜렷한 증거가 없다(2026-08 자료).
- 뉴욕 연준: 젊은 대졸자 실업 증가의 64%는 원격근무로 설명된다(2026-06-01).
- 세인트루이스 연준: 청년 실업 증가에서 채용공고 감소(2.9%p)가 AI 기술 수요 이동(1.1%p)보다 컸다.
- 국회예산정책처: AI가 고용·임금에 미친 일관된 영향은 아직 없다.
- Altman(2026-05)·Huang(2026-07): 신입 일자리는 우려만큼 사라지지 않았고, AI는 업무를 없애지 일자리를 없애지 않는다.
- 미국 소프트웨어 개발 공고는 1년 전보다 21% 늘었다. 다만 증가분은 시니어 중심이다.
- 답의 틀: "그래서 우리는 'AI가 일자리를 없앤다'고 말하지 않습니다. 일하는 방식과 처음 요구받는 것이 바뀌고 있다고 말합니다."

### Gaps
- 위 문장의 영어 인용(Benioff, Lütke, Brockman)과 한국은행 수치는 발표 전에 원문 페이지에서 대조해야 한다. 이번 세션에서는 네트워크 제한으로 하지 못했다.
- 수능 당일(11-19) 결과는 조사일 이후의 일이다.
