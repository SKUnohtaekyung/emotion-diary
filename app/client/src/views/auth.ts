// 열쇠 화면 `#/auth` (UX_SPEC §16 상태 표 전부). 접근 열쇠는 이 칸으로만 받는다 — 주소나 링크로 받는 길은 없다(ARCHITECTURE §6).
// 열쇠는 요청 본문으로만 보내고 저장소·로그·개발용 상태 칸에 두지 않는다. 들어간 뒤에는 form째 화면에서 떼어 낸다 —
// 칸을 먼저 비우지 않는다. 기기의 암호 보관함은 제출된 form이 사라질 때의 값을 보고 저장을 제안할 수 있다(D-112 ⑥, 실기기 T-04).
// 변형: `?s=again`(로그인이 풀려서 옴) · `?s=pin`(앱 잠금 비밀번호를 잊어서 옴).

import { API } from "../../../shared/api";
import { enterLock } from "../controller";
import { syncHeartbeat } from "../heartbeat";
import { announce, h } from "../lib/dom";
import { formatRemaining } from "../lib/format";
import { isInstalled, shouldShowInstallHint } from "../lib/install";
import { loginDestination } from "../lib/routes";
import { KEYS, readStored, removeStored, writeStored } from "../lib/storage";
import { request } from "../lib/api";
import { navigate, type ViewContext } from "../router";
import { app, fetchSession } from "../state";
import { openSheet } from "../ui/sheet";

/** 화면에 나오는 문구(UX_SPEC §16 상태 표 그대로). */
export const AUTH_TEXT = {
  title: "열쇠를 넣어 주세요",
  titleAgain: "다시 들어와 주세요",
  pinNote: "열쇠를 넣으면 새 비밀번호를 정할 수 있어요. 기록은 그대로 있어요.",
  empty: "열쇠를 넣어 주세요.",
  invalid: "열쇠가 맞지 않아요. 다시 확인해 주세요.",
  wait: "잠시 뒤에 다시 시도해 주세요.",
  offline: "인터넷에 연결되면 들어올 수 있어요.",
  server: "지금은 들어올 수 없어요. 잠시 뒤 다시 시도해 주세요.",
  cookie: "들어온 상태가 남지 않아요.",
  cookieLines: ["Safari 설정에서 쿠키를 막아 두었는지 봐 주세요.", "내용을 막는 앱이 켜져 있는지 봐 주세요."]
} as const;

function installHint(): HTMLElement | null {
  const show = shouldShowInstallHint({
    installed: isInstalled(),
    coarsePointer: window.matchMedia("(pointer: coarse)").matches,
    closed: readStored("local", KEYS.installHintClosed) !== null
  });
  if (!show) return null;
  const open = h("button", { type: "button", class: "hint-open", text: "홈 화면에 추가해 앱처럼 열 수 있어요 ›" });
  const close = h("button", { type: "button", class: "hint-close", "aria-label": "안내 닫기", text: "×" });
  const wrap = h("div", { class: "install-hint" }, open, close);
  open.addEventListener("click", () => {
    openSheet({
      id: "install-guide",
      title: "홈 화면에 추가하기",
      body: [
        "1. Safari 아래쪽의 공유 버튼을 눌러요",
        "2. '홈 화면에 추가'를 골라요",
        "홈 화면 앱에서는 열쇠를 한 번 더 넣어요."
      ],
      actions: [{ label: "닫기", kind: "quiet" }],
      opener: open
    });
  });
  close.addEventListener("click", () => {
    writeStored("local", KEYS.installHintClosed, "1");
    wrap.remove();
  });
  return wrap;
}

