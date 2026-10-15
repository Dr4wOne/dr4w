import { createHash, timingSafeEqual } from 'node:crypto'
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm'
import type { Context, MiddlewareHandler } from 'hono'

export const ORIGIN_HEADER = 'x-origin-secret'

const isHealth = (c: Context) => c.req.method === 'GET' && c.req.path === '/api/health'

/**
 * Rejects requests that did not come through the project's Cloudflare Worker.
 * The Worker adds `X-Origin-Secret`; direct calls to the execute-api URL get 403.
 */
export function originSecret(opts: {
  getSecret: (opts?: { fresh?: boolean }) => Promise<string>
  exempt?: (c: Context) => boolean
}): MiddlewareHandler {
  const exempt = opts.exempt ?? isHealth
  return async (c, next) => {
    if (exempt(c)) return next()
    const given = c.req.header(ORIGIN_HEADER)
    if (!given) return c.json({ error: 'forbidden' }, 403)
    // On mismatch, re-read once (rate-limited by the getter): the secret may have been rotated
    // while this warm Lambda still holds the old one.
    const ok =
      safeEqual(given, await opts.getSecret()) ||
      safeEqual(given, await opts.getSecret({ fresh: true }))
    return ok ? next() : c.json({ error: 'forbidden' }, 403)
  }
}

/** Constant-time compare; hashing first makes both sides the same length. */
function safeEqual(a: string, b: string) {
  const digest = (s: string) => createHash('sha256').update(s).digest()
  return timingSafeEqual(digest(a), digest(b))
}

/**
 * `ORIGIN_SECRET` (local dev, tests) or SSM SecureString named by `ORIGIN_SECRET_PARAM`
 * (Lambda). Cached per container; a failed fetch is retried on the next request, and
 * `{ fresh: true }` re-reads SSM at most once per `refreshIntervalMs` (rotation support).
 */
export function originSecretFromEnv(
  env = process.env,
  refreshIntervalMs = 60_000,
): (opts?: { fresh?: boolean }) => Promise<string> {
  let cached: Promise<string> | undefined
  let loadedAt = 0
  const load = async () => {
    if (env.ORIGIN_SECRET) return env.ORIGIN_SECRET
    const Name = env.ORIGIN_SECRET_PARAM
    if (!Name) throw new Error('ORIGIN_SECRET or ORIGIN_SECRET_PARAM must be set')
    const res = await new SSMClient({}).send(
      new GetParameterCommand({ Name, WithDecryption: true }),
    )
    const value = res.Parameter?.Value
    if (!value) throw new Error(`SSM parameter ${Name} is empty`)
    return value
  }
  return (opts) => {
    if (opts?.fresh && Date.now() - loadedAt >= refreshIntervalMs) cached = undefined
    if (!cached) {
      loadedAt = Date.now()
      cached = load().catch((err) => {
        cached = undefined
        throw err
      })
    }
    return cached
  }
}
