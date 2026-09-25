// 작은 DOM 도우미. 사용자가 입력한 글은 항상 textContent로 넣는다(innerHTML에 넣지 않는다).
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "style") for (const [name, v] of Object.entries(value)) node.style.setProperty(name, v);
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else if (key in node && !key.startsWith("aria") && key !== "role") node[key] = value;
    else node.setAttribute(key, value === true ? "" : value);
  }
  for (const child of children.flat()) if (child != null && child !== false) node.append(child);
  return node;
}

const SVG_NS = "http://www.w3.org/2000/svg";
export function svgEl(tag, attrs = {}, ...children) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) if (value != null) node.setAttribute(key, value);
  for (const child of children.flat()) if (child) node.append(child);
  return node;
}

export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export function announce(text) { const live = document.getElementById("live"); if (live) live.textContent = text; }

// 감정 테마(D-053·D-071): 계열이 하나일 때만 그 계열의 연한 면(100과 50의 혼합)이 node를 물들인다. cat이 null이면 물들이지 않는다.
// 색은 CSS 변수로만 올린다(--tint) — 계열 목록을 CSS에 적어 두지 않는다.
export function setTheme(node, cat) {
  if (!node) return;
  if (cat) {
    node.dataset.themeCat = cat;
    // 친구가 배경에 묻히지 않도록 배경은 그 계열의 몸 색(대체로 300 부근)보다 연하다(D-071): 100과 50을 6:4로 섞은 색. pill은 300을 흰색에 45% 섞어 배경보다 조금 진하게 둔다.
    node.style.setProperty("--tint", `color-mix(in srgb, var(--${cat}-100) 60%, var(--${cat}-50))`);
    node.style.setProperty("--tint-pill", `color-mix(in srgb, var(--${cat}-300) 45%, var(--bg))`);
  } else { delete node.dataset.themeCat; node.style.removeProperty("--tint"); node.style.removeProperty("--tint-pill"); }
}
export const soleCat = (cats) => { const set = new Set(cats); return set.size === 1 ? [...set][0] : null; };

// 불러오기 상태(D-083): 로딩 뼈대 · 불러오지 못함(다시 시도) · 연결 끊김. 화면마다 같은 모양과 같은 말을 쓴다. 어두운 숲 위에서는 tone: "dark".
const STATUS_TEXT = { error: ["불러오지 못했어요", "잠시 뒤 다시 시도해 주세요."], offline: ["연결이 끊겼어요", "연결되면 다시 불러올게요."] };
export function renderStatus({ kind = "error", onRetry, title, detail, tone = "light" } = {}) {
  if (kind === "loading") return el("div", { class: `status-block is-loading ${tone}`, role: "status" }, el("span", { class: "sr", text: "불러오는 중이에요" }), el("i"), el("i"), el("i"));
  const [t, d] = STATUS_TEXT[kind] ?? STATUS_TEXT.error;
  return el("div", { class: `status-block is-${kind} ${tone}`, role: kind === "error" ? "alert" : "status" },
    el("p", { class: "status-title", text: title ?? t }), el("p", { class: "status-detail", text: detail ?? d }),
    onRetry ? el("button", { type: "button", class: "btn secondary status-retry", text: "다시 시도", onclick: onRetry }) : null);
}

// 토스트(DESIGN_SYSTEM §6.11): 화면 위쪽에 4초 동안 한 줄. 되돌리기는 두지 않는다(삭제 뒤에도, UX_SPEC §7). 새 토스트가 오면 앞의 것을 바꾼다.
export function toast(text) {
  document.querySelector(".toast")?.remove();
  const node = el("div", { class: "toast", role: "status", text });
  document.body.append(node);
  setTimeout(() => node.remove(), 4000);
  return node;
}

// 아직 구현하지 않은 동작. 초점은 받되 누르면 시안임을 알린다.
export function protoButton(label, className = "btn secondary") {
  return el("button", { type: "button", class: className, "aria-disabled": "true", onclick: () => announce(`${label}: 시안이라 동작하지 않습니다`) },
    el("span", { text: label }), el("span", { class: "proto-tag", text: "시안" }));
}
