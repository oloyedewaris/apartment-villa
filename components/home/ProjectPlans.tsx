"use client";

import { useState } from "react";
import type { Apartment } from "@/lib/types";
import { floorPlanShapes, shapeCenter } from "./floorPlanShapes";
import { locationBuildings } from "./locationPlanShapes";

interface ProjectFloorPlansProps {
  apartments: Apartment[];
  hoveredNumber: string | null;
  onHover(number: string | null): void;
  onSelect(number: string): void;
}

export function ProjectFloorPlans({ apartments, hoveredNumber, onHover, onSelect }: ProjectFloorPlansProps) {
  const [floor, setFloor] = useState(1);
  const unitsByLabel = new Map(apartments.map((unit) => [unit.number.toLowerCase(), unit]));

  return (
    <section className="project-plan-view" aria-label={`Floor ${floor} plan`}>
      <svg className="interactive-project-plan" viewBox="0 0 1750 1020" role="img" aria-label={`Uus-Volta 7 floor ${floor} plan`}>
        <image href={`/volta-uus-7/floor-plans/${floor}.svg`} width="1750" height="1020" />
        {floorPlanShapes[floor].map((shape) => {
          const unit = unitsByLabel.get(shape.unit.toLowerCase());
          if (!unit) return null;
          const active = hoveredNumber === unit.number_num;
          const [labelX, labelY] = shapeCenter(shape);
          const labelWidth = Math.max(58, unit.number.length * 25 + 24);
          return (
            <g
              key={shape.unit}
              className={`project-unit${active ? " active" : ""}${unit.allocated ? " sold" : ""}`}
              data-unit={unit.number}
              role="button"
              tabIndex={0}
              aria-label={`Unit ${unit.number}`}
              onMouseEnter={() => onHover(unit.number_num)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(unit.number_num)}
              onBlur={() => onHover(null)}
              onClick={() => onSelect(unit.number_num)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onSelect(unit.number_num);
              }}
            >
              {shape.kind === "polygon" ? (
                <polygon className="project-unit-shape" points={shape.points} />
              ) : (
                <rect className="project-unit-shape" x={shape.x} y={shape.y} width={shape.width} height={shape.height} />
              )}
              <rect className="project-unit-label" x={labelX - labelWidth / 2} y={labelY - 30} width={labelWidth} height="60" rx="3" />
              <text className="project-unit-label-text" x={labelX} y={labelY} dominantBaseline="central" textAnchor="middle">
                {unit.number}
              </text>
            </g>
          );
        })}
      </svg>
      <nav className="project-floor-selector" aria-label="Select floor">
        <span>Floor</span>
        <div>
          {[1, 2, 3, 4].map((number) => (
            <button
              key={number}
              className={floor === number ? "selected" : ""}
              onClick={() => {
                setFloor(number);
                onHover(null);
              }}
              aria-pressed={floor === number}
            >
              {number}
            </button>
          ))}
        </div>
      </nav>
    </section>
  );
}

export function ProjectLocationPlan() {
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);
  const activeBuilding = locationBuildings.find((building) => building.id === hoveredBuilding);

  return (
    <section className="project-plan-view project-location-plan" aria-label="Uus-Volta location plan">
      <svg className="interactive-location-plan" viewBox="0 0 1570.315318 761.83186" role="img" aria-label="Location of Uus-Volta 7 in the Volta quarter">
        <image href="/volta-uus-7/location-plan.png" width="1570.315318" height="761.83186" preserveAspectRatio="none" />
        {locationBuildings.map((building) => (
          <g
            key={building.id}
            className={`location-building${hoveredBuilding === building.id ? " active" : ""}`}
            data-building={building.id}
            role="button"
            tabIndex={0}
            aria-label={`${building.name}${building.availability ? `, ${building.availability}` : ""}`}
            onMouseEnter={() => setHoveredBuilding(building.id)}
            onMouseLeave={() => setHoveredBuilding(null)}
            onFocus={() => setHoveredBuilding(building.id)}
            onBlur={() => setHoveredBuilding(null)}
          >
            {building.shape.kind === "polygon" ? (
              <polygon points={building.shape.points} />
            ) : (
              <rect x={building.shape.x} y={building.shape.y} width={building.shape.width} height={building.shape.height} />
            )}
          </g>
        ))}
      </svg>
      {activeBuilding && (activeBuilding.name !== "Future development" || activeBuilding.availability) && (
        <div className="location-building-tooltip" role="status">
          <strong>{activeBuilding.name}</strong>
          {activeBuilding.availability && <span>{activeBuilding.availability}</span>}
        </div>
      )}
    </section>
  );
}
