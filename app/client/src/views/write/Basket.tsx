// 세부 감정 화면의 바구니(D-068) — 시안 web/js/components/pile.js를 옮겼다(좌표·순서·시간 그대로, TASK-JOURNAL-01 J-2).
// 세부 감정을 켜면 그 계열의 조약돌이 pill의 체크 자리에서 미끄러져 와 담기고, 끄면 살짝 올라오며 사라진다.
// 저장하는 값이 아니다 — 기록에 남는 돌은 여전히 '그날 고른 계열 하나'다(D-050). 개수 글자·누적·크기로 무게 표현은 하지 않는다(수집·보상 금지).
// 움직임 줄이기에서는 날지 않고 바로 담기며 출렁임도 없다. 그림은 장식(aria-hidden)이다.
// 바구니 그림은 Preact가 한 번 그리고, 돌은 이 파일이 .bk-stones 안에 직접 놓는다(Preact는 그 칸의 자식을 건드리지 않는다 — 다시 그리지 않는 부품).

import { useLayoutEffect, useRef } from "preact/hooks";
import { pebbleUrl } from "../../lib/art";
import { prefersReducedMotion } from "../../lib/motion";

const W = 112;
const H = 104;
const CX = 56;
const RIM_Y = 40;
const RIM_RX = 50;
const RIM_RY = 10;
const BASE_Y = 93;
const BASE_RX = 36;
const SIDE_X = (RIM_RX + BASE_RX) / 2 + 6;
const SIDE_Y = (RIM_Y + BASE_Y) / 2;
const LINES = [RIM_Y, 53, 66, 79, BASE_Y];
const half = (y: number) => {
  const t = (y - RIM_Y) / (BASE_Y - RIM_Y);
  return (1 - t) ** 2 * RIM_RX + 2 * (1 - t) * t * SIDE_X + t ** 2 * BASE_RX;
};
const bulge = (y: number) => (half(y) * RIM_RY) / RIM_RX;
const n1 = (v: number) => Math.round(v * 10) / 10;
const curve = (y: number) => `M${n1(CX - half(y))} ${y}Q${CX} ${n1(y + 2 * bulge(y))} ${n1(CX + half(y))} ${y}`;
const BODY = `M${CX - RIM_RX} ${RIM_Y}Q${CX - SIDE_X} ${SIDE_Y} ${CX - BASE_RX} ${BASE_Y}A${BASE_RX} ${n1(bulge(BASE_Y))} 0 0 0 ${CX + BASE_RX} ${BASE_Y}Q${CX + SIDE_X} ${SIDE_Y} ${CX + RIM_RX} ${RIM_Y}A${RIM_RX} ${RIM_RY} 0 0 1 ${CX - RIM_RX} ${RIM_Y}Z`;
const WEAVE = (() => {
  let d = "";
  for (let k = 0; k < LINES.length - 1; k += 1) {
    const y1 = LINES[k] as number;
    const y2 = LINES[k + 1] as number;
    const odd = k % 2;
    for (let i = 0; i < 7 + odd; i += 1) {
      const u = (odd ? -0.875 : -0.75) + i * 0.25;
      const s = 1 - u * u;
      d += `M${n1(CX + u * half(y1))} ${n1(y1 + bulge(y1) * s + 2.6)}L${n1(CX + u * half(y2))} ${n1(y2 + bulge(y2) * s - 2.6)}`;
    }
  }
  return d;
})();

const STONE = 32;
const PITCH = 18;
const DROP = 13;
const ROWS = [
  { y: 43, n: 5 },
  { y: 31, n: 4 }
];
const TILT = [-7, 5, -4, 8, -9, 4, -6, 7, -3];
interface Slot {
  x: number;
  y: number;
  tilt: number;
  z: number;
}
const SLOTS: Slot[] = (() => {
  const slots: { x: number; y: number; r: number; k: number; p: number }[] = [];
  ROWS.forEach(({ y, n }, r) => {
    for (let i = 0; i < n; i += 1) {
      const k = i - (n - 1) / 2;
      slots.push({ x: CX + k * PITCH, y, r, k, p: r * 0.6 + Math.abs(k) * 0.55 });
    }
  });
  slots.sort((a, b) => a.p - b.p || b.k - a.k || a.r - b.r);
  return slots.map((slot, i) => ({ x: slot.x, y: slot.y, tilt: TILT[i] ?? 0, z: 2 - slot.r }));
})();
export const BASKET_CAPACITY = SLOTS.length;
const GLIDE_MS = 480;
const SETTLE_MS = 200;
const FADE_MS = 180;
const WOBBLE_MS = 640;

