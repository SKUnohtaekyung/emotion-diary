// 오늘 있었던 일·칭찬·감사 화면의 장면(D-069). 이유 화면(reason.js)과 같은 종이·초록 언덕·민트 테이프의 한 가족이되, 화면마다 다른 이야기를 한다.
//   오늘 있었던 일 = 길의 시작·아침: 날짜 탭이 붙은 줄 종이 노트, 아래는 이른 아침 언덕·흰 길·시작하는 돌.
//   칭찬          = 빛 아래 쪽지: 민트 테이프로 붙인 세 장의 쪽지, 아래는 해가 높이 뜬 언덕과 이번에 고른 계열의 조약돌.
//   감사          = 해 질 녘 등불과 들꽃: 끈에 꿴 세 장의 종이 카드, 아래는 노을 하늘·언덕과 등불 빛이 닿은 작은 들꽃 무리(SVG 한 장, thanksArt).
// 입력 묶음(dateField·eventField·slots)은 write.js가 만든 것이다 — 다시 만들지 않고 그대로 안에 넣거나(날짜·사건) 입력만 옮겨 감싼다(칭찬·감사).
// 저장·검증·오류 표시·state.draft 갱신이 그 DOM과 리스너에 걸려 있다. 옮긴 <input>은 같은 노드이므로 리스너가 그대로 산다.
// 장면(해·언덕·나무·길·돌·조약돌·등불)은 장식이다(aria-hidden). 사용자가 쓴 글의 내용·길이에 반응하지 않고, 점수·보상·누적을 말하지 않는다.
// 모양과 움직임은 css/notes.css가 정한다. 장면은 문서 흐름 안에 있어 고정 위치로 화면을 덮지 않는다(모바일 키보드가 올라와도 입력을 가리지 않는다).
import { el, svgEl } from "../dom.js";
import { data, pebbleImg, stoneImg } from "../data.js";

// 언덕은 위쪽 모서리가 타원인 상자다(좌우 l·r은 폭의 %, 세로 반지름 ry는 rem). 그 마루가 폭의 x% 자리에서 상자 꼭대기보다 내려온 만큼(rem)을 구해
// 나무·등불의 밑동이 마루에 닿게 한다. 값은 CSS(.nt-hill)가 같은 변수(--l --r --ry)로 그리므로 JS·CSS가 어긋나지 않는다.
const drop = (x, { l, r, ry }) => {
  const cx = (l + 100 - r) / 2, rx = (100 - r - l) / 2, d = Math.min(1, Math.abs(x - cx) / rx);
  return ry * (1 - Math.sqrt(1 - d * d));
};
const hillVars = ({ l, r, ry }) => ({ "--l": `${l}%`, "--r": `${r}%`, "--ry": `${ry}rem` });
const hill = (kind, geo) => el("i", { class: `nt-hill ${kind}`, "aria-hidden": "true", style: hillVars(geo) });

// 작은 나무(장식). r은 나뭇잎 반지름(px), hill은 밑동이 놓일 언덕. 흔들리지 않는다(이 장면들의 반복 움직임은 화면마다 하나뿐이다).
const tree = (x, r, geo) => el("i", { class: "nt-tree", "aria-hidden": "true", style: { "--x": `${x}%`, "--r": String(r), "--dy": `${drop(x, geo).toFixed(3)}rem` } });

// 해: 둥근 해와 그 둘레의 옅은 고리 둘(CSS). 아주 천천히 커졌다 줄어든다(2~3%).
const sun = (cls) => el("i", { class: `nt-sun ${cls}`, "aria-hidden": "true" });

// 맨 앞의 가까운 언덕. 아래 버튼 줄(.step-footer, 배경 투명)의 뒤에 sticky로 앉는다 — 화면이 길어 버튼 줄이 글 위에 떠 있는 동안에도 초록이 따라오고,
// 끝까지 내리면 몸통의 언덕과 하나로 이어진다. JS 없이 CSS(sticky·z-index)만으로 동작한다.
const base = (geo) => el("div", { class: "nt-base", "aria-hidden": "true" }, el("i", { style: hillVars(geo) }));

