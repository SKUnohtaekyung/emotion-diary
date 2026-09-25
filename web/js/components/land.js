// 완료 화면의 장면(D-061 — 온보딩은 D-092로 welcome.js의 장면 이야기가 같은 언덕 색을 따로 그린다): 흰 하늘 아래 색 언덕 셋과 흰 길, 그 위에 큰 친구와 조약돌. 친구는 테두리·상자 없이 그대로 선다.
// 좌표는 360×590 설계 상자(%로 옮겨 상자와 함께 커지고 줄어든다. 언덕은 상자 옆으로 더 뻗어 좁은 상자도 화면 폭을 채운다). feet은 친구 발의 y이고 친구 그림의 높이는 그림 비율이 정한다.
import { el } from "../dom.js";
import { friendImg, pebbleImg, FRIENDS } from "../data.js";

const W = 360, H = 590;
const pct = (v, total) => `${((v / total) * 100).toFixed(3)}%`;

// 큰 글자·실측 겹침 감지(D-083 ③, RK-027) — 마음 고르기·이유·완료 세 자유 배치 화면이 함께 쓴다(land.js가 정본, 다른 둘은 여기서 가져다 쓴다).
// 조건 하나라도 맞으면 장면 뿌리에 fl-grid를 붙인다: 루트 글자 20px 이상, 또는 그린 뒤 잰 겹침이 하나라도 있음(글자가 이미 크면 겹침 계산은 건너뛴다).
// 숨은 1em 상자를 document.body에 붙여 ResizeObserver로 루트 글자 크기 변화를 듣고(inherit 영향을 안 받게 body 바로 아래에 둔다), 장면 자신의
// ResizeObserver(폭 변화)와 합쳐 requestAnimationFrame 하나로 판단한다 — 프레임당 한 번만 클래스를 바꿔 깜빡이지 않는다.
export function watchFreeGrid(root, { overlap, onFrame } = {}) {
  const emProbe = document.createElement("i");
  emProbe.setAttribute("aria-hidden", "true");
  emProbe.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1em;height:1em;visibility:hidden;pointer-events:none";
  document.body.appendChild(emProbe);
  let scheduled = false;
  const decide = () => {
    scheduled = false;
    if (!root.isConnected) { ro.disconnect(); emProbe.remove(); return; }
    const bigText = emProbe.getBoundingClientRect().width >= 20; // 1em == 루트 글자 크기(px), 125%(20px) 문턱
    onFrame?.(root);
    const overlapped = !bigText && overlap ? overlap(root) : false;
    root.classList.toggle("fl-grid", bigText || overlapped);
  };
  const schedule = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(decide); } };
  const ro = new ResizeObserver(schedule);
  ro.observe(emProbe); ro.observe(root);
  schedule();
  return () => { ro.disconnect(); emProbe.remove(); };
}
// 셀렉터가 고른 요소끼리 상자(getBoundingClientRect) 겹침이 하나라도 있으면 true — 라벨·그림·버튼을 가리지 않고 "그려진 상자"로만 본다.
export function anyOverlap(root, selector) {
  const boxes = [...root.querySelectorAll(selector)].map((e) => e.getBoundingClientRect());
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (Math.min(a.right, b.right) > Math.max(a.left, b.left) && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top)) return true;
  }
  return false;
}

function road() { // 아래에서 위로 좁아지며 한 굽이 도는 흰 길
  const left = [], right = [];
  for (let y = 590; y >= 306; y -= 6) {
    const t = (590 - y) / (590 - 306), cx = 196 + 44 * (1 - 0.5 * t) * Math.sin(t * Math.PI * 1.5 + 0.5), w = 214 * (1 - t) ** 1.25 + 1.5;
    left.push(`${(cx - w / 2).toFixed(1)} ${y}`); right.push(`${(cx + w / 2).toFixed(1)} ${y}`);
  }
  return `M${left.join("L")}L${right.reverse().join("L")}Z`;
}
const SVG = `<svg class="land-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
<g class="sun-g"><circle class="sun" cx="280" cy="106" r="40"/><circle class="sun-ring" cx="280" cy="106" r="58"/><circle class="sun-ring" cx="280" cy="106" r="78" style="stroke-width:2"/></g>
<path class="hill-far" d="M-720 168L0 168C70 132 160 126 236 150C296 170 336 162 360 154L1080 154L1080 ${H}L-720 ${H}Z"/>
<path class="hill-mid" d="M-720 232L0 232C100 190 230 196 360 244L1080 244L1080 ${H}L-720 ${H}Z"/>
<path class="hill-near" d="M-720 330L0 330C120 296 250 306 360 350L1080 350L1080 ${H}L-720 ${H}Z"/>
<path class="road" d="${road()}" stroke="var(--bg)" stroke-width="2" stroke-linejoin="round"/></svg>`;

