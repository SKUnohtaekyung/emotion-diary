// 좁은 화면과 큰 글자(UX_SPEC §12): 360×640에서 화면을 200%로 키워도 가로 스크롤이 없고, 마음 이름이 잘리지 않으며,
// 크기의 −/+는 44px 아래로 줄지 않고 패널 밖으로 나가지 않는다. 확대는 문서에 zoom 2를 주어 흉내 낸다(Safari의 페이지 확대와 같은 효과).
import { expect, type Page, test } from "@playwright/test";
import { freshToday, next } from "./helpers";

async function zoom(page: Page): Promise<void> {
  await page.evaluate(() => document.documentElement.style.setProperty("zoom", "2"));
}

async function noSideScroll(page: Page, label: string): Promise<void> {
  const [scroll, client] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(scroll, `${label}: 가로 스크롤 ${scroll} > ${client}`).toBeLessThanOrEqual(client);
}

test("200% 확대·360×640: 가로 스크롤 없음, 이름이 잘리지 않음, −/+ 44px 이상·패널 안", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await freshToday(page);
  await zoom(page);
  await noSideScroll(page, "오늘");
  await page.getByRole("button", { name: "오늘의 마음 남기기" }).click();
  await zoom(page);
  await page.getByLabel("무슨 일이 있었나요?").fill("가짜 사건");
  await noSideScroll(page, "있었던 일");
  await next(page);
  await zoom(page);
  await page.getByRole("button", { name: "즐거움" }).click();
  await noSideScroll(page, "마음 고르기");
  const clipped = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>(".choice-feeling")).some((button) => {
      const name = button.querySelector(".choice-name")?.getBoundingClientRect();
      const box = button.getBoundingClientRect();
      return name !== undefined && (name.right > box.right + 0.5 || name.left < box.left - 0.5);
    })
  );
  expect(clipped).toBe(false);
  await next(page);
  await zoom(page);
  await page.locator(".choice-pill").first().click();
  await noSideScroll(page, "세부 감정");
  await next(page);
  await zoom(page);
  await noSideScroll(page, "크기");
  const steppers = await page.evaluate(() => {
    const panel = document.querySelector(".intensity-panel")?.getBoundingClientRect();
    return Array.from(document.querySelectorAll<HTMLElement>(".intensity-panel > .intensity .stepper")).map((node) => {
      const box = node.getBoundingClientRect();
      return { width: node.offsetWidth, inside: panel !== undefined && box.left >= panel.left && box.right <= panel.right };
    });
  });
  expect(steppers.length).toBe(2);
  for (const stepper of steppers) {
    expect(stepper.width).toBeGreaterThanOrEqual(44);
    expect(stepper.inside).toBe(true);
  }
});
