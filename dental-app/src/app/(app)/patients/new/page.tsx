import Link from "next/link";
import PatientForm from "@/components/PatientForm";
import { createClient } from "@/lib/supabase/server";
import type { Insurer } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewPatientPage() {
  const supabase = await createClient();
  const { data: ins } = await supabase
    .from("insurers")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/patients" className="text-sm text-slate-500 hover:underline">
          ← Volver a pacientes
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Nuevo paciente</h1>
      </div>
      <PatientForm insurers={(ins as Insurer[]) ?? []} />
    </div>
  );
}
