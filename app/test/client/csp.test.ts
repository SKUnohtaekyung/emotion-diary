/// <reference path="../../client/src/env.d.ts" />
// 소스 규칙 검사: CSP(style-src 'self', script-src 'self')를 어기는 코드와, 개발용 코드가 운영 묶음으로 새는 길을 막는다.
import { describe, expect, it } from "vitest";
import { h } from "../../client/src/lib/dom";
import { clientSources } from "./source";

const sources = clientSources();

// 주석은 규칙을 설명하느라 금지 패턴을 말할 수 있다 — 코드만 본다
const code = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

describe("CSP를 어기는 코드가 없다", () => {
  it("소스 파일을 읽었다", () => {
    expect(sources.length).toBeGreaterThan(20);
  });

  it.each([
    ["innerHTML", /\.innerHTML\b/],
    ["outerHTML", /\.outerHTML\b/],
    ["insertAdjacentHTML", /insertAdjacentHTML/],
    ["style 속성 설정", /setAttribute\(\s*["']style["']/],
    ["cssText", /\.cssText\b/],
    ["style 문자열 속성", /\bstyle\s*=\s*["'`]/],
    ["eval", /\beval\s*\(/],
    ["new Function", /new\s+Function\s*\(/],
    ["document.write", /document\.write/],
    ["문자열 setTimeout", /setTimeout\(\s*["'`]/],
    ["console.log", /console\.log\b/]
  ])("%s를 쓰지 않는다", (_name, pattern) => {
    for (const source of sources) expect(code(source.text), source.path).not.toMatch(pattern);
  });

  it("DOM 도구는 style 속성을 받지 않는다", () => {
    expect(() => h("div", { style: "color:red" })).toThrow();
    expect(h("div", { class: "a", text: "글" }).outerHTML).toBe('<div class="a">글</div>');
  });
});

describe("개발용 코드는 운영 묶음으로 새지 않는다", () => {
  const outside = sources.filter((source) => !source.path.startsWith("dev/"));

  it("shared/dev는 dev/ 폴더에서만 가져온다", () => {
    for (const source of outside) expect(code(source.text), source.path).not.toMatch(/shared\/dev["']/);
    expect(sources.filter((source) => /shared\/dev["']/.test(code(source.text))).every((source) => source.path.startsWith("dev/"))).toBe(true);
  });

  it("dev/는 main.ts의 동적 import로만 부른다 — 정적 import가 없다", () => {
    for (const source of outside) {
      if (source.path === "main.ts") continue;
      expect(code(source.text), source.path).not.toMatch(/from\s+["']\.\.?\/(\.\.\/)*dev\//);
      expect(code(source.text), source.path).not.toMatch(/import\(\s*["'][^"']*dev\//);
    }
    const main = code(sources.find((source) => source.path === "main.ts")?.text ?? "");
    expect(main).not.toMatch(/^import .*["']\.\/dev\//m);
    expect(main).toMatch(/if \(__APP_ENV__ !== "prod"\) \{\s*void import\("\.\/dev\/index"\)/);
  });

  it("운영 묶음 검사가 찾는 이름은 dev/ 밖에 없다", () => {
    for (const source of outside) {
      expect(code(source.text), source.path).not.toMatch(/dev-panel|client-errors|client_errors/);
    }
  });
});
