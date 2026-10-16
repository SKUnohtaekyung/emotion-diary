// 내 기록 내보내기 `#/settings/export` (UX_SPEC §13, ARCHITECTURE §4.1). 공유 창 방식 하나다(D-111 ④).
// iOS는 공유 창을 사용자가 누른 동작 안에서만 열어 준다 — 서버 응답을 기다린 뒤에 열면 거부될 수 있다.
// 그래서 화면을 열 때 미리 받아 파일로 만들어 두고, 버튼을 누르면 기다림(await) 없이 곧바로 연다.
// 공유 창이 없는 브라우저(PC 등)는 파일 내려받기로 대신한다. 클립보드 복사는 어떤 경우에도 쓰지 않는다.
// 파일 내용·이름은 화면 변수에만 둔다 — 저장소·주소에 남기지 않고, 화면을 떠나면 버린다.

import type { ExportFile } from "../../../shared/diary";
import { announce, h } from "../lib/dom";
import { parseHash } from "../lib/routes";
import { back, navigate, type ViewContext } from "../router";
import { exportNameOf, fetchExport } from "../write/dataApi";

const SHARE_TITLE = "내 기록 내보내기";
/** 내려받기를 시작한 뒤 주소를 거두기까지 기다리는 시간. 바로 거두면 일부 브라우저가 내려받기를 시작하지 못한다. */
const REVOKE_AFTER_MS = 1000;

const TEXT = {
  title: "내 기록 내보내기",
  lede: "지금까지 쓴 기록을 파일 하나로 만들어 내 기기에 저장해요.",
  includedTitle: "파일에 들어가요",
  included: ["완료한 기록과 임시저장한 기록 모두", "하루 기준 시각", "부를 이름"],
  excludedTitle: "파일에 들어가지 않아요",
  excluded: ["접근 열쇠와 앱 잠금 비밀번호 같은 비밀값", "앱이 안에서만 쓰는 관리용 값", "AI와 나눈 대화 전문"],
  fileTitle: "파일 이름",
  filePending: "emotion-diary-날짜.json",
  whereShare: "공유 창에서 고른 곳에 저장돼요.",
  whereDownload: "이 브라우저가 정한 내려받기 위치에 저장돼요.",
  preparing: "준비하고 있어요…",
  ready: "내보내기",
  readyAnnounce: "내보낼 준비가 됐어요.",
  back: "‹ 뒤로",
  doneTitle: "파일을 만들었어요",
  doneBack: "돌아가기",
  failTitle: "내보내지 못했어요",
  failBody: "기록은 그대로 있어요.",
  retry: "다시 시도"
} as const;

type Via = "share" | "download";

/** 방금 만든 파일의 이름과 보낸 길. 완료 화면(주소가 다른 화면)이 읽고, 이 화면을 떠나면 버린다. 내용은 두지 않는다. */
let lastExport: { name: string; via: Via } | null = null;

const canUseShare = (): boolean => typeof navigator !== "undefined" && typeof navigator.share === "function";

/** 이 파일을 공유 창으로 넘길 수 있는가. 못 넘기면(PC 등) 내려받기로 대신한다. */
function canShareFile(file: File): boolean {
  try {
    return canUseShare() && navigator.canShare?.({ files: [file] }) === true;
  } catch {
    return false;
  }
}

/** 공유 창을 연다. 누른 동작 안에서 곧바로 불려야 하므로 기다림 없이 한 번에 나간다. 동기로 던져도 거절된 약속으로 바꾼다. */
function openShare(file: File): Promise<void> {
  try {
    return navigator.share({ files: [file], title: SHARE_TITLE });
  } catch (error) {
    return Promise.reject(error);
  }
}

function isAbort(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { name?: unknown }).name === "AbortError";
}

/** 파일 내려받기: 임시 주소를 만들어 링크를 한 번 누르고, 잠시 뒤 주소를 거둔다. */
function download(file: File): void {
  const url = URL.createObjectURL(file);
  const link = h("a", { href: url, download: file.name, class: "offscreen" });
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_AFTER_MS);
}

function backButton(): HTMLButtonElement {
  const button = h("button", { type: "button", class: "back-button", text: TEXT.back });
  button.addEventListener("click", () => back("#/today"));
  return button;
}

function list(items: readonly string[]): HTMLElement {
  return h("ul", { class: "data-list" }, ...items.map((item) => h("li", { text: item })));
}

