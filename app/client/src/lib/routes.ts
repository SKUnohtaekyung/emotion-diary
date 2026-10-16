// 화면 주소(T3 A-4)와 들어갈 수 있는지의 판단. 주소는 해시 `#/…`이고 DOM과 떼어 두어 시험한다.
// 로그인 전에는 어떤 주소로 와도 열쇠 화면만 연다(UX_SPEC §17).
// 값이 든 화면(ARCHITECTURE §11.9)은 `이름/:date` 모양이다 — 작성 흐름·기록 보기·완료(TASK-SLICE-01 PLAN A-9).

import { isIsoDate } from "../../../shared/diary";

export const ROUTES = ["auth", "auth/name", "welcome", "today", "settings/lock", "settings/pin"] as const;
export type RouteName = (typeof ROUTES)[number];

/** 날짜 값을 받는 화면. 화면 표의 이름은 `write/:date`처럼 적는다. */
export const DATE_ROUTES = ["write", "record", "done"] as const;
export type DateRouteName = `${(typeof DATE_ROUTES)[number]}/:date`;

/** 로그인이 끝난 뒤 돌아가도 되는 화면. 열쇠·이름·반가워요는 지나가면 사라지는 화면이라 뺀다. */
const RETURNABLE: readonly string[] = ["today", "settings/lock", "settings/pin"];

export interface ParsedRoute {
  /** 화면 주소(query 없음, 값 포함 — 예: write/2026-10-16). 비었거나 모르는 이름이면 known이 거짓 */
  path: string;
  /** 화면 표의 이름(값 자리는 `:date` — 예: write/:date). 정확한 이름이면 path와 같다 */
  name: string;
  /** 값 조각. 날짜 화면이면 date */
  params: { date?: string };
  query: URLSearchParams;
  known: boolean;
}

/** `write/2026-10-16` → 이름과 날짜. 날짜 모양이 달력 날짜가 아니면 null. */
function matchDateRoute(path: string): { name: DateRouteName; date: string } | null {
  const [head, value, ...rest] = path.split("/");
  if (rest.length || !value || !(DATE_ROUTES as readonly string[]).includes(head ?? "")) return null;
  return isIsoDate(value) ? { name: `${head}/:date` as DateRouteName, date: value } : null;
}

export function parseHash(hash: string): ParsedRoute {
  const body = hash.replace(/^#/, "").replace(/^\//, "");
  const cut = body.indexOf("?");
  const path = (cut === -1 ? body : body.slice(0, cut)).replace(/\/+$/, "");
  const query = new URLSearchParams(cut === -1 ? "" : body.slice(cut + 1));
  const dated = matchDateRoute(path);
  if (dated) return { path, name: dated.name, params: { date: dated.date }, query, known: true };
  return { path, name: path, params: {}, query, known: (ROUTES as readonly string[]).includes(path) };
}

export function isReturnable(path: string | null | undefined): path is string {
  return typeof path === "string" && (RETURNABLE.includes(path) || matchDateRoute(path) !== null);
}

export interface GuardState {
  authenticated: boolean;
  hasName: boolean;
  /** 비밀번호를 잊어 다시 들어오는 중 — 열쇠 화면의 변형을 잃지 않는다 */
  forgotPin: boolean;
}

export interface GuardResult {
  redirect: string | null;
  /** 로그인이 끝난 뒤 돌아갈 화면 이름(두어야 할 때만) */
  returnTo: string | null;
}

const STAY: GuardResult = { redirect: null, returnTo: null };

export function guardRoute(state: GuardState, route: ParsedRoute): GuardResult {
  if (!state.authenticated) {
    if (route.path === "auth") return STAY;
    if (state.forgotPin) return { redirect: "#/auth?s=pin", returnTo: null };
    if (isReturnable(route.path)) return { redirect: "#/auth?s=again", returnTo: route.path };
    return { redirect: "#/auth", returnTo: null };
  }
  if (route.path === "auth") return { redirect: state.hasName ? "#/today" : "#/auth/name", returnTo: null };
  if (!state.hasName) {
    return route.path === "auth/name" ? STAY : { redirect: "#/auth/name", returnTo: null };
  }
  if (route.path === "auth/name" || !route.known) return { redirect: "#/today", returnTo: null };
  return STAY;
}

/** 열쇠를 넣어 들어온 뒤 갈 곳(UX_SPEC §16): 비밀번호를 잊어 왔으면 새 비밀번호, 이름이 없으면 이름, 돌아갈 곳, 오늘 순서. */
export function loginDestination(input: { variant: string | null; hasName: boolean; returnTo: string | null }): string {
  if (input.variant === "pin") return "#/settings/pin?from=forgot";
  if (!input.hasName) return "#/auth/name";
  if (isReturnable(input.returnTo)) return `#/${input.returnTo}`;
  return "#/today";
}
