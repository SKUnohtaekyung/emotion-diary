// 달력·기록 상세·통계·설정. 저장이 없으므로 지난 날의 내용은 전부 지어낸 예시이고 화면에 그렇게 적는다.
// 달력·통계·설정은 밝은 바탕에 원래 하단 탐색(ink 알약+민트 blob)이다(D-070, 2026-09-22 사용자 정정). 큰 달 제목·나의 돌·진입 연출로 오늘 화면과 짜임을 맞춘다. 기록 상세(편지 읽기)는 껍데기(위쪽 단추·제목)만 여기 있고 바탕은 letter-scene.css가 맡는다.
import { el, svgEl, protoButton, announce, toast, renderStatus, reducedMotion } from "../dom.js";
import { data, friendImg, category, pebbleImg } from "../data.js";
import { state, toISO, formatDate, resetDraft, editCompleted, discardDraft } from "../state.js";
import { STATUS, dayStatus, sampleRecord, effectiveToday } from "../sample.js";
import { dayCell } from "../components/day.js";
import { renderLetter } from "../components/letter.js";
import { openSheet } from "../components/sheet.js";

const recordOf = (iso) => state.completed?.date === iso ? state.completed : sampleRecord(iso);
const shortDay = (iso) => `${Number(iso.slice(5, 7))}월 ${Number(iso.slice(8, 10))}일`;
// 미리보기 카드의 날짜 줄(D-088 ①): "9월 25일 (목)" — 요일까지 적어 카드 안에서 바로 읽힌다. aria-label 등 기존 자리는 shortDay(요일 없음)를 그대로 쓴다.
const shortDayWeekday = (iso) => `${shortDay(iso)} (${WEEKDAYS7[parseISO(iso).getDay()]})`;
const friendsRow = (cats, size = 54) => el("span", { class: "friend-row" }, cats.map((c) => friendImg(c, { size, label: false })));
const chev = (dir) => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d: dir < 0 ? "M14.5 5.5 8 12l6.5 6.5" : "M9.5 5.5 16 12l-6.5 6.5" }));
// 재작업 2회차(D-088) 아이콘 셋 — 선 두께 2.4·둥근 끝으로 .cal-arrow와 같은 말투다.
const expandGlyph = () => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d: "M7 10l5-5 5 5" }), svgEl("path", { d: "M7 14l5 5 5-5" })); // 위아래로 벌어지는 두 꺾쇠('펼쳐 읽기' 알약)
const closeIcon = () => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d: "M6 6l12 12M18 6 6 18" })); // × (닫기)
const openIcon = () => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d: "M7 17 17 7M9 7h8v8" })); // ↗ 바깥으로 열기('크게 보기')
// 재작업 4회차(D-090 ①, 리뷰어 지적 — 문 폭이 원본과 달랐다) 미리보기 버튼 줄 아이콘. 집은 index.html 하단 탐색 '오늘' 아이콘의 ic-line 경로를 그대로 쓴다
// (거기서도 fill:none;stroke:currentColor로 그리는 닫힌 윤곽선이라 손으로 다시 그리지 않고 같은 d 값을 옮긴다).
const homeGlyph = () => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d: "M12 4 4 10.4V20h4.5v-6h7v6H20v-9.6z" })); // 집(오늘 화면으로)
const pencilGlyph = () => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d: "M4 20l4.2-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20zM13.5 7.5l3 3" })); // 연필(components/letter.js의 pencil()과 같은 경로, 이어서 쓰기)
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const sameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime();
const weekDatesOf = (d) => { const start = addDays(d, -d.getDay()); return Array.from({ length: 7 }, (_, i) => addDays(start, i)); };
const WEEKDAYS7 = ["일", "월", "화", "수", "목", "금", "토"];
// "2026-13-45" 같은 값은 Date가 다음 달·해로 넘겨 버리므로 되돌린 값과 비교해 걸러낸다(A2 완료 기준 8).
const parseISO = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? ""); if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]), date = new Date(y, mo - 1, d);
  return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d ? date : null; };
