// 달력(TASK-REFLECT-01 R-3) — 실제 브라우저에서 오늘 한 편을 남긴 뒤 달력의 오늘 칸 → 작은 편지 → 편지 열기 → '달력으로'로 돌아온다.
// 하단 탐색이 달력에서만 보이고, axe serious·critical 0, 가로로 밀리지 않는다. 시험 글은 가짜 문장이다.
import { expect, test } from "@playwright/test";
import { expectNoSeriousA11y, freshToday } from "./helpers";

test("오늘 한 편 → 달력 오늘 칸 → 작은 편지 → 편지 열기 → 달력으로", async ({ page }) => {
  await freshToday(page);
  // 오늘 한 편을 서버 길로 남긴다(작성 흐름 자체는 write.spec.ts가 본다)
  const today = await page.evaluate(async () => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const headers = { "content-type": "application/json", "x-requested-with": "emotion-diary", "x-timezone": zone };
    const info = await (await fetch("/api/today", { headers: { "x-timezone": zone } })).json();
    const body = {
      eventText: "가짜 사건 — 달력 시험",
      reasonText: "가짜 이유",
      categories: [{ categoryCode: "joy", intensity: 7 }],
      emotions: [{ emotionCode: "joy-touching" }],
      praises: [],
      gratitudes: [],
      resume: { step: "letter" }
    };
    const saved = await fetch(`/api/diaries/${info.date}`, { method: "PUT", headers: { ...headers, "idempotency-key": crypto.randomUUID() }, body: JSON.stringify(body) });
    if (saved.status !== 201) throw new Error(`save ${saved.status} ${await saved.text()}`);
    const done = await fetch(`/api/diaries/${info.date}/complete`, { method: "POST", headers: { ...headers, "idempotency-key": crypto.randomUUID() }, body: JSON.stringify({ revision: 1 }) });
    if (done.status !== 200) throw new Error(`complete ${done.status}`);
    return info.date as string;
  });

  await page.goto("/#/calendar");
  await expect(page.locator(".cal")).toBeVisible();
  await expect(page.locator("#bottom-nav")).toBeVisible();
  await expect(page.locator('#bottom-nav a[aria-current="page"]')).toHaveAttribute("data-tab", "calendar");
  const cell = page.locator(`.day[data-iso="${today}"]`);
  await expect(cell).toHaveClass(/completed/);
  await expect(cell).toHaveClass(/today/);
  await expectNoSeriousA11y(page);

  await cell.click();
  await expect(page).toHaveURL(new RegExp(`#/calendar\\?m=\\d{4}-\\d{2}&d=${today}$`));
  await expect(page.locator(".ml-name").first()).toHaveText("기쁨");
  await expect(page.locator(".ml-size b").first()).toHaveText("7");
  await expectNoSeriousA11y(page);

  const [scroll, client] = await page.evaluate(() => {
    const app = document.getElementById("app") as HTMLElement;
    return [app.scrollWidth, app.clientWidth];
  });
  expect(scroll, `#app 가로 넘침 ${scroll} > ${client}`).toBeLessThanOrEqual(client);

  await page.getByRole("button", { name: "편지 열기", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`#/record/${today}\\?from=calendar$`));
  await expect(page.locator("#bottom-nav")).toBeHidden();
  await page.getByRole("button", { name: "‹ 달력으로" }).click();
  await expect(page).toHaveURL(new RegExp(`#/calendar\\?m=\\d{4}-\\d{2}&d=${today}$`));
  await expect(page.locator(".ml-name").first()).toHaveText("기쁨");

  // 뒤로 가기 = 날짜 닫기(처음 고를 때 쌓은 한 칸)
  await page.goBack();
  await expect(page.locator(".cal-pv-hint")).toBeVisible();
});
