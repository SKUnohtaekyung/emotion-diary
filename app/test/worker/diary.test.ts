// 관문 data-integrity의 서버 시험(EVAL_PLAN F-01·F-02·F-06·F-07·F-09·F-10·F-17, TASK-DATA-01 PLAN §5).
// 서버 길을 실제 요청 모양으로 부르고, 창고에 남은 행을 직접 세어 확인한다. 시각은 시험이 옮긴다(시작 2026-10-14 09:00 서울).
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { diaryCompletePath, diaryPath, IDEMPOTENCY_HEADER, REPLAYED_HEADER, TIMEZONE_HEADER } from "../../shared/api";
import { DIARY_MAX_BODY_BYTES, EVENT_MAX_CHARS, REASON_MAX_CHARS, REFLECTION_MAX_CHARS } from "../../shared/diary";
import { EMOTIONS } from "../../shared/taxonomy";
import { cookieValue } from "../../worker/src/session";
import type { Bindings } from "../../worker/src/context";
import { call, days, heldBatchDb, login, minutes, type Reply, startServer, type TestServer } from "./harness";

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

const TODAY = "2026-10-14"; // START(00:00Z)는 서울 09:00
const SEOUL = "Asia/Seoul";
const codes = (category: string) => [...EMOTIONS].filter(([, info]) => info.category === category).map(([code]) => code);
const SAD = codes("sadness");
const JOY = codes("joy");

let sequence = 0;
function newKey(): string {
  sequence += 1;
  return `test-${String(sequence).padStart(6, "0")}-${crypto.randomUUID().slice(0, 8)}`;
}

interface ApiOptions {
  cookie?: string | null;
  body?: unknown;
  key?: string | null;
  tz?: string | null;
  env?: Partial<Bindings>;
}

function api(method: string, path: string, { cookie = null, body, key, tz = SEOUL, env }: ApiOptions = {}): Promise<Reply> {
  const headers: Record<string, string> = {};
  if (tz !== null) headers[TIMEZONE_HEADER] = tz;
  if (method !== "GET" && key !== null) headers[IDEMPOTENCY_HEADER] = key ?? newKey();
  return call(server, method, path, { cookie, body, headers, ...(env ? { env } : {}) });
}

const draft = (overrides: Record<string, unknown> = {}) => ({
  eventText: "",
  reasonText: "",
  categories: [],
  emotions: [],
  praises: [],
  gratitudes: [],
  ...overrides
});

/** 완료할 수 있게 다 채운 내용 */
const full = (overrides: Record<string, unknown> = {}) =>
  draft({
    eventText: "친구와 오래 이야기했다",
    reasonText: "오랜만에 마음을 털어놓았다",
    categories: [{ categoryCode: "joy", intensity: 7 }],
    emotions: [{ emotionCode: JOY[0] }],
    praises: [{ slot: 1, text: "먼저 연락했다" }],
    ...overrides
  });

const save = (cookie: string, date: string, body: unknown, options: ApiOptions = {}) => api("PUT", diaryPath(date), { cookie, body, ...options });
const complete = (cookie: string, date: string, revision: number, options: ApiOptions = {}) =>
  api("POST", diaryCompletePath(date), { cookie, body: { revision }, ...options });
const remove = (cookie: string, date: string, revision: number, options: ApiOptions = {}) => api("DELETE", diaryPath(date), { cookie, body: { revision }, ...options });
const read = (cookie: string, date: string) => api("GET", diaryPath(date), { cookie });

const count = async (sql: string, ...params: unknown[]) => (await server.db.prepare(sql).bind(...params).first<{ n: number }>())?.n ?? -1;

/** 다른 주인(subject 'other')의 세션을 만든다 — 실제 로그인은 OWNER_SUBJECT 하나라 시험에서만 기록을 직접 넣는다. */
async function otherOwnerCookie(): Promise<string> {
  const sid = crypto.randomUUID().replaceAll("-", "").slice(0, 22);
  const now = new Date(server.clock.now).toISOString();
  await server.db
    .prepare("INSERT INTO sessions (id, subject, key_login_at, issued_at, last_active_at, locked) VALUES (?1, 'other', ?2, ?2, ?2, 0)")
    .bind(sid, now)
    .run();
  return cookieValue(server.env.SESSION_SECRET ?? "", sid, "other", server.clock.now);
}

