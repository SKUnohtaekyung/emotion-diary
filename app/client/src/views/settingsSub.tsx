// 설정의 하위 화면 — 하루 기준 시각·개인정보 안내·내 계정·부를 이름 바꾸기(UX_SPEC §14, D-081 ②·D-104). 시안 web/js/views/settings.js를 옮겼다(TASK-JOURNAL-01 J-9).
// 위 줄은 시안의 ‹ 원형 버튼(info-top) + 제목. 버튼은 내용 바로 뒤(고정하지 않는다, D-123). 없는 기능은 말하지 않는다(원칙 8, D-105):
// 개인정보 안내의 'AI 분석을 켜면' 묶음은 AI 분석이 없어 뺐고, 내 계정에는 탈퇴·로그인 방식(가입 단계 accounts에서)을 두지 않는다.

import type { JSX } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { API, normalizeName } from "../../../shared/api";
import { request } from "../lib/api";
import { stoneUrl } from "../lib/art";
import { announce } from "../lib/dom";
import { mountPreact } from "../lib/mount";
import { back, navigate, type ViewContext } from "../router";
import { app } from "../state";
import { ChevronLeft } from "../ui/icons";
import { failureMessage } from "../ui/messages";
import { showToast } from "../ui/toast";
import { NAME_TEXT, nameProblem } from "./name";
import { Chev, Frame, hourLabel, ICONS, Row } from "./settings";

function SubHead({ title, to = "#/settings", label = "설정으로" }: { title: string; to?: string; label?: string }) {
  return (
    <>
      <div class="info-top">
        <button type="button" class="back" aria-label={label} onClick={() => back(to)}>
          <ChevronLeft />
        </button>
      </div>
      <h1 tabIndex={-1}>{title}</h1>
    </>
  );
}

// ── 하루 기준 시각 #/settings/day (D-081 ②) ──
function exampleLine(hour: number): string {
  if (hour === 0) return "자정을 기준으로 하면 날짜가 바뀌는 새벽 시간이 없어요. 자정이 하루의 시작이에요.";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return `지금 설정이면 ${hourLabel(hour - 1)}에 쓴 기록은 ${yesterday.getMonth() + 1}월 ${yesterday.getDate()}일 기록이 돼요.`;
}

function DayStart() {
  const [hour, setHour] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);
  const group = useRef<HTMLDivElement>(null);
  const load = async (): Promise<void> => {
    setFailed(false);
    const result = await request<{ dayStartHour: number }>("GET", API.dayStart);
    if (result.ok) setHour(result.data.dayStartHour);
    else if (result.status !== 401 && result.status !== 423) setFailed(true);
  };
  useEffect(() => {
    void load();
  }, []);
  // 고르면 곧바로 저장한다. 실패하면 앞 값으로 되돌리고 알린다(이미 쓴 기록의 날짜는 바뀌지 않는다 — 새 계산만)
  const pick = async (next: number): Promise<void> => {
    if (busy.current || hour === null || next === hour) return;
    busy.current = true;
    const before = hour;
    setHour(next);
    const result = await request("PUT", API.dayStart, { body: { dayStartHour: next } });
    busy.current = false;
    if (result.ok) return;
    setHour(before);
    if (result.status !== 401 && result.status !== 423) showToast(failureMessage(result));
  };
  const onKey = (event: KeyboardEvent, h: number): void => {
    // 라디오 묶음 — ←→로 옮기면 바로 고른다(WAI radio)
    const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    if (busy.current || hour === null) return; // 저장 중 — 선택과 초점이 어긋나지 않게 아무것도 옮기지 않는다(마감 검토 3)
    const next = (h + delta + 7) % 7;
    void pick(next);
    requestAnimationFrame(() => group.current?.querySelectorAll<HTMLButtonElement>(".st-pill")[next]?.focus());
  };
  return (
    <section class="screen settings-sub st-day">
      <SubHead title="하루 기준 시각" />
      <p class="lede">이 시각 전에는 오늘을 전날로 봐요.</p>
      {failed ? (
        <div class="st-load-fail">
          <p class="note">지금은 불러오지 못했어요.</p>
          <button type="button" class="btn btn-quiet" onClick={() => void load()}>
            다시 시도
          </button>
        </div>
      ) : (
        <>
          <div class="st-pills st-pills-day" role="radiogroup" aria-label="하루 기준 시각" ref={group} aria-busy={hour === null ? "true" : undefined}>
            {Array.from({ length: 7 }, (_, h) => (
              // biome-ignore lint/a11y/useSemanticElements: 시안의 알약 모양 라디오(role radio + aria-checked) — 숨은 input 없이 ←→로 고른다
              <button
                type="button"
                key={h}
                class="st-pill"
                role="radio"
                aria-checked={h === hour ? "true" : "false"}
                tabIndex={h === (hour ?? 4) ? 0 : -1}
                onClick={() => void pick(h)}
                onKeyDown={(event) => onKey(event, h)}
              >
                {hourLabel(h)}
              </button>
            ))}
          </div>
          <p class="note st-example" role="status">
            {hour === null ? "" : exampleLine(hour)}
          </p>
          <p class="lede st-day-note">이미 쓴 기록의 날짜는 바뀌지 않아요.</p>
        </>
      )}
    </section>
  );
}

// ── 개인정보 안내 #/settings/privacy ──
function InfoRow({ seq, glyph, name, desc }: { seq: number; glyph: () => JSX.Element; name: string; desc: string }) {
  return (
    <div class="st-row st-info-row">
      <Frame seq={seq}>{glyph()}</Frame>
      <div class="st-info-body">
        <p class="st-info-name">{name}</p>
        <p class="st-info-desc">{desc}</p>
      </div>
    </div>
  );
}

