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
  ["r6-내기준","lookback?lbs=some&lbx=active",1000],
  ["r6-내기준-처음","lookback?lbs=empty&lbx=none",740],
  ["r6-내기준-한장","lookback?lbs=one&lbx=none",740],
  ["r6-내기준-시트","lookback?lbs=some&lbx=none",740,"document.querySelector(\".lb-slip\").click()"],
  ["r6-읽기","lookback/read?p=7",740],
  ["r6-읽기-긴글","lookback/read?p=7&long=1",740],
  ["r6-읽기-긴글-전체","lookback/read?p=7&long=1",1500],
  ["r6-읽기-모아둠","lookback/read?p=7",740,"document.querySelector(\".lb-mark\").click()"],
  ["r6-읽기-끝","lookback/read?p=7&d=none",740,"(() => { const b = [...document.querySelectorAll('.step-footer .btn.primary')].pop(); for (let k = 0; k < 5; k++) [...document.querySelectorAll('.step-footer .btn.primary')].pop().click(); })()"],
  ["r6-목록","lookback/list",740],
  ["r6-목록-말로찾기","lookback/list",740,"document.querySelector(\".st-pill-link\").click()"],
  ["r6-목록-찾은뒤","lookback/list?w=약속",740],
  ["r6-기준쓰기","lookback/write",740],
  ["r6-기준쓰기-기록시트","lookback/write",740,"document.querySelector(\".lb-ref\").click()"],
  ["r6-실천-무엇을","lookback/try?lbx=none",740],
  ["r6-실천-예시","lookback/try?lbx=none",740,"document.querySelector(\".lb-example-btn\").click()"],
  ["r6-실천-며칠","lookback/try?lbx=none",740,"(() => { document.querySelector(\".lb-example-btn\").click(); document.querySelector(\".lb-sug\").click(); [...document.querySelectorAll('.step-footer .btn.primary')].pop().click(); })()"],
  ["r6-실천하는중","lookback/try?lbx=active",740],
  ["r6-실천-더보기","lookback/try?lbx=active",740,"document.querySelectorAll('.write-top .back')[1].click()"],
  ["r6-실천-끝","lookback/try?lbx=ended",740],
  ["r6-오늘","today?lbx=active",740],
  ["r6-오늘-시트","today?lbx=active",740,"document.querySelector(\".lb-yline a\").click()"],
  ["r6-완료-묻기","write?s=done&lbx=active",740],
  ["r6-달력","calendar",740],
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
