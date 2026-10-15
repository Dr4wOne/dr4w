import type { MiddlewareHandler } from 'hono'

type Level = 'debug' | 'info' | 'warn' | 'error'
const order: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 }

/**
 * One JSON object per line — CloudWatch Logs Insights can query the fields directly.
 * `LOG_LEVEL` (default `info`) drops anything below it; tests set it to `warn`.
 */
export function log(level: Level, msg: string, data: Record<string, unknown> = {}) {
  const min = (process.env.LOG_LEVEL as Level | undefined) ?? 'info'
  if (order[level] < (order[min] ?? 1)) return
  console[level](JSON.stringify({ level, msg, ...data }))
}

export const requestLogger = (): MiddlewareHandler => async (c, next) => {
  const start = performance.now()
  const requestId = c.req.header('x-request-id') ?? crypto.randomUUID()
  await next()
  c.header('x-request-id', requestId)
  log('info', 'request', {
    requestId,
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    ms: Math.round(performance.now() - start),
  })
}
