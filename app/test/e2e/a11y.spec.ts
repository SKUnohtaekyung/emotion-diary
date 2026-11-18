// 자동 접근성 검사의 기준선(TASK-REFLECT-01 R-0, A-12): 지금 있는 화면에서 axe serious·critical 0.
// 새 화면(달력·통계·설정 목록)은 그 화면의 시험에 같은 검사를 붙인다.
import { expect, test } from "@playwright/test";
import { enterApp, expectNoSeriousA11y } from "./helpers";

test("오늘 화면과 위기 안내에 axe serious·critical 위반이 없다", async ({ page }) => {
  await enterApp(page);
  await expectNoSeriousA11y(page);
  await page.goto("/#/settings");
  await page.getByRole("button", { name: /도움이 필요할 때/ }).click();
  await expect(page).toHaveURL(/#\/help$/);
  await expectNoSeriousA11y(page);
});

test("열쇠 화면에 axe serious·critical 위반이 없다", async ({ page }) => {
  await page.goto("/#/today");
  await expect(page.getByLabel("열쇠", { exact: true })).toBeVisible();
  await expectNoSeriousA11y(page);
});
