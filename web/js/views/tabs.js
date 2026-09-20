// 오늘·달력·통계·설정. 저장이 없으므로 달력과 통계의 내용은 전부 지어낸 예시이고 화면에 그렇게 적는다.
import { el, protoButton } from "../dom.js";
import { data, decorativePose } from "../data.js";
import { state, todayISO, toISO, formatDate, resetDraft, editCompleted } from "../state.js";
import { renderRecordCard } from "../components/record-card.js";

export function renderToday(main, navigate) {
  const start = (prepare) => () => { prepare?.(); navigate("write"); };
  const hasDraft = state.draft.event.trim() || state.draft.cats.length || state.draft.reason.trim();
  const screen = el("div", { class: "screen" },
    el("p", { class: "caption", text: formatDate(todayISO()) }),
    el("h1", { tabindex: "-1", text: "감정일기" }));

  if (state.completed) {
    // 하루에 기록은 하나다. 오늘 기록이 있으면 새로 만들지 않고 보기/수정만 준다(UX_SPEC §3).
    screen.append(el("p", { class: "note", text: "오늘 기록이 있습니다. 새 일기를 만들지 않고 이 기록을 이어서 고칩니다." }),
      renderRecordCard(state.completed, { status: "완료(시안)" }),
      el("div", { class: "stack" }, el("button", { type: "button", class: "btn primary", text: "기록 보기/수정", onclick: start(editCompleted) })));
  } else {
    screen.append(
      el("div", { class: "pose-row", "aria-hidden": "true" }, data.categories.map((c) => decorativePose(c.code, 56))),
      el("p", { class: "lede", text: "감정을 진단하지 않습니다. 오늘 내가 고른 말로 하루를 적어 두는 곳입니다." }),
      el("p", { class: "note", text: "의료·심리 치료 기록이나 건강 정보를 적는 용도가 아닙니다." }),
      el("div", { class: "stack" },
        el("button", { type: "button", class: "btn primary", text: hasDraft ? "이어 쓰기" : "직접 작성", onclick: start() }),
        hasDraft ? el("button", { type: "button", class: "btn text", text: "처음부터 다시 쓰기", onclick: start(resetDraft) }) : null,
        el("button", { type: "button", class: "btn secondary", "aria-disabled": "true", "aria-describedby": "aiNote", text: "AI와 대화하며 작성" }),
        el("p", { class: "caption center", id: "aiNote", text: "현재 제공되지 않음 — 지금은 직접 작성만 할 수 있습니다." })));
  }
  main.replaceChildren(screen);
}

// 예시 상태는 날짜 숫자로 정한 고정 무늬다(무작위가 아니라 볼 때마다 같다).
const sampleStatus = (day) => day % 7 === 3 ? "draft" : day % 3 === 0 ? "none" : "completed";
const STATUS = { none: ["", "기록 없음"], draft: ["✎", "임시저장"], completed: ["✓", "완료"], future: ["", "미래 — 고를 수 없음"] };

export function renderCalendar(main) {
  const now = new Date(), year = now.getFullYear(), month = now.getMonth(), today = now.getDate();
  const first = new Date(year, month, 1).getDay(), days = new Date(year, month + 1, 0).getDate();
  const detail = el("p", { class: "note", role: "status", text: "날짜를 누르면 그날의 상태가 여기에 나옵니다." });
  const cells = Array.from({ length: first }, () => el("span", { class: "day blank", "aria-hidden": "true" }));
  for (let d = 1; d <= days; d += 1) {
    const iso = toISO(new Date(year, month, d));
    const status = d > today ? "future" : d === today ? (state.completed?.date === iso ? "completed" : "none") : sampleStatus(d);
    const [icon, label] = STATUS[status];
    cells.push(el("button", { type: "button", class: `day ${status}${d === today ? " today" : ""}`, disabled: status === "future",
      "aria-label": `${month + 1}월 ${d}일${d === today ? ", 오늘" : ""}, ${label}`, "aria-current": d === today ? "date" : null,
      onclick: () => { detail.textContent = `${formatDate(iso)} · ${label}${d === today ? "" : " (예시)"}`; } },
      el("span", { text: String(d) }), el("small", { "aria-hidden": "true", text: icon })));
  }
  main.replaceChildren(el("div", { class: "screen" },
    el("h1", { tabindex: "-1", text: "달력" }),
    el("p", { class: "proto-note" }, el("span", { class: "proto-tag", text: "시안" }), " 오늘을 뺀 날짜의 상태는 지어낸 예시입니다."),
    el("h2", { text: `${year}년 ${month + 1}월` }),
    el("div", { class: "cal-head", "aria-hidden": "true" }, ["일", "월", "화", "수", "목", "금", "토"].map((w) => el("span", { text: w }))),
    el("div", { class: "cal" }, cells),
    el("ul", { class: "legend" }, el("li", {}, el("span", { class: "day mini completed" }, el("small", { text: "✓" })), " 완료"),
      el("li", {}, el("span", { class: "day mini draft" }, el("small", { text: "✎" })), " 임시저장"),
      el("li", {}, el("span", { class: "day mini today" }), " 오늘"), el("li", {}, el("span", { class: "day mini" }), " 기록 없음")),
    detail));
}

