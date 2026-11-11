// 돌아보기 · 내 기준 · 해 보는 길 · 전하기 한 줄(TASK-LOOKBACK-01 단계 A 시안, 2판 — 2026-11-12 사용자 피드백 반영).
// 무엇을 왜 만드는지는 tasks/lookback/2026-11-12/CONCEPT.md, 2판에서 바뀐 것은 같은 폴더의 ROUND2.md.
// 화면: #/lookback(이어 읽기) · #/lookback/note(내 기준) · #/lookback/write(한 줄 적기) · #/lookback/try(해 보는 길).
// 이야기: 낮의 언덕길은 지나온 날이다 — 길 위에 그날의 조약돌이 놓여 있고(돌아보기), 다시 읽다가 남긴 문장은 나의 돌로 눌러 둔 쪽지가 된다(내 기준).
//         밤의 숲은 오늘이다 — 며칠 걸어 보기로 한 길 들머리에 팻말이 선다(해 보는 길).
// 앱은 기준을 제안하거나 고쳐 주지 않고, 걸어 본 길을 판정하지 않는다 — 문장은 묻거나 있는 것을 말할 뿐이다(서비스 WHY §12·§20).
import { el, svgEl, announce, toast } from "../dom.js";
import { category, pebbleImg, stoneImg } from "../data.js";
import { openSheet } from "../components/sheet.js";
import { renderEventScene } from "../components/notes.js";
import { dayCell } from "../components/day.js";
import { renderReaderDraft, renderNoteDraft, renderPickPoster } from "./lookback-drafts.js";
import { choice, qa, lb, recordOf, recordedDays, recordedBetween, todayIso, shiftDay, monthDay, monthDayWeek, weekday, toggleMark, saveStandard, removeStandard,
  pathState, pathEnd, pathDays, EXAMPLES, DAY_CHOICES, repeated, tellReason } from "../lookback/store.js";

// ── 아이콘(기존 화면과 같은 선: 24 viewBox, 둥근 끝) ──
const path = (d, cls) => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: cls }, svgEl("path", { d }));
export const backIcon = () => path("M14.5 5.5 8 12l6.5 6.5");
export const chev = (cls = "st-chev") => path("M9.5 5.5 16 12l-6.5 6.5", cls);
const ic = (...d) => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "st-ic" }, d.map((p) => svgEl("path", { d: p })));
export const ICONS = {
  read: () => ic("M5 6.2c2.6-.9 4.9-.5 7 1.2 2.1-1.7 4.4-2.1 7-1.2v11.6c-2.6-.9-4.9-.5-7 1.2-2.1-1.7-4.4-2.1-7-1.2z", "M12 7.4V19"),
  note: () => ic("M7 3.8h6.6L18 8.2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5.8a2 2 0 0 1 2-2z", "M13.4 3.8v4.4H18", "M8.6 12.4h6.8", "M8.6 15.8h4.4"),
  sign: () => ic("M12 20.4V4", "M12 5.6h5.2l2.2 2.4-2.2 2.4H12", "M12 12.4H7.4L5.4 14.6l2 2.2H12"),
  bell: () => ic("M7.2 10.2a4.8 4.8 0 0 1 9.6 0v3.3l1.7 2.3H5.5l1.7-2.3z", "M10.2 18a1.9 1.9 0 0 0 3.6 0")
};
export const signPost = (cls) => svgEl("svg", { viewBox: "0 0 24 30", "aria-hidden": "true", class: cls },
  svgEl("path", { class: "lb-sign-post", d: "M10.8 9h2.4v20.2h-2.4z" }), svgEl("path", { class: "lb-sign-board", d: "M4 2.6h12.6l4.4 4.6-4.4 4.6H4z" }));

let navCount = 0; // 이 문서 안에서 화면을 몇 번 그렸는지 — 처음 연 화면의 ‹는 돌아갈 곳이 없어 정해 둔 화면으로 간다
export const countRender = () => { navCount += 1; };
export const goBack = (navigate, fallback) => () => { if (navCount > 1 && history.length > 1) history.back(); else navigate(fallback); };
export const head = (navigate, fallback, label) => el("div", { class: "info-top" }, el("button", { type: "button", class: "back", "aria-label": label, onclick: goBack(navigate, fallback) }, backIcon()));
export const chipVars = (cat) => ({ "--chip-fill": `var(--${cat}-chip-fill)`, "--chip-border": `var(--${cat}-chip-border)`, "--chip-text": `var(--${cat}-chip-text)`, "--dot": `var(--${cat}-accent)` });
export const catsOf = (rec) => rec.cats.filter((c) => rec.emotions.some((e) => e.cat === c));
export const iGa = (w) => ((w.charCodeAt(w.length - 1) - 0xac00) % 28 ? "이" : "가"); // 받침에 따라 이/가
export const put = (node, ...kids) => node.replaceChildren(...kids.flat().filter((k) => k != null && k !== false)); // 빈 자리(null)를 글자로 찍지 않는다
export const clean = (v) => v.replace(/\s+/g, " ").trim();

