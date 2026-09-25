// 진입 화면: 온보딩(D-061·UX_SPEC §3)과 도움이 필요할 때(위기 안내). 둘 다 하단 탐색이 없는 풀스크린이다.
// 위기 안내는 친구·감정 색·움직임이 없고, 연락처는 검수 전이라 번호를 적지 않는다. 제목 '지금 안전이 먼저예요'는 두지 않는다(D-065).
import { el, svgEl } from "../dom.js";
import { renderLand, WELCOME } from "../components/land.js";

const backBtn = (navigate, to) => el("button", { type: "button", class: "back", "aria-label": "이전 화면", onclick: () => navigate(to) },
  svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d: "M14.5 5.5 8 12l6.5 6.5" })));
const icon = (d) => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "ico" }, svgEl("path", { d }));
const POINTS = [
  ["M4 20l4.2-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20zM13.5 7.5l3 3", "내가 고른 표현을 적는 곳이에요", "감정을 진단하거나 치료하지 않아요. 의료·심리 치료 기록은 적지 말아 주세요."],
  ["M5 11h14v9H5zM8 11V8a4 4 0 0 1 8 0v3", "직접 쓴 일기는 그대로예요", "자동으로 분석하거나 감시하지 않아요."],
  ["M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z", "많이 힘든 순간에는", "도움받을 수 있는 곳을 언제든 볼 수 있어요."]
];

// 온보딩 ①(목적)과 ②(안전·개인정보)를 한 경로에서 두 쪽으로 보여 준다. ?p=2로 두 번째 쪽을 바로 본다.
export function renderWelcome(main, navigate, params) {
  const page = params.get("p") === "2" ? 2 : 1;
  const go = (p) => { location.hash = p === 2 ? "#/welcome?p=2" : "#/welcome"; };
  if (page === 1) {
    main.replaceChildren(el("div", { class: "screen welcome" },
      // 안내 문구는 언덕 위가 아니라 흰 바탕(머리)에 둔다 — 색 언덕 위에서는 옅은 글자의 대비가 모자란다.
      el("div", { class: "welcome-head" }, el("h1", { class: "hero", tabindex: "-1", text: "잘 설명하지 못해도 괜찮아요" }), el("p", { class: "lede", text: "오늘의 마음을, 처음 이름 붙이듯 적어 보세요." }),
        el("p", { class: "caption", text: "진단하거나 치료하는 앱이 아니에요." })),
      el("div", { class: "welcome-land" }, renderLand(WELCOME)),
      el("div", { class: "welcome-foot" }, el("button", { type: "button", class: "btn big primary", text: "다음", onclick: () => go(2) }))));
    return;
  }
  main.replaceChildren(el("div", { class: "screen welcome page2" },
    el("div", { class: "info-top" }, el("button", { type: "button", class: "back", "aria-label": "첫 쪽으로", onclick: () => go(1) }, svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d: "M14.5 5.5 8 12l6.5 6.5" }))), el("span", { class: "step-count", text: "2 / 2" })),
    el("h1", { tabindex: "-1", text: "이 앱은 이런 곳이에요" }),
    el("ul", { class: "points" }, POINTS.map(([d, title, text], k) => el("li", {}, el("span", { class: "icb" }, icon(d)), el("div", {}, el("b", { text: title }), el("p", { text }),
      k === 2 ? el("a", { class: "link", href: "#/help", text: "도움이 필요할 때 보기" }) : null)))),
    el("div", { class: "welcome-foot" }, el("button", { type: "button", class: "btn big primary", text: "시작하기", onclick: () => navigate("today") }))));
}

export function renderHelp(main, navigate) {
  main.replaceChildren(el("div", { class: "screen help" },
    el("div", { class: "info-top" }, backBtn(navigate, "settings")),
    el("h1", { tabindex: "-1", text: "혼자 견디지 않아도 돼요" }),
    el("p", { class: "lede", text: "아래에서 지금 바로 도움을 받을 수 있어요." }),
    el("section", { class: "help-box", "aria-labelledby": "helpTitle" }, el("h2", { id: "helpTitle", text: "도움받을 수 있는 곳" }),
      el("p", { text: "연락처는 검수 후 채워져요. 확인되지 않은 번호는 적지 않았어요." }),
      el("p", { class: "placeholder-box", text: "여기에 검수를 마친 연락처가 들어가요." })),
    el("p", { class: "caption", text: "이 앱은 진단이나 위기 대응 서비스가 아니에요." }),
    el("div", { class: "welcome-foot" }, el("button", { type: "button", class: "btn big primary", text: "돌아가기", onclick: () => navigate("settings") }))));
}
