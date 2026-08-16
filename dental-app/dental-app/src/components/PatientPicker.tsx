"use client";

import { useEffect, useRef, useState } from "react";

export type PatientOpt = { id: string; label: string };

// Buscador de pacientes con autocompletado. Si lo que se escribe no
// coincide con ningún paciente existente, ofrece crearlo al vuelo
// ("(Nuevo)"), pidiendo solo nombre y apellido para no trabar la agenda.
export default function PatientPicker({
  patients,
  defaultPatientId,
  defaultLabel,
}: {
  patients: PatientOpt[];
  defaultPatientId?: string | null;
  defaultLabel?: string;
}) {
  const [query, setQuery] = useState(defaultLabel ?? "");
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    defaultPatientId ?? null
  );
  const [isNew, setIsNew] = useState(false);
  const [newFirst, setNewFirst] = useState("");
  const [newLast, setNewLast] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const q = query.trim().toLowerCase();
  const matches = q
    ? patients.filter((p) => p.label.toLowerCase().includes(q)).slice(0, 6)
    : [];
  const exactMatch = patients.some((p) => p.label.toLowerCase() === q);

  function pickExisting(p: PatientOpt) {
    setSelectedId(p.id);
    setIsNew(false);
    setQuery(p.label);
    setOpen(false);
  }

  function pickNew() {
    setSelectedId(null);
    setIsNew(true);
    setOpen(false);
    const parts = query.trim().split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
      setNewLast(parts[parts.length - 1]);
      setNewFirst(parts.slice(0, -1).join(" "));
    } else {
      setNewFirst(parts[0] ?? "");
      setNewLast("");
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <label className="label">Paciente</label>
      <input
        className="input"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedId(null);
          setIsNew(false);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Escribí el nombre del paciente…"
        autoComplete="off"
      />
      {/* Estos son los valores que realmente viajan al servidor */}
      <input type="hidden" name="patient_id" value={selectedId ?? ""} />

      {open && q && (
        <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {matches.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => pickExisting(p)}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              {p.label}
            </button>
          ))}
          {matches.length === 0 && (
            <div className="px-3 py-2 text-xs text-slate-400">
              Sin coincidencias
            </div>
          )}
          {!exactMatch && (
            <button
              type="button"
              onClick={pickNew}
              className="block w-full border-t border-slate-100 px-3 py-2 text-left text-sm font-medium text-brand hover:bg-slate-50"
            >
              {query.trim()}{" "}
              <span className="font-normal text-slate-400">(Nuevo)</span>
            </button>
          )}
        </div>
      )}

      {isNew && (
        <div className="mt-2 grid gap-2 rounded-lg bg-brand/5 p-3 sm:grid-cols-2">
          <p className="text-xs text-slate-500 sm:col-span-2">
            Paciente nuevo — completá nombre y apellido. El resto de la ficha
            se carga después.
          </p>
          <div>
            <label className="label">Nombre *</label>
            <input
              name="new_patient_first_name"
              className="input"
              value={newFirst}
              onChange={(e) => setNewFirst(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Apellido *</label>
            <input
              name="new_patient_last_name"
              className="input"
              value={newLast}
              onChange={(e) => setNewLast(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">DNI</label>
            <input name="new_patient_dni" className="input" />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input name="new_patient_phone" className="input" />
          </div>
        </div>
      )}
    </div>
  );
}
