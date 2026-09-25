// 통계 화면(D-064·D-070, 그리고 이번 작업 — 통계 전체를 tabs.js에서 이 모듈로 옮기고 크기 추세를 계열별 small multiples로 다시 짰다).
// tabs.js·tabs.css·tabs-mood.css는 달력 작업자가 쓰는 중이라 읽지 않고 참고만 한다 — 필요한 모양은 여기 sx- 접두어로 새로 만든다.
// 계산은 stats-calc.js(순수 함수, DOM 없음)에 있고 이 파일은 그 결과를 그린다.
import { el, svgEl, announce, renderStatus, reducedMotion } from "../dom.js";
import { data, friendImg, stoneImg, FRIENDS, category } from "../data.js";
import { toISO } from "../state.js";
import { effectiveToday } from "../sample.js";
import { periodDates, periodSummary, currentStreak, topWords, compare, buildSample, buildFewSample, addDays, MIN_DAYS, MIN_N_FOR_MEAN } from "../stats-calc.js";

const CAT_ORDER = () => data.categories.map((c) => c.code);
// 함께한 날(=그 계열이 있는 날) 많은 순, 같으면 taxonomy 선언 순서. 친밀도·크기 추세가 같은 순서를 쓴다(작업 지시).
const rankByTogether = (order, nOf) => order.filter((k) => nOf(k) > 0).sort((a, b) => nOf(b) - nOf(a) || order.indexOf(a) - order.indexOf(b));
const COUNT_KO = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉"];

// ── 친구와의 친밀도(D-064): 모양은 그대로, 표본과 걸음 연출 타이밍만 바꾼다. ──
// 걸음·채움 1200ms(전 400ms), 줄 간격 120ms(전 50ms), 걷는 동안 통통 4번. animate=false면 연출 없이 바로 최종 자리(7/30 전환 시 재생 금지).
function friendshipSection(periodLen, sample, todayIso, animate) {
  const order = CAT_ORDER();
  const dates = periodDates(todayIso, periodLen);
  const s = periodSummary(sample, dates, order);
  const enough = s.recorded >= MIN_DAYS;
  if (!enough) {
    return el("section", { class: "sx-sec" },
      el("h2", { class: "sx-eyebrow", text: "친구와의 친밀도" }),
      el("div", { class: "sx-empty" },
        el("div", { class: "sx-empty-friend" }, friendImg("enjoyment", { size: 72, label: false })),
        el("p", { class: "sx-headline", text: "기록이 더 필요해요" }),
        el("p", { class: "caption", text: `기록이 ${MIN_DAYS}일 이상 쌓이면 친구들과 얼마나 가까웠는지 보여 드려요.` })));
  }
  const nOf = (k) => s.byCat[k].n;
  const ranked = rankByTogether(order, nOf);
  const away = order.filter((k) => nOf(k) === 0);
  const track = (code, i) => el("li", { class: "sx-trk", style: { "--c": `var(--${code}-accent)`, "--p": `${((nOf(code) / s.recorded) * 100).toFixed(1)}`, "--sx-i": String(i) } },
    el("div", { class: "sx-trk-who" }, el("strong", { text: FRIENDS[code].name }), el("span", { text: `${category(code).label} · ${nOf(code)}일` })),
    el("div", { class: "sx-trk-line", role: "img", "aria-label": `${FRIENDS[code].name}, 기록한 ${s.recorded}일 중 ${nOf(code)}일 함께했어요` },
      el("span", { class: "sx-road" }, el("i", { class: "sx-base" }), el("i", { class: "sx-fill" }), el("span", { class: "sx-pos" }, friendImg(code, { size: 62, label: false }))),
      el("span", { class: "sx-me", "aria-hidden": "true" }, stoneImg("rest"))));
  return el("section", { class: "sx-sec" },
    el("h2", { class: "sx-eyebrow", text: "친구와의 친밀도" }),
    el("p", { class: "sx-headline", text: `이번 기간에는 ${COUNT_KO[ranked.length]} 친구가 다녀갔어요` }),
    el("p", { class: "note", text: "함께한 날이 많을수록 나와 가까이 서 있어요." }),
    el("ol", { class: `sx-tracks${animate ? " sx-animate-in" : ""}` }, ranked.map(track)),
    away.length ? el("div", { class: "sx-away" }, el("h3", { text: "이번에는 오지 않았어요" }), el("div", { class: "sx-away-row" },
      away.map((k) => el("div", {}, friendImg(k, { size: 46, label: false }), el("b", { text: FRIENDS[k].name }), el("span", { text: category(k).label }))))) : null,
    el("p", { class: "caption", text: `친밀도는 기록한 ${s.recorded}일 중 그 친구와 함께한 날의 비율이에요. 많고 적음에 좋고 나쁨은 없어요.` }));
}

