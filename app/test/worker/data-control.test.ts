// 관문 data-control의 서버 시험(EVAL_PLAN F-14·F-15, TASK-DATA-02 — DATA_MODEL §8, D-109·D-112 ⑤⑩).
// 내보내기·모든 기록 지우기(로그인 cookie)와 PC 백업 전용 경로(Bearer)를 실제 요청 모양으로 부르고 창고의 행을 직접 센다.
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { API, DELETE_ALL_CONFIRM, diaryCompletePath, diaryPath, IDEMPOTENCY_HEADER, TIMEZONE_HEADER } from "../../shared/api";
import { addDays, EXPORT_PAGE_SIZE, type ExportFile, type ExportPage } from "../../shared/diary";
import { EMOTIONS } from "../../shared/taxonomy";
import { cookieValue } from "../../worker/src/session";
import { call, heldBatchDb, login, type Reply, startServer, type TestServer } from "./harness";
import { syntheticEntry } from "./synthetic";

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

const TODAY = "2026-10-14";
const SEOUL = { [TIMEZONE_HEADER]: "Asia/Seoul" };
const JOY = [...EMOTIONS].filter(([, info]) => info.category === "joy").map(([code]) => code);
const token = randomBytes(32).toString("base64url");
const tokenHash = createHash("sha256").update(token).digest("hex");
const backupEnv = () => ({ BACKUP_TOKEN_HASH: tokenHash });
const bearer = (value = token) => ({ authorization: `Bearer ${value}` });
const key = () => ({ [IDEMPOTENCY_HEADER]: crypto.randomUUID() });

const body = (overrides: Record<string, unknown> = {}) => ({
  eventText: "내보내기 시험의 가짜 사건",
  reasonText: "가짜 이유",
  categories: [{ categoryCode: "joy", intensity: 6 }],
  emotions: [{ emotionCode: JOY[0] }, { emotionCode: JOY[1], intensity: 9 }],
  praises: [{ slot: 2, text: "가짜 칭찬" }],
  gratitudes: [],
  resume: { step: "letter" },
  ...overrides
});

async function writeToday(cookie: string, overrides: Record<string, unknown> = {}, complete = true): Promise<void> {
  const created = await call(server, "PUT", diaryPath(TODAY), { cookie, body: body(overrides), headers: { ...SEOUL, ...key() } });
  expect(created.status).toBe(201);
  if (complete) expect((await call(server, "POST", diaryCompletePath(TODAY), { cookie, body: { revision: 1 }, headers: { ...SEOUL, ...key() } })).status).toBe(200);
}

const exportAs = (cookie: string) => call(server, "GET", API.export, { cookie, headers: SEOUL });
const deleteAll = (cookie: string, extra: Record<string, unknown> = {}) => call(server, "DELETE", API.diaries, { cookie, body: { confirm: DELETE_ALL_CONFIRM, ...extra } });
const count = async (table: string) => (await server.db.prepare(`SELECT count(*) AS n FROM ${table}`).first<{ n: number }>())?.n ?? -1;
const fileOf = (reply: Reply) => reply.body as unknown as ExportFile;

/**
 * `heldBatchDb`의 문장 판 — SQL이 pattern에 맞는 문장의 `run`(또는 그 문장이 든 batch)을 놓을 때까지 붙잡는다(설정 저장용).
 */
function heldRunDb(db: D1Database, pattern: RegExp): { db: D1Database; reached: Promise<void>; release: () => void } {
  let signal = () => {};
  let release = () => {};
  const reached = new Promise<void>((resolve) => {
    signal = resolve;
  });
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const wrap = (statement: D1PreparedStatement, sql: string): D1PreparedStatement =>
    new Proxy(statement, {
      get(target, property) {
        if (property === "__target") return target;
        if (property === "__sql") return sql;
        if (property === "bind") return (...values: unknown[]) => wrap(target.bind(...values), sql);
        if (property === "run" && pattern.test(sql)) {
          return async () => {
            signal();
            await gate;
            return target.run();
          };
        }
        const value = Reflect.get(target, property);
        return typeof value === "function" ? value.bind(target) : value;
      }
    });
  const held = new Proxy(db, {
    get(target, property) {
      if (property === "prepare") return (sql: string) => wrap(target.prepare(sql), sql);
      if (property === "batch") {
        // batch에는 진짜 문장을 넘긴다 — 붙잡을 문장이 들어 있으면 batch째 붙잡는다
        return async (statements: D1PreparedStatement[]) => {
          const parts = statements as unknown as { __target?: D1PreparedStatement; __sql?: string }[];
          if (parts.some((part) => pattern.test(part.__sql ?? ""))) {
            signal();
            await gate;
          }
          return target.batch(parts.map((part, index) => part.__target ?? (statements[index] as D1PreparedStatement)));
        };
      }
      const value = Reflect.get(target, property);
      return typeof value === "function" ? value.bind(target) : value;
    }
  });
  return { db: held, reached, release };
}

