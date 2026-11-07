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
  const { budget: _, adults: __, kids: ___, ...legacyPrefs } = DEFAULT_SETTINGS.prefs;
  store.set("mealplan.settings", JSON.stringify({ ...DEFAULT_SETTINGS, prefs: { ...legacyPrefs, people: 4 } }));
  const prefs = loadSettings().prefs;
  expect(prefs.budget).toBeNull();
  expect(prefs.adults).toBe(4);
});

// RFC-2026-006:AC-1
test("a fresh browser plans for 2 adults and no kids", () => {
  expect(loadSettings().prefs).toMatchObject({ adults: 2, kids: 0 });
  expect(DEFAULT_SETTINGS.prefs).not.toHaveProperty("people");
});

// RFC-2026-006:AC-2
test("settings saved with a number of people load as that many adults and no kids", () => {
  const { adults: _, kids: __, ...legacyPrefs } = DEFAULT_SETTINGS.prefs;
  const legacy = { ...DEFAULT_SETTINGS, prefs: { ...legacyPrefs, people: 3, days: 5, noPork: false, budget: 40 } };
  store.set("mealplan.settings", JSON.stringify(legacy));
  const loaded = loadSettings();
  expect(loaded.prefs).toEqual({ ...legacyPrefs, days: 5, noPork: false, budget: 40, adults: 3, kids: 0 });
  expect(loaded.retailers).toEqual(DEFAULT_SETTINGS.retailers);
});

// RFC-2026-006:AC-1
test("adults and kids are kept after a reload", () => {
  saveSettings({ ...DEFAULT_SETTINGS, prefs: { ...DEFAULT_SETTINGS.prefs, adults: 2, kids: 2 } });
  expect(loadSettings().prefs).toMatchObject({ adults: 2, kids: 2 });
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
