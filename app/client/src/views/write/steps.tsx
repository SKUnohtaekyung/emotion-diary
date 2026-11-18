// 작성 흐름의 단계 내용(UX_SPEC §4 1~8). 2026-11-11 `views/write.ts`의 평면판을 Preact로 옮기고(TASK-JOURNAL-01 A-1)
// 단계마다 시안 장면을 입혔다(J-2 마음·세부 감정, J-3 크기, J-4 글 쓰는 네 단계 — PaperScenes.tsx). 편지는 J-5.
// 글의 정본은 saver.diary(Preact 밖)다. 단계는 change()로만 글을 바꾸고, 틀(WriteStep)이 다시 그린다(A-2).

import { useLayoutEffect, useRef, useState } from "preact/hooks";
import { EVENT_MAX_CHARS, REASON_MAX_CHARS, REFLECTION_MAX_CHARS } from "../../../../shared/diary";
import { announce, focusElement, h } from "../../lib/dom";
import { navigate } from "../../router";
import { openSheet } from "../../ui/sheet";
import { intensityControl } from "../../ui/intensity";
import {
  CATEGORY_BY_CODE,
  categoryLabel,
  effectiveIntensity,
  emotionLabel,
  removeCategory,
  setCategoryIntensity,
  setEmotionIntensity,
  type Step,
  type StepKey,
  toggleCategory,
  toggleEmotion,
  unsetCategories,
  withReflection,
  withText,
  type WorkingDiary
} from "../../write/flow";
import type { FlowSession } from "../../write/session";
import { writeHash } from "./actions";
import type { BasketHandle } from "./Basket";
import { hop, Meadow } from "./Meadow";
import { Letter, type LetterHandle } from "./Letter";
import { EventScene, NotesScene, ReasonScene } from "./PaperScenes";
import { FRIENDS } from "../../lib/art";

/** 단계가 틀에 맡기는 것 — '다음'이 막혔을 때 초점을 줄 곳, 크기 미정 시트. 그리는 동안 채운다. */
export interface StepControl {
  focusFirst: () => void;
  showIntensitySheet: () => void;
  /** 세부 감정 화면의 바구니(틀이 단계 위 장면으로 그린다) */
  basket: { current: BasketHandle | null };
  /** 편지 무대 — 남길 때 봉인 연출(seal.ts)이 만진다 */
  letter: LetterHandle;
}

export interface StepProps {
  session: FlowSession;
  diary: WorkingDiary;
  step: Step;
  stepKey: StepKey;
  day: "오늘" | "그날";
  change: (next: WorkingDiary, options?: { immediate?: boolean }) => void;
  ctl: StepControl;
  onEdit: (target: StepKey) => void;
}

// 있었던 일 안내는 쓴 기간에 따라 네 단계로 바뀐다(2026-10-13 QA R10, PLAN A-7) — 처음에는 문턱을 낮추고, 익숙해질수록 도움을 덜어 낸다.
// 첫 기록일(처음 완료한 날)부터 지난 날로 정한다: 0~29일 ① · 30~59일 ② · 60~89일 ③ · 90일~ ④. 첫 기록이 없거나 모르면 ①.
const EVENT_GUIDES = [
  () => "잘 쓰지 않아도 괜찮아요. 기억나는 장면 하나부터 적어 보세요.",
  () => "누구와 어디서 있었던 일인지 함께 적어 보세요.",
  () => "있었던 일과 그때 든 생각을 나눠서 적어 보세요.",
  (day: string) => `${day} 남은 장면을 적어 보세요.`
] as const;

