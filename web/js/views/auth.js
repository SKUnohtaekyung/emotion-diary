// 로그인·가입·가입 완료(공개 서비스 시안, D-104). 실제 인증은 없다 — 누르면 잠깐 '연결하는 중'을 보인 뒤 다음 화면으로 간다.
// 모든 화면이 이야기의 언덕·흰 길·나의 돌로 이어진다(사용자 2026-09-27 '모두 우리 스토리·디자인 무드로').
// ① #/auth 로그인: '시작하기 전에'의 언덕·길·나의 돌이 그대로 이어지고, 소셜 버튼 세 개가 가까운 언덕 위에 선다. 처음 온 사람과 다시 온 사람이 같은 화면을 쓴다.
// ② #/auth/join 가입: 나의 돌 아래 이름 칸에 부를 이름을 붙인다 + 필수 동의 셋(만 14세 이상·이용약관·개인정보). 그 밖의 정보는 묻지 않는다(사용자 결정 '최소만').
// ③ #/auth/done 가입 완료: 그림 한 장 — 길 끝의 나의 돌 아래 이름 칸이 앉고, 돌 뒤 크림빛이 은은하게 숨 쉰다. 오늘 화면처럼 돌(또는 '오늘 시작하기')을 누르면 들어간다.
// QA: #/auth?from=welcome(뒤로 가기) · ?s=returning(있는 계정 → 오늘) · ?s=cancel(연결 취소) · ?s=error(연결 오류) · ?s=offline · ?s=expired(다시 들어오기)
//     · ?s=left(다른 기기에서 탈퇴됨) · ?s=loggedout(로그아웃 직후) · ?last=kakao|apple|google(지난번에 쓴 방법 표시)
//     #/auth/join?via=kakao|apple|google · &s=fail(가입 저장 실패) · #/auth/done
import { el, svgEl, announce, toast, reducedMotion } from "../dom.js";
import { openSheet } from "../components/sheet.js";
import { hillGround } from "./welcome.js";
import { account, PROVIDERS, NAME_MAX, cleanName, nameLength } from "../account.js";
import { todayISO } from "../state.js";

const chevron = (d, cls) => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: cls ?? null }, svgEl("path", { d }));
const BACK_D = "M14.5 5.5 8 12l6.5 6.5", CHEV_D = "M9.5 5.5 16 12l-6.5 6.5";
const OUT = "cubic-bezier(.16,1,.3,1)";

// 이 기기에서 지난번에 쓴 로그인 방법(이 기기에만 기억한다 — 이메일을 받지 않아 방법을 바꾸면 다른 계정이 되므로 알아보게 돕는다, IA 예외).
const LAST_KEY = "hon-last-provider";
const readLast = () => { try { return localStorage.getItem(LAST_KEY); } catch { return null; } };
const writeLast = (code) => { try { localStorage.setItem(LAST_KEY, code); } catch { /* 저장이 막혀도 로그인은 된다 */ } };

// 로그인 제공자 표시. 시안의 근사 그림이다 — 실제 배포 전에 각 회사의 공식 로그인 버튼 자료로 바꾼다(D-104).
export function providerMark(code) {
  if (code === "kakao") return svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "au-mark" },
    svgEl("path", { fill: "currentColor", d: "M12 4C7 4 3 7.1 3 11c0 2.5 1.7 4.7 4.2 6l-1 3.6c-.1.3.3.6.6.4l4.3-2.8c.3 0 .6.1.9.1 5 0 9-3.1 9-7.1S17 4 12 4z" }));
  if (code === "apple") return svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "au-mark" },
    svgEl("path", { fill: "currentColor", d: "M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.2.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.2.9-1.3 1.3-2.5 1.3-2.6 0 0-2.5-1-2.5-3.7zM14.1 5.8c.6-.8 1.1-1.8 1-2.8-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.7-1 2.7 1 .1 2-.5 2.7-1.3z" }));
  return svgEl("svg", { viewBox: "0 0 48 48", "aria-hidden": "true", class: "au-mark" },
    svgEl("path", { fill: "#FFC107", d: "M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" }),
    svgEl("path", { fill: "#FF3D00", d: "M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" }),
    svgEl("path", { fill: "#4CAF50", d: "M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" }),
    svgEl("path", { fill: "#1976D2", d: "M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" }));
}

