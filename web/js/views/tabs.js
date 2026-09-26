// 달력·기록 상세(통계는 stats.js, 설정은 settings.js — D-091). 저장이 없으므로 지난 날의 내용은 전부 지어낸 예시이고 화면에 그렇게 적는다.
// 달력(과 통계·설정)은 밝은 바탕에 원래 하단 탐색(ink 알약+민트 blob)이다(D-070, 2026-09-22 사용자 정정). 큰 달 제목·나의 돌·진입 연출로 오늘 화면과 짜임을 맞춘다. 기록 상세(편지 읽기)는 껍데기(위쪽 단추·제목)만 여기 있고 바탕은 letter-scene.css가 맡는다.
import { el, svgEl, announce, toast, renderStatus, reducedMotion } from "../dom.js";
import { data, friendImg } from "../data.js";
import { state, toISO, formatDate, resetDraft, editCompleted, discardDraft } from "../state.js";
import { STATUS, dayStatus, sampleRecord, effectiveToday } from "../sample.js";
import { dayCell } from "../components/day.js";
import { renderLetter } from "../components/letter.js";
import { renderMiniLetter } from "../components/mini-letter.js";
import { openSheet } from "../components/sheet.js";

const recordOf = (iso) => state.completed?.date === iso ? state.completed : sampleRecord(iso);
const shortDay = (iso) => `${Number(iso.slice(5, 7))}월 ${Number(iso.slice(8, 10))}일`;
// 미리보기 카드의 날짜 줄(D-088 ①): "9월 25일 (목)" — 요일까지 적어 카드 안에서 바로 읽힌다. aria-label 등 기존 자리는 shortDay(요일 없음)를 그대로 쓴다.
const shortDayWeekday = (iso) => `${shortDay(iso)} (${WEEKDAYS7[parseISO(iso).getDay()]})`;
const friendsRow = (cats, size = 54) => el("span", { class: "friend-row" }, cats.map((c) => friendImg(c, { size, label: false })));
const chev = (dir) => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d: dir < 0 ? "M14.5 5.5 8 12l6.5 6.5" : "M9.5 5.5 16 12l-6.5 6.5" }));
// 재작업 2회차(D-088) 아이콘 셋 — 선 두께 2.4·둥근 끝으로 .cal-arrow와 같은 말투다.
const closeIcon = () => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d: "M6 6l12 12M18 6 6 18" })); // × (닫기)
// '펼쳐 읽기'·'크게 보기' 알약은 2026-09-25에 없앴다 — expandGlyph·openIcon도 함께 지웠다. 완료한 날은 지금 작은 편지(D-100 ③)다.
// 재작업 4회차(D-090 ①, 리뷰어 지적 — 문 폭이 원본과 달랐다) 미리보기 버튼 줄 아이콘. 집은 index.html 하단 탐색 '오늘' 아이콘의 ic-line 경로를 그대로 쓴다
// (거기서도 fill:none;stroke:currentColor로 그리는 닫힌 윤곽선이라 손으로 다시 그리지 않고 같은 d 값을 옮긴다).
const homeGlyph = () => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d: "M12 4 4 10.4V20h4.5v-6h7v6H20v-9.6z" })); // 집(오늘 화면으로)
const pencilGlyph = () => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d: "M4 20l4.2-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20zM13.5 7.5l3 3" })); // 연필(components/letter.js의 pencil()과 같은 경로, 이어서 쓰기)
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const sameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime();
const WEEKDAYS7 = ["일", "월", "화", "수", "목", "금", "토"];
// "2026-13-45" 같은 값은 Date가 다음 달·해로 넘겨 버리므로 되돌린 값과 비교해 걸러낸다(A2 완료 기준 8).
const parseISO = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? ""); if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]), date = new Date(y, mo - 1, d);
  return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d ? date : null; };
