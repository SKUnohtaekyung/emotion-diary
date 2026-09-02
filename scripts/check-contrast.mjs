// design/tokens.json의 색 조합이 WCAG 대비 기준을 만족하는지 검사한다(DESIGN_SYSTEM §8).
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

let failed = 0;
for (const c of checks) {
  const ratio = contrast(c.fg, c.bg);
  const ok = ratio >= c.min;
  if (!ok) failed += 1;
  if (!ok || process.argv.includes("--verbose")) console.log(`${ok ? "PASS" : "FAIL"} ${c.name}: ${ratio.toFixed(2)} (min ${c.min})`);
}
if (failed) { console.error(`FAIL: 대비 검사 ${failed}/${checks.length} 실패`); process.exit(1); }
console.log(`PASS: 대비 검사 ${checks.length}건 통과`);
