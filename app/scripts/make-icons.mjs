// 앱 아이콘(D-134 — T3 A-12의 '숲 색 바탕 + 민트 돌 하나'를 바꿨다). 로고가 정해지지 않아(D-058) 로딩 화면(D-134)과 같은 조약돌을 쓴다:
// 흰 바탕에 오늘 화면 돌의 실루엣을 딴 '겹친 두 돌' — 앞 돌은 민트, 뒤 돌은 민트를 짙은 남청(service.ink)에 55% 섞은 청록(흰 바탕에서도 두 돌이 또렷하게).
// 실루엣은 시안 web/splash-pebbles.svg의 pb-all·pb-front를 그대로 읽는다(로딩 화면 app/client/index.html과 같은 원본). 색은 design/tokens.json에서 읽는다.
// 결과 PNG는 app/client/public/icons/에 커밋한다 — 로고가 정해지면 이 스크립트와 함께 바꾼다.
//   node app/scripts/make-icons.mjs
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const tokens = JSON.parse(readFileSync(path.join(root, "design", "tokens.json"), "utf8"));
const white = tokens.color.neutral.bg.light;
const mint = tokens.color.service.mint.light;
const ink = tokens.color.service.ink.light;
const out = path.join(root, "app", "client", "public", "icons");
mkdirSync(out, { recursive: true });

/** color-mix(in srgb, a p%, b) */
export function mix(a, p, b) {
  const rgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
  const [x, y] = [rgb(a), rgb(b)];
  return `#${x.map((v, i) => Math.round(v * (p / 100) + (y[i] ?? 0) * (1 - p / 100)).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

const pebbles = readFileSync(path.join(root, "web", "splash-pebbles.svg"), "utf8");
const pathOf = (id) => {
  const d = new RegExp(`id="${id}" d="([^"]+)"`).exec(pebbles)?.[1];
  if (!d) throw new Error(`web/splash-pebbles.svg에 ${id}가 없다`);
  return d;
};

/** 아이콘 SVG(512 정사각형). iOS가 모서리를 스스로 둥글게 깎으므로 바탕은 정사각형 그대로다. 돌(132×107)은 폭 300으로 가운데에서 살짝 아래. */
export function iconSvg() {
  const scale = 300 / 132;
  const tx = (256 - 66 * scale).toFixed(1);
  const ty = (262 - 53.5 * scale).toFixed(1);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${white}"/>
  <g transform="translate(${tx} ${ty}) scale(${scale.toFixed(4)})">
    <path d="${pathOf("pb-all")}" fill="${mix(mint, 55, ink)}"/>
    <path d="${pathOf("pb-front")}" fill="${mint}"/>
  </g>
</svg>`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const svg = iconSvg();
  for (const [name, size] of [["apple-touch-icon.png", 180], ["icon-192.png", 192], ["icon-512.png", 512]]) {
    await sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toFile(path.join(out, name));
    console.info(`만듦: app/client/public/icons/${name} (${size}px)`);
  }
}
