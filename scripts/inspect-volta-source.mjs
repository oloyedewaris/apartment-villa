import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const responses = [];
page.on("response", (response) => {
  const type = response.request().resourceType();
  if (["fetch", "xhr", "script", "stylesheet", "image", "font"].includes(type) || /\.(glb|gltf|json|jpg|png|webp)(\?|$)/i.test(response.url())) {
    responses.push({ status: response.status(), type, url: response.url() });
  }
});

await page.goto("https://endover.ee/volta/en/houses/uus-volta-7/", { waitUntil: "networkidle", timeout: 120_000 });
const model = await page
  .locator("[data-model-url]")
  .first()
  .evaluate((element) => ({ ...element.dataset }));
const units = await page.locator("[data-apartment-id], [data-unit-id], .pricelist__item, tr").evaluateAll((elements) =>
  elements
    .map((element) => ({
      tag: element.tagName,
      classes: element.className,
      dataset: { ...element.dataset },
      text: element.textContent?.replace(/\s+/g, " ").trim(),
    }))
    .filter((item) => item.text || Object.keys(item.dataset).length),
);

const records = await page.locator("tr.table__row:not(.table__row--header)").evaluateAll((rows) =>
  rows.map((row) => {
    const cells = [...row.querySelectorAll("td")].map((cell) => cell.textContent?.replace(/\s+/g, " ").trim() || "");
    const label = row.dataset.id || "";
    const modelNumber = label.match(/\d+/)?.[0] || "";
    const text = row.textContent?.replace(/\s+/g, " ").trim() || "";
    return {
      modelNumber: String(Number(modelNumber)),
      label: text.match(/Nr\s+([^\s*]+)/)?.[1] || label.toUpperCase(),
      floor: text.match(/Floor\s+Floor\s+(\d+)/)?.[1] || "",
      rooms: row.dataset.room || "",
      area: row.dataset.size || "0",
      balcony: row.dataset.balconySize || "0",
      type: row.dataset.apartmenttype || "apartment",
      price: row.dataset.price || null,
      sourceAvailable: !row.classList.contains("is-disabled"),
      href: row.dataset.href || null,
      cells,
    };
  }),
);

if (process.argv.includes("--records")) console.log(JSON.stringify(records, null, 2));
else console.log(JSON.stringify({ model, responses, units }, null, 2));
await browser.close();
