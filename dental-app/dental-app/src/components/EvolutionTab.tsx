"use client";

import { useState } from "react";
import { addEvolutionNote, deleteEvolutionNote } from "@/app/(app)/patients/actions";
import { formatDateTime } from "@/lib/format";
import type { EvolutionNote } from "@/lib/types";

function nowLocalInput(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

export default function EvolutionTab({
  patientId,
  notes,
}: {
  patientId: string;
  notes: EvolutionNote[];
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(nowLocalInput());
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!body.trim()) return;
    setSaving(true);
    await addEvolutionNote(patientId, date, body.trim());
    setSaving(false);
    setBody("");
    setDate(nowLocalInput());
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Evolución</h2>
        <button onClick={() => setOpen((v) => !v)} className="btn-primary">
          + Nueva entrada
        </button>
      </div>

      {open && (
        <div className="card space-y-3">
          <div>
            <label className="label">Fecha</label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Trabajo realizado</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="input"
              placeholder="Describí la visita…"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="btn-ghost">
              Cancelar
            </button>
            <button onClick={add} disabled={saving} className="btn-primary">
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      )}

      {notes.length === 0 && !open && (
        <div className="card text-center text-slate-400">
          Aún no hay evolución para este paciente.
        </div>
      )}

      <ol className="space-y-3">
        {notes.map((n) => (
          <li key={n.id} className="card">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-semibold text-brand">
                {formatDateTime(n.note_date)}
              </span>
              <form action={deleteEvolutionNote.bind(null, n.id, patientId)}>
                <button
                  className="text-xs text-slate-400 hover:text-red-600"
                  title="Eliminar"
                >
                  Eliminar
                </button>
              </form>
            </div>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{n.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
