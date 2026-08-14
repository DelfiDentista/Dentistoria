"use client";

import { useState } from "react";
import { saveMedicalHistory } from "@/app/(app)/patients/actions";
import { ANTECEDENTES, ALERGIAS, MEDICACION } from "@/lib/catalog";
import type { MedicalHistoryData } from "@/lib/types";

export default function AntecedentesTab({
  patientId,
  initial,
}: {
  patientId: string;
  initial: MedicalHistoryData;
}) {
  const [conditions, setConditions] = useState<Record<string, string[]>>(
    initial.conditions ?? {}
  );
  const [medication, setMedication] = useState<string[]>(initial.medication ?? []);
  const [allergies, setAllergies] = useState<string[]>(initial.allergies ?? []);
  const [comments, setComments] = useState<string>(initial.comments ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleGroup(group: string, item: string) {
    setConditions((prev) => {
      const cur = new Set(prev[group] ?? []);
      cur.has(item) ? cur.delete(item) : cur.add(item);
      const next = { ...prev, [group]: Array.from(cur) };
      if (next[group].length === 0) delete next[group];
      return next;
    });
  }

  function toggleList(
    list: string[],
    setList: (v: string[]) => void,
    item: string
  ) {
    const s = new Set(list);
    s.has(item) ? s.delete(item) : s.add(item);
    setList(Array.from(s));
  }

  async function save() {
    setSaving(true);
    await saveMedicalHistory(patientId, {
      conditions,
      medication,
      allergies,
      comments,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Marcá los antecedentes que aplican al paciente.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {ANTECEDENTES.map((sec) => (
          <div key={sec.group} className="card">
            <h3 className="mb-3 font-semibold">{sec.group}</h3>
            <div className="space-y-2">
              {sec.items.map((item) => {
                const checked = (conditions[sec.group] ?? []).includes(item);
                return (
                  <label key={item} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleGroup(sec.group, item)}
                      className="h-4 w-4 rounded border-slate-300 text-brand"
                    />
                    {item}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h3 className="mb-3 font-semibold">Medicación actual</h3>
          <div className="space-y-2">
            {MEDICACION.map((m) => (
              <label key={m} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={medication.includes(m)}
                  onChange={() => toggleList(medication, setMedication, m)}
                  className="h-4 w-4 rounded border-slate-300 text-brand"
                />
                {m}
              </label>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="mb-3 font-semibold">Alergias</h3>
          <div className="space-y-2">
            {ALERGIAS.map((a) => (
              <label key={a} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={allergies.includes(a)}
                  onChange={() => toggleList(allergies, setAllergies, a)}
                  className="h-4 w-4 rounded border-slate-300 text-brand"
                />
                {a}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <label className="label">Comentarios / medicación detallada</label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={3}
          className="input"
          placeholder="Ej: Antihipertensivo (Enalapril). Levotiroxina por hipotiroidismo."
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-emerald-600">✓ Guardado</span>}
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? "Guardando…" : "Guardar antecedentes"}
        </button>
      </div>
    </div>
  );
}
