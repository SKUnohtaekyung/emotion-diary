// 화면 시안의 시작점. 값(tokens)과 감정 목록을 정본에서 읽은 뒤 화면을 그린다.
// 화면 전환은 주소의 # 뒤(#/today 등)로 한다 — 브라우저의 뒤로 가기가 그대로 동작하고, 앱의 화면 스택 방식은 정하지 않는다.
// 주소 뒤에 ?를 붙이면 화면의 상태를 강제로 볼 수 있다(QA용): #/today?s=loading|draft|recorded|banner|ai
import { applyTokens } from "./tokens.js";
import { loadData, data } from "./data.js";
import { clearListeners } from "./state.js";
import { reducedMotion } from "./dom.js";
import { renderToday } from "./views/today.js";
import { renderCalendar, renderRecord } from "./views/tabs.js";
import { renderSettings, SETTINGS_PAGES } from "./views/settings.js";
import { renderStats } from "./views/stats.js";
import { renderWrite } from "./views/write.js";
import { renderHelp } from "./views/entry.js";
import { renderWelcome } from "./views/welcome.js";
import { finishSplash, dropSplash } from "./splash.js";

const main = document.getElementById("main");
const navRail = document.querySelector(".bottom-nav-rail");
// fullscreen: 하단 탐색 없이 뒤로 가기가 있는 화면(작성 흐름·기록 상세·안내). 함수면 하위 경로로 정한다 — 통계의 친구 상세·설정의 하위 화면(D-091). scene: 어두운 숲 위에서 탐색이 유리가 된다(D-062).
const ROUTES = {
  today: { view: renderToday, tab: "today", scene: "forest" },
  calendar: { view: renderCalendar, tab: "calendar" },
  // 아는 하위 경로만 전체 화면이다 — 모르는 값(#/stats/foo, #/settings/)은 각 화면이 목록으로 그리므로 탐색을 남겨야 갇히지 않는다.
  stats: { view: renderStats, tab: "stats", fullscreen: (rest) => data.categories.some((c) => c.code === rest[0]) },
  settings: { view: renderSettings, tab: "settings", fullscreen: (rest) => SETTINGS_PAGES.includes(rest[0]) },
  write: { view: renderWrite, tab: "today", fullscreen: true },
  record: { view: renderRecord, tab: "calendar", fullscreen: true },
  welcome: { view: renderWelcome, tab: "today", fullscreen: true },
  help: { view: renderHelp, tab: "settings", fullscreen: true }
};
const navigate = (route) => { if (location.hash === `#/${route}`) render(); else location.hash = `#/${route}`; };

function render() {
  const [path, query = ""] = location.hash.replace(/^#\//, "").split("?");
  const [name0, ...rest] = path.split("/");
  const name = ROUTES[name0] ? name0 : "today";
  const route = ROUTES[name];
  clearListeners();
  document.querySelector(".fly-stone")?.remove();
  const fullscreen = typeof route.fullscreen === "function" ? route.fullscreen(rest) : route.fullscreen;
  if (fullscreen) document.body.dataset.fullscreen = ""; else document.body.removeAttribute("data-fullscreen");
  if (route.scene) document.body.dataset.scene = route.scene; else document.body.removeAttribute("data-scene");
  route.view(main, navigate, new URLSearchParams(query), rest);
  const tab = route.tab;
  for (const a of document.querySelectorAll(".bottom-nav a")) {
    if (a.dataset.tab === tab) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  }
  const position = { today: "12.5%", calendar: "37.5%", stats: "62.5%", settings: "87.5%" }[tab];
  navRail.style.setProperty("--nav-position", position);
  if (render.currentTab && render.currentTab !== tab) {
    navRail.classList.remove("is-moving");
    void navRail.offsetWidth;
    navRail.classList.add("is-moving");
  }
  render.currentTab = tab;
  document.title = `${main.querySelector("h1")?.textContent ?? "감정일기"} — 감정일기 화면 시안`;
  window.scrollTo(0, 0);
  if (render.started) main.querySelector("h1")?.focus({ preventScroll: true });
  render.started = true;
}

// 위에 붙는 시안 띠의 높이. 세부 감정 화면의 친구 영역(sticky)과 오늘 화면의 높이가 이 띠 바로 아래에 맞는다. 글자 확대로 띠가 두 줄이 되어도 따라간다.
const banner = document.querySelector(".proto-banner");
new ResizeObserver(() => document.documentElement.style.setProperty("--banner-h", `${banner.offsetHeight}px`)).observe(banner);

// 작성 단계 사이 전환 연출(D-084, write.js 과제1): #/write?step= 사이 이동일 때만 화면을 갈아 그리는 순간을 View Transition으로 감싼다.
// 다른 화면 전환(오늘↔달력 등)은 지금처럼 그대로 render()만 부른다 — film.css가 이름 붙은 요소(film-title·film-scene)만 슬라이드+페이드한다.
document.documentElement.classList.toggle("film-vt", Boolean(document.startViewTransition)); // 미지원 브라우저의 CSS 대체 애니메이션을 film.css가 이 클래스로 가른다
const isWriteStep = (url) => /#\/write\?[^#]*\bstep=/.test(url);

try {
  await Promise.all([applyTokens(), loadData()]);
  document.documentElement.classList.add("ready");
  window.addEventListener("hashchange", (ev) => {
    if (document.startViewTransition && !reducedMotion() && isWriteStep(ev.oldURL) && isWriteStep(ev.newURL)) document.startViewTransition(render);
    else render();
  });
  render();
  const first = location.hash.replace(/^#\//, "").split(/[/?]/)[0];
  finishSplash(ROUTES[first] ? first : "today"); // 로딩 화면을 첫 화면에 맞춰 걷는다(D-092 ④)
} catch (error) {
  dropSplash(); // 로딩 화면이 오류 문구를 덮지 않게
  document.documentElement.classList.add("ready");
  main.textContent = "값 파일을 읽지 못했습니다. 이 시안은 미리보기 서버(node scripts/web-preview.mjs)로 열어야 합니다.";
  console.error(error);
}
