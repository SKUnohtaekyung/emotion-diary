// 설정 — 내보내기·영구 삭제 흐름(D-091 ⑤). settings.js가 이 세 이름으로 import해 라우팅한다(이름·인자 고정).
// 흰 바탕·박스 없음, 친구·조약돌 그림을 쓰지 않는다(D-091 — 내보내기·삭제·위기에는 은유를 쓰지 않는다).
// 범위·보존 문구는 UX_SPEC §13, DATA_MODEL §8, SAFETY_POLICY, schemas/export.schema.json을 따른다.
import { el, svgEl, announce } from "../dom.js";
import { todayISO } from "../state.js";

// 뒤로 가기(tabs.css .info-top·.back과 같은 모양) — 범위·성공·실패·영구 삭제 네 화면이 설정으로 돌아간다. 삭제 완료에는 두지 않는다(되돌릴 수 없는 일이 끝난 화면).
const backIcon = () => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d: "M14.5 5.5 8 12l6.5 6.5" }));
const backBar = (navigate) => el("div", { class: "info-top" },
  el("button", { type: "button", class: "back", "aria-label": "설정으로", onclick: () => navigate("settings") }, backIcon()));

// 선 아이콘(24 viewBox, 선 1.8, 둥근 끝·이음, 채움 없음) — 조약돌 모양(radius-blob) 면은 무늬일 뿐 조약돌 그림이 아니다.
const checkIcon = () => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "sd-icon-svg" }, svgEl("path", { d: "M5 12.5 9.3 17 19 7" }));
const miniCheck = () => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "sd-mini-check" }, svgEl("path", { d: "M5 12.5 9.3 17 19 7" }));
// 경고는 삼각형+느낌표를 ink로만 그린다(빨강 금지, D-091 ⑤). 점은 선끝을 둥글게 짧은 선으로 찍는다.
const warnIcon = () => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "sd-icon-svg" },
  svgEl("path", { d: "M12 4 21 19H3Z" }), svgEl("path", { d: "M12 10v4" }), svgEl("path", { d: "M12 16.6v.1" }));
const iconFace = (icon, tone) => el("div", { class: `sd-icon-face ${tone}`, "aria-hidden": "true" }, icon);
// 내보내기로 가는 알약의 꼬리표(settings.js chevIcon과 같은 경로)
const pillChev = () => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "sd-pill-chev" }, svgEl("path", { d: "M9.5 5.5 16 12l-6.5 6.5" }));

const exportFileName = () => `emotion-diary-${todayISO()}.json`; // UX_SPEC §13 — effectiveToday 기준(하루 기준 시각 반영)
const saveLocationNote = "iPhone에서는 다운로드가 '파일' 앱이나 공유 시트로 열리고, Android에서는 다운로드 폴더에 저장돼요."; // UX_SPEC §13 문구를 해요체로

// 시안이라 실제로 내보내지 않는다 — 선택은 모듈 변수로만 들고 있는다(공통 지침 §2). 화면에 들어올 때마다 기본값(꺼짐)으로 되돌린다.
const exportState = { analysis: false };
// 삭제 확인 문구 — UX_SPEC §13(확인 문구를 직접 입력) — 정확히 같은 문구만 통과시킨다.
const CONFIRM_PHRASE = "모든 기록 삭제";

function scopeRow(icon, label) {
  return el("li", { class: "sd-scope-row" }, icon, el("span", { text: label }));
}

function renderExportScope(main, navigate) {
  exportState.analysis = false; // 화면에 다시 들어오면 기본값(꺼짐)부터 — 이전 방문의 상태를 이어받지 않는다
  const switchBtn = el("button", { type: "button", class: "switch", role: "switch", "aria-checked": "false", "aria-label": "분석 결과도 함께 내보내기",
    onclick: () => { exportState.analysis = !exportState.analysis; switchBtn.setAttribute("aria-checked", String(exportState.analysis)); } },
    el("i", { "aria-hidden": "true" }));

  main.replaceChildren(el("div", { class: "screen sd-screen sd-export" },
    backBar(navigate),
    el("h1", { tabindex: "-1", text: "내 기록 내보내기" }),
    el("p", { class: "lede", text: "기록을 파일 하나로 내려받아요." }),

    el("section", { class: "sd-scope" },
      el("p", { class: "field-label", text: "들어가는 것" }),
      el("ul", { class: "sd-list", role: "list" }, // list-style:none이 Safari에서 목록 의미를 지우는 것을 막는다
        scopeRow(miniCheck(), "모든 완료·임시저장 기록"),
        scopeRow(miniCheck(), "하루 기준 시각 같은 설정"),
        el("li", { class: "sd-scope-row sd-scope-toggle" }, el("span", { text: "분석 결과도 함께" }), switchBtn))),

    el("section", { class: "sd-scope" },
      el("p", { class: "field-label", text: "들어가지 않는 것" }),
      el("ul", { class: "sd-list muted", role: "list" },
        el("li", { text: "비밀값" }), el("li", { text: "앱 내부 관리용 값" }), el("li", { text: "AI 대화 전문" }))),

    el("section", { class: "sd-file-info" },
      el("p", { class: "note", text: `파일 이름: ${exportFileName()}` }),
      el("p", { class: "note", text: saveLocationNote })),

    el("div", { class: "sd-actions" },
      el("button", { type: "button", class: "btn primary big", text: "내보내기", onclick: () => navigate("settings/export?s=done") }))));
}

