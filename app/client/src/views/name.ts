// 부를 이름 `#/auth/name` (UX_SPEC §16). 처음 한 번만 묻는다. 이름 칸은 12자(코드 포인트로 센다)까지.
// 입력 중에는 값을 자르지 않는다 — 한글은 조합 중이라 값을 건드리면 글자가 깨진다. 넘치면 안내만 하고 제출에서 검사한다.

import { API, NAME_MAX, normalizeName } from "../../../shared/api";
import { request } from "../lib/api";
import { announce, h } from "../lib/dom";
import { codePointLength } from "../lib/format";
import { navigate, type ViewContext } from "../router";
import { app } from "../state";

export const NAME_TEXT = {
  title: "뭐라고 불러 드릴까요?",
  empty: "부를 이름을 적어 주세요.",
  tooLong: `${NAME_MAX}자까지 적을 수 있어요.`,
  badChar: "쓸 수 없는 글자가 있어요.",
  offline: "인터넷에 연결되면 저장할 수 있어요.",
  server: "지금은 저장할 수 없어요. 잠시 뒤 다시 시도해 주세요."
} as const;

/** 제출 전 검사의 안내 문구. 통과하면 null. 앞뒤 빈칸을 뺀 글자 수로 가른다(normalizeName과 같은 셈). */
export function nameProblem(raw: string): string | null {
  if (normalizeName(raw) !== null) return null;
  const length = codePointLength(raw.trim());
  if (length === 0) return NAME_TEXT.empty;
  if (length > NAME_MAX) return NAME_TEXT.tooLong;
  return NAME_TEXT.badChar;
}

export function renderName({ root, alive }: ViewContext): () => void {
  const input = h("input", {
    id: "call-name",
    class: "input",
    type: "text",
    name: "call-name",
    autocomplete: "off",
    autocapitalize: "off",
    spellcheck: "false",
    enterkeyhint: "done"
  });
  const count = h("span", { class: "name-count", id: "call-name-count", text: `0/${NAME_MAX}` });
  const errorBox = h("p", { class: "field-error", id: "call-name-error" });
  const submit = h("button", { type: "submit", class: "btn btn-primary btn-block", text: "시작하기" });
  const form = h(
    "form",
    { class: "name-form", novalidate: true },
    h(
      "div",
      { class: "field" },
      h("div", { class: "field-head" }, h("label", { for: "call-name", text: "부를 이름" }), count),
      input,
      errorBox
    ),
    submit
  );
  root.append(h("section", { class: "screen" }, h("h1", { text: NAME_TEXT.title }), form));

  let busy = false;
  let composing = false;

  const showError = (message: string): void => {
    errorBox.textContent = message;
    input.setAttribute("aria-describedby", `${errorBox.id} ${count.id}`);
    if (message) announce(message);
  };
  const clearError = (): void => {
    errorBox.textContent = "";
    input.setAttribute("aria-describedby", count.id);
  };
  input.setAttribute("aria-describedby", count.id);

  input.addEventListener("input", () => {
    const length = codePointLength(input.value.trim());
    count.textContent = `${length}/${NAME_MAX}`;
    count.classList.toggle("is-over", length > NAME_MAX);
    // 넘쳐도 자르지 않는다. 안내만 보이고, 고치면 사라진다.
    if (length > NAME_MAX) showError(NAME_TEXT.tooLong);
    else clearError();
  });
  input.addEventListener("compositionstart", () => {
    composing = true;
  });
  input.addEventListener("compositionend", () => {
    composing = false;
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.isComposing || composing)) event.preventDefault();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (busy || composing) return;
    void (async () => {
      const problem = nameProblem(input.value);
      if (problem) {
        showError(problem);
        input.focus();
        return;
      }
      const name = normalizeName(input.value);
      if (name === null) return;
      clearError();
      busy = true;
      submit.setAttribute("aria-disabled", "true");
      const result = await request("PUT", API.profile, { body: { name } });
      if (!alive()) return;
      busy = false;
      submit.setAttribute("aria-disabled", "false");
      if (result.ok) {
        app.hasName = true;
        app.name = name;
        // 이름 화면은 지나가면 기록에서 사라진다(UX_SPEC §17)
        navigate("#/welcome", { replace: true });
        return;
      }
      if (result.offline) showError(NAME_TEXT.offline);
      else if (result.status === 422) showError(nameProblem(input.value) ?? NAME_TEXT.tooLong);
      else if (result.status !== 401) showError(NAME_TEXT.server);
    })();
  });

  return () => {};
}