async function otherOwnerCookie(): Promise<string> {
  const sid = crypto.randomUUID().replaceAll("-", "").slice(0, 22);
  const now = new Date(server.clock.now).toISOString();
  await server.db.prepare("INSERT INTO sessions (id, subject, key_login_at, issued_at, last_active_at, locked) VALUES (?1, 'other', ?2, ?2, ?2, 0)").bind(sid, now).run();
  return cookieValue(server.env.SESSION_SECRET ?? "", sid, "other", server.clock.now);
}

describe("F-15 내보내기", () => {
  it("주인의 기록만, 파일 형식(schemaVersion·하루 기준 시각·부를 이름)과 기록 모양 그대로, 비밀값·내부 값 없음", async () => {
    const cookie = await login(server);
    await call(server, "PUT", API.profile, { cookie, body: { name: "가짜 이름" } });
    await call(server, "PUT", API.dayStart, { cookie, body: { dayStartHour: 5 } });
    await writeToday(cookie);
    const allowlist = server.env.OWNER_ALLOWLIST;
    server.env.OWNER_ALLOWLIST = "owner,other";
    try {
      const other = await otherOwnerCookie();
      await call(server, "PUT", diaryPath(TODAY), { cookie: other, body: body({ eventText: "다른 사람의 글" }), headers: { ...SEOUL, ...key() } });
    } finally {
      server.env.OWNER_ALLOWLIST = allowlist;
    }
    const reply = await exportAs(cookie);
    expect(reply.status).toBe(200);
    expect(reply.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(reply.headers.get("cache-control")).toBe("no-store");
    const file = fileOf(reply);
    expect(file).toMatchObject({ schemaVersion: "emotion-diary-export-v1", timezone: "Asia/Seoul", dayStartHour: 5, displayName: "가짜 이름" });
    expect(file.diaries).toHaveLength(1);
    expect(file.diaries[0]).toMatchObject({ entryDate: TODAY, status: "completed", eventText: "내보내기 시험의 가짜 사건", praises: [{ slot: 2, text: "가짜 칭찬" }] });
    expect(reply.raw).not.toContain("다른 사람의 글");
    for (const secret of [server.env.ACCESS_KEY_HASH, server.env.SESSION_SECRET, server.env.APP_LOCK_SECRET, server.key]) expect(reply.raw).not.toContain(secret);
    expect(reply.raw).not.toMatch(/owner_?key|ownerKey|write_?token|writeToken|app_?lock|appLock/i);
    // 같은 응답이 schemas/export.schema.json의 칸과 같다(값 검증기는 두지 않아 칸 이름·필수만)
    const schema = JSON.parse(readFileSync(new URL("../../../schemas/export.schema.json", import.meta.url), "utf8"));
    const { next, ...fields } = file as ExportPage;
    expect(next).toBeNull();
    expect(Object.keys(fields).sort()).toEqual([...schema.required].sort());
    for (const name of Object.keys(fields)) expect(schema.properties).toHaveProperty(name);
  });

  it("100편씩 조각으로 준다 — next로 이어 받으면 빠짐·겹침 없이 날짜순, 틀린 after는 400", async () => {
    const cookie = await login(server);
    const entries = Array.from({ length: 250 }, (_, index) => syntheticEntry(addDays("2026-10-13", -index), index));
    for (let start = 0; start < entries.length; start += 125) {
      expect((await call(server, "POST", API.backupImport, { body: { diaries: entries.slice(start, start + 125) }, headers: bearer(), env: backupEnv(), csrf: false })).status).toBe(200);
    }
    const sizes: number[] = [];
    const dates: string[] = [];
    let after: string | null = null;
    do {
      const page = (await call(server, "GET", after ? `${API.export}?after=${after}` : API.export, { cookie, headers: SEOUL })).body as unknown as ExportPage;
      sizes.push(page.diaries.length);
      dates.push(...page.diaries.map((item) => item.entryDate));
      after = page.next;
    } while (after);
    expect(sizes).toEqual([EXPORT_PAGE_SIZE, EXPORT_PAGE_SIZE, 50]);
    expect(dates).toEqual(entries.map((item) => item.entryDate).sort());
    expect((await call(server, "GET", `${API.export}?after=2026-13-01`, { cookie, headers: SEOUL })).status).toBe(400);
    // 백업 경로도 같은 조각이다
    const backupFirst = (await call(server, "GET", API.backupExport, { headers: { ...SEOUL, ...bearer() }, env: backupEnv() })).body as unknown as ExportPage;
    expect(backupFirst.diaries).toHaveLength(EXPORT_PAGE_SIZE);
    expect(backupFirst.next).toBe(dates[EXPORT_PAGE_SIZE - 1]);
  });

  it("기록이 없으면 빈 목록과 기본 설정, 로그인 없으면 401, 잠긴 세션은 423, 시간대 없으면 400", async () => {
    const cookie = await login(server);
    expect(fileOf(await exportAs(cookie))).toMatchObject({ diaries: [], dayStartHour: 4, displayName: null });
    expect((await call(server, "GET", API.export, { cookie })).status).toBe(400);
    expect((await call(server, "GET", API.export, { headers: SEOUL })).status).toBe(401);
    await call(server, "PUT", API.appLock, { cookie, body: { pin: "4826" } });
    await call(server, "POST", API.lock, { cookie });
    const locked = await exportAs(cookie);
    expect(locked.status).toBe(423);
  });

  it("임시저장도 들어가고 크기 미정·쓰던 단계가 그대로다", async () => {
    const cookie = await login(server);
    await writeToday(cookie, { categories: [{ categoryCode: "joy" }], emotions: [{ emotionCode: JOY[0] }], resume: { step: "intensity" } }, false);
    const entry = fileOf(await exportAs(cookie)).diaries[0];
    expect(entry).toMatchObject({ status: "draft", categories: [{ categoryCode: "joy", intensity: null }], resume: { step: "intensity", categoryCode: null } });
  });
});

describe("F-14 모든 기록 지우기", () => {
  it("확인 문구가 다르면 422이고 아무것도 지우지 않는다(공백 하나 달라도)", async () => {
    const cookie = await login(server);
    await writeToday(cookie);
    for (const confirm of ["모든 기록 삭제 ", "모든기록 삭제", "delete"]) {
      expect((await call(server, "DELETE", API.diaries, { cookie, body: { confirm } })).body).toEqual({ error: "confirm_mismatch" });
    }
    expect((await call(server, "DELETE", API.diaries, { cookie, body: {} })).status).toBe(400);
    expect((await call(server, "DELETE", API.diaries, { cookie, body: { confirm: DELETE_ALL_CONFIRM, extra: 1 } })).status).toBe(400);
    expect(await count("diary_entries")).toBe(1);
  });

  it("기록·딸린 행·영수증·부를 이름·하루 기준 시각·다른 기기 로그인을 지우고, 이 기기는 로그인된 채 처음 상태가 된다", async () => {
    const cookie = await login(server);
    const second = await login(server); // 다른 기기
    await call(server, "PUT", API.profile, { cookie, body: { name: "가짜 이름" } });
    await call(server, "PUT", API.dayStart, { cookie, body: { dayStartHour: 6 } });
    await writeToday(cookie);
    expect((await deleteAll(cookie)).body).toEqual({ deleted: true });
    for (const table of ["diary_entries", "diary_categories", "diary_emotions", "diary_reflections", "idempotency_records", "owner_settings"]) {
      expect(await count(table), table).toBe(0);
    }
    expect((await call(server, "GET", API.session, { cookie })).body).toMatchObject({ authenticated: true, hasName: false, appLock: false, locked: false });
    expect((await call(server, "GET", API.profile, { cookie: second })).status).toBe(401);
    expect(fileOf(await exportAs(cookie))).toMatchObject({ diaries: [], dayStartHour: 4, displayName: null });
    // 같은 요청을 다시 보내도 같은 결과다
    expect((await deleteAll(cookie)).status).toBe(200);
    // 오늘이면 다시 새로 쓸 수 있다
    expect((await call(server, "PUT", diaryPath(TODAY), { cookie, body: body(), headers: { ...SEOUL, ...key() } })).status).toBe(201);
  });

  it("다른 주인의 기록은 지우지 않는다", async () => {
    const cookie = await login(server);
    await writeToday(cookie);
    const allowlist = server.env.OWNER_ALLOWLIST;
    server.env.OWNER_ALLOWLIST = "owner,other";
    try {
      const other = await otherOwnerCookie();
      await call(server, "PUT", diaryPath(TODAY), { cookie: other, body: body(), headers: { ...SEOUL, ...key() } });
      expect((await deleteAll(other)).status).toBe(200);
    } finally {
      server.env.OWNER_ALLOWLIST = allowlist;
    }
    expect(fileOf(await exportAs(cookie)).diaries).toHaveLength(1);
  });

  it("앱 잠금을 켰으면 비밀번호가 맞아야 지운다 — 없으면 422, 틀리면 남은 횟수, 맞으면 잠금 설정까지 지운다", async () => {
    const cookie = await login(server);
    await call(server, "PUT", API.appLock, { cookie, body: { pin: "4826" } });
    await writeToday(cookie);
    expect((await deleteAll(cookie)).body).toEqual({ error: "pin_required" });
    expect((await deleteAll(cookie, { pin: "0000" })).body).toEqual({ error: "wrong_pin", remaining: 4 });
    expect(await count("diary_entries")).toBe(1);
    expect((await deleteAll(cookie, { pin: "4826" })).status).toBe(200);
    expect(await count("owner_settings")).toBe(0);
    expect((await call(server, "GET", API.session, { cookie })).body).toMatchObject({ appLock: false });
  });

  it("로그인 없이 401, 표식 없이 403, 잠긴 세션은 423", async () => {
    expect((await call(server, "DELETE", API.diaries, { body: { confirm: DELETE_ALL_CONFIRM } })).status).toBe(401);
    const cookie = await login(server);
    expect((await call(server, "DELETE", API.diaries, { cookie, body: { confirm: DELETE_ALL_CONFIRM }, csrf: false })).status).toBe(403);
    await call(server, "PUT", API.appLock, { cookie, body: { pin: "4826" } });
    await call(server, "POST", API.lock, { cookie });
    expect((await deleteAll(cookie, { pin: "4826" })).status).toBe(423);
  });

  // 세션 확인을 이미 지나 날아오던 쓰기가 지우기 batch 뒤에 들어오는 경쟁(PR #43 리뷰). 쓰기를 붙잡아 두고 그 사이에 지운 뒤 놓아
  // '지우기가 끝난 뒤 묵은 쓰기'를 결정적으로 만든다 — 행을 새로 만드는 쓰기는 liveSession(마이그레이션 0008)에 막혀야 한다.
  it.each([
    ["다른 기기", true],
    ["이 기기의 다른 탭(같은 cookie)", false]
  ])("(결정적) %s의 새 기록 만들기가 지우기 뒤에 들어와도 기록을 되살리지 못한다(401)", async (_name, otherDevice) => {
    const cookie = await login(server);
    const writer = otherDevice ? await login(server) : cookie;
    const held = heldBatchDb(server.db);
    const pending = call(server, "PUT", diaryPath(TODAY), { cookie: writer, body: body(), headers: { ...SEOUL, ...key() }, env: { DB: held.db } });
    await held.reached;
    expect((await deleteAll(cookie)).status).toBe(200);
    held.release();
    expect((await pending).status).toBe(401);
    for (const table of ["diary_entries", "diary_categories", "diary_emotions", "diary_reflections", "idempotency_records", "owner_settings"]) {
      expect(await count(table), table).toBe(0);
    }
    // 지운 기기는 로그인된 채 처음 상태다 — 다음 요청은 새 세대로 그대로 쓴다
    expect((await call(server, "GET", API.profile, { cookie })).body).toEqual({ name: null });
    await writeToday(cookie);
    expect(await count("diary_entries")).toBe(1);
  });

  it.each([
    ["부를 이름", API.profile, { name: "묵은 이름" }],
    ["하루 기준 시각", API.dayStart, { dayStartHour: 6 }],
    ["앱 잠금", API.appLock, { pin: "4826" }]
  ])("(결정적) 다른 기기의 %s 저장이 지우기 뒤에 들어와도 설정 행을 되살리지 못한다(401)", async (_name, path, payload) => {
    const cookie = await login(server);
    const other = await login(server);
    const held = heldRunDb(server.db, /INSERT INTO owner_settings/);
    const pending = call(server, "PUT", path, { cookie: other, body: payload, env: { DB: held.db } });
    await held.reached;
    expect((await deleteAll(cookie)).status).toBe(200);
    held.release();
    expect((await pending).status).toBe(401);
    expect(await count("owner_settings")).toBe(0);
  });
});

describe("PC 백업 전용 경로(D-109)", () => {
  it("백업 토큰 secret이 없으면 경로가 없는 것과 같다(404), 토큰이 없거나 틀리면 401, cookie로는 들어가지 못한다", async () => {
    expect((await call(server, "GET", API.backupExport, { headers: { ...SEOUL, ...bearer() } })).status).toBe(404);
    // secret이 없으면 맞지 않는 방식도 405가 아니라 404 — 경로가 있다는 것도 알리지 않는다
    expect((await call(server, "PUT", API.backupExport, { headers: { ...SEOUL, ...bearer() }, csrf: false })).status).toBe(404);
    expect((await call(server, "GET", API.backupExport, { headers: { ...SEOUL, ...bearer() }, env: { BACKUP_TOKEN_HASH: "not-a-hash" } })).status).toBe(404);
    const env = backupEnv();
    expect((await call(server, "GET", API.backupExport, { headers: SEOUL, env })).status).toBe(401);
    expect((await call(server, "GET", API.backupExport, { headers: { ...SEOUL, ...bearer(randomBytes(32).toString("base64url")) }, env })).status).toBe(401);
    const cookie = await login(server);
    expect((await call(server, "GET", API.backupExport, { cookie, headers: SEOUL, env })).status).toBe(401);
    expect((await call(server, "PUT", API.backupExport, { headers: { ...SEOUL, ...bearer() }, env, csrf: false })).status).toBe(405);
    expect((await call(server, "GET", "/api/backup/nothing", { headers: bearer(), env })).status).toBe(404);
  });

  it("백업 내보내기는 cookie 내보내기와 같은 파일이고 cookie를 심지 않는다", async () => {
    const cookie = await login(server);
    await writeToday(cookie);
    const viaCookie = fileOf(await exportAs(cookie));
    const reply = await call(server, "GET", API.backupExport, { headers: { ...SEOUL, ...bearer() }, env: backupEnv() });
    expect(reply.status).toBe(200);
    expect(reply.cookie).toBeNull();
    expect({ ...fileOf(reply), exportedAt: "" }).toEqual({ ...viaCookie, exportedAt: "" });
  });

  it("지우고 다시 넣으면 내보내기가 같다(복원 왕복), 이미 있는 날짜는 덮지 않고 건너뛴다, 설정은 행이 없을 때만 되살린다", async () => {
    const cookie = await login(server);
    await call(server, "PUT", API.profile, { cookie, body: { name: "가짜 이름" } });
    await call(server, "PUT", API.dayStart, { cookie, body: { dayStartHour: 3 } });
    await writeToday(cookie);
    // 지난 날의 기록 둘은 다시 넣기로 만든다(새로 만들기는 오늘만이라)
    const seed = fileOf(await exportAs(cookie));
    const today = seed.diaries[0];
    if (!today) throw new Error("no entry");
    const past = [
      { ...today, id: crypto.randomUUID(), entryDate: "2026-10-12", firstCompletedLocalDate: "2026-10-12" },
      { ...today, id: crypto.randomUUID(), entryDate: "2026-10-13", status: "draft" as const, firstCompletedAt: null, firstCompletedLocalDate: null, completedAt: null, resume: { step: "reason" as const, categoryCode: null } }
    ];
    const env = backupEnv();
    const first = await call(server, "POST", API.backupImport, { body: { diaries: past }, headers: bearer(), env, csrf: false });
    expect(first.body).toEqual({ inserted: 2, skipped: [], settingsRestored: false });
    const before = fileOf(await exportAs(cookie));
    expect(before.diaries.map((item) => item.entryDate)).toEqual(["2026-10-12", "2026-10-13", TODAY]);

    expect((await deleteAll(cookie)).status).toBe(200);
    const restore = await call(server, "POST", API.backupImport, {
      body: { diaries: before.diaries, settings: { displayName: before.displayName, dayStartHour: before.dayStartHour } },
      headers: bearer(),
      env,
      csrf: false
    });
    expect(restore.body).toEqual({ inserted: 3, skipped: [], settingsRestored: true });
    const after = fileOf(await exportAs(cookie));
    expect({ ...after, exportedAt: "" }).toEqual({ ...before, exportedAt: "" });

    // 다시 보내면 모두 건너뛰고, 지금 설정을 덮지 않는다
    await call(server, "PUT", API.profile, { cookie, body: { name: "새 이름" } });
    const again = await call(server, "POST", API.backupImport, { body: { diaries: before.diaries, settings: { displayName: "옛 이름", dayStartHour: 2 } }, headers: bearer(), env, csrf: false });
    expect(again.body).toEqual({ inserted: 0, skipped: ["2026-10-12", "2026-10-13", TODAY], settingsRestored: false });
    expect(fileOf(await exportAs(cookie))).toMatchObject({ displayName: "새 이름", dayStartHour: 3 });
    // 되살린 완료 기록도 창고 규칙을 지킨다 — 고치기·완료 조건이 그대로 돈다
    expect((await call(server, "PUT", diaryPath("2026-10-12"), { cookie, body: body({ revision: today.revision, reasonText: " " }), headers: { ...SEOUL, ...key() } })).body).toEqual({
      error: "incomplete",
      missing: ["reason"]
    });
  });

  it("조각의 기록 하나라도 틀리면 아무것도 넣지 않는다(어느 칸인지 알린다)", async () => {
    const cookie = await login(server);
    await writeToday(cookie);
    const entry = fileOf(await exportAs(cookie)).diaries[0];
    if (!entry) throw new Error("no entry");
    expect((await deleteAll(cookie)).status).toBe(200);
    const env = backupEnv();
    const cases: [Record<string, unknown>, string][] = [
      [{ ...entry, eventText: "a\u0000b" }, "eventText"],
      [{ ...entry, emotions: [] }, "status"],
      [{ ...entry, entryDate: "2026-02-30" }, "entryDate"],
      [{ ...entry, ownerKey: "other" }, "keys"],
      [{ ...entry, emotions: [{ ...entry.emotions[0], categoryCode: "sadness" }] }, "emotions"],
      [{ ...entry, createdAt: "2026-10-14 00:00" }, "createdAt"],
      // JS는 여섯 자리 연도도 ISO로 만들지만 창고의 strftime CHECK는 막는다 — 검사가 먼저 422로(500이 되지 않게)
      [{ ...entry, createdAt: "+010000-01-01T00:00:00.000Z" }, "createdAt"],
      // 접두어 9자 + 세부 55자 = 65자: 세부 모양 검사는 통과하지만 창고의 emotion_code CHECK(64자)를 넘는다
      [
        {
          ...entry,
          status: "draft",
          firstCompletedAt: null,
          firstCompletedLocalDate: null,
          completedAt: null,
          resume: null,
          categories: [{ categoryCode: "enjoyment", intensity: null }],
          emotions: [{ categoryCode: "enjoyment", emotionCode: `enjoyment-${"a".repeat(55)}`, labelSnapshot: "가짜", intensity: null, custom: false }]
        },
        "emotions"
      ]
    ];
    for (const [bad, field] of cases) {
      const reply = await call(server, "POST", API.backupImport, { body: { diaries: [{ ...entry, entryDate: "2026-10-01", id: crypto.randomUUID() }, bad] }, headers: bearer(), env, csrf: false });
      expect(reply.body, field).toEqual({ error: "invalid_import", field: `diaries[1].${field}` });
    }
    const twice = await call(server, "POST", API.backupImport, { body: { diaries: [entry, { ...entry, id: crypto.randomUUID() }] }, headers: bearer(), env, csrf: false });
    expect(twice.body).toEqual({ error: "invalid_import", field: "diaries[1].entryDate" });
    // 같은 id가 날짜만 달리 두 번 — 딸린 행이 부딪혀 500이 되기 전에 422(PR #43 리뷰)
    const sameId = await call(server, "POST", API.backupImport, { body: { diaries: [entry, { ...entry, entryDate: "2026-10-02", firstCompletedLocalDate: "2026-10-02" }] }, headers: bearer(), env, csrf: false });
    expect(sameId.body).toEqual({ error: "invalid_import", field: "diaries[1].id" });
    expect(await count("diary_entries")).toBe(0);
  });

  it("다시 넣기 본문 한도를 넘으면 413", async () => {
    const big = JSON.stringify({ diaries: [], pad: "x".repeat(1024 * 1024) });
    expect((await call(server, "POST", API.backupImport, { body: big, headers: bearer(), env: backupEnv(), csrf: false })).status).toBe(413);
  });
});
