// 돌아보기 · 내 기준 · 실천해 보기 · 전하기 한 줄(TASK-LOOKBACK-01 단계 A 시안, 4판). 무엇을 왜 만드는지는 tasks/lookback/2026-11-12/CONCEPT.md, 판마다 바뀐 것은 같은 폴더의 ROUND2~4.md.
// 화면: #/lookback(한눈에 보기) · #/lookback/read?p=7|30(다시 읽기, lookback-read.js) · #/lookback/note(내 기준) · #/lookback/write(기준 쓰기) · #/lookback/try(실천해 보기).
// 줄기: 다시 읽는다 → 마음에 남는 기록을 모아 둔다 → 모아 둔 기록을 보며 한 줄 적는다(내 기준) → 그 문장으로 며칠 살아 본다. 첫 화면이 이 줄기를 한 장에 보인다.
// 통계와 다른 점: 통계는 수(얼마나 머물렀나)이고 여기는 글(무슨 일이 있었고 나에게 무엇이 중요한가)이다. 이 화면들에는 크기·평균·비교가 없다.
// 앱은 기준을 제안하거나 고쳐 주지 않고, 살아 본 것을 판정하지 않는다 — 문장은 묻거나 있는 것을 말할 뿐이다(서비스 WHY §12·§20).
import { el, svgEl, announce, toast, reducedMotion } from "../dom.js";
import { pebbleImg, stoneImg } from "../data.js";
import { openSheet } from "../components/sheet.js";
import { renderEventScene } from "../components/notes.js";
import { dayCell } from "../components/day.js";
import { renderRead, dayList } from "./lookback-read.js";
import { qa, lb, recordOf, recordedDays, recordedBetween, todayIso, monthDay, weekday, saveStandard, removeStandard, orderStandards, moveStandard,
  pathState, pathEnd, pathDays, DAY_CHOICES, suggestions, tellReason } from "../lookback/store.js";

// ── 아이콘(기존 화면과 같은 선: 24 viewBox, 둥근 끝) ──
const path = (d, cls) => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: cls }, svgEl("path", { d }));
export const backIcon = () => path("M14.5 5.5 8 12l6.5 6.5");
export const chev = (cls = "st-chev") => path("M9.5 5.5 16 12l-6.5 6.5", cls);
const ic = (...d) => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "st-ic" }, d.map((p) => svgEl("path", { d: p })));
const ICONS = {
  read: () => ic("M5 6.2c2.6-.9 4.9-.5 7 1.2 2.1-1.7 4.4-2.1 7-1.2v11.6c-2.6-.9-4.9-.5-7 1.2-2.1-1.7-4.4-2.1-7-1.2z", "M12 7.4V19"),
  bell: () => ic("M7.2 10.2a4.8 4.8 0 0 1 9.6 0v3.3l1.7 2.3H5.5l1.7-2.3z", "M10.2 18a1.9 1.9 0 0 0 3.6 0")
};
const signPost = (cls) => svgEl("svg", { viewBox: "0 0 24 30", "aria-hidden": "true", class: cls },
  svgEl("path", { class: "lb-sign-post", d: "M10.8 9h2.4v20.2h-2.4z" }), svgEl("path", { class: "lb-sign-board", d: "M4 2.6h12.6l4.4 4.6-4.4 4.6H4z" }));

let navCount = 0; // 이 문서 안에서 화면을 몇 번 그렸는지 — 처음 연 화면의 ‹는 돌아갈 곳이 없어 정해 둔 화면으로 간다
export const countRender = () => { navCount += 1; };
export const goBack = (navigate, fallback) => () => { if (navCount > 1 && history.length > 1) history.back(); else navigate(fallback); };
export const head = (navigate, fallback, label) => el("div", { class: "info-top" }, el("button", { type: "button", class: "back", "aria-label": label, onclick: goBack(navigate, fallback) }, backIcon()));
export const chipVars = (cat) => ({ "--chip-fill": `var(--${cat}-chip-fill)`, "--chip-border": `var(--${cat}-chip-border)`, "--chip-text": `var(--${cat}-chip-text)`, "--dot": `var(--${cat}-accent)` });
export const catsOf = (rec) => rec.cats.filter((c) => rec.emotions.some((e) => e.cat === c));
export const iGa = (w) => ((w.charCodeAt(w.length - 1) - 0xac00) % 28 ? "이" : "가"); // 받침에 따라 이/가
const eulReul = (w) => ((w.charCodeAt(w.length - 1) - 0xac00) % 28 ? "을" : "를");
export const put = (node, ...kids) => node.replaceChildren(...kids.flat().filter((k) => k != null && k !== false)); // 빈 자리(null)를 글자로 찍지 않는다
const clean = (v) => v.replace(/\s+/g, " ").trim();

// 고르기 알약 한 벌(radiogroup): 고른 것만 Tab 순서에 들고 ← →로 옮긴다(설정·통계의 고르기와 같은 관행).
function radios(cls, itemCls, label, items, current, onPick) {
  const buttons = items.map(([value, text]) => el("button", { type: "button", class: itemCls, role: "radio", "aria-checked": String(value === current), tabindex: value === current ? "0" : "-1", text }));
  const choose = (i, focus) => { buttons.forEach((b, k) => { b.setAttribute("aria-checked", String(k === i)); b.setAttribute("tabindex", k === i ? "0" : "-1"); }); if (focus) buttons[i].focus(); onPick(items[i][0]); };
  buttons.forEach((b, i) => {
    b.addEventListener("click", () => { if (b.getAttribute("aria-checked") !== "true") choose(i, false); });
    b.addEventListener("keydown", (ev) => { const d = ev.key === "ArrowRight" || ev.key === "ArrowDown" ? 1 : ev.key === "ArrowLeft" || ev.key === "ArrowUp" ? -1 : 0; if (d) { ev.preventDefault(); choose((i + d + buttons.length) % buttons.length, true); } });
  });
  return el("div", { class: cls, role: "radiogroup", "aria-label": label }, buttons);
}

