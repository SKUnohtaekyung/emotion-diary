// 내 기준 · 기준 쓰기 · 며칠 해 보기 · 전하기 한 줄(TASK-LOOKBACK-01 단계 A 시안, 8판 — 근거는 tasks/lookback/2026-11-12/RESEARCH-FLOW.md). 무엇을 왜 만드는지는 tasks/lookback/2026-11-12/CONCEPT.md, 6판의 구조는 같은 폴더의 ROUND6.md.
// 화면: #/lookback(내 기준 — 탭의 첫 화면) · #/lookback/read·list(다시 읽기, lookback-read.js) · #/lookback/write(기준 쓰기) · #/lookback/try(며칠 해 보기 — 습관이 아니라 며칠 해 보고 스스로 판단하는 작은 실험).
// 원칙: 한 화면에 주된 일 하나. 덜 쓰는 것은 시트나 다음 화면으로 미룬다. 장면은 화면 아래에 폭 끝까지 깔리고 버튼 줄은 가까운 언덕 위에 얹힌다(일기 쓰기·완료 화면과 같은 짜임).
// 달력·통계는 보는 곳이고, 이 탭은 내가 쓴 것이 쌓이는 곳이다. 앱은 기준을 제안하거나 고쳐 주지 않고 실천을 판정하지 않는다(서비스 WHY §12·§20).
// 문구는 두 갈래다 — 제목·물음·장면 설명 줄은 묻고 그리는 말, 버튼·상태·확인은 동사로 짧고 곧은 말(ROUND6.md).
import { el, svgEl, announce, toast, reducedMotion } from "../dom.js";
import { pebbleImg, stoneImg } from "../data.js";
import { openSheet } from "../components/sheet.js";
import { dayCell } from "../components/day.js";
import { scape } from "../lookback/scape.js";
import { renderRead, renderList, daySheet } from "./lookback-read.js";
import { qa, lb, recordOf, recordedDays, todayIso, shiftDay, monthDay, weekday, saveStandard, removeStandard, orderStandards, moveStandard,
  pathState, pathEnd, pathDays, DAY_CHOICES, DAY_MAX, suggestions, tellReason, recordedBetween } from "../lookback/store.js";

// ── 아이콘(기존 화면과 같은 선: 24 viewBox, 둥근 끝) ──
const path = (d, cls) => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: cls }, svgEl("path", { d }));
export const backIcon = () => path("M14.5 5.5 8 12l6.5 6.5");
export const chev = (cls = "st-chev") => path("M9.5 5.5 16 12l-6.5 6.5", cls);
const chevArrow = (dir) => path(dir < 0 ? "M14.5 5.5 8 12l6.5 6.5" : "M9.5 5.5 16 12l-6.5 6.5"); // 달력 탭의 ‹ ›(.cal-arrow)와 같은 선
const closeIcon = () => path("M6 6l12 12M18 6 6 18");
const dotsIcon = () => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "dots3" }, [5, 12, 19].map((cx) => svgEl("circle", { cx, cy: "12", r: "1.7" })));
// 팻말: 둥근 판 하나(7판 — 6판의 화살 모양은 뾰족한 모서리라 걷었다). 장면(scape.js)의 팻말과 같은 모양이다.
const signPost = (cls) => svgEl("svg", { viewBox: "0 0 24 30", "aria-hidden": "true", class: cls },
  svgEl("path", { class: "lb-sign-post", d: "M10.6 11h2.8v18.2h-2.8z" }), svgEl("rect", { class: "lb-sign-board", x: "2", y: "2", width: "20", height: "11", rx: "4" }));
const paper = (field) => el("div", { class: "nt-sheet lb-sheet" }, el("div", { class: "nt-paper" }, field)); // 일기 첫 단계와 같은 줄 노트(notes.css)

let navCount = 0; // 이 문서 안에서 화면을 몇 번 그렸는지 — 처음 연 화면의 ‹는 돌아갈 곳이 없어 정해 둔 화면으로 간다
export const countRender = () => { navCount += 1; };
export const goBack = (navigate, fallback) => () => { if (navCount > 1 && history.length > 1) history.back(); else navigate(fallback); };
export const head = (navigate, fallback, label) => el("div", { class: "info-top" }, el("button", { type: "button", class: "back", "aria-label": label, onclick: goBack(navigate, fallback) }, backIcon()));
export const catsOf = (rec) => rec.cats.filter((c) => rec.emotions.some((e) => e.cat === c));
export const iGa = (w) => ((w.charCodeAt(w.length - 1) - 0xac00) % 28 ? "이" : "가"); // 받침에 따라 이/가
const eulReul = (w) => ((w.charCodeAt(w.length - 1) - 0xac00) % 28 ? "을" : "를");
export const put = (node, ...kids) => node.replaceChildren(...kids.flat(3).filter((k) => k != null && k !== false)); // 빈 자리(null)를 글자로 찍지 않는다
const clean = (v) => v.replace(/\s+/g, " ").trim();
// 문장마다 줄을 나눈다(7판 다섯째 보강): 두 문장을 한 덩어리로 흘리면 좁은 화면에서 '비워 / 둬도'처럼 말뜻의 가운데에서 꺾였다. 문장 하나가 한 줄 단위다.
export const lines = (...texts) => texts.filter(Boolean).map((t) => el("span", { class: "lb-ln", text: t }));

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

// ── 길 끝에서 돌아본 언덕(다 읽은 자리): 먼 언덕과 흰 길, 길 끝에 나의 돌, 길 위에 그 기간의 조약돌 ──
const SPOTS = [[170, 112, 24], [146, 124, 22], [120, 132, 26], [188, 101, 18], [96, 138, 20]];
export function scene({ cats = [] } = {}) {
  const svg = svgEl("svg", { viewBox: "0 0 340 150", preserveAspectRatio: "none", class: "sxd-scene-svg", "aria-hidden": "true", focusable: "false" },
    svgEl("path", { class: "sxd-scene-hill-far", d: "M0,52 C57,32 113,27 170,36 C227,45 283,36 340,24 L340,150 L0,150 Z" }),
    svgEl("path", { class: "sxd-scene-hill-mid", d: "M0,80 C57,60 113,53 170,62 C227,71 283,60 340,47 L340,150 L0,150 Z" }),
    svgEl("path", { class: "sxd-scene-road", d: "M54,150 C92,132 176,128 196,92 L208,94 C204,128 150,138 132,150 Z" }));
  const stone = stoneImg("rest"); stone.classList.add("lb-scene-stone");
  return el("div", { class: "sxd-scene lb-scene", "aria-hidden": "true" }, svg, el("i", { class: "lb-scene-tree t1" }), el("i", { class: "lb-scene-tree t2" }),
    cats.slice(0, SPOTS.length).map((cat, i) => { const [x, y, s] = SPOTS[i]; const p = pebbleImg(cat, { size: s }); p.classList.add("lb-scene-peb");
      p.style.left = `${(x / 340 * 100).toFixed(1)}%`; p.style.bottom = `${150 - y - s / 2}px`; p.style.width = `${s}px`; return p; }), stone);
}

