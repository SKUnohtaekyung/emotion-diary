// 일기 저장 핵심(DATA_MODEL §3.1~§3.3·§3.7·§5·§8, ARCHITECTURE §5, TASK-DATA-01 PLAN §3).
// 주인은 언제나 세션에서 정한다 — 주소·본문의 어떤 값도 주인을 바꾸지 못한다(F-02). 날짜는 주소 조각이라 여기서 모양을 본다.
// 쓰기는 batch 하나(전부 되거나 전부 안 됨). 부모 갱신은 판 번호를 조건으로, 딸린 행 문장은 이번 요청의 쓰기 표(write_token)를
// 조건으로 건다 — 같은 판에서 출발한 두 요청이 겹쳐도 진 쪽의 딸린 행이 이긴 쪽을 덮지 않는다(PLAN §3.2).
// diary_entries에 `REPLACE`/`INSERT OR REPLACE`를 쓰지 않는다 — 내부 삭제가 trigger를 건너뛰고 딸린 행을 연쇄로 지운다(SQL 검토 M1, 시험이 막는다).
import { TIMEZONE_HEADER } from "../../../shared/api";
import {
  BLANK_CHARS_SQL,
  canonicalTimeZone,
  DIARY_MAX_BODY_BYTES,
  type DiaryEntryView,
  type DiaryMeta,
  type DiaryStatus,
  type DiarySummary,
  isIsoDate,
  isRevision,
  localDayAt,
  missingForCompletion,
  type NormalizedDiary,
  parseDiaryInput,
  type ResumeStep,
  type ResumeView,
  type TodayInfo
} from "../../../shared/diary";
import { TAXONOMY_VERSION } from "../../../shared/taxonomy";
import { type Ctx, iso, type Session } from "../context";
import { fail, json } from "../http";
import { type Operation, type Receipt, receiptFor, receiptStatements, replay } from "../idempotency";
import { readJsonText } from "../request";
import { liveSession, sessionIsLive } from "../session";

