"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bulkCreatePatients } from "@/app/(app)/import/actions";

type Row = {
  id: number;
  fileName: string;
  status: "ok" | "error" | "duplicate";
  selected: boolean;
  error?: string;
  first_name: string;
  last_name: string;
  dni: string;
  birth_date: string;
  sex: string;
  phone: string;
  address: string;
  insurance_name: string;
  insurance_plan: string;
  insurance_number: string;
  medical_history: MedicalHistoryLike | null;
  evolution: { note_date: string | null; body: string }[];
};

type MedicalHistoryLike = {
  conditions?: Record<string, string[]>;
  medication?: string[];
  allergies?: string[];
  comments?: string;
};

const STATUS_BADGE: Record<string, string> = {
  ok: "bg-emerald-100 text-emerald-700",
  duplicate: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
};

export default function BulkImport({ existingDnis }: { existingDnis: string[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const existing = new Set(existingDnis.map((d) => String(d).replace(/\D/g, "")));

  function countAntec(mh: MedicalHistoryLike | null): number {
    if (!mh) return 0;
    const c = mh.conditions
      ? Object.values(mh.conditions).reduce((s, arr) => s + arr.length, 0)
      : 0;
    return c + (mh.medication?.length ?? 0) + (mh.allergies?.length ?? 0);
  }

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setProcessing(true);
    setResult(null);
    setProgress({ done: 0, total: files.length });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let row: Row;
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/transcribe", { method: "POST", body: fd });
        if (!res.ok) {
          const t = await res.json().catch(() => ({}));
          throw new Error(t.error || "Error de transcripción");
        }
        const data = await res.json();
        const p = data.patient ?? {};
        const dniClean = String(p.dni ?? "").replace(/\D/g, "");
        const dup = !!dniClean && existing.has(dniClean);
        row = {
          id: Date.now() + i,
          fileName: file.name,
          status: dup ? "duplicate" : "ok",
          selected: !dup,
          first_name: p.first_name ?? "",
          last_name: p.last_name ?? "",
          dni: p.dni ?? "",
          birth_date: p.birth_date ?? "",
          sex: p.sex ?? "",
          phone: p.phone ?? "",
          address: p.address ?? "",
          insurance_name: p.insurance_name ?? "",
          insurance_plan: p.insurance_plan ?? "",
          insurance_number: p.insurance_number ?? "",
          medical_history: data.medical_history ?? null,
          evolution: Array.isArray(data.evolution) ? data.evolution : [],
        };
      } catch (err) {
        row = {
          id: Date.now() + i,
          fileName: file.name,
          status: "error",
          selected: false,
          error: err instanceof Error ? err.message : "Error",
          first_name: "",
          last_name: "",
          dni: "",
          birth_date: "",
          sex: "",
          phone: "",
          address: "",
          insurance_name: "",
          insurance_plan: "",
          insurance_number: "",
          medical_history: null,
          evolution: [],
        };
      }
      setRows((prev) => [...prev, row]);
      setProgress({ done: i + 1, total: files.length });
    }

    setProcessing(false);
    e.target.value = "";
  }

  function update(id: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function remove(id: number) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  const selectable = rows.filter(
    (r) => r.status !== "error" && r.first_name && r.last_name
  );
  const selectedCount = rows.filter((r) => r.selected && r.status !== "error").length;

  async function loadSelected() {
    const sel = rows.filter(
      (r) => r.selected && r.status !== "error" && r.first_name && r.last_name
    );
    if (!sel.length) return;
    setLoading(true);
    const payload = sel.map((r) => ({
      patient: {
        first_name: r.first_name,
        last_name: r.last_name,
        dni: r.dni || null,
        birth_date: r.birth_date || null,
        sex: r.sex || null,
        phone: r.phone || null,
        address: r.address || null,
        insurance_name: r.insurance_name || null,
        insurance_plan: r.insurance_plan || null,
        insurance_number: r.insurance_number || null,
      },
      medical_history: r.medical_history,
      evolution: r.evolution,
    }));
    const res = await bulkCreatePatients(payload);
    setLoading(false);
    setResult(
      `✓ Se cargaron ${res.created} pacientes.` +
        (res.errors.length ? ` ${res.errors.length} con error.` : "")
    );
    const loadedIds = new Set(sel.map((r) => r.id));
    setRows((prev) => prev.filter((r) => !loadedIds.has(r.id)));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3 border-dashed">
        <div>
          <p className="font-semibold">📤 Subir fichas escaneadas</p>
          <p className="text-sm text-slate-500">
            Un archivo por paciente (PDF o imagen). Podés seleccionar varios a la vez.
          </p>
        </div>
        <label className="btn-primary cursor-pointer">
          {processing ? "Procesando…" : "Seleccionar archivos"}
          <input
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="hidden"
            onChange={onFiles}
            disabled={processing}
          />
        </label>
      </div>

      {processing && (
        <div className="card">
          <p className="mb-2 text-sm text-slate-600">
            Procesando {progress.done} de {progress.total}…
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-brand transition-all"
              style={{
                width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {result && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {result}
        </p>
      )}

      {rows.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-500">
              {rows.length} fichas · {selectable.length} listas para cargar. Revisá y
              corregí antes de confirmar.
            </p>
            <button
              onClick={loadSelected}
              disabled={loading || selectedCount === 0}
              className="btn-primary"
            >
              {loading ? "Cargando…" : `Cargar ${selectedCount} pacientes`}
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2">Estado</th>
                  <th className="px-2 py-2">Apellido</th>
                  <th className="px-2 py-2">Nombre</th>
                  <th className="px-2 py-2">DNI</th>
                  <th className="px-2 py-2">Nacimiento</th>
                  <th className="px-2 py-2">Sexo</th>
                  <th className="px-2 py-2">Obra social</th>
                  <th className="px-2 py-2">Antec./Evol.</th>
                  <th className="px-2 py-2">Archivo</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className={r.status === "error" ? "bg-red-50/40" : ""}>
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={r.selected}
                        disabled={r.status === "error"}
                        onChange={(e) => update(r.id, { selected: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-brand"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          STATUS_BADGE[r.status]
                        }`}
                      >
                        {r.status === "ok"
                          ? "OK"
                          : r.status === "duplicate"
                          ? "DNI existe"
                          : "Error"}
                      </span>
                    </td>
                    {r.status === "error" ? (
                      <td colSpan={7} className="px-2 py-2 text-xs text-red-600">
                        {r.error}
                      </td>
                    ) : (
                      <>
                        <td className="px-2 py-2">
                          <input
                            value={r.last_name}
                            onChange={(e) => update(r.id, { last_name: e.target.value })}
                            className="w-28 rounded border border-slate-200 px-1 py-0.5"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={r.first_name}
                            onChange={(e) => update(r.id, { first_name: e.target.value })}
                            className="w-28 rounded border border-slate-200 px-1 py-0.5"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={r.dni}
                            onChange={(e) => update(r.id, { dni: e.target.value })}
                            className="w-24 rounded border border-slate-200 px-1 py-0.5"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="date"
                            value={r.birth_date}
                            onChange={(e) => update(r.id, { birth_date: e.target.value })}
                            className="rounded border border-slate-200 px-1 py-0.5"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={r.sex}
                            onChange={(e) => update(r.id, { sex: e.target.value })}
                            className="rounded border border-slate-200 px-1 py-0.5"
                          >
                            <option value="">—</option>
                            <option value="femenino">F</option>
                            <option value="masculino">M</option>
                            <option value="otro">Otro</option>
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={r.insurance_name}
                            onChange={(e) =>
                              update(r.id, { insurance_name: e.target.value })
                            }
                            className="w-24 rounded border border-slate-200 px-1 py-0.5"
                          />
                        </td>
                        <td className="px-2 py-2 text-xs text-slate-500">
                          {countAntec(r.medical_history)} / {r.evolution.length}
                        </td>
                      </>
                    )}
                    <td className="max-w-[140px] truncate px-2 py-2 text-xs text-slate-400">
                      {r.fileName}
                    </td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => remove(r.id)}
                        className="text-xs text-slate-400 hover:text-red-600"
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400">
            Se cargan Apellido, Nombre, DNI, nacimiento, sexo y obra social + los
            antecedentes y la evolución detectados. El odontograma se completa después
            en cada ficha.
          </p>
        </>
      )}
    </div>
  );
}
