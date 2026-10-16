// 끊김·닫힘·로그인 풀림·충돌에서 글을 잃지 않는가(TASK-SLICE-01 PLAN §6 — e2e-reload-restore ②③, F-22, F-09, F-05).
// 글은 모두 시험용 가짜 문장이다.
import { expect, test } from "@playwright/test";
import { accessKey, enterApp, freshToday, next, serverEntry, todayDate, waitSaved, writeToReason } from "./helpers";

const reasonField = "왜 이런 마음이 들었다고 느끼나요?";

test("② 연결을 끊은 채 쓰고 → 연결이 돌아오면 저장되고, 새로 열어도 남아 있다", async ({ page, context }) => {
  await freshToday(page);
  const date = await todayDate(page);
  await writeToReason(page);
  await waitSaved(page);
  await context.setOffline(true);
  await page.getByLabel(reasonField).fill("가짜 이유: 지하철에서 쓴 글");
  await expect(page.locator(".save-status")).toHaveText("아직 저장 안 됨 · 연결되면 저장해요", { timeout: 10_000 });
  await context.setOffline(false);
  await waitSaved(page);
  expect((await serverEntry(page, date))?.reasonText).toBe("가짜 이유: 지하철에서 쓴 글");
  await page.reload();
  await expect(page.getByLabel(reasonField)).toHaveValue("가짜 이유: 지하철에서 쓴 글");
});

test("③ 연결을 끊은 채 쓰고 화면을 닫았다가 새로 열면 이 휴대폰의 사본에서 되살려 저장한다(U-2)", async ({ page, context }) => {
  await freshToday(page);
  const date = await todayDate(page);
  await writeToReason(page);
  await waitSaved(page);
  await context.setOffline(true);
  await page.getByLabel(reasonField).fill("가짜 이유: 닫기 전에 쓴 글");
  await expect(page.locator(".save-status")).toHaveText("아직 저장 안 됨 · 연결되면 저장해요", { timeout: 10_000 });
  const url = page.url();
  await page.close();
  await context.setOffline(false);
  const reopened = await context.newPage();
  await reopened.goto(url);
  await expect(reopened.getByLabel(reasonField)).toHaveValue("가짜 이유: 닫기 전에 쓴 글");
  await expect(reopened.locator(".save-status")).toHaveText(/^저장됨/, { timeout: 10_000 });
  expect((await serverEntry(reopened, date))?.reasonText).toBe("가짜 이유: 닫기 전에 쓴 글");
  expect(await reopened.evaluate(() => localStorage.getItem("unsentDiaries"))).toBeNull();
});

