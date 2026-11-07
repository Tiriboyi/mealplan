---
id: RFC-2026-006
title: Lunches and school lunchboxes for a family with kids
status: approved
type: change
requested_by: Fortune Tiriboyi
decision_owner: Fortune Tiriboyi
approved_by: Fortune Tiriboyi <tiriboyifortune@gmail.com>
approved_on: 2026-11-07
created: 2026-11-07
updated: 2026-11-07
affected_areas: [src/lib/types.ts, src/lib/settings.ts, src/lib/settings.test.ts, src/lib/planner.ts, src/lib/planner.test.ts, src/lib/ingredients.ts, src/lib/ingredients.test.ts, src/lib/lunches.ts, src/lib/lunches.test.ts, src/lib/schoolCalendar.ts, src/lib/schoolCalendar.test.ts, src/components/PlanProvider.tsx, src/components/PlanProvider.test.tsx, src/components/WeekView.tsx, src/components/WeekView.test.tsx, src/components/ShoppingView.tsx, src/components/ShoppingView.test.tsx, src/components/SettingsView.tsx, src/components/SettingsView.test.tsx, src/components/RecipeSheet.tsx, src/components/RecipeSheet.test.tsx, src/components/SwapSheet.tsx, src/components/SwapSheet.test.tsx, src/components/RecipesView.tsx, src/components/ui.tsx, src/app/globals.css]
---

# REQ-2026-006 - Lunches and school lunchboxes for a family with kids

## Request

Plan more than dinner. The household is two adults and two kids (ages 6 and 8) in the province of Utrecht, planning for winter. Add:

1. **School lunchboxes for the kids.** On school days each kid takes two things to school: a small morning-break snack (fruit or vegetable, the *pauzehap*) and a small lunch eaten at 12:30. The school recommends healthy eating.
2. **Lunch for the adults** on days the kids eat at school.
3. **Family lunch for two adults and two kids** on days the kids are home.

Requester's answers (2026-11-07, two rounds):
- Lunch and lunchbox ingredients go on the weekly shopping list, are matched to promotions and count towards the weekly budget, the same as dinners.
- School days: Monday, Tuesday, Thursday and Friday the kids have both the snack and the lunch at school. **Wednesday is a half day:** the kids take the morning snack to school, then come home and the family has lunch for 4. Saturday and Sunday: family lunch for 4.
- **Days follow the calendar**, and **school holidays follow the school calendar for the province of Utrecht**. On a holiday the kids are home.
- Household: Settings describe **adults** and **kids** instead of one "people" number. A kid is **0.6 of an adult portion** (confirmed). Dinners are for the whole family.
- Style: kids' lunchboxes follow Dutch school guidance (wholegrain bread, fruit and veg, water, no sweets), mixed with dishes from the family's Zimbabwean heritage. Adult lunches use the same mix, plus some **warm lunches**.
- **No leftovers.** They are too complicated to keep track of.
- **Swapping a lunch, snack or lunchbox by hand** is wanted.
- **Every lunch must be made from food that is readily available in the supermarkets the user has selected.** Never suggest food those supermarkets do not sell. Clarified: "available" means **on a PrijsProfeet promotion this week at a selected supermarket**.

No ticket. The request came straight from the requester in the session of 2026-11-07.

## Business Reason

The app plans dinners on promotion so the family shops once a week. Lunches and school lunchboxes are bought on the side today, outside the plan and the budget. That means extra shopping trips and an incomplete budget, and every evening someone has to think of a healthy lunchbox that fits the school's rules. Planning them with dinners puts the whole week's food on one promotion-led list and one budget. Suggestions are only useful if they can be bought at the family's own supermarkets.

## Current Evidence

Status: `Confirmed`

Claim type: `behaviour`

Claim: The planner only plans dinners. `suggest()` picks `prefs.days` recipes from `RECIPES` (all dinners), and `realize()` builds the shopping list (promotion, regular-price and cupboard lines) from those recipes alone. `Plan.meals` holds only dinners. The swap sheet (`SwapSheet`) and `alternatives()` work on dinner positions only.

Sources: `suggest`, `realize`, `alternatives`, `Plan` in `src/lib/planner.ts`; `RECIPES` in `src/lib/recipes.ts`; `src/components/SwapSheet.tsx`.

Last verified: 2026-11-07

Status: `Confirmed`

Claim type: `data`