// 기록 하나를 가리키는 작은 알약(날짜 + 그날 첫 마음의 조약돌). 누르면 그 기록이 시트로 올라온다(보던 화면을 떠나지 않는다).
const refRow = (isos) => el("div", { class: "lb-refs" }, [...isos].sort().map((iso) => { const c = catsOf(recordOf(iso))[0];
  return el("button", { type: "button", class: "lb-ref", "aria-label": `${monthDay(iso)} 기록 보기`, onclick: () => daySheet(iso) }, c ? pebbleImg(c, { size: 22 }) : null, el("span", { text: monthDay(iso) })); }));
const slipNode = (s) => [el("span", { class: "lb-slip-text", text: s.text }), s.need ? el("span", { class: "lb-slip-need", text: s.need }) : null,
  s.from.length ? el("span", { class: "lb-slip-pebs", "aria-hidden": "true" }, [...s.from].sort().slice(0, 2).map((iso) => { const c = catsOf(recordOf(iso))[0]; return c ? pebbleImg(c, { size: 26 }) : null; })) : null,
  el("i", { class: "lb-slip-fold", "aria-hidden": "true" })];

// 쪽지의 두 칸(8판): 알게 된 것 + 그래서 나에게 필요한 것(둘째는 비어 있을 수 있다)
const quoteOf = (item) => el("p", { class: "lb-quote" }, item.text, item.need ? el("span", { class: "lb-quote-need", text: item.need }) : null);

// ── 해 본 날들(7판의 날 줄 — 지금은 ?lbe=gap 비교용으로만 쓴다. 이레를 넘으면 점 격자) ──
const rangeText = (x) => `${monthDay(x.start)}부터 ${monthDay(pathEnd(x))}까지`;
function trail(days, walked = new Set()) {
  const t = todayIso();
  // 기간이 이레를 넘으면(7판 일곱째 보강) 요일 글자 없이 작은 점으로만 줄 짓는다 — 90일이 동그라미 아흔 개·열 줄이 되어 화면을 밀어내지 않게. 수는 여전히 적지 않는다.
  return el("ol", { class: `lb-trail${days.length > 14 ? " dense" : ""}`, "aria-label": "이 기간의 날들" }, days.map((iso) => el("li", { class: iso === t ? "today" : "" },
    dayCell({ tag: "span", mini: true, status: walked.has(iso) ? "completed" : "none", today: iso === t, "aria-hidden": "true" }), el("span", { text: iso === t ? "오늘" : weekday(iso) }),
    el("span", { class: "sr", text: `${monthDay(iso)} ${walked.has(iso) ? "해 본 날" : iso > t ? "아직 오지 않은 날" : "표시 없음"}` }))));
}
// 해 보는 기간의 길(8판): 빈 칸을 그리지 않는다. 기간은 한 줄의 길이고, 해 본 날에만 표시가 놓이며 오늘 자리에 민트 점이 선다.
// 빈 점이 '끊긴 날'로 읽히지 않게 하려는 것이다(끊긴 연속 기록 연구에서 옮긴 추론 — RESEARCH-FLOW.md §2.2). 수·비율·이어짐을 적지 않는다.
// ?lbe=gap 이면 7판처럼 빈 칸까지 그린다 — 두 모양을 나란히 보고 고르게 한다.
function pathLine(x) {
  if (qa.gaps) return trail(pathDays(x), x.walked);
  const days = pathDays(x), t = todayIso(), pos = (iso) => `${(((days.indexOf(iso) + 0.5) / days.length) * 100).toFixed(2)}%`;
  const done = days.filter((iso) => x.walked.has(iso));
  return el("div", { class: "lb-path", role: "img", "aria-label": `${monthDay(days[0])}부터 ${monthDay(days[days.length - 1])}까지. ${done.length ? `해 본 날: ${done.map(monthDay).join(", ")}` : "아직 남긴 날이 없어요"}` },
    el("i", { class: "lb-path-track", "aria-hidden": "true" }),
    done.map((iso) => el("span", { class: "lb-path-mark", style: { left: pos(iso) }, "aria-hidden": "true" }, dayCell({ tag: "span", mini: true, status: "completed" }))),
    days.includes(t) ? el("span", { class: "lb-path-today", style: { left: pos(t) }, "aria-hidden": "true" }, el("i"), el("small", { text: "오늘" })) : null,
    el("span", { class: "lb-path-ends", "aria-hidden": "true" }, el("small", { text: monthDay(days[0]) }), el("small", { text: monthDay(days[days.length - 1]) })));
}
// 지난 날 남기기: 나중에 생각났어도 남길 수 있다(끊긴 연속 기록의 손해는 되돌릴 길이 있을 때 약해졌다 — Silverman & Barasch 2023).
function pastSheet(x, onClose) {
  const t = todayIso(), days = pathDays(x).filter((iso) => iso < t);
  openSheet({ title: "지난 날 남기기", secondary: { text: "닫기" }, onClose, body: [el("p", { class: "note" }, lines("해 본 날을 눌러요.", "나중에 생각났어도 괜찮아요.")),
    el("div", { class: "lb-pastdays" }, days.map((iso) => { const b = el("button", { type: "button", class: "choice", "aria-pressed": String(x.walked.has(iso)) }, el("span", { class: "ck", "aria-hidden": "true", text: "✓" }), el("span", { text: `${monthDay(iso)} ${weekday(iso)}` }));
      b.addEventListener("click", () => { const on = !x.walked.has(iso); if (on) x.walked.add(iso); else x.walked.delete(iso); b.setAttribute("aria-pressed", String(on)); }); return b; }))] });
}
// 그날 일기 한 줄(지난 30일 목록과 같은 줄). 누르면 그 기록이 시트로 올라온다.
const dayRow = (iso) => { const rec = recordOf(iso);
  return el("li", { class: "lb-day" }, el("button", { type: "button", class: "lb-day-head", "aria-haspopup": "dialog", onclick: () => daySheet(iso) },
    el("span", { class: "lb-day-pebs", "aria-hidden": "true" }, catsOf(rec).slice(0, 2).map((c) => pebbleImg(c, { size: 26 }))),
    el("span", { class: "lb-day-main" }, el("span", { class: "lb-day-date" }, el("b", { text: monthDay(iso) }), ` ${weekday(iso)}`), el("span", { class: "lb-day-event", text: rec.event })), chev("lb-day-chev"))); };