// 흰 길: 아래(가까운 곳)는 넓고 위(먼 곳)는 좁게 한 굽이 도는 모양이다. 상자를 늘려 그리는 SVG라 세로 길이가 달라져도 모양이 자연스럽다.
// 중심 x(%)와 폭(%)은 t(0 = 아래, 1 = 위)의 함수다. 시작하는 돌은 t=0의 중심(ROAD_X0)에 놓는다.
const roadCx = (t) => 47 + 14 * (1 - 0.55 * t) * Math.sin(t * Math.PI * 1.35 + 0.35);
const roadW = (t) => 44 * (1 - t) ** 1.35 + 1.4;
const ROAD_X0 = roadCx(0);
function road() {
  const left = [], right = [];
  for (let i = 0; i <= 28; i += 1) {
    const t = i / 28, y = (100 - t * 100).toFixed(2), cx = roadCx(t), w = roadW(t);
    left.push(`${(cx - w / 2).toFixed(2)} ${y}`); right.push(`${(cx + w / 2).toFixed(2)} ${y}`);
  }
  return svgEl("svg", { class: "nt-road", viewBox: "0 0 100 100", preserveAspectRatio: "none", "aria-hidden": "true", focusable: "false" },
    svgEl("path", { d: `M${left.join("L")}L${right.reverse().join("L")}Z` }));
}

// ── 오늘 있었던 일: 사건 입력 묶음(라벨·textarea#event·오류)은 줄 종이 안에 그대로 넣는다. 날짜 묶음을 받으면 노트 위에 붙은 종이 탭 안에 넣는다 —
// 새 기록은 그날만 써서(D-082) 작성 흐름은 날짜 칸을 넘기지 않고, 그때는 탭을 만들지 않는다(빈 탭 조각이 남지 않게. 테이프는 종이가 대신 받는다, notes.css).
// day는 장면 설명 줄의 날 이름이다 — 지난 날 쓰던 글을 마무리할 때는 '그날'이다.
// 이 단계는 감정을 고르기 전이라 친구도 조약돌도 세우지 않는다(cats가 있어도 쓰지 않는다).
const EVENT = { far: { l: -70, r: -30, ry: 3.5 }, mid: { l: -20, r: -60, ry: 3 }, near: { l: -30, r: -40, ry: 2 } };
export function renderEventScene({ eventField, day = "오늘" }) {
  const sheet = el("div", { class: "nt-sheet" }, el("div", { class: "nt-paper" }, eventField)); // 날짜 탭(dateField)은 D-082 이후 쓰지 않아 지웠다(D-099 native-picker C1)
  const land = el("div", { class: "nt-land", style: { "--rx": `${ROAD_X0.toFixed(2)}%` } }, // 길의 들머리 중심(%) — 돌과 설명 줄이 이 자리를 따른다
    el("i", { class: "nt-haze", "aria-hidden": "true" }),
    sun("dawn"),
    hill("far", EVENT.far), tree(12, 6.5, EVENT.far), tree(19, 4.5, EVENT.far), tree(91, 5, EVENT.far),
    hill("mid", EVENT.mid),
    road(),
    el("p", { class: "nt-story", text: `${day} 하루를 돌아보는 길이에요` }), // 장면을 설명하는 한 줄이다. 판단·평가·격려의 말이 아니다. 보이는 길과 지금 하는 일을 그대로 말한다(2026-10-13 QA R9)
    el("span", { class: "nt-stone", "aria-hidden": "true" }, stoneImg("rest")));
  return el("div", { class: "nt-scene nt-event" }, sheet, land, base(EVENT.near));
}

// ── 칭찬·감사: fieldset(legend·설명·input 셋)의 입력만 옮겨 감싼다. 세 입력은 같은 노드이고 값·리스너가 그대로다.
function wrapSlots(slots, wrapClass, listClass) {
  const list = el("div", { class: listClass });
  [...slots.querySelectorAll("input.slot-input")].forEach((input, i) => list.append(el("div", { class: wrapClass, style: { "--i": String(i) } }, input)));
  slots.append(list);
  return slots;
}

