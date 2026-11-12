// 돌아보기의 '다시 읽기'(TASK-LOOKBACK-01 단계 A 시안, 4판). 기간에 따라 읽는 법이 다르다 — 한 주는 읽고, 한 달은 훑는다.
//   최근 7일  = 한 장씩 넘겨 읽기: 하루가 한 장. 완료 화면과 같은 언덕에 그날의 친구가 서고(land.js) 옆으로 넘긴다. 마지막 장이 물음이다.
//   최근 30일 = 훑어보기: 주마다 묶은 한 줄 목록. 줄을 누르면 그 자리에서 펼쳐진다. 위의 '여러 날에 나온 말'을 누르면 그 말이 나온 날만 남는다.
// 통계와 다른 점: 여기에는 크기·평균·비교 같은 수가 없다. 그날 무슨 일이 있었고 왜 그랬는지, 글을 다시 읽는 자리다.
// 모아 두기(1~3판의 '표시'): 마음에 남는 기록을 모아 두면 다 읽은 뒤 한데 놓고 보며 한 줄 적는다. 적은 문장(내 기준) 뒤에 그 기록들이 함께 남는다.
import { el, svgEl, announce, toast, reducedMotion } from "../dom.js";
import { pebbleImg } from "../data.js";
import { renderLand, doneLayout } from "../components/land.js";
import { openSheet } from "../components/sheet.js";
import { lb, recordOf, recordedDays, todayIso, shiftDay, monthDay, weekday, toggleMark, repeated } from "../lookback/store.js";
import { backIcon, chev, head, chipVars, catsOf, put, refRow, goBack, iGa } from "./lookback.js";

let taught = false; // 처음 모아 둘 때 한 번만 무슨 일이 생기는지 알린다
export function markButton(iso, onChange) {
  const btn = el("button", { type: "button", class: "choice lb-mark", "aria-pressed": String(lb.marks.has(iso)), "aria-label": `${monthDay(iso)} 기록 모아 두기` },
    el("span", { class: "ck", "aria-hidden": "true", text: "✓" }), el("span", { text: "모아 두기" }));
  btn.addEventListener("click", () => {
    const on = toggleMark(iso); btn.setAttribute("aria-pressed", String(on));
    if (on && !taught) { taught = true; toast("모아 뒀어요. 다 읽은 뒤 한데 놓고 볼 수 있어요"); } else announce(`${monthDay(iso)} 기록을 ${on ? "모아 뒀어요" : "뺐어요"}`);
    onChange?.(on); document.dispatchEvent(new CustomEvent("lb-marks"));
  });
  return btn;
}
const onMarks = (node, paint) => { const fn = () => { if (node.isConnected) paint(); else document.removeEventListener("lb-marks", fn); }; document.addEventListener("lb-marks", fn); paint(); };
const chipsOf = (rec, max) => { const words = catsOf(rec).flatMap((cat) => rec.emotions.filter((e) => e.cat === cat).map((e) => ({ cat, label: e.label })));
  return el("div", { class: "sxd-peek-chips" }, words.slice(0, max).map((w) => el("span", { class: "sxd-chip", style: chipVars(w.cat) }, el("i", { class: "sxd-chip-dot", "aria-hidden": "true" }), el("span", { class: "sxd-chip-label", text: w.label }))),
    words.length > max ? el("span", { class: "sxd-peek-more", "aria-label": `고른 말 ${words.length - max}개 더`, text: `+${words.length - max}` }) : null); };
const openLink = (iso) => el("a", { class: "sxd-peek-open", href: `#/record/${iso}?from=lookback` }, "편지 열기", chev("sx-chev"));
const dateLine = (iso, cls) => el("p", { class: cls }, el("b", { text: monthDay(iso) }), el("span", { text: ` ${weekday(iso)}요일` }));
const downIcon = () => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "lb-day-chev" }, svgEl("path", { d: "M5.5 9.5 12 16l6.5-6.5" }));

