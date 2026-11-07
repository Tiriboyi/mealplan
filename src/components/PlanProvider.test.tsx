// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { LUNCH } from "@/lib/lunches";
import { alternatives, buildIndex, planLunches, planWeek, suggest, weekCost, type Lunches } from "@/lib/planner";
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

describe("replanning lunches", () => {
  const MONDAY = "2026-11-09";
  const family = { ...DEFAULT_PREFS, adults: 2, kids: 2, days: 7 };
  const lunchDeals = [
    ...deals,
    deal("AH Tijger volkoren heel", "brood-bakkerij", { price: 2.29, originalPrice: 2.89, quantity: "800 g", retailer: "albert_heijn" }),
    deal("MILBONA Plakken Goudse jong belegen kaas", "kaas", { price: 2.49, originalPrice: 3.29, quantity: "190 g", retailer: "lidl" }),
    deal("Elstar appels", "groente-fruit", { price: 1.99, originalPrice: 2.79, quantity: "1 kg" }),
    deal("Conference peren", "groente-fruit", { price: 1.79, originalPrice: 2.49, quantity: "1 kg" }),
    deal("Biologische komkommer", "groente-fruit", { price: 0.99, originalPrice: 1.29, quantity: "1 stuk" }),
  ];
  const idx = buildIndex(lunchDeals, family);
  const lunches = planLunches(MONDAY, idx, family);

  function LunchProbe() {
    const { plan, lunches, settings, applySettings } = usePlan();
    const set = (prefs: Partial<typeof family>, retailers?: string[]) =>
      applySettings({ ...settings!, retailers: retailers ?? settings!.retailers, prefs: { ...settings!.prefs, ...prefs } });
    return (
      <>
        {plan && <p>ready</p>}
        <output aria-label="lunches">{JSON.stringify(lunches)}</output>
        <button onClick={() => set({ kids: 0 })}>No kids</button>
        <button onClick={() => set({}, ["jumbo"])}>Only Jumbo</button>
      </>
    );
  }

  const shownLunches = () => JSON.parse(screen.getByRole("status", { name: "lunches" }).textContent!) as Lunches;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 9, 10, 0));
    // Only the AH bread is lost when the shopper drops Albert Heijn.
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const only = new URL(url, "http://localhost").searchParams.get("retailers")!.split(",");
        return new Response(JSON.stringify({ deals: lunchDeals.filter((d) => only.includes(d.retailer) || d.retailer === "lidl"), usingKey: false }));
      }),
    );
    localStorage.setItem("mealplan.settings", JSON.stringify({ ...DEFAULT_SETTINGS, retailers: ["albert_heijn", "jumbo", "plus"], prefs: family }));
    localStorage.setItem(
      "mealplan.plan",
      JSON.stringify({ recipeIds: suggest(idx, family), start: MONDAY, lunches, skipped: [], ticked: [], budget: null, overBudget: false }),
    );
  });

  afterEach(() => vi.useRealTimers());

  async function openProbe() {
    render(
      <PlanProvider>
        <LunchProbe />
      </PlanProvider>,
    );
    await screen.findByText("ready");
    return userEvent.setup();
  }

  // RFC-2026-006:AC-33
  test("changing the number of kids replans the lunch slots", async () => {
    const user = await openProbe();
    expect(shownLunches()).toEqual(lunches);
    await user.click(screen.getByRole("button", { name: "No kids" }));
    await vi.waitFor(() => expect(Object.keys(shownLunches()).some((k) => /lunchbox|snack/.test(k))).toBe(false));
    expect(shownLunches()["0-adult"]).toBeDefined();
  });

  // RFC-2026-006:AC-12
  test("dropping a supermarket replaces lunches whose promotion was there", async () => {
    const user = await openProbe();
    expect(lunches["0-lunchbox"]).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Only Jumbo" }));
    // Without Albert Heijn there is no bread on promotion, so no sandwich can stay.
    await vi.waitFor(() => expect(shownLunches()["0-lunchbox"]).toBeNull());
    for (const id of Object.values(shownLunches())) if (id) expect(LUNCH[id].amounts).not.toHaveProperty("wholegrain_bread");
  });
});
