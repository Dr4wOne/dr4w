import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'
import { originSecret, originSecretFromEnv } from './origin-secret.ts'

const app = new Hono()
  .basePath('/api')
  .use(originSecret({ getSecret: async () => 's3cret' }))
  .get('/health', (c) => c.text('ok'))
  .get('/things', (c) => c.text('things'))

describe('originSecret', () => {
  it('lets health through without the header', async () => {
    expect((await app.request('/api/health')).status).toBe(200)
  })
  it('rejects a missing header', async () => {
    expect((await app.request('/api/things')).status).toBe(403)
  })
  it('rejects a wrong secret', async () => {
    const res = await app.request('/api/things', { headers: { 'x-origin-secret': 'nope' } })
    expect(res.status).toBe(403)
  })
  it('accepts the right secret', async () => {
    const res = await app.request('/api/things', { headers: { 'x-origin-secret': 's3cret' } })
    expect(res.status).toBe(200)
  })
})

describe('secret rotation', () => {
  it('accepts a rotated secret by re-reading once on mismatch', async () => {
    let current = 'old'
    const getSecret = vi.fn(async (opts?: { fresh?: boolean }) => (opts?.fresh ? current : 'old'))
    const app = new Hono().use(originSecret({ getSecret })).get('/x', (c) => c.text('ok'))
    current = 'new'
    const res = await app.request('/x', { headers: { 'x-origin-secret': 'new' } })
    expect(res.status).toBe(200)
    expect(getSecret).toHaveBeenLastCalledWith({ fresh: true })
  })

  it('rate-limits fresh reads', async () => {
    let n = 0
    const env = { ORIGIN_SECRET: 'x' }
    const get = originSecretFromEnv(env, 60_000)
    const spy = vi.spyOn(Date, 'now')
    spy.mockReturnValue(1_000_000)
    await get()
    env.ORIGIN_SECRET = `y${n++}`
    spy.mockReturnValue(1_000_000 + 1_000) // 1s later: still cached
    expect(await get({ fresh: true })).toBe('x')
    spy.mockReturnValue(1_000_000 + 61_000) // >60s later: re-read
    expect(await get({ fresh: true })).toBe('y0')
    spy.mockRestore()
  })
})

describe('originSecretFromEnv', () => {
  it('prefers ORIGIN_SECRET', async () => {
    expect(await originSecretFromEnv({ ORIGIN_SECRET: 'x' })()).toBe('x')
  })
  it('fails clearly without config, then retries', async () => {
    const get = originSecretFromEnv({})
    await expect(get()).rejects.toThrow(/ORIGIN_SECRET/)
    await expect(get()).rejects.toThrow(/ORIGIN_SECRET/)
  })
})

describe('errorHandler + validate', async () => {
  const { errorHandler, validate } = await import('./index.ts')
  const { z } = await import('zod')
  const app = new Hono()
    .post('/v', validate('json', z.object({ n: z.number() })), (c) => c.json(c.req.valid('json')))
    .get('/boom', () => {
      throw new Error('secret detail')
    })
  app.onError(errorHandler)

  it('returns 400 on invalid body', async () => {
    const res = await app.request('/v', {
      method: 'POST',
      body: '{"n":"x"}',
      headers: { 'content-type': 'application/json' },
    })
    expect(res.status).toBe(400)
  })
  it('hides internals on 500', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await app.request('/boom')
    expect(res.status).toBe(500)
    expect(await res.text()).not.toContain('secret detail')
  })
})