const pathTitle = (x, tag = "h1") => el(tag, { class: "lb-try-title", tabindex: tag === "h1" ? "-1" : null }, x.when ? el("small", { text: x.when }) : null, " ", el("span", { text: x.what }));

// ══════════════════════ 1. 내 기준 #/lookback (탭의 첫 화면) ══════════════════════
// 주된 일: 내가 쓴 쪽지를 본다. 언덕 위에 쪽지가 놓여 있고, 쪽지 모서리의 조약돌은 그 문장이 나온 날이다.
// 실천하는 것이 있으면 위에 한 줄 띠로만 알린다. 다시 읽기와 기준 쓰기는 아래 버튼 둘이다. 수는 적지 않는다.
function standardSheet(item, navigate, redraw) {
  const del = () => openSheet({ title: "이 기준을 지울까요?", danger: true, body: [el("p", { class: "lb-quote", text: item.text }), el("p", { text: "지우면 되돌릴 수 없어요." })],
    primary: { text: "지우기", onclick: () => { removeStandard(item.id); toast("지웠어요"); redraw(); } }, secondary: { text: "그만두기" } });
  const row = (name, desc, fn, cls = "") => el("button", { type: "button", class: `menu-row ${cls}`, onclick: () => { sh.close(); fn(); } }, el("span", {}, name, el("small", { text: desc })));
  const sh = openSheet({ title: `${monthDay(item.at)}에 쓴 기준`, secondary: { text: "닫기" }, body: [
    quoteOf(item),
    item.from.length ? el("div", { class: "lb-sheet-refs" }, el("p", { class: "st-block-label", text: "이 기준이 나온 기록" }), refRow(item.from)) : null,
    pathState() === "none" && !item.folded ? row("며칠 해 보기", "이 쪽지로 며칠 해 볼 것을 정해요.", () => { draft.from = item.id; navigate("lookback/try"); }) : null,
    row("고치기", "지금의 나에게 맞게 고쳐요.", () => navigate(`lookback/write?id=${item.id}`)),
    item.folded ? null : row("앞으로 옮기기", "한 칸 앞에 놓아요. 끌어서 옮길 수도 있어요.", () => { if (moveStandard(item.id, -1)) redraw(); else toast("맨 앞에 있어요"); }),
    row(item.folded ? "다시 꺼내기" : "접어 두기", item.folded ? "목록에 다시 보여요." : "지우지 않고 넣어 둬요.", () => { item.folded = !item.folded; toast(item.folded ? "접어 뒀어요" : "다시 꺼냈어요"); redraw(); }),
    row("지우기", "되돌릴 수 없어요.", del, "danger")] });
}
// 접어 둔 기준: 시트에 한 줄씩 놓는다. 누르면 그 기준의 시트(다시 꺼내기·고치기·지우기)로 넘어간다.
function foldedSheet(folded, navigate, redraw) {
  const sh = openSheet({ title: "접어 둔 기준", secondary: { text: "닫기" }, body: [
    el("p", { class: "note" }, lines("지우지 않고 넣어 둔 기준이에요.", "누르면 다시 꺼낼 수 있어요.")),
    el("ul", { class: "lb-folded" }, folded.map((s) => el("li", {}, el("button", { type: "button", class: "lb-slip", "aria-haspopup": "dialog", onclick: () => { sh.close(); standardSheet(s, navigate, redraw); } }, slipNode(s)))))] });
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
    const li = ev.target.closest("li"); if (!li || li.parentNode !== ul || !li.dataset.id) return; // 접어 둔 묶음 칸은 옮기지 않는다
    if (isEditing()) { ev.preventDefault(); start(li, ev); return; }
    press = { x: ev.clientX, y: ev.clientY };
    timer = setTimeout(() => { press = null; enter(); start(li, ev); }, 450);
  });
  ul.addEventListener("pointermove", (ev) => {
    if (!drag) { if (press && Math.hypot(ev.clientX - press.x, ev.clientY - press.y) > 8) { clearTimeout(timer); press = null; } return; }
    place(ev);
    drag.li.style.pointerEvents = "none"; const over = document.elementFromPoint(ev.clientX, ev.clientY)?.closest("li"); drag.li.style.pointerEvents = "";
    if (over && over !== drag.li && over.parentNode === ul && over.dataset.id) { const all = lis(); flip(() => { if (all.indexOf(over) > all.indexOf(drag.li)) over.after(drag.li); else over.before(drag.li); }); place(ev); }
  });
  const end = () => { clearTimeout(timer); press = null; if (!drag) return; const li = drag.li; drag = null; li.classList.remove("is-dragging"); li.style.transform = ""; onOrder(lis().filter((n) => n.dataset.id).map((n) => Number(n.dataset.id))); };
  ul.addEventListener("pointerup", end); ul.addEventListener("pointercancel", end);
}
function renderHome(main, navigate) {
  const screen = el("div", { class: "screen lb lb-note lb-home" });
  let editing = false;
  function draw() {
    const open = lb.standards.filter((s) => !s.folded), folded = lb.standards.filter((s) => s.folded), marks = lb.marks.size, st = pathState(), few = open.length <= 2;
    const slip = (s) => el("li", { "data-id": s.id }, el("button", { type: "button", class: `lb-slip ${few ? "mid" : "small"}`, "aria-haspopup": "dialog", onclick: () => { if (!editing) standardSheet(s, navigate, draw); } }, slipNode(s)));
    const foldCell = folded.length ? el("li", { class: "lb-fold-cell" }, el("button", { type: "button", class: "lb-fold", "aria-haspopup": "dialog", onclick: () => { if (!editing) foldedSheet(folded, navigate, draw); } },
      el("i", { class: "lb-fold-stack", "aria-hidden": "true" }), el("span", { text: `접어 둔 기준 ${folded.length}장` }), chev())) : null;
    const list = open.length || folded.length ? el("ul", { class: `lb-slips ${few ? "few" : "grid"}${editing ? " is-editing" : ""}` }, open.map(slip), foldCell) : null;
    const editBtn = open.length > 1 ? el("button", { type: "button", class: "link lb-edit-toggle", "aria-pressed": String(editing), text: editing ? "완료" : "순서 바꾸기", onclick: () => { editing = !editing; draw(); screen.querySelector(".lb-edit-toggle")?.focus(); } }) : null;
    const hint = el("p", { class: "caption lb-edit-hint", hidden: !editing, text: "끌어서 자리를 바꿔요." });
    if (list) reorderable(list, { isEditing: () => editing, enter: () => { editing = true; list.classList.add("is-editing"); if (editBtn) { editBtn.textContent = "완료"; editBtn.setAttribute("aria-pressed", "true"); } hint.hidden = false; announce("끌어서 자리를 바꿀 수 있어요"); },
      onOrder: (ids) => { orderStandards(ids); announce("자리를 바꿨어요"); } });
    // 한 줄 띠: 해 보는 것이 있으면 그것을, 없으면 '며칠 해 보기'의 입구를 둔다(8판 — 쪽지 시트 안에만 있으면 숨은 단계가 둘이었다. 쪽지 없이도 시작할 수 있다).
    const strip = st === "none" ? el("a", { class: "lb-strip", href: "#/lookback/try", onclick: () => { draft.from = null; } },
      el("span", { class: "lb-strip-text" }, el("small", { text: "며칠 해 보기" }), el("b", { text: "해 볼 것 하나를 정해요" })), chev())
      : el("a", { class: "lb-strip", href: "#/lookback/try" },
        el("span", { class: "lb-strip-text" }, el("small", { text: st === "ended" ? "정한 기간이 끝났어요" : "해 보는 중" }), el("b", { text: lb.path.what })), chev());
    const read = () => navigate("lookback/read?p=7"), write = () => navigate("lookback/write");
    put(screen, el("div", { class: "lb-note-land", "aria-hidden": "true" }, el("i", { class: "far" }), el("i", { class: "lb-scene-tree t1" }), el("i", { class: "lb-scene-tree t2" }), el("i", { class: "mid" })),
      el("div", { class: "lb-note-head" }, el("h1", { tabindex: "-1", text: "내 기준" }), editBtn),
      el("p", { class: "lede", text: lb.standards.length ? "다시 읽다가 써 둔 나의 기준이에요." : "나에게 중요한 것을 써 두는 곳이에요." }),
      hint, strip,
      lb.standards.length ? null : el("div", { class: "lb-empty" }, el("p", { class: "lb-empty-title", text: "아직 쓴 기준이 없어요" }),
        el("p", { class: "note" }, lines("다시 읽다가 '나는 이럴 때 이렇구나'", "싶은 순간에 한 줄 써 두면", "여기에 쪽지로 남아요."))),
      list,
      el("div", { class: "sd-actions lb-home-actions" },
        marks ? el("p", { class: "lb-home-marks", text: `모아 둔 기록 ${marks}편이 있어요` }) : null,
        el("div", { class: "lb-home-btns" }, marks ? [el("button", { type: "button", class: "btn secondary big", text: "다시 읽기", onclick: read }), el("button", { type: "button", class: "btn primary big", text: "기준 쓰기", onclick: write })]
          : [el("button", { type: "button", class: "btn secondary big", text: "바로 쓰기", onclick: write }), el("button", { type: "button", class: "btn primary big", text: "다시 읽기", onclick: read })])));
  }
  put(main, screen); draw();
}

