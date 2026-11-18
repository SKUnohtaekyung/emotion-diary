// 한글 양식에 넣을 그림을 도표별로 뽑고, 칸마다 넣을 글·그림 목록(양식-채우기.json)을 만든다.
// 실행: 저장소 루트에서  node "contest/2026-sungkyul-startup/제출/_양식-준비.mjs"
import { chromium } from "@playwright/test";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(dir, "../../..");
const figDir = path.join(dir, "그림");
fs.mkdirSync(figDir, { recursive: true });

// [이름, 선택자, 다시 흘릴 폭(px, 없으면 그대로), 한글에 넣을 폭(mm)]
const FIGS = [
  ["A-배경숫자", ".p2 .cols.c3", 580, 118],
  ["B-케냐실험", 'svg[aria-label^="케냐"]', null, 108],
  ["E-감정계열", "#taxo", null, 108],
  ["G-지금숫자", "section:nth-of-type(4) .cols.c4", 520, 118],
  ["H-진행상황", 'svg[aria-label^="진행 상황"]', null, 118],
  ["K1-청년통계", 'xpath=//*[name()="svg" and starts-with(@aria-label,"최근 1년 번아웃")]/..', null, 92],
  ["K2-청소년통계", 'xpath=//*[name()="svg" and starts-with(@aria-label,"스트레스 인지율")]/..', null, 92],
  ["L-AI원칙", "section:nth-of-type(6) table >> nth=0", 520, 118],
  ["M-돌아보기", 'svg[aria-label^="돌아보기의 네 단계"]', null, 118],
  ["N-넣지않은것", "section:nth-of-type(6) table >> nth=1", 520, 118],
  ["O1-여섯갈래", 'svg[aria-label^="여섯 갈래"]', null, 86],
  ["O2-위치지도", 'svg[aria-label^="위치 지도"]', null, 104],
  ["P-경쟁비교", "section:nth-of-type(7) table", 520, 118],
  ["Q-세모델", "section:nth-of-type(7) .cols.c3", 520, 118],
  ["R1-무료와구독", "section:nth-of-type(8) .cols.c2 >> nth=0", 520, 118],
  ["R2-무료횟수", 'svg[aria-label^="처음 세 번"]', null, 118],
  ["S-가격대", 'svg[aria-label^="참고 가격대"]', null, 96],
  ["T-위험대응", "section:nth-of-type(9) table", 520, 118],
  ["U-순서", 'svg[aria-label^="앞으로의 순서"]', null, 118],
  ["V-흐름", 'svg[aria-label^="자기 관찰"]', null, 118]
];
// 디자인 시안 화면 묶음(docs/assets/readme)
const SCREENS = [
  ["D-기록흐름", "docs/assets/readme/write-flow.png", 118],
  ["F-돌아보기화면", "docs/assets/readme/look-back.png", 118],
  ["I-지키는화면", "docs/assets/readme/care.png", 84],
  ["J-처음여는장면", "docs/assets/readme/onboarding.png", 118]
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 3 });
await page.goto(pathToFileURL(path.join(dir, "사업계획서.html")).href);
// 도표 글꼴을 양식 본문 글꼴(휴먼명조)에 맞춘다. 한글과컴퓨터가 함께 설치한 글꼴 파일을 그대로 읽어 쓴다.
const BODY_FONT = "C:/Program Files (x86)/HNC/Office 2022/HOffice120/Shared/TTF/Hwp/HMKMM.TTF";
const fontB64 = fs.readFileSync(BODY_FONT).toString("base64");
await page.addStyleTag({ content: `@font-face { font-family: "FormBody"; src: url(data:font/ttf;base64,${fontB64}); }
  body, body *, svg text { font-family: "FormBody", serif !important; letter-spacing: 0 !important; }` });
await page.evaluate(async () => { await document.fonts.load('16px "FormBody"', "가나다"); await document.fonts.ready; });
// 쪽 머리·꼬리 줄은 도표를 다시 흘리면 겹쳐 찍힐 수 있어 지운다
await page.evaluate(() => document.querySelectorAll(".run, .foot").forEach((e) => e.remove()));
await page.waitForTimeout(800);

