// 오늘 화면의 어두운 숲(D-062·D-067·D-072·D-084) — 시안 web/js/components/forest.js renderForest·igniteAll·spreadLight를 옮겼다(TASK-JOURNAL-01 J-7).
// 숲 속 안: 촘촘한 나무 층 사이로 회색 길, 뿌리 옆 작은 식물, 계열마다 하나씩 조약돌 아홉(먼·가운데·가까운 겹 사이에 끼워 앞 나무가 뒤 돌을 가린다).
// 가운데 돌 하나가 유일한 조작이다. 숲·조약돌은 스크린리더에게 장식이고 상태는 돌의 이름과 돌 아래 문구가 말한다.
// 그림은 Preact SVG로 그린다 — style 속성·innerHTML 없이(CSP). 겹 순서·조약돌 자리 같은 값은 CSSOM(Preact style 객체)으로 준다.

import type { ComponentChildren } from "preact";
import { pebbleUrl, stoneUrl } from "../lib/art";
import { prefersReducedMotion } from "../lib/motion";
import { buildForest, H, LAYER_Z, type Plants, type Tree, W } from "./forestArt";

const pct = (v: number, total: number) => `${((v / total) * 100).toFixed(3)}%`;

function Trees({ trees, cls }: { trees: readonly Tree[]; cls: string }) {
  return (
    <g class={cls}>
      {trees.map((tree, i) =>
        "pine" in tree ? (
          <path key={i} d={tree.pine} />
        ) : (
          <g key={i}>
            <rect x={tree.rect[0].toFixed(1)} y={tree.rect[1].toFixed(1)} width={tree.rect[2].toFixed(1)} height={tree.rect[3].toFixed(1)} />
            {tree.circles.map(([cx, cy, r], k) => (
              <circle key={k} cx={cx.toFixed(1)} cy={cy.toFixed(1)} r={r.toFixed(1)} />
            ))}
          </g>
        )
      )}
    </g>
  );
}

const PlantPaths = ({ acc, cls = "" }: { acc: Plants; cls?: string }) => (
  <>
    <path class={`f-pl-a${cls}`} d={acc.a} />
    <path class={`f-pl-b${cls}`} d={acc.b} />
    <path class={`f-pl-c${cls}`} d={acc.c} />
  </>
);

function Plate({ z, fore = false, children }: { z: number; fore?: boolean; children: ComponentChildren }) {
  return (
    <div class={fore ? "forest-fore" : "forest-art"} style={{ zIndex: String(z) }}>
      <svg class="forest-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        {children}
      </svg>
    </div>
  );
}

const RoadFill = ({ id }: { id: string }) => (
  <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" class="f-road-far" />
    <stop offset="1" class="f-road-near" />
  </linearGradient>
);

export interface ForestProps {
  /** 그날 고른 계열(있으면 그 조약돌이 켜져 있다). null이면 모두 숲에 묻혀 있다 */
  chosen: ReadonlySet<string> | null;
  caption: string;
  /** 돌의 이름(낭독기) — 상태마다 다르다 */
  stoneLabel: string;
  onStart: (stone: HTMLButtonElement) => void;
  loading?: boolean;
  failed?: boolean;
  /** 돌 아래 줄(쓰던 글 칩·알림·지난 날 글·다시 시도) */
  children?: ComponentChildren;
}

