"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { alternatives, buildIndex, fitsWeek, realize, suggest, totals, type Meal, type PromoLine } from "@/lib/planner";
import { RETAILERS } from "@/lib/retailers";
import { loadSettings, saveSettings, type Settings } from "@/lib/settings";
import { money, shortDate } from "@/lib/text";
import type { Deal } from "@/lib/types";
import SettingsDialog from "./SettingsDialog";

type Load =
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "ready"; deals: Deal[]; usingKey: boolean };

type SavedPlan = { recipeIds: string[]; skipped: string[]; ticked: string[] };

const PLAN_KEY = "mealplan.plan";

function loadPlan(): SavedPlan {
  try {
    const saved = JSON.parse(localStorage.getItem(PLAN_KEY) ?? "{}") as Partial<SavedPlan>;
    return { recipeIds: saved.recipeIds ?? [], skipped: saved.skipped ?? [], ticked: saved.ticked ?? [] };
  } catch {
    return { recipeIds: [], skipped: [], ticked: [] };
  }
}

function dayLabel(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
}

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export default function Planner() {
  // Null until the browser's saved settings have been read.
  const [settings, setSettings] = useState<Settings | null>(null);
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [recipeIds, setRecipeIds] = useState<string[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [ticked, setTicked] = useState<string[]>([]);
  const [seed, setSeed] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  // Recipes already offered per day, so repeated swaps keep moving down the list.
  const offered = useRef<Record<number, string[]>>({});

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
  }, [retailers, status, apiKey]);

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

  function shuffle() {
    if (!index || !prefs) return;
    offered.current = {};
    setSeed(seed + 1);
    setRecipeIds(suggest(index, prefs, seed + 1));
    setSkipped([]);
    setTicked([]);
  }

  function swap(position: number) {
    if (!index || !prefs) return;
    const options = alternatives(recipeIds, position, index, prefs);
    if (options.length === 0) return;
    const seen = (offered.current[position] ??= []);
    seen.push(recipeIds[position]);
    let next = options.find((id) => !seen.includes(id));
    if (!next) {
      // Been through every recipe: start again from the best fit.
      offered.current[position] = [];
      next = options[0];
    }
    setRecipeIds(recipeIds.map((id, i) => (i === position ? next : id)));
  }

  function applySettings(next: Settings) {
    saveSettings(next);
    setSettings(next);
    setShowSettings(false);
  }

  const buying = plan?.promo.filter((l) => !skipped.includes(l.deal.id)) ?? [];
  const sum = totals(buying);

  return (
    <main>
      <header className="top">
        <div>
          <h1>Mealplan</h1>
          <p className="muted">
            Dinners from {settings?.status === "upcoming" ? "next week's" : "this week's"} promotions
            {settings ? ` at ${settings.retailers.map((r) => RETAILERS[r]).join(", ")}` : ""}
          </p>
        </div>
        <div className="actions">
          <button onClick={shuffle} disabled={!plan}>
            New week
          </button>
          <button onClick={() => setShowSettings(true)} disabled={!settings}>
            Settings
          </button>
        </div>
      </header>

      {load.state === "loading" && <p className="notice">Loading promotions…</p>}
      {load.state === "error" && (
        <p className="notice error" role="alert">
          {load.message}
        </p>
      )}

      {plan && (
        <>
          <section className="savings" aria-label="Savings">
            <div>
              <span className="label">You save</span>
              <strong className="big">{money(sum.saving)}</strong>
            </div>
            <p>
              {money(sum.pay)} for {buying.length} promotion {buying.length === 1 ? "item" : "items"}, instead of{" "}
              <s>{money(sum.normal)}</s> at regular prices ({sum.percent}% off).
            </p>
          </section>

          <div className="columns">
            <section aria-label="Dinners">
              <h2>Dinners</h2>
              <ol className="meals">
                {plan.meals.map((meal, i) => (
                  <MealCard key={meal.recipe.id} meal={meal} promo={plan.promo} day={dayLabel(i)} onSwap={() => swap(i)} />
                ))}
              </ol>
            </section>

            <section aria-label="Shopping list">
              <h2>Shopping list</h2>
              {Object.keys(RETAILERS)
                .map((r) => ({ retailer: r, lines: plan.promo.filter((l) => l.deal.retailer === r) }))
                .filter((g) => g.lines.length > 0)
                .map(({ retailer, lines }) => (
                  <RetailerList
                    key={retailer}
                    retailer={retailer}
                    lines={lines}
                    skipped={skipped}
                    ticked={ticked}
                    onSkip={(id) => setSkipped(toggle(skipped, id))}
                    onTick={(id) => setTicked(toggle(ticked, id))}
                  />
                ))}

              {plan.regular.length > 0 && (
                <div className="group">
                  <h3>At regular price</h3>
                  <p className="muted small">Needed for these dinners, with no promotion worth using this week.</p>
                  <ul className="plain">
                    {plan.regular.map(({ ingredient, line }) => (
                      <li key={ingredient.id}>
                        <span>
                          {ingredient.name} <span className="muted">· {ingredient.nl}</span>
                          {line && (
                            <span className="muted small block">
                              {line.deal.promoLabel ?? "The offer"} at {RETAILERS[line.deal.retailer]} only pays off
                              if you buy {line.deal.multiBuyQty}; one is {money(line.pay / line.units)}.
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {plan.pantry.length > 0 && (
                <div className="group">
                  <h3>Check your cupboard</h3>
                  <ul className="plain">
                    {plan.pantry.map((ingredient) => (
                      <li key={ingredient.id}>
                        <span>
                          {ingredient.name} <span className="muted">· {ingredient.nl}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>
        </>
      )}

      <footer className="muted small">
        Prices and promotions from{" "}
        <a href="https://www.prijsprofeet.nl" target="_blank" rel="noreferrer">
          PrijsProfeet
        </a>
        . They are national prices: check the shelf, and note that some offers need a loyalty card.
        {load.state === "ready" && !load.usingKey && " Running without an API key; add yours in Settings for higher limits."}
      </footer>

      {showSettings && settings && (
        <SettingsDialog settings={settings} onSave={applySettings} onClose={() => setShowSettings(false)} />
      )}
    </main>
  );
}

function MealCard(props: { meal: Meal; promo: PromoLine[]; day: string; onSwap: () => void }) {
  const { meal, day, onSwap } = props;
  const { recipe, items } = meal;
  // Only what the shopping list actually buys on promotion, not every ingredient with an offer.
  const onPromo = items.filter((i) => props.promo.some((l) => l.ingredient.id === i.ingredient.id));
  return (
    <li className="meal">
      <div className="meal-head">
        <div>
          <span className="label">{day}</span>
          <h3>{recipe.name}</h3>
          <p className="muted small">
            {recipe.shona ? `${recipe.shona} · ` : ""}
            {recipe.minutes} min
          </p>
        </div>
        <button className="quiet" onClick={onSwap}>
          Swap
        </button>
      </div>
      {onPromo.length > 0 ? (
        <p className="chips">
          {onPromo.map(({ ingredient, deal }) => (
            <span key={ingredient.id} className="chip" title={`${deal!.name} at ${RETAILERS[deal!.retailer]}`}>
              {ingredient.name.replace(/ \(.*\)$/, "")}
            </span>
          ))}
        </p>
      ) : (
        <p className="muted small">Nothing for this dinner is on promotion.</p>
      )}
      <details>
        <summary>Recipe</summary>
        <p className="small">
          <strong>You need:</strong> {items.map((i) => i.ingredient.name).join(", ")}.
        </p>
        <ol className="steps">
          {recipe.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </details>
    </li>
  );
}

function RetailerList(props: {
  retailer: string;
  lines: PromoLine[];
  skipped: string[];
  ticked: string[];
  onSkip: (id: string) => void;
  onTick: (id: string) => void;
}) {
  const { retailer, lines, skipped, ticked } = props;
  const sum = totals(lines.filter((l) => !skipped.includes(l.deal.id)));
  const ends = lines.map((l) => l.deal.validUntil).filter((d): d is string => Boolean(d)).sort()[0];
  return (
    <div className="group">
      <div className="group-head">
        <h3>
          <span className={`dot ${retailer}`} aria-hidden="true" />
          {RETAILERS[retailer]}
        </h3>
        <span className="muted small">
          {money(sum.pay)} · save {money(sum.saving)}
        </span>
      </div>
      {ends && <p className="muted small">First offers end {shortDate(ends)}.</p>}
      <ul className="lines">
        {lines.map((line) => {
          const { deal } = line;
          const off = skipped.includes(deal.id);
          return (
            <li key={deal.id} className={off ? "off" : undefined}>
              <input
                type="checkbox"
                aria-label={`In the trolley: ${deal.name}`}
                checked={ticked.includes(deal.id)}
                onChange={() => props.onTick(deal.id)}
                disabled={off}
              />
              <div className="line-body">
                <span className="line-name">
                  {line.units} ×{" "}
                  {deal.url ? (
                    <a href={deal.url} target="_blank" rel="noreferrer">
                      {deal.name}
                    </a>
                  ) : (
                    deal.name
                  )}
                </span>
                <span className="muted small block">
                  {[deal.quantity, deal.promoLabel, deal.validUntil && `until ${shortDate(deal.validUntil)}`]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <span className="muted small block">For {line.ingredient.name.toLowerCase()}</span>
              </div>
              <div className="line-price">
                <strong>{money(line.pay)}</strong>
                {line.saving > 0 && <s className="muted small">{money(line.normal)}</s>}
                <button className="link small" onClick={() => props.onSkip(deal.id)}>
                  {off ? "Add back" : "Have it"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
