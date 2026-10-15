# __NAME__

Live at `https://__SUBDOMAIN__.dr4w.io` (once `status` in `project.json` is `live`).

| Part | Path | Notes |
|---|---|---|
| API | `api/` | Hono app. Routes in `api/src/routes/`, mounted in `api/src/app.ts` |
| Web | `web/` | Vite + React SPA; `web/worker/index.ts` serves it and proxies `/api/*` |
| Infra | `infra/` | Table schema in `infra/tables.json` |

```bash
pnpm --filter __NAME__ dev        # web http://localhost:__WEB_PORT__ · api http://localhost:__API_PORT__
pnpm --filter "./apps/__NAME__/**" test
```

Add an endpoint: `/endpoint __NAME__ GET /things`. Add infra: `/resource __NAME__ table|queue|bucket|cron|event`.
