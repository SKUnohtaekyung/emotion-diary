// 모든 기록 지우기 `#/settings/delete`와 삭제 완료 `#/settings/deleted` (UX_SPEC §13, D-112 ⑤·⑩).
// 확인 문구를 그대로 입력해야 `영구 삭제`가 켜진다. 앱 잠금을 켠 사람에게는 누른 뒤 지금 비밀번호를 한 번 더 묻는다
// (views/lockSettings.ts의 끄기 흐름과 같은 짜임). 맞는지는 서버가 정한다 — 이 화면은 숫자를 서버로 보내는 길만 낸다.
// 성공하면 이 기기에 남은 쓰던 글을 모두 버린다(controller.ts의 logout과 같은 셋). 실패하면 아무것도 버리지 않는다.

import { DELETE_ALL_CONFIRM } from "../../../shared/api";
import type { ApiFail, ApiResult } from "../lib/api";
import { announce, h } from "../lib/dom";
import { back, navigate, type ViewContext } from "../router";
import { app } from "../state";
import { failureMessage } from "../ui/messages";
import { promptCurrentPin } from "../ui/pinPrompt";
import { showToast } from "../ui/toast";
import { deleteAllRequest } from "../write/dataApi";
import { allSavers, type Saver } from "../write/saver";
import { dropAllSessions } from "../write/session";
import { clearUnsent } from "../write/unsent";

const TEXT = {
  title: "모든 기록 지우기",
  lede: "한 번 지우면 되돌릴 수 없어요.",
  removesTitle: "지워지는 것",
  removes: ["모든 기록과 임시저장", "부를 이름", "앱 잠금 설정", "하루 기준 시각 같은 설정", "다른 기기의 로그인"],
  stays: "이 기기의 로그인과 접근 열쇠는 그대로 남아요.",
  exportFirst: "먼저 내보내기",
  confirmLabel: `“${DELETE_ALL_CONFIRM}”를 그대로 입력해 주세요`,
  confirmNeeded: `“${DELETE_ALL_CONFIRM}”를 그대로 입력하면 켜져요.`,
  submit: "영구 삭제",
  cancel: "그만두기",
  failed: "지우지 못했어요. 기록은 그대로 있어요",
  // 응답을 받지 못했다(연결 끊김·시간 초과) — 서버가 지웠는지 알 수 없다. 같은 요청을 다시 보내도 결과가 같아 다시 누르게 한다
  unknown: "지웠는지 확인하지 못했어요. 연결된 뒤 다시 눌러 주세요",
  back: "‹ 뒤로",
  deletedTitle: "모두 삭제했어요",
  deletedLead: "앱에서는 바로 사라졌어요.",
  deletedNotice:
    "복구용 사본에는 한동안 남을 수 있어요 — 서버의 자동 복구본은 7일, 이 PC 백업을 켰다면 30일쯤. 직접 내보낸 파일은 직접 지워야 해요.",
  restart: "처음부터 시작하기"
} as const;

/** 입력한 글이 확인 문구와 정확히 같은가. 앞뒤 공백도 다르면 다른 것이다(조합 방식만 맞춘다). */
export function confirmMatches(typed: string): boolean {
  return typed.normalize("NFC") === DELETE_ALL_CONFIRM;
}

/** 서버가 지웠다 — 이 기기에서 쓰던 글을 모두 버리고 처음 상태로 돌린다. 로그아웃(controller.ts)이 부르는 셋과 같다. */
function forgetThisDevice(): void {
  dropAllSessions();
  for (const saver of allSavers()) saver.discard();
  clearUnsent();
  app.hasName = false;
  app.name = null;
  app.appLock = false;
}

/** 실패한 이유에 맞는 말. 로그인 풀림(401)·잠김(423)은 처리기가 맡았으므로 말하지 않는다. */
function failureToast(failure: ApiFail): string | null {
  if (failure.status === 401 || failure.status === 423) return null;
  if (failure.status === 429) return failureMessage(failure);
  if (failure.status === 0) return TEXT.unknown;
  return TEXT.failed;
}

