import { errorHandler, originSecret, originSecretFromEnv, requestLogger } from '@dr4w/api-kit'
import { Hono } from 'hono'
import { entries } from './routes/entries.ts'
import { health } from './routes/health.ts'
import { stats } from './routes/stats.ts'

// New endpoint = new file in ./routes + one `.route()` line here (keeps RPC types for the web).
export const app = new Hono()
  .basePath('/api')
  .use(requestLogger())
  .use(originSecret({ getSecret: originSecretFromEnv() }))
  .route('/health', health)
  .route('/entries', entries)
  .route('/stats', stats)

app.onError(errorHandler)

export type AppType = typeof app
