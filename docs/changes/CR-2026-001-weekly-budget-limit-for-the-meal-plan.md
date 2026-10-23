# CR-2026-001: Weekly budget limit for the meal plan

RFC: [RFC-2026-001](../rfc/RFC-2026-001-weekly-budget-limit-for-the-meal-plan.md) · Spec: none · Ticket: GH#1 · Analysis: [analysis](../../docs/analysis/TICKET-gh-1.md)
Date: 2026-10-23

## Summary
The user can now set an optional weekly budget in Settings: a €1 stepper that also accepts a typed amount, and blocks Save on invalid input. The planner (`planWeek`) looks for a week whose promotion total fits the budget, without adding regular-price items. When none fits, it returns the cheapest week found, flagged over budget. The shopping page shows "Over budget by …" (danger colour) or "… under budget" (muted) next to the total. The saved week records the budget it was planned under, so flagged or hand-edited weeks are not replanned on reload. Component tests (Vitest + jsdom + Testing Library, ADR-0001) were added for the UI.

## Fit-criteria evidence
All tests were run with `npm test` on 2026-10-23: 7 files, 144 tests, all passed. `npm run typecheck` is clean, and Serena reports no diagnostics on any changed file.
| Criterion | Evidence (test) | Result |
|---|---|---|
| F-1 / AC-1 empty field by default | `SettingsView.test.tsx` "is shown and empty by default"; `planner.test.ts` "there is no budget by default"; `settings.test.ts` "a fresh browser has no budget" | ✅ pass |
| AC-2 €1 steps, typed decimals | `SettingsView.test.tsx` "steps by one euro…", "takes a typed amount with a point or a comma"; `budget.test.ts` "%s is %d euro" | ✅ pass |
| F-6 / AC-3 invalid input blocks Save | `SettingsView.test.tsx` "%s shows an error, blocks Save and keeps the saved budget" (0, -5, abc), "fixing the amount clears the error", "clearing the field removes the budget"; `budget.test.ts` "%s is not a budget" | ✅ pass |
| F-7 / AC-4 persists across reload | `SettingsView.test.tsx` "a saved budget is still set after a reload"; `settings.test.ts` round-trip, legacy settings, invalid stored values | ✅ pass |
| F-2 / AC-5 no budget = today's week | `planner.test.ts` "without a budget the week is exactly what the planner picks today" (seeds 0–20 × 2/5/7 dinners) | ✅ pass |
| F-3 / AC-6 finds a week within budget | `planner.test.ts` "finds a week within budget when one exists" (budget derived from a cheaper valid week; checks the greedy week is over it) | ✅ pass |
| F-4 / AC-7 impossible budget, cheapest week, flagged | `planner.test.ts` "an impossible budget gives the cheapest week found, flagged over budget" | ✅ pass |
| AC-8 no replanning while the budget is unchanged | `PlanProvider.test.tsx` flagged week and hand-edited week kept across reload, Shuffle replans; `planner.test.ts` `keepOrPlan` cases | ✅ pass |
| AC-9 new budget replans right away | `PlanProvider.test.tsx` "saving a budget the week is over replans it right away", "…already meets keeps it"; `planner.test.ts` `keepOrPlan` cases | ✅ pass |
| F-4 / AC-10 "Over budget by …" in danger colour next to the total | `ShoppingView.test.tsx` "over budget says by how much…" (text, `budget-over` class, inside the total row); `budget.test.ts` | ✅ pass |
| F-5 / AC-11 "… under budget", muted | `ShoppingView.test.tsx` "within budget says what is left…"; `budget.test.ts` | ✅ pass |
| F-9 / AC-12 promotion items only, "Have it" excluded | `ShoppingView.test.tsx` "compares promotion items only, without what I already have" | ✅ pass |
| AC-13 no budget, no text | `ShoppingView.test.tsx` "no budget, no budget text"; `budget.test.ts` | ✅ pass |
| F-8 / AC-14 sadza 1–2, no pork or shellfish | `planner.test.ts` "a budget keeps sadza once or twice a week and pork and shellfish out" (4 budgets × 15 seeds × 2/5/7) | ✅ pass |
| AC-15 no extra regular-price items | `planner.test.ts` "a budget never buys savings by moving food to regular price" (5 budgets × 10 seeds × 2/5/7) | ✅ pass |
| F-10 out of scope respected | Review: no per-day/meal/retailer budgets, no Week page change, no swap-time warning | ✅ |
| Performance (Verification Plan) | Timing probe with 2,263 live deals (6 retailers): base week €36.59; budgets 120%/90%/75%/50%/€1 → worst 17 ms per `planWeek`; 90% budget met (€32.44); lower budgets flagged over with the €32.44 week; 0 regular-price lines throughout. Probe was not committed. | ✅ < 200 ms |

