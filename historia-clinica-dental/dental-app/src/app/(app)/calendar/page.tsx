import { createClient } from "@/lib/supabase/server";
import { fullName } from "@/lib/format";
import WeekCalendar from "@/components/WeekCalendar";
import type { Appointment, Patient } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const supabase = await createClient();

  const [{ data: appts }, { data: patients }] = await Promise.all([
    supabase
      .from("appointments")
      .select("*")
      .order("starts_at", { ascending: true })
      .limit(1000),
    supabase.from("patients").select("id, first_name, last_name").order("last_name"),
  ]);

  const list = ((patients as Patient[]) ?? []).map((p) => ({
    id: p.id,
    label: fullName(p),
  }));
  const nameMap: Record<string, string> = {};
  ((patients as Patient[]) ?? []).forEach((p) => {
    nameMap[p.id] = fullName(p);
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Calendario</h1>
      <WeekCalendar
        appointments={(appts as Appointment[]) ?? []}
        patientNames={nameMap}
        patients={list}
      />
    </div>
  );
}