// 고르기 알약 한 벌(radiogroup): 고른 것만 Tab 순서에 들고 ← →로 옮긴다(설정·통계의 고르기와 같은 관행).
export function radios(cls, itemCls, label, items, current, onPick) {
  const buttons = items.map(([value, text]) => el("button", { type: "button", class: itemCls, role: "radio", "aria-checked": String(value === current), tabindex: value === current ? "0" : "-1", text }));
  const choose = (i, focus) => {
    buttons.forEach((b, k) => { b.setAttribute("aria-checked", String(k === i)); b.setAttribute("tabindex", k === i ? "0" : "-1"); });
    if (focus) buttons[i].focus();
    onPick(items[i][0]);
  };
  buttons.forEach((b, i) => {
    b.addEventListener("click", () => { if (b.getAttribute("aria-checked") !== "true") choose(i, false); });
    b.addEventListener("keydown", (ev) => {
      const d = ev.key === "ArrowRight" || ev.key === "ArrowDown" ? 1 : ev.key === "ArrowLeft" || ev.key === "ArrowUp" ? -1 : 0;
      if (d) { ev.preventDefault(); choose((i + d + buttons.length) % buttons.length, true); }
    });
  });
  return el("div", { class: cls, role: "radiogroup", "aria-label": label }, buttons);
}

// 한 줄 글 칸(옅은 회색 면, 가입의 이름 칸과 같은 결). 줄이 넘치면 아래로 자란다.
export function lineField({ id, label, placeholder, help, max = 60, value = "", onInput }) {
  const input = el("textarea", { id, class: "au-input lb-input", rows: 1, placeholder, enterkeyhint: "done", "aria-describedby": help ? `${id}Help` : null });
  input.value = value;
  const count = el("span", { class: "au-count", "aria-hidden": "true" });
  const update = () => { count.textContent = `${[...input.value].length}/${max}`; input.style.height = "auto"; input.style.height = `${input.scrollHeight}px`; onInput?.(input.value); };
  input.addEventListener("input", () => { input.value = [...input.value.replace(/\n/g, " ")].slice(0, max).join(""); update(); });
  const node = el("div", { class: "field lb-field" }, el("label", { for: id, class: "field-label", text: label }), input,
    el("div", { class: "au-help-row" }, el("p", { id: `${id}Help`, class: "au-help", text: help ?? "" }), count));
  requestAnimationFrame(update);
  return { node, input, set: (v) => { input.value = v; update(); } };
}

// ── 낮의 언덕 장면: 먼 언덕과 흰 길, 길 끝에 나의 돌(통계 친구 상세의 언덕과 같은 그림법). 화면마다 길 위에 놓이는 것이 다르다 ──
//   cats: 그 기간에 머문 마음의 조약돌(돌아보기) · notes: 돌 아래 눌러 둔 쪽지 몇 장(내 기준) · sign: 길 들머리의 팻말과 그 글(해 보는 길)
const SPOTS = [[170, 112, 24], [146, 124, 22], [120, 132, 26], [188, 101, 18], [96, 138, 20]]; // 길 위 자리(뷰박스 340×150 기준 x, y, 크기)
export function scene({ cats = [], notes = 0, sign = null, tagged = true } = {}) {
  const svg = svgEl("svg", { viewBox: "0 0 340 150", preserveAspectRatio: "none", class: "sxd-scene-svg", "aria-hidden": "true", focusable: "false" },
    svgEl("path", { class: "sxd-scene-hill-far", d: "M0,52 C57,32 113,27 170,36 C227,45 283,36 340,24 L340,150 L0,150 Z" }),
    svgEl("path", { class: "sxd-scene-hill-mid", d: "M0,80 C57,60 113,53 170,62 C227,71 283,60 340,47 L340,150 L0,150 Z" }),
    svgEl("path", { class: "sxd-scene-road", d: "M54,150 C92,132 176,128 196,92 L208,94 C204,128 150,138 132,150 Z" }));
  const stone = stoneImg("rest"); stone.classList.add("lb-scene-stone");
  const tag = sign && tagged ? el("span", { class: "au-tag lb-scene-tag" }, el("span", {})) : null;
  const node = el("div", { class: `sxd-scene lb-scene${notes ? " has-notes" : ""}`, "aria-hidden": "true" }, svg,
    el("i", { class: "lb-scene-tree t1" }), el("i", { class: "lb-scene-tree t2" }),
    cats.slice(0, SPOTS.length).map((cat, i) => { const [x, y, s] = SPOTS[i]; const p = pebbleImg(cat, { size: s }); p.classList.add("lb-scene-peb");
      p.style.left = `${(x / 340 * 100).toFixed(1)}%`; p.style.bottom = `${150 - y - s / 2}px`; p.style.width = `${s}px`; return p; }),
    Array.from({ length: Math.min(3, notes) }, (_, i) => el("i", { class: `lb-scene-slip s${i + 1}` })),
    sign ? signPost("lb-scene-sign") : null, stone, tag);
  node.setSign = (when, what) => { if (!tag) return; const s = [when, what].map(clean).filter(Boolean).join(" · "); tag.classList.toggle("empty", !s); tag.firstChild.textContent = s || "어떤 때 · 이렇게"; };
  if (sign) node.setSign(sign.when ?? "", sign.what ?? "");
  return node;
}