export interface BasketHandle {
  add: (code: string, from?: Element | null) => void;
  remove: (code: string) => void;
}

const canAnimate = (node: Element): boolean => !prefersReducedMotion() && typeof (node as HTMLElement).animate === "function";

function stoneImage(category: string): HTMLImageElement {
  const img = document.createElement("img");
  img.src = pebbleUrl(category, STONE);
  img.alt = "";
  img.decoding = "async";
  img.width = STONE;
  img.height = STONE;
  return img;
}

/** 바구니. handle은 그린 뒤 채워진다 — pill이 켜고 끌 때 부른다. initial은 다시 그릴 때 바로 놓을 돌(나중에 켠 9개). */
export function Basket({ category, initial, handle }: { category: string; initial: readonly string[]; handle: { current: BasketHandle | null } }) {
  const node = useRef<HTMLDivElement>(null);
  const rock = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = node.current;
    const rocker = rock.current;
    const stones = layer.current;
    if (!root || !rocker || !stones) return;
    const slotOf = new Map<string, number>();
    const placed = new Map<string, HTMLImageElement>();
    const gliding = new Map<string, () => void>();
    let reused = 0;
    let rocking: Animation | null = null;

    const freeSlot = (): number => {
      const used = new Set(slotOf.values());
      return SLOTS.findIndex((_, i) => !used.has(i));
    };
    const makeStone = (slot: number, lap: number): HTMLImageElement => {
      const { x, y, tilt, z } = SLOTS[slot] as Slot;
      const stone = stoneImage(category);
      stone.className = "pebble-img bk-stone";
      stone.style.setProperty("left", `${n1(x + ((lap % 3) - 1) * 3 * Math.min(lap, 1) - STONE / 2)}px`);
      stone.style.setProperty("top", `${y - STONE / 2}px`);
      stone.style.setProperty("--r", `${tilt}deg`);
      stone.style.setProperty("--z", String(z));
      return stone;
    };
    const angle = (): number => {
      if (typeof DOMMatrixReadOnly !== "function") return 0;
      const m = new DOMMatrixReadOnly(getComputedStyle(rocker).transform);
      return (Math.atan2(m.b, m.a) * 180) / Math.PI;
    };
    // 아주 조금(2° 이내) 출렁였다 돌아온다. 이미 출렁이는 중이면 그 각도에서 이어 받는다
    const wobble = (delay = 0): void => {
      if (!canAnimate(rocker)) return;
      const from = angle();
      rocking?.cancel();
      const r = (deg: number, offset: number) => ({ transform: `rotate(${deg}deg)`, offset, easing: "ease-in-out" });
      rocking = rocker.animate([r(from, 0), r(-1.8, 0.22), r(1.1, 0.52), r(-0.5, 0.78), r(0, 1)], { duration: WOBBLE_MS, delay, fill: "backwards" });
    };
    // 체크 자리에서 미끄러져 온다(거의 직선, 도착할수록 느려짐 — 던지는 호 없음, D-050). 도착 자리는 매 프레임 다시 잰다(축소·스크롤 중에도)
    const glide = (code: string, from: Element, stone: HTMLImageElement): void => {
      const start = from.getBoundingClientRect();
      const sx = start.left + start.width / 2;
      const sy = start.top + start.height / 2;
      const tilt = (SLOTS[slotOf.get(code) ?? 0] as Slot).tilt;
      const fly = stoneImage(category);
      fly.className = "fly-stone";
      fly.style.setProperty("opacity", "0");
      fly.style.setProperty("transform", `translate(${sx - STONE / 2}px, ${sy - STONE / 2}px) scale(0.8)`);
      document.body.append(fly);
      stone.style.setProperty("opacity", "0");
      const t0 = performance.now();
      let frame = 0;
      let dir = 0;
      const finish = (): void => {
        cancelAnimationFrame(frame);
        gliding.delete(code);
        fly.remove();
      };
      const tick = (now: number): void => {
        if (!root.isConnected) {
          finish();
          return;
        }
        const t = Math.max(0, Math.min(1, (now - t0) / GLIDE_MS));
        const k = 1 - (1 - t) ** 3;
        const b = stone.getBoundingClientRect();
        const scale = root.offsetWidth ? root.getBoundingClientRect().width / root.offsetWidth : 1;
        const ex = b.left + b.width / 2;
        const ey = b.top + b.height / 2 - DROP * scale;
        if (!dir) dir = ex >= sx ? 1 : -1;
        const x = sx + (ex - sx) * k;
        const y = sy + (ey - sy) * k;
        const turn = tilt - dir * 50 * (1 - k);
        const size = scale * (0.8 + 0.2 * Math.min(1, t / 0.15));
        fly.style.setProperty("transform", `translate(${x - STONE / 2}px, ${y - STONE / 2}px) rotate(${turn}deg) scale(${size})`);
        fly.style.setProperty("opacity", String(Math.min(1, t / 0.1)));
        if (t < 1) {
          frame = requestAnimationFrame(tick);
          return;
        }
        finish();
        stone.style.removeProperty("opacity");
        if (canAnimate(stone)) stone.animate([{ translate: `0 ${-DROP}px` }, { translate: "0 0" }], { duration: SETTLE_MS, easing: "cubic-bezier(.25,.75,.35,1)" });
        wobble(SETTLE_MS * 0.5);
      };
      gliding.set(code, finish);
      frame = requestAnimationFrame(tick);
    };
    const remove = (code: string): void => {
      const stone = placed.get(code);
      if (!stone) return;
      slotOf.delete(code);
      placed.delete(code);
      const flying = gliding.get(code);
      if (flying) {
        flying();
        stone.remove();
        return;
      }
      if (!canAnimate(stone)) {
        stone.remove();
        return;
      }
      // 올라오며 사라지는 동안은 담긴 돌이 아니다
      stone.classList.add("is-leaving");
      stone
        .animate(
          [
            { opacity: 1, translate: "0 0" },
            { opacity: 0, translate: "0 -12px" }
          ],
          { duration: FADE_MS, easing: "ease-out", fill: "forwards" }
        )
        .finished.then(
          () => stone.remove(),
          () => stone.remove()
        );
    };
    const add = (code: string, from: Element | null = null): void => {
      if (slotOf.has(code)) return;
      let slot = freeSlot();
      let lap = 0;
      if (slot < 0) {
        // 가득 찼다: 가장 오래된 돌을 조용히 보내고 그 자리를 다시 쓴다(총량이 그대로)
        const oldest = slotOf.keys().next().value as string;
        slot = slotOf.get(oldest) ?? 0;
        reused += 1;
        lap = reused;
        remove(oldest);
      }
      const stone = makeStone(slot, lap);
      slotOf.set(code, slot);
      placed.set(code, stone);
      stones.append(stone);
      if (from && canAnimate(stone)) glide(code, from, stone);
    };
    for (const code of initial.slice(-SLOTS.length)) add(code);
    handle.current = { add, remove };
    return () => {
      for (const finish of [...gliding.values()]) finish();
      handle.current = null;
    };
  }, []);

  return (
    <div ref={node} class="bk" aria-hidden="true">
      <div ref={rock} class="bk-rock">
        <svg class="bk-art bk-back" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
          <path class="bk-handle" d="M10 40C7 -4 105 -4 102 40" />
          <ellipse class="bk-in" cx={CX} cy={RIM_Y} rx={RIM_RX} ry={RIM_RY} />
          <path class="bk-rim" d={`M${CX - RIM_RX} ${RIM_Y}A${RIM_RX} ${RIM_RY} 0 0 1 ${CX + RIM_RX} ${RIM_Y}`} />
        </svg>
        <div ref={layer} class="bk-stones" />
        <svg class="bk-art bk-front" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
          <path class="bk-wall" d={BODY} />
          <path class="bk-weft" d={LINES.slice(1, -1).map(curve).join("")} />
          <path class="bk-warp" d={WEAVE} />
          <path class="bk-rim" d={`M${CX - RIM_RX} ${RIM_Y}A${RIM_RX} ${RIM_RY} 0 0 0 ${CX + RIM_RX} ${RIM_Y}`} />
          <path class="bk-lip" d={`M${CX - RIM_RX + 6} ${RIM_Y + 1}A${RIM_RX - 6} ${RIM_RY - 2} 0 0 0 ${CX + RIM_RX - 6} ${RIM_Y + 1}`} />
        </svg>
      </div>
    </div>
  );
}