Claim: Household size is a single `Prefs.people` number (default 2). It is used for quantities (`buy()` → `ingredient.grams * people * meals`), in scoring (`MAIN_BUDGET_PER_PERSON` per person), in Settings ("People at the table", 1–10) and in the week view summary. Saved settings in `localStorage` (`mealplan.settings`) already contain `people`, so old settings must still load.

Sources: `Prefs`/`DEFAULT_PREFS` in `src/lib/types.ts`; `buy`, `score` in `src/lib/planner.ts`; `src/components/SettingsView.tsx` line 91; `src/components/WeekView.tsx` line 84; `loadSettings` in `src/lib/settings.ts`. Also referenced in `RecipeSheet.tsx`, `planner.test.ts` and `settings.test.ts`.

Last verified: 2026-11-07

Status: `Confirmed`

Claim type: `behaviour`

Claim: Planned days are offsets from today, not dates. `dayAt(offset)` labels day 0 "Today" and day 1 "Tomorrow" from the current date. The saved plan (`mealplan.plan`) stores `recipeIds`, `skipped`, `ticked`, `budget` and `overBudget`, but no start date, so a saved week's days move as the calendar moves. To tie lunches to weekdays and school holidays, the plan must store the date its first day falls on.

Sources: `dayAt` in `src/components/ui.tsx`; `loadPlan` and `PLAN_KEY` in `src/components/PlanProvider.tsx`.

Last verified: 2026-11-07

Status: `Confirmed`

Claim type: `data`

Claim: The app's only product data is promotions from PrijsProfeet for the selected retailers (`Settings.retailers`, default Albert Heijn, Jumbo, Plus, out of 15 chains in `RETAILERS`). It has **no data on a chain's full assortment**. An ingredient with no promotion becomes a "regular price" line with a Dutch shelf name (`Ingredient.nl`), without checking that the chain sells it. One existing cupboard item is explicitly not a supermarket product: `maize_meal` ("maismeel, at a toko or the world-food aisle").

Sources: `RETAILERS`, `DEFAULT_RETAILERS` in `src/lib/retailers.ts`; `Settings` in `src/lib/settings.ts`; `Ingredient` and `INGREDIENTS` in `src/lib/ingredients.ts`; `realize` in `src/lib/planner.ts`.

Last verified: 2026-11-07

Status: `Confirmed`

Claim type: `behaviour`

Claim: The deal index already holds only promotions at the selected retailers. `PlanProvider` fetches `/api/deals` again whenever `retailers` or `status` change, and `buildIndex(deals, prefs)` keys those deals by ingredient id after the diet filter (`allowed()`). So "ingredient has a promotion at a selected supermarket" is `index.has(ingredientId)`, the same test `onOffer()` uses for dinners.

Sources: `buildIndex`, `onOffer` in `src/lib/planner.ts`; deals effect in `src/components/PlanProvider.tsx` (dependencies `[retailers, status, apiKey, attempt]`).

Last verified: 2026-11-07

Status: `Unclear`

Claim type: `data`

Claim: How many lunch ingredients are on promotion in a typical week. Fruit, cheese and bread are often on promotion at the large chains, but with a promotion-only rule some weeks may have too few qualifying lunches to fill every slot without repeats. Not measured.

Sources: Not measured; to measure on the cached deals during implementation.

Last verified: 2026-11-07

Status: `Likely`

Claim type: `requirement`

Claim: Dutch school guidance (Voedingscentrum / Gezonde School, "gezonde lunchtrommel"): the morning break is fruit or vegetables plus water. Lunch is wholegrain bread (or another wholegrain option) with a modest topping, plus fruit or vegetables, and water or milk. No sweets, crisps, cake or sugary drinks. This is from general knowledge and was **not re-checked against the source this session**. Each school's own rules take precedence.

Sources: Requester ("the school recommends healthy eating"); Voedingscentrum guidance (to be verified during implementation).

Last verified: 2026-11-07

Status: `Likely`

Claim type: `data`

Claim: School holidays in the Netherlands are set per region (north, middle, south) by the Rijksoverheid. The autumn and spring holidays differ by region; the Christmas and May holidays are national. The province of Utrecht is in **region middle**, and the dates are published on rijksoverheid.nl and as open data. The region and dates were **not checked this session**. Individual schools also add their own study days (*studiedagen*), which are not in any central calendar.

Sources: General knowledge; rijksoverheid.nl "Schoolvakanties" (to verify during implementation).

Last verified: 2026-11-07

Status: `Likely`

Claim type: `data`

