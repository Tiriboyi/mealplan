import { describe, expect, test } from "vitest";
import { allowed, isPork, isShellfish } from "./diet";
import { INGREDIENT, ingredientsFor } from "./ingredients";
import { LUNCH, LUNCH_PANTRY, type LunchKind } from "./lunches";
import {
  alternatives,
  buildIndex,
  dinnerOptions,
  fitsWeek,
  keepLunches,
  keepOrPlan,
  KID_PORTION,
  lunchOptions,
  planLunches,
  planWeek,
  portions,
  qualifies,
  realize,
  suggest,
  totals,
  weekCost,
  type Lunches,
} from "./planner";
import { addDays, lunchSlots } from "./schoolCalendar";
import { packGrams, purchase } from "./pricing";
import { RECIPE, RECIPES } from "./recipes";
import { DEFAULT_PREFS, type Deal } from "./types";

// Product names below are real ones from Albert Heijn, Jumbo and Plus promotions.

function deal(name: string, category: string, over: Partial<Deal> = {}): Deal {
  return {
    id: name,
    name,
    retailer: "jumbo",
    category,
    price: 2,
    originalPrice: 3,
    multiBuyQty: null,
    multiBuyPrice: null,
    quantity: "400 g",
    unit: null,
    unitPrice: null,
    promoLabel: null,
    validFrom: null,
    validUntil: null,
    url: null,
    ...over,
  };
}

describe("pork", () => {
  test.each([
    "AH Bacon reepjes",
    "AH Speklapjes a la minute",
    "AH Filetlapjes à la minute naturel",
    "Jumbo Varkensschnitzel XXL 250 g",
    "Jumbo Burger Rund- en Varkensvlees 2 Stuks",
    "Jumbo Scharrelkip Burger met Spek 230 g",
    "AH Greenfields Beefburger bacon 2 stuks",
    "Jumbo Schouderkarbonade Gekruid 2 Stuks",
    "Unox Rookworst extra mager",
    "Jumbo Pittige Burger 2 Stuks",
    "Plus Gehaktballetjes Hollands",
    "Knorr Maaltijdmix Ovenpasta Ham-Kaas",
    "Mora Oven & airfryer ham-kip loempia's",
    "Plus Babi Pangang",
  ])("%s is pork", (name) => expect(isPork(name)).toBe(true));

  test.each([
    "Jumbo Classic Burger Rundvlees 2 Stuks",
    "Lezziz Hamburgers Rund 2 Stuks",
    "Jumbo Kip Cordon Bleu met Kippenham 2 Stuks",
    "Unox Rookworst kip",
    "AH Scharrel kipbraadworst 4 stuks",
    "Wahid Kipgehakt",
    "PLUS Boerentrots Kippenbout 2st",
    "AH Kogelbiefstuk",
    "AH Kabeljauwfilet",
  ])("%s is not pork", (name) => expect(isPork(name)).toBe(false));
});

describe("shellfish", () => {
  test.each([
    "Jumbo Garnalen XXL Knoflook 350 g",
    "Plus Scampi's met Knoflookmarinade",
    "AH Surimi-krab salade",
    "AH Visspecialist Kreeftenstaarten",
    "AH Ovenschotel garnalen in curry kokossaus",
  ])("%s is shellfish", (name) => expect(isShellfish(name)).toBe(true));

  test.each(["AH Kabeljauwfilet", "AH Excellent Hele zalmzijde", "AH Gerookte Atka Makreelfilet", "Princes Tonijn in water pouch"])(
    "%s is ordinary fish",
    (name) => expect(isShellfish(name)).toBe(false),
  );
});

test("custom exclusions hide matching products", () => {
  expect(allowed("AH Kabeljauwfilet", { ...DEFAULT_PREFS, exclude: ["kabeljauw"] })).toBe(false);
  expect(allowed("AH Kabeljauwfilet", { ...DEFAULT_PREFS, exclude: ["", "zalm"] })).toBe(true);
});

describe("ingredient matching", () => {
  test.each([
    ["PLUS Boerentrots Kippenbout 2st", "vlees", "chicken_pieces"],
    ["Wahid Halal kipdijfilet", "vlees", "chicken_fillet"],
    ["AH Kabeljauwfilet", "vis", "white_fish"],
    ["Jumbo Fijngesneden Boerenkool 500 g", "groente-fruit", "greens"],
    ["Heinz Tomatenblokjes met knoflook", "soepen-conserven-sauzen", "tomatoes"],
    ["Calvé Pindakaas Regular 350 g", "ontbijt", "peanut_butter"],
    ["Hak Bruine bonen", "soepen-conserven-sauzen", "beans"],
    ["Plus Basmatirijst", "pasta-rijst-wereldkeuken", "rice"],
  ])("%s is %s", (name, category, id) => expect(ingredientsFor(deal(name, category))).toContain(id));

  test.each([
    ["AH Ovenschotel kipfilet champignon room", "vlees"],
    ["AH Scharrel kipfilet gerookt", "vlees"],
    ["AH Scharrel kipfiletschnitzel Hongaars", "vlees"],
    ["Jumbo Scharrel Kipfilet 120 g", "kaas"],
    ["Vivera Plant kipfilet", "vlees"],
    ["Knorr Mix voor Macaroni XXL", "pasta-rijst-wereldkeuken"],
    ["Unox Klassieke tomatensoep", "soepen-conserven-sauzen"],
    ["Knorr Cup-a-soup tomaat", "soepen-conserven-sauzen"],
    ["AH Bloemkoolrijst kleinverpakking", "groente-fruit"],
    ["Plus Stamppot boerenkool rookworst", "groente-fruit"],
    ["Jumbo Aardappel Gratin 700 g", "groente-fruit"],
    ["Bonduelle Rode kidneybonen in chili", "soepen-conserven-sauzen"],
  ])("%s is not a cooking ingredient", (name, category) => expect(ingredientsFor(deal(name, category))).toEqual([]));
});

