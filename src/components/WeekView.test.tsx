// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { LUNCH } from "@/lib/lunches";
import { buildIndex, lunchOptions, planLunches, suggest, type Lunches } from "@/lib/planner";
import { RECIPE } from "@/lib/recipes";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { DEFAULT_PREFS, type Deal } from "@/lib/types";
import PlanProvider from "./PlanProvider";
import WeekView from "./WeekView";

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
  deal("Heinz Tomaten gepeld", "soepen-conserven-sauzen", { price: 1, originalPrice: 1.39 }),
];

/** Its list also makes sadza-chicken-stew, beef-cabbage and mince-greens. */
const week = ["sadza-beef-stew", "rice-chicken-stew", "macaroni-mince"];
/** Its list makes nothing else. */
const narrow = ["oxtail", "macaroni-mince"];

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ deals, usingKey: false }))),
  );
  // jsdom has no modal dialogs.
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** A saved week that fits the settings, so it is shown as it is. */
async function open(recipeIds: string[]) {
  const prefs = { ...DEFAULT_PREFS, days: recipeIds.length };
  localStorage.setItem("mealplan.settings", JSON.stringify({ ...DEFAULT_SETTINGS, prefs }));
  localStorage.setItem("mealplan.plan", JSON.stringify({ recipeIds, skipped: [], ticked: [], budget: null, overBudget: false }));
  render(
    <PlanProvider>
      <WeekView />
    </PlanProvider>,
  );
  await screen.findByRole("button", { name: RECIPE[recipeIds[0]].name });
}

/** The day cards, in order. */
const cards = () => [...document.querySelectorAll<HTMLElement>("ol.meals > li")];
const offered = (card: HTMLElement) =>
  within(card.querySelector<HTMLElement>(".meal-options")!)
    .queryAllByRole("button")
    .map((b) => b.textContent);

describe("dinner options on the week view", () => {
  // RFC-2026-005:AC-1
  test("every day shows its dinner and what else the shopping makes", async () => {
    await open(week);
    expect(cards()).toHaveLength(3);
    cards().forEach((card, i) => {
      expect(within(card).getByRole("button", { name: RECIPE[week[i]].name })).toBeTruthy();
      expect(card.querySelector(".meal-options")?.textContent).toMatch(/^Or make:/);
      expect(offered(card).length).toBeGreaterThanOrEqual(1);
    });
    expect(offered(cards()[2])).toEqual([RECIPE["mince-greens"].name, RECIPE["sadza-chicken-stew"].name]);
  });

  // RFC-2026-005:AC-10
  test("a day with nothing else to make says so", async () => {
    await open(narrow);
    for (const card of cards()) {
      expect(card.querySelector(".meal-options")?.textContent).toBe("No alternative dinner possible with this week's shopping");
      expect(offered(card)).toEqual([]);
    }
  });

  // RFC-2026-005:AC-13
  test("picking an option recalculates every day's options from the new list", async () => {
    const user = userEvent.setup();
    await open(week);
    await user.click(within(cards()[0]).getByRole("button", { name: RECIPE["sadza-chicken-stew"].name }));
    await user.click(await screen.findByRole("button", { name: "Cook it instead" }));

    expect(within(cards()[0]).getByRole("button", { name: RECIPE["sadza-chicken-stew"].name })).toBeTruthy();
    // Beef stew is no longer bought, so beef-cabbage and the old dinner drop out.
    expect(offered(cards()[0])).toEqual([RECIPE["mince-greens"].name]);
  });
});