// ── 낮의 언덕 장면: 먼 언덕과 흰 길, 길 끝에 나의 돌(통계 친구 상세의 언덕과 같은 그림법). cats: 길 위에 놓이는 그 기간의 조약돌 · sign: 길 들머리의 팻말 ──
const SPOTS = [[170, 112, 24], [146, 124, 22], [120, 132, 26], [188, 101, 18], [96, 138, 20]];
function scene({ cats = [], sign = false } = {}) {
  const svg = svgEl("svg", { viewBox: "0 0 340 150", preserveAspectRatio: "none", class: "sxd-scene-svg", "aria-hidden": "true", focusable: "false" },
    svgEl("path", { class: "sxd-scene-hill-far", d: "M0,52 C57,32 113,27 170,36 C227,45 283,36 340,24 L340,150 L0,150 Z" }),
    svgEl("path", { class: "sxd-scene-hill-mid", d: "M0,80 C57,60 113,53 170,62 C227,71 283,60 340,47 L340,150 L0,150 Z" }),
    svgEl("path", { class: "sxd-scene-road", d: "M54,150 C92,132 176,128 196,92 L208,94 C204,128 150,138 132,150 Z" }));
  const stone = stoneImg("rest"); stone.classList.add("lb-scene-stone");
  return el("div", { class: "sxd-scene lb-scene", "aria-hidden": "true" }, svg, el("i", { class: "lb-scene-tree t1" }), el("i", { class: "lb-scene-tree t2" }),
    cats.slice(0, SPOTS.length).map((cat, i) => { const [x, y, s] = SPOTS[i]; const p = pebbleImg(cat, { size: s }); p.classList.add("lb-scene-peb");
      p.style.left = `${(x / 340 * 100).toFixed(1)}%`; p.style.bottom = `${150 - y - s / 2}px`; p.style.width = `${s}px`; return p; }),
    sign ? signPost("lb-scene-sign") : null, stone);
}

// 기록 하나를 가리키는 작은 알약(날짜 + 그날 첫 마음의 조약돌). 누르면 그날의 편지가 열린다.
function refChip(iso) {
  const cats = catsOf(recordOf(iso));
  return el("a", { class: "lb-ref", href: `#/record/${iso}?from=lookback`, "aria-label": `${monthDay(iso)} 편지 열기` }, cats[0] ? pebbleImg(cats[0], { size: 22 }) : null, el("span", { text: monthDay(iso) }));
}
export const refRow = (isos) => el("div", { class: "lb-refs" }, [...isos].sort().map(refChip));
const cornerPebs = (s, size = 26) => (s.from.length ? el("span", { class: "lb-slip-pebs", "aria-hidden": "true" }, [...s.from].sort().slice(0, 2).map((iso) => { const c = catsOf(recordOf(iso))[0]; return c ? pebbleImg(c, { size }) : null; })) : null);
const slipNode = (s, cls) => [el("span", { class: "lb-slip-text", text: s.text }), cornerPebs(s), el("i", { class: "lb-slip-fold", "aria-hidden": "true" })].concat(cls ? [] : []);

// ── 살아 보기의 날들: 달력의 날짜 모양(day.js)을 그대로 쓴다. 누른 날만 채워지고 수·비율·이어짐을 적지 않는다 ──
const sentence = (x) => [x.when, x.what].filter(Boolean).join(" · ");
const rangeText = (x) => `${monthDay(x.start)}부터 ${monthDay(pathEnd(x))}까지 · ${x.days}일`;
function trail(x) {
  const t = todayIso();
  return el("ol", { class: "lb-trail", "aria-label": "이 기간의 날들" }, pathDays(x).map((iso) => el("li", { class: iso === t ? "today" : "" },
    dayCell({ tag: "span", mini: true, status: x.walked.has(iso) ? "completed" : "none", today: iso === t, "aria-hidden": "true" }), el("span", { text: iso === t ? "오늘" : weekday(iso) }),
    el("span", { class: "sr", text: `${monthDay(iso)} ${x.walked.has(iso) ? "해 본 날" : iso > t ? "아직 오지 않은 날" : "남긴 표시 없음"}` }))));
}
const pathTitle = (x, tag = "h1") => el(tag, { class: "lb-try-title", tabindex: tag === "h1" ? "-1" : null }, el("small", { text: x.when }), " ", el("span", { text: x.what }));
function todayToggle(x, redraw) {
  const t = todayIso(), on = x.walked.has(t);
  return el("button", { type: "button", class: "choice lb-walk-btn", "aria-pressed": String(on), onclick: () => { if (on) x.walked.delete(t); else x.walked.add(t); announce(on ? "오늘 표시를 지웠어요" : "오늘 해 본 날로 남겼어요"); redraw(".lb-walk-btn"); } },
    el("span", { class: "ck", "aria-hidden": "true", text: "✓" }), el("span", { text: "오늘 해 봤어요" }));
}