## Known limitations & follow-ups
- **Not checked in a browser.** Colours (light and dark), the stepper layout at phone width and the save bar were not checked visually. jsdom tests check text, classes and behaviour only. A manual check with `npm run dev` is still needed.
- **Best-effort search.** "Cheapest week" is the cheapest of the weeks tried: 40 seeded weeks plus single-dinner swaps. It is not a guaranteed global minimum (RFC Out Of Scope).
- **The flag can go stale.** It reflects planning time. If deals change while the budget is unchanged, the week is kept, and the shopping page shows the live over/under amount.
- **Manual swaps** are not budget-checked (by design). The shopping page shows the result.
- **Test process notes.** The test "a saved budget is there after a reload" (`settings.test.ts`) passed even in the red run, because settings round-trip as JSON. The test "a stored budget of %j is not a budget" and its input validation were added during green, so they never had a red run. The shopping-page text tests now compare exact `textContent`, because `money()` uses a non-breaking space.
- **Design deviation from the RFC text:** `weekCost` lives in `planner.ts`, not `budget.ts`, to avoid a circular import (noted in the revised RFC).
- **Duplicated fixtures:** the sample deals appear in three test files. A shared fixture module would sit outside `affected_areas`, so it is left for later.
- **Gate base:** the generated file list and `check` diff against `origin/main`, which is behind `typography-instrument-satoshi`. Earlier unmerged work shows up as out-of-scope warnings.

<!-- devrailsv2:generated:start -->
## Generated by devrailsv2
_Regenerated each time `devrailsv2 done` runs. Base: origin/main._

### Files changed
**Tooling**
- `.claude/settings.json`
- `.githooks/commit-msg`
- `.githooks/pre-commit`
- `.github/ISSUE_TEMPLATE/bug.yml`
- `.github/ISSUE_TEMPLATE/config.yml`
- `.github/ISSUE_TEMPLATE/feature.yml`
- `.github/ISSUE_TEMPLATE/ui.yml`
- `.github/copilot-instructions.md`
- `.github/pull_request_template.md`
- `.github/workflows/devrailsv2.yml`
- `.rails/config.json`
- `.rails/tool/bin/devrailsv2.js`
- `.rails/tool/package.json`
- `.rails/tool/src/cli.js`
- `.rails/tool/src/commands/adr.js`
- `.rails/tool/src/commands/auth.js`
- `.rails/tool/src/commands/check.js`
- `.rails/tool/src/commands/doctor.js`
- `.rails/tool/src/commands/done.js`
- `.rails/tool/src/commands/hook.js`
- `.rails/tool/src/commands/init.js`
- `.rails/tool/src/commands/rfc.js`
- `.rails/tool/src/commands/serena.js`
- `.rails/tool/src/commands/spec.js`
- `.rails/tool/src/commands/status.js`
- `.rails/tool/src/commands/ticket.js`
- `.rails/tool/src/commands/update.js`
- `.rails/tool/src/config.js`
- `.rails/tool/src/docs.js`
- `.rails/tool/src/frontmatter.js`
- `.rails/tool/src/gate.js`
- `.rails/tool/src/scaffold.js`
- `.rails/tool/src/serena.js`
- `.rails/tool/src/tickets.js`
- `.rails/tool/src/util.js`
- `.rails/tool/templates/agents.md`
- `.rails/tool/templates/claude.md`
- `.rails/tool/templates/docs/CHANGELOG.md`
- `.rails/tool/templates/docs/STATUS.md`
- `.rails/tool/templates/docs/adr.md`
- `.rails/tool/templates/docs/analysis.md`
- `.rails/tool/templates/docs/change-record.md`
- `.rails/tool/templates/docs/evidence-map.md`
- `.rails/tool/templates/docs/parity-matrix.md`
- `.rails/tool/templates/docs/rfc-0000.md`
- `.rails/tool/templates/docs/rfc-fast-track.md`
- `.rails/tool/templates/docs/rfc-setup.md`
- `.rails/tool/templates/docs/rfc.md`
- `.rails/tool/templates/docs/spec-guidelines.md`
- `.rails/tool/templates/docs/spec.md`
- `.rails/tool/templates/docs/ticket-format.md`
- `.rails/tool/templates/docs/workflow.md`
- `.rails/tool/templates/githooks/commit-msg`
- `.rails/tool/templates/githooks/pre-commit`
- `.rails/tool/templates/github/azure-pipelines.yml`
- `.rails/tool/templates/github/copilot-instructions.md`
- `.rails/tool/templates/github/pull_request_template.md`
- `.rails/tool/templates/github/workflow.yml`
- `.rails/tool/templates/prompts/done.md`
- `.rails/tool/templates/prompts/implement.md`
- `.rails/tool/templates/prompts/rfc.md`
- `.rails/tool/templates/prompts/spec.md`
- `.rails/tool/templates/prompts/status.md`
- `.rails/tool/templates/prompts/ticket.md`
- `.rails/tool/templates/stack/dotnet.md`
- `.rails/tool/templates/stack/migration.md`
- `.rails/tool/templates/stack/node.md`
- `.rails/tool/templates/stack/other.md`
- `.rails/tool/templates/stack/serena.md`
- `.rails/tool/templates/tickets/azure/bug-acceptance.html`
- `.rails/tool/templates/tickets/azure/bug.html`
- `.rails/tool/templates/tickets/azure/story-acceptance.html`
- `.rails/tool/templates/tickets/azure/story.html`
- `.rails/tool/templates/tickets/azure/ui-acceptance.html`
- `.rails/tool/templates/tickets/azure/ui.html`
- `.rails/tool/templates/tickets/github/bug.yml`
- `.rails/tool/templates/tickets/github/config.yml`
- `.rails/tool/templates/tickets/github/feature.yml`
- `.rails/tool/templates/tickets/github/ui.yml`

