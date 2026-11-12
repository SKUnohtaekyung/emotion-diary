// 다시 읽기(TASK-LOOKBACK-01 단계 A 시안, 6판). 한 화면에 주된 일 하나 — 하루의 글을 읽는다.
// 일기 쓰기 흐름의 거울이다: 같은 위 줄(닫기 · 몇 번째 · 진행 막대)과 같은 아래 줄(이전 · 다음)을 쓰고, 그날 일기를 마쳤을 때 본 언덕(land.js)이 다시 나온다.
//   #/lookback/read?p=7|30|x(&d=날짜)  하루 한 화면. 마지막 화면이 물음이다. p=x는 실천한 기간의 기록.
//   #/lookback/list(?w=말)             지난 30일의 목록. 날짜를 누르면 그날로 간다. '말로 찾기'는 시트.
// 긴 글: 글 길이에 따라 글자 크기가 세 단계로 줄고(짧은 글은 제목처럼, 긴 글은 읽기 편한 본문으로) 화면 전체가 세로로 스크롤된다.
//        아래 버튼 줄은 가까운 언덕 색으로 늘 발 아래에 있다. QA: ?long=1 이면 첫날을 긴 글로 바꿔 본다.
// 여기에는 수가 없다(크기·평균·비교). 고른 말·칭찬·감사는 '편지 전체 보기'로 미룬다.
import { el, svgEl, announce, toast } from "../dom.js";
import { pebbleImg, stoneImg } from "../data.js";
import { renderLand, doneLayout } from "../components/land.js";
import { openSheet } from "../components/sheet.js";
import { scape } from "../lookback/scape.js";
import { lb, recordOf, recordedDays, recordedBetween, todayIso, monthDay, weekday, toggleMark, repeated, pathEnd } from "../lookback/store.js";
import { chev, head, catsOf, put, goBack, iGa, lines } from "./lookback.js";

const LONG = ["오랜만에 대학 동기들을 만나기로 한 날이었다. 한 달 전부터 날짜를 맞췄고 나는 일부러 저녁 약속을 하나 미뤘다. 그런데 출발하려는데 단체 대화방에 한 명씩 못 온다는 말이 올라오더니, 결국 다음에 보자는 말로 끝났다. 이미 옷까지 갈아입은 뒤였다. 혼자 동네를 한 바퀴 걷고 편의점에서 김밥을 사 들고 집에 왔다.",
  "화가 났다기보다 내 시간이 아무것도 아닌 것처럼 다뤄진 느낌이 오래 남았다. 다들 사정이 있었겠지만, 나는 이 약속을 꽤 기다렸다는 걸 아무도 모르는 것 같았다. 그리고 그 말을 대화방에 쓰지 못한 나에게도 조금 실망했다."];
const closeIcon = () => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d: "M6 6l12 12M18 6 6 18" }));
const listIcon = () => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d: "M5 7h14M5 12h14M5 17h14" }));
const fullDate = (iso) => `${Number(iso.slice(0, 4))}년 ${monthDay(iso)} ${weekday(iso)}요일`;
const sizeClass = (text) => ([...text].length <= 28 ? "s" : [...text].length <= 70 ? "m" : "l");
let taught = false; // 처음 모아 둘 때 한 번만 무슨 일이 생기는지 알린다

// 기록 하나를 시트로 다시 본다(기준을 쓰다가 모아 둔 기록을 눌렀을 때 — 쓰던 화면을 떠나지 않는다).
export function daySheet(iso) {
  const rec = recordOf(iso);
  openSheet({ title: `${monthDay(iso)} ${weekday(iso)}요일`, secondary: { text: "닫기" }, body: [
    el("p", { class: "lb-sheet-event", text: rec.event }), rec.reason?.trim() ? el("p", { class: "lb-sheet-reason", text: rec.reason }) : null] });
}

function daysFor(params) {
  const p = params.get("p");
  if (p === "x" && lb.path) return recordedBetween(lb.path.start, pathEnd() < todayIso() ? pathEnd() : todayIso());
  const days = recordedDays(p === "30" ? 30 : 7), w = params.get("w");
  return w ? days.filter((iso) => `${recordOf(iso).event} ${recordOf(iso).reason}`.includes(w)) : days;
}