// ══════════════════════ 0. 한눈에 보기 #/lookback ══════════════════════
// 길 하나를 따라 네 마디가 놓인다: 다시 읽기 → 모아 둔 기록 → 내 기준 → 실천해 보기. 마디마다 지금 있는 것과 다음에 할 수 있는 것 하나를 보인다.
function renderHub(main, navigate) {
  const week = recordedDays(7), month = recordedDays(30), marks = [...lb.marks], open = lb.standards.filter((s) => !s.folded), st = pathState(), x = lb.path;
  const screen = el("div", { class: "screen lb lb-hub tb-rise" });
  const knot = (title, ...body) => el("li", { class: "lb-knot" }, el("h2", { class: "lb-knot-title", text: title }), body.flat(3));
  const readCard = (p, big, small, n) => el("a", { class: "lb-readcard", href: `#/lookback/read?p=${p}`, "aria-label": `${big}, ${small}, 기록 ${n}편` },
    el("b", { text: big }), el("span", { text: small }), el("em", { text: n ? `기록 ${n}편` : "기록 없음" }), chev("sx-chev"));
  function draw(focusSel) {
    put(screen, scene({ cats: [...new Set(week.flatMap((iso) => catsOf(recordOf(iso))))] }),
      el("h1", { tabindex: "-1", text: "돌아보기" }),
      el("p", { class: "lede", text: "통계가 얼마나 머물렀는지를 센다면, 여기는 그날 무슨 일이 있었는지를 글로 다시 읽는 곳이에요." }),
      el("ol", { class: "lb-knots" },
        knot("다시 읽기", el("div", { class: "lb-readcards" }, readCard(7, "최근 7일", "한 장씩 넘겨 읽기", week.length), readCard(30, "최근 30일", "한눈에 훑어보기", month.length))),
        knot("모아 둔 기록", marks.length
          ? [refRow(marks), el("p", { class: "note", text: "이 기록들을 한데 놓고 보며 나에게 중요한 것을 한 줄 적어요." }), el("button", { type: "button", class: "btn secondary lb-knot-btn", text: "기준 쓰기", onclick: () => navigate("lookback/write") })]
          : el("p", { class: "note", text: "다시 읽다가 마음에 남는 기록을 모아 둘 수 있어요. 모아 둔 기록은 여기에 놓여요." })),
        knot("내 기준", open.length
          ? [el("ul", { class: "lb-slips grid lb-hub-slips" }, open.slice(0, 2).map((s) => el("li", {}, el("a", { class: "lb-slip small", href: "#/lookback/note" }, slipNode(s))))),
            el("a", { class: "st-pill-link", href: "#/lookback/note" }, el("span", { class: "st-pill-link-face" }, "쪽지 모두 보기", chev()))]
          : el("p", { class: "note", text: "모아 둔 기록을 보며 적은 한 줄이 쪽지로 남아요. 아직 적은 쪽지가 없어요." })),
        knot("실천해 보기", st === "active"
          ? [pathTitle(x, "p"), trail(x), todayToggle(x, draw), el("a", { class: "st-pill-link", href: "#/lookback/try" }, el("span", { class: "st-pill-link-face" }, "자세히 보기", chev()))]
          : st === "ended" ? [pathTitle(x, "p"), el("p", { class: "note", text: "정한 기간이 끝났어요. 해 보니 어땠는지 돌아볼 수 있어요." }), el("button", { type: "button", class: "btn secondary lb-knot-btn", text: "돌아보기", onclick: () => navigate("lookback/try") })]
          : [el("p", { class: "note", text: "내 기준 하나를 골라 며칠 실천해 봐요. 어땠는지는 해 본 내가 정해요." }), el("button", { type: "button", class: "btn secondary lb-knot-btn", text: "정해 보기", onclick: () => navigate("lookback/try") })])));
    if (focusSel) screen.querySelector(focusSel)?.focus();
  }
  put(main, screen); draw();
}