// ── 그날의 쪽지: 통계 친구 상세의 작은 편지(.sxd-peek)와 같은 종이. 표시하면 민트 테이프가 붙는다 — 민트는 '지금 고른 것'의 색이다(D-088) ──
export function recordCard(iso, { markable = true } = {}) {
  const rec = recordOf(iso), cats = catsOf(rec);
  const tape = el("i", { class: "sxd-peek-tape", "aria-hidden": "true", hidden: !lb.marks.has(iso) });
  const sizes = cats.map((c) => `${category(c).label} ${rec.repr[c] ?? "–"}`).join(" · ");
  const words = cats.flatMap((cat) => rec.emotions.filter((e) => e.cat === cat).map((e) => ({ cat, label: e.label })));
  const markBtn = markable ? el("button", { type: "button", class: "choice lb-mark", "aria-pressed": String(lb.marks.has(iso)), "aria-label": `${monthDay(iso)} 기록에 표시` },
    el("span", { class: "ck", "aria-hidden": "true", text: "✓" }), el("span", { text: "표시" })) : null;
  markBtn?.addEventListener("click", () => {
    const on = toggleMark(iso);
    markBtn.setAttribute("aria-pressed", String(on)); tape.hidden = !on;
    announce(`${monthDay(iso)} 기록 ${on ? "표시함" : "표시 지움"}`);
    document.dispatchEvent(new CustomEvent("lb-marks"));
  });
  return el("article", { class: "sxd-peek lb-card", "aria-label": `${monthDayWeek(iso)}의 기록` }, tape,
    el("div", { class: "sxd-peek-top" },
      el("div", {}, el("p", { class: "sxd-peek-date", text: monthDayWeek(iso) }), el("p", { class: "sxd-peek-size", text: sizes })),
      el("span", { class: "lb-seals", "aria-hidden": "true" }, cats.slice(0, 3).map((c) => { const s = pebbleImg(c, { size: 34 }); s.classList.add("sxd-peek-seal"); return s; }))),
    el("div", { class: "sxd-peek-lines" },
      el("p", { class: "lb-ln" }, el("b", { text: "있었던 일" }), rec.event?.trim() || "비워 둔 날이에요"),
      rec.reason?.trim() ? el("p", { class: "lb-ln" }, el("b", { text: "이유" }), rec.reason.trim()) : null),
    el("div", { class: "sxd-peek-chips" }, words.slice(0, 4).map((w) => el("span", { class: "sxd-chip", style: chipVars(w.cat) },
      el("i", { class: "sxd-chip-dot", "aria-hidden": "true" }), el("span", { class: "sxd-chip-label", text: w.label }))),
      words.length > 4 ? el("span", { class: "sxd-peek-more", "aria-label": `고른 말 ${words.length - 4}개 더`, text: `+${words.length - 4}` }) : null),
    el("div", { class: "sxd-peek-sign" }, markBtn ?? el("span", { class: "sxd-peek-sig", text: "— 그날의 나에게" }),
      el("a", { class: "sxd-peek-open", href: `#/record/${iso}?from=lookback` }, "편지 열기", chev("sx-chev"))));
}
// 기록 하나를 가리키는 작은 알약(날짜 + 그날 첫 마음의 조약돌). 누르면 그날의 편지가 열린다.
export function refChip(iso) {
  const cats = catsOf(recordOf(iso));
  return el("a", { class: "lb-ref", href: `#/record/${iso}?from=lookback`, "aria-label": `${monthDay(iso)} 편지 열기` },
    cats[0] ? pebbleImg(cats[0], { size: 22 }) : null, el("span", { text: monthDay(iso) }));
}
export const refRow = (isos) => el("div", { class: "lb-refs" }, [...isos].sort().map(refChip));
let rowSeq = 0;
export function linkRow(icon, name, onclick, value = null) {
  const seq = rowSeq++;
  return el("button", { type: "button", class: "st-row", "aria-label": value ? `${name}, ${value}` : name, onclick },
    el("span", { class: "st-ic-frame", style: { "--fx": seq % 3 === 2 ? -1 : 1, "--fy": seq % 4 === 2 ? -1 : 1 } }, icon()), el("span", { class: "st-row-name", text: name }),
    el("span", { class: "st-row-trail" }, value ? el("span", { class: "st-row-value", "aria-hidden": "true", text: value }) : null, chev()));
}

