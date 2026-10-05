import { chromium } from "playwright-core";

const baseUrl = process.env.BASE_URL || "http://localhost:3000";

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

await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 120_000 });
await Promise.race([
  page.locator(".building-loading").waitFor({ state: "detached", timeout: 120_000 }),
  page.getByText("The building model could not be loaded.").waitFor({ state: "visible", timeout: 120_000 }),
]);
if (
  await page
    .getByText("The building model could not be loaded.")
    .isVisible()
    .catch(() => false)
) {
  console.log(JSON.stringify({ errors }, null, 2));
  await browser.close();
  process.exit(1);
}
await page.screenshot({ path: "verify-model.png" });
const modelCanvas = await page.locator(".building-viewer canvas").count();
const canvas = page.locator(".building-viewer canvas");
const soldUnitRow = page.locator('.result-row[data-number="134"]');
if ((await soldUnitRow.getAttribute("aria-disabled")) !== "true") {
  throw new Error("The sold unit row is not marked as unavailable for navigation.");
}
const viewBeforeListHover = await canvas.screenshot();
await soldUnitRow.hover();
await page.waitForTimeout(700);
await page.getByRole("button", { name: "Floor plans" }).hover();
await page.waitForTimeout(100);
const cameraViewChanged = !viewBeforeListHover.equals(await canvas.screenshot());
if (!cameraViewChanged) throw new Error("The building camera did not focus the unit hovered in the results list.");
await soldUnitRow.dispatchEvent("click");
if (new URL(page.url()).pathname !== "/") throw new Error("The sold unit row unexpectedly navigated away from the homepage.");
const scrollState = await page.evaluate(() => ({
  page: document.scrollingElement?.scrollTop || 0,
  list: document.querySelector(".result-rows")?.scrollTop || 0,
  listHeight: document.querySelector(".result-rows")?.clientHeight || 0,
  listContentHeight: document.querySelector(".result-rows")?.scrollHeight || 0,
}));
await page.getByRole("button", { name: "Floor plans" }).click();
await page.locator(".interactive-plan-svg").waitFor({ state: "visible" });
await page.screenshot({ path: "verify-plans.png" });

console.log(
  JSON.stringify(
    {
      resultCount: await page.locator(".result-row").count(),
      modelCanvas,
      cameraViewChanged,
      floorLabels: await page.locator(".plan-unit-label").count(),
      scrollState,
      errors,
    },
    null,
    2,
  ),
);
await browser.close();
