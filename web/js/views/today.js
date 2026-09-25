// 오늘 화면(D-062): 어두운 숲 속 가운데 돌 하나. 시작 버튼·친구·이번 주 길·한 줄 질문은 없다.
// 하루에 기록은 하나다 — 오늘 기록이 있으면 새로 만들지 않고 보기·수정으로, 쓰던 글이 있으면 이어 쓰기로 들어간다(UX_SPEC §3).
// 새 기록은 그날만 쓴다(D-082) — 지난 날 쓰던 글은 오늘 상태를 바꾸지 않고 돌 아래 '어제 쓰던 글이 있어요 ›'로만 이어 쓴다.
// QA용 상태 강제: #/today?s=loading|error|offline|draft|recorded|yesterday|ai, 시각 고정: ?now=HH:MM(새벽 4시 전이면 날짜도 전날, D-081)
import { el, reducedMotion, renderStatus } from "../dom.js";
import { state, todayISO, formatDate, hasDraftContent, editCompleted, resetDraft, setNow, now, DAY_START_HOUR } from "../state.js";
import { renderForest, spreadLight, igniteAll } from "../components/forest.js";

const STEP_PHRASE = { date: "오늘 있었던 일을 쓰던 중", cats: "마음을 고르던 중", intensity: "크기를 정하던 중", reason: "이유를 쓰던 중", praise: "칭찬을 쓰던 중", thanks: "감사를 쓰던 중", review: "편지를 읽던 중" };
const stepPhrase = (step) => step.startsWith("detail:") ? "세부 감정을 고르던 중" : STEP_PHRASE[step] ?? "쓰던 중";
// 작성 알림(PR-011, D-077): 켜져 있고 설정 시각이 지났는데 오늘 기록도 쓰던 글도 없을 때만 돌 아래 안내 위에 한 줄로 알린다. 쓰던 글이 있는 날은 이어 쓰기 칩과
// '이어서 써요'가 완료 전까지 계속 보여 그 자체가 알림이다(사용자 결정). 시안은 설정이 자리만 있어 기본값(켜짐·오후 10시)에 고정한다.
const REMINDER = { on: true, hour: 22, minute: 0 };
// 시각 비교는 하루 기준 시각(새벽 4시, D-081 ②)에서 잰다 — 01:30은 전날의 하루 안이라 22:00 뒤로 친다(벽시계로 비교하면 자정~4시에 알림이 사라진다).
const sinceDayStart = (h, m) => ((h - DAY_START_HOUR + 24) % 24) * 60 + m;
const reminderDue = () => { const t = now(); return REMINDER.on && sinceDayStart(t.getHours(), t.getMinutes()) >= sinceDayStart(REMINDER.hour, REMINDER.minute); };
// 오늘 기록을 새로 시작하면 쓰던 지난 날 글이 사라지지 않게 잠시 맡겨 둔다(시안은 글을 하나만 들고 있어서다 — 실제 앱에서는 날짜마다 따로 저장된다).
let parked = null;
const chevron = () => { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); const p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", "M9 6l6 6-6 6"); s.append(p); return s; };
const moon = () => { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); const p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", "M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"); s.append(p); return s; };

