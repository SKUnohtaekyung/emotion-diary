// 오늘 화면의 어두운 숲 — 모양 계산만(DOM 없음). 시안 web/js/components/forest.js buildForest를 옮겼다(TASK-JOURNAL-01 J-7, PLAN A-8).
// 같은 씨앗이면 언제나 같은 숲이다. 그리기는 ui/Forest.tsx(Preact SVG — style 속성·innerHTML 없이, CSP)가 하고,
// 로딩 화면의 정적 숲(J-8)도 이 계산을 그대로 쓴다. 조약돌 크기는 깊이일 뿐 감정의 무게가 아니다(D-050·D-067).

export const W = 360;
export const H = 744;

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n: number) => n.toFixed(1);

/** 층이 보이는 소나무 — trunk는 맨 아래 가지 밑 줄기의 높이 비율(가장자리 큰 소나무는 가지를 올려 발치가 보인다, D-084) */
export function pine(cx: number, by: number, h: number, w: number, tiers: number, trunk = 0.09): string {
  const tw = w * 0.12;
  const th = h * trunk;
  const top = by - h;
  const step = (h - th) / (tiers * 0.92 + 0.63);
  let d = `M${f(cx - tw / 2)} ${f(by)}h${f(tw)}v${f(-th)}h${f(-tw)}Z`;
  for (let k = 0; k < tiers; k += 1) {
    const y0 = top + k * step * 0.92;
    const y1 = y0 + step * 1.55;
    const half = (w / 2) * (0.32 + (0.68 * (k + 1)) / tiers);
    d += `M${f(cx)} ${f(y0)}L${f(cx + half)} ${f(y1)}L${f(cx)} ${f(y1 - step * 0.32)}L${f(cx - half)} ${f(y1)}Z`;
  }
  return d;
}

export type Tree = { pine: string } | { rect: [number, number, number, number]; circles: [number, number, number][] };

function roundTree(cx: number, by: number, h: number, w: number): Tree {
  const tw = w * 0.15;
  const th = h * 0.34;
  const r = w * 0.36;
  const cy = by - th - h * 0.2;
  const circles: [number, number, number][] = [
    [0, 0, r],
    [-w * 0.26, h * 0.1, r * 0.78],
    [w * 0.26, h * 0.12, r * 0.74],
    [w * 0.06, -h * 0.2, r * 0.7]
  ].map(([dx, dy, rr]) => [cx + (dx as number), cy + (dy as number), rr as number]);
  return { rect: [cx - tw / 2, by - th, tw, th + 2], circles };
}

// 길: 아래에서 위로 좁아지며 가운데를 지난다. 위 끝 350은 먼 땅의 선에서 멈춘다(하늘로 솟아 보이지 않게, D-084)
const PATH = { y0: 744, y1: 350, cx0: 180, amp: 40, w0: 280, decay: 0.5, turns: 2.3 };
const pathHalf = (y: number) => {
  const t = Math.min(1, Math.max(0, (PATH.y0 - y) / (PATH.y0 - PATH.y1)));
  return (PATH.w0 * (1 - t)) / 2;
};
function pathD(): string {
  const left: string[] = [];
  const right: string[] = [];
  for (let y = PATH.y0; y >= PATH.y1; y -= 6) {
    const t = (PATH.y0 - y) / (PATH.y0 - PATH.y1);
    const cx = PATH.cx0 + PATH.amp * (1 - PATH.decay * t) * Math.sin(t * Math.PI * PATH.turns);
    const w = PATH.w0 * (1 - t) + 1.5;
    left.push(`${f(cx - w / 2)} ${f(y)}`);
    right.push(`${f(cx + w / 2)} ${f(y)}`);
  }
  return `M${left.join("L")}L${right.reverse().join("L")}Z`;
}

/** 나무 한 층 — 나무와 뿌리 자리(식물·조약돌이 그 옆에 놓인다) */
function layer(seed: number, by: number, n: number, hr: [number, number], wr: [number, number], pineFrac: number, margin = 26) {
  const R = rng(seed);
  const bases: { x: number; by: number; w: number }[] = [];
  const trees: Tree[] = [];
  for (let i = 0; i < n; i += 1) {
    const x = -10 + (382 * (i + 0.15 + R() * 0.7)) / n;
    const b = by + (R() * 14 - 7);
    if (Math.abs(x - 180) < pathHalf(b) + margin) {
      R();
      R();
      R();
      continue;
    }
    const h = hr[0] + R() * (hr[1] - hr[0]);
    const w = wr[0] + R() * (wr[1] - wr[0]);
    trees.push(R() < pineFrac ? { pine: pine(x, b, h, w, [3, 4, 4, 5][Math.floor(R() * 4)] as number) } : roundTree(x, b, h * 0.8, w * 0.8));
    bases.push({ x, by: b, w });
  }
  return { trees, bases };
}