// 접힘·펼침 사이 높이를 부드럽게 잇는다(write.css .detail-stage::before와 같은 방식). 움직임 줄이기에서는 즉시 바뀐다.
function foldTransition(container, rebuild) {
  if (reducedMotion()) { rebuild(); return; }
  const before = container.getBoundingClientRect().height;
  rebuild();
  const after = container.scrollHeight;
  container.style.height = `${before}px`; container.style.overflow = "hidden";
  void container.offsetHeight;
  container.style.transition = "height 320ms ease";
  requestAnimationFrame(() => { container.style.height = `${after}px`; });
  container.addEventListener("transitionend", function done(ev) {
    if (ev.target !== container) return;
    container.removeEventListener("transitionend", done);
    container.style.removeProperty("height"); container.style.removeProperty("overflow"); container.style.removeProperty("transition");
  });
}
// 줄 노트 한 줄(D-090 ①) — 글자를 span(.cal-pv-txt)으로 감싸 CSS의 align-items:flex-end(줄 아래 정렬)에서도 줄임말(ellipsis)이 그대로 된다.
const pvLine = (text, cls = "") => el("p", { class: `cal-pv-ln${cls}` }, el("span", { class: "cal-pv-txt", text }));
// 미리보기 = 내용만큼의 쪽지(D-090 ①, 재작업 4회차 — 남는 높이를 채우려고 늘어나지 않는다. .cal-preview는 이제 flex:none이라 내용이 카드 크기를 그대로 정하고,
// 종이 아래 남는 자리는 JS가 손대지 않아도 그냥 흰 화면으로 남는다). 하단 탐색(.bottom-nav)은 sticky bottom:0이라 문서가 길어져도 늘 뷰포트 아래에 붙어 있으므로,
// 완료한 날(lines 있음)만 남는 실제 높이(탐색 위 끝 − 종이 위 끝, 안전 여백 12px)를 재서 있었던 일 이하 후보를 몇 줄까지 더할지(n) 정한다 — 못 얹는 뒤엣것은
// 아예 그리지 않는다(빈 줄로 채우지 않는다). 임시저장·오늘·지난 빈 날(lines 없음)은 줄 수가 이미 고정이라 잴 것이 없다.
// 있었던 일(lines[0], 굵은 첫 줄)은 D-088 ①이 미리보기에 두기로 정한 줄이라 예산이 모자라도 뺄 수 없다 — 재작업 1회차 리뷰어 지적(360×640 회귀):
// n을 0으로 내림하면 완료한 날인데 아무 글도 안 보이는 결과가 됐다. 그래서 n은 최소 1이고, 그 탓에 종이가 탐색 아래로 길어지면(overhead+1줄이 예산을 넘으면)
// 그대로 둔다 — .app min-height:100dvh가 페이지를 늘리고(D-088 ④가 허용), scrollPanelIntoView(날짜를 고를 때)와 평범한 페이지 스크롤로 버튼 줄까지 닿을 수 있다.
function fitPreviewCard(card, lines) {
  if (!card || !lines) return;
  const nav = document.querySelector(".bottom-nav");
  const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16; // 글자 확대(rem)에도 줄 간격과 같이 커진다
  const lh = rootPx * 2; // 2rem — 종이 줄 높이(.cal-pv-ln)와 반드시 같은 값
  card.querySelectorAll(".cal-pv-ln:not(.cal-pv-row1):not(.cal-pv-row2)").forEach((p) => p.remove()); // 다시 잴 때는 먼저 지운다(뷰포트·글꼴 변화 대응)
  const overhead = card.getBoundingClientRect().height; // 아직 있었던 일 이하 줄이 없는 카드 높이(날짜·조약돌+이름·버튼 줄·종이 padding을 모두 포함)
  const budget = nav ? nav.getBoundingClientRect().top - card.getBoundingClientRect().top - 12 : Infinity;
  const n = Math.max(1, Math.min(lines.length, Math.floor((budget - overhead) / lh)));
  const btnRow = card.querySelector(".cal-pv-btnrow");
  for (const l of lines.slice(0, n)) card.insertBefore(pvLine(l.text, `${l.bold ? " b" : ""}${l.muted ? " muted" : ""}`), btnRow ?? null);
}
// 줄 노트에 얹을 후보 줄을 모으는 데 쓴다(letter.js의 같은 이름 도우미와 같은 규칙 — 빈 칸도 온전이라 채운 것만 줄로 얹는다, D-055).
const nonblank = (list) => list.filter((t) => t.trim());
// 요일 전체 판을 다시 그리지 않고 판(panel) 안 내용만 잇는 연속 전환(D-088 ③) — 미리보기↔편지에 같은 view-transition-name(cal-pv-morph, CSS)을 준다.
// 지원하지 않는 브라우저는 짧은 페이드로 대신한다. 움직임 줄이기에서는 paintPanel이 이 함수를 부르지 않고 즉시 바꾼다.
function panelTransition(panel, run) {
  if (document.startViewTransition) { document.startViewTransition(run); return; }
  panel.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: "ease" }).finished.then(() => {
    run();
    panel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: "ease" });
  }).catch(run);
}

