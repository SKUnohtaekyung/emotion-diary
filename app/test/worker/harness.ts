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

/** 마이그레이션 파일을 문장으로 나눈다(주석 줄을 빼고 `;`로). 뼈대의 SQL에는 문자열 속 `;`가 없다. */
export function migrationStatements(): string[] {
  return readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .flatMap((name) =>
      readFileSync(migrationsDir + name, "utf8")
        .split(/\r?\n/)
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .split(";")
        .map((statement) => statement.trim())
        .filter(Boolean)
    );
}

const TABLES = ["client_errors", "owner_settings", "sessions", "auth_failures"];

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
  const response = await server.app(config).fetch(request, server.env);
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

export const minutes = (n: number) => n * 60_000;
export const days = (n: number) => n * 24 * 60 * 60_000;
