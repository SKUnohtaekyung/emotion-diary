// 세부 감정 소프트 리스트(DESIGN_SYSTEM §6.3, D-037·D-041): 검색(부분·초성), 선택 트레이, 카테고리별 묶음, 초성 레일.
// 검색·초성 로직은 design/style-guide.html에서 옮겼다. 달라진 점: 목록은 v2 정본 194개 전체이고,
// 행 194개가 전부 Tab 정지점이 되지 않도록 listbox 안에서는 화살표로 이동한다(roving tabindex).
import { el, reducedMotion, announce } from "../dom.js";
import { data, category } from "../data.js";
import { state, toggleEmotion, on } from "../state.js";

const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ", BASE = { "ㄲ": "ㄱ", "ㄸ": "ㄷ", "ㅃ": "ㅂ", "ㅆ": "ㅅ", "ㅉ": "ㅈ" };
const choOf = (ch) => { const c = ch.charCodeAt(0) - 0xAC00; return c >= 0 && c < 11172 ? CHO[Math.floor(c / 588)] : ch; };
const choStr = (s) => [...s].filter((c) => c !== " ").map(choOf).join("");
const headOf = (w) => { const c = choOf(w[0]); return BASE[c] ?? c; };
const isCho = (q) => [...q].every((c) => CHO.includes(c));
export function matches(word, query) {
  const nq = query.replace(/\s/g, "");
  if (!nq) return true;
  return isCho(nq) ? choStr(word).includes(nq) : word.replace(/\s/g, "").includes(nq);
}

