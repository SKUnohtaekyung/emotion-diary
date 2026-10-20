// 도움이 필요할 때(위기 안내) `#/help` — 실제 브라우저에서 오늘 화면의 버튼으로 들어가 ‹로 돌아온다
// (TASK-PERSONAL-01 A-1~A-4, EVAL_PLAN §14 crisis-help-unreviewed-label). 전화 링크는 누르지 않고 주소만 본다.
import { expect, test } from "@playwright/test";
import { enterApp } from "./helpers";

test("도움이 필요할 때 → 위기 안내(검토 전·112 전화 링크, 가로 스크롤 없음) → ‹ 뒤로 → 오늘", async ({ page }) => {
  await enterApp(page);
  await page.getByRole("button", { name: "도움이 필요할 때" }).click();

  await expect(page).toHaveURL(/#\/help$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("혼자 견디지 않아도 돼요");
  await expect(page.getByText("검토 전", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "112 경찰에 전화하기" })).toHaveAttribute("href", "tel:112");
  await expect(page.getByRole("link", { name: "119 구급에 전화하기" })).toHaveAttribute("href", "tel:119");
  await expect(page.getByRole("link", { name: "청소년상담 1388로 문자 보내기" })).toHaveAttribute("href", "sms:1388");
  await expect(page.getByText("이 앱은 진단이나 위기 대응 서비스가 아니에요.")).toBeVisible();

  // 가장 좁은 폭(360)에서 옆으로 밀리지 않는다
  // 스크롤은 #app이 맡는다(D-125) — 문서와 #app 둘 다 본다
  const [scroll, client, appScroll, appClient] = await page.evaluate(() => {
    const app = document.getElementById("app") as HTMLElement;
    return [document.documentElement.scrollWidth, document.documentElement.clientWidth, app.scrollWidth, app.clientWidth];
  });
  expect(scroll, `가로 스크롤 ${scroll} > ${client}`).toBeLessThanOrEqual(client);
  expect(appScroll, `#app 가로 넘침 ${appScroll} > ${appClient}`).toBeLessThanOrEqual(appClient);

  await page.getByRole("button", { name: "뒤로" }).click();
  await expect(page).toHaveURL(/#\/today$/);
  await expect(page.locator("section.today")).toBeVisible();
});
