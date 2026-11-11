// 오늘 `#/today`(UX_SPEC §3·§11, D-062·D-067·D-128) — 시안 web/js/views/today.js를 옮겼다(TASK-JOURNAL-01 J-7).
// 어두운 숲 속 가운데 돌 하나가 유일한 조작이다. 돌을 누르면 숲의 조약돌이 모두 켜지고 흰빛이 퍼진 뒤 다음 화면이 흰 화면에서 열린다.
// 하루에 기록은 하나다: 기록 있음 → 돌은 그날의 편지(읽기)를 연다(D-128), 쓰던 글 → 이어 쓰기, 없음 → 새로 쓰기(그날만, D-082).
// 오늘 기록을 확인하지 못하면(로딩·오류·연결 끊김) 돌을 누를 수 없다 — 확인 없이 새로 시작하면 하루 하나 규칙을 어길 수 있다(D-083 ①).
// 하단 탐색은 없다(D-076). 달력·통계·설정은 날짜 줄의 `지난 기록` 알약으로(D-090 ③), 위기 안내·잠금·내보내기·지우기·로그아웃은 설정에서(A-10, D-093).
// 상태 여섯 가지(UX_SPEC §11): 로딩·오류·연결 끊김·기록 없음(+지난 날 글 줄)·이어 쓰기·기록 있음(+이 휴대폰에 남은 글).

import { useEffect, useRef, useState } from "preact/hooks";
import type { TodayInfo } from "../../../shared/diary";
import { monthDay, monthDayWeekday } from "../lib/format";
import { mountPreact } from "../lib/mount";
import { prefersReducedMotion } from "../lib/motion";
import { navigate, pushFlowStep, type ViewContext } from "../router";
import { Forest, igniteAll, spreadLight } from "../ui/Forest";
import { fetchToday } from "../write/api";
import { resumeKey, type StepKey, stepName, stepQuery } from "../write/flow";
import { sendUnsentInBackground, unsentForToday } from "../write/session";

let flowSeq = 0;

function startFlow(date: string, step: StepKey = { step: "event", category: null }): void {
  flowSeq += 1;
  pushFlowStep(`#/write/${date}?${stepQuery(step)}`, `t${Date.now().toString(36)}${flowSeq}`);
}

/** '지난 기록' 알약 아이콘 — 하단 탐색 달력 탭과 같은 모양을 선으로만(D-090 ③) */
const CalendarGlyph = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3.5" y="5.5" width="17" height="15" rx="2.4" />
    <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
  </svg>
);

type Load = { kind: "loading" } | { kind: "failed"; offline: boolean } | { kind: "ok"; info: TodayInfo };