describe("F-01 로그인 없이·잠긴 세션으로는 일기에 닿지 않는다", () => {
  const routes: [string, string, unknown?][] = [
    ["GET", "/api/today"],
    ["GET", diaryPath(TODAY)],
    ["PUT", diaryPath(TODAY), full()],
    ["POST", diaryCompletePath(TODAY), { revision: 1 }],
    ["DELETE", diaryPath(TODAY), { revision: 1 }],
    ["GET", "/api/settings/day-start"],
    ["PUT", "/api/settings/day-start", { dayStartHour: 5 }]
  ];

  it("로그인 없이는 모두 401", async () => {
    for (const [method, path, body] of routes) expect((await api(method, path, { body })).status, `${method} ${path}`).toBe(401);
  });

  it("잠긴 세션은 모두 423이고 일기 글이 응답에 없다", async () => {
    const cookie = await login(server);
    const created = await save(cookie, TODAY, full({ eventText: "잠금 시험 문장" }));
    expect(created.status).toBe(201);
    expect((await call(server, "PUT", "/api/app-lock", { cookie, body: { pin: "4826" } })).status).toBe(200);
    expect((await call(server, "POST", "/api/app-lock/lock", { cookie })).status).toBe(204);
    for (const [method, path, body] of routes) {
      const reply = await api(method, path, { cookie, body });
      expect(reply.status, `${method} ${path}`).toBe(423);
      expect(reply.raw).not.toContain("잠금 시험 문장");
    }
  });
});

describe("F-02 주인 격리", () => {
  it("다른 주인의 세션은 같은 날짜의 기록을 읽지도 고치지도 지우지도 못한다", async () => {
    const owner = await login(server);
    const created = await save(owner, TODAY, full({ eventText: "주인의 글" }));
    expect(created.status).toBe(201);
    const allowlist = server.env.OWNER_ALLOWLIST;
    server.env.OWNER_ALLOWLIST = "owner,other";
    try {
      const other = await otherOwnerCookie();
      const seen = await read(other, TODAY);
      expect(seen.status).toBe(404);
      expect(seen.raw).not.toContain("주인의 글");
      const today = await api("GET", "/api/today", { cookie: other });
      expect(today.body?.entry).toBeNull();
      expect((await save(other, TODAY, full({ revision: 1, eventText: "덮어쓰기" }))).status).toBe(409);
      expect((await complete(other, TODAY, 1)).status).toBe(404);
      expect((await remove(other, TODAY, 1)).status).toBe(404);
      // 다른 주인은 같은 날짜에 자기 기록을 따로 만든다(하루 한 편은 주인마다).
      expect((await save(other, TODAY, full({ eventText: "다른 사람의 글" }))).status).toBe(201);
    } finally {
      server.env.OWNER_ALLOWLIST = allowlist;
    }
    const mine = await read(owner, TODAY);
    expect(mine.body?.eventText).toBe("주인의 글");
    expect(mine.body?.revision).toBe(1);
    expect(await count("SELECT count(*) AS n FROM diary_entries WHERE entry_date = ?1", TODAY)).toBe(2);
  });

  it("본문에 주인 칸을 실어 보내면 400, 응답에 주인·쓰기 표가 없다", async () => {
    const cookie = await login(server);
    expect((await save(cookie, TODAY, { ...full(), ownerKey: "other" })).status).toBe(400);
    expect((await save(cookie, TODAY, full())).status).toBe(201);
    const reply = await read(cookie, TODAY);
    expect(reply.raw).not.toMatch(/owner|write_?token/i);
  });
});

describe("F-06 하루 한 편", () => {
  it("같은 날 새로 만들기를 동시에 다섯 번 보내면 하나만 201, 나머지는 409와 지금 판 번호", async () => {
    const cookie = await login(server);
    const replies = await Promise.all(Array.from({ length: 5 }, (_, i) => save(cookie, TODAY, full({ eventText: `탭 ${i}` }))));
    expect(replies.filter((reply) => reply.status === 201)).toHaveLength(1);
    for (const reply of replies.filter((item) => item.status !== 201)) expect(reply.body).toEqual({ error: "revision_conflict", currentRevision: 1 });
    expect(await count("SELECT count(*) AS n FROM diary_entries")).toBe(1);
    expect(await count("SELECT count(*) AS n FROM diary_categories")).toBe(1); // 진 쪽의 딸린 행이 남지 않는다
  });

  it("(결정적) B가 '아직 없음'을 본 뒤 A가 먼저 만들면 B는 409, 창고에는 A의 행만", async () => {
    const cookie = await login(server);
    const held = heldBatchDb(server.db);
    const b = save(cookie, TODAY, full({ eventText: "B", categories: [{ categoryCode: "sadness", intensity: 2 }], emotions: [{ emotionCode: SAD[0] }] }), { env: { DB: held.db } });
    await held.reached;
    expect((await save(cookie, TODAY, full({ eventText: "A" }))).status).toBe(201);
    held.release();
    expect((await b).body).toEqual({ error: "revision_conflict", currentRevision: 1 });
    expect((await read(cookie, TODAY)).body).toMatchObject({ eventText: "A", categories: [{ categoryCode: "joy", intensity: 7 }] });
    expect(await count("SELECT count(*) AS n FROM diary_emotions")).toBe(1);
  });

  it("다른 탭이 이미 만든 날에 새로 만들기를 보내면 409 — 그 기록을 열게 한다", async () => {
    const cookie = await login(server);
    await save(cookie, TODAY, full());
    const second = await save(cookie, TODAY, full({ eventText: "두 번째 탭" }));
    expect(second.status).toBe(409);
    expect(second.body?.currentRevision).toBe(1);
    expect((await read(cookie, TODAY)).body?.eventText).toBe(full().eventText);
  });
});