// ══════════════════════ 2. 기준 쓰기·고치기 #/lookback/write(?id=) ══════════════════════
// 주된 일: 한 줄을 쓴다. 일기의 첫 단계('오늘 있었던 일')와 같은 줄 노트·아침 길 장면이다. 모아 둔 기록은 알약으로만 놓이고, 누르면 시트로 다시 읽는다.
function renderWrite(main, navigate, params) {
  const editing = lb.standards.find((s) => s.id === Number(params.get("id")));
  const refs = editing ? [...editing.from] : [...lb.marks];
  const hint = el("p", { class: "blocked-hint", id: "lbWriteHint", hidden: true, role: "status" });
  const save = el("button", { type: "button", class: "btn primary big", text: "저장", "aria-describedby": "lbWriteHint", onclick: submit });
  const input = el("textarea", { id: "lbLine", class: "ruled", rows: 2, maxlength: 80, placeholder: "예: 약속이 깨질 때 크게 흔들린다" });
  const need = el("textarea", { id: "lbNeed", class: "ruled", rows: 1, maxlength: 60, placeholder: "예: 미리 말해 주는 사람이 좋다" }); // 둘째 칸(선택): 관찰을 바람으로 돌리는 다리 — 근거 없는 가설이라 시험할 것(RESEARCH-FLOW.md §2.5)
  input.value = editing?.text ?? ""; need.value = editing?.need ?? "";
  const sync = () => { const bad = !clean(input.value); save.setAttribute("aria-disabled", String(bad)); if (!bad) hint.hidden = true; };
  input.addEventListener("input", sync);
  function submit() {
    const text = clean(input.value);
    if (!text) { hint.textContent = "알게 된 것을 한 줄 써 주세요."; hint.hidden = false; input.focus(); return; }
    const made = saveStandard({ id: editing?.id, text, need: clean(need.value), from: refs });
    if (!editing) lb.marks.clear(); // 모아 둔 기록은 이 기준에 붙어 남고, 모아 두는 자리는 비운다
    navigate("lookback"); toast(editing ? "고쳤어요" : "내 기준에 남겼어요");
    // 한 번만 묻는 초대(8판): 처음 쪽지를 남긴 직후, 해 보는 것이 없을 때. 닫으면 다시 묻지 않는다(반복하면 무시를 배우게 한다 — NN/g).
    if (!editing && pathState() === "none" && !lb.invited.has("try")) { lb.invited.add("try");
      setTimeout(() => openSheet({ title: "이 쪽지로 며칠 해 볼까요?", body: [quoteOf(made), el("p", { class: "note" }, lines("해 볼 것 하나를 정해 며칠 해 보는 거예요.", "지금 정하지 않아도 돼요."))],
        primary: { text: "며칠 해 보기", onclick: () => { draft.from = made.id; navigate("lookback/try"); } }, secondary: { text: "닫기" } }), 350); }
  }
  const field = el("div", { class: "field" }, el("label", { for: "lbLine", class: "field-label", text: "알게 된 것" }), input,
    el("label", { for: "lbNeed", class: "field-label" }, "그래서 나에게 필요한 것", el("span", { class: "lb-opt", text: " · 비워 둬도 돼요" })), need);
  put(main, el("div", { class: `screen write lb-write${qa.keyboard ? " lb-kb-on" : ""}` },
    el("div", { class: "write-top" }, el("button", { type: "button", class: "back", "aria-label": "닫기", onclick: goBack(navigate, "lookback") }, closeIcon())),
    el("h1", { tabindex: "-1", text: editing ? "기준 고치기" : "무엇을 알게 됐나요?" }),
    el("p", { class: "paper-guide" }, lines("한 줄이면 충분해요.", "한 걸음 떨어져 적어도 좋아요.")),
    refs.length ? el("div", { class: "lb-write-refs" }, el("p", { class: "st-block-label", text: editing ? "이 기준이 나온 기록" : "모아 둔 기록 · 누르면 다시 볼 수 있어요" }), refRow(refs)) : null,
    hint, paper(field), scape({ compact: true, foot: el("div", { class: "step-footer solo lb-foot" }, save) })),
    qa.keyboard ? el("div", { class: "lb-kb", "aria-hidden": "true", text: "자판이 올라온 자리(시안)" }) : null);
  sync();
}

