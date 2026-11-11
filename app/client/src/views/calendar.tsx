// 달력 `#/calendar[?d=YYYY-MM-DD]`(UX_SPEC §7, DESIGN_SYSTEM §6.7, D-054·D-070·D-080·D-090·D-100 — 시안 web/js/views/tabs.js renderCalendar를
// Preact로 옮김, TASK-REFLECT-01 R-3). 밝은 바탕에 하단 탐색. 작은 '2026년 달력' 위에 큰 '10월', ‹ ›는 늘 달을 옮긴다(미래 달은 막힘).
// 칸은 서비스 색과 조약돌 모양으로만 — 완료 = ink 조약돌, 쓰던 글 = 점선 + 연필, 오늘 = 민트 + ink 테두리, 미래 = 막힘. 감정 색·친구·빛은 쓰지 않는다
// ("달력은 기록의 지도이지 좋은 날의 지도가 아니다" — §6.7). 날짜를 골라도 한 달은 그대로이고 달 아래에 작은 편지 또는 쪽지가 온다.
// 처음 고를 때만 기록 한 칸을 쌓고(?d=, 뒤로 가기 = 닫기 — ×도 같은 칸을 되감는다), 다른 날로 바꿀 때는 바꿔친다(UX_SPEC §7·§17).
// 보이는 달은 주소의 ?m=에 둔다 — 뒤로 가서 새로 그려져도 같은 달이다.
// 기록 메뉴(⋯ — 고치기·완료 취소·지우기)는 3단계(direct-journal 조각 6)에서 단다. 작은 편지의 '고치기' 태그와 '편지 열기'는 지금 있다.

import type { ComponentChild, ComponentChildren } from "preact";
import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import { addMonths, isIsoDate, isIsoMonth, type CalendarDay, type CalendarMonth, type DiaryEntryView, type DiaryStatus } from "../../../shared/diary";
import type { ApiResult } from "../lib/api";
import { announce } from "../lib/dom";
import { monthDay } from "../lib/format";
import { mountPreact } from "../lib/mount";
import { navigate, pushFlowStep, type ViewContext } from "../router";
import { ChevronLeft, ChevronRight, CloseIcon, HomeGlyph, PencilGlyph } from "../ui/icons";
import { type EditTarget, MiniLetter } from "../ui/MiniLetter";
import { openSheet } from "../ui/sheet";
import { StatusBlock } from "../ui/StatusBlock";
import { showToast } from "../ui/toast";
import { deleteDiaryRequest, fetchDiary, newRequestKey } from "../write/api";
import { stepQuery } from "../write/flow";
import { fetchCalendarMonth } from "../write/reflectionApi";
import { dropSession } from "../write/session";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const STATUS_WORD: Record<DayState, string> = { completed: "완료", draft: "임시저장", none: "기록 없음", future: "아직 오지 않은 날" };
type DayState = DiaryStatus | "none" | "future";

const ML_NAV = 34;
const ML_MIN = 132;
const ML_MAX = 220;

/** 이 기기의 지금 달력 날짜(서버 응답 전 첫 달을 고르는 데만 쓴다 — '오늘'은 서버가 센다). */
function localMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function daysIn(month: string): { first: number; count: number } {
  const [year = 1970, mon = 1] = month.split("-").map(Number);
  return { first: new Date(Date.UTC(year, mon - 1, 1)).getUTCDay(), count: new Date(Date.UTC(year, mon, 0)).getUTCDate() };
}

const weekdayOf = (iso: string) => {
  const [year = 1970, month = 1, day = 1] = iso.split("-").map(Number);
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()] ?? "";
};

type Load<T> = { kind: "loading" } | { kind: "ok"; data: T } | { kind: "error" | "offline" } | { kind: "missing" };

function loadOf<T>(result: ApiResult<T>): Load<T> {
  if (result.ok) return { kind: "ok", data: result.data };
  if (result.status === 404) return { kind: "missing" };
  return { kind: result.offline ? "offline" : "error" };
}

