// 기록 카드(DESIGN_SYSTEM §6.8): 원형 순서(날짜 → 사건 → 감정 → 이유 → 칭찬 → 감사)를 유지한다.
// 대표 캐릭터는 카테고리 표시에만 쓴다. 감정은 색을 섞지 않고 독립 chip으로, 이름과 강도 숫자를 함께 보인다.
import { el } from "../dom.js";
import { category, characterPicture } from "../data.js";
import { formatDate } from "../state.js";

const block = (label, body, edit) => el("div", { class: "card-block" },
  el("div", { class: "card-label" }, el("span", { class: "lbl", text: label }), edit), body);

export function emotionChip(e) {
  return el("span", { class: "chip", style: { "--fill": `var(--${e.cat}-chip-fill)`, "--line": `var(--${e.cat}-chip-border)`, "--ink": `var(--${e.cat}-chip-text)`, "--c": `var(--${e.cat}-accent)` } },
    el("i", { class: "dot", "aria-hidden": "true" }), `${e.label} · ${e.intensity == null ? "강도 미정" : `강도 ${e.intensity}`}`);
}

// onEdit(field)가 있으면 영역마다 "수정" 링크를 단다(검토 화면).
export function renderRecordCard(entry, { onEdit, status } = {}) {
  const edit = (field, name) => onEdit ? el("button", { type: "button", class: "link", "aria-label": `${name} 수정`, text: "수정", onclick: () => onEdit(field) }) : null;
  const text = (value) => value.trim() ? el("p", { class: "card-text", text: value }) : el("p", { class: "card-text empty", text: "아직 적지 않았습니다" });
  const slots = (values, name) => el("ol", { class: "slots" }, values.map((v, i) => el("li", { class: v.trim() ? "slot filled" : "slot", text: v.trim() || `${name} ${i + 1}` })));
  const cats = [...new Set(entry.emotions.map((e) => e.cat))];
  const emotions = cats.length
    ? el("div", { class: "card-emotions" }, cats.map((k) => el("div", { class: "card-cat" },
        el("div", { class: "card-cat-head" }, characterPicture(k, { decorative: true }), el("span", { text: category(k).label })),
        el("div", { class: "chips" }, entry.emotions.filter((e) => e.cat === k).map(emotionChip)))))
    : el("p", { class: "card-text empty", text: "아직 고르지 않았습니다" });

  return el("article", { class: "card", "aria-label": `${formatDate(entry.date)} 기록` },
    el("div", { class: "card-date" }, el("span", { text: formatDate(entry.date) }), status ? el("span", { class: "badge", text: status }) : null, edit("date", "날짜")),
    block("일어난 사건", text(entry.event), edit("event", "사건")),
    block("내가 느낀 감정", emotions, edit("emotions", "감정")),
    block("왜 그런 감정이 들었을까", text(entry.reason), edit("reason", "이유")),
    block("칭찬할 점 세 가지", slots(entry.praise, "칭찬"), edit("praise", "칭찬")),
    block("감사할 점 세 가지", slots(entry.thanks, "감사"), edit("thanks", "감사")));
}