function Today() {
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const busy = useRef(false);
  const forest = useRef<HTMLDivElement>(null);
  const alive = useRef(true);

  const fetchIt = async (): Promise<void> => {
    setLoad({ kind: "loading" });
    const result = await fetchToday();
    if (!alive.current) return;
    if (!result.ok) {
      // 로그인 풀림(401)·잠김(423)은 처리기가 맡았다
      if (result.status !== 401 && result.status !== 423) setLoad({ kind: "failed", offline: result.offline });
      return;
    }
    setLoad({ kind: "ok", info: result.data });
    void sendUnsentInBackground();
  };
  useEffect(() => {
    alive.current = true;
    void fetchIt();
    return () => {
      alive.current = false;
    };
  }, []);

  // 돌을 누르면 조약돌이 차례로 켜지고(D-067) 흰빛이 퍼진다. 덮이는 순간 다음 화면으로 — 그 사이 떠났으면 가지 않는다
  const begin = (stone: HTMLButtonElement, go: () => void): void => {
    if (busy.current) return;
    busy.current = true;
    const spread = (): void => {
      if (!stone.isConnected) {
        busy.current = false;
        return;
      }
      spreadLight(stone, go);
    };
    if (prefersReducedMotion() || !forest.current) spread();
    else {
      igniteAll(forest.current, stone);
      window.setTimeout(spread, 620);
    }
  };

  const info = load.kind === "ok" ? load.info : null;
  const copies = info ? unsentForToday(info) : { today: null, past: null };
  const entry = info?.entry ?? null;
  const mode: "none" | "draft" | "recorded" = !info ? "none" : entry?.status === "completed" ? "recorded" : entry || copies.today ? "draft" : "none";
  const chosen = mode === "none" || !info ? null : new Set(copies.today && mode === "draft" ? copies.today.diary.categories.map((item) => item.code) : (entry?.categories ?? []));
  const resumeStep: StepKey = copies.today?.step ?? resumeKey(entry?.resume) ?? { step: "event", category: null };

  const caption = { none: "돌을 눌러 시작해요", draft: "이어서 써요", recorded: "오늘의 기록 보기" }[mode];
  const label = { none: "오늘의 마음 남기기", draft: "이어서 써요", recorded: "오늘의 기록 보기" }[mode];
  const onStart = (stone: HTMLButtonElement): void => {
    if (!info) return;
    if (mode === "recorded") begin(stone, () => navigate(`#/record/${info.date}`));
    else if (mode === "draft") begin(stone, () => startFlow(info.date, resumeStep));
    else begin(stone, () => startFlow(info.date));
  };

  // 지난 날 쓰던 글(D-082): 서버의 가장 최근 지난 임시저장 — 못 보낸 사본이 더 최근이면 그것
  let pastLine = null;
  if (info && mode === "none") {
    const pastDate = [info.pastDraft?.entryDate, copies.past?.date].filter((value): value is string => Boolean(value)).sort().pop();
    if (pastDate) {
      const yesterday = new Date(`${info.date}T00:00:00Z`);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const isYesterday = yesterday.toISOString().slice(0, 10) === pastDate;
      const pastKey =
        (copies.past?.date === pastDate ? copies.past.step : null) ?? (info.pastDraft?.entryDate === pastDate ? resumeKey(info.pastDraft.resume) : null) ?? {
          step: "event" as const,
          category: null
        };
      pastLine = (
        <p class="yline">
          <button type="button" onClick={() => startFlow(pastDate, pastKey)}>
            {`${isYesterday ? "어제" : `${monthDay(pastDate)}에`} 쓰던 글이 있어요`}
            <span aria-hidden="true"> ›</span>
          </button>
        </p>
      );
    }
  }

  let below = null;
  if (load.kind === "failed") {
    below = (
      <div class="today-status" role="status">
        <p class="today-line">{load.offline ? "연결이 끊겼어요 · 연결되면 시작할 수 있어요" : "오늘 기록을 확인하지 못했어요 · 잠시 뒤 다시 시도해 주세요"}</p>
        <button type="button" class="btn today-retry" onClick={() => void fetchIt()}>
          다시 시도
        </button>
      </div>
    );
  } else if (info && mode === "draft") {
    below = (
      <p class="dchip">
        <span class="today-chip">{`${stepName(resumeStep)} 중 · ${copies.today ? "이 휴대폰에 잠시 보관 중" : "임시저장됨"}`}</span>
      </p>
    );
  } else if (info && mode === "recorded" && copies.today) {
    // 이 휴대폰에 남은 사본(고치던 내용, 또는 다른 곳에서 완료되기 전에 쓰던 임시저장)으로 가는 길 — 열면 덮지 않고 묻는다(PR #40 리뷰)
    const copy = copies.today;
    below = (
      <div class="today-status">
        <p class="today-line">{copy.mode === "edit" ? "고치던 내용이 이 휴대폰에 남아 있어요" : "이 휴대폰에 보내지 못한 글이 남아 있어요"}</p>
        <button type="button" class="btn today-retry" onClick={() => startFlow(info.date, copy.step ?? { step: "letter", category: null })}>
          남은 글 보기
        </button>
      </div>
    );
  }

  const loading = load.kind === "loading";
  return (
    <section class="screen today" aria-busy={loading ? "true" : undefined}>
      <div ref={forest} class="forest-wrap">
        <Forest chosen={chosen} caption={caption} stoneLabel={label} onStart={onStart} loading={loading} failed={load.kind === "failed"}>
          {below}
          {pastLine}
          {loading ? (
            <div class="ldk" aria-hidden="true">
              <i class="ldk-stone" />
              <i class="ldk-cap" />
            </div>
          ) : null}
        </Forest>
      </div>
      <div class={loading ? "today-head skel" : "today-head"}>
        <div class="today-row">
          <p class="today-date">{info ? monthDayWeekday(info.date) : "오늘"}</p>
          <a class="today-past" href="#/calendar">
            <CalendarGlyph />
            지난 기록
          </a>
        </div>
        {/* 큰 질문은 글자 자체가 그림이다(D-067). 읽는 글은 그대로 '오늘은 어떤 마음이 머물렀나요?' */}
        <h1 class="hero" tabIndex={-1}>
          <span class="ty1">오늘은 어떤</span>
          {" "}
          <span class="ty2">
            마음<small>이</small>
          </span>
          {" "}
          <span class="ty3">머물렀나요?</span>
        </h1>
      </div>
      {loading ? (
        <p class="sr-only" role="status">
          오늘 기록을 확인하는 중이에요.
        </p>
      ) : null}
    </section>
  );
}

export function renderToday({ root }: ViewContext): () => void {
  return mountPreact(root, <Today />);
}