export function renderStats(main) {
  const sample = [["anger", 4], ["sadness", 3], ["joy", 2], ["enjoyment", 1]];
  const max = Math.max(...sample.map(([, n]) => n));
  const label = (k) => data.categories.find((c) => c.code === k).label;
  main.replaceChildren(el("div", { class: "screen" },
    el("h1", { tabindex: "-1", text: "통계" }),
    el("p", { class: "proto-note" }, el("span", { class: "proto-tag", text: "시안" }), " 아래 숫자는 모두 지어낸 예시입니다. 실제 기록을 세지 않습니다."),
    el("div", { class: "segmented", role: "group", "aria-label": "기간" }, ["최근 7일", "최근 30일"].map((t, i) => el("button", { type: "button", "aria-pressed": String(i === 0), text: t,
      onclick: (ev) => ev.currentTarget.parentNode.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === ev.currentTarget))) }))),
    el("div", { class: "stats" },
      el("div", { class: "stat" }, el("div", { class: "k", text: "평균 강도" }), el("div", { class: "v", text: "5.8" }), el("div", { class: "c", text: "최근 7일 · 기록 5개" })),
      el("div", { class: "stat" }, el("div", { class: "k", text: "작성 streak" }), el("div", { class: "v", text: "4일" }), el("div", { class: "c", text: "완료일 기준" })),
      el("div", { class: "stat" }, el("div", { class: "k", text: "기록 수" }), el("div", { class: "v", text: "5 / 7" }), el("div", { class: "c", text: "기록 없는 날 2" }))),
    el("h2", { text: "계열별 고른 횟수" }),
    el("p", { class: "caption", text: "최근 7일 · 기록 5개 · 고른 감정 10개 중. 많이 고른 순서일 뿐 좋고 나쁨의 순위가 아닙니다." }),
    el("div", { class: "bars" }, sample.map(([k, n]) => el("div", { class: "bar" }, el("span", { text: label(k) }),
      el("i", { "aria-hidden": "true", style: { width: `${(n / max) * 100}%`, background: `var(--${k}-accent)` } }), el("em", { text: `${n}회` })))),
    el("h2", { text: "강도 추세" }),
    el("div", { class: "empty-box" }, el("div", { class: "pose-row", "aria-hidden": "true" }, decorativePose("enjoyment", 72)),
      el("p", { text: "기록이 더 필요함" }), el("p", { class: "caption", text: "기록이 적을 때는 추세를 그리지 않습니다." })),
    el("h2", { text: "AI 분석" }),
    el("p", { class: "note", text: "현재 제공되지 않음. 제공되더라도 점수·병명·성격 유형은 보여 주지 않습니다." })));
}

export function renderSettings(main) {
  const toggle = el("button", { type: "button", class: "switch", role: "switch", "aria-checked": "false", "aria-disabled": "true", "aria-label": "작성 알림" }, el("i", { "aria-hidden": "true" }));
  main.replaceChildren(el("div", { class: "screen" },
    el("h1", { tabindex: "-1", text: "설정" }),
    el("p", { class: "proto-note" }, el("span", { class: "proto-tag", text: "시안" }), " 이 화면의 동작은 자리만 있고 실제로 움직이지 않습니다."),
    el("section", { class: "panel" }, el("h2", { text: "알림" }),
      el("div", { class: "setting-row" }, el("span", {}, "작성 알림 ", el("span", { class: "proto-tag", text: "시안" })), toggle),
      el("p", { class: "caption", text: "앱을 열었을 때 오늘 기록이 없으면 알려 주는 방식부터 시작합니다. 푸시 알림은 약속하지 않습니다." })),
    el("section", { class: "panel" }, el("h2", { text: "개인정보 안내" }),
      el("p", { text: "직접 작성한 일기는 자동으로 분석·감시되지 않습니다." }),
      el("p", { class: "note", text: "이 앱은 진단이나 위기 대응 서비스가 아닙니다." }),
      el("h3", { text: "도움이 필요할 때 연락할 곳" }),
      el("p", { class: "placeholder-box", text: "연락처는 검수 후 채워집니다. 확인되지 않은 번호를 시안에 적지 않았습니다." })),
    el("section", { class: "panel" }, el("h2", { text: "내 기록" }),
      el("div", { class: "stack" }, protoButton("내 기록 내보내기(JSON)")),
      el("p", { class: "caption", text: "모든 완료·임시저장 기록이 들어가고 비밀값과 AI 대화 전문은 들어가지 않습니다." })),
    el("section", { class: "panel danger-zone" }, el("h2", { text: "영구 삭제" }),
      el("p", { class: "caption", text: "되돌릴 수 없는 동작이라 다른 설정과 떨어뜨려 둡니다. 실제 앱에서는 확인 문구를 직접 입력해야 합니다." }),
      el("div", { class: "stack" }, protoButton("모든 기록 영구 삭제", "btn danger")))));
}