// ── 이름 장면: 먼 언덕 위 나의 돌 + 그 아래 ink 이름 칸(언덕 위에는 ink 알약만 — land 토큰 규칙). 가입·내 계정·이름 바꾸기가 같이 쓴다. ──
// 빈 이름이면 이름 칸은 점선 테두리에 '이름'만 흐리게 보인다. set(name)으로 적는 대로 바뀐다. 그림은 장식이다(aria-hidden) — 이름은 입력 칸이 읽힌다.
export function nameScene(name = "") {
  const g = hillGround({ top: 0, anchor: "top", stoneW: 48 });
  const tagText = el("span");
  const tag = el("span", { class: "au-tag", style: { "--tag-top": g.stoneBottom } }, tagText);
  g.ground.append(tag);
  const node = el("div", { class: "au-scene", "aria-hidden": "true" }, g.ground);
  const set = (v) => { const s = cleanName(v); tag.classList.toggle("empty", !s); tagText.textContent = s || "이름"; };
  set(name);
  return { node, set, road: g.road };
}

// ══════════════════════ ① 로그인 #/auth ══════════════════════
function renderSignIn(main, navigate, params) {
  const s = params.get("s"), expired = s === "expired", left = s === "left";
  const offline = s === "offline" || !navigator.onLine;
  const last = PROVIDERS[params.get("last")] ? params.get("last") : readLast();
  const { ground, road } = hillGround({ extra: 100 });
  let busy = false;
  const buttons = Object.entries(PROVIDERS).map(([code, p]) => {
    const label = el("span", { class: "au-provider-label", text: p.button });
    const isLast = code === last && !left;
    const b = el("button", { type: "button", class: `au-provider ${code}`, "aria-label": isLast ? `${p.button}, 지난번에 쓴 방법` : null,
      "aria-disabled": offline ? "true" : null, onclick: () => connect(code, b, label) },
      providerMark(code), label, isLast ? el("span", { class: "au-last", "aria-hidden": "true", text: "최근" }) : null);
    return b;
  });

  const reset = (b, label, code) => {
    busy = false; buttons.forEach((x) => x.removeAttribute("aria-disabled"));
    b.classList.remove("is-busy"); b.removeAttribute("aria-busy"); label.textContent = PROVIDERS[code].button;
  };
  // 누르면 그 버튼만 '연결하는 중…'이 되고 나머지는 잠시 잠긴다(두 번 눌러 두 창이 뜨지 않게). 시안은 0.9초 뒤 넘어간다.
  function connect(code, b, label) {
    if (offline) { toast("인터넷에 연결되면 들어올 수 있어요"); return; }
    if (busy) return;
    busy = true;
    buttons.forEach((x) => { x.setAttribute("aria-disabled", "true"); });
    b.classList.add("is-busy"); b.setAttribute("aria-busy", "true");
    label.textContent = `${PROVIDERS[code].with} 연결하는 중…`;
    announce(label.textContent);
    setTimeout(() => {
      if (!b.isConnected) return;
      // 제공자 창을 닫았거나(취소) 연결이 끝나지 않았다(오류) — 탓하지 않고 그대로 다시 누를 수 있게 되돌린다
      if (s === "cancel" || s === "error") {
        reset(b, label, code); b.focus();
        toast(s === "cancel" ? "연결을 마치지 못했어요. 다시 눌러 주세요" : "지금은 연결이 어려워요. 잠시 뒤 다시 시도해 주세요"); return;
      }
      writeLast(code);
      if (s === "returning" || expired) { account.via = code; navigate("today"); toast(expired ? "다시 들어왔어요. 쓰던 글은 그대로예요" : `돌아와서 반가워요, ${account.name} 님`); return; }
      navigate(`auth/join?via=${code}`);
    }, 900);
  }

  const back = params.get("from") === "welcome"
    ? el("button", { type: "button", class: "ob-back", "aria-label": "시작하기 전에로 돌아가기", onclick: () => navigate("welcome?p=2") }, chevron(BACK_D))
    : null;
  const copy = expired ? ["잠시 자리를 비운 사이", ["다시 들어와", "주세요"], "한동안 쓰지 않아 안전하게 로그아웃했어요. 쓰던 글은 그대로 있어요."]
    : left ? ["나의 기록 공간", ["이 계정은", "탈퇴했어요"], "다른 기기에서 탈퇴한 계정이에요. 새로 시작하려면 다시 가입해요."]
    : ["나의 기록 공간", ["매일의 마음이", "머무는 곳"], "쓰던 계정으로 들어오면 기록이 그대로 이어져요."];
  const caption = offline ? "인터넷에 연결되면 들어올 수 있어요." : "처음이라면 연결한 뒤 부를 이름만 정하면 돼요.";

  main.replaceChildren(el("div", { class: "screen au au-signin" },
    el("div", { class: "au-top" }, back),
    el("div", { class: "au-body" },
      el("p", { class: "au-eyebrow", text: copy[0] }),
      el("h1", { tabindex: "-1" }, copy[1][0], el("br"), copy[1][1]),
      el("p", { class: "au-lede", text: copy[2] })),
    el("div", { class: "au-ground-wrap" }, ground,
      el("div", { class: "au-actions", role: "group", "aria-label": "로그인 방법" }, ...buttons,
        el("p", { class: `au-caption${offline ? " is-offline" : ""}`, role: offline ? "status" : null, text: caption })))));
  road();
  if (s === "loggedout") toast("로그아웃했어요");
}

