# ADR-0002: Local SQLite copy of PrijsProfeet promotions

Status: Proposed
Date: 2026-10-23
RFC: RFC-2026-004

## Context
The app reads Dutch supermarket promotions from PrijsProfeet. Until commit `79081ad` it searched PrijsProfeet on demand and kept results in memory for three hours. That approach repeated large downloads after every restart, ran into PrijsProfeet's rate limits (about a minute per retailer without a key), and failed the page whenever PrijsProfeet was down. PrijsProfeet offers a `/products/changes` feed with a cursor (30 days of history) that makes incremental updates possible. The decision was made before devrailsv2 was adopted and is recorded here after the fact (ADR numbered 0002 because ADR-0001 is taken on the RFC-2026-001 branch).

## Decision
- Keep a local copy of each retailer's products in SQLite, using Node's built-in `node:sqlite` (`DatabaseSync`), in `DealStore` (`src/lib/dealStore.ts`). There is one row per product, holding the raw API product, plus a cursor and last-check time per retailer.
- Sync rules (`src/lib/prijsprofeet.ts`):
  - The first time a retailer is seen, note the feed's cursor, then download all its products.
  - After that, follow the changes feed at most every 15 minutes.
  - On 410 (cursor expired), download everything again.
  - On any other failure, log a warning and serve the copy already held.
  - Concurrent requests for a retailer share one sync.
- The file defaults to `.cache/prijsprofeet.db` (git-ignored). `MEALPLAN_DB` overrides it.
- `DealStore` and `prijsprofeet.ts` are server-only. The rest of `src/lib` stays free of browser and server dependencies.

## Consequences
- After the first download, pages are fast and need few PrijsProfeet calls, and the app keeps working when PrijsProfeet is down. Promotions can be up to 15 minutes (plus the feed's lag) stale.
- Node ≥ 22.13 is required (README). `node:sqlite` is built in, so no npm package or native build is needed. Its API is not yet marked fully stable in Node, so a Node upgrade could need small changes.
- The deployment needs a writable, persistent disk for the cache file. On serverless or read-only hosts the copy is lost or cannot be written, so each cold start downloads everything again.
- Storing the raw product means a mapping change needs no resync.
- The sync rules are covered by `src/lib/prijsprofeet.test.ts` (stubbed `fetch`, in-memory database), and the store by `src/lib/dealStore.test.ts`.

## Alternatives considered
- **Keep the in-memory three-hour cache:** simplest, but it lost everything on restart, hit rate limits, and failed when PrijsProfeet was down.
- **An npm SQLite package (`better-sqlite3`):** mature, but it is a native dependency to build and keep updated. The built-in module needs none.
- **A hosted database:** more setup and cost than a single-user planner needs.
- **A JSON file cache:** no transactions or indexed queries, and the whole file is rewritten on every change.
