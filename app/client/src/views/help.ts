// 도움이 필요할 때(위기 안내) `#/help` — UX_SPEC §3 '도움이 필요할 때 보기', D-093·D-094, TASK-PERSONAL-01 A-1~A-4.
// 평면 하위 화면이다: 친구·감정 색·조약돌·빛·움직임이 없고, 큰 '돌아가기' 버튼 없이 위 ‹만 둔다.
// 가장 눈에 띄는 동작은 '떠나기'가 아니라 '연락하기'다 — 줄마다 전화(와 문자) 링크(tel:·sms:)이고, 이것은 바깥 링크가 아니다(UX_SPEC §17 6).
// 연락처는 versioned resource(data/crisis-resources/kr.json, SAFETY_POLICY §6 ③)를 묶음에 넣어 읽는다 — AI 경로의 위기 전환도 같은 파일을 쓴다.
// 112·119는 이 파일의 상수로도 둔다(A-3): 자원 파일이 비거나 모양이 틀려도 보여야 한다. 값이 kr.json과 같은지는 시험이 대조한다.
// 출처·확인일·검토 상태는 화면에 적지 않는다(D-132, 2026-11-18 사용자 결정 — D-094 ⑤·A-4의 '검토 전'·출처 줄을 대체).
// 그 값은 자원 파일(kr.json)과 문서(SAFETY_POLICY §6, research/legal-onboarding-crisis-2026-09.md)에만 남고, 임상·안전 검토는 공개 관문(public-only)에 그대로 남는다.

import crisisResources from "../../../../data/crisis-resources/kr.json";
import { h } from "../lib/dom";
import { back, type View } from "../router";

export interface EmergencyContact {
  number: string;
  name: string;
  sms: string | null;
}

/** 전국 공통 긴급번호. 자원 파일과 상관없이 화면에 보인다. 값은 data/crisis-resources/kr.json의 emergency와 같아야 하고 시험이 대조한다. */
export const EMERGENCY: readonly EmergencyContact[] = [
  { number: "112", name: "경찰", sms: null },
  { number: "119", name: "구급", sms: "119" }
];

const TEXT = {
  back: "뒤로",
  title: "혼자 견디지 않아도 돼요",
  lede: "지금 바로 연락할 수 있는 곳이에요.",
  nowTitle: "지금 위험하다면",
  talkTitle: "이야기할 곳",
  talkMissing: "연락처 목록을 열지 못했어요. 지금 위험하다면 위의 112나 119에 전화해 주세요.",
  call: "전화하기",
  sms: "문자 보내기",
  abroadFallback: "해외에 있다면 그 나라의 응급 번호로 연락해 주세요.",
  notService: "이 앱은 진단이나 위기 대응 서비스가 아니에요."
} as const;

interface Contact {
  number: string;
  name: string;
  help: string;
  mobile: string;
  hours: string;
  sms: string | null;
}

interface Resources {
  contacts: Contact[];
  abroad: string;
}

// ───────── 자원 읽기 — 모양이 틀린 것은 건너뛴다(화면이 죽지 않는다) ─────────

const NUMBER_PATTERN = /^\d[\d-]{1,14}$/;
const SMS_PATTERN = /^\d{2,6}$/;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const textOf = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

function readContact(value: unknown): Contact | null {
  if (!isRecord(value)) return null;
  const number = textOf(value.number);
  const name = textOf(value.name);
  if (!NUMBER_PATTERN.test(number) || name === "") return null;
  const sms = textOf(value.sms);
  return {
    number,
    name,
    help: textOf(value.help),
    mobile: textOf(value.mobile),
    hours: textOf(value.hours),
    sms: SMS_PATTERN.test(sms) ? sms : null
  };
}

function readContacts(value: unknown): Contact[] {
  return Array.isArray(value) ? value.flatMap((item) => readContact(item) ?? []) : [];
}

function readResources(raw: unknown): Resources {
  const root = isRecord(raw) ? raw : {};
  return {
    contacts: readContacts(root.contacts),
    abroad: textOf(root.abroad) || TEXT.abroadFallback
  };
}

// ───────── 말 만들기 ─────────

const telHref = (number: string): string => `tel:${number.replace(/\D/g, "")}`;

/** 숫자 뒤 조사: 끝자리를 읽은 소리가 받침 없음이거나 ㄹ이면 '로', 아니면 '으로'(109·1388·119 → 로, 0·3·6으로 끝나면 으로). */
const ro = (number: string): string => ("036".includes(number.slice(-1)) ? "으로" : "로");