function DayCell({ day, status, today, selected, wiggle, delay, onPick }: { day: string; status: DayState; today: boolean; selected: boolean; wiggle: boolean; delay: number; onPick: () => void }) {
  const number = Number(day.slice(8));
  return (
    <button
      type="button"
      class={`day ${status}${today ? " today" : ""}${wiggle ? " cal-wiggle" : ""}`}
      data-iso={day}
      disabled={status === "future"}
      // 이름 안에 보이는 숫자가 낱말로 들어 있어야 한다 — 음성으로 누르는 사람이 보이는 대로 말한다(WCAG 2.5.3, axe label-content-name-mismatch).
      // "11월 1 일"은 "11월 1일"과 같게 읽힌다
      aria-label={`${Number(day.slice(5, 7))}월 ${number} 일${today ? ", 오늘" : ""}, ${STATUS_WORD[status]}`}
      aria-current={today ? "date" : undefined}
      aria-pressed={selected ? "true" : "false"}
      style={{ "--tb-d": `${delay}ms` }}
      onClick={onPick}
    >
      <span class="day-num">{String(number)}</span>
      {status === "draft" ? (
        <svg viewBox="0 0 24 24" class="pencil" aria-hidden="true">
          <path d="M4 20l1-4.2L16.3 4.6a1.6 1.6 0 0 1 2.3 0l.8.8a1.6 1.6 0 0 1 0 2.3L8.2 19zM14.2 6.8l3 3" />
        </svg>
      ) : null}
    </button>
  );
}

function Legend() {
  const item = (cls: string, text: string, draft = false) => (
    <li>
      <span class={`day mini ${cls}`} aria-hidden="true">
        {draft ? (
          <svg viewBox="0 0 24 24" class="pencil" aria-hidden="true">
            <path d="M4 20l1-4.2L16.3 4.6a1.6 1.6 0 0 1 2.3 0l.8.8a1.6 1.6 0 0 1 0 2.3L8.2 19zM14.2 6.8l3 3" />
          </svg>
        ) : null}
      </span>{" "}
      {text}
    </li>
  );
  return (
    <ul class="legend">
      {item("completed", "완료")}
      {item("draft", "임시저장", true)}
      {item("none today", "오늘")}
      {item("none", "기록 없음")}
    </ul>
  );
}

function editFrom(date: string, target: EditTarget): void {
  pushFlowStep(`#/write/${date}?${stepQuery(target)}`, `c${Date.now().toString(36)}`);
}

