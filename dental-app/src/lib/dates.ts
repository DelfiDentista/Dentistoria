// Utilidades de fecha/hora ancladas a la zona horaria de Argentina (UTC-3, sin horario de verano).

export const AR_TZ = "America/Argentina/Buenos_Aires";
const AR_OFFSET = "-03:00";

// Valor de <input type="datetime-local"> (hora Argentina) -> ISO en UTC para guardar.
export function arInputToISO(local: string): string {
  if (!local) return new Date().toISOString();
  // local = "YYYY-MM-DDTHH:MM"
  const withSeconds = local.length === 16 ? `${local}:00` : local;
  return new Date(`${withSeconds}${AR_OFFSET}`).toISOString();
}

// Fecha flexible ("YYYY-MM-DD" o "YYYY-MM-DDTHH:MM") -> ISO en hora Argentina.
export function flexibleToISO(value: string | null | undefined): string {
  if (!value) return new Date().toISOString();
  const v = value.length === 10 ? `${value}T12:00` : value;
  return arInputToISO(v);
}

// ISO/UTC -> valor para <input type="datetime-local"> mostrado en hora Argentina.
export function isoToArInput(iso: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: AR_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  let hh = get("hour");
  if (hh === "24") hh = "00";
  return `${get("year")}-${get("month")}-${get("day")}T${hh}:${get("minute")}`;
}
