// 돌아보기 · 내 기준 · 작은 실험 · 전하기 한 줄(TASK-LOOKBACK-01 단계 A 시안). 무엇을 왜 만드는지는 tasks/lookback/2026-11-12/CONCEPT.md.
// 화면: #/lookback(이어 읽기) · #/lookback/note(내 기준) · #/lookback/write(기준 적기) · #/lookback/try(작은 실험).
// 다른 화면에 붙는 조각(완료 화면의 한 줄, 오늘 화면의 표식, 달력·통계의 입구)도 이 파일이 만들어 그 화면이 불러 쓴다.
// 앱은 기준을 제안하거나 고쳐 주지 않고, 실험을 판정하지 않는다 — 문장은 묻거나 있는 것을 말할 뿐이다(서비스 WHY §12·§20).
import { el, svgEl, announce, toast, reducedMotion } from "../dom.js";
import { category, pebbleImg, stoneImg, friendImg, FRIENDS } from "../data.js";
import { openSheet } from "../components/sheet.js";
import { choice, qa, lb, recordOf, recordedDays, recordedBetween, todayIso, shiftDay, monthDay, monthDayWeek, toggleMark, saveStandard, removeStandard,
  experimentState, experimentEnd, EXAMPLES, DAY_CHOICES } from "../lookback/store.js";

// ── 아이콘(기존 화면과 같은 선: 24 viewBox, 둥근 끝) ──
const path = (d, cls) => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: cls }, svgEl("path", { d }));
const backIcon = () => path("M14.5 5.5 8 12l6.5 6.5");
const chev = (cls = "st-chev") => path("M9.5 5.5 16 12l-6.5 6.5", cls);
const dots = () => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "dots3" }, [5, 12, 19].map((cx) => svgEl("circle", { cx, cy: "12", r: "1.7" })));
const ic = (...d) => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "st-ic" }, d.map((p) => svgEl("path", { d: p })));
const ICONS = {
  read: () => ic("M5 6.2c2.6-.9 4.9-.5 7 1.2 2.1-1.7 4.4-2.1 7-1.2v11.6c-2.6-.9-4.9-.5-7 1.2-2.1-1.7-4.4-2.1-7-1.2z", "M12 7.4V19"), // 펼친 책 — 이어 읽기
  note: () => ic("M7 3.8h6.6L18 8.2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5.8a2 2 0 0 1 2-2z", "M13.4 3.8v4.4H18", "M8.6 12.4h6.8", "M8.6 15.8h4.4"), // 설정의 '기록' 아이콘과 같은 종이
  sign: () => ic("M12 20.4V4", "M12 5.6h5.2l2.2 2.4-2.2 2.4H12", "M12 12.4H7.4L5.4 14.6l2 2.2H12") // 팻말 — 작은 실험
};
const signPost = (cls) => svgEl("svg", { viewBox: "0 0 24 30", "aria-hidden": "true", class: cls },
  svgEl("path", { class: "lb-sign-post", d: "M10.8 9h2.4v20.2h-2.4z" }), svgEl("path", { class: "lb-sign-board", d: "M4 2.6h12.6l4.4 4.6-4.4 4.6H4z" }));

let navCount = 0; // 이 문서 안에서 화면을 몇 번 그렸는지 — 처음 연 화면의 ‹는 돌아갈 곳이 없어 정해 둔 화면으로 간다
export const countRender = () => { navCount += 1; };
const goBack = (navigate, fallback) => () => { if (navCount > 1 && history.length > 1) history.back(); else navigate(fallback); };
const head = (navigate, fallback, label, more) => el("div", { class: "info-top" },
  el("button", { type: "button", class: "back", "aria-label": label, onclick: goBack(navigate, fallback) }, backIcon()), more ?? null);
const chipVars = (cat) => ({ "--chip-fill": `var(--${cat}-chip-fill)`, "--chip-border": `var(--${cat}-chip-border)`, "--chip-text": `var(--${cat}-chip-text)`, "--dot": `var(--${cat}-accent)` });
const catsOf = (rec) => rec.cats.filter((c) => rec.emotions.some((e) => e.cat === c));
const iGa = (w) => ((w.charCodeAt(w.length - 1) - 0xac00) % 28 ? "이" : "가"); // 받침에 따라 이/가
const put = (node, ...kids) => node.replaceChildren(...kids.flat().filter((k) => k != null && k !== false)); // 빈 자리(null)를 글자로 찍지 않는다
const clean = (v) => v.replace(/\s+/g, " ").trim();

// 고르기 알약 한 벌(radiogroup): 고른 것만 Tab 순서에 들고 ← →로 옮긴다(설정·통계의 고르기와 같은 관행).
function radios(cls, itemCls, label, items, current, onPick) {
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
  if (!buttons.some((b) => b.getAttribute("aria-checked") === "true")) buttons[0]?.setAttribute("tabindex", "0");
  return el("div", { class: cls, role: "radiogroup", "aria-label": label }, buttons);
}

