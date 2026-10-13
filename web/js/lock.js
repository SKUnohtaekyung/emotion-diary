// 앱 잠금 PIN(D-106, UX_SPEC §15). 선택 기능이고 기본은 꺼짐이다. 시안이라 PIN은 이 모듈 변수에만 있고 새로고침하면 사라진다 —
// 실제 앱에서는 평문으로 저장·전송·로그하지 않고 틀린 횟수는 검증하는 쪽에서 센다.
// QA: 주소의 # 앞에 ?lock=1을 붙이면 잠금이 걸린 채로 시작한다(예: /?lock=1#/today). 이때는 숫자 네 개면 열리고 0000만 틀린 것으로 본다.
import { el, svgEl, announce, reducedMotion } from "./dom.js";
import { openSheet, closeSheet } from "./components/sheet.js";

export const PIN_LENGTH = 4;
const MAX_WRONG = 5, REST_SECONDS = 30;
const DEMO = "*";
// resetting: 비밀번호를 잊어 다시 로그인하러 간 동안 참이다 — 그동안 main.js가 로그인 화면 밖으로 나가지 못하게 한다(잠금을 돌아서 들어오지 못하게). 로그인이 끝나면 auth.js가 옛 비밀번호를 지우고 이것을 푼다.
export const lock = { pin: new URLSearchParams(location.search).has("lock") ? DEMO : null, resetting: false };
export const hasPin = () => lock.pin != null;
export const setPin = (pin) => { lock.pin = pin; lock.resetting = false; };
export const clearPin = () => { lock.pin = null; };
export const checkPin = (value) => (lock.pin === DEMO ? value !== "0000" : value === lock.pin);

const eraseIcon = () => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d: "M9.2 5.5h9.3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9.2L3.5 12l5.7-6.5z" }), svgEl("path", { d: "M11.6 9.6l4.8 4.8M16.4 9.6l-4.8 4.8" }));

