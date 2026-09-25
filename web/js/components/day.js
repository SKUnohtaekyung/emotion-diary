// 달력 칸과 범례가 쓰는 날짜 모양(DESIGN_SYSTEM §6.7). 오늘 화면의 "이번 주 길"은 없어져 지금은 달력만 쓴다.
// 상태는 서비스 색과 조약돌 모양으로만 구분한다 — 완료=채운 돌, 임시저장=점선 돌 윤곽+연필, 기록 없음=빈 자리(희미한 윤곽선), 오늘=mint 칸. 감정 색·친구·빛은 쓰지 않는다.
// 모양의 뜻은 바탕과 상관없고 색은 CSS가 정한다. 어두운 숲 위(달력, tabs-dark.css): 완료=옅은 돌+ink 숫자, 임시저장=흰 점선+흰 연필, 오늘=mint 채움+ink 숫자, 미래=35% 불투명.
import { el, svgEl } from "../dom.js";

const pencilIcon = () => svgEl("svg", { viewBox: "0 0 24 24", class: "pencil", "aria-hidden": "true" },
  svgEl("path", { d: "M4 20l1-4.2L16.3 4.6a1.6 1.6 0 0 1 2.3 0l.8.8a1.6 1.6 0 0 1 0 2.3L8.2 19zM14.2 6.8l3 3" }));

// tag: 달력은 "button", 이번 주 길과 범례는 눌리지 않는 "div"·"span". mini는 범례용 24px 견본이라 숫자가 없다.
export function dayCell({ tag = "div", day, status, today = false, mini = false, ...props }) {
  return el(tag, { class: `day ${status}${today ? " today" : ""}${mini ? " mini" : ""}`, ...props },
    mini ? null : el("span", { class: "day-num", text: String(day) }),
    status === "draft" ? pencilIcon() : null);
}