const sizes = {};
for (const [name, sel, reflow, mm] of FIGS) {
  const loc = page.locator(sel).first();
  if (reflow) await loc.evaluate((el, w) => {
    el.style.width = w + "px"; el.style.marginTop = "0";
    for (const b of el.querySelectorAll(".big")) { b.style.whiteSpace = "nowrap"; if (b.textContent.startsWith("GPT")) b.style.fontSize = "30px"; }
  }, reflow);
  const box = await loc.boundingBox();
  const file = path.join(figDir, name + ".png");
  await loc.screenshot({ path: file });
  sizes[name] = { file, mm, h: Math.round((mm * box.height / box.width) * 10) / 10 };
}
await browser.close();

const { createRequire } = await import("node:module");
const require = createRequire(import.meta.url);
for (const [name, rel, mm] of SCREENS) {
  const src = path.join(repo, rel);
  const buf = fs.readFileSync(src);
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20); // PNG IHDR
  const file = path.join(figDir, name + ".png");
  fs.copyFileSync(src, file);
  sizes[name] = { file, mm, h: Math.round((mm * h / w) * 10) / 10 };
}

// ---- 칸마다 넣을 내용 ----
const H = (v) => ({ t: "h", v });            // 굵은 소제목 + 줄바꿈
const P = (v) => ({ t: "p", v });            // 문단 + 줄바꿈
const B = () => ({ t: "p", v: "" });          // 빈 줄
const I = (name) => ({ t: "img", path: sizes[name].file, w: sizes[name].mm, h: sizes[name].h });

// 본문 네 칸. AI 글투 점검 목록(03-AI-글투와-스킬.md §4)을 피해서 썼다:
// "A가 아닌 B"·"~대신" 대비, 연결어미 뒤 쉼표, 쉼표로 늘어놓기, 줄표 소제목, "~할 수 있다" 반복, 빈 강조,
// 그리고 "~로 정한다/확인한다"처럼 무엇을 하는지 안 보이는 말. 가능하면 숫자·예시·장면으로 쓴다.
// 칸마다 맨 앞과 맨 뒤에 빈 줄을 둬서 표 테두리에 글이 붙지 않게 한다.
const intro = [
  B(),
  H("■ 배경"),
  I("A-배경숫자"),
  P("· 외워서 풀고 찾아서 정리하는 일은 이제 기계가 사람보다 빨리 한다. 공인회계사 합격자 가운데 수습 자리를 구한 사람은 2022년 열 명 중 아홉에서 2025년 셋이 안 되게 줄었다. 가장 큰 회계법인 한 곳의 수습 회계사도 383명에서 260명이 됐다."),
  P("· 같은 AI를 줘도 결과는 사람마다 달랐다. 케냐에서 작은 가게를 하는 640명에게 다섯 달 동안 AI 사업 조언자를 붙여 준 실험이 있다(Otis 외, Management Science, 2026). 평균 매출과 이익은 그대로였고 원래 장사가 덜 되던 절반은 오히려 10% 가까이 떨어졌다. 두 집단이 AI에게 물은 것도 받은 조언도 비슷했다. 연구진은 여러 조언 중 무엇을 골라 실행했는지에서 차이가 났다고 본다."),
  I("B-케냐실험"),
  P("· 역사학자 유발 하라리는 올해 7월 대담에서 지능이 흔해지면 남는 병목은 “나는 무엇을 원하는가”라는 질문이라고 말했다."),
  P("· 우리는 이 질문의 답을 매일 적는 감정 기록에서 찾아보려 한다. 3주 동안 ‘답답한’을 다섯 번 골랐고 그때마다 이유 칸에 조별 과제가 적혀 있다면 내가 무엇을 버거워하는지 하나는 알게 된다. 아직 검증하지 않은 우리 가설이다."),
  B(),
  H("■ HON이 하는 일"),
  P("· 하루에 한 편씩 감정을 기록하는 앱이다. 오늘 있었던 일을 적고 마음에 가까운 감정을 고른 뒤 크기를 정하고 이유를 쓴다."),
  I("D-기록흐름"),
  P("· 한 번 기록하는 데 일곱 화면을 지난다. 칭찬과 감사 칸은 비워 둬도 된다."),
  P("· 고를 수 있는 감정은 9개 계열에 194개다. 여러 개를 같이 골라도 되고 크기는 1부터 10 사이에서 고르면 된다. 아래 막대 끝의 A~C는 그 계열의 근거가 된 정서 연구가 얼마나 탄탄한지 매긴 등급이다."),
  I("E-감정계열"),
  P("· 계열마다 친구 캐릭터가 하나씩 있다. 이름은 그 감정이 마음속에서 하는 일을 순우리말로 풀어 지었다. 슬픔 친구 ‘설이’는 ‘설움’에서, 분노 친구 ‘타온’은 ‘타오르다’에서 따왔다. 친구는 감정의 모양을 보여 줄 뿐 사용자를 평가하지 않는다."),
  P("· 기록을 마치면 달력의 그날 칸에 조약돌이 놓이고 누르면 그날 쓴 편지가 열린다. 통계 화면에서는 함께한 날이 많은 친구일수록 나와 가까운 자리에 서 있다."),
  I("F-돌아보기화면"),
  B(),
  H("■ 지금까지 만든 것"),
  I("G-지금숫자"),
  I("H-진행상황"),
  P("· 화면 시안은 10월에 다 그렸다. 실제 앱에서는 로그인과 앱 잠금, 오늘 기록 쓰기와 고치기가 되고 쓰던 글은 자동으로 저장된다. 기록 내보내기와 전체 삭제, 백업 복원, 위기 안내 화면도 들어가 있다."),
  I("I-지키는화면"),
  P("· 휴대폰 홈 화면에 깔아 쓰는 웹앱이다. 서버와 데이터베이스를 직접 짰고 지금은 무료 클라우드 범위 안에서 돌린다. 하루에 한 편만 남게 하는 규칙은 데이터베이스에 걸어 두어서 화면을 거치지 않는 요청도 막힌다."),
  P("· 다음 차례는 시안 화면을 실제 앱으로 옮기는 일이다. 달력과 통계와 돌아보기를 붙이고 나서 AI 보조를 넣을지 결정할 계획이다."),
  B(),
  H("■ 팀"),
  P("· 대표 노태경: 기획·디자인·개발"),
  P("· 팀원 김혜린: 리서치·기획·디자인")
];

