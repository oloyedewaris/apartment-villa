import { chromium } from "playwright-core";

const slug = process.argv[2] || "uus-volta-7-50";
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const assets = new Set();
page.on("response", (response) => {
  if (/\.(glb|gltf|json|jpg|jpeg|png|webp|svg)(\?|$)/i.test(response.url())) assets.add(response.url());
});

await page.goto(`https://endover.ee/volta/en/apartments/${slug}/`, { waitUntil: "networkidle", timeout: 120_000 });
const tabs = await page
  .locator("a, button")
  .evaluateAll((elements) =>
    elements
      .map((element) => ({ text: element.textContent?.replace(/\s+/g, " ").trim(), href: element.getAttribute("href"), classes: element.className }))
      .filter((item) => /3d|plan|vaade|korrus/i.test(item.text || "")),
  );
const modelElements = await page
  .locator("[data-model-url], [data-url*='.glb'], [data-src*='.glb']")
  .evaluateAll((elements) => elements.map((element) => ({ tag: element.tagName, classes: element.className, dataset: { ...element.dataset } })));
const images = await page
  .locator("main img, .apartment img, [class*='plan'] img")
  .evaluateAll((elements) =>
    elements.map((element) => ({ src: element.currentSrc || element.getAttribute("src"), alt: element.getAttribute("alt"), classes: element.className })),
  );

console.log(JSON.stringify({ slug, title: await page.title(), tabs, modelElements, images, assets: [...assets] }, null, 2));
await browser.close();
