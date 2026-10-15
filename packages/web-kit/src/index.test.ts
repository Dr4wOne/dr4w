import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { ApiError, createApi, unwrap } from './index.ts'

const app = new Hono()
  .get('/api/ok', (c) => c.json({ hello: 'world' }, 200))
  .get('/api/missing', (c) => c.json({ error: 'not_found' }, 404))

const api = createApi<typeof app>('http://test')
const fetchVia = {
  fetch: (input: RequestInfo | URL, init?: RequestInit) => app.request(input, init),
}

describe('unwrap', () => {
  it('returns the success body, typed', async () => {
    const body = await unwrap(api.api.ok.$get(undefined, fetchVia))
    expect(body.hello).toBe('world')
  })
  it('throws ApiError with status and body', async () => {
    const err = await unwrap(api.api.missing.$get(undefined, fetchVia)).catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(404)
    expect(err.body).toEqual({ error: 'not_found' })
  })
})
