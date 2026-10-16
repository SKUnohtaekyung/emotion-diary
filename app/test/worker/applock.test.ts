// F-23 앱 잠금의 서버 확인(EVAL_PLAN §5, ARCHITECTURE §6, D-106·D-112 ③⑧). 전체 삭제 두 줄은 data-foundation(T3 A-18).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { hmacHex } from "../../worker/src/crypto";
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

/** 잠금을 켠 세션을 만든다(열쇠 로그인 직후라 지금 비밀번호 없이 정한다). */
async function withLock(pin = "2468"): Promise<string> {
  const cookie = await login(server);
  const reply = await call(server, "PUT", "/api/app-lock", { cookie, body: { pin } });
  expect(reply.status).toBe(200);
  return cookie;
}

const session = async (cookie: string) => (await call(server, "GET", "/api/session", { cookie })).body;

/** 화면을 켜 둔 채 n분 — 1분마다 신호를 보낸다(잠기지 않게). */
async function stayActive(cookie: string, n: number): Promise<void> {
  for (let i = 0; i < n; i += 1) {
    server.clock.now += minutes(1);
    expect((await call(server, "POST", "/api/session/heartbeat", { cookie })).status).toBe(204);
  }
}

describe("언제 잠기는가(서버의 5분 규칙과 화면 신호)", () => {
  it("화면 신호가 끊긴 뒤 5분이 지난 요청은 423이고 일기·설정 데이터를 싣지 않는다", async () => {
    const cookie = await withLock();
    await call(server, "PUT", "/api/settings/profile", { cookie, body: { name: "하늘" } });
    server.clock.now += minutes(5) + 1000;
    const reply = await call(server, "GET", "/api/settings/profile", { cookie });
    expect(reply.status).toBe(423);
    expect(reply.body).toEqual({ error: "app_locked" });
    expect(reply.raw).not.toContain("하늘");
    expect((await session(cookie))?.locked).toBe(true);
  });

  it("4분 뒤에 돌아오면 잠기지 않는다", async () => {
    const cookie = await withLock();
    server.clock.now += minutes(4);
    expect((await call(server, "GET", "/api/settings/profile", { cookie })).status).toBe(200);
  });

  it("신호가 1분마다 이어지는 동안에는 잠기지 않는다(화면을 켜 둔 채 오래 읽기)", async () => {
    const cookie = await withLock();
    for (let i = 0; i < 20; i += 1) {
      server.clock.now += minutes(1);
      expect((await call(server, "POST", "/api/session/heartbeat", { cookie })).status).toBe(204);
    }
    expect((await call(server, "GET", "/api/settings/profile", { cookie })).status).toBe(200);
  });

  it("잠긴 뒤의 신호는 423이고 신호로는 풀리지 않는다", async () => {
    const cookie = await withLock();
    server.clock.now += minutes(6);
    expect((await call(server, "POST", "/api/session/heartbeat", { cookie })).status).toBe(423);
    server.clock.now += minutes(1);
    expect((await call(server, "POST", "/api/session/heartbeat", { cookie })).status).toBe(423);
    expect((await session(cookie))?.locked).toBe(true);
  });

  it("잠금을 켜지 않았으면 오래 떠나도 잠기지 않는다", async () => {
    const cookie = await login(server);
    server.clock.now += minutes(60);
    expect((await call(server, "GET", "/api/settings/profile", { cookie })).status).toBe(200);
  });

  it("POST /api/app-lock/lock은 잠그기만 하고 풀지 못한다", async () => {
    const cookie = await withLock();
    expect((await call(server, "POST", "/api/app-lock/lock", { cookie })).status).toBe(204);
    expect((await session(cookie))?.locked).toBe(true);
    expect((await call(server, "POST", "/api/app-lock/lock", { cookie })).status).toBe(423);
  });

  it("잠금이 꺼져 있으면 지금 잠그기는 409", async () => {
    const cookie = await login(server);
    expect((await call(server, "POST", "/api/app-lock/lock", { cookie })).status).toBe(409);
  });
});

