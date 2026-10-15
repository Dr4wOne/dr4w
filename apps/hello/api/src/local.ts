import { existsSync } from 'node:fs'

// Load .env.local before the app (and its env parsing) is imported.
if (existsSync('.env.local')) process.loadEnvFile('.env.local')

const { serve } = await import('@hono/node-server')
const { app } = await import('./app.ts')

const port = Number(process.env.PORT ?? 8787)
serve({ fetch: app.fetch, port }, () => console.info(`hello api → http://localhost:${port}/api`))