// ══════════════════════ ② 가입 #/auth/join ══════════════════════
// 동의 항목. 문서 내용은 시안 요약이다 — 실제 약관·처리방침은 법률 검토를 거쳐 채운다(D-104).
const TERMS = [
  { key: "age", label: "만 14세 이상이에요", sheet: null },
  { key: "terms", label: "이용약관", sheet: () => ({ title: "이용약관", body: [
    el("p", { class: "au-sheet-note", text: "시안이에요. 실제 약관은 법률 검토를 거쳐 채워요." }),
    el("ul", { class: "au-sheet-list" },
      el("li", { text: "이 앱은 감정을 기록하고 돌아보는 도구예요. 진단이나 치료를 대신하지 않아요." }),
      el("li", { text: "내가 쓴 기록의 주인은 나예요. 언제든 내보내거나 지울 수 있어요." }),
      el("li", { text: "계정은 한 사람이 쓰고, 다른 사람에게 넘기지 않아요." }))] }) },
  { key: "privacy", label: "개인정보 수집·이용", sheet: () => ({ title: "개인정보 수집·이용", body: [
    el("p", { class: "au-sheet-note", text: "시안이에요. 보관 기간과 처리 위탁은 법률 검토를 거쳐 채워요." }),
    el("p", { class: "field-label au-sheet-head", text: "받는 것" }),
    el("ul", { class: "au-sheet-list" },
      el("li", { text: "부를 이름" }), el("li", { text: "로그인 연결 정보(연결한 회사가 주는 계정 번호)" }), el("li", { text: "내가 쓴 기록과 설정" })),
    el("p", { class: "field-label au-sheet-head", text: "받지 않는 것" }),
    el("ul", { class: "au-sheet-list muted" }, el("li", { text: "이메일·전화번호" }), el("li", { text: "성별·생년월일·직업" })),
    el("p", { class: "au-sheet-note", text: "받은 정보는 내 기록을 내 계정에만 보관하고, 다시 로그인했을 때 이어 보여 주는 데만 써요." })] }) }
];

const checkMark = () => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "au-check-mark" }, svgEl("path", { d: "M5.5 12.5 10 17l8.5-9.5" }));
// 동의 칸: 진짜 checkbox(label로 감싼다)를 화면에서만 숨기고 조약돌 면 체크를 그린다 — 키보드·화면 읽기는 기본 체크박스 그대로다.
function consentBox(id, text, { all = false, required = false } = {}) {
  const input = el("input", { type: "checkbox", id, class: "au-check-input" });
  const box = el("label", { for: id, class: `au-check${all ? " all" : ""}` }, input,
    el("span", { class: "au-check-face", "aria-hidden": "true" }, checkMark()),
    el("span", { class: "au-check-text" }, required ? el("span", { class: "au-req", text: "(필수)" }) : null, text));
  return { input, box };
}

// 이름 입력 칸(가입·이름 바꾸기 공통): 12자에서 멈추고(이모지 하나를 한 글자로 센다) 글자 수를 보인다. onChange는 칸이 바뀔 때마다.
export function nameField(id, value, onChange) {
  const input = el("input", { type: "text", id, class: "au-input", autocomplete: "nickname", enterkeyhint: "done", placeholder: "예: 하늘", "aria-describedby": `${id}Help ${id}Count` });
  input.value = value;
  const count = el("span", { id: `${id}Count`, class: "au-count", "aria-hidden": "true" });
  const update = () => { count.textContent = `${[...input.value].length}/${NAME_MAX}`; onChange(input.value); };
  input.addEventListener("input", () => { const cps = [...input.value]; if (cps.length > NAME_MAX) input.value = cps.slice(0, NAME_MAX).join(""); update(); });
  const node = el("div", { class: "field au-field" },
    el("label", { for: id, class: "field-label", text: "부를 이름" }), input,
    el("div", { class: "au-help-row" }, el("p", { id: `${id}Help`, class: "au-help", text: "앱이 나를 부를 때만 써요. 다른 사람에게 보이지 않아요." }), count));
  return { node, input, update };
}

