// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { INGREDIENT } from "@/lib/ingredients";
import { RECIPE } from "@/lib/recipes";
import { RETAILERS } from "@/lib/retailers";
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
const option = RECIPE["sadza-chicken-stew"];

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

/** Opens the first day's "Or make:" option and returns its sheet. */
async function openOption() {
  const prefs = { ...DEFAULT_PREFS, days: week.length };
  localStorage.setItem("mealplan.settings", JSON.stringify({ ...DEFAULT_SETTINGS, prefs }));
  localStorage.setItem("mealplan.plan", JSON.stringify({ recipeIds: week, skipped: [], ticked: [], budget: null, overBudget: false }));
  render(
    <PlanProvider>
      <WeekView />
    </PlanProvider>,
  );
  await screen.findByRole("button", { name: RECIPE[week[0]].name });
  const user = userEvent.setup();
  const firstDay = document.querySelector<HTMLElement>("ol.meals > li")!;
  await user.click(within(firstDay).getByRole("button", { name: option.name }));
  return { user, sheet: await screen.findByRole("dialog", { name: option.name, hidden: true }) };
}

const row = (sheet: HTMLElement, ingredientId: string) =>
  within(sheet)
    .getAllByRole("listitem", { hidden: true })
    .find((li) => li.textContent?.startsWith(INGREDIENT[ingredientId].name))!;

describe("recipe sheet for a dinner option", () => {
  // RFC-2026-005:AC-11
  test("shows the recipe, with each ingredient tagged by what the shopping list does with it", async () => {
    const { sheet } = await openOption();
    expect(within(sheet).getByRole("heading", { name: "Method", hidden: true })).toBeTruthy();
    for (const step of option.steps) expect(within(sheet).getByText(step)).toBeTruthy();

    expect(row(sheet, "chicken_pieces").textContent).toContain(RETAILERS.plus);
    expect(row(sheet, "maize_meal").textContent).toContain("Cupboard");
    expect(row(sheet, "onions").textContent).toContain("Regular price");
  });

  // RFC-2026-005:AC-12
  test("picking it swaps it in for that day and warns the list will change", async () => {
    const { user, sheet } = await openOption();
    expect(within(sheet).getByText(/Updates your shopping list/)).toBeTruthy();
    expect(within(sheet).queryByText("Cook it instead on")).toBeNull();

    await user.click(within(sheet).getByRole("button", { name: "Cook it instead", hidden: true }));

    const saved = JSON.parse(localStorage.getItem("mealplan.plan")!);
    expect(saved.recipeIds).toEqual(["sadza-chicken-stew", "rice-chicken-stew", "macaroni-mince"]);
  });
});
