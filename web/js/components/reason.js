// 이유 화면의 장면(D-069): 손으로 쓰는 종이 노트 한 장, 그리고 그 아래 초록 언덕에 나란히 서 있는 "이번에 고른" 친구들.
// field는 write.js가 만든 입력 묶음(라벨·textarea#reason·오류 문구)이다. 다시 만들지 않고 종이 안에 그대로 넣는다 — 저장·검증·오류 표시가 그 DOM에 걸려 있다.
// 친구는 말하지 않고 사용자가 쓰는 글에 반응하지 않는다(표정·대사·크기 변화 없음). 한 화면에서 모두 같은 크기이고, 몇 명이든 수만 다를 뿐 값어치는 같다.
// 모양과 움직임은 css/reason.css가 정한다. 장면은 문서 흐름 안에 있어 고정 위치로 화면을 덮지 않는다(모바일 키보드가 올라와도 글 쓰는 칸을 가리지 않는다).
import { el } from "../dom.js";
import { data, FRIENDS, category, friendImg } from "../data.js";
import { watchFreeGrid, anyOverlap } from "./land.js"; // 큰 글자·겹침이면 격자로(D-083 ③, RK-027) — land.js가 정본

// 친구 그림(480px 원본)의 발 아래 투명 여백 비율. 발끝이 같은 땅 선에 놓이고 이름이 발 바로 아래에 붙도록 맞춘다(알파 32 기준 실측, flat-friends/ui/*-480.png).
// 그림이 바뀌면 다시 재야 한다. 어긋나도 발끝 높이가 몇 px 달라 보일 뿐 동작에는 영향이 없다.
const FOOT = { enjoyment: 0.046, wish: 0.052, sadness: 0.083, anger: 0.115, joy: 0.113, love: 0.035, hate: 0.035, fear: 0.062, disgust: 0.085 };

// 크기는 수에 따라 전원이 같이 바뀐다(1~3명 96px·4~6명 72px·7~9명 58px, D-061 ④ 최소값 — 화면이 낮아도 줄지 않는다).
// 자리는 1~9명 각각 손으로 정했다(B1 완료 화면과 같은 방식 — 무작위 없음, taxonomy 순으로 위→아래·같은 높이대는 왼쪽→오른쪽에 배정).
// 설계 폭 336(.rs-land 안쪽 폭 근사)에 대한 %와, 위쪽 여백 top(px)·기울기(그림에만)로 잡았다. 4명까지는 한 "무리"(줄이 아니라 발높이를
// 흩어 놓은 띠) — 언덕 경사를 따라 가운데가 살짝 높고 가장자리가 낮다. 5명부터는 두 무리(위 3~5·아래 2~4)로 지금과 같은 두 줄 구조를
// 유지하되(낮은 화면에서 줄을 늘리지 않는다) 무리 안 발높이를 흩고 아래 무리의 가로 자리를 위 무리와 어긋나게 둬 세로줄로 안 겹친다.
// 어떤 인원도 발높이(top) 세 개 이상이 8px 안에 모이지 않는다(격자 지표) — 숫자는 실측 검산(스크립트) 대조 후 확정했다.
const REASON_LAYOUTS = {
  1: { size: 96, h: 152, items: [{ x: 50, top: 20, tilt: -5 }] },
  2: { size: 96, h: 158, items: [{ x: 27, top: 26, tilt: -6 }, { x: 73, top: 14, tilt: 5 }] },
  3: { size: 96, h: 172, items: [{ x: 17, top: 38, tilt: -5 }, { x: 50, top: 10, tilt: 4 }, { x: 83, top: 24, tilt: -6 }] },
  4: { size: 72, h: 152, items: [{ x: 8, top: 30, tilt: -6 }, { x: 40, top: 6, tilt: 5 }, { x: 68, top: 36, tilt: -4 }, { x: 94, top: 14, tilt: 6 }] },
  5: { size: 72, h: 192, items: [{ x: 4, top: 28, tilt: -6 }, { x: 50, top: 0, tilt: 5 }, { x: 96, top: 16, tilt: -4 }, { x: 27, top: 92, tilt: 6 }, { x: 73, top: 72, tilt: -5 }] },
  6: { size: 72, h: 260, items: [{ x: 8, top: 28, tilt: -6 }, { x: 36, top: 0, tilt: 5 }, { x: 64, top: 18, tilt: -4 }, { x: 92, top: 6, tilt: 3 }, { x: 36, top: 132, tilt: 6 }, { x: 92, top: 145, tilt: -5 }] },
  7: { size: 58, h: 254, items: [{ x: 8, top: 24, tilt: -6 }, { x: 36, top: 0, tilt: 5 }, { x: 64, top: 16, tilt: -4 }, { x: 92, top: 6, tilt: 3 }, { x: 22, top: 164, tilt: 6 }, { x: 50, top: 144, tilt: -6 }, { x: 78, top: 154, tilt: 5 }] },
  8: { size: 58, h: 259, items: [{ x: 8, top: 28, tilt: -6 }, { x: 36, top: 0, tilt: 5 }, { x: 64, top: 18, tilt: -4 }, { x: 92, top: 6, tilt: 3 }, { x: 8, top: 150, tilt: 6 }, { x: 36, top: 130, tilt: -5 }, { x: 64, top: 160, tilt: 3 }, { x: 92, top: 140, tilt: -4 }] },
  9: { size: 58, h: 249, items: [{ x: 4, top: 30, tilt: -6 }, { x: 27, top: 2, tilt: 5 }, { x: 50, top: 16, tilt: -4 }, { x: 73, top: 38, tilt: 6 }, { x: 96, top: -10, tilt: 3 }, { x: 16, top: 150, tilt: -5 }, { x: 39, top: 130, tilt: 4 }, { x: 62, top: 156, tilt: -6 }, { x: 85, top: 141, tilt: 5 }] }
};