export function renderLand({ friends = [], pebbles = [], sun = true }) {
  const svg = el("div", { class: "land-art" });
  svg.innerHTML = SVG;
  if (!sun) svg.querySelector(".sun-g")?.remove();

  // 완료 화면(doneLayout)은 조약돌이 친구와 1:1(같은 순서·같은 key)이다 — 이때만 둘을 land-cell로 묶어 격자 모드에서 "발치 정렬"이 되게 한다.
  // 친구와 조약돌이 1:1이 아닌 배치는 묶지 않는다(격자 모드 대상도 아니다, D-083 ③은 세 화면만 지정).
  const paired = friends.length > 0 && friends.length === pebbles.length && friends.every((f, i) => pebbles[i]?.key === f.key);

  const makeFriend = (f, i) => {
    const img = friendImg(f.key, { size: f.w, label: true });
    img.removeAttribute("width"); img.removeAttribute("height");
    img.className = "land-friend";
    img.style.setProperty("--i", String(i)); // 들어오는 차례와 숨쉬는 위상(scene.css)
    img.style.left = pct(f.x, W); img.style.width = pct(f.w, W); img.style.setProperty("--bt", pct(H - f.feet, H));
    img.style.setProperty("--tilt", `${f.tilt ?? 0}deg`); // 기울기(land.css). lfin·lfbob이 transform을 쓰므로 개별 속성 rotate로 줘 서로 안 덮어쓴다(D-078)
    img.style.setProperty("--fw-px", `${f.w}px`); // 격자 모드용 고정 px 폭(자유 배치의 %는 격자 칸 폭에 휘둘린다) — 크기는 그대로, 자리만 바뀐다
    return img;
  };
  const makePebble = (p) => {
    const img = pebbleImg(p.key, { size: p.w });
    img.removeAttribute("width"); img.removeAttribute("height");
    img.className = "land-pebble";
    img.style.left = pct(p.x, W); img.style.top = pct(p.y, H); img.style.width = pct(p.w, W); img.style.setProperty("--r", `${p.r ?? 0}deg`);
    img.style.setProperty("--pw-px", `${p.w}px`);
    return img;
  };

  const nodes = [];
  if (paired) {
    friends.forEach((f, i) => nodes.push(el("div", { class: "land-cell" }, makeFriend(f, i), makePebble(pebbles[i]))));
  } else {
    friends.forEach((f, i) => nodes.push(makeFriend(f, i)));
    for (const p of pebbles) nodes.push(makePebble(p));
  }

  // land-fit이 남은 자리 전체(절대 배치라 크기가 확정된다)이고 그 안에서 land가 설계 비율로 들어앉는다.
  const land = el("div", { class: "land" }, svg, ...nodes);
  land.dataset.n = String(friends.length); // 격자 모드에서 1~3명은 3열 대신 가운데 한 줄로 모은다(land.css, 재작업 2회차)
  // 완료 화면만 격자 대상(D-083 ③) — 다만 겹침 콜백은 주지 않는다. 이유: 친구 그림은 알파가 상자의 90%+까지 차서(실측)
  // anyOverlap의 상자 겹침 검사가 손으로 맞춘 1~9명 표(알파 간격 3~6px로 알파 기준은 통과하지만 상자는 거의 항상 닿는다)에서
  // 항상 거짓 겹침으로 잡혀 fl-grid를 켰다 껐다 반복하는 무한 루프가 났다(font-size 판정과 무관하게 자유 배치인데도).
  // 자리표는 %(360 설계 상자) 기준이라 컨테이너 폭에 비례해 그대로 늘고 줄 뿐 겹침 여부 자체는 바뀌지 않고, 각 인원수 표는 이미
  // main의 알파 픽셀 QA(figure-measure.js)로 겹침 0을 확인받았다 — 라벨도 없어 실측 겹침으로 다시 잡을 새 위험이 없다.
  // 그래서 이 화면은 글자 크기(emProbe, 20px+)만으로 판단한다. 라벨이 있는 이유·마음 고르기는 그 라벨/버튼 상자로 재는 것이 맞다(그대로 둔다).
  if (paired) watchFreeGrid(land);
  return el("div", { class: "land-fit" }, land);
}

