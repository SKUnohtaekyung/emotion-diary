// 감정 목록과 캐릭터 설명은 정본을 실행 중에 읽는다. 사본을 두지 않으므로 정본이 바뀌면 시안도 같이 바뀐다.
export const data = { categories: [], byCode: new Map(), characters: new Map(), taxonomyVersion: "" };

export async function loadData() {
  const [taxonomy, prompts] = await Promise.all([
    fetch("/data/taxonomy/v2.json").then((r) => r.json()),
    fetch("/design/characters/prompts.json").then((r) => r.json())
  ]);
  data.taxonomyVersion = taxonomy.version;
  // 순서는 taxonomy 선언 순서 그대로다. 심리 축으로 정렬하지 않는다(DESIGN_SYSTEM §6.2).
  data.categories = taxonomy.categories.map((c) => ({
    code: c.code, label: c.label_ko,
    emotions: c.emotions.map((e) => ({ code: e.code, label: e.label_ko, cat: c.code }))
  }));
  for (const c of data.categories) for (const e of c.emotions) data.byCode.set(e.code, e);
  for (const ch of prompts.characters) data.characters.set(ch.key, { alt: ch.alt });
}

export const category = (code) => data.categories.find((c) => c.code === code);

// 대표 캐릭터. animated=true면 움직임 허용 환경에서만 WebP를 쓰고, reduced-motion·미지원이면 정적 PNG다(DESIGN_SYSTEM §9).
export function characterPicture(key, { animated = false, motion = "idle-loop", size = 40, decorative = false } = {}) {
  const picture = document.createElement("picture");
  if (animated) {
    const source = document.createElement("source");
    source.media = "(prefers-reduced-motion: no-preference)";
    source.type = "image/webp";
    source.srcset = `/design/characters/motion/${key}--${motion}.webp`;
    picture.append(source);
  }
  const img = document.createElement("img");
  img.src = `/design/characters/${key}.png`;
  img.width = size; img.height = size;
  img.alt = decorative ? "" : (data.characters.get(key)?.alt ?? `${category(key)?.label ?? ""} 캐릭터`);
  img.className = "character";
  picture.append(img);
  return picture;
}

// UI 정적 포즈(장식 전용, 애니메이션 없음). 시작·빈 상태·완료 화면에만 쓴다(DESIGN_SYSTEM §8).
export function decorativePose(key, size = 56) {
  const img = document.createElement("img");
  img.src = `/design/characters/ui-poses/${key}--expressive-static-120.png`;
  img.width = size; img.height = size; img.alt = ""; img.className = "pose";
  return img;
}