// ── 달력(A2, D-088): 날짜를 눌러도 한 달은 그대로 두고, 달 아래 남는 자리에 그날 편지의 미리보기가 올라온다.
// '펼쳐 읽기'를 누르면 그 자리에서 미리보기가 편지 카드로 펼쳐지고 달은 그 주 한 줄로 줄어든다(D-080 ①의 '누르면 바로 한 주로 접힘'을 대체). ──
export function renderCalendar(main, navigate, params) {
  const qs = params instanceof URLSearchParams ? params : new URLSearchParams();
  const globalStatus = qs.get("s"), dParam = qs.get("d");
  if ((globalStatus === "loading" || globalStatus === "error") && !dParam) { // 달력 전체 불러오기 상태. 날짜(d)가 있으면 편지 자리만(아래 panelContentFor)
    const screen = el("div", { class: "screen calendar" }, el("div", { class: "tb-body" },
      el("h1", { tabindex: "-1", text: "달력" }),
      renderStatus({ kind: globalStatus, onRetry: globalStatus === "error" ? () => navigate("calendar") : undefined })));
    main.replaceChildren(screen);
    screen.querySelector("h1").focus({ preventScroll: true });
    return;
  }
  const emptyMode = globalStatus === "empty";
  const today = effectiveToday(); // 달력의 '오늘'은 new Date()가 아니라 하루 기준 시각(새벽 4시)을 반영한다(D-081)
  const statusOf = (date) => { const raw = dayStatus(date, today); return emptyMode && raw !== "future" ? "none" : raw; }; // QA ?s=empty: 미래를 뺀 모든 날을 기록 없음으로
  const initialDate = parseISO(dParam);
  // folded: 이제 "날짜를 골랐다"가 아니라 "편지를 펼쳐 읽는 중"만 뜻한다(D-088) — 한 달 격자는 folded일 때만 그 주로 줄어든다.
  let year, month, selectedIso, folded;
  if (initialDate && startOfDay(initialDate) <= startOfDay(today)) {
    year = initialDate.getFullYear(); month = initialDate.getMonth(); selectedIso = toISO(initialDate);
    folded = qs.get("read") === "1" && statusOf(initialDate) === "completed"; // 주소로 read=1을 직접 열어도 같은 펼친 상태가 된다
  } else {
    year = today.getFullYear(); month = today.getMonth(); selectedIso = null; folded = false;
  }

  // ── 뼈대: 한 번만 만들고 이후에는 각 자리만 다시 그린다 ──
  const prevBtn = el("button", { type: "button", class: "cal-arrow" }, chev(-1));
  const nextBtn = el("button", { type: "button", class: "cal-arrow" }, chev(1));
  const titleKicker = el("span", { class: "tb-kicker" });
  const titleBig = el("span", { class: "cal-big" });
  const h1 = el("h1", { tabindex: "-1", class: "cal-title" }, prevBtn, el("span", { class: "cal-title-text" }, titleKicker, " ", titleBig), nextBtn);
  const protoNote = el("p", { class: "proto-note" }, el("span", { class: "proto-tag", text: "시안" }),
    el("span", { text: emptyMode ? " 마음을 남기면 여기에 쌓여요." : " 오늘을 뺀 날짜의 상태와 내용은 지어낸 예시입니다." }));
  const weekHead = el("div", { class: "cal-head", "aria-hidden": "true" }, WEEKDAYS7.map((w) => el("span", { text: w })));
  const gridWrap = el("div", { class: "cal-grid-wrap" });
  // 펼친 상태의 위쪽 줄(D-088 ③, 재작업 2회차 — 밑줄 링크 대신 아이콘 버튼): 왼쪽 44px 원형 닫기(.cal-arrow) · 가운데 '…의 편지'+예시 태그 · 오른쪽 '크게 보기' 알약.
  const closeBtn = el("button", { type: "button", class: "cal-arrow cal-close-btn", "aria-label": "한 달 보기로 닫기", onclick: () => closeExpand() }, closeIcon());
  const unfoldName = el("span", { class: "cal-unfold-name" });
  const unfoldTagSlot = el("span", { class: "cal-unfold-tag-slot" });
  const unfoldTitle = el("div", { class: "cal-unfold-title" }, unfoldName, unfoldTagSlot);
  const bigLinkSlot = el("span", { class: "cal-biglink-slot" }); // 완료한 날에만 '크게 보기' 알약이 들어온다(paintPanel)
  const unfoldRow = el("div", { class: "cal-unfold" }, closeBtn, unfoldTitle, bigLinkSlot);
  const panel = el("div", { class: "cal-letter-panel", tabindex: "-1" }); // tabindex: 펼칠 때 이 영역(region)으로 초점을 옮긴다
  const legendItem = (props, text) => el("li", {}, dayCell({ tag: "span", mini: true, "aria-hidden": "true", ...props }), ` ${text}`);
  const legend = el("ul", { class: "legend" }, legendItem({ status: "completed" }, "완료"), legendItem({ status: "draft" }, "임시저장"), legendItem({ status: "none", today: true }, "오늘"), legendItem({ status: "none" }, "기록 없음"));
  const screenRoot = el("div", { class: "screen calendar" }, el("div", { class: "tb-body tb-rise" }, h1, protoNote, weekHead, gridWrap, unfoldRow, panel, legend));
  main.replaceChildren(screenRoot);
  // folded(편지를 펼쳐 읽는 중)면 375×812에서 편지 카드까지 스크롤 없이 들어가도록 달 제목·안내·요일 줄·범례를 줄인다(D-080 실측을 그대로 물려받는다).
  // previewing(한 달을 보며 날짜만 고른 중)은 범례만 접는다(달·안내·요일 줄은 공간 기억을 위해 그대로 둔다, D-088 근거).
  function paintFold() {
    screenRoot.classList.toggle("folded", folded);
    screenRoot.classList.toggle("previewing", Boolean(selectedIso) && !folded);
  }

  // ── 자리별 다시 그리기 ──
  function syncURL() { history.replaceState(null, "", `#/calendar${selectedIso ? `?d=${selectedIso}${folded ? "&read=1" : ""}` : ""}`); } // 날짜·주 이동은 지금처럼 replaceState다
  function focusDay(iso) { requestAnimationFrame(() => gridWrap.querySelector(`[data-iso="${iso}"]`)?.focus({ preventScroll: true })); }
  function scrollPanelIntoView() { // 작은 화면(D-088 ④): 미리보기 자리가 화면 밖이면 부드럽게 스크롤한다. 움직임 줄이기에서는 즉시(scrollIntoView의 기본은 auto)
    requestAnimationFrame(() => {
      const r = panel.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) panel.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "nearest" });
    });
  }
  function paintTitle() {
    const rep = folded ? weekDatesOf(parseISO(selectedIso))[3] : new Date(year, month, 15); // 접힌 주는 대표 요일(수)로 달 표시, 펼친 달은 그 달 자체
    titleKicker.textContent = `${rep.getFullYear()}년 달력`; titleBig.textContent = `${rep.getMonth() + 1}월`;
    if (folded) {
      const wk = weekDatesOf(parseISO(selectedIso));
      nextBtn.disabled = startOfDay(addDays(wk[6], 1)) > startOfDay(today);
      prevBtn.setAttribute("aria-label", "이전 주"); nextBtn.setAttribute("aria-label", "다음 주");
    } else {
      nextBtn.disabled = startOfDay(new Date(year, month + 1, 1)) > startOfDay(today);
      prevBtn.setAttribute("aria-label", "이전 달"); nextBtn.setAttribute("aria-label", "다음 달");
    }
    prevBtn.disabled = false;
  }
  function dayProps(date) {
    const iso = toISO(date), status = statusOf(date), isToday = sameDay(date, today);
    return { tag: "button", type: "button", day: date.getDate(), status, today: isToday, disabled: status === "future", "data-iso": iso,
      "aria-label": `${date.getMonth() + 1}월 ${date.getDate()}일${isToday ? ", 오늘" : ""}, ${STATUS[status]}`,
      "aria-current": isToday ? "date" : null, "aria-pressed": String(iso === selectedIso),
      onclick: () => selectDate(iso) };
  }
  function buildMonthGrid() {
    const first = new Date(year, month, 1).getDay(), days = new Date(year, month + 1, 0).getDate();
    const cells = Array.from({ length: first }, () => el("span", { class: "day blank", "aria-hidden": "true" }));
    for (let d = 1; d <= days; d += 1) {
      const slot = first + d - 1; // 줄마다 50ms, 줄 안에서는 12ms 간격으로 튀어 들어온다(CSS tb-pop, --tb-d. 한 번뿐, 움직임 줄이기에서는 없음)
      cells.push(dayCell({ ...dayProps(new Date(year, month, d)), style: { "--tb-d": `${Math.floor(slot / 7) * 50 + (slot % 7) * 12}ms` } }));
    }
    return el("div", { class: "cal" }, cells);
  }
  function buildWeekRow() { return el("div", { class: "cal cal-week" }, weekDatesOf(parseISO(selectedIso)).map((d) => dayCell(dayProps(d)))); }
  // 한 달은 날짜를 골라도 그대로다(D-088 ①) — folded일 때만 그 주로 줄어든다.
  // 날짜 칸이 튀어 들어오는 연출(tb-pop)은 화면에 처음 들어올 때 한 번뿐이다: 두 번째 그리기부터(날짜 고르기·달 넘기기·펼치기/닫기) cal-settled로 끈다(2026-09-25 사용자 요청 — 누를 때마다 달력이 새로 나오는 것처럼 보였다).
  let gridPainted = false;
  function paintGrid() {
    gridWrap.classList.toggle("cal-settled", gridPainted); gridPainted = true;
    gridWrap.replaceChildren(folded ? buildWeekRow() : buildMonthGrid());
  }
  // 미리보기 종이가 하단 탐색 위 실제 남는 높이에 자리 잡도록, 그리고 있었던 일 이하가 몇 줄을 보여줄지 잰다(D-088 ①·④, fitPreviewCard 정의부 설명 참고).
  // 뷰포트가 바뀌거나 글꼴이 늦게 들어와도 다시 잰다.
  function scheduleFit(card, lines) {
    const fit = () => fitPreviewCard(card, lines);
    requestAnimationFrame(fit); document.fonts?.ready.then(fit);
    window.addEventListener("resize", fit);
    // card 자신을 ResizeObserver로 보면 fit()이 끼워 넣는 줄이 스스로를 다시 부르는 되먹임 루프가 생긴다 — 바뀌지 않는 panel(바깥 flex 배분)을 대신 본다.
    new ResizeObserver(fit).observe(panel);
  }
  // 미리보기 = 내용만큼의 쪽지(달 아래 남는 자리, D-090 ① — 재작업 3회차: 종이가 남는 높이를 채우려고 늘어나지 않는다. .cal-preview는 flex:none이라
  // 아래 남는 자리는 다른 틀 없이 흰 화면 그대로다). 모든 줄이 2rem 격자에 맞는다: 1줄 날짜+예시 태그 → (완료만) 2줄 조약돌+이름 → 있었던 일(굵게) → 이유 →
  // 칭찬 → 감사(자리가 되는 만큼, fitPreviewCard가 뒤엣것부터 뺀다) → 버튼 줄(줄 없는 종이 여백, 모든 상태가 같은 작은 잉크 알약 .cal-pv-pill을 오른쪽에 둔다).
  // 완료한 날은 종이 전체가 큰 클릭 대상(Fitts)이고, 키보드는 알약 하나만 Tab 대상이다.
  function buildPreview(iso) {
    const dLabel = shortDay(iso), dLabelFull = shortDayWeekday(iso), date = parseISO(iso), status = statusOf(date);
    let name = dLabel, msg, row2 = null, tag = null, btnRow = null, tailLine = null, lines = null, clickable = false;
    if (status === "completed") {
      const rec = recordOf(iso), isReal = state.completed?.date === iso;
      const cats = rec.cats.filter((c) => rec.emotions.some((e) => e.cat === c));
      const names = cats.map((c) => category(c)?.label).filter(Boolean).join(" · ");
      // 조약돌(약 28px, 줄 안에 들어가게)과 이름을 한 줄에 나란히 — 무광 처리는 letter-scene.css .lt-rp와 같은 필터값. 감정 색으로 넓은 면을 칠하지 않는다(D-053·D-071).
      const pebbles = el("div", { class: "cal-pv-pebbles", "aria-hidden": "true" }, cats.map((c) => pebbleImg(c, { size: 28 })));
      row2 = el("div", { class: "cal-pv-ln cal-pv-row2" }, pebbles, el("span", { class: "cal-pv-names", text: names }));
      // 3줄부터 얹는 순서: 있었던 일(굵게) → 이유 → 칭찬 → 감사. 다 못 얹으면 뒤엣것부터 빠지고, 못 얹은 줄은 그리지 않는다(빈 줄로 채우지 않는다, D-090 ①).
      lines = [{ text: rec.event, bold: true }];
      if (rec.reason) lines.push({ text: rec.reason });
      for (const t of nonblank(rec.praise)) lines.push({ text: t });
      for (const t of nonblank(rec.thanks)) lines.push({ text: t });
      tag = isReal ? null : el("span", { class: "proto-tag cal-pv-tag", text: "예시" });
      // 클릭은 종이(clickable) 전체가 맡고, 알약은 자기 클릭에서 bubbling을 막아(stopPropagation) expand()가 두 번 불리지 않게 한다(그러면 pushState도 두 번 쌓인다).
      btnRow = el("div", { class: "cal-pv-btnrow" },
        el("button", { type: "button", class: "cal-pv-pill", onclick: (ev) => { ev.stopPropagation(); expand(); } }, expandGlyph(), "펼쳐 읽기"));
      clickable = true;
      name = `${dLabel}의 편지 미리보기`; msg = `${dLabelFull}, 완료. 미리보기를 열었어요`;
    } else if (status === "draft") {
      tailLine = pvLine("쓰던 글이 있어요. 이어서 쓸 수 있어요.", " muted");
      // 오른쪽 알약(연필, 이어서 쓰기) + 그 왼쪽의 조용한 글자 버튼(이 글 지우기, 밑줄·테두리 없음) — 둘 다 오른쪽으로 붙는다(D-090 ①).
      btnRow = el("div", { class: "cal-pv-btnrow" },
        el("button", { type: "button", class: "cal-pv-quiet", text: "이 글 지우기", onclick: () => confirmDiscard(iso) }),
        el("button", { type: "button", class: "cal-pv-pill", onclick: () => { if (state.draft.date !== iso) { resetDraft(); state.draft.date = iso; state.draft.event = recordOf(iso).event; } state.step = "date"; navigate("write"); } }, pencilGlyph(), "이어서 쓰기"));
      msg = `${dLabel}, 임시저장. 쓰던 글 안내를 열었어요`;
    } else if (sameDay(date, today)) {
      tailLine = pvLine("오늘의 마음은 오늘 화면에서 남겨요.", " muted");
      btnRow = el("div", { class: "cal-pv-btnrow" },
        el("button", { type: "button", class: "cal-pv-pill", onclick: () => navigate("today") }, homeGlyph(), "오늘 화면으로"));
      msg = `${dLabel}, 오늘`;
    } else {
      // 쓰기 버튼 없음(D-082) — 못 썼다는 말도 쓰지 않는다(SERVICE_WHY 원칙4). 버튼 줄 없음, 안내 한 줄만(SERVICE_WHY §11, 기록하지 않은 날은 실패가 아니다).
      tailLine = pvLine("이 날은 남긴 기록이 없어요.", " muted");
      msg = `${dLabel}, 기록 없음`;
    }
    const row1 = el("div", { class: "cal-pv-ln cal-pv-row1" }, el("span", { class: "cal-pv-date", text: dLabelFull }), tag);
    const card = el("div", { class: `cal-preview${clickable ? " cal-pv-click" : ""}`, onclick: clickable ? () => expand() : null },
      row1, row2, tailLine, btnRow);
    scheduleFit(card, lines);
    return { name, msg, node: card };
  }
  // 펼친 편지(D-088 ③): 기존 달력 인라인 편지(letter.js scene:false)를 그대로 쓴다 — 미리보기와 같은 view-transition-name으로 감싸 그 자리에서 잇는다.
  // centerLabel·centerTag는 펼친 윗줄 가운데(unfoldTitle)에, bigLink는 오른쪽 '크게 보기' 알약 자리(bigLinkSlot)에 들어간다(재작업 2회차).
  function buildExpanded(iso) {
    const dLabel = shortDay(iso), dLabelFull = shortDayWeekday(iso), rec = recordOf(iso), isReal = state.completed?.date === iso;
    const letter = renderLetter(rec, { mode: "read", scene: false, onEdit: () => { editCompleted(rec); navigate("write"); } });
    const bigLink = el("button", { type: "button", class: "cal-big-link", onclick: () => navigate(`record/${iso}`) }, "크게 보기", openIcon());
    return { name: `${dLabel}의 편지`, msg: `${dLabel}, 완료. 편지를 열었어요`, node: el("div", { class: "cal-expand-wrap" }, letter.node),
      bigLink, centerLabel: dLabelFull, // 윗줄 가운데는 날짜만(좁은 폭에서 '…의 편지'가 말줄임으로 잘렸다 — 편지라는 뜻은 region 이름이 맡는다)
      centerTag: isReal ? null : el("span", { class: "proto-tag", text: "예시" }) };
  }
  function paintPanel(opts = {}) {
    const run = () => {
      unfoldRow.hidden = !folded;
      if (!selectedIso) { // 아무 날도 고르지 않음(D-088 ②): 빈 칸 대신 조용한 안내 한 줄
        panel.removeAttribute("role"); panel.removeAttribute("aria-label");
        panel.replaceChildren(el("div", { class: "cal-pv-empty" }, el("p", { class: "cal-pv-hint", text: "날짜를 누르면 그날의 편지를 볼 수 있어요" })));
        unfoldName.textContent = ""; unfoldTagSlot.replaceChildren(); bigLinkSlot.replaceChildren();
        opts.onDone?.(); return;
      }
      if (globalStatus === "loading" || globalStatus === "error") { // ?d=…&s=…: 달력은 정상, 편지 자리만 불러오기·오류(완료 기준 10)
        const dLabel = shortDay(selectedIso);
        panel.setAttribute("role", "region"); panel.setAttribute("aria-label", dLabel);
        panel.replaceChildren(renderStatus({ kind: globalStatus, onRetry: globalStatus === "error" ? () => navigate(`calendar?d=${selectedIso}`) : undefined }));
        unfoldName.textContent = ""; unfoldTagSlot.replaceChildren(); bigLinkSlot.replaceChildren();
        announce(`${dLabel}, 불러오는 중`); opts.onDone?.(); return;
      }
      const useExpanded = folded && statusOf(parseISO(selectedIso)) === "completed";
      const { name, msg, node, bigLink, centerLabel, centerTag } = useExpanded ? buildExpanded(selectedIso) : buildPreview(selectedIso);
      panel.setAttribute("role", "region"); panel.setAttribute("aria-label", name);
      panel.replaceChildren(node);
      unfoldName.textContent = centerLabel ?? "";
      unfoldTagSlot.replaceChildren(...(centerTag ? [centerTag] : []));
      bigLinkSlot.replaceChildren(...(bigLink ? [bigLink] : []));
      announce(msg); opts.onDone?.();
    };
    if (opts.instant || reducedMotion()) { run(); return; } // 움직임 줄이기에서는 즉시 바뀐다(D-088 ③)
    panelTransition(panel, run);
  }
  function confirmDiscard(iso) {
    openSheet({ title: "이 글을 지울까요?", body: [el("p", { text: "쓰던 글을 지우면 되돌릴 수 없어요." })], danger: true,
      primary: { text: "지우기", onclick: () => confirmDiscard2(iso) }, secondary: { text: "그대로 두기" } });
  }
  function confirmDiscard2(iso) {
    openSheet({ title: "정말 지울까요?", body: [el("p", { text: `${shortDay(iso)}에 쓰던 글이 사라져요.` })], danger: true,
      primary: { text: "지우기", onclick: () => { discardDraft(iso); toast("쓰던 글을 지웠어요"); paintGrid(); paintPanel({ instant: true }); } }, secondary: { text: "그만두기" } });
  }
  // 날짜를 고른다(D-088 ①) — 한 달은 그대로 두고 미리보기만 바꾼다. 펼침은 오직 '펼쳐 읽기'(expand)로만 들어간다.
  function selectDate(iso) {
    selectedIso = iso; folded = false;
    paintFold();
    syncURL(); paintTitle(); paintGrid(); paintPanel({ instant: true }); focusDay(iso); scrollPanelIntoView();
    gridWrap.querySelector(`[data-iso="${iso}"]`)?.classList.add("cal-wiggle"); // 누른 날짜만 살짝 흔들린다(CSS cal-wiggle, 움직임 줄이기에서는 없음)
  }
  // 그 자리에서 펼친다(D-088 ③): pushState라 브라우저 뒤로 가기가 닫기가 된다(popstate·hashchange → main.js가 이 화면을 새로 그려 접힌 채로 돌아온다).
  // 날짜 바꾸기(주 이동)는 그 안에서 replaceState로 남는다.
  function expand() {
    if (!selectedIso || statusOf(parseISO(selectedIso)) !== "completed") return;
    folded = true;
    history.pushState(null, "", `#/calendar?d=${selectedIso}&read=1`);
    paintFold();
    paintTitle(); foldTransition(gridWrap, paintGrid);
    paintPanel({ onDone: () => panel.focus({ preventScroll: true }) }); // 초점은 편지 영역으로(D-088 ③)
  }
  // 닫기(✕, D-088 ③) — 이 자리에서 바로 접는다(history.back을 쓰지 않는다: main.js의 hashchange 렌더는 화면마다 h1로 초점을 보내
  // '펼쳐 읽기'로 돌아간다는 완료 기준과 어긋난다). pushState로 쌓인 항목은 그대로 남지만 실제 브라우저 뒤로 가기는 별도로 계속 닫기 역할을 한다.
  function closeExpand() {
    folded = false;
    paintFold();
    syncURL(); paintTitle(); foldTransition(gridWrap, paintGrid);
    paintPanel({ onDone: () => panel.querySelector(".cal-pv-pill")?.focus({ preventScroll: true }) }); // 초점은 '펼쳐 읽기'로(D-088 ③)
  }
  function goMonth(delta) {
    month += delta;
    if (month < 0) { month = 11; year -= 1; } else if (month > 11) { month = 0; year += 1; }
    folded = false; selectedIso = null;
    paintFold();
    syncURL(); paintTitle(); paintGrid(); paintPanel({ instant: true });
    requestAnimationFrame(() => h1.focus({ preventScroll: true }));
  }
  // 펼친 상태에서 ‹ ›로 주를 옮긴다(D-088 ③, '펼친 상태에 남는다') — 옮긴 날이 완료가 아니면 그 날의 안내 카드를 같은 접힌 주 안에서 보여 준다.
  function stepWeek(delta) {
    selectedIso = toISO(addDays(parseISO(selectedIso), delta * 7));
    syncURL(); paintTitle(); paintGrid(); paintPanel({ instant: true }); focusDay(selectedIso);
  }
  prevBtn.onclick = () => { folded ? stepWeek(-1) : goMonth(-1); };
  nextBtn.onclick = () => { if (!nextBtn.disabled) (folded ? stepWeek(1) : goMonth(1)); };

  paintFold(); paintTitle(); paintGrid(); paintPanel({ instant: true });
}

