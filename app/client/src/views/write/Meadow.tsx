// 마음 고르기 — 초록 언덕 위에 친구 아홉이 자유롭게 서 있는 장면(D-066 확정 — D-128). 시안 web/js/components/meadow.js를 옮겼다(좌표·길 계산 그대로).
// 배경은 land 초록 한 계열(하늘도 초록), 해·구름·조약돌 없음. 친구는 모두 같은 크기의 자리를 쓰고 위치·기울기만 다르다(크기로 우열을 만들지 않는다).
// 순서는 taxonomy 선언 순서 그대로 위에서 아래로 — 심리 축으로 배치하지 않는다. Tab 순서는 화면에서 읽는 순서와 같다.
// 글자가 크거나(뿌리 125%) 친구가 실제로 겹치면 3×3 격자로(D-083 ③ — ui/freeGrid.ts). 좁으면 2열.
// 친구는 쓴 글에 반응하지 않는다 — 고르면 이름 알약·✓·8% 커짐·한 번 통통뿐(DESIGN_SYSTEM §8.1).

import { useLayoutEffect, useRef } from "preact/hooks";
import { CATEGORIES } from "../../../../shared/taxonomy";
import { FRIENDS, friendUrl } from "../../lib/art";
import { anyOverlap, watchFreeGrid } from "../../ui/freeGrid";

const W = 360;
const H = 590;
const pct = (v: number, total: number) => `${((v / total) * 100).toFixed(3)}%`;

// 친구 블록(그림+이름+계열, 폭 78·높이 약 108)의 가운데 x, 위 y, 기울기 — 손으로 정한 자리(볼 때마다 같다)
const SPOTS = [
  { x: 48, y: 92, tilt: -7 },
  { x: 236, y: 64, tilt: 4 },
  { x: 140, y: 172, tilt: -2 },
  { x: 316, y: 160, tilt: 7 },
  { x: 46, y: 244, tilt: 6 },
  { x: 226, y: 262, tilt: -5 },
  { x: 136, y: 328, tilt: 3 },
  { x: 312, y: 312, tilt: -6 },
  { x: 222, y: 384, tilt: 2 }
] as const;

/** 아래에서 위로 좁아지며 두 굽이 도는 길 — 먼 언덕 마루의 나무 밑동까지 닿는다 */
function road(): string {
  const left: string[] = [];
  const right: string[] = [];
  for (let y = H; y >= 114; y -= 6) {
    const t = (H - y) / (H - 114);
    const cx = 198 + 46 * (1 - 0.45 * t) * Math.sin(t * Math.PI * 1.45 + 0.35);
    const w = 178 * (1 - t) ** 1.3 + 2;
    left.push(`${(cx - w / 2).toFixed(1)} ${y}`);
    right.push(`${(cx + w / 2).toFixed(1)} ${y}`);
  }
  return `M${left.join("L")}L${right.reverse().join("L")}Z`;
}
const ROAD = road();

const Tree = ({ x, y, r }: { x: number; y: number; r: number }) => (
  <>
    <rect class="ft-t" x={x - 1.6} y={y - r * 0.4} width="3.2" height={r * 1.4} rx="1.4" />
    <circle class="ft-c" cx={x} cy={y - r} r={r} />
  </>
);

export function Meadow({ picked, onToggle }: { picked: ReadonlySet<string>; onToggle: (code: string, pic: HTMLElement) => void }) {
  const scene = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = scene.current;
    if (!root) return;
    // 좁으면 2열·아니면 3열도 같은 프레임에서 정해 깜빡이지 않는다
    return watchFreeGrid(root, {
      overlap: (node) => anyOverlap(node, ".ff"),
      onFrame: (node) => node.style.setProperty("--fl-cols", node.getBoundingClientRect().width < 340 ? "2" : "3")
    });
  }, []);
  return (
    <div ref={scene} class="pick-scene">
      <div class="meadow-fit">
        {/* biome-ignore lint/a11y/useSemanticElements: 시안과 같은 토글 버튼 묶음 — fieldset은 자유 배치 상자의 크기 계산을 흐트러뜨린다 */}
        <div class="meadow" role="group" aria-label="오늘 머문 마음, 여러 개 선택">
          <div class="meadow-art-wrap">
            <svg class="meadow-art" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <path class="fh1" d={`M-720 128L0 128C50 104 120 100 190 116C250 130 310 110 360 118L1080 118L1080 ${H}L-720 ${H}Z`} />
              <path class="fh2" d={`M-720 206L0 206C80 178 190 176 262 200C310 216 340 208 360 204L1080 204L1080 ${H}L-720 ${H}Z`} />
              <path class="fh3" d={`M-720 316L0 316C100 286 220 284 300 312C330 322 350 318 360 314L1080 314L1080 ${H}L-720 ${H}Z`} />
              <path class="froad" d={ROAD} />
              <Tree x={148} y={113} r={7} />
              <Tree x={165} y={109} r={5.2} />
              <Tree x={352} y={117} r={6} />
            </svg>
          </div>
          {CATEGORIES.map((category, i) => {
            const spot = SPOTS[i] ?? SPOTS[0];
            const friend = FRIENDS[category.code]?.name ?? "";
            return (
              <button
                key={category.code}
                type="button"
                class="ff"
                data-category={category.code}
                aria-pressed={picked.has(category.code)}
                aria-label={`${friend}, ${category.label}`}
                style={{ "--x": pct(spot.x, W), "--y": pct(spot.y, H), "--tilt": `${spot.tilt}deg`, "--i": String(i) }}
                onClick={(event) => onToggle(category.code, event.currentTarget.querySelector<HTMLElement>(".ff-pic") ?? event.currentTarget)}
              >
                <span class="ff-pic">
                  <img class="friend-img" src={friendUrl(category.code, 106)} alt="" decoding="async" />
                  <i class="ff-ck" aria-hidden="true">
                    ✓
                  </i>
                </span>
                <b class="ff-nm">{friend}</b>
                <small>{category.label}</small>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** 켤 때 한 번 통통(움직임 줄이기에서는 CSS가 끈다). 같은 친구를 빨리 다시 켜도 처음부터 다시 돈다. */
export function hop(pic: HTMLElement): void {
  pic.classList.remove("hop");
  void pic.offsetWidth;
  pic.classList.add("hop");
}
