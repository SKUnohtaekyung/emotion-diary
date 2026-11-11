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
  ["0-기존-완료", "write?s=done&lb=1c&lbt=0", 740], ["0-기존-오늘", "today?lb=6c", 740], ["0-기존-달력", "calendar?lb=2c", 740], ["0-기존-통계상세", "stats/sadness?lb=2b", 1500], ["0-기존-설정", "settings", 740],
  ["1a-전하기-늘보임", "write?s=done&lb=1a", 740], ["1b-전하기-쪽지", "write?s=done&lb=1b", 740], ["1c-전하기-가끔-나오는날", "write?s=done&lb=1c", 740], ["1c-전하기-가끔-안나오는날", "write?s=done&lb=1c&lbt=0", 740],
  ["2a-돌아보기-날짜순", "lookback?lb=2a.3b", 740], ["2a-돌아보기-날짜순-전체", "lookback?lb=2a.3b", 2700], ["2a-입구-달력", "calendar?lb=2a", 740],
  ["2b-돌아보기-마음별", "lookback?lb=2b.3b&p=30", 740], ["2b-돌아보기-마음별-전체", "lookback?lb=2b.3b&p=30", 3600],
  ["2c-통계상세-이어읽기", "stats/sadness?lb=2c.3b", 2900], ["2-입구-통계아래", "stats?lb=2a", 1900],
  ["2-빈-0편", "lookback?lb=2a&lbs=empty", 740], ["2-적음-2편", "lookback?lb=2a.3b&lbs=few", 1500],
  ["3a-읽던자리-끝", "lookback?lb=2a.3a", 2700], ["3b-모아서-끝", "lookback?lb=2a.3b", 2700], ["3c-노트에서-끝", "lookback?lb=2a.3c", 2700],
  ["3b-기준적기", "lookback/write?lb=3b", 1400], ["3c-기준적기", "lookback/write?lb=3c", 740], ["3c-기준노트-표시모음", "lookback/note?lb=3c.4b", 900], ["3-기준적기-자판", "lookback/write?lb=3c&kb=1", 740],
  ["4a-기준-한줄", "lookback/note?lb=4a.3b", 740], ["4b-기준-묶음", "lookback/note?lb=4b.3b", 740], ["4c-기준-쪽지", "lookback/note?lb=4c.3b", 900],
  ["4a-기준-많음", "lookback/note?lb=4a.3b&lbs=many", 1700], ["4b-기준-많음", "lookback/note?lb=4b.3b&lbs=many", 2600], ["4c-기준-많음", "lookback/note?lb=4c.3b&lbs=many", 3600], ["4-기준-빈", "lookback/note?lb=4b.3b&lbs=empty", 740],
  ["5a-실험-예시에서", "lookback/try?lb=5a&lbx=none", 900], ["5b-실험-기준에서", "lookback/try?lb=5b&lbx=none", 1000], ["5c-실험-직접", "lookback/try?lb=5c&lbx=none", 740],
  ["5-실험-진행중", "lookback/try?lbx=active", 1500], ["5-실험-끝", "lookback/try?lbx=ended", 2200],
  ["6a-오늘-표식", "today?lb=6a&lbx=active", 740], ["6a-오늘-표식-끝남", "today?lb=6a&lbx=ended", 740], ["6b-오늘-팻말", "today?lb=6b&lbx=active", 740], ["6b-오늘-팻말-끝남", "today?lb=6b&lbx=ended", 740], ["6c-오늘-없음", "today?lb=6c&lbx=active", 740],
  ["9-검토페이지", "/review-lookback.html", 1500, "document.querySelectorAll('h2')[0].scrollIntoView()"] // --w=1240 로 찍는다
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
