import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/format";
import {
  createProcedure,
  deleteProcedure,
  createInsurer,
  deleteInsurer,
} from "./actions";
import type { Procedure, Insurer } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CatalogsPage() {
  const supabase = await createClient();
  const [{ data: procs }, { data: ins }] = await Promise.all([
    supabase.from("procedures").select("*").order("code", { ascending: true }),
    supabase.from("insurers").select("*").order("name", { ascending: true }),
  ]);
  const procedures = (procs as Procedure[]) ?? [];
  const insurers = (ins as Insurer[]) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Catálogos</h1>
        <p className="text-sm text-slate-500">
          Estandarizá las prestaciones y las obras sociales para usarlas en toda la app.
        </p>
      </div>

      {/* Prestaciones */}
      <section className="space-y-4">
        <h2 className="font-semibold">Prestaciones</h2>

        <form action={createProcedure} className="card grid gap-3 sm:grid-cols-[1fr_2fr_1fr_auto]">
          <input name="code" className="input" placeholder="Código (ej. 04.01.08)" />
          <input name="name" required className="input" placeholder="Descripción (ej. Poste de fibra)" />
          <input name="price" type="number" step="0.01" className="input" placeholder="Precio" />
          <button className="btn-primary">Agregar</button>
        </form>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Código</th>
                <th className="px-4 py-2 font-medium">Descripción</th>
                <th className="px-4 py-2 text-right font-medium">Precio</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {procedures.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    Todavía no hay prestaciones cargadas.
                  </td>
                </tr>
              )}
              {procedures.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-500">{p.code ?? "—"}</td>
                  <td className="px-4 py-2 font-medium">{p.name}</td>
                  <td className="px-4 py-2 text-right">{money(Number(p.price))}</td>
                  <td className="px-4 py-2 text-right">
                    <form action={deleteProcedure.bind(null, p.id)}>
                      <button className="text-xs text-slate-400 hover:text-red-600">
                        Eliminar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Obras sociales */}
      <section className="space-y-4">
        <h2 className="font-semibold">Obras sociales</h2>

        <form action={createInsurer} className="card grid gap-3 sm:grid-cols-[1fr_auto]">
          <input name="name" required className="input" placeholder="Nombre (ej. OSDE, OMINT, OSPREN…)" />
          <button className="btn-primary">Agregar</button>
        </form>

        <div className="rounded-xl border border-slate-200 bg-white">
          {insurers.length === 0 && (
            <p className="px-4 py-6 text-center text-slate-400">
              Todavía no hay obras sociales cargadas.
            </p>
          )}
          <ul className="divide-y divide-slate-100">
            {insurers.map((i) => (
              <li key={i.id} className="flex items-center justify-between px-4 py-3">
                <span className="font-medium">{i.name}</span>
                <form action={deleteInsurer.bind(null, i.id)}>
                  <button className="text-xs text-slate-400 hover:text-red-600">
                    Eliminar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
