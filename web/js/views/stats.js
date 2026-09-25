// 통계 화면(D-064·D-070·D-086, 그리고 D-091 — '요약 + 친구별 상세'로 다시 짰다: 첫 화면은 친밀도·자주 머문 말만, 크기 추세는 친구 상세로 옮겼다).
// 계산은 stats-calc.js(순수 함수, DOM 없음)에 있고 이 파일은 그 결과를 그린다.
import { el, svgEl, announce, renderStatus, reducedMotion } from "../dom.js";
import { data, friendImg, pebbleImg, stoneImg, FRIENDS, category } from "../data.js";
import { toISO } from "../state.js";
import { effectiveToday } from "../sample.js";
import { periodDates, periodSummary, currentStreak, topWords, topWordsForCategory, valuesByIndex, compare, buildSample, buildFewSample, addDays, MIN_DAYS, MIN_N_FOR_MEAN } from "../stats-calc.js";

const CAT_ORDER = () => data.categories.map((c) => c.code);
// 함께한 날(=그 계열이 있는 날) 많은 순, 같으면 taxonomy 선언 순서. 친밀도 목록의 순서다.
const rankByTogether = (order, nOf) => order.filter((k) => nOf(k) > 0).sort((a, b) => nOf(b) - nOf(a) || order.indexOf(a) - order.indexOf(b));
const COUNT_KO = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉"];
const periodFromParams = (params) => (Number(params?.get("p")) === 30 ? 30 : 7);

// 오른쪽 끝 › (달력·설정의 셰브론과 같은 선 언어 — 24 viewBox, 선 1.8, 둥근 끝·이음, 채움 없음). aria-hidden — 뜻은 감싸는 링크의 aria-label이 맡는다.
const chevIcon = (cls = "sx-chev") => svgEl("svg", { viewBox: "0 0 24 24", class: cls, "aria-hidden": "true" }, svgEl("path", { d: "M9.5 5.5 16 12l-6.5 6.5" }));
const backIcon = () => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d: "M14.5 5.5 8 12l6.5 6.5" }));

// ── 빈 상태(친밀도·자주 머문 말 공용 — 기록이 5일 미만이면 둘을 따로 비우지 않고 하나로 합친다, D-091 ①). ──
function fewEmpty(note) {
  return el("section", { class: "sx-sec" },
    el("div", { class: "sx-empty" },
      el("div", { class: "sx-empty-friend" }, friendImg("enjoyment", { size: 72, label: false })),
      el("p", { class: "sx-headline", text: "기록이 더 필요해요" }),
      el("p", { class: "caption", text: note })));
}

