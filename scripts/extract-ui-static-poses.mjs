// 사용자 제공 전신·감정 포즈 시트에서 UI 전용 정적 PNG 9종을 분리한다.
// canonical idle/motion 자산은 절대 덮어쓰지 않는다.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const source = process.argv[2] ?? "design/characters/pilot/not-selected-fullbody-reference.png";
const outputDir = process.argv[3] ?? "design/characters/ui-poses";
const crops = [
  ["enjoyment", { left: 24, top: 118, width: 425, height: 306 }],
  ["wish", { left: 463, top: 35, width: 443, height: 386 }],
  ["sadness", { left: 870, top: 110, width: 376, height: 314 }],
  ["anger", { left: 12, top: 424, width: 415, height: 425 }],
  ["joy", { left: 448, top: 456, width: 365, height: 380 }],
  ["love", { left: 865, top: 437, width: 381, height: 406 }],
  ["hate", { left: 0, top: 850, width: 420, height: 413 }],
  ["fear", { left: 426, top: 936, width: 405, height: 290 }],
  ["disgust", { left: 852, top: 846, width: 384, height: 395 }],
];

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function clearTransparentRgb(data, channels) {
  for (let offset = 0; offset < data.length; offset += channels) {
    if (data[offset + 3] === 0) data[offset] = data[offset + 1] = data[offset + 2] = 0;
  }
  return data;
}

async function writePng(data, width, height, file) {
  await sharp(data, { raw: { width, height, channels: 4 } })
    .toColourspace("srgb")
    .ensureAlpha()
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(file);
}

if (!fs.existsSync(source)) fail(`${source}: 사용자 제공 포즈 시트가 없음`);
fs.mkdirSync(outputDir, { recursive: true });

const metadata = await sharp(source, { failOn: "warning" }).metadata();
if (metadata.width !== 1246 || metadata.height !== 1263 || !metadata.hasAlpha) {
  fail(`${source}: 1246x1263 RGBA 사용자 제공 시트여야 함`);
}

for (const [key, crop] of crops) {
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .extract(crop)
    .resize(1024, 1024, {
      fit: "contain",
      kernel: "lanczos3",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const master = path.join(outputDir, `${key}--expressive-static-1024.png`);
  const delivered = path.join(outputDir, `${key}--expressive-static-120.png`);
  await writePng(clearTransparentRgb(data, info.channels), 1024, 1024, master);
  const small = await sharp(master).resize(120, 120, { kernel: "lanczos3" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  await writePng(clearTransparentRgb(small.data, small.info.channels), 120, 120, delivered);
}

console.log(JSON.stringify({ source, outputDir, keys: crops.map(([key]) => key), filesPerCharacter: 2 }, null, 2));
