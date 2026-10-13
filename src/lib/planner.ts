import { allowed } from "./diet";
import { INGREDIENT, ingredientsFor, type Ingredient } from "./ingredients";
import { packGrams, pricePerKg, purchase, type Purchase } from "./pricing";
import { RECIPE, RECIPES, type Recipe } from "./recipes";
import type { Deal, Prefs } from "./types";

/** Promotions usable for each ingredient id, best value first. */
export type DealIndex = Map<string, Deal[]>;

export function buildIndex(deals: Deal[], prefs: Prefs): DealIndex {
  const index: DealIndex = new Map();
  for (const deal of deals) {
    if (!allowed(deal.name, prefs)) continue;
    for (const id of ingredientsFor(deal)) {
      const list = index.get(id);
      if (list) list.push(deal);
      else index.set(id, [deal]);
    }
  }
  // Cheapest way to cover one meal first, so a 1.5 kg premium cut never beats a normal pack.
  for (const [id, list] of index) {
    const cost = (d: Deal) => buy(INGREDIENT[id], d, prefs.people, 1).pay;
    const perKg = (d: Deal) => pricePerKg(d) ?? Infinity;
    list.sort((a, b) => cost(a) - cost(b) || perKg(a) - perKg(b) || a.id.localeCompare(b.id));
  }
  return index;
}

/** What to buy of `deal` to cover `meals` dinners using `ingredient`. */
function buy(ingredient: Ingredient, deal: Deal, people: number, meals: number): Purchase {
  // "Per stuk" and other unreadable sizes are treated as a typical 400 g pack.
  const pack = packGrams(deal.quantity) ?? 400;
  const units = Math.ceil((ingredient.grams * people * meals) / pack);
  return purchase(deal, Math.min(units, 8));
}

/** Above this per person, the main ingredient starts counting against a meal. */
const MAIN_BUDGET_PER_PERSON = 4;

// Sadza dinners per planned week: at least once, never more than twice.
const SADZA_MIN = 1;
const SADZA_MAX = 2;

const sadzaCount = (recipes: Recipe[]) => recipes.filter((r) => r.base === "sadza").length;

/** Whether `recipe` can join `chosen` with `slotsAfter` dinners still to pick, keeping the sadza rule reachable. */
function sadzaAllows(recipe: Recipe, chosen: Recipe[], slotsAfter: number, days: number): boolean {
  const count = sadzaCount(chosen) + Number(recipe.base === "sadza");
  // A single dinner is not a week: only insist on sadza when planning two or more.
  const min = days >= 2 ? SADZA_MIN : 0;
  return count <= SADZA_MAX && count + slotsAfter >= min;
}

