// 돌아보기 읽기 경로의 서버 시험(TASK-REFLECT-01 R-2, A-7 — 관문 reflection-core의 F-11·F-12·deterministic-statistics·timezone-boundaries 중 서버 쪽).
// 합성 기록(app/scripts/synthetic.mjs)을 백업 다시 넣기 경로로 넣고, 달력·통계 재료 경로를 실제 요청 모양으로 부른다.
import { createHash, randomBytes } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { syntheticDiaries } from "../../scripts/synthetic.mjs";
import { API, calendarPath, diaryCompletePath, diaryPath, IDEMPOTENCY_HEADER, statsPath, TIMEZONE_HEADER } from "../../shared/api";
import type { CalendarMonth, DiaryEntryView } from "../../shared/diary";
import { CATEGORY_CODES, EMOTIONS } from "../../shared/taxonomy";
import { type StatsMaterial, summarize } from "../../shared/stats";
import { assembleStats } from "../../worker/src/routes/reflection";
import { cookieValue } from "../../worker/src/session";
import { call, login, START, startServer, type TestServer } from "./harness";

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

const TODAY = "2026-10-14"; // START(2026-10-14T00:00Z) = 서울 09:00, 하루 기준 4시
const SEOUL = { [TIMEZONE_HEADER]: "Asia/Seoul" };
const token = randomBytes(32).toString("base64url");
const backupEnv = () => ({ BACKUP_TOKEN_HASH: createHash("sha256").update(token).digest("hex") });
const key = () => ({ [IDEMPOTENCY_HEADER]: crypto.randomUUID() });
const JOY = [...EMOTIONS].filter(([, info]) => info.category === "joy").map(([code]) => code);

async function seed(entries: DiaryEntryView[]): Promise<void> {
  const reply = await call(server, "POST", API.backupImport, { body: { diaries: entries }, headers: { authorization: `Bearer ${token}` }, env: backupEnv(), csrf: false });
  expect(reply.status, reply.raw).toBe(200);
}

const calendar = (cookie: string, month: string, headers: Record<string, string> = SEOUL) => call(server, "GET", calendarPath(month), { cookie, headers });
const stats = (cookie: string, days: number | string, headers: Record<string, string> = SEOUL) =>
  call(server, "GET", `/api/stats/${days}`, { cookie, headers });

async function otherOwnerCookie(): Promise<string> {
  const sid = crypto.randomUUID().replaceAll("-", "").slice(0, 22);
  const now = new Date(server.clock.now).toISOString();
  await server.db.prepare("INSERT INTO sessions (id, subject, key_login_at, issued_at, last_active_at, locked) VALUES (?1, 'other', ?2, ?2, ?2, 0)").bind(sid, now).run();
  return cookieValue(server.env.SESSION_SECRET ?? "", sid, "other", server.clock.now);
}

async function writeToday(cookie: string, intensity: number): Promise<void> {
  const body = { eventText: "가짜 사건", reasonText: "가짜 이유", categories: [{ categoryCode: "joy", intensity }], emotions: [{ emotionCode: JOY[0] }], praises: [], gratitudes: [], resume: { step: "letter" } };
  expect((await call(server, "PUT", diaryPath(TODAY), { cookie, body, headers: { ...SEOUL, ...key() } })).status).toBe(201);
  expect((await call(server, "POST", diaryCompletePath(TODAY), { cookie, body: { revision: 1 }, headers: { ...SEOUL, ...key() } })).status).toBe(200);
}

describe("GET /api/calendar/:month", () => {
  it("그 달에 기록이 있는 날의 상태만 — 글·감정 없음, 날짜순, 서버가 센 오늘", async () => {
    const entries = syntheticDiaries(TODAY, 60);
    await seed(entries);
    const cookie = await login(server);
    const reply = await calendar(cookie, "2026-10");
    expect(reply.status).toBe(200);
    const body = reply.body as unknown as CalendarMonth;
    expect(body.month).toBe("2026-10");
    expect(body.today).toBe(TODAY);
    const expected = entries.filter((entry) => entry.entryDate.startsWith("2026-10")).map((entry) => ({ date: entry.entryDate, status: entry.status }));
    expect(body.days).toEqual(expected);
    expect(body.days.some((day) => day.status === "draft")).toBe(true);
    expect(reply.raw).not.toMatch(/가짜|eventText|reasonText|emotion|owner/);
  });

  it("기록이 없는 달·미래 달은 빈 목록, 모양이 틀린 달은 400, 시간대가 없으면 400, 로그인 전 401", async () => {
    const cookie = await login(server);
    expect((await calendar(cookie, "2030-01")).body).toMatchObject({ month: "2030-01", days: [] });
    for (const bad of ["2026-13", "2026-1", "2026-00", "abcd-ef", "0999-01"]) expect((await calendar(cookie, bad)).status, bad).toBe(400);
    expect((await calendar(cookie, "2026-10", {})).status).toBe(400);
    expect((await call(server, "GET", calendarPath("2026-10"), { headers: SEOUL })).status).toBe(401);
  });
});

