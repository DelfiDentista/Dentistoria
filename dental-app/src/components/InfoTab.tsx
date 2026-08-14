"use client";

import { useState } from "react";
import { updatePatient } from "@/app/(app)/patients/actions";
import type { Patient, Insurer } from "@/lib/types";

export default function InfoTab({
  patient,
  insurers,
}: {
  patient: Patient;
  insurers: Insurer[];
}) {
  const [saved, setSaved] = useState(false);
  const action = updatePatient.bind(null, patient.id);

  return (
    <form
      action={async (fd) => {
        await action(fd);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }}
      className="card space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Datos del paciente</h2>
        {saved && <span className="text-sm text-emerald-600">✓ Guardado</span>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre *" name="first_name" defaultValue={patient.first_name} required />
        <Field label="Apellido *" name="last_name" defaultValue={patient.last_name} required />
        <Field label="DNI" name="dni" defaultValue={patient.dni} />
        <Field
          label="Fecha de nacimiento"
          name="birth_date"
          type="date"
          defaultValue={patient.birth_date}
        />
        <div>
          <label className="label">Sexo</label>
          <select name="sex" defaultValue={patient.sex ?? ""} className="input">
            <option value="">Seleccionar</option>
            <option value="femenino">Femenino</option>
            <option value="masculino">Masculino</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <Field label="Teléfono" name="phone" defaultValue={patient.phone} />
        <Field label="Email" name="email" type="email" defaultValue={patient.email} />
        <Field label="Domicilio" name="address" defaultValue={patient.address} />
      </div>

      <h3 className="pt-2 text-sm font-semibold text-slate-500">Obra social</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Nombre</label>
          <input
            name="insurance_name"
            list="insurers-list"
            defaultValue={patient.insurance_name ?? ""}
            className="input"
            placeholder="Elegí del catálogo o escribí"
          />
          <datalist id="insurers-list">
            {insurers.map((i) => (
              <option key={i.id} value={i.name} />
            ))}
          </datalist>
        </div>
        <Field label="Plan" name="insurance_plan" defaultValue={patient.insurance_plan} />
        <Field label="N.º afiliado" name="insurance_number" defaultValue={patient.insurance_number} />
      </div>

      <div>
        <label className="label">Notas</label>
        <textarea
          name="notes"
          defaultValue={patient.notes ?? ""}
          rows={3}
          className="input"
        />
      </div>

      <div className="flex justify-end">
        <button className="btn-primary">Guardar cambios</button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="input"
      />
    </div>
  );
}