export function renderDeleteAll({ root, alive }: ViewContext): () => void {
  const backButton = h("button", { type: "button", class: "back-button", text: TEXT.back });
  backButton.addEventListener("click", () => back("#/today"));

  const exportFirst = h("button", { type: "button", class: "btn btn-quiet btn-block", text: TEXT.exportFirst });
  exportFirst.addEventListener("click", () => navigate("#/settings/export"));

  const inputId = "delete-confirm";
  const input = h("input", {
    id: inputId,
    class: "input",
    type: "text",
    name: "delete-confirm",
    autocomplete: "off",
    autocapitalize: "off",
    autocorrect: "off",
    spellcheck: "false",
    enterkeyhint: "done"
  });
  const submit = h("button", { type: "submit", class: "btn btn-primary btn-block", "aria-disabled": "true", text: TEXT.submit });
  const cancel = h("button", { type: "button", class: "btn btn-quiet btn-block", text: TEXT.cancel });
  cancel.addEventListener("click", () => back("#/today"));

  const form = h(
    "form",
    { class: "data-confirm", novalidate: true },
    h("div", { class: "field" }, h("label", { for: inputId, text: TEXT.confirmLabel }), input),
    submit
  );

  root.append(
    h(
      "section",
      { class: "screen" },
      h("div", { class: "screen-top" }, backButton),
      h("h1", { class: "data-danger-title", text: TEXT.title }),
      h("p", { class: "lede", text: TEXT.lede }),
      h(
        "section",
        { class: "data-block" },
        h("h2", { text: TEXT.removesTitle }),
        h("ul", { class: "data-list" }, ...TEXT.removes.map((item) => h("li", { text: item }))),
        h("p", { class: "note", text: TEXT.stays })
      ),
      exportFirst,
      form,
      cancel
    )
  );

  let busy = false;
  let composing = false;

  const enabled = (): boolean => !busy && confirmMatches(input.value);
  const paint = (): void => {
    submit.setAttribute("aria-disabled", String(!enabled()));
  };
  input.addEventListener("input", paint);
  input.addEventListener("compositionstart", () => {
    composing = true;
  });
  input.addEventListener("compositionend", () => {
    composing = false;
    paint();
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.isComposing || composing)) event.preventDefault();
  });

  const goDeleted = (): void => navigate("#/settings/deleted", { replace: true });

  // 얼린 저장 줄. 응답을 못 받았으면(서버가 지웠을 수도 있다) 이 화면에 있는 동안 얼린 채 둔다 — 풀면 지워진 서버에
  // 오늘 글을 다시 만들 수 있다. 다시 누르면 같은 요청이고, 화면을 떠나면(지우기를 그만뒀다) 푼다.
  let held: Saver[] = [];
  const release = (): void => {
    for (const saver of held) saver.thaw();
    held = [];
  };

  const run = async (): Promise<void> => {
    busy = true;
    paint();
    // 지우는 동안 쓰던 글이 서버로 가지 않게 저장을 멈추고 날아가는 요청을 기다린다(기록 하나 지우기와 같은 짜임)
    held = allSavers();
    await Promise.all(held.map((saver) => saver.quiesce()));
    let deleted = false;
    let unknown = false;
    try {
      let needPin = app.appLock;
      if (!needPin) {
        const result = await deleteAllRequest();
        if (result.ok) {
          deleted = true;
          forgetThisDevice();
          goDeleted();
          return;
        }
        // 다른 기기에서 앱 잠금을 켰다 — 서버가 비밀번호를 요구하면 숫자판으로 받는다
        if (result.status === 422 && result.code === "pin_required") needPin = true;
        else {
          unknown = result.status === 0;
          const message = failureToast(result);
          if (message) showToast(message);
          return;
        }
      }
      await promptCurrentPin(async (pin): Promise<ApiResult<unknown>> => {
        const result = await deleteAllRequest(pin);
        // 지운 즉시 버린다 — 숫자판이 닫히는 사이에 쓰던 글이 서버로 다시 가지 않게
        if (result.ok) {
          deleted = true;
          forgetThisDevice();
        } else unknown = result.status === 0;
        return result;
      }, submit);
      // 숫자판이 완전히 닫힌 뒤에 옮긴다(닫는 되돌림이 이 화면의 기록 칸을 바꾸지 않게)
      if (deleted) goDeleted();
    } finally {
      if (deleted) held = [];
      else if (!unknown || !alive()) release();
      busy = false;
      if (alive()) paint();
    }
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (busy || composing) return;
    if (!confirmMatches(input.value)) {
      // 흐린 버튼은 aria-disabled라 누름도 여기로 온다 — 무엇이 필요한지 말하고 칸으로 초점을 보낸다(D-098)
      announce(TEXT.confirmNeeded);
      input.focus();
      return;
    }
    void run();
  });

  return release;
}

export function renderDeleted({ root }: ViewContext): () => void {
  const restart = h("button", { type: "button", class: "btn btn-primary btn-block", text: TEXT.restart });
  restart.addEventListener("click", () => navigate("#/auth/name", { replace: true }));
  root.append(
    h(
      "section",
      { class: "screen" },
      h("h1", { text: TEXT.deletedTitle }),
      h("p", { class: "lede", text: TEXT.deletedLead }),
      h("p", { class: "note", text: TEXT.deletedNotice }),
      h("div", { class: "screen-actions" }, restart)
    )
  );
  return () => {};
}
