"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { addAttachment, deleteAttachment } from "@/app/(app)/patients/attachment-actions";
import { formatDateTime } from "@/lib/format";

export type AttachmentWithUrl = {
  id: string;
  storage_path: string;
  kind: string | null;
  created_at: string;
  url: string | null;
};

// Muestra un nombre legible a partir de la ruta guardada
// (ej: "patients/abc/1734000000-radiografia.jpg" -> "radiografia.jpg")
function displayName(path: string) {
  const last = path.split("/").pop() ?? path;
  return last.replace(/^\d+-/, "");
}

export default function FilesTab({
  patientId,
  attachments,
}: {
  patientId: string;
  attachments: AttachmentWithUrl[];
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      for (const file of Array.from(files)) {
        const safeName = file.name.replace(/[^\w.\-]/g, "_");
        const path = `patients/${patientId}/${Date.now()}-${safeName}`;
        const { error: upErr } = await supabase.storage
          .from("fichas")
          .upload(path, file, {
            contentType: file.type || undefined,
            upsert: false,
          });
        if (upErr) throw new Error(upErr.message);
        await addAttachment(patientId, path, "archivo");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir el archivo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Archivos</h2>
        <label className="btn-primary cursor-pointer">
          {uploading ? "Subiendo…" : "+ Subir archivo"}
          <input
            type="file"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {attachments.length === 0 && (
        <div className="card text-center text-slate-400">
          Todavía no hay archivos para este paciente. Podés subir
          radiografías, fotos, estudios o cualquier documento (PDF, JPEG,
          PNG, etc.).
        </div>
      )}

      <ul className="space-y-2">
        {attachments.map((a) => (
          <li
            key={a.id}
            className="card flex flex-wrap items-center justify-between gap-3"
          >
            <div>
              <p className="text-sm font-medium">{displayName(a.storage_path)}</p>
              <p className="text-xs text-slate-500">{formatDateTime(a.created_at)}</p>
            </div>
            <div className="flex items-center gap-3">
              {a.url ? (
                
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-brand hover:underline"
                >
                  Descargar
                </a>
              ) : (
                <span className="text-xs text-slate-400">Link no disponible</span>
              )}
              <form action={deleteAttachment.bind(null, a.id, patientId, a.storage_path)}>
                <button className="text-xs text-slate-400 hover:text-red-600">
                  Eliminar
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
