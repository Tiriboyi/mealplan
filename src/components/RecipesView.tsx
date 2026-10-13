"use client";

import { CalendarCheck, Clock, Search, Tag } from "lucide-react";
import { useMemo, useState } from "react";
import { onOffer } from "@/lib/planner";
import { RECIPES, type Protein } from "@/lib/recipes";
import { duration, norm } from "@/lib/text";
import { usePlan } from "./PlanProvider";
import { dayAt, PROTEIN_LABEL, RecipeArt } from "./ui";

const PROTEINS = Object.keys(PROTEIN_LABEL) as Protein[];

export default function RecipesView() {
  const { index, recipeIds, openRecipe } = usePlan();
  const [query, setQuery] = useState("");
  const [protein, setProtein] = useState<Protein | null>(null);

  const recipes = useMemo(() => {
    const q = norm(query);
    return RECIPES.filter((r) => !protein || r.protein === protein)
      .filter((r) => q === "" || norm(`${r.name} ${r.shona ?? ""} ${r.base}`).includes(q))
      .map((recipe) => ({ recipe, offers: index ? onOffer(recipe, index).length : 0 }))
      .sort((a, b) => b.offers - a.offers);
  }, [query, protein, index]);

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">{RECIPES.length} dinners</p>
          <h1>Recipes</h1>
          <p className="lede">Everything the planner can pick from. Most on offer this week comes first.</p>
        </div>
      </div>

      <div className="filters">
        <label className="search">
          <Search aria-hidden="true" />
          <span className="sr-only">Search recipes</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search recipes" />
        </label>
        <div className="pills" role="group" aria-label="Filter by protein">
          <button className="pill" aria-pressed={protein === null} onClick={() => setProtein(null)}>
            All
          </button>
          {PROTEINS.map((p) => (
            <button key={p} className="pill" aria-pressed={protein === p} onClick={() => setProtein(protein === p ? null : p)}>
              {PROTEIN_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      {recipes.length === 0 ? (
        <div className="empty">
          <Search aria-hidden="true" />
          <h2>No recipes match</h2>
          <p>Try another word, or clear the filter.</p>
          <button
            className="button"
            onClick={() => {
              setQuery("");
              setProtein(null);
            }}
          >
            Show all recipes
          </button>
        </div>
      ) : (
        <ul className="recipes">
          {recipes.map(({ recipe, offers }) => {
            const planned = recipeIds.indexOf(recipe.id);
            return (
              <li key={recipe.id}>
                <button className="recipe" onClick={() => openRecipe(recipe.id)}>
                  <RecipeArt recipe={recipe} shape="cover" />
                  <span className="recipe-body">
                    <strong>{recipe.name}</strong>
                    {recipe.shona && (
                      <span className="meta" lang="sn">
                        {recipe.shona}
                      </span>
                    )}
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
                    {planned >= 0 && (
                      <span className="tag planned">
                        <CalendarCheck aria-hidden="true" />
                        {dayAt(planned).long}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
