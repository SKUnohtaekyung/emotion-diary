// 바구니(D-068) — 세부 감정 화면의 친구 옆에 바구니가 하나 놓이고, 세부 감정을 켜면 그 계열의 조약돌이 pill의 체크 자리에서 미끄러져 와 담긴다(2026-09-22).
// 저장하는 값이 아니고, 기록에 남는 돌은 여전히 "그날 고른 계열 하나"다(D-050). 끄면 그 돌이 바구니에서 살짝 올라오며 사라진다.
// 하지 않는 것: 포물선으로 던지기·물수제비(D-050), 개수 글자·누적 표시(수집·보상 금지), 크기·밝기로 무게 표현, 돌이 차오르며 바구니가 커지거나 변하는 것.
// 움직임 줄이기에서는 날지 않고 바로 담기며 출렁임도 없다. (파일 이름 pile.js는 조약돌 더미였을 때의 것이다. 이름을 바꾸면 detail.js의 import 한 줄만 고치면 된다.)
import { el, svgEl, reducedMotion } from "../dom.js";
import { pebbleImg } from "../data.js";

// ── 바구니 그림 ── 납작한 SVG(그라데이션·그림자 없음)이고 색은 basket.css의 변수뿐이다. 좌표는 112×104 상자 안이다.
// 뒤 판(손잡이·안쪽 벽·뒤 테두리) → 조약돌 → 앞 판(몸통·엮음·앞 테두리) 순으로 겹쳐, 돌의 아랫부분이 앞 판에 가려 "담겨" 보인다.
const W = 112, H = 104, CX = 56;
const RIM_Y = 40, RIM_RX = 50, RIM_RY = 10; // 아가리(타원)의 가운데 높이와 반지름
const BASE_Y = 93, BASE_RX = 36;            // 바닥 가장자리의 높이와 반폭
const SIDE_X = (RIM_RX + BASE_RX) / 2 + 6, SIDE_Y = (RIM_Y + BASE_Y) / 2; // 옆선의 조절점: 곧은 선보다 3px쯤 바깥으로 볼록해 양동이가 아니라 바구니로 읽힌다
const LINES = [RIM_Y, 53, 66, 79, BASE_Y];  // 엮음 띠의 경계 높이(맨 위는 앞 테두리, 맨 아래는 바닥 곡선)
// 높이 y에서 몸통의 반폭. 조절점의 높이가 양 끝의 한가운데라 y는 매개변수 t에 비례한다.
const half = (y) => { const t = (y - RIM_Y) / (BASE_Y - RIM_Y); return (1 - t) ** 2 * RIM_RX + 2 * (1 - t) * t * SIDE_X + t ** 2 * BASE_RX; };
const bulge = (y) => (half(y) * RIM_RY) / RIM_RX;                                  // 그 높이에서 가운데가 아래로 처지는 양(둥근 통을 앞에서 본 곡선)
const n1 = (v) => Math.round(v * 10) / 10;