const value = [
  B(),
  H("■ 풀려는 문제"),
  I("J-처음여는장면"),
  P("· 전공을 바꿀지, 어떤 동아리에 들어갈지 AI에게 물으면 장단점 표는 금방 나온다. 그중 무엇을 고를지는 내가 어떤 일에 지치고 어떤 일에 힘이 나는지 알아야 정해진다."),
  P("· 그런데 하루를 돌아볼 때 우리는 보통 ‘좋았다’나 ‘별로였다’ 정도로 끝낸다. 발표를 마치고 홀가분하면서도 이상하게 허전했던 마음은 따로 적어 두지 않으면 며칠 안에 잊힌다."),
  P("· 처음 쓸 사람으로 만 14세 이상 청소년과 청년을 본다. 청년 셋 중 한 명이 지난 1년 사이 번아웃을 겪었고 가장 많이 꼽은 이유는 진로불안이었다."),
  I("K1-청년통계"),
  I("K2-청소년통계"),
  P("· 이 숫자들이 자기이해 부족 때문이라는 근거는 없다. HON도 진단이나 치료를 하지 않는다."),
  B(),
  H("■ 다른 점 1. 심리학 연구로 한 단계씩 검토한 기록 흐름"),
  P("· 감정에 이름을 붙이기만 해도 그 순간의 반응이 누그러진다는 연구가 있다(Torre & Lieberman, 2018). 그래서 194개 단어 가운데 가장 가까운 말을 직접 고르게 했다."),
  P("· 같은 ‘왜’라도 자기 안에 파묻혀 물으면 괴로움이 커지고 한 걸음 떨어져서 물으면 줄어든다(Kross 외, 2005; Treynor 외, 2003). 이유 칸 질문을 “그 마음은 무엇에서 왔을까요?”로 바꾸고 “친구의 일기를 읽듯 적어 봐요”라는 안내를 단 까닭이다."),
  P("· 물어보는 칸이 많을수록 부담이 커지고 빼먹는 칸도 늘어난다(Eisele 외, 2022). 칭찬과 감사는 한 화면으로 합치고 선택으로 돌렸다."),
  P("· 감사 일기는 다른 활동과 견주면 효과가 줄거나 사라진다는 결과도 있다(Davis 외, 2016; Cregg & Cheavens, 2021). 그래서 필수로 두지 않았다. 근거가 약한 부분도 지우지 않고 적어 두었다."),
  B(),
  H("■ 다른 점 2. 근거를 밝혀 둔 한국어 감정 체계"),
  P("· 9개 계열은 계열마다 정서 연구 두 편 이상을 찾아보고 정했다(Shaver 외 1987, Keltner 외 2019, Panksepp 2010 등). 연구마다 결론이 다른 곳은 반대 근거까지 판정 표에 남겼다."),
  P("· 194개 단어에는 근거 등급을 하나씩 달아 공개했다. 미움 계열은 근거 등급이 C로 가장 낮은데 그대로 표시해 두었다. 이 분류는 일기를 쓰려고 만든 것이고 감정을 진단하는 데는 쓰지 않는다."),
  B(),
  H("■ 다른 점 3. AI는 나를 정의하지 않는다. 이해하도록 돕는다"),
  P("· AI는 사용자가 쓴 기록을 정리하고 예전 기록과 이어 준다. 이번 달 ‘허전한’을 네 번 골랐다면 그 네 날짜를 보여 주고 “이 흐름이 나에게도 맞나요?”라고 묻는다. 해석은 사용자 몫이다. 설계까지 마쳤고 구현은 다음 단계다."),
  I("L-AI원칙"),
  I("M-돌아보기"),
  B(),
  H("■ 일부러 넣지 않은 것"),
  I("N-넣지않은것")
];

