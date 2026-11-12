// 시안 화면을 헤드리스 Chrome으로 찍는다(360×740 기준). 미리보기 서버(node scripts/web-preview.mjs 4174)가 떠 있어야 한다.
// 사용: node tasks/lookback/2026-11-12/capture.mjs [이름에 들어간 글자] [--scale=2] [--w=360]
// 결과: outputs/lookback-sian/<이름>.png (커밋하지 않는 자리). 긴 화면은 높이를 늘려 한 장으로 찍는다.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const args = process.argv.slice(2);
const opt = (k, d) => Number((args.find((a) => a.startsWith(`--${k}=`)) ?? `=${d}`).split("=")[1]);
const filter = args.find((a) => !a.startsWith("--")) ?? "";
const scale = opt("scale", 1), width = opt("w", 360), port = opt("port", 4174);
const out = path.resolve("outputs/lookback-sian"); fs.mkdirSync(out, { recursive: true });
const DEBUG_PORT = 9347;
const CLICK = (sel) => `document.querySelector(${JSON.stringify(sel)})?.click()`; // 찍기 전에 눌러 둘 것(시트 열기 등)

// [이름, 주소(# 뒤), 높이]
export const SHOTS = [
  ["r4-한눈에","lookback?lbx=active",1500],
  ["r4-한눈에-처음","lookback?lbs=few&lbx=none",1100],
  ["r4-7일-첫장","lookback/read?p=7",740],
  ["r4-7일-모아둠","lookback/read?p=7",740,"document.querySelector(\".lb-page:nth-child(2) .lb-mark\").click()"],
  ["r4-7일-끝장","lookback/read?p=7",740,"document.querySelector('.lb-pager').scrollTo(99999,0)"],
  ["r4-30일","lookback/read?p=30",740],
  ["r4-30일-펼침","lookback/read?p=30",1100,"document.querySelector(\".lb-day-head\").click()"],
  ["r4-30일-말고름","lookback/read?p=30",740,"document.querySelector(\".lb-again-pill\").click()"],
  ["r4-30일-끝","lookback/read?p=30",740,"window.scrollTo(0, 99999)"],
  ["r4-기준-1","lookback/note?lbs=one",740],
  ["r4-기준-2", "lookback/note?lbs=two", 740],
  ["r4-기준-5","lookback/note?lbs=some",1000],
  ["r4-기준-20","lookback/note?lbs=many",2000],
  ["r4-기준-빈","lookback/note?lbs=empty",740],
  ["r4-기준-순서바꾸기","lookback/note?lbs=some",1000,"document.querySelector(\".lb-edit-toggle\").click()"],
  ["r4-기준-끌어옮김","lookback/note?lbs=some",1000,"(() => { document.querySelector(\".lb-edit-toggle\").click(); const lis = document.querySelectorAll(\".lb-slips.grid li\"); const a = lis[0].getBoundingClientRect(), b = lis[3].getBoundingClientRect();\n  const ev = (t, x, y) => new PointerEvent(t, { bubbles: true, clientX: x, clientY: y, pointerId: 1 });\n  lis[0].firstChild.dispatchEvent(ev(\"pointerdown\", a.left + 20, a.top + 20)); const ul = document.querySelector(\".lb-slips.grid\");\n  ul.dispatchEvent(ev(\"pointermove\", b.left + 30, b.top + 30)); ul.dispatchEvent(ev(\"pointermove\", b.left + 40, b.top + 40)); ul.dispatchEvent(ev(\"pointerup\", b.left + 40, b.top + 40)); })()"],
  ["r4-기준-시트","lookback/note?lbs=some&lbx=none",740,"document.querySelector(\".lb-slip\").click()"],
  ["r4-한줄적기","lookback/write",740],
  ["r4-살아보기-정하기","lookback/try?lbx=none",1250],
  ["r4-살아보기-문장에서","lookback/try?lbx=none&from=1",1250],
  ["r4-살아보기-채움","lookback/try?lbx=none&from=1",740,"document.querySelector(\".lb-sug\").click()"],
  ["r4-살아보기-직접","lookback/try?lbx=none",740,"document.querySelectorAll('.st-pill')[4].click()"],
  ["r4-살아보는중","lookback/try?lbx=active",1300],
  ["r4-끝","lookback/try?lbx=ended",1500],
  ["r4-오늘","today?lbx=active",740],
  ["r4-오늘-시트","today?lbx=active",740,"document.querySelector(\".lb-yline a\").click()"],
  ["r4-오늘-끝","today?lbx=ended",740],
  ["r4-완료-묻기","write?s=done&lbx=active",740],
  ["r4-완료-전하기","write?s=done&lbx=none&lbt=joy",740],
  ["r4-통계","stats",740],
  ["r4-달력","calendar",740],
  ["9-검토페이지","/review-lookback.html",1500,"document.querySelectorAll('h2')[0].scrollIntoView()"]
];

// 헤드리스 Chrome을 띄워 원격 디버깅(CDP)으로 휴대폰 크기를 흉내 낸다 — 창 크기만 줄이면 Windows의 Chrome은 500px 아래로 내려가지 않는다.
// 움직임 줄이기를 켜고 찍는다(연출이 끝난 모습이 바로 나온다).
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function main() {
  const picked = SHOTS.filter(([name]) => name.includes(filter));
  const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${path.join(out, ".chrome")}`, "about:blank"], { stdio: "ignore" });
  try {
    let target;
    for (let i = 0; i < 40 && !target; i += 1) { await sleep(250); try { target = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: "PUT" })).json(); } catch { /* 아직 안 떴다 */ } }
    if (!target) throw new Error("Chrome 원격 디버깅에 붙지 못했다");
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    let seq = 0; const waiting = new Map(); const errors = [];
    ws.onmessage = (ev) => { const m = JSON.parse(ev.data);
      if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m.result ?? m.error); waiting.delete(m.id); }
      if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
      if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push(m.params.args.map((a) => a.value ?? a.description).join(" ")); };
    const send = (method, params = {}) => new Promise((r) => { const id = (seq += 1); waiting.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
    await send("Page.enable"); await send("Runtime.enable");
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    for (const [name, hash, height, js] of picked) {
      errors.length = 0;
      await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: scale, mobile: true });
      const whole = hash.startsWith("/"); // "/review-lookback.html"처럼 /로 시작하면 시안 본체가 아니라 그 파일을 연다(검토 페이지)
      await send("Page.navigate", { url: whole ? `http://localhost:${port}${hash}` : `http://localhost:${port}/?shot=${encodeURIComponent(name)}#/${hash}` });
      await sleep(whole ? 6000 : 1300);
      if (js) { await send("Runtime.evaluate", { expression: js, awaitPromise: true }); await sleep(500); }
      const shot = await send("Page.captureScreenshot", { format: "png" });
      const file = path.join(out, `${name}${width === 360 ? "" : `-w${width}`}.png`);
      fs.writeFileSync(file, Buffer.from(shot.data, "base64"));
      console.log(path.relative(process.cwd(), file), errors.length ? `콘솔 오류 ${errors.length}건: ${errors[0]}` : "");
    }
    ws.close();
  } finally { chrome.kill(); }
}
if (process.argv[1]?.endsWith("capture.mjs")) await main();