// ══════════════════════ 1. 이어 읽기 #/lookback ══════════════════════
// 다 읽은 자리: ① 여러 날에 나온 말(센 것만 보인다 — 누르면 그 말이 나온 날만 모아 다시 읽는다) ② 표시한 기록 ③ 물음과 '한 줄 적기'.
// 기준을 권하지 않는다 — 무엇이 되풀이됐는지는 수로만 보이고, 그것이 중요한지는 사용자가 정한다.
function wordSheet(item) {
  openSheet({ title: `'${item.word}'${iGa(item.word)} 나온 ${item.days.length}일`, secondary: { text: "닫기" },
    body: [el("p", { class: "note", text: item.kind === "pick" ? "이 말을 고른 날이에요." : "있었던 일이나 이유에 이 말을 적은 날이에요." }),
      el("div", { class: "lb-roll lb-roll-tight" }, item.days.map((iso) => recordCard(iso)))] });
}
export function endBlock(navigate, days) {
  const rows = el("div", { class: "st-rows lb-rows" }, linkRow(ICONS.note, "내 기준", () => navigate("lookback/note")), linkRow(ICONS.sign, "해 보는 길", () => navigate("lookback/try")));
  if (days.length < 3) return el("section", { class: "lb-end" }, el("p", { class: "sx-eyebrow", text: "여기까지예요" }),
    el("p", { class: "note", text: "기록이 더 쌓이면 여러 날을 이어서 읽을 수 있어요." }), rows);
  const again = repeated(days);
  const marked = el("div", { class: "lb-marked" });
  const paintMarks = () => put(marked, lb.marks.size ? [el("p", { class: "st-block-label", text: "표시한 기록" }), refRow([...lb.marks])] : el("p", { class: "caption", text: "표시한 기록이 아직 없어요. 표시하지 않고 적어도 돼요." }));
  paintMarks();
  const onMarks = () => { if (marked.isConnected) paintMarks(); else document.removeEventListener("lb-marks", onMarks); };
  document.addEventListener("lb-marks", onMarks);
  return el("section", { class: "lb-end" },
    el("div", { class: "lb-end-hill", "aria-hidden": "true" }),
    el("p", { class: "sx-eyebrow", text: "여기까지 읽었어요" }),
    el("p", { class: "sx-headline", text: "반복된 것 중 나에게 중요한 것이 있나요?" }),
    el("p", { class: "note", text: "없어도 괜찮아요. 떠오르는 게 있으면 한 줄로 적어 둘 수 있어요." }),
    again.length ? el("div", { class: "lb-again" }, el("p", { class: "st-block-label", text: "여러 날에 나온 말" }),
      el("div", { class: "sx-pillrow" }, again.map((item) => el("button", { type: "button", class: "sx-pill lb-again-pill", "aria-label": `${item.word}, ${item.days.length}일. 그날들 다시 읽기`, onclick: () => wordSheet(item) },
        item.word, el("em", { text: `${item.days.length}일` })))),
      el("p", { class: "caption", text: "센 것만 보여 드려요. 누르면 그 말이 나온 날을 모아 읽을 수 있어요." })) : null,
    marked,
    el("div", { class: "stack" }, el("button", { type: "button", class: "btn primary big", text: "한 줄 적기", onclick: () => navigate("lookback/write") })), rows);
}
function renderReader(main, navigate, params) {
  if (choice.read !== "a") { renderReaderDraft(main, navigate, params); return; }
  let period = Number(params.get("p")) === 30 ? 30 : 7;
  const body = el("div", { class: "lb-body" }), sceneSlot = el("div", {});
  function draw() {
    const days = recordedDays(period), from = shiftDay(todayIso(), -(period - 1));
    put(sceneSlot, scene({ cats: [...new Set(days.flatMap((iso) => catsOf(recordOf(iso))))] }));
    history.replaceState(null, "", `#/lookback?p=${period}`);
    if (!days.length) {
      const wider = period === 7 && recordedDays(30).length > 0;
      put(body, el("div", { class: "sx-empty" },
        el("p", { class: "sx-headline", text: wider ? "최근 7일에는 남긴 기록이 없어요" : "아직 다시 읽을 기록이 없어요" }),
        el("p", { class: "caption", text: wider ? "최근 30일로 넓혀 볼 수 있어요." : "오늘 화면에서 마음을 남기면 여기에서 이어서 읽을 수 있어요." }),
        wider ? null : el("div", { class: "stack" }, el("button", { type: "button", class: "btn secondary", text: "오늘 화면으로", onclick: () => navigate("today") }))));
      return;
    }
    put(body, el("p", { class: "caption lb-count", text: `${monthDay(from)}부터 오늘까지 · 기록 ${days.length}편` }),
      el("div", { class: "lb-roll" }, days.map((iso) => recordCard(iso))), endBlock(navigate, days));
  }
  const seg = radios("segmented", "", "기간", [[7, "최근 7일"], [30, "최근 30일"]], period, (p) => { period = p; draw(); announce(`최근 ${p}일의 기록`); });
  draw();
  put(main, el("div", { class: "screen lb lb-reader tb-rise" }, head(navigate, "calendar", "달력으로"), sceneSlot,
    el("h1", { tabindex: "-1", text: "돌아보기" }),
    el("p", { class: "lede", text: "지나온 길의 기록을 날짜순으로 다시 읽어요." }),
    el("p", { class: "proto-note" }, el("span", { class: "proto-tag", text: "시안" }), " 아래 기록은 모두 지어낸 예시입니다."),
    seg, body));
}