Claim: In Dutch winter (roughly November to February) local or stored produce includes apples, pears, winter carrots, cabbage, leeks and kale. Mandarins, clementines and oranges are in season as imports. Cucumber and small tomatoes come from Dutch greenhouses all year. This is general knowledge, **not checked against the Voedingscentrum seasonal calendar this session**.

Sources: General knowledge; Voedingscentrum *groente- en fruitkalender* (to verify).

Last verified: 2026-11-07

## Desired Outcome

Settings describe the household as adults and kids. A planned week is fixed to real dates. For every planned day the week view shows the dinner and the day's lunches, chosen by the date's weekday and the Utrecht (region middle) school calendar:

| Day | Kids | Adults |
|---|---|---|
| Mon, Tue, Thu, Fri (school) | Lunchbox: morning snack + 12:30 lunch | Adult lunch (cold or warm) |
| Wed (school) | Morning snack for school, then family lunch at home | Family lunch for 4 |
| Sat, Sun, school holidays | Family lunch for 4 | Family lunch for 4 |

Lunchboxes follow the school guidance and mix Dutch and Zimbabwean food. Every lunch is made only from food on promotion this week at the supermarkets the user selected, plus a few cupboard basics. Dinners are bought on promotion where possible, as today. Everything planned appears on the one shopping list, and counts towards the weekly budget. Any lunch, snack or lunchbox can be swapped by hand.

## Acceptance Criteria

Household

- [x] AC-1: Given Settings, when the user opens them, then they can set **Adults** (1–10, default 2) and **Kids** (0–6, default 0) instead of "People at the table", and the week view summary shows both (for example "2 adults, 2 kids").
- [x] AC-2: Given settings saved before this change with `people: n`, when they load, then they become `adults: n, kids: 0` and nothing else changes.
- [x] AC-3: Given a household of A adults and K kids, when quantities are worked out for a meal for the whole family (dinner or family lunch), then they use A + 0.6 × K portions. Given K = 0, the dinners, shopping list and `weekCost` are identical to today's output for `people: A`.

Days and the school calendar

- [x] AC-4: Given the user plans a new week, when the plan is saved, then it stores the date of its first day (today). Given the plan is reopened on a later date, then every day keeps its date and weekday, and "Today" and "Tomorrow" label only the days that really are today and tomorrow.
- [x] AC-5: Given a plan saved before this change (no start date), when it loads, then its first day is taken as the day it is loaded, that date is saved, and its dinners are kept.
- [x] AC-6: Given a date, when the app decides whether it is a school day, then it is a school day only if it is Monday to Friday and not inside a school holiday for region middle (province of Utrecht) for school years 2026–2027 and 2027–2028, as published by the Rijksoverheid.
- [x] AC-7: Given a date after the last school year in the calendar, when the app decides whether it is a school day, then it treats Monday to Friday as school days and the Settings page shows "School holidays known until" followed by the last date in the calendar, so the gap is visible.

Which meals on which day

- [x] AC-8: Given K ≥ 1 and a planned day that is a school day on Monday, Tuesday, Thursday or Friday, when the week view renders, then that day shows a kids' lunchbox with a morning snack and a 12:30 lunch, an adult lunch, and the dinner.
- [x] AC-9: Given K ≥ 1 and a planned day that is a school day on Wednesday, when the week view renders, then it shows a kids' morning snack, a family lunch for everyone, and the dinner, and no 12:30 lunchbox.
- [x] AC-10: Given a planned day that is Saturday, Sunday or inside a school holiday, or any day when K = 0, when the week view renders, then it shows a family lunch for everyone and the dinner, and no lunchbox or snack. Given K = 0 on a weekday, it shows an adult lunch.

On promotion at the selected supermarkets

- [x] AC-11: Given this week's promotions at the selected retailers (the deal index), when lunches are planned or offered as swaps, then only lunches, snacks and lunchboxes whose every non-cupboard ingredient has a promotion in the deal index are used. No lunch item ever needs an ingredient with no promotion.
- [x] AC-12: Given the selected retailers or the promotion status (active or upcoming) change, when the plan is rebuilt, then lunches are re-planned against the new promotions and any that no longer qualify are replaced.
- [x] AC-13: Given a lunch, snack or lunchbox, when its cupboard ingredients are inspected, then they are only existing cupboard staples (oil, salt and pepper, stock) or tap water. No new cupboard items are added to let a lunch qualify.
- [x] AC-14: Given too few lunches qualify to fill the week without repeats (AC-19), when lunches are planned, then repeats are allowed rather than leaving a slot empty. Given no lunch of a kind qualifies for a slot at all, then the slot shows "No lunch idea on promotion at your supermarkets this week" instead of a suggestion.
- [x] AC-15: Given any lunch, snack or lunchbox, when it is inspected, then no ingredient is a toko-only or specialty product (for example maize meal or dried *matemba*). Zimbabwean dishes are made with their supermarket equivalents, such as *dovi* as peanut butter (*pindakaas*), *mbambaira* as sweet potato (*zoete aardappel*), and *maputi* as plain unsalted popcorn.

