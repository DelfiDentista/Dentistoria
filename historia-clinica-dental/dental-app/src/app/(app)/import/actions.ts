"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { flexibleToISO } from "@/lib/dates";
import type { MedicalHistoryData } from "@/lib/types";

type ImportRecord = {
  patient: {
    first_name: string;
    last_name: string;
    dni: string | null;
    birth_date: string | null;
    sex: string | null;
    phone: string | null;
    address: string | null;
    insurance_name: string | null;
    insurance_plan: string | null;
    insurance_number: string | null;
  };
  medical_history?: MedicalHistoryData | null;
  evolution?: { note_date: string | null; body: string }[];
};

export async function bulkCreatePatients(records: ImportRecord[]) {
  const supabase = await createClient();
  let created = 0;
  const errors: { name: string; error: string }[] = [];

  for (const r of records) {
    const name = `${r.patient.last_name}, ${r.patient.first_name}`.trim();
    const { data, error } = await supabase
      .from("patients")
      .insert(r.patient)
      .select("id")
      .single();

    if (error || !data) {
      errors.push({ name, error: error?.message ?? "No se pudo crear" });
      continue;
    }
    const pid = data.id as string;

    if (r.medical_history) {
      await supabase
        .from("medical_histories")
        .upsert({ patient_id: pid, data: r.medical_history });
    }

    if (r.evolution && r.evolution.length) {
      const rows = r.evolution
        .filter((e) => e.body && e.body.trim())
        .map((e) => ({
          patient_id: pid,
          note_date: flexibleToISO(e.note_date),
          body: e.body,
        }));
      if (rows.length) await supabase.from("evolution_notes").insert(rows);
    }
    created++;
  }

  revalidatePath("/patients");
  return { created, errors };
}
