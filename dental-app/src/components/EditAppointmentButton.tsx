"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateAppointment } from "@/app/(app)/appointments/actions";
import PatientPicker, { type PatientOpt } from "@/components/PatientPicker";
import type { Appointment } from "@/lib/types";

const STATUSES = ["agendado", "confirmado", "atendido", "cancelado", "ausente"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
// ISO/UTC -> {fecha, horaInicio, horaFin} en hora Argentina, para precargar el form.
function isoToParts(iso: string, tz = "America/Argentina/Buenos_Aires") {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  let hh = get("hour");
  if (hh === "24") hh = "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${hh}:${get("minute")}` };
}

export default function EditAppointmentButton({
  appointment,
  patients,
}: {
  appointment: Appointment;
  patients: PatientOpt[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const action = updateAppointment.bind(null, appointment.id);

  const startParts = isoToParts(appointment.starts_at);
  const endParts = appointment.ends_at ? isoToParts(appointment.ends_at) : null;
  const currentPatientLabel =
    patients.find((p) => p.id === appointment.patient_id)?.label ?? "";

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

            <PatientPicker
              patients={patients}
              defaultPatientId={appointment.patient_id}
              defaultLabel={currentPatientLabel}
            />

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="label">Fecha</label>
                <input
                  type="date"
                  name="appt_date"
                  defaultValue={startParts.date}
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label">Hora inicio</label>
                <input
                  type="time"
                  name="start_time"
                  defaultValue={startParts.time}
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label">Hora fin</label>
                <input
                  type="time"
                  name="end_time"
                  defaultValue={endParts?.time ?? ""}
                  className="input"
                />
              </div>
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
