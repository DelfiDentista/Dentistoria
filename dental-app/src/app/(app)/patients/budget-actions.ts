"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function s(v: FormDataEntryValue | null): string | null {
  const x = String(v ?? "").trim();
  return x === "" ? null : x;
}

export async function createBudget(patientId: string, formData: FormData) {
  const supabase = await createClient();
  const description = s(formData.get("description"));
  if (!description) throw new Error("El presupuesto necesita un nombre.");
  const { error } = await supabase.from("budgets").insert({
    patient_id: patientId,
    description,
    budget_date: s(formData.get("budget_date")) ?? new Date().toISOString().slice(0, 10),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
}

export async function updateBudget(
  id: string,
  patientId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const description = s(formData.get("description"));
  if (!description) throw new Error("El presupuesto necesita un nombre.");
  const { error } = await supabase
    .from("budgets")
    .update({
      description,
      budget_date: s(formData.get("budget_date")) ?? new Date().toISOString().slice(0, 10),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
}

export async function deleteBudget(id: string, patientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
}

export async function addBudgetItem(
  budgetId: string,
  patientId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const name = s(formData.get("name"));
  if (!name) throw new Error("La prestación necesita una descripción.");
  const { error } = await supabase.from("budget_items").insert({
    budget_id: budgetId,
    procedure_id: (String(formData.get("procedure_id") || "") || null) as string | null,
    code: s(formData.get("code")),
    name,
    teeth: s(formData.get("teeth")),
    quantity: Math.max(1, Number(formData.get("quantity")) || 1),
    unit_price: Number(formData.get("unit_price")) || 0,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
}

export async function updateBudgetItem(
  id: string,
  patientId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const name = s(formData.get("name"));
  if (!name) throw new Error("La prestación necesita una descripción.");
  const { error } = await supabase
    .from("budget_items")
    .update({
      procedure_id: (String(formData.get("procedure_id") || "") || null) as string | null,
      code: s(formData.get("code")),
      name,
      teeth: s(formData.get("teeth")),
      quantity: Math.max(1, Number(formData.get("quantity")) || 1),
      unit_price: Number(formData.get("unit_price")) || 0,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
}

export async function deleteBudgetItem(id: string, patientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("budget_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
}

export async function setBudgetItemDone(
  id: string,
  patientId: string,
  done: number
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("budget_items")
    .update({ done_count: Math.max(0, done) })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/patients/${patientId}`);
}
