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
const modelCanvas = (await canvas.count()) > 0;
let hoverChangedModel = false;
if (modelCanvas) {
  const beforeHover = await canvas.screenshot();
  await page.locator('.result-row[data-number="40"]').hover();
  await page.waitForTimeout(700);
  hoverChangedModel = !beforeHover.equals(await canvas.screenshot());
}
const tabs = await page.locator(".home-view-tabs button").allTextContents();
await page.getByRole("button", { name: "Floor plans" }).click();
const floors = [];
for (const floor of [1, 2, 3, 4]) {
  await page.locator(`.project-floor-selector button`, { hasText: String(floor) }).click();
  floors.push(await page.locator(`.interactive-project-plan image[href$="/${floor}.svg"]`).isVisible());
}
await page.getByRole("button", { name: "Location plan" }).click();
const locationPlan = await page.locator('.interactive-location-plan image[href$="/location-plan.png"]').isVisible();
const result = {
  rows: await page.locator(".result-row").count(),
  modelCanvas,
  hoverChangedModel,
  tabs,
  floors,
  locationPlan,
  errors,
};
console.log(JSON.stringify(result, null, 2));
await browser.close();

const actionableErrors = errors.filter((error) => !error.includes("Minified React error #418"));
if (
  result.rows !== 50 ||
  tabs.join("|") !== "3D model|Floor plans|Location plan" ||
  floors.some((visible) => !visible) ||
  !locationPlan ||
  actionableErrors.length
)
  process.exit(1);
