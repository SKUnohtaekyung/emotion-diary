// design/tokens.json의 색 조합이 WCAG 대비 기준(DESIGN_SYSTEM §9)과
// 감정 계열 간 색차 ΔE 기준(DESIGN_SYSTEM §3.2)을 만족하는지 검사한다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tokens = JSON.parse(fs.readFileSync(path.join(root, "design/tokens.json"), "utf8"));

function luminance(hex) {
  const [r, g, b] = hex.replace("#", "").match(/.{2}/g).map((h) => parseInt(h, 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const checks = [];
const n = tokens.color.neutral;
const s = tokens.color.semantic;
const service = tokens.color.service;
if (service) {
  checks.push({ name: "service navigation: white icon on ink", fg: n.bg.light, bg: service.ink.light, min: 3 });
  checks.push({ name: "service navigation: ink icon on mint selection", fg: service.ink.light, bg: service.mint.light, min: 3 });
  checks.push({ name: "service button: white label on ink (text, D-054)", fg: n.bg.light, bg: service.ink.light, min: 4.5 });
  checks.push({ name: "service light on ink stage (D-055)", fg: service.light.light, bg: service.ink.light, min: 7 });
}
// 오늘 화면의 어두운 숲(D-062): 큰 질문·안내 글자(흰색)와 날짜 줄(날짜·'지난 기록' 입구)이 숲 위에서 읽혀야 한다. 하단 탐색은 없다(D-076 — 예전의 유리 탐색 아이콘 검사는 뺐다).
const forest = tokens.color.forest;
const mixHex = (a, b, t) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, "0")).join("").toUpperCase();
if (forest) {
  checks.push({ name: "forest hero: white on sky (text, D-062)", fg: n.bg.light, bg: forest.sky.light, min: 7 });
  checks.push({ name: "forest caption: white on path-near (text, D-062)", fg: n.bg.light, bg: forest["path-near"].light, min: 4.5 });
  // 날짜는 흰색 78%(scene.css의 color-mix)이고 하늘 위에 앉는다(D-076). 본문 글자라 4.5:1.
  checks.push({ name: "forest date row: white 78% date on sky (text, D-076)", fg: mixHex(forest.sky.light, n.bg.light, 0.78), bg: forest.sky.light, min: 4.5 });
  // '지난 기록' 입구는 하늘에 흰색 11%를 섞은 납작한 알약 위의 흰 글자·아이콘이다(D-090 ③). 호버(16%)는 대비가 더 낮아 그 값으로 잰다.
  checks.push({ name: "forest past-records pill: white label on sky + white 16% (text, D-090)", fg: n.bg.light, bg: mixHex(forest.sky.light, n.bg.light, 0.16), min: 4.5 });
}
// 편지(D-063): 종이·봉투·칭찬 카드 위 글자. 봉투의 '나에게'는 ink를 78%로 얹은 색이다.
const paper = tokens.color.paper;
if (paper && service) {
  checks.push({ name: "letter paper: text on paper (D-063)", fg: n.text.light, bg: paper.paper.light, min: 4.5 });
  checks.push({ name: "letter paper: paper-ink label on paper (D-063)", fg: paper["paper-ink"].light, bg: paper.paper.light, min: 4.5 });
  checks.push({ name: "letter praise: text on service light (D-063)", fg: n.text.light, bg: service.light.light, min: 4.5 });
  checks.push({ name: "letter praise: paper-ink label on service light (D-063)", fg: paper["paper-ink"].light, bg: service.light.light, min: 4.5 });
  checks.push({ name: "reason note: text-muted placeholder on paper (D-069)", fg: n["text-muted"].light, bg: paper.paper.light, min: 4.5 });
  checks.push({ name: "reason note: danger error on paper (D-069)", fg: s.danger.light, bg: paper.paper.light, min: 4.5 });
  checks.push({ name: "letter envelope: ink 78% label on envelope-body (D-063)", fg: mixHex(paper["envelope-body"].light, service.ink.light, 0.78), bg: paper["envelope-body"].light, min: 4.5 });
}
// 완료·온보딩의 색 언덕(D-061): 언덕 위에는 ink 글자(아래 버튼 줄의 '달력 보기')만 올린다. 흰 글자는 올리지 않는다.
const land = tokens.color.land;
if (land && service) {
  for (const hill of ["hill-far", "hill-mid", "hill-near"]) checks.push({ name: `land: ink text on ${hill} (D-061)`, fg: service.ink.light, bg: land[hill].light, min: 4.5 });
  // 마음 고르기(D-066): 초록 하늘 위 본문 글자와 오류 문구. danger 원색은 4.38:1이라 ink를 25% 섞은 색을 쓴다(write.css `.screen.pick .field-error`).
  checks.push({ name: "land meadow: text on sky hill-far (D-066)", fg: n.text.light, bg: land["hill-far"].light, min: 4.5 });
  checks.push({ name: "land meadow error: danger+ink 25% on sky hill-far (D-066)", fg: mixHex(s.danger.light, service.ink.light, 0.25), bg: land["hill-far"].light, min: 4.5 });
  checks.push({ name: "land meadow: ink text on middle hill mix (D-066)", fg: service.ink.light, bg: mixHex(land["hill-mid"].light, land["hill-near"].light, 0.55), min: 4.5 });
  // 편지 책상(D-069): 옅은 민트 면 — 뒤쪽은 hill-far 88%+흰색 12%, 앞쪽(페이저·버튼 줄)은 흰색 80%+hill-far 20%(letter-scene.css의 --lt-desk-mid·--lt-desk-front). 캡션(ink)과 안 켜진 페이저 점(ink 50%)이 읽혀야 한다.
  const deskMid = mixHex(land["hill-far"].light, n.bg.light, 0.12), deskFront = mixHex(n.bg.light, land["hill-far"].light, 0.2);
  checks.push({ name: "letter desk: ink caption on desk (D-069)", fg: service.ink.light, bg: deskMid, min: 4.5 });
  checks.push({ name: "letter desk: idle pager dot (ink 50%) on desk (non-text, D-069)", fg: mixHex(deskMid, service.ink.light, 0.5), bg: deskMid, min: 3 });
  checks.push({ name: "letter desk: idle pager dot (ink 50%) on desk front (non-text, D-069)", fg: mixHex(deskFront, service.ink.light, 0.5), bg: deskFront, min: 3 });
}
for (const mode of ["light", "dark"]) {
  checks.push({ name: `${mode} text on bg`, fg: n.text[mode], bg: n.bg[mode], min: 4.5 });
  checks.push({ name: `${mode} text on surface`, fg: n.text[mode], bg: n.surface[mode], min: 4.5 });
  checks.push({ name: `${mode} text-muted on bg`, fg: n["text-muted"][mode], bg: n.bg[mode], min: 4.5 });
  checks.push({ name: `${mode} text-subtle on bg (caption)`, fg: n["text-subtle"][mode], bg: n.bg[mode], min: 4.5 });
  checks.push({ name: `${mode} focus ring on bg (non-text)`, fg: n.focus[mode], bg: n.bg[mode], min: 3 });
  for (const [k, v] of Object.entries(s)) checks.push({ name: `${mode} semantic ${k} text on bg`, fg: v[mode], bg: n.bg[mode], min: 4.5 });
  for (const [key, fam] of Object.entries(tokens.color.emotion)) {
    const fill = mode === "light" ? fam["100"] : fam["900"];
    const text = mode === "light" ? fam["900"] : fam["100"];
    const override = tokens.color["emotion-usage"]["accent-override"]?.[key]?.[mode];
    const accent = override ? fam[override] : (mode === "light" ? fam["500"] : fam["300"]);
    checks.push({ name: `${mode} chip ${key}: text on fill`, fg: text, bg: fill, min: 4.5 });
    checks.push({ name: `${mode} chip ${key}: border/accent on bg (non-text)`, fg: accent, bg: n.bg[mode], min: 3 });
    checks.push({ name: `${mode} text on soft ${key} 50/900`, fg: n.text[mode], bg: mode === "light" ? fam["50"] : fam["900"], min: 4.5 });
    if (mode === "light") {
      // 감정 테마 면(D-053): 계열 300 위에 중립 글자와 ink 채움 버튼이 읽혀야 한다. 흰 글자는 9계열 모두 미달이라 쓰지 않는다.
      checks.push({ name: `light text on theme field ${key} 300`, fg: n.text[mode], bg: fam["300"], min: 4.5 });
      // 세부 감정 화면(D-071): 배경은 100 60% + 50 40%, pill은 300 45% + 흰색. 그 위 글자.
      const tintBg = mixHex(fam["100"], fam["50"], 0.4), pillBg = mixHex(fam["300"], n.bg.light, 0.55);
      checks.push({ name: `light ink text on detail tint ${key} (D-071)`, fg: service ? service.ink.light : n.text[mode], bg: tintBg, min: 4.5 });
      checks.push({ name: `light ink text on detail pill ${key} (D-071)`, fg: service ? service.ink.light : n.text[mode], bg: pillBg, min: 4.5 });
      if (service) {
        checks.push({ name: `light ink text on theme field ${key} 300`, fg: service.ink.light, bg: fam["300"], min: 4.5 });
        checks.push({ name: `light ink button edge on theme field ${key} 300 (non-text)`, fg: service.ink.light, bg: fam["300"], min: 3 });
      }
    }
  }
}

// --- 감정 계열 간 색차(CIEDE2000) ---
// 같은 표기의 세부 감정을 카테고리 색으로 구분해야 하므로(D-022) 어떤 두 계열도
// 같은 자리에 쓰이는 단계에서 구별되어야 한다. 기준 ΔE >= 7 (D-034).
const MIN_DELTA_E = 7;
function lab(hex) {
  const [r, g, b] = hex.replace("#", "").match(/.{2}/g).map((h) => parseInt(h, 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (v) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
function deltaE2000(hexA, hexB) {
  const [L1, a1, b1] = lab(hexA), [L2, a2, b2] = lab(hexB);
  const Cb = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const A1 = (1 + G) * a1, A2 = (1 + G) * a2;
  const C1 = Math.hypot(A1, b1), C2 = Math.hypot(A2, b2);
  const hue = (b, a) => (b === 0 && a === 0 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360);
  const h1 = hue(b1, A1), h2 = hue(b2, A2);
  const dL = L2 - L1, dC = C2 - C1;
  let dh = 0;
  if (C1 * C2 !== 0) { dh = h2 - h1; if (dh > 180) dh -= 360; else if (dh < -180) dh += 360; }
  const dH = 2 * Math.sqrt(C1 * C2) * Math.sin((dh * Math.PI) / 360);
  const Lb = (L1 + L2) / 2, Cbp = (C1 + C2) / 2;
  let hb;
  if (C1 * C2 === 0) hb = h1 + h2;
  else { hb = (h1 + h2) / 2; if (Math.abs(h1 - h2) > 180) hb += h1 + h2 < 360 ? 180 : -180; }
  const T = 1 - 0.17 * Math.cos(((hb - 30) * Math.PI) / 180) + 0.24 * Math.cos((2 * hb * Math.PI) / 180) + 0.32 * Math.cos(((3 * hb + 6) * Math.PI) / 180) - 0.2 * Math.cos(((4 * hb - 63) * Math.PI) / 180);
  const Sl = 1 + (0.015 * (Lb - 50) ** 2) / Math.sqrt(20 + (Lb - 50) ** 2);
  const Sc = 1 + 0.045 * Cbp, Sh = 1 + 0.015 * Cbp * T;
  const Rt = -2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7)) * Math.sin((60 * Math.exp(-(((hb - 275) / 25) ** 2)) * Math.PI) / 180);
  return Math.sqrt((dL / Sl) ** 2 + (dC / Sc) ** 2 + (dH / Sh) ** 2 + Rt * (dC / Sc) * (dH / Sh));
}
const usage = tokens.color["emotion-usage"];
const step = (fam, key, role, mode) => {
  const override = usage["accent-override"]?.[key]?.[mode];
  if (role === "category-accent" && override) return fam[override];
  return fam[usage[role][mode]];
};
const slots = [
  ["light chip fill", "chip-fill", "light"], ["light chip text", "chip-text", "light"],
  ["light 강조", "category-accent", "light"], ["dark 강조", "category-accent", "dark"],
];
const families = Object.entries(tokens.color.emotion);
for (const [slotName, role, mode] of slots) {
  for (let i = 0; i < families.length; i += 1) {
    for (let j = i + 1; j < families.length; j += 1) {
      const [ka, fa] = families[i], [kb, fb] = families[j];
      checks.push({
        name: `${slotName}: ${fa.label} vs ${fb.label} 색차`,
        deltaE: deltaE2000(step(fa, ka, role, mode), step(fb, kb, role, mode)),
        min: MIN_DELTA_E,
      });
    }
  }
}

// 서비스 색은 어떤 감정 색 단계와도 구별돼야 한다(D-054). 감정 색과 같아 보이면 "서비스가 감정을 말한다"로 읽힌다.
// mint는 밝은 단계(100·300·500)와, ink는 어두운 단계(700·900)와 견준다 — 실제로 나란히 놓이는 단계들이다.
if (service) {
  for (const [name, color, stepNames] of [["mint", service.mint.light, ["100", "300", "500"]], ["ink", service.ink.light, ["700", "900"]]]) {
    for (const [, fam] of families) {
      for (const stepName of stepNames) {
        checks.push({ name: `service ${name} vs ${fam.label} ${stepName} 색차`, deltaE: deltaE2000(color, fam[stepName]), min: MIN_DELTA_E });
      }
    }
  }
}

// 밤하늘(D-077·D-084 한 색): 하늘이 감정 색으로 읽히지 않아야 한다 — 짙은 남색은 미움(짙은 남색·보라)과 가깝다. 하늘은 어두운 단계(700·900)와 견준다.
// 하늘이 숲에 묻혀 초록으로 보이던 문제(하늘-나무 ΔE 1~3)를 되풀이하지 않도록 하늘 가운데와 먼 나무의 색차도 10 이상을 요구한다.
if (forest) {
  for (const [, fam] of Object.entries(tokens.color.emotion)) for (const stepName of ["700", "900"]) checks.push({ name: `forest sky vs ${fam.label} ${stepName} 색차 (D-077·D-084)`, deltaE: deltaE2000(forest.sky.light, fam[stepName]), min: MIN_DELTA_E });
  checks.push({ name: "forest sky vs tree-far 색차 — 하늘과 숲 층 구분 (D-077)", deltaE: deltaE2000(forest.sky.light, forest["tree-far"].light), min: 10 });
}

let failed = 0;
for (const c of checks) {
  const value = c.deltaE ?? contrast(c.fg, c.bg);
  const ok = value >= c.min;
  if (!ok) failed += 1;
  if (!ok || process.argv.includes("--verbose")) console.log(`${ok ? "PASS" : "FAIL"} ${c.name}: ${value.toFixed(2)} (min ${c.min})`);
}
if (failed) { console.error(`FAIL: 색 검사 ${failed}/${checks.length} 실패`); process.exit(1); }
console.log(`PASS: 색 검사 ${checks.length}건 통과 (대비 + 계열 색차)`);
