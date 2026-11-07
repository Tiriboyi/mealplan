import { describe, expect, test } from "vitest";
import { INGREDIENT } from "./ingredients";
import { LUNCH_PANTRY, LUNCHES, type LunchKind } from "./lunches";

const of = (kind: LunchKind) => LUNCHES.filter((l) => l.kinds.includes(kind));
const ids = (lunch: { amounts: Record<string, number> }) => Object.keys(lunch.amounts);

/** Dutch winter fruit and veg suitable for a morning break. */
const WINTER_SNACK = ["apples", "pears", "mandarins", "oranges", "carrots", "cucumber", "cherry_tomatoes"];
const WHOLEGRAIN = ["wholegrain_bread", "wholegrain_crackers", "sweet_potato"];
const TOPPING = ["cheese", "eggs", "peanut_butter", "hummus", "tuna", "beans", "avocado"];
const FRUIT_VEG = [...WINTER_SNACK, "tomatoes", "avocado", "pumpkin", "sweet_potato", "onions", "bell_pepper"];
const SWEET = /\b(choco\w*|hagelslag|jam|koek\w*|snoep|chips|sap|juice|limonade|caramel|candy|cake|sugar|siroop)\b/i;

describe("lunch catalogue", () => {
  test("every lunch uses known ingredients and has steps", () => {
    for (const lunch of LUNCHES) {
      expect(ids(lunch).length, lunch.id).toBeGreaterThan(0);
      for (const id of ids(lunch)) expect(INGREDIENT[id], `${lunch.id}: ${id}`).toBeDefined();
      expect(lunch.steps.length, lunch.id).toBeGreaterThan(0);
    }
    expect(new Set(LUNCHES.map((l) => l.id)).size).toBe(LUNCHES.length);
  });

  // RFC-2026-006:AC-13
  test("a lunch only assumes oil, salt and pepper or stock from the cupboard", () => {
    expect(LUNCH_PANTRY).toEqual(["oil", "salt_pepper", "stock"]);
    for (const lunch of LUNCHES)
      for (const id of ids(lunch)) if (INGREDIENT[id].pantry) expect(LUNCH_PANTRY, `${lunch.id}: ${id}`).toContain(id);
  });

  // RFC-2026-006:AC-15
  test("everything else is a supermarket product that can be matched to a promotion", () => {
    for (const lunch of LUNCHES)
      for (const id of ids(lunch)) {
        expect(id, lunch.id).not.toBe("maize_meal");
        if (!INGREDIENT[id].pantry) expect(INGREDIENT[id].match, `${lunch.id}: ${id}`).toBeDefined();
      }
  });

  // RFC-2026-006:AC-16
  test("a school snack is one portion of winter fruit or veg, with water", () => {
    expect(of("snack").length).toBeGreaterThanOrEqual(4);
    for (const snack of of("snack")) {
      expect(snack.kinds, snack.id).toEqual(["snack"]);
      expect(ids(snack), snack.id).toHaveLength(1);
      expect(WINTER_SNACK, snack.id).toContain(ids(snack)[0]);
      expect(snack.drink, snack.id).toBe("water");
      expect(snack.name, snack.id).not.toMatch(SWEET);
    }
  });

  // RFC-2026-006:AC-17
  test("a 12:30 lunchbox has a wholegrain base, a topping and fruit or veg, with water and no sweets", () => {
    expect(of("lunchbox").length).toBeGreaterThanOrEqual(5);
    for (const box of of("lunchbox")) {
      expect(box.kinds, box.id).toEqual(["lunchbox"]);
      expect(ids(box).some((id) => WHOLEGRAIN.includes(id)), `${box.id} base`).toBe(true);
      expect(ids(box).some((id) => TOPPING.includes(id)), `${box.id} topping`).toBe(true);
      expect(ids(box).some((id) => FRUIT_VEG.includes(id) && !WHOLEGRAIN.includes(id)), `${box.id} fruit or veg`).toBe(true);
      expect(box.drink, box.id).toBe("water");
      for (const text of [box.name, ...ids(box).map((id) => INGREDIENT[id].name)]) expect(text, box.id).not.toMatch(SWEET);
    }
  });

  // RFC-2026-006:AC-18
  test("snacks and lunchboxes need no reheating and at most 10 minutes", () => {
    for (const item of [...of("snack"), ...of("lunchbox")]) {
      expect(item.warm ?? false, item.id).toBe(false);
      expect(item.minutes, item.id).toBeLessThanOrEqual(10);
    }
  });

  // RFC-2026-006:AC-20
  test("at least three lunchboxes have a Zimbabwean element", () => {
    expect(of("lunchbox").filter((l) => l.shona).length).toBeGreaterThanOrEqual(3);
  });

  // RFC-2026-006:AC-21
  test("adult and family lunches mix cold, warm and Zimbabwean dishes, and no leftovers", () => {
    for (const kind of ["adult", "family"] as const) {
      const list = of(kind);
      expect(list.some((l) => !l.warm), `${kind} cold`).toBe(true);
      expect(list.some((l) => l.warm), `${kind} warm`).toBe(true);
      expect(list.filter((l) => l.shona).length, `${kind} Zimbabwean`).toBeGreaterThanOrEqual(2);
      for (const l of list) expect(l.name, l.id).not.toMatch(/left ?overs?/i);
    }
  });
});
