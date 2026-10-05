import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.goto("http://localhost:3000/units/61", { waitUntil: "networkidle", timeout: 120_000 });
await page.getByRole("button", { name: "Virtual tour" }).click();
await page.waitForTimeout(600);
const canvas = page.locator(".unit-model canvas");
const box = await canvas.boundingBox();
if (!box) throw new Error("Unit model canvas is missing.");
const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
for (let angle = 0; angle < 8; angle += 1) {
  await page.screenshot({ path: `verify-tour-window-${angle}.png` });
  await page.mouse.move(center.x, center.y);
  await page.mouse.down();
  await page.mouse.move(center.x + 196, center.y, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(120);
}
await browser.close();
