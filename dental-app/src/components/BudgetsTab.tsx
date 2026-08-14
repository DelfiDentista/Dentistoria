"use client";

import { useState } from "react";
import {
  createBudget,
  deleteBudget,
  addBudgetItem,
  deleteBudgetItem,
  setBudgetItemDone,
} from "@/app/(app)/patients/budget-actions";
import { money, formatDate } from "@/lib/format";
import type { Budget, BudgetItem, Procedure } from "@/lib/types";

function todayInput() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function BudgetsTab({
  patientId,
  budgets,
  items,
  procedures,
  paidByBudget,
}: {
  patientId: string;
  budgets: Budget[];
  items: BudgetItem[];
  procedures: Procedure[];
  paidByBudget: Record<string, number>;
}) {
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  function itemsOf(budgetId: string) {
    return items.filter((it) => it.budget_id === budgetId);
  }
  function totalOf(budgetId: string) {
    return itemsOf(budgetId).reduce(
      (s, it) => s + it.quantity * Number(it.unit_price),
      0
    );
  }
  function statusOf(total: number, paid: number) {
    if (paid <= 0) return { label: "Pendiente", cls: "bg-slate-100 text-slate-600" };
    if (total - paid <= 0) return { label: "Saldado", cls: "bg-amber-100 text-amber-700" };
    return { label: "Con movimiento", cls: "bg-emerald-100 text-emerald-700" };
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Presupuestos</h2>
        <button onClick={() => setCreating((v) => !v)} className="btn-primary">
          + Nuevo presupuesto
        </button>
      </div>

      {creating && (
        <form
          action={async (fd) => {
            await createBudget(patientId, fd);
            setCreating(false);
          }}
          className="card grid gap-3 sm:grid-cols-[2fr_1fr_auto]"
        >
          <input name="description" required className="input" placeholder="Descripción (ej. Rehabilitación)" />
          <input name="budget_date" type="date" defaultValue={todayInput()} className="input" />
          <button className="btn-primary">Crear</button>
        </form>
      )}

      {budgets.length === 0 && !creating && (
        <div className="card text-center text-slate-400">
          Este paciente no tiene presupuestos.
        </div>
      )}

      <div className="space-y-3">
        {budgets.map((b) => {
          const total = totalOf(b.id);
          const paid = paidByBudget[b.id] ?? 0;
          const saldo = total - paid;
          const st = statusOf(total, paid);
          const open = openId === b.id;
          return (
            <div key={b.id} className="card space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">N° {b.number}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>
                  <p className="text-lg font-bold">{b.description}</p>
                  <p className="text-xs text-slate-500">{formatDate(b.budget_date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Valor total</p>
                  <p className="font-bold text-emerald-700">{money(total)}</p>
                  <p className="text-xs text-slate-500">Saldo: {money(saldo)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setOpenId(open ? null : b.id)} className="btn-ghost text-sm">
                  {open ? "Ocultar prestaciones" : "Ver prestaciones"}
                </button>
                <form action={deleteBudget.bind(null, b.id, patientId)}>
                  <button className="text-xs text-slate-400 hover:text-red-600">Eliminar</button>
                </form>
              </div>

              {open && (
                <div className="space-y-3 border-t border-slate-100 pt-3">
                  {itemsOf(b.id).length === 0 && (
                    <p className="text-sm text-slate-400">Sin prestaciones cargadas.</p>
                  )}
                  {itemsOf(b.id).map((it) => (
                    <div key={it.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">
                            {it.code ? it.code + " · " : ""}
                            {it.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Piezas: {it.teeth || "—"} · Cantidad: {it.quantity} · Realizadas:{" "}
                            {it.done_count}/{it.quantity}
                          </p>
                          <p className="text-xs text-slate-500">
                            Unitario: {money(Number(it.unit_price))} · Total:{" "}
                            <span className="font-medium text-emerald-700">
                              {money(it.quantity * Number(it.unit_price))}
                            </span>
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <form
                            action={setBudgetItemDone.bind(
                              null,
                              it.id,
                              patientId,
                              Math.min(it.quantity, it.done_count + 1)
                            )}
                          >
                            <button
                              className="rounded border border-slate-200 px-2 py-0.5 text-xs hover:bg-white"
                              title="Marcar una como realizada"
                            >
                              ✓
                            </button>
                          </form>
                          <form action={deleteBudgetItem.bind(null, it.id, patientId)}>
                            <button className="text-xs text-slate-400 hover:text-red-600">✕</button>
                          </form>
                        </div>
                      </div>
                    </div>
                  ))}

                  <AddItemForm budgetId={b.id} patientId={patientId} procedures={procedures} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AddItemForm({
  budgetId,
  patientId,
  procedures,
}: {
  budgetId: string;
  patientId: string;
  procedures: Procedure[];
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  function pick(id: string) {
    const p = procedures.find((x) => x.id === id);
    if (p) {
      setCode(p.code ?? "");
      setName(p.name);
      setPrice(p.price ? String(p.price) : "");
    }
  }

  return (
    <form
      action={async (fd) => {
        await addBudgetItem(budgetId, patientId, fd);
        setCode("");
        setName("");
        setPrice("");
      }}
      className="grid gap-2 rounded-lg border border-dashed border-slate-200 p-3 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <label className="label">Prestación (del catálogo)</label>
        <select
          onChange={(e) => pick(e.target.value)}
          defaultValue=""
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
      </div>
      <input name="code" value={code} onChange={(e) => setCode(e.target.value)} className="input" placeholder="Código" />
      <input name="name" value={name} onChange={(e) => setName(e.target.value)} required className="input" placeholder="Descripción" />
      <input name="teeth" className="input" placeholder="Piezas (ej. 12, 11, 21)" />
      <input name="quantity" type="number" min={1} defaultValue={1} className="input" placeholder="Cantidad" />
      <input name="unit_price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="input" placeholder="Importe unitario" />
      <button className="btn-primary sm:col-span-2">Agregar prestación</button>
    </form>
  );
}
