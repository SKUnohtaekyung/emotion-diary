// 설정 목록과 하단 탐색(TASK-REFLECT-01 R-5) — 달력에서 하단 탐색으로 통계·설정을 오가고, 설정 줄로 하위 화면에 갔다 ‹로 돌아온다. axe 0.
import { expect, test } from "@playwright/test";
import { enterApp, expectNoSeriousA11y } from "./helpers";

test("하단 탐색: 달력 → 통계 → 설정 → 앱 잠금 → 뒤로 → 오늘(탐색 없음)", async ({ page }) => {
  await enterApp(page);
  // 오늘에서 달력으로는 날짜 줄의 '지난 기록' 알약(D-090 ③, 아래 줄은 걷었다 — TASK-JOURNAL-01 A-10)
  await page.getByRole("link", { name: "지난 기록" }).click();
  // 달력은 보이는 달을 주소에 둔다(?m=) — 그리기 직후에 붙는다
  await expect(page).toHaveURL(/#\/calendar(\?m=\d{4}-\d{2})?$/);
  const nav = page.getByRole("navigation", { name: "주요 화면" });
  await nav.getByRole("link", { name: "통계" }).click();
  await expect(page).toHaveURL(/#\/stats$/);
  await expect(nav.locator('a[aria-current="page"]')).toHaveAttribute("data-tab", "stats");
  await nav.getByRole("link", { name: "설정" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("설정");
  await expectNoSeriousA11y(page);

  await page.getByRole("button", { name: /^앱 잠금 (켜짐|꺼짐)$/ }).click();
  await expect(page).toHaveURL(/#\/settings\/lock$/);
  await expect(nav).toBeHidden();
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("설정");

  await nav.getByRole("link", { name: "오늘" }).click();
  await expect(page.locator("section.today")).toBeVisible();
  await expect(nav).toBeHidden();
});
