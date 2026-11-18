// 하단 탐색(DESIGN_SYSTEM §6.11, D-049·D-070·D-076·D-091 ③): ink 알약 안에서 민트 방울 하나가 현재 칸으로 옮겨 간다.
// 밝은 목록 화면(달력·통계·설정)에만 보인다 — 오늘(숲)·작성 흐름·편지·하위 화면(친구 상세·설정 하위)에는 없다.
// 마크업은 index.html에 있고(스크립트보다 먼저, CSP 안), 여기서는 보일지·현재 칸·방울 자리만 바꾼다(값은 CSSOM으로).
// 탐색은 #app 밖, 그 아래에 붙는다 — 스크롤은 #app만 한다(D-125). 그래서 내용 위에 떠서 가리지 않는다.

export type NavTab = "today" | "calendar" | "stats" | "settings";

/** 화면 이름 → 하단 탐색을 보일 때의 현재 칸. 없으면 탐색을 숨긴다. */
export function navTabFor(routeName: string): NavTab | null {
  if (routeName === "calendar") return "calendar";
  if (routeName === "stats") return "stats";
  if (routeName === "settings") return "settings";
  return null;
}

const POSITION: Record<NavTab, string> = { today: "12.5%", calendar: "37.5%", stats: "62.5%", settings: "87.5%" };
let currentTab: NavTab | null = null;

export function syncBottomNav(routeName: string): void {
  const nav = document.getElementById("bottom-nav");
  const rail = nav?.querySelector<HTMLElement>(".bottom-nav-rail");
  if (!nav || !rail) return;
  const tab = navTabFor(routeName);
  nav.hidden = tab === null;
  if (tab === null) {
    currentTab = null;
    return;
  }
  for (const link of nav.querySelectorAll<HTMLAnchorElement>("a[data-tab]")) {
    if (link.dataset.tab === tab) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  rail.style.setProperty("--nav-position", POSITION[tab]);
  // 칸을 옮길 때만 도착 통통(움직임 줄이기에서는 CSS가 끈다)
  if (currentTab && currentTab !== tab) {
    rail.classList.remove("is-moving");
    void rail.offsetWidth;
    rail.classList.add("is-moving");
  }
  currentTab = tab;
}

export function resetBottomNavForTest(): void {
  currentTab = null;
}
