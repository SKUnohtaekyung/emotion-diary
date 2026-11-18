// 감사 장면 시안 비교(시안 전용). 안마다 같은 화면 위쪽(카드 셋)에 다른 그림을 깐다. 그림은 360×320 SVG 하나 — 앱으로 옮길 때도 SVG 한 장으로 간다.
// 색은 design/tokens.json 값(land.hill-*, service.light, paper.*)에서 시작해 노을빛만 더했다. 페이지 색은 시안처럼 tokens.js가 변수로 올린다.
import { applyTokens } from "./tokens.js";

await applyTokens();

const C = {
  far: "#CFE9DD",
  mid: "#9FD3BE",
  near: "#5FB39B",
  treeDark: "#4E9F88",
  ink: "#24504A",
  warm: "#FFE3A3",
  warmCore: "#FFF7DC",
  glow: "#FFE9B8",
  envelope: "#D9B665"
};

// 언덕 셋 — 모든 안이 같은 땅을 쓴다(장면끼리 이어지게). 가까운 언덕 위에 버튼 줄이 앉는다.
const FAR = "M0,206 C58,188 120,184 182,193 C240,201 300,196 360,181 L360,320 L0,320 Z";
const MID = "M0,234 C66,216 146,211 222,222 C282,231 330,233 360,226 L360,320 L0,320 Z";
const NEAR = "M0,270 C84,252 196,249 280,257 C322,261 348,262 360,259 L360,320 L0,320 Z";

/** 하늘: 맨 위는 흰 바탕과 이음매 없이, 아래로 갈수록 노을빛 */
const sky = (id, mid, low) => `
  <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFFFFF"/>
    <stop offset=".45" stop-color="${mid}"/>
    <stop offset="1" stop-color="${low}"/>
  </linearGradient>`;
const glowGrad = (id, color, a = 0.85) => `
  <radialGradient id="${id}">
    <stop offset="0" stop-color="${color}" stop-opacity="${a}"/>
    <stop offset=".35" stop-color="${color}" stop-opacity="${(a * 0.45).toFixed(2)}"/>
    <stop offset="1" stop-color="${color}" stop-opacity="0"/>
  </radialGradient>`;

/** 둥근 나무: 줄기 + 잎 덩어리. 그늘은 어두운 원 위에 밝은 원을 오른쪽 위로 비껴 얹어 왼쪽 아래 가장자리에만 남긴다(빛은 오른쪽에서) */
function canopy(cx, cy, r, fill, shade) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${shade}"/><circle cx="${cx + r * 0.16}" cy="${cy - r * 0.12}" r="${r * 0.86}" fill="${fill}"/>`;
}
function tree(x, y, r, fill = C.near, shade = C.treeDark) {
  return `<g>
    <rect x="${x - 1.5}" y="${y - r * 1.25}" width="3" height="${r * 1.3}" rx="1.5" fill="${C.ink}" opacity=".75"/>
    ${canopy(x, y - r * 1.6, r, fill, shade)}
  </g>`;
}

