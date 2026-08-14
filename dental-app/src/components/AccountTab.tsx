"use client";

import { useState } from "react";
import { addAccountEntry, deleteAccountEntry } from "@/app/(app)/patients/actions";
import { money, formatDate } from "@/lib/format";
import type { AccountEntry, Procedure, Budget } from "@/lib/types";

function todayInput(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function AccountTab({
  patientId,
  entries,
  procedures,
  budgets,
}: {
  patientId: string;
  entries: AccountEntry[];
  procedures: Procedure[];
  budgets: Budget[];
}) {
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS");
  const [modal, setModal] = useState<null | "prestacion" | "pago">(null);
  const [saving, setSaving] = useState(false);

  // Campos del formulario
  const [procId, setProcId] = useState("");
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayInput());
  const [invoiced, setInvoiced] = useState(false);

  // Saldo por moneda
  function balanceOf(cur: "ARS" | "USD") {
    return entries
      .filter((e) => e.currency === cur)
      .reduce((s, e) => s + (e.kind === "prestacion" ? Number(e.amount) : -Number(e.amount)), 0);
  }

  // Movimientos de la moneda seleccionada, con saldo acumulado, más nuevo primero
  const rows = (() => {
    const list = entries
      .filter((e) => e.currency === currency)
      .sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());
    let running = 0;
    const withBalance = list.map((e) => {
      running += e.kind === "prestacion" ? Number(e.amount) : -Number(e.amount);
      return { e, saldo: running };
    });
    return withBalance.reverse();
  })();

  function openModal(kind: "prestacion" | "pago") {
    setProcId("");
    setConcept("");
    setAmount("");
    setDate(todayInput());
    setInvoiced(false);
    setModal(kind);
  }

  function pickProcedure(id: string) {
    setProcId(id);
    const p = procedures.find((x) => x.id === id);
    if (p) {
      setConcept(`${p.code ? p.code + " " : ""}${p.name}`.trim());
      if (p.price) setAmount(String(p.price));
    }
  }

  async function submit(fd: FormData) {
    setSaving(true);
    await addAccountEntry(patientId, fd);
    setSaving(false);
    setModal(null);
  }

  return (
    <div className="space-y-4">
      {/* Saldos + moneda */}
      <div className="card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-slate-500">Saldo ARS</p>
              <p className="text-lg font-bold">{money(balanceOf("ARS"))}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Saldo USD</p>
              <p className="text-lg font-bold">
                {new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD" }).format(
                  balanceOf("USD")
                )}
              </p>
            </div>
          </div>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 text-sm">
            {(["ARS", "USD"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`rounded-md px-3 py-1 font-medium ${
                  currency === c ? "bg-brand text-white" : "text-slate-600"
                }`}
              >
                {c === "ARS" ? "Moneda local" : "USD"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openModal("prestacion")} className="btn-primary">
            + Prestación
          </button>
          <button onClick={() => openModal("pago")} className="btn-ghost">
            + Pago
          </button>
        </div>
      </div>

      {/* Movimientos */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Concepto</th>
              <th className="px-3 py-2 text-right font-medium">Debe</th>
              <th className="px-3 py-2 text-right font-medium">Haber</th>
              <th className="px-3 py-2 text-right font-medium">Saldo</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                  Sin movimientos en {currency === "ARS" ? "moneda local" : "USD"}.
                </td>
              </tr>
            )}
            {rows.map(({ e, saldo }) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 text-slate-500">{formatDate(e.entry_date)}</td>
                <td className="px-3 py-2">
                  {e.concept ?? "—"}
                  {e.invoiced && (
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                      FE
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right text-slate-700">
                  {e.kind === "prestacion" ? money(Number(e.amount)) : ""}
                </td>
                <td className="px-3 py-2 text-right text-emerald-700">
                  {e.kind === "pago" ? money(Number(e.amount)) : ""}
                </td>
                <td className="px-3 py-2 text-right font-medium">{money(saldo)}</td>
                <td className="px-3 py-2 text-right">
                  <form action={deleteAccountEntry.bind(null, e.id, patientId)}>
                    <button className="text-xs text-slate-400 hover:text-red-600">✕</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setModal(null)}
        >
          <form
            action={submit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-3 rounded-xl bg-white p-5 shadow-xl"
          >
            <h3 className="font-semibold">
              {modal === "prestacion" ? "Nueva prestación" : "Nuevo pago"}
            </h3>
            <input type="hidden" name="kind" value={modal} />

            {modal === "prestacion" && (
              <div>
                <label className="label">Prestación (del catálogo)</label>
                <select
                  name="procedure_id"
                  value={procId}
                  onChange={(e) => pickProcedure(e.target.value)}
                  className="input"
                >
                  <option value="">— Elegir del catálogo —</option>
                  {procedures.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code ? p.code + " · " : ""}
                      {p.name}
                      {p.price ? ` (${money(Number(p.price))})` : ""}
                    </option>
                  ))}
                </select>
                {procedures.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    No hay prestaciones en el catálogo. Cargalas en Catálogos.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="label">Concepto</label>
              <input
                name="concept"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                className="input"
                placeholder={modal === "pago" ? "Ej: A cuenta de tratamiento" : "Descripción"}
              />
            </div>

            {modal === "pago" && budgets.length > 0 && (
              <div>
                <label className="label">Imputar a presupuesto (opcional)</label>
                <select name="budget_id" className="input" defaultValue="">
                  <option value="">— Sin imputar —</option>
                  {budgets.map((b) => (
                    <option key={b.id} value={b.id}>
                      N° {b.number} · {b.description}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Importe</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Moneda</label>
                <select name="currency" defaultValue={currency} className="input">
                  <option value="ARS">Moneda local (ARS)</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 items-end gap-3">
              <div>
                <label className="label">Fecha</label>
                <input
                  type="date"
                  name="entry_date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input"
                />
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm">
                <input
                  type="checkbox"
                  name="invoiced"
                  checked={invoiced}
                  onChange={(e) => setInvoiced(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand"
                />
                Factura electrónica
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="btn-ghost">
                Cancelar
              </button>
              <button className="btn-primary" disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
