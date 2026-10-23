# ADR-0001: Component tests with Vitest, jsdom and React Testing Library

Status: Proposed
Date: 2026-10-23
RFC: RFC-2026-001

## Context
Until now the project had only node-environment unit tests (`src/**/*.test.ts`) for `src/lib`. RFC-2026-001 adds UI behaviour: a Settings field with validation that blocks Save, budget text on the shopping page, and replanning rules in `PlanProvider`. The requester asked for automated tests of that behaviour. AGENTS.md forbids a second test runner.

## Decision
- Keep Vitest as the only runner. Add `@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event`, `jsdom` and `@vitejs/plugin-react` as pinned dev dependencies. This follows the Next.js 16 Vitest guide (`node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`). We leave out `vite-tsconfig-paths` because the `@` alias is already set in `vitest.config.mts`.
- Component tests are `src/**/*.test.tsx` and opt into jsdom per file with a `// @vitest-environment jsdom` docblock. Existing `.test.ts` files keep the faster node environment.
- Tests query by role and label (Testing Library style), not by CSS class, except where a criterion is about styling (e.g. the `--danger` colour class).

## Consequences
- UI acceptance criteria can be proven by named tests (`RFC-2026-001:AC-n`) and are checked by `devrailsv2 check`.
- There are more dev dependencies to keep updated. `jsdom` 30 needs Node ≥ 24.15 (local Node updated to 24.22.1).
- jsdom does not compute real layout or CSS. Visual checks (colour, phone width, dark mode) stay manual.
- Async Server Components can't be unit-tested this way (Next.js docs). The components under test are Client Components.

## Alternatives considered
- **No component tests, pure helpers + manual checks**: no new dependencies, but the Save-blocking and replanning behaviour would be unproven. The requester rejected this.
- **happy-dom instead of jsdom**: faster, but less complete, and not the Next.js-documented setup.
- **Playwright E2E**: closest to real use, but it is a second runner with browser downloads. That is too heavy for this change, and AGENTS.md forbids a second runner.
