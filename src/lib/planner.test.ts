import { describe, expect, test } from "vitest";
import { allowed, isPork, isShellfish } from "./diet";
import { ingredientsFor } from "./ingredients";
import { alternatives, buildIndex, fitsWeek, keepOrPlan, planWeek, realize, suggest, totals, weekCost } from "./planner";
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
    const plan = realize(["sadza-chicken-stew"], index, { ...DEFAULT_PREFS, people: 2 });
    expect(plan.promo.map((l) => l.deal.name).sort()).toEqual([
      "Heinz Tomaten gepeld",
      "PLUS Boerentrots Kippenbout 2st",
      "Plus Boerenkool fijngesneden",
    ]);
    expect(plan.regular.map((r) => r.ingredient.id)).toEqual(["onions"]);
    expect(plan.pantry.map((i) => i.id)).toContain("maize_meal");
    expect(totals(plan.promo)).toEqual({ pay: 5.99, normal: 8.87, saving: 2.88, percent: 32 });
  });

  test("more people means more packs", () => {
    const line = (people: number) =>
      realize(["sadza-chicken-stew"], index, { ...DEFAULT_PREFS, people }).promo.find((l) => l.ingredient.id === "chicken_pieces")!;
    expect(line(2).units).toBe(1);
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
