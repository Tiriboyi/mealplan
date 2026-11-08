---
id: RFC-2026-007
title: "Show real store logos for Albert Heijn, Jumbo and Plus"
status: approved
type: change
requested_by: Fortune Tiriboyi
decision_owner: Fortune Tiriboyi
approved_by: Fortune Tiriboyi <tiriboyifortune@gmail.com>
approved_on: 2026-11-08
created: 2026-11-08
updated: 2026-11-08
affected_areas: [src/components/ui.tsx, src/components/ui.test.tsx, src/app/globals.css, src/app/logos/**]
---

# REQ-2026-007 - Show real store logos for Albert Heijn, Jumbo and Plus

## Request

The requester added logo files for the three default chains to `src/app/logos/` (untracked so far):

- `Albert_Heijn_Logo.svg` (vector, 1000 × 1047)
- `Jumbo_Logo.svg.png` (PNG, 960 × 269, a wide yellow wordmark)
- `plus-supermarkt-logo-png_seeklogo-277715.png` (PNG, 600 × 600, four-leaf mark with "PLUS" below)

The store badge should show these logos instead of the first letter of the store name.

## Business Reason

The badge is a coloured square with one letter ("A", "J", "P"). It is the only visual cue for which store a deal or shopping-list group belongs to. Real logos are recognised at a glance, especially on a phone in the shop.

## Current Evidence

Status: `Confirmed`

Claim type: `behaviour`

Claim: `RetailerBadge` in `src/components/ui.tsx` renders `<span class="retailer-badge {retailer}" aria-hidden="true">` with the first letter of `RETAILERS[retailer]`, or "?" for an unknown key. It is used in two places: the store list in the "This week" hero (`WeekView.tsx:68`) and the store heading on the shopping list (`ShoppingView.tsx:197`). In both places the full store name is printed as text next to the badge.

Sources: `src/components/ui.tsx:74-80`; `src/components/WeekView.tsx:68-69`; `src/components/ShoppingView.tsx:197-198`.

Last verified: 2026-11-08

Status: `Confirmed`

Claim type: `behaviour`

Claim: The badge is styled as a fixed 26 × 26 px square with a 9 px radius and a brand colour per store (`.retailer-badge.albert_heijn`, `.jumbo`, `.plus`, `.lidl`, `.aldi`, `.dirk`).

Sources: `src/app/globals.css:785-818`.

Last verified: 2026-11-08

Status: `Confirmed`

Claim type: `data`

Claim: The Jumbo file is a wordmark with a 3.6 : 1 aspect ratio. Squeezed into a 26 px square it would be about 6 px tall and unreadable. The Albert Heijn and Plus files are close to square.

Sources: `file src/app/logos/*`; opened both PNGs.

Last verified: 2026-11-08

Status: `Unclear`

Claim type: `requirement`

Claim: Whether the logo files may be committed to this **public** repository. The logos are trademarks of their chains. The Albert Heijn and Jumbo files look like Wikimedia Commons downloads (file names), and the Plus file comes from seeklogo.com, which has its own terms of use. Using a logo only to identify the store is usually acceptable, but this has not been checked. RFC-2026-003 removed a font file from this repo for a licence reason, so the requester should decide.

Sources: file names in `src/app/logos/`; RFC-2026-003.

Last verified: 2026-11-08

## Desired Outcome

Wherever the store badge appears, Albert Heijn, Jumbo and Plus show their real logo, sized so it is legible, and the layout stays intact at 360 px. Other stores keep the current letter badge.

## Acceptance Criteria

- [x] AC-1: Given the retailer is `albert_heijn`, `jumbo` or `plus`, when `RetailerBadge` renders, then it shows that store's logo image instead of the first letter.
- [x] AC-2: Given the retailer is any other known store (for example `lidl`), when `RetailerBadge` renders, then it shows the first letter of the store name as today and no image.
- [x] AC-3: Given an unknown retailer key, when `RetailerBadge` renders, then it shows "?" as today and no image.
- [x] AC-4: Given a logo badge, when it renders, then the badge is still hidden from assistive technology (the image has an empty `alt` and the badge keeps `aria-hidden="true"`), because the store name is already printed next to it.
- [x] AC-5: Given the Jumbo badge, when it renders, then it gets a wider badge that fits the wordmark (same 26 px height), so the logo is not squeezed into the square.

## Out Of Scope

- Logos for the other twelve chains in `RETAILERS`.
- Showing the badge in new places (deal lines in the recipe sheet, chips in the week view).
- Changing the store names, colours of other badges or the settings screen.
- Renaming or moving the logo files. They stay in `src/app/logos/` and are imported as static assets, so the requester's files are used as they are.

## Dependencies And Open Decisions

- **Logo rights (requester decides before approval):** commit the three files to the public repo as they are, or keep them out of git (for example `.gitignore` them and fall back to the letter when a file is missing). The default in this RFC is to commit them, used only to identify the store.
- **Badge background:** default is a white tile with the logo contained in it, in both light and dark mode, because the Jumbo wordmark and the Plus mark are drawn for a white background.
- No new dependency. Static image imports (`.svg`, `.png`) are built into Next.js, and Vite (Vitest) resolves them to URLs in tests. Check the Next 16 docs in `node_modules/next/dist/docs/` for static image imports before implementing.

## Verification Plan

- New `src/components/ui.test.tsx` (Vitest + jsdom) with one test per criterion, named `RFC-2026-007:AC-n`. Run it red first, then green.
- Full suite: `npm test`, and `npm run build` to prove the image imports resolve in Next.
- Manual check in the browser: "This week" hero and shopping list at desktop width and at 360 px, in light and dark mode. Confirm the Jumbo wordmark is readable and nothing wraps or overflows.
- `devrailsv2 check` before calling it done.

## Change History

| Date | Author | Change |
|---|---|---|
| 2026-11-08 | Fortune Tiriboyi | Created draft |
| 2026-11-08 | Claude | Filled in request, evidence, criteria and open decisions |
| 2026-11-08 | Fortune Tiriboyi <tiriboyifortune@gmail.com> | Approved |
| 2026-11-08 | Fortune Tiriboyi | Implemented — see CR-2026-007 |
