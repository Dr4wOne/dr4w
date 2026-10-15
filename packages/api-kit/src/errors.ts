import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'
import { log } from './log.ts'

/** Use with `app.onError(errorHandler)`. Never leaks internals to the client. */
export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof HTTPException) return err.getResponse()
  if (err instanceof ZodError) return c.json({ error: 'validation', issues: err.issues }, 400)
  log('error', 'unhandled', { path: c.req.path, error: err.message, stack: err.stack })
  return c.json({ error: 'internal' }, 500)
}
