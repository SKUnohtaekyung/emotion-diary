// 설정: 목록 → 하위 화면(D-091 ④⑤). 목록 줄은 '옅은 조약돌 면 아이콘 + 이름 + 지금 값(muted) + ›' 한 모양(st-row)으로 통일하고 설명은 모두 하위 화면으로 옮긴다.
// 하위 화면 뼈대(뒤로 가기·h1)는 tabs.css의 .info-top·.back을 그대로 쓴다(기록 상세와 같은 원형 ‹). 내보내기·삭제 화면은 settings-data.js(Sub-I)가 채운다 — 여기서는 라우팅만 한다.
import { el, svgEl, announce, toast } from "../dom.js";
import { openSheet } from "../components/sheet.js";
import { stoneImg } from "../data.js";
import { now } from "../state.js";
import { renderExport, renderDelete, renderDeleted, renderLeft } from "./settings-data.js";
import { dayStatus, effectiveToday } from "../sample.js";
import { account, PROVIDERS, cleanName, nameLength, joinedLabel } from "../account.js";
import { providerMark, nameScene, nameField } from "./auth.js";

// ── 시안 안의 설정 값(D-091 — 실제로 저장·전송하지 않고 모듈 변수로만 들고 있는다. 목록·알림 화면이 이 하나를 같이 본다) ──
const settingsState = { reminderOn: true, reminderTime: "22:00", dayStartHour: 4 };
const PRESET_TIMES = ["21:00", "22:00", "23:00"];

// ── 아이콘(하단 탐색·기존 뒤로 화살표와 같은 선 언어: 24 viewBox, 선 1.8, 둥근 끝·이음, 채움 없음, currentColor) ──
const ic = (...d) => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "st-ic" }, d.map((p) => svgEl("path", { d: p })));
const ICONS = {
  bell: () => ic("M7.2 10.2a4.8 4.8 0 0 1 9.6 0v3.3l1.7 2.3H5.5l1.7-2.3z", "M10.2 18a1.9 1.9 0 0 0 3.6 0"), // 작성 알림
  clock: () => ic("M12 3.6a8.4 8.4 0 1 0 .01 0", "M12 7.8V12l3 2"), // 알림 시각
  horizon: () => ic("M4 16.6h16", "M7.6 16.6a4.4 4.4 0 0 1 8.8 0", "M12 6.6v2.2", "M6.7 10.6l1.5 1.5", "M17.3 10.6l-1.5 1.5"), // 하루 기준 시각 — 지평선 위로 뜨는 해(하루의 경계)
  timezone: () => ic("M12 3.6a8.4 8.4 0 1 0 .01 0", "M3.9 12h16.2", "M12 3.6c2 2.3 3.1 5.3 3.1 8.4s-1.1 6.1-3.1 8.4c-2-2.3-3.1-5.3-3.1-8.4S10 5.9 12 3.6z"), // 시간대 — 자오선 있는 지구본
  lock: () => ic("M6.2 11.2a2 2 0 0 1 2-2h7.6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H8.2a2 2 0 0 1-2-2z", "M8.6 9.2V7.6a3.4 3.4 0 0 1 6.8 0v1.6"), // 개인정보 안내 전용(직접 쓴 일기는 그대로예요와도 같은 뜻)
  download: () => ic("M12 4v9.6", "M8.2 10 12 13.8 15.8 10", "M4.8 15.2v3a2 2 0 0 0 2 2h10.4a2 2 0 0 0 2-2v-3"), // 내보내기 전용
  bubble: () => ic("M6.2 5.6h11.6a2 2 0 0 1 2 2v6.4a2 2 0 0 1-2 2h-7.6L7 19.4v-3.4H6.2a2 2 0 0 1-2-2V7.6a2 2 0 0 1 2-2z", "M9.4 10.4h.01", "M12 10.4h.01", "M14.6 10.4h.01"), // AI 분석을 켜면
  trash: () => ic("M5 7h14", "M9.4 7V5.6A1.6 1.6 0 0 1 11 4h2a1.6 1.6 0 0 1 1.6 1.6V7", "M6.6 7l.7 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L18 7", "M10 10.6v6M14 10.6v6"), // 보관과 삭제
  hourglass: () => ic("M6.4 4.4h11.2", "M6.4 19.6h11.2", "M7.5 4.4c0 3.3 2 5.1 4.5 6.1 2.5-1 4.5-2.8 4.5-6.1", "M7.5 19.6c0-3.3 2-5.1 4.5-6.1 2.5 1 4.5 2.8 4.5 6.1"), // 푸시 알림(잠긴 자리)
  heart: () => ic("M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"), // 도움이 필요할 때 · 진단·치료 앱이 아니에요(둘 다 '힘든 순간의 돌봄'이라는 같은 뜻 축이라 유지 — 아래 표)
  replay: () => ic("M5.2 12a6.8 6.8 0 1 0 2.1-4.9", "M5.2 4.6v4.4h4.4"), // 처음 화면 다시 보기
  logout: () => ic("M9.8 4.6H6.4a2 2 0 0 0-2 2v10.8a2 2 0 0 0 2 2h3.4", "M11 12h9.2", "M17 8.4l3.6 3.6-3.6 3.6"), // 로그아웃
  person: () => ic("M12 12.2a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2z", "M5.2 19.4c.9-3.2 3.6-5.2 6.8-5.2s5.9 2 6.8 5.2"), // 부를 이름 · 계정
  note: () => ic("M7 3.8h6.6L18 8.2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5.8a2 2 0 0 1 2-2z", "M13.4 3.8v4.4H18", "M8.6 12.4h6.8", "M8.6 15.8h4.4"), // 기록
  chart: () => ic("M4.8 19.4h14.4", "M8 16.2v-4", "M12 16.2V7.8", "M16 16.2v-5.6") // 분석 결과와 설정
};
const chevIcon = () => { const s = svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "st-chev" }, svgEl("path", { d: "M9.5 5.5 16 12l-6.5 6.5" })); return s; };
const backIcon = () => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d: "M14.5 5.5 8 12l6.5 6.5" }));

