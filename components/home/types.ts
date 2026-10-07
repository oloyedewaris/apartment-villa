export interface ExplorerFilters {
  type: "all" | "apartment" | "commercial";
  availableOnly: boolean;
  rooms: "all" | "1" | "2" | "3" | "4";
  area: [number, number];
  price: [number, number];
  search: string;
}
