"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader } from "@/components/ui/Loader";

interface InteractivePlanSvgProps {
  src: string;
  regionMap: Record<string, string>;
  highlightedUnit: string | null;
  onUnitHover: (unitNumber: string | null) => void;
  onUnitSelect: (unitNumber: string) => void;
}

const planMarkupCache = new Map<string, string>();

function unitKey(value: string) {
  return String(Number(value.replace(/^T/i, "")));
}

function buildInteractiveSvg(source: string, regionMap: Record<string, string>) {
  const document = new DOMParser().parseFromString(source, "image/svg+xml");
  const svg = document.documentElement;
  const overlay = document.createElementNS("http://www.w3.org/2000/svg", "g");
  overlay.setAttribute("class", "plan-unit-regions");

  svg.querySelectorAll('g[id^="bg_"] > [id]').forEach((shape) => {
    const sourceUnit = unitKey(shape.id.slice(1));
    const unitNumber = regionMap[sourceUnit];
    if (!unitNumber) return;

    const region = shape.cloneNode(true) as SVGElement;
    region.removeAttribute("id");
    region.setAttribute("class", "plan-unit-region");
    region.setAttribute("data-plan-unit", unitNumber);
    region.setAttribute("role", "button");
    region.setAttribute("tabindex", "0");
    region.setAttribute("aria-label", `Unit ${unitNumber}`);
    overlay.append(region);
  });

  const addedUnits = new Set(Array.from(overlay.querySelectorAll<SVGElement>(".plan-unit-region")).map((region) => region.dataset.planUnit || ""));
  Object.entries(regionMap).forEach(([sourceUnit, unitNumber]) => {
    if (addedUnits.has(unitNumber)) return;
    const boundary = Array.from(svg.querySelectorAll<SVGElement>(`[id="_${sourceUnit}"]`)).find((element) => element.matches("path, polygon, rect"));
    if (!boundary) return;

    const region = boundary.cloneNode(true) as SVGElement;
    region.removeAttribute("id");
    region.setAttribute("class", "plan-unit-region");
    region.setAttribute("data-plan-unit", unitNumber);
    region.setAttribute("role", "button");
    region.setAttribute("tabindex", "0");
    region.setAttribute("aria-label", `Unit ${unitNumber}`);
    overlay.append(region);
  });

  svg.append(overlay);
  svg.setAttribute("class", "interactive-plan-svg");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  return new XMLSerializer().serializeToString(svg);
}

