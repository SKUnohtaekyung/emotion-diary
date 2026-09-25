// 마음 고르기 — 초록 언덕 위에 친구 아홉이 자유롭게 서 있는 장면(D-066 시안). 여러 개를 고를 수 있다(복수 선택).
// 배경은 프로젝트 초록(land 토큰) 한 계열뿐이다 — 해·구름·조약돌은 없고 하늘도 초록이다. 친구는 모두 같은 크기의 자리를 쓰고
// 위아래·좌우·기울기만 제멋대로다(크기로 우열을 만들지 않는다). 접근성은 토글 버튼 그룹(aria-pressed)이고 Tab 순서는 화면에서 읽는 순서(위→아래, 같은 높이대는 왼쪽부터)와 같다.
import { el, announce } from "../dom.js";
import { data, FRIENDS, friendImg } from "../data.js";
import { state, toggleCategory } from "../state.js";
import { watchFreeGrid, anyOverlap } from "./land.js"; // 큰 글자·겹침이면 격자로(D-083 ③, RK-027) — land.js가 정본

const W = 360, H = 590; // 설계 상자. 자리는 이 좌표이고 %로 옮겨 상자와 함께 커지고 줄어든다.
const pct = (v, total) => `${((v / total) * 100).toFixed(3)}%`;

// 친구 블록(그림+이름+계열, 폭 78·높이 약 108)의 가운데 x, 위 y, 기울기. taxonomy 선언 순서 그대로 위에서 아래로 내려온다 — 심리 축으로 배치하지 않는다.
// 블록끼리 겹치지 않고(가로·세로 3 이하) 40 이내 높이는 한 줄로 보아 왼쪽부터 읽는다. 어긋남은 손으로 정했다(무작위 아님: 볼 때마다 같다).
const SPOTS = [
  { x: 48, y: 92, tilt: -7 }, { x: 236, y: 64, tilt: 4 },
  { x: 140, y: 172, tilt: -2 }, { x: 316, y: 160, tilt: 7 },
  { x: 46, y: 244, tilt: 6 }, { x: 226, y: 262, tilt: -5 },
  { x: 136, y: 328, tilt: 3 }, { x: 312, y: 312, tilt: -6 },
  { x: 222, y: 384, tilt: 2 }
];

function road() { // 아래에서 위로 좁아지며 두 굽이 도는 길
  const left = [], right = [];
  for (let y = H; y >= 130; y -= 6) { // 먼 언덕 마루(y≈118) 바로 아래에서 끝나 하늘로 튀어나오지 않는다
    const t = (H - y) / (H - 130), cx = 198 + 46 * (1 - 0.45 * t) * Math.sin(t * Math.PI * 1.45 + 0.35), w = 178 * (1 - t) ** 1.3 + 2;
    left.push(`${(cx - w / 2).toFixed(1)} ${y}`); right.push(`${(cx + w / 2).toFixed(1)} ${y}`);
  }
  return `M${left.join("L")}L${right.reverse().join("L")}Z`;
}
const tree = (x, y, r) => `<rect class="ft-t" x="${x - 1.6}" y="${y - r * 0.4}" width="3.2" height="${r * 1.4}" rx="1.4"/><circle class="ft-c" cx="${x}" cy="${y - r}" r="${r}"/>`;
const SVG = `<svg class="meadow-art" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
<path class="fh1" d="M-720 128L0 128C50 104 120 100 190 116C250 130 310 110 360 118L1080 118L1080 ${H}L-720 ${H}Z"/>
<path class="fh2" d="M-720 206L0 206C80 178 190 176 262 200C310 216 340 208 360 204L1080 204L1080 ${H}L-720 ${H}Z"/>
<path class="fh3" d="M-720 316L0 316C100 286 220 284 300 312C330 322 350 318 360 314L1080 314L1080 ${H}L-720 ${H}Z"/>
<path class="froad" d="${road()}"/>
${tree(148, 113, 7)}${tree(165, 109, 5.2)}${tree(352, 117, 6)}</svg>`;

export function renderFriendMeadow() {
  const art = el("div", { class: "meadow-art-wrap" });
  art.innerHTML = SVG;
  const buttons = data.categories.map((c, i) => {
    const spot = SPOTS[i], friend = FRIENDS[c.code];
    const img = friendImg(c.code, { size: 106, label: false });
    img.removeAttribute("width"); img.removeAttribute("height");
    const pic = el("span", { class: "ff-pic" }, img, el("i", { class: "ff-ck", "aria-hidden": "true", text: "✓" }));
    const btn = el("button", { type: "button", class: "ff", "aria-pressed": String(state.draft.cats.includes(c.code)), "data-cat": c.code, "aria-label": `${friend.name}, ${c.label}`,
      style: { "--x": pct(spot.x, W), "--y": pct(spot.y, H), "--tilt": `${spot.tilt}deg`, "--i": String(i) } },
      pic, el("b", { class: "ff-nm", text: friend.name }), el("small", { text: c.label }));
    btn.addEventListener("click", () => {
      const on = toggleCategory(c.code);
      btn.setAttribute("aria-pressed", String(on));
      if (on) { pic.classList.remove("hop"); void pic.offsetWidth; pic.classList.add("hop"); } // 켤 때 한 번 통통 — 움직임 줄이기에서는 CSS가 끈다
      announce(`${friend.name}, ${c.label} ${on ? "선택됨" : "선택 해제됨"}, 지금 ${state.draft.cats.length}개 선택`);
      document.getElementById("catsError")?.setAttribute("hidden", "");
    });
    return btn;
  });
  const meadow = el("div", { class: "meadow", role: "group", "aria-label": "오늘 머문 마음, 여러 개 선택" }, art, ...buttons);
  const scene = el("div", { class: "pick-scene" }, el("div", { class: "meadow-fit" }, meadow));
  // 격자 열 수(좁으면 2열, 아니면 3열 — 이유·완료와 달리 마음 고르기만 좁을 때 2열로 준다)도 같은 프레임에서 정해 깜빡이지 않는다.
  watchFreeGrid(scene, {
    overlap: (r) => anyOverlap(r, ".ff"),
    onFrame: (r) => r.style.setProperty("--fl-cols", r.getBoundingClientRect().width < 340 ? "2" : "3")
  });
  return scene;
}
