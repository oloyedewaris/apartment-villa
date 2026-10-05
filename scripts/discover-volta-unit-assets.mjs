import { readFile } from "node:fs/promises";

const units = JSON.parse(await readFile(new URL("../data/volta-uus-7-units.json", import.meta.url), "utf8"));
const results = [];
let cursor = 0;

async function inspect(unit) {
  const slug = `uus-volta-7-${unit.label.toLowerCase()}`;
  const source = `https://endover.ee/volta/en/apartments/${slug}/`;
  const response = await fetch(source);
  if (!response.ok) return { modelNumber: unit.modelNumber, label: unit.label, source, status: response.status };
  const html = await response.text();
  const model = html.match(/data-model-url=["']([^"']+\.glb)["']/i)?.[1]?.replaceAll("\\/", "/") ?? null;
  const uploadSvgs = [...html.matchAll(/https:[^"']+\/wp-content\/uploads\/[^"']+\.svg/gi)].map((match) => match[0].replaceAll("\\/", "/"));
  const plan = uploadSvgs.find((url) => !/logo|icon/i.test(url)) ?? null;
  return { modelNumber: unit.modelNumber, label: unit.label, source, model, plan };
}

const workers = Array.from({ length: 6 }, async () => {
  while (cursor < units.length) {
    const index = cursor++;
    results[index] = await inspect(units[index]);
  }
});
await Promise.all(workers);
console.log(JSON.stringify(results, null, 2));