describe("pricing", () => {
  test("a plain discount saves the difference per unit", () => {
    expect(purchase(deal("x", "vlees", { price: 3.99, originalPrice: 4.99 }), 2)).toMatchObject({
      units: 2,
      pay: 7.98,
      normal: 9.98,
      saving: 2,
    });
  });

  test("2 voor 12 is bought in pairs", () => {
    const d = deal("x", "vlees", { price: 6, originalPrice: 6.99, multiBuyQty: 2, multiBuyPrice: 12 });
    expect(purchase(d, 2)).toEqual({ units: 2, pay: 12, normal: 13.98, saving: 1.98, atPromo: true });
    // The third is cheaper loose (6.99) than as half of another pair (12).
    expect(purchase(d, 3)).toMatchObject({ units: 3, pay: 18.99, normal: 20.97, saving: 1.98 });
  });

  test("1+1 gratis rounds one needed unit up to two, since the second is free", () => {
    const d = deal("x", "vis", { price: 1, originalPrice: 1.99, multiBuyQty: 2, multiBuyPrice: 1.99 });
    expect(purchase(d, 1)).toEqual({ units: 2, pay: 1.99, normal: 3.98, saving: 1.99, atPromo: true });
  });

  test("skips a multi-buy when one unit at shelf price is cheaper", () => {
    // 2+1 gratis onions: three bags for 1.90, but one bag is 0.95.
    const d = deal("x", "groente-fruit", { price: 0.63, originalPrice: 0.95, multiBuyQty: 3, multiBuyPrice: 1.9 });
    expect(purchase(d, 1)).toEqual({ units: 1, pay: 0.95, normal: 0.95, saving: 0, atPromo: false });
  });

  test("claims no saving without a regular price", () => {
    expect(purchase(deal("x", "vlees", { price: 6.65, originalPrice: null })).saving).toBe(0);
  });

  test.each([
    ["ca. 350 g", 350],
    ["1,5 kg", 1500],
    ["500 GRAM", 500],
    ["4 x 75 g", 300],
    ["350gr", 350],
    ["0,79 l", 790],
    ["per stuk", null],
    ["2 stuks", null],
    [null, null],
  ])("pack size of %s", (quantity, grams) => expect(packGrams(quantity)).toBe(grams));
});

