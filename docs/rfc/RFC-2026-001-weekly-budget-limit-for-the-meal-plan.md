---
id: RFC-2026-001
title: Weekly budget limit for the meal plan
status: approved
type: change
requested_by: Fortune Tiriboyi
decision_owner: Fortune Tiriboyi
approved_by: Fortune Tiriboyi <tiriboyifortune@gmail.com>
approved_on: 2026-10-23
created: 2026-10-23
updated: 2026-10-23
affected_areas: [src/lib/planner.ts, src/lib/types.ts, src/lib/settings.ts, src/lib/budget.ts, src/components/SettingsView.tsx, src/components/PlanProvider.tsx, src/components/ShoppingView.tsx, src/app/globals.css, src/**/*.test.ts, src/**/*.test.tsx, vitest.config.mts, package.json, package-lock.json]
---

# REQ-2026-001 - Weekly budget limit for the meal plan

## Request

Let the user set an optional maximum weekly spend ("Weekly budget (€)") in Settings. When a budget is set, the planner picks a week whose shopping-list total is within it. If no week fits, the planner returns the cheapest week it can find and marks it **over budget**. The shopping page shows "Over budget by €X.XX" or "€Y.YY under budget" next to the total. A component test setup (React Testing Library + jsdom) is added so the UI behaviour is covered by automated tests.

Ticket: GH#1 · Analysis: `docs/analysis/TICKET-gh-1.md` (questions answered by the requester on 2026-10-23).

## Business Reason

A household cook on a fixed food budget only finds out on the shopping page that the planned week costs too much. They then swap meals by hand until the total drops. Prices change every week with the promotions, so a fixed choice of recipes does not solve this. Planning to a budget removes that manual work.

## Current Evidence

Status: `Confirmed`

Claim type: `behaviour`

Claim: The planner is a greedy one-pass pick that never computes or limits a week total. `suggest(index, prefs, seed)` takes the highest `score()` for each night, under the `sadzaAllows` constraint. `score()` only penalises a single main above `MAIN_BUDGET_PER_PERSON`.

Sources: GH#1; `suggest` and `score` in `src/lib/planner.ts` (Serena). Callers of `suggest`: `PlanProvider` useEffect (auto plan when `fitsWeek` fails), `PlanProvider/shuffle`, 5 tests in `src/lib/planner.test.ts`.

Last verified: 2026-10-23

Status: `Confirmed`

Claim type: `behaviour`

Claim: The shopping total already covers promotion lines only, minus lines marked "I already have it". `PlanProvider` computes `sum = totals(plan.promo.filter(l => !skipped.includes(l.deal.id)))`, and `ShoppingView` says "Items bought at regular price are not in these totals."

Sources: GH#1; `totals` in `src/lib/planner.ts`; `PlanProvider/buying` and `PlanProvider/sum`; `ShoppingView.tsx` (summary list, "I already have it" toggle).

Last verified: 2026-10-23

Status: `Confirmed`

Claim type: `data`

Claim: Settings are stored in `localStorage`. `loadSettings` merges saved prefs over `DEFAULT_PREFS`, so a new `Prefs` field gets its default for users with older saved settings. The planned week (`recipeIds`, `skipped`, `ticked`) is stored separately as `SavedPlan` under `PLAN_KEY`.

Sources: `loadSettings`/`saveSettings` in `src/lib/settings.ts`; `Prefs`/`DEFAULT_PREFS` in `src/lib/types.ts`; `PlanProvider` useEffect callbacks 0 and 3 (`loadPlan`, `localStorage.setItem(PLAN_KEY, …)`).

Last verified: 2026-10-23

Status: `Confirmed`

Claim type: `behaviour`

Claim: Settings only saves through the Save button (draft + submit). Numeric options use the `Stepper` component (+/− buttons, no typed input). Form errors use `.field-error` with `role="alert"` (e.g. "Pick at least one supermarket."). There is no warning colour token, only `--danger`.