describe("F-07 그날만 새로 쓰기, 지난 임시저장은 기한 없이 완료", () => {
  it("어제·내일은 새로 만들 수 없고(422) 오늘은 만든다", async () => {
    const cookie = await login(server);
    expect((await save(cookie, "2026-10-13", full())).body).toEqual({ error: "not_today" });
    expect((await save(cookie, "2026-10-15", full())).status).toBe(422);
    expect((await save(cookie, TODAY, full())).status).toBe(201);
    expect(await count("SELECT count(*) AS n FROM diary_entries")).toBe(1);
  });

  it("날짜가 지난 임시저장도 이어 쓰고 완료한다 — 최초 완료일은 실제로 완료한 날", async () => {
    const cookie = await login(server);
    const created = await save(cookie, TODAY, draft({ eventText: "시작만 했다" }));
    expect(created.status).toBe(201);
    server.clock.now += days(3);
    const later = await save(cookie, TODAY, full({ revision: 1 }));
    expect(later.status).toBe(200);
    const done = await complete(cookie, TODAY, 2);
    expect(done.status).toBe(200);
    expect(done.body).toMatchObject({ entryDate: TODAY, status: "completed", revision: 3, firstCompletedLocalDate: "2026-10-17" });
    const entry = await read(cookie, TODAY);
    expect(entry.body).toMatchObject({ entryDate: TODAY, firstCompletedLocalDate: "2026-10-17" });
  });

  it("없는 날·미래 날짜를 열면 404이고 새 기록을 만들지 않는다", async () => {
    const cookie = await login(server);
    expect((await read(cookie, "2026-10-20")).status).toBe(404);
    expect((await read(cookie, "2026-02-30")).status).toBe(400);
    expect(await count("SELECT count(*) AS n FROM diary_entries")).toBe(0);
  });

  it("오늘 화면은 오늘 기록 요약과 가장 최근의 지난 임시저장을 알린다(글 없음)", async () => {
    const cookie = await login(server);
    await save(cookie, TODAY, draft({ eventText: "비밀 문장", categories: [{ categoryCode: "sadness" }, { categoryCode: "joy" }], resume: { step: "details", categoryCode: "joy" } }));
    server.clock.now += days(2);
    const today = await api("GET", "/api/today", { cookie });
    expect(today.body).toMatchObject({ date: "2026-10-16", timezone: SEOUL, dayStartHour: 4, entry: null });
    expect(today.body?.pastDraft).toMatchObject({ entryDate: TODAY, status: "draft", categories: ["sadness", "joy"], resume: { step: "details", categoryCode: "joy" } });
    expect(today.raw).not.toContain("비밀 문장");
  });
});

