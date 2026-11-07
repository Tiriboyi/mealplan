# ADR-0003: Meals per day and dated weekly plans

Status: Proposed
Date: 2026-11-07
RFC: RFC-2026-006

## Context
Until RFC-2026-006 a plan was one dinner per day offset from today: day 0 was always "Today", and the saved plan held only dinner ids. The household (2 adults, 2 kids aged 6 and 8, province of Utrecht) also needs a school snack and a 12:30 lunchbox on school days, an adult lunch, and a family lunch on Wednesdays (half day), weekends and school holidays. Which of those a day needs depends on its real weekday and the school calendar, so a day can no longer be just an offset. The requester also asked that lunches use only food on a PrijsProfeet promotion at the selected supermarkets, and that lunches count towards the same shopping list and budget as dinners.

## Decision
- **Dated weeks.** The saved plan (`mealplan.plan`) stores `start`, the ISO date of day 0. A week keeps its dates when reopened. "Today" and "Tomorrow" label only the days that really are, and earlier days stay listed but marked past. Plans saved before this change take the day they are loaded as `start`.
- **Meal kinds.** Dinners stay as they were (`RECIPES`, `suggest`, sadza rule, `alternatives`, "Or make:"). Lunches are a separate catalogue (`src/lib/lunches.ts`) with four kinds: `snack`, `lunchbox`, `adult`, `family`. `lunchSlots(date, kids)` in `src/lib/schoolCalendar.ts` decides which kinds a day has. The plan stores lunches as a map from slot key `"<day>-<kind>"` to a lunch id, or `null` when nothing qualifies.
- **Promotion-only lunches.** A lunch qualifies only when every non-cupboard ingredient is in the deal index (this week's promotions at the selected retailers) and it passes the diet filters. A lunch may assume only oil, salt and pepper, and stock from the cupboard. Dinners keep using regular-price ingredients where needed.
- **One shopping list.** `realize(recipeIds, index, prefs, lunches)` adds lunch ingredients to the same lines as dinners, summing grams per ingredient. Snacks and lunchboxes are per kid, adult lunches per adult, and family meals per `adults + 0.6 × kids`. `weekCost` and `planWeek` take the lunches. Lunches are planned first and are fixed while the budget search swaps dinners.
- **School calendar as data.** The region Midden holiday dates for 2026–27 and 2027–28 are a table in `schoolCalendar.ts`, copied from rijksoverheid.nl on 2026-11-07. After the table ends, every weekday counts as a school day, and Settings shows the date the table runs until.

## Consequences
- Easier: adding a meal kind or a lunch is data only. The shopping list, budget and swap sheet already handle any number of meals per day.
- Easier: a reopened week matches the shopping list that was bought for it.
- Harder: the holiday table must be extended once a year. The autumn and spring dates are advice, so a school may differ. School study days are not covered.
- Accepted: with the promotion-only rule, lunch slots can be empty in weeks without the right promotions. Measured on the cached promotions, 0% of slots were empty with Albert Heijn, Jumbo and Plus, but 69% without Albert Heijn (no wholegrain bread on promotion). The slot then says so instead of suggesting food at regular price.
- Accepted: "Or make:" still looks only at what the dinners buy, so it is unchanged by lunches.

## Alternatives considered
- **Keep offsets from today.** Rejected: a day's lunch type would change every time the week is reopened, and the list would no longer match.
- **Fetch the holidays from the Rijksoverheid open-data feed at run time.** Rejected for now: it adds a network dependency and a failure mode for data that changes once a year.
- **Fold lunches into `RECIPES` with a meal-type field.** Rejected: dinner rules (sadza once or twice a week, protein variety, "Or make:") do not apply to lunches, and every dinner function would need a filter.
- **A hand-curated stock list per supermarket.** Dropped by the requester, who defined "available" as on promotion. PrijsProfeet has no assortment data, so such a list would have been unverifiable.