const curve = (y) => `M${n1(CX - half(y))} ${y}Q${CX} ${n1(y + 2 * bulge(y))} ${n1(CX + half(y))} ${y}`;
const BODY = `M${CX - RIM_RX} ${RIM_Y}Q${CX - SIDE_X} ${SIDE_Y} ${CX - BASE_RX} ${BASE_Y}A${BASE_RX} ${n1(bulge(BASE_Y))} 0 0 0 ${CX + BASE_RX} ${BASE_Y}Q${CX + SIDE_X} ${SIDE_Y} ${CX + RIM_RX} ${RIM_Y}A${RIM_RX} ${RIM_RY} 0 0 1 ${CX - RIM_RX} ${RIM_Y}Z`;
// 엮음: 통을 돌아가는 곡선 띠 사이에 갈라지는 살(위에서 아래로 좁아진다)을 한 칸씩 어긋나게 성기게 넣는다.
const WEAVE = (() => {
  let d = "";
  for (let k = 0; k < LINES.length - 1; k += 1) {
    const y1 = LINES[k], y2 = LINES[k + 1], odd = k % 2;
    for (let i = 0; i < 7 + odd; i += 1) {
      const u = (odd ? -0.875 : -0.75) + i * 0.25, s = 1 - u * u;
      d += `M${n1(CX + u * half(y1))} ${n1(y1 + bulge(y1) * s + 2.6)}L${n1(CX + u * half(y2))} ${n1(y2 + bulge(y2) * s - 2.6)}`;
    }
  }
  return d;
})();
const art = (cls, ...kids) => svgEl("svg", { class: `bk-art ${cls}`, viewBox: `0 0 ${W} ${H}`, "aria-hidden": "true", focusable: "false" }, ...kids);
const backArt = () => art("bk-back",
  svgEl("path", { class: "bk-handle", d: "M10 40C7 -4 105 -4 102 40" }),
  svgEl("ellipse", { class: "bk-in", cx: CX, cy: RIM_Y, rx: RIM_RX, ry: RIM_RY }),
  svgEl("path", { class: "bk-rim", d: `M${CX - RIM_RX} ${RIM_Y}A${RIM_RX} ${RIM_RY} 0 0 1 ${CX + RIM_RX} ${RIM_Y}` }));
const frontArt = () => art("bk-front",
  svgEl("path", { class: "bk-wall", d: BODY }),
  svgEl("path", { class: "bk-weft", d: LINES.slice(1, -1).map(curve).join("") }),
  svgEl("path", { class: "bk-warp", d: WEAVE }),
  svgEl("path", { class: "bk-rim", d: `M${CX - RIM_RX} ${RIM_Y}A${RIM_RX} ${RIM_RY} 0 0 0 ${CX + RIM_RX} ${RIM_Y}` }),
  svgEl("path", { class: "bk-lip", d: `M${CX - RIM_RX + 6} ${RIM_Y + 1}A${RIM_RX - 6} ${RIM_RY - 2} 0 0 0 ${CX + RIM_RX - 6} ${RIM_Y + 1}` }));

// ── 조약돌 자리 ── 돌 상자는 32px이고(보이는 돌은 약 29×22) 모두 같은 크기다. 아래 줄 5 + 윗줄 4, 두 줄까지.
// 아래 줄은 앞 판 테두리에 아랫부분(약 3분의 1)이 가려지고, 윗줄은 뒤 테두리 위로 봉긋하게 보인다. 바구니 크기는 돌이 늘어도 그대로다.
// 채우는 순서는 우선순위(줄×0.6 + 가운데에서 떨어진 거리×0.55)가 낮은 것부터라 돌이 몇 개 안 될 때도 봉우리 모양이고, 같은 개수면 언제나 같은 자리다(결정적 위치).
// 9개를 넘겨 고르면 더 담지 않는다 — 새로 켠 돌이 가장 오래된 돌의 자리로 담기고 그 오래된 돌은 조용히 사라져 총량이 그대로다.
const STONE = 32, PITCH = 18, DROP = 13; // 돌 상자, 가로 간격(상자보다 좁아 살짝 겹친다), 아가리 안으로 내려앉기 전 손을 놓는 높이
const ROWS = [{ y: 43, n: 5 }, { y: 31, n: 4 }];
const TILT = [-7, 5, -4, 8, -9, 4, -6, 7, -3]; // 자리마다 정해진 살짝 기운 각도(무작위 아님)
const SLOTS = (() => {
  const slots = [];
  ROWS.forEach(({ y, n }, r) => { for (let i = 0; i < n; i += 1) { const k = i - (n - 1) / 2; slots.push({ x: CX + k * PITCH, y, r, k, p: r * 0.6 + Math.abs(k) * 0.55 }); } });
  slots.sort((a, b) => a.p - b.p || b.k - a.k || a.r - b.r);
  return slots.map((s, i) => ({ ...s, tilt: TILT[i], z: 2 - s.r })); // 아래 줄이 앞(z 큼)
})();
const GLIDE_MS = 480, SETTLE_MS = 200, FADE_MS = 180, WOBBLE_MS = 640; // 미끄러져 오기 + 아가리 안으로 내려앉기 = 약 680ms

