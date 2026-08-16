"use client";

import { useState } from "react";
import {
  createBudget,
  updateBudget,
  deleteBudget,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  setBudgetItemDone,
} from "@/app/(app)/patients/budget-actions";
import { money, formatDate, fullName } from "@/lib/format";
import type { Budget, BudgetItem, Procedure, Patient, Currency } from "@/lib/types";

const CLINIC_NAME = "Dra. Marina Delfina Clement";
const CLINIC_LICENSE = "M.N. 40786 · M.P. 91794";

function todayInput() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function BudgetsTab({
  patient,
  patientId,
  budgets,
  items,
  procedures,
  paidByBudget,
}: {
  patient: Patient;
  patientId: string;
  budgets: Budget[];
  items: BudgetItem[];
  procedures: Procedure[];
  paidByBudget: Record<string, number>;
}) {
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);

  function itemsOf(budgetId: string) {
    return items.filter((it) => it.budget_id === budgetId);
  }
  // Suma por moneda, ya que un mismo presupuesto puede tener ítems en ARS y en USD.
  function totalsOf(budgetId: string): Record<string, number> {
    const totals: Record<string, number> = {};
    itemsOf(budgetId).forEach((it) => {
      const cur = it.currency || "ARS";
      totals[cur] = (totals[cur] ?? 0) + it.quantity * Number(it.unit_price);
    });
    return totals;
  }
  function statusOf(total: number, paid: number) {
    if (paid <= 0) return { label: "Pendiente", cls: "bg-slate-100 text-slate-600" };
    if (total - paid <= 0) return { label: "Saldado", cls: "bg-amber-100 text-amber-700" };
    return { label: "Con movimiento", cls: "bg-emerald-100 text-emerald-700" };
  }

  async function downloadPdf(b: Budget) {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const marginX = 20;
    const rightEdge = 190;
    const pageBottom = 280;
    let y = 22;

    function ensureSpace(extra: number) {
      if (y + extra > pageBottom) {
        doc.addPage();
        y = 22;
      }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(CLINIC_NAME, marginX, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(CLINIC_LICENSE, marginX, y);
    y += 4;

    doc.setDrawColor(200);
    doc.line(marginX, y, rightEdge, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Paciente", marginX, y);
    y += 5.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(fullName(patient), marginX, y);
    y += 5;
    doc.text(`DNI: ${patient.dni ?? "—"}`, marginX, y);
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(b.description, marginX, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(100);
    doc.text(`Presupuesto N° ${b.number}`, marginX, y);
    doc.setTextColor(0);
    y += 8;

    const colProc = marginX;
    const colNote = 80;
    const colQty = 122;
    const colUnit = 158;
    const colSub = rightEdge;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("Prestación", colProc, y);
    doc.text("Nota", colNote, y);
    doc.text("Cant.", colQty, y, { align: "right" });
    doc.text("Precio unit.", colUnit, y, { align: "right" });
    doc.text("Subtotal", colSub, y, { align: "right" });
    y += 2;
    doc.setDrawColor(180);
    doc.line(marginX, y, rightEdge, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    const list = itemsOf(b.id);
    list.forEach((it) => {
      ensureSpace(10);
      const cur = it.currency || "ARS";
      const subtotal = it.quantity * Number(it.unit_price);
      const procLines = doc.splitTextToSize(
        `${it.code ? it.code + " · " : ""}${it.name}`,
        54
      );
      const noteLines = doc.splitTextToSize(it.teeth || "—", 36);
      const lineCount = Math.max(procLines.length, noteLines.length);

      doc.text(procLines, colProc, y);
      doc.text(noteLines, colNote, y);
      doc.text(String(it.quantity), colQty, y, { align: "right" });
      doc.text(money(Number(it.unit_price), cur as Currency), colUnit, y, { align: "right" });
      doc.text(money(subtotal, cur as Currency), colSub, y, { align: "right" });

      y += lineCount * 4.5 + 3;
    });

    ensureSpace(14);
    doc.setDrawColor(180);
    doc.line(marginX, y, rightEdge, y);
    y += 7;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const totals = totalsOf(b.id);
    Object.entries(totals).forEach(([cur, amt]) => {
      doc.text(`Total (${cur}): ${money(amt, cur as Currency)}`, rightEdge, y, { align: "right" });
      y += 6;
    });
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(`Fecha: ${formatDate(new Date().toISOString())}`, marginX, y);
    y += 10;

    ensureSpace(10);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      "Este presupuesto tiene una validez de 1 (un) mes a partir de la fecha de emisión.",
      marginX,
      pageBottom
    );

    const safeName = fullName(patient).replace(/[^\w]+/g, "_");
    doc.save(`Presupuesto_${safeName}_N${b.number}.pdf`);
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
          <div>
            <label className="label">Nombre</label>
            <input
              name="description"
              required
              className="input"
              placeholder="Ej: Rehabilitación integral, Tratamiento de conducto…"
            />
          </div>
          <div>
            <label className="label">Fecha</label>
            <input name="budget_date" type="date" defaultValue={todayInput()} className="input" />
          </div>
          <button className="btn-primary self-end">Crear</button>
        </form>
      )}

      {budgets.length === 0 && !creating && (
        <div className="card text-center text-slate-400">
          Este paciente no tiene presupuestos.
        </div>
      )}

      <div className="space-y-3">
        {budgets.map((b) => {
          const totals = totalsOf(b.id);
          const currencies = Object.keys(totals);
          const singleCurrency = currencies.length <= 1;
          const total = totals[currencies[0]] ?? 0;
          const paid = paidByBudget[b.id] ?? 0;
          const saldo = total - paid;
          const st = statusOf(total, paid);
          const open = openId === b.id;
          const editing = editingBudgetId === b.id;

          if (editing) {
            return (
              <form
                key={b.id}
                action={async (fd) => {
                  await updateBudget(b.id, patientId, fd);
                  setEditingBudgetId(null);
                }}
                className="card grid gap-3 sm:grid-cols-[2fr_1fr_auto] ring-1 ring-brand/30"
              >
                <div>
                  <label className="label">Nombre</label>
                  <input
                    name="description"
                    defaultValue={b.description}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Fecha</label>
                  <input
                    name="budget_date"
                    type="date"
                    defaultValue={b.budget_date?.slice(0, 10)}
                    className="input"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBudgetId(null)}
                    className="btn-ghost"
                  >
                    Cancelar
                  </button>
                  <button className="btn-primary">Guardar</button>
                </div>
              </form>
            );
          }

          return (
            <div key={b.id} className="card space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">N° {b.number}</span>
                    {singleCurrency && (
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${st.cls}`}>
                        {st.label}
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-bold">{b.description}</p>
                  <p className="text-xs text-slate-500">{formatDate(b.budget_date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Valor total</p>
                  {currencies.length === 0 && (
                    <p className="font-bold text-emerald-700">{money(0)}</p>
                  )}
                  {currencies.map((cur) => (
                    <p key={cur} className="font-bold text-emerald-700">
                      {money(totals[cur], cur as Currency)}
                    </p>
                  ))}
                  {singleCurrency && currencies.length === 1 && (
                    <p className="text-xs text-slate-500">
                      Saldo: {money(saldo, currencies[0] as Currency)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => setOpenId(open ? null : b.id)} className="btn-ghost text-sm">
                  {open ? "Ocultar prestaciones" : "Ver prestaciones"}
                </button>
                <button
                  onClick={() => downloadPdf(b)}
                  className="btn-ghost text-sm"
                  title="Descargar como PDF"
                >
                  Descargar PDF
                </button>
                <button
                  onClick={() => setEditingBudgetId(b.id)}
                  className="text-xs font-medium text-slate-500 hover:text-brand"
                >
                  Editar
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
                    <BudgetItemRow
                      key={it.id}
                      item={it}
                      patientId={patientId}
                      procedures={procedures}
                    />
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

function BudgetItemRow({
  item,
  patientId,
  procedures,
}: {
  item: BudgetItem;
  patientId: string;
  procedures: Procedure[];
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <ItemForm
        patientId={patientId}
        procedures={procedures}
        initial={item}
        onCancel={() => setEditing(false)}
        onSubmit={async (fd) => {
          await updateBudgetItem(item.id, patientId, fd);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <div className="rounded-lg bg-slate-50 p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">
            {item.code ? item.code + " · " : ""}
            {item.name}
          </p>
          <p className="text-xs text-slate-500">
            Nota: {item.teeth || "—"} · Cantidad: {item.quantity} · Realizadas:{" "}
            {item.done_count}/{item.quantity}
          </p>
          <p className="text-xs text-slate-500">
            Unitario: {money(Number(item.unit_price), item.currency ?? "ARS")} · Total:{" "}
            <span className="font-medium text-emerald-700">
              {money(item.quantity * Number(item.unit_price), item.currency ?? "ARS")}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <form
            action={setBudgetItemDone.bind(
              null,
              item.id,
              patientId,
              Math.min(item.quantity, item.done_count + 1)
            )}
          >
            <button
              className="rounded border border-slate-200 px-2 py-0.5 text-xs hover:bg-white"
              title="Marcar una como realizada"
            >
              ✓
            </button>
          </form>
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-slate-500 hover:text-brand"
          >
            Editar
          </button>
          <form action={deleteBudgetItem.bind(null, item.id, patientId)}>
            <button className="text-xs text-slate-400 hover:text-red-600">✕</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ItemForm({
  procedures,
  initial,
  onSubmit,
  onCancel,
}: {
  patientId: string;
  procedures: Procedure[];
  initial?: BudgetItem;
  onSubmit: (fd: FormData) => void | Promise<void>;
  onCancel?: () => void;
}) {
  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial ? String(initial.unit_price) : "");
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? "ARS");
  const [procedureId, setProcedureId] = useState(initial?.procedure_id ?? "");

  function pick(id: string) {
    setProcedureId(id);
    const p = procedures.find((x) => x.id === id);
    if (p) {
      setCode(p.code ?? "");
      setName(p.name);
      setPrice(p.price ? String(p.price) : "");
      setCurrency(p.currency ?? "ARS");
    }
  }

  return (
    <form
      action={async (fd) => {
        await onSubmit(fd);
        if (!initial) {
          setCode("");
          setName("");
          setPrice("");
          setCurrency("ARS");
          setProcedureId("");
        }
      }}
      className="grid gap-2 rounded-lg border border-dashed border-slate-200 p-3 sm:grid-cols-2"
    >
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="procedure_id" value={procedureId} />

      <div className="sm:col-span-2">
        <label className="label">Prestación (del catálogo)</label>
        <select onChange={(e) => pick(e.target.value)} defaultValue={procedureId} className="input">
          <option value="">— Elegir del catálogo —</option>
          {procedures.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code ? p.code + " · " : ""}
              {p.name}
              {p.price ? ` (${money(Number(p.price), p.currency ?? "ARS")})` : ""}
            </option>
          ))}
        </select>
        {!name && (
          <p className="mt-1 text-xs text-slate-400">
            Elegí una prestación del catálogo para continuar.
          </p>
        )}
      </div>

      <input
        name="teeth"
        defaultValue={initial?.teeth ?? ""}
        className="input sm:col-span-2"
        placeholder="Nota (ej: corona diente 14)"
      />

      <input
        name="quantity"
        type="number"
        min={1}
        defaultValue={initial?.quantity ?? 1}
        className="input"
        placeholder="Cantidad"
      />
      <div className="flex gap-2">
        <input
          name="unit_price"
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="input"
          placeholder="Precio unitario"
        />
        <select
          name="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
          className="input w-24"
        >
          <option value="ARS">ARS</option>
          <option value="USD">USD</option>
        </select>
      </div>

      <div className="flex gap-2 sm:col-span-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost">
            Cancelar
          </button>
        )}
        <button className="btn-primary flex-1" disabled={!name}>
          {initial ? "Guardar cambios" : "Agregar prestación"}
        </button>
      </div>
    </form>
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
  return (
    <ItemForm
      patientId={patientId}
      procedures={procedures}
      onSubmit={(fd) => addBudgetItem(budgetId, patientId, fd)}
    />
  );
}
