/// <reference path="../../client/src/env.d.ts" />
// 토큰과 공개 파일: CSS 변수는 정본 design/tokens.json에서 오고, 정적 파일(index.html·manifest)의 숲 색도 같은 값이어야 한다.
import { describe, expect, it } from "vitest";
import { applyTokens, tokenVars } from "../../client/src/tokens";
import { color } from "../../../design/tokens.json";
import { readSource } from "./source";

const read = readSource;

describe("tokenVars", () => {
  it("색·글자·간격·반지름·크기가 CSS 변수로 펼쳐진다(light 값)", () => {
    const vars = tokenVars();
    expect(vars["--neutral-bg"]).toBe(color.neutral.bg.light);
    expect(vars["--neutral-text"]).toBe(color.neutral.text.light);
    expect(vars["--neutral-focus"]).toBe(color.neutral.focus.light);
    expect(vars["--semantic-danger"]).toBe(color.semantic.danger.light);
    expect(vars["--forest-sky"]).toBe(color.forest.sky.light);
    expect(vars["--service-ink"]).toBe(color.service.ink.light);
    expect(vars["--service-mint"]).toBe(color.service.mint.light);
    expect(vars["--font-sans"]).toContain("Pretendard Variable");
    expect(vars["--text-body-size"]).toBe("16px");
    expect(vars["--text-body-line"]).toBe("24px");
    expect(vars["--space-4"]).toBe("16px");
    expect(vars["--radius-control"]).toBe("8px");
    expect(vars["--size-touch-target-min"]).toBe("44px");
    expect(vars["--size-content-max-width"]).toBe("480px");
  });

  it("글 설명(note)이나 다크 값은 변수가 되지 않는다", () => {
    const vars = tokenVars();
    expect(Object.keys(vars).some((name) => name.endsWith("-note"))).toBe(false);
    expect(Object.values(vars)).not.toContain(color.neutral.bg.dark);
  });

  it("applyTokens는 CSSOM(setProperty)으로 심는다 — style 속성 문자열을 만들지 않는다", () => {
    const root = document.createElement("div");
    applyTokens(root);
    expect(root.style.getPropertyValue("--forest-sky")).toBe(color.forest.sky.light);
    expect(root.style.getPropertyValue("--space-6")).toBe("24px");
  });
});

describe("정적 파일", () => {
  const forest = color.forest.sky.light.toLowerCase();

  it("manifest: 이름·시작 주소·범위·표시 방식·숲 색·아이콘 경로, 열쇠·query 없음", () => {
    const manifest = JSON.parse(read("../../client/public/manifest.webmanifest")) as Record<string, unknown>;
    expect(manifest.name).toBe("감정일기");
    expect(manifest.short_name).toBe("감정일기");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.lang).toBe("ko");
    expect(String(manifest.theme_color).toLowerCase()).toBe(forest);
    expect(String(manifest.background_color).toLowerCase()).toBe(forest);
    expect(manifest.icons).toEqual([
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }
    ]);
    // 주소 칸에는 열쇠·query·# 가 없다
    const urls = [manifest.start_url, manifest.scope, ...(manifest.icons as Array<{ src: string }>).map((icon) => icon.src)];
    for (const url of urls) expect(String(url)).not.toMatch(/[?#]/);
  });

  it("index.html: 언어·viewport·theme-color·manifest·아이콘·제목, 인라인 스크립트·스타일 없음", () => {
    const html = read("../../client/index.html");
    expect(html).toContain('<html lang="ko">');
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />');
    expect(html.toLowerCase()).toContain(`<meta name="theme-color" content="${forest}" />`);
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest" />');
    expect(html).toContain('<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />');
    expect(html).toContain('<meta name="apple-mobile-web-app-title" content="감정일기" />');
    expect(html).toContain("<title>감정일기</title>");
    // 모든 <script>는 src가 있고, <style>·style 속성·이벤트 속성이 없다
    for (const match of html.matchAll(/<script\b[^>]*>/g)) expect(match[0]).toContain("src=");
    expect(html).not.toMatch(/<style\b/);
    expect(html).not.toMatch(/\sstyle=/);
    expect(html).not.toMatch(/\son[a-z]+=/);
  });
});

describe("글꼴 선언", () => {
  it("가변 범위 하나로 선언한다(한 굵기만 선언하지 않는다)", () => {
    const css = read("../../client/src/styles/fonts.css");
    expect(css).toContain('font-family: "Pretendard Variable"');
    expect(css).toContain('format("woff2-variations")');
    expect(css).toContain("font-weight: 45 920");
    expect(css).toContain("font-display: swap");
    expect(css.match(/@font-face/g)).toHaveLength(1);
    expect(css).toContain("design/fonts/PretendardVariable.woff2");
  });
});
