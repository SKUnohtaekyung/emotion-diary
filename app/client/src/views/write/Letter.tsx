// 나에게 쓰는 편지(D-063) — 작성 흐름의 마지막 단계이자 기록 보기(읽기)다. 시안 web/js/components/letter.js를 옮겼다(TASK-JOURNAL-01 J-5).
// 닫힌 봉투를 누르면 뚜껑이 열리고 카드가 올라와 옆으로 넘긴다. 열지 않고도 남길 수 있다(카드는 처음부터 문서 안에 있다 — 낭독기·찾기에도 닿는다).
// 카드: 감정(계열당 한 장, 세부 감정이 9개 이상이면 '이어지는 카드') · 있었던 일과 이유 · 칭찬 · 감사(채운 것만). 카드마다 '고치기'가 그 단계로.
// 넘기기는 스와이프만 두지 않는다 — 이전·다음 화살표와 점(10장까지, 그 위는 '3 / 18'), ←→ 키(WCAG 2.5.1). 끝 화살표는 aria-disabled(초점을 지킨다).
// 크기는 숫자와 열 점으로만 — 조약돌 크기·색 농도로 그리지 않는다(D-050). 움직임 줄이기에서는 봉투 연출 없이 바로 열린다.
// 장면(숲 속 빈터의 빛·빛 알갱이·조약돌)은 장식이다(aria-hidden). 봉투의 clipPath id는 화면마다 고유하다(같은 문서에 둘이 있어도 섞이지 않게, MAP §3).

import type { JSX } from "preact";
import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import { CATEGORIES } from "../../../../shared/taxonomy";
import { announce } from "../../lib/dom";
import { FRIENDS, pebbleUrl } from "../../lib/art";
import { monthDayWeekday } from "../../lib/format";
import { prefersReducedMotion } from "../../lib/motion";
import { ChevronLeft, ChevronRight, PencilGlyph } from "../../ui/icons";
import { categoryLabel, emotionLabel, type StepKey, type WorkingDiary } from "../../write/flow";

export type LetterPhase = "closed" | "opening" | "opened";

/** 봉인 연출(seal.ts)이 만지는 자리 */
export interface LetterHandle {
  stage: HTMLElement | null;
}

const CARD_CHIPS = 8; // 카드 한 장에 세부 감정 최대 8개 — 9개부터 이어지는 카드(D-079)
const MANY_FROM = 5; // 5개부터 32px 두 열
const MAX_DOTS = 10; // 점은 10장까지(D-101) — 그 이상은 숫자
const OPEN_MS = 2400;
let envelopeSeq = 0;
const nextClip = (): string => {
  envelopeSeq += 1;
  return `envclip-${envelopeSeq}`;
};

// 빛 알갱이 넷 — [가로, 세로(틀 기준) px, 크기 px, 한 바퀴 s, 시작 어긋남 s, 이동 A(x,y), 이동 B(x,y)]
const MOTES = [
  [58, 104, 14, 12, 0, 4, -5, -4, 3],
  [312, 108, 14, 13, -6, 3, -5, -5, -1],
  [18, 320, 13, 12, -8, 5, 5, 5, -4],
  [346, 336, 13, 13, -4, -5, -3, 5, 4]
] as const;
// 그날 고른 계열의 조약돌: 캡션 아래 땅 띠에 가운데 기준 좌우 대칭인 얕은 호(시안 arcSlot — 어느 개수에서도 서로 안 겹친다)
const arcSlot = (k: number) => {
  const ak = Math.abs(k);
  return { dx: Math.sign(k) * (50 * ak - 2.25 * ak * ak), dy: 86 - ak * 4, size: Math.max(24, 44 - ak * 4.5), r: -k * 2 };
};

const px = (n: number) => `${n}px`;
const nonblank = (list: readonly string[]) => list.filter((text) => text.trim() !== "");
const chunk = <T,>(list: readonly T[], n: number): T[][] =>
  Array.from({ length: Math.max(1, Math.ceil(list.length / n)) }, (_, k) => list.slice(k * n, k * n + n));
