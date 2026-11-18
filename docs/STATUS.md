# Project status

## Where we are
RFC-2026-001 to 007 are merged into `main` (RFC-2026-007 via PR #8). RFC-2026-009 (`next` 16.4.2 → 16.4.6 for two moderate `use cache` advisories, plus `experimental.agentUpgrade: "security"`) is done on `rfc/2026-009-bump-next-to-16-4-6-for-security-advisories`. `npm audit` is clean, 293 tests pass, and typecheck and the production build pass. Component tests run with Vitest + jsdom (ADR-0001). Local Node is 24.22.1. Build with `NODE_ENV` unset: `NODE_ENV=development` breaks `next build` (see CR-2026-009).

## In flight
- RFC-2026-009: waiting for review and a PR.
- RFC-2026-008 (track `skills-lock.json`): approved on `main`, not yet pushed.
- RFC-2026-007: light mode has not been checked by eye (logos sit on a fixed white tile).
- ADR-0003 (from RFC-2026-006) waits for acceptance.

## Next step
Open the PR for RFC-2026-009. Decide with the requester whether wholegrain bread (or other staples) may be bought at regular price: without an Albert Heijn bread promotion, 69% of lunch slots are empty (see CR-2026-006). Extend the school-holiday table before 20 Aug 2028. Older follow-up: variety in "Or make:" (CR-2026-005).

## Where we came from
<!-- devrailsv2:history -->
- 2026-11-18 — RFC-2026-009 Bump next to 16.4.6 for security advisories implemented ([CR-2026-009](changes/CR-2026-009-bump-next-to-16-4-6-for-security-advisories.md))
- 2026-11-08 — RFC-2026-007 Show real store logos for Albert Heijn, Jumbo and Plus implemented ([CR-2026-007](changes/CR-2026-007-show-real-store-logos-for-albert-heijn-jumbo-and-p.md))
- 2026-11-07 — RFC-2026-006 Lunches and school lunchboxes for a family with kids implemented ([CR-2026-006](changes/CR-2026-006-lunches-and-school-lunchboxes-for-a-family-with-ki.md))
- 2026-10-27 — RFC-2026-005 Dinner options from the shopping list implemented ([CR-2026-005](changes/CR-2026-005-dinner-options-from-the-shopping-list.md))
- 2026-10-23 — RFC-2026-001 Weekly budget limit for the meal plan implemented ([CR-2026-001](changes/CR-2026-001-weekly-budget-limit-for-the-meal-plan.md))
- 2026-10-23 — RFC-2026-002 Bump next to 16.4.2 for security advisories implemented ([CR-2026-002](changes/CR-2026-002-bump-next-to-16-4-2-for-security-advisories.md))
PR #2 (`typography-instrument-satoshi`) holds pre-devrailsv2 work, now covered by RFC-2026-003 (Satoshi from Fontshare, font file removed for licence reasons) and RFC-2026-004 (SQLite promotions cache recorded and tested, ADR-0002). Both are implemented on `rfc/2026-004-record-the-sqlite-promotions-cache`, which is stacked on the RFC-2026-003 branch.

## In flight
- RFC-2026-002 (next 16.4.2) and RFC-2026-001 (weekly budget): done on their own branches, to be rebased onto PR #2 after it merges.

## Next step
Fast-forward `typography-instrument-satoshi` to `rfc/2026-004-record-the-sqlite-promotions-cache` and push PR #2. Note that PR #2 pins `next@16.4.0`, which Next refuses to build, until RFC-2026-002 lands. Open decisions for the requester: purge the font from git history (force-push), the Fontshare privacy question, and accepting ADR-0001/0002.

## Where we came from
<!-- devrailsv2:history -->
- 2026-10-23 — RFC-2026-004 Record the SQLite promotions cache implemented ([CR-2026-004](changes/CR-2026-004-record-the-sqlite-promotions-cache.md))
- 2026-10-23 — RFC-2026-003 Load Satoshi from Fontshare instead of self-hosting it implemented ([CR-2026-003](changes/CR-2026-003-load-satoshi-from-fontshare-instead-of-self-hostin.md))
- 2026-10-23 — devrailsv2 initialised (RFC-0000).
