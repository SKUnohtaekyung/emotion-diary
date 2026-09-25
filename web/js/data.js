// 감정 목록은 정본(data/taxonomy/v2.json)을 실행 중에 읽는다. 사본을 두지 않으므로 정본이 바뀌면 시안도 같이 바뀐다.
export const data = { categories: [], byCode: new Map(), taxonomyVersion: "" };

export async function loadData() {
  const taxonomy = await fetch("/data/taxonomy/v2.json").then((r) => r.json());
  data.taxonomyVersion = taxonomy.version;
  // 순서는 taxonomy 선언 순서 그대로다. 심리 축으로 정렬하지 않는다(DESIGN_SYSTEM §6.2).
  data.categories = taxonomy.categories.map((c) => ({
    code: c.code, label: c.label_ko,
    emotions: c.emotions.map((e) => ({ code: e.code, label: e.label_ko, cat: c.code }))
  }));
  for (const c of data.categories) for (const e of c.emotions) data.byCode.set(e.code, e);
}

export const category = (code) => data.categories.find((c) => c.code === code);

// 평면 친구 9종(D-051). taxonomy 키 → 파일명에 쓰는 로마자 이름과 한글 이름. 정본은 design/characters/README.md §9다.
// 파일: /design/characters/flat-friends/ui/<slug>--<taxonomyKey>-{480|160}.png (정적 PNG뿐, 애니메이션 자산 없음)
export const FRIENDS = {
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

// 친구 그림. size가 80px를 넘으면 480 파일, 아니면 160 파일이다(화면 밀도 2배까지 흐려지지 않게).
// label=true(기본)면 alt가 "누리, 즐거움 친구"다. 옆에 이름 글자가 있는 자리는 label=false로 장식 처리해 같은 말을 두 번 읽지 않게 한다.
export function friendImg(key, { size = 96, label = true } = {}) {
  const friend = FRIENDS[key];
  const img = document.createElement("img");
  img.src = `/design/characters/flat-friends/ui/${friend.slug}--${key}-${size > 80 ? 480 : 160}.png`;
  img.width = size; img.height = size; img.decoding = "async";
  img.alt = label ? `${friend.name}, ${category(key)?.label ?? ""} 친구` : "";
  img.className = "friend-img";
  return img;
}

// 조약돌 그림(D-050). 돌 하나는 그날 고른 계열 하나이며 장식이다 — 이름·뜻은 옆의 글자가 말한다. 64px를 넘으면 320 파일, 아니면 128 파일이다.
export function pebbleImg(key, { size = 72 } = {}) {
  const img = document.createElement("img");
  img.src = `/design/pebbles/ui/${key}-${size > 64 ? 320 : 128}.png`;
  img.width = size; img.height = size; img.decoding = "async"; img.alt = "";
  img.className = "pebble-img";
  return img;
}

// 오늘 화면 가운데 돌(D-062). 쉬는 돌(청회색)과 켜진 돌(흰빛) 두 장이다. 감정 조약돌이 아니라 시작을 알리는 돌이라 감정 색이 없다.
export function stoneImg(kind) {
  const img = document.createElement("img");
  img.src = `/design/pebbles/ui/stone-${kind}-320.png`;
  img.decoding = "async"; img.alt = ""; img.className = `stone-img ${kind}`;
  return img;
}