/** Whether a saved week is still valid for these preferences. */
export function fitsWeek(recipeIds: string[], prefs: Prefs): boolean {
  if (recipeIds.length !== prefs.days || new Set(recipeIds).size !== recipeIds.length) return false;
  if (!recipeIds.every((id) => id in RECIPE)) return false;
  const last = RECIPE[recipeIds[0]];
  const rest = recipeIds.slice(1).map((id) => RECIPE[id]);
  return sadzaAllows(last, rest, 0, prefs.days);
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** How well a recipe fits this week's promotions, given the meals already chosen. */
function score(recipe: Recipe, index: DealIndex, chosen: Recipe[], people: number): number {
  let s = 0;
  const main = index.get(recipe.main)?.[0];
  if (main) {
    const cost = buy(INGREDIENT[recipe.main], main, people, 1);
    s += 10 + (cost.normal > 0 ? (cost.saving / cost.normal) * 10 : 0);
    s -= Math.max(0, cost.pay / people - MAIN_BUDGET_PER_PERSON) * 4;
    // A "2 voor" pack already in the trolley covers a second meal for free.
    const uses = chosen.filter((c) => c.main === recipe.main).length;
    if (uses > 0 && uses < (main.multiBuyQty ?? 1)) s += 5;
  } else {
    s -= 4;
  }
  for (const id of recipe.with) if (index.has(id)) s += 1;

  const sameProtein = chosen.filter((c) => c.protein === recipe.protein).length;
  s -= sameProtein === 0 ? 0 : sameProtein === 1 ? 5 : 18;
  s -= chosen.filter((c) => c.base === recipe.base).length * 1.5;
  return s;
}

/** Fresh fish early in the week, and no protein two nights running where avoidable. */
function arrange(recipes: Recipe[]): Recipe[] {
  const pool = [...recipes].sort((a, b) => Number(b.protein === "fish") - Number(a.protein === "fish"));
  const out: Recipe[] = [];
  while (pool.length) {
    const last = out[out.length - 1]?.protein;
    const i = Math.max(0, pool.findIndex((r) => r.protein !== last));
    out.push(...pool.splice(i, 1));
  }
  return out;
}

/** Pick `prefs.days` dinners. Seed 0 is the best fit; other seeds shuffle among good fits. */
export function suggest(index: DealIndex, prefs: Prefs, seed = 0): string[] {
  const random = mulberry32(seed);
  const jitter = seed === 0 ? 0 : 8;
  const chosen: Recipe[] = [];
  const days = Math.min(prefs.days, RECIPES.length);
  while (chosen.length < days) {
    let best: Recipe | null = null;
    let bestScore = -Infinity;
    for (const r of RECIPES) {
      if (chosen.includes(r) || !sadzaAllows(r, chosen, days - chosen.length - 1, days)) continue;
      const s = score(r, index, chosen, prefs.people) + random() * jitter;
      if (s > bestScore) [best, bestScore] = [r, s];
    }
    chosen.push(best!);
  }
  return arrange(chosen).map((r) => r.id);
}

/** Recipes that could replace the meal at `position`, best fit first. */
export function alternatives(recipeIds: string[], position: number, index: DealIndex, prefs: Prefs): string[] {
  const others = recipeIds.filter((_, i) => i !== position).map((id) => RECIPE[id]);
  return RECIPES.filter((r) => !recipeIds.includes(r.id) && sadzaAllows(r, others, 0, recipeIds.length))
    .map((r) => ({ id: r.id, s: score(r, index, others, prefs.people) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.id);
}

export type MealItem = { ingredient: Ingredient; deal: Deal | null };
export type Meal = { recipe: Recipe; items: MealItem[] };

export type PromoLine = Purchase & {
  deal: Deal;
  ingredient: Ingredient;
  /** Names of the meals this product is bought for. */
  meals: string[];
};

export type Plan = {
  meals: Meal[];
  /** Products to buy on promotion. */
  promo: PromoLine[];
  /**
   * Needed at regular price: nothing on promotion this week, or (with `line`)
   * a multi-buy that would make you buy more than the meals use.
   */
  regular: { ingredient: Ingredient; meals: string[]; line?: PromoLine }[];
  /** Cupboard staples the meals assume. */
  pantry: Ingredient[];
};

/** Attach this week's promotions to the chosen recipes and work out what to buy. */
export function realize(recipeIds: string[], index: DealIndex, prefs: Prefs): Plan {
  const recipes = recipeIds.map((id) => RECIPE[id]).filter(Boolean);
  const meals: Meal[] = recipes.map((recipe) => ({
    recipe,
    items: [recipe.main, ...recipe.with].map((id) => ({
      ingredient: INGREDIENT[id],
      deal: index.get(id)?.[0] ?? null,
    })),
  }));

  const usedIn = new Map<string, string[]>();
  for (const { recipe } of meals)
    for (const id of [recipe.main, ...recipe.with]) usedIn.set(id, [...(usedIn.get(id) ?? []), recipe.name]);

  const promo: PromoLine[] = [];
  const regular: Plan["regular"] = [];
  const pantry: Ingredient[] = [];
  for (const [id, mealNames] of usedIn) {
    const ingredient = INGREDIENT[id];
    const deal = index.get(id)?.[0];
    if (ingredient.pantry) pantry.push(ingredient);
    else if (!deal) regular.push({ ingredient, meals: mealNames });
    else {
      const line = { deal, ingredient, meals: mealNames, ...buy(ingredient, deal, prefs.people, mealNames.length) };
      if (line.atPromo) promo.push(line);
      else regular.push({ ingredient, meals: mealNames, line });
    }
  }
  promo.sort((a, b) => a.deal.retailer.localeCompare(b.deal.retailer) || b.saving - a.saving);
  return { meals, promo, regular, pantry };
}

export type Totals = { pay: number; normal: number; saving: number; percent: number };

export function totals(lines: Purchase[]): Totals {
  const sum = (pick: (l: Purchase) => number) => Math.round(lines.reduce((t, l) => t + pick(l), 0) * 100) / 100;
  const pay = sum((l) => l.pay);
  const normal = sum((l) => l.normal);
  const saving = Math.round((normal - pay) * 100) / 100;
  return { pay, normal, saving, percent: normal > 0 ? Math.round((saving / normal) * 100) : 0 };
}