// 줄 노트 한 줄(D-090 ①) — 글자를 span(.cal-pv-txt)으로 감싸 CSS의 align-items:flex-end(줄 아래 정렬)에서도 줄임말(ellipsis)이 그대로 된다.
const pvLine = (text, cls = "") => el("p", { class: `cal-pv-ln${cls}` }, el("span", { class: "cal-pv-txt", text }));
// fitPreviewCard·nonblank(줄 수를 남는 높이에 맞추던 쪽지 계산)는 2026-09-25에 지웠다. buildPreview는 임시저장·오늘·기록 없음만 맡고, 완료한 날은 작은 편지(buildMini, D-100 ③)다.
// 요일 전체 판을 다시 그리지 않고 판(panel) 안 내용만 잇는 연속 전환(D-088 ③) — 미리보기↔편지에 같은 view-transition-name(cal-pv-morph, CSS)을 준다.
// 지원하지 않는 브라우저는 짧은 페이드로 대신한다. 움직임 줄이기에서는 paintPanel이 이 함수를 부르지 않고 즉시 바꾼다.
function panelTransition(panel, run) {
  // 2026-09-25부터 날짜를 고를 때마다(완료·임시저장·오늘·기록 없음 모두) 이 전환을 거치므로 전보다 자주, 더 빠르게 잇달아 불린다 — 앞 전환이
  // 안 끝난 채 다음이 시작되면 브라우저가 앞 것을 AbortError/InvalidStateError로 걷어차는데, 원래 아무도 그 reject를 받지 않아 콘솔에 처리되지
  // 않은 거부로 남았다(헤드리스로 날짜를 빠르게 연이어 눌러 발견). 걷어차인 전환은 새 전환이 대신 그 자리를 그려 화면은 정상이라 조용히 삼킨다.
  if (document.startViewTransition) {
    const t = document.startViewTransition(run);
    t.ready?.catch(() => {}); t.updateCallbackDone?.catch(() => {}); t.finished?.catch(() => {});
    return;
  }
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
  const isLoadState = (k) => k === "loading" || k === "error" || k === "offline"; // QA ?s= 불러오기 상태. 오류·연결 끊김 모두 '다시 시도'를 준다(D-099 status-block F1)
  if (isLoadState(globalStatus) && !dParam) { // 달력 전체 불러오기 상태. 날짜(d)가 있으면 편지 자리만(아래 panelContentFor)
    const screen = el("div", { class: "screen calendar" }, el("div", { class: "tb-body" },
      el("h1", { tabindex: "-1", text: "달력" }),
      renderStatus({ kind: globalStatus, onRetry: globalStatus !== "loading" ? () => navigate("calendar") : undefined })));
    main.replaceChildren(screen);
    screen.querySelector("h1").focus({ preventScroll: true });
    return;
  }
  const emptyMode = globalStatus === "empty";
  const today = effectiveToday(); // 달력의 '오늘'은 new Date()가 아니라 하루 기준 시각(새벽 4시)을 반영한다(D-081)
  const statusOf = (date) => { const raw = dayStatus(date, today); return emptyMode && raw !== "future" ? "none" : raw; }; // QA ?s=empty: 미래를 뺀 모든 날을 기록 없음으로
  const initialDate = parseISO(dParam);
  // folded: 날짜를 하나라도 골랐다는 뜻이다(2026-09-25 사용자 요청 — 미리보기 단계를 없애고 날짜를 누르면 곧장 그 주로 접힌다. D-088의
  // "펼쳐 읽기를 눌러야 접힌다"를 대체한다). 한 달 격자는 folded일 때만 그 주로 줄어든다.
  let year, month, selectedIso, folded;
  if (initialDate && startOfDay(initialDate) <= startOfDay(today)) {
    year = initialDate.getFullYear(); month = initialDate.getMonth(); selectedIso = toISO(initialDate); folded = true;
  } else {
    year = today.getFullYear(); month = today.getMonth(); selectedIso = null; folded = false;
  }

  // ── 뼈대: 한 번만 만들고 이후에는 각 자리만 다시 그린다 ──
  const prevBtn = el("button", { type: "button", class: "cal-arrow" }, chev(-1));
  const nextBtn = el("button", { type: "button", class: "cal-arrow" }, chev(1));
  const titleKicker = el("span", { class: "tb-kicker" });
  const titleBig = el("span", { class: "cal-big" });
  const h1 = el("h1", { tabindex: "-1", class: "cal-title" }, prevBtn, el("span", { class: "cal-title-text" }, titleKicker, " ", titleBig), nextBtn);
  // 달력 위 시안 안내 상자는 빈 달력(?s=empty)의 안내만 남긴다(D-100 ③) — '지어낸 예시'라는 말은 날짜 줄의 예시 태그와 맨 위 시안 띠가 이미 하고,
  // 그 상자(80px)가 한 달과 작은 편지를 한 화면에 넣을 자리를 먹었다.
  const protoNote = emptyMode ? el("p", { class: "proto-note" }, el("span", { class: "proto-tag", text: "시안" }), el("span", { text: " 마음을 남기면 여기에 쌓여요." })) : null;
  const weekHead = el("div", { class: "cal-head", "aria-hidden": "true" }, WEEKDAYS7.map((w) => el("span", { text: w })));
  const gridWrap = el("div", { class: "cal-grid-wrap" });
  // 날짜를 고른 동안의 위쪽 줄: 왼쪽 원형 닫기(.cal-arrow) · 가운데 날짜+예시 태그 · 오른쪽 ⋯(완료한 날만). '크게 보기' 알약 자리(bigLinkSlot)는 2026-09-25에 지웠다.
  const closeBtn = el("button", { type: "button", class: "cal-arrow cal-close-btn", "aria-label": "한 달 보기로 닫기", onclick: () => closeExpand() }, closeIcon());
  const unfoldName = el("span", { class: "cal-unfold-name" });
  const unfoldTagSlot = el("span", { class: "cal-unfold-tag-slot" });
  const unfoldTitle = el("div", { class: "cal-unfold-title" }, unfoldName, unfoldTagSlot);
  const unfoldMoreSlot = el("span", { class: "cal-unfold-more" }); // 완료한 날일 때만 ⋯(기록 메뉴)가 들어온다(D-096)
  const unfoldRow = el("div", { class: "cal-unfold" }, closeBtn, unfoldTitle, unfoldMoreSlot);
  const panel = el("div", { class: "cal-letter-panel", tabindex: "-1" }); // tabindex: 펼칠 때 이 영역(region)으로 초점을 옮긴다
  const legendItem = (props, text) => el("li", {}, dayCell({ tag: "span", mini: true, "aria-hidden": "true", ...props }), ` ${text}`);
  const legend = el("ul", { class: "legend" }, legendItem({ status: "completed" }, "완료"), legendItem({ status: "draft" }, "임시저장"), legendItem({ status: "none", today: true }, "오늘"), legendItem({ status: "none" }, "기록 없음"));
  const screenRoot = el("div", { class: "screen calendar" }, el("div", { class: "tb-body tb-rise" }, h1, protoNote, weekHead, gridWrap, unfoldRow, panel, legend));
  main.replaceChildren(screenRoot);
  // folded(날짜를 골라 그 주로 접힌 상태)면 375×812에서 카드까지 스크롤 없이 들어가도록 달 제목·안내·요일 줄·범례를 줄인다(D-080 실측을 그대로 물려받는다).
  // 2026-09-25부터 "미리보기만 보며 한 달을 그대로 두는" 중간 상태(previewing)가 없어졌다 — 날짜를 고르면 바로 folded다.
  function paintFold() {
    screenRoot.classList.toggle("folded", folded);
  }

  // ── 자리별 다시 그리기 ──
  function syncURL() { history.replaceState(null, "", `#/calendar${selectedIso ? `?d=${selectedIso}` : ""}`); } // 날짜·주 이동은 지금처럼 replaceState다
  function focusDay(iso) { requestAnimationFrame(() => gridWrap.querySelector(`[data-iso="${iso}"]`)?.focus({ preventScroll: true })); }
  // 날짜를 골라도 화면을 스크롤하지 않는다(D-100 ①) — 한 달이 늘 다 보여야 해서, 편지는 달 아래에서 윗부분만 보이고 나머지는 사용자가 스크롤해 읽는다.
  // (2026-09-25까지는 달을 한 주로 접고 편지가 보이게 올렸다.)
  // 경계에 닿은 화살표는 disabled가 아니라 aria-disabled다 — 초점을 잃지 않고, 모습은 바탕에서 만든 색(base.css, D-099 icon-button K1).
  function setArrowOff(btn, off) { if (off) btn.setAttribute("aria-disabled", "true"); else btn.removeAttribute("aria-disabled"); }
  function paintTitle() {
    titleKicker.textContent = `${year}년 달력`; titleBig.textContent = `${month + 1}월`;
    setArrowOff(nextBtn, startOfDay(new Date(year, month + 1, 1)) > startOfDay(today)); // ‹ ›는 늘 달을 옮긴다(D-100 ①)
    prevBtn.setAttribute("aria-label", "이전 달"); nextBtn.setAttribute("aria-label", "다음 달");
    setArrowOff(prevBtn, false);
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
  // 한 달은 날짜를 골라도 그대로다(D-088 ①) — folded일 때만 그 주로 줄어든다.
  // 날짜 칸이 튀어 들어오는 연출(tb-pop)은 화면에 처음 들어올 때 한 번뿐이다: 두 번째 그리기부터(날짜 고르기·달 넘기기·펼치기/닫기) cal-settled로 끈다(2026-09-25 사용자 요청 — 누를 때마다 달력이 새로 나오는 것처럼 보였다).
  let gridPainted = false;
  function paintGrid() {
    gridWrap.classList.toggle("cal-settled", gridPainted); gridPainted = true;
    gridWrap.replaceChildren(buildMonthGrid()); // 날짜를 골라도 한 달 전체 그대로다(D-100 ① — 2026-09-25의 '그 주 한 줄로 접힘'을 대체)
  }
  // 미리보기 = 내용만큼의 쪽지(달 아래 남는 자리, D-090 ①) — 임시저장·오늘·기록 없음만 맡는다(완료한 날은 아래 buildMini). 날짜·예시 태그는 위 unfoldRow가 보인다.
  function buildPreview(iso) {
    const dLabel = shortDay(iso), dLabelFull = shortDayWeekday(iso), date = parseISO(iso), status = statusOf(date);
    let msg, tailLine, btnRow = null;
    if (status === "draft") {
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
    const card = el("div", { class: "cal-preview" }, tailLine, btnRow);
    return { name: dLabel, msg, node: card, centerLabel: dLabelFull, centerTag: null };
  }
  // 완료한 날 = 작은 편지(D-100 ③, 2026-09-26 사용자 — 한 달을 늘 다 보이면서 스크롤 없이 보려면 휴대폰에서 큰 편지 카드(최소 376px)가
  // 달 아래에 들어가지 않는다. 요약 쪽지를 먼저 해 봤으나 "별로"라서, 편지 모양 그대로 남는 높이에 맞춘 작은 카드로 바꿨다(components/mini-letter.js).
  // 카드 높이 = 탐색 흐림 띠 위까지 남는 높이 − 넘김 줄. 너무 작으면(6줄 달의 아주 작은 화면) 바닥값 132px에서 멈추고 조금 스크롤된다. 큰 화면은 220px에서 멈춘다.
  const ML_NAV = 34, ML_MIN = 132, ML_MAX = 220;
  function miniRoom() {
    const rail = document.querySelector(".bottom-nav-rail"), nav = rail?.parentElement;
    const bottom = rail ? rail.getBoundingClientRect().top - 8 - (parseFloat(getComputedStyle(nav).getPropertyValue("--nav-fade")) || 0) : window.innerHeight;
    return Math.max(ML_MIN, Math.min(ML_MAX, Math.floor(bottom - panel.getBoundingClientRect().top - ML_NAV)));
  }
  function buildMini(iso) {
    const dLabel = shortDay(iso), dLabelFull = shortDayWeekday(iso), rec = recordOf(iso), isReal = state.completed?.date === iso;
    const node = renderMiniLetter(rec, { onOpen: () => navigate(`record/${iso}?from=calendar`), onEdit: editAt(rec, navigate) });
    node.setHeight(miniRoom());
    return { name: `${dLabel}의 편지`, msg: `${dLabel}, 완료. 편지를 열었어요`, node,
      centerLabel: dLabelFull,
      centerTag: isReal ? null : el("span", { class: "proto-tag", text: "예시" }),
      more: el("button", { type: "button", class: "cal-arrow cal-more-btn", "aria-label": `${dLabel} 기록 더보기`, "aria-haspopup": "dialog", onclick: recordMenu(iso, rec, isReal, navigate) },
        svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "dots3" }, svgEl("circle", { cx: "5", cy: "12", r: "1.7" }), svgEl("circle", { cx: "12", cy: "12", r: "1.7" }), svgEl("circle", { cx: "19", cy: "12", r: "1.7" }))) };
  }
  function paintPanel(opts = {}) {
    const run = () => {
      unfoldRow.hidden = !selectedIso; // 날짜를 고른 동안은 늘 보인다(닫기·날짜 줄) — 완료·임시저장·오늘·기록 없음 모두 같다(2026-09-25)
      if (!selectedIso) { // 아무 날도 고르지 않음(D-088 ②): 빈 칸 대신 조용한 안내 한 줄
        panel.removeAttribute("role"); panel.removeAttribute("aria-label");
        panel.replaceChildren(el("div", { class: "cal-pv-empty" }, el("p", { class: "cal-pv-hint", text: "날짜를 누르면 그날의 편지를 볼 수 있어요" })));
        unfoldName.textContent = ""; unfoldTagSlot.replaceChildren(); unfoldMoreSlot.replaceChildren();
        opts.onDone?.(); return;
      }
      if (isLoadState(globalStatus)) { // ?d=…&s=…: 달력은 정상, 편지 자리만 불러오기·오류(완료 기준 10)
        const dLabel = shortDay(selectedIso);
        panel.setAttribute("role", "region"); panel.setAttribute("aria-label", dLabel);
        panel.replaceChildren(renderStatus({ kind: globalStatus, onRetry: globalStatus !== "loading" ? () => navigate(`calendar?d=${selectedIso}`) : undefined }));
        unfoldName.textContent = ""; unfoldTagSlot.replaceChildren(); unfoldMoreSlot.replaceChildren();
        announce(`${dLabel}, 불러오는 중`); opts.onDone?.(); return;
      }
      const completed = statusOf(parseISO(selectedIso)) === "completed";
      const { name, msg, node, centerLabel, centerTag, more } = completed ? buildMini(selectedIso) : buildPreview(selectedIso);
      panel.setAttribute("role", "region"); panel.setAttribute("aria-label", name);
      panel.replaceChildren(node);
      unfoldName.textContent = centerLabel ?? "";
      unfoldTagSlot.replaceChildren(...(centerTag ? [centerTag] : []));
      unfoldMoreSlot.replaceChildren(...(more ? [more] : []));
      if (!opts.quiet) announce(msg);
      opts.onDone?.();
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
  // 날짜를 고른다(2026-09-25 — 미리보기 단계 없이 곧장 그 주로 접히고 남는 자리에 그날의 내용이 올라온다. D-088 ①의 "한 달은 그대로 두고
  // 미리보기만 바꾼다"를 대체한다). 한 달에서 처음 고르는 클릭만 pushState(뒤로 가기 = 닫기, 예전 expand()와 같은 방식) — 이미 접힌 채
  // 다른 날짜로 바꾸는 클릭은 replaceState(주 이동과 같은 방식, 뒤로 가기 기록이 날짜마다 쌓이지 않는다)이고 누른 칸만 살짝 흔들린다(cal-wiggle).
  // D-100 ①: 한 달은 접히지 않는다 — 누른 칸이 고리를 두르고 제자리에서 살짝 까딱이며, 편지는 달 아래에 온다. 달 위쪽(제목·안내)은 움직이지 않아
  // 누른 손가락 밑에서 달력이 밀려나지 않는다.
  function selectDate(iso) {
    const already = folded;
    selectedIso = iso; folded = true;
    paintFold();
    if (already) syncURL(); else history.pushState(null, "", `#/calendar?d=${iso}`);
    paintGrid(); gridWrap.querySelector(`[data-iso="${iso}"]`)?.classList.add("cal-wiggle");
    if (already) { paintPanel({ instant: true }); focusDay(iso); }
    else paintPanel({ onDone: () => panel.focus({ preventScroll: true }) }); // 처음 고르면 초점은 편지·안내 영역으로(스크롤은 하지 않는다)
  }
  // 닫기(✕) — 이 자리에서 바로 접는다(history.back을 쓰지 않는다: main.js의 hashchange 렌더는 화면마다 h1로 초점을 보내
  // "닫으면 날짜 칸으로 돌아간다"는 완료 기준과 어긋난다). pushState로 쌓인 항목은 그대로 남지만 실제 브라우저 뒤로 가기는 별도로 계속 닫기 역할을 한다.
  function closeExpand() {
    const prevIso = selectedIso;
    selectedIso = null; folded = false;
    paintFold();
    syncURL(); paintGrid();
    paintPanel({ onDone: () => focusDay(prevIso) }); // 초점은 방금 닫은 날짜 칸으로
  }
  function goMonth(delta) {
    month += delta;
    if (month < 0) { month = 11; year -= 1; } else if (month > 11) { month = 0; year += 1; }
    folded = false; selectedIso = null;
    paintFold();
    syncURL(); paintTitle(); paintGrid(); paintPanel({ instant: true });
    requestAnimationFrame(() => h1.focus({ preventScroll: true }));
  }
  const arrowOff = (btn) => btn.getAttribute("aria-disabled") === "true";
  prevBtn.onclick = () => { if (!arrowOff(prevBtn)) goMonth(-1); };
  nextBtn.onclick = () => { if (!arrowOff(nextBtn)) goMonth(1); };

  paintFold(); paintTitle(); paintGrid(); paintPanel({ instant: true });
  // 창 높이가 바뀌면 완료한 날 작은 편지의 높이를 다시 맞춘다(D-100 ③). 화면을 떠나면 리스너를 거둔다.
  let resizeTimer = 0;
  const onResize = () => {
    if (!screenRoot.isConnected) { window.removeEventListener("resize", onResize); return; }
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { panel.querySelector(".ml")?.setHeight(miniRoom()); }, 120);
  };
  window.addEventListener("resize", onResize);
  document.fonts?.ready.then(() => { if (screenRoot.isConnected) panel.querySelector(".ml")?.setHeight(miniRoom()); });
}

// 편지 카드의 '고치기'(D-100 ②): 편지 검토 화면을 거치지 않고 그 카드가 가리키는 단계(세부 감정·사건·이유·칭찬·감사)로 곧장 간다.
// 작성 흐름의 편지에서 고칠 때와 같이 fromReview로 들어가 아래 버튼이 '편지로 돌아가기'가 된다 — 고친 뒤 편지를 보고 저장한다.
// ⋯ 메뉴의 '고치기'는 어느 부분인지 모르므로 지금처럼 편지부터 연다.
function editAt(rec, navigate) {
  return (target) => {
    editCompleted(rec);
    if (!target) { navigate("write"); return; }
    state.step = target; state.fromReview = true;
    navigate(`write?step=${target}`);
  };
}

// 기록 하나의 ⋯ 메뉴(고치기·완료 취소·삭제). 기록 상세(#/record/…)와 달력의 날짜 줄(완료한 날, D-096)이 같은 메뉴를 쓴다 —
function recordMenu(iso, rec, real, navigate) {
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
  return menu;
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
  if (s === "loading" || s === "error" || s === "offline") { // 기록 상세(#/record/…?s=…)는 편지 자리에 불러오기·오류·연결 끊김(완료 기준 10, D-099 status-block F1)
    main.replaceChildren(el("div", { class: "screen record" },
      el("div", { class: "info-top" }, el("button", { type: "button", class: "back", "aria-label": "달력으로", onclick: () => navigate("calendar") }, svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d: "M14.5 5.5 8 12l6.5 6.5" })))),
      el("h1", { tabindex: "-1", text: `${shortDay(iso)}의 편지` }),
      renderStatus({ kind: s, onRetry: s !== "loading" ? () => navigate(`record/${iso}`) : undefined })));
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
  const menu = recordMenu(iso, rec, real, navigate);
  // 달력의 작은 편지에서 왔으면(D-100 ③) 뒤로 가기와 같게 돌아가 같은 날이 골라진 달력을 본다 — 새 기록을 쌓지 않는다. 주소로 곧장 왔으면 그날을 고른 달력으로 간다.
  const backToCalendar = () => { if (params?.get("from") === "calendar" && history.length > 1) history.back(); else navigate(`calendar?d=${iso}`); };

  const letter = renderLetter(rec, { mode: "read", onEdit: editAt(rec, navigate) });
  main.replaceChildren(el("div", { class: "screen record" },
    el("div", { class: "info-top" }, el("button", { type: "button", class: "back", "aria-label": "달력으로", onclick: backToCalendar }, svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d: "M14.5 5.5 8 12l6.5 6.5" }))),
      el("button", { type: "button", class: "back more", "aria-label": "더보기", "aria-haspopup": "dialog", onclick: menu }, svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "dots3" }, svgEl("circle", { cx: "5", cy: "12", r: "1.7" }), svgEl("circle", { cx: "12", cy: "12", r: "1.7" }), svgEl("circle", { cx: "19", cy: "12", r: "1.7" })))),
    el("h1", { tabindex: "-1", text: `${shortDay(iso)}의 편지` }),
    el("p", { class: "letter-sub", text: real ? "옆으로 넘겨서 다시 읽어요." : "옆으로 넘겨서 다시 읽어요. (지어낸 예시 기록이에요)" }),
    letter.node));
}
