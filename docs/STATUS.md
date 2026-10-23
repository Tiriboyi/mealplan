# Project status

## Where we are
PR #2 (`typography-instrument-satoshi`) holds pre-devrailsv2 work. RFC-2026-003 (Satoshi from Fontshare, font file removed for licence reasons) is implemented. RFC-2026-004 (record the SQLite promotions cache) is approved and next.

## In flight
- RFC-2026-004: record the SQLite cache. Tag the `dealStore` tests, add sync tests for `prijsprofeet.ts`, and an ADR.
- RFC-2026-002 (next 16.4.2) and RFC-2026-001 (weekly budget): done on their own branches, waiting for PR #2.

## Next step
Implement RFC-2026-004, then move `typography-instrument-satoshi` to the finished RFC branch and push PR #2. Open decisions for the requester: purge the font from git history (force-push), and the Fontshare privacy question.

## Where we came from
<!-- devrailsv2:history -->
- 2026-10-23 — RFC-2026-003 Load Satoshi from Fontshare instead of self-hosting it implemented ([CR-2026-003](changes/CR-2026-003-load-satoshi-from-fontshare-instead-of-self-hostin.md))
- 2026-10-23 — devrailsv2 initialised (RFC-0000).
