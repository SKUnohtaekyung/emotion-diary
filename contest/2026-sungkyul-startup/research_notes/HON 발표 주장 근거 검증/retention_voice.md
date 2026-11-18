# 일기·감정앱 이탈과 음성(STT) 일기의 유료화 근거 (조사일 2026-11-18)

**조사 환경 주의**: 이 세션에서 WebFetch는 pmc.ncbi.nlm.nih.gov, openai.com 해석(DNS) 실패로 원문을 열지 못했다(두 호스트는 세션 네트워크 허용 목록에 추가해야 열린다). 이후 전부 WebSearch 요약에 의존했다. 따라서 아래 [원문] 표기는 한 건도 없고, 대부분 [2차]이며 일부 [미확인]이다. 가격·기능은 모두 2026-11-18에 검색 결과로 본 값이며, 공식 가격 페이지에서 직접 확인한 값이 아니다. 발표 전 공식 페이지 재확인이 필요하다.

## 1. Baumel 2019(JMIR)의 정확한 수치와 일·감정앱 리텐션 자료

### Takeaway
Baumel et al. 2019는 실재하며 수치도 "한 자릿수 30일 유지율" 주장과 맞는다: 93개 앱, 일간 사용률 중앙값 4.0%, 15일 유지 3.9%, 30일 유지 3.3% [2차]. 단 "저널링 앱"이 아니라 정신건강 앱 전반이고 설치 대비 패널 데이터이므로, 일기앱 전용 수치로 쓰면 과대해석이다.

