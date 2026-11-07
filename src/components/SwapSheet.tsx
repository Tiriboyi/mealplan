"use client";

import { Clock, Tag } from "lucide-react";
import { useState } from "react";
import { KIND_LABEL, LUNCH, type LunchKind } from "@/lib/lunches";
import { alternatives, lunchOptions, onOffer } from "@/lib/planner";
import { RECIPE } from "@/lib/recipes";
import { duration } from "@/lib/text";
import { usePlan } from "./PlanProvider";
import { dayAt, LunchArt, RecipeArt, Sheet } from "./ui";

const FIRST = 6;

export default function SwapSheet({ position }: { position: number }) {
  const { settings, index, recipeIds, start, replace, closeSheet } = usePlan();
  const [all, setAll] = useState(false);
  const current = RECIPE[recipeIds[position]];
  if (!settings || !index || !current) return null;

  const options = alternatives(recipeIds, position, index, settings.prefs);
  const shown = all ? options : options.slice(0, FIRST);

  return (
    <Sheet title="Swap dinner" onClose={closeSheet}>
      <p className="eyebrow">{dayAt(start, position).long}</p>
      <h2>Swap {current.name}</h2>
      <p className="lede">Best fits for this week's offers come first.</p>
      {options.length === 0 ? (
        <p className="meta">No other recipe fits this week.</p>
      ) : (
        <ul className="options">
          {shown.map((id) => {
            const recipe = RECIPE[id];
            const offers = onOffer(recipe, index).length;
            return (
              <li key={id}>
                <button
                  className="option"
                  onClick={() => {
                    replace(position, id);
                    closeSheet();
                  }}
                >
                  <RecipeArt recipe={recipe} />
                  <span className="option-body">
                    <strong>{recipe.name}</strong>
                    <span className="meta">
                      <Clock aria-hidden="true" />
                      {duration(recipe.minutes)}
                      {offers > 0 && (
                        <span className="offer-count">
                          <Tag aria-hidden="true" />
                          {offers} on offer
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {!all && options.length > FIRST && (
        <button className="button wide" onClick={() => setAll(true)}>
          Show all {options.length}
        </button>
      )}
    </Sheet>
  );
}

/** Other lunches of the same kind that this week's promotions make, best first. */
export function LunchSwapSheet({ slot }: { slot: string }) {
  const { settings, index, lunches, start, replaceLunch, closeSheet } = usePlan();
  if (!settings || !index || !(slot in lunches)) return null;

  const kind = slot.slice(slot.indexOf("-") + 1) as LunchKind;
  const label = KIND_LABEL[kind];
  const current = lunches[slot];
  const options = lunchOptions(lunches, slot, index, settings.prefs);

  return (
    <Sheet title={`Swap ${label.toLowerCase()}`} onClose={closeSheet}>
      <p className="eyebrow">{dayAt(start, Number(slot.slice(0, slot.indexOf("-")))).long}</p>
      <h2>{current ? `Swap ${LUNCH[current].name}` : label}</h2>
      <p className="lede">Only what is on promotion at your supermarkets, best offers first.</p>
      {options.length === 0 ? (
        <p className="meta">Nothing else is on promotion for this.</p>
      ) : (
        <ul className="options">
          {options.map((id) => (
            <li key={id}>
              <button
                className="option"
                onClick={() => {
                  replaceLunch(slot, id);
                  closeSheet();
                }}
              >
                <LunchArt kind={kind} />
                <span className="option-body">
                  <strong>{LUNCH[id].name}</strong>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