describe("잠긴 세션이 부를 수 있는 넷", () => {
  it("세션 확인·잠금 풀기·로그아웃·다시 로그인만 되고 나머지는 423", async () => {
    const cookie = await withLock();
    await call(server, "POST", "/api/app-lock/lock", { cookie });
    expect((await call(server, "GET", "/api/session", { cookie })).status).toBe(200);
    expect((await call(server, "PUT", "/api/settings/profile", { cookie, body: { name: "가" } })).status).toBe(423);
    expect((await call(server, "PUT", "/api/app-lock", { cookie, body: { pin: "1111" } })).status).toBe(423);
    expect((await call(server, "DELETE", "/api/app-lock", { cookie })).status).toBe(423);
    expect((await call(server, "GET", "/api/nothing", { cookie })).status).toBe(423);
    expect((await call(server, "POST", "/api/app-lock/unlock", { cookie, body: { pin: "2468" } })).status).toBe(200);
    await call(server, "POST", "/api/app-lock/lock", { cookie });
    expect((await call(server, "DELETE", "/api/session", { cookie })).status).toBe(200);
  });

  it("열쇠로 다시 로그인한 세션은 풀린 채로 시작하고 걸어 둔 잠금은 남는다(D-112 ⑧)", async () => {
    const cookie = await withLock();
    await call(server, "POST", "/api/app-lock/lock", { cookie });
    const fresh = await login(server, cookie);
    const info = await session(fresh);
    expect(info?.locked).toBe(false);
    expect(info?.appLock).toBe(true);
    server.clock.now += minutes(5) + 1000;
    expect((await session(fresh))?.locked).toBe(true); // 5분 규칙은 그때부터 다시 돈다
  });
});

describe("기기마다 잠금", () => {
  it("한 기기에서 풀어도 다른 기기는 잠긴 채다", async () => {
    const phone = await withLock();
    const pc = await login(server);
    await call(server, "POST", "/api/app-lock/lock", { cookie: phone });
    await call(server, "POST", "/api/app-lock/lock", { cookie: pc });
    expect((await call(server, "POST", "/api/app-lock/unlock", { cookie: phone, body: { pin: "2468" } })).status).toBe(200);
    expect((await session(phone))?.locked).toBe(false);
    expect((await session(pc))?.locked).toBe(true);
  });

  it("잠금을 끄면 모든 기기의 잠김이 풀린다", async () => {
    const phone = await withLock();
    const pc = await login(server);
    await call(server, "POST", "/api/app-lock/lock", { cookie: phone });
    expect((await call(server, "DELETE", "/api/app-lock", { cookie: pc })).status).toBe(200);
    expect((await session(phone))?.locked).toBe(false);
    expect((await session(phone))?.appLock).toBe(false);
  });
});

describe("틀린 횟수(서버가 센다)", () => {
  it("다섯 번 틀리면 30초 쉬고, 쉬는 동안 맞는 비밀번호도 429, 30초 뒤 풀린다", async () => {
    const cookie = await withLock();
    await call(server, "POST", "/api/app-lock/lock", { cookie });
    for (let i = 1; i <= 4; i += 1) {
      const reply = await call(server, "POST", "/api/app-lock/unlock", { cookie, body: { pin: "0000" } });
      expect(reply.status).toBe(422);
      expect(reply.body).toEqual({ error: "wrong_pin", remaining: 5 - i });
    }
    const fifth = await call(server, "POST", "/api/app-lock/unlock", { cookie, body: { pin: "0000" } });
    expect(fifth.status).toBe(429);
    expect(fifth.headers.get("retry-after")).toBe("30");
    expect((await call(server, "POST", "/api/app-lock/unlock", { cookie, body: { pin: "2468" } })).status).toBe(429);
    server.clock.now += 31_000;
    expect((await call(server, "POST", "/api/app-lock/unlock", { cookie, body: { pin: "2468" } })).status).toBe(200);
  });

  it("다른 세션(화면을 새로 열거나 다시 로그인)으로 와도 같은 카운터다", async () => {
    const cookie = await withLock();
    server.clock.now += minutes(11);
    const other = await login(server);
    await call(server, "POST", "/api/app-lock/lock", { cookie: other });
    for (let i = 0; i < 5; i += 1) await call(server, "POST", "/api/app-lock/unlock", { cookie, body: { pin: "0000" } });
    expect((await call(server, "POST", "/api/app-lock/unlock", { cookie: other, body: { pin: "2468" } })).status).toBe(429);
  });

  it("한꺼번에 보낸 비밀번호도 쉬기 전까지 다섯 번만 대조된다", async () => {
    const cookie = await withLock();
    await call(server, "POST", "/api/app-lock/lock", { cookie });
    const replies = await Promise.all(Array.from({ length: 30 }, (_, i) => call(server, "POST", "/api/app-lock/unlock", { cookie, body: { pin: String(1000 + i) } })));
    expect(replies.filter((reply) => reply.status === 422).length).toBeLessThanOrEqual(4);
    expect(replies.every((reply) => reply.status === 422 || reply.status === 429)).toBe(true);
  });

  it("숫자 네 자리가 아니면 422 invalid_pin이고 횟수에 들지 않는다", async () => {
    const cookie = await withLock();
    await call(server, "POST", "/api/app-lock/lock", { cookie });
    for (const pin of ["123", "12345", "abcd", 1234, null]) {
      expect((await call(server, "POST", "/api/app-lock/unlock", { cookie, body: { pin } })).body).toEqual({ error: "invalid_pin" });
    }
    expect((await call(server, "POST", "/api/app-lock/unlock", { cookie, body: { pin: "2468" } })).status).toBe(200);
  });
});