// ── 친구와의 친밀도(D-064): 색 채움 막대를 없애고 회색 길 + 친구 발밑의 계열색 점으로만 위치를 보인다(D-091 ①). 줄 전체가 친구 상세로 가는 링크다. ──
// 걸음 1200ms, 줄 간격 120ms, 걷는 동안 통통 4번. animate=false면 연출 없이 바로 최종 자리(7/30 전환 시 재생 금지). 발밑 점은 친구와 같은 걸음을 탄다.
function friendshipSection(periodLen, sample, todayIso, animate, few) {
  const order = CAT_ORDER();
  const dates = periodDates(todayIso, periodLen);
  const s = periodSummary(sample, dates, order);
  const nOf = (k) => s.byCat[k].n;
  const ranked = rankByTogether(order, nOf);
  const away = order.filter((k) => nOf(k) === 0);
  const track = (code, i) => {
    const href = `#/stats/${code}?p=${periodLen}${few ? "&s=few" : ""}`;
    const ariaLabel = `${FRIENDS[code].name}, 기록한 ${s.recorded}일 중 ${nOf(code)}일 함께했어요. 자세히 보기`;
    return el("li", { class: "sx-trk", style: { "--c": `var(--${code}-accent)`, "--p": `${((nOf(code) / s.recorded) * 100).toFixed(1)}`, "--sx-i": String(i) } },
      el("a", { class: "sx-trk-link", href, "aria-label": ariaLabel },
        el("div", { class: "sx-trk-who", "aria-hidden": "true" }, el("strong", { text: FRIENDS[code].name }), el("span", { text: `${category(code).label} · ${nOf(code)}일` })),
        el("div", { class: "sx-trk-line", "aria-hidden": "true" },
          el("span", { class: "sx-road" }, el("i", { class: "sx-base" }), el("i", { class: "sx-dot-mark" }), el("span", { class: "sx-pos" }, friendImg(code, { size: 62, label: false }))),
          // 나의 돌과 '보기 ›' 알약을 한 묶음(.sx-end)으로 둬 서로의 세로 가운데를 맞춘다.
          // ›만으로는 무엇을 뜻하는지 와닿지 않는다는 지적(2026-09-25)에 설정(§6.16)의 보조 이동 알약과 같은 결로 글자를 더했다.
          el("span", { class: "sx-end" }, el("span", { class: "sx-me" }, stoneImg("rest")), el("span", { class: "sx-view-pill" }, "보기", chevIcon())))));
  };
  return el("section", { class: "sx-sec" },
    el("h2", { class: "sx-eyebrow", text: "친구와의 친밀도" }),
    el("p", { class: "sx-headline", text: `이번 기간에는 ${COUNT_KO[ranked.length]} 친구가 다녀갔어요` }),
    el("p", { class: "note", text: "함께한 날이 많을수록 나와 가까이 서 있어요." }),
    el("ol", { class: `sx-tracks${animate ? " sx-animate-in" : ""}` }, ranked.map(track)),
    el("p", { class: "caption sx-trk-caption", text: `친밀도는 기록한 ${s.recorded}일 중 그 친구와 함께한 날의 비율이에요. 많고 적음에 좋고 나쁨은 없어요.` }),
    away.length ? el("div", { class: "sx-away" }, el("h3", { text: "이번에는 오지 않았어요" }), el("div", { class: "sx-away-row" },
      away.map((k) => el("div", {}, friendImg(k, { size: 46, label: false }), el("b", { text: FRIENDS[k].name }), el("span", { text: category(k).label }))))) : null);
}

// ── 자주 머문 말: 같은 표본의 기간 상위 5. 머리를 친밀도와 같은 모양(eyebrow+headline)으로 맞춘다(D-091 ①). ──
function wordsSection(periodLen, sample, todayIso) {
  const words = topWords(sample, periodDates(todayIso, periodLen), 5);
  if (!words.length) return null;
  return el("section", { class: "sx-sec" },
    el("h2", { class: "sx-eyebrow", text: "자주 머문 말" }),
    el("p", { class: "sx-headline", text: `이번 ${periodLen}일에 자주 고른 말이에요` }),
    el("p", { class: "caption", text: "세부 감정 기준이에요. 많이 골랐다고 좋거나 나쁜 게 아니에요." }),
    el("div", { class: "sx-pillrow" }, words.map(([w, n]) => el("span", { class: "sx-pill" }, w, el("em", { text: String(n) })))));
}

// ── 첫 화면(요약 → 친밀도 → 자주 머문 말) ──
function renderStatsList(main, navigate, params, sample, todayIso, few, sParam) {
  const body = el("div", { class: "sx-body" });
  let periodLen = periodFromParams(params);

  function draw(p, animate) {
    periodLen = p;
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
    const enough = s.recorded >= MIN_DAYS;
    body.replaceChildren(summary, enough
      ? el("div", {}, friendshipSection(periodLen, sample, todayIso, animate, few), wordsSection(periodLen, sample, todayIso))
      : fewEmpty(`기록이 ${MIN_DAYS}일 이상 쌓이면 친구와 얼마나 가까웠는지, 자주 머문 말도 보여 드려요.`));
    history.replaceState(null, "", `#/stats?p=${periodLen}${few ? "&s=few" : ""}`); // 친구 상세에서 ‹로 돌아왔을 때 기간이 이어지도록 주소도 맞춘다(D-091 ①, 쌓지 않음)
  }

  const seg = el("div", { class: "segmented", role: "group", "aria-label": "기간" }, [7, 30].map((p) => el("button", { type: "button", "aria-pressed": String(p === periodLen), text: `최근 ${p}일`,
    onclick: (ev) => { seg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === ev.currentTarget))); draw(p, false); announce(`최근 ${p}일 통계`); } })));
  draw(periodLen, !reducedMotion()); // 화면에 들어올 때 한 번만 걷는다 — 움직임 줄이기에서는 처음부터 최종 자리다.

  main.replaceChildren(el("div", { class: "screen stats-screen" },
    el("h1", { tabindex: "-1", text: "통계" }),
    el("p", { class: "proto-note" }, el("span", { class: "proto-tag", text: "시안" }), " 아래 숫자는 모두 지어낸 예시입니다. 실제 기록을 세지 않습니다."),
    seg, body,
    el("p", { class: "caption sx-ai-note", text: "AI 분석은 지금은 제공되지 않아요. 제공되더라도 점수·병명·성격 유형은 보여 주지 않아요." })));
}

