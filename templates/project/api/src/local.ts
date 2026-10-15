import { existsSync } from 'node:fs'

// Load .env.local before the app (and its env parsing) is imported.
if (existsSync('.env.local')) process.loadEnvFile('.env.local')

const { serve } = await import('@hono/node-server')
const { devEventsRoute } = await import('@dr4w/api-kit')
const { Hono } = await import('hono')
const { app } = await import('./app.ts')
const { events } = await import('./events.ts')

// Local only: other projects' publish() POSTs envelopes to /api/_events (see scripts/dev.ts).
const local = new Hono().route('/api/_events', devEventsRoute(events)).route('/', app)

const port = Number(process.env.PORT ?? 8787)
serve({ fetch: local.fetch, port }, () => console.info(`__NAME__ api → http://localhost:${port}/api`))
