// 화면 시안(web/) 미리보기용 최소 정적 서버(의존성 없음). 사용: node scripts/web-preview.mjs [port]
// web/을 "/"로 제공하고, 시안이 값을 베껴 적지 않도록 정본을 읽기 전용 경로로 함께 제공한다(D-047):
//   /design/tokens.json, /data/taxonomy/v2.json, /data/crisis-resources/kr.json(위기 안내 연락처, D-094),
//   /design/fonts/*.woff2 (Pretendard 가변 폰트, D-057),
//   /design/pebbles/ui/*.png (조약돌 화면용 파생본, D-050),
//   /design/characters/flat-friends/ui/*.png (평면 친구 화면용 파생본, D-051)
// 디렉터리 경로는 확장자까지 허용 목록으로 좁힌다 — 폰트 폴더의 README·라이선스, 원본 PNG, 크레용 동물 자산(D-051로 시안이 더는 쓰지 않는다)은 내주지 않는다.
// 그 밖의 저장소 파일은 제공하지 않는다. GET/HEAD만 받는다 — 시안은 아무것도 저장·전송하지 않는다.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.argv[2] ?? process.env.PORT ?? 4174);
const types = { ".html": "text/html; charset=utf-8", ".json": "application/json; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2" };

// [URL 접두, 실제 위치, 디렉터리 여부, 디렉터리일 때 허용하는 확장자]. 위에서부터 먼저 맞는 것을 쓴다.
const mounts = [
  ["/design/tokens.json", path.join(repo, "design", "tokens.json"), false],
  ["/data/taxonomy/v2.json", path.join(repo, "data", "taxonomy", "v2.json"), false],
  ["/data/crisis-resources/kr.json", path.join(repo, "data", "crisis-resources", "kr.json"), false],
  ["/design/fonts/", path.join(repo, "design", "fonts"), true, [".woff2"]],
  ["/design/pebbles/ui/", path.join(repo, "design", "pebbles", "ui"), true, [".png"]],
  ["/design/characters/flat-friends/ui/", path.join(repo, "design", "characters", "flat-friends", "ui"), true, [".png"]],
  ["/", path.join(repo, "web"), true]
];

export function resolveRequest(urlPath) {
  if (urlPath.startsWith("/design/") || urlPath.startsWith("/data/")) {
    if (!mounts.some(([prefix, , isDir]) => prefix !== "/" && (isDir ? urlPath.startsWith(prefix) : urlPath === prefix))) return null;
  }
  for (const [prefix, target, isDir, exts] of mounts) {
    if (!isDir) { if (urlPath === prefix) return target; continue; }
    if (!urlPath.startsWith(prefix)) continue;
    const rel = urlPath.slice(prefix.length) || "index.html";
    const file = path.resolve(target, rel);
    if (file !== target && !file.startsWith(target + path.sep)) return null;
    if (exts && !exts.includes(path.extname(file).toLowerCase())) return null;
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