// 조약돌 면은 줄마다 방향을 뒤집어(달력 칸과 같은 손맛, tabs.css .cal .day::before의 nth-child 규칙과 같은 리듬) 손으로 놓은 느낌을 낸다.
// 아이콘 자체(svg, z-index 1)는 면(::before)과 분리된 형제라 뒤집히지 않는다.
function iconFrame(iconFn, seq) {
  const fx = seq % 3 === 2 ? -1 : 1, fy = seq % 4 === 2 ? -1 : 1;
  return el("span", { class: "st-ic-frame", style: { "--fx": fx, "--fy": fy } }, iconFn());
}

// ── 목록 줄 한 모양(st-row) ──
let rowSeq = 0;
function navRow({ icon, name, value, onclick, dim }) {
  return el("button", { type: "button", class: `st-row${dim ? " is-dim" : ""}`, "aria-label": value != null ? `${name}, ${value}` : name, onclick },
    iconFrame(icon, rowSeq++), el("span", { class: "st-row-name", text: name }),
    el("span", { class: "st-row-trail" }, value != null ? el("span", { class: "st-row-value", "aria-hidden": "true", text: value }) : null, chevIcon()));
}
function switchRow({ icon, name, checked, onclick, locked }) {
  return el("div", { class: `st-row st-switch-row${locked ? " is-dim" : ""}` },
    iconFrame(icon, rowSeq++), el("span", { class: "st-row-name", text: name }),
    locked
      ? el("span", { class: "st-row-trail" }, el("span", { class: "st-row-value", "aria-hidden": "true", text: "준비 중" }))
      : el("button", { type: "button", class: "switch", role: "switch", "aria-checked": String(checked), "aria-label": name, onclick },
          el("i", { "aria-hidden": "true" })));
}
// 묶음 머리는 화면 제목(h1) 아래 단계의 제목(h2)이다 — 스크린리더의 제목 건너뛰기로 묶음을 훑는다(D-099 section-header K1). 모습은 작은 muted 글자 그대로.
function group(title, rows) { return el("div", { class: "st-group" }, el("h2", { class: "st-group-head", text: title }), el("div", { class: "st-rows" }, rows)); }

// 스위치 적용이 실패하면 스위치를 원래 자리로 되돌리고 토스트로 알린다(D-099 switch G1) — '바뀌었다'는 착각을 남기지 않는다.
// 시안은 서버 저장이 없어 실패가 없다. QA: #/settings?s=switchfail(또는 #/settings/reminder?s=switchfail)이면 한 번 실패를 흉내 낸다.
function applySwitch(params, apply) {
  if (params?.get("s") === "switchfail") { toast("바꾸지 못했어요. 다시 시도해 주세요"); return false; }
  apply(); return true;
}

// ── 시각 표기 ──
const formatKoreanClock = (hhmm) => {
  const [hh, mm] = hhmm.split(":").map(Number);
  const period = hh < 12 ? "오전" : "오후"; let h12 = hh % 12; if (h12 === 0) h12 = 12;
  return mm === 0 ? `${period} ${h12}시` : `${period} ${h12}시 ${mm}분`;
};
const hourLabel = (h) => h === 0 ? "자정" : `새벽 ${h}시`;

// ── 하위 화면 공통 머리(뒤로 가기 + 제목) ──
function subHead(navigate, title, back = { to: "settings", label: "설정으로" }) {
  return [el("div", { class: "info-top" }, el("button", { type: "button", class: "back", "aria-label": back.label, onclick: () => navigate(back.to) }, backIcon())),
    el("h1", { tabindex: "-1", text: title })];
}