// 숫자판: 점 네 개 + 한 줄 안내 + 1~9·0·지우기. 네 자리가 차면 onComplete(값)을 부른다. 키보드 숫자·Backspace도 받는다(초점이 판 안에 있을 때).
// tone: "dark"는 숲 위(잠금 화면), "light"는 흰 바탕(설정에서 정하기).
export function pinPad({ tone = "light", label, onComplete }) {
  let value = "", resting = false;
  const dots = el("div", { class: "pin-dots", role: "img" }, ...Array.from({ length: PIN_LENGTH }, () => el("i")));
  const status = el("p", { class: "pin-status" }); // 읽어 주기는 announce가 맡는다 — 여기에 role=status를 두면 같은 말이 두 번 읽히고 쉬는 동안 초가 매번 읽힌다
  const paint = () => {
    [...dots.children].forEach((dot, i) => dot.classList.toggle("on", i < value.length));
    dots.setAttribute("aria-label", `${label}, ${PIN_LENGTH}자리 중 ${value.length}자리 눌렀어요`);
  };
  const press = (digit) => {
    if (resting || value.length >= PIN_LENGTH) return;
    value += digit; paint();
    if (value.length === PIN_LENGTH) { const done = value; setTimeout(() => { if (node.isConnected && value === done) onComplete(done); }, 140); } // 마지막 점이 채워지는 것을 보여 준 뒤 넘긴다
  };
  const erase = () => { if (resting) return; value = value.slice(0, -1); paint(); };
  const key = (digit) => el("button", { type: "button", class: "pin-key", text: digit, onclick: () => press(digit) });
  const keys = el("div", { class: "pin-keys" }, ...["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(key), el("span", { "aria-hidden": "true" }), key("0"),
    el("button", { type: "button", class: "pin-key pin-erase", "aria-label": "한 자리 지우기", onclick: erase }, eraseIcon()));
  const node = el("div", { class: `pin-pad pin-${tone}` }, dots, status, keys);
  // 키보드 숫자·Backspace. 장면(lockScene)이 자기 안의 어디에 초점이 있든 이 함수로 넘긴다 — 판 안에만 달면 제목이나 '잊었어요'에 초점이 있을 때 먹지 않는다.
  const onKey = (ev) => {
    if (/^[0-9]$/.test(ev.key)) { ev.preventDefault(); press(ev.key); }
    else if (ev.key === "Backspace") { ev.preventDefault(); erase(); }
  };
  paint();
  return {
    node, onKey,
    focus: () => keys.querySelector(".pin-key").focus({ preventScroll: true }),
    // 비우고 한 줄 안내를 바꾼다. shake는 틀렸을 때 점을 한 번 흔든다(움직임 줄이기에서는 흔들지 않는다).
    reset(message = "", { shake = false } = {}) {
      value = ""; paint(); status.textContent = message; if (message) announce(message);
      if (shake && !reducedMotion()) { dots.classList.remove("shake"); void dots.offsetWidth; dots.classList.add("shake"); }
    },
    rest(on) { resting = on; node.classList.toggle("resting", on); keys.querySelectorAll("button").forEach((b) => { b.disabled = on; }); },
    say(message) { status.textContent = message; }
  };
}

// 숲 장면 한 장: 로딩과 같은 숲 그림 위에 제목·작은 글·숫자판을 둔다. 잠금 화면(화면을 덮는 층)과 비밀번호 정하기(설정 하위 화면, inline)가 같이 쓴다 —
// 정할 때 본 화면이 매일 풀 때 보는 화면과 같아야 손과 눈이 그대로 옮겨 간다. 화면의 말은 'PIN'이 아니라 '비밀번호'다(UX_SPEC §6.1 쉬운 말 — 로그인은 소셜뿐이라 다른 비밀번호와 헷갈릴 일이 없다).
let sceneSeq = 0;
export function lockScene({ title, note = "", pad, back = null, footer = null, inline = false }) {
  const titleEl = el("h1", { id: `lockTitle${++sceneSeq}`, class: "lock-title", tabindex: "-1", text: title }); // 정하기 화면 위에 잠금이 뜨면 장면이 둘이라 id를 따로 준다
  const noteEl = el("p", { class: "lock-note", text: note });
  const node = el("div", { class: `lock${inline ? " lock-inline" : ""}` },
    el("div", { class: "lock-box", "aria-hidden": "true" }, el("img", { class: "lock-art", src: "splash.svg", alt: "" })),
    el("div", { class: "lock-body" }, back, titleEl, noteEl, pad.node, footer));
  // 키보드 숫자는 초점이 어디에 있든(제목·'잊었어요'·아무 데도 없음) 이 장면이 화면에 있는 동안 받는다. 시트 안에서 누른 키와,
  // 잠금이 위에 떠 있을 때 그 아래 장면(비밀번호 정하기)은 받지 않는다. 장면이 사라지면 리스너도 스스로 뗀다.
  const onDocKey = (ev) => {
    if (!node.isConnected) { document.removeEventListener("keydown", onDocKey); return; }
    if (ev.target.closest?.(".sheet") || (shown && shown !== node)) return;
    pad.onKey(ev);
  };
  document.addEventListener("keydown", onDocKey);
  return { node, title: titleEl, note: noteEl };
}

// 잠금 화면: 로딩 → 잠금 → 오늘이 한 장면으로 이어진다. 앱 내용은 그 아래에서 inert다.
let shown = null;
export function showLock({ onForgot } = {}) {
  if (!hasPin() || shown) return Boolean(shown);
  const main = document.getElementById("main");
  // 잠그기 전에 열려 있던 시트·알림은 닫는다 — body 바로 아래에 있어 잠금 위로 비치고 눌린다(지우기 확인 시트 등).
  closeSheet(); document.querySelectorAll(".toast").forEach((n) => n.remove());
  let wrong = 0, timer = null, held = [];
  const unlock = ({ quiet = false } = {}) => {
    clearInterval(timer);
    const node = shown; shown = null;
    held.forEach((n) => n.removeAttribute("inert"));
    document.body.classList.remove("is-locked");
    if (!quiet) announce("잠금을 풀었어요");
    const gone = () => { node.remove(); main.querySelector("h1")?.focus({ preventScroll: true }); };
    if (reducedMotion()) gone(); else node.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: "ease-out", fill: "forwards" }).finished.then(gone, gone);
  };
  const pad = pinPad({ tone: "dark", label: "잠금 비밀번호", onComplete: (value) => {
    if (checkPin(value)) { unlock(); return; }
    wrong += 1;
    if (wrong < MAX_WRONG) { pad.reset("맞지 않아요. 다시 눌러 주세요.", { shake: true }); return; }
    // 다섯 번 틀리면 숫자판이 잠시 쉰다. 시안은 화면에서만 세지만 실제 앱은 검증하는 쪽에서 센다.
    wrong = 0; pad.reset("", { shake: true }); pad.rest(true);
    let left = REST_SECONDS;
    const tick = () => { if (left <= 0) { clearInterval(timer); pad.rest(false); pad.reset(""); pad.focus(); announce("다시 누를 수 있어요"); return; } pad.say(`잠시 쉬었다가 다시 눌러요. ${left--}초`); };
    announce(`다섯 번 맞지 않았어요. ${REST_SECONDS}초 뒤에 다시 누를 수 있어요.`);
    tick(); timer = setInterval(tick, 1000);
  } });
  const forgot = el("button", { type: "button", class: "lock-forgot", text: "비밀번호를 잊었어요", onclick: () => openSheet({
    title: "비밀번호를 잊었나요?", body: [el("p", { text: "다시 로그인하면 새 비밀번호를 정할 수 있어요. 기록은 그대로 있어요." })],
    primary: { text: "다시 로그인하기", onclick: () => onForgot?.(unlock) }, secondary: { text: "닫기" } }) });
  shown = lockScene({ title: "비밀번호를 눌러 주세요", pad, footer: forgot }).node;
  shown.id = "lock"; shown.setAttribute("role", "dialog"); shown.setAttribute("aria-modal", "true"); shown.setAttribute("aria-labelledby", shown.querySelector(".lock-title").id);
  // 잠금 층 말고는 모두 inert(건너뛰기 링크·시안 띠·본문·하단 탐색). 읽어 주기 칸(#live)만 남긴다. 잠금이 여는 시트는 이 뒤에 붙으므로 걸리지 않는다.
  held = [...document.body.children].filter((n) => n.id !== "live" && !n.hasAttribute("inert"));
  held.forEach((n) => n.setAttribute("inert", ""));
  document.body.classList.add("is-locked");
  document.body.append(shown);
  pad.focus();
  return true;
}

