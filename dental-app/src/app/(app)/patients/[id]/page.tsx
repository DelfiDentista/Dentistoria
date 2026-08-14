import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fullName, age } from "@/lib/format";
import PatientTabs from "@/components/PatientTabs";
import type {
  Patient,
  EvolutionNote,
  MedicalHistoryData,
  Odontogram,
  AccountEntry,
  Procedure,
  Insurer,
  Budget,
  BudgetItem,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PatientDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single();

  if (!patient) notFound();
  const p = patient as Patient;

  const [
    { data: mh },
    { data: notes },
    { data: odo },
    { data: account },
    { data: procs },
    { data: ins },
    { data: budgetsData },
    { data: budgetItemsData },
  ] = await Promise.all([
    supabase.from("medical_histories").select("data").eq("patient_id", id).maybeSingle(),
    supabase
      .from("evolution_notes")
      .select("*")
      .eq("patient_id", id)
      .order("note_date", { ascending: false }),
    supabase.from("odontograms").select("teeth").eq("patient_id", id).maybeSingle(),
    supabase
      .from("account_entries")
      .select("*")
      .eq("patient_id", id)
      .order("entry_date", { ascending: false }),
    supabase.from("procedures").select("*").order("code", { ascending: true }),
    supabase.from("insurers").select("*").order("name", { ascending: true }),
    supabase
      .from("budgets")
      .select("*")
      .eq("patient_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("budget_items")
      .select("*, budgets!inner(patient_id)")
      .eq("budgets.patient_id", id),
  ]);

  const accountEntries = (account as AccountEntry[]) ?? [];
  const paidByBudget: Record<string, number> = {};
  accountEntries.forEach((e) => {
    if (e.kind === "pago" && e.budget_id) {
      paidByBudget[e.budget_id] = (paidByBudget[e.budget_id] ?? 0) + Number(e.amount);
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/patients" className="text-sm text-slate-500 hover:underline">
          ← Pacientes
        </Link>
      </div>

      <div className="card flex flex-wrap items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-lg font-bold text-brand">
          {p.first_name?.[0]}
          {p.last_name?.[0]}
        </div>
        <div>
          <h1 className="text-xl font-bold">{fullName(p)}</h1>
          <p className="text-sm text-slate-500">
            DNI {p.dni ?? "—"}
            {age(p.birth_date) != null ? ` · ${age(p.birth_date)} años` : ""}
          </p>
        </div>
      </div>

      <PatientTabs
        patient={p}
        medicalHistory={(mh?.data as MedicalHistoryData) ?? {}}
        notes={(notes as EvolutionNote[]) ?? []}
        odontogram={(odo?.teeth as Odontogram) ?? {}}
        accountEntries={accountEntries}
        procedures={(procs as Procedure[]) ?? []}
        insurers={(ins as Insurer[]) ?? []}
        budgets={(budgetsData as Budget[]) ?? []}
        budgetItems={(budgetItemsData as unknown as BudgetItem[]) ?? []}
        paidByBudget={paidByBudget}
      />
    </div>
  );
}