Lunchbox content (school guidance)

- [x] AC-16: Given any planned morning snack, when it is inspected, then it is a single portion of fruit or vegetables from the winter list (for example apple, pear, mandarin or clementine, carrot sticks, cucumber, small tomatoes) and contains no sweets, biscuits, crisps or juice.
- [x] AC-17: Given any planned kids' 12:30 lunch, when it is inspected, then it has a wholegrain base (wholegrain bread or crackers, or a cold alternative such as boiled sweet potato), a topping or protein, and a fruit or vegetable, and it lists water as the drink. It contains no sweets, chocolate spread, crisps or sugary drinks.
- [x] AC-18: Given any lunchbox item, when it is inspected, then it needs no reheating at school and no cooking that morning beyond boiling eggs or slicing. Its prep time is at most 10 minutes.
- [x] AC-19: Given a week with 2 or more school lunches, when lunchboxes are planned, then no 12:30 lunch repeats on consecutive school days, and no morning snack is the same item on consecutive school days (unless AC-14 applies).
- [x] AC-20: Given the lunchbox catalogue, when it is inspected, then it includes at least 3 lunches with a Zimbabwean element, made from supermarket food (AC-15).

Adult and family lunches

- [x] AC-21: Given the adult and family lunch catalogues, when they are inspected, then they include cold options (sandwich or salad style), warm options (for example soup, eggs with tomato and bread, beans on toast) and at least 2 Zimbabwean-heritage options. No lunch is "leftovers".
- [x] AC-22: Given an adult lunch, when quantities are worked out, then they cover A portions. Given a family lunch, they cover A + 0.6 × K portions. Given a lunchbox or snack, they cover K kids' portions.

Shopping list and budget

- [x] AC-23: Given a planned week with lunches, when the shopping list is built, then every non-cupboard ingredient of every lunch, snack and lunchbox appears on a promotion line, and each line's "for" text names the lunches it is bought for alongside the dinners. The one exception is today's rule in `realize()`: a multi-buy promotion that would buy more than the meals use is listed as a regular-price line that names the promotion.
- [x] AC-24: Given an ingredient used by both dinners and lunches, when the shopping list is built, then it appears once, with the quantity for all its uses.
- [x] AC-25: Given several lunches qualify for a slot, when lunches are planned, then they are ranked by promotion value (saving on the promotion lines they need), with fixed tie-breaking, as dinners are scored today.
- [x] AC-26: Given a weekly budget, when the week is planned, then the budget is held against the promotion lines for dinners **and** lunches. `weekCost` includes them, and the over-budget message shows when the combined total is over.
- [x] AC-27: Given Settings with no pork, no shellfish or exclude words, when lunches are planned or offered as swaps, then no lunch name or ingredient fails `allowed()`. For example, ham and other pork toppings never appear when "no pork" is on.
- [x] AC-28: Given the new lunch ingredients (at least wholegrain bread, cheese, apples, pears, mandarins or clementines, cucumber), when PrijsProfeet deals are matched, then each one matches typical product names and excludes look-alikes such as "appeltaart", "perensap" or "kaascroissant", with match tests. The deal download includes the category bread lives in.

Week view, sheets and swapping

