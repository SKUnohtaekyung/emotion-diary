// 화면 이동(T3 A-4). 주소는 해시 `#/…`이고 기록은 history.pushState/replaceState로 직접 다룬다(UX_SPEC §17).
// - 화면 사이 이동은 push, 같은 화면 안에서 바꾸기는 replace.
// - 열쇠 화면·이름·반가워요는 지나가면 replace로 사라진다 — 들어온 뒤 뒤로 밀어도 열쇠 화면으로 돌아가지 않는다.
// - 로그인 전에는 어떤 주소로 와도 열쇠 화면만 연다(guardRoute).
// - 잠금 층이 떠 있는 동안에는 그리지 않는다. 풀리면 controller가 render()를 다시 부른다.

import { type ParsedRoute, guardRoute, parseHash } from "./lib/routes";
import { KEYS, readStored, writeStored } from "./lib/storage";
import { routeNameOf } from "./lib/errorInfo";
import { app } from "./state";
import { isCrashed } from "./ui/crash";
import { consumeSheetPop } from "./ui/sheet";

export interface ViewContext {
  root: HTMLElement;
  route: ParsedRoute;
  /** 이 그리기가 아직 현재 화면인가. 늦게 온 답이 지나간 화면에 그려지지 않게 한다. */
  alive: () => boolean;
}

/** 화면을 그리고, 떠날 때 부를 정리 함수(타이머·리스너 해제)를 돌려준다. 정리할 것이 없으면 아무것도 안 하는 함수. */
export type View = (context: ViewContext) => () => void;

const views = new Map<string, View>();
let cleanup: (() => void) | null = null;
let token = 0;
let afterPop: string | null = null;
let started = false;

function onPopState(): void {
  if (consumeSheetPop()) return;
  if (afterPop) {
    const target = afterPop;
    afterPop = null;
    history.replaceState(history.state, "", target);
  }
  render();
}

export function registerViews(map: Record<string, View>): void {
  for (const [name, view] of Object.entries(map)) views.set(name, view);
}

/** 이 기록 칸을 앱 안에서 push로 쌓았나. 그렇다면 history.back()이 앱 안에 머문다. */
function isPushed(): boolean {
  const state = history.state as { pushed?: boolean } | null;
  return state?.pushed === true;
}

export function currentRouteName(): string {
  return routeNameOf(location.hash);
}

export function currentRoute(): ParsedRoute {
  return parseHash(location.hash);
}

/** h1을 읽어 문서 제목을 맞춘다. 이름처럼 늦게 채워지는 제목을 고칠 때도 부른다. */
export function syncTitle(): void {
  const heading = document.querySelector("#app h1");
  document.title = heading?.textContent ? `${heading.textContent} — 감정일기` : "감정일기";
}

export function render(): void {
  if (isCrashed()) return;
  const root = document.getElementById("app");
  if (!root) return;

  let route = parseHash(location.hash);
  for (let pass = 0; pass < 4; pass += 1) {
    const guard = guardRoute(
      {
        authenticated: app.authenticated,
        hasName: app.hasName,
        forgotPin: readStored("session", KEYS.forgotPin) === "1"
      },
      route
    );
    if (!guard.redirect) break;
    if (guard.returnTo) writeStored("session", KEYS.returnTo, guard.returnTo);
    history.replaceState(history.state, "", guard.redirect);
    route = parseHash(location.hash);
  }
  // 잠금 층 아래에는 기록 내용을 그리지 않는다
  if (app.locked) return;

  cleanup?.();
  cleanup = null;
  token += 1;
  const mine = token;
  root.replaceChildren();
  root.removeAttribute("aria-busy");
  root.setAttribute("data-route", route.path);

  const view = views.get(route.path);
  if (!view) return;
  try {
    cleanup = view({ root, route, alive: () => mine === token });
  } catch (error) {
    // 그리다 난 예외는 위치(파일·줄·칸)를 얻도록 전역 처리기로 넘긴다
    window.setTimeout(() => {
      throw error;
    });
    return;
  }

  const heading = root.querySelector("h1");
  heading?.setAttribute("tabindex", "-1");
  syncTitle();
  window.scrollTo(0, 0);
  heading?.focus({ preventScroll: true });
}

/** 화면 이름이나 해시로 간다. replace면 기록을 더하지 않고 지금 칸을 바꾼다. */
export function navigate(hash: string, options: { replace?: boolean } = {}): void {
  const target = hash.startsWith("#") ? hash : `#/${hash}`;
  if (options.replace || target === location.hash) {
    history.replaceState(history.state, "", target);
  } else {
    history.pushState({ pushed: true }, "", target);
  }
  render();
}

/** 화면 안의 뒤로 가기(‹). 밀어서 뒤로 가는 것과 같은 결과다. 앱 안에서 쌓은 칸이 아니면 fallback으로 바꿔친다. */
export function back(fallback: string): void {
  if (isPushed()) history.back();
  else navigate(fallback, { replace: true });
}

/**
 * 뒤로 갔다가 도착한 칸을 target으로 바꿔친다. 지나가면 사라져야 하는 화면(반가워요)을 기록에서 지울 때 쓴다 —
 * 중간 화면을 그리지 않고 도착한 칸만 바꿔 한 번 그린다.
 */
export function backThenReplace(target: string): void {
  if (isPushed()) {
    afterPop = target;
    history.back();
  } else {
    navigate(target, { replace: true });
  }
}

export function startRouter(): void {
  if (started) return;
  started = true;
  // 새로 열렸는데 기록 칸에 시트 표시가 남아 있으면 지운다(시트는 사라졌다)
  const state = history.state as { sheet?: string } | null;
  if (state?.sheet) history.replaceState(null, "", location.href);
  window.addEventListener("popstate", onPopState);
}

/** 시험에서 상태를 되돌린다. */
export function resetRouterForTest(): void {
  cleanup?.();
  cleanup = null;
  token = 0;
  afterPop = null;
  started = false;
  window.removeEventListener("popstate", onPopState);
  views.clear();
}
