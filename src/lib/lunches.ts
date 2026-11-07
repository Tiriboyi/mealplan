export type LunchKind = "snack" | "lunchbox" | "adult" | "family";

export type Lunch = {
  id: string;
  name: string;
  /** Shona name, for the dishes from home. */
  shona?: string;
  kinds: LunchKind[];
  minutes: number;
  /** Cooked or heated just before eating. */
  warm?: boolean;
  /**
   * Grams of each ingredient per portion: per kid for a snack or lunchbox, per adult for
   * an adult or family lunch (a kid at the table eats 0.6 of that).
   */
  amounts: Record<string, number>;
  drink: "water" | "milk";
  steps: string[];
};

/** The only cupboard staples a lunch may assume; everything else has to be on promotion. */
export const LUNCH_PANTRY = ["oil", "salt_pepper", "stock"];

export const KIND_LABEL: Record<LunchKind, string> = {
  snack: "School snack",
  lunchbox: "Lunchbox (12:30)",
  adult: "Lunch",
  family: "Family lunch",
};

const WATER = "A bottle of tap water.";

// School guidance (Voedingscentrum, Gezonde School): fruit or veg for the morning break,
// wholegrain bread with a modest topping and some fruit or veg for lunch, water to drink,
// no sweets, crisps or juice. Winter fruit: apples, pears, mandarins, oranges.
export const LUNCHES: Lunch[] = [
  // Morning break
  snack("snack-apple", "Apple", "apples", 130, "Wash an apple; cut it in parts if the kids prefer."),
  snack("snack-pear", "Pear", "pears", 130, "Wash a pear and pack it whole, or in parts in a box."),
  snack("snack-mandarin", "Mandarin", "mandarins", 100, "Pack one or two mandarins; easy to peel at school."),
  snack("snack-orange", "Orange segments", "oranges", 150, "Peel an orange and pack the segments in a small box."),
  snack("snack-carrots", "Carrot sticks", "carrots", 75, "Peel a carrot and cut it into sticks."),
  snack("snack-cucumber", "Cucumber sticks", "cucumber", 60, "Cut a piece of cucumber into sticks."),
  snack("snack-tomatoes", "Cherry tomatoes", "cherry_tomatoes", 60, "Wash a handful of cherry tomatoes."),

  // 12:30 lunchbox
  {
    id: "box-cheese-cucumber",
    name: "Cheese sandwich with cucumber",
    kinds: ["lunchbox"],
    minutes: 5,
    amounts: { wholegrain_bread: 70, cheese: 20, cucumber: 40 },
    drink: "water",
    steps: ["Make a sandwich of two slices of wholegrain bread with one slice of cheese.", "Cut cucumber into sticks for on the side.", WATER],
  },
  {
    id: "box-dovi-apple",
    name: "Peanut butter sandwich with apple",
    shona: "Chingwa nedovi",
    kinds: ["lunchbox"],
    minutes: 5,
    amounts: { wholegrain_bread: 70, peanut_butter: 15, apples: 65 },
    drink: "water",
    steps: ["Spread two slices of wholegrain bread thinly with peanut butter (dovi).", "Pack half an apple in slices on the side.", WATER],
  },
  {
    id: "box-egg-tomato",
    name: "Egg sandwich with cherry tomatoes",
    shona: "Chingwa nemazai",
    kinds: ["lunchbox"],
    minutes: 10,
    amounts: { wholegrain_bread: 70, eggs: 50, cherry_tomatoes: 40 },
    drink: "water",
    steps: ["Boil an egg for 8 minutes, cool it in cold water and slice it.", "Fill two slices of wholegrain bread with the egg.", "Pack a few cherry tomatoes on the side.", WATER],
  },
  {
    id: "box-hummus-carrots",
    name: "Hummus sandwich with carrot sticks",
    kinds: ["lunchbox"],
    minutes: 5,
    amounts: { wholegrain_bread: 70, hummus: 20, carrots: 50 },
    drink: "water",
    steps: ["Spread two slices of wholegrain bread with hummus.", "Cut a carrot into sticks for on the side.", WATER],
  },
  {
    id: "box-crackers-cheese",
    name: "Crackers with cheese and pear",
    kinds: ["lunchbox"],
    minutes: 5,
    amounts: { wholegrain_crackers: 25, cheese: 20, pears: 65 },
    drink: "water",
    steps: ["Pack two or three wholegrain crackers and a slice of cheese, cut in strips.", "Add half a pear in slices.", WATER],
  },
  {
    id: "box-maputi-cheese",
    name: "Cheese sandwich with maputi and cucumber",
    shona: "Maputi",
    kinds: ["lunchbox"],
    minutes: 5,
    amounts: { wholegrain_bread: 35, cheese: 15, popcorn: 10, cucumber: 40 },
    drink: "water",
    steps: ["Make one slice of wholegrain bread with cheese, folded over.", "Pack a small handful of plain popcorn (like maputi) and cucumber sticks.", WATER],
  },

  // Lunch at home: the adults on school days, everyone on Wednesdays, weekends and holidays
  {
    id: "cheese-tomato-sandwich",
    name: "Cheese and tomato sandwiches",
    kinds: ["adult", "family"],
    minutes: 5,
    amounts: { wholegrain_bread: 105, cheese: 30, tomatoes: 60 },
    drink: "water",
    steps: ["Fill wholegrain bread with cheese and slices of tomato.", "Season the tomato with a little salt and pepper."],
  },
  {
    id: "cheese-apple-sandwich",
    name: "Cheese sandwiches with apple",
    kinds: ["adult", "family"],
    minutes: 5,
    amounts: { wholegrain_bread: 105, cheese: 30, apples: 130 },
    drink: "milk",
    steps: ["Fill wholegrain bread with cheese.", "Serve with an apple each."],
  },
  {
    id: "hummus-cucumber-sandwich",
    name: "Hummus and cucumber sandwiches",
    kinds: ["adult", "family"],
    minutes: 5,
    amounts: { wholegrain_bread: 105, hummus: 30, cucumber: 60 },
    drink: "water",
    steps: ["Spread wholegrain bread with hummus.", "Top with thin slices of cucumber and a little pepper."],
  },
  {
    id: "tuna-avocado-sandwich",
    name: "Tuna and avocado sandwiches",
    kinds: ["adult", "family"],
    minutes: 10,
    amounts: { wholegrain_bread: 105, tuna: 40, avocado: 50 },
    drink: "water",
    steps: ["Drain the tuna and mash the avocado with salt and pepper.", "Spread the avocado on wholegrain bread and top with the tuna."],
  },
  {
    id: "eggs-tomato-toast",
    name: "Eggs and tomato on toast",
    shona: "Mazai nematomatisi",
    kinds: ["adult", "family"],
    minutes: 15,
    warm: true,
    amounts: { wholegrain_bread: 70, eggs: 100, tomatoes: 100, onions: 30, oil: 5, salt_pepper: 1 },
    drink: "water",
    steps: [
      "Fry chopped onion in a little oil until soft, add chopped tomato and cook for 5 minutes.",
      "Stir in beaten eggs and cook gently until just set; season.",
      "Serve on toasted wholegrain bread.",
    ],
  },
  {
    id: "beans-on-toast",
    name: "Beans in tomato on toast",
    shona: "Bhinzi nechingwa",
    kinds: ["adult", "family"],
    minutes: 15,
    warm: true,
    amounts: { wholegrain_bread: 70, beans: 120, tomatoes: 80, onions: 30, oil: 5, salt_pepper: 1 },
    drink: "water",
    steps: ["Fry chopped onion in oil, add tomato and cook down.", "Add the drained beans and heat through; season.", "Serve on toasted wholegrain bread."],
  },
  {
    id: "pumpkin-soup",
    name: "Pumpkin soup with bread",
    shona: "Muto wenhanga",
    kinds: ["adult", "family"],
    minutes: 30,
    warm: true,
    amounts: { pumpkin: 200, onions: 30, wholegrain_bread: 70, stock: 5, oil: 5 },
    drink: "water",
    steps: [
      "Fry chopped onion in oil, add the pumpkin in cubes and stock to cover.",
      "Simmer for 20 minutes until soft, then blend smooth.",
      "Serve with wholegrain bread.",
    ],
  },
  {
    id: "sweet-potato-eggs",
    name: "Sweet potatoes with eggs",
    shona: "Mbambaira nemazai",
    kinds: ["adult", "family"],
    minutes: 25,
    warm: true,
    amounts: { sweet_potato: 200, eggs: 100, salt_pepper: 1 },
    drink: "water",
    steps: ["Boil the sweet potatoes in their skins for about 20 minutes, until soft.", "Boil the eggs for 8 minutes alongside.", "Serve warm with a little salt."],
  },
];

function snack(id: string, name: string, ingredient: string, grams: number, step: string): Lunch {
  return { id, name, kinds: ["snack"], minutes: 2, amounts: { [ingredient]: grams }, drink: "water", steps: [step, WATER] };
}

export const LUNCH: Record<string, Lunch> = Object.fromEntries(LUNCHES.map((l) => [l.id, l]));
