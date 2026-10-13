/** Dutch chains on www.prijsprofeet.nl, keyed by the API's `retailer` value. */
export const RETAILERS: Record<string, string> = {
  albert_heijn: "Albert Heijn",
  jumbo: "Jumbo",
  plus: "Plus",
  lidl: "Lidl",
  aldi: "Aldi",
  dirk: "Dirk",
  hoogvliet: "Hoogvliet",
  dekamarkt: "DekaMarkt",
  vomar: "Vomar",
  coop: "Coop",
  spar: "Spar",
  poiesz: "Poiesz",
  nettorama: "Nettorama",
  boni: "Boni",
  ekoplaza: "Ekoplaza",
};

export const DEFAULT_RETAILERS = ["albert_heijn", "jumbo", "plus"];

export type PromoStatus = "active" | "upcoming";
