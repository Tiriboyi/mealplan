# Project status

## Where we are
RFC-2026-002 (bump `next` to 16.4.2 for three security advisories) is implemented and verified on branch `rfc/2026-002-bump-next-to-16-4-2-for-security-advisories`. It is waiting for review and merge. Local Node was updated to 24.22.1.

## In flight
- RFC-2026-001 Weekly budget limit (GH#1): approved, **paused**. Branch `rfc/2026-001-weekly-budget-limit-for-the-meal-plan` has the test dependencies and the GH#1 analysis committed. No tests or code yet.

## Next step
Merge RFC-2026-002, then rebase the RFC-2026-001 branch onto it, run `devrailsv2 rfc start 2026-001` to make it active again, and continue with step 1 of its plan (vitest jsdom config + ADR), then failing tests.

## Where we came from
<!-- devrailsv2:history -->
- 2026-10-23 — RFC-2026-002 Bump next to 16.4.2 for security advisories implemented ([CR-2026-002](changes/CR-2026-002-bump-next-to-16-4-2-for-security-advisories.md))
- 2026-10-23 — devrailsv2 initialised (RFC-0000).
