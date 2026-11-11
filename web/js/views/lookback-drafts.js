// 돌아보기 시안의 다른 초안들(TASK-LOOKBACK-01 단계 A, 3판 — 사용자가 고를 폭을 넓히려고 더 지은 것). 고른 뒤에는 고르지 않은 초안을 지운다.
// 브랜드의 기본 공식(BRAND_STORY §6: 흰 바탕 + 박스 없이 선 큰 친구 + ink 알약 + 큰 타이포 + 몇 곳의 큰 색 면)에 2판이 모자랐던 것 — 큰 친구, 큰 글자, 박스 줄이기 — 을 초안마다 다르게 채웠다.
//   돌아보기 b '길 따라 읽기'(상자 없이 날짜가 큰 글자) · c '한 장씩 넘겨 읽기'(그날의 친구가 언덕에 서고 옆으로 넘긴다)
//   내 기준   b '노트 한 장'(줄 노트 한 장, 줄 수가 적을수록 글자가 크다) · c '큰 글자'(종이 없이 흰 바탕의 문장)
//   해 보는 길 b '문장으로 정하기'(큰 글자의 빈칸 둘을 채운다)
import { el, announce, toast, reducedMotion } from "../dom.js";
import { category, pebbleImg, stoneImg } from "../data.js";
import { renderLand, doneLayout } from "../components/land.js";
import { choice, lb, recordOf, recordedDays, todayIso, shiftDay, monthDay, weekday, toggleMark, EXAMPLES, DAY_CHOICES } from "../lookback/store.js";
import { backIcon, chev, head, chipVars, catsOf, put, clean, radios, scene, endBlock, standardSheet, goBack } from "./lookback.js";

const markButton = (iso, onChange) => {
  const btn = el("button", { type: "button", class: "choice lb-mark lb-mark-plain", "aria-pressed": String(lb.marks.has(iso)), "aria-label": `${monthDay(iso)} 기록에 표시` },
    el("span", { class: "ck", "aria-hidden": "true", text: "✓" }), el("span", { text: "표시" }));
  btn.addEventListener("click", () => { const on = toggleMark(iso); btn.setAttribute("aria-pressed", String(on)); announce(`${monthDay(iso)} 기록 ${on ? "표시함" : "표시 지움"}`); onChange?.(on); document.dispatchEvent(new CustomEvent("lb-marks")); });
  return btn;
};
const chipsOf = (rec, max = 4) => { const words = catsOf(rec).flatMap((cat) => rec.emotions.filter((e) => e.cat === cat).map((e) => ({ cat, label: e.label })));
  return el("div", { class: "sxd-peek-chips" }, words.slice(0, max).map((w) => el("span", { class: "sxd-chip", style: chipVars(w.cat) }, el("i", { class: "sxd-chip-dot", "aria-hidden": "true" }), el("span", { class: "sxd-chip-label", text: w.label }))),
    words.length > max ? el("span", { class: "sxd-peek-more", "aria-label": `고른 말 ${words.length - max}개 더`, text: `+${words.length - max}` }) : null); };
const openLink = (iso) => el("a", { class: "sxd-peek-open", href: `#/record/${iso}?from=lookback` }, "편지 열기", chev("sx-chev"));
const sizesOf = (rec) => catsOf(rec).map((c) => `${category(c).label} ${rec.repr[c] ?? "–"}`).join(" · ");
const segmented = (period, onPick) => radios("segmented", "", "기간", [[7, "최근 7일"], [30, "최근 30일"]], period, onPick);
const emptyBlock = (navigate) => el("div", { class: "sx-empty" }, el("p", { class: "sx-headline", text: "아직 다시 읽을 기록이 없어요" }),
  el("p", { class: "caption", text: "오늘 화면에서 마음을 남기면 여기에서 이어서 읽을 수 있어요." }),
  el("div", { class: "stack" }, el("button", { type: "button", class: "btn secondary", text: "오늘 화면으로", onclick: () => navigate("today") })));

