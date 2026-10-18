---
title: Teaser home for DR4W / All Iron Hunt with a playable DR4W figure
status: live
project: concept
created: 2026-10-18
updated: 2026-10-18
---

## Goal
A one-page teaser at `concept.dr4w.io` where a stranger on a phone plays with DR4W within 10 seconds
and, within a minute, knows who he hunts and why. The DR4W figure is a reusable web component.

## Out of scope
- Accounts, forms, newsletter, wishlist, analytics, comments (CTA slot stays empty in v1).
- Any data storage: no DynamoDB table, no events.
- Sound, a language toggle (English only), chapter 5 details and the final boss's form.
- A CMS: copy lives in the code.
- Full planning material (plot with spoilers, character sheets, review reports): kept outside this public repo.

## User stories
1. **Play first.** As a phone visitor, I can operate DR4W's gear right away.
   - Given the page loads at 375 px, when I look at the first screen, then I see the name, the figure with labelled gear and one action button, without scrolling.
   - Given I tap a gear piece (antenna, arm cannon, charge, booster, eyes, blade, core), then it changes state with motion and a one-line caption is announced (`aria-live`).
   - Given I use a keyboard, when I press ← / → or Tab, then focus moves between gear; Enter / Space operates it; Esc resets all gear.
   - Given I open `/#gear-antenna`, then the antenna is selected and focused.
   - Given every gear piece is active, then "hunt mode" plays and a link to the chapters appears.
   - Given `prefers-reduced-motion: reduce`, then states change instantly (opacity only) and idle motion stops.
2. **Understand the story.** As a visitor who scrolls, I learn the premise and the hunt.
   - Given I scroll past the hero, then I read the premise and four facts (2194, 5 chapters, 5 bosses, in development).
   - Given the chapters list, then chapters 1–4 open to show a blurb and their boss; chapter 5 is locked and shows only "The hunt has a centre."
3. **See the art.** Given the art section, then I see at least four of the concept-art images, optimised (AVIF/WebP, `srcset`, ≤ 200 KB each, lazy below the fold).
4. **Fast and accessible.** Given a throttled mobile Lighthouse run, then all four scores are ≥ 95, LCP < 1.8 s, CLS < 0.05; axe finds no serious or critical issues; page JS+CSS ≤ 150 KB gz (images excluded), figure JS ≤ 15 KB gz.
5. **Not indexed before launch.** Given the page before Daniel's launch decision, then it has `<meta name="robots" content="noindex">`.

## Endpoints
- `GET /api/health` → `200 { ok: true, project: "concept" }` (public, from the template). No other endpoints.

## Data model
None. `infra/tables.json` is `{}`.

## Events
None published or consumed.

## Infra
- `project-api` only (required by the platform for the Worker's `/api/*` proxy and the health check).

## UI
One route, `/`, sections with anchors:
- **Hero:** "DR4W" set at the full width; the `<dr4w-figure>` in front of it with labelled gear; "The war ended. The hunt didn't. An action platformer in development."; button "Tune the antenna" (`#gear-antenna`).
- **Premise:** heading, one paragraph, facts row.
- **Hunt:** giant word, five chapter bars (`<details>`), chapter 5 locked.
- **Art:** a band of four images, then staggered pairs with the Argos quote.
- **Listen:** a full-width red band linking to `#gear-antenna`.
- **Footer:** the name, anchor links, font licence line.
