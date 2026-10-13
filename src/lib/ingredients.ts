import { norm } from "./text";
import type { Deal } from "./types";

// PrijsProfeet unified category slugs.
const MEAT = "vlees";
const FISH = "vis";
const VEG = "groente-fruit";
const DRY = "pasta-rijst-wereldkeuken";
const CANS = "soepen-conserven-sauzen";
const DAIRY = "zuivel-eieren";
const FROZEN = "diepvries";
const SPREADS = "ontbijt";

/** Categories worth downloading: everything an ingredient below can live in. */
export const FOOD_CATEGORIES = [MEAT, FISH, VEG, DRY, CANS, DAIRY, FROZEN, SPREADS];

export type Ingredient = {
  id: string;
  name: string;
  /** What to look for on a Dutch shelf when it is not on promotion. */
  nl: string;
  /** Rough amount per person per meal, used to decide how many packs to buy. */
  grams: number;
  /** Assumed to be in the cupboard: never matched to a promotion. */
  pantry?: boolean;
  match?: {
    any: RegExp;
    not?: RegExp;
    categories: string[];
    /** Set for tins and jars, where the ready-made filter would reject real ingredients. */
    allowPrepared?: boolean;
  };
};

// Ready meals, deli items and meat substitutes that mention an ingredient
// ("Ovenschotel kipfilet", "Knorr Mix voor macaroni") but are not that ingredient.
const PREPARED =
  /\b(oven|ovenschotel|ovengroente|roerbakgroente|wokgroente|soepgroente\w*|soup|\w*salade|\w*maaltijd\w*|\w*soep\w*|stamp?pot|verspakket|kant en klaar|uit de keuken van|pizza\w*|quiche|\w*kroket\w*|\w*croquet\w*|bitterbal\w*|loempia\w*|gyoza|bapao|noodles|wraps?|spread|dip|\w*smoothie|\w*sap|shot|plant|plantaardige?|vega|vegan|vegetarische?|gerookte?|plakjes|\w*rolletjes?|\w*spies\w*|\w*schnitzels?|\w*burgers?|\w*nuggets?|cordon|krokante?|gepaneerde?|geroosterde?|gebraden|\w*flakes|doner|kebab|tenders|mix voor|maaltijdmix|kruidenmix|bakplaat|basis voor|\w*saus|ragout|goulash|hachee|zuurvlees|stoofpot|bolognese|\w*gratin|hasselback|kruidenboter|puree|\w*wafels|\w*pap|drink|drinkbouillon|olvarit)\b/;

