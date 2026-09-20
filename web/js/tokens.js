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
  for (const [name, value] of Object.entries(tokens.space)) set(`sp-${name}`, px(value));
  set("radius", px(tokens.radius.control)); set("radius-card", px(tokens.radius.card));
  set("radius-sheet", px(tokens.radius.sheet)); set("radius-chip", px(tokens.radius.chip));
  set("touch", px(tokens.size["touch-target-min"])); set("content-max", px(tokens.size["content-max-width"]));
  set("nav-h", px(tokens.size["bottom-nav-height"]));
  set("hairline", px(tokens.border.hairline)); set("emphasis", px(tokens.border.emphasis));
  set("dur-fast", `${tokens.motion.duration.fast}ms`); set("dur-base", `${tokens.motion.duration.base}ms`); set("dur-slow", `${tokens.motion.duration.slow}ms`);
  set("ease", tokens.motion.easing); set("spring", tokens.motion["easing-spring"]);
  set("z-sticky", tokens.z.sticky); set("z-nav", tokens.z["bottom-nav"]);
  return tokens;
}