**Config / dependencies**
- `.env.example`
- `.gitattributes`
- `.gitignore`
- `.mcp.json`
- `.serena/.gitignore`
- `.serena/project.yml`
- `.vscode/mcp.json`
- `package-lock.json`
- `package.json`
- `vitest.config.mts`

**Docs**
- `AGENTS.md`
- `CHANGELOG.md`
- `CLAUDE.md`
- `README.md`
- `docs/STATUS.md`
- `docs/changes/.gitkeep`
- `docs/changes/CR-2026-002-bump-next-to-16-4-2-for-security-advisories.md`
- `docs/guides/spec-guidelines.md`
- `docs/guides/ticket-format.md`
- `docs/guides/workflow.md`

**RFC / spec / analysis**
- `docs/adr/.gitkeep`
- `docs/adr/ADR-0001-component-tests-with-vitest-jsdom-and-react-testin.md`
- `docs/analysis/.gitkeep`
- `docs/analysis/TICKET-gh-1.md`
- `docs/rfc/.gitkeep`
- `docs/rfc/RFC-2026-000-adopt-devrailsv2.md`
- `docs/rfc/RFC-2026-001-weekly-budget-limit-for-the-meal-plan.md`
- `docs/rfc/RFC-2026-002-bump-next-to-16-4-2-for-security-advisories.md`
- `docs/specs/.gitkeep`

