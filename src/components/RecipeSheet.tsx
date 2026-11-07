"use client";

import { ArrowLeftRight, Clock, GlassWater, Tag, Users, Wheat } from "lucide-react";
import { INGREDIENT, type Ingredient } from "@/lib/ingredients";
import { KIND_LABEL } from "@/lib/lunches";
import { PHOTOS } from "@/lib/photos";
import { alternatives } from "@/lib/planner";
import { RECIPE } from "@/lib/recipes";
import { RETAILERS } from "@/lib/retailers";
import { duration, money } from "@/lib/text";
import type { Deal } from "@/lib/types";
import { usePlan } from "./PlanProvider";
import { dayAt, household, LunchArt, PROTEIN_LABEL, RecipeArt, Sheet } from "./ui";

export default function RecipeSheet({ recipeId, day }: { recipeId: string; day?: number }) {
  const { settings, index, plan, options, recipeIds, start, replace, openSwap, closeSheet } = usePlan();
  const recipe = RECIPE[recipeId];
  if (!recipe) return null;

  const photo = PHOTOS[recipeId];
  const planned = recipeIds.indexOf(recipeId);
  // The day it was opened for from the "Or make:" list, while the shopping list still makes it.
  const optionDay = day !== undefined && options[day]?.includes(recipeId) ? day : null;
  // Days this recipe could take over without repeating a dinner or breaking the sadza rule.
  const free =
    planned < 0 && settings && index
      ? recipeIds.map((_, i) => i).filter((i) => alternatives(recipeIds, i, index, settings.prefs).includes(recipeId))
      : [];

  const ingredients = [recipe.main, ...recipe.with].map((id) => {
    const ingredient = INGREDIENT[id];
    // For a planned dinner or an option the shopping list has the final say on whether the offer is worth using.
    const deal =
      (planned >= 0 || optionDay !== null) && plan
        ? plan.promo.find((l) => l.ingredient.id === id)?.deal
        : !ingredient.pantry
          ? index?.get(id)?.[0]
          : undefined;
    return { ingredient, deal };
  });

  return (
    <Sheet
      title={recipe.name}
      onClose={closeSheet}
      footer={
        planned >= 0 ? (
          <>
            <span className="meta">Planned for {dayAt(start, planned).long.toLowerCase()}</span>
            <button className="button" onClick={() => openSwap(planned)}>
              <ArrowLeftRight aria-hidden="true" />
              Swap
            </button>
          </>
        ) : optionDay !== null ? (
          <>
            <span className="meta">For {dayAt(start, optionDay).long.toLowerCase()} · Updates your shopping list</span>
            <button
              className="button"
              onClick={() => {
                replace(optionDay, recipeId);
                closeSheet();
              }}
            >
              <ArrowLeftRight aria-hidden="true" />
              Cook it instead
            </button>
          </>
        ) : free.length > 0 ? (
          <div className="place">
            <span className="meta">Cook it instead on</span>
            <div className="place-days">
              {free.map((i) => (
                <button
                  key={i}
                  className="button"
                  title={`Replaces ${RECIPE[recipeIds[i]]?.name}`}
                  onClick={() => {
                    replace(i, recipeId);
                    closeSheet();
                  }}
                >
                  {dayAt(start, i).short} {dayAt(start, i).date}
                </button>
              ))}
            </div>
          </div>
        ) : undefined
      }
    >
      <RecipeArt recipe={recipe} shape="banner" />
      {photo && <p className="credit">Illustrative photo by {photo.by} on Unsplash</p>}
      {recipe.shona && (
        <p className="eyebrow" lang="sn">
          {recipe.shona}
        </p>
      )}
      <h2>{recipe.name}</h2>
      <ul className="facts">
        <li>
          <Clock aria-hidden="true" />
          {duration(recipe.minutes)}
        </li>
        {settings && (
          <li>
            <Users aria-hidden="true" />
            Serves {household(settings.prefs)}
          </li>
        )}
        <li>
          <Wheat aria-hidden="true" />
          {PROTEIN_LABEL[recipe.protein]} with {recipe.base}
        </li>
      </ul>

      <h3>Ingredients</h3>
      <Ingredients items={ingredients} />

      <h3>Method</h3>
      <ol className="steps">
        {recipe.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </Sheet>
  );
}

/** A planned snack, lunchbox or lunch, with what the shopping list buys for it. */
export function LunchSheet({ slot }: { slot: string }) {
  const { settings, plan, start, openLunchSwap, closeSheet } = usePlan();
  const planned = plan?.lunches.find((l) => l.key === slot);
  const lunch = planned?.lunch;
  if (!settings || !plan || !planned || !lunch) return null;

  const { adults, kids } = settings.prefs;
  const label = KIND_LABEL[planned.kind];
  const forWhom =
    planned.kind === "adult"
      ? household({ adults, kids: 0 })
      : planned.kind === "family"
        ? household(settings.prefs)
        : `${kids} ${kids === 1 ? "kid" : "kids"}`;
  const ingredients = planned.items.map(({ ingredient }) => ({
    ingredient,
    deal: plan.promo.find((l) => l.ingredient.id === ingredient.id)?.deal,
  }));

  return (
    <Sheet
      title={lunch.name}
      onClose={closeSheet}
      footer={
        <>
          <span className="meta">
            {label} · {dayAt(start, planned.day).long.toLowerCase()}
          </span>
          <button className="button" onClick={() => openLunchSwap(slot)}>
            <ArrowLeftRight aria-hidden="true" />
            Swap
          </button>
        </>
      }
    >
      <LunchArt kind={planned.kind} shape="banner" />
      <p className="eyebrow">
        {label}
        {lunch.shona && <span lang="sn"> · {lunch.shona}</span>}
      </p>
      <h2>{lunch.name}</h2>
      <ul className="facts">
        <li>
          <Clock aria-hidden="true" />
          {duration(lunch.minutes)}
          {lunch.warm && " · warm"}
        </li>
        <li>
          <Users aria-hidden="true" />
          For {forWhom}
        </li>
        <li>
          <GlassWater aria-hidden="true" />
          Drink: {lunch.drink}
        </li>
      </ul>

      <h3>Ingredients</h3>
      <Ingredients items={ingredients} />

      <h3>Method</h3>
      <ol className="steps">
        {lunch.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </Sheet>
  );
}

function Ingredients({ items }: { items: { ingredient: Ingredient; deal?: Deal }[] }) {
  return (
    <ul className="ingredients">
      {items.map(({ ingredient, deal }) => (
        <li key={ingredient.id}>
          <span>
            {ingredient.name}
            <span className="meta" lang="nl">
              {ingredient.nl}
            </span>
          </span>
          {deal ? (
            <span className="tag offer">
              <Tag aria-hidden="true" />
              {RETAILERS[deal.retailer]} · {money(deal.price)}
            </span>
          ) : ingredient.pantry ? (
            <span className="tag">Cupboard</span>
          ) : (
            <span className="tag">Regular price</span>
          )}
        </li>
      ))}
    </ul>
  );
}
