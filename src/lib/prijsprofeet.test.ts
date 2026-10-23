import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

// `server-only` throws outside a React Server environment; this module only ever runs on the server.
vi.mock("server-only", () => ({}));

type Product = Record<string, unknown> & { product_id: string };
type Change = { change: "upsert" | "delete"; product_id: string; product: Product | null };

function product(id: string, over: Partial<Product> = {}): Product {
  return {
    product_id: id,
    name: `Product ${id}`,
    retailer: "jumbo",
    unified_category: "vlees",
    price: 2,
    original_price: 3,
    multi_buy_quantity: null,
    multi_buy_price: null,
    quantity: "400 g",
    unit: null,
    unit_price: null,
    promotional_keywords: null,
    valid_from: null,
    valid_until: null,
    product_url: null,
    promotion_status: "active",
    ...over,
  };
}

/** A stand-in for PrijsProfeet: a catalogue, a changes feed and a log of what was asked. */
function fakeApi() {
  const api = {
    catalogue: [] as Product[],
    cursor: 100,
    /** Pages the changes feed returns after a cursor, in order. */
    feed: [] as { cursor: number; has_more: boolean; changes: Change[] }[],
    /** Status for the changes feed to fail with, if any. */
    feedStatus: 0,
    calls: [] as string[],
  };
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string) => {
      const url = new URL(input);
      const params = url.searchParams;
      api.calls.push(`${url.pathname.replace("/api/v1", "")}?${params}`);
      // Let a second caller arrive while this request is still in flight.
      await new Promise((r) => setTimeout(r, 5));
      if (url.pathname.endsWith("/products/changes")) {
        if (!params.has("cursor")) return json({ cursor: api.cursor, has_more: false, changes: [] });
        if (api.feedStatus) return json({ error: "no" }, api.feedStatus);
        return json(api.feed.shift() ?? { cursor: Number(params.get("cursor")), has_more: false, changes: [] });
      }
      const page = Number(params.get("page"));
      const size = Number(params.get("page_size"));
      return json({ total: api.catalogue.length, products: api.catalogue.slice((page - 1) * size, page * size) });
    }),
  );
  return api;
}

const MINUTE = 60_000;
let now = Date.parse("2026-10-23T12:00:00Z");

async function load() {
  vi.resetModules();
  return import("./prijsprofeet");
}

const names = (deals: { id: string }[]) => deals.map((d) => d.id);

beforeEach(() => {
  vi.stubEnv("MEALPLAN_DB", ":memory:");
  vi.useFakeTimers({ toFake: ["Date"] });
  now = Date.parse("2026-10-23T12:00:00Z");
  vi.setSystemTime(now);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const later = (minutes: number) => vi.setSystemTime((now += minutes * MINUTE));

describe("keeping the local copy of promotions", () => {
  // RFC-2026-004:AC-5
  test("the first request downloads the whole retailer once, after noting the feed's cursor", async () => {
    const api = fakeApi();
    api.catalogue = Array.from({ length: 150 }, (_, i) => product(`p${String(i).padStart(3, "0")}`));
    const { fetchDeals } = await load();

    const deals = await fetchDeals("jumbo", "active");
    expect(deals).toHaveLength(150);
    expect(api.calls[0]).toBe("/products/changes?retailer=jumbo&limit=500");
    expect(api.calls.slice(1).map((c) => new URLSearchParams(c.split("?")[1]).get("page"))).toEqual(["1", "2"]);
  });

  // RFC-2026-004:AC-6
  test("within 15 minutes the local copy is served without asking PrijsProfeet", async () => {
    const api = fakeApi();
    api.catalogue = [product("a")];
    const { fetchDeals } = await load();
    await fetchDeals("jumbo", "active");
    const asked = api.calls.length;

    later(14);
    expect(names(await fetchDeals("jumbo", "active"))).toEqual(["a"]);
    expect(api.calls).toHaveLength(asked);
  });

  // RFC-2026-004:AC-7
  test("after 15 minutes the changes since the cursor are applied, page by page", async () => {
    const api = fakeApi();
    api.catalogue = [product("a"), product("b")];
    const { fetchDeals } = await load();
    await fetchDeals("jumbo", "active");

    api.feed = [
      { cursor: 101, has_more: true, changes: [{ change: "delete", product_id: "a", product: null }] },
      { cursor: 102, has_more: false, changes: [{ change: "upsert", product_id: "c", product: product("c") }] },
    ];
    later(15);
    expect(names(await fetchDeals("jumbo", "active"))).toEqual(["b", "c"]);
    expect(api.calls.slice(-2)).toEqual([
      "/products/changes?retailer=jumbo&limit=500&cursor=100",
      "/products/changes?retailer=jumbo&limit=500&cursor=101",
    ]);
  });

  // RFC-2026-004:AC-8
  test("a cursor older than the feed keeps (410) means downloading the retailer again", async () => {
    const api = fakeApi();
    api.catalogue = [product("a")];
    const { fetchDeals } = await load();
    await fetchDeals("jumbo", "active");

    api.feedStatus = 410;
    api.catalogue = [product("z")];
    later(60 * 24 * 31);
    expect(names(await fetchDeals("jumbo", "active"))).toEqual(["z"]);
  });

  // RFC-2026-004:AC-9
  test("when PrijsProfeet fails, the local copy is served and the key is not logged", async () => {
    const api = fakeApi();
    api.catalogue = [product("a")];
    const { fetchDeals } = await load();
    await fetchDeals("jumbo", "active", "secret-key-123");

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    api.feedStatus = 500;
    later(15);
    expect(names(await fetchDeals("jumbo", "active", "secret-key-123"))).toEqual(["a"]);
    expect(warn).toHaveBeenCalledOnce();
    expect(JSON.stringify(warn.mock.calls, (_, v) => (v instanceof Error ? v.message : v))).not.toContain("secret-key-123");
  });

  // RFC-2026-004:AC-10
  test("two requests at once share one download", async () => {
    const api = fakeApi();
    api.catalogue = [product("a")];
    const { fetchDeals } = await load();

    const [first, second] = await Promise.all([fetchDeals("jumbo", "active"), fetchDeals("jumbo", "upcoming")]);
    expect(names(first)).toEqual(["a"]);
    expect(second).toEqual([]);
    expect(api.calls.filter((c) => c.startsWith("/products?"))).toHaveLength(1);
  });

  // RFC-2026-004:AC-3
  test("only food promotions of the asked status are returned, as deals", async () => {
    const api = fakeApi();
    api.catalogue = [
      product("meat", { name: "Kipfilet", price: 4.99, promotional_keywords: ["1+1 GRATIS"] }),
      product("beer", { unified_category: "bier-wijn-sterke-drank" }),
      product("soon", { promotion_status: "upcoming" }),
    ];
    const { fetchDeals } = await load();
    const deals = await fetchDeals("jumbo", "active");
    expect(names(deals)).toEqual(["meat"]);
    expect(deals[0]).toMatchObject({ id: "meat", name: "Kipfilet", price: 4.99, promoLabel: "1+1 GRATIS", category: "vlees" });
  });
});