// 하루 한 줄(한 달 훑어보기·말 하나를 눌렀을 때·살아 보는 기간의 기록이 함께 쓴다). 누르면 그 자리에서 이유·고른 말·모아 두기가 펼쳐진다.
export function dayRow(iso, { open = false } = {}) {
  const rec = recordOf(iso), cats = catsOf(rec);
  const li = el("li", { class: `lb-day${lb.marks.has(iso) ? " is-marked" : ""}`, "data-iso": iso });
  const more = el("div", { class: "lb-day-more", hidden: !open },
    rec.reason?.trim() ? el("p", { class: "lb-day-reason", text: rec.reason }) : null, chipsOf(rec, 3),
    el("div", { class: "lb-day-foot" }, markButton(iso, (on) => li.classList.toggle("is-marked", on)), openLink(iso)));
  const btn = el("button", { type: "button", class: "lb-day-head", "aria-expanded": String(open) },
    el("span", { class: "lb-day-pebs", "aria-hidden": "true" }, cats.slice(0, 2).map((c) => pebbleImg(c, { size: 26 }))),
    el("span", { class: "lb-day-main" }, el("span", { class: "lb-day-date" }, el("b", { text: monthDay(iso) }), ` ${weekday(iso)}`), el("span", { class: "lb-day-event", text: rec.event })), downIcon());
  btn.addEventListener("click", () => { const on = more.hidden; more.hidden = !on; btn.setAttribute("aria-expanded", String(on)); li.classList.toggle("is-open", on); });
  li.classList.toggle("is-open", open);
  li.append(btn, more);
  return li;
}
export const dayList = (isos) => el("ul", { class: "lb-days" }, isos.map((iso) => dayRow(iso)));

function wordSheet(item) {
  openSheet({ title: `'${item.word}'${iGa(item.word)} 나온 ${item.days.length}일`, secondary: { text: "닫기" },
    body: [el("p", { class: "note", text: item.kind === "pick" ? "이 말을 고른 날이에요." : "있었던 일이나 이유에 이 말을 적은 날이에요." }), dayList(item.days)] });
}

// 다 읽은 자리. 기준을 권하지 않는다 — 무엇이 되풀이됐는지는 센 것만 보이고, 그것이 중요한지는 사용자가 정한다.
export function endBlock(navigate, days, { again = true } = {}) {
  if (days.length < 3) return el("section", { class: "lb-end" }, el("p", { class: "sx-eyebrow", text: "여기까지예요" }),
    el("p", { class: "note", text: "기록이 더 쌓이면 여러 날을 이어서 읽을 수 있어요." }));
  const words = again ? repeated(days) : [];
  const marked = el("div", { class: "lb-marked" });
  onMarks(marked, () => put(marked, lb.marks.size
    ? [el("p", { class: "st-block-label", text: "모아 둔 기록" }), refRow([...lb.marks]), el("p", { class: "caption", text: "이 기록들을 한데 놓고 보며 적어요. 적은 문장 뒤에 함께 남아요." })]
    : el("p", { class: "caption", text: "모아 둔 기록이 없어도 적을 수 있어요." })));
  return el("section", { class: "lb-end" },
    el("p", { class: "sx-eyebrow", text: "여기까지 읽었어요" }),
    el("p", { class: "sx-headline", text: "반복된 것 중 나에게 중요한 것이 있나요?" }),
    el("p", { class: "note", text: "없어도 괜찮아요. 떠오르는 게 있으면 한 줄로 적어 둘 수 있어요." }),
    words.length ? el("div", { class: "lb-again" }, el("p", { class: "st-block-label", text: "여러 날에 나온 말" }),
      el("div", { class: "sx-pillrow" }, words.map((item) => el("button", { type: "button", class: "sx-pill lb-again-pill", "aria-label": `${item.word}, ${item.days.length}일. 그날들 다시 읽기`, onclick: () => wordSheet(item) }, item.word, el("em", { text: `${item.days.length}일` })))),
      el("p", { class: "caption", text: "센 것만 보여 드려요. 누르면 그 말이 나온 날을 모아 읽을 수 있어요." })) : null,
    marked,
    el("div", { class: "stack" }, el("button", { type: "button", class: "btn primary big", text: "기준 쓰기", onclick: () => navigate("lookback/write") })));
}
const emptyBlock = (navigate, text) => el("div", { class: "sx-empty" }, el("p", { class: "sx-headline", text }),
  el("p", { class: "caption", text: "오늘 화면에서 마음을 남기면 여기에서 다시 읽을 수 있어요." }),
  el("div", { class: "stack" }, el("button", { type: "button", class: "btn secondary", text: "오늘 화면으로", onclick: () => navigate("today") })));