- [x] AC-29: Given a planned day, when the week view renders, then the day card shows its meals in time order with clear labels: "School snack", "Lunchbox (12:30)", "Lunch", "Family lunch", "Dinner". It has no horizontal scroll at 360 px wide.
- [x] AC-30: Given a lunch, snack or lunchbox on the week view, when the user taps it, then a sheet opens with its contents, short preparation steps, and each ingredient tagged by shopping-list status (on offer at retailer and price, or cupboard), as for dinners.
- [x] AC-31: Given a lunch, snack or lunchbox on the week view, when the user chooses to swap it, then a swap sheet lists other items of the **same kind** (snack for snack, lunchbox for lunchbox, adult lunch for adult lunch, family lunch for family lunch). These pass AC-11 and AC-27, are ranked by promotion value, and leave out the item already in that slot.
- [x] AC-32: Given the user picks an item in a lunch swap sheet, when the swap is made, then only that slot changes, the shopping list and total are rebuilt, and the swap is kept after a reload. Dinners and other lunch slots are unchanged. A hand swap may break the no-repeat rule of AC-19.
- [x] AC-33: Given the user plans a new week, or changes adults, kids or selected retailers, when the plan is rebuilt, then lunches are re-planned and the shopping list and total follow.
- [x] AC-34: Given a plan saved with lunches, when the app is reloaded, then the same lunches are shown and the list is unchanged. A plan saved before this change (dinners only) loads, gets lunches planned, and keeps its dinners.

Dinners unchanged

- [x] AC-35: Given any settings with K = 0, when dinners are planned, then `suggest()`, the sadza rule, `alternatives()`, the dinner swap sheet and the "Or make:" options (RFC-2026-005) give the same results as before this change.

## Out Of Scope

- Breakfast.
- Seasons other than winter. This RFC ships the winter fruit and veg list only. A month-based seasonal list is a follow-up.
- School study days (*studiedagen*) and public holidays outside the school holidays. These are school-specific.
- School calendars for regions other than Utrecht (region middle), and choosing a region in Settings.
- Choosing school days or a half day other than Wednesday in Settings. The Mon/Tue/Thu/Fri + Wednesday-half-day pattern is fixed.
- Per-kid ages, allergies or different lunchboxes per kid. Both kids get the same lunchbox.
- Leftovers (dropped by the requester on 2026-11-07).
- Suggesting lunches with ingredients at regular price. A lunch qualifies only through this week's promotions (AC-11).
- Changing how dinners are chosen: dinners may still use regular-price ingredients. See open decision 1.
- "Or make:" style alternatives for lunches.
- Treats for birthdays (*traktaties*) and drinks other than water and milk.
- Nutrition figures (calories, nutrients).

## Dependencies And Open Decisions

Decided by the requester (2026-11-07): lunches go on the shopping list and in the budget; Wednesday is a half day (snack at school, lunch at home); the household is adults + kids with a kid at 0.6 of an adult portion; style is Dutch school guidance mixed with Zimbabwean dishes; adults also get warm lunches; no leftovers; days follow the calendar with the Utrecht school calendar; lunches can be swapped by hand; every lunch must be made from food sold at the selected supermarkets.

**Decided after the first approval (2026-11-07), answering the three open questions below:** (1) the promotion-only rule applies to lunches only, dinners are unchanged; (2) school holidays come from a table in the code, from rijksoverheid.nl, updated yearly; (3) past days of a dated week stay visible, marked as past.

**Scope revision (2026-11-07):** `src/components/RecipesView.tsx` is added to `affected_areas`. The recipes page labels a planned dinner with `dayAt(position)`, which counts from today. With weeks fixed to dates (AC-4) it must count from the week's start date, a one-line change. Without it the recipes page would name the wrong day for a week reopened on a later date.

**Open questions at the first approval (now decided, see above):**
1. **Dinners and the promotion-only rule.** You said *all* dishes must be available at the selected supermarkets, and clarified that this means on promotion. This RFC applies it to lunches only. Dinners today prefer promotions but may use regular-price ingredients, and maize meal for sadza is a cupboard item from a toko. Making dinners promotion-only would often leave too few dinners and would clash with the "at least one sadza dinner a week" rule. Recommendation: keep dinners as they are in this RFC, with a separate follow-up if wanted. Do you agree?
2. **Where the school holidays come from** (AC-6, AC-7). Recommendation: a table in the code for region middle, school years 2026–2027 and 2027–2028, copied from rijksoverheid.nl, with the source and date in a comment and a yearly update. The alternative, fetching the Rijksoverheid open-data feed at run time, adds a network dependency and a failure mode. Is the bundled table acceptable?
3. **Days fixed to dates** (AC-4) also changes the dinner labels: a week planned on Monday and opened on Wednesday will show Monday and Tuesday as past days instead of re-labelling them. Is that what you want, or should past days be hidden?

