"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addAttachment(
  patientId: string,
  storagePath: string,
  kind: string
) {
  const supabase = await createClient();
  const { error } = await supabase.from("attachments").insert({
    patient_id: patientId,
    storage_path: storagePath,
    kind: kind || "archivo",
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
}

export async function deleteAttachment(
  id: string,
  patientId: string,
  storagePath: string
) {
  const supabase = await createClient();
  await supabase.storage.from("fichas").remove([storagePath]);
  const { error } = await supabase.from("attachments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
}