// ══════════════════════ 2. 내 기준 #/lookback/note ══════════════════════
// 다시 읽다가 남긴 문장은 나의 돌로 눌러 둔 쪽지다. 장 수에 따라 놓는 법이 달라진다(수를 적지는 않는다):
//   1~2장 = 큰 쪽지 한 장씩(딸린 기록까지 보인다) · 3~6장 = 두 줄로 놓은 작은 쪽지 · 7장부터 = 줄 노트 한 장에 한 줄씩.
// 쪽지를 누르면 그 문장의 시트가 열린다(딸린 기록, 고치기·접어 두기·지우기) — 쪽지마다 ⋯를 달지 않는다.
export function standardSheet(item, navigate, redraw) {
  const del = () => openSheet({ title: "이 문장을 지울까요?", danger: true,
    body: [el("p", { class: "lb-quote", text: item.text }), el("p", { text: "지우면 되돌릴 수 없어요. 표시한 기록은 그대로 있어요." })],
    primary: { text: "지우기", onclick: () => { removeStandard(item.id); toast("문장을 지웠어요"); redraw(); } }, secondary: { text: "그만두기" } });
  const sh = openSheet({ title: `${monthDay(item.at)}에 적은 문장`, secondary: { text: "닫기" }, body: [
    el("p", { class: "lb-quote", text: item.text }),
    item.from.length ? el("div", { class: "lb-sheet-refs" }, el("p", { class: "st-block-label", text: "이 문장을 적을 때 함께 본 기록" }), refRow(item.from)) : null,
    el("button", { type: "button", class: "menu-row", onclick: () => { sh.close(); navigate(`lookback/write?id=${item.id}`); } }, el("span", {}, "고치기", el("small", { text: "지금의 나에게 맞게 고쳐요." }))),
    pathState() === "none" ? el("button", { type: "button", class: "menu-row", onclick: () => { sh.close(); navigate(`lookback/try?from=${item.id}`); } }, el("span", {}, "이 문장으로 해 보는 길 정하기", el("small", { text: "며칠 해 볼 것 하나를 정해요." }))) : null,
    el("button", { type: "button", class: "menu-row", onclick: () => { sh.close(); item.folded = !item.folded; toast(item.folded ? "접어 뒀어요" : "다시 펼쳤어요"); redraw(); } },
      el("span", {}, item.folded ? "다시 펼치기" : "접어 두기", el("small", { text: item.folded ? "쪽지를 다시 꺼내 놓아요." : "지우지 않고 잠시 넣어 둬요." }))),
    el("button", { type: "button", class: "menu-row danger", onclick: () => { sh.close(); del(); } }, el("span", {}, "지우기", el("small", { text: "되돌릴 수 없어요." })))] });
}
function renderNote(main, navigate) {
  if (choice.note !== "a") { renderNoteDraft(main, navigate); return; }
  const screen = el("div", { class: "screen settings-sub lb lb-note" });
  function draw() {
    const open = lb.standards.filter((s) => !s.folded), folded = lb.standards.filter((s) => s.folded);
    const slip = (s, cls = "") => el("li", {}, el("button", { type: "button", class: `lb-slip ${cls}`, "aria-haspopup": "dialog", onclick: () => standardSheet(s, navigate, draw) },
      el("span", { class: "lb-slip-text", text: s.text }),
      cls === "big" && s.from.length ? el("span", { class: "lb-slip-refs", "aria-hidden": "true" }, [...s.from].sort().map((iso) => { const c = catsOf(recordOf(iso))[0]; return el("span", { class: "lb-ref" }, c ? pebbleImg(c, { size: 22 }) : null, el("span", { text: monthDay(iso) })); })) : null,
      cls === "line" ? null : el("span", { class: "lb-slip-date", text: `${monthDay(s.at)}에 적음` })));
    const layout = open.length <= 2 ? "big" : open.length <= 6 ? "grid" : "sheet";
    const list = !open.length ? null : layout === "sheet"
      ? el("ul", { class: "lb-slips sheet" }, open.map((s) => slip(s, "line")))
      : el("ul", { class: `lb-slips ${layout}` }, open.map((s) => slip(s, layout === "big" ? "big" : "small")));
    const foldedList = el("ul", { class: "lb-slips sheet lb-folded", id: "lbFolded", hidden: true }, folded.map((s) => slip(s, "line")));
    const foldedBtn = folded.length ? el("button", { type: "button", class: "link lb-fold-toggle", "aria-expanded": "false", "aria-controls": "lbFolded", text: "접어 둔 문장 보기" }) : null;
    foldedBtn?.addEventListener("click", () => { const on = foldedList.hidden; foldedList.hidden = !on; foldedBtn.setAttribute("aria-expanded", String(on)); foldedBtn.textContent = on ? "접어 둔 문장 넣기" : "접어 둔 문장 보기"; });
    put(screen, head(navigate, "stats", "뒤로"), scene({ notes: open.length }),
      el("h1", { tabindex: "-1", text: "내 기준" }),
      el("p", { class: "lede", text: open.length ? "기록을 다시 읽다가 적어 둔 문장이에요." : "기록을 다시 읽다가 떠오르면 한 줄 남길 수 있어요." }),
      !lb.standards.length ? el("p", { class: "lb-empty-line", text: "아직 눌러 둔 쪽지가 없어요" }) : null,
      list, foldedBtn, folded.length ? foldedList : null,
      el("div", { class: "sd-actions" }, lb.standards.length ? null : el("button", { type: "button", class: "btn text big", text: "돌아보기로", onclick: () => navigate("lookback") }),
        el("button", { type: "button", class: "btn primary big", text: "한 줄 적기", onclick: () => navigate("lookback/write") })));
  }
  put(main, screen);
  draw();
}

