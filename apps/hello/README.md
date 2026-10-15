# hello

Notes: create, list, edit and delete short notes. Publishes `Note.Created.v1` to `dr4w-bus`.

**Live:** https://hello.dr4w.io · **Status:** see `project.json` · **Agent notes:** `CLAUDE.md`

## Run locally
```bash
pnpm dev hello                     # web http://localhost:5173 · api http://localhost:8787
pnpm --filter "./apps/hello/**" test
```

## Parts
| Part | Path |
|---|---|
| API (Hono) | `api/src/` — routes in `api/src/routes/`, mounted in `api/src/app.ts` |
| Web (React + proxy Worker) | `web/src/`, `web/worker/index.ts` |
| Infra (OpenTofu) | `infra/main.tf`, tables in `infra/tables.json` |
| Smoke test | `web/e2e/smoke.spec.ts` |

Add an endpoint: `/endpoint hello GET /api/things`. Add infra: `/resource hello table|queue|bucket|cron|event`.
