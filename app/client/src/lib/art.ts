// 사용자가 준 그림(친구·조약돌·돌 PNG)을 Vite로 묶어 주소를 준다(TASK-REFLECT-01 R-1, MAP R8 — 다시 그리지 않는다).
// 파일은 design/ 아래가 정본이고(design/characters/README.md §9), 묶을 때 같은 출처의 해시 붙은 파일이 된다(CSP img-src 'self').
// 크기 규칙은 시안 web/js/data.js와 같다: 친구는 80px를 넘으면 480 파일, 조약돌은 64px를 넘으면 320 파일(화면 밀도 2배까지 흐려지지 않게).

const FRIEND_FILES = import.meta.glob("../../../../design/characters/flat-friends/ui/*.png", { eager: true, query: "?url", import: "default" });
const PEBBLE_FILES = import.meta.glob("../../../../design/pebbles/ui/*.png", { eager: true, query: "?url", import: "default" });

/** 평면 친구 9종(D-051) — 계열 코드 → 파일 이름의 로마자와 한글 이름. */
export const FRIENDS: Readonly<Record<string, { slug: string; name: string }>> = {
  enjoyment: { slug: "nuri", name: "누리" },
  wish: { slug: "bara", name: "바라" },
  sadness: { slug: "seori", name: "설이" },
  anger: { slug: "taon", name: "타온" },
  joy: { slug: "narae", name: "나래" },
  love: { slug: "pumi", name: "품이" },
  hate: { slug: "arin", name: "아린" },
  fear: { slug: "sumi", name: "숨이" },
  disgust: { slug: "gareum", name: "가름" }
};

function pick(files: Record<string, string>, file: string): string {
  const found = Object.entries(files).find(([path]) => path.endsWith(`/${file}`));
  if (!found) throw new Error(`그림 파일이 없다: ${file}`);
  return found[1];
}

export function friendUrl(category: string, size: number): string {
  const friend = FRIENDS[category];
  if (!friend) throw new Error(`모르는 계열: ${category}`);
  return pick(FRIEND_FILES, `${friend.slug}--${category}-${size > 80 ? 480 : 160}.png`);
}

export function pebbleUrl(category: string, size: number): string {
  return pick(PEBBLE_FILES, `${category}-${size > 64 ? 320 : 128}.png`);
}

/** 오늘 화면 가운데 돌(D-062) — 쉬는 돌·켜진 돌. 감정 색이 없다. */
export function stoneUrl(kind: "rest" | "lit"): string {
  return pick(PEBBLE_FILES, `stone-${kind}-320.png`);
}
