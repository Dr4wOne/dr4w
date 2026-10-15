import { errorHandler, originSecret, originSecretFromEnv, requestLogger } from '@dr4w/api-kit'
import { Hono } from 'hono'
import { count } from './routes/count.ts'
import { health } from './routes/health.ts'

// New endpoint = new file in ./routes + one `.route()` line here (keeps RPC types for the web).
export const app = new Hono()
  .basePath('/api')
  .use(requestLogger())
  .use(originSecret({ getSecret: originSecretFromEnv() }))
  .route('/health', health)
  .route('/count', count)

app.onError(errorHandler)

export type AppType = typeof app