// ══════════════════════ 2. 내 기준 #/lookback/note ══════════════════════
// 다시 읽다가 남긴 한 줄은 쪽지다. 쪽지 모서리에는 그 문장을 적을 때 함께 본 기록의 조약돌이 얹혀 있다(어느 날에서 나온 문장인지).
// 1~2장은 큰 쪽지 한 장씩, 3장부터는 두 줄 격자. 길게 누르거나 '순서 바꾸기'를 누르면 쪽지가 흔들리고 끌어서 자리를 바꾼다. 수는 적지 않는다.
function standardSheet(item, navigate, redraw) {
  const del = () => openSheet({ title: "이 쪽지를 지울까요?", danger: true,
    body: [el("p", { class: "lb-quote", text: item.text }), el("p", { text: "지우면 되돌릴 수 없어요. 모아 둔 기록은 그대로 있어요." })],
    primary: { text: "지우기", onclick: () => { removeStandard(item.id); toast("쪽지를 지웠어요"); redraw(); } }, secondary: { text: "그만두기" } });
  const row = (name, desc, fn, cls = "") => el("button", { type: "button", class: `menu-row ${cls}`, onclick: () => { sh.close(); fn(); } }, el("span", {}, name, el("small", { text: desc })));
  const sh = openSheet({ title: `${monthDay(item.at)}에 적은 쪽지`, secondary: { text: "닫기" }, body: [
    el("p", { class: "lb-quote", text: item.text }),
    item.from.length ? el("div", { class: "lb-sheet-refs" }, el("p", { class: "st-block-label", text: "이 문장이 나온 기록" }), refRow(item.from)) : el("p", { class: "caption", text: "기록을 모아 두지 않고 적은 문장이에요." }),
    pathState() === "none" && !item.folded ? row("이 문장으로 실천해 보기", "해 볼 것 하나를 정해요.", () => navigate(`lookback/try?from=${item.id}`)) : null,
    row("고치기", "지금의 나에게 맞게 고쳐요.", () => navigate(`lookback/write?id=${item.id}`)),
    item.folded ? null : row("앞으로 옮기기", "쪽지를 한 칸 앞에 놓아요. 끌어서 옮길 수도 있어요.", () => { if (moveStandard(item.id, -1)) redraw(); else toast("맨 앞에 있어요"); }),
    row(item.folded ? "다시 꺼내 놓기" : "접어 두기", item.folded ? "쪽지를 다시 꺼내 놓아요." : "지우지 않고 잠시 넣어 둬요.", () => { item.folded = !item.folded; toast(item.folded ? "접어 뒀어요" : "다시 꺼내 놓았어요"); redraw(); }),
    row("지우기", "되돌릴 수 없어요.", del, "danger")] });
}
// 끌어서 자리 바꾸기(홈 화면의 앱을 옮기듯): 고치는 중에는 쪽지가 가볍게 흔들리고, 끄는 쪽지가 지나가면 다른 쪽지들이 자리를 내준다. 움직임 줄이기에서는 흔들림·미끄러짐이 없다.
function reorderable(ul, { isEditing, enter, onOrder }) {
  let drag = null, press = null, timer = 0;
  const lis = () => [...ul.children];
  const flip = (fn) => { const before = new Map(lis().map((li) => [li, li.getBoundingClientRect()])); fn(); if (reducedMotion()) return;
    for (const li of lis()) { if (li === drag?.li) continue; const a = before.get(li), b = li.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
      if (dx || dy) li.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: "none" }], { duration: 200, easing: "ease" }); } };
  const place = (ev) => { const li = drag.li; li.style.transform = ""; const r = li.getBoundingClientRect(); li.style.transform = `translate(${ev.clientX - drag.ox - r.left}px,${ev.clientY - drag.oy - r.top}px) scale(1.04)`; };
  const start = (li, ev) => { const r = li.getBoundingClientRect(); drag = { li, ox: ev.clientX - r.left, oy: ev.clientY - r.top }; li.classList.add("is-dragging"); try { ul.setPointerCapture(ev.pointerId); } catch { /* 없어도 된다 */ } place(ev); };
  ul.addEventListener("pointerdown", (ev) => {
    const li = ev.target.closest("li"); if (!li || li.parentNode !== ul) return;
    if (isEditing()) { ev.preventDefault(); start(li, ev); return; }
    press = { x: ev.clientX, y: ev.clientY };
    timer = setTimeout(() => { press = null; enter(); start(li, ev); }, 450);
  });
  ul.addEventListener("pointermove", (ev) => {
    if (!drag) { if (press && Math.hypot(ev.clientX - press.x, ev.clientY - press.y) > 8) { clearTimeout(timer); press = null; } return; }
    place(ev);
    drag.li.style.pointerEvents = "none"; const over = document.elementFromPoint(ev.clientX, ev.clientY)?.closest("li"); drag.li.style.pointerEvents = "";
    if (over && over !== drag.li && over.parentNode === ul) { const all = lis(); flip(() => { if (all.indexOf(over) > all.indexOf(drag.li)) over.after(drag.li); else over.before(drag.li); }); place(ev); }
  });
  const end = () => { clearTimeout(timer); press = null; if (!drag) return; const li = drag.li; drag = null; li.classList.remove("is-dragging"); li.style.transform = ""; onOrder(lis().map((n) => Number(n.dataset.id))); };
  ul.addEventListener("pointerup", end); ul.addEventListener("pointercancel", end);
}
function renderNote(main, navigate) {
  const screen = el("div", { class: "screen settings-sub lb lb-note" });
  let editing = false;
  function draw() {
    const open = lb.standards.filter((s) => !s.folded), folded = lb.standards.filter((s) => s.folded), marks = [...lb.marks];
    const big = open.length <= 2;
    const slip = (s) => el("li", { "data-id": s.id }, el("button", { type: "button", class: `lb-slip ${big ? "mid" : "small"}`, "aria-haspopup": "dialog", onclick: () => { if (!editing) standardSheet(s, navigate, draw); } }, slipNode(s)));
    const list = open.length ? el("ul", { class: `lb-slips ${big ? "few" : "grid"}${editing ? " is-editing" : ""}` }, open.map(slip)) : null;
    const editBtn = open.length > 1 ? el("button", { type: "button", class: "link lb-edit-toggle", "aria-pressed": String(editing), text: editing ? "완료" : "순서 바꾸기", onclick: () => { editing = !editing; draw(); screen.querySelector(".lb-edit-toggle")?.focus(); } }) : null;
    if (list) reorderable(list, { isEditing: () => editing, enter: () => { editing = true; list.classList.add("is-editing"); if (editBtn) { editBtn.textContent = "완료"; editBtn.setAttribute("aria-pressed", "true"); } hint.hidden = false; announce("쪽지를 끌어서 자리를 바꿀 수 있어요"); },
      onOrder: (ids) => { orderStandards(ids); announce("쪽지 자리를 바꿨어요"); } });
    const hint = el("p", { class: "caption lb-edit-hint", hidden: !editing, text: "쪽지를 끌어서 자리를 바꿔요. 다 됐으면 '완료'를 눌러요." });
    const foldedList = el("ul", { class: "lb-slips grid lb-folded", id: "lbFolded", hidden: true }, folded.map((s) => el("li", {}, el("button", { type: "button", class: "lb-slip small", "aria-haspopup": "dialog", onclick: () => standardSheet(s, navigate, draw) }, slipNode(s)))));
    const foldedBtn = folded.length ? el("button", { type: "button", class: "link lb-fold-toggle", "aria-expanded": "false", "aria-controls": "lbFolded", text: "접어 둔 쪽지 보기" }) : null;
    foldedBtn?.addEventListener("click", () => { const on = foldedList.hidden; foldedList.hidden = !on; foldedBtn.setAttribute("aria-expanded", String(on)); foldedBtn.textContent = on ? "접어 둔 쪽지 넣기" : "접어 둔 쪽지 보기"; });
    const how = !lb.standards.length ? el("ol", { class: "lb-how" },
      el("li", {}, el("b", { text: "다시 읽기" }), el("span", { text: "지난 기록을 다시 읽어요." })),
      el("li", {}, el("b", { text: "모아 두기" }), el("span", { text: "마음에 남는 기록을 모아 둬요." })),
      el("li", {}, el("b", { text: "기준 쓰기" }), el("span", { text: "모아 둔 기록을 보며 나에게 중요한 것을 적어요. 그 한 줄이 여기에 쪽지로 남아요." }))) : null;
    put(screen, el("div", { class: "lb-note-land", "aria-hidden": "true" }, el("i", { class: "lb-note-sun" }), el("i", { class: "far" }), el("i", { class: "lb-scene-tree t1" }), el("i", { class: "lb-scene-tree t2" }), el("i", { class: "mid" })),
      head(navigate, "lookback", "돌아보기로"),
      el("div", { class: "lb-note-head" }, el("h1", { tabindex: "-1", text: "내 기준" }), editBtn),
      el("p", { class: "lede", text: lb.standards.length ? "다시 읽다가 적어 둔 내 기준이에요. 쪽지 위 조약돌은 그 문장이 나온 날이에요." : "기록을 다시 읽다가 '나는 이럴 때 이렇구나' 싶을 때 적어 두는 문장이에요." }),
      hint, how, list,
      list ? el("div", { class: "lb-note-stonerow", "aria-hidden": "true" }, Object.assign(stoneImg("rest"), { className: "stone-img rest lb-note-stone" })) : null, // 쪽지 곁에 앉은 나의 돌(장식)
      marks.length ? el("div", { class: "lb-tray" }, el("p", { class: "st-block-label", text: "모아 둔 기록" }), refRow(marks), el("p", { class: "caption", text: "이 기록들을 보며 한 줄 적으면, 그 쪽지에 함께 남아요." })) : null,
      foldedBtn, folded.length ? foldedList : null,
      el("div", { class: "sd-actions" }, lb.standards.length ? null : el("button", { type: "button", class: "btn text big", text: "다시 읽으러 가기", onclick: () => navigate("lookback") }),
        el("button", { type: "button", class: "btn primary big", text: "기준 쓰기", onclick: () => navigate("lookback/write") })));
  }
  put(main, screen); draw();
}

