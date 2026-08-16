"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function s(v: FormDataEntryValue | null): string | null {
  const x = String(v ?? "").trim();
  return x === "" ? null : x;
}

export async function createProcedure(formData: FormData) {
  const supabase = await createClient();
  const name = s(formData.get("name"));
  if (!name) throw new Error("La prestación necesita una descripción.");
  const currency = String(formData.get("currency") || "ARS") === "USD" ? "USD" : "ARS";
  const { error } = await supabase.from("procedures").insert({
    code: s(formData.get("code")),
    name,
    price: Number(formData.get("price")) || 0,
    currency,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/catalogs");
}

export async function deleteProcedure(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("procedures").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/catalogs");
}

export async function createInsurer(formData: FormData) {
  const supabase = await createClient();
  const name = s(formData.get("name"));
  if (!name) throw new Error("La obra social necesita un nombre.");
  const { error } = await supabase.from("insurers").insert({ name });
  if (error) throw new Error(error.message);
  revalidatePath("/catalogs");
}

export async function deleteInsurer(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("insurers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/catalogs");
}
