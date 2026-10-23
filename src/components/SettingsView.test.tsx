// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { BUDGET_ERROR } from "@/lib/budget";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import PlanProvider from "./PlanProvider";
import SettingsView from "./SettingsView";

const LABEL = "Weekly budget (€)";

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ deals: [], usingKey: false }))),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function saveBudget(budget: number | null) {
  localStorage.setItem("mealplan.settings", JSON.stringify({ ...DEFAULT_SETTINGS, prefs: { ...DEFAULT_SETTINGS.prefs, budget } }));
}

const savedBudget = () => JSON.parse(localStorage.getItem("mealplan.settings") ?? "{}").prefs?.budget;

async function open() {
  const user = userEvent.setup();
  render(
    <PlanProvider>
      <SettingsView />
    </PlanProvider>,
  );
  const field = (await screen.findByRole("textbox", { name: LABEL })) as HTMLInputElement;
  const group = within(screen.getByRole("group", { name: LABEL }));
  return {
    user,
    field,
    more: group.getByRole("button", { name: "One more" }) as HTMLButtonElement,
    fewer: group.getByRole("button", { name: "One fewer" }) as HTMLButtonElement,
    save: () => screen.queryByRole("button", { name: "Save changes" }) as HTMLButtonElement | null,
  };
}

describe("weekly budget in Settings", () => {
  // RFC-2026-001:AC-1
  test("is shown and empty by default", async () => {
    const { field } = await open();
    expect(field.value).toBe("");
    expect(field.inputMode).toBe("decimal");
  });

  // RFC-2026-001:AC-2
  test("steps by one euro, starting at €1 and never below it", async () => {
    const { user, field, more, fewer } = await open();
    expect(fewer.disabled).toBe(true);
    await user.click(more);
    expect(field.value).toBe("1.00");
    expect(fewer.disabled).toBe(true);
    await user.click(more);
    expect(field.value).toBe("2.00");
    await user.click(fewer);
    expect(field.value).toBe("1.00");
  });

  // RFC-2026-001:AC-2
  test("takes a typed amount with a point or a comma", async () => {
    const { user, field, more } = await open();
    await user.type(field, "59,50");
    await user.tab();
    expect(field.value).toBe("59.50");
    await user.click(more);
    expect(field.value).toBe("60.50");
  });

  // RFC-2026-001:AC-3
  test.each(["0", "-5", "abc"])("%s shows an error, blocks Save and keeps the saved budget", async (text) => {
    saveBudget(40);
    const { user, field, save } = await open();
    expect(field.value).toBe("40.00");
    await user.clear(field);
    await user.type(field, text);
    await user.tab();
    expect(screen.getByRole("alert").textContent).toBe(BUDGET_ERROR);
    expect(field.getAttribute("aria-invalid")).toBe("true");
    expect(save()?.disabled).toBe(true);
    expect(savedBudget()).toBe(40);
  });

  // RFC-2026-001:AC-3
  test("fixing the amount clears the error", async () => {
    const { user, field } = await open();
    await user.type(field, "abc");
    await user.tab();
    expect(screen.getByRole("alert").textContent).toBe(BUDGET_ERROR);
    await user.clear(field);
    await user.type(field, "25");
    await user.tab();
    expect(screen.queryByText(BUDGET_ERROR)).toBeNull();
  });

  // RFC-2026-001:AC-3
  test("clearing the field removes the budget", async () => {
    saveBudget(40);
    const { user, field, save } = await open();
    await user.clear(field);
    await user.tab();
    await user.click(save()!);
    expect(savedBudget()).toBeNull();
  });

  // RFC-2026-001:AC-4
  test("a saved budget is still set after a reload", async () => {
    const first = await open();
    await first.user.type(first.field, "60");
    await first.user.tab();
    await first.user.click(first.save()!);
    expect(savedBudget()).toBe(60);

    cleanup();
    const { field } = await open();
    expect(field.value).toBe("60.00");
  });
});
