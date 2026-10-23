---
id: RFC-2026-002
title: Bump next to 16.4.2 for security advisories
status: approved
type: fast-track
requested_by: Fortune Tiriboyi
decision_owner: Fortune Tiriboyi
approved_by: Fortune Tiriboyi <tiriboyifortune@gmail.com>
approved_on: 2026-10-23
created: 2026-10-23
updated: 2026-10-23
affected_areas: [package.json, package-lock.json]
test_exemption: Patch-level dependency bump with no behaviour change. Verified by the existing test suite, a type check, a production build and npm audit, not by new tests.
---

# REQ-2026-002 - Bump next to 16.4.2 for security advisories

## Request

Upgrade `next` from 16.4.0 to 16.4.2 (a patch release) to fix three published security advisories. Only `package.json` and `package-lock.json` change. No application code changes.

## Business Reason

`npm audit` reports one critical-severity package (`next` >=16.0.0 <=16.4.0) with three advisories. Two are unauthenticated remote code execution, and one is a denial of service. They were found while installing test tooling for RFC-2026-001, and the requester chose to fix them before continuing that work. Two of the three are pre-authentication RCEs, so the production app is exposed until this is fixed.

## Current Evidence

Status: `Confirmed`

Claim type: `security`

Claim: `next@16.4.0` is installed and affected by GHSA-2464-fhr4-w9xw (critical, RCE in Image Optimization API with SVG files), GHSA-673q-mjm6-r5xr (critical, RCE in `use cache` functions returning typed arrays) and GHSA-p3m5-59mp-jv5r (high, DoS in App Router with Server Actions). All three advisories cover the range `>=16.0.0 <=16.4.0`.

Sources: `npm audit` and `npm audit --json` run 2026-10-23; https://github.com/advisories/GHSA-2464-fhr4-w9xw; https://github.com/advisories/GHSA-673q-mjm6-r5xr; https://github.com/advisories/GHSA-p3m5-59mp-jv5r; `npm ls next` (16.4.0).

Last verified: 2026-10-23

Status: `Confirmed`

Claim type: `dependency`

Claim: `next@16.4.2` is outside the affected range. It was published 2026-10-15, is MIT licensed, and requires Node `>=20.9.0` (the local Node is 24.22.1). It is a patch release within 16.4, so no breaking API changes are expected.

Sources: `npm view next time` / `engines.node` (2026-10-23); `npm audit --json` (`fixAvailable: true`).

Last verified: 2026-10-23

Status: `Likely`

Claim type: `behaviour`

Claim: The app's use of Next (App Router pages, `src/app/api/deals/route.ts`, fonts, manifest) is unaffected by the patch. This will be confirmed by the build and test suite after the bump.

Sources: `src/app/**`; Next 16.4.1/16.4.2 release notes (to be read from `node_modules/next` after install, per AGENTS.md).

Last verified: 2026-10-23

## Desired Outcome

`next` is pinned to 16.4.2 in `package.json` and `package-lock.json`, `npm audit` reports no high or critical findings for `next`, and the app builds and behaves as before.

## Acceptance Criteria

- [ ] AC-1: Given the updated lockfile, when `npm ls next` runs, then it reports `next@16.4.2`, and `package.json` requires `^16.4.2`.
- [ ] AC-2: Given the bump, when `npm audit` runs, then it reports no advisories for `next`.
- [ ] AC-3: Given the bump, when `npm test` and `npm run typecheck` run, then both pass with the same test count as before (81 tests).
- [ ] AC-4: Given the bump, when `npm run build` runs, then the production build succeeds.

## Out Of Scope

- Any application code, config or other dependency changes.
- Minor or major Next upgrades beyond 16.4.2.
- RFC-2026-001 (weekly budget). It is paused on its branch and will be rebased onto this fix afterwards.

## Dependencies And Open Decisions

- Node 24.22.1 (updated 2026-10-23 via nvm-windows) satisfies Next's engine range.
- The `react`/`react-dom` peer ranges are compatible with 16.4.2. This will be confirmed by `npm install` reporting no peer conflicts.
- After merge, RFC-2026-001's branch is rebased onto this branch's result so its `package-lock.json` includes the fixed `next`.
- Open: none.

## Verification Plan

1. `npm install next@^16.4.2`, then confirm only `package.json` and `package-lock.json` changed (`git status`).
2. `npm ls next` (AC-1) and `npm audit` (AC-2).
3. `npm test` and `npm run typecheck` (AC-3).
4. `npm run build` (AC-4).
5. Smoke test with `npm run dev`: Week, Shopping, Recipes and Settings pages load.
6. `devrailsv2 done --run-tests`, then `devrailsv2 check`.

## Change History

| Date | Author | Change |
|---|---|---|
| 2026-10-23 | Fortune Tiriboyi | Created draft |
| 2026-10-23 | Claude (for Fortune Tiriboyi) | Filled in from the npm audit findings |
| 2026-10-23 | Fortune Tiriboyi <tiriboyifortune@gmail.com> | Approved |
| 2026-10-23 | Fortune Tiriboyi | Implemented — see CR-2026-002 |
