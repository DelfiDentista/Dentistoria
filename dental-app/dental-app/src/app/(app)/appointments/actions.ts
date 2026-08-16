"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { arInputToISO } from "@/lib/dates";

function str(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

// Arma el "YYYY-MM-DDTHH:MM" a partir de fecha + hora sueltas, y lo
// convierte a ISO en hora Argentina. Devuelve null si falta algún dato.
function combine(date: string, time: string): string | null {
  if (!date || !time) return null;
  return arInputToISO(`${date}T${time}`);
}

// Si el paciente todavía no existe (se creó al vuelo desde la Agenda),
// lo inserta y devuelve su id. Si ya existía, devuelve el id recibido.
async function resolvePatientId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  formData: FormData
): Promise<string | null> {
  const existingId = str(formData.get("patient_id"));
  if (existingId) return existingId;

  const firstName = str(formData.get("new_patient_first_name"));
  if (!firstName) return null; // sin paciente asignado (turno genérico)

  const { data, error } = await supabase
    .from("patients")
    .insert({
      first_name: firstName,
      last_name: str(formData.get("new_patient_last_name")) ?? "",
      dni: str(formData.get("new_patient_dni")),
      phone: str(formData.get("new_patient_phone")),
    })
    .select("id")
    .single();
  if (error) throw new Error("No se pudo crear el paciente: " + error.message);
  revalidatePath("/patients");
  return data.id as string;
}

export async function createAppointment(formData: FormData) {
  const supabase = await createClient();
  const date = String(formData.get("appt_date") || "");
  const startTime = String(formData.get("start_time") || "");
  const endTime = String(formData.get("end_time") || "");
  const startsISO = combine(date, startTime);
  if (!startsISO) throw new Error("Falta la fecha/hora del turno.");
  const endsISO = combine(date, endTime);

  const patientId = await resolvePatientId(supabase, formData);

  const { error } = await supabase.from("appointments").insert({
    patient_id: patientId,
    title: str(formData.get("title")),
    starts_at: startsISO,
    ends_at: endsISO,
    notes: str(formData.get("notes")),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/appointments");
  revalidatePath("/calendar");
}

export async function updateAppointment(id: string, formData: FormData) {
  const supabase = await createClient();
  const date = String(formData.get("appt_date") || "");
  const startTime = String(formData.get("start_time") || "");
  const endTime = String(formData.get("end_time") || "");
  const startsISO = combine(date, startTime);
  if (!startsISO) throw new Error("Falta la fecha/hora del turno.");
  const endsISO = combine(date, endTime);

  const patientId = await resolvePatientId(supabase, formData);

  const { error } = await supabase
    .from("appointments")
    .update({
      patient_id: patientId,
      title: str(formData.get("title")),
      starts_at: startsISO,
      ends_at: endsISO,
      status: String(formData.get("status") || "agendado"),
      notes: str(formData.get("notes")),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/appointments");
  revalidatePath("/calendar");
}

export async function setAppointmentStatus(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/appointments");
  revalidatePath("/calendar");
}

export async function deleteAppointment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/appointments");
  revalidatePath("/calendar");
}
