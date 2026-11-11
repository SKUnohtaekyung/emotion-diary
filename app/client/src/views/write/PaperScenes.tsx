// 글 쓰는 네 단계의 장면(D-069) — 시안 web/js/components/notes.js·reason.js를 옮겼다(좌표·자리표 그대로, TASK-JOURNAL-01 J-4).
//   있었던 일 = 길의 시작·아침: 줄 종이 노트(+.5°), 이른 아침 언덕·흰 길·시작하는 돌
//   이유     = 줄 노트(−.6°)·민트 테이프, 언덕 위에 이번에 고른 친구들(같은 크기, 손으로 정한 자리표)
//   칭찬     = 크림 쪽지 셋, 해가 높이 뜬 언덕과 이번에 고른 계열의 조약돌
//   감사     = 끈에 꿴 카드 셋, 노을 띠와 언덕, 작은 등불
// 입력 칸(라벨·글 칸)은 단계(steps.tsx)가 만들어 children으로 넘긴다 — 저장·검증은 거기 그대로다.
// 장면은 장식이다(aria-hidden). 쓴 글의 내용·길이에 반응하지 않고 점수·보상·누적을 말하지 않는다. 그림은 문서 흐름 안에 있고
// 시안의 sticky 가까운 언덕·버튼 줄은 흐름 안으로 옮겼다(D-123, MAP R2) — 가까운 언덕은 장면 맨 아래에, 버튼 줄은 그 바로 뒤에 선다.

import type { ComponentChildren } from "preact";
import { useLayoutEffect, useRef } from "preact/hooks";
import { CATEGORIES } from "../../../../shared/taxonomy";
import { categoryLabel } from "../../write/flow";
import { FRIENDS, friendUrl, pebbleUrl, stoneUrl } from "../../lib/art";
import { anyOverlap, watchFreeGrid } from "../../ui/freeGrid";

type Geo = { l: number; r: number; ry: number };

// 언덕은 위쪽 모서리가 타원인 상자다(좌우 l·r은 폭의 %, 세로 반지름 ry는 rem). 그 마루가 폭의 x% 자리에서 꼭대기보다 내려온 만큼(rem)을 구해
// 나무·등불의 밑동이 마루에 닿게 한다. CSS(.nt-hill)가 같은 변수로 그리므로 어긋나지 않는다.
const drop = (x: number, { l, r, ry }: Geo): number => {
  const cx = (l + 100 - r) / 2;
  const rx = (100 - r - l) / 2;
  const d = Math.min(1, Math.abs(x - cx) / rx);
  return ry * (1 - Math.sqrt(1 - d * d));
};
const hillVars = ({ l, r, ry }: Geo) => ({ "--l": `${l}%`, "--r": `${r}%`, "--ry": `${ry}rem` });
const Hill = ({ kind, geo }: { kind: string; geo: Geo }) => <i class={`nt-hill ${kind}`} style={hillVars(geo)} />;
const Tree = ({ x, r, geo }: { x: number; r: number; geo: Geo }) => (
  <i class="nt-tree" style={{ "--x": `${x}%`, "--r": String(r), "--dy": `${drop(x, geo).toFixed(3)}rem` }} />
);
/** 맨 앞의 가까운 언덕 — 장면 맨 아래. 버튼 줄이 그 바로 뒤에 같은 색으로 이어진다 */
const Near = ({ geo }: { geo: Geo }) => (
  <div class="nt-base" aria-hidden="true">
    <i style={hillVars(geo)} />
  </div>
);

// 흰 길: 아래(가까운 곳)는 넓고 위(먼 곳)는 좁게 한 굽이 돈다. 시작하는 돌은 t=0의 중심(ROAD_X0)에 놓는다.
const roadCx = (t: number): number => 47 + 14 * (1 - 0.55 * t) * Math.sin(t * Math.PI * 1.35 + 0.35);
const roadW = (t: number): number => 44 * (1 - t) ** 1.35 + 1.4;
const ROAD_X0 = roadCx(0);
function roadPath(): string {
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= 28; i += 1) {
    const t = i / 28;
    const y = (100 - t * 100).toFixed(2);
    left.push(`${(roadCx(t) - roadW(t) / 2).toFixed(2)} ${y}`);
    right.push(`${(roadCx(t) + roadW(t) / 2).toFixed(2)} ${y}`);
  }
  return `M${left.join("L")}L${right.reverse().join("L")}Z`;
}
const ROAD = roadPath();

