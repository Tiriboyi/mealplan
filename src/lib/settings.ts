import { DEFAULT_RETAILERS, RETAILERS, type PromoStatus } from "./retailers";
import { DEFAULT_PREFS, type Prefs } from "./types";

export type Settings = {
  /** The visitor's own PrijsProfeet key. Kept in this browser only. */
  apiKey: string;
  retailers: string[];
  status: PromoStatus;
  prefs: Prefs;
};

export const DEFAULT_SETTINGS: Settings = {
  apiKey: "",
  retailers: DEFAULT_RETAILERS,
  status: "active",
  prefs: DEFAULT_PREFS,
};

const KEY = "mealplan.settings";

export function loadSettings(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<Settings>;
    const retailers = (saved.retailers ?? DEFAULT_RETAILERS).filter((r) => r in RETAILERS);
    const budget = saved.prefs?.budget;
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      retailers: retailers.length ? retailers : DEFAULT_RETAILERS,
      prefs: {
        ...DEFAULT_PREFS,
        ...saved.prefs,
        budget: typeof budget === "number" && Number.isFinite(budget) && budget > 0 ? budget : null,
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Private browsing: the settings simply last for this visit.
  }
}
