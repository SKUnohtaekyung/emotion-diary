// 서버 시험 도구(D-115 ⑥). wrangler getPlatformProxy가 띄운 로컬 D1(workerd — 실제 D1과 같은 SQLite 의미)에
// 마이그레이션을 적용하고, Worker 코드(createApp)를 Node에서 직접 부른다. 시각은 시험이 옮긴다.
// 열쇠·비밀값은 시험마다 무작위로 만든다 — 저장소에 고정된 값을 두지 않는다.
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { getPlatformProxy } from "wrangler";
import { CSRF_HEADER, CSRF_VALUE, SESSION_COOKIE } from "../../shared/api";
import { createApp } from "../../worker/src/app";
import type { AppConfig, Bindings, Handler } from "../../worker/src/context";
import { hmacHex } from "../../worker/src/crypto";

export const ORIGIN = "https://app.test";
export const START = Date.parse("2026-10-14T00:00:00.000Z");

const migrationsDir = fileURLToPath(new URL("../../migrations/", import.meta.url));

type SqlState = "start" | "normal" | "create" | "trigger" | "semi" | "end";
type SqlToken = "semi" | "ws" | "create" | "temp" | "trigger" | "end" | "other";

/** SQLite `sqlite3_complete`의 상태표(wrangler `d1 migrations apply`의 분할기와 같다) — `CREATE TRIGGER … BEGIN … END;` 안의 `;`에서 끊지 않는다. */
const NEXT: Record<SqlState, Partial<Record<SqlToken, SqlState>> & { other: SqlState }> = {
  start: { semi: "start", ws: "start", create: "create", other: "normal" },
  normal: { semi: "start", other: "normal" },
  create: { semi: "start", ws: "create", temp: "create", trigger: "trigger", other: "normal" },
  trigger: { semi: "semi", other: "trigger" },
  semi: { semi: "semi", ws: "semi", end: "end", other: "trigger" },
  end: { semi: "start", ws: "end", other: "trigger" }
};

const KEYWORDS: Record<string, SqlToken> = { create: "create", temp: "temp", temporary: "temp", trigger: "trigger", end: "end" };

/** SQL 글을 문장으로 나눈다. 줄 주석·블록 주석과 따옴표 속은 건너뛴다. */
export function splitSql(sql: string): string[] {
  const statements: string[] = [];
  let state: SqlState = "start";
  let begin = 0;
  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index] ?? "";
    let token: SqlToken = "other";
    if (char === ";") token = "semi";
    else if (/\s/.test(char)) token = "ws";
    else if (char === "-" && sql[index + 1] === "-") {
      const end = sql.indexOf("\n", index);
      index = end < 0 ? sql.length : end;
      token = "ws";
    } else if (char === "/" && sql[index + 1] === "*") {
      const end = sql.indexOf("*/", index + 2);
      index = end < 0 ? sql.length : end + 1;
      token = "ws";
    } else if (char === "'" || char === '"' || char === "`") {
      const end = sql.indexOf(char, index + 1);
      index = end < 0 ? sql.length : end;
    } else if (/[A-Za-z_]/.test(char)) {
      let end = index;
      while (end + 1 < sql.length && /[A-Za-z0-9_$]/.test(sql[end + 1] ?? "")) end += 1;
      token = KEYWORDS[sql.slice(index, end + 1).toLowerCase()] ?? "other";
      index = end;
    }
    state = NEXT[state][token] ?? NEXT[state].other;
    if (token === "semi" && state === "start") {
      const statement = stripComments(sql.slice(begin, index)).trim();
      if (statement) statements.push(statement);
      begin = index + 1;
    }
  }
  const rest = stripComments(sql.slice(begin)).trim();
  if (rest) statements.push(rest);
  return statements;
}

/** 문장 앞뒤의 주석 줄만 걷어 낸다(문장 안의 글은 그대로). */
function stripComments(statement: string): string {
  return statement
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
}

/** 마이그레이션 파일들을 번호 순서로 문장으로 나눈다. */
export function migrationStatements(): string[] {
  return readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .flatMap((name) => splitSql(readFileSync(migrationsDir + name, "utf8")));
}

export const migrationText = (name: string): string => readFileSync(migrationsDir + name, "utf8");

/** 시험마다 비우는 표. 일기 딸린 행은 diary_entries를 지우면 연쇄로 지워진다(부모 먼저 — DATA_MODEL §8). */
const TABLES = ["idempotency_records", "diary_entries", "client_errors", "owner_settings", "sessions", "auth_failures"];

export interface TestServer {
  db: D1Database;
  key: string;
  clock: { now: number };
  /** 이 설정으로 만든 앱을 부른다(기본: 개발용 경로 없음 = 운영과 같은 경로 표) */
  app: (overrides?: Partial<AppConfig>) => { fetch: (request: Request, env: Bindings) => Promise<Response> };
  env: Bindings;
  reset: () => Promise<void>;
  dispose: () => Promise<void>;
}