// ── 기록 상세 = 편지 읽기(D-063). 저장된 기록을 남길 때 본 편지와 같은 카드로 다시 읽는다. ──
export function renderRecord(main, navigate, params, rest) {
  const today = effectiveToday();
  const raw = rest[0];
  const parsed = raw ? parseISO(raw) : today; // 날짜 없이 #/record로 오면 오늘(하루 기준 시각 반영)
  if (!parsed || startOfDay(parsed) > startOfDay(today)) { // 없는 날짜(예: 2026-13-45)·미래 날짜 주소(완료 기준 8)
    main.replaceChildren(el("div", { class: "screen record" },
      el("div", { class: "info-top" }, el("button", { type: "button", class: "back", "aria-label": "달력으로", onclick: () => navigate("calendar") }, svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d: "M14.5 5.5 8 12l6.5 6.5" })))),
      el("h1", { tabindex: "-1", text: "이 날의 편지가 없어요" }),
      el("div", { class: "stack" }, el("button", { type: "button", class: "btn primary", text: "달력으로", onclick: () => navigate("calendar") }))));
    main.querySelector("h1").focus({ preventScroll: true });
    return;
  }
  const iso = toISO(parsed);
  const s = params?.get("s");
  if (s === "loading" || s === "error") { // 기록 상세(#/record/…?s=…)는 편지 자리에 불러오기·오류(완료 기준 10)
    main.replaceChildren(el("div", { class: "screen record" },
      el("div", { class: "info-top" }, el("button", { type: "button", class: "back", "aria-label": "달력으로", onclick: () => navigate("calendar") }, svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d: "M14.5 5.5 8 12l6.5 6.5" })))),
      el("h1", { tabindex: "-1", text: `${shortDay(iso)}의 편지` }),
      renderStatus({ kind: s, onRetry: s === "error" ? () => navigate(`record/${iso}`) : undefined })));
    main.querySelector("h1").focus({ preventScroll: true });
    return;
  }
  let rec = recordOf(iso), real = state.completed?.date === iso;
  // QA: #/record/<날짜>?n=17&c=sadness — 첫 계열을 c로, 세부 감정을 그 계열의 taxonomy 순서대로 n개(최대치는 계열 전체 개수) 고른 것으로 바꿔 본다. 편지 카드(A1) 표본 검수용이고 저장에는 영향 없다.
  const qaN = Number(params?.get("n")), qaC = params?.get("c");
  if (qaN > 0 && qaC && data.categories.some((c) => c.code === qaC)) {
    const pool = data.categories.find((c) => c.code === qaC).emotions.slice(0, qaN).map((e) => ({ ...e, own: null }));
    rec = { ...rec, cats: [qaC, ...rec.cats.filter((c) => c !== qaC)], emotions: pool, repr: { [qaC]: rec.repr[qaC] ?? 7 } };
    real = false;
  }
  const menu = () => {
    const sh = openSheet({ title: `${shortDay(iso)}의 기록`, secondary: { text: "닫기" }, body: [
      el("button", { type: "button", class: "menu-row", onclick: () => { sh.close(); editCompleted(rec); navigate("write"); } }, el("span", {}, "고치기", el("small", { text: "완료된 기록을 수정해요. 저장하면 분석이 최신이 아니게 될 수 있어요." }))),
      el("button", { type: "button", class: "menu-row", onclick: () => { sh.close(); cancelDone(); } }, el("span", {}, "완료 취소", el("small", { text: "임시저장 상태로 돌려요. 통계와 분석에서 빠져요." }))),
      el("button", { type: "button", class: "menu-row danger", onclick: () => { sh.close(); del1(); } }, el("span", {}, "삭제", el("small", { text: "이 날의 기록을 지워요. 되돌릴 수 없어요." })))] });
  };
  // 완료 취소 뒤에는 그날이 고른 상태(임시저장 안내)로 달력을 연다(A2 §7). 삭제 뒤에는 달력으로 가고 위쪽 토스트로 알린다.
  const cancelDone = () => openSheet({ title: "완료를 취소할까요?", body: [el("p", { text: "이 기록은 임시저장 상태가 되어 통계·분석에서 빠져요. 쓴 내용은 지워지지 않아요." })],
    primary: { text: "완료 취소", onclick: () => { if (real) { state.draft = structuredClone(state.completed); state.completed = null; state.editing = null; announce("완료를 취소했어요. 임시저장 상태예요."); navigate(`calendar?d=${iso}`); } else announce("예시 기록이라 바뀌지 않아요."); } }, secondary: { text: "그대로 두기" } });
  const del1 = () => openSheet({ title: `${shortDay(iso)} 기록을 삭제할까요?`, body: [el("p", { text: "삭제하면 되돌릴 수 없어요. 삭제한 뒤에 되돌리는 버튼도 없어요." })], danger: true,
    primary: { text: "삭제하기", onclick: del2 }, secondary: { text: "그만두기" } });
  const del2 = () => openSheet({ title: "정말 삭제할까요?", body: [el("p", { text: "아래 기록이 영구히 지워져요. 통계와 분석에서도 사라져요." }),
    el("div", { class: "sum-row" }, friendsRow(rec.cats), el("p", { class: "note", text: `${formatDate(iso)} · ${rec.event}` }))], danger: true,
    primary: { text: "삭제하기", onclick: () => { if (real) { state.completed = null; toast(`${shortDay(iso)} 기록을 지웠어요`); navigate("calendar"); } else announce("예시 기록이라 지워지지 않아요."); } }, secondary: { text: "그만두기" } });

  const letter = renderLetter(rec, { mode: "read", onEdit: () => { editCompleted(rec); navigate("write"); } });
  main.replaceChildren(el("div", { class: "screen record" },
    el("div", { class: "info-top" }, el("button", { type: "button", class: "back", "aria-label": "달력으로", onclick: () => navigate("calendar") }, svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d: "M14.5 5.5 8 12l6.5 6.5" }))),
      el("button", { type: "button", class: "back more", "aria-label": "더보기", onclick: menu }, svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "dots3" }, svgEl("circle", { cx: "5", cy: "12", r: "1.7" }), svgEl("circle", { cx: "12", cy: "12", r: "1.7" }), svgEl("circle", { cx: "19", cy: "12", r: "1.7" })))),
    el("h1", { tabindex: "-1", text: `${shortDay(iso)}의 편지` }),
    el("p", { class: "letter-sub", text: real ? "옆으로 넘겨서 다시 읽어요." : "옆으로 넘겨서 다시 읽어요. (지어낸 예시 기록이에요)" }),
    letter.node));
}

