// 경로·헤더·CSRF와 F-22(로그인 수명과 로그아웃 — EVAL_PLAN §5, ARCHITECTURE §5·§6, DATA_MODEL §3.9·§3.10).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { API_COMPAT, SESSION_COOKIE } from "../../shared/api";
import { cookieValue } from "../../worker/src/session";
import { call, days, login, minutes, ORIGIN, startServer, type TestServer } from "./harness";

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

describe("경로", () => {
  it("로그인 전 GET /api/session은 로그인 안 됨과 배포 모드·빌드만 알린다(잠금 여부 없음)", async () => {
    const reply = await call(server, "GET", "/api/session");
    expect(reply.status).toBe(200);
    expect(reply.body).toEqual({ authenticated: false, env: "dev", build: "test-build", compat: API_COMPAT });
  });

  it("없는 API 경로는 로그인 전 401, 로그인 뒤 JSON 404", async () => {
    expect((await call(server, "GET", "/api/nothing")).status).toBe(401);
    const cookie = await login(server);
    const reply = await call(server, "GET", "/api/nothing", { cookie });
    expect(reply.status).toBe(404);
    expect(reply.body).toEqual({ error: "not_found" });
    expect(reply.headers.get("content-type")).toContain("application/json");
  });

  it("아는 경로의 다른 방식은 405", async () => {
    const cookie = await login(server);
    expect((await call(server, "PATCH", "/api/settings/profile", { cookie, body: {} })).status).toBe(405);
  });

  it("/api/ 밖의 요청은 정적 파일로 넘긴다", async () => {
    const response = await server.app().fetch(new Request(`${ORIGIN}/today`), server.env);
    expect(await response.text()).toBe("static");
  });

  it("API 응답에 보안 헤더가 붙는다", async () => {
    const reply = await call(server, "GET", "/api/session");
    expect(reply.headers.get("cache-control")).toBe("no-store");
    expect(reply.headers.get("x-content-type-options")).toBe("nosniff");
    expect(reply.headers.get("content-security-policy")).toBe("default-src 'none'; frame-ancestors 'none'");
    expect(reply.headers.get("x-frame-options")).toBe("DENY");
    expect(reply.headers.get("referrer-policy")).toBe("no-referrer");
    expect(reply.headers.get("strict-transport-security")).toMatch(/^max-age=\d+/);
  });

  it("비밀값이 빠지면 어떤 요청도 받지 않는다(500, 값은 응답에 없다)", async () => {
    const env = { ...server.env, SESSION_SECRET: "" };
    const response = await server.app().fetch(new Request(`${ORIGIN}/api/session`), env);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "server_misconfigured" });
  });

  it("너무 큰 본문은 413", async () => {
    const reply = await call(server, "POST", "/api/session", { body: { key: "x".repeat(10_000) } });
    expect(reply.status).toBe(413);
  });

  it("길이를 밝히지 않은(청크) 큰 본문도 한도에서 끊고 413", async () => {
    const chunk = new TextEncoder().encode("x".repeat(1024));
    let sent = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (sent >= 64) controller.close();
        else {
          sent += 1;
          controller.enqueue(chunk);
        }
      }
    });
    const request = new Request(`${ORIGIN}/api/session`, {
      method: "POST",
      body,
      headers: { "x-requested-with": "emotion-diary", origin: ORIGIN },
      duplex: "half"
    } as RequestInit);
    const response = await server.app().fetch(request, server.env);
    expect(response.status).toBe(413);
    expect(sent).toBeLessThan(64); // 끝까지 읽지 않았다
  });

  it("주체 설정이 틀리면 열쇠를 대조하기 전에 500이고 틀린 횟수를 쓰지 않는다", async () => {
    const env = { ...server.env, OWNER_ALLOWLIST: "someone-else" };
    const request = new Request(`${ORIGIN}/api/session`, {
      method: "POST",
      body: JSON.stringify({ key: "wrong-key" }),
      headers: { "x-requested-with": "emotion-diary", origin: ORIGIN, "content-type": "application/json" }
    });
    const response = await server.app().fetch(request, env);
    expect(response.status).toBe(500);
    const row = await server.db.prepare("SELECT fail_count FROM auth_failures WHERE id = 1").first<{ fail_count: number }>();
    expect(row?.fail_count).toBe(0);
  });
});

describe("CSRF(D-025)", () => {
  it("로그인 요청도 표식이 없으면 403", async () => {
    const reply = await call(server, "POST", "/api/session", { body: { key: server.key }, csrf: false });
    expect(reply.status).toBe(403);
    expect(reply.cookie).toBeNull();
  });

  it("다른 출처의 Origin이나 cross-site 요청은 표식이 있어도 403", async () => {
    const cookie = await login(server);
    const evil = await call(server, "PUT", "/api/settings/profile", { cookie, body: { name: "가" }, headers: { origin: "https://evil.test" } });
    expect(evil.status).toBe(403);
    const crossSite = await call(server, "PUT", "/api/settings/profile", { cookie, body: { name: "가" }, headers: { "sec-fetch-site": "cross-site" } });
    expect(crossSite.status).toBe(403);
    const nullOrigin = await call(server, "PUT", "/api/settings/profile", { cookie, body: { name: "가" }, headers: { origin: "null" } });
    expect(nullOrigin.status).toBe(403);
  });

  it("로그인한 변경 요청도 표식이 없으면 403", async () => {
    const cookie = await login(server);
    expect((await call(server, "DELETE", "/api/session", { cookie, csrf: false })).status).toBe(403);
  });
});