// ══════════════════════ 3. 기준 쓰기·고치기 #/lookback/write(?id=) ══════════════════════
// 일기의 첫 단계('오늘 있었던 일')와 같은 종이·언덕 장면이다. 모아 둔 기록이 위에 놓이고, 적은 한 줄 뒤에 그 기록들이 함께 남는다는 것을 그 자리에서 말한다.
function renderWrite(main, navigate, params) {
  const editing = lb.standards.find((s) => s.id === Number(params.get("id")));
  const refs = editing ? [...editing.from] : [...lb.marks];
  const hint = el("p", { class: "blocked-hint", id: "lbWriteHint", hidden: true, role: "status" });
  const save = el("button", { type: "button", class: "btn primary big", text: editing ? "저장" : "적어 두기", "aria-describedby": "lbWriteHint", onclick: submit });
  const input = el("textarea", { id: "lbLine", class: "ruled", rows: 3, maxlength: 80, placeholder: "예: 약속이 깨질 때 크게 흔들린다" });
  input.value = editing?.text ?? "";
  const sync = () => { const bad = !clean(input.value); save.setAttribute("aria-disabled", String(bad)); if (!bad) hint.hidden = true; };
  input.addEventListener("input", sync);
  function submit() {
    const text = clean(input.value);
    if (!text) { hint.textContent = "한 줄을 적어 주세요."; hint.hidden = false; input.focus(); return; }
    saveStandard({ id: editing?.id, text, from: refs });
    if (!editing) lb.marks.clear(); // 모아 둔 기록은 이 쪽지에 붙어 남고, 모아 두는 자리는 비운다
    navigate("lookback/note"); toast(editing ? "쪽지를 고쳤어요" : "쪽지로 남았어요");
  }
  const field = el("div", { class: "field" }, el("label", { for: "lbLine", class: "field-label", text: "나에게 중요한 것" }), input);
  put(main, el("div", { class: `screen write lb-write${qa.keyboard ? " lb-kb-on" : ""}` },
    el("div", { class: "write-top" }, el("button", { type: "button", class: "back", "aria-label": "뒤로", onclick: goBack(navigate, "lookback/note") }, backIcon())),
    el("h1", { tabindex: "-1", text: editing ? "쪽지 고치기" : "기준 쓰기" }),
    el("p", { class: "paper-guide", text: "어떤 때 어떤 마음이 드는지 적어 볼 수 있어요. 정답은 없고, 나중에 고쳐도 돼요." }),
    refs.length ? el("div", { class: "lb-write-refs" }, el("p", { class: "st-block-label", text: editing ? "이 문장이 나온 기록" : "모아 둔 기록" }), refRow(refs),
      editing ? null : el("p", { class: "caption", text: "눌러서 다시 읽어 볼 수 있어요. 적은 한 줄 뒤에 이 기록들이 함께 남아요." })) : null,
    hint, renderEventScene({ eventField: field, story: "다시 읽고 남기는 한 줄이에요" })),
    el("div", { class: "step-footer solo" }, save),
    qa.keyboard ? el("div", { class: "lb-kb", "aria-hidden": "true", text: "자판이 올라온 자리(시안)" }) : null);
  sync();
}

