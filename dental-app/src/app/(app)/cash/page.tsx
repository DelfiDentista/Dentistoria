import { createClient } from "@/lib/supabase/server";
import { fullName, formatDateTime, money } from "@/lib/format";
import PaymentForm from "@/components/PaymentForm";
import { deletePayment } from "./actions";
import type { Payment, Patient } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CashPage() {
  const supabase = await createClient();

  const [{ data: pays }, { data: patients }] = await Promise.all([
    supabase.from("payments").select("*").order("paid_at", { ascending: false }).limit(300),
    supabase.from("patients").select("id, first_name, last_name").order("last_name"),
  ]);

  const list = (pays as Payment[]) ?? [];
  const pmap = new Map(
    ((patients as Patient[]) ?? []).map((p) => [p.id, fullName(p)])
  );
  const opts = ((patients as Patient[]) ?? []).map((p) => ({
    id: p.id,
    label: fullName(p),
  }));

  const now = new Date();
  const monthTotal = list
    .filter((p) => {
      const d = new Date(p.paid_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, p) => s + Number(p.amount), 0);
  const total = list.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Caja</h1>
          <p className="text-sm text-slate-500">Registro de pagos</p>
        </div>
        <PaymentForm patients={opts} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <p className="text-sm text-slate-500">Ingresos del mes</p>
          <p className="text-2xl font-bold text-emerald-600">{money(monthTotal)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Total registrado</p>
          <p className="text-2xl font-bold">{money(total)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Paciente</th>
              <th className="px-4 py-3 font-medium">Concepto</th>
              <th className="px-4 py-3 font-medium">Método</th>
              <th className="px-4 py-3 text-right font-medium">Importe</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Sin pagos registrados.
                </td>
              </tr>
            )}
            {list.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-600">{formatDateTime(p.paid_at)}</td>
                <td className="px-4 py-3">
                  {p.patient_id ? pmap.get(p.patient_id) ?? "—" : "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">{p.concept ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500">{p.method}</td>
                <td className="px-4 py-3 text-right font-medium">{money(Number(p.amount))}</td>
                <td className="px-4 py-3 text-right">
                  <form action={deletePayment.bind(null, p.id)}>
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
    </div>
  );
}
