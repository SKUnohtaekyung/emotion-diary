// 감정 별자리 지도(DESIGN_SYSTEM §6.2, D-041)와 그 아래 "고른 친구들" 줄(2026-09-20 사용자 결정).
// 지도의 점·라벨·연결선·큰 글자 3열 폴백은 design/style-guide.html의 구현을 옮긴 것이다.
// 위치와 연결선은 장식이다. 상태에 남는 값은 고른 category code 집합뿐이다.
import { el, reducedMotion, announce } from "../dom.js";
import { data, category, characterPicture } from "../data.js";
import { state, toggleCategory, on } from "../state.js";

const FRAME = { width: 320, height: 260, cx: 160, cy: 120, r: 88 };

export function renderSky() {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("class", "sky-lines"); svg.setAttribute("viewBox", `0 0 ${FRAME.width} ${FRAME.height}`);
  svg.setAttribute("preserveAspectRatio", "none"); svg.setAttribute("aria-hidden", "true");
  const line = document.createElementNS(svgNS, "polyline"); svg.append(line);

  const host = el("div", { class: "sky", role: "group", "aria-label": "감정 카테고리, 복수 선택" }, svg);
  const points = data.categories.map((_, i) => {
    const a = (-90 + i * (360 / data.categories.length)) * Math.PI / 180;
    return [FRAME.cx + FRAME.r * Math.cos(a), FRAME.cy + FRAME.r * Math.sin(a)];
  });
  const stars = data.categories.map((c, i) => {
    const [x, y] = points[i];
    const star = el("button", { type: "button", class: "star", "aria-pressed": String(state.draft.cats.includes(c.code)), "aria-label": c.label, "data-cat": c.code,
      style: { "--x": x / (FRAME.width / 100), "--y": y, "--c": `var(--${c.code}-accent)` } },
      el("span", { class: "star-core", "aria-hidden": "true" }), el("span", { class: "star-label", "aria-hidden": "true", text: c.label }));
    star.addEventListener("click", () => {
      const isOn = toggleCategory(c.code);
      star.classList.remove("twinkle"); void star.offsetWidth;
      if (isOn && !reducedMotion()) star.classList.add("twinkle");
      announce(`${c.label} ${isOn ? "선택됨" : "선택 해제됨"}, 총 ${state.draft.cats.length}개 선택`);
    });
    host.append(star);
    return star;
  });

  const friends = el("ul", { class: "friends", "aria-label": "고른 감정 계열" });
  const hint = el("p", { class: "caption friends-empty", text: "점을 누르면 고른 계열의 친구가 여기에 나타납니다" });

  function sync(detail) {
    stars.forEach((s) => s.setAttribute("aria-pressed", String(state.draft.cats.includes(s.dataset.cat))));
    line.setAttribute("points", state.draft.cats.map((k) => points[data.categories.findIndex((c) => c.code === k)].join(",")).join(" "));
    // 방금 고른 친구만 acknowledge(1회)를 재생하고 나머지는 정적 그림으로 둔다. 다시 그릴 때마다 전부 움직이면 산만하다.
    friends.replaceChildren(...state.draft.cats.map((k) => el("li", { class: "friend" },
      characterPicture(k, { animated: detail?.on && detail.code === k, motion: "acknowledge-once", decorative: true }),
      el("span", { text: category(k).label }))));
    hint.hidden = state.draft.cats.length > 0;
  }
  on("cats", sync); sync();

  // 라벨이 겹치거나 프레임을 벗어나거나 글자 확대가 크면 3열 격자로 바꾼다(§6.2 큰 글자 폴백).
  const overlap = (a, b) => !(a.right + 2 <= b.left || b.right + 2 <= a.left || a.bottom + 2 <= b.top || b.bottom + 2 <= a.top);
  function needsGrid() {
    host.classList.remove("grid");
    const box = host.getBoundingClientRect(), labels = stars.map((s) => s.querySelector(".star-label").getBoundingClientRect());
    if (parseFloat(getComputedStyle(document.documentElement).fontSize) > 19.2) return true;
    if (labels.some((r) => r.left < box.left || r.right > box.right || r.top < box.top || r.bottom > box.bottom)) return true;
    return labels.some((r, i) => labels.slice(i + 1).some((s) => overlap(r, s)));
  }
  let pending = 0;
  const fit = () => { cancelAnimationFrame(pending); pending = requestAnimationFrame(() => { if (host.isConnected) host.classList.toggle("grid", needsGrid()); }); };
  new ResizeObserver(fit).observe(host);

  return el("div", { class: "sky-wrap" }, host, hint, friends);
}
