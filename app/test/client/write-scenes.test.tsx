/// <reference path="../../client/src/env.d.ts" />
// 작성 흐름의 시안 장면 부품(TASK-JOURNAL-01 J-2): 언덕 위 친구(마음 고르기), 바구니(세부 감정), 자유 배치 → 격자 판단.
// 움직임·실제 배치는 E2E와 휴대폰이 본다 — 여기서는 이름·순서·개수·판단 규칙을 본다.
import { render } from "preact";
import { afterEach, describe, expect, it } from "vitest";
import { CATEGORIES, EMOTIONS } from "../../shared/taxonomy";
import { FRIENDS } from "../../client/src/lib/art";
import { anyOverlap } from "../../client/src/ui/freeGrid";
import { INTENSITY_BEFORE, intensityControl } from "../../client/src/ui/intensity";
import { BASKET_CAPACITY, Basket, type BasketHandle } from "../../client/src/views/write/Basket";
import { Meadow } from "../../client/src/views/write/Meadow";
import { EventScene, NotesScene, ReasonScene } from "../../client/src/views/write/PaperScenes";
import { Letter } from "../../client/src/views/write/Letter";
import { DoneLand, doneOrder } from "../../client/src/views/done";
import { emptyDiary, type WorkingDiary } from "../../client/src/write/flow";
import { flush } from "./helpers";

const host = (): HTMLElement => {
  const node = document.createElement("div");
  document.body.append(node);
  return node;
};

afterEach(() => {
  document.body.replaceChildren();
});

describe("마음 고르기 — 언덕 위 친구 아홉(D-066·D-128)", () => {
  it("taxonomy 선언 순서 그대로, 이름은 '<친구>, <계열>', 고른 것은 aria-pressed", () => {
    const root = host();
    render(<Meadow picked={new Set(["sadness"])} onToggle={() => {}} />, root);
    const buttons = [...root.querySelectorAll<HTMLButtonElement>(".ff")];
    expect(buttons.map((button) => button.dataset.category)).toEqual(CATEGORIES.map((category) => category.code));
    expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual(
      CATEGORIES.map((category) => `${FRIENDS[category.code]?.name}, ${category.label}`)
    );
    expect(root.querySelector('.ff[data-category="sadness"]')?.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector('.ff[data-category="joy"]')?.getAttribute("aria-pressed")).toBe("false");
    // 그림은 장식(옆에 이름 글자가 있다), 묶음 이름은 여러 개 고르기
    expect([...root.querySelectorAll(".ff img")].every((img) => img.getAttribute("alt") === "")).toBe(true);
    expect(root.querySelector('[role="group"]')?.getAttribute("aria-label")).toBe("오늘 머문 마음, 여러 개 선택");
    // 지난 날 흐름에서는 '그날'(D-082 — 마감 검토 4)
    render(<Meadow day="그날" picked={new Set()} onToggle={() => {}} />, root);
    expect(root.querySelector('[role="group"]')?.getAttribute("aria-label")).toBe("그날 머문 마음, 여러 개 선택");
  });

  it("모든 친구가 같은 크기의 자리를 쓴다 — 자리는 위치·기울기만 다르다", () => {
    const root = host();
    render(<Meadow picked={new Set()} onToggle={() => {}} />, root);
    const tilts = [...root.querySelectorAll<HTMLElement>(".ff")].map((button) => button.style.getPropertyValue("--tilt"));
    expect(tilts.every((tilt) => /^-?\d+deg$/.test(tilt) && Math.abs(Number.parseInt(tilt, 10)) <= 7)).toBe(true);
    expect([...root.querySelectorAll<HTMLElement>(".ff")].some((button) => button.style.getPropertyValue("width"))).toBe(false);
  });
});

describe("자유 배치 → 격자 판단(D-083 ③)", () => {
  const box = (left: number, top: number, width: number, height: number) => {
    const node = document.createElement("i");
    node.className = "cell";
    node.getBoundingClientRect = () => ({ left, top, right: left + width, bottom: top + height, width, height, x: left, y: top, toJSON: () => ({}) });
    return node;
  };

  it("상자가 하나라도 겹치면 참, 맞닿기만 하면 거짓", () => {
    const root = host();
    root.append(box(0, 0, 10, 10), box(10, 0, 10, 10));
    expect(anyOverlap(root, ".cell")).toBe(false);
    root.append(box(15, 5, 10, 10));
    expect(anyOverlap(root, ".cell")).toBe(true);
  });
});

