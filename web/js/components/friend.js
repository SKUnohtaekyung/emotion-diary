// 친구 그림 부품(D-051·D-061). 쓰는 자리는 DESIGN_SYSTEM §8.1 — 마음 고르기·세부 감정·크기·이유(하단)·완료·통계·달력 요약·빈 상태·온보딩. 오늘 숲·위기 안내에는 나오지 않는다.
import { el } from "../dom.js";
import { category, friendImg, FRIENDS } from "../data.js";

// 친구 그림을 감싸는 자리(friend-spot). 친구 뒤에 면·상자·흰 테두리를 깔지 않는다(D-061) — 배경을 연하게 두어 친구가 보이게 한다(D-071).
// breathe=true면 2~3% 안쪽의 느린 호흡을 준다(움직임 줄이기에서는 꺼진다).
export function friendSpot(cat, { size, label = false, breathe = false, index = 0 } = {}) {
  const img = friendImg(cat, { size, label });
  if (breathe) { img.classList.add("breathe"); img.style.setProperty("--i", index); }
  return el("span", { class: "friend-spot" }, img);
}

// 계열 표식: 친구 + 이름 글자 + 계열 이름(+ meta 글자). 64px 미만에서는 친구를 이름 글자 없이 쓰지 않는다(§8.1).
export function catMark(cat, { size = 64, meta = null } = {}) {
  return el("div", { class: "cat-mark" }, friendSpot(cat, { size }),
    el("span", { class: "cat-mark-name" }, el("strong", { text: FRIENDS[cat].name }), el("span", { text: category(cat).label }), meta ? el("span", { class: "cat-mark-meta", text: meta }) : null));
}