describe("planning", () => {
  const deals = [
    deal("PLUS Boerentrots Kippenbout 2st", "vlees", { price: 3.99, originalPrice: 4.99, quantity: "800 g", retailer: "plus" }),
    deal("AH Kabeljauwfilet", "vis", { price: 5, originalPrice: 7, quantity: "ca. 300 g", retailer: "albert_heijn" }),
    deal("AH Excellent Wagyu ribeye", "vlees", { price: 50.62, originalPrice: 67.49, quantity: "ca. 450 g" }),
    deal("AH Speklapjes a la minute", "vlees"),
    deal("Jumbo Garnalen XXL Naturel 350 g", "vlees"),
    deal("Plus Boerenkool fijngesneden", "groente-fruit", { price: 1, originalPrice: 2.49, quantity: "500 g" }),
    deal("Heinz Tomaten gepeld", "soepen-conserven-sauzen", { price: 1, originalPrice: 1.39 }),
  ];
  const index = buildIndex(deals, DEFAULT_PREFS);

  test("pork and shellfish never reach the index", () => {
    const names = [...index.values()].flat().map((d) => d.name);
    expect(names).not.toContain("AH Speklapjes a la minute");
    expect(names).not.toContain("Jumbo Garnalen XXL Naturel 350 g");
  });

  test("plans the requested number of distinct dinners, leading with what is on promotion", () => {
    const ids = suggest(index, DEFAULT_PREFS);
    expect(new Set(ids).size).toBe(7);
    const mains = ids.map((id) => RECIPES.find((r) => r.id === id)!.main);
    expect(mains).toContain("chicken_pieces");
    expect(mains).toContain("white_fish");
    // A 50 euro steak is on promotion too, but is no way to save money.
    expect(mains).not.toContain("beef_steak");
  });

  test("the same seed gives the same week", () => {
    expect(suggest(index, DEFAULT_PREFS, 5)).toEqual(suggest(index, DEFAULT_PREFS, 5));
  });

  test("alternatives exclude meals already in the week", () => {
    const ids = suggest(index, DEFAULT_PREFS);
    const alts = alternatives(ids, 0, index, DEFAULT_PREFS);
    expect(alts.length).toBeGreaterThan(0);
    expect(alts.some((id) => ids.includes(id))).toBe(false);
  });

  const sadzaNights = (ids: string[]) => ids.filter((id) => RECIPE[id].base === "sadza").length;

  test("every week has sadza once or twice, whatever is on promotion", () => {
    // Only sadza-friendly promotions, then none at all: the rule must hold either way.
    for (const idx of [index, buildIndex([], DEFAULT_PREFS)])
      for (let seed = 0; seed < 40; seed++)
        for (const days of [2, 5, 7]) {
          const nights = sadzaNights(suggest(idx, { ...DEFAULT_PREFS, days }, seed));
          expect(nights).toBeGreaterThanOrEqual(1);
          expect(nights).toBeLessThanOrEqual(2);
        }
  });

  test("swapping a dinner keeps sadza at once or twice a week", () => {
    const ids = suggest(index, DEFAULT_PREFS);
    for (let position = 0; position < ids.length; position++)
      for (const alt of alternatives(ids, position, index, DEFAULT_PREFS)) {
        const nights = sadzaNights(ids.map((id, i) => (i === position ? alt : id)));
        expect(nights).toBeGreaterThanOrEqual(1);
        expect(nights).toBeLessThanOrEqual(2);
      }
  });

  test("a saved week with too much sadza is not kept", () => {
    const tooMuch = ["sadza-beef-stew", "sadza-chicken-stew", "oxtail", "rice-chicken-stew", "bean-stew", "macaroni-mince", "baked-salmon"];
    expect(fitsWeek(tooMuch, DEFAULT_PREFS)).toBe(false);
    expect(fitsWeek(suggest(index, DEFAULT_PREFS), DEFAULT_PREFS)).toBe(true);
  });

  test("the shopping list totals what the promotions save", () => {
    const plan = realize(["sadza-chicken-stew"], index, { ...DEFAULT_PREFS, adults: 2, kids: 0 });
    expect(plan.promo.map((l) => l.deal.name).sort()).toEqual([
      "Heinz Tomaten gepeld",
      "PLUS Boerentrots Kippenbout 2st",
      "Plus Boerenkool fijngesneden",
    ]);
    expect(plan.regular.map((r) => r.ingredient.id)).toEqual(["onions"]);
    expect(plan.pantry.map((i) => i.id)).toContain("maize_meal");
    expect(totals(plan.promo)).toEqual({ pay: 5.99, normal: 8.87, saving: 2.88, percent: 32 });
  });

  // RFC-2026-006:AC-3
  test("more people means more packs, a kid counting as 0.6 of an adult", () => {
    const line = (adults: number, kids = 0) =>
      realize(["sadza-chicken-stew"], index, { ...DEFAULT_PREFS, adults, kids }).promo.find((l) => l.ingredient.id === "chicken_pieces")!;
    expect(KID_PORTION).toBe(0.6);
    expect(portions({ ...DEFAULT_PREFS, adults: 2, kids: 2 })).toBeCloseTo(3.2);
    // 300 g a portion from an 800 g pack: 2 adults need 600 g, 2 adults and 2 kids 960 g.
    expect(line(2).units).toBe(1);
    expect(line(2, 2).units).toBe(2);
    expect(line(5).units).toBe(2);
  });

  describe("weekly budget", () => {
    const regularLines = (ids: string[], prefs = DEFAULT_PREFS) => realize(ids, index, prefs).regular.length;
    const greedy = suggest(index, DEFAULT_PREFS);

    /** The cheapest valid week one swap away from the greedy week, with no extra regular-price lines. */
    function cheaperNeighbour(): string[] {
      let best: string[] | null = null;
      for (let position = 0; position < greedy.length; position++)
        for (const alt of alternatives(greedy, position, index, DEFAULT_PREFS)) {
          const ids = greedy.map((id, i) => (i === position ? alt : id));
          if (!fitsWeek(ids, DEFAULT_PREFS) || regularLines(ids) > regularLines(greedy)) continue;
          if (!best || weekCost(ids, index, DEFAULT_PREFS) < weekCost(best, index, DEFAULT_PREFS)) best = ids;
        }
      return best!;
    }

    // RFC-2026-001:AC-1
    test("there is no budget by default", () => {
      expect(DEFAULT_PREFS.budget).toBeNull();
    });

    test("a week costs what its promotion lines add up to", () => {
      expect(weekCost(["sadza-chicken-stew"], index, DEFAULT_PREFS)).toBe(5.99);
    });

    // RFC-2026-001:AC-5
    test("without a budget the week is exactly what the planner picks today", () => {
      for (let seed = 0; seed <= 20; seed++)
        for (const days of [2, 5, 7]) {
          const prefs = { ...DEFAULT_PREFS, days };
          expect(planWeek(index, prefs, seed)).toEqual({ recipeIds: suggest(index, prefs, seed), budget: null, overBudget: false });
        }
    });

    // RFC-2026-001:AC-6
    test("finds a week within budget when one exists", () => {
      const affordable = cheaperNeighbour();
      const budget = weekCost(affordable, index, DEFAULT_PREFS);
      // The fixture must make the greedy week too expensive, or this proves nothing.
      expect(weekCost(greedy, index, DEFAULT_PREFS)).toBeGreaterThan(budget);

      const prefs = { ...DEFAULT_PREFS, budget };
      for (const seed of [0, 1, 2, 3]) {
        const week = planWeek(index, prefs, seed);
        expect(weekCost(week.recipeIds, index, prefs)).toBeLessThanOrEqual(budget);
        expect(week).toMatchObject({ budget, overBudget: false });
        expect(fitsWeek(week.recipeIds, prefs)).toBe(true);
      }
    });

    // RFC-2026-001:AC-7
    test("an impossible budget gives the cheapest week found, flagged over budget", () => {
      const prefs = { ...DEFAULT_PREFS, budget: 1 };
      for (const seed of [0, 1, 2]) {
        const week = planWeek(index, prefs, seed);
        expect(week).toMatchObject({ budget: 1, overBudget: true });
        expect(weekCost(week.recipeIds, index, prefs)).toBeLessThanOrEqual(weekCost(suggest(index, prefs, seed), index, prefs));
        expect(weekCost(week.recipeIds, index, prefs)).toBeLessThanOrEqual(weekCost(cheaperNeighbour(), index, prefs));
      }
    });

    // RFC-2026-001:AC-15
    test("a budget never buys savings by moving food to regular price", () => {
      // With no promotions at all a week "costs" €0 while every item is at regular price.
      const nothingOnOffer = suggest(buildIndex([], DEFAULT_PREFS), DEFAULT_PREFS);
      expect(weekCost(nothingOnOffer, index, DEFAULT_PREFS)).toBeLessThan(weekCost(greedy, index, DEFAULT_PREFS));
      expect(regularLines(nothingOnOffer)).toBeGreaterThan(regularLines(greedy));

      for (const budget of [0.01, 1, 10, 20, 30])
        for (let seed = 0; seed < 10; seed++)
          for (const days of [2, 5, 7]) {
            const prefs = { ...DEFAULT_PREFS, days, budget };
            const week = planWeek(index, prefs, seed);
            expect(regularLines(week.recipeIds, prefs)).toBeLessThanOrEqual(regularLines(suggest(index, prefs, seed), prefs));
          }
    });

    // RFC-2026-001:AC-14
    test("a budget keeps sadza once or twice a week and pork and shellfish out", () => {
      const sadzaDeals = [...deals, deal("AH Speklapjes a la minute", "vlees", { price: 0.5, originalPrice: 3 })];
      const idx = buildIndex(sadzaDeals, DEFAULT_PREFS);
      for (const budget of [0.01, 10, 25, 1000])
        for (let seed = 0; seed < 15; seed++)
          for (const days of [2, 5, 7]) {
            const prefs = { ...DEFAULT_PREFS, days, budget };
            const week = planWeek(idx, prefs, seed);
            const nights = sadzaNights(week.recipeIds);
            expect(nights).toBeGreaterThanOrEqual(1);
            expect(nights).toBeLessThanOrEqual(2);
            const bought = realize(week.recipeIds, idx, prefs).promo.map((l) => l.deal.name);
            expect(bought.some((n) => isPork(n) || isShellfish(n))).toBe(false);
          }
    });

    describe("keeping a saved week", () => {
      const handEdited = greedy.map((id, i) => (i === 0 ? alternatives(greedy, 0, index, DEFAULT_PREFS)[0] : id));
      const tooExpensive = weekCost(handEdited, index, DEFAULT_PREFS) - 1;

      test("a saved plan from before budgets is kept as it is", () => {
        const week = { recipeIds: handEdited, budget: null, overBudget: false };
        expect(keepOrPlan(week, index, DEFAULT_PREFS)).toBe(week);
      });

      // RFC-2026-001:AC-8
      test("a week flagged over budget is not replanned while the budget stays the same", () => {
        const prefs = { ...DEFAULT_PREFS, budget: 1 };
        const week = { recipeIds: handEdited, budget: 1, overBudget: true };
        expect(keepOrPlan(week, index, prefs)).toBe(week);
      });

      // RFC-2026-001:AC-8 — a manual swap that went over budget is not undone on reload.
      test("a hand-edited week over budget is kept while the budget stays the same", () => {
        const prefs = { ...DEFAULT_PREFS, budget: tooExpensive };
        const week = { recipeIds: handEdited, budget: tooExpensive, overBudget: false };
        expect(keepOrPlan(week, index, prefs)).toBe(week);
      });

      // RFC-2026-001:AC-9
      test("a new budget the week is over replans it", () => {
        const prefs = { ...DEFAULT_PREFS, budget: tooExpensive };
        const week = { recipeIds: handEdited, budget: null, overBudget: false };
        expect(keepOrPlan(week, index, prefs)).toEqual(planWeek(index, prefs));
      });

      // RFC-2026-001:AC-9
      test("a new budget the week already meets keeps it and remembers the budget", () => {
        const prefs = { ...DEFAULT_PREFS, budget: 1000 };
        const week = { recipeIds: handEdited, budget: null, overBudget: false };
        expect(keepOrPlan(week, index, prefs)).toEqual({ recipeIds: handEdited, budget: 1000, overBudget: false });
      });

      test("removing the budget keeps the week and clears the flag", () => {
        const week = { recipeIds: handEdited, budget: 1, overBudget: true };
        expect(keepOrPlan(week, index, DEFAULT_PREFS)).toEqual({ recipeIds: handEdited, budget: null, overBudget: false });
      });

      test("a week that breaks the sadza rule is replanned whatever the budget", () => {
        const tooMuch = ["sadza-beef-stew", "sadza-chicken-stew", "oxtail", "rice-chicken-stew", "bean-stew", "macaroni-mince", "baked-salmon"];
        const prefs = { ...DEFAULT_PREFS, budget: 1 };
        expect(keepOrPlan({ recipeIds: tooMuch, budget: 1, overBudget: true }, index, prefs)).toEqual(planWeek(index, prefs));
      });
    });
  });
});

