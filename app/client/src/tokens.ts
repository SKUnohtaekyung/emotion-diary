// 디자인 토큰을 CSS 변수로 심는다(T3 A-11). 정본은 design/tokens.json 하나이고 여기서 값을 복제하지 않는다.
// light 값만 쓴다 — 다크 모드는 범위 밖이다(D-034). 값은 CSSOM(setProperty)으로만 넣는다(CSP가 style 속성을 막는다).
//
// 이름이 두 벌이다(TASK-REFLECT-01 A-13):
// - 앱 이름(--neutral-bg, --text-body-size, --space-4 …) — 지금까지의 화면이 쓴다.
// - 시안 이름(--bg, --fs-body, --sp-4, --anger-500 …) — 시안 web/js/tokens.js와 같은 규칙으로 펼친다. 시안 CSS를 거의 그대로
//   옮겨 오려는 것이다(D-127 이후 시안 화면 이식). 두 벌 모두 같은 tokens.json 값에서 나오므로 값이 갈라지지 않는다.
// 글자 크기·줄 높이는 rem이다 — 기기·브라우저의 기본 글자 크기를 키우면 앱 글자도 커진다(DESIGN_SYSTEM §9, MAP R7).
import tokens from "../../../design/tokens.json";

const { color, radius, size, space, typography, motion, state, z, border } = tokens;
const COLOR_GROUPS = ["neutral", "semantic", "forest", "service"] as const;
// 시안의 중립색 이름(web/js/tokens.js NEUTRAL_NAMES)
const NEUTRAL_NAMES: Record<string, string> = {
  bg: "bg",
  surface: "surface",
  "surface-raised": "raised",
  border: "border",
  "border-strong": "border-strong",
  text: "text",
  "text-muted": "muted",
  "text-subtle": "subtle",
  focus: "focus"
};

function hasLight(value: unknown): value is { light: string } {
  return typeof value === "object" && value !== null && typeof (value as { light?: unknown }).light === "string";
}

const rem = (px: number): string => `${px / 16}rem`;
const pct = (value: number): string => `${Math.round(value * 1000) / 10}%`;

function lightEntries(group: Record<string, unknown>): Array<[string, string]> {
  return Object.entries(group).flatMap(([name, value]) => (hasLight(value) ? [[name, value.light] as [string, string]] : []));
}

/** 앱 이름의 변수. DOM과 떼어 두어 시험한다. */
function appVars(vars: Record<string, string>): void {
  for (const group of COLOR_GROUPS) {
    for (const [name, value] of lightEntries(color[group] as Record<string, unknown>)) vars[`--${group}-${name}`] = value;
  }
  // 감정 색(계열마다 50~900 단계). `label`·`source` 같은 글 칸은 뺀다.
  for (const [code, scale] of Object.entries(color.emotion as Record<string, Record<string, unknown>>)) {
    for (const [step, value] of Object.entries(scale)) {
      if (/^\d+$/.test(step) && typeof value === "string") vars[`--emotion-${code}-${step}`] = value;
    }
  }
  vars["--font-sans"] = typography.family.sans;
  for (const [name, spec] of Object.entries(typography.scale)) {
    vars[`--text-${name}-size`] = rem(spec.size);
    vars[`--text-${name}-line`] = rem(spec.line);
    vars[`--text-${name}-weight`] = String(spec.weight);
  }
  for (const [name, value] of Object.entries(space)) vars[`--space-${name}`] = `${value}px`;
  for (const [name, value] of Object.entries(radius)) {
    if (typeof value === "number") vars[`--radius-${name}`] = `${value}px`;
  }
  for (const [name, value] of Object.entries(size)) {
    if (typeof value === "number") vars[`--size-${name}`] = `${value}px`;
  }
}