export function renderPicker() {
  const search = el("input", { class: "search", type: "search", placeholder: "감정 검색 — 허전, ㅎㅈ", "aria-label": "세부 감정 검색", autocomplete: "off" });
  const tray = el("div", { class: "tray", role: "group", "aria-label": "고른 감정" });
  const recentSlot = () => el("p", { class: "caption recent-slot", role: "presentation" }, el("b", { text: "최근 사용" }), " 저장 기능이 생기면 여기에 표시됩니다 ", el("span", { class: "proto-tag", text: "시안" }));
  const list = el("div", { class: "list", id: "emotionList", role: "listbox", "aria-multiselectable": "true", "aria-label": "선택한 카테고리의 세부 감정", tabindex: "-1" });
  const rail = el("div", { class: "rail", role: "group", "aria-label": "초성 바로가기" });
  const error = el("p", { class: "field-error", id: "emotionsError", hidden: true });
  let activeCode = null;

  const selected = (code) => state.draft.emotions.some((e) => e.code === code);
  const rowLabel = (e) => `${category(e.cat).label}, ${e.label}, ${selected(e.code) ? "선택됨" : "선택 안 됨"}`;
  const rows = () => [...list.querySelectorAll('[role="option"]')];

  function paintRow(row) {
    const e = data.byCode.get(row.dataset.code), isOn = selected(e.code);
    row.classList.toggle("on", isOn); row.setAttribute("aria-selected", String(isOn)); row.setAttribute("aria-label", rowLabel(e));
  }
  function setActive(row, focus) {
    rows().forEach((r) => r.setAttribute("tabindex", r === row ? "0" : "-1"));
    activeCode = row?.dataset.code ?? null;
    if (focus && row) row.focus();
  }

  function drawTray() {
    tray.replaceChildren(...state.draft.emotions.map((e) => el("button", { type: "button", class: "pill", "aria-label": `${category(e.cat).label}, ${e.label} 선택 해제`,
      style: { "--fill": `var(--${e.cat}-chip-fill)`, "--line": `var(--${e.cat}-chip-border)`, "--ink": `var(--${e.cat}-chip-text)`, "--c": `var(--${e.cat}-accent)` },
      onclick: () => { toggleEmotion(e); announce(`${e.label} 선택 해제됨`); search.focus(); } },
      el("i", { class: "dot", "aria-hidden": "true" }), e.label, el("b", { "aria-hidden": "true", text: "×" }))));
    if (!state.draft.emotions.length) tray.append(el("span", { class: "caption", text: "고른 감정이 여기에 쌓입니다" }));
  }

  function drawList() {
    const query = search.value.trim(), heads = [], nodes = [];
    const active = data.categories.filter((c) => state.draft.cats.includes(c.code));
    for (const c of active) {
      const shown = c.emotions.filter((e) => matches(e.label, query)).sort((a, b) => a.label.localeCompare(b.label, "ko"));
      if (!shown.length) continue;
      // 그룹 머리글은 계열 색 점 10px + 이름이다(DESIGN_SYSTEM §6.3). 캐릭터는 여기에 쓰지 않는다.
      nodes.push(el("div", { class: "cathead", role: "presentation", style: { "--c": `var(--${c.code}-accent)` } },
        el("i", { class: "catdot", "aria-hidden": "true" }), el("span", { text: c.label }), el("span", { class: "caption", text: `${shown.length}개` })));
      let current = "";
      for (const e of shown) {
        const h = headOf(e.label);
        if (h !== current) { current = h; heads.push(h); nodes.push(el("div", { class: "ghead", role: "presentation", "data-head": h, text: h })); }
        const row = el("div", { class: "row", role: "option", tabindex: "-1", "data-code": e.code,
          style: { "--row-bg": `var(--${c.code}-50)`, "--row-border": `var(--${c.code}-300)`, "--row-accent": `var(--${c.code}-accent)` } },
          el("span", { text: e.label }), el("span", { class: "ck", "aria-hidden": "true", text: "✓" }));
        paintRow(row); nodes.push(row);
      }
    }
    // 최근 사용 묶음의 자리(UX_SPEC §4: 목록 맨 위). 저장이 없는 시안이라 자리만 둔다.
    if (nodes.length) nodes.unshift(recentSlot());
    if (!active.length) nodes.push(el("p", { class: "note list-empty", text: "먼저 감정 계열을 골라 주세요. 계열을 고르면 그 안의 세부 감정이 여기에 나옵니다." }));
    else if (nodes.length < 2) nodes.push(el("p", { class: "note list-empty", text: "일치하는 감정이 없습니다." }));
    list.replaceChildren(...nodes);
    const all = rows();
    setActive(all.find((r) => r.dataset.code === activeCode) ?? all[0] ?? null, false);
    rail.replaceChildren(...[...new Set(heads)].map((h) => el("button", { type: "button", "aria-label": `${h} 그룹으로 이동`, text: h,
      onclick: () => list.querySelector(`[data-head="${h}"]`)?.scrollIntoView({ block: "start", behavior: reducedMotion() ? "auto" : "smooth" }) })));
  }

  function toggleRow(row) {
    const e = data.byCode.get(row.dataset.code), isOn = toggleEmotion(e);
    announce(`${e.label} ${isOn ? "선택됨" : "선택 해제됨"}, 총 ${state.draft.emotions.length}개 선택`);
  }
  list.addEventListener("click", (ev) => { const row = ev.target.closest('[role="option"]'); if (row) { setActive(row, true); toggleRow(row); } });
  list.addEventListener("keydown", (ev) => {
    const all = rows(), i = all.indexOf(document.activeElement);
    if (i < 0) return;
    const go = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: all.length - 1 }[ev.key];
    if (go != null) { ev.preventDefault(); setActive(all[Math.min(all.length - 1, Math.max(0, go))], true); }
    else if (ev.key === " " || ev.key === "Enter") { ev.preventDefault(); toggleRow(all[i]); }
  });
  search.addEventListener("input", drawList);

  on("emotions", () => { rows().forEach(paintRow); drawTray(); if (state.draft.emotions.length) error.hidden = true; });
  on("cats", () => { drawList(); drawTray(); });
  drawList(); drawTray();

  return el("div", { class: "pick" }, search, tray, error,
    el("p", { class: "caption sr-hint", id: "listHint", text: "목록 안에서는 위·아래 화살표로 이동하고 Space로 고릅니다." }),
    el("div", { class: "listwrap" }, list, rail));
}
