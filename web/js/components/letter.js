// 나에게 쓰는 편지(D-063): 검토 단계이자 기록 상세(읽기 모드)다. 닫힌 봉투를 열면 고른 조약돌이 나오고 카드가 올라와 옆으로 넘긴다.
// 카드 템플릿 셋: 감정(감정당 한 장) · 있었던 일과 이유 · 칭찬(감사는 채운 날만 한 장 더). 각 카드의 '고치기' 태그는 그 카드의 입력 단계로 보낸다.
// 스와이프만 두지 않는다 — 이전·다음 화살표와 점을 함께 둔다(WCAG 2.5.1). 움직임 줄이기에서는 봉투 열림 연출 없이 카드가 바로 나온다.
// 크기는 숫자와 열 점으로만 보여 준다. 조약돌 크기·색 농도로 그리지 않는다(D-050).
// 이야기 있는 배경(D-069, 2026-09-24 '마음의 숲 속 빈터'로 재개편 — 아래 31번째 줄 참고): 나에게 쓴 편지를 열기 직전, 숲 속 빈터. 나무 실루엣·빈터 바닥·연필·빛 알갱이는 모두 장식이라 스크린리더에서 뺀다(aria-hidden).
// 위치와 크기는 letter-scene.css가 정한다 — 여기서는 조각을 만들어 놓기만 한다. 색은 전부 CSS 변수다.
// 긴 글: 카드 안의 글 영역(.lt-scroll)은 넘칠 때만 스크롤된다. 넘치는 영역만 키보드로 닿게 tabindex를 준다.
import { el, svgEl, announce, reducedMotion } from "../dom.js";
import { category, FRIENDS, pebbleImg } from "../data.js";
import { formatDate } from "../state.js";

const pencil = () => svgEl("svg", { viewBox: "0 0 24 24", width: "15", height: "15", "aria-hidden": "true", class: "ico" }, svgEl("path", { d: "M4 20l4.2-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20zM13.5 7.5l3 3" }));
const chevron = (dir) => svgEl("svg", { viewBox: "0 0 24 24", width: "18", height: "18", "aria-hidden": "true", class: "ico" }, svgEl("path", { d: dir < 0 ? "M14.5 5.5 8 12l6.5 6.5" : "M9.5 5.5 16 12l-6.5 6.5" }));
const editTag = (label, onEdit, top = 14) => el("button", { type: "button", class: "edit-tag", "aria-label": label, style: { top: `${top}px` }, onclick: onEdit }, el("i", { class: "tape", "aria-hidden": "true" }), pencil(), el("span", { text: "고치기" }));
const nonblank = (list) => list.filter((t) => t.trim());
const shortDate = (iso) => { const d = formatDate(iso); const [y, m, day, w] = [iso.slice(0, 4), Number(iso.slice(5, 7)), Number(iso.slice(8, 10)), d.match(/\((.)\)/)[1]]; return `${y}. ${m}. ${day}. ${w}`; };

function envelope() {
  const body = "M0 0H280V174a16 16 0 0 1-16 16H16A16 16 0 0 1 0 174Z";
  const back = svgEl("svg", { viewBox: "0 0 280 190", class: "env-svg", "aria-hidden": "true" }, svgEl("path", { d: body, class: "e-back" }));
  const front = svgEl("svg", { viewBox: "0 0 280 190", class: "env-svg", "aria-hidden": "true" },
    svgEl("defs", {}, svgEl("clipPath", { id: "envclip" }, svgEl("path", { d: body }))),
    svgEl("g", { "clip-path": "url(#envclip)" },
      svgEl("rect", { width: "280", height: "190", class: "e-body" }),
      svgEl("polygon", { points: "0,0 0,190 150,104", class: "e-fold" }), svgEl("polygon", { points: "280,0 280,190 130,104", class: "e-fold" }),
      svgEl("polygon", { points: "0,190 280,190 140,92", class: "e-fold-light" })),
    (() => { const t = svgEl("text", { x: "140", y: "158", "text-anchor": "middle", class: "e-to" }); t.textContent = "나에게"; return t; })());
  return { back, front };
}

