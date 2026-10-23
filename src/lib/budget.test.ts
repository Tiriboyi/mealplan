import { describe, expect, test } from "vitest";
import { BUDGET_ERROR, budgetStatus, parseBudget } from "./budget";
import { money } from "./text";

describe("reading a typed budget", () => {
  // RFC-2026-001:AC-3
  test.each(["0", "0.00", "-5", "-0,01", "abc", "12abc", "€", "1.2.3"])("%s is not a budget", (text) => {
    expect(parseBudget(text)).toEqual({ ok: false, error: BUDGET_ERROR });
  });

  test("the error asks for an amount above zero", () => {
    expect(BUDGET_ERROR).toBe("Enter an amount above €0");
  });

  // RFC-2026-001:AC-3 — clearing the field removes the budget.
  test.each(["", "   "])("%j means no budget", (text) => {
    expect(parseBudget(text)).toEqual({ ok: true, value: null });
  });

  // RFC-2026-001:AC-2
  test.each([
    ["60", 60],
    ["59.50", 59.5],
    ["59,50", 59.5],
    [" 45 ", 45],
    ["€ 30", 30],
    ["0.01", 0.01],
    ["12.345", 12.35],
  ])("%s is %d euro", (text, value) => {
    expect(parseBudget(text)).toEqual({ ok: true, value });
  });
});

describe("comparing the list with the budget", () => {
  // RFC-2026-001:AC-13
  test("no budget, nothing to say", () => {
    expect(budgetStatus(42.5, null)).toBeNull();
  });

  // RFC-2026-001:AC-10
  test("over budget says by how much", () => {
    expect(budgetStatus(64.37, 60)).toEqual({ over: true, amount: 4.37, text: `Over budget by ${money(4.37)}` });
  });

  // RFC-2026-001:AC-11
  test("within budget says what is left", () => {
    expect(budgetStatus(52.1, 60)).toEqual({ over: false, amount: 7.9, text: `${money(7.9)} under budget` });
  });

  // RFC-2026-001:AC-11
  test("exactly on budget is within it", () => {
    expect(budgetStatus(60, 60)).toEqual({ over: false, amount: 0, text: `${money(0)} under budget` });
  });

  test("amounts are rounded to cents", () => {
    expect(budgetStatus(0.1 + 0.2, 0.2)?.amount).toBe(0.1);
  });
});