/** 장면 뿌리. 그림 조각(빈 i·장식 img·svg)은 읽히지 않고 설명 한 줄(.nt-story)만 읽힌다 */
function Scene({ kind, paper, children }: { kind: string; paper: ComponentChildren; children: ComponentChildren }) {
  return (
    <div class={`nt-scene nt-${kind}`}>
      {paper}
      {children}
    </div>
  );
}

// ── 있었던 일 — 이 단계는 감정을 고르기 전이라 친구도 조약돌도 세우지 않는다 ──
const EVENT = { far: { l: -70, r: -30, ry: 3.5 }, mid: { l: -20, r: -60, ry: 3 }, near: { l: -30, r: -40, ry: 2 } };
export function EventScene({ day, children }: { day: string; children: ComponentChildren }) {
  return (
    <Scene
      kind="event"
      paper={
        <div class="nt-sheet">
          <div class="nt-paper">{children}</div>
        </div>
      }
    >
      <div class="nt-land" style={{ "--rx": `${ROAD_X0.toFixed(2)}%` }}>
        <i class="nt-haze" />
        <i class="nt-sun dawn" />
        <Hill kind="far" geo={EVENT.far} />
        <Tree x={12} r={6.5} geo={EVENT.far} />
        <Tree x={19} r={4.5} geo={EVENT.far} />
        <Tree x={91} r={5} geo={EVENT.far} />
        <Hill kind="mid" geo={EVENT.mid} />
        <svg class="nt-road" aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
          <path d={ROAD} />
        </svg>
        {/* 장면을 설명하는 한 줄 — 판단·평가·격려가 아니라 보이는 길과 지금 하는 일을 그대로 말한다(2026-10-13 QA R9) */}
        <p class="nt-story">{`${day} 하루를 돌아보는 길이에요`}</p>
        <span class="nt-stone">
          <img class="stone-img" src={stoneUrl("rest")} alt="" />
        </span>
        <Near geo={EVENT.near} />
      </div>
    </Scene>
  );
}

