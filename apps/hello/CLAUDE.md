# hello — project notes

Notes app at https://hello.dr4w.io. The reference project: most guides use it as the example.

- **Endpoints** (`api/src/app.ts`): `GET /api/health` (public) · `GET|POST /api/notes` ·
  `GET|PATCH|DELETE /api/notes/:id` (`api/src/routes/notes.ts`).
- **Schemas:** `packages/contracts/src/hello.ts` (`Note`, `CreateNote`, `UpdateNote`).
- **Data:** table `main` (`infra/tables.json`), items `pk = "NOTE"`, `sk = <id>`; access in `api/src/data/notes.ts`.
  Listing sorts in memory — fine for small lists; add a GSI if it grows.
- **Publishes:** `Note.Created.v1` on create (`packages/contracts/src/events/hello.ts`), `publishes_events = true` in `infra/main.tf`.
- **Exposes:** `events` to `echo` (`project.json`). Consumes: nothing.
- **Infra:** `infra/main.tf` — `module "tables"`, `module "api"`.
- **UI:** `web/src/App.tsx` (list, create, delete). Smoke: `web/e2e/smoke.spec.ts` creates and deletes a real note.
- **Gotcha:** changing `packages/contracts` redeploys hello (its bundle includes the index).