// ══════════════════════ 3. 한 줄 적기·고치기 #/lookback/write(?id=) ══════════════════════
// 일기의 첫 단계('오늘 있었던 일')와 같은 종이·언덕 장면을 그대로 쓴다 — 줄 노트에 적고, 아래 언덕의 길 들머리에 나의 돌이 있다.
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
    navigate("lookback/note"); toast(editing ? "문장을 고쳤어요" : "적어 뒀어요");
  }
  const field = el("div", { class: "field" }, el("label", { for: "lbLine", class: "field-label", text: "나에게 중요한 것" }), input);
  put(main, el("div", { class: `screen write lb-write${qa.keyboard ? " lb-kb-on" : ""}` },
    el("div", { class: "write-top" }, el("button", { type: "button", class: "back", "aria-label": "내 기준으로", onclick: goBack(navigate, "lookback/note") }, backIcon())),
    el("h1", { tabindex: "-1", text: editing ? "문장 고치기" : "한 줄 적기" }),
    el("p", { class: "paper-guide", text: "어떤 때 어떤 마음이 드는지, 나에게 무엇이 필요한지 적어 볼 수 있어요. 정답은 없고, 나중에 고쳐도 돼요." }),
    refs.length ? el("div", { class: "lb-write-refs" }, el("p", { class: "st-block-label", text: "함께 보는 기록" }), refRow(refs)) : null,
    hint, renderEventScene({ eventField: field, story: "다시 읽고 남기는 한 줄이에요" })),
    el("div", { class: "step-footer solo" }, save),
    qa.keyboard ? el("div", { class: "lb-kb", "aria-hidden": "true", text: "자판이 올라온 자리(시안)" }) : null);
  sync();
}

// ══════════════════════ 4. 해 보는 길 #/lookback/try ══════════════════════
// '어떤 때 · 이렇게'의 두 칸으로 적는다 — 언제 할지를 함께 정해 둔 계획이 막연한 다짐보다 실행으로 이어지기 쉽다는 연구의 틀을 빌렸다(효과를 약속하지 않는다, ROUND2.md).
// 걸어 본 날은 사용자가 누를 때만 남는다. 누르지 않은 날은 빈칸일 뿐 실패가 아니고, 며칠째·몇 %를 세지 않는다.
export const rangeText = (x) => `${monthDay(x.start)}부터 ${monthDay(pathEnd(x))}까지 · ${x.days}일`;
export function trail(x) { // 기간의 날들: 걸어 본 날은 민트 돌, 오늘은 고리, 아직 오지 않은 날은 옅은 점
  const t = todayIso();
  return el("ol", { class: "lb-trail", "aria-label": "이 길의 날들" }, pathDays(x).map((iso) => el("li", { class: `${x.walked.has(iso) ? "on" : ""}${iso === t ? " today" : ""}${iso > t ? " later" : ""}` },
    dayCell({ tag: "span", mini: true, status: x.walked.has(iso) ? "completed" : "none", today: iso === t, "aria-hidden": "true" }), el("span", { text: iso === t ? "오늘" : weekday(iso) }), el("span", { class: "sr", text: `${monthDay(iso)} ${x.walked.has(iso) ? "해 본 날" : iso > t ? "아직 오지 않은 날" : "남긴 표시 없음"}` }))));
}
export const periodRecords = (x, emptyText) => { const days = recordedBetween(x.start, pathEnd(x) < todayIso() ? pathEnd(x) : todayIso());
  return el("section", { class: "sx-sec" }, el("h2", { text: "이 기간에 남긴 기록" }),
    days.length ? el("div", { class: "lb-roll" }, days.map((iso) => recordCard(iso))) : el("p", { class: "note", text: emptyText })); };
export const pathTitle = (x) => el("h1", { class: "lb-try-title", tabindex: "-1" }, el("small", { text: x.when }), " ", el("span", { text: x.what }));

