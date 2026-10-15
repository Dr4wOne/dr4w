# echo

Counts the notes created in `hello`, live, from `Note.Created.v1` events on `dr4w-bus`.

**Live:** https://echo.dr4w.io · **Status:** see `project.json` · **Agent notes:** `CLAUDE.md`

## Run locally
```bash
pnpm dev hello echo                     # web http://localhost:5174 · api http://localhost:8788
pnpm --filter "./apps/echo/**" test
```

## Parts
| Part | Path |
|---|---|
| API (Hono) | `api/src/` — routes in `api/src/routes/`, mounted in `api/src/app.ts` |
| Web (React + proxy Worker) | `web/src/`, `web/worker/index.ts` |
| Infra (OpenTofu) | `infra/main.tf`, tables in `infra/tables.json` |
| Smoke test | `web/e2e/smoke.spec.ts` |

Add an endpoint: `/endpoint echo GET /api/things`. Add infra: `/resource echo table|queue|bucket|cron|event`.