**Source**
- `src/app/fonts/Satoshi-LICENSE.txt`
- `src/app/fonts/Satoshi-Variable.woff2`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/components/PlanProvider.tsx`
- `src/components/SettingsView.tsx`
- `src/components/ShoppingView.tsx`
- `src/lib/budget.ts`
- `src/lib/dealStore.ts`
- `src/lib/planner.ts`
- `src/lib/prijsprofeet.ts`
- `src/lib/settings.ts`
- `src/lib/types.ts`

**Tests**
- `src/components/PlanProvider.test.tsx`
- `src/components/SettingsView.test.tsx`
- `src/components/ShoppingView.test.tsx`
- `src/lib/budget.test.ts`
- `src/lib/dealStore.test.ts`
- `src/lib/planner.test.ts`
- `src/lib/settings.test.ts`

### Acceptance-criteria coverage
| Criterion | Tests referencing it |
|---|---|
| RFC-2026-001:AC-1 — Given default settings, when the Settings page opens, then a "Weekly budget (€)" stepper with a typeable amount is shown and is empty, and `DEFAULT_PREFS.budget` is `null`. | `src/components/SettingsView.test.tsx`, `src/lib/planner.test.ts`, `src/lib/settings.test.ts` |
| RFC-2026-001:AC-2 — Given the budget field, when the user presses + or −, then the amount changes by €1 (+ from empty starts at €1, and − never goes below €1). When the user types a decimal such as "59.50" or "59,50", then the amount is €59.50. | `src/components/SettingsView.test.tsx`, `src/lib/budget.test.ts` |
| RFC-2026-001:AC-3 — Given the user enters 0, a negative number or non-numeric text, when the field loses focus, then "Enter an amount above €0" is shown, Save is blocked, and the saved budget is unchanged. Clearing the field (empty) is valid and removes the budget. | `src/components/SettingsView.test.tsx`, `src/lib/budget.test.ts` |
| RFC-2026-001:AC-4 — Given a budget is saved, when the page is reloaded, then the budget is still set. Given saved settings from before this change (no `budget`), when they load, then the budget is empty. | `src/components/SettingsView.test.tsx`, `src/lib/settings.test.ts` |
| RFC-2026-001:AC-5 — Given the budget is empty, when a plan is made (initial plan or Shuffle with any seed), then the planned week is identical to the week the current algorithm produces for the same deals, prefs and seed. | `src/lib/planner.test.ts` |
| RFC-2026-001:AC-6 — Given a budget of €60 and a deal set in which at least one valid week has a promotion total of at most €60 and no more regular-price lines than the no-budget week, when a plan is made (initial or Shuffle), then the planned week's promotion total is at most €60 and the plan is not flagged over budget. | `src/lib/planner.test.ts` |
| RFC-2026-001:AC-7 — Given a budget that no week the planner tries can meet, when a plan is made, then the planned week is the cheapest of the weeks tried (never more expensive than the no-budget week), and the plan is flagged over budget. | `src/lib/planner.test.ts` |
| RFC-2026-001:AC-8 — Given a saved week that is flagged over budget or was edited by hand, when the app reloads or the deals reload with the same budget, then the week is not replanned. When the budget changes or Shuffle is pressed, then planning runs again and the flag is recalculated. | `src/components/PlanProvider.test.tsx`, `src/lib/planner.test.ts` |
| RFC-2026-001:AC-9 — Given a saved budget and a current week that is over it, when the user saves a new budget, then the week is replanned right away under AC-6/AC-7. | `src/components/PlanProvider.test.tsx`, `src/lib/planner.test.ts` |
| RFC-2026-001:AC-10 — Given a budget is set and the compared total exceeds it, when the shopping page opens, then "Over budget by €X.XX" is shown on the same line as the "Offers on the list" total in the `--danger` colour. | `src/components/ShoppingView.test.tsx`, `src/lib/budget.test.ts` |
| RFC-2026-001:AC-11 — Given a budget is set and the compared total is at most the budget, when the shopping page opens, then "€Y.YY under budget" is shown on the same line as the total in the muted style. | `src/components/ShoppingView.test.tsx`, `src/lib/budget.test.ts` |
| RFC-2026-001:AC-12 — Given a budget is set, when the shopping page shows the comparison, then it is labelled "promotion items only", and lines marked "I already have it" and regular-price lines are left out of the compared total. | `src/components/ShoppingView.test.tsx` |
| RFC-2026-001:AC-13 — Given no budget is set, when the shopping page opens, then no budget text is shown. | `src/components/ShoppingView.test.tsx`, `src/lib/budget.test.ts` |
| RFC-2026-001:AC-14 — Given any budget, when a plan is made across seeds and 2/5/7 dinners, then sadza appears at least once and at most twice, and no pork or shellfish deal is used unless allowed in Settings. | `src/lib/planner.test.ts` |
| RFC-2026-001:AC-15 — Given any budget, when a plan is made, then the planned week has no more "At regular price" lines than the week planned without a budget for the same deals, prefs and seed. | `src/lib/planner.test.ts` |

### Test run
✅ passed — `npm test` on 2026-10-23

```text
> mealplan@0.1.0 test
> vitest run


 RUN  v5.0.4 C:/Users/FortuneTiriboyi/source/repos/mealplan


 Test Files  7 passed (7)
      Tests  144 passed (144)
   Start at  13:24:19
   Duration  68.60s (environment 74%, import 22%, tests 3%, transform 1%)
```
<!-- devrailsv2:generated:end -->