describe("바구니(D-068)", () => {
  it("켠 세부 감정마다 돌 하나 — 9개를 넘으면 가장 오래된 돌이 자리를 내준다(개수가 늘지 않는다)", () => {
    const root = host();
    const handle: { current: BasketHandle | null } = { current: null };
    render(<Basket category="sadness" initial={[]} handle={handle} />, root);
    const stones = () => root.querySelectorAll(".bk-stone:not(.is-leaving)").length;
    for (let i = 0; i < BASKET_CAPACITY + 3; i += 1) handle.current?.add(`e${i}`);
    expect(BASKET_CAPACITY).toBe(9);
    expect(stones()).toBe(9);
    // 이미 자리를 내준 것을 꺼도 할 일이 없다
    handle.current?.remove("e0");
    expect(stones()).toBe(9);
    handle.current?.remove(`e${BASKET_CAPACITY + 2}`);
    expect(stones()).toBe(8);
  });

  it("다시 그릴 때는 나중에 켠 9개를 바로 놓고, 바구니와 돌은 장식이다", () => {
    const root = host();
    const handle: { current: BasketHandle | null } = { current: null };
    render(<Basket category="joy" initial={Array.from({ length: 12 }, (_, i) => `k${i}`)} handle={handle} />, root);
    expect(root.querySelectorAll(".bk-stone").length).toBe(9);
    expect(root.querySelector(".bk")?.getAttribute("aria-hidden")).toBe("true");
    expect([...root.querySelectorAll(".bk-stone")].every((stone) => stone.getAttribute("alt") === "")).toBe(true);
  });
});

