// 부를 이름(D-112 ④, DATA_MODEL §3.4). 12자, 앞뒤 빈칸을 뺀 뒤 비어 있지 않아야 한다.
import { normalizeName, type ProfileInfo } from "../../../shared/api";
import { type Ctx, iso, type Session } from "../context";
import { fail, json } from "../http";
import { readJson } from "../request";

export async function getProfile(ctx: Ctx): Promise<Response> {
  const session = ctx.session as Session;
  const row = await ctx.env.DB.prepare("SELECT display_name FROM owner_settings WHERE owner_key = ?1")
    .bind(session.owner)
    .first<{ display_name: string | null }>();
  return json(200, { name: row?.display_name ?? null } satisfies ProfileInfo);
}

export async function putProfile(ctx: Ctx): Promise<Response> {
  const session = ctx.session as Session;
  const body = await readJson(ctx.request);
  if (body instanceof Response) return body;
  const name = normalizeName(body.name);
  if (name === null) return fail(422, "invalid_name");
  const t = iso(ctx.now);
  await ctx.env.DB.prepare(
    `INSERT INTO owner_settings (owner_key, display_name, created_at, updated_at) VALUES (?1, ?2, ?3, ?3)
     ON CONFLICT(owner_key) DO UPDATE SET display_name = excluded.display_name, updated_at = excluded.updated_at`
  )
    .bind(session.owner, name, t)
    .run();
  return json(200, { name } satisfies ProfileInfo);
}
