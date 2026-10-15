# dr4w

Personal idea-to-launch platform: one monorepo, many small projects, ~$0 idle cost.
Each project is a React SPA on a Cloudflare Worker that proxies `/api/*` to one Hono Lambda on AWS.

> Status: M1 (local dev) and M2 (bootstrap + platform) done; M3 (first deploy) in review — see `docs/tasks.md`.

## Requirements

Node 24 (`.nvmrc`), pnpm 12, Docker. Linux/macOS (Windows: WSL2).

## 5-minute tour

```bash
pnpm install
pnpm dev hello            # or just `pnpm dev` to pick; runs fully offline
#  web  http://localhost:5173   (Vite + the real Worker in workerd)
#  api  http://localhost:8787   (same Hono app as Lambda, on Node)

pnpm new myproject        # scaffold apps/myproject from templates/project
pnpm check                # lint + typecheck + test + build (everything)
pnpm infra:check          # tofu fmt + validate for every stack (offline)
```

`pnpm dev` starts `dynamodb-local` (Docker, host port 8100) and creates the project's tables
from `apps/<p>/infra/tables.json`. Data is in-memory: restarting the container clears it.

## Layout

| Path | What |
|---|---|
| `apps/<p>/` | One project: `project.json`, `api/` (Hono), `web/` (Vite SPA + Worker), `infra/` |
| `packages/contracts` | zod schemas + cross-project event definitions |
| `packages/api-kit` | Hono middlewares (origin secret, errors, logging, validation), DynamoDB, `publish()` |
| `packages/web-kit` | Typed API client (`createApi`, `unwrap`) + tiny UI basics |
| `templates/project` | What `pnpm new` copies |
| `scripts/` | `new`, `dev`, `seed`, `changed`, Lambda build |
| `infra/` | OpenTofu: `bootstrap` (once, local), `platform` (shared), `modules/` (per-project building blocks) |
| `.github/workflows` | `ci` (PR checks + plan comment), `deploy` (push to main), `platform` (manual) |
| `docs/` | `SPEC.md` (requirements), `architecture.md` (how/why), `tasks.md` (progress) |

## Common tasks

| I want to… | Do |
|---|---|
| Add an endpoint | New file in `apps/<p>/api/src/routes/`, one `.route()` line in `app.ts`, a test next to it |
| Share a schema between web and api | Add it to `packages/contracts/src/<p>.ts` |
| Publish a cross-project event | Define it in `packages/contracts/src/events/`, call `publish(Def, detail)` |
| Change a table key schema | Edit `apps/<p>/infra/tables.json` (local seed and OpenTofu both read it) |