// 그날 고른 계열만 선다. 화면의 친구는 모두 같은 크기다(D-061 ④ — 크기로 우열을 만들지 않는다. D-050 — 크기·위치로 감정의 무게를 말하지 않는다).
// 1~9명 각각 손으로 정한 자리표다(마음 고르기 meadow.js의 SPOTS와 같은 방식 — 무작위 없음, 볼 때마다 같다). 1~3명은 크기를 유지하고(D-078),
// 4~9명은 마음 고르기 친구(약 70px)보다 조금 크게 모두 88px다. 친구는 taxonomy 선언 순서로 위에서 아래로 놓았고(같은 높이대는 왼쪽부터), cats가
// 어떤 순서로 와도(QA 쿼리·클릭 순서) 이 선언 순서로 다시 정렬해 자리를 배정한다 — 심리 축 배치가 아니라 읽는 순서다.
// 기울기(tilt)는 CSS `rotate` 개별 속성으로 적용돼(land.css) 발(기준점) 중심으로만 돌고 입장·숨쉬기 애니메이션의 transform과 부딪히지 않는다.
// 조약돌 폭은 인원이 늘수록 준다(D-078 개정): 1→46·2→44·3→42·4~5→38·6~7→34·8~9→30.
// 4~9명 자리는 마음 고르기처럼 줄마다 레인을 바꾼다(L1=12·L2=88는 해와 항상 안전, R1=165는 발 y>=248·R2=235는 >=272부터 안전 — 해 고리
// 78+4 기준). 바로 이웃 레인 중심 간격을 70~77로 벌려 알파 픽셀 기준 친구끼리 6px 이상 떨어지게 했고, 같은 레인이 다시 나오는 줄은
// 발 y차 130을 넘겨(격자·기둥으로 안 보이게) 골랐다. 조약돌은 자기 친구 발 옆(먼 언덕 칠 위)에 두었다 — 겹침·해·버튼줄·바닥·근접
// 판정은 QA가 실제 알파 픽셀(경계 6·3·4px, 해 고리 안·버튼줄 아래 0px)로 다시 맞춰 확인했다(2회차, 상자 기준이던 1회차 대체).
const DONE_LAYOUTS = {
  1: { w: 210, friends: [{ x: 70, feet: 428, tilt: -5 }], pebbles: [{ w: 46, x: 152, y: 441, r: 6 }] },
  2: { w: 164, friends: [{ x: 14, feet: 400, tilt: -3 }, { x: 180, feet: 372, tilt: 3 }],
       pebbles: [{ w: 44, x: 74, y: 408, r: 6 }, { w: 44, x: 240, y: 386, r: -7 }] },
  3: { w: 136, friends: [{ x: 17, feet: 280, tilt: -5 }, { x: 112, feet: 494, tilt: 4 }, { x: 214, feet: 336, tilt: -3 }],
       pebbles: [{ w: 42, x: 64, y: 295, r: 6 }, { w: 42, x: 65, y: 416.6, r: -7 }, { w: 42, x: 261, y: 345, r: 5 }] },
  4: { w: 88, friends: [{ x: 12, feet: 200, tilt: -6 }, { x: 88, feet: 250, tilt: 5 }, { x: 165, feet: 310, tilt: -4 }, { x: 235, feet: 380, tilt: 6 }],
       pebbles: [{ w: 38, x: 37, y: 195, r: -6 }, { w: 38, x: 113, y: 245, r: 5 }, { w: 38, x: 190, y: 305, r: -4 }, { w: 38, x: 260, y: 375, r: 6 }] },
  5: { w: 88, friends: [{ x: 12, feet: 190, tilt: -6 }, { x: 88, feet: 235, tilt: 5 }, { x: 165, feet: 290, tilt: -4 }, { x: 235, feet: 350, tilt: 6 }, { x: 12, feet: 410, tilt: -5 }],
       pebbles: [{ w: 38, x: 37, y: 185, r: -6 }, { w: 38, x: 113, y: 230, r: 5 }, { w: 38, x: 190, y: 285, r: -4 }, { w: 38, x: 260, y: 345, r: 6 }, { w: 38, x: 37, y: 405, r: -5 }] },
  6: { w: 88, friends: [{ x: 12, feet: 180, tilt: -6 }, { x: 88, feet: 220, tilt: 5 }, { x: 165, feet: 270, tilt: -4 }, { x: 235, feet: 325, tilt: 6 }, { x: 12, feet: 380, tilt: -5 }, { x: 88, feet: 430, tilt: 4 }],
       pebbles: [{ w: 34, x: 39, y: 193, r: -6 }, { w: 34, x: 115, y: 233, r: 5 }, { w: 34, x: 188, y: 283, r: -4 }, { w: 34, x: 262, y: 338, r: 6 }, { w: 34, x: 39, y: 393, r: -5 }, { w: 34, x: 115, y: 443, r: 4 }] },
  7: { w: 88, friends: [{ x: 12, feet: 170, tilt: -6 }, { x: 88, feet: 208, tilt: 5 }, { x: 165, feet: 260, tilt: -4 }, { x: 235, feet: 315, tilt: 6 }, { x: 12, feet: 365, tilt: -5 }, { x: 88, feet: 410, tilt: 4 }, { x: 165, feet: 465, tilt: -7 }],
       pebbles: [{ w: 34, x: 39, y: 183, r: -6 }, { w: 34, x: 115, y: 221, r: 5 }, { w: 34, x: 188, y: 273, r: -4 }, { w: 34, x: 262, y: 328, r: 6 }, { w: 34, x: 39, y: 378, r: -5 }, { w: 34, x: 115, y: 423, r: 4 }, { w: 34, x: 152, y: 466, r: -7 }] },
  8: { w: 88, friends: [{ x: 12, feet: 165, tilt: -6 }, { x: 88, feet: 200, tilt: 5 }, { x: 165, feet: 252, tilt: -4 }, { x: 235, feet: 305, tilt: 6 }, { x: 12, feet: 350, tilt: -5 }, { x: 88, feet: 395, tilt: 4 }, { x: 165, feet: 440, tilt: -7 }, { x: 235, feet: 480, tilt: 3 }],
       pebbles: [{ w: 30, x: 41, y: 180, r: -6 }, { w: 30, x: 117, y: 215, r: 5 }, { w: 30, x: 194, y: 267, r: -4 }, { w: 30, x: 264, y: 320, r: 6 }, { w: 30, x: 41, y: 365, r: -5 }, { w: 30, x: 117, y: 410, r: 4 }, { w: 30, x: 194, y: 455, r: -7 }, { w: 30, x: 316, y: 471, r: 3 }] },
  9: { w: 88, friends: [{ x: 12, feet: 160, tilt: -6 }, { x: 88, feet: 195, tilt: 5 }, { x: 165, feet: 252, tilt: -4 }, { x: 235, feet: 300, tilt: 6 }, { x: 12, feet: 340, tilt: -5 }, { x: 88, feet: 380, tilt: 4 }, { x: 165, feet: 422, tilt: -7 }, { x: 235, feet: 460, tilt: 3 }, { x: 12, feet: 495, tilt: 5 }],
       pebbles: [{ w: 30, x: 41, y: 175, r: -6 }, { w: 30, x: 117, y: 210, r: 5 }, { w: 30, x: 194, y: 267, r: -4 }, { w: 30, x: 264, y: 315, r: 6 }, { w: 30, x: 41, y: 355, r: -5 }, { w: 30, x: 117, y: 395, r: 4 }, { w: 30, x: 194, y: 437, r: -7 }, { w: 30, x: 248, y: 471, r: 3 }, { w: 30, x: 105, y: 470, r: 5 }] }
};
const TAXONOMY_ORDER = Object.keys(FRIENDS); // enjoyment, wish, sadness, anger, joy, love, hate, fear, disgust — 정본은 FRIENDS 선언 순서

export function doneLayout(cats) {
  const order = [...cats].sort((a, b) => TAXONOMY_ORDER.indexOf(a) - TAXONOMY_ORDER.indexOf(b)); // 클릭 순서·QA 쿼리 순서와 무관하게 선언 순서로
  const n = Math.min(order.length, 9);
  if (n === 0) return { friends: [], pebbles: [] };
  const L = DONE_LAYOUTS[n];
  const friends = order.slice(0, n).map((key, i) => ({ key, w: L.w, ...L.friends[i] }));
  const pebbles = order.slice(0, n).map((key, i) => ({ key, ...L.pebbles[i] }));
  return { friends, pebbles };
}
