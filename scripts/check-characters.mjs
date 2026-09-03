// design/characters/ 의 캐릭터 아이콘이 규격을 만족하는지 검사한다(DESIGN_SYSTEM §7).
// 자산이 아직 없으면 pending으로 통과하고, 하나라도 있으면 7종 전부를 요구한다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "design/characters");
const spec = JSON.parse(fs.readFileSync(path.join(dir, "prompts.json"), "utf8"));
const keys = spec.characters.map((c) => c.key);
const DELIVERED_PX = spec.output.delivered_px;
const MASTER_PX = spec.output.master_px;

// PNG IHDR: 8바이트 서명 + 길이(4) + "IHDR"(4) + width(4) + height(4) + depth(1) + colorType(1)
function readPng(file) {
  const buf = fs.readFileSync(file);
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buf.length < 33 || !buf.subarray(0, 8).equals(sig)) return { ok: false, reason: "PNG 서명 없음" };
  if (buf.subarray(12, 16).toString("ascii") !== "IHDR") return { ok: false, reason: "IHDR 청크 없음" };
  return { ok: true, width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), colorType: buf[25] };
}
// colorType 4(회색+알파), 6(트루컬러+알파)만 투명도를 가진다. 3(팔레트)은 tRNS 청크로 가능하므로 함께 허용한다.
function hasAlpha(file, colorType) {
  if (colorType === 4 || colorType === 6) return true;
  if (colorType === 3) return fs.readFileSync(file).includes(Buffer.from("tRNS", "ascii"));
  return false;
}

const targets = [];
for (const key of keys) {
  targets.push({ file: path.join(dir, `${key}.png`), rel: `design/characters/${key}.png`, px: DELIVERED_PX });
  targets.push({ file: path.join(dir, "src", `${key}-1024.png`), rel: `design/characters/src/${key}-1024.png`, px: MASTER_PX });
}
const present = targets.filter((t) => fs.existsSync(t.file));

if (present.length === 0) {
  console.log(`PENDING: 캐릭터 아이콘 ${keys.length}종 미제작 (prompts.json ${spec.version}). 규격은 design/characters/README.md`);
  process.exit(0);
}

const failures = [];
for (const t of targets) {
  if (!fs.existsSync(t.file)) { failures.push(`${t.rel}: 없음 (7종은 한 벌로 함께 만든다)`); continue; }
  const png = readPng(t.file);
  if (!png.ok) { failures.push(`${t.rel}: ${png.reason}`); continue; }
  if (png.width !== t.px || png.height !== t.px) failures.push(`${t.rel}: ${png.width}x${png.height}, ${t.px}x${t.px}이어야 함`);
  if (!hasAlpha(t.file, png.colorType)) failures.push(`${t.rel}: 투명 배경(alpha)이 없음`);
}

if (failures.length) {
  for (const f of failures) console.log(`FAIL ${f}`);
  console.error(`FAIL: 캐릭터 아이콘 검사 ${failures.length}건 실패`);
  process.exit(1);
}
console.log(`PASS: 캐릭터 아이콘 ${targets.length}개 검사 통과`);
