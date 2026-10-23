import { money } from "./text";

export const BUDGET_ERROR = "Enter an amount above €0";

export type BudgetInput = { ok: true; value: number | null } | { ok: false; error: string };

const cents = (n: number) => Math.round(n * 100) / 100;

/** "59,50", "59.50" or "€ 59.50" -> 59.5. Empty means no budget. */
export function parseBudget(text: string): BudgetInput {
  if (text.trim() === "") return { ok: true, value: null };
  const plain = text.trim().replace(/^€\s*/, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(plain)) return { ok: false, error: BUDGET_ERROR };
  const value = cents(Number(plain));
  return value > 0 ? { ok: true, value } : { ok: false, error: BUDGET_ERROR };
}

export type BudgetStatus = { over: boolean; amount: number; text: string } | null;

/** How the list total compares with the budget, worded for the shopping page. */
export function budgetStatus(total: number, budget: number | null): BudgetStatus {
  if (budget === null) return null;
  const over = cents(total) > budget;
  const amount = cents(Math.abs(total - budget));
  return { over, amount, text: over ? `Over budget by ${money(amount)}` : `${money(amount)} under budget` };
}