function renderScope({ root, alive }: ViewContext): () => void {
  lastExport = null;
  let file: File | null = null;
  let busy = false;

  const fileName = h("p", { class: "data-filename", text: TEXT.filePending });
  const where = h("p", { class: "note", text: canUseShare() ? TEXT.whereShare : TEXT.whereDownload });
  const action = h("button", { type: "button", class: "btn btn-primary btn-block", "aria-disabled": "true", text: TEXT.preparing });

  root.append(
    h(
      "section",
      { class: "screen" },
      h("div", { class: "screen-top" }, backButton()),
      h("h1", { text: TEXT.title }),
      h("p", { class: "lede", text: TEXT.lede }),
      h("section", { class: "data-block" }, h("h2", { text: TEXT.includedTitle }), list(TEXT.included)),
      h("section", { class: "data-block" }, h("h2", { text: TEXT.excludedTitle }), list(TEXT.excluded)),
      h("section", { class: "data-block" }, h("h2", { text: TEXT.fileTitle }), fileName, where),
      h("div", { class: "screen-actions" }, action)
    )
  );

  const toFail = (): void => navigate("#/settings/export?s=fail", { replace: true });

  const finish = (name: string, via: Via): void => {
    lastExport = { name, via };
    navigate("#/settings/export?s=done", { replace: true });
  };

  action.addEventListener("click", () => {
    // 준비 전·내보내는 중에는 아무것도 하지 않는다. 아래 share 호출은 이 누름 안에서 곧바로 나가야 한다(앞에 await 없음).
    if (busy || file === null) return;
    const ready = file;
    if (canShareFile(ready)) {
      busy = true;
      action.setAttribute("aria-disabled", "true");
      openShare(ready).then(
        () => {
          if (alive()) finish(ready.name, "share");
        },
        (error: unknown) => {
          if (!alive()) return;
          // 공유 창을 그냥 닫은 것은 실패가 아니다 — 그대로 머문다
          if (isAbort(error)) {
            busy = false;
            action.setAttribute("aria-disabled", "false");
            return;
          }
          toFail();
        }
      );
      return;
    }
    try {
      download(ready);
    } catch {
      toFail();
      return;
    }
    finish(ready.name, "download");
  });

  void (async () => {
    const result = await fetchExport();
    if (!alive()) return;
    // 로그인 풀림(401)·잠김(423)은 처리기가 맡았다
    if (!result.ok) {
      if (result.status !== 401 && result.status !== 423) toFail();
      return;
    }
    const name = exportNameOf(result.data);
    if (name === null) {
      toFail();
      return;
    }
    file = makeFile(result.data, name);
    fileName.textContent = name;
    where.textContent = canShareFile(file) ? TEXT.whereShare : TEXT.whereDownload;
    action.textContent = TEXT.ready;
    action.setAttribute("aria-disabled", "false");
    announce(TEXT.readyAnnounce);
  })();

  // 화면을 떠나면 받은 내용을 버린다
  return () => {
    file = null;
  };
}

/** 응답을 사람이 읽을 수 있게 들여쓴 글로 담은 파일. */
function makeFile(data: ExportFile, name: string): File {
  return new File([`${JSON.stringify(data, null, 2)}\n`], name, { type: "application/json" });
}

function renderDone({ root }: ViewContext): () => void {
  const sent = lastExport;
  const close = h("button", { type: "button", class: "btn btn-primary btn-block", text: TEXT.doneBack });
  close.addEventListener("click", () => back("#/today"));
  root.append(
    h(
      "section",
      { class: "screen" },
      h("h1", { text: TEXT.doneTitle }),
      sent ? h("p", { class: "data-filename", text: sent.name }) : null,
      h("p", { class: "note", text: sent?.via === "download" ? TEXT.whereDownload : TEXT.whereShare }),
      h("div", { class: "screen-actions" }, close)
    )
  );
  return () => {
    if (parseHash(location.hash).path !== "settings/export") lastExport = null;
  };
}

function renderFail({ root }: ViewContext): () => void {
  lastExport = null;
  const retry = h("button", { type: "button", class: "btn btn-primary btn-block", text: TEXT.retry });
  retry.addEventListener("click", () => navigate("#/settings/export", { replace: true }));
  root.append(
    h(
      "section",
      { class: "screen" },
      h("div", { class: "screen-top" }, backButton()),
      h("h1", { text: TEXT.failTitle }),
      h("p", { class: "lede", text: TEXT.failBody }),
      h("div", { class: "screen-actions" }, retry)
    )
  );
  return () => {};
}

export function renderExportData(context: ViewContext): () => void {
  const state = context.route.query.get("s");
  if (state === "done") return renderDone(context);
  if (state === "fail") return renderFail(context);
  return renderScope(context);
}
