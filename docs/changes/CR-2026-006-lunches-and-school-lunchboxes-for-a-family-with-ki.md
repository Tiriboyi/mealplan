# CR-2026-006: Lunches and school lunchboxes for a family with kids

RFC: [RFC-2026-006](../rfc/RFC-2026-006-lunches-and-school-lunchboxes-for-a-family-with-ki.md) · Spec: none · Ticket: none · Analysis: none
Date: 2026-11-07

## Summary
The planner now plans the whole household's lunches as well as dinners.
- **Household:** Settings describe adults and kids (a kid is 0.6 of an adult portion).
- **Dated weeks:** a week is fixed to dates. The Utrecht (region Midden) school calendar decides each day's meals: a school snack plus 12:30 lunchbox plus adult lunch on Monday, Tuesday, Thursday and Friday; a snack plus family lunch on Wednesday; a family lunch at weekends and in school holidays.
- **Promotion-only lunches:** lunches come from a new catalogue that mixes Dutch school guidance with Zimbabwean dishes made from supermarket food. A lunch is only planned when everything in it is on promotion at the selected supermarkets.
- **One list and one budget:** lunches share the shopping list and the budget with dinners, and each can be swapped by hand.

Dinners, the sadza rule, `alternatives()` and "Or make:" are unchanged. Design: [ADR-0003](../adr/ADR-0003-meals-per-day-and-dated-weekly-plans.md).

## Fit-criteria evidence
No ticket analysis: the request came from the requester in the session. Every RFC criterion is covered by named tests in the 288-test `npm test` run on 2026-11-07 (all passed). The full per-criterion test map is in the generated section below. Highlights:
| Criterion | Evidence (test) | Result |
|---|---|---|
| AC-1 to AC-3 household and portions | `settings.test.ts` "settings saved with a number of people load as that many adults and no kids"; `SettingsView.test.tsx` "asks for adults (1–10, default 2) and kids (0–6, default 0) instead of people"; `planner.test.ts` "more people means more packs, a kid counting as 0.6 of an adult" | ✅ |
| AC-4, AC-5 dated weeks | `WeekView.test.tsx` "a saved week keeps its dates: Today and Tomorrow move, past days are marked"; "a plan saved before dates existed starts today and keeps its dinners" | ✅ |
| AC-6, AC-7 school calendar | `schoolCalendar.test.ts`: all 10 region-Midden holidays, the days either side of Christmas, after `KNOWN_UNTIL`; `SettingsView.test.tsx` "says until when school holidays are known" | ✅ |
| AC-8 to AC-10, AC-29 meals per weekday, in order | `schoolCalendar.test.ts` "which meals a day has"; `WeekView.test.tsx` "each day shows its meals in time order, by weekday" | ✅ |
| AC-11 to AC-15 promotion-only, cupboard, empty slots | `planner.test.ts` "a lunch is only planned when everything it needs is on promotion", "with nothing on promotion every slot is empty…", "with only one lunchbox on promotion it repeats…"; `PlanProvider.test.tsx` "dropping a supermarket replaces lunches whose promotion was there"; `lunches.test.ts` cupboard and supermarket-product tests | ✅ |
| AC-16 to AC-21 catalogue rules | `lunches.test.ts` (snack, lunchbox, prep time, Zimbabwean element, warm/cold, no leftovers) | ✅ |
| AC-22 to AC-27 list, budget, diet | `planner.test.ts` quantity, one-line, ranking, budget and diet tests; `ShoppingView.test.tsx` "each line says which dinners and lunches it is for, and the total includes lunches" | ✅ |
| AC-28 matching | `ingredients.test.ts`: 20 real product names that must match, 23 look-alikes that must not | ✅ |
| AC-30 to AC-34 sheets, swaps, re-planning, reload | `WeekView.test.tsx` lunch sheet, lunchbox swap with reload, New week, saved lunches; `PlanProvider.test.tsx` "changing the number of kids replans the lunch slots" | ✅ |
| AC-35 dinners unchanged | `planner.test.ts` "dinners are planned and listed exactly as before when there are no lunches"; all RFC-2026-001 and RFC-2026-005 tests unchanged and green | ✅ |
| AC-29 360 px, manual | `npm run dev`, 2026-11-08, AH/Jumbo/Plus, 2 adults and 2 kids: desktop dark mode, and a 360 px frame in dark and light mode. Order and labels correct (Sun family lunch; Mon/Tue/Thu/Fri snack, lunchbox, lunch; Wed snack, family lunch), `scrollWidth` 341 ≤ 356, no horizontal scroll. The first 360 px check found lunch names squeezed to a few letters per line; fixed in `globals.css` (meal body full width on phones) and checked again. | ✅ |

