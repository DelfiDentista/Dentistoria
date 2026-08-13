"use client";

import { useState } from "react";
import { saveOdontogram } from "@/app/(app)/patients/actions";
import { TEETH_UPPER, TEETH_LOWER, TOOTH_STATUSES } from "@/lib/catalog";
import type { Odontogram } from "@/lib/types";

export default function OdontogramTab({
  patientId,
  initial,
}: {
  patientId: string;
  initial: Odontogram;
}) {
  const [teeth, setTeeth] = useState<Odontogram>(initial ?? {});
  const [status, setStatus] = useState<string>("caries");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function colorFor(t: number): string {
    const st = teeth[String(t)]?.status;
    const found = TOOTH_STATUSES.find((s) => s.value === st);
    return found ? found.color : "#ffffff";
  }

  function clickTooth(t: number) {
    setTeeth((prev) => {
      const key = String(t);
      const next = { ...prev };
      if (next[key]?.status === status) {
        delete next[key]; // segundo click con el mismo estado -> limpia
      } else {
        next[key] = { ...next[key], status };
      }
      return next;
    });
  }

  async function save() {
    setSaving(true);
    await saveOdontogram(patientId, teeth);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const Tooth = ({ t }: { t: number }) => (
    <button
      onClick={() => clickTooth(t)}
      title={teeth[String(t)]?.status ?? "sano"}
      className="flex h-10 w-10 flex-col items-center justify-center rounded border border-slate-300 text-[11px] font-medium hover:ring-2 hover:ring-brand/40"
      style={{ backgroundColor: colorFor(t) }}
    >
      {t}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-600">Estado a aplicar:</span>
          {TOOTH_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatus(s.value)}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                status === s.value
                  ? "ring-brand"
                  : "ring-slate-200"
              }`}
            >
              <span
                className="inline-block h-3 w-3 rounded-full border border-slate-300"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400">
          Elegí un estado y hacé click en las piezas. Volver a clickear con el mismo
          estado la deja sana.
        </p>
      </div>

      <div className="card space-y-3 overflow-x-auto">
        <div className="flex gap-1">
          {TEETH_UPPER.map((t) => (
            <Tooth key={t} t={t} />
          ))}
        </div>
        <div className="flex gap-1">
          {TEETH_LOWER.map((t) => (
            <Tooth key={t} t={t} />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-emerald-600">✓ Guardado</span>}
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? "Guardando…" : "Guardar odontograma"}
        </button>
      </div>
    </div>
  );
}
