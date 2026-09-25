// 설정: 목록 → 하위 화면(D-091 ④⑤). 목록 줄은 '옅은 조약돌 면 아이콘 + 이름 + 지금 값(muted) + ›' 한 모양(st-row)으로 통일하고 설명은 모두 하위 화면으로 옮긴다.
// 하위 화면 뼈대(뒤로 가기·h1)는 tabs.css의 .info-top·.back을 그대로 쓴다(기록 상세와 같은 원형 ‹). 내보내기·삭제 화면은 settings-data.js(Sub-I)가 채운다 — 여기서는 라우팅만 한다.
import { el, svgEl, announce } from "../dom.js";
import { openSheet } from "../components/sheet.js";
import { stoneImg } from "../data.js";
import { now } from "../state.js";
import { renderExport, renderDelete, renderDeleted } from "./settings-data.js";

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
  logout: () => ic("M9.8 4.6H6.4a2 2 0 0 0-2 2v10.8a2 2 0 0 0 2 2h3.4", "M11 12h9.2", "M17 8.4l3.6 3.6-3.6 3.6") // 접근 끊기
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
function group(title, rows) { return el("div", { class: "st-group" }, el("p", { class: "st-group-head", text: title }), el("div", { class: "st-rows" }, rows)); }

// ── 시각 표기 ──
const formatKoreanClock = (hhmm) => {
  const [hh, mm] = hhmm.split(":").map(Number);
  const period = hh < 12 ? "오전" : "오후"; let h12 = hh % 12; if (h12 === 0) h12 = 12;
  return mm === 0 ? `${period} ${h12}시` : `${period} ${h12}시 ${mm}분`;
};
const hourLabel = (h) => h === 0 ? "자정" : `새벽 ${h}시`;

// ── 하위 화면 공통 머리(뒤로 가기 + 제목) ──
function subHead(navigate, title) {
  return [el("div", { class: "info-top" }, el("button", { type: "button", class: "back", "aria-label": "설정으로", onclick: () => navigate("settings") }, backIcon())),
    el("h1", { tabindex: "-1", text: title })];
}

// ══════════════════════ 1. 설정 목록 #/settings ══════════════════════
function renderList(main, navigate) {
  rowSeq = 0;
  function toggleReminder() {
    settingsState.reminderOn = !settingsState.reminderOn;
    draw();
    main.querySelector(".st-switch-row .switch")?.focus();
  }
  function openAccessSheet() {
    openSheet({ title: "접근을 끊을까요?", body: [el("p", { text: "로그아웃하면 이 기기에서 다시 로그인해야 기록을 볼 수 있어요." })],
      primary: { text: "로그아웃", onclick: () => announce("로그아웃: 시안이라 동작하지 않습니다") }, secondary: { text: "취소" } });
  }
  function draw() {
    rowSeq = 0;
    main.replaceChildren(el("div", { class: "screen settings" },
      el("div", { class: "tb-body tb-rise" },
        el("h1", { tabindex: "-1", text: "설정" }),
        el("p", { class: "proto-note" }, el("span", { class: "proto-tag", text: "시안" }), " 이 화면의 동작은 자리만 있고 실제로 움직이지 않습니다."),
        // 나의 돌 머리(D-091 ⑥): 오늘 화면 가운데 돌의 쉬는 모습 + 신뢰 한 줄. 아래 목록의 값을 되풀이하지 않고, 누르면 개인정보 안내로 간다.
        el("button", { type: "button", class: "st-me", "aria-label": "나의 기록 공간. 내 기록은 나만 볼 수 있어요. 개인정보 안내 보기", onclick: () => navigate("settings/privacy") },
          stoneImg("rest"), el("span", { class: "st-me-text", "aria-hidden": "true" }, el("b", { text: "나의 기록 공간" }), el("span", { text: "내 기록은 나만 볼 수 있어요" })), chevIcon()),

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
        group("계정", [navRow({ icon: ICONS.logout, name: "접근 끊기", value: "로그아웃", onclick: openAccessSheet })]),

        el("button", { type: "button", class: "st-delete-row", onclick: () => navigate("settings/delete") },
          el("span", { text: "모든 기록 영구 삭제" }), chevIcon()))));
  }
  draw();
}

// ══════════════════════ 2. 알림 #/settings/reminder (D-081) ══════════════════════
function renderReminder(main, navigate) {
  function draw(focusSel) {
    rowSeq = 0;
    const on = settingsState.reminderOn;
    const isCustom = !PRESET_TIMES.includes(settingsState.reminderTime);
    const timeInput = el("input", { type: "time", class: "st-time-native", tabindex: "-1", "aria-hidden": "true", value: settingsState.reminderTime,
      onchange: (ev) => { if (ev.target.value) { settingsState.reminderTime = ev.target.value; draw(".st-pill.is-custom"); } } });
    const openPicker = () => { if (typeof timeInput.showPicker === "function") { try { timeInput.showPicker(); return; } catch { /* 지원 안 함 → 초점으로 대신 연다 */ } } timeInput.focus(); };
    const pillBtn = (checked, text, onclick, extraClass = "") => el("button", { type: "button", class: `st-pill${extraClass}`, role: "radio", "aria-checked": String(checked),
      "aria-disabled": on ? null : "true", text, onclick: on ? onclick : () => announce("작성 알림이 꺼져 있어요: 먼저 켜 주세요") });

    main.replaceChildren(el("div", { class: "screen settings-sub st-reminder" },
      ...subHead(navigate, "알림"),
      switchRow({ icon: ICONS.bell, name: "작성 알림", checked: on, onclick: () => { settingsState.reminderOn = !settingsState.reminderOn; draw(".st-switch-row .switch"); } }),

      el("div", { class: `st-block${on ? "" : " is-dim"}` },
        el("p", { class: "st-block-label", text: "알림 시각" }),
        el("div", { class: "st-pills", role: "radiogroup", "aria-label": "알림 시각" },
          ...PRESET_TIMES.map((t) => pillBtn(!isCustom && t === settingsState.reminderTime, formatKoreanClock(t), () => { settingsState.reminderTime = t; draw(); })),
          pillBtn(isCustom, isCustom ? formatKoreanClock(settingsState.reminderTime) : "다른 시각…", openPicker, isCustom ? " is-custom" : ""),
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

// ══════════════════════ 진입점 ══════════════════════
// 하위 화면 이름 — main.js가 이 목록에 있는 경로만 전체 화면(하단 탐색 없음)으로 만든다.
export const SETTINGS_PAGES = ["reminder", "day", "privacy", "export", "delete", "deleted"];
export function renderSettings(main, navigate, params, rest = []) {
  const sub = rest[0];
  if (sub === "reminder") return renderReminder(main, navigate);
  if (sub === "day") return renderDayStart(main, navigate);
  if (sub === "privacy") return renderPrivacy(main, navigate);
  if (sub === "export") return renderExport(main, navigate, params);
  if (sub === "delete") return renderDelete(main, navigate, params);
  if (sub === "deleted") return renderDeleted(main, navigate);
  return renderList(main, navigate);
}
