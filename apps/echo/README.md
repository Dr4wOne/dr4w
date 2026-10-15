# echo

Live at `https://echo.dr4w.io` (once `status` in `project.json` is `live`).

| Part | Path | Notes |
|---|---|---|
| API | `api/` | Hono app. Routes in `api/src/routes/`, mounted in `api/src/app.ts` |
| Web | `web/` | Vite + React SPA; `web/worker/index.ts` serves it and proxies `/api/*` |
| Infra | `infra/` | Table schema in `infra/tables.json` |

```bash
pnpm --filter echo dev        # web http://localhost:5174 · api http://localhost:8788
pnpm --filter "./apps/echo/**" test
```

Add an endpoint: `/endpoint echo GET /things`. Add infra: `/resource echo table|queue|bucket|cron|event`.