const business = [
  B(),
  H("■ 시장"),
  P("· 감정·일기·심리 서비스 61개를 살펴보고 사람들이 무엇을 하려고 쓰는지에 따라 여섯 종류로 나눴다. 감정을 기록하는 기능 자체는 이미 흔하다. 하루콩과 Daylio는 탭 몇 번으로 기분을 남기고 달력으로 보여 준다. 심스페이스는 저장하자마자 AI가 답장을 쓴다. HON은 감정 이름과 이유까지 적게 하고 해석은 사용자에게 맡긴다."),
  I("O1-여섯갈래"),
  I("O2-위치지도"),
  P("· 지도 위 위치는 61개 서비스의 기능을 비교해 우리가 판단해서 찍었다(감정일기 통합 벤치마킹, 2026.9.24.)."),
  I("P-경쟁비교"),
  I("Q-세모델"),
  B(),
  H("■ 수익 모델"),
  P("· 사용자가 직접 쓰는 기록에는 서버 비용이 거의 들지 않는다. 돈이 드는 건 AI를 부를 때다. 그래서 기록은 계속 무료로 두고 AI가 들어가는 기능에만 요금을 매긴다."),
  I("R1-무료와구독"),
  I("R2-무료횟수"),
  P("· 그다음 상품으로 한 해 동안 쓴 편지와 조약돌을 책 한 권으로 묶어 연말에 보내 주는 걸 생각하고 있다. 1년에 한 번 받는 물건이라 매일 쓰라고 조를 필요가 없다."),
  P("· 광고는 붙이지 않고 데이터도 팔지 않는다. 감정 기록 옆에 광고가 뜨면 그 앱에 속마음을 적기 어렵다."),
  B(),
  H("■ 가격"),
  I("S-가격대"),
  P("· 2027년 1분기 사용자 연구 참가자 15~20명에게 돌아보기를 한 번 써 보게 한 다음 네 가지 가격을 묻는다. 너무 싸서 오히려 못 믿겠는 가격과 싸다고 느끼는 가격, 비싸도 살 만한 가격과 너무 비싸서 안 살 가격이다(반 베스텐도르프 가격 민감도 조사)."),
  P("· 네 답을 누적 그래프로 그리면 ‘너무 싸다’와 ‘너무 비싸다’ 선 사이에 받아들일 만한 가격대가 나온다. 표본이 작으니 그 범위 안에서 가격 두 개를 골라 시험 판매를 하고 실제 결제율을 비교한다."),
  P("· AI를 넣기로 하면 돌아보기 한 번에 드는 API 비용부터 잰다. 그 값이 가격의 바닥이 된다."),
  B(),
  H("■ 검증 계획"),
  P("· 수요가 있다는 증거는 아직 없다. 15~20명을 인터뷰하고 4주 동안 직접 기록해 보게 할 예정이다. 질문은 지난 경험을 묻는 식으로 하고 “이 앱 쓰겠어요?”는 묻지 않는다."),
  P("· 가장 먼저 보는 숫자는 첫 기록을 끝까지 쓴 사람 수와 7일째에 다시 들어온 사람 수다. 정신건강 앱은 30일 뒤에도 쓰는 사람이 중앙값 기준 열 명 중 한 명이 안 된다(Baumel 외, 2019)."),
  I("T-위험대응"),
  B(),
  H("■ 앞으로의 순서"),
  I("U-순서"),
  { t: "last", v: "· 지금 운영비는 0원이다(무료 클라우드 사용)." }
];

