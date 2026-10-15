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