const INGREDIENTS: Ingredient[] = [
  // Proteins
  {
    id: "chicken_pieces",
    name: "Chicken pieces (bone-in)",
    nl: "kippenbouten / drumsticks",
    grams: 300,
    match: {
      any: /\b(kippenbout\w*|kippenpoot\w*|kippenpoten|kippoot\w*|\w*drumsticks?|kippendij(en)?|kipkluif\w*|kip(pen)?vleugel\w*|hele kip|braadkip|kip(pen)?karbonade\w*|kippenbil\w*)\b/,
      categories: [MEAT, FROZEN],
    },
  },
  {
    id: "chicken_fillet",
    name: "Chicken fillet",
    nl: "kipfilet / kipdijfilet",
    grams: 175,
    match: {
      any: /\b(kipfilet\w*|kip(pen)?dijfilet\w*|kiphaasjes|kipreepjes|kipblokjes)\b/,
      categories: [MEAT, FROZEN],
    },
  },
  {
    id: "chicken_mince",
    name: "Chicken mince",
    nl: "kipgehakt",
    grams: 150,
    match: { any: /\bkipgehakt\b/, categories: [MEAT, FROZEN] },
  },
  {
    id: "beef_stew",
    name: "Stewing beef",
    nl: "runderlappen / sukadelappen",
    grams: 200,
    match: {
      any: /\b(runderlap\w*|riblap\w*|\w*sukade\w*|\w*stooflap\w*|runderpoulet|hacheevlees|soepvlees|\w*schenkel|rundvlees ?blokjes|runderreepjes)\b/,
      categories: [MEAT, FROZEN],
    },
  },
  {
    id: "oxtail",
    name: "Oxtail",
    nl: "ossenstaart",
    grams: 300,
    match: { any: /\bossenstaart\b/, categories: [MEAT, FROZEN] },
  },
  {
    id: "beef_mince",
    name: "Beef mince",
    nl: "rundergehakt",
    grams: 150,
    match: {
      any: /\b(rundergehakt|rundgehakt|gehakt rund|runder gehakt|rundertartaar\w*)\b/,
      categories: [MEAT, FROZEN],
    },
  },
  {
    id: "beef_steak",
    name: "Beef steak",
    nl: "biefstuk",
    grams: 175,
    match: {
      any: /\b(\w*biefstuk\w*|bavette|entrecote|ribeye|picanha|rumpsteak|bieflap\w*|tritip|ossenhaas)\b/,
      categories: [MEAT, FROZEN],
    },
  },
  {
    id: "beef_sausage",
    name: "Beef or chicken sausage",
    nl: "runderworst / kipbraadworst",
    grams: 150,
    match: {
      any: /\b(boerewors|runderworst\w*|runderbraadworst\w*|rundersaucijs\w*|kipbraadworst\w*|kipsaucijs\w*|kipmerguez|merguez|kipchipolata|runderchipolata)\b/,
      categories: [MEAT, FROZEN],
    },
  },
  {
    id: "lamb",
    name: "Lamb",
    nl: "lamsvlees",
    grams: 200,
    match: { any: /\blams\w*\b/, categories: [MEAT, FROZEN] },
  },
  {
    id: "white_fish",
    name: "White fish fillet",
    nl: "kabeljauw / koolvis / tilapia",
    grams: 150,
    match: {
      any: /\b(kabeljauw\w*|koolvis\w*|tilapia\w*|pangasius\w*|heek\w*|schelvis\w*|victoriabaars\w*|wijting\w*|schol|scholfilet\w*|dorade\w*|zeebaars\w*|zeebrasem\w*|witvis\w*)\b/,
      categories: [FISH, FROZEN, MEAT],
    },
  },
  {
    id: "oily_fish",
    name: "Salmon, trout or mackerel",
    nl: "zalm / forel / makreel",
    grams: 150,
    match: { any: /\b(zalm\w*|forel\w*|makreel\w*)\b/, categories: [FISH, FROZEN, MEAT] },
  },
  {
    id: "tinned_fish",
    name: "Tinned pilchards or sardines",
    nl: "sardines / makreel in tomatensaus (blik)",
    grams: 100,
    match: {
      any: /\b(sardines?|sardientjes|pilchards?|makreel\w* in tomatensaus)\b/,
      not: /\b(\w*salade|pizza\w*|dip)\b/,
      categories: [CANS, FISH],
      allowPrepared: true,
    },
  },
  {
    id: "tuna",
    name: "Tinned tuna",
    nl: "tonijn (blik)",
    grams: 80,
    match: {
      any: /\btonijn\w*\b/,
      not: /\b(\w*salade|pizza\w*|pasta|dip|wraps?|sandwich\w*)\b/,
      categories: [CANS, FISH],
      allowPrepared: true,
    },
  },
  {
    id: "eggs",
    name: "Eggs",
    nl: "eieren",
    grams: 120,
    match: { any: /\b\w*eieren\b/, not: /\bgevulde\b/, categories: [DAIRY] },
  },
  {
    id: "beans",
    name: "Beans (sugar beans style)",
    nl: "bruine bonen / kidneybonen",
    grams: 130,
    match: {
      any: /\b(bruine bonen|kidneybonen|witte bonen|zwarte bonen|bonenmix|gemengde bonen|cannellini bonen|reuzenbonen|borlotti\w*)\b/,
      not: /\b(chili|\w*saus|\w*schotel|\w*soep\w*)\b/,
      categories: [CANS],
      allowPrepared: true,
    },
  },

  // Vegetables
  {
    id: "greens",
    name: "Leafy greens (muriwo)",
    nl: "boerenkool / spinazie / paksoi",
    grams: 125,
    match: {
      any: /\b(boerenkool|spinazie|paksoi|snijbiet|andijvie|palmkool|cavolo nero|raapstelen)\b/,
      categories: [VEG, FROZEN],
    },
  },
  {
    id: "cabbage",
    name: "Cabbage",
    nl: "spitskool / witte kool",
    grams: 125,
    match: { any: /\b(spitskool|witte kool|wittekool|savooiekool|groene kool)\b/, categories: [VEG] },
  },
  {
    id: "pumpkin",
    name: "Butternut",
    nl: "flespompoen",
    grams: 175,
    match: { any: /\b(flespompoen|pompoen|butternut)\b/, categories: [VEG] },
  },
  {
    id: "potatoes",
    name: "Potatoes",
    nl: "aardappelen",
    grams: 200,
    match: { any: /\b(aardappel(en|s)?|krieltjes|kriel)\b/, not: /\bzoete\b/, categories: [VEG] },
  },
  {
    id: "sweet_potato",
    name: "Sweet potatoes (mbambaira)",
    nl: "zoete aardappelen",
    grams: 200,
    match: { any: /\b(zoete aardappel(en)?|bataat)\b/, categories: [VEG] },
  },
  {
    id: "green_beans",
    name: "Green beans",
    nl: "sperziebonen",
    grams: 100,
    match: { any: /\b(sperziebonen|snijbonen|boontjes|haricots verts)\b/, categories: [VEG, FROZEN] },
  },
  {
    id: "carrots",
    name: "Carrots",
    nl: "wortelen",
    grams: 75,
    match: {
      any: /\b(wortel(en|tjes)?|waspeen|bospeen|winterpeen|snackworteltjes)\b/,
      not: /\b(bloemkool|broccoli|erwt\w*)\b/,
      categories: [VEG],
    },
  },
  {
    id: "broccoli",
    name: "Broccoli or cauliflower",
    nl: "broccoli / bloemkool",
    grams: 125,
    match: { any: /\b(\w*broccoli\w*|\w*bloemkool\w*)\b/, not: /rijst/, categories: [VEG, FROZEN] },
  },
  {
    id: "bell_pepper",
    name: "Bell pepper",
    nl: "paprika",
    grams: 50,
    match: { any: /\b(\w*paprika|paprikas)\b/, not: /\b(\w*saucijs\w*|chips)\b/, categories: [VEG] },
  },
  {
    id: "avocado",
    name: "Avocado",
    nl: "avocado",
    grams: 75,
    match: { any: /\bavocados?\b/, categories: [VEG] },
  },
  {
    id: "tomatoes",
    name: "Tomatoes (fresh or tinned)",
    nl: "tomaten / tomatenblokjes",
    grams: 125,
    match: {
      any: /\b(tomaten|tomaat|trostomaten|tomatenblokjes|tomatenpulp|passata|polpa|snoeptomaten|tomaatjes|cherrytomaten|romatomaten)\b/,
      not: /\b(ketchup|\w*tapenade|halfgedroogde?|zongedroogde?|frito|concentraat|mozzarella|pasta|chili)\b/,
      categories: [VEG, CANS],
    },
  },
  {
    id: "onions",
    name: "Onions",
    nl: "uien",
    grams: 60,
    match: { any: /\b(uien|ui|sjalotten)\b/, not: /\b(\w*aardappel\w*|mihoen)\b/, categories: [VEG] },
  },

  // Starches and cupboard items that do go on promotion
  {
    id: "rice",
    name: "Rice",
    nl: "rijst",
    grams: 80,
    match: {
      any: /\b\w*rijst\b/,
      not: /\b(bloemkoolrijst|gele rijst|nasi|bami)\b/,
      categories: [DRY],
    },
  },
  {
    id: "macaroni",
    name: "Macaroni",
    nl: "macaroni",
    grams: 90,
    match: { any: /\bmacaroni\b/, not: /\b(carbonara|cheese)\b/, categories: [DRY] },
  },
  {
    id: "spaghetti",
    name: "Spaghetti",
    nl: "spaghetti",
    grams: 90,
    match: { any: /\b(spaghetti|spaghettini)\b/, categories: [DRY] },
  },
  {
    id: "peanut_butter",
    name: "Peanut butter (dovi)",
    nl: "pindakaas",
    grams: 30,
    match: { any: /\bpindakaas\b/, not: /\b(light|bewust)\b/, categories: [SPREADS], allowPrepared: true },
  },

  // Cupboard
  { id: "maize_meal", name: "Maize meal (hupfu)", nl: "maismeel, at a toko or the world-food aisle", grams: 125, pantry: true },
  { id: "oil", name: "Cooking oil", nl: "zonnebloemolie", grams: 15, pantry: true },
  { id: "stock", name: "Stock cubes", nl: "bouillonblokjes", grams: 5, pantry: true },
  { id: "curry_powder", name: "Curry powder", nl: "kerriepoeder", grams: 3, pantry: true },
  { id: "garlic_ginger", name: "Garlic and ginger", nl: "knoflook en gember", grams: 10, pantry: true },
  { id: "salt_pepper", name: "Salt and pepper", nl: "zout en peper", grams: 2, pantry: true },
];

export const INGREDIENT: Record<string, Ingredient> = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

/** Ids of the ingredients this promotion can serve as. */
export function ingredientsFor(deal: Deal): string[] {
  const n = norm(deal.name);
  const prepared = PREPARED.test(n);
  return INGREDIENTS.filter(({ match: m }) => {
    if (!m || !deal.category || !m.categories.includes(deal.category)) return false;
    if (prepared && !m.allowPrepared) return false;
    return m.any.test(n) && !m.not?.test(n);
  }).map((i) => i.id);
}