describe("F-09 오래된 판 번호는 새 글을 덮지 못한다", () => {
  it("오래된 판 번호의 저장·완료·지우기는 409이고 내용은 그대로", async () => {
    const cookie = await login(server);
    await save(cookie, TODAY, full());
    expect((await save(cookie, TODAY, full({ revision: 1, eventText: "두 번째" }))).status).toBe(200);
    const stale = await save(cookie, TODAY, full({ revision: 1, eventText: "오래된 화면" }));
    expect(stale.body).toEqual({ error: "revision_conflict", currentRevision: 2 });
    expect((await complete(cookie, TODAY, 1)).status).toBe(409);
    expect((await remove(cookie, TODAY, 1)).status).toBe(409);
    const entry = await read(cookie, TODAY);
    expect(entry.body).toMatchObject({ eventText: "두 번째", revision: 2, status: "draft" });
  });

  it("같은 판에서 출발한 두 저장이 겹치면 하나만 반영되고 딸린 행이 섞이지 않는다", async () => {
    const cookie = await login(server);
    await save(cookie, TODAY, draft({ categories: [{ categoryCode: "sadness", intensity: 3 }], emotions: [{ emotionCode: SAD[0] }] }));
    const a = draft({ eventText: "A", categories: [{ categoryCode: "sadness", intensity: 5 }], emotions: [{ emotionCode: SAD[1] }, { emotionCode: SAD[2] }], revision: 1 });
    const b = draft({ eventText: "B", categories: [{ categoryCode: "joy", intensity: 8 }], emotions: [{ emotionCode: JOY[1] }], praises: [{ slot: 2, text: "B의 칭찬" }], revision: 1 });
    const [ra, rb] = await Promise.all([save(cookie, TODAY, a), save(cookie, TODAY, b)]);
    expect([ra.status, rb.status].sort()).toEqual([200, 409]);
    const winner = ra.status === 200 ? a : b;
    const entry = (await read(cookie, TODAY)).body as { eventText: string; emotions: { emotionCode: string }[]; categories: { categoryCode: string }[]; praises: unknown[] };
    expect(entry.eventText).toBe(winner.eventText);
    expect(entry.emotions.map((item) => item.emotionCode)).toEqual((winner.emotions as { emotionCode: string }[]).map((item) => item.emotionCode));
    expect(entry.categories.map((item) => item.categoryCode)).toEqual((winner.categories as { categoryCode: string }[]).map((item) => item.categoryCode));
    expect(entry.praises.length).toBe(winner === b ? 1 : 0);
  });

  it("(결정적) B가 판 번호 확인을 지난 뒤 A가 먼저 끝나면, B의 부모·딸린 행 문장은 하나도 반영되지 않는다", async () => {
    const cookie = await login(server);
    await save(cookie, TODAY, draft({ categories: [{ categoryCode: "sadness", intensity: 3 }], emotions: [{ emotionCode: SAD[0] }] }));
    const held = heldBatchDb(server.db);
    const b = save(
      cookie,
      TODAY,
      draft({ revision: 1, eventText: "B", categories: [{ categoryCode: "joy", intensity: 8 }], emotions: [{ emotionCode: JOY[1] }], praises: [{ slot: 1, text: "B" }] }),
      { env: { DB: held.db } }
    );
    await held.reached; // B는 판 번호 1을 확인하고 batch 앞에 섰다
    const a = await save(cookie, TODAY, draft({ revision: 1, eventText: "A", categories: [{ categoryCode: "sadness", intensity: 5 }], emotions: [{ emotionCode: SAD[1] }] }));
    expect(a.status).toBe(200);
    held.release();
    expect((await b).body).toEqual({ error: "revision_conflict", currentRevision: 2 });
    const entry = (await read(cookie, TODAY)).body as { eventText: string; categories: { categoryCode: string }[]; emotions: { emotionCode: string }[]; praises: unknown[] };
    expect(entry.eventText).toBe("A");
    expect(entry.categories.map((item) => item.categoryCode)).toEqual(["sadness"]);
    expect(entry.emotions.map((item) => item.emotionCode)).toEqual([SAD[1]]);
    expect(entry.praises).toEqual([]);
  });

  it("(결정적) 완료·지우기도 확인을 지난 뒤 다른 기기가 먼저 고치면 반영되지 않는다", async () => {
    const cookie = await login(server);
    await save(cookie, TODAY, full());
    const heldComplete = heldBatchDb(server.db);
    const lateComplete = complete(cookie, TODAY, 1, { env: { DB: heldComplete.db } });
    await heldComplete.reached;
    expect((await save(cookie, TODAY, full({ revision: 1, reasonText: "다른 기기에서 고침" }))).status).toBe(200);
    heldComplete.release();
    expect((await lateComplete).body).toEqual({ error: "revision_conflict", currentRevision: 2 });
    const heldDelete = heldBatchDb(server.db);
    const lateDelete = remove(cookie, TODAY, 2, { env: { DB: heldDelete.db } });
    await heldDelete.reached;
    expect((await save(cookie, TODAY, full({ revision: 2, reasonText: "또 고침" }))).status).toBe(200);
    heldDelete.release();
    expect((await lateDelete).body).toEqual({ error: "revision_conflict", currentRevision: 3 });
    expect((await read(cookie, TODAY)).body).toMatchObject({ status: "draft", revision: 3, reasonText: "또 고침" });
    expect(await count("SELECT count(*) AS n FROM idempotency_records WHERE operation IN ('diary.complete', 'diary.delete')")).toBe(0);
  });
});

