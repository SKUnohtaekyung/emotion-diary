// 시안의 선 아이콘(web/js/views/tabs.js·stats.js와 같은 경로). 아이콘은 장식이라 aria-hidden이고 이름은 버튼의 aria-label이 말한다(icon-button.md).

const svg = (d: string) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} />
  </svg>
);

export const ChevronLeft = () => svg("M14.5 5.5 8 12l6.5 6.5");
export const ChevronRight = () => svg("M9.5 5.5 16 12l-6.5 6.5");
export const CloseIcon = () => svg("M6 6l12 12M18 6 6 18");
export const HomeGlyph = () => svg("M12 4 4 10.4V20h4.5v-6h7v6H20v-9.6z");
export const PencilGlyph = () => svg("M4 20l4.2-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20zM13.5 7.5l3 3");

/** ⋯ 더보기 — 선이 아니라 채운 점 셋(시안 write.js dotsIcon). */
export const DotsIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" class="dots3">
    <circle cx="5" cy="12" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="19" cy="12" r="1.7" />
  </svg>
);