function renderJoin(main, navigate, params) {
  const via = PROVIDERS[params.get("via")] ? params.get("via") : "kakao";
  const scene = nameScene("");
  const name = nameField("auName", "", (v) => { scene.set(v); sync(); });

  const all = consentBox("auAll", "모두 동의해요", { all: true });
  const items = TERMS.map((t) => ({ ...t, ...consentBox(`au-${t.key}`, t.label, { required: true }) }));
  function openTerm(t) {
    openSheet({ ...t.sheet(), primary: { text: "동의하고 닫기", onclick: () => { t.input.checked = true; syncAll(); sync(); } }, secondary: { text: "닫기" } });
  }
  const rows = items.map((t) => el("li", { class: "au-term" }, t.box,
    t.sheet ? el("button", { type: "button", class: "au-view", "aria-label": `${t.label} 보기`, onclick: () => openTerm(t) }, "보기", chevron(CHEV_D, "au-view-chev")) : null));
  const syncAll = () => { all.input.checked = items.every((t) => t.input.checked); };
  all.input.addEventListener("change", () => { items.forEach((t) => { t.input.checked = all.input.checked; }); sync(); });
  items.forEach((t) => t.input.addEventListener("change", () => { syncAll(); sync(); }));

  const hint = el("p", { class: "blocked-hint au-hint", id: "auHint", hidden: true, role: "status" });
  const start = el("button", { type: "button", class: "btn primary big", text: "시작하기", "aria-describedby": "auHint", onclick: submit });
  const missing = () => {
    const m = [];
    if (nameLength(name.input.value) < 1) m.push({ what: "name", focus: name.input });
    const unchecked = items.find((t) => !t.input.checked);
    if (unchecked) m.push({ what: "consent", focus: unchecked.input });
    return m;
  };
  function sync() {
    const m = missing();
    start.setAttribute("aria-disabled", String(m.length > 0 || start.classList.contains("is-busy")));
    if (!m.length) hint.hidden = true;
  }
  // 못 누르는 '시작하기'를 누르면 무엇이 남았는지 버튼 바로 위에 알리고 그 자리로 초점을 옮긴다(D-098 ③ — 빨강 오류가 아니라 ink 안내).
  function submit() {
    if (start.classList.contains("is-busy")) return;
    const m = missing();
    if (m.length) {
      hint.textContent = `${m.length > 1 ? "부를 이름과 필수 동의를" : m[0].what === "name" ? "부를 이름을" : "필수 동의를"} 채우면 시작할 수 있어요.`;
      hint.hidden = false; m[0].focus.focus(); return;
    }
    // 계정은 여기서 생긴다 — 연결만 하고 이 버튼을 누르지 않았다면 다음에 다시 이 화면으로 온다(IA 예외).
    start.style.minWidth = `${start.offsetWidth}px`; start.classList.add("is-busy"); start.textContent = "시작하는 중…"; sync();
    setTimeout(() => {
      if (!start.isConnected) return;
      if (params.get("s") === "fail") { // 저장 실패: 적은 이름·동의는 그대로 두고 다시 누르게 한다
        start.classList.remove("is-busy"); start.textContent = "시작하기"; sync(); toast("시작하지 못했어요. 다시 눌러 주세요"); start.focus(); return;
      }
      account.name = cleanName(name.input.value); account.via = via; account.joined = todayISO();
      navigate("auth/done");
    }, 700);
  }
  name.input.addEventListener("keydown", (ev) => { if (ev.key === "Enter" && !ev.isComposing) items[0].input.focus(); });

  const ageHelp = el("button", { type: "button", class: "au-link", onclick: () => openSheet({ title: "만 14세가 안 됐다면",
    body: [el("p", { text: "법에 따라 보호자가 함께 동의해야 가입할 수 있어요." }), el("p", { class: "au-sheet-note", text: "시안이에요. 보호자 동의 절차는 아직 정하지 않았어요." })],
    primary: { text: "알겠어요" } }) }, "만 14세가 안 됐나요?", chevron(CHEV_D, "au-view-chev"));
  // 이메일을 받지 않아 다른 로그인 방법은 다른 계정이 된다 — 예전에 다른 방법으로 가입했다면 그 방법으로 들어오게 안내한다(IA 예외).
  const otherWay = el("button", { type: "button", class: "au-link", onclick: () => openSheet({ title: "다른 방법으로 가입했나요?",
    body: [el("p", { text: `예전에 다른 방법으로 가입했다면 그 방법으로 들어와야 기록이 이어져요. ${PROVIDERS[via].label}로 새로 가입하면 빈 기록 공간이 새로 생겨요.` })],
    primary: { text: "다른 방법으로 들어가기", onclick: () => navigate("auth") }, secondary: { text: "여기서 계속하기" } }) }, "다른 방법으로 가입했나요?", chevron(CHEV_D, "au-view-chev"));

  main.replaceChildren(el("div", { class: "screen au au-join" },
    el("div", { class: "info-top" }, el("button", { type: "button", class: "back", "aria-label": "로그인으로", onclick: () => navigate("auth") }, chevron(BACK_D))),
    el("p", { class: "au-eyebrow au-via" }, el("span", { class: `au-via-mark ${via}` }, providerMark(via)), `${PROVIDERS[via].label}로 연결했어요`),
    el("h1", { tabindex: "-1", text: "뭐라고 불러 드릴까요?" }),
    scene.node,
    name.node,
    el("fieldset", { class: "field au-consent" },
      el("legend", { class: "field-label", text: "동의" }),
      all.box,
      el("ul", { class: "au-terms" }, rows),
      el("div", { class: "au-links" }, ageHelp, otherWay)),
    el("div", { class: "sd-actions" }, hint, start)));
  scene.road(); name.update();
}