// ══════════════════════════════════════ 친구 상세(#/stats/<계열>?p=7|30, D-091 ②) ══════════════════════════════════════

// 머리: 작은 언덕 위에 선 친구(2026-09-25 사용자 지적 — 감정 안에 들어가면 우리 디자인 시스템이 아닌 것 같다는 지적에 크기 화면 §6.4 '길 위의 친구'와 같은
// 결을 끌어왔다. 1차 재작업 — 메인 재측정: 언덕이 직사각형으로 잘려 '박스 속 박스'로 읽히고, 발밑 회색 반원이 길이 아니라 바위/얼룩으로 읽히고,
// 친구가 언덕 위에 떠 보인다는 지적). slider.js의 실제 장면은 native range·드래그·이정표까지 딸린 컨트롤이라(고쳐 쓰면 §2 소유권을 벗어난다) 여기서는
// 같은 모양·비율만 참고해 정적인 장식 SVG로 새로 그린다 — 언덕 둘(land.hill-far·hill-mid)과 그 사이 길, 그 위에 계열 친구가 그대로 선다(뒤에 면을 깔지 않는다, §3.3).
// 언덕은 화면 패딩(sp-5)을 음수 margin으로 넘겨 폭 전체까지 이어지고(좌우에 수직으로 잘리는 끝이 없다), 아래 끝은 흰 바탕으로 녹아든다(mask-image) —
// '흰 바탕 위에 놓인 장면'으로 읽히게 하고 카드/액자로 읽히지 않게 한다.
const SVG_NS = "http://www.w3.org/2000/svg";
// 발 보정(§6.4 slider.js의 FOOT 표를 옮겨 적는다 — 그 파일은 소유권 밖이라 고치지 않는다. 같은 친구 그림이라 같은 비율로 어긋난다, FOOT_SRC=160 기준).
const FOOT_PAD = { enjoyment: 7, wish: 8, sadness: 13, anger: 18, joy: 18, love: 5, hate: 5, fear: 10, disgust: 13 };
const FOOT_SRC = 160;
// 중심선(d)을 따라 아래 w0에서 위 w1로 좁아지는 길(온보딩 welcome.js·크기 화면 slider.js의 taper()·road()와 같은 방식을 옮겨 적었다 — 두 파일 다
// 고치지 않는다). probe는 길이·접선을 재는 데만 쓰는, 문서에 붙이지 않는 임시 svg다(SVG 기하 질의는 연결 여부와 무관하게 동작한다).
function taperRoad(d, w0, w1) {
  const probe = document.createElementNS(SVG_NS, "svg");
  const pr = document.createElementNS(SVG_NS, "path"); pr.setAttribute("d", d); probe.append(pr);
  const L = pr.getTotalLength(), N = 40, l = [], r = [];
  for (let k = 0; k <= N; k++) {
    const s = (k / N) * L, a = pr.getPointAtLength(s), b = pr.getPointAtLength(Math.min(L, s + 1)), c = pr.getPointAtLength(Math.max(0, s - 1));
    const dx = b.x - c.x, dy = b.y - c.y, n = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * (k / N) ** .75) / 2;
    l.push(`${(a.x - (dy / n) * w).toFixed(1)} ${(a.y + (dx / n) * w).toFixed(1)}`); r.push(`${(a.x + (dy / n) * w).toFixed(1)} ${(a.y - (dx / n) * w).toFixed(1)}`);
  }
  return `M${l.join("L")}L${r.reverse().join("L")}Z`;
}
// 뷰박스는 화면 실제 폭과 무관한 추상 단위다(preserveAspectRatio="none"으로 가로만 늘려 실제 폭에 맞춘다) — 언덕·길의 비례는 항상 같다.
const VB_W = 340, SCENE_H = 200, GROUND = 48, FRIEND_H = 124; // 친구 96→124px(사용자 2026-09-25 '캐릭터 크기 조금 더 키우자'), 장면도 그만큼 높인다(stats.css .sxd-scene 높이와 같아야 한다). // GROUND: 길 끝(발자리)부터 장면 맨 아래까지 보이는 여백
function friendScene(code) {
  // 길은 장면 맨 아래(화면 밖으로 넓게 퍼지는 시작)에서 위로 좁아지며 친구 발밑에서 끝난다 — 끝은 친구 발 아래에 숨는다.
  // 시작점의 접선을 수직으로 둔다(첫 제어점이 시작점과 같은 x) — 넓은 아래쪽(반지름 54)에서 접선이 기울면 수직 성분이 장면 아래 끝을 넘어가
  // 한쪽은 짧고 한쪽은 튀어나온 비뚤어진 밑변이 된다(1차 시도에서 실제로 겪은 문제).
  const roadD = taperRoad(`M${VB_W / 2 - 34} ${SCENE_H}C${VB_W / 2 - 30} ${SCENE_H - 24} ${VB_W / 2 + 16} ${SCENE_H - GROUND + 22} ${VB_W / 2} ${SCENE_H - GROUND}`, 60, 8); // 좁고 굽은 길 — 넓게 퍼진 쐐기는 흰 봉우리로 읽혔다(메인 재측정)
  const svg = svgEl("svg", { viewBox: `0 0 ${VB_W} ${SCENE_H}`, preserveAspectRatio: "none", class: "sxd-scene-svg", "aria-hidden": "true", focusable: "false" },
    svgEl("path", { class: "sxd-scene-hill-far", d: `M0,72 C57,52 113,47 170,56 C227,65 283,56 340,44 L340,${SCENE_H} L0,${SCENE_H} Z` }),
    svgEl("path", { class: "sxd-scene-hill-mid", d: `M0,100 C57,80 113,73 170,82 C227,91 283,80 340,67 L340,${SCENE_H} L0,${SCENE_H} Z` }),
    svgEl("path", { class: "sxd-scene-road", d: roadD }));
  // 친구 발이 실제로 길 끝에 닿게: 그림 파일 자체에서 발이 이미지 박스 아래 끝보다 위에 있는 만큼(FOOT_PAD, 투명 여백)을 덜어내고 앉힌다
  // — 그림 박스의 CSS bottom을 그만큼 낮춰야 "박스 아래 끝에서 footPad만큼 위"인 실제 발이 길 끝(GROUND)에 온다(발 보정 없이 두면 언덕 위에 뜬 것처럼 보인다).
  const footPad = (FOOT_PAD[code] / FOOT_SRC) * FRIEND_H;
  const friend = friendImg(code, { size: FRIEND_H });
  friend.style.bottom = `${(GROUND - footPad).toFixed(1)}px`;
  return el("div", { class: "sxd-scene" }, svg, friend);
}

