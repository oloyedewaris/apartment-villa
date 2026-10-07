import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));

await page.goto(process.env.BASE_URL || "http://localhost:3001", { waitUntil: "domcontentloaded", timeout: 120_000 });
await page.locator(".result-row").first().waitFor({ state: "visible", timeout: 120_000 });

const optionLabels = await page.locator(".filter-options button").allTextContents();
const rangeLabels = await page.locator('.filter-range input[type="range"]').evaluateAll((inputs) => inputs.map((input) => input.getAttribute("aria-label")));
const tableHeaders = await page.locator(".result-columns span").allTextContents();
const b4Values = await page.locator('.result-row[data-number="4"] > *').allTextContents();
const b51Values = await page.locator('.result-row[data-number="51"] > *').allTextContents();

await page.getByRole("button", { name: "Business units" }).click();
const businessUnits = await page.locator(".result-row").count();
await page.getByRole("button", { name: "Apartment units" }).click();
const apartmentUnits = await page.locator(".result-row").count();
await page.getByRole("button", { name: "All", exact: true }).first().click();
await page.getByRole("button", { name: "4", exact: true }).click();
const fourRoomUnits = await page.locator(".result-row").count();

const availability = page.getByRole("checkbox", { name: "Only available units" });
await availability.check();
const availableOnly = await availability.isChecked();

const result = { optionLabels, rangeLabels, tableHeaders, b4Values, b51Values, businessUnits, apartmentUnits, fourRoomUnits, availableOnly, errors };
console.log(JSON.stringify(result, null, 2));
await browser.close();

const actionableErrors = errors.filter((error) => !error.includes("Minified React error #418"));
if (
  optionLabels.join("|") !== "All|Business units|Apartment units|All|1|2|3|4" ||
  rangeLabels.join("|") !== "Size minimum|Size maximum|Price minimum|Price maximum" ||
  tableHeaders.join("|") !== "Floor|Nr|Rooms|Size m²|Balcony m²|Rent|Price" ||
  b4Values.join("|") !== "1|B4|1|53.9|-|1 520 €|339 900 €" ||
  b51Values.join("|") !== "1|B51|1|32|-|990 €|219 900 €" ||
  businessUnits !== 7 ||
  apartmentUnits !== 43 ||
  fourRoomUnits !== 3 ||
  !availableOnly ||
  actionableErrors.length
) {
  process.exit(1);
}
