---
id: RFC-2026-003
title: Load Satoshi from Fontshare instead of self-hosting it
status: approved
type: fast-track
requested_by: Fortune Tiriboyi
decision_owner: Fortune Tiriboyi
approved_by: Fortune Tiriboyi <tiriboyifortune@gmail.com>
approved_on: 2026-10-23
created: 2026-10-23
updated: 2026-10-23
affected_areas: [src/app/layout.tsx, src/app/globals.css, src/app/fonts/**]
test_exemption: Font loading is visual configuration with no app logic. Verified by `git ls-files` (no font binaries tracked), a production build, the existing test suite and a browser check that Satoshi loads from Fontshare. No unit test can observe a rendered typeface.
---

# REQ-2026-003 - Load Satoshi from Fontshare instead of self-hosting it

## Request

This RFC records, after the fact, the typography change made before devrailsv2 was adopted (commit `acad3e6` "Added custom font", on PR #2). That commit switched the display font to Instrument Serif (Google Fonts via `next/font`) and the body font to Satoshi, self-hosted from `src/app/fonts/Satoshi-Variable.woff2`. It also restyled headings in `globals.css`.

It also fixes a licence problem in that commit. The Satoshi font file is removed from the repository, and Satoshi is loaded from Fontshare's CSS API instead.

## Business Reason

The PR gate for PR #2 fails because `acad3e6` is not covered by any RFC.

The repository is **public** (GitHub). Satoshi is licensed under the ITF Free Font License v2.0 (`src/app/fonts/Satoshi-LICENSE.txt`), which allows self-hosting for your own site but forbids making the font file available through a "repository … publicly accessible servers" (licence text, redistribution clause). Committing the `.woff2` to a public repo very likely breaches that. Fontshare's API is the delivery route the licence names, and it needs no copy of the font in the repo.

## Current Evidence

Status: `Confirmed`

Claim type: `requirement`

Claim: The PR gate (`devrailsv2 check --ci`) on PR #2 reports that RFC-2026-000 does not cover `src/app/fonts/Satoshi-LICENSE.txt`, `src/app/fonts/Satoshi-Variable.woff2`, `src/app/globals.css` and `src/app/layout.tsx`, among others. These four files come from commit `acad3e6`.

Sources: CI output pasted by the requester (2026-10-23); `git show --stat acad3e6`; `git log origin/main..origin/typography-instrument-satoshi`.

Last verified: 2026-10-23

Status: `Confirmed`

Claim type: `licence`

Claim: The ITF FFL v2.0 permits self-hosting "on your own servers or infrastructure for use on your own websites". It forbids distribution "through another font website, font library, marketplace, repository, download service … publicly accessible servers". It also offers delivery through the Fontshare API, "without the Licensee having to download or host the Font Software". The GitHub repo `Tiriboyi/mealplan` is public, and the font file is on the pushed branch `origin/typography-instrument-satoshi`.

Sources: `src/app/fonts/Satoshi-LICENSE.txt` (Notice to User and redistribution clauses); `gh repo view --json visibility` → `PUBLIC`.

Last verified: 2026-10-23

Status: `Confirmed`

Claim type: `behaviour`

Claim: `src/app/layout.tsx` loads Instrument Serif with `next/font/google` (`--font-display`) and Satoshi with `next/font/local` from `./fonts/Satoshi-Variable.woff2`, weight 300–900 (`--font-body`). `globals.css` uses `var(--font-body), sans-serif` for body text and `var(--font-display), "Playfair Display", serif` for headings. Fontshare's API (`https://api.fontshare.com/v2/css?f[]=satoshi@1&display=swap`) returns `@font-face` rules for Satoshi, served from `cdn.fontshare.com`.

Sources: `src/app/layout.tsx`; `git show acad3e6 -- src/app/globals.css`; `curl` of the Fontshare CSS API (HTTP 200, 2026-10-23).

Last verified: 2026-10-23

Status: `Unclear`

Claim type: `privacy`

Claim: Loading fonts from a third-party CDN sends each visitor's IP address to Fontshare (Indian Type Foundry). EU courts have treated this as a personal-data transfer (e.g. Google Fonts, LG München 2022). The self-hosted file did not do this. Whether this needs a privacy notice or consent depends on how the app is deployed and who uses it.

Sources: General GDPR guidance; not legal advice. The requester chose the Fontshare API on 2026-10-23 knowing it adds an external request.

Last verified: 2026-10-23

## Desired Outcome

- No Satoshi font file is tracked in the repository, so nothing the licence forbids is in it.
- Body text still renders in Satoshi (loaded from Fontshare), and headings in Instrument Serif. The look of PR #2 is unchanged.
- If Fontshare cannot be reached, text falls back to the system sans-serif and the app still works.
- PR #2's gate passes for the typography files.

## Acceptance Criteria

- [ ] AC-1: Given the branch, when `git ls-files src/app/fonts` runs, then it lists no font files (`.woff`, `.woff2`, `.ttf`, `.otf`) and no Satoshi licence file.
- [ ] AC-2: Given the app is built and opened in a browser, when the page loads, then body text uses the `Satoshi` font family, loaded from `cdn.fontshare.com`, and headings use Instrument Serif.
- [ ] AC-3: Given Fontshare is unreachable (request blocked), when the page loads, then body text renders in the system sans-serif fallback and the app works normally.
- [ ] AC-4: Given the change, when `npm run build`, `npm run typecheck` and `npm test` run, then all succeed.

## Out Of Scope

- **Removing the font file from git history.** It stays reachable in commit `acad3e6` on the public branch, and in GitHub's PR #2 refs, even after this change. Rewriting a pushed branch needs a force-push, and fully purging it may need GitHub support. That is a separate decision for the requester (see below).
- Changing the typography design itself (sizes, weights, the Instrument Serif choice).
- A privacy notice or cookie/consent banner.

## Dependencies And Open Decisions

- **New external dependency (runtime):** Fontshare CSS API and CDN (Indian Type Foundry). It is free under the ITF FFL. It adds one stylesheet request and the font requests to every first page load. No npm package is added.
- **Open (requester): history.** Should `acad3e6` be rewritten on `typography-instrument-satoshi` (force-push to the PR branch, not `main`) so the font file is not in the merged history? Squash-merging PR #2 would keep it out of `main`'s history. The branch and PR refs would still hold it until deleted or purged.
- **Open (requester): privacy.** Is the third-party font request acceptable for how Mealplan is used and deployed (see Current Evidence, `Unclear`)?
- Implementation note: load the stylesheet with a stylesheet link (plus `preconnect`) in `layout.tsx`, set `--font-body: "Satoshi", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` in `globals.css`, and drop `next/font/local`. Read `node_modules/next/dist/docs` on fonts and document head handling before writing the code (AGENTS.md).

## Verification Plan

1. `git ls-files src/app/fonts` is empty of font and licence files (AC-1).
2. `npm run build`, `npm run typecheck`, `npm test` (AC-4).
3. Browser check with `npm run start`: DevTools → computed `font-family` on body text and the `cdn.fontshare.com` font request (AC-2). Then block `*.fontshare.com` and reload to confirm the fallback (AC-3).
4. `devrailsv2 done --run-tests`, then `devrailsv2 check`.

## Change History

| Date | Author | Change |
|---|---|---|
| 2026-10-23 | Fortune Tiriboyi | Created draft |
| 2026-10-23 | Claude (for Fortune Tiriboyi) | Filled in: retroactive record of `acad3e6` plus licence fix (load Satoshi from Fontshare) |
| 2026-10-23 | Fortune Tiriboyi <tiriboyifortune@gmail.com> | Approved |
