// 중복 요청의 영수증(DATA_MODEL §3.7, EVAL_PLAN F-10, TASK-DATA-01 S-6).
// 화면은 저장·완료·지우기마다 새 열쇠를 만들고, 응답을 못 받아 다시 보낼 때는 같은 열쇠를 쓴다.
// 같은 열쇠 + 같은 요청(방식·경로·본문 바이트) → 첫 응답을 그대로. 같은 열쇠 + 다른 요청 → 409.
// 영수증은 일기 쓰기와 **같은 batch**에서, 그 쓰기가 실제로 반영됐을 때만 남는다(문장의 WHERE가 그 조건이다).
// 응답에는 일기 글을 담지 않는다 — 번호·판 번호·상태·시각뿐이다.
import { IDEMPOTENCY_HEADER, REPLAYED_HEADER } from "../../shared/api";
import { IDEMPOTENCY_TTL_MS } from "../../shared/diary";
import { type Ctx, iso, type Session } from "./context";
import { toHex } from "./crypto";
import { fail, json } from "./http";

const KEY = /^[A-Za-z0-9_-]{16,64}$/;

export type Operation = "diary.save" | "diary.complete" | "diary.delete";

export interface Receipt {
  operation: Operation;
  key: string;
  hash: string;
}

/** 요청의 영수증 열쇠와 지문. 열쇠가 없거나 모양이 틀리면 null(→ 400). */
export async function receiptFor(ctx: Ctx, operation: Operation, bodyText: string): Promise<Receipt | null> {
  const key = ctx.request.headers.get(IDEMPOTENCY_HEADER);
  if (!key || !KEY.test(key)) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${ctx.request.method}\n${ctx.url.pathname}\n${bodyText}`));
  return { operation, key, hash: toHex(new Uint8Array(digest)) };
}

interface ReceiptRow {
  request_hash: string;
  response_status: number;
  response_json: string;
}

/** 살아 있는 영수증이 있으면 보낼 응답(첫 응답 그대로 / 다른 요청이면 409), 없으면 null. */
export async function replay(ctx: Ctx, session: Session, receipt: Receipt): Promise<Response | null> {
  const row = await ctx.env.DB.prepare(
    `SELECT request_hash, response_status, response_json FROM idempotency_records
      WHERE owner_key = ?1 AND operation = ?2 AND idempotency_key = ?3 AND expires_at > ?4`
  )
    .bind(session.owner, receipt.operation, receipt.key, iso(ctx.now))
    .first<ReceiptRow>();
  if (!row) return null;
  if (row.request_hash !== receipt.hash) return fail(409, "idempotency_mismatch");
  return json(row.response_status, JSON.parse(row.response_json), { [REPLAYED_HEADER]: "true" });
}

/** 같은 batch에 넣는 두 문장: 만료된 영수증 지우기 + (조건이 참일 때만) 이 요청의 영수증 넣기. */
export function receiptStatements(
  ctx: Ctx,
  session: Session,
  receipt: Receipt,
  response: { status: number; body: unknown },
  condition: { sql: string; params: unknown[] }
): D1PreparedStatement[] {
  const db = ctx.env.DB;
  const now = iso(ctx.now);
  const base = [session.owner, receipt.operation, receipt.key, receipt.hash, response.status, JSON.stringify(response.body), now, iso(ctx.now + IDEMPOTENCY_TTL_MS)];
  return [
    db.prepare("DELETE FROM idempotency_records WHERE expires_at <= ?1").bind(now),
    db
      .prepare(
        `INSERT INTO idempotency_records (owner_key, operation, idempotency_key, request_hash, response_status, response_json, created_at, expires_at)
         SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8 WHERE ${condition.sql}
         ON CONFLICT (owner_key, operation, idempotency_key) DO NOTHING`
      )
      .bind(...base, ...condition.params)
  ];
}
