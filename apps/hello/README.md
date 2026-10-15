# hello

Live at `https://hello.dr4w.io` (once `status` in `project.json` is `live`).

| Part | Path | Notes |
|---|---|---|
| API | `api/` | Hono app. Routes in `api/src/routes/`, mounted in `api/src/app.ts` |
| Web | `web/` | Vite + React SPA; `web/worker/index.ts` serves it and proxies `/api/*` |
| Infra | `infra/` | Table schema in `infra/tables.json` |

```bash
pnpm --filter hello dev        # web http://localhost:5173 · api http://localhost:8787
pnpm --filter "./apps/hello/**" test
```

Add an endpoint: `/endpoint hello GET /things`. Add infra: `/resource hello table|queue|bucket|cron|event`.
