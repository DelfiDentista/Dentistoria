"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { arInputToISO } from "@/lib/dates";
import type { MedicalHistoryData, Odontogram } from "@/lib/types";

// Convierte una fecha (posible "YYYY-MM-DD" o "YYYY-MM-DDTHH:MM") a ISO en hora Argentina.
function toISO(value: string | null | undefined): string {
  if (!value) return new Date().toISOString();
  const v = value.length === 10 ? `${value}T12:00` : value;
  return arInputToISO(v);
}

function str(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

export async function createPatient(formData: FormData) {
  const supabase = await createClient();
  const payload = {
    first_name: str(formData.get("first_name")) ?? "",
    last_name: str(formData.get("last_name")) ?? "",
    dni: str(formData.get("dni")),
    birth_date: str(formData.get("birth_date")),
    sex: str(formData.get("sex")),
    phone: str(formData.get("phone")),
    email: str(formData.get("email")),
    address: str(formData.get("address")),
    insurance_name: str(formData.get("insurance_name")),
    insurance_plan: str(formData.get("insurance_plan")),
    insurance_number: str(formData.get("insurance_number")),
    notes: str(formData.get("notes")),
  };

  const { data, error } = await supabase
    .from("patients")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  const patientId = data.id as string;

  // Datos opcionales provenientes de la transcripción por IA
  const mhRaw = str(formData.get("mh"));
  if (mhRaw) {
    try {
      const mh = JSON.parse(mhRaw);
      await supabase
        .from("medical_histories")
        .upsert({ patient_id: patientId, data: mh });
    } catch {
      /* ignora JSON inválido */
    }
  }

  const evoRaw = str(formData.get("evo"));
  if (evoRaw) {
    try {
      const evo = JSON.parse(evoRaw) as { note_date: string | null; body: string }[];
      const rows = evo
        .filter((e) => e.body && e.body.trim())
        .map((e) => ({
          patient_id: patientId,
          note_date: toISO(e.note_date),
          body: e.body,
        }));
      if (rows.length) await supabase.from("evolution_notes").insert(rows);
    } catch {
      /* ignora JSON inválido */
    }
  }

  revalidatePath("/patients");
  redirect(`/patients/${patientId}`);
}

export async function updatePatient(id: string, formData: FormData) {
  const supabase = await createClient();
  const payload = {
    first_name: str(formData.get("first_name")) ?? "",
    last_name: str(formData.get("last_name")) ?? "",
    dni: str(formData.get("dni")),
    birth_date: str(formData.get("birth_date")),
    sex: str(formData.get("sex")),
    phone: str(formData.get("phone")),
    email: str(formData.get("email")),
    address: str(formData.get("address")),
    insurance_name: str(formData.get("insurance_name")),
    insurance_plan: str(formData.get("insurance_plan")),
    insurance_number: str(formData.get("insurance_number")),
    notes: str(formData.get("notes")),
  };
  const { error } = await supabase.from("patients").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${id}`);
}

export async function saveMedicalHistory(patientId: string, data: MedicalHistoryData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("medical_histories")
    .upsert({ patient_id: patientId, data, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
}

export async function addEvolutionNote(
  patientId: string,
  noteLocal: string,
  body: string
) {
  const supabase = await createClient();
  const { error } = await supabase.from("evolution_notes").insert({
    patient_id: patientId,
    note_date: toISO(noteLocal),
    body,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
}

export async function updateEvolutionNote(
  id: string,
  patientId: string,
  noteLocal: string,
  body: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("evolution_notes")
    .update({ note_date: toISO(noteLocal), body })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
}

export async function deleteEvolutionNote(id: string, patientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("evolution_notes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
}

export async function saveOdontogram(patientId: string, teeth: Odontogram) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("odontograms")
    .upsert({ patient_id: patientId, teeth, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
}

export async function addAccountEntry(patientId: string, formData: FormData) {
  const supabase = await createClient();
  const amount = Number(formData.get("amount"));
  if (!amount || isNaN(amount)) throw new Error("Importe inválido.");
  const kind = String(formData.get("kind") || "prestacion");
  const { error } = await supabase.from("account_entries").insert({
    patient_id: patientId,
    kind,
    concept: str(formData.get("concept")),
    procedure_id: (String(formData.get("procedure_id") || "") || null) as string | null,
    currency: String(formData.get("currency") || "ARS"),
    amount,
    invoiced: formData.get("invoiced") === "on",
    budget_id: (String(formData.get("budget_id") || "") || null) as string | null,
    entry_date: toISO(String(formData.get("entry_date") || "")),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
}

export async function deleteAccountEntry(id: string, patientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("account_entries").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
}
