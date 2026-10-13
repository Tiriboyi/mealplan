import type { Deal } from "./types";

export type Purchase = {
  /** Units to buy: what you need, rounded up to the multi-buy when that is worth it. */
  units: number;
  pay: number;
  /** What the same units cost at the regular shelf price. */
  normal: number;
  saving: number;
  /** False when the multi-buy forces more than you need and the shelf price is cheaper. */
  atPromo: boolean;
};

const cents = (n: number) => Math.round(n * 100) / 100;

/**
 * Cheapest way to get at least `unitsNeeded` of a deal. Multi-buys ("2 voor X",
 * "1+1 gratis") come in bundles; leftover units are bought at the shelf price
 * when that beats rounding up to another bundle.
 */
export function purchase(deal: Deal, unitsNeeded = 1): Purchase {
  const step = deal.multiBuyQty && deal.multiBuyQty > 1 ? deal.multiBuyQty : 1;
  const bundle = step > 1 && deal.multiBuyPrice ? deal.multiBuyPrice : step * deal.price;
  const shelf = deal.originalPrice && deal.originalPrice > deal.price ? deal.originalPrice : null;
  const needed = Math.max(1, Math.ceil(unitsNeeded));
  const bundles = Math.floor(needed / step);
  const loose = needed - bundles * step;

  let units = needed;
  let pay = bundles * bundle;
  if (loose > 0) {
    if (shelf !== null && loose * shelf < bundle) pay += loose * shelf;
    else [units, pay] = [(bundles + 1) * step, pay + bundle];
  }
  pay = cents(pay);
  // No published regular price means no provable saving, so claim none.
  const normal = shelf !== null ? cents(units * shelf) : pay;
  const saving = cents(Math.max(0, normal - pay));
  return { units, pay, normal, saving, atPromo: saving > 0 || shelf === null };
}

/** Pack size in grams (ml counted as g), or null for "per stuk", "2 stuks" and the like. */
export function packGrams(quantity: string | null): number | null {
  if (!quantity) return null;
  const q = quantity.toLowerCase().replace(/,/g, ".");
  const m = q.match(/(?:(\d+)\s*x\s*)?(\d+(?:\.\d+)?)\s*(kg|kilogram|kilo|gram|gr|g|ml|cl|liter|l)\b/);
  if (!m) return null;
  const perUnit = { kg: 1000, kilogram: 1000, kilo: 1000, gram: 1, gr: 1, g: 1, ml: 1, cl: 10, liter: 1000, l: 1000 }[
    m[3] as "kg"
  ];
  const grams = (m[1] ? Number(m[1]) : 1) * Number(m[2]) * perUnit;
  return grams > 0 ? grams : null;
}

/** Promo price per kg (or litre), for comparing packs of different sizes. */
export function pricePerKg(deal: Deal): number | null {
  if (deal.unitPrice && (deal.unit === "kg" || deal.unit === "l")) return deal.unitPrice;
  const g = packGrams(deal.quantity);
  return g ? (deal.price / g) * 1000 : null;
}
