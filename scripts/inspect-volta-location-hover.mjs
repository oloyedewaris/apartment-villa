import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const assets = new Set();
page.on("response", (response) => {
  if (/\.(svg|png|jpe?g|webp)(?:\?|$)/i.test(response.url())) assets.add(response.url());
});

await page.goto("https://endover.ee/volta/en/houses/uus-volta-7/", { waitUntil: "domcontentloaded", timeout: 120_000 });
await page.locator("#CybotCookiebotDialog").evaluateAll((elements) => elements.forEach((element) => element.remove()));
await page.locator('a[href="#tab-house-houseplans"]').evaluate((element) => element.click());
await page.waitForTimeout(1200);

const tab = page.locator("#tab-house-houseplans");
const structure = await tab.evaluate((root) => ({
  htmlStart: root.innerHTML.slice(0, 2500),
  images: [...root.querySelectorAll("img")].map((image) => ({ src: image.currentSrc || image.src, className: image.className })),
  svgs: [...root.querySelectorAll("svg")].map((svg) => ({
    className: svg.getAttribute("class"),
    viewBox: svg.getAttribute("viewBox"),
    descendants: [...svg.querySelectorAll("[data-id], [data-name], [class]")]
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        className: element.getAttribute("class"),
        dataId: element.getAttribute("data-id"),
        dataName: element.getAttribute("data-name"),
        points: element.getAttribute("points"),
        d: element.getAttribute("d"),
        x: element.getAttribute("x"),
        y: element.getAttribute("y"),
        width: element.getAttribute("width"),
        height: element.getAttribute("height"),
      }))
      .filter((entry) => entry.dataId || entry.dataName || /overlay|label|house|building|plan/i.test(entry.className || "")),
  })),
}));

const candidates = tab.locator("svg:visible .plan__house");
const hover = [];
for (let index = 0; index < Math.min(await candidates.count(), 20); index += 1) {
  const candidate = candidates.nth(index);
  if (!(await candidate.isVisible())) continue;
  const before = await candidate.evaluate((element) => ({
    html: element.outerHTML.slice(0, 700),
    attributes: Object.fromEntries([...element.attributes].map((attribute) => [attribute.name, attribute.value])),
    fill: getComputedStyle(element).fill,
    opacity: getComputedStyle(element).opacity,
    className: element.getAttribute("class"),
  }));
  await candidate.hover({ force: true });
  await page.waitForTimeout(250);
  const after = await candidate.evaluate((element) => ({
    fill: getComputedStyle(element).fill,
    opacity: getComputedStyle(element).opacity,
    className: element.getAttribute("class"),
  }));
  const tooltips = await page.locator(".tooltipster-base:visible").allTextContents();
  hover.push({ before, after, tooltips });
}

console.log(JSON.stringify(process.env.HOUSES_ONLY ? { hover } : { structure, hover, assets: [...assets] }, null, 2));
await browser.close();
