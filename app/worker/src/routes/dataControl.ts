// 내 데이터 통제(TASK-DATA-02 data-control — DATA_MODEL §8, ARCHITECTURE §5, D-109·D-112 ⑤⑩·D-124).
// 내보내기(로그인 cookie)·모든 기록 지우기(로그인 cookie + 확인 문구 + 앱 잠금 비밀번호)·PC 백업 전용 내보내기·다시 넣기
// (Authorization: Bearer — cookie·CSRF 없음). 백업 토큰은 SHA-256 해시만 Workers secret(BACKUP_TOKEN_HASH)에 있고,
// 그 secret이 없으면 백업 경로는 없는 것처럼 404다. 내보내기 파일에는 비밀값·owner key·앱 잠금 해시·write_token이 없다.
import { DELETE_ALL_CONFIRM, isPin, normalizeName, TIMEZONE_HEADER } from "../../../shared/api";
import {
  canonicalTimeZone,
  DAY_START_DEFAULT,
  type DiaryEntryView,
  EVENT_MAX_CHARS,
  EXPORT_PAGE_SIZE,
  EXPORT_SCHEMA_VERSION,
  type ExportPage,
  type ImportResult,
  isBlank,
  isDayStartHour,
  isIntensity,
  isIsoDate,
  isRevision,
  missingForCompletion,
  REASON_MAX_CHARS,
  REFLECTION_MAX_CHARS,
  REFLECTION_SLOTS,
  RESUME_STEPS,
  type ResumeStep,
  textProblem
} from "../../../shared/diary";
import { isCategoryCode } from "../../../shared/taxonomy";
import { type Bindings, type Ctx, iso, type Session } from "../context";
import { toHex, timingSafeEqual } from "../crypto";
import { fail, json } from "../http";
import { readJson, readJsonText } from "../request";
import { SUBJECT } from "../session";
import { verifyPin } from "./appLock";
import { type CategoryRow, ENTRY_COLUMNS, type EmotionRow, type EntryRow, entryView, type ReflectionRow } from "./diaries";

/** 다시 넣기 한 조각의 본문 한도. D1의 값 하나 한도(2MB)보다 충분히 작게 — 백업 도구가 이보다 작게 나눠 보낸다. */
export const IMPORT_MAX_BODY_BYTES = 1024 * 1024;
/** 다시 넣기 한 조각의 기록 수 상한 */
export const IMPORT_MAX_ENTRIES = 200;

type Row = Record<string, unknown>;

/**
 * owner의 기록 한 조각(entry_date가 after보다 뒤인 것부터 EXPORT_PAGE_SIZE편)을 내보내기 모양으로. 질의는 batch 하나(다섯 문장).
 * 한 편을 더 읽어 다음 조각이 있는지 안다(next = 이 조각의 마지막 날짜).
 */
export async function buildExport(ctx: Ctx, owner: string, timeZone: string, after: string | null): Promise<ExportPage> {
  const db = ctx.env.DB;
  const from = after ?? "";
  const page = "SELECT id FROM diary_entries WHERE owner_key = ?1 AND entry_date > ?2 ORDER BY entry_date LIMIT ?3";
  const mine = `diary_id IN (${page})`;
  const size = EXPORT_PAGE_SIZE;
  const [entries, categories, emotions, reflections, settings] = await db.batch([
    db.prepare(`SELECT ${ENTRY_COLUMNS} FROM diary_entries WHERE owner_key = ?1 AND entry_date > ?2 ORDER BY entry_date LIMIT ?3`).bind(owner, from, size + 1),
    db.prepare(`SELECT diary_id, category_code, intensity FROM diary_categories WHERE ${mine} ORDER BY diary_id, display_order`).bind(owner, from, size),
    db
      .prepare(
        `SELECT diary_id, category_code, emotion_code, label_snapshot, intensity, intensity_custom FROM diary_emotions WHERE ${mine} ORDER BY diary_id, display_order`
      )
      .bind(owner, from, size),
    db.prepare(`SELECT diary_id, kind, slot, text FROM diary_reflections WHERE ${mine} ORDER BY diary_id, kind, slot`).bind(owner, from, size),
    db.prepare("SELECT display_name, day_start_hour FROM owner_settings WHERE owner_key = ?1").bind(owner)
  ]);
  return assembleExport(
    {
      entries: entries?.results ?? [],
      categories: categories?.results ?? [],
      emotions: emotions?.results ?? [],
      reflections: reflections?.results ?? [],
      settings: settings?.results ?? []
    },
    iso(ctx.now),
    timeZone,
    size
  );
}

