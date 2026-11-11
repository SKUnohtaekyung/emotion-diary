// 완료 `#/done/<날짜>`(UX_SPEC §4 9번) — 시안 web/js/views/write.js renderDone·components/land.js를 옮겼다(TASK-JOURNAL-01 J-5).
// 흰 하늘 아래 색 언덕 셋과 흰 길, 그 위에 그날 고른 친구와 조약돌만 선다(D-061). 짧은 사실 문장 하나 — 칭찬·성장·연속 기록 문구를 쓰지 않는다.
// 아래는 같은 폭 두 버튼 — `달력 보기`(보조, 그날을 고른 채)·`통계 보기`(주)(D-078). 버튼 줄은 고정하지 않고 언덕 바로 아래 같은 색 위에 선다(D-123).
// 친구는 모두 같은 크기(D-061 ④), taxonomy 선언 순서로 손으로 정한 자리표(1~9명, 무작위 없음). 큰 글자면 격자(D-083 ③ — 이 화면은 글자 크기만 본다).
// 고른 계열은 남기기가 넘겨준 것을 쓰고(rememberDone), 새로 고쳐 들어오면 그날 기록을 다시 읽는다 — 주소에 감정을 싣지 않는다.
// 지난 날의 글을 마무리했으면 작성 흐름이 `?day=past`를 붙인다 — '그날'로 말한다.

import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import { CATEGORIES } from "../../../shared/taxonomy";
import { FRIENDS, friendUrl, pebbleUrl } from "../lib/art";
import { announce } from "../lib/dom";
import { monthDayWeekday } from "../lib/format";
import { mountPreact } from "../lib/mount";
import { navigate, type ViewContext } from "../router";
import { watchFreeGrid } from "../ui/freeGrid";
import { fetchDiary } from "../write/api";
import { categoryLabel } from "../write/flow";
import { releaseWhiteout } from "./write/seal";

const handed = new Map<string, string[]>();

/** 남기기가 완료 화면에 그날 고른 계열을 넘긴다(한 날짜만 기억한다). */
export function rememberDone(date: string, categories: readonly string[]): void {
  handed.clear();
  handed.set(date, [...categories]);
}

const W = 360;
const H = 590;
const pct = (v: number, total: number) => `${((v / total) * 100).toFixed(3)}%`;

/** 아래에서 위로 좁아지며 한 굽이 도는 흰 길 */
function road(): string {
  const left: string[] = [];
  const right: string[] = [];
  for (let y = 590; y >= 306; y -= 6) {
    const t = (590 - y) / (590 - 306);
    const cx = 196 + 44 * (1 - 0.5 * t) * Math.sin(t * Math.PI * 1.5 + 0.5);
    const w = 214 * (1 - t) ** 1.25 + 1.5;
    left.push(`${(cx - w / 2).toFixed(1)} ${y}`);
    right.push(`${(cx + w / 2).toFixed(1)} ${y}`);
  }
  return `M${left.join("L")}L${right.reverse().join("L")}Z`;
}
const ROAD = road();

