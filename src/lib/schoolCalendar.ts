import type { LunchKind } from "./lunches";

/**
 * Primary-school holidays for region Midden, which covers the province of Utrecht except
 * Eemnes and former Abcoude. Copied from rijksoverheid.nl "Overzicht schoolvakanties"
 * 2026-2027 and 2027-2028 on 2026-11-07. The autumn and spring dates are advice: a school
 * may differ. Add the next school year once the government publishes it.
 */
export const HOLIDAYS: { name: string; from: string; to: string }[] = [
  { name: "Herfstvakantie", from: "2026-10-17", to: "2026-10-25" },
  { name: "Kerstvakantie", from: "2026-12-19", to: "2027-01-03" },
  { name: "Voorjaarsvakantie", from: "2027-02-20", to: "2027-02-28" },
  { name: "Meivakantie", from: "2027-04-24", to: "2027-05-02" },
  { name: "Zomervakantie", from: "2027-07-17", to: "2027-08-29" },
  { name: "Herfstvakantie", from: "2027-10-16", to: "2027-10-24" },
  { name: "Kerstvakantie", from: "2027-12-25", to: "2028-01-09" },
  { name: "Voorjaarsvakantie", from: "2028-02-26", to: "2028-03-05" },
  { name: "Meivakantie", from: "2028-04-29", to: "2028-05-07" },
  { name: "Zomervakantie", from: "2028-07-08", to: "2028-08-20" },
];

/** After this date holidays are unknown and every weekday counts as a school day. */
export const KNOWN_UNTIL = HOLIDAYS[HOLIDAYS.length - 1].to;

/** "2026-11-09" for the local calendar day of `d`. */
export function isoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Noon, so adding days never trips over a clock change. */
export function fromIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(iso: string, days: number): string {
  const d = fromIso(iso);
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

export function isSchoolDay(iso: string): boolean {
  const weekday = fromIso(iso).getDay();
  if (weekday === 0 || weekday === 6) return false;
  return !HOLIDAYS.some((h) => h.from <= iso && iso <= h.to);
}

/**
 * The lunches a day needs. On a full school day the kids take a snack and a lunchbox and the
 * adults have lunch; on Wednesday school ends at noon, so after the snack the family eats
 * together. Weekends and holidays are a family lunch, and without kids every weekday is the
 * adults' lunch.
 */
export function lunchSlots(iso: string, kids: number): LunchKind[] {
  const school = isSchoolDay(iso);
  if (kids === 0) return [school ? "adult" : "family"];
  if (!school) return ["family"];
  return fromIso(iso).getDay() === 3 ? ["snack", "family"] : ["snack", "lunchbox", "adult"];
}
