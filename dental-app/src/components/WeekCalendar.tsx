"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createAppointment } from "@/app/(app)/appointments/actions";
import type { Appointment } from "@/lib/types";

// Rango horario visible y tamaño de bloque
const START_HOUR = 8;
const END_HOUR = 21;
const SLOT_PX = 44; // alto de cada bloque de 30 min
const SLOTS = (END_HOUR - START_HOUR) * 2;
const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const STATUS_COLORS: Record<string, string> = {
  agendado: "bg-slate-200 text-slate-700 border-slate-300",
  confirmado: "bg-blue-100 text-blue-800 border-blue-300",
  atendido: "bg-emerald-100 text-emerald-800 border-emerald-300",
  cancelado: "bg-red-100 text-red-800 border-red-300",
  ausente: "bg-amber-100 text-amber-800 border-amber-300",
};

function mondayOf(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const off = (x.getDay() + 6) % 7; // 0 = lunes
  x.setDate(x.getDate() - off);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function WeekCalendar({
  appointments,
  patientNames,
  patients,
}: {
  appointments: Appointment[];
  patientNames: Record<string, string>;
  patients: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [weekStart, setWeekStart] = useState<Date>(() => mondayOf(new Date()));
  const [modal, setModal] = useState<{ open: boolean; dt: string }>({
    open: false,
    dt: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setWeekStart(mondayOf(new Date()));
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="card text-center text-slate-400">Cargando calendario…</div>
    );
  }

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  const parsed = appointments.map((a) => ({
    ...a,
    start: new Date(a.starts_at),
    end: a.ends_at ? new Date(a.ends_at) : null,
  }));

  function eventsForDay(day: Date) {
    return parsed
      .filter((a) => sameDay(a.start, day))
      .map((a) => {
        const startMin = a.start.getHours() * 60 + a.start.getMinutes();
        const durMin = a.end
          ? Math.max(30, (a.end.getTime() - a.start.getTime()) / 60000)
          : 30;
        const top = ((startMin - START_HOUR * 60) / 30) * SLOT_PX;
        const height = (durMin / 30) * SLOT_PX;
        return { a, top, height };
      })
      .filter((e) => e.top >= -SLOT_PX && e.top < SLOTS * SLOT_PX);
  }

  function openCreate(day: Date, e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const slot = Math.max(0, Math.min(SLOTS - 1, Math.floor(y / SLOT_PX)));
    const d = new Date(day);
    d.setHours(START_HOUR + Math.floor(slot / 2), (slot % 2) * 30, 0, 0);
    setModal({ open: true, dt: toLocalInput(d) });
  }

  async function submitCreate(fd: FormData) {
    setSaving(true);
    await createAppointment(fd);
    setSaving(false);
    setModal({ open: false, dt: "" });
    router.refresh();
  }

  const rangeLabel = `${days[0].toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  })} – ${days[6].toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;

  return (
    <div className="space-y-3">
      {/* Barra de navegación de semana */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setWeekStart(mondayOf(new Date()))} className="btn-ghost">
          Hoy
        </button>
        <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="btn-ghost px-3">
          ‹
        </button>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="btn-ghost px-3">
          ›
        </button>
        <span className="ml-1 text-sm font-medium text-slate-600">{rangeLabel}</span>
      </div>

      {/* Grilla del calendario */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div className="min-w-[720px]">
          {/* Encabezado de días */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-slate-200">
            <div />
            {days.map((d, i) => {
              const isToday = sameDay(d, today);
              return (
                <div
                  key={i}
                  className={`px-2 py-2 text-center text-xs font-medium ${
                    isToday ? "text-brand" : "text-slate-600"
                  }`}
                >
                  <div>{DAY_LABELS[i]}</div>
                  <div
                    className={`mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${
                      isToday ? "bg-brand text-white" : ""
                    }`}
                  >
                    {d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cuerpo con horas y columnas por día */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)]">
            {/* Columna de horas */}
            <div>
              {Array.from({ length: SLOTS }, (_, s) => (
                <div
                  key={s}
                  style={{ height: SLOT_PX }}
                  className="relative border-t border-slate-100"
                >
                  {s % 2 === 0 && (
                    <span className="absolute -top-2 right-1 text-[10px] text-slate-400">
                      {pad(START_HOUR + s / 2)}:00
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Columnas de días */}
            {days.map((day, di) => (
              <div
                key={di}
                onClick={(e) => openCreate(day, e)}
                className="relative cursor-pointer border-l border-slate-100"
              >
                {Array.from({ length: SLOTS }, (_, s) => (
                  <div
                    key={s}
                    style={{ height: SLOT_PX }}
                    className={`border-t ${
                      s % 2 === 0 ? "border-slate-100" : "border-slate-50"
                    }`}
                  />
                ))}
                {eventsForDay(day).map(({ a, top, height }) => (
                  <Link
                    key={a.id}
                    href={a.patient_id ? `/patients/${a.patient_id}` : "/calendar"}
                    onClick={(e) => e.stopPropagation()}
                    style={{ top, height: Math.max(height - 2, 20) }}
                    className={`absolute left-0.5 right-0.5 overflow-hidden rounded-md border px-1.5 py-0.5 text-[11px] leading-tight ${
                      STATUS_COLORS[a.status] ?? "bg-slate-200"
                    }`}
                  >
                    <div className="font-semibold">
                      {a.start.toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="truncate">
                      {a.patient_id
                        ? patientNames[a.patient_id] ?? "Paciente"
                        : a.title ?? "Turno"}
                    </div>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Tocá un espacio libre para crear un turno. Cada bloque es de 30 minutos
        (horario {pad(START_HOUR)}:00–{pad(END_HOUR)}:00).
      </p>

      {/* Modal de nuevo turno */}
      {modal.open && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setModal({ open: false, dt: "" })}
        >
          <form
            action={submitCreate}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-3 rounded-xl bg-white p-5 shadow-xl"
          >
            <h3 className="font-semibold">Nuevo turno</h3>
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
              <input
                type="datetime-local"
                name="starts_at"
                defaultValue={modal.dt}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Motivo</label>
              <input name="title" className="input" placeholder="Ej: Control, limpieza…" />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal({ open: false, dt: "" })}
                className="btn-ghost"
              >
                Cancelar
              </button>
              <button className="btn-primary" disabled={saving}>
                {saving ? "Guardando…" : "Guardar turno"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
