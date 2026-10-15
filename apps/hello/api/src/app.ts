import { errorHandler, originSecret, originSecretFromEnv, requestLogger } from '@dr4w/api-kit'
import { Hono } from 'hono'
import { health } from './routes/health.ts'
import { notes } from './routes/notes.ts'

// New endpoint = new file in ./routes + one `.route()` line here (keeps RPC types for the web).
export const app = new Hono()
  .basePath('/api')
  .use(requestLogger())
  .use(originSecret({ getSecret: originSecretFromEnv() }))
  .route('/health', health)
  .route('/notes', notes)

app.onError(errorHandler)

export type AppType = typeof app
