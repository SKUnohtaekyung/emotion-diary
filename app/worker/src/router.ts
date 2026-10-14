// 경로 표(ARCHITECTURE §11.9). 열쇠는 "METHOD /api/경로"이고 경로 조각 하나를 `:이름`으로 받을 수 있다
// (예: `PUT /api/diaries/:date`). 조각은 주소의 `/` 사이 한 칸이지만 URL 디코딩 뒤 값에는 어떤 글자든 올 수 있다
// (`%2F`면 `/`, `%00`도) — 모양 검사(날짜 형식 등)는 반드시 처리기가 한다.
// 같은 경로에 방식이 없으면 405, 경로 자체가 없으면 404다. 매개변수 경로는 정확한 경로보다 뒤에 맞춘다.
import type { Handler } from "./context";

interface CompiledRoute {
  key: string;
  method: string;
  pattern: RegExp;
  names: string[];
  handler: Handler;
  /** `:`가 없는 정확한 경로인가 — 같은 길이면 정확한 경로가 먼저다 */
  exact: boolean;
}

export type RouteMatch =
  | { kind: "matched"; key: string; handler: Handler; params: Record<string, string> }
  | { kind: "method_not_allowed" }
  | { kind: "not_found" };

const SEGMENT = /^[A-Za-z0-9._~-]+$/;
const PARAM = /^:([a-zA-Z][a-zA-Z0-9]*)$/;

function compile(key: string, handler: Handler): CompiledRoute {
  const space = key.indexOf(" ");
  const method = key.slice(0, space);
  const path = key.slice(space + 1);
  if (!/^[A-Z]+$/.test(method) || !path.startsWith("/api/")) throw new Error(`경로 열쇠 모양이 틀렸다: ${key}`);
  const names: string[] = [];
  const parts = path.split("/").map((part, index) => {
    if (index === 0) return "";
    const param = part.match(PARAM);
    if (param?.[1]) {
      names.push(param[1]);
      return "([^/]+)";
    }
    if (!SEGMENT.test(part)) throw new Error(`경로 조각 모양이 틀렸다: ${key}`);
    return part.replace(/[.]/g, "\\.");
  });
  return { key, method, pattern: new RegExp(`^${parts.join("/")}$`), names, handler, exact: names.length === 0 };
}

export function createRouter(entries: Iterable<[string, Handler]>) {
  const routes = [...entries].map(([key, handler]) => compile(key, handler)).sort((a, b) => Number(b.exact) - Number(a.exact));
  return {
    match(method: string, path: string): RouteMatch {
      let pathKnown = false;
      for (const route of routes) {
        const found = path.match(route.pattern);
        if (!found) continue;
        pathKnown = true;
        if (route.method !== method) continue;
        const params: Record<string, string> = {};
        try {
          route.names.forEach((name, index) => {
            params[name] = decodeURIComponent(found[index + 1] ?? "");
          });
        } catch {
          return { kind: "not_found" }; // 잘못된 % 인코딩
        }
        return { kind: "matched", key: route.key, handler: route.handler, params };
      }
      return pathKnown ? { kind: "method_not_allowed" } : { kind: "not_found" };
    }
  };
}
