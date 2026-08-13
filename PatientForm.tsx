"use client";

import { useState } from "react";
import { createPatient } from "@/app/(app)/patients/actions";
import type { MedicalHistoryData } from "@/lib/types";

type Fields = {
  first_name: string;
  last_name: string;
  dni: string;
  birth_date: string;
  sex: string;
  phone: string;
  email: string;
  address: string;
  insurance_name: string;
  insurance_plan: string;
  insurance_number: string;
  notes: string;
};

const EMPTY: Fields = {
  first_name: "",
  last_name: "",
  dni: "",
  birth_date: "",
  sex: "",
  phone: "",
  email: "",
  address: "",
  insurance_name: "",
  insurance_plan: "",
  insurance_number: "",
  notes: "",
};

export default function PatientForm() {
  const [f, setF] = useState<Fields>(EMPTY);
  const [mh, setMh] = useState<MedicalHistoryData | null>(null);
  const [evo, setEvo] = useState<{ note_date: string | null; body: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function set<K extends keyof Fields>(k: K, v: string) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setOk(false);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      if (!res.ok) {
        const t = await res.json().catch(() => ({}));
        throw new Error(t.error || "No se pudo transcribir la imagen.");
      }
      const data = await res.json();
      const p = data.patient ?? {};
      setF((prev) => ({
        ...prev,
        first_name: p.first_name ?? prev.first_name,
        last_name: p.last_name ?? prev.last_name,
        dni: p.dni ?? prev.dni,
        birth_date: p.birth_date ?? prev.birth_date,
        sex: p.sex ?? prev.sex,
        phone: p.phone ?? prev.phone,
        email: p.email ?? prev.email,
        address: p.address ?? prev.address,
        insurance_name: p.insurance_name ?? prev.insurance_name,
        insurance_plan: p.insurance_plan ?? prev.insurance_plan,
        insurance_number: p.insurance_number ?? prev.insurance_number,
      }));
      if (data.medical_history) setMh(data.medical_history);
      if (Array.isArray(data.evolution)) setEvo(data.evolution);
      setOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={createPatient} className="space-y-6">
      {/* Transcripción por IA */}
      <div className="card border-dashed">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">📸 Digitalizar ficha en papel</p>
            <p className="text-sm text-slate-500">
              Subí la foto de la ficha y la IA completa los campos automáticamente.
            </p>
          </div>
          <label className="btn-ghost cursor-pointer">
            {loading ? "Transcribiendo…" : "Subir foto"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFile}
              disabled={loading}
            />
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {ok && (
          <p className="mt-3 text-sm text-emerald-600">
            ✓ Datos cargados desde la foto
            {mh ? " · antecedentes detectados" : ""}
            {evo.length ? ` · ${evo.length} entradas de evolución` : ""}. Revisalos
            antes de guardar.
          </p>
        )}
      </div>

      {/* Datos personales */}
      <div className="card space-y-4">
        <h2 className="font-semibold">Datos del paciente</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Nombre *</label>
            <input
              name="first_name"
              required
              className="input"
              value={f.first_name}
              onChange={(e) => set("first_name", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Apellido *</label>
            <input
              name="last_name"
              required
              className="input"
              value={f.last_name}
              onChange={(e) => set("last_name", e.target.value)}
            />
          </div>
          <div>
            <label className="label">DNI</label>
            <input
              name="dni"
              className="input"
              value={f.dni}
              onChange={(e) => set("dni", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Fecha de nacimiento</label>
            <input
              type="date"
              name="birth_date"
              className="input"
              value={f.birth_date}
              onChange={(e) => set("birth_date", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Sexo</label>
            <select
              name="sex"
              className="input"
              value={f.sex}
              onChange={(e) => set("sex", e.target.value)}
            >
              <option value="">Seleccionar</option>
              <option value="femenino">Femenino</option>
              <option value="masculino">Masculino</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input
              name="phone"
              className="input"
              value={f.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              name="email"
              type="email"
              className="input"
              value={f.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Domicilio</label>
            <input
              name="address"
              className="input"
              value={f.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Obra social */}
      <div className="card space-y-4">
        <h2 className="font-semibold">Obra social</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Nombre</label>
            <input
              name="insurance_name"
              className="input"
              value={f.insurance_name}
              onChange={(e) => set("insurance_name", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Plan</label>
            <input
              name="insurance_plan"
              className="input"
              value={f.insurance_plan}
              onChange={(e) => set("insurance_plan", e.target.value)}
            />
          </div>
          <div>
            <label className="label">N.º de afiliado</label>
            <input
              name="insurance_number"
              className="input"
              value={f.insurance_number}
              onChange={(e) => set("insurance_number", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Payload de la transcripción (se guarda junto con el paciente) */}
      {mh && <input type="hidden" name="mh" value={JSON.stringify(mh)} />}
      {evo.length > 0 && (
        <input type="hidden" name="evo" value={JSON.stringify(evo)} />
      )}

      <div className="flex justify-end gap-2">
        <button type="submit" className="btn-primary">
          Crear paciente
        </button>
      </div>
    </form>
  );
}
