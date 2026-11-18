// :hover는 진짜 마우스가 있는 기기(@media (hover: hover)) 안에서만 쓴다.
// iPhone Safari는 탭이 :hover로 무언가를 보이게 만들면(투명도 0→1 같은) 첫 탭을 '올림'으로 쓰고 클릭을 보내지 않는다 —
// 오늘 화면의 돌을 두 번 눌러야 했다(2026-11-18 휴대폰 확인 A3, tasks/direct-journal/2026-11-11/PLAN.md J-10).
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { readSource } from "./source";

const STYLES = "../../client/src/styles";

/** CSS를 블록 단위로 걸으며, @media (hover: hover) 밖에 있는 :hover 선택자를 모은다. */
function hoverOutsideMedia(css: string): string[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const stack: string[] = [];
  const found: string[] = [];
  let prelude = "";
  for (const char of text) {
    if (char === "{") {
      const head = prelude.trim();
      const guarded = stack.some((item) => /^@media[^{]*\(\s*hover\s*:\s*hover\s*\)/.test(item));
      if (head.includes(":hover") && !head.startsWith("@") && !guarded) found.push(head);
      stack.push(head);
      prelude = "";
    } else if (char === "}") {
      stack.pop();
      prelude = "";
    } else if (char === ";") {
      prelude = "";
    } else {
      prelude += char;
    }
  }
  return found;
}

describe(":hover는 (hover: hover) 안에서만", () => {
  it("검사 도구가 밖의 :hover를 잡고 안의 :hover는 넘긴다", () => {
    expect(hoverOutsideMedia(".a:hover{opacity:1}")).toEqual([".a:hover"]);
    expect(hoverOutsideMedia("@media (hover: hover){.a:hover{opacity:1}}")).toEqual([]);
    expect(hoverOutsideMedia("@media (prefers-reduced-motion: no-preference){@media (hover:hover){.a:hover{x:1}} .b:is(:hover,:active){x:1}}")).toEqual([
      ".b:is(:hover,:active)"
    ]);
  });

  // happy-dom에서는 new URL(…, import.meta.url)이 file: 주소를 못 만든다 — source.ts처럼 문자열로 잇는다
  const here = fileURLToPath(import.meta.url).replaceAll("\\", "/").replace(/\/[^/]*$/, "");
  const files = readdirSync(`${here}/${STYLES}`, { recursive: true }).filter((name) => name.endsWith(".css"));

  it.each(files)("%s", (name) => {
    expect(hoverOutsideMedia(readSource(`${STYLES}/${name}`))).toEqual([]);
  });
});