// 아래 줄의 범위 표현: 값이 하나·둘뿐이면 "범위"라는 말이 어색하다.
// n=1은 값 하나, n=2는 날짜 순(오래된 날 먼저) 그대로 두 값, n≥3인데 최소=최대면 "모두 X", 그 밖엔 "범위 X~Y".
// 1~10 숫자 읽기(일·이·삼…)의 받침 유무로 와/과가 갈린다(2·4·5·9는 모음 끝 "와", 나머지는 받침 있어 "과").
const WA_GWA_N = { 1: "과", 2: "와", 3: "과", 4: "와", 5: "와", 6: "과", 7: "과", 8: "과", 9: "와", 10: "과" };
function rangePhrase(c) {
  if (c.n === 1) return { text: `크기 ${c.days[0].v}`, aria: `크기 ${c.days[0].v}` };
  if (c.n === 2) { const [a, b] = [c.days[0].v, c.days[1].v]; return { text: `크기 ${a} · ${b}`, aria: `크기 ${a}${WA_GWA_N[a]} ${b}` }; }
  if (c.min === c.max) return { text: `모두 ${c.min}`, aria: `모두 ${c.min}` };
  return { text: `범위 ${c.min}~${c.max}`, aria: `범위 ${c.min}에서 ${c.max}` };
}
function statLine(c) {
  if (c.n < MIN_N_FOR_MEAN) return `${c.n}일 · 평균은 ${MIN_N_FOR_MEAN}일부터`;
  return `평균 ${c.mean.toFixed(1)} · ${c.n}일 · ${rangePhrase(c).text}`;
}
function compareText(cmp, periodLabel) {
  if (!cmp) return null;
  if (cmp.dir === "same") return `지난 ${periodLabel}과 비슷해요`;
  const abs1 = (Math.round(Math.abs(cmp.delta) * 10) / 10).toFixed(1);
  return `지난 ${periodLabel}보다 ${abs1} ${cmp.dir === "up" ? "높아요" : "낮아요"}`;
}
const axisLabel = (iso) => { const [, m, d] = iso.split("-"); return `${Number(m)}/${Number(d)}`; };
// 날짜 축에 보일 인덱스: 7일 이하는 처음·끝(오늘), 그보다 길면 처음·가운데·끝(오늘)도 더한다.
function axisIndices(n) { return n <= 7 ? [0, n - 1] : [0, Math.floor((n - 1) / 2), n - 1]; }

