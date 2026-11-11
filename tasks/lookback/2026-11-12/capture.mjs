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
  ["r2-돌아보기","lookback",740],
  ["r2-돌아보기-끝","lookback",740,"document.querySelector(\".lb-end\").scrollIntoView()"],
  ["r2-돌아보기-나온말","lookback",740,"document.querySelector(\".lb-again-pill\").click()"],
  ["r2-기준-1장","lookback/note?lbs=one",740],
  ["r2-기준-3장","lookback/note?lbs=normal",860],
  ["r2-기준-5장","lookback/note?lbs=some",900],
  ["r2-기준-20장","lookback/note?lbs=many",1500],
  ["r2-기준-빈","lookback/note?lbs=empty",740],
  ["r2-기준-시트","lookback/note?lbs=normal",740,"document.querySelector(\".lb-slip\").click()"],
  ["r2-한줄적기","lookback/write",740],
  ["r2-한줄적기-자판","lookback/write?kb=1",740],
  ["r2-길-정하기","lookback/try?lbx=none",980],
  ["r2-길-정하기-채움","lookback/try?lbx=none",740,"document.querySelector(\".lb-fill-pill\").click()"],
  ["r2-길-걷는중","lookback/try?lbx=active",1500],
  ["r2-길-끝","lookback/try?lbx=ended",2300],
  ["r2-오늘-팻말","today?lbx=active",740],
  ["r2-오늘-팻말-끝","today?lbx=ended",740],
  ["r2-완료-길묻기","write?s=done&lbx=active",740],
  ["r2-완료-전하기-감사","write?s=done&lbx=none&lbt=thanks",740],
  ["r2-완료-전하기-기쁨","write?s=done&lbx=none&lbt=joy",740],
  ["r2-완료-전하기-큰마음","write?s=done&lbx=none&lbt=big",740],
  ["r2-완료-안나옴","write?s=done&lbx=none&lbt=none",740],
  ["r2-통계아래","stats?lbx=active",740,"document.querySelector(\".lb-stats-rows\").scrollIntoView()"],
  ["r2-달력입구","calendar",740],
  ["9-검토페이지","/review-lookback.html",1500,"document.querySelectorAll(\"h2\")[0].scrollIntoView()"]
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