export function InteractivePlanSvg({ src, regionMap, highlightedUnit, onUnitHover, onUnitSelect }: InteractivePlanSvgProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hoveredUnitRef = useRef<string | null>(null);
  const [markup, setMarkup] = useState<string | null>(null);
  const regionMapKey = useMemo(() => JSON.stringify(regionMap), [regionMap]);

  useEffect(() => {
    const controller = new AbortController();
    const cacheKey = `${src}:${regionMapKey}`;
    const cachedMarkup = planMarkupCache.get(cacheKey);
    if (cachedMarkup) {
      setMarkup(cachedMarkup);
      return () => controller.abort();
    }
    setMarkup(null);

    fetch(src, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load floor plan: ${src}`);
        return response.text();
      })
      .then((source) => {
        const nextMarkup = buildInteractiveSvg(source, regionMap);
        planMarkupCache.set(cacheKey, nextMarkup);
        setMarkup(nextMarkup);
      })
      .catch((error: unknown) => {
        if ((error as Error).name !== "AbortError") console.error(error);
      });

    return () => controller.abort();
  }, [src, regionMapKey]);

  useEffect(() => {
    if (!markup || !containerRef.current) return;
    const svg = containerRef.current.querySelector<SVGSVGElement>(".interactive-plan-svg");
    const overlay = svg?.querySelector<SVGGElement>(".plan-unit-regions");
    if (!svg || !overlay) return;

    const assignedUnits = new Set(Array.from(overlay.querySelectorAll<SVGElement>(".plan-unit-region")).map((region) => region.dataset.planUnit || ""));
    const assignedShapes = new Set(
      Array.from(svg.querySelectorAll('g[id^="bg_"] > [id]'))
        .filter((shape) => assignedUnits.has(regionMap[unitKey(shape.id.slice(1))]))
        .map((shape) => shape),
    );
    const shapes = Array.from(svg.querySelectorAll<SVGGraphicsElement>('g[id^="bg_"] > *')).filter((shape) => !assignedShapes.has(shape));
    const missingRegions = Object.entries(regionMap).filter(([, unit]) => !assignedUnits.has(unit));
    const matches = shapes.flatMap((shape) => {
      const shapeBox = shape.getBBox();
      return missingRegions.map(([sourceUnit, unit]) => {
        const drawing = svg.querySelector<SVGGraphicsElement>(`[id="_${sourceUnit}"]`);
        if (!drawing) return { shape, unit, score: 0 };
        const drawingBox = drawing.getBBox();
        const containsDrawingCenter =
          shape instanceof SVGGeometryElement && shape.isPointInFill(new DOMPoint(drawingBox.x + drawingBox.width / 2, drawingBox.y + drawingBox.height / 2));
        const width = Math.max(0, Math.min(shapeBox.x + shapeBox.width, drawingBox.x + drawingBox.width) - Math.max(shapeBox.x, drawingBox.x));
        const height = Math.max(0, Math.min(shapeBox.y + shapeBox.height, drawingBox.y + drawingBox.height) - Math.max(shapeBox.y, drawingBox.y));
        const overlap = width * height;
        const smallerArea = Math.min(shapeBox.width * shapeBox.height, drawingBox.width * drawingBox.height);
        return {
          shape,
          unit,
          score: (containsDrawingCenter ? 10 : 0) + (smallerArea ? overlap / smallerArea : 0),
        };
      });
    });

    const usedShapes = new Set<SVGGraphicsElement>();
    const usedUnits = new Set<string>();
    matches
      .sort((left, right) => right.score - left.score)
      .forEach(({ shape, unit, score }) => {
        if (score < 0.01 || usedShapes.has(shape) || usedUnits.has(unit)) return;
        usedShapes.add(shape);
        usedUnits.add(unit);
        const region = shape.cloneNode(true) as SVGElement;
        region.removeAttribute("id");
        region.setAttribute("class", "plan-unit-region");
        region.setAttribute("data-plan-unit", unit);
        region.setAttribute("role", "button");
        region.setAttribute("tabindex", "0");
        region.setAttribute("aria-label", `Unit ${unit}`);
        overlay.append(region);
      });
  }, [markup, regionMap, regionMapKey]);

  useEffect(() => {
    containerRef.current?.querySelectorAll<SVGElement>(".plan-unit-region").forEach((region) => {
      region.classList.toggle("highlighted", region.dataset.planUnit === highlightedUnit);
    });
  }, [highlightedUnit, markup]);

  function unitFromTarget(target: EventTarget | null) {
    return (target as Element | null)?.closest<SVGElement>(".plan-unit-region")?.dataset.planUnit || null;
  }

  function updateHoveredUnit(unitNumber: string | null) {
    if (hoveredUnitRef.current === unitNumber) return;
    hoveredUnitRef.current = unitNumber;
    onUnitHover(unitNumber);
  }

  return (
    <div
      ref={containerRef}
      className="interactive-plan"
      onPointerMove={(event) => updateHoveredUnit(unitFromTarget(event.target))}
      onPointerLeave={() => updateHoveredUnit(null)}
      onFocus={(event) => updateHoveredUnit(unitFromTarget(event.target))}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) updateHoveredUnit(null);
      }}
      onClick={(event) => {
        const unitNumber = unitFromTarget(event.target);
        if (unitNumber) onUnitSelect(unitNumber);
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const unitNumber = unitFromTarget(event.target);
        if (!unitNumber) return;
        event.preventDefault();
        onUnitSelect(unitNumber);
      }}
    >
      {markup ? (
        <div className="plan-svg-markup" dangerouslySetInnerHTML={{ __html: markup }} />
      ) : (
        <div className="plan-loading">
          <Loader />
        </div>
      )}
    </div>
  );
}