describe("바꾸기·끄기의 본인 확인(열쇠 로그인 10분)", () => {
  it("열쇠로 로그인한 지 10분 안이면 지금 비밀번호 없이 바꾸고 끈다", async () => {
    const cookie = await withLock("2468");
    await stayActive(cookie, 9);
    expect((await call(server, "PUT", "/api/app-lock", { cookie, body: { pin: "1357" } })).status).toBe(200);
    expect((await call(server, "DELETE", "/api/app-lock", { cookie })).status).toBe(200);
  });

  it("10분이 지나면 지금 비밀번호 없이는 바꾸거나 끌 수 없다", async () => {
    const cookie = await withLock("2468");
    await stayActive(cookie, 11);
    expect((await call(server, "PUT", "/api/app-lock", { cookie, body: { pin: "1357" } })).body).toEqual({ error: "pin_required" });
    expect((await call(server, "DELETE", "/api/app-lock", { cookie })).body).toEqual({ error: "pin_required" });
    const wrong = await call(server, "PUT", "/api/app-lock", { cookie, body: { pin: "1357", currentPin: "0000" } });
    expect(wrong.body).toEqual({ error: "wrong_pin", remaining: 4 });
    expect((await call(server, "PUT", "/api/app-lock", { cookie, body: { pin: "1357", currentPin: "2468" } })).status).toBe(200);
    await call(server, "POST", "/api/app-lock/lock", { cookie });
    expect((await call(server, "POST", "/api/app-lock/unlock", { cookie, body: { pin: "1357" } })).status).toBe(200);
  });

  it("'잊었어요' 길: 로그아웃 → 열쇠로 다시 로그인 → 10분 안에 지금 비밀번호 없이 새로 정한다", async () => {
    const cookie = await withLock("2468");
    server.clock.now += minutes(30);
    await call(server, "DELETE", "/api/session", { cookie });
    const fresh = await login(server);
    expect((await call(server, "PUT", "/api/app-lock", { cookie: fresh, body: { pin: "9753" } })).status).toBe(200);
  });

  it("이미 꺼진 잠금을 다시 끄는 것은 200(재시도에 안전)", async () => {
    const cookie = await login(server);
    expect((await call(server, "DELETE", "/api/app-lock", { cookie })).status).toBe(200);
  });
});

describe("비밀번호는 평문으로 남지 않는다", () => {
  it("DB에는 64자 HMAC만 있고 응답에 비밀번호가 없다", async () => {
    const cookie = await login(server);
    const reply = await call(server, "PUT", "/api/app-lock", { cookie, body: { pin: "8642" } });
    expect(reply.raw).not.toContain("8642");
    const row = await server.db.prepare("SELECT app_lock_hash FROM owner_settings").first<{ app_lock_hash: string }>();
    expect(row?.app_lock_hash).toMatch(/^[0-9a-f]{64}$/);
    // 저장된 값은 서버 비밀값을 섞은 HMAC 그 자체다(평문·되돌릴 수 있는 모양이 아니다)
    expect(row?.app_lock_hash).toBe(await hmacHex(server.env.APP_LOCK_SECRET ?? "", "owner:8642"));
    // 해시 칸은 무작위 16진수라 우연히 '8642'를 품을 수 있다(약 0.1% — 2026-10-16 main CI 38853644189에서 실제로 걸렸다). 나머지 칸만 글자로 본다
    const all = await server.db.prepare("SELECT * FROM owner_settings").all<Record<string, unknown>>();
    const others = all.results.map(({ app_lock_hash: _hash, ...rest }) => rest);
    expect(JSON.stringify(others)).not.toContain("8642");
  });

  it("로그인하지 않은 GET /api/session은 잠금 여부를 알려 주지 않는다", async () => {
    await withLock();
    const reply = await call(server, "GET", "/api/session");
    expect(reply.body).not.toHaveProperty("appLock");
    expect(reply.body).not.toHaveProperty("locked");
  });
});
