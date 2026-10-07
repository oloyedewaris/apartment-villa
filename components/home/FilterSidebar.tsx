import type { ExplorerFilters } from "./types";
import { RangeFilter } from "./RangeFilter";

interface FilterSidebarProps {
  filters: ExplorerFilters;
  bounds: { area: [number, number]; price: [number, number] };
  onChange(filters: ExplorerFilters): void;
  onClear(): void;
}

function Options<T extends string>({
  values,
  selected,
  label,
  onSelect,
}: {
  values: readonly T[];
  selected: T;
  label: (value: T) => string;
  onSelect(value: T): void;
}) {
  return (
    <div className="filter-options">
      {values.map((value) => (
        <button key={value} className={selected === value ? "selected" : ""} onClick={() => onSelect(value)}>
          {label(value)}
        </button>
      ))}
    </div>
  );
}

export function FilterSidebar({ filters, bounds, onChange, onClear }: FilterSidebarProps) {
  const update = <K extends keyof ExplorerFilters>(key: K, value: ExplorerFilters[K]) => onChange({ ...filters, [key]: value });
  return (
    <aside className="filter-sidebar">
      <header>Filter</header>
      <div className="filter-content">
        <label className="availability-toggle">
          <span>Only available units</span>
          <input type="checkbox" checked={filters.availableOnly} onChange={(event) => update("availableOnly", event.target.checked)} />
        </label>
        <section className="unit-type-filter">
          <label>Type</label>
          <Options
            values={["all", "commercial", "apartment"] as const}
            selected={filters.type}
            label={(value) => (value === "all" ? "All" : value === "commercial" ? "Business units" : "Apartment units")}
            onSelect={(value) => update("type", value)}
          />
        </section>
        <section>
          <label>Rooms</label>
          <Options
            values={["all", "1", "2", "3", "4"] as const}
            selected={filters.rooms}
            label={(value) => (value === "all" ? "All" : value)}
            onSelect={(value) => update("rooms", value)}
          />
        </section>
        <RangeFilter
          label="Size"
          unit="m²"
          minimum={bounds.area[0]}
          maximum={bounds.area[1]}
          low={filters.area[0]}
          high={filters.area[1]}
          format={(value) => `${value} m²`}
          onChange={(low, high) => update("area", [low, high])}
        />
        <RangeFilter
          label="Price"
          unit="€"
          minimum={bounds.price[0]}
          maximum={bounds.price[1]}
          low={filters.price[0]}
          high={filters.price[1]}
          step={1000}
          format={(value) => `${value.toLocaleString("en")} €`}
          onChange={(low, high) => update("price", [low, high])}
        />
        <button className="clear-filters" onClick={onClear}>
          Cancel filters
        </button>
      </div>
      <a className="sidebar-credit" href="https://www.myxellia.io/">
        Powered by Myxellia.io
      </a>
    </aside>
  );
}
