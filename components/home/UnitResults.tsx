import { useEffect, useMemo, useRef } from "react";
import { canOpenUnit, sortUnitsByFloorDescending } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import type { Apartment } from "@/lib/types";

interface UnitResultsProps {
  units: Apartment[];
  total: number;
  search: string;
  hoveredNumber: string | null;
  onSearch(value: string): void;
  onHover(number: string | null): void;
  onSelect(number: string): void;
}

export function UnitResults({ units, total, search, hoveredNumber, onSearch, onHover, onSelect }: UnitResultsProps) {
  const rows = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = rows.current;
    const row = hoveredNumber ? container?.querySelector<HTMLElement>(`[data-number="${hoveredNumber}"]`) : null;
    if (!container || !row) return;

    const rowTop = row.offsetTop;
    const rowBottom = rowTop + row.offsetHeight;
    const visibleTop = container.scrollTop;
    const visibleBottom = visibleTop + container.clientHeight;

    if (rowTop < visibleTop) container.scrollTo({ top: rowTop, behavior: "smooth" });
    else if (rowBottom > visibleBottom) container.scrollTo({ top: rowBottom - container.clientHeight, behavior: "smooth" });
  }, [hoveredNumber]);
  const available = useMemo(() => units.filter((unit) => !unit.allocated).length, [units]);
  const sortedUnits = useMemo(() => sortUnitsByFloorDescending(units), [units]);
  return (
    <aside className="results-sidebar">
      <header>
        <span>Units</span>
        <span>
          {units.length} of {total} · {available} available
        </span>
      </header>
      <div className="result-search">
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          type="search"
          placeholder="115, floor 5-9, tower B, 3 rooms"
          aria-label="Search units"
        />
      </div>
      <div className="result-columns">
        <span>No.</span>
        <span>Twr</span>
        <span>Fl</span>
        <span>Rm</span>
        <span>m²</span>
        <span>Price</span>
      </div>
      <div className="result-rows" ref={rows}>
        {sortedUnits.map((unit) => {
          const sold = unit.allocated === true;
          const disabled = !canOpenUnit(unit);
          return (
            <button
              key={unit.id}
              data-number={unit.number_num}
              aria-disabled={disabled}
              className={`result-row${hoveredNumber === unit.number_num ? " hovered" : ""}${sold ? " sold" : ""}${disabled ? " disabled" : ""}`}
              onMouseEnter={() => onHover(unit.number_num)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(unit.number_num)}
              onBlur={() => onHover(null)}
              onClick={() => {
                if (!disabled) onSelect(unit.number_num);
              }}
            >
              <strong>{unit.number}</strong>
              <span>{unit.house.identificator}</span>
              <span>{unit.floor}</span>
              <span>{unit.rooms_count || "-"}</span>
              <span>{unit.area_size_raw}</span>
              <span>{formatPrice(unit)}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
