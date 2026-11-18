// 설정 목록 `#/settings`(UX_SPEC §2·§14, D-091 ④⑤⑥, D-104 — 시안 web/js/views/settings.js renderList를 Preact로 옮김, TASK-REFLECT-01 R-5, D-129).
// 밝은 바탕에 하단 탐색. 줄은 '조약돌 면 아이콘 + 이름 + 지금 값 + ›' 한 모양이고, 줄을 누르면 지금 있는 하위 화면으로 간다.
// 하위 화면이 있는 줄만 둔다(없는 기능은 말하지 않는다 — 원칙 8, D-105): 내 계정(머리) · 하루 기준 시각 · 앱 잠금 · 개인정보 안내 · 내 기록 내보내기 ·
// 도움이 필요할 때 · 로그아웃 · 모든 기록 지우기. 2026-11-12 내 계정·하루 기준 시각·개인정보 안내를 더했다(TASK-JOURNAL-01 J-9, views/settingsSub.tsx).
// 처음 화면 다시 보기·작성 알림은 아직 없다(공개 준비에서 정한다).

import type { ComponentChildren, JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import { API } from "../../../shared/api";
import { request } from "../lib/api";
import { stoneUrl } from "../lib/art";
import { mountPreact } from "../lib/mount";
import { navigate, type ViewContext } from "../router";
import { app } from "../state";
import { confirmLogout } from "../ui/logout";

const icon = (...paths: string[]) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" class="st-ic">
    {paths.map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
);
// 시안 settings.js ICONS와 같은 경로
export const hourLabel = (h: number): string => (h === 0 ? "자정" : `새벽 ${h}시`);

export const ICONS = {
  horizon: () => icon("M4 16.6h16", "M7.6 16.6a4.4 4.4 0 0 1 8.8 0", "M12 6.6v2.2", "M6.7 10.6l1.5 1.5", "M17.3 10.6l-1.5 1.5"),
  lock: () => icon("M6.2 11.2a2 2 0 0 1 2-2h7.6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H8.2a2 2 0 0 1-2-2z", "M8.6 9.2V7.6a3.4 3.4 0 0 1 6.8 0v1.6"),
  trash: () => icon("M5 7h14", "M9.4 7V5.6A1.6 1.6 0 0 1 11 4h2a1.6 1.6 0 0 1 1.6 1.6V7", "M6.6 7l.7 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L18 7", "M10 10.6v6M14 10.6v6"),
  person: () => icon("M12 12.2a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2z", "M5.2 19.4c.9-3.2 3.6-5.2 6.8-5.2s5.9 2 6.8 5.2"),
  keypad: () => icon("M7.4 7h.01", "M12 7h.01", "M16.6 7h.01", "M7.4 12h.01", "M12 12h.01", "M16.6 12h.01", "M7.4 17h.01", "M12 17h.01", "M16.6 17h.01"),
  download: () => icon("M12 4v9.6", "M8.2 10 12 13.8 15.8 10", "M4.8 15.2v3a2 2 0 0 0 2 2h10.4a2 2 0 0 0 2-2v-3"),
  heart: () => icon("M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"),
  logout: () => icon("M9.8 4.6H6.4a2 2 0 0 0-2 2v10.8a2 2 0 0 0 2 2h3.4", "M11 12h9.2", "M17 8.4l3.6 3.6-3.6 3.6")
};
export const Chev = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" class="st-chev">
    <path d="M9.5 5.5 16 12l-6.5 6.5" />
  </svg>
);

/** 조약돌 면은 줄마다 방향을 뒤집어 손으로 놓은 느낌(시안 iconFrame과 같은 리듬) — 아이콘은 뒤집지 않는다. */
export function Frame({ seq, children }: { seq: number; children: ComponentChildren }) {
  return (
    <span class="st-ic-frame" style={{ "--fx": seq % 3 === 2 ? -1 : 1, "--fy": seq % 4 === 2 ? -1 : 1 }}>
      {children}
    </span>
  );
}

export function Row({ seq, glyph, name, value, onClick }: { seq: number; glyph: () => JSX.Element; name: string; value?: string; onClick: (event: MouseEvent) => void }) {
  return (
    // 이름은 보이는 글(이름 + 지금 값) 그대로다 — 음성으로 누르는 사람이 보이는 대로 말한다(WCAG 2.5.3, axe label-content-name-mismatch)
    <button type="button" class="st-row" onClick={onClick}>
      <Frame seq={seq}>{glyph()}</Frame>
      <span class="st-row-name">{name}</span>
      <span class="st-row-trail">
        {value ? <span class="st-row-value">{` ${value}`}</span> : null}
        <Chev />
      </span>
    </button>
  );
}

// 묶음 머리는 h2 — 화면 낭독기의 제목 건너뛰기로 묶음을 훑는다(D-099 section-header K1)
function Group({ title, children }: { title: string; children: ComponentChildren }) {
  return (
    <div class="st-group">
      <h2 class="st-group-head">{title}</h2>
      <div class="st-rows">{children}</div>
    </div>
  );
}

function Settings() {
  const name = app.name?.trim();
  // 하루 기준 시각의 지금 값 — 읽지 못하면 값 없이 줄만
  const [dayStart, setDayStart] = useState<number | null>(null);
  useEffect(() => {
    void request<{ dayStartHour: number }>("GET", API.dayStart).then((result) => {
      if (result.ok) setDayStart(result.data.dayStartHour);
    });
  }, []);
  return (
    <section class="screen settings">
      <div class="tb-body tb-rise">
        <h1 tabIndex={-1}>설정</h1>
        {/* 나의 돌 머리(D-091 ⑥ · MAP A-5): 오늘 화면 가운데 돌의 쉬는 모습 + 부를 이름. 내 계정 화면은 아직 없어 누르지 않는다 */}
        <button type="button" class="st-me" onClick={() => navigate("#/settings/profile")}>
          <img class="stone-img" src={stoneUrl("rest")} alt="" decoding="async" />
          <span class="st-me-text">
            <b>{name ? `${name}의 기록 공간` : "나의 기록 공간"}</b>
            <span>내 계정</span>
          </span>
          <Chev />
        </button>
        <Group title="기록">
          <Row seq={0} glyph={ICONS.horizon} name="하루 기준 시각" value={dayStart === null ? undefined : hourLabel(dayStart)} onClick={() => navigate("#/settings/day")} />
        </Group>
        <Group title="내 기록 지키기">
          <Row seq={0} glyph={ICONS.keypad} name="앱 잠금" value={app.appLock ? "켜짐" : "꺼짐"} onClick={() => navigate("#/settings/lock")} />
          <Row seq={1} glyph={ICONS.lock} name="개인정보 안내" onClick={() => navigate("#/settings/privacy")} />
          <Row seq={2} glyph={ICONS.download} name="내 기록 내보내기" onClick={() => navigate("#/settings/export")} />
        </Group>
        <Group title="도움과 안내">
          <Row seq={3} glyph={ICONS.heart} name="도움이 필요할 때" onClick={() => navigate("#/help")} />
        </Group>
        <Group title="계정">
          <Row seq={4} glyph={ICONS.logout} name="로그아웃" onClick={(event) => confirmLogout(event.currentTarget as HTMLElement)} />
        </Group>
        <button type="button" class="st-delete-row" onClick={() => navigate("#/settings/delete")}>
          <span>모든 기록 지우기</span>
          <Chev />
        </button>
      </div>
    </section>
  );
}

export function renderSettings({ root }: ViewContext): () => void {
  return mountPreact(root, <Settings />);
}
