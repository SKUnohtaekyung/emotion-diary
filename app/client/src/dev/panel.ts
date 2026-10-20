// 개발용 상태 칸(T3 A-6): Mac이 없어 iPhone 화면 속 상태를 개발 도구로 볼 수 없으므로(RK-036) 글자로 띄워 캡처로 받는다.
// 접힌 버튼 '상태'를 누르면 목록이 펼쳐진다. 입력한 글·열쇠·이름·비밀번호는 절대 싣지 않는다 —
// 여기에 나오는 값은 빌드 번호, 화면 표시 방식, 화면 높이, 탐색 종류, 표식 유무, 시각, 상태 번호, 횟수, 정리된 오류 일곱 칸뿐이다.
// 운영 묶음에는 들어가지 않는다(main.ts가 개발용일 때만 불러온다).

import { API_COMPAT } from "../../../shared/api";
import { APP_BUILD, APP_ENV } from "../lib/build";
import { h } from "../lib/dom";
import { KEYS, readStored } from "../lib/storage";
import { app } from "../state";
import type { KeyboardLab } from "./keyboard";
import { clock, type Trace } from "./trace";

type Row = [label: string, value: string];

const yesNo = (value: boolean): string => (value ? "참" : "거짓");

function media(query: string): boolean {
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

function sections(trace: Trace, now: number): Array<{ title: string; rows: Row[] }> {
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone;
  const hiddenAt = Number(readStored("local", KEYS.lastHiddenAt));
  const sinceHidden = Number.isFinite(hiddenAt) && hiddenAt > 0 ? `${Math.round((now - hiddenAt) / 1000)}초` : "기록 없음";
  const viewport = window.visualViewport?.height;
  const startLock = trace.startLock;
  const error = trace.lastError;

  return [
    {
      title: "버전",
      rows: [
        ["빌드", APP_BUILD],
        ["환경", APP_ENV],
        ["호환 단계", String(API_COMPAT)]
      ]
    },
    {
      title: "화면 표시 방식",
      rows: [
        ["standalone", yesNo(media("(display-mode: standalone)"))],
        ["fullscreen", yesNo(media("(display-mode: fullscreen)"))],
        ["browser", yesNo(media("(display-mode: browser)"))],
        ["navigator.standalone", standalone === undefined ? "없음" : yesNo(standalone)]
      ]
    },
    {
      title: "화면 높이",
      rows: [
        ["innerHeight", String(window.innerHeight)],
        ["visualViewport", viewport === undefined ? "없음" : String(Math.round(viewport))],
        ["screen.height", String(window.screen?.height ?? 0)]
      ]
    },
    {
      title: "시작",
      rows: [
        ["탐색 종류", startLock?.navType ?? "-"],
        ["alive 표식(시작할 때)", startLock ? (startLock.hasMarker ? "있었어요" : "없었어요") : "-"],
        ["마지막으로 숨은 뒤", sinceHidden],
        ["시작 잠금 판단", startLock ? (startLock.lock ? "잠금을 청했어요" : "청하지 않았어요") : "-"],
        ["이유", startLock?.reason ?? "-"]
      ]
    },
    {
      title: "최근 보임·숨김",
      rows:
        trace.lifecycle.length === 0
          ? [["기록", "없음"]]
          : trace.lifecycle
              .slice()
              .reverse()
              .map((row): Row => [clock(row.at), row.kind === "pageshow" ? `pageshow(persisted ${yesNo(row.persisted)})` : row.kind])
    },
    {
      title: "서버",
      rows: [
        ["마지막 API 응답", trace.lastApi ? `${trace.lastApi.path} ${trace.lastApi.status}` : "없음"],
        [
          "신호",
          trace.heartbeat.count === 0 ? "아직 보내지 않았어요" : `${trace.heartbeat.count}번, 마지막 ${trace.heartbeat.lastStatus}`
        ],
        ["로그인됨", yesNo(app.authenticated)],
        ["앱 잠금 켜짐", yesNo(app.appLock)],
        ["지금 잠김", yesNo(app.locked)]
      ]
    },
    {
      title: "마지막 오류",
      rows: error
        ? [
            ["kind", error.kind],
            ["name", error.name],
            ["source", error.source],
            ["line", String(error.line)],
            ["col", String(error.col)],
            ["build", error.build],
            ["route", error.route]
          ]
        : [["오류", "없음"]]
    }
  ];
}

export interface Panel {
  refresh(): void;
  /** 칸을 떼고 타이머를 멈춘다(시험에서 쓴다) */
  destroy(): void;
}

/** 자판 측정 기록(최근 것이 위) — 숫자만 */
function labSections(lab: KeyboardLab | undefined): Array<{ title: string; rows: Row[] }> {
  if (!lab) return [];
  const shots = lab.snapshots().reverse();
  if (shots.length === 0) return [{ title: "자판 측정", rows: [["기록", "없음"]] }];
  return shots.map((shot) => ({ title: `자판 · ${shot.label}`, rows: shot.rows }));
}

export function mountPanel(trace: Trace, lab?: KeyboardLab): Panel {
  const toggle = h("button", {
    type: "button",
    class: "dev-panel-toggle",
    "aria-expanded": "false",
    "aria-controls": "dev-panel-body",
    text: "상태"
  });
  const body = h("div", { id: "dev-panel-body", class: "dev-panel-body", role: "region", "aria-label": "개발용 상태" });
  body.hidden = true;
  // T-02 실험: 바깥 링크는 홈 화면 앱 안의 Safari 창으로 열린다(실측 S-09). 돌아왔을 때 화면이 새로 열리는지·잠기는지를 본다.
  // 1초마다 다시 그리는 목록 밖에 두어 누르는 순간 갈리지 않게 한다. 운영 묶음에는 이 링크가 없다.
  const outbound = h("a", { class: "dev-panel-link", href: "https://example.com/", rel: "noreferrer", text: "바깥 링크 열기(T-02)" });
  const extra = h("p", { class: "dev-panel-extra" }, outbound);
  extra.hidden = true;
  // 잠금 층이 떠 있어도 누를 수 있다 — 글이 없는 상태 표시뿐이다(data-keep-active)
  const root = h("div", { class: "dev-panel", "data-keep-active": "true" }, toggle, extra, body);
  document.body.append(root);
  document.body.classList.add("has-dev-panel");

  let timer: number | undefined;
  const draw = (): void => {
    if (body.hidden) return;
    const now = Date.now();
    body.replaceChildren(
      ...[...labSections(lab), ...sections(trace, now)].map((section) =>
        h(
          "section",
          { class: "dev-panel-section" },
          h("h2", { text: section.title }),
          h(
            "dl",
            {},
            ...section.rows.flatMap(([label, value]) => [h("dt", { text: label }), h("dd", { text: value })])
          )
        )
      )
    );
  };

  toggle.addEventListener("click", () => {
    const open = body.hidden;
    body.hidden = !open;
    extra.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    window.clearInterval(timer);
    if (open) {
      draw();
      // 지난 초가 흐르는 것을 보이게 1초마다 다시 그린다
      timer = window.setInterval(draw, 1000);
    }
  });

  return {
    refresh: draw,
    destroy() {
      window.clearInterval(timer);
      root.remove();
      document.body.classList.remove("has-dev-panel");
    }
  };
}
