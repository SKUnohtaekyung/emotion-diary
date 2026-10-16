// 디자인 토큰을 CSS 변수로 심는다(T3 A-11). 정본은 design/tokens.json 하나이고 여기서 값을 복제하지 않는다.
// light 값만 쓴다 — 다크 모드는 뼈대 범위 밖이다. 값은 CSSOM(setProperty)으로만 넣는다(CSP가 style 속성을 막는다).
import { color, radius, size, space, typography } from "../../../design/tokens.json";

const COLOR_GROUPS = ["neutral", "semantic", "forest", "service"] as const;

function hasLight(value: unknown): value is { light: string } {
  return typeof value === "object" && value !== null && typeof (value as { light?: unknown }).light === "string";
}

/** 토큰을 `--이름: 값` 모음으로 펼친다. DOM과 떼어 두어 시험한다. */
export function tokenVars(): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const group of COLOR_GROUPS) {
    for (const [name, value] of Object.entries(color[group] as Record<string, unknown>)) {
      if (hasLight(value)) vars[`--${group}-${name}`] = value.light;
    }
  }
  // 감정 색(계열마다 50~900 단계) — 평면 작성 화면의 작은 표지·선택 알약이 쓴다(TASK-SLICE-01 PLAN A-4). `label`·`source` 같은 글 칸은 뺀다.
  for (const [code, scale] of Object.entries(color.emotion as Record<string, Record<string, unknown>>)) {
    for (const [step, value] of Object.entries(scale)) {
      if (/^\d+$/.test(step) && typeof value === "string") vars[`--emotion-${code}-${step}`] = value;
    }
  }
  vars["--font-sans"] = typography.family.sans;
  for (const [name, spec] of Object.entries(typography.scale)) {
    vars[`--text-${name}-size`] = `${spec.size}px`;
    vars[`--text-${name}-line`] = `${spec.line}px`;
    vars[`--text-${name}-weight`] = String(spec.weight);
  }
  for (const [name, value] of Object.entries(space)) vars[`--space-${name}`] = `${value}px`;
  for (const [name, value] of Object.entries(radius)) {
    if (typeof value === "number") vars[`--radius-${name}`] = `${value}px`;
  }
  for (const [name, value] of Object.entries(size)) {
    if (typeof value === "number") vars[`--size-${name}`] = `${value}px`;
  }
  return vars;
}

export function applyTokens(root: HTMLElement = document.documentElement): void {
  for (const [name, value] of Object.entries(tokenVars())) root.style.setProperty(name, value);
}
