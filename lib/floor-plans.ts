import type { Apartment, PlanOverlay, PlanRegistry } from "./types";

const DEFAULT_VIEW_BOX: PlanOverlay["viewBox"] = [0, 0, 1157.155463, 1022.155838];

function byNumber<T extends { number_num: string }>(left: T, right: T) {
  return Number(left.number_num) - Number(right.number_num);
}

export function unitsOnFloor(apartments: Apartment[], floor: number, tower: "A" | "B") {
  return apartments.filter((unit) => Number(unit.min_floor || unit.floor) === floor && unit.house.identificator === tower);
}

export function getPlanOverlay(registry: PlanRegistry, apartments: Apartment[], floor: number, tower: "A" | "B"): PlanOverlay {
  const exactOverlay = registry[String(floor)]?.[tower];
  if (exactOverlay) return exactOverlay;

  const floorUnits = unitsOnFloor(apartments, floor, tower).sort(byNumber);
  const sameShape = Object.values(registry)
    .map((entry) => entry[tower])
    .find((overlay) => overlay?.labels.length === floorUnits.length);

  if (sameShape) {
    const positions = [...sameShape.labels].sort((left, right) => Number(left.unit) - Number(right.unit));
    return {
      ...sameShape,
      labels: positions.map((position, index) => ({
        ...position,
        unit: floorUnits[index]?.number_num || position.unit,
      })),
    };
  }

  if (floorUnits.length === 1) {
    return {
      viewBox: DEFAULT_VIEW_BOX,
      labels: [{ unit: floorUnits[0].number_num, x: 538, y: 12, width: 81.152, height: 101.015 }],
    };
  }

  return {
    viewBox: DEFAULT_VIEW_BOX,
    labels: floorUnits.map((unit, index) => ({
      unit: unit.number_num,
      x: 120 + index * (917 / Math.max(1, floorUnits.length - 1)),
      y: 12,
      width: 81.152,
      height: 101.015,
    })),
  };
}
