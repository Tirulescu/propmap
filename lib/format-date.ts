/** Formato de fecha fijo para evitar mismatches de hidratación SSR/cliente. */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  const day = d.getUTCDate();
  const month = d.getUTCMonth() + 1;
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/** Valor para <input type="date"> coherente con formatDate (UTC). */
export function toDateInputValue(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