function renderPick(main, navigate, params) {
  if (choice.path === "b") { renderPickPoster(main, navigate, params); return; }
  const std = lb.standards.find((s) => s.id === Number(params?.get("from")));
  let days = 7;
  const sc = scene({ sign: {} });
  const hint = el("p", { class: "blocked-hint au-hint", id: "lbTryHint", hidden: true, role: "status" });
  const start = el("button", { type: "button", class: "btn primary big", text: "시작하기", "aria-describedby": "lbTryHint", onclick: submit });
  const sync = () => { sc.setSign(when.input.value, what.input.value); const bad = !clean(what.input.value); start.setAttribute("aria-disabled", String(bad)); if (!bad) hint.hidden = true; };
  const when = lineField({ id: "lbWhen", label: "어떤 때", placeholder: "예: 서운한 마음이 들 때", help: "비워 둬도 돼요.", max: 30, onInput: () => sync() });
  const what = lineField({ id: "lbWhat", label: "이렇게 해 보기", placeholder: "예: 하루 뒤에 말하기", help: "작고 구체적일수록 해 보기 쉬워요.", max: 30, onInput: () => sync() });
  function submit() {
    if (!clean(what.input.value)) { hint.textContent = "해 보고 싶은 것을 적어 주세요."; hint.hidden = false; what.input.focus(); return; }
    lb.path = { when: clean(when.input.value), what: clean(what.input.value), days, start: todayIso(), walked: new Set() };
    navigate("lookback/try"); toast("오늘부터 시작해요");
  }
  put(main, el("div", { class: "screen settings-sub lb lb-try tb-rise" }, head(navigate, "stats", "뒤로"), sc,
    el("h1", { tabindex: "-1", text: "해 보는 길" }),
    el("p", { class: "lede", text: "해 보고 싶은 것 하나를 정해 며칠 해 봐요. 어땠는지는 해 본 내가 정해요." }),
    std ? el("p", { class: "lb-quote lb-from", text: std.text }) : null,
    when.node, what.node,
    el("div", { class: "lb-fill" }, el("p", { class: "st-block-label", text: "예시로 채워 보기" }),
      el("div", { class: "st-pills" }, EXAMPLES.map(([w, h]) => el("button", { type: "button", class: "st-pill lb-fill-pill", text: h, "aria-label": `예시: ${w}, ${h}`, onclick: () => { when.set(w); what.set(h); announce("예시로 채웠어요. 내 말로 바꿔도 돼요."); } }))),
      el("p", { class: "caption", text: "예시일 뿐이에요. 내 말로 바꿔 적어도 돼요." })),
    el("div", { class: "st-block" }, el("p", { class: "st-block-label", text: "며칠 동안 해 볼까요?" }),
      radios("st-pills", "st-pill", "기간", DAY_CHOICES.map((d) => [d, `${d}일`]), days, (d) => { days = d; })),
    lb.past.length ? el("section", { class: "sx-sec" }, el("h2", { text: "해 본 것" }), el("ul", { class: "lb-past" }, lb.past.map((p) => el("li", {},
      el("p", { class: "lb-past-text", text: [p.when, p.what].filter(Boolean).join(" · ") }), el("p", { class: "caption", text: `${rangeText(p)}${p.note ? ` · ${p.note}` : ""}` }))))) : null,
    el("div", { class: "sd-actions" }, hint, start)));
  sync();
}
function renderActive(main, navigate) {
  const x = lb.path, t = todayIso();
  let alarm = true;
  const screen = el("div", { class: "screen settings-sub lb lb-try tb-rise" });
  function draw(focusSel) {
    const walked = x.walked.has(t);
    put(screen, head(navigate, "stats", "뒤로"), scene({ sign: x, tagged: false }),
      el("p", { class: "sx-eyebrow lb-center", text: "해 보는 중" }), pathTitle(x),
      el("p", { class: "sxd-sub lb-center", text: rangeText(x) }),
      el("div", { class: "lb-walk" }, trail(x),
        el("button", { type: "button", class: "choice lb-walk-btn", "aria-pressed": String(walked), onclick: () => { if (walked) x.walked.delete(t); else x.walked.add(t); announce(walked ? "오늘 표시를 지웠어요" : "오늘 해 본 날로 남겼어요"); draw(".lb-walk-btn"); } },
          el("span", { class: "ck", "aria-hidden": "true", text: "✓" }), el("span", { text: "오늘 해 봤어요" })),
        el("p", { class: "caption", text: "누른 날만 채워져요. 누르지 않은 날은 빈칸으로 남을 뿐이에요." })),
      el("div", { class: "st-rows lb-try-rows" }, el("div", { class: "st-row st-switch-row" },
        el("span", { class: "st-ic-frame" }, ICONS.bell()), el("span", { class: "st-row-name", text: "끝나는 날 알려 주기" }),
        el("button", { type: "button", class: "switch", role: "switch", "aria-checked": String(alarm), "aria-label": "끝나는 날 알려 주기", onclick: () => { alarm = !alarm; draw(".switch"); } }, el("i", { "aria-hidden": "true" })))),
      el("p", { class: "caption lb-try-note", text: `${monthDay(pathEnd(x))}에 한 번만 알려요. 그 전에는 알리지 않아요.` }),
      periodRecords(x, "아직 남긴 기록이 없어요. 기록은 평소처럼 오늘 화면에서 남겨요."),
      el("button", { type: "button", class: "st-delete-row lb-stop", onclick: () => openSheet({ title: "여기서 멈출까요?", body: [el("p", { text: "멈춰도 그동안 남긴 기록은 그대로 있어요." })],
        primary: { text: "멈추기", onclick: () => { lb.path = null; navigate("lookback/try"); toast("멈췄어요"); } }, secondary: { text: "그만두기" } }) }, el("span", { text: "여기서 멈추기" }), chev()));
    if (focusSel) screen.querySelector(focusSel)?.focus();
  }
  put(main, screen); draw();
}
function renderEnded(main, navigate) {
  const x = lb.path;
  const field = lineField({ id: "lbAfter", label: "한 줄로 적어 두기", placeholder: "예: 하루 지나니 할 말이 달라져 있었다", help: "좋았는지 아닌지는 내가 정해요. 비워 둬도 괜찮아요.", max: 80 });
  const finish = (again) => () => {
    lb.past.unshift({ ...x, note: clean(field.input.value) });
    lb.path = again ? { ...x, start: todayIso(), walked: new Set() } : null;
    navigate("lookback/try"); toast(again ? "오늘부터 한 번 더 해 봐요" : "마쳤어요");
  };
  put(main, el("div", { class: "screen settings-sub lb lb-try tb-rise" }, head(navigate, "stats", "뒤로"), scene({ sign: x, tagged: false }),
    el("p", { class: "sx-eyebrow lb-center", text: "정한 기간이 끝났어요" }), pathTitle(x),
    el("p", { class: "sxd-sub lb-center", text: rangeText(x) }),
    el("div", { class: "lb-walk" }, trail(x)),
    periodRecords(x, "이 기간에 남긴 기록은 없어요."),
    el("div", { class: "st-block lb-after" }, el("p", { class: "sx-headline", text: "해 보니 어땠나요?" }), field.node),
    el("div", { class: "sd-actions" }, el("button", { type: "button", class: "btn primary big", text: "마치기", onclick: finish(false) }),
      el("button", { type: "button", class: "btn text big", text: "한 번 더 해 보기", onclick: finish(true) }))));
}

