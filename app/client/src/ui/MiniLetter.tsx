// 달력 아래의 작은 편지(D-100 ③ — 시안 web/js/components/mini-letter.js를 옮김, TASK-REFLECT-01 R-3).
// 같은 편지의 모양(감정 색 면·감정 이름·조약돌·세부 감정 알약·크기, 종이 면의 있었던 일과 이유, 크림 면의 칭찬·감사, 고치기 태그)을
// 남는 높이(height — 달력이 잰다)에 맞춘 작은 카드로 옆으로 넘겨 본다. 카드를 누르면 편지 전체(onOpen), 고치기는 그 카드의 단계로(onEdit, D-100 ②).
// 긴 글은 줄 수를 잘라 보인다 — 전체는 편지에서 읽는다. 세부 감정 알약은 한 줄에 들어가는 만큼만 보이고 남은 수는 '+N'(고른 말의 수를 숨기지 않는다).

import type { ComponentChildren } from "preact";
import { useEffect, useLayoutEffect, useRef } from "preact/hooks";
import type { DiaryEntryView } from "../../../shared/diary";
import { announce } from "../lib/dom";
import { pebbleUrl } from "../lib/art";
import { prefersReducedMotion } from "../lib/motion";
import { categoryLabel } from "../write/flow";
import { EMOTIONS } from "../../../shared/taxonomy";

export type EditTarget = { step: "details"; category: string } | { step: "event" | "praise" | "gratitude"; category: null };

interface Card {
  label: string;
  target: EditTarget;
  kind: "emo" | "paper" | "note";
  category?: string;
  body: ComponentChildren;
}

const Pencil = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" class="ml-ico">
    <path d="M4 20l4.2-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20z" />
  </svg>
);
const Chevron = ({ dir }: { dir: -1 | 1 }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" class="ml-ico">
    <path d={dir < 0 ? "M14.5 5.5 8 12l6.5 6.5" : "M9.5 5.5 16 12l-6.5 6.5"} />
  </svg>
);

const nonblank = (values: string[]) => values.map((value) => value.trim()).filter(Boolean);
const labelOf = (code: string, snapshot: string) => EMOTIONS.get(code)?.label ?? snapshot;

function cardsOf(entry: DiaryEntryView): Card[] {
  const cats = entry.categories.map((category) => category.categoryCode).filter((code) => entry.emotions.some((emotion) => emotion.categoryCode === code));
  const cards: Card[] = cats.map((code, index) => {
    const words = entry.emotions.filter((emotion) => emotion.categoryCode === code).map((emotion) => labelOf(emotion.emotionCode, emotion.labelSnapshot));
    const size = entry.categories.find((category) => category.categoryCode === code)?.intensity;
    const label = categoryLabel(code);
    return {
      label,
      target: { step: "details", category: code },
      kind: "emo",
      category: code,
      body: (
        <>
          <p class="ml-lab">{`마음 ${index + 1} / ${cats.length}`}</p>
          <p class="ml-name">{label}</p>
          <img class="pebble-img ml-pebble" src={pebbleUrl(code, 72)} width={72} height={72} alt="" decoding="async" />
          <div class="ml-foot">
            <div class="ml-chips">
              {words.map((word) => (
                <span key={word}>{word}</span>
              ))}
            </div>
            <p class="ml-size">
              <b>{size === null || size === undefined ? "–" : String(size)}</b>
              <span> / 10</span>
            </p>
          </div>
        </>
      )
    };
  });
  const story = (
    [
      ["있었던 일", entry.eventText],
      ["이유", entry.reasonText]
    ] as const
  ).filter(([, value]) => value.trim());
  if (story.length) {
    cards.push({
      label: "있었던 일과 이유",
      target: { step: "event", category: null },
      kind: "paper",
      body: (
        <>
          <p class="ml-lab">있었던 일과 이유</p>
          {story.map(([heading, value]) => (
            <p class="ml-line" key={heading}>
              <b>{heading}</b>
              {value.trim()}
            </p>
          ))}
        </>
      )
    });
  }
  for (const [items, title, step] of [
    [entry.praises, "칭찬", "praise"],
    [entry.gratitudes, "감사", "gratitude"]
  ] as const) {
    const texts = nonblank(items.map((item) => item.text));
    if (!texts.length) continue;
    cards.push({
      label: title,
      target: { step, category: null },
      kind: "note",
      body: (
        <>
          <p class="ml-lab">{title}</p>
          <p class="ml-quote">{texts.join(" · ")}</p>
        </>
      )
    });
  }
  return cards;
}