describe("GET /api/stats/:days", () => {
  it("이번 기간 + 바로 앞 같은 길이 기간의 완료 기록만, 세부 감정·크기만(글 없음), 첫 완료 날짜는 최근부터(F-12)", async () => {
    const entries = syntheticDiaries(TODAY, 90, { seed: 11 });
    await seed(entries);
    const cookie = await login(server);
    const reply = await stats(cookie, 30);
    expect(reply.status).toBe(200);
    const body = reply.body as unknown as StatsMaterial;
    expect(body.today).toBe(TODAY);
    expect(body.days).toBe(30);
    const from = "2026-08-16"; // 오늘 − 59일
    const completed = entries.filter((entry) => entry.status === "completed" && entry.entryDate >= from);
    expect(body.entries.map((entry) => entry.date)).toEqual(completed.map((entry) => entry.entryDate));
    const first = completed[0] as DiaryEntryView;
    expect(body.entries[0]?.emotions).toEqual(first.emotions.map((emotion) => ({ code: emotion.emotionCode, category: emotion.categoryCode, intensity: emotion.intensity })));
    const firsts = entries.filter((entry) => entry.status === "completed").map((entry) => entry.firstCompletedLocalDate);
    expect(body.firstCompletedDates).toEqual([...new Set(firsts)].sort().reverse());
    expect(reply.raw).not.toMatch(/가짜|eventText|reasonText|label|owner/);
  });

  it("같은 기록이면 같은 재료·같은 통계(deterministic-statistics), 빈 날은 0이 아니라 없음", async () => {
    await seed(syntheticDiaries(TODAY, 60));
    const cookie = await login(server);
    const one = (await stats(cookie, 7)).body as unknown as StatsMaterial;
    const two = (await stats(cookie, 7)).body as unknown as StatsMaterial;
    expect(two).toEqual(one);
    const summary = summarize(one, CATEGORY_CODES);
    expect(summarize(two, CATEGORY_CODES)).toEqual(summary);
    for (const friend of summary.friends) for (const day of friend.current.days) expect(day.value).toBeGreaterThan(0);
  });

  it("기간은 7·30만, 시간대가 없으면 400, 로그인 전 401", async () => {
    const cookie = await login(server);
    for (const bad of ["14", "0", "abc", "07", "7.0"]) expect((await stats(cookie, bad)).status, bad).toBe(400);
    expect((await stats(cookie, 7, {})).status).toBe(400);
    expect((await call(server, "GET", statsPath(7), { headers: SEOUL })).status).toBe(401);
  });
});

describe("주인과 시간", () => {
  it("다른 사람의 기록은 달력·통계에 나오지 않는다(서로)", async () => {
    const allowlist = server.env.OWNER_ALLOWLIST;
    server.env.OWNER_ALLOWLIST = "owner,other";
    try {
      const mine = await login(server);
      const other = await otherOwnerCookie();
      await writeToday(other, 7);
      expect(((await calendar(mine, "2026-10")).body as unknown as CalendarMonth).days).toEqual([]);
      expect(((await stats(mine, 7)).body as unknown as StatsMaterial).entries).toEqual([]);
      await writeToday(mine, 3);
      const theirs = (await stats(other, 7)).body as unknown as StatsMaterial;
      expect(theirs.entries).toHaveLength(1);
      expect(theirs.entries[0]?.emotions[0]?.intensity).toBe(7);
    } finally {
      server.env.OWNER_ALLOWLIST = allowlist;
    }
  });

  it("완료한 기록을 고치면 다음 통계에 바로 반영된다 — 미리 계산해 두는 값이 없다(F-11)", async () => {
    const cookie = await login(server);
    await writeToday(cookie, 4);
    const before = summarize((await stats(cookie, 7)).body as unknown as StatsMaterial, CATEGORY_CODES);
    expect(before.friends.find((friend) => friend.code === "joy")?.current.days).toEqual([{ date: TODAY, value: 4 }]);
    const current = (await call(server, "GET", diaryPath(TODAY), { cookie, headers: SEOUL })).body as unknown as DiaryEntryView;
    const edit = { revision: current.revision, eventText: "가짜 사건", reasonText: "가짜 이유", categories: [{ categoryCode: "joy", intensity: 9 }], emotions: [{ emotionCode: JOY[0] }], praises: [], gratitudes: [], resume: { step: "letter" } };
    expect((await call(server, "PUT", diaryPath(TODAY), { cookie, body: edit, headers: { ...SEOUL, ...key() } })).status).toBe(200);
    const after = summarize((await stats(cookie, 7)).body as unknown as StatsMaterial, CATEGORY_CODES);
    expect(after.friends.find((friend) => friend.code === "joy")?.current.days).toEqual([{ date: TODAY, value: 9 }]);
  });

  it("'오늘'은 하루 기준 시각과 있는 곳의 시계로 센다 — 서울 03:59는 전날, 04:00은 그날, 날짜선 건너편은 다르다(timezone-boundaries)", async () => {
    const cookie = await login(server);
    server.clock.now = Date.parse("2026-10-14T18:59:00.000Z"); // 서울 10/15 03:59
    expect(((await stats(cookie, 7)).body as unknown as StatsMaterial).today).toBe("2026-10-14");
    expect(((await calendar(cookie, "2026-10")).body as unknown as CalendarMonth).today).toBe("2026-10-14");
    server.clock.now = Date.parse("2026-10-14T19:00:00.000Z"); // 서울 10/15 04:00
    expect(((await stats(cookie, 7)).body as unknown as StatsMaterial).today).toBe("2026-10-15");
    expect(((await stats(cookie, 7, { [TIMEZONE_HEADER]: "Etc/GMT+12" })).body as unknown as StatsMaterial).today).toBe("2026-10-14"); // UTC−12 07:00
    server.clock.now = START;
  });
});