/** '2026. 11. 12. 목' — 이야기 카드 머리의 날짜 */
const shortDate = (iso: string): string => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}. ${m}. ${d}. ${monthDayWeekday(iso).slice(-3, -2)}`;
};

function EditTag({ label, onEdit, top = 14 }: { label: string; onEdit: () => void; top?: number }) {
  return (
    <button type="button" class="edit-tag" aria-label={label} style={{ top: px(top) }} onClick={onEdit}>
      <i class="tape" aria-hidden="true" />
      <PencilGlyph />
      <span>고치기</span>
    </button>
  );
}

/** 세부 감정 알약: 1~4개는 한 열, 5~8개는 두 열(첫 열 = ceil(n/2)) — 더 줄지 않는다(D-079) */
function Chips({ labels }: { labels: string[] }) {
  const many = labels.length >= MANY_FROM;
  const half = Math.ceil(labels.length / 2);
  const cols = many ? [labels.slice(0, half), labels.slice(half)] : [labels];
  return (
    <div class={many ? "chips many" : "chips"}>
      {cols.map((col, i) => (
        <div class="chip-col" key={i}>
          {col.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

interface Card {
  key: string;
  label: string;
  node: (aria: string) => JSX.Element;
}

function buildCards(diary: WorkingDiary, date: string, day: string, onEdit?: (target: StepKey) => void): Card[] {
  const edit = (target: StepKey) => () => onEdit?.(target);
  const cards: Card[] = [];
  const cats = diary.categories;
  cats.forEach((category, i) => {
    const code = category.code;
    const label = categoryLabel(code);
    const friend = FRIENDS[code]?.name ?? "";
    const labels = diary.emotions.filter((item) => item.category === code).map((item) => emotionLabel(item.code));
    const val = category.intensity;
    const parts = chunk(labels, CARD_CHIPS);
    const tint = { "--tint": `var(--${code}-300)` };
    parts.forEach((part, pi) => {
      if (pi === 0) {
        cards.push({
          key: `emotion:${code}`,
          label: `${i + 1}번째 마음, ${label}`,
          node: (aria) => (
            // biome-ignore lint/a11y/useSemanticElements: 캐러셀의 한 장(WAI carousel — role group)
            <div class="card t1" role="group" aria-label={aria} style={tint} key={`emotion:${code}`}>
              <p class="lab">{`마음 ${i + 1} / ${cats.length}`}</p>
              <EditTag label={`${label} 고치기`} onEdit={edit({ step: "details", category: code })} />
              <p class="ename">{label}</p>
              <img class="pebble-img" src={pebbleUrl(code, part.length >= MANY_FROM ? 80 : 170)} alt="" />
              <Chips labels={part} />
              <i class="rule" />
              <div class="size">
                <small>크기</small>
                <div class="val">
                  <b>{val === null ? "–" : String(val)}</b>
                  <em>/ 10</em>
                </div>
                <div class="d10" aria-hidden="true">
                  {Array.from({ length: 10 }, (_, k) => (
                    <i class={val !== null && k < val ? "f" : ""} key={k} />
                  ))}
                </div>
              </div>
              <span class="sr-only">
                {`${friend}, ${label}, 크기 ${val === null ? "아직 정하지 않음" : `${val}점 만점 10점`}${parts.length > 1 ? `. 세부 감정이 많아 카드 ${parts.length}장에 나뉘었고 이 카드는 1번째예요` : ""}`}
              </span>
            </div>
          )
        });
      } else {
        // 이어지는 카드: 같은 크기·같은 계열 면. 크기(강도)는 계열의 값이라 첫 카드에만 둔다
        cards.push({
          key: `emotion:${code}:${pi}`,
          label: `${label} 이어서 ${pi + 1}/${parts.length}`,
          node: (aria) => (
            // biome-ignore lint/a11y/useSemanticElements: 캐러셀의 한 장(WAI carousel — role group)
            <div class="card t1 t1-more" role="group" aria-label={aria} style={tint} key={`emotion:${code}:${pi}`}>
              <p class="lab">{`${label} · 이어서 ${pi + 1}/${parts.length}`}</p>
              <EditTag label={`${label} 고치기`} onEdit={edit({ step: "details", category: code })} />
              <div class="t1-more-body">
                <p class="ename2">{label}</p>
                <Chips labels={part} />
              </div>
              <span class="sr-only">{`${friend}, ${label} 이어서 ${pi + 1}/${parts.length}, 세부 감정 ${part.length}개`}</span>
            </div>
          )
        });
      }
    });
  });
  // 있었던 일과 이유: 줄 노트 종이. 글이 길면 종이(줄과 함께)가 스크롤되고 날짜·테이프는 그대로
  const line = (title: string, target: StepKey, label: string) => (
    <div class="lt-line">
      <p class="k">{title}</p>
      <EditTag label={label} onEdit={edit(target)} top={-4} />
    </div>
  );
  cards.push({
    key: "story",
    label: "있었던 일과 이유",
    node: (aria) => (
      // biome-ignore lint/a11y/useSemanticElements: 캐러셀의 한 장(WAI carousel — role group)
      <div class="card t2" role="group" aria-label={aria} key="story">
        <i class="tape big" aria-hidden="true" />
        <p class="lab2">{shortDate(date)}</p>
        <div class="lt-paper lt-scroll">
          {line(`${day} 있었던 일`, { step: "event", category: null }, "있었던 일 고치기")}
          <p class="v ev">{diary.eventText}</p>
          {line("이런 마음이 든 이유", { step: "reason", category: null }, "이유 고치기")}
          <p class="v">{diary.reasonText}</p>
        </div>
      </div>
    )
  });
  for (const [kind, title, step] of [
    ["praises", "칭찬", "praise"],
    ["gratitudes", "감사", "gratitude"]
  ] as const) {
    const items = nonblank(diary[kind]);
    if (!items.length) continue; // 비워 둔 날은 그 장을 건너뛴다(D-063)
    cards.push({
      key: kind,
      label: title,
      node: (aria) => (
        // biome-ignore lint/a11y/useSemanticElements: 캐러셀의 한 장(WAI carousel — role group)
        <div class={items.length > 1 ? "card t3 list" : "card t3"} role="group" aria-label={aria} key={kind}>
          <p class="lab3">{title}</p>
          <EditTag label={`${title} 고치기`} onEdit={edit({ step, category: null })} />
          <div class="lt-body lt-scroll">
            {items.length === 1 ? (
              <p class="q">{items[0]}</p>
            ) : (
              <ul class="qs">
                {items.map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
            )}
            <div class="lt-sign">
              <p class="sig">{`— ${day}의 나에게`}</p>
              <i class="seal2" aria-hidden="true" />
            </div>
          </div>
        </div>
      )
    });
  }
  return cards;
}

function Envelope({ id }: { id: string }) {
  const body = "M0 0H280V174a16 16 0 0 1-16 16H16A16 16 0 0 1 0 174Z";
  return (
    <svg viewBox="0 0 280 190" class="env-svg" aria-hidden="true">
      <defs>
        <clipPath id={id}>
          <path d={body} />
        </clipPath>
      </defs>
      <g clip-path={`url(#${id})`}>
        <rect width="280" height="190" class="e-body" />
        <polygon points="0,0 0,190 150,104" class="e-fold" />
        <polygon points="280,0 280,190 130,104" class="e-fold" />
        <polygon points="0,190 280,190 140,92" class="e-fold-light" />
      </g>
      <text x="140" y="158" text-anchor="middle" class="e-to">
        나에게
      </text>
    </svg>
  );
}