// ───────── 화면 조각 ─────────

function backButton(): HTMLButtonElement {
  // ‹는 눈에만 보인다 — 화면 읽기 이름은 '뒤로'
  const button = h("button", { type: "button", class: "back-button" }, h("span", { "aria-hidden": "true", text: "‹" }), ` ${TEXT.back}`);
  button.addEventListener("click", () => back("#/today"));
  return button;
}

function emergencySection(): HTMLElement {
  const texting = EMERGENCY.flatMap((contact) => (contact.sms ? [contact.sms] : []));
  const lastSms = texting[texting.length - 1];
  return h(
    "section",
    { class: "help-section", "aria-labelledby": "help-now" },
    h("h2", { id: "help-now", text: TEXT.nowTitle }),
    h(
      "div",
      { class: "help-now-btns" },
      ...EMERGENCY.map((contact) =>
        h("a", {
          class: "btn btn-primary",
          href: telHref(contact.number),
          // 보이는 글("112 경찰")이 이름 안에 그대로 있어야 한다 — 음성으로 누르는 사람이 보이는 대로 말한다(WCAG 2.5.3, axe label-content-name-mismatch)
          "aria-label": `${contact.number} ${contact.name} 전화하기`,
          text: `${contact.number} ${contact.name}`
        })
      )
    ),
    lastSms ? h("p", { class: "help-sub", text: `말하기 어려우면 ${texting.join("·")}${ro(lastSms)} 문자를 보낼 수 있어요.` }) : null
  );
}

function contactRow(contact: Contact): HTMLElement {
  const actions = [
    h("a", { class: "btn btn-quiet", href: telHref(contact.number), "aria-label": `${contact.name} ${contact.number}에 전화하기`, text: TEXT.call })
  ];
  if (contact.sms) {
    actions.push(
      h("a", {
        class: "btn btn-quiet",
        href: `sms:${contact.sms}`,
        "aria-label": `${contact.name} ${contact.sms}${ro(contact.sms)} 문자 보내기`,
        text: TEXT.sms
      })
    );
  }
  return h(
    "li",
    { class: "help-row" },
    h(
      "div",
      { class: "help-info" },
      h("p", { class: "help-name" }, contact.name, h("span", { class: "help-num", text: contact.number })),
      contact.help ? h("p", { class: "help-text", text: contact.help }) : null,
      // 1388은 휴대전화로 걸 때 지역번호를 붙여야 한다(공식 안내)
      contact.mobile ? h("p", { class: "help-meta", text: contact.mobile }) : null,
      // 운영 시간은 자원 문장 그대로(시안 web/js/views/entry.js와 같다) — '야간·공휴일에는 …'처럼 시간이 아닌 안내도 있어 머리말을 붙이지 않는다
      contact.hours ? h("p", { class: "help-meta", text: contact.hours }) : null
    ),
    h("div", { class: "help-acts" }, ...actions)
  );
}

function talkSection(contacts: Contact[]): HTMLElement {
  return h(
    "section",
    { class: "help-section", "aria-labelledby": "help-talk" },
    h("h2", { id: "help-talk", text: TEXT.talkTitle }),
    // 연락처 목록이 비어도 위의 112·119는 그대로 남는다
    contacts.length > 0 ? h("ul", { class: "help-list" }, ...contacts.map(contactRow)) : h("p", { class: "help-sub", text: TEXT.talkMissing })
  );
}

function footer(resources: Resources): HTMLElement {
  return h("div", { class: "help-foot" }, ...[resources.abroad, TEXT.notService].map((line) => h("p", { text: line })));
}

/**
 * 연락처 자원(모양을 알 수 없는 값)으로 위기 안내 화면을 만든다. 시험이 자원 값을 바꿔 넣을 수 있도록 갈라 두었다.
 * 어떤 값이 와도 112·119는 보인다.
 */
export function createHelpView(resources: unknown): View {
  const data = readResources(resources);
  return ({ root }) => {
    root.append(
      h(
        "section",
        { class: "screen help-screen" },
        h("div", { class: "screen-top" }, backButton()),
        h("h1", { text: TEXT.title }),
        h("p", { class: "lede", text: TEXT.lede }),
        emergencySection(),
        talkSection(data.contacts),
        footer(data)
      )
    );
    return () => {};
  };
}

export const renderHelp: View = createHelpView(crisisResources);
