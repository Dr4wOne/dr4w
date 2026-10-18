# concept

Teaser home for the game DR4W / All Iron Hunt: play with DR4W and his gear as CSS figures, then read
the premise and the hunt.

**Before launch:** remove `<meta name="robots" content="noindex">` from `web/index.html` when Daniel says "launch".

**Live:** https://concept.dr4w.io · **Status:** see `project.json` · **Agent notes:** `CLAUDE.md`

## Run locally
```bash
pnpm dev concept                     # web http://localhost:5175 · api http://localhost:8789
pnpm --filter "./apps/concept/**" test
```

## Parts
| Part | Path |
|---|---|
| API (Hono) | `api/src/` — routes in `api/src/routes/`, mounted in `api/src/app.ts` |
| Web (React + proxy Worker) | `web/src/`, `web/worker/index.ts` |
| Infra (OpenTofu) | `infra/main.tf`, tables in `infra/tables.json` |
| Smoke test | `web/e2e/smoke.spec.ts` |

Add an endpoint: `/endpoint concept GET /api/things`. Add infra: `/resource concept table|queue|bucket|cron|event`.
