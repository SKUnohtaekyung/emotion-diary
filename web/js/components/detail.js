// 계열별 세부 감정 화면의 본문. 고른 계열마다 화면 하나이고, 화면 전체가 그 계열 300이다(D-059·D-053).
// 위쪽에 그 계열의 친구와 그 옆(오른쪽)의 바구니 하나(D-068), 그 아래에 진단이 아닌 질문형 제목, 세부 감정 pill 구름이다. 검색창은 없다(D-065) — 슬픔(53)·기쁨(32)도 가나다순 구름을 스크롤한다.
// 친구+바구니 영역은 sticky다: 스크롤 전에는 큰 친구(약 200px)와 바구니이고, 목록을 내려가면 함께 컴팩트(약 104px)로 줄어 화면 위에 남는다 — 돌이 담기는 바구니가 화면 밖으로 밀려나지 않는다.
// pill을 켜면 그 계열의 조약돌이 pill의 체크 자리에서 바구니로 미끄러져 담기고, 끄면 그 돌이 바구니에서 올라오며 사라진다.
// 접근성은 토글 버튼 그룹(aria-pressed)이고 Tab·Space·Enter로 조작된다. 바구니와 돌은 장식이다(aria-hidden).
import { el, announce } from "../dom.js";
import { category } from "../data.js";
import { state, toggleEmotion } from "../state.js";
import { friendSpot } from "./friend.js";
import { createBasket } from "./pile.js";

// onSkip: "이 계열은 빼기".
export function renderDetail(cat, { index, total, onSkip } = {}) {
  const c = category(cat);
  const emotions = c.emotions.slice().sort((a, b) => a.label.localeCompare(b.label, "ko"));
  const isOn = (code) => state.draft.emotions.some((x) => x.code === code);
  const chosen = () => state.draft.emotions.filter((e) => e.cat === cat);
  const basket = createBasket(cat);
  const stage = el("div", { class: "detail-stage" }, el("div", { class: "stage-art" }, friendSpot(cat, { size: 200, label: true, breathe: true }), basket.node));
  const error = el("p", { class: "field-error", id: `detailError-${cat}`, hidden: true });
  const hint = el("p", { class: "blocked-hint", id: `detailHint-${cat}`, hidden: true }); // 못 누르는 '다음'을 눌렀을 때 고를 자리 바로 위에 뜨는 안내(D-098 ③, write.js showBlocked)
  const cloud = el("div", { class: "cloud", id: `cloud-${cat}`, role: "group", "aria-label": `${c.label}의 세부 감정, 여러 개 선택` });

  for (const e of emotions) {
    const btn = el("button", { type: "button", class: "choice", "aria-pressed": String(isOn(e.code)), "data-code": e.code },
      el("span", { class: "ck", "aria-hidden": "true", text: "✓" }), el("span", { text: e.label }));
    btn.addEventListener("click", () => {
      const on = toggleEmotion(e);
      btn.setAttribute("aria-pressed", String(on));
      if (on) basket.add(e.code, btn.querySelector(".ck")); else basket.remove(e.code);
      error.hidden = true;
      announce(`${e.label} ${on ? "선택됨" : "선택 해제됨"}, ${c.label}에서 ${chosen().length}개 선택`);
    });
    cloud.append(btn);
  }
  basket.restore(chosen().map((e) => e.code));

  // 스테이지가 위에 붙는(sticky) 순간부터 컴팩트다. 크기가 아니라 축소(transform)라 이 판단이 되먹임하지 않는다. 화면이 바뀌면 리스너를 거둔다.
  // 붙는 자리는 CSS의 sticky top(시안 띠 + 위 줄 44px)이 정하므로 그 계산값을 읽어 비교한다 — 띠 높이만 쓰면 위 줄이 붙은 뒤로는 한 번도 컴팩트가 켜지지 않는다(2026-09-22 바로잡음).
  let mounted = false;
  const onScroll = () => {
    if (stage.isConnected) { mounted = true; stage.classList.toggle("compact", stage.getBoundingClientRect().top <= (parseFloat(getComputedStyle(stage).top) || 0) + 1); }
    else if (mounted) window.removeEventListener("scroll", onScroll);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  requestAnimationFrame(onScroll);

  return el("div", { class: "detail" }, stage,
    total > 1 ? el("p", { class: "detail-label", text: `${c.label} · ${index + 1}/${total}` }) : null,
    el("h1", { tabindex: "-1", text: `${c.label} 중에서 어떤 마음이었나요?` }),
    el("p", { class: "lede", text: "가까운 말을 여러 개 골라도 돼요. 정답은 없어요." }),
    onSkip ? el("button", { type: "button", class: "link detail-skip", text: "이 계열은 빼기", onclick: onSkip }) : null,
    hint, cloud, error);
}
