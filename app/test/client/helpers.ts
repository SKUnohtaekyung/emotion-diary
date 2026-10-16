/// <reference path="../../client/src/env.d.ts" />
// 화면 시험의 공통 도구. 서버는 가짜 fetch로 대신하고, 열쇠·비밀번호·이름은 시험 안에서 만든 가짜 값만 쓴다.
import { vi } from "vitest";

export interface FakeRequest {
  method: string;
  path: string;
  body: unknown;
  headers: Record<string, string>;
}

export interface FakeReply {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
}

/** 'offline'이면 서버에 닿지 못한 것(fetch가 TypeError로 거절)이다. */
export type FakeHandler = (request: FakeRequest) => FakeReply | "offline" | Promise<FakeReply | "offline">;

export function stubFetch(handler: FakeHandler): FakeRequest[] {
  const calls: FakeRequest[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const path = typeof input === "string" ? input : input instanceof URL ? input.pathname : input.url;
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries((init?.headers ?? {}) as Record<string, string>)) {
        headers[key.toLowerCase()] = value;
      }
      const body = typeof init?.body === "string" ? (JSON.parse(init.body) as unknown) : undefined;
      const request: FakeRequest = { method: init?.method ?? "GET", path, body, headers };
      calls.push(request);
      const reply = await handler(request);
      if (reply === "offline") throw new TypeError("Failed to fetch");
      const hasBody = reply.body !== undefined && reply.status !== 204;
      return new Response(hasBody ? JSON.stringify(reply.body) : null, {
        status: reply.status,
        headers: { "content-type": "application/json", ...reply.headers }
      });
    })
  );
  return calls;
}

export function mountShell(): void {
  document.body.innerHTML =
    '<div id="banner" role="status"></div><main id="app"></main><div id="live" class="sr-only" role="status" aria-live="polite"></div>';
}

export function session(overrides: Record<string, unknown> = {}): FakeReply {
  return {
    status: 200,
    body: {
      authenticated: true,
      env: "dev",
      build: "test-build",
      compat: 1,
      locked: false,
      appLock: false,
      hasName: true,
      ...overrides
    }
  };
}

export function setVisibility(state: "visible" | "hidden"): void {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
}

/** 기다리던 일이 모두 끝나도록 타이머 한 바퀴를 돌린다. */
export function flush(ms = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
