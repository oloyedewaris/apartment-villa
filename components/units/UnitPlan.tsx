import type { Apartment } from "@/lib/types";

export function UnitPlan({ unit }: { unit: Apartment }) {
  return (
    <section className="unit-plan-view" aria-label={`Plan for unit ${unit.number}`}>
      {unit.plan_image ? <img src={unit.plan_image} alt={`Unit ${unit.number} plan`} /> : <p>Plan unavailable</p>}
    </section>
  );
}