// "9월 25일 금요일"(오늘이면 "오늘 · 9월 25일") — formatDate()의 "2026년 9월 25일 (금)"보다 가볍다. (아래 열 점 기둥의 스크린리더 목록과
// '함께한 날'이 함께 쓴다 — 함수를 sizeTrendDetail보다 앞으로 옮겼다.)
const WEEKDAYS_FULL = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
function dayLine(iso, todayIso) {
  const [y, m, d] = iso.split("-").map(Number);
  if (iso === todayIso) return `오늘 · ${m}월 ${d}일`;
  return `${m}월 ${d}일 ${WEEKDAYS_FULL[new Date(y, m - 1, d).getDay()]}`;
}

// 크기 추세(D-050·D-086·2026-09-25 재개편): 큰 선 차트 대신 편지 카드의 '숫자와 열 점'(§6.14)과 같은 말로 — 날마다 점 열 개가 선 기둥 하나,
// 그날 크기만큼 아래부터 계열 강조색으로 채운다. 축 숫자(1·5·10)·점선 평균선·범례·읽는 법 접기·지난 기간 겹침은 없앴다(사용자 결정).
// 비교 문장(지난 기간보다 높다/낮다/비슷하다)은 글 한 줄로만 남긴다. host 폭을 재는 SVG가 아니라 flex 열이라 DOM에 붙기 전에도 완성해 그릴 수 있다.
function sizeTrendDetail(code, cur, prev, dates, sample, periodLen, todayIso) {
  const periodLabel = `${periodLen}일`;
  const cmp = compare(cur, prev);
  const cmpText = compareText(cmp, periodLabel);
  const curByIdx = valuesByIndex(sample, dates, code);
  const small = dates.length > 7; // 30일은 점을 줄여 폭 안에 넣는다
  const axisSet = new Set(axisIndices(dates.length));
  const cols = dates.map((iso, i) => {
    const v = curByIdx[i];
    const filled = v == null ? 0 : Math.round(v); // 그날 크기가 여럿이면 평균 — 점은 반올림한 개수만큼 채운다(UX_SPEC)
    const dots = Array.from({ length: 10 }, (_, k) => el("i", { class: k < filled ? "f" : "" }));
    const label = axisSet.has(i) ? (i === dates.length - 1 ? `${axisLabel(iso)} 오늘` : axisLabel(iso)) : "";
    return el("div", { class: `sxd-col-wrap${v == null ? " empty" : ""}` },
      el("div", { class: "sxd-col" }, dots), el("span", { class: "sxd-col-axis", "aria-hidden": "true", text: label }));
  });
  // 친구는 사용자의 글에 반응하지 않고 마음의 주인도 아니다(UX_SPEC) — 계열을 주어로 둔다("설이, 슬픔 크기"처럼 친구 이름을 앞세우지 않는다).
  let chartAria = `${category(code).label} 크기, 날마다 채운 점 개수가 그날 크기예요. 최근 ${periodLen}일 중 ${cur.n}일 기록`;
  if (cur.n >= MIN_N_FOR_MEAN) chartAria += `, 평균 ${cur.mean.toFixed(1)}`;
  chartAria += `, ${rangePhrase(cur).aria}.`;
  if (cmpText) chartAria += ` ${cmpText}`;
  // 날마다 값을 스크린리더가 읽을 수 있는 목록(색·점 개수만으로 전달하지 않는다, DESIGN_SYSTEM §3.3).
  const dayList = el("ul", { class: "sr" }, dates.map((iso, i) => el("li", { text: `${dayLine(iso, todayIso)}: ${curByIdx[i] != null ? `크기 ${curByIdx[i]}` : "기록 없음"}` })));
  // 상세의 세 섹션 머리를 같은 모양(h2 제목 하나)으로 통일한다.
  return el("section", { class: "sx-sec" },
    el("h2", { text: `${category(code).label}의 크기` }),
    el("p", { class: "sxd-stat-line", text: statLine(cur) }),
    cmpText ? el("p", { class: "sxd-cmp-line", text: cmpText }) : null,
    el("div", { class: `sxd-cols${small ? " small" : ""}`, role: "img", "aria-label": chartAria, style: { "--dot": `var(--${code}-accent)` } }, cols),
    dayList);
}

