// 개발용 건물에서만 붙는 화면 오류 보고(D-113 ②, D-115 ⑤). index.ts가 __APP_ENV__가 prod가 아닐 때만 이 파일을 쓴다 —
// 운영 묶음에는 이 경로가 코드째 없다(빌드 검사가 확인한다).
import { CLIENT_ERROR_KEEP_ROWS, CLIENT_ERRORS_PATH, parseClientError } from "../../../shared/dev";
import type { Ctx, Handler } from "../context";
import { iso } from "../context";
import { randomId } from "../crypto";
import { empty, fail } from "../http";
import { readJson } from "../request";

/** 정해진 일곱 칸만 받는다. 메시지·stack·입력한 글은 칸 자체가 없어 들어올 수 없다(모양이 다르면 400). 최근 200행만 남긴다. */
async function reportClientError(ctx: Ctx): Promise<Response> {
  const body = await readJson(ctx.request);
  if (body instanceof Response) return body;
  const report = parseClientError(body);
  if (!report) return fail(400, "invalid_body");
  const db = ctx.env.DB;
  await db.batch([
    db
      .prepare(
        "INSERT INTO client_errors (id, created_at, kind, name, source, line, col, build, route) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)"
      )
      .bind(randomId(), iso(ctx.now), report.kind, report.name, report.source, report.line, report.col, report.build, report.route),
    db
      .prepare("DELETE FROM client_errors WHERE id NOT IN (SELECT id FROM client_errors ORDER BY created_at DESC, id DESC LIMIT ?1)")
      .bind(CLIENT_ERROR_KEEP_ROWS)
  ]);
  return empty(204);
}

export function devRoutes(): ReadonlyMap<string, Handler> {
  return new Map<string, Handler>([[`POST ${CLIENT_ERRORS_PATH}`, reportClientError]]);
}