### Cited Findings
- 논문: Baumel A, Muench F, Edan S, Kane JM. "Objective User Engagement With Mental Health Apps: Systematic Search and Panel-Based Usage Analysis." J Med Internet Res 2019;21(9):e14567. [2차: 검색 요약, 서지는 다수 사이트에서 일치] — [PMC6785720](https://pmc.ncbi.nlm.nih.gov/articles/PMC6785720), [JMIR RIS](https://jmir.org/article/export/ris/jmir_v21i9e14567)
- 표본: 기준을 충족한 앱 93개(설치 수 중앙값 100,000, IQR 90,000). 행동 데이터는 앱 이용을 집계(비식별)해 제공하는 패널에서 얻었다. [2차] — [PMC6785720](https://pmc.ncbi.nlm.nih.gov/articles/PMC6785720)
- 일간 활성 사용자 비율(open rate) 중앙값 4.0%. 피어서포트·트래커 앱이 호흡 앱(중앙값 1.6%)보다 높다. [2차] — [PMC6785720](https://pmc.ncbi.nlm.nih.gov/articles/PMC6785720)
- 15일 유지 중앙값 3.9%(IQR 10.3%), 30일 유지 중앙값 3.3%(IQR 6.2%). 30일 시점에 피어서포트·마음챙김·트래커 앱이 호흡 앱보다 잘 유지(호흡 앱 중앙값 0.0%, 프리프린트 기준). [2차] — [PMC6785720](https://pmc.ncbi.nlm.nih.gov/articles/PMC6785720)
- 저자 결론: 설치 수·일간 사용 시간이 커 보여도 장기간 쓰는 사용자는 소수. [2차]
- 참고 비교: PTSD Coach는 개발사 보고 기준 1개월 41.6%, 6개월 19.4% 지속(Baumel 논문이 인용). 즉 "단일 자릿수"는 앱 중앙값이지 모든 앱의 값이 아니다. [2차]
- 창업자의 "10%? 3%?"는 위 중앙값(30일 3.3%, 15일 3.9%)에 가깝다. 다만 분모는 설치자이고 패널 기반 추정이다. [추론]
- 같은 분야의 다른 시기 리텐션 자료는 이번 조사에서 확인하지 못했다. [미확인]

### Inferences
- 발표에서는 "정신건강 앱 93개의 중앙값, 30일 유지 약 3%(Baumel 2019)"처럼 범위를 밝히고, 일기·무드 트래커 앱만의 수치로 말하지 않는 것이 안전하다. 2019년 자료라 7년 전 수치라는 점도 같이 쓴다.
- 앱 카테고리별로 트래커가 호흡 앱보다는 낫다는 점은 있으나, 트래커의 구체 수치는 확인 못했다.

### Gaps
- 트래커 카테고리별 정확한 중앙값, 패널 업체명·기간·국가: 원문 접근 불가.
- 일기/저널링 앱에 한정한 최신 리텐션(2022~2026): 찾지 못함. Day One, Rosebud 등 개별 앱 공개 수치는 확인 못함.

## 2. 일기·감정 기록을 중단하는 이유

### Takeaway
중단 이유의 가장 근거 있는 축은 "기록 비용(노력)·귀찮음·흥미 상실"이다. 다만 직접 근거는 일기가 아니라 일반 자기추적(personal informatics)이거나 무드앱 인터뷰이고, "깜빡함"과 "기록이 어색함"을 직접 지지하는 자료는 이번에 못 찾았다.

### Cited Findings
- Epstein 등 계열 "Beyond Abandonment to Next Steps"(PMC5428074): 이전 사용자 193명 설문과 12명 인터뷰로 중단 이유 6개와 중단 후 관점 5개를 도출. 추적 비용이 중단으로 이어지고, 사람들이 추적을 "번거롭다", "게을러졌다", "흥미를 잃었다"고 말함. 도구가 호기심을 채우면 추적이 불필요해지기도 함. 대상은 신체활동·재무·위치 추적이며 기분 기록이 아니다. [2차] — [PMC5428074](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5428074/)
- 무드 추적 앱 사용자 22명 인터뷰: 부정적 기분 입력을 피하고 드물게 추적하는 패턴, 긍정 기분 위주 기록 선호. [2차] — [NSF PAR 10376298](https://par.nsf.gov/biblio/10376298-understanding-peoples-use-perspectives-mood-tracking-apps-interview-study)
- 양극성 장애 포커스 그룹: 기존 기분 추적은 수개월 매일 기록해야 해서 노력이 크다. [2차, 출처 URL은 검색 결과 요약만 확인]
- 정신과 외래 앱 이탈 연구: 이탈자는 첫 5~7일 동안 기분 기록 빈도가 완료자보다 유의하게 낮음 → 초기 기록 빈도가 이탈 예측 신호. [2차] (검색 결과에 개별 URL 없음; 논문명 미확인)
- Eisele et al. 2022(저널은 JMIR가 아니라 Assessment 29(2)): 학생 163명, 30문항 또는 60문항 설문을 하루 3·6·9회, 14일. 긴 설문이 부담을 높이고 자료의 양·질을 떨어뜨렸으며, 빈도 증가는 순응도를 바꾸지 않았으나 지각된 부담은 높였다. [2차] — [Tilburg 연구포털](https://research.tilburguniversity.edu/en/publications/the-effects-of-sampling-frequency-and-questionnaire-length-on-per/)
- 반례: Hasselhorn 등 다른 연구는 설문 길이가 부담·순응도에 영향이 없었다고 보고. Businelle 2024(JMIR)도 하루 EMA 횟수·문항 수가 순응도와 무관. [2차] — [JMIR 2024 e50275](https://jmir.org/2024/1/e50275/PDF)
- 알림·의무 로그·스트릭이 죄책감을 낳는다는 2026년 JMIR 질적 연구 요약이 있으나 원문 대조 못함. [미확인]
- "사생활 걱정", "반복성"을 이탈 이유로 직접 측정한 자료: 이번 조사에서 확인 못함. [미확인]

### Inferences
- Eisele는 "설문 문항 수"에 관한 EMA 자료다. 자유 서술 일기가 길어서 힘들다는 근거로 옮기면 안 된다. 다만 "입력 노력이 클수록 부담"이라는 일반 방향의 보조 근거로는 쓸 수 있다. [추론]
- 창업자의 "귀찮고 바빠서 잊는다"는 가설은 방향상 자기추적 중단 연구와 어긋나지 않으나, 일기에 직접 입증된 것은 아니다. [추론]
- SERVICE_WHY §11·§19.12(기록을 강제하지 않음)와 맞춰 "기록하지 못한 날은 실패가 아니다"를 유지해야 한다.

### Gaps
- 일기/감정일기 앱 한정 이탈 사유 설문(깜빡함·어색함·프라이버시)은 찾지 못함.
- Eisele 원문 수치(부담 점수·순응률) 미확인.

## 3. 말 vs 글 감정 표현의 증거

### Takeaway
고전 연구(Murray & Segal 1994 등)는 말로 하는 표현과 글쓰기가 비슷한 정서 처리·고통 감소를 낸다고 요약된다. 음성이 글보다 우월하다는 증거는 확인하지 못했다. 음성 일기/음성 EMA 순응도 비교는 감정이 아닌 다른 주제(HIV 위험행동)뿐이다.

### Cited Findings
- Murray & Segal(1994), "Emotional processing in vocal and written expression of feelings about traumatic experiences," J Traumatic Stress 7:391–405. 서지는 확인, 본문은 못 읽음. [2차] — [Springer/Zendy 서지](https://zendy.io/title/10.1002/jts.2490070305), [PDF 링크](https://agingandmentalhealthlab.uccs.edu/sites/g/files/kjihxj1911/files/2020-07/Emotional-processing-Murray%26Segal-JTS-1994.pdf)
- 2차 리뷰 설명: 비해결 스트레스 경험을 가진 214명을 여러 조건에 무작위 배정, 말과 글로 여러 회기 표현한 것이 고통 감소에서 대체로 동등하고 통제 조건보다 낫다. [2차, 요약 서술] — [PMC3525957](https://pmc.ncbi.nlm.nih.gov/articles/PMC3525957)
- 치료자에게 말하기 4회기와 녹음기에 혼자 말하기가 부정 정서를 비슷하게 줄였다는 서술은 "Segal and Murray(1994)"로 표기가 달라 저자순·세부가 불확실. 녹음기 사용 여부는 원문 미확인. [미확인/2차]
- Pennebaker의 테이프 레코더 연구 자체: 직접 확인 못함. [미확인]
- 음성 vs 웹 일기 순응도(HIV 양성 청년 MSM): 33일씩 웹·전화(음성) 일기를 교차, 일기 유지 93.4%, 완료율 72.4%, 둘 다 실행 가능·수용 가능. 주제는 위험행동. [2차] — [UCLA 논문 PDF](https://spherelab.psych.ucla.edu/wp-content/uploads/sites/301/2023/03/The-feasibility-and-acceptability-of-using-technology-based-daily-diaries-with-HIV-positive-young-men-who-have-sex-with-men-a-comparison-of-web-and-phone-modalities.pdf)
- 음성 기반 EMA 수용도: 뉴욕 저소득 주택 거주자의 80.2%가 참여 의향. 연령과 수용도의 연관이 있어 젊은 층에는 덜 맞을 수 있다는 서술. [2차] — [PMC4945448](https://pmc.ncbi.nlm.nih.gov/articles/PMC4945448)
- 2026 arXiv(심사 여부 미확인): 20명, 15일 현장연구, 음성 저널링이 글보다 길고 열린 성찰을 낸다고 보고. 후회·소망 + "What if" 계획 모듈. 소표본·비심사 가능성. [2차] — [arXiv 2604.06477](https://arxiv.org/html/2604.06477)

### Inferences
- "말하면 더 쉽다/길어진다"는 가설은 소규모 비심사 자료 수준이다. "글 대신 말도 동등한 효과가 있었다"까지가 고전 근거로 방어 가능하다. [추론]
- 청소년·청년 대상 음성 일기의 수용도는 직접 근거가 없다(수용도 연구는 고령·저소득 표본). [추론]

### Gaps
- Pennebaker 녹음기 연구 원문, Murray&Segal 효과 크기, 음성 vs 글의 일기 지속률 직접 비교: 못 찾음.

## 4. 음성 일기 제품과 가격 (2026-11-18 검색 결과 기준)

### Takeaway
음성 일기는 이미 포화에 가까운 시장이고, 가격은 월 약 $7~15 / 연 $30~100대로 퍼져 있다. 대부분 AI 기능 묶음 구독이며, "음성만 따로 N회 무료 후 유료"인 구조를 확인한 사례는 찾지 못했다.

### Cited Findings
- Rosebud: Bloom 월 $12.99 또는 연 $107.99(월 약 $8.99 환산), 상위 Thrive 2x/5x는 AI 사용량 한도가 큼. 무료 플랜 유무는 출처 간 충돌(경쟁 블로그는 2026-09-30부터 무료 플랜 없음, 다른 리뷰는 무료 플랜 있음). 음성 입력의 가격 구분은 확인 못함. [2차] — [mylifenote 리뷰](https://blog.mylifenote.ai/rosebud-review/), [makerstack 리뷰](https://makerstack.co/reviews/rosebud-review/), [macaron 리뷰](https://macaron.im/nl/blog/rosebud-ai-journaling-app-review-2026)
- Day One: 2026-03 보도에서 Premium을 Silver로 바꿔 연 $49.99, 새 Gold 티어 연 $74.99, Daily Chat(대화형 일기) 도입. 다른 비교글은 Premium 약 $34.99/년으로 불일치. 오디오 기능의 유료 구분은 미확인. [2차] — [AlternativeTo 2026-03](https://alternativeto.net/news/2026/3/day-one-introduces-daily-chat-for-conversational-journaling-and-new-gold-subscription-tier), [Speakwise 2026-06-29](https://speakwiseapp.com/blog/best-ai-voice-journaling-app-2026)
- Voicenotes: 추정치가 엇갈림(Pro 월 $9 / 월 $14.99 / 연 $99.99). [2차] — [recurdash](https://recurdash.com/subscription-pricing/voicenotes), [aiproductivity](https://aiproductivity.ai/pricing/voicenotes/)
- AudioPen: 현재 가격 불명, 무료 티어가 매우 작다는 서술. [미확인] — [yaps 비교글](https://www.yaps.ai/ko/블로그/audiopen-대안)
- 기타: Entries(음성 우선) 무료 또는 월 $14.99, Life Note 무료 또는 월 $9.99(음성 전용 아님), MindDrop 연 $29.99, Untold 주 $6.99, Flint 일회성 $12 [2차] — [mylifenote 한국어 비교](https://blog.mylifenote.ai/ko/best-ai-journaling-apps-ko/), [minddrop 블로그](https://minddrop-journal-nine.vercel.app/blog/best-voice-journaling-apps), [klu.so](https://klu.so/blog/voice-note-apps-without-subscription)
- Mindsera, Reflection: 가격·음성 기능 확인 못함. [미확인]
- 한국 앱스토어에 음성 일기 앱이 다수: 말로 감정일기(음성→텍스트, 사건·생각·감정 구조화, 무료 표기), SayLog(음성→텍스트, 10가지 감정·키워드 추출), 컬로그(AI와 통화하듯 말하면 일기 정리, 무료+인앱구입), Echo(음성 메모 요약, 구독), Aiary(무료, Pro 구독). 구독 가격은 확인 못함. [2차, 앱스토어 설명] — [말로 감정일기](https://apps.apple.com/kr/app/%EB%A7%90%EB%A1%9C-%EA%B0%90%EC%A0%95%EC%9D%BC%EA%B8%B0-ai-%EB%8B%A4%EC%9D%B4%EC%96%B4%EB%A6%AC-%EA%B0%90%EC%82%AC%EC%9D%BC%EA%B8%B0-%EA%B3%A0%EB%AF%BC%EC%83%81%EB%8B%B4/id6752219895), [SayLog](https://apps.apple.com/app/saylog/id6759184935), [컬로그](https://apps.apple.com/kr/app/%EC%BB%AC%EB%A1%9C%EA%B7%B8-ai-%EB%8C%80%ED%99%94%EC%9D%BC%EA%B8%B0/id6744907007)

### Inferences
- 한국 시장에 "말로 쓰는 일기" 경쟁작이 이미 여럿이므로 음성 자체는 차별점이 못 된다. [추론]
- 가격 비교글 대부분이 제3자 블로그/경쟁사 블로그라 신뢰도가 낮다. 발표 슬라이드에는 공식 가격 페이지 캡처가 필요하다.

### Gaps
- 음성만 종량·횟수 제한으로 과금하는 경쟁 제품: 확인 못함. Mindsera, Reflection, AudioPen 공식 가격 미확인.

## 5. STT 비용, 무료 iOS 받아쓰기, iOS 홈 화면 웹앱 녹음

### Takeaway
STT 원가는 분당 약 $0.003~0.016으로 매우 낮아 하루 1~3분 사용 시 사용자당 월 원가는 수십~수백 원 수준이다 [추론]. 따라서 유료 근거는 "받아쓰기 자체"가 아니라 그 이후 가치여야 한다. iOS 홈 화면 웹앱의 녹음은 가능하다는 단서가 있으나 안정성에 보고된 문제가 있어 실기기 검증이 필수다.

### Cited Findings
- OpenAI(2026-11-18, 제3자 사이트 기준): gpt-4o-transcribe 약 $0.006/분, gpt-4o-mini-transcribe 약 $0.003/분, whisper-1 $0.006/분. 토큰 과금도 있음(오디오 입력 $6/백만 토큰). 공식 가격 페이지는 열지 못함. 다른 출처는 gpt-realtime-whisper 약 $0.017/분, "GPT Transcribe" $0.0045/분을 언급하나 확인 안 됨. [2차] — [diyai 2026](https://diyai.io/ai-tools/speech-to-text/openai-whisper-api-pricing-2026/), [costgoat](https://costgoat.com/pricing/openai-transcription), [Neowin(출시 기사)](https://www.neowin.net/news/openai-announces-next-generation-audio-models-to-power-voice-agents/)
- Google Cloud Speech-to-Text V2 표준: 처음 50만 분/월 $0.016/분, 이후 $0.010, $0.008, 200만 분 초과 $0.004. Dynamic Batch 약 $0.003/분. 다채널은 채널당 과금. [2차, 구글 가격 페이지 검색 스니펫과 제3자 가이드] — [Google 가격 페이지](https://cloud.google.com/speech-to-text/pricing/), [diyai](https://diyai.io/ai-tools/speech-to-text/google-cloud-speech-to-text-pricing/)
- Naver CLOVA Speech: 사용 시간 기준 과금, 분당 요금표는 콘솔에 있어 미확보. 예시로 10초 5원, 32초 15원(롱 서비스, 화자·이벤트 인식 제외)이라는 서술이 있고, 이를 분으로 환산하면 대략 30원/분 수준이나 계산은 내 추정이다. 2024-02 실시간 스트리밍 출시 때 요금 40% 인하. [2차/추론] — [ncloud 가이드](https://guide.ncloud-docs.com/docs/clovaspeech-spec), [KED Global 2024-02](https://amp.kedglobal.com/newsAmp/ked202402020009)
- iOS 키보드 기본 받아쓰기(무료)가 있다는 사실: 이번 검색에서 Apple 문서로 확인하지 못함. 일반 지식이며 [미확인].
- WebKit 블로그(MediaRecorder API): iOS 14.3 베타에서 Safari가 MediaRecorder를 기본 지원하고 WKWebView에서 getUserMedia 노출. 홈 화면 웹앱은 별도 언급 없음. [2차] — [webkit.org MediaRecorder 글](https://webkit.org/?p=11353)
- WebKit 버그 185448(홈 화면 앱 standalone에서 getUserMedia 불가): 2020년 메일링 리스트에서 13.3 베타부터 정상 동작한다고 기재. 13.4에서 `apple-mobile-web-app-capable` 메타 태그 제거 시 동작했다는 보고도 있음. [2차] — [Bug 185448](https://bugs.webkit.org/show_bug.cgi?id=185448)
- 남은 문제: Bug 212040(standalone에서 페이지 메인 경로가 바뀌면 getUserMedia 스트림 중단), Bug 215884(경로 변경마다 권한 프롬프트 재등장, 권한이 설치 웹앱에 유지되지 않음; iOS 버전 미기재). Apple 개발자 포럼: 홈 화면 앱을 닫았다 열면 MediaRecorder가 실패해 폰을 재시작해야 한다는 글(날짜·버전 불명). [2차] — [Bug 212040](https://bugs.webkit.org/show_bug.cgi?id=212040), [Bug 215884](https://bugs.webkit.org/show_bug.cgi?id=215884), [Apple Forums 797987](https://developer.apple.com/forums/thread/797987)
- iOS 16.4부터 홈 화면 웹앱 웹 푸시 지원(알림 권한은 사용자 탭 직후 요청). iOS 26에서는 홈 화면에 추가한 사이트가 기본적으로 웹앱으로 열림. [2차] — [mjtsai](https://mjtsai.com/blog/wp-json/wp/v2/posts/38542), [OneSignal 문서](https://documentation.onesignal.com/docs/en/web-push-for-ios)

### Inferences
- 전송량: 3분 녹음 × 하루 1회 × 30일 = 90분. gpt-4o-mini-transcribe($0.003/분)이면 월 약 $0.27(약 400원, 환율 1,450원/$ 가정), 표준 $0.006/분이면 $0.54(약 800원). 7~8회 무료 체험 전체 원가는 24분 기준 $0.07~0.14 수준. [추론, 계산은 내 것]
- 무료 iOS 받아쓰기가 키보드에 있다면 "텍스트로 바꿔줌"은 유료 사유가 못 된다. 구조화(사건·감정·강도·해석 필드 채우기), 한국어 정확도, 말버릇 정리 등 후처리가 가치다. [추론]
- 네트워크 비용만이 아니라 Workers의 요청 크기·시간 한도와 업로드 방식도 확인해야 하나 이번엔 조사하지 못함.

### Gaps
- OpenAI·Naver 공식 가격 페이지 직접 확인 실패(호스트 차단). Apple 공식 문서의 iOS 키보드 받아쓰기, Safari 릴리스 노트 버전별 표(14.3, 16.4, 17, 26의 standalone 녹음 동작): 미확인. 최신 iOS에서 위 버그들이 해결됐는지 확인 못함.

## 6. 개인정보보호법상 음성 정보

### Takeaway
음성은 "생체정보"의 예이지만, 특정 개인의 인증·식별 목적으로 기술적으로 처리될 때만 "생체인식정보"가 되어 민감정보로 취급된다는 해석이 2차 자료에서 일관된다. 단순 STT는 일반 개인정보일 가능성이 높으나, 일기 내용 자체가 건강·정신상태 정보이면 별도로 민감정보 쟁점이 생길 수 있다 [추론].

### Cited Findings
- 개인정보의 안전성 확보조치 기준(개인정보보호위원회 고시)이 음성을 생체정보의 예로 들고, 생체인식정보는 인증·식별 목적으로 처리되는 정보로 정의. [2차: 조문 사본 사이트] — [wikidocs](https://wikidocs.net/264634)
- 식별·인증 목적 없이 음성을 처리하면 일반 개인정보로 보되 유출 위험이 커 원본정보에 준하는 보호조치를 권고. 보도 기준. [2차] — [보안뉴스](https://m.boannews.com/html/detail.html?idx=102064)
- 생체인식 특징정보는 시행령상 민감정보. [2차] — [CIO 칼럼](https://www.cio.com/article/3523251/%EA%B0%95%EC%9D%80%EC%84%B1%EC%9D%98-%EB%B3%B4%EC%95%88-%EC%95%84%ED%82%A4%ED%85%8D%ED%8A%B8%E3%85%A3%EC%83%9D%EC%B2%B4%EC%9D%B8%EC%8B%9D%EA%B8%B0%EC%88%A0%EA%B3%BC-%EA%B8%80%EB%A1%9C%EB%B2%8C.html)
- 2023 개인정보위 AI 정책방향: 생체인식정보는 별도 동의나 법령 근거가 있을 때만 처리. [2차] — [법무법인 세움 뉴스레터](https://shinkim.com/kor/media/newsletter/pdf/2182)
- 개인정보위 생체정보보호 가이드라인 원문, 시행령 제18조 원문: 열람 못함. [미확인]

### Inferences
- 화자 식별·음성 인증을 하지 않고 STT만 쓰며, 음성 원본을 전사 후 즉시 삭제하는 설계가 가장 안전하다. 외부 STT 사업자(해외 API) 전송은 위탁·국외이전 고지 쟁점이 될 수 있으나 이번에 조사하지 않았다. [추론]
- 일기 내용(정신건강 상태 등)이 민감정보에 해당하는지는 별개이며 법률 검토가 필요하다. AGENTS §3의 "개인 일기를 로그·fixture에 넣지 않는다"와도 일관.

### Gaps
- PIPC 원문 가이드라인의 정확한 문구와 쪽수, 전사 텍스트가 민감정보가 되는 경우에 대한 해석: 못 찾음.

## 7. 걷기와 사고·성찰

### Takeaway
Oppezzo & Schwartz 2014는 걷기가 창의적 발상(확산적 사고)을 높였다는 근거이며, 감정 성찰이나 음성 기록과 직접 연결한 연구는 찾지 못했다.

### Cited Findings
- 논문: Oppezzo M, Schwartz DL. "Give Your Ideas Some Legs: The Positive Effect of Walking on Creative Thinking." J Exp Psychol Learn Mem Cogn 2014;40(4). 4개 실험, 걷기가 걷는 동안과 직후 창의적 발상을 높임. [2차] — [논문 PDF(gwern)](https://www.gwern.net/doc/psychology/novelty/2014-oppezzo.pdf), [APA 보도자료](https://www.apa.org/news/press/releases/2014/04/creativity-walk)
- 176명(대학생 다수) 보도. 첫 실험은 앉기 vs 러닝머신 걷기의 확산적 과제. 걸은 뒤 앉아서도 효과가 이어진 집단이 있음. 실내·실외 효과가 유사했다는 보도. 비유산소성 걷기. [2차]
- 대중 매체의 "2배", "50%", "+60%"는 논문 핵심 수치가 아니므로 쓰지 않는다. [2차 경고]
- 걷기+음성 노트 성찰의 직접 연구: 못 찾음. 인접 자료로 UCSF "awe walk"(고령자 8주, 긍정 정서 증가·일상 고통 감소)가 있으나 대상·목적이 다름. [2차] — [Stanford Lifestyle Medicine](https://lifestylemedicine.stanford.edu/?p=49327)

### Inferences
- 창의적 발상 결과를 "감정 성찰이 좋아진다"로 옮기면 SERVICE_WHY §19의 과대해석 금지에 걸린다. "걷는 동안 아이디어가 더 잘 나온다는 실험이 있다. 감정 성찰에 대한 직접 근거는 아직 없다" 정도로 한정한다. [추론]
- 이 아이디어는 근거 없이 약속하는 마케팅보다 "시험해볼 가설"로 소개하고, 아이폰 화면 잠금·백그라운드 녹음이 홈 화면 웹앱에서 되는지부터 검증해야 한다(걷는 중 화면이 꺼지면 녹음이 끊길 가능성, 미확인).

### Gaps
- 걷기 + 반추/성찰/구술 기록 연구, 워크앤토크 연구: 확인 못함.

## HON에 적용한다면 [추론]

### Takeaway
"음성 일기, 무료 7~8회 후 유료"는 조건부로 방어 가능하나, 근거를 "음성이 이탈을 막는다"에 두면 약하다. 유료 사유는 "말한 것을 HON의 구조(사건·감정·해석·선택)로 정리해 주는 일"에 두는 편이 낫다.

### 방어 가능한 점
- 원가가 매우 낮아(5절 계산) 무료 체험 횟수를 늘려도 부담이 적다. 7~8회는 원가보다 "써보고 판단하게 하는 장치"이다.
- 글쓰기는 항상 무료라는 원칙은 WHY §17의 "기록은 의무가 아니다", §20-7(통제권)과 맞는다.
- 말과 글의 표현 효과는 비슷하다는 고전 근거(Murray & Segal)가 있어 "말로도 같은 자리에 기록할 수 있게 한다"는 주장은 무리가 없다.

### 약한 점과 위험
- iOS 키보드 받아쓰기가 무료이므로(미확인이지만 널리 알려진 기능) "받아쓰기"만 유료로 팔면 설득력이 약하다. 경쟁작(한국 앱 다수, Day One, Rosebud)도 음성을 기본 기능으로 두는 추세다.
- "말하면 이탈이 줄어든다"는 직접 근거가 없다. Baumel의 낮은 유지율은 음성이 해결책이라는 증거가 아니다.
- 기술 위험: 홈 화면 웹앱에서 MediaRecorder/getUserMedia가 열고 닫을 때 실패하거나 권한을 반복해서 묻는다는 보고(Bug 212040, 215884, Apple 포럼). 유료 기능이 시연에서 안 되면 치명적이다. 실기기 검증 전에는 약속하지 않는다.
- 개인정보: 원본 음성 즉시 삭제, 화자 식별 미사용, 외부 STT 전송 고지가 필요. 법률 검토 전에는 "민감정보가 아니다"라고 단정하지 않는다.
- 과금 설계: 무료 체험이 끝난 시점에 "써야 한다"는 압박이 생기면 §20-4(기록 강제 금지)와 충돌할 수 있다. 체험 소진 시에도 글쓰기는 막히지 않음을 명확히 한다.
- 구독 B안(주간·월간 회고, 나만의 기준)은 이번 조사 범위 밖이지만, 가격대 비교(월 $7~15, 연 $30~100)는 Rosebud·Day One 가격을 참고용으로 쓸 수 있다.

### 권장 문구(발표용)
- 쓰기 좋은 문장: "글쓰기는 언제나 무료입니다. 말로 남기고 싶은 날을 위해 음성 기록을 7~8회 먼저 써보실 수 있고, 이후에는 구독으로 이용합니다."
- 쓰지 말 문장: "음성으로 하면 일기를 끝까지 쓰게 됩니다", "정신건강이 좋아집니다"(§19.11 위반), "대부분의 감정일기 앱 사용자는 3%만 남는다"(Baumel은 정신건강 앱 93개 중앙값이고 2019년 자료).
- 근거 표현: "정신건강 앱 93개 분석에서 30일 유지율 중앙값은 약 3%였다(Baumel 외, 2019)", "말과 글로 표현했을 때 효과가 비슷했다는 연구가 있다(Murray & Segal, 1994)".
- 걷기 아이디어: "걸으면 발상이 늘었다는 실험이 있다(Oppezzo & Schwartz, 2014). 걷기와 음성 기록의 결합은 HON이 검증해 볼 가설이다."

### Gaps
- 사용자 의향(음성에 돈 낼지)은 문헌으로 확인 불가. 창업팀의 사용자 인터뷰나 대기자 명단으로 직접 확인해야 한다.
