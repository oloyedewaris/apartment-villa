import type { ExplorerFilters } from "./types";
import { RangeFilter } from "./RangeFilter";

interface FilterSidebarProps {
  filters: ExplorerFilters;
  bounds: { floor: [number, number]; area: [number, number]; price: [number, number] };
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
      <header>Filters</header>
      <div className="filter-content">
        <section>
          <label>Tower</label>
          <Options
            values={["all", "A", "B"] as const}
            selected={filters.tower}
            label={(value) => (value === "all" ? "All" : value)}
            onSelect={(value) => update("tower", value)}
          />
        </section>
        <section className="unit-type-filter">
          <label>Unit type</label>
          <Options
            values={["all", "apartment", "commercial"] as const}
            selected={filters.type}
            label={(value) => (value === "all" ? "All" : value[0].toUpperCase() + value.slice(1))}
            onSelect={(value) => update("type", value)}
          />
        </section>
        <label className="availability-toggle">
          <span>Available only</span>
          <input type="checkbox" checked={filters.availableOnly} onChange={(event) => update("availableOnly", event.target.checked)} />
        </label>
        <section>
          <label>Rooms</label>
          <Options
            values={["all", "1", "2", "3", "4", "5"] as const}
            selected={filters.rooms}
            label={(value) => (value === "all" ? "All" : value)}
            onSelect={(value) => update("rooms", value)}
          />
        </section>
        <RangeFilter
          label="Floor"
          minimum={bounds.floor[0]}
          maximum={bounds.floor[1]}
          low={filters.floor[0]}
          high={filters.floor[1]}
          format={String}
          onChange={(low, high) => update("floor", [low, high])}
        />
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
          step={10000}
          format={(value) => `${value.toLocaleString("en")} €`}
          onChange={(low, high) => update("price", [low, high])}
        />
        <button className="clear-filters" onClick={onClear}>
          Clear filters
        </button>
      </div>
      <a className="sidebar-credit" href="https://www.myxellia.io/">
        Powered by Myxellia.io
      </a>
    </aside>
  );
}
