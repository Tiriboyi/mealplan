import { norm } from "./text";
import type { Prefs } from "./types";

// Retailer categories cannot be trusted for this (Jumbo files shrimp under meat),
// so every rule works on the normalised product name.

/** Names that are pork whatever else they say. */
const PORK =
  /\b(\w*varken\w*|\w*spek|spek\w*|\w*bacon\w*|ham|\w+ham|ham(lap|blok|reep)\w*|pancetta|prosciutto|serrano|babi|pulled pork|spareribs?|casseler\w*|procureur\w*|fricandeau|filetlap\w*|(schouder|haas|rib)karbonade\w*|carbonara|half om half|hoh|erwtensoep|snert)\b/;

/** Pork-free versions of the words above, removed before testing for PORK. */
const PORK_FREE =
  /\b(kip(pen)?|kalkoen|rund(er)?|vega|vegan|vegetarische?|plantaardige?) ?(ham|bacon|spek)\b|\b(kippenham|kipham|kalkoenham)\b/g;

/** Products that are pork in a Dutch supermarket unless the name states another meat. */
const USUALLY_PORK =
  /\b(\w*worst\w*|\w*saucijs\w*|slavink\w*|frikandel\w*|shoarma\w*|gyros|chorizo|salami|cervelaat|pate|knaks?|\w*schnitzels?|cordon bleu|\w*gehakt\w*|\w*burgers?|rollade|karbonades?|blinde vink\w*|stamppot|boomstammetjes)\b/;

const OTHER_MEAT =
  /\b(\w*kip\w*|kippen\w*|chicken|rund\w*|beef\w*|kalfs?\w*|lams?\w*|kalkoen\w*|vega\w*|vegetarisch\w*|plantaardig\w*|halal|vis\w*|zalm\w*|tonijn\w*|wahid|lezziz)\b/;

const SHELLFISH =
  /\b(\w*garna(al|len)\w*|gambas?|scampi\w*|mossel\w*|inktvis\w*|calamar\w*|octopus|\w*kreeft\w*|krab\w*|surimi\w*|oesters?|coquilles?|sint jakobs\w*|kokkels?|vongole|zeevruchten|langoustines?|paella|bisque)\b/;

export function isPork(name: string): boolean {
  const n = norm(name);
  if (PORK.test(n.replace(PORK_FREE, " "))) return true;
  return USUALLY_PORK.test(n) && !OTHER_MEAT.test(n);
}

export function isShellfish(name: string): boolean {
  return SHELLFISH.test(norm(name));
}

/** Whether a product may be suggested at all under these preferences. */
export function allowed(name: string, prefs: Prefs): boolean {
  if (prefs.noPork && isPork(name)) return false;
  if (prefs.noShellfish && isShellfish(name)) return false;
  const n = norm(name);
  return !prefs.exclude.some((w) => {
    const word = norm(w);
    return word !== "" && n.includes(word);
  });
}
