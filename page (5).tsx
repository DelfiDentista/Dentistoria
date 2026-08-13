import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fullName, age, formatDate } from "@/lib/format";
import type { Patient } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (q && q.trim()) {
    const term = `%${q.trim()}%`;
    query = query.or(
      `first_name.ilike.${term},last_name.ilike.${term},dni.ilike.${term}`
    );
  }

  const { data: patients } = await query;
  const list = (patients ?? []) as Patient[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pacientes</h1>
          <p className="text-sm text-slate-500">{list.length} resultados</p>
        </div>
        <Link href="/patients/new" className="btn-primary">
          + Nuevo paciente
        </Link>
      </div>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nombre o DNI…"
          className="input max-w-sm"
        />
        <button className="btn-ghost">Buscar</button>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Paciente</th>
              <th className="px-4 py-3 font-medium">DNI</th>
              <th className="px-4 py-3 font-medium">Edad</th>
              <th className="px-4 py-3 font-medium">Teléfono</th>
              <th className="px-4 py-3 font-medium">Alta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  No hay pacientes todavía.
                </td>
              </tr>
            )}
            {list.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/patients/${p.id}`}
                    className="font-medium text-brand hover:underline"
                  >
                    {fullName(p)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{p.dni ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {age(p.birth_date) ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">{p.phone ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500">
                  {formatDate(p.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
