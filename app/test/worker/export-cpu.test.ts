// 관문 data-control의 export-cpu-measured(EVAL_PLAN §14, 감리 N-8): 합성 3년치(하루 1편, 1,095편)로 내보내기 한 번의 CPU를 잰다.
// 서버 시험에서 Worker 코드는 이 Node 프로세스에서 돌고 SQL 실행만 workerd 프로세스가 한다 — 운영에서 D1 실행이 Worker 밖인 것과 같은 나눔이라,
// 요청 하나 동안 이 프로세스가 쓴 CPU(process.cpuUsage)가 Worker의 CPU에 해당한다. 기계 속도가 Cloudflare와 달라 값은 추정이다.
// 단언은 O(n²) 같은 큰 퇴행만 잡도록 넉넉하게 두고, 잰 값은 출력한다(기록은 tasks/data-control/2026-10-17/PLAN.md).
import { createHash, randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { API, TIMEZONE_HEADER } from "../../shared/api";
import { addDays, EXPORT_PAGE_SIZE, type ExportPage } from "../../shared/diary";
import { assembleExport, IMPORT_MAX_ENTRIES, planImport } from "../../worker/src/routes/dataControl";
import { call, login, startServer, type TestServer } from "./harness";
import { syntheticEntry } from "./synthetic";

let server: TestServer;
beforeAll(async () => {
  server = await startServer();
});
afterAll(async () => {
  await server.dispose();
});

const token = randomBytes(32).toString("base64url");
const env = { BACKUP_TOKEN_HASH: createHash("sha256").update(token).digest("hex") };
describe("export-cpu-measured", () => {
  it("합성 3년치(1,095편)를 조각으로 내보낼 때 한 조각 요청의 CPU(이 PC의 Node)", async () => {
    const cookie = await login(server);
    const entries = Array.from({ length: 1095 }, (_, index) => syntheticEntry(addDays("2026-10-13", -index), index));
    for (let start = 0; start < entries.length; start += 150) {
      const reply = await call(server, "POST", API.backupImport, { body: { diaries: entries.slice(start, start + 150) }, headers: { authorization: `Bearer ${token}` }, env, csrf: false });
      expect(reply.status).toBe(200);
    }
    // 한 조각(EXPORT_PAGE_SIZE편) 요청의 CPU(두 번째 조각 — 첫 조각은 설정 행 읽기 등이 섞이지 않게 고르지 않는다)와 조각 수
    const runs: number[] = [];
    let bytes = 0;
    let pages = 0;
    for (let run = 0; run < 7; run += 1) {
      let after: string | null = null;
      pages = 0;
      do {
        const before = process.cpuUsage();
        const reply = await call(server, "GET", after ? `${API.export}?after=${after}` : API.export, { cookie, headers: { [TIMEZONE_HEADER]: "Asia/Seoul" } });
        const used = process.cpuUsage(before);
        expect(reply.status).toBe(200);
        pages += 1;
        if (pages === 2) {
          runs.push((used.user + used.system) / 1000);
          bytes = Buffer.byteLength(reply.raw);
        }
        after = (reply.body as unknown as ExportPage).next;
      } while (after);
    }
    runs.sort((a, b) => a - b);
    const median = runs[Math.floor(runs.length / 2)] ?? 0;
    console.info(`export-cpu: 1095편 → ${pages}조각, 한 조각 응답 ${(bytes / 1024).toFixed(0)}KiB, 한 조각 CPU 중앙값 ${median.toFixed(1)}ms (7회: ${runs.map((ms) => ms.toFixed(1)).join(", ")})`);
    expect(pages).toBe(Math.ceil(1095 / EXPORT_PAGE_SIZE));

    // 위 값에는 시험용 D1 중계(별도 프로세스와의 직렬화)와 시험 도구의 응답 해석이 섞인다. Worker 안에서 실제로 도는 일 —
    // D1이 돌려준 행(JSON) 해석 → 묶기·조립 → 응답 JSON 만들기 — 만 같은 조각으로 따로 잰다(입출력이 없어 경과 시간 = CPU).
    let captured: unknown[][] = [];
    const capturing = new Proxy(server.db, {
      get(target, property) {
        if (property === "batch") {
          return async (statements: D1PreparedStatement[]) => {
            const results = await target.batch(statements);
            captured = results.map((item) => item.results ?? []);
            return results;
          };
        }
        const value = Reflect.get(target, property);
        return typeof value === "function" ? value.bind(target) : value;
      }
    });
    const firstPage = (await call(server, "GET", API.export, { cookie, headers: { [TIMEZONE_HEADER]: "Asia/Seoul" } })).body as unknown as ExportPage;
    await call(server, "GET", `${API.export}?after=${firstPage.next}`, { cookie, headers: { [TIMEZONE_HEADER]: "Asia/Seoul" }, env: { DB: capturing } });
    // 한 조각은 D1에서도 한 조각만 읽는다 — 기록 행은 조각 크기+1(다음이 있는지 보는 한 줄)을 넘지 않는다(LIMIT이 빠지면 남은 행을 다 읽어 CPU가 기록 수에 비례한다)
    expect(captured[0]?.length).toBe(EXPORT_PAGE_SIZE + 1);
    const wire = JSON.stringify(captured);
    const rounds = 200;
    const startAt = performance.now();
    let out = "";
    for (let round = 0; round < rounds; round += 1) {
      const [entries = [], categories = [], emotions = [], reflections = [], settings = []] = JSON.parse(wire) as unknown[][];
      out = JSON.stringify(assembleExport({ entries, categories, emotions, reflections, settings }, "2026-10-17T00:00:00.000Z", "Asia/Seoul", EXPORT_PAGE_SIZE));
    }
    const perPage = (performance.now() - startAt) / rounds;
    console.info(`export-cpu(Worker 안의 계산만): 한 조각 ${EXPORT_PAGE_SIZE}편 — D1 행 ${(wire.length / 1024).toFixed(0)}KiB 해석 + 조립 + 응답 ${(out.length / 1024).toFixed(0)}KiB 만들기 = ${perPage.toFixed(2)}ms`);
    expect(perPage).toBeLessThan(50);
    expect(median).toBeLessThan(200);
  });

  // 다시 넣기 조각 하나에서 Worker 안에서 도는 일 — 본문 JSON 해석 → 기록마다 검사 → json_each에 줄 행 만들기. D1 실행은 Worker 밖이다.
  // 마감 검토(2026-10-17)가 150편 조각을 12.7ms로 쟀다(그중 시간대 검사가 기록마다 Intl.DateTimeFormat을 새로 만들어 5.4ms) — 고친 뒤 값을 잰다.
  it.each([100, IMPORT_MAX_ENTRIES])("다시 넣기 %i편 조각의 Worker 안 계산", (size) => {
    const raw = JSON.stringify({ diaries: Array.from({ length: size }, (_, index) => syntheticEntry(addDays("2026-10-13", -index), index)) });
    const rounds = 200;
    const startAt = performance.now();
    for (let round = 0; round < rounds; round += 1) {
      const plan = planImport(JSON.parse(raw) as Record<string, unknown>);
      if (plan instanceof Response) throw new Error("합성 조각이 검사를 통과하지 못했다");
    }
    const perChunk = (performance.now() - startAt) / rounds;
    console.info(`import-cpu(Worker 안의 계산만): ${size}편 조각 ${(raw.length / 1024).toFixed(0)}KiB — 해석 + 검사 + 넣을 행 만들기 = ${perChunk.toFixed(2)}ms`);
    expect(perChunk).toBeLessThan(50);
  });
});
