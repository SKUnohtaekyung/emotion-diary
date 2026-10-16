// 작성 흐름 E2E(TASK-SLICE-01 PLAN §6). 실제 브라우저(WebKit·Chromium)와 로컬 서버(로컬 D1)로 끝까지 간다.
// 글은 모두 시험용 가짜 문장이다.
import { expect, test } from "@playwright/test";
import { freshToday, next, nextBlocked, serverEntry, todayDate, waitSaved } from "./helpers";

test.describe("⑤ 한 편 쓰고 남기고 다시 열기(F-03·F-04)", () => {
  test("사건 → 마음 둘 → 세부 감정 → 크기 → 이유 → 칭찬·감사 비움 → 편지 → 남기기 → 완료 → 기록 보기", async ({ page }) => {
    await freshToday(page);
    const date = await todayDate(page);
    await page.getByRole("button", { name: "오늘의 마음 남기기" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("오늘 있었던 일");
    // 비어 있으면 막는다(안내 한 줄)
    await nextBlocked(page);
    await expect(page.locator(".write-hint")).toHaveText("한 줄만 적어도 충분해요.");
    await page.getByLabel("무슨 일이 있었나요?").fill("가짜 사건: 오후에 산책을 했다");
    await next(page);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("오늘은 어떤 마음이 머물렀나요?");
    await page.getByRole("button", { name: "슬픔" }).click();
    await page.getByRole("button", { name: "기쁨" }).click();
    await expect(page.locator(".write-progress")).toHaveText("2 / 9");
    await next(page);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("슬픔 중에서 어떤 마음이었나요?");
    await expect(page.locator(".write-counter")).toHaveText("슬픔 · 1/2");
    await page.locator(".choice-pill").first().click();
    await next(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("기쁨 중에서 어떤 마음이었나요?");
    await page.locator(".choice-pill").nth(1).click();
    await next(page);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("얼마나 컸나요?");
    // 정하지 않은 채 다음 → 시트
    await nextBlocked(page);
    await expect(page.locator(".sheet")).toContainText("크기를 정하지 않은 마음이 있어요");
    await page.getByRole("button", { name: "정하러 가기" }).click();
    await page.getByRole("button", { name: "슬픔 크기 올리기" }).click();
    await page.getByRole("button", { name: "기쁨 크기 올리기" }).click();
    await page.getByRole("button", { name: "기쁨 크기 올리기" }).click();
    await expect(page.locator('.intensity-panel[data-category="sadness"] .intensity-number').first()).toHaveText("5");
    await expect(page.locator('.intensity-panel[data-category="joy"] .intensity-number').first()).toHaveText("6");
    await next(page);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("이유");
    await page.getByLabel("왜 이런 마음이 들었다고 느끼나요?").fill("가짜 이유: 오랜만에 걸어서");
    await next(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("칭찬");
    await next(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("감사");
    await next(page);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("이대로 남길까요?");
    await expect(page.locator(".letter")).toContainText("가짜 사건: 오후에 산책을 했다");
    await expect(page.locator(".letter")).not.toContainText("칭찬");
    await page.getByRole("button", { name: "남기기" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("오늘의 마음을 남겼어요");
    const saved = await serverEntry(page, date);
    expect(saved?.status).toBe("completed");
    expect(saved?.praises).toEqual([]);
    // 뒤로 밀어도 끝난 단계로 돌아가지 않는다(F-18)
    await page.goBack();
    await page.waitForTimeout(300);
    await expect(page).not.toHaveURL(/#\/write\//);
    await page.goto("/#/today");
    await page.getByRole("button", { name: "오늘의 기록 보기" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/의 편지$/);
    await expect(page.locator(".record-body")).toContainText("가짜 이유: 오랜만에 걸어서");
  });
});

test.describe("① 강제 새로고침 뒤 쓰던 단계·내용(F-24, e2e-reload-restore ①)", () => {
  test("이유를 쓰다 새로 고치면 이유 단계와 글이 돌아온다", async ({ page }) => {
    await freshToday(page);
    await page.getByRole("button", { name: "오늘의 마음 남기기" }).click();
    await page.getByLabel("무슨 일이 있었나요?").fill("가짜 사건: 새로고침 시험");
    await next(page);
    await page.getByRole("button", { name: "분노" }).click();
    await next(page);
    await page.locator(".choice-pill").first().click();
    await next(page);
    await page.getByRole("button", { name: "분노 크기 올리기" }).click();
    await next(page);
    await page.getByLabel("왜 이런 마음이 들었다고 느끼나요?").fill("가짜 이유: 줄이 길었다");
    await waitSaved(page);
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("이유");
    await expect(page.getByLabel("왜 이런 마음이 들었다고 느끼나요?")).toHaveValue("가짜 이유: 줄이 길었다");
    // 앞 단계도 그대로
    await page.getByRole("button", { name: "이전" }).click();
    await expect(page.locator('.intensity-panel[data-category="anger"] .intensity-number').first()).toHaveText("5");
  });
});