// ── 크기 추세: 계열마다 따로 작은 차트(small multiples). 섞어서 평균 내지 않는다(SERVICE_WHY §12). ──
const axisLabel = (iso) => { const [, m, d] = iso.split("-"); return `${Number(m)}/${Number(d)}`; };
function axisRow(dates) {
  const parts = [el("span", { text: axisLabel(dates[0]) })];
  if (dates.length > 7) parts.push(el("span", { text: axisLabel(dates[Math.floor((dates.length - 1) / 2)]) }));
  parts.push(el("span", { text: `${axisLabel(dates[dates.length - 1])} 오늘` }));
  return el("div", { class: "sx-axis", "aria-hidden": "true" }, parts);
}
function compareText(cmp, periodLabel) {
  if (!cmp) return null;
  if (cmp.dir === "same") return `지난 ${periodLabel}과 비슷해요`;
  const abs1 = (Math.round(Math.abs(cmp.delta) * 10) / 10).toFixed(1);
  return `지난 ${periodLabel}보다 ${abs1} ${cmp.dir === "up" ? "높아요" : "낮아요"}`;
}
// 아래 줄의 범위 표현(재작업 1회차 — 메인 검수 반영): 값이 하나·둘뿐이면 "범위"라는 말이 어색하다.
// n=1은 값 하나, n=2는 날짜 순(오래된 날 먼저, categorySummary().days가 이미 그 순서다) 그대로 두 값, n≥3인데 최소=최대면 "모두 X", 그 밖엔 기존 "범위 X~Y".
// 1~10 숫자 읽기(일·이·삼…)의 받침 유무로 와/과가 갈린다(2·4·5·9는 모음 끝 "와", 나머지는 받침 있어 "과") — "5와 6"은 맞지만 "6와 5"는 틀리므로 값마다 계산한다.
const WA_GWA = { 1: "과", 2: "와", 3: "과", 4: "와", 5: "와", 6: "과", 7: "과", 8: "과", 9: "와", 10: "과" };
function rangePhrase(c) {
  if (c.n === 1) return { text: `크기 ${c.days[0].v}`, aria: `크기 ${c.days[0].v}` };
  if (c.n === 2) { const [a, b] = [c.days[0].v, c.days[1].v]; return { text: `크기 ${a} · ${b}`, aria: `크기 ${a}${WA_GWA[a]} ${b}` }; }
  if (c.min === c.max) return { text: `모두 ${c.min}`, aria: `모두 ${c.min}` };
  return { text: `범위 ${c.min}~${c.max}`, aria: `범위 ${c.min}에서 ${c.max}` };
}
// 차트 하나(SVG, 높이 약 44px). 기간의 날마다 한 칸, y는 1(아래)~10(위). 빈 날은 점을 두지 않고 선을 끊는다. 모든 점이 상자 안에 들어오도록 r=3.5만큼 여유를 둔다.
function trendSvg(code, dates, cat, ariaLabel) {
  const W = 300, H = 44, xPad = 8, yPad = 8;
  const x = (i) => xPad + (i / (dates.length - 1)) * (W - xPad * 2);
  const y = (v) => H - yPad - ((v - 1) / 9) * (H - yPad * 2);
  const byDate = new Map(cat.days.map((d) => [d.date, d.v]));
  // svgEl()은 el()과 달리 style을 객체로 받지 않는다(dom.js — 속성을 그대로 setAttribute한다) — 문자열로 넘겨야 --dot 커스텀 속성이 실제로 먹는다.
  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class: "sx-chart-svg", role: "img", "aria-label": ariaLabel, style: `--dot: var(--${code}-accent)` });
  svg.append(svgEl("line", { x1: xPad, x2: W - xPad, y1: y(1).toFixed(1), y2: y(1).toFixed(1), class: "sx-grid" }));
  svg.append(svgEl("line", { x1: xPad, x2: W - xPad, y1: y(10).toFixed(1), y2: y(10).toFixed(1), class: "sx-grid" }));
  if (cat.n >= MIN_N_FOR_MEAN) svg.append(svgEl("line", { x1: xPad, x2: W - xPad, y1: y(cat.meanRaw).toFixed(1), y2: y(cat.meanRaw).toFixed(1), class: "sx-mean-line" }));
  let run = [];
  const flush = () => { if (run.length > 1) svg.append(svgEl("polyline", { points: run.map(([i, v]) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" "), class: "sx-line" })); run = []; };
  dates.forEach((iso, i) => { const v = byDate.get(iso); if (v == null) flush(); else run.push([i, v]); });
  flush();
  dates.forEach((iso, i) => { const v = byDate.get(iso); if (v != null) svg.append(svgEl("circle", { cx: x(i).toFixed(1), cy: y(v).toFixed(1), r: 3.5, class: "sx-dot" })); });
  return svg;
}
function trendRow(code, cur, prev, dates, periodLen) {
  const c = cur.byCat[code], cmp = compare(c, prev.byCat[code]);
  const periodLabel = `${periodLen}일`;
  const cmpText = compareText(cmp, periodLabel);
  const statText = c.n >= MIN_N_FOR_MEAN ? `평균 ${c.mean.toFixed(1)} · ${c.n}일` : `${c.n}일 · 평균은 ${MIN_N_FOR_MEAN}일부터`;
  const range = rangePhrase(c);
  let aria = `${FRIENDS[code].name}, ${category(code).label} 크기. 최근 ${periodLen}일 중 ${c.n}일 기록`;
  if (c.n >= MIN_N_FOR_MEAN) aria += `, 평균 ${c.mean.toFixed(1)}`;
  aria += `, ${range.aria}.`;
  if (cmpText) aria += ` ${cmpText}`;
  const footText = [range.text, cmpText].filter(Boolean).join(" · ");
  return el("li", { class: "sx-row" },
    el("div", { class: "sx-row-head" },
      el("div", { class: "sx-row-who" }, friendImg(code, { size: 40, label: false }), el("span", { text: `${FRIENDS[code].name} · ${category(code).label}` })),
      el("div", { class: "sx-row-stat", text: statText })),
    el("div", { class: "sx-chart" }, trendSvg(code, dates, c, aria)),
    el("p", { class: "sx-row-foot", text: footText }));
}
function readingGuide() {
  return el("details", { class: "sx-details" },
    el("summary", { text: "읽는 법" }),
    el("ul", { class: "sx-guide" },
      el("li", { text: "크기는 그날을 돌아보며 스스로 매긴 값이에요. 하루 전체를 그대로 재지는 못해요." }),
      el("li", { text: "기록한 날만 셌어요. 기록하지 않은 날은 0이 아니라 비어 있어요." }),
      el("li", { text: "서로 다른 마음의 크기는 한데 섞어 평균 내지 않아요." }),
      el("li", { text: `평균은 ${MIN_N_FOR_MEAN}일 이상일 때만 보여요. 지난 기간과의 비교는 두 기간 모두 ${MIN_N_FOR_MEAN}일 이상이고, 차이가 1 이상이면서 기록의 흔들림보다 클 때만 '높아요·낮아요'라고 해요. 유난히 높거나 낮았던 기간 다음에는 평소 쪽으로 돌아오기 쉬워요.` })));
}
function sizeTrendSection(periodLen, sample, todayIso) {
  const order = CAT_ORDER();
  const dates = periodDates(todayIso, periodLen);
  const prevDates = periodDates(addDays(todayIso, -periodLen), periodLen);
  const cur = periodSummary(sample, dates, order);
  const prev = periodSummary(sample, prevDates, order);
  if (cur.recorded < MIN_DAYS) {
    // 친밀도 빈 상태와 같은 짜임(headline+캡션 한 줄)으로 맞춘다(재작업 1회차 — 메인 검수 반영).
    return el("section", { class: "sx-sec" }, el("h2", { text: "크기 추세" }),
      el("div", { class: "sx-empty" }, el("p", { class: "sx-headline", text: "기록이 더 필요해요" }), el("p", { class: "caption", text: `기록이 ${MIN_DAYS}일 이상 쌓이면 마음마다 크기를 보여 드려요.` })));
  }
  const ranked = rankByTogether(order, (k) => cur.byCat[k].n);
  return el("section", { class: "sx-sec" },
    el("h2", { text: "크기 추세" }),
    el("p", { class: "caption", text: "마음마다 따로 셌어요. 크기는 1~10이고, 기록한 날만 이어 그려요." }),
    axisRow(dates),
    el("ol", { class: "sx-rows" }, ranked.map((code) => trendRow(code, cur, prev, dates, periodLen))),
    readingGuide());
}

