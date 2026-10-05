"use client";

import { useState } from "react";

export function ProjectFloorPlans() {
  const [floor, setFloor] = useState(1);

  return (
    <section className="project-plan-view" aria-label={`Floor ${floor} plan`}>
      <img src={`/volta-uus-7/floor-plans/${floor}.svg`} alt={`Uus-Volta 7 floor ${floor} plan`} />
      <nav className="project-floor-selector" aria-label="Select floor">
        <span>Floor</span>
        <div>
          {[1, 2, 3, 4].map((number) => (
            <button key={number} className={floor === number ? "selected" : ""} onClick={() => setFloor(number)} aria-pressed={floor === number}>
              {number}
            </button>
          ))}
        </div>
      </nav>
    </section>
  );
}

export function ProjectLocationPlan() {
  return (
    <section className="project-plan-view project-location-plan" aria-label="Uus-Volta location plan">
      <img src="/volta-uus-7/location-plan.png" alt="Location of Uus-Volta 7 in the Volta quarter" />
    </section>
  );
}