Sources: `SettingsForm` and `Stepper` in `src/components/SettingsView.tsx`; `src/app/globals.css` (`--muted`, `--danger`).

Last verified: 2026-10-23

Status: `Confirmed`

Claim type: `requirement`

Claim: There is no component test setup. Vitest only includes `src/**/*.test.ts`, and there is no DOM environment or React Testing Library.

Sources: `vitest.config.mts`; `package.json` devDependencies (vitest, typescript, @types/*).

Last verified: 2026-10-23

Status: `Likely`

Claim type: `requirement`

Claim: The proposed dev dependencies are maintained and MIT licensed: `@testing-library/react` 16.3.3, `@testing-library/dom` 10.4.2, `@testing-library/user-event` 14.6.8, `jsdom` 30.1.3, `@vitejs/plugin-react` 6.1.2. All were published in Aug–Oct 2026 per `npm view`. `npm audit` has not been run yet, because the packages are not installed. It runs as the first implementation step, and a reported vulnerability stops the work.

Sources: `npm view` (version, license, time.modified) for each package, run 2026-10-23.

Last verified: 2026-10-23

## Desired Outcome

- The user can set, change or clear a weekly budget in Settings. The budget survives a reload.
- With a budget set, the planned week's promotion total is at most the budget whenever the planner finds such a week.
- When no week fits, the user gets the cheapest week found, clearly flagged "Over budget by €X.XX". The app does not keep replanning that week.
- With no budget, everything behaves exactly as today.
- The diet (pork/shellfish) and sadza (1–2 times a week) rules always hold.

Design decisions (requester, 2026-10-23):
- The budget is a `Stepper` with a €1 step that also accepts a typed decimal amount, rounded to cents.
- An invalid value shows "Enter an amount above €0" and **blocks Save**. The saved budget is kept.
- The planner aims at the full promotion total. Only the shopping page comparison leaves out "I already have it" lines. Regular-price lines are never counted, and the UI says "promotion items only".
- "Over budget" uses the existing `--danger` colour. "Under budget" uses `--muted`.
- Shuffle respects the budget. Manual swaps are not budget-checked and only show the result on the shopping page.
- Changing the budget replans straight away if the current week no longer fits.
- The saved week remembers the budget it was planned under, plus an over-budget flag when no week fits. While the budget is unchanged, a saved week is never replanned for budget reasons on reload or when deals reload. This covers flagged weeks and weeks edited by hand.
- (Revision 2026-10-23) The budget total counts promotion items only, so a meal with nothing on promotion adds €0. To stop the planner from "saving" by moving items to regular price, a budget week may never have **more "At regular price" lines** than the no-budget week for the same deals, prefs and seed. A probe showed a week with no promotions totals €0.00 but needs 17 regular-price items.
- Amounts use the app's existing money format (`money()` in `src/lib/text.ts`, nl-NL, e.g. "€ 4,50"). "€X.XX" in the ticket is a placeholder for that.
- No budget display on the Week page.

## Acceptance Criteria

- [ ] AC-1: Given default settings, when the Settings page opens, then a "Weekly budget (€)" stepper with a typeable amount is shown and is empty, and `DEFAULT_PREFS.budget` is `null`.
- [ ] AC-2: Given the budget field, when the user presses + or −, then the amount changes by €1 (+ from empty starts at €1, and − never goes below €1). When the user types a decimal such as "59.50" or "59,50", then the amount is €59.50.
- [ ] AC-3: Given the user enters 0, a negative number or non-numeric text, when the field loses focus, then "Enter an amount above €0" is shown, Save is blocked, and the saved budget is unchanged. Clearing the field (empty) is valid and removes the budget.
- [ ] AC-4: Given a budget is saved, when the page is reloaded, then the budget is still set. Given saved settings from before this change (no `budget`), when they load, then the budget is empty.
- [ ] AC-5: Given the budget is empty, when a plan is made (initial plan or Shuffle with any seed), then the planned week is identical to the week the current algorithm produces for the same deals, prefs and seed.
- [ ] AC-6: Given a budget of €60 and a deal set in which at least one valid week has a promotion total of at most €60 and no more regular-price lines than the no-budget week, when a plan is made (initial or Shuffle), then the planned week's promotion total is at most €60 and the plan is not flagged over budget.
- [ ] AC-7: Given a budget that no week the planner tries can meet, when a plan is made, then the planned week is the cheapest of the weeks tried (never more expensive than the no-budget week), and the plan is flagged over budget.
- [ ] AC-8: Given a saved week that is flagged over budget or was edited by hand, when the app reloads or the deals reload with the same budget, then the week is not replanned. When the budget changes or Shuffle is pressed, then planning runs again and the flag is recalculated.
- [ ] AC-9: Given a saved budget and a current week that is over it, when the user saves a new budget, then the week is replanned right away under AC-6/AC-7.
- [ ] AC-10: Given a budget is set and the compared total exceeds it, when the shopping page opens, then "Over budget by €X.XX" is shown on the same line as the "Offers on the list" total in the `--danger` colour.
- [ ] AC-11: Given a budget is set and the compared total is at most the budget, when the shopping page opens, then "€Y.YY under budget" is shown on the same line as the total in the muted style.
- [ ] AC-12: Given a budget is set, when the shopping page shows the comparison, then it is labelled "promotion items only", and lines marked "I already have it" and regular-price lines are left out of the compared total.
- [ ] AC-13: Given no budget is set, when the shopping page opens, then no budget text is shown.
- [ ] AC-14: Given any budget, when a plan is made across seeds and 2/5/7 dinners, then sadza appears at least once and at most twice, and no pork or shellfish deal is used unless allowed in Settings.
- [ ] AC-15: Given any budget, when a plan is made, then the planned week has no more "At regular price" lines than the week planned without a budget for the same deals, prefs and seed.

## Out Of Scope

- Budgets per day, per meal or per retailer.
- Tracking actual spend at the till.
- Changing household size or portion sizes to meet the budget.
- A budget check or warning at manual swap time (shopping page only).
- Showing the budget on the Week page.
- Counting regular-price items, including priced ones, in the total.
- A guaranteed global-cheapest week. The search is bounded (see Dependencies).

## Dependencies And Open Decisions

- **New dev dependencies** (test-only, not shipped): `@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event`, `jsdom`, `@vitejs/plugin-react`. Justification: there is no component test setup, and the UI criteria (AC-1–AC-3, AC-10–AC-13) need automated tests. Testing Library is the de-facto standard for React 19 and stays inside the existing runner (vitest). No second runner is added. All are MIT and actively maintained. Versions are pinned through `package-lock.json`, and `npm audit` must report no high/critical issues before they are used. An ADR records this decision.
- **`vitest.config.mts`**: add `src/**/*.test.tsx` to `include`, the React plugin, and `environment: "jsdom"` for `.test.tsx` files only (existing `.ts` tests stay on node).
- **Planner design**: a new `planWeek(index, prefs, seed) → { recipeIds, overBudget }` wraps `suggest`. With no budget it returns `suggest(...)` unchanged (AC-5). With a budget it evaluates a bounded set of candidate weeks: the greedy week, seeded variants, and single-night swaps from `alternatives()`. It returns the best candidate within budget, or else the cheapest. The candidate cap (a few hundred) is fixed in code and covered by a timing check. `suggest` keeps its signature, so its existing callers and tests are not affected.
- **Planner candidates** only count if they have no more regular-price lines than the greedy no-budget week (AC-15). Within that limit, the cheapest promotion total wins.
- **Saved week**: `SavedPlan` gains `budget?: number | null` (the budget the week was planned under) and `overBudget?: boolean`. A pure `keepOrPlan(week, index, prefs)` in `planner.ts` decides what happens. If the week no longer fits the diet and sadza rules, it replans. If the budget is unchanged, it keeps the week. If the budget changed, it keeps the week when it is within the new budget, and replans otherwise. Saved plans without these fields load as `budget: null`, so behaviour is unchanged.
- **Shared helpers**: `parseBudget(text)` and `budgetStatus(total, budget)` live in a new `src/lib/budget.ts`. `weekCost(recipeIds, index, prefs)` lives in `planner.ts`, to avoid a circular import with `realize`/`totals`.
- Resolved with the requester (2026-10-23): €1 step, typed decimals, block Save on invalid input, `--danger`, "Have it" only on the shopping page, regular-price lines out, Shuffle respects the budget, immediate replan, over-budget flag, no Week page change.
- Open: none.

## Verification Plan

- **Red first**: write failing tests for every AC, named with `RFC-2026-001:AC-n`, and commit them before implementation.
- **Unit (vitest, node)** in `src/lib/planner.test.ts` and `src/lib/budget.test.ts`:
  - AC-5: golden comparison of `planWeek` with `budget: null` against `suggest` for seeds 0–20 and 2/5/7 dinners.
  - AC-6: fixture deal set where a cheaper valid week exists but the greedy week is over €60. Assert `weekCost ≤ 60` and `overBudget` is false, for the initial seed and Shuffle seeds.
  - AC-7: a €1 budget. Assert `overBudget` is true and `weekCost(result) ≤ weekCost(suggest(...))`.
  - AC-14: a loop over seeds, days and budgets asserting sadza count 1–2 and that `buildIndex` exclusions hold.
  - AC-15: the same loop asserting `realize(result).regular.length ≤ realize(suggest(...)).regular.length`, including a fixture where the €0-promo week would otherwise win.
  - AC-8/AC-9: `keepOrPlan` unit tests (unchanged budget keeps a flagged or hand-edited week, a changed budget replans only when over, legacy saved plan).
  - AC-3/AC-2: `parseBudget` for "", "0", "-5", "abc", "60", "59.50", "59,50".
  - AC-10–AC-12: `budgetStatus`.
  - AC-4: settings round-trip with a stubbed `localStorage`, including legacy settings without `budget`.
- **Component (vitest + jsdom + Testing Library)**:
  - `SettingsView.test.tsx` covers AC-1–AC-4 (empty default, ±€1, typing, blur error, Save blocked).
  - `ShoppingView.test.tsx` covers AC-10–AC-13 (over/under text and class, "promotion items only", skipped lines excluded, no text without a budget).
  - `PlanProvider.test.tsx` covers AC-8/AC-9 (no replan while flagged with an unchanged budget, replan on budget change and Shuffle).
- **Full suite**: `npm test` and `npm run typecheck` pass, and `npm audit` reports no high/critical issues.
- **Manual** (`npm run dev`): Settings field and stepper, shopping page line and colour in light and dark themes, phone width. Check that Shuffle with a budget feels instant (< 200 ms).
- **Gate**: `devrailsv2 done --run-tests`, then `devrailsv2 check`.

## Change History

| Date | Author | Change |
|---|---|---|
| 2026-10-23 | Fortune Tiriboyi | Created draft |
| 2026-10-23 | Claude (for Fortune Tiriboyi) | Filled in all sections from the GH#1 analysis and the requester's answers |
| 2026-10-23 | Fortune Tiriboyi <tiriboyifortune@gmail.com> | Approved |
| 2026-10-23 | Claude (for Fortune Tiriboyi) | Back to draft for scope change. Added AC-15 (no more regular-price lines than the no-budget week) after a probe showed a no-promotion week totals €0. Reworded AC-6 and AC-8 to match. The saved week now records the budget it was planned under, so hand-edited weeks are kept. Money format and helper placement clarified. |
| 2026-10-23 | Fortune Tiriboyi <tiriboyifortune@gmail.com> | Approved |
