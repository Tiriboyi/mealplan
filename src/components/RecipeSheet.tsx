"use client";

import { ArrowLeftRight, Clock, Tag, Users, Wheat } from "lucide-react";
import { INGREDIENT } from "@/lib/ingredients";
import { PHOTOS } from "@/lib/photos";
import { alternatives } from "@/lib/planner";
import { RECIPE } from "@/lib/recipes";
import { RETAILERS } from "@/lib/retailers";
import { duration, money } from "@/lib/text";
import { usePlan } from "./PlanProvider";
import { dayAt, PROTEIN_LABEL, RecipeArt, Sheet } from "./ui";

export default function RecipeSheet({ recipeId }: { recipeId: string }) {
  const { settings, index, plan, recipeIds, replace, openSwap, closeSheet } = usePlan();
  const recipe = RECIPE[recipeId];
  if (!recipe) return null;

  const photo = PHOTOS[recipeId];
  const planned = recipeIds.indexOf(recipeId);
  // Days this recipe could take over without repeating a dinner or breaking the sadza rule.
  const free =
    planned < 0 && settings && index
      ? recipeIds.map((_, i) => i).filter((i) => alternatives(recipeIds, i, index, settings.prefs).includes(recipeId))
      : [];

  const ingredients = [recipe.main, ...recipe.with].map((id) => {
    const ingredient = INGREDIENT[id];
    // For a planned dinner the shopping list has the final say on whether the offer is worth using.
    const deal =
      planned >= 0 && plan
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
            <span className="meta">Planned for {dayAt(planned).long.toLowerCase()}</span>
            <button className="button" onClick={() => openSwap(planned)}>
              <ArrowLeftRight aria-hidden="true" />
              Swap
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
                  {dayAt(i).short} {dayAt(i).date}
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
            Serves {settings.prefs.people}
          </li>
        )}
        <li>
          <Wheat aria-hidden="true" />
          {PROTEIN_LABEL[recipe.protein]} with {recipe.base}
        </li>
      </ul>

      <h3>Ingredients</h3>
      <ul className="ingredients">
        {ingredients.map(({ ingredient, deal }) => (
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

      <h3>Method</h3>
      <ol className="steps">
        {recipe.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </Sheet>
  );
}
