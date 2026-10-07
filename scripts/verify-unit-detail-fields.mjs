import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const baseUrl = process.env.BASE_URL || "http://localhost:3001";

await page.goto(`${baseUrl}/units/50`, { waitUntil: "domcontentloaded", timeout: 120_000 });
const labels = await page.locator(".unit-facts-reference dt").allTextContents();
const unit50 = await page.locator(".unit-facts-reference dd").allTextContents();

await page.goto(`${baseUrl}/units/9`, { waitUntil: "domcontentloaded", timeout: 120_000 });
const unit9 = await page.locator(".unit-facts-reference dd").allTextContents();

const result = { labels, unit50, unit9 };
console.log(JSON.stringify(result, null, 2));
await browser.close();

if (
  labels.join("|") !== "Floor|Rooms|Size|Terrace|Finishing|Ceiling height|Price" ||
  unit50.join("|") !== "3|3|66.9 m²|6,5 m²|Deluxe 4|up to 3.2 m|409 900 €" ||
  unit9.join("|") !== "2|2|48.4 m²|8,2 m²|Stuudio 1|-|274 900 €"
) {
  process.exit(1);
}