// ══════════════════════ 돌아보기 b·c ══════════════════════
export function renderReaderDraft(main, navigate, params) {
  let period = Number(params.get("p")) === 30 ? 30 : 7;
  (choice.read === "c" ? pages : way)();

  // b 길 따라 읽기: 왼쪽에 옅은 길 한 줄, 날마다 그날 가장 크게 머문 마음의 조약돌이 길 위에 놓인다. 종이 상자가 없고 날짜가 큰 글자다. 표시한 날은 날짜 아래 민트 띠
  function way() {
    const body = el("div", { class: "lb-body" }), sceneSlot = el("div", {});
    const draw = () => {
      const days = recordedDays(period);
      put(sceneSlot, scene({ cats: [...new Set(days.flatMap((iso) => catsOf(recordOf(iso))))] }));
      history.replaceState(null, "", `#/lookback?p=${period}`);
      if (!days.length) { put(body, emptyBlock(navigate)); return; }
      put(body, el("p", { class: "caption lb-count", text: `${monthDay(shiftDay(todayIso(), -(period - 1)))}부터 오늘까지 · 기록 ${days.length}편` }),
        el("ol", { class: "lb-way" }, days.map((iso) => {
          const rec = recordOf(iso), cats = catsOf(rec), top = cats.reduce((a, c) => ((rec.repr[c] ?? 0) > (rec.repr[a] ?? 0) ? c : a), cats[0]);
          const li = el("li", { class: lb.marks.has(iso) ? "is-marked" : "" });
          const peb = pebbleImg(top, { size: 30 }); peb.classList.add("lb-way-peb");
          li.append(peb, el("p", { class: "lb-way-date" }, el("b", { text: monthDay(iso) }), el("span", { text: ` ${weekday(iso)}요일` })),
            el("p", { class: "lb-way-event", text: rec.event }), rec.reason?.trim() ? el("p", { class: "lb-way-reason", text: rec.reason }) : null,
            el("p", { class: "caption lb-way-sizes", text: sizesOf(rec) }), chipsOf(rec, 2),
            el("div", { class: "lb-way-foot" }, markButton(iso, (on) => li.classList.toggle("is-marked", on)), openLink(iso)));
          return li;
        })), endBlock(navigate, days));
    };
    draw();
    put(main, el("div", { class: "screen lb lb-reader tb-rise" }, head(navigate, "calendar", "달력으로"), sceneSlot,
      el("h1", { tabindex: "-1", text: "돌아보기" }), el("p", { class: "lede", text: "지나온 길을 따라 기록을 다시 읽어요." }),
      el("p", { class: "proto-note" }, el("span", { class: "proto-tag", text: "시안" }), " 아래 기록은 모두 지어낸 예시입니다."),
      segmented(period, (p) => { period = p; draw(); announce(`최근 ${p}일의 기록`); }), body));
    main.querySelector("h1")?.focus({ preventScroll: true });
  }

  // c 한 장씩 넘겨 읽기: 하루가 한 장이다. 위에는 완료 화면과 같은 언덕에 그날의 친구가 서고(land.js), 아래에 날짜와 글. 옆으로 넘기고, 마지막 장이 물음이다
  function pages() {
    const host = el("div", { class: "lb-pages-host" });
    const draw = () => {
      const days = recordedDays(period);
      history.replaceState(null, "", `#/lookback?p=${period}`);
      if (!days.length) { put(host, emptyBlock(navigate)); return; }
      const page = (iso) => { const rec = recordOf(iso);
        const tape = el("i", { class: "sxd-peek-tape lb-page-tape", "aria-hidden": "true", hidden: !lb.marks.has(iso) });
        return el("article", { class: "lb-page", "aria-label": `${monthDay(iso)}의 기록` },
          el("div", { class: "lb-page-land" }, el("div", { class: "land-fit" }, renderLand(doneLayout(catsOf(rec))))),
          el("div", { class: "lb-page-text" }, tape,
            el("p", { class: "lb-page-date" }, el("b", { text: monthDay(iso) }), el("span", { text: ` ${weekday(iso)}요일` })),
            el("p", { class: "caption", text: sizesOf(rec) }),
            el("div", { class: "sxd-peek-lines" }, el("p", { class: "lb-ln" }, el("b", { text: "있었던 일" }), rec.event), rec.reason?.trim() ? el("p", { class: "lb-ln" }, el("b", { text: "이유" }), rec.reason) : null),
            chipsOf(rec, 2), el("div", { class: "lb-way-foot" }, markButton(iso, (on) => { tape.hidden = !on; }), openLink(iso)))); };
      const last = el("article", { class: "lb-page lb-page-end", "aria-label": "다 읽은 자리" }, endBlock(navigate, days));
      const cards = [...days.map(page), last];
      const pager = el("div", { class: "ml-pager lb-pager", tabindex: "0", role: "region", "aria-roledescription": "carousel", "aria-label": "지난 기록" }, cards);
      const prev = el("button", { type: "button", class: "cal-arrow", "aria-label": "이전 날" }, backIcon());
      const next = el("button", { type: "button", class: "cal-arrow", "aria-label": "다음 날" }, chev(""));
      const count = el("p", { class: "lb-pager-count", "aria-live": "polite" });
      const index = () => Math.round(pager.scrollLeft / (pager.clientWidth + 8));
      const off = (b, v) => { if (v) b.setAttribute("aria-disabled", "true"); else b.removeAttribute("aria-disabled"); };
      const paint = () => { const i = Math.min(cards.length - 1, index()); count.textContent = i < days.length ? `${days.length}편 중 ${i + 1}편` : "다 읽었어요"; off(prev, i === 0); off(next, i >= cards.length - 1); };
      const go = (d) => pager.scrollTo({ left: (index() + d) * (pager.clientWidth + 8), behavior: reducedMotion() ? "auto" : "smooth" });
      pager.addEventListener("scroll", () => requestAnimationFrame(paint), { passive: true });
      prev.addEventListener("click", () => { if (prev.getAttribute("aria-disabled") !== "true") go(-1); });
      next.addEventListener("click", () => { if (next.getAttribute("aria-disabled") !== "true") go(1); });
      pager.addEventListener("keydown", (ev) => { if (ev.key === "ArrowRight") { go(1); ev.preventDefault(); } if (ev.key === "ArrowLeft") { go(-1); ev.preventDefault(); } });
      put(host, pager, el("div", { class: "lb-pager-nav" }, prev, count, next));
      requestAnimationFrame(paint);
    };
    draw();
    put(main, el("div", { class: "screen lb lb-pages" }, el("div", { class: "lb-pages-top" },
      el("button", { type: "button", class: "back", "aria-label": "달력으로", onclick: goBack(navigate, "calendar") }, backIcon()),
      el("h1", { tabindex: "-1", text: "돌아보기" }), segmented(period, (p) => { period = p; draw(); announce(`최근 ${p}일의 기록`); })), host));
    main.querySelector("h1")?.focus({ preventScroll: true });
  }
}

