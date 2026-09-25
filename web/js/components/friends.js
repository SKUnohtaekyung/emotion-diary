// 감정 계열 고르기(D-061): 친구 아홉을 한 화면에, 상자·타일 없이 그대로 세운다. 여러 개를 고를 수 있다(복수 선택).
// 선택은 이름이 ink 알약으로 채워지고 체크가 붙고 친구가 살짝 커진다. 접근성은 토글 버튼 그룹(aria-pressed)이다.
// 친구 그림 사용처와 alt 규칙은 DESIGN_SYSTEM §8.1: 옆에 이름 글자가 있으므로 그림은 장식(alt="")이다.
import { el, announce } from "../dom.js";
import { data, FRIENDS, friendImg } from "../data.js";
import { state, toggleCategory } from "../state.js";

// 위아래로 살짝 어긋나 서 있게 하는 자리(장식). 모두 같은 크기이고 순서는 taxonomy 선언 순서 그대로다(심리 축으로 정렬하지 않는다).
const JITTER = [0, 14, 4, 10, 0, 12, 6, 14, 2];
const TILT = [-2, 1.5, -1, 2, -2, 1, -1.5, 2, -2];

export function renderFriendGrid() {
  const grid = el("div", { class: "friend-grid", role: "group", "aria-label": "오늘 머문 마음, 여러 개 선택" });
  data.categories.forEach((c, i) => {
    const btn = el("button", { type: "button", class: "fr", "aria-pressed": String(state.draft.cats.includes(c.code)), "data-cat": c.code, style: { "--jit": `${JITTER[i]}px`, "--tilt": `${TILT[i]}deg` }, "aria-label": `${FRIENDS[c.code].name}, ${c.label}` },
      el("span", { class: "fr-pic" }, friendImg(c.code, { size: 106, label: false }), el("i", { class: "fr-ck", "aria-hidden": "true", text: "✓" })),
      el("b", { class: "fr-nm", text: FRIENDS[c.code].name }), el("small", { text: c.label }));
    btn.addEventListener("click", () => {
      const on = toggleCategory(c.code);
      btn.setAttribute("aria-pressed", String(on));
      announce(`${FRIENDS[c.code].name}, ${c.label} ${on ? "선택됨" : "선택 해제됨"}, 지금 ${state.draft.cats.length}개 선택`);
      document.getElementById("catsError")?.setAttribute("hidden", "");
    });
    grid.append(btn);
  });
  return grid;
}