// 한 줄 글 칸(옅은 회색 면, 가입의 이름 칸과 같은 결). 줄이 넘치면 아래로 자란다.
function lineField({ id, label, placeholder, help, max = 60, value = "", onInput }) {
  const input = el("textarea", { id, class: "au-input lb-input", rows: 1, placeholder, enterkeyhint: "done", "aria-describedby": `${id}Help` });
  input.value = value;
  const count = el("span", { class: "au-count", "aria-hidden": "true" });
  const grow = () => { input.style.height = "auto"; input.style.height = `${input.scrollHeight}px`; };
  const update = () => { count.textContent = `${[...input.value].length}/${max}`; grow(); onInput?.(input.value); };
  input.addEventListener("input", () => { const cps = [...input.value.replace(/\n/g, " ")]; input.value = cps.slice(0, max).join(""); update(); });
  const node = el("div", { class: "field lb-field" }, el("label", { for: id, class: "field-label", text: label }), input,
    el("div", { class: "au-help-row" }, el("p", { id: `${id}Help`, class: "au-help", text: help }), count));
  requestAnimationFrame(update);
  return { node, input };
}

// ── 머리 장면: 먼 언덕과 흰 길, 길 끝에 나의 돌. 길 위에는 그 기간에 머문 마음의 조약돌이 놓여 있다(통계 친구 상세의 언덕과 같은 그림법) ──
const SPOTS = [[170, 112, 24], [146, 124, 22], [120, 132, 26], [188, 101, 18], [96, 138, 20]]; // 길 위 자리(뷰박스 340×150 기준 x, y, 크기)
function scene({ cats = [], sign = false } = {}) {
  const svg = svgEl("svg", { viewBox: "0 0 340 150", preserveAspectRatio: "none", class: "sxd-scene-svg", "aria-hidden": "true", focusable: "false" },
    svgEl("path", { class: "sxd-scene-hill-far", d: "M0,52 C57,32 113,27 170,36 C227,45 283,36 340,24 L340,150 L0,150 Z" }),
    svgEl("path", { class: "sxd-scene-hill-mid", d: "M0,80 C57,60 113,53 170,62 C227,71 283,60 340,47 L340,150 L0,150 Z" }),
    svgEl("path", { class: "sxd-scene-road", d: "M54,150 C92,132 176,128 196,92 L208,94 C204,128 150,138 132,150 Z" }));
  const stone = stoneImg("rest"); stone.classList.add("lb-scene-stone");
  return el("div", { class: "sxd-scene lb-scene", "aria-hidden": "true" }, svg,
    cats.slice(0, SPOTS.length).map((cat, i) => { const [x, y, s] = SPOTS[i]; const p = pebbleImg(cat, { size: s }); p.classList.add("lb-scene-peb");
      p.style.left = `${(x / 340 * 100).toFixed(1)}%`; p.style.bottom = `${150 - y - s / 2}px`; p.style.width = `${s}px`; return p; }),
    sign ? signPost("lb-scene-sign") : null, stone);
}