/** 알약 줄마다 들어가는 만큼만 보이고 남은 수를 '+N'으로 — 시안 fitChips와 같은 계산(폭은 그린 뒤에만 잴 수 있다). */
function fitChips(root: HTMLElement): void {
  for (const row of root.querySelectorAll<HTMLElement>(".ml-chips")) {
    row.querySelector(".ml-more")?.remove();
    const chips = [...row.children] as HTMLElement[];
    for (const chip of chips) chip.hidden = false;
    if (!row.clientWidth) continue;
    const gap = Number.parseFloat(getComputedStyle(row).columnGap) || 6;
    const room = row.clientWidth;
    const more = document.createElement("span");
    more.className = "ml-more";
    row.append(more);
    const moreWidth = (count: number) => {
      more.textContent = `+${count}`;
      return more.getBoundingClientRect().width;
    };
    let used = 0;
    let shown = 0;
    for (let index = 0; index < chips.length; index += 1) {
      const width = chips[index]?.getBoundingClientRect().width ?? 0;
      const left = chips.length - index - 1;
      const need = used + (shown ? gap : 0) + width + (left ? gap + moreWidth(left) : 0);
      if (need > room && shown) break;
      used += (shown ? gap : 0) + width;
      shown += 1;
    }
    for (const chip of chips.slice(shown)) chip.hidden = true;
    const rest = chips.length - shown;
    if (rest) {
      more.textContent = `+${rest}`;
      more.setAttribute("aria-label", `외 ${rest}개`);
    } else more.remove();
  }
}

export function MiniLetter({ entry, height, onOpen, onEdit }: { entry: DiaryEntryView; height: number; onOpen: () => void; onEdit: (target: EditTarget) => void }) {
  const cards = cardsOf(entry);
  const root = useRef<HTMLDivElement>(null);
  const pager = useRef<HTMLElement>(null);
  const prev = useRef<HTMLButtonElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  const dots = useRef<HTMLSpanElement>(null);
  const spoken = useRef(0);

  // 넘김: 스크롤 스냅, 양 끝 화살표는 aria-disabled, 장이 바뀌면 'N장 중 M장'을 읽는다(시안과 같다). 값은 DOM에서 읽고 DOM에만 칠한다(다시 그리지 않는다).
  const step = () => (pager.current?.querySelector(".ml-card")?.getBoundingClientRect().width ?? 300) + 8;
  const index = () => Math.round((pager.current?.scrollLeft ?? 0) / step());
  const paint = () => {
    const at = Math.min(cards.length - 1, index());
    for (const [k, dot] of [...(dots.current?.querySelectorAll("i") ?? [])].entries()) dot.classList.toggle("on", k === at);
    const off = (button: HTMLButtonElement | null, value: boolean) => {
      if (!button) return;
      if (value) button.setAttribute("aria-disabled", "true");
      else button.removeAttribute("aria-disabled");
    };
    off(prev.current, at === 0);
    off(next.current, at >= cards.length - 1);
    if (at !== spoken.current) {
      spoken.current = at;
      announce(`${cards.length}장 중 ${at + 1}장, ${cards[at]?.label ?? ""}`);
    }
  };
  const go = (delta: number) => pager.current?.scrollTo({ left: (index() + delta) * step(), behavior: prefersReducedMotion() ? "auto" : "smooth" });

  useLayoutEffect(() => {
    const node = root.current;
    if (!node) return;
    node.style.setProperty("--ml-h", `${height}px`);
    node.classList.toggle("compact", height < 150);
    fitChips(node);
    paint();
  });
  useEffect(() => {
    const node = root.current;
    void document.fonts?.ready.then(() => {
      if (node?.isConnected) fitChips(node);
    });
  }, []);

  const press = (button: HTMLButtonElement | null, delta: number) => {
    if (button?.getAttribute("aria-disabled") !== "true") go(delta);
  };

  return (
    <div class="ml" ref={root}>
      <section
        class="ml-pager"
        ref={pager}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: 옆으로 넘기는 영역은 초점을 받아 ←→로 넘긴다(D-099 pager K1, axe scrollable-region-focusable)
        tabIndex={0}
        aria-roledescription="carousel"
        aria-label="그날의 편지"
        onScroll={() => requestAnimationFrame(paint)}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            press(next.current, 1);
            event.preventDefault();
          }
          if (event.key === "ArrowLeft") {
            press(prev.current, -1);
            event.preventDefault();
          }
        }}
      >
        {cards.map((card, k) => (
          <article
            key={card.label}
            class={`ml-card ml-${card.kind}`}
            style={card.category ? { "--tint": `var(--${card.category}-300)` } : undefined}
            aria-roledescription="카드"
            aria-label={`${k + 1} / ${cards.length}, ${card.label}`}
          >
            {card.body}
            <button type="button" class="ml-open" aria-label={`${card.label} — 편지 열기`} onClick={onOpen} />
            <button type="button" class="ml-edit" aria-label={`${card.label} 고치기`} onClick={() => onEdit(card.target)}>
              <Pencil />
              고치기
            </button>
          </article>
        ))}
      </section>
      <div class={`ml-nav${cards.length < 2 ? " single" : ""}`}>
        <div class="ml-steps">
          <button type="button" class="ml-ar" ref={prev} aria-label="이전 장" onClick={() => press(prev.current, -1)}>
            <Chevron dir={-1} />
          </button>
          <span class="ml-dots" aria-hidden="true" ref={dots}>
            {cards.map((card) => (
              <i key={card.label} />
            ))}
          </span>
          <button type="button" class="ml-ar" ref={next} aria-label="다음 장" onClick={() => press(next.current, 1)}>
            <Chevron dir={1} />
          </button>
        </div>
        <button type="button" class="ml-big" onClick={onOpen}>
          편지 열기
          <Chevron dir={1} />
        </button>
      </div>
    </div>
  );
}