describe("dinner options", () => {
  const deals = [
    deal("PLUS Boerentrots Kippenbout 2st", "vlees", { price: 3.99, originalPrice: 4.99, quantity: "800 g", retailer: "plus" }),
    deal("Plus Boerenkool fijngesneden", "groente-fruit", { price: 1, originalPrice: 2.49, quantity: "500 g" }),
    deal("Heinz Tomaten gepeld", "soepen-conserven-sauzen", { price: 1, originalPrice: 1.39 }),
  ];
  const index = buildIndex(deals, DEFAULT_PREFS);
  const prefsFor = (ids: string[]) => ({ ...DEFAULT_PREFS, days: ids.length });

  // Its list also makes sadza-chicken-stew, beef-cabbage and mince-greens, and nothing else.
  const week = ["sadza-beef-stew", "rice-chicken-stew", "macaroni-mince"];
  const prefs = prefsFor(week);
  const plan = realize(week, index, prefs);
  const options = dinnerOptions(plan, week, [], prefs);

  const onList = (p: typeof plan) => new Set([...p.promo, ...p.regular].map((l) => l.ingredient.id));
  const needs = (id: string) => [RECIPE[id].main, ...RECIPE[id].with].filter((i) => !INGREDIENT[i].pantry);

  test("gives one list of options per day", () => {
    expect(options).toHaveLength(week.length);
  });

  // RFC-2026-005:AC-2
  test("every option is cooked from what the list already buys, plus the cupboard", () => {
    const bought = onList(plan);
    for (const id of options.flat()) for (const i of needs(id)) expect(bought).toContain(i);
    expect(new Set(options.flat())).toEqual(new Set(["sadza-chicken-stew", "beef-cabbage", "mince-greens"]));
  });

  // RFC-2026-005:AC-3
  test("a dinner already planned is never an option", () => {
    expect(options.flat().some((id) => week.includes(id))).toBe(false);
  });

  // RFC-2026-005:AC-4
  test("an offer marked 'I already have it' does not count as bought", () => {
    const chicken = plan.promo.find((l) => l.ingredient.id === "chicken_pieces");
    expect(chicken).toBeDefined();
    const skipped = dinnerOptions(plan, week, [chicken!.deal.id], prefs).flat();
    expect(skipped).not.toContain("sadza-chicken-stew");
    expect(skipped).toContain("mince-greens");
  });

  // RFC-2026-005:AC-5
  test("working out the options leaves the shopping list and its total exactly as they were", () => {
    const before = structuredClone(plan);
    dinnerOptions(plan, week, [], prefs);
    expect(plan).toEqual(before);
    expect(realize(week, index, prefs)).toEqual(before);
    expect(totals(plan.promo)).toEqual(totals(before.promo));
  });

  // RFC-2026-005:AC-6
  test("options respect the diet settings, including excluded words", () => {
    const strict = { ...prefs, exclude: ["mince"] };
    const picked = dinnerOptions(plan, week, [], strict).flat();
    expect(picked).not.toContain("mince-greens");
    expect(picked).toContain("sadza-chicken-stew");
    for (const id of picked) {
      expect(allowed(RECIPE[id].name, strict)).toBe(true);
      for (const i of [RECIPE[id].main, ...RECIPE[id].with]) expect(allowed(INGREDIENT[i].name, strict)).toBe(true);
    }
  });

  // RFC-2026-005:AC-7
  test("each day lists at most two, sharing the most with that day's dinner first", () => {
    for (const day of options) expect(day.length).toBeLessThanOrEqual(2);
    // Macaroni and mince shares mince, tomatoes and onions with mince-greens, only two with the others.
    expect(options[2]).toEqual(["mince-greens", "sadza-chicken-stew"]);
    // Equal overlap keeps recipe order.
    expect(options[0]).toEqual(["sadza-chicken-stew", "beef-cabbage"]);
    expect(options[1]).toEqual(["sadza-chicken-stew", "beef-cabbage"]);
  });

  // RFC-2026-005:AC-8
  test("the same dinner may be offered on more than one day", () => {
    expect(options.filter((day) => day.includes("sadza-chicken-stew")).length).toBeGreaterThan(1);
  });

  // RFC-2026-005:AC-9
  test("options ignore the sadza limit and leave the planned week's sadza as it is", () => {
    const twoSadza = ["sadza-beef-stew", "mince-greens", "rice-chicken-stew"];
    const p = prefsFor(twoSadza);
    expect(fitsWeek(twoSadza, p)).toBe(true);
    const offered = dinnerOptions(realize(twoSadza, index, p), twoSadza, [], p).flat();
    expect(offered.some((id) => RECIPE[id].base === "sadza")).toBe(true);
    expect(fitsWeek(twoSadza, p)).toBe(true);
  });

  // RFC-2026-005:AC-10
  test("a list that makes nothing else gives every day an empty list", () => {
    const narrow = ["oxtail", "macaroni-mince"];
    const p = prefsFor(narrow);
    expect(dinnerOptions(realize(narrow, index, p), narrow, [], p)).toEqual([[], []]);
  });

  // RFC-2026-005:AC-14
  test("the budget planner gives the same week and cost with options worked out", () => {
    const budgeted = { ...DEFAULT_PREFS, budget: 10 };
    const before = planWeek(index, budgeted, 3);
    dinnerOptions(realize(before.recipeIds, index, budgeted), before.recipeIds, [], budgeted);
    expect(planWeek(index, budgeted, 3)).toEqual(before);
    expect(weekCost(before.recipeIds, index, budgeted)).toBe(weekCost(planWeek(index, budgeted, 3).recipeIds, index, budgeted));
  });

  // RFC-2026-005:AC-15
  test("the swap list still offers dinners the shopping list cannot make", () => {
    const swaps = alternatives(week, 0, index, prefs);
    const notMakeable = swaps.filter((id) => !options.flat().includes(id));
    expect(notMakeable.length).toBeGreaterThan(0);
  });
});

