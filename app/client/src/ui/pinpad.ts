// 비밀번호 숫자판(D-106, UX_SPEC §15): 점 네 개, 한 줄 안내, 1~9·0·지우기. 네 자리가 차면 onComplete(숫자)를 부른다.
// 잠금 층·비밀번호 정하기·지금 비밀번호 장면이 같이 쓴다. 맞는지는 서버가 정한다(D-112 ③) — 이 모듈은 숫자를 모아 넘길 뿐이고,
// 숫자는 메모리의 한 변수에만 있다가 넘긴 뒤 비운다. 저장소·로그·개발용 상태 칸에 두지 않는다.

import { PIN_LENGTH, PIN_REST_MS } from "../../../shared/api";
import type { ApiFail } from "../lib/api";
import { announce, h } from "../lib/dom";

export interface PinPad {
  node: HTMLElement;
  /** 비우고 안내를 바꾼다. 다시 누를 수 있게 된다. shake는 틀렸을 때 점을 한 번 흔든다(움직임 줄이기는 CSS가 끈다). */
  reset(message?: string, options?: { shake?: boolean }): void;
  /** 숫자판을 잠시 쉬게 한다. 1초마다 남은 초를 보인다. */
  rest(seconds: number): void;
  say(message: string): void;
  focus(): void;
  /** 키보드 숫자·Backspace */
  onKey(event: KeyboardEvent): void;
  destroy(): void;
}

export interface PinPadOptions {
  /** 점의 이름에 들어가는 말. 예: '잠금 비밀번호' */
  label: string;
  onComplete: (pin: string) => void;
}

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
/** 마지막 점이 채워지는 것을 보여 준 뒤 넘긴다 */
const COMPLETE_DELAY_MS = 140;

export function createPinPad(options: PinPadOptions): PinPad {
  let value = "";
  let busy = false;
  let resting = false;
  let restTimer: number | undefined;
  let completeTimer: number | undefined;

  const dots = h("div", { class: "pin-dots", role: "img" }, ...Array.from({ length: PIN_LENGTH }, () => h("i")));
  // 읽어 주기는 announce가 맡는다 — 여기에 role="status"를 두면 쉬는 동안 초가 매번 읽힌다
  const status = h("p", { class: "pin-status" });
  const keys = h("div", { class: "pin-keys" });

  const paint = (): void => {
    Array.from(dots.children).forEach((dot, index) => {
      dot.classList.toggle("on", index < value.length);
    });
    dots.setAttribute("aria-label", `${options.label}, ${PIN_LENGTH}자리 중 ${value.length}자리 눌렀어요`);
  };

  const press = (digit: string): void => {
    if (busy || resting || value.length >= PIN_LENGTH) return;
    value += digit;
    paint();
    if (value.length < PIN_LENGTH) return;
    busy = true;
    node.classList.add("busy");
    completeTimer = window.setTimeout(() => {
      const pin = value;
      options.onComplete(pin);
    }, COMPLETE_DELAY_MS);
  };

  const erase = (): void => {
    if (busy || resting) return;
    value = value.slice(0, -1);
    paint();
  };

  const key = (digit: string): HTMLButtonElement => {
    const button = h("button", { type: "button", class: "pin-key", text: digit });
    button.addEventListener("click", () => press(digit));
    return button;
  };
  const eraseButton = h("button", { type: "button", class: "pin-key pin-erase", text: "지우기" });
  eraseButton.addEventListener("click", erase);
  keys.append(...DIGITS.map(key), h("span", { "aria-hidden": "true" }), key("0"), eraseButton);

  const node = h("div", { class: "pin-pad" }, dots, status, keys);

  const setKeysDisabled = (disabled: boolean): void => {
    for (const button of Array.from(keys.querySelectorAll("button"))) button.disabled = disabled;
  };

  const pad: PinPad = {
    node,
    reset(message = "", resetOptions = {}) {
      window.clearTimeout(completeTimer);
      value = "";
      busy = false;
      node.classList.remove("busy");
      paint();
      status.textContent = message;
      if (message) announce(message);
      if (resetOptions.shake) {
        dots.classList.remove("shake");
        void dots.offsetWidth;
        dots.classList.add("shake");
      }
    },
    rest(seconds) {
      window.clearInterval(restTimer);
      resting = true;
      node.classList.add("resting");
      setKeysDisabled(true);
      const deadline = Date.now() + Math.max(1, seconds) * 1000;
      const tick = (): void => {
        const left = Math.ceil((deadline - Date.now()) / 1000);
        if (left <= 0) {
          window.clearInterval(restTimer);
          resting = false;
          node.classList.remove("resting");
          setKeysDisabled(false);
          status.textContent = "";
          announce("다시 누를 수 있어요");
          pad.focus();
          return;
        }
        status.textContent = `잠시 쉬었다가 다시 눌러요. ${left}초`;
      };
      announce(`잠시 쉬어요. ${Math.ceil(seconds)}초 뒤에 다시 누를 수 있어요.`);
      tick();
      restTimer = window.setInterval(tick, 1000);
    },
    say(message) {
      status.textContent = message;
    },
    focus() {
      keys.querySelector<HTMLButtonElement>(".pin-key")?.focus({ preventScroll: true });
    },
    onKey(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        press(event.key);
      } else if (event.key === "Backspace") {
        event.preventDefault();
        erase();
      }
    },
    destroy() {
      window.clearTimeout(completeTimer);
      window.clearInterval(restTimer);
    }
  };
  paint();
  return pad;
}

/**
 * 비밀번호 요청이 실패했을 때 숫자판에 보일 말을 정한다. 틀림은 점 흔들기, 다섯 번 틀림은 서버의 retryAfter로 쉬기.
 * 탓하지 않는다(§6.1) — 틀렸다고 말하되 다시 눌러 달라고 한다.
 */
export function showPinFailure(pad: PinPad, failure: ApiFail, texts: { offline: string; generic: string }): void {
  if (failure.offline) {
    pad.reset(texts.offline);
  } else if (failure.status === 422 && failure.code === "wrong_pin") {
    pad.reset("맞지 않아요. 다시 눌러 주세요.", { shake: true });
  } else if (failure.status === 429) {
    pad.reset("");
    pad.rest(failure.retryAfter ?? PIN_REST_MS / 1000);
  } else {
    pad.reset(texts.generic);
  }
}
