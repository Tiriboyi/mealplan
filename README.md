# Mealplan

A week of dinners and a shopping list, built from what is on promotion at your Dutch supermarkets this week, with a running total of what you save against regular prices.

The recipes lean Zimbabwean (sadza, chicken and beef stews, muriwo unedovi, peanut butter rice) and by default the planner never suggests pork or shellfish. Both are settings, not assumptions.

Promotion data comes from the [PrijsProfeet API](https://www.prijsprofeet.nl/docs).

## Run it

Requires Node 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## API key

The app works without a key, on PrijsProfeet's lower per-IP rate limits. A free key raises them; request one at [prijsprofeet.nl/api](https://www.prijsprofeet.nl/api).

This repository contains no key. Bring your own, in either of two ways:

- **In the app:** Settings → PrijsProfeet API key. It is stored in your browser only and passed through the app's server to PrijsProfeet on each request.
- **On the server:** copy `.env.example` to `.env.local` and set `PRIJSPROFEET_API_KEY`. Use this when you host the app for yourself. `.env.local` is gitignored.

A key entered in the app takes priority over the server's.

## How it works

1. `GET /api/deals` downloads the food promotions for the chosen retailers and caches them for three hours.
2. Each product name is checked against the diet rules (`src/lib/diet.ts`) and matched to cooking ingredients (`src/lib/ingredients.ts`). Matching is on the Dutch product name, because retailer categories are unreliable: shrimp turn up under meat.
3. The planner (`src/lib/planner.ts`) scores every recipe by how much of it is on promotion and what the main ingredient costs, then picks a varied week. Sadza appears at least once and at most twice.
4. The shopping list works out how many packs you need for your household and prices them, including "2 voor" and "1+1 gratis" offers. When an offer makes you buy more than the meals use and one pack at shelf price is cheaper, it tells you to buy one and claims no saving.

Savings are the regular shelf price minus what you pay, for the promotion items on the list. Items you mark "Have it" are left out.

## Changing the food

- Recipes: `src/lib/recipes.ts`
- Ingredients and how Dutch product names map to them: `src/lib/ingredients.ts`
- Pork and shellfish rules: `src/lib/diet.ts`
- Sadza limits and the per-person budget for a main ingredient: constants at the top of `src/lib/planner.ts`

Everything under `src/lib` except `prijsprofeet.ts` is plain TypeScript with no browser or server dependencies, so a mobile app can reuse it.

## Tests

```bash
npm test
```

## Limits

- Dutch retailers only (`www.prijsprofeet.nl`). PrijsProfeet also serves Belgian chains from a second host.
- Prices are national and exclude personal or loyalty-card offers. Check the shelf.
- The diet rules read product names, not ingredient lists. They are cautious, but they are not an allergy or religious-compliance guarantee.

## License

MIT