describe("F-10 같은 요청의 재전송은 한 번만 반영된다", () => {
  it("저장·완료·지우기를 같은 열쇠로 다시 보내면 첫 응답을 그대로 돌려주고 판 번호가 늘지 않는다", async () => {
    const cookie = await login(server);
    const createKey = newKey();
    const first = await save(cookie, TODAY, full(), { key: createKey });
    const again = await save(cookie, TODAY, full(), { key: createKey });
    expect(first.status).toBe(201);
    expect(again.status).toBe(201);
    expect(again.body).toEqual(first.body);
    expect(again.headers.get(REPLAYED_HEADER)).toBe("true");

    const editKey = newKey();
    const edit = await save(cookie, TODAY, full({ revision: 1, eventText: "고침" }), { key: editKey });
    expect((await save(cookie, TODAY, full({ revision: 1, eventText: "고침" }), { key: editKey })).body).toEqual(edit.body);
    expect((await read(cookie, TODAY)).body?.revision).toBe(2);

    const doneKey = newKey();
    const done = await complete(cookie, TODAY, 2, { key: doneKey });
    expect(done.status).toBe(200);
    expect((await complete(cookie, TODAY, 2, { key: doneKey })).body).toEqual(done.body);
    expect((await read(cookie, TODAY)).body?.revision).toBe(3);

    const deleteKey = newKey();
    const gone = await remove(cookie, TODAY, 3, { key: deleteKey });
    expect(gone.status).toBe(200);
    const goneAgain = await remove(cookie, TODAY, 3, { key: deleteKey });
    expect(goneAgain.status).toBe(200);
    expect(goneAgain.body).toEqual(gone.body);
    expect(await count("SELECT count(*) AS n FROM diary_entries")).toBe(0);
  });

  it("같은 열쇠로 다른 내용을 보내면 409, 다른 날짜에 써도 409", async () => {
    const cookie = await login(server);
    const key = newKey();
    await save(cookie, TODAY, full(), { key });
    expect((await save(cookie, TODAY, full({ eventText: "다른 내용" }), { key })).body).toEqual({ error: "idempotency_mismatch" });
    expect((await save(cookie, "2026-10-13", full(), { key })).status).toBe(409);
  });

  it("같은 열쇠의 같은 요청을 동시에 보내도 한 행, 모두 같은 응답", async () => {
    const cookie = await login(server);
    const key = newKey();
    const replies = await Promise.all(Array.from({ length: 4 }, () => save(cookie, TODAY, full(), { key })));
    expect(replies.map((reply) => reply.status)).toEqual([201, 201, 201, 201]);
    for (const reply of replies) expect(reply.body).toEqual(replies[0]?.body);
    expect(await count("SELECT count(*) AS n FROM diary_entries")).toBe(1);
    expect(await count("SELECT count(*) AS n FROM idempotency_records")).toBe(1);
  });

  it("(결정적) 같은 열쇠의 재전송이 첫 요청보다 늦게 batch에 닿아도 첫 응답을 그대로 받는다", async () => {
    const cookie = await login(server);
    const key = newKey();
    const held = heldBatchDb(server.db);
    const retry = save(cookie, TODAY, full(), { key, env: { DB: held.db } });
    await held.reached;
    const first = await save(cookie, TODAY, full(), { key });
    held.release();
    const late = await retry;
    expect(late.status).toBe(201);
    expect(late.body).toEqual(first.body);
    expect(late.headers.get(REPLAYED_HEADER)).toBe("true");
  });

  it("영수증에는 일기 글이 남지 않고, 24시간이 지나면 다음 쓰기에서 지워진다", async () => {
    const cookie = await login(server);
    await save(cookie, TODAY, full({ eventText: "영수증에 남으면 안 되는 문장" }));
    const rows = await server.db.prepare("SELECT response_json FROM idempotency_records").all<{ response_json: string }>();
    expect(rows.results).toHaveLength(1);
    expect(rows.results[0]?.response_json).not.toContain("영수증에 남으면 안 되는 문장");
    server.clock.now += days(1) + 1000;
    await save(cookie, TODAY, full({ revision: 1 }));
    expect(await count("SELECT count(*) AS n FROM idempotency_records")).toBe(1);
  });

  it("영수증 열쇠가 없거나 모양이 틀리면 400이고 아무것도 쓰지 않는다", async () => {
    const cookie = await login(server);
    expect((await save(cookie, TODAY, full(), { key: null })).body).toEqual({ error: "idempotency_key_required" });
    expect((await save(cookie, TODAY, full(), { key: "short" })).status).toBe(400);
    expect((await save(cookie, TODAY, full(), { key: "dots.are.not.allowed.here" })).status).toBe(400);
    expect((await save(cookie, TODAY, full(), { key: "k".repeat(65) })).status).toBe(400);
    expect(await count("SELECT count(*) AS n FROM diary_entries")).toBe(0);
  });
});

describe("F-17 하루 기준 시각 경계", () => {
  it("서울 03:59에는 전날, 04:00에는 그날이 '오늘'이다", async () => {
    server.clock.now = Date.parse("2026-10-14T18:59:59.000Z"); // 서울 10-15 03:59:59
    const cookie = await login(server);
    expect((await api("GET", "/api/today", { cookie })).body?.date).toBe("2026-10-14");
    expect((await save(cookie, "2026-10-15", full())).status).toBe(422);
    server.clock.now = Date.parse("2026-10-14T19:00:00.000Z"); // 서울 10-15 04:00
    expect((await api("GET", "/api/today", { cookie })).body?.date).toBe("2026-10-15");
    expect((await save(cookie, "2026-10-15", full())).status).toBe(201);
  });

  it("기준 시각을 바꿔도 이미 저장된 날짜는 그대로이고, 새 계산만 바뀐다", async () => {
    const cookie = await login(server);
    await save(cookie, TODAY, full());
    expect((await api("PUT", "/api/settings/day-start", { cookie, body: { dayStartHour: 6 } })).body).toEqual({ dayStartHour: 6 });
    server.clock.now = Date.parse("2026-10-14T20:30:00.000Z"); // 서울 10-15 05:30 — 기준 6시면 아직 10-14
    const today = await api("GET", "/api/today", { cookie });
    expect(today.body).toMatchObject({ date: TODAY, dayStartHour: 6 });
    expect(today.body?.entry).toMatchObject({ entryDate: TODAY });
    expect(await count("SELECT count(*) AS n FROM diary_entries WHERE entry_date = ?1", TODAY)).toBe(1);
    expect((await api("GET", "/api/settings/day-start", { cookie })).body).toEqual({ dayStartHour: 6 });
  });

  it("최초 완료일도 하루 기준 시각으로 센다(새벽 2시에 완료하면 전날)", async () => {
    const cookie = await login(server);
    await save(cookie, TODAY, full());
    server.clock.now = Date.parse("2026-10-14T17:00:00.000Z"); // 서울 10-15 02:00
    expect((await complete(cookie, TODAY, 1)).body?.firstCompletedLocalDate).toBe(TODAY);
  });

  it("기준 시각은 0~6 정수만", async () => {
    const cookie = await login(server);
    for (const dayStartHour of [7, -1, 2.5, "4", null]) {
      expect((await api("PUT", "/api/settings/day-start", { cookie, body: { dayStartHour } })).status, String(dayStartHour)).toBe(422);
    }
    expect((await api("PUT", "/api/settings/day-start", { cookie, body: { dayStartHour: 5, extra: 1 } })).status).toBe(400);
  });

  it("같은 순간이라도 있는 곳의 시계로 센다(U-2)", async () => {
    server.clock.now = Date.parse("2026-10-14T21:00:00.000Z"); // 파리 23:00(10-14), 서울 06:00(10-15)
    const cookie = await login(server);
    expect((await api("GET", "/api/today", { cookie, tz: "Europe/Paris" })).body?.date).toBe("2026-10-14");
    expect((await api("GET", "/api/today", { cookie })).body?.date).toBe("2026-10-15");
    expect((await save(cookie, "2026-10-14", full(), { tz: "Europe/Paris" })).status).toBe(201);
    expect((await read(cookie, "2026-10-14")).body?.timezone).toBe("Europe/Paris");
  });
});