// ══════════════════════ ③ 가입 완료 #/auth/done ══════════════════════
// 그림 한 장이 이야기의 입구다: 흰 길 끝의 나의 돌(조금 크게), 그 아래 이름 칸이 한 번 살며시 앉고, 돌 뒤 크림빛이 느리게 숨 쉰다. 그 밖의 움직임은 없다(사용자 '과하지 않게').
// 오늘 화면처럼 돌을 누르거나 '오늘 시작하기'를 누르면 오늘로 간다. 빛이 퍼지는 연출(쓰기의 시작, BRAND §5 빛)은 쓰지 않는다 — 그 순간은 오늘 화면의 돌에 남겨 둔다.
function renderDone(main, navigate) {
  const RM = reducedMotion();
  const g = hillGround({ extra: 70, stoneW: 64, glow: true });
  const tag = el("span", { class: "au-tag big", style: { "--tag-bottom": g.H - g.stoneBottom } }, el("span", { text: account.name }));
  const go = () => navigate("today");
  const stoneHit = el("span", { class: "au-stone-hit", "aria-hidden": "true", style: { "--stone-y": g.H - g.stoneCenter.y }, onclick: go });
  g.ground.append(tag, stoneHit);
  const start = el("button", { type: "button", class: "ob-start au-done-start", text: "오늘 시작하기", onclick: go });
  const h1 = el("h1", { tabindex: "-1", text: `반가워요, ${account.name} 님` });
  const lede = el("p", { class: "au-lede", text: "길 끝의 이 돌이 나의 자리예요. 매일의 마음을 여기서부터 적어요." });
  const eyebrow = el("p", { class: "au-eyebrow", text: "나의 기록 공간" });
  const screen = el("div", { class: "screen au au-done" },
    el("div", { class: "au-top" }),
    el("div", { class: "au-body" }, eyebrow, h1, lede),
    el("div", { class: "au-ground-wrap" }, g.ground, start));
  main.replaceChildren(screen);
  g.road();
  if (RM) return;
  // 들어올 때 한 번: 글이 차례로 오르고(시작하기 전에와 같은 결), 이름 칸이 돌 아래로 살며시 앉는다. 크림빛 숨은 CSS가 맡는다.
  [eyebrow, h1, lede].forEach((n, k) => n.animate([{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], { duration: 620, delay: 120 + k * 90, easing: OUT, fill: "both" }));
  tag.animate([{ opacity: 0, transform: "translate(-50%, 10px) scale(.96)" }, { opacity: 1, transform: "translate(-50%, 0)" }], { duration: 700, delay: 650, easing: OUT, fill: "both" });
  start.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 1100, easing: "ease-out", fill: "both" });
}

export function renderAuth(main, navigate, params, rest = []) {
  if (rest[0] === "join") return renderJoin(main, navigate, params);
  if (rest[0] === "done") return renderDone(main, navigate);
  return renderSignIn(main, navigate, params);
}
