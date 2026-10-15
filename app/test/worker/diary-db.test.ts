// 창고 자물쇠를 서버를 거치지 않고 직접 두드린다(DATA_MODEL §3.1~§3.3·§8, TASK-DATA-01 PLAN §5 '자물쇠').
// 서버 검사에 구멍이 생겨도 창고가 막는지 — 하루 한 행, 달력에 없는 날짜, 완료된 기록의 빈 글·감정 0개·크기 미정, 부모 먼저 지우기.
import { readdirSync, readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { BLANK_CHARS_SQL, type NormalizedDiary, WHITESPACE_CODE_POINTS } from "../../shared/diary";
import { childStatements } from "../../worker/src/routes/diaries";
import { migrationText, splitSql, startServer, type TestServer } from "./harness";

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

const T = "2026-10-15T00:00:00.000Z";
let counter = 0;
const uuid = () => crypto.randomUUID();

async function insertEntry(overrides: Partial<Record<string, string | number | null>> = {}) {
  counter += 1;
  const row = {
    id: uuid(),
    owner_key: "owner",
    entry_date: `2026-10-${String(10 + (counter % 15)).padStart(2, "0")}`,
    timezone: "Asia/Seoul",
    status: "draft",
    event_text: "",
    reason_text: "",
    taxonomy_version: "emotion-ko-v2",
    write_token: uuid(),
    created_at: T,
    updated_at: T,
    ...overrides
  };
  const columns = Object.keys(row);
  await server.db
    .prepare(`INSERT INTO diary_entries (${columns.join(", ")}) VALUES (${columns.map((_, i) => `?${i + 1}`).join(", ")})`)
    .bind(...Object.values(row))
    .run();
  return row;
}

const addCategory = (diaryId: string, code: string, intensity: number | null, order = 0) =>
  server.db.prepare("INSERT INTO diary_categories (diary_id, category_code, display_order, intensity) VALUES (?1, ?2, ?3, ?4)").bind(diaryId, code, order, intensity).run();

const addEmotion = (diaryId: string, category: string, code: string, intensity: number | null, order = 0) =>
  server.db
    .prepare(
      "INSERT INTO diary_emotions (diary_id, category_code, emotion_code, label_snapshot, intensity, intensity_custom, display_order) VALUES (?1, ?2, ?3, '표시명', ?4, 0, ?5)"
    )
    .bind(diaryId, category, code, intensity, order)
    .run();

/** 다 채운 완료 기록 하나(감정 n개) */
async function completedEntry(emotions = 2) {
  const entry = await insertEntry({ event_text: "있었던 일", reason_text: "이유" });
  await addCategory(entry.id, "sadness", 5);
  for (let i = 0; i < emotions; i += 1) await addEmotion(entry.id, "sadness", `sadness-e${i}`, 5, i);
  await server.db
    .prepare("UPDATE diary_entries SET status = 'completed', first_completed_at = ?2, first_completed_local_date = '2026-10-15', completed_at = ?2 WHERE id = ?1")
    .bind(entry.id, T)
    .run();
  return entry;
}

const count = async (sql: string, ...params: unknown[]) => (await server.db.prepare(sql).bind(...params).first<{ n: number }>())?.n ?? -1;

describe("일기 표의 자물쇠", () => {
  it("한 주인의 한 날짜에는 한 행(임시저장·완료 합쳐서)", async () => {
    await insertEntry({ entry_date: "2026-10-15" });
    await expect(insertEntry({ entry_date: "2026-10-15" })).rejects.toThrow(/UNIQUE/);
    await insertEntry({ entry_date: "2026-10-15", owner_key: "other" });
    expect(await count("SELECT count(*) AS n FROM diary_entries WHERE entry_date = '2026-10-15'")).toBe(2);
  });

  it("달력에 없는 날짜·다른 모양의 날짜는 거부", async () => {
    for (const entry_date of ["2026-02-30", "2026-13-01", "2026-10-15 00:00", "20261015", "2026-1-05"]) {
      await expect(insertEntry({ entry_date }), entry_date).rejects.toThrow();
    }
  });

  it("글 길이는 코드 포인트 10,000자까지", async () => {
    await insertEntry({ event_text: "가".repeat(10_000) });
    await expect(insertEntry({ event_text: "가".repeat(10_001) })).rejects.toThrow(/CHECK/);
  });

  it("상태·판 번호·크기의 범위와 자료형", async () => {
    await expect(insertEntry({ status: "done" })).rejects.toThrow(/CHECK/);
    await expect(insertEntry({ revision: 0 })).rejects.toThrow(/CHECK/);
    await expect(insertEntry({ revision: 1.5 })).rejects.toThrow(/CHECK/);
    const entry = await insertEntry();
    await expect(addCategory(entry.id, "sadness", 11)).rejects.toThrow(/CHECK/);
    await expect(addCategory(entry.id, "sadness", 2.5)).rejects.toThrow(/CHECK/);
    await expect(addCategory(entry.id, "Sadness", 2)).rejects.toThrow(/CHECK/);
    await addCategory(entry.id, "sadness", null);
    await expect(addEmotion(entry.id, "sadness", "joy-light", 3)).rejects.toThrow(/CHECK/); // 계열 접두어가 다르다
  });

  it("고르지 않은 계열의 세부 감정은 넣을 수 없다(외래 키)", async () => {
    const entry = await insertEntry();
    await expect(addEmotion(entry.id, "joy", "joy-light", 3)).rejects.toThrow(/FOREIGN KEY/);
  });

  it("완료된 기록은 빈 글로 바꿀 수 없다(공백 문자만이어도)", async () => {
    const entry = await completedEntry();
    for (const blank of ["", " ", "\n\t", "　", "  "]) {
      await expect(server.db.prepare("UPDATE diary_entries SET reason_text = ?2 WHERE id = ?1").bind(entry.id, blank).run(), JSON.stringify(blank)).rejects.toThrow(/CHECK/);
    }
  });

  it("완료된 기록의 마지막 세부 감정은 지울 수 없다", async () => {
    const entry = await completedEntry(2);
    await server.db.prepare("DELETE FROM diary_emotions WHERE emotion_code = 'sadness-e0'").run();
    await expect(server.db.prepare("DELETE FROM diary_emotions WHERE emotion_code = 'sadness-e1'").run()).rejects.toThrow(/diary_completed_needs_emotion/);
    expect(await count("SELECT count(*) AS n FROM diary_emotions WHERE diary_id = ?1", entry.id)).toBe(1);
  });

  it("완료 전환은 모든 계열에 세부 감정이 있고 모든 크기가 정해졌을 때만(창고가 마지막 겹)", async () => {
    const entry = await insertEntry({ event_text: "일", reason_text: "이유" });
    const complete = () =>
      server.db
        .prepare("UPDATE diary_entries SET status = 'completed', first_completed_at = ?2, first_completed_local_date = '2026-10-15', completed_at = ?2 WHERE id = ?1")
        .bind(entry.id, T)
        .run();
    await expect(complete()).rejects.toThrow(/diary_completed_incomplete/); // 감정 0개
    await addCategory(entry.id, "sadness", null);
    await addEmotion(entry.id, "sadness", "sadness-a", null);
    await expect(complete()).rejects.toThrow(/diary_completed_incomplete/); // 크기 미정
    await server.db.prepare("UPDATE diary_categories SET intensity = 4 WHERE diary_id = ?1").bind(entry.id).run();
    await server.db.prepare("UPDATE diary_emotions SET intensity = 4 WHERE diary_id = ?1").bind(entry.id).run();
    await addCategory(entry.id, "joy", 6, 1);
    await expect(complete()).rejects.toThrow(/diary_completed_incomplete/); // 세부 감정 없는 계열
    await addEmotion(entry.id, "joy", "joy-b", 6, 1);
    await complete();
    expect(await count("SELECT count(*) AS n FROM diary_entries WHERE id = ?1 AND status = 'completed'", entry.id)).toBe(1);
  });

  it("완료된 기록의 딸린 행을 바꾼 batch 끝에 상태 칸을 다시 쓰면 어긋난 상태를 되돌린다(batch 하나 = 전부 아니면 전무)", async () => {
    const entry = await completedEntry(1);
    await addCategory(entry.id, "joy", 6, 1);
    await addEmotion(entry.id, "joy", "joy-a", 6, 1);
    // 기쁨의 세부 감정을 모두 지워 '세부 감정 없는 계열'을 만든다 — 행마다의 규칙으로는 막을 수 없는 어긋남
    await expect(
      server.db.batch([
        server.db.prepare("DELETE FROM diary_emotions WHERE diary_id = ?1 AND category_code = 'joy'").bind(entry.id),
        server.db.prepare("UPDATE diary_entries SET status = status WHERE id = ?1").bind(entry.id)
      ])
    ).rejects.toThrow(/diary_completed_incomplete/);
    expect(await count("SELECT count(*) AS n FROM diary_emotions WHERE diary_id = ?1 AND category_code = 'joy'", entry.id)).toBe(1);
  });

  it("서버의 저장 문장은 서버 검사가 놓친 어긋남(세부 감정 없는 계열)을 batch 끝에서 되돌린다", async () => {
    const entry = await completedEntry(1);
    const token = crypto.randomUUID();
    const inconsistent: NormalizedDiary = {
      revision: 1,
      eventText: "있었던 일",
      reasonText: "이유",
      categories: [
        { code: "sadness", order: 0, intensity: 5 },
        { code: "joy", order: 1, intensity: 6 }
      ],
      emotions: [{ code: "sadness-e0", category: "sadness", label: "표시명", order: 0, intensity: 5, custom: false }],
      reflections: [],
      resume: null
    };
    await expect(
      server.db.batch([
        server.db.prepare("UPDATE diary_entries SET write_token = ?2, revision = revision + 1 WHERE id = ?1").bind(entry.id, token),
        ...childStatements(server.db, entry.id, token, inconsistent, true)
      ])
    ).rejects.toThrow(/diary_completed_incomplete/);
    expect(await count("SELECT count(*) AS n FROM diary_categories WHERE diary_id = ?1", entry.id)).toBe(1);
    expect(await count("SELECT revision AS n FROM diary_entries WHERE id = ?1", entry.id)).toBe(1);
  });

  it("완료된 기록의 크기는 '아직 안 정함'으로 바꾸거나 넣을 수 없다(계열·감정 모두)", async () => {
    const entry = await completedEntry(1);
    await expect(server.db.prepare("UPDATE diary_emotions SET intensity = NULL WHERE diary_id = ?1").bind(entry.id).run()).rejects.toThrow(/diary_completed_needs_intensity/);
    await expect(server.db.prepare("UPDATE diary_categories SET intensity = NULL WHERE diary_id = ?1").bind(entry.id).run()).rejects.toThrow(/diary_completed_needs_intensity/);
    await expect(addCategory(entry.id, "joy", null, 1)).rejects.toThrow(/diary_completed_needs_intensity/);
    await addCategory(entry.id, "joy", 4, 1);
    await expect(addEmotion(entry.id, "joy", "joy-a", null, 1)).rejects.toThrow(/diary_completed_needs_intensity/);
  });

  it("어긋난 완료 기록도 상태 칸을 쓰지 않는 갱신은 막지 않는다(올바른 저장으로 고칠 길이 남는다)", async () => {
    const entry = await completedEntry(1);
    await addCategory(entry.id, "joy", 6, 1); // 세부 감정 없는 계열 — 직접 넣으면 들어간다(저장 도중에는 정당한 모양)
    await server.db.prepare("UPDATE diary_entries SET revision = revision + 1, updated_at = ?2 WHERE id = ?1").bind(entry.id, T).run();
    await expect(server.db.prepare("UPDATE diary_entries SET status = status WHERE id = ?1").bind(entry.id).run()).rejects.toThrow(/diary_completed_incomplete/);
  });

  it("판 번호는 늘기만 하고, 최초 완료 시각·날짜는 바뀌지 않는다", async () => {
    const entry = await completedEntry(1);
    await expect(server.db.prepare("UPDATE diary_entries SET revision = 1 WHERE id = ?1").bind(entry.id).run()).rejects.toThrow(/diary_revision_must_grow/);
    await expect(server.db.prepare("UPDATE diary_entries SET first_completed_local_date = '2026-10-01' WHERE id = ?1").bind(entry.id).run()).rejects.toThrow(/diary_first_completion_kept/);
    await expect(
      server.db.prepare("UPDATE diary_entries SET status = 'draft', first_completed_at = NULL, first_completed_local_date = NULL WHERE id = ?1").bind(entry.id).run()
    ).rejects.toThrow(/diary_first_completion_kept/);
    await server.db.prepare("UPDATE diary_entries SET first_completed_at = first_completed_at, revision = revision + 1 WHERE id = ?1").bind(entry.id).run();
  });

  it("글 칸의 NUL 문자는 거부한다(length()가 NUL 앞까지만 세어 길이·공백 검사를 빠져나가지 않게)", async () => {
    await expect(insertEntry({ event_text: `\u0000${"가".repeat(10_001)}` })).rejects.toThrow(/CHECK/);
    await expect(insertEntry({ reason_text: "앞\u0000뒤" })).rejects.toThrow(/CHECK/);
    const entry = await insertEntry();
    await expect(
      server.db.prepare("INSERT INTO diary_reflections (diary_id, kind, slot, text) VALUES (?1, 'praise', 1, ?2)").bind(entry.id, "\u0000 ").run()
    ).rejects.toThrow(/CHECK/);
    await insertEntry({ event_text: "😀".repeat(10) });
  });

  it("시각 칸은 toISOString() 모양만(UTC·밀리초·Z)", async () => {
    for (const created_at of ["banana", "2026-10-15T09:00:00+09:00", "2026-10-15T00:00:00Z", "2026-10-15"]) {
      await expect(insertEntry({ created_at }), created_at).rejects.toThrow(/CHECK/);
    }
    await insertEntry({ created_at: new Date(Date.UTC(2026, 9, 15, 1, 2, 3, 45)).toISOString() });
  });

  it("칭찬·감사 행은 글이 있어야 하고 칸은 1~3", async () => {
    const entry = await insertEntry();
    const add = (slot: number, text: string) =>
      server.db.prepare("INSERT INTO diary_reflections (diary_id, kind, slot, text) VALUES (?1, 'praise', ?2, ?3)").bind(entry.id, slot, text).run();
    await add(1, "잘했다");
    await expect(add(2, " 　 ")).rejects.toThrow(/CHECK/);
    await expect(add(4, "x")).rejects.toThrow(/CHECK/);
    await expect(add(1, "또")).rejects.toThrow(/UNIQUE|PRIMARY/);
  });

  it("쓰던 단계: 세부 감정 단계만 계열을 갖는다(단계가 비어 있어도 계열만 남지 않는다)", async () => {
    await insertEntry({ resume_step: "details", resume_category: "sadness" });
    await insertEntry({ resume_step: "reason" });
    await expect(insertEntry({ resume_step: "reason", resume_category: "sadness" })).rejects.toThrow(/CHECK/);
    await expect(insertEntry({ resume_step: null, resume_category: "sadness" })).rejects.toThrow(/CHECK/);
    await expect(insertEntry({ resume_step: "Details" })).rejects.toThrow(/CHECK/); // 단계 목록은 서버가 대조하고 창고는 모양만
  });
});

describe("지우기 — 부모 먼저, 딸린 행은 연쇄로(DATA_MODEL §8)", () => {
  it("완료된 기록도 부모를 지우면 계열·감정·칭찬감사가 모두 지워진다(고아 0)", async () => {
    const entry = await completedEntry(3);
    await server.db.prepare("INSERT INTO diary_reflections (diary_id, kind, slot, text) VALUES (?1, 'gratitude', 1, '고마워')").bind(entry.id).run();
    await server.db.prepare("DELETE FROM diary_entries WHERE id = ?1").bind(entry.id).run();
    expect(await count("SELECT count(*) AS n FROM diary_entries WHERE id = ?1", entry.id)).toBe(0);
    for (const table of ["diary_categories", "diary_emotions", "diary_reflections"]) {
      expect(await count(`SELECT count(*) AS n FROM ${table} WHERE diary_id = ?1`, entry.id), table).toBe(0);
    }
  });

  it("외래 키 검사가 켜져 있다", async () => {
    const row = await server.db.prepare("PRAGMA foreign_keys").first<{ foreign_keys: number }>();
    expect(row?.foreign_keys).toBe(1);
  });
});

describe("창고와 서버가 같은 규칙을 쓴다", () => {
  it("마이그레이션의 공백 문자 목록이 서버의 목록과 같다", () => {
    const sql = migrationText("0006_diaries.sql");
    const lists = [...sql.matchAll(/trim\([a-z_]+, (char\([0-9, ]+\))\)/g)].map((match) => match[1]);
    expect(lists.length).toBe(3);
    for (const list of lists) expect(list).toBe(BLANK_CHARS_SQL);
  });

  it("창고의 trim 공백 판정이 서버의 판정과 문자마다 같다", async () => {
    const rows = await server.db
      .prepare(`SELECT value AS code, trim(char(value), ${BLANK_CHARS_SQL}) = '' AS blank FROM json_each(?1)`)
      .bind(JSON.stringify([...WHITESPACE_CODE_POINTS, 33, 65, 0x3131, 0x200b, 0x2060, 0x180e]))
      .all<{ code: number; blank: number }>();
    for (const row of rows.results) expect(row.blank === 1, `U+${row.code.toString(16)}`).toBe(WHITESPACE_CODE_POINTS.includes(row.code));
  });

  it("서버 코드는 일기 표에 REPLACE를 쓰지 않는다(내부 삭제가 trigger를 건너뛰고 딸린 행을 연쇄로 지운다 — SQL 검토 M1)", () => {
    const dir = new URL("../../worker/src/", import.meta.url);
    const files = readdirSync(dir, { recursive: true, encoding: "utf8" }).filter((name) => name.endsWith(".ts"));
    expect(files.length).toBeGreaterThan(5);
    for (const name of files) {
      const code = readFileSync(new URL(name.replaceAll("\\", "/"), dir), "utf8")
        .split(/\r?\n/)
        .filter((line) => !line.trim().startsWith("//")) // 이 규칙을 적은 주석은 세지 않는다
        .join("\n");
      expect(code, name).not.toMatch(/\bREPLACE\s+INTO\b|\bOR\s+REPLACE\b/i);
    }
  });

  it("trigger 안의 `;`에서 문장을 끊지 않는다", () => {
    const statements = splitSql("CREATE TRIGGER t BEFORE DELETE ON x BEGIN SELECT 1; SELECT 2; END; CREATE TABLE y (a TEXT DEFAULT ';');");
    expect(statements).toEqual(["CREATE TRIGGER t BEFORE DELETE ON x BEGIN SELECT 1; SELECT 2; END", "CREATE TABLE y (a TEXT DEFAULT ';')"]);
  });
});