/** 시안 이름의 변수 — web/js/tokens.js applyTokens와 같은 규칙. */
function mockupVars(vars: Record<string, string>): void {
  const set = (name: string, value: string | number) => {
    vars[`--${name}`] = String(value);
  };
  for (const [key, value] of lightEntries(color.neutral)) set(NEUTRAL_NAMES[key] ?? key, value);
  for (const [key, value] of lightEntries(color.semantic)) set(key, value);
  for (const [key, value] of lightEntries(color.service)) set(`service-${key}`, value);
  for (const [key, value] of lightEntries(color.forest)) set(`forest-${key}`, value);
  for (const [key, value] of lightEntries(color.land)) set(`land-${key}`, value);
  for (const [key, value] of lightEntries(color.paper)) set(key, value);
  for (const [key, value] of lightEntries(color.login)) set(`login-${key}`, value);

  const usage = color["emotion-usage"];
  const overrides = usage["accent-override"] as Record<string, { light?: string } | string>;
  for (const [key, steps] of Object.entries(color.emotion as Record<string, Record<string, unknown>>)) {
    const step = (name: string) => String(steps[name] ?? "");
    for (const [name, value] of Object.entries(steps)) if (/^\d+$/.test(name) && typeof value === "string") set(`${key}-${name}`, value);
    const override = overrides[key];
    const accent = typeof override === "object" && override.light ? override.light : usage["category-accent"].light;
    set(`${key}-accent`, step(accent));
    set(`${key}-chip-fill`, step(usage["chip-fill"].light));
    set(`${key}-chip-border`, step(usage["chip-border"].light));
    set(`${key}-chip-text`, step(usage["chip-text"].light));
  }

  set("font", typography.family.sans);
  for (const [name, scale] of Object.entries(typography.scale)) {
    set(`fs-${name}`, rem(scale.size));
    set(`lh-${name}`, rem(scale.line));
    set(`fw-${name}`, scale.weight);
  }
  const hero = typography.scale.hero;
  set("lh-hero-ratio", (hero.line / hero.size).toFixed(4));
  for (const [name, value] of Object.entries(space)) set(`sp-${name}`, `${value}px`);
  set("radius", `${radius.control}px`);
  set("radius-card", `${radius.card}px`);
  set("radius-sheet", `${radius.sheet}px`);
  set("radius-chip", `${radius.chip}px`);
  set("radius-blob", radius.blob);
  set("touch", `${size["touch-target-min"]}px`);
  set("content-max", `${size["content-max-width"]}px`);
  set("nav-h", `${size["bottom-nav-height"]}px`);
  set("hairline", `${border.hairline}px`);
  set("emphasis", `${border.emphasis}px`);
  set("dur-fast", `${motion.duration.fast}ms`);
  set("dur-base", `${motion.duration.base}ms`);
  set("dur-slow", `${motion.duration.slow}ms`);
  set("light-in", `${motion.light.in}ms`);
  set("light-hold", `${motion.light.hold}ms`);
  set("light-out", `${motion.light.out}ms`);
  set("stone-rock", `${motion.stone.rock}ms`);
  set("stone-hop", `${motion.stone.hop}ms`);
  set("stone-flood", `${motion.stone.flood}ms`);
  set("stone-flood-reduced", `${motion.stone.reducedFlood}ms`);
  set("ease", motion.easing);
  set("spring", motion["easing-spring"]);
  set("z-sticky", z.sticky);
  set("z-nav", z["bottom-nav"]);
  set("z-sheet", z.sheet);
  set("z-toast", z.toast);
  const { pressed, disabled } = state;
  set("press-pill", pressed["pill-scale"]);
  set("press-row", pressed["row-scale"]);
  set("press-row-overlay", pct(pressed["row-overlay"]));
  set("press-reduced", pct(pressed["reduced-overlay"]));
  set("press-reduced-ink", pct(pressed["reduced-overlay-on-ink"]));
  set("dis-surface", pct(disabled["surface-mix"]));
  set("dis-content", pct(disabled["content-mix"]));
}

/** 토큰을 `--이름: 값` 모음으로 펼친다(앱 이름 + 시안 이름). DOM과 떼어 두어 시험한다. */
export function tokenVars(): Record<string, string> {
  const vars: Record<string, string> = {};
  appVars(vars);
  mockupVars(vars);
  return vars;
}

export function applyTokens(root: HTMLElement = document.documentElement): void {
  for (const [name, value] of Object.entries(tokenVars())) root.style.setProperty(name, value);
}
