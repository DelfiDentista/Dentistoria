"use client";

import { useState } from "react";
import type {
  Patient,
  EvolutionNote,
  MedicalHistoryData,
  Odontogram,
} from "@/lib/types";
import InfoTab from "./InfoTab";
import AntecedentesTab from "./AntecedentesTab";
import EvolutionTab from "./EvolutionTab";
import OdontogramTab from "./OdontogramTab";

const TABS = [
  { key: "info", label: "Información" },
  { key: "antecedentes", label: "Antecedentes" },
  { key: "evolucion", label: "Evolución" },
  { key: "odontograma", label: "Odontograma" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function PatientTabs({
  patient,
  medicalHistory,
  notes,
  odontogram,
}: {
  patient: Patient;
  medicalHistory: MedicalHistoryData;
  notes: EvolutionNote[];
  odontogram: Odontogram;
}) {
  const [tab, setTab] = useState<TabKey>("info");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "bg-brand text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "info" && <InfoTab patient={patient} />}
      {tab === "antecedentes" && (
        <AntecedentesTab patientId={patient.id} initial={medicalHistory} />
      )}
      {tab === "evolucion" && (
        <EvolutionTab patientId={patient.id} notes={notes} />
      )}
      {tab === "odontograma" && (
        <OdontogramTab patientId={patient.id} initial={odontogram} />
      )}
    </div>
  );
}
