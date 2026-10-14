// /api/* 의 입구(ARCHITECTURE §2.1·§5·§6). 순서: 비밀값 확인 → 로그인 없이 되는 둘(GET·POST /api/session) →
// 로그인 확인(없으면 401 — 없는 경로도 로그인 전에는 401) → CSRF(변경 요청, 403) → 잠김 판정(잠긴 세션은 넷 말고 423) → 경로(없으면 404).
import { API, SESSION_COOKIE } from "../../shared/api";
import { type AppConfig, type Bindings, type Ctx, type Handler, parseAllowlist, readSecrets } from "./context";
import { fail, withCookie } from "./http";
import { csrfOk } from "./request";
import { clearAppLock, lockNow, setAppLock, unlock } from "./routes/appLock";
import { getProfile, putProfile } from "./routes/profile";
import { createRouter } from "./router";
import { heartbeat, login, logout, sessionInfo } from "./routes/session";
import { clearSessionCookie, loadSession, readCookie, touchSession } from "./session";

const ROUTES = new Map<string, Handler>([
  [`DELETE ${API.session}`, logout],
  [`POST ${API.heartbeat}`, heartbeat],
  [`PUT ${API.appLock}`, setAppLock],
  [`DELETE ${API.appLock}`, clearAppLock],
  [`POST ${API.unlock}`, unlock],
  [`POST ${API.lock}`, lockNow],
  [`GET ${API.profile}`, getProfile],
  [`PUT ${API.profile}`, putProfile]
]);

/** 잠긴 세션이 부를 수 있는 넷(ARCHITECTURE §6). POST /api/session(다시 로그인)은 로그인 확인 전에 처리된다. */
const ALLOWED_WHEN_LOCKED = new Set([`GET ${API.session}`, `POST ${API.unlock}`, `DELETE ${API.session}`]);

const SAFE_METHODS = new Set(["GET", "HEAD"]);

export function createApp(config: AppConfig) {
  // GET·POST /api/session은 로그인 확인 전에 따로 처리하지만, 같은 경로의 다른 방식이 405가 되도록 표에도 넣는다.
  const router = createRouter([
    ...ROUTES,
    ...(config.devRoutes ?? []),
    [`GET ${API.session}`, sessionInfo],
    [`POST ${API.session}`, login]
  ]);

  async function handleApi(request: Request, url: URL, env: Bindings): Promise<Response> {
    const secrets = readSecrets(env);
    if (!secrets) return fail(500, "server_misconfigured");
    const ctx: Ctx = {
      request,
      url,
      env,
      secrets,
      config,
      now: config.now?.() ?? Date.now(),
      allowlist: parseAllowlist(env.OWNER_ALLOWLIST),
      session: null,
      setCookie: null,
      params: {}
    };
    const key = `${request.method} ${url.pathname}`;
    const hadCookie = readCookie(request, SESSION_COOKIE) !== null;

    if (key === `POST ${API.session}`) {
      if (!csrfOk(request, url)) return fail(403, "csrf");
      return login(ctx);
    }

    ctx.session = await loadSession(ctx);
    if (key === `GET ${API.session}`) {
      if (ctx.session) await touchSession(ctx, ctx.session);
      else if (hadCookie) ctx.setCookie = clearSessionCookie(); // 쓸 수 없는 cookie는 지운다
      return withCookie(await sessionInfo(ctx), ctx.setCookie);
    }

    if (!ctx.session) return fail(401, "unauthorized", {}, hadCookie ? { "set-cookie": clearSessionCookie() } : {});
    if (!SAFE_METHODS.has(request.method) && !csrfOk(request, url)) return fail(403, "csrf");
    await touchSession(ctx, ctx.session);
    const found = router.match(request.method, url.pathname);
    // 잠김 판정은 경로를 찾기 전 단계의 규칙이다 — 허용 넷이 아니면 없는 경로도 423(무엇이 있는지 알려 주지 않는다).
    const allowed = found.kind === "matched" && ALLOWED_WHEN_LOCKED.has(found.key);
    if (ctx.session.locked && !allowed) return withCookie(fail(423, "app_locked"), ctx.setCookie);
    if (found.kind !== "matched") {
      const response = found.kind === "method_not_allowed" ? fail(405, "method_not_allowed") : fail(404, "not_found");
      return withCookie(response, ctx.setCookie);
    }
    ctx.params = found.params;
    const response = await found.handler(ctx);
    return withCookie(response, ctx.setCookie);
  }

  return {
    async fetch(request: Request, env: Bindings): Promise<Response> {
      const url = new URL(request.url);
      // run_worker_first가 /api/*만 Worker로 보낸다. 그 밖의 요청이 여기 오면 정적 파일에 넘긴다.
      if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
      try {
        return await handleApi(request, url, env);
      } catch (error) {
        // 경로와 오류 종류만 남긴다 — 본문·cookie·메시지(입력값이 섞일 수 있다)는 남기지 않는다(ARCHITECTURE §8).
        console.error(JSON.stringify({ at: "api", method: request.method, path: url.pathname, error: error instanceof Error ? error.name : "unknown" }));
        return fail(500, "server_error");
      }
    }
  };
}
