export type UnitStatus = "available" | "booked" | "sold" | "request";

export interface Apartment {
  id: number;
  name?: string;
  unit?: number;
  unit_name?: string;
  allocated?: boolean;
  generating_revenue?: boolean;
  archived?: boolean;
  owner?: unknown | null;
  booking_url: string | null;
  floor: string;
  min_floor: string;
  max_floor: string;
  number: string;
  number_num: string;
  function: Record<string, string | undefined>;
  rooms_count: string | null;
  area_size_raw: string;
  area_size: string;
  extra_size_type: string | null;
  balcony_size_raw: string | null;
  status: UnitStatus;
  price_raw: string | null;
  discounted_price_raw: string | null;
  view: string | null;
  plan_image: string | null;
  house: { id: number; name: string; identificator: "A" | "B" };
}

export interface ProjectAllocation {
  id: number;
  name: string;
  unit: number;
  unit_name: string;
  allocated: boolean;
  generating_revenue: boolean;
  archived: boolean;
  owner: unknown | null;
}

export interface UnitAsset {
  model: string;
  textures: string[];
  environment?: string | null;
  format: "atlas" | "materials";
}

export interface AssetRegistry {
  units: Record<string, UnitAsset>;
  disabled: string[];
}

export interface PlanLabel {
  unit: string;
  className?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlanOverlay {
  sourceUnit?: string;
  viewBox: [number, number, number, number];
  labels: PlanLabel[];
}

export type PlanRegistry = Record<string, Partial<Record<"A" | "B", PlanOverlay>>>;