// ══════════════════════ 4. 실천해 보기 #/lookback/try ══════════════════════
// 큰 글자의 문장 하나를 완성한다: [어떤 때] [이렇게] N일 동안 살아 볼래요. 정하는 것은 모두 사용자다 — 어느 문장에서 시작할지, 어떤 때를 적을지 말지, 며칠인지(직접 정할 수도 있다).
// 예시는 사람이 써 둔 목록에서 규칙으로 고르고(store.js suggestions) 고른 까닭을 함께 보인다. 누르면 빈칸이 채워질 뿐이고 고쳐 쓴다.
function renderPick(main, navigate, params) {
  let days = 7, custom = false, std = lb.standards.find((s) => s.id === Number(params?.get("from"))) ?? null, page = 0;
  const screen = el("div", { class: "screen settings-sub lb lb-try lb-poster" });
  const blank = (id, label, cls) => { const t = el("textarea", { id, class: `lb-blank ${cls}`, rows: 1, placeholder: label, "aria-label": label, enterkeyhint: "done" });
    t.grow = () => { t.style.height = "auto"; t.style.height = `${t.scrollHeight}px`; };
    t.addEventListener("input", () => { t.value = [...t.value.replace(/\n/g, " ")].slice(0, 30).join(""); t.grow(); sync(); }); return t; };
  const when = blank("lbWhen", "어떤 때", "when"), what = blank("lbWhat", "이렇게 해 보기", "what");
  const hint = el("p", { class: "blocked-hint au-hint", id: "lbTryHint", hidden: true, role: "status" });
  const start = el("button", { type: "button", class: "btn primary big", text: "시작하기", "aria-describedby": "lbTryHint", onclick: submit });
  const daysWord = el("b", {}), fromSlot = el("div", { class: "lb-from-slot" }), daySlot = el("div", {}), sugSlot = el("div", { class: "lb-fill" });
  function sync() { const bad = !clean(what.value); start.setAttribute("aria-disabled", String(bad)); if (!bad) hint.hidden = true; }
  function submit() {
    if (!clean(what.value)) { hint.textContent = "해 보고 싶은 것을 적어 주세요."; hint.hidden = false; what.focus(); return; }
    lb.path = { when: clean(when.value), what: clean(what.value), days, start: todayIso(), walked: new Set(), from: std?.id ?? null };
    navigate("lookback/try"); toast("오늘부터 시작해요");
  }
  function pickFrom() {
    const open = lb.standards.filter((s) => !s.folded);
    const sh = openSheet({ title: "어느 문장에서 시작할까요?", secondary: { text: "닫기" }, body: [
      ...open.map((s) => el("button", { type: "button", class: "menu-row", onclick: () => { sh.close(); std = s; page = 0; drawFrom(); drawSug(); } }, el("span", { text: s.text }))),
      el("button", { type: "button", class: "menu-row", onclick: () => { sh.close(); std = null; page = 0; drawFrom(); drawSug(); } }, el("span", {}, "문장 없이 시작하기", el("small", { text: "내 기준과 잇지 않고 바로 정해요." })))] });
  }
  function drawFrom() {
    put(fromSlot, std ? el("p", { class: "lb-quote lb-from", text: std.text }) : null,
      lb.standards.some((s) => !s.folded) ? el("button", { type: "button", class: "st-pill-link", onclick: pickFrom }, el("span", { class: "st-pill-link-face" }, std ? "다른 문장 고르기" : "내 기준에서 시작하기", chev())) : null);
  }
  function drawDays() {
    daysWord.textContent = `${days}일`;
    const pills = radios("st-pills", "st-pill", "기간", [...DAY_CHOICES.map((d) => [d, `${d}일`]), [0, "직접 정하기"]], custom ? 0 : days, (d) => { custom = d === 0; if (!custom) days = d; drawDays(); });
    const step = (delta, label) => el("button", { type: "button", class: "step", "aria-label": label, text: delta < 0 ? "−" : "+", onclick: () => { days = Math.max(1, Math.min(30, days + delta)); drawDays(); daySlot.querySelector(`[aria-label="${label}"]`)?.focus(); } });
    put(daySlot, pills, custom ? el("div", { class: "lb-stepper", role: "group", "aria-label": "기간 직접 정하기" }, step(-1, "하루 줄이기"), el("b", { "aria-live": "polite", text: `${days}일` }), step(1, "하루 늘리기")) : null);
  }
  function drawSug() {
    const all = suggestions(std), shown = all.slice(page * 3, page * 3 + 3);
    put(sugSlot, el("p", { class: "st-block-label", text: "예시로 채워 보기" }),
      el("ul", { class: "lb-sugs" }, shown.map((g) => el("li", {}, el("button", { type: "button", class: "lb-sug", onclick: () => { when.value = g.when; what.value = g.what; when.grow(); what.grow(); sync(); announce("예시로 채웠어요. 내 말로 바꿔도 돼요."); what.focus(); } },
        el("span", { class: "lb-sug-text", text: `${g.when} · ${g.what}` }), el("small", { text: g.why }))))),
      all.length > 3 ? el("button", { type: "button", class: "link", text: "다른 예시 보기", onclick: () => { page = (page + 1) % Math.ceil(all.length / 3); drawSug(); sugSlot.querySelector(".lb-sug")?.focus(); } }) : null,
      el("p", { class: "caption", text: "미리 써 둔 예시에서 내 기록에 나온 말에 맞춰 골라 보여 드려요. 권하는 것이 아니에요. 채운 뒤 내 말로 고쳐 쓰면 돼요." }));
  }
  drawFrom(); drawDays(); drawSug();
  put(screen, head(navigate, "lookback", "돌아보기로"),
    el("h1", { class: "lb-poster-h1", tabindex: "-1", text: "실천해 보기" }), fromSlot,
    el("div", { class: "lb-madlib", role: "group", "aria-label": "해 볼 것" }, when, what, el("p", { class: "lb-madlib-tail" }, daysWord, " 동안 실천해 볼래요.")),
    el("p", { class: "caption lb-madlib-note", text: "'어떤 때'는 비워 둬도 돼요. 어땠는지는 해 본 내가 정해요." }),
    daySlot, sugSlot, scene({ sign: true }),
    el("div", { class: "sd-actions" }, hint, start));
  put(main, screen);
  requestAnimationFrame(() => { when.grow(); what.grow(); }); sync();
}
const periodRecords = (x, emptyText) => { const days = recordedBetween(x.start, pathEnd(x) < todayIso() ? pathEnd(x) : todayIso());
  return el("section", { class: "sx-sec" }, el("h2", { text: "이 기간에 남긴 기록" }), days.length ? dayList(days) : el("p", { class: "note", text: emptyText })); };