// 먼 언덕 마루의 작은 나무 셋 — 마음 고르기의 초록 언덕(meadow)과 같은 언덕이라는 표시다(장식). x는 폭의 %, r은 나뭇잎 반지름(px),
// dy는 그 자리에서 마루가 언덕 꼭대기보다 내려온 만큼(px, 먼 언덕 모양 css/reason.css .rs-hill.h1에서 계산한 값)이라 나무 밑동이 마루에 닿는다.
const TREES = [{ x: 10, r: 8, dy: 11 }, { x: 16, r: 5.5, dy: 7 }, { x: 91, r: 7, dy: 4 }];

export function renderReasonScene({ cats = [], field }) {
  // 순서는 taxonomy 선언 순서다 — 고른 순서나 심리 축으로 줄 세우지 않는다.
  const order = data.categories.map((c) => c.code).filter((code) => cats.includes(code) && FRIENDS[code]);
  const n = Math.min(order.length, 9);
  const L = REASON_LAYOUTS[n];

  const friends = order.slice(0, n).map((code, i) => {
    const img = friendImg(code, { size: L.size, label: false }); // 이름이 그림 아래에 글자로 있으므로 그림은 장식이다
    img.removeAttribute("width"); img.removeAttribute("height"); // 크기는 CSS(--rs-size)가 정한다
    const p = L.items[i];
    return el("li", { class: "rs-fr", style: { "--i": String(i), "--foot": String(FOOT[code]), left: `${p.x}%`, top: `${p.top}px` } },
      el("span", { class: "rs-pic", style: { "--tilt": `${p.tilt}deg` } }, img),
      // 이름 아래에 그 친구가 맡은 대표 감정(계열 이름)을 함께 적는다 — 사용자 요청(2026-09-22). 친구·계열이 한 글자 묶음으로 읽히게 이름과 같은 링크 안에 둔다.
      // 기울기는 그림(.rs-pic)에만 준다 — 라벨은 수평을 유지하고 자기 그림 바로 아래에 그대로 붙는다.
      el("span", { class: "rs-nm" }, el("b", { text: FRIENDS[code].name }), el("small", { class: "rs-cat", text: category(code)?.label ?? "" })));
  });

  // 언덕 몸통: 먼 언덕·작은 나무·중간 언덕, 이야기 줄, 친구들. 친구가 없으면(cats가 비면) 언덕과 나무만 남는다.
  const land = el("div", { class: `rs-land${order.length ? "" : " empty"}`, style: { "--rs-nominal": `${L.size}px`, "--rs-h": `${L.h}px` } },
    el("i", { class: "rs-hill h1", "aria-hidden": "true" }),
    TREES.map((t, i) => el("i", { class: "rs-tree", "aria-hidden": "true", style: { "--x": `${t.x}%`, "--r": String(t.r), "--dy": `${t.dy}px`, "--i": String(i) } })),
    el("i", { class: "rs-hill h2", "aria-hidden": "true" }),
    order.length ? el("p", { class: "rs-story", text: "고른 마음이 곁에 있어요" }) : null, // 장면을 설명하는 한 줄이다. 친구가 하는 말이 아니고 감정을 판단하지 않는다.
    order.length ? el("ul", { class: "rs-friends", role: "list", "aria-label": "이번에 고른 마음" }, friends) : null); // 높이는 --rs-h(부모)를 css가 읽는다(격자 모드에서 auto로 덮어쓰기 쉽게 — inline이면 !important가 필요했다)

  if (order.length) watchFreeGrid(land.querySelector(".rs-friends"), { overlap: (r) => anyOverlap(r, ".rs-fr") });

  // rs-base: 맨 앞의 가까운 언덕. 아래 버튼 줄(.step-footer, 배경 투명)의 뒤에 sticky로 앉는다 — 화면이 길어 버튼 줄이 글 위에 떠 있는 동안에도 초록이 따라오고,
  // 끝까지 내리면 몸통의 언덕과 하나로 이어진다. JS 없이 CSS(sticky·z-index)만으로 동작한다.
  return el("div", { class: "rs-scene" }, el("div", { class: "rs-note" }, field), land, el("div", { class: "rs-base", "aria-hidden": "true" }, el("i")));
}
