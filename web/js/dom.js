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

export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export function announce(text) { const live = document.getElementById("live"); if (live) live.textContent = text; }

// 아직 구현하지 않은 동작. 초점은 받되 누르면 시안임을 알린다.
export function protoButton(label, className = "btn secondary") {
  return el("button", { type: "button", class: className, "aria-disabled": "true", onclick: () => announce(`${label}: 시안이라 동작하지 않습니다`) },
    el("span", { text: label }), el("span", { class: "proto-tag", text: "시안" }));
}
