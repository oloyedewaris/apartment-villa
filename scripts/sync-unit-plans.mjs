import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const apartmentsPath = path.join(root, "data", "apartments.json");
const assetsPath = path.join(root, "data", "unit-assets.json");
const outputDirectory = path.join(root, "public", "unit-plans");
const apartments = JSON.parse(await readFile(apartmentsPath, "utf8"));
const assets = JSON.parse(await readFile(assetsPath, "utf8"));
const eligibleNumbers = new Set(Object.keys(assets.units).map(String));

await mkdir(outputDirectory, { recursive: true });

function planUrlFromPage(html) {
  const planSection = html.match(/class="apartment-plans__plan tab-pane[^>]*>[\s\S]*?<img\s+[^>]*src="([^"]+)"/i);
  return planSection?.[1]?.replaceAll("&amp;", "&") || null;
}

async function fetchWithRetry(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": "Mozilla/5.0 (compatible; MyxelliaPlanSync/1.0)" },
        redirect: "follow",
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }
  throw lastError;
}

async function syncPlan(unit) {
  const unitNumber = String(unit.number_num);
  if (!eligibleNumbers.has(unitNumber) || unit.status === "sold") {
    return { unitNumber, path: null, reason: "inaccessible" };
  }

  try {
    const pageResponse = await fetchWithRetry(unit.url);
    const finalPath = new URL(pageResponse.url).pathname.replace(/\/+$/, "");
    const expectedPath = new URL(unit.url).pathname.replace(/\/+$/, "");
    if (finalPath !== expectedPath) return { unitNumber, path: null, reason: "redirected" };

    const planUrl = planUrlFromPage(await pageResponse.text());
    if (!planUrl) return { unitNumber, path: null, reason: "missing" };

    const planResponse = await fetchWithRetry(planUrl);
    const fileExtension = path.extname(new URL(planUrl).pathname).toLowerCase();
    if (![".svg", ".png", ".jpg", ".jpeg", ".webp"].includes(fileExtension)) {
      throw new Error(`Unsupported plan format: ${fileExtension || "unknown"}`);
    }
    const plan = Buffer.from(await planResponse.arrayBuffer());
    if (!plan.length) throw new Error("Downloaded plan is empty");

    const filename = `${unitNumber}${fileExtension}`;
    await writeFile(path.join(outputDirectory, filename), plan);
    return { unitNumber, path: `/unit-plans/${filename}`, source: planUrl };
  } catch (error) {
    return { unitNumber, path: null, reason: error instanceof Error ? error.message : String(error) };
  }
}

const results = [];
const queue = apartments.slice();
const workerCount = 6;
await Promise.all(
  Array.from({ length: workerCount }, async () => {
    while (queue.length) {
      const unit = queue.shift();
      if (unit) results.push(await syncPlan(unit));
    }
  }),
);

const plansByUnit = new Map(results.map((result) => [result.unitNumber, result.path]));
const updatedApartments = apartments.map((unit) => ({
  ...unit,
  plan_image: plansByUnit.get(String(unit.number_num)) || null,
}));
await writeFile(apartmentsPath, `${JSON.stringify(updatedApartments, null, 2)}\n`);

const downloaded = results.filter((result) => result.path);
const unavailable = results.filter((result) => !result.path);
console.log(`Downloaded ${downloaded.length} individual unit plans.`);
console.log(`No plan for ${unavailable.length} units:`);
console.log(unavailable.map(({ unitNumber, reason }) => `${unitNumber} (${reason})`).join(", "));