// 로그아웃(D-104) — 설정 목록과 탈퇴 '떠나기 전에'가 같이 쓴다. 아직 올라가지 않은 글이 있으면 그 글이 이 기기에서 사라진다는 경고로 바뀐다(IA 예외 — 데이터 손실). QA: #/settings?s=unsynced
function openLogoutSheet(navigate, params) {
  const out = () => navigate("auth?s=loggedout");
  if (params?.get("s") === "unsynced") {
    openSheet({ title: "아직 저장되지 않은 글이 있어요", danger: true,
      body: [el("p", { text: "지금 로그아웃하면 그 글은 이 기기에서 사라져요. 인터넷에 연결돼 저장된 뒤에 로그아웃해 주세요." })],
      primary: { text: "그래도 로그아웃", onclick: out }, secondary: { text: "취소" } });
    return;
  }
  openSheet({ title: "로그아웃할까요?", body: [el("p", { text: "기록은 계정에 그대로 남아 있어요. 다시 로그인하면 이어서 볼 수 있어요." })],
    primary: { text: "로그아웃", onclick: out }, secondary: { text: "취소" } });
}

// ══════════════════════ 1. 설정 목록 #/settings ══════════════════════
function renderList(main, navigate, params) {
  rowSeq = 0;
  function toggleReminder() {
    applySwitch(params, () => { settingsState.reminderOn = !settingsState.reminderOn; });
    draw();
    main.querySelector(".st-switch-row .switch")?.focus();
  }
  function draw() {
    rowSeq = 0;
    main.replaceChildren(el("div", { class: "screen settings" },
      el("div", { class: "tb-body tb-rise" },
        el("h1", { tabindex: "-1", text: "설정" }),
        el("p", { class: "proto-note" }, el("span", { class: "proto-tag", text: "시안" }), " 이 화면의 동작은 자리만 있고 실제로 움직이지 않습니다."),
        // 나의 돌 머리(D-091 ⑥ → D-104): 오늘 화면 가운데 돌의 쉬는 모습 + 부를 이름. 누르면 내 계정으로 간다(개인정보 안내는 아래 '내 기록 지키기'에 그대로 있다).
        el("button", { type: "button", class: "st-me", "aria-label": `${account.name}의 기록 공간. ${PROVIDERS[account.via].label}로 연결됨. 내 계정 보기`, onclick: () => navigate("settings/profile") },
          stoneImg("rest"), el("span", { class: "st-me-text", "aria-hidden": "true" }, el("b", { text: `${account.name}의 기록 공간` }), el("span", { text: `${PROVIDERS[account.via].label}로 연결됨 · 내 계정` })), chevIcon()),

        group("기록 리듬", [
          switchRow({ icon: ICONS.bell, name: "작성 알림", checked: settingsState.reminderOn, onclick: toggleReminder }),
          navRow({ icon: ICONS.clock, name: "알림 시각", value: formatKoreanClock(settingsState.reminderTime), dim: !settingsState.reminderOn, onclick: () => navigate("settings/reminder") }),
          navRow({ icon: ICONS.horizon, name: "하루 기준 시각", value: hourLabel(settingsState.dayStartHour), onclick: () => navigate("settings/day") })
        ]),
        group("내 기록 지키기", [
          navRow({ icon: ICONS.lock, name: "개인정보 안내", onclick: () => navigate("settings/privacy") }),
          navRow({ icon: ICONS.download, name: "내 기록 내보내기", onclick: () => navigate("settings/export") })
        ]),
        group("도움과 안내", [
          navRow({ icon: ICONS.heart, name: "도움이 필요할 때", onclick: () => navigate("help") }),
          navRow({ icon: ICONS.replay, name: "처음 화면 다시 보기", onclick: () => navigate("welcome") })
        ]),
        group("계정", [navRow({ icon: ICONS.logout, name: "로그아웃", onclick: () => openLogoutSheet(navigate, params) })]),

        el("button", { type: "button", class: "st-delete-row", onclick: () => navigate("settings/delete") },
          el("span", { text: "모든 기록 영구 삭제" }), chevIcon()))));
  }
  draw();
}