describe("lunches on the week view", () => {
  // Monday 9 November 2026: school Mon, Tue, Thu, Fri; school Wednesday; weekend.
  const MONDAY = "2026-11-09";
  const family = { ...DEFAULT_PREFS, adults: 2, kids: 2, days: 7 };
  const lunchDeals = [
    ...deals,
    deal("AH Tijger volkoren heel", "brood-bakkerij", { price: 2.29, originalPrice: 2.89, quantity: "800 g", retailer: "albert_heijn" }),
    deal("MILBONA Plakken Goudse jong belegen kaas", "kaas", { price: 2.49, originalPrice: 3.29, quantity: "190 g", retailer: "lidl" }),
    deal("Elstar appels", "groente-fruit", { price: 1.99, originalPrice: 2.79, quantity: "1 kg" }),
    deal("Conference peren", "groente-fruit", { price: 1.79, originalPrice: 2.49, quantity: "1 kg" }),
    deal("Plus Mandarijnen", "groente-fruit", { price: 2.49, originalPrice: 3.49, quantity: "1 kg", retailer: "plus" }),
    deal("Biologische komkommer", "groente-fruit", { price: 0.99, originalPrice: 1.29, quantity: "1 stuk" }),
    deal("Plus Hummus naturel", "kaas", { price: 1.5, originalPrice: 2.19, quantity: "200 g", retailer: "plus" }),
    deal("The Flower Farm Pindakaas zonder palmolie", "ontbijt", { price: 3.49, originalPrice: 4.49, quantity: "350 g", retailer: "plus" }),
  ];
  const index = buildIndex(lunchDeals, family);
  const dinners = suggest(index, family);
  const lunches = planLunches(MONDAY, index, family);

  const kinds = (card: HTMLElement) => [...card.querySelectorAll(".slot-kind")].map((e) => e.textContent);
  const slot = (card: HTMLElement, label: string) =>
    [...card.querySelectorAll<HTMLElement>(".slot")].find((s) => s.querySelector(".slot-kind")?.textContent === label)!;
  const savedPlan = () => JSON.parse(localStorage.getItem("mealplan.plan")!);

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 9, 10, 0));
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ deals: lunchDeals, usingKey: false }))));
  });

  afterEach(() => vi.useRealTimers());

  async function openFamily(saved: { start?: string; lunches?: Lunches } = { start: MONDAY, lunches }) {
    localStorage.setItem("mealplan.settings", JSON.stringify({ ...DEFAULT_SETTINGS, prefs: family }));
    localStorage.setItem(
      "mealplan.plan",
      JSON.stringify({ recipeIds: dinners, skipped: [], ticked: [], budget: null, overBudget: false, ...saved }),
    );
    render(
      <PlanProvider>
        <WeekView />
      </PlanProvider>,
    );
    await screen.findByRole("button", { name: RECIPE[dinners[0]].name });
    return userEvent.setup();
  }

  // RFC-2026-006:AC-1
  test("the summary shows adults and kids", async () => {
    await openFamily();
    expect(screen.getByText(/2 adults, 2 kids/)).toBeTruthy();
  });

  // RFC-2026-006:AC-8 RFC-2026-006:AC-9 RFC-2026-006:AC-10 RFC-2026-006:AC-29
  test("each day shows its meals in time order, by weekday", async () => {
    await openFamily();
    expect(cards()).toHaveLength(7);
    const school = ["School snack", "Lunchbox (12:30)", "Lunch", "Dinner"];
    expect(kinds(cards()[0])).toEqual(school); // Monday
    expect(kinds(cards()[1])).toEqual(school); // Tuesday
    expect(kinds(cards()[2])).toEqual(["School snack", "Family lunch", "Dinner"]); // Wednesday
    expect(kinds(cards()[3])).toEqual(school); // Thursday
    expect(kinds(cards()[5])).toEqual(["Family lunch", "Dinner"]); // Saturday
    expect(kinds(cards()[6])).toEqual(["Family lunch", "Dinner"]); // Sunday
    expect(within(slot(cards()[0], "Lunchbox (12:30)")).getByRole("button", { name: LUNCH[lunches["0-lunchbox"]!].name })).toBeTruthy();
  });

  // RFC-2026-006:AC-4
  test("a saved week keeps its dates: Today and Tomorrow move, past days are marked", async () => {
    vi.setSystemTime(new Date(2026, 10, 11, 10, 0)); // Wednesday
    await openFamily();
    const day = (i: number) => cards()[i].querySelector(".meal-day")!.textContent;
    expect(day(0)).toMatch(/Mon 9$/);
    expect(day(0)).not.toMatch(/Today/);
    expect(cards()[0].classList.contains("past")).toBe(true);
    expect(cards()[1].classList.contains("past")).toBe(true);
    expect(day(2)).toBe("Today Wed 11");
    expect(day(3)).toBe("Tomorrow Thu 12");
    expect(cards()[2].classList.contains("past")).toBe(false);
    // Lunch types follow the date, not the position.
    expect(kinds(cards()[2])).toEqual(["School snack", "Family lunch", "Dinner"]);
  });

  // RFC-2026-006:AC-5
  test("a plan saved before dates existed starts today and keeps its dinners", async () => {
    await openFamily({});
    await vi.waitFor(() => expect(savedPlan().start).toBe(MONDAY));
    expect(savedPlan().recipeIds).toEqual(dinners);
    expect(cards()[0].querySelector(".meal-day")!.textContent).toBe("Today Mon 9");
  });

  // RFC-2026-006:AC-34
  test("a plan saved before lunches existed gets lunches and keeps its dinners", async () => {
    await openFamily({ start: MONDAY });
    await vi.waitFor(() => expect(savedPlan().lunches).toEqual(lunches));
    expect(savedPlan().recipeIds).toEqual(dinners);
  });

  // RFC-2026-006:AC-34
  test("saved lunches are shown as they were saved after a reload", async () => {
    const handPicked = { ...lunches, "0-snack": "snack-pear", "1-snack": "snack-mandarin" };
    await openFamily({ start: MONDAY, lunches: handPicked });
    expect(within(slot(cards()[0], "School snack")).getByRole("button", { name: LUNCH["snack-pear"].name })).toBeTruthy();
    expect(within(slot(cards()[1], "School snack")).getByRole("button", { name: LUNCH["snack-mandarin"].name })).toBeTruthy();
    expect(savedPlan().lunches).toEqual(handPicked);
  });

  // RFC-2026-006:AC-14
  test("a slot with nothing on promotion says so", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ deals, usingKey: false }))));
    await openFamily({ start: MONDAY });
    expect(slot(cards()[0], "Lunchbox (12:30)").textContent).toContain("No lunch idea on promotion at your supermarkets this week");
    expect(slot(cards()[5], "Family lunch").textContent).toContain("No lunch idea on promotion at your supermarkets this week");
  });

  // RFC-2026-006:AC-30
  test("tapping a lunch opens its contents, steps and where each item is on offer", async () => {
    const user = await openFamily();
    const box = LUNCH[lunches["0-lunchbox"]!];
    await user.click(within(slot(cards()[0], "Lunchbox (12:30)")).getByRole("button", { name: box.name }));
    const sheet = within(await screen.findByRole("dialog", { name: box.name }));
    expect(sheet.getByRole("heading", { name: box.name })).toBeTruthy();
    expect(sheet.getByText("Wholegrain bread").closest("li")!.textContent).toContain("Albert Heijn");
    expect(sheet.getByText(/Drink: water/)).toBeTruthy();
    for (const step of box.steps) expect(sheet.getByText(step)).toBeTruthy();
  });

  // RFC-2026-006:AC-31 RFC-2026-006:AC-32
  test("swapping a lunchbox changes only that slot, and the swap is saved", async () => {
    const user = await openFamily();
    const options = lunchOptions(lunches, "0-lunchbox", index, family);
    expect(options.length).toBeGreaterThan(0);

    await user.click(within(slot(cards()[0], "Lunchbox (12:30)")).getByRole("button", { name: "Swap lunchbox (12:30)" }));
    const sheet = within(await screen.findByRole("dialog", { name: "Swap lunchbox (12:30)" }));
    expect(sheet.getAllByRole("button", { name: /./ }).map((b) => b.textContent).filter((t) => t && LUNCHES_BY_NAME.has(t))).toEqual(
      options.map((id) => LUNCH[id].name),
    );
    await user.click(sheet.getByRole("button", { name: LUNCH[options[0]].name }));

    expect(within(slot(cards()[0], "Lunchbox (12:30)")).getByRole("button", { name: LUNCH[options[0]].name })).toBeTruthy();
    await vi.waitFor(() => expect(savedPlan().lunches).toEqual({ ...lunches, "0-lunchbox": options[0] }));
    expect(savedPlan().recipeIds).toEqual(dinners);

    cleanup();
    await openFamily(savedPlan());
    expect(within(slot(cards()[0], "Lunchbox (12:30)")).getByRole("button", { name: LUNCH[options[0]].name })).toBeTruthy();
  });

  // RFC-2026-006:AC-33
  test("New week plans lunches again from today", async () => {
    vi.setSystemTime(new Date(2026, 10, 14, 10, 0)); // Saturday
    const user = await openFamily();
    await user.click(screen.getByRole("button", { name: "New week" }));
    await vi.waitFor(() => expect(savedPlan().start).toBe("2026-11-14"));
    expect(kinds(cards()[0])).toEqual(["Family lunch", "Dinner"]);
    expect(kinds(cards()[2])).toEqual(["School snack", "Lunchbox (12:30)", "Lunch", "Dinner"]); // Monday 16th
    expect(Object.keys(savedPlan().lunches)).toContain("2-lunchbox");
  });
});

const LUNCHES_BY_NAME = new Set(Object.values(LUNCH).map((l) => l.name));
