"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { floorPlanShapes, shapeCenter } from "@/components/home/floorPlanShapes";
import { canOpenUnit } from "@/lib/data";
import type { Apartment } from "@/lib/types";

export function UnitPlan({ source, label }: { source: string; label: string }) {
  return (
    <section className="unit-plan-view" aria-label={label}>
      <img src={source} alt={label} />
    </section>
  );
}

export function UnitFloorPlan({ unit, units }: { unit: Apartment; units: Apartment[] }) {
  const router = useRouter();
  const floor = Number(unit.floor);
  const [hoveredNumber, setHoveredNumber] = useState<string | null>(null);
  const unitsByLabel = new Map(units.map((candidate) => [candidate.number.toLowerCase(), candidate]));

  return (
    <section className="unit-plan-view interactive-unit-floor-plan" aria-label={`Floor ${floor} plan, unit ${unit.number} selected`}>
      <svg className="interactive-project-plan" viewBox="0 0 1750 1020" role="img" aria-label={`Floor ${floor} plan`}>
        <image href={`/volta-uus-7/floor-plans/${floor}.svg`} width="1750" height="1020" />
        {floorPlanShapes[floor].map((shape) => {
          const candidate = unitsByLabel.get(shape.unit.toLowerCase());
          if (!candidate) return null;
          const active = hoveredNumber ? hoveredNumber === candidate.number_num : candidate.number_num === unit.number_num;
          const selected = candidate.number_num === unit.number_num;
          const [labelX, labelY] = shapeCenter(shape);
          const labelWidth = Math.max(58, candidate.number.length * 25 + 24);
          return (
            <g
              key={shape.unit}
              className={`project-unit${active ? " active" : ""}${selected ? " selected-unit" : ""}${candidate.allocated ? " sold" : ""}`}
              data-unit={candidate.number}
              role="button"
              tabIndex={0}
              aria-label={`Unit ${candidate.number}${selected ? ", current unit" : ""}`}
              aria-current={selected ? "true" : undefined}
              onMouseEnter={() => setHoveredNumber(candidate.number_num)}
              onMouseLeave={() => setHoveredNumber(null)}
              onFocus={() => setHoveredNumber(candidate.number_num)}
              onBlur={() => setHoveredNumber(null)}
              onClick={() => {
                if (!selected && canOpenUnit(candidate)) router.push(`/units/${candidate.number_num}`);
              }}
              onKeyDown={(event) => {
                if ((event.key === "Enter" || event.key === " ") && !selected && canOpenUnit(candidate)) {
                  router.push(`/units/${candidate.number_num}`);
                }
              }}
            >
              {shape.kind === "polygon" ? (
                <polygon className="project-unit-shape" points={shape.points} />
              ) : (
                <rect className="project-unit-shape" x={shape.x} y={shape.y} width={shape.width} height={shape.height} />
              )}
              <rect className="project-unit-label" x={labelX - labelWidth / 2} y={labelY - 30} width={labelWidth} height="60" rx="3" />
              <text className="project-unit-label-text" x={labelX} y={labelY} dominantBaseline="central" textAnchor="middle">
                {candidate.number}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="unit-floor-selection" aria-live="polite">
        <span>Floor {floor}</span>
        <strong>{hoveredNumber ? units.find((candidate) => candidate.number_num === hoveredNumber)?.number : unit.number}</strong>
      </div>
    </section>
  );
}