// ══════════════════════ 하루 한 화면 ══════════════════════
export function renderRead(main, navigate, params) {
  const days = daysFor(params), p = params.get("p") ?? "7", long = params.get("long") === "1";
  let i = Math.max(0, days.indexOf(params.get("d")));
  const leave = goBack(navigate, p === "x" ? "lookback/try" : "lookback");
  const screen = el("div", { class: "screen write lb-read" });
  const foot = el("div", { class: "step-footer lb-foot" }); // 장면(scape) 안 가까운 언덕 위에 얹힌다
  const recAt = (k) => { const rec = recordOf(days[k]); return long && k === 0 ? { ...rec, event: LONG[0], reason: LONG[1] } : rec; };
  const top = (label, ratio) => [el("div", { class: "write-top" },
    el("button", { type: "button", class: "back", "aria-label": "다시 읽기 닫기", onclick: leave }, closeIcon()),
    el("span", { class: "step-count", text: label }),
    p === "x" ? el("span", { class: "lb-top-gap" }) : el("a", { class: "back", href: "#/lookback/list", "aria-label": "지난 30일 목록" }, listIcon())),
    el("div", { class: "progress", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(days.length), "aria-valuenow": String(Math.round(ratio * days.length)) }, el("i", { style: { width: `${Math.round(ratio * 100)}%` } }))];
  function go(k) { i = k; draw(); window.scrollTo(0, 0); screen.querySelector("h1")?.focus({ preventScroll: true });
    history.replaceState(null, "", `#/lookback/read?p=${p}${days[i] ? `&d=${days[i]}` : ""}${params.get("w") ? `&w=${encodeURIComponent(params.get("w"))}` : ""}`); }
  function draw() {
    if (!days.length) { // 읽을 기록이 없다
      put(screen, top("", 0), el("h1", { tabindex: "-1", class: "lb-read-event s", text: "아직 다시 읽을 기록이 없어요" }),
        el("p", { class: "lede" }, lines("오늘 화면에서 마음을 남기면", "여기에서 다시 읽을 수 있어요.")), scape({ pond: false, foot }));
      put(foot, el("button", { type: "button", class: "btn primary big", text: "오늘 화면으로", onclick: () => navigate("today") }));
      return;
    }
    if (i >= days.length) { // 다 읽은 자리: 물음 하나
      const n = lb.marks.size; // 장면: 큰 나무 그늘에서 지나온 길과 물가를 내려다본다(길 끝에서 돌아본 자리)
      put(screen, top("다 읽었어요", 1),
        el("h1", { tabindex: "-1", class: "lb-ask", text: "중요한 것이 보였나요?" }),
        el("p", { class: "lede" }, lines(n ? `모아 둔 기록 ${n}편을 보며 한 줄로 써 봐요.` : "없었다면 여기서 닫아도 돼요.")), scape({ foot }));
      put(foot, el("button", { type: "button", class: "btn text", text: "닫기", onclick: leave }),
        el("button", { type: "button", class: "btn primary big", text: "기준 쓰기", onclick: () => navigate("lookback/write") }));
      return;
    }
    const iso = days[i], rec = recAt(i), marked = lb.marks.has(iso);
    put(screen, top(`${i + 1} / ${days.length}`, (i + 1) / (days.length + 1)),
      el("p", { class: "done-date lb-read-date", text: fullDate(iso) }),
      el("h1", { tabindex: "-1", class: `lb-read-event ${sizeClass(rec.event)}`, text: rec.event }),
      rec.reason?.trim() ? el("p", { class: `lb-read-reason ${sizeClass(rec.event)}`, text: rec.reason }) : null,
      el("a", { class: "link lb-read-open", href: `#/record/${iso}?from=lookback`, text: "편지 전체 보기" }),
      scape({ land: renderLand(doneLayout(catsOf(rec))), foot, cls: "lb-dayland" }));
    const mark = el("button", { type: "button", class: "choice lb-mark", "aria-pressed": String(marked) }, el("span", { class: "ck", "aria-hidden": "true", text: "✓" }), el("span", { text: "모아 두기" }));
    mark.addEventListener("click", () => { const on = toggleMark(iso); mark.setAttribute("aria-pressed", String(on));
      if (on && !taught) { taught = true; toast("모아 뒀어요. 다 읽고 나서 한데 놓고 볼 수 있어요"); } else announce(on ? "모아 뒀어요" : "뺐어요"); });
    put(foot, i > 0 ? el("button", { type: "button", class: "btn text", text: "이전", onclick: () => go(i - 1) }) : null, mark,
      el("button", { type: "button", class: "btn primary big", text: i === days.length - 1 ? "다 읽었어요" : "다음", onclick: () => go(i + 1) }));
  }
  draw();
  put(main, screen);
  main.querySelector("h1")?.focus({ preventScroll: true });
}