/** 창고에서 읽은 행들 → 내보내기 조각(순수 계산 — export-cpu 측정이 이 부분만 따로 잰다). */
export function assembleExport(
  result: { entries: unknown[]; categories: unknown[]; emotions: unknown[]; reflections: unknown[]; settings: unknown[] },
  exportedAt: string,
  timeZone: string,
  size: number
): ExportPage {
  const rows = result.entries as EntryRow[];
  const more = rows.length > size;
  const shown = more ? rows.slice(0, size) : rows;
  const group = <T>(rows: unknown[] | undefined): Map<string, T[]> => {
    const map = new Map<string, T[]>();
    for (const row of (rows ?? []) as (T & { diary_id: string })[]) {
      const list = map.get(row.diary_id);
      if (list) list.push(row);
      else map.set(row.diary_id, [row]);
    }
    return map;
  };
  const byCategory = group<CategoryRow>(result.categories);
  const byEmotion = group<EmotionRow>(result.emotions);
  const byReflection = group<ReflectionRow>(result.reflections);
  const setting = (result.settings as { display_name: string | null; day_start_hour: number }[])[0];
  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt,
    timezone: timeZone,
    dayStartHour: setting?.day_start_hour ?? DAY_START_DEFAULT,
    displayName: setting?.display_name ?? null,
    diaries: shown.map((row) => entryView(row, byCategory.get(row.id) ?? [], byEmotion.get(row.id) ?? [], byReflection.get(row.id) ?? [])),
    next: more ? (shown[shown.length - 1]?.entry_date ?? null) : null
  };
}

/** 주소의 `?after=` — 없으면 처음부터, 있으면 달력 날짜여야 한다. 모양이 틀리면 undefined(→ 400). */
function afterParam(ctx: Ctx): string | null | undefined {
  const value = ctx.url.searchParams.get("after");
  if (value === null) return null;
  return isIsoDate(value) ? value : undefined;
}

/** `GET /api/export` — 화면이 받아 파일로 만들어 공유 창으로 넘긴다(1회용 내려받기 주소를 만들지 않는다 — ARCHITECTURE §4.1). */
export async function exportData(ctx: Ctx): Promise<Response> {
  const session = ctx.session as Session;
  const timeZone = canonicalTimeZone(ctx.request.headers.get(TIMEZONE_HEADER));
  if (!timeZone) return fail(400, "invalid_timezone");
  const after = afterParam(ctx);
  if (after === undefined) return fail(400, "invalid_date");
  return json(200, await buildExport(ctx, session.owner, timeZone, after));
}

/**
 * `DELETE /api/diaries` — 모든 기록 지우기(D-112 ⑤⑩). 본문 `{ confirm: "모든 기록 삭제", pin? }`.
 * 기록·딸린 행(부모 먼저 + 연쇄)·영수증·owner 설정(부를 이름·앱 잠금·하루 기준 시각)·다른 기기의 세션을 batch 하나로 지운다.
 * 이 기기의 세션과 접근 열쇠는 남아 같은 기기에서 처음부터 다시 시작한다. 같은 요청을 다시 보내도 같은 결과다(재시도에 안전).
 */
export async function deleteAll(ctx: Ctx): Promise<Response> {
  const session = ctx.session as Session;
  const body = await readJson(ctx.request);
  if (body instanceof Response) return body;
  if (Object.keys(body).some((key) => key !== "confirm" && key !== "pin") || typeof body.confirm !== "string") return fail(400, "invalid_body");
  if (body.confirm !== DELETE_ALL_CONFIRM) return fail(422, "confirm_mismatch");
  if (session.lockOn) {
    if (!isPin(body.pin)) return fail(422, "pin_required");
    const denied = await verifyPin(ctx, session.owner, body.pin);
    if (denied) return denied;
  }
  const db = ctx.env.DB;
  await db.batch([
    db.prepare("DELETE FROM diary_entries WHERE owner_key = ?1").bind(session.owner),
    db.prepare("DELETE FROM idempotency_records WHERE owner_key = ?1").bind(session.owner),
    db.prepare("DELETE FROM owner_settings WHERE owner_key = ?1").bind(session.owner),
    db.prepare("DELETE FROM sessions WHERE subject = ?1 AND id <> ?2").bind(session.owner, session.id),
    // 이 기기는 처음 상태로 — 잠김을 풀고 5분 규칙을 다시 잰다(앱 잠금 설정이 사라졌다)
    db.prepare("UPDATE sessions SET locked = 0, last_active_at = ?2 WHERE id = ?1").bind(session.id, iso(ctx.now))
  ]);
  // 성공은 meta.changes(연쇄가 끼면 부풀려진다)가 아니라 지운 뒤 조회로 판정한다(DATA_MODEL §8)
  const left = await db
    .prepare(
      `SELECT (SELECT count(*) FROM diary_entries WHERE owner_key = ?1) + (SELECT count(*) FROM owner_settings WHERE owner_key = ?1)
            + (SELECT count(*) FROM idempotency_records WHERE owner_key = ?1) AS n`
    )
    .bind(session.owner)
    .first<{ n: number }>();
  if (left?.n !== 0) return fail(500, "server_error");
  return json(200, { deleted: true });
}

