---
title: Teaser home for DR4W / All Iron Hunt with a playable DR4W figure
status: live
project: concept
created: 2026-10-18
updated: 2026-10-18
---

No contracts, data layer, routes or events: the spec has none beyond the template's health route.
`tables.json` keys: none (`{}`). Env vars: none (`TABLE_NAME` removed from `api/src/env.ts`).

## Tasks
- [x] **T1** `pnpm new concept` (subdomain `concept`).
  Test: `pnpm dev concept` → `curl -s localhost:<ports.web>/api/health` returns `{"ok":true,"project":"concept"}`.
- [x] **T2** Strip the table: `infra/tables.json` → `{}`, drop `TABLE_NAME` from `api/src/env.ts` and `api/.env.local`, drop the `TABLE_NAME` line in `infra/main.tf`.
  Test: `pnpm --filter concept-api test` (health route test) and `pnpm infra:check` green.
- [x] **T3** Page shell: `web/src/tokens.css` (from the art direction), self-hosted Hanken Grotesk 400/500 woff2 (latin) in `web/public/fonts/` + `OFL.txt`, `index.html` meta (title, description, `noindex`, Open Graph, favicon).
  Test: component test that `App` renders the `h1` "DR4W"; grep shows no hard-coded hex colours or durations outside `tokens.css`.
- [x] **T4** Sections with the final copy: hero, premise + facts, hunt (5 `<details>`, chapter 5 locked), art, Listen band, footer.
  Test: component test — 5 chapter summaries, chapter 5 has no boss name, every anchor (`#premise`, `#hunt`, `#art`) exists.
- [x] **T5** Images: export the chosen concept art to WebP (+ AVIF if available) at 2 widths into `web/public/art/`, `srcset`, explicit `width`/`height`, `loading="lazy"` below the fold.
  Test: script check — every file ≤ 200 KB; Playwright: no layout shift on load (CLS 0 in a trace).
- [x] **T6** (changed, see note) `<dr4w-figure>` static: custom element in `web/src/figure/` (no React), plates from `clip-path` polygons, panel lines in inline SVG; gear as `<button>`s with `data-gear` / `data-state`.
  Test: Vitest (jsdom) — the element renders 7 gear buttons with accessible names.
- [x] **T7** (changed, see note) Gear states, one piece end to end: antenna (folded → listening → transmitting → holding), CSS transitions per state, `aria-pressed`, `aria-live` caption.
  Test: Vitest — clicking the antenna cycles `data-state` and updates the live region.
- [x] **T8** (changed, see note) Remaining gear (cannon, charge, booster, eyes, blade, core) + Esc reset + hunt mode event.
  Test: Vitest — every gear reaches every state; all active → `huntmode` dispatched; Esc resets.
- [x] **T9** Keyboard + deep links + reduced motion: ← → / Tab, Enter / Space, `#gear-<id>` with `hashchange`, idle loop off under `prefers-reduced-motion`.
  Test: Playwright — keyboard run, `/#gear-antenna` focuses the antenna, reduced-motion emulation shows no running animations.
- [x] **T10** Wire the figure into the hero (React renders the tag once), "Tune the antenna" button and Listen band link to `#gear-antenna`.
  Test: Playwright smoke `web/e2e/smoke.spec.ts` — health OK, `h1` visible, antenna button operable.
- [x] **T11** Budgets: build, then measure page JS+CSS gz ≤ 150 KB, figure JS ≤ 15 KB, figure CSS ≤ 20 KB.
  Test: a small size check in `web/e2e/` or a Vitest that reads `dist/` sizes; numbers logged in the PR.
- [ ] **T12** QA: axe (Playwright), Lighthouse mobile, screenshots at 375 / 768 / 1440.
  Test: 0 serious/critical axe issues; Lighthouse ≥ 95 ×4. (`@axe-core/playwright` and `@lhci/cli` added to the `catalog:` only if not avoidable; versions per `docs/stack.md`.)

**Note (2026-10-18):** after the first build, the plate-drawn figure was replaced by Daniel's
cel-shaded DR4W art (from the character sheet) with three operable hotspots: antenna, core, arm
cannon. A rigged, fully operable figure is a later art phase. T11 numbers: page JS+CSS+HTML 76 KB gz
(+35 KB font), figure JS ≈ 2 KB gz, figure CSS ≈ 1.5 KB gz.

Done = `pnpm check` + `pnpm infra:check` green, `pnpm dev concept` works.
