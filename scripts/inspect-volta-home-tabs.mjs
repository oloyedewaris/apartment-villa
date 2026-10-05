import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const assets = new Set();
page.on("response", (response) => {
  if (/\.(svg|png|jpg|jpeg|webp)(\?|$)/i.test(response.url())) assets.add(response.url());
});

await page.goto("https://endover.ee/volta/en/houses/uus-volta-7/", { waitUntil: "networkidle", timeout: 120_000 });
await page.locator("#CybotCookiebotDialog").evaluateAll((elements) => elements.forEach((element) => element.remove()));
const floorplanControls = await page.getByText(/^floorplans$/i).evaluateAll((elements) => elements.map((element) => element.outerHTML));
const tabs = await page
  .locator(".tabs__nav-link, [role='tab'], button, a")
  .evaluateAll((elements) =>
    elements
      .map((element) => ({ text: element.textContent?.replace(/\s+/g, " ").trim(), href: element.getAttribute("href"), classes: element.className }))
      .filter((item) => /3d model|floor plans?|location plan/i.test(item.text || "")),
  );

const states = [];
for (const label of ["Floor plans", "Location plan"]) {
  const pattern = label === "Floor plans" ? /^floor\s*plans$/i : /^location plan$/i;
  const control = label === "Floor plans" ? page.locator('a[href="#tab-house-floorplans"]') : page.locator('a[href="#tab-house-houseplans"]');
  if (await control.count()) {
    await control.evaluate((element) => element.click());
    await page.waitForTimeout(800);
    if (label === "Location plan") {
      await page.locator(".plan__wrap:visible").screenshot({ path: "public/volta-uus-7/location-plan.png" });
    }
    states.push({
      label,
      images: await page
        .locator("img:visible")
        .evaluateAll((images) =>
          images.map((image) => ({ src: image.currentSrc || image.getAttribute("src"), alt: image.getAttribute("alt"), classes: image.className })),
        ),
      svgs: await page
        .locator("svg:visible")
        .evaluateAll((elements) =>
          elements.map((element) => ({ classes: element.getAttribute("class"), viewBox: element.getAttribute("viewBox"), text: element.textContent?.trim() })),
        ),
      text: await page.locator("body").innerText(),
    });
  }
}

const largeInlineSvgs = await page.locator('svg[viewBox="0 0 1570.315318 761.83186"]').evaluateAll((elements) => elements.map((element) => element.outerHTML));
const locationAncestors = await page.locator('svg[viewBox="0 0 1570.315318 761.83186"]').evaluateAll((elements) =>
  elements.map((element) => {
    const ancestors = [];
    let current = element;
    while (current && ancestors.length < 6) {
      ancestors.push({ tag: current.tagName, id: current.id, classes: current.getAttribute("class") });
      current = current.parentElement;
    }
    return ancestors;
  }),
);
console.log(JSON.stringify({ tabs, floorplanControls, locationAncestors, largeInlineSvgs, states, assets: [...assets] }, null, 2));
await browser.close();
