// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { budgetStatus } from "@/lib/budget";
import { buildIndex, realize, suggest, totals } from "@/lib/planner";
import { RETAILERS } from "@/lib/retailers";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { DEFAULT_PREFS, type Deal } from "@/lib/types";
import PlanProvider from "./PlanProvider";
import ShoppingView from "./ShoppingView";

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
const week = suggest(index, DEFAULT_PREFS);
const promo = realize(week, index, DEFAULT_PREFS).promo;
const pay = totals(promo).pay;
/** The first line on the page: shops are listed in RETAILERS order. */
const firstLine = Object.keys(RETAILERS).flatMap((r) => promo.filter((l) => l.deal.retailer === r))[0];

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

/** Exact text, non-breaking spaces and all: money() formats "€ 4,50". */
const exactly = (text: string) => (_: string, el: Element | null) => el?.textContent === text;

/** A saved week planned under `budget`, so it is shown as it is. */
async function open(budget: number | null) {
  localStorage.setItem("mealplan.settings", JSON.stringify({ ...DEFAULT_SETTINGS, prefs: { ...DEFAULT_PREFS, budget } }));
  localStorage.setItem(
    "mealplan.plan",
    JSON.stringify({ recipeIds: week, skipped: [], ticked: [], budget, overBudget: budget !== null && pay > budget }),
  );
  render(
    <PlanProvider>
      <ShoppingView />
    </PlanProvider>,
  );
  const total = await screen.findByText("Offers on the list");
  return { user: userEvent.setup(), totalRow: total.parentElement! };
}

describe("budget on the shopping page", () => {
  // RFC-2026-001:AC-10
  test("over budget says by how much, in the warning colour, next to the total", async () => {
    const { totalRow } = await open(1);
    const note = screen.getByText(exactly(budgetStatus(pay, 1)!.text));
    expect(note.textContent).toMatch(/^Over budget by /);
    expect(note.classList.contains("budget-over")).toBe(true);
    expect(totalRow.contains(note)).toBe(true);
  });

  // RFC-2026-001:AC-11
  test("within budget says what is left, muted, next to the total", async () => {
    const { totalRow } = await open(1000);
    const note = screen.getByText(exactly(budgetStatus(pay, 1000)!.text));
    expect(note.textContent).toMatch(/ under budget$/);
    expect(note.classList.contains("budget-under")).toBe(true);
    expect(totalRow.contains(note)).toBe(true);
  });

  // RFC-2026-001:AC-12
  test("compares promotion items only, without what I already have", async () => {
    const { user } = await open(1000);
    expect(screen.getByText(/promotion items only/)).toBeTruthy();

    await user.click(screen.getAllByRole("button", { name: "I already have it" })[0]);
    const left = totals(promo.filter((l) => l !== firstLine)).pay;
    expect(screen.getByText(exactly(budgetStatus(left, 1000)!.text))).toBeTruthy();
  });

  // RFC-2026-001:AC-13
  test("no budget, no budget text", async () => {
    await open(null);
    expect(screen.queryByText(/under budget|Over budget|promotion items only/)).toBeNull();
  });
});
