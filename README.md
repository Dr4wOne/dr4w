# dr4w

Personal idea-to-launch platform: one monorepo, many small projects, ~$0 idle cost.
Each project is a React SPA on a Cloudflare Worker that proxies `/api/*` to one Hono Lambda on AWS.

> Live: https://hello.dr4w.io (notes) and https://echo.dr4w.io (counts hello's notes via `dr4w-bus`).

## Requirements

Node 24 (`.nvmrc`), pnpm 12, Docker. Linux/macOS (Windows: WSL2).

## From idea to live (Claude slash commands)

```
/idea a tiny guestbook for my site     → ideas/<slug>/00-idea.md
/refine <slug>                          → ≤7 questions, keep or drop        (optional)
/spec <slug>                            → 01-spec.md (stories, endpoints, data, infra)
/plan <slug>                            → 02-tasks.md (≤1h tasks, each with a test)
/poc <slug>                             → pnpm new + implementation, pnpm dev works
/launch <slug>                          → checklist + PR; merge = deploy to <sub>.dr4w.io
/endpoint <project> POST /api/things    → route + zod schema + test
/resource <project> table|queue|bucket|cron|event
```
`pnpm ideas` shows the board. Details: `ideas/README.md`.

## 5-minute tour

```bash
pnpm install
pnpm dev hello            # or just `pnpm dev` to pick; runs fully offline
#  web  http://localhost:5173   (Vite + the real Worker in workerd)
#  api  http://localhost:8787   (same Hono app as Lambda, on Node)

pnpm new myproject        # scaffold apps/myproject from templates/project
pnpm check                # lint + typecheck + test + build (everything)
pnpm infra:check          # tofu fmt + validate for every stack (offline)
pnpm dev:cloud hello      # local API against hello's REAL AWS resources (SSO profile dr4w)
```

Deploy = merge a PR to `main`. CI plans changed projects on the PR; `deploy.yml` applies,
ships the Worker and runs the Playwright smoke test. Operations: `docs/runbook.md`.

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
| `.github/workflows` | `ci` (PR checks + plan comment), `deploy` (push to main), `platform` + `destroy` (manual) |
| `ideas/` | Idea → spec → plan docs, one folder per idea |
| `.claude/commands` | The idea-pipeline slash commands |
| `docs/` | `SPEC.md`, `architecture.md`, `tasks.md`, `bootstrap.md`, `runbook.md`, `connecting-projects.md` |

## Common tasks

| I want to… | Do |
|---|---|
| Add an endpoint | New file in `apps/<p>/api/src/routes/`, one `.route()` line in `app.ts`, a test next to it |
| Share a schema between web and api | Add it to `packages/contracts/src/<p>.ts` |
| Connect two projects | `docs/connecting-projects.md` (events via `dr4w-bus`, or `project-ref`) |
| Add infra (table, queue, bucket, cron…) | Pick from `infra/modules/README.md`, add a block to `apps/<p>/infra/main.tf` |
| Change a table key schema | Edit `apps/<p>/infra/tables.json` (local seed and OpenTofu both read it) |