describe("저장 내용", () => {
  it("계열만 고르고 세부 감정·크기는 아직인 임시저장과 쓰던 단계가 그대로 돌아온다", async () => {
    const cookie = await login(server);
    const body = draft({
      eventText: "있었던 일",
      categories: [{ categoryCode: "sadness" }, { categoryCode: "joy", intensity: 5 }],
      emotions: [{ emotionCode: JOY[0] }, { emotionCode: JOY[1], intensity: 9 }],
      resume: { step: "details", categoryCode: "sadness" }
    });
    expect((await save(cookie, TODAY, body)).status).toBe(201);
    const entry = (await read(cookie, TODAY)).body;
    expect(entry).toMatchObject({
      schemaVersion: "diary-entry-v2",
      status: "draft",
      categories: [
        { categoryCode: "sadness", intensity: null },
        { categoryCode: "joy", intensity: 5 }
      ],
      emotions: [
        { categoryCode: "joy", emotionCode: JOY[0], labelSnapshot: EMOTIONS.get(JOY[0] ?? "")?.label, intensity: 5, custom: false },
        { categoryCode: "joy", emotionCode: JOY[1], intensity: 9, custom: true }
      ],
      resume: { step: "details", categoryCode: "sadness" }
    });
  });

  it("대표 크기를 바꾸면 따로 정하지 않은 세부 감정만 따라가고, 이미 고른 감정의 표시명은 고쳐 쓰지 않는다", async () => {
    const cookie = await login(server);
    const emotions = [{ emotionCode: SAD[0] }, { emotionCode: SAD[1], intensity: 2 }];
    await save(cookie, TODAY, draft({ categories: [{ categoryCode: "sadness", intensity: 4 }], emotions }));
    await server.db.prepare("UPDATE diary_emotions SET label_snapshot = '그때의 표기' WHERE emotion_code = ?1").bind(SAD[0]).run();
    await save(cookie, TODAY, draft({ revision: 1, categories: [{ categoryCode: "sadness", intensity: 8 }], emotions }));
    const entry = (await read(cookie, TODAY)).body as { emotions: { intensity: number; labelSnapshot: string }[] };
    expect(entry.emotions.map((item) => item.intensity)).toEqual([8, 2]);
    expect(entry.emotions[0]?.labelSnapshot).toBe("그때의 표기");
  });

  it("빠진 감정·칭찬·계열은 지워지고 순서는 새 순서를 따른다", async () => {
    const cookie = await login(server);
    await save(
      cookie,
      TODAY,
      draft({
        categories: [{ categoryCode: "sadness" }, { categoryCode: "joy" }],
        emotions: [{ emotionCode: SAD[0] }, { emotionCode: JOY[0] }],
        praises: [{ slot: 1, text: "하나" }, { slot: 2, text: "둘" }]
      })
    );
    await save(cookie, TODAY, draft({ revision: 1, categories: [{ categoryCode: "joy" }], emotions: [{ emotionCode: JOY[1] }, { emotionCode: JOY[0] }], praises: [{ slot: 2, text: "둘!" }] }));
    const entry = (await read(cookie, TODAY)).body as { categories: unknown[]; emotions: { emotionCode: string }[]; praises: unknown[] };
    expect(entry.categories).toEqual([{ categoryCode: "joy", intensity: null }]);
    expect(entry.emotions.map((item) => item.emotionCode)).toEqual([JOY[1], JOY[0]]);
    expect(entry.praises).toEqual([{ slot: 2, text: "둘!" }]);
    expect(await count("SELECT count(*) AS n FROM diary_emotions")).toBe(2);
  });

  it("완료 조건이 모자라면 422와 빠진 단계, 아무것도 바뀌지 않는다", async () => {
    const cookie = await login(server);
    await save(cookie, TODAY, draft({ eventText: "일", categories: [{ categoryCode: "joy" }], emotions: [{ emotionCode: JOY[0] }] }));
    const reply = await complete(cookie, TODAY, 1);
    expect(reply.body).toEqual({ error: "incomplete", missing: ["intensity", "reason"] });
    expect((await read(cookie, TODAY)).body).toMatchObject({ status: "draft", revision: 1 });
  });

  it("완료된 기록을 고칠 때 완료 조건을 다시 본다 — 미충족이면 422로 그대로, 충족이면 완료인 채로 고친다", async () => {
    const cookie = await login(server);
    await save(cookie, TODAY, full());
    const done = await complete(cookie, TODAY, 1);
    expect((await complete(cookie, TODAY, 2)).body).toEqual({ error: "not_draft" });
    const blank = await save(cookie, TODAY, full({ revision: 2, reasonText: "  \n" }));
    expect(blank.body).toEqual({ error: "incomplete", missing: ["reason"] });
    const noDetails = await save(cookie, TODAY, full({ revision: 2, categories: [{ categoryCode: "joy", intensity: 7 }, { categoryCode: "sadness", intensity: 3 }] }));
    expect(noDetails.body).toEqual({ error: "incomplete", missing: ["details"] });
    const edited = await save(
      cookie,
      TODAY,
      full({ revision: 2, categories: [{ categoryCode: "sadness", intensity: 3 }], emotions: [{ emotionCode: SAD[0] }, { emotionCode: SAD[1] }], praises: [] })
    );
    expect(edited.status).toBe(200);
    const entry = (await read(cookie, TODAY)).body as { emotions: unknown[] };
    expect(entry).toMatchObject({ status: "completed", revision: 3, firstCompletedAt: done.body?.completedAt, praises: [] });
    expect(entry.emotions.length).toBe(2);
  });

  it("창고에서 어긋난 완료 기록(세부 감정 없는 계열)도 올바른 저장 한 번으로 고친다 — 어긋남이 모든 저장을 막지 않는다(SQL 검토 H1)", async () => {
    const cookie = await login(server);
    await save(cookie, TODAY, full());
    await complete(cookie, TODAY, 1);
    const id = (await read(cookie, TODAY)).body?.id;
    await server.db.prepare("INSERT INTO diary_categories (diary_id, category_code, display_order, intensity) VALUES (?1, 'sadness', 1, 3)").bind(id).run();
    const fixed = await save(cookie, TODAY, full({ revision: 2 }));
    expect(fixed.status).toBe(200);
    const entry = (await read(cookie, TODAY)).body as { status: string; categories: { categoryCode: string }[] };
    expect(entry.status).toBe("completed");
    expect(entry.categories.map((item) => item.categoryCode)).toEqual(["joy"]);
  });

  it("기록 하나 지우기 — 딸린 행까지 0, 다시 지우면 404", async () => {
    const cookie = await login(server);
    await save(cookie, TODAY, full({ gratitudes: [{ slot: 3, text: "고마운 일" }] }));
    await complete(cookie, TODAY, 1);
    expect((await remove(cookie, TODAY, 2)).body).toEqual({ deleted: true, entryDate: TODAY });
    expect((await read(cookie, TODAY)).status).toBe(404);
    for (const table of ["diary_entries", "diary_categories", "diary_emotions", "diary_reflections"]) {
      expect(await count(`SELECT count(*) AS n FROM ${table}`), table).toBe(0);
    }
    expect((await remove(cookie, TODAY, 2)).status).toBe(404);
    // 지운 날이 오늘이면 새로 쓸 수 있다(새 번호)
    expect((await save(cookie, TODAY, full())).status).toBe(201);
  });
});

