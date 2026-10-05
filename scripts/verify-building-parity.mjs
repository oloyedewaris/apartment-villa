import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--enable-unsafe-swiftshader"],
});

async function capture(url, output, loadingSelector) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url, { waitUntil: "networkidle", timeout: 120_000 });
  await page.locator(loadingSelector).waitFor({ state: "detached", timeout: 120_000 });
  await page.waitForTimeout(500);
  const canvas = page.locator("canvas").first();
  await canvas.screenshot({ path: output });
  const box = await canvas.boundingBox();
  await page.close();
  return { url, box, errors };
}

const results = [
  await capture("http://127.0.0.1:8080", "verify-building-original.png", ".loading"),
  await capture("http://localhost:3000", "verify-building-next.png", ".building-loading"),
];
console.log(JSON.stringify(results, null, 2));
await browser.close();
