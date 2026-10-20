// 자판 측정(TASK-PERSONAL-01 A-8, 개발용 전용): 글 칸·입력 칸에 들어갈 때 화면의 위치·높이 숫자를 남겨 상태 칸에 보인다.
// 2026-10-20 이 측정으로 원인을 가렸다 — 자판이 뜨면 레이아웃 높이만 63 줄고 문서는 그대로라 iOS가 창을 스크롤했다(H1).
// 고친 배치(문서 고정·#app만 스크롤, base.css·lib/viewport.ts, D-125)가 실기기에서 맞는지 계속 볼 수 있게 측정만 남겼다.
// 재는 값은 위치·높이 숫자뿐이고 입력한 글은 읽지 않는다. 운영 묶음에는 들어가지 않는다(dev/index에서만 부른다).

const KEEP = 6;

export type Row = [label: string, value: string];
export interface Snapshot {
  label: string;
  rows: Row[];
}

export interface KeyboardLab {
  snapshots(): Snapshot[];
  stop(): void;
}

const n = (value: number | undefined): string => (value === undefined || Number.isNaN(value) ? "없음" : String(Math.round(value)));

/** 지금 화면의 위치·높이 숫자. 글자 내용은 읽지 않는다. */
export function measure(label: string, counts: { vv: number; win: number }): Snapshot {
  const doc = document.scrollingElement ?? document.documentElement;
  const vv = window.visualViewport ?? undefined;
  const probe = document.querySelector(".dev-safe-probe");
  const top = document.querySelector(".write-top, .screen-top, .screen > :first-child");
  const app = document.getElementById("app");
  return {
    label,
    rows: [
      ["scrollY", n(window.scrollY)],
      ["문서 높이/보이는 높이", `${n(doc.scrollHeight)}/${n(doc.clientHeight)}`],
      ["vv.offsetTop", n(vv?.offsetTop)],
      ["vv.pageTop", n(vv?.pageTop)],
      ["vv.height", n(vv?.height)],
      ["innerHeight", n(window.innerHeight)],
      ["자판이 가린 높이", getComputedStyle(document.documentElement).getPropertyValue("--keyboard-inset").trim() || "0"],
      ["위쪽 보정", getComputedStyle(document.documentElement).getPropertyValue("--viewport-shift").trim() || "0"],
      ["vv.scale", vv?.scale === undefined ? "없음" : vv.scale.toFixed(2)],
      ["안전 영역 위", (probe && getComputedStyle(probe).paddingTop) || "없음"],
      ["맨 위 줄 top", top ? n(top.getBoundingClientRect().top) : "없음"],
      ["#app scrollTop", n(app?.scrollTop)],
      ["스크롤 사건(vv/창)", `${counts.vv}/${counts.win}`]
    ]
  };
}

const isTextField = (target: EventTarget | null): boolean =>
  target instanceof HTMLTextAreaElement || (target instanceof HTMLInputElement && !["button", "checkbox", "radio", "range", "submit"].includes(target.type));

export function startKeyboardLab(onChange: () => void): KeyboardLab {
  const list: Snapshot[] = [];
  const counts = { vv: 0, win: 0 };
  const timers: number[] = [];
  const probe = document.createElement("div");
  probe.className = "dev-safe-probe";
  probe.setAttribute("aria-hidden", "true");
  document.body.append(probe);

  const push = (label: string): void => {
    list.push(measure(label, counts));
    while (list.length > KEEP) list.shift();
    onChange();
  };
  const later = (label: string, ms: number): void => {
    timers.push(window.setTimeout(() => push(label), ms));
  };
  const onFocusIn = (event: FocusEvent): void => {
    if (!isTextField(event.target)) return;
    counts.vv = 0;
    counts.win = 0;
    push("누른 순간");
    later("0.5초 뒤", 500);
    later("1.5초 뒤", 1500);
  };
  const onFocusOut = (event: FocusEvent): void => {
    if (isTextField(event.target)) later("자판 내린 뒤", 800);
  };
  const onViewport = (): void => {
    counts.vv += 1;
  };
  const onWindowScroll = (): void => {
    counts.win += 1;
  };

  document.addEventListener("focusin", onFocusIn);
  document.addEventListener("focusout", onFocusOut);
  window.visualViewport?.addEventListener("resize", onViewport);
  window.visualViewport?.addEventListener("scroll", onViewport);
  window.addEventListener("scroll", onWindowScroll, { passive: true });
  push("평소");

  return {
    snapshots: () => list.slice(),
    stop() {
      for (const timer of timers) window.clearTimeout(timer);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      window.visualViewport?.removeEventListener("resize", onViewport);
      window.visualViewport?.removeEventListener("scroll", onViewport);
      window.removeEventListener("scroll", onWindowScroll);
      probe.remove();
    }
  };
}
