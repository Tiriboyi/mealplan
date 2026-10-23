// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { alternatives, buildIndex, planWeek, suggest, weekCost } from "@/lib/planner";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { DEFAULT_PREFS, type Deal } from "@/lib/types";
import PlanProvider, { usePlan } from "./PlanProvider";

function deal(name: string, category: string, over: Partial<Deal> = {}): Deal {
  return {
    id: name,
    name,
    retailer: "jumbo",
    category,
    price: 2,
    originalPrice: 3,
    multiBuyQty: null,
    multiBuyPrice: null,
    quantity: "400 g",
    unit: null,
    unitPrice: null,
    promoLabel: null,
    validFrom: null,
    validUntil: null,
    url: null,
    ...over,
  };
}

const deals = [
  deal("PLUS Boerentrots Kippenbout 2st", "vlees", { price: 3.99, originalPrice: 4.99, quantity: "800 g", retailer: "plus" }),
  deal("AH Kabeljauwfilet", "vis", { price: 5, originalPrice: 7, quantity: "ca. 300 g", retailer: "albert_heijn" }),
  deal("Plus Boerenkool fijngesneden", "groente-fruit", { price: 1, originalPrice: 2.49, quantity: "500 g" }),
  deal("Heinz Tomaten gepeld", "soepen-conserven-sauzen", { price: 1, originalPrice: 1.39 }),
];

const index = buildIndex(deals, DEFAULT_PREFS);
const greedy = suggest(index, DEFAULT_PREFS);
/** A week the planner would not pick itself: the first dinner swapped by hand. */
const handEdited = greedy.map((id, i) => (i === 0 ? alternatives(greedy, 0, index, DEFAULT_PREFS)[0] : id));
const withBudget = (budget: number | null) => ({ ...DEFAULT_PREFS, budget });

function Probe() {
  const { plan, recipeIds, overBudget, settings, shuffle, applySettings } = usePlan();
  const setBudget = (budget: number) => applySettings({ ...settings!, prefs: { ...settings!.prefs, budget } });
  return (
    <>
      {plan && <p>ready</p>}
      <output aria-label="week">{recipeIds.join(",")}</output>
      <output aria-label="over budget">{String(overBudget)}</output>
      <button onClick={shuffle}>Shuffle</button>
      <button onClick={() => setBudget(2)}>Budget 2</button>
      <button onClick={() => setBudget(1000)}>Budget 1000</button>
    </>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ deals, usingKey: false }))),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function save(budget: number | null, saved: { recipeIds: string[]; budget: number | null; overBudget: boolean }) {
  localStorage.setItem("mealplan.settings", JSON.stringify({ ...DEFAULT_SETTINGS, prefs: withBudget(budget) }));
  localStorage.setItem("mealplan.plan", JSON.stringify({ skipped: [], ticked: [], ...saved }));
}

async function open() {
  render(
    <PlanProvider>
      <Probe />
    </PlanProvider>,
  );
  await screen.findByText("ready");
  return userEvent.setup();
}

const shownWeek = () => screen.getByRole("status", { name: "week" }).textContent!.split(",");
const shownFlag = () => screen.getByRole("status", { name: "over budget" }).textContent;
const savedPlan = () => JSON.parse(localStorage.getItem("mealplan.plan")!);

describe("replanning with a budget", () => {
  // RFC-2026-001:AC-8
  test("a week flagged over budget is not replanned on reload", async () => {
    save(1, { recipeIds: handEdited, budget: 1, overBudget: true });
    await open();
    expect(shownWeek()).toEqual(handEdited);
    expect(shownFlag()).toBe("true");

    cleanup();
    await open();
    expect(shownWeek()).toEqual(handEdited);
    expect(savedPlan()).toMatchObject({ recipeIds: handEdited, budget: 1, overBudget: true });
  });

  // RFC-2026-001:AC-8
  test("a hand-edited week over budget is not replanned on reload", async () => {
    const budget = weekCost(handEdited, index, DEFAULT_PREFS) - 1;
    save(budget, { recipeIds: handEdited, budget, overBudget: false });
    await open();
    expect(shownWeek()).toEqual(handEdited);
  });

  // RFC-2026-001:AC-8
  test("Shuffle plans again within the budget and recalculates the flag", async () => {
    save(1, { recipeIds: handEdited, budget: 1, overBudget: true });
    const user = await open();
    await user.click(screen.getByRole("button", { name: "Shuffle" }));
    const expected = planWeek(index, withBudget(1), 1);
    expect(shownWeek()).toEqual(expected.recipeIds);
    expect(shownFlag()).toBe(String(expected.overBudget));
  });

  // RFC-2026-001:AC-9
  test("saving a budget the week is over replans it right away", async () => {
    save(null, { recipeIds: handEdited, budget: null, overBudget: false });
    const user = await open();
    await user.click(screen.getByRole("button", { name: "Budget 2" }));
    const expected = planWeek(index, withBudget(2));
    expect(shownWeek()).toEqual(expected.recipeIds);
    expect(shownFlag()).toBe("true");
    expect(savedPlan()).toMatchObject({ recipeIds: expected.recipeIds, budget: 2, overBudget: true });
  });

  // RFC-2026-001:AC-9
  test("saving a budget the week already meets keeps it", async () => {
    save(null, { recipeIds: handEdited, budget: null, overBudget: false });
    const user = await open();
    await user.click(screen.getByRole("button", { name: "Budget 1000" }));
    expect(shownWeek()).toEqual(handEdited);
    expect(shownFlag()).toBe("false");
  });
});