// ── 자주 머문 말: 같은 표본의 기간 상위 5. 모양은 기존과 같다. ──
function wordsSection(periodLen, sample, todayIso) {
  const words = topWords(sample, periodDates(todayIso, periodLen), 5);
  return el("section", { class: "sx-sec" },
    el("h2", { text: "자주 머문 말" }),
    el("p", { class: "caption", text: "세부 감정 기준이에요. 많이 골랐다고 좋거나 나쁜 게 아니에요." }),
    el("div", { class: "sx-pillrow" }, words.map(([w, n]) => el("span", { class: "sx-pill" }, w, el("em", { text: String(n) })))));
}

export function renderStats(main, navigate, params) {
  const sParam = params?.get("s");
  const today = effectiveToday(), todayIso = toISO(today);
  const few = sParam === "few";
  // 표본은 이 화면을 열 때마다(=매 렌더마다) 새로 만든다 — effectiveToday()가 그대로 반영되어야 "오늘이 흐르는" 시안이 된다(고정 캐시 금지).
  const sample = few ? buildFewSample(todayIso, data.categories) : buildSample(todayIso, data.categories);

  const body = el("div", { class: "sx-body" });
  function draw(periodLen, animate) {
    if (sParam === "loading" || sParam === "error") {
      body.replaceChildren(renderStatus({ kind: sParam, onRetry: sParam === "error" ? () => navigate("stats") : undefined }));
      return;
    }
    const order = CAT_ORDER();
    const s = periodSummary(sample, periodDates(todayIso, periodLen), order);
    const streak = currentStreak(sample, todayIso);
    const summary = el("div", { class: "sx-summary" },
      el("div", { class: "sx-tile", "aria-label": `기록한 날 ${s.recorded}일, 최근 ${periodLen}일 중` },
        el("div", { class: "sx-tile-v", "aria-hidden": "true", text: `${s.recorded}일` }),
        el("div", { class: "sx-tile-k", "aria-hidden": "true", text: "기록한 날" }),
        el("div", { class: "sx-tile-note", "aria-hidden": "true", text: `최근 ${periodLen}일 중` })),
      el("div", { class: "sx-tile", "aria-label": `이어서 쓴 날 ${streak}일` },
        el("div", { class: "sx-tile-v", "aria-hidden": "true", text: `${streak}일` }),
        el("div", { class: "sx-tile-k", "aria-hidden": "true", text: "이어서 쓴 날" })));
    body.replaceChildren(summary, friendshipSection(periodLen, sample, todayIso, animate), sizeTrendSection(periodLen, sample, todayIso), wordsSection(periodLen, sample, todayIso));
  }

  const seg = el("div", { class: "segmented", role: "group", "aria-label": "기간" }, [7, 30].map((p) => el("button", { type: "button", "aria-pressed": String(p === 7), text: `최근 ${p}일`,
    onclick: (ev) => { seg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === ev.currentTarget))); draw(p, false); announce(`최근 ${p}일 통계`); } })));
  draw(7, !reducedMotion()); // 화면에 들어올 때 한 번만 걷는다 — 움직임 줄이기에서는 처음부터 최종 자리다.

  main.replaceChildren(el("div", { class: "screen stats-screen" },
    el("h1", { tabindex: "-1", text: "통계" }),
    el("p", { class: "proto-note" }, el("span", { class: "proto-tag", text: "시안" }), " 아래 숫자는 모두 지어낸 예시입니다. 실제 기록을 세지 않습니다."),
    seg, body,
    el("h2", { text: "AI 분석" }), el("p", { class: "note", text: "지금은 제공되지 않아요. 제공되더라도 점수·병명·성격 유형은 보여 주지 않아요." })));
}
