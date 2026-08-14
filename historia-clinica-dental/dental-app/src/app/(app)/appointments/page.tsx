import { createClient } from "@/lib/supabase/server";
import { fullName, formatDateTime } from "@/lib/format";
import AppointmentForm from "@/components/AppointmentForm";
import EditAppointmentButton from "@/components/EditAppointmentButton";
import { setAppointmentStatus, deleteAppointment } from "./actions";
import type { Appointment, Patient } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  agendado: "bg-slate-100 text-slate-600",
  confirmado: "bg-blue-100 text-blue-700",
  atendido: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-red-100 text-red-700",
  ausente: "bg-amber-100 text-amber-700",
};

export default async function AppointmentsPage() {
  const supabase = await createClient();

  const [{ data: appts }, { data: patients }] = await Promise.all([
    supabase
      .from("appointments")
      .select("*")
      .gte("starts_at", new Date(Date.now() - 86400000).toISOString())
      .order("starts_at", { ascending: true })
      .limit(200),
    supabase.from("patients").select("id, first_name, last_name").order("last_name"),
  ]);

  const list = (appts as Appointment[]) ?? [];
  const pmap = new Map(
    ((patients as Patient[]) ?? []).map((p) => [p.id, fullName(p)])
  );
  const opts = ((patients as Patient[]) ?? []).map((p) => ({
    id: p.id,
    label: fullName(p),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Turnos</h1>
          <p className="text-sm text-slate-500">Próximos turnos del consultorio</p>
        </div>
        <AppointmentForm patients={opts} />
      </div>

      <div className="space-y-3">
        {list.length === 0 && (
          <div className="card text-center text-slate-400">
            No hay turnos próximos.
          </div>
        )}
        {list.map((a) => (
          <div key={a.id} className="card flex flex-wrap items-center gap-4">
            <div className="min-w-40">
              <p className="font-semibold">{formatDateTime(a.starts_at)}</p>
              <p className="text-sm text-slate-500">
                {a.patient_id ? pmap.get(a.patient_id) ?? "Paciente" : "Sin asignar"}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-700">{a.title ?? "—"}</p>
              {a.notes && <p className="text-xs text-slate-400">{a.notes}</p>}
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                STATUS_COLORS[a.status] ?? "bg-slate-100"
              }`}
            >
              {a.status}
            </span>
            <EditAppointmentButton appointment={a} patients={opts} />
            <form action={setAppointmentStatus.bind(null, a.id, "atendido")}>
              <button className="btn-ghost text-xs">Atendido</button>
            </form>
            <form action={deleteAppointment.bind(null, a.id)}>
              <button className="text-xs text-slate-400 hover:text-red-600">
                Eliminar
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
