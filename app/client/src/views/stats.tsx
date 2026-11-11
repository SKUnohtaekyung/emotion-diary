// 통계 `#/stats?p=7|30`와 친구 상세 `#/stats/<계열>?p=7|30`(UX_SPEC §9, DESIGN_SYSTEM §6.9, D-064·D-070·D-080·D-086·D-091·D-095·D-101~D-103·D-107 —
// 시안 web/js/views/stats.js를 Preact로 옮김, TASK-REFLECT-01 R-4). 계산은 app/shared/stats.ts(A-6)이고 이 파일은 그 결과를 그린다.
// 지키는 것: 순위 머리말·등급·점수 없음, 친구는 모두 같은 크기이고 친밀도는 길 위의 '위치'로만, 크기는 계열마다 따로(섞인 평균 없음),
// 비교는 화살표·색 없이 한 줄 글, 빈 날은 0이 아니라 빈 기둥, 5일 미만이면 '기록이 더 필요해요' 하나, 이어서 쓴 날은 이틀 이상일 때만.
// 시안 맨 아래의 'AI 안내 한 줄'은 옮기지 않는다 — 첫 공개는 AI 없이(D-126, 원칙 8 — A-8).

import { useEffect, useRef, useState } from "preact/hooks";
import type { DiaryEntryView } from "../../../shared/diary";
import { type FriendStat, indexByDate, MIN_DAYS, MIN_N_FOR_MEAN, type StatsMaterial, type StatsPeriod, type StatsSummary, summarize, topWords } from "../../../shared/stats";
import { CATEGORY_CODES, EMOTIONS } from "../../../shared/taxonomy";
import type { ApiResult } from "../lib/api";
import { FRIENDS, friendUrl, pebbleUrl, stoneUrl } from "../lib/art";
import { announce } from "../lib/dom";
import { mountPreact } from "../lib/mount";
import { prefersReducedMotion } from "../lib/motion";
import { back, navigate, type ViewContext } from "../router";
import { ChevronLeft } from "../ui/icons";
import { StatusBlock } from "../ui/StatusBlock";
import { fetchDiary } from "../write/api";
import { categoryLabel } from "../write/flow";
import { fetchStatsMaterial } from "../write/reflectionApi";

const COUNT_KO = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉"];
const WEEKDAYS_SHORT = ["일", "월", "화", "수", "목", "금", "토"];
const WEEKDAYS_FULL = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
// 1~10 숫자 읽기의 받침 유무로 와/과가 갈린다(시안 rangePhrase와 같다)
const WA_GWA: Record<number, string> = { 1: "과", 2: "와", 3: "과", 4: "와", 5: "와", 6: "과", 7: "과", 8: "과", 9: "와", 10: "과" };
// 친구 그림 아래 투명 여백 — 발이 길 끝에 닿게(시안 stats.js FOOT_PAD, 160px 기준)
const FOOT_PAD: Record<string, number> = { enjoyment: 7, wish: 8, sadness: 13, anger: 18, joy: 18, love: 5, hate: 5, fear: 10, disgust: 13 };
// 친구 상세 머리 장면의 길(시안 taperRoad가 VB 340×200, 바닥 48에서 그리는 값을 그대로 적었다 — 계열과 상관없이 같다)
const ROAD =
  "M165.5 205.7L163.8 205.4L162.6 205.7L161.4 205.9L160.5 205.9L159.6 205.6L159.0 205.1L158.5 204.5L158.2 203.7L158.1 202.8L158.2 201.8L158.4 200.7L158.8 199.5L159.3 198.3L159.9 197.1L160.7 195.8L161.5 194.6L162.4 193.3L163.3 192.0L164.4 190.6L165.4 189.3L166.6 187.9L167.7 186.5L169.0 185.1L170.2 183.6L171.5 182.1L172.8 180.4L174.1 178.7L175.4 176.9L176.7 174.9L178.0 172.6L179.1 170.2L179.9 167.4L180.4 164.4L180.3 161.5L179.7 158.7L178.8 156.2L177.5 154.2L176.2 152.4L174.7 151.0L173.3 149.7L166.7 154.3L167.1 155.8L167.3 157.1L167.4 158.3L167.2 159.4L166.9 160.2L166.4 160.7L165.8 160.9L165.2 161.1L164.6 161.2L163.8 161.4L162.9 161.7L161.8 162.0L160.6 162.3L159.4 162.6L158.0 162.9L156.6 163.2L155.1 163.5L153.5 163.8L151.9 164.1L150.2 164.5L148.5 164.9L146.8 165.3L144.9 165.7L143.1 166.2L141.1 166.7L139.1 167.3L137.1 168.0L135.0 168.8L132.8 169.7L130.5 170.7L128.2 171.9L125.8 173.4L123.3 175.0L120.8 177.0L118.3 179.2L115.8 181.8L113.4 184.7L111.1 187.9L108.8 191.4L106.5 194.3Z";