const fromLine = (x) => { const s = lb.standards.find((k) => k.id === x.from); return s ? el("p", { class: "caption lb-center", text: `'${s.text}'에서 시작했어요` }) : null; };
function renderActive(main, navigate) {
  const x = lb.path;
  let alarm = true;
  const screen = el("div", { class: "screen settings-sub lb lb-try tb-rise" });
  function draw(focusSel) {
    put(screen, head(navigate, "lookback", "돌아보기로"), scene({ sign: true }),
      el("p", { class: "sx-eyebrow lb-center", text: "실천하는 중" }), pathTitle(x), el("p", { class: "sxd-sub lb-center", text: rangeText(x) }), fromLine(x),
      el("div", { class: "lb-walk" }, trail(x), todayToggle(x, draw), el("p", { class: "caption", text: "누른 날만 채워져요. 누르지 않은 날은 빈칸으로 남을 뿐이에요." })),
      el("div", { class: "st-rows lb-try-rows" }, el("div", { class: "st-row st-switch-row" }, el("span", { class: "st-ic-frame" }, ICONS.bell()), el("span", { class: "st-row-name", text: "끝나는 날 알려 주기" }),
        el("button", { type: "button", class: "switch", role: "switch", "aria-checked": String(alarm), "aria-label": "끝나는 날 알려 주기", onclick: () => { alarm = !alarm; draw(".switch"); } }, el("i", { "aria-hidden": "true" })))),
      el("p", { class: "caption lb-try-note", text: `${monthDay(pathEnd(x))}에 한 번만 알려요. 그 전에는 알리지 않아요.` }),
      periodRecords(x, "아직 남긴 기록이 없어요. 기록은 평소처럼 오늘 화면에서 남겨요."),
      el("button", { type: "button", class: "st-delete-row lb-stop", onclick: () => openSheet({ title: "여기서 멈출까요?", body: [el("p", { text: "멈춰도 그동안 남긴 기록은 그대로 있어요." })],
        primary: { text: "멈추기", onclick: () => { lb.path = null; navigate("lookback"); toast("멈췄어요"); } }, secondary: { text: "그만두기" } }) }, el("span", { text: "여기서 멈추기" }), chev()));
    if (focusSel) screen.querySelector(focusSel)?.focus();
  }
  put(main, screen); draw();
}
function renderEnded(main, navigate) {
  const x = lb.path;
  const input = el("textarea", { id: "lbAfter", class: "au-input lb-input", rows: 2, maxlength: 80, placeholder: "예: 하루 지나니 할 말이 달라져 있었다", "aria-describedby": "lbAfterHelp" });
  const finish = (again) => () => {
    lb.past.unshift({ ...x, note: clean(input.value) });
    lb.path = again ? { ...x, start: todayIso(), walked: new Set() } : null;
    navigate(again ? "lookback/try" : "lookback"); toast(again ? "오늘부터 한 번 더 해 봐요" : "마쳤어요");
  };
  put(main, el("div", { class: "screen settings-sub lb lb-try tb-rise" }, head(navigate, "lookback", "돌아보기로"), scene({ sign: true }),
    el("p", { class: "sx-eyebrow lb-center", text: "정한 기간이 끝났어요" }), pathTitle(x), el("p", { class: "sxd-sub lb-center", text: rangeText(x) }), fromLine(x),
    el("div", { class: "lb-walk" }, trail(x)), periodRecords(x, "이 기간에 남긴 기록은 없어요."),
    el("div", { class: "st-block lb-after" }, el("p", { class: "sx-headline", text: "해 보니 어땠나요?" }),
      el("div", { class: "field" }, el("label", { for: "lbAfter", class: "field-label", text: "한 줄로 적어 두기" }), input, el("p", { id: "lbAfterHelp", class: "au-help", text: "좋았는지 아닌지는 내가 정해요. 비워 둬도 괜찮아요." }))),
    el("div", { class: "sd-actions" }, el("button", { type: "button", class: "btn primary big", text: "마치기", onclick: finish(false) }), el("button", { type: "button", class: "btn text big", text: "한 번 더 해 보기", onclick: finish(true) }))));
}