describe("lunches", () => {
  // Monday 9 November 2026: four full school days, a school Wednesday and a weekend.
  const MONDAY = "2026-11-09";
  const family = { ...DEFAULT_PREFS, adults: 2, kids: 2, days: 7 };

  const lunchDeals = [
    deal("AH Tijger volkoren heel", "brood-bakkerij", { price: 2.29, originalPrice: 2.89, quantity: "800 g", retailer: "albert_heijn" }),
    deal("MILBONA Plakken Goudse jong belegen kaas", "kaas", { price: 2.49, originalPrice: 3.29, quantity: "190 g", retailer: "lidl" }),
    deal("Elstar appels", "groente-fruit", { price: 1.99, originalPrice: 2.79, quantity: "1 kg" }),
    deal("Conference peren", "groente-fruit", { price: 1.79, originalPrice: 2.49, quantity: "1 kg" }),
    deal("Plus Mandarijnen", "groente-fruit", { price: 2.49, originalPrice: 3.49, quantity: "1 kg", retailer: "plus" }),
    deal("Biologische komkommer", "groente-fruit", { price: 0.99, originalPrice: 1.29, quantity: "1 stuk" }),
    deal("Plus Hummus naturel", "kaas", { price: 1.5, originalPrice: 2.19, quantity: "200 g", retailer: "plus" }),
    deal("The Flower Farm Pindakaas zonder palmolie", "ontbijt", { price: 3.49, originalPrice: 4.49, quantity: "350 g", retailer: "plus" }),
  ];
  const index = buildIndex(lunchDeals, family);
  const noBread = buildIndex(lunchDeals.filter((d) => d.category !== "brood-bakkerij"), family);
  const empty = buildIndex([], family);

  const kindOf = (key: string) => key.split("-")[1] as LunchKind;
  const dayOf = (key: string) => Number(key.split("-")[0]);
  const needs = (id: string) => Object.keys(LUNCH[id].amounts).filter((i) => !INGREDIENT[i].pantry);
  /** Slot keys of one kind, in day order. */
  const slotsOf = (lunches: Lunches, kind: LunchKind) =>
    Object.keys(lunches).filter((k) => kindOf(k) === kind).sort((a, b) => dayOf(a) - dayOf(b));

  test("plans every slot of every day, by its weekday", () => {
    const lunches = planLunches(MONDAY, index, family);
    const expected = Array.from({ length: 7 }, (_, day) => lunchSlots(addDays(MONDAY, day), 2).map((k) => `${day}-${k}`)).flat();
    expect(Object.keys(lunches).sort()).toEqual(expected.sort());
    expect(lunches["0-lunchbox"]).not.toBeNull();
    expect(lunches["2-family"]).not.toBeNull();
    expect(lunches["5-family"]).not.toBeNull();
    for (const [key, id] of Object.entries(lunches)) if (id) expect(LUNCH[id].kinds, key).toContain(kindOf(key));
  });

  // RFC-2026-006:AC-11
  test("a lunch is only planned when everything it needs is on promotion", () => {
    for (const idx of [index, noBread])
      for (let seed = 0; seed < 10; seed++)
        for (const id of Object.values(planLunches(MONDAY, idx, family, seed)))
          if (id) for (const i of needs(id)) expect(idx.has(i), `${id}: ${i}`).toBe(true);
    expect(qualifies(LUNCH["box-cheese-cucumber"], index, family)).toBe(true);
    expect(qualifies(LUNCH["box-cheese-cucumber"], noBread, family)).toBe(false);
  });

  // RFC-2026-006:AC-12
  test("saved lunches are kept while they qualify, and replaced when their promotion is gone", () => {
    const lunches = planLunches(MONDAY, index, family);
    expect(keepLunches(lunches, MONDAY, index, family)).toBe(lunches);

    const noApples = buildIndex(lunchDeals.filter((d) => d.name !== "Elstar appels"), family);
    const kept = keepLunches(lunches, MONDAY, noApples, family);
    expect(Object.keys(kept).sort()).toEqual(Object.keys(lunches).sort());
    for (const id of Object.values(kept)) if (id) expect(needs(id)).not.toContain("apples");
  });

  // RFC-2026-006:AC-12
  test("lunches are replanned when the household changes the slots", () => {
    const lunches = planLunches(MONDAY, index, family);
    const kept = keepLunches(lunches, MONDAY, index, { ...family, kids: 0 });
    expect(kept).not.toBe(lunches);
    expect(Object.keys(kept).some((k) => kindOf(k) === "lunchbox" || kindOf(k) === "snack")).toBe(false);
  });

  // RFC-2026-006:AC-13
  test("cupboard items never let a lunch qualify by themselves", () => {
    for (const id of Object.keys(LUNCH))
      for (const i of Object.keys(LUNCH[id].amounts)) if (INGREDIENT[i].pantry) expect(LUNCH_PANTRY).toContain(i);
  });

  // RFC-2026-006:AC-14
  test("with nothing on promotion every slot is empty rather than unavailable", () => {
    const lunches = planLunches(MONDAY, empty, family);
    expect(Object.values(lunches).every((id) => id === null)).toBe(true);
  });

  // RFC-2026-006:AC-14
  test("without bread, snacks are still planned and bread lunches are not", () => {
    const lunches = planLunches(MONDAY, noBread, family);
    for (const key of slotsOf(lunches, "snack")) expect(lunches[key]).not.toBeNull();
    for (const key of slotsOf(lunches, "lunchbox")) expect(lunches[key]).toBeNull();
  });

  // RFC-2026-006:AC-14
  test("with only one lunchbox on promotion it repeats rather than leaving days empty", () => {
    const one = buildIndex(lunchDeals.filter((d) => !/pindakaas|hummus/i.test(d.name)), family);
    const lunches = planLunches(MONDAY, one, family);
    const boxes = slotsOf(lunches, "lunchbox").map((k) => lunches[k]);
    expect(boxes).toHaveLength(4);
    expect(new Set(boxes)).toEqual(new Set(["box-cheese-cucumber"]));
  });

  // RFC-2026-006:AC-19
  test("no lunchbox or snack repeats on consecutive school days when there is a choice", () => {
    for (let seed = 0; seed < 20; seed++) {
      const lunches = planLunches(MONDAY, index, family, seed);
      for (const kind of ["snack", "lunchbox"] as const) {
        const ids = slotsOf(lunches, kind).map((k) => lunches[k]);
        for (let i = 1; i < ids.length; i++) expect(ids[i], `${kind} seed ${seed}`).not.toBe(ids[i - 1]);
      }
    }
  });

  // RFC-2026-006:AC-22
  test("quantities: snacks and lunchboxes per kid, adult lunches per adult, family lunches for everyone", () => {
    const bought = (lunches: Lunches, ingredient: string) => {
      const line = realize([], index, { ...family, days: 1 }, lunches).promo.find((l) => l.ingredient.id === ingredient)!;
      return { units: line.units, pack: packGrams(line.deal.quantity)! };
    };
    const units = (needed: number, pack: number) => Math.min(8, Math.ceil(needed / pack));

    const apple = LUNCH["snack-apple"].amounts.apples;
    const snack = bought({ "0-snack": "snack-apple" }, "apples");
    expect(snack.units).toBe(units(apple * 2, snack.pack));

    const cheese = LUNCH["cheese-apple-sandwich"].amounts.cheese;
    const adult = bought({ "0-adult": "cheese-apple-sandwich" }, "cheese");
    expect(adult.units).toBe(units(cheese * 2, adult.pack));
    const fam = bought({ "0-family": "cheese-apple-sandwich" }, "cheese");
    expect(fam.units).toBe(units(cheese * (2 + 0.6 * 2), fam.pack));
    expect(fam.units).toBeGreaterThan(adult.units);
  });

  // RFC-2026-006:AC-23
  test("every lunch ingredient is on a promotion line that names the lunch", () => {
    const lunches = planLunches(MONDAY, index, family);
    const plan = realize([], index, family, lunches);
    for (const [key, id] of Object.entries(lunches)) {
      if (!id) continue;
      for (const i of needs(id)) {
        const line = plan.promo.find((l) => l.ingredient.id === i) ?? plan.regular.find((l) => l.ingredient.id === i)?.line;
        expect(line, `${key} ${id}: ${i}`).toBeDefined();
        expect(line!.meals.some((m) => m.endsWith(LUNCH[id].name)), `${key} ${id}`).toBe(true);
      }
    }
    expect(plan.regular.filter((r) => !r.line)).toEqual([]);
    expect(plan.lunches.map((l) => l.key).sort()).toEqual(Object.keys(lunches).sort());
  });

  // RFC-2026-006:AC-24
  test("an ingredient for a dinner and a lunch is one line covering both", () => {
    const idx = buildIndex([...lunchDeals, deal("Heinz Tomaten gepeld", "soepen-conserven-sauzen", { price: 1, originalPrice: 1.39 })], family);
    const lunches: Lunches = { "0-adult": "cheese-tomato-sandwich" };
    const both = realize(["sadza-chicken-stew"], idx, { ...family, days: 1 }, lunches);
    const tomatoLines = both.promo.filter((l) => l.ingredient.id === "tomatoes");
    expect(tomatoLines).toHaveLength(1);
    expect(tomatoLines[0].meals).toEqual([RECIPE["sadza-chicken-stew"].name, `Lunch: ${LUNCH["cheese-tomato-sandwich"].name}`]);
    const dinnerOnly = realize(["sadza-chicken-stew"], idx, { ...family, days: 1 }).promo.find((l) => l.ingredient.id === "tomatoes")!;
    expect(tomatoLines[0].units).toBeGreaterThanOrEqual(dinnerOnly.units);
  });

  // RFC-2026-006:AC-25
  test("the lunch with the better promotion is planned and offered first", () => {
    const cheap = buildIndex(
      lunchDeals.map((d) => (/pindakaas/i.test(d.name) ? { ...d, price: 1, originalPrice: 4.49 } : d)),
      family,
    );
    const lunches = planLunches(MONDAY, cheap, family);
    expect(lunches["0-lunchbox"]).toBe("box-dovi-apple");
    // Day 1's planned box differs from day 0's, so the best one is offered first as a swap.
    expect(lunchOptions(lunches, "1-lunchbox", cheap, family)[0]).toBe("box-dovi-apple");
  });

  // RFC-2026-006:AC-26
  test("the budget counts lunch promotions too", () => {
    const lunches = planLunches(MONDAY, index, family);
    const dinners = suggest(index, family);
    expect(weekCost(dinners, index, family, lunches)).toBe(totals(realize(dinners, index, family, lunches).promo).pay);
    expect(weekCost(dinners, index, family, lunches)).toBeGreaterThan(weekCost(dinners, index, family));

    for (const budget of [1, 10, 30, 1000]) {
      const prefs = { ...family, budget };
      const week = planWeek(index, prefs, 0, lunches);
      expect(week.overBudget, `budget ${budget}`).toBe(weekCost(week.recipeIds, index, prefs, lunches) > budget);
    }
  });

  // RFC-2026-006:AC-27
  test("lunches respect the diet settings, including excluded words", () => {
    const strict = { ...family, exclude: ["cheese"] };
    const idx = buildIndex(lunchDeals, strict);
    for (let seed = 0; seed < 5; seed++)
      for (const id of Object.values(planLunches(MONDAY, idx, strict, seed))) {
        if (!id) continue;
        expect(allowed(LUNCH[id].name, strict), id).toBe(true);
        for (const i of Object.keys(LUNCH[id].amounts)) expect(allowed(INGREDIENT[i].name, strict), `${id}: ${i}`).toBe(true);
      }
    expect(qualifies(LUNCH["box-cheese-cucumber"], idx, strict)).toBe(false);
  });

  // RFC-2026-006:AC-31
  test("swap options are other lunches of the same kind that qualify", () => {
    const lunches = planLunches(MONDAY, index, family);
    for (const key of Object.keys(lunches)) {
      const options = lunchOptions(lunches, key, index, family);
      expect(options).not.toContain(lunches[key]);
      for (const id of options) {
        expect(LUNCH[id].kinds).toContain(kindOf(key));
        expect(qualifies(LUNCH[id], index, family)).toBe(true);
      }
    }
    expect(lunchOptions(lunches, "0-snack", index, family).length).toBeGreaterThan(0);
  });

  // RFC-2026-006:AC-35
  test("dinners are planned and listed exactly as before when there are no lunches", () => {
    const prefs = { ...DEFAULT_PREFS, adults: 2, kids: 0 };
    const dinners = suggest(index, prefs);
    expect(realize(dinners, index, prefs, {})).toEqual(realize(dinners, index, prefs));
    expect(realize(dinners, index, prefs).lunches).toEqual([]);
    expect(planWeek(index, prefs, 3, {})).toEqual(planWeek(index, prefs, 3));
    expect(weekCost(dinners, index, prefs, {})).toBe(weekCost(dinners, index, prefs));
  });
});
