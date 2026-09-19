import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function ensureParent(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type, "ascii");
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  name.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([name, data])), 8 + data.length);
  return out;
}

function parsePng(file) {
  const buffer = fs.readFileSync(file);
  if (!buffer.subarray(0, 8).equals(PNG_SIG)) fail(`${file}: PNG 서명이 없다`);
  const chunks = [];
  for (let offset = 8; offset + 12 <= buffer.length;) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    chunks.push({ type, data });
    offset += 12 + length;
    if (type === "IEND") break;
  }
  const ihdr = chunks.find((item) => item.type === "IHDR")?.data;
  if (!ihdr) fail(`${file}: IHDR이 없다`);
  return {
    width: ihdr.readUInt32BE(0),
    height: ihdr.readUInt32BE(4),
    ihdr,
    idat: Buffer.concat(chunks.filter((item) => item.type === "IDAT").map((item) => item.data)),
    ancillary: chunks.filter((item) => ["sRGB", "gAMA", "cHRM", "iCCP"].includes(item.type)),
  };
}

async function prepare(input, master, delivered) {
  ensureParent(master);
  ensureParent(delivered);
  await sharp(input)
    .resize(1024, 1024, { fit: "contain", kernel: "lanczos3", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toColourspace("srgb")
    .ensureAlpha()
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(master);
  await sharp(master)
    .resize(120, 120, { fit: "contain", kernel: "lanczos3", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toColourspace("srgb")
    .ensureAlpha()
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(delivered);
  console.log(JSON.stringify({ master, masterSha256: sha256(master), delivered, deliveredSha256: sha256(delivered) }, null, 2));
}

function makeApng(frameFiles, output, fps, plays) {
  const frames = frameFiles.map(parsePng);
  const first = frames[0];
  if (!first || first.width !== 120 || first.height !== 120) fail("APNG 프레임은 120x120이어야 한다");
  if (frames.some((frame) => frame.width !== first.width || frame.height !== first.height || !frame.ihdr.equals(first.ihdr))) {
    fail("APNG 프레임의 IHDR 계약이 서로 다르다");
  }
  let sequence = 0;
  const animationControl = Buffer.alloc(8);
  animationControl.writeUInt32BE(frames.length, 0);
  animationControl.writeUInt32BE(plays, 4);
  const outputChunks = [PNG_SIG, chunk("IHDR", first.ihdr), ...first.ancillary.map((item) => chunk(item.type, item.data)), chunk("acTL", animationControl)];
  frames.forEach((frame, index) => {
    const control = Buffer.alloc(26);
    control.writeUInt32BE(sequence++, 0);
    control.writeUInt32BE(frame.width, 4);
    control.writeUInt32BE(frame.height, 8);
    control.writeUInt32BE(0, 12);
    control.writeUInt32BE(0, 16);
    control.writeUInt16BE(1, 20);
    control.writeUInt16BE(fps, 22);
    control[24] = 0;
    control[25] = 0;
    outputChunks.push(chunk("fcTL", control));
    if (index === 0) outputChunks.push(chunk("IDAT", frame.idat));
    else {
      const frameData = Buffer.alloc(4 + frame.idat.length);
      frameData.writeUInt32BE(sequence++, 0);
      frame.idat.copy(frameData, 4);
      outputChunks.push(chunk("fdAT", frameData));
    }
  });
  outputChunks.push(chunk("IEND", Buffer.alloc(0)));
  ensureParent(output);
  fs.writeFileSync(output, Buffer.concat(outputChunks));
}

async function compare(framesDir, outputStem, fps, plays) {
  const frameFiles = fs.readdirSync(framesDir)
    .filter((name) => /^frame-\d{3}\.png$/.test(name))
    .sort()
    .map((name) => path.join(framesDir, name));
  if (!frameFiles.length) fail(`${framesDir}: frame-000.png 형식의 프레임이 없다`);
  const apng = `${outputStem}.apng`;
  const webp = `${outputStem}.webp`;
  makeApng(frameFiles, apng, fps, plays);
  await encodeWebp(frameFiles, webp, fps, plays);
  console.log(JSON.stringify({
    frames: frameFiles.length,
    fps,
    plays,
    apng: { file: apng, bytes: fs.statSync(apng).size, sha256: sha256(apng) },
    webp: { file: webp, bytes: fs.statSync(webp).size, sha256: sha256(webp) },
  }, null, 2));
}

async function encodeWebp(frameFiles, output, fps, loop) {
  ensureParent(output);
  await sharp(frameFiles, { join: { animated: true } })
    .webp({ lossless: true, alphaQuality: 100, effort: 6, exact: true, loop, delay: frameFiles.map(() => Math.round(1000 / fps)) })
    .toFile(output);
}

async function rawRgba(file) {
  return sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

async function writeRgba(data, width, height, file) {
  ensureParent(file);
  await sharp(data, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(file);
}

async function patchEyes(baseFile, blinkFile, output, rectsAt120 = [[42, 56, 66, 81], [76, 56, 100, 81]]) {
  const base = await rawRgba(baseFile);
  const blink = await rawRgba(blinkFile);
  if (base.info.width !== blink.info.width || base.info.height !== blink.info.height) fail("눈 패치 입력 크기가 다르다");
  const { width, height } = base.info;
  const result = Buffer.from(base.data);
  const scale = width / 120;
  const feather = Math.max(2, Math.round(2 * scale));
  const rects = rectsAt120.map((rect) => rect.map((value) => Math.round(value * scale)));
  for (const [left, top, right, bottom] of rects) {
    for (let y = top; y <= bottom; y += 1) for (let x = left; x <= right; x += 1) {
      const edge = Math.min(x - left, right - x, y - top, bottom - y);
      const weight = Math.max(0, Math.min(1, edge / feather));
      const offset = (y * width + x) * 4;
      for (let channel = 0; channel < 4; channel += 1) {
        result[offset + channel] = Math.round(base.data[offset + channel] * (1 - weight) + blink.data[offset + channel] * weight);
      }
    }
  }
  await writeRgba(result, width, height, output);
}

async function moveRegion(input, regionAt120, deltaAt120, output) {
  const source = await rawRgba(input);
  const { width, height } = source.info;
  const scale = width / 120;
  const [left120, top120, right120, bottom120] = regionAt120;
  const left = Math.round(left120 * scale);
  const top = Math.round(top120 * scale);
  const right = Math.round(right120 * scale);
  const bottom = Math.round(bottom120 * scale);
  const deltaX = Math.round(deltaAt120[0] * scale);
  const deltaY = Math.round(deltaAt120[1] * scale);
  const feather = Math.max(2, Math.round(2 * scale));
  const result = Buffer.from(source.data);
  const layer = [];
  for (let y = top; y <= bottom; y += 1) for (let x = left; x <= right; x += 1) {
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const edge = Math.min(x - left, right - x, y - top, bottom - y);
    const mask = Math.max(0, Math.min(1, edge / feather));
    const offset = (y * width + x) * 4;
    const alpha = source.data[offset + 3] / 255;
    if (alpha === 0 || mask === 0) continue;
    layer.push({ x: x + deltaX, y: y + deltaY, mask, rgba: source.data.subarray(offset, offset + 4) });
    const retainedAlpha = Math.round(alpha * (1 - mask) * 255);
    result[offset + 3] = retainedAlpha;
    if (retainedAlpha === 0) result[offset] = result[offset + 1] = result[offset + 2] = 0;
  }
  for (const pixel of layer) {
    if (pixel.x < 0 || pixel.y < 0 || pixel.x >= width || pixel.y >= height) continue;
    const offset = (pixel.y * width + pixel.x) * 4;
    const sourceAlpha = (pixel.rgba[3] / 255) * pixel.mask;
    const destAlpha = result[offset + 3] / 255;
    const outputAlpha = sourceAlpha + destAlpha * (1 - sourceAlpha);
    if (outputAlpha === 0) continue;
    for (let channel = 0; channel < 3; channel += 1) {
      result[offset + channel] = Math.round((pixel.rgba[channel] * sourceAlpha + result[offset + channel] * destAlpha * (1 - sourceAlpha)) / outputAlpha);
    }
    result[offset + 3] = Math.round(outputAlpha * 255);
  }
  await writeRgba(result, width, height, output);
}

async function rotateFrame(input, degrees, output) {
  const source = await rawRgba(input);
  const { width, height } = source.info;
  const result = Buffer.alloc(source.data.length);
  const radians = (degrees * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const centerX = width / 2;
  const centerY = height * (66.7 / 120);
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const relativeX = x - centerX;
    const relativeY = y - centerY;
    const sourceX = centerX + relativeX * cosine + relativeY * sine;
    const sourceY = centerY - relativeX * sine + relativeY * cosine;
    const x0 = Math.floor(sourceX);
    const y0 = Math.floor(sourceY);
    const fractionX = sourceX - x0;
    const fractionY = sourceY - y0;
    const outputOffset = (y * width + x) * 4;
    let alpha = 0;
    let red = 0;
    let green = 0;
    let blue = 0;
    for (const [sampleX, sampleY, weight] of [[x0, y0, (1 - fractionX) * (1 - fractionY)], [x0 + 1, y0, fractionX * (1 - fractionY)], [x0, y0 + 1, (1 - fractionX) * fractionY], [x0 + 1, y0 + 1, fractionX * fractionY]]) {
      if (sampleX < 0 || sampleY < 0 || sampleX >= width || sampleY >= height) continue;
      const inputOffset = (sampleY * width + sampleX) * 4;
      const sampleAlpha = source.data[inputOffset + 3] / 255;
      alpha += sampleAlpha * weight;
      red += source.data[inputOffset] * sampleAlpha * weight;
      green += source.data[inputOffset + 1] * sampleAlpha * weight;
      blue += source.data[inputOffset + 2] * sampleAlpha * weight;
    }
    const outputAlpha = Math.round(alpha * 255);
    result[outputOffset + 3] = outputAlpha;
    if (outputAlpha > 0) {
      result[outputOffset] = Math.round(red / alpha);
      result[outputOffset + 1] = Math.round(green / alpha);
      result[outputOffset + 2] = Math.round(blue / alpha);
    }
  }
  await writeRgba(result, width, height, output);
}

// 투명도와 크레용 결을 유지한 채, 경계가 끊기지 않게 국소 영역을 부드럽게 이동한다.
// hard mask로 잘라 옮기면 원본의 손그림 외곽에 검은 이음선이 생겨 이 방식으로 대체했다.
async function warpFrame(input, rigsAt120, amount, output) {
  const source = await rawRgba(input);
  const { width, height } = source.info;
  const scale = width / 120;
  const rigs = rigsAt120.map(({ anchor, delta, radius }) => ({
    x: anchor[0] * scale,
    y: anchor[1] * scale,
    dx: delta[0] * scale * amount,
    dy: delta[1] * scale * amount,
    rx: Math.max(1, radius[0] * scale),
    ry: Math.max(1, radius[1] * scale),
  }));
  const result = Buffer.alloc(source.data.length);
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    let shiftX = 0;
    let shiftY = 0;
    for (const rig of rigs) {
      const distance = ((x - rig.x) / rig.rx) ** 2 + ((y - rig.y) / rig.ry) ** 2;
      const weight = Math.exp(-2 * distance);
      shiftX += rig.dx * weight;
      shiftY += rig.dy * weight;
    }
    const sourceX = x - shiftX;
    const sourceY = y - shiftY;
    const x0 = Math.floor(sourceX);
    const y0 = Math.floor(sourceY);
    const fractionX = sourceX - x0;
    const fractionY = sourceY - y0;
    const outputOffset = (y * width + x) * 4;
    let alpha = 0;
    let red = 0;
    let green = 0;
    let blue = 0;
    for (const [sampleX, sampleY, weight] of [[x0, y0, (1 - fractionX) * (1 - fractionY)], [x0 + 1, y0, fractionX * (1 - fractionY)], [x0, y0 + 1, (1 - fractionX) * fractionY], [x0 + 1, y0 + 1, fractionX * fractionY]]) {
      if (sampleX < 0 || sampleY < 0 || sampleX >= width || sampleY >= height) continue;
      const inputOffset = (sampleY * width + sampleX) * 4;
      const sampleAlpha = source.data[inputOffset + 3] / 255;
      alpha += sampleAlpha * weight;
      red += source.data[inputOffset] * sampleAlpha * weight;
      green += source.data[inputOffset + 1] * sampleAlpha * weight;
      blue += source.data[inputOffset + 2] * sampleAlpha * weight;
    }
    const outputAlpha = Math.round(alpha * 255);
    result[outputOffset + 3] = outputAlpha;
    if (outputAlpha > 0) {
      result[outputOffset] = Math.round(red / alpha);
      result[outputOffset + 1] = Math.round(green / alpha);
      result[outputOffset + 2] = Math.round(blue / alpha);
    }
  }
  await writeRgba(result, width, height, output);
}

async function mixFrames(aFile, bFile, amount) {
  const a = await rawRgba(aFile);
  const b = await rawRgba(bFile);
  if (a.info.width !== b.info.width || a.info.height !== b.info.height) fail("프레임 혼합 입력 크기가 다르다");
  const result = Buffer.alloc(a.data.length);
  for (let index = 0; index < result.length; index += 1) result[index] = Math.round(a.data[index] * (1 - amount) + b.data[index] * amount);
  return { data: result, info: a.info };
}

async function breatheFrame(input, scaleY, output) {
  const source = await rawRgba(input);
  const { width, height } = source.info;
  const centerY = height * (66.7 / 120);
  const result = Buffer.alloc(source.data.length);
  for (let y = 0; y < height; y += 1) {
    const sourceY = centerY + (y - centerY) / scaleY;
    const y0 = Math.floor(sourceY);
    const y1 = y0 + 1;
    const fraction = sourceY - y0;
    for (let x = 0; x < width; x += 1) {
      const outputOffset = (y * width + x) * 4;
      const samples = [[y0, 1 - fraction], [y1, fraction]].filter(([sampleY]) => sampleY >= 0 && sampleY < height);
      let alpha = 0;
      let red = 0;
      let green = 0;
      let blue = 0;
      for (const [sampleY, weight] of samples) {
        const inputOffset = (sampleY * width + x) * 4;
        const sampleAlpha = source.data[inputOffset + 3] / 255;
        alpha += sampleAlpha * weight;
        red += source.data[inputOffset] * sampleAlpha * weight;
        green += source.data[inputOffset + 1] * sampleAlpha * weight;
        blue += source.data[inputOffset + 2] * sampleAlpha * weight;
      }
      const outputAlpha = Math.round(alpha * 255);
      result[outputOffset + 3] = outputAlpha;
      if (outputAlpha > 0) {
        result[outputOffset] = Math.round(red / alpha);
        result[outputOffset + 1] = Math.round(green / alpha);
        result[outputOffset + 2] = Math.round(blue / alpha);
      }
    }
  }
  await writeRgba(result, width, height, output);
}

async function buildPilot(idle120, blink120, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const registeredBlink = path.join(outputDir, "fear--blink-registered-120.png");
  await patchEyes(idle120, blink120, registeredBlink);
  const loopFrames = path.join(outputDir, "idle-loop-frames");
  fs.mkdirSync(loopFrames, { recursive: true });
  const blinkAmount = new Map([[9, 0.5], [10, 1], [11, 1], [12, 0.5]]);
  for (let frame = 0; frame < 24; frame += 1) {
    const frameFile = path.join(loopFrames, `frame-${String(frame).padStart(3, "0")}.png`);
    const amount = blinkAmount.get(frame) ?? 0;
    const source = amount === 0 ? idle120 : amount === 1 ? registeredBlink : null;
    if (source) await breatheFrame(source, 1 + 0.006 * Math.sin((Math.PI * 2 * frame) / 24), frameFile);
    else {
      const mixed = await mixFrames(idle120, registeredBlink, amount);
      const mixedFile = path.join(outputDir, `.mixed-${frame}.png`);
      await writeRgba(mixed.data, mixed.info.width, mixed.info.height, mixedFile);
      await breatheFrame(mixedFile, 1 + 0.006 * Math.sin((Math.PI * 2 * frame) / 24), frameFile);
      fs.rmSync(mixedFile);
    }
  }
  const stem = path.join(outputDir, "fear--idle-loop-v1");
  await compare(loopFrames, stem, 12, 0);
  console.log(JSON.stringify({ registeredBlink, loopFrames, apng: `${stem}.apng`, webp: `${stem}.webp` }, null, 2));
}

async function extractApprovedSheet(sheetFile, specFile, charactersDir) {
  const spec = JSON.parse(fs.readFileSync(specFile, "utf8"));
  if (spec.characters.length !== 9) fail("승인 시트 추출은 prompts.json의 9종 순서를 요구한다");
  const source = await sharp(sheetFile).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = source.info;
  const pixels = width * height;
  const labels = new Int16Array(pixels);
  labels.fill(-1);
  const queue = new Int32Array(pixels);
  const components = [];
  for (let start = 0; start < pixels; start += 1) {
    if (labels[start] !== -1 || source.data[start * 4 + 3] < 8) continue;
    const id = components.length;
    let head = 0;
    let tail = 0;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    queue[tail++] = start;
    labels[start] = id;
    while (head < tail) {
      const pixel = queue[head++];
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const nextX = x + dx;
        const nextY = y + dy;
        if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) continue;
        const next = nextY * width + nextX;
        if (labels[next] === -1 && source.data[next * 4 + 3] >= 8) {
          labels[next] = id;
          queue[tail++] = next;
        }
      }
    }
    components.push({ id, count: tail, minX, minY, maxX, maxY });
  }
  const characters = components
    .filter((component) => component.count > 50_000)
    .sort((a, b) => {
      const rowA = Math.floor((((a.minY + a.maxY) / 2) * 3) / height);
      const rowB = Math.floor((((b.minY + b.maxY) / 2) * 3) / height);
      return rowA - rowB || ((a.minX + a.maxX) / 2) - ((b.minX + b.maxX) / 2);
    });
  if (characters.length !== 9) fail(`승인 시트에서 큰 alpha 연결 영역 ${characters.length}개를 찾음; 9개여야 한다`);
  const idToCharacter = new Map(characters.map((component, index) => [component.id, index]));
  let ownership = new Int16Array(pixels);
  ownership.fill(-1);
  for (let pixel = 0; pixel < pixels; pixel += 1) {
    if (idToCharacter.has(labels[pixel])) ownership[pixel] = idToCharacter.get(labels[pixel]);
  }
  // alpha 1~7의 매우 옅은 가장자리를 주 연결 영역 쪽으로 네 픽셀까지 되붙인다.
  for (let pass = 0; pass < 4; pass += 1) {
    const nextOwnership = ownership.slice();
    for (let pixel = 0; pixel < pixels; pixel += 1) {
      if (ownership[pixel] !== -1 || source.data[pixel * 4 + 3] === 0) continue;
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      for (let dy = -1; dy <= 1 && nextOwnership[pixel] === -1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) {
        const nextX = x + dx;
        const nextY = y + dy;
        if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) continue;
        const owner = ownership[nextY * width + nextX];
        if (owner !== -1) nextOwnership[pixel] = owner;
      }
    }
    ownership = nextOwnership;
  }
  const canvas = 480;
  for (const [index, character] of spec.characters.entries()) {
    const component = characters[index];
    const componentWidth = component.maxX - component.minX + 1;
    const componentHeight = component.maxY - component.minY + 1;
    const offsetX = Math.floor((canvas - componentWidth) / 2) - component.minX;
    const offsetY = Math.floor((canvas - componentHeight) / 2) - component.minY;
    const isolated = Buffer.alloc(canvas * canvas * 4);
    for (let pixel = 0; pixel < pixels; pixel += 1) {
      if (ownership[pixel] !== index) continue;
      const sourceX = pixel % width;
      const sourceY = Math.floor(pixel / width);
      const targetX = sourceX + offsetX;
      const targetY = sourceY + offsetY;
      if (targetX < 0 || targetY < 0 || targetX >= canvas || targetY >= canvas) continue;
      source.data.copy(isolated, (targetY * canvas + targetX) * 4, pixel * 4, pixel * 4 + 4);
    }
    const master = path.join(charactersDir, "src", `${character.key}-1024.png`);
    const delivered = path.join(charactersDir, `${character.key}.png`);
    ensureParent(master);
    await sharp(isolated, { raw: { width: canvas, height: canvas, channels: 4 } })
      .resize(1024, 1024, { kernel: "lanczos3" })
      .toColourspace("srgb")
      .ensureAlpha()
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(master);
    await sharp(master)
      .resize(120, 120, { kernel: "lanczos3" })
      .toColourspace("srgb")
      .ensureAlpha()
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(delivered);
  }
  console.log(JSON.stringify({ sheetFile, characters: spec.characters.map(({ key }) => key), charactersDir }, null, 2));
}

async function buildAllMotions(specFile, charactersDir) {
  const spec = JSON.parse(fs.readFileSync(specFile, "utf8"));
  const motionDir = path.join(charactersDir, "motion");
  const scratchRoot = path.join(motionDir, ".build-frames");
  fs.rmSync(scratchRoot, { recursive: true, force: true });
  fs.mkdirSync(scratchRoot, { recursive: true });
  const manifest = {
    version: 1,
    generated_from: "design/characters/mood-preview-v2.png",
    format: "lossless animated WebP",
    canvas_px: 120,
    color: "RGBA 8-bit sRGB",
    alpha: "straight alpha; fully transparent RGB cleared",
    idle: { source_frames: 24, fps: 12, target_duration_ms: 2000, loop: "infinite" },
    acknowledge: { source_frames: 16, fps: 12, target_duration_ms: 1333, loop: "once; final frame is idle; encoder may merge duplicate adjacent frames" },
    files: [],
  };
  try {
    for (const [index, character] of spec.characters.entries()) {
      const base = path.join(charactersDir, `${character.key}.png`);
      if (!fs.existsSync(base)) fail(`${base}: 먼저 extract-sheet를 실행해야 한다`);
      const characterScratch = path.join(scratchRoot, character.key);
      const idleDir = path.join(characterScratch, "idle");
      const acknowledgeDir = path.join(characterScratch, "acknowledge");
      fs.mkdirSync(idleDir, { recursive: true });
      fs.mkdirSync(acknowledgeDir, { recursive: true });
      const blinkMaster = path.join(charactersDir, "poses", `${character.key}--blink-1024.png`);
      const blink120 = path.join(characterScratch, "blink.png");
      const rigs = spec.motion_spec?.emotion_rigs?.[character.key];
      if (!Array.isArray(rigs) || rigs.length === 0) fail(`${character.key}: prompts.json motion_spec.emotion_rigs가 없다`);
      const hasBlink = fs.existsSync(blinkMaster);
      if (hasBlink) {
        await sharp(blinkMaster).resize(120, 120, { kernel: "lanczos3" }).toColourspace("srgb").ensureAlpha().png().toFile(blink120);
      }
      const amplitude = 0.0035 + (index % 3) * 0.0005;
      const blinkAmount = new Map([[9, 0.5], [10, 1], [11, 1], [12, 0.5]]);
      for (let frame = 0; frame < 24; frame += 1) {
        const scaleY = 1 + amplitude * Math.sin((Math.PI * 2 * frame) / 24);
        const amount = hasBlink ? (blinkAmount.get(frame) ?? 0) : 0;
        const output = path.join(idleDir, `frame-${String(frame).padStart(3, "0")}.png`);
        if (amount === 0) await breatheFrame(base, scaleY, output);
        else if (amount === 1) await breatheFrame(blink120, scaleY, output);
        else {
          const mixed = await mixFrames(base, blink120, amount);
          const mixedFile = path.join(characterScratch, `.idle-mixed-${frame}.png`);
          await writeRgba(mixed.data, mixed.info.width, mixed.info.height, mixedFile);
          await breatheFrame(mixedFile, scaleY, output);
          fs.rmSync(mixedFile);
        }
      }
      for (let frame = 0; frame < 16; frame += 1) {
        // 감정 몸짓을 먼저 읽을 수 있도록 peak 근처를 3프레임 유지한다. 각 값은 달라야
        // WebP 인코더가 정지 프레임을 합치지 않고 12~16페이지/60~180ms 계약을 지킨다.
        const progress = [0, 0.08, 0.28, 0.55, 0.78, 0.94, 1, 0.98, 0.82, 0.58, 0.3, 0.1, 0.04, 0.015, 0.004, 0][frame];
        const amount = 0;
        const output = path.join(acknowledgeDir, `frame-${String(frame).padStart(3, "0")}.png`);
        const rigged = path.join(characterScratch, `.ack-rig-${frame}.png`);
        if (amount === 0) await warpFrame(base, rigs, progress, rigged);
        else if (amount === 1) await warpFrame(blink120, rigs, progress, rigged);
        else {
          const mixed = await mixFrames(base, blink120, amount);
          const mixedFile = path.join(characterScratch, `.ack-mixed-${frame}.png`);
          await writeRgba(mixed.data, mixed.info.width, mixed.info.height, mixedFile);
          await warpFrame(mixedFile, rigs, progress, rigged);
          fs.rmSync(mixedFile);
        }
        await breatheFrame(rigged, 1 - 0.002 * progress, output);
        fs.rmSync(rigged);
      }
      const idleFrames = fs.readdirSync(idleDir).sort().map((name) => path.join(idleDir, name));
      const acknowledgeFrames = fs.readdirSync(acknowledgeDir).sort().map((name) => path.join(acknowledgeDir, name));
      const idleOutput = path.join(motionDir, `${character.key}--idle-loop.webp`);
      const acknowledgeOutput = path.join(motionDir, `${character.key}--acknowledge-once.webp`);
      await encodeWebp(idleFrames, idleOutput, 12, 0);
      await encodeWebp(acknowledgeFrames, acknowledgeOutput, 12, 1);
      const idleMetadata = await sharp(idleOutput, { animated: true }).metadata();
      const acknowledgeMetadata = await sharp(acknowledgeOutput, { animated: true }).metadata();
      manifest.files.push({ key: character.key, motion: "idle-loop", file: path.relative(charactersDir, idleOutput).replaceAll("\\", "/"), bytes: fs.statSync(idleOutput).size, sha256: sha256(idleOutput), encoded_pages: idleMetadata.pages, duration_ms: idleMetadata.delay.reduce((sum, delay) => sum + delay, 0), loop: idleMetadata.loop });
      manifest.files.push({ key: character.key, motion: "acknowledge-once", file: path.relative(charactersDir, acknowledgeOutput).replaceAll("\\", "/"), bytes: fs.statSync(acknowledgeOutput).size, sha256: sha256(acknowledgeOutput), encoded_pages: acknowledgeMetadata.pages, duration_ms: acknowledgeMetadata.delay.reduce((sum, delay) => sum + delay, 0), loop: acknowledgeMetadata.loop });
    }
    fs.writeFileSync(path.join(motionDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  } finally {
    fs.rmSync(scratchRoot, { recursive: true, force: true });
  }
  console.log(JSON.stringify(manifest, null, 2));
}

async function buildBasicPoses(specFile, charactersDir) {
  const spec = JSON.parse(fs.readFileSync(specFile, "utf8"));
  const poseDir = path.join(charactersDir, "poses");
  fs.mkdirSync(poseDir, { recursive: true });
  for (const [index, character] of spec.characters.entries()) {
    const master = path.join(charactersDir, "src", `${character.key}-1024.png`);
    if (!fs.existsSync(master)) fail(`${master}: 먼저 extract-sheet를 실행해야 한다`);
    await sharp(master).toColourspace("srgb").ensureAlpha().png().toFile(path.join(poseDir, `${character.key}--idle-1024.png`));
    await breatheFrame(master, 1.004, path.join(poseDir, `${character.key}--breathe-1024.png`));
    await rotateFrame(master, index % 2 === 0 ? -1.8 : 1.8, path.join(poseDir, `${character.key}--tilt-1024.png`));
  }
  console.log(`PASS: ${spec.characters.length}종 idle/breathe/tilt 포즈 생성`);
}

const [command, ...args] = process.argv.slice(2);
if (command === "prepare" && args.length === 3) await prepare(...args);
else if (command === "compare" && args.length >= 2) await compare(args[0], args[1], Number(args[2] ?? 12), Number(args[3] ?? 0));
else if (command === "pilot" && args.length === 3) await buildPilot(...args);
else if (command === "patch-eyes" && args.length === 4) await patchEyes(args[0], args[1], args[2], JSON.parse(args[3]));
else if (command === "move-region" && args.length === 4) await moveRegion(args[0], JSON.parse(args[1]), JSON.parse(args[2]), args[3]);
else if (command === "rotate-frame" && args.length === 3) await rotateFrame(args[0], Number(args[1]), args[2]);
else if (command === "warp-frame" && args.length === 4) await warpFrame(args[0], JSON.parse(args[1]), Number(args[2]), args[3]);
else if (command === "extract-sheet" && args.length === 3) await extractApprovedSheet(...args);
else if (command === "build-all" && args.length === 2) await buildAllMotions(...args);
else if (command === "build-pose-basics" && args.length === 2) await buildBasicPoses(...args);
else fail("사용법: prepare <input> <master-1024.png> <delivered-120.png> | compare <frames-dir> <output-stem> [fps=12] [plays=0] | pilot <idle-120.png> <blink-120.png> <output-dir> | patch-eyes <base.png> <donor.png> <output.png> <rects-json-at-120> | move-region <input.png> <rect-json-at-120> <delta-json-at-120> <output.png> | rotate-frame <input.png> <degrees> <output.png> | warp-frame <input.png> <rigs-json-at-120> <amount> <output.png> | extract-sheet <approved-sheet.png> <prompts.json> <characters-dir> | build-all <prompts.json> <characters-dir> | build-pose-basics <prompts.json> <characters-dir>");