// ── PC 백업 전용(Bearer) ───────────────────────────────────────────

const BEARER = /^Bearer ([A-Za-z0-9_-]{32,128})$/;

async function sha256Hex(text: string): Promise<string> {
  return toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))));
}

const TOKEN_HASH = /^[0-9a-f]{64}$/;

/** 백업 경로가 켜져 있는가 — `BACKUP_TOKEN_HASH`(SHA-256 hex)가 있을 때만. app.ts가 경로를 고르기 전에 본다. */
export function backupConfigured(env: Bindings): boolean {
  return typeof env.BACKUP_TOKEN_HASH === "string" && TOKEN_HASH.test(env.BACKUP_TOKEN_HASH);
}

/** 백업 경로의 입구. secret이 없으면 404(경로가 없는 것과 같다), 토큰이 없거나 틀리면 401. 통과하면 owner. */
async function backupOwner(ctx: Ctx): Promise<string | Response> {
  const expected = ctx.env.BACKUP_TOKEN_HASH;
  if (!expected || !backupConfigured(ctx.env)) return fail(404, "not_found");
  const match = BEARER.exec(ctx.request.headers.get("authorization") ?? "");
  if (!match?.[1] || !timingSafeEqual(await sha256Hex(match[1]), expected)) return fail(401, "unauthorized");
  const owner = ctx.env.OWNER_SUBJECT;
  if (!SUBJECT.test(owner) || !ctx.allowlist.has(owner)) return fail(500, "server_misconfigured");
  return owner;
}

/** `GET /api/backup/export` — PC 백업 도구가 하루 한 번 받는다(D-109). 파일 모양은 `GET /api/export`와 같다. */
export async function backupExport(ctx: Ctx): Promise<Response> {
  const owner = await backupOwner(ctx);
  if (owner instanceof Response) return owner;
  const timeZone = canonicalTimeZone(ctx.request.headers.get(TIMEZONE_HEADER));
  if (!timeZone) return fail(400, "invalid_timezone");
  const after = afterParam(ctx);
  if (after === undefined) return fail(400, "invalid_date");
  return json(200, await buildExport(ctx, owner, timeZone, after));
}

// 창고의 시각 칸 CHECK(strftime '%Y-%m-%dT%H:%M:%fZ')는 네 자리 연도만 받는다 — JS는 '+010000-…' 같은 여섯 자리 연도도 ISO로 만든다
const ISO_TIME_SHAPE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}[.][0-9]{3}Z$/;
const ISO_TIME = (value: unknown): value is string => {
  if (typeof value !== "string" || !ISO_TIME_SHAPE.test(value)) return false;
  const ms = Date.parse(value);
  return Number.isFinite(ms) && new Date(ms).toISOString() === value;
};
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const EMOTION_SLUG = /^[a-z0-9][a-z0-9-]{0,55}$/;
/** 창고의 `emotion_code` CHECK(3~64자)와 같다 — 계열 접두어를 더한 전체 길이 */
const EMOTION_CODE_MAX = 64;

const VIEW_KEYS = [
  "schemaVersion",
  "id",
  "entryDate",
  "timezone",
  "status",
  "revision",
  "taxonomyVersion",
  "eventText",
  "reasonText",
  "categories",
  "emotions",
  "praises",
  "gratitudes",
  "resume",
  "firstCompletedAt",
  "firstCompletedLocalDate",
  "completedAt",
  "createdAt",
  "updatedAt"
] as const;