// ══════════════════════ 2. 알림 #/settings/reminder (D-081) ══════════════════════
function renderReminder(main, navigate, params) {
  function draw(focusSel) {
    rowSeq = 0;
    const on = settingsState.reminderOn;
    const isCustom = !PRESET_TIMES.includes(settingsState.reminderTime);
    const timeInput = el("input", { type: "time", class: "st-time-native", tabindex: "-1", "aria-hidden": "true", value: settingsState.reminderTime,
      onchange: (ev) => { if (ev.target.value) { settingsState.reminderTime = ev.target.value; draw(".st-pill.is-custom"); } } });
    // showPicker()가 없거나 막히면 숨은 칸을 그 자리에 보이는 시각 입력 칸으로 드러내고 초점을 준다(D-099 native-picker G1) —
    // 화면 밖 1px 칸에 초점만 가 있어 아무 일도 없어 보이는 상태를 두지 않는다.
    const revealInput = () => {
      timeInput.classList.add("is-revealed"); timeInput.removeAttribute("aria-hidden"); timeInput.removeAttribute("tabindex");
      timeInput.setAttribute("aria-label", "알림 시각 직접 입력"); timeInput.focus();
    };
    const openPicker = () => { if (typeof timeInput.showPicker === "function") { try { timeInput.showPicker(); return; } catch { /* 지원 안 함 → 입력 칸을 드러낸다 */ } } revealInput(); };
    const pillBtn = (checked, text, onclick, extraClass = "") => el("button", { type: "button", class: `st-pill${extraClass}`, role: "radio", "aria-checked": String(checked),
      "aria-disabled": on ? null : "true", text, onclick: on ? onclick : () => announce("작성 알림이 꺼져 있어요: 먼저 켜 주세요") });

    main.replaceChildren(el("div", { class: "screen settings-sub st-reminder" },
      ...subHead(navigate, "알림"),
      switchRow({ icon: ICONS.bell, name: "작성 알림", checked: on, onclick: () => { applySwitch(params, () => { settingsState.reminderOn = !settingsState.reminderOn; }); draw(".st-switch-row .switch"); } }),

      el("div", { class: `st-block${on ? "" : " is-dim"}` },
        el("p", { class: "st-block-label", text: "알림 시각" }),
        el("div", { class: "st-pills", role: "radiogroup", "aria-label": "알림 시각" },
          ...PRESET_TIMES.map((t) => pillBtn(!isCustom && t === settingsState.reminderTime, formatKoreanClock(t), () => { settingsState.reminderTime = t; draw(); })),
          // 고른 뒤에도 라디오다 — 라벨이 고른 시각을 보이고, 다시 누르면 선택기가 다시 열린다(D-099 radio-pill G1).
          pillBtn(isCustom, isCustom ? `다른 시각 · ${formatKoreanClock(settingsState.reminderTime)}` : "다른 시각…", openPicker, isCustom ? " is-custom" : ""),
          timeInput),
        el("p", { class: "note st-block-note", text: "이 시각이 지나도 오늘 기록이 없으면 오늘 화면에 알려요." })),

      // 다른 줄과 같은 모양(아이콘+이름+값+›)으로 맞추고, 설명은 그 아래 muted 한 줄로 뗀다. iconFrame은 navRow 안에서 rowSeq로 그린다.
      navRow({ icon: ICONS.timezone, name: "시간대", value: timezoneValue(), onclick: () => announce("시간대: 시안이라 동작하지 않습니다") }),
      el("p", { class: "note st-tz-note", text: "바꿔도 이미 쓴 기록의 날짜는 바뀌지 않아요." }),

      switchRow({ icon: ICONS.hourglass, name: "푸시 알림", locked: true }),
      el("p", { class: "note st-lock-note" }, "휴대폰이 닫혀 있어도 알려 주는 알림은 지원을 확인한 뒤에 열어요."),

      el("p", { class: "caption st-foot-note" },
        "오늘 기록을 남기면 그날 알림은 멈춰요. 지난 날을 채우라고 알리지 않아요. 거절해도 같은 요청을 반복하지 않아요.")));
    if (focusSel) main.querySelector(focusSel)?.focus();
  }
  draw();
}
// 값 줄에 'Seoul' 같은 영어 도시 이름을 쓰지 않는다 — 아는 도시는 한국어 표기, 모르면 UTC 오프셋만 보인다.
const TZ_KO = { Seoul: "서울", Tokyo: "도쿄", Shanghai: "상하이", Taipei: "타이베이", Hong_Kong: "홍콩", Singapore: "싱가포르",
  London: "런던", Paris: "파리", Berlin: "베를린", New_York: "뉴욕", Los_Angeles: "로스앤젤레스", Chicago: "시카고", Sydney: "시드니", Honolulu: "호놀룰루" };
function timezoneValue() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    const offsetMin = -new Date().getTimezoneOffset();
    const sign = offsetMin >= 0 ? "+" : "-";
    const utc = `UTC${sign}${Math.floor(Math.abs(offsetMin) / 60)}`;
    const ko = TZ_KO[tz.split("/").pop() ?? ""];
    return `기기 시간대 · ${ko ?? utc}`;
  } catch { return "기기 시간대"; }
}