type Friend = { x: number; feet: number; tilt: number };
type Pebble = { w: number; x: number; y: number; r: number };
// 시안 land.js DONE_LAYOUTS 그대로 — 1~3명은 크게, 4~9명은 모두 88px. 조약돌은 자기 친구 발 옆(알파 픽셀 QA로 겹침 0을 확인한 자리)
const LAYOUTS: Record<number, { w: number; friends: Friend[]; pebbles: Pebble[] }> = {
  1: { w: 210, friends: [{ x: 70, feet: 428, tilt: -5 }], pebbles: [{ w: 46, x: 152, y: 441, r: 6 }] },
  2: {
    w: 164,
    friends: [{ x: 14, feet: 400, tilt: -3 }, { x: 180, feet: 372, tilt: 3 }],
    pebbles: [{ w: 44, x: 74, y: 408, r: 6 }, { w: 44, x: 240, y: 386, r: -7 }]
  },
  3: {
    w: 136,
    friends: [{ x: 17, feet: 280, tilt: -5 }, { x: 112, feet: 494, tilt: 4 }, { x: 214, feet: 336, tilt: -3 }],
    pebbles: [{ w: 42, x: 64, y: 295, r: 6 }, { w: 42, x: 65, y: 416.6, r: -7 }, { w: 42, x: 261, y: 345, r: 5 }]
  },
  4: {
    w: 88,
    friends: [{ x: 12, feet: 200, tilt: -6 }, { x: 88, feet: 250, tilt: 5 }, { x: 165, feet: 310, tilt: -4 }, { x: 235, feet: 380, tilt: 6 }],
    pebbles: [{ w: 38, x: 37, y: 195, r: -6 }, { w: 38, x: 113, y: 245, r: 5 }, { w: 38, x: 190, y: 305, r: -4 }, { w: 38, x: 260, y: 375, r: 6 }]
  },
  5: {
    w: 88,
    friends: [{ x: 12, feet: 190, tilt: -6 }, { x: 88, feet: 235, tilt: 5 }, { x: 165, feet: 290, tilt: -4 }, { x: 235, feet: 350, tilt: 6 }, { x: 12, feet: 410, tilt: -5 }],
    pebbles: [{ w: 38, x: 37, y: 185, r: -6 }, { w: 38, x: 113, y: 230, r: 5 }, { w: 38, x: 190, y: 285, r: -4 }, { w: 38, x: 260, y: 345, r: 6 }, { w: 38, x: 37, y: 405, r: -5 }]
  },
  6: {
    w: 88,
    friends: [
      { x: 12, feet: 180, tilt: -6 }, { x: 88, feet: 220, tilt: 5 }, { x: 165, feet: 270, tilt: -4 },
      { x: 235, feet: 325, tilt: 6 }, { x: 12, feet: 380, tilt: -5 }, { x: 88, feet: 430, tilt: 4 }
    ],
    pebbles: [
      { w: 34, x: 39, y: 193, r: -6 }, { w: 34, x: 115, y: 233, r: 5 }, { w: 34, x: 188, y: 283, r: -4 },
      { w: 34, x: 262, y: 338, r: 6 }, { w: 34, x: 39, y: 393, r: -5 }, { w: 34, x: 115, y: 443, r: 4 }
    ]
  },
  7: {
    w: 88,
    friends: [
      { x: 12, feet: 170, tilt: -6 }, { x: 88, feet: 208, tilt: 5 }, { x: 165, feet: 260, tilt: -4 }, { x: 235, feet: 315, tilt: 6 },
      { x: 12, feet: 365, tilt: -5 }, { x: 88, feet: 410, tilt: 4 }, { x: 165, feet: 465, tilt: -7 }
    ],
    pebbles: [
      { w: 34, x: 39, y: 183, r: -6 }, { w: 34, x: 115, y: 221, r: 5 }, { w: 34, x: 188, y: 273, r: -4 }, { w: 34, x: 262, y: 328, r: 6 },
      { w: 34, x: 39, y: 378, r: -5 }, { w: 34, x: 115, y: 423, r: 4 }, { w: 34, x: 152, y: 466, r: -7 }
    ]
  },
  8: {
    w: 88,
    friends: [
      { x: 12, feet: 165, tilt: -6 }, { x: 88, feet: 200, tilt: 5 }, { x: 165, feet: 252, tilt: -4 }, { x: 235, feet: 305, tilt: 6 },
      { x: 12, feet: 350, tilt: -5 }, { x: 88, feet: 395, tilt: 4 }, { x: 165, feet: 440, tilt: -7 }, { x: 235, feet: 480, tilt: 3 }
    ],
    pebbles: [
      { w: 30, x: 41, y: 180, r: -6 }, { w: 30, x: 117, y: 215, r: 5 }, { w: 30, x: 194, y: 267, r: -4 }, { w: 30, x: 264, y: 320, r: 6 },
      { w: 30, x: 41, y: 365, r: -5 }, { w: 30, x: 117, y: 410, r: 4 }, { w: 30, x: 194, y: 455, r: -7 }, { w: 30, x: 316, y: 471, r: 3 }
    ]
  },
  9: {
    w: 88,
    friends: [
      { x: 12, feet: 160, tilt: -6 }, { x: 88, feet: 195, tilt: 5 }, { x: 165, feet: 252, tilt: -4 }, { x: 235, feet: 300, tilt: 6 }, { x: 12, feet: 340, tilt: -5 },
      { x: 88, feet: 380, tilt: 4 }, { x: 165, feet: 422, tilt: -7 }, { x: 235, feet: 460, tilt: 3 }, { x: 12, feet: 495, tilt: 5 }
    ],
    pebbles: [
      { w: 30, x: 41, y: 175, r: -6 }, { w: 30, x: 117, y: 210, r: 5 }, { w: 30, x: 194, y: 267, r: -4 }, { w: 30, x: 264, y: 315, r: 6 }, { w: 30, x: 41, y: 355, r: -5 },
      { w: 30, x: 117, y: 395, r: 4 }, { w: 30, x: 194, y: 437, r: -7 }, { w: 30, x: 248, y: 471, r: 3 }, { w: 30, x: 105, y: 470, r: 5 }
    ]
  }
};

