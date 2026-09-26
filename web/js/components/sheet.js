// 아래에서 올라오는 시트(DESIGN_SYSTEM §6.11). 뒤 화면을 어둡게 하고 초점을 시트 안에 가둔다. Esc·바깥을 누르면 닫힌다(위험 동작의 확인은 바깥을 눌러도 아무것도 하지 않고 닫기만 한다).
// 시트는 한 번에 하나다(D-099 sheet G1): 열려 있는 시트가 있으면 먼저 닫고 연다. 이때 초점은 새 시트로 가고, 새 시트를 닫으면 처음 시트를 연 자리로 돌아간다.
import { el } from "../dom.js";

let current = null; // 지금 열려 있는 시트의 { close, opener }

export function openSheet({ title, body = [], primary, secondary, danger = false, onClose }) {
  let opener = document.activeElement;
  if (current) { const prev = current; if (prev.sheet.contains(opener)) opener = prev.opener; prev.close({ restoreFocus: false }); }
  let closed = false;
  const close = ({ restoreFocus = true } = {}) => {
    if (closed) return; closed = true;
    dim.remove(); document.body.style.removeProperty("overflow"); document.removeEventListener("keydown", onKey);
    if (current?.close === close) current = null;
    if (restoreFocus && opener?.isConnected) opener.focus(); onClose?.();
  };
  const act = (spec) => () => { close(); spec.onclick?.(); };
  const buttons = el("div", { class: "btns" },
    primary ? el("button", { type: "button", class: `btn big ${danger ? "danger" : "primary"}`, text: primary.text, onclick: act(primary) }) : null,
    secondary ? el("button", { type: "button", class: "btn big text", text: secondary.text, onclick: act(secondary) }) : null);
  const sheet = el("div", { class: "sheet", role: "dialog", "aria-modal": "true", "aria-labelledby": "sheetTitle" },
    el("i", { class: "sheet-grab", "aria-hidden": "true" }), el("h2", { id: "sheetTitle", text: title }), ...[body].flat(), buttons);
  const dim = el("div", { class: "sheet-dim", onclick: (ev) => { if (ev.target === dim) close(); } }, sheet);
  const focusables = () => [...sheet.querySelectorAll("button,[href],input,textarea,[tabindex]:not([tabindex='-1'])")];
  const onKey = (ev) => {
    if (ev.key === "Escape") { ev.preventDefault(); close(); return; }
    if (ev.key !== "Tab") return;
    const f = focusables(); if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
    else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
  };
  document.addEventListener("keydown", onKey);
  document.body.style.overflow = "hidden";
  document.body.append(dim);
  (focusables()[0] ?? sheet).focus();
  current = { close, opener, sheet };
  return { close, sheet };
}
