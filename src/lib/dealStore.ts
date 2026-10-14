import { DatabaseSync } from "node:sqlite";

/**
 * Local copy of PrijsProfeet's promotions, one row per product.
 * Rows hold the raw API product so a change to how we map it never needs a resync.
 */

export type StoredProduct = {
  product_id: string;
  retailer: string;
  unified_category: string | null;
  promotion_status: string | null;
};

export type ProductChange<P extends StoredProduct = StoredProduct> = {
  change: "upsert" | "delete";
  product_id: string;
  product: P | null;
};

export type SyncState = { cursor: number; checkedAt: number };

export class DealStore {
  readonly db: DatabaseSync;

  constructor(path: string) {
    this.db = new DatabaseSync(path);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS products (
        product_id TEXT PRIMARY KEY,
        retailer   TEXT NOT NULL,
        status     TEXT,
        category   TEXT,
        json       TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS products_lookup ON products (retailer, status, category);
      CREATE TABLE IF NOT EXISTS sync (
        retailer   TEXT PRIMARY KEY,
        cursor     INTEGER NOT NULL,
        checked_at INTEGER NOT NULL
      );
    `);
  }

  syncState(retailer: string): SyncState | null {
    const row = this.db.prepare("SELECT cursor, checked_at FROM sync WHERE retailer = ?").get(retailer);
    return row ? { cursor: Number(row.cursor), checkedAt: Number(row.checked_at) } : null;
  }

  /** Swap in a full download for one retailer and remember where the changes feed stood before it. */
  replaceRetailer(retailer: string, products: StoredProduct[], cursor: number, now = Date.now()) {
    this.transaction(() => {
      this.db.prepare("DELETE FROM products WHERE retailer = ?").run(retailer);
      for (const p of products) this.upsert(p);
      this.saveCursor(retailer, cursor, now);
    });
  }

  /** Apply one page of the changes feed in order; the last change to a product wins. */
  applyChanges(retailer: string, changes: ProductChange[], cursor: number, now = Date.now()) {
    const remove = this.db.prepare("DELETE FROM products WHERE product_id = ?");
    this.transaction(() => {
      for (const c of changes) {
        if (c.change === "upsert" && c.product) this.upsert(c.product);
        else if (c.change === "delete") remove.run(c.product_id);
      }
      this.saveCursor(retailer, cursor, now);
    });
  }

  products<P extends StoredProduct>(retailer: string, status: string, categories: string[]): P[] {
    const marks = categories.map(() => "?").join(",");
    const rows = this.db
      .prepare(`SELECT json FROM products WHERE retailer = ? AND status = ? AND category IN (${marks}) ORDER BY product_id`)
      .all(retailer, status, ...categories);
    return rows.map((r) => JSON.parse(String(r.json)) as P);
  }

  private upsert(p: StoredProduct) {
    this.db
      .prepare("INSERT OR REPLACE INTO products (product_id, retailer, status, category, json) VALUES (?, ?, ?, ?, ?)")
      .run(p.product_id, p.retailer, p.promotion_status, p.unified_category, JSON.stringify(p));
  }

  private saveCursor(retailer: string, cursor: number, now: number) {
    this.db
      .prepare("INSERT OR REPLACE INTO sync (retailer, cursor, checked_at) VALUES (?, ?, ?)")
      .run(retailer, cursor, now);
  }

  private transaction(work: () => void) {
    this.db.exec("BEGIN");
    try {
      work();
      this.db.exec("COMMIT");
    } catch (err) {
      this.db.exec("ROLLBACK");
      throw err;
    }
  }
}