const isObject = (value: unknown): value is Row => typeof value === "object" && value !== null && !Array.isArray(value);
const exactKeys = (value: Row, keys: readonly string[]) => Object.keys(value).length === keys.length && keys.every((key) => key in value);

/**
 * 내보내기 파일의 기록 하나를 검사한다. 창고 규칙(CHECK·trigger)과 같은 조건을 먼저 본다 — 조각의 한 기록이라도 틀리면
 * 아무것도 넣지 않는다. 세부 감정 코드는 지금 사전에 없어도 받는다(지난 사전 판으로 쓴 기록도 되살려야 한다) — 모양과 계열 접두어만 본다.
 */
export function parseImportEntry(value: unknown): DiaryEntryView | string {
  if (!isObject(value) || !exactKeys(value, VIEW_KEYS)) return "keys";
  const v = value as unknown as DiaryEntryView;
  if (v.schemaVersion !== "diary-entry-v2") return "schemaVersion";
  if (typeof v.id !== "string" || !ID.test(v.id)) return "id";
  if (!isIsoDate(v.entryDate)) return "entryDate";
  if (canonicalTimeZone(v.timezone) === null) return "timezone";
  if (v.status !== "draft" && v.status !== "completed") return "status";
  if (!isRevision(v.revision)) return "revision";
  if (typeof v.taxonomyVersion !== "string" || v.taxonomyVersion.length < 1 || v.taxonomyVersion.length > 64) return "taxonomyVersion";
  if (typeof v.eventText !== "string" || textProblem(v.eventText, EVENT_MAX_CHARS)) return "eventText";
  if (typeof v.reasonText !== "string" || textProblem(v.reasonText, REASON_MAX_CHARS)) return "reasonText";
  if (!Array.isArray(v.categories) || v.categories.length > 9) return "categories";
  const seenCategories = new Set<string>();
  for (const item of v.categories) {
    if (!isObject(item) || !exactKeys(item, ["categoryCode", "intensity"]) || !isCategoryCode(item.categoryCode) || seenCategories.has(item.categoryCode)) return "categories";
    if (item.intensity !== null && !isIntensity(item.intensity)) return "categories";
    seenCategories.add(item.categoryCode);
  }
  if (!Array.isArray(v.emotions) || v.emotions.length > 100) return "emotions";
  const seenEmotions = new Set<string>();
  for (const item of v.emotions) {
    if (!isObject(item) || !exactKeys(item, ["categoryCode", "emotionCode", "labelSnapshot", "intensity", "custom"])) return "emotions";
    const category = item.categoryCode;
    const code = item.emotionCode;
    if (typeof category !== "string" || !seenCategories.has(category) || typeof code !== "string" || seenEmotions.has(code)) return "emotions";
    if (code.length > EMOTION_CODE_MAX || !code.startsWith(`${category}-`) || !EMOTION_SLUG.test(code.slice(category.length + 1))) return "emotions";
    const label = item.labelSnapshot;
    if (typeof label !== "string" || label.length < 1 || textProblem(label, 100) || isBlank(label)) return "emotions";
    if (item.intensity !== null && !isIntensity(item.intensity)) return "emotions";
    if (typeof item.custom !== "boolean" || (item.custom && item.intensity === null)) return "emotions";
    seenEmotions.add(code);
  }
  for (const kind of ["praises", "gratitudes"] as const) {
    const list = v[kind];
    if (!Array.isArray(list) || list.length > REFLECTION_SLOTS) return kind;
    const slots = new Set<number>();
    for (const item of list) {
      if (!isObject(item) || !exactKeys(item, ["slot", "text"])) return kind;
      if (!Number.isInteger(item.slot) || (item.slot as number) < 1 || (item.slot as number) > REFLECTION_SLOTS || slots.has(item.slot as number)) return kind;
      if (typeof item.text !== "string" || textProblem(item.text, REFLECTION_MAX_CHARS) || isBlank(item.text)) return kind;
      slots.add(item.slot as number);
    }
  }
  if (v.resume !== null) {
    if (!isObject(v.resume) || !exactKeys(v.resume, ["step", "categoryCode"])) return "resume";
    const step = v.resume.step;
    if (typeof step !== "string" || !(RESUME_STEPS as readonly string[]).includes(step)) return "resume";
    const category = v.resume.categoryCode;
    if ((step as ResumeStep) === "details" ? typeof category !== "string" || !seenCategories.has(category) : category !== null) return "resume";
  }
  for (const field of ["createdAt", "updatedAt"] as const) if (!ISO_TIME(v[field])) return field;
  for (const field of ["firstCompletedAt", "completedAt"] as const) if (v[field] !== null && !ISO_TIME(v[field])) return field;
  if (v.firstCompletedLocalDate !== null && !isIsoDate(v.firstCompletedLocalDate)) return "firstCompletedLocalDate";
  if (v.status === "completed") {
    if (v.firstCompletedAt === null || v.completedAt === null || v.firstCompletedLocalDate === null) return "status";
    const missing = missingForCompletion({
      eventText: v.eventText,
      reasonText: v.reasonText,
      categories: v.categories.map((item) => ({ code: item.categoryCode, intensity: item.intensity })),
      emotions: v.emotions.map((item) => ({ category: item.categoryCode, intensity: item.intensity }))
    });
    if (missing.length) return "status";
  }
  return v;
}

