// design/characters/의 최종 캐릭터 정적·동적 자산 계약을 검사한다(DESIGN_SYSTEM §8).
// pilot/은 실험 공간이므로 최종 9종 완전성 판정에서 제외한다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(process.env.CHARACTER_CHECK_ROOT || repositoryRoot);
const dir = path.join(root, "design/characters");
const spec = JSON.parse(fs.readFileSync(path.join(dir, "prompts.json"), "utf8"));
const keys = spec.characters.map((character) => character.key);
const deliveredPx = spec.output.delivered_px;
const masterPx = spec.output.master_px;
const selectedAnimation = spec.output.animation_format ?? null;
const blinkPoseKeys = new Set(spec.motion_spec?.blink_pose_keys ?? []);
const emotionPoseKeys = new Set(spec.motion_spec?.emotion_pose_keys ?? []);
const emotionRigs = spec.motion_spec?.emotion_rigs ?? {};
const uiStaticPoseSet = spec.ui_static_pose_set ?? null;

async function inspectStatic(target, failures) {
  if (!fs.existsSync(target.file)) {
    failures.push(`${target.rel}: 없음 (9종은 한 벌로 함께 만든다)`);
    return;
  }
  try {
    const image = sharp(target.file, { failOn: "warning" });
    const metadata = await image.metadata();
    if (metadata.format !== "png") failures.push(`${target.rel}: PNG가 아님`);
    if (metadata.width !== target.px || metadata.height !== target.px) failures.push(`${target.rel}: ${metadata.width}x${metadata.height}, ${target.px}x${target.px}이어야 함`);
    if (!metadata.hasAlpha) {
      failures.push(`${target.rel}: alpha 채널이 없음`);
      return;
    }
    const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let clear = 0;
    let opaque = 0;
    let dirtyClear = 0;
    for (let offset = 0; offset < data.length; offset += info.channels) {
      const alpha = data[offset + 3];
      if (alpha === 0) {
        clear += 1;
        if (data[offset] !== 0 || data[offset + 1] !== 0 || data[offset + 2] !== 0) dirtyClear += 1;
      }
      if (alpha >= 250) opaque += 1;
    }
    const pixels = metadata.width * metadata.height;
    if (clear / pixels < 0.05) failures.push(`${target.rel}: 실제 완전 투명 픽셀이 5% 미만`);
    if (opaque / pixels < 0.05) failures.push(`${target.rel}: 불투명 캐릭터 픽셀이 5% 미만`);
    if (dirtyClear > 0) failures.push(`${target.rel}: 완전 투명 픽셀 ${dirtyClear}개에 RGB 잔존(halo 위험)`);
  } catch (error) {
    failures.push(`${target.rel}: 해석 실패 (${error.message})`);
  }
}

