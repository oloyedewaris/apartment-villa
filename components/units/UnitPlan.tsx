export function UnitPlan({ source, label }: { source: string; label: string }) {
  return (
    <section className="unit-plan-view" aria-label={label}>
      <img src={source} alt={label} />
    </section>
  );
}
