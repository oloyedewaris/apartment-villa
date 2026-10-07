import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const svgResponses = new Set();
page.on("response", (response) => {
  if (/\.svg(?:\?|$)/i.test(response.url())) svgResponses.add(response.url());
});
await page.goto("https://endover.ee/volta/en/houses/uus-volta-7/", { waitUntil: "domcontentloaded", timeout: 120_000 });
await page.locator("#CybotCookiebotDialog").evaluateAll((elements) => elements.forEach((element) => element.remove()));
await page.locator('a[href="#tab-house-floorplans"]').evaluate((element) => element.click());
await page.waitForTimeout(1200);

const floorTab = page.locator("#tab-house-floorplans");
const plans = await floorTab.locator("svg").evaluateAll((containers) =>
  containers.map((container) => ({
    classes: container.className,
    htmlStart: container.innerHTML.slice(0, 1500),
    descendants: [...container.querySelectorAll("a, g, path, polygon")]
      .map((element) => ({
        tag: element.tagName,
        id: element.id,
        class: element.getAttribute("class"),
        href: element.getAttribute("href") || element.getAttribute("xlink:href"),
        data: Object.fromEntries(
          [...element.attributes].filter((attribute) => attribute.name.startsWith("data-")).map((attribute) => [attribute.name, attribute.value]),
        ),
      }))
      .filter((entry) => entry.id || entry.class || entry.href || Object.keys(entry.data).length)
      .slice(0, 150),
  })),
);

const interactive = floorTab.locator("svg:visible a, svg:visible [data-apartment], svg:visible [data-unit], svg:visible [data-id]");
const count = await interactive.count();
const hoverSamples = [];
for (let index = 0; index < Math.min(count, 8); index += 1) {
  const element = interactive.nth(index);
  const before = await element.evaluate((node) => ({
    text: node.textContent?.replace(/\s+/g, " ").trim(),
    html: node.outerHTML.slice(0, 500),
    fill: getComputedStyle(node).fill,
    childFills: [...node.querySelectorAll("path, polygon")].slice(0, 5).map((child) => getComputedStyle(child).fill),
  }));
  await element.hover({ force: true });
  await page.waitForTimeout(100);
  const after = await element.evaluate((node) => ({
    fill: getComputedStyle(node).fill,
    childFills: [...node.querySelectorAll("path, polygon")].slice(0, 5).map((child) => getComputedStyle(child).fill),
  }));
  hoverSamples.push({ before, after });
}

const shapeData = await floorTab.locator("svg").evaluateAll((svgs) => {
  const floors = {};
  for (const svg of svgs) {
    const overlayGroup = svg.querySelector('g[id$="_overlay"]');
    if (overlayGroup) {
      const floor = overlayGroup.id.match(/\d+/)?.[0];
      if (floor && !floors[floor]?.shapes) {
        floors[floor] = floors[floor] || {};
        floors[floor].viewBox = svg.getAttribute("viewBox");
        floors[floor].shapes = [...overlayGroup.querySelectorAll("[data-id], [data-name]")].map((shape) => ({
          unit: shape.getAttribute("data-id") || shape.getAttribute("data-name"),
          tag: shape.tagName.toLowerCase(),
          className: shape.getAttribute("class"),
          points: shape.getAttribute("points"),
          x: shape.getAttribute("x"),
          y: shape.getAttribute("y"),
          width: shape.getAttribute("width"),
          height: shape.getAttribute("height"),
          d: shape.getAttribute("d"),
        }));
      }
    }
    const labelGroup = svg.querySelector('g[id*="labels"]');
    if (labelGroup) {
      const floor = labelGroup.id.match(/\d+/)?.[0];
      if (floor && !floors[floor]?.labels) {
        floors[floor] = floors[floor] || {};
        floors[floor].labels = [...labelGroup.querySelectorAll("g.floorplan__label")].map((label) => {
          const rect = label.querySelector("rect");
          return {
            unit: label.getAttribute("data-name"),
            x: rect ? Number(rect.getAttribute("x")) + Number(rect.getAttribute("width")) / 2 : null,
            y: rect ? Number(rect.getAttribute("y")) + Number(rect.getAttribute("height")) / 2 : null,
          };
        });
      }
    }
  }
  return floors;
});

console.log(
  JSON.stringify(
    process.env.SHAPES_ONLY
      ? shapeData
      : process.env.URLS_ONLY
        ? { svgResponses: [...svgResponses] }
        : { svgResponses: [...svgResponses], plans, interactiveCount: count, hoverSamples },
    null,
    2,
  ),
);
await browser.close();
