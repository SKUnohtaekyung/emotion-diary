// 화면 시안의 시작점. 값(tokens)·감정 목록·캐릭터 설명을 정본에서 읽은 뒤 화면을 그린다.
// 화면 전환은 주소의 # 뒤(#/today 등)로 한다 — 브라우저의 뒤로 가기가 그대로 동작하고, 앱의 화면 스택 방식은 정하지 않는다.
import { applyTokens } from "./tokens.js";
import { loadData } from "./data.js";
import { clearListeners } from "./state.js";
import { renderToday, renderCalendar, renderStats, renderSettings } from "./views/tabs.js";
import { renderWrite } from "./views/write.js";

const main = document.getElementById("main");
const ROUTES = { today: renderToday, calendar: renderCalendar, stats: renderStats, settings: renderSettings, write: renderWrite };
const navigate = (route) => { if (location.hash === `#/${route}`) render(); else location.hash = `#/${route}`; };

function render() {
  const route = location.hash.replace(/^#\//, "");
  const name = ROUTES[route] ? route : "today";
  clearListeners();
  ROUTES[name](main, navigate);
  // 작성 화면은 "오늘"에서 들어가므로 하단 탐색의 현재 칸은 오늘이다.
  const tab = name === "write" ? "today" : name;
  for (const a of document.querySelectorAll(".bottom-nav a")) {
    if (a.dataset.tab === tab) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  }
  document.title = `${main.querySelector("h1")?.textContent ?? "감정일기"} — 감정일기 화면 시안`;
  window.scrollTo(0, 0);
  if (render.started) main.querySelector("h1")?.focus({ preventScroll: true });
  render.started = true;
}

try {
  await Promise.all([applyTokens(), loadData()]);
  document.documentElement.classList.add("ready");
  window.addEventListener("hashchange", render);
  render();
} catch (error) {
  document.documentElement.classList.add("ready");
  main.textContent = "값 파일을 읽지 못했습니다. 이 시안은 미리보기 서버(node scripts/web-preview.mjs)로 열어야 합니다.";
  console.error(error);
}