/** 그날 고른 계열을 taxonomy 선언 순서로(고른 순서와 무관), 친구가 있는 것만 아홉까지 */
export const doneOrder = (codes: readonly string[]): string[] =>
  CATEGORIES.map((item) => item.code).filter((code) => codes.includes(code) && FRIENDS[code]).slice(0, 9);

export function DoneLand({ categories }: { categories: readonly string[] }) {
  const order = doneOrder(categories);
  const layout = LAYOUTS[order.length];
  const land = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!land.current || !order.length) return;
    // 이 화면은 글자 크기만 본다 — 친구 그림은 상자가 거의 꽉 차 상자 겹침이 늘 참으로 잡힌다(시안 land.js)
    return watchFreeGrid(land.current);
  }, [order.join(",")]);
  return (
    <div class="land-fit">
      <div class="land" ref={land} data-n={String(order.length)}>
        <div class="land-art">
          <svg class="land-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <g class="sun-g">
              <circle class="sun" cx="280" cy="106" r="40" />
              <circle class="sun-ring" cx="280" cy="106" r="58" />
              <circle class="sun-ring thin" cx="280" cy="106" r="78" />
            </g>
            <path class="hill-far" d={`M-720 168L0 168C70 132 160 126 236 150C296 170 336 162 360 154L1080 154L1080 ${H}L-720 ${H}Z`} />
            <path class="hill-mid" d={`M-720 232L0 232C100 190 230 196 360 244L1080 244L1080 ${H}L-720 ${H}Z`} />
            <path class="hill-near" d={`M-720 330L0 330C120 296 250 306 360 350L1080 350L1080 ${H}L-720 ${H}Z`} />
            <path class="road" d={ROAD} />
          </svg>
        </div>
        {layout
          ? order.map((code, i) => {
              const friend = layout.friends[i] as Friend;
              const pebble = layout.pebbles[i] as Pebble;
              return (
                <div class="land-cell" key={code}>
                  <img
                    class="land-friend"
                    src={friendUrl(code, layout.w)}
                    alt={`${FRIENDS[code]?.name ?? ""}, ${categoryLabel(code)}`}
                    style={{
                      "--i": String(i),
                      left: pct(friend.x, W),
                      width: pct(layout.w, W),
                      "--bt": pct(H - friend.feet, H),
                      "--tilt": `${friend.tilt}deg`,
                      "--fw-px": `${layout.w}px`
                    }}
                  />
                  <img
                    class="land-pebble"
                    src={pebbleUrl(code, pebble.w)}
                    alt=""
                    style={{ left: pct(pebble.x, W), top: pct(pebble.y, H), width: pct(pebble.w, W), "--r": `${pebble.r}deg`, "--pw-px": `${pebble.w}px` }}
                  />
                </div>
              );
            })
          : null}
      </div>
    </div>
  );
}

function Done({ date, past }: { date: string; past: boolean }) {
  const day = past ? "그날" : "오늘";
  const message = `${day}의 마음을 남겼어요`;
  const [categories, setCategories] = useState<string[] | null>(() => handed.get(date) ?? null);
  useEffect(() => announce(message), [message]);
  useEffect(() => {
    // 봉인 연출의 흰 막은 이 화면이 자리 잡은 뒤에 걷는다(먼저 걷으면 바뀌는 중간이 보인다)
    const timer = window.setTimeout(releaseWhiteout, 80);
    let alive = true;
    if (categories === null) {
      void fetchDiary(date)
        .then((result) => {
          if (alive) setCategories(result.ok && result.data.status === "completed" ? result.data.categories.map((item) => item.categoryCode) : []);
        })
        .catch(() => alive && setCategories([]));
    }
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, []);
  return (
    <section class="screen done">
      <div class="done-head">
        <p class="done-date">{`${monthDayWeekday(date)} 기록`}</p>
        <h1 class="hero" tabIndex={-1}>
          {message}
        </h1>
      </div>
      <div class="done-land">{categories ? <DoneLand categories={categories} /> : null}</div>
      <div class="screen-actions pair done-bar">
        <button type="button" class="btn btn-quiet btn-block" onClick={() => navigate(`#/calendar?d=${date}`, { replace: true })}>
          달력 보기
        </button>
        <button type="button" class="btn btn-primary btn-block" onClick={() => navigate("#/stats", { replace: true })}>
          통계 보기
        </button>
      </div>
    </section>
  );
}

export function renderDone({ root, route }: ViewContext): () => void {
  return mountPreact(root, <Done date={route.params.date ?? ""} past={route.query.get("day") === "past"} />);
}
