"use client";

import { useState } from "react";
import { createAppointment } from "@/app/(app)/appointments/actions";
import PatientPicker, { type PatientOpt } from "@/components/PatientPicker";

export default function AppointmentForm({ patients }: { patients: PatientOpt[] }) {
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
          <PatientPicker patients={patients} />

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Fecha</label>
              <input type="date" name="appt_date" required className="input" />
            </div>
            <div>
              <label className="label">Hora inicio</label>
              <input type="time" name="start_time" required className="input" />
            </div>
            <div>
              <label className="label">Hora fin</label>
              <input type="time" name="end_time" className="input" />
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