function renderExportDone(main, navigate) {
  main.replaceChildren(el("div", { class: "screen sd-screen sd-export-done center" },
    backBar(navigate),
    iconFace(checkIcon(), "mint"),
    el("h1", { tabindex: "-1", text: "파일을 만들었어요" }),
    el("p", { class: "lede", text: saveLocationNote }), // 결과 화면은 큰 설명(상황) 먼저, 세부(파일 이름)는 그 아래 — 실패·삭제 완료와 같은 순서(D-099 result I1)
    el("p", { class: "note", text: exportFileName() }),
    el("div", { class: "sd-actions" },
      el("button", { type: "button", class: "btn primary big", text: "설정으로 돌아가기", onclick: () => navigate("settings") }))));
}

function renderExportFail(main, navigate) {
  main.replaceChildren(el("div", { class: "screen sd-screen sd-export-fail center" },
    backBar(navigate),
    iconFace(warnIcon(), "neutral"),
    el("h1", { tabindex: "-1", text: "내려받지 못했어요" }),
    el("p", { class: "lede", text: "기록은 그대로 안전해요. 잠시 뒤에 다시 시도해 주세요." }),
    el("p", { class: "note", text: "홈 화면 바로가기에서 안 된다면 브라우저에서 열어 다시 내보낼 수 있어요." }), // UX_SPEC §13 standalone 대안 안내
    el("div", { class: "sd-actions" },
      el("button", { type: "button", class: "btn primary big", text: "다시 시도", onclick: () => navigate("settings/export") }),
      el("button", { type: "button", class: "btn text", text: "브라우저에서 열기", onclick: () => announce("브라우저에서 열기: 시안이라 동작하지 않습니다") }))));
}

export function renderExport(main, navigate, params) {
  const s = params?.get("s");
  if (s === "done") return renderExportDone(main, navigate);
  if (s === "fail") return renderExportFail(main, navigate);
  return renderExportScope(main, navigate);
}

export function renderDelete(main, navigate) {
  const primaryBtn = el("button", { type: "button", class: "btn danger big", text: "영구 삭제", disabled: true,
    onclick: () => { if (input.value === CONFIRM_PHRASE) navigate("settings/deleted"); } });
  const input = el("input", { type: "text", class: "sd-confirm-input", id: "sdConfirm", "aria-describedby": "sdConfirmPhrase", autocomplete: "off", autocapitalize: "off", spellcheck: false });
  input.value = "";
  input.addEventListener("input", () => { primaryBtn.disabled = input.value !== CONFIRM_PHRASE; });

  main.replaceChildren(el("div", { class: "screen sd-screen sd-delete" },
    backBar(navigate),
    el("h1", { class: "sd-danger-title", tabindex: "-1", text: "모든 기록을 영구 삭제할까요?" }),

    el("section", { class: "sd-scope" },
      el("p", { class: "field-label", text: "지우는 것" }),
      el("ul", { class: "sd-list", role: "list" },
        el("li", { text: "모든 완료·임시저장 기록" }), el("li", { text: "분석 결과" }), el("li", { text: "설정" })),
      el("p", { class: "note sd-cant-undo", text: "되돌릴 수 없어요." })),

    el("p", { class: "note sd-export-hint", text: "삭제 전에 내 기록 내보내기로 사본을 받아 둘 수 있어요." }),
    el("button", { type: "button", class: "sd-pill-btn", onclick: () => navigate("settings/export") },
      el("span", { class: "sd-pill-inner" }, el("span", { text: "내 기록 내보내기" }), pillChev())),

    el("div", { class: "field sd-confirm-field" },
      el("label", { for: "sdConfirm", class: "field-label", text: "확인하려면 아래 문구를 그대로 입력해요" }),
      el("p", { id: "sdConfirmPhrase", class: "sd-confirm-phrase", text: CONFIRM_PHRASE }),
      input),

    el("div", { class: "sd-actions" },
      primaryBtn,
      el("button", { type: "button", class: "btn text", text: "그만두기", onclick: () => navigate("settings") }))));
}

export function renderDeleted(main, navigate) {
  // ‹ 뒤로 가기를 뺀다 — 되돌릴 수 없는 일이 끝난 화면이라 뒤로 가면 삭제 확인으로 되돌아가는 모순이 생긴다. 출구는 '처음으로' 하나다.
  main.replaceChildren(el("div", { class: "screen sd-screen sd-deleted center" },
    iconFace(checkIcon(), "neutral"),
    el("h1", { tabindex: "-1", text: "모두 삭제했어요" }),
    el("p", { class: "lede", text: "이 앱에서는 더 볼 수 없어요." }),
    // 기간 숫자를 적지 않는다(확인 전, DATA_MODEL §8·SAFETY_POLICY) — 백업·공급자 쪽 보존 지연만 정직하게 고지한다.
    el("p", { class: "note", text: "백업이나 서비스 제공사 쪽에는 정해진 기간 동안 남을 수 있어요." }),
    el("div", { class: "sd-actions" },
      el("button", { type: "button", class: "btn primary big", text: "처음으로", onclick: () => navigate("welcome") }))));
}
