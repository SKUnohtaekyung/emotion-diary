// 달력 아래의 작은 편지(D-100 ③, 2026-09-26 사용자 — "편지 카드를 작게"). 한 달 전체를 늘 보이면서 스크롤 없이 그날의 편지를 보려면
// 휴대폰에서 큰 편지 카드(최소 376px, D-079)가 달 아래에 들어가지 않는다. 그래서 같은 편지의 모양(감정 색 면·감정 이름·조약돌·세부 감정 알약·크기,
// 종이 면의 있었던 일과 이유, 크림 면의 칭찬·감사, 고치기 태그)을 남는 높이(--ml-h, tabs.js가 잰다)에 맞춘 작은 카드로 옆으로 넘겨 본다.
// 카드를 누르면(onOpen) 편지 전체가 열리고, 고치기(onEdit)는 그 카드의 단계로 곧장 간다(D-100 ②). 긴 글은 줄 수를 잘라 보인다 — 전체는 편지에서 읽는다.
import { el, svgEl, announce, reducedMotion } from "../dom.js";
import { category, pebbleImg } from "../data.js";

const pencil = () => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "ml-ico" }, svgEl("path", { d: "M4 20l4.2-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20z" }));
const chevron = (dir) => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "ml-ico" }, svgEl("path", { d: dir < 0 ? "M14.5 5.5 8 12l6.5 6.5" : "M9.5 5.5 16 12l-6.5 6.5" }));
const nonblank = (v) => (Array.isArray(v) ? v : [v]).map((t) => (t ?? "").trim()).filter(Boolean);

// 세부 감정 알약은 한 줄에 들어가는 만큼만 보이고, 남은 개수는 끝에 '+N' 알약으로 알린다(2026-09-26 — 슬픔 53개를 모두 고른 날 알약 2개 반만 보이고
// 나머지는 흐림 속으로 사라져 3개만 고른 날처럼 읽혔다. 고른 말의 수를 숨기지 않는다). 전체는 '크게 보기'의 편지(이어지는 카드, D-079 ③)에서 본다.
function fitChips(root) {
  for (const row of root.querySelectorAll(".ml-chips")) {
    row.querySelector(".ml-more")?.remove();
    const chips = [...row.children];
    chips.forEach((c) => { c.hidden = false; });
    if (!row.clientWidth) continue; // 아직 그려지지 않았다(폭 0) — 다음 기회에
    const gap = parseFloat(getComputedStyle(row).columnGap) || 6, room = row.clientWidth;
    const more = el("span", { class: "ml-more" });
    row.append(more);
    const moreW = (n) => { more.textContent = `+${n}`; return more.getBoundingClientRect().width; };
    let used = 0, shown = 0;
    for (let k = 0; k < chips.length; k += 1) {
      const w = chips[k].getBoundingClientRect().width, left = chips.length - k - 1;
      const need = used + (shown ? gap : 0) + w + (left ? gap + moreW(left) : 0);
      if (need > room && shown) break;
      used += (shown ? gap : 0) + w; shown += 1;
    }
    chips.slice(shown).forEach((c) => { c.hidden = true; });
    const rest = chips.length - shown;
    if (rest) { more.textContent = `+${rest}`; more.setAttribute("aria-label", `외 ${rest}개`); } else more.remove();
  }
}