const effect = [
  I("V-흐름"),
  H("■ 사용자에게"),
  P("· 한 달 뒤 달력에서 조약돌을 누르면 그날 왜 속상했는지가 내 말로 적혀 있다."),
  P("· ‘뿌듯한’을 고른 날의 이유만 모아 보면 내가 어떤 일에서 힘을 얻는지 목록이 생긴다. 진로를 고를 때 꺼내 볼 수 있는 자료다."),
  B(),
  H("■ AI 서비스 설계에"),
  P("· AI가 “당신은 ~한 사람입니다”라고 말하지 못하도록 문장 규칙부터 정해 두었다. 사람의 최종 책임을 AI가 대신하면 안 된다는 UNESCO와 OECD의 AI 원칙을 실제 화면 문장으로 옮기는 사례가 된다."),
  B(),
  H("■ 한국어 감정 어휘에"),
  P("· 감정 단어 194개를 근거 등급과 함께 정리한 목록이 남는다. 근거가 약한 단어는 약하다고 적어 두었다."),
  B(),
  H("■ 약속하지 않는 것"),
  P("· 이 앱을 쓰면 정신건강이 좋아진다거나 진짜 나를 찾게 된다고 말하지 않는다. 글쓰기 효과를 모아 본 연구에서도 효과는 작았다(표현적 글쓰기 메타분석, 2023, 31개 실험 4,012명). HON이 하는 일은 하루의 마음을 돌아보게 돕는 데까지다."),
  B(),
  P("본문 괄호에 없는 출처: 파이낸셜뉴스(2026.11.9.) · 경향신문(2026.10.27.) · 택스워치(2026.9.21.) · VentureBeat(2026.9.3.) · 유발 하라리 대담 The next 50 years(2026.7.) · 국무조정실, 2024 청년의 삶 실태조사 · 질병관리청, 2025 청소년건강행태조사")
];