function Calendar({ initialDate, initialMonth }: { initialDate: string | null; initialMonth: string | null }) {
  const [month, setMonth] = useState(initialDate ? initialDate.slice(0, 7) : (initialMonth ?? localMonth()));
  const [selected, setSelected] = useState<string | null>(initialDate);
  const [months, setMonths] = useState<Map<string, Load<CalendarMonth>>>(new Map());
  const [entries, setEntries] = useState<Map<string, Load<DiaryEntryView>>>(new Map());
  const [today, setToday] = useState<string | null>(null);
  const [settled, setSettled] = useState(false);
  const [height, setHeight] = useState(ML_MAX);
  const panel = useRef<HTMLElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const wiggle = useRef<string | null>(null);
  const alive = useRef(true);

  useEffect(
    () => () => {
      alive.current = false;
    },
    []
  );

  // 첫 달이 이 기기의 짐작이었는지(주소에 ?m=·?d=가 없었음) — 서버가 센 오늘의 달이 다르면 한 번만 그 달로 옮긴다(자정·하루 기준 시각 경계).
  // 사용자가 그 사이 달을 넘겼으면 옮기지 않는다(마감 검토 6).
  const guessed = useRef(!initialDate && !initialMonth);
  const shownMonth = useRef(month);
  shownMonth.current = month;

  // 보이는 달을 주소에 둔다(?m=) — 날짜를 골랐다가 뒤로 가면(새로 그려진다) 같은 달로 돌아오고, 새로 고쳐도 그 달이다(마감 검토 2b)
  useEffect(() => {
    const url = selected ? `#/calendar?m=${month}&d=${selected}` : `#/calendar?m=${month}`;
    if (location.hash !== url) history.replaceState(history.state, "", url);
  }, [month, selected]);

  const loadMonth = async (target: string, force = false): Promise<void> => {
    if (!force && months.get(target)?.kind === "ok") return;
    setMonths((previous) => new Map(previous).set(target, { kind: "loading" }));
    const result = await fetchCalendarMonth(target);
    if (!alive.current) return;
    if (result.status === 401 || result.status === 423) return; // 전역 처리기가 화면을 넘겨받았다
    setMonths((previous) => new Map(previous).set(target, loadOf(result)));
    if (result.ok) {
      setToday(result.data.today);
      const serverMonth = result.data.today.slice(0, 7);
      if (guessed.current && shownMonth.current === target && serverMonth !== target) setMonth(serverMonth);
      guessed.current = false;
    }
  };

  const loadEntry = async (date: string, force = false): Promise<void> => {
    if (!force && entries.get(date)?.kind === "ok") return;
    setEntries((previous) => new Map(previous).set(date, { kind: "loading" }));
    const result = await fetchDiary(date);
    if (!alive.current || result.status === 401 || result.status === 423) return;
    setEntries((previous) => new Map(previous).set(date, loadOf(result)));
  };

  useEffect(() => {
    void loadMonth(month);
  }, [month]);

  const monthLoad = months.get(month) ?? { kind: "loading" as const };
  const statusMap = new Map<string, DiaryStatus>(monthLoad.kind === "ok" ? monthLoad.data.days.map((day: CalendarDay) => [day.date, day.status]) : []);
  const stateOf = (date: string): DayState => (today && date > today ? "future" : (statusMap.get(date) ?? "none"));
  const selectedState = selected ? stateOf(selected) : null;

  useEffect(() => {
    if (selected && selectedState === "completed") void loadEntry(selected);
  }, [selected, selectedState]);

  // 작은 편지 높이 = 하단 탐색 흐림 띠 위까지 남는 높이 − 넘김 줄(132~220px) — 시안 miniRoom과 같다
  useLayoutEffect(() => {
    const measure = () => {
      const rail = document.querySelector(".bottom-nav-rail");
      const nav = rail?.parentElement;
      const fade = nav ? Number.parseFloat(getComputedStyle(nav).getPropertyValue("--nav-fade")) || 0 : 0;
      const bottom = rail ? rail.getBoundingClientRect().top - 8 - fade : window.innerHeight;
      const top = panel.current?.getBoundingClientRect().top ?? 0;
      setHeight(Math.max(ML_MIN, Math.min(ML_MAX, Math.floor(bottom - top - ML_NAV))));
    };
    measure();
    let timer = 0;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(measure, 120);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [selected, month, monthLoad.kind]);

  /** 지금 기록 칸이 이 화면에서 날짜를 처음 고를 때 쌓은 칸인가 */
  const onPickedEntry = () => (history.state as { calPick?: boolean } | null)?.calPick === true;

  const pick = (date: string): void => {
    const first = selected === null;
    const url = `#/calendar?m=${month}&d=${date}`;
    // 처음 고를 때만 한 칸 쌓는다(뒤로 가기 = 닫기). 그 칸에 표시를 둬 ×가 같은 칸을 되감게 한다(마감 검토 2a)
    if (first) history.pushState({ pushed: true, calPick: true }, "", url);
    else history.replaceState(history.state, "", url);
    wiggle.current = date;
    setSettled(true);
    setSelected(date);
    const state = stateOf(date);
    announce(`${monthDay(date)}, ${STATUS_WORD[state]}`);
    requestAnimationFrame(() => {
      if (first) panel.current?.focus({ preventScroll: true });
      else grid.current?.querySelector<HTMLElement>(`[data-iso="${date}"]`)?.focus({ preventScroll: true });
    });
  };

  const close = (): void => {
    const previous = selected;
    // ×는 밀어서 뒤로 가는 것과 같다 — 고를 때 쌓은 칸이면 되감는다(새로 그려지며 같은 달, 고른 날 없음). 아니면(주소로 바로 들어옴) 이 자리에서 닫는다
    if (onPickedEntry()) {
      history.back();
      return;
    }
    setSelected(null);
    setSettled(true);
    requestAnimationFrame(() => grid.current?.querySelector<HTMLElement>(`[data-iso="${previous}"]`)?.focus({ preventScroll: true }));
  };

  const goMonth = (delta: number): void => {
    const target = addMonths(month, delta);
    if (delta > 0 && (!today || target > today.slice(0, 7))) return;
    guessed.current = false;
    // 고른 날이 있던 칸이면 그 칸을 새 달로 바꿔친다(표시는 지운다 — 이제 '날짜를 고른 칸'이 아니다)
    if (selected && onPickedEntry()) history.replaceState({ pushed: true }, "", `#/calendar?m=${target}`);
    setSelected(null);
    setSettled(true);
    setMonth(target);
    requestAnimationFrame(() => title.current?.focus({ preventScroll: true }));
  };

  // 서버가 오늘을 세기 전에는 다음 달로 가지 않는다(미래 달이 '기록 없음' 칸으로 보이지 않게 — 마감 검토 6)
  const nextOff = !today || addMonths(month, 1) > today.slice(0, 7);

  const discard = (date: string): void => {
    const second = (): void =>
      openSheet({
        id: "calendar-discard-2",
        title: "정말 지울까요?",
        body: [`${monthDay(date)}에 쓰던 글이 사라져요.`],
        actions: [{ label: "지우기", kind: "danger", onClick: () => void doDiscard(date) }, { label: "그만두기", kind: "quiet" }]
      });
    openSheet({
      id: "calendar-discard-1",
      title: "이 글을 지울까요?",
      body: ["쓰던 글을 지우면 되돌릴 수 없어요."],
      actions: [{ label: "지우기", kind: "danger", onClick: second }, { label: "그만두기", kind: "quiet" }]
    });
  };

  const doDiscard = async (date: string): Promise<void> => {
    const reload = () => void loadMonth(shownMonth.current, true); // 지금 보이는 달을 다시(마감 검토 7)
    const current = await fetchDiary(date);
    if (!current.ok) {
      if (current.status === 404) {
        reload();
        return;
      }
      if (current.status !== 401 && current.status !== 423) showToast(current.offline ? "인터넷에 연결되면 지울 수 있어요." : "지금은 지우지 못했어요. 잠시 뒤 다시 해 주세요.");
      return;
    }
    // 그 사이 다른 곳에서 완료했으면 지우지 않는다 — 시트는 '쓰던 글'을 지운다고 했다(마감 검토 1, AGENTS §3)
    if (current.data.status !== "draft") {
      showToast("다른 곳에서 완료한 기록이라 지우지 않았어요.");
      setEntries((previous) => new Map(previous).set(date, { kind: "ok", data: current.data }));
      reload();
      return;
    }
    const result = await deleteDiaryRequest(date, current.data.revision, newRequestKey());
    if (!result.ok && result.status !== 404) {
      if (result.status === 409) showToast("다른 곳에서 고친 내용이 있어 지우지 않았어요.");
      else if (result.status !== 401 && result.status !== 423) showToast(result.offline ? "인터넷에 연결되면 지울 수 있어요." : "지금은 지우지 못했어요. 잠시 뒤 다시 해 주세요.");
      return;
    }
    dropSession(date);
    showToast("쓰던 글을 지웠어요");
    reload();
  };

  const [year, mon] = month.split("-");
  const { first, count } = daysIn(month);
  const cells = [];
  for (let blank = 0; blank < first; blank += 1) cells.push(<span key={`b${blank}`} class="day blank" aria-hidden="true" />);
  for (let day = 1; day <= count; day += 1) {
    const iso = `${month}-${String(day).padStart(2, "0")}`;
    const slot = first + day - 1;
    cells.push(
      <DayCell
        key={iso}
        day={iso}
        status={stateOf(iso)}
        today={iso === today}
        selected={iso === selected}
        wiggle={settled && iso === wiggle.current && iso === selected}
        delay={Math.floor(slot / 7) * 50 + (slot % 7) * 12}
        onPick={() => pick(iso)}
      />
    );
  }

  let panelBody: ComponentChild = null;
  if (!selected) {
    panelBody = (
      <div class="cal-pv-empty">
        <p class="cal-pv-hint">날짜를 누르면 그날의 편지를 볼 수 있어요</p>
      </div>
    );
  } else if (selectedState === "completed") {
    const load = entries.get(selected) ?? { kind: "loading" as const };
    if (load.kind === "ok")
      panelBody = (
        <MiniLetter
          entry={load.data}
          height={height}
          onOpen={() => navigate(`#/record/${selected}?from=calendar`)}
          onEdit={(target) => editFrom(selected, target)}
        />
      );
    else if (load.kind === "missing") panelBody = <Note line="이 날은 남긴 기록이 없어요." />;
    else panelBody = <StatusBlock kind={load.kind} onRetry={load.kind === "loading" ? undefined : () => void loadEntry(selected, true)} />;
  } else if (selectedState === "draft") {
    panelBody = (
      <Note line="쓰던 글이 있어요. 이어서 쓸 수 있어요.">
        <button type="button" class="cal-pv-quiet" onClick={() => discard(selected)}>
          이 글 지우기
        </button>
        <button type="button" class="cal-pv-pill" onClick={() => navigate(`#/write/${selected}`)}>
          <PencilGlyph />
          이어서 쓰기
        </button>
      </Note>
    );
  } else if (selected === today) {
    panelBody = (
      <Note line="오늘의 마음은 오늘 화면에서 남겨요.">
        <button type="button" class="cal-pv-pill" onClick={() => navigate("#/today")}>
          <HomeGlyph />
          오늘 화면으로
        </button>
      </Note>
    );
  } else {
    // 쓰기 버튼 없음(D-082) — 못 썼다는 말도 쓰지 않는다(SERVICE_WHY 원칙 4)
    panelBody = <Note line="이 날은 남긴 기록이 없어요." />;
  }

  const ready = monthLoad.kind === "ok";
  return (
    <section class={`screen calendar${selected ? " folded" : ""}`}>
      <div class="tb-body tb-rise">
        <h1 class="cal-title" ref={title} tabIndex={-1}>
          <button type="button" class="cal-arrow" aria-label="이전 달" onClick={() => goMonth(-1)}>
            <ChevronLeft />
          </button>
          <span class="cal-title-text">
            <span class="tb-kicker">{`${year}년 달력`}</span> <span class="cal-big">{`${Number(mon)}월`}</span>
          </span>
          <button type="button" class="cal-arrow" aria-label="다음 달" aria-disabled={nextOff ? "true" : undefined} onClick={() => goMonth(1)}>
            <ChevronRight />
          </button>
        </h1>
        {ready ? (
          <>
            <div class="cal-head" aria-hidden="true">
              {WEEKDAYS.map((weekday) => (
                <span key={weekday}>{weekday}</span>
              ))}
            </div>
            <div class={`cal-grid-wrap${settled ? " cal-settled" : ""}`} ref={grid}>
              <div class="cal">
                {cells}
              </div>
            </div>
            <div class="cal-unfold" hidden={!selected}>
              <button type="button" class="cal-arrow cal-close-btn" aria-label="한 달 보기로 닫기" onClick={close}>
                <CloseIcon />
              </button>
              <div class="cal-unfold-title">
                <span class="cal-unfold-name">{selected ? `${monthDay(selected)} (${weekdayOf(selected)})` : ""}</span>
              </div>
            </div>
            <section class="cal-letter-panel" ref={panel} tabIndex={-1} aria-label={selected ? monthDay(selected) : "그날의 편지"}>
              {panelBody}
            </section>
            <Legend />
          </>
        ) : monthLoad.kind === "loading" ? (
          <StatusBlock kind="loading" />
        ) : (
          <StatusBlock kind={monthLoad.kind === "offline" ? "offline" : "error"} onRetry={() => void loadMonth(month, true)} />
        )}
      </div>
    </section>
  );
}

function Note({ line, children }: { line: string; children?: ComponentChildren }) {
  return (
    <div class="cal-preview">
      <p class="cal-pv-ln muted">
        <span class="cal-pv-txt">{line}</span>
      </p>
      {children ? <div class="cal-pv-btnrow">{children}</div> : null}
    </div>
  );
}

export function renderCalendar({ root, route }: ViewContext): () => void {
  const date = route.query.get("d");
  const valid = isIsoDate(date) ? date : null;
  const month = route.query.get("m");
  return mountPreact(root, <Calendar initialDate={valid} initialMonth={isIsoMonth(month) ? month : null} />);
}
