// 화면 시안(web/) 미리보기용 최소 정적 서버(의존성 없음). 사용: node scripts/web-preview.mjs [port]
// web/을 "/"로 제공하고, 시안이 값을 베껴 적지 않도록 정본 세 곳을 읽기 전용 경로로 함께 제공한다(D-047):
//   /design/tokens.json, /data/taxonomy/v2.json, 캐릭터 가운데 시안이 쓰는 것(prompts.json, <key>.png, motion/, ui-poses/)
// 그 밖의 저장소 파일은 제공하지 않는다. GET/HEAD만 받는다 — 시안은 아무것도 저장·전송하지 않는다.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.argv[2] ?? process.env.PORT ?? 4174);
const types = { ".html": "text/html; charset=utf-8", ".json": "application/json; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp" };

// [URL 접두, 실제 위치, 디렉터리 여부]. 위에서부터 먼저 맞는 것을 쓴다.
const mounts = [
  ["/design/tokens.json", path.join(repo, "design", "tokens.json"), false],
  ["/data/taxonomy/v2.json", path.join(repo, "data", "taxonomy", "v2.json"), false],
  ["/design/characters/prompts.json", path.join(repo, "design", "characters", "prompts.json"), false],
  ["/design/characters/motion/", path.join(repo, "design", "characters", "motion"), true],
  ["/design/characters/ui-poses/", path.join(repo, "design", "characters", "ui-poses"), true],
  ["/", path.join(repo, "web"), true]
];

// 대표 PNG는 design/characters/ 바로 아래의 <key>.png뿐이다. pilot/·src/·qa.html 같은 작업 파일은 내주지 않는다.
const REPRESENTATIVE = new RegExp("^/design/characters/([a-z]+)[.]png$");

export function resolveRequest(urlPath) {
  const representative = urlPath.match(REPRESENTATIVE);
  if (representative) return path.join(repo, "design", "characters", `${representative[1]}.png`);
  if (urlPath.startsWith("/design/") || urlPath.startsWith("/data/")) {
    if (!mounts.some(([prefix, , isDir]) => prefix !== "/" && (isDir ? urlPath.startsWith(prefix) : urlPath === prefix))) return null;
  }
  for (const [prefix, target, isDir] of mounts) {
    if (!isDir) { if (urlPath === prefix) return target; continue; }
    if (!urlPath.startsWith(prefix)) continue;
    const rel = urlPath.slice(prefix.length) || "index.html";
    const file = path.resolve(target, rel);
    if (file !== target && !file.startsWith(target + path.sep)) return null;
    return file;
  }
  return null;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  http.createServer((req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405, { allow: "GET, HEAD" }); res.end(); return; }
    let file = null;
    try { file = resolveRequest(decodeURIComponent(new URL(req.url, "http://localhost").pathname)); } catch { file = null; }
    if (!file || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }); res.end("not found"); return;
    }
    res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
    if (req.method === "HEAD") { res.end(); return; }
    fs.createReadStream(file).pipe(res);
  }).listen(port, "127.0.0.1", () => console.log(`web prototype preview: http://localhost:${port}/`));
}