// ══════════════════════ 3. 하루 기준 시각 #/settings/day (D-081 ②) ══════════════════════
function exampleLine(hour) {
  if (hour === 0) return "자정을 기준으로 하면 날짜가 바뀌는 새벽 시간이 없어요 — 자정이 곧 하루의 시작이에요.";
  const yest = new Date(now()); yest.setDate(yest.getDate() - 1);
  return `지금 설정이면 ${hourLabel(hour - 1)}에 쓴 기록은 ${yest.getMonth() + 1}월 ${yest.getDate()}일 기록이 돼요.`;
}
function renderDayStart(main, navigate) {
  function draw(focusSel) {
    main.replaceChildren(el("div", { class: "screen settings-sub st-day" },
      ...subHead(navigate, "하루 기준 시각"),
      el("p", { class: "lede", text: "이 시각 전에는 오늘을 전날로 봐요." }),
      el("div", { class: "st-pills st-pills-day", role: "radiogroup", "aria-label": "하루 기준 시각" },
        ...Array.from({ length: 7 }, (_, h) => el("button", { type: "button", class: "st-pill", role: "radio", "aria-checked": String(h === settingsState.dayStartHour), text: hourLabel(h),
          onclick: () => { settingsState.dayStartHour = h; draw(`.st-pill[aria-checked="true"]`); } }))),
      el("p", { class: "note st-example", role: "status", text: exampleLine(settingsState.dayStartHour) }),
      // caption(12px)이 너무 작고 면에 붙어 있었다 — 위 lede와 같은 본문 크기(muted)로 올리고 면과 16px(sp-4) 뗀다.
      el("p", { class: "lede st-day-note", text: "이미 쓴 기록의 날짜는 바뀌지 않아요." })));
    if (focusSel) main.querySelector(focusSel)?.focus();
  }
  draw();
}

// ══════════════════════ 4. 개인정보 안내 #/settings/privacy (IA G3) ══════════════════════
function infoRow(seq, icon, name, ...desc) {
  return el("div", { class: "st-row st-info-row" }, iconFrame(icon, seq),
    el("div", { class: "st-info-body" }, el("p", { class: "st-info-name", text: name }), el("p", { class: "st-info-desc" }, ...desc)));
}
function renderPrivacy(main, navigate) {
  main.replaceChildren(el("div", { class: "screen settings-sub st-privacy" },
    ...subHead(navigate, "개인정보 안내"),
    el("div", { class: "st-rows st-rows-info" },
      // ① SAFETY_POLICY §6 원문 뜻: 직접 작성 원문은 자동으로 스캔하지 않는다.
      infoRow(0, ICONS.lock, "직접 쓴 일기는 그대로예요", "자동으로 분석하거나 감시하지 않아요. 위기 상황에서는 아래 '도움이 필요할 때 보기'에서 바로 연락해 주세요."),
      // ② AI_RAG_SPEC 53줄 "분석 기본 입력 = 기간·기록 수·감정 이름·크기 집계·상황의 최소 발췌, 전체 일기는 필요가 확인된 경우만"의 범위 그대로 쓴다 — '일기 전체를 보내지 않는다'고 단정하지 않는다(정본은 필요가 확인되면 제한적으로 포함할 수 있다). '켤 때만'은 D-018 후행·옵트인 전제.
      infoRow(1, ICONS.bubble, "AI 분석을 켜면", "AI 분석은 켤 때만 쓰여요. 기간·감정·크기 같은 요약과 꼭 필요한 짧은 발췌를 보내요. 일기 전체는 꼭 필요하다고 확인된 때에만 일부로 보내요."),
      // ③ DATA_MODEL §8 보존: 화면에서는 바로 사라지지만 백업 소거는 지연될 수 있다(D-081 ①의 설정 문구를 옮겼다).
      infoRow(2, ICONS.trash, "보관과 삭제", "지운 기록은 화면에서 바로 사라지지만, 백업에서 완전히 지워지기까지 시간이 걸릴 수 있어요."),
      infoRow(3, ICONS.heart, "진단·치료 앱이 아니에요", "정신질환을 진단하거나 치료를 대신하지 않아요. 진료·상담 기록 같은 건강 정보는 여기에 적지 않는 게 좋아요. 힘든 순간에는 아래 도움을 참고해 주세요.")),

    // 위기 연락처는 위기 안내 화면(#/help, D-094)이 공식 출처로 확인한 번호로 보여 준다 — 여기에는 그리로 가는 알약만 둔다(같은 번호를 두 곳에 적지 않는다).
    // 위기 연락처 면과 같은 회색이 이어져 두 겹으로 보였다 — 알약을 글자만큼의 작은 크기로 줄이고(보이는 높이는 안쪽 st-pill-link-face가, 누르는 자리 44px는 바깥 a가 맡는다)
    // 24px(sp-6) 더 떼어 하나의 면처럼 붙어 보이지 않게 했다.
    el("a", { class: "st-pill-link st-help-link", href: "#/help", "aria-label": "도움이 필요할 때 보기" },
      el("span", { class: "st-pill-link-face" }, "도움이 필요할 때 보기", chevIcon()))));
}

