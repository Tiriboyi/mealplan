import { describe, expect, test } from "vitest";
import { DealStore, type StoredProduct } from "./dealStore";

function product(id: string, over: Partial<StoredProduct> = {}): StoredProduct {
  return { product_id: id, retailer: "jumbo", unified_category: "vlees", promotion_status: "active", ...over };
}

const ids = (rows: StoredProduct[]) => rows.map((r) => r.product_id);

describe("DealStore", () => {
  // RFC-2026-004:AC-1
  test("has no sync state until a retailer is downloaded", () => {
    expect(new DealStore(":memory:").syncState("jumbo")).toBeNull();
  });

  // RFC-2026-004:AC-2
  test("a full download replaces only that retailer's rows", () => {
    const store = new DealStore(":memory:");
    store.replaceRetailer("jumbo", [product("j1"), product("j2")], 10, 1000);
    store.replaceRetailer("plus", [product("p1", { retailer: "plus" })], 10, 1000);
    store.replaceRetailer("jumbo", [product("j3")], 20, 2000);

    expect(ids(store.products("jumbo", "active", ["vlees"]))).toEqual(["j3"]);
    expect(ids(store.products("plus", "active", ["vlees"]))).toEqual(["p1"]);
    expect(store.syncState("jumbo")).toEqual({ cursor: 20, checkedAt: 2000 });
  });

  // RFC-2026-004:AC-3
  test("filters by status and category", () => {
    const store = new DealStore(":memory:");
    store.replaceRetailer(
      "jumbo",
      [product("meat"), product("beer", { unified_category: "bier-wijn-sterke-drank" }), product("soon", { promotion_status: "upcoming" })],
      1,
    );
    expect(ids(store.products("jumbo", "active", ["vlees"]))).toEqual(["meat"]);
    expect(ids(store.products("jumbo", "upcoming", ["vlees"]))).toEqual(["soon"]);
  });

  // RFC-2026-004:AC-4
  test("applies changes in order and moves the cursor", () => {
    const store = new DealStore(":memory:");
    store.replaceRetailer("jumbo", [product("a"), product("b")], 5, 1000);
    store.applyChanges(
      "jumbo",
      [
        { change: "delete", product_id: "a", product: null },
        { change: "upsert", product_id: "c", product: product("c", { promotion_status: "upcoming" }) },
        // An upcoming promotion that starts: the last change wins.
        { change: "upsert", product_id: "c", product: product("c") },
      ],
      9,
      3000,
    );
    expect(ids(store.products("jumbo", "active", ["vlees"]))).toEqual(["b", "c"]);
    expect(store.products("jumbo", "upcoming", ["vlees"])).toEqual([]);
    expect(store.syncState("jumbo")).toEqual({ cursor: 9, checkedAt: 3000 });
  });

  // RFC-2026-004:AC-3
  test("keeps the whole product so new fields need no resync", () => {
    const store = new DealStore(":memory:");
    const full = { ...product("x"), name: "Kipfilet", price: 4.99 };
    store.replaceRetailer("jumbo", [full], 1);
    expect(store.products("jumbo", "active", ["vlees"])).toEqual([full]);
  });
});