const SCENE_H = 200;
const GROUND = 48;
const FRIEND_H = 124;

/** 앱 안의 링크를 라우터로 연다 — 쌓은 칸이라 화면의 ‹(back)와 밀어서 뒤로가 같은 결과다(UX_SPEC §17 규칙 2, 마감 검토 3). 새 탭 열기 같은 수정 키는 그대로 둔다. */
function go(event: MouseEvent): void {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const href = (event.currentTarget as HTMLAnchorElement).getAttribute("href");
  if (!href) return;
  event.preventDefault();
  navigate(href);
}

const periodOf = (query: URLSearchParams): StatsPeriod => (query.get("p") === "30" ? 30 : 7);
const sizeText = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));
const labelOf = (code: string) => EMOTIONS.get(code)?.label ?? code;

function dayLine(iso: string, today: string): string {
  const [year = 1970, month = 1, day = 1] = iso.split("-").map(Number);
  if (iso === today) return `오늘 · ${month}월 ${day}일`;
  return `${month}월 ${day}일 ${WEEKDAYS_FULL[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]}`;
}

const Chev = () => (
  <svg viewBox="0 0 24 24" class="sx-chev" aria-hidden="true">
    <path d="M9.5 5.5 16 12l-6.5 6.5" />
  </svg>
);

type Load = { kind: "loading" } | { kind: "ok"; material: StatsMaterial; summary: StatsSummary } | { kind: "error" | "offline" };

/** 기간마다 재료를 한 번 받아 둔다(화면 안에서만 — 기기에 남기지 않는다). */
function useStats(initial: StatsPeriod) {
  const [period, setPeriod] = useState<StatsPeriod>(initial);
  const [loads, setLoads] = useState<Partial<Record<StatsPeriod, Load>>>({});
  const alive = useRef(true);
  useEffect(
    () => () => {
      alive.current = false;
    },
    []
  );
  const load = async (target: StatsPeriod, force = false) => {
    if (!force && loads[target]?.kind === "ok") return;
    setLoads((previous) => ({ ...previous, [target]: { kind: "loading" } }));
    const result: ApiResult<StatsMaterial> = await fetchStatsMaterial(target);
    if (!alive.current || result.status === 401 || result.status === 423) return;
    const next: Load = result.ok
      ? { kind: "ok", material: result.data, summary: summarize(result.data, CATEGORY_CODES) }
      : { kind: result.offline ? "offline" : "error" };
    setLoads((previous) => ({ ...previous, [target]: next }));
  };
  useEffect(() => {
    void load(period);
  }, [period]);
  return { period, setPeriod, load: loads[period] ?? ({ kind: "loading" } as Load), retry: () => void load(period, true) };
}

/** 기간 고르기 — 둘 중 하나를 고르는 radiogroup(D-099 segmented K1): 고른 항목만 Tab 순서, ←→(↑↓)로 옮기면 곧바로 고른다. */
function PeriodPicker({ period, onPick }: { period: StatsPeriod; onPick: (period: StatsPeriod) => void }) {
  const group = useRef<HTMLDivElement>(null);
  const choose = (value: StatsPeriod, focus: boolean) => {
    if (value !== period) onPick(value);
    if (focus) requestAnimationFrame(() => group.current?.querySelector<HTMLElement>(`[data-p="${value}"]`)?.focus());
  };
  return (
    <div class="segmented" role="radiogroup" aria-label="기간" ref={group}>
      {([7, 30] as const).map((value) => (
        // biome-ignore lint/a11y/useSemanticElements: 모양이 알약인 하나 고르기 — 시안과 같은 radiogroup + role=radio 단추(D-099 segmented K1)
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={value === period ? "true" : "false"}
          tabIndex={value === period ? 0 : -1}
          data-p={value}
          onClick={() => choose(value, false)}
          onKeyDown={(event) => {
            const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
            if (!step) return;
            event.preventDefault();
            choose(value === 7 ? 30 : 7, true);
          }}
        >
          {`최근 ${value}일`}
        </button>
      ))}
    </div>
  );
}

