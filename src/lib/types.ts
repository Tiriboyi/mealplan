/** A promotion from PrijsProfeet, trimmed to the fields the planner uses. */
export type Deal = {
  id: string;
  name: string;
  retailer: string;
  category: string | null;
  /** Effective price per unit while the promotion runs. */
  price: number;
  /** Regular shelf price per unit; null when the retailer publishes none. */
  originalPrice: number | null;
  /** Units you must buy to get the promotion (2 for "2 voor 5", "1+1 gratis"). */
  multiBuyQty: number | null;
  /** Total for `multiBuyQty` units. */
  multiBuyPrice: number | null;
  /** Pack size as the retailer prints it, e.g. "ca. 350 g". */
  quantity: string | null;
  unit: string | null;
  unitPrice: number | null;
  promoLabel: string | null;
  validFrom: string | null;
  validUntil: string | null;
  url: string | null;
};

export type Prefs = {
  people: number;
  days: number;
  noPork: boolean;
  noShellfish: boolean;
  /** Extra words; any product whose name contains one is never suggested. */
  exclude: string[];
};

export const DEFAULT_PREFS: Prefs = {
  people: 2,
  days: 7,
  noPork: true,
  noShellfish: true,
  exclude: [],
};
