// 임시 앱 아이콘(T3 A-12). 로고가 정해지지 않아(D-058) 숲 색 바탕에 민트 돌 하나만 그린다.
// 색은 design/tokens.json에서 읽는다. 결과 PNG는 app/client/public/icons/에 커밋한다 — 로고가 정해지면 이 스크립트와 함께 바꾼다.
//   node app/scripts/make-icons.mjs
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const tokens = JSON.parse(readFileSync(path.join(root, "design", "tokens.json"), "utf8"));
const sky = tokens.color.forest.sky.light;
const mint = tokens.color.service.mint.light;
const out = path.join(root, "app", "client", "public", "icons");
mkdirSync(out, { recursive: true });

// iOS가 모서리를 스스로 둥글게 깎으므로 바탕은 정사각형 그대로다. 돌은 가운데에서 살짝 아래, 조금 비뚤게(조약돌 느낌).
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${sky}"/>
  <path d="M256 168c74 0 132 40 132 104 0 66-60 108-136 108s-128-40-128-102c0-66 58-110 132-110z" fill="${mint}"/>
</svg>`;

for (const [name, size] of [["apple-touch-icon.png", 180], ["icon-192.png", 192], ["icon-512.png", 512]]) {
  await sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toFile(path.join(out, name));
  console.info(`만듦: app/client/public/icons/${name} (${size}px)`);
}