async function inspectAnimation(target, failures) {
  if (!fs.existsSync(target.file)) {
    failures.push(`${target.rel}: 없음`);
    return;
  }
  try {
    const metadata = await sharp(target.file, { animated: true, failOn: "warning" }).metadata();
    if (metadata.format !== selectedAnimation) failures.push(`${target.rel}: ${selectedAnimation} 형식이 아님`);
    if (metadata.width !== deliveredPx || metadata.pageHeight !== deliveredPx) failures.push(`${target.rel}: 프레임 ${metadata.width}x${metadata.pageHeight}, ${deliveredPx}x${deliveredPx}이어야 함`);
    if (!metadata.hasAlpha) failures.push(`${target.rel}: alpha 채널이 없음`);
    const pages = metadata.pages ?? 1;
    if (pages < target.minPages || pages > target.maxPages) failures.push(`${target.rel}: 인코딩 프레임 ${pages}개, 허용 ${target.minPages}~${target.maxPages}개`);
    if (!Array.isArray(metadata.delay) || metadata.delay.length !== pages) {
      failures.push(`${target.rel}: 프레임 지연 메타데이터가 없음`);
    } else {
      const duration = metadata.delay.reduce((sum, delay) => sum + delay, 0);
      if (metadata.delay.some((delay) => delay < 60 || delay > 180)) failures.push(`${target.rel}: 프레임 지연이 60~180ms 범위를 벗어남`);
      if (duration < target.minDuration || duration > target.maxDuration) failures.push(`${target.rel}: 재생 시간 ${duration}ms, 허용 ${target.minDuration}~${target.maxDuration}ms`);
    }
    if (metadata.loop !== target.loop) failures.push(`${target.rel}: loop=${metadata.loop}, 기대값 ${target.loop}`);
    if (pages > 1 && metadata.width && metadata.pageHeight) {
      const { data, info } = await sharp(target.file, { animated: true }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const centers = [];
      for (let page = 0; page < pages; page += 1) {
        let alphaSum = 0;
        let weightedX = 0;
        let weightedY = 0;
        for (let y = 0; y < metadata.pageHeight; y += 1) for (let x = 0; x < metadata.width; x += 1) {
          const offset = ((page * metadata.pageHeight + y) * metadata.width + x) * info.channels;
          const alpha = data[offset + 3] / 255;
          alphaSum += alpha;
          weightedX += x * alpha;
          weightedY += y * alpha;
        }
        centers.push([weightedX / alphaSum, weightedY / alphaSum]);
      }
      const [baseX, baseY] = centers[0];
      const maxDrift = Math.max(...centers.map(([x, y]) => Math.hypot(x - baseX, y - baseY)));
      if (maxDrift > 1) failures.push(`${target.rel}: alpha 중심 이동 ${maxDrift.toFixed(2)}px, 최대 1px`);
    }
  } catch (error) {
    failures.push(`${target.rel}: 애니메이션 해석 실패 (${error.message})`);
  }
}

const staticTargets = [];
for (const key of keys) {
  staticTargets.push({ file: path.join(dir, `${key}.png`), rel: `design/characters/${key}.png`, px: deliveredPx });
  staticTargets.push({ file: path.join(dir, "src", `${key}-1024.png`), rel: `design/characters/src/${key}-1024.png`, px: masterPx });
}
const present = staticTargets.filter((target) => fs.existsSync(target.file));

if (present.length === 0) {
  console.log(`PENDING: 캐릭터 아이콘 ${keys.length}종 미제작 (prompts.json ${spec.version}). 규격은 design/characters/README.md`);
  process.exit(0);
}

const failures = [];
for (const target of staticTargets) await inspectStatic(target, failures);

const uiStaticTargets = [];
if (uiStaticPoseSet) {
  const uiKeys = uiStaticPoseSet.keys;
  if (!Array.isArray(uiKeys) || uiKeys.length !== keys.length || new Set(uiKeys).size !== keys.length || uiKeys.some((key) => !keys.includes(key))) {
    failures.push("prompts.json ui_static_pose_set.keys: 9종 고정 동물 key를 순서대로 모두 포함해야 함");
  } else if (uiStaticPoseSet.animated !== false) {
    failures.push("prompts.json ui_static_pose_set.animated: UI 보조 포즈는 정적(false)이어야 함");
  } else {
    for (const key of uiKeys) {
      uiStaticTargets.push({ file: path.join(dir, "ui-poses", `${key}--expressive-static-1024.png`), rel: `design/characters/ui-poses/${key}--expressive-static-1024.png`, px: uiStaticPoseSet.master_px });
      uiStaticTargets.push({ file: path.join(dir, "ui-poses", `${key}--expressive-static-120.png`), rel: `design/characters/ui-poses/${key}--expressive-static-120.png`, px: uiStaticPoseSet.delivered_px });
    }
    for (const target of uiStaticTargets) await inspectStatic(target, failures);
  }
}

for (const key of keys) {
  for (const pose of ["idle", "breathe", "tilt"]) {
    const poseFile = path.join(dir, "poses", `${key}--${pose}-1024.png`);
    await inspectStatic({ file: poseFile, rel: `design/characters/poses/${key}--${pose}-1024.png`, px: masterPx }, failures);
  }
}
for (const key of blinkPoseKeys) {
  if (!keys.includes(key)) failures.push(`prompts.json motion_spec.blink_pose_keys: 알 수 없는 key ${key}`);
  else await inspectStatic({ file: path.join(dir, "poses", `${key}--blink-1024.png`), rel: `design/characters/poses/${key}--blink-1024.png`, px: masterPx }, failures);
}
for (const key of emotionPoseKeys) {
  if (!keys.includes(key)) failures.push(`prompts.json motion_spec.emotion_pose_keys: 알 수 없는 key ${key}`);
  else {
    await inspectStatic({ file: path.join(dir, "poses", `${key}--emotion-1024.png`), rel: `design/characters/poses/${key}--emotion-1024.png`, px: masterPx }, failures);
    const rigs = emotionRigs[key];
    if (!Array.isArray(rigs) || rigs.length === 0) failures.push(`prompts.json motion_spec.emotion_rigs.${key}: acknowledge 국소 리그가 없음`);
    else for (const [index, rig] of rigs.entries()) {
      const values = [...(rig?.anchor ?? []), ...(rig?.delta ?? []), ...(rig?.radius ?? [])];
      if (!Array.isArray(rig?.anchor) || rig.anchor.length !== 2 || !Array.isArray(rig?.delta) || rig.delta.length !== 2 || !Array.isArray(rig?.radius) || rig.radius.length !== 2 || values.some((value) => !Number.isFinite(value)) || rig.radius.some((value) => value <= 0)) {
        failures.push(`prompts.json motion_spec.emotion_rigs.${key}[${index}]: anchor/delta/radius 2개 수치가 필요`);
      }
    }
  }
}
for (const key of Object.keys(emotionRigs)) if (!keys.includes(key)) failures.push(`prompts.json motion_spec.emotion_rigs: 알 수 없는 key ${key}`);

if (selectedAnimation) {
  for (const key of keys) {
    await inspectAnimation({ file: path.join(dir, "motion", `${key}--idle-loop.${selectedAnimation}`), rel: `design/characters/motion/${key}--idle-loop.${selectedAnimation}`, minPages: 20, maxPages: 24, minDuration: 1900, maxDuration: 2100, loop: 0 }, failures);
    await inspectAnimation({ file: path.join(dir, "motion", `${key}--acknowledge-once.${selectedAnimation}`), rel: `design/characters/motion/${key}--acknowledge-once.${selectedAnimation}`, minPages: 12, maxPages: 16, minDuration: 1200, maxDuration: 1450, loop: 1 }, failures);
  }
}

if (failures.length) {
  for (const failure of failures) console.log(`FAIL ${failure}`);
  console.error(`FAIL: 캐릭터 자산 검사 ${failures.length}건 실패`);
  process.exit(1);
}
console.log(`PASS: 캐릭터 정적 ${staticTargets.length}개, UI 정적 포즈 ${uiStaticTargets.length}개, 기본 포즈 ${keys.length * 3}개, blink 포즈 ${blinkPoseKeys.size}개, emotion 포즈 ${emotionPoseKeys.size}개${selectedAnimation ? `, 동적 ${keys.length * 2}개` : ""} 검사 통과`);
