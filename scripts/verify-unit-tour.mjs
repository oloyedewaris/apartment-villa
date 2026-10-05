import { chromium } from "playwright-core";

const baseUrl = process.env.BASE_URL || "http://localhost:3000";

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--enable-unsafe-swiftshader"],
});
const unitNumber = process.argv[2] || "61";

async function verify(viewport, output) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${baseUrl}/units/${unitNumber}`, { waitUntil: "networkidle", timeout: 120_000 });
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await page.getByRole("button", { name: "Virtual tour" }).waitFor({ timeout: 120_000 });
  await page.getByRole("button", { name: "Virtual tour" }).click();
  await page.waitForTimeout(700);
  const canvas = page.locator(".unit-model canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Unit model canvas is missing.");
  await page.screenshot({ path: output.replace(".png", "-entry.png") });
  let floorTarget = null;
  for (let yStep = 3; yStep <= 9 && !floorTarget; yStep += 1) {
    for (let xStep = 1; xStep <= 9; xStep += 1) {
      const x = box.x + (box.width * xStep) / 10;
      const y = box.y + (box.height * yStep) / 10;
      await page.mouse.move(x, y);
      if ((await canvas.evaluate((element) => element.style.cursor)) === "pointer") {
        floorTarget = { x, y };
        break;
      }
    }
  }
  if (floorTarget) {
    await page.screenshot({ path: output.replace(".png", "-floor-target.png") });
    await page.mouse.click(floorTarget.x, floorTarget.y);
    await page.waitForTimeout(1200);
  }
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.66, box.y + box.height * 0.43, { steps: 8 });
  await page.mouse.up();
  await page.keyboard.down("w");
  await page.waitForTimeout(450);
  await page.keyboard.up("w");
  await page.screenshot({ path: output });
  const result = {
    viewport,
    active: await page.locator(".unit-model.is-tour-active").count(),
    exitButton: await page.getByRole("button", { name: "Exit virtual tour" }).count(),
    movementButtons: await page.locator(".tour-movement button").count(),
    floorTargetFound: Boolean(floorTarget),
    floorTarget: floorTarget ? { x: Math.round(floorTarget.x - box.x), y: Math.round(floorTarget.y - box.y) } : null,
    canvas: { width: Math.round(box.width), height: Math.round(box.height) },
    errors,
  };
  await page.getByRole("button", { name: "Exit virtual tour" }).click();
  result.restored = await page.getByRole("button", { name: "Virtual tour" }).count();
  await page.close();
  return result;
}

const results = [
  await verify({ width: 1440, height: 900 }, `verify-unit-${unitNumber}-tour-desktop.png`),
  await verify({ width: 390, height: 844 }, `verify-unit-${unitNumber}-tour-mobile.png`),
];
console.log(JSON.stringify(results, null, 2));
await browser.close();
