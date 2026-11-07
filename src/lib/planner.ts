import { allowed } from "./diet";
import { INGREDIENT, ingredientsFor, type Ingredient } from "./ingredients";
import { KIND_LABEL, LUNCH, LUNCH_PANTRY, LUNCHES, type Lunch, type LunchKind } from "./lunches";
import { packGrams, pricePerKg, purchase, type Purchase } from "./pricing";
import { RECIPE, RECIPES, type Recipe } from "./recipes";
import { addDays, lunchSlots } from "./schoolCalendar";
import type { Deal, Prefs } from "./types";

/** Promotions usable for each ingredient id, best value first. */
export type DealIndex = Map<string, Deal[]>;

/** What a 6- to 8-year-old eats at a family meal, as a share of an adult portion. */
export const KID_PORTION = 0.6;

/** Adult portions at a meal the whole family eats. */
export function portions(prefs: Prefs): number {
  return prefs.adults + KID_PORTION * prefs.kids;
}

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
    const cost = (d: Deal) => buy(d, INGREDIENT[id].grams * portions(prefs)).pay;
    const perKg = (d: Deal) => pricePerKg(d) ?? Infinity;
    list.sort((a, b) => cost(a) - cost(b) || perKg(a) - perKg(b) || a.id.localeCompare(b.id));
  }
  return index;
}

