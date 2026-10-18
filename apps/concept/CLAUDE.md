# concept — project notes

<one line: what this project does> — https://concept.dr4w.io

- **Endpoints** (`api/src/app.ts`): `GET /api/health` (public) · …
- **Schemas:** `packages/contracts/src/concept.ts`
- **Data:** table `main` (`infra/tables.json`) — item patterns: …
- **Consumes / publishes events:** none yet (`api/src/events.ts`, `project.json` `uses` / `exposes`)
- **Infra:** `infra/main.tf` — `module "tables"`, `module "api"`
- **Gotchas:** …

Keep this file ≤ 30 lines and update it when endpoints, data or links change.