// 모아 둔 기록 알약(위 오른쪽): 모아 둘 때마다 여기에 쌓이는 것이 보인다. 누르면 기준 쓰기로 간다
function trayChip(navigate) {
  const chip = el("button", { type: "button", class: "lb-traychip", onclick: () => navigate("lookback/write") });
  onMarks(chip, () => { chip.hidden = !lb.marks.size; put(chip, el("span", { class: "lb-traychip-pebs", "aria-hidden": "true" }, [...lb.marks].sort().slice(-3).map((iso) => { const c = catsOf(recordOf(iso))[0]; return c ? pebbleImg(c, { size: 22 }) : null; })),
    el("span", { text: `모아 둔 ${lb.marks.size}편` })); chip.setAttribute("aria-label", `모아 둔 기록 ${lb.marks.size}편. 한 줄 적으러 가기`); });
  return chip;
}
const topBar = (navigate, title) => el("div", { class: "lb-pages-top" },
  el("button", { type: "button", class: "back", "aria-label": "돌아보기로", onclick: goBack(navigate, "lookback") }, backIcon()), el("h1", { tabindex: "-1", text: title }), trayChip(navigate));

// ══════════════════════ 최근 7일: 한 장씩 ══════════════════════
function renderWeek(main, navigate) {
  const days = recordedDays(7), host = el("div", { class: "lb-pages-host" });
  if (!days.length) put(host, emptyBlock(navigate, "최근 7일에는 남긴 기록이 없어요"));
  else {
    const page = (iso, i) => { const rec = recordOf(iso);
      const art = el("article", { class: `lb-page${lb.marks.has(iso) ? " is-marked" : ""}`, "aria-label": `${monthDay(iso)}의 기록` },
        el("div", { class: "lb-page-land" }, el("div", { class: "land-fit" }, renderLand(doneLayout(catsOf(rec))))),
        el("div", { class: "lb-page-text" }, dateLine(iso, "lb-page-date"),
          el("p", { class: "lb-page-event", text: rec.event }), rec.reason?.trim() ? el("p", { class: "lb-page-reason", text: rec.reason }) : null,
          chipsOf(rec, 2), el("div", { class: "lb-day-foot" }, markButton(iso, (on) => art.classList.toggle("is-marked", on)), openLink(iso)),
          i === 0 ? el("p", { class: "caption lb-coach", text: "마음에 남는 기록을 모아 두면, 다 읽은 뒤 한데 놓고 보며 한 줄 적을 수 있어요." }) : null));
      return art; };
    const cards = [...days.map(page), el("article", { class: "lb-page lb-page-end", "aria-label": "다 읽은 자리" }, endBlock(navigate, days))];
    const pager = el("div", { class: "ml-pager lb-pager", tabindex: "0", role: "region", "aria-roledescription": "carousel", "aria-label": "최근 7일의 기록" }, cards);
    const prev = el("button", { type: "button", class: "cal-arrow", "aria-label": "이전 날" }, backIcon());
    const next = el("button", { type: "button", class: "cal-arrow", "aria-label": "다음 날" }, chev(""));
    const dots = cards.map(() => el("i"));
    const index = () => Math.round(pager.scrollLeft / (pager.clientWidth + 8));
    const off = (b, v) => { if (v) b.setAttribute("aria-disabled", "true"); else b.removeAttribute("aria-disabled"); };
    let spoken = 0;
    const paint = () => { const i = Math.min(cards.length - 1, index()); dots.forEach((d, k) => d.classList.toggle("on", k === i)); off(prev, i === 0); off(next, i >= cards.length - 1);
      if (i !== spoken) { spoken = i; announce(i < days.length ? `${days.length}편 중 ${i + 1}편, ${monthDay(days[i])}` : "다 읽은 자리"); } };
    const go = (d) => pager.scrollTo({ left: (index() + d) * (pager.clientWidth + 8), behavior: reducedMotion() ? "auto" : "smooth" });
    pager.addEventListener("scroll", () => requestAnimationFrame(paint), { passive: true });
    prev.addEventListener("click", () => { if (prev.getAttribute("aria-disabled") !== "true") go(-1); });
    next.addEventListener("click", () => { if (next.getAttribute("aria-disabled") !== "true") go(1); });
    pager.addEventListener("keydown", (ev) => { if (ev.key === "ArrowRight") { go(1); ev.preventDefault(); } if (ev.key === "ArrowLeft") { go(-1); ev.preventDefault(); } });
    put(host, pager, el("div", { class: "lb-pager-nav" }, prev, el("span", { class: "ml-dots", "aria-hidden": "true" }, dots), next));
    requestAnimationFrame(paint);
  }
  put(main, el("div", { class: "screen lb lb-pages" }, topBar(navigate, "최근 7일"), host));
}