// ── 이유 — 언덕 위에 이번에 고른 친구들 ──
// 친구 그림(480px 원본)의 발 아래 투명 여백 비율 — 발끝이 같은 땅 선에 놓인다(시안 reason.js FOOT, 실측)
const FOOT: Record<string, number> = { enjoyment: 0.046, wish: 0.052, sadness: 0.083, anger: 0.115, joy: 0.113, love: 0.035, hate: 0.035, fear: 0.062, disgust: 0.085 };
type Spot = { x: number; top: number; tilt: number };
// 인원별 손자리표(시안 reason.js REASON_LAYOUTS): 크기는 수에 따라 전원이 같이 바뀐다(1~3명 96·4~6명 72·7~9명 58px, D-061 ④). 무작위 없음
const LAYOUTS: Record<number, { size: number; h: number; items: Spot[] }> = {
  1: { size: 96, h: 152, items: [{ x: 50, top: 20, tilt: -5 }] },
  2: { size: 96, h: 158, items: [{ x: 27, top: 26, tilt: -6 }, { x: 73, top: 14, tilt: 5 }] },
  3: { size: 96, h: 172, items: [{ x: 17, top: 38, tilt: -5 }, { x: 50, top: 10, tilt: 4 }, { x: 83, top: 24, tilt: -6 }] },
  4: { size: 72, h: 152, items: [{ x: 8, top: 30, tilt: -6 }, { x: 40, top: 6, tilt: 5 }, { x: 68, top: 36, tilt: -4 }, { x: 94, top: 14, tilt: 6 }] },
  5: { size: 72, h: 192, items: [{ x: 4, top: 28, tilt: -6 }, { x: 50, top: 0, tilt: 5 }, { x: 96, top: 16, tilt: -4 }, { x: 27, top: 92, tilt: 6 }, { x: 73, top: 72, tilt: -5 }] },
  6: {
    size: 72,
    h: 260,
    items: [{ x: 8, top: 28, tilt: -6 }, { x: 36, top: 0, tilt: 5 }, { x: 64, top: 18, tilt: -4 }, { x: 92, top: 6, tilt: 3 }, { x: 36, top: 132, tilt: 6 }, { x: 92, top: 145, tilt: -5 }]
  },
  7: {
    size: 58,
    h: 254,
    items: [
      { x: 8, top: 24, tilt: -6 }, { x: 36, top: 0, tilt: 5 }, { x: 64, top: 16, tilt: -4 }, { x: 92, top: 6, tilt: 3 },
      { x: 22, top: 164, tilt: 6 }, { x: 50, top: 144, tilt: -6 }, { x: 78, top: 154, tilt: 5 }
    ]
  },
  8: {
    size: 58,
    h: 259,
    items: [
      { x: 8, top: 28, tilt: -6 }, { x: 36, top: 0, tilt: 5 }, { x: 64, top: 18, tilt: -4 }, { x: 92, top: 6, tilt: 3 },
      { x: 8, top: 150, tilt: 6 }, { x: 36, top: 130, tilt: -5 }, { x: 64, top: 160, tilt: 3 }, { x: 92, top: 140, tilt: -4 }
    ]
  },
  9: {
    size: 58,
    h: 249,
    items: [
      { x: 4, top: 30, tilt: -6 }, { x: 27, top: 2, tilt: 5 }, { x: 50, top: 16, tilt: -4 }, { x: 73, top: 38, tilt: 6 }, { x: 96, top: -10, tilt: 3 },
      { x: 16, top: 150, tilt: -5 }, { x: 39, top: 130, tilt: 4 }, { x: 62, top: 156, tilt: -6 }, { x: 85, top: 141, tilt: 5 }
    ]
  }
};
// 먼 언덕 마루의 작은 나무 셋 — 마음 고르기의 언덕과 같은 언덕이라는 표시(시안 reason.js TREES)
const REASON_TREES = [{ x: 10, r: 8, dy: 11 }, { x: 16, r: 5.5, dy: 7 }, { x: 91, r: 7, dy: 4 }];

/** 고른 계열을 taxonomy 선언 순서로(고른 순서나 심리 축으로 줄 세우지 않는다), 친구가 있는 것만 아홉까지 */
const inOrder = (codes: readonly string[]): string[] => CATEGORIES.map((item) => item.code).filter((code) => codes.includes(code) && FRIENDS[code]).slice(0, 9);

