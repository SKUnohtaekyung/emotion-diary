// 디자인 시스템 검사(D-097·D-098). check-harness.mjs가 불러 quick에서 돌린다.
// ① 기본 부품 명세: docs/design-system/components/*.md가 CHECKLIST의 A~O 절을 모두 갖고,
//    머리의 '**상태: 결정 대기 N건**'이 본문의 '**결정 대기 <항목><번호>' 개수와 같아야 한다(빈칸·세지 않은 결정을 막는다).
// ② 인벤토리 §1(사용 중인 기본 부품)이 가리키는 부품 파일이 실제로 있어야 한다.
// ③ 시안 CSS의 토큰 밖 값: 색 리터럴과 '비활성을 투명도로 흐리게'(D-098 ②)를 새로 들이지 않는다.
//    지금 남아 있는 것은 CSS_EXCEPTIONS에 이유와 함께 적는다. 예외가 가리키는 글이 파일에서 사라지면
//    '낡은 예외'로 실패한다 — 고친 뒤 목록도 줄인다.

const SECTIONS = "ABCDEFGHIJKLMNO".split("");
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

export function checkComponentSpecs(specs) {
  const failures = [];
  for (const [name, text] of Object.entries(specs)) {
    for (const letter of SECTIONS) {
      if (!new RegExp(`^## ${letter}\\. `, "m").test(text)) failures.push(`부품 명세 ${name}: '## ${letter}.' 절이 없다`);
    }
    const head = text.match(/\*\*상태: 결정 대기 (\d+)건[^*]*\*\*/);
    if (!head) { failures.push(`부품 명세 ${name}: '**상태: 결정 대기 N건**' 머리가 없다`); continue; }
    const body = (text.match(/\*\*결정 대기 [A-O]\d+/g) ?? []).length;
    if (Number(head[1]) !== body) failures.push(`부품 명세 ${name}: 머리의 결정 대기 ${head[1]}건 ≠ 본문 ${body}건`);
  }
  return failures;
}

export function checkInventoryFiles(inventoryText, existingNames) {
  const used = inventoryText.split(/^## 2\./m)[0];
  const named = [...used.matchAll(/`components\/([a-z0-9-]+\.md)`/g)].map((m) => m[1]);
  return [...new Set(named)].filter((name) => !existingNames.includes(name)).map((name) => `INVENTORY가 가리키는 부품 명세 components/${name}이 없다`);
}

export const CSS_EXCEPTIONS = [
  { file: "welcome.css", includes: "linear-gradient(to bottom,#000 50%", reason: "마스크의 알파만 쓰는 #000 — 색이 화면에 나오지 않는다" },
  { file: "film.css", includes: "rgba(9, 35, 40, .28)", reason: "달력 조약돌 배지 그림자의 ink 리터럴 — 토큰화 대기(INVENTORY §4)" }
];

// 못 쓰는 상태를 나타내는 선택자: 비활성 속성, 달력의 미래 날짜, 꺼져서 못 쓰는 줄(is-dim).
const UNAVAILABLE_SELECTOR = /disabled|\.future\b|is-dim/;

const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;
const OPACITY_NOT_ONE = /(^|;)\s*opacity\s*:\s*(?!1\s*(;|$))/;

export function checkWebCss(cssFiles, exceptions = CSS_EXCEPTIONS) {
  const failures = [];
  for (const [file, raw] of Object.entries(cssFiles)) {
    const text = stripComments(raw);
    const allowed = (rule) => exceptions.some((e) => e.file === file && rule.includes(e.includes));
    // 가장 안쪽 규칙(선택자 { 선언 })만 본다 — @media 안의 규칙도 이 형태로 잡힌다.
    for (const match of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = match[1].trim().replace(/\s+/g, " ");
      const body = match[2];
      const rule = `${selector}{${body.trim()}`;
      if (COLOR_LITERAL.test(body) && !allowed(rule)) failures.push(`web/css/${file}: '${selector}'에 색 리터럴이 있다 — 토큰(var(--…))을 쓴다`);
      if (UNAVAILABLE_SELECTOR.test(selector) && OPACITY_NOT_ONE.test(body.trim()) && !allowed(rule)) failures.push(`web/css/${file}: '${selector}'가 비활성을 투명도로 흐린다 — D-098 ②(바탕에서 만든 색)를 쓴다`);
    }
  }
  for (const e of exceptions) {
    if (cssFiles[e.file] !== undefined && !stripComments(cssFiles[e.file]).includes(e.includes)) {
      failures.push(`낡은 CSS 예외: web/css/${e.file}에 '${e.includes}'가 더는 없다 — scripts/check-design-system.mjs의 CSS_EXCEPTIONS에서 지운다`);
    }
  }
  return failures;
}

// ④ 부품 층 토큰(tokens.json component)이 가리키는 기초 토큰 경로가 실제로 있어야 한다.
//    '@74%'(섞는 비율), '(바탕)'(설명), '-*'(묶음) 꼬리는 떼고 본다.
const TOKEN_REFERENCE = /^(color|space|radius|typography|size|z|state|motion)\./;

export function checkComponentTokens(tokens) {
  const failures = [];
  const resolve = (reference) => {
    const clean = reference.replace(/@\d+%$/, "").replace(/\(.*\)$/, "").replace(/-\*$/, "");
    let current = tokens;
    for (const segment of clean.split(".")) {
      if (current == null || typeof current !== "object") return false;
      if (current[segment] === undefined) {
        // 'row-*'처럼 묶음을 가리키면 그 접두의 키가 하나라도 있으면 된다.
        return reference.endsWith("-*") && Object.keys(current).some((key) => key.startsWith(segment));
      }
      current = current[segment];
    }
    return true;
  };
  const walk = (node, where) => {
    for (const [key, value] of Object.entries(node)) {
      if (value && typeof value === "object") walk(value, `${where}.${key}`);
      else if (typeof value === "string" && TOKEN_REFERENCE.test(value) && !resolve(value)) failures.push(`tokens ${where}.${key}이 없는 토큰 '${value}'를 가리킨다`);
    }
  };
  if (tokens.component) walk(tokens.component, "component");
  return failures;
}

// check-harness.mjs에서 부른다. exists/read/list는 검사 루트 기준 함수다.
export function checkDesignSystem({ exists, read, list }) {
  const failures = [];
  if (exists("web/css")) {
    const cssFiles = {};
    for (const name of list("web/css").filter((n) => n.endsWith(".css"))) cssFiles[name] = read(`web/css/${name}`);
    failures.push(...checkWebCss(cssFiles));
  }
  if (exists("design/tokens.json")) failures.push(...checkComponentTokens(JSON.parse(read("design/tokens.json"))));
  if (exists("docs/design-system/components")) {
    const specs = {};
    for (const name of list("docs/design-system/components").filter((n) => n.endsWith(".md"))) specs[name] = read(`docs/design-system/components/${name}`);
    failures.push(...checkComponentSpecs(specs));
    if (exists("docs/design-system/INVENTORY.md")) failures.push(...checkInventoryFiles(read("docs/design-system/INVENTORY.md"), Object.keys(specs)));
  }
  return failures;
}
