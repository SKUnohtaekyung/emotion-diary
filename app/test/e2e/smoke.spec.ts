// 도구 실측(PLAN 5-1): 실제 브라우저가 열쇠 화면으로 들어가 로그인 cookie로 세션을 이어 가는가.
import { expect, test } from "@playwright/test";
import { enterApp } from "./helpers";

test("열쇠로 들어가면 새로 고쳐도 오늘 화면에 머문다", async ({ page }) => {
  await enterApp(page);
  await page.reload();
  await expect(page.locator("section.today")).toBeVisible();
  const session = await page.evaluate(async () => (await fetch("/api/session", { cache: "no-store" })).json());
  expect(session.authenticated).toBe(true);
});