function Privacy() {
  return (
    <section class="screen settings-sub st-privacy">
      <SubHead title="개인정보 안내" />
      <div class="st-rows st-rows-info">
        {/* SAFETY_POLICY §6: 직접 쓴 원문은 자동으로 스캔하지 않는다 */}
        <InfoRow seq={0} glyph={ICONS.lock} name="직접 쓴 기록은 그대로예요" desc="자동으로 분석하거나 들여다보지 않아요. 위기 상황에서는 아래 '도움이 필요할 때 보기'에서 바로 연락해 주세요." />
        {/* DATA_MODEL §8: 화면에서는 바로 사라지지만 백업 소거는 늦을 수 있다(D-109) */}
        <InfoRow seq={1} glyph={ICONS.trash} name="보관과 지우기" desc="지운 기록은 화면에서 바로 사라지지만, 백업에서 완전히 지워지기까지 시간이 걸릴 수 있어요." />
        <InfoRow
          seq={2}
          glyph={ICONS.heart}
          name="진단·치료 앱이 아니에요"
          desc="정신질환을 진단하거나 치료를 대신하지 않아요. 진료·상담 기록 같은 건강 정보는 여기에 적지 않는 게 좋아요. 힘든 순간에는 아래 도움을 참고해 주세요."
        />
      </div>
      {/* 위기 연락처는 위기 안내 화면(D-094)에만 적는다 — 여기에는 그리로 가는 알약만 */}
      {/* 설정의 줄처럼 기록 칸을 쌓아 이동한다 — 그냥 링크(#/help)였을 때는 위기 안내의 ‹가 갈 곳을 몰라 오늘 화면으로 갔다(2026-11-18 휴대폰 확인 C3) */}
      <button type="button" class="st-pill-link st-help-link" onClick={() => navigate("#/help")}>
        <span class="st-pill-link-face">
          도움이 필요할 때 보기
          <Chev />
        </span>
      </button>
    </section>
  );
}

// ── 내 계정 #/settings/profile ──
function Profile() {
  const [name, setName] = useState(app.name?.trim() ?? "");
  useEffect(() => {
    if (name) return;
    void request<{ name: string }>("GET", API.profile).then((result) => {
      if (result.ok && typeof result.data?.name === "string") {
        app.name = result.data.name;
        setName(result.data.name);
      }
    });
  }, []);
  return (
    <section class="screen settings-sub st-profile">
      <SubHead title="내 계정" />
      <div class="st-me st-me-static">
        <img class="stone-img" src={stoneUrl("rest")} alt="" decoding="async" />
        <span class="st-me-text">
          <b>{name ? `${name}의 기록 공간` : "나의 기록 공간"}</b>
          <span>열쇠로 들어와요</span>
        </span>
      </div>
      <div class="st-rows">
        <Row seq={0} glyph={ICONS.person} name="부를 이름" value={name || undefined} onClick={() => navigate("#/settings/name")} />
      </div>
      <p class="note st-profile-note">이메일·전화번호는 받지 않아요. 부를 이름만 가지고 있어요.</p>
    </section>
  );
}

// ── 부를 이름 #/settings/name — 바뀐 것이 없거나 비어 있으면 '저장'은 흐리고, 누르면 이유를 버튼 위에 알린다(D-098 ③) ──
function NameChange() {
  const current = app.name?.trim() ?? "";
  const [value, setValue] = useState(current);
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  const problem = (raw: string): string | null => nameProblem(raw) ?? (normalizeName(raw) === current ? "지금 이름과 같아요." : null);
  const submit = async (): Promise<void> => {
    if (busy) return;
    const bad = problem(value);
    if (bad) {
      setHint(bad);
      announce(bad);
      field.current?.focus();
      return;
    }
    const name = normalizeName(value) as string;
    setBusy(true);
    const result = await request("PUT", API.profile, { body: { name } });
    setBusy(false);
    if (result.ok) {
      app.name = name;
      app.hasName = true;
      back("#/settings/profile");
      showToast("부를 이름을 바꿨어요");
      return;
    }
    if (result.status === 401 || result.status === 423) return;
    // 적은 이름은 그대로 둔다
    setHint(result.offline ? NAME_TEXT.offline : result.status === 422 ? NAME_TEXT.badChar : NAME_TEXT.server);
  };
  const blocked = problem(value) !== null;
  return (
    <section class="screen settings-sub st-name">
      <SubHead title="부를 이름" to="#/settings/profile" label="내 계정으로" />
      <div class="field">
        <label for="st-name">부를 이름</label>
        <input
          ref={field}
          id="st-name"
          class="input"
          type="text"
          autocomplete="nickname"
          value={value}
          aria-describedby="st-name-hint"
          onInput={(event) => {
            setValue(event.currentTarget.value);
            setHint(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.isComposing) void submit();
          }}
        />
      </div>
      <div class="sd-actions st-name-actions">
        <p class="write-hint" id="st-name-hint" hidden={hint === null}>
          {hint ?? ""}
        </p>
        <button type="button" class="btn btn-primary btn-block" aria-disabled={blocked || busy ? "true" : "false"} aria-describedby="st-name-hint" onClick={() => void submit()}>
          저장
        </button>
      </div>
    </section>
  );
}

export const renderDayStart = ({ root }: ViewContext): (() => void) => mountPreact(root, <DayStart />);
export const renderPrivacy = ({ root }: ViewContext): (() => void) => mountPreact(root, <Privacy />);
export const renderProfile = ({ root }: ViewContext): (() => void) => mountPreact(root, <Profile />);
export const renderNameChange = ({ root }: ViewContext): (() => void) => mountPreact(root, <NameChange />);