// ══════════════════════ 최근 30일: 훑어보기 ══════════════════════
const ORD = ["첫째", "둘째", "셋째", "넷째", "다섯째", "여섯째"];
const weekName = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${m}월 ${ORD[Math.ceil((d + new Date(y, m - 1, 1).getDay()) / 7) - 1]} 주`; };
function renderMonth(main, navigate) {
  const days = recordedDays(30), words = repeated(days);
  const list = el("div", { class: "lb-month" }), state = el("p", { class: "caption lb-filter-state", role: "status" });
  let picked = null;
  const pills = words.map((item) => el("button", { type: "button", class: "sx-pill lb-again-pill", "aria-pressed": "false", onclick: () => { picked = picked === item ? null : item; draw(); } }, item.word, el("em", { text: `${item.days.length}일` })));
  function draw() {
    pills.forEach((p, k) => p.setAttribute("aria-pressed", String(words[k] === picked)));
    state.textContent = picked ? `'${picked.word}'${iGa(picked.word)} 나온 ${picked.days.length}일만 보고 있어요. 다시 누르면 모두 보여요.` : "말을 누르면 그 말이 나온 날만 남아요. 센 것만 보여 드려요.";
    const shown = picked ? days.filter((iso) => picked.days.includes(iso)) : days;
    const groups = new Map();
    for (const iso of shown) { const k = weekName(iso); groups.set(k, [...(groups.get(k) ?? []), iso]); }
    put(list, [...groups.entries()].map(([name, isos]) => el("section", { class: "lb-week" }, el("h2", { class: "sx-eyebrow", text: name }), dayList(isos))));
  }
  const tray = el("div", { class: "lb-traybar" });
  onMarks(tray, () => { tray.hidden = !lb.marks.size; put(tray, el("p", {}, el("b", { text: `모아 둔 기록 ${lb.marks.size}편` }), el("span", { text: "한데 놓고 보며 적어요" })),
    el("button", { type: "button", class: "btn primary", text: "기준 쓰기", onclick: () => navigate("lookback/write") })); });
  if (days.length) draw();
  put(main, el("div", { class: "screen lb lb-monthscreen tb-rise" }, head(navigate, "lookback", "돌아보기로"),
    el("h1", { tabindex: "-1", text: "최근 30일" }),
    el("p", { class: "lede", text: days.length ? `${monthDay(shiftDay(todayIso(), -29))}부터 오늘까지 남긴 기록 ${days.length}편을 훑어봐요.` : "" }),
    !days.length ? emptyBlock(navigate, "아직 다시 읽을 기록이 없어요") : null,
    words.length ? el("div", { class: "lb-again lb-filter" }, el("p", { class: "st-block-label", text: "여러 날에 나온 말" }), el("div", { class: "sx-pillrow" }, pills), state) : null,
    days.length ? list : null, days.length ? endBlock(navigate, days, { again: false }) : null), days.length ? tray : null);
}

export function renderRead(main, navigate, params) {
  (Number(params.get("p")) === 30 ? renderMonth : renderWeek)(main, navigate);
  main.querySelector("h1")?.focus({ preventScroll: true });
}