/** 다시 넣기 조각 하나를 검사해 넣을 행(json_each에 줄 JSON)을 만든 것 */
export interface ImportPlan {
  entries: DiaryEntryView[];
  settings: { displayName: string | null; dayStartHour: number } | null;
  parents: string;
  categories: string;
  emotions: string;
  reflections: string;
}

/**
 * 조각 하나를 전부 검사하고 넣을 행을 만든다(D1 없이 — Worker 안에서 도는 계산은 여기와 본문 해석이 거의 전부라 따로 잰다,
 * `app/test/worker/export-cpu.test.ts`). 한 기록이라도 틀리면 그 칸을 알리는 422 응답.
 */
export function planImport(body: Row): ImportPlan | Response {
  if (Object.keys(body).some((key) => key !== "diaries" && key !== "settings") || !Array.isArray(body.diaries) || body.diaries.length > IMPORT_MAX_ENTRIES) {
    return fail(400, "invalid_body");
  }
  const entries: DiaryEntryView[] = [];
  const dates = new Set<string>();
  for (const [index, item] of (body.diaries as unknown[]).entries()) {
    const parsed = parseImportEntry(item);
    if (typeof parsed === "string") return fail(422, "invalid_import", { field: `diaries[${index}].${parsed}` });
    if (dates.has(parsed.entryDate)) return fail(422, "invalid_import", { field: `diaries[${index}].entryDate` });
    dates.add(parsed.entryDate);
    entries.push(parsed);
  }
  let settings: ImportPlan["settings"] = null;
  if (body.settings !== undefined) {
    const raw = body.settings;
    if (!isObject(raw) || !exactKeys(raw, ["displayName", "dayStartHour"]) || !isDayStartHour(raw.dayStartHour)) return fail(422, "invalid_import", { field: "settings" });
    const name = raw.displayName === null ? null : normalizeName(raw.displayName);
    if (raw.displayName !== null && name === null) return fail(422, "invalid_import", { field: "settings.displayName" });
    settings = { displayName: name, dayStartHour: raw.dayStartHour };
  }
  const parents = JSON.stringify(
    entries.map((v) => ({
      id: v.id,
      date: v.entryDate,
      tz: v.timezone,
      status: v.status,
      event: v.eventText,
      reason: v.reasonText,
      revision: v.revision,
      taxonomy: v.taxonomyVersion,
      step: v.resume?.step ?? null,
      stepCategory: v.resume?.step === "details" ? v.resume.categoryCode : null,
      firstAt: v.firstCompletedAt,
      firstDate: v.firstCompletedLocalDate,
      completedAt: v.completedAt,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt
    }))
  );
  const categories = JSON.stringify(entries.flatMap((v) => v.categories.map((c, order) => ({ d: v.id, c: c.categoryCode, o: order, i: c.intensity }))));
  const emotions = JSON.stringify(
    entries.flatMap((v) =>
      v.emotions.map((e, order) => ({ d: v.id, c: e.categoryCode, e: e.emotionCode, l: e.labelSnapshot, i: e.intensity, x: e.custom ? 1 : 0, o: order }))
    )
  );
  const reflections = JSON.stringify(
    entries.flatMap((v) => [
      ...v.praises.map((r) => ({ d: v.id, k: "praise", s: r.slot, t: r.text })),
      ...v.gratitudes.map((r) => ({ d: v.id, k: "gratitude", s: r.slot, t: r.text }))
    ])
  );
  return { entries, settings, parents, categories, emotions, reflections };
}

