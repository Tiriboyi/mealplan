import "server-only";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DealStore, type ProductChange } from "./dealStore";
import { FOOD_CATEGORIES } from "./ingredients";
import type { PromoStatus } from "./retailers";
import type { Deal } from "./types";

const BASE = "https://www.prijsprofeet.nl/api/v1";
const PAGE_SIZE = 100;
// The changes feed lags the catalogue by about ten minutes, so asking more
// often than this gains nothing.
const CHECK_MS = 15 * 60 * 1000;

// PrijsProfeet asks integrations to identify themselves, and blocks keyless
// requests whose User-Agent contains "bot", "crawler" or "spider".
const USER_AGENT = `MealPlan/0.1 (${process.env.APP_CONTACT || "open-source weekly dinner planner"})`;

type ApiProduct = {
  product_id: string;
  name: string;
  retailer: string;
  unified_category: string | null;
  price: number;
  original_price: number | null;
  multi_buy_quantity: number | null;
  multi_buy_price: number | null;
  quantity: string | null;
  unit: string | null;
  unit_price: number | null;
  promotional_keywords: string[] | null;
  valid_from: string | null;
  valid_until: string | null;
  product_url: string | null;
  promotion_status: string | null;
};

type ListResponse = { total: number; products: ApiProduct[] };
type ChangesResponse = { cursor: number; has_more: boolean; changes: ProductChange<ApiProduct>[] };

export class PrijsProfeetError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function toDeal(p: ApiProduct): Deal {
  return {
    id: p.product_id,
    name: p.name,
    retailer: p.retailer,
    category: p.unified_category,
    price: p.price,
    originalPrice: p.original_price,
    multiBuyQty: p.multi_buy_quantity,
    multiBuyPrice: p.multi_buy_price,
    quantity: p.quantity,
    unit: p.unit,
    unitPrice: p.unit_price,
    promoLabel: p.promotional_keywords?.[0] ?? null,
    validFrom: p.valid_from,
    validUntil: p.valid_until,
    url: p.product_url,
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function get<T>(path: string, params: Record<string, string>, apiKey: string | undefined): Promise<T> {
  const url = `${BASE}${path}?${new URLSearchParams(params)}`;
  const headers: Record<string, string> = { "User-Agent": USER_AGENT, Accept: "application/json" };
  if (apiKey) headers["X-API-Key"] = apiKey;

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers, cache: "no-store" });
    if (res.ok) return (await res.json()) as T;
    if (res.status === 429 && attempt < 3) {
      const retryAfter = Number(res.headers.get("retry-after"));
      await sleep(Math.min(retryAfter > 0 ? retryAfter * 1000 : 5000, 30_000));
      continue;
    }
    if (res.status === 401 || res.status === 403)
      throw new PrijsProfeetError("PrijsProfeet rejected the API key. Check it in Settings.", res.status);
    if (res.status === 429)
      throw new PrijsProfeetError("PrijsProfeet rate limit reached. Wait a minute, or add an API key in Settings.", 429);
    throw new PrijsProfeetError(`PrijsProfeet answered ${res.status}.`, res.status);
  }
}

function changesSince(retailer: string, cursor: number | null, apiKey?: string) {
  const params: Record<string, string> = { retailer, limit: "500" };
  if (cursor !== null) params.cursor = String(cursor);
  return get<ChangesResponse>("/products/changes", params, apiKey);
}

/** Download every current promotion for a retailer, after noting where the changes feed stands. */
async function fullSync(retailer: string, apiKey?: string) {
  const { cursor } = await changesSince(retailer, null, apiKey);
  const products: ApiProduct[] = [];
  for (let page = 1; ; page++) {
    const data = await get<ListResponse>(
      "/products",
      { retailer, sort_by: "product_id", sort_order: "asc", page: String(page), page_size: String(PAGE_SIZE) },
      apiKey,
    );
    products.push(...data.products);
    if (data.products.length === 0 || page * PAGE_SIZE >= data.total) break;
  }
  store().replaceRetailer(retailer, products, cursor);
}

async function followChanges(retailer: string, cursor: number, apiKey?: string) {
  for (;;) {
    const data = await changesSince(retailer, cursor, apiKey);
    store().applyChanges(retailer, data.changes, data.cursor);
    if (!data.has_more) return;
    cursor = data.cursor;
  }
}

async function sync(retailer: string, apiKey?: string) {
  const state = store().syncState(retailer);
  if (state && Date.now() - state.checkedAt < CHECK_MS) return;
  if (!state) return fullSync(retailer, apiKey);
  try {
    await followChanges(retailer, state.cursor, apiKey);
  } catch (err) {
    // The feed keeps 30 days of changes; an older cursor means starting over.
    if (err instanceof PrijsProfeetError && err.status === 410) return fullSync(retailer, apiKey);
    // We already hold a copy: serve it rather than fail the page.
    console.warn(`PrijsProfeet sync for ${retailer} failed; serving the local copy.`, err);
  }
}

let db: DealStore | undefined;
function store() {
  if (!db) {
    const file = process.env.MEALPLAN_DB || join(process.cwd(), ".cache", "prijsprofeet.db");
    mkdirSync(dirname(file), { recursive: true });
    db = new DealStore(file);
  }
  return db;
}

const syncing = new Map<string, Promise<void>>();

/** Food promotions for one retailer, from the local copy after bringing it up to date. Promotions are public, so the copy is shared across keys. */
export async function fetchDeals(retailer: string, status: PromoStatus, apiKey?: string): Promise<Deal[]> {
  let pending = syncing.get(retailer);
  if (!pending) {
    pending = sync(retailer, apiKey).finally(() => syncing.delete(retailer));
    syncing.set(retailer, pending);
  }
  await pending;
  return store().products<ApiProduct>(retailer, status, FOOD_CATEGORIES).map(toDeal);
}
