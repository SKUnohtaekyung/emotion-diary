/// <reference path="../../client/src/env.d.ts" />
// 로딩 화면의 빈 숲(public/splash.svg)은 오늘 화면의 숲과 같은 계산으로 굳힌 그림이다(TASK-JOURNAL-01 J-8, PLAN A-8).
// 숲(ui/forestArt.ts)이나 색(design/tokens.json)을 바꾸고 `node app/scripts/splash.mjs`를 잊으면 여기서 걸린다.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
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
