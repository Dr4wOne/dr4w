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
  getSecret: () => Promise<string>
  exempt?: (c: Context) => boolean
}): MiddlewareHandler {
  const exempt = opts.exempt ?? isHealth
  return async (c, next) => {
    if (exempt(c)) return next()
    const given = c.req.header(ORIGIN_HEADER)
    if (!given || !safeEqual(given, await opts.getSecret())) {
      return c.json({ error: 'forbidden' }, 403)
    }
    return next()
  }
}

/** Constant-time compare; hashing first makes both sides the same length. */
function safeEqual(a: string, b: string) {
  const digest = (s: string) => createHash('sha256').update(s).digest()
  return timingSafeEqual(digest(a), digest(b))
}

/**
 * `ORIGIN_SECRET` (local dev, tests) or SSM SecureString named by `ORIGIN_SECRET_PARAM`
 * (Lambda). Fetched once per cold start; a failed fetch is retried on the next request.
 */
export function originSecretFromEnv(env = process.env): () => Promise<string> {
  let cached: Promise<string> | undefined
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
  return () => {
    cached ??= load().catch((err) => {
      cached = undefined
      throw err
    })
    return cached
  }
}
