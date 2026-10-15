# echo — project notes

Counter at https://echo.dr4w.io: counts `Note.Created.v1` events published by `hello`. The worked
example of the cross-project contract (`docs/guides/connect-projects.md`).

- **Endpoints** (`api/src/app.ts`): `GET /api/health` (public) · `GET /api/count` → `{ count, lastTitle, lastAt }`.
- **Consumes:** `Note.Created.v1` from `hello` — handler in `api/src/events.ts`, subscription
  `module "from_hello"` in `infra/main.tf`. Requires `hello`'s `project.json` to expose `events` to `echo`.
- **Idempotent:** `api/src/data/counter.ts` writes `EVENT#<eventId>` (TTL 7 days) and updates the
  counter in one transaction; redeliveries are ignored.
- **Data:** table `main` (`infra/tables.json`, TTL attribute `expiresAt`); counter item `pk = "COUNTER"`, `sk = "notes-created"`.
- **Reads hello's config:** `module "hello"` (project-ref) → output `hello_api_url`.
- **UI:** `web/src/App.tsx` polls `/api/count` every 3 s.
- **Local:** `pnpm dev hello echo` — hello's `publish()` POSTs events to echo's `/api/_events`.
- **Gotcha:** notes created while echo didn't exist were never counted (no subscription yet); replay from `dr4w-bus-archive` if needed.