describe("응답 모양", () => {
  it("기록 응답의 칸이 schemas/diary-entry.schema.json(v2)의 칸과 같다(값 검증기는 두지 않아 칸 이름과 필수만 대조한다)", async () => {
    const schema = JSON.parse(readFileSync(new URL("../../../schemas/diary-entry.schema.json", import.meta.url), "utf8"));
    const cookie = await login(server);
    await save(cookie, TODAY, full({ resume: { step: "letter" }, gratitudes: [{ slot: 1, text: "고마워" }] }));
    await complete(cookie, TODAY, 1);
    const entry = (await read(cookie, TODAY)).body as Record<string, unknown> & { categories: object[]; emotions: object[]; resume: object };
    expect(Object.keys(entry).sort()).toEqual(Object.keys(schema.properties).sort());
    expect(Object.keys(entry).sort()).toEqual([...schema.required].sort());
    expect(entry.schemaVersion).toBe(schema.properties.schemaVersion.const);
    expect(Object.keys(entry.categories[0] ?? {}).sort()).toEqual([...schema.properties.categories.items.required].sort());
    expect(Object.keys(entry.emotions[0] ?? {}).sort()).toEqual([...schema.properties.emotions.items.required].sort());
    expect(Object.keys(entry.resume).sort()).toEqual([...schema.properties.resume.oneOf[1].required].sort());
  });

  it("schema의 '비어 있지 않음' 패턴은 서버와 같은 판정이다(한글 글은 받고 공백만은 거부 — 셸이 역슬래시를 먹어 `S`로 깨진 적이 있다)", () => {
    const text = readFileSync(new URL("../../../schemas/diary-entry.schema.json", import.meta.url), "utf8");
    const patterns = [...text.matchAll(/"pattern": ("(?:[^"\\]|\\.)*")/g)].map((match) => JSON.parse(match[1] ?? '""') as string).filter((p) => !p.startsWith("^"));
    expect(patterns).toHaveLength(4);
    for (const pattern of patterns) {
      const nonBlank = new RegExp(pattern, "u");
      expect(nonBlank.test("고마운 일"), pattern).toBe(true);
      expect(nonBlank.test(" 　\n\t"), pattern).toBe(false);
    }
  });
});

describe("요청 검사", () => {
  it("날짜·시간대가 틀리면 400", async () => {
    const cookie = await login(server);
    expect((await save(cookie, "2026-13-01", full())).body).toEqual({ error: "invalid_date" });
    expect((await call(server, "PUT", "/api/diaries/2026-10-14%2F..", { cookie, body: full(), headers: { [IDEMPOTENCY_HEADER]: newKey(), [TIMEZONE_HEADER]: SEOUL } })).status).toBe(400);
    expect((await save(cookie, TODAY, full(), { tz: null })).body).toEqual({ error: "invalid_timezone" });
    expect((await save(cookie, TODAY, full(), { tz: "+09:00" })).status).toBe(400);
    expect((await api("GET", "/api/today", { cookie, tz: "Mars/Phobos" })).status).toBe(400);
  });

  it("가장 긴 정직한 글(칸마다 최대 글자 수, 이모지)은 저장되고, 한도를 넘는 본문은 413", async () => {
    const cookie = await login(server);
    const body = full({
      eventText: "😀".repeat(EVENT_MAX_CHARS),
      reasonText: "가".repeat(REASON_MAX_CHARS),
      praises: [1, 2, 3].map((slot) => ({ slot, text: "😀".repeat(REFLECTION_MAX_CHARS) })),
      gratitudes: [1, 2, 3].map((slot) => ({ slot, text: "😀".repeat(REFLECTION_MAX_CHARS) }))
    });
    expect(new TextEncoder().encode(JSON.stringify(body)).byteLength).toBeLessThan(DIARY_MAX_BODY_BYTES);
    expect((await save(cookie, TODAY, body)).status).toBe(201);
    expect((await read(cookie, TODAY)).body?.eventText).toBe("😀".repeat(EVENT_MAX_CHARS));
    const tooLong = await save(cookie, TODAY, full({ revision: 1, eventText: "가".repeat(EVENT_MAX_CHARS + 1) }));
    expect(tooLong.body).toEqual({ error: "invalid_text", field: "eventText" });
    const padded = JSON.stringify({ ...full({ revision: 1 }), eventText: "" }).replace('"eventText":""', `"eventText":"${"\\u0041".repeat(30_000)}"`);
    expect((await save(cookie, TODAY, padded)).status).toBe(413);
  });

  it("제어 문자가 든 글·고르지 않은 계열의 감정은 422(어느 칸인지 알린다)", async () => {
    const cookie = await login(server);
    expect((await save(cookie, TODAY, full({ reasonText: "a\u0000b" }))).body).toEqual({ error: "invalid_text", field: "reasonText" });
    expect((await save(cookie, TODAY, full({ emotions: [{ emotionCode: SAD[0] }] }))).body).toEqual({ error: "invalid_emotion", field: "emotions[0]" });
    expect(await count("SELECT count(*) AS n FROM diary_entries")).toBe(0);
  });

  it("완료·지우기 본문은 판 번호 하나뿐", async () => {
    const cookie = await login(server);
    await save(cookie, TODAY, full());
    expect((await api("POST", diaryCompletePath(TODAY), { cookie, body: { revision: 1, status: "completed" } })).status).toBe(400);
    expect((await api("DELETE", diaryPath(TODAY), { cookie, body: {} })).status).toBe(400);
  });

  it("로그인이 연장되는 날에도 저장 응답에 새 cookie가 실린다(연장은 그대로)", async () => {
    const cookie = await login(server);
    server.clock.now += days(1) + minutes(1);
    const reply = await save(cookie, TODAY.replace("14", "15"), full());
    expect(reply.status).toBe(201);
    expect(reply.cookie).toBeTruthy();
  });
});
