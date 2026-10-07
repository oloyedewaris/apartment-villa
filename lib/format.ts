import type { Apartment } from "./types";

export function formatCurrency(value: string | number): string {
  return `${Number(value).toLocaleString("en-US").replaceAll(",", "\u00a0")} €`;
}

export function formatPrice(unit: Apartment): string {
  if (unit.allocated) return "Sold";
  const price = unit.discounted_price_raw || unit.price_raw;
  return price ? formatCurrency(price) : "Ask price";
}

export function formatArea(unit: Apartment): string {
  return `${unit.area_size_raw || unit.area_size} m²`;
}
