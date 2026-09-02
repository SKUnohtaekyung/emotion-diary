import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

let inputText = "";
for await (const chunk of process.stdin) inputText += chunk;

let stopHookActive = false;
try {
  if (inputText.trim()) stopHookActive = JSON.parse(inputText).stop_hook_active === true;
} catch {
  // A malformed hook payload must not create an infinite stop loop.
  stopHookActive = true;
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const verifyPath = path.join(scriptDir, "verify.mjs");
const result = spawnSync(process.execPath, [verifyPath, "--mode", "quick"], {
  cwd: path.resolve(scriptDir, ".."),
  encoding: "utf8"
});

if (result.status === 0) process.exit(0);

const details = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
if (details) process.stderr.write(`${details}\n`);

if (stopHookActive) {
  process.stderr.write("Quick verification is still failing after one Stop-hook continuation. Allowing stop to prevent an infinite loop; report the failure explicitly.\n");
  process.exit(0);
}

process.stderr.write("Quick verification failed. Fix the reported problems before completing the turn.\n");
process.exit(2);

