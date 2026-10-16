// 정적 파일 헤더(app/client/public/_headers — ARCHITECTURE §11.6, EVAL F-25)의 내용을 잰다. 파일이 있는지만 보면
// 누가 CSP에 'unsafe-inline'을 넣거나 긴 캐시를 첫 화면 파일에 걸어도 검사가 통과한다.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const file = fileURLToPath(new URL("../../client/public/_headers", import.meta.url));

/** Cloudflare _headers 형식: 들여쓰지 않은 줄이 경로 패턴, 그 아래 들여쓴 `이름: 값`. `#`은 주석. */
function parseHeaders(text: string): Map<string, Map<string, string>> {
  const rules = new Map<string, Map<string, string>>();
  let current: Map<string, string> | null = null;
  for (const raw of text.split(/\r?\n/)) {
    if (raw.trim() === "" || raw.trim().startsWith("#")) continue;
    if (!/^\s/.test(raw)) {
      current = new Map();
      rules.set(raw.trim(), current);
      continue;
    }
    if (!current) throw new Error(`패턴 없이 헤더가 나왔다: ${raw}`);
    const index = raw.indexOf(":");
    current.set(raw.slice(0, index).trim().toLowerCase(), raw.slice(index + 1).trim());
  }
  return rules;
}

const rules = parseHeaders(readFileSync(file, "utf8"));
const all = rules.get("/*");

function directives(csp: string): Map<string, string[]> {
  return new Map(
    csp
      .split(";")
      .map((part) => part.trim().split(/\s+/))
      .filter((tokens) => tokens[0])
      .map((tokens) => [tokens[0] as string, tokens.slice(1)])
  );
}

describe("정적 파일 헤더(_headers)", () => {
  it("규칙은 /* 와 /assets/* 둘뿐이다", () => {
    expect([...rules.keys()].sort()).toEqual(["/*", "/assets/*"]);
  });

  it("CSP는 'self'만 허용하고 inline·eval을 열지 않으며 프레임에 넣지 못하게 한다", () => {
    const csp = directives(all?.get("content-security-policy") ?? "");
    expect(csp.get("default-src")).toEqual(["'self'"]);
    expect(csp.get("script-src")).toEqual(["'self'"]);
    expect(csp.get("style-src")).toEqual(["'self'"]);
    expect(csp.get("connect-src")).toEqual(["'self'"]);
    expect(csp.get("font-src")).toEqual(["'self'"]);
    expect(csp.get("img-src")).toEqual(["'self'", "data:"]);
    expect(csp.get("object-src")).toEqual(["'none'"]);
    expect(csp.get("base-uri")).toEqual(["'none'"]);
    expect(csp.get("frame-ancestors")).toEqual(["'none'"]);
    expect(csp.get("form-action")).toEqual(["'self'"]);
    const text = all?.get("content-security-policy") ?? "";
    for (const loose of ["unsafe-inline", "unsafe-eval", "unsafe-hashes", "*", "http:", "https:", "blob:"]) {
      expect(text.split(/\s|;/)).not.toContain(loose);
      expect(text).not.toContain(`'${loose}'`);
    }
  });

  it("HSTS·nosniff·프레임 정책·리퍼러·권한 정책이 있다", () => {
    expect(all?.get("strict-transport-security")).toMatch(/^max-age=(\d+)/);
    expect(Number(all?.get("strict-transport-security")?.match(/max-age=(\d+)/)?.[1])).toBeGreaterThanOrEqual(31536000);
    expect(all?.get("x-content-type-options")).toBe("nosniff");
    expect(all?.get("x-frame-options")).toBe("DENY");
    expect(all?.get("referrer-policy")).toBe("no-referrer");
    expect(all?.get("permissions-policy")).toContain("camera=()");
  });

  it("긴 캐시는 이름에 해시가 든 /assets/* 에만 — 첫 화면 파일·manifest는 매번 확인", () => {
    expect(rules.get("/assets/*")?.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(all?.has("cache-control")).toBe(false);
  });
});
