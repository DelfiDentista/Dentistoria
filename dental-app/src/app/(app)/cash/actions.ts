"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createPayment(formData: FormData) {
  const supabase = await createClient();
  const amount = Number(formData.get("amount"));
  if (!amount || isNaN(amount)) throw new Error("Importe inválido.");

  const paidAt = String(formData.get("paid_at") || "");
  const { error } = await supabase.from("payments").insert({
    patient_id: (String(formData.get("patient_id") || "") || null) as string | null,
    amount,
    method: String(formData.get("method") || "efectivo"),
    concept: (String(formData.get("concept") || "").trim() || null) as string | null,
    paid_at: paidAt ? new Date(paidAt).toISOString() : new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/cash");
}

export async function deletePayment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/cash");
}
