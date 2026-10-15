# __NAME__

<What this project does, for a user, in one or two sentences.>

**Live:** https://__SUBDOMAIN__.dr4w.io · **Status:** see `project.json` · **Agent notes:** `CLAUDE.md`

## Run locally
```bash
pnpm dev __NAME__                     # web http://localhost:__WEB_PORT__ · api http://localhost:__API_PORT__
pnpm --filter "./apps/__NAME__/**" test
```

## Parts
| Part | Path |
|---|---|
| API (Hono) | `api/src/` — routes in `api/src/routes/`, mounted in `api/src/app.ts` |
| Web (React + proxy Worker) | `web/src/`, `web/worker/index.ts` |
| Infra (OpenTofu) | `infra/main.tf`, tables in `infra/tables.json` |
| Smoke test | `web/e2e/smoke.spec.ts` |

Add an endpoint: `/endpoint __NAME__ GET /api/things`. Add infra: `/resource __NAME__ table|queue|bucket|cron|event`.
