"use client";

import { ArrowLeftRight, ArrowRight, Clock, Shuffle, Tag, Users } from "lucide-react";
import Link from "next/link";
import { KIND_LABEL } from "@/lib/lunches";
import { totals, type Meal, type PlannedLunch } from "@/lib/planner";
import { RECIPE } from "@/lib/recipes";
import { RETAILERS } from "@/lib/retailers";
import { duration, money } from "@/lib/text";
import { usePlan } from "./PlanProvider";
import Status from "./Status";
import { dayAt, household, LunchArt, RecipeArt, RetailerBadge, weekRange } from "./ui";

export default function WeekView() {
  const { settings, plan, start, buying, sum, shuffle } = usePlan();
  const upcoming = settings?.status === "upcoming";

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">{settings && start ? weekRange(start, settings.prefs.days) :" "}</p>
          <h1>{upcoming ? "Next week's meals" : "This week's meals"}</h1>
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
            <h2>Meals</h2>
            <p className="meta">
              <Users aria-hidden="true" />
              {household(settings.prefs)} · <Link href="/settings">Change</Link>
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
  const { plan, options, start, openRecipe, openSwap } = usePlan();
  const others = options[position] ?? [];
  const { recipe, items } = meal;
  const day = dayAt(start, position);
  const lunches = plan?.lunches.filter((l) => l.day === position) ?? [];
  // Only what the shopping list actually buys on promotion, not every ingredient with an offer.
  const onPromo = items.filter((i) => plan?.promo.some((l) => l.ingredient.id === i.ingredient.id));

  return (
    <li className={["meal", day.long === "Today" && "tonight", day.past && "past"].filter(Boolean).join(" ")}>
      <RecipeArt recipe={recipe} />
      <div className="meal-body">
        <p className="meal-day">
          <span>{day.long}</span> {day.short} {day.date}
        </p>
        {lunches.length > 0 && (
          <ul className="slots" aria-label="Lunches">
            {lunches.map((l) => (
              <LunchRow key={l.key} planned={l} />
            ))}
          </ul>
        )}
        <p className="slot-kind">Dinner</p>
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
        {others.length > 0 ? (
          <p className="meta meal-options">
            Or make:{" "}
            {others.map((id, i) => (
              <span key={id}>
                {i > 0 && ", "}
                <button className="meal-option" onClick={() => openRecipe(id, position)}>
                  {RECIPE[id].name}
                </button>
              </span>
            ))}
          </p>
        ) : (
          <p className="meta meal-options">No alternative dinner possible with this week&apos;s shopping</p>
        )}
      </div>
      <button className="icon-button meal-swap" onClick={() => openSwap(position)} aria-label={`Swap ${recipe.name}`}>
        <ArrowLeftRight aria-hidden="true" />
      </button>
    </li>
  );
}

function LunchRow({ planned }: { planned: PlannedLunch }) {
  const { openLunch, openLunchSwap } = usePlan();
  const { key, kind, lunch } = planned;
  const label = KIND_LABEL[kind];
  return (
    <li className="slot">
      <LunchArt kind={kind} />
      <span className="slot-kind">{label}</span>
      {lunch ? (
        <>
          <button className="slot-name" onClick={() => openLunch(key)}>
            {lunch.name}
          </button>
          <button className="icon-button slot-swap" onClick={() => openLunchSwap(key)} aria-label={`Swap ${label.toLowerCase()}`}>
            <ArrowLeftRight aria-hidden="true" />
          </button>
        </>
      ) : (
        <span className="meta slot-name">No lunch idea on promotion at your supermarkets this week</span>
      )}
    </li>
  );
}
