"use client";

import { ArrowLeftRight, ArrowRight, Clock, Shuffle, Tag, Users } from "lucide-react";
import Link from "next/link";
import { totals, type Meal } from "@/lib/planner";
import { RETAILERS } from "@/lib/retailers";
import { duration, money } from "@/lib/text";
import { usePlan } from "./PlanProvider";
import Status from "./Status";
import { dayAt, RecipeArt, RetailerBadge, weekRange } from "./ui";

export default function WeekView() {
  const { settings, plan, buying, sum, shuffle } = usePlan();
  const upcoming = settings?.status === "upcoming";

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">{settings ? weekRange(settings.prefs.days) : " "}</p>
          <h1>{upcoming ? "Next week's dinners" : "This week's dinners"}</h1>
          {settings && (
            <p className="lede">
              Planned around {upcoming ? "upcoming" : "current"} offers at{" "}
              {settings.retailers.map((r) => RETAILERS[r]).join(", ")}.
            </p>
          )}
        </div>
        <button className="button" onClick={shuffle} disabled={!plan}>
          <Shuffle aria-hidden="true" />
          New week
        </button>
      </div>

      {!plan || !settings ? (
        <Status rows={settings?.prefs.days ?? 4} />
      ) : (
        <>
          <section className="hero" aria-label="Savings">
            <div className="hero-main">
              <p className="eyebrow">You save</p>
              <p className="hero-figure">{money(sum.saving)}</p>
              <p>
                {money(sum.pay)} for {buying.length} {buying.length === 1 ? "offer" : "offers"}, instead of{" "}
                <s>{money(sum.normal)}</s> at regular prices.
              </p>
            </div>
            <div className="hero-side">
              <div
                className="meter"
                role="img"
                aria-label={`${sum.percent}% off the regular price of the offers on your list`}
              >
                <span style={{ width: `${100 - sum.percent}%` }} />
              </div>
              <p className="meter-legend">
                <span>You pay {100 - sum.percent}%</span>
                <span>{sum.percent}% off</span>
              </p>
              <ul className="hero-retailers">
                {Object.keys(RETAILERS)
                  .map((r) => ({ r, lines: buying.filter((l) => l.deal.retailer === r) }))
                  .filter(({ lines }) => lines.length > 0)
                  .map(({ r, lines }) => (
                    <li key={r}>
                      <RetailerBadge retailer={r} />
                      {RETAILERS[r]}
                      <span>save {money(totals(lines).saving)}</span>
                    </li>
                  ))}
              </ul>
              <Link href="/shopping" className="button on-hero">
                Open shopping list
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </section>

          <div className="section-head">
            <h2>Dinners</h2>
            <p className="meta">
              <Users aria-hidden="true" />
              {settings.prefs.people} {settings.prefs.people === 1 ? "person" : "people"} ·{" "}
              <Link href="/settings">Change</Link>
            </p>
          </div>
          <ol className="meals">
            {plan.meals.map((meal, i) => (
              <MealCard key={meal.recipe.id} meal={meal} position={i} />
            ))}
          </ol>
        </>
      )}
    </>
  );
}

function MealCard({ meal, position }: { meal: Meal; position: number }) {
  const { plan, openRecipe, openSwap } = usePlan();
  const { recipe, items } = meal;
  const day = dayAt(position);
  // Only what the shopping list actually buys on promotion, not every ingredient with an offer.
  const onPromo = items.filter((i) => plan?.promo.some((l) => l.ingredient.id === i.ingredient.id));

  return (
    <li className={position === 0 ? "meal tonight" : "meal"}>
      <RecipeArt recipe={recipe} />
      <div className="meal-body">
        <p className="meal-day">
          <span>{day.long}</span> {day.short} {day.date}
        </p>
        <h3>
          <button className="meal-title" onClick={() => openRecipe(recipe.id)}>
            {recipe.name}
          </button>
        </h3>
        <p className="meta">
          <Clock aria-hidden="true" />
          {duration(recipe.minutes)}
          {recipe.shona && <span lang="sn"> · {recipe.shona}</span>}
        </p>
        {onPromo.length > 0 ? (
          <ul className="chips" aria-label="On offer">
            {onPromo.map(({ ingredient, deal }) => (
              <li key={ingredient.id} className="chip" title={`${deal!.name} at ${RETAILERS[deal!.retailer]}`}>
                <Tag aria-hidden="true" />
                {ingredient.name.replace(/ \(.*\)$/, "")}
              </li>
            ))}
          </ul>
        ) : (
          <p className="meta">Nothing for this dinner is on offer.</p>
        )}
      </div>
      <button className="icon-button meal-swap" onClick={() => openSwap(position)} aria-label={`Swap ${recipe.name}`}>
        <ArrowLeftRight aria-hidden="true" />
      </button>
    </li>
  );
}
