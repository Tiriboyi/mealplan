"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { buildIndex, fitsWeek, realize, suggest, totals, type DealIndex, type Plan, type PromoLine, type Totals } from "@/lib/planner";
import { loadSettings, saveSettings, type Settings } from "@/lib/settings";
import type { Deal } from "@/lib/types";
import RecipeSheet from "./RecipeSheet";
import SwapSheet from "./SwapSheet";

type Load =
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "ready"; deals: Deal[]; usingKey: boolean };

type SavedPlan = { recipeIds: string[]; skipped: string[]; ticked: string[] };

type Sheet = { kind: "recipe"; id: string } | { kind: "swap"; position: number } | null;

type PlanContext = {
  /** Null until the browser's saved settings have been read. */
  settings: Settings | null;
  load: Load;
  index: DealIndex | null;
  recipeIds: string[];
  plan: Plan | null;
  skipped: string[];
  ticked: string[];
  /** Promotion lines still on the list, and what they add up to. */
  buying: PromoLine[];
  sum: Totals;
  shuffle: () => void;
  replace: (position: number, recipeId: string) => void;
  toggleSkip: (id: string) => void;
  toggleTick: (id: string) => void;
  applySettings: (next: Settings) => void;
  retry: () => void;
  openRecipe: (id: string) => void;
  openSwap: (position: number) => void;
  closeSheet: () => void;
};

const PLAN_KEY = "mealplan.plan";

function loadPlan(): SavedPlan {
  try {
    const saved = JSON.parse(localStorage.getItem(PLAN_KEY) ?? "{}") as Partial<SavedPlan>;
    return { recipeIds: saved.recipeIds ?? [], skipped: saved.skipped ?? [], ticked: saved.ticked ?? [] };
  } catch {
    return { recipeIds: [], skipped: [], ticked: [] };
  }
}

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

const Context = createContext<PlanContext | null>(null);

export function usePlan(): PlanContext {
  const value = useContext(Context);
  if (!value) throw new Error("usePlan must be used inside PlanProvider");
  return value;
}

export default function PlanProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [recipeIds, setRecipeIds] = useState<string[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [ticked, setTicked] = useState<string[]>([]);
  const [seed, setSeed] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [sheet, setSheet] = useState<Sheet>(null);

  useEffect(() => {
    const plan = loadPlan();
    setRecipeIds(plan.recipeIds);
    setSkipped(plan.skipped);
    setTicked(plan.ticked);
    setSettings(loadSettings());
  }, []);

  const retailers = settings?.retailers.join(",");
  const status = settings?.status;
  const apiKey = settings?.apiKey;
  useEffect(() => {
    if (!retailers || !status) return;
    const controller = new AbortController();
    setLoad({ state: "loading" });
    fetch(`/api/deals?retailers=${retailers}&status=${status}`, {
      headers: apiKey ? { "x-prijsprofeet-key": apiKey } : {},
      signal: controller.signal,
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Could not load this week's promotions.");
        setLoad({ state: "ready", deals: body.deals, usingKey: body.usingKey });
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") setLoad({ state: "error", message: err.message });
      });
    return () => controller.abort();
  }, [retailers, status, apiKey, attempt]);

  const prefs = settings?.prefs;
  const deals = load.state === "ready" ? load.deals : null;
  const index = useMemo(() => (deals && prefs ? buildIndex(deals, prefs) : null), [deals, prefs]);

  // Keep a saved week as long as it still fits; otherwise plan a fresh one.
  useEffect(() => {
    if (!index || !prefs) return;
    setRecipeIds((current) => (fitsWeek(current, prefs) ? current : suggest(index, prefs)));
  }, [index, prefs]);

  useEffect(() => {
    if (!settings || recipeIds.length === 0) return;
    try {
      localStorage.setItem(PLAN_KEY, JSON.stringify({ recipeIds, skipped, ticked } satisfies SavedPlan));
    } catch {
      // Private browsing: the plan simply lasts for this visit.
    }
  }, [settings, recipeIds, skipped, ticked]);

  const plan = useMemo(
    () => (index && prefs && recipeIds.length ? realize(recipeIds, index, prefs) : null),
    [index, prefs, recipeIds],
  );

  const buying = useMemo(() => plan?.promo.filter((l) => !skipped.includes(l.deal.id)) ?? [], [plan, skipped]);
  const sum = useMemo(() => totals(buying), [buying]);

  function shuffle() {
    if (!index || !prefs) return;
    setSeed(seed + 1);
    setRecipeIds(suggest(index, prefs, seed + 1));
    setSkipped([]);
    setTicked([]);
  }

  const value: PlanContext = {
    settings,
    load,
    index,
    recipeIds,
    plan,
    skipped,
    ticked,
    buying,
    sum,
    shuffle,
    replace: (position, recipeId) => setRecipeIds(recipeIds.map((id, i) => (i === position ? recipeId : id))),
    toggleSkip: (id) => setSkipped(toggle(skipped, id)),
    toggleTick: (id) => setTicked(toggle(ticked, id)),
    applySettings: (next) => {
      saveSettings(next);
      setSettings(next);
    },
    retry: () => setAttempt(attempt + 1),
    openRecipe: (id) => setSheet({ kind: "recipe", id }),
    openSwap: (position) => setSheet({ kind: "swap", position }),
    closeSheet: () => setSheet(null),
  };

  return (
    <Context.Provider value={value}>
      {children}
      {sheet?.kind === "recipe" && <RecipeSheet key={sheet.id} recipeId={sheet.id} />}
      {sheet?.kind === "swap" && <SwapSheet position={sheet.position} />}
    </Context.Provider>
  );
}
