"use client";

import { useState } from "react";
import { createAppointment } from "@/app/(app)/appointments/actions";

type Opt = { id: string; label: string };

export default function AppointmentForm({ patients }: { patients: Opt[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setOpen((v) => !v)} className="btn-primary">
        + Nuevo turno
      </button>
      {open && (
        <form
          action={async (fd) => {
            await createAppointment(fd);
            setOpen(false);
          }}
          className="card mt-4 space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Paciente</label>
              <select name="patient_id" className="input">
                <option value="">— Sin asignar —</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Fecha y hora</label>
              <input type="datetime-local" name="starts_at" required className="input" />
            </div>
          </div>
          <div>
            <label className="label">Motivo</label>
            <input name="title" className="input" placeholder="Ej: Control, endodoncia…" />
          </div>
          <div>
            <label className="label">Notas</label>
            <textarea name="notes" rows={2} className="input" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
              Cancelar
            </button>
            <button className="btn-primary">Guardar turno</button>
          </div>
        </form>
      )}
    </div>
  );
}