export function renderLookback(main, navigate, params, rest = []) {
  const page = rest[0];
  if (page === "read") { renderRead(main, navigate, params); return; }
  if (page === "note") renderNote(main, navigate);
  else if (page === "write") renderWrite(main, navigate, params);
  else if (page === "try") ({ none: renderPick, active: renderActive, ended: renderEnded })[pathState()](main, navigate, params);
  else renderHub(main, navigate);
  main.querySelector("h1")?.focus({ preventScroll: true });
}

// ══════════════════════ 다른 화면에 붙는 조각 ══════════════════════

// 완료 화면 제목 아래의 한 줄 자리. 둘 중 하나만, 또는 아무것도 나오지 않는다.
// ① 살아 보는 것이 있으면: 오늘 해 봤는지 한 번 묻는다(기록을 남긴 날에만, 한 번 누르면 사라진다).
// ② 없으면 전하기 한 줄: 가끔만 나온다 — 나오는 날과 문장은 store.js tellReason(사용자가 고르고 적은 것만 본다). 입력·저장·버튼이 없다.
const TELL = { thanks: "오늘 적은 고마움 중에 전하고 싶은 것이 있나요?", joy: "이 기쁨을 함께 나누고 싶은 사람이 있나요?", big: "이 이야기를 들어 주었으면 하는 사람이 있나요?" };
export function tellLine(screen, entry) {
  const headNode = screen.querySelector(".done-head");
  if (!headNode) return;
  const x = lb.path, t = todayIso();
  if (pathState() === "active" && !qa.tell && !x.walked.has(t)) {
    const row = el("div", { class: "lb-done-ask" }, el("p", { class: "note", text: `오늘 '${x.what}'${eulReul(x.what)} 해 봤나요?` }));
    const answer = (yes) => () => { if (yes) x.walked.add(t); row.remove(); announce(yes ? "해 본 날로 남겼어요" : "남기지 않았어요"); };
    row.append(el("div", { class: "lb-done-ask-btns" }, el("button", { type: "button", class: "st-pill", text: "해 봤어요", onclick: answer(true) }), el("button", { type: "button", class: "st-pill", text: "오늘은 아니에요", onclick: answer(false) })));
    headNode.append(row);
    return;
  }
  const why = tellReason(entry);
  if (why) headNode.append(el("p", { class: "note lb-tell", text: TELL[why] }));
}

// 오늘 화면: 살아 보는 것이 있을 때만 숲길 가에 팻말이 서고, 돌 아래에 무엇인지 한 줄로 말한다('어제 쓰던 글이 있어요 ›'와 같은 자리·같은 모양).
// 누르면 화면을 떠나지 않고 시트가 올라온다 — 무엇을 하기로 했는지, 이 기간의 날들, '오늘 해 봤어요'. 자세히 보려면 시트에서 넘어간다.
function pathSheet(navigate) {
  const x = lb.path, ended = pathState() === "ended";
  const bodyNode = el("div", { class: "lb-sheet-path" });
  const draw = (focusSel) => { put(bodyNode, pathTitle(x, "p"), el("p", { class: "sxd-sub lb-center", text: rangeText(x) }),
    el("div", { class: "lb-walk" }, trail(x), ended ? el("p", { class: "note", text: "정한 기간이 끝났어요." }) : todayToggle(x, draw))); if (focusSel) bodyNode.querySelector(focusSel)?.focus(); };
  draw();
  openSheet({ title: ended ? "해 보니 어땠나요?" : "실천하는 중", body: [bodyNode], primary: { text: ended ? "돌아보기" : "자세히 보기", onclick: () => navigate("lookback/try") }, secondary: { text: "닫기" } });
}
export function todayMark(box, headNode, navigate) {
  const st = pathState();
  if (st === "none") return;
  const open = (ev) => { ev.preventDefault(); pathSheet(navigate); };
  const label = st === "ended" ? `'${lb.path.what}' 기간이 끝났어요` : `'${lb.path.what}' 실천하는 중`;
  box.append(el("a", { class: `lb-forest-sign${st === "ended" ? " is-ended" : ""}`, href: "#/lookback/try", "aria-label": label, onclick: open }, signPost("lb-forest-sign-svg")));
  if (!box.querySelector(".yline")) box.append(el("p", { class: "yline lb-yline" }, el("a", { href: "#/lookback/try", onclick: open }, label, chev(""))));
}


export const statsDetailReader = () => null; // 1판의 2C안(통계 친구 상세에서 이어 읽기)은 고르지 않았다 — stats.js의 자리만 남긴다
