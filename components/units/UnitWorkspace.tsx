"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { Apartment } from "@/lib/types";
import { Loader } from "@/components/ui/Loader";
import { UnitPlan } from "./UnitPlan";

const VoltaUnitModelViewer = dynamic(() => import("@/components/unit-model/VoltaUnitModelViewer").then((module) => module.VoltaUnitModelViewer), {
  ssr: false,
  loading: () => (
    <div className="model-state">
      <Loader />
    </div>
  ),
});

type UnitView = "model" | "plan" | "floorPlan";

export function UnitWorkspace({
  unit,
  modelPath,
  planPath,
  floorPlanPath,
}: {
  unit: Apartment;
  modelPath: string | null;
  planPath: string;
  floorPlanPath: string;
}) {
  const [view, setView] = useState<UnitView>(modelPath ? "model" : "plan");
  return (
    <main className="unit-workspace volta-unit-workspace" id="unit-stage">
      <nav className="view-tabs" aria-label="Unit view">
        {modelPath && (
          <button className={view === "model" ? "selected" : ""} onClick={() => setView("model")}>
            3D vaade
          </button>
        )}
        <button className={view === "plan" ? "selected" : ""} onClick={() => setView("plan")}>
          Apartment plan
        </button>
        <button className={view === "floorPlan" ? "selected" : ""} onClick={() => setView("floorPlan")}>
          Floor plan
        </button>
      </nav>

      {view === "model" && modelPath ? (
        <VoltaUnitModelViewer modelPath={modelPath} />
      ) : view === "floorPlan" ? (
        <UnitPlan source={floorPlanPath} label={`Floor ${unit.floor} plan`} />
      ) : (
        <UnitPlan source={planPath} label={`Apartment ${unit.number} plan`} />
      )}
    </main>
  );
}