export function renderMiniLetter(record, { onOpen, onEdit } = {}) {
  const cats = record.cats.filter((c) => record.emotions.some((e) => e.cat === c));
  const specs = [];
  cats.forEach((cat, i) => {
    const words = record.emotions.filter((e) => e.cat === cat).map((e) => e.label);
    const val = record.repr[cat] ?? record.emotions.find((e) => e.cat === cat && e.own != null)?.own ?? "–";
    specs.push({ label: category(cat).label, target: `detail:${cat}`, cls: "ml-emo", style: { "--tint": `var(--${cat}-300)` }, body: [
      el("p", { class: "ml-lab", text: `마음 ${i + 1} / ${cats.length}` }),
      el("p", { class: "ml-name", text: category(cat).label }),
      Object.assign(pebbleImg(cat, { size: 72 }), { className: "pebble-img ml-pebble" }),
      el("div", { class: "ml-foot" },
        el("div", { class: "ml-chips" }, words.map((w) => el("span", { text: w }))),
        el("p", { class: "ml-size" }, el("b", { text: String(val) }), el("span", { text: " / 10" })))
    ] });
  });
  // 있었던 일과 이유는 편지처럼 한 장(종이 면). 고치기는 있었던 일부터 연다(이유는 그 다음 단계).
  const story = [["있었던 일", nonblank(record.event)[0]], ["이유", nonblank(record.reason)[0]]].filter(([, v]) => v);
  if (story.length) specs.push({ label: "있었던 일과 이유", target: "date", cls: "ml-paper", body: [
    el("p", { class: "ml-lab", text: "있었던 일과 이유" }),
    ...story.map(([k, v]) => el("p", { class: "ml-line" }, el("b", { text: k }), v))
  ] });
  for (const [kind, title] of [["praise", "칭찬"], ["thanks", "감사"]]) {
    const items = nonblank(record[kind]);
    if (items.length) specs.push({ label: title, target: kind, cls: "ml-note", body: [el("p", { class: "ml-lab", text: title }), el("p", { class: "ml-quote", text: items.join(" · ") })] });
  }

  // 카드 전체를 덮는 투명 버튼이 '편지 전체 보기'를 맡고, 고치기 태그만 그 위에 따로 눌린다(버튼 안에 버튼을 넣지 않는다).
  const cards = specs.map((c, k) => el("article", { class: `ml-card ${c.cls}`, style: c.style, role: "group", "aria-roledescription": "카드", "aria-label": `${k + 1} / ${specs.length}, ${c.label}` },
    ...c.body,
    el("button", { type: "button", class: "ml-open", "aria-label": `${c.label} — 편지 전체 보기`, onclick: () => onOpen?.() }),
    el("button", { type: "button", class: "ml-edit", "aria-label": `${c.label} 고치기`, onclick: () => onEdit?.(c.target) }, pencil(), "고치기")));

  const pager = el("div", { class: "ml-pager", tabindex: "0", role: "region", "aria-roledescription": "carousel", "aria-label": "그날의 편지" }, cards);
  const dots = cards.map(() => el("i"));
  const prev = el("button", { type: "button", class: "ml-ar", "aria-label": "이전 장" }, chevron(-1));
  const next = el("button", { type: "button", class: "ml-ar", "aria-label": "다음 장" }, chevron(1));
  const big = el("button", { type: "button", class: "ml-big", onclick: () => onOpen?.() }, "크게 보기", chevron(1));
  const nav = el("div", { class: "ml-nav" }, el("div", { class: "ml-steps" }, prev, el("span", { class: "ml-dots", "aria-hidden": "true" }, dots), next), big);

  // 넘김은 편지(letter.js)와 같다: 스크롤 스냅, 양 끝 화살표는 aria-disabled(D-099 icon-button K1), 장이 바뀌면 'N장 중 M장'을 읽는다(D-099 pager K1).
  const step = () => (cards[0]?.getBoundingClientRect().width ?? 300) + 8; // +8은 CSS gap
  const index = () => Math.round(pager.scrollLeft / step());
  const setOff = (btn, off) => { if (off) btn.setAttribute("aria-disabled", "true"); else btn.removeAttribute("aria-disabled"); };
  let spoken = 0;
  const paint = () => {
    const i = Math.min(cards.length - 1, index());
    dots.forEach((d, k) => d.classList.toggle("on", k === i)); setOff(prev, i === 0); setOff(next, i >= cards.length - 1);
    if (i !== spoken) { spoken = i; announce(`${cards.length}장 중 ${i + 1}장, ${specs[i].label}`); }
  };
  const go = (delta) => pager.scrollTo({ left: (index() + delta) * step(), behavior: reducedMotion() ? "auto" : "smooth" });
  pager.addEventListener("scroll", () => requestAnimationFrame(paint), { passive: true });
  prev.addEventListener("click", () => { if (prev.getAttribute("aria-disabled") !== "true") go(-1); });
  next.addEventListener("click", () => { if (next.getAttribute("aria-disabled") !== "true") go(1); });
  pager.addEventListener("keydown", (ev) => { if (ev.key === "ArrowRight") { next.click(); ev.preventDefault(); } if (ev.key === "ArrowLeft") { prev.click(); ev.preventDefault(); } });
  requestAnimationFrame(paint);
  if (cards.length < 2) nav.classList.add("single"); // 한 장뿐이면 넘김 화살표·점을 감추고 '크게 보기'만 둔다

  const node = el("div", { class: "ml" }, pager, nav);
  // h: 카드 높이(px). 작으면(compact) 조약돌을 빼고 이름을 줄인다. 높이가 바뀌면 알약 줄도 다시 맞춘다.
  node.setHeight = (h) => { node.style.setProperty("--ml-h", `${h}px`); node.classList.toggle("compact", h < 150); requestAnimationFrame(() => fitChips(node)); };
  requestAnimationFrame(() => fitChips(node));
  document.fonts?.ready.then(() => { if (node.isConnected) fitChips(node); });
  return node;
}
