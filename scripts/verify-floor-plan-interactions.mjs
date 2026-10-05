import { chromium } from "playwright-core";

const baseUrl = process.env.BASE_URL || "http://localhost:3000";

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});

async function verifyPair(unitNumber) {
  const region = page.locator(`[data-plan-unit="${unitNumber}"]`);
  const label = page.locator(".plan-unit-label", { has: page.locator("strong", { hasText: new RegExp(`^${unitNumber}$`) }) });
  await region.hover();
  await page.waitForTimeout(200);
  if (!(await region.evaluate((element) => element.classList.contains("highlighted")))) {
    throw new Error(`Unit ${unitNumber} region was not highlighted`);
  }
  if (!(await label.evaluate((element) => element.classList.contains("active")))) {
    throw new Error(`Unit ${unitNumber} label was not highlighted from its region`);
  }

  await label.hover();
  await page.waitForTimeout(200);
  if (!(await region.evaluate((element) => element.classList.contains("highlighted")))) {
    throw new Error(`Unit ${unitNumber} region was not highlighted from its label`);
  }
}

await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
await page.getByRole("button", { name: "Floor plans" }).click();
await page.getByRole("button", { name: "Floor 4" }).click();
await page.waitForTimeout(1_000);
if (!(await page.locator(".interactive-plan-svg").count())) {
  throw new Error(`Homepage SVG did not render: ${errors.join(" | ")}`);
}
await page.locator(".interactive-plan-svg").waitFor();
if (!(await page.locator('[data-plan-unit="9"]').count())) {
  const geometry = await page.locator(".interactive-plan-svg").evaluate((svg) => {
    const box = (element) => {
      const value = element.getBBox();
      return [value.x, value.y, value.width, value.height];
    };
    return {
      drawing: box(svg.querySelector('[id="_9"]')),
      shapes: Array.from(svg.querySelectorAll('g[id^="bg_"] > *')).map((shape) => [shape.id, ...box(shape)]),
    };
  });
  throw new Error(
    `Floor 4 regions missing: ${JSON.stringify(geometry)} ${errors.join(" | ")} ${await page.locator(".plan-unit-regions").evaluate((element) => element.outerHTML)}`,
  );
}
await verifyPair("9");
await page.screenshot({ path: "verify-home-floor-plan-hover.png", fullPage: true });

await page.getByRole("button", { name: "Tower B" }).click();
await page.getByRole("button", { name: "Floor 9" }).click();
await page.locator('[data-plan-unit="121"]').waitFor();
await verifyPair("121");
await page.screenshot({ path: "verify-home-floor-plan-tower-b-hover.png", fullPage: true });

await page.goto(`${baseUrl}/units/61`, { waitUntil: "domcontentloaded", timeout: 120_000 });
await page.getByRole("button", { name: "Plan", exact: true }).click();
await page.locator(".interactive-plan-svg").waitFor();
await verifyPair("61");
await page.screenshot({ path: "verify-unit-floor-plan-hover.png", fullPage: true });

if (errors.length) throw new Error(errors.join("\n"));
await browser.close();
console.log("Homepage and unit floor-plan hover pairs verified.");
