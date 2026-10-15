# guestbook

Live at `https://guestbook.dr4w.io` (once `status` in `project.json` is `live`).

| Part | Path | Notes |
|---|---|---|
| API | `api/` | Hono app. Routes in `api/src/routes/`, mounted in `api/src/app.ts` |
| Web | `web/` | Vite + React SPA; `web/worker/index.ts` serves it and proxies `/api/*` |
| Infra | `infra/` | Table schema in `infra/tables.json` |

```bash
pnpm --filter guestbook dev        # web http://localhost:5175 · api http://localhost:8789
pnpm --filter "./apps/guestbook/**" test
```

Add an endpoint: `/endpoint guestbook GET /things`. Add infra: `/resource guestbook table|queue|bucket|cron|event`.