export function ReasonScene({ categories, children }: { categories: readonly string[]; children: ComponentChildren }) {
  const order = inOrder(categories);
  const layout = LAYOUTS[Math.max(1, order.length)] as (typeof LAYOUTS)[1];
  const list = useRef<HTMLUListElement>(null);
  useLayoutEffect(() => {
    const root = list.current;
    if (!root) return;
    // 큰 글자·겹침이면 3열 격자(D-083 ③, RK-027)
    return watchFreeGrid(root, { overlap: (node) => anyOverlap(node, ".rs-fr") });
  }, [order.join(",")]);
  return (
    <div class="rs-scene">
      <div class="rs-note">{children}</div>
      <div class={order.length ? "rs-land" : "rs-land empty"} style={{ "--rs-nominal": `${layout.size}px`, "--rs-h": `${layout.h}px` }}>
        <i class="rs-hill h1" aria-hidden="true" />
        {REASON_TREES.map((tree, i) => (
          <i class="rs-tree" aria-hidden="true" key={tree.x} style={{ "--x": `${tree.x}%`, "--r": String(tree.r), "--dy": `${tree.dy}px`, "--i": String(i) }} />
        ))}
        <i class="rs-hill h2" aria-hidden="true" />
        {order.length ? (
          <>
            {/* 장면을 설명하는 한 줄 — 친구가 하는 말이 아니고 감정을 판단하지 않는다 */}
            <p class="rs-story">
              고른 마음을 보며 이유를 떠올려 봐요
            </p>
            {/* 높이는 --rs-h(부모)를 CSS가 읽는다 — 격자에서 auto로 덮기 쉽게 */}
            <ul class="rs-friends" ref={list} aria-label="이번에 고른 마음">
              {order.map((code, i) => {
                const spot = layout.items[i] as Spot;
                return (
                  <li class="rs-fr" key={code} style={{ "--i": String(i), "--foot": String(FOOT[code] ?? 0.05), left: `${spot.x}%`, top: `${spot.top}px` }}>
                    <span class="rs-pic" style={{ "--tilt": `${spot.tilt}deg` }}>
                      <img class="friend-img" src={friendUrl(code, layout.size)} alt="" />
                    </span>
                    <span class="rs-nm">
                      <b>{FRIENDS[code]?.name}</b>
                      <small class="rs-cat">{categoryLabel(code)}</small>
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
        <div class="rs-base" aria-hidden="true">
          <i />
        </div>
      </div>
    </div>
  );
}

// ── 칭찬·감사 ──
// 조약돌은 모두 같은 크기(수에 따라 전원이 함께 바뀐다), 위치·기울기만 조금씩. 개수 글자·누적 표시·모으는 연출 없음(D-050)
const TILT = [-8, 6, -3, 9, -6, 4, -9, 7, -2];
function Pebbles({ categories }: { categories: readonly string[] }) {
  const order = CATEGORIES.map((item) => item.code).filter((code) => categories.includes(code));
  if (!order.length) return null;
  const size = order.length <= 3 ? 48 : order.length <= 5 ? 42 : order.length <= 7 ? 36 : 30;
  return (
    <div class="nt-pebbles" style={{ "--nt-peb": `${size}px` }}>
      {order.map((code, i) => (
        <span class="nt-peb" key={code} style={{ "--i": String(i), "--rot": `${TILT[i % TILT.length]}deg` }}>
          <img src={pebbleUrl(code, size)} alt="" />
        </span>
      ))}
    </div>
  );
}

const PRAISE = { far: { l: -45, r: -45, ry: 3.5 }, mid: { l: -10, r: -85, ry: 3 }, near: { l: -55, r: -10, ry: 2 } };
const THANKS = { mid: { l: -40, r: -45, ry: 3.25 }, near: { l: -10, r: -55, ry: 2 } };

/** 칭찬·감사 장면. 입력 묶음(fieldset)은 단계가 만들어 넘긴다 — 쪽지·카드는 각 입력의 바탕이다(.nt-slip·.nt-tag, 단계가 감싼다) */
export function NotesScene({ kind, categories, children }: { kind: "praise" | "thanks"; categories: readonly string[]; children: ComponentChildren }) {
  const desk = <div class="nt-desk">{children}</div>;
  if (kind === "thanks") {
    return (
      <Scene kind="thanks" paper={desk}>
        <div class="nt-land" aria-hidden="true">
          <i class="nt-dusk d1" />
          <i class="nt-dusk d2" />
          <Hill kind="mid" geo={THANKS.mid} />
          <Tree x={10} r={6} geo={THANKS.mid} />
          <Tree x={17} r={4.5} geo={THANKS.mid} />
          <div class="nt-lantern" style={{ "--x": "74%", "--dy": `${drop(74, THANKS.mid).toFixed(3)}rem` }}>
            <i class="nt-lglow g2" />
            <i class="nt-lglow g1" />
            <i class="nt-lpole" />
            <i class="nt-lamp" />
          </div>
          <Near geo={THANKS.near} />
        </div>
      </Scene>
    );
  }
  return (
    <Scene kind="praise" paper={desk}>
      <div class="nt-land" aria-hidden="true">
        <i class="nt-sun noon" />
        <Hill kind="far" geo={PRAISE.far} />
        <Tree x={80} r={6} geo={PRAISE.far} />
        <Tree x={87} r={4.5} geo={PRAISE.far} />
        <Hill kind="mid" geo={PRAISE.mid} />
        <Pebbles categories={categories} />
        <Near geo={PRAISE.near} />
      </div>
    </Scene>
  );
}
