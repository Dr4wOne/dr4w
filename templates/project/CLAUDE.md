# __NAME__ — project notes

<one line: what this project does> — https://__SUBDOMAIN__.dr4w.io

- **Endpoints** (`api/src/app.ts`): `GET /api/health` (public) · …
- **Schemas:** `packages/contracts/src/__NAME__.ts`
- **Data:** table `main` (`infra/tables.json`) — item patterns: …
- **Consumes / publishes events:** none yet (`api/src/events.ts`, `project.json` `uses` / `exposes`)
- **Infra:** `infra/main.tf` — `module "tables"`, `module "api"`
- **Gotchas:** …

Keep this file ≤ 30 lines and update it when endpoints, data or links change.