function FewEmpty({ note }: { note: string }) {
  return (
    <section class="sx-sec">
      <div class="sx-empty">
        <div class="sx-empty-friend">
          <img class="friend-img" src={friendUrl("enjoyment", 72)} width={72} height={72} alt="" decoding="async" />
        </div>
        <p class="sx-headline">기록이 더 필요해요</p>
        <p class="caption">{note}</p>
      </div>
    </section>
  );
}

function Friendship({ summary, period, animate }: { summary: StatsSummary; period: StatsPeriod; animate: boolean }) {
  const ranked = summary.friends
    .filter((friend) => friend.daysWith > 0)
    .sort((a, b) => b.daysWith - a.daysWith || CATEGORY_CODES.indexOf(a.code) - CATEGORY_CODES.indexOf(b.code));
  const away = summary.friends.filter((friend) => friend.daysWith === 0);
  return (
    <section class="sx-sec">
      <h2 class="sx-eyebrow">친구와의 친밀도</h2>
      <p class="sx-headline">{`이번 기간에는 ${COUNT_KO[ranked.length] ?? String(ranked.length)} 친구가 다녀갔어요`}</p>
      <p class="note">함께한 날이 많을수록 나와 가까이 서 있어요.</p>
      <ol class={`sx-tracks${animate ? " sx-animate-in" : ""}`}>
        {ranked.map((friend, index) => (
          <li key={friend.code} class="sx-trk" style={{ "--c": `var(--${friend.code}-accent)`, "--p": (((friend.closeness ?? 0) * 100).toFixed(1)), "--sx-i": String(index) }}>
            <a class="sx-trk-link" href={`#/stats/${friend.code}?p=${period}`} onClick={go}>
              <span class="sr-only">{`${FRIENDS[friend.code]?.name ?? ""}, 기록한 ${summary.recorded}일 중 ${friend.daysWith}일 함께했어요. 자세히 보기`}</span>
              <div class="sx-trk-who" aria-hidden="true">
                <strong>{FRIENDS[friend.code]?.name}</strong>
                <span>{`${categoryLabel(friend.code)} · ${friend.daysWith}일`}</span>
              </div>
              <div class="sx-trk-line" aria-hidden="true">
                <span class="sx-road">
                  <i class="sx-base" />
                  <i class="sx-dot-mark" />
                  <span class="sx-pos">
                    <img class="friend-img" src={friendUrl(friend.code, 62)} width={62} height={62} alt="" decoding="async" />
                  </span>
                </span>
                <span class="sx-end">
                  <span class="sx-me">
                    <img class="stone-img" src={stoneUrl("rest")} alt="" decoding="async" />
                  </span>
                  <span class="sx-view-pill">
                    보기
                    <Chev />
                  </span>
                </span>
              </div>
            </a>
          </li>
        ))}
      </ol>
      <p class="caption sx-trk-caption">{`친밀도는 기록한 ${summary.recorded}일 중 그 친구와 함께한 날의 비율이에요. 많고 적음에 좋고 나쁨은 없어요.`}</p>
      {away.length ? (
        <div class="sx-away">
          <h3>이번에는 오지 않았어요</h3>
          <div class="sx-away-row">
            {away.map((friend) => (
              <div key={friend.code}>
                <img class="friend-img" src={friendUrl(friend.code, 46)} width={46} height={46} alt="" decoding="async" />
                <b>{FRIENDS[friend.code]?.name}</b>
                <span>{categoryLabel(friend.code)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Words({ material, summary, period }: { material: StatsMaterial; summary: StatsSummary; period: StatsPeriod }) {
  if (!summary.words.length) return null;
  // 같은 표기가 기간 안에서 두 계열 이상에 나오면 계열 이름을 붙인다(D-099 chip G1 — 같은 말이라도 계열이 다르면 다른 감정)
  const categoriesOf = new Map<string, Set<string>>();
  const inPeriod = new Set(summary.dates);
  for (const entry of material.entries) {
    if (!inPeriod.has(entry.date)) continue;
    for (const emotion of entry.emotions) {
      const label = labelOf(emotion.code);
      categoriesOf.set(label, (categoriesOf.get(label) ?? new Set()).add(emotion.category));
    }
  }
  return (
    <section class="sx-sec">
      <h2 class="sx-eyebrow">자주 머문 말</h2>
      <p class="sx-headline">{`이번 ${period}일에 자주 고른 말이에요`}</p>
      <p class="caption">세부 감정 기준이에요. 많이 골랐다고 좋거나 나쁜 게 아니에요.</p>
      <div class="sx-pillrow">
        {summary.words.map((word) => {
          const label = labelOf(word.code);
          const shared = (categoriesOf.get(label)?.size ?? 0) > 1;
          return (
            <span class="sx-pill" key={word.code}>
              {shared ? `${label} · ${categoryLabel(word.category)}` : label}
              <em>{String(word.count)}</em>
            </span>
          );
        })}
      </div>
    </section>
  );
}

function StatsList({ initial }: { initial: StatsPeriod }) {
  const { period, setPeriod, load, retry } = useStats(initial);
  const [animate] = useState(() => !prefersReducedMotion());
  const [switched, setSwitched] = useState(false);
  const pick = (value: StatsPeriod) => {
    history.replaceState(history.state, "", `#/stats?p=${value}`); // 친구 상세에서 돌아왔을 때 기간이 이어지게(쌓지 않는다 — D-091 ①)
    setSwitched(true);
    setPeriod(value);
    announce(`최근 ${value}일 통계`);
  };
  let body = null;
  if (load.kind === "loading") body = <StatusBlock kind="loading" />;
  else if (load.kind !== "ok") body = <StatusBlock kind={load.kind} onRetry={retry} />;
  else {
    const { summary, material } = load;
    body = (
      <>
        <div class="sx-summary">
          <div class="sx-tile" role="img" aria-label={`기록한 날 ${summary.recorded}일, 최근 ${period}일 중`}>
            <div class="sx-tile-v" aria-hidden="true">{`${summary.recorded}일`}</div>
            <div class="sx-tile-k" aria-hidden="true">
              기록한 날
            </div>
            <div class="sx-tile-note" aria-hidden="true">{`최근 ${period}일 중`}</div>
          </div>
          {summary.streak >= 2 ? (
            // 이어서 쓴 날은 이틀 이상일 때만(D-107) — 끊긴 날의 '0일'·'1일'은 기록을 의무로 읽히게 한다(SERVICE_WHY 원칙 4·§19.12)
            <div class="sx-tile" role="img" aria-label={`이어서 쓴 날 ${summary.streak}일`}>
              <div class="sx-tile-v" aria-hidden="true">{`${summary.streak}일`}</div>
              <div class="sx-tile-k" aria-hidden="true">
                이어서 쓴 날
              </div>
            </div>
          ) : null}
        </div>
        {summary.enough ? (
          <div>
            <Friendship summary={summary} period={period} animate={animate && !switched} />
            <Words material={material} summary={summary} period={period} />
          </div>
        ) : (
          <FewEmpty note={`기록이 ${MIN_DAYS}일 이상 쌓이면 친구와 얼마나 가까웠는지, 자주 머문 말도 보여 드려요.`} />
        )}
      </>
    );
  }
  return (
    <section class="screen stats-screen">
      <h1 tabIndex={-1}>통계</h1>
      <PeriodPicker period={period} onPick={pick} />
      <div class="sx-body">{body}</div>
    </section>
  );
}

// ── 친구 상세 ─────────────────────────────────────────────────────

function FriendScene({ code }: { code: string }) {
  const footPad = ((FOOT_PAD[code] ?? 0) / 160) * FRIEND_H;
  return (
    <div class="sxd-scene">
      <svg viewBox={`0 0 340 ${SCENE_H}`} preserveAspectRatio="none" class="sxd-scene-svg" aria-hidden="true" focusable="false">
        <path class="sxd-scene-hill-far" d={`M0,72 C57,52 113,47 170,56 C227,65 283,56 340,44 L340,${SCENE_H} L0,${SCENE_H} Z`} />
        <path class="sxd-scene-hill-mid" d={`M0,100 C57,80 113,73 170,82 C227,91 283,80 340,67 L340,${SCENE_H} L0,${SCENE_H} Z`} />
        <path class="sxd-scene-road" d={ROAD} />
      </svg>
      <img
        class="friend-img"
        src={friendUrl(code, FRIEND_H)}
        width={FRIEND_H}
        height={FRIEND_H}
        alt={`${FRIENDS[code]?.name ?? ""}, ${categoryLabel(code)} 친구`}
        decoding="async"
        style={{ bottom: `${(GROUND - footPad).toFixed(1)}px` }}
      />
    </div>
  );
}

function statLine(friend: FriendStat): string {
  const current = friend.current;
  if (current.n < MIN_N_FOR_MEAN || current.mean === null) return `${current.n}일 기록 · 평균은 ${MIN_N_FOR_MEAN}일부터`;
  return `평균 ${current.mean.toFixed(1)} · ${current.n}일 기록`;
}

function compareText(friend: FriendStat, period: StatsPeriod): string | null {
  const comparison = friend.comparison;
  if (!comparison) return null;
  if (comparison.verdict === "similar") return `지난 ${period}일과 비슷해요`;
  const amount = (Math.round(Math.abs(comparison.delta) * 10) / 10).toFixed(1);
  return `지난 ${period}일보다 ${amount} ${comparison.verdict === "higher" ? "높아요" : "낮아요"}`;
}

function rangeAria(friend: FriendStat): string {
  const current = friend.current;
  const values = current.days.map((day) => Math.round(day.value * 10) / 10);
  if (current.n === 1) return `크기 ${sizeText(values[0] ?? 0)}`;
  if (current.n === 2) {
    const [a = 0, b = 0] = values;
    return `크기 ${sizeText(a)}${Number.isInteger(a) ? (WA_GWA[a] ?? "과") : "과"} ${sizeText(b)}`;
  }
  if (current.min === current.max) return `모두 ${sizeText(current.min ?? 0)}`;
  return `범위 ${sizeText(current.min ?? 0)}에서 ${sizeText(current.max ?? 0)}`;
}

const PEEK_WORDS = 4;
const PEB_SHAPES = ["a", "b", "c"];

function Peek({ code, iso, value, today, period, words }: { code: string; iso: string; value: number; today: string; period: StatsPeriod; words: string[] }) {
  // 불러오기 실패(연결 끊김·오류)를 '비워 둔 날'로 보이지 않는다 — 그날 글이 없다고 잘못 말하게 된다(마감 검토 5)
  const [entry, setEntry] = useState<DiaryEntryView | "loading" | "missing" | "error" | "offline">("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setEntry("loading");
    void fetchDiary(iso).then((result) => {
      if (!live) return;
      setEntry(result.ok ? result.data : result.status === 404 ? "missing" : result.offline ? "offline" : "error");
    });
    return () => {
      live = false;
    };
  }, [iso, attempt]);
  const filled = Math.round(value);
  const [, month, day] = iso.split("-").map(Number);
  const event = typeof entry === "object" ? entry.eventText.trim() : "";
  const vars = { "--chip-fill": `var(--${code}-chip-fill)`, "--chip-border": `var(--${code}-chip-border)`, "--chip-text": `var(--${code}-chip-text)`, "--dot": `var(--${code}-accent)` };
  return (
    <article class="sxd-peek" style={vars} aria-label={`${dayLine(iso, today)}의 편지 미리보기`}>
      <i class="sxd-peek-tape" aria-hidden="true" />
      <div class="sxd-peek-top">
        <div>
          <p class="sxd-peek-date">
            {`${month}월 ${day}일의 편지`}
            <span class="sr-only">{` (${dayLine(iso, today)})`}</span>
          </p>
          <p class="sxd-peek-size">
            <span>{`${categoryLabel(code)} ${sizeText(value)}`}</span>
            <span class="sxd-peek-dots" aria-hidden="true">
              {Array.from({ length: 10 }, (_, k) => (
                <i key={k} class={k < filled ? "f" : ""} />
              ))}
            </span>
          </p>
        </div>
        <img class="pebble-img sxd-peek-seal" src={pebbleUrl(code, 34)} width={34} height={34} alt="" decoding="async" />
      </div>
      <div class="sxd-peek-lines">
        {entry === "loading" ? (
          <p class="sxd-peek-event empty">불러오는 중이에요</p>
        ) : entry === "error" || entry === "offline" ? (
          <p class="sxd-peek-event empty">
            {entry === "offline" ? "연결이 끊겨 불러오지 못했어요 " : "불러오지 못했어요 "}
            <button type="button" class="link" onClick={() => setAttempt((count) => count + 1)}>
              다시 시도
            </button>
          </p>
        ) : event ? (
          <p class="sxd-peek-event">{event}</p>
        ) : (
          <p class="sxd-peek-event empty">있었던 일은 비워 둔 날이에요</p>
        )}
      </div>
      {words.length ? (
        <div class="sxd-peek-chips">
          {words.slice(0, PEEK_WORDS).map((word) => (
            <span class="sxd-chip" key={word}>
              <i class="sxd-chip-dot" aria-hidden="true" />
              <span class="sxd-chip-label">{word}</span>
            </span>
          ))}
          {words.length > PEEK_WORDS ? (
            <span class="sxd-peek-more" role="img" aria-label={`고른 말 ${words.length - PEEK_WORDS}개 더`}>{`+${words.length - PEEK_WORDS}`}</span>
          ) : null}
        </div>
      ) : null}
      <div class="sxd-peek-sign">
        <span class="sxd-peek-sig">— 그날의 나에게</span>
        <a class="sxd-peek-open" href={`#/record/${iso}?from=stats&cat=${code}&p=${period}`} onClick={go}>
          편지 열기
          <Chev />
        </a>
      </div>
    </article>
  );
}

function SizeTrend({ code, friend, summary, material, period }: { code: string; friend: FriendStat; summary: StatsSummary; material: StatsMaterial; period: StatsPeriod }) {
  const byDate = indexByDate(material.entries);
  const sizeOn = new Map(friend.current.days.map((day) => [day.date, day.value]));
  const recorded = summary.dates.filter((date) => sizeOn.has(date));
  const [picked, setPicked] = useState<string | null>(recorded[recorded.length - 1] ?? null);
  const chart = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const month = summary.days > 7;
  useEffect(() => {
    // 기간이 바뀌어 고른 날이 이번 표에 없으면 가장 최근 기록한 날로
    if (!picked || !sizeOn.has(picked)) setPicked(recorded[recorded.length - 1] ?? null);
  });
  const select = (iso: string, focus: boolean) => {
    setPicked(iso);
    requestAnimationFrame(() => {
      if (focus) chart.current?.querySelector<HTMLElement>(`[data-iso="${iso}"]`)?.focus();
      host.current?.scrollIntoView({ block: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    });
  };
  const keyMove = (iso: string, key: string) => {
    const index = recorded.indexOf(iso);
    const map: Record<string, number> = { ArrowRight: index + 1, ArrowDown: index + 1, ArrowLeft: index - 1, ArrowUp: index - 1, Home: 0, End: recorded.length - 1 };
    if (!(key in map)) return false;
    const target = recorded[Math.max(0, Math.min(recorded.length - 1, map[key] ?? index))];
    if (target && target !== iso) select(target, true);
    return true;
  };
  let aria = `${categoryLabel(code)} 크기, 최근 ${period}일 중 ${friend.current.n}일 기록`;
  if (friend.current.mean !== null) aria += `, 평균 ${friend.current.mean.toFixed(1)}`;
  aria += `, ${rangeAria(friend)}. 기록한 날을 고르면 아래에 그날 편지 미리보기가 나와요.`;
  const cmp = compareText(friend, period);
  const pickImg = (size: number) => <img class="pebble-img sxd-pick-peb" src={pebbleUrl(code, size)} alt="" aria-hidden="true" decoding="async" />;

  const cells = summary.dates.map((iso, index) => {
    const value = sizeOn.get(iso);
    const [year = 1970, mon = 1, day = 1] = iso.split("-").map(Number);
    const isToday = iso === summary.today;
    const chosen = iso === picked;
    if (month) {
      const dateText = isToday ? "오늘" : index === 0 || day === 1 ? `${mon}/${day}` : String(day);
      const inner = [
        <span key="d" class="sxd-mg-date" aria-hidden="true">
          {dateText}
        </span>,
        value === undefined ? null : (
          <span key="p" class={`sxd-mg-peb peb-${PEB_SHAPES[day % 3]}`} aria-hidden="true" style={{ "--v": String(Math.round(value)) }}>
            {chosen ? pickImg(42) : null}
            <span class="sxd-mg-fill" />
            <span class="sxd-mg-val">{sizeText(value)}</span>
          </span>
        )
      ];
      if (value === undefined)
        return (
          <span key={iso} class="sxd-mg-cell empty">
            {inner}
            <span class="sr-only">{`${dayLine(iso, summary.today)}: 기록 없음`}</span>
          </span>
        );
      return (
        // biome-ignore lint/a11y/useSemanticElements: 날을 고르는 radiogroup의 단추(시안과 같다 — 고른 날의 편지가 아래에 펼쳐진다, D-102)
        <button
          key={iso}
          type="button"
          role="radio"
          aria-checked={chosen ? "true" : "false"}
          tabIndex={chosen ? 0 : -1}
          class="sxd-mg-cell"
          data-iso={iso}
          aria-label={`${dayLine(iso, summary.today)}, 크기 ${sizeText(value)}`}
          onClick={() => !chosen && select(iso, false)}
          onKeyDown={(event) => keyMove(iso, event.key) && event.preventDefault()}
        >
          {inner}
        </button>
      );
    }
    const filled = value === undefined ? 0 : Math.round(value);
    const inner = [
      chosen ? <span key="k">{pickImg(30)}</span> : null,
      <span key="v" class="sxd-col-val" aria-hidden="true">
        {value === undefined ? "" : sizeText(value)}
      </span>,
      <div key="c" class="sxd-col" aria-hidden="true">
        {Array.from({ length: 10 }, (_, k) => (
          <i key={k} class={k < filled ? "f" : ""} />
        ))}
      </div>,
      <span key="a" class="sxd-col-axis" aria-hidden="true">
        {isToday ? "오늘" : WEEKDAYS_SHORT[new Date(Date.UTC(year, mon - 1, day)).getUTCDay()]}
      </span>
    ];
    if (value === undefined)
      return (
        <span key={iso} class="sxd-col-wrap empty">
          {inner}
          <span class="sr-only">{`${dayLine(iso, summary.today)}: 기록 없음`}</span>
        </span>
      );
    return (
      // biome-ignore lint/a11y/useSemanticElements: 날을 고르는 radiogroup의 단추(시안과 같다 — D-102)
      <button
        key={iso}
        type="button"
        role="radio"
        aria-checked={chosen ? "true" : "false"}
        tabIndex={chosen ? 0 : -1}
        class="sxd-col-wrap"
        data-iso={iso}
        aria-label={`${dayLine(iso, summary.today)}, 크기 ${sizeText(value)}`}
        onClick={() => !chosen && select(iso, false)}
        onKeyDown={(event) => keyMove(iso, event.key) && event.preventDefault()}
      >
        {inner}
      </button>
    );
  });
  const [y0 = 1970, m0 = 1, d0 = 1] = (summary.dates[0] ?? "").split("-").map(Number);
  const lead = month ? Array.from({ length: new Date(Date.UTC(y0, m0 - 1, d0)).getUTCDay() }, (_, k) => <span key={`l${k}`} class="sxd-mg-cell blank" aria-hidden="true" />) : [];
  const head = month
    ? WEEKDAYS_SHORT.map((weekday) => (
        <span key={`w${weekday}`} class="sxd-mg-wd" aria-hidden="true">
          {weekday}
        </span>
      ))
    : [];
  const pickedValue = picked ? sizeOn.get(picked) : undefined;
  const words = picked ? (byDate.get(picked)?.emotions ?? []).filter((emotion) => emotion.category === code).map((emotion) => labelOf(emotion.code)) : [];
  return (
    <section class="sx-sec">
      <h2>{`${categoryLabel(code)}의 크기`}</h2>
      {cmp ? <p class="sxd-cmp-head">{cmp}</p> : null}
      <p class="sxd-stat-line">{statLine(friend)}</p>
      <div
        class={month ? "sxd-mg" : "sxd-cols"}
        role="radiogroup"
        aria-label={aria}
        ref={chart}
        style={{ "--dot": `var(--${code}-accent)`, "--chip-fill": `var(--${code}-chip-fill)`, "--chip-border": `var(--${code}-chip-border)`, "--chip-text": `var(--${code}-chip-text)` }}
      >
        {head}
        {lead}
        {cells}
      </div>
      <div class="sxd-peek-host" ref={host}>
        {picked && pickedValue !== undefined ? <Peek code={code} iso={picked} value={pickedValue} today={summary.today} period={period} words={words} /> : null}
      </div>
    </section>
  );
}

function WordsDetail({ code, material, summary }: { code: string; material: StatsMaterial; summary: StatsSummary }) {
  const words = topWords(indexByDate(material.entries), summary.dates, 8, code);
  if (!words.length) return null;
  const vars = { "--chip-fill": `var(--${code}-chip-fill)`, "--chip-border": `var(--${code}-chip-border)`, "--chip-text": `var(--${code}-chip-text)`, "--dot": `var(--${code}-accent)` };
  // "설이와 고른 말"은 친구가 함께 고른 것처럼 읽힌다 — 계열을 주어로
  return (
    <section class="sx-sec">
      <h2>{`${categoryLabel(code)}에서 고른 말`}</h2>
      <div class="sxd-chiprow">
        {words.map((word) => (
          <span class="sxd-chip" style={vars} key={word.code}>
            <i class="sxd-chip-dot" aria-hidden="true" />
            <span class="sxd-chip-label">{labelOf(word.code)}</span>
            <em class="sxd-chip-count">{String(word.count)}</em>
          </span>
        ))}
      </div>
    </section>
  );
}

function FriendDetail({ code, initial }: { code: string; initial: StatsPeriod }) {
  const { period, setPeriod, load, retry } = useStats(initial);
  const pick = (value: StatsPeriod) => {
    history.replaceState(history.state, "", `#/stats/${code}?p=${value}`); // 기간 전환은 쌓지 않는다(D-091 ②)
    setPeriod(value);
    announce(`최근 ${value}일 통계`);
  };
  const label = categoryLabel(code);
  let sub = label;
  let body = null;
  if (load.kind === "loading") body = <StatusBlock kind="loading" />;
  else if (load.kind !== "ok") body = <StatusBlock kind={load.kind} onRetry={retry} />;
  else {
    const { summary, material } = load;
    const friend = summary.friends.find((item) => item.code === code);
    if (!summary.enough || !friend) {
      body = (
        <div class="sx-empty">
          <p class="sx-headline">기록이 더 필요해요</p>
          <p class="caption">{`기록이 ${MIN_DAYS}일 이상 쌓이면 ${label}의 크기를 날마다 보여 드려요.`}</p>
        </div>
      );
    } else {
      sub = `${label} · 최근 ${period}일 중 ${friend.daysWith}일 함께했어요`;
      body =
        friend.daysWith === 0 ? (
          <div class="sx-empty">
            <p class="sx-headline">이번 기간에는 오지 않았어요</p>
          </div>
        ) : (
          <div>
            <SizeTrend code={code} friend={friend} summary={summary} material={material} period={period} />
            <WordsDetail code={code} material={material} summary={summary} />
          </div>
        );
    }
  }
  return (
    <section class="screen sxd-screen">
      <div class="info-top">
        <button type="button" class="back" aria-label="통계로" onClick={() => back(`#/stats?p=${period}`)}>
          <ChevronLeft />
        </button>
      </div>
      <div class="sxd-head">
        <FriendScene code={code} />
        <h1 tabIndex={-1}>{FRIENDS[code]?.name ?? label}</h1>
        <p class="sxd-sub">{sub}</p>
      </div>
      <PeriodPicker period={period} onPick={pick} />
      <div class="sxd-body">{body}</div>
    </section>
  );
}

export function renderStats({ root, route }: ViewContext): () => void {
  return mountPreact(root, <StatsList initial={periodOf(route.query)} />);
}

export function renderFriendDetail({ root, route }: ViewContext): () => void {
  const code = route.params.category ?? "";
  return mountPreact(root, <FriendDetail code={code} initial={periodOf(route.query)} />);
}
