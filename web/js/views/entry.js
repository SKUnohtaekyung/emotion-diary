// 진입 화면 중 도움이 필요할 때(위기 안내). 하단 탐색이 없는 풀스크린이고 설정에서만 들어온다(D-093 — 온보딩의 안내 링크는 뺐다).
// 온보딩은 welcome.js(D-092 장면 이야기)다. 위기 안내는 친구·감정 색·움직임이 없다. 제목 '지금 안전이 먼저예요'는 두지 않는다(D-065).
// 연락처는 화면에 적지 않고 versioned resource(data/crisis-resources/kr.json, SAFETY_POLICY §6 ③·D-094)에서 읽는다 — AI 경로 위기 전환도 같은 파일을 쓴다.
// 가장 눈에 띄는 동작은 '떠나기'가 아니라 '연락하기'다: 줄마다 전화(와 문자) 버튼, 큰 '돌아가기' 버튼은 없고 위 ‹만 둔다(D-094).
import { el, svgEl } from "../dom.js";

const backBtn = (navigate, to) => el("button", { type: "button", class: "back", "aria-label": "이전 화면", onclick: () => navigate(to) },
  svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d: "M14.5 5.5 8 12l6.5 6.5" })));
const ic = (d) => svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, svgEl("path", { d }));
const PHONE = "M6.6 3.8h2.6l1.4 3.6-1.8 1.2a11 11 0 0 0 4.6 4.6l1.2-1.8 3.6 1.4v2.6a1.8 1.8 0 0 1-1.9 1.8A14.6 14.6 0 0 1 4.8 5.7 1.8 1.8 0 0 1 6.6 3.8z";
const SMS = "M4.5 6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2H10l-4 3.2V16a2 2 0 0 1-1.5-2z";
const tel = (n) => `tel:${n.replace(/[^0-9]/g, "")}`;
// 누르면 바로 전화가 걸린다. 버튼 이름에 기관과 번호를 넣어 화면 읽기에서도 어디에 거는지 알 수 있게 한다.
const callBtn = (c) => el("a", { class: "hp-call", href: tel(c.number), "aria-label": `${c.name} ${c.number}에 전화하기` }, ic(PHONE), "전화");
// 숫자 뒤 조사: 끝자리를 읽은 소리에 받침이 없거나 ㄹ이면 '로', 아니면 '으로'(109·1388·119 → 로, 0·3·6으로 끝나면 으로)
const ro = (n) => ("0 3 6".includes(String(n).slice(-1)) ? "으로" : "로");
const smsBtn = (c) => el("a", { class: "hp-call soft", href: `sms:${c.sms}`, "aria-label": `${c.name} ${c.sms}${ro(c.sms)} 문자 보내기` }, ic(SMS), "문자");

// 가장 급한 112·119는 파일을 기다리지 않고 먼저 그린다(마감 검토 2026-09-25 — 불러오는 동안·실패 때 누를 전화가 없었다).
// 번호가 바뀌지 않는 전국 공통 긴급번호라 여기 두고, 자원 파일(kr.json emergency)을 읽으면 그 값으로 다시 그린다.
const EMERGENCY = [{ number: "112", name: "경찰", sms: null }, { number: "119", name: "구급", sms: "119" }];
function nowSection(list) {
  const texting = list.filter((c) => c.sms).map((c) => c.sms);
  return el("section", { class: "hp-now", "aria-labelledby": "hpNow" },
    el("h2", { id: "hpNow", text: "지금 위험하다면" }),
    el("div", { class: "hp-now-btns" }, list.map((c) => el("a", { class: "hp-call big", href: tel(c.number), "aria-label": `${c.number} ${c.name}에 전화하기` }, ic(PHONE), `${c.number} ${c.name}`))),
    texting.length ? el("p", { class: "hp-sub", text: `말하기 어려우면 ${texting.join("·")}${ro(texting[texting.length - 1])} 문자를 보낼 수 있어요.` }) : null);
}

let cache = null;
const loadContacts = () => (cache ??= fetch("/data/crisis-resources/kr.json").then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); }).catch((e) => { cache = null; throw e; }));

export function renderHelp(main, navigate) {
  const now = nowSection(EMERGENCY);
  const rest = el("div", { class: "hp-rest", "aria-busy": "true" });
  main.replaceChildren(el("div", { class: "screen help" },
    el("div", { class: "info-top" }, backBtn(navigate, "settings")),
    el("h1", { tabindex: "-1", text: "혼자 견디지 않아도 돼요" }),
    el("p", { class: "lede", text: "지금 바로 연락할 수 있는 곳이에요." }),
    el("div", { class: "hp-body" }, now, rest)));

  loadContacts().then((res) => {
    if (!rest.isConnected) return;
    const d = new Date(`${res.checked}T12:00`);
    now.replaceWith(nowSection(res.emergency));
    rest.replaceChildren(
      el("section", { class: "hp-talk", "aria-labelledby": "hpTalk" },
        el("h2", { id: "hpTalk", text: "이야기할 곳" }),
        el("ul", { class: "hp-list" }, res.contacts.map((c) => el("li", { class: "hp-row" },
          el("div", { class: "hp-info" },
            el("p", { class: "hp-name" }, c.name, el("span", { class: "hp-num", text: c.number })),
            el("p", { class: "hp-help", text: c.help }),
            c.mobile ? el("p", { class: "hp-hours", text: c.mobile }) : null, // 1388은 휴대전화에서 지역번호를 붙여야 한다(공식 안내)
            el("p", { class: "hp-hours", text: c.hours })),
          el("div", { class: "hp-acts" }, callBtn(c), c.sms ? smsBtn(c) : null))))),
      el("p", { class: "caption hp-foot" }, res.abroad, el("br"), `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 각 기관의 공식 안내로 확인했어요. 이 앱은 진단이나 위기 대응 서비스가 아니에요.`));
    rest.removeAttribute("aria-busy");
  }).catch(() => {
    if (!rest.isConnected) return;
    // 연락처 파일을 읽지 못해도 위의 112·119 버튼은 그대로 남는다
    rest.replaceChildren(el("p", { class: "hp-sub", role: "alert", text: "다른 연락처를 불러오지 못했어요. 지금 위험하다면 위의 112나 119에 전화해 주세요." }));
    rest.removeAttribute("aria-busy");
  });
}
