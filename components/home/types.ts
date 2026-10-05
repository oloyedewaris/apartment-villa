export interface ExplorerFilters {
  tower: "all" | "A" | "B";
  type: "all" | "apartment" | "commercial";
  availableOnly: boolean;
  rooms: "all" | "1" | "2" | "3" | "4" | "5";
  floor: [number, number];
  area: [number, number];
  price: [number, number];
  search: string;
}