/** 첫 기록일에서 오늘까지 지난 날로 정한 안내 단계(0~3). 날짜는 둘 다 서버가 센 YYYY-MM-DD. */
export function guideStage(firstRecordDate: string | null, today: string): number {
  if (!firstRecordDate) return 0;
  const days = Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${firstRecordDate}T00:00:00Z`)) / 86_400_000);
  if (!Number.isFinite(days) || days < 30) return 0;
  return days < 60 ? 1 : days < 90 ? 2 : 3;
}

/** 단계의 제목과 안내 한 줄. stage는 있었던 일 안내 단계(guideStage). */
export function stepCopy(key: StepKey, day: "오늘" | "그날", stage = 0): { title: string; guide: string } {
  switch (key.step) {
    case "event":
      return { title: `${day} 있었던 일`, guide: (EVENT_GUIDES[stage] ?? EVENT_GUIDES[0])(day) };
    case "feelings":
      return { title: `${day}은 어떤 마음이 머물렀나요?`, guide: "여러 개여도 괜찮아요." };
    case "details":
      return { title: `${categoryLabel(key.category ?? "")} 중에서 어떤 마음이었나요?`, guide: "가까운 말을 여러 개 골라도 돼요. 정답은 없어요." };
    case "intensity":
      return {
        title: "얼마나 컸나요?",
        guide: "1은 스쳐 지나간 정도, 10은 일상에 큰 영향을 준 정도예요. 색은 마음을 알려 줄 뿐 좋고 나쁨이 아니에요."
      };
    case "reason":
      return { title: "이유", guide: "" };
    case "praise":
      return { title: "칭찬", guide: `${day === "오늘" ? "오늘" : "그날의"} 나에게 해 주고 싶은 칭찬을 적어요.` };
    case "gratitude":
      return { title: "감사", guide: `${day} 고마웠던 일을 적어요.` };
    default:
      // 안내 줄은 편지 단계가 직접 둔다 — 봉투를 열면 바뀐다
      return { title: "이대로 남길까요?", guide: "" };
  }
}

function TextField(props: {
  id: string;
  label: string;
  help: string;
  value: string;
  max: number;
  ctl: StepControl;
  onInput: (text: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const grow = (): void => {
    const area = ref.current;
    if (!area) return;
    area.style.setProperty("height", "auto");
    area.style.setProperty("height", `${area.scrollHeight + 2}px`);
  };
  props.ctl.focusFirst = () => ref.current?.focus();
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(grow);
    return () => cancelAnimationFrame(frame);
  }, []);
  // 줄 종이 위의 글 칸(시안 write.js ruled): 라벨·글이 같은 2rem 줄에 앉는다. 안내는 자리표시자로 보이고, 값이 생겨 자리표시자가
  // 사라져도 다시 들을 수 있게 숨은 글로도 둔다(D-099 text-input K1)
  return (
    <div class="field">
      <label class="field-label" for={props.id}>
        {props.label}
      </label>
      <p class="sr-only" id={`${props.id}-help`}>
        {props.help}
      </p>
      <textarea
        ref={ref}
        id={props.id}
        class="ruled"
        rows={5}
        maxLength={props.max}
        placeholder={props.help}
        aria-describedby={`${props.id}-help write-hint`}
        value={props.value}
        onInput={(event) => {
          props.onInput(event.currentTarget.value.replace(/\r\n?/g, "\n"));
          grow();
        }}
      />
    </div>
  );
}

function EventStep({ session, diary, day, change, ctl }: StepProps) {
  return (
    <EventScene day={day}>
      <TextField
        id="event"
        label="무슨 일이 있었나요?"
        help="있었던 일을 떠오르는 대로 적어요."
        value={diary.eventText}
        max={EVENT_MAX_CHARS}
        ctl={ctl}
        onInput={(text) => change(withText(session.saver.diary, "eventText", text))}
      />
    </EventScene>
  );
}

function FeelingsStep({ session, day, change, ctl }: StepProps) {
  const diary = session.saver.diary;
  const picked = new Set(diary.categories.map((item) => item.code));
  ctl.focusFirst = () => focusElement(document.querySelector<HTMLElement>(".meadow .ff"));
  return (
    <Meadow
      day={day}
      picked={picked}
      onToggle={(code, pic) => {
        change(toggleCategory(session.saver.diary, code));
        const now = session.saver.diary;
        const on = now.categories.some((item) => item.code === code);
        if (on) hop(pic);
        announce(`${FRIENDS[code]?.name ?? ""}, ${categoryLabel(code)} ${on ? "선택됨" : "선택 해제됨"}, 지금 ${now.categories.length}개 선택`);
      }}
    />
  );
}

function DetailsStep({ session, stepKey, change, ctl }: StepProps) {
  const code = stepKey.category ?? "";
  const label = categoryLabel(code);
  const cloud = useRef<HTMLDivElement>(null);
  ctl.focusFirst = () => focusElement(cloud.current?.querySelector<HTMLElement>("button"));
  const diary = session.saver.diary;
  const drop = (): void => {
    const current = session.saver.diary;
    const position = current.categories.findIndex((item) => item.code === code);
    const next = removeCategory(current, code);
    const rest = next.categories;
    const target: StepKey = !rest.length
      ? { step: "feelings", category: null }
      : position < rest.length
        ? { step: "details", category: rest[position]?.code ?? null }
        : { step: "intensity", category: null };
    session.saver.update(next, target, { immediate: true });
    if (session.mode === "edit") session.touched = true;
    announce(`${label}을 뺐어요`);
    navigate(writeHash(session.date, target), { replace: true });
  };
  return (
    <>
      <button type="button" class="link detail-skip" onClick={drop}>
        이 마음은 빼기
      </button>
      {/* biome-ignore lint/a11y/useSemanticElements: 시안과 같은 토글 알약 묶음 — fieldset의 기본 테두리·여백 없이 */}
      <div ref={cloud} class="choice-cloud" role="group" aria-label={`${label}의 세부 감정, 여러 개 선택`}>
        {(CATEGORY_BY_CODE.get(code)?.emotions ?? []).map((emotion) => (
          <button
            key={emotion.code}
            type="button"
            class="choice choice-pill"
            data-code={emotion.code}
            aria-pressed={diary.emotions.some((item) => item.code === emotion.code)}
            onClick={(event) => {
              change(toggleEmotion(session.saver.diary, emotion.code));
              const now = session.saver.diary;
              const on = now.emotions.some((item) => item.code === emotion.code);
              // 켜면 조약돌이 체크 자리에서 바구니로 미끄러져 담기고, 끄면 바구니에서 사라진다(D-068)
              if (on) ctl.basket.current?.add(emotion.code, event.currentTarget.querySelector(".ck"));
              else ctl.basket.current?.remove(emotion.code);
              const count = now.emotions.filter((item) => item.category === code).length;
              announce(`${emotion.label} ${on ? "선택됨" : "선택 해제됨"}, ${label}에서 ${count}개 선택`);
            }}
          >
            <span class="ck" aria-hidden="true">
              ✓
            </span>
            <span>{emotion.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

/**
 * 크기 — 평면판의 패널을 그대로 쓴다(`ui/intensity.ts`의 진짜 컨트롤과 끌기 층은 바꾸지 않는다, MAP §4.2 4).
 * 패널은 처음 한 번 만들고 값은 컨트롤이 스스로 칠한다. 길 위의 친구 모양은 J-3에서 입힌다.
 */
function IntensityStep({ session, change, ctl }: StepProps) {
  const box = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = box.current;
    if (!root) return;
    const diary = () => session.saver.diary;
    const panels: { code: string; focus: () => void; error: HTMLElement }[] = [];
    for (const category of diary().categories) {
      const code = category.code;
      const label = categoryLabel(code);
      const error = h("p", { class: "field-error", id: `intensity-error-${code}` });
      const ownRows: { refresh: () => void }[] = [];
      const control = intensityControl({
        id: `intensity-${code}`,
        label: `${label} 크기`,
        value: category.intensity,
        describedBy: error.id,
        category: code,
        kind: "main",
        heading: h(
          "div",
          { class: "sz-who" },
          h("strong", { text: FRIENDS[code]?.name ?? label }),
          h("h2", { class: "intensity-name", id: `intensity-name-${code}`, text: `${label}의 크기` })
        ),
        onChange: (value) => {
          change(setCategoryIntensity(diary(), code, value));
          error.textContent = "";
          for (const row of ownRows) row.refresh();
        }
      });
      const detailsId = `own-${code}`;
      const details = h("div", { class: "own-list", id: detailsId });
      for (const emotion of diary().emotions.filter((item) => item.category === code)) {
        const tag = h("span", { class: "own-tag", text: "따로 정함" });
        const reset = h("button", {
          type: "button",
          class: "link own-reset",
          text: "대표 크기와 같게",
          "aria-label": `${emotionLabel(emotion.code)} 크기를 대표 크기와 같게`
        });
        const own = intensityControl({
          id: `own-${emotion.code}`,
          label: `${emotionLabel(emotion.code)} 크기`,
          value: effectiveIntensity(diary(), emotion.code),
          category: code,
          kind: "mini",
          heading: h("p", { class: "own-name" }, emotionLabel(emotion.code), " ", tag),
          onChange: (value) => {
            change(setEmotionIntensity(diary(), emotion.code, value));
            refresh();
          }
        });
        const refresh = (): void => {
          const item = diary().emotions.find((entry) => entry.code === emotion.code);
          tag.hidden = !item || item.own === null;
          reset.hidden = tag.hidden;
          own.set(effectiveIntensity(diary(), emotion.code), "spring");
        };
        reset.addEventListener("click", () => {
          change(setEmotionIntensity(diary(), emotion.code, null));
          refresh();
          announce(`${emotionLabel(emotion.code)} 크기를 대표 크기와 같게 했어요`);
        });
        refresh();
        ownRows.push({ refresh });
        details.append(h("div", { class: "own-row" }, own.node, reset));
      }
      const opened = diary().emotions.some((item) => item.category === code && item.own !== null);
      details.hidden = !opened;
      const toggle = h("button", {
        type: "button",
        class: "link int-more",
        "aria-expanded": String(opened),
        "aria-controls": detailsId,
        text: "세부 감정도 크기를 정하고 싶어요"
      });
      toggle.addEventListener("click", () => {
        const next = toggle.getAttribute("aria-expanded") !== "true";
        toggle.setAttribute("aria-expanded", String(next));
        details.hidden = !next;
      });
      panels.push({ code, focus: control.focus, error });
      const panel = h(
        "section",
        { class: "intensity-panel sz-block", "data-category": code, "aria-labelledby": `intensity-name-${code}` },
        control.node,
        error,
        toggle,
        details
      );
      panel.style.setProperty("--i", String(panels.length - 1));
      root.append(panel);
    }
    ctl.focusFirst = () => panels[0]?.focus();
    // 크기를 정하지 않은 마음 시트(D-079 ①)
    ctl.showIntensitySheet = () => {
      const unset = unsetCategories(diary());
      for (const panel of panels) panel.error.textContent = unset.includes(panel.code) ? "이 마음의 크기를 정해 주세요." : "";
      openSheet({
        id: "intensity-unset",
        title: "크기를 정하지 않은 마음이 있어요",
        body: unset.map((code) => `· ${categoryLabel(code)}`),
        actions: [
          {
            label: "정하러 가기",
            kind: "primary",
            onClick: () => panels.find((panel) => panel.code === unset[0])?.focus()
          }
        ]
      });
    };
    return () => root.replaceChildren();
  }, []);
  return <div ref={box} class="intensity-panels" />;
}

// 고른 마음은 글자 줄 대신 언덕 위 친구들(이름·계열 글자)이 보여 준다(시안 reason.js)
function ReasonStep({ session, diary, change, ctl }: StepProps) {
  return (
    <ReasonScene categories={diary.categories.map((item) => item.code)}>
      <TextField
        id="reason"
        label="왜 이런 마음이 들었다고 느끼나요?"
        help="정답은 없어요. 느낀 대로 적어요."
        value={diary.reasonText}
        max={REASON_MAX_CHARS}
        ctl={ctl}
        onInput={(text) => change(withText(session.saver.diary, "reasonText", text))}
      />
    </ReasonScene>
  );
}

function ReflectionStep({ session, stepKey, change, ctl }: StepProps) {
  const praise = stepKey.step === "praise";
  const kind = praise ? "praises" : "gratitudes";
  const name = praise ? "칭찬" : "감사";
  ctl.focusFirst = () => focusElement(document.getElementById(`${kind}-0`));
  const values = session.saver.diary[kind];
  // 칭찬은 쪽지(.nt-slip), 감사는 끈에 꿴 카드(.nt-tag) — 입력이 그 바탕 위에 앉는다(시안 notes.js wrapSlots)
  const wrap = praise ? "nt-slip" : "nt-tag";
  return (
    <NotesScene kind={praise ? "praise" : "thanks"} categories={session.saver.diary.categories.map((item) => item.code)}>
      <fieldset class="slots-field">
        <legend class="field-label">{`${name}할 점, 세 가지까지`}</legend>
        <p class="caption">선택이에요. 비워 두어도 괜찮아요.</p>
        <div class={praise ? "nt-slips" : "nt-tags"}>
          {values.map((value, slot) => (
            <div class={wrap} key={slot} style={{ "--i": String(slot) }}>
              <label class="sr-only" for={`${kind}-${slot}`}>{`${name} ${slot + 1}`}</label>
              <input
                type="text"
                id={`${kind}-${slot}`}
                class="slot-input"
                placeholder={`${name} ${slot + 1}`}
                maxLength={REFLECTION_MAX_CHARS}
                autocomplete="off"
                value={value}
                onInput={(event) => change(withReflection(session.saver.diary, kind, slot, event.currentTarget.value))}
              />
            </div>
          ))}
        </div>
      </fieldset>
    </NotesScene>
  );
}

/** 편지(D-063) — 닫힌 봉투, 열면 카드를 옆으로 넘긴다. 열지 않고도 남길 수 있다(Letter.tsx) */
function LetterStep({ session, day, ctl, onEdit }: StepProps) {
  // 카드의 '고치기'로 떠났다 돌아오면 열린 편지의 그 카드로 연다(session.letterAt)
  const [openAt] = useState(() => session.letterAt);
  const [opened, setOpened] = useState(openAt !== null);
  const edit = (target: StepKey, at: number): void => {
    session.letterAt = at;
    onEdit(target);
  };
  return (
    <>
      <p class="letter-sub">{opened ? "옆으로 넘겨서 확인해요." : `${day}의 마음을 나에게 쓴 편지로 담았어요. 봉투를 열어 마지막으로 읽어 봐요.`}</p>
      <Letter diary={session.saver.diary} date={session.date} day={day} mode="write" onEdit={edit} onOpened={() => setOpened(true)} handle={ctl.letter} openAt={openAt} />
    </>
  );
}

export function StepBody(props: StepProps) {
  switch (props.stepKey.step) {
    case "event":
      return <EventStep {...props} />;
    case "feelings":
      return <FeelingsStep {...props} />;
    case "details":
      return props.stepKey.category ? <DetailsStep {...props} /> : null;
    case "intensity":
      return <IntensityStep {...props} />;
    case "reason":
      return <ReasonStep {...props} />;
    case "praise":
    case "gratitude":
      return <ReflectionStep {...props} />;
    default:
      return <LetterStep {...props} />;
  }
}
