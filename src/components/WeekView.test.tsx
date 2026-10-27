// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
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
