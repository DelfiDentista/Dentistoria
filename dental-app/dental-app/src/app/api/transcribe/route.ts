import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `Sos un asistente que transcribe fichas odontológicas en papel (manuscritas) a datos estructurados.
Devolvés EXCLUSIVAMENTE un objeto JSON válido, sin texto adicional ni markdown.
Estructura exacta:
{
  "patient": {
    "first_name": string|null,
    "last_name": string|null,
    "dni": string|null,
    "birth_date": "YYYY-MM-DD"|null,
    "sex": "femenino"|"masculino"|"otro"|null,
    "phone": string|null,
    "email": string|null,
    "address": string|null,
    "insurance_name": string|null,
    "insurance_plan": string|null,
    "insurance_number": string|null
  },
  "medical_history": {
    "conditions": { "<grupo>": ["<condición>"] },
    "medication": [string],
    "allergies": [string],
    "comments": string
  },
  "evolution": [ { "note_date": "YYYY-MM-DD"|null, "body": string } ]
}
Reglas:
- Transcribí fielmente. Si un dato no está, usá null (o listas/objetos vacíos).
- Las fechas del formato dd-mm-aa o dd/mm/aa interpretalas con año 20aa.
- En "evolution", cada visita fechada es una entrada, en orden cronológico.
- No inventes datos que no estén en la imagen.`;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta configurar ANTHROPIC_API_KEY en el servidor." },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  // El archivo se sube antes a Supabase Storage (bucket "fichas") y acá se recibe su ruta.
  let path = "";
  let mime = "";
  try {
    const body = await req.json();
    path = String(body.path || "");
    mime = String(body.mime || "");
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }
  if (!path) {
    return NextResponse.json({ error: "Falta la ruta del archivo." }, { status: 400 });
  }

  const { data: blob, error: dlErr } = await supabase.storage
    .from("fichas")
    .download(path);
  if (dlErr || !blob) {
    return NextResponse.json(
      { error: "No se pudo leer el archivo subido." },
      { status: 502 }
    );
  }

  const bytes = Buffer.from(await blob.arrayBuffer());
  if (bytes.byteLength > 28 * 1024 * 1024) {
    return NextResponse.json(
      { error: "El archivo supera los 28 MB." },
      { status: 400 }
    );
  }
  const base64 = bytes.toString("base64");

  const isPdf = mime === "application/pdf" || path.toLowerCase().endsWith(".pdf");
  const allowedImg = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const mediaType = allowedImg.includes(mime) ? mime : "image/jpeg";

  const block = isPdf
    ? {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: base64 },
      }
    : {
        type: "image",
        source: { type: "base64", media_type: mediaType, data: base64 },
      };

  const content = [
    block,
    { type: "text", text: "Transcribí esta ficha odontológica al JSON indicado." },
  ] as unknown as Anthropic.MessageParam["content"];

  const anthropic = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

  try {
    const msg = await anthropic.messages.create({
      model,
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: "user", content }],
    });

    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    const json = extractJson(text);
    if (!json) {
      return NextResponse.json(
        { error: "La IA no devolvió un JSON válido. Probá con un archivo más nítido." },
        { status: 502 }
      );
    }
    return NextResponse.json(json);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al llamar a la IA.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

function extractJson(text: string): unknown | null {
  let t = text.trim();
  t = t.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch {
    return null;
  }
}