// ══════════════════════ 5. 내 계정 #/settings/profile (D-104) ══════════════════════
// 머리는 가입 때의 이름 장면(먼 언덕 위 나의 돌 + 이름 칸) 그대로다. 줄은 부를 이름·로그인 방식 둘뿐 — 가입에서 받은 것이 이것뿐이다(이메일은 받지 않아 보이지 않는다).
// 탈퇴는 맨 아래 따로 떨어진 한 줄(영구 삭제와 같은 모양).
function renderProfile(main, navigate) {
  rowSeq = 0;
  const p = PROVIDERS[account.via];
  const scene = nameScene(account.name);
  main.replaceChildren(el("div", { class: "screen settings-sub st-profile" },
    ...subHead(navigate, "내 계정"),
    scene.node,
    el("p", { class: "st-profile-since", text: `${joinedLabel(account.joined)}부터 함께했어요` }),
    el("div", { class: "st-rows" },
      navRow({ icon: ICONS.person, name: "부를 이름", value: account.name, onclick: () => navigate("settings/name") }),
      el("div", { class: "st-row", role: "group", "aria-label": `로그인, ${p.label}로 연결됨` },
        el("span", { class: `st-ic-frame st-provider ${account.via}`, "aria-hidden": "true" }, providerMark(account.via)),
        el("span", { class: "st-row-name", "aria-hidden": "true", text: "로그인" }),
        el("span", { class: "st-row-trail", "aria-hidden": "true" }, el("span", { class: "st-row-value", text: `${p.label}로 연결됨` })))),
    el("p", { class: "note st-profile-note", text: "이메일·전화번호는 받지 않아요. 부를 이름과 로그인 연결 정보만 가지고 있어요." }),
    el("button", { type: "button", class: "st-delete-row st-leave-row", onclick: () => navigate("settings/leave") },
      el("span", { text: "계정 탈퇴" }), chevIcon())));
  scene.road();
}

// ══════════════════════ 6. 부를 이름 #/settings/name (D-104) ══════════════════════
// 가입과 같은 이름 장면·이름 칸 — 적는 대로 돌 아래 이름 칸이 바뀐다. 바뀐 것이 없거나 비어 있으면 '저장'은 흐리고, 누르면 이유를 버튼 위에 알린다(D-098 ③).
function renderName(main, navigate, params) {
  const scene = nameScene(account.name);
  const hint = el("p", { class: "blocked-hint au-hint", id: "stNameHint", hidden: true, role: "status" });
  const save = el("button", { type: "button", class: "btn primary big", text: "저장", "aria-describedby": "stNameHint", onclick: submit });
  const field = nameField("stName", account.name, (v) => { scene.set(v); sync(); });
  const problem = () => nameLength(field.input.value) < 1 ? "부를 이름을 적어 주세요." : cleanName(field.input.value) === account.name ? "지금 이름과 같아요." : null;
  function sync() { const bad = problem(); save.setAttribute("aria-disabled", String(Boolean(bad))); if (!bad) hint.hidden = true; }
  function submit() {
    const bad = problem();
    if (bad) { hint.textContent = bad; hint.hidden = false; field.input.focus(); return; }
    if (params?.get("s") === "fail") { toast("바꾸지 못했어요. 다시 시도해 주세요"); return; } // 저장 실패: 적은 이름은 그대로 둔다
    account.name = cleanName(field.input.value);
    navigate("settings/profile"); toast("부를 이름을 바꿨어요");
  }
  field.input.addEventListener("keydown", (ev) => { if (ev.key === "Enter" && !ev.isComposing) submit(); });
  main.replaceChildren(el("div", { class: "screen settings-sub st-name" },
    ...subHead(navigate, "부를 이름", { to: "settings/profile", label: "내 계정으로" }),
    scene.node, field.node,
    el("div", { class: "sd-actions" }, hint, save)));
  scene.road(); field.update();
}