// ══════════════════════ 3. 며칠 해 보기 #/lookback/try ══════════════════════
// 정하기는 두 걸음이다 — ① 무엇을(노트에 큰 글자로 쓴다, 아침 길 들머리) ② 며칠 동안(길 들머리에 팻말을 세운다). 예시는 시트로 미룬다.
// 해 보는 중: 해 본 날을 남길 수 있다(선택, 알림 없음, 지난 날도). 진행을 기록하면 실제로 더 하게 됐다(Harkin 외 2016) — 실험에서는 해 본 날이 끝에서 비교할 자료다.
// 끝: 해 본 날과 안 한 날의 일기를 나란히 보고 스스로 판단한다(이 앱의 일기가 곧 자료다). 앱은 결론을 내지 않는다.
const draft = { when: "", what: "", days: 7, from: null, alarm: true };
const flowTop = (label, ratio, onClose) => [el("div", { class: "write-top" }, el("button", { type: "button", class: "back", "aria-label": "닫기", onclick: onClose }, closeIcon()), el("span", { class: "step-count", text: label }), el("span", { class: "lb-top-gap" })),
  el("div", { class: "progress", "aria-hidden": "true" }, el("i", { style: { width: `${ratio * 100}%` } }))];
function exampleSheet(std, fill) {
  const sh = openSheet({ title: "예시", secondary: { text: "닫기" }, body: [
    el("p", { class: "note" }, lines("내 기록에 자주 나온 말로 고른 예시예요.", "고른 뒤에 내 말로 고쳐 써요.")),
    el("ul", { class: "lb-sugs" }, suggestions(std).slice(0, 5).map((g) => el("li", {}, el("button", { type: "button", class: "lb-sug", onclick: () => { sh.close(); fill(g); } },
      el("span", { class: "lb-sug-text", text: `${g.when} · ${g.what}` }), el("small", { text: g.why })))))] });
}
function renderPick(main, navigate, params) {
  const std = lb.standards.find((s) => s.id === draft.from) ?? null;
  const leave = () => { Object.assign(draft, { when: "", what: "", days: 7, from: null, alarm: true }); goBack(navigate, "lookback")(); };
  const hint = el("p", { class: "blocked-hint", id: "lbTryHint", hidden: true, role: "status" });
  if (params?.get("step") === "2" && clean(draft.what)) { // ── ② 며칠 동안 ──
    const body = el("div", { class: "lb-days-pick" });
    // 직접 정하기(7판 여섯째 보강): 달력 한 달을 펴 놓고 끝나는 날을 누른다. ‹ ›로 다음 달까지 넘겨 고른다. 8판에서 상한을 90일에서 4주(DAY_MAX)로 줄였다 — 습관 기간이 아니라 며칠 해 보는 실험이라서다.
    // (넷째 보강의 '30일을 이레씩 줄 지운 판'은 30일 밖을 고를 수 없고 요일 칸이 진짜 달력과 달라 불편했다. 그 전의 −/+는 긴 기간이 번거로웠다.)
    // 달력 탭과 같은 짜임(일~토 요일 줄, ‹ › 둥근 단추). 오늘~끝 = 옅은 민트, 끝나는 날 = ink, 오늘 앞·상한 뒤는 누를 수 없다. 방향키 ← → 하루, ↑ ↓ 이레(달을 넘으면 달도 넘어간다).
    const MAX = DAY_MAX;
    let view = null; // 보고 있는 달 { y, m } — '직접 정하기'를 처음 열면 끝나는 날의 달
    const isoOf = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const endPick = () => {
      const t = todayIso(), diff = (iso) => Math.round((Date.parse(iso) - Date.parse(t)) / 864e5), endIso = shiftDay(t, draft.days - 1), lastIso = shiftDay(t, MAX - 1);
      if (!view) view = { y: Number(endIso.slice(0, 4)), m: Number(endIso.slice(5, 7)) - 1 };
      const monthKey = (iso) => iso.slice(0, 7), viewKey = isoOf(view.y, view.m, 1).slice(0, 7);
      const go = (iso, focus) => { const k = Math.max(0, Math.min(MAX - 1, diff(iso))), to = shiftDay(t, k); draft.days = k + 1; view = { y: Number(to.slice(0, 4)), m: Number(to.slice(5, 7)) - 1 }; drawDays(true); if (focus) body.querySelector(`[data-iso="${to}"]`)?.focus(); };
      const first = new Date(view.y, view.m, 1).getDay(), n = new Date(view.y, view.m + 1, 0).getDate();
      const cells = Array.from({ length: first }, () => el("span", { class: "lb-endday blank", "aria-hidden": "true" }));
      const inView = monthKey(endIso) === viewKey;
      for (let d = 1; d <= n; d += 1) {
        const iso = isoOf(view.y, view.m, d), k = diff(iso), off = k < 0 || k >= MAX, end = k === draft.days - 1;
        const firstOn = !inView && !off && (d === 1 || k === 0);
        const b = el("button", { type: "button", role: "radio", class: `lb-endday${!off && k < draft.days ? " in" : ""}${k === 0 ? " today" : ""}${off ? " off" : ""}`, "data-iso": iso,
          "aria-checked": String(end), "aria-disabled": off ? "true" : null, tabindex: end || firstOn ? "0" : "-1",
          "aria-label": `${monthDay(iso)} ${weekday(iso)}요일${k === 0 ? ", 오늘" : ""}${off ? ", 고를 수 없어요" : `까지 ${k + 1}일`}` },
          k === 0 ? el("small", { text: "오늘" }) : null, el("span", { text: String(d) }));
        b.addEventListener("click", () => { if (!off) go(iso, true); });
        b.addEventListener("keydown", (ev) => { const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 }[ev.key]; if (step) { ev.preventDefault(); go(shiftDay(iso, step), true); } });
        cells.push(b);
      }
      const arrow = (dir, label, offArrow) => el("button", { type: "button", class: "cal-arrow", "aria-label": label, "aria-disabled": offArrow ? "true" : null,
        onclick: () => { if (offArrow) return; view = { y: view.y + (view.m + dir < 0 ? -1 : view.m + dir > 11 ? 1 : 0), m: (view.m + dir + 12) % 12 }; drawDays(true); body.querySelector(`[aria-label="${label}"]`)?.focus(); } }, chevArrow(dir));
      return el("div", { class: "lb-endpick" },
        el("p", { class: "lb-endpick-sum", "aria-live": "polite" }, el("b", { text: `${draft.days}일` }), ` · ${monthDay(endIso)}까지`),
        el("div", { class: "lb-endnav" }, arrow(-1, "이전 달", viewKey <= monthKey(t)), el("b", { text: `${view.y}년 ${view.m + 1}월` }), arrow(1, "다음 달", viewKey >= monthKey(lastIso))),
        el("div", { class: "lb-endgrid lb-endhead", "aria-hidden": "true" }, ["일", "월", "화", "수", "목", "금", "토"].map((w) => el("span", { text: w }))),
        el("div", { class: "lb-endgrid", role: "radiogroup", "aria-label": `끝나는 날, ${view.y}년 ${view.m + 1}월` }, cells));
    };
    const drawDays = (custom = !DAY_CHOICES.includes(draft.days)) => {
      put(body, radios("st-pills", "st-pill", "기간", [...DAY_CHOICES.map((d) => [d, `${d}일`]), [0, "직접 정하기"]], custom ? 0 : draft.days, (d) => { if (d) draft.days = d; view = null; drawDays(d === 0); }),
        custom ? endPick() : pathLine({ start: todayIso(), days: draft.days, walked: new Set() }),
        el("p", { class: "caption" }, lines(custom ? "끝나는 날을 눌러요. 4주 안에서 고를 수 있어요." : `오늘부터 ${monthDay(shiftDay(todayIso(), draft.days - 1))}까지예요.`, "끝나는 날에 한 번만 알려 드려요.")));
    };
    drawDays();
    put(main, el("div", { class: "screen write lb-flow" }, flowTop("2 / 2", 1, leave),
      el("h1", { tabindex: "-1", text: "며칠 동안 해 볼까요?" }),
      el("p", { class: "lb-quote", text: [draft.when, draft.what].filter(Boolean).join(" · ") }), body,
      scape({ sign: true, compact: true, foot: el("div", { class: "step-footer lb-foot" }, el("button", { type: "button", class: "btn text", text: "이전", onclick: () => navigate("lookback/try") }),
        el("button", { type: "button", class: "btn primary big", text: "시작하기", onclick: () => { lb.path = { when: clean(draft.when), what: clean(draft.what), days: draft.days, start: todayIso(), walked: new Set(), from: draft.from, alarm: draft.alarm };
          Object.assign(draft, { when: "", what: "", days: 7, from: null }); navigate("lookback/try"); toast("오늘부터 시작해요"); } })) })));
    return;
  }
  // ── ① 무엇을 ──
  const blank = (id, label, cls, value) => { const t = el("textarea", { id, class: `lb-blank ${cls}`, rows: 1, placeholder: label, "aria-label": label, enterkeyhint: "done" }); t.value = value;
    t.grow = () => { t.style.height = "auto"; t.style.height = `${t.scrollHeight}px`; };
    t.addEventListener("input", () => { t.value = [...t.value.replace(/\n/g, " ")].slice(0, 30).join(""); t.grow(); draft.when = when.value; draft.what = what.value; sync(); }); return t; };
  const when = blank("lbWhen", "어떤 때", "when", draft.when), what = blank("lbWhat", "이렇게 해 보기", "what", draft.what);
  const next = el("button", { type: "button", class: "btn primary big", text: "다음", "aria-describedby": "lbTryHint", onclick: () => {
    if (!clean(what.value)) { hint.textContent = "해 볼 것을 써 주세요."; hint.hidden = false; what.focus(); return; } navigate("lookback/try?step=2"); } });
  function sync() { const bad = !clean(what.value); next.setAttribute("aria-disabled", String(bad)); if (!bad) hint.hidden = true; }
  const field = el("div", { class: "field lb-madlib" }, when, what,
    el("button", { type: "button", class: "link lb-example-btn", text: "예시 보기", onclick: () => exampleSheet(std, (g) => { when.value = g.when; what.value = g.what; draft.when = g.when; draft.what = g.what; when.grow(); what.grow(); sync(); what.focus(); }) }));
  put(main, el("div", { class: "screen write lb-flow" }, flowTop("1 / 2", 0.5, leave),
    el("h1", { tabindex: "-1", text: "무엇을 해 볼까요?" }),
    el("p", { class: "paper-guide" }, lines(std ? `'${std.text}'에서 시작해요.` : null, "며칠 동안 해 볼 것 하나를 적어요.", std ? null : "'어떤 때'는 비워 둬도 돼요.")),
    hint, paper(field), scape({ compact: true, foot: el("div", { class: "step-footer solo lb-foot" }, next) })));
  requestAnimationFrame(() => { when.grow(); what.grow(); }); sync();
}
function renderActive(main, navigate) {
  const x = lb.path, t = todayIso();
  const screen = el("div", { class: "screen write lb-flow lb-doing" }), foot = el("div", { class: "step-footer lb-foot" });
  const menu = () => { const sh = openSheet({ title: "며칠 해 보기", secondary: { text: "닫기" }, body: [
    el("button", { type: "button", class: "menu-row", onclick: () => { sh.close(); navigate("lookback/read?p=x"); } }, el("span", {}, "이 기간의 기록 읽기", el("small", { text: "해 보는 동안 남긴 기록을 다시 읽어요." }))),
    el("button", { type: "button", class: "menu-row", onclick: () => { sh.close(); x.alarm = x.alarm === false; toast(x.alarm ? "끝나는 날에 알려 드려요" : "알리지 않아요"); } }, el("span", {}, x.alarm === false ? "끝나는 날 알림 켜기" : "끝나는 날 알림 끄기", el("small", { text: `${monthDay(pathEnd(x))}에 한 번만 알려요.` }))),
    el("button", { type: "button", class: "menu-row", onclick: () => { sh.close(); openSheet({ title: "여기서 멈출까요?", body: [el("p", { text: "멈춰도 그동안 남긴 기록은 그대로 있어요." })],
      primary: { text: "멈추기", onclick: () => { lb.path = null; navigate("lookback"); toast("멈췄어요"); } }, secondary: { text: "그만두기" } }); } }, el("span", {}, "여기서 멈추기", el("small", { text: "기간이 남아도 멈출 수 있어요." })))] }); };
  function draw(focusSel) {
    const did = x.walked.has(t);
    put(screen, el("div", { class: "write-top" }, el("button", { type: "button", class: "back", "aria-label": "뒤로", onclick: goBack(navigate, "lookback") }, backIcon()), el("span", { class: "step-count", text: "해 보는 중" }),
      el("button", { type: "button", class: "back", "aria-label": "더보기", "aria-haspopup": "dialog", onclick: menu }, dotsIcon())),
      pathTitle(x), el("p", { class: "sxd-sub lb-center", text: rangeText(x) }), pathLine(x),
      el("p", { class: "caption lb-center" }, lines("해 본 날만 남아요.", "안 한 날도 끝에서 비교할 수 있는 날이에요.")),
      x.start < t ? el("button", { type: "button", class: "link lb-past-btn", "aria-haspopup": "dialog", text: "지난 날 남기기", onclick: () => pastSheet(x, () => draw()) }) : null,
      scape({ sign: true, foot }));
    put(foot, did ? [el("p", { class: "lb-did", role: "status", text: "오늘은 해 본 날로 남겼어요" }), el("button", { type: "button", class: "btn text lb-did-btn", text: "지우기", onclick: () => { x.walked.delete(t); draw(".lb-did-btn"); } })]
      : el("button", { type: "button", class: "btn primary big lb-did-btn", text: "오늘 해 봤어요", onclick: () => { x.walked.add(t); announce("오늘을 해 본 날로 남겼어요"); draw(".lb-did-btn"); } }));
    if (focusSel) foot.querySelector(focusSel)?.focus();
  }
  draw(); put(main, screen);
}
function renderEnded(main, navigate, params) {
  const x = lb.path, plan = [x.when, x.what].filter(Boolean).join(" · ");
  const recs = recordedBetween(x.start, pathEnd(x)), tried = recs.filter((iso) => x.walked.has(iso)), other = recs.filter((iso) => !x.walked.has(iso));
  const top = el("div", { class: "write-top" }, el("button", { type: "button", class: "back", "aria-label": "뒤로", onclick: goBack(navigate, "lookback") }, backIcon()), el("span", { class: "step-count", text: "정한 기간이 끝났어요" }), el("span", { class: "lb-top-gap" }));
  if (params?.get("end") !== "2") { // ── ① 해 본 날 · 안 한 날의 일기를 나란히 본다(비교 — Bentvelzen 외 2022의 설계 자원). '나았는지'가 아니라 '달랐는지'를 묻는다 ──
    let group = tried.length ? "tried" : "other";
    const listBox = el("div", { class: "lb-endlist", "aria-live": "polite" });
    const drawList = () => { const isos = group === "tried" ? tried : other;
      put(listBox, isos.length ? el("ul", { class: "lb-days" }, isos.map(dayRow)) : el("p", { class: "note lb-endnone", text: group === "tried" ? "해 본 날에 남긴 일기가 없어요." : "안 한 날에 남긴 일기가 없어요." })); };
    drawList();
    put(main, el("div", { class: "screen write lb-flow lb-ended" }, top,
      el("h1", { tabindex: "-1", class: "lb-ask", text: "해 본 날과 안 한 날, 무엇이 달랐나요?" }),
      el("p", { class: "lb-quote", text: plan }), pathLine(x),
      radios("st-pills lb-endtabs", "st-pill", "보는 날", [["tried", "해 본 날"], ["other", "안 한 날"]], group, (g) => { group = g; drawList(); }),
      listBox, el("p", { class: "caption" }, lines("누르면 그날 일기를 다시 읽어요.", "좋았는지 아닌지는 내가 정해요."))),
      el("div", { class: "step-footer solo" }, el("button", { type: "button", class: "btn primary big", text: "다음", onclick: () => navigate("lookback/try?end=2") })));
    return;
  }
  // ── ② 한 줄로 남기고 다음을 고른다: 이어서 해 보기 · 다르게 해 보기 · 마치기 ──
  const input = el("textarea", { id: "lbAfter", class: "au-input lb-input", rows: 2, maxlength: 80, placeholder: "예: 하루 지나니 할 말이 달라져 있었다", "aria-label": "해 보니 어땠는지 한 줄" });
  const keep = () => lb.past.unshift({ ...x, note: clean(input.value) });
  const again = () => { keep(); lb.path = { ...x, start: todayIso(), walked: new Set() }; navigate("lookback/try"); toast("오늘부터 이어서 해 봐요"); };
  const differ = () => { keep(); Object.assign(draft, { when: x.when, what: x.what, days: x.days, from: x.from ?? null }); lb.path = null; navigate("lookback/try"); };
  const finish = () => { keep(); lb.path = null; navigate("lookback"); toast("마쳤어요"); };
  const row = (name, desc, fn) => el("button", { type: "button", class: "menu-row", onclick: fn }, el("span", {}, name, el("small", { text: desc })), chev());
  put(main, el("div", { class: "screen write lb-flow lb-doing" }, top,
    el("h1", { tabindex: "-1", text: "해 보니 어땠나요?" }),
    el("p", { class: "lb-quote", text: plan }), input, el("p", { class: "caption", text: "비워 둬도 돼요." }),
    el("div", { class: "lb-next" }, row("이어서 해 보기", "같은 것을 오늘부터 다시 며칠 해 봐요.", again), row("다르게 해 보기", "조금 바꿔서 다시 정해요.", differ)),
    scape({ sign: true, compact: true, foot: el("div", { class: "step-footer solo lb-foot" }, el("button", { type: "button", class: "btn primary big", text: "마치기", onclick: finish })) })));
}

