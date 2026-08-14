import { createClient } from "@/lib/supabase/server";
import BulkImport from "@/components/BulkImport";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("patients").select("dni");
  const existingDnis = ((data ?? []) as { dni: string | null }[])
    .map((r) => r.dni)
    .filter((d): d is string => !!d);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Importación masiva</h1>
        <p className="text-sm text-slate-500">
          Subí varias fichas escaneadas (un archivo por paciente). La IA las
          transcribe, las revisás y las cargás todas juntas.
        </p>
      </div>
      <BulkImport existingDnis={existingDnis} />
    </div>
  );
}
