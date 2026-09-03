// design/tokens.json의 색 조합이 WCAG 대비 기준(DESIGN_SYSTEM §8)과
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

let failed = 0;
for (const c of checks) {
  const value = c.deltaE ?? contrast(c.fg, c.bg);
  const ok = value >= c.min;
  if (!ok) failed += 1;
  if (!ok || process.argv.includes("--verbose")) console.log(`${ok ? "PASS" : "FAIL"} ${c.name}: ${value.toFixed(2)} (min ${c.min})`);
}
if (failed) { console.error(`FAIL: 색 검사 ${failed}/${checks.length} 실패`); process.exit(1); }
console.log(`PASS: 색 검사 ${checks.length}건 통과 (대비 + 계열 색차)`);
