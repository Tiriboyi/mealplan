import "server-only";
import { FOOD_CATEGORIES } from "./ingredients";
import type { PromoStatus } from "./retailers";
import type { Deal } from "./types";

const BASE = "https://www.prijsprofeet.nl/api/v1";
const PAGE_SIZE = 100;
// Promotions are scraped nightly, so a few hours of staleness costs nothing
// and keeps us well inside PrijsProfeet's rate limits.
const CACHE_MS = 3 * 60 * 60 * 1000;

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
};

type SearchResponse = { total: number; results: ApiProduct[] };

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

async function getPage(params: Record<string, string>, apiKey: string | undefined): Promise<SearchResponse> {
  const url = `${BASE}/search?${new URLSearchParams(params)}`;
  const headers: Record<string, string> = { "User-Agent": USER_AGENT, Accept: "application/json" };
  if (apiKey) headers["X-API-Key"] = apiKey;

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers, cache: "no-store" });
    if (res.ok) return (await res.json()) as SearchResponse;
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

async function fetchCategory(retailer: string, status: PromoStatus, category: string, apiKey?: string): Promise<Deal[]> {
  const deals: Deal[] = [];
  for (let page = 1; ; page++) {
    const data = await getPage(
      {
        q: "*",
        retailer,
        category,
        promotion_status: status,
        sort_by: "product_id:asc",
        page: String(page),
        page_size: String(PAGE_SIZE),
      },
      apiKey,
    );
    deals.push(...data.results.map(toDeal));
    if (data.results.length === 0 || page * PAGE_SIZE >= data.total) return deals;
  }
}

const cache = new Map<string, { at: number; deals: Promise<Deal[]> }>();

/** Food promotions for one retailer. Promotions are public data, so the cache is shared across keys. */
export function fetchDeals(retailer: string, status: PromoStatus, apiKey?: string): Promise<Deal[]> {
  const key = `${retailer}:${status}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.deals;

  const deals = (async () => {
    const all: Deal[] = [];
    for (const category of FOOD_CATEGORIES) all.push(...(await fetchCategory(retailer, status, category, apiKey)));
    return all;
  })();
  cache.set(key, { at: Date.now(), deals });
  deals.catch(() => cache.delete(key));
  return deals;
}
