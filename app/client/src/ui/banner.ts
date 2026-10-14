// 새 버전 띠(T3 A-5). 맨 위에 붙고 role="status"인 #banner 칸에 그린다.
// 새로 고치는 것은 사용자가 버튼을 누를 때뿐이다 — 쓰는 중에 저절로 새로 고치면 입력을 잃는다(RK-034·RK-037).

import { h } from "../lib/dom";
import type { VersionNotice } from "../lib/version";

export function renderVersionBanner(notice: VersionNotice | null): void {
  const host = document.getElementById("banner");
  if (!host) return;
  // 같은 띠를 매번 다시 그리면 낭독기가 같은 말을 되풀이한다
  if ((notice?.kind ?? null) === host.getAttribute("data-kind")) return;
  host.replaceChildren();
  if (!notice) {
    host.removeAttribute("data-kind");
    return;
  }
  host.setAttribute("data-kind", notice.kind);
  const reload = h("button", { type: "button", class: "btn btn-small", text: "새로 고치기" });
  reload.addEventListener("click", () => {
    location.reload();
  });
  host.append(h("div", { class: "banner-row" }, h("span", { class: "banner-text", text: notice.message }), reload));
}
