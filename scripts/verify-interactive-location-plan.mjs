import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto(process.env.BASE_URL || "http://localhost:3001", { waitUntil: "domcontentloaded", timeout: 120_000 });
await page.locator(".result-row").first().waitFor({ state: "visible", timeout: 120_000 });
await page.getByRole("button", { name: "Location plan" }).click();

const buildings = page.locator(".location-building");
const buildingCount = await buildings.count();
const target = page.locator('.location-building[data-building="uus-volta-7-1"]');
const shape = target.locator("polygon");
const before = await shape.evaluate((element) => getComputedStyle(element).fillOpacity);
await target.hover();
await page.waitForTimeout(250);
const after = await shape.evaluate((element) => getComputedStyle(element).fillOpacity);
const tooltip = await page.locator(".location-building-tooltip").innerText();

await page.locator('.location-building[data-building="uus-volta-6-3"]').focus();
const keyboardTooltip = await page.locator(".location-building-tooltip").innerText();

const result = { buildingCount, before, after, tooltip, keyboardTooltip };
console.log(JSON.stringify(result, null, 2));
await browser.close();

if (buildingCount !== 11 || before === after || tooltip !== "Uus-Volta 7/1\n17 available" || keyboardTooltip !== "Uus-Volta 6/3\n25 available") {
  process.exit(1);
}
