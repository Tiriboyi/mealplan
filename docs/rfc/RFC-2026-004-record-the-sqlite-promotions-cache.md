---
id: RFC-2026-004
title: Record the SQLite promotions cache
status: approved
type: change
requested_by: Fortune Tiriboyi
decision_owner: Fortune Tiriboyi
approved_by: Fortune Tiriboyi <tiriboyifortune@gmail.com>
approved_on: 2026-10-23
created: 2026-10-23
updated: 2026-10-23
affected_areas: [src/lib/dealStore.ts, src/lib/dealStore.test.ts, src/lib/prijsprofeet.ts, src/lib/prijsprofeet.test.ts, .env.example, README.md, docs/adr/**]
---

# REQ-2026-004 - Record the SQLite promotions cache

## Request

This RFC records, after the fact, commit `79081ad` "Added SQLite" (made before devrailsv2 was adopted, on PR #2). That commit replaced the three-hour in-memory cache of PrijsProfeet promotions with a local SQLite copy (`node:sqlite`). The copy is filled by one full download per retailer and then kept current from PrijsProfeet's `/products/changes` feed. The RFC also adds tests for the sync rules in `prijsprofeet.ts`, which have none today, and records the new storage layer in an ADR.

No behaviour change is intended.

## Business Reason

The PR gate for PR #2 fails because `79081ad` is not covered by any RFC (`.env.example`, `README.md`, `src/lib/dealStore.ts`, `src/lib/dealStore.test.ts`, `src/lib/prijsprofeet.ts`). The local copy keeps the app inside PrijsProfeet's rate limits, makes pages fast after the first download, and keeps serving promotions when PrijsProfeet is down. The sync rules that deliver those benefits are untested.

## Current Evidence

Status: `Confirmed`

Claim type: `requirement`

Claim: The PR gate (`devrailsv2 check --ci`) on PR #2 lists `.env.example`, `README.md` and other files as not covered by RFC-2026-000. `git show --stat 79081ad` shows the commit touched `.env.example`, `README.md`, `src/lib/dealStore.ts`, `src/lib/dealStore.test.ts` and `src/lib/prijsprofeet.ts`.

Sources: CI output pasted by the requester (2026-10-23); `git show --stat 79081ad`.

Last verified: 2026-10-23

Status: `Confirmed`

Claim type: `behaviour`

Claim: `DealStore` (`src/lib/dealStore.ts`, built on `node:sqlite` `DatabaseSync`) keeps one row per product with the raw API product. It has `replaceRetailer`, `applyChanges`, `products(retailer, status, categories)`, `syncState` and `saveCursor`. Five existing tests in `src/lib/dealStore.test.ts` cover: no sync state before a download, a full download replacing only that retailer, filtering by status and category, applying changes in order with the cursor moving, and the whole product kept.

Sources: Serena `get_symbols_overview` of `src/lib/dealStore.ts` and `src/lib/dealStore.test.ts`; `npm test` (passing).

Last verified: 2026-10-23

Status: `Confirmed`

Claim type: `behaviour`

Claim: `fetchDeals(retailer, status, apiKey)` in `src/lib/prijsprofeet.ts` shares one in-flight sync per retailer, then reads from the store. `sync()` does nothing if the retailer was checked less than 15 minutes ago (`CHECK_MS`). It does a full download when there is no sync state, and otherwise follows the changes feed. A 410 (cursor older than the feed's 30 days) triggers a fresh full download. Any other error logs a warning and serves the local copy. The database file is `MEALPLAN_DB`, or `.cache/prijsprofeet.db` by default (`.cache/` is git-ignored). None of this has tests.

Sources: `git show 79081ad:src/lib/prijsprofeet.ts` (`sync`, `fetchDeals`, `store`); `.gitignore`; no `prijsprofeet.test.ts` in the repo.

Last verified: 2026-10-23

Status: `Likely`

Claim type: `dependency`

Claim: `node:sqlite` is built into Node (no npm package). The README requires Node 22.13+. It loads without warnings on the local Node 24.22.1. Its stability level in Node 22/24 is below "stable", so its API may still change between Node releases.

Sources: `README.md` (from `79081ad`); `node -e "require('node:sqlite')"` on Node 24.22.1 (2026-10-23); Node.js docs (not re-read for this RFC).

Last verified: 2026-10-23

## Desired Outcome

- The SQLite cache work in PR #2 is covered by an approved RFC, and the PR gate passes for those files.
- Every rule of the cache and sync behaviour has a named test.
- The decision to add a local SQLite storage layer is recorded in an ADR.

## Acceptance Criteria

- [x] AC-1: Given a new store, when a retailer has never been downloaded, then it has no sync state.
- [x] AC-2: Given stored products for several retailers, when one retailer is downloaded again in full, then only that retailer's rows are replaced, and its cursor and check time are saved.
- [x] AC-3: Given stored products, when products are read for a retailer, status and categories, then only matching rows are returned, with the whole stored product.
- [x] AC-4: Given a stored copy, when a batch of changes is applied, then deletes and upserts are applied in order (the last change wins) and the cursor moves to the batch's cursor.
- [x] AC-5: Given no sync state for a retailer, when deals are requested, then all of that retailer's products are downloaded once, after reading the changes feed's current cursor.
- [x] AC-6: Given a retailer checked less than 15 minutes ago, when deals are requested, then PrijsProfeet is not called and the local copy is served.
- [x] AC-7: Given a retailer checked 15 minutes ago or more, when deals are requested, then changes since the saved cursor are applied (following `has_more` pages).
- [x] AC-8: Given the changes feed answers 410 (cursor too old), when deals are requested, then the retailer is downloaded again in full.
- [x] AC-9: Given a stored copy and PrijsProfeet failing with any other error, when deals are requested, then the local copy is served and a warning is logged without the API key.
- [x] AC-10: Given two requests for the same retailer at the same time, when both arrive during a sync, then PrijsProfeet is synced once.

## Out Of Scope

- Changing the sync rules, intervals or schema.
- Moving to a different database or an npm SQLite package.
- Retention or clean-up of the cache file.

## Dependencies And Open Decisions

- No new package. `node:sqlite` is built into Node ≥ 22.13. An ADR records the storage-layer decision and the Node-version constraint.
- Tests for AC-5–AC-10 use a stubbed `fetch`, `MEALPLAN_DB=":memory:"` and fake timers. They hit no network. If `prijsprofeet.ts` can't be tested without a seam (e.g. its module-level store), the smallest change is a reset function exported for tests only. That stays within `affected_areas`, with no behaviour change.
- These tests cover existing code, so they are expected to **pass on first run**. "Red first" does not apply to recording existing behaviour, and the change record will say so. If one fails, it has found a real bug, which is reported to the requester before anything is changed.
- Open: none.

## Verification Plan

1. Tag the existing `dealStore.test.ts` tests with `RFC-2026-004:AC-1`…`AC-4`.
2. Add `src/lib/prijsprofeet.test.ts` covering AC-5–AC-10 with a stubbed `fetch` and an in-memory database.
3. Write the ADR (`devrailsv2 adr new "Local SQLite copy of PrijsProfeet promotions"`).
4. `npm test`, `npm run typecheck`, `npm run build`.
5. `devrailsv2 done --run-tests`, then `devrailsv2 check`.

## Change History

| Date | Author | Change |
|---|---|---|
| 2026-10-23 | Fortune Tiriboyi | Created draft |
| 2026-10-23 | Claude (for Fortune Tiriboyi) | Filled in: retroactive record of `79081ad`, plus tests for the untested sync rules and an ADR |
| 2026-10-23 | Fortune Tiriboyi <tiriboyifortune@gmail.com> | Approved |
| 2026-10-23 | Fortune Tiriboyi | Implemented — see CR-2026-004 |