export function createBasket(cat) {
  const stonesLayer = el("div", { class: "bk-stones" });
  const rock = el("div", { class: "bk-rock" }, backArt(), stonesLayer, frontArt()); // 출렁임은 rock만 돈다. node는 돌지 않아 화면 배율(컴팩트)을 잴 수 있다.
  const node = el("div", { class: "bk", "aria-hidden": "true" }, rock);
  const slotOf = new Map(), stones = new Map(), gliding = new Map();
  let reused = 0; // 자리를 다시 쓴 횟수. 돌끼리 살짝 어긋나 보이게 하는 데만 쓰고 화면에 글자로 보이지 않는다.

  const freeSlot = () => { const used = new Set(slotOf.values()); return SLOTS.findIndex((_, i) => !used.has(i)); };
  // 어긋남은 가로로 −3·0·+3px뿐이다(위로 올리지 않는다).
  function makeStone(slot, lap) {
    const { x, y, tilt, z } = SLOTS[slot];
    const stone = pebbleImg(cat, { size: STONE });
    stone.classList.add("bk-stone");
    stone.style.left = `${n1(x + ((lap % 3) - 1) * 3 * Math.min(lap, 1) - STONE / 2)}px`; stone.style.top = `${y - STONE / 2}px`;
    stone.style.setProperty("--r", `${tilt}deg`); stone.style.setProperty("--z", z);
    return stone;
  }

  // 아주 조금(2° 이내) 출렁였다 돌아온다. 이미 출렁이는 중이면 그 각도에서 이어 받아 튀지 않는다.
  let rocking = null;
  const angle = () => { const m = new DOMMatrixReadOnly(getComputedStyle(rock).transform); return (Math.atan2(m.b, m.a) * 180) / Math.PI; };
  function wobble(delay = 0) {
    if (reducedMotion()) return;
    const from = angle();
    rocking?.cancel();
    const r = (deg, offset) => ({ transform: `rotate(${deg}deg)`, offset, easing: "ease-in-out" });
    rocking = rock.animate([r(from, 0), r(-1.8, 0.22), r(1.1, 0.52), r(-0.5, 0.78), r(0, 1)], { duration: WOBBLE_MS, delay, fill: "backwards" });
  }

  // fromEl이 있으면 그 자리(pill의 체크)에서 미끄러져 온다. 거의 직선 경로에 작은 회전만 주고 도착할수록 느려진다(ease-out). 던지듯 솟았다 떨어지는 호는 없다.
  // 마지막에 아가리 바로 위에서 fly를 거두고 진짜 돌(앞 판 뒤)이 그 자리에서 이어받아 아가리 안으로 내려앉는다 — 그 순간부터 앞 판이 돌 아랫부분을 가린다.
  // 도착 자리는 매 프레임 다시 잰다 — 친구·바구니 영역이 컴팩트로 바뀌거나 화면이 스크롤되는 도중에도 돌이 어긋나지 않는다.
  function glide(code, fromEl, stone) {
    const a = fromEl.getBoundingClientRect(), sx = a.left + a.width / 2, sy = a.top + a.height / 2;
    const tilt = SLOTS[slotOf.get(code)].tilt;
    const fly = pebbleImg(cat, { size: STONE });
    fly.className = "fly-stone bk-fly"; // fly-stone은 main.js가 화면을 떠날 때 남은 돌을 치우는 표식이다(write.css가 40px로 잡아 두어 크기는 여기서 다시 준다)
    fly.style.width = fly.style.height = `${STONE}px`;
    fly.style.opacity = "0"; fly.style.transform = `translate(${sx - STONE / 2}px, ${sy - STONE / 2}px) scale(0.8)`; // 첫 프레임 전에 페인트가 끼어도 화면 모서리에서 번쩍이지 않게 출발 자리에 투명으로 둔다
    document.body.append(fly);
    stone.style.opacity = "0";
    const t0 = performance.now();
    let raf = 0, dir = 0;
    const finish = () => { cancelAnimationFrame(raf); gliding.delete(code); fly.remove(); };
    const tick = (now) => {
      if (!node.isConnected) { finish(); return; } // 다른 화면으로 떠났다
      const t = Math.max(0, Math.min(1, (now - t0) / GLIDE_MS)), k = 1 - (1 - t) ** 3; // easeOutCubic (첫 프레임의 시각이 클릭보다 조금 이를 수 있어 0 밑으로는 내리지 않는다)
      const b = stone.getBoundingClientRect(), sc = node.offsetWidth ? node.getBoundingClientRect().width / node.offsetWidth : 1; // sc: 컴팩트면 1보다 작다
      const ex = b.left + b.width / 2, ey = b.top + b.height / 2 - DROP * sc;
      if (!dir) dir = ex >= sx ? 1 : -1;
      const x = sx + (ex - sx) * k, y = sy + (ey - sy) * k, turn = tilt - dir * 50 * (1 - k);
      const size = sc * (0.8 + 0.2 * Math.min(1, t / 0.15)); // 체크 자리(24px)에서 나오며 커지고 도착하면 바구니 안의 돌과 같은 크기다
      fly.style.transform = `translate(${x - STONE / 2}px, ${y - STONE / 2}px) rotate(${turn}deg) scale(${size})`;
      fly.style.opacity = String(Math.min(1, t / 0.1));
      if (t < 1) { raf = requestAnimationFrame(tick); return; }
      finish();
      stone.style.opacity = "";
      stone.animate([{ translate: `0 ${-DROP}px` }, { translate: "0 0" }], { duration: SETTLE_MS, easing: "cubic-bezier(.25,.75,.35,1)" });
      wobble(SETTLE_MS * 0.5);
    };
    gliding.set(code, { cancel: finish });
    raf = requestAnimationFrame(tick);
  }

  function add(code, fromEl = null) {
    if (slotOf.has(code)) return;
    let slot = freeSlot(), lap = 0;
    if (slot < 0) { // 가득 찼다: 가장 오래된 돌을 조용히 보내고 그 자리를 다시 쓴다
      const oldest = slotOf.keys().next().value;
      slot = slotOf.get(oldest); lap = (reused += 1);
      remove(oldest);
    }
    const stone = makeStone(slot, lap);
    slotOf.set(code, slot); stones.set(code, stone);
    stonesLayer.append(stone);
    if (fromEl && !reducedMotion()) glide(code, fromEl, stone);
  }

  // 바구니에서 돌 하나를 뺀다: 아직 미끄러져 오는 중이면 그 자리에서 거두고, 담긴 돌이면 살짝 올라오며 사라진다. 이미 자리를 내준 세부 감정이면(9개를 넘긴 뒤) 할 일이 없다.
  function remove(code) {
    const stone = stones.get(code);
    if (!stone) return;
    slotOf.delete(code); stones.delete(code);
    const flying = gliding.get(code);
    if (flying) { flying.cancel(); stone.remove(); return; }
    if (reducedMotion()) { stone.remove(); return; }
    stone.animate([{ opacity: 1, translate: "0 0" }, { opacity: 0, translate: "0 -12px" }], { duration: FADE_MS, easing: "ease-out", fill: "forwards" }).finished.then(() => stone.remove(), () => stone.remove());
  }

  // 다른 화면에 다녀와 다시 그릴 때 바로 놓는다(미끄러져 오는 움직임 없이). 9개를 넘겼다면 가장 나중에 켠 9개가 남는다.
  const restore = (codes) => codes.slice(-SLOTS.length).forEach((code) => add(code));
  return { node, add, remove, restore };
}