export function renderLookback(main, navigate, params, rest = []) {
  const page = rest[0];
  if (page === "read") { renderRead(main, navigate, params); return; }
  if (page === "list") { renderList(main, navigate, params); return; }
  if (page === "write") renderWrite(main, navigate, params);
  else if (page === "try") ({ none: renderPick, active: renderActive, ended: renderEnded })[pathState()](main, navigate, params);
  else renderHome(main, navigate);
  main.querySelector("h1")?.focus({ preventScroll: true });
}

// ══════════════════════ 다른 화면에 붙는 조각 ══════════════════════

// 완료 화면 제목 아래의 한 줄 자리. 둘 중 하나만, 또는 아무것도 나오지 않는다.
// ① 새 주의 첫 일기를 마친 날, 지난 이레에 기록이 몇 편 있으면 다시 읽기를 한 번 초대한다(그 주에는 다시 나오지 않는다 — 새 출발 효과·맥락 안내에서 옮긴 추론, RESEARCH-FLOW.md §2.6).
// ② 그 밖에는 전하기 한 줄: 가끔만 나온다 — 나오는 날과 문장은 store.js tellReason(사용자가 고르고 적은 것만 본다). 입력·저장·버튼이 없다.
// 8판에서 '오늘 해 봤나요?'(해 보는 중일 때 매일 묻던 것)는 뺐다 — 매일 쓰는 흐름에 칸을 더하지 않는다(CONCEPT §2), 같은 물음의 반복은 무시를 배우게 한다.
const TELL = { thanks: "오늘 적은 고마움 중에 전하고 싶은 것이 있나요?", joy: "이 기쁨을 함께 나누고 싶은 사람이 있나요?", big: "이 이야기를 들어 주었으면 하는 사람이 있나요?" };
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
export function tellLine(screen, entry) {
  const headNode = screen.querySelector(".done-head");
  if (!headNode) return;
  const t = todayIso(), monday = shiftDay(t, -((WEEK.indexOf(weekday(t)) + 6) % 7)), key = `read-${monday}`;
  const newWeek = qa.tell === "week" || (!qa.tell && t === monday && recordedDays(7, shiftDay(t, -1)).length >= 3);
  if (newWeek && !lb.invited.has(key)) {
    lb.invited.add(key);
    const row = el("p", { class: "note lb-tell lb-invite" }, el("a", { href: "#/lookback/read?p=7" }, "지난 7일을 이어 읽어 볼까요?", chev("")),
      el("button", { type: "button", class: "lb-invite-x", "aria-label": "이 초대 닫기", onclick: () => row.remove() }, closeIcon()));
    headNode.append(row);
    return;
  }
  const why = tellReason(entry);
  if (why) headNode.append(el("p", { class: "note lb-tell", text: TELL[why] }));
}