// 개인정보는 따로 둔 파일에서 읽는다(git에 올리지 않는다)
const info = JSON.parse(fs.readFileSync(path.join(dir, "개인정보.json"), "utf8"));
const [ME, MATE] = info.people;
const NAME = ME.name, MEMBER = MATE.name;
const ITEM = "HON(혼) — 감정에 이름을 붙이는 자기이해 기록 앱";
const src = path.join(dir, "..", "원본", "2026학년도 교내 창업아이디어 경진대회 참가 신청서 및 사업계획서.hwp");
const v = (val, cell) => (val ? [cell(val)] : []);
const memberCells = (p, downs) => {
  const down = Array(downs).fill("TableLowerCell");
  const L = (k) => Array(k).fill("TableLeftCell");
  return [
    ...v(p.phone, (x) => ({ find: "(휴대폰)", n: 1, moves: [...down], items: [{ t: "last", v: x }] })),
    ...v(p.id, (x) => ({ find: "(휴대폰)", n: 1, moves: [...down, ...L(1)], items: [{ t: "last", v: x }] })),
    ...v(p.grade, (x) => ({ find: "(휴대폰)", n: 1, moves: [...down, ...L(2)], items: [{ t: "last", v: x }] })),
    ...v(p.dept, (x) => ({ find: "(휴대폰)", n: 1, moves: [...down, ...L(3)], items: [{ t: "last", v: x }] })),
    ...v(p.email, (x) => ({ find: "(휴대폰)", n: 1, moves: [...down, "TableRightCell"], items: [{ t: "last", v: x }] }))
  ];
};
const plan = {
  src,
  // 제출 파일은 하나다. 같은 이름에 덮어쓴다(학교 양식을 복사해 채우므로 양식은 그대로다).
  out: path.join(dir, "2026학년도 교내 창업아이디어 경진대회 참가 신청서 및 사업계획서_HON.hwp"),
  pdf: path.join(dir, "참가신청서및사업계획서_HON_미리보기.pdf"),
  // 글자 바꾸기(문서 전체). 순서가 중요하다 — "총 (…)명"을 먼저 바꿔야 명단의 "(…)명"만 남는다.
  replace: [
    ["Yes □  No □", "Yes □  No ■"],
    ["총 (       )명", "총 (   2   )명"],
    ["남(    )명", "남(  1  )명"],
    ["여(    )명", "여(  1  )명"],
    ["(       )명", "(   2   )명"],
    ["4학년(    )명", "4학년(  2  )명"],
    ...(ME.dept ? [["            학과      학년", `${ME.dept}   ${ME.grade}학년`]] : [["학과      학년", `학과   ${ME.grade}학년`]]),
    ["년     월      일", `년  ${info.date.month} 월  ${info.date.day} 일`],
    ["대 표 자 :", "대 표 자 :  " + NAME]
  ],
  // 체크 칸: 이 글자가 있는 줄의 첫 글자(□)를 ■로 바꾼다
  check: ["기술창업"],
  // 칸 채우기: 글자를 찾고(n번째) 옮긴 뒤 넣는다
  cells: [
    { find: "팀명", n: 1, moves: ["TableRightCell"], items: [{ t: "last", v: "HON(혼)" }] },
    { find: "아이템명", n: 1, moves: ["TableRightCell"], items: [{ t: "last", v: ITEM }] },
    { find: "성 명", n: 1, moves: ["TableRightCell"], items: [{ t: "last", v: NAME }] },
    { find: "학 번", n: 1, moves: ["TableRightCell"], items: [{ t: "last", v: ME.id }] },
    { find: "전 화", n: 1, moves: ["TableRightCell"], items: [{ t: "last", v: ME.phone }] },
    ...v(ME.email, (x) => ({ find: "E-mail", n: 1, moves: ["TableRightCell"], items: [{ t: "last", v: x }] })),
    { find: "참가대회명", n: 1, moves: ["TableRightCell"], items: [{ t: "last", v: "해당 없음" }] },
    { find: "아이디어명", n: 1, moves: ["TableRightCell"], items: [{ t: "last", v: "-" }] },
    { find: "(휴대폰)", n: 1, moves: ["TableLowerCell", "TableLeftCell", "TableLeftCell", "TableLeftCell", "TableLeftCell"], items: [{ t: "last", v: NAME }] },
    { find: "(휴대폰)", n: 1, moves: ["TableLowerCell", "TableLowerCell", "TableLeftCell", "TableLeftCell", "TableLeftCell", "TableLeftCell"], items: [{ t: "last", v: MEMBER }] },
    ...memberCells(ME, 1),
    ...memberCells(MATE, 2),
    { find: "대표자(팀장)", n: 1, moves: ["TableRightCell", "TableRightCell"], items: [{ t: "last", v: NAME }] },
    { find: "대표자(팀장)", n: 1, moves: ["TableUpperCell", "TableRightCell", "TableRightCell"], items: [{ t: "last", v: "기술창업 (정보·통신)" }] },
    { find: "대표자(팀장)", n: 1, moves: ["TableUpperCell", "TableUpperCell", "TableRightCell", "TableRightCell"], items: [{ t: "last", v: ITEM }] },
    { find: "대표자(팀장)", n: 1, moves: ["TableUpperCell", "TableUpperCell", "TableUpperCell", "TableRightCell", "TableRightCell"], items: [{ t: "last", v: "HON(혼)" }] },
    { find: "아 이 템 명", n: 2, moves: ["TableRightCell"], items: [{ t: "last", v: ITEM }] },
    { find: "아이템의 소개", n: 1, moves: ["TableRightCell"], clear: true, items: intro },
    { find: "아이템의 가치", n: 1, moves: ["TableRightCell"], clear: true, items: value },
    { find: "아이템의 사업성", n: 1, moves: ["TableRightCell"], clear: true, items: business },
    { find: "아이템의 기대효과", n: 1, moves: ["TableRightCell"], clear: true, items: effect }
  ]
};
// 본문에 칸 이름이 다시 나오면 찾기가 엇나간다
const body = JSON.stringify([intro, value, business, effect]);
for (const k of ["아이템의 소개", "아이템의 가치", "아이템의 사업성", "아이템의 기대효과", "대표자(팀장)", "(휴대폰)"]) if (body.includes(k)) throw new Error("본문에 찾기 글자가 들어 있음: " + k);
fs.writeFileSync(path.join(dir, "양식-채우기.json"), JSON.stringify(plan, null, 1), "utf8");
for (const [k, v] of Object.entries(sizes)) console.log(k, v.mm + "x" + v.h + "mm");