export function Forest({ chosen, caption, stoneLabel, onStart, loading = false, failed = false, children }: ForestProps) {
  const art = buildForest();
  const spots = [...art.spots].sort((p, q) => p.y - q.y);
  return (
    <div class={`forest${chosen ? " recorded" : ""}${loading ? " loading" : ""}${failed ? " failed" : ""}`}>
      <div class="forest-box">
        <Plate z={LAYER_Z.art[0]}>
          <defs>
            <RoadFill id="fpath-far" />
          </defs>
          <rect class="f-sky" width={W} height={H} />
          {art.stars.map((dot, i) => (
            <circle key={i} class="f-star" cx={dot.cx.toFixed(1)} cy={dot.cy.toFixed(1)} r={dot.r.toFixed(1)} style={{ "--sd": `${dot.sd.toFixed(2)}s` }} />
          ))}
          <Trees trees={art.far} cls="f-tree-far" />
          <path class="f-ground-far" d={art.groundFar} />
          <PlantPaths acc={art.plants[0]} />
          <path d={art.road} fill="url(#fpath-far)" />
          <g class="f-tree-far">
            {art.farEnd.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        </Plate>
        <Plate z={LAYER_Z.art[1]}>
          <defs>
            <RoadFill id="fpath-mid" />
            <clipPath id="fground-mid">
              <path d={art.groundMid} />
            </clipPath>
          </defs>
          <Trees trees={art.mid} cls="f-tree-mid" />
          <path class="f-ground-mid" d={art.groundMid} />
          <path d={art.road} fill="url(#fpath-mid)" clip-path="url(#fground-mid)" />
          <PlantPaths acc={art.plants[1]} />
        </Plate>
        <Plate z={LAYER_Z.art[2]}>
          <g class="f-tree-near">
            {art.near.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          <g class="f-tree-edge">
            {art.edge.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          <PlantPaths acc={art.plants[2]} cls=" f-near" />
          {art.flies.map((dot, i) => (
            <circle key={i} class="f-fly" cx={dot.cx.toFixed(1)} cy={dot.cy.toFixed(1)} r={dot.r.toFixed(1)} style={{ "--sd": `${dot.sd.toFixed(2)}s` }} />
          ))}
        </Plate>
        {spots.map((p, i) => {
          const on = chosen ? chosen.has(p.key) : null;
          return (
            <div
              key={p.key}
              class={`pb${on === true ? " on" : on === false ? " off" : ""}`}
              data-cat={p.key}
              style={{
                left: pct(p.x - p.w / 2, W),
                top: pct(p.y - p.w / 2, H),
                width: pct(p.w, W),
                "--k": `var(--${p.key}-500)`,
                "--k3": `var(--${p.key}-300)`,
                "--r": `${p.rot}deg`,
                "--z": String(LAYER_Z.pebble[p.band]),
                "--dp": (p.band / 2).toFixed(2),
                "--dur": `${(3.4 + (i % 5) * 0.35).toFixed(2)}s`,
                "--d": `${(-((i * 0.7) % 4)).toFixed(2)}s`
              }}
            >
              <i class="halo" />
              <img src={pebbleUrl(p.key, 36)} alt="" />
            </div>
          );
        })}
        {art.fore.map((acc, band) => (
          <Plate key={band} z={LAYER_Z.fore[band] as number} fore>
            <PlantPaths acc={acc} cls=" f-fore" />
          </Plate>
        ))}
        <i class="halo0" />
        <i class="ring" />
        <i class="ring b" />
        <button
          type="button"
          class="stone"
          aria-label={stoneLabel}
          aria-disabled={failed || loading ? "true" : undefined}
          onClick={(event) => {
            if (!failed && !loading) onStart(event.currentTarget);
          }}
        >
          <span class="hop">
            <span class="rock">
              <img class="stone-img" src={stoneUrl("rest")} alt="" />
              <img class="stone-img lit" src={stoneUrl("lit")} alt="" />
            </span>
          </span>
        </button>
        <p class="cap" aria-hidden="true" hidden={failed}>
          {caption}
        </p>
        {children}
      </div>
    </div>
  );
}

/** 가운데 돌을 누르면 숲의 조약돌이 돌에서 가까운 것부터 차례로 모두 켜진다(D-067) — 저장 값과 무관한 순간 연출 */
export function igniteAll(forest: Element, stone: Element): void {
  const o = stone.getBoundingClientRect();
  const ox = o.left + o.width / 2;
  const oy = o.top + o.height / 2;
  const items = [...forest.querySelectorAll<HTMLElement>(".pb")].map((pb) => {
    const r = pb.getBoundingClientRect();
    return [pb, Math.hypot(r.left + r.width / 2 - ox, r.top + r.height / 2 - oy)] as const;
  });
  const far = Math.max(...items.map(([, d]) => d), 1);
  for (const [pb, d] of items) pb.style.setProperty("--ld", `${Math.round((d / far) * 480)}ms`);
  forest.classList.add("ignite");
}

/** 돌에서 흰빛이 화면 전체로 퍼진다. 거의 덮이면 onCover(다음 화면으로)를 부르고, 그 아래 흰 화면이 열리며 빛이 걷힌다(D-062). 움직임 줄이기면 짧게 바뀐다 */
export function spreadLight(origin: Element, onCover: () => void): void {
  const reduced = prefersReducedMotion();
  const ms = Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue(reduced ? "--stone-flood-reduced" : "--stone-flood"), 10) || (reduced ? 250 : 1500);
  const r = origin.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const far = Math.max(Math.hypot(cx, cy), Math.hypot(innerWidth - cx, cy), Math.hypot(cx, innerHeight - cy), Math.hypot(innerWidth - cx, innerHeight - cy));
  const size = Math.ceil((2 * far) / 0.7) + 40;
  const flood = document.createElement("div");
  flood.className = "flood";
  flood.setAttribute("aria-hidden", "true");
  flood.style.setProperty("--fx", `${cx}px`);
  flood.style.setProperty("--fy", `${cy}px`);
  flood.style.setProperty("--fs", `${size}px`);
  const disc = document.createElement("i");
  disc.className = "disc";
  flood.append(disc);
  document.body.append(flood);
  let covered = false;
  const cover = (): void => {
    if (covered) return;
    covered = true;
    onCover();
  };
  window.setTimeout(cover, ms * 0.8);
  if (typeof disc.animate !== "function") {
    cover();
    window.setTimeout(() => flood.remove(), ms);
    return;
  }
  const grow = reduced
    ? disc.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms, fill: "forwards" })
    : disc.animate([{ transform: "translate(-50%,-50%) scale(.05)" }, { transform: "translate(-50%,-50%) scale(1)" }], { duration: ms, easing: "cubic-bezier(.35,.05,.5,1)", fill: "forwards" });
  grow.finished.then(
    () =>
      flood
        .animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduced ? 150 : 450, easing: "ease-out", fill: "forwards" })
        .finished.then(
          () => flood.remove(),
          () => flood.remove()
        ),
    () => flood.remove()
  );
}