export interface LetterProps {
  diary: WorkingDiary;
  date: string;
  day: "오늘" | "그날";
  mode: "write" | "read";
  onEdit?: (target: StepKey) => void;
  onOpened?: () => void;
  handle?: LetterHandle;
}

export function Letter({ diary, date, day, mode, onEdit, onOpened, handle }: LetterProps) {
  const [phase, setPhase] = useState<LetterPhase>(mode === "read" ? "opened" : "closed");
  const [at, setAt] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const pager = useRef<HTMLDivElement>(null);
  const clipRef = useRef<string | null>(null);
  if (clipRef.current === null) clipRef.current = nextClip();
  const clip = clipRef.current;
  const spoken = useRef(0);
  const cards = buildCards(diary, date, day, onEdit);
  const total = cards.length;
  const cats = CATEGORIES.map((item) => item.code).filter((code) => diary.categories.some((item) => item.code === code));
  if (handle) handle.stage = stage.current;

  const step = (): number => {
    const first = pager.current?.firstElementChild;
    return first ? first.getBoundingClientRect().width + 8 : 336; // +8은 카드 사이(.pager gap)
  };
  const index = (): number => {
    const node = pager.current;
    if (!node) return 0;
    const width = step();
    return width > 0 ? Math.min(total - 1, Math.max(0, Math.round(node.scrollLeft / width))) : 0;
  };
  const go = (delta: number): void => {
    pager.current?.scrollTo({ left: (index() + delta) * step(), behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  // 넘치는 글 칸만 키보드로 닿는다(tabindex)
  const markScrollers = (): void => {
    for (const node of stage.current?.querySelectorAll<HTMLElement>(".lt-scroll") ?? []) {
      if (node.scrollHeight > node.clientHeight + 1) node.setAttribute("tabindex", "0");
      else node.removeAttribute("tabindex");
    }
  };

  useLayoutEffect(() => {
    if (handle) handle.stage = stage.current;
    const frame = requestAnimationFrame(markScrollers);
    void document.fonts?.ready.then(markScrollers);
    return () => cancelAnimationFrame(frame);
  });

  useEffect(() => {
    const node = pager.current;
    if (!node) return;
    let frame = 0;
    const onScroll = (): void => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const i = index();
        setAt(i);
        // 장이 바뀌면 '3장 중 2장, 칭찬'(D-099 pager K1) — 편지가 열린 뒤에만
        if (phase === "opened" && i !== spoken.current && cards[i]) {
          spoken.current = i;
          announce(`${total}장 중 ${i + 1}장, ${cards[i].label}`);
        }
      });
    };
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      node.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [phase, total]);

  // 글이 바뀌어 장 수가 줄면 지금 자리가 끝을 넘지 않게
  const shown = Math.min(at, total - 1);

  const open = (): void => {
    if (phase !== "closed") return;
    const done = (message: string): void => {
      setPhase("opened");
      announce(message);
      onOpened?.();
      requestAnimationFrame(() => pager.current?.focus({ preventScroll: true })); // 봉투가 사라지면 초점을 카드 묶음으로(← → 로 바로 넘긴다)
    };
    if (prefersReducedMotion()) {
      done(`편지를 열었어요. 카드 ${total}장`);
      return;
    }
    setPhase("opening");
    window.setTimeout(() => {
      if (stage.current?.isConnected) done(`편지를 열었어요. 카드 ${total}장, 옆으로 넘겨서 확인해요`);
    }, OPEN_MS);
  };

  const off = (end: boolean) => (end ? "true" : undefined);

  return (
    <div class={`letter letter-stage ${phase}`} ref={stage}>
      <div class="lt-frame">
        <div class="lt-scene" aria-hidden="true">
          <i class="lt-floor" />
          <i class="lt-glow">
            <i />
          </i>
          <i class="lt-burst" />
          <i class="lt-halo" />
          {MOTES.map(([x, y, s, t, d, ax, ay, bx, by]) => (
            <i
              class="lt-mote"
              key={`${x}-${y}`}
              style={{
                "--x": px(x),
                "--y": px(y),
                "--s": px(s),
                "--t": `${t}s`,
                "--d": `${d}s`,
                "--ax": px(ax),
                "--ay": px(ay),
                "--bx": px(bx),
                "--by": px(by)
              }}
            />
          ))}
          {cats.slice(0, 9).map((code, i, list) => {
            const slot = arcSlot(i - (list.length - 1) / 2);
            return (
              <span class="lt-rp-wrap" key={code} style={{ "--dx": px(slot.dx), "--dy": px(slot.dy) }}>
                <i class="lt-rp-shadow" />
                <img class="lt-rp" src={pebbleUrl(code, slot.size)} alt="" width={Math.round(slot.size)} style={{ "--r": `${slot.r}deg` }} />
              </span>
            );
          })}
        </div>
        <div class="envback">
          <svg viewBox="0 0 280 190" class="env-svg" aria-hidden="true">
            <path d="M0 0H280V174a16 16 0 0 1-16 16H16A16 16 0 0 1 0 174Z" class="e-back" />
          </svg>
        </div>
        <div class="pagerclip">
          <section
            class="pager"
            ref={pager}
            tabIndex={phase === "opened" ? 0 : -1}
            aria-roledescription="carousel"
            aria-label={`${day}의 편지`}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" && shown < total - 1) {
                go(1);
                event.preventDefault();
              }
              if (event.key === "ArrowLeft" && shown > 0) {
                go(-1);
                event.preventDefault();
              }
            }}
          >
            {cards.map((card, i) => card.node(`${i + 1} / ${total}, ${card.label}`))}
          </section>
        </div>
        {/* 봉투 조각은 열린 뒤에도 남는다(CSS가 숨긴다) — 남길 때 봉인 연출이 다시 꺼내 뚜껑을 닫는다(seal.ts) */}
        <button type="button" class="envfront" aria-label="편지 봉투 열기" onClick={open}>
              <Envelope id={clip} />
            </button>
            <div class="flapwrap">
              <div class="flap">
                <div class="f-out" />
                <div class="f-in" />
                <div class="sealw">
                  <i class="seal" />
                </div>
              </div>
            </div>
            <p class="envcap" aria-hidden="true">
              봉투를 눌러 열어요
            </p>
        <div class="letter-nav">
          <button type="button" class="ar" aria-label="이전 장" aria-disabled={off(shown <= 0)} onClick={() => shown > 0 && go(-1)}>
            <ChevronLeft />
          </button>
          {total > MAX_DOTS ? (
            <div class="dd count" aria-hidden="true">
              <b>{String(shown + 1)}</b>
              <span>{`/ ${total}`}</span>
            </div>
          ) : (
            <div class="dd" aria-hidden="true">
              {cards.map((card, i) => (
                <i class={i === shown ? "on" : ""} key={card.key} />
              ))}
            </div>
          )}
          <button type="button" class="ar" aria-label="다음 장" aria-disabled={off(shown >= total - 1)} onClick={() => shown < total - 1 && go(1)}>
            <ChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}
