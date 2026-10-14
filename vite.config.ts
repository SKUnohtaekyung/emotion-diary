// 화면 빌드(D-114 — 도구 없이 TypeScript, Vite는 묶기만 한다).
// mode는 dev 또는 prod다. 개발용 전용 코드(상태 칸·오류 보고)는 __APP_ENV__로 갈라 운영 묶음에서 빠진다(D-115 ②).
// 빌드 번호는 app/scripts/build.mjs가 APP_BUILD로 넘긴다 — 같은 번호가 서버 묶음에도 들어간다(D-115 ④).
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const APP_NAME = "감정일기";
const DEV_NAME = "감정일기 개발";

/**
 * 개발용 묶음은 홈 화면 이름을 '감정일기 개발'로 바꾼다 — 개발용과 실제 앱 아이콘이 나란히 있을 때
 * 실제 일기를 개발용 건물(가짜 데이터만)에 쓰는 실수를 막으려는 것이다. 운영 묶음은 그대로 둔다.
 */
function appName(mode: string, outDir: string): Plugin {
  return {
    name: "emotion-diary-app-name",
    transformIndexHtml(html) {
      if (mode !== "dev") return html;
      const next = html
        .replace(`<meta name="apple-mobile-web-app-title" content="${APP_NAME}" />`, `<meta name="apple-mobile-web-app-title" content="${DEV_NAME}" />`)
        .replace(`<title>${APP_NAME}</title>`, `<title>${DEV_NAME}</title>`);
      if (!next.includes(DEV_NAME)) throw new Error("index.html에서 앱 이름 자리를 찾지 못했다");
      return next;
    },
    writeBundle() {
      if (mode !== "dev") return;
      const file = `${outDir}/manifest.webmanifest`;
      const manifest = JSON.parse(readFileSync(file, "utf8")) as { name: string; short_name: string };
      manifest.name = DEV_NAME;
      manifest.short_name = DEV_NAME;
      writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
    }
  };
}

export default defineConfig(({ mode }) => {
  if (mode !== "dev" && mode !== "prod") throw new Error(`vite mode는 dev 또는 prod여야 한다: ${mode}`);
  const outDir = fileURLToPath(new URL(`./dist/${mode}/client`, import.meta.url));
  return {
    root: fileURLToPath(new URL("./app/client", import.meta.url)),
    publicDir: "public",
    base: "/",
    define: {
      __APP_ENV__: JSON.stringify(mode),
      __APP_BUILD__: JSON.stringify(process.env.APP_BUILD ?? "local")
    },
    plugins: [appName(mode, outDir)],
    build: {
      outDir,
      emptyOutDir: true,
      // 글꼴·그림을 data: 주소로 끼워 넣지 않는다 — CSP font-src 'self'와 맞추고 캐시를 파일 단위로 둔다(T3 A-8·T3 A-9).
      assetsInlineLimit: 0,
      sourcemap: false
    }
  };
});
