import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});

async function verify(viewport, output) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("http://localhost:3000/units/12", {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  const tabNames = await page.locator(".view-tabs button").allTextContents();
  const expectedTabs = ["3D", "Interior", "Plan", "Floor plan"];
  if (JSON.stringify(tabNames) !== JSON.stringify(expectedTabs)) {
    throw new Error(`Unexpected tab order: ${tabNames.join(", ")}`);
  }

  await page.getByRole("button", { name: "Plan", exact: true }).click();
  const image = page.locator(".unit-plan-view img");
  await image.waitFor();
  await image.evaluate((element) => element.decode());
  const dimensions = await image.evaluate((element) => ({
    naturalWidth: element.naturalWidth,
    naturalHeight: element.naturalHeight,
    renderedWidth: element.getBoundingClientRect().width,
    renderedHeight: element.getBoundingClientRect().height,
  }));
  if (!dimensions.naturalWidth || !dimensions.naturalHeight || !dimensions.renderedWidth || !dimensions.renderedHeight) {
    throw new Error(`Unit plan did not render: ${JSON.stringify(dimensions)}`);
  }
  await page.screenshot({ path: output, fullPage: true });

  await page.getByRole("button", { name: "Floor plan", exact: true }).click();
  await page.locator(".interactive-plan-svg").waitFor();
  if (errors.length) throw new Error(errors.join("\n"));
  await page.close();
}

await verify({ width: 1440, height: 900 }, "verify-unit-plan-desktop.png");
await verify({ width: 390, height: 844 }, "verify-unit-plan-mobile.png");
await browser.close();
console.log("Unit plan and floor-plan tabs verified on desktop and mobile.");
