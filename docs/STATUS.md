# Project status

## Where we are
RFC-2026-001 to 004 are merged into `main` (PRs #2–#5; `next` 16.4.2 is on `main`). RFC-2026-005 (dinner options, GH#6) is done on `rfc/2026-005-dinner-options-from-the-shopping-list`. RFC-2026-006 (lunches and school lunchboxes for 2 adults and 2 kids, region Midden school calendar, promotion-only lunches) is done on `rfc/2026-006-lunches-and-school-lunchboxes-for-a-family-with-ki`, which is **stacked on the RFC-2026-005 branch**. All 35 criteria are covered and 288 tests pass. Design in ADR-0003 (Proposed). Component tests run with Vitest + jsdom (ADR-0001). Local Node is 24.22.1.

## In flight
- RFC-2026-005: the remaining manual check was done during RFC-2026-006's check on 2026-11-08: "Or make:" is readable at 360 px in dark and light mode. Waiting for review and a PR.
- RFC-2026-006: implemented and checked by hand (desktop dark; 360 px dark and light). Waiting for review; ADR-0003 waits for acceptance.

## Next step
Open the PR for RFC-2026-005 (GH#6) first, then the RFC-2026-006 PR on top of it (or rebase it onto `main` once 005 merges). Decide with the requester whether wholegrain bread (or other staples) may be bought at regular price: without an Albert Heijn bread promotion, 69% of lunch slots are empty (see CR-2026-006). Extend the school-holiday table before 20 Aug 2028. Older follow-up: variety in "Or make:" (CR-2026-005).

## Where we came from
<!-- devrailsv2:history -->
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