// ── 마음의 숲 속 빈터, 편지를 열기 직전(2026-09-24 배경 재개편 — 사용자 직접 요청, 이전 '길의 끝' 방향을 대체) ──
// 저자극·몰입감: 둥근 나무 실루엣이 겹겹이 둘러싼 빈터 가운데에 봉투가 놓이고, 부드러운 빛이 시선을 모은다. 민트/그린 한 계열, 강한 대비·날카로운 모서리 없음.
// 나무·바탕 그러데이션·비네트는 main(화면 전체 높이·폭)에 CSS 배경 하나로 그린다(letter-scene.css) — SVG를 프레임 폭(360)과 화면 폭(100vw)으로 나눠 겹쳤던 이전 방식은 이음매·옆 흰 띠가 생겨 버렸다(메인 지적).
// 여기(letter.js)는 봉투 자리를 따라가야 하는 것만 만든다: 빈터 바닥(풀밭 타원)·조약돌·빛 알갱이 몇 개.
const px = (n) => `${n}px`;
// 빛 알갱이 4개만(저자극 — 나비·해·해 고리는 없앴다). [가로, 세로(편지 틀 기준) px, 크기 px, 한 바퀴 s, 시작 어긋남 s, 이동 A(x,y), 이동 B(x,y)].
const MOTES = [[58, 104, 14, 12, 0, 4, -5, -4, 3], [312, 108, 14, 13, -6, 3, -5, -5, -1], [18, 320, 13, 12, -8, 5, 5, 5, -4], [346, 336, 13, 13, -4, -5, -3, 5, 4]];
// 그날 고른 계열의 조약돌: "봉투를 눌러 열어요" 캡션 아래 땅 띠에, 가운데를 기준으로 좌우 대칭인 얕은 호로 놓는다(메인 재검수 2026-09-25 — 처음 버전은 캡션을 감싸는 목걸이처럼 읽혀 반려됐다).
// i번째(taxonomy 순, 있는 계열만)를 가운데 기준 슬롯 k = i − (n−1)/2 에 놓는다: 1개면 k=0(가운데 아래, 혼자 가장자리에 있지 않다), 2개면 ±0.5로 대칭, 9개면 −4..4.
// 안쪽(|k| 작음)은 크고 낮게(40~44px), 바깥(|k| 큼)은 작고 살짝 위로(원근). dx는 반지름 합+여백만큼 벌어지는 2차식이라 어느 개수에서도 조약돌끼리 안 겹친다(9개 기준 최대 |dx| 164, 프레임 반폭 180 안).
// dy는 캡션 글자 상자 아래로 늘 ≥12px 떨어진다(64 − 1.75|k| ≥ 56, 여기서 56 = 캡션 아래끝 44 + 여백 12) — 카드가 열려 가려도 된다(이번 완료 기준에서 뺐다, 시선은 카드에 있다).
const arcSlot = (k) => { const ak = Math.abs(k); return { dx: Math.sign(k) * (50 * ak - 2.25 * ak * ak), dy: 86 - ak * 4, size: Math.max(24, 44 - ak * 4.5), r: -k * 2 }; };
const arcPebbles = (cats) => cats.slice(0, 9).map((cat, i, arr) => {
  const k = i - (arr.length - 1) / 2, { dx, dy, size, r } = arcSlot(k), img = pebbleImg(cat, { size });
  img.classList.add("lt-rp"); img.style.setProperty("--r", `${r}deg`);
  const shadow = el("i", { class: "lt-rp-shadow" }), grain = el("i", { class: "lt-rp-grain" });
  // --peb-src(아래 노이즈 결 마스킹용)는 wrap(공통 조상)에 둔다 — img에만 두면 형제인 grain이 상속받지 못해 마스크가 안 걸리고 네모 상자로 보였다(메인 확대 캡처에서 발견, 2026-09-25).
  return el("span", { class: "lt-rp-wrap", style: { "--dx": px(dx), "--dy": px(dy), "--peb-src": `url(${img.src})` } }, shadow, img, grain);
});
// 그리는 순서가 곧 쌓이는 순서다: 빈터 바닥 → 낮 빛(번짐·열리는 순간·카드 둘레) → 빛 알갱이 → 조약돌(맨 앞)
// 연필은 없앴다(코디네이터 최신 완료 기준 "길·해·나비·연필 없음", 2026-09-25) — 이전 회차에 남겨 뒀던 소품이라 다시 확인하며 지웠다.
const sceneLayer = (cats) => el("div", { class: "lt-scene", "aria-hidden": "true" },
  el("i", { class: "lt-floor" }), el("i", { class: "lt-glow" }, el("i")), el("i", { class: "lt-burst" }), el("i", { class: "lt-halo" }),
  MOTES.map(([x, y, s, t, d, ax, ay, bx, by]) => el("i", { class: "lt-mote", style: { "--x": px(x), "--y": px(y), "--s": px(s), "--t": `${t}s`, "--d": `${d}s`, "--ax": px(ax), "--ay": px(ay), "--bx": px(bx), "--by": px(by) } })),
  arcPebbles(cats));

