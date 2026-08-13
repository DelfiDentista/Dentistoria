"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createAppointment(formData: FormData) {
  const supabase = await createClient();
  const starts = String(formData.get("starts_at") || "");
  if (!starts) throw new Error("Falta la fecha/hora del turno.");

  const { error } = await supabase.from("appointments").insert({
    patient_id: (String(formData.get("patient_id") || "") || null) as string | null,
    title: (String(formData.get("title") || "").trim() || null) as string | null,
    starts_at: new Date(starts).toISOString(),
    notes: (String(formData.get("notes") || "").trim() || null) as string | null,
  });
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
}

export async function deleteAppointment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/appointments");
}
