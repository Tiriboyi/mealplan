---
id: RFC-2026-009
title: Bump next to 16.4.6 for security advisories
status: approved
type: fast-track
requested_by: Fortune Tiriboyi
decision_owner: Fortune Tiriboyi
approved_by: Fortune Tiriboyi <tiriboyifortune@gmail.com>
approved_on: 2026-11-18
created: 2026-11-18
updated: 2026-11-18
affected_areas: [package.json, package-lock.json, next.config.ts]
test_exemption: Patch-level dependency bump plus one opt-in config flag, with no behaviour change. Verified by the existing test suite, a type check, a production build and npm audit, not by new tests.
---

# REQ-2026-009 - Bump next to 16.4.6 for security advisories

## Request

Upgrade `next` from 16.4.2 to 16.4.6 (a patch release within 16.4) to fix two published security advisories, and set `experimental.agentUpgrade: "security"` in `next.config.ts`. Only `package.json`, `package-lock.json` and `next.config.ts` change. No application code changes.

Ticket: none (requested directly by Fortune Tiriboyi on 2026-11-18)

## Business Reason

`npm audit` reports `next` (installed 16.4.2) as affected by two moderate-severity advisories in the range `16.2.0 - 16.4.4`. Both can leak cached data across root param values in `use cache` functions. The requester wants the installed version moved out of the affected range. The `agentUpgrade` flag records that this app takes security-only upgrades from Next's upgrade tooling.

## Current Evidence

Status: `Confirmed`

Claim type: `security`

Claim: `next@16.4.2` is installed and affected by GHSA-mfr8-8qww-v76h (moderate, information disclosure across root params when a `use cache` function is called through `unstable_cache()`) and GHSA-vc7v-qv4w-wrv8 (moderate, cache leak across root param values in nested `use cache` functions). Both cover `16.2.0 - 16.4.4`. `npm audit` reports no other findings.

Sources: `npm ls next` (16.4.2) and `npm audit --json` run 2026-11-18; https://github.com/advisories/GHSA-mfr8-8qww-v76h; https://github.com/advisories/GHSA-vc7v-qv4w-wrv8

Last verified: 2026-11-18

Status: `Confirmed`

Claim type: `dependency`

Claim: `next@16.4.6` exists on npm, is outside the affected range, is MIT licensed and requires Node `>=20.9.0` (local Node is 24.22.1). Its `react`/`react-dom` peer range (`^18.2.0 || ^19.0.0`) is unchanged.

Sources: `npm view next@16.4.6 version license engines.node peerDependencies` (2026-11-18)

Last verified: 2026-11-18

Status: `Confirmed`

Claim type: `config`

Claim: `next@16.4.6` accepts `experimental.agentUpgrade` with the values `'security' | 'latest' | 'experimental-future' | false`. `next.config.ts` currently has an empty config object, so nothing else is affected.

Sources: `dist/server/config-shared.d.ts` and `dist/server/config-schema.js` in the `next-16.4.6.tgz` tarball (2026-11-18); `next.config.ts`

Last verified: 2026-11-18

Status: `Likely`

Claim type: `behaviour`

Claim: The app's use of Next (App Router pages, `src/app/api/deals/route.ts`, fonts, manifest) is unaffected by the patch. The build and test suite will confirm this after the bump.

Sources: `src/app/**`; Next 16.4.3–16.4.6 release notes (to be read from `node_modules/next` after install, per AGENTS.md)

Last verified: 2026-11-18

## Desired Outcome

`next` is 16.4.6 in `package.json` and `package-lock.json`, `next.config.ts` sets `experimental.agentUpgrade: "security"`, `npm audit` reports no advisories for `next`, and the app builds and behaves as before.

## Acceptance Criteria

- [ ] AC-1: Given the updated lockfile, when `npm ls next` and `npx next --version` run, then both report 16.4.6, and `package.json` requires `^16.4.6`.
- [ ] AC-2: Given the bump, when `npm audit` runs, then it reports no advisories for `next`.
- [ ] AC-3: Given the bump, when `npm test` and `npm run typecheck` run, then both pass with the same test count as before.
- [ ] AC-4: Given `experimental.agentUpgrade: "security"` in `next.config.ts`, when `npm run build` runs, then the production build succeeds without a config validation warning.

## Out Of Scope

- Any application code or other dependency changes.
- Minor or major Next upgrades beyond 16.4.6.
- Any other experimental Next options.

## Dependencies And Open Decisions

- Work happens in a separate git worktree (`../mealplan-next-16.4.6`) on branch `rfc/2026-009-bump-next-to-16-4-6-for-security-advisories`, so the main checkout is unchanged.
- Open: none.

## Verification Plan

1. `npm install next@16.4.6` (saved as `^16.4.6`), then confirm only `package.json` and `package-lock.json` changed (`git status`).
2. Add `experimental: { agentUpgrade: "security" }` to `next.config.ts`.
3. `npm ls next` and `npx next --version` (AC-1), `npm audit` (AC-2).
4. `npm test` and `npm run typecheck` (AC-3).
5. `npm run build` (AC-4).
6. Smoke test with `npm run dev`: Week, Shopping, Recipes and Settings pages load.
7. `devrailsv2 done --run-tests`, then `devrailsv2 check`.

## Change History

| Date | Author | Change |
|---|---|---|
| 2026-11-18 | Fortune Tiriboyi | Created draft |
| 2026-11-18 | Claude (for Fortune Tiriboyi) | Filled in from the npm audit findings and the 16.4.6 package |
| 2026-11-18 | Fortune Tiriboyi <tiriboyifortune@gmail.com> | Approved |