/** 등불 기둥. s는 크기(1 = 기준). 바닥(x, y)에 선다 */
function lantern(x, y, s = 1, glowId = "lglow") {
  const h = 52 * s;
  const w = 22 * s;
  const top = y - h - 26 * s;
  return `<g>
    <circle class="tl-breathe" cx="${x}" cy="${top + 13 * s}" r="${64 * s}" fill="url(#${glowId})"/>
    <rect x="${x - 1.6 * s}" y="${top + 26 * s}" width="${3.2 * s}" height="${h}" rx="${1.6 * s}" fill="${C.ink}"/>
    <rect x="${x - 6 * s}" y="${y - 3 * s}" width="${12 * s}" height="${3 * s}" rx="${1.5 * s}" fill="${C.ink}"/>
    <path d="M${x - w / 2 - 3 * s},${top + 1 * s} L${x + w / 2 + 3 * s},${top + 1 * s} L${x + w / 2 - 3 * s},${top - 7 * s} L${x - w / 2 + 3 * s},${top - 7 * s} Z" fill="${C.ink}"/>
    <circle cx="${x}" cy="${top - 9 * s}" r="${2.2 * s}" fill="${C.ink}"/>
    <rect x="${x - w / 2}" y="${top + 1 * s}" width="${w}" height="${24 * s}" rx="${4 * s}" fill="${C.warm}"/>
    <rect x="${x - w / 2 + 4 * s}" y="${top + 5 * s}" width="${w - 8 * s}" height="${16 * s}" rx="${3 * s}" fill="${C.warmCore}"/>
    <rect x="${x - 0.6 * s}" y="${top + 1 * s}" width="${1.2 * s}" height="${24 * s}" fill="${C.ink}" opacity=".35"/>
    <rect x="${x - w / 2 - 1.5 * s}" y="${top + 24 * s}" width="${w + 3 * s}" height="${3 * s}" rx="${1.5 * s}" fill="${C.ink}"/>
  </g>`;
}

/** 땅에 고이는 빛 — 언덕 모양으로 잘라 언덕 위에만 앉는다(지금은 빛 원이 마루선을 가로질러 색이 겹쳐 보였다) */
const pool = (clipId, cx, cy, rx, ry, gradId) => `<g clip-path="url(#${clipId})"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${gradId})"/></g>`;

const fireflies = (points) =>
  points.map(([x, y, d], i) => `<circle class="tl-twinkle" style="animation-delay:${d ?? i * 0.7}s" cx="${x}" cy="${y}" r="1.7" fill="${C.glow}"/>`).join("");