export async function startServer(): Promise<TestServer> {
  // wrangler.jsonc의 정적 파일 폴더가 없으면 프록시가 뜨지 않는다. 시험은 빌드보다 먼저 돌 수 있다(verify full: lint → typecheck → test → build).
  mkdirSync(fileURLToPath(new URL("../../../dist/dev/client/", import.meta.url)), { recursive: true });
  const proxy = await getPlatformProxy<{ DB: D1Database }>({ configPath: "wrangler.jsonc", persist: false });
  const db = proxy.env.DB;
  await db.batch(migrationStatements().map((sql) => db.prepare(sql)));
  const key = randomBytes(32).toString("base64url");
  const salt = randomBytes(32).toString("base64url");
  const env: Bindings = {
    DB: db,
    ASSETS: { fetch: async () => new Response("static", { status: 200 }) } as unknown as Fetcher,
    OWNER_SUBJECT: "owner",
    OWNER_ALLOWLIST: "owner",
    ACCESS_KEY_HASH: await hmacHex(salt, key),
    ACCESS_KEY_SALT: salt,
    SESSION_SECRET: randomBytes(32).toString("base64url"),
    APP_LOCK_SECRET: randomBytes(32).toString("base64url")
  };
  const clock = { now: START };
  return {
    db,
    key,
    clock,
    env,
    app: (overrides = {}) => createApp({ appEnv: "dev", build: "test-build", now: () => clock.now, ...overrides }),
    reset: async () => {
      clock.now = START;
      await db.batch([
        ...TABLES.map((table) => db.prepare(`DELETE FROM ${table}`)),
        db.prepare("INSERT INTO auth_failures (id, fail_count) VALUES (1, 0)")
      ]);
    },
    dispose: () => proxy.dispose()
  };
}

export interface Reply {
  status: number;
  body: Record<string, unknown> | null;
  headers: Headers;
  /** 응답의 Set-Cookie에서 세션 cookie 값(해제면 "") */
  cookie: string | null;
  raw: string;
}

export interface CallOptions {
  body?: unknown;
  cookie?: string | null;
  /** false면 CSRF 표식을 붙이지 않는다 */
  csrf?: boolean;
  headers?: Record<string, string>;
  devRoutes?: ReadonlyMap<string, Handler>;
  appEnv?: AppConfig["appEnv"];
  /** 이 요청만 다른 바인딩으로(예: batch를 붙잡아 두는 DB — 경쟁 상황을 결정적으로 재현) */
  env?: Partial<Bindings>;
}

export async function call(server: TestServer, method: string, path: string, options: CallOptions = {}): Promise<Reply> {
  const headers = new Headers(options.headers);
  if (options.csrf !== false && method !== "GET") {
    headers.set(CSRF_HEADER, CSRF_VALUE);
    if (!headers.has("origin")) headers.set("origin", ORIGIN);
    if (!headers.has("sec-fetch-site")) headers.set("sec-fetch-site", "same-origin");
  }
  if (options.cookie) headers.set("cookie", `${SESSION_COOKIE}=${options.cookie}`);
  let body: string | undefined;
  if (options.body !== undefined) {
    body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
    headers.set("content-type", "application/json");
  }
  const request = new Request(ORIGIN + path, { method, headers, body });
  const config: Partial<AppConfig> = { ...(options.appEnv ? { appEnv: options.appEnv } : {}), ...(options.devRoutes ? { devRoutes: options.devRoutes } : {}) };
  const response = await server.app(config).fetch(request, options.env ? { ...server.env, ...options.env } : server.env);
  const raw = await response.text();
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  } catch {
    parsed = null;
  }
  return { status: response.status, body: parsed, headers: response.headers, cookie: sessionCookieFrom(response.headers), raw };
}

export function sessionCookieFrom(headers: Headers): string | null {
  for (const line of headers.getSetCookie()) {
    if (line.startsWith(`${SESSION_COOKIE}=`)) return line.slice(SESSION_COOKIE.length + 1).split(";")[0] ?? "";
  }
  return null;
}

/** 열쇠로 로그인해 세션 cookie 값을 돌려준다. */
export async function login(server: TestServer, existingCookie?: string): Promise<string> {
  const reply = await call(server, "POST", "/api/session", { body: { key: server.key }, cookie: existingCookie ?? null });
  if (reply.status !== 200 || !reply.cookie) throw new Error(`login failed: ${reply.status}`);
  return reply.cookie;
}

/**
 * batch를 붙잡아 두는 DB. `reached`는 그 요청이 batch 앞에 섰을 때 풀리고, `release()`를 불러야 batch가 돈다.
 * 다른 요청이 그 사이에 끝까지 가게 해 '같은 판에서 출발한 두 요청'을 시간에 기대지 않고 만든다.
 */
export function heldBatchDb(db: D1Database): { db: D1Database; reached: Promise<void>; release: () => void } {
  let signal = () => {};
  let release = () => {};
  const reached = new Promise<void>((resolve) => {
    signal = resolve;
  });
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const held = new Proxy(db, {
    get(target, property) {
      if (property === "batch") {
        return async (statements: D1PreparedStatement[]) => {
          signal();
          await gate;
          return target.batch(statements);
        };
      }
      const value = Reflect.get(target, property);
      return typeof value === "function" ? value.bind(target) : value;
    }
  });
  return { db: held, reached, release };
}

export const minutes = (n: number) => n * 60_000;
export const days = (n: number) => n * 24 * 60 * 60_000;