**External sources checked (2026-11-07):** rijksoverheid.nl "Overzicht schoolvakanties" 2026-2027 and 2027-2028 (region Midden column), and "Regio's schoolvakantie" (Utrecht is Midden except Eemnes and former Abcoude). The Voedingscentrum lunchbox and seasonal guidance was **not** re-read. The catalogue follows the guidance as stated in the RFC (`Likely`).

**Measured** on the local PrijsProfeet cache (active promotions), 2 adults and 2 kids, 7-day weeks, seeds 0–9, starting Mon 9 Nov, Wed 11 Nov, Sat 14 Nov and Mon 21 Dec (Christmas holiday):
| Supermarkets | Empty lunch slots | Same lunch back-to-back | Week total, dinners → with lunches |
|---|---|---|---|
| Albert Heijn, Jumbo, Plus (default) | 0% | 0 | € 76.63 → € 95–102 |
| Jumbo, Plus | 69% (100% in the holiday week) | 0 | € 59.80 → € 65.97 |
| Lidl, Aldi | 69% (100% in the holiday week) | 0 | € 66.96 → € 71.63 |

Without Albert Heijn no wholegrain bread was on promotion, so only snacks qualify. `planWeek` with a € 40 budget took 7–40 ms. In the browser (dev mode) the week appeared about 2.2 s after the promotions arrived.

## Known limitations & follow-ups
- **Bread decides everything.** With the promotion-only rule, weeks without a wholegrain bread promotion at the selected supermarkets leave every lunchbox and lunch slot saying "No lunch idea on promotion…" (69% of slots in the measurement without Albert Heijn). A follow-up could let bread (or other staples the requester names) be bought at regular price. That needs a decision from the requester, because it relaxes the rule they set.
- **Zimbabwean lunches rarely qualify.** Sweet potato and plain unsalted popcorn (*maputi*) are almost never on promotion. Every popcorn deal in the cache is sweet, salted or flavoured. The dovi and mazai sandwiches qualify more often.
- **Holiday table runs until 20 Aug 2028** and must be extended yearly. The autumn and spring dates are advice, so a school may differ. School study days are not known.
- **Past days stay in the week.** A week opened long after it was planned shows every day as past until "New week" is pressed. It is not replanned automatically.
- **Voedingscentrum guidance not re-checked** against the source this session (see above).
- **Planning speed** was measured in dev mode only (about 2.2 s after the promotions arrive). It was not compared with the dinner-only planner, and production builds were not measured.
- **Test-only changes after the red commit:** one quantity test got a 40 g pack so adult and family portions differ in packs (stricter, not weaker), and the week-view swap test fixture got a peanut-butter promotion so there is a second lunchbox to swap to. Two test comments were split so devrailsv2 counts AC-29 and AC-32. No assertion was removed.
- **Scope revision:** `src/components/RecipesView.tsx` was added to the RFC and re-approved on 2026-11-07, for a one-line `dayAt` fix.

<!-- devrailsv2:generated:start -->
## Generated by devrailsv2
_Regenerated each time `devrailsv2 done` runs. Base: origin/main._

### Files changed
**Docs**
- `CHANGELOG.md`
- `docs/STATUS.md`
- `docs/changes/CR-2026-005-dinner-options-from-the-shopping-list.md`

**RFC / spec / analysis**
- `docs/adr/ADR-0003-meals-per-day-and-dated-weekly-plans.md`
- `docs/analysis/TICKET-gh-6.md`
- `docs/rfc/RFC-2026-005-dinner-options-from-the-shopping-list.md`
- `docs/rfc/RFC-2026-006-lunches-and-school-lunchboxes-for-a-family-with-ki.md`

