"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateAppointment } from "@/app/(app)/appointments/actions";
import { isoToArInput } from "@/lib/dates";
import type { Appointment } from "@/lib/types";

const STATUSES = ["agendado", "confirmado", "atendido", "cancelado", "ausente"];

export default function EditAppointmentButton({
  appointment,
  patients,
}: {
  appointment: Appointment;
  patients: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const action = updateAppointment.bind(null, appointment.id);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-slate-500 hover:text-brand"
      >
        Editar
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setOpen(false)}
        >
          <form
            action={async (fd) => {
              setSaving(true);
              await action(fd);
              setSaving(false);
              setOpen(false);
              router.refresh();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-3 rounded-xl bg-white p-5 shadow-xl"
          >
            <h3 className="font-semibold">Editar turno</h3>
            <div>
              <label className="label">Paciente</label>
              <select
                name="patient_id"
                defaultValue={appointment.patient_id ?? ""}
                className="input"
              >
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
              <input
                type="datetime-local"
                name="starts_at"
                defaultValue={isoToArInput(appointment.starts_at)}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Motivo</label>
              <input
                name="title"
                defaultValue={appointment.title ?? ""}
                className="input"
              />
            </div>
            <div>
              <label className="label">Estado</label>
              <select
                name="status"
                defaultValue={appointment.status}
                className="input"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Notas</label>
              <textarea
                name="notes"
                defaultValue={appointment.notes ?? ""}
                rows={2}
                className="input"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-ghost"
              >
                Cancelar
              </button>
              <button className="btn-primary" disabled={saving}>
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