export function renderLookback(main, navigate, params, rest = []) {
  rowSeq = 0;
  const page = rest[0];
  if (page === "note") renderNote(main, navigate);
  else if (page === "write") renderWrite(main, navigate, params);
  else if (page === "try") ({ none: renderPick, active: renderActive, ended: renderEnded })[pathState()](main, navigate, params);
  else renderReader(main, navigate, params);
  main.querySelector("h1")?.focus({ preventScroll: true });
}

// ══════════════════════ 다른 화면에 붙는 조각 ══════════════════════

// 완료 화면 제목 아래의 한 줄 자리. 둘 중 하나만, 또는 아무것도 나오지 않는다.
// ① 걸어 보는 길이 있으면: 오늘 그 길로 걸어 봤는지 한 번 묻는다(기록을 남긴 날에만, 한 번 누르면 사라진다).
// ② 없으면 전하기 한 줄: 가끔만 나온다 — 나오는 날과 문장은 store.js tellReason(사용자가 고르고 적은 것만 본다). 입력·저장·버튼이 없다.
const TELL = { thanks: "오늘 적은 고마움 중에 전하고 싶은 것이 있나요?", joy: "이 기쁨을 함께 나누고 싶은 사람이 있나요?", big: "이 이야기를 들어 주었으면 하는 사람이 있나요?" };
export function tellLine(screen, entry) {
  const headNode = screen.querySelector(".done-head");
  if (!headNode) return;
  const x = lb.path, t = todayIso();
  if (pathState() === "active" && !qa.tell && !x.walked.has(t)) {
    const row = el("div", { class: "lb-done-ask" }, el("p", { class: "note", text: `오늘 '${x.what}'를 해 봤나요?` }));
    const answer = (yes) => () => { if (yes) x.walked.add(t); row.remove(); announce(yes ? "해 본 날로 남겼어요" : "남기지 않았어요"); };
    row.append(el("div", { class: "lb-done-ask-btns" }, el("button", { type: "button", class: "st-pill", text: "해 봤어요", onclick: answer(true) }), el("button", { type: "button", class: "st-pill", text: "오늘은 아니에요", onclick: answer(false) })));
    headNode.append(row);
    return;
  }
  const why = tellReason(entry);
  if (why) headNode.append(el("p", { class: "note lb-tell", text: TELL[why] }));
}

// 오늘 화면의 팻말: 걸어 보는 길이 있을 때 숲길 가에 선다. 글자로 재촉하지 않는다 — 등불 하나가 팻말을 비추고, 정한 날이 지나면 등불이 밝아진다.
export function todayMark(box) {
  const st = pathState();
  if (st === "none") return;
  const label = st === "ended" ? `해 보는 길의 기간이 끝났어요: ${lb.path.what}` : `해 보는 중: ${lb.path.what}`;
  const extra = choice.sign === "a" ? [el("i", { class: "lb-forest-halo", "aria-hidden": "true" }), signPost("lb-forest-sign-svg"), el("i", { class: "lb-forest-light", "aria-hidden": "true" })]
    : choice.sign === "b" ? [signPost("lb-forest-sign-svg"), ...[0, 1, 2, 3, 4].map((k) => el("i", { class: `lb-fly f${k}`, "aria-hidden": "true" }))] : [signPost("lb-forest-sign-svg")];
  box.append(el("a", { class: `lb-forest-sign sign-${choice.sign}${st === "ended" ? " is-ended" : ""}`, href: "#/lookback/try", "aria-label": label }, extra));
  // c안: 돌 아래 안내 줄(쓰던 글 안내와 같은 자리·같은 모양). 쓰던 글 안내가 있으면 그쪽이 먼저다
  if (choice.sign === "c" && !box.querySelector(".yline")) box.append(el("p", { class: "yline lb-yline" }, el("a", { href: "#/lookback/try" }, st === "ended" ? `'${lb.path.what}' 기간이 끝났어요` : `'${lb.path.what}' 해 보는 중`, chev(""))));
}

// 달력의 입구: 날짜를 고르지 않았을 때의 빈 자리에 알약 하나.
export const calendarEntry = () => el("a", { class: "st-pill-link lb-cal-entry", href: "#/lookback" }, el("span", { class: "st-pill-link-face" }, "지난 기록 이어서 읽기", chev()));

// 통계 맨 아래의 줄: 돌아보기·내 기준·해 보는 길로 가는 입구.
export function statsRows(navigate) {
  rowSeq = 0;
  const st = pathState();
  return el("section", { class: "sx-sec lb-stats-rows" }, el("h2", { class: "sx-eyebrow", text: "기록에서 이어지는 것" }),
    el("div", { class: "st-rows" }, linkRow(ICONS.read, "돌아보기", () => navigate("lookback")), linkRow(ICONS.note, "내 기준", () => navigate("lookback/note")),
      linkRow(ICONS.sign, "해 보는 길", () => navigate("lookback/try"), st === "active" ? "해 보는 중" : st === "ended" ? "기간이 끝났어요" : null)));
}
export const statsDetailReader = () => null; // 1판의 2C안(통계 친구 상세에서 이어 읽기)은 고르지 않았다 — stats.js의 자리만 남긴다
