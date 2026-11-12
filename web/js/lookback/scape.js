// 내 기준 흐름의 장면(TASK-LOOKBACK-01 시안 7판). 화면 아래에 폭 끝까지 깔리고, 아래 버튼 줄은 이 장면 안의 가까운 언덕 위에 얹힌다(완료 화면과 같은 짜임).
// 7판에서 6판의 '아침 길 들머리'(해가 언덕에 반쯤 묻힌 장면)와 '나의 돌'을 걷고 다시 그렸다. 무엇을 왜 그렸는지는 tasks/lookback/2026-11-12/ROUND7.md의 근거 표.
//   - 해는 늘 하늘에 있다(먼 언덕 마루보다 위). 물에 비친 해는 해의 바로 아래에 있다 — 장면이 실제 빛의 방향과 어긋나지 않게 한다.
//   - 모양은 모두 둥근 곡선이다(뾰족한 모서리 없음). 팻말도 화살 모양이 아니라 둥근 판이다.
//   - 가까운 곳의 큰 나무(그늘)와 먼 곳의 트인 언덕·물이 한 장면에 있다. 길은 물가로 이어진다.
//   - 반복되는 움직임은 구름 하나뿐이고 아주 느리다(움직임 줄이기에서는 멈춘다).
// 좌표는 360×300 설계 상자이고 상자 아래 가운데에 맞춰 그린다(preserveAspectRatio xMidYMax meet). 언덕은 상자 옆으로 더 뻗어 넓은 화면도 채우고,
// 상자보다 높은 자리는 하늘(흰 바탕)이 된다. 장식이라 낭독기에 읽히지 않는다(aria-hidden). 사용자가 쓴 글에 반응하지 않는다.
import { el } from "../dom.js";

const W = 360, H = 420;
function road() { // 아래(가까운 곳)는 넓고 물가(먼 곳)로 갈수록 좁아지는 흰 길
  const l = [], r = [];
  for (let i = 0; i <= 24; i += 1) {
    const t = i / 24, y = H - t * 134, cx = 190 + 22 * Math.sin(t * Math.PI * 1.2 + 0.4) * (1 - 0.5 * t), w = 92 * (1 - t) ** 1.3 + 3;
    l.push(`${(cx - w / 2).toFixed(1)} ${y.toFixed(1)}`); r.push(`${(cx + w / 2).toFixed(1)} ${y.toFixed(1)}`);
  }
  return `M${l.join("L")}L${r.reverse().join("L")}Z`;
}
const circles = (cls, list) => list.map(([cx, cy, rr]) => `<circle class="${cls}" cx="${cx}" cy="${cy}" r="${rr}"/>`).join("");
const cloud = (x, y, k) => `<g class="lbs-cloud" style="--d:${k}">${circles("", [[x - 16, y + 4, 10], [x, y - 3, 14], [x + 17, y + 3, 11]])}<rect x="${x - 26}" y="${y + 2}" width="54" height="12" rx="6"/></g>`;
const ROAD = road();

// compact: 노트가 있는 화면(기준 쓰기·실천 ①)은 아래쪽 땅만 잘라 보인다(설계 상자 y 196~420). 해는 틀 밖 위에 있고, 나무는 잘리지 않게 조금 먼 곳의 작은 나무로 선다.
function art({ tree, pond, sign, compact }) {
  return `<svg class="lbs-art" viewBox="0 ${compact ? 196 : 0} ${W} ${compact ? H - 196 : H}" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
<g class="lbs-sun"><circle class="lbs-ring" cx="292" cy="70" r="36" style="stroke-width:2"/><circle class="lbs-ring" cx="292" cy="70" r="27"/><circle class="lbs-disc" cx="292" cy="70" r="19"/></g>
${cloud(156, 120, 0)}${cloud(232, 160, 1)}
<path class="lbs-far" d="M-400 230L0 230C60 212 130 208 200 220C260 230 320 218 360 212L760 212L760 ${H}L-400 ${H}Z"/>
${circles("lbs-treeline", [[300, 220, 5], [312, 217, 7], [325, 214, 9], [339, 215, 6], [351, 212, 8], [366, 211, 7]])}
<path class="lbs-mid" d="M-400 275L0 275C90 250 200 250 360 272L760 272L760 ${H}L-400 ${H}Z"/>
${pond ? `<ellipse class="lbs-pond" cx="250" cy="290" rx="52" ry="8.5"/><ellipse class="lbs-glint" cx="291" cy="289.5" rx="9" ry="2"/><path class="lbs-ripple" d="M216 293.5h16M256 287h12"/>` : ""}
${sign ? `<path class="lb-sign-post" d="M151.6 278h2.8v29h-2.8z"/><rect class="lb-sign-board" x="139" y="267" width="28" height="15" rx="5"/>` : ""}
<path class="lbs-near" d="M-400 322L0 322C110 302 240 306 360 326L760 326L760 ${H}L-400 ${H}Z"/>
<path class="lbs-road" d="${ROAD}"/>
${tree ? `<g${compact ? ` transform="translate(42 344) scale(.6) translate(-42 -344)"` : ""}><ellipse class="lbs-shade" cx="44" cy="343" rx="54" ry="8"/><path class="lbs-trunk" d="M32 344C36 300 37 262 37 226L47 226C47 262 48 300 52 344Z"/><path class="lbs-trunk" d="M44 262C54 248 64 240 76 234L78 239C67 245 58 252 47 268Z"/>
${circles("lbs-canopy", [[-22, 206, 18], [-12, 232, 30], [8, 204, 34], [40, 218, 40], [74, 228, 22], [92, 212, 13], [70, 198, 28], [34, 176, 30], [58, 168, 16], [10, 168, 18]])}</g>` : ""}
</svg>`;
}

// tree: 가까운 큰 나무와 그늘 · pond: 먼 물가 · sign: 길가의 둥근 팻말 · story: 장면을 그대로 말하는 한 줄(하늘에, 나무와 해 사이)
// land: 이 그림 대신 놓을 다른 장면(다시 읽기는 그날 완료 화면의 언덕) · foot: 장면 안 가까운 언덕 위에 얹히는 버튼 줄
// compact: 아래쪽 땅만(위 참고). 장면 설명 줄은 하늘이 있는 장면에만 놓인다.
export function scape({ tree = true, pond = true, sign = false, compact = false, story = null, land = null, foot = null, cls = "" } = {}) {
  const box = el("div", { class: `lb-scape${compact ? " compact" : ""} ${cls}`.trim() });
  if (land) box.append(land);
  else { const art0 = el("div", { class: "lbs-holder", "aria-hidden": "true" }); art0.innerHTML = art({ tree, pond, sign, compact }); box.append(art0); }
  if (story && !compact) box.append(el("p", { class: "lbs-story", text: story }));
  if (foot) box.append(foot);
  return box;
}