function wordsDetail(code, sample, dates) {
  const words = topWordsForCategory(sample, dates, code, 8);
  if (!words.length) return null;
  // '자주 머문 말'의 중립 pill(첫 화면, 여러 계열)과 달리 여기는 한 계열뿐이라 감정 chip(§6.3.1: fill 100/border 300/text 900, 왼쪽 계열 점)이다
  // — 2026-09-25 사용자 지적: 감정 안에 들어가면 우리 디자인 시스템을 안 쓴 것 같다는 지적에 표시용 chip 규칙을 그대로 가져왔다.
  const vars = { "--chip-fill": `var(--${code}-chip-fill)`, "--chip-border": `var(--${code}-chip-border)`, "--chip-text": `var(--${code}-chip-text)`, "--dot": `var(--${code}-accent)` };
  // "설이와 고른 말"은 친구가 함께 고른 것처럼 읽힌다 — 계열을 주어로("슬픔에서 고른 말").
  return el("section", { class: "sx-sec" },
    el("h2", { text: `${category(code).label}에서 고른 말` }),
    el("div", { class: "sxd-chiprow" }, words.map(([w, n]) => el("span", { class: "sxd-chip", style: vars },
      el("i", { class: "sxd-chip-dot", "aria-hidden": "true" }), el("span", { class: "sxd-chip-label", text: w }), el("em", { class: "sxd-chip-count", text: String(n) })))));
}