export function renderLetter(record, { mode = "write", onEdit, onOpened } = {}) { // 달력 인라인 갈래(scene:false)는 D-100 ③(달력은 작은 편지 mini-letter.js)으로 쓰는 곳이 없어 2026-09-26 지웠다
  const cats = record.cats.filter((c) => record.emotions.some((e) => e.cat === c));
  const cards = [];
  const CARD_CHIPS = 8, MANY_FROM = 5; // 카드 한 장에 최대 8개(9개부터 이어지는 카드), 5개부터 32px/2열(열마다 최대 4개) — D-079, 2026-09-24 사용자 확정
  const chunk = (arr, n) => Array.from({ length: Math.max(1, Math.ceil(arr.length / n)) }, (_, k) => arr.slice(k * n, k * n + n));
  // 세부 감정 알약: 1~4개는 36px/15px 한 열, 5~8개는 32px/14px 두 열(열마다 최대 4개) — 절대 더 줄이지 않는다(D-079가 이전 D-074 '개수가 늘면 다 같이 줄어든다'를 대체). 크기·자리는 write.css .chips/.chip-col.
  // 두 열은 고르게 나눈다(첫 열 = ceil(n/2)): 5→3+2, 6→3+3, 7→4+3, 8→4+4. 그냥 4개씩 자르면(4+1, 4+2) 오른쪽 열이 외톨이로 떠 보였다(2026-09-24 메인 검수 지적, 이어지는 카드도 같은 규칙).
  const renderChips = (list) => {
    const many = list.length >= MANY_FROM;
    const cols = many ? [list.slice(0, Math.ceil(list.length / 2)), list.slice(Math.ceil(list.length / 2))] : [list]; // 1~4개는 늘 한 열
    return el("div", { class: `chips${many ? " many" : ""}` }, cols.map((col) => el("div", { class: "chip-col" }, col.map((e) => el("span", { text: e.label })))));
  };

  cats.forEach((cat, i) => {
    const full = record.emotions.filter((e) => e.cat === cat), val = record.repr[cat] ?? full.find((e) => e.own != null)?.own ?? "–";
    const parts = chunk(full, CARD_CHIPS); // 9개 이상이면 한 장에 8개씩 '이어지는 카드'를 만든다(D-079 ③)
    parts.forEach((part, pi) => {
      const tint = { "--tint": `var(--${cat}-300)` };
      if (pi === 0) {
        const peb = pebbleImg(cat, { size: part.length >= MANY_FROM ? 80 : 170 }); // 5개 이상이면 조약돌을 작게(D-079 ④) — 실제 크기는 write.css의 .t1:has(.chips.many)가 정한다(A5에서 96→80)
        cards.push({ key: `emotion:${cat}`, label: `${i + 1}번째 마음, ${category(cat).label}`, node: el("article", { class: "card t1", role: "group", style: tint },
          el("p", { class: "lab", text: `마음 ${i + 1} / ${cats.length}` }), editTag(`${category(cat).label} 고치기`, () => onEdit?.(`detail:${cat}`)),
          el("p", { class: "ename", text: category(cat).label }), peb,
          renderChips(part), el("i", { class: "rule" }),
          el("div", { class: "size" }, el("small", { text: "크기" }), el("div", { class: "val" }, el("b", { text: String(val) }), el("em", { text: "/ 10" })),
            el("div", { class: "d10", "aria-hidden": "true" }, Array.from({ length: 10 }, (_, k) => el("i", { class: typeof val === "number" && k < val ? "f" : "" })))),
          el("span", { class: "sr", text: `${FRIENDS[cat].name}, ${category(cat).label}, 크기 ${val}점 만점 10점${parts.length > 1 ? `. 세부 감정이 많아 카드 ${parts.length}장에 나뉘었고 이 카드는 1번째예요` : ""}` })) });
      } else {
        // 이어지는 카드: 첫 카드와 같은 크기·같은 계열 300 면이다(DESIGN_SYSTEM "카드의 크기는 모두 같다"). 크기(강도)는 계열의 값이라 첫 카드에만 둔다.
        cards.push({ key: `emotion:${cat}:${pi}`, label: `${category(cat).label} 이어서 ${pi + 1}/${parts.length}`, node: el("article", { class: "card t1 t1-more", role: "group", style: tint },
          el("p", { class: "lab", text: `${category(cat).label} · 이어서 ${pi + 1}/${parts.length}` }), editTag(`${category(cat).label} 고치기`, () => onEdit?.(`detail:${cat}`)),
          el("div", { class: "t1-more-body" }, el("p", { class: "ename2", text: category(cat).label }), renderChips(part)), // 이름·알약을 한 덩어리로 묶어 가운데(letter-scene.css write.css의 top:50%)에 둔다 — 따로 두면 사이가 붕 뜬 것처럼 보였다
          el("span", { class: "sr", text: `${FRIENDS[cat].name}, ${category(cat).label} 이어서 ${pi + 1}/${parts.length}, 세부 감정 ${part.length}개` })) });
      }
    });
  });
  // 있었던 일과 이유: 줄 노트 종이. 글이 길면 종이(줄과 함께)가 스크롤되고 날짜·테이프는 그대로 있다. 고치기 태그는 자기 소제목 줄에 붙어 함께 움직인다.
  const line = (title, target, label) => el("div", { class: "lt-line" }, el("p", { class: "k", text: title }), editTag(label, () => onEdit?.(target), -4));
  cards.push({ key: "story", label: "있었던 일과 이유", node: el("article", { class: "card t2", role: "group" },
    el("i", { class: "tape big", "aria-hidden": "true" }), el("p", { class: "lab2", text: shortDate(record.date) }),
    el("div", { class: "lt-paper lt-scroll" },
      line("오늘 있었던 일", "date", "있었던 일 고치기"), el("p", { class: "v ev", text: record.event }),
      line("이런 마음이 든 이유", "reason", "이유 고치기"), el("p", { class: "v", text: record.reason }))) });
  for (const [kind, title] of [["praise", "칭찬"], ["thanks", "감사"]]) {
    const items = nonblank(record[kind]);
    if (!items.length) continue; // 비워 둔 날은 그 장을 건너뛴다(D-063, D-055의 '빈 칸도 온전')
    cards.push({ key: kind, label: title, node: el("article", { class: `card t3${items.length > 1 ? " list" : ""}`, role: "group" },
      el("p", { class: "lab3", text: title }), editTag(`${title} 고치기`, () => onEdit?.(kind)),
      el("div", { class: "lt-body lt-scroll" },
        items.length === 1 ? el("p", { class: "q", text: items[0] }) : el("ul", { class: "qs" }, items.map((t) => el("li", { text: t }))),
        el("div", { class: "lt-sign" }, el("p", { class: "sig", text: "— 오늘의 나에게" }), el("i", { class: "seal2", "aria-hidden": "true" })))) });
  }

  const pager = el("div", { class: "pager", tabindex: "0", role: "region", "aria-roledescription": "carousel", "aria-label": "오늘의 편지" }, cards.map((c, i) => { c.node.setAttribute("aria-label", `${i + 1} / ${cards.length}, ${c.label}`); return c.node; }));
  const dots = cards.map(() => el("i"));
  const prev = el("button", { type: "button", class: "ar", "aria-label": "이전 장" }, chevron(-1)), next = el("button", { type: "button", class: "ar", "aria-label": "다음 장" }, chevron(1));
  const nav = el("div", { class: "letter-nav" }, prev, el("div", { class: "dd", "aria-hidden": "true" }, dots), next);

  const { back, front } = envelope();
  const envBtn = el("button", { type: "button", class: "envfront", "aria-label": "편지 봉투 열기" }, front);
  const flap = el("div", { class: "flapwrap" }, el("div", { class: "flap" }, el("div", { class: "f-out" }), el("div", { class: "f-in" }), el("div", { class: "sealw" }, el("i", { class: "seal" }))));
  // 배경은 편지 틀(폭 360px, 높이는 --card-h를 따라간다, D-079)에 붙는 한 겹이다. 틀은 위 글과 아래 버튼 줄 사이의 한가운데에 놓인다(letter-scene.css).
  // 그날 고른 조약돌은 이제 봉투를 열 때 튀어나오는 연출이 아니라 길가에 처음부터 놓여 있다(배경 개편, 2026-09-24) — sceneLayer(cats)가 그린다.
  const stage = el("div", { class: `letter-stage ${mode === "read" ? "opened" : "closed"}` },
    el("div", { class: "lt-frame" }, sceneLayer(cats),
      el("div", { class: "envback" }, back), el("div", { class: "pagerclip" }, pager), envBtn, flap,
      el("p", { class: "envcap", text: "봉투를 눌러 열어요" }), nav));

  const STEP = () => pager.firstElementChild ? pager.firstElementChild.getBoundingClientRect().width + 8 : 336; // +8은 write.css .pager의 gap, 336은 카드 328 + 그 gap(D-079)
  const index = () => Math.round(pager.scrollLeft / STEP());
  // 양 끝 화살표는 disabled가 아니라 aria-disabled다 — 누른 뒤 초점이 사라지지 않는다(D-099 icon-button K1). 모습은 base.css의 바탕에서 만든 색.
  const setOff = (btn, off) => { if (off) btn.setAttribute("aria-disabled", "true"); else btn.removeAttribute("aria-disabled"); };
  // 장이 바뀌면 '3장 중 2장, 칭찬'을 aria-live(polite)로 읽는다(D-099 pager K1). 편지가 열린 뒤에만 — 열 때는 open()이 따로 알린다.
  let spoken = 0;
  const paint = () => {
    const i = index(); dots.forEach((d, k) => d.classList.toggle("on", k === i)); setOff(prev, i === 0); setOff(next, i >= cards.length - 1);
    if (started && i !== spoken && cards[i]) { spoken = i; announce(`${cards.length}장 중 ${i + 1}장, ${cards[i].label}`); }
  };
  pager.addEventListener("scroll", () => requestAnimationFrame(paint), { passive: true });
  const go = (delta) => pager.scrollTo({ left: (index() + delta) * STEP(), behavior: reducedMotion() ? "auto" : "smooth" });
  prev.addEventListener("click", () => { if (prev.getAttribute("aria-disabled") !== "true") go(-1); });
  next.addEventListener("click", () => { if (next.getAttribute("aria-disabled") !== "true") go(1); });
  pager.addEventListener("keydown", (ev) => { if (ev.key === "ArrowRight") { next.click(); ev.preventDefault(); } if (ev.key === "ArrowLeft") { prev.click(); ev.preventDefault(); } });

  // 카드 안의 글 영역: 스크롤하는 동안만 막대가 조금 진해지고(.lt-scrolling), 넘치는 영역만 키보드로 닿는다(tabindex).
  const scrollers = cards.flatMap((c) => [...c.node.querySelectorAll(".lt-scroll")]);
  for (const s of scrollers) {
    let timer = 0;
    s.addEventListener("scroll", () => { s.classList.add("lt-scrolling"); clearTimeout(timer); timer = setTimeout(() => s.classList.remove("lt-scrolling"), 700); }, { passive: true });
  }
  const markScrollers = () => { for (const s of scrollers) { if (s.scrollHeight > s.clientHeight + 1) s.setAttribute("tabindex", "0"); else s.removeAttribute("tabindex"); } };

  let started = mode === "read";
  function open() {
    if (started) return; started = true;
    const done = (message) => { stage.className = "letter-stage opened"; paint(); markScrollers(); announce(message); onOpened?.(); pager.focus({ preventScroll: true }); }; // 봉투가 사라지면 초점이 잃히므로 카드 묶음으로 옮긴다(← → 로 바로 넘긴다)
    if (reducedMotion()) { done(`편지를 열었어요. 카드 ${cards.length}장`); return; }
    stage.className = "letter-stage opening";
    setTimeout(() => done(`편지를 열었어요. 카드 ${cards.length}장, 옆으로 넘겨서 확인해요`), 2400);
  }
  envBtn.addEventListener("click", open);
  requestAnimationFrame(() => { paint(); markScrollers(); document.fonts?.ready.then(markScrollers); }); // 글꼴이 늦게 들어와 글 길이가 바뀌어도 넘침을 다시 본다
  // frame: 달력(tabs.js)이 남는 자리에 맞춰 --card-h를 직접 재설정할 때 쓴다(2026-09-25 — 완료한 날은 미리보기 없이 곧장 이 틀을 연다).
  return { node: stage, open, count: cards.length };
}
