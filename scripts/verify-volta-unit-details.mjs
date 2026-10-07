import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});

await page.goto("http://localhost:3001/units/50", { waitUntil: "networkidle", timeout: 120_000 });
await page.waitForTimeout(3000);
if (!(await page.locator(".volta-unit-model canvas").count())) {
  console.log(JSON.stringify({ url: page.url(), tabs: await page.locator(".view-tabs button").allTextContents(), errors }, null, 2));
  await browser.close();
  process.exit(1);
}
await page.locator(".volta-unit-model canvas").waitFor({ state: "visible", timeout: 120_000 });
await page.locator(".model-state").waitFor({ state: "detached", timeout: 120_000 });
const modelTabs = await page.locator(".view-tabs button").allTextContents();
const modelCanvas = await page.locator(".volta-unit-model canvas").evaluate((canvas) => ({ width: canvas.width, height: canvas.height }));
await page.getByRole("button", { name: "Apartment plan" }).click();
const apartmentPlan = await page.locator('.unit-plan-view img[src$="/50.svg"]').isVisible();
await page.getByRole("button", { name: "Floor plan" }).click();
const floorPlan = await page.locator('.interactive-unit-floor-plan image[href$="/3.svg"]').isVisible();

await page.goto("http://localhost:3001/units/9", { waitUntil: "networkidle", timeout: 120_000 });
const noModelTabs = await page.locator(".view-tabs button").allTextContents();
const m9Plan = await page.locator('.unit-plan-view img[src$="/9.svg"]').isVisible();

const result = { modelTabs, modelCanvas, apartmentPlan, floorPlan, noModelTabs, m9Plan, errors };
console.log(JSON.stringify(result, null, 2));
await browser.close();

if (
  modelTabs.join("|") !== "3D vaade|Apartment plan|Floor plan" ||
  noModelTabs.join("|") !== "Apartment plan|Floor plan" ||
  !apartmentPlan ||
  !floorPlan ||
  !m9Plan ||
  errors.filter((error) => !error.includes("Minified React error #418") && !error.includes("ERR_NETWORK_ACCESS_DENIED")).length
)
  process.exit(1);
