/** Lowercase ASCII words separated by single spaces: "Calvé Ham-Kaas" -> "calve ham kaas". */
export function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9%]+/g, " ")
    .trim();
}

const eur = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });

export function money(n: number): string {
  return eur.format(n);
}

/** "2026-10-13" -> "Tue 13 Oct" */
export function shortDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}
