/// <reference path="./node-shim.d.ts" />
// 소스 파일을 읽어 대조하는 시험의 도구. happy-dom 환경에서는 URL 클래스가 달라 new URL(…, import.meta.url)이
// file: 주소를 만들지 못하므로, import.meta.url 문자열에서 이 폴더의 경로를 얻어 문자열로 잇는다.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(import.meta.url).replaceAll("\\", "/").replace(/\/[^/]*$/, "");

/** 이 폴더(app/test/client) 기준 상대 경로를 읽는다. */
export function readSource(relative: string): string {
  return readFileSync(`${here}/${relative}`, "utf8");
}

/** app/client/src 아래의 .ts 파일(.d.ts 제외)을 상대 경로와 함께 읽는다. */
export function clientSources(): Array<{ path: string; text: string }> {
  const dir = `${here}/../../client/src`;
  return readdirSync(dir, { recursive: true })
    .map((path) => path.replaceAll("\\", "/"))
    .filter((path) => path.endsWith(".ts") && !path.endsWith(".d.ts"))
    .map((path) => ({ path, text: readFileSync(`${dir}/${path}`, "utf8") }));
}