describe("통계 재료 CPU(TASK-REFLECT-01 R-6 — 무료 10ms, export-cpu-measured와 같은 방식)", () => {
  it("합성 3년치에서 30일 재료 한 번의 요청 CPU(이 PC의 Node)와 화면 계산(summarize) 시간", async () => {
    const entries = syntheticDiaries(TODAY, 1095, { seed: 5, recordRate: 0.9 });
    for (let start = 0; start < entries.length; start += 100) await seed(entries.slice(start, start + 100));
    const cookie = await login(server);
    const runs: number[] = [];
    let material: StatsMaterial | null = null;
    for (let run = 0; run < 7; run += 1) {
      const before = process.cpuUsage();
      const reply = await stats(cookie, 30);
      const used = process.cpuUsage(before);
      expect(reply.status).toBe(200);
      runs.push((used.user + used.system) / 1000);
      material = reply.body as unknown as StatsMaterial;
    }
    runs.sort((a, b) => a - b);
    const median = runs[Math.floor(runs.length / 2)] ?? 0;
    const started = performance.now();
    for (let run = 0; run < 50; run += 1) summarize(material as StatsMaterial, CATEGORY_CODES);
    const perSummary = (performance.now() - started) / 50;
    // Worker 안에서 도는 일만(D1 행 JSON 해석 → 묶기 → 응답 JSON): 시험용 D1 중계가 섞이지 않게 같은 행으로 따로 잰다(입출력 없음 → 경과 = CPU)
    const m = material as StatsMaterial;
    const rowsJson = JSON.stringify({
      entries: m.entries.map((entry) => ({ date: entry.date })),
      emotions: m.entries.flatMap((entry) => entry.emotions.map((emotion) => ({ date: entry.date, ...emotion }))),
      firsts: m.firstCompletedDates.map((date) => ({ date }))
    });
    const assembleStart = performance.now();
    for (let run = 0; run < 200; run += 1) {
      const rows = JSON.parse(rowsJson);
      JSON.stringify(assembleStats(m.today, m.days, rows.entries, rows.emotions, rows.firsts));
    }
    const perAssemble = (performance.now() - assembleStart) / 200;
    const bytes = Buffer.byteLength(JSON.stringify(material));
    // 숫자는 docs/STATUS.md §1에 옮겨 적는다(D-118) — 여기서는 큰 퇴행만 막는다
    console.info(
      `stats-cpu: 재료 ${material?.entries.length}편·첫 완료 날짜 ${material?.firstCompletedDates.length}개, 응답 ${(bytes / 1024).toFixed(1)}KiB, 요청 CPU 중앙값 ${median.toFixed(1)}ms (7회: ${runs.map((ms) => ms.toFixed(1)).join(", ")}), Worker 안 계산 ${perAssemble.toFixed(2)}ms, summarize ${perSummary.toFixed(2)}ms`
    );
    expect(material?.firstCompletedDates.length).toBeLessThanOrEqual(400);
    expect(median).toBeLessThan(200);
    expect(perSummary).toBeLessThan(50);
    expect(perAssemble).toBeLessThan(10);
  }, 120_000);
});