// ══════════════════════ 내 기준 b·c ══════════════════════
// 둘 다 줄 수에 따라 글자 크기가 달라진다(1~2줄 가장 크게, 3~6줄 크게, 7줄부터 본문 크기). 수는 적지 않는다. 줄을 누르면 2판과 같은 시트가 열린다.
export function renderNoteDraft(main, navigate) {
  const screen = el("div", { class: "screen settings-sub lb lb-note" });
  put(main, screen); draw(choice.note);
  function draw(kind) {
    const redraw = () => draw(kind);
    const open = lb.standards.filter((s) => !s.folded), folded = lb.standards.filter((s) => s.folded);
    const step = open.length <= 2 ? "few" : open.length <= 6 ? "some" : "many";
    const pebs = (s) => (s.from.length ? el("span", { class: "lb-line-pebs", "aria-hidden": "true" }, [...s.from].sort().slice(0, 3).map((iso) => { const c = catsOf(recordOf(iso))[0]; return c ? pebbleImg(c, { size: 22 }) : null; })) : null);
    const line = (s) => el("li", {}, el("button", { type: "button", class: "lb-line", "aria-haspopup": "dialog", onclick: () => standardSheet(s, navigate, redraw) }, el("span", { class: "lb-line-text", text: s.text }), pebs(s)));
    const foldedList = el("ul", { class: `lb-lines ${kind === "b" ? "on-paper" : "on-white"} many lb-folded`, id: "lbFolded", hidden: true }, folded.map(line));
    const foldedBtn = folded.length ? el("button", { type: "button", class: "link lb-fold-toggle", "aria-expanded": "false", "aria-controls": "lbFolded", text: "접어 둔 문장 보기" }) : null;
    foldedBtn?.addEventListener("click", () => { const on = foldedList.hidden; foldedList.hidden = !on; foldedBtn.setAttribute("aria-expanded", String(on)); });
    const empty = !lb.standards.length;
    const stone = Object.assign(stoneImg("rest"), { className: "stone-img rest lb-paper-stone" });
    const list = empty ? null : kind === "b"
      // b 노트 한 장: 일기의 줄 노트와 같은 종이 한 장에 한 줄씩. 종이 위 모서리에 나의 돌이 얹혀 있다
      ? el("div", { class: `lb-notepage ${step}` }, stone, el("ul", { class: `lb-lines on-paper ${step}` }, open.map(line)))
      // c 큰 글자: 종이 없이 흰 바탕에 문장만. 줄 사이는 옅은 선
      : el("ul", { class: `lb-lines on-white ${step}` }, open.map(line));
    put(screen, head(navigate, "stats", "뒤로"), kind === "c" ? scene({}) : null,
      el("h1", { tabindex: "-1", text: "내 기준" }),
      el("p", { class: "lede", text: empty ? "기록을 다시 읽다가 떠오르면 한 줄 남길 수 있어요." : "기록을 다시 읽다가 적어 둔 문장이에요." }),
      empty ? (kind === "b" ? el("div", { class: "lb-notepage few is-empty" }, stone, el("p", { class: "lb-empty-line", text: "아직 적어 둔 문장이 없어요" })) : el("p", { class: "lb-empty-line", text: "아직 적어 둔 문장이 없어요" })) : null,
      list, foldedBtn, folded.length ? foldedList : null,
      el("div", { class: "sd-actions" }, el("button", { type: "button", class: "btn primary big", text: "한 줄 적기", onclick: () => navigate("lookback/write") })));
  }
}