describe("크기 — 길 위의 친구(D-037·D-069 ①): 진짜 컨트롤과 끌기 규칙은 평면판 그대로", () => {
  const make = (kind: "main" | "mini" = "main") => {
    const changes: number[] = [];
    const control = intensityControl({ id: "t", label: "슬픔 크기", value: null, onChange: (v) => changes.push(v), category: "sadness", kind });
    document.body.append(control.node);
    const scene = control.node.querySelector<HTMLElement>(".sz-scene") as HTMLElement;
    scene.getBoundingClientRect = () => ({ left: 0, top: 0, right: 300, bottom: 64, width: 300, height: 64, x: 0, y: 0, toJSON: () => ({}) });
    const hit = control.node.querySelector<HTMLElement>(".intensity-hit") as HTMLElement;
    const pointer = (type: string, x: number, y: number) => hit.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 1, bubbles: true }));
    return { control, changes, pointer, number: () => control.node.querySelector(".intensity-number")?.textContent };
  };

  it("정하기 전에는 '–'와 '아직 정하지 않음' — 기본값을 채우지 않는다", () => {
    const { control, number } = make();
    expect(number()).toBe("–");
    expect(control.node.querySelector(".intensity-range")?.getAttribute("aria-valuetext")).toBe("아직 정하지 않음");
    expect(control.node.querySelector(".intensity-anchor")?.textContent).toBe(INTENSITY_BEFORE);
  });

  it("세로로 움직이면(화면 내리기) 값을 정하지 않고, 누르기·가로 6px 넘는 끌기만 정한다", () => {
    const { changes, pointer, number } = make();
    pointer("pointerdown", 150, 30);
    pointer("pointermove", 152, 80);
    pointer("pointerup", 152, 80);
    expect(changes).toEqual([]);
    expect(number()).toBe("–");
    pointer("pointerdown", 150, 30);
    pointer("pointerup", 150, 30);
    expect(changes).toHaveLength(1);
    pointer("pointerdown", 30, 30);
    pointer("pointermove", 34, 30); // 6px 이하 — 아직 끌기가 아니다
    expect(changes).toHaveLength(1);
    pointer("pointermove", 290, 30);
    pointer("pointerup", 290, 30);
    expect(changes.at(-1)).toBe(10);
    expect(changes.every((v) => Number.isInteger(v) && v >= 1 && v <= 10)).toBe(true);
  });

  it("정하기 전 −/+는 가운데(5)부터, 끝에서는 aria-disabled로 초점을 지킨다", () => {
    const { control, changes } = make();
    control.node.querySelector<HTMLButtonElement>('[aria-label="슬픔 크기 올리기"]')?.click();
    expect(changes).toEqual([5]);
    control.set(10);
    expect(control.node.querySelector('[aria-label="슬픔 크기 올리기"]')?.getAttribute("aria-disabled")).toBe("true");
  });

  it("친구(main)·조약돌(mini) 손잡이는 장식 그림이고, 크기와 상관없이 같은 그림이다", () => {
    const main = make("main").control.node;
    const mini = make("mini").control.node;
    expect(main.querySelector(".sz-walker img.friend-img")?.getAttribute("alt")).toBe("");
    expect(mini.querySelector(".sz-walker img.pebble-img")?.getAttribute("alt")).toBe("");
    expect(main.querySelector(".sz-walker")?.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("글 쓰는 네 단계의 장면(D-069, J-4) — 장식은 읽히지 않고 글 칸은 그대로 안에 선다", () => {
  it("있었던 일: 종이 안에 글 칸, 설명 한 줄만 읽히고 길·돌은 장식", () => {
    const root = host();
    render(<EventScene day="그날"><textarea id="event" /></EventScene>, root);
    expect(root.querySelector(".nt-paper textarea#event")).not.toBeNull();
    expect(root.querySelector(".nt-story")?.textContent).toBe("그날 하루를 돌아보는 길이에요");
    expect(root.querySelector(".nt-road")?.getAttribute("aria-hidden")).toBe("true");
    expect(root.querySelector(".nt-stone img")?.getAttribute("alt")).toBe("");
    // 감정을 고르기 전이라 친구도 조약돌도 없다
    expect(root.querySelector(".friend-img, .nt-peb")).toBeNull();
  });

  it("이유: 고른 친구만 taxonomy 순서로, 모두 같은 크기 — 이름과 계열 글자가 붙는다", () => {
    const root = host();
    render(<ReasonScene categories={["fear", "joy", "sadness"]}><textarea id="reason" /></ReasonScene>, root);
    const order = CATEGORIES.map((c) => c.code).filter((code) => ["fear", "joy", "sadness"].includes(code));
    const names = [...root.querySelectorAll(".rs-fr .rs-nm b")].map((b) => b.textContent);
    expect(names).toEqual(order.map((code) => FRIENDS[code]?.name));
    expect(root.querySelector(".rs-friends")?.getAttribute("aria-label")).toBe("이번에 고른 마음");
    expect(root.querySelector(".rs-land")?.getAttribute("style")).toContain("--rs-nominal: 96px");
    expect([...root.querySelectorAll(".rs-fr img")].every((img) => img.getAttribute("alt") === "")).toBe(true);
    expect(root.querySelector(".rs-note textarea#reason")).not.toBeNull();
  });

  it("이유: 아무것도 안 골랐으면 언덕만, 친구·설명 줄 없음", () => {
    const root = host();
    render(<ReasonScene categories={[]}><textarea id="reason" /></ReasonScene>, root);
    expect(root.querySelector(".rs-land.empty")).not.toBeNull();
    expect(root.querySelector(".rs-friends, .rs-story")).toBeNull();
  });

  it("칭찬은 고른 계열의 조약돌(같은 크기·개수 글자 없음), 감사는 등불 — 땅은 장식", () => {
    const root = host();
    render(<NotesScene kind="praise" categories={["joy", "anger"]}><input id="praises-0" /></NotesScene>, root);
    expect(root.querySelectorAll(".nt-peb").length).toBe(2);
    expect(root.querySelector(".nt-land")?.getAttribute("aria-hidden")).toBe("true");
    expect(root.querySelector(".nt-land")?.textContent).toBe("");
    render(<NotesScene kind="thanks" categories={["joy"]}><input id="gratitudes-0" /></NotesScene>, root);
    expect(root.querySelector(".nt-lantern")).not.toBeNull();
    expect(root.querySelector(".nt-peb")).toBeNull();
    expect(root.querySelector(".nt-desk input#gratitudes-0")).not.toBeNull();
  });
});

describe("편지(D-063, J-5) — 카드·봉투·넘기기", () => {
  const codesOf = (category: string) => [...EMOTIONS].filter(([, info]) => info.category === category).map(([code]) => code);
  const diary = (over: Partial<WorkingDiary> = {}): WorkingDiary => ({
    ...emptyDiary(),
    eventText: "가짜 사건",
    reasonText: "가짜 이유",
    categories: [{ code: "sadness", intensity: 7 }, { code: "joy", intensity: null }],
    emotions: codesOf("sadness").slice(0, 2).map((code) => ({ code, category: "sadness", own: null })),
    ...over
  });

  it("쓰는 중에는 닫힌 봉투 — 카드는 문서 안에 있고(열지 않고도 남길 수 있다), 비운 칭찬·감사 장은 없다", async () => {
    const root = host();
    render(<Letter diary={diary()} date="2026-10-16" day="오늘" mode="write" />, root);
    await flush();
    expect(root.querySelector(".letter-stage")?.classList.contains("closed")).toBe(true);
    expect(root.querySelector('[aria-label="편지 봉투 열기"]')).not.toBeNull();
    const cards = [...root.querySelectorAll(".card")];
    expect(cards.map((card) => card.getAttribute("aria-label"))).toEqual(["1 / 3, 1번째 마음, 슬픔", "2 / 3, 2번째 마음, 기쁨", "3 / 3, 있었던 일과 이유"]);
    expect(root.textContent).toContain("가짜 사건");
    expect(root.textContent).not.toContain("칭찬");
    // 정하지 않은 크기는 숫자 대신 –, 열 점은 장식
    expect(cards[1]?.querySelector(".size b")?.textContent).toBe("–");
    expect(cards[0]?.querySelectorAll(".d10 i.f").length).toBe(7);
    expect(cards[0]?.querySelector(".d10")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("카드마다 '고치기'가 그 단계로, 끝 화살표는 aria-disabled", async () => {
    const root = host();
    const targets: string[] = [];
    render(<Letter diary={diary({ praises: ["가짜 칭찬", "", ""] })} date="2026-10-16" day="그날" mode="read" onEdit={(key) => targets.push(`${key.step}:${key.category ?? ""}`)} />, root);
    await flush();
    expect(root.querySelector(".letter-stage")?.classList.contains("opened")).toBe(true);
    for (const label of ["슬픔 고치기", "있었던 일 고치기", "이유 고치기", "칭찬 고치기"]) root.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)?.click();
    expect(targets).toEqual(["details:sadness", "event:", "reason:", "praise:"]);
    expect(root.querySelector('[aria-label="이전 장"]')?.getAttribute("aria-disabled")).toBe("true");
    expect(root.querySelector('[aria-label="다음 장"]')?.getAttribute("aria-disabled")).toBeNull();
    expect(root.textContent).toContain("— 그날의 나에게");
  });

  it("세부 감정이 9개 이상이면 이어지는 카드, 봉투 clipPath id는 편지마다 다르다", async () => {
    const root = host();
    const many = codesOf("sadness").slice(0, 9).map((code) => ({ code, category: "sadness", own: null }));
    render(
      <>
        <Letter diary={diary({ categories: [{ code: "sadness", intensity: 3 }], emotions: many })} date="2026-10-16" day="오늘" mode="write" />
        <Letter diary={diary()} date="2026-10-16" day="오늘" mode="write" />
      </>,
      root
    );
    await flush();
    expect(root.querySelector(".t1-more .lab")?.textContent).toBe("슬픔 · 이어서 2/2");
    const ids = [...root.querySelectorAll("clipPath")].map((node) => node.id);
    expect(new Set(ids).size).toBe(2);
  });
});

describe("완료 화면 언덕(D-061, J-5)", () => {
  it("그날 고른 친구만 taxonomy 순서로, 친구 이름을 읽고 조약돌은 장식", () => {
    const root = host();
    render(<DoneLand categories={["fear", "sadness"]} />, root);
    expect(doneOrder(["fear", "sadness"])).toEqual(CATEGORIES.map((c) => c.code).filter((code) => code === "fear" || code === "sadness"));
    const friends = [...root.querySelectorAll(".land-friend")].map((img) => img.getAttribute("alt"));
    expect(friends).toEqual(doneOrder(["fear", "sadness"]).map((code) => `${FRIENDS[code]?.name}, ${CATEGORIES.find((c) => c.code === code)?.label}`));
    expect([...root.querySelectorAll(".land-pebble")].every((img) => img.getAttribute("alt") === "")).toBe(true);
    expect(root.querySelector(".land-svg")?.getAttribute("aria-hidden")).toBe("true");
  });
});
