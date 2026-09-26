// design/tokens.json을 실행 중에 읽어 CSS 변수로 올린다. web/ 안에는 색·크기 값의 사본을 두지 않는다(D-047).
// 변수 이름은 design/style-guide.html의 :root와 같게 맞췄다(--bg, --anger-500 …).
const NEUTRAL_NAMES = { bg: "bg", surface: "surface", "surface-raised": "raised", border: "border", "border-strong": "border-strong", text: "text", "text-muted": "muted", "text-subtle": "subtle", focus: "focus" };

export async function applyTokens() {
  const tokens = await (await fetch("/design/tokens.json")).json();
  const style = document.documentElement.style;
  const set = (name, value) => style.setProperty(`--${name}`, String(value));
  const px = (value) => `${value}px`;

  // MVP는 light 전용이다(tokens.mode, D-034).
  for (const [key, value] of Object.entries(tokens.color.neutral)) set(NEUTRAL_NAMES[key] ?? key, value.light);
  for (const [key, value] of Object.entries(tokens.color.semantic)) set(key, value.light);
  for (const [key, value] of Object.entries(tokens.color.service ?? {})) set(`service-${key}`, value.light); // --service-ink|mint|light (D-054)

  for (const [key, value] of Object.entries(tokens.color.forest ?? {})) if (value?.light) set(`forest-${key}`, value.light); // 오늘 화면의 어두운 숲(D-062)
  for (const [key, value] of Object.entries(tokens.color.land ?? {})) if (value?.light) set(`land-${key}`, value.light); // 완료·온보딩의 색 언덕(D-061)
  for (const [key, value] of Object.entries(tokens.color.paper ?? {})) if (value?.light) set(key.startsWith("paper") ? key : key, value.light); // 편지 종이·봉투(D-063): --paper, --paper-rule, --paper-ink, --envelope-*

  const usage = tokens.color["emotion-usage"];
  for (const [key, steps] of Object.entries(tokens.color.emotion)) {
    for (const [step, value] of Object.entries(steps)) if (/^\d+$/.test(step)) set(`${key}-${step}`, value);
    const accentStep = usage["accent-override"]?.[key]?.light ?? usage["category-accent"].light;
    set(`${key}-accent`, steps[accentStep]);
    set(`${key}-chip-fill`, steps[usage["chip-fill"].light]);
    set(`${key}-chip-border`, steps[usage["chip-border"].light]);
    set(`${key}-chip-text`, steps[usage["chip-text"].light]);
  }

  set("font", tokens.typography.family.sans);
  for (const [name, scale] of Object.entries(tokens.typography.scale)) {
    // 글자 크기는 rem으로 올린다. 사용자가 브라우저·기기의 기본 글자 크기를 키우면 시안의 글자도 같이 커져야 한다(DESIGN_SYSTEM §9 확대).
    set(`fs-${name}`, `${scale.size / 16}rem`); set(`lh-${name}`, `${scale.line / 16}rem`); set(`fw-${name}`, scale.weight);
  }
  // hero는 clamp()로 화면 폭에 맞춰 줄어들므로 줄 높이를 rem 값이 아니라 글자 크기에 대한 비율로도 올린다(D-057).
  const hero = tokens.typography.scale.hero;
  set("lh-hero-ratio", (hero.line / hero.size).toFixed(4));
  for (const [name, value] of Object.entries(tokens.space)) set(`sp-${name}`, px(value));
  set("radius", px(tokens.radius.control)); set("radius-card", px(tokens.radius.card));
  set("radius-sheet", px(tokens.radius.sheet)); set("radius-chip", px(tokens.radius.chip));
  set("radius-blob", tokens.radius.blob); // 유기형 면: 하단 탐색의 현재 탭, 달력 칸, 오늘 무대(D-054)
  set("touch", px(tokens.size["touch-target-min"])); set("content-max", px(tokens.size["content-max-width"]));
  set("nav-h", px(tokens.size["bottom-nav-height"]));
  set("hairline", px(tokens.border.hairline)); set("emphasis", px(tokens.border.emphasis));
  set("dur-fast", `${tokens.motion.duration.fast}ms`); set("dur-base", `${tokens.motion.duration.base}ms`); set("dur-slow", `${tokens.motion.duration.slow}ms`);
  set("light-in", `${tokens.motion.light.in}ms`); set("light-hold", `${tokens.motion.light.hold}ms`); set("light-out", `${tokens.motion.light.out}ms`); // 알아차림의 빛(D-055)
  const stone = tokens.motion.stone; // 가운데 돌(D-062)
  set("stone-rock", `${stone.rock}ms`); set("stone-hop", `${stone.hop}ms`); set("stone-flood", `${stone.flood}ms`); set("stone-flood-reduced", `${stone.reducedFlood}ms`);
  set("ease", tokens.motion.easing); set("spring", tokens.motion["easing-spring"]);
  set("z-sticky", tokens.z.sticky); set("z-nav", tokens.z["bottom-nav"]); set("z-sheet", tokens.z.sheet);
  // 상태 표현(D-098, DESIGN_SYSTEM §5.1): 누름 비율과 옅은 면·비활성 섞는 양. 섞는 양은 color-mix에 바로 넣도록 %로 올린다.
  const pct = (value) => `${Math.round(value * 1000) / 10}%`;
  const { pressed, disabled } = tokens.state;
  set("press-pill", pressed["pill-scale"]); set("press-row", pressed["row-scale"]);
  set("press-row-overlay", pct(pressed["row-overlay"])); set("press-reduced", pct(pressed["reduced-overlay"])); set("press-reduced-ink", pct(pressed["reduced-overlay-on-ink"]));
  set("dis-surface", pct(disabled["surface-mix"])); set("dis-content", pct(disabled["content-mix"]));
  return tokens;
}
