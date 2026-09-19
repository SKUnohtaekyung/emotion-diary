import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checker = path.join(root, "scripts/check-characters.mjs");
let passed = 0;

function run(fixture) {
  return spawnSync(process.execPath, [checker], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, CHARACTER_CHECK_ROOT: fixture },
  });
}

function writeSpec(fixture) {
  const directory = path.join(fixture, "design/characters");
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, "prompts.json"), JSON.stringify({
    version: "test",
    output: { master_px: 16, delivered_px: 8 },
    characters: [{ key: "one" }, { key: "two" }],
  }));
  return directory;
}

async function writeGoodPng(file, size) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const inset = Math.max(2, Math.floor(size / 4));
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: { create: { width: size - inset * 2, height: size - inset * 2, channels: 4, background: { r: 120, g: 80, b: 60, alpha: 1 } } }, left: inset, top: inset }])
    .png()
    .toFile(file);
}

async function writePoseBasics(directory, key) {
  await writeGoodPng(path.join(directory, "poses", `${key}--idle-1024.png`), 16);
  await writeGoodPng(path.join(directory, "poses", `${key}--breathe-1024.png`), 16);
  await writeGoodPng(path.join(directory, "poses", `${key}--tilt-1024.png`), 16);
}

async function withFixture(name, callback) {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), `character-check-${name}-`));
  try { await callback(fixture); }
  finally { fs.rmSync(fixture, { recursive: true, force: true }); }
}

await withFixture("pending", async (fixture) => {
  writeSpec(fixture);
  const result = run(fixture);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /PENDING/);
  passed += 1;
});

await withFixture("partial", async (fixture) => {
  const directory = writeSpec(fixture);
  await writeGoodPng(path.join(directory, "one.png"), 8);
  const result = run(fixture);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /9종은 한 벌/);
  passed += 1;
});

await withFixture("opaque", async (fixture) => {
  const directory = writeSpec(fixture);
  for (const key of ["one", "two"]) {
    fs.mkdirSync(path.join(directory, "src"), { recursive: true });
    await sharp({ create: { width: 8, height: 8, channels: 3, background: "white" } }).png().toFile(path.join(directory, `${key}.png`));
    await sharp({ create: { width: 16, height: 16, channels: 3, background: "white" } }).png().toFile(path.join(directory, "src", `${key}-1024.png`));
  }
  const result = run(fixture);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /alpha 채널이 없음/);
  passed += 1;
});

await withFixture("missing-emotion-rig", async (fixture) => {
  const directory = writeSpec(fixture);
  const specFile = path.join(directory, "prompts.json");
  const spec = JSON.parse(fs.readFileSync(specFile, "utf8"));
  spec.motion_spec = { emotion_pose_keys: ["one"], emotion_rigs: {} };
  fs.writeFileSync(specFile, JSON.stringify(spec));
  for (const key of ["one", "two"]) {
    await writeGoodPng(path.join(directory, `${key}.png`), 8);
    await writeGoodPng(path.join(directory, "src", `${key}-1024.png`), 16);
    await writePoseBasics(directory, key);
  }
  await writeGoodPng(path.join(directory, "poses", "one--emotion-1024.png"), 16);
  const result = run(fixture);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /acknowledge 국소 리그가 없음/);
  passed += 1;
});

await withFixture("complete", async (fixture) => {
  const directory = writeSpec(fixture);
  for (const key of ["one", "two"]) {
    await writeGoodPng(path.join(directory, `${key}.png`), 8);
    await writeGoodPng(path.join(directory, "src", `${key}-1024.png`), 16);
    await writePoseBasics(directory, key);
  }
  const result = run(fixture);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /PASS: 캐릭터 정적 4개/);
  passed += 1;
});

console.log(`PASS: check-characters ${passed}/5`);