// ══════════════════════ 지난 30일의 목록 ══════════════════════
const ORD = ["첫째", "둘째", "셋째", "넷째", "다섯째", "여섯째"];
const weekName = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${m}월 ${ORD[Math.ceil((d + new Date(y, m - 1, 1).getDay()) / 7) - 1]} 주`; };
export function renderList(main, navigate, params) {
  const all = recordedDays(30), words = repeated(all).filter((x) => x.kind === "word");
  let picked = words.find((x) => x.word === params.get("w")) ?? null;
  const screen = el("div", { class: "screen lb lb-listscreen" }), tray = el("div", { class: "lb-traybar" });
  const findSheet = () => { const sh = openSheet({ title: "말로 찾기", secondary: { text: "닫기" }, body: [
    el("p", { class: "note", text: "내가 적은 글에서 여러 날 나온 말이에요." }),
    el("div", { class: "sx-pillrow" }, words.map((item) => el("button", { type: "button", class: "sx-pill lb-word", onclick: () => { sh.close(); picked = item; draw(); } }, item.word, el("em", { text: `${item.days.length}일` }))))] }); };
  function draw() {
    const days = picked ? all.filter((iso) => picked.days.includes(iso)) : all, groups = new Map();
    for (const iso of days) { const k = weekName(iso); groups.set(k, [...(groups.get(k) ?? []), iso]); }
    const row = (iso) => { const rec = recordOf(iso);
      return el("li", { class: `lb-day${lb.marks.has(iso) ? " is-marked" : ""}` }, el("a", { class: "lb-day-head", href: `#/lookback/read?p=30&d=${iso}${picked ? `&w=${encodeURIComponent(picked.word)}` : ""}` },
        el("span", { class: "lb-day-pebs", "aria-hidden": "true" }, catsOf(rec).slice(0, 2).map((c) => pebbleImg(c, { size: 26 }))),
        el("span", { class: "lb-day-main" }, el("span", { class: "lb-day-date" }, el("b", { text: monthDay(iso) }), ` ${weekday(iso)}`), el("span", { class: "lb-day-event", text: rec.event })), chev("lb-day-chev"))); };
    put(screen, head(navigate, "lookback", "뒤로"), el("h1", { tabindex: "-1", text: "지난 30일" }),
      el("p", { class: "lede", text: all.length ? "날짜를 누르면 그날의 기록을 다시 읽어요." : "아직 다시 읽을 기록이 없어요." }),
      picked ? el("button", { type: "button", class: "sx-pill lb-word is-on", "aria-label": `'${picked.word}' 찾기 풀기`, onclick: () => { picked = null; draw(); } }, `'${picked.word}'${iGa(picked.word)} 나온 ${picked.days.length}일`, el("em", { text: "✕" }))
        : words.length ? el("button", { type: "button", class: "st-pill-link", onclick: findSheet }, el("span", { class: "st-pill-link-face" }, "말로 찾기", chev())) : null,
      [...groups.entries()].map(([name, isos]) => el("section", { class: "lb-week" }, el("h2", { class: "sx-eyebrow", text: name }), el("ul", { class: "lb-days" }, isos.map(row)))));
    tray.hidden = !lb.marks.size;
    put(tray, el("b", { text: `모아 둔 기록 ${lb.marks.size}편` }), el("button", { type: "button", class: "btn primary", text: "기준 쓰기", onclick: () => navigate("lookback/write") }));
  }
  draw();
  put(main, screen, tray);
  main.querySelector("h1")?.focus({ preventScroll: true });
}
