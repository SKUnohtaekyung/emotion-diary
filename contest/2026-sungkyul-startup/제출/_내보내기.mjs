// 사업계획서.html → 사업계획서.pdf. 쪽마다 넘침을 재고 검수용 캡처를 남긴다.
// 실행: 저장소 루트에서  node "contest/2026-sungkyul-startup/제출/_내보내기.mjs" [캡처를 둘 폴더]
import { chromium } from "@playwright/test";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const shots = process.argv[2];
if (shots) fs.mkdirSync(shots, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 860, height: 1200 }, deviceScaleFactor: shots ? 1 : 2 });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("requestfailed", (r) => errors.push("못 읽음 " + r.url()));
await page.goto(pathToFileURL(path.join(dir, "사업계획서.html")).href);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);

const rooms = await page.evaluate(() => [...document.querySelectorAll(".page")].map((el, i) => {
  const top = el.getBoundingClientRect().top;
  const foot = el.querySelector(".foot");
  const limit = foot ? foot.getBoundingClientRect().top - top : 1123;
  let bottom = 0;
  for (const c of el.querySelectorAll(":scope > *:not(.foot):not(.hero)")) bottom = Math.max(bottom, c.getBoundingClientRect().bottom - top);
  return `${i + 1}쪽 여유 ${Math.round(limit - bottom)}px`;
}));
console.log(rooms.join(" | "));
if (errors.length) console.log("오류:", errors.slice(0, 5));

if (shots) {
  const pages = await page.locator(".page").all();
  for (let i = 0; i < pages.length; i++) await pages[i].screenshot({ path: path.join(shots, `p${String(i + 1).padStart(2, "0")}.png`) });
}
await page.pdf({ path: path.join(dir, "사업계획서.pdf"), format: "A4", printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
await browser.close();
console.log("PDF", Math.round(fs.statSync(path.join(dir, "사업계획서.pdf")).size / 1024), "KB");
