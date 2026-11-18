/// <reference path="../../client/src/env.d.ts" />
// 로딩 화면의 빈 숲(public/splash.svg)은 오늘 화면의 숲과 같은 계산으로 굳힌 그림이다(TASK-JOURNAL-01 J-8, PLAN A-8).
// 숲(ui/forestArt.ts)이나 색(design/tokens.json)을 바꾸고 `node app/scripts/splash.mjs`를 잊으면 여기서 걸린다.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { readSource } from "./source";
// @ts-expect-error — 빌드 스크립트(.mjs)라 타입이 없다
import { SPLASH_FILE, splashSvg } from "../../scripts/splash.mjs";

describe("로딩 화면의 숲(splash.svg)", () => {
  it("커밋된 파일이 지금 숲·색 계산과 같고, style·script 없이 fill 속성만 쓴다(CSP)", () => {
    const committed = readFileSync(SPLASH_FILE, "utf8").replace(/\r\n/g, "\n");
    expect(committed).toBe(splashSvg());
    expect(committed).not.toMatch(/<style|style=|<script|var\(--/);
    expect(committed).toContain('aria-hidden="true"');
  });
});

// 로딩 화면(D-134): 남색 막 위 평면 조약돌. 색은 CSS보다 먼저 그려지게 index.html SVG의 fill 속성에 있고, 실루엣은 시안 web/splash-pebbles.svg와 같다.
describe("로딩 화면의 조약돌(index.html #splash)", () => {
  const html = readSource("../../client/index.html");
  const splash = html.slice(html.indexOf('<div class="splash" id="splash">'), html.indexOf('<div id="banner"'));
  const tokens = JSON.parse(readSource("../../../design/tokens.json")) as {
    color: { service: { mint: { light: string } } };
  };
  const pebbles = readSource("../../../web/splash-pebbles.svg");

  it("막·조약돌·물결 말고는 없고, style·script 없이 fill·stroke 속성만 쓴다(CSP)", () => {
    expect(splash).toContain('class="splash-veil"');
    expect(splash).toContain('class="splash-mark"');
    expect(splash).toContain('class="splash-ripples"');
    expect(splash).not.toMatch(/<style|style=|<script|<img/);
  });

  it("조약돌·물결 색은 tokens의 service.mint이다", () => {
    const colors = new Set([...splash.matchAll(/(?:fill|stroke)="(#[0-9A-Fa-f]{6})"/g)].map((match) => match[1]?.toUpperCase()));
    expect([...colors]).toEqual([tokens.color.service.mint.light.toUpperCase()]);
  });

  it("뒤 돌·앞 돌 실루엣이 시안(web/splash-pebbles.svg)과 같다 — 오늘 화면 돌 자리에 그대로 겹친다", () => {
    for (const id of ["pb-all", "pb-front"]) {
      const d = new RegExp(`id="${id}" d="([^"]+)"`).exec(pebbles)?.[1];
      expect(d, id).toBeTruthy();
      expect(splash).toContain(`d="${d}"`);
    }
  });

  it("10초가 넘으면 다시 시도 — 스크립트 없이도 눌리는 링크이고, 화면 낭독기에 닿는다(aria-hidden 밖)", () => {
    const slow = splash.slice(splash.indexOf('class="splash-slow"'));
    expect(slow).toContain('role="status"');
    expect(slow).toMatch(/<a href="\/">다시 시도<\/a>/);
    expect(splash).not.toMatch(/<div class="splash" id="splash"[^>]*aria-hidden/);
  });
});

// 앱 아이콘(D-134): 흰 바탕 + 같은 겹친 두 돌. 스크립트(app/scripts/make-icons.mjs)가 시안 실루엣과 토큰 색을 읽어 만들고, 커밋된 PNG가 그 결과인지 픽셀로 본다.
describe("앱 아이콘(public/icons)", () => {
  const tokens = JSON.parse(readSource("../../../design/tokens.json")) as {
    color: { service: { mint: { light: string }; ink: { light: string } }; neutral: { bg: { light: string } } };
  };
  const rgb = (hex: string) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
  const mint = rgb(tokens.color.service.mint.light);
  const ink = rgb(tokens.color.service.ink.light);
  const white = rgb(tokens.color.neutral.bg.light);
  const teal = mint.map((v, i) => Math.round(v * 0.55 + (ink[i] ?? 0) * 0.45));

  it("스크립트의 SVG가 흰 바탕·청록 뒤 돌·민트 앞 돌이고, 실루엣은 시안과 같다", async () => {
    // @ts-expect-error — 빌드 스크립트(.mjs)라 타입이 없다
    const { iconSvg } = await import("../../scripts/make-icons.mjs");
    const svg = String(iconSvg());
    const hex = (c: number[]) => `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
    expect(svg).toContain(`fill="${tokens.color.neutral.bg.light}"`);
    expect(svg).toContain(`fill="${hex(teal)}"`);
    expect(svg).toContain(`fill="${tokens.color.service.mint.light}"`);
    const pebbles = readSource("../../../web/splash-pebbles.svg");
    for (const id of ["pb-all", "pb-front"]) expect(svg).toContain(new RegExp(`id="${id}" d="([^"]+)"`).exec(pebbles)?.[1] ?? "없음");
  });

  it.each(["apple-touch-icon.png", "icon-192.png", "icon-512.png"])("%s — 모서리는 흰색, 앞 돌은 민트, 뒤 돌은 청록(만든 뒤 다시 굽지 않았으면 걸린다)", async (name) => {
    const { default: sharp } = await import("sharp");
    const file = `${import.meta.dirname ?? ""}/../../client/public/icons/${name}`.replaceAll("\\", "/");
    const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const at = (fx: number, fy: number) => {
      const i = (Math.round(fy * (info.height - 1)) * info.width + Math.round(fx * (info.width - 1))) * 3;
      return [data[i], data[i + 1], data[i + 2]];
    };
    const near = (a: (number | undefined)[], b: number[]) => a.every((v, i) => Math.abs((v ?? -99) - (b[i] ?? 0)) <= 3);
    expect(near(at(0.02, 0.02), white), "모서리").toBe(true);
    expect(near(at(0.62, 0.62), mint), "앞 돌").toBe(true);
    expect(near(at(0.28, 0.4), teal), "뒤 돌").toBe(true);
  });
});
