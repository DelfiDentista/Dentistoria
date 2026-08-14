"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { arInputToISO } from "@/lib/dates";

export async function createAppointment(formData: FormData) {
  const supabase = await createClient();
  const starts = String(formData.get("starts_at") || "");
  if (!starts) throw new Error("Falta la fecha/hora del turno.");

  const { error } = await supabase.from("appointments").insert({
    patient_id: (String(formData.get("patient_id") || "") || null) as string | null,
    title: (String(formData.get("title") || "").trim() || null) as string | null,
    starts_at: arInputToISO(starts),
    notes: (String(formData.get("notes") || "").trim() || null) as string | null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/appointments");
  revalidatePath("/calendar");
}

export async function updateAppointment(id: string, formData: FormData) {
  const supabase = await createClient();
  const starts = String(formData.get("starts_at") || "");
  if (!starts) throw new Error("Falta la fecha/hora del turno.");

  const { error } = await supabase
    .from("appointments")
    .update({
      patient_id: (String(formData.get("patient_id") || "") || null) as string | null,
      title: (String(formData.get("title") || "").trim() || null) as string | null,
      starts_at: arInputToISO(starts),
      status: String(formData.get("status") || "agendado"),
      notes: (String(formData.get("notes") || "").trim() || null) as string | null,
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
