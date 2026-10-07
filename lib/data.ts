import sourceUnitsJson from "@/data/volta-uus-7-units.json";
import assetsJson from "@/data/unit-assets.json";
import planLabelsJson from "@/data/plan-labels.json";
import type { Apartment, AssetRegistry, PlanRegistry } from "./types";

// JSON imports infer literal unions and ordinary number arrays. These runtime
// files are validated by the synchronization scripts before reaching here.
interface SourceUnit {
  modelNumber: string;
  label: string;
  floor: string;
  rooms: string;
  area: string;
  balcony: string;
  rent?: string | null;
  type: string;
  price: string | null;
}

export const apartments: Apartment[] = (sourceUnitsJson as SourceUnit[]).map((unit) => ({
  id: Number(unit.modelNumber),
  booking_url: null,
  floor: unit.floor,
  min_floor: unit.floor,
  max_floor: unit.floor,
  number: unit.label,
  number_num: unit.modelNumber,
  function: { accommodation: unit.type === "apartment" ? "Apartment" : unit.type === "hostel" ? "Guest apartment" : "Commercial" },
  rooms_count: unit.rooms,
  area_size_raw: unit.area,
  area_size: unit.area.replace(".", ","),
  extra_size_type: Number(unit.balcony) > 0 ? "balcony" : null,
  balcony_size_raw: Number(unit.balcony) > 0 ? unit.balcony : null,
  rent_raw: unit.rent ?? null,
  status: "available",
  price_raw: unit.price,
  discounted_price_raw: null,
  view: null,
  plan_image: null,
  house: { id: 11587, name: "Uus-Volta 7", identificator: unit.floor === "1" ? "B" : "A" },
}));
const originalAssetRegistry = assetsJson as unknown as AssetRegistry;
const fallbackAssets = Object.values(originalAssetRegistry.units);

if (!fallbackAssets.length) throw new Error("unit-assets.json does not contain any reusable unit assets.");

export const assetRegistry: AssetRegistry = {
  units: Object.fromEntries(
    apartments.map((unit, index) => [unit.number_num, originalAssetRegistry.units[unit.number_num] ?? fallbackAssets[index % fallbackAssets.length]]),
  ),
  disabled: [],
};
export const planRegistry = planLabelsJson as unknown as PlanRegistry;

export function findApartment(unitNumber: string): Apartment | undefined {
  return apartments.find((unit) => Number(unit.number_num) === Number(unitNumber));
}

export function canOpenUnit(unit: Apartment): boolean {
  return unit.allocated === false;
}

export function sortUnitsByFloorDescending(units: Apartment[]): Apartment[] {
  return [...units].sort((left, right) => {
    const floorDifference = Number(right.min_floor || right.floor) - Number(left.min_floor || left.floor);
    return floorDifference || Number(left.number_num) - Number(right.number_num);
  });
}
