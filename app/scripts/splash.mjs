// 빈 숲 그림(D-092 ④, TASK-JOURNAL-01 J-8 PLAN A-8). 오늘 화면의 숲(ui/forestArt.ts)과 같은 계산으로 굳힌 정적 SVG다.
// 2026-11-18 로딩 화면은 남색 + 평면 조약돌로 바뀌었고(D-134), 이 그림은 덮개(ui/cover.ts)와 잠금 장면(ui/scene.ts)이 쓴다.
// 스크립트·CSS 값 파일보다 먼저 그려져야 해서 색은 design/tokens.json에서 읽어 fill 속성으로 넣는다(<style>·style 속성 없음 — CSP·iOS 미확인).
// 조약돌·가운데 돌은 넣지 않는다. 시안 scripts/build-splash.mjs와 같은 자리.
//   node app/scripts/splash.mjs   → app/client/public/splash.svg
// 시험(app/test/client/splash.test.ts)이 커밋된 파일이 지금 계산과 같은지 본다 — 숲이나 색을 바꾸면 이 스크립트를 다시 돌린다.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildForest, H, W } from "../client/src/ui/forestArt.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const tokens = JSON.parse(readFileSync(path.join(root, "design", "tokens.json"), "utf8"));
const forest = Object.fromEntries(Object.entries(tokens.color.forest).map(([key, value]) => [key, value.light]));
const mint = tokens.color.service.mint.light;
const bg = tokens.color.neutral.bg.light;

/** color-mix(in srgb, a p%, b) — forest.css의 식물 색과 같은 섞음 */
function mix(a, p, b) {
  const rgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
  const [x, y] = [rgb(a), rgb(b)];
  return `#${x.map((v, i) => Math.round(v * (p / 100) + (y[i] ?? 0) * (1 - p / 100)).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

const f = (n) => n.toFixed(1);
const trees = (list, color, width) =>
  `<g fill="${color}" stroke="${color}" stroke-width="${width}" stroke-linejoin="round">${list
    .map((tree) =>
      "pine" in tree
        ? `<path d="${tree.pine}"/>`
        : `<rect x="${f(tree.rect[0])}" y="${f(tree.rect[1])}" width="${f(tree.rect[2])}" height="${f(tree.rect[3])}"/>${tree.circles.map(([cx, cy, r]) => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}"/>`).join("")}`
    )
    .join("")}</g>`;
const plants = (acc, near = false, fore = false) => {
  const base = near ? forest["tree-edge"] : forest["tree-mid"];
  const a = fore ? mix(forest["tree-mid"], 70, mint) : near ? mix(base, 82, mint) : mix(base, 76, mint);
  const b = near ? mix(base, 70, mint) : mix(forest["tree-mid"], 62, mint);
  const c = mix(forest["tree-mid"], 50, mint);
  return `<path fill="${a}" d="${acc.a}"/><path fill="${b}" d="${acc.b}"/><path fill="${c}" d="${acc.c}"/>`;
};

export function splashSvg() {
  const art = buildForest();
  const grad = (id) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${forest["path-far"]}"/><stop offset="1" stop-color="${forest["path-near"]}"/></linearGradient>`;
  const stars = art.stars.map((d) => `<circle fill="${bg}" opacity="0.7" cx="${f(d.cx)}" cy="${f(d.cy)}" r="${f(d.r)}"/>`).join("");
  const flies = art.flies.map((d) => `<circle fill="${mint}" opacity="0.55" cx="${f(d.cx)}" cy="${f(d.cy)}" r="${f(d.r)}"/>`).join("");
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">`,
    `<defs>${grad("sp-far")}${grad("sp-mid")}<clipPath id="sp-ground-mid"><path d="${art.groundMid}"/></clipPath></defs>`,
    `<rect fill="${forest.sky}" width="${W}" height="${H}"/>${stars}`,
    trees(art.far, forest["tree-far"], 3),
    `<path fill="${forest["ground-far"]}" d="${art.groundFar}"/>${plants(art.plants[0])}<path d="${art.road}" fill="url(#sp-far)"/>`,
    trees(art.farEnd.map((d) => ({ pine: d })), forest["tree-far"], 3),
    trees(art.mid, forest["tree-mid"], 3),
    `<path fill="${forest["ground-mid"]}" d="${art.groundMid}"/><path d="${art.road}" fill="url(#sp-mid)" clip-path="url(#sp-ground-mid)"/>${plants(art.plants[1])}`,
    plants(art.fore[0], false, true),
    plants(art.fore[1], false, true),
    trees(art.near.map((d) => ({ pine: d })), forest["tree-near"], 4),
    trees(art.edge.map((d) => ({ pine: d })), forest["tree-edge"], 4),
    plants(art.plants[2], true),
    plants(art.fore[2], false, true),
    flies,
    "</svg>",
    ""
  ].join("\n");
}

export const SPLASH_FILE = path.join(root, "app", "client", "public", "splash.svg");

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  writeFileSync(SPLASH_FILE, splashSvg());
  console.info("만듦: app/client/public/splash.svg");
}
