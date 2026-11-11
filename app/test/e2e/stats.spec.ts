// 통계(TASK-REFLECT-01 R-4) — 실제 브라우저에서 첫 화면·친구 상세, 하단 탐색(첫 화면에만), axe serious·critical 0, 가로로 밀리지 않음.
// 기록 하나(오늘)로는 '기록이 더 필요해요'를 본다. 합성 기록으로 채운 화면은 로컬 백업 토큰(work/deploy/local.BACKUP-TOKEN.txt — Git 제외,
// make-secrets.mjs local backup)이 있을 때만 본다 — 지난 날은 백업 다시 넣기로만 넣을 수 있다. CI는 첫 시험만 돈다.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, type Page, test } from "@playwright/test";
import { syntheticDiaries } from "../../scripts/synthetic.mjs";
import { enterApp, expectNoSeriousA11y, freshToday, todayDate } from "./helpers";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const tokenFile = path.join(root, "work", "deploy", "local.BACKUP-TOKEN.txt");

/**
 * 모든 기록 지우기(서버 길) — 이 파일의 시험은 같은 로컬 창고를 나눠 쓰므로 앞뒤로 비운다(합성 기록이 다른 시험에 남지 않게).
 * 지우기는 부를 이름도 지우므로(D-112 ⑩) 시험 이름을 다시 정한다 — 로그인은 그대로다.
 */
async function clearAll(page: Page): Promise<void> {
  const statuses = await page.evaluate(async () => {
    const headers = { "content-type": "application/json", "x-requested-with": "emotion-diary" };
    const wiped = await fetch("/api/diaries", { method: "DELETE", headers, body: JSON.stringify({ confirm: "모든 기록 삭제" }) });
    const named = await fetch("/api/settings/profile", { method: "PUT", headers, body: JSON.stringify({ name: "시험" }) });
    return [wiped.status, named.status];
  });
  expect(statuses[0]).toBe(200);
  expect(statuses[1]).toBeLessThan(300);
}

async function noSideScroll(page: Page): Promise<void> {
  const [scroll, client] = await page.evaluate(() => {
    const app = document.getElementById("app") as HTMLElement;
    return [app.scrollWidth, app.clientWidth];
  });
  expect(scroll, `#app 가로 넘침 ${scroll} > ${client}`).toBeLessThanOrEqual(client);
}

test("기록이 적으면 '기록이 더 필요해요' 하나 — 첫 화면에 하단 탐색, 친구 상세에는 없다", async ({ page }) => {
  await freshToday(page);
  await clearAll(page);
  await page.goto("/#/stats");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("통계");
  await expect(page.locator(".sx-empty .sx-headline")).toHaveText("기록이 더 필요해요");
  await expect(page.locator('#bottom-nav a[aria-current="page"]')).toHaveAttribute("data-tab", "stats");
  await expectNoSeriousA11y(page);
  await noSideScroll(page);

  await page.goto("/#/stats/joy?p=7");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("나래");
  await expect(page.locator("#bottom-nav")).toBeHidden();
  await expectNoSeriousA11y(page);
  await page.getByRole("button", { name: "통계로" }).click();
  await expect(page).toHaveURL(/#\/stats\?p=7$/);
});

test("합성 기록으로 채운 첫 화면 → 친구 상세 → 고른 날의 편지 열기 → 통계로(로컬 백업 토큰이 있을 때만)", async ({ page }) => {
  test.skip(!existsSync(tokenFile), "로컬 백업 토큰이 없다(CI) — make-secrets.mjs local backup");
  await enterApp(page);
  await clearAll(page);
  const today = await todayDate(page);
  const token = readFileSync(tokenFile, "utf8").trim();
  const diaries = syntheticDiaries(today, 60, { seed: 21 });
  const imported = await page.evaluate(
    async ({ body, bearer }) => (await fetch("/api/backup/import", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${bearer}` }, body: JSON.stringify(body) })).status,
    { body: { diaries }, bearer: token }
  );
  expect(imported).toBe(200);

  await page.goto("/#/stats?p=30");
  await expect(page.locator(".sx-trk").first()).toBeVisible();
  await expect(page.locator(".sx-pillrow .sx-pill").first()).toBeVisible();
  await expectNoSeriousA11y(page);
  await noSideScroll(page);

  await page.locator(".sx-trk a").first().click();
  await expect(page).toHaveURL(/#\/stats\/[a-z]+\?p=30$/);
  await expect(page.locator(".sxd-mg")).toBeVisible();
  await expect(page.locator(".sxd-peek")).toBeVisible();
  await expectNoSeriousA11y(page);
  await noSideScroll(page);

  await page.locator(".sxd-peek-open").click();
  await expect(page).toHaveURL(/#\/record\/\d{4}-\d{2}-\d{2}\?from=stats&cat=[a-z]+&p=30$/);
  await page.getByRole("button", { name: "‹ 통계로" }).click();
  await expect(page).toHaveURL(/#\/stats\/[a-z]+\?p=30$/);
  await clearAll(page);
});
