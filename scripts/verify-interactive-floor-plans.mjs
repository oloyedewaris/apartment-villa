import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto(process.env.BASE_URL || "http://localhost:3001", { waitUntil: "domcontentloaded", timeout: 120_000 });
await page.locator(".result-row").first().waitFor({ state: "visible", timeout: 120_000 });
await page.getByRole("button", { name: "Floor plans" }).click();

const counts = [];
for (const floor of [1, 2, 3, 4]) {
  await page.locator(".project-floor-selector button", { hasText: String(floor) }).click();
  counts.push(await page.locator(".project-unit").count());
}

await page.locator(".project-floor-selector button", { hasText: "1" }).click();
const b4 = page.locator('.project-unit[data-unit="B4"]');
const initialFill = await b4.locator(".project-unit-shape").evaluate((element) => getComputedStyle(element).fill);
await b4.hover();
const hoverFill = await b4.locator(".project-unit-shape").evaluate((element) => getComputedStyle(element).fill);
const rowLinked = await page.locator('.result-row[data-number="4"]').evaluate((element) => element.classList.contains("hovered"));

await page.locator('.result-row[data-number="51"]').hover();
const planLinked = await page.locator('.project-unit[data-unit="B51"]').evaluate((element) => element.classList.contains("active"));

await page.locator(".project-floor-selector button", { hasText: "2" }).click();
await page.locator('.project-unit[data-unit="M9"]').hover();
const floorTwoLinked = await page.locator('.result-row[data-number="9"]').evaluate((element) => element.classList.contains("hovered"));

const result = { counts, initialFill, hoverFill, rowLinked, planLinked, floorTwoLinked };
console.log(JSON.stringify(result, null, 2));
await browser.close();

if (counts.join("|") !== "7|29|13|2" || initialFill === hoverFill || !rowLinked || !planLinked || !floorTwoLinked) process.exit(1);
