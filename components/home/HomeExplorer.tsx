"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/ui/Loader";
import { canOpenUnit } from "@/lib/data";
import type { Apartment } from "@/lib/types";
import { FilterSidebar } from "./FilterSidebar";
import { UnitResults } from "./UnitResults";
import type { ExplorerFilters } from "./types";
import { ProjectFloorPlans, ProjectLocationPlan } from "./ProjectPlans";

const BuildingViewer = dynamic(() => import("@/components/building/BuildingViewer").then((module) => module.BuildingViewer), {
  ssr: false,
  loading: () => (
    <div className="building-loading">
      <Loader />
    </div>
  ),
});

function isCommercial(unit: Apartment) {
  const use = Object.values(unit.function).find(Boolean);
  const normalizedUse = use?.toLowerCase() ?? "";
  return !Number(unit.rooms_count) || ["office", "service", "catering", "retail", "commercial", "business"].includes(normalizedUse);
}

function matchesSearch(unit: Apartment, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  const text =
    `${unit.number} ${unit.number_num} floor ${unit.floor} tower ${unit.house.identificator} ${unit.rooms_count} rooms ${unit.area_size_raw}`.toLowerCase();
  return text.includes(normalized) || normalized.split(/[ ,]+/).every((part) => text.includes(part));
}

export function HomeExplorer({ apartments }: { apartments: Apartment[] }) {
  const router = useRouter();
  const unitsByNumber = useMemo(() => new Map(apartments.map((unit) => [String(Number(unit.number_num)), unit])), [apartments]);
  const bounds = useMemo(() => {
    const areas = apartments.map((unit) => Number(unit.area_size_raw)).filter(Number.isFinite);
    const prices = apartments.map((unit) => Number(unit.discounted_price_raw || unit.price_raw)).filter((price) => price > 0);
    return {
      area: [Math.floor(Math.min(...areas)), Math.ceil(Math.max(...areas))] as [number, number],
      price: [Math.min(...prices), Math.max(...prices)] as [number, number],
    };
  }, [apartments]);
  const initialFilters = useMemo<ExplorerFilters>(
    () => ({
      type: "all",
      availableOnly: false,
      rooms: "all",
      area: [...bounds.area],
      price: [...bounds.price],
      search: "",
    }),
    [bounds],
  );
  const [filters, setFilters] = useState<ExplorerFilters>(() => initialFilters);
  const [view, setView] = useState<"model" | "plans" | "location">("model");
  const [hoveredNumber, setHoveredNumber] = useState<string | null>(null);
  const [focusedNumber, setFocusedNumber] = useState<string | null>(null);

  const visibleUnits = useMemo(
    () =>
      apartments.filter((unit) => {
        const area = Number(unit.area_size_raw),
          price = Number(unit.discounted_price_raw || unit.price_raw || 0);
        return (
          (filters.type === "all" || (filters.type === "commercial") === isCommercial(unit)) &&
          (!filters.availableOnly || !unit.allocated) &&
          (filters.rooms === "all" || Number(unit.rooms_count) === Number(filters.rooms)) &&
          area >= filters.area[0] &&
          area <= filters.area[1] &&
          (unit.allocated || price === 0 || (price >= filters.price[0] && price <= filters.price[1])) &&
          matchesSearch(unit, filters.search)
        );
      }),
    [apartments, filters],
  );

  const visibleNumbers = useMemo(() => new Set(visibleUnits.map((unit) => String(Number(unit.number_num)))), [visibleUnits]);
  const selectableNumbers = useMemo(() => new Set(visibleUnits.filter(canOpenUnit).map((unit) => String(Number(unit.number_num)))), [visibleUnits]);
  const filtersActive =
    filters.type !== initialFilters.type ||
    filters.availableOnly !== initialFilters.availableOnly ||
    filters.rooms !== initialFilters.rooms ||
    filters.area[0] !== initialFilters.area[0] ||
    filters.area[1] !== initialFilters.area[1] ||
    filters.price[0] !== initialFilters.price[0] ||
    filters.price[1] !== initialFilters.price[1] ||
    filters.search !== initialFilters.search;
  function openUnit(number: string) {
    const unit = unitsByNumber.get(String(Number(number)));
    if (unit && canOpenUnit(unit)) router.push(`/units/${number}`);
  }
  return (
    <main className="home-explorer">
      <FilterSidebar filters={filters} bounds={bounds} onChange={setFilters} onClear={() => setFilters(initialFilters)} />
      <section className="explorer-center">
        <nav className="home-view-tabs" aria-label="Explorer view">
          <button className={view === "model" ? "selected" : ""} onClick={() => setView("model")}>
            3D model
          </button>
          <button className={view === "plans" ? "selected" : ""} onClick={() => setView("plans")}>
            Floor plans
          </button>
          <button className={view === "location" ? "selected" : ""} onClick={() => setView("location")}>
            Location plan
          </button>
        </nav>
        {view === "model" ? (
          <BuildingViewer
            apartments={apartments}
            visibleNumbers={visibleNumbers}
            selectableNumbers={selectableNumbers}
            filtersActive={filtersActive}
            hoveredNumber={hoveredNumber ? String(Number(hoveredNumber)) : null}
            focusedNumber={focusedNumber ? String(Number(focusedNumber)) : null}
            onHover={setHoveredNumber}
            onSelect={openUnit}
          />
        ) : view === "plans" ? (
          <ProjectFloorPlans apartments={apartments} hoveredNumber={hoveredNumber} onHover={setHoveredNumber} onSelect={openUnit} />
        ) : (
          <ProjectLocationPlan />
        )}
      </section>
      <UnitResults
        units={visibleUnits}
        total={apartments.length}
        search={filters.search}
        hoveredNumber={hoveredNumber}
        onSearch={(search) => setFilters({ ...filters, search })}
        onHover={(number) => {
          setHoveredNumber(number);
          setFocusedNumber(number);
        }}
        onSelect={openUnit}
      />
    </main>
  );
}
