import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from "./settings";

let store: Map<string, string>;

beforeEach(() => {
  store = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  });
});

afterEach(() => vi.unstubAllGlobals());

// RFC-2026-001:AC-4
test("a saved budget is there after a reload", () => {
  saveSettings({ ...DEFAULT_SETTINGS, prefs: { ...DEFAULT_SETTINGS.prefs, budget: 59.5 } });
  expect(loadSettings().prefs.budget).toBe(59.5);
});

// RFC-2026-001:AC-4
test("settings saved before budgets existed load with no budget", () => {
  const { budget: _, ...legacyPrefs } = DEFAULT_SETTINGS.prefs;
  store.set("mealplan.settings", JSON.stringify({ ...DEFAULT_SETTINGS, prefs: { ...legacyPrefs, people: 4 } }));
  const prefs = loadSettings().prefs;
  expect(prefs.budget).toBeNull();
  expect(prefs.people).toBe(4);
});

// RFC-2026-001:AC-4
test.each([["60"], [-5], [0], [null], [{}]])("a stored budget of %j is not a budget", (budget) => {
  store.set("mealplan.settings", JSON.stringify({ ...DEFAULT_SETTINGS, prefs: { ...DEFAULT_SETTINGS.prefs, budget } }));
  expect(loadSettings().prefs.budget).toBeNull();
});

// RFC-2026-001:AC-1
test("a fresh browser has no budget", () => {
  expect(loadSettings().prefs.budget).toBeNull();
});