// ── 그날의 쪽지: 통계 친구 상세의 작은 편지(.sxd-peek)와 같은 종이. 표시하면 민트 테이프가 붙는다 — 민트는 '지금 고른 것'의 색이다(D-088) ──
function recordCard(iso, { markable = true, onMark } = {}) {
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
    onMark?.(iso, on);
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
function refChip(iso) {
  const cats = catsOf(recordOf(iso));
  return el("a", { class: "lb-ref", href: `#/record/${iso}?from=lookback`, "aria-label": `${monthDay(iso)} 편지 열기` },
    cats[0] ? pebbleImg(cats[0], { size: 22 }) : null, el("span", { text: monthDay(iso) }));
}
const refRow = (isos) => el("div", { class: "lb-refs" }, [...isos].sort().map(refChip));

// 표시하자마자 한 줄을 받는 시트(갈림길 3의 A안). 비워 두고 닫으면 표시만 남는다.
function quickStandardSheet(iso) {
  const rec = recordOf(iso);
  const field = lineField({ id: "lbQuick", label: "내 기준 한 줄", placeholder: "예: 약속이 깨질 때 크게 흔들린다", help: "떠오르지 않으면 비워 둬도 괜찮아요." });
  openSheet({ title: "이 기록에서 나에게 중요한 것이 있나요?",
    body: [el("p", { class: "lb-quote", text: rec.event }), field.node],
    primary: { text: "적어 두기", onclick: () => { const text = clean(field.input.value); if (text) { saveStandard({ text, from: [iso] }); toast("내 기준에 적어 뒀어요"); } } },
    secondary: { text: "표시만 해 둘게요" } });
}

// 다 읽은 자리의 물음. 기준을 권하지 않는다 — 없어도 된다고 먼저 말하고, 적을지는 사용자가 정한다.
function endBlock(navigate, { few = false, scope = "" } = {}) {
  const marks = [...lb.marks];
  const rows = el("div", { class: "st-rows lb-rows" },
    linkRow(ICONS.note, "내 기준", () => navigate("lookback/note"), 0), linkRow(ICONS.sign, "작은 실험", () => navigate("lookback/try"), 1));
  if (few) return el("section", { class: "lb-end" },
    el("p", { class: "sx-eyebrow", text: "여기까지예요" }),
    el("p", { class: "note", text: "기록이 더 쌓이면 여러 날을 이어서 읽을 수 있어요." }), rows);
  const write = () => navigate("lookback/write");
  const byMark = {
    a: [el("p", { class: "note", text: "없어도 괜찮아요. 표시를 누르면 그 자리에서 한 줄 적어 둘 수 있어요." }),
      el("div", { class: "stack" }, el("button", { type: "button", class: "btn secondary big", text: "내 기준 보기", onclick: () => navigate("lookback/note") }))],
    b: [el("p", { class: "note", text: "없어도 괜찮아요. 떠오르는 게 있으면 한 줄로 적어 둘 수 있어요." }),
      marks.length ? el("div", { class: "lb-marked" }, el("p", { class: "st-block-label", text: "표시한 기록" }), refRow(marks)) : null,
      el("div", { class: "stack" }, el("button", { type: "button", class: "btn primary big", text: "내 기준 적기", onclick: write }))],
    c: [el("p", { class: "note", text: "없어도 괜찮아요. 표시한 기록은 내 기준에 모아 뒀어요. 적는 것은 거기에서 천천히 해도 돼요." }),
      el("div", { class: "stack" }, el("button", { type: "button", class: "btn secondary big", text: "내 기준으로 가기", onclick: () => navigate("lookback/note") }))]
  }[choice.mark];
  return el("section", { class: "lb-end" },
    el("p", { class: "sx-eyebrow", text: "여기까지 읽었어요" }),
    el("p", { class: "sx-headline", text: `${scope}반복된 것 중 나에게 중요한 것이 있나요?` }), byMark, rows);
}
let rowSeq = 0;
function linkRow(icon, name, onclick, seq = rowSeq++, value = null) {
  return el("button", { type: "button", class: "st-row", "aria-label": value ? `${name}, ${value}` : name, onclick },
    el("span", { class: "st-ic-frame", style: { "--fx": seq % 3 === 2 ? -1 : 1, "--fy": seq % 4 === 2 ? -1 : 1 } }, icon()), el("span", { class: "st-row-name", text: name }),
    el("span", { class: "st-row-trail" }, value ? el("span", { class: "st-row-value", "aria-hidden": "true", text: value }) : null, chev()));
}
const onMarkFor = () => (choice.mark === "a" ? (iso, on) => { if (on) quickStandardSheet(iso); } : undefined);

// ══════════════════════ 1. 이어 읽기 #/lookback (갈림길 2의 A·B안) ══════════════════════
function renderReader(main, navigate, params) {
  if (choice.place === "c") { navigate("stats"); return; } // C안에는 이 화면이 없다 — 통계 친구 상세 안에서 읽는다
  let period = Number(params.get("p")) === 30 ? 30 : 7;
  const body = el("div", { class: "lb-body" });
  const sceneSlot = el("div", {});
  function draw() {
    const days = recordedDays(period), from = shiftDay(todayIso(), -(period - 1));
    const cats = [...new Set(days.flatMap((iso) => catsOf(recordOf(iso))))];
    sceneSlot.replaceChildren(scene({ cats }));
    history.replaceState(null, "", `#/lookback?p=${period}`);
    if (!days.length) {
      const wider = period === 7 && recordedDays(30).length > 0;
      body.replaceChildren(el("div", { class: "sx-empty" },
        el("p", { class: "sx-headline", text: wider ? "최근 7일에는 남긴 기록이 없어요" : "아직 다시 읽을 기록이 없어요" }),
        el("p", { class: "caption", text: wider ? "최근 30일로 넓혀 볼 수 있어요." : "오늘 화면에서 마음을 남기면 여기에서 이어서 읽을 수 있어요." }),
        wider ? null : el("div", { class: "stack" }, el("button", { type: "button", class: "btn secondary", text: "오늘 화면으로", onclick: () => navigate("today") }))));
      return;
    }
    const count = el("p", { class: "caption lb-count", text: `${monthDay(from)}부터 오늘까지 · 기록 ${days.length}편` });
    const few = days.length < 3;
    let list;
    if (choice.place === "b") { // 마음별: 그 기간에 머문 마음마다 묶는다. 한 기록은 그날 가장 크게 머문 마음 아래에 한 번만 나온다
      const groups = new Map();
      for (const iso of days) { const rec = recordOf(iso); const main0 = catsOf(rec).reduce((a, c) => ((rec.repr[c] ?? 0) > (rec.repr[a] ?? 0) ? c : a)); groups.set(main0, [...(groups.get(main0) ?? []), iso]); }
      const ranked = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
      list = el("div", { class: "lb-groups" }, ranked.map(([cat, isos]) => {
        const rest = isos.slice(2).map((iso) => recordCard(iso, { onMark: onMarkFor() }));
        const more = rest.length ? el("button", { type: "button", class: "link lb-more-link", "aria-expanded": "false", text: `${rest.length}편 더 읽기` }) : null;
        const extra = el("div", { class: "lb-roll", hidden: true }, rest);
        more?.addEventListener("click", () => { extra.hidden = false; more.remove(); extra.querySelector("a,button")?.focus(); });
        return el("section", { class: "lb-group" },
          el("div", { class: "cat-mark lb-group-head" }, el("span", { class: "friend-spot" }, friendImg(cat, { size: 56, label: false })),
            el("h2", { class: "cat-mark-name" }, el("strong", { text: `${category(cat).label}${iGa(category(cat).label)} 크게 머문 날` }), el("span", { text: `${FRIENDS[cat].name} · ${isos.length}편` }))),
          el("div", { class: "lb-roll" }, isos.slice(0, 2).map((iso) => recordCard(iso, { onMark: onMarkFor() }))), more, extra);
      }));
    } else list = el("div", { class: "lb-roll" }, days.map((iso) => recordCard(iso, { onMark: onMarkFor() })));
    body.replaceChildren(count, list, endBlock(navigate, { few }));
  }
  const seg = radios("segmented", "", "기간", [[7, "최근 7일"], [30, "최근 30일"]], period, (p) => { period = p; draw(); announce(`최근 ${p}일의 기록`); });
  draw();
  main.replaceChildren(el("div", { class: "screen lb lb-reader" },
    head(navigate, choice.place === "b" ? "stats" : "calendar", choice.place === "b" ? "통계로" : "달력으로"), sceneSlot,
    el("h1", { tabindex: "-1", text: "돌아보기" }),
    el("p", { class: "lede", text: choice.place === "b" ? "지난 기록을 마음별로 묶어 다시 읽어요." : "지난 기록을 날짜순으로 이어서 다시 읽어요." }),
    el("p", { class: "proto-note" }, el("span", { class: "proto-tag", text: "시안" }), " 아래 기록은 모두 지어낸 예시입니다."),
    seg, body));
}

// ══════════════════════ 2. 내 기준 #/lookback/note (갈림길 4) ══════════════════════
function standardMenu(item, navigate, redraw) {
  const del = () => openSheet({ title: "이 기준을 지울까요?", danger: true,
    body: [el("p", { class: "lb-quote", text: item.text }), el("p", { text: "지우면 되돌릴 수 없어요. 표시한 기록은 그대로 있어요." })],
    primary: { text: "지우기", onclick: () => { removeStandard(item.id); toast("기준을 지웠어요"); redraw(); } }, secondary: { text: "그만두기" } });
  const sh = openSheet({ title: "내 기준", secondary: { text: "닫기" }, body: [
    el("p", { class: "lb-quote", text: item.text }),
    el("button", { type: "button", class: "menu-row", onclick: () => { sh.close(); navigate(`lookback/write?id=${item.id}`); } }, el("span", {}, "고치기", el("small", { text: "문장을 고쳐요." }))),
    el("button", { type: "button", class: "menu-row", onclick: () => { sh.close(); item.folded = !item.folded; toast(item.folded ? "접어 뒀어요" : "다시 펼쳤어요"); redraw(); } },
      el("span", {}, item.folded ? "다시 펼치기" : "접어 두기", el("small", { text: item.folded ? "목록에 다시 보여요." : "목록에서 접어 둬요. 지워지지 않아요." }))),
    el("button", { type: "button", class: "menu-row danger", onclick: () => { sh.close(); del(); } }, el("span", {}, "지우기", el("small", { text: "이 기준을 지워요. 되돌릴 수 없어요." })))] });
}
function standardItem(item, navigate, redraw) {
  const more = el("button", { type: "button", class: "back lb-more", "aria-label": `${item.text} 더보기`, "aria-haspopup": "dialog", onclick: () => standardMenu(item, navigate, redraw) }, dots());
  const refs = item.from.length ? refRow(item.from) : null;
  if (choice.note === "c") return el("li", { class: "sxd-peek lb-paper" }, el("i", { class: "sxd-peek-tape", "aria-hidden": "true" }),
    el("p", { class: "lb-paper-text", text: item.text }), refs,
    el("div", { class: "sxd-peek-sign" }, el("span", { class: "sxd-peek-sig", text: "— 내가 적은 기준" }), more));
  if (choice.note === "b") return el("li", { class: "lb-bundle" }, el("div", { class: "lb-bundle-top" }, el("p", { class: "lb-bundle-text", text: item.text }), more),
    refs ?? el("p", { class: "caption", text: "기록을 붙이지 않고 적었어요" }));
  return el("li", { class: "lb-row" }, el("p", { class: "lb-row-text", text: item.text }), more);
}
function renderNote(main, navigate) {
  const screen = el("div", { class: "screen settings-sub lb lb-note" });
  function draw() {
    const open = lb.standards.filter((s) => !s.folded), folded = lb.standards.filter((s) => s.folded);
    const listCls = `lb-list lb-list-${choice.note}`;
    const foldedList = el("ul", { class: `${listCls} lb-folded`, id: "lbFolded", hidden: true }, folded.map((s) => standardItem(s, navigate, draw)));
    const foldedBtn = folded.length ? el("button", { type: "button", class: "link lb-fold-toggle", "aria-expanded": "false", "aria-controls": "lbFolded", text: `접어 둔 기준 ${folded.length}` }) : null;
    foldedBtn?.addEventListener("click", () => { const on = foldedList.hidden; foldedList.hidden = !on; foldedBtn.setAttribute("aria-expanded", String(on)); });
    // C안(갈림길 3): 표시한 기록이 여기에 모여 기다린다 — 적는 일은 이 화면에서 시작한다.
    const tray = choice.mark === "c" && lb.marks.size ? el("div", { class: "lb-tray" }, el("p", { class: "st-block-label", text: "표시해 둔 기록" }), refRow([...lb.marks]),
      el("p", { class: "caption", text: "기준을 적을 때 불러와 함께 볼 수 있어요." })) : null;
    const empty = !lb.standards.length ? el("div", { class: "sx-empty" },
      el("div", { class: "sx-empty-friend" }, Object.assign(stoneImg("rest"), { className: "stone-img rest lb-empty-stone" })),
      el("p", { class: "sx-headline", text: "아직 적은 기준이 없어요" }),
      el("p", { class: "caption", text: "기록을 다시 읽다가 떠오르는 게 있으면 한 줄 적어 둘 수 있어요. 없어도 괜찮아요." })) : null;
    put(screen, head(navigate, "stats", "뒤로"),
      el("h1", { tabindex: "-1", text: "내 기준" }),
      el("p", { class: "lede", text: "기록을 다시 읽으며 내가 적은 문장이에요. 맞지 않게 되면 고치거나 지워도 돼요." }),
      tray, empty, open.length ? el("ul", { class: listCls }, open.map((s) => standardItem(s, navigate, draw))) : null,
      foldedBtn, folded.length ? foldedList : null,
      el("div", { class: "sd-actions" }, lb.standards.length ? null : el("button", { type: "button", class: "btn text big", text: "돌아보기로", onclick: () => navigate(choice.place === "c" ? "stats" : "lookback") }),
        el("button", { type: "button", class: "btn primary big", text: "기준 적기", onclick: () => navigate("lookback/write") })));
  }
  main.replaceChildren(screen);
  draw();
}

// ══════════════════════ 3. 기준 적기·고치기 #/lookback/write(?id=·?d=) ══════════════════════
function renderWrite(main, navigate, params) {
  const editing = lb.standards.find((s) => s.id === Number(params.get("id")));
  const one = params.get("d");
  let refs = editing ? [...editing.from] : one ? [one] : choice.mark === "b" ? [...lb.marks] : [];
  const refSlot = el("div", { class: "lb-write-refs" });
  const hint = el("p", { class: "blocked-hint au-hint", id: "lbWriteHint", hidden: true, role: "status" });
  const save = el("button", { type: "button", class: "btn primary big", text: editing ? "저장" : "적어 두기", "aria-describedby": "lbWriteHint", onclick: submit });
  const field = lineField({ id: "lbLine", label: "내 기준 한 줄", value: editing?.text ?? "", placeholder: "예: 약속이 깨질 때 크게 흔들린다",
    help: "어떤 때 어떤 마음이 드는지, 나에게 무엇이 필요한지처럼 적어 볼 수 있어요. 정답은 없어요.", onInput: sync });
  function sync() { const bad = !clean(field.input.value); save.setAttribute("aria-disabled", String(bad)); if (!bad) hint.hidden = true; }
  function submit() {
    const text = clean(field.input.value);
    if (!text) { hint.textContent = "한 줄을 적어 주세요."; hint.hidden = false; field.input.focus(); return; }
    saveStandard({ id: editing?.id, text, from: refs });
    navigate("lookback/note"); toast(editing ? "기준을 고쳤어요" : "내 기준에 적어 뒀어요");
  }
  // 표시한 기록 불러오기(갈림길 3의 C안, 그리고 고칠 때): 표시해 둔 기록 가운데 함께 볼 것을 고른다.
  function loadSheet() {
    const picked = new Set(refs);
    const rows = [...lb.marks].sort().map((iso) => { const b = el("button", { type: "button", class: "choice lb-pick", "aria-pressed": String(picked.has(iso)) },
      el("span", { class: "ck", "aria-hidden": "true", text: "✓" }), el("span", { text: `${monthDay(iso)} · ${recordOf(iso).event}` }));
      b.addEventListener("click", () => { if (picked.has(iso)) picked.delete(iso); else picked.add(iso); b.setAttribute("aria-pressed", String(picked.has(iso))); }); return b; });
    openSheet({ title: "함께 볼 기록을 골라요", body: rows.length ? [el("div", { class: "lb-pick-list" }, rows)] : [el("p", { text: "표시해 둔 기록이 아직 없어요. 돌아보기에서 표시할 수 있어요." })],
      primary: rows.length ? { text: "고르기", onclick: () => { refs = [...picked]; drawRefs(); } } : null, secondary: { text: rows.length ? "그만두기" : "닫기" } });
  }
  function drawRefs() {
    const canLoad = choice.mark === "c" || editing;
    put(refSlot,
      refs.length || canLoad ? el("p", { class: "st-block-label", text: "함께 보는 기록" }) : null,
      refs.length ? el("div", { class: "lb-roll lb-roll-tight" }, [...refs].sort().map((iso) => recordCard(iso, { markable: false }))) : null,
      canLoad ? el("button", { type: "button", class: "st-pill-link lb-load", onclick: loadSheet }, el("span", { class: "st-pill-link-face" }, "표시한 기록 불러오기", chev())) : null);
  }
  drawRefs();
  const screen = el("div", { class: `screen settings-sub lb lb-write${qa.keyboard ? " lb-kb-on" : ""}` },
    head(navigate, "lookback/note", "내 기준으로"),
    el("h1", { tabindex: "-1", text: editing ? "내 기준 고치기" : "내 기준 적기" }),
    field.node, refSlot,
    el("div", { class: "sd-actions" }, hint, save));
  put(main, screen, qa.keyboard ? el("div", { class: "lb-kb", "aria-hidden": "true", text: "자판이 올라온 자리(시안)" }) : null);
  sync();
}

// ══════════════════════ 4. 작은 실험 #/lookback/try (갈림길 5) ══════════════════════
const rangeText = (x) => `${monthDay(x.start)}부터 ${monthDay(experimentEnd(x))}까지 · ${x.days}일`;
const periodRecords = (x, navigate, emptyText) => { const days = recordedBetween(x.start, experimentEnd(x) < todayIso() ? experimentEnd(x) : todayIso());
  return el("section", { class: "sx-sec" }, el("h2", { text: "이 기간에 남긴 기록" }),
    days.length ? el("div", { class: "lb-roll" }, days.map((iso) => recordCard(iso, { onMark: onMarkFor() }))) : el("p", { class: "note", text: emptyText })); };

function renderPick(main, navigate) {
  let text = choice.pick === "a" ? EXAMPLES[0] : "", days = 7, from = null, custom = false;
  const hint = el("p", { class: "blocked-hint au-hint", id: "lbTryHint", hidden: true, role: "status" });
  const start = el("button", { type: "button", class: "btn primary big", text: "시작하기", "aria-describedby": "lbTryHint", onclick: submit });
  const sync = () => { const bad = !clean(text); start.setAttribute("aria-disabled", String(bad)); if (!bad) hint.hidden = true; };
  const own = lineField({ id: "lbTry", label: choice.pick === "b" ? "이 기준으로 해 보고 싶은 것 한 가지" : "해 보고 싶은 것 한 가지", placeholder: "예: 자기 전 30분 화면 끄기",
    help: "작고 구체적일수록 해 보기 쉬워요. 며칠 뒤에 그만둬도 괜찮아요.", onInput: (v) => { if (choice.pick !== "a" || custom) { text = v; sync(); } } });
  function submit() {
    if (!clean(text)) { hint.textContent = choice.pick === "b" && !from ? "기준을 고르고, 해 보고 싶은 것을 적어 주세요." : "해 보고 싶은 것을 적어 주세요."; hint.hidden = false; own.input.focus(); return; }
    lb.experiment = { text: clean(text), days, start: todayIso(), from };
    navigate("lookback/try"); toast("오늘부터 해 봐요");
  }
  let what;
  if (choice.pick === "a") { // 예시에서: 고르거나 직접 적는다. 예시는 권하는 것이 아니라 틀을 보여 주는 것이다
    own.node.hidden = true;
    what = [el("p", { class: "st-block-label", text: "무엇을 해 볼까요?" }),
      radios("st-pills lb-pills", "st-pill", "해 볼 것", [...EXAMPLES.map((t) => [t, t]), ["", "직접 적기…"]], text, (v) => { custom = v === ""; own.node.hidden = !custom; text = custom ? own.input.value : v; sync(); if (custom) own.input.focus(); }),
      own.node, el("p", { class: "note st-block-note", text: "예시일 뿐이에요. 내 말로 바꿔 적어도 돼요." })];
  } else if (choice.pick === "b") { // 내 기준에서: 기준 하나를 고르고 그 기준으로 해 볼 것을 적는다
    const open = lb.standards.filter((s) => !s.folded);
    what = open.length ? [el("p", { class: "st-block-label", text: "어느 기준에서 시작할까요?" }),
      radios("lb-opts", "lb-opt", "내 기준", open.slice(0, 6).map((s) => [s.id, s.text]), null, (id) => { from = id; }), own.node]
      : [el("div", { class: "sx-empty" }, el("p", { class: "sx-headline", text: "아직 적은 기준이 없어요" }), el("p", { class: "caption", text: "기준이 없어도 해 보고 싶은 것을 바로 적어 시작할 수 있어요." })), own.node];
  } else what = [own.node];
  main.replaceChildren(el("div", { class: "screen settings-sub lb lb-try" },
    head(navigate, "stats", "뒤로"),
    el("h1", { tabindex: "-1", text: "작은 실험" }),
    el("p", { class: "lede", text: "해 보고 싶은 것 하나를 며칠 해 봐요. 해 보고 어땠는지는 내가 정해요." }),
    el("div", { class: "st-block" }, what),
    el("div", { class: "st-block" }, el("p", { class: "st-block-label", text: "며칠 동안 해 볼까요?" }),
      radios("st-pills", "st-pill", "기간", DAY_CHOICES.map((d) => [d, `${d}일`]), days, (d) => { days = d; }),
      el("p", { class: "note st-block-note", text: "기간이 끝나면 그동안 남긴 기록을 함께 보여 드려요. 날마다 했는지는 묻지 않아요." })),
    lb.past.length ? el("section", { class: "sx-sec" }, el("h2", { text: "해 본 것" }), el("ul", { class: "lb-list lb-list-a" }, lb.past.map((p) => el("li", { class: "lb-row lb-past" },
      el("div", {}, el("p", { class: "lb-row-text", text: p.text }), el("p", { class: "caption", text: `${rangeText(p)}${p.note ? ` · ${p.note}` : ""}` })))))) : null,
    el("div", { class: "sd-actions" }, hint, start)));
  sync();
}
function stopSheet(navigate) {
  openSheet({ title: "실험을 멈출까요?", body: [el("p", { text: "멈춰도 그동안 남긴 기록은 그대로 있어요." })],
    primary: { text: "멈추기", onclick: () => { lb.experiment = null; navigate("lookback/try"); toast("실험을 멈췄어요"); } }, secondary: { text: "그만두기" } });
}
function renderActive(main, navigate) {
  const x = lb.experiment, std = lb.standards.find((s) => s.id === x.from);
  main.replaceChildren(el("div", { class: "screen settings-sub lb lb-try" },
    head(navigate, "stats", "뒤로"), scene({ sign: true }),
    el("p", { class: "sx-eyebrow lb-center", text: "해 보는 중" }),
    el("h1", { class: "lb-try-title", tabindex: "-1", text: x.text }),
    el("p", { class: "sxd-sub lb-center", text: rangeText(x) }),
    std ? el("p", { class: "caption lb-center", text: `내 기준 '${std.text}'에서 시작했어요` }) : null,
    el("p", { class: "note st-example", text: "날마다 했는지는 묻지 않아요. 못 한 날이 있어도 그대로 두면 돼요." }),
    periodRecords(x, navigate, "아직 이 기간에 남긴 기록이 없어요. 기록은 평소처럼 오늘 화면에서 남겨요."),
    el("button", { type: "button", class: "st-delete-row lb-stop", onclick: () => stopSheet(navigate) }, el("span", { text: "실험 멈추기" }), chev())));
}
function renderEnded(main, navigate) {
  const x = lb.experiment;
  const field = lineField({ id: "lbAfter", label: "한 줄로 적어 두기", placeholder: "예: 잠드는 시간이 조금 빨라졌다", help: "좋았는지 아닌지는 내가 정해요. 비워 둬도 괜찮아요.", max: 80 });
  const finish = (again) => () => {
    lb.past.unshift({ ...x, note: clean(field.input.value) });
    lb.experiment = again ? { text: x.text, days: x.days, start: todayIso(), from: x.from } : null;
    navigate("lookback/try"); toast(again ? "오늘부터 한 번 더 해 봐요" : "실험을 마쳤어요");
  };
  main.replaceChildren(el("div", { class: "screen settings-sub lb lb-try" },
    head(navigate, "stats", "뒤로"), scene({ sign: true }),
    el("p", { class: "sx-eyebrow lb-center", text: "정한 기간이 끝났어요" }),
    el("h1", { class: "lb-try-title", tabindex: "-1", text: x.text }),
    el("p", { class: "sxd-sub lb-center", text: rangeText(x) }),
    periodRecords(x, navigate, "이 기간에 남긴 기록은 없어요."),
    el("div", { class: "st-block lb-after" }, el("p", { class: "sx-headline", text: "해 보니 어땠나요?" }), field.node),
    el("div", { class: "sd-actions" }, el("button", { type: "button", class: "btn primary big", text: "마치기", onclick: finish(false) }),
      el("button", { type: "button", class: "btn text big", text: "같은 실험 한 번 더", onclick: finish(true) }))));
}

export function renderLookback(main, navigate, params, rest = []) {
  rowSeq = 0;
  const page = rest[0];
  if (page === "note") renderNote(main, navigate);
  else if (page === "write") renderWrite(main, navigate, params);
  else if (page === "try") ({ none: renderPick, active: renderActive, ended: renderEnded })[experimentState()](main, navigate);
  else renderReader(main, navigate, params);
  main.querySelector("h1")?.focus({ preventScroll: true });
}

// ══════════════════════ 다른 화면에 붙는 조각 ══════════════════════

// 완료 화면의 전하기 한 줄(갈림길 1). 입력·저장·버튼이 없다 — 묻기만 하고 답을 받지 않는다. 전할 사람이 있다고 전제하지 않는 물음이다.
export const TELL_LINE = "이 이야기를 전하고 싶은 사람이 있나요?";
export function tellLine(screen) {
  if (choice.tell === "c" && !qa.tellDay) return; // 가끔만: 나오지 않는 날
  if (choice.tell === "b") { // 잠깐 나타나는 쪽지: 하늘 자리에 올라왔다가 사라진다. 움직임 줄이기에서는 움직이지 않고 있다가 사라진다
    const note = el("p", { class: "lb-tell-note", role: "note" }, el("i", { class: "sxd-peek-tape", "aria-hidden": "true" }), TELL_LINE);
    screen.querySelector(".done-land")?.append(note);
    setTimeout(() => { if (!note.isConnected) return; if (reducedMotion()) note.remove(); else { note.classList.add("is-leaving"); setTimeout(() => note.remove(), 700); } }, 9000);
    return;
  }
  screen.querySelector(".done-head")?.append(el("p", { class: "note lb-tell", text: TELL_LINE }));
}

// 오늘 화면의 실험 표식(갈림길 6). 글자로 재촉하지 않는다 — 진행 중이면 조용한 표식 하나, 정한 기간이 끝나면 민트 불빛 하나가 더해질 뿐이다.
export function todayMark(box, headNode) {
  const st = experimentState();
  if (st === "none" || choice.show === "c") return;
  const label = st === "ended" ? `작은 실험의 기간이 끝났어요: ${lb.experiment.text}` : `해 보는 중인 작은 실험: ${lb.experiment.text}`;
  if (choice.show === "a") {
    const btn = el("a", { class: `today-past lb-today-btn${st === "ended" ? " is-ended" : ""}`, href: "#/lookback/try", "aria-label": label }, ICONS.sign());
    const past = headNode.querySelector(".today-past");
    const group = el("span", { class: "lb-today-group" });
    past.replaceWith(group); group.append(btn, past);
  } else box.append(el("a", { class: `lb-forest-sign${st === "ended" ? " is-ended" : ""}`, href: "#/lookback/try", "aria-label": label }, signPost("lb-forest-sign-svg"), el("i", { class: "lb-forest-light", "aria-hidden": "true" })));
}

// 달력의 입구(갈림길 2의 A안): 날짜를 고르지 않았을 때의 빈 자리에 알약 하나.
export function calendarEntry() {
  if (choice.place !== "a") return null;
  return el("a", { class: "st-pill-link lb-cal-entry", href: "#/lookback" }, el("span", { class: "st-pill-link-face" }, "지난 기록 이어서 읽기", chev()));
}

// 통계 맨 아래의 줄: 돌아보기(새 화면이 있는 안에서만)·내 기준·작은 실험으로 가는 입구.
export function statsRows(navigate) {
  rowSeq = 0;
  const st = experimentState();
  return el("section", { class: "sx-sec lb-stats-rows" }, el("h2", { class: "sx-eyebrow", text: "기록에서 이어지는 것" }),
    el("div", { class: "st-rows" },
      choice.place === "c" ? null : linkRow(ICONS.read, "돌아보기", () => navigate("lookback")),
      linkRow(ICONS.note, "내 기준", () => navigate("lookback/note")),
      linkRow(ICONS.sign, "작은 실험", () => navigate("lookback/try"), rowSeq++, st === "active" ? "해 보는 중" : st === "ended" ? "기간이 끝났어요" : null)));
}

// 통계 친구 상세 아래의 이어 읽기(갈림길 2의 C안): 새 화면 없이 그 마음이 머문 날의 기록을 그 자리에서 읽는다.
export function statsDetailReader(code, dates, navigate) {
  if (choice.place !== "c") return null;
  const days = recordedDays(60).filter((iso) => dates.includes(iso) && catsOf(recordOf(iso)).includes(code));
  if (!days.length) return null;
  const label = category(code).label;
  return el("section", { class: "sx-sec lb-inline" }, el("h2", { text: `${label}${iGa(label)} 머문 날 다시 읽기` }),
    el("p", { class: "note", text: "이 기간의 기록을 날짜순으로 이어서 읽어요." }),
    el("div", { class: "lb-roll" }, days.map((iso) => recordCard(iso, { onMark: onMarkFor() }))), endBlock(navigate, { few: days.length < 3 }));
}
