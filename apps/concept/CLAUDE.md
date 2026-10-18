# concept — project notes

Teaser home for DR4W / All Iron Hunt: a collection of playable CSS figures plus the story — https://concept.dr4w.io

- **Endpoints** (`api/src/app.ts`): `GET /api/health` (public) only. No data, no events (`infra/tables.json` is `{}`).
- **Web:** React page `web/src/App.tsx`; copy in `web/src/content.ts` (English only, public, no chapter-5 spoilers).
- **Figures** (`web/src/figure/`): custom elements, no framework. `<dr4w-rig>` (Fig. 01, state machine in
  `dr4w-rig.ts`, poses in `rig.css`), devices on `device.ts` (`<dr4w-cannon>`, `<dr4w-tube>`), switched by
  `web/src/Collection.tsx` (`#fig-<id>`, `[` `]` / PageUp / PageDown).
- **Generated:** `rig.generated.{ts,css}` come from the measured rig (character-sheet mask + pivots), kept
  outside this repo. Do not hand-edit; ask Daniel for a regenerate.
- **Tokens:** every colour and duration lives in `web/src/tokens.css` (a test enforces it).
- **Infra:** `infra/main.tf` — `module "api"` only (`module "tables"` iterates an empty map).

## Rules for this project
- Characters, art and code are original. Colorfigures (April Zhu) is a pattern reference only: no code,
  art, paths or text copied.
- The reference art folder is read-only; only the curated images in `web/public/art/` are public (D17).
- Animate only `transform`, `opacity` and `filter`; every motion has a reduced-motion version.
- Budgets: page ≤ 220 KB gz excluding images; figure CSS ≤ 45 KB gz; figure JS ≤ 20 KB gz.
- Outside judges, not self-grading: IoU/screenshot scripts, Playwright, axe, Lighthouse, fresh reviewers.
- Never push, deploy or change DNS without Daniel's explicit "launch".
