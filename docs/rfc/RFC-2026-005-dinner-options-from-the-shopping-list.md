---
id: RFC-2026-005
title: Dinner options from the shopping list
status: approved
type: change
requested_by: Fortune Tiriboyi
decision_owner: Fortune Tiriboyi
approved_by: Fortune Tiriboyi <tiriboyifortune@gmail.com>
approved_on: 2026-10-27
created: 2026-10-27
updated: 2026-10-27
affected_areas: [src/lib/planner.ts, src/lib/planner.test.ts, src/components/PlanProvider.tsx, src/components/PlanProvider.test.tsx, src/components/WeekView.tsx, src/components/WeekView.test.tsx, src/components/RecipeSheet.tsx, src/components/RecipeSheet.test.tsx, src/app/globals.css]
---

# REQ-2026-005 - Dinner options from the shopping list

## Request

Show, for every day in the week view, up to two alternative dinners that can be cooked using only what is already on that week's shopping list (promotion lines, regular-price lines and cupboard staples). Alternatives appear under the planned dinner as "Or make:" entries. Tapping one opens the recipe sheet, from which the user can pick it for that day; picking works like a swap. When no recipe qualifies, the day shows "No alternative dinner possible with this week's shopping". Analysis: `docs/analysis/TICKET-gh-6.md`.

Ticket: GH#6

## Business Reason

The household shops once a week, on promotion. Today each day has exactly one dinner, and the only way out is the swap list, which suggests recipes that need ingredients not yet bought. That means a second shop, which spoils the point of shopping once on promotion. Showing what else the groceries can make gives a choice on the day without spending more.

## Current Evidence

Status: `Confirmed`

Claim type: `behaviour`

Claim: The planner produces one dinner per day. The shopping list is derived only from the planned dinners: `realize(recipeIds, index, prefs)` returns `{ meals, promo, regular, pantry }`, where every non-pantry ingredient of a planned recipe becomes a promo line (deal bought at promotion), a regular line, or, if `ingredient.pantry`, a cupboard item.

Sources: GH#6; `realize` and `buy` in `src/lib/planner.ts` (Serena); `Plan` type in `src/lib/planner.ts`.

Last verified: 2026-10-27

Status: `Confirmed`

Claim type: `behaviour`

Claim: The existing `alternatives(recipeIds, position, index, prefs)` is the swap ranking. It ranks every unplanned recipe by promotion score under the sadza rule and ignores the shopping list. It has 4 production and test callers whose behaviour must not change: `planWeek` (budget search, RFC-2026-001), `SwapSheet/options`, `RecipeSheet/free`, and tests in `planner.test.ts` and `PlanProvider.test.tsx`.

Sources: GH#6; `alternatives` in `src/lib/planner.ts`; `find_referencing_symbols` (Serena).

Last verified: 2026-10-27

Status: `Confirmed`

Claim type: `behaviour`

Claim: `plan` in `PlanProvider` is a `useMemo` over `[index, prefs, recipeIds]`, and `replace(position, recipeId)` sets new `recipeIds`. Anything derived from `plan` and `recipeIds` therefore recalculates after a swap, a pick or "New week".

Sources: `src/components/PlanProvider.tsx` lines 135–137 and 166.

Last verified: 2026-10-27

Status: `Confirmed`

Claim type: `behaviour`

Claim: For a recipe that is not planned, `RecipeSheet` shows a "Cook it instead on [day]" footer listing every day where `alternatives()` allows it, and tags ingredients with any offer in the deal index rather than with the shopping list.

Sources: `RecipeSheet` in `src/components/RecipeSheet.tsx` (`free`, `ingredients`, footer).

Last verified: 2026-10-27

Status: `Confirmed`

Claim type: `data`

Claim: No recipe is pork or shellfish by construction: `Protein` is `chicken | beef | fish | lamb | beans | eggs`, and pork and shellfish deals are removed before planning (`allowed()` in `src/lib/diet.ts`, test "pork and shellfish never reach the index"). `allowed()` also applies the Settings `exclude` words.

Sources: `src/lib/recipes.ts` (`Protein`, 25 entries in `RECIPES`); `allowed` in `src/lib/diet.ts`; `src/lib/planner.test.ts`.

Last verified: 2026-10-27

Status: `Contradiction`

Claim type: `requirement`

Claim: The requester decided that a "skipped" offer does not count as on the shopping list. In the app, the skip toggle on the shopping page is labelled **"I already have it"**: a skipped line is something the user already has at home, which arguably makes it *available* for cooking. AC-4 follows the requester's decision as given; see Dependencies And Open Decisions.

Sources: Requester answer 2026-10-27 (analysis Q-3); `src/components/ShoppingView.tsx` line 237; `ShoppingView.test.tsx` "compares promotion items only, without what I already have".

Last verified: 2026-10-27

Status: `Unclear`

Claim type: `performance`

Claim: How often at least one unplanned recipe can be made from a week's list is unknown. With 25 recipes and a list bought only for the planned dinners, many weeks may show the "no alternative" notification.

Sources: GH#6 analysis Q-7; not measured.

Last verified: 2026-10-27

## Desired Outcome

On the week view, every day shows its planned dinner and, underneath, up to two "Or make:" options that can be cooked from that week's shopping list, or a notification that none is possible. The shopping list, its totals, the weekly budget result and the sadza rule are exactly as they would be without the feature. Picking an option swaps it in for that day.

## Acceptance Criteria

