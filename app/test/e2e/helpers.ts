// E2E 공용 도우미. 열쇠는 Git 제외 파일(app/scripts/make-secrets.mjs local all이 만든다)에서 읽고 어디에도 찍지 않는다.
// 시험 데이터는 모두 가짜 문장이다(AGENTS §3 — 실제 일기 금지).
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, type Page } from "@playwright/test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

export function accessKey(): string {
  return readFileSync(path.join(root, "work", "deploy", "local.PHONE-KEY.txt"), "utf8").trim();
}

/** 열쇠 화면에서 들어간다. 이름이 아직 없으면 이름을 정하고 반가워요를 지나 오늘 화면까지 간다. */
export async function enterApp(page: Page, name = "시험"): Promise<void> {
  await page.goto("/#/today");
  await expect(page.getByLabel("열쇠", { exact: true })).toBeVisible();
  await page.getByLabel("열쇠", { exact: true }).fill(accessKey());
  await page.getByRole("button", { name: "들어가기" }).click();
  const nameField = page.getByLabel("부를 이름");
  const today = page.locator("section.today");
  await expect(nameField.or(today).first()).toBeVisible();
  if (await nameField.isVisible()) {
    await nameField.fill(name);
    await page.getByRole("button", { name: "시작하기" }).click();
    await page.getByRole("button", { name: "오늘 시작하기" }).click();
  }
  await expect(today).toBeVisible();
}

/** 앞 시나리오가 남긴 오늘 기록·지난 임시저장을 서버 길(DELETE)로 지운다 — 시나리오마다 빈 오늘에서 시작한다. */
export async function clearDiaries(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    for (let round = 0; round < 10; round += 1) {
      const today = await (await fetch("/api/today", { headers: { "x-timezone": zone }, cache: "no-store" })).json();
      const target = today.entry ?? today.pastDraft;
      if (!target) return;
      await fetch(`/api/diaries/${target.entryDate}`, {
        method: "DELETE",
        headers: { "content-type": "application/json", "x-requested-with": "emotion-diary", "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({ revision: target.revision })
      });
    }
  });
  await page.evaluate(() => localStorage.removeItem("unsentDiaries"));
}

/** 들어가서 빈 오늘로 맞추고 오늘 화면을 다시 연다. */
export async function freshToday(page: Page): Promise<void> {
  await enterApp(page);
  await clearDiaries(page);
  await page.reload();
  await expect(page.getByRole("button", { name: "오늘의 마음 남기기" })).toBeVisible();
}

export async function next(page: Page): Promise<void> {
  await page.getByRole("button", { name: "다음", exact: true }).click();
}

/** 막힌 '다음'(aria-disabled — 초점은 받고 누르면 까닭을 알린다, D-098 ③). Playwright는 aria-disabled를 누르지 않으므로 force로. */
export async function nextBlocked(page: Page): Promise<void> {
  await page.getByRole("button", { name: "다음", exact: true }).click({ force: true });
}

/** 서버 기록을 그대로 읽는다(화면이 아니라 창고에 무엇이 있는지). */
export async function serverEntry(page: Page, date: string): Promise<Record<string, unknown> | null> {
  return page.evaluate(async (day) => {
    const response = await fetch(`/api/diaries/${day}`, { cache: "no-store" });
    return response.ok ? response.json() : null;
  }, date);
}

export async function todayDate(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return (await (await fetch("/api/today", { headers: { "x-timezone": zone }, cache: "no-store" })).json()).date as string;
  });
}

/** 오늘 새 글: 사건 → 마음 하나(첫 세부 감정) → 크기 5 → 이유 단계까지. 이유 칸 앞에서 멈춘다. */
export async function writeToReason(page: Page, category = "분노", event = "가짜 사건: 시험"): Promise<void> {
  await page.getByRole("button", { name: "오늘의 마음 남기기" }).click();
  await page.getByLabel("무슨 일이 있었나요?").fill(event);
  await next(page);
  await page.getByRole("button", { name: category, exact: true }).click();
  await next(page);
  await page.locator(".choice-pill").first().click();
  await next(page);
  await page.getByRole("button", { name: `${category} 크기 올리기` }).click();
  await next(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("이유");
}

/** 저장 상태 줄이 '저장됨'이 될 때까지(서버가 받았다). */
export async function waitSaved(page: Page): Promise<void> {
  await expect(page.locator(".save-status")).toHaveText(/^저장됨/, { timeout: 10_000 });
}