export function renderToday(main, navigate, params) {
  const force = params.get("s");
  const at = params.get("now");
  if (at && /^\d{1,2}:\d{2}$/.test(at)) { const [h, m] = at.split(":").map(Number); const d = new Date(); d.setHours(h, m, 0, 0); setNow(d); } else setNow(null);
  const today = todayISO();
  const record = state.completed?.date === today ? state.completed : null;
  const draftToday = hasDraftContent() && state.draft.date === today;
  // 지난 날 쓰던 글: 작성 중인 글의 날짜가 오늘보다 앞이거나, 오늘 기록을 시작하느라 맡겨 둔 글. QA는 ?s=yesterday
  const pastDraft = force === "yesterday" || (hasDraftContent() && state.draft.date < today) || Boolean(parked);
  const failed = force === "error" || force === "offline";
  const mode = force === "recorded" ? "recorded" : force === "draft" ? "draft" : record ? "recorded" : draftToday ? "draft" : "none";
  const cats = mode === "recorded"
    ? new Set((record ?? sampleRecord()).emotions.map((e) => e.cat))
    : mode === "draft" ? new Set(state.draft.emotions.length ? state.draft.emotions.map((e) => e.cat) : ["sadness", "joy", "love"]) : null;
  const caption = { none: "돌을 눌러 시작해요", draft: "이어서 써요", recorded: "오늘의 기록 보기" }[mode];

  // 돌을 누르면 숲의 조약돌이 모두 켜지고(D-067) 곧이어 흰빛이 화면 전체로 퍼진다. 화면이 거의 덮이면 작성 첫 화면(또는 이어 쓰던 단계·기록 상세)이 흰 화면에서 열린다.
  const begin = (origin) => {
    if (begin.busy || failed) return; begin.busy = true;
    // 흰빛을 기다리는 사이 사용자가 다른 화면으로 떠났으면 퍼뜨리지 않는다(돌 누름 뒤 남는 타이머, 예외 처리).
    const go = () => { if (!forest.node.isConnected) { begin.busy = false; return; } spreadLight(origin, () => {
      if (mode === "recorded" && record) { editCompleted(); state.step = "review"; }
      else if (mode === "none") { if (hasDraftContent() && state.draft.date < today) parked = { draft: structuredClone(state.draft), step: state.step }; resetDraft(); state.ask = null; }
      navigate("write");
    }); };
    if (reducedMotion()) go(); else { igniteAll(forest.node, origin); setTimeout(go, 620); }
  };
  // 어제 쓰던 글 이어 쓰기: 맡겨 둔 글(또는 QA 예시)을 작성 중인 글로 되돌리고 쓰던 단계에서 연다. 오늘 기록을 쓰던 중이면 그것을 대신 맡긴다.
  const resumePast = (ev) => {
    ev.preventDefault();
    const back = parked ?? (hasDraftContent() && state.draft.date < today ? { draft: state.draft, step: state.step } : null);
    if (hasDraftContent() && state.draft.date === today) parked = { draft: structuredClone(state.draft), step: state.step }; else parked = null;
    if (back) { state.draft = back.draft; state.step = back.step; }
    else { resetDraft(); const d = new Date(`${today}T12:00`); d.setDate(d.getDate() - 1); state.draft.date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; state.draft.event = "퇴근길에 옛 동료를 만났다."; state.step = "cats"; }
    state.editing = null; state.fromReview = false;
    navigate("write");
  };

  const forest = renderForest({ chosen: cats, caption, onStart: begin, loading: force === "loading" });
  const box = forest.box;
  if (failed) {
    // 오늘 기록을 확인하지 못하면 돌을 누를 수 없게 둔다 — 확인 없이 새로 시작하면 하루 하나 규칙을 어길 수 있다(예외 처리, D-083).
    forest.node.classList.add("failed"); forest.stone.disabled = true; forest.caption.hidden = true;
    box.append(el("div", { class: "today-status" }, renderStatus({ kind: force === "offline" ? "offline" : "error", tone: "dark",
      title: force === "offline" ? "연결이 끊겼어요" : "오늘 기록을 확인하지 못했어요", detail: force === "offline" ? "연결되면 돌을 누를 수 있어요." : "잠시 뒤 다시 시도해 주세요.",
      onRetry: () => navigate("today") })));
  }
  if (mode === "draft" && !failed) box.append(el("p", { class: "dchip" }, el("span", { text: `${stepPhrase(state.step)} · 임시저장됨` })));
  // 알림 문구(D-077 — 위쪽 유리 배너를 돌 안내에 합쳤다): 기록 없음 + 알림 켜짐 + 설정 시각 이후에만. 쓰던 글(지난 날에 시작한 것 포함 — 그 줄이 알림 역할, D-081 ③·PRD)이 있거나 오늘 기록이 있으면 없다.
  if (mode === "none" && !pastDraft && !failed && force !== "loading" && reminderDue()) box.append(el("p", { class: "remind", role: "status", text: "오늘 마음을 아직 남기지 않았어요" }));
  if (pastDraft && mode === "none" && !failed && force !== "loading") {
    box.classList.add("has-yline");
    // 어제 글이면 '어제', 더 지난 글이면 날짜로 말한다(여러 개면 가장 최근 것 하나만 — 나머지는 달력의 임시저장 칸에서 이어 쓴다).
    const pastDate = parked?.draft.date ?? (hasDraftContent() && state.draft.date < today ? state.draft.date : null);
    const y = new Date(`${today}T12:00`); y.setDate(y.getDate() - 1);
    const isYesterday = !pastDate || pastDate === `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}`;
    const label = isYesterday ? "어제 쓰던 글이 있어요" : `${Number(pastDate.slice(5, 7))}월 ${Number(pastDate.slice(8, 10))}일에 쓰던 글이 있어요`;
    box.append(el("p", { class: "yline" }, el("a", { href: "#/write", onclick: resumePast }, label, chevron())));
  }
  if (force === "ai" || (!force && mode === "none") || force === "yesterday") {
    // AI 진입은 구독 경로가 확인되지 않으면 '현재 제공되지 않음'으로 비활성이다(D-019, UX_SPEC §5).
    if (!failed) box.append(el("p", { class: "ailine", id: "aiNote" }, moon(), "AI와 대화하며 쓰기 · 지금은 쉬고 있어요"));
  }
  if (force === "loading") box.append(el("div", { class: "ldk" },
    el("i", { style: { left: "31.7%", top: "63%", width: "36.7%", height: "13%", "border-radius": "58% 42% 54% 46% / 46% 54% 42% 58%" } }), el("i", { style: { left: "31%", top: "81.5%", width: "38%", height: "2.2%" } })));

  // 로딩이면 글자 자리를 옅은 막대로 둔다(같은 위치·같은 줄 수). 제목(h1)은 스크린리더에게 그대로 남는다.
  // 큰 질문은 글자 크기·굵기·자리를 달리한 타이포그래픽 배치다(D-067). 읽는 글은 그대로 "오늘은 어떤 마음이 머물렀나요?"이고 조각 사이에 공백을 둬 스크린리더가 이어 읽는다.
  // 오늘 화면에는 하단 탐색이 없다(D-076). 달력·통계·설정으로 가는 입구는 날짜 줄 오른쪽의 '지난 기록' 하나이고 달력으로 간다.
  const past = el("a", { class: "today-past", href: "#/calendar" }, "지난 기록", chevron());
  const head = el("div", { class: `today-head${force === "loading" ? " skel" : ""}` },
    el("div", { class: "today-row" }, el("p", { class: "today-date", text: formatDate(today) }), past),
    el("h1", { class: "hero", tabindex: "-1" }, el("span", { class: "ty1", text: "오늘은 어떤" }), " ", el("span", { class: "ty2" }, "마음", el("small", { text: "이" })), " ", el("span", { class: "ty3", text: "머물렀나요?" })));
  const screen = el("div", { class: "screen today" }, forest.node, head);
  // 숲은 스크린리더에게 장식이다. 돌(button)이 유일한 조작이고 이름은 '오늘의 마음 기록 시작하기'다. 상태는 돌 아래 문구가 말한다.
  main.replaceChildren(screen);
}

// 기록 있음을 QA로 강제할 때 쓰는 예시(그날 슬픔·기쁨·사랑).
function sampleRecord() { return { emotions: [{ cat: "sadness" }, { cat: "joy" }, { cat: "love" }] }; }
