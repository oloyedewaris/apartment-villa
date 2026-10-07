import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const results = [];

for (const sample of [
  { number: "4", label: "B4", floor: "1", count: 7 },
  { number: "9", label: "M9", floor: "2", count: 29 },
  { number: "41", label: "41", floor: "3", count: 13 },
]) {
  await page.goto(`${process.env.BASE_URL || "http://localhost:3001"}/units/${sample.number}`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await page.getByRole("button", { name: "Floor plan" }).click();
  const selected = page.locator(`.project-unit[data-unit="${sample.label}"]`);
  await selected.waitFor({ state: "visible" });
  const current = await selected.getAttribute("aria-current");
  const active = await selected.evaluate((element) => element.classList.contains("active"));
  const asset = await page.locator(".interactive-unit-floor-plan image").getAttribute("href");
  const count = await page.locator(".interactive-unit-floor-plan .project-unit").count();
  const neighbor = page.locator(".interactive-unit-floor-plan .project-unit").filter({ hasNot: selected }).first();
  await neighbor.hover();
  const selectedAfterNeighborHover = await selected.evaluate((element) => element.classList.contains("active"));
  const neighborActive = await neighbor.evaluate((element) => element.classList.contains("active"));
  results.push({ sample, current, active, asset, count, selectedAfterNeighborHover, neighborActive });
}

console.log(JSON.stringify(results, null, 2));
await browser.close();

if (
  results.some(
    ({ sample, current, active, asset, count, selectedAfterNeighborHover, neighborActive }) =>
      current !== "true" || !active || asset !== `/volta-uus-7/floor-plans/${sample.floor}.svg` || count !== sample.count || selectedAfterNeighborHover || !neighborActive,
  )
) {
  process.exit(1);
}