// ── 설정(A4, D-081) ──
// PRD 필수인데 시안에 빠졌던 자리(알림 시각·시간대, 하루 기준 시각, 위기 연락처 자리, 내보내기 범위, 접근 끊기)를 채운다.
// 목록 줄은 모두 '이름 · 값 ›' 한 줄이다(setRow) — 접근 끊기만 실제로 시트를 열고, 나머지는 protoButton과 같은 규칙으로 aria-disabled + announce다.
const chevSm = () => { const s = chev(1); s.classList.add("set-chev"); return s; };
function setRow(name, value, announceText) {
  return el("button", { type: "button", class: "set-row", "aria-disabled": "true", "aria-label": `${name}, ${value}`,
    onclick: () => announce(announceText ?? `${name}: 시안이라 동작하지 않습니다`) },
    el("span", { class: "set-row-name", "aria-hidden": "true", text: name }),
    el("span", { class: "set-row-value", "aria-hidden": "true" }, value, chevSm()));
}
function setNote(text) { return el("p", { class: "caption set-note", text }); }

export function renderSettings(main, navigate) {
  const toggle = el("button", { type: "button", class: "switch", role: "switch", "aria-checked": "true", "aria-disabled": "true", "aria-label": "작성 알림", onclick: () => announce("작성 알림: 시안이라 동작하지 않습니다") }, el("i", { "aria-hidden": "true" }));
  // 접근 끊기(로그아웃)는 유일하게 진짜 동작하는 줄이다 — 확인 시트를 열고(sheet.js가 Esc·포커스 가둠·복귀를 맡는다), 로그아웃 자체는 시안 announce다.
  const accessRow = el("button", { type: "button", class: "set-row", "aria-label": "접근 끊기, 로그아웃", onclick: openAccessSheet },
    el("span", { class: "set-row-name", "aria-hidden": "true", text: "접근 끊기" }),
    el("span", { class: "set-row-value", "aria-hidden": "true" }, "로그아웃", chevSm()));
  function openAccessSheet() {
    openSheet({ title: "접근을 끊을까요?", body: [el("p", { text: "로그아웃하면 이 기기에서 다시 로그인해야 기록을 볼 수 있어요." })],
      primary: { text: "로그아웃", onclick: () => announce("로그아웃: 시안이라 동작하지 않습니다") }, secondary: { text: "취소" } });
  }
  main.replaceChildren(el("div", { class: "screen settings" },
    el("div", { class: "tb-body tb-rise" },
      el("h1", { tabindex: "-1", text: "설정" }),
      el("p", { class: "proto-note" }, el("span", { class: "proto-tag", text: "시안" }), " 이 화면의 동작은 자리만 있고 실제로 움직이지 않습니다."),

      el("section", { class: "panel" }, el("h2", { text: "알림" }),
        el("div", { class: "setting-row" }, el("span", {}, "작성 알림 ", el("span", { class: "proto-tag", text: "시안" })), toggle),
        el("p", { class: "caption", text: "앱을 열었을 때 오늘 기록이 없으면 알려 주는 방식부터 시작해요. 푸시 알림은 약속하지 않아요." }),
        setRow("알림 시각", "오후 10시"),
        setNote("이 시각이 지나도 기록이 없으면 오늘 화면에 알려요."),
        setRow("시간대", "기기 시간대"),
        setNote("바꿔도 이미 쓴 기록의 날짜는 바뀌지 않아요.")),

      // 하루 기준 시각(D-081 ②) — 알림과 다른 자리다: 새 기록의 날짜·이어서 쓴 날·통계 기간까지 모두 이 기준을 쓴다. 값은 '새벽 4시'만 두고 나머지는 행 바로 아래 설명 하나로 몬다(중복 방지).
      el("section", { class: "panel" }, el("h2", { text: "하루 기준 시각" }),
        setRow("하루 기준 시각", "새벽 4시"),
        setNote("이 시각 전에는 오늘 날짜를 전날로 봐요. 0~6시 중 고를 수 있고, 이미 쓴 기록의 날짜는 바뀌지 않아요.")),

      el("section", { class: "panel" }, el("h2", { text: "개인정보 안내" }),
        el("p", { class: "note", text: "이 앱은 진단이나 위기 대응 서비스가 아니에요." }),
        // SAFETY_POLICY.md §6 감지 범위(52~53행) 원문 그대로. 위기 연락처 칸을 바로 아래에 둔다('아래 연락처'와 맞춘다).
        el("p", { text: "직접 작성한 일기는 자동으로 분석·감시되지 않으며, 위기 상황에서는 아래 연락처로 직접 연락해 주세요." }),
        // 위기 연락처 정적 칸(검수 전) — 번호는 절대 적지 않는다. 안내 칸이라 중립 테두리(빨강은 영구 삭제에만 남긴다).
        el("div", { class: "set-crisis" }, el("h3", { text: "위기 연락처" }),
          el("p", { class: "note", text: "검수된 연락처가 여기에 들어가요." })),
        // PRD §11·DATA_MODEL §8의 뜻(server-derived owner 검사·API key 비노출·백업 보존 지연)을 개발 용어 없이 사용자 말로 줄인다.
        el("p", { text: "내 기록은 나만 볼 수 있어요." }),
        el("p", { class: "note", text: "지운 기록은 화면에서 바로 사라지지만, 백업에서 완전히 지워지기까지 시간이 걸릴 수 있어요." }),
        el("a", { class: "link help-link", href: "#/help", text: "도움이 필요할 때 보기" }),
        el("a", { class: "link help-link", href: "#/welcome", text: "처음 화면 다시 보기" })),

      el("section", { class: "panel" }, el("h2", { text: "내 기록" }),
        el("div", { class: "stack" }, protoButton("내 기록 내보내기")),
        el("p", { class: "caption", text: "모든 완료·임시저장 기록과 하루 기준 시각 같은 설정, 선택하면 분석 결과가 들어가요." }),
        el("p", { class: "caption", text: "비밀값, 앱 내부 관리용 값, AI 대화 전문은 들어가지 않아요." })),

      el("section", { class: "panel" }, el("h2", { text: "계정" }),
        el("div", { class: "set-list" }, accessRow)),

      el("section", { class: "panel danger-zone" }, el("h2", { text: "영구 삭제" }),
        el("p", { class: "caption", text: "되돌릴 수 없는 동작이라 다른 설정과 떨어뜨려 뒀어요. 실제 앱에서는 확인 문구를 직접 입력해야 해요." }),
        el("div", { class: "stack" }, protoButton("모든 기록 영구 삭제", "btn danger"))))));
}