/**
 * `POST /api/backup/import` — PC 백업 파일을 조각으로 다시 넣는다(D-109 복구 순서). 이미 있는 날짜는 덮지 않고 건너뛴다 —
 * Time Travel로 되돌린 뒤 그 뒤에 쓴 기록만 채우는 데도, 모두 지운 뒤 전부 되살리는 데도 같은 도구를 쓴다.
 * 넣기는 batch 하나: 부모를 json_each로 한꺼번에(이미 있으면 그대로), 딸린 행은 이번 요청이 넣은 부모(write_token)에만.
 */
export async function backupImport(ctx: Ctx): Promise<Response> {
  const owner = await backupOwner(ctx);
  if (owner instanceof Response) return owner;
  const read = await readJsonText(ctx.request, IMPORT_MAX_BODY_BYTES);
  if (read instanceof Response) return read;
  const plan = planImport(read.body);
  if (plan instanceof Response) return plan;
  const { entries, settings, parents, categories, emotions, reflections } = plan;

  const db = ctx.env.DB;
  const token = crypto.randomUUID();
  const now = iso(ctx.now);
  const mine = "EXISTS (SELECT 1 FROM diary_entries AS d WHERE d.id = json_extract(value, '$.d') AND d.owner_key = ?2 AND d.write_token = ?3)";
  const statements = [
    db
      .prepare(
        `INSERT INTO diary_entries (id, owner_key, entry_date, timezone, status, event_text, reason_text, revision, taxonomy_version, resume_step,
                                    resume_category, write_token, first_completed_at, first_completed_local_date, completed_at, created_at, updated_at)
         SELECT json_extract(value, '$.id'), ?2, json_extract(value, '$.date'), json_extract(value, '$.tz'), json_extract(value, '$.status'),
                json_extract(value, '$.event'), json_extract(value, '$.reason'), json_extract(value, '$.revision'), json_extract(value, '$.taxonomy'),
                json_extract(value, '$.step'), json_extract(value, '$.stepCategory'), ?3, json_extract(value, '$.firstAt'),
                json_extract(value, '$.firstDate'), json_extract(value, '$.completedAt'), json_extract(value, '$.createdAt'), json_extract(value, '$.updatedAt')
           FROM json_each(?1) WHERE true
         ON CONFLICT DO NOTHING`
      )
      .bind(parents, owner, token),
    db
      .prepare(
        `INSERT INTO diary_categories (diary_id, category_code, display_order, intensity)
         SELECT json_extract(value, '$.d'), json_extract(value, '$.c'), json_extract(value, '$.o'), json_extract(value, '$.i') FROM json_each(?1) WHERE ${mine}`
      )
      .bind(categories, owner, token),
    db
      .prepare(
        `INSERT INTO diary_emotions (diary_id, category_code, emotion_code, label_snapshot, intensity, intensity_custom, display_order)
         SELECT json_extract(value, '$.d'), json_extract(value, '$.c'), json_extract(value, '$.e'), json_extract(value, '$.l'), json_extract(value, '$.i'),
                json_extract(value, '$.x'), json_extract(value, '$.o')
           FROM json_each(?1) WHERE ${mine}`
      )
      .bind(emotions, owner, token),
    db
      .prepare(
        `INSERT INTO diary_reflections (diary_id, kind, slot, text)
         SELECT json_extract(value, '$.d'), json_extract(value, '$.k'), json_extract(value, '$.s'), json_extract(value, '$.t') FROM json_each(?1) WHERE ${mine}`
      )
      .bind(reflections, owner, token)
  ];
  if (settings) {
    // 설정은 행이 없을 때만 되살린다 — 지금 쓰는 이름·기준 시각을 백업이 덮지 않게
    statements.push(
      db
        .prepare(
          `INSERT INTO owner_settings (owner_key, display_name, day_start_hour, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)
           ON CONFLICT (owner_key) DO NOTHING`
        )
        .bind(owner, settings.displayName, settings.dayStartHour, now)
    );
  }
  const results = await db.batch(statements);
  const inserted = await db.prepare("SELECT entry_date FROM diary_entries WHERE owner_key = ?1 AND write_token = ?2").bind(owner, token).all<{ entry_date: string }>();
  const insertedDates = new Set(inserted.results.map((row) => row.entry_date));
  const body200: ImportResult = {
    inserted: insertedDates.size,
    skipped: entries.map((v) => v.entryDate).filter((date) => !insertedDates.has(date)),
    settingsRestored: settings ? (results[4]?.meta?.changes ?? 0) > 0 : false
  };
  return json(200, body200);
}
