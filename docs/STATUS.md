# Project status

## Where we are
RFC-2026-001 to 004 are merged into `main` (PRs #2–#5; `next` 16.4.2 is on `main`). RFC-2026-005 (dinner options from the shopping list, GH#6) is implemented on `rfc/2026-005-dinner-options-from-the-shopping-list`, with all 15 criteria covered by passing tests (168 tests). Component tests run with Vitest + jsdom (ADR-0001). Local Node is 24.22.1.

## In flight
- RFC-2026-005: done except the manual check at phone width and in light mode (desktop dark mode checked). Waiting for review and a PR.

## Next step
Check the week view's "Or make:" line at phone width and in light mode (`npm run dev`), then push `rfc/2026-005-dinner-options-from-the-shopping-list` and open a PR for GH#6. Consider a follow-up ticket for variety: in a typical week only two recipes qualify, so every day shows the same pair (see CR-2026-005).

## Where we came from
<!-- devrailsv2:history -->
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