// 떠났다 돌아올 때(D-106 ③④): 화면을 떠나는 순간 숲 그림으로 가리고(앱 전환 화면에 일기가 비치지 않게), 돌아왔을 때 떠난 지 5분이 넘었으면 잠금 화면으로 바꾼다.
// 5분 안이면 가림만 걷는다. 가림은 최선의 노력이다 — 기기가 전환 화면을 찍는 때가 이 신호보다 빠를 수 있어 실기기 확인이 남아 있다(이슈 #5).
// QA: 주소의 # 앞에 ?lockafter=10 처럼 초를 주면 5분 대신 그 시간을 쓴다.
const AWAY_LIMIT_MS = (Number(new URLSearchParams(location.search).get("lockafter")) || 5 * 60) * 1000;
export function watchAway(options) {
  let leftAt = 0, cover = null;
  const hide = () => {
    if (!hasPin() || shown || lock.resetting || cover) return;
    leftAt = Date.now();
    cover = el("div", { class: "lock lock-cover", "aria-hidden": "true" }, el("div", { class: "lock-box" }, el("img", { class: "lock-art", src: "splash.svg", alt: "" })));
    document.body.append(cover);
  };
  const back = () => {
    if (!cover) return;
    const node = cover; cover = null;
    if (hasPin() && Date.now() - leftAt >= AWAY_LIMIT_MS) showLock(options); // 잠금 화면이 같은 그림으로 그 위에 올라온 뒤 가림을 걷는다(사이에 내용이 비치지 않는다)
    node.remove();
  };
  document.addEventListener("visibilitychange", () => (document.hidden ? hide() : back()));
  window.addEventListener("pagehide", hide);
  window.addEventListener("pageshow", back);
}
