import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

await page.goto(process.env.BASE_URL || "http://localhost:3000", { waitUntil: "networkidle", timeout: 120_000 });
await page.locator(".building-loading").waitFor({ state: "detached", timeout: 120_000 });
const canvas = page.locator(".building-viewer canvas");
const beforeHover = await canvas.screenshot();
await page.locator('.result-row[data-number="40"]').hover();
await page.waitForTimeout(700);
const hoverChangedModel = !beforeHover.equals(await canvas.screenshot());
const result = {
  rows: await page.locator(".result-row").count(),
  canvas: await canvas.evaluate((element) => ({ width: element.width, height: element.height })),
  hoverChangedModel,
  errors,
};
console.log(JSON.stringify(result, null, 2));
await browser.close();

const actionableErrors = errors.filter((error) => !error.includes("Minified React error #418"));
if (result.rows !== 50 || !result.hoverChangedModel || actionableErrors.length) process.exit(1);