// 작은 식물: 잎 하나로 풀·양치·새싹·버섯·덤불
function leaf(x: number, y: number, ang: number, len: number, wid: number): string {
  const a = (ang * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const nx = -dy;
  const ny = dx;
  const mx = x + dx * len * 0.5;
  const my = y + dy * len * 0.5;
  const tx = x + dx * len;
  const ty = y + dy * len;
  return `M${f(x)} ${f(y)}Q${f(mx + nx * wid)} ${f(my + ny * wid)} ${f(tx)} ${f(ty)}Q${f(mx - nx * wid)} ${f(my - ny * wid)} ${f(x)} ${f(y)}Z`;
}
function grass(x: number, by: number, s: number, R: () => number): string {
  const n = 4 + Math.floor(R() * 3);
  let d = "";
  for (let i = 0; i < n; i += 1) {
    const k = i - (n - 1) / 2;
    d += leaf(x + k * 2.4 * s, by, k * 17 + (R() * 8 - 4), (9 + R() * 8) * s, 1.5 * s);
  }
  return d;
}
function fern(x: number, by: number, s: number): string {
  let d = "";
  for (let i = 0; i < 7; i += 1) {
    const ang = -72 + i * 24;
    d += leaf(x, by, ang, (13 + (1 - Math.abs(ang) / 90) * 10) * s, 2.7 * s);
  }
  return d;
}
const sprout = (x: number, by: number, s: number) =>
  `M${f(x - 0.7 * s)} ${f(by)}h${f(1.4 * s)}v${f(-7 * s)}h${f(-1.4 * s)}Z${leaf(x, by - 6 * s, -58, 6.5 * s, 2.3 * s)}${leaf(x, by - 6 * s, 58, 6.5 * s, 2.3 * s)}`;
const mushroom = (x: number, by: number, s: number) =>
  `M${f(x - 1.3 * s)} ${f(by)}h${f(2.6 * s)}v${f(-5 * s)}h${f(-2.6 * s)}Z` + `M${f(x - 5.2 * s)} ${f(by - 4.6 * s)}A${f(5.2 * s)} ${f(4.4 * s)} 0 0 1 ${f(x + 5.2 * s)} ${f(by - 4.6 * s)}Z`;
const dome = (x: number, by: number, r: number) => `M${f(x - r)} ${f(by)}a${f(r)} ${f(r)} 0 0 1 ${f(2 * r)} 0Z`;
const bush = (x: number, by: number, s: number) => dome(x - 5 * s, by, 5 * s) + dome(x + 4 * s, by, 6.5 * s) + dome(x - 0.5 * s, by, 4.5 * s);

/** 식물 묶음 — 어두운 층(a)·밝은 층(b)·버섯 갓(c) */
export interface Plants {
  a: string;
  b: string;
  c: string;
}
function cluster(x: number, by: number, s: number, R: () => number, acc: Plants): void {
  acc.a += grass(x - 5 * s, by, s, R) + grass(x + 6 * s, by, s * 0.85, R);
  const k = R();
  if (k < 0.34) acc.b += fern(x + s, by, s * 0.9);
  else if (k < 0.52) acc.b += sprout(x + 3 * s, by, s);
  else if (k < 0.72) acc.c += mushroom(x + 3 * s, by, s);
  else if (k < 0.86) acc.a += bush(x + 2 * s, by, s);
  else acc.b += grass(x + s, by, s * 1.15, R);
}

// 조약돌 아홉(D-067·D-084): 먼 곳 둘·가운데 넷·가까운 곳 셋. 자리는 손으로 정했다. 계열은 섞어 두었다(늘 크거나 늘 작은 계열이 없게)
const BAND_SIZE = [22, 30, 40];
const SPOTS = [
  { key: "wish", band: 0, x: 150, y: 362 },
  { key: "anger", band: 0, x: 218, y: 364 },
  { key: "hate", band: 1, x: 70, y: 474 },
  { key: "sadness", band: 1, x: 96, y: 468 },
  { key: "joy", band: 1, x: 226, y: 470 },
  { key: "disgust", band: 1, x: 284, y: 466 },
  { key: "love", band: 2, x: 18, y: 698 },
  { key: "enjoyment", band: 2, x: 84, y: 704 },
  { key: "fear", band: 2, x: 312, y: 696 }
] as const;
const TILT = [-16, 12, -8, 20, -14, 9, -22, 15, -5];
/** 겹 사이 순서: 먼 숲 → 먼 돌 → 먼 풀 → 가운데 숲 → … (돌·안내 글은 11 이상) */
export const LAYER_Z = { art: [1, 4, 7], pebble: [2, 5, 9], fore: [3, 6, 10] } as const;

export interface Spot {
  key: string;
  band: 0 | 1 | 2;
  x: number;
  y: number;
  w: number;
  rot: number;
}
export interface Dot {
  cx: number;
  cy: number;
  r: number;
  sd: number;
}

export interface ForestArt {
  stars: Dot[];
  flies: Dot[];
  far: Tree[];
  mid: Tree[];
  road: string;
  groundFar: string;
  groundMid: string;
  farEnd: string[];
  near: string[];
  edge: string[];
  plants: [Plants, Plants, Plants];
  fore: [Plants, Plants, Plants];
  spots: Spot[];
}

let cached: ForestArt | null = null;

export function buildForest(): ForestArt {
  if (cached) return cached;
  const R = rng(11);
  const Rp = rng(41);
  const stars: Dot[] = [];
  const flies: Dot[] = [];
  for (let i = 0; i < 9; i += 1) stars.push({ cx: 14 + R() * 332, cy: 120 + R() * 130, r: 0.9 + R() * 0.8, sd: -R() * 4 });
  for (let i = 0; i < 8; i += 1) flies.push({ cx: 30 + R() * 300, cy: 390 + R() * 200, r: 1.1 + R() * 0.7, sd: -R() * 5 });
  const far = layer(3, 358, 34, [70, 132], [26, 46], 0.85);
  const mid = layer(5, 456, 14, [150, 232], [54, 86], 0.7, 30);
  const spots: Spot[] = SPOTS.map((p, i) => ({ ...p, w: BAND_SIZE[p.band] as number, rot: TILT[i % TILT.length] as number }));
  const empty = (): Plants => ({ a: "", b: "", c: "" });
  const acc: [Plants, Plants, Plants] = [empty(), empty(), empty()];
  const fore: [Plants, Plants, Plants] = [empty(), empty(), empty()];
  for (const b of far.bases) if (Rp() < 0.72) cluster(b.x + (Rp() < 0.5 ? -1 : 1) * b.w * 0.34, b.by + 3, 0.5, Rp, acc[0]);
  for (const b of mid.bases) if (Rp() < 0.85) cluster(b.x + (Rp() < 0.5 ? -1 : 1) * b.w * 0.36, b.by + 5, 1.0, Rp, acc[1]);
  for (const p of spots) {
    const dir = p.x < W / 2 ? -1 : 1;
    cluster(p.x + dir * p.w * 0.85, p.y + p.w * 0.42, Math.max(0.5, (p.w / 26) * 0.95), Rp, acc[p.band]);
  }
  acc[2].a += grass(20, 668, 2.2, Rp) + grass(340, 672, 2.2, Rp) + grass(70, 690, 2.6, Rp) + grass(292, 694, 2.6, Rp);
  acc[2].b += fern(24, 700, 3.0) + fern(338, 704, 3.0);
  for (const p of spots) {
    const dir = p.x < W / 2 ? 1 : -1;
    fore[p.band].a += grass(p.x + dir * p.w * 0.34, p.y + p.w * 0.48, Math.max(0.55, p.w / 26), Rp);
  }
  cached = {
    stars,
    flies,
    far: far.trees,
    mid: mid.trees,
    road: pathD(),
    groundFar: `M0 356C70 344 260 346 360 358L360 ${H}L0 ${H}Z`,
    groundMid: `M0 460C90 444 270 446 360 464L360 ${H}L0 ${H}Z`,
    farEnd: [pine(176, 364, 84, 30, 4), pine(204, 367, 96, 34, 4)],
    near: [pine(-4, 770, 500, 190, 6, 0.24), pine(364, 770, 500, 190, 6, 0.3)],
    edge: [pine(46, 780, 340, 130, 5, 0.42), pine(338, 780, 320, 124, 5, 0.36)],
    plants: acc,
    fore,
    spots
  };
  return cached;
}