// ══════════════════════ 해 보는 길 b: 문장으로 정하기 ══════════════════════
// 칸을 채우는 서식 대신 큰 글자의 문장 하나를 완성한다 — 빈칸 둘(어떤 때 · 이렇게)이 문장 속에 있다. 아래 언덕에 팻말이 서 있다.
export function renderPickPoster(main, navigate, params) {
  let days = 7;
  const std = lb.standards.find((s) => s.id === Number(params?.get("from")));
  const blank = (id, label, placeholder, cls) => { const t = el("textarea", { id, class: `lb-blank ${cls}`, rows: 1, placeholder, "aria-label": label, enterkeyhint: "done" });
    const grow = () => { t.style.height = "auto"; t.style.height = `${t.scrollHeight}px`; };
    t.addEventListener("input", () => { t.value = [...t.value.replace(/\n/g, " ")].slice(0, 30).join(""); grow(); sync(); }); requestAnimationFrame(grow); t.grow = grow; return t; };
  const when = blank("lbWhen", "어떤 때", "어떤 때", "when"), what = blank("lbWhat", "이렇게 해 보기", "이렇게 해 보기", "what");
  const hint = el("p", { class: "blocked-hint au-hint", id: "lbTryHint", hidden: true, role: "status" });
  const start = el("button", { type: "button", class: "btn primary big", text: "시작하기", "aria-describedby": "lbTryHint", onclick: submit });
  const daysWord = el("b", { text: "7일" });
  function sync() { const bad = !clean(what.value); start.setAttribute("aria-disabled", String(bad)); if (!bad) hint.hidden = true; }
  function submit() {
    if (!clean(what.value)) { hint.textContent = "해 보고 싶은 것을 적어 주세요."; hint.hidden = false; what.focus(); return; }
    lb.path = { when: clean(when.value), what: clean(what.value), days, start: todayIso(), walked: new Set() };
    navigate("lookback/try"); toast("오늘부터 시작해요");
  }
  put(main, el("div", { class: "screen settings-sub lb lb-try lb-poster tb-rise" }, head(navigate, "stats", "뒤로"),
    el("h1", { class: "lb-poster-h1", tabindex: "-1", text: "해 보는 길" }),
    std ? el("p", { class: "lb-quote lb-from", text: std.text }) : null,
    el("div", { class: "lb-madlib", role: "group", "aria-label": "해 볼 것" }, when, what,
      el("p", { class: "lb-madlib-tail" }, daysWord, " 동안 해 볼래요.")),
    radios("st-pills lb-poster-days", "st-pill", "기간", DAY_CHOICES.map((d) => [d, `${d}일`]), days, (d) => { days = d; daysWord.textContent = `${d}일`; }),
    el("div", { class: "lb-fill" }, el("p", { class: "st-block-label", text: "예시로 채워 보기" }),
      el("div", { class: "st-pills" }, EXAMPLES.map(([w, h]) => el("button", { type: "button", class: "st-pill lb-fill-pill", text: h, "aria-label": `예시: ${w}, ${h}`, onclick: () => { when.value = w; what.value = h; when.grow(); what.grow(); sync(); announce("예시로 채웠어요. 내 말로 바꿔도 돼요."); } }))),
      el("p", { class: "caption", text: "예시일 뿐이에요. 어땠는지는 해 본 내가 정해요." })),
    scene({ sign: {}, tagged: false }),
    el("div", { class: "sd-actions" }, hint, start)));
  sync();
  main.querySelector("h1")?.focus({ preventScroll: true });
}