- [ ] AC-1: Given a planned week whose shopping list covers at least one unplanned recipe, when the week view renders, then every day card shows its planned dinner and at least one "Or make:" option.
- [ ] AC-2: Given options are computed for a week, when any option is inspected, then every non-pantry ingredient of that recipe appears in the plan's promotion lines or regular-price lines.
- [ ] AC-3: Given options are computed for a week, when any option is inspected, then it is not one of the week's planned dinners.
- [ ] AC-4: Given an offer is marked "I already have it" (skipped) on the shopping page, when options are computed, then no option needs that ingredient unless it is also on another line of the list.
- [ ] AC-5: Given options are shown, when the shopping list and totals are computed, then `realize()` output and the shopping total are identical to the same week without options (no new items, no changed quantities, no extra cost).
- [ ] AC-6: Given Settings with no pork, no shellfish or exclude words, when options are computed, then every option's name and ingredient names pass `allowed()` for those settings.
- [ ] AC-7: Given several recipes qualify for a day, when options are computed, then that day lists at most 2, ranked by the number of ingredients they share with that day's planned dinner (ties broken in a fixed order).
- [ ] AC-8: Given a recipe qualifies, when options are computed, then it may be listed on more than one day.
- [ ] AC-9: Given the planned week already has the maximum number of sadza dinners, when options are computed, then sadza recipes can still be options, and the planned week's sadza count and `fitsWeek` result are unchanged.
- [ ] AC-10: Given no unplanned recipe can be made from the week's shopping list, when the week view renders, then every day shows "No alternative dinner possible with this week's shopping" in the inline muted style and no "Or make:" list.
- [ ] AC-11: Given an "Or make:" option, when the user taps it, then the recipe sheet opens with its ingredients and method, and each ingredient is tagged by its shopping-list status (on offer at its retailer and price, regular price, or cupboard).
- [ ] AC-12: Given the recipe sheet of an option opened from a day, when the user picks it, then it replaces that day's planned dinner, the shopping list and total are rebuilt from the new week, and the sheet shows "Updates your shopping list" before picking.
- [ ] AC-13: Given the user swaps or picks a dinner, or plans a new week, when the week view updates, then every day's options are recalculated from the new shopping list.
- [ ] AC-14: Given a weekly budget is set, when the week is planned, then `planWeek`'s `recipeIds` and `overBudget` and `weekCost` are identical to the same inputs without this feature.
- [ ] AC-15: Given the existing swap flow, when the swap sheet or the "Cook it instead on" footer of a recipe opened from the recipes page is used, then its options are unchanged (`alternatives()` behaves as before).

## Out Of Scope

- Breakfast and lunch options.
- Raising pack sizes or quantities so alternatives are fully covered; alternatives borrow from the list as bought.
- Tracking what was cooked or what is left in the fridge, and any "already shopped" state that would freeze the list when an option is picked.
- "Almost possible" dinners that need one or two extra items.
- Re-planning the week to make alternatives possible when none exist.
- Changing `alternatives()`, `suggest()`, `planWeek()`, the sadza helpers or the shopping page.
- A toast notification (the inline text was chosen).

## Dependencies And Open Decisions

- Decided by the requester (2026-10-27): alternatives do not raise quantities; the same recipe may appear on several days; alternatives do not count towards the sadza rule; show a notification instead of re-planning; the user can pick an alternative, and picking is a normal swap that rebuilds the list (analysis Q-8); per-day ranking by overlap; at most 2 per day; inline notification; recipe sheet tags by shopping-list status.
- **Open, please confirm before approval: skipped offers (AC-4).** The requester answered that a skipped offer does not count, but the skip button reads "I already have it". If "I already have it" should count as available, AC-4 becomes: "Given an offer is marked 'I already have it', when options are computed, then recipes that need that ingredient can still be options."
- Builds on RFC-2026-001 (weekly budget); AC-14 depends on its tests and code, which are on `main` (merged in PR #4).
- No new dependency. No ADR expected: a pure function in the existing planner module and props in existing components.
- Risk, not a blocker: how often any option exists is unmeasured (see Current Evidence). The measured rate is reported in the change record.

## Verification Plan

- Unit tests in `src/lib/planner.test.ts` for the new options function, with fixed deal fixtures and several seeds: AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, the empty case for AC-10, AC-14 and AC-15 (existing `alternatives` and budget tests stay green unchanged).
- Component tests (Vitest + jsdom, ADR-0001) in `src/components/WeekView.test.tsx`, `RecipeSheet.test.tsx` and `PlanProvider.test.tsx`: AC-1, AC-10 (exact text), AC-11, AC-12, AC-13.
- Every test names its criterion, e.g. `RFC-2026-005:AC-7`.
- Full suite with `npm test`; `devrailsv2 check` before reporting done.
- Measurement: run the options function over the cached deals for several seeds and day counts, and record in the change record how many days get at least one option.
- Manual browser check (`npm run dev`) at phone width (≤ 400 px) and desktop, in light and dark: "Or make:" sits under the planned dinner in the muted style without horizontal scroll, and the notification is readable.

## Change History

| Date | Author | Change |
|---|---|---|
| 2026-10-27 | Fortune Tiriboyi | Created draft |
| 2026-10-27 | Claude (agent) | Filled in all sections from the GH#6 analysis and the requester's answers |
| 2026-10-27 | Fortune Tiriboyi <tiriboyifortune@gmail.com> | Approved |