test("④ 쓰는 중에 로그인이 풀려도 글을 잃지 않고, 다시 들어오면 같은 글로 돌아와 저장한다(F-22)", async ({ page, context }) => {
  await freshToday(page);
  const date = await todayDate(page);
  await writeToReason(page);
  await waitSaved(page);
  // 같은 기기의 다른 탭에서 로그아웃 — 이 탭의 로그인 cookie도 풀린다
  const other = await context.newPage();
  await other.goto("/#/today");
  await other.evaluate(() => fetch("/api/session", { method: "DELETE", headers: { "x-requested-with": "emotion-diary" } }));
  await other.close();
  await page.getByLabel(reasonField).fill("가짜 이유: 로그인이 풀린 사이 쓴 글");
  await expect(page.locator(".sheet")).toContainText("다시 들어와야 해요", { timeout: 10_000 });
  await page.getByRole("button", { name: "다시 들어가기" }).click();
  await page.getByLabel("열쇠", { exact: true }).fill(accessKey());
  await page.getByRole("button", { name: "들어가기" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("이유");
  await expect(page.getByLabel(reasonField)).toHaveValue("가짜 이유: 로그인이 풀린 사이 쓴 글");
  await waitSaved(page);
  expect((await serverEntry(page, date))?.reasonText).toBe("가짜 이유: 로그인이 풀린 사이 쓴 글");
});

test("⑦ 다른 곳에서 고친 글을 조용히 덮지 않고 묻는다(F-09 화면 쪽)", async ({ page, browser }) => {
  await freshToday(page);
  const date = await todayDate(page);
  await writeToReason(page);
  await page.getByLabel(reasonField).fill("가짜 이유: 이 휴대폰");
  await waitSaved(page);
  // 다른 기기(따로 로그인한 브라우저)에서 같은 글을 고친다
  const elsewhere = await browser.newContext({ ignoreHTTPSErrors: true });
  const other = await elsewhere.newPage();
  await enterApp(other);
  await other.goto(`/#/write/${date}?step=reason`);
  await other.getByLabel(reasonField).fill("가짜 이유: 다른 기기");
  await expect(other.locator(".save-status")).toHaveText(/^저장됨/, { timeout: 10_000 });
  await elsewhere.close();
  // 이 휴대폰에서 이어 쓰면 판 번호가 맞지 않는다 → 덮지 않고 묻는다
  await page.getByLabel(reasonField).fill("가짜 이유: 이 휴대폰에서 더 씀");
  await expect(page.locator(".sheet")).toContainText("다른 곳에서 고친 내용이 있어요", { timeout: 10_000 });
  await expect(page.locator(".sheet")).toContainText("이유");
  expect((await serverEntry(page, date))?.reasonText).toBe("가짜 이유: 다른 기기");
  await page.getByRole("button", { name: "다른 곳의 글로 바꾸기" }).click();
  await expect(page.getByLabel(reasonField)).toHaveValue("가짜 이유: 다른 기기");
});

test("⑥ 마음 셋·서로 다른 크기·따로 정한 크기가 저장·새로 열기·고치기를 지나도 보존된다(F-05)", async ({ page }) => {
  await freshToday(page);
  const date = await todayDate(page);
  await page.getByRole("button", { name: "오늘의 마음 남기기" }).click();
  await page.getByLabel("무슨 일이 있었나요?").fill("가짜 사건: 여러 마음");
  await next(page);
  for (const name of ["슬픔", "사랑", "공포"]) await page.getByRole("button", { name, exact: true }).click();
  await next(page);
  await page.locator(".choice-pill").nth(0).click();
  await page.locator(".choice-pill").nth(1).click();
  await next(page);
  await page.locator(".choice-pill").nth(0).click();
  await next(page);
  await page.locator(".choice-pill").nth(0).click();
  await next(page);
  // 대표 크기: 슬픔 4, 사랑 7, 공포 2
  const set = async (name: string, ups: number, downs: number) => {
    for (let i = 0; i < ups; i += 1) await page.getByRole("button", { name: `${name} 크기 올리기` }).click();
    for (let i = 0; i < downs; i += 1) await page.getByRole("button", { name: `${name} 크기 낮추기` }).click();
  };
  // 정하기 전에서 −/+는 가운데 5부터다(시안 slider.js와 같다)
  await set("슬픔", 0, 2);
  await set("사랑", 3, 0);
  await set("공포", 0, 4);
  // 슬픔의 둘째 세부 감정만 따로 9
  await page.locator('.intensity-panel[data-category="sadness"]').getByRole("button", { name: "세부 감정도 크기를 정하고 싶어요" }).click();
  const secondSad = page.locator('.intensity-panel[data-category="sadness"] .own-row').nth(1);
  for (let i = 0; i < 5; i += 1) await secondSad.getByRole("button", { name: /크기 올리기$/ }).click();
  await waitSaved(page);
  await page.reload();
  await expect(page.locator('.intensity-panel[data-category="love"] .intensity-number').first()).toHaveText("7");
  const saved = (await serverEntry(page, date)) as { categories: { categoryCode: string; intensity: number }[]; emotions: { intensity: number; custom: boolean }[] };
  expect(saved.categories.map((item) => [item.categoryCode, item.intensity])).toEqual([
    ["sadness", 4],
    ["love", 7],
    ["fear", 2]
  ]);
  expect(saved.emotions.map((item) => [item.intensity, item.custom])).toEqual([
    [4, false],
    [9, true],
    [7, false],
    [2, false]
  ]);
  await next(page);
  await page.getByLabel(reasonField).fill("가짜 이유");
  for (let i = 0; i < 3; i += 1) await next(page);
  await page.getByRole("button", { name: "남기기" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("오늘의 마음을 남겼어요");

  // 고치기: 사랑의 크기를 3으로, 슬픔의 첫 세부 감정을 뺀다
  await page.getByRole("button", { name: "오늘의 기록 보기" }).click();
  await page.getByRole("button", { name: "슬픔 고치기" }).click();
  await expect(page.locator(".write-banner")).toHaveText("완료된 기록을 수정 중이에요");
  await page.locator(".choice-pill[aria-pressed=true]").first().click();
  await page.getByRole("button", { name: "편지로 돌아가기" }).click();
  // 고치는 중에는 어느 단계든 오른쪽 버튼이 '편지로 돌아가기'다 — 크기는 편지에서 '이전'으로 걸어 간다
  for (let i = 0; i < 4; i += 1) await page.getByRole("button", { name: "이전" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("얼마나 컸나요?");
  await set("사랑", 0, 4);
  await page.getByRole("button", { name: "편지로 돌아가기" }).click();
  await page.getByRole("button", { name: "저장하기" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/의 편지$/);
  const edited = (await serverEntry(page, date)) as {
    status: string;
    categories: { categoryCode: string; intensity: number }[];
    emotions: { intensity: number; custom: boolean }[];
  };
  expect(edited.status).toBe("completed");
  expect(edited.categories.map((item) => [item.categoryCode, item.intensity])).toEqual([
    ["sadness", 4],
    ["love", 3],
    ["fear", 2]
  ]);
  expect(edited.emotions.map((item) => [item.intensity, item.custom])).toEqual([
    [9, true],
    [3, false],
    [2, false]
  ]);
});