// 이번에 고른 계열의 조약돌. 모두 같은 크기이고(수에 따라 전원이 함께 바뀐다) 위치·기울기만 조금씩 다르다. 개수 글자·누적 표시·모으는 연출은 없다(D-050).
// 순서는 taxonomy 선언 순서다 — 고른 순서나 심리 축으로 줄 세우지 않는다.
const TILT = [-8, 6, -3, 9, -6, 4, -9, 7, -2];
function pebbles(cats) {
  const order = data.categories.map((c) => c.code).filter((code) => cats.includes(code));
  if (!order.length) return null;
  const size = order.length <= 3 ? 48 : order.length <= 5 ? 42 : order.length <= 7 ? 36 : 30;
  return el("div", { class: "nt-pebbles", "aria-hidden": "true", style: { "--nt-peb": `${size}px` } }, order.map((code, i) => {
    const img = pebbleImg(code, { size });
    img.removeAttribute("width"); img.removeAttribute("height"); // 크기는 CSS(--nt-peb)가 정한다
    return el("span", { class: "nt-peb", style: { "--i": String(i), "--rot": `${TILT[i % TILT.length]}deg` } }, img);
  }));
}

// ── 감사 장면 그림(2026-11-18, 휴대폰 확인 뒤 사용자 선택 B+F): 해 질 녘 언덕의 등불 빛이 곁의 작은 들꽃 무리에 닿는다 ──
// 감사의 첫 단계 '좋은 것을 알아보기'(Emmons)와 '세 가지 좋은 일'의 알아차리기 — 지나치기 쉬운 작은 좋은 것. 빛은 등불 하나에서 언덕 뒤로 퍼지고,
// 땅에 고이는 빛은 가운데 언덕 모양으로 잘라 마루선과 겹치지 않는다(전에는 빛 원이 마루를 가로질러 색이 겹쳐 보였다).
// 좌표는 360 폭 기준 하나(viewBox 0 80 360 190)이고 화면 폭에 맞춰 늘어난다. 색은 CSS 클래스(.ta-*)가 tokens의 land.* 변수로 칠한다.
// 쓴 칸 수에 반응하지 않고 늘 같다. 친구·조약돌 없음. 반복 움직임은 등불 빛의 숨 하나(움직임 줄이기면 멈춤). 앱(PaperScenes.tsx)도 같은 좌표다.
const TA_FAR = "M0,206 C58,188 120,184 182,193 C240,201 300,196 360,181 L360,270 L0,270 Z";
const TA_MID = "M0,234 C66,216 146,211 222,222 C282,231 330,233 360,226 L360,270 L0,270 Z";
let taSeq = 0;
function thanksShapes(uid) {
  const S = (tag, attrs, ...kids) => ({ tag, attrs, kids });
  const tree = (x, y, r, far = false) => {
    const cy = y - r * 1.6;
    return S("g", {},
      S("rect", { class: "ta-trunk", x: x - 1.5, y: y - r * 1.25, width: 3, height: r * 1.3, rx: 1.5 }),
      S("circle", { class: far ? "ta-far-tree-shade" : "ta-tree-shade", cx: x, cy, r }),
      S("circle", { class: far ? "ta-far-tree" : "ta-tree", cx: x + r * 0.16, cy: cy - r * 0.12, r: r * 0.86 }));
  };
  const flower = (x, y, h, r) => S("g", {},
    S("path", { class: "ta-stem", d: `M${x},${y} Q${x - 2},${y - h / 2} ${x},${y - h}` }),
    ...[0, 72, 144, 216, 288].map((a) => S("circle", { class: "ta-petal", cx: +(x + Math.cos((a * Math.PI) / 180) * r * 0.9).toFixed(2), cy: +(y - h + Math.sin((a * Math.PI) / 180) * r * 0.9).toFixed(2), r: +(r * 0.62).toFixed(2) })),
    S("circle", { class: "ta-fcore", cx: x, cy: y - h, r: r * 0.5 }));
  const leaf = (x, y, f) => S("path", { class: "ta-leaf", d: `M${x},${y} q${6 * f},-7 ${12 * f},-3 q${-6 * f},5 ${-12 * f},3 Z` });
  const grad = (id, cls, a) => S("radialGradient", { id }, S("stop", { class: cls, offset: 0, "stop-opacity": a }), S("stop", { class: cls, offset: 0.35, "stop-opacity": +(a * 0.45).toFixed(2) }), S("stop", { class: cls, offset: 1, "stop-opacity": 0 }));
  // 등불(바닥 256,228): 기둥·받침·갓·꼭지·등 몸통·안쪽 빛·살·아래 테
  const lamp = S("g", {},
    S("rect", { class: "ta-frame", x: 254.4, y: 176, width: 3.2, height: 52, rx: 1.6 }),
    S("rect", { class: "ta-frame", x: 250, y: 225, width: 12, height: 3, rx: 1.5 }),
    S("path", { class: "ta-frame", d: "M242,151 L270,151 L264,143 L248,143 Z" }),
    S("circle", { class: "ta-frame", cx: 256, cy: 141, r: 2.2 }),
    S("rect", { class: "ta-lamp", x: 245, y: 151, width: 22, height: 24, rx: 4 }),
    S("rect", { class: "ta-core", x: 249, y: 155, width: 14, height: 16, rx: 3 }),
    S("rect", { class: "ta-mullion", x: 255.4, y: 151, width: 1.2, height: 24 }),
    S("rect", { class: "ta-frame", x: 243.5, y: 174, width: 25, height: 3, rx: 1.5 }));
  return S("svg", { class: "ta-art", viewBox: "0 80 360 190", "aria-hidden": "true", focusable: "false" },
    S("defs", {}, grad(`ta-glow-${uid}`, "ta-glow-stop", 0.9), grad(`ta-pool-${uid}`, "ta-pool-stop", 0.85), S("clipPath", { id: `ta-mid-${uid}` }, S("path", { d: TA_MID }))),
    S("path", { class: "ta-far", d: TA_FAR }),
    tree(300, 196, 6, true), tree(318, 192, 4.5, true),
    S("circle", { class: "ta-glow", cx: 256, cy: 163, r: 64, fill: `url(#ta-glow-${uid})` }),
    S("path", { class: "ta-mid", d: TA_MID }),
    S("g", { "clip-path": `url(#ta-mid-${uid})` }, S("ellipse", { cx: 236, cy: 232, rx: 88, ry: 18, fill: `url(#ta-pool-${uid})` })),
    lamp,
    leaf(196, 233, 1.4), leaf(232, 232, -1.4),
    flower(202, 235, 19, 5.6), flower(215, 233, 27, 6.6), flower(228, 236, 15, 5),
    tree(44, 232, 8), tree(68, 228, 5.5));
}
const buildSvg = ({ tag, attrs, kids }) => svgEl(tag, Object.fromEntries(Object.entries(attrs).map(([k, v]) => [k, String(v)])), ...kids.map(buildSvg));
const thanksArt = () => buildSvg(thanksShapes(++taSeq));

const PRAISE = { far: { l: -45, r: -45, ry: 3.5 }, mid: { l: -10, r: -85, ry: 3 }, near: { l: -55, r: -10, ry: 2 } };
const THANKS = { near: { l: -10, r: -55, ry: 2 } };

export function renderNotesScene({ kind, slots, cats = [] }) {
  if (kind === "thanks") {
    const land = el("div", { class: "nt-land", "aria-hidden": "true" }, thanksArt());
    return el("div", { class: "nt-scene nt-thanks" }, el("div", { class: "nt-desk" }, wrapSlots(slots, "nt-tag", "nt-tags")), land, base(THANKS.near));
  }
  const land = el("div", { class: "nt-land" },
    sun("noon"),
    hill("far", PRAISE.far), tree(80, 6, PRAISE.far), tree(87, 4.5, PRAISE.far),
    hill("mid", PRAISE.mid),
    pebbles(cats));
  return el("div", { class: "nt-scene nt-praise" }, el("div", { class: "nt-desk" }, wrapSlots(slots, "nt-slip", "nt-slips")), land, base(PRAISE.near));
}