// 오늘 화면: 해 보는 것이 있을 때만 숲길 가에 팻말이 서고, 돌 아래에 무엇인지 한 줄로 말한다(계획 문장을 다시 보는 자리 — 되뇐 계획일수록 효과가 컸다, Sheeran 외 2024)('어제 쓰던 글이 있어요 ›'와 같은 자리·같은 모양).
// 누르면 화면을 떠나지 않고 시트가 올라온다 — 무엇을 하기로 했는지, 이 기간의 날들, '오늘 해 봤어요'.
function pathSheet(navigate) {
  const x = lb.path, ended = pathState() === "ended", t = todayIso();
  const bodyNode = el("div", { class: "lb-sheet-path" });
  const draw = () => { const did = x.walked.has(t);
    put(bodyNode, pathTitle(x, "p"), el("p", { class: "sxd-sub lb-center", text: rangeText(x) }), pathLine(x),
      ended ? null : el("button", { type: "button", class: `btn big ${did ? "secondary" : "primary"} lb-sheet-did`, text: did ? "오늘은 해 본 날로 남겼어요 · 지우기" : "오늘 해 봤어요", onclick: () => { if (did) x.walked.delete(t); else x.walked.add(t); draw(); bodyNode.querySelector(".lb-sheet-did")?.focus(); } })); };
  draw();
  openSheet({ title: ended ? "정한 기간이 끝났어요" : "해 보는 중", body: [bodyNode], primary: ended ? { text: "돌아보기", onclick: () => navigate("lookback/try") } : null, secondary: { text: "닫기" } });
}
export function todayMark(box, headNode, navigate) {
  const st = pathState();
  if (st === "none") return;
  const open = (ev) => { ev.preventDefault(); pathSheet(navigate); };
  const label = st === "ended" ? `'${lb.path.what}' 기간이 끝났어요` : `'${lb.path.what}' 해 보는 중`;
  box.append(el("a", { class: `lb-forest-sign${st === "ended" ? " is-ended" : ""}`, href: "#/lookback/try", "aria-label": label, onclick: open }, signPost("lb-forest-sign-svg")));
  if (!box.querySelector(".yline")) box.append(el("p", { class: "yline lb-yline" }, el("a", { href: "#/lookback/try", onclick: open }, label, chev(""))));
}

// 달력의 입구: 날짜를 고르지 않았을 때의 빈 자리에 놓이는 장면 카드(언덕 색 면 위에 그 주의 조약돌). 지난 기록을 읽으려는 사람은 달력으로 오므로 여기에 둔다.
export function calendarEntry() {
  const days = recordedDays(7);
  if (!days.length) return null;
  const cats = [...new Set(days.flatMap((iso) => catsOf(recordOf(iso))))];
  return el("a", { class: "lb-calcard", href: "#/lookback/read?p=7" },
    el("span", { class: "lb-calcard-pebs", "aria-hidden": "true" }, cats.slice(0, 4).map((c) => pebbleImg(c, { size: 26 }))),
    el("span", { class: "lb-calcard-text" }, el("b", { text: "최근 7일 다시 읽기" }), el("span", { text: `기록 ${days.length}편을 하루씩` })), chev());
}
export const statsDetailReader = () => null; // 1판의 2C안(통계 친구 상세에서 이어 읽기)은 고르지 않았다 — stats.js의 자리만 남긴다