const OPTIONS = [
  {
    id: "now",
    title: "지금 모습(비교용)",
    why: "노을 띠 둘 + 원 두 개짜리 빛 + 막대 등불",
    notes: ["빛 원의 아래쪽이 언덕 마루를 가로질러 크림·초록이 섞인 원판처럼 보인다", "띠의 위쪽 테두리가 흰 바탕에서 선처럼 끊긴다"],
    svg: () => `
      <svg viewBox="0 0 360 320" aria-hidden="true">
        <path d="M-120,320 L-120,110 Q180,40 480,110 L480,320 Z" fill="#FFFBF0"/>
        <path d="M-120,320 L-120,175 Q180,120 480,175 L480,320 Z" fill="#FFF6E0"/>
        <circle cx="264" cy="190" r="62" fill="#FFF3D6" opacity=".5"/>
        <circle cx="264" cy="190" r="40" fill="#FFF3D6" opacity=".75"/>
        <path d="M0,238 C90,218 270,214 360,232 L360,320 L0,320 Z" fill="${C.mid}"/>
        <rect x="262" y="196" width="3" height="40" fill="${C.ink}"/>
        <rect x="252" y="170" width="23" height="4" rx="2" fill="${C.ink}"/>
        <rect x="254" y="174" width="19" height="22" rx="4" fill="${C.warm}"/>
        <rect x="252" y="196" width="23" height="4" rx="2" fill="${C.ink}"/>
        ${tree(38, 236, 7)}${tree(58, 234, 5)}
        <path d="M0,276 C100,258 260,256 360,270 L360,320 L0,320 Z" fill="${C.near}"/>
      </svg>`
  },
  {
    id: "lantern-notice",
    title: "B+F · 등불 빛이 닿은 작은 들꽃",
    why: "해 질 녘 언덕의 등불이 곁의 작은 들꽃 무리를 비춘다 — 지나치기 쉬운 작은 좋은 것을 알아보기(감사의 첫 단계, Emmons · '세 가지 좋은 일'의 알아차리기)",
    notes: ["빛은 등불 하나에서 — 언덕 뒤로 퍼지고, 땅에 고이는 빛은 언덕 모양으로 잘라 마루선과 겹치지 않는다", "들꽃은 그 빛 안에 — 크지 않게, 늘 같은 셋", "움직임은 등불 빛의 숨 하나, 친구·조약돌 없음"],
    svg: () => {
      const flower = (x, y, h, r, bloom = C.warmCore, core = "#F5C86A") => {
        const petals = [0, 72, 144, 216, 288]
          .map((a) => `<circle cx="${(x + Math.cos((a * Math.PI) / 180) * r * 0.9).toFixed(2)}" cy="${(y - h + Math.sin((a * Math.PI) / 180) * r * 0.9).toFixed(2)}" r="${(r * 0.62).toFixed(2)}" fill="${bloom}" stroke="#EAD6B8" stroke-width=".6"/>`)
          .join("");
        return `<path d="M${x},${y} Q${x - 2},${y - h / 2} ${x},${y - h}" stroke="${C.ink}" stroke-width="1.4" fill="none" opacity=".8"/>${petals}<circle cx="${x}" cy="${y - h}" r="${r * 0.5}" fill="${core}"/>`;
      };
      const leaf = (x, y, flip = 1) => `<path d="M${x},${y} q${6 * flip},-7 ${12 * flip},-3 q${-6 * flip},5 ${-12 * flip},3 Z" fill="${C.near}"/>`;
      return `
      <svg viewBox="0 0 360 320" aria-hidden="true">
        <defs>
          ${sky("hsky", "#FFF5E0", "#FCE0BE")}
          ${glowGrad("lglow", C.glow, 0.9)}
          ${glowGrad("hpool", "#FFF3CF", 0.85)}
          <clipPath id="hmid"><path d="${MID}"/></clipPath>
        </defs>
        <rect width="360" height="320" fill="url(#hsky)"/>
        <path d="${FAR}" fill="${C.far}"/>
        ${tree(300, 196, 6, "#B9DECD", "#A6D2BF")}${tree(318, 192, 4.5, "#B9DECD", "#A6D2BF")}
        ${lantern(256, 228, 1)}
        <path d="${MID}" fill="${C.mid}"/>
        ${pool("hmid", 236, 232, 88, 18, "hpool")}
        ${lantern(256, 228, 1).replace(/<circle class="tl-breathe"[^>]*\/>/, "")}
        ${leaf(196, 233, 1.4)}${leaf(232, 232, -1.4)}
        ${flower(202, 235, 19, 5.6)}${flower(215, 233, 27, 6.6)}${flower(228, 236, 15, 5)}
        ${tree(44, 232, 8)}${tree(68, 228, 5.5)}
        <path d="${NEAR}" fill="${C.near}"/>
      </svg>`;
    }
  },
  {
    id: "lantern",
    title: "B · 노을 등불, 다시 그림(최소 변경)",
    why: "지금 그림의 뜻은 두고 그리기만 고친다. 다만 등불은 심리학에서 감사를 나타내는 그림이 아니다",
    notes: ["빛은 언덕 뒤에서 퍼지고, 땅에 고이는 빛은 언덕 모양으로 잘라 마루선과 겹치지 않는다", "하늘이 흰색에서 노을로 이음매 없이, 나무에 그늘", "움직임은 빛의 숨 하나"],
    svg: () => `
      <svg viewBox="0 0 360 320" aria-hidden="true">
        <defs>
          ${sky("bsky", "#FFF6E3", "#FDE6C6")}
          ${glowGrad("lglow", C.glow, 0.9)}
          ${glowGrad("bpool", "#FFF4D2", 0.75)}
          <clipPath id="bmid"><path d="${MID}"/></clipPath>
        </defs>
        <rect width="360" height="320" fill="url(#bsky)"/>
        <path d="${FAR}" fill="${C.far}"/>
        ${tree(300, 196, 6, "#B9DECD", "#A6D2BF")}${tree(318, 192, 4.5, "#B9DECD", "#A6D2BF")}
        ${lantern(262, 226, 1)}
        <path d="${MID}" fill="${C.mid}"/>
        ${pool("bmid", 262, 228, 70, 16, "bpool")}
        ${lantern(262, 226, 1).replace(/<circle class="tl-breathe"[^>]*\/>/, "")}
        ${tree(44, 230, 8)}${tree(68, 226, 5.5)}
        <path d="${NEAR}" fill="${C.near}"/>
      </svg>`
  },
  {
    id: "notice",
    title: "F · 작은 좋은 것을 알아차리기",
    why: "감사의 첫 단계 '좋은 것을 알아보기'(Emmons), '세 가지 좋은 일'의 '알아차리고 음미하기'. 해 질 녘 낮은 빛이 언덕의 작은 들꽃 무리에 닿는다",
    notes: ["거창한 일이 아니라 작은 일 — '오늘 고마웠던 일'의 크기", "칭찬 장면의 높은 해와 겹치지 않게 지는 해(낮은 옆빛)", "움직임은 꽃 둘레 빛의 숨 하나, 친구·조약돌 없음"],
    svg: () => {
      const flower = (x, y, h, r, bloom = C.warmCore, core = "#F5C86A") => {
        const petals = [0, 72, 144, 216, 288]
          .map((a) => `<circle cx="${(x + Math.cos((a * Math.PI) / 180) * r * 0.9).toFixed(2)}" cy="${(y - h + Math.sin((a * Math.PI) / 180) * r * 0.9).toFixed(2)}" r="${(r * 0.62).toFixed(2)}" fill="${bloom}" stroke="#EAD6B8" stroke-width=".6"/>`)
          .join("");
        return `<path d="M${x},${y} Q${x - 2},${y - h / 2} ${x},${y - h}" stroke="${C.ink}" stroke-width="1.4" fill="none" opacity=".8"/>${petals}<circle cx="${x}" cy="${y - h}" r="${r * 0.5}" fill="${core}"/>`;
      };
      const leaf = (x, y, flip = 1) => `<path d="M${x},${y} q${6 * flip},-7 ${12 * flip},-3 q${-6 * flip},5 ${-12 * flip},3 Z" fill="${C.near}"/>`;
      return `
      <svg viewBox="0 0 360 320" aria-hidden="true">
        <defs>
          ${sky("fsky", "#FFF3DC", "#FCDCB6")}
          ${glowGrad("fsun", "#FFE2B0", 0.95)}
          ${glowGrad("fspot", "#FFF2CC", 0.95)}
          <linearGradient id="fray" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0" stop-color="#FFE9C2" stop-opacity="0"/>
            <stop offset=".45" stop-color="#FFE9C2" stop-opacity=".55"/>
            <stop offset="1" stop-color="#FFF4D6" stop-opacity="0"/>
          </linearGradient>
          <clipPath id="fmid"><path d="${MID}"/></clipPath>
        </defs>
        <rect width="360" height="320" fill="url(#fsky)"/>
        <circle cx="304" cy="186" r="92" fill="url(#fsun)"/>
        <circle cx="304" cy="188" r="19" fill="#FFE6B4"/>
        <path d="${FAR}" fill="${C.far}"/>
        ${tree(250, 196, 5.5, "#B9DECD", "#A6D2BF")}
        <path d="${MID}" fill="${C.mid}"/>
        <g clip-path="url(#fmid)"><path d="M360,210 L96,226 L96,250 L360,236 Z" fill="url(#fray)"/></g>
        <circle class="tl-breathe" cx="131" cy="222" r="44" fill="url(#fspot)"/>
        ${leaf(108, 240, 1.5)}${leaf(150, 238, -1.5)}
        ${flower(116, 242, 20, 6)}${flower(131, 240, 29, 7)}${flower(146, 243, 16, 5.2)}
        ${tree(36, 232, 8)}${tree(58, 228, 5)}
        <path d="${NEAR}" fill="${C.near}"/>
      </svg>`;
    }
  },
  {
    id: "drift",
    title: "G · 바람에 건너온 꽃잎",
    why: "감사의 둘째 단계 '그 좋은 것이 나 밖에서 왔다'(Emmons). 언덕의 꽃나무에서 꽃잎 몇 장이 바람을 타고 위의 카드 쪽으로 건너온다",
    notes: ["'받은 것'을 선물 상자 대신 자연으로 — 갚아야 할 빚처럼 읽히지 않게", "꽃잎은 늘 같은 몇 장이 천천히 돈다(쌓이거나 늘지 않음)", "움직임은 꽃잎 흐름 하나, 움직임 줄이기면 멈춘 채"],
    svg: () => {
      const petal = (x, y, delay, dx, dy, rot, fill = "#FFF6EC") =>
        `<g transform="translate(${x} ${y})"><path class="tl-drift" style="--dx:${dx}px;--dy:${dy}px;--rot:${rot}deg;animation-delay:${delay}s" d="M0,0 q7,-8 15,0 q-7,7 -15,0 Z" fill="${fill}" stroke="#D8BC92" stroke-width="1"/></g>`;
      const blossoms = [
        [276, 132], [292, 124], [306, 136], [320, 128], [286, 146], [300, 152], [316, 146], [330, 140], [296, 112], [312, 116]
      ]
        .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 === 0 ? 3.2 : 2.4}" fill="#FFFFFF" stroke="#EAD6B8" stroke-width=".7"/>`)
        .join("");
      return `
      <svg viewBox="0 0 360 320" aria-hidden="true">
        <defs>${sky("gsky", "#FFF6E4", "#FDE7CB")}</defs>
        <rect width="360" height="320" fill="url(#gsky)"/>
        <path d="${FAR}" fill="${C.far}"/>
        ${tree(64, 206, 5.5, "#B9DECD", "#A6D2BF")}
        <path d="${MID}" fill="${C.mid}"/>
        <path d="M300,228 C298,206 304,188 296,170 M298,196 C306,186 314,178 318,166" stroke="${C.ink}" stroke-width="5" stroke-linecap="round" fill="none" opacity=".85"/>
        ${canopy(282, 146, 22, C.near, C.treeDark)}${canopy(322, 144, 22, C.near, C.treeDark)}${canopy(302, 124, 26, C.near, C.treeDark)}
        ${blossoms}
        ${petal(268, 120, 0, -150, -120, 260)}
        ${petal(286, 104, -3.2, -190, -96, -220, "#FCEBD6")}
        ${petal(258, 140, -6.5, -120, -150, 300)}
        ${petal(300, 98, -9, -210, -70, -180, "#FCEBD6")}
        ${tree(30, 232, 7)}
        <path d="${NEAR}" fill="${C.near}"/>
      </svg>`;
    }
  },
  {
    id: "garland",
    title: "D · 두 나무를 잇는 실의 쪽지",
    why: "감사는 나와 누군가를 잇는다(Algoe의 '찾고·떠올리고·잇는' 이론). 위 카드를 꿴 끈이 아래 풍경에서도 두 나무를 잇고, 같은 크림빛 쪽지가 걸려 있다",
    notes: ["화면 위아래가 같은 실로 이어진다", "쪽지는 다섯 장으로 고정 — 칸 수(셋)와 묶지 않고 쓴 개수에 반응하지 않음", "사람·친구를 그리지 않는다(누군가에게 꼭 고마워해야 한다는 뜻이 되지 않게)", "움직임은 쪽지의 작은 흔들림 하나"],
    svg: () => {
      const p0 = [62, 148];
      const p1 = [182, 214];
      const p2 = [304, 140];
      const at = (t) => [
        (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0],
        (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1]
      ];
      const tags = [0.2, 0.36, 0.52, 0.68, 0.84]
        .map((t, i) => {
          const [x, y] = at(t);
          const tilt = [-6, 4, -3, 6, -4][i];
          return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><g class="tl-sway" style="--tilt:${tilt}deg;animation-delay:${-i * 1.3}s">
            <path d="M0,0 L0,5" stroke="${C.ink}" stroke-width="1" opacity=".55"/>
            <rect x="-7.5" y="5" width="15" height="19" rx="2.5" fill="#FFF8E4" stroke="#EADFC2" stroke-width="1"/>
            <circle cx="0" cy="9" r="1.6" fill="#FFFFFF" stroke="#EADFC2" stroke-width=".8"/>
            <path d="M-4,15 h8 M-4,19 h6" stroke="#E2D4AE" stroke-width="1" stroke-linecap="round"/></g></g>`;
        })
        .join("");
      return `
      <svg viewBox="0 0 360 320" aria-hidden="true">
        <defs>${sky("dsky", "#FFF6E4", "#FCE4C6")}</defs>
        <rect width="360" height="320" fill="url(#dsky)"/>
        <path d="${FAR}" fill="${C.far}"/>
        <path d="${MID}" fill="${C.mid}"/>
        <g>
          <rect x="54" y="150" width="6" height="80" rx="3" fill="${C.ink}" opacity=".8"/>
          ${canopy(40, 158, 19, C.near, C.treeDark)}${canopy(78, 160, 17, C.near, C.treeDark)}${canopy(58, 136, 28, C.near, C.treeDark)}
        </g>
        <g>
          <rect x="304" y="144" width="6" height="84" rx="3" fill="${C.ink}" opacity=".8"/>
          ${canopy(289, 152, 17, C.near, C.treeDark)}${canopy(326, 154, 18, C.near, C.treeDark)}${canopy(307, 130, 27, C.near, C.treeDark)}
        </g>
        <path d="M${p0[0]},${p0[1]} Q${p1[0]},${p1[1]} ${p2[0]},${p2[1]}" fill="none" stroke="#8F7A3E" stroke-width="1.4" opacity=".7"/>
        ${tags}
        <path d="${NEAR}" fill="${C.near}"/>
      </svg>`;
    }
  }
];

const grid = document.getElementById("tl-grid");
const filled = document.getElementById("tl-filled");
const SAMPLE = ["친구가 늦은 답장에도 웃어 줬다", "따뜻한 저녁을 먹었다", "버스를 놓치지 않았다"];

function phone(option) {
  const card = document.createElement("section");
  card.className = "tl-card";
  card.innerHTML = `
    <h2></h2><p class="tl-why"></p>
    <div class="tl-phone">
      <div class="tl-top">
        <div class="tl-bar"><b>×</b><span>8 / 9 · 저장됨 · 방금</span><b>⋯</b></div>
        <div class="tl-progress"><i></i></div>
        <h3>감사</h3>
        <p class="tl-guide">오늘 고마웠던 일을 적어요.</p>
        <p class="tl-label">감사할 점, 세 가지까지</p>
        <p class="tl-sub">선택이에요. 비워 두어도 괜찮아요.</p>
        <div class="tl-tags"><div class="tl-tag">감사 1</div><div class="tl-tag">감사 2</div><div class="tl-tag">감사 3</div></div>
      </div>
      <div class="tl-art"></div>
      <div class="tl-buttons"><span class="prev">이전</span><span class="next">다음</span></div>
    </div>
    <ul></ul>`;
  card.querySelector("h2").textContent = option.title;
  card.querySelector(".tl-why").textContent = option.why;
  card.querySelector(".tl-art").innerHTML = option.svg();
  for (const note of option.notes) {
    const li = document.createElement("li");
    li.textContent = note;
    card.querySelector("ul").append(li);
  }
  return card;
}

for (const option of OPTIONS) grid.append(phone(option));
filled.addEventListener("change", () => {
  for (const [i, tag] of [...grid.querySelectorAll(".tl-tag")].entries()) tag.textContent = filled.checked ? SAMPLE[i % 3] : `감사 ${(i % 3) + 1}`;
  grid.classList.toggle("tl-filled-on", filled.checked);
});
