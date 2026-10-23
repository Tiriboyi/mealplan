# Project status

## Where we are
RFC-2026-001 (weekly budget, GH#1) is implemented on `rfc/2026-001-weekly-budget-limit-for-the-meal-plan`, with all 15 criteria covered by passing tests (144 tests). That branch is stacked on RFC-2026-002 (`next` 16.4.2 security bump), which is implemented on `rfc/2026-002-bump-next-to-16-4-2-for-security-advisories`. Component tests now run with Vitest + jsdom (ADR-0001). Local Node is 24.22.1.

## In flight
- RFC-2026-002: done, waiting for review and merge.
- RFC-2026-001: done except a manual browser check (colours in light and dark, phone width). Waiting for review and merge after RFC-2026-002.

## Next step
Do the manual browser check for RFC-2026-001 (`npm run dev`: Settings budget field, shopping page over/under text). Then open PRs: RFC-2026-002 first, then RFC-2026-001 on top. Consider merging `typography-instrument-satoshi` into `main`, so `devrailsv2 check` compares against the right base.

## Where we came from
<!-- devrailsv2:history -->
- 2026-10-23 — RFC-2026-001 Weekly budget limit for the meal plan implemented ([CR-2026-001](changes/CR-2026-001-weekly-budget-limit-for-the-meal-plan.md))
- 2026-10-23 — RFC-2026-002 Bump next to 16.4.2 for security advisories implemented ([CR-2026-002](changes/CR-2026-002-bump-next-to-16-4-2-for-security-advisories.md))
- 2026-10-23 — devrailsv2 initialised (RFC-0000).