Dependencies and risks:
- Builds on RFC-2026-005 (dinner options), which is not yet merged. This RFC's branch should be started after the RFC-2026-005 PR is merged, or stacked on it.
- Changes `Prefs` and the saved plan (browser `localStorage` shapes) with migrations (AC-2, AC-5). Not a database schema change. No personal data leaves the browser.
- No new npm dependency expected. An ADR will be recorded (`devrailsv2 adr new`) for the meal-type model (dinner / lunch / snack / lunchbox) and for dated plans, because they change the planner's core shape from "one dinner per day offset".
- With the promotion-only rule, weeks with few lunch promotions will repeat lunches or show the "No lunch idea" message (AC-14). The catalogue should be broad (many fruit, bread and topping variants) to lower that risk. The change record will report how often it happens on the cached deals.
- Matching bread, cheese and fruit deals without false positives needs careful `not` patterns. Covered by AC-28.
- Larger shopping lists mean more promotion lines, and the budget search in `planWeek` may take longer. To be measured.
- Size: this is a large change (35 criteria). It can be split into three RFCs if preferred: (a) adults + kids household and dated plans with the school calendar, (b) kids' lunchboxes, (c) adult/family lunches and lunch swaps.

## Verification Plan

- Unit tests in `src/lib/settings.test.ts`: AC-1 defaults, AC-2 migration.
- Unit tests in a new `src/lib/schoolCalendar.test.ts`: AC-6 (a date inside each region-middle holiday is not a school day; the days either side are), AC-7.
- Unit tests in `src/lib/planner.test.ts` and a new `src/lib/lunches.test.ts` with fixed deal fixtures, a fixed "today" and several seeds: AC-3, AC-8 to AC-10 (including weeks starting on Wednesday, on Saturday and in the Christmas holiday), AC-11 to AC-15 (promotion-only rule, with deal fixtures that lack some lunch ingredients and a fixture with none), AC-16 to AC-22 (catalogue and planning rules), AC-23 to AC-27 (shopping list, merge, promotion preference, budget, diet filters), AC-35 (dinner results unchanged with K = 0; existing tests stay green unchanged).
- Ingredient match tests in `src/lib/ingredients.test.ts` for the new lunch ingredients, with real-looking product names, both positive and negative: AC-28.
- Component tests (Vitest + jsdom, ADR-0001) in `WeekView.test.tsx`, `SettingsView.test.tsx`, `RecipeSheet.test.tsx`, `SwapSheet.test.tsx`, `ShoppingView.test.tsx` and `PlanProvider.test.tsx`: AC-1, AC-4, AC-5, AC-7 (message), AC-29 to AC-34.
- Every test names its criterion, for example `RFC-2026-006:AC-17`.
- Full suite with `npm test`. `devrailsv2 check` before reporting done.
- Measurement for the change record: over the cached deals, how many lunch ingredients matched a promotion, how many lunch slots repeat or stay empty per week, the average weekly total before and after lunches, and `planWeek` run time with a budget.
- Manual browser check (`npm run dev`) at phone width (≤ 400 px) and desktop, in light and dark mode: the day card with snack, lunchbox, lunch and dinner stays readable with no horizontal scroll; the lunch swap sheet works.
- Before writing the catalogue and the holiday table: check the Voedingscentrum lunchbox guidance and seasonal calendar, and the rijksoverheid.nl region-middle holiday dates. Record what was checked, with dates, in the change record. Update the `Likely`/`Unclear` evidence above only for what matches.

## Change History

| Date | Author | Change |
|---|---|---|
| 2026-11-07 | Fortune Tiriboyi | Created draft |
| 2026-11-07 | Claude (agent) | Filled in all sections from the requester's request and answers of 2026-11-07 |
| 2026-11-07 | Claude (agent) | Revised from the requester's second answers: kid portion 0.6 confirmed; leftovers dropped; days fixed to dates with the Utrecht (region middle) school calendar; lunch swaps added; lunches limited to food sold at the selected supermarkets. Criteria renumbered (now AC-1 to AC-35). |
| 2026-11-07 | Fortune Tiriboyi <tiriboyifortune@gmail.com> | Approved |
| 2026-11-07 | Claude (agent) | Back to draft for a scope change requested by the requester: `src/components/RecipesView.tsx` added to `affected_areas` (one-line `dayAt` fix for dated weeks). Recorded the three decisions taken after approval. Acceptance criteria unchanged. |
| 2026-11-07 | Fortune Tiriboyi <tiriboyifortune@gmail.com> | Approved |
| 2026-11-07 | Fortune Tiriboyi | Implemented — see CR-2026-006 |
