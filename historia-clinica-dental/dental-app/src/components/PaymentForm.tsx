"use client";

import { useState } from "react";
import { createPayment } from "@/app/(app)/cash/actions";

type Opt = { id: string; label: string };

export default function PaymentForm({ patients }: { patients: Opt[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setOpen((v) => !v)} className="btn-primary">
        + Registrar pago
      </button>
      {open && (
        <form
          action={async (fd) => {
            await createPayment(fd);
            setOpen(false);
          }}
          className="card mt-4 space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Paciente</label>
              <select name="patient_id" className="input">
                <option value="">— Sin asignar —</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Importe (ARS)</label>
              <input type="number" name="amount" step="0.01" required className="input" />
            </div>
            <div>
              <label className="label">Método</label>
              <select name="method" className="input">
                <option value="efectivo">Efectivo</option>
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
                <option value="transferencia">Transferencia</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="label">Fecha</label>
              <input type="datetime-local" name="paid_at" className="input" />
            </div>
          </div>
          <div>
            <label className="label">Concepto</label>
            <input name="concept" className="input" placeholder="Ej: Corona pieza 11" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
              Cancelar
            </button>
            <button className="btn-primary">Guardar pago</button>
          </div>
        </form>
      )}
    </div>
  );
}
