// 부를 이름(D-112 ④)과 개발용 화면 오류 보고(D-113 ②, D-115 ⑤).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CLIENT_ERROR_KEEP_ROWS, CLIENT_ERRORS_PATH } from "../../shared/dev";
import { devRoutes } from "../../worker/src/dev/clientErrors";
import { call, login, minutes, startServer, type TestServer } from "./harness";

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

describe("부를 이름", () => {
  it("처음에는 없고, 정하면 hasName이 참이 된다", async () => {
    const cookie = await login(server);
    expect((await call(server, "GET", "/api/settings/profile", { cookie })).body).toEqual({ name: null });
    const put = await call(server, "PUT", "/api/settings/profile", { cookie, body: { name: "  하늘  " } });
    expect(put.body).toEqual({ name: "하늘" });
    expect((await call(server, "GET", "/api/session", { cookie })).body?.hasName).toBe(true);
  });

  it("빈칸뿐·13자·제어 문자·문자열이 아닌 값은 422", async () => {
    const cookie = await login(server);
    for (const name of ["", "   ", "가".repeat(13), "하\n늘", "하\ud800늘", 12, null]) {
      expect((await call(server, "PUT", "/api/settings/profile", { cookie, body: { name } })).body).toEqual({ error: "invalid_name" });
    }
  });

  it("12자는 받는다 — 한글·이모지는 글자(코드 포인트)로 센다", async () => {
    const cookie = await login(server);
    for (const name of ["가".repeat(12), "🌲".repeat(12)]) {
      expect((await call(server, "PUT", "/api/settings/profile", { cookie, body: { name } })).status).toBe(200);
    }
  });
});

const report = { kind: "error", name: "TypeError", source: "/assets/index-abc123.js", line: 10, col: 5, build: "20261014-abc1234", route: "today" };

describe("개발용 화면 오류 보고", () => {
  const dev = devRoutes();

  it("운영과 같은 경로 표(개발용 경로 없음)에서는 404", async () => {
    const cookie = await login(server);
    expect((await call(server, "POST", CLIENT_ERRORS_PATH, { cookie, body: report, appEnv: "prod" })).status).toBe(404);
  });

  it("개발용에서는 일곱 칸만 받아 남긴다", async () => {
    const cookie = await login(server);
    expect((await call(server, "POST", CLIENT_ERRORS_PATH, { cookie, body: report, devRoutes: dev })).status).toBe(204);
    const row = await server.db.prepare("SELECT kind, name, source, line, col, build, route FROM client_errors").first();
    expect(row).toEqual(report);
  });

  it("로그인 전 401, 잠긴 세션 423, 표식 없으면 403", async () => {
    expect((await call(server, "POST", CLIENT_ERRORS_PATH, { body: report, devRoutes: dev })).status).toBe(401);
    const cookie = await login(server);
    expect((await call(server, "POST", CLIENT_ERRORS_PATH, { cookie, body: report, devRoutes: dev, csrf: false })).status).toBe(403);
    await call(server, "PUT", "/api/app-lock", { cookie, body: { pin: "2468" } });
    server.clock.now += minutes(6);
    expect((await call(server, "POST", CLIENT_ERRORS_PATH, { cookie, body: report, devRoutes: dev })).status).toBe(423);
  });

  it("글·열쇠·주소 query를 실을 길이 없다 — 칸이 더 있거나 모양이 다르면 400이고 아무것도 남지 않는다", async () => {
    const cookie = await login(server);
    const diary = "오늘 엄마랑 싸워서 너무 속상했다";
    const attempts = [
      { ...report, message: diary },
      { ...report, name: diary },
      { ...report, source: `/assets/x.js?k=${server.key}` },
      { ...report, source: "https://evil.test/a.js" },
      { ...report, route: `today?text=${diary}` },
      { ...report, build: server.key.repeat(2) },
      { ...report, kind: "console" },
      { ...report, line: -1 }
    ];
    for (const body of attempts) {
      expect((await call(server, "POST", CLIENT_ERRORS_PATH, { cookie, body, devRoutes: dev })).status).toBe(400);
    }
    const rows = await server.db.prepare("SELECT * FROM client_errors").all();
    expect(rows.results).toHaveLength(0);
    expect(JSON.stringify(rows.results)).not.toContain(server.key);
  });

  it(`최근 ${CLIENT_ERROR_KEEP_ROWS}행만 남긴다`, async () => {
    const cookie = await login(server);
    for (let i = 0; i < CLIENT_ERROR_KEEP_ROWS + 5; i += 1) {
      server.clock.now += 1000;
      await call(server, "POST", CLIENT_ERRORS_PATH, { cookie, body: { ...report, line: i }, devRoutes: dev });
    }
    const count = await server.db.prepare("SELECT COUNT(*) AS n, MIN(line) AS first FROM client_errors").first<{ n: number; first: number }>();
    expect(count?.n).toBe(CLIENT_ERROR_KEEP_ROWS);
    expect(count?.first).toBe(5);
  });
});