// ══════════════════════ 7. 계정 탈퇴 — 두 단계 #/settings/leave → ?step=confirm (D-104, 사용자 2026-09-27 '탈퇴 UI를 다시 신경 써서') ══════════════════════
// ① 탈퇴하기 전에: 읽는 단계 — 지워지는 것(기록한 날 수까지)과 탈퇴 대신 할 수 있는 일 셋. 빨간색이 없고 '탈퇴 계속하기'는 회색 버튼이다(떠나는 쪽도 붙잡는 쪽도 밀지 않는다).
// ② 마지막으로 확인해요: 결심하는 단계 — 확인 문구 '계정 탈퇴'를 직접 입력해야 풀리는 빨간 '탈퇴하기' 하나. 영구 삭제와 같은 무게(UX_SPEC §7·§13).
// 은유(친구·조약돌 그림)는 쓰지 않고 설정 줄·조약돌 면 아이콘·말투로만 무드를 잇는다(D-091). QA: #/settings/leave?step=confirm&s=fail(탈퇴 실패)
function recordedDays() { // 가입한 날부터 오늘까지 완료·임시저장인 날 수(시안은 예시 기록 기준)
  const [y, m, d] = account.joined.split("-").map(Number);
  const today = effectiveToday(); let n = 0;
  for (const day = new Date(y, m - 1, d); day <= today; day.setDate(day.getDate() + 1)) if (["completed", "draft"].includes(dayStatus(day, today))) n++;
  return n;
}
function renderLeave(main, navigate, params) {
  rowSeq = 0;
  const via = PROVIDERS[account.via].label, days = recordedDays();
  const [, jm, jd] = account.joined.split("-").map(Number);
  if (params?.get("step") === "confirm") return renderLeaveConfirm(main, navigate, params, days);
  main.replaceChildren(el("div", { class: "screen settings-sub st-leave" },
    ...subHead(navigate, "탈퇴하기 전에", { to: "settings/profile", label: "내 계정으로" }),
    el("p", { class: "lede st-leave-lede", text: "탈퇴하면 아래 것이 모두 지워지고, 되돌릴 수 없어요." }),
    // 무게를 숫자 하나로(사용자 '가독성이 안 좋다' — 요약·목록·설명이 같은 말을 세 번 했다). 면은 옅은 언덕색의 조약돌 모양 — 무드는 모양·색만(이름·돌·친구는 두지 않는다, 떠나는 사람을 붙잡지 않게).
    leaveSummary(days, jm, jd),
    el("h2", { class: "st-group-head st-leave-head", text: "지워지는 것" }),
    el("ul", { class: "st-leave-list", role: "list" },
      [[ICONS.note, "기록"], [ICONS.person, `계정과 ${via} 연결`], [ICONS.chart, "분석 결과와 설정"]].map(([icon, name]) => el("li", {}, iconFrame(icon, rowSeq++), el("span", { text: name })))),
    el("h2", { class: "st-group-head st-leave-head", text: "대신 이런 방법도 있어요" }),
    el("div", { class: "st-rows" },
      navRow({ icon: ICONS.download, name: "내 기록 내보내기", onclick: () => navigate("settings/export") }),
      navRow({ icon: ICONS.trash, name: "기록만 지우기", onclick: () => navigate("settings/delete") }),
      navRow({ icon: ICONS.logout, name: "로그아웃만 하기", onclick: () => openLogoutSheet(navigate, params) })),
    el("div", { class: "sd-actions" },
      el("button", { type: "button", class: "btn secondary big", text: "탈퇴 계속하기", onclick: () => navigate("settings/leave?step=confirm") }),
      el("button", { type: "button", class: "btn text", text: "그만두기", onclick: () => navigate("settings/profile") }))));
}
// 요약 면(사용자 2026-09-27 초안 셋 중 S1): 옅은 언덕색 둥근 네모 면에 '기록 N일 · O월 O일부터', 오른쪽에 작은 조약돌 조각 셋(언덕 세 색).
// 무드는 모양·색만 — 이름 붙은 돌·친구는 두지 않는다. ① 탈퇴하기 전에와 ② 마지막으로 확인해요가 같은 면을 쓴다(같은 정보는 같은 모양, 초안 G3).
function leaveSummary(days, jm, jd) {
  const peb = (cls) => el("i", { class: `st-sum-peb ${cls}` });
  return el("div", { class: "st-leave-sum" },
    el("div", { class: "st-sum-text" }, el("b", { text: `기록 ${days}일` }), el("span", { text: `${jm}월 ${jd}일부터` })),
    el("span", { class: "st-sum-pebs", "aria-hidden": "true" }, peb("a"), peb("b"), peb("c")));
}
const LEAVE_PHRASE = "계정 탈퇴";
// 떠나는 이유(사용자 2026-09-27 '선택형으로'): 고르지 않아도 탈퇴된다 — 필수로 막으면 탈퇴가 가입보다 무거워지고(개인정보보호법 동의 철회 취지) 억지 응답만 쌓인다.
// 여럿 고르기 알약(작성 흐름의 세부 감정 알약 .choice와 같은 부품). 계정과 연결하지 않은 익명 집계로만 남긴다는 전제이고, 고른 이유에 따라 붙잡는 제안을 띄우지 않는다.
const LEAVE_REASONS = ["기록할 시간이 없어요", "기록이 오히려 부담돼요", "원하는 기능이 없어요", "다른 앱을 써요", "개인정보가 걱정돼요", "기타"];
function leaveReasons() {
  const other = el("input", { type: "text", class: "sd-confirm-input st-reason-other", maxlength: "100", placeholder: "짧게 적어 주세요(선택)", "aria-label": "기타 이유", hidden: true });
  const chips = LEAVE_REASONS.map((label) => {
    const b = el("button", { type: "button", class: "choice", "aria-pressed": "false", onclick: () => {
      const on = b.getAttribute("aria-pressed") !== "true";
      b.setAttribute("aria-pressed", String(on));
      if (label === "기타") { other.hidden = !on; if (on) other.focus(); else other.value = ""; }
      announce(`${label} ${on ? "선택됨" : "선택 해제됨"}`);
    } }, el("span", { class: "ck", "aria-hidden": "true", text: "✓" }), el("span", { text: label }));
    return b;
  });
  return el("div", { class: "st-reasons" },
    el("p", { class: "field-label", id: "stReasonsLabel" }, "떠나는 이유 ", el("span", { class: "st-optional", text: "선택" })),
    el("p", { class: "note st-reasons-note", text: "알려 주면 더 나은 앱을 만드는 데 써요. 계정과 연결하지 않고 익명으로만 모아요." }),
    el("div", { class: "st-reason-chips", role: "group", "aria-labelledby": "stReasonsLabel" }, chips),
    other);
}
function renderLeaveConfirm(main, navigate, params, days) { // 결심하는 단계 — 요약 면·본문 한 문단·떠나는 이유(선택)·확인 문구
  const input = el("input", { type: "text", class: "sd-confirm-input", id: "sdLeaveConfirm", "aria-describedby": "sdLeavePhrase", autocomplete: "off", autocapitalize: "off", spellcheck: false });
  const go = el("button", { type: "button", class: "btn danger big", text: "탈퇴하기", disabled: true, onclick: () => {
    if (input.value !== LEAVE_PHRASE) return;
    if (params?.get("s") === "fail") { toast("탈퇴하지 못했어요. 기록은 그대로예요. 잠시 뒤 다시 시도해 주세요"); return; }
    navigate("settings/left");
  } });
  input.addEventListener("input", () => { go.disabled = input.value !== LEAVE_PHRASE; });
  const [, jm, jd] = account.joined.split("-").map(Number);
  main.replaceChildren(el("div", { class: "screen settings-sub sd-delete st-leave st-leave-confirm" },
    ...subHead(navigate, "마지막으로 확인해요", { to: "settings/leave", label: "탈퇴하기 전으로" }),
    leaveSummary(days, jm, jd), // 지워지는 무게를 결심하는 자리에서 한 번 더(초안 G3) — 입력 칸과 버튼 사이의 빈 공간 문제도 이것이 메운다
    el("p", { class: "st-leave-say", text: `${account.name} 님의 계정과 기록 ${days}일이 지워져요. 같은 ${PROVIDERS[account.via].label} 계정으로 다시 가입해도 돌아오지 않아요.` }),
    leaveReasons(),
    el("div", { class: "field sd-confirm-field st-leave-field" },
      el("label", { for: "sdLeaveConfirm", class: "field-label", text: "확인하려면 아래 문구를 그대로 입력해요" }),
      el("p", { id: "sdLeavePhrase", class: "sd-confirm-phrase", text: LEAVE_PHRASE }),
      input),
    // 기간 숫자를 적지 않는다(DATA_MODEL §8) — 백업·공급자 쪽 보존 지연만 정직하게 미리 알린다
    el("p", { class: "note st-leave-note", text: "백업이나 서비스 제공사 쪽에는 정해진 기간 동안 남을 수 있어요." }),
    el("div", { class: "sd-actions" }, go,
      el("button", { type: "button", class: "btn text", text: "그만두기", onclick: () => navigate("settings/profile") }))));
}

// ══════════════════════ 진입점 ══════════════════════
// 하위 화면 이름 — main.js가 이 목록에 있는 경로만 전체 화면(하단 탐색 없음)으로 만든다.
export const SETTINGS_PAGES = ["reminder", "day", "privacy", "export", "delete", "deleted", "profile", "name", "leave", "left"];
export function renderSettings(main, navigate, params, rest = []) {
  const sub = rest[0];
  if (sub === "reminder") return renderReminder(main, navigate, params);
  if (sub === "day") return renderDayStart(main, navigate);
  if (sub === "privacy") return renderPrivacy(main, navigate);
  if (sub === "export") return renderExport(main, navigate, params);
  if (sub === "delete") return renderDelete(main, navigate, params);
  if (sub === "deleted") return renderDeleted(main, navigate);
  if (sub === "profile") return renderProfile(main, navigate);
  if (sub === "name") return renderName(main, navigate, params);
  if (sub === "leave") return renderLeave(main, navigate, params);
  if (sub === "left") return renderLeft(main, navigate);
  return renderList(main, navigate, params);
}
