import { describe, expect, test } from "vitest";
import { FOOD_CATEGORIES, ingredientsFor } from "./ingredients";
import type { Deal } from "./types";

// Product names and categories below are real ones from the PrijsProfeet cache.

function deal(name: string, category: string): Deal {
  return {
    id: name,
    name,
    retailer: "albert_heijn",
    category,
    price: 2,
    originalPrice: 3,
    multiBuyQty: null,
    multiBuyPrice: null,
    quantity: null,
    unit: null,
    unitPrice: null,
    promoLabel: null,
    validFrom: null,
    validUntil: null,
    url: null,
  };
}

const matches = (name: string, category: string) => ingredientsFor(deal(name, category));

describe("lunch ingredients", () => {
  // RFC-2026-006:AC-28
  test("the bread, cheese, spread and snack categories are downloaded", () => {
    for (const c of ["brood-bakkerij", "kaas", "vega", "snoep-koek-chips"]) expect(FOOD_CATEGORIES).toContain(c);
  });

  // RFC-2026-006:AC-28
  test.each([
    ["AH Tijger volkoren heel", "brood-bakkerij", "wholegrain_bread"],
    ["Boeren volkoren meergranen", "brood-bakkerij", "wholegrain_bread"],
    ["AH Liefde & Passie Spelt volkoren gesneden", "brood-bakkerij", "wholegrain_bread"],
    ["Leksands Knäckebröd Original", "ontbijt", "wholegrain_crackers"],
    ["MILBONA Plakken Goudse jong belegen kaas", "kaas", "cheese"],
    ["Kroon van Holland Jong belegen kaas 48+ stuk", "kaas", "cheese"],
    ["AH Goudse jong belegen 30+ plakken", "kaas", "cheese"],
    ["Elstar appels", "groente-fruit", "apples"],
    ["Hollandse Jonagold appels", "groente-fruit", "apples"],
    ["Conference peren", "groente-fruit", "pears"],
    ["1 de Beste Handperen verpakt", "groente-fruit", "pears"],
    ["Plus Mandarijnen", "groente-fruit", "mandarins"],
    ["Bladmandarijnen", "groente-fruit", "mandarins"],
    ["1 de Beste Handsinaasappelen verpakt", "groente-fruit", "oranges"],
    ["Biologische komkommer", "groente-fruit", "cucumber"],
    ["Plus Snoepkomkommer", "groente-fruit", "cucumber"],
    ["Plus Snoeptomaten rood", "groente-fruit", "cherry_tomatoes"],
    ["Jumbo Snackgroente Tomaatjes 500 g", "groente-fruit", "cherry_tomatoes"],
    ["Plus Hummus naturel", "kaas", "hummus"],
    ["AH Terra Biologische hummus naturel", "vega", "hummus"],
  ])("%s is %s → %s", (name, category, id) => {
    expect(matches(name, category)).toContain(id);
  });

  // RFC-2026-006:AC-28
  test.each([
    ["Bakker van der Akker Bruine bollen", "brood-bakkerij"],
    ["Kelloggs Gemengde volkorengraan honey loops", "brood-bakkerij"],
    ["Desem steenoven baguette meergranen", "brood-bakkerij"],
    ["Verkade San Francisco Volkoren koekjes 261 g", "snoep-koek-chips"],
    ["Kaasfondue", "kaas"],
    ["Roomkaas", "kaas"],
    ["1 de Beste Grillworst kaas", "kaas"],
    ["Kroon van Holland Oude kaas 48+ stuk", "kaas"],
    ["Jumbo Komkommer Salade 200 g", "kaas"],
    ["Appelmoes 12-pack", "groente-fruit"],
    ["DUBBEL FRISSS Boost bosvruchten-appel", "groente-fruit"],
    ["AH Vers geperst sap appel peer framboos", "groente-fruit"],
    ["Perssinaas­appels", "groente-fruit"],
    ["Gestoofde peertjes", "groente-fruit"],
    ["Van de Boom Peer", "groente-fruit"],
    ["Dubbelfrisss Sinaasappel & mandarijn", "groente-fruit"],
    ["AH Rauwkost komkommer", "groente-fruit"],
    ["AH 80% Groentesap komkommer spinazie", "groente-fruit"],
    ["Plus Zongedroogde tomaatjes", "kaas"],
    ["Plus Luxe dip Pompoenhummus met vijg", "kaas"],
    ["Jimmy's Popcorn original sweet", "snoep-koek-chips"],
    ["JIMMY's Popcorn Salted 80 g", "snoep-koek-chips"],
    ["Lu Mini Crackers Zout", "snoep-koek-chips"],
  ])("%s is no lunch ingredient", (name, category) => {
    const lunchIds = ["wholegrain_bread", "wholegrain_crackers", "cheese", "apples", "pears", "mandarins", "oranges", "cucumber", "cherry_tomatoes", "hummus", "popcorn"];
    expect(matches(name, category).filter((id) => lunchIds.includes(id))).toEqual([]);
  });

  // RFC-2026-006:AC-28
  test("tinned tomatoes are not cherry tomatoes for a snack", () => {
    expect(matches("Heinz Tomaten gepeld", "soepen-conserven-sauzen")).not.toContain("cherry_tomatoes");
  });
});