/** What to buy of `deal` to cover `grams` of an ingredient. */
function buy(deal: Deal, grams: number): Purchase {
  // "Per stuk" and other unreadable sizes are treated as a typical 400 g pack.
  const pack = packGrams(deal.quantity) ?? 400;
  const units = Math.ceil(grams / pack);
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
    const cost = buy(main, INGREDIENT[recipe.main].grams * people);
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
      const s = score(r, index, chosen, portions(prefs)) + random() * jitter;
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
    .map((r) => ({ id: r.id, s: score(r, index, others, portions(prefs)) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.id);
}

/** The ingredients of `recipe` with a promotion this week, cupboard staples aside. */
export function onOffer(recipe: Recipe, index: DealIndex): Ingredient[] {
  return [recipe.main, ...recipe.with].map((id) => INGREDIENT[id]).filter((i) => !i.pantry && index.has(i.id));
}

/** Planned lunches by slot ("3-lunchbox" is day 3's lunchbox): a lunch id, or null when nothing qualifies. */
export type Lunches = Record<string, string | null>;

const slotKey = (day: number, kind: LunchKind) => `${day}-${kind}`;
const dayOf = (key: string) => Number(key.slice(0, key.indexOf("-")));
const kindOf = (key: string) => key.slice(key.indexOf("-") + 1) as LunchKind;

/** Every lunch slot of a week starting on `start`, in day order. */
function slotsFor(start: string, prefs: Prefs): string[] {
  return Array.from({ length: prefs.days }, (_, day) =>
    lunchSlots(addDays(start, day), prefs.kids).map((kind) => slotKey(day, kind)),
  ).flat();
}

/** Portions a lunch of this kind is made for: snacks and lunchboxes per kid. */
function slotPortions(kind: LunchKind, prefs: Prefs): number {
  return kind === "snack" || kind === "lunchbox" ? prefs.kids : kind === "adult" ? prefs.adults : portions(prefs);
}

/** Whether `lunch` can be made from this week's promotions alone, plus a few cupboard staples. */
export function qualifies(lunch: Lunch, index: DealIndex, prefs: Prefs): boolean {
  return (
    allowed(lunch.name, prefs) &&
    Object.keys(lunch.amounts).every((id) => {
      const ingredient = INGREDIENT[id];
      return allowed(ingredient.name, prefs) && (ingredient.pantry ? LUNCH_PANTRY.includes(id) : index.has(id));
    })
  );
}

/** Average share saved on the promotions a lunch is bought from. */
function lunchScore(lunch: Lunch, index: DealIndex, kind: LunchKind, prefs: Prefs): number {
  const shares = Object.entries(lunch.amounts)
    .filter(([id]) => !INGREDIENT[id].pantry)
    .map(([id, grams]) => {
      const cost = buy(index.get(id)![0], grams * Math.max(1, slotPortions(kind, prefs)));
      return cost.normal > 0 ? (cost.saving / cost.normal) * 10 : 0;
    });
  return shares.reduce((a, b) => a + b, 0) / shares.length;
}

const ranked = (kind: LunchKind, index: DealIndex, prefs: Prefs) =>
  LUNCHES.filter((l) => l.kinds.includes(kind) && qualifies(l, index, prefs))
    .map((l) => ({ lunch: l, s: lunchScore(l, index, kind, prefs) }))
    // Array.sort is stable, so equal scores keep catalogue order.
    .sort((a, b) => b.s - a.s);

/**
 * Lunches for a week starting on `start`: the best promotions first, never the same snack or
 * lunchbox two school days running while something else qualifies, and variety beyond that.
 */
export function planLunches(start: string, index: DealIndex, prefs: Prefs, seed = 0): Lunches {
  const random = mulberry32(seed);
  const jitter = seed === 0 ? 0 : 3;
  const lunches: Lunches = {};
  const last: Partial<Record<LunchKind, string>> = {};
  const uses = new Map<string, number>();
  for (const key of slotsFor(start, prefs)) {
    const kind = kindOf(key);
    let best: string | null = null;
    let bestScore = -Infinity;
    for (const { lunch, s } of ranked(kind, index, prefs)) {
      const total = s - (uses.get(lunch.id) ?? 0) * 2 - (lunch.id === last[kind] ? 100 : 0) + random() * jitter;
      if (total > bestScore) [best, bestScore] = [lunch.id, total];
    }
    lunches[key] = best;
    if (best) {
      last[kind] = best;
      uses.set(best, (uses.get(best) ?? 0) + 1);
    }
  }
  return lunches;
}

/** Lunches that could replace the one in `key`: the same kind, on promotion, best first. */
export function lunchOptions(lunches: Lunches, key: string, index: DealIndex, prefs: Prefs): string[] {
  return ranked(kindOf(key), index, prefs)
    .map(({ lunch }) => lunch.id)
    .filter((id) => id !== lunches[key]);
}

/**
 * Keep saved lunches, hand swaps included, while the week has the same slots and each still
 * qualifies. Slots that no longer do, or empty ones that now could be filled, are planned again.
 */
export function keepLunches(lunches: Lunches, start: string, index: DealIndex, prefs: Prefs): Lunches {
  const keys = slotsFor(start, prefs);
  if (keys.length !== Object.keys(lunches).length || !keys.every((k) => k in lunches)) return planLunches(start, index, prefs);
  const stale = keys.filter((k) => {
    const id = lunches[k];
    return id === null ? ranked(kindOf(k), index, prefs).length > 0 : !(id in LUNCH) || !qualifies(LUNCH[id], index, prefs);
  });
  if (stale.length === 0) return lunches;
  const fresh = planLunches(start, index, prefs);
  return { ...lunches, ...Object.fromEntries(stale.map((k) => [k, fresh[k]])) };
}

export type MealItem = { ingredient: Ingredient; deal: Deal | null };
export type Meal = { recipe: Recipe; items: MealItem[] };
export type PlannedLunch = { key: string; day: number; kind: LunchKind; lunch: Lunch | null; items: MealItem[] };

export type PromoLine = Purchase & {
  deal: Deal;
  ingredient: Ingredient;
  /** Names of the meals this product is bought for. */
  meals: string[];
};

export type Plan = {
  meals: Meal[];
  /** Lunch slots in day order; empty when no lunches were passed. */
  lunches: PlannedLunch[];
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

/** Attach this week's promotions to the chosen dinners and lunches and work out what to buy. */
export function realize(recipeIds: string[], index: DealIndex, prefs: Prefs, lunches: Lunches = {}): Plan {
  const item = (id: string): MealItem => ({ ingredient: INGREDIENT[id], deal: index.get(id)?.[0] ?? null });
  const recipes = recipeIds.map((id) => RECIPE[id]).filter(Boolean);
  const meals: Meal[] = recipes.map((recipe) => ({ recipe, items: [recipe.main, ...recipe.with].map(item) }));
  const planned: PlannedLunch[] = Object.entries(lunches).map(([key, id]) => {
    const lunch = id ? (LUNCH[id] ?? null) : null;
    return { key, day: dayOf(key), kind: kindOf(key), lunch, items: lunch ? Object.keys(lunch.amounts).map(item) : [] };
  });

  const usedIn = new Map<string, string[]>();
  const dinners = new Map<string, number>();
  for (const { recipe } of meals)
    for (const id of [recipe.main, ...recipe.with]) {
      usedIn.set(id, [...(usedIn.get(id) ?? []), recipe.name]);
      dinners.set(id, (dinners.get(id) ?? 0) + 1);
    }
  const lunchGrams = new Map<string, number>();
  for (const { kind, lunch } of planned) {
    if (!lunch) continue;
    const name = `${KIND_LABEL[kind]}: ${lunch.name}`;
    for (const [id, grams] of Object.entries(lunch.amounts)) {
      const names = usedIn.get(id) ?? [];
      if (!names.includes(name)) usedIn.set(id, [...names, name]);
      lunchGrams.set(id, (lunchGrams.get(id) ?? 0) + grams * slotPortions(kind, prefs));
    }
  }

  const promo: PromoLine[] = [];
  const regular: Plan["regular"] = [];
  const pantry: Ingredient[] = [];
  for (const [id, mealNames] of usedIn) {
    const ingredient = INGREDIENT[id];
    const deal = index.get(id)?.[0];
    if (ingredient.pantry) pantry.push(ingredient);
    else if (!deal) regular.push({ ingredient, meals: mealNames });
    else {
      const grams = ingredient.grams * portions(prefs) * (dinners.get(id) ?? 0) + (lunchGrams.get(id) ?? 0);
      const line = { deal, ingredient, meals: mealNames, ...buy(deal, grams) };
      if (line.atPromo) promo.push(line);
      else regular.push({ ingredient, meals: mealNames, line });
    }
  }
  promo.sort((a, b) => a.deal.retailer.localeCompare(b.deal.retailer) || b.saving - a.saving);
  return { meals, lunches: planned, promo, regular, pantry };
}


/**
 * Unplanned dinners each day could cook instead, using only what the shopping list already buys.
 * Offers marked "I already have it" are not bought, so they do not count. Never changes the list.
 */
export function dinnerOptions(plan: Plan, recipeIds: string[], skipped: string[], prefs: Prefs, max = 2): string[][] {
  const bought = new Set([
    ...plan.promo.filter((l) => !skipped.includes(l.deal.id)).map((l) => l.ingredient.id),
    ...plan.regular.map((l) => l.ingredient.id),
  ]);
  const needs = (r: Recipe) => [r.main, ...r.with].filter((id) => !INGREDIENT[id].pantry);
  const makeable = RECIPES.filter(
    (r) =>
      !recipeIds.includes(r.id) &&
      needs(r).every((id) => bought.has(id)) &&
      allowed(r.name, prefs) &&
      [r.main, ...r.with].every((id) => allowed(INGREDIENT[id].name, prefs)),
  );
  return recipeIds.map((id) => {
    const planned = new Set(needs(RECIPE[id]));
    const shared = (r: Recipe) => needs(r).filter((i) => planned.has(i)).length;
    // Array.sort is stable, so equal overlap keeps recipe order.
    return [...makeable].sort((a, b) => shared(b) - shared(a)).slice(0, max).map((r) => r.id);
  });
}

export type Totals = { pay: number; normal: number; saving: number; percent: number };

export function totals(lines: Purchase[]): Totals {
  const sum = (pick: (l: Purchase) => number) => Math.round(lines.reduce((t, l) => t + pick(l), 0) * 100) / 100;
  const pay = sum((l) => l.pay);
  const normal = sum((l) => l.normal);
  const saving = Math.round((normal - pay) * 100) / 100;
  return { pay, normal, saving, percent: normal > 0 ? Math.round((saving / normal) * 100) : 0 };
}

/** What the promotion lines of a week add up to, lunches included: the total the budget is held against. */
export function weekCost(recipeIds: string[], index: DealIndex, prefs: Prefs, lunches: Lunches = {}): number {
  return totals(realize(recipeIds, index, prefs, lunches).promo).pay;
}

/** A planned week, with the budget it was planned under. */
export type Week = { recipeIds: string[]; budget: number | null; overBudget: boolean };

/** Other promotion-led weeks to try before swapping single dinners. */
const BUDGET_SEEDS = 40;

/**
 * The planner's week, or with a budget the first week it finds within it. A cheaper week
 * only counts if it has no more regular-price lines than the planner's own: those cost
 * money too, but the budget cannot see them. Failing that, the cheapest week found.
 * The week's lunches are planned first and count towards the budget as they are.
 */
export function planWeek(index: DealIndex, prefs: Prefs, seed = 0, lunches: Lunches = {}): Week {
  const first = suggest(index, prefs, seed);
  const { budget } = prefs;
  if (budget === null) return { recipeIds: first, budget, overBudget: false };

  const regularLimit = realize(first, index, prefs, lunches).regular.length;
  const cost = (ids: string[]) => {
    const plan = realize(ids, index, prefs, lunches);
    return plan.regular.length > regularLimit ? Infinity : totals(plan.promo).pay;
  };

  let best = first;
  let bestCost = cost(first);
  for (let i = 1; i <= BUDGET_SEEDS && bestCost > budget; i++) {
    const ids = suggest(index, prefs, seed + i * 1000);
    const c = cost(ids);
    if (c < bestCost) [best, bestCost] = [ids, c];
  }
  // Still over: swap the one dinner that saves most, until within budget or nothing helps.
  while (bestCost > budget) {
    let next: string[] | null = null;
    let nextCost = bestCost;
    for (let position = 0; position < best.length; position++)
      for (const alt of alternatives(best, position, index, prefs)) {
        const ids = best.map((id, i) => (i === position ? alt : id));
        const c = cost(ids);
        if (c < nextCost && fitsWeek(ids, prefs)) [next, nextCost] = [ids, c];
      }
    if (!next) break;
    [best, bestCost] = [next, nextCost];
  }
  return { recipeIds: best, budget, overBudget: bestCost > budget };
}

/**
 * Keep a saved week unless it breaks the rules, or the budget changed and it is now over.
 * A week flagged over budget, or swapped by hand, stays as long as the budget does.
 */
export function keepOrPlan(week: Week, index: DealIndex, prefs: Prefs, lunches: Lunches = {}): Week {
  if (!fitsWeek(week.recipeIds, prefs)) return planWeek(index, prefs, 0, lunches);
  if (week.budget === prefs.budget) return week;
  if (prefs.budget === null || weekCost(week.recipeIds, index, prefs, lunches) <= prefs.budget)
    return { recipeIds: week.recipeIds, budget: prefs.budget, overBudget: false };
  return planWeek(index, prefs, 0, lunches);
}
