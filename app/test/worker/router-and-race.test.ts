// 경로 표의 매개변수 조각(ARCHITECTURE §11.9)과, 활동 갱신이 동시에 온 '지금 잠그기'를 되돌리지 못하는지(fail-closed).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SESSION_COOKIE } from "../../shared/api";
import type { Ctx, Handler } from "../../worker/src/context";
import { parseAllowlist, readSecrets } from "../../worker/src/context";
import { fail, json } from "../../worker/src/http";
import { readJson } from "../../worker/src/request";
import { createRouter } from "../../worker/src/router";
import { loadSession, touchSession } from "../../worker/src/session";
import { call, login, minutes, ORIGIN, startServer, type TestServer } from "./harness";

let server: TestServer;
beforeAll(async () => {
  server = await startServer();
});
afterAll(async () => {
  await server.dispose();
});
beforeEach(async () => {
  await server.reset();
});

const echo: Handler = async (ctx) => json(200, { params: ctx.params });
const bigBody: Handler = async (ctx) => {
  const body = await readJson(ctx.request, 16 * 1024);
  return body instanceof Response ? body : json(200, { size: JSON.stringify(body).length });
};
const extra = new Map<string, Handler>([
  ["GET /api/test-items/:id", echo],
  ["PUT /api/test-items/:id", bigBody],
  ["GET /api/test-items/special", async () => fail(418 as number, "not_found")]
]);

describe("경로 표의 매개변수 조각", () => {
  it("`:id` 조각 값을 URL 디코딩해 처리기에 넘긴다", async () => {
    const cookie = await login(server);
    const reply = await call(server, "GET", "/api/test-items/2026-10-14", { cookie, devRoutes: extra });
    expect(reply.body).toEqual({ params: { id: "2026-10-14" } });
    const encoded = await call(server, "GET", "/api/test-items/%ED%95%98%EB%8A%98", { cookie, devRoutes: extra });
    expect(encoded.body).toEqual({ params: { id: "하늘" } });
  });

  it("정확한 경로가 매개변수 경로보다 먼저다", async () => {
    const cookie = await login(server);
    expect((await call(server, "GET", "/api/test-items/special", { cookie, devRoutes: extra })).status).toBe(418);
  });

  it("조각이 둘이면 맞지 않고(404), 같은 경로의 다른 방식은 405, 잘못된 % 인코딩은 404", async () => {
    const cookie = await login(server);
    expect((await call(server, "GET", "/api/test-items/a/b", { cookie, devRoutes: extra })).status).toBe(404);
    expect((await call(server, "DELETE", "/api/test-items/a", { cookie, devRoutes: extra })).status).toBe(405);
    expect((await call(server, "GET", "/api/test-items/%E0%A4%A", { cookie, devRoutes: extra })).status).toBe(404);
  });

  it("로그인 전에는 매개변수 경로도 401, 잠긴 세션에는 423(경로가 있는지 알려 주지 않는다)", async () => {
    expect((await call(server, "GET", "/api/test-items/x", { devRoutes: extra })).status).toBe(401);
    const cookie = await login(server);
    await call(server, "PUT", "/api/app-lock", { cookie, body: { pin: "2468" } });
    await call(server, "POST", "/api/app-lock/lock", { cookie });
    expect((await call(server, "GET", "/api/test-items/x", { cookie, devRoutes: extra })).status).toBe(423);
  });

  it("경로마다 본문 한도를 넓힐 수 있다(기본 8KB, 이 경로는 16KB)", async () => {
    const cookie = await login(server);
    const body = { text: "가".repeat(3000) }; // UTF-8 약 9KB
    expect((await call(server, "PUT", "/api/test-items/a", { cookie, devRoutes: extra, body })).status).toBe(200);
    expect((await call(server, "PUT", "/api/settings/profile", { cookie, body })).status).toBe(413);
  });

  it("경로 열쇠 모양이 틀리면 앱을 만들 때 멈춘다", () => {
    expect(() => createRouter([["GET api/x", echo]])).toThrow();
    expect(() => createRouter([["get /api/x", echo]])).toThrow();
    expect(() => createRouter([["GET /api/x?y", echo]])).toThrow();
  });
});

describe("활동 갱신은 잠금을 풀지 못한다", () => {
  it("먼저 읽은 낡은 세션으로 갱신해도, 그 사이 걸린 잠금은 그대로다", async () => {
    const cookie = await login(server);
    await call(server, "PUT", "/api/app-lock", { cookie, body: { pin: "2468" } });
    // 요청 A가 세션을 읽는다(아직 안 잠김)
    const secrets = readSecrets(server.env);
    if (!secrets) throw new Error("secrets");
    const ctx: Ctx = {
      request: new Request(`${ORIGIN}/api/session/heartbeat`, { headers: { cookie: `${SESSION_COOKIE}=${cookie}` } }),
      url: new URL(`${ORIGIN}/api/session/heartbeat`),
      env: server.env,
      secrets,
      config: { appEnv: "dev", build: "test-build" },
      now: server.clock.now + minutes(2),
      allowlist: parseAllowlist(server.env.OWNER_ALLOWLIST),
      session: null,
      setCookie: null,
      params: {}
    };
    const stale = await loadSession(ctx);
    if (!stale) throw new Error("no session");
    expect(stale.locked).toBe(false);
    // 그 사이 요청 B가 잠근다
    expect((await call(server, "POST", "/api/app-lock/lock", { cookie })).status).toBe(204);
    // 요청 A가 낡은 판단(안 잠김)으로 활동을 쓴다
    await touchSession(ctx, stale);
    const row = await server.db.prepare("SELECT locked FROM sessions").first<{ locked: number }>();
    expect(row?.locked).toBe(1);
  });
});