export interface EntryRow {
  id: string;
  entry_date: string;
  timezone: string;
  status: DiaryStatus;
  revision: number;
  taxonomy_version: string;
  event_text: string;
  reason_text: string;
  resume_step: ResumeStep | null;
  resume_category: string | null;
  first_completed_at: string | null;
  first_completed_local_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow {
  category_code: string;
  intensity: number | null;
}

export interface EmotionRow {
  category_code: string;
  emotion_code: string;
  label_snapshot: string;
  intensity: number | null;
  intensity_custom: number;
}

export interface ReflectionRow {
  kind: "praise" | "gratitude";
  slot: number;
  text: string;
}

export const ENTRY_COLUMNS = `id, entry_date, timezone, status, revision, taxonomy_version, event_text, reason_text, resume_step, resume_category,
  first_completed_at, first_completed_local_date, completed_at, created_at, updated_at`;

/** 이번 요청이 부모 행을 바꿨는가 — 딸린 행 문장과 영수증의 조건. ?1 = 일기 번호, ?2 = 쓰기 표. */
const WRITTEN = "EXISTS (SELECT 1 FROM diary_entries WHERE id = ?1 AND write_token = ?2)";

const resumeView = (step: ResumeStep | null, category: string | null): ResumeView | null =>
  step ? { step, categoryCode: step === "details" ? category : null } : null;

function timeZoneOf(ctx: Ctx): string | null {
  return canonicalTimeZone(ctx.request.headers.get(TIMEZONE_HEADER));
}

/** 주소의 날짜 조각. 달력 날짜가 아니면 null(→ 400). */
function dateParam(ctx: Ctx): string | null {
  const date = ctx.params.date;
  return isIsoDate(date) ? date : null;
}

async function loadEntry(ctx: Ctx, owner: string, date: string): Promise<DiaryEntryView | null> {
  const db = ctx.env.DB;
  // 딸린 행도 주인·날짜로 다시 찾는다 — 번호만으로 남의 행에 닿지 않게.
  const parent = "(SELECT id FROM diary_entries WHERE owner_key = ?1 AND entry_date = ?2)";
  const [entries, categories, emotions, reflections] = await db.batch([
    db.prepare(`SELECT ${ENTRY_COLUMNS} FROM diary_entries WHERE owner_key = ?1 AND entry_date = ?2`).bind(owner, date),
    db.prepare(`SELECT category_code, intensity FROM diary_categories WHERE diary_id = ${parent} ORDER BY display_order`).bind(owner, date),
    db
      .prepare(
        `SELECT category_code, emotion_code, label_snapshot, intensity, intensity_custom FROM diary_emotions WHERE diary_id = ${parent} ORDER BY display_order`
      )
      .bind(owner, date),
    db.prepare(`SELECT kind, slot, text FROM diary_reflections WHERE diary_id = ${parent} ORDER BY kind, slot`).bind(owner, date)
  ]);
  const row = (entries?.results as EntryRow[] | undefined)?.[0];
  if (!row) return null;
  return entryView(
    row,
    (categories?.results ?? []) as CategoryRow[],
    (emotions?.results ?? []) as EmotionRow[],
    (reflections?.results ?? []) as ReflectionRow[]
  );
}

/** 창고의 행들 → 응답·내보내기의 기록 하나(diary-entry-v2). 딸린 행은 표시 순서대로 받는다. */
export function entryView(row: EntryRow, categoryRows: CategoryRow[], emotionRows: EmotionRow[], reflectionRows: ReflectionRow[]): DiaryEntryView {
  return {
    schemaVersion: "diary-entry-v2",
    id: row.id,
    entryDate: row.entry_date,
    timezone: row.timezone,
    status: row.status,
    revision: row.revision,
    taxonomyVersion: row.taxonomy_version,
    eventText: row.event_text,
    reasonText: row.reason_text,
    categories: categoryRows.map((item) => ({ categoryCode: item.category_code, intensity: item.intensity })),
    emotions: emotionRows.map((item) => ({
      categoryCode: item.category_code,
      emotionCode: item.emotion_code,
      labelSnapshot: item.label_snapshot,
      intensity: item.intensity,
      custom: item.intensity_custom === 1
    })),
    praises: reflectionRows.filter((item) => item.kind === "praise").map(({ slot, text }) => ({ slot, text })),
    gratitudes: reflectionRows.filter((item) => item.kind === "gratitude").map(({ slot, text }) => ({ slot, text })),
    resume: resumeView(row.resume_step, row.resume_category),
    firstCompletedAt: row.first_completed_at,
    firstCompletedLocalDate: row.first_completed_local_date,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

interface HeadRow {
  id: string;
  revision: number;
  status: DiaryStatus;
  first_completed_local_date: string | null;
  completed_at: string | null;
}

const loadHead = (ctx: Ctx, owner: string, date: string) =>
  ctx.env.DB.prepare("SELECT id, revision, status, first_completed_local_date, completed_at FROM diary_entries WHERE owner_key = ?1 AND entry_date = ?2")
    .bind(owner, date)
    .first<HeadRow>();

const conflict = (currentRevision: number | null) => fail(409, "revision_conflict", { currentRevision });

/** 쓰기가 반영되지 않았을 때: 같은 열쇠의 요청이 먼저 끝냈으면 그 응답을, 아니면 지금 판 번호로 409. */
async function afterLostRace(ctx: Ctx, session: Session, receipt: Receipt, date: string): Promise<Response> {
  const replayed = await replay(ctx, session, receipt);
  if (replayed) return replayed;
  const head = await loadHead(ctx, session.owner, date);
  return conflict(head?.revision ?? null);
}

// ── GET /api/today ────────────────────────────────────────────────

interface SummaryRow {
  entry_date: string;
  status: DiaryStatus;
  revision: number;
  resume_step: ResumeStep | null;
  resume_category: string | null;
  updated_at: string;
  categories: string | null;
}

const SUMMARY_COLUMNS = `entry_date, status, revision, resume_step, resume_category, updated_at,
  (SELECT json_group_array(category_code) FROM (SELECT category_code FROM diary_categories WHERE diary_id = d.id ORDER BY display_order)) AS categories`;

const summary = (row: SummaryRow | null): DiarySummary | null =>
  row
    ? {
        entryDate: row.entry_date,
        status: row.status,
        revision: row.revision,
        categories: row.categories ? (JSON.parse(row.categories) as string[]) : [],
        resume: resumeView(row.resume_step, row.resume_category),
        updatedAt: row.updated_at
      }
    : null;

/** `GET /api/today` — 서버가 센 오늘과 오늘 기록의 요약, 가장 최근의 지난 임시저장. 글은 싣지 않는다. */
export async function getToday(ctx: Ctx): Promise<Response> {
  const session = ctx.session as Session;
  const timeZone = timeZoneOf(ctx);
  if (!timeZone) return fail(400, "invalid_timezone");
  const date = localDayAt(ctx.now, timeZone, session.dayStartHour);
  const db = ctx.env.DB;
  const [today, past] = await db.batch([
    db.prepare(`SELECT ${SUMMARY_COLUMNS} FROM diary_entries AS d WHERE owner_key = ?1 AND entry_date = ?2`).bind(session.owner, date),
    db
      .prepare(
        `SELECT ${SUMMARY_COLUMNS} FROM diary_entries AS d
          WHERE owner_key = ?1 AND status = 'draft' AND entry_date < ?2 ORDER BY entry_date DESC LIMIT 1`
      )
      .bind(session.owner, date)
  ]);
  const body: TodayInfo = {
    date,
    timezone: timeZone,
    dayStartHour: session.dayStartHour,
    entry: summary(((today?.results ?? []) as SummaryRow[])[0] ?? null),
    pastDraft: summary(((past?.results ?? []) as SummaryRow[])[0] ?? null)
  };
  return json(200, body);
}

// ── GET /api/diaries/:date ────────────────────────────────────────

/** 그날 기록 전체. 없으면 404(없는 날·미래 날짜도 — 새 기록을 만들지 않는다, D-083). */
export async function getDiary(ctx: Ctx): Promise<Response> {
  const session = ctx.session as Session;
  const date = dateParam(ctx);
  if (!date) return fail(400, "invalid_date");
  const entry = await loadEntry(ctx, session.owner, date);
  return entry ? json(200, entry) : fail(404, "not_found");
}

// ── PUT /api/diaries/:date ────────────────────────────────────────

/** 딸린 행을 json_each 한 덩어리로 넘기는 모양(짧은 키 — 본문 한도 안의 값만 든다). */
function childJson(diary: NormalizedDiary) {
  return {
    categories: JSON.stringify(diary.categories.map((item) => ({ c: item.code, o: item.order, i: item.intensity }))),
    emotions: JSON.stringify(
      diary.emotions.map((item) => ({ c: item.category, e: item.code, l: item.label, o: item.order, i: item.intensity, x: item.custom ? 1 : 0 }))
    ),
    reflections: JSON.stringify(diary.reflections.map((item) => ({ k: item.kind, s: item.slot, t: item.text })))
  };
}

/**
 * 딸린 행 문장들(서버 검사가 놓친 어긋남을 창고가 되돌리는지 시험이 직접 부른다 — `diary-db.test.ts`). 넣고 고친 뒤에 지운다 — 완료된 기록의 '감정 0개 금지'(trigger)에 중간 상태로 걸리지 않게.
 * 바뀐 것만 고친다(값이 같으면 DO UPDATE의 WHERE가 거짓 — 쓰기 한도를 아낀다). 이미 있는 감정의 표시명은 고쳐 쓰지 않는다.
 */
export function childStatements(db: D1Database, id: string, token: string, diary: NormalizedDiary, replace: boolean): D1PreparedStatement[] {
  const data = childJson(diary);
  const statements = [
    db
      .prepare(
        `INSERT INTO diary_categories (diary_id, category_code, display_order, intensity)
         SELECT ?1, json_extract(value, '$.c'), json_extract(value, '$.o'), json_extract(value, '$.i') FROM json_each(?3) WHERE ${WRITTEN}
         ON CONFLICT (diary_id, category_code) DO UPDATE SET display_order = excluded.display_order, intensity = excluded.intensity
          WHERE diary_categories.display_order IS NOT excluded.display_order OR diary_categories.intensity IS NOT excluded.intensity`
      )
      .bind(id, token, data.categories),
    db
      .prepare(
        `INSERT INTO diary_emotions (diary_id, category_code, emotion_code, label_snapshot, intensity, intensity_custom, display_order)
         SELECT ?1, json_extract(value, '$.c'), json_extract(value, '$.e'), json_extract(value, '$.l'), json_extract(value, '$.i'),
                json_extract(value, '$.x'), json_extract(value, '$.o')
           FROM json_each(?3) WHERE ${WRITTEN}
         ON CONFLICT (diary_id, emotion_code) DO UPDATE SET intensity = excluded.intensity, intensity_custom = excluded.intensity_custom,
                display_order = excluded.display_order
          WHERE diary_emotions.intensity IS NOT excluded.intensity OR diary_emotions.intensity_custom IS NOT excluded.intensity_custom
             OR diary_emotions.display_order IS NOT excluded.display_order`
      )
      .bind(id, token, data.emotions),
    db
      .prepare(
        `INSERT INTO diary_reflections (diary_id, kind, slot, text)
         SELECT ?1, json_extract(value, '$.k'), json_extract(value, '$.s'), json_extract(value, '$.t') FROM json_each(?3) WHERE ${WRITTEN}
         ON CONFLICT (diary_id, kind, slot) DO UPDATE SET text = excluded.text WHERE diary_reflections.text IS NOT excluded.text`
      )
      .bind(id, token, data.reflections)
  ];
  if (!replace) return statements;
  return [
    ...statements,
    db
      .prepare(
        `DELETE FROM diary_emotions WHERE diary_id = ?1 AND ${WRITTEN}
            AND emotion_code NOT IN (SELECT json_extract(value, '$.e') FROM json_each(?3))`
      )
      .bind(id, token, data.emotions),
    db
      .prepare(
        `DELETE FROM diary_reflections WHERE diary_id = ?1 AND ${WRITTEN}
            AND NOT EXISTS (SELECT 1 FROM json_each(?3) AS j
                             WHERE json_extract(j.value, '$.k') = diary_reflections.kind AND json_extract(j.value, '$.s') = diary_reflections.slot)`
      )
      .bind(id, token, data.reflections),
    db
      .prepare(
        `DELETE FROM diary_categories WHERE diary_id = ?1 AND ${WRITTEN}
            AND category_code NOT IN (SELECT json_extract(value, '$.c') FROM json_each(?3))`
      )
      .bind(id, token, data.categories),
    // 완료된 기록이면 딸린 행을 바꾼 뒤 상태 칸을 한 번 더 써서 완료 조건 trigger(BEFORE UPDATE OF status)를 다시 거친다 —
    // 어긋나면 batch 전체가 되돌아간다. 첫 부모 갱신은 상태 칸을 쓰지 않아, 어긋나 있던 기록도 올바른 저장으로 고칠 수 있다.
    db.prepare(`UPDATE diary_entries SET status = status WHERE id = ?1 AND write_token = ?2 AND status = 'completed'`).bind(id, token)
  ];
}

const meta = (fields: DiaryMeta): DiaryMeta => fields;

/**
 * `PUT /api/diaries/:date` — 임시저장(통째로 — 화면은 입력이 멈출 때마다 지금 상태 전체를 보낸다).
 * 새로 만들기는 서버가 센 오늘만(D-082). 있는 기록은 날짜가 지나도 이어 쓴다. 완료된 기록은 완료 조건을 다시 검사한다(D-023).
 */
export async function saveDiary(ctx: Ctx): Promise<Response> {
  const session = ctx.session as Session;
  const date = dateParam(ctx);
  if (!date) return fail(400, "invalid_date");
  const timeZone = timeZoneOf(ctx);
  if (!timeZone) return fail(400, "invalid_timezone");
  const read = await readJsonText(ctx.request, DIARY_MAX_BODY_BYTES);
  if (read instanceof Response) return read;
  const receipt = await receiptFor(ctx, "diary.save", read.text);
  if (!receipt) return fail(400, "idempotency_key_required");
  const parsed = parseDiaryInput(read.body);
  if (!parsed.ok) return fail(parsed.status, parsed.error, { field: parsed.field });
  // 기록을 먼저 읽고 영수증을 본다 — 같은 열쇠의 요청이 그 사이에 끝났어도 아래 판 번호 검사가 아니라 영수증 응답으로 간다.
  const head = await loadHead(ctx, session.owner, date);
  const replayed = await replay(ctx, session, receipt);
  if (replayed) return replayed;

  const diary = parsed.value;
  const db = ctx.env.DB;
  const now = iso(ctx.now);
  const token = crypto.randomUUID();
  const resumeStep = diary.resume?.step ?? null;
  const resumeCategory = diary.resume?.category ?? null;

  if (!head) {
    if (diary.revision !== null) return conflict(null); // 지워진 기록을 판 번호로 고치려 했다 — 몰래 되살리지 않는다
    if (date !== localDayAt(ctx.now, timeZone, session.dayStartHour)) return fail(422, "not_today");
    const id = crypto.randomUUID();
    const body = meta({ id, entryDate: date, status: "draft", revision: 1, updatedAt: now, completedAt: null, firstCompletedLocalDate: null });
    const results = await db.batch([
      db
        .prepare(
          `INSERT INTO diary_entries (id, owner_key, entry_date, timezone, status, event_text, reason_text, revision, taxonomy_version,
                                      resume_step, resume_category, write_token, created_at, updated_at)
           SELECT ?1, ?2, ?3, ?4, 'draft', ?5, ?6, 1, ?7, ?8, ?9, ?10, ?11, ?11 WHERE ${liveSession(12, 13)}
           ON CONFLICT (owner_key, entry_date) DO NOTHING RETURNING id`
        )
        .bind(id, session.owner, date, timeZone, diary.eventText, diary.reasonText, TAXONOMY_VERSION, resumeStep, resumeCategory, token, now, session.id, session.dataEpoch),
      ...childStatements(db, id, token, diary, false),
      ...receiptStatements(ctx, session, receipt, { status: 201, body }, { sql: "EXISTS (SELECT 1 FROM diary_entries WHERE id = ?9 AND write_token = ?10)", params: [id, token] })
    ]);
    if (!results[0]?.results?.length) {
      // 모든 기록 지우기가 이 요청을 받은 뒤에 끝났다 — 기록을 되살리지 않았다(liveSession, 마이그레이션 0008). 있는 기록을 고치는
      // UPDATE는 지워진 행에 닿지 않아 따로 걸지 않는다 — 행을 새로 만드는 쓰기만 막으면 된다
      if (!(await sessionIsLive(ctx, session))) return fail(401, "unauthorized");
      return afterLostRace(ctx, session, receipt, date); // 같은 날을 동시에 만든 다른 요청이 이겼다(F-06)
    }
    return json(201, body);
  }

  if (diary.revision !== head.revision) return conflict(head.revision);
  if (head.status === "completed") {
    const missing = missingForCompletion({ eventText: diary.eventText, reasonText: diary.reasonText, categories: diary.categories, emotions: diary.emotions });
    if (missing.length) return fail(422, "incomplete", { missing });
  }
  const body = meta({
    id: head.id,
    entryDate: date,
    status: head.status,
    revision: head.revision + 1,
    updatedAt: now,
    completedAt: head.completed_at,
    firstCompletedLocalDate: head.first_completed_local_date
  });
  const results = await db.batch([
    db
      .prepare(
        `UPDATE diary_entries SET event_text = ?4, reason_text = ?5, resume_step = ?6, resume_category = ?7,
                revision = revision + 1, write_token = ?8, updated_at = ?9
          WHERE id = ?1 AND owner_key = ?2 AND revision = ?3 RETURNING revision`
      )
      .bind(head.id, session.owner, head.revision, diary.eventText, diary.reasonText, resumeStep, resumeCategory, token, now),
    ...childStatements(db, head.id, token, diary, true),
    ...receiptStatements(ctx, session, receipt, { status: 200, body }, { sql: "EXISTS (SELECT 1 FROM diary_entries WHERE id = ?9 AND write_token = ?10)", params: [head.id, token] })
  ]);
  if (!results[0]?.results?.length) return afterLostRace(ctx, session, receipt, date); // 같은 판에서 출발한 다른 요청이 먼저 썼다(F-09)
  return json(200, body);
}

// ── POST /api/diaries/:date/complete ──────────────────────────────

const ONLY_REVISION = (body: Record<string, unknown>) =>
  Object.keys(body).length === 1 && isRevision(body.revision) ? (body.revision as number) : null;

/**
 * 완료 — 검사와 전환을 조건부 UPDATE 하나로(검사 뒤 쓰기로 나누면 그 사이에 바뀔 수 있다, DATA_MODEL §3.1).
 * 날짜가 지난 임시저장도 완료할 수 있다(D-082). 최초 완료일은 완료 요청의 시간대로 센 실제 완료한 날이다 — streak를 되살리지 않는다.
 */
export async function completeDiary(ctx: Ctx): Promise<Response> {
  const session = ctx.session as Session;
  const date = dateParam(ctx);
  if (!date) return fail(400, "invalid_date");
  const timeZone = timeZoneOf(ctx);
  if (!timeZone) return fail(400, "invalid_timezone");
  const read = await readJsonText(ctx.request);
  if (read instanceof Response) return read;
  const receipt = await receiptFor(ctx, "diary.complete", read.text);
  if (!receipt) return fail(400, "idempotency_key_required");
  const revision = ONLY_REVISION(read.body);
  if (revision === null) return fail(400, "invalid_body", { field: "revision" });
  const head = await loadHead(ctx, session.owner, date);
  const replayed = await replay(ctx, session, receipt);
  if (replayed) return replayed;
  if (!head) return fail(404, "not_found");
  if (head.revision !== revision) return conflict(head.revision);
  if (head.status !== "draft") return fail(409, "not_draft");

  const db = ctx.env.DB;
  const now = iso(ctx.now);
  const token = crypto.randomUUID();
  const firstLocalDate = localDayAt(ctx.now, timeZone, session.dayStartHour);
  const body = meta({
    id: head.id,
    entryDate: date,
    status: "completed",
    revision: head.revision + 1,
    updatedAt: now,
    completedAt: now,
    firstCompletedLocalDate: head.first_completed_local_date ?? firstLocalDate
  });
  const W = BLANK_CHARS_SQL;
  const results = await db.batch([
    db
      .prepare(
        `UPDATE diary_entries SET status = 'completed', revision = revision + 1, write_token = ?4, completed_at = ?5, updated_at = ?5,
                first_completed_at = COALESCE(first_completed_at, ?5), first_completed_local_date = COALESCE(first_completed_local_date, ?6)
          WHERE id = ?1 AND owner_key = ?2 AND revision = ?3 AND status = 'draft'
            AND trim(event_text, ${W}) <> '' AND trim(reason_text, ${W}) <> ''
            AND EXISTS (SELECT 1 FROM diary_emotions WHERE diary_id = diary_entries.id)
            AND NOT EXISTS (SELECT 1 FROM diary_emotions WHERE diary_id = diary_entries.id AND intensity IS NULL)
            AND NOT EXISTS (
              SELECT 1 FROM diary_categories AS c
               WHERE c.diary_id = diary_entries.id
                 AND (c.intensity IS NULL OR NOT EXISTS (SELECT 1 FROM diary_emotions AS e WHERE e.diary_id = c.diary_id AND e.category_code = c.category_code)))
          RETURNING revision`
      )
      .bind(head.id, session.owner, head.revision, token, now, firstLocalDate),
    ...receiptStatements(ctx, session, receipt, { status: 200, body }, { sql: "EXISTS (SELECT 1 FROM diary_entries WHERE id = ?9 AND write_token = ?10)", params: [head.id, token] })
  ]);
  if (results[0]?.results?.length) return json(200, body);

  // 반영되지 않았다: 같은 열쇠가 먼저 끝냈거나, 판 번호가 바뀌었거나, 완료 조건이 모자란다.
  const replayedLate = await replay(ctx, session, receipt);
  if (replayedLate) return replayedLate;
  const entry = await loadEntry(ctx, session.owner, date);
  if (!entry) return fail(404, "not_found");
  if (entry.revision !== revision) return conflict(entry.revision);
  if (entry.status !== "draft") return fail(409, "not_draft");
  const missing = missingForCompletion({
    eventText: entry.eventText,
    reasonText: entry.reasonText,
    categories: entry.categories.map((item) => ({ code: item.categoryCode, intensity: item.intensity })),
    emotions: entry.emotions.map((item) => ({ category: item.categoryCode, intensity: item.intensity }))
  });
  return fail(422, "incomplete", { missing });
}

// ── DELETE /api/diaries/:date ─────────────────────────────────────

/**
 * 기록 하나 영구 삭제(DATA_MODEL §8). 확인 표시는 지금 판 번호 — 본 그 판만 지운다(다른 기기에서 고친 뒤면 409).
 * 부모를 먼저 지우고 딸린 행은 외래 키 연쇄로. 성공은 meta.changes(연쇄가 끼면 부풀려진다)가 아니라 지운 뒤 조회로 판정한다.
 */
export async function deleteDiary(ctx: Ctx): Promise<Response> {
  const session = ctx.session as Session;
  const date = dateParam(ctx);
  if (!date) return fail(400, "invalid_date");
  const read = await readJsonText(ctx.request);
  if (read instanceof Response) return read;
  const receipt = await receiptFor(ctx, "diary.delete" satisfies Operation, read.text);
  if (!receipt) return fail(400, "idempotency_key_required");
  const revision = ONLY_REVISION(read.body);
  if (revision === null) return fail(400, "invalid_body", { field: "revision" });
  const head = await loadHead(ctx, session.owner, date);
  const replayed = await replay(ctx, session, receipt);
  if (replayed) return replayed;
  if (!head) return fail(404, "not_found");
  if (head.revision !== revision) return conflict(head.revision);
  const db = ctx.env.DB;
  const body = { deleted: true, entryDate: date };
  await db.batch([
    db.prepare("DELETE FROM diary_entries WHERE id = ?1 AND owner_key = ?2 AND revision = ?3").bind(head.id, session.owner, revision),
    ...receiptStatements(ctx, session, receipt, { status: 200, body }, { sql: "NOT EXISTS (SELECT 1 FROM diary_entries WHERE id = ?9)", params: [head.id] })
  ]);
  const still = await db.prepare("SELECT revision FROM diary_entries WHERE id = ?1").bind(head.id).first<{ revision: number }>();
  if (still) return (await replay(ctx, session, receipt)) ?? conflict(still.revision);
  return json(200, body);
}