**Source**
- `src/app/globals.css`
- `src/components/PlanProvider.tsx`
- `src/components/RecipeSheet.tsx`
- `src/components/RecipesView.tsx`
- `src/components/SettingsView.tsx`
- `src/components/ShoppingView.tsx`
- `src/components/SwapSheet.tsx`
- `src/components/WeekView.tsx`
- `src/components/ui.tsx`
- `src/lib/ingredients.ts`
- `src/lib/lunches.ts`
- `src/lib/planner.ts`
- `src/lib/schoolCalendar.ts`
- `src/lib/settings.ts`
- `src/lib/types.ts`

**Tests**
- `src/components/PlanProvider.test.tsx`
- `src/components/RecipeSheet.test.tsx`
- `src/components/SettingsView.test.tsx`
- `src/components/ShoppingView.test.tsx`
- `src/components/WeekView.test.tsx`
- `src/lib/ingredients.test.ts`
- `src/lib/lunches.test.ts`
- `src/lib/planner.test.ts`
- `src/lib/schoolCalendar.test.ts`
- `src/lib/settings.test.ts`

### Acceptance-criteria coverage
| Criterion | Tests referencing it |
|---|---|
| RFC-2026-006:AC-1 — Given Settings, when the user opens them, then they can set **Adults** (1–10, default 2) and **Kids** (0–6, default 0) instead of "People at the table", and the week view summary shows both (for example "2 adults, 2 kids"). | `src/components/SettingsView.test.tsx`, `src/components/WeekView.test.tsx`, `src/lib/settings.test.ts` |
| RFC-2026-006:AC-2 — Given settings saved before this change with `people: n`, when they load, then they become `adults: n, kids: 0` and nothing else changes. | `src/lib/settings.test.ts` |
| RFC-2026-006:AC-3 — Given a household of A adults and K kids, when quantities are worked out for a meal for the whole family (dinner or family lunch), then they use A + 0.6 × K portions. Given K = 0, the dinners, shopping list and `weekCost` are identical to today's output for `people: A`. | `src/lib/planner.test.ts` |
| RFC-2026-006:AC-4 — Given the user plans a new week, when the plan is saved, then it stores the date of its first day (today). Given the plan is reopened on a later date, then every day keeps its date and weekday, and "Today" and "Tomorrow" label only the days that really are today and tomorrow. | `src/components/WeekView.test.tsx` |
| RFC-2026-006:AC-5 — Given a plan saved before this change (no start date), when it loads, then its first day is taken as the day it is loaded, that date is saved, and its dinners are kept. | `src/components/WeekView.test.tsx` |
| RFC-2026-006:AC-6 — Given a date, when the app decides whether it is a school day, then it is a school day only if it is Monday to Friday and not inside a school holiday for region middle (province of Utrecht) for school years 2026–2027 and 2027–2028, as published by the Rijksoverheid. | `src/lib/schoolCalendar.test.ts` |
| RFC-2026-006:AC-7 — Given a date after the last school year in the calendar, when the app decides whether it is a school day, then it treats Monday to Friday as school days and the Settings page shows "School holidays known until" followed by the last date in the calendar, so the gap is visible. | `src/components/SettingsView.test.tsx`, `src/lib/schoolCalendar.test.ts` |
| RFC-2026-006:AC-8 — Given K ≥ 1 and a planned day that is a school day on Monday, Tuesday, Thursday or Friday, when the week view renders, then that day shows a kids' lunchbox with a morning snack and a 12:30 lunch, an adult lunch, and the dinner. | `src/components/WeekView.test.tsx`, `src/lib/schoolCalendar.test.ts` |
| RFC-2026-006:AC-9 — Given K ≥ 1 and a planned day that is a school day on Wednesday, when the week view renders, then it shows a kids' morning snack, a family lunch for everyone, and the dinner, and no 12:30 lunchbox. | `src/components/WeekView.test.tsx`, `src/lib/schoolCalendar.test.ts` |
| RFC-2026-006:AC-10 — Given a planned day that is Saturday, Sunday or inside a school holiday, or any day when K = 0, when the week view renders, then it shows a family lunch for everyone and the dinner, and no lunchbox or snack. Given K = 0 on a weekday, it shows an adult lunch. | `src/components/WeekView.test.tsx`, `src/lib/schoolCalendar.test.ts` |
| RFC-2026-006:AC-11 — Given this week's promotions at the selected retailers (the deal index), when lunches are planned or offered as swaps, then only lunches, snacks and lunchboxes whose every non-cupboard ingredient has a promotion in the deal index are used. No lunch item ever needs an ingredient with no promotion. | `src/lib/planner.test.ts` |
| RFC-2026-006:AC-12 — Given the selected retailers or the promotion status (active or upcoming) change, when the plan is rebuilt, then lunches are re-planned against the new promotions and any that no longer qualify are replaced. | `src/components/PlanProvider.test.tsx`, `src/lib/planner.test.ts` |
| RFC-2026-006:AC-13 — Given a lunch, snack or lunchbox, when its cupboard ingredients are inspected, then they are only existing cupboard staples (oil, salt and pepper, stock) or tap water. No new cupboard items are added to let a lunch qualify. | `src/lib/lunches.test.ts`, `src/lib/planner.test.ts` |
| RFC-2026-006:AC-14 — Given too few lunches qualify to fill the week without repeats (AC-19), when lunches are planned, then repeats are allowed rather than leaving a slot empty. Given no lunch of a kind qualifies for a slot at all, then the slot shows "No lunch idea on promotion at your supermarkets this week" instead of a suggestion. | `src/components/WeekView.test.tsx`, `src/lib/planner.test.ts` |
| RFC-2026-006:AC-15 — Given any lunch, snack or lunchbox, when it is inspected, then no ingredient is a toko-only or specialty product (for example maize meal or dried *matemba*). Zimbabwean dishes are made with their supermarket equivalents, such as *dovi* as peanut butter (*pindakaas*), *mbambaira* as sweet potato (*zoete aardappel*), and *maputi* as plain unsalted popcorn. | `src/lib/lunches.test.ts` |
| RFC-2026-006:AC-16 — Given any planned morning snack, when it is inspected, then it is a single portion of fruit or vegetables from the winter list (for example apple, pear, mandarin or clementine, carrot sticks, cucumber, small tomatoes) and contains no sweets, biscuits, crisps or juice. | `src/lib/lunches.test.ts` |
| RFC-2026-006:AC-17 — Given any planned kids' 12:30 lunch, when it is inspected, then it has a wholegrain base (wholegrain bread or crackers, or a cold alternative such as boiled sweet potato), a topping or protein, and a fruit or vegetable, and it lists water as the drink. It contains no sweets, chocolate spread, crisps or sugary drinks. | `src/lib/lunches.test.ts` |
| RFC-2026-006:AC-18 — Given any lunchbox item, when it is inspected, then it needs no reheating at school and no cooking that morning beyond boiling eggs or slicing. Its prep time is at most 10 minutes. | `src/lib/lunches.test.ts` |
| RFC-2026-006:AC-19 — Given a week with 2 or more school lunches, when lunchboxes are planned, then no 12:30 lunch repeats on consecutive school days, and no morning snack is the same item on consecutive school days (unless AC-14 applies). | `src/lib/planner.test.ts` |
| RFC-2026-006:AC-20 — Given the lunchbox catalogue, when it is inspected, then it includes at least 3 lunches with a Zimbabwean element, made from supermarket food (AC-15). | `src/lib/lunches.test.ts` |
| RFC-2026-006:AC-21 — Given the adult and family lunch catalogues, when they are inspected, then they include cold options (sandwich or salad style), warm options (for example soup, eggs with tomato and bread, beans on toast) and at least 2 Zimbabwean-heritage options. No lunch is "leftovers". | `src/lib/lunches.test.ts` |
| RFC-2026-006:AC-22 — Given an adult lunch, when quantities are worked out, then they cover A portions. Given a family lunch, they cover A + 0.6 × K portions. Given a lunchbox or snack, they cover K kids' portions. | `src/lib/planner.test.ts` |
| RFC-2026-006:AC-23 — Given a planned week with lunches, when the shopping list is built, then every non-cupboard ingredient of every lunch, snack and lunchbox appears on a promotion line, and each line's "for" text names the lunches it is bought for alongside the dinners. The one exception is today's rule in `realize()`: a multi-buy promotion that would buy more than the meals use is listed as a regular-price line that names the promotion. | `src/components/ShoppingView.test.tsx`, `src/lib/planner.test.ts` |
| RFC-2026-006:AC-24 — Given an ingredient used by both dinners and lunches, when the shopping list is built, then it appears once, with the quantity for all its uses. | `src/lib/planner.test.ts` |
| RFC-2026-006:AC-25 — Given several lunches qualify for a slot, when lunches are planned, then they are ranked by promotion value (saving on the promotion lines they need), with fixed tie-breaking, as dinners are scored today. | `src/lib/planner.test.ts` |
| RFC-2026-006:AC-26 — Given a weekly budget, when the week is planned, then the budget is held against the promotion lines for dinners **and** lunches. `weekCost` includes them, and the over-budget message shows when the combined total is over. | `src/components/ShoppingView.test.tsx`, `src/lib/planner.test.ts` |
| RFC-2026-006:AC-27 — Given Settings with no pork, no shellfish or exclude words, when lunches are planned or offered as swaps, then no lunch name or ingredient fails `allowed()`. For example, ham and other pork toppings never appear when "no pork" is on. | `src/lib/planner.test.ts` |
| RFC-2026-006:AC-28 — Given the new lunch ingredients (at least wholegrain bread, cheese, apples, pears, mandarins or clementines, cucumber), when PrijsProfeet deals are matched, then each one matches typical product names and excludes look-alikes such as "appeltaart", "perensap" or "kaascroissant", with match tests. The deal download includes the category bread lives in. | `src/lib/ingredients.test.ts` |
| RFC-2026-006:AC-29 — Given a planned day, when the week view renders, then the day card shows its meals in time order with clear labels: "School snack", "Lunchbox (12:30)", "Lunch", "Family lunch", "Dinner". It has no horizontal scroll at 360 px wide. | `src/components/WeekView.test.tsx` |
| RFC-2026-006:AC-30 — Given a lunch, snack or lunchbox on the week view, when the user taps it, then a sheet opens with its contents, short preparation steps, and each ingredient tagged by shopping-list status (on offer at retailer and price, or cupboard), as for dinners. | `src/components/WeekView.test.tsx` |
| RFC-2026-006:AC-31 — Given a lunch, snack or lunchbox on the week view, when the user chooses to swap it, then a swap sheet lists other items of the **same kind** (snack for snack, lunchbox for lunchbox, adult lunch for adult lunch, family lunch for family lunch). These pass AC-11 and AC-27, are ranked by promotion value, and leave out the item already in that slot. | `src/components/WeekView.test.tsx`, `src/lib/planner.test.ts` |
| RFC-2026-006:AC-32 — Given the user picks an item in a lunch swap sheet, when the swap is made, then only that slot changes, the shopping list and total are rebuilt, and the swap is kept after a reload. Dinners and other lunch slots are unchanged. A hand swap may break the no-repeat rule of AC-19. | `src/components/WeekView.test.tsx` |
| RFC-2026-006:AC-33 — Given the user plans a new week, or changes adults, kids or selected retailers, when the plan is rebuilt, then lunches are re-planned and the shopping list and total follow. | `src/components/PlanProvider.test.tsx`, `src/components/WeekView.test.tsx` |
| RFC-2026-006:AC-34 — Given a plan saved with lunches, when the app is reloaded, then the same lunches are shown and the list is unchanged. A plan saved before this change (dinners only) loads, gets lunches planned, and keeps its dinners. | `src/components/WeekView.test.tsx` |
| RFC-2026-006:AC-35 — Given any settings with K = 0, when dinners are planned, then `suggest()`, the sadza rule, `alternatives()`, the dinner swap sheet and the "Or make:" options (RFC-2026-005) give the same results as before this change. | `src/lib/planner.test.ts` |

### Test run
✅ passed — `npm test` on 2026-11-07

```text
> mealplan@0.1.0 test
> vitest run


 RUN  v5.0.4 C:/Users/FortuneTiriboyi/source/repos/mealplan


 Test Files  13 passed (13)
      Tests  288 passed (288)
   Start at  00:05:04
   Duration  5.78s (tests 44%, environment 39%, import 14%, transform 3%, worker 1%)
```
<!-- devrailsv2:generated:end -->
