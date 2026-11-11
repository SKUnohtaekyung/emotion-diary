// '남기기' 뒤 봉인 연출(D-084) — 시안 web/js/views/write.js playSealSequence·film.css를 옮겼다(TASK-JOURNAL-01 J-5).
// 카드가 작아지며 내려가고 → 뚜껑이 닫히고 → 인장이 눌리고 → 봉투가 흰빛 속으로 옅어진다. 전체 약 1.3초(열지 않았으면 카드·뚜껑을 건너뛰어 약 0.65초).
// 완료 요청이 성공한 뒤에만 부른다 — 실패하면 연출 없이 편지에 머문다(PLAN J-5). 움직임 줄이기면 바로 끝난다.
// 흰 막(.film-whiteout)은 완료 화면이 자리 잡은 뒤 releaseWhiteout()으로 걷는다. 어떤 길로 떠나도 1.8초 뒤엔 스스로 걷힌다(화면에 눌어붙지 않게).

import { prefersReducedMotion } from "../../lib/motion";

let veil: HTMLElement | null = null;
let veilTimer = 0;

/** 흰 막을 걷는다(완료 화면이 부른다). 없으면 할 일이 없다. */
export function releaseWhiteout(): void {
  const node = veil;
  if (!node) return;
  veil = null;
  window.clearTimeout(veilTimer);
  node.classList.remove("film-show");
  node.classList.add("film-hide");
  window.setTimeout(() => node.remove(), 400);
}

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** 편지 무대(.letter-stage)에 봉인 연출을 건다. 끝나면(흰 막이 덮인 채) 돌아온다. */
export async function playSeal(stage: HTMLElement | null): Promise<void> {
  if (!stage?.isConnected || prefersReducedMotion()) return;
  const wasOpen = stage.classList.contains("opened");
  const cards = stage.querySelector<HTMLElement>(".pagerclip");
  const flap = stage.querySelector<HTMLElement>(".flapwrap .flap");
  const seal = stage.querySelector<HTMLElement>(".sealw .seal");
  const frame = stage.querySelector<HTMLElement>(".lt-frame") ?? stage;
  releaseWhiteout();
  const node = document.createElement("div");
  node.className = "film-whiteout";
  node.setAttribute("aria-hidden", "true");
  document.body.append(node);
  veil = node;
  veilTimer = window.setTimeout(releaseWhiteout, 1800);
  // 열린 뒤 숨긴 봉투 조각을 다시 꺼낸다(뚜껑은 열린 180°에서 닫는다)
  stage.classList.add("film-sealing");
  if (wasOpen && cards) {
    cards.classList.add("film-cards-in");
    await wait(380);
    flap?.classList.add("film-flap-close");
    await wait(270);
    seal?.classList.add("film-seal-press");
    await wait(300);
    frame.classList.add("film-envelope-out");
    node.classList.add("film-show");
    await wait(330);
    return;
  }
  seal?.classList.add("film-seal-press");
  await wait(320);
  frame.classList.add("film-envelope-out");
  node.classList.add("film-show");
  await wait(330);
}