describe("로그인(접근 열쇠)", () => {
  it("맞는 열쇠는 __Host- cookie를 심는다 — HttpOnly·Secure·SameSite=Lax·Path=/·30일", async () => {
    const reply = await call(server, "POST", "/api/session", { body: { key: server.key } });
    expect(reply.status).toBe(200);
    const line = reply.headers.getSetCookie().find((value) => value.startsWith(`${SESSION_COOKIE}=`)) ?? "";
    expect(line).toContain("HttpOnly");
    expect(line).toContain("Secure");
    expect(line).toContain("SameSite=Lax");
    expect(line).toContain("Path=/");
    expect(line).toContain(`Max-Age=${30 * 24 * 60 * 60}`);
    expect(line).not.toContain("Domain");
  });

  it("열쇠는 응답·cookie·DB 어디에도 남지 않는다", async () => {
    const wrong = await call(server, "POST", "/api/session", { body: { key: `${server.key}x` } });
    const right = await call(server, "POST", "/api/session", { body: { key: server.key } });
    for (const reply of [wrong, right]) {
      expect(reply.raw).not.toContain(server.key);
      expect([...reply.headers.values()].join("\n")).not.toContain(server.key);
    }
    for (const table of ["sessions", "auth_failures"]) {
      const rows = await server.db.prepare(`SELECT * FROM ${table}`).all();
      expect(JSON.stringify(rows.results)).not.toContain(server.key);
    }
  });

  it("틀린 열쇠는 401, 60초 안에 10번이면 429(Retry-After 300), 잠긴 동안 맞는 열쇠도 429, 5분 뒤 다시 된다", async () => {
    for (let i = 1; i <= 9; i += 1) {
      const reply = await call(server, "POST", "/api/session", { body: { key: "wrong-key" } });
      expect(reply.status).toBe(401);
      expect(reply.body).toEqual({ error: "invalid_key" });
    }
    const tenth = await call(server, "POST", "/api/session", { body: { key: "wrong-key" } });
    expect(tenth.status).toBe(429);
    expect(tenth.headers.get("retry-after")).toBe("300");
    const correctWhileLocked = await call(server, "POST", "/api/session", { body: { key: server.key } });
    expect(correctWhileLocked.status).toBe(429);
    expect(correctWhileLocked.cookie).toBeNull();
    server.clock.now += minutes(5) + 1000;
    expect((await call(server, "POST", "/api/session", { body: { key: server.key } })).status).toBe(200);
  });

  it("창(60초)이 지나면 틀린 횟수가 다시 1부터다", async () => {
    for (let i = 0; i < 9; i += 1) await call(server, "POST", "/api/session", { body: { key: "wrong-key" } });
    server.clock.now += 61_000;
    expect((await call(server, "POST", "/api/session", { body: { key: "wrong-key" } })).status).toBe(401);
  });

  it("한꺼번에 보낸 틀린 열쇠도 창 하나에 10번을 넘겨 대조되지 않는다", async () => {
    const replies = await Promise.all(Array.from({ length: 20 }, () => call(server, "POST", "/api/session", { body: { key: "wrong-key" } })));
    expect(replies.filter((reply) => reply.status === 401).length).toBeLessThanOrEqual(9);
    expect(replies.every((reply) => reply.status === 401 || reply.status === 429)).toBe(true);
  });

  it("주소(query)로 열쇠를 받는 길은 없다", async () => {
    const reply = await call(server, "POST", `/api/session?key=${encodeURIComponent(server.key)}`, { body: {} });
    expect(reply.status).toBe(400);
  });

  it("로그인 뒤 GET /api/session은 로그인됨·잠김·잠금·이름 여부를 알린다", async () => {
    const cookie = await login(server);
    const reply = await call(server, "GET", "/api/session", { cookie });
    expect(reply.body).toEqual({ authenticated: true, env: "dev", build: "test-build", compat: API_COMPAT, locked: false, appLock: false, hasName: false });
  });
});