// 함께한 날: 줄 앞에 그날의 조약돌(달력 칸과 같은 그림, data.js pebbleImg) — 하이라인 구분선과 ›를 빼고, 줄 전체가 링크임은 눌림 면(설정 §6.16의
// .st-row 눌림 결과 같은 규칙)으로 알린다. 2026-09-25 사용자 지적으로 옛 구분선 목록에서 바꿨다.
function togetherDaysDetail(code, cur, todayIso) {
  if (!cur.n) return null;
  const rows = [...cur.days].reverse().map((d) => el("a", { class: "sxd-day-row", href: `#/calendar?d=${d.date}` },
    pebbleImg(code, { size: 28 }), el("span", { class: "sxd-day-date", text: dayLine(d.date, todayIso) }), el("span", { class: "sxd-day-size", text: `크기 ${d.v}` })));
  return el("section", { class: "sx-sec" }, el("h2", { text: "함께한 날" }), el("div", { class: "sxd-days" }, rows));
}

function renderFriendDetail(main, navigate, params, code, sample, todayIso, few) {
  let periodLen = periodFromParams(params);
  const screen = el("div", { class: "screen sxd-screen" });

  function draw(p) {
    periodLen = p;
    const order = CAT_ORDER();
    const dates = periodDates(todayIso, periodLen);
    const prevDates = periodDates(addDays(todayIso, -periodLen), periodLen);
    const s = periodSummary(sample, dates, order);
    const enough = s.recorded >= MIN_DAYS;
    const cur = s.byCat[code];
    const prev = periodSummary(sample, prevDates, order).byCat[code];

    let bodyNode;
    if (!enough) {
      bodyNode = el("div", { class: "sx-empty" },
        el("p", { class: "sx-headline", text: "기록이 더 필요해요" }),
        el("p", { class: "caption", text: `기록이 ${MIN_DAYS}일 이상 쌓이면 ${category(code).label}의 크기와 함께한 날을 보여 드려요.` }));
    } else if (cur.n === 0) {
      bodyNode = el("div", { class: "sx-empty" }, el("p", { class: "sx-headline", text: "이번 기간에는 오지 않았어요" }));
    } else {
      bodyNode = el("div", {}, sizeTrendDetail(code, cur, prev, dates, sample, periodLen, todayIso), wordsDetail(code, sample, dates), togetherDaysDetail(code, cur, todayIso));
    }
    const sub = enough ? `${category(code).label} · 최근 ${periodLen}일 중 ${cur.n}일 함께했어요` : category(code).label;

    screen.replaceChildren(
      el("div", { class: "info-top" }, el("button", { type: "button", class: "back", "aria-label": "통계로", onclick: () => navigate(`stats?p=${periodLen}${few ? "&s=few" : ""}`) }, backIcon())),
      el("div", { class: "sxd-head" }, friendScene(code), el("h1", { tabindex: "-1", text: FRIENDS[code].name }), el("p", { class: "sxd-sub", text: sub })),
      seg, el("div", { class: "sxd-body" }, bodyNode));
    history.replaceState(null, "", `#/stats/${code}?p=${periodLen}${few ? "&s=few" : ""}`); // 기간 전환은 쌓지 않는다(D-091 ②)
  }

  const seg = el("div", { class: "segmented", role: "group", "aria-label": "기간" }, [7, 30].map((p) => el("button", { type: "button", "aria-pressed": String(p === periodLen), text: `최근 ${p}일`,
    onclick: (ev) => { seg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === ev.currentTarget))); draw(p); announce(`최근 ${p}일 통계`); } })));

  main.replaceChildren(screen); // 빈 screen을 먼저 문서에 붙이고 draw()가 그 안을 채운다(열 점 기둥은 flex라 폭을 따로 재지 않는다).
  draw(periodLen);
}

export function renderStats(main, navigate, params, rest = []) {
  const sParam = params?.get("s");
  const today = effectiveToday(), todayIso = toISO(today);
  const few = sParam === "few";
  // 표본은 이 화면을 열 때마다(=매 렌더마다) 새로 만든다 — effectiveToday()가 그대로 반영되어야 "오늘이 흐르는" 시안이 된다(고정 캐시 금지).
  const sample = few ? buildFewSample(todayIso, data.categories) : buildSample(todayIso, data.categories);
  const code = rest?.[0];
  if (code && CAT_ORDER().includes(code)) { renderFriendDetail(main, navigate, params, code, sample, todayIso, few); return; }
  renderStatsList(main, navigate, params, sample, todayIso, few, sParam);
}