export function renderAuth({ root, route, alive }: ViewContext): () => void {
  const variant = route.query.get("s");
  const again = variant === "again" || variant === "pin";

  const username = h("input", {
    type: "text",
    name: "username",
    autocomplete: "username",
    value: "emotion-diary",
    "aria-hidden": "true",
    tabindex: "-1",
    class: "offscreen"
  });
  const key = h("input", {
    id: "access-key",
    class: "input",
    type: "password",
    name: "password",
    autocomplete: "current-password",
    autocapitalize: "off",
    autocorrect: "off",
    spellcheck: "false",
    enterkeyhint: "go"
  });
  const toggle = h("button", {
    type: "button",
    class: "btn btn-quiet field-toggle",
    "aria-pressed": "false",
    text: "열쇠 보기"
  });
  const errorBox = h("div", { id: "access-key-error", class: "field-error" });
  const submit = h("button", { type: "submit", class: "btn btn-primary btn-block", text: "들어가기" });

  const form = h(
    "form",
    { class: "auth-form", novalidate: true },
    username,
    h(
      "div",
      { class: "field" },
      h("label", { for: "access-key", text: "열쇠" }),
      h("div", { class: "field-row" }, key, toggle),
      errorBox
    ),
    submit
  );

  const hint = installHint();
  root.append(
    h(
      "section",
      { class: "screen auth" },
      h("h1", { text: again ? AUTH_TEXT.titleAgain : AUTH_TEXT.title }),
      variant === "pin" ? h("p", { class: "note", text: AUTH_TEXT.pinNote }) : null,
      form,
      hint
    )
  );

  let busy = false;
  let waiting = false;
  let composing = false;
  let waitTimer: number | undefined;
  let errorKind: "offline" | "other" | null = null;

  const clearError = (): void => {
    errorBox.replaceChildren();
    key.removeAttribute("aria-describedby");
    errorKind = null;
  };
  const showError = (message: string, kind: "offline" | "other" = "other", extra: Node[] = []): void => {
    errorBox.replaceChildren(h("p", { text: message }), ...extra);
    key.setAttribute("aria-describedby", errorBox.id);
    announce(message);
    errorKind = kind;
  };
  const setBusy = (on: boolean): void => {
    busy = on;
    submit.setAttribute("aria-disabled", String(on || waiting));
    submit.textContent = on ? "확인하는 중…" : "들어가기";
    if (on) announce("확인하는 중…");
  };
  const stopWait = (): void => {
    window.clearInterval(waitTimer);
    waitTimer = undefined;
    waiting = false;
    submit.setAttribute("aria-disabled", String(busy));
  };
  // 여러 번 틀려 잠시 잠겼다(429). 남은 시간을 1초마다 줄여 보인다. 잠긴 동안에는 맞는 열쇠도 받지 않는다.
  const startWait = (seconds: number): void => {
    stopWait();
    waiting = true;
    submit.setAttribute("aria-disabled", "true");
    const deadline = Date.now() + seconds * 1000;
    const count = h("span", { class: "wait-count" });
    showError(AUTH_TEXT.wait, "other", [h("p", {}, count)]);
    const tick = (): void => {
      const left = Math.ceil((deadline - Date.now()) / 1000);
      if (left <= 0) {
        stopWait();
        clearError();
        announce("다시 시도할 수 있어요");
        return;
      }
      count.textContent = `남은 시간 ${formatRemaining(left)}`;
    };
    tick();
    waitTimer = window.setInterval(tick, 1000);
  };

  const finish = (): void => {
    const returnTo = readStored("session", KEYS.returnTo);
    removeStored("session", KEYS.returnTo);
    removeStored("session", KEYS.forgotPin);
    const destination = loginDestination({ variant, hasName: app.hasName, returnTo });
    // 열쇠 화면은 기록에서 바꿔치운다 — 들어온 뒤 뒤로 밀어도 돌아오지 않는다(UX_SPEC §17)
    navigate(destination, { replace: true });
    if (app.locked) enterLock();
    // 들어온 순간부터 화면 신호를 보낸다 — 안 그러면 잠금을 켠 사람이 화면만 보다 5분 뒤 잠긴다(ARCHITECTURE §6)
    else syncHeartbeat();
  };

  const submitKey = async (): Promise<void> => {
    if (busy || waiting) return;
    const value = key.value;
    if (value === "") {
      showError(AUTH_TEXT.empty);
      key.focus();
      return;
    }
    if (navigator.onLine === false) {
      showError(AUTH_TEXT.offline, "offline");
      return;
    }
    clearError();
    setBusy(true);
    const login = await request("POST", API.session, { body: { key: value }, intercept: false });
    if (!alive()) return;
    if (login.ok) {
      // 로그인이 남는지 곧바로 한 번 확인한다(쿠키를 막은 기기를 알아보려고)
      const check = await fetchSession();
      if (!alive()) return;
      if (check.ok && check.data.authenticated) {
        finish();
        return;
      }
      setBusy(false);
      if (check.ok) {
        showError(
          AUTH_TEXT.cookie,
          "other",
          AUTH_TEXT.cookieLines.map((line) => h("p", { text: line }))
        );
      } else {
        showError(check.offline ? AUTH_TEXT.offline : AUTH_TEXT.server, check.offline ? "offline" : "other");
      }
      return;
    }
    setBusy(false);
    if (login.offline) showError(AUTH_TEXT.offline, "offline");
    else if (login.status === 401) showError(AUTH_TEXT.invalid);
    else if (login.status === 429) startWait(login.retryAfter ?? 300);
    else showError(AUTH_TEXT.server);
    // 칸의 글자는 지우지 않는다(탓하지 않는다, §6.1). 고칠 수 있게 초점만 돌려준다.
    if (!waiting) key.focus();
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (composing) return;
    void submitKey();
  });
  // 한글 조합 중 Enter는 글자를 확정하는 것이지 제출이 아니다
  key.addEventListener("compositionstart", () => {
    composing = true;
  });
  key.addEventListener("compositionend", () => {
    composing = false;
  });
  key.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.isComposing || composing)) event.preventDefault();
  });
  toggle.addEventListener("click", () => {
    const reveal = key.type === "password";
    key.type = reveal ? "text" : "password";
    toggle.setAttribute("aria-pressed", String(reveal));
    toggle.textContent = reveal ? "열쇠 숨기기" : "열쇠 보기";
  });

  const onOffline = (): void => showError(AUTH_TEXT.offline, "offline");
  const onOnline = (): void => {
    if (errorKind === "offline") clearError();
  };
  window.addEventListener("offline", onOffline);
  window.addEventListener("online", onOnline);

  return () => {
    window.clearInterval(waitTimer);
    window.removeEventListener("offline", onOffline);
    window.removeEventListener("online", onOnline);
  };
}
