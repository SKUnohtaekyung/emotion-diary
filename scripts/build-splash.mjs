// 앱 시작 로딩 화면의 숲 그림(web/splash.svg)을 만든다(D-092 ④).
// 로딩 화면은 스크립트·값 파일(tokens.json)보다 먼저 그려져야 해서 CSS 변수를 쓸 수 없다 — 그래서 오늘 화면과 같은 숲(forest.js buildForest)을
// tokens.json의 색으로 굳혀 파일 하나로 둔다. 조약돌·가운데 돌은 넣지 않는다(돌은 index.html이 따로 놓고 숨 쉬게 한다).
// 사용: node scripts/build-splash.mjs          → web/splash.svg를 다시 쓴다
//       node scripts/build-splash.mjs --check  → 지금 파일이 숲·토큰과 같은지만 본다(다르면 실패, verify가 부른다)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "web/splash.svg");
const { buildForest } = await import(new URL("../web/js/components/forest.js", import.meta.url));
const tokens = JSON.parse(fs.readFileSync(path.join(root, "design/tokens.json"), "utf8"));
const forest = Object.fromEntries(Object.entries(tokens.color.forest).filter(([, v]) => v?.light).map(([k, v]) => [k, v.light.toUpperCase()]));
const mint = tokens.color.service.mint.light, white = tokens.color.neutral.bg.light;

// CSS color-mix(in srgb, a p%, b)와 같은 값(감마 인코딩된 채널을 그대로 섞는다)
const mix = (a, b, p) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * p + parseInt(b.slice(i, i + 2), 16) * (1 - p)).toString(16).padStart(2, "0")).join("").toUpperCase();

// scene.css의 숲 규칙을 값으로 옮긴 것(별·반딧불은 움직이지 않는 한 장이라 중간 밝기로 둔다).
// 섞는 비율·선 굵기는 손으로 옮겨 적었다 — scene.css의 .f-* 규칙을 고치면 여기도 같이 고친다(--check는 forest.js·tokens.json의 변화만 잡는다).
const css = [
  `.f-sky{fill:${forest.sky}}`,
  ...["far", "mid"].map((k) => `.f-tree-${k} *{fill:${forest[`tree-${k}`]};stroke:${forest[`tree-${k}`]};stroke-width:3;stroke-linejoin:round}`),
  ...["near", "edge"].map((k) => `.f-tree-${k} *{fill:${forest[`tree-${k}`]};stroke:${forest[`tree-${k}`]};stroke-width:4;stroke-linejoin:round}`),
  `.f-ground-far{fill:${forest["ground-far"]}}`, `.f-ground-mid{fill:${forest["ground-mid"]}}`,
  `.f-pl-a{fill:${mix(forest["tree-mid"], mint, 0.76)}}`, `.f-pl-b{fill:${mix(forest["tree-mid"], mint, 0.62)}}`, `.f-pl-c{fill:${mix(forest["tree-mid"], mint, 0.5)}}`,
  `.f-near.f-pl-a{fill:${mix(forest["tree-edge"], mint, 0.82)}}`, `.f-near.f-pl-b{fill:${mix(forest["tree-edge"], mint, 0.7)}}`, `.f-fore.f-pl-a{fill:${mix(forest["tree-mid"], mint, 0.7)}}`,
  `.f-star{fill:${white};opacity:.7}`, `.f-fly{fill:${mint};opacity:.4}`
].join("");

const built = buildForest();
// 겹 순서는 forest.js의 LAYER_Z와 같다(먼 숲 → 먼 풀 → 가운데 숲 → 가운데 풀 → 가까운 숲 → 가까운 풀). 조약돌 자리는 비운다.
const layers = [0, 1, 2].flatMap((band) => [built.art[band], built.fore[band]])
  .map((s) => s.replace(/var\(--forest-([a-z-]+)\)/g, (_, k) => forest[k]));
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 744" preserveAspectRatio="xMidYMax slice">` +
  `<!-- 생성 파일: node scripts/build-splash.mjs (손으로 고치지 않는다) --><style>${css}</style>${layers.join("")}</svg>\n`;

if (process.argv.includes("--check")) {
  // Windows checkout(core.autocrlf)이 줄 끝을 CRLF로 바꿀 수 있어 줄 끝은 빼고 비교한다
  const now = fs.existsSync(out) ? fs.readFileSync(out, "utf8").replace(/\r\n/g, "\n") : "";
  if (now !== svg) { console.error("FAIL web/splash.svg가 숲(forest.js)·토큰과 다르다 — node scripts/build-splash.mjs로 다시 만든다"); process.exit(1); }
  console.log("PASS web/splash.svg");
} else {
  fs.writeFileSync(out, svg);
  console.log(`web/splash.svg ${(svg.length / 1024).toFixed(1)}KB`);
}