describe("F-22 로그인 수명과 로그아웃", () => {
  it("하루 안의 요청은 cookie를 다시 심지 않고, 하루가 넘으면 다시 심는다(연장)", async () => {
    const cookie = await login(server);
    server.clock.now += minutes(30);
    expect((await call(server, "GET", "/api/session", { cookie })).cookie).toBeNull();
    server.clock.now += days(1);
    const renewed = await call(server, "GET", "/api/session", { cookie });
    expect(renewed.cookie).toBeTruthy();
    expect(renewed.cookie).not.toBe(cookie);
  });

  it("마지막 발급에서 30일이 지난 세션은 cookie가 남아 있어도 401이고 기록이 지워진다", async () => {
    const cookie = await login(server);
    server.clock.now += days(30);
    const reply = await call(server, "GET", "/api/settings/profile", { cookie });
    expect(reply.status).toBe(401);
    expect(reply.cookie).toBe(""); // 쓸 수 없는 cookie는 지운다
    const count = await server.db.prepare("SELECT COUNT(*) AS n FROM sessions").first<{ n: number }>();
    expect(count?.n).toBe(0);
  });

  it("계속 쓰면 끝나는 날이 없다 — 29일마다 쓰면 90일 뒤에도 로그인돼 있다(절대 상한 없음)", async () => {
    let cookie = await login(server);
    for (let i = 0; i < 3; i += 1) {
      server.clock.now += days(29);
      const reply = await call(server, "GET", "/api/session", { cookie });
      expect(reply.body?.authenticated).toBe(true);
      cookie = reply.cookie ?? cookie;
    }
  });

  it("서버 기록이 연장된 뒤에는 옛 cookie 사본도 같은 세션으로 받는다(사본끼리 엇갈려도 끊기지 않게, T3 A-17)", async () => {
    const original = await login(server);
    server.clock.now += days(2);
    await call(server, "GET", "/api/session", { cookie: original }); // 연장
    server.clock.now += days(29);
    expect((await call(server, "GET", "/api/session", { cookie: original })).body?.authenticated).toBe(true);
  });

  it("로그아웃 뒤 같은 cookie(사본 포함)로는 401 — 서명이 맞아도 세션 기록이 없다", async () => {
    const cookie = await login(server);
    const out = await call(server, "DELETE", "/api/session", { cookie });
    expect(out.status).toBe(200);
    expect(out.cookie).toBe("");
    expect((await call(server, "GET", "/api/settings/profile", { cookie })).status).toBe(401);
    expect((await call(server, "GET", "/api/session", { cookie })).body?.authenticated).toBe(false);
  });

  it("한 기기의 로그아웃은 다른 기기의 로그인을 끊지 않는다", async () => {
    const phone = await login(server);
    const pc = await login(server);
    await call(server, "DELETE", "/api/session", { cookie: phone });
    expect((await call(server, "GET", "/api/session", { cookie: pc })).body?.authenticated).toBe(true);
  });

  it("같은 기기에서 다시 로그인하면 옛 기록을 지우고, 기한이 지난 다른 기록도 함께 지운다", async () => {
    const stale = await login(server);
    server.clock.now += days(31);
    const first = await login(server);
    const again = await login(server, first);
    const rows = await server.db.prepare("SELECT COUNT(*) AS n FROM sessions").first<{ n: number }>();
    expect(rows?.n).toBe(1);
    expect((await call(server, "GET", "/api/session", { cookie: first })).body?.authenticated).toBe(false);
    expect((await call(server, "GET", "/api/session", { cookie: stale })).body?.authenticated).toBe(false);
    expect((await call(server, "GET", "/api/session", { cookie: again })).body?.authenticated).toBe(true);
  });

  it("서명을 바꾼 cookie, 주체만 바꿔치기한 cookie, 허용 목록 밖 주체는 401", async () => {
    const cookie = await login(server);
    const [v, sid, subject, issued, signature] = cookie.split(".");
    const flipped = `${v}.${sid}.${subject}.${issued}.${(signature ?? "").slice(0, -1)}${signature?.endsWith("A") ? "B" : "A"}`;
    expect((await call(server, "GET", "/api/settings/profile", { cookie: flipped })).status).toBe(401);
    const swapped = `${v}.${sid}.intruder.${issued}.${signature}`;
    expect((await call(server, "GET", "/api/settings/profile", { cookie: swapped })).status).toBe(401);
    // 서명을 제대로 만들고 기록까지 있어도 허용 목록 밖 주체는 401(D-025)
    await server.db
      .prepare("INSERT INTO sessions (id, subject, key_login_at, issued_at, last_active_at, locked) VALUES (?1, 'intruder', ?2, ?2, ?2, 0)")
      .bind("intruder-session-0001", new Date(server.clock.now).toISOString())
      .run();
    const forged = await cookieValue(server.env.SESSION_SECRET ?? "", "intruder-session-0001", "intruder", server.clock.now);
    expect((await call(server, "GET", "/api/settings/profile", { cookie: forged })).status).toBe(401);
    // 같은 방법으로 만든 목록 안 주체는 200(양성 대조)
    await server.db
      .prepare("INSERT INTO sessions (id, subject, key_login_at, issued_at, last_active_at, locked) VALUES (?1, 'owner', ?2, ?2, ?2, 0)")
      .bind("owner-session-00001", new Date(server.clock.now).toISOString())
      .run();
    const good = await cookieValue(server.env.SESSION_SECRET ?? "", "owner-session-00001", "owner", server.clock.now);
    expect((await call(server, "GET", "/api/settings/profile", { cookie: good })).status).toBe(200);
  });
});
